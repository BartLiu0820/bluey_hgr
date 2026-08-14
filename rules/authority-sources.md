# Rule Authority Sources

本文件定义本项目中“什么可以成为规则依据”。它用于控制从错误 case 反推规则的过程，避免把单次现象、AI 经验或业务特例误写成稳定规则。

本文件只服务当前项目的经验回收和复盘。它不会自动更新已安装 skill，也不授权团队成员直接修改 `~/.claude/skills/` 或 Codex skills 安装目录。通用规则必须回到工作流维护仓库复审后再发布新版 skill。

## Authority Levels

| 等级 | 名称 | 可以做什么 | 典型来源 |
|---|---|---|---|
| A0 | Hard Protocol | 直接约束执行 | 本项目 `CLAUDE.md` / `AGENTS.md`、用户在当前会话明确确认的红线、合规/安全硬约束 |
| A1 | Project Source of Truth | 约束当前项目对应阶段 | `workflow-state.md`、已确认的 `01-research.md` / `02-architecture.html` / `03-feature-*.md` / `04A-prototype-spec-*.md` |
| A2 | Validated Pattern | 可进入候选或项目规则 | 多个 error case 的共同根因、跨页面/跨模块复用的元方法、被用户确认的原则 |
| A3 | External Reference | 只能辅助判断 | 竞品/参考样本、公开资料、行业实践、官方文档 |
| A4 | AI Heuristic | 只能生成草案 | AI 基于经验提出的建议、单次未验证推断 |

## 冲突处理顺序

当规则、产物或建议冲突时，按以下顺序处理：

1. 用户在当前项目中的明确确认。
2. `CLAUDE.md` / `AGENTS.md` 中的项目协议和红线。
3. `rules/active-rules.md` 中已确认的项目规则。
4. 当前阶段已确认产物。
5. `rules/rule-candidates.md` 中的候选规则。
6. AI 通用经验或外部参考。

候选规则和 AI 通用经验永远不能覆盖上游已确认产物；如果发现冲突，只能提出复审建议。

## 规则晋升门槛

候选规则进入 `rules/active-rules.md` 至少满足：

- 有明确来源等级。
- A0/A1 来源可以直接作为当前项目规则记录。
- A2 来源可以建议进入 active rules，但需要用户确认。
- A3/A4 来源只能停留在候选区，除非被用户确认或后续验证为 A2。
- 写清适用范围和不适用范围。
- 至少考虑 1 个反例或误用风险。
- 能说明它约束的是当前项目，而不是所有项目。

候选规则进入通用 workflow、skill 或模板还必须满足：

- 它是元方法、判断框架、模板字段或质量门槛，不是单个项目业务结论。
- 至少能适用于一类产品、一类页面或一类任务。
- 有清楚的非适用范围。
- 在工作流维护仓库中先写入对应 `design.md` 或 `review.md`，再修改 `SKILL.md`、`references/`、`templates/` 或 `scripts/`。
- 由工作流维护者重新分发完整 skill 目录；不得从项目内候选区直接复制到已安装 skill。

## Source Record Template

```markdown
## SOURCE-[编号]：[来源名称]

- 来源等级：
- 来源位置：
- 记录日期：
- 可信原因：
- 局限：
- 可支持的候选规则：
```
