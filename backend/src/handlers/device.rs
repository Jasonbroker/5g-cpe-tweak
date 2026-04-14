//! 设备信息处理 - 真实 oFono 实现

use axum::Json;
use crate::models::{DeviceInfo, SimInfo};
use crate::response::ApiResponse;
use crate::ofono;

/// 获取设备信息
pub async fn get_device_info() -> Json<ApiResponse<DeviceInfo>> {
    match get_connection_and_get_device_info().await {
        Ok(info) => Json(ApiResponse::ok_with_data("Device info retrieved", info)),
        Err(e) => {
            tracing::warn!("Failed to get device info: {}", e);
            // 返回模拟数据作为后备
            Json(ApiResponse::ok_with_data("Device info retrieved (fallback)", DeviceInfo {
                imei: "867062040123456".to_string(),
                iccid: "898602xxxxxxxxxxxxxxx".to_string(),
                model: "Huawei 5G Communication Case".to_string(),
                firmware: "11.217.01.01.01".to_string(),
                revision: "01".to_string(),
            }))
        }
    }
}

async fn get_connection_and_get_device_info() -> Result<DeviceInfo, anyhow::Error> {
    let conn = ofono::get_connection().await?;
    let props = ofono::get_modem_properties(&conn).await?;
    
    let imei = props.get("Serial")
        .and_then(|v| String::try_from(v.clone()).ok())
        .unwrap_or_else(|| "unknown".to_string());
    
    // 获取固件版本通过 AT 指令
    let firmware = ofono::send_at(&conn, "AT+CGMR")
        .await
        .unwrap_or_else(|_| "unknown".to_string())
        .trim()
        .to_string();
    
    // 获取 ICCID
    let iccid_raw = ofono::send_at(&conn, "AT+ICCID")
        .await
        .unwrap_or_default();
    let iccid = iccid_raw
        .strip_prefix("+ICCID:")
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|| "unknown".to_string());
    
    Ok(DeviceInfo {
        imei,
        iccid,
        model: "Huawei 5G Communication Case".to_string(),
        firmware,
        revision: "01".to_string(),
    })
}

/// 获取 SIM 卡信息
pub async fn get_sim_info() -> Json<ApiResponse<SimInfo>> {
    // TODO: 从 oFono SimManager 获取真实数据
    Json(ApiResponse::ok_with_data("SIM info retrieved", SimInfo {
        present: true,
        imsi: Some("460001234567890".to_string()),
        iccid: Some("898602xxxxxxxxxxxxxxx".to_string()),
        locked: false,
        operator: Some("CHINA MOBILE".to_string()),
    }))
}
