# 原型规格：三玩法无尽距离与高度里程碑
> 更新日期：2026-08-14 | 来源：`03-feature-核心关卡循环.md` | Target Surface：web-only

## 1. Product Frame

- 目标用户：5 岁儿童；家长负责授权、暂停、输入接管和退出。
- 主要场景：带摄像头的笔记本浏览器，坐姿或站姿近景单手游玩。
- 原型目的：验证三个默认开放玩法是否各自易懂、可无限重玩，并重点验证由真实距离/高度驱动的速度与障碍递进是否能被 5 岁儿童感知。
- Target Surface：`web-only`，沿用 Phase 1 已确认范围。
- 关键约束：单屏无页面滚动；本机识别；无账号/昵称/联网榜；私人本地版使用用户参考图分别生成蓝色主角与橙色伙伴的动作素材，公开发布前必须授权或切回原创角色；摄像头文案不覆盖视频。

## 2. Goals And Non-Goals

### Goals

- 从输入就绪页的“开始游戏”自然进入三玩法大厅。
- 三张玩法卡同权重、默认可点，并显示各自控制图形和本机个人最好。
- 每种玩法有自己的入场说明和 3–5 秒安全教学；大厅上方不展示拳掌三步指引。
- 三种运行时均不设时长终点；L1/L2 以行进米数、L3 以爬升米数驱动渐进速度、障碍组合、里程碑反馈、3 颗勇气心和单局成绩。
- 每次升级必须通过同地图画风的生成图片牌、整数米数、短文案和障碍视觉变化共同表达，不使用简单色块或通用徽章占位。
- L1 使用共享 `worldSpeed` 与空间碰撞；张掌跳跃足够高，落坑反馈完整。

### Non-Goals

- 不做顺序锁关、固定关长、跨玩法总排名、账号、昵称、全球榜、好友榜或跨设备同步。
- 不做经典 Flappy 式一次碰撞即死、窄缝与高频重开。
- 不做移动端；不复制官方场景、音乐、标识、剧情或关卡内容；本轮角色参考素材仅用于家庭设备内私人试玩，不获得或暗示公开发行授权。

## 3. Users And Scenarios

| User | Need | Context | Success Signal |
|---|---|---|---|
| 儿童 | 自己选择想玩的玩法 | 输入已就绪 | 任意卡可直接进入 |
| 儿童 | 快速理解当前玩法 | 首次进入/重玩 | 在安全教学中完成一次控制 |
| 儿童 | 知道碰撞后发生了什么 | 落坑/撞边/落空 | 看见救援、心减少并继续 |
| 儿童 | 愿意再玩 | 第 3 次失误后 | 看懂本次分数与最好，选择再玩 |
| 家长 | 可接管与清理 | 摄像头阻塞/结束 | 键盘接管、结束本局、清空本机成绩 |

## 4. Page Archetype And Reference Alignment

### Page Archetype

- 页面类型：低密度玩法选择大厅 + 玩法内任务流 + 全屏横版舞台 + 单局成绩卡。
- 为什么不是关卡地图：三个入口不是内容先后关系；锁态会阻断玩法验证，并错误表达产品结构。
- 核心任务：选玩法 → 学当前控制 → 向更远/更高处推进 → 感知里程碑与新障碍 → 被救援后继续 → 查看个人成绩。
- 信息密度：大厅每卡 4 个字段以内；游戏同一时刻只有 1 个动作目标。
- 默认布局：LV-00 三列大卡；LV-01 中央控制卡；LV-02 full-bleed 世界 + 顶部距离/高度 HUD；摄像头模式显示右上浮动教练，键盘模式不实例化教练与手势定位标记；LV-03 为单屏横向双栏成绩卡，左侧庆祝、右侧分数/Top 5/操作。
- 已确认方向：用户明确要求三个玩法默认解锁、教学在玩法内、玩法内递进与分数/排行榜。

### Reference Alignment

- 参考样本：Nex/GoNoodle 的直接世界反馈、Doodle Jump 的自动弹跳 + 左右对准平台、Jetpack Joyride 的渐进卷轴与个人成绩循环。
- 必须继承：少输入、即时反馈、以实际位移表达进程、逐渐提速、障碍组合进阶、个人进步、碰撞后快速恢复。
- 可以偏离：采用 3 颗勇气心形成自然停点；排行榜只在设备内匿名保存。
- 禁止偏离：除用户明确提供的本地主角参考图外，不得复制其他官方角色、美术、音效或关卡布局；不得引入窄缝即死、武器、广告或公开社交竞争。

### Character Asset Contract

- 参考身份：用户提供的蓝色主角图与橙色伙伴图；每个角色只改变动作姿势，分别保留轮廓、配色、面部特征和儿童友好画风，不使用滤镜把同一轮廓伪装成另一角色。
- 动作清单：两名角色分别生成 `idle`、`run`、`jump`、`hover`、`hurt`、`bump`、`celebrate`；每组 2×2、4 帧透明 PNG，并保留原始洋红底表、透明合图、GIF、prompt 与 QC 元数据，共 14 组/56 帧。普通障碍命中播放 `bump`，坑洞/安全云救援继续使用 `hurt`。
- 状态映射：准备/等待 → `idle`；L1 前进 → `run`；L1/L3 弹跳 → `jump`；L2 跟手 → `hover`；碰撞/坠落/救援 → `hurt`；准备完成/成绩 → `celebrate`。
- 实现边界：动作切换不得改动 `Session`、输入映射、碰撞、计分、救援或 screen transitions；动作帧加载失败时回退到同角色 `idle`，不阻断本局。
- 发行边界：素材只服务本项目的私人本地试玩；分享构建物、公开发布或商用前必须取得授权，或整体替换为原创角色素材。

### Layered Map Asset Contract

- Pipeline：`side_scroll_mode`；`parallax_layers`；独立 `platform_objects + interactive_scene_objects`；`precise_shapes`；project-native HTML/CSS/JS。
- Canvas：所有主背景板、舞台参考与预览统一为 `1536×864`。L1/L2 使用水平镜像循环对并 `repeat-x`；L3 使用纵向镜像循环对并 `repeat-y`。
- Runtime layers：fallback color → generated far → generated mid → generated ground/platform skins → obstacles/pickups → actors → feedback → HUD/coach。
- L1：远/中/地面速度比 `0.08/0.22/1.0`；地面条、软木箱与溪水坑为独立结构，首尾循环不得出现空白或跳缝。溪水坑使用一张宽幅透明皮肤，碰撞仍由运行时目标矩形决定，禁止继续使用深色 CSS 椭圆占位。
- L2：远/中速度比 `0.06/0.18`；上下树篱使用同一透明障碍皮肤，碰撞仍由 `safeY±0.22` 运行时矩形决定。
- L3：远/中纵向速度比 `0.08/0.16`；生成树枝只蒙皮 `platforms`，安全云只蒙皮救援锚点，摄像机和落台物理不从像素推导。
- Visual restraint：背景 saturation≤约 `.86`、contrast≤约 `.90`、低纹理噪声；中央行动区、顶部 12% HUD 与右侧 20% 教练区域不放高对比地标；所有可碰撞物必须比背景更清楚。
- Files：运行契约使用 `data/maps/game-maps.json`；每个生成资产旁保留 prompt，原始图保留在对应 `raw/`，透明处理和循环对可重复构建。

### Map-Consistent Interface Skin Contract

- Design thesis：界面应像“放在插画地图上的儿童探险手册”，使用温暖、哑光、轻厚描边与压印按钮；信息区保持干净，不把树叶、云、木纹等高频纹理铺到文字背后。
- Token：`paper #fff9e8`、`paper-soft #f7efcf`、`river #3889b6`、`river-dark #185779`、`moss #6f9f59`、`bark #8a5a32`、`sun #f2bd55`、`ink #173a52`、`muted #587084`；线条优先暖棕/河蓝，避免通用 SaaS 灰线和紫蓝渐变。
- Surface：大厅卡、玩法说明、教练、暂停、成绩使用同一暖纸面；外框 2–3px、底部 5–7px 压印边、圆角 18–28px、单层软阴影。不得出现卡片套卡片或半透明玻璃拟态。
- Controls：主按钮为河蓝底 + 深河蓝底边，次按钮为奶油纸面 + 树皮边，奖励/确认用太阳黄；hover 只轻抬 2–3px，press 下压；所有文字仍满足可读对比。
- HUD/Coach：运行态顶部图片牌只承担距离/高度与下一里程碑进度，不显示星形、分数或阶段文案；分数继续由运行时累计并仅在 LV-03 成绩/Top 5 呈现。距离/高度数字保持最高对比，使用当前玩法生成的无文字图片牌作为底板，实时数字与单位由 HTML 覆盖。教练只属于摄像头模式，继续使用暖纸册页，摄像头本身保持中性深色画框；键盘模式隐藏整块教练。
- LV-00：三张玩法卡各自使用对应地图远/中景作为低对比缩略舞台；角色和玩法图标在其上，禁止继续用纯 CSS 彩条/圆形替代场景。
- LV-01：玩法入场封面必须直接复用所选玩法的远/中景和结构底层；切换 L1/L2/L3 时更新 `data-theme`，不得保留旧 `.sun-disc/.hill/.paper-path` 封面。
- LV-02：继续沿用地图分层和独立结构物件；提示、HUD、教练使用统一界面 token，不改变世界物理与碰撞。
- LV-03：成绩页背后显示当前玩法的低对比地图远景，成绩主体为暖纸探险记录板；角色、奖章、分数和操作优先于背景。
- Asset policy：里程碑牌、障碍变体与数字字形使用同一手绘地图风格；既有按钮、卡片和长文本容器继续使用 CSS token，实时中文/米数不烘焙进图片。升级反馈为独立轻量庆祝层，可用 CSS 纸带、光芒与粒子组合，不得复用或放大顶部 HUD 图片牌。

### Endless Milestone Visual Asset Contract

- UI 图片：生成 `creek/firefly/treetop` 三张无文字透明完整里程碑面板；面板分别使用溪流路牌+饼干印章、叶片+萤火虫光点、树枝+云朵高度标识，轮廓与现有地图结构物件一致。顶部 HUD 中央原容器由完整图片直接替代，图片不是容器旁的 icon，也不叠加第二层 CSS 白底。
- 升级反馈：不复用顶部完整里程碑面板，改为独立的太阳黄纸带/光芒与叶片粒子层；在世界顶部中轴偏下的安全区出现，使用与 HUD 不重复的短标题（如“节奏升级！”“树梢高手！”）和一行实时里程碑“来到 100 米”。显示约 1800ms，含弹入、轻微过冲、粒子散开和淡出；图层低于当前动作提示与摄像头教练，不遮角色和危险物。
- 数字字形：生成一组无多余装饰的 `0–9 + m` 手绘字形，统一深河蓝主体、奶油高光和暖棕轻描边；小写 `m` 必须与数字同高、同描边、同纹理，不允许继续混用系统字体。运行态距离/高度的数字与单位 `m`、LV-03 本次分数/最好/Top 5 优先使用该图集；加载失败时回退到 `tabular-nums` 系统文本，动态值仍保留可读文本与无障碍语义。
- 障碍图片：L1 生成原木路障和双层软木箱视觉；L2 生成圆叶篱与芦苇叶篱两种轮廓；L3 生成窄枝与弯枝平台皮肤。宽/长、碰撞承载对象逐个生成，不放入普通方形 prop pack。
- 透明处理：内置图片生成先输出单色洋红背景，再本地去底；最终 PNG 必须有 alpha、四角透明、主体不触边、无洋红溢边，并记录 prompt/manifest/目标显示尺寸。
- 运行边界：图片不携带文字、数字、碰撞、里程碑逻辑或对象生命周期；CSS 只负责响应式排版和实时数据叠加，不重新绘制图片主体。

### Audio Feedback Contract

- 资源：`assets/audio/audio-manifest.json` 定义 4 条 18 秒循环 BGM 与 14 个短音效；新 BGM 使用更丰富、欢快且彼此可区分的配器，04B 只读取项目内 MP3，不依赖 CDN、后端或运行时 ElevenLabs 请求。
- Screen 映射：GI-01–GI-06、LV-00、LV-01 使用 `bgm_menu`；LV-02 按 L1/L2/L3 使用 `bgm_creek` / `bgm_firefly` / `bgm_treetop`；LV-03 停止 BGM 并播放一次 `sfx_round_complete`。
- 事件映射：玩法选择、输入就绪、倒计时 tick/go、L1 jump、collect、pass、soft collision、rescue、L3 platform land、character switch、pause 与 UI confirm 使用各自 cue；位置跟手和每秒生存分不得发声。
- 控制：家长抽屉新增一个真实产品按钮“声音：开/关”，`aria-pressed` 与本机偏好同步；不新增 screen、不占儿童 HUD、不提供复杂滑杆。
- 生命周期：首次可信用户交互后才允许播放；家长抽屉、`document.hidden` 与安全暂停会暂停 BGM；恢复时继续当前主题；任何 `play()` 失败都静默降级且不得产生未处理异常。
- 混音：BGM `0.22`、SFX `0.52`；同类 cue 有 120–360ms 冷却，碰撞/救援使用柔和音色，结算时不得与 BGM 叠播。

### Product Canvas Rules

- 主画布只展示真实产品 UI。
- 不放 screen-nav、state-nav、inspector、测试按钮、QA 文案或原型说明。
- 测试注入 API 仅挂在 `window.__mvpTest`，不渲染可见控件。
- 儿童可见层从初始界面到成绩页采用“图形与角色反馈优先、文字最少”：同一视区最多 1 个短标题、1 个当前动作短句和 1 个主 CTA；不同时显示 eyebrow、标题、说明段、状态脚注来重复同一信息。
- 玩法名、分数数字、勇气心、当前动作和主/返回操作属于必要信息；玩法长描述、设备存储说明、速度文字、输入模式技术名和重复鼓励句默认不常显。
- 家长抽屉、隐私折叠区、错误恢复和无障碍语义允许保留完整文字；视觉精简不得删除 `aria-label`、`aria-live` 或 `sr-only` 的必要解释。

## 5. Information Architecture

### Web

- 导航：输入就绪 → LV-00 玩法大厅 → LV-01 玩法入场 → LV-02 教学/正式计分/救援 → LV-03 成绩 → 再玩或大厅。
- 主工作区：LV-02 世界舞台。
- 辅助上下文：顶部距离/高度 HUD、摄像头模式的浮动教练、家长暂停层。
- 主操作位置：大厅卡片底部；入场/成绩卡底部；游戏不依赖点击主操作。

## 6. Core Flows

| Flow | Entry | Steps | Success | Failure / Edge Cases |
|---|---|---|---|---|
| 任意玩法选择 | LV-00 | 点击任一卡 → LV-01 | 对应玩法装载 | 无锁态；缺 capability 时提示接管 |
| 玩法内教学 | LV-01 | 开始 → 3/2/1 → 无危险教学 | 完成一次对应控制 | 8s 后家长可直接开始；不扣心 |
| 距离/高度无尽计分 | LV-02 tutorial done | 实际位移累计米数 → 跨里程碑 → 速度/障碍升级 → 失误救援 | 刷新个人最好与最高里程碑 | 第3次失误或主动结束进入成绩 |
| L1 跳坑 | LV-02 L1 | 拳→掌 → 空间跳跃 → 跨坑 | 越坑 + 分 | 未跳/高度不足 → 掉落托回 |
| L2 跟手 | LV-02 L2 | 掌心Y → 平滑 → 穿宽通道 | 过门 + 分 | Unknown 仍跟手；丢手暂停 |
| L3 平台弹跳 | LV-02 L3 | 自动弹跳 + 掌心X左右对准 → 落台 | 高度/落台 + 分 | 落空安全云托回扣心 |
| 成绩与重玩 | LV-03 | 显示本次/最好/Top5 | 再玩或换玩法 | localStorage 不可用则只显示本次 |

## 7. Screen Inventory

| ID | Screen | Purpose | Entry | Exit |
|---|---|---|---|---|
| GI-01/GI-02/GI-03/GI-05/GI-06 | 输入设置/就绪 | 输出 InputProfile | 起始/降级 | LV-00 |
| LV-00 | 三玩法大厅 | 默认开放的玩法选择 | 输入就绪/LV-03 | LV-01 |
| LV-01 | 玩法入场 | 只说明当前玩法控制 | LV-00/LV-03 | LV-02 |
| LV-02 | 运行时宿主 | 教学、计分、救援、暂停 | LV-01 | LV-03/LV-00 |
| LV-03 | 单局成绩 | 本次分数、最好、Top 5 | LV-02 | LV-01/LV-00 |

## 7B. Coverage Plan

### Backbone Group `integrated-mode-hub-score-loops`

- 起始 Screen：GI-01
- 输出文件：`04B-prototype-手势小狗探险MVP.html`

| Screen | 进入方式 | 真实交互 | 目标 |
|---|---|---|---|
| GI 输入流程 | 起始 | 输入就绪后点击“开始游戏” | LV-00 |
| LV-00 | 输入完成/成绩返回 | 点击任一玩法卡 | LV-01 |
| LV-01 | 已选玩法 | 点击“开始玩” | LV-02 |
| LV-02 | 倒计时后 | 第3次失误/家长结束 | LV-03 |
| LV-03 | 本局结束 | 再玩一次/换玩法 | LV-01/LV-00 |

### Extension States

| Surface | Type | 说明 |
|---|---|---|
| LV-02 | no-hand / camera-error | 主干内可恢复状态 |
| LV-02 | parent-pause | 主干内可恢复状态 |
| LV-03 | storage-error / first-score | 不阻断再玩 |

## 8. Screen Specs

### LV-00：三玩法大厅

- Platform：Web。
- Purpose：让孩子按玩法差异选择，而不是理解顺序进度。
- User intent：今天想玩哪一种？
- Layout regions：顶部品牌/家长入口；中央短标题；三列同权玩法卡。页面底层使用低对比插画天空/草地，三卡内分别显示溪边、湿地、树梢地图缩略舞台；不常显底部设备说明。
- Primary content：玩法名、一个控制图形、地图缩略舞台、个人最好；卡片不显示控制说明段。
- Primary action：整卡点击进入当前玩法。
- Secondary actions：家长入口。
- Navigation：任一卡 → LV-01；不允许 disabled/locked。
- Data needed：`modeDefinitions`、`bestScoreByMode`。
- States：default；first-use 显示“还没有成绩”；return 显示个人最好；storage-error 显示“本次设备暂不保存”。
- Interactions：hover/focus/press 有清晰反馈；卡片顺序不表示锁关。
- Responsive：5 个支持视口始终三列；缩短描述而不改成滚动列表。
- Accessibility：整卡为 button，aria-label 含玩法名和个人最好，焦点明显。
- Acceptance：三卡可点；无关卡编号、锁图标、“完成上一关”、玩法说明段和底部设备脚注；三张地图缩略舞台真实来自各关地图资产；无页面滚动。

### LV-01：玩法入场

- Platform：Web。
- Purpose：只教当前玩法的控制，不承担三玩法比较。
- Layout regions：所选玩法远/中景铺满封面；中央暖纸标题签直接包含角色/玩法名、个人最高分、一张大控制示意和一个动作短句；底部开始/返回。标题签使用明确的四向内容安全边距，所有文字/数字必须位于纸张装饰内缘。倒计时作为绝对定位的独立中层，不参与原内容流排版；进入 3/2/1 时隐藏最高分、控制图、角色和按钮，只保留安全区内的玩法名、中央数字与下方“准备”。最高分不得再单独占用顶部 HUD。封面地图与 LV-02 当前玩法保持同一主题。
- Primary content：
  - L1：拳/掌图形 + “握拳 → 张手”。
  - L2：上下箭头 + “上下带路”。
  - L3：左右箭头 + “左右带路”。
- Primary action：“开始玩”。
- Secondary actions：“换个玩法”；已看过教学时可勾选“再看一次”。
- Navigation：开始 → LV-02 3/2/1；返回 → LV-00。
- Data needed：`modeId`、`inputProfile`、`tutorialSeenByMode`。
- States：camera/keyboard 文案适配；missing capability；focused；countdown-safe。
- Acceptance：三个 mode 的动作图形/短句严格对应，页面不同时展示其他玩法步骤、输入技术名或准备状态长句；倒计时 3/2/1 不推动玩法名或“准备”越出纸张内容安全区，标题上下至少保留 20px 视觉余量；L1/L2/L3 封面分别使用 creek/firefly/treetop 新地图，不实例化旧 CSS 山丘、太阳、花线或土路。

### LV-02：共享运行时宿主

- Platform：Web。
- Purpose：托管教学、正式计分、救援与暂停，同时让世界反馈成为视觉主角。
- Layout regions：full-bleed world；紧贴顶部安全区的唯一距离/高度 HUD；中央瞬时目标；摄像头模式右上浮动教练；家长暂停覆盖层。键盘模式不保留右上视频/提示面板，也不显示角色旁手势定位标记。
- Primary content：完整里程碑图片面板内只显示整数距离/高度与覆盖底部内容区的进度槽，右侧保留 3 颗心、输入方式与暂停，世界内显示角色、危险物/目标和当前唯一动作图形；运行态不显示星形、分数、阶段短文案、倍率、输入模式技术名或双行识别 readout。分数继续在内存中累计，结算页再呈现。
- Primary action：手势/掌心位置；键盘等价输入。
- Secondary actions：暂停/结束本局/输入接管。
- Audio：玩法主题 BGM 在首次用户交互后播放；家长暂停/无手安全暂停/页面后台时停播。按钮本身不进入儿童 HUD，声音总开关位于家长抽屉。
- Navigation：第3次失误或结束 → LV-03；返回大厅需家长确认。
- Data needed：run state、runtime state、InputProfile、camera status。
- States：countdown/tutorial/scored_run/milestone-up/bump-impact/rescue/invulnerable/no-hand/paused/camera-error/ending；`bump-impact` 使用两名角色新增 2×2 四帧 gentle bump 动作。
- Interactions：所有运行时暂停时 `scoredElapsedMs`、`progressMeters` 和世界对象冻结；救援期间不接受碰撞。跨阈值时 `milestone-up` 独立庆祝层显示约 1800ms，1700ms 内不生成新危险物但已有对象继续运行；动效包含纸带弹入过冲、光芒/叶片粒子散开与淡出，不改变世界物理。
- Audio interactions：jump/collect/pass/collision/rescue/platform-land/character-switch 只在对应状态转换边沿触发一次；连续 tracking frame、逐秒分数和 render loop 不触发音效。
- Responsive：世界铺满；摄像头教练不遮角色、目标或 HUD；识别 readout 位于视频外；键盘模式释放右侧全部空间。
- Accessibility：HUD 有 aria-live polite；视觉隐藏的当前分数仍保留语义文本但不逐帧朗读；暂停可键盘触发；里程碑只在跨阈值时朗读一次；reduced motion 下庆祝层仅淡入淡出，米数和短文案仍完整。
- Acceptance：任何失误都可见；前两次继续，第3次成绩；无 Game Over 文案；暂停/救援/原地等待不增加米数。

#### LV-02 / 共享里程碑 HUD

- Persistent HUD：当前玩法图片牌作为顶部唯一信息底板，内部只显示整数 `progressMeters` + 单位 `m` 与进度槽；没有星形、分数、阶段标签或“新挑战来了”。距离/高度数字四周使用显式安全边距，最长 4 位数 + `m` 不得触碰装饰。
- Progress：进度槽横向覆盖图片牌底部内容安全区，指向下一基础里程碑；Tier 5 后仍按无尽段推进，但段名只保留在无障碍语义与结算文案中，不常显于顶部牌。
- Milestone-up：使用与顶部图片牌不同的独立庆祝层，标题和副文案各一行；禁止出现“新挑战来了/新的挑战出现啦”，禁止复用、放大或再次显示 HUD 底板。标题按档位选择“越走越远！”“节奏升级！”“连续闯关！”“超级探险家！”“无限旅程！”；L3 第一档用“越跳越高！”。副文案仅为“来到 N 米”。
- Responsive：1440×900 至 919×843 均需保持 HUD 贴近上沿；数字与进度不隐藏，空间不足时只缩小装饰。摄像头模式给教练留安全区，键盘模式不预留教练宽度。
- Acceptance：同一阈值每局只出现一次；庆祝层收起后顶部面板与障碍皮肤已切换到新 Tier；顶部没有星级/分数概念和重复阶段文案；独立庆祝层与 HUD、角色、动作提示无重叠。

#### LV-02 / L1 溪边跳跳

- Tutorial：4 秒无坑宽路；完成 1 次拳→掌高跳。
- World：角色固定约 26% X；背景/地面/道具/木箱/坑洞共用 `worldSpeed`。
- Map：远景、中景和地面条为三个独立可循环层；用镜像循环对保证正/负偏移均首尾连续，地面碰撞不读取背景像素。
- Jump：1200ms，`clamp(180px,28vh,260px)`；目标从可见提示到碰撞中心约 1.05s，同一帧启动角色位移与状态。
- Collision：溪水坑/木箱依据当前空间重叠 + `jumpY`，无独立目标计时窗；溪水坑贴图只负责视觉，透明边界不参与碰撞。
- Lifecycle：坑/箱/原木无论成功越过还是碰撞，判定后均进入 `passedObjects`，继续按当前 `worldSpeed` 向左穿过角色位置，完全离开屏幕后才回收；`judged=true` 保证不重复扣心。
- Success：跨坑/越箱 +20 与 streak 奖励。
- Distance/Difficulty：`worldSpeed*delta/48` 累计整数米数；100/250/450/700m 依次解锁原木路障、箱→安全地面→坑、坑→安全地面→箱和安全高级轮换；任意危险判定区仍间隔至少 1.8s。
- Rescue：掉落 220ms → 伙伴托回 420ms → 落地 180ms；勇气减一，1.2s 无敌。
- Acceptance：推荐起跳点可越 96–118px 坑；未跳必触发完整救援；同一对象不得连续扣心。

#### LV-02 / L2 萤火虫躲躲

- Tutorial：5 秒无障碍，上/下各跟随一次。
- World：角色 X 固定；掌心 Y 映射世界 22%–72%。
- Processing：EMA .28、3.5% deadzone、单帧≤12%；Unknown 有关键点时继续。
- Success：进入宽安全带 +20；碰撞勇气减一并泡泡弹回，1.2s 护盾。
- Lifecycle：通道越过角色判定线后进入 passedObjects，仍继续向左穿过角色位置，直到完全离开画面才销毁；下一通道可以同时生成。
- Map：青绿色低对比远/中景保持中心通道空旷；上下树篱为独立透明皮肤，视觉皮肤与 `safeY` 碰撞矩形生命周期分离。
- Distance/Difficulty：`worldSpeed*delta/48` 累计整数米数；100/250/450/700m 依次进入偏移单门、高低交替、双门回正区和安全高级轮换，并切换圆叶/芦苇叶篱皮肤；安全带半高始终 ≥0.24。
- No hand：≤600ms 保持；>600ms 冻结世界，不扣心。

#### LV-02 / L3 树梢蹦蹦

- Tutorial：角色持续自动弹跳；一张宽安全平台和左右光点，完成左右各一次跟手。
- World：纵向世界坐标；角色有 `playerWorldY`、`verticalVelocity`、重力和实际脚部碰撞。只在下降阶段穿越平台 worldY 且横向重叠时落台，落台立即再弹。
- Camera：角色屏幕 Y 高于约 40% 时 `cameraY` 单调向上追随；平台屏幕 Y 由 `platformWorldY-cameraY` 计算，因此随镜头自然下移。不得用定时器让平台穿过固定落台线。
- Map：低对比树冠远/中景按 `cameraY` 纵向视差；生成树枝踏板与安全云为独立透明对象，只读取现有 platform/rescue 几何。
- Control：掌心 X 经过 EMA .30、3.5% deadzone、单帧≤12% 后映射到世界 18%–82%；Unknown 有关键点时继续；键盘 ←/→ 可按住。
- Success：下降落到平台 +20、立刻获得下一次向上速度；攀升高度来自真实最大世界 Y。镜头上方持续生成可达平台，低于镜头下沿后才回收。
- Height/Difficulty：`maxPlayerWorldY/20` 累计整数高度米数；20/50/90/140m 依次进入左右交替、宽窄交替、连续换向和安全高级轮换，并切换窄枝/弯枝皮肤；弹跳节奏最高 1.35x，平台仍可达且宽度 ≥28%。
- Rescue：跌出镜头下沿时安全云托到最近可见平台、勇气减一、1.2s 护盾并继续；没有坠落即死或回到开局。
- Difficulty：基础平台宽 28%–36%；只温和提高弹跳节奏、横向换位和宽窄组合，不引入破碎/消失/移动平台。

### LV-03：单局成绩

- Platform：Web。
- Purpose：积极收尾并提供个人重玩动力。
- Layout regions：当前玩法低对比地图远景铺底；暖纸探险记录板左栏为“本局小记忆”画框，摄像头模式截取结算瞬间一帧并叠加地图主题点缀/角色，键盘或不可用时回退到当前玩法地图；右栏只常显简短鼓励、本次大分、个人最高分、竖向降序同玩法 Top 5 与双操作。所有内容位于 `max-height:calc(100dvh - header)` 内。
- Primary content：`score`、`progressMeters`、`highestMilestoneLabel`、`isNewBest`、`bestScore`、`topScores[0..4]`、当前内存态 `runSnapshotDataUrl|null`。
- Primary action：“再玩一次”。
- Secondary actions：“换个玩法”。
- Navigation：再玩 → LV-01 当前玩法；换玩法 → LV-00。
- Audio：进入成绩页先停当前 BGM，再播放一次温和结算 jingle；再玩/换玩法后由目标 screen 重新选择主题。
- States：first-score/new-best/regular/storage-error。
- Accessibility：榜单为从高到低的竖向有序列表；本局画面有替代文本，地图回退不依赖颜色表达；新最好用文字与图形，不只靠颜色。
- Responsive：宽屏保持两栏；低高度压缩插画而不隐藏 Top 5/按钮；不使用页面或卡内滚动。
- Acceptance：不显示姓名输入、全球排名、失败率、跨玩法排名、重复的玩法成绩标题或结束原因长句；主操作不是“下一关”；左侧游玩画面、竖向 5 条 Top 5 与两枚儿童操作按钮完整可见；截图只存在当前页面内存，不写 localStorage、不上传。

## 9. Component And State Matrix

| Component | Default | Empty | Error | Success | Disabled / Focused |
|---|---|---|---|---|---|
| Mode card | best score | 还没有成绩 | 本机暂不保存 | 可进入 | 不允许 disabled；focus ring |
| Runtime score model | visually hidden | N/A | N/A | 持续累计；LV-03 呈现 | pause frozen |
| Courage hearts | 3 | 0→ending | N/A | rescue continues | invulnerable pulse |
| Milestone image panel | 玩法完整图片面板 + 0m + 满宽进度 | N/A | 图片失败回退文字边框 | 米数增长；无阶段标签 | pause frozen；focus N/A |
| Milestone celebration | hidden | N/A | 仍显示实时文字 | 独立纸带 + 光芒/叶片粒子单次出现 | reduced motion fade only |
| Camera coach | current control | no hand | camera/model | seen/armed | keyboard mode hidden |
| Pause/reminder board | 图标 + eyebrow + 标题 + 1–2 行正文 | N/A | 可恢复短文案 | 安全恢复倒计时 | 正文行高约 1.6；区块间距 12–16px |
| Result Top 5 | ordered scores | 第一次成绩 | storage unavailable | new best | focusable actions |
| Run memory frame | 当前摄像头单帧 | 玩法地图回退 | 捕获失败回退地图 | 当前局画面 + 主题点缀 | 非交互；不持久化 |
| Parent audio toggle | 声音：开 | N/A | 静默降级 | 当前主题恢复 | `aria-pressed` + focus ring |
| BGM channel | screen theme | 首次交互前静默 | load/play failure 静默 | 单曲循环 | paused in drawer/background |

Loading 只发生在选择玩法后的 runtime mount；LV-01 保持可见并显示“正在准备小路”，加载失败可返回大厅或重试。

## 10. Sample Data

- `bestScoreByMode={creek_jump:186,firefly_dodge:242,treetop_bounce:131}`。
- `topScoresByMode.creek_jump=[186,151,124,93,62]`。
- first-use 卡片：“还没有成绩”。
- L1 run：`score=84,courage=2,progressMeters=268,milestoneTier=2,speedMultiplier=1.25,streak=3`。
- L3 run：`score=131,courage=3,progressMeters=54,milestoneTier=2,bounceTempoMultiplier=1.12`。
- 长边界文案：“摄像头暂时没看见小手，小路已经停下，不会扣勇气”。

## 11. Data And Events

- `ModeDefinition{modeId,runtimeType,baseSpeed,progressMetric,pixelsPerMeter,milestoneThresholds,maxMotionMultiplier,obstaclePatterns,missLimit}`。
- `RunState{runId,phase,score,courage,streak,scoredElapsedMs,progressMeters,milestoneTier,endlessSegment,speedMultiplier,bounceTempoMultiplier,obstacleTier,milestoneOverlayUntilMs,invulnerableUntilMs}`。
- `MilestoneEvent{modeId,metric,meters,tier,endlessSegment,label,triggeredAt}`；每个基础阈值/无尽段每局至多一个。
- `ScoreEvent{type,points,modeId,timestamp}`。
- `MistakeEvent{type,modeId,worldObjectId,timestamp}`。
- `RunResult{modeId,score,bestScore,topScores,isNewBest,endedBy,snapshotCaptured}`；`runSnapshotDataUrl` 仅在 LV-03 内存态，不进入持久化结果。
- L1 `WorldObject{objectId,type,worldX,width,height,resolved}` 与 `JumpState{phase,elapsedMs,jumpY}`。
- L2 `PassedObject{objectId,type,worldX,width,judged,outcome}`，完成判定后仍更新位置直到完全离场。
- L3 `HandTrackingFrame{palmCenterX,...}`、`BounceState{phase,elapsedMs,playerX}`、`Platform{id,x,y,width,judged,starCollected}`。
- `AudioPreference{enabled}` 使用独立 localStorage key `gesture-pup-audio-v1`；`AudioRuntime{unlocked,currentBgmId,lastSfxAt}` 仅在内存中存在。
- `AudioCue{id,kind,file,usage,loop,durationSeconds}` 来自 `assets/audio/audio-manifest.json`；04B 以冻结映射接入，不在浏览器里携带生成 API key。
- `MilestoneAsset{modeId,panelImage,obstacleVariantImages,prompt,displaySize,collisionRole}` 来自本地 manifest；图片不定义碰撞。

## 12. Responsive Rules

- 支持视口：1440×900、1280×720、1219×681、1024×700、919×843。
- `html,body,#app` 使用 `height:100%;overflow:hidden`；screen 使用 `100dvh` 与 `min-height:0`。
- LV-00 始终三列；低高度减少卡内空白、角色插画与描述行数，按钮 ≥44px。
- LV-01 暖纸标题签采用固定安全区栅格而非按父宽度放大的百分比 padding；倒计时不参与普通内容流，所有支持视口都不得裁切玩法名、倒计时数字或“准备”。
- LV-02 摄像头模式 coach 宽 `clamp(190px,18vw,270px)`；摄像头 `max-height:26vh`；readout 静态位于视频下方。键盘模式 coach 使用 `hidden` 从布局和无障碍树移除，不显示替代占位卡。
- 目标/坑洞不得生成在 coach 遮挡区域内；游戏核心对象位于世界左侧 72% 可见区。
- LV-03 使用横向双栏，左侧为 16:9 当局单帧画框，右侧 Top 5 固定为从高到低的 5 行；卡片与页面均不滚动，低高度优先缩小画框和装饰角色。

## 13. Accessibility And Interaction

- 所有按钮/玩法卡支持 Tab、Enter/Space，焦点对比明显。
- 游戏 Space 事件不得与按钮激活冲突；只有 game surface focused 时控制角色。
- 触控/点击目标 ≥44×44px。
- 动态分数/米数不每帧朗读；只在越障、失误、跨里程碑和新最好时 aria-live polite。
- 风格化数字仍必须保留同值的文本或 `aria-label`，不能让分数/米数只存在于背景图片。
- `prefers-reduced-motion` 移除升级弹跳/旋转与粒子位移，只保留短暂淡入淡出；仍保留跳高、掉落/托回、心减少、平台位移与安全云反馈。
- 声音不是唯一反馈：每个 cue 必须继续保留既有视觉/文字/aria-live 反馈；声音开关使用文本与 `aria-pressed`，不只靠图标或颜色。

## 14. Visual / Content / Interaction Thesis

- Product type：家庭儿童体感小游戏合集。
- Visual thesis：明亮原创卡通世界 + 暖纸探险手册 UI；大胆形状、轻厚描边、清晰层级、极少文字。地图负责空间感，UI 负责可读性，二者共享河蓝/苔绿/树皮/太阳黄而不共享高频背景纹理。
- Content tone：具体、鼓励、无评价；优先 2–8 个汉字的动作词与结果词，“没关系，再来”而不是“失败”。
- Interaction thesis：世界先反馈，图形其次，文字只补足当前一步；玩法选择平权，个人成绩不公开比较。
- Density：大厅低密度三卡；游戏单目标；成绩卡只展示同玩法 5 条。

## 15. Annotation Points

| Screen | Point | Why |
|---|---|---|
| LV-00 | 三卡全部可点 | 证明是玩法大厅而非顺序关卡 |
| LV-01 | 单一控制图 | 证明教学下沉到玩法 |
| LV-02/L1 | 坑洞、jumpY、救援 | 证明视觉与判定共享物理 |
| LV-02/L2 | 已判定通道继续离场 | 证明判定与视觉生命周期解耦 |
| LV-02/L3 | 自动弹跳、掌心X与宽平台 | 证明采用成熟平台循环且只有一个儿童控制任务 |
| LV-02 | 心/米数/图片里程碑牌/独立庆祝层 | 证明真实位移驱动的无尽循环与可感知升级，同时避免顶部信息重复 |
| LV-03 | 本机 Top 5 | 证明个人榜边界 |

## 16. Assumptions

- 家庭笔记本可用宽度至少 919px；本轮不覆盖手机远程摄像头游玩。
- localStorage 在大多数家庭浏览器可用；不可用时不阻断当前游戏。
- 真实儿童手感仍需家长陪同试玩验证，自动化只保证状态与布局。

## 17. Open Questions

- 无阻塞问题。若真实儿童通常无法到达第二个里程碑，优先调低前两档米数或放宽障碍，不允许改回按时间推进。

## 18. Acceptance Criteria For HTML Prototype

- [ ] 从 GI 输入就绪点击“开始游戏”直接到 LV-00。
- [ ] LV-00 三玩法默认全可点，无锁态/编号/完成上一关文案。
- [ ] LV-01 与 LV-02 tutorial 对三个玩法分别显示唯一正确控制。
- [ ] LV-01 开始后的 3/2/1 倒计时不挤压普通内容；玩法名、数字和“准备”均位于暖纸标题签四向安全区，5 个支持视口无裁切、越界或边缘重叠。
- [ ] LV-02 三 runtime 均实现 score/courage/progressMeters/milestone/obstacle-tier/rescue/result。
- [ ] L1/L2 米数只由有效水平世界位移累计；L3 米数只由历史最大真实世界高度累计；暂停、救援和原地等待至少 5 秒均不改变米数。
- [ ] L1/L2 在 100/250/450/700m、L3 在 20/50/90/140m 同步更新速度档、障碍档、HUD 完整图片面板并单次显示独立庆祝层；庆祝层不复用 HUD 图片牌、不出现“新挑战来了”。
- [ ] Tier 5 后继续运行并按 300m/60m 增加“无限旅程 N”；速度保持软上限，障碍在安全模式池轮换。
- [ ] L1 worldSpeed 同时驱动背景、地面、坑洞和障碍；碰撞读取 jumpY；L1/L2 判定后障碍继续向左离场并只判定一次。
- [ ] L1 三层在前进/反向至少 2 个画布宽后仍完全覆盖视口，循环对无空白、闪缝或首尾跳变；外缘像素差为 0。
- [ ] L1 推荐起跳可越坑；不跳会掉落、托回、扣心并短暂无敌。
- [ ] L2 通道完成判定后仍继续穿过角色位置并自然离场；同屏允许下一目标生成。
- [ ] L2 树篱贴图不改变 `safeY` 安全带，不与远/中景合并，也不因完成判定提前移除。
- [ ] L1 原木/双层箱、L2 圆叶/芦苇叶篱、L3 窄枝/弯枝为独立生成透明图片；加载失败不改变运行时几何或阻断本局。
- [ ] L3 角色自动弹跳，摄像头掌心 X 与键盘 ←/→ 均能左右对准宽平台；Unknown 不阻断位置流。
- [ ] L3 连续完成至少 3 次下降落台再弹；角色达到上方阈值后 cameraY 增加，平台 worldY 不变但 screenY 向下移动，画面自动向上推进。
- [ ] L3 落台按真实高度加分并继续，跌出镜头下沿显示安全云、扣心并继续；不出现坠落即死。
- [ ] 三关生成背景均为 scenery-only；背景低对比且不遮 HUD/教练/角色/碰撞物，软木箱、树篱、踏板和安全云均从独立透明图加载。
- [ ] LV-01 三种玩法封面复用对应新地图，旧 CSS 山丘/太阳/花线/土路不再可见；LV-00 缩略舞台与 LV-03 背景也能识别当前地图主题。
- [ ] L1 溪水坑从独立透明图片加载，色彩和线条与 creek 地面/软木箱一致；运行时碰撞宽度、扣心和救援逻辑不变。
- [ ] 大厅、玩法说明、HUD、教练、暂停和成绩页共享暖纸/河蓝/苔绿/树皮/太阳黄 token；文字区无高频纹理、主次按钮层级清楚、无玻璃拟态和卡片套卡片。
- [ ] 第3次失误进入 LV-03；本次分数写入对应玩法本机 Top5；摄像头模式捕获当前局单帧但不持久化。
- [ ] LV-03 再玩/换玩法/结束游戏真实可达；左侧当局画面、竖向降序 Top 5 和儿童操作在所有视口完整可见；无昵称/公开榜/图片上传。
- [ ] 摄像头与键盘两路径走通。
- [ ] 摄像头模式保留右上教练；键盘模式整块教练从布局/无障碍树移除，角色旁黄色手势定位标记不显示，键盘操作仍由中央动作提示与按键完成。
- [ ] 双角色 14 组/56 张透明帧全部本地可加载；页面不再实例化旧 `#dog` SVG 或橙色滤镜占位角色；L1/L2/L3、普通碰撞 `bump`、坑洞/安全云 `hurt` 与准备/成绩状态切换到当前角色对应动作组。
- [ ] 4 条 18 秒丰富欢快 BGM + 14 个 SFX 均从 `assets/audio/` 本地加载；manifest、HTML 映射和文件路径一一对应，无运行时外链或 API key。
- [ ] 首次用户交互后按 screen 播放正确 BGM；L1/L2/L3 互不叠播；LV-03 停 BGM 并只播放一次结算音。
- [ ] jump/collect/pass/collision/rescue/platform-land/character-switch/pause cue 在对应状态边沿单次触发；tracking/render/每秒得分不触发 cue。
- [ ] 家长抽屉声音按钮可聚焦，`aria-pressed`/文案/本地偏好一致；关闭、后台与暂停会停止或暂停声音，恢复后继续；播放失败不阻断玩法。
- [ ] 无原型脚手架；5 个视口均单屏、零重叠、按钮可用。
- [ ] 从 GI-01 到 LV-03，儿童常显区不出现介绍段、步骤清单、玩法长描述、设备存储脚注、输入技术名或重复状态说明；家长/错误/无障碍信息仍完整可达。
- [ ] LV-00 卡片只常显玩法名、地图/角色、图形和最好成绩；LV-01 只显示一个动作短句；LV-02 HUD 只常显距离/高度、满宽进度与勇气心，不显示星形、分数或阶段标签；LV-03 显示简短鼓励、风格化分数、最高里程碑、最好、Top 5 与两枚儿童操作。
- [ ] `0–9 + m` 风格化字形在运行态米数及 LV-03 分数/最好/Top 5 生效；距离单位不得混用系统 `m`，长到 4 位数字 + `m` 仍不碰底板装饰，素材失败时回退到等值 `tabular-nums` 文本。
- [ ] 同一儿童视区最多 1 个短标题、1 个当前动作短句和 1 个主 CTA；必要的返回按钮可并列但视觉降级。

## 19. QA Strategy For HTML Prototype

- QA Mode：`QA-TARGETED`；触发原因是 LV-01 倒计时、HUD 四向安全边距、键盘模式条件隐藏和升级庆祝层均存在纯文本检查无法可靠确认的局部溢出/遮挡风险。
- Static checks：数字资产路径/alpha/prompt、同一阈值单次触发、键盘教练/定位标记状态、JS 语法、现有计分/碰撞源真相不变。
- Browser checks：定向检查 1440×900、1219×681、919×843 的 LV-01 普通/3/2/1 与 LV-02 三玩法 Tier 0/Tier 2；摄像头模式检查教练留位，键盘模式检查教练与定位标记不存在；不进行无关全量验收。
- 人工 UX：确认顶部只读到距离/高度，升级标题与顶部不重复；庆祝效果明显但不抢夺操作；暂停提醒正文有舒适行距；reduced motion 仍能感知升级。

## 20. PM Review Slice

- 本阶段关键决策：三玩法均为无时长终点的无尽局；L1/L2 只按真实行进米数、L3 只按真实爬升米数推进，速度与障碍组合在里程碑同步升级；顶部图片牌只显示距离/高度与满宽进度，不显示星形、分数或阶段文案，分数仍在运行时累计并于结算/Top 5 呈现；升级使用独立庆祝层和一套不重复短文案；键盘模式不显示摄像头教练与黄色手势定位标记；LV-01 倒计时进入独立安全层；运行数字和单位使用同风格 `0–9 + m` 字形并保留文本回退。
- Target Surface：继续 `web-only`，单视口无滚动。
- 被放弃的方案：顺序锁关、固定关长、全局动作教程、自创叠云、无反馈穿模、经典 Flappy 即死、把涂色塞进计分玩法、公开排行榜。
- 需要 PM 确认的问题：请重点确认距离单指标 HUD、独立升级庆祝强度、键盘模式的清爽布局、倒计时安全区、提醒看板行距和风格化数字是否适合 5 岁儿童；当局留念只在当前页面内存中存在，不保存、不上传。
- 不需要 PM 审查的执行细节：CSS 数值、对象生成随机种子、测试 seam、音频冷却毫秒与 localStorage key。
- 进入下一阶段的条件：HTML builder 按该 screen/state 契约实现并通过 QA-TARGETED。

## 21. Spec Self-Check

- Screen coverage：PASS。
- State coverage：PASS。
- Target surface coverage：PASS（web-only）。
- Page archetype coverage：PASS。
- Reference alignment：PASS。
- Product canvas rules：PASS。
- Responsive coverage：PASS（5 个 Web 视口）。
- Handoff readiness：PASS。
- PM review gate readiness：PASS（confirmed）。
