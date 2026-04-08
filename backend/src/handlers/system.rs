//! 系统处理 - 重启

use axum::Json;
use std::process::Command;
use crate::response::ApiResponse;

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
