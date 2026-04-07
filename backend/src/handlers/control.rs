//! 控制接口处理

use axum::{Json, extract::Query};
use serde::{Deserialize, Serialize};
use crate::response::ApiResponse;

#[derive(Debug, Serialize)]
pub struct DataStatus {
    pub enabled: bool,
}

#[derive(Debug, Serialize)]
pub struct AirplaneStatus {
    pub enabled: bool,
}

/// 获取数据连接状态
pub async fn get_data() -> Json<ApiResponse<DataStatus>> {
    // TODO: 从 oFono 获取真实状态
    Json(ApiResponse::ok_with_data("Data status retrieved", DataStatus {
        enabled: true,
    }))
}

/// 设置数据连接状态
pub async fn set_data(Json(req): Json<DataStatus>) -> Json<ApiResponse<DataStatus>> {
    // TODO: 通过 oFono 设置数据连接
    Json(ApiResponse::ok_with_data("Data status updated", DataStatus {
        enabled: req.enabled,
    }))
}

/// 获取飞行模式状态
pub async fn get_airplane() -> Json<ApiResponse<AirplaneStatus>> {
    // TODO: 从 oFono 获取真实状态
    Json(ApiResponse::ok_with_data("Airplane mode status retrieved", AirplaneStatus {
        enabled: false,
    }))
}

/// 设置飞行模式状态
pub async fn set_airplane(Json(req): Json<AirplaneStatus>) -> Json<ApiResponse<AirplaneStatus>> {
    // TODO: 通过 oFono 设置飞行模式
    Json(ApiResponse::ok_with_data("Airplane mode updated", AirplaneStatus {
        enabled: req.enabled,
    }))
}
