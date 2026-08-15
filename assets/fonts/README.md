# 本地字体资产

本目录中的字体由 `04B-prototype-手势小狗探险MVP.html` 通过本地 `@font-face` 加载。下载或复制整个项目后无需安装系统字体，也不依赖 CDN。

## 字体映射

| 项目字族 | 文件 | 用途 | 上游版本 | 许可证 |
|---|---|---|---|---|
| `Little Tail Xiaolai` | `xiaolai/Xiaolai-Regular-subset.woff2` | 游戏标题、关卡名、庆祝短句 | Xiaolai v3.126 | SIL OFL 1.1；见 `xiaolai/OFL.txt` |
| `Little Tail Rounded` | `resource-han-rounded/ResourceHanRoundedCN-VF-subset.woff2` | 按钮、提示、状态、正文和家长内容 | Resource Han Rounded v1.910 CN Variable | SIL OFL 1.1；见 `resource-han-rounded/OFL.txt` |

## 来源

- Xiaolai：https://github.com/lxgw/kose-font/releases/tag/v3.126
- Resource Han Rounded：https://github.com/CyanoHao/Resource-Han-Rounded/releases/tag/v1.910

## 子集说明

- 两个 WOFF2 均从上述官方发布字体生成，只保留当前集成式 04B HTML 使用到的字符与排版特性。
- Resource Han Rounded 继续保留 `wght`（200–900）和 `ROND` 两个可变轴；页面固定使用完整圆角 `ROND=100`。
- 构建工具：FontTools 4.60.2 + Brotli 1.2.0。
- 若后续增加新的可见文案，应重新从官方源字体生成子集，并运行字体加载与字符覆盖检查；即使遗漏字符，CSS 仍会回退到系统中文字体，不会显示空白方框。
- 再分发这些字体资产时必须保留各自的 `OFL.txt`。
