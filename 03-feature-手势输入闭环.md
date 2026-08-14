# 功能规格：输入就绪与玩法内控制
> 关联架构模块：儿童输入就绪 / 手部观测与稳定化 / 双通道输入适配 / 儿童教练 / 摄像头与隐私 | 更新日期：2026-08-14

## 功能目标

**解决的问题**：先让家长和儿童确认“系统已经看见手、可以开始游戏”，再让每个玩法在自己的安全场景中教学对应控制；同时保证离散拳掌和连续掌心位置互不门控。

**目标用户**：主要用户是 5 岁儿童；家长负责摄像头授权、降级与暂停；玩法只消费 `PoseTransitionEvent` 或包含掌心 X/Y 的 `HandTrackingFrame`，不直接读取视频或模型标签。

**成功标准**：

- 全局输入页不再训练拳→掌→拳，也不展示三种玩法的操作步骤；看见任意可靠手部关键点即可进入 ready。
- ready 状态主 CTA 精确为“开始游戏”，点击直接进入三玩法大厅；不存在“去看看结果”。
- 三种控制关系分别在玩法内安全教学：溪边跳跳练拳→掌；萤火虫躲躲练掌心上下；树梢蹦蹦练掌心左右，角色自动弹跳。
- `Open_Palm` 只有在当前玩法已经稳定识别 `Closed_Fist` 后才派发离散执行；保持张掌不会重复触发。
- 输入适配器输出两个互不门控的通道：溪边跳跳消费 `PoseTransitionEvent`，萤火虫躲躲/树梢蹦蹦分别消费 `HandTrackingFrame` 的 Y/X。
- 手部关键点有效但分类为 `None/Unknown` 时，不派发离散姿态事件，但 `HandTrackingFrame.handPresent=true` 且掌心 X/Y 有效。
- `camera_full` 与 `keyboard_full` 都声明 `capabilities.poseTransition=true`、`capabilities.handTrackingY=true`、`capabilities.handTrackingX=true`。
- 摄像头不可用时可完整切换到键盘；视频与关键点不上传、不录制、不持久化。

---

## 页面形态决策

- 页面类型：低密度单任务输入就绪页 + 玩法内小教练 + 家长辅助抽屉。
- 全局核心任务：手入镜或确认键盘可用 → 看到“准备好啦” → 开始游戏。
- 玩法内核心任务：只学习当前玩法唯一控制 → 在安全世界中成功一次 → 进入正式计分。
- 默认布局：输入就绪页左侧大镜像摄像头与 21 点骨架，右侧只展示“找到手/准备好”；游戏中使用右上浮动小摄像头，识别文案放在视频外。
- 为什么不保留全局动作训练：三个玩法控制不同，提前练拳掌会错误暗示所有玩法都用同一控制，也让“准备页”和“玩法页”职责重叠。
- Target Surface：`web-only`；每个 screen 单视口完整呈现，无页面滚动。
- 用户确认状态：`confirmed`；用户明确要求操作指引做在玩法层，而不是玩法层之上。

---

## 用户流程

### 全局输入就绪

1. 家长确认隐私并开启摄像头 → 本机加载 MediaPipe 与手势模型。
2. 系统实时显示镜像视频与关键点；不启动 3、2、1 识别窗口。
3. 检测到可靠手部关键点连续 3 帧 → 状态变为 ready，显示“看见小手啦，可以开始”。
4. 主操作“开始游戏”常驻可用 → 输出 `camera_full` → 直接进入玩法大厅。
5. 若家长选择键盘 → 显示 Space、↑/↓ 与 ←/→ 已可用 → 输出 `keyboard_full` → 主操作仍为“开始游戏”。
6. 输入就绪页不显示角色跳跃结果、练习轮次、动作成绩或“看看结果”。

### 玩法内安全教学

1. 选择溪边跳跳 → 4 秒无坑安全段；提示“先握拳，再张开手跳起来”，成功跳 1 次即完成教学。
2. 选择萤火虫躲躲 → 5 秒无障碍安全段；提示“小手往上，小狗往上；往下也一样”，上/下各移动一次即完成教学。
3. 选择树梢蹦蹦 → 5 秒安全段；角色自动弹跳，提示“小手往左，小狗往左；往右也一样”，左右各移动一次即完成教学。
4. 已完成过本玩法教学 → 下次入场仍显示一句控制摘要，可自动缩短到 2 秒并提供“再看一次”。
5. 教学成功后进入 3、2、1；倒计时只表示正式计分世界即将开始，不参与识别。

### 正式玩法双通道

1. 溪边跳跳 running → 订阅 `PoseTransitionEvent`；`Closed_Fist` 上膛，之后 `Open_Palm` 触发高跳，再进入 700ms 冻结。
2. 萤火虫躲躲 running → 每个处理帧订阅 `HandTrackingFrame`，按 `palmCenterY` 更新目标高度；树梢蹦蹦按 `palmCenterX` 更新横向位置，弹跳由运行时自动推进；两者都不等待拳掌姿态或读取分类标签。
3. 摄像头标签为 `None/Unknown` 但关键点有效 → 两种连续跟手玩法继续移动；溪边跳跳只是不产生新的姿态边沿。
4. 键盘 Space → 为溪边跳跳生成一次规范拳→掌机会；↑/↓ 按住 → 连续改变虚拟掌心 Y；←/→ 按住 → 连续改变虚拟掌心 X。

### 异常流程

| 异常 | 系统处理 | 提示 |
|---|---|---|
| 全局页未见手 | 不进入 ready，不绘制假骨架 | “把一只小手放进画面” |
| 手太远或靠边 | 保持未就绪，只给位置建议 | “靠近一点 / 小手露全一点” |
| 离散玩法未握拳直接张掌 | 不派发动作 | “先做小拳头” |
| label=None/Unknown 且关键点有效 | 不派发离散事件；继续派发 handPresent=true 位置帧 | 跟手玩法：“小狗正跟着小手” |
| 时间戳倒退或重复 | 丢弃该帧 | 不打扰儿童 |
| 摄像头/模型不可用 | 停止轨道并进入键盘就绪 | “可以用按键继续” |
| 玩法中持续无手 | 安全暂停危险推进，不扣勇气 | “小路停下啦，正在找小手” |
| 页面失焦/家长暂停 | 暂停计时与输入；回来后才使用恢复倒计时 | “回来后再出发” |

---

## 界面状态清单

| 状态 | 主要内容 | 操作 | 退出条件 |
|---|---|---|---|
| 摄像头未开启 | 隐私说明、开启按钮、按键出口 | 开摄像头 / 切按键 | 授权或降级 |
| 模型加载中 | 本机加载状态、镜像预览 | 等待 / 切按键 | ready/error |
| 正在找手 | 大镜像、手轮廓、取景建议 | 自然抬手 | hand present |
| 摄像头已就绪 | 骨架、绿色 ready、主 CTA“开始游戏” | 开始游戏 / 切按键 | 进入玩法大厅 |
| 键盘已就绪 | Space、↑/↓、←/→ 摘要，主 CTA“开始游戏” | 开始游戏 / 切摄像头 | 进入玩法大厅 |
| 玩法教学-等待拳 | 当前玩法世界、拳头图标、无危险 | 握拳 | armed |
| 玩法教学-等待掌 | 溪边安全世界、张掌图标 | 张掌 | 跳跃 |
| 玩法教学-跟手 | 无障碍世界、上/下目标点 | 上下移动手 | 两方向均完成 |
| 玩法教学-左右 | 宽平台安全世界、左/右目标点、角色自动跳 | 左右移动手 | 两方向均完成 |
| 玩法教学-完成 | 世界内成功反馈、即将开始 | 等待 / 再看一次 | 正式倒计时 |
| 无手安全等待 | 世界冻结、摄像头缩略图高亮 | 手回来 / 切键盘 | 恢复倒计时 |
| 摄像头错误 | 原因与恢复动作 | 切按键 / 返回 | 完成恢复 |

---

## 业务规则

### 全局输入就绪

- IF 手部关键点连续 3 个处理帧有效 THEN `inputReady=true`；不要求分类为拳或掌。
- IF `inputReady=true` THEN 主 CTA 文案必须是“开始游戏”，不得出现“看看结果/去看看结果/完成练习”。
- IF 用户点击“开始游戏” THEN 输出 InputProfile 并直接进入玩法大厅；不得插入全局动作结果页。
- IF 手暂时离开但 InputProfile 已创建 THEN 不撤销大厅访问；真正进入玩法后由 Safety 处理无手暂停。
- IF 输入模式为键盘 THEN 不要求按键热身次数；只需浏览器支持 Space、ArrowUp、ArrowDown。

### 识别与离散控制门

- IF 连续 3 帧稳定为 `Closed_Fist` THEN 当前稳定姿态为小拳头。
- IF 连续 3 帧稳定为 `Open_Palm` THEN 当前稳定姿态为张开手掌。
- IF 中间出现相反姿态或 `None` THEN 重新累计；交替噪声不得凑成稳定姿态。
- IF gate=`need_fist` 且稳定 `Closed_Fist` THEN gate=`armed`。
- IF gate=`armed` 且稳定 `Open_Palm` THEN 派发姿态转换并进入 700ms `freeze`；结果由当前玩法解释。
- IF gate=`need_fist` 且稳定 `Open_Palm` THEN 不派发动作，只提示先握拳。
- IF gate=`freeze` THEN 忽略离散动作；冻结结束进入 `need_fist`。
- IF 持续保持 `Open_Palm` THEN 不得连续派发第二次动作。
- IF 切换玩法、重玩或进入新教学 THEN 清空 `lastStablePose` 与 gate，避免上一玩法的拳头去重阻断新玩法首个动作。

### `PoseTransitionEvent`

- 稳定姿态首次变化为 `Closed_Fist` 或 `Open_Palm` 时各派发一个事件；字段为 `stablePose`、`previousStablePose`、`source`、`confidence`、`timestamp`。
- 分类为 `None/Unknown` 时不派发离散事件；不得据此把关键点有效的手判为缺失。
- 当前玩法为溪边跳跳时，只把事件路由给当前运行时；适配器不得预先翻译为 JUMP。
- 当前玩法为萤火虫躲躲或树梢蹦蹦时，不把姿态事件路由为游戏动作。
- `keyboard_full` 收到一次非 repeat Space 时生成一次规范的 Closed_Fist→Open_Palm 机会，并遵守同一 700ms 锁。

### `HandTrackingFrame`

- 每个视频处理帧必须派发一个 `{handPresent,palmCenterX,palmCenterY,confidence,timestamp}`。
- 关键点有效 → `handPresent=true`，`palmCenterX/palmCenterY` 为有限 0–1 数值，与分类标签无关。
- `confidence` 表示手部存在/追踪置信度，不复用类别置信度。
- 关键点无效 → `handPresent=false,palmCenterX=null,palmCenterY=null`，不得沿用旧坐标冒充新观测。
- 萤火虫躲躲/树梢蹦蹦逐帧消费递增时间戳；EMA、死区、限速、短丢手保持由各自运行时/Safety 负责。
- 键盘跟手从 `palmCenterX=0.5,palmCenterY=0.5` 开始；↑/↓ 改变 Y，←/→ 改变 X，输出同一字段合同。

### InputProfile

- 摄像头 ready → `{mode:'camera_full',capabilities:{poseTransition:true,handTrackingY:true,handTrackingX:true}}`。
- 键盘 ready → `{mode:'keyboard_full',capabilities:{poseTransition:true,handTrackingY:true,handTrackingX:true}}`。
- InputProfile 缺少当前玩法 capability 时不得进入危险推进；提示家长切换输入或重试。
- 三项 capability 均可用时，运行时仍只能订阅自身需要的通道。

### 反馈与隐私

- 未检测到关键点 → “正在找小手”，不绘制假骨架。
- 稳定识别姿态 → 可在玩法教练显示“小拳头/张开手”，不显示置信度或英文类别。
- 关键点有效但姿态未知 → 显示“我看到小手”，不得显示“未知/失败”。
- 进入按键模式、退出或卸载页面 → 停止全部摄像头轨道并清空识别状态。
- 视频帧只允许本机内存处理，不上传、不录制、不保存关键点序列。

---

## 数据字段

| 字段 | 类型 | 约束 |
|---|---|---|
| `cameraStatus` | 系统状态 | idle/requesting/active/error/stopped |
| `modelStatus` | 系统状态 | idle/loading/ready/error |
| `handPresence` | 系统计算 | present/missing |
| `inputReady` | 系统状态 | boolean；不依赖姿态分类 |
| `stablePose` | 系统计算 | Closed_Fist/Open_Palm/null |
| `controlGate` | 系统状态 | need_fist/armed/freeze |
| `freezeUntilMs` | 计时 | 单调时钟；默认 700ms |
| `poseTransitionEvent` | 输入事件 | stablePose/previousStablePose/source/confidence/timestamp |
| `handTrackingFrame` | 输入帧 | handPresent/palmCenterX/palmCenterY/confidence/timestamp |
| `inputMode` | 系统结论 | camera_full/keyboard_full |
| `inputCapabilities` | 系统结论 | `{poseTransition:true,handTrackingY:true,handTrackingX:true}` |
| `tutorialSeenByMode` | 本地状态 | 3 个玩法各自 boolean |
| `tutorialProgress` | 玩法状态 | L1 动作次数；L2 upSeen/downSeen；L3 leftSeen/rightSeen |
| `virtualPalmCenterY` | 键盘状态 | 0–1；默认 0.5 |
| `virtualPalmCenterX` | 键盘状态 | 0–1；默认 0.5 |
| `videoRecorded` | 隐私不变量 | false |
| `videoUploaded` | 隐私不变量 | false |

---

## 运营配置项

| 配置项 | 默认值 | 范围 |
|---|---:|---:|
| 推理间隔 | 80ms | 65–125ms |
| 输入就绪确认 | 连续 3 帧手存在 | 2–4 帧 |
| 张掌/握拳稳定 | 连续 3 帧 | 3–4 帧 |
| 离散输入冻结 | 700ms | 500–1000ms |
| L1 无手暂停 | 1500ms | 800–3000ms |
| L2/L3 无手暂停 | 600ms | 400–900ms |
| L1 安全教学 | 4s/成功 1 次 | 3–8s |
| L2 安全教学 | 5s/上下各 1 次 | 4–8s |
| L3 安全教学 | 5s/左右各 1 次 | 4–8s |

---

## 边界与排除

- 不在全局输入就绪页训练拳掌、上下/左右跟手，不显示练习轮次或动作成绩。
- 不使用“去看看结果/看看结果”作为输入就绪 CTA。
- 不使用握拳作为下蹲；握拳只负责离散玩法的准备/复位。
- 不要求点赞、V 手势或三套新手型。
- 不在识别中使用倒计时、4 秒观察窗口、强制连续成功或失败次数。
- 不让输入适配器按目标情境输出统一动作；具体语义归当前运行时。
- 不做全身追踪、多人识别、自定义手势训练。
- 不把置信度、失败率或技术错误表达为儿童能力。

---

## 验收标准

- 全局输入 screen 中不存在拳→掌→拳三步练习、识别倒计时、练习次数和结果页；连续 3 帧有关键点即可 ready。
- ready 后主 CTA 精确为“开始游戏”，点击直接显示三玩法大厅。
- 玩法大厅没有跨玩法操作教程；三个玩法各自入场/安全教学只显示自己的控制。
- 溪边跳跳未握拳时张掌不触发；握拳后张掌触发；持续张掌不连发；重玩/切玩法会重置姿态去重。
- 萤火虫躲躲/树梢蹦蹦在 `label=None/Unknown + valid landmarks` 时仍满足 `handPresent=true`，并分别持续更新 `palmCenterY/palmCenterX`。
- `camera_full` 与 `keyboard_full` 均提供精确 capability map `{poseTransition:true,handTrackingY:true,handTrackingX:true}`。
- 键盘 Space 只产生一次离散动作机会并遵守 700ms 锁；↑/↓ 与 ←/→ 分别支持按住连续改变虚拟掌心 Y/X。
- 摄像头画面、关键点和儿童可读识别状态同步可见；游戏 readout 位于视频外且零覆盖。
- 1440×900、1280×720、1219×681、1024×700、919×843 下输入就绪、三种教学和无手暂停均单屏无滚动、裁切、文字重叠或按钮越界。

---

## PM Review Slice

- 本阶段关键决策：
  - 全局 Gesture Lab 收敛为“输入就绪”：只确认看见手或键盘可用，主 CTA 为“开始游戏”。
  - 三种控制教学下沉到对应玩法的安全世界；大厅之上不再展示拳掌三步训练。
  - 双通道合同扩展：L1 消费 `PoseTransitionEvent`，L2/L3 分别消费逐帧 `HandTrackingFrame` 的 Y/X；`None/Unknown` 不阻断位置流。
  - 摄像头与键盘都提供三项 capability，所有视频只在本机处理。
- 被放弃的方案：全局动作训练、全局动作结果页、识别倒计时、按目标预翻译统一动作、第三种必需手型。
- 需要 PM 确认的问题：无；用户已明确要求操作指引下沉到玩法层，并指出 CTA 应为“开始游戏”。
- 不需要 PM 审查的执行细节：连续帧数、推理间隔、700ms 初始冻结和虚拟掌心步长。
- 进入下一阶段的条件：04A/04B 实现输入就绪直达大厅、三套玩法内教学、两个事件合同与五视口 QA。
