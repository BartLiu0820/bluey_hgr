# Reviews

本目录存放每个阶段的 PM Review Console。

推荐命名：

```text
phase-01-review-data.json
phase-01-review.html
phase-01A-review-data.json
phase-01A-review.html
phase-02-review-data.json
phase-02-review.html
phase-03-[模块名]-review-data.json
phase-03-[模块名]-review.html
phase-04a-[模块名]-review-data.json
phase-04a-[模块名]-review.html
phase-04b-[名称]-review-data.json
phase-04b-[名称]-review.html
phase-05a-[名称]-review-data.json
phase-05a-[名称]-review.html
phase-05b-[名称]-review-data.json
phase-05b-[名称]-review.html
```

Review Console 用于让 PM 阅读阶段摘要、关键材料、阶段关键信息可视化、待确认决策卡和下游影响。它不是正式阶段产物，也不替代 PM 确认。

`phase-*-review-data.json` 应包含 `visualizations` 数组。第一版支持的通用可视化包括：

- `stage_flow`：阶段链路和当前 gate。
- `impact_map`：关键决策对下游产物的影响。
- `matrix`：竞品对比、screen/state、字段/规则覆盖。
- `risk_bars`：风险严重度。
- `evidence_map`：证据支撑关系。
- `metric_cards`：QA、覆盖率或数量指标。

第一版 Review Console 的反馈只保存在浏览器本地，可复制或下载为 JSON。后续如果需要把反馈自动接回 `workflow-state.md`、`pm-change-router` 或 Evidence Ledger，应按 Review Feedback Protocol 另行处理。

05A AI 仿真用研的 Review Console 主要用于 PM 裁决候选问题。决策选项应固定为：

- `accept`：进入 `pm-change-router`。
- `reject`：不修改。
- `defer`：保留到后续版本。
- `needs_more_context`：先补材料。
