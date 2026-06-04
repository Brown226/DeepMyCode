# DeepMyCode × cc-haha 移植与产品级桌面体验设计文档

> **文档版本**：v1.0
> **创建日期**：2026-06-04
> **项目代号**：DMC-DESIGN-2026Q2
> **文档目标读者**：项目负责人、核心开发、架构师
> **文档范围**：完整设计（架构 / IDL / 组件 / 适配层 / 实施计划 / 风险）

---

## 一、文档元数据

| 字段 | 值 |
|------|---|
| **设计阶段** | 已通过可行性分析，进入详细设计 |
| **可执行性** | 已通过 Phase 决策（方案 A / iframe 替代 / 最小 MVP / 推迟 Computer Use） |
| **关联仓库** | `e:\DeepCode\DeepMyCode` (主) + `e:\DeepCode\cc-haha-0.3.2` (移植源) |
| **上游追踪** | [esengine/DeepSeek-Reasonix](https://github.com/esengine/DeepSeek-Reasonix) Go v1.0 |
| **实施周期** | 12-17 周（5 阶段） |
| **资源需求** | 2-3 人（1 前端 + 1 后端 + 0.5 平台） |

---

## 二、背景与目标

### 2.1 背景

DeepMyCode 项目基于上游 DeepSeek-Reasonix v1.0 Go 重写版，定位为 **"DeepSeek 核心引擎 + Wails 桌面壳"** 的产品级 AI 编码助手。

经过详细分析（参见姊妹文档 `可行性分析报告`），对比参考项目 cc-haha 0.3.2（Tauri v2 + React 18 + Bun）的 170+ 前端文件、26 个 Zustand store、20+ 桌面设置页，DeepMyCode 现状如下：

- **后端**（Go 端）：**功能完整且先进**（CodeGraph / LSP / MCP / Skills / Hooks / Permission / Sandbox / Plan Mode / 双模型协调 / 缓存优先）
- **桌面壳**（Wails 端）：**已有 32 个前端组件、50+ Wails 绑定方法、完整事件协议**
- **核心差距**：缺**多 Tab 系统**、缺**项目化 Sidebar**、缺**20+ 设置页深度组织**、缺**Terminal/Browser 等高级面板**、缺**Computer Use 等高级功能**

**关键认知**：这不是"从零建立前端"或"完全重写前端"，而是**在已有 Wails 应用基础上扩展、补齐 cc-haha 同等或更优的产品级桌面体验**。

### 2.2 目标

| 目标 | 度量 | 优先级 |
|------|------|--------|
| **G1：产品级桌面体验** | 至少达到 cc-haha 80% 功能完整度 | P0 |
| **G2：保留 Go 后端** | 不重写 Go 核心（CodeGraph/LSP/MCP/Skills/Hooks） | P0 |
| **G3：单二进制部署** | 维持 Wails `CGO_ENABLED=0` 单二进制 | P0 |
| **G4：可扩展架构** | 新增功能不破坏现有 32 组件 | P0 |
| **G5：跨平台一致** | macOS / Windows / Linux 三端一致 | P1 |
| **G6：上游同步** | 跟随上游 DeepSeek-Reasonix 演进 | P1 |
| **G7：测试覆盖** | 核心 store 与页面有单测 | P1 |

### 2.3 范围

**在范围内（IN）**：
- 多 Tab 系统（session / settings / scheduled / terminal / scheduled）
- Sidebar 项目化（项目分组、搜索、批量、排序）
- 完整 Settings 20+ 页（基于已有 12 设置域）
- Composer/Thread 增强（拖拽附件、@ 弹窗、slash、quick-add）
- Agent Teams 协作 UI
- Terminal Panel（xterm.js + Go PTY）
- Browser Panel（**iframe + postMessage 替代方案**）
- Workspace Panel 增强（多模式）
- MCP/Plugins/Skills/Memory 独立管理页
- Scheduled Tasks UI
- Mermaid / Image / Video Gallery
- OAuth 登录（ChatGPT/Claude 官方）
- Diagnostics / Doctor 自检
- Window Controls / Notification / Update（已部分实现）

**超出范围（OUT）**：
- Computer Use（**推迟到 Phase 6+**）
- 重写 Go 核心（CodeGraph/LSP/MCP/Skills/Hooks/Permission/Sandbox）
- 重写 Wails 绑定层（仅扩展）
- Tauri 迁移（保留 Wails）

### 2.4 关键决策摘要

| 决策点 | 选择 | 原因 |
|--------|------|------|
| **主方案** | 方案 A：Wails + 移植前端 | 保留 Go 后端优势 |
| **Browser Panel** | iframe + postMessage 替代 | Wails 单一 WebView 限制 |
| **Phase 1 MVP** | 最小可跑通：仅 Chat + Sidebar | 范围控制、价值验证 |
| **Computer Use** | 推迟 | 平台特定、风险高 |
| **CSS 框架** | 沿用现有 styles.css（手写 CSS 变量） | 避免引入 Tailwind 体积 |
| **状态管理** | 沿用 useController + bridge（无 Zustand） | 状态来自 Go 端，前端只渲染 |
| **i18n** | 沿用 en.ts + zh.ts | 已有完整词条 |

---

## 三、现状评估

### 3.1 DeepMyCode 已具备能力清单

#### 3.1.1 Go 端 50+ Wails 绑定方法（[desktop/app.go](file:///e:/DeepCode/DeepMyCode/desktop/app.go) + 各 `*_app.go`）

| 类别 | 已有方法 |
|------|----------|
| **平台/会话** | `Platform`, `Submit`, `SubmitDisplay`, `Cancel`, `Approve`, `AnswerQuestion`, `SetPlanMode`, `SetMode`, `Compact`, `NewSession` |
| **历史/回放** | `History`, `Checkpoints`, `Rewind`, `Fork`, `SummarizeFrom`, `SummarizeUpTo` |
| **会话管理** | `ListSessions`, `ResumeSession`, `PreviewSession`, `DeleteSession`, `RenameSession` |
| **工作空间** | `ListWorkspaces`, `PickWorkspace`, `SwitchWorkspace` |
| **上下文/账单** | `ContextUsage`, `Balance`, `Jobs`, `Meta`, `Commands` |
| **能力（MCP + Skills）** | `Capabilities`, `AddMCPServer`, `UpdateMCPServer`, `RemoveMCPServer`, `RetryMCPServer`, `ClearMCPServerAuthentication`, `SetMCPServerEnabled`, `SetMCPServerTier` |
| **Skills** | `PickSkillFolder`, `AddSkillPath`, `RemoveSkillPath`, `RefreshSkills` |
| **Slash/文件系统** | `SlashArgs`, `ListDir`, `SearchFileRefs`, `ReadFile`, `WorkspaceChanges`, `OpenWorkspacePath`, `RevealWorkspacePath` |
| **附件/拖拽** | `SavePastedImage`, `SavePastedFile`, `AttachDropped`, `AttachmentDataURL` |
| **模型/Effort** | `Models`, `SetModel`, `Effort`, `SetEffort` |
| **记忆** | `Memory`, `Remember`, `Forget`, `SaveDoc` |
| **设置** | `Settings`, `SetDefaultModel`, `SetPlannerModel`, `SaveProvider`, `DeleteProvider`, `SetProviderKey`, `SetPermissionMode`, `AddPermissionRule`, `RemovePermissionRule`, `SetSandbox`, `SetNetwork`, `SetAgentParams`, `SetBypass` |
| **更新器** | `Version`, `CheckUpdate`, `ApplyUpdate`, `OpenDownloadPage` |
| **Onboarding** | `NeedsOnboarding`, `ConnectKey` |

#### 3.1.2 前端 32 个组件（[desktop/frontend/src/components/](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/)）

| 类别 | 组件 |
|------|------|
| **编辑器** | [HljsCode.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/editors/HljsCode.tsx), [HljsDiff.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/editors/HljsDiff.tsx) |
| **主组件** | [Composer.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/Composer.tsx), [Transcript.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/Transcript.tsx), [Message.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/Message.tsx) |
| **面板** | [SettingsPanel.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/SettingsPanel.tsx), [CapabilitiesPanel.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/CapabilitiesPanel.tsx), [MemoryPanel.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/MemoryPanel.tsx), [HistoryPanel.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/HistoryPanel.tsx), [WorkspacePanel.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/WorkspacePanel.tsx) |
| **交互** | [ApprovalModal.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/ApprovalModal.tsx), [AskCard.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/AskCard.tsx), [ArgMenu.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/ArgMenu.tsx), [SlashMenu.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/SlashMenu.tsx), [FloatingMenu.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/FloatingMenu.tsx), [FileMenu.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/FileMenu.tsx) |
| **辅助** | [StatusBar.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/StatusBar.tsx), [ToolCard.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/ToolCard.tsx), [ToolCard.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/ToolCard.tsx), [TodoPanel.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/TodoPanel.tsx), [PromptShelf.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/PromptShelf.tsx), [ResizableDrawer.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/ResizableDrawer.tsx) |
| **工具** | [CodeViewer.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/CodeViewer.tsx), [DiffView.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/DiffView.tsx), [Markdown.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/Markdown.tsx) |
| **配置 UI** | [ModelSwitcher.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/ModelSwitcher.tsx), [EffortSwitcher.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/EffortSwitcher.tsx) |
| **辅助 UI** | [Tooltip.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/Tooltip.tsx), [CopyButton.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/CopyButton.tsx), [ErrorBoundary.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/ErrorBoundary.tsx) |
| **系统** | [OnboardingOverlay.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/OnboardingOverlay.tsx), [Welcome.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/Welcome.tsx), [UpdateBanner.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/UpdateBanner.tsx) |

#### 3.1.3 lib 工具层（[desktop/frontend/src/lib/](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/)）

| 文件 | 职责 |
|------|------|
| [bridge.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/bridge.ts) | Wails 绑定代理 + 事件订阅 + dev mock |
| [types.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/types.ts) | 完整类型定义（WireEvent、HistoryMessage、SessionMeta、ContextInfo、Meta、Mode、CommandInfo、DirEntry、DroppedItem、FilePreview 等） |
| [useController.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/useController.ts) | 状态机 hook（reducer） |
| [i18n.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/i18n.tsx) | i18n 上下文与 useT hook |
| [theme.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/theme.ts) | 主题系统（auto/light/dark） |
| [tools.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/tools.ts) | 工具调用解析（todo 等） |
| [session.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/session.ts) | 会话活动计算 |
| [layoutPreferences.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/layoutPreferences.ts) | 布局尺寸持久化 |
| [highlight.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/highlight.ts) | 代码高亮配置 |
| [diff.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/diff.ts) | Diff 工具 |
| [crash.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/crash.ts) | 崩溃捕获 |
| [lang.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/lang.ts) | 语言检测 |
| [useUpdater.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/useUpdater.ts) | Updater hook |
| [workspaceDrag.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/workspaceDrag.ts) | 工作空间拖拽 |

#### 3.1.4 后端 Go 端 14 个核心文件（[desktop/](file:///e:/DeepCode/DeepMyCode/desktop/)）

| 文件 | 职责 |
|------|------|
| [app.go](file:///e:/DeepCode/DeepMyCode/desktop/app.go) | App struct + 50+ 绑定方法 |
| [main.go](file:///e:/DeepCode/DeepMyCode/desktop/main.go) | Wails 入口 |
| [wire.go](file:///e:/DeepCode/DeepMyCode/desktop/wire.go) | Wire 协议（事件流） |
| [sessions.go](file:///e:/DeepCode/DeepMyCode/desktop/sessions.go) | 会话管理 |
| [settings_app.go](file:///e:/DeepCode/DeepMyCode/desktop/settings_app.go) | 设置管理 |
| [workspace.go](file:///e:/DeepCode/DeepMyCode/desktop/workspace.go) | 工作空间 |
| [workspace_changes.go](file:///e:/DeepCode/DeepMyCode/desktop/workspace_changes.go) | 工作空间变更 |
| [updater.go](file:///e:/DeepCode/DeepMyCode/desktop/updater.go) | 更新器核心 |
| [updater_app.go](file:///e:/DeepCode/DeepMyCode/desktop/updater_app.go) | 更新器绑定 |
| [dotenv.go](file:///e:/DeepCode/DeepMyCode/desktop/dotenv.go) | .env 处理 |
| [open_workspace_*.go](file:///e:/DeepCode/DeepMyCode/desktop/open_workspace_darwin.go) | 跨平台工作空间打开 |
| [internal/update/manifest.go](file:///e:/DeepCode/DeepMyCode/desktop/internal/update/manifest.go) | 更新清单 |
| [internal/update/verify.go](file:///e:/DeepCode/DeepMyCode/desktop/internal/update/verify.go) | 更新验证 |
| [cmd/sign/main.go](file:///e:/DeepCode/DeepMyCode/desktop/cmd/sign/main.go) | 签名工具 |

#### 3.1.5 事件协议（[wire.go](file:///e:/DeepCode/DeepMyCode/desktop/wire.go) + [types.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/types.ts)）

已实现 16 种事件 kind：

| kind | 用途 |
|------|------|
| `turn_started` | 用户回合开始 |
| `reasoning` | 模型推理流 |
| `text` | 文本流（字符级） |
| `message` | 消息级文本 |
| `tool_dispatch` | 工具调用分发 |
| `tool_result` | 工具结果 |
| `tool_progress` | 工具进度 |
| `usage` | Token 用量 + 缓存诊断 |
| `notice` | 通知 |
| `phase` | 阶段切换 |
| `approval_request` | 审批请求 |
| `ask_request` | AskUserQuestion 请求 |
| `turn_done` | 回合完成 |
| `compaction_started` | 压缩开始 |
| `compaction_done` | 压缩完成 |
| `retrying` | 重试中 |

### 3.2 与 cc-haha 实际差距矩阵

#### 3.2.1 P0 严重缺失（核心交互）

| 差距项 | cc-haha 现状 | DeepMyCode 现状 | 差距性质 |
|--------|------------|----------------|----------|
| **多 Tab 系统** | [TabBar](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/components/layout/TabBar.tsx) + [tabStore](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/stores/tabStore.ts) 4 类 Tab（session/settings/scheduled/terminal）持久化 | 单一 ChatView，无 Tab | 架构层 |
| **项目化 Sidebar** | [Sidebar](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/components/layout/Sidebar.tsx) 项目分组、搜索、批量、排序、拖拽 | 简单工作空间 chip | 架构层 |
| **Settings 20+ 页** | [Settings.tsx](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/pages/Settings.tsx) 集成 20+ 独立子页 | 已有 [SettingsPanel](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/SettingsPanel.tsx) 但内联 | 需拆分 |
| **完整 Shell 架构** | [AppShell](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/components/layout/AppShell.tsx) + [ContentRouter](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/components/layout/ContentRouter.tsx) | App.tsx 一体化 | 需重构 |
| **Composer 增强** | 拖拽附件、@ 弹窗、slash、quick-add | 部分有 [ArgMenu](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/ArgMenu.tsx)、[SlashMenu](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/SlashMenu.tsx) | 需补拖拽 |

#### 3.2.2 P1 中度缺失

| 差距项 | cc-haha 现状 | DeepMyCode 现状 | 差距性质 |
|--------|------------|----------------|----------|
| **Agent Teams** | [AgentTeams](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/pages/AgentTeams.tsx) + [teamStore](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/stores/teamStore.ts) + [TeamStatusBar](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/components/teams/TeamStatusBar.tsx) | 无 | 完整缺失 |
| **Terminal Panel** | xterm.js 嵌入式 + Tab 关联 | 无 | 完整缺失 |
| **Browser Panel** | Tauri 多 webview 嵌入 | 无（计划 iframe 替代） | 架构受限 |
| **Workspace 多模式** | workbench（workspace/browser） | 已有 [WorkspacePanel](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/WorkspacePanel.tsx) 但单模式 | 需扩展 |
| **MCP 独立页** | [McpSettings](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/pages/McpSettings.tsx) | 集成在 [CapabilitiesPanel](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/CapabilitiesPanel.tsx) | 需拆分 |
| **Plugins 独立页** | [PluginDetail](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/components/plugins/PluginDetail.tsx) | 无 | 完整缺失 |
| **Skills 独立页** | [SkillList](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/components/skills/SkillList.tsx) | 集成在 [CapabilitiesPanel](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/CapabilitiesPanel.tsx) | 需拆分 |
| **Memory 独立页** | [MemorySettings](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/pages/MemorySettings.tsx) | 已有 [MemoryPanel](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/MemoryPanel.tsx) | 需增强 |
| **Scheduled Tasks UI** | [ScheduledTasks](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/pages/ScheduledTasks.tsx) + [cronDescribe](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/lib/cronDescribe.ts) | Jobs API 有，[ScheduledTasks UI](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/StatusBar.tsx) 部分 | 需补 |
| **WebSocket 实时** | [websocket.ts](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/api/websocket.ts) reconnect/ping | 用 Wails event（功能等价） | 无需补 |
| **Mermaid** | [MermaidRenderer](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/components/chat/MermaidRenderer.tsx) | 无 | 完整缺失 |
| **Image/Video Gallery** | [ImageGalleryModal](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/components/chat/ImageGalleryModal.tsx) | 部分（附件预览） | 需增强 |
| **Diff Viewer** | [DiffViewer](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/components/chat/DiffViewer.tsx) | 已有 [DiffView](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/DiffView.tsx) | 已基本满足 |
| **OAuth 登录** | [ChatGPTOfficialLogin](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/components/settings/ChatGPTOfficialLogin.tsx) | 无 | 完整缺失 |
| **Diagnostics/Doctor** | [DoctorPanel](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/components/doctor/DoctorPanel.tsx) + [diagnosticsCapture](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/lib/diagnosticsCapture.ts) | 无 | 完整缺失 |

#### 3.2.3 P2 轻度缺失

| 差距项 | cc-haha 现状 | DeepMyCode 现状 | 差距性质 |
|--------|------------|----------------|----------|
| **H5 Mobile** | [useMobileViewport](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/hooks/useMobileViewport.ts) | 无 | 完整缺失 |
| **Preview Agent** | [preview-agent/](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/preview-agent/) 15 文件 | 无 | 完整缺失 |
| **Window Controls 自定义** | [WindowControls](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/components/layout/WindowControls.tsx) | Wails 默认 | 需评估 |
| **桌面通知** | [desktopNotifications](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/lib/desktopNotifications.ts) | Wails runtime | 需补 |
| **CodeGraph UI** | （实际由 Go 端提供） | [CodeGraph MCP](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/bridge.ts) 已暴露 | 已满足 |
| **OpenTargets** | [openTargets](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/api/openTargets.ts) | 无 | 完整缺失 |

### 3.3 实施优先级矩阵

| 类别 | 数量 | 工作量 | 建议阶段 |
|------|------|--------|----------|
| P0 核心交互 | 5 项 | 4-5 周 | Phase 1-2 |
| P1 中度缺失 | 16 项 | 6-8 周 | Phase 2-4 |
| P2 轻度缺失 | 6 项 | 2-4 周 | Phase 5 |
| **总计** | **27 项** | **12-17 周** | **5 阶段** |

---

## 四、整体架构设计

### 4.1 现有架构（已实现）

```
┌──────────────────────────────────────────────────────────┐
│           Wails WebView (React 18 + TS 5)                │
│  ┌─────────────────────────────────────────────────┐    │
│  │ App.tsx                                          │    │
│  │ ├── Sidebar (工作空间 chip)                      │    │
│  │ ├── Transcript (主对话)                          │    │
│  │ ├── Composer (输入)                              │    │
│  │ ├── SettingsPanel                                │    │
│  │ ├── CapabilitiesPanel                            │    │
│  │ ├── WorkspacePanel                               │    │
│  │ └── StatusBar                                    │    │
│  │ lib/                                             │    │
│  │ ├── bridge.ts (Wails 绑定代理)                   │    │
│  │ ├── useController.ts (状态机)                    │    │
│  │ ├── types.ts (类型契约)                          │    │
│  │ └── i18n.tsx (国际化)                            │    │
│  └─────────────────────────────────────────────────┘    │
│                       ↕ window.go.main.App.*             │
│                       ↕ window.runtime.EventsEmit/On     │
│  ┌─────────────────────────────────────────────────┐    │
│  │ desktop/app.go (App struct)                      │    │
│  │ ├── 50+ 绑定方法                                 │    │
│  │ ├── eventSink (转发到 runtime.EventsEmit)        │    │
│  │ └── startup() → buildController()                │    │
│  └─────────────────────────────────────────────────┘    │
│                       ↕ control.Controller              │
│  ┌─────────────────────────────────────────────────┐    │
│  │ internal/control/controller.go (传输无关)       │    │
│  │ internal/boot/boot.go (装配层)                   │    │
│  │ internal/agent/agent.go (智能体)                  │    │
│  │ internal/provider/openai + anthropic             │    │
│  │ internal/tool/builtin (13+ 工具)                 │    │
│  │ internal/plugin (MCP) + internal/codegraph       │    │
│  │ internal/skill + internal/hook + internal/perm   │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### 4.2 目标架构（扩展后）

```
┌────────────────────────────────────────────────────────────────┐
│                    Wails WebView (React 18 + TS 5)             │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ AppShell (新)                                          │    │
│  │ ├── TabBar (新 - 多 Tab 持久化)                        │    │
│  │ │   ├── Session Tab ×N                                │    │
│  │ │   ├── Settings Tab                                  │    │
│  │ │   ├── Scheduled Tab (新)                            │    │
│  │ │   └── Terminal Tab ×N (新)                          │    │
│  │ ├── Sidebar (升级 - 项目化)                            │    │
│  │ │   ├── Project Group (按项目分组会话)                │    │
│  │ │   ├── Session Search                                │    │
│  │ │   ├── Batch Operations                              │    │
│  │ │   └── Project Organization Settings                 │    │
│  │ ├── ContentRouter (新 - 路由分发)                     │    │
│  │ │   ├── ActiveSession (Chat 视图)                     │    │
│  │ │   ├── SettingsPages (20+ 独立页)                    │    │
│  │ │   ├── ScheduledTasks (新)                           │    │
│  │ │   ├── TerminalPanel (新)                            │    │
│  │ │   └── BrowserPanel (新 - iframe 替代)               │    │
│  │ ├── WorkspacePanel (升级 - 多模式)                    │    │
│  │ │   ├── File Tree                                     │    │
│  │ │   ├── Workspace Mode (单文件预览)                   │    │
│  │ │   └── Workbench Mode (内嵌 Vite WebView)            │    │
│  │ ├── StatusBar                                         │    │
│  │ ├── ToastContainer (新)                               │    │
│  │ ├── UpdateChecker                                     │    │
│  │ └── ErrorBoundary                                     │    │
│  │ lib/                                                  │    │
│  │ ├── bridge.ts (扩展 - 增加 Tab/Terminal/Browser API)  │    │
│  │ ├── tabStore (新 - 多 Tab 状态)                       │    │
│  │ ├── sessionStore (新 - 会话分组/搜索)                 │    │
│  │ ├── terminalStore (新 - Terminal 状态)                │    │
│  │ ├── browserStore (新 - Browser 状态)                  │    │
│  │ ├── toastStore (新)                                   │    │
│  │ ├── useController.ts (增强)                           │    │
│  │ └── ...                                               │    │
│  └───────────────────────────────────────────────────────┘    │
│                           ↕ window.go.main.App.*               │
│                           ↕ window.runtime.EventsEmit/On        │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ desktop/app.go (扩展)                                 │    │
│  │ ├── 50+ 已有绑定方法                                  │    │
│  │ ├── 新增 Tab 相关方法 (OpenTab/CloseTab/...)          │    │
│  │ ├── 新增 Terminal PTY 方法 (OpenPty/Write/Resize)     │    │
│  │ ├── 新增 Browser Embedding 方法 (OpenUrl)            │    │
│  │ ├── 新增 Scheduled Tasks 方法                         │    │
│  │ ├── 新增 Agent Teams 方法                             │    │
│  │ └── 新增 OAuth / Diagnostics 方法                     │    │
│  │ internal/control/controller.go (扩展)                  │    │
│  │ internal/boot/boot.go (扩展)                          │    │
│  │ internal/agent/agent.go (扩展 Coordinator → Teams)   │    │
│  │ internal/pty (新 - PTY 服务)                          │    │
│  │ internal/teams (新 - Teams 协调)                      │    │
│  │ internal/scheduled (新 - 任务调度)                    │    │
│  │ ...                                                   │    │
│  └───────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────┘
```

### 4.3 关键架构决策

#### 4.3.1 前端状态管理：保持 React useReducer + 自定义 hook

**决策**：**不引入 Zustand**，继续用 [useController](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/useController.ts) 模式

**原因**：
- DeepMyCode 状态来自 Go controller，前端只是镜像
- Zustand 26 store 适合 cc-haha 那种"前端为主"的架构，DeepMyCode 状态更集中在后端
- 减少依赖，保持单二进制轻量

**例外**：**TabStore / SidebarStore / ToastStore** 仍用 React `createContext` 或 `useSyncExternalStore` 模式（避免 Zustand 但又有 store 抽象）

#### 4.3.2 路由：自实现 ContentRouter

**决策**：**不引入 React Router**，自实现 ContentRouter

**原因**：
- 路由结构简单（4 类 Tab + 弹窗）
- 减少依赖，与 Wails event-driven 模型一致
- 状态由 tabStore 管理，ContentRouter 只是视图

#### 4.3.3 样式：沿用 styles.css（手写 CSS 变量）

**决策**：**不引入 TailwindCSS**

**原因**：
- 现有 [styles.css](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/styles.css) 已用 CSS 变量主题
- 32 组件已稳定，迁移成本高
- 单二进制大小考虑

#### 4.3.4 多 Tab 持久化：localStorage

**决策**：Tab 列表持久化用 localStorage（key: `deepmycode.tab.active`）

**原因**：
- 简单、不依赖后端
- 与 cc-haha 方案一致

#### 4.3.5 流式响应：Wails EventsEmit（已有）

**决策**：**继续用 Wails EventsEmit**，不引入 WebSocket

**原因**：
- EventsEmit 性能等价于 WebSocket（都是推流）
- 减少复杂度
- Go 端已有 `eventSink` 抽象，无需新通道

#### 4.3.6 Browser Panel：iframe 替代

**决策**：用 `<iframe src={url}>` + 自实现地址栏 + postMessage 通信桥

**限制**：
- 无独立 cookie/缓存
- 无 webview 特定的桥接（如 Tauri `invoke`）
- 仅支持 HTTP(S) 协议

**架构**：
```typescript
// BrowserPanel.tsx
function BrowserPanel({ url, onNavigate }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // 监听 iframe postMessage
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      // 处理来自 iframe 的事件（如链接点击、滚动）
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);
  
  return (
    <div className="browser-panel">
      <AddressBar url={url} onSubmit={onNavigate} />
      <iframe ref={iframeRef} src={url} sandbox="allow-scripts allow-same-origin" />
    </div>
  );
}
```

---

## 五、IDL（接口定义）设计

### 5.1 设计原则

- **向后兼容**：不破坏现有 50+ 绑定方法
- **类型同步**：[bridge.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/bridge.ts) 与 [app.go](file:///e:/DeepCode/DeepMyCode/desktop/app.go) 严格对应
- **错误约定**：Go 端返回 `error`，前端 TypeScript 处理为 Promise rejection
- **流式约定**：Go 端 `runtime.EventsEmit(ctx, "agent:event", wireEvent)`，前端 `onEvent(cb)`

### 5.2 新增 API 清单（按阶段）

#### Phase 1 新增（最小 MVP：Chat + Sidebar）

| 方法 | Go 端位置 | 用途 |
|------|----------|------|
| **无需新增** | - | Phase 1 不新增 Go API，复用现有 |

**前端新增**：
- `lib/tabStore.ts` - Tab 状态（仅 UI 状态，无 Go 端）
- `components/AppShell.tsx` - 整合层
- `components/ContentRouter.tsx` - 路由分发
- `components/Sidebar.tsx`（升级现有 Sidebar chip）

#### Phase 2 新增（核心 UI 完整化）

| 方法 | 用途 | Go 端位置 |
|------|------|----------|
| `RenameTab(tabId, title)` | 重命名 Tab | `tabs_app.go`（新） |
| `PinTab(tabId, pinned)` | 固定 Tab | 同上 |
| `ReorderTab(fromIdx, toIdx)` | 重新排序 | 同上 |
| `GetTabState()` | 获取 Tab 持久化状态 | 同上 |
| `SetTabState(state)` | 恢复 Tab | 同上 |
| `ListProjects()` | 列出项目（带会话统计） | `projects_app.go`（新） |
| `GroupSessionsByProject()` | 按项目分组会话 | `sessions.go` 扩展 |
| `SearchSessions(query)` | 搜索会话 | 同上 |
| `BatchDeleteSessions(paths)` | 批量删除 | 同上 |
| `ExportSession(path, format)` | 导出会话 | 同上 |
| `ImportSession(path)` | 导入会话 | 同上 |

**类型新增**（types.ts）：
```typescript
export interface TabState {
  openTabs: Array<{ sessionId: string; title: string; type: TabType }>;
  activeTabId: string | null;
}

export type TabType = "session" | "settings" | "scheduled" | "terminal" | "browser";

export interface ProjectInfo {
  path: string;
  name: string;
  sessionCount: number;
  lastActivityAt: number;
  totalTurns: number;
}

export interface SessionGroup {
  project: ProjectInfo;
  sessions: SessionMeta[];
}
```

#### Phase 3 新增（能力 UI 独立页）

**MCP 独立**（已有 Capabilities，复用 `AddMCPServer` / `RemoveMCPServer` / `UpdateMCPServer` / `SetMCPServerEnabled` / `SetMCPServerTier` / `RetryMCPServer` / `ClearMCPServerAuthentication` / `RefreshSkills`）

新增：
- `GetMCPServerDetail(name)` - 完整配置详情
- `TestMCPServer(name)` - 测试连接
- `GetMCPServerLogs(name, limit)` - 获取日志

**Plugins 独立**（新）：
- `ListPlugins()` - 列出已安装插件
- `InstallPlugin(source)` - 安装
- `UninstallPlugin(id)` - 卸载
- `EnablePlugin(id, enabled)` - 启停
- `GetPluginConfig(id)` - 配置
- `SetPluginConfig(id, config)` - 设置

**Skills 独立**（已有部分能力）：
- `ListSkills(scope?)` - 列表（已有 `Capabilities`）
- `GetSkill(name)` - 详情
- `RunSkill(name, args)` - 运行
- `CreateSkill(template)` - 创建
- `EditSkill(name, body)` - 编辑
- `DeleteSkill(name)` - 删除

**Memory 独立**（已有 `Memory` / `Remember` / `Forget` / `SaveDoc`）：
- `GetMemoryDoc(path)` - 文档
- `SearchMemory(query)` - 搜索
- `MemoryStats()` - 统计

**Scheduled Tasks**（新）：
- `ListScheduledTasks()` - 任务列表
- `CreateScheduledTask(spec)` - 创建
- `UpdateScheduledTask(id, spec)` - 更新
- `DeleteScheduledTask(id)` - 删除
- `RunScheduledTaskNow(id)` - 立即运行
- `GetScheduledTaskRuns(id, limit)` - 运行历史

#### Phase 4 新增（高级 UI）

**Terminal Panel**（新）：
- `OpenPty(id, cwd, cols, rows)` - 打开 PTY
- `WritePty(id, data)` - 写入
- `ResizePty(id, cols, rows)` - 调整大小
- `ClosePty(id)` - 关闭
- `ListPtys()` - 列出已打开

**Agent Teams**（新）：
- `ListTeams()` - Teams 列表
- `GetTeam(name)` - 详情
- `CreateTeam(spec)` - 创建
- `DeleteTeam(name)` - 删除
- `ListTeamMembers(team)` - 成员
- `SendTeamMemberMessage(team, member, content)` - 发送消息
- `GetTeamMemberTranscript(team, member)` - 获取 transcript

**Browser Panel**（iframe 替代）：
- 无需新 Go API（iframe 自带）
- 新增前端 `browserStore` 管理 URL 历史、收藏等

#### Phase 5 新增（扩展 & 打磨）

**OAuth**（新）：
- `StartClaudeOAuth()` - 启动 OAuth
- `StartChatGPTOAuth()` - 启动 OAuth
- `GetOAuthStatus(provider)` - 状态
- `CancelOAuth(provider)` - 取消

**Diagnostics**（新）：
- `RunDiagnostics()` - 运行诊断
- `GetDiagnosticsReport()` - 获取报告
- `ClearCache()` - 清缓存

**Doctor**（新）：
- `RunDoctorChecks()` - 自检
- `RunDoctorRepair(checkId)` - 修复

**Notifications**（新）：
- `RequestNotificationPermission()` - 请求权限
- `ShowNotification(title, body)` - 显示

### 5.3 事件流扩展

现有事件（16 种）已足够。新增事件 kind：

| 新增 kind | 触发场景 | 载荷 |
|----------|----------|------|
| `pty_output` | PTY 数据 | `{ ptyId, data }` |
| `pty_exit` | PTY 退出 | `{ ptyId, exitCode }` |
| `team_event` | Team 状态变化 | `{ team, member?, kind, ... }` |
| `scheduled_run_started` | 任务开始 | `{ taskId, runId }` |
| `scheduled_run_done` | 任务完成 | `{ taskId, runId, status, output }` |
| `notification` | 系统通知 | `{ title, body, level }` |
| `diagnostics_update` | 诊断更新 | `{ checkId, status, message }` |
| `oauth_callback` | OAuth 回调 | `{ provider, code, state }` |

**payload 字段**（`WireEvent`）：
```typescript
export interface WireEvent {
  kind: EventKind;
  // 已有
  text?: string;
  reasoning?: string;
  level?: "info" | "warn";
  tool?: WireTool;
  usage?: WireUsage;
  approval?: WireApproval;
  ask?: WireAsk;
  compaction?: WireCompaction;
  err?: string;
  retryAttempt?: number;
  retryMax?: number;
  // 新增
  ptyId?: string;
  ptyData?: string;
  ptyExitCode?: number;
  team?: string;
  teamMember?: string;
  teamKind?: string;
  taskId?: string;
  runId?: string;
  runOutput?: string;
  notificationTitle?: string;
  notificationBody?: string;
  checkId?: string;
  checkStatus?: string;
  checkMessage?: string;
  oauthProvider?: string;
  oauthCode?: string;
}
```

### 5.4 类型契约（types.ts）扩展

```typescript
// 新增 Phase 2
export interface TabState {
  openTabs: Array<{ sessionId: string; title: string; type: TabType }>;
  activeTabId: string | null;
}

export type TabType = "session" | "settings" | "scheduled" | "terminal" | "browser";

export interface ProjectInfo {
  path: string;
  name: string;
  sessionCount: number;
  lastActivityAt: number;
  totalTurns: number;
}

// 新增 Phase 3
export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  scope: "global" | "project";
  config?: Record<string, unknown>;
}

export interface SkillDetail {
  name: string;
  description: string;
  body: string;
  scope: "builtin" | "project" | "user" | "global" | "custom";
  runAs: "inline" | "subagent";
  path?: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  schedule: string; // cron expression
  prompt: string;
  enabled: boolean;
  lastRun?: { at: number; status: "success" | "failed" | "running"; output?: string };
}

// 新增 Phase 4
export interface PtyInfo {
  id: string;
  cwd: string;
  cols: number;
  rows: number;
  alive: boolean;
  exitCode?: number;
}

export interface TeamSummary {
  name: string;
  description?: string;
  members: number;
  status: "active" | "paused" | "stopped";
  createdAt: number;
}

export interface TeamDetail extends TeamSummary {
  members: Array<{
    id: string;
    name: string;
    role: string;
    status: "idle" | "running" | "error";
  }>;
}

// 新增 Phase 5
export interface OAuthStatus {
  provider: "claude" | "chatgpt";
  status: "disconnected" | "connecting" | "connected" | "expired";
  accountEmail?: string;
  expiresAt?: number;
}

export interface DiagnosticsReport {
  ok: boolean;
  checks: Array<{
    id: string;
    name: string;
    status: "pass" | "fail" | "warn";
    message: string;
    fixable: boolean;
  }>;
}
```

---

## 六、前端组件扩展设计

### 6.1 新增组件清单

#### Phase 1 新增

| 组件 | 文件路径 | 职责 |
|------|----------|------|
| `AppShell` | `src/components/AppShell.tsx` | 整合层（Sidebar + TabBar + ContentRouter） |
| `TabBar` | `src/components/TabBar.tsx` | 多 Tab UI |
| `ContentRouter` | `src/components/ContentRouter.tsx` | 路由分发 |
| `Sidebar`（升级）| `src/components/Sidebar.tsx` | 项目化 Sidebar |

#### Phase 2 新增

| 组件 | 文件路径 | 职责 |
|------|----------|------|
| `SettingsLayout` | `src/components/settings/SettingsLayout.tsx` | 设置 2 栏布局 |
| `GeneralSettings` | `src/components/settings/GeneralSettings.tsx` | 通用 |
| `ModelsSettings` | `src/components/settings/ModelsSettings.tsx` | 模型 |
| `ProvidersSettings` | `src/components/settings/ProvidersSettings.tsx` | Provider |
| `McpSettingsPage` | `src/components/settings/McpSettingsPage.tsx` | MCP（独立） |
| `PluginsSettings` | `src/components/settings/PluginsSettings.tsx` | Plugins（独立） |
| `SkillsSettings` | `src/components/settings/SkillsSettings.tsx` | Skills（独立） |
| `MemorySettingsPage` | `src/components/settings/MemorySettingsPage.tsx` | Memory（独立） |
| `RulesSettings` | `src/components/settings/RulesSettings.tsx` | 规则 |
| `BillingSettings` | `src/components/settings/BillingSettings.tsx` | 账单 |
| `ShortcutsSettings` | `src/components/settings/ShortcutsSettings.tsx` | 快捷键 |
| `AdvancedSettings` | `src/components/settings/AdvancedSettings.tsx` | 高级 |
| `NetworkSettings` | `src/components/settings/NetworkSettings.tsx` | 网络 |
| `SandboxSettings` | `src/components/settings/SandboxSettings.tsx` | 沙盒 |
| `CommandPalette` | `src/components/CommandPalette.tsx` | 命令面板 |
| `JumpBar` | `src/components/JumpBar.tsx` | 快速跳转 |
| `ToastContainer` | `src/components/ToastContainer.tsx` | 全局通知 |
| `Toast` | `src/components/Toast.tsx` | 单个通知 |

#### Phase 3 新增

| 组件 | 文件路径 | 职责 |
|------|----------|------|
| `McpSettings`（升级）| `src/components/McpSettings.tsx` | 拆分自 CapabilitiesPanel |
| `PluginList` | `src/components/plugins/PluginList.tsx` | 插件列表 |
| `PluginDetail` | `src/components/plugins/PluginDetail.tsx` | 插件详情 |
| `SkillList`（升级）| `src/components/skills/SkillList.tsx` | 拆分自 CapabilitiesPanel |
| `SkillDetail` | `src/components/skills/SkillDetail.tsx` | 技能详情 |
| `MemoryEditor` | `src/components/memory/MemoryEditor.tsx` | 记忆编辑 |
| `ScheduledTasks` | `src/components/scheduled/ScheduledTasks.tsx` | 计划任务 |
| `NewTaskModal` | `src/components/scheduled/NewTaskModal.tsx` | 新建任务 |
| `TaskRow` | `src/components/scheduled/TaskRow.tsx` | 任务行 |
| `TaskRunsPanel` | `src/components/scheduled/TaskRunsPanel.tsx` | 运行历史 |
| `DayOfWeekPicker` | `src/components/scheduled/DayOfWeekPicker.tsx` | 周日选择器 |

#### Phase 4 新增

| 组件 | 文件路径 | 职责 |
|------|----------|------|
| `TerminalPanel` | `src/components/terminal/TerminalPanel.tsx` | 终端面板 |
| `TerminalChrome` | `src/components/terminal/TerminalChrome.tsx` | 终端壳 |
| `WorkspacePanel`（升级）| `src/components/WorkspacePanel.tsx` | 多模式 |
| `BrowserPanel` | `src/components/browser/BrowserPanel.tsx` | iframe 浏览器 |
| `BrowserAddressBar` | `src/components/browser/BrowserAddressBar.tsx` | 地址栏 |
| `MermaidRenderer` | `src/components/markdown/MermaidRenderer.tsx` | Mermaid |
| `ImageGalleryModal` | `src/components/media/ImageGalleryModal.tsx` | 图片浏览 |
| `InlineImageGallery` | `src/components/media/InlineImageGallery.tsx` | 内联图集 |
| `InlineVideoGallery` | `src/components/media/InlineVideoGallery.tsx` | 内联视频 |
| `AgentTeams` | `src/components/teams/AgentTeams.tsx` | Teams 主页 |
| `TeamList` | `src/components/teams/TeamList.tsx` | Teams 列表 |
| `TeamDetail` | `src/components/teams/TeamDetail.tsx` | Team 详情 |
| `TeamStatusBar` | `src/components/teams/TeamStatusBar.tsx` | Team 状态栏 |

#### Phase 5 新增

| 组件 | 文件路径 | 职责 |
|------|----------|------|
| `ClaudeOfficialLogin` | `src/components/auth/ClaudeOfficialLogin.tsx` | Claude OAuth |
| `ChatGPTOfficialLogin` | `src/components/auth/ChatGPTOfficialLogin.tsx` | ChatGPT OAuth |
| `DiagnosticsPanel` | `src/components/doctor/DiagnosticsPanel.tsx` | 诊断 |
| `DoctorPanel` | `src/components/doctor/DoctorPanel.tsx` | 自检 |
| `MobileBottomSheet` | `src/components/mobile/MobileBottomSheet.tsx` | 移动端底栏 |
| `H5ConnectionView` | `src/components/mobile/H5ConnectionView.tsx` | H5 视图 |
| `WindowControls` | `src/components/system/WindowControls.tsx` | 自定义窗口按钮 |
| `NotificationManager` | `src/components/system/NotificationManager.tsx` | 通知管理 |

### 6.2 现有组件升级

| 组件 | 升级内容 |
|------|----------|
| [App.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/App.tsx) | 简化为 `<AppShell />` 入口 |
| [Composer.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/Composer.tsx) | 增加拖拽附件（已有 `onFilesDropped`）增强、增强 slash 菜单 |
| [SettingsPanel.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/SettingsPanel.tsx) | 拆分为多页 + Sidebar 导航 |
| [CapabilitiesPanel.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/CapabilitiesPanel.tsx) | 拆分为 McpSettings + PluginList + SkillList |
| [MemoryPanel.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/MemoryPanel.tsx) | 升级为完整 Memory Editor |
| [WorkspacePanel.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/WorkspacePanel.tsx) | 升级为多模式（workspace/workbench）|
| [StatusBar.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/StatusBar.tsx) | 增强：cache hit rate indicator |
| [Welcome.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/Welcome.tsx) | 增强：项目化欢迎页 |
| [Message.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/Message.tsx) | 增强：Mermaid 嵌入、Image Gallery 嵌入 |

### 6.3 复用 cc-haha 组件的策略

**直接复用**（无修改）：
- 简单展示组件（Button / Input / Dropdown / Modal）→ 自实现
- 图标库 → 沿用 lucide-react
- 列表项组件 → 自实现

**借鉴实现**（参考 cc-haha 设计）：
- `MermaidRenderer` → 参考 [MermaidRenderer.tsx](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/components/chat/MermaidRenderer.tsx) 实现（DOMPurify 安全 + 缩放/拖动）
- `TabBar` → 参考 [TabBar.tsx](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/components/layout/TabBar.tsx) 实现（拖拽 + 右键菜单）
- `CommandPalette` → 参考 [CommandPalette](file:///e:/DeepCode/DeepMiCode-Reasonix-v0.53.0/desktop/src/CommandPalette.tsx) 实现
- `ScheduledTasks` → 参考 [ScheduledTasks](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/pages/ScheduledTasks.tsx) + [cronDescribe](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/lib/cronDescribe.ts) 实现

**不直接复用**（架构差异）：
- `tabStore` / `chatStore` / `teamStore`（Zustand 模式）→ 改用 useSyncExternalStore + React Context
- `websocket.ts`（WebSocket 客户端）→ 不需要（Wails EventsEmit 已替代）
- `preview-agent`（独立 Bun 子进程）→ 评估：若必需则用 Go 子进程

---

## 七、适配层设计

### 7.1 现有适配层（已实现）

| 适配层 | 文件 | 职责 |
|--------|------|------|
| **Wails API 绑定** | [bridge.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/bridge.ts) | Proxy + dev mock |
| **事件订阅** | `onEvent` / `onUpdaterProgress` / `onFilesDropped` / `onReady` | 4 类事件 |
| **状态机** | [useController.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/useController.ts) | 状态 reducer |
| **i18n** | [i18n.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/i18n.tsx) + [locales/](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/locales/) | en/zh |
| **主题** | [theme.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/theme.ts) | auto/light/dark + style 变量 |
| **Dev mock** | `makeMockApp()` in bridge.ts | 浏览器模式 mock |

### 7.2 新增适配层

#### 7.2.1 TabStore（[lib/tabStore.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/tabStore.ts) 新建）

```typescript
import { useSyncExternalStore } from 'react';

export type TabType = "session" | "settings" | "scheduled" | "terminal" | "browser";

export interface Tab {
  id: string;
  type: TabType;
  title: string;
  meta?: Record<string, unknown>;
}

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
}

class TabStoreImpl {
  private state: TabState = { tabs: [], activeTabId: null };
  private listeners = new Set<() => void>();
  
  getState = () => this.state;
  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };
  
  openTab = (id: string, type: TabType, title: string, meta?: Record<string, unknown>) => {
    const existing = this.state.tabs.find(t => t.id === id);
    if (existing) {
      this.setState({ activeTabId: id });
    } else {
      this.setState({
        tabs: [...this.state.tabs, { id, type, title, meta }],
        activeTabId: id,
      });
    }
    this.persist();
  };
  
  closeTab = (id: string) => {
    const idx = this.state.tabs.findIndex(t => t.id === id);
    if (idx < 0) return;
    
    const tabs = this.state.tabs.filter(t => t.id !== id);
    let activeTabId = this.state.activeTabId;
    if (activeTabId === id) {
      if (tabs.length === 0) activeTabId = null;
      else if (idx >= tabs.length) activeTabId = tabs[tabs.length - 1].id;
      else activeTabId = tabs[idx].id;
    }
    this.setState({ tabs, activeTabId });
    this.persist();
  };
  
  setActive = (id: string) => {
    this.setState({ activeTabId: id });
    this.persist();
  };
  
  renameTab = (id: string, title: string) => {
    this.setState({
      tabs: this.state.tabs.map(t => t.id === id ? { ...t, title } : t),
    });
    this.persist();
  };
  
  reorderTab = (fromIdx: number, toIdx: number) => {
    const tabs = [...this.state.tabs];
    const [moved] = tabs.splice(fromIdx, 1);
    tabs.splice(toIdx, 0, moved);
    this.setState({ tabs });
    this.persist();
  };
  
  private setState(partial: Partial<TabState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach(l => l());
  }
  
  private persist() {
    try {
      localStorage.setItem('deepmycode.tab.state', JSON.stringify({
        tabs: this.state.tabs,
        activeTabId: this.state.activeTabId,
      }));
    } catch { /* noop */ }
  }
  
  restore() {
    try {
      const raw = localStorage.getItem('deepmycode.tab.state');
      if (!raw) return;
      const data = JSON.parse(raw);
      this.state = { tabs: data.tabs || [], activeTabId: data.activeTabId || null };
      this.listeners.forEach(l => l());
    } catch { /* noop */ }
  }
}

export const tabStore = new TabStoreImpl();

export function useTabState() {
  return useSyncExternalStore(tabStore.subscribe, tabStore.getState);
}
```

#### 7.2.2 ToastStore（[lib/toastStore.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/toastStore.ts) 新建）

```typescript
import { useSyncExternalStore } from 'react';

export interface Toast {
  id: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  durationMs?: number;
  action?: { label: string; onClick: () => void };
}

class ToastStoreImpl {
  private toasts: Toast[] = [];
  private listeners = new Set<() => void>();
  
  getState = () => this.toasts;
  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };
  
  add = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    this.toasts = [...this.toasts, { ...toast, id }];
    this.listeners.forEach(l => l());
    if (toast.durationMs !== 0) {
      setTimeout(() => this.dismiss(id), toast.durationMs ?? 3000);
    }
    return id;
  };
  
  dismiss = (id: string) => {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.listeners.forEach(l => l());
  };
}

export const toastStore = new ToastStoreImpl();

export function useToasts() {
  return useSyncExternalStore(toastStore.subscribe, toastStore.getState);
}
```

#### 7.2.3 BrowserStore（[lib/browserStore.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/browserStore.ts) 新建）

```typescript
import { useSyncExternalStore } from 'react';

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  history: string[];
  historyIdx: number;
}

class BrowserStoreImpl {
  // 类同 TabStore，省略
}

export const browserStore = new BrowserStoreImpl();
```

#### 7.2.4 TerminalStore（[lib/terminalStore.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/terminalStore.ts) 新建）

```typescript
import { useSyncExternalStore } from 'react';

export interface TerminalTab {
  id: string;
  cwd: string;
  ptyId?: string;
  title: string;
}

class TerminalStoreImpl {
  // 类同 TabStore
}
```

#### 7.2.5 I18n 扩展（[locales/en.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/locales/en.ts) + [zh.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/locales/zh.ts)）

增加新组件对应的词条：

```typescript
// en.ts 新增
{
  tabBar: {
    newTab: 'New tab',
    closeTab: 'Close tab',
    closeOthers: 'Close others',
    closeAll: 'Close all',
    pinTab: 'Pin tab',
    scheduled: 'Scheduled',
    settings: 'Settings',
    terminal: 'Terminal',
  },
  sidebar: {
    projects: 'Projects',
    sessions: 'Sessions',
    newSession: 'New session',
    batchDelete: 'Batch delete',
    search: 'Search sessions...',
    organizeBy: 'Organize by',
    sortBy: 'Sort by',
    byProject: 'By project',
    byRecent: 'By recent',
    byTime: 'By time',
    createdAt: 'Created at',
    updatedAt: 'Updated at',
  },
  settings: {
    // 已有基础上增加子页标签
    pages: {
      general: 'General',
      models: 'Models',
      providers: 'Providers',
      mcp: 'MCP',
      plugins: 'Plugins',
      skills: 'Skills',
      memory: 'Memory',
      rules: 'Rules',
      network: 'Network',
      sandbox: 'Sandbox',
      billing: 'Billing',
      shortcuts: 'Shortcuts',
      advanced: 'Advanced',
    },
  },
  terminal: {
    newTerminal: 'New terminal',
    closeTerminal: 'Close terminal',
    cwd: 'Working directory',
  },
  browser: {
    addressBar: 'Enter URL',
    back: 'Back',
    forward: 'Forward',
    reload: 'Reload',
  },
  // ...
}
```

#### 7.2.6 主题扩展（[lib/theme.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/theme.ts)）

```typescript
// 新增 layout 主题变量
export const THEME_VARS = {
  '--color-sidebar': 'var(--color-surface-alt)',
  '--color-sidebar-active': 'var(--color-brand-soft)',
  '--color-tab-active': 'var(--color-brand)',
  '--color-tab-inactive': 'var(--color-text-muted)',
  '--color-terminal-bg': 'var(--color-bg-alt)',
  '--color-browser-bg': '#ffffff', // iframe 背景
  // ...
};
```

### 7.3 桥接层（Go ↔ TS）

**现有桥**（已实现，无需改）：
- `app.go` `App` struct → 自动生成 `window.go.main.App`
- `eventSink` → `runtime.EventsEmit(ctx, "agent:event", wireEvent)`
- 前端 `bridge.ts` Proxy + `onEvent` 订阅

**新增桥**（按阶段）：
- `tabs_app.go`（新）→ 暴露 Tab 状态查询（其实纯前端 localStorage，无需新桥）
- `projects_app.go`（新）→ `ListProjects` / `GetProjectStats`
- `pty_app.go`（新）→ `OpenPty` / `WritePty` / `ResizePty` / `ClosePty`
- `teams_app.go`（新）→ Team CRUD
- `scheduled_app.go`（新）→ Scheduled Task CRUD
- `oauth_app.go`（新）→ OAuth 流程
- `diagnostics_app.go`（新）→ 诊断

**事件桥**（按阶段）：
- `pty:output` / `pty:exit`（PTY 流）
- `team:event`（Team 状态）
- `scheduled:run_started` / `scheduled:run_done`
- `notification`（系统通知）
- `diagnostics:update`
- `oauth:callback`

---

## 八、分阶段实施计划

### 8.1 总览

| 阶段 | 主题 | 工作量 | 验收 |
|------|------|--------|------|
| **Phase 1** | 最小可跑通：Chat + Sidebar | 2-3 周 | 启动应用能完整对话 1 次 |
| **Phase 2** | 核心 UI 完整化 | 3-4 周 | 多 Tab + 完整 Settings + Composer 增强 |
| **Phase 3** | 能力 UI 独立页 | 2-3 周 | MCP/Plugins/Skills/Memory/Tasks 独立管理 |
| **Phase 4** | 高级 UI | 3-4 周 | Terminal + Browser + Teams + Mermaid |
| **Phase 5** | 扩展 & 打磨 | 2-3 周 | OAuth + Diagnostics + Doctor + 通知 + 测试 |
| **总计** | | **12-17 周** | 产品级桌面体验 |

### 8.2 Phase 1 详细任务分解（2-3 周）

**目标**：建立 AppShell 架构，验证多 Tab + 路由分发的可行性，跑通一次端到端对话

#### Task 1.1: 建立 AppShell 骨架（1-2 天）

**Files**:
- Create: `desktop/frontend/src/components/AppShell.tsx`
- Create: `desktop/frontend/src/components/ContentRouter.tsx`
- Modify: `desktop/frontend/src/App.tsx`（替换为 `<AppShell />`）

**Steps**:
1. 编写失败测试：`AppShell.test.tsx` 验证挂载
2. 实现 AppShell：Sidebar + Main（ContentRouter 占位）
3. 编写 ContentRouter：根据 activeTab 渲染不同页面
4. 验证：跑通浏览器 dev 模式

**验收**：`pnpm dev` 启动后看到 Sidebar + 空 Chat 区域

#### Task 1.2: 建立 TabStore（1-2 天）

**Files**:
- Create: `desktop/frontend/src/lib/tabStore.ts`
- Create: `desktop/frontend/src/lib/tabStore.test.ts`

**Steps**:
1. 编写失败测试：openTab / closeTab / setActive / persist
2. 实现 TabStoreImpl（useSyncExternalStore + localStorage）
3. 编写 useTabState hook
4. 验证：浏览器 dev 模式可打开/关闭 Tab 并刷新后保持

**验收**：单元测试通过，浏览器可见状态变化

#### Task 1.3: 实现 TabBar UI（2-3 天）

**Files**:
- Create: `desktop/frontend/src/components/TabBar.tsx`
- Create: `desktop/frontend/src/components/TabBar.test.tsx`

**Steps**:
1. 编写失败测试：TabBar 渲染、点击、关闭按钮、右键菜单
2. 实现 TabBar：水平滚动 Tab + 关闭按钮 + 拖拽（基础版）
3. 集成 tabStore
4. 验证：可打开/关闭/切换 Tab

**验收**：UI 与设计一致，键盘快捷键工作

#### Task 1.4: 升级 Sidebar 为项目化（2-3 天）

**Files**:
- Create: `desktop/frontend/src/lib/sidebarStore.ts`
- Create: `desktop/frontend/src/components/Sidebar.tsx`
- Modify: `desktop/frontend/src/App.tsx`（集成新 Sidebar）

**Steps**:
1. 编写失败测试：会话列表渲染、搜索过滤、批量选择
2. 实现 SidebarStore（侧栏状态）
3. 实现 Sidebar：项目分组、搜索框、会话项、批量操作
4. 集成 `app.ListSessions` / `app.DeleteSession`
5. 验证：浏览器 dev 看到 mock 会话列表，可删除/搜索

**验收**：UI 与 cc-haha Sidebar 类似基本功能

#### Task 1.5: 端到端对话验证（1 天）

**Files**:
- Modify: `desktop/frontend/src/components/ContentRouter.tsx`
- Modify: `desktop/frontend/src/components/Composer.tsx`（验证拖拽附件）

**Steps**:
1. 验证 Composer / Transcript / Message 流
2. 验证 Submit / Cancel 流程
3. 验证 Approval / Ask 模态
4. 验证 Status Bar 上下文

**验收**：Wails `wails dev` 启动后能完成一次完整对话

#### Task 1.6: Phase 1 收尾（0.5 天）

- 编写 e2e 测试（手动清单）
- 更新 README
- Commit + Push

### 8.3 Phase 2 详细任务分解（3-4 周）

#### Task 2.1: 完整 Settings 20+ 页（7-10 天）

**Files**:
- Create: `desktop/frontend/src/components/settings/SettingsLayout.tsx`
- Create: `desktop/frontend/src/components/settings/*Settings.tsx`（12+ 文件）
- Modify: `desktop/frontend/src/components/SettingsPanel.tsx`（拆分为多页 + Sidebar 导航）

**Steps**:
1. 编写 SettingsLayout（左侧导航 + 右侧内容）
2. 逐页实现 12+ 设置子页（General / Models / Providers / MCP / Plugins / Skills / Memory / Rules / Network / Sandbox / Billing / Shortcuts / Advanced）
3. 复用现有 [SettingsPanel](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/components/SettingsPanel.tsx) 中的逻辑

**验收**：所有 12+ 设置子页可用，配置变更实时生效

#### Task 2.2: Composer 增强（3-4 天）

**Files**:
- Modify: `desktop/frontend/src/components/Composer.tsx`
- Modify: `desktop/frontend/src/components/ArgMenu.tsx`
- Modify: `desktop/frontend/src/components/SlashMenu.tsx`

**Steps**:
1. 增加拖拽附件（已有 `onFilesDropped`，需 UI 反馈）
2. 增强 @ 弹窗：跨文件搜索
3. 增强 slash 弹窗：嵌套参数提示
4. 增加 quick-add 记忆（输入 `# note`）

**验收**：Composer 支持拖拽文件、@ 文件、/ 命令、# 记忆

#### Task 2.3: 项目 API 扩展（Go 端，2-3 天）

**Files**:
- Create: `desktop/projects_app.go`
- Create: `desktop/projects_app_test.go`

**Steps**:
1. 实现 `ListProjects()` 聚合项目信息
2. 实现 `GroupSessionsByProject()`
3. 实现 `SearchSessions(query)`
4. 实现 `BatchDeleteSessions(paths)`
5. 单元测试

**验收**：所有方法在 `bridge.ts` 暴露并测试通过

#### Task 2.4: 端到端验证（1 天）

- 手动跑通 Settings 全部 12+ 页
- 手动验证 Composer 全部功能
- 回归测试

### 8.4 Phase 3 详细任务分解（2-3 周）

#### Task 3.1: MCP 独立页（2-3 天）

**Files**:
- Create: `desktop/frontend/src/components/McpSettings.tsx`（升级版）
- Create: `desktop/frontend/src/components/mcp/McpServerList.tsx`
- Create: `desktop/frontend/src/components/mcp/McpServerDetail.tsx`

**Steps**:
1. 拆分 CapabilitiesPanel 中的 MCP 部分
2. 实现 MCP Server 列表 + 详情 + 日志
3. 复用现有 `AddMCPServer` / `RemoveMCPServer` / `SetMCPServerEnabled` 等
4. 增加 `GetMCPServerDetail` / `TestMCPServer`（如需）

#### Task 3.2: Plugins 独立页（2-3 天）

**Files**:
- Create: `desktop/frontend/src/components/plugins/PluginList.tsx`
- Create: `desktop/frontend/src/components/plugins/PluginDetail.tsx`
- Create: `desktop/plugins_app.go`
- Create: `desktop/plugins_app_test.go`

**Steps**:
1. Go 端实现 `ListPlugins` / `InstallPlugin` / `UninstallPlugin` / `EnablePlugin` / `GetPluginConfig` / `SetPluginConfig`
2. 前端实现 PluginList + PluginDetail
3. 单元测试

#### Task 3.3: Skills 独立页（2-3 天）

**Files**:
- Create: `desktop/frontend/src/components/skills/SkillList.tsx`
- Create: `desktop/frontend/src/components/skills/SkillDetail.tsx`
- Modify: `desktop/skill_app.go`（已有部分，需扩展 `GetSkill` / `RunSkill` / `CreateSkill` / `EditSkill` / `DeleteSkill`）

**Steps**:
1. Go 端扩展 Skill API
2. 前端实现 SkillList + SkillDetail
3. 单元测试

#### Task 3.4: Memory 独立页（2-3 天）

**Files**:
- Modify: `desktop/frontend/src/components/MemoryPanel.tsx`
- Create: `desktop/frontend/src/components/memory/MemoryEditor.tsx`
- Create: `desktop/frontend/src/components/memory/MemoryDocList.tsx`
- Modify: `desktop/memory_app.go`（已有 Memory / Remember / Forget / SaveDoc）

**Steps**:
1. 升级 MemoryPanel 为完整 Editor
2. 集成 Doc List + 搜索 + 统计
3. 单元测试

#### Task 3.5: Scheduled Tasks（4-5 天）

**Files**:
- Create: `desktop/frontend/src/components/scheduled/ScheduledTasks.tsx`
- Create: `desktop/frontend/src/components/scheduled/NewTaskModal.tsx`
- Create: `desktop/frontend/src/components/scheduled/TaskRow.tsx`
- Create: `desktop/frontend/src/components/scheduled/TaskRunsPanel.tsx`
- Create: `desktop/frontend/src/components/scheduled/DayOfWeekPicker.tsx`
- Create: `desktop/frontend/src/lib/cronDescribe.ts`
- Create: `desktop/scheduled_app.go`
- Create: `desktop/scheduled_app_test.go`

**Steps**:
1. Go 端实现 Scheduled Tasks API
2. 前端实现 UI（参考 cc-haha）
3. 实现 cron 描述（参考 [cronDescribe.ts](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/lib/cronDescribe.ts)）
4. 单元测试

### 8.5 Phase 4 详细任务分解（3-4 周）

#### Task 4.1: Terminal Panel（5-6 天）

**Files**:
- Create: `internal/pty/pty.go`（Go 端 PTY 服务）
- Create: `internal/pty/pty_unix.go` / `pty_windows.go`
- Create: `desktop/pty_app.go`
- Create: `desktop/pty_app_test.go`
- Create: `desktop/frontend/src/lib/terminalStore.ts`
- Create: `desktop/frontend/src/components/terminal/TerminalPanel.tsx`
- Create: `desktop/frontend/src/components/terminal/TerminalChrome.tsx`
- Modify: `desktop/frontend/package.json`（添加 `@xterm/xterm` + `@xterm/addon-fit`）

**Steps**:
1. Go 端实现 PTY 服务（基于 `creack/pty`）
2. Wails 事件 `pty:output` / `pty:exit`
3. 前端集成 xterm.js
4. 单元测试

**验收**：可打开 Terminal 标签页执行命令

#### Task 4.2: Browser Panel（4-5 天）

**Files**:
- Create: `desktop/frontend/src/components/browser/BrowserPanel.tsx`
- Create: `desktop/frontend/src/components/browser/BrowserAddressBar.tsx`
- Create: `desktop/frontend/src/lib/browserStore.ts`

**Steps**:
1. 实现 BrowserPanel（iframe + 地址栏 + 后退/前进）
2. 实现 BrowserStore（URL 历史、收藏）
3. 实现 postMessage 桥（用于链接点击拦截）
4. 单元测试

**验收**：可打开 Browser 标签页浏览 URL

#### Task 4.3: Workspace Panel 多模式（3-4 天）

**Files**:
- Modify: `desktop/frontend/src/components/WorkspacePanel.tsx`
- Create: `desktop/frontend/src/components/workspace/WorkspaceMode.tsx`
- Create: `desktop/frontend/src/components/workspace/WorkbenchMode.tsx`

**Steps**:
1. 实现 Workspace 模式（已有，升级）
2. 实现 Workbench 模式（嵌入 Vite WebView）
3. 实现模式切换

**验收**：Workspace 面板支持两种模式

#### Task 4.4: Mermaid 渲染（1-2 天）

**Files**:
- Create: `desktop/frontend/src/components/markdown/MermaidRenderer.tsx`
- Modify: `desktop/frontend/src/components/Markdown.tsx`
- Modify: `desktop/frontend/package.json`（添加 `mermaid` + `dompurify`）

**Steps**:
1. 实现 Mermaid 渲染（DOMPurify + mermaid）
2. 集成到 Markdown 渲染

**验收**：聊天中 ```` ```mermaid ```` 代码块渲染为图表

#### Task 4.5: Image/Video Gallery（2-3 天）

**Files**:
- Create: `desktop/frontend/src/components/media/ImageGalleryModal.tsx`
- Create: `desktop/frontend/src/components/media/InlineImageGallery.tsx`
- Create: `desktop/frontend/src/components/media/InlineVideoGallery.tsx`

**Steps**:
1. 实现图片浏览（缩放/全屏）
2. 实现视频内联播放
3. 集成到 Message 组件

**验收**：附件中的图片/视频可正确显示

#### Task 4.6: Agent Teams（4-5 天）

**Files**:
- Create: `internal/teams/teams.go`（Go 端 Teams 协调）
- Create: `internal/teams/coordinator.go`
- Modify: `internal/agent/agent.go`（扩展为 Teams）
- Create: `desktop/teams_app.go`
- Create: `desktop/teams_app_test.go`
- Create: `desktop/frontend/src/components/teams/AgentTeams.tsx`
- Create: `desktop/frontend/src/components/teams/TeamList.tsx`
- Create: `desktop/frontend/src/components/teams/TeamDetail.tsx`
- Create: `desktop/frontend/src/components/teams/TeamStatusBar.tsx`

**Steps**:
1. Go 端实现 Teams 协调（基于 Coordinator 扩展）
2. Wails API 暴露
3. 前端 UI

**验收**：可创建 Team，Team 内多 Agent 协作

### 8.6 Phase 5 详细任务分解（2-3 周）

#### Task 5.1: OAuth 登录（2-3 天）

**Files**:
- Create: `internal/oauth/claude.go`
- Create: `internal/oauth/chatgpt.go`
- Create: `desktop/oauth_app.go`
- Create: `desktop/frontend/src/components/auth/ClaudeOfficialLogin.tsx`
- Create: `desktop/frontend/src/components/auth/ChatGPTOfficialLogin.tsx`

**Steps**:
1. Go 端实现 OAuth 流程
2. Wails API 暴露
3. 前端 UI（参考 cc-haha）

#### Task 5.2: Diagnostics / Doctor（2-3 天）

**Files**:
- Create: `internal/diagnostics/diagnostics.go`
- Create: `internal/diagnostics/doctor.go`
- Create: `desktop/diagnostics_app.go`
- Create: `desktop/frontend/src/components/doctor/DiagnosticsPanel.tsx`
- Create: `desktop/frontend/src/components/doctor/DoctorPanel.tsx`

#### Task 5.3: Notification / Window Controls（1-2 天）

**Files**:
- Create: `desktop/notifications_app.go`
- Create: `desktop/frontend/src/components/system/NotificationManager.tsx`
- Modify: `desktop/frontend/src/App.tsx`（集成）

#### Task 5.4: 测试覆盖（3-4 天）

- 为所有新增 store 写单测
- 为关键页面写集成测试
- 配置 Vitest + jsdom

#### Task 5.5: i18n 词条完整化（1-2 天）

- 补充所有新增组件的中英文词条
- 回归测试 i18n

#### Task 5.6: 跨平台验证（1-2 天）

- macOS / Windows / Linux 三端测试
- 修复平台特定问题

---

## 九、风险与缓解

### 9.1 P0 风险

| 风险 | 等级 | 影响 | 缓解 |
|------|------|------|------|
| **TabStore 持久化与 Wails 重启不一致** | 🔴 高 | 恢复会话时找不到对应项目 | 启动时从 `ListSessions` 校验，缺失则清理 Tab 状态 |
| **Sidebar 性能问题** | 🟡 中 | 大量会话时卡顿 | 虚拟列表（react-window 或自实现） |
| **SettingsPanel 拆分破坏现有逻辑** | 🟡 中 | 用户配置丢失 | 写迁移层，保留原 SettingsPanel 行为 |

### 9.2 P1 风险

| 风险 | 等级 | 影响 | 缓解 |
|------|------|------|------|
| **PTY 跨平台（Windows ConPTY）** | 🟡 中 | Windows 终端无法工作 | 用 `creack/pty` 库，自动处理平台差异 |
| **Mermaid 大图表渲染慢** | 🟢 低 | 阻塞 UI | 异步渲染 + 进度提示 |
| **Agent Teams 协调复杂** | 🟡 中 | 多代理冲突 | 复用 Coordinator + 加锁机制 |
| **Browser iframe 沙箱限制** | 🟡 中 | 部分网站无法嵌入 | 明确文档，fallback 到外链 |
| **OAuth 流程失败** | 🟢 低 | 无法登录官方 | 保留 API Key 登录方式 |

### 9.3 P2 风险

| 风险 | 等级 | 影响 | 缓解 |
|------|------|------|------|
| **测试覆盖率不足** | 🟡 中 | 重构易回归 | TDD 方式补充核心 store 测试 |
| **i18n 词条遗漏** | 🟢 低 | 部分 UI 英文 | 完整性检查 |
| **跨平台 UI 表现差异** | 🟢 低 | 视觉不一致 | CSS 标准化 |

### 9.4 关键技术难点

#### 9.4.1 Wails 多 WebView 限制

**问题**：Browser Panel 无法用 Wails 多 WebView（仅支持单一）

**解决方案**：iframe + postMessage 替代
- 安全性：sandbox 属性限制
- 限制：明确文档，避免嵌入需要原生能力的网站
- 未来：若 Wails 支持多 WebView，可平滑升级

#### 9.4.2 PTY 跨平台

**问题**：Windows 用 ConPTY，Unix 用 pty(7) 系统调用

**解决方案**：用 `creack/pty` 库（已被广泛验证）
- `internal/pty/pty.go` 提供统一接口
- `pty_unix.go` / `pty_windows.go` 平台特定实现
- `creack/pty` 库跨平台

#### 9.4.3 流式事件一致性

**问题**：Wails EventsEmit vs WebSocket 模式差异

**解决方案**：沿用现有 `eventSink` 抽象
- Go 端 `eventSink.Emit(wireEvent)` → `runtime.EventsEmit`
- 前端 `onEvent(cb)` 订阅
- 已有 16 种事件，新增只需扩展 `WireEvent` 类型

#### 9.4.4 状态同步

**问题**：cc-haha 用 Zustand 26 store，DeepMyCode 用 useController

**解决方案**：
- 核心状态（chat、controller）继续用 useController
- UI 状态（tab、toast、sidebar）用 useSyncExternalStore
- 避免引入 Zustand

---

## 十、验收标准

### 10.1 Phase 1 验收

- [ ] `wails dev` 启动应用
- [ ] 看到 Sidebar + TabBar + Chat 区域
- [ ] 可新建/打开/关闭 Tab
- [ ] 可进行 1 次端到端对话
- [ ] Tab 状态刷新后保持
- [ ] 单元测试覆盖率 > 80%（tabStore）

### 10.2 Phase 2 验收

- [ ] 12+ 设置子页全部可用
- [ ] Composer 支持拖拽附件
- [ ] Composer 支持 @ 文件搜索
- [ ] Composer 支持 / 命令嵌套
- [ ] Sidebar 按项目分组会话
- [ ] 会话支持搜索/批量删除

### 10.3 Phase 3 验收

- [ ] MCP 独立管理页可用
- [ ] Plugins 安装/卸载/配置
- [ ] Skills 浏览/详情/编辑
- [ ] Memory 文档编辑
- [ ] Scheduled Tasks 增删改查
- [ ] Cron 描述可读

### 10.4 Phase 4 验收

- [ ] Terminal Panel 可执行命令
- [ ] Browser Panel 可浏览 URL
- [ ] Workspace Panel 多模式
- [ ] Mermaid 图表正确渲染
- [ ] 图片/视频 Gallery 可用
- [ ] Agent Teams 多代理协作

### 10.5 Phase 5 验收

- [ ] Claude/ChatGPT OAuth 登录
- [ ] Diagnostics 自检
- [ ] Doctor 修复建议
- [ ] 系统通知
- [ ] 跨平台测试通过
- [ ] 单元测试覆盖率 > 70%
- [ ] i18n 词条完整

### 10.6 整体验收

- [ ] 三平台（macOS / Windows / Linux）均可启动
- [ ] 单二进制 < 50MB
- [ ] 启动时间 < 3 秒
- [ ] 内存占用 < 300MB（空闲）
- [ ] 与 cc-haha 功能对比 > 80%

---

## 十一、关键文件清单

### 11.1 新增 Go 端文件

```
desktop/
├── projects_app.go            (Phase 2)
├── projects_app_test.go
├── pty_app.go                 (Phase 4)
├── pty_app_test.go
├── teams_app.go               (Phase 4)
├── teams_app_test.go
├── scheduled_app.go           (Phase 3)
├── scheduled_app_test.go
├── plugins_app.go             (Phase 3)
├── plugins_app_test.go
├── skill_app.go               (Phase 3, 升级)
├── skill_app_test.go
├── memory_app.go              (Phase 3, 升级)
├── memory_app_test.go
├── oauth_app.go               (Phase 5)
├── oauth_app_test.go
├── diagnostics_app.go         (Phase 5)
├── diagnostics_app_test.go
└── notifications_app.go       (Phase 5)

internal/
├── pty/
│   ├── pty.go                 (Phase 4)
│   ├── pty_unix.go
│   ├── pty_windows.go
│   └── pty_test.go
├── teams/
│   ├── teams.go               (Phase 4)
│   ├── coordinator.go
│   └── teams_test.go
├── scheduled/
│   ├── scheduled.go           (Phase 3)
│   └── scheduled_test.go
├── plugins/
│   ├── plugins.go             (Phase 3)
│   └── plugins_test.go
├── oauth/
│   ├── claude.go              (Phase 5)
│   ├── chatgpt.go
│   └── oauth_test.go
└── diagnostics/
    ├── diagnostics.go         (Phase 5)
    ├── doctor.go
    └── diagnostics_test.go
```

### 11.2 新增前端文件

```
desktop/frontend/src/
├── components/
│   ├── AppShell.tsx                    (Phase 1)
│   ├── ContentRouter.tsx               (Phase 1)
│   ├── TabBar.tsx                      (Phase 1)
│   ├── Sidebar.tsx                     (Phase 1, 升级)
│   ├── CommandPalette.tsx              (Phase 2)
│   ├── JumpBar.tsx                     (Phase 2)
│   ├── ToastContainer.tsx              (Phase 2)
│   ├── Toast.tsx                       (Phase 2)
│   ├── settings/
│   │   ├── SettingsLayout.tsx          (Phase 2)
│   │   ├── GeneralSettings.tsx
│   │   ├── ModelsSettings.tsx
│   │   ├── ProvidersSettings.tsx
│   │   ├── McpSettingsPage.tsx
│   │   ├── PluginsSettings.tsx
│   │   ├── SkillsSettings.tsx
│   │   ├── MemorySettingsPage.tsx
│   │   ├── RulesSettings.tsx
│   │   ├── NetworkSettings.tsx
│   │   ├── SandboxSettings.tsx
│   │   ├── BillingSettings.tsx
│   │   ├── ShortcutsSettings.tsx
│   │   └── AdvancedSettings.tsx
│   ├── plugins/
│   │   ├── PluginList.tsx              (Phase 3)
│   │   └── PluginDetail.tsx
│   ├── skills/
│   │   ├── SkillList.tsx               (Phase 3)
│   │   └── SkillDetail.tsx
│   ├── memory/
│   │   ├── MemoryEditor.tsx            (Phase 3)
│   │   └── MemoryDocList.tsx
│   ├── scheduled/
│   │   ├── ScheduledTasks.tsx          (Phase 3)
│   │   ├── NewTaskModal.tsx
│   │   ├── TaskRow.tsx
│   │   ├── TaskRunsPanel.tsx
│   │   └── DayOfWeekPicker.tsx
│   ├── terminal/
│   │   ├── TerminalPanel.tsx           (Phase 4)
│   │   └── TerminalChrome.tsx
│   ├── browser/
│   │   ├── BrowserPanel.tsx            (Phase 4)
│   │   └── BrowserAddressBar.tsx
│   ├── markdown/
│   │   └── MermaidRenderer.tsx         (Phase 4)
│   ├── media/
│   │   ├── ImageGalleryModal.tsx       (Phase 4)
│   │   ├── InlineImageGallery.tsx
│   │   └── InlineVideoGallery.tsx
│   ├── teams/
│   │   ├── AgentTeams.tsx              (Phase 4)
│   │   ├── TeamList.tsx
│   │   ├── TeamDetail.tsx
│   │   └── TeamStatusBar.tsx
│   ├── auth/
│   │   ├── ClaudeOfficialLogin.tsx     (Phase 5)
│   │   └── ChatGPTOfficialLogin.tsx
│   ├── doctor/
│   │   ├── DiagnosticsPanel.tsx        (Phase 5)
│   │   └── DoctorPanel.tsx
│   ├── mobile/
│   │   ├── MobileBottomSheet.tsx       (Phase 5)
│   │   └── H5ConnectionView.tsx
│   └── system/
│       ├── WindowControls.tsx          (Phase 5)
│       └── NotificationManager.tsx
└── lib/
    ├── tabStore.ts                     (Phase 1)
    ├── tabStore.test.ts
    ├── sidebarStore.ts                 (Phase 1)
    ├── sidebarStore.test.ts
    ├── toastStore.ts                   (Phase 2)
    ├── toastStore.test.ts
    ├── terminalStore.ts                (Phase 4)
    ├── terminalStore.test.ts
    ├── browserStore.ts                 (Phase 4)
    ├── browserStore.test.ts
    ├── cronDescribe.ts                 (Phase 3)
    └── cronDescribe.test.ts
```

### 11.3 升级文件

```
desktop/frontend/src/
├── App.tsx                            (简化为 <AppShell />)
├── components/
│   ├── Composer.tsx                   (增强)
│   ├── Transcript.tsx                 (Mermaid 集成)
│   ├── Message.tsx                    (Mermaid/Gallery 集成)
│   ├── SettingsPanel.tsx              (拆分为多页)
│   ├── CapabilitiesPanel.tsx          (拆分为 MCP/Plugins/Skills)
│   ├── MemoryPanel.tsx                (升级为 Editor)
│   ├── WorkspacePanel.tsx             (多模式)
│   ├── StatusBar.tsx                  (增强)
│   ├── Welcome.tsx                    (项目化)
│   ├── McpSettings.tsx                (升级)
│   ├── ApprovalModal.tsx              (保持)
│   ├── AskCard.tsx                    (保持)
│   └── ...
└── lib/
    ├── bridge.ts                      (扩展)
    ├── types.ts                       (扩展新类型)
    ├── useController.ts               (增强)
    ├── theme.ts                       (扩展)
    ├── i18n.tsx                       (保持)
    ├── tools.ts                       (保持)
    ├── session.ts                     (保持)
    ├── layoutPreferences.ts           (扩展)
    └── ...

desktop/
├── app.go                             (扩展新方法)
├── wire.go                            (扩展新事件)
├── sessions.go                        (扩展)
├── settings_app.go                    (扩展)
├── workspace.go                       (扩展)
├── workspace_changes.go               (保持)
├── updater.go                         (保持)
├── updater_app.go                     (保持)
├── dotenv.go                          (保持)
└── main.go                            (保持)
```

### 11.4 关键参考文件

**DeepMyCode 现状**：
- [desktop/app.go](file:///e:/DeepCode/DeepMyCode/desktop/app.go) - 50+ 绑定方法
- [desktop/frontend/src/lib/bridge.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/bridge.ts) - Wails 绑定代理
- [desktop/frontend/src/lib/types.ts](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/lib/types.ts) - 类型契约
- [desktop/frontend/src/App.tsx](file:///e:/DeepCode/DeepMyCode/desktop/frontend/src/App.tsx) - 主应用
- [desktop/wire.go](file:///e:/DeepCode/DeepMyCode/desktop/wire.go) - 事件协议

**cc-haha 参考**：
- [cc-haha-0.3.2/desktop/src/components/layout/AppShell.tsx](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/components/layout/AppShell.tsx) - Shell 架构
- [cc-haha-0.3.2/desktop/src/components/layout/TabBar.tsx](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/components/layout/TabBar.tsx) - TabBar 实现
- [cc-haha-0.3.2/desktop/src/stores/tabStore.ts](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/stores/tabStore.ts) - Tab 状态
- [cc-haha-0.3.2/desktop/src/pages/Settings.tsx](file:///e:/DeepCode/cc-haha-0.3.2/desktop/src/pages/Settings.tsx) - 20+ 设置页

**上游参考**：
- [internal/control/controller.go](file:///e:/DeepCode/DeepMyCode/internal/control/controller.go) - 传输无关控制器
- [internal/boot/boot.go](file:///e:/DeepCode/DeepMyCode/internal/boot/boot.go) - 装配层

---

## 十二、附录

### 12.1 决策记录（ADR）

#### ADR-001: 保留 Wails 不迁移 Tauri
- **日期**：2026-06-04
- **状态**：已确认
- **背景**：cc-haha 用 Tauri v2 + Bun，DeepMyCode 用 Wails v2
- **决策**：保留 Wails
- **后果**：失去多 WebView（用 iframe 替代），但保留 Go 后端优势

#### ADR-002: 不引入 Zustand
- **日期**：2026-06-04
- **状态**：已确认
- **背景**：cc-haha 26 个 Zustand store
- **决策**：继续用 useController + 新增 useSyncExternalStore
- **后果**：状态模式与 cc-haha 差异大，但减少依赖

#### ADR-003: Browser Panel 用 iframe 替代
- **日期**：2026-06-04
- **状态**：已确认
- **背景**：Wails 不支持多 WebView
- **决策**：用 `<iframe>` + postMessage
- **后果**：无独立 cookie/缓存，但功能可实现

#### ADR-004: Computer Use 推迟
- **日期**：2026-06-04
- **状态**：已确认
- **背景**：平台特定，cgo 复杂
- **决策**：Phase 6+ 评估
- **后果**：当前不实现 Computer Use

#### ADR-005: 沿用 styles.css（不引入 Tailwind）
- **日期**：2026-06-04
- **状态**：已确认
- **背景**：现有 32 组件已稳定
- **决策**：保持手写 CSS 变量
- **后果**：减少依赖，但新组件需遵循现有 CSS 规范

### 12.2 术语表

| 术语 | 含义 |
|------|------|
| **Wails** | Go + WebView 桌面应用框架 |
| **Tauri** | Rust + WebView 桌面应用框架（cc-haha 用） |
| **Boot** | Go 端装配层，初始化 Controller |
| **Controller** | 传输无关的会话驱动 |
| **Coordinator** | 双模型/多代理协调器 |
| **PTY** | 伪终端（用于 Terminal Panel） |
| **WireEvent** | Wails 事件协议的数据结构 |
| **CapabilitiesPanel** | 现有 MCP + Skills 集成面板 |
| **Workbench** | 嵌入式 Vite WebView 模式 |

### 12.3 后续工作

1. **Phase 1 实施**：进入实施阶段
2. **设计文档评审**：核心开发评审本设计
3. **实施计划细化**：将每个 Phase 任务分解到日级别
4. **测试策略**：编写测试计划
5. **跨平台验证**：CI/CD 配置

---

## 十三、文档维护

- **文档所有者**：项目负责人
- **更新频率**：每 Phase 完成后更新
- **变更控制**：所有重大变更需通过 PR + Review

**下一步行动**：
1. 用户审阅本设计文档
2. 确认或调整设计细节
3. 进入实施阶段（编写实施计划 + 开始 Phase 1）
