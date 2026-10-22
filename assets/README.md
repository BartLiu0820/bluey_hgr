# Asset retention policy

本目录区分“游戏运行依赖”与“生成/审查源文件”。标识只说明用途和保留策略，不代表授权状态，也不改变当前 HTML 的加载路径。

| 标识 | 含义 | 当前处理 |
|---|---|---|
| `runtime-required` | HTML、运行时或本地字体/模型直接需要 | 必须随可试玩项目保留 |
| `authoring-source-keep` | 不参与运行，但可用于重新生成、拆帧、质量追溯或风格复现 | 用户已确认暂时保留；生产部署可排除 |
| `license-review` | 参考衍生或需要在公开/商业发布前复核权利 | 保留不等于取得发行授权 |
| `generated-qa-ignore` | 测试可重新生成的截图和报告 | 不进入 Git，由 `.gitignore` 排除 `qa/` 与 `prototype-qa/` |

## 当前分类

- 角色运行文件：`characters/character-roster.json`、每个动作的四张编号 PNG。
- 角色生成源：`raw-sheet*.png`、`sheet-transparent.png`、GIF、prompt、pipeline/QC 元数据、比例配置和参考图。
- 地图、物件和 UI 生成源：所有 `raw/` 目录、带 `raw` / `magenta` 的母图、生成提示和 pipeline 元数据。
- 运行时地图、物件和 UI：MVP HTML、manifest 或数据清单引用的最终 PNG。
- 音频、字体和手势模型：当前均为运行依赖；许可证与 manifest 一并保留。

机器可读 glob 与说明位于 `asset-retention.json`。若未来制作只包含运行文件的发布包，应按该清单排除 `authoring-source-keep`，不要直接从项目源仓库删除。

## 运行时图片压缩

集成式 MVP 与火线冲击使用同目录 `.webp` 副本；PNG 保留作为生成源和历史预览依赖。`runtime-images.json` 为交付清单，`runtime-images.js` 为浏览器资源组输入。

- 重建：`npm run assets:build-images`（Python 3 + Pillow/WebP）。
- 策略：quality 85、method 6；保持原图尺寸、透明通道和锚点，无裁切或缩放。
- 当前234张交付图片：33,910,892 → 2,726,168 字节，减少92.0%。
- 初始只准备公共UI、地图缩略图、六角色idle；角色确认与玩法选择按需准备其余图片。音频按播放需要读取，识别模型仍只在启用摄像头后加载。
- 验证：`npm run qa:loading`。性能对比基线为提交 `1e53896`，可通过 `LOADING_BASELINE_REF` 指定其他旧版本。
