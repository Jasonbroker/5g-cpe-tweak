//! 短信处理

use axum::{Json};
use serde::{Deserialize, Serialize};
use crate::models::SmsMessage;
use crate::response::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct SendSmsRequest {
    pub to: String,
    pub body: String,
}

#[derive(Debug, Serialize)]
pub struct SmsListResponse {
    pub messages: Vec<SmsMessage>,
}

/// 获取短信列表
pub async fn get_sms_list() -> Json<ApiResponse<SmsListResponse>> {
    // TODO: 从 oFono 获取真实短信
    Json(ApiResponse::ok_with_data("SMS list retrieved", SmsListResponse {
        messages: vec![],
    }))
}

/// 发送短信
pub async fn send_sms(Json(req): Json<SendSmsRequest>) -> Json<ApiResponse<SmsMessage>> {
    // TODO: 通过 oFono 发送短信
    Json(ApiResponse::ok_with_data("SMS sent", SmsMessage {
        index: 0,
        from: req.to,
        to: req.to,
        body: req.body,
        timestamp: "2024-01-01T00:00:00".to_string(),
        read: false,
    }))
}

/// 删除短信
pub async fn delete_sms() -> Json<ApiResponse<()>> {
    // TODO: 通过 oFono 删除短信
    Json(ApiResponse::ok("SMS deleted"))
}
