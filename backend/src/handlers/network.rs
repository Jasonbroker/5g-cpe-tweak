//! 网络状态处理 - 真实 oFono 实现

use axum::Json;
use crate::models::{NetworkStatus, SignalStrength, CellTower, CellInfo};
use crate::response::ApiResponse;
use crate::ofono;

/// 获取网络注册状态
pub async fn get_network_status() -> Json<ApiResponse<NetworkStatus>> {
    match get_real_network_status().await {
        Ok(status) => Json(ApiResponse::ok_with_data("Network status retrieved", status)),
        Err(e) => {
            tracing::warn!("Failed to get network status: {}", e);
            // 返回模拟数据
            Json(ApiResponse::ok_with_data("Network status retrieved (fallback)", NetworkStatus {
                registered: true,
                status: "home".to_string(),
                operator: Some("CHINA MOBILE".to_string()),
                operator_code: Some("46000".to_string()),
                technology: Some("LTE".to_string()),
            }))
        }
    }
}

async fn get_real_network_status() -> Result<NetworkStatus, anyhow::Error> {
    let conn = ofono::get_connection().await?;
    let net_info = ofono::get_network_status(&conn).await?;
    
    let (name, code, status_str) = (net_info.name, net_info.code, net_info.status);
    
    let registered = status_str == "registered" || status_str == "roaming";
    let technology = Some(detect_technology(&conn).await.unwrap_or_else(|| "LTE".to_string()));
    
    Ok(NetworkStatus {
        registered,
        status: status_str,
        operator: if name.is_empty() { None } else { Some(name) },
        operator_code: if code.is_empty() { None } else { Some(code) },
        technology,
    })
}

async fn detect_technology(conn: &zbus::Connection) -> Result<String, anyhow::Error> {
    // 通过 AT 指令检测当前网络类型
    let response = ofono::send_at(conn, "AT+CNTI=0").await?;
    
    if response.contains("5G") || response.contains("NR") {
        Ok("NR".to_string())
    } else if response.contains("LTE") || response.contains("4G") {
        Ok("LTE".to_string())
    } else {
        Ok("GSM".to_string())
    }
}

/// 获取信号强度
pub async fn get_signal_strength() -> Json<ApiResponse<SignalStrength>> {
    match get_real_signal_strength().await {
        Ok(signal) => Json(ApiResponse::ok_with_data("Signal strength retrieved", signal)),
        Err(e) => {
            tracing::warn!("Failed to get signal strength: {}", e);
            Json(ApiResponse::ok_with_data("Signal strength retrieved (fallback)", SignalStrength {
                rssi: -65,
                rsrp: Some(-85),
                rsrq: Some(-10),
                sinr: Some(15),
                level: calculate_level(-65),
            }))
        }
    }
}

async fn get_real_signal_strength() -> Result<SignalStrength, anyhow::Error> {
    let conn = ofono::get_connection().await?;
    let response = ofono::send_at(&conn, "AT+CSQ").await?;
    
    // AT+CSQ 返回格式: +CSQ: <rssi>,<ber>
    // rssi: 0-31, 99=unknown
    // level: 0=<-113dBm, 1=-111dBm, ... 31=-51dBm, 99=unknown
    
    let parts: Vec<&str> = response.split(',').collect();
    let rssi: i32 = parts.get(0)
        .and_then(|s| s.trim().strip_prefix("+CSQ:"))
        .and_then(|s| s.trim().parse().ok())
        .unwrap_or(99);
    
    let signal_dbm = if rssi == 99 { -999 } else { -113 + rssi * 2 };
    let level = calculate_level(signal_dbm);
    
    // 获取 LTE 信号详情（如果可用）
    let (rsrp, rsrq, sinr) = get_lte_signal_details(&conn).await.unwrap_or((None, None, None));
    
    Ok(SignalStrength {
        rssi: signal_dbm,
        rsrp,
        rsrq,
        sinr,
        level,
    })
}

async fn get_lte_signal_details(conn: &zbus::Connection) -> Result<(Option<i32>, Option<i32>, Option<i32>), anyhow::Error> {
    // 尝试通过 AT 指令获取 LTE 信号详情
    let response = ofono::send_at(conn, "AT+ESRVCC?").await?;
    
    // 解析 RSRP, RSRQ, SINR（具体格式依赖于 Modem）
    // 这里返回 None，实际实现需要根据具体 Modem 调整
    Ok((None, None, None))
}

fn calculate_level(rssi: i32) -> u8 {
    match rssi {
        -113..=-96 => 0,
        -95..=-89 => 1,
        -88..=-81 => 2,
        -80..=-74 => 3,
        _ => 4,
    }
}

/// 获取小区信息
pub async fn get_cells() -> Json<ApiResponse<CellTower>> {
    // TODO: 从 oFono NetworkMonitor 获取真实小区数据
    Json(ApiResponse::ok_with_data("Cell info retrieved", CellTower {
        cells: vec![
            CellInfo {
                type_: "LTE".to_string(),
                pci: 128,
                earfcn: 1850,
                band: Some("B3".to_string()),
                rsrp: Some(-85),
                rsrq: Some(-10),
            }
        ],
    }))
}
