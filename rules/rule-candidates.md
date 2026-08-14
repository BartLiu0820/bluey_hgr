# Rule Candidate Isolation Zone

本文件只存放“可能值得沉淀为规则”的候选项。候选规则不是执行协议，不得覆盖 `CLAUDE.md` / `AGENTS.md`、`workflow-state.md`、阶段产物或 `rules/active-rules.md`。

本文件也是工作流维护者复盘时的输入材料，不是本地 skill 的补丁队列。团队成员不要直接把候选规则复制到已安装 skill。

## 隔离原则

- 候选规则默认状态是 `draft`，只能作为讨论材料。
- 候选规则必须引用 `cases/error-cases.md`、用户确认、阶段产物、竞品/参考样本或其他来源。
- 单个 error case 只能生成候选规则，不能直接生成 active rule。
- 候选规则必须写清适用范围、不适用范围和反例风险。
- 如果候选规则来自单个项目业务特例，只能保留为本项目经验，不得建议进入通用 skill。

## 正确流程

```text
错误/返工/质量问题
→ 记录到 cases/error-cases.md
→ 对照 rules/authority-sources.md 判断来源等级
→ 如果可抽象，写入本候选隔离区
→ 经过范围、反例和用户确认检查
→ 只在确认后进入当前项目 rules/active-rules.md
→ 阶段复盘时提交给工作流维护者
→ 由维护者在工作流仓库复审后决定是否进入通用 workflow / skill
```

## Candidate Index

| ID | 状态 | 来源等级 | 来源 | 建议去向 | 用户确认 |
|---|---|---|---|---|---|
| RULE-CANDIDATE-001 | draft | TBD | TBD | TBD | TBD |
| RULE-CANDIDATE-002 | needs-evidence | A4 | CASE-003 | HTML 原型构建器本地启动检查 | 未请求 |

状态建议：`draft` / `needs-evidence` / `needs-user-confirmation` / `accepted-project-rule` / `promoted-to-workflow` / `rejected`。

## RULE-CANDIDATE-002：依赖本地模块的原型必须防止 file 协议误启动

- 状态：needs-evidence
- 候选规则：当 04B 依赖 ES Module、WASM、worker 或本地模型文件时，交付必须包含 HTTP 启动方式；产品页检测到 `file:` 时，应在申请敏感权限或加载模型前说明原因并引导至正确入口，QA 至少覆盖一次误启动恢复。
- 规则类型：质量门槛
- 来源等级：A4（单个已验证 error case，只能作为候选草案）
- 来源证据：
  - error case：CASE-003
  - 用户确认：用户以截图确认真实阻断现象，但未确认通用规则
  - 阶段产物：`04B-prototype-手势小狗探险MVP.html`、`prototype-qa/phase4b-mvp-qa.md`
  - 参考样本 / 外部来源：无
- 适用范围：需要通过本地 HTTP 才能加载浏览器模块、WASM、worker 或模型资产的可交互 HTML 原型。
- 不适用范围：完全自包含、无模块加载且在 `file:` 下经过验证的静态 HTML；正式部署到 HTTPS 的生产页面。
- 反例或风险：把 localhost 地址硬编码到需要动态端口或远程部署的项目会造成错误引导；实现应从项目启动配置获取地址。
- 如果执行，应该影响哪些文件或 skill：`html-prototype-builder` 的本地启动模板、QA test protocol 与交付检查项。
- 是否需要用户确认：进入当前项目 active rule 前需要；提交通用工作流还需维护者复审。
- 推荐下一步：继续观察其他含 WASM/worker 项目是否复现，再提交给工作流维护者复审。

## Candidate Template

```markdown
## RULE-CANDIDATE-[编号]：[短标题]

- 状态：
- 候选规则：
- 规则类型：[阶段门禁 / 页面形态 / 字段模型 / 质量门槛 / 协作协议 / 其他]
- 来源等级：[见 rules/authority-sources.md]
- 来源证据：
  - error case：
  - 用户确认：
  - 阶段产物：
  - 参考样本 / 外部来源：
- 适用范围：
- 不适用范围：
- 反例或风险：
- 如果执行，应该影响哪些文件或 skill：
- 是否需要用户确认：
- 推荐下一步：[继续观察 / 请用户确认 / 写入 active-rules / 提交给工作流维护者复审]
```
