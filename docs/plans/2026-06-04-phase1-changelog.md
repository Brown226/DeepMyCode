# DeepMyCode 桌面前端 Phase 1 变更记录

> 执行日期：2026-06-04
> 策略：渐进式改造，不修改现有 App.tsx，所有新组件独立创建

## 执行计划

| 步骤 | 内容 | 涉及文件 | 状态 |
|------|------|----------|------|
| Step 1 | Vitest 测试基础设施 | package.json, vite.config.ts, src/test/ | ✅ commit a2fd16b |
| Step 2 | tabStore + 测试 | src/lib/tabStore.ts, tabStore.test.ts | ✅ commit e70951a |
| Step 3 | sidebarStore + 测试 | src/lib/sidebarStore.ts, sidebarStore.test.ts | ✅ commit 3525ec0 |
| Step 4 | TabBar 组件 + 测试 + 样式 | src/components/TabBar.tsx, styles.css | ✅ commit 261ef10 |
| Step 5 | ContentRouter 骨架 | src/components/ContentRouter.tsx | ✅ commit d772911 |
| Step 6 | AppShell 骨架 | src/components/AppShell.tsx | ✅ commit d772911 |
| Step 7 | i18n 词条补全 | src/locales/en.ts, zh.ts | ✅ commit d772911 |

## 关键原则

1. **不修改 App.tsx** — 所有新组件独立创建，Phase 2 才做集成
2. **每步完成后 git commit** — 确保可回退
3. **测试优先** — 每个组件先写测试再实现
4. **现有功能不回退** — 桌面端始终可用

## 变更明细

### Step 1: Vitest 测试基础设施 (a2fd16b)
- 安装 vitest 2.1.9, @testing-library/react 16.3.2, @testing-library/jest-dom, @testing-library/user-event, happy-dom
- vite.config.ts 添加 test 配置（happy-dom 环境, NODE_ENV=test 解决 React act() 问题）
- package.json 添加 test/test:watch/test:coverage 脚本
- src/test/setup.ts: Wails runtime mock, cleanup
- src/test/smoke.test.tsx: 3 个 smoke test 验证基础设施

### Step 2: tabStore (e70951a)
- src/lib/tabStore.ts: useSyncExternalStore + localStorage 持久化
- 支持: openTab, closeTab, setActive, renameTab, reorderTab, closeAll, restore
- 15 个测试覆盖所有操作 + 持久化 + 订阅语义

### Step 3: sidebarStore (3525ec0)
- src/lib/sidebarStore.ts: 项目分组 + 搜索 + 批量选择 + 排序
- 支持: setGroups, toggleSelected, clearSelection, setSearch, setOrganizeBy, deriveVisibleGroups
- 8 个测试覆盖所有操作

### Step 4: TabBar (261ef10)
- src/components/TabBar.tsx: 多 Tab UI, per-type 图标, 关闭按钮, 右键菜单
- src/components/TabBar.test.tsx: 7 个测试
- styles.css: TabBar 样式（.tabbar, .tab, .tab-context-menu）

### Step 5-7: ContentRouter + AppShell + i18n (d772911)
- src/components/ContentRouter.tsx: Phase 1 直接渲染 children, Phase 2 做 Tab 路由
- src/components/AppShell.tsx: TabBar + children 布局壳, tabStore restore on mount
- src/locales/en.ts + zh.ts: 添加 tabBar 和 router 词条
- 这些组件未集成到 App.tsx, Phase 2 才做集成

## 测试汇总

| 文件 | 测试数 |
|------|--------|
| smoke.test.tsx | 3 |
| tabStore.test.ts | 15 |
| sidebarStore.test.ts | 8 |
| TabBar.test.tsx | 7 |
| **合计** | **33** |

## Git 提交记录

```
a2fd16b test(frontend): establish Vitest + Testing Library infrastructure
e70951a feat(frontend): add tabStore with localStorage persistence and 15 tests
3525ec0 feat(frontend): add sidebarStore with project grouping and search
261ef10 feat(frontend): add TabBar component with context menu and 7 tests
d772911 feat(frontend): add ContentRouter, AppShell skeleton, and i18n keys
```

## 注意事项

- App.tsx **未被修改** — 现有桌面端功能完全不受影响
- NODE_ENV=test 在 vite.config.ts 的 test.env 中配置, `pnpm test` 直接可用
- TabBar/ContentRouter/AppShell 已创建但未集成, 需要 Phase 2 才能看到效果
