//! 设备信息处理

use axum::Json;
use crate::models::{DeviceInfo, SimInfo};
use crate::response::ApiResponse;

/// 获取设备信息
pub async fn get_device_info() -> Json<ApiResponse<DeviceInfo>> {
    // TODO: 从 oFono 获取真实数据
    Json(ApiResponse::ok_with_data("Device info retrieved", DeviceInfo {
        imei: "867062040123456".to_string(),
        iccid: "898602xxxxxxxxxxxxxxx".to_string(),
        model: "Huawei 5G Communication Case".to_string(),
        firmware: "11.217.01.01.01".to_string(),
        revision: "01".to_string(),
    }))
}

/// 获取 SIM 卡信息
pub async fn get_sim_info() -> Json<ApiResponse<SimInfo>> {
    // TODO: 从 oFono 获取真实数据
    Json(ApiResponse::ok_with_data("SIM info retrieved", SimInfo {
        present: true,
        imsi: Some("460001234567890".to_string()),
        iccid: Some("898602xxxxxxxxxxxxxxx".to_string()),
        locked: false,
        operator: Some("CHINA MOBILE".to_string()),
    }))
}
