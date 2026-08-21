# 原型规格：输入就绪与玩法内控制
> 更新日期：2026-08-17 | 来源：`03-feature-手势输入闭环.md` + `03-feature-核心关卡循环.md` | Target Surface：web-only

## 1. Product Frame

- 目标用户：5 岁儿童；家长负责隐私确认、摄像头授权和按键降级。
- 主要场景：笔记本浏览器近景单手输入。
- 原型目的：验证“输入就绪”与“玩法教学”职责分离，保证双通道输入真实进入三个运行时。
- Target Surface：`web-only`，沿用 Phase 1 已确认范围。
- 关键约束：视频本机处理；单屏无滚动；游戏 readout 不覆盖视频；无全局动作成绩页；儿童可见层从初始界面起采用“图形优先、文字最少”规则。

## 2. Goals And Non-Goals

### Goals

- 摄像头连续 3 帧有可靠关键点即可 ready，不要求拳掌动作。
- 摄像头与键盘都在各自单一准备页完成就绪并进入同一人物选择页：GI-02“继续”→CH-01，GI-05“开始游戏”→CH-01；CH-01 确认角色后进入 LV-00，两条路径都不保留第二张输入确认页。
- 摄像头与键盘都输出具名双 capability。
- 三种玩法在自己的安全场景中教学；L1 走姿态边沿，L2 走连续掌心 X/Y，L3 走连续掌心 X。

### Non-Goals

- 不保留“去看看结果/看看结果”、拳掌练习轮次或全局动作结果页。
- 不新增第三种必需手型、全身追踪或移动端。

## 3. Page Archetype And Reference Alignment

### Page Archetype

- 页面类型：家长设置任务流 + 单页儿童输入就绪确认 + 单屏人物选择 + 玩法内小教练。
- 核心任务：确认系统看见手 → 选择人物 → 开始游戏；进入玩法后只学当前控制。
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

- 家长层：GI-01 隐私/模式；GI-02 摄像头授权、模型准备与摄像头 ready；家长抽屉。
- 儿童就绪：GI-02 摄像头 ready；GI-05 键盘测试与 ready。
- 儿童选择：CH-01 五角色选择。
- 儿童玩法：LV-01 控制摘要；LV-02 安全教学与正式输入。
- 主路径：`GI-01 → GI-02 → CH-01 → LV-00`；降级：`GI-01/GI-02 → GI-05 → CH-01 → LV-00`。

## 5. Core Flows

| Flow | Entry | Steps | Success | Edge |
|---|---|---|---|---|
| 摄像头就绪 | GI-01 | 隐私→授权→3帧见手 | GI-02“继续”→CH-01 | 拒绝/模型失败→键盘 |
| 键盘就绪 | GI-05 | 任意按一次 Space/方向键，当前键灯即时点亮 | GI-05“开始游戏”→CH-01 | 无需逐键完成或进入第二页 |
| 人物选择 | CH-01 | 点选五名人物之一→选中反馈→“选好啦” | 提交 selectedCharacterId→LV-00 | 返回对应输入就绪页 |
| L1 教学 | LV-02 tutorial | fist→palm→世界动作 | 一次高跳 | 持掌不连发 |
| L2 教学 | LV-02 tutorial | 掌心上下左右→角色四向跟手 | 横向、纵向各移动一次 | Unknown 仍跟手 |
| L3 教学 | LV-02 tutorial | 掌心左右→角色对准平台 | 左右各一次 | Unknown 不阻断 |
| 无手恢复 | LV-02 | grace→冻结→手回来→3/2/1 | 本轮继续 | 不扣勇气 |

## 6. Screen Inventory

| ID | Screen | Purpose | Entry | Exit |
|---|---|---|---|---|
| GI-01 | 家长输入设置 | 隐私与模式 | 起始 | GI-02/GI-05 |
| GI-02 | 摄像头准备与就绪 | 授权、模型、找手；ready 后继续选人物 | GI-01 | CH-01/GI-05 |
| GI-05 | 按键准备与就绪 | 同页测试按键、点亮反馈并选择人物 | 降级入口 | CH-01/GI-01 |
| CH-01 | 人物选择 | 五选一并确认本次会话角色 | GI-02/GI-05 | LV-00/来源输入页 |
| LV-01/LV-02 | 玩法内控制 | 当前玩法摘要与安全教学 | LV-00 | 正式计分 |

## 7. Coverage Plan

- Backbone：与核心规格同一 `04B-prototype-手势小狗探险MVP.html`。
- GI-03 旧“摄像头已就绪”和 GI-04 旧“动作结果”都不再是 backbone，也不应存在 DOM screen 或可达入口。
- GI-02 的“继续”与 GI-05 的“开始游戏”都真实进入 CH-01；CH-01“选好啦”进入 LV-00；GI-06 不应存在 DOM screen 或可达入口。
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
- Primary：未 ready 时“开启摄像头/重试”，ready 时“继续”；Secondary：改用按键。
- States：requesting/loading/finding-hand/ready/error。
- Data：cameraStatus、modelStatus、handPresence、landmarks。
- Navigation：连续 3 帧见手后保持在 GI-02 ready 状态；点击“继续”立即派发 camera InputProfile 并进入 CH-01；错误/主动降级 → GI-05。不得进入 GI-03/GI-04。
- Acceptance：关键点与视频对齐；提示不覆盖视频主体；同一时刻只显示一个取景提示，模型/摄像头/手部三项详细状态只供家长按需查看；ready 结论、角色反馈与“继续”都在本页完成，不再复制到第二张准备页。
- Visual asset：摄像头尚未开启/正在找手时使用独立生成的 `find-hand.png`，不得回退到大尺寸通用内联手掌 SVG。

### GI-05 按键就绪

- Purpose：说明等价能力并进入人物选择。
- Layout：复用 GI-02 的手绘木框暖纸底板与左右栏比例；左侧深河蓝测试舞台显示四向键簇与 Space，右侧只保留“按一下试试”、开始和返回。
- Content：每个键为暖纸/木边按键灯；默认安静，按下时以河蓝/太阳黄高亮、柔和外发光和下压反馈点亮，松开后回到已验证状态。禁止使用旧白底板、单个灰色键帽或第二张 ready 卡。
- Primary：任意有效键被测试后，同页显示 ready 并启用“开始游戏”→CH-01。
- Secondary：返回摄像头。
- States：default/key-active/ready/focus；不要求逐键完成，不自动跳转第二页。
- Acceptance：InputProfile 同时声明 poseTransition/handTrackingY/handTrackingX；Space 与四个方向键都能点亮，任意一个即可 ready；GI-06 不存在；不在进入大厅前展示玩法介绍或多步进度。

### CH-01 人物选择

- Purpose：让儿童在进入玩法大厅前选择本次会话的初始人物。
- Layout：暖纸探险底板；顶部短标题“选一个伙伴”；中部五张同权重人物卡单行排布，低宽或低高视口同步缩放但不滚动；底部唯一主按钮“选好啦”，左上保留低权重返回。
- Content：人物卡仅显示完整 `idle-1.png` 与名字：布鲁伊、宾果、麦麦、班底特、悠悠；不显示属性、能力、稀有度、锁态或长描述。
- Interaction：默认聚焦布鲁伊；点击/键盘方向移动选择时更新 `pendingCharacterId`、选中描边、轻抬和 `aria-checked`；点击“选好啦”提交 `selectedCharacterId` 并进入 LV-00。
- States：default/selected/focus/image-fallback；五张卡始终可选。
- Acceptance：五张卡均可点击和键盘操作；同一时刻仅一张 `aria-checked=true`；确认后大厅与三玩法使用所选人物；返回保持候选与 InputProfile；五个支持视口单屏无横向/纵向滚动。

### LV-01/LV-02 玩法内小教练

- Purpose：只在当前玩法内教授当前控制。
- Content：L1 用拳/掌图形 + “握拳 → 张手”；L2 用四向箭头；L3 用左右箭头。标题与辅助句不重复同一动作。
- Camera：缩略视频 + 骨架；readout 是 coach 的静态子区，位于视频之后。
- States：tutorial/need_fist/armed/tracking/success/no-hand/keyboard。
- Acceptance：一个时刻一个目标；L2 label Unknown 时只保留角色跟手视觉，不提示“动作不清楚”；常显文字不超过一个动作短句。

## 9. Component And State Matrix

| Component | Default | Loading | Empty | Error | Success |
|---|---|---|---|---|---|
| Setup choice | camera/keyboard | N/A | N/A | permission help | selected |
| Camera surface | preview | model loading | finding hand | retry/keyboard | landmarks visible |
| Input ready CTA | hidden | hidden | hidden | keyboard exit | 摄像头“继续” / 键盘 GI-05“开始游戏” |
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
- GI-02 默认左右两列；低高度减少视频高度与说明，不改成纵向滚动。
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
| GI-02 | ready 后“继续”进入 CH-01 | 删除重复输入确认页并衔接人物选择 |
| CH-01 | 五角色单选 + 唯一确认按钮 | 低龄儿童可感知且不比较复杂属性 |
| GI-02 | 无动作教程 | 保持输入就绪与玩法教学分层 |
| LV-02 coach | readout 在视频外 | 防止遮脸 |
| L2 | Unknown 仍有位置流 | 防止跟手假死 |

## 16. Assumptions

- 摄像头成功后至少能输出一只手 21 点关键点；关键点只在内存中使用。
- 玩法教学状态可本地保存，但不影响三个玩法默认可选。

## 17. Open Questions

- 无阻塞问题。

## 18. Acceptance Criteria For HTML Prototype

- [ ] GI-02 连续 3 帧见手后显示“继续”；点击后只派发一次 camera InputProfile 并进入 CH-01。
- [ ] GI-05 任意有效键点亮后进入同一 CH-01；CH-01 恰好显示布鲁伊、宾果、麦麦、班底特、悠悠五张可选卡，确认后进入 LV-00。
- [ ] CH-01 单选状态、键盘焦点与 `aria-checked` 一致，五个支持视口单屏无滚动；LV-00 与三玩法渲染所选角色。
- [ ] GI-03 旧 ready 页与 GI-04 旧结果页均不作为 DOM screen 存在，也不在任何可达主链路、错误回退或家长抽屉恢复路径中出现。
- [ ] camera_full/keyboard_full 精确提供三项 capability。
- [ ] 三玩法各自教学，不在大厅上方展示跨玩法步骤。
- [ ] L1 未握拳张掌不触发、持掌不连发、切玩法重置姿态去重。
- [ ] L2 在 label=None/Unknown 且关键点有效时持续更新 X/Y，键盘四方向支持按住；L3 持续更新 X。
- [ ] 视频/canvas/readout 零相交，5 视口单屏无重叠。
- [ ] GI-01 常显区没有介绍段和模式长说明；GI-02 不常显三步技术清单，ready 时只保留一个准备结论和一个主 CTA；GI-05 单页只保留测试舞台、一个准备结论和一个主 CTA。
- [ ] GI-02 未开启/找手占位从 `find-hand.png` 加载，不实例化大尺寸通用手掌 SVG；GI-05 与 GI-02 使用同一手绘底板家族，五枚按键灯有按下/已验证反馈。
- [ ] 儿童可见层同一视区最多 1 个短标题、1 个短提示、1 个主 CTA；详细隐私/错误说明仍可在家长层、折叠区或错误态访问。
- [ ] 精简可见文字后，所有 icon-only 操作和动态状态仍有 `aria-label`、`aria-live` 或 `sr-only` 名称。

## 19. QA Strategy For HTML Prototype

- QA Mode：`QA-TARGETED`；触发原因是 screen inventory 与摄像头主路径发生变化，需要浏览器验证没有残留可达页或错误恢复跳转。
- 变更点检查：GI-02/GI-05 单次派发 InputProfile 并进入 CH-01；GI-03/GI-04/GI-06 不存在；CH-01 五选一确认后进入 LV-00，角色跨三玩法保持。
- Browser checks：定向检查 1440×900、1219×681、919×843；不进行无关全量验收。
- 人工 UX：从初始界面走摄像头与按键两条路径，确认摄像头不再多点一次，孩子只需识别图形、一个短提示和一个主按钮。

## 20. PM Review Slice

- 本阶段关键决策：全局动作训练改为输入就绪；摄像头授权、见手与 ready 收敛在 GI-02，不保留重复 GI-03；双输入就绪后统一进入 CH-01 五角色选择，确认人物后再进入玩法大厅；三种控制教学下沉到玩法；儿童层继续采用“图形优先、一个短提示、一个主 CTA”，双通道合同与本机隐私不变。
- Target Surface：`web-only`。
- 被放弃的方案：摄像头成功后的第二张 ready 页、全局拳掌练习/结果页、识别倒计时、第三必需手型、视频内文字覆盖。
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
