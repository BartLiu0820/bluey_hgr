# Active Project Rules

本文件只存放已经确认、可以约束当前项目执行的项目级规则。它不是通用 workflow 规则库。

## 使用原则

- 只有用户明确确认，或来源等级达到 `rules/authority-sources.md` 中的 A0/A1，规则才可写入本文件。
- 从 error case 得出的经验必须先进入 `rules/rule-candidates.md`，不能直接写入本文件。
- 本文件规则只约束当前项目。要进入通用 skill 或模板，必须回到工作流本体仓库，按 `design.md` / `review.md` 流程迭代。
- 本文件不是已安装 skill 的 patch 文件，不得直接复制到 `~/.claude/skills/` 或 Codex skills 安装目录。
- 如果本文件与当前用户明确指令冲突，先询问用户确认，不要自行覆盖。

## Active Rules

| ID | 规则 | 来源等级 | 适用范围 | 生效日期 | 复审条件 |
|---|---|---|---|---|---|
| AR-001 | TBD | TBD | TBD | TBD | TBD |
| AR-002 | 集成式 Web MVP 的每个产品 screen 必须在单个浏览器视口内自适应完整呈现；页面级不得出现纵向或横向滚动，低高度优先压缩留白、装饰和非核心舞台，不能裁掉主操作、状态和家长入口。 | A0 用户明确确认 | `04A-prototype-spec-手势输入闭环.md`、`04A-prototype-spec-核心关卡循环.md`、`04B-prototype-手势小狗探险MVP.html` 及其 QA | 2026-08-12 | Target Surface 或最小支持 viewport 改变时 |

## Active Rule Template

```markdown
## AR-[编号]：[短标题]

- 规则：
- 来源等级：
- 来源证据：
- 适用范围：
- 不适用范围：
- 生效日期：
- 复审条件：
- 关联候选规则：
- 关联 error case：
```
