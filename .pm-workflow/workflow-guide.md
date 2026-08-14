# PM Workflow Guide

本文件是项目内工作流速查。详细方法论由已安装的 PM workflow skills 承担。

## Phase 顺序

```text
00-input/brief.md
  ↓
01-research.md
  ↓
PM Review Gate（调研判断确认）
  └─ reviews/phase-01-review.html（Review Console）
  ↓
01A-competitor-page-experience.md（有竞品 / 参考页 / 认可原型时）
  ↓
PM Review Gate（参考继承点确认）
  └─ reviews/phase-01A-review.html（Review Console）
  ↓
02-architecture.html
  ↓
PM Review Gate（模块边界 / MVP / 风险确认）
  └─ reviews/phase-02-review.html（Review Console）
  ↓
页面形态决策 Gate
  ↓
PM Review Gate（页面类型 / 信息密度 / 默认布局确认）
  └─ reviews/page-archetype-review.html（Review Console）
  ↓
03-feature-[模块名].md
  ↓
PM Review Gate（范围 / 主流程 / 字段模型 / 业务规则确认）
  └─ reviews/phase-03-[模块名]-review.html（Review Console）
  ↓
04A-prototype-spec-[模块名].md
  ↓
PM Review Gate（screen / state / 验收标准确认）
  └─ reviews/phase-04a-[模块名]-review.html（Review Console）
  ↓
04B-prototype-[名称].html
  ↓
PM Review Gate（HTML 实现与 QA 风险确认）
  └─ reviews/phase-04b-[名称]-review.html（Review Console）
  ↓
05A-ai-persona-prototype-review-[名称].md + 05A-ai-persona-findings-[名称].json
  ↓
PM Review Gate（AI 仿真候选问题 / route hint 确认）
  └─ reviews/phase-05a-[名称]-review.html（PM 裁决入口）
  ↓
05B-pm-simulation-decision-[名称].md
  ↓
pm-change-router（仅处理 PM accept 的 finding）
```

## 项目级命令

```bash
npm run workflow:check-env
npm run workflow:validate-gates
npm run workflow:ensure-browsers
npm run workflow:design-search -- "[产品类型] [用户角色] [核心场景]" --design-system -f markdown -p "[原型名称]"
npm run workflow:validate-spec -- 04A-prototype-spec-[模块名].md
npm run workflow:render-review-console -- reviews/phase-[阶段]-review-data.json reviews/phase-[阶段]-review.html
npm run workflow:check-prototype -- 04B-prototype-[名称].html
npm run workflow:check-prototype:browser -- 04B-prototype-[名称].html
```

Playwright Chromium 使用共享缓存 `~/.cache/pm-workflow/playwright-browsers`。首次需要浏览器级检查时运行 `npm run workflow:ensure-browsers`；后续项目会复用同一份 Chromium。

## 阶段门禁

- 没有 `01-research.md`，不能直接进入架构、功能细节或 HTML 原型。
- Phase 1 出现竞品、参考页或认可原型时，必须补 `01A-competitor-page-experience.md`。
- 进入 Phase 3 前必须完成页面形态决策。
- 每个阶段完成后必须生成 `PM Review Slice`，并在 `workflow-state.md` 的 Review Gates 中记录状态。
- Review Slice 是轻量摘要；PM 审查入口优先使用 `reviews/phase-*-review.html` Review Console。
- Review Console 必须可视化阶段关键信息，例如流程、矩阵、影响图、风险条、证据映射或指标卡。
- Review Console 第一版反馈只导出 JSON，不会自动写回项目文件；需要继续推进时，把反馈 JSON 或 PM 裁决结果交给 Claude / Codex 处理。
- 需要 PM 确认的阶段判断未 confirmed 时，不得继续生成会受其影响的下游核心产物。
- 没有 `04A-prototype-spec-[模块名].md`，不能直接生成 HTML 原型。
- HTML 原型未完成浏览器级检查时，Browser checks 只能写 WARN，不能写 PASS。
- `05A-ai-persona-findings-[名称].json` 只记录 AI 仿真候选问题，不是真实用户研究结论。
- 只有 PM 在 `05B-pm-simulation-decision-[名称].md` 中标记为 `accept` 的 finding，才能进入 `pm-change-router`。
- `reject`、`defer`、`needs_more_context` 不得触发原型修改。

## 变更回溯

- 用户提出“改一下 / 不对 / 同步上游 / 回写 spec / 改 HTML”时，先使用 `pm-change-router`。
- L0 实现层问题可以直接改 `04B` 并 QA。
- L1 以上问题必须先改最早源真相文件，再向下游重新传播。
- 变更过程写入 `changes/change-log.md` 和 `workflow-state.md`，不要污染正式产物正文。

## 规则沉淀

- 错误、返工和质量问题先写入 `cases/error-cases.md`。
- 判断规则来源等级时查看 `rules/authority-sources.md`。
- 候选规则只写入 `rules/rule-candidates.md`，默认不生效。
- 只有用户确认或来源等级足够时，才写入 `rules/active-rules.md`。
- 这些文件是项目经验回收区，不会自动更新已安装 skill。
- 通用规则应在工作流维护仓库复审后进入新版 skill，不能从项目候选区直接复制到 `~/.claude/skills/` 或 Codex skills 安装目录。
- 单个项目的业务结论不进入通用 workflow / skill。
