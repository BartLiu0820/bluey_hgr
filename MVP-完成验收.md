# 小尾巴探险队五角色与三玩法计分循环 MVP 完成验收

> 首次完成：2026-08-14 | 当前同步：2026-08-21 | Target Surface：web-only | Phase 4B Gate：PENDING_PM

## 火线冲击新增验收

2026-09-05第四玩法首版已接入；当前增量验收与未完成项以`火线冲击-开发日志与交接.md`为准。下文保留旧三玩法验收基线，不代表新增玩法的实摄/儿童验收已完成。

## 目标范围

完成一个适合 5 岁儿童在家庭设备内私人试玩的 Web 体感游戏：真实摄像头在本机提供拳掌事件和手部位置流；输入准备后从五名角色中选择一名，三个玩法默认全部可选，各自在安全段教学，并通过温和加速、勇气心、分数与设备内个人 Top 5 支持重复挑战。

## 逐项完成审计

| 要求 | 权威证据 | 结论 |
|---|---|---|
| L4→L0 源真相同步 | 01/01A、02、两份 03、两份 04A、集成 04B、`workflow-state.md` | 已完成 |
| Web-only、笔记本优先 | `01-research.md`、两份 04A | 已完成 |
| 私人本地角色与儿童友好画布 | 布鲁伊、宾果、麦麦、班底特、悠悠五名参考衍生角色，每名 7 组/28 帧，共 35 组/140 帧本地素材，无 CDN 运行依赖；公开发布前需授权或整体替换原创角色 | 已完成（私人本地版） |
| 双通道真实输入 | `PoseTransitionEvent` 驱动 L1，`HandTrackingFrame` 的 Y/X 分别驱动 L2/L3；InputProfile 使用具名 capability map；本地 MediaPipe 与 21 点骨架 | 已完成 |
| 输入准备 | 只确认摄像头/按键可用；摄像头“继续”和按键“开始游戏”都进入 CH-01，不再先做统一动作训练 | 已完成 |
| 五角色选择 | CH-01 五张同权重角色卡；“选好啦”提交 `selectedCharacterId`，并在大厅、三玩法、救援、重玩与成绩页中保持 | 已完成 |
| 玩法大厅 | 溪边跳跳、萤火虫躲躲、树梢蹦蹦首次进入即全部可选；操作说明下沉到所选玩法 | 已完成 |
| L1 动作跑酷 | 同一 `worldSpeed` 驱动世界和目标；1.0×–1.6× 下腾空约 1.13–1.17s、提示窗口约 0.92–1.12s；空间命中成功得分，掉坑扣心并播放伙伴托回 | 已完成 |
| L2 跟手躲避 | None/Unknown 仍跟手；EMA/死区/12% 限速；短丢手保持、长丢手暂停；软碰撞护盾；障碍判定后继续移动至完整离场 | 已完成 |
| L3 自动弹跳攀升 | 角色具有世界 Y/竖直速度/重力；下降落台立即再弹；达到上方阈值后 cameraY 向上追随，平台 screenY 相对下移并在高处持续生成；掌心 X 控制左右，落空由安全云托回 | 已完成 |
| 三关分层地图 | 溪边/湿地/树梢分别使用低干扰远景与中景；L1 镜像循环对支持正反向无缝横向循环；L2 树篱、L3 踏板/安全云均为独立透明物件，碰撞不读取图片 alpha | 已完成 |
| 地图一致性 UI | 玩法大厅预览、玩法出发封面、HUD/教练/按钮和成绩页采用同一暖纸张冒险手册视觉；L1 水坑使用独立透明物件且视觉/碰撞宽度解耦 | 已完成 |
| 儿童友好音频 | ElevenLabs 生成 4 条本地循环 BGM + 14 个本地 SFX；按 screen/玩法和事件边沿接入，提供首次交互解锁、家长总开关、暂停/后台停播、冷却与静默降级 | 已完成（待 PM 人工试听） |
| 温和无限递进 | L1/L2 按 100/250/450/700m、L3 按 20/50/90/140m 升档；L1/L2 速度最高 1.6×、L3 弹跳节奏最高 1.35×；3 颗勇气心，单次失误不重开 | 已完成 |
| 本地成绩 | 生存、成功动作与连段共同计分；每种玩法独立保存设备内个人最好和 Top 5 | 已完成 |
| 摄像头信息分层 | 视频+骨架；取景/识别 readout 位于视频外且零相交 | 已完成 |
| 单屏自适应 | 五个支持视口无滚动、裁切、关键区重叠；成绩 Top 5 与全部按钮完整可见 | 已完成 |
| 键盘完整降级 | L1 Space；L2 ↑/↓/←/→；L3 ←/→；中途切换释放摄像头并保留进度 | 已完成 |
| 家长安全控制 | 暂停、恢复、切键盘、重开、退出 | 已完成 |
| QA-LIGHT 音频 | 18/18 有效本地 MP3；manifest/HTML 映射、JS 语法与 key 泄漏检查 PASS；Browser checks N/A by QA-LIGHT policy | 已完成 |
| QA-TARGETED | 角色选择 6/6 + 五角色动作 6/6 + 玩法大厅/计分/L1/L2/L3/六视口专项 9/9 + 地图一致性 UI 6/6 + 分层地图专项 6/6 + gesture runtime 1/1 | 主链路已完成；L1 独立 swept 专项最新复跑存在跨视口不稳定，待单独修复测试可靠性 |

## 交付文件

- 游戏：`04B-prototype-手势小狗探险MVP.html`
- 识别运行时：`gesture-recognizer-runtime.mjs`
- 角色清单：`assets/characters/character-roster.json`
- 五角色选择专项：`tests/character-selection-targeted.mjs`
- 五角色动作专项：`tests/bluey-sprite-targeted.mjs`
- 玩法循环专项：`tests/mode-hub-score-loop-targeted.mjs`
- 当前主链路回归：`tests/character-selection-targeted.mjs` + `tests/mode-hub-score-loop-targeted.mjs`
- 测试适用范围：见 `tests/README.md`；`phase4b-targeted.mjs` / `phase4b-mvp-targeted.mjs` 属于 GI-03/GI-04 旧流程历史测试，不作为当前 Gate 证据
- 识别测试：`tests/gesture-runtime-targeted.mjs`
- 分层地图清单：`data/maps/game-maps.json`
- 地图与物件素材：`assets/maps/`、`assets/map-objects/`
- 分层地图专项：`tests/layered-maps-targeted.mjs`
- 地图一致性 UI 专项：`tests/map-ui-skin-targeted.mjs`
- 音频清单：`assets/audio/audio-manifest.json`
- 音频生成/检查：`scripts/generate-game-audio.mjs`、`scripts/check-game-audio.mjs`
- 试玩说明：`试玩说明.md`
- QA 输出：由 `tests/` 和 `scripts/` 按需重新生成到已忽略的 `qa/` / `prototype-qa/`，不再作为仓库常驻产物
- 本地启动：`start.sh` / `stop.sh` / Windows `.bat`；运行时生成的 `.port` / `.pid` 已忽略

## 自动化结果

```text
Mode hub and scored-loop targeted: 9 / 9 PASS
Layered maps targeted: 6 / 6 PASS
Gesture runtime: 1 / 1 PASS
Game audio static: 18 / 18 PASS (4 BGM + 14 SFX)
Character selection targeted: 6 / 6 PASS
Five-character sprite targeted: 6 / 6 PASS
Unique product screens: 8 / 8（GI-01、GI-02、GI-05、CH-01、LV-00–LV-03）
Mode hub / launch / runtime / complete Top 5 result viewports: 6 / 6 PASS
Runtime CDN dependency: none
Character rights status: reference-derived review required before public/commercial release
```

## 后续真实试玩风险

- 尚未用真实 5 岁儿童验证不同光线、距离、左右手和动作习惯，不得对外宣称准确率或儿童可用性已证实。
- 五角色卡片的低高度可点性、角色辨识度和跨三玩法一致性仍需 PM 与真实儿童试玩确认。
- L1 约 1.13–1.17s 腾空/0.92–1.12s 提示窗口与里程碑升档后的时机、L2 跟手死区与 600ms 丢手宽限、L3 左右落台宽度/跳跃高度/镜头阈值仍需家长陪同试玩校准。
- L1 完整玩法闭环仍通过 9/9，但独立 swept 碰撞专项在最新复跑中于不同视口出现不稳定；不得把历史 4/4 记录视为当前测试可靠性已完全确认。
- 生成式背景已经过接缝、透明度和浏览器可见性检查，但最终“是否抢戏”仍应在真实孩子连续游玩时观察，而不是只看静态截图。
- 音频已通过文件格式、数量、映射和代码检查，但 BGM 循环接缝、长局听觉疲劳、碰撞/救援是否惊吓仍需 PM 与真实儿童陪同试听。
- 本地 Top 5 只用于同一设备自我比较，不是公开排行榜；账号、昵称、全球榜和跨设备同步不在本轮。
- Phase 4B Gate 保持 `pending_pm`，等待 PM 对五角色选择、角色跨玩法一致性、L1 成败反馈、三种重复挑战手感与声音基线做一次实际试玩试听确认。
