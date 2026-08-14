# bluey-gesture-game 产品项目

> 本项目由 `pm-workflow-starter` 于 2026-08-11 创建。  
> 项目根目录：当前 Git 仓库根目录

## 产品问题

为 5 岁儿童设计并实现一个通过手势控制布鲁伊移动和动作、包含收集道具、躲避障碍与角色切换的儿童友好横版卷轴游戏

## 产品定位

TBD：用一句话说明这是给谁、在什么场景下、解决什么问题的产品或功能。

推荐格式：

```text
[产品/功能名]：帮助 [目标用户] 在 [使用场景] 中解决 [核心问题]，通过 [关键机制] 达成 [可验证结果]。
```

## 目标用户

- 主要用户：TBD
- 次要用户：TBD
- 决策者 / 影响者：TBD

## 项目类型

- 类型：general
- 是否 EdTech：TBD
- 是否包含 B 端：TBD
- 是否包含 C 端：TBD

如果项目属于教育产品，后续阶段必须额外检查：

- 学习效果主张是否明确
- 学生认知负荷是否可控
- 反馈机制是否能帮助学习，而不是只给结果
- B 端数据需求是否会伤害 C 端体验
- 激励机制是否可能破坏内在动机

## 已知约束

- 业务约束：TBD
- 用户约束：TBD
- 技术约束：TBD
- 时间 / 资源约束：TBD
- 本期不做：TBD

## Claude / Codex 兼容约定

本项目文档默认使用 Claude 命名：`Claude Code`、`CLAUDE.md`、`~/.claude/skills/`。Codex 执行时自动按等价概念理解为当前 Codex 环境、`AGENTS.md` 和 Codex skills 目录。

本项目同时包含 `CLAUDE.md` 与 `AGENTS.md`。在 Claude Code 中优先读取 `CLAUDE.md`，在 Codex 中优先读取 `AGENTS.md`。

## 当前执行协议

每次开始或继续工作前，必须先读取：

1. `workflow-state.md`
2. `rules/active-rules.md`
3. 当前阶段已有产物
4. 本文件

所有阶段产物必须写在本项目根目录内。不要把本项目的调研、PRD、原型规格或 HTML 原型写回工作流模板仓库或其他目录。

如果运行环境不能持久切换目录，每次文件读写、搜索和命令执行都必须显式使用本项目根目录作为 `cwd` / `workdir`。

项目创建后应先运行：

```bash
npm run workflow:check-env
```

如果检查失败，先补齐缺失 skill 或依赖，再继续 Phase 1。

## 标准工作流

```text
Phase 1: 产品调研判断 -> 01-research.md
Phase 1A: 竞品页面交互体验 Benchmark -> 01A-competitor-page-experience.md
Phase 2: 产品架构设计 -> 02-architecture.html
Gate: 页面形态决策 -> 写入 02 或 03 开头
Phase 3: 功能细节设计 -> 03-feature-[模块名].md
Phase 4A: 原型规格设计 -> 04A-prototype-spec-[模块名].md
Phase 4B: HTML 主干 Demo -> 04B-prototype-[名称].html（纯产品 UI，无脚手架）
Phase 4C: HTML 状态扩展（可选）-> 04C-prototype-[名称].html（04B + inspector + extension states）
Phase 05A: AI 仿真用研 -> 05A-ai-persona-prototype-review-[名称].md + 05A-ai-persona-findings-[名称].json
Phase 05B: PM 仿真问题裁决 -> 05B-pm-simulation-decision-[名称].md
```

## 阶段门禁

- 没有 `01-research.md` 时，不得直接进入产品架构、功能细节或 HTML 原型。
- `01-research.md` 必须包含 PM 在 research 阶段确认的 Target Surface：`web-only`、`mobile-only` 或 `web-mobile-parallel`；04A/04B 只覆盖该端型范围。
- 如果 `01-research.md` 列出了明确竞品、参考页、认可原型或截图，进入 Phase 2 前必须补 `01A-competitor-page-experience.md`。
- 进入 Phase 3 前必须完成页面形态决策，明确页面是高密度工作台、列表/详情、卡片 feed、任务流、数据看板或其他形态。
- 没有 `03-feature-[模块名].md` 时，不得直接写 `04A-prototype-spec-[模块名].md`，除非用户明确提供了等价功能规格。
- 没有 `04A-prototype-spec-[模块名].md` 时，不得直接生成 HTML 原型。
- `04A-prototype-spec-[模块名].md` 必须包含 Coverage Plan（backbone groups / transitions map / extension states）；缺失时 html-prototype-builder 应提示补充。
- 04B 是纯产品 UI 主干 Demo，不引入任何原型脚手架；screens 通过真实产品交互跳转；任何情况下默认 `QA-LIGHT`，只有用户明确要求才升级到 `QA-FULL`。
- 04C 是可选状态扩展步骤，PM 确认 04B 后按需触发；04C 基于对应 04B 产品 UI，套 inspector shell；默认 `QA-LIGHT`。
- 04B confirmed 后（04C 可选），可使用 `ai-persona-prototype-review` 做 05A AI 仿真用研；AI finding 只是候选问题，不是真实用户研究结论。
- 只有 PM 在 05B 中裁决为 `accept` 的 finding，才能进入 `pm-change-router`；`reject`、`defer`、`needs_more_context` 不得触发原型修改。

## PM Review Gate

每个阶段完成后，必须生成 `PM Review Slice`，只让 PM 审核心决策，不审完整执行细节。

固定格式：

```markdown
## PM Review Slice

- 本阶段关键决策：
- 被放弃的方案：
- 需要 PM 确认的问题：
- 不需要 PM 审查的执行细节：
- 进入下一阶段的条件：
```

Review Slice 生成后，更新 `workflow-state.md` 的 Review Gates。状态只能是：

- `missing`：缺少审查切片。
- `pending_pm`：等待 PM 确认。
- `confirmed`：PM 已明确确认。
- `changes_requested`：PM 要求修改，先进入变更路由。

需要 PM 确认的阶段判断未 `confirmed` 时，不得继续生成会受其影响的下游核心产物。

## Change Routing Protocol

任何对已有产物的修改请求，先使用 `pm-change-router` 判断问题最早应该回到哪一层修正。

| 层级 | 最早修正点 | 典型问题 |
|---|---|---|
| L0 实现层 | `04B-prototype-*.html` / `04C-prototype-*.html` | 溢出、不可点、focus/aria、视觉 bug |
| L1 原型规格层 | `04A-prototype-spec-*.md` | 缺 screen、缺状态、交互不完整 |
| L2 功能层 | `03-feature-*.md` | 流程、字段、业务规则、边界错误 |
| L3 架构层 | `02-architecture.html` / 页面形态 Gate | 页面形态、模块边界、MVP 优先级错误 |
| L4 调研层 | `01-research.md` / `01A-competitor-page-experience.md` | 目标用户、核心问题、竞品判断、核心假设错误 |

正式产物只保留当前可信状态，不写历史流水。变更过程写入 `changes/change-log.md` 和 `workflow-state.md` 的 Change Requests。

## Skill 使用约定

- 新方向调研：使用 `product-research`，输出 `01-research.md`。
- 产品架构：使用 `product-architecture`，输出 `02-architecture.html`。
- 功能细节设计：使用 `product-detail`，输出 `03-feature-[模块名].md`。
- 原型规格：使用 `prototype-spec-writer`，输出 `04A-prototype-spec-[模块名].md`。
- HTML 原型：使用 `html-prototype-builder`，输出 `04B-prototype-[名称].html`。
- AI 仿真用研：使用 `ai-persona-prototype-review`，输出 `05A-ai-persona-prototype-review-[名称].md`、`05A-ai-persona-findings-[名称].json` 和 `05B-pm-simulation-decision-[名称].md`。
- 阶段审查：使用 `pm-review-gate`，生成 `PM Review Slice` 并更新 Review Gates。
- 变更路由：使用 `pm-change-router`，输出 Change Routing Decision 并更新 Change Requests。

## 项目级命令

```bash
npm run workflow:check-env
npm run workflow:validate-gates
npm run workflow:ensure-browsers
npm run workflow:design-search -- "[产品类型] [用户角色] [核心场景]" --design-system -f markdown -p "[原型名称]"
npm run workflow:validate-spec -- 04A-prototype-spec-[模块名].md
npm run workflow:check-prototype -- 04B-prototype-[名称].html
npm run workflow:check-prototype:browser -- 04B-prototype-[名称].html
```

这些命令通过 `.pm-workflow/config.json` 调用已安装 skill 中的脚本和资料库。不要把阶段 skill 的大型资源复制进本项目。

Playwright Chromium 默认安装到共享缓存 `~/.cache/pm-workflow/playwright-browsers`，同一台机器上的 PM 工作流项目复用这一份浏览器。`QA-LIGHT` 不需要浏览器级检查；首次需要 `QA-TARGETED` / `QA-FULL` 浏览器检查时运行 `npm run workflow:ensure-browsers`。如需改共享位置，设置 `PM_WORKFLOW_PLAYWRIGHT_BROWSERS_PATH`。

## 错误 Case 与规则治理

本项目使用三段式经验回收机制：

1. `cases/error-cases.md`：记录已经发生的错误、返工和质量问题，只记录事实。
2. `rules/rule-candidates.md`：隔离可能值得沉淀的候选规则；候选规则不是执行协议。
3. `rules/active-rules.md`：只记录已经确认、可以约束当前项目的项目级规则。

判断候选规则可信度时，必须查看 `rules/authority-sources.md`。

这些文件不会自动更新已安装 skill。团队成员不要直接修改 `~/.claude/skills/` 或 Codex skills 安装目录；项目内候选规则应在阶段复盘时提交给工作流维护者，由维护者在工作流仓库复审后发布新版 skill。

如果过程中出现明显错误、返工或质量问题：

- 先记录到 `cases/error-cases.md`。
- 再按 `rules/authority-sources.md` 判断来源等级。
- 如果可能抽象成规则，只写入 `rules/rule-candidates.md`。
- 未经用户确认，不得把候选规则写入 `rules/active-rules.md`。
- 不得把候选规则直接复制进已安装 skill。
- 单个项目的业务结论不得写入通用 workflow 或通用 skill。

## 红线

- 未经用户确认，不改变目标用户、产品边界或本期范围。
- 未经用户确认，不跳过阶段门禁。
- 未经变更路由，不直接修改已有 HTML 原型并回写上游。
- 未经用户确认，不创建额外项目目录。
- 不覆盖已有产物；需要改上游时，先说明影响范围。
