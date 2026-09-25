# 默认礼物素材许可说明 / License notes for bundled gift defaults

本目录下的全部动效素材（`*.svg`）均为本项目**自绘**原创作品：

- 星光迸发 / 爱心弹跳 / 彩带飘落 / 霓虹光晕 / 礼花爆炸
- 统一 512×512 视口、2–4 秒一次性播放、单文件远小于 60KB
- 仅使用 SVG 基础图形、渐变与 CSS/SMIL 动画；**不含任何外部字体、位图或网络引用**

## 许可

与本插件整体一致，采用 **MIT License**（见仓库根 `LICENSE` / `package.json` 的 `license` 字段）。
可自由使用、修改、再分发，无需署名。

## 重要：非第三方素材

这些文件**不是**任何第三方素材库的拷贝，尤其**不来自** B 站 / SVGA-Samples 或任何素材站。
文件名与视觉效果仅作通用动效命名，不含任何第三方商标或受版权保护的图形资源。

## 打包行为

- 这些素材随插件包分发，并由 `lib/gift-lib.js` 的 `ensureSeed()` 在**首次启动**（用户素材库
  `manifest.json` 尚不存在时）复制进用户库，标记 `source: 'builtin'`；此后它们是用户的普通素材。
- 本说明文件（`LICENSE-NOTES.md`）**仅随包分发**：`ensureSeed()` 只复制白名单扩展名
  （`.svg/.svga/.gif/.apng/.webp/.png/.jpg`），因此 `.md` 不会被复制进用户素材库。
