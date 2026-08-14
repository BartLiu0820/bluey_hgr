# 小尾巴探险队玩法大厅与计分循环 MVP 完成验收

> 完成日期：2026-08-14 | Target Surface：web-only | CR-20260814-layered-game-maps：VERIFIED | Phase 4B Gate：PENDING_PM

## 目标范围

完成一个适合 5 岁儿童在家庭设备内私人试玩的蓝色小狗 Web 体感游戏：真实摄像头在本机提供拳掌事件和手部位置流；三个玩法默认全部可选，各自在安全段教学，并通过温和加速、勇气心、分数与设备内个人 Top 5 支持重复挑战。

## 逐项完成审计

| 要求 | 权威证据 | 结论 |
|---|---|---|
| L4→L0 源真相同步 | 01/01A、02、两份 03、两份 04A、集成 04B、`workflow-state.md` | 已完成 |
| Web-only、笔记本优先 | `01-research.md`、两份 04A | 已完成 |
| 私人本地角色与儿童友好画布 | 蓝色主角与橙色伙伴分别由用户参考图衍生，共 12 组/48 帧本地素材，无 CDN 运行依赖；公开发布前需授权或换回原创角色 | 已完成（私人本地版） |
| 双通道真实输入 | `PoseTransitionEvent` 驱动 L1，`HandTrackingFrame` 的 Y/X 分别驱动 L2/L3；InputProfile 使用具名 capability map；本地 MediaPipe 与 21 点骨架 | 已完成 |
| 输入准备 | 只确认摄像头/按键可用；摄像头主 CTA 为“开始游戏”，不再先做统一动作训练 | 已完成 |
| 玩法大厅 | 溪边跳跳、萤火虫躲躲、树梢蹦蹦首次进入即全部可选；操作说明下沉到所选玩法 | 已完成 |
| L1 动作跑酷 | 同一 `worldSpeed` 驱动世界和目标；1200ms 高跳匹配 1.05s 预告；空间命中成功得分，掉坑扣心并播放伙伴托回 | 已完成 |
| L2 跟手躲避 | None/Unknown 仍跟手；EMA/死区/12% 限速；短丢手保持、长丢手暂停；软碰撞护盾；障碍判定后继续移动至完整离场 | 已完成 |
| L3 自动弹跳攀升 | 角色具有世界 Y/竖直速度/重力；下降落台立即再弹；达到上方阈值后 cameraY 向上追随，平台 screenY 相对下移并在高处持续生成；掌心 X 控制左右，落空由安全云托回 | 已完成 |
| 三关分层地图 | 溪边/湿地/树梢分别使用低干扰远景与中景；L1 镜像循环对支持正反向无缝横向循环；L2 树篱、L3 踏板/安全云均为独立透明物件，碰撞不读取图片 alpha | 已完成 |
| 地图一致性 UI | 玩法大厅预览、玩法出发封面、HUD/教练/按钮和成绩页采用同一暖纸张冒险手册视觉；L1 水坑使用独立透明物件且视觉/碰撞宽度解耦 | 已完成 |
| 儿童友好音频 | ElevenLabs 生成 4 条本地循环 BGM + 14 个本地 SFX；按 screen/玩法和事件边沿接入，提供首次交互解锁、家长总开关、暂停/后台停播、冷却与静默降级 | 已完成（待 PM 人工试听） |
| 温和无限递进 | 每 20 秒速度 +0.1×、最高 1.6×；3 颗勇气心；单次失误不重开，用完后结束本局 | 已完成 |
| 本地成绩 | 生存、成功动作与连段共同计分；每种玩法独立保存设备内个人最好和 Top 5 | 已完成 |
| 摄像头信息分层 | 视频+骨架；取景/识别 readout 位于视频外且零相交 | 已完成 |
| 单屏自适应 | 五个支持视口无滚动、裁切、关键区重叠；成绩 Top 5 与全部按钮完整可见 | 已完成 |
| 键盘完整降级 | L1 Space；L2 ↑/↓；L3 ←/→；中途切换释放摄像头并保留进度 | 已完成 |
| 家长安全控制 | 暂停、恢复、切键盘、重开、退出 | 已完成 |
| QA-LIGHT 音频 | 18/18 有效本地 MP3；manifest/HTML 映射、JS 语法与 key 泄漏检查 PASS；Browser checks N/A by QA-LIGHT policy | 已完成 |
| QA-TARGETED | 玩法大厅/计分/L1/L2/L3/六视口专项 9/9 + 地图一致性 UI 6/6 + 分层地图专项 6/6 + 双角色 6/6 + gesture runtime 1/1 | 已完成 |

## 交付文件

- 游戏：`04B-prototype-手势小狗探险MVP.html`
- 识别运行时：`gesture-recognizer-runtime.mjs`
- 玩法循环专项：`tests/mode-hub-score-loop-targeted.mjs`
- 完整回归：`tests/phase4b-mvp-targeted.mjs`
- 识别测试：`tests/gesture-runtime-targeted.mjs`
- 分层地图清单：`data/maps/game-maps.json`
- 地图与物件素材：`assets/maps/`、`assets/map-objects/`
- 分层地图专项：`tests/layered-maps-targeted.mjs`
- 地图一致性 UI 专项：`tests/map-ui-skin-targeted.mjs`
- 音频清单：`assets/audio/audio-manifest.json`
- 音频生成/检查：`scripts/generate-game-audio.mjs`、`scripts/check-game-audio.mjs`
- 试玩说明：`试玩说明.md`
- QA 报告：`prototype-qa/phase4b-mvp-qa.md`
- 本地启动：`start.sh` / `stop.sh` / Windows `.bat` / `.port`

## 自动化结果

```text
Mode hub and scored-loop targeted: 9 / 9 PASS
Layered maps targeted: 6 / 6 PASS
Gesture runtime: 1 / 1 PASS
Game audio static: 18 / 18 PASS (4 BGM + 14 SFX)
Two-character sprite targeted: 6 / 6 PASS
Unique product screens: 10 / 10
Mode hub / launch / runtime / complete Top 5 result viewports: 6 / 6 PASS
Runtime CDN dependency: none
Protected IP naming in MVP: none
```

## 后续真实试玩风险

- 尚未用真实 5 岁儿童验证不同光线、距离、左右手和动作习惯，不得对外宣称准确率或儿童可用性已证实。
- L1 1200ms 高跳/1.05s 预告与逐渐加速后的时机、L2 跟手死区与 600ms 丢手宽限、L3 左右落台宽度/跳跃高度/镜头阈值仍需家长陪同试玩校准。
- 生成式背景已经过接缝、透明度和浏览器可见性检查，但最终“是否抢戏”仍应在真实孩子连续游玩时观察，而不是只看静态截图。
- 音频已通过文件格式、数量、映射和代码检查，但 BGM 循环接缝、长局听觉疲劳、碰撞/救援是否惊吓仍需 PM 与真实儿童陪同试听。
- 本地 Top 5 只用于同一设备自我比较，不是公开排行榜；账号、昵称、全球榜和跨设备同步不在本轮。
- Phase 4B Gate 保持 `pending_pm`，等待 PM 对玩法大厅、L1 成败反馈、三种重复挑战手感与声音基线做一次实际试玩试听确认。
