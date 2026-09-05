# bluey-gesture-game

PM 工作流项目，目标是解决：

> 为 5 岁儿童设计并实现一个通过手势控制布鲁伊移动和动作、包含收集道具、躲避障碍与角色切换的儿童友好横版卷轴游戏

## 怎么继续

在 Claude Code 或 Codex 中打开本目录，然后说：

```text
继续推进这个 PM 工作流项目。
```

AI 应先读取 `workflow-state.md` 和 `CLAUDE.md` / `AGENTS.md`，再按当前阶段继续。

第一次继续前先检查环境：

```bash
npm run workflow:check-env
npm run workflow:validate-gates
```

如果检查失败，需要先安装完整 skill 目录。不要只复制 `SKILL.md`，包含 `scripts/`、`references/`、`assets/` 的 skill 必须整目录安装。

04B 静态 HTML 原型默认采用 `QA-LIGHT`，不需要浏览器级 Playwright 检查。只有用户要求、AI 发现具体浏览器风险，或进入正式完整验收时，才需要浏览器截图和 viewport 检查：

```bash
npm install
npm run workflow:ensure-browsers
```

Chromium 会安装到共享缓存 `~/.cache/pm-workflow/playwright-browsers`，同一台机器上的 PM 工作流项目会复用这一份浏览器，不会每个项目重复下载。需要改共享位置时，可设置 `PM_WORKFLOW_PLAYWRIGHT_BROWSERS_PATH`。

## 火线冲击首版

第四玩法已接入，详细进度、操作、测试与未验证边界见 [开发日志与交接](火线冲击-开发日志与交接.md)。

## 试玩当前 MVP

```bash
bash start.sh
```

浏览器访问 `http://127.0.0.1:36721/04B-prototype-手势小狗探险MVP.html`。详细操作、隐私边界与当前限制见 `试玩说明.md`。

最终交付范围与逐项证据见 `MVP-完成验收.md`。

## 素材说明

本仓库中的 Bluey / Bingo 角色素材仅用于非商业原型演示；相关角色、名称与商标权利归原权利人所有，本项目不主张相关权利。

## 标准产物

```text
01-research.md
01A-competitor-page-experience.md
02-architecture.html
03-feature-[模块名].md
04A-prototype-spec-[模块名].md
04B-prototype-[名称].html
05A-ai-persona-prototype-review-[名称].md
05A-ai-persona-findings-[名称].json
05B-pm-simulation-decision-[名称].md
```

每个阶段完成后，`pm-review-gate` 会生成轻量 `PM Review Slice`，并建议同步生成独立 Review Console：

```text
reviews/phase-[阶段]-review-data.json
reviews/phase-[阶段]-review.html
```

Review Console 用于让 PM 在网页中阅读关键材料、阶段关键信息可视化、决策卡和下游影响。第一版反馈只在浏览器本地填写并导出 JSON，不会自动写回 `workflow-state.md`。

04B 之后可使用 `ai-persona-prototype-review` 做一轮 AI 仿真用研。它只生成候选问题池，不是真实用户研究结论；PM 在 `05B-pm-simulation-decision-[名称].md` 中裁决为 `accept` 的 finding，才会进入 `pm-change-router`。

## 当前阶段

集成式可试玩 MVP 已完成 Phase 4B 实现与 QA-TARGETED，当前等待 PM Review Gate 确认。实时状态以 `workflow-state.md` 为准。

## 经验沉淀机制

本项目自带一套轻量规则治理文件：

- `cases/error-cases.md`：错误 case 库，只记录事实。
- `changes/change-log.md`：变更路由和执行过程记录。
- `rules/authority-sources.md`：规则来源等级和晋升门槛。
- `rules/rule-candidates.md`：规则候选隔离区，候选项默认不生效。
- `rules/active-rules.md`：已确认的当前项目规则。

出现返工或质量问题时，先写 error case；需要抽象规则时，先进入候选隔离区，确认后才进入 active rules。

这些文件是当前项目的经验回收区，不会自动更新已安装 skill。团队成员不要直接修改 `~/.claude/skills/` 或 Codex skills 安装目录；候选规则应在阶段复盘时提交给工作流维护者，由维护者在工作流仓库复审后发布新版 skill。

## 过程审查与变更回溯

- 每个阶段完成后使用 `pm-review-gate` 生成 `PM Review Slice`，并更新 `workflow-state.md` 的 Review Gates。
- 任何已有产物的修改请求先使用 `pm-change-router` 判断 L0-L4 回溯层级。
- 只有 L0 实现层问题直接改 HTML；L1 以上先改最早源真相文件，再向下游传播。
- 变更过程写入 `changes/change-log.md`，不要把正式产物变成历史流水。

## 项目级命令

```bash
npm run workflow:check-env
npm run workflow:validate-gates
npm run workflow:ensure-browsers
npm run workflow:design-search -- "[产品类型] [用户角色] [核心场景]" --design-system -f markdown -p "[原型名称]"
npm run workflow:validate-spec -- 04A-prototype-spec-[模块名].md
npm run workflow:render-review-console -- reviews/phase-[阶段]-review-data.json reviews/phase-[阶段]-review.html
npm run workflow:check-prototype -- 04B-prototype-[名称].html      # QA-TARGETED / QA-FULL 按需
npm run workflow:check-prototype:browser -- 04B-prototype-[名称].html # QA-TARGETED / QA-FULL 按需
```
