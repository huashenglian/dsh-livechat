<div align="center">

<img src="assets/cover.png" alt="dsh-livechat 封面" width="720" />

# dsh-livechat

[![version](https://img.shields.io/badge/version-0.4.8-blue)](https://github.com/huashenglian/dsh-livechat)
[![license](https://img.shields.io/badge/license-MIT-green)](#许可证)
[![platform](https://img.shields.io/badge/platform-DeepSeek%20Harness-orange)](https://github.com/deepseek-ai)

**给 [DeepSeek Harness](https://github.com/deepseek-ai)（`dsh`）Web 对话区叠加 B 站风格弹幕的插件。**

围观 agent 工作：用户消息、回复完成、工具调用、任务完成时，预设弹幕（可选 LLM 生成）横向飘过对话区——就像看直播一样。

`中文` · [English](./README.en.md)

[安装](#安装) · [功能](#功能) · [模块文档](#模块文档) · [架构](#架构)

</div>

---

## 安装

插件是 **bundle**：自带 `cordis.patch.yml`，自我激活——一条命令，无需手动改 patch。

```bash
# 本地目录安装
dsh plugin --profile web add ./dsh-livechat

# npm 安装（预构建，免 allowBuilds 构建授权）
dsh plugin --profile web add dsh-livechat

# GitHub 安装
dsh plugin --profile web add github:huashenglian/dsh-livechat

# tarball 安装（pnpm pack / npm pack 打包后）
dsh plugin --profile web add ./dsh-livechat-0.2.0.tgz
```

重启 `dsh web` 后打开 <http://127.0.0.1:3080>。弹幕覆盖层与浮动控制球会出现在对话区上方。

> [!NOTE]
> bundle 自带 `cordis.patch.yml` 自我激活（`insert id: livechat`）。**不要**在 profile 的 patch 里重复 insert——二次 insert 启动时会报 `duplicate loader entry id: livechat`。

若还没有 `dsh` CLI，可直接启动 web 服务：

```bash
npx @deepseek-ai/dsh web
```

### 快速健康检查

```bash
curl http://127.0.0.1:3080/api/danmaku/health
# {"ok":true,"name":"dsh-danmaku","version":"0.4.8"}
```

---

## 它做什么

当 agent 发送消息、回复完成、调用工具或完成任务时，一串弹幕飘过对话列——就像看直播。预设包覆盖通用 / 编程 / 闲聊氛围，可选 LLM 按节流生成即时、贴合上下文的吐槽。拖球提供快捷控制；设置卡可调一切。

![弹幕实际演示](assets/danmaku-demo.png)

*agent 工作时弹幕飘过对话区——多轨道、加权配色、右上浮动控制球。*

---

## 功能

| 模块 | 覆盖内容 | 文档 |
|---|---|---|
| **覆盖层与渲染** | `shell.overlay` 挂载、DOM 渲染器、多轨道防碰撞、防遮挡渐隐、渲染后端链 | [overlay-and-rendering.zh-CN.md](docs/overlay-and-rendering.zh-CN.md) |
| **预设包与 LLM** | 三套预设包、事件触发抽样、疲劳去重、可选 LLM 生成（smart/interval/toolcall 唤醒）、风格模板 | [presets-and-llm.zh-CN.md](docs/presets-and-llm.zh-CN.md) |
| **交互** | 拖球、悬停暂停、点击详情（复制/屏蔽/删除）、手发弹幕、热度条、欢迎与任务完成效果 | [interaction.zh-CN.md](docs/interaction.zh-CN.md) |
| **分会话弹幕库** | 分会话 `.jsonl` 弹幕池、历史回放（衰减+点赞加权）、归档/恢复、应用内池编辑器 | [session-pools.zh-CN.md](docs/session-pools.zh-CN.md) |
| **配置与 API** | 设置卡 UI、全部配置字段（默认值+范围）、完整 HTTP API 参考 | [configuration.zh-CN.md](docs/configuration.zh-CN.md) |

### 亮点

- **三种布局**：滚动、顶部固定、底部固定——按权重生成
- **防遮挡**：阅读时覆盖层变暗，热闹时亮起
- **LLM 安全降级**：生成失败→静默降级预设，无报错弹窗
- **分会话记忆**：点赞/回放过的弹幕会重现；删除会话自动清理池
- **Chromium 优先**：为 Edge / Chrome 调优；`translate3d`、页面 `hidden` 暂停、同屏上限
- **暂停不消失**：悬停/详情锁定的弹幕会一直留在画面，直到恢复滚动并离开范围
- **配置不再重置**：每次保存同时写本地镜像（`$DSH_HOME/danmaku-config.json`）与 `settings.yaml` 里的精简 `danmaku:` 段；启动按「镜像 → settings → 默认」解析，重启不会丢配置
- **会话显名称**：弹幕库编辑器用 dsh 的真实会话名标注每个弹幕池，不再是截断的 sessionId

---

## 架构

```
dsh-livechat/
├─ package.json              # dsh.bundle + dsh.client 声明
├─ cordis.patch.yml          # 自激活 bundle 层（insert id: livechat）
├─ lib/
│  ├─ index.js               # Host：settings 命名空间、session/event 触发环、HTTP 路由、可选 LLM
│  ├─ client.js              # Client：shell.overlay 覆盖层 + 设置卡 + DOM 渲染器 + 拖球
│  ├─ presets.js             # 共享：预设包、抽样、轨道碰撞纯函数
│  └─ emoji-lib.js           # 表情库：文件夹、导入（git/zip）、权重、manifest
├─ tests/presets.test.js     # 单元测试（node --test）
├─ docs/                     # 模块文档（英文 *.md / 中文 *.zh-CN.md）
└─ assets/                   # 演示截图与封面图
```

- **Host**（`lib/index.js`）：注册 `danmaku` settings 命名空间，观测 `session/event` 进入触发环形缓冲，提供 config/trigger/LLM/pool HTTP 路由，可选经配置的 LLM 生成弹幕。
- **Client**（`lib/client.js`）：自包含 `window.__ModuleLoader__` 工厂——在 `shell.overlay` 挂载 `pointer-events:none` 覆盖层，DOM 渲染（`translate3d`），驱动拖球、设置卡（`settings.plugin.item`）、池编辑器。
- **共享**（`lib/presets.js`）：预设包、加权抽样、布局/颜色选取、轨道碰撞检查——全为纯函数，有单元测试。

渲染器接口对齐设计文档（`参考文档/danmaku-renderer-design.md`）。首版发布 **L5 DOM** 后端；架构预留平滑升级到 WebGL2 / Worker+WebGL2，业务层不变。

### 测试

```bash
node --test tests/presets.test.js
```

---

## 卸载

```bash
dsh plugin --profile web remove dsh-livechat
```

会移除依赖与 bundle 条目。若服务仍在运行时卸载，会一并清理弹幕库缓存（`~/.dsh/danmaku-pools/`）。也可在「库编辑器」右上角用红色「清空弹幕库」一键删除全部缓存。

---

## 许可证

MIT
