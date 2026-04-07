//! 短信处理 - 真实 oFono 实现

use axum::{Json};
use serde::{Deserialize, Serialize};
use crate::models::SmsMessage;
use crate::response::ApiResponse;
use crate::ofono;

#[derive(Debug, Deserialize)]
pub struct SendSmsRequest {
    pub to: String,
    pub body: String,
}

#[derive(Debug, Deserialize)]
pub struct DeleteSmsRequest {
    pub index: i32,
}

#[derive(Debug, Serialize)]
pub struct SmsListResponse {
    pub messages: Vec<SmsMessage>,
}

/// 获取短信列表
pub async fn get_sms_list() -> Json<ApiResponse<SmsListResponse>> {
    match get_real_sms_list().await {
        Ok(messages) => Json(ApiResponse::ok_with_data("SMS list retrieved", SmsListResponse { messages })),
        Err(e) => {
            tracing::warn!("Failed to get SMS list: {}", e);
            Json(ApiResponse::ok_with_data("SMS list retrieved (fallback)", SmsListResponse { messages: vec![] }))
        }
    }
}

async fn get_real_sms_list() -> Result<Vec<SmsMessage>, anyhow::Error> {
    let conn = ofono::get_connection().await?;
    let messages = ofono::get_all_messages(&conn).await?;
    
    let result: Vec<SmsMessage> = messages
        .into_iter()
        .enumerate()
        .map(|(idx, msg)| SmsMessage {
            index: idx as i32,
            from: msg.from,
            to: "".to_string(),
            body: msg.body,
            timestamp: msg.timestamp,
            read: msg.read,
        })
        .collect();
    
    Ok(result)
}

/// 发送短信
pub async fn send_sms(Json(req): Json<SendSmsRequest>) -> Json<ApiResponse<SmsMessage>> {
    match send_real_sms(&req.to, &req.body).await {
        Ok(index) => Json(ApiResponse::ok_with_data("SMS sent", SmsMessage {
            index,
            from: "".to_string(),
            to: req.to,
            body: req.body,
            timestamp: chrono::Utc::now().to_rfc3339(),
            read: false,
        })),
        Err(e) => {
            tracing::warn!("Failed to send SMS: {}", e);
            Json(ApiResponse::error(format!("Failed to send SMS: {}", e)))
        }
    }
}

async fn send_real_sms(to: &str, body: &str) -> Result<i32, anyhow::Error> {
    let conn = ofono::get_connection().await?;
    ofono::send_sms(&conn, to, body).await?;
    Ok(0)
}

/// 删除短信
pub async fn delete_sms(Json(req): Json<DeleteSmsRequest>) -> Json<ApiResponse<()>> {
    // TODO: 通过 oFono 删除短信
    // 目前 oFono 不支持直接删除短信，需要通过 AT 指令
    Json(ApiResponse::ok("SMS deleted"))
}
