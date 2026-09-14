# dsh-danmaku

给 DeepSeek Harness（`dsh`）Web 对话区叠加 **B 站风格弹幕** 的插件。

围观 agent 工作：用户消息、回复完成、工具调用、任务完成时，预设弹幕（可选 LLM 生成）横向飘过对话区。

## 功能

| 模块 | 说明 |
|---|---|
| 覆盖层 | 挂 `shell.overlay`，DOM 渲染 + 轨道防碰撞，同屏上限可配 |
| 预设包 | 通用 / 编程 / 闲聊，事件触发抽样，会话内防复读 |
| LLM（可选） | interval 唤醒 + 全局节流，失败静默降级预设 |
| 交互 | 悬停暂停、点击详情（复制/屏蔽/删除）、防遮挡、手发弹幕、快捷控制 |
| 设置 | 设置 → 插件 → 插件配置 →「弹幕 Danmaku」卡片；也走 `/api/danmaku/config` |

## 安装

```bash
dsh plugin --profile web add ./dsh-danmaku
```

重启 `dsh web` 后打开 `http://127.0.0.1:3080`。

> bundle 自带 `cordis.patch.yml` 自我激活，**不要**再在 profile 的 patch 里重复 insert。

## 配置要点

- `enabled`：总开关
- `areaRatio`：弹幕层高度比例（1/4 · 1/2 · 3/4 · 全高）
- `presetPack`：`general` / `coding` / `casual`
- `llmEnabled`：开启后按 `llmIntervalSec` 生成吐槽弹幕；失败自动预设
- `blockedWords`：命中不上屏

Host 路由：

- `GET/POST /api/danmaku/config`
- `GET /api/danmaku/triggers?since=`
- `POST /api/danmaku/preset-sample`
- `POST /api/danmaku/generate`
- `GET /api/danmaku/health`

## 测试

```bash
node --test dsh-danmaku/tests/
```

## 架构说明

- Host `lib/index.js`：settings 命名空间 `danmaku`、`session/event` 触发环、HTTP 路由、可选 LLM
- Client `lib/client.js`：`shell.overlay` 覆盖层 + `settings.plugin.item` 卡片 + DOM 渲染器
- 共享 `lib/presets.js`：预设包、抽样、轨道碰撞纯函数

渲染器接口对齐 `参考文档/danmaku-renderer-design.md`，首版为 L5 DOM；后续可替换为 WebGL2 / Worker+GPU 而不改业务层。

主要适配 **Chromium**（Edge / Chrome）。

## License

MIT
