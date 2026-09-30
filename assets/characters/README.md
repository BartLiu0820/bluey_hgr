# Character asset contract

`character-roster.json` 定义角色名单；当前 HTML 的角色定义和选择卡片与清单同步，并由角色专项检查保证一致。每个角色遵循同一目录和动作契约：

```text
<character-id>/<action>/<action>-1.png ... <action>-4.png
```

动作固定为 `idle`、`run`、`jump`、`hover`、`hurt`、`bump`、`celebrate`。每组同时保留 2×2 原始洋红底图、透明合图、四张 256×256 透明帧、GIF、生成提示与 QC 元数据。

- 角色卡缩略图：使用清单中的 `thumbnail`。
- 游戏内动作：按 `runtimeActionContract` 拼接路径，加载失败时回退到同角色 `idle/idle-1.png`。
- 朝向：素材默认向右；向左移动时由运行时水平翻转。
- 锚点：地面动作统一脚底锚点；`jump`、`hover`、`hurt` 保留动作自身的垂直位移和姿态变化。
- 发布边界：新增角色由用户参考图派生，公开或商业发布前需完成形象授权审查；如不具备授权，应替换为原创角色资产。

当前 Phase 4B 的 CH-01 提供六名角色，依次为布鲁伊、宾果、麦麦、班底特、悠悠、棉棉。棉棉使用 `lilac-girl` 素材目录；六名角色共 42 组、168 帧。`selectedCharacterId` 在同一会话的大厅、三种玩法、救援与成绩页中保持。
