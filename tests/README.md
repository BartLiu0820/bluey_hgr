# 测试适用范围

> 更新日期：2026-08-21

## 当前 Phase 4B Gate 证据

- `character-selection-targeted.mjs`：双输入进入 CH-01、五卡单选、确认进入 LV-00、角色跨玩法保持。
- `bluey-sprite-targeted.mjs`：五角色 35 组/140 帧动作合同与运行态映射。
- `mode-hub-score-loop-targeted.mjs`：三玩法大厅、里程碑计分、L1/L2/L3、救援与成绩闭环。
- `l1-ground-collision-jump-physics-targeted.mjs`：L1 地面纵深、swept 碰撞和速度耦合跳跃；2026-08-21 独立复跑存在跨视口不稳定，当前不得引用为稳定 PASS。
- `keyboard-xy-spawn-targeted.mjs`、`generated-control-ui-targeted.mjs`：键盘 X/Y、L1 屏外出生和当前输入/提示 UI。
- `layered-maps-targeted.mjs`、`map-ui-skin-targeted.mjs`、`font-typography-targeted.mjs`、`initial-ui-icons-targeted.mjs`：地图、UI、字体和指示图专项。
- `gesture-runtime-targeted.mjs`：拳掌融合、连续帧稳定和噪声拒绝。
- `review-console-smoke.mjs`：Review Console 结构检查。

## 历史流程测试

- `phase4b-targeted.mjs`
- `phase4b-mvp-targeted.mjs`

以上两份测试仍绑定已移除的 GI-03/GI-04 和旧屏幕数量，只保留为演进记录，不代表当前五角色集成式 MVP，也不进入当前 Phase 4B Gate。后续若需要全量浏览器回归，应基于 CH-01 与 8 个当前产品 screen 新建或重构测试，不得直接引用其旧 PASS 数字。
