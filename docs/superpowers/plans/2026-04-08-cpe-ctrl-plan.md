# CPE Ctrl 实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为华为5G通讯壳（UDX710平台）构建完整的后台管理系统

**Architecture:** 
- 后端：Rust + Axum + zbus，单二进制 + www/ 静态目录
- 前端：React + TypeScript + Vite
- 通信：D-Bus → oFono，通过 AT 指令控制 Modem
- 部署：ADB 调试部署 + OTA 生产部署

**Tech Stack:** Rust, Axum, zbus, tokio, tower-http, React, TypeScript, Vite

---

## 项目结构

```
cpe-ctrl/
├── backend/
│   ├── src/
│   │   ├── main.rs              # HTTP server + SPA fallback + CLI
│   │   ├── handlers/            # API handlers
│   │   │   ├── mod.rs
│   │   │   ├── device.rs
│   │   │   ├── network.rs
│   │   │   ├── control.rs
│   │   │   ├── traffic.rs
│   │   │   ├── sms.rs
│   │   │   ├── call.rs
│   │   │   ├── at.rs
│   │   │   └── system.rs
│   │   ├── ofono/               # oFono D-Bus 封装
│   │   │   ├── mod.rs
│   │   │   ├── modem.rs
│   │   │   ├── network.rs
│   │   │   ├── sms.rs
│   │   │   └── call.rs
│   │   ├── models.rs            # 数据模型
│   │   ├── response.rs          # 统一响应
│   │   └── static.rs            # 静态文件服务
│   └── Cargo.toml
├── web/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── utils/
│   └── package.json
├── scripts/
│   └── build.sh
└── docs/
```

---

## Phase 1: 后端核心（AT指令 + 设备/网络API）

### Task 1: 项目初始化

**Files:**
- Create: `backend/Cargo.toml`
- Create: `backend/src/main.rs`
- Create: `backend/src/models.rs`
- Create: `backend/src/response.rs`

- [ ] **Step 1: 创建 Cargo.toml**

```toml
[package]
name = "cpe-ctrl"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "fs"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
anyhow = "1"
tracing = "0.1"
tracing-subscriber = "0.3"
clap = { version = "4", features = ["derive"] }
zbus = "2"
```

- [ ] **Step 2: 创建 main.rs 框架**

```rust
use axum::{Router, routing::get, http::StatusCode};
use tower_http::cors::{CorsLayer, Any};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .init();
    
    let app = Router::new()
        .route("/api/health", get(health))
        .layer(CorsLayer::new().allow_origin(Any));
    
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health() -> (StatusCode, &'static str) {
    (StatusCode::OK, "OK")
}
```

- [ ] **Step 3: 验证编译**

Run: `cd backend && cargo check`
Expected: 编译通过

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: initial project structure"
```

---

### Task 2: oFono D-Bus 封装

**Files:**
- Create: `backend/src/ofono/mod.rs`
- Create: `backend/src/ofono/modem.rs`
- Create: `backend/src/ofono/network.rs`
- Create: `backend/src/ofono/sms.rs`
- Create: `backend/src/ofono/call.rs`

- [ ] **Step 1: 创建 ofono/mod.rs**

```rust
use zbus::Connection;

pub struct Ofono {
    conn: Connection,
}

impl Ofono {
    pub async fn new() -> anyhow::Result<Self> {
        let conn = Connection::system().await?;
        Ok(Self { conn })
    }
}
```

- [ ] **Step 2: 参考 project-cpe 实现 modem.rs**

参考：`/Users/zzcc/.openclaw/workspace-techman/project-cpe/backend/src/dbus.rs`

- [ ] **Step 3: 实现 network.rs**

参考 project-cpe 的 `NetworkRegistration` 接口

- [ ] **Step 4: 验证编译**

Run: `cd backend && cargo check`
Expected: 编译通过

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(ofono): add D-Bus oFono wrappers"
```

---

### Task 3: AT 指令 Handler

**Files:**
- Create: `backend/src/handlers/at.rs`

- [ ] **Step 1: 实现 AT 发送接口**

```rust
use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct AtRequest {
    pub cmd: String,
}

#[derive(Serialize)]
pub struct AtResponse {
    pub result: String,
}

pub async fn send_at(
    State(ctx): State<Arc<AppContext>>,
    Json(req): Json<AtRequest>,
) -> Json<AtResponse> {
    // 调用 oFono 发送 AT 指令
    let result = ctx.ofono.send_at(&req.cmd).await.unwrap_or_else(|e| e.to_string());
    Json(AtResponse { result })
}
```

- [ ] **Step 2: 实现 AT 历史记录**

内存中存储最近 100 条指令

- [ ] **Step 3: 注册路由**

```rust
.route("/api/at/send", post(send_at))
.route("/api/at/history", get(get_at_history))
```

- [ ] **Step 4: 测试**

Run: `curl -X POST http://localhost:8080/api/at/send -d '{"cmd":"AT+CSQ"}'`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(at): add AT command handler"
```

---

### Task 4: 设备信息 API

**Files:**
- Create: `backend/src/handlers/device.rs`
- Modify: `backend/src/main.rs` - 添加路由

- [ ] **Step 1: 实现设备信息接口**

- `GET /api/device/info` - IMEI/ICCID/型号
- `GET /api/device/sim` - SIM卡状态

- [ ] **Step 2: 注册路由**

- [ ] **Step 3: 测试**

Run: `curl http://localhost:8080/api/device/info`

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(device): add device info API"
```

---

### Task 5: 网络状态 API

**Files:**
- Create: `backend/src/handlers/network.rs`

- [ ] **Step 1: 实现网络接口**

- `GET /api/network/status` - 网络注册状态
- `GET /api/network/signal` - 信号强度
- `GET /api/network/cells` - 基站信息
- `GET /api/network/operators` - 运营商列表

- [ ] **Step 2: 注册路由**

- [ ] **Step 3: 测试**

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(network): add network status API"
```

---

## Phase 2: 后端功能（流量、短信、通话、Webhook）

### Task 6: 控制接口

**Files:**
- Create: `backend/src/handlers/control.rs`

- [ ] **实现控制接口**

- `GET/POST /api/control/data` - 数据开关
- `GET/POST /api/control/airplane` - 飞行模式
- `GET/POST /api/control/radio` - 射频模式
- `GET/POST /api/control/band-lock` - 频段锁定
- `GET/POST /api/control/cell-lock` - 小区锁定
- `GET/POST /api/control/apn` - APN配置

- [ ] **Commit**

---

### Task 7: 流量管理

**Files:**
- Create: `backend/src/handlers/traffic.rs`

- [ ] **实现流量接口**

- `GET /api/traffic/stats` - 流量统计
- `GET/POST /api/traffic/limit` - 流量限制
- `GET/POST /api/traffic/alert` - 流量提醒

- [ ] **Commit**

---

### Task 8: 短信管理

**Files:**
- Create: `backend/src/handlers/sms.rs`
- Create: `backend/src/sms_listener.rs` - 短信监听

- [ ] **实现短信接口**

- `GET /api/sms/list` - 短信列表
- `POST /api/sms/send` - 发送短信
- `DELETE /api/sms/delete` - 删除短信

- [ ] **实现 WebSocket 推送新短信**

- [ ] **Commit**

---

### Task 9: 通话管理

**Files:**
- Create: `backend/src/handlers/call.rs`

- [ ] **实现通话接口**

- `GET /api/call/list` - 通话记录
- `POST /api/call/dial` - 拨打电话
- `POST /api/call/hangup` - 挂断电话
- `POST /api/call/answer` - 接听电话
- `GET/POST /api/call/forwarding` - 呼叫转移
- `GET /api/ims/status` - VoLTE/IMS状态

- [ ] **Commit**

---

### Task 10: Webhook

**Files:**
- Create: `backend/src/handlers/webhook.rs`
- Create: `backend/src/webhook.rs` - Webhook 发送器

- [ ] **实现 Webhook 接口**

- `GET/POST /api/webhook` - Webhook配置
- `POST /api/webhook/test` - 测试Webhook

- [ ] **Commit**

---

## Phase 3: 前端开发

### Task 11: 前端初始化

**Files:**
- Create: `web/package.json`
- Create: `web/vite.config.ts`
- Create: `web/tsconfig.json`
- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`

- [ ] **Step 1: 创建 React + TypeScript + Vite 项目**

```bash
cd web
npm create vite@latest . -- --template react-ts
npm install
```

- [ ] **Step 2: 安装依赖**

```bash
npm install axios react-router-dom
```

- [ ] **Step 3: 配置 Vite 代理开发服务器**

```typescript
// vite.config.ts
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/ws': 'ws://localhost:8080'
    }
  }
}
```

- [ ] **Step 4: Commit**

---

### Task 12: Dashboard 页面

**Files:**
- Create: `web/src/pages/Dashboard.tsx`
- Create: `web/src/components/SignalCard.tsx`
- Create: `web/src/components/TrafficCard.tsx`

- [ ] **实现设备概览页面**

- 信号强度显示
- 流量统计概览
- 运营商信息

- [ ] **Commit**

---

### Task 13: Network 页面

**Files:**
- Create: `web/src/pages/Network.tsx`

- [ ] **实现网络详情页面**

- 小区信息
- 频段信息
- 信号强度图表

- [ ] **Commit**

---

### Task 14: Traffic 页面

**Files:**
- Create: `web/src/pages/Traffic.tsx`

- [ ] **实现流量管理页面**

- 流量统计图表
- 流量限制设置
- 流量提醒设置

- [ ] **Commit**

---

### Task 15: SMS 页面

**Files:**
- Create: `web/src/pages/SMS.tsx`

- [ ] **实现短信页面**

- 短信列表
- 发送短信
- 删除短信

- [ ] **Commit**

---

### Task 16: Call 页面

**Files:**
- Create: `web/src/pages/Call.tsx`

- [ ] **实现通话页面**

- 通话记录
- 拨号盘
- 接听/挂断

- [ ] **Commit**

---

### Task 17: ATConsole 页面

**Files:**
- Create: `web/src/pages/ATConsole.tsx`

- [ ] **实现 AT 调试控制台**

- AT 指令输入
- 响应显示
- 历史记录

- [ ] **Commit**

---

### Task 18: Settings 页面

**Files:**
- Create: `web/src/pages/Settings.tsx`

- [ ] **实现设置页面**

- Webhook配置
- APN设置
- 系统信息

- [ ] **Commit**

---

## Phase 4: 完善

### Task 19: 构建脚本

**Files:**
- Create: `scripts/build.sh`
- Modify: `Cargo.toml` - 添加版本号

- [ ] **实现构建脚本（参考 project-cpe）**

```bash
#!/bin/bash
# 构建后端 + 前端
# 生成 OTA 包
```

- [ ] **Commit**

---

### Task 20: README

**Files:**
- Create: `README.md`

- [ ] **编写完整 README**

- 项目介绍
- 功能清单
- 构建说明
- 部署说明

- [ ] **Commit**

---

## 进度追踪

| Phase | Task | 状态 |
|-------|------|------|
| 1 | 项目初始化 | ✅ |
| 1 | oFono D-Bus 封装 | ✅ |
| 1 | AT 指令 Handler | ✅ |
| 1 | 设备信息 API | ✅ |
| 1 | 网络状态 API | ✅ |
| 2 | 控制接口 | ✅ |
| 2 | 流量管理 | ✅ |
| 2 | 短信管理 | ✅ |
| 2 | 通话管理 | ✅ |
| 2 | Webhook | ✅ |
| 3 | 前端初始化 | ✅ |
| 3 | Dashboard 页面 | ✅ |
| 3 | Network 页面 | ✅ |
| 3 | Traffic 页面 | ✅ |
| 3 | SMS 页面 | ✅ |
| 3 | Call 页面 | ✅ |
| 3 | ATConsole 页面 | ✅ |
| 3 | Settings 页面 | ✅ |
| 4 | 构建脚本 | ✅ |
| 4 | README | ✅ |
| - | 后端测试 | ✅ |

---

## 测试策略

### 后端测试

```bash
# 编译测试
cargo build --release --target aarch64-unknown-linux-musl

# ADB 测试
adb shell "curl http://localhost:8080/api/health"
adb shell "curl -X POST http://localhost:8080/api/at/send -d '{\"cmd\":\"AT+CSQ\"}'"
```

### 前端测试

```bash
cd web
npm run dev      # 开发服务器
npm run build    # 生产构建
npm run preview  # 预览构建结果
```
