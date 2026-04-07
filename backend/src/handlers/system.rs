//! 系统处理 - 重启、OTA更新

use axum::Json;
use serde::{Deserialize, Serialize};
use std::process::Command;
use crate::response::ApiResponse;

#[derive(Debug, Serialize)]
pub struct OtaStatus {
    pub current_version: String,
    pub latest_version: Option<String>,
    pub update_available: bool,
}

/// 获取 OTA 状态
pub async fn get_ota_status() -> Json<ApiResponse<OtaStatus>> {
    Json(ApiResponse::ok_with_data("OTA status retrieved", OtaStatus {
        current_version: env!("CARGO_PKG_VERSION").to_string(),
        latest_version: None,
        update_available: false,
    }))
}

#[derive(Debug, Deserialize)]
pub struct OtaUploadRequest {
    pub url: String,
}

/// 上传 OTA 包
pub async fn ota_upload(Json(req): Json<OtaUploadRequest>) -> Json<ApiResponse<()>> {
    // TODO: 实现 OTA 包下载和验证
    Json(ApiResponse::ok("OTA package uploaded"))
}

#[derive(Debug, Deserialize)]
pub struct OtaApplyRequest {
    pub file_path: String,
}

/// 应用 OTA 更新
pub async fn ota_apply(Json(req): Json<OtaApplyRequest>) -> Json<ApiResponse<()>> {
    // TODO: 实现 OTA 应用
    // 这是一个危险操作，需要验证包签名等
    Json(ApiResponse::ok("OTA update applied, rebooting..."))
}

/// 取消 OTA 更新
pub async fn ota_cancel() -> Json<ApiResponse<()>> {
    // TODO: 取消正在进行的 OTA 更新
    Json(ApiResponse::ok("OTA update cancelled"))
}

/// 重启设备
pub async fn reboot() -> Json<ApiResponse<()>> {
    tracing::info!("Reboot requested");
    
    // 注意：这会在设备上执行重启
    // 在生产环境中应该有适当的确认机制
    tokio::spawn(async {
        // 延迟重启，让响应能够发送
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
        if let Err(e) = Command::new("reboot").spawn() {
            tracing::error!("Failed to reboot: {}", e);
        }
    });
    
    Json(ApiResponse::ok("Rebooting..."))
}
