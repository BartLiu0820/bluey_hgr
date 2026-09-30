# 产品方向研究：5 岁儿童手势控制横版亲子游戏
> 更新日期：2026-08-14 | 研究人：Codex

## 火线冲击范围合同（2026-09-05 开发授权）

Target Surface：web-only。旧三玩法保持温和无尽计分，第四玩法是独立的固定路线限时挑战：握拳抓住圆环，二维移动和单轴转腕穿过火线；首次实体接触或超时结束。松手冻结但不停表；长丢手/后台/暂停取消正式成绩资格，可继续练习。1教学短轨+1正式S弯轨，六角色复用，独立低用时本机Top 5。大厅为四卡2×2，输入就绪与角色选择顺序不变。

此增量来自用户指定玩法及已授权开发计划，不是新增竞品实测结论。三维旋转可控性、摄像头性能与儿童难度需要实现后验证。下文既有三玩法的市场证据和玩法分析继续适用于原三玩法，不向第四玩法外推。

## 核心判断

**结论**：Careful Go

**一句话理由**：摄像头体感亲子游戏、单输入横版玩法和布鲁伊家庭体感产品都已有真实验证，浏览器也能同时取得手势类别与手部关键点；本项目可用两种手型和掌心位置构成三种不同玩法，不必用新增手型制造丰富度。

**信心程度**：中 — 技术与品类证据较强，目标用户和家庭场景也已明确；但尚无本项目真实儿童试玩数据，最核心的手势可用性假设仍未验证。

**Target Surface**：web-only

**端型选择依据**：PM 已于 2026-08-11 确认首版采用浏览器、优先适配带摄像头的笔记本电脑；移动端不进入本轮 04A/04B 默认范围。

---

## 市场机会

**规模与趋势**：

- 官方 `Bluey: Bust-a-Move` 已把布鲁伊、家庭共同游玩和体感小游戏结合起来，包含定格舞、Keepy Uppy、模仿动物、烹饪动作与壁球等五类玩法，证明“布鲁伊 × 动作控制 × 家庭娱乐”不是纯概念。[Bluey 官方介绍](https://www.bluey.tv/blog/bluey-bust-a-move-bounces-onto-nex-playground/)
- Nex Playground 将“无需控制器、摄像头体感、5 岁起、家庭多人和隐私安全”作为核心卖点，并提供包括 Bluey 在内的儿童 IP 游戏，说明低龄家庭体感游戏已经形成成熟产品形态。[Nex Playground 官方页面](https://www.nexplayground.com/home-kids)
- GoNoodle Games 让儿童通过跳跃、下蹲和躲闪控制移动小游戏，强调无需控制器、数据连接或额外硬件，说明普通智能设备上的动作控制具有明确使用场景。[GoNoodle 官方页面](https://www.gonoodle.com/company/games)
- Doodle Jump 以角色持续自动弹跳、左右控制落向更高平台、角色上升触发镜头向上追随与高度成绩形成成熟循环；官方 App Store 页面标注 4+，支持把第三玩法收敛为“孩子只控制横向、角色自动完成重复跳跃”。本项目必须继承这条角色—镜头—世界状态链，不能把它替换为平台定时穿过固定判定线。[Doodle Jump 官方 App Store 页面](https://apps.apple.com/us/app/doodle-jump-insanely-good/id456355158)
- Crayola Create & Play 把涂色定义为不限时、不计分、鼓励探索的开放活动，因此涂色更适合未来独立创作区，不适合直接替换当前带速度、勇气心与 Top 5 的街机玩法。[Crayola Create & Play 官方页面](https://www.crayolacreateandplay.com/)
- Jetpack Joyride 以自动前进、单一纵向控制、收集、躲避与无尽高分构成可重复循环，验证了低输入词汇也能支持逐步提速与重玩；本项目只继承循环结构，不继承其 10+ 强度、武器、广告或社交竞争。[Jetpack Joyride 官方 Google Play 页面](https://play.google.com/store/apps/details?id=com.halfbrick.jetpackjoyride)
- 本项目是家庭 MVP，不以商业市场规模为 Go/No-Go 依据；本阶段不引用缺少可靠口径的 TAM 数据。

**切入点判断**：现在适合做“验证型家庭原型”，因为浏览器端 2D 游戏与实时手势识别都已有可直接使用的基础设施。差异化不在于发明体感玩法，而在于：无需专用主机、打开浏览器即可玩、针对单个 5 岁儿童降低手势数量和失败惩罚，并允许家长陪玩或随时切换到键盘降级控制。

---

## 竞品格局

| 竞品 | 核心定位 | 关键优势 | 主要局限 |
|---|---|---|---|
| [Bluey: Bust-a-Move](https://www.bluey.tv/blog/bluey-bust-a-move-bounces-onto-nex-playground/) | 官方布鲁伊体感小游戏合集 | IP、家庭共同游玩、动作与剧集情节结合紧密 | 依赖 Nex Playground 与 Play Pass；不是浏览器轻量体验 |
| [Nex Playground](https://www.nexplayground.com/home-kids) | 面向 5 岁以上家庭的摄像头体感主机 | 无控制器、多人、成熟游戏目录、隐私和儿童安全定位清晰 | 需要专用硬件；完整身体追踪对空间和动作能力有要求 |
| [GoNoodle Games](https://www.gonoodle.com/company/games) | 用跳、蹲、躲等动作驱动的儿童移动小游戏 | 无额外控制器、动作直观、强调身体活动 | 以移动 App/内容生态为主，不提供本项目想要的角色切换横版体验 |
| [Bluey: Let’s Play](https://www.bluey.tv/blog/bluey-lets-play-mobile-app-is-available-now/) | 布鲁伊家庭场景中的触控探索与角色扮演 | 低龄熟悉角色、可探索房间、可切换角色与情境 | 主要是触控沙盒，不验证摄像头手势和横版卷轴机制 |
| [Doodle Jump](https://apps.apple.com/us/app/doodle-jump-insanely-good/id456355158) | 自动弹跳并左右对准平台的向上攀升游戏 | 重复跳跃自动发生；下降落台立刻再弹；角色抵达上方阈值后镜头向上追随，高度天然成为分数 | 原作有射击、怪物、危险平台和坠落失败；本项目继承完整运动语义并加入安全托底 |
| [Crayola Create & Play](https://www.crayolacreateandplay.com/) | 面向儿童的开放涂色与创作 App | 不限时、不计分，强调探索和个体表达 | 与当前街机计分/提速循环不同；作为未来创作区，而非本轮第三玩法 |
| [Jetpack Joyride](https://play.google.com/store/apps/details?id=com.halfbrick.jetpackjoyride) | 单触纵向飞行的自动卷轴游戏 | 自动前进、收集和纵向避障形成清晰闭环 | 原作节奏强、无尽且标注 10+；只借鉴抽象控制关系 |
| [Flappy Bird 创作者访谈](https://www.forbes.com/sites/lananhnguyen/2014/02/11/exclusive-flappy-bird-creator-dong-nguyen-says-app-gone-forever-because-it-was-an-addictive-product/) | 单输入穿越纵向障碍 | 证明极少输入和清晰障碍可形成强反馈 | 窄缝、重力下坠、碰撞即死和反复重开明确不进入主线 |

**差异化空间**：本项目不应复制官方布鲁伊小游戏内容，而应验证一个更窄的体验：笔记本浏览器即开即玩、单人优先、三种默认可选玩法、两种手型与掌心位置复用、玩法内逐步提速与本机个人高分、无账号无广告、视频只在本机处理。若未来公开发行，必须切换为原创角色或先取得正式授权。

**Phase 1A 覆盖范围**：`01A-competitor-page-experience.md` 负责把上述参考收敛为“家长设置 → 输入就绪 → 玩法大厅 → 玩法内教学 → 温和无尽得分 → 本机个人结果”的页面与交互结构，并只继承抽象机制，不复制视觉素材。

---

## 用户痛点

**痛点优先级排序**（按频率 × 强度）：

1. **传统控制方式对 5 岁儿童不够自然**
   - 具体表现：“我想直接用身体或手来玩，不想先记住一排按键。”
   - 信息来源：PM 一手目标 + 同类产品定位验证；Nex 和 GoNoodle 都把“动作就是控制器”作为核心价值。
   - 当前解法：家长代操作、使用触摸屏、简化键盘按键或购买体感主机。
   - 解法的不足：家长代操作削弱自主感；触屏不符合横版体感目标；专用主机增加成本和准备门槛。

2. **误识别会把动作游戏迅速变成挫败体验**
   - 具体表现：“我明明做了动作，角色为什么没跳？”
   - 信息来源：技术文档 + 产品推断，尚待真实试玩验证。MediaPipe Web 能实时输出预设手势与手部关键点，但视频识别调用会同步占用 UI 线程，需要节流或移至 Worker。[MediaPipe Web 指南](https://developers.google.com/edge/mediapipe/solutions/vision/gesture_recognizer/web_js)
   - 当前解法：提高识别阈值、要求更标准动作、反复教学。
   - 解法的不足：阈值过高会漏识别，过低会误触；要求孩子做“机器友好”的标准动作会损害自然性。

3. **家长需要放心且低成本地完成摄像头设置**
   - 具体表现：“摄像头拍到什么、会不会上传、拒绝权限后还能不能玩？”
   - 信息来源：浏览器权限要求与儿童隐私规则。浏览器摄像头需要安全上下文并由用户授权；儿童照片、视频和生物识别信息可能属于受保护个人信息。[MDN `getUserMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)、[FTC 儿童隐私说明](https://consumer.ftc.gov/articles/protecting-your-childs-privacy-online)
   - 当前解法：直接弹出浏览器权限框，或用键盘替代。
   - 解法的不足：没有家长说明时容易产生不信任；没有降级控制会让拒绝权限等于无法游玩。

4. **家长希望屏幕活动是主动且可共同参与的**
   - 具体表现：“可以玩屏幕，但最好不是一直坐着看。”
   - 信息来源：外部专业建议与同类产品定位。NAEYC 建议低龄技术体验应主动、动手、赋能儿童并提供适应性支持，且不替代真实世界活动。[NAEYC 儿童发展原则](https://www.naeyc.org/node/3796)
   - 当前解法：观看运动视频、跟跳、家长陪玩或限制屏幕时长。
   - 解法的不足：纯观看缺少因果反馈；复杂游戏又容易让家长成为长期操作员。

---

## 核心假设

如果以下假设不成立，Careful Go 的判断就不成立：

1. **拳掌与二维位置输入可分开成立**：5 岁儿童能完成 `Closed_Fist → Open_Palm` 的离散动作；同时，只要 MediaPipe 仍输出手部关键点，掌心 Y/X 就可持续驱动角色，即使手势类别是 `Unknown`。→ 验证方式：全局输入就绪先确认手部关键点可用；拳掌循环在溪边跳跳的安全教学内验证，掌心上下移动在萤火虫躲躲、左右移动在树梢蹦蹦的安全教学内验证。真实儿童样本阶段再验证拳掌各至少 8/10。
2. **三种玩法可以独立形成重玩循环**：三个入口默认可选；每个玩法都能在自己的安全教学后逐步提速，以收集、越障、距离和连续成功形成个人分数。→ 验证方式：孩子能自主选择任一玩法、理解本玩法唯一控制，并在本轮结束后主动选择“再玩一次”或换玩法；没有跨玩法解锁门槛。
3. **温和失败比无反馈更可理解**：失误必须立刻出现角色反应、伙伴救援、勇气减少、连击重置与短暂无敌；三次失误结束本轮并庆祝已获得分数，而不是无效果、立即死亡或丢失既有奖励。→ 验证方式：孩子能在一次失误后指出发生了什么，并在救援后继续；三次失误后能理解本轮结束且愿意重玩。
4. **三种控制语法可在玩法内理解**：`command_runner` 用拳→掌高跳，`hand_follow_dodge` 用掌心 Y 直接跟手，`auto_bounce_climb` 让角色持续自动弹跳并用掌心 X 对准更高平台；角色到达上方阈值后镜头随高度向上推进。→ 验证方式：每种玩法首次进入先提供 3–5 秒安全教学；孩子能在第一个计分目标前做出对应控制，不新增第三种必需手型。
5. **家长设置可接受**：家长能理解本地处理说明，并在 60 秒内完成摄像头授权和取景。→ 验证方式：用全新浏览器配置走一次家长设置流程；拒绝权限时键盘模式仍可进入全部玩法。

---

## 风险点

1. **儿童手势误识别与输入延迟**
   - 影响：高；它直接决定游戏是否有趣，而不是单纯技术指标。
   - 应对思路：全局输入就绪先确认系统看见手；离散拳掌采用连续帧确认、动作冷却和重新握拳上膛；掌心位置独立使用关键点、死区与平滑，不因类别为 `Unknown` 停止；具体控制在对应玩法的安全教学中验证，并保留键盘降级。

2. **角色/IP 授权边界**
   - 影响：高；Bluey 官方页面明确标注角色和标识受 Ludo Studio/BBC Studios 授权体系保护。
   - 应对思路：当前代码和仓库只使用原创蓝色/橙色小狗占位角色；私人本地替换与公开发行分开管理，未获授权不公开使用官方素材。

3. **浏览器权限与部署环境**
   - 影响：中；`getUserMedia` 需要 HTTPS 或受信任本地环境，权限拒绝会阻断摄像头输入。
   - 应对思路：开发用 localhost，预览部署使用 HTTPS；先展示家长说明，再请求权限；提供重新授权指导和键盘模式。

4. **身体差异、空间和疲劳**
   - 影响：中；孩子的动作幅度、身高、左右手和活动空间不同。
   - 应对思路：优先静态手势而非大幅跳跃；允许坐姿；取景时检查手是否进入画面；每次失误最多三次后自然停点，也可随时暂停或结束本轮。

5. **三种玩法的控制语法切换造成认知负担**
   - 影响：中；即使手型不增加，离散跳跃、纵向跟手和横向对准平台之间仍可能互相干扰。
   - 应对思路：不在玩法大厅之上一次性教学；每个玩法入口只说明“怎么玩”，进入后提供 3–5 秒安全教学和唯一图形提示。第 2 个玩法强调上下跟手，第 3 个玩法强调角色会自己跳、孩子只负责左右移动。

6. **排行榜把儿童体验变成外部竞争**
   - 影响：中；公开昵称、全球名次或跨玩法比较会引入隐私、挫败和不公平输入差异。
   - 应对思路：本轮只在设备内分别保存每种玩法的个人最佳与 Top 5，不收集姓名、不联网、不跨玩法比较。FTC 说明面向 13 岁以下儿童的联网服务若收集或公开个人信息需要额外通知与家长同意，因此全球榜不进入家庭 MVP。[FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)

---

## 建议下一步

**如果 Careful Go**：

- 最需要尽快验证的假设是：5 岁儿童能否从玩法大厅自主选择、在关内理解控制、从可见失误反馈调整时机，并愿意为了自己的分数重玩。
- 建议 MVP 范围：家长说明页、输入就绪页、三玩法大厅、三个关内安全教学、逐步提速的温和无尽循环、三次失误自然停点、设备内个人最佳/Top 5、键盘降级与本地摄像头处理。
- 下游行动：按 `CR-20260814-vertical-camera-climb` 把第三玩法落实为成熟的自动弹跳攀升：角色拥有世界高度与竖直速度，下降落台立即再弹；达到屏幕上方阈值后相机向上追随、平台在屏幕中相对下移；同时保留掌心 X、宽平台和安全云。
- 技术建议：Phaser 负责浏览器 2D 游戏循环；MediaPipe Tasks Vision 负责手势输入；输入层与游戏指令层解耦。Phaser 官方定位即浏览器 2D 游戏并支持 JavaScript/TypeScript。[Phaser 官方说明](https://phaser.io/why-phaser)

**本轮不覆盖的端型 / 后续扩展**：

- `mobile-only` 与 `web-mobile-parallel` 不在本轮范围。
- 手机和平板适配、原生 App、多人、账号、联网/公开排行榜、跨设备同步、超出已授权四种玩法的内容扩展、云端视频分析不进入 04A/04B 默认原型和 QA。
- 公开发行和商业化不属于本轮目标；若方向改变，必须重新评估授权、隐私合规和发布渠道。

---

## 用户任务类型与页面形态启发

| 核心任务 | 对象规模 | 用户需要比较的字段 | 推荐页面形态 | 依据 |
|---|---:|---|---|---|
| 家长完成权限与环境设置 | 1 个设备、1 个摄像头 | 权限状态、取景状态、识别状态、降级入口 | 低密度分步任务流 | 每一步只有一个主决策，需避免儿童误触系统设置 |
| 儿童确认输入已就绪 | 1 个摄像头或键盘通道 | 手是否进入画面、关键点、输入方式、开始游戏 | 全屏输入就绪页 | 不提前教授三种玩法；主 CTA 必须是“开始游戏” |
| 儿童选择玩法 | 3 个默认可用玩法 | 控制方式、个人最佳、最近得分 | 单屏玩法大厅三卡 | 本质是玩法选择，不使用关卡编号、锁态或“完成上一关” |
| 儿童学习并游玩 | 每次 1 个玩法、1 种控制关系 | 当前动作、勇气、分数、速度、即时目标 | 玩法内安全教学 + 全屏横版世界 + 浮动小教练 | 教学只服务当前玩法；世界、障碍与角色共享同一运动语义 |
| 查看本轮结果 | 1 次游玩结果 + 本玩法 Top 5 | 本轮分数、个人最佳、排名、再玩/换玩法 | 单屏庆祝与个人榜 | 只做设备内个人榜，不公开昵称、不跨玩法比较 |

**认可样本 / 参考原型拆解**：

- 可复用结构：Nex/GoNoodle 的“无需控制器、身体动作直接驱动结果”；Bluey 官方体感游戏的家庭共同参与与情境化；Doodle Jump 的自动弹跳 + 横向对准平台 + 上升镜头追随；Jetpack Joyride 的少输入与渐进循环。
- 可复用交互：玩法选择、关内动作示范、拳掌边沿触发、掌心位置直接跟手、逐步提速、即时世界反馈、个人高分重玩、家长辅助角色。
- 可复用字段模型：输入状态、动作冷却、当前角色、勇气、世界速度、距离、收集数、本轮分数、个人最佳、设备内 Top 5、摄像头/键盘模式。
- 不可丢失点：本地处理说明、降级入口、取景可见性、可理解的失败反馈、短自然停点与随时退出。
- 不适合照搬点：专用主机前提、完整身体大动作、官方角色素材、订阅与付费门槛、复杂小游戏合集。

---

## 信息来源

**一手信息**：

- E-001：PM 原始目标——为 5 岁儿童设计手势控制、收集、避障和角色切换的横版游戏。
- E-002：PM 已确认首版 `web-only`、笔记本摄像头优先、原创占位素材。

**搜索信息**：

- E-003：[Bluey: Bust-a-Move 官方介绍](https://www.bluey.tv/blog/bluey-bust-a-move-bounces-onto-nex-playground/)——布鲁伊体感家庭小游戏的直接品类验证与授权标识。
- E-004：[Nex Playground 官方页面](https://www.nexplayground.com/home-kids)——5 岁以上、无控制器、家庭多人、儿童隐私和体感产品定位。
- E-005：[GoNoodle Games 官方页面](https://www.gonoodle.com/company/games)——跳、蹲、躲等动作控制与无需额外硬件的移动游戏形态。
- E-006：[Bluey: Let’s Play 官方介绍](https://www.bluey.tv/blog/bluey-lets-play-mobile-app-is-available-now/)——低龄角色探索、房间互动和角色内容形态。
- E-007：[NAEYC 儿童发展原则](https://www.naeyc.org/node/3796)——主动、动手、赋能和适应性支持的低龄技术体验原则。
- E-008：[MediaPipe Gesture Recognizer for Web](https://developers.google.com/edge/mediapipe/solutions/vision/gesture_recognizer/web_js)——实时预设手势、手部关键点与主线程阻塞风险。
- E-009：[MDN `getUserMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)——摄像头安全上下文和用户授权要求。
- E-010：[FTC 儿童隐私说明](https://consumer.ftc.gov/articles/protecting-your-childs-privacy-online)——儿童照片、视频和生物识别信息的隐私边界。
- E-011：[Phaser 官方说明](https://phaser.io/why-phaser)——浏览器 2D 游戏与 JavaScript/TypeScript 技术适配。
- E-012：[MediaPipe Gesture Recognizer](https://developers.google.com/edge/mediapipe/solutions/vision/gesture_recognizer)——实时返回手势类别、左右手以及图像/世界坐标关键点，支持把位置控制与分类结果解耦。
- E-013：[Doodle Jump 官方 App Store 页面](https://apps.apple.com/us/app/doodle-jump-insanely-good/id456355158)——4+ 自动弹跳平台玩法、左右倾斜控制、向上推进、高度成绩与个人榜机制。
- E-014：[Jetpack Joyride 官方 Google Play 页面](https://play.google.com/store/apps/details?id=com.halfbrick.jetpackjoyride)——自动前进、纵向飞行、收集/躲避和单触控制。
- E-015：[Flappy Bird 创作者访谈](https://www.forbes.com/sites/lananhnguyen/2014/02/11/exclusive-flappy-bird-creator-dong-nguyen-says-app-gone-forever-because-it-was-an-addictive-product/)——窄通道、碰撞即死和高失败循环，作为明确负面边界。
- E-016：[Nex Playground 低龄游戏指南](https://www.nexplayground.com/en-ie/blog/the-ultimate-nex-playground-game-guide)——3–5 岁应采用大动作、清楚提示、即时反馈和低压力体验。
- E-017：[Frontiers Liberi 儿童 exergame 研究](https://www.frontiersin.org/journals/virtual-reality/articles/10.3389/frvir.2022.817303/full)——一个动作键按情境解释、输入平滑、失败可见但少重复；研究对象并非典型 5 岁儿童，只作为设计原则参考。
- E-018：[FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)——儿童联网服务收集或公开可识别信息需要额外家长通知/同意，支持本轮只做无昵称、无联网的设备内个人榜。
- E-019：[Crayola Create & Play 官方页面](https://www.crayolacreateandplay.com/)——涂色/描摹等创作活动采用不限时、不计分的开放探索边界。

---

## PM Review Slice

- 本阶段关键决策：
  - `Careful Go`：推进家庭 MVP，并以三种默认可选、可重复得分的玩法验证不同控制关系；Target Surface 继续为已确认的 `web-only`。
  - 三玩法源真相为：`command_runner` 拳→掌高跳；`hand_follow_dodge` 掌心 Y 直接跟手；`auto_bounce_climb` 自动弹跳并用掌心 X 对准宽平台。两种连续玩法在 `Unknown` 但关键点有效时仍跟手，三者均在玩法内教学并逐步提速。
  - 每轮有 3 点勇气；失误必须可见、可解释并自动救援，第三次失误结束本轮。设备内分别保存每种玩法的个人最佳与 Top 5。
  - 核心任务形态是“家长分步设置 + 输入就绪 + 儿童玩法大厅 + 关内教学 + 无尽得分任务流”。
- 被放弃的方案：
  - 暂不做移动端并行、专用硬件、全身大动作、超出已授权四种玩法的内容扩展、账号/联网公开榜和公开发行。
  - 不采用经典 Flappy 式单次碰撞即死、窄缝或高频失败重开；不采用逐关新增 `Pointing_Up` / `Victory` 的方案。
  - 不复制 `Bluey: Bust-a-Move` 的官方小游戏、视觉或角色素材。
- 需要 PM 确认的问题：
  - 无。本轮用户已明确要求三玩法默认解锁、本质改为玩法选择、教学下沉到玩法、玩法内递进与计分；本机 Top 5 是不扩大隐私边界的推荐默认。
- 不需要 PM 审查的执行细节：
  - 搜索来源整理、框架安装方式、具体置信度参数与 Worker 实现细节。
- 进入下一阶段的条件：
  - 已满足：PM 已确认方向，`CR-20260814-proven-bounce-mode` 已同步 Phase 1A 至 04B；下一步等待 PM 试玩新基线。
