# 原型规格：输入就绪与玩法内控制
> 更新日期：2026-08-14 | 来源：`03-feature-手势输入闭环.md` | Target Surface：web-only

## 1. Product Frame

- 目标用户：5 岁儿童；家长负责隐私确认、摄像头授权和按键降级。
- 主要场景：笔记本浏览器近景单手输入。
- 原型目的：验证“输入就绪”与“玩法教学”职责分离，保证双通道输入真实进入三个运行时。
- Target Surface：`web-only`，沿用 Phase 1 已确认范围。
- 关键约束：视频本机处理；单屏无滚动；游戏 readout 不覆盖视频；无全局动作成绩页；儿童可见层从初始界面起采用“图形优先、文字最少”规则。

## 2. Goals And Non-Goals

### Goals

- 摄像头连续 3 帧有可靠关键点即可 ready，不要求拳掌动作。
- ready 后唯一主 CTA 为“开始游戏”，直接进入三玩法大厅。
- 摄像头与键盘都输出具名双 capability。
- 三种玩法在自己的安全场景中教学；L1 走姿态边沿，L2/L3 分别走连续掌心 Y/X。

### Non-Goals

- 不保留“去看看结果/看看结果”、拳掌练习轮次或全局动作结果页。
- 不新增第三种必需手型、左右控制、全身追踪或移动端。

## 3. Page Archetype And Reference Alignment

### Page Archetype

- 页面类型：家长设置任务流 + 儿童输入就绪确认 + 玩法内小教练。
- 核心任务：确认系统看见手 → 开始游戏；进入玩法后只学当前控制。
- 信息密度：极低；全局页只显示摄像头/手/ready，玩法页只显示一个控制目标。同一儿童视区最多同时出现 1 个短标题、1 个短提示和 1 个主 CTA。
- 默认布局：设置页分步；输入页左大视频/骨架、右 ready；游戏右上浮动小教练且 readout 在视频外。
- 为什么不是动作训练室：三个玩法控制不同，全局拳掌教程会误导跟手玩法。

### Reference Alignment

- 必须继承：Nex 的家长/儿童分层、本机隐私说明、直接世界反馈；当前用户截图中的大取景与关键点可见性。
- 可以偏离：移除旧版练习小狗和结果页。
- 禁止偏离：不得让文字覆盖视频；不得显示英文类别、置信度或技术错误给儿童。

### Product Canvas Rules

- 只呈现真实用户 UI，不显示 screen-nav、状态开关、测试按钮或 QA 说明。
- 测试 seam 仅挂在 `window.__mvpTest`。
- 儿童可见文案优先使用 2–8 个汉字；按钮优先 2–6 个汉字；删除重复表达同一状态的 eyebrow、说明段、进度句和底部注释。
- 手势图、方向箭头、角色动作、颜色和声音承担主要解释；文字只补充当前唯一动作，不同时解释后续玩法。
- 家长隐私、错误恢复和技术说明可保留完整信息，但放在家长层、折叠说明或仅错误时出现；详细无障碍说明保留在 `aria-label` / `sr-only`，不计入儿童可见文字预算。

## 4. Information Architecture

- 家长层：GI-01 隐私/模式；GI-02 摄像头授权与模型准备；家长抽屉。
- 儿童就绪：GI-03 摄像头 ready；GI-05/GI-06 键盘说明与 ready。
- 儿童玩法：LV-01 控制摘要；LV-02 安全教学与正式输入。
- 主路径：`GI-01 → GI-02 → GI-03 → LV-00`；降级：`GI-01/GI-02/GI-03 → GI-05 → GI-06 → LV-00`。

## 5. Core Flows

| Flow | Entry | Steps | Success | Edge |
|---|---|---|---|---|
| 摄像头就绪 | GI-01 | 隐私→授权→3帧见手 | GI-03“开始游戏” | 拒绝/模型失败→键盘 |
| 键盘就绪 | GI-05 | 显示 Space、↑↓、←→能力 | GI-06“开始游戏” | 无需强制按键练习 |
| L1 教学 | LV-02 tutorial | fist→palm→世界动作 | 一次高跳 | 持掌不连发 |
| L2/L3 教学 | LV-02 tutorial | 掌心上下/左右→角色跟手 | 两个方向各一次 | Unknown 仍跟手 |
| L2 教学 | LV-02 tutorial | 手上/下各一次 | 跟手成功 | Unknown 不阻断 |
| 无手恢复 | LV-02 | grace→冻结→手回来→3/2/1 | 本轮继续 | 不扣勇气 |

## 6. Screen Inventory

| ID | Screen | Purpose | Entry | Exit |
|---|---|---|---|---|
| GI-01 | 家长输入设置 | 隐私与模式 | 起始 | GI-02/GI-05 |
| GI-02 | 摄像头准备 | 授权、模型、找手 | GI-01 | GI-03/GI-05 |
| GI-03 | 摄像头已就绪 | 确认看见手并开始游戏 | GI-02 | LV-00/GI-05 |
| GI-05 | 按键说明 | 说明两类等价控制 | 降级入口 | GI-06 |
| GI-06 | 按键已就绪 | 开始游戏 | GI-05 | LV-00/GI-01 |
| LV-01/LV-02 | 玩法内控制 | 当前玩法摘要与安全教学 | LV-00 | 正式计分 |

## 7. Coverage Plan

- Backbone：与核心规格同一 `04B-prototype-手势小狗探险MVP.html`。
- GI-04 旧“动作结果”不再是 backbone，也不应存在可达入口。
- GI-03/06 的“开始游戏”都真实进入 LV-00。
- Extension：permission-denied、model-error、no-hand、keyboard takeover 均保留恢复路径。

## 8. Screen Specs

### GI-01 家长输入设置

- Purpose：权限前建立本机处理信任并选择输入。
- Content：标题“选怎么玩”、摄像头/键盘两种大图形选择、三枚隐私图标；不显示介绍段和两段重复的模式说明。
- Primary：用摄像头玩；Secondary：用按键玩。
- States：隐私未确认时摄像头 disabled；focus；error 不在本页伪装 success。
- Navigation：GI-02 或 GI-05。
- Acceptance：摄像头入口请求前仍有家长可读的折叠说明；首屏常显区只保留选择、三枚隐私承诺与确认；两个按钮 ≥44px。

### GI-02 摄像头准备

- Purpose：请求权限、加载模型、找到一只完整小手。
- Layout：大镜像视频+canvas 为主；侧栏只显示“举起一只手”、当前状态和主操作；三步技术流程不作为儿童常显文字。
- Primary：开启摄像头/重试；Secondary：改用按键。
- States：requesting/loading/finding-hand/ready/error。
- Data：cameraStatus、modelStatus、handPresence、landmarks。
- Navigation：连续 3 帧见手 → GI-03；错误/主动降级 → GI-05。
- Acceptance：关键点与视频对齐；提示不覆盖视频主体；同一时刻只显示一个取景提示，模型/摄像头/手部三项详细状态只供家长按需查看。

### GI-03 摄像头已就绪

- Purpose：只告诉孩子“系统看见手，可以开始”。
- Layout：左侧视频/骨架；右侧绿色勾、角色挥手与“准备好啦”；底部唯一主 CTA。
- Primary：“开始游戏”；Secondary：“改用按键”。
- States：ready；若摄像头中断则可重试/降级。
- Navigation：主 CTA → LV-00；不得经过 GI-04。
- Acceptance：无拳掌三步、无练习轮数、无“去看看结果/看看结果”、无后续玩法说明段、无重复 ready 状态；CTA 精确为“开始游戏”。

### GI-05/GI-06 按键就绪

- Purpose：说明等价能力并直接进入玩法大厅。
- Content：常显只保留键盘图标、“按键准备好”和主 CTA；具体 Space / ↑↓ / ←→ 只在所选玩法内出现。
- Primary：GI-05“按键准备好了”→GI-06；GI-06“开始游戏”→LV-00。
- Secondary：返回摄像头。
- States：default/focus；不要求完成次数。
- Acceptance：InputProfile 同时声明 poseTransition/handTrackingY/handTrackingX；不在进入大厅前展示三组操作说明、进度点或玩法介绍。

### LV-01/LV-02 玩法内小教练

- Purpose：只在当前玩法内教授当前控制。
- Content：L1 用拳/掌图形 + “握拳 → 张手”；L2 用上下箭头；L3 用左右箭头。标题与辅助句不重复同一动作。
- Camera：缩略视频 + 骨架；readout 是 coach 的静态子区，位于视频之后。
- States：tutorial/need_fist/armed/tracking/success/no-hand/keyboard。
- Acceptance：一个时刻一个目标；L2 label Unknown 时只保留角色跟手视觉，不提示“动作不清楚”；常显文字不超过一个动作短句。

## 9. Component And State Matrix

| Component | Default | Loading | Empty | Error | Success |
|---|---|---|---|---|---|
| Setup choice | camera/keyboard | N/A | N/A | permission help | selected |
| Camera surface | preview | model loading | finding hand | retry/keyboard | landmarks visible |
| Input ready CTA | hidden | hidden | hidden | keyboard exit | “开始游戏” |
| Game coach | current control | model ready | no hand | camera/model | seen/armed/tracking |

## 10. Sample Data

- Ready：`cameraStatus=active,modelStatus=ready,handPresence=present,inputReady=true`。
- Unknown with hand：`label=None,handPresent=true,palmCenterX=0.58,palmCenterY=0.42`。
- Error：`NotAllowedError` → “摄像头没有打开，可以重试或用按键继续”。
- InputProfile：`{mode:'camera_full',capabilities:{poseTransition:true,handTrackingY:true,handTrackingX:true}}`。

## 11. Data And Events

- `PoseTransitionEvent{stablePose,previousStablePose,source,confidence,timestamp}`。
- `HandTrackingFrame{handPresent,palmCenterX,palmCenterY,confidence,timestamp}`。
- `InputProfile{mode,capabilities:{poseTransition,handTrackingY,handTrackingX}}`。
- 全局 ready 只依赖 handPresent 连续帧；离散游戏 gate 只存在于 L1 runtime。
- 进入/重玩玩法时清空 `lastStablePose` 与 gate，防止跨玩法首个握拳被去重。

## 12. Responsive Rules

- 视口：1440×900、1280×720、1219×681、1024×700、919×843。
- 所有 screen `100dvh;overflow:hidden;min-height:0`。
- GI-02/GI-03 默认左右两列；低高度减少视频高度与说明，不改成纵向滚动。
- game coach 宽 `clamp(190px,18vw,270px)`；readout 静态置于 video/canvas 之后，不使用视频内 absolute overlay。
- 文案允许两行但不覆盖按钮；所有主按钮 ≥44px。
- 低高度不是把多个说明压小，而是直接隐藏次级文案；儿童主标题、当前动作和主 CTA 不被隐藏。

## 13. Accessibility And Interaction

- 所有按钮有 label/focus；视频提供“镜像摄像头预览”说明。
- 摄像头状态使用 aria-live polite，不逐帧朗读手势。
- reduced motion 不影响关键点、ready、控制状态与世界因果。
- 错误始终提供重试和键盘出口。
- 精简仅作用于视觉文本；按钮、视频、状态和图标仍保留完整可访问名称。

## 14. Visual / Content / Interaction Thesis

- Visual：大视频、极少文字、绿色 ready、儿童可读图标；从 GI-01 起不使用介绍段、三步清单和重复状态卡占据首屏。
- Content：说“我看到小手”，不说“模型置信度低/未知”。
- Interaction：准备页只确认可用；玩法页才把手映射为动作。

## 15. Annotation Points

| Screen | Point | Why |
|---|---|---|
| GI-03 | “开始游戏”直达大厅 | 修复多余结果层 |
| GI-03 | 无动作教程 | 修复层级职责 |
| LV-02 coach | readout 在视频外 | 防止遮脸 |
| L2 | Unknown 仍有位置流 | 防止跟手假死 |

## 16. Assumptions

- 摄像头成功后至少能输出一只手 21 点关键点；关键点只在内存中使用。
- 玩法教学状态可本地保存，但不影响三个玩法默认可选。

## 17. Open Questions

- 无阻塞问题。

## 18. Acceptance Criteria For HTML Prototype

- [ ] GI-03 无拳掌教程/倒计时/练习次数/动作结果，主 CTA 为“开始游戏”并直达 LV-00。
- [ ] GI-04 旧结果页不在可达主链路。
- [ ] camera_full/keyboard_full 精确提供三项 capability。
- [ ] 三玩法各自教学，不在大厅上方展示跨玩法步骤。
- [ ] L1 未握拳张掌不触发、持掌不连发、切玩法重置姿态去重。
- [ ] L2/L3 在 label=None/Unknown 且关键点有效时分别持续更新 Y/X；键盘方向键支持按住。
- [ ] L2 None/Unknown + landmarks 继续输出位置。
- [ ] 视频/canvas/readout 零相交，5 视口单屏无重叠。
- [ ] GI-01 常显区没有介绍段和模式长说明；GI-02 不常显三步技术清单；GI-03/GI-05/GI-06 每屏只保留一个准备结论和一个主 CTA。
- [ ] 儿童可见层同一视区最多 1 个短标题、1 个短提示、1 个主 CTA；详细隐私/错误说明仍可在家长层、折叠区或错误态访问。
- [ ] 精简可见文字后，所有 icon-only 操作和动态状态仍有 `aria-label`、`aria-live` 或 `sr-only` 名称。

## 19. QA Strategy For HTML Prototype

- QA Mode：本轮文字精简采用 `QA-LIGHT`；既有输入/视口 QA-TARGETED 套件保留但不重复执行。
- 变更点检查：GI-01→GI-06 常显文字预算、动态文案回写、详细信息的家长层/无障碍保留。
- Browser checks：N/A by QA-LIGHT policy。
- 人工 UX：从初始界面走摄像头与按键两条路径，确认孩子只需识别图形、一个短提示和一个主按钮。

## 20. PM Review Slice

- 本阶段关键决策：全局动作训练改为输入就绪；GI-03 主 CTA“开始游戏”直达玩法大厅；三种控制教学下沉到玩法；从初始界面起儿童层采用“图形优先、一个短提示、一个主 CTA”，完整隐私/错误信息留在家长层与无障碍语义中；双通道合同与本机隐私不变。
- Target Surface：`web-only`。
- 被放弃的方案：全局拳掌练习/结果页、识别倒计时、第三必需手型、视频内文字覆盖。
- 需要 PM 确认的问题：无；用户已明确要求 CTA 与教学层级调整。
- 不需要 PM 审查的执行细节：连续帧数、推理间隔、测试注入 API。
- 进入下一阶段的条件：04B 实现并通过 QA-TARGETED。

## 21. Spec Self-Check

- Screen coverage：PASS。
- State coverage：PASS。
- Target surface coverage：PASS。
- Page archetype coverage：PASS。
- Reference alignment：PASS。
- Product canvas rules：PASS。
- Responsive coverage：PASS。
- Handoff readiness：PASS。
- PM review gate readiness：PASS。
