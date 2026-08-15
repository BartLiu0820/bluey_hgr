# Workflow State

> 更新日期：2026-08-15

## Project

- 项目名：bluey-gesture-game
- 项目根目录：当前 Git 仓库根目录
- 原始问题：为 5 岁儿童设计并实现一个通过手势控制布鲁伊移动和动作、包含收集道具、躲避障碍与角色切换的儿童友好横版卷轴游戏

## Current Phase

- 阶段：Phase 4B 游戏体验精修审查
- 状态：pending_pm
- 当前目标：关卡 1 已完成地面纵深接触带、人工内缩 swept hitbox 与 1.0×–1.6× 速度耦合跳跃；GI-02 直达大厅、六枚状态化指示图、16–22px 进度槽和低龄化双字体保持完成。等待 PM 试玩确认 L1 落地纵深、碰撞时机与提速后的跳跃节奏，并一并确认整体视觉语气。

## Phase Checklist

| 阶段 | 产物 | 状态 | 备注 |
|---|---|---|---|
| Phase 1 产品调研判断 | `01-research.md` | CONFIRMED | `Careful Go`；三运行时、双输入通道、web-only 与低挫败边界已确认 |
| Phase 1A 竞品页面体验 | `01A-competitor-page-experience.md` | CONFIRMED | Nex 直接跟手、Doodle Jump 自动弹跳落台与 Flappy/涂色边界已确认 |
| Phase 2 产品架构 | `02-architecture.html` | CONFIRMED | 4 层 17 模块、共享服务 + 三独立 runtime + 拳掌/掌心 XY 输入已确认 |
| Gate 页面形态决策 | 写入 `02` 或 `03` | CONFIRMED | 输入准备 → 三玩法大厅 → 玩法内教学 → 全屏游戏画布 → 单玩法成绩卡已确认 |
| Phase 3 功能细节 | `03-feature-手势输入闭环.md` | CONFIRMED | Gesture Lab 拳掌循环 + PoseTransitionEvent/HandTrackingFrame 双通道已确认 |
| Phase 4A 原型规格 | `04A-prototype-spec-手势输入闭环.md` | CONFIRMED | 摄像头 GI-02 直达大厅、键盘完整路径、双通道 InputProfile、web-only 五视口与 QA 策略已同步 |
| Phase 4B HTML 主干 Demo | `04B-prototype-手势输入闭环.html` | CONFIRMED | 历史 6 屏输入 Demo；当前可试玩源真相已由集成式 MVP 的真实识别实现取代 |
| Phase 3 核心关卡循环 | `03-feature-核心关卡循环.md` | CONFIRMED | 三玩法默认可选、玩法内安全教学、温和无限递进、3 颗勇气心、设备内分数/Top 5 已同步 |
| Phase 4A 核心关卡循环 | `04A-prototype-spec-核心关卡循环.md` | CONFIRMED | 玩法大厅、三种独立教学/运行态、L1 空间碰撞与本地成绩页已同步 |
| Phase 4B 集成式可试玩 MVP | `04B-prototype-手势小狗探险MVP.html` | PENDING_PM | L1 地面/碰撞/跳跃物理已优化；GI-02 直达、六枚指示图、16–22px 进度与双字体保持完成；L1 物理 4/4、键盘/出生三视口、scored loop 9/9 PASS，等待 PM 试玩确认 |
| Phase 4C HTML 状态扩展 | `04C-prototype-[名称].html` | OPTIONAL | PM 确认 04B 后按需触发；默认 `QA-LIGHT` |
| Phase 05A AI 仿真用研 | `05A-ai-persona-prototype-review-[名称].md` + `05A-ai-persona-findings-[名称].json` | TODO | 04B 后按多个 persona 心智收集候选问题 |
| Phase 05B PM 仿真问题裁决 | `05B-pm-simulation-decision-[名称].md` | TODO | PM accept 的 finding 才进入 Change Router |

## Review Gates

> 每阶段完成后，只审 PM 核心决策，不审全部执行细节。状态：missing / pending_pm / confirmed / changes_requested。Review Slice 是轻量摘要；Review Console 是 PM 阅读材料、决策卡和下游影响的网页审查入口，默认写入 `reviews/`。

| 阶段 | 产物 | Review Slice | Review Console | PM 结论 | 下一步 |
|---|---|---|---|---|---|
| Phase 1 产品调研判断 | `01-research.md` | confirmed | `reviews/change-proven-bounce-mode-review.html` | 用户确认并列玩法、web-only、本地 Top 5 与成熟平台弹跳方向 | 已传播至 01A→04B |
| Phase 1A 竞品页面体验 | `01A-competitor-page-experience.md` | confirmed | `reviews/change-proven-bounce-mode-review.html` | Doodle Jump 弹跳落台心智、Nex 直接跟手与低挫败边界已确认 | 已传播至 02 |
| Phase 2 产品架构 | `02-architecture.html` | confirmed | `reviews/change-proven-bounce-mode-review.html` | 共享 Session/Safety/Score/Coach + 三独立 runtime 已确认 | 已传播至 03 |
| Gate 页面形态决策 | 写入 `02` 或 `03` | confirmed | `reviews/change-proven-bounce-mode-review.html` | 输入准备、三玩法大厅、玩法内安全教学、全屏横版画布与双列成绩卡已确认 | 已传播至 03/04A/04B |
| Phase 3 手势输入闭环 | `03-feature-手势输入闭环.md` | confirmed | `reviews/change-proven-bounce-mode-review.html` | 全局只确认输入；拳掌边沿与分类无关的掌心 X/Y 位置流在玩法内消费 | 已传播至 04A/04B |
| Phase 4A 手势输入闭环 | `04A-prototype-spec-手势输入闭环.md` | confirmed | `reviews/change-proven-bounce-mode-review.html` | 输入准备 CTA、三 capability InputProfile 与玩法内教学边界已确认 | 已传播至 04B |
| Phase 4B HTML 主干 Demo | `04B-prototype-手势输入闭环.html` | confirmed | `reviews/phase-4b-gesture-input-review.html` | 历史 6 屏输入 Demo；其演示适配器不再代表当前集成式实现 | 当前实现以集成式 MVP 为准 |
| Phase 3 核心关卡循环 | `03-feature-核心关卡循环.md` | confirmed | `reviews/change-proven-bounce-mode-review.html` | 三玩法默认可选、L2 完整离场、L3 自动弹跳落台、温和递进与本地分数已确认 | 已传播至 04A |
| Phase 4A 核心关卡循环 | `04A-prototype-spec-核心关卡循环.md` | confirmed | `reviews/change-proven-bounce-mode-review.html` | 玩法大厅、三类运行态、双列成绩卡与成熟平台玩法已确认 | 已传播至 04B |
| Phase 4B 集成式可试玩 MVP | `04B-prototype-手势小狗探险MVP.html` | pending_pm | `reviews/phase-4b-mvp-review.html` | L1 纵深接触带、swept hitbox 与速度耦合弹道完成；既有指示图、HUD 与双字体保持；L1 4/4 + scored loop 9/9 PASS | PM 试玩确认 L1 地面纵深、碰撞时机、基础/高速跳跃节奏，并一并确认既有视觉语气后确认 Phase 4B |
| Phase 4C HTML 状态扩展（可选）| `04C-prototype-[名称].html` | missing | missing | 待确认 extension states 是否完整、inspector 是否与 04B 一致 | Phase 4B gate confirmed 后按需触发 |
| Phase 05A AI 仿真用研 | `05A-ai-persona-prototype-review-[名称].md` | missing | missing | 待确认 persona 来源、候选问题、严重度、信心和 route hint | Phase 4B gate confirmed 后推进 |
| Phase 05B PM 仿真问题裁决 | `05B-pm-simulation-decision-[名称].md` | missing | missing | 待确认 accept / reject / defer / needs_more_context 裁决 | accept finding 进入 Change Router |

## Source Of Truth Map

| 层级 | 源真相文件 | 负责内容 | 常见变更 |
|---|---|---|---|
| L4 调研层 | `01-research.md` / `01A-competitor-page-experience.md` | 目标用户、核心问题、Go/No-Go、Target Surface、竞品/参考样本、核心假设 | 方向、用户、端型、竞品判断变化 |
| L3 架构层 | `02-architecture.html` / 页面形态 Gate | 模块边界、MVP 优先级、页面类型、信息密度 | 页面形态或模块边界变化 |
| L2 功能层 | `03-feature-[模块名].md` | 范围、主流程、字段模型、业务规则、边界与排除 | 流程、字段、规则变化 |
| L1 原型规格层 | `04A-prototype-spec-[模块名].md` | screen、state、interaction、响应式、HTML 验收标准 | screen/state/交互补充 |
| L0 实现层 | `04B-prototype-[名称].html` / `04C-prototype-[名称].html` | 视觉实现、布局、可点击性、可访问性、QA 修复 | 溢出、不可点、focus/aria、视觉 bug |

> `05A` 和 `05B` 是审查与裁决产物，不是新的源真相层。AI finding 只是候选问题；只有 PM accept 后，才按 L0-L4 回到对应源真相文件修改。

## Change Requests

> 任何“改一下”先路由到 L0-L4，再执行。正式产物保持当前可信源，历史过程写入 `changes/change-log.md`。

| Change ID | 用户请求 | 路由层级 | 最早修正点 | PM 确认状态 | 执行状态 |
|---|---|---|---|---|---|
| CR-20260815-l1-ground-collision-jump-physics | L1 角色/障碍进入纵深地面；修复提前/漏碰；参考小恐龙优化滚动速度与跳跃关联 | L2 功能层（下游含 L1/L0/QA） | `03-feature-核心关卡循环.md` | confirmed（用户逐项明确要求） | verified：03→04A→04B→L1 QA-TARGETED；物理 4/4、键盘/出生三视口、scored loop 9/9 PASS |
| CR-20260815-keyboard-single-page-xy-control | 键盘入口合并/换肤；摄像头手图更新；L2 增加四向移动；修复 L2 提示重叠与 L1 障碍凭空出现 | L2 功能层（下游含 L1/L0/资产） | `03-feature-核心关卡循环.md` | confirmed（用户逐项明确要求） | verified：03→两份04A→04B→四向指示图→QA-TARGETED 已同步；3 视口新专项、4 视口图标专项与 scored loop 9/9 PASS |
| CR-20260815-child-friendly-font-research | 调研并替换当前系统 UI 字体为低龄化、免费商用中文字体 | L0 实现层 | `04B-prototype-手势小狗探险MVP.html` + 本地字体资产/许可证 | confirmed（用户回复“可以更新”，并要求其他人下载后可正常查看） | verified：双字族以本地 WOFF2 子集随仓库分发；OFL、字形覆盖与四视口 QA-TARGETED 通过 |
| CR-20260815-direct-hub-instruction-icons | 摄像头验证后直接进关卡选择；为入口/运行/找手状态分别生成正确指示图；校正并增高 HUD 进度槽 | L1 原型规格层（下游含 L0/资产） | 两份 `04A-prototype-spec-*.md` | confirmed（用户逐项明确要求；不改变输入能力/玩法规则/计分） | verified：GI-03/GI-04 移除；6 枚独立透明生图接入；进度 16–22px 对齐轨道；四视口专项 PASS，scored loop 9/9 PASS |
| CR-20260815-round-back-button | 摄像头准备页返回按钮由方形木牌统一为与其他入口一致的圆形木框 | L0 实现层 | `assets/ui/control-icons/back-control.png`（集成 04B 直接消费） | not_required（screen/state/文案/交互不变） | verified：透明 PNG 与四视口定向检查 PASS；两档截图人工复核圆形轮廓/对齐正常 |
| CR-20260815-camera-preview-left-safe-area | 初始视频验证的左侧视频压到木框/枝叶装饰区 | L0 实现层 | `04B-prototype-手势小狗探险MVP.html` | not_required（既有 screen/state/交互与视频比例不变） | verified：视频左侧按底板宽度保留 ≥9.2% 装饰安全区；四视口定向检查 PASS |
| CR-20260815-layout-icon-obstacle-polish | 修复 GI-02 视频/按钮/icon 层级、移除抽屉可见标签、修正 Top 5 数字与 L2 障碍右侧入场 | L0 实现层 | `04B-prototype-手势小狗探险MVP.html` | not_required（既有 screen/state/家长能力/Top 5/玩法规则不变） | verified：四视口 GI-02/指引/结算/L2 轨迹 PASS；scored loop 9/9 PASS |
| CR-20260815-initial-panel-height | 首屏手绘底板收短高度，减少上方空白并保持内容居中 | L0 实现层 | `04B-prototype-手势小狗探险MVP.html` | not_required（不改变 screen/state/隐私与玩法规则） | verified：大屏高度封顶 680px、低高度视口自动收缩；六视口居中/装饰安全区/无滚动检查 PASS |
| CR-20260815-generated-control-icons | 修复拍摄按钮右缘裁切；生成摄像头准备底板与统一控制图标；替换家长、准备、运行和暂停中的主要旧图标 | L0 实现层 | `04B-prototype-手势小狗探险MVP.html` | not_required（不改变 screen/state/隐私、输入映射与玩法规则） | verified：6 枚透明控制图标 + 1 张 3:2 面板接入；四视口边界/加载/动态图标映射/无滚动检查 PASS；仅保留隐私区 3 枚低优先级语义线性图标 |
| CR-20260815-hud-milestone-input-clarity | 修复倒计时安全区；HUD 改为距离/高度单指标并去重升级文案；独立升级庆祝层与增强动效；优化提醒板；键盘模式移除教练/手势标记；生成 `0–9 + m` 字形 | L1 原型规格层（下游含 L0/资产） | `04A-prototype-spec-核心关卡循环.md` | confirmed（用户逐项明确要求；不改变计分/Top 5/阈值/玩法规则） | verified：04A→数字资产→04B→定向 QA 已同步；3 视口新检查、3 视口旧 HUD/弹窗回归与 scored-loop 9/9 PASS |
| CR-20260815-brand-level-icons | 生成队伍标识与三关独立图标；首屏内容居中；输入图标放大为按钮本体、文字旁置并移除卡底板；隐私区内收弱化 | L0 实现层 | `04B-prototype-手势小狗探险MVP.html` | not_required（不改变 screen/state/隐私与玩法规则） | verified：4 张 512px RGBA 生图资产接入；六视口内容中轴/装饰安全区/无滚动、双输入门槛及 LV-00 图标加载检查 PASS |
| CR-20260815-l3-hud-popup-layout | 修正 L3 踏板素材显示；优化左上记分板四向边距与底部满宽进度；重排居中暂停弹窗文字 | L0 实现层 | `04B-prototype-手势小狗探险MVP.html` | not_required（不改变 screen/state/玩法规则） | verified：1840×1280、1219×681、919×843 三视口定向检查 PASS；踏板无矩形阴影，HUD/弹窗无相交与溢出 |
| CR-20260815-initial-ui-title | 优化初始界面；“小尾巴探险队”改为顶部风格化居中标题；取消首屏“家长设置”标识 | L0 实现层 | `04B-prototype-手势小狗探险MVP.html` | not_required（不改变 screen/state/隐私与玩法规则） | verified：六视口无溢出/滚动，标题中轴、卡片与隐私区通过断言；键盘入口与摄像头隐私门槛回归 PASS |
| CR-20260815-game-ui-calibration | 游戏记录统一左上并校准字号/进度；里程碑置于记分下方；提示居中顶部；优化暂停图标文案；统一游戏风格生图面板；修正准备浮窗垂直居中并整体校准 | L0 实现层 | `04B-prototype-手势小狗探险MVP.html` | not_required（用户明确要求实现，不改变 screen/state/玩法规则） | verified：新生成透明手绘面板接入；三玩法×五视口 HUD/遮挡测试 PASS；五视口准备/游戏/暂停/结算居中与出界断言 PASS |
| CR-20260815-gameplay-polish | 修复 L1 落地/障碍离场、HUD 重叠与重复计分；新增碰撞状态；统一菜单美术/BGM；成绩页改当局留念 + 竖向榜单；同步检查 L2/L3 | L2 功能层（下游含 L1/L0） | `03-feature-核心关卡循环.md` | confirmed（用户逐项明确要求；不改变三玩法、web-only 或本机隐私边界） | verified：03→04A→资产→04B→测试/Review Console 已同步；三档按钮直接替换旧文字按钮；音频 18/18、角色 6/6、玩法 9/9、地图 UI 7/7、分层地图 6/6 PASS |
| CR-20260814-child-copy-minimal | 考虑 5 岁儿童体验，从初始界面起尽量减少文字，只保留必要内容 | L1 原型规格层 | `04A-prototype-spec-手势输入闭环.md` / `04A-prototype-spec-核心关卡循环.md` | confirmed（用户明确要求；不改变玩法、流程、screen inventory 或 web-only 边界） | verified：两份 04A、集成 04B 与相关定向测试期望已同步；JS 语法与文字预算静态检查 PASS，Browser N/A by QA-LIGHT |
| CR-20260814-endless-milestone-ramp | 三种玩法升级为真正无尽玩法；L1/L2 按行进米数、L3 按爬升高度推进；难度体现在速度与障碍变化；游玩中展示里程碑；新增 UI 使用同风格生成图片 | L2 功能层（下游含 L1 新状态/视觉资产与 L0 实现） | `03-feature-核心关卡循环.md` | confirmed（用户确认距离/高度进度轴，并确认生成图片应作为完整面板替代原顶部容器而非 icon） | verified：03→04A→04B、三套完整里程碑面板、六种障碍图片、结果页与确定性 QA seam 已同步；脚本/manifest/spec/gates PASS；Chrome 三关阈值、Tier 5、障碍皮肤与遮挡定向检查 PASS |
| CR-20260814-game-audio | 列举当前游戏需要的 BGM/音效，使用 sound-effects skill 生成并替换 | L2 内容与反馈能力（实现落点 L0） | `03-feature-核心关卡循环.md` | confirmed（用户明确要求生成并替换，不改变玩法范围） | verified：4 BGM + 14 SFX、本地音频引擎、家长开关与 18/18 静态检查 PASS |
| CR-20260814-map-ui-skin | 替换玩法入场旧地图与 L1 旧水坑，并让大厅、面板、HUD、教练、按钮和成绩页统一为地图插画风格 | L1 原型规格层（含 L0 接入修复） | `04A-prototype-spec-核心关卡循环.md` | confirmed（用户明确指定视觉替换，不改变功能范围） | verified：入口/大厅/成绩页地图承接、水坑透明物件、全局冒险手册 UI 与专项 QA 已完成 |
| CR-20260814-secondary-character-sprites | 将所有伙伴角色的橙色滤镜占位图替换为用户图 2 中的橙色角色，并补齐项目实际动作 | L2 内容边界（实现落点 L0） | `03-feature-核心关卡循环.md` | confirmed（用户明确提供图 2 并要求全部替换；公开发行授权边界仍保留） | verified：双角色素材契约、6 组/24 帧伙伴素材与 04B 已接入；双角色 6/6、玩法 9/9、识别 1/1 PASS |
| CR-20260814-layered-game-maps | 三关使用低干扰分层示意地图；L1 横向无缝循环；障碍、踏板与安全物件独立生成并接入 | L2 功能层（实现落点 L0） | `03-feature-核心关卡循环.md` | confirmed（用户明确指定视觉与运行边界） | verified：地图/物件生成与接入完成；地图 6/6、玩法 9/9、双角色 6/6、识别 1/1 PASS |
| CR-20260814-bluey-character-sprites | 将当前项目主角替换为用户参考图中的蓝色小狗，并为项目实际涉及的动作生成/接入角色素材 | L2 内容边界（实现落点 L0） | `03-feature-核心关卡循环.md` | confirmed（用户明确要求私人本地版替换角色；公开发行授权边界仍保留） | verified：03/04A/04B、素材包、试玩/验收与 QA 已同步；角色 6/6、玩法 9/9、识别 1/1 PASS |
| CR-20260814-vertical-camera-climb | L3 必须真正沿用 Doodle Jump 的不断向上跳与画面向上推进，不接受只让平台自动经过判定线的自创变体 | L4 竞品机制误读（下游涉及 L3 物理/相机/世界字段、L1 状态和 L0 实现） | `01A-competitor-page-experience.md` | confirmed（用户明确要求按成熟玩法还原核心机制） | verified：`01A→04B`、QA、说明、验收与 Review Console 已同步 |
| CR-20260814-proven-bounce-mode | 成绩页下方被裁切；萤火虫障碍越过角色后过早消失；第三玩法不要自创叠云，改用 Doodle Jump / 赛车躲避 / 涂色等成熟玩法心智 | L4 调研层（同时包含 L2 障碍生命周期、L1 成绩页、L0 实现） | `01A-competitor-page-experience.md` / `01-research.md` | confirmed（用户明确要求沿用已有玩法；本轮采用自动弹跳 + 手掌左右对准宽平台，不复制品牌资产） | verified：`01A→04B`、试玩说明、验收与 QA 已同步 |
| CR-20260814-mode-hub-scored-loops | 三玩法默认解锁；教学下沉到玩法；增加内部递进、设备内分数/Top 5；修复 L1 卷轴、坑洞与失败反馈 | L4 调研层 | `01A-competitor-page-experience.md` / `01-research.md` | confirmed | verified：`01A→04B` 与 QA 已同步 |
| CR-20260813-game-coach-readout | 修复游戏内识别文案覆盖摄像头画面 | L0 实现层 | `04B-prototype-手势小狗探险MVP.html` | not_required | verified |
| CR-20260813-multi-mode-adventure | 引入直接跟手躲避及 Square Bird / Flappy 式成熟机制，提升三关玩法差异；同步修正 L1 跳跃幅度 | L4 调研层（跳跃手感落 L2） | `01A-competitor-page-experience.md` / `01-research.md` | confirmed | verified：`01A→01→02→03→04A→04B` |
| CR-20260812-three-level-progression | 修复关卡手势失效、重排关卡 UI，并扩展为逐步增加手势能力的三关 | L4 调研层 | `01-research.md` / `01A-competitor-page-experience.md` | confirmed | verified |
| CR-20260812-optional-repeat-practice | 首轮达标后允许继续重复练习，修复第二轮小狗不响应 | L2 功能层 | `03-feature-手势输入闭环.md` | confirmed | verified |
| CR-20260812-recognition-layout-precision | 修复拳掌识别不精准与 GI-03 右侧教练重叠遮挡 | L0 实现层 | 识别运行时 + 集成 04B | not_required | verified |
| CR-20260812-child-friendly-control-cycle | 取消无意义识别倒计时；用冻结与握拳复位形成低龄控制循环；修复文字错位 | L2 功能层 + L0 实现层 | `03-feature-手势输入闭环.md` | confirmed | verified |
| CR-20260812-real-gesture-short-practice | 真实摄像头识别；减少动作训练重复 | L2 功能层 | `03-feature-手势输入闭环.md` | confirmed | verified |
| CR-20260812-friendly-framing-gesture-coach | 放宽取景；大画面+右侧指引；关键点/识别反馈；易用手势 | L2 功能层 | `03-feature-手势输入闭环.md` | confirmed | verified |
| CR-20260812-file-protocol-launch | file:// 直接打开导致模型加载失败并误报 | L0 实现层 | `04B-prototype-手势小狗探险MVP.html` | not_required | verified |
| CR-20260812-single-viewport-no-scroll | 所有页面单视口自适应，不允许上下滑动 | L1 原型规格层 | 两份 `04A-prototype-spec-*.md` | confirmed | verified |
| CR-20260812-layout-overlap-open-palm | 修复单屏压缩后的重叠；检查并修复张开手掌难识别 | L0 实现层 | 集成式 `04B` + 本地识别运行时 | not_required | verified |

## Known Inputs

- 用户原始请求：为 5 岁儿童设计并实现一个通过手势控制布鲁伊移动和动作、包含收集道具、躲避障碍与角色切换的儿童友好横版卷轴游戏

## Open Questions

- 本轮无阻塞问题。排行榜按设备内个人 Top 5 实现；账号、昵称、联网全球榜和跨设备同步不进入 `web-only` 家庭 MVP。

## Decision Log

| 日期 | 决策 | 依据 | 影响 |
|---|---|---|---|
| 2026-08-15 | L1 统一地面纵深接触带、连续 swept hitbox 与速度耦合弹道 | 用户指出角色/障碍悬浮、提前/漏碰，并要求参考 Google 小恐龙思考滚动速度与跳跃关系 | 03/04A/04B 同步；1.0×–1.6× 起跳速度与重力成对调整，首次真实主体接触才判定，跨帧不漏碰；L1 物理 4/4 与 scored loop 9/9 PASS |
| 2026-08-15 | 键盘与摄像头输入均收敛为单页就绪；L2 从单轴上下升级为双轴四向控制 | 用户明确指出键盘第二层确认冗余、键盘 UI 与摄像头风格不一致，并要求孩子可上下左右自由移动；同时指出 L2 提示相交和 L1 障碍凭空出现 | 03/两份 04A/04B 同步；GI-06 移除，GI-05 五键灯同页直达大厅；L2 消费 X/Y 并新增四向生图；里程碑避让动作卡；L1 按视觉宽度从屏外右侧生成；定向 QA 通过 |
| 2026-08-15 | 摄像头输入就绪收敛在 GI-02 并直达玩法大厅；动作/找手提示按语义分别生图 | 用户明确认为第二张 ready 页无意义，并指出入口、运行、等待复用简单手掌图导致 logo/语义错误；同时要求进度槽增高并匹配底板 | 两份 04A 与集成 04B 同步；新增六枚透明指示图，L1 waiting/armed 动态切换；HUD 进度槽 16–22px 对齐图片轨道；定向 QA 通过 |
| 2026-08-15 | 低龄化中文字体采用“标题 Xiaolai + 正文/UI Resource Han Rounded CN”并随仓库自托管 | PM 授权更新且要求其他人下载项目后无需安装字体即可正常查看；两字族均为 OFL 1.1 | 04B 使用本地 `@font-face` 和 WOFF2 子集，不依赖 CDN/系统字体；新增字体许可证、维护说明与四视口字体专项 QA |
| 2026-08-15 | 运行态 HUD 收敛为距离/高度单指标，并用独立庆祝层表达升级 | 用户截图指出星形分数概念不成立、顶部/下方“新挑战”重复、键盘模式仍残留摄像头/手势 UI、数字与边距不统一 | 04A/04B 改用 `0–9 + m` 图集、满宽进度、独立升级文案/动效、键盘纯净舞台与倒计时安全层；计分和 Top 5 规则不变 |
| 2026-08-15 | 完成 11 项游戏体验精修并进入 PM 审查 | 用户截图逐项指出角色悬浮、障碍消失、HUD/榜单/结果页与视觉音频问题 | 双角色碰撞动作、障碍离场、统一 HUD、当局单帧、竖向 Top 5、菜单美术与 4 条 BGM 生效；Phase 4B 保持 `pending_pm` |
| 2026-08-11 | 创建标准 PM 工作流项目 | 用户确认新建项目 | 从 Phase 1 开始推进 |
| 2026-08-11 | PM 工作流环境和阶段门禁通过 | `workflow:check-env`、`workflow:validate-gates` 均通过 | 可以进入 Phase 1 |
| 2026-08-11 | 安装 Playwright 与共享 Chromium | 项目需要浏览器级游戏和摄像头交互验收 | 后续可执行自动化浏览器检查 |
| 2026-08-11 | 确认首版 web-only、笔记本优先、原创占位素材 | 用户回复“按推荐方案继续 Phase 1” | 固定本轮端型与素材边界 |
| 2026-08-11 | Phase 1 结论为 Careful Go | 品类与技术已有证据，儿童真实手势可用性尚未验证 | Gesture Lab 成为 P0，Phase 1 Gate 等待 PM 确认 |
| 2026-08-11 | Phase 1 Gate confirmed | 用户明确回复“确认 Phase 1，继续 Phase 1A” | Careful Go、80% 门槛、角色切换降级和四个样本生效 |
| 2026-08-11 | Phase 1A 建议采用四段式体验骨架 | 四个参考样本的交互结构对比 | 等待 PM 确认后进入 Phase 2 |
| 2026-08-11 | Phase 1A Gate confirmed | 用户明确回复“确认 Phase 1A，继续 Phase 2” | 四段式骨架、键盘双重定位和低挫败结果机制生效 |
| 2026-08-11 | Phase 2 形成 4 层 14 模块产品架构 | Phase 1 Careful Go 与 Phase 1A 已确认体验骨架 | 等待 PM 确认模块边界、P0 闭环和页面形态 |
| 2026-08-11 | Phase 2 与页面形态 Gate confirmed | 用户明确回复“确认 Phase 2，并创建 /goal，按推荐方案完成可试玩 MVP” | 4 层 14 模块、P0 职责闭环、首批手势输入模块与四类页面形态生效 |
| 2026-08-11 | 创建持久目标推进可试玩 MVP | 用户明确要求创建 `/goal` 并按推荐方案执行 | 目标 active；持续推进但仍遵守每阶段 PM Gate |
| 2026-08-11 | 完成手势输入闭环功能规格 | 已确认架构与页面形态 + `product-detail` 规则 | 等待 PM 确认三档模式、尝试计数和输入冲突规则 |
| 2026-08-12 | Phase 3 手势输入闭环 confirmed | 用户明确回复“确认 Phase 3 手势输入闭环，继续 Phase 4A” | 三档模式、严格 8/10 门槛、尝试计数与家长键盘优先规则生效 |
| 2026-08-12 | 完成手势输入闭环 Phase 4A 原型规格 | 已确认 Phase 3 + `prototype-spec-writer` 质量门 | 6 screens、1 backbone group 与 HTML 验收等待 PM 确认 |
| 2026-08-12 | Phase 4A 手势输入闭环 confirmed | 用户回复“Phase 4A 手势输入闭环，继续 Phase 4B” | 6 screens、单一 backbone、状态分层和 Web QA-TARGETED 生效 |
| 2026-08-12 | 完成手势输入闭环 Phase 4B 主干 Demo | 已确认 Phase 4A + `html-prototype-builder` + QA-TARGETED 12/12 | 6 屏主干、键盘完整路径、摄像头恢复、轨道释放与单次 input-ready 等待 PM 确认 |
| 2026-08-12 | Phase 4B 手势输入闭环 confirmed | 用户明确回复“确认 Phase 4B，继续核心关卡循环 Phase 3” | 6 屏主干、InputProfile、安全降级与演示识别边界生效；进入核心关卡功能细节 |
| 2026-08-12 | 完成核心关卡循环 Phase 3 功能规格 | 已确认 Phase 4B + `product-detail` 质量门 | 五段式 180 秒关卡、温和碰撞、三模式共用关卡与 CompletionSummary 等待 PM 确认 |
| 2026-08-12 | Phase 3 核心关卡循环 confirmed | 用户明确回复“确认核心关卡 Phase 3，继续 Phase 4A” | 五段式节奏、12 枚收集物、温和碰撞与伙伴接力恢复规则生效 |
| 2026-08-12 | 完成核心关卡循环 Phase 4A 原型规格 | 已确认 Phase 3 + `prototype-spec-writer` 质量门 | 9 屏集成式 backbone、LV-01–LV-03 与 QA-TARGETED 等待 PM 确认 |
| 2026-08-12 | Phase 4A 核心关卡循环 confirmed | 用户明确回复“确认核心关卡 Phase 4A，继续 Phase 4B” | 集成式新文件、3 个新 screen、LV-02 状态机与 QA-TARGETED 生效 |
| 2026-08-12 | 完成 Phase 4B 集成式可试玩 MVP | 已确认 Phase 4A + `html-prototype-builder` + QA-TARGETED 12/12 | 9 屏主干、双输入、低挫败恢复、本地启动与试玩说明等待 PM 确认 |
| 2026-08-12 | Phase 4B 集成式可试玩 MVP confirmed | 用户明确要求“确认 Phase 4B，完成 goal” | 9 屏主干、关卡反馈、双输入与演示识别边界成为完成基线；/goal 进入最终验收 |
| 2026-08-12 | CR-20260812 真实识别与短练习 verified | 用户要求真实识别并降低动作训练重复度；MediaPipe 本地模型与 QA-TARGETED 14/14 | 上游 03/04A 与集成 04B 已同步；新 Phase 4B 基线等待 PM 确认 |
| 2026-08-12 | CR-20260812 宽容取景与手势教练 verified | 用户要求不必塞满取景框、左侧大画面/右侧指引、可见关键点与儿童识别结果，并检查动作易用性 | 上游 03/04A、运行时、集成 04B、试玩说明、QA 与 Review Console 已同步；QA-TARGETED 17/17，等待 PM 确认 |
| 2026-08-12 | CR-20260812 file 协议启动保护 verified | 用户截图显示通过 file:// 打开时模型被浏览器拦截并误报 | 04B 已在摄像头权限前说明原因并引导 localhost；专项与全流程 QA-TARGETED 18/18，正确试玩页已打开 |
| 2026-08-12 | CR-20260812 单视口无滚动 verified | 用户明确要求页面只在单屏自适应展示，不允许上下滑动 | 两份 04A 与 04B 已同步；9 screen + 展开家长抽屉在 1440×900、1024×700 均单视口可达，QA-TARGETED 20/20 |
| 2026-08-12 | CR-20260812 重叠与张掌识别 verified | 用户指出高度压缩后文案/按钮覆盖，并实测张掌无法识别而握拳可识别 | GI-02/GI-03 已重排；三视口全 screen 无相交；Open_Palm 使用分阈值、3/5 稳定与至少三指关键点兜底；browser 21/21 + runtime 1/1 |
| 2026-08-12 | CR-20260812 低龄拳掌控制循环 verified | 用户指出识别倒计时无意义、张掌被识别却不触发角色，并要求检测后冻结与握拳复位 | 两份 03/04A、运行时、04B、试玩/QA/Review Console 已同步；GI-03 实时拳→掌→冻结→拳复位，LV-02 新目标强制重新握拳；browser 22/22 + runtime 1/1 |
| 2026-08-12 | CR-20260812 识别精度与右栏布局 verified | 用户截图指出识别不精准，且 GI-03 右侧内容相互遮挡 | 运行时改为拳掌双向几何融合、冲突拒绝与连续 3 帧确认；完整摄像头画面与关键点同尺度对齐；右栏固定三区；browser 25/25 + runtime 1/1，含 1219×681 截图等效视口与 919×843 当前窄窗 |
| 2026-08-12 | CR-20260812 自愿重复练习 verified | 用户指出第一轮后继续做动作，第二次右侧小狗不响应 | 达标标志与练习控制门已解耦；首轮即可离开，留页时第二轮及后续小狗继续响应；browser 25/25 + runtime 1/1 |
| 2026-08-12 | CR-20260812 三关渐进与关卡手势 verified | 用户指出关卡内手势无法操控、页面布局不佳并要求扩展三个渐进关卡 | 手势反馈与目标结算已解耦；新增 LV-00、45/55/65 秒三关、全屏世界/浮动教练、无损碰撞与顺序解锁；browser 回归 25/25 + 三关专项 9/9 + runtime 1/1 |
| 2026-08-13 | CR-20260813 游戏教练文案遮挡 verified | 用户截图指出取景提示与识别结果覆盖摄像头画面 | 游戏 readout 已移到视频/骨架下方；五视口及最长文案均零相交；三关专项 14/14 + browser 回归 25/25 |
| 2026-08-13 | CR-20260813 多玩法冒险 verified | 用户明确确认多玩法三关、保持 `web-only`、继续重推 `01A→04B`，并指出 L1 跳跃幅度太小 | 一条三段冒险、三个独立玩法运行时与双通道输入正式生效；L1 高跳可读性、L2 连续跟手和 L3 叠云反馈已通过 25/25 + 10/10 + 1/1 定向验收 |
| 2026-08-14 | CR-20260814 玩法大厅与计分循环 verified | 用户明确要求三个玩法默认解锁、教学下沉、玩法内递进/分数/排行榜，并指出 L1 跳跃时序与坑洞失败反馈不成立 | `01A→04B` 已重推：输入准备直达玩法大厅；三个玩法独立安全教学；每 20 秒加速 0.1×、最高 1.6×；3 颗勇气心；设备内分玩法 Top 5；L1 同世界速度空间碰撞、坠落救援与短暂无敌。专项 7/7 + runtime 1/1 PASS |
| 2026-08-14 | CR-20260814 成熟平台弹跳玩法 verified | 用户指出成绩页被裁切、萤火虫障碍判定后消失，并要求第三玩法沿用已有成熟小游戏感觉 | `01A→04B` 已重推：L3 改为自动弹跳 + 掌心 X 左右落宽平台；L2 障碍判定后继续移动至画面外；成绩 Top 5/按钮在六视口完整露出。专项 9/9 + runtime 1/1 PASS |
| 2026-08-14 | CR-20260814 纵向镜头攀升机制 verified | 用户指出 L3 仍是平台经过固定判定线的自创变体，要求还原持续向上跳与画面自动上推 | `01A→04B` 已重推：L3 使用 playerWorldY/verticalVelocity/gravity；下降落台立即再弹；cameraY 在上方阈值后单调上升；平台 screenY 由 worldY-cameraY 推导；高处动态生成、低处回收；安全云托底。专项 9/9 + 运行时 1/1 PASS |
| 2026-08-14 | CR-20260814 参考角色动作素材 verified | 用户要求把主角换为参考图角色并生成项目实际动作 | 私人本地素材边界已同步至 03/04A；生成 idle/run/jump/hover/hurt/celebrate 六组 24 帧并接入 04B。角色专项 6/6、玩法 9/9、识别 1/1 PASS；公开发布前仍需授权或切换原创角色 |
| 2026-08-14 | CR-20260814 橙色伙伴动作素材 verified | 用户要求将所有伙伴位置替换为图 2 角色并补齐动作 | 生成伙伴 idle/run/jump/hover/hurt/celebrate 六组 24 帧并接入开局、关卡运行和成绩页；橙色滤镜占位实现已移除；双角色 6/6、玩法 9/9、识别 1/1 PASS |
| 2026-08-14 | CR-20260814 三关分层地图 verified | 用户要求按参考示意图重做三关场景、让 L1 可前后循环并同步生成结构物件 | 三关低干扰远中景、L1 循环地面/软木箱、L2 上下树篱、L3 踏板/安全云已接入；地图 6/6、玩法 9/9、角色 6/6、识别 1/1 PASS |
| 2026-08-14 | CR-20260814 地图一致性 UI verified | 用户指出入口封面、水坑和外围 UI 仍是旧视觉 | 三主题入口封面、玩法大厅预览与成绩背景已复用真实地图；L1 水坑改为独立透明物件；全局采用暖纸张/木色描边/压感按钮。地图 UI 6/6、地图 6/6、玩法 9/9、双角色 6/6、识别 1/1 PASS |
| 2026-08-14 | CR-20260814 游戏音频 verified | 用户要求盘点、生成并替换当前游戏 BGM 与音效 | ElevenLabs 生成 4 BGM + 14 SFX；03→04A→04B 已同步本地音频映射、家长开关、暂停/后台停播、冷却与静默降级；音频静态检查 18/18 PASS |

## Pending PM Review Slice — Phase 4B 游戏体验精修

- 本阶段关键决策：L1 角色/障碍统一落入地面纵深接触带；人工内缩主体 hitbox 通过 swept interval 在首次真实接触边沿判定，避免中心点提前/漏碰；地面速度从 1.0× 提升到 1.6× 时，起跳速度与重力成对温和调整并冻结单跳参数。摄像头准备收敛在 GI-02 并直达大厅；六枚指示图、16–22px 进度槽、双角色动作、本地双字体和手绘冒险视觉保持不变。
- 被放弃的方案：摄像头成功后的重复 ready 页；用同一个简单手掌 SVG 代表拳→掌、握拳和找手；圆形按钮式动作徽章；进度槽漂离图片预留轨道；首屏旧爪印方形徽章、碰撞帧销毁障碍、左侧重复分数、横向分数按钮、保存/上传儿童画面、旧首屏底图和短促单一 BGM。
- 需要 PM 确认的问题：请重点试玩 L1，确认角色/障碍确实位于地面纵深中、肉眼接触与扣心一致、基础速度与最高速度下跳跃都可预测；再一并确认动作图、进度、字体和整体手绘语气适合 5 岁儿童。
- 追加待确认：已实现“标题/关卡名/庆祝语使用 Xiaolai，正文/UI/按钮使用 Resource Han Rounded CN”；两字族均由项目内本地 WOFF2 加载。PM 只需试玩确认低龄化语气、标题辨识度与正文可读性。
- 不需要 PM 审查的执行细节：CSS inset、JPEG 质量、sprite 拆帧参数、测试 seam、音频冷却毫秒与 localStorage key。
- 进入下一阶段的条件：PM 完成三关各一次试玩并确认本轮精修；随后进入真实儿童陪同试玩或 05A AI 仿真用研。

## Historical Confirmed PM Review Slice — Phase 4B 手势输入闭环

- 本阶段关键决策：
  - 用一个纯产品 HTML 自然连通 GI-01 至 GI-06；键盘是可真实操作的完整路径，摄像头阻塞始终可恢复到键盘。
  - camera_full 与 keyboard_full 都通过同一 Input Adapter 交付三类 StandardCommand，并保证 `input-ready` 只派发一次。
  - 摄像头主路径在本原型使用明确标注的“演示识别”适配器；它只验证流程与状态机，不代表真实儿童手势准确率已验证。
- 被放弃的方案：
  - 不加入 prototype shell、inspector、screen-nav 或调试按钮；不伪造横版关卡；不引入 Bluey 受版权保护素材。
  - 不把摄像头错误做成死路，也不把键盘仅作为隐藏测试入口。
- PM 已确认：
  - 6 个 screen 的自然产品主干、低龄单动作舞台和家长/儿童分层符合 Phase 4A。
  - InputProfile、输入去重、摄像头释放和键盘完整降级达到进入核心关卡规格的条件。
  - 接受演示识别仅用于 04B 流程验证；真实识别接入与儿童 8/10 验证仍是 MVP 未完成项。
- 不需要 PM 审查的执行细节：
  - SVG 原创小狗的路径、CSS 动画参数、Playwright fake media 参数和自动化选择器。
  - 通用检查器对 prototype shell/inspector 的失败项；本阶段规格明确禁止把这些脚手架放进 04B 产品画布。
- 进入下一阶段的条件：
  - 已满足：手势输入 04B Gate 为 confirmed，并已进入 `03-feature-核心关卡循环.md`。

## Confirmed PM Review Slice — Phase 2

- 本阶段关键决策：
  - 产品拆为“用户触达与页面形态、核心游戏编排、输入与儿童反馈能力、本地基础与内容边界”4 层 14 模块。
  - 14 个模块共同构成家庭 MVP 的 P0 职责闭环；账号、云同步、云端视频、多关卡、移动端、榜单与 Game Over 不进入本期。
  - Phase 3 推荐先细化手势练习室、手势识别与统一输入适配，再细化完整关卡循环。
- 被放弃的方案：
  - 不把摄像头识别直接耦合到角色动作；不把家长设置放入儿童 HUD；不建设无助于核心假设的后台与成长系统。
- PM 已确认：
  - 4 层 14 模块边界与家庭 MVP P0 范围。
  - Phase 3 先做“手势输入闭环”功能细节。
  - 四类页面形态与页面形态 Gate。
- 不需要 PM 审查的执行细节：
  - 架构图缩放、筛选、mini-map、导出，以及具体模型阈值、连续帧数量与 Phaser 实现参数。
- 进入下一阶段的条件：
  - PM 确认模块边界、P0 闭环、首批功能模块和页面形态；随后进入 Phase 3 `03-feature-手势输入闭环.md`。

## Learning Loop

| 文件 | 用途 | 当前状态 |
|---|---|---|
| `cases/error-cases.md` | 错误、返工和质量问题事实库 | initialized |
| `rules/authority-sources.md` | 规则来源等级与晋升门槛 | initialized |
| `rules/rule-candidates.md` | 候选规则隔离区 | initialized |
| `rules/active-rules.md` | 已确认的当前项目规则 | initialized |
| `changes/change-log.md` | 变更路由与执行过程记录 | initialized |

## Next Action

1. 打开最新试玩页，从玩法大厅依次进入三个出发封面，确认地图/UI 连贯，并试听大厅与三玩法主题是否易区分但不抢操作。
2. 在溪边试听跳跃/越障/碰撞/救援，在湿地试听穿越/碰撞，在树梢试听自动落台；确认无惊吓音和连续噪声。
3. 重点查看首屏游戏名、三关名称、关卡短提示和家长区正文，确认标题足够低龄但不潦草、正文易读；其他人通过仓库文件直接启动时无需安装字体。
4. 打开家长入口切换“声音：开/关”，再切后台返回，确认音乐正确暂停/恢复；若视觉、字体、手感与声音均通过，确认 Phase 4B。
