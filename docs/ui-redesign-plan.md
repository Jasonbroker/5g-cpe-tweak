# UI Redesign Plan - Geek Edition

## 目标
将 UI 从"简单卡片"改造为"极客终端风格"，信息密度高，实时数据展示。

## 设计方向

### 美学风格
- **主题**: 终端/黑客风格 + 现代 Dashboard
- **字体**: JetBrains Mono（代码风格）+ Inter（UI文字）
- **配色**: 深色背景 + 青色/绿色点缀
- **布局**: 信息密度高，左侧导航 + 右侧内容

### 核心功能增强

1. **实时信号仪表盘**
   - RSSI/RSRP/RSRQ/SINR 实时图表
   - 网络类型切换动画
   - 运营商 Logo（如果可获取）

2. **AT Console 强化**
   - 分屏显示：命令 + 响应
   - 语法高亮
   - 命令自动补全（常用 AT 指令）
   - 历史持久化（localStorage）

3. **流量监控**
   - 实时流量速率表
   - 日/周/月流量图表
   - 流量预警可视化

4. **系统状态**
   - CPU/内存/温度（如果可获取）
   - Modem 状态 LED 指示
   - 连接时间计时器

5. **快捷操作**
   - 常用指令快捷按钮（AT+CSQ, AT+COPS? 等）
   - 键盘快捷键

### 前端技术栈增强
- 添加图表库：recharts 或轻量级 chart.js
- 添加状态管理：zustand（如果需要）
- 主题系统：支持亮/暗切换

## 实施计划

### Phase 1: 基础重构
- [ ] 更新全局样式（CSS Variables, 字体, 配色）
- [ ] 重新设计 Sidebar 导航
- [ ] 更新 Dashboard 布局

### Phase 2: AT Console 强化
- [ ] 分屏 AT Console
- [ ] 命令高亮
- [ ] 快捷指令按钮

### Phase 3: 实时数据
- [ ] 信号强度图表
- [ ] 流量统计图表

### Phase 4: 细节打磨
- [ ] 动画效果
- [ ] 响应式适配
- [ ] 加载状态

## 文件变更

- `web/src/index.css` - 全局样式重构
- `web/src/App.tsx` - 布局调整
- `web/src/App.css` - 样式更新
- `web/src/pages/Dashboard.tsx` - 新设计
- `web/src/pages/ATConsole.tsx` - 强化版本
- `web/src/pages/Network.tsx` - 添加图表
- `web/src/pages/Traffic.tsx` - 添加图表
