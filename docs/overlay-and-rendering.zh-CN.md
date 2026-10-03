# 覆盖层与渲染

[English](./overlay-and-rendering.md) | [中文](./overlay-and-rendering.zh-CN.md)


弹幕层如何挂载到页面、渲染评论、避免碰撞、不挡正文，以及未来可升级的 GPU 后端。

## 挂载点

插件挂入宿主提供的 **`shell.overlay`** 插槽——一个绝对定位、`pointer-events:none` 的层（`inset:0; z-index:20`），位于对话内容之上。

客户端通过 `ResizeObserver` + `getBoundingClientRect` 观测**中心对话列**（优先匹配 `[data-shell-overlay]` 兄弟布局 / center 列），把弹幕层裁剪到该列内，浮动评论不会溢出到侧栏。回退方案：铺满整个 viewport 且 `pointer-events:none`，仅单条弹幕条捕获 `auto` 指针事件——侧栏点击不受影响。

## 窗口尺寸变化（resize）

宿主对话列尺寸变化时显示区会重新测量：`ResizeObserver` 观测覆盖层宿主，另加一个 `window` resize 兜底——仅在宿主元素瞬时未布局（宽度为 0 或非法）时接管。兜底是**裁剪感知**的：尺寸由 `innerWidth * displayArea.w` 与 `(innerHeight - titlebarInset()) * displayArea.h` 推导，而不是裸视口——否则 50% 显示区裁剪会被放大成整屏，弹幕飞出裁剪框。

resize 触发在同一帧内合并为一次，且幂等：尺寸与当前一致的 resize 什么也不做，避免无变化的 resize 清掉轨道布局或重建 GPU 后备缓冲。

**已在屏的弹幕不会被重算。** 正在飞的弹幕沿用生成时的坐标与时长飞完；只有此后新生成的弹幕才用新尺寸。飞行途中不重算、不迁移、不清空。

会话中途 `devicePixelRatio` 变化（窗口拖到不同 DPI 的显示器、或浏览器缩放）会重新应用 GPU 后备缓冲，画布继续与 CSS 尺寸对齐，不会模糊或比例偏差。三个后端行为一致。

## 布局类型

每条弹幕按权重抽样为三种布局之一：

| 布局 | 行为 | 配置权重 |
|---|---|---|
| **滚动 (roll)** | 从右向左横穿，多轨道 | `layoutWeights.roll`（默认 80） |
| **顶部 (top)** | 固定顶部边缘，全高，定时退出 | `layoutWeights.top`（默认 10） |
| **底部 (bottom)** | 固定底部边缘，定时退出 | `layoutWeights.bottom`（默认 10） |

> [!TIP]
> `areaRatio`（0.25–1.0）**只限制滚动轨高度**；顶/底弹幕始终贴全高边缘，对齐 B 站行为。

## 轨道防碰撞

滚动弹幕共享至多 `MAX_TRACKS`（16）条横向轨道。入场前检查该轨上一条是否已左移到留出新弹幕+间距的位置。检查函数 `canEnterTrack()`（`lib/presets.js`）使用 B 站式间隔时间公式：

```
gapSec ≈ (上条宽 + 新条宽 + 间距) / 上条速度
```

若所有轨道都没空位，该条被丢弃（下一 tick 重试）——这正是密集时段评论变少而非重叠的原因。顶/底布局各自堆叠，受同屏上限约束。

## 防遮挡

阅读对话区不应被文字墙挡住。两个旋钮配合：

- **`opacity`**（0.1–1.0）：覆盖层"活跃"时（近期有触发 / 悬停）的满亮度。
- **`opacityIdle`**（0–0.8）：空闲时的暗淡亮度。`antiOcclude: true`（默认）时，活动平息后覆盖层渐变到 `opacityIdle`，新触发或悬停时亮回来——阅读时弹幕在场但安静。

## 性能策略（DOM 后端）

**DOM 后端是视觉与行为基准**，采用：

- `transform: translate3d(...)` GPU 合成运动（无布局抖动）
- `maxOnscreen`（默认 40）硬上限同屏节点，超出回收
- 页面 `visibilitychange` → `hidden` 暂停所有动画（离屏不烧 CPU）
- 节点数量有界——长会话无 DOM 无限增长

主要面向 **Chromium**（Edge / Chrome）。其他引擎可渲染但未调优。

两个 GPU 后端复用同一套业务逻辑（生成、碰撞、暂停、配置），只替换绘制层，因此 DOM 后端仍是观感基准。

## 渲染后端链

`renderBackend` 接受 `auto | dom | webgl2 | webgl2-main | webgl2-worker`。**三个后端均已实现**——DOM、主线程 WebGL2、Worker 驱动 WebGL2（OffscreenCanvas）。

| 后端 | 状态 | 说明 |
|---|---|---|
| `dom` | 已实现 | `translate3d` DOM 节点；原生悬停暂停与点击 |
| `webgl2` | 已实现 | 主线程 WebGL2 instanced quads（L2） |
| `webgl2-worker` | 已实现 | Offscreen canvas + Worker 驱动 instanced 渲染（L1） |

`auto` 链按失败逐级降级。**浏览器**为 **Worker → 主线程 → DOM**；**桌面端（Electron 壳）**跳过 Worker（自定义协议下 Worker 脚本加载风险最高），走 **主线程 WebGL2 → DOM**。两端均可手动选择任意后端，`auto` 只影响自动选择。

`webgl2-main` 是**内部配置别名**：它会被接受并处理（作为合法配置解析、路由到主线程 WebGL2 渲染器、并被 `auto` 链用作中间回退），但**不在设置下拉框中列出**——UI 只列 `auto / dom / webgl2 / webgl2-worker`。需要显式固定主线程渲染器时，可在配置文件或 HTTP 补丁里使用它。

### GPU 已知能力差异（文档化限制）

GPU 后端尚未在所有方面与 DOM 达到观感一致。以下是文档化限制，不是待办功能：

| 能力 | 在 GPU 后端（`webgl2`、`webgl2-worker`） |
|---|---|
| **advanced** 样式（rain / pop / rotate / scale / bold） | 仅 DOM。GPU 后端整体丢弃高级样式。 |
| **emoji** 图片 | 仅 DOM。GPU 后端只用 `filterEmoji` 过滤掉文本里的 emoji 字符，从不绘制 emoji 图片。 |
| `reverse` 轨道 | 两个 GPU 后端都把 `reverse` 重映射为 `roll`。GPU 渲染器没有反向轨道；标记为 `reverse` 的弹幕按普通滚动弹幕播放。 |

其余能力（滚动 / 顶 / 底布局、颜色权重、描边、同屏上限、暂停语义）在各后端行为一致。

升级路径遵循 `参考文档/danmaku-renderer-design.md`（§11 降级链）——业务层不改，仅替换渲染器实现。

## 相关配置

| 字段 | 默认 | 范围 | 作用 |
|---|---|---|---|
| `opacity` | 0.85 | 0.1–1.0 | 活跃亮度 |
| `opacityIdle` | 0.15 | 0–0.8 | 空闲（阅读）亮度 |
| `antiOcclude` | true | 布尔 | 平息时渐暗 |
| `maxOnscreen` | 40 | 1–200 | 同屏 DOM 节点硬上限 |
| `fontSize` | 16 | 12–36 | px |
| `crossSec` | 8 | 3–20 | 滚动弹幕穿屏秒数 |
| `scrollSpeed` | 140 | 40–400 | px/s（覆盖 crossSec 推导值） |
| `areaRatio` | 0.5 | 0.25–1.0 | 滚动轨高度比例 |
| `layoutWeights` | 80/10/10 | 各 0–100 | 滚/顶/底生成权重 |
| `stroke` | true | 布尔 | 白色描边提升可读性 |
| `renderBackend` | auto | auto/dom/webgl2/webgl2-main/webgl2-worker | 渲染器选择（`webgl2-main` 为内部别名，不在下拉框）；`auto` 按客户端自适应 |

完整字段见 [configuration.md](configuration.md)。
