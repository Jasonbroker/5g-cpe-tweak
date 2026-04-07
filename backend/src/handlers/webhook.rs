//! Webhook 处理 - 短信转发

use axum::{Json, extract::State};
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use crate::response::ApiResponse;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebhookConfig {
    pub url: String,
    pub enabled: bool,
}

/// Webhook 状态
pub struct WebhookState {
    pub config: Option<WebhookConfig>,
}

impl WebhookState {
    pub fn new() -> Self {
        Self { config: None }
    }
}

pub type WebhookStateRef = Arc<RwLock<WebhookState>>;

/// 获取 Webhook 配置
pub async fn get_webhook(
    State(state): State<WebhookStateRef>,
) -> Json<ApiResponse<Option<WebhookConfig>>> {
    let state = state.read().await;
    Json(ApiResponse::ok_with_data("Webhook config retrieved", state.config.clone()))
}

#[derive(Debug, Deserialize)]
pub struct SetWebhookRequest {
    pub url: String,
    pub enabled: bool,
}

/// 设置 Webhook 配置
pub async fn set_webhook(
    State(state): State<WebhookStateRef>,
    Json(req): Json<SetWebhookRequest>,
) -> Json<ApiResponse<WebhookConfig>> {
    let config = WebhookConfig {
        url: req.url,
        enabled: req.enabled,
    };
    
    let mut state = state.write().await;
    state.config = Some(config.clone());
    
    Json(ApiResponse::ok_with_data("Webhook config updated", config))
}

#[derive(Debug, Deserialize)]
pub struct TestWebhookRequest {
    pub url: String,
}

/// 测试 Webhook
pub async fn test_webhook(Json(req): Json<TestWebhookRequest>) -> Json<ApiResponse<()>> {
    // 发送测试请求
    let client = reqwest::Client::new();
    match client.post(&req.url)
        .json(&serde_json::json!({
            "type": "test",
            "message": "CPE Ctrl Webhook Test"
        }))
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
    {
        Ok(resp) if resp.status().is_success() => {
            Json(ApiResponse::ok("Webhook test successful"))
        }
        Ok(resp) => {
            Json(ApiResponse::error(format!("Webhook test failed: HTTP {}", resp.status())))
        }
        Err(e) => {
            Json(ApiResponse::error(format!("Webhook test failed: {}", e)))
        }
    }
}
