//! 通话处理

use axum::{Json};
use serde::{Deserialize, Serialize};
use crate::models::CallRecord;
use crate::response::ApiResponse;

#[derive(Debug, Serialize)]
pub struct CallListResponse {
    pub calls: Vec<CallRecord>,
}

/// 获取当前通话列表
pub async fn get_call_list() -> Json<ApiResponse<CallListResponse>> {
    // TODO: 从 oFono 获取真实通话
    Json(ApiResponse::ok_with_data("Call list retrieved", CallListResponse {
        calls: vec![],
    }))
}

#[derive(Debug, Deserialize)]
pub struct DialRequest {
    pub number: String,
}

/// 拨号
pub async fn dial(Json(req): Json<DialRequest>) -> Json<ApiResponse<()>> {
    // TODO: 通过 oFono 拨号
    Json(ApiResponse::ok("Dialing..."))
}

#[derive(Debug, Deserialize)]
pub struct HangupRequest {
    pub path: String,
}

/// 挂断通话
pub async fn hangup(Json(req): Json<HangupRequest>) -> Json<ApiResponse<()>> {
    // TODO: 通过 oFono 挂断
    Json(ApiResponse::ok("Hangup"))
}

#[derive(Debug, Deserialize)]
pub struct AnswerRequest {
    pub path: String,
}

/// 接听来电
pub async fn answer(Json(req): Json<AnswerRequest>) -> Json<ApiResponse<()>> {
    // TODO: 通过 oFono 接听
    Json(ApiResponse::ok("Answered"))
}
