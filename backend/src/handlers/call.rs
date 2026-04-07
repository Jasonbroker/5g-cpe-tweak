//! 通话处理 - 真实 oFono 实现

use axum::{Json};
use serde::{Deserialize, Serialize};
use crate::models::CallRecord;
use crate::response::ApiResponse;
use crate::ofono;

#[derive(Debug, Serialize)]
pub struct CallListResponse {
    pub calls: Vec<CallRecord>,
}

/// 获取当前通话列表
pub async fn get_call_list() -> Json<ApiResponse<CallListResponse>> {
    match get_real_call_list().await {
        Ok(calls) => Json(ApiResponse::ok_with_data("Call list retrieved", CallListResponse { calls })),
        Err(e) => {
            tracing::warn!("Failed to get call list: {}", e);
            Json(ApiResponse::ok_with_data("Call list retrieved (fallback)", CallListResponse { calls: vec![] }))
        }
    }
}

async fn get_real_call_list() -> Result<Vec<CallRecord>, anyhow::Error> {
    let conn = ofono::get_connection().await?;
    let calls = ofono::get_calls(&conn).await?;
    
    let result: Vec<CallRecord> = calls
        .into_iter()
        .enumerate()
        .map(|(idx, call)| CallRecord {
            id: idx as i32,
            direction: if call.incoming { "incoming".to_string() } else { "outgoing".to_string() },
            number: call.line_id,
            duration: 0,
            timestamp: chrono::Utc::now().to_rfc3339(),
        })
        .collect();
    
    Ok(result)
}

#[derive(Debug, Deserialize)]
pub struct DialRequest {
    pub number: String,
}

/// 拨号
pub async fn dial(Json(req): Json<DialRequest>) -> Json<ApiResponse<()>> {
    match dial_number(&req.number).await {
        Ok(_) => Json(ApiResponse::ok("Dialing...")),
        Err(e) => {
            tracing::warn!("Failed to dial: {}", e);
            Json(ApiResponse::error(format!("Failed to dial: {}", e)))
        }
    }
}

async fn dial_number(number: &str) -> Result<(), anyhow::Error> {
    let conn = ofono::get_connection().await?;
    ofono::dial(&conn, number).await?;
    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct HangupRequest {
    pub path: String,
}

/// 挂断通话
pub async fn hangup(Json(req): Json<HangupRequest>) -> Json<ApiResponse<()>> {
    match hangup_call(&req.path).await {
        Ok(_) => Json(ApiResponse::ok("Hangup")),
        Err(e) => {
            tracing::warn!("Failed to hangup: {}", e);
            Json(ApiResponse::error(format!("Failed to hangup: {}", e)))
        }
    }
}

async fn hangup_call(path: &str) -> Result<(), anyhow::Error> {
    let conn = ofono::get_connection().await?;
    ofono::hangup(&conn, path).await?;
    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct AnswerRequest {
    pub path: String,
}

/// 接听来电
pub async fn answer(Json(req): Json<AnswerRequest>) -> Json<ApiResponse<()>> {
    match answer_call(&req.path).await {
        Ok(_) => Json(ApiResponse::ok("Answered")),
        Err(e) => {
            tracing::warn!("Failed to answer: {}", e);
            Json(ApiResponse::error(format!("Failed to answer: {}", e)))
        }
    }
}

async fn answer_call(path: &str) -> Result<(), anyhow::Error> {
    let conn = ofono::get_connection().await?;
    ofono::answer(&conn, path).await?;
    Ok(())
}
