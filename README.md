# CPE Ctrl

5G CPE 后台管理系统 - 华为5G通讯壳（UDX710平台）

## 功能特性

- **设备信息** - IMEI/ICCID/型号/固件版本
- **网络控制** - 信号强度/网络注册/小区信息
- **Modem控制** - 数据开关/飞行模式/射频模式
- **频段锁定** - LTE/NR 频段配置
- **小区锁定** - PCI/EARFCN 小区锁定
- **流量管理** - 流量统计/限制/提醒
- **短信管理** - 读取/发送/删除短信
- **通话管理** - 拨号/接听/挂断
- **AT指令** - 自由发送AT指令
- **Webhook** - 短信转发

## 技术架构

```
┌─────────────────────────────────────────────────┐
│              CPE Ctrl (Rust Backend)              │
│  ┌──────────────┐    ┌────────────────────────┐  │
│  │  Axum HTTP  │    │   AT Command Layer      │  │
│  │  + CORS     │    │   (D-Bus → oFono)      │  │
│  └──────────────┘    └────────────────────────┘  │
│  ┌──────────────────────────────────────────┐    │
│  │   handlers: device/network/control/... │    │
│  └──────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│           React + TypeScript (Frontend)           │
│  Dashboard / Network / Traffic / SMS / Call     │
└─────────────────────────────────────────────────┘
```

## 构建

### 环境要求

- **后端**: Rust 1.70+, 交叉编译工具链
- **前端**: Node.js 18+, npm

### 安装交叉编译工具链 (macOS)

```bash
brew tap messense/macos-cross-toolchains
brew install aarch64-unknown-linux-musl
brew install upx
```

### 构建

```bash
# 构建后端 + 前端
./scripts/build.sh

# 仅构建后端
./scripts/build.sh --backend-only

# 仅构建前端
./scripts/build.sh --frontend-only

# 生成 OTA 包
./scripts/build.sh --ota
```

## 部署

### 开发模式（通过 ADB）

```bash
# 构建
./scripts/build.sh

# 部署到设备
adb push cpe-ctrl /home/root/
adb push www /home/root/

# 运行
adb shell "cd /home/root && ./cpe-ctrl --port 8080"
```

### 生产模式（OTA）

```bash
# 构建 OTA 包
./scripts/build.sh --ota

# 解压并部署
tar -xzf release/cpe-ctrl-ota-*.tar.gz
adb push cpe-ctrl /home/root/
adb push www /home/root/
```

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/device/info` | GET | 设备信息 |
| `/api/network/status` | GET | 网络状态 |
| `/api/network/signal` | GET | 信号强度 |
| `/api/control/data` | GET/POST | 数据开关 |
| `/api/control/airplane` | GET/POST | 飞行模式 |
| `/api/control/band-lock` | GET/POST | 频段锁定 |
| `/api/traffic/stats` | GET | 流量统计 |
| `/api/sms/list` | GET | 短信列表 |
| `/api/sms/send` | POST | 发送短信 |
| `/api/call/dial` | POST | 拨打电话 |
| `/api/at/send` | POST | 发送AT指令 |

## AT 指令

### 常用指令

| 指令 | 功能 |
|------|------|
| `AT+CSQ` | 信号强度 |
| `AT+COPS?` | 运营商信息 |
| `AT+CREG?` | 网络注册 |
| `AT+CGATT?` | 数据连接 |
| `AT+SPLBAND` | 频段锁定 |
| `AT+CFUN` | 射频模式 |

### 频段锁定示例

```bash
# 锁定 LTE B1+B3
AT+SPLBAND=1,0,0,0,0,5,0

# 锁定 NR N78
AT+SPLBAND=2,0,0,256,0

# 解锁所有频段
AT+SPLBAND=1,0,0,0,0,0,0
```

## 前端开发

```bash
cd web
npm install
npm run dev    # 开发服务器 (localhost:5173)
npm run build  # 生产构建
```

## 参考项目

- [project-cpe](https://github.com/1orz/project-cpe) - Rust + Axum + zbus
- [UDX710-TOOLS](https://github.com/LeoChen-CoreMind/UDX710-TOOLS) - C + mongoose

## 协议

GPL-3.0
