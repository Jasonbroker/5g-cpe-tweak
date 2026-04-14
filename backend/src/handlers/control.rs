//! 控制接口处理 - Modem 控制、频段锁定、小区锁定

use axum::{Json, extract::State};
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use crate::response::ApiResponse;

#[derive(Debug, Serialize)]
pub struct DataStatus {
    pub enabled: bool,
}

#[derive(Debug, Deserialize)]
pub struct DataRequest {
    pub enabled: bool,
}

#[derive(Debug, Serialize)]
pub struct AirplaneStatus {
    pub enabled: bool,
}

#[derive(Debug, Deserialize)]
pub struct AirplaneRequest {
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BandLockConfig {
    pub enabled: bool,
    pub bands: Vec<String>,  // e.g., ["B1", "B3", "N78"]
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CellLockConfig {
    pub enabled: bool,
    pub pci: Option<i32>,   // Physical Cell ID
    pub earfcn: Option<i32>, // EARFCN
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RadioModeConfig {
    pub mode: String,  // "4G", "5G", "Auto"
}

/// 获取数据连接状态
pub async fn get_data() -> Json<ApiResponse<DataStatus>> {
    // TODO: 从 oFono 获取真实状态
    Json(ApiResponse::ok_with_data("Data status retrieved", DataStatus {
        enabled: true,
    }))
}

/// 设置数据连接状态
pub async fn set_data(Json(req): Json<DataRequest>) -> Json<ApiResponse<DataStatus>> {
    // TODO: 通过 oFono/AT 指令设置
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
pub async fn set_airplane(Json(req): Json<AirplaneRequest>) -> Json<ApiResponse<AirplaneStatus>> {
    // TODO: 通过 oFono/AT 指令设置飞行模式
    Json(ApiResponse::ok_with_data("Airplane mode updated", AirplaneStatus {
        enabled: req.enabled,
    }))
}

/// 获取射频模式
pub async fn get_radio_mode() -> Json<ApiResponse<RadioModeConfig>> {
    // TODO: 从 oFono/RadioSettings 获取
    Json(ApiResponse::ok_with_data("Radio mode retrieved", RadioModeConfig {
        mode: "Auto".to_string(),
    }))
}

/// 设置射频模式
pub async fn set_radio_mode(Json(req): Json<RadioModeConfig>) -> Json<ApiResponse<RadioModeConfig>> {
    // TODO: 通过 oFono/AT 指令设置
    // AT+CFUN=1  - 全功能
    // AT+CFUN=4  - 飞行模式
    // AT+CNTI=0  - LTE only
    // AT+CNTI=1  - 5G only
    // AT+CNTI=2  - LTE+5G Auto
    Json(ApiResponse::ok_with_data("Radio mode updated", RadioModeConfig {
        mode: req.mode,
    }))
}

/// 获取频段锁定配置
pub async fn get_band_lock() -> Json<ApiResponse<BandLockConfig>> {
    // TODO: 从 oFono/AT 指令获取当前频段锁定状态
    // AT+SPLBAND=0 查询 LTE 频段
    // AT+SPLBAND=3 查询 NR 频段
    Json(ApiResponse::ok_with_data("Band lock retrieved", BandLockConfig {
        enabled: false,
        bands: vec![],
    }))
}

/// 设置频段锁定
pub async fn set_band_lock(Json(req): Json<BandLockConfig>) -> Json<ApiResponse<BandLockConfig>> {
    // TODO: 通过 AT 指令设置
    // AT+SPLBAND=1,0,0,0,0,5,0 锁定 LTE B1+B3
    // AT+SPLBAND=2,0,0,256,0    锁定 NR N78
    // AT+SPLBAND=1,0,0,0,0,0,0  解锁所有 LTE
    // AT+SPLBAND=2,0,0,0,0      解锁所有 NR
    Json(ApiResponse::ok_with_data("Band lock updated", BandLockConfig {
        enabled: req.enabled,
        bands: req.bands,
    }))
}

/// 获取小区锁定配置
pub async fn get_cell_lock() -> Json<ApiResponse<CellLockConfig>> {
    // TODO: 获取小区锁定状态
    Json(ApiResponse::ok_with_data("Cell lock retrieved", CellLockConfig {
        enabled: false,
        pci: None,
        earfcn: None,
    }))
}

/// 设置小区锁定
pub async fn set_cell_lock(Json(req): Json<CellLockConfig>) -> Json<ApiResponse<CellLockConfig>> {
    // TODO: 通过 AT 指令设置小区锁定
    Json(ApiResponse::ok_with_data("Cell lock updated", CellLockConfig {
        enabled: req.enabled,
        pci: req.pci,
        earfcn: req.earfcn,
    }))
}
