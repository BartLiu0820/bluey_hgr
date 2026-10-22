# 火线冲击素材包

2026-09-05 · 图片已接入火线冲击首版 · 实际体验待 PM 审看 · 专属音效待补

打开 `preview.html` 查看全部素材、浅/深背景、64–160px 图标与两组可逐帧/半速播放的动画。静态总览为 `contact-sheet.png`，原尺寸检查为 `small-size-review.png` 和 `frames-review.png`。

## 当前接入

运行时wire-loop-renderer.mjs/UI消费正式材质、图片和attachment锚点；探头母版仅参考。五视口和合成输入链路已验证，实摄与儿童试玩未验证。专属蜂鸣缺项明确复用旧sfx_collision_soft。下方2026-08-31生成检查记录仅描述美术生产，不替代当前游戏验收；当前实现交接见根目录火线冲击-开发日志与交接.md。

## 交付范围

- 13 项图片任务：11 项静态图/材质，2 组四帧动画；共 19 张主导出 PNG。
- 全部原图由内置 image_gen 生成。接触短闪修色一次，共实际调用 14 次，首版原图仍保留。
- 17 张透明 RGBA 主导出、2 张 RGB 金属贴图。运行时图片合计 1,150,033 bytes（约 1.15 MB，不含仅供参考的探头母版、原图、预览图与 GIF）。
- 当前未生成 WL-S01 碰线蜂鸣：未发现可用音效工具或 ELEVENLABS_API_KEY。提示词已保存于 `wire-contact-soft/prompt-used.txt`，不存在冒充新音效的 MP3。
- 花园背景、六角色、公共 UI 与旧音频仍复用；不生产 P1 背景/BGM/六套新角色动作。

## 文件与接入

| 项目 | 正式导出 | 使用边界 |
|---|---|---|
| 探头母版 | `probe-master/appearance.png` | 仅外观参考；不能整张当连续转腕探头 |
| 银蓝/暖金材质 | `wire-metal-strip/material.png`、`probe-metal-strip/material.png` | 1024×128，sRGB；内区原尺寸裁取并镜像拼接；由几何网格承载 |
| 握柄 | `handle-stem/handle-stem.png` | 顶部连接点见 `attachment.json`，杆身不参与碰线 |
| 起终点 | `start-dock/start-dock.png`、`finish-dock/finish-dock.png` | 相同源裁框、缩放和基线；连接点见各自 `attachment.json` |
| 计时牌 | `timer-plaque/timer-plaque.png` | 640×320 含透明留白，不拉伸；文字区见 `content-insets.json` |
| 入口图标 | `mode-icon/mode-icon.png` | 仅玩法卡展示，不承担碰撞 |
| 三种手势 | `fist-move`、`wrist-tilt`、`release-hand` 下同名 PNG | 512px 导出；建议实际显示 96–128px，64px 已检查 |
| 接触短闪 | `contact-flash/processed/contact-1.png` 至 `contact-4.png` | 每帧70ms，共280ms，单次播放后隐藏 |
| 成功星光 | `finish-sparkles/processed/finish-1.png` 至 `finish-4.png` | 每帧110ms，共440ms，单次播放后隐藏 |

每组动画的 `animation.json` 为播放合同，`loop=false`，共享原点 `[128,128]`。所有帧使用同一个0.4倍比例，按原图主闪光/主星标注位置平移，不按粒子包围盒单独缩放。标注误差预算约原图3px，接入时仍需观察真实接触点是否对齐。GIF 的循环仅用于审图，不是游戏播放策略。

`asset-manifest.json` 为素材入口；`pipeline-meta.json` 包含尺寸、变换、哈希与像素检查；`generation-request.json` 记录真实工具调用提示词和参考图片；`prompt-used.txt` 与实际调用一致，`brief-prompt.txt` 保留原规划文字。不要把 `processor-qc` 的中间输出当最终文件；最终文件路径以 manifest 为准。

## 检查与限制

- 主导出非空、尺寸正确；透明图四角透明、无边缘裁切，按 RGB 色差检查无明显洋红溢边。探头环孔中心透明。
- 配对支座使用相同变换；材质左右/上下首尾像素最大差均为0；在重复图上人工看过接缝。
- 已人工检查全部原图、总览、64/96/128px 浅/深背景与8帧展开图。短闪v1偏粉与缩放色边已修正。
- 浏览器动态播放未在本轮重新验收；预览页进行了 JS 语法、本地链接与资源检查。GIF 验证了4帧、透明索引和原速/半速时长。不得把这些结果称为正式舞台/儿童试玩通过。
- 连续圆环/火线渲染、几何碰撞、长时间运行、WebGL、摄像头控制和音效试听尚未实施。各锚点与材质仅是接入起点，不是已验证物理合同。
- 未改 01→04B 正式玩法源真相，未修改六角色、旧音频映射、成绩键或待审 L1 参考图。完整开发仍需处理既有工作流工具与阶段门禁。

## 重新导出

在项目根目录运行 `python3 scripts/build-wire-loop-assets.py`，再运行 `python3 scripts/build-wire-loop-review.py`。依赖 Python、Pillow、NumPy 和已安装 generate2dsprite 处理器；源码路径记录在脚本中。单项可加 `--slug contact-flash`。这些脚本仅去底、去色、裁切、对齐、拆帧、贴图镜像和编排审查图，不绘制原始游戏美术。替换 raw-sheet 后需清理该项生成的 raw-sheet-clean 与 processor-qc 缓存再导出；人工审查结果不能自动继承。

## 来源与授权说明

新素材由内置 image_gen 依据本项目已用的花园、木纸面板、图标和手势风格生成。本包保留生成与处理证据，不对第三方参考或整个游戏的公开发行权作新承诺；沿用项目私人本地原型边界。包内未包含六角色资产。
