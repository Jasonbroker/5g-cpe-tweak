//! 网络状态处理

use axum::Json;
use crate::models::{NetworkStatus, SignalStrength, CellTower, CellInfo};
use crate::response::ApiResponse;

/// 获取网络注册状态
pub async fn get_network_status() -> Json<ApiResponse<NetworkStatus>> {
    // TODO: 从 oFono 获取真实数据
    Json(ApiResponse::ok_with_data("Network status retrieved", NetworkStatus {
        registered: true,
        status: "home".to_string(),
        operator: Some("CHINA MOBILE".to_string()),
        operator_code: Some("46000".to_string()),
        technology: Some("LTE".to_string()),
    }))
}

/// 获取信号强度
pub async fn get_signal_strength() -> Json<ApiResponse<SignalStrength>> {
    // TODO: 从 oFono 获取真实数据
    Json(ApiResponse::ok_with_data("Signal strength retrieved", SignalStrength {
        rssi: -65,
        rsrp: Some(-85),
        rsrq: Some(-10),
        sinr: Some(15),
        level: 4,
    }))
}

/// 获取小区信息
pub async fn get_cells() -> Json<ApiResponse<CellTower>> {
    // TODO: 从 oFono/NetworkMonitor 获取真实数据
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
