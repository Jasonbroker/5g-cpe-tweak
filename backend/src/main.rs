//! CPE Ctrl - 5G CPE Management System
//!
//! Backend service for Huawei 5G Communication Case (UDX710 platform)
//! Built with Rust + Axum + zbus

use axum::{
    routing::{get, post},
    Router,
    response::Response,
    http::{StatusCode, Uri, HeaderMap, header::CONTENT_TYPE},
    extract::Extension,
    Json,
};
use axum::body::Body;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use tower_http::cors::{CorsLayer, Any};
use tracing::{info, Level};
use tracing_subscriber::fmt::format::FmtSpan;
use clap::Parser;
use tokio::sync::RwLock;

#[derive(Parser, Debug)]
#[command(name = "cpe-ctrl")]
#[command(author, version)]
struct Args {
    /// 监听端口
    #[arg(short, long, default_value = "8080")]
    port: u16,

    /// 监听地址
    #[arg(short = 'H', long, default_value = "0.0.0.0")]
    host: String,

    /// 开发模式：使用外部 www 目录
    #[arg(long)]
    static_dir: bool,

    /// 静态文件目录路径（默认：可执行文件同级 www/）
    #[arg(long)]
    static_path: Option<PathBuf>,
}

mod handlers;
mod models;
mod response;
mod ofono;

use response::ApiResponse;
use handlers::at::AtHistory;
use handlers::webhook::WebhookState;
use handlers::AppState;

/// 获取 www 目录路径
fn get_www_dir() -> PathBuf {
    let exe_path = std::env::current_exe().expect("Failed to get executable path");
    let exe_dir = exe_path.parent().expect("Failed to get executable directory");
    exe_dir.join("www")
}

/// SPA fallback handler
async fn spa_fallback(uri: Uri, _headers: HeaderMap) -> Response<Body> {
    let path = uri.path();
    
    // API 路由返回 404
    if path.starts_with("/api/") {
        let body = serde_json::to_string(&ApiResponse::<()>::error("API endpoint not found")).unwrap();
        return Response::builder()
            .status(StatusCode::NOT_FOUND)
            .header(CONTENT_TYPE, "application/json")
            .body(axum::body::Body::from(body))
            .unwrap();
    }
    
    // 获取 www 目录
    let www_dir = if let Some(custom_path) = std::env::var_os("CPE_CTRL_STATIC_PATH") {
        PathBuf::from(custom_path)
    } else {
        get_www_dir()
    };
    
    // 尝试读取请求的文件
    let requested_path = if path == "/" { "/index.html" } else { path };
    let file_path = www_dir.join(requested_path.trim_start_matches('/'));
    
    if let Ok(content) = tokio::fs::read(&file_path).await {
        let content_type = match file_path.extension().and_then(|e| e.to_str()) {
            Some("html") => "text/html; charset=utf-8",
            Some("css") => "text/css; charset=utf-8",
            Some("js") => "application/javascript; charset=utf-8",
            Some("json") => "application/json",
            Some("png") => "image/png",
            Some("jpg") | Some("jpeg") => "image/jpeg",
            Some("gif") => "image/gif",
            Some("svg") => "image/svg+xml",
            Some("ico") => "image/x-icon",
            _ => "application/octet-stream",
        };
        
        return Response::builder()
            .status(StatusCode::OK)
            .header(CONTENT_TYPE, content_type)
            .body(axum::body::Body::from(content))
            .unwrap();
    }
    
    // 文件不存在，返回 index.html (SPA)
    let index_path = www_dir.join("index.html");
    match tokio::fs::read(&index_path).await {
        Ok(content) => Response::builder()
            .status(StatusCode::OK)
            .header(CONTENT_TYPE, "text/html; charset=utf-8")
            .body(axum::body::Body::from(content))
            .unwrap(),
        Err(_) => Response::builder()
            .status(StatusCode::NOT_FOUND)
            .header(CONTENT_TYPE, "text/plain")
            .body(axum::body::Body::from(format!("index.html not found at {:?}. Please build the frontend first.", index_path)))
            .unwrap(),
    }
}

/// 健康检查
async fn health() -> Json<ApiResponse<&'static str>> {
    Json(ApiResponse::ok("OK"))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 初始化日志
    tracing_subscriber::fmt()
        .with_max_level(Level::INFO)
        .with_span_events(FmtSpan::CLOSE)
        .init();
    
    // 解析命令行参数
    let args = Args::parse();
    let bind_addr: SocketAddr = format!("{}:{}", args.host, args.port).parse()?;
    info!("CPE Ctrl starting on {}", bind_addr);
    
    // 创建共享状态
    let at_history = Arc::new(RwLock::new(AtHistory::new()));
    let webhook_state = Arc::new(RwLock::new(WebhookState::new()));
    let app_state = AppState::new(at_history.clone(), webhook_state.clone());
    
    // 构建路由 - 使用 Extension 注入状态
    let app = Router::new()
        .layer(Extension(app_state))
        // 健康检查
        .route("/api/health", get(health))
        // AT 指令
        .route("/api/at/send", post(handlers::at::send_at))
        .route("/api/at/history", get(handlers::at::get_at_history))
        // 设备
        .route("/api/device/info", get(handlers::device::get_device_info))
        .route("/api/device/sim", get(handlers::device::get_sim_info))
        // 网络
        .route("/api/network/status", get(handlers::network::get_network_status))
        .route("/api/network/signal", get(handlers::network::get_signal_strength))
        .route("/api/network/cells", get(handlers::network::get_cells))
        // 控制
        .route("/api/control/data", get(handlers::control::get_data).post(handlers::control::set_data))
        .route("/api/control/airplane", get(handlers::control::get_airplane).post(handlers::control::set_airplane))
        .route("/api/control/radio", get(handlers::control::get_radio_mode).post(handlers::control::set_radio_mode))
        .route("/api/control/band-lock", get(handlers::control::get_band_lock).post(handlers::control::set_band_lock))
        .route("/api/control/cell-lock", get(handlers::control::get_cell_lock).post(handlers::control::set_cell_lock))
        // 流量
        .route("/api/traffic/stats", get(handlers::traffic::get_traffic_stats))
        .route("/api/traffic/limit", get(handlers::traffic::get_traffic_limit).post(handlers::traffic::set_traffic_limit))
        // 短信
        .route("/api/sms/list", get(handlers::sms::get_sms_list))
        .route("/api/sms/send", post(handlers::sms::send_sms))
        .route("/api/sms/delete", post(handlers::sms::delete_sms))
        // 通话
        .route("/api/call/list", get(handlers::call::get_call_list))
        .route("/api/call/dial", post(handlers::call::dial))
        .route("/api/call/hangup", post(handlers::call::hangup))
        .route("/api/call/answer", post(handlers::call::answer))
        // Webhook
        .route("/api/webhook", get(handlers::webhook::get_webhook).post(handlers::webhook::set_webhook))
        .route("/api/webhook/test", post(handlers::webhook::test_webhook))
        // 系统

        .route("/api/system/reboot", post(handlers::system::reboot))
        // CORS
        .layer(CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any))
        // 静态文件服务或 SPA fallback
        .fallback(spa_fallback);
    
    // 启动服务
    let listener = tokio::net::TcpListener::bind(bind_addr).await?;
    info!("CPE Ctrl listening on {}", bind_addr);
    
    axum::serve(listener, Router::into_make_service(app)).await?;
    
    Ok(())
}