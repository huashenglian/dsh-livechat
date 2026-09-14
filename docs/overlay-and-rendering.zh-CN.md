# 覆盖层与渲染

[English](./overlay-and-rendering.md) | [中文](./overlay-and-rendering.zh-CN.md)


弹幕层如何挂载到页面、渲染评论、避免碰撞、不挡正文，以及未来可升级的 GPU 后端。

## 挂载点

插件挂入宿主提供的 **`shell.overlay`** 插槽——一个绝对定位、`pointer-events:none` 的层（`inset:0; z-index:20`），位于对话内容之上。

客户端通过 `ResizeObserver` + `getBoundingClientRect` 观测**中心对话列**（优先匹配 `[data-shell-overlay]` 兄弟布局 / center 列），把弹幕层裁剪到该列内，浮动评论不会溢出到侧栏。回退方案：铺满整个 viewport 且 `pointer-events:none`，仅单条弹幕条捕获 `auto` 指针事件——侧栏点击不受影响。

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

## 性能策略（L5 DOM）

首版发布 **DOM 后端**：

- `transform: translate3d(...)` GPU 合成运动（无布局抖动）
- `maxOnscreen`（默认 40）硬上限同屏节点，超出回收
- 页面 `visibilitychange` → `hidden` 暂停所有动画（离屏不烧 CPU）
- 节点数量有界——长会话无 DOM 无限增长

主要面向 **Chromium**（Edge / Chrome）。其他引擎可渲染但未调优。

## 渲染后端链（架构预留）

`renderBackend` 接受 `auto | dom | webgl2 | webgl2-main | webgl2-worker`。当前仅实现 `dom`（`auto` → `dom`）；接口已塑形，后续可平滑替换为：

| 后端 | 计划 |
|---|---|
| `webgl2` | 主线程 WebGL2 instanced quads（L2） |
| `webgl2-worker` | Offscreen canvas + Worker 驱动 instanced 渲染（L1） |

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
| `renderBackend` | dom | auto/dom/webgl2/webgl2-worker | 渲染器选择 |

完整字段见 [configuration.md](configuration.md)。
