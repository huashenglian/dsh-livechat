window.__ModuleLoader__.load({
	id: 'dsh-livechat',
	factory: (require) => {
		var module = { exports: {} }
		var exports = module.exports
		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
		var React = require('react')

		var STYLES_ID = 'dsh-danmaku-styles'
		var SETTINGS_KEY = 'danmaku'
		var BALL_POS_KEY = 'dsh-danmaku-ball-pos'
		var POLL_MS = 700
		var MAX_TRACKS = 16

		var DEFAULTS = {
			enabled: true,
			opacity: 0.85,
			opacityIdle: 0.15,
			antiOcclude: true,
			maxOnscreen: 40,
			fontSize: 16,
			crossSec: 8,
			scrollSpeed: 140,
			areaRatio: 0.5,
			displayArea: { x: 0, y: 0, w: 1, h: 1 },
			layoutWeights: { roll: 80, top: 10, bottom: 10, reverse: 0 },
			stroke: true,
			hoverPause: true,
			interactive: false,
			presetPack: 'general',
			blockedWords: [],
			stylePrompt: '吐槽风格，短促有力',
			styleMaxChars: 24,
			matchThreshold: 0.35,
			llmEnabled: true,
			llmIntervalSec: 18,
			llmModel: '-',
			llmBurstCount: 5,
			density: 3,
			ambientMinMs: 500,
			ambientMaxMs: 1400,
			maxPoolEntries: 200,
			historyReplayEnabled: true,
			historyReplayMax: 12,
			historyMaxAgeHours: 72,
			halfLifeDays: 7,
			archiveAfterDays: 60,
			restoreMaxAgeHours: 168,
			wakeupType: 'smart',
			wakeupEvents: ['user_message', 'reply_complete'],
			smartMinGapSec: 8,
			intervalOnlyWhenActive: true,
			toolcallFilterMode: 'all',
			toolcallTools: [],
			toolcallOnErrorExtra: true,
			globalMinGapSec: 5,
			backoffEnabled: true,
			backoffBaseSec: 12,
			backoffMaxSec: 60,
			backoffFactor: 1.5,
			backoffResetSec: 6,
			thinkingAsActive: true,
			warningAlwaysWake: true,
			thinkingExcerptChars: 240,
			contextSources: {
				conversation: true,
				thinking: true,
				warning: true,
				usage: true,
				tools: true,
				events: true,
			},
			uniformColor: false,
			color: '#FFFFFF',
			colorWeights: [
				{ color: '#FFFFFF', weight: 40 },
				{ color: '#1a1a1a', weight: 30 },
				{ color: '#89D5FF', weight: 15 },
				{ color: '#FFFF00', weight: 10 },
				{ color: '#FB7299', weight: 5 }
			],
			allowEmoji: true,
			welcomeOnEnter: true,
			taskDoneRain: true,
			toolErrorSc: true,
			showHeat: true,
			debugSource: false,
			debugLogs: false,
			// Gift module (todo 6) — master switch OFF, room id EMPTY by default.
			// Ranges mirror lib/gift-lib.js clampGiftConfig; keep in lockstep.
			giftEnabled: false,
			giftRoomId: '',
			giftTemplate: '{user} 送出了 {gift}',
			giftSenders: [],
			giftBindings: {},
			giftTrigger: { manual: true, random: false, probability: 0.05, minMs: 30000, maxMs: 120000 },
			giftMaxConcurrent: 2,
			giftShowSender: true,
			giftLayout: { roll: 100, top: 0, bottom: 0 },
			giftMaxAssetMB: 8,
			emojiEnabled: false,
			emojiBaseSize: 48,
			emojiTotalProb: 0.15,
			advancedEnabled: false,
			advancedStyles: [
				{ id: 'as_std', name: '常规增强', weight: 3, rotate: 0, scale: 1.05, bold: false, opacity: 1, font: '', durationMs: 4000, mode: 'scroll' },
				{ id: 'as_tilt', name: '轻微倾斜', weight: 1, rotate: -6, scale: 1, bold: false, opacity: 0.95, font: '', durationMs: 4000, mode: 'scroll' },
				{ id: 'as_big', name: '大号强调', weight: 1, rotate: 0, scale: 1.35, bold: true, opacity: 1, font: '', durationMs: 4000, mode: 'scroll' },
				{ id: 'as_rev', name: '逆向滚动', weight: 1, rotate: 0, scale: 1, bold: false, opacity: 1, font: '', durationMs: 4000, mode: 'reverse' },
			],
			styleTemplates: [
				{ id: 'tucao', name: '吐槽', prompt: '吐槽风格，短促有力，偶尔阴阳怪气但友善' },
				{ id: 'praise', name: '称赞', prompt: '夸张称赞，像看到神仙操作的围观群众' },
				{ id: 'cheer', name: '应援', prompt: '热血应援，短句高能，像粉丝打call' },
				{ id: 'science', name: '科普', prompt: '用一两句通俗话点评技术点，有趣不装' },
				{ id: 'repeat', name: '复读机', prompt: '简短重复热梗，像弹幕复读机' }
			],
			renderBackend: 'dom'
		}

		var PRESET_PACKS = {
			general: [
				'前方高能', 'agent 开冲！', '这波稳了', '在写了在写了', '好耶',
				'围观围观', '有点东西', '泪目', '太强了吧', '进度条：▓▓░░',
				'懂王上线', '我直接一个好', '这操作可以', '再快一点', '稳住我们能赢',
				'有手就行（不是）', '这就是实力吗', '弹幕护体', '建议直接上热门', '爷青回'
			],
			coding: [
				'这个 if 有点东西', 'bug 再见', '编译通过！', '测试全绿', '重构狂喜',
				'类型体操大师', '注释好评', '这命名可以', '异步地狱爬出来了', '正则战士',
				'边界条件拿捏', '再写一版就完美', '代码评审通过', '并发好耶', '缓存命中',
				'日志说清楚了', '单测补上了', '文档齐全', '依赖已锁定', '一次过'
			],
			casual: [
				'摸鱼围观中', '泡面已就位', '咖啡续命中', '老板看不见我', '午休快乐',
				'今天也是元气满满', '卷起来了', '躺平看 agent 干活', '好耶，准时下班', '再来亿遍',
				'绝绝子', 'awsl', '爷的青春回来了', '有被笑到', '建议循环播放'
			]
		}

		var DICTS = {
			zh: {
				tabLabel: '弹幕 Live',
				cardTitle: '弹幕 Live Chat',
				cardDesc: '把对话区当成直播间：预设与 LLM 弹幕持续飘过，围观 agent 工作。修改后点击保存生效。',
				enabled: '启用弹幕',
				opacity: '透明度',
				opacityIdle: '防遮挡透明度',
				antiOcclude: '防遮挡模式（阅读时变淡）',
				maxOnscreen: '同屏上限',
				fontSize: '字号',
				crossSec: '穿屏秒数',
				scrollSpeed: '滚动速度 (px/s)',
				areaRatio: '滚动显示区域',
			areaEditor: '显示区域编辑器',
			areaEditorHint: '拖动圆点调整弹幕显示区域 · 回车 应用 · Esc 取消 · Shift+Z 撤销 · Shift+Ctrl+Z 重做',
			interactive: '弹幕交互（悬停暂停/点击详情）',
				layoutRoll: '滚动 %',
				layoutTop: '顶部 %',
				layoutBottom: '底部 %',
				stroke: '白色描边',
				hoverPause: '悬停暂停',
				presetPack: '预设包',
				editPresets: '编辑…',
				presetsTitle: '预设包编辑',
				presetsNewPack: '新建包',
				presetsPackName: '包名称',
				presetsLines: '弹幕（一行一条）',
				presetsDeletePack: '删除此包',
				presetsSave: '保存',
				presetsAddLine: '追加一行',
				emojiEnabled: '表情包弹幕',
				emojiBaseSize: '表情包基础大小 (px)',
				emojiTotalProb: '表情包出现总概率',
				emojiEdit: '编辑表情包…',
				advancedEnabled: '高级弹幕',
				advancedHint: '逆向滚动 + 样式增强（旋转/缩放/粗体/透明度）',
				layoutReverse: '逆向 %',
				reverseEnabled: '逆向滚动',
				advMore: '更多',
				advFont: '字体',
				advDuration: '时长ms',
				advMode: '模式',
				advModeScroll: '滚动',
				advModeRain: '雨落',
				advModePop: '定点缩放',
				advModeReverse: '逆向滚动',
				advXPct: 'X%',
				advYPct: 'Y%',
				advStyles: '高级样式库',
				advName: '名称',
				advWeight: '权重',
				advRotate: '旋转°',
				advScale: '缩放',
				advBold: '粗体',
				advOpacity: '透明度',
				advAdd: '新增',
				advDel: '删除',
				emojiTitle: '表情包库',
				emojiImport: '导入图片…',
				emojiWeight: '条件权重',
				emojiDelete: '删除',
				emojiEmpty: '暂无表情包，请导入',
				emojiHint: '最终 P(i)=总概率×(权重_i/Σ权重)',
				blockedWords: '屏蔽词（逗号分隔）',
				ambient: '氛围弹幕间隔 (s)',
				maxPoolEntries: '会话弹幕条目上限',
				historyReplayMax: '进入会话时回放条数',
				historyReplayEnabled: '启用历史回放',
				halfLifeDays: '半衰期（天）',
				archiveAfterDays: '归档天数',
				colorWeightsBtn: '编辑颜色分布…',
				colorWeightsTitle: '颜色分布编辑',
				colorWeightsHint: '权重越高越常出现；保存后立即生效',
				poolStats: '弹幕库',
				poolLive: '活跃',
				poolArchived: '归档',
				preview: '预览',
				renderBackend: '渲染后端',
				backendAuto: '自动',
				backendDom: 'DOM',
				backendWebgl2: 'WebGL2 主线程',
				backendWebgl2Worker: 'WebGL2 Worker',
				wakeupType: 'LLM 唤醒模式',
				wakeupSmart: '智能（事件）',
				wakeupInterval: '定时',
				wakeupToolcall: '工具调用',
				wakeupEvents: '智能唤醒事件（逗号分隔）',
				smartMinGapSec: '智能最小间隔 (s)',
				globalMinGapSec: '全局最小间隔 (s)',
				toolcallFilterMode: '工具过滤',
				toolcallTools: '工具名列表（逗号分隔）',
				toolcallOnErrorExtra: '工具失败追加吐槽',
				uniformColor: '统一颜色',
				color: '统一颜色值',
				allowEmoji: '允许 Emoji',
				welcomeOnEnter: '进入会话欢迎弹幕',
				taskDoneRain: '任务完成弹幕雨',
				toolErrorSc: '工具报错醒目条',
				showHeat: '显示高能进度条',
				debugSource: '调式：弹幕类型图标',
				debugNote: '在弹幕前加 📺预设 / 🤖AI / 💬用户 标记',
				debugLogs: '调式：终端 LLM 日志',
				debugLogsNote: '开启后才在服务端终端打印 llm call / llm raw 等日志',
				restoreMaxAgeHours: '归档可恢复窗口',
				openPoolEditor: '打开库编辑器…',
				poolEditorTitle: '弹幕库编辑器',
				poolSessions: '会话',
				poolScopeLive: '活跃',
				poolScopeArchive: '归档',
				poolContent: '内容',
				poolSource: '来源',
				poolWeight: '权重',
				poolTime: '时间',
				poolRestore: '恢复',
				poolTooOld: '过旧不可恢复',
				poolDelete: '删除',
				poolSaveRow: '保存',
				poolEmpty: '暂无条目',
				poolReload: '刷新',
				poolRestored: '已恢复',
				poolRestoreFail: '恢复失败',
				poolClearAll: '清空弹幕库',
				poolClearConfirmTitle: '确认清空',
				poolClearConfirm: '将删除全部会话的弹幕库缓存（含归档），此操作不可恢复。确定继续？',
				poolClearOk: '确定清空',
				poolClearCancel: '取消',
				poolCleared: '已清空',
				poolClearFail: '清空失败',
				styleTemplates: '风格模板',
				filterAll: '全部',
				filterWhitelist: '白名单',
				filterBlacklist: '黑名单',
				stylePrompt: 'LLM 风格提示词',
				styleMaxChars: '单条字数上限',
				matchThreshold: '上下文匹配阈值',
				llmEnabled: '启用 LLM 弹幕',
				llmIntervalSec: 'LLM 刷新间隔（秒）',
				llmModel: 'LLM 模型（provider/model）',
				llmNone: '不使用 LLM（默认）',
				llmBurstCount: '每次生成条数',
				secWakeAdv: '唤醒高级（退避等）',
				secCtxSrc: '可读数据源',
				backoffEnabled: '启用静默退避',
				backoffBaseSec: '退避起始（秒）',
				backoffMaxSec: '退避上限（秒）',
				backoffFactor: '退避倍率',
				backoffResetSec: '活跃重置阈值（秒）',
				thinkingAsActive: '思考中视为活跃',
				warningAlwaysWake: '警告始终唤醒',
				thinkingExcerptChars: '思考片段字数',
				ctxConversation: '对话摘要',
				ctxThinking: '思考片段',
				ctxWarning: '警告/截断',
				ctxUsage: 'Token/统计',
				ctxTools: '工具调用名',
				ctxEvents: '事件类型',
				collapseHint: '点标题展开/收起',
				density: '弹幕密度（1–5）',
				save: '保存',
				saving: '保存中…',
				saved: '已保存',
				savedNoDisk: '已保存到内存，但写入磁盘失败（dsh 重启后会丢失）',
				saveFail: '保存失败',
				quickTitle: '弹幕快捷控制',
				openFullSettings: '打开完整设置',
				undo: '撤销',
				undone: '已撤销',
				nothingToUndo: '无未保存修改',
				modalBasics: '基础',
				modalContent: '内容与特效',
				modalLlm: 'LLM 与唤醒',
				modalPool: '弹幕库',
				modalGift: '礼物',
				modalRender: '渲染',
				secBasics: '基础',
				secContent: '内容',
				secFx: '颜色与特效',
				secLlm: 'LLM',
				secRender: '渲染',
				secDebug: '调式',
				secGift: '礼物',
				giftMaster: '启用礼物特效',
				giftIntro: '绑定礼物与素材后，观众按事件送出礼物特效与提示弹幕；总开关默认关闭。',
				giftOpenConfig: '打开礼物配置…',
				giftOpenAssets: '素材仓库…',
				giftModalTitle: '礼物配置',
				giftSecAssets: '素材仓库',
				giftSecBind: '绑定与特效参数',
				giftSecSim: '送礼模拟',
				giftAnchorAssets: '素材',
				giftAnchorBind: '绑定',
				giftAnchorSim: '模拟',
				giftNeedOn: '先开启礼物模块',
				giftTriggerManual: '手动触发',
				giftTriggerRandom: '随机环境触发',
				giftTriggerProb: '概率',
				giftTriggerMin: '最小间隔 (s)',
				giftTriggerMax: '最大间隔 (s)',
				giftTemplateLabel: '提示模板',
				giftTemplateHint: '占位符：{user} 送礼人，{gift} 礼物名',
				giftSimTest: '立即测试',
				giftLastStatus: '最近一次触发',
				giftNoneYet: '尚未触发',
				giftTriggerErr: '触发失败',
				dirty: '有未保存修改',
				detailTitle: '弹幕详情',
				copy: '复制',
				block: '加入屏蔽词',
				remove: '删除该条',
				like: '点赞',
				liked: '已赞',
				heat: '高能进度',
				time: '时间',
				tags: '标签',
				editTemplates: '编辑模板…',
				templatesTitle: '风格模板库',
				tplName: '名称',
				tplPrompt: '提示词',
				tplAdd: '新增',
				tplDelete: '删除',
				close: '关闭',
				packGeneral: '通用',
				packCoding: '编程',
				packCasual: '闲聊',
				dragHint: '拖动调整位置'
			},
			en: {
				tabLabel: 'Live Chat',
				cardTitle: 'Live Chat Danmaku',
				cardDesc: 'Treat the chat as a livestream: continuous danmaku while the agent works.',
				enabled: 'Enable danmaku',
				opacity: 'Opacity',
				opacityIdle: 'Idle opacity',
				antiOcclude: 'Fade while reading',
				maxOnscreen: 'Max on-screen',
				fontSize: 'Font size',
				crossSec: 'Cross seconds',
				scrollSpeed: 'Scroll speed (px/s)',
				areaRatio: 'Roll area',
			areaEditor: 'Display area editor',
			areaEditorHint: 'Drag handles to resize · Enter apply · Esc cancel · Shift+Z undo · Shift+Ctrl+Z redo',
			interactive: 'Danmaku interaction (hover pause / click details)',
				layoutRoll: 'Roll %',
				layoutTop: 'Top %',
				layoutBottom: 'Bottom %',
				stroke: 'White stroke',
				hoverPause: 'Hover pause',
				presetPack: 'Preset pack',
				editPresets: 'Edit…',
				presetsTitle: 'Preset pack editor',
				presetsNewPack: 'New pack',
				presetsPackName: 'Pack name',
				presetsLines: 'Lines (one per row)',
				presetsDeletePack: 'Delete pack',
				presetsSave: 'Save',
				presetsAddLine: 'Add line',
				emojiEnabled: 'Emoji danmaku',
				emojiBaseSize: 'Emoji base size (px)',
				emojiTotalProb: 'Emoji total probability',
				emojiEdit: 'Edit emojis…',
				advancedEnabled: 'Advanced danmaku',
				advancedHint: 'Reverse scroll + style boost (rotate/scale/bold/opacity)',
				layoutReverse: 'Reverse %',
				reverseEnabled: 'Reverse scroll',
				advMore: 'More',
				advFont: 'Font',
				advDuration: 'ms',
				advMode: 'Mode',
				advModeScroll: 'Scroll',
				advModeRain: 'Rain',
				advModePop: 'Pop',
				advModeReverse: 'Reverse',
				advXPct: 'X%',
				advYPct: 'Y%',
				advStyles: 'Advanced styles',
				advName: 'Name',
				advWeight: 'Weight',
				advRotate: 'Rotate°',
				advScale: 'Scale',
				advBold: 'Bold',
				advOpacity: 'Opacity',
				advAdd: 'Add',
				advDel: 'Delete',
				emojiTitle: 'Emoji library',
				emojiImport: 'Import image…',
				emojiWeight: 'Weight',
				emojiDelete: 'Delete',
				emojiEmpty: 'No emojis yet',
				emojiHint: 'P(i)=total×(w_i/Σw)',
				blockedWords: 'Blocked words',
				ambient: 'Ambient interval (s)',
				maxPoolEntries: 'Session pool max entries',
				historyReplayMax: 'History replay count',
				historyReplayEnabled: 'Enable history replay',
				halfLifeDays: 'Half-life (days)',
				archiveAfterDays: 'Archive after (days)',
				colorWeightsBtn: 'Edit color weights…',
				colorWeightsTitle: 'Color weights',
				colorWeightsHint: 'Higher weight = more often',
				poolStats: 'Pool',
				poolLive: 'Live',
				poolArchived: 'Archived',
				preview: 'Preview',
				renderBackend: 'Render backend',
				backendAuto: 'Auto',
				backendDom: 'DOM',
				backendWebgl2: 'WebGL2 main',
				backendWebgl2Worker: 'WebGL2 Worker',
				wakeupType: 'LLM wake mode',
				wakeupSmart: 'Smart (events)',
				wakeupInterval: 'Interval',
				wakeupToolcall: 'Tool call',
				wakeupEvents: 'Smart events (csv)',
				smartMinGapSec: 'Smart min gap (s)',
				globalMinGapSec: 'Global min gap (s)',
				toolcallFilterMode: 'Tool filter',
				toolcallTools: 'Tool names (csv)',
				toolcallOnErrorExtra: 'Extra on tool error',
				uniformColor: 'Uniform color',
				color: 'Color',
				allowEmoji: 'Allow emoji',
				welcomeOnEnter: 'Welcome on enter',
				taskDoneRain: 'Task done rain',
				toolErrorSc: 'Tool error banner',
				showHeat: 'Show heat bar',
				debugSource: 'Debug: source badges',
				debugNote: 'Prefix 📺 preset / 🤖 AI / 💬 user',
				debugLogs: 'Debug: LLM logs in terminal',
				debugLogsNote: 'When on, host prints llm call / llm raw logs',
				restoreMaxAgeHours: 'Restore window',
				openPoolEditor: 'Open pool editor…',
				poolEditorTitle: 'Danmaku pool',
				poolSessions: 'Sessions',
				poolScopeLive: 'Live',
				poolScopeArchive: 'Archive',
				poolContent: 'Content',
				poolSource: 'Source',
				poolWeight: 'Weight',
				poolTime: 'Time',
				poolRestore: 'Restore',
				poolTooOld: 'Too old',
				poolDelete: 'Delete',
				poolSaveRow: 'Save',
				poolEmpty: 'No items',
				poolReload: 'Reload',
				poolRestored: 'Restored',
				poolRestoreFail: 'Restore failed',
				poolClearAll: 'Clear all pools',
				poolClearConfirmTitle: 'Confirm clear',
				poolClearConfirm: 'This deletes ALL session danmaku pools (including archives). This cannot be undone. Continue?',
				poolClearOk: 'Clear all',
				poolClearCancel: 'Cancel',
				poolCleared: 'Cleared',
				poolClearFail: 'Clear failed',
				styleTemplates: 'Style templates',
				filterAll: 'All',
				filterWhitelist: 'Whitelist',
				filterBlacklist: 'Blacklist',
				stylePrompt: 'LLM style prompt',
				styleMaxChars: 'Max chars',
				matchThreshold: 'Match threshold',
				llmEnabled: 'Enable LLM danmaku',
				llmIntervalSec: 'LLM refresh (s)',
			llmModel: 'LLM model (provider/model)',
			llmNone: 'No LLM (default)',
			llmBurstCount: 'Burst count',
				secWakeAdv: 'Wake advanced (backoff)',
				secCtxSrc: 'Readable context',
				backoffEnabled: 'Silence backoff',
				backoffBaseSec: 'Backoff base (s)',
				backoffMaxSec: 'Backoff max (s)',
				backoffFactor: 'Backoff factor',
				backoffResetSec: 'Active reset (s)',
				thinkingAsActive: 'Thinking counts as active',
				warningAlwaysWake: 'Warnings always wake',
				thinkingExcerptChars: 'Thinking excerpt chars',
				ctxConversation: 'Conversation',
				ctxThinking: 'Thinking',
				ctxWarning: 'Warnings',
				ctxUsage: 'Token/stats',
				ctxTools: 'Tool names',
				ctxEvents: 'Event kinds',
				collapseHint: 'Click title to expand/collapse',
				density: 'Density (1–5)',
				save: 'Save',
				saving: 'Saving…',
				saved: 'Saved',
				savedNoDisk: 'Saved in memory, but writing to disk failed — a dsh restart will lose it',
				saveFail: 'Save failed',
				quickTitle: 'Danmaku controls',
				openFullSettings: 'Open full settings',
				undo: 'Undo',
				undone: 'Undone',
				nothingToUndo: 'No unsaved changes',
				modalBasics: 'Basics',
				modalContent: 'Content & FX',
				modalLlm: 'LLM & Wake',
				modalPool: 'Pool',
				modalGift: 'Gifts',
				modalRender: 'Render',
				secBasics: 'Basics',
				secContent: 'Content',
				secFx: 'Color & FX',
				secLlm: 'LLM',
				secRender: 'Render',
				secDebug: 'Debug',
				secGift: 'Gifts',
				giftMaster: 'Enable gift effects',
				giftIntro: 'Once gifts are bound to assets, viewers send gift effects with tip danmaku on events; the master switch is OFF by default.',
				giftOpenConfig: 'Open gift config…',
				giftOpenAssets: 'Asset library…',
				giftModalTitle: 'Gift config',
				giftSecAssets: 'Asset library',
				giftSecBind: 'Binding & effect params',
				giftSecSim: 'Gift simulation',
				giftAnchorAssets: 'Assets',
				giftAnchorBind: 'Bind',
				giftAnchorSim: 'Sim',
				giftNeedOn: 'Enable the gift module first',
				giftTriggerManual: 'Manual trigger',
				giftTriggerRandom: 'Random ambient',
				giftTriggerProb: 'Probability',
				giftTriggerMin: 'Min interval (s)',
				giftTriggerMax: 'Max interval (s)',
				giftTemplateLabel: 'Tip template',
				giftTemplateHint: 'Placeholders: {user} sender, {gift} gift name',
				giftSimTest: 'Test now',
				giftLastStatus: 'Last trigger',
				giftNoneYet: 'Not triggered yet',
				giftTriggerErr: 'Trigger failed',
				dirty: 'Unsaved changes',
				detailTitle: 'Danmaku detail',
				copy: 'Copy',
				block: 'Block',
				remove: 'Remove',
				like: 'Like',
				liked: 'Liked',
				heat: 'Heat',
				close: 'Close',
				packGeneral: 'General',
				packCoding: 'Coding',
				packCasual: 'Casual',
				dragHint: 'Drag to move'
			}
		}

		function tFactory(locale) {
			var lang = 'zh'
			try {
				if (locale && locale.getSnapshot) lang = locale.getSnapshot() || 'zh'
			} catch (e) { /* zh */ }
			var dict = DICTS[lang] || DICTS.zh
			return function (key) { return dict[key] || DICTS.zh[key] || key }
		}

		function ensureStyles() {
			if (typeof document === 'undefined') return
			if (document.getElementById(STYLES_ID)) return
			var css = [
				'.dsh-danmaku-root{position:absolute;inset:0;pointer-events:none!important;z-index:1;}',
				'.dsh-danmaku-layer{position:absolute;overflow:hidden;pointer-events:none;}',
				// Gift effect layer (todo 13): above the danmaku layer (z-index 5),
				// below ball(30)/pop(31)/modal(10000+). Never a pointer target and
				// never position:fixed — it must not register as a "window" for the
				// pointerOverWindow guard (ancestor z-index must stay <= 20).
				'.dsh-gift-layer{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:5;}',
				'.dsh-gift-effect{position:absolute;box-sizing:border-box;transform:translate(-50%,-50%);pointer-events:none;display:flex;align-items:center;justify-content:center;}',
				'.dsh-gift-effect-content{width:100%;height:100%;pointer-events:none;}',
				'.dsh-gift-effect-media{width:100%;height:100%;object-fit:contain;pointer-events:none;}',
				'.dsh-gift-effect-svg{display:flex;align-items:center;justify-content:center;}',
				'.dsh-gift-effect-svg>svg{max-width:100%;max-height:100%;width:100%;height:100%;pointer-events:none;}',
				'.dsh-gift-sender-label{position:absolute;left:50%;top:calc(100% + 6px);transform:translateX(-50%);pointer-events:none;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis;font-size:12px;line-height:1.5;padding:1px 10px;border-radius:999px;background:var(--dsh-gift-sender-bg,rgba(15,15,20,.62));color:var(--dsh-gift-sender-fg,#fff);border:1px solid var(--dsh-gift-sender-border,rgba(255,255,255,.18));}',
				'.dsh-gift-effect-placeholder{width:100%;height:100%;pointer-events:none;border-radius:16px;background:linear-gradient(135deg,rgba(251,114,153,.28),rgba(137,213,255,.28));box-shadow:0 0 24px rgba(251,114,153,.35);}',
				'@keyframes dsh-gift-pulse{0%{transform:scale(.85);opacity:.6;}50%{transform:scale(1.05);opacity:1;}100%{transform:scale(.85);opacity:.6;}}',
				'.dsh-gift-effect[data-loop="1"] .dsh-gift-effect-placeholder{animation:dsh-gift-pulse 1s ease-in-out infinite;}',
				'.dsh-danmaku-item{position:absolute;left:0;top:0;white-space:nowrap;pointer-events:auto;cursor:pointer;will-change:transform;user-select:none;line-height:1.4;}',
				'.dsh-danmaku-text{display:inline-block;}',
				'.dsh-danmaku-item[data-layout="top"],.dsh-danmaku-item[data-layout="bottom"]{left:50%;}',
				'.dsh-danmaku-item[data-stroke="1"] .dsh-danmaku-text{text-shadow:-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000,0 0 2px rgba(0,0,0,.85);}',
				'.dsh-danmaku-item[data-hover="1"]{filter:brightness(1.3);}',
				'@keyframes dsh-danmaku-roll{from{transform:translate3d(0,0,0);}to{transform:translate3d(var(--dsh-danmaku-dx),0,0);}}',
				'@keyframes dsh-danmaku-reverse{from{transform:translate3d(0,0,0);}to{transform:translate3d(var(--dsh-danmaku-dx),0,0);}}',
				'@keyframes dsh-danmaku-rain{from{transform:translate3d(0,-48px,0);}to{transform:translate3d(0,var(--dsh-danmaku-dy),0);}}',
				'@keyframes dsh-danmaku-pop{0%{transform:scale(0);opacity:0;}18%{transform:scale(1.08);opacity:1;}72%{transform:scale(1);opacity:1;}100%{transform:scale(0);opacity:0;}}',
				'.dsh-danmaku-item[data-layout="reverse"] .dsh-danmaku-inner{transform-origin:center center;}',
				'@keyframes dsh-danmaku-fade{0%{opacity:0;}6%{opacity:1;}94%{opacity:1;}100%{opacity:0;}}',
				'.dsh-danmaku-ball{position:fixed;width:40px;height:40px;border-radius:50%;background:linear-gradient(145deg,#fb7299,#ff8fb3);color:#fff;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;pointer-events:auto;cursor:grab;box-shadow:0 4px 14px rgba(251,114,153,.45);z-index:30;user-select:none;touch-action:none;}',
				'.dsh-danmaku-ball:active{cursor:grabbing;}',
				'.dsh-danmaku-ball[data-on="0"]{filter:grayscale(.7);opacity:.7;}',
				'.dsh-danmaku-pop{position:fixed;width:230px;padding:12px;border-radius:12px;background:var(--dsw-alias-bg-overlay,#fff);border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.12));color:var(--dsw-alias-label-primary,#111);pointer-events:auto;box-shadow:0 8px 24px var(--dsw-alias-bg-mask-2,rgba(0,0,0,.18));font-size:12px;z-index:31;}',
				'.dsh-danmaku-pop label{display:flex;justify-content:space-between;align-items:center;margin:6px 0;gap:8px;}',
				'.dsh-danmaku-pop input[type=range]{flex:1;}',
				'.dsh-danmaku-modal{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,.45));pointer-events:auto;}',
				'.dsh-danmaku-modal-card{width:min(360px,90vw);border-radius:14px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary,#111);padding:16px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.12));box-shadow:0 12px 40px var(--dsw-alias-bg-mask-2,rgba(0,0,0,.2));box-sizing:border-box;overflow:hidden;}',
				'.dsh-danmaku-modal-card h3{margin:0 0 10px;font-size:15px;}',
				'.dsh-danmaku-modal-card .meta{font-size:12px;opacity:.75;line-height:1.6;margin-bottom:12px;}',
				'.dsh-danmaku-modal-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;}',
				'.dsh-danmaku-modal-actions button{border-radius:8px;border:1px solid var(--dsw-alias-border-l4,rgba(0,0,0,.16));background:transparent;color:inherit;padding:6px 10px;cursor:pointer;}',
				'.dsh-danmaku-card{padding:8px 4px 16px;max-width:720px;}',
				'.dsh-danmaku-card h3{margin:0 0 6px;font-size:16px;}',
				'.dsh-danmaku-card .desc{font-size:12px;opacity:.7;margin-bottom:14px;line-height:1.5;}',
				'.dsh-danmaku-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:10px 0;font-size:13px;}',
				'.dsh-danmaku-row input[type=range]{width:160px;}',
				'.dsh-danmaku-row input[type=text],.dsh-danmaku-row input[type=number],.dsh-danmaku-row select{width:220px;padding:5px 8px;border-radius:6px;border:1px solid var(--dsw-alias-border-l4,rgba(0,0,0,.16));background:transparent;color:inherit;}',
				'.dsh-danmaku-row-stacked{flex-direction:column;align-items:stretch;gap:6px;}',
				'.dsh-danmaku-row-stacked>span{align-self:flex-start;}',
				'.dsh-danmaku-textarea{width:100%;box-sizing:border-box;padding:6px 8px;border-radius:6px;border:1px solid var(--dsw-alias-border-l4,rgba(0,0,0,.16));background:transparent;color:inherit;font:inherit;font-size:13px;line-height:1.45;resize:none;white-space:pre-wrap;word-break:break-word;overflow-y:auto;}',
				'.dsh-danmaku-card .actions{display:flex;gap:8px;margin-top:16px;justify-content:flex-end;}',
				'.dsh-danmaku-card .actions button{border-radius:8px;border:1px solid var(--dsw-alias-border-l4,rgba(0,0,0,.16));background:transparent;color:inherit;padding:7px 14px;cursor:pointer;}',
				'.dsh-danmaku-card .actions button.primary{background:#fb7299;border-color:#fb7299;color:#fff;}',
				'.dsh-danmaku-section{margin-top:14px;padding-top:10px;border-top:1px dashed var(--dsw-alias-border-l3,rgba(0,0,0,.12));font-weight:600;font-size:12px;opacity:.85;}',
				'.dsh-danmaku-hr{border:0;border-top:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));margin:18px 0 8px;}',
				'.dsh-danmaku-item[data-kind="sc"]{font-weight:700;padding:2px 10px;border-radius:6px;background:rgba(251,114,153,.92);color:#fff!important;text-shadow:none!important;box-shadow:0 2px 10px rgba(251,114,153,.4);}',
				// Gift tip (todo 16): same pill shape as SC, distinct gold/amber
				// family (saturation probe: gift vs sc maxSat delta > 10).
				'.dsh-danmaku-item[data-kind="gift"]{font-weight:700;padding:2px 10px;border-radius:6px;background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff!important;text-shadow:none!important;box-shadow:0 2px 10px rgba(245,158,11,.45);}',
				'.dsh-danmaku-item[data-kind="rain"]{filter:brightness(1.15);}',
				'.dsh-danmaku-heat{position:absolute;left:286px;top:12px;bottom:12px;width:8px;border-radius:999px;background:rgba(128,128,128,.18);overflow:hidden;pointer-events:auto;cursor:pointer;z-index:2;box-shadow:0 0 0 1px rgba(0,0,0,.06);}',
				'.dsh-danmaku-heat-fill{position:absolute;left:0;right:0;bottom:0;height:0%;background:linear-gradient(to top,#3b82f6,#f59e0b,#ef4444);transition:height .6s ease, opacity .4s ease;opacity:.85;}',
				'.dsh-danmaku-heat[data-hot="1"] .dsh-danmaku-heat-fill{box-shadow:0 0 8px rgba(239,68,68,.45);}',
				'.dsh-danmaku-like{border:none;background:transparent;color:#fb7299;font-size:14px;cursor:pointer;padding:4px 8px;border-radius:8px;border:1px solid rgba(251,114,153,.4);}',
				'.dsh-danmaku-like[data-on="1"]{background:rgba(251,114,153,.2);}',
				'.dsh-danmaku-item[data-liked="1"]{filter:brightness(1.2);}',
				'@keyframes dsh-danmaku-flash{0%{background-color:transparent;}20%{background-color:rgba(251,114,153,.22);}50%{background-color:rgba(251,114,153,.32);}80%{background-color:rgba(251,114,153,.22);}100%{background-color:transparent;}}',
				'.dsh-danmaku-flash{animation:dsh-danmaku-flash 1.25s ease;border-radius:8px;}',
				'.dsh-emoji-card:hover .dsh-emoji-name,.dsh-emoji-card:hover .dsh-emoji-del{opacity:1!important;}',
				'.dsh-emoji-card{overflow:visible;}',
				'.dsh-emoji-card .dsh-emoji-thumb{position:relative;width:100%;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:10px 10px 0 0;background:var(--dsw-alias-bg-layer-1,rgba(0,0,0,.03));}',
				'.dsh-emoji-card .dsh-emoji-thumb img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;object-position:center;}',
				// Gift asset library UI (todo 8-10): import toolbar, panel, thumbnails.
				'.dsh-gift-import{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px;}',
				'.dsh-gift-import-btn{border-radius:10px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.18));background:#fff;color:inherit;padding:8px 12px;cursor:pointer;font-size:12px;white-space:nowrap;}',
				'.dsh-gift-import-dialog{border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.14));border-radius:10px;padding:10px;margin-bottom:8px;background:var(--dsw-alias-bg-layer-1,rgba(0,0,0,.02));}',
				'.dsh-gift-import-dialog textarea{width:100%;box-sizing:border-box;min-height:96px;padding:8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15));background:transparent;color:inherit;font:12px/1.5 ui-monospace,Consolas,monospace;resize:vertical;}',
				'.dsh-gift-import-dialog input[type=text],.dsh-gift-import-dialog input[type=number]{width:100%;box-sizing:border-box;padding:6px 8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15));background:transparent;color:inherit;font-size:12px;}',
				'.dsh-gift-import-progress{display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:8px 10px;border-radius:8px;background:rgba(251,114,153,.08);}',
				'.dsh-gift-import-count{font-size:12px;min-width:70px;}',
				'.dsh-gift-import-bar{flex:1;height:8px;border-radius:99px;background:rgba(128,128,128,.2);overflow:hidden;}',
				'.dsh-gift-import-bar>div{height:100%;background:#fb7299;transition:width .3s;}',
				'.dsh-gift-import-cur{font-size:11px;opacity:.7;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
				'.dsh-gift-import-abort{border-radius:8px;border:1px solid rgba(220,38,38,.4);background:transparent;color:#dc2626;padding:4px 10px;cursor:pointer;font-size:12px;}',
				'.dsh-gift-assets{display:flex;flex-direction:column;min-height:0;}',
				'.dsh-gift-assets-actions{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px;}',
				'.dsh-gift-assets-actions button{border-radius:10px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.18));background:#fff;color:inherit;padding:8px 12px;cursor:pointer;font-size:12px;white-space:nowrap;}',
				'.dsh-gift-assets-grid{overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:12px;padding:4px 2px 8px;min-height:180px;}',
				'.dsh-gift-assets-empty{opacity:.65;font-size:12px;line-height:1.6;padding:18px 4px;}',
				'.dsh-gift-asset-card{position:relative;width:100%;max-width:160px;margin:0 auto;border-radius:12px;overflow:visible;background:var(--dsw-alias-bg-layer-1,rgba(0,0,0,.04));border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.1));padding-bottom:4px;cursor:pointer;user-select:none;display:flex;flex-direction:column;}',
				'.dsh-gift-folder-card{position:relative;width:100%;max-width:160px;margin:0 auto;border-radius:12px;background:var(--dsw-alias-bg-layer-1,rgba(0,0,0,.04));border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.1));padding:0;cursor:pointer;user-select:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;height:112px;}',
				'.dsh-gift-folder-card[data-drop="1"]{outline:2px dashed #fb7299;outline-offset:-2px;}',
				'.dsh-gift-folder-icon{width:52px;height:40px;border-radius:6px;background:linear-gradient(160deg,#fbbf24,#f59e0b);position:relative;box-shadow:0 2px 6px rgba(245,158,11,.35);}',
				'.dsh-gift-folder-icon::before{content:"";position:absolute;top:-6px;left:0;width:22px;height:8px;border-radius:4px 4px 0 0;background:#fbbf24;}',
				'.dsh-gift-folder-name{font-size:12px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
				'.dsh-gift-folder-del{position:absolute;top:6px;right:6px;width:26px;height:26px;border-radius:50%;border:none;background:rgba(0,0,0,.45);color:#fff;cursor:pointer;font-size:14px;padding:0;}',
				'.dsh-gift-asset-thumb{position:relative;width:100%;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:10px 10px 0 0;background:var(--dsw-alias-bg-layer-1,rgba(0,0,0,.03));}',
				'.dsh-gift-asset-thumb img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;object-position:center;}',
				'.dsh-gift-asset-badge{font-size:11px;font-weight:700;letter-spacing:.06em;padding:2px 8px;border-radius:99px;background:rgba(251,114,153,.16);color:#fb7299;}',
				'.dsh-gift-asset-name{position:absolute;left:0;right:0;bottom:0;padding:14px 8px 6px;font-size:12px;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.55));opacity:0;transition:opacity .15s;pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;}',
				'.dsh-gift-asset-del{position:absolute;top:6px;right:6px;width:28px;height:28px;border-radius:50%;border:none;background:rgba(0,0,0,.55);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s;padding:0;font-size:13px;}',
				'.dsh-gift-asset-card:hover .dsh-gift-asset-name,.dsh-gift-asset-card:hover .dsh-gift-asset-del{opacity:1!important;}',
				'.dsh-gift-asset-weight-row{display:flex;align-items:center;gap:6px;padding:4px 8px;}',
				'.dsh-gift-asset-weight{width:56px;padding:2px 4px;border-radius:6px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15));background:transparent;color:inherit;box-sizing:border-box;font-size:12px;}',
				'.dsh-gift-selbar{display:flex;gap:8px;align-items:center;margin-bottom:8px;font-size:12px;}',
				'.dsh-gift-selbar button{border-radius:10px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.18));background:#fff;color:inherit;padding:6px 10px;cursor:pointer;font-size:12px;}',
				'.dsh-gift-assets-foot{display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap;}',
				'.dsh-gift-assets-foot button{border-radius:10px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.18));background:#fff;color:inherit;padding:6px 12px;cursor:pointer;font-size:12px;white-space:nowrap;}',
				'.dsh-gift-assets-count{font-size:12px;opacity:.7;white-space:nowrap;}',
				'.dsh-gift-crumbs{flex:1;display:flex;flex-wrap:wrap;gap:4px;font-size:12px;align-items:center;min-width:0;}',
				'.dsh-gift-crumb{border:none!important;background:transparent;color:inherit;cursor:pointer;border-radius:6px;padding:2px 6px;}',
				'.dsh-gift-crumb[data-active="1"]{background:rgba(251,114,153,.15);}',
				'.dsh-gift-asset-preview{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;}',
				'.dsh-gift-asset-preview canvas{max-width:100%;max-height:100%;}',
				// Gift sender presets editor (todo 19).
				'.dsh-gift-senders{display:flex;flex-direction:column;gap:6px;}',
				'.dsh-gift-senders-label{font-size:12px;opacity:.75;line-height:1.5;}',
				'.dsh-gift-senders-text{width:100%;box-sizing:border-box;min-height:88px;padding:8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15));background:transparent;color:inherit;font:12px/1.5 ui-monospace,Consolas,monospace;resize:vertical;}',
				'.dsh-gift-senders-hint{font-size:11px;opacity:.7;line-height:1.5;}',
				'.dsh-gift-senders-count{display:none;}',
				// Gift catalog list (todo 21): search bar + category filter + lazy rows.
				'.dsh-gift-catalog{display:flex;flex-direction:column;min-height:0;gap:6px;}',
				'.dsh-gift-catalog-bar{display:flex;gap:6px;align-items:center;}',
				'.dsh-gift-catalog-search{flex:1;min-width:0;padding:6px 8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15));background:transparent;color:inherit;font-size:12px;}',
				'.dsh-gift-catalog-cat{max-width:120px;padding:6px 8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15));background:transparent;color:inherit;font-size:12px;}',
				'.dsh-gift-catalog-status{font-size:11px;opacity:.7;}',
				'.dsh-gift-catalog-list{overflow:auto;display:flex;flex-direction:column;gap:4px;min-height:120px;max-height:100%;padding:2px;}',
				'.dsh-gift-catalog-row{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;border:1px solid transparent;cursor:pointer;user-select:none;}',
				'.dsh-gift-catalog-row:hover{background:var(--dsw-alias-bg-layer-1,rgba(0,0,0,.04));}',
				'.dsh-gift-catalog-row[data-selected="1"]{background:rgba(251,114,153,.12);border-color:#fb7299;}',
				'.dsh-gift-catalog-icon{width:32px;height:32px;flex:0 0 32px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:var(--dsw-alias-bg-layer-1,rgba(0,0,0,.04));overflow:hidden;}',
				'.dsh-gift-catalog-img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;}',
				'.dsh-gift-catalog-icon-fallback{font-size:10px;opacity:.6;}',
				'.dsh-gift-catalog-main{flex:1;min-width:0;}',
				'.dsh-gift-catalog-name{font-size:12px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
				'.dsh-gift-catalog-meta{font-size:11px;opacity:.65;line-height:1.4;}',
				'.dsh-gift-catalog-unbound{flex:0 0 auto;font-size:10px;padding:1px 6px;border-radius:99px;background:rgba(245,158,11,.16);color:#b45309;}',
				'.dsh-gift-catalog-empty{padding:16px 4px;font-size:12px;opacity:.65;}',
				'.dsh-gift-catalog-more{margin-top:2px;padding:6px 12px;border-radius:10px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.18));background:#fff;color:inherit;cursor:pointer;font-size:12px;}',
				// Gift binding + effect params panel (todo 22).
				'.dsh-gift-bind{display:flex;flex-direction:column;gap:8px;font-size:12px;}',
				'.dsh-gift-bind-empty{padding:14px 4px;opacity:.65;line-height:1.6;}',
				'.dsh-gift-bind-head{font-weight:600;display:flex;gap:8px;align-items:baseline;}',
				'.dsh-gift-bind-id{font-size:11px;opacity:.6;font-weight:400;}',
				'.dsh-gift-bind-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}',
				'.dsh-gift-bind-label{width:56px;flex:0 0 56px;opacity:.75;}',
				'.dsh-gift-bind-hint{opacity:.6;}',
				'.dsh-gift-bind button{border-radius:8px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.18));background:transparent;color:inherit;padding:5px 10px;cursor:pointer;font-size:12px;}',
				'.dsh-gift-bind-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:8px;background:var(--dsw-alias-bg-layer-1,rgba(0,0,0,.04));border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.1));max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
				'.dsh-gift-bind-select{padding:5px 8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15));background:transparent;color:inherit;font-size:12px;}',
				'.dsh-gift-bind-picker{margin-top:2px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.12));border-radius:10px;padding:8px;background:var(--dsw-alias-bg-layer-2,#fff);max-height:200px;overflow:auto;}',
				'.dsh-gift-bind-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(60px,1fr));gap:6px;}',
				'.dsh-gift-bind-thumb{position:relative;aspect-ratio:1/1;border-radius:8px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.12));background:var(--dsw-alias-bg-layer-1,rgba(0,0,0,.03));display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;padding:0;}',
				'.dsh-gift-bind-thumb img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;}',
				'.dsh-gift-bind-thumb[data-selected="1"]{border-color:#fb7299;box-shadow:0 0 0 2px rgba(251,114,153,.25);}',
				'.dsh-gift-bind-thumb span{font-size:10px;opacity:.7;}',
				'.dsh-gift-bind-picker-empty{opacity:.6;padding:8px;}',
				'.dsh-gift-preview{position:relative;width:120px;height:80px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.18));background:repeating-linear-gradient(45deg,rgba(0,0,0,.03),rgba(0,0,0,.03) 6px,transparent 6px,transparent 12px);}',
				'.dsh-gift-preview-marker{position:absolute;width:10px;height:10px;border-radius:50%;background:#fb7299;transform:translate(-50%,-50%);box-shadow:0 0 0 2px rgba(255,255,255,.85);}',
				'.dsh-gift-bind-range{flex:1;min-width:80px;}',
				'.dsh-gift-bind-scale-read{min-width:38px;text-align:right;opacity:.8;}',
				'.dsh-gift-bind-loop{display:flex;align-items:center;gap:6px;}',
				// Gift config modal (todo 23): ONE split-panel page, no inner tabs.
				// Layered above the settings modal (10020) / pool editor (10030) and
				// below the toast/area layer (10050) — the modal stays on top without
				// touching any existing z-index.
				'.dsh-gift-modal{position:fixed;inset:0;z-index:10040;display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,.45));pointer-events:auto;}',
				'.dsh-gift-modal-box{width:min(960px,94vw);height:min(680px,86vh);display:flex;flex-direction:column;border-radius:14px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary,#111);border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.12));box-shadow:0 20px 60px var(--dsw-alias-bg-mask-2,rgba(0,0,0,.25));overflow:hidden;}',
				'.dsh-gift-modal-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));font-weight:600;}',
				'.dsh-gift-modal-body{flex:1;display:flex;min-height:0;}',
				'.dsh-gift-modal-left{width:280px;min-width:220px;display:flex;flex-direction:column;min-height:0;overflow:hidden;border-right:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));padding:8px;}',
				'.dsh-gift-modal-left>.dsh-gift-catalog{flex:1;min-height:0;}',
				'.dsh-gift-modal-right{flex:1;min-height:0;overflow:auto;padding:10px 14px;}',
				'.dsh-gift-modal-anchors{width:56px;display:flex;flex-direction:column;gap:6px;padding:10px 6px;border-left:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));}',
				'.dsh-gift-modal-anchors button{border:none;background:transparent;color:inherit;border-radius:8px;padding:6px 2px;cursor:pointer;font-size:12px;}',
				'.dsh-gift-modal-anchors button:hover{background:rgba(251,114,153,.15);}',
				'.dsh-gift-modal-sec{margin-bottom:16px;}',
				'.dsh-gift-modal-sec-title{font-weight:600;font-size:13px;margin:2px 0 8px;}',
				'.dsh-gift-entry{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 10px;}',
				'.dsh-gift-entry button{border-radius:8px;border:1px solid var(--dsw-alias-border-l4,rgba(0,0,0,.16));background:transparent;color:inherit;padding:6px 10px;cursor:pointer;font-size:12px;}',
				'.dsh-gift-sim{display:flex;flex-direction:column;gap:8px;font-size:12px;}',
				'.dsh-gift-sim-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}',
				'.dsh-gift-sim-input{flex:1;min-width:120px;padding:4px 8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.16));background:transparent;color:inherit;}',
				'.dsh-gift-sim-off{opacity:.75;padding:4px 0;}',
				'.dsh-gift-snapshot{margin-top:4px;padding:6px 8px;border-radius:8px;background:rgba(251,114,153,.1);}',
				'.dsh-gift-sim-last{opacity:.8;}',
				'.dsh-toast-container{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:10050;display:flex;flex-direction:column;gap:8px;pointer-events:none;}',
				'.dsh-toast-card{display:flex;align-items:flex-start;gap:8px;padding:12px 16px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary,#111);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);min-width:280px;max-width:420px;pointer-events:auto;animation:dsh-toast-in .2s ease;border-left:3px solid #3b82f6;}',
				'.dsh-toast-info{border-left-color:#3b82f6;}',
				'.dsh-toast-success{border-left-color:#22c55e;}',
				'.dsh-toast-warning{border-left-color:#f59e0b;}',
				'.dsh-toast-error{border-left-color:#e5484d;}',
				'.dsh-toast-body{flex:1;}',
				'.dsh-toast-title{font-size:13px;font-weight:600;}',
				'.dsh-toast-desc{font-size:12px;opacity:.85;margin-top:2px;word-break:break-word;}',
				'.dsh-toast-close{background:none;border:none;color:inherit;opacity:.5;cursor:pointer;font-size:18px;line-height:1;padding:0 4px;}',
				'.dsh-toast-close:hover{opacity:1;}',
				'@keyframes dsh-toast-in{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}',
				'.dsh-danmaku-settings{position:fixed;inset:0;z-index:10020;display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,.45));pointer-events:auto;}',
				'.dsh-danmaku-settings-box{width:min(920px,92vw);height:min(640px,82vh);display:flex;flex-direction:column;border-radius:16px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary,#111);border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.12));box-shadow:0 20px 60px var(--dsw-alias-bg-mask-2,rgba(0,0,0,.25));overflow:hidden;}',
				'.dsh-danmaku-settings-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));font-weight:600;}',
				'.dsh-danmaku-settings-body{flex:1;display:flex;min-height:0;}',
				'.dsh-danmaku-settings-nav{width:140px;padding:10px 8px;border-right:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));overflow:auto;}',
				'.dsh-danmaku-settings-nav button{display:block;width:100%;text-align:left;border:none;background:transparent;color:inherit;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:4px;font-size:13px;}',
				'.dsh-danmaku-settings-nav button[data-active="1"]{background:rgba(251,114,153,.2);color:inherit;}',
				'.dsh-danmaku-settings-main{flex:1;overflow:auto;padding:8px 16px 16px;}',
				'.dsh-danmaku-settings-foot{display:flex;align-items:center;gap:8px;padding:10px 16px;border-top:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));}',
				'.dsh-danmaku-settings-foot button{border-radius:8px;border:1px solid var(--dsw-alias-border-l4,rgba(0,0,0,.16));background:transparent;color:inherit;padding:6px 14px;cursor:pointer;}',
				'.dsh-danmaku-settings-foot button.primary{background:#fb7299;border-color:#fb7299;color:#fff;}',
				'.dsh-danmaku-area{position:fixed;inset:0;z-index:10050;pointer-events:auto;}',
				'.dsh-danmaku-area-rect{position:absolute;box-sizing:border-box;border:2px solid #22c55e;background:rgba(34,197,94,.18);}',
				'.dsh-danmaku-area-hit{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;}',
				'.dsh-danmaku-area-handle{width:18px;height:18px;box-sizing:border-box;border-radius:50%;background:#22c55e;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);pointer-events:none;}',
				'.dsh-danmaku-root[data-interactive="0"] .dsh-danmaku-layer,.dsh-danmaku-root[data-interactive="0"] .dsh-danmaku-layer *,.dsh-danmaku-root[data-interactive="0"] canvas{pointer-events:none!important;}',
				'.dsh-danmaku-area-hint{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:10051;max-width:92vw;padding:8px 14px;border-radius:10px;font-size:12px;line-height:1.55;text-align:center;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.18);transition:opacity .15s ease;}',
				'.dsh-danmaku-pool{position:fixed;inset:0;z-index:10030;display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,.45));pointer-events:auto;}',
				'.dsh-danmaku-pool-box{width:min(960px,94vw);height:min(560px,84vh);display:flex;flex-direction:column;border-radius:14px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary,#111);border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.12));overflow:hidden;}',
				'.dsh-danmaku-pool-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));font-weight:600;}',
				'.dsh-danmaku-pool-body{flex:1;display:flex;min-height:0;}',
				'.dsh-danmaku-pool-sessions{width:220px;overflow:auto;border-right:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));padding:8px;}',
				'.dsh-danmaku-pool-sessions button{display:block;width:100%;text-align:left;border:none;background:transparent;color:inherit;padding:8px;border-radius:8px;cursor:pointer;margin-bottom:4px;font-size:12px;}',
				'.dsh-danmaku-pool-sessions button[data-active="1"]{background:rgba(251,114,153,.18);}',
				'.dsh-danmaku-pool-session-title{font-size:12px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;}',
				'.dsh-danmaku-pool-session-id{font-family:monospace;font-size:10px;opacity:.45;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
				'.dsh-danmaku-pool-main{flex:1;overflow:auto;padding:8px 12px;}',
				'.dsh-danmaku-pool-table{width:100%;border-collapse:collapse;font-size:12px;}',
				'.dsh-danmaku-pool-table th,.dsh-danmaku-pool-table td{padding:6px 8px;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));text-align:left;}',
				'.dsh-danmaku-pool-table input{width:100%;padding:3px 6px;border-radius:6px;border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.12));background:transparent;color:inherit;}',
			].join('\n')
			var el = document.createElement('style')
			el.id = STYLES_ID
			el.textContent = css
			document.head.appendChild(el)
		}

		function pickLayout(weights, random) {
			var rnd = random || Math.random
			var roll = Number((weights && weights.roll) != null ? weights.roll : 80)
			var top = Number((weights && weights.top) != null ? weights.top : 10)
			var bottom = Number((weights && weights.bottom) != null ? weights.bottom : 10)
			var reverse = Number((weights && weights.reverse) != null ? weights.reverse : 0)
			var total = roll + top + bottom + reverse
			if (total <= 0) return 'roll'
			var r = rnd() * total
			if ((r -= roll) <= 0) return 'roll'
			if ((r -= top) <= 0) return 'top'
			if ((r -= bottom) <= 0) return 'bottom'
			if ((r -= reverse) <= 0) return 'reverse'
			return 'roll'
		}

		function pickAdvancedStyle(styles, random) {
			var rnd = random || Math.random
			var list = (styles || []).filter(function (s) { return s && Number(s.weight) > 0 })
			if (!list.length) return null
			var total = 0
			for (var i = 0; i < list.length; i++) total += Number(list[i].weight) || 0
			if (total <= 0) return null
			var r = rnd() * total
			for (var j = 0; j < list.length; j++) {
				r -= Number(list[j].weight) || 0
				if (r <= 0) return list[j]
			}
			return list[list.length - 1]
		}

		function pickColor(cfg, random) {
			var rnd = random || Math.random
			if (cfg && cfg.uniformColor) return cfg.color || '#FFFFFF'
			var weights = (cfg && cfg.colorWeights) || DEFAULTS.colorWeights
			var total = 0
			for (var i = 0; i < weights.length; i++) total += Number(weights[i].weight || 0)
			if (total <= 0) return '#FFFFFF'
			var r = rnd() * total
			for (var j = 0; j < weights.length; j++) {
				r -= Number(weights[j].weight || 0)
				if (r <= 0) return weights[j].color || '#FFFFFF'
			}
			return weights[weights.length - 1].color || '#FFFFFF'
		}

		function filterEmoji(text, allow) {
			if (allow !== false) return text
			// strip most emoji / pictographs while keeping CJK + ASCII
			return String(text || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F000}-\u{1F2FF}]/gu, '').trim()
		}

		function isBlocked(content, words) {
			var lower = String(content || '').toLowerCase()
			var list = words || []
			for (var i = 0; i < list.length; i++) {
				var w = String(list[i] || '').trim().toLowerCase()
				if (w && lower.indexOf(w) >= 0) return true
			}
			return false
		}

		var runtimePresetPacks = (function () {
			var o = {}
			for (var k in PRESET_PACKS) o[k] = PRESET_PACKS[k].slice()
			return o
		})()
		var runtimePresetNames = {
			general: '通用',
			coding: '编程',
			casual: '闲聊'
		}

		function applyPresetStore(store) {
			if (!store || !store.packs) return
			for (var id in store.packs) {
				var p = store.packs[id]
				if (p && Array.isArray(p.lines)) {
					runtimePresetPacks[id] = p.lines.map(String).filter(Boolean)
					if (p.name) runtimePresetNames[id] = p.name
				}
			}
		}

		function sampleLocalPresets(pack, count, blocked, random) {
			var list = runtimePresetPacks[pack] || runtimePresetPacks.general || PRESET_PACKS.general
			var rnd = random || Math.random
			var pool = list.filter(function (c) { return !isBlocked(c, blocked) })
			var out = []
			var n = Math.max(1, Math.min(count || 1, pool.length))
			for (var i = 0; i < n && pool.length; i++) {
				var idx = Math.floor(rnd() * pool.length)
				out.push({ content: pool.splice(idx, 1)[0], source: 'preset' })
			}
			return out
		}

		// ---- gift config schema clamp (todo 6) ----
		// Twin of the CANONICAL implementation in lib/gift-lib.js
		// (clampGiftConfig). This file is a `window.__ModuleLoader__` factory and
		// cannot import Node modules, so the clamp is mirrored here — ranges and
		// fallbacks must stay in lockstep with gift-lib.js (unit-tested there).
		var GIFT_POSITIONS = ['center', 'top', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'random']

		function giftNum(v, min, max, def) {
			var n = Number(v)
			if (!Number.isFinite(n)) return def
			return Math.min(max, Math.max(min, n))
		}

		function clampGiftConfig(partial, base) {
			var p = partial && typeof partial === 'object' ? partial : {}
			var b = base && typeof base === 'object' ? base : {}
			var d = DEFAULTS
			var pick = function (k) { return p[k] !== undefined ? p[k] : (b[k] !== undefined ? b[k] : d[k]) }
			var out = {}
			out.giftEnabled = pick('giftEnabled') === true
			out.giftRoomId = String(pick('giftRoomId') == null ? '' : pick('giftRoomId')).replace(/[^0-9]/g, '').slice(0, 20)
			var tpl = String(pick('giftTemplate') == null ? '' : pick('giftTemplate')).slice(0, 100)
			out.giftTemplate = tpl.trim() ? tpl : d.giftTemplate
			var senders = pick('giftSenders')
			out.giftSenders = Array.isArray(senders)
				? senders
					.slice(0, 50)
					.filter(function (s) { return s && typeof s === 'object' && !Array.isArray(s) })
					.map(function (s) {
						return {
							name: String(s.name == null ? '' : s.name).slice(0, 24),
							weight: giftNum(s.weight, 0, 100, 1)
						}
					})
					.filter(function (s) { return s.name !== '' })
				: []
			out.giftBindings = {}
			var bindings = pick('giftBindings')
			if (bindings && typeof bindings === 'object' && !Array.isArray(bindings)) {
				var n = 0
				var keys = Object.keys(bindings)
				for (var i = 0; i < keys.length && n < 2000; i++) {
					var v = bindings[keys[i]]
					if (!v || typeof v !== 'object' || Array.isArray(v)) continue
					var k = String(keys[i]).slice(0, 40)
					if (!k) continue
					out.giftBindings[k] = {
						assetId: String(v.assetId == null ? '' : v.assetId).slice(0, 80),
						position: GIFT_POSITIONS.indexOf(v.position) >= 0 ? v.position : 'center',
						scale: giftNum(v.scale, 0.25, 2, 1),
						durationMs: Math.floor(giftNum(v.durationMs, 1000, 10000, 3000)),
						loop: v.loop === true
					}
					n++
				}
			}
			var trig = pick('giftTrigger')
			trig = trig && typeof trig === 'object' && !Array.isArray(trig) ? trig : {}
			var trigMin = Math.floor(giftNum(trig.minMs, 1000, 3600000, d.giftTrigger.minMs))
			out.giftTrigger = {
				manual: trig.manual !== false,
				random: trig.random === true,
				probability: giftNum(trig.probability, 0, 1, d.giftTrigger.probability),
				minMs: trigMin,
				maxMs: Math.floor(giftNum(trig.maxMs, trigMin, 3600000, Math.max(trigMin, d.giftTrigger.maxMs)))
			}
			out.giftMaxConcurrent = Math.floor(giftNum(pick('giftMaxConcurrent'), 1, 10, d.giftMaxConcurrent))
			out.giftShowSender = pick('giftShowSender') !== false
			var layout = pick('giftLayout')
			layout = layout && typeof layout === 'object' && !Array.isArray(layout) ? layout : {}
			out.giftLayout = {
				roll: giftNum(layout.roll, 0, 100, d.giftLayout.roll),
				top: giftNum(layout.top, 0, 100, d.giftLayout.top),
				bottom: giftNum(layout.bottom, 0, 100, d.giftLayout.bottom)
			}
			out.giftMaxAssetMB = Math.floor(giftNum(pick('giftMaxAssetMB'), 1, 64, d.giftMaxAssetMB))
			return out
		}

		function clampConfig(raw) {
			var out = {}
			for (var k in DEFAULTS) out[k] = DEFAULTS[k]
			if (raw && typeof raw === 'object') {
				for (var key in DEFAULTS) {
					if (raw[key] !== undefined && raw[key] !== null) out[key] = raw[key]
				}
			}
			out.opacity = Math.min(1, Math.max(0.1, Number(out.opacity) || DEFAULTS.opacity))
			out.opacityIdle = Math.min(0.8, Math.max(0, Number(out.opacityIdle)))
			out.maxOnscreen = Math.floor(Number(out.maxOnscreen) || DEFAULTS.maxOnscreen)
			out.fontSize = Math.floor(Number(out.fontSize) || DEFAULTS.fontSize)
			out.crossSec = Math.min(20, Math.max(3, Number(out.crossSec) || DEFAULTS.crossSec))
			out.scrollSpeed = Math.min(400, Math.max(40, Number(out.scrollSpeed) || DEFAULTS.scrollSpeed))
			out.displayArea = (function (a) {
				var d = DEFAULTS.displayArea
				var n = function (v, min, max, def) {
					var x = Number(v)
					if (!Number.isFinite(x)) return def
					return Math.min(max, Math.max(min, x))
				}
				var x = n(a && a.x, 0, 1, d.x)
				var y = n(a && a.y, 0, 1, d.y)
				var w = n(a && a.w, 0.08, 1, d.w)
				var h = n(a && a.h, 0.08, 1, d.h)
				if (x + w > 1) { if (w >= 1) { x = 0; w = 1 } else { x = 1 - w } }
				if (y + h > 1) { if (h >= 1) { y = 0; h = 1 } else { y = 1 - h } }
				if (x < 0) x = 0
				if (y < 0) y = 0
				return { x: x, y: y, w: w, h: h }
			})(out.displayArea)
			out.interactive = out.interactive === true
			out.areaRatio = Math.min(1, Math.max(0.25, Number(out.areaRatio) || DEFAULTS.areaRatio))
			out.maxPoolEntries = Math.max(20, Math.min(2000, Number(out.maxPoolEntries) || DEFAULTS.maxPoolEntries))
			out.historyReplayEnabled = out.historyReplayEnabled !== false
			out.historyReplayMax = Math.max(0, Math.min(50, Number(out.historyReplayMax) || DEFAULTS.historyReplayMax))
			out.historyMaxAgeHours = Math.max(1, Math.min(720, Number(out.historyMaxAgeHours) || DEFAULTS.historyMaxAgeHours))
			out.halfLifeDays = Math.max(1, Math.min(30, Number(out.halfLifeDays) || DEFAULTS.halfLifeDays))
			out.archiveAfterDays = Math.max(1, Math.min(365, Number(out.archiveAfterDays) || DEFAULTS.archiveAfterDays))
			if (!['auto', 'dom', 'webgl2', 'webgl2-main', 'webgl2-worker'].includes(out.renderBackend)) out.renderBackend = 'dom'
			out.ambientMinMs = Math.max(400, Number(out.ambientMinMs) || DEFAULTS.ambientMinMs)
			out.ambientMaxMs = Math.max(out.ambientMinMs + 200, Number(out.ambientMaxMs) || DEFAULTS.ambientMaxMs)
			out.llmIntervalSec = Math.max(5, Number(out.llmIntervalSec) || DEFAULTS.llmIntervalSec)
			out.llmBurstCount = Math.max(1, Math.min(20, Number(out.llmBurstCount) || DEFAULTS.llmBurstCount))
			out.density = Math.max(1, Math.min(5, Number(out.density) || DEFAULTS.density))
			if (!PRESET_PACKS[out.presetPack] && !runtimePresetPacks[out.presetPack]) out.presetPack = 'general'
			if (!Array.isArray(out.blockedWords)) out.blockedWords = []
			out.debugSource = out.debugSource === true
			out.debugLogs = out.debugLogs === true
			out.emojiEnabled = out.emojiEnabled === true
			out.emojiBaseSize = Math.max(16, Math.min(128, Number(out.emojiBaseSize) || DEFAULTS.emojiBaseSize))
			out.emojiTotalProb = Math.max(0, Math.min(0.5, Number(out.emojiTotalProb != null ? out.emojiTotalProb : DEFAULTS.emojiTotalProb)))
			out.advancedEnabled = out.advancedEnabled === true
			var rawStyles = (raw && Array.isArray(raw.advancedStyles)) ? raw.advancedStyles : DEFAULTS.advancedStyles
			out.advancedStyles = rawStyles.slice(0, 24).map(function (s, i) {
				function n(v, a, b, d) {
					var x = Number(v)
					if (!Number.isFinite(x)) return d
					return Math.max(a, Math.min(b, x))
				}
				var m = s && s.mode
				var mode = (m === 'rain' || m === 'pop' || m === 'reverse') ? m : 'scroll'
				return {
					id: String((s && s.id) || 'as_' + i),
					name: String((s && s.name) || ('样式' + (i + 1))).slice(0, 20),
					weight: n(s && s.weight, 0, 100, 1),
					rotate: n(s && s.rotate, -30, 30, 0),
					scale: n(s && s.scale, 0.8, 1.6, 1),
					bold: !!(s && s.bold),
					opacity: n(s && s.opacity, 0.3, 1, 1),
					font: String((s && s.font) || '').slice(0, 60),
					durationMs: Math.floor(n(s && s.durationMs, 1000, 8000, 4000)),
					mode: mode
				}
			})
			if (!out.advancedStyles.length) out.advancedStyles = DEFAULTS.advancedStyles.slice()
			if (!out.layoutWeights || typeof out.layoutWeights !== 'object') out.layoutWeights = Object.assign({}, DEFAULTS.layoutWeights)
			// reverse is driven by advanced style mode, not a separate switch
			out.layoutWeights.reverse = 0
			if (typeof out.llmModel !== 'string') out.llmModel = DEFAULTS.llmModel
			if (typeof out.stylePrompt !== 'string') out.stylePrompt = DEFAULTS.stylePrompt
			out.backoffEnabled = out.backoffEnabled !== false
			out.backoffBaseSec = Math.max(5, Math.min(120, Number(out.backoffBaseSec) || DEFAULTS.backoffBaseSec))
			out.backoffMaxSec = Math.max(out.backoffBaseSec, Math.min(300, Number(out.backoffMaxSec) || DEFAULTS.backoffMaxSec))
			out.backoffFactor = Math.max(1.1, Math.min(3, Number(out.backoffFactor) || DEFAULTS.backoffFactor))
			out.backoffResetSec = Math.max(2, Math.min(60, Number(out.backoffResetSec) || DEFAULTS.backoffResetSec))
			out.thinkingAsActive = out.thinkingAsActive !== false
			out.warningAlwaysWake = out.warningAlwaysWake !== false
			out.thinkingExcerptChars = Math.max(80, Math.min(480, Number(out.thinkingExcerptChars) || DEFAULTS.thinkingExcerptChars))
			var cs = DEFAULTS.contextSources
			if (raw && raw.contextSources && typeof raw.contextSources === 'object') {
				cs = Object.assign({}, DEFAULTS.contextSources)
				for (var ck in DEFAULTS.contextSources) {
					if (raw.contextSources[ck] !== undefined) cs[ck] = !!raw.contextSources[ck]
				}
			}
			out.contextSources = cs
			// Gift schema (todo 6) — canonical clamp in gift-lib.js.
			Object.assign(out, clampGiftConfig(raw, out))
			return out
		}

		function fetchJson(url, init) {
			return fetch(url, init).then(function (res) {
				if (!res.ok) throw new Error('HTTP ' + res.status)
				return res.json()
			})
		}

		// ---- gift SVGA player: lazy vendor load + graceful degradation (todo 11) ----
		// The vendored svgaplayerweb build is served by the host at
		// /api/danmaku/gift/vendor/svga.js and injected on demand — never imported
		// at the top of this file, never copied into it, and never assumed present.
		var GIFT_VENDOR_SVGA = '/api/danmaku/gift/vendor/svga.js'
		var giftSvgaPromise = null
		var giftSvgaParser = null
		var giftToastRef = { fn: null }

		function giftToast(type, title, desc) {
			try {
				window.dispatchEvent(new CustomEvent('dsh-gift-toast', {
					detail: { type: type || 'error', title: title || '', desc: desc || '' }
				}))
			} catch (e) { /* ignore */ }
			if (giftToastRef.fn) {
				try { giftToastRef.fn(type, title, desc); return } catch (e) { /* fall through */ }
			}
			try { console.warn('[gift]', title, desc || '') } catch (e) { /* ignore */ }
		}

		// ---- fault tolerance (todo 18) ------------------------------------------
		// A missing / corrupt / oversized asset skips its effect and keeps the
		// queue moving. Failures of the SAME cause inside a 60s window emit one
		// toast only, so a broken binding cannot spam the user.
		var GIFT_FAULT_WINDOW_MS = 60000
		var giftFaultLog = {}
		function giftFaultToast(cause, title, desc) {
			var now = Date.now()
			var last = giftFaultLog[cause]
			if (last && now - last < GIFT_FAULT_WINDOW_MS) return false
			giftFaultLog[cause] = now
			giftToast('error', title, desc)
			return true
		}
		function giftResetFaults() { giftFaultLog = {} }
		// Playback size ceiling in bytes, mirroring the upload-cap config field.
		function giftAssetByteLimit() {
			var cfg = (giftRuntime.configRef && giftRuntime.configRef.current) || DEFAULTS
			var mb = Number(cfg && cfg.giftMaxAssetMB)
			if (!Number.isFinite(mb) || mb <= 0) mb = DEFAULTS.giftMaxAssetMB
			return mb * 1024 * 1024
		}

		// Inject the vendor script exactly once; every call shares one promise.
		function loadSvgaPlayer() {
			if (giftSvgaPromise) return giftSvgaPromise
			giftSvgaPromise = new Promise(function (resolve, reject) {
				if (typeof window !== 'undefined' && window.SVGA) { resolve(window.SVGA); return }
				if (typeof document === 'undefined') { reject(new Error('no document')); return }
				var script = document.createElement('script')
				script.src = GIFT_VENDOR_SVGA
				script.async = true
				script.setAttribute('data-dsh-gift-svga', '1')
				script.onload = function () {
					if (window.SVGA) resolve(window.SVGA)
					else reject(new Error('SVGA global missing after load'))
				}
				script.onerror = function () { reject(new Error('SVGA script failed to load')) }
				document.head.appendChild(script)
			})
			return giftSvgaPromise
		}

		// Parse → instance → play → onFinished. Resolves to a handle with
		// destroy(). Any load/parse failure toasts once and skips the effect
		// (the caller's queue keeps running); resolve still yields the handle.
		function playSvga(url, container, opts) {
			opts = opts || {}
			var destroyed = false
			var player = null
			var handle = {
				destroyed: false,
				destroy: function () {
					if (destroyed) return
					destroyed = true
					handle.destroyed = true
					try { if (player && player.stopAnimation) player.stopAnimation() } catch (e) { /* ignore */ }
					try { if (container) container.innerHTML = '' } catch (e) { /* ignore */ }
				}
			}
			return loadSvgaPlayer().then(function (SVGA) {
				if (destroyed) return handle
				return new Promise(function (resolve, reject) {
					if (!giftSvgaParser) giftSvgaParser = new SVGA.Parser()
					var onLoaded = function (item) {
						if (destroyed) { resolve(handle); return }
						try {
							player = new SVGA.Player(container)
							player.loops = opts.loop === true ? 0 : 1
							player.clearsAfterStop = true
							player.onFinished(function () {
								if (destroyed) return
								try { player.stopAnimation() } catch (e) { /* ignore */ }
								if (opts.onFinished) { try { opts.onFinished() } catch (e) { /* ignore */ } }
							})
							player.setVideoItem(item)
							player.startAnimation()
						} catch (e) { reject(e); return }
						resolve(handle)
					}
					try {
						giftSvgaParser.load(url, onLoaded, function () { reject(new Error('SVGA parse failed: ' + url)) })
					} catch (e) { reject(e) }
				})
			}).catch(function (err) {
				try { if (opts.onError) opts.onError(err) } catch (e) { /* ignore */ }
				if (!opts.silent) giftFaultToast('parse', 'SVGA 素材无法播放', '')
				if (typeof opts.onFault === 'function') { try { opts.onFault() } catch (e) { /* ignore */ } }
				return handle
			})
		}

		// ---------- gift effect layer (todo 13) ----------
		// Independent DOM layer inside .dsh-danmaku-root, stacked above the
		// danmaku layer (z-index 5) and below ball(30)/pop(31)/modal(10000+).
		// It is pointer-transparent and never listens for pointer events, so it
		// does not become a "window" for the pointerOverWindow guard.
		// Content mounting dispatches on asset.kind (todo 14): svga/image/svg
		// adapters, with a placeholder fallback when no playable asset is given.
		var GIFT_QUEUE_MAX = 10
		var GIFT_ANCHORS = {
			center: [0.5, 0.5],
			top: [0.5, 0.15],
			bottom: [0.5, 0.85],
			'top-left': [0.15, 0.15],
			'top-right': [0.85, 0.15],
			'bottom-left': [0.15, 0.85],
			'bottom-right': [0.85, 0.85]
		}
		var GIFT_RANDOM_KEYS = Object.keys(GIFT_ANCHORS)
		var giftActive = []
		var giftQueue = []
		var giftSeq = 0
		var giftLayerEl = null
		// Live config ref handed over by DanmakuOverlay each render; falls back to
		// DEFAULTS before the overlay mounts.
		var giftRuntime = { configRef: null }

		function giftShortSide() {
			var w = (typeof window !== 'undefined' && window.innerWidth) || 0
			var h = (typeof window !== 'undefined' && window.innerHeight) || 0
			return Math.max(1, Math.min(w, h) || 600)
		}

		function giftMaxConcurrent() {
			var cfg = (giftRuntime.configRef && giftRuntime.configRef.current) || DEFAULTS
			var n = Math.floor(Number(cfg && cfg.giftMaxConcurrent))
			if (!Number.isFinite(n)) n = DEFAULTS.giftMaxConcurrent
			return Math.max(1, Math.min(10, n))
		}

		// Sender name label toggle (todo 15). Default on; explicit false hides.
		function giftShowSenderEnabled() {
			var cfg = (giftRuntime.configRef && giftRuntime.configRef.current) || DEFAULTS
			return !(cfg && cfg.giftShowSender === false)
		}

		// ---------- gift tip danmaku (todo 16) ----------
		// Inline twin of gift-lib.js renderGiftTip (canonical + node-tested
		// there). client.js is a __ModuleLoader__ factory and cannot import Node
		// modules, so this MUST stay behavior-equivalent. GIFT_TIP_MAX is
		// mirrored from gift-lib.js — keep both in lockstep.
		var GIFT_TIP_MAX = 60
		function renderGiftTip(template, user, gift) {
			var tpl = template == null ? '' : String(template)
			var t = tpl.trim() ? tpl : DEFAULTS.giftTemplate
			return t
				.split('{user}').join(user == null ? '' : String(user))
				.split('{gift}').join(gift == null ? '' : String(gift))
				.slice(0, GIFT_TIP_MAX)
		}

		// ---------- gift sender presets (todo 19) ----------
		// Inline twins of gift-lib.js pickSender / parseSenderBatch /
		// formatSenderBatch (canonical + node-tested there). client.js is a
		// __ModuleLoader__ factory and cannot import Node modules, so these MUST
		// stay behavior-equivalent. GIFT_SENDERS_MAX / GIFT_SENDER_NAME_MAX are
		// mirrored from gift-lib.js — keep all in lockstep. Behavior parity is
		// browser-verified by tools/verify-gift-config.mjs (todo 21 skeleton).
		var GIFT_SENDERS_MAX = 50
		var GIFT_SENDER_NAME_MAX = 24
		var GIFT_ANONYMOUS_SENDER = '匿名'
		function giftSenderWeight(s) {
			var n = Number(s && s.weight)
			if (!Number.isFinite(n)) return 1
			return n > 0 ? n : 0
		}
		function pickSender(senders, rand) {
			var rnd = typeof rand === 'function' ? rand : Math.random
			var list = (Array.isArray(senders) ? senders : []).filter(function (s) {
				return s && typeof s === 'object' && String(s.name == null ? '' : s.name).trim() !== ''
			})
			if (!list.length) return GIFT_ANONYMOUS_SENDER
			function draw() {
				var r = Number(rnd())
				return Number.isFinite(r) ? Math.min(Math.max(r, 0), 0.999999999) : 0
			}
			var total = 0
			for (var i = 0; i < list.length; i++) total += giftSenderWeight(list[i])
			if (total <= 0) {
				return String(list[Math.min(list.length - 1, Math.floor(draw() * list.length))].name)
			}
			var target = draw() * total
			for (var j = 0; j < list.length; j++) {
				target -= giftSenderWeight(list[j])
				if (target < 0) return String(list[j].name)
			}
			return String(list[list.length - 1].name)
		}
		function parseSenderBatch(text) {
			var out = []
			var invalid = []
			var overflow = 0
			var lines = String(text == null ? '' : text).split(/[\n\r,，、]+/)
			for (var i = 0; i < lines.length; i++) {
				var trimmed = lines[i].trim()
				if (!trimmed) continue
				var name = trimmed
				var weight = 1
				var star = trimmed.lastIndexOf('*')
				if (star >= 0) {
					var wRaw = trimmed.slice(star + 1).trim()
					name = trimmed.slice(0, star).trim()
					var w = Number(wRaw)
					if (wRaw === '' || !Number.isFinite(w)) {
						invalid.push({ line: i + 1, raw: trimmed, reason: 'bad_weight' })
						continue
					}
					weight = w > 0 ? w : 0
				}
				if (!name) {
					invalid.push({ line: i + 1, raw: trimmed, reason: 'empty_name' })
					continue
				}
				if (out.length >= GIFT_SENDERS_MAX) { overflow++; continue }
				out.push({ name: name.slice(0, GIFT_SENDER_NAME_MAX), weight: weight })
			}
			return { senders: out, invalid: invalid, overflow: overflow }
		}
		function formatSenderBatch(senders) {
			return (Array.isArray(senders) ? senders : [])
				.filter(function (s) {
					return s && typeof s === 'object' && String(s.name == null ? '' : s.name).trim() !== ''
				})
				.map(function (s) {
					var w = Number(s.weight)
					return Number.isFinite(w) && w !== 1 ? String(s.name) + '*' + w : String(s.name)
				})
				.join('\n')
		}

		// Emit a gift tip danmaku through the active renderer. kind='gift' reuses
		// the SC pill path in all three backends; the layout comes from
		// config.giftLayout (default roll) — gift is never forced to 'top'.
		// Returns the rendered text (debug/acceptance), or null when no renderer.
		function spawnGiftTip(senderName, giftName) {
			var config = (giftRuntime.configRef && giftRuntime.configRef.current) || DEFAULTS
			// Master switch (todo 17): giftEnabled=false -> zero action. This is the
			// gift tip danmaku entry point; the effect layer's playGiftEffect stays
			// raw debug (t13 ruling) and its switch constraint closes in t20/t24.
			if (config.giftEnabled !== true) return null
			var renderer = giftRuntime.rendererRef && giftRuntime.rendererRef.current
			if (!renderer || typeof renderer.spawn !== 'function') return null
			var content = renderGiftTip(config.giftTemplate, senderName, giftName)
			renderer.spawn([{
				content: content,
				kind: 'gift',
				source: 'gift',
				layout: pickLayout(config.giftLayout)
			}])
			return content
		}

		// ---------- gift simulator (todo 20) ----------
		// Manual `triggerGift({giftId?})` + a random ambient dice that hooks the
		// EXISTING ambient scheduling loop (DanmakuOverlay) — never a second
		// timer. The dice participates ONLY when giftEnabled && giftTrigger.random
		// and its draw is independent from the danmaku ambient dice. A trigger
		// picks a gift among BOUND gifts only (an empty assetId is skipped),
		// reuses the todo-19 pickSender + the todo-16 tip template path, and fires
		// playGiftEffect (todo 13) together with spawnGiftTip (todo 16).
		var giftSimCatalog = null
		var giftSimCatalogPromise = null
		function giftSimLoadCatalog() {
			if (giftSimCatalog) return Promise.resolve(giftSimCatalog)
			if (giftSimCatalogPromise) return giftSimCatalogPromise
			giftSimCatalogPromise = fetchJson('/api/danmaku/gift/catalog').then(function (d) {
				giftSimCatalog = (d && d.gifts) || []
				giftSimCatalogPromise = null
				return giftSimCatalog
			}).catch(function () { giftSimCatalogPromise = null; return [] })
			return giftSimCatalogPromise
		}
		// Best-effort asset metadata so the bound asset actually plays; a bare id
		// still yields the placeholder effect when the store lookup misses.
		var giftSimAssets = null
		var giftSimAssetsPromise = null
		function giftSimLoadAssets() {
			if (giftSimAssets) return Promise.resolve(giftSimAssets)
			if (giftSimAssetsPromise) return giftSimAssetsPromise
			giftSimAssetsPromise = fetchJson('/api/danmaku/gift/assets').then(function (d) {
				giftSimAssets = (d && d.items) || []
				giftSimAssetsPromise = null
				return giftSimAssets
			}).catch(function () { giftSimAssetsPromise = null; return [] })
			return giftSimAssetsPromise
		}
		// Gift ids whose binding carries a non-empty assetId (unbound skipped).
		function giftSimBoundIds(bindings) {
			var b = bindings && typeof bindings === 'object' && !Array.isArray(bindings) ? bindings : {}
			return Object.keys(b).filter(function (k) {
				var v = b[k]
				return v && typeof v === 'object' && String(v.assetId == null ? '' : v.assetId) !== ''
			})
		}
		// Pure selector (exposed for acceptance): pick one BOUND gift from the
		// catalog. Returns { giftId, giftName, binding } or null when nothing is
		// bound. Unbound/unresolvable entries are never eligible.
		function pickGiftForSim(bindings, catalog, rand) {
			var ids = giftSimBoundIds(bindings)
			if (!ids.length) return null
			var rnd = typeof rand === 'function' ? rand : Math.random
			var r = Number(rnd())
			if (!Number.isFinite(r)) r = 0
			r = Math.min(Math.max(r, 0), 0.999999999)
			var giftId = ids[Math.floor(r * ids.length)]
			var list = Array.isArray(catalog) ? catalog : []
			var name = ''
			for (var i = 0; i < list.length; i++) {
				if (String(list[i].id) === giftId) { name = String(list[i].name || ''); break }
			}
			return { giftId: giftId, giftName: name || ('礼物 ' + giftId), binding: bindings[giftId] }
		}

		var giftSimStats = { triggered: 0, last: null }
		function giftSimState() { return { triggered: giftSimStats.triggered, last: giftSimStats.last } }

		// Manual trigger. Returns a Promise resolving to the trigger record (or
		// null when the master switch is off / nothing is bound). A specified
		// giftId must itself be bound, else it is skipped — never auto-substituted.
		function triggerGift(opts) {
			opts = opts && typeof opts === 'object' ? opts : {}
			var config = (giftRuntime.configRef && giftRuntime.configRef.current) || DEFAULTS
			if (config.giftEnabled !== true) return Promise.resolve(null)
			var bindings = config.giftBindings || {}
			var wanted = opts.giftId != null ? String(opts.giftId) : ''
			return Promise.all([giftSimLoadCatalog(), giftSimLoadAssets()]).then(function (res) {
				var catalog = res[0]
				var assets = res[1]
				var chosen = null
				if (wanted) {
					var wb = bindings[wanted]
					if (!wb || String(wb.assetId == null ? '' : wb.assetId) === '') return null
					var wn = ''
					for (var wi = 0; wi < catalog.length; wi++) {
						if (String(catalog[wi].id) === wanted) { wn = String(catalog[wi].name || ''); break }
					}
					chosen = { giftId: wanted, giftName: wn || ('礼物 ' + wanted), binding: wb }
				} else {
					chosen = pickGiftForSim(bindings, catalog, opts.rand)
				}
				if (!chosen) return null
				var bind = chosen.binding || {}
				var asset = null
				for (var ai = 0; ai < assets.length; ai++) {
					if (String(assets[ai].id) === String(bind.assetId)) { asset = assets[ai]; break }
				}
				if (!asset) asset = { id: bind.assetId }
				var sender = pickSender(config.giftSenders, opts.rand)
				var effectId = playGiftEffect({
					asset: asset,
					position: bind.position || 'center',
					scale: bind.scale != null ? bind.scale : 1,
					durationMs: bind.durationMs != null ? bind.durationMs : 3000,
					loop: bind.loop === true,
					senderName: sender
				})
				var tip = spawnGiftTip(sender, chosen.giftName)
				giftSimStats.triggered++
				giftSimStats.last = {
					giftId: chosen.giftId, giftName: chosen.giftName, sender: sender,
					assetId: String(bind.assetId), effectId: effectId, tip: tip, at: Date.now()
				}
				return giftSimStats.last
			})
		}

		// Random ambient dice, driven from the ambient loop's own timer. Own
		// independent interval [minMs,maxMs] + probability so it never shares a
		// draw with the danmaku ambient path. Gate: giftEnabled && random.
		var giftSimNextEligibleAt = 0
		function maybeSpawnRandomGift() {
			var cfg = (giftRuntime.configRef && giftRuntime.configRef.current) || DEFAULTS
			var trig = cfg.giftTrigger
			if (!trig || cfg.giftEnabled !== true || trig.random !== true) return false
			var now = Date.now()
			if (now < giftSimNextEligibleAt) return false
			var minMs = Math.max(1000, Math.floor(Number(trig.minMs) || 1000))
			var maxMs = Math.max(minMs, Math.floor(Number(trig.maxMs) || minMs))
			giftSimNextEligibleAt = now + minMs + Math.floor(Math.random() * (maxMs - minMs + 1))
			var p = Number(trig.probability)
			if (!Number.isFinite(p)) p = 0
			p = Math.min(1, Math.max(0, p))
			if (p <= 0 || Math.random() > p) return false
			triggerGift({})
			return true
		}

		// Position preset -> normalized anchor. `random` draws a preset each call.
		function giftAnchorFor(position, rand) {
			var pos = position
			if (pos === 'random') {
				var r = typeof rand === 'function' ? rand() : Math.random()
				var k = Math.min(GIFT_RANDOM_KEYS.length - 1, Math.floor(Math.abs(Number(r) || 0) * GIFT_RANDOM_KEYS.length))
				pos = GIFT_RANDOM_KEYS[k]
			}
			return GIFT_ANCHORS[pos] || GIFT_ANCHORS.center
		}

		function ensureGiftLayer() {
			if (giftLayerEl && giftLayerEl.isConnected) return giftLayerEl
			if (typeof document === 'undefined') return null
			var root = document.querySelector('.dsh-danmaku-root')
			if (!root) return null
			var el = root.querySelector('.dsh-gift-layer')
			if (!el) {
				el = document.createElement('div')
				el.className = 'dsh-gift-layer'
				el.setAttribute('data-gift-layer', '1')
				root.appendChild(el)
			}
			giftLayerEl = el
			return el
		}

		// Resolve an asset's served URL. Public items carry `url`; a bare id is
		// accepted too (host serves /api/danmaku/gift/file?id=).
		function giftAssetUrl(asset) {
			if (!asset) return ''
			if (typeof asset.url === 'string' && asset.url) return asset.url
			if (asset.id) return '/api/danmaku/gift/file?id=' + encodeURIComponent(asset.id)
			return ''
		}

		function giftPlaceholderContent(container, asset, opts) {
			var ph = document.createElement('div')
			ph.className = 'dsh-gift-effect-content dsh-gift-effect-placeholder'
			ph.setAttribute('data-gift-placeholder', '1')
			if (asset && asset.kind) ph.setAttribute('data-gift-kind', String(asset.kind))
			container.appendChild(ph)
			return {
				destroy: function () { try { if (ph.parentNode) ph.parentNode.removeChild(ph) } catch (e) { /* ignore */ } }
			}
		}

		// image (gif/apng/webp/png/jpg): natural playback via <img>. Animated
		// formats loop on their own; the effect layer's duration timer bounds
		// the lifetime either way. onFinished stays owned by the layer.
		function mountGiftImage(container, url, opts) {
			var img = document.createElement('img')
			img.className = 'dsh-gift-effect-content dsh-gift-effect-media'
			img.setAttribute('data-gift-kind', 'image')
			img.alt = ''
			img.decoding = 'async'
			img.draggable = false
			img.onerror = function () {
				if (typeof opts.onError === 'function') { try { opts.onError(new Error('image load failed')) } catch (e) { /* ignore */ } }
				if (!opts.silent) giftFaultToast('not-found', '素材无法播放', '')
				if (typeof opts.onFault === 'function') { try { opts.onFault() } catch (e) { /* ignore */ } }
			}
			img.src = url
			container.appendChild(img)
			return {
				destroy: function () { try { img.onerror = null; if (img.parentNode) img.parentNode.removeChild(img) } catch (e) { /* ignore */ } }
			}
		}

		// svg: fetch the ALREADY-SANITIZED served file and inline it. Replay is a
		// fresh injection; the file route only ever serves ingest-sanitized SVG
		// (todo 7), so no client-side sanitize is done here.
		function mountGiftSvg(container, url, opts) {
			var wrap = document.createElement('div')
			wrap.className = 'dsh-gift-effect-content dsh-gift-effect-svg'
			wrap.setAttribute('data-gift-kind', 'svg')
			container.appendChild(wrap)
			var destroyed = false
			fetch(url, { credentials: 'same-origin' })
				.then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.text() })
				.then(function (text) { if (!destroyed) wrap.innerHTML = text })
				.catch(function (err) {
					if (destroyed) return
					if (typeof opts.onError === 'function') { try { opts.onError(err) } catch (e) { /* ignore */ } }
					if (!opts.silent) giftFaultToast('not-found', 'SVG 素材无法播放', '')
					if (typeof opts.onFault === 'function') { try { opts.onFault() } catch (e) { /* ignore */ } }
				})
			return {
				destroy: function () {
					destroyed = true
					try { wrap.innerHTML = ''; if (wrap.parentNode) wrap.parentNode.removeChild(wrap) } catch (e) { /* ignore */ }
				}
			}
		}

		// svga: reuse todo 11's playSvga. playSvga resolves async; forward
		// destroy() to the resolved handle and clear the container if we tear
		// down before it resolves (no leaked player instance).
		function mountGiftSvga(container, url, opts) {
			container.setAttribute('data-gift-kind', 'svga')
			var inner = null
			var destroyed = false
			var handle = {
				destroyed: false,
				destroy: function () {
					if (destroyed) return
					destroyed = true
					handle.destroyed = true
					try {
						if (inner) inner.destroy()
						else container.innerHTML = ''
					} catch (e) { /* ignore */ }
				}
			}
			playSvga(url, container, {
				loop: opts.loop === true,
				onFinished: opts.onFinished,
				onError: opts.onError,
				onFault: opts.onFault,
				silent: opts.silent,
			}).then(function (h) {
				if (destroyed) { try { h.destroy() } catch (e) { /* ignore */ } return }
				inner = h
				handle.destroyed = h.destroyed
			})
			return handle
		}

		// Injection point for todo 14. Returns a { destroy } handle; unknown
		// kinds return { skipped:true } so the layer drops them without a
		// visual and keeps the queue moving. Throw-free by construction.
		function mountGiftEffectContent(container, asset, opts) {
			opts = opts || {}
			var kind = asset && asset.kind ? String(asset.kind) : ''
			if (!kind) return giftPlaceholderContent(container, asset, opts)
			var url = giftAssetUrl(asset)
			if (!url) return giftPlaceholderContent(container, asset, opts)
			if (kind !== 'svga' && kind !== 'image' && kind !== 'svg') {
				// Unknown kind: skip the effect (keep the queue alive), toast once.
				if (!opts.silent) giftToast('error', '未知素材类型', kind)
				return { skipped: true, destroy: function () { /* nothing mounted */ } }
			}
			// HEAD preflight (todo 18): reject missing (404) and oversized assets
			// before any content mounts, so the layer skips them cleanly instead
			// of leaving a blank effect on screen.
			var inner = null
			var destroyed = false
			var handle = {
				destroyed: false,
				destroy: function () {
					if (destroyed) return
					destroyed = true
					handle.destroyed = true
					try { if (inner && inner.destroy) inner.destroy() } catch (e) { /* ignore */ }
					try { if (!inner) container.innerHTML = '' } catch (e) { /* ignore */ }
				}
			}
			function fault(cause, title, desc) {
				if (!opts.silent) giftFaultToast(cause, title, desc)
				if (typeof opts.onFault === 'function') { try { opts.onFault() } catch (e) { /* ignore */ } }
			}
			fetch(url, { method: 'HEAD', credentials: 'same-origin' })
				.then(function (r) {
					if (destroyed) return
					if (!r.ok) { fault('not-found', '素材无法播放', 'HTTP ' + r.status); return }
					var len = Number(r.headers.get('content-length'))
					if (Number.isFinite(len) && len > giftAssetByteLimit()) {
						fault('oversize', '素材过大', Math.round(len / 1024) + 'KB')
						return
					}
					inner = kind === 'svga' ? mountGiftSvga(container, url, opts)
						: kind === 'image' ? mountGiftImage(container, url, opts)
							: mountGiftSvg(container, url, opts)
					if (destroyed) { try { if (inner && inner.destroy) inner.destroy() } catch (e) { /* ignore */ } }
				})
				.catch(function () { if (!destroyed) fault('not-found', '素材无法播放', '') })
			return handle
		}

		function finishGiftEffect(rec) {
			if (!rec || rec.done) return
			rec.done = true
			if (rec.timer) { clearTimeout(rec.timer); rec.timer = null }
			if (rec.content && typeof rec.content.destroy === 'function') {
				try { rec.content.destroy() } catch (e) { /* ignore */ }
			}
			try { if (rec.el && rec.el.parentNode) rec.el.parentNode.removeChild(rec.el) } catch (e) { /* ignore */ }
			rec.el = null
			var i = giftActive.indexOf(rec)
			if (i >= 0) giftActive.splice(i, 1)
			pumpGiftQueue()
		}

		function startGiftEffect(rec, layer) {
			var o = rec.opts || {}
			var scale = giftNum(o.scale, 0.25, 2, 1)
			var durationMs = Math.floor(giftNum(o.durationMs, 500, 60000, 3000))
			var loop = o.loop === true
			var anchor = giftAnchorFor(o.position)
			var posName = o.position === 'random' ? 'random' : (GIFT_ANCHORS[o.position] ? o.position : 'center')
			// Base height = viewport short side x 0.5; `scale` is a multiplier.
			var size = Math.max(1, Math.round(giftShortSide() * 0.5 * scale))
			var el = document.createElement('div')
			el.className = 'dsh-gift-effect'
			el.setAttribute('data-gift-id', rec.id)
			el.setAttribute('data-position', posName)
			el.setAttribute('data-loop', loop ? '1' : '0')
			el.setAttribute('data-scale', String(scale))
			el.setAttribute('data-duration-ms', String(durationMs))
			el.style.left = (anchor[0] * 100) + '%'
			el.style.top = (anchor[1] * 100) + '%'
			el.style.width = size + 'px'
			el.style.height = size + 'px'
			layer.appendChild(el)
			rec.el = el
			try {
				rec.content = mountGiftEffectContent(el, o.asset || null, {
					loop: loop, durationMs: durationMs, scale: scale,
					onFault: function () { finishGiftEffect(rec) }
				})
			} catch (e) { rec.content = null }
			// Sender name label (todo 15): only the name, at the anchor's lower
			// edge, pointer-transparent. "送出了 xx" belongs to the tip danmaku.
			if (giftShowSenderEnabled()) {
				var nm = o.senderName == null ? '' : String(o.senderName).trim()
				var label = document.createElement('div')
				label.className = 'dsh-gift-sender-label'
				label.setAttribute('data-gift-sender', '1')
				label.textContent = (nm || '匿名').slice(0, 24)
				el.appendChild(label)
			}
			rec.started = true
			giftActive.push(rec)
			// Unknown kind: drop immediately, no visual, queue keeps moving.
			if (rec.content && rec.content.skipped) { finishGiftEffect(rec); return }
			// Lifetime is bounded by durationMs; loop repeats content until then.
			rec.timer = setTimeout(function () { finishGiftEffect(rec) }, durationMs)
		}

		function pumpGiftQueue() {
			if (!giftQueue.length) return
			var layer = ensureGiftLayer()
			if (!layer) return
			var max = giftMaxConcurrent()
			while (giftQueue.length && giftActive.length < max) {
				startGiftEffect(giftQueue.shift(), layer)
			}
		}

		// Play one gift effect. Returns the instance id, or null when dropped
		// (no overlay root, or active+queued already at capacity). Malformed
		// input never throws — it degrades to the defaults.
		function playGiftEffect(opts) {
			opts = opts && typeof opts === 'object' ? opts : {}
			var layer = ensureGiftLayer()
			if (!layer) return null
			var rec = { id: 'gift_' + (++giftSeq), opts: opts, el: null, content: null, timer: null, done: false, started: false }
			if (giftActive.length < giftMaxConcurrent()) {
				startGiftEffect(rec, layer)
			} else if (giftQueue.length < GIFT_QUEUE_MAX) {
				giftQueue.push(rec)
			} else {
				return null
			}
			return rec.id
		}

		function giftEffectStats() {
			return {
				active: giftActive.map(function (r) { return r.id }),
				queued: giftQueue.map(function (r) { return r.id }),
				max: giftMaxConcurrent()
			}
		}

		// Debug handle: scripted acceptance + manual QA call these from the page.
		try {
			window.__dshGift = {
				loadSvgaPlayer: loadSvgaPlayer,
				playSvga: playSvga,
				vendorUrl: GIFT_VENDOR_SVGA,
				playGiftEffect: playGiftEffect,
				// Gift tip danmaku (todo 16): debug/acceptance spawner.
				spawnGiftTip: spawnGiftTip,
				getLayer: ensureGiftLayer,
				giftStats: giftEffectStats,
				// Debug-only: lets acceptance flip live config flags (e.g.
				// giftShowSender) without a settings round-trip.
				runtime: giftRuntime,
				// Debug-only: clears the same-cause fault-toast throttle so
				// acceptance can test each cause in isolation.
				resetGiftFaults: giftResetFaults,
				// Test mount points (todo 8/9): the future big modal embeds these directly.
				mountImportToolbar: function (container) {
					return mountGiftUi(GiftImportToolbar, { showToast: giftToast }, container)
				},
				mountAssetsPanel: function (container) {
					return mountGiftUi(GiftAssetsPanel, { onToast: giftToast }, container)
				},
				// Sender presets (todo 19): canonical twins + a mountable editor
				// section the big modal (todo 23) composes. Exposed so the
				// acceptance script can assert behavior parity + drive the UI.
				pickSender: pickSender,
				parseSenderBatch: parseSenderBatch,
				formatSenderBatch: formatSenderBatch,
				mountSendersEditor: function (container, opts) {
					return mountGiftUi(GiftSendersEditor, opts || {}, container)
				},
				// Catalog list (todo 21): the big modal's left column. Exposed so
				// the acceptance script can mount it and assert search/filter/lazy.
				mountCatalogList: function (container, opts) {
					return mountGiftUi(GiftCatalogList, opts || {}, container)
				},
				// Gift simulator (todo 20): manual trigger + a tiny state probe for
				// acceptance. `pickGiftForSim` is the pure bound-only selector.
				triggerGift: triggerGift,
				pickGiftForSim: pickGiftForSim,
				giftSimState: giftSimState,
				// Binding + effect params panel (todo 22): the big modal's right-pane
				// middle section. Exposed so acceptance can mount + drive it.
				mountBindingPanel: function (container, opts) {
					return mountGiftUi(GiftBindingPanel, opts || {}, container)
				},
				previewStats: function () { return { active: giftPreview.handle ? 1 : 0, pending: !!giftPreview.timer, url: giftPreview.url || '' } },
				finishAll: function () {
					while (giftActive.length) finishGiftEffect(giftActive[0])
					giftQueue.length = 0
				}
			}
		} catch (e) { /* ignore */ }

		// Shared backdrop close guard (ruling C): a text-selection drag that
		// starts inside an input must not close the modal, and a blank-area
		// click while an input/textarea/select still holds focus only blurs
		// (the browser already did) — a second blank click then closes.
		function backdropCloseProps(onClose) {
			var downOnBackdrop = false
			var blurOnly = false
			function reset() {
				downOnBackdrop = false
				blurOnly = false
			}
			return {
				onMouseDown: function (e) {
					if (e.target !== e.currentTarget) {
						downOnBackdrop = false
					} else {
						downOnBackdrop = true
						blurOnly = e.currentTarget.contains(document.activeElement) &&
							/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName)
					}
				},
				onClick: function (e) {
					if (e.target !== e.currentTarget || !downOnBackdrop) { reset(); return }
					if (blurOnly) { reset(); return }
					if (String(window.getSelection()) !== '') { reset(); return }
					reset()
					onClose()
				}
			}
		}

		// ---------- Pointer priority ----------
		// A window stacked above the overlay layer (plugin modal, dsh native
		// dialog, floating panel/pop) must own the pointer. The webgl backends
		// hit-test every pointer event on document capture — stacking-order-blind
		// — so without this guard a click aimed at a window above still hit a
		// danmaku behind it, mis-fired onHit and swallowed the click via
		// stopPropagation. Walk the target's ancestors: any numeric z-index above
		// the shell overlay layer's means a window owns the event — yield without
		// preventDefault/stopPropagation. Fail open for body/html/non-element
		// targets so the bare conversation area keeps working exactly as before.
		var overlayLayerZ = 20
		function pointerOverWindow(ev) {
			var n = ev && ev.target
			if (!n || n.nodeType !== 1) return false
			if (n === document.body || n === document.documentElement) return false
			for (; n && n !== document.body; n = n.parentElement) {
				var z = parseFloat(getComputedStyle(n).zIndex)
				if (isFinite(z) && z > overlayLayerZ) return true
			}
			return false
		}

		// ---------- DOM renderer ----------
		function createDomRenderer() {
			var hostEl = null
			var layer = null
			var config = clampConfig(DEFAULTS)
			var items = new Map()
			var rollTracks = []
			var reverseTracks = []
			var topTracks = []
			var bottomTracks = []
			var onHit = null
			var seq = 0
			var enabled = true
			var idleAlpha = 1

			function lineH() {
				return Math.max(18, Math.floor(config.fontSize * 1.6))
			}

			function rollBandHeight() {
				var h = layer ? layer.clientHeight : 200
				return Math.max(lineH(), Math.floor(h * (config.areaRatio || 0.5)))
			}

			function resetTracks() {
				var lh = lineH()
				var rollN = Math.max(1, Math.min(MAX_TRACKS, Math.floor(rollBandHeight() / lh)))
				var fullH = layer ? layer.clientHeight : 200
				var fullN = Math.max(1, Math.min(MAX_TRACKS, Math.floor(fullH / lh)))
				rollTracks = []
				reverseTracks = []
				topTracks = []
				bottomTracks = []
				for (var i = 0; i < rollN; i++) {
					rollTracks.push(null)
					reverseTracks.push(null)
				}
				for (var j = 0; j < fullN; j++) {
					topTracks.push(null)
					bottomTracks.push(null)
				}
			}

			function pickTrack(nowMs, width, layout) {
				var list = layout === 'roll' ? rollTracks
					: layout === 'reverse' ? reverseTracks
					: layout === 'top' ? topTracks : bottomTracks
				var viewportW = layer.clientWidth || 800
				for (var i = 0; i < list.length; i++) {
					var last = list[i]
					if (!last) return i
					var elapsed = (nowMs - last.spawnAt) / 1000
					if (layout === 'roll' || layout === 'reverse') {
						var gapSec = (last.width + width + 12) / Math.max(last.v || config.scrollSpeed, 1)
						if (elapsed >= gapSec) return i
					} else if (elapsed >= (last.durationMs || 4000) * 0.85 / 1000) {
						return i
					}
				}
				return -1
			}

			function markTrack(track, layout, data) {
				if (layout === 'roll') rollTracks[track] = data
				else if (layout === 'reverse') reverseTracks[track] = data
				else if (layout === 'top') topTracks[track] = data
				else bottomTracks[track] = data
			}

			function spawnOne(item) {
				if (!layer || !enabled) return
				if (items.size >= config.maxOnscreen) return
				var isEmoji = item.kind === 'emoji' || !!item.emojiUrl
				var raw = isEmoji
					? String(item.content || 'emoji').slice(0, 24)
					: filterEmoji(item.content, config.allowEmoji)
				if (!raw) return
				if (!isEmoji && isBlocked(raw, config.blockedWords)) return
				var kind = item.kind || 'normal'
				var source = item.source || 'preset'
				var content = raw
				if (config.debugSource && !isEmoji) {
					var badge = source === 'ai' ? '🤖' : source === 'user' ? '💬' : '📺'
					content = badge + ' ' + raw
				}
				var id = 'dm_' + (++seq)
				var layout = item.layout || pickLayout(config.layoutWeights)
				if (kind === 'sc') layout = 'top'
				if (isEmoji) layout = item.layout || 'roll'
				var el = document.createElement('div')
				el.className = 'dsh-danmaku-item'
				el.dataset.id = id
				el.dataset.layout = layout
				el.dataset.kind = kind
				el.dataset.stroke = (isEmoji || kind === 'sc' || kind === 'gift' || !config.stroke) ? '0' : '1'
				el.dataset.spawnSpeed = String(config.scrollSpeed || 140)
				var textEl = document.createElement('span')
				textEl.className = 'dsh-danmaku-text'
				if (isEmoji && item.emojiUrl) {
					var img = document.createElement('img')
					img.src = item.emojiUrl
					img.alt = content
					var base = Number(config.emojiBaseSize) || 48
					var scale = (Number(config.fontSize) || 16) / 16
					var px = Math.max(16, Math.min(160, Math.round(base * scale)))
					img.style.height = px + 'px'
					img.style.width = 'auto'
					img.style.display = 'block'
					img.style.opacity = String((kind === 'sc' || kind === 'gift') ? 1 : config.opacity * idleAlpha)
					textEl.appendChild(img)
					textEl.style.opacity = '1'
				} else {
					textEl.textContent = content
					textEl.style.opacity = String((kind === 'sc' || kind === 'gift') ? 1 : config.opacity * idleAlpha)
				}
				el.appendChild(textEl)
				if (!isEmoji) {
					el.style.fontSize = (kind === 'sc' ? config.fontSize + 2 : config.fontSize) + 'px'
					el.style.color = item.color || pickColor(config)
				}
				// Advanced style on inner wrapper (rotate/scale must not fight roll keyframe)
				var adv = null
				// gift never takes advanced styles: keeps the "alpha stays 1"
				// invariant (advOpacity would otherwise dim the pill).
				if (!isEmoji && kind !== 'sc' && kind !== 'gift' && config.advancedEnabled) {
					adv = pickAdvancedStyle(config.advancedStyles)
				}
				if (adv && adv.mode && adv.mode !== 'scroll' && (layout === 'roll' || layout === 'reverse')) {
					layout = adv.mode
					el.dataset.layout = layout
				}
				if (adv) {
					var inner = document.createElement('div')
					inner.className = 'dsh-danmaku-inner'
					el.insertBefore(inner, textEl)
					inner.appendChild(textEl)
					var tf = []
					if (adv.rotate) tf.push('rotate(' + Number(adv.rotate) + 'deg)')
					if (adv.scale && adv.scale !== 1) tf.push('scale(' + Number(adv.scale) + ')')
					if (tf.length) inner.style.transform = tf.join(' ')
					if (adv.bold) {
						inner.style.fontWeight = '700'
						textEl.style.fontWeight = '700'
					}
					if (adv.font) {
						el.style.fontFamily = String(adv.font)
					}
					if (adv.opacity != null && adv.opacity < 1) {
						el.dataset.advOpacity = String(adv.opacity)
						textEl.style.opacity = String(config.opacity * idleAlpha * Number(adv.opacity))
					}
				}
				layer.appendChild(el)
				var width = el.offsetWidth || (content.length * config.fontSize)
				var now = performance.now()
				var lh = lineH()
				var fullH = layer.clientHeight || 400
				var speed = Math.max(40, Number(config.scrollSpeed) || 140)
				var durationSec

				if (adv && adv.mode === 'rain') {
					durationSec = Math.max(1, Math.min(8, (Number(adv.durationMs) || 4000) / 1000))
					var rainX = Math.random() * Math.max(20, (layer.clientWidth || 800) - width)
					el.style.left = rainX + 'px'
					el.style.top = '-48px'
					el.style.setProperty('--dsh-danmaku-dy', (fullH + 60) + 'px')
					el.style.animation = 'dsh-danmaku-rain linear ' + durationSec + 's forwards'
					// lifetime: duration + grace; tryRemoveDom handles cleanup
					var lifetimeRain = durationSec * 1000 + 300
					// fall through to shared remove hooks below by faking track skip
				} else if (adv && adv.mode === 'pop') {
					durationSec = Math.max(1, Math.min(8, (Number(adv.durationMs) || 4000) / 1000))
					var lw = layer.clientWidth || 800
					var lh2 = layer.clientHeight || 400
					// Full-screen random placement
					var pxp = Math.random() * Math.max(20, lw - width)
					var pyp = Math.random() * Math.max(20, lh2 - lineH())
					el.style.left = Math.max(0, Math.min(lw - width, pxp)) + 'px'
					el.style.top = Math.max(0, Math.min(lh2 - lineH(), pyp)) + 'px'
					el.style.animation = 'dsh-danmaku-pop ease-in-out ' + durationSec + 's forwards'
				} else {
				var track = pickTrack(now, width, layout)
				if (track < 0) {
					el.remove()
					return
				}
				var y
				if (layout === 'roll' || layout === 'reverse') {
					y = track * lh + 2
				} else if (layout === 'top') {
					y = track * lh + 2
				} else {
					y = Math.max(0, fullH - (track + 1) * lh - 2)
				}

				if (layout === 'roll') {
					var viewportW = layer.clientWidth || 800
					durationSec = (viewportW + width + 24) / speed
					durationSec = Math.max(2, Math.min(20, durationSec))
					var dx = -(viewportW + width + 24)
					el.style.setProperty('--dsh-danmaku-dx', dx + 'px')
					el.style.top = y + 'px'
					el.style.left = (viewportW + 4) + 'px'
					el.style.animation = 'dsh-danmaku-roll linear ' + durationSec + 's forwards, dsh-danmaku-fade linear ' + durationSec + 's forwards'
					markTrack(track, layout, { width: width, v: speed, spawnAt: now, durationMs: durationSec * 1000 })
				} else if (layout === 'reverse') {
					var vw2 = layer.clientWidth || 800
					durationSec = (vw2 + width + 24) / speed
					durationSec = Math.max(2, Math.min(20, durationSec))
					var dxR = vw2 + width + 24
					el.style.setProperty('--dsh-danmaku-dx', dxR + 'px')
					el.style.top = y + 'px'
					el.style.left = (-width - 4) + 'px'
					el.style.animation = 'dsh-danmaku-reverse linear ' + durationSec + 's forwards, dsh-danmaku-fade linear ' + durationSec + 's forwards'
					markTrack(track, layout, { width: width, v: speed, spawnAt: now, durationMs: durationSec * 1000 })
				} else {
					durationSec = 4
					el.style.top = y + 'px'
					el.style.transform = 'translateX(-50%)'
					el.style.animation = 'dsh-danmaku-fade linear 4s forwards'
					markTrack(track, layout, { width: width, v: 0, spawnAt: now, durationMs: 4000 })
				}
				} // end scroll track modes

				function isPausedRec() {
					return el.dataset.hover === '1' || el.dataset.uiHold === '1' || el.style.animationPlayState === 'paused'
				}

				if (config.hoverPause) {
					el.addEventListener('pointerenter', function () {
						el.style.animationPlayState = 'paused'
						el.dataset.hover = '1'
					})
					el.addEventListener('pointerleave', function () {
						// Always drop hover — even while uiHold — so resumeOne can recover.
						el.dataset.hover = '0'
						if (el.dataset.uiHold === '1') return
						el.style.animationPlayState = 'running'
					})
				}

				el.addEventListener('click', function (e) {
					e.stopPropagation()
					if (onHit) onHit(id, { content: content, source: source, id: id, kind: kind, at: Date.now() })
				})
				el.addEventListener('dblclick', function (e) {
					e.stopPropagation()
					if (onHit) onHit(id, { content: content, source: source, id: id, kind: kind, action: 'like', at: Date.now() })
				})
				items.set(id, { el: el, meta: { content: content, source: source, id: id, kind: kind } })
				var lifetime = durationSec * 1000 + 300
				// Bilibili-like: while paused (hover or detail lock), never remove.
				// Only GC after resume and the CSS animations finish.
				function tryRemoveDom() {
					var rec = items.get(id)
					if (!rec) return
					if (isPausedRec()) {
						setTimeout(tryRemoveDom, 400)
						return
					}
					var anims = null
					try {
						anims = rec.el.getAnimations ? rec.el.getAnimations() : null
					} catch (e) { /* ignore */ }
					if (anims && anims.length) {
						var allDone = true
						for (var i = 0; i < anims.length; i++) {
							if (anims[i].playState !== 'finished') {
								allDone = false
								break
							}
						}
						if (!allDone) {
							setTimeout(tryRemoveDom, 300)
							return
						}
					}
					rec.el.remove()
					items.delete(id)
				}
				el.addEventListener('animationend', function (e) {
					var n = e.animationName
					if (n === 'dsh-danmaku-fade' || n === 'dsh-danmaku-roll' || n === 'dsh-danmaku-reverse' || n === 'dsh-danmaku-rain' || n === 'dsh-danmaku-pop') {
						tryRemoveDom()
					}
				})
				setTimeout(tryRemoveDom, lifetime)
			}

			function applyIdle() {
				items.forEach(function (rec) {
					if (rec.el.dataset.kind === 'sc' || rec.el.dataset.kind === 'gift') return
					var textEl = rec.el.querySelector('.dsh-danmaku-text')
					if (!textEl) return
					var mult = rec.el.dataset.advOpacity != null ? Number(rec.el.dataset.advOpacity) : 1
					if (!Number.isFinite(mult)) mult = 1
					textEl.style.opacity = String(config.opacity * idleAlpha * mult)
				})
			}

			function applyScrollSpeedLive(newSpeed, oldSpeed) {
				if (!newSpeed || !oldSpeed || newSpeed === oldSpeed) return
				var ratio = newSpeed / oldSpeed
				items.forEach(function (rec) {
					var lay = rec.el.dataset.layout
					if (lay !== 'roll' && lay !== 'reverse') return
					try {
						var anims = rec.el.getAnimations && rec.el.getAnimations()
						if (!anims || !anims.length) return
						for (var i = 0; i < anims.length; i++) {
							var a = anims[i]
							var name = a.animationName || ''
							if (name === 'dsh-danmaku-roll' || name === 'dsh-danmaku-reverse') {
								a.playbackRate = ratio
							}
						}
					} catch (e) { /* ignore */ }
				})
			}

			return {
				kind: 'dom',
				mount: function (host) {
					hostEl = host
					layer = document.createElement('div')
					layer.className = 'dsh-danmaku-layer'
					layer.style.left = '0'
					layer.style.right = '0'
					layer.style.top = '0'
					layer.style.bottom = '0'
					hostEl.appendChild(layer)
					resetTracks()
				},
				unmount: function () {
					items.forEach(function (rec) { rec.el.remove() })
					items.clear()
					if (layer && layer.parentNode) layer.parentNode.removeChild(layer)
					layer = null
					hostEl = null
				},
				resize: function (w, h, areaRatio) {
					if (!layer) return
					if (areaRatio) config.areaRatio = areaRatio
					// Layer always covers full host height; area_ratio only limits roll tracks.
					layer.style.width = w + 'px'
					layer.style.height = Math.max(80, Math.floor(h)) + 'px'
					resetTracks()
				},
				setConfig: function (c) {
					var prevSpeed = config.scrollSpeed
					config = clampConfig(Object.assign({}, config, c))
					resetTracks()
					if (layer) {
						items.forEach(function (rec) {
							rec.el.style.fontSize = config.fontSize + 'px'
							rec.el.dataset.stroke = config.stroke && rec.el.dataset.kind !== 'sc' && rec.el.dataset.kind !== 'gift' ? '1' : '0'
							var textEl = rec.el.querySelector('.dsh-danmaku-text')
							if (textEl && rec.el.dataset.kind !== 'sc' && rec.el.dataset.kind !== 'gift') {
								var mult = rec.el.dataset.advOpacity != null ? Number(rec.el.dataset.advOpacity) : 1
								if (!Number.isFinite(mult)) mult = 1
								textEl.style.opacity = String(config.opacity * idleAlpha * mult)
							}
						})
					}
					applyScrollSpeedLive(config.scrollSpeed, prevSpeed)
				},
				setEnabled: function (on) {
					enabled = !!on
					if (!enabled) this.clear()
					if (layer) layer.style.display = enabled ? 'block' : 'none'
				},
				spawn: function (list) {
					if (!enabled) return
					;(list || []).forEach(spawnOne)
				},
				clear: function () {
					items.forEach(function (rec) { rec.el.remove() })
					items.clear()
					resetTracks()
				},
				setIdleAlpha: function (a) {
					idleAlpha = Math.min(1, Math.max(0, Number(a)))
					applyIdle()
				},
				onHit: function (cb) { onHit = cb },
				getLayer: function () { return layer },
				pauseAll: function () {
					items.forEach(function (rec) {
						rec.el.dataset.uiHold = '1'
						rec.el.style.animationPlayState = 'paused'
					})
				},
				resumeAll: function () {
					items.forEach(function (rec) {
						rec.el.dataset.uiHold = '0'
						var hovered = false
						try { hovered = rec.el.matches(':hover') } catch (e) { /* ignore */ }
						if (hovered) {
							rec.el.dataset.hover = '1'
							rec.el.style.animationPlayState = 'paused'
						} else {
							rec.el.dataset.hover = '0'
							rec.el.style.animationPlayState = 'running'
						}
					})
				},
				pauseOne: function (id) {
					var rec = items.get(id)
					if (!rec) return
					rec.el.dataset.uiHold = '1'
					rec.el.style.animationPlayState = 'paused'
				},
				resumeOne: function (id) {
					var rec = items.get(id)
					if (!rec) return
					rec.el.dataset.uiHold = '0'
					var hovered = false
					try { hovered = rec.el.matches(':hover') } catch (e) { /* ignore */ }
					if (hovered) {
						rec.el.dataset.hover = '1'
						rec.el.style.animationPlayState = 'paused'
					} else {
						rec.el.dataset.hover = '0'
						rec.el.style.animationPlayState = 'running'
					}
				},
				removeOne: function (id) {
					var rec = items.get(id)
					if (!rec) return
					rec.el.remove()
					items.delete(id)
				},
				stats: function () { return { onscreen: items.size, kind: 'dom' } }
			}
		}

		// ---------- WebGL2 renderer (single canvas, GPU composite; DOM fallback) ----------
		// ---------- WebGL2: instanced + uTime vertex animation + texture atlas ----------
		var MAX_GLYPH_BATCH = 48
		var ATLAS_COLS = 8
		var ATLAS_ROWS = 16
		var ATLAS_CELL_W = 320
		var ATLAS_CELL_H = 64

		function createWebgl2Renderer(opts) {
			opts = opts || {}
			var hostEl = null
			var canvas = null
			var gl = null
			var program = null
			var uTimeLoc = null
			var uViewportLoc = null
			var uSamplerLoc = null
			var uIdleAlphaLoc = null
			var aPosLoc = null
			var aTimeLoc = null
			var aRectLoc = null
			var aUVLoc = null
			var aAlphaLoc = null
			var aModeLoc = null
			var quadBuf = null
			var instanceBuf = null
			var atlasTex = null
			var config = clampConfig(DEFAULTS)
			var items = new Map()
			var onHit = null
			var seq = 0
			var enabled = true
			var idleAlpha = 1
			var raf = 0
			var t0Clock = performance.now()
			var rollTracks = []
			var topTracks = []
			var bottomTracks = []
			var dpr = 1
			var cssW = 0
			var cssH = 0
			var disposed = false
			var atlasUsed = 0
			// instance stride floats: time0, duration, pauseBias, mode, x0, x1, y, w, h, r,g,b, pad, pad
			var INST_FLOATS = 14
			var instData = new Float32Array(MAX_GLYPH_BATCH * INST_FLOATS)
			var instCount = 0
			var instanceList = []

			var VS = [
				'#version 300 es',
				'in vec2 aPos;',
				'in vec4 aTime;', // t0, duration, pauseBias, mode
				'in vec4 aRect;', // x0, y, w, h  (device px)
				'in vec4 aEndX;', // x1, unused, unused, unused
				'in vec4 aUV;',
				'in vec4 aAlphaCol;', // alphaBase, r, g, b
				'uniform float uTime;',
				'uniform vec2 uViewport;',
				'uniform float uIdleAlpha;',
				'out vec2 vUV;',
				'out float vAlpha;',
				'out vec3 vTint;',
				'out float vSc;', // aEndX.w, forwarded: SC items keep their baked atlas color
				'void main(){',
				'  float dur = max(aTime.y, 0.001);',
				// Paused items freeze at aEndX.z (pausedProgress); a constant bias
				// cannot stop a linearly advancing uTime, so the flag must reach here.
				'  float t = (aEndX.y > 0.5) ? aEndX.z : clamp((uTime - aTime.x + aTime.z) / dur, 0.0, 1.0);',
				'  float mode = aTime.w;',
				'  float x = (mode < 0.5) ? mix(aRect.x, aEndX.x, t) : ((uViewport.x - aRect.z) * 0.5);',
				'  vec2 p = vec2(x, aRect.y) + aPos * aRect.zw;',
				'  vec2 clip = vec2(p.x / uViewport.x * 2.0 - 1.0, 1.0 - p.y / uViewport.y * 2.0);',
				'  gl_Position = vec4(clip, 0.0, 1.0);',
				'  vUV = mix(aUV.xy, aUV.zw, aPos);',
				'  float fade = 1.0;',
				'  if (t < 0.06) fade = t / 0.06;',
				'  else if (t > 0.94) fade = (1.0 - t) / 0.06;',
				'  vAlpha = aAlphaCol.x * fade * uIdleAlpha;',
				'  vTint = aAlphaCol.yzw;',
				'  vSc = aEndX.w;',
				'}'
			].join('\n')
			var FS = [
				'#version 300 es',
				'precision mediump float;',
				'in vec2 vUV;',
				'in float vAlpha;',
				'in vec3 vTint;',
				'in float vSc;',
				'uniform sampler2D uSampler;',
				'out vec4 outColor;',
				'void main(){',
				'  vec4 t = texture(uSampler, vUV);',
				'  float a = t.a * vAlpha;',
				'  if (a < 0.004) discard;',
				'  float fill = t.r / max(t.a, 0.001);',
				// SC pills bake their own pink+white into the atlas; recover that RGB
				// instead of tinting the (white-default) vTint over a white pill.
				'  vec3 col = (vSc > 0.5) ? (t.rgb / max(t.a, 0.001)) : mix(vec3(0.02), vTint, fill);',
				'  outColor = vec4(col * a, a);',
				'}'
			].join('\n')

			function compile(type, src) {
				var s = gl.createShader(type)
				gl.shaderSource(s, src)
				gl.compileShader(s)
				if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
					var log = gl.getShaderInfoLog(s)
					gl.deleteShader(s)
					throw new Error(log || 'shader compile failed')
				}
				return s
			}

			function lineH() {
				return Math.max(18, Math.floor(config.fontSize * 1.6))
			}
			function rollBandHeight() {
				var h = cssH || 200
				return Math.max(lineH(), Math.floor(h * (config.areaRatio || 0.5)))
			}
			function resetTracks() {
				var lh = lineH()
				var rollN = Math.max(1, Math.min(MAX_TRACKS, Math.floor(rollBandHeight() / lh)))
				var fullN = Math.max(1, Math.min(MAX_TRACKS, Math.floor((cssH || 200) / lh)))
				rollTracks = []
				topTracks = []
				bottomTracks = []
				for (var i = 0; i < rollN; i++) rollTracks.push(null)
				for (var j = 0; j < fullN; j++) {
					topTracks.push(null)
					bottomTracks.push(null)
				}
			}
			function pickTrack(nowMs, width, layout) {
				var list = layout === 'roll' ? rollTracks : layout === 'top' ? topTracks : bottomTracks
				var n = list.length
				for (var i = 0; i < n; i++) {
					var last = list[i]
					if (!last) return i
					var elapsed = (nowMs - last.spawnAt) / 1000
					if (layout === 'roll') {
						var gapSec = (last.width + width + 12) / Math.max(last.v || config.scrollSpeed, 1)
						if (elapsed >= gapSec) return i
					} else if (elapsed >= (last.durationMs || 4000) * 0.85 / 1000) {
						return i
					}
				}
				return -1
			}
			function markTrack(track, layout, data) {
				if (layout === 'roll') rollTracks[track] = data
				else if (layout === 'top') topTracks[track] = data
				else bottomTracks[track] = data
			}

			function initAtlas() {
				atlasTex = gl.createTexture()
				gl.bindTexture(gl.TEXTURE_2D, atlasTex)
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ATLAS_COLS * ATLAS_CELL_W, ATLAS_ROWS * ATLAS_CELL_H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
				atlasUsed = 0
			}

			// Gift pill fill, baked into the atlas like SC (recovered verbatim by
			// the shader's vSc branch). Intentionally duplicated as GIFT_COLOR
			// inside WORKER_SRC — the worker bakes in its own realm.
			var GIFT_COLOR = 'rgba(245,158,11,0.95)'

			function bakeToAtlas(text, kind) {
				// reuse by text+kind+font (color applied as tint in shader for white-ish; SC/gift baked)
				var key = kind + '|' + config.fontSize + '|' + (config.stroke ? '1' : '0') + '|' + text
				if (bakeToAtlas.cache[key]) return bakeToAtlas.cache[key]
				if (atlasUsed >= ATLAS_COLS * ATLAS_ROWS) {
					// reset atlas (simple)
					initAtlas()
					bakeToAtlas.cache = {}
					atlasUsed = 0
				}
				var pad = kind === 'sc' ? 10 : 4
				var font = (kind === 'sc' ? config.fontSize + 2 : config.fontSize) + 'px sans-serif'
				var probe = document.createElement('canvas').getContext('2d')
				probe.font = font
				var tw = Math.ceil(probe.measureText(text).width) + pad * 2
				var th = Math.ceil(config.fontSize * 1.7) + pad
				if (tw > ATLAS_CELL_W) tw = ATLAS_CELL_W
				if (th > ATLAS_CELL_H) th = ATLAS_CELL_H
				var c = document.createElement('canvas')
				c.width = ATLAS_CELL_W
				c.height = ATLAS_CELL_H
				var ctx2 = c.getContext('2d')
				ctx2.clearRect(0, 0, ATLAS_CELL_W, ATLAS_CELL_H)
				ctx2.font = font
				ctx2.textBaseline = 'middle'
				if (kind === 'sc' || kind === 'gift') {
					ctx2.fillStyle = kind === 'gift' ? GIFT_COLOR : 'rgba(251,114,153,0.95)'
					var r = 6
					var bw = Math.min(tw, ATLAS_CELL_W)
					var bh = Math.min(th, ATLAS_CELL_H)
					ctx2.beginPath()
					ctx2.moveTo(r, 0)
					ctx2.lineTo(bw - r, 0)
					ctx2.quadraticCurveTo(bw, 0, bw, r)
					ctx2.lineTo(bw, bh - r)
					ctx2.quadraticCurveTo(bw, bh, bw - r, bh)
					ctx2.lineTo(r, bh)
					ctx2.quadraticCurveTo(0, bh, 0, bh - r)
					ctx2.lineTo(0, r)
					ctx2.quadraticCurveTo(0, 0, r, 0)
					ctx2.fill()
					ctx2.fillStyle = '#ffffff'
					ctx2.fillText(text, pad, bh / 2)
				} else {
					if (config.stroke) {
						ctx2.lineWidth = 3
						ctx2.strokeStyle = '#000000'
						ctx2.strokeText(text, pad, th / 2)
					}
					ctx2.fillStyle = '#ffffff'
					ctx2.fillText(text, pad, th / 2)
				}
				var idx = atlasUsed++
				var col = idx % ATLAS_COLS
				var row = Math.floor(idx / ATLAS_COLS)
				var px = col * ATLAS_CELL_W
				var py = row * ATLAS_CELL_H
				gl.bindTexture(gl.TEXTURE_2D, atlasTex)
				gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
				gl.texSubImage2D(gl.TEXTURE_2D, 0, px, py, gl.RGBA, gl.UNSIGNED_BYTE, c)
				var u0 = px / (ATLAS_COLS * ATLAS_CELL_W)
				var v0 = py / (ATLAS_ROWS * ATLAS_CELL_H)
				var u1 = (px + tw) / (ATLAS_COLS * ATLAS_CELL_W)
				var v1 = (py + th) / (ATLAS_ROWS * ATLAS_CELL_H)
				var rec = { u0: u0, v0: v0, u1: u1, v1: v1, w: tw * dpr, h: th * dpr, wCss: tw, hCss: th }
				bakeToAtlas.cache[key] = rec
				return rec
			}
			bakeToAtlas.cache = {}

			function resizeCanvas() {
				if (!canvas || !hostEl) return
				var rect = hostEl.getBoundingClientRect()
				dpr = Math.min(2, window.devicePixelRatio || 1)
				cssW = rect.width
				cssH = rect.height
				canvas.style.width = cssW + 'px'
				canvas.style.height = cssH + 'px'
				canvas.width = Math.max(1, Math.floor(cssW * dpr))
				canvas.height = Math.max(1, Math.floor(cssH * dpr))
				if (gl) {
					gl.viewport(0, 0, canvas.width, canvas.height)
					gl.uniform2f(uViewportLoc, canvas.width, canvas.height)
				}
				resetTracks()
			}

			function rebuildInstances(now) {
				instCount = 0
				instanceList = []
				var i = 0
				items.forEach(function (rec, id) {
					if (rec.dead) return
					var elapsed = rec.paused ? rec.pausedProgress * rec.durationMs : now - rec.t0
					if (elapsed > rec.durationMs + 30) {
						rec.dead = true
						items.delete(id)
						return
					}
					if (instCount >= MAX_GLYPH_BATCH) return
					var o = instCount * INST_FLOATS
					// aTime: t0, duration, pauseBias, mode
					// t0 is stored relative to t0Clock so aTime.x shares the shader's
					// uTime origin ((now - t0Clock) * 0.001 in frame()).
					instData[o + 0] = (rec.t0 - t0Clock) * 0.001
					instData[o + 1] = rec.durationMs * 0.001
					instData[o + 2] = rec.paused ? rec.pausedBiasSec : 0
					instData[o + 3] = rec.layout === 'roll' ? 0 : 1
					// aRect: x0, y, w, h
					instData[o + 4] = rec.x0
					instData[o + 5] = rec.y * dpr
					instData[o + 6] = rec.w
					instData[o + 7] = rec.h
					// aEndX: x1, paused flag, pausedProgress, sc flag
					instData[o + 8] = rec.x1
					instData[o + 9] = rec.paused ? 1 : 0
					instData[o + 10] = rec.paused ? rec.pausedProgress : 0
					instData[o + 11] = (rec.kind === 'sc' || rec.kind === 'gift') ? 1 : 0
					// we pack UV and alpha into a second stream below — use remaining for uv/alpha via separate arrays
					instanceList.push(rec)
					instCount++
					i++
				})
				// UV + alpha second buffer
				uvAlphaDataEnsure(instCount)
				for (var k = 0; k < instCount; k++) {
					var rec2 = instanceList[k]
					var uo = k * 8
					uvAlphaData[uo + 0] = rec2.u0
					uvAlphaData[uo + 1] = rec2.v0
					uvAlphaData[uo + 2] = rec2.u1
					uvAlphaData[uo + 3] = rec2.v1
					uvAlphaData[uo + 4] = rec2.alpha
					uvAlphaData[uo + 5] = rec2.tintR
					uvAlphaData[uo + 6] = rec2.tintG
					uvAlphaData[uo + 7] = rec2.tintB
				}
			}

			var uvAlphaData = new Float32Array(MAX_GLYPH_BATCH * 8)
			var uvAlphaBuf = null
			function uvAlphaDataEnsure() { /* sized fixed */ }

			function uploadInstances() {
				if (!instanceBuf || !uvAlphaBuf || !instCount) return
				gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuf)
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, instData, 0, instCount * INST_FLOATS)
				gl.bindBuffer(gl.ARRAY_BUFFER, uvAlphaBuf)
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, uvAlphaData, 0, instCount * 8)
			}

			function frame() {
				if (disposed || !gl) return
				raf = requestAnimationFrame(frame)
				if (!enabled) return
				if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
				var now = performance.now()
				var uTime = (now - t0Clock) * 0.001
				rebuildInstances(now)
				gl.viewport(0, 0, canvas.width, canvas.height)
				gl.clearColor(0, 0, 0, 0)
				gl.clear(gl.COLOR_BUFFER_BIT)
				if (!instCount) return
				uploadInstances()
				gl.enable(gl.BLEND)
				gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
				gl.useProgram(program)
				gl.uniform2f(uViewportLoc, canvas.width, canvas.height)
				gl.uniform1f(uTimeLoc, uTime)
				gl.uniform1f(uIdleAlphaLoc, idleAlpha)
				gl.activeTexture(gl.TEXTURE0)
				gl.bindTexture(gl.TEXTURE_2D, atlasTex)
				gl.uniform1i(uSamplerLoc, 0)
				gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
				gl.enableVertexAttribArray(aPosLoc)
				gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0)
				gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuf)
				// aTime 4, aRect 4, aEndX 4  at offsets 0,16,32 bytes
				gl.enableVertexAttribArray(aTimeLoc)
				gl.vertexAttribPointer(aTimeLoc, 4, gl.FLOAT, false, INST_FLOATS * 4, 0)
				gl.vertexAttribDivisor(aTimeLoc, 1)
				gl.enableVertexAttribArray(aRectLoc)
				gl.vertexAttribPointer(aRectLoc, 4, gl.FLOAT, false, INST_FLOATS * 4, 16)
				gl.vertexAttribDivisor(aRectLoc, 1)
				gl.enableVertexAttribArray(aEndXLoc)
				gl.vertexAttribPointer(aEndXLoc, 4, gl.FLOAT, false, INST_FLOATS * 4, 32)
				gl.vertexAttribDivisor(aEndXLoc, 1)
				gl.bindBuffer(gl.ARRAY_BUFFER, uvAlphaBuf)
				gl.enableVertexAttribArray(aUVLoc)
				gl.vertexAttribPointer(aUVLoc, 4, gl.FLOAT, false, 32, 0)
				gl.vertexAttribDivisor(aUVLoc, 1)
				gl.enableVertexAttribArray(aAlphaLoc)
				gl.vertexAttribPointer(aAlphaLoc, 4, gl.FLOAT, false, 32, 16)
				gl.vertexAttribDivisor(aAlphaLoc, 1)
				gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, instCount)
			}

			var aEndXLoc = null

			function spawnOne(item) {
				if (!canvas || !enabled) return
				if (items.size >= config.maxOnscreen) return
				var content = filterEmoji(item.content, config.allowEmoji)
				if (!content) return
				if (isBlocked(content, config.blockedWords)) return
				var source = item.source || 'preset'
				if (config.debugSource) {
					var badge = source === 'ai' ? '🤖' : source === 'user' ? '💬' : '📺'
					content = badge + ' ' + content
				}
				var kind = item.kind || 'normal'
				var layout = item.layout || pickLayout(config.layoutWeights)
				if (kind === 'sc') layout = 'top'
				// WebGL pipeline has no reverse track — remap to roll
				if (layout === 'reverse') layout = 'roll'
				var color = item.color || pickColor(config)
				var baked = bakeToAtlas(content, kind)
				var now = performance.now()
				var widthCss = baked.wCss
				var track = pickTrack(now, widthCss, layout)
				if (track < 0) return
				var lh = lineH()
				var yCss
				if (layout === 'roll') yCss = track * lh + 2
				else if (layout === 'top') yCss = track * lh + 2
				else yCss = Math.max(0, cssH - (track + 1) * lh - 2)
				var speed = Math.max(40, Number(config.scrollSpeed) || 140)
				var durationMs
				var x0
				var x1
				if (layout === 'roll') {
					durationMs = Math.max(2000, Math.min(20000, ((cssW + widthCss + 24) / speed) * 1000))
					x0 = (cssW + 4) * dpr
					x1 = -(baked.w + 24 * dpr)
					markTrack(track, layout, { width: widthCss, v: speed, spawnAt: now, durationMs: durationMs })
				} else {
					durationMs = 4000
					x0 = 0
					x1 = 0
					markTrack(track, layout, { width: widthCss, v: 0, spawnAt: now, durationMs: 4000 })
				}
				// parse color to tint (white baked → tint to color)
				var cr = 1
				var cg = 1
				var cb = 1
				if (kind !== 'sc' && kind !== 'gift' && color && color.charAt(0) === '#') {
					var n = parseInt(color.slice(1), 16)
					cr = ((n >> 16) & 255) / 255
					cg = ((n >> 8) & 255) / 255
					cb = (n & 255) / 255
				}
				var id = 'dm_' + (++seq)
				items.set(id, {
					id: id,
					content: content,
					source: item.source || 'preset',
					kind: kind,
					layout: layout,
					u0: baked.u0, v0: baked.v0, u1: baked.u1, v1: baked.v1,
					w: baked.w, h: baked.h,
					y: yCss,
					x0: x0, x1: x1,
					t0: now,
					durationMs: durationMs,
					alpha: (kind === 'sc' || kind === 'gift') ? 1 : config.opacity,
					tintR: cr, tintG: cg, tintB: cb,
					paused: false,
					pausedProgress: 0,
					pausedBiasSec: 0,
					uiHold: false,
					hovered: false,
					dead: false
				})
			}

			function nowT(rec, now) {
				if (rec.paused) return rec.pausedProgress
				return (now - rec.t0) / rec.durationMs
			}

			function hitTest(cssX, cssY) {
				var found = null
				var now = performance.now()
				items.forEach(function (rec) {
					if (rec.dead) return
					var t = nowT(rec, now)
					if (t < 0 || t > 1) return
					var x
					if (rec.layout === 'roll') x = rec.x0 + (rec.x1 - rec.x0) * t
					else x = ((cssW || 800) - rec.w / dpr) * 0.5 * dpr
					var px = x / dpr
					var py = rec.y
					var pw = rec.w / dpr
					var ph = rec.h / dpr
					if (cssX >= px && cssX <= px + pw && cssY >= py && cssY <= py + ph) found = rec
				})
				return found
			}

			function pauseRec(rec) {
				if (!rec || rec.paused) return
				var now = performance.now()
				rec.pausedProgress = Math.min(1, Math.max(0, (now - rec.t0) / rec.durationMs))
				rec.pausedBiasSec = rec.pausedProgress * (rec.durationMs * 0.001) - (now - rec.t0) * 0.001
				rec.paused = true
			}
			function resumeRec(rec) {
				if (!rec || !rec.paused) return
				var elapsed = Math.min(1, Math.max(0, rec.pausedProgress || 0)) * rec.durationMs
				rec.t0 = performance.now() - elapsed
				rec.pausedBiasSec = 0
				rec.paused = false
			}
			function onPointerMove(e) {
				if (!config.interactive) return
				if (!canvas) return
				var rect = canvas.getBoundingClientRect()
				// A window above owns the pointer: force the no-hit miss path so any
				// hover-hold releases and the cursor resets, then the caller yields.
				var hit = pointerOverWindow(e) ? null : hitTest(e.clientX - rect.left, e.clientY - rect.top)
				items.forEach(function (rec) {
					if (rec.kind === 'sc' || !config.hoverPause) return
					if (hit && rec.id === hit.id) {
						rec.hovered = true
						pauseRec(rec)
					} else {
						rec.hovered = false
						if (rec.paused && !rec.uiHold) resumeRec(rec)
					}
				})
				canvas.style.cursor = hit ? 'pointer' : 'default'
			}

			function onClick(e) {
				if (!config.interactive) return
				if (pointerOverWindow(e)) return
				if (!canvas) return
				var rect = canvas.getBoundingClientRect()
				var hit = hitTest(e.clientX - rect.left, e.clientY - rect.top)
				if (hit && onHit) {
					e.preventDefault()
					e.stopPropagation()
					onHit(hit.id, { content: hit.content, source: hit.source, id: hit.id, kind: hit.kind })
				}
			}
			function onDblClick(e) {
				if (!config.interactive) return
				if (pointerOverWindow(e)) return
				if (!canvas) return
				var rect = canvas.getBoundingClientRect()
				var hit = hitTest(e.clientX - rect.left, e.clientY - rect.top)
				if (hit && onHit) {
					e.preventDefault()
					e.stopPropagation()
					onHit(hit.id, { content: hit.content, source: hit.source, id: hit.id, kind: hit.kind, action: 'like' })
				}
			}

			return {
				kind: 'webgl2',
				mount: function (host) {
					hostEl = host
					// Pointer priority resolved once at attach: windows stacked above
					// the overlay layer own the pointer (see pointerOverWindow).
					var overlay = hostEl.closest && hostEl.closest('[data-shell-overlay]')
					var overlayZ = overlay ? parseFloat(getComputedStyle(overlay).zIndex) : NaN
					overlayLayerZ = isFinite(overlayZ) ? overlayZ : 20
					canvas = document.createElement('canvas')
					canvas.className = 'dsh-danmaku-gl'
					canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;'
					hostEl.appendChild(canvas)
					gl = canvas.getContext('webgl2', {
						alpha: true, premultipliedAlpha: true, antialias: false,
						depth: false, stencil: false, powerPreference: 'low-power'
					})
					if (!gl) throw new Error('webgl2 unavailable')
					if (!gl.drawArraysInstanced) throw new Error('instancing unavailable')
					var vs = compile(gl.VERTEX_SHADER, VS)
					var fs = compile(gl.FRAGMENT_SHADER, FS)
					program = gl.createProgram()
					gl.attachShader(program, vs)
					gl.attachShader(program, fs)
					gl.linkProgram(program)
					if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
						throw new Error(gl.getProgramInfoLog(program) || 'link failed')
					}
					uTimeLoc = gl.getUniformLocation(program, 'uTime')
					uViewportLoc = gl.getUniformLocation(program, 'uViewport')
					uSamplerLoc = gl.getUniformLocation(program, 'uSampler')
					uIdleAlphaLoc = gl.getUniformLocation(program, 'uIdleAlpha')
					aPosLoc = gl.getAttribLocation(program, 'aPos')
					aTimeLoc = gl.getAttribLocation(program, 'aTime')
					aRectLoc = gl.getAttribLocation(program, 'aRect')
					aEndXLoc = gl.getAttribLocation(program, 'aEndX')
					aUVLoc = gl.getAttribLocation(program, 'aUV')
					aAlphaLoc = gl.getAttribLocation(program, 'aAlphaCol')
					quadBuf = gl.createBuffer()
					gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
					gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW)
					instanceBuf = gl.createBuffer()
					gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuf)
					gl.bufferData(gl.ARRAY_BUFFER, instData.byteLength, gl.DYNAMIC_DRAW)
					uvAlphaBuf = gl.createBuffer()
					gl.bindBuffer(gl.ARRAY_BUFFER, uvAlphaBuf)
					gl.bufferData(gl.ARRAY_BUFFER, uvAlphaData.byteLength, gl.DYNAMIC_DRAW)
					initAtlas()
					resizeCanvas()
					t0Clock = performance.now()
					raf = requestAnimationFrame(frame)
					document.addEventListener('pointermove', onPointerMove, true)
					document.addEventListener('click', onClick, true)
					document.addEventListener('dblclick', onDblClick, true)
				},
				unmount: function () {
					disposed = true
					if (raf) cancelAnimationFrame(raf)
					document.removeEventListener('pointermove', onPointerMove, true)
					document.removeEventListener('click', onClick, true)
					document.removeEventListener('dblclick', onDblClick, true)
					if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas)
					items.clear()
					bakeToAtlas.cache = {}
					canvas = null
					gl = null
					hostEl = null
				},
				resize: function (w, h, areaRatio) {
					if (areaRatio) config.areaRatio = areaRatio
					resizeCanvas()
				},
				setConfig: function (c) {
					var prev = config
					config = clampConfig(Object.assign({}, config, c))
					if (prev.fontSize !== config.fontSize || prev.areaRatio !== config.areaRatio) {
						resetTracks()
					}
					var now = performance.now()
					items.forEach(function (rec) {
						if (rec.kind === 'sc' || rec.kind === 'gift') return
						if (prev.opacity !== config.opacity) rec.alpha = config.opacity
						if (prev.fontSize !== config.fontSize || prev.stroke !== config.stroke) {
							var b = bakeToAtlas(rec.content, rec.kind)
							rec.u0 = b.u0; rec.v0 = b.v0; rec.u1 = b.u1; rec.v1 = b.v1
							rec.w = b.w; rec.h = b.h
						}
						if (rec.layout === 'roll' && prev.scrollSpeed !== config.scrollSpeed) {
							var t = rec.paused ? rec.pausedProgress : (now - rec.t0) / Math.max(rec.durationMs, 1)
							var wCss = (rec.w || 100) / dpr
							var nd = Math.max(2000, Math.min(20000, ((cssW + wCss + 24) / Math.max(40, config.scrollSpeed)) * 1000))
							rec.durationMs = nd
							rec.t0 = now - t * nd
							rec.x1 = -(rec.w + 24 * dpr)
						}
					})
					// Turning interaction/hover-pause off must release hover-held items;
					// uiHold (detail/pauseAll) stays held.
					if ((prev.interactive && !config.interactive) || (prev.hoverPause && !config.hoverPause)) {
						items.forEach(function (rec) {
							rec.hovered = false
							if (rec.paused && !rec.uiHold) resumeRec(rec)
						})
					}
				},
				setEnabled: function (on) {
					enabled = !!on
					if (canvas) canvas.style.display = enabled ? 'block' : 'none'
					if (!enabled) this.clear()
				},
				spawn: function (list) {
					if (!enabled) return
					;(list || []).forEach(spawnOne)
				},
				clear: function () {
					items.clear()
					resetTracks()
				},
				setIdleAlpha: function (a) {
					idleAlpha = Math.min(1, Math.max(0, Number(a)))
				},
				pauseLoop: function () { /* visibility gate inside frame() */ },
				resumeLoop: function () { /* visibility gate inside frame() */ },
				pauseAll: function () {
					items.forEach(function (rec) {
						rec.uiHold = true
						pauseRec(rec)
					})
				},
				resumeAll: function () {
					items.forEach(function (rec) {
						rec.uiHold = false
						if (!rec.hovered) resumeRec(rec)
					})
				},
				pauseOne: function (id) {
					var rec = items.get(id)
					if (!rec) return
					rec.uiHold = true
					pauseRec(rec)
				},
				resumeOne: function (id) {
					var rec = items.get(id)
					if (!rec) return
					rec.uiHold = false
					if (!rec.hovered) resumeRec(rec)
				},
				removeOne: function (id) {
					items.delete(id)
				},
				onHit: function (cb) { onHit = cb },
				requestDebugSnapshot: function () {
					// Report what the shader is actually computing, not the intended
					// progress: the whole point is to see a frozen clock. uTime and
					// aTime.x mirror frame()/rebuildInstances exactly.
					var now = performance.now()
					var uTime = (now - t0Clock) * 0.001
					var out = []
					items.forEach(function (rec, id) {
						if (rec.dead) return
						var dur = Math.max(rec.durationMs * 0.001, 0.001)
						// Mirror the shader exactly: paused -> frozen aEndX.z, else the clock.
						var t = rec.paused
							? Math.min(1, Math.max(0, rec.pausedProgress))
							: Math.min(1, Math.max(0, (uTime - (rec.t0 - t0Clock) * 0.001) / dur))
						var x = rec.layout === 'roll'
							? (rec.x0 + (rec.x1 - rec.x0) * t) / dpr
							: (cssW - rec.w / dpr) / 2
						out.push({
							id: id, kind: rec.kind, layout: rec.layout, x: x, y: rec.y,
							w: rec.w / dpr, h: rec.h / dpr,
							paused: !!rec.paused, progress: t, alpha: rec.alpha
						})
					})
					return out
				},
				getLayer: function () { return canvas },
				stats: function () { return { onscreen: items.size, kind: 'webgl2', atlas: atlasUsed } }
			}
		}

		// ---------- Worker + OffscreenCanvas (same shaders; main thread only forwards) ----------
		function createWebgl2WorkerRenderer() {
			var hostEl = null
			var canvas = null
			var worker = null
			var onHit = null
			var config = clampConfig(DEFAULTS)
			var enabled = true
			var seq = 0
			var hitMap = new Map()
			var cssW = 0
			var cssH = 0
			var workerDpr = 1
			var uiHold = false
			var debugSnap = null
			// Bilibili-style: first free track from top (roll/top) or bottom edge
			var trackFreeAt = { roll: [], top: [], bottom: [] }

			function resetTracks() {
				trackFreeAt = { roll: [], top: [], bottom: [] }
			}

			function trackCountFor(layout, fontSize) {
				var lh = Math.max(18, Math.floor((fontSize || 16) * 1.6))
				if (layout === 'roll') {
					var band = Math.max(lh, Math.floor(cssH * (config.areaRatio || 0.5)))
					return Math.max(1, Math.min(MAX_TRACKS, Math.floor(band / lh)))
				}
				return Math.max(1, Math.min(MAX_TRACKS, Math.floor((cssH || 400) / lh)))
			}

			function pickTrack(layout, widthCss, fontSize, speed) {
				var n = trackCountFor(layout, fontSize)
				var free = trackFreeAt[layout] || (trackFreeAt[layout] = [])
				var now = performance.now()
				for (var i = 0; i < n; i++) {
					var last = free[i]
					if (!last) return i
					var elapsed = (now - last.spawnAt) / 1000
					if (layout === 'roll') {
						// double-width gap, same as presets.canEnterTrack / DOM / main
						var gapSec = (last.width + widthCss + 12) / Math.max(last.v || speed, 1)
						if (elapsed >= gapSec) return i
					} else if (elapsed >= (last.durationMs || 4000) * 0.85 / 1000) {
						return i
					}
				}
				return -1
			}

			function markTrack(layout, index, widthCss, speed, now, durationMs) {
				if (!trackFreeAt[layout]) trackFreeAt[layout] = []
				trackFreeAt[layout][index] = { width: widthCss, v: speed, spawnAt: now, durationMs: durationMs }
			}

			function yForTrack(layout, track, fontSize) {
				var lh = Math.max(18, Math.floor((fontSize || 16) * 1.6))
				if (layout === 'bottom') return Math.max(0, cssH - (track + 1) * lh - 2)
				return track * lh + 2
			}

			var WORKER_SRC = [
				'let gl=null,canvas=null,program=null,insts=new Map(),loopPaused=false,dpr=1;',
				'let uTimeLoc,uViewportLoc,uIdleAlphaLoc,uSamplerLoc,aPosLoc,aTimeLoc,aRectLoc,aEndXLoc,aUVLoc,aAlphaLoc;',
				'let quadBuf,instanceBuf,uvAlphaBuf,atlasTex,atlasUsed=0,t0=performance.now(),idleAlpha=1,config={},enabled=true,raf=0,disposed=false;',
				'const INST_FLOATS=14,MAXB=48,AC=8,AR=16,CW=320,CH=64;',
				'const GIFT_COLOR="rgba(245,158,11,0.95)";', // intentional twin of the main-thread GIFT_COLOR (separate realm)
				'const VS=`#version 300 es\\nin vec2 aPos;in vec4 aTime;in vec4 aRect;in vec4 aEndX;in vec4 aUV;in vec4 aAlphaCol;uniform float uTime;uniform vec2 uViewport;uniform float uIdleAlpha;out vec2 vUV;out float vAlpha;out vec3 vTint;out float vSc;void main(){float dur=max(aTime.y,0.001);float t=(aEndX.y>0.5)?aEndX.z:clamp((uTime-aTime.x+aTime.z)/dur,0.0,1.0);float mode=aTime.w;float x=(mode<0.5)?mix(aRect.x,aEndX.x,t):((uViewport.x-aRect.z)*0.5);vec2 p=vec2(x,aRect.y)+aPos*aRect.zw;vec2 clip=vec2(p.x/uViewport.x*2.0-1.0,1.0-p.y/uViewport.y*2.0);gl_Position=vec4(clip,0.0,1.0);vUV=mix(aUV.xy,aUV.zw,aPos);float fade=1.0;if(t<0.06)fade=t/0.06;else if(t>0.94)fade=(1.0-t)/0.06;vAlpha=aAlphaCol.x*fade*uIdleAlpha;vTint=aAlphaCol.yzw;vSc=aEndX.w;}`;',
				'const FS=`#version 300 es\\nprecision mediump float;in vec2 vUV;in float vAlpha;in vec3 vTint;in float vSc;uniform sampler2D uSampler;out vec4 outColor;void main(){vec4 t=texture(uSampler,vUV);float a=t.a*vAlpha;if(a<0.004)discard;float fill=t.r/max(t.a,0.001);vec3 col=(vSc>0.5)?(t.rgb/max(t.a,0.001)):mix(vec3(0.02),vTint,fill);outColor=vec4(col*a,a);}`;',
				'function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||"compile");return s;}',
				'function initAtlas(){atlasTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,atlasTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,AC*CW,AR*CH,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);atlasUsed=0;}',
				'const bakeCache={};',
				'function bake(text,kind,fontSizeCss,stroke){const fs=Math.max(12,fontSizeCss||16)*dpr;const key=kind+"|"+fs+"|"+(stroke?1:0)+"|"+text;if(bakeCache[key])return bakeCache[key];if(atlasUsed>=AC*AR){initAtlas();for(const k in bakeCache)delete bakeCache[k];}',
				'const pad=Math.ceil(6*dpr);const font=(kind==="sc"?(fs+2*dpr):fs)+"px sans-serif";const probe=new OffscreenCanvas(1,1).getContext("2d");probe.font=font;let tw=Math.ceil(probe.measureText(text).width)+pad*2;let th=Math.ceil(fs*1.7)+pad;if(tw>CW)tw=CW;if(th>CH)th=CH;const c=new OffscreenCanvas(CW,CH);const ctx=c.getContext("2d");ctx.clearRect(0,0,CW,CH);ctx.font=font;ctx.textBaseline="middle";ctx.letterSpacing="0px";',
				'if(kind==="sc"||kind==="gift"){ctx.fillStyle=kind==="gift"?GIFT_COLOR:"rgba(251,114,153,0.95)";const r=6,bw=Math.min(tw,CW),bh=Math.min(th,CH);ctx.beginPath();ctx.moveTo(r,0);ctx.lineTo(bw-r,0);ctx.quadraticCurveTo(bw,0,bw,r);ctx.lineTo(bw,bh-r);ctx.quadraticCurveTo(bw,bh,bw-r,bh);ctx.lineTo(r,bh);ctx.quadraticCurveTo(0,bh,0,bh-r);ctx.lineTo(0,r);ctx.quadraticCurveTo(0,0,r,0);ctx.fill();ctx.fillStyle="#fff";ctx.fillText(text,pad,bh/2);}else{if(stroke){ctx.lineWidth=Math.max(2,fs*0.12);ctx.lineJoin="round";ctx.strokeStyle="#000";ctx.strokeText(text,pad,th/2);}ctx.fillStyle="#fff";ctx.fillText(text,pad,th/2);}',
				'const idx=atlasUsed++;const col=idx%AC,row=Math.floor(idx/AC);const px=col*CW,py=row*CH;gl.bindTexture(gl.TEXTURE_2D,atlasTex);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.texSubImage2D(gl.TEXTURE_2D,0,px,py,gl.RGBA,gl.UNSIGNED_BYTE,c);const rec={u0:px/(AC*CW),v0:py/(AR*CH),u1:(px+tw)/(AC*CW),v1:(py+th)/(AR*CH),w:tw,h:th,wCss:tw/dpr,hCss:th/dpr};bakeCache[key]=rec;return rec;}',
				'function frame(){if(disposed||!gl)return;raf=requestAnimationFrame(frame);if(loopPaused||!enabled)return;const now=performance.now();const uTime=(now-t0)*0.001;const list=[];insts.forEach((r,id)=>{if(r.dead)return;const elapsed=r.paused?r.pausedProgress*r.durationMs:now-r.t0;if(elapsed>r.durationMs+30){r.dead=true;insts.delete(id);return;}list.push(r);});gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);if(!list.length)return;',
				'const idata=new Float32Array(list.length*INST_FLOATS);const udata=new Float32Array(list.length*8);list.forEach((r,i)=>{const o=i*INST_FLOATS;idata[o]=(r.t0-t0)*0.001;idata[o+1]=r.durationMs*0.001;idata[o+2]=r.paused?r.pausedBiasSec:0;idata[o+3]=r.layout==="roll"?0:1;idata[o+4]=r.x0;idata[o+5]=r.y;idata[o+6]=r.w;idata[o+7]=r.h;idata[o+8]=r.x1;idata[o+9]=r.paused?1:0;idata[o+10]=r.paused?r.pausedProgress:0;idata[o+11]=(r.kind==="sc"||r.kind==="gift")?1:0;const uo=i*8;udata[uo]=r.u0;udata[uo+1]=r.v0;udata[uo+2]=r.u1;udata[uo+3]=r.v1;udata[uo+4]=r.alpha;udata[uo+5]=r.tr;udata[uo+6]=r.tg;udata[uo+7]=r.tb;});',
				'gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuf);gl.bufferData(gl.ARRAY_BUFFER,idata,gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,uvAlphaBuf);gl.bufferData(gl.ARRAY_BUFFER,udata,gl.DYNAMIC_DRAW);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(program);gl.uniform2f(uViewportLoc,canvas.width,canvas.height);gl.uniform1f(uTimeLoc,uTime);gl.uniform1f(uIdleAlphaLoc,idleAlpha);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,atlasTex);gl.uniform1i(uSamplerLoc,0);',
				'gl.bindBuffer(gl.ARRAY_BUFFER,quadBuf);gl.enableVertexAttribArray(aPosLoc);gl.vertexAttribPointer(aPosLoc,2,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuf);gl.enableVertexAttribArray(aTimeLoc);gl.vertexAttribPointer(aTimeLoc,4,gl.FLOAT,false,INST_FLOATS*4,0);gl.vertexAttribDivisor(aTimeLoc,1);gl.enableVertexAttribArray(aRectLoc);gl.vertexAttribPointer(aRectLoc,4,gl.FLOAT,false,INST_FLOATS*4,16);gl.vertexAttribDivisor(aRectLoc,1);gl.enableVertexAttribArray(aEndXLoc);gl.vertexAttribPointer(aEndXLoc,4,gl.FLOAT,false,INST_FLOATS*4,32);gl.vertexAttribDivisor(aEndXLoc,1);gl.bindBuffer(gl.ARRAY_BUFFER,uvAlphaBuf);gl.enableVertexAttribArray(aUVLoc);gl.vertexAttribPointer(aUVLoc,4,gl.FLOAT,false,32,0);gl.vertexAttribDivisor(aUVLoc,1);gl.enableVertexAttribArray(aAlphaLoc);gl.vertexAttribPointer(aAlphaLoc,4,gl.FLOAT,false,32,16);gl.vertexAttribDivisor(aAlphaLoc,1);gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,list.length);}',
				'self.onmessage=async(e)=>{const m=e.data;if(m.type==="init"){canvas=m.canvas;config=m.config||{};gl=canvas.getContext("webgl2",{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false,powerPreference:"low-power"});if(!gl){self.postMessage({type:"fail",reason:"no webgl2"});return;}const vs=compile(gl.VERTEX_SHADER,VS),fs=compile(gl.FRAGMENT_SHADER,FS);program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);uTimeLoc=gl.getUniformLocation(program,"uTime");uViewportLoc=gl.getUniformLocation(program,"uViewport");uIdleAlphaLoc=gl.getUniformLocation(program,"uIdleAlpha");uSamplerLoc=gl.getUniformLocation(program,"uSampler");aPosLoc=gl.getAttribLocation(program,"aPos");aTimeLoc=gl.getAttribLocation(program,"aTime");aRectLoc=gl.getAttribLocation(program,"aRect");aEndXLoc=gl.getAttribLocation(program,"aEndX");aUVLoc=gl.getAttribLocation(program,"aUV");aAlphaLoc=gl.getAttribLocation(program,"aAlphaCol");quadBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quadBuf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,1,1]),gl.STATIC_DRAW);instanceBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuf);gl.bufferData(gl.ARRAY_BUFFER,MAXB*INST_FLOATS*4,gl.DYNAMIC_DRAW);uvAlphaBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,uvAlphaBuf);gl.bufferData(gl.ARRAY_BUFFER,MAXB*8*4,gl.DYNAMIC_DRAW);initAtlas();dpr=m.dpr||1;canvas.width=m.w;canvas.height=m.h;gl.viewport(0,0,m.w,m.h);t0=performance.now();raf=requestAnimationFrame(frame);self.postMessage({type:"ready"});return;}',
				'if(m.type==="resize"){if(!canvas||!gl)return;canvas.width=m.w;canvas.height=m.h;gl.viewport(0,0,m.w,m.h);return;}',
				'if(m.type==="config"){config=Object.assign({},config,m.config||{});return;}',
				'if(m.type==="styles"){const op=m.opacity;const fs=m.fontSize;const sp=m.scrollSpeed;const st=m.stroke;if(op!=null)config.opacity=op;if(fs)config.fontSize=fs;if(sp)config.scrollSpeed=sp;if(st!=null)config.stroke=st;const now=performance.now();insts.forEach((r)=>{if(r.kind==="sc"||r.kind==="gift")return;if(op!=null)r.alpha=op;if(r.layout==="roll"&&sp){const t=r.paused?r.pausedProgress:(now-r.t0)/Math.max(r.durationMs,1);const wCss=(r.w||100)/Math.max(dpr,0.5);const cssWpx=(canvas.width||1)/Math.max(dpr,0.5);const nd=Math.max(2000,Math.min(20000,((cssWpx+wCss+24)/Math.max(40,sp))*1000));r.durationMs=nd;r.t0=now-t*nd;r.x1=-((r.w||100)+24*dpr);}if((fs||st!=null)&&r.content){const b=bake(r.content,r.kind,fs||config.fontSize,config.stroke);r.u0=b.u0;r.v0=b.v0;r.u1=b.u1;r.v1=b.v1;r.w=b.w;r.h=b.h;}});return;}',
				'if(m.type==="enabled"){enabled=!!m.on;if(!enabled)insts.clear();return;}',
				'if(m.type==="loop-pause"){loopPaused=true;return;}',
				'if(m.type==="loop-resume"){loopPaused=false;return;}',
				'if(m.type==="idleAlpha"){idleAlpha=Math.max(0,Math.min(1,m.v||1));return;}',
				'if(m.type==="clear"){insts.clear();return;}',
				'if(m.type==="remove"){insts.delete(m.id);return;}',
				'if(m.type==="spawn"){const it=m.item;const baked=bake(it.content,it.kind,it.fontSize,it.stroke);const id=it.id;const now=performance.now();insts.set(id,{id,content:it.content,kind:it.kind,u0:baked.u0,v0:baked.v0,u1:baked.u1,v1:baked.v1,w:baked.w,h:baked.h,y:it.y,x0:it.x0,x1:it.x1,t0:now,durationMs:it.durationMs,alpha:it.alpha,tr:it.tr,tg:it.tg,tb:it.tb,layout:it.layout,paused:false,pausedProgress:0,pausedBiasSec:0,dead:false});return;}',
				'if(m.type==="pause"){const r=insts.get(m.id);if(r&&!r.paused){const now=performance.now();const p=Math.min(1,Math.max(0,(now-r.t0)/Math.max(r.durationMs,1)));r.paused=true;r.pausedProgress=p;r.pausedBiasSec=p*(r.durationMs*0.001)-(now-r.t0)*0.001;}return;}',
				'if(m.type==="resume"){const r=insts.get(m.id);if(r&&r.paused){const p=Math.min(1,Math.max(0,r.pausedProgress||0));r.t0=performance.now()-p*r.durationMs;r.pausedBiasSec=0;r.paused=false;}return;}',
				'if(m.type==="debug-snapshot"){const now=performance.now();const out=[];insts.forEach((r,id)=>{const t=Math.min(1,Math.max(0,r.paused?r.pausedProgress:(now-r.t0)/Math.max(r.durationMs,1)));const x=r.layout==="roll"?(r.x0+(r.x1-r.x0)*t):((canvas.width-r.w)*0.5);out.push({id,kind:r.kind,layout:r.layout,y:r.y/dpr,w:r.w/dpr,h:r.h/dpr,paused:r.paused,t,progress:t,x:x/dpr,alpha:r.alpha});});self.postMessage({type:"debug-snapshot",items:out});return;}',
				'if(m.type==="dispose"){disposed=true;if(raf)cancelAnimationFrame(raf);gl=null;}',
				'};'
			].join('\n')

			function post(msg, transfer) {
				if (worker) worker.postMessage(msg, transfer || [])
			}

			function spawnOne(item) {
				if (!enabled || !canvas) return
				if (hitMap.size >= config.maxOnscreen) return
				var raw = filterEmoji(item.content, config.allowEmoji)
				if (!raw || isBlocked(raw, config.blockedWords)) return
				var kind = item.kind || 'normal'
				var source = item.source || 'preset'
				var content = raw
				if (config.debugSource) {
					var badge = source === 'ai' ? '🤖' : source === 'user' ? '💬' : '📺'
					content = badge + ' ' + raw
				}
				var layout = item.layout || pickLayout(config.layoutWeights)
				if (kind === 'sc') layout = 'top'
				if (layout === 'reverse') layout = 'roll'
				var color = item.color || pickColor(config)
				var fontSize = Math.max(12, Number(config.fontSize) || 16)
				var speed = Math.max(40, Number(config.scrollSpeed) || 140)
				var wCss = Math.ceil(content.length * fontSize * 0.85) + 16
				var track = pickTrack(layout, wCss, fontSize, speed)
				if (track < 0) return
				var now = performance.now()
				var yCss = yForTrack(layout, track, fontSize)
				var id = 'dm_' + (++seq)
				var dpr = workerDpr
				var durationMs = layout === 'roll'
					? Math.max(2000, Math.min(20000, ((cssW + wCss + 24) / speed) * 1000))
					: 4000
				markTrack(layout, track, wCss, speed, now, durationMs)
				var x0 = layout === 'roll' ? (cssW + 4) * dpr : 0
				var x1 = layout === 'roll' ? -(wCss * dpr + 24 * dpr) : 0
				var cr = 1, cg = 1, cb = 1
				if (kind !== 'sc' && kind !== 'gift' && color && color.charAt(0) === '#') {
					var n = parseInt(color.slice(1), 16)
					cr = ((n >> 16) & 255) / 255
					cg = ((n >> 8) & 255) / 255
					cb = (n & 255) / 255
				}
				hitMap.set(id, {
					id: id, content: content, source: source, kind: kind,
					y: yCss, wCss: wCss, hCss: Math.ceil(fontSize * 1.7) + 8,
					t0: now, durationMs: durationMs, layout: layout, fontSize: fontSize,
					x0: x0, x1: x1, wDev: wCss * dpr,
					paused: false, pausedProgress: 0, uiHold: false
				})
				post({
					type: 'spawn',
					item: {
						id: id, content: content, kind: kind, layout: layout,
						y: yCss * dpr,
						x0: x0, x1: x1, t0: now, durationMs: durationMs,
						alpha: (kind === 'sc' || kind === 'gift') ? 1 : config.opacity,
						tr: cr, tg: cg, tb: cb,
						fontSize: fontSize, stroke: config.stroke
					}
				})
				// GC hit entry only after resume + full travel; paused items stay clickable.
				;(function scheduleHitGc(id, durationMs) {
					setTimeout(function gc() {
						var rec = hitMap.get(id)
						if (!rec) return
						if (rec.paused) {
							setTimeout(gc, 400)
							return
						}
						var elapsed = performance.now() - rec.t0
						if (elapsed > durationMs + 200) {
							hitMap.delete(id)
						} else {
							setTimeout(gc, Math.max(200, durationMs + 200 - elapsed))
						}
					}, durationMs + 200)
				})(id, durationMs)
			}

			function hitAt(x, y, now) {
				var hit = null
				hitMap.forEach(function (rec) {
					var t = rec.paused ? (rec.pausedProgress || 0) : (now - rec.t0) / rec.durationMs
					if (t < 0 || t > 1) return
					// match shader: x_dev = mix(x0, x1, t)
					var xDev = rec.layout === 'roll' ? rec.x0 + (rec.x1 - rec.x0) * t : ((cssW || 800) - (rec.wCss || 0)) * 0.5 * workerDpr
					var px = xDev / workerDpr
					var pw = rec.wCss
					if (x >= px && x <= px + pw && y >= rec.y && y <= rec.y + rec.hCss) hit = rec
				})
				return hit
			}

			function onPointerMove(e) {
				if (!config.interactive) return
				if (!canvas) return
				var rect = canvas.getBoundingClientRect()
				var x = e.clientX - rect.left
				var y = e.clientY - rect.top
				var now = performance.now()
				// A window above owns the pointer: force the no-hit miss path so any
				// hover-hold releases and the cursor resets, then the caller yields.
				var hit = pointerOverWindow(e) ? null : hitAt(x, y, now)
				if (config.hoverPause) {
					hitMap.forEach(function (rec) {
						if (rec.kind === 'sc') return
						if (hit && rec.id === hit.id) {
							if (!rec.paused) {
								rec.pausedProgress = Math.min(1, Math.max(0, (now - rec.t0) / rec.durationMs))
								rec.paused = true
								post({ type: 'pause', id: rec.id })
							}
						} else if (rec.paused && !rec.uiHold) {
							var elapsed = Math.min(1, Math.max(0, rec.pausedProgress || 0)) * rec.durationMs
							rec.t0 = now - elapsed
							rec.paused = false
							post({ type: 'resume', id: rec.id })
						}
					})
				}
				canvas.style.cursor = hit ? 'pointer' : 'default'
			}
			function onClick(e) {
				if (!config.interactive) return
				if (pointerOverWindow(e)) return
				if (!canvas) return
				var rect = canvas.getBoundingClientRect()
				var hit = hitAt(e.clientX - rect.left, e.clientY - rect.top, performance.now())
				if (hit && onHit) {
					e.preventDefault()
					e.stopPropagation()
					onHit(hit.id, { content: hit.content, source: hit.source, id: hit.id, kind: hit.kind })
				}
			}
			function onDblClick(e) {
				if (!config.interactive) return
				if (pointerOverWindow(e)) return
				if (!canvas) return
				var rect = canvas.getBoundingClientRect()
				var hit = hitAt(e.clientX - rect.left, e.clientY - rect.top, performance.now())
				if (hit && onHit) {
					e.preventDefault()
					e.stopPropagation()
					onHit(hit.id, { content: hit.content, source: hit.source, id: hit.id, kind: hit.kind, action: 'like' })
				}
			}

			return {
				kind: 'webgl2-worker',
				mount: function (host) {
					if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') {
						throw new Error('worker/offscreen unavailable')
					}
					hostEl = host
					// Pointer priority resolved once at attach: windows stacked above
					// the overlay layer own the pointer (see pointerOverWindow).
					var overlay = hostEl.closest && hostEl.closest('[data-shell-overlay]')
					var overlayZ = overlay ? parseFloat(getComputedStyle(overlay).zIndex) : NaN
					overlayLayerZ = isFinite(overlayZ) ? overlayZ : 20
					canvas = document.createElement('canvas')
					canvas.className = 'dsh-danmaku-gl dsh-danmaku-gl-worker'
					canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;'
					hostEl.appendChild(canvas)
					var rect = hostEl.getBoundingClientRect()
					cssW = rect.width
					cssH = rect.height
					workerDpr = Math.min(2, window.devicePixelRatio || 1)
					canvas.width = Math.max(1, Math.floor(cssW * workerDpr))
					canvas.height = Math.max(1, Math.floor(cssH * workerDpr))
					var off = canvas.transferControlToOffscreen()
					var blob = new Blob([WORKER_SRC], { type: 'application/javascript' })
					worker = new Worker(URL.createObjectURL(blob))
					worker.onmessage = function (e) {
						if (e.data && e.data.type === 'fail') throw new Error(e.data.reason)
						if (e.data && e.data.type === 'debug-snapshot') debugSnap = e.data.items
					}
					worker.onerror = function (err) {
						console.warn('[dsh-danmaku] worker error', err && err.message)
					}
					post({ type: 'init', canvas: off, config: config, w: canvas.width, h: canvas.height, dpr: workerDpr }, [off])
					document.addEventListener('pointermove', onPointerMove, true)
					document.addEventListener('click', onClick, true)
					document.addEventListener('dblclick', onDblClick, true)
				},
				unmount: function () {
					document.removeEventListener('pointermove', onPointerMove, true)
					document.removeEventListener('click', onClick, true)
					document.removeEventListener('dblclick', onDblClick, true)
					if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas)
					post({ type: 'dispose' })
					if (worker) worker.terminate()
					worker = null
					canvas = null
					hostEl = null
					hitMap.clear()
				},
				resize: function (w, h, areaRatio) {
					if (areaRatio) config.areaRatio = areaRatio
					if (!canvas) return
					cssW = w
					cssH = h
					canvas.style.width = w + 'px'
					canvas.style.height = h + 'px'
					var dpr = Math.min(2, window.devicePixelRatio || 1)
					workerDpr = dpr
					var dw = Math.max(1, Math.floor(w * dpr))
					var dh = Math.max(1, Math.floor(h * dpr))
					resetTracks()
					post({ type: 'resize', w: dw, h: dh })
				},
				setConfig: function (c) {
					var prev = config
					config = clampConfig(Object.assign({}, config, c))
					if (prev.fontSize !== config.fontSize || prev.areaRatio !== config.areaRatio) {
						resetTracks()
					}
					post({ type: 'config', config: config })
					if (prev.opacity !== config.opacity || prev.fontSize !== config.fontSize || prev.scrollSpeed !== config.scrollSpeed || prev.stroke !== config.stroke) {
						post({
							type: 'styles',
							opacity: prev.opacity !== config.opacity ? config.opacity : null,
							fontSize: prev.fontSize !== config.fontSize ? config.fontSize : null,
							scrollSpeed: prev.scrollSpeed !== config.scrollSpeed ? config.scrollSpeed : null,
							stroke: prev.stroke !== config.stroke ? config.stroke : null
						})
					}
					hitMap.forEach(function (rec) {
						if (rec.kind === 'sc') return
						rec.fontSize = config.fontSize
					})
					// Keep hit boxes in sync with a font-size change (bake() rescaled the
					// atlas glyphs in the worker, but the main-thread hitMap is separate).
					if (prev.fontSize !== config.fontSize) {
						var ratio = config.fontSize / Math.max(prev.fontSize, 1)
						hitMap.forEach(function (rec) {
							if (rec.kind === 'sc') return
							rec.wCss = rec.wCss * ratio
							rec.hCss = Math.ceil(config.fontSize * 1.7) + 8
						})
					}
					// Turning interaction/hover-pause off must release hover-held items;
					// uiHold (detail/pauseAll) stays held.
					if ((prev.interactive && !config.interactive) || (prev.hoverPause && !config.hoverPause)) {
						var nowH = performance.now()
						hitMap.forEach(function (rec) {
							if (rec.paused && !rec.uiHold) {
								var elapsed = Math.min(1, Math.max(0, rec.pausedProgress || 0)) * rec.durationMs
								rec.t0 = nowH - elapsed
								rec.paused = false
								post({ type: 'resume', id: rec.id })
							}
						})
					}
				},
				setEnabled: function (on) {
					enabled = !!on
					if (canvas) canvas.style.display = enabled ? 'block' : 'none'
					post({ type: 'enabled', on: enabled })
					if (!enabled) hitMap.clear()
				},
				spawn: function (list) {
					if (!enabled) return
					;(list || []).forEach(spawnOne)
				},
				clear: function () {
					hitMap.clear()
					post({ type: 'clear' })
				},
				setIdleAlpha: function (a) {
					post({ type: 'idleAlpha', v: a })
				},
				pauseLoop: function () { post({ type: 'loop-pause' }) },
				resumeLoop: function () { post({ type: 'loop-resume' }) },
				pauseAll: function () {
					uiHold = true
					var now = performance.now()
					hitMap.forEach(function (rec) {
						rec.uiHold = true
						if (!rec.paused) {
							rec.pausedProgress = Math.min(1, Math.max(0, (now - rec.t0) / rec.durationMs))
							rec.paused = true
							post({ type: 'pause', id: rec.id })
						}
					})
				},
				resumeAll: function () {
					uiHold = false
					var now = performance.now()
					hitMap.forEach(function (rec) {
						rec.uiHold = false
						if (rec.paused) {
							var elapsed = Math.min(1, Math.max(0, rec.pausedProgress || 0)) * rec.durationMs
							rec.t0 = now - elapsed
							rec.paused = false
							post({ type: 'resume', id: rec.id })
						}
					})
				},
				pauseOne: function (id) {
					var rec = hitMap.get(id)
					if (!rec) return
					rec.uiHold = true
					if (!rec.paused) {
						var now = performance.now()
						rec.pausedProgress = Math.min(1, Math.max(0, (now - rec.t0) / rec.durationMs))
						rec.paused = true
						post({ type: 'pause', id: id })
					}
				},
				resumeOne: function (id) {
					var rec = hitMap.get(id)
					if (!rec) return
					rec.uiHold = false
					if (rec.paused) {
						var now = performance.now()
						var elapsed = Math.min(1, Math.max(0, rec.pausedProgress || 0)) * rec.durationMs
						rec.t0 = now - elapsed
						rec.paused = false
						post({ type: 'resume', id: id })
					}
				},
				removeOne: function (id) {
					hitMap.delete(id)
					post({ type: 'remove', id: id })
				},
				requestDebugSnapshot: function () {
					post({ type: 'debug-snapshot' })
					return debugSnap
				},
				getHitMap: function () { return hitMap },
				onHit: function (cb) { onHit = cb },
				getLayer: function () { return canvas },
				stats: function () { return { onscreen: hitMap.size, kind: 'webgl2-worker' } }
			}
		}

		function createRenderer(prefer) {
			var mode = prefer || 'dom'
			// Default DOM: native hover-pause + click; WebGL2 is optional for density.
			if (mode === 'webgl2' || mode === 'webgl2-main') {
				try { return createWebgl2Renderer() } catch (e) {
					console.warn('[dsh-danmaku] webgl2 failed, fallback DOM:', e && e.message)
					return createDomRenderer()
				}
			}
			if (mode === 'webgl2-worker') {
				try { return createWebgl2WorkerRenderer() } catch (e) {
					console.warn('[dsh-danmaku] worker failed, try webgl2-main:', e && e.message)
				}
				try { return createWebgl2Renderer() } catch (e) {
					console.warn('[dsh-danmaku] webgl2 failed, fallback DOM:', e && e.message)
					return createDomRenderer()
				}
			}
			if (mode === 'auto') {
				try { return createWebgl2WorkerRenderer() } catch (e) { /* next */ }
				try { return createWebgl2Renderer() } catch (e) {
					console.warn('[dsh-danmaku] webgl2 failed, fallback DOM:', e && e.message)
				}
			}
			return createDomRenderer()
		}

		// ---------- Draggable ball + quick pop ----------
		function ControlBall(props) {
			var t = props.t
			var config = props.config
			var patchLive = props.patchLive
			var onOpenSettings = props.onOpenSettings
			var posState = React.useState(function () {
				try {
					var raw = localStorage.getItem(BALL_POS_KEY)
					if (raw) return JSON.parse(raw)
				} catch (e) { /* ignore */ }
				return { x: window.innerWidth - 72, y: 88 }
			})
			var pos = posState[0]
			var setPos = posState[1]
			// Owned by DanmakuOverlay, not local state: the area editor hides this
			// window and has to put it back exactly as it was.
			var popOpen = props.popOpen
			var setPopOpen = props.setPopOpen || function () { /* read-only fallback */ }
			var dragRef = React.useRef(null)

			function onPointerDown(e) {
				e.preventDefault()
				e.currentTarget.setPointerCapture(e.pointerId)
				dragRef.current = {
					id: e.pointerId,
				 startX: e.clientX,
				 startY: e.clientY,
				 origX: pos.x,
				 origY: pos.y,
				 moved: false
				}
			}

			function onPointerMove(e) {
				var d = dragRef.current
				if (!d || d.id !== e.pointerId) return
				var dx = e.clientX - d.startX
				var dy = e.clientY - d.startY
				if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true
				var x = Math.min(window.innerWidth - 48, Math.max(8, d.origX + dx))
				var y = Math.min(window.innerHeight - 48, Math.max(8, d.origY + dy))
				setPos({ x: x, y: y })
			}

			function onPointerUp(e) {
				var d = dragRef.current
				dragRef.current = null
				try { e.currentTarget.releasePointerCapture(e.pointerId) } catch (err) { /* ignore */ }
				try { localStorage.setItem(BALL_POS_KEY, JSON.stringify(pos)) } catch (err) { /* ignore */ }
				if (!d || !d.moved) setPopOpen(!popOpen)
			}

			var ball = React.createElement('div', {
				className: 'dsh-danmaku-ball',
				title: t('dragHint'),
				'data-on': config.enabled ? '1' : '0',
				style: { left: pos.x + 'px', top: pos.y + 'px' },
				onPointerDown: onPointerDown,
				onPointerMove: onPointerMove,
				onPointerUp: onPointerUp
			}, '弹')

			if (props.hidden) return null
			if (!popOpen) return ball

			var pop = React.createElement('div', {
				className: 'dsh-danmaku-pop',
				style: {
					left: Math.min(pos.x, window.innerWidth - 250) + 'px',
					top: (pos.y + 48) + 'px'
				}
			}, [
				React.createElement('div', { key: 't', style: { fontWeight: 600, marginBottom: 6 } }, t('quickTitle')),
				React.createElement('label', { key: 'e' }, [
					React.createElement('span', { key: 'l' }, t('enabled')),
					React.createElement('input', {
						key: 'i', type: 'checkbox', checked: !!config.enabled,
						onChange: function (e) { patchLive({ enabled: e.target.checked }) }
					})
				]),
				React.createElement('label', { key: 'ix' }, [
					React.createElement('span', { key: 'l' }, t('interactive')),
					React.createElement('input', {
						key: 'i', type: 'checkbox', checked: !!config.interactive,
						onChange: function (e) { patchLive({ interactive: e.target.checked }) }
					})
				]),
				React.createElement('label', { key: 'o' }, [
					React.createElement('span', { key: 'l' }, t('opacity')),
					sliderField({
						key: 'i',
						min: 0.1, max: 1, step: 0.05, value: config.opacity, rangeMax: 110,
						onChange: function (v) { patchLive({ opacity: v }) }
					})
				]),
				React.createElement('label', { key: 'sp' }, [
					React.createElement('span', { key: 'l' }, t('scrollSpeed')),
					sliderField({
						key: 'i',
						min: 40, max: 320, step: 10, value: config.scrollSpeed || 140, rangeMax: 110,
						onChange: function (v) { patchLive({ scrollSpeed: v }) }
					})
				]),
				React.createElement('label', { key: 'fs' }, [
					React.createElement('span', { key: 'l' }, t('fontSize')),
					sliderField({
						key: 'i',
						min: 12, max: 28, step: 1, value: config.fontSize, rangeMax: 110,
						onChange: function (v) { patchLive({ fontSize: v }) }
					})
				]),
				React.createElement('label', { key: 'm' }, [
					React.createElement('span', { key: 'l' }, t('maxOnscreen')),
					sliderField({
						key: 'i',
						min: 5, max: 80, step: 1, value: config.maxOnscreen, rangeMax: 110,
						onChange: function (v) { patchLive({ maxOnscreen: v }) }
					})
				]),
				React.createElement('label', { key: 'a' }, [
					React.createElement('span', { key: 'l' }, t('areaRatio')),
					React.createElement('select', {
						key: 'i', value: String(config.areaRatio),
						onChange: function (e) { patchLive({ areaRatio: Number(e.target.value) }) }
					}, [
						React.createElement('option', { key: '1', value: '0.25' }, '1/4'),
						React.createElement('option', { key: '2', value: '0.5' }, '1/2'),
						React.createElement('option', { key: '3', value: '0.75' }, '3/4'),
						React.createElement('option', { key: '4', value: '1' }, '1')
					])
				]),
				React.createElement('label', { key: 'llm' }, [
					React.createElement('span', { key: 'l' }, t('llmEnabled')),
					React.createElement('input', {
						key: 'i', type: 'checkbox', checked: !!config.llmEnabled,
						onChange: function (e) { patchLive({ llmEnabled: e.target.checked }) }
					})
				]),
				React.createElement('div', {
					key: 'open',
					style: { marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.1))' }
				}, [
					React.createElement('button', {
						key: 'btn',
						type: 'button',
						style: {
							width: '100%', borderRadius: 10, border: 'none',
							background: '#fb7299', color: '#fff', padding: '10px 12px',
							cursor: 'pointer', fontSize: 13, fontWeight: 600,
							boxShadow: '0 2px 8px rgba(251,114,153,.35)'
						},
						onClick: function () {
							if (props.onOpenSettings) props.onOpenSettings()
							setPopOpen(false)
						}
					}, t('openFullSettings')),
					React.createElement('button', {
						key: 'area',
						type: 'button',
						style: {
							width: '100%', marginTop: 6, borderRadius: 10,
							border: '1px solid var(--dsw-alias-border-l4, rgba(0,0,0,.16))',
							background: 'transparent', color: 'inherit',
							padding: '9px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600
						},
						onClick: function () {
							if (props.onOpenAreaEditor) props.onOpenAreaEditor()
						}
					}, t('areaEditor'))
				])
			])

			return React.createElement(React.Fragment, null, [ball, pop])
		}

		// ---------- Color weights modal ----------
		function ColorWeightsEditor(props) {
			var t = props.t
			var weights = props.weights
			var onChange = props.onChange
			var onClose = props.onClose

			function patchAt(i, partial) {
				var next = weights.map(function (w, idx) {
					return idx === i ? Object.assign({}, w, partial) : w
				})
				onChange(next)
			}

			return React.createElement('div', Object.assign({
				className: 'dsh-danmaku-modal'
			}, backdropCloseProps(onClose)), [
				React.createElement('div', {
					key: 'card',
					className: 'dsh-danmaku-modal-card',
					onClick: function (e) { e.stopPropagation() }
				}, [
					React.createElement('h3', { key: 'h' }, t('colorWeightsTitle')),
					React.createElement('div', { key: 'hint', style: { fontSize: 12, opacity: 0.7, marginBottom: 10 } }, t('colorWeightsHint')),
					weights.map(function (w, i) {
						return React.createElement('div', {
							key: 'w' + i,
							style: { display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }
						}, [
							React.createElement('input', {
								key: 'c', type: 'color', value: w.color || '#FFFFFF',
								onChange: function (e) { patchAt(i, { color: e.target.value }) }
							}),
							React.createElement('input', {
								key: 'n', type: 'range', min: 0, max: 100, value: w.weight || 0,
								style: { flex: 1, minWidth: 0 },
								onChange: function (e) { patchAt(i, { weight: Number(e.target.value) }) }
							}),
							clampedNumberInput({
								key: 'v', min: 0, max: 100, step: 1,
								value: w.weight || 0,
								style: {
									width: 56, marginLeft: 6, padding: '2px 4px', borderRadius: 6,
									border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15))',
									background: 'transparent', color: 'inherit', boxSizing: 'border-box'
								},
								onChange: function (v) { patchAt(i, { weight: v }) }
							}),
							React.createElement('button', {
								key: 'x',
								style: { border: 'none', background: 'transparent', color: '#f66', cursor: 'pointer' },
								onClick: function () { onChange(weights.filter(function (_, j) { return j !== i })) }
							}, '×')
						])
					}),
					React.createElement('div', { key: 'prev', style: { display: 'flex', gap: 4, margin: '10px 0', alignItems: 'center' } },
						[React.createElement('span', { key: 'l', style: { fontSize: 12, opacity: 0.7 } }, t('preview') + ':')]
							.concat(weights.map(function (w, i) {
								var share = Number(w.weight || 0)
								return React.createElement('span', {
									key: 'p' + i,
									title: w.color + ' ' + share,
									style: {
										width: Math.max(4, share) + 'px',
										height: 14,
										borderRadius: 3,
										background: w.color,
										opacity: 0.9
									}
								})
							}))
					),
					React.createElement('div', { className: 'dsh-danmaku-modal-actions', key: 'a' }, [
						React.createElement('button', {
							key: 'add',
							onClick: function () {
								onChange(weights.concat([{ color: '#00CD00', weight: 5 }]))
							}
						}, '+'),
						React.createElement('button', { key: 'ok', onClick: onClose }, t('close'))
					])
				])
			])
		}

		// ---------- Settings tab panel ----------
		function SettingsPanel(props) {
			var t = props.t
			var draft = props.draft
			var setDraft = props.setDraft
			var onSave = props.onSave
			var onUndo = props.onUndo
			var status = props.status
			var dirtyText = props.dirtyText || ''
			var hideHeader = props.hideHeader
			var hideActions = props.hideActions != null ? props.hideActions : hideHeader

			function patch(partial) {
				setDraft(Object.assign({}, draft, partial))
			}
			function row(key, label, control) {
				return React.createElement('div', { className: 'dsh-danmaku-row', key: key }, [
					React.createElement('span', { key: 'l' }, label),
					control
				])
			}
			var colorOpenState = React.useState(false)
			var colorOpen = colorOpenState[0]
			var setColorOpen = colorOpenState[1]
			var modelGroupsState = React.useState([])
			var modelGroups = modelGroupsState[0]
			var setModelGroups = modelGroupsState[1]
			function llmModelControl() {
				var noneLabel = t('llmNone') || '不使用 LLM'
				if (!modelGroups || !modelGroups.length) {
					return row('llmModel', t('llmModel'), React.createElement('input', {
						key: 'c', type: 'text', value: draft.llmModel || '',
						placeholder: '-',
						title: '“-”表示不使用 LLM；填 provider/model 启用生成',
						onChange: function (e) { patch({ llmModel: e.target.value }) }
					}))
				}
				var cur = draft.llmModel || '-'
				var known = cur === '-'
				var opts = [React.createElement('option', { key: '__none__', value: '-' }, noneLabel)]
				modelGroups.forEach(function (g) {
					opts.push(React.createElement('optgroup', { key: 'grp-' + g.provider, label: g.provider }, (g.models || []).map(function (m) {
						var id = g.provider + '/' + m.id
						if (id === cur) known = true
						return React.createElement('option', { key: m.id, value: id }, m.name || m.id)
					})))
				})
				if (!known) opts.push(React.createElement('option', { key: cur, value: cur }, cur))
				return row('llmModel', t('llmModel'), React.createElement('select', {
					key: 'c', value: cur,
					onChange: function (e) { patch({ llmModel: e.target.value }) }
				}, opts))
			}
			var tplOpenState = React.useState(false)
			var tplOpen = tplOpenState[0]
			var setTplOpen = tplOpenState[1]
			var presetsOpenState = React.useState(false)
			var presetsOpen = presetsOpenState[0]
			var setPresetsOpen = presetsOpenState[1]
			var emojiOpenState = React.useState(false)
			var emojiOpen = emojiOpenState[0]
			var setEmojiOpen = emojiOpenState[1]
			var expandedAdvState = React.useState({})
			var expandedAdv = expandedAdvState[0]
			var setExpandedAdv = expandedAdvState[1]
			var packListState = React.useState([
				{ id: 'general', name: '通用' },
				{ id: 'coding', name: '编程' },
				{ id: 'casual', name: '闲聊' }
			])
			var packList = packListState[0]
			var setPackList = packListState[1]
			var poolState = React.useState(null)
			var poolInfo = poolState[0]
			var setPoolInfo = poolState[1]

			function loadPacks() {
				return fetchJson('/api/danmaku/presets').then(function (s) {
					applyPresetStore(s)
					var order = (s && s.order) || Object.keys((s && s.packs) || {})
					setPackList(order.map(function (id) {
						return { id: id, name: (s.packs[id] && s.packs[id].name) || id }
					}))
				}).catch(function () { /* keep defaults */ })
			}

			React.useEffect(function () {
				loadPacks()
				fetchJson('/api/danmaku/models').then(function (d) {
					setModelGroups((d && d.groups) || [])
				}).catch(function () { setModelGroups([]) })
				fetchJson('/api/danmaku/pool?sessionId=__stats_probe__&stats=1').then(function (d) {
					setPoolInfo(d)
				}).catch(function () { /* ignore */ })
			}, [])

			return React.createElement('div', { className: 'dsh-danmaku-card' }, [
				hideHeader ? null : React.createElement('h3', { key: 't' }, t('cardTitle')),
				hideHeader ? null : React.createElement('div', { className: 'desc', key: 'd' }, t('cardDesc')),
				React.createElement('div', { className: 'dsh-danmaku-section', key: 's1', 'data-sec': 'basics' }, t('secBasics')),
				row('enabled', t('enabled'), React.createElement('input', {
					key: 'c', type: 'checkbox', checked: !!draft.enabled,
					onChange: function (e) { patch({ enabled: e.target.checked }) }
				})),
				row('opacity', t('opacity'), sliderField({
					min: 0.1, max: 1, step: 0.05, value: draft.opacity,
					onChange: function (v) { patch({ opacity: v }) }
				})),
				row('opacityIdle', t('opacityIdle'), sliderField({
					min: 0, max: 0.6, step: 0.05, value: draft.opacityIdle,
					onChange: function (v) { patch({ opacityIdle: v }) }
				})),
				row('antiOcclude', t('antiOcclude'), React.createElement('input', {
					key: 'c', type: 'checkbox', checked: !!draft.antiOcclude,
					onChange: function (e) { patch({ antiOcclude: e.target.checked }) }
				})),
				row('maxOnscreen', t('maxOnscreen'), clampedNumberInput({
					key: 'c', min: 1, max: 200, value: draft.maxOnscreen,
					onChange: function (v) { patch({ maxOnscreen: v }) }
				})),
				row('fontSize', t('fontSize'), sliderField({
					min: 12, max: 28, step: 1, value: draft.fontSize,
					onChange: function (v) { patch({ fontSize: v }) }
				})),
				row('crossSec', t('crossSec'), sliderField({
					min: 4, max: 15, step: 1, value: draft.crossSec,
					onChange: function (v) { patch({ crossSec: v }) }
				})),
				row('scrollSpeed', t('scrollSpeed'), sliderField({
					min: 40, max: 320, step: 10, value: draft.scrollSpeed || 140,
					onChange: function (v) { patch({ scrollSpeed: v }) }
				})),
				row('areaRatio', t('areaRatio'), React.createElement('select', {
					key: 'c', value: String(draft.areaRatio),
					onChange: function (e) { patch({ areaRatio: Number(e.target.value) }) }
				}, [
					React.createElement('option', { key: '0.25', value: '0.25' }, '1/4'),
					React.createElement('option', { key: '0.5', value: '0.5' }, '1/2'),
					React.createElement('option', { key: '0.75', value: '0.75' }, '3/4'),
					React.createElement('option', { key: '1', value: '1' }, '1')
				])),
				row('layoutRoll', t('layoutRoll'), sliderField({
					min: 0, max: 100, step: 1, value: draft.layoutWeights.roll,
					onChange: function (v) { patch({ layoutWeights: Object.assign({}, draft.layoutWeights, { roll: v }) }) }
				})),
				row('layoutTop', t('layoutTop'), sliderField({
					min: 0, max: 100, step: 1, value: draft.layoutWeights.top,
					onChange: function (v) { patch({ layoutWeights: Object.assign({}, draft.layoutWeights, { top: v }) }) }
				})),
				row('layoutBottom', t('layoutBottom'), sliderField({
					min: 0, max: 100, step: 1, value: draft.layoutWeights.bottom,
					onChange: function (v) { patch({ layoutWeights: Object.assign({}, draft.layoutWeights, { bottom: v }) }) }
				})),
				row('stroke', t('stroke'), React.createElement('input', {
					key: 'c', type: 'checkbox', checked: !!draft.stroke,
					onChange: function (e) { patch({ stroke: e.target.checked }) }
				})),
				row('hoverPause', t('hoverPause'), React.createElement('input', {
					key: 'c', type: 'checkbox', checked: !!draft.hoverPause,
					onChange: function (e) { patch({ hoverPause: e.target.checked }) }
				})),
				row('interactive', t('interactive'), React.createElement('input', {
					key: 'c', type: 'checkbox', checked: !!draft.interactive,
					onChange: function (e) { patch({ interactive: e.target.checked }) }
				})),
				React.createElement('div', { className: 'dsh-danmaku-section', key: 'sPool', 'data-sec': 'pool' }, t('modalPool')),
				React.createElement('div', {
					key: 'poolRow',
					style: {
						display: 'flex', alignItems: 'center', justifyContent: 'space-between',
						gap: 8, margin: '4px 0 10px', fontSize: 12, opacity: 0.85
					}
				}, [
					React.createElement('span', { key: 'st' },
						(t('poolLive') + ' ' + ((poolInfo && poolInfo.sessions && poolInfo.sessions.length) || 0)) +
						(poolInfo && poolInfo.sessions
							? ' · ' + t('poolArchived') + ' ' + poolInfo.sessions.reduce(function (s, x) { return s + (Number(x.archived) || 0) }, 0)
							: '')),
					React.createElement('button', {
						key: 'open',
						type: 'button',
						style: {
							borderRadius: 8, border: '1px solid rgba(128,128,128,.4)',
							background: 'transparent', color: 'inherit', padding: '4px 10px', cursor: 'pointer', fontSize: 12
						},
						onClick: function () { if (props.onOpenPool) props.onOpenPool(); }
					}, t('openPoolEditor'))
				]),
				React.createElement('div', { className: 'dsh-danmaku-section', key: 'sGift', 'data-sec': 'gift' }, t('secGift')),
				row('giftEnabled', t('giftMaster'), React.createElement('input', {
					key: 'c', type: 'checkbox', 'data-gift-master': '1', checked: draft.giftEnabled === true,
					onChange: function (e) { patch({ giftEnabled: e.target.checked }) }
				})),
				React.createElement('div', {
					key: 'giftIntro', className: 'desc', style: { fontSize: 11, opacity: 0.75, margin: '2px 0 8px' }
				}, t('giftIntro')),
				React.createElement('div', { key: 'giftEntry', className: 'dsh-gift-entry' }, [
					React.createElement('button', {
						key: 'cfg', type: 'button', 'data-gift-open-config': '1',
						onClick: function () { if (props.onOpenGift) props.onOpenGift(null) },
					}, t('giftOpenConfig')),
					React.createElement('button', {
						key: 'assets', type: 'button', 'data-gift-open-assets': '1',
						onClick: function () { if (props.onOpenGift) props.onOpenGift('assets') },
					}, t('giftOpenAssets')),
				]),
				React.createElement('div', { className: 'dsh-danmaku-section', key: 's2', 'data-sec': 'content' }, t('secContent')),
				row('presetPack', t('presetPack'), React.createElement('div', {
					key: 'c',
					style: { display: 'flex', gap: 6, alignItems: 'center' }
				}, [
					React.createElement('select', {
						key: 's', value: draft.presetPack,
						style: { flex: 1, minWidth: 100 },
						onChange: function (e) { patch({ presetPack: e.target.value }) }
					}, packList.map(function (p) {
						return React.createElement('option', { key: p.id, value: p.id }, p.name)
					})),
					React.createElement('button', {
						key: 'e',
						type: 'button',
						style: {
							borderRadius: 8, border: '1px solid rgba(128,128,128,.4)',
							background: 'transparent', color: 'inherit', padding: '4px 10px', cursor: 'pointer', fontSize: 12
						},
						onClick: function () { setPresetsOpen(true) }
					}, t('editPresets'))
				])),
				React.createElement(CollapseSection, {
					key: 'emojiSec',
					sectionKey: 'emojiSec',
					title: t('emojiEnabled'),
					defaultOpen: false
				}, [
					row('emojiEnabled', t('emojiEnabled'), React.createElement('input', {
						key: 'c', type: 'checkbox', checked: draft.emojiEnabled === true,
						onChange: function (e) { patch({ emojiEnabled: e.target.checked }) }
					})),
					row('emojiBaseSize', t('emojiBaseSize'), sliderField({
						min: 16, max: 128, step: 4, value: draft.emojiBaseSize || 48,
						disabled: draft.emojiEnabled === false,
						onChange: function (v) { patch({ emojiBaseSize: v }) }
					})),
					row('emojiTotalProb', t('emojiTotalProb'), sliderField({
						min: 0, max: 0.5, step: 0.01, value: draft.emojiTotalProb != null ? draft.emojiTotalProb : 0.15,
						disabled: draft.emojiEnabled === false,
						onChange: function (v) { patch({ emojiTotalProb: v }) }
					})),
					row('emojiEdit', t('emojiEdit'), React.createElement('button', {
						key: 'c',
						type: 'button',
						style: {
							borderRadius: 8, border: '1px solid rgba(128,128,128,.4)',
							background: 'transparent', color: 'inherit', padding: '4px 10px', cursor: 'pointer', fontSize: 12
						},
						onClick: function () { setEmojiOpen(true) }
					}, t('emojiEdit')))
				]),
				React.createElement(CollapseSection, {
					key: 'adv',
					sectionKey: 'adv',
					title: t('advancedEnabled'),
					defaultOpen: false
				}, [
					React.createElement('div', {
						key: 'hint',
						style: { fontSize: 11, opacity: 0.7, marginBottom: 8 }
					}, t('advancedHint')),
					row('advancedEnabled', t('advancedEnabled'), React.createElement('input', {
						key: 'c', type: 'checkbox', checked: draft.advancedEnabled === true,
						onChange: function (e) { patch({ advancedEnabled: e.target.checked }) }
					})),
					React.createElement('div', {
						key: 'stTitle',
						style: { fontSize: 12, fontWeight: 600, margin: '10px 0 6px' }
					}, t('advStyles')),
					(draft.advancedStyles || []).map(function (s, i) {
						function setS(partial) {
							var next = (draft.advancedStyles || []).map(function (x, j) {
								return j === i ? Object.assign({}, x, partial) : x
							})
							patch({ advancedStyles: next })
						}
						var exp = !!expandedAdv[s.id || ('i' + i)]
						var numStyle = {
							width: 52, fontSize: 12, padding: 4, borderRadius: 6,
							border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15))',
							background: 'transparent', color: 'inherit', boxSizing: 'border-box'
						}
						var lbl = { fontSize: 11, opacity: 0.8 }
						return React.createElement('div', {
							key: s.id || 's' + i,
							style: {
								display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
								margin: '6px 0', padding: '6px 8px', borderRadius: 8,
								border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.12))'
							}
						}, [
							React.createElement('input', {
								key: 'n', type: 'text', value: s.name || '',
								style: Object.assign({ width: 88, fontSize: 12, padding: 4, borderRadius: 6, border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15))', background: 'transparent', color: 'inherit' }),
								onChange: function (e) { setS({ name: e.target.value.slice(0, 20) }) }
							}),
							React.createElement('label', { key: 'wl', style: lbl }, t('advWeight')),
							clampedNumberInput({
								key: 'w', min: 0, max: 100, step: 0.5, value: s.weight, style: numStyle,
								onChange: function (v) { setS({ weight: v }) }
							}),
							React.createElement('label', { key: 'rl', style: lbl }, t('advRotate')),
							clampedNumberInput({
								key: 'r', min: -30, max: 30, value: s.rotate, style: numStyle,
								onChange: function (v) { setS({ rotate: v }) }
							}),
							React.createElement('label', { key: 'sl', style: lbl }, t('advScale')),
							clampedNumberInput({
								key: 'sc', min: 0.8, max: 1.6, step: 0.05, value: s.scale, style: numStyle,
								onChange: function (v) { setS({ scale: v }) }
							}),
							React.createElement('label', { key: 'bl', style: lbl }, t('advBold')),
							React.createElement('input', {
								key: 'b', type: 'checkbox', checked: !!s.bold,
								onChange: function (e) { setS({ bold: e.target.checked }) }
							}),
							React.createElement('label', { key: 'ol', style: lbl }, t('advOpacity')),
							clampedNumberInput({
								key: 'o', min: 0.3, max: 1, step: 0.05, value: s.opacity, style: numStyle,
								onChange: function (v) { setS({ opacity: v }) }
							}),
							React.createElement('button', {
								key: 'more', type: 'button',
								style: {
									borderRadius: 8, border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.18))',
									background: exp ? 'rgba(251,114,153,.15)' : '#fff', color: 'inherit',
									padding: '2px 8px', cursor: 'pointer', fontSize: 11
								},
								onClick: function () {
									var o = Object.assign({}, expandedAdv)
									var key = s.id || ('i' + i)
									if (o[key]) delete o[key]
									else o[key] = true
									setExpandedAdv(o)
								}
							}, exp ? '−' : t('advMore')),
							React.createElement('div', { key: 'sp', style: { flex: 1 } }),
							React.createElement('button', {
								key: 'd', type: 'button', title: t('advDel'),
								style: {
									width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(220,38,38,.4)',
									background: '#fff', color: '#dc2626', cursor: 'pointer', marginLeft: 'auto'
								},
								onClick: function () {
									patch({ advancedStyles: (draft.advancedStyles || []).filter(function (_, j) { return j !== i }) })
								}
							}, '×'),
							exp ? React.createElement('div', {
								key: 'ex',
								style: {
									width: '100%', display: 'flex', flexWrap: 'wrap', gap: 6,
									alignItems: 'center', paddingTop: 6,
									borderTop: '1px dashed var(--dsw-alias-border-l3,rgba(0,0,0,.12))'
								}
							}, [
								React.createElement('label', { key: 'fl', style: lbl }, t('advFont')),
								React.createElement('input', {
									key: 'f', type: 'text', value: s.font || '',
									placeholder: 'serif / monospace / …',
									style: Object.assign({}, numStyle, { width: 120 }),
									onChange: function (e) { setS({ font: e.target.value.slice(0, 60) }) }
								}),
								React.createElement('label', { key: 'dl', style: lbl }, t('advDuration')),
								clampedNumberInput({
									key: 'du', min: 1000, max: 8000, step: 100, value: s.durationMs || 4000,
									style: numStyle,
									onChange: function (v) { setS({ durationMs: v }) }
								}),
								React.createElement('label', { key: 'ml', style: lbl }, t('advMode')),
								React.createElement('select', {
									key: 'md', value: s.mode || 'scroll',
									style: Object.assign({}, numStyle, { width: 90 }),
									onChange: function (e) { setS({ mode: e.target.value }) }
								}, [
									React.createElement('option', { key: 's', value: 'scroll' }, t('advModeScroll')),
									React.createElement('option', { key: 'rv', value: 'reverse' }, t('advModeReverse')),
									React.createElement('option', { key: 'r', value: 'rain' }, t('advModeRain')),
									React.createElement('option', { key: 'p', value: 'pop' }, t('advModePop'))
								])
							]) : null
						])
					}),
					React.createElement('div', { key: 'add', style: { marginTop: 8 } }, [
						React.createElement('button', {
							key: 'b',
							type: 'button',
							style: {
								width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.18))',
								background: '#fff', color: 'inherit', cursor: 'pointer', fontSize: 18
							},
							onClick: function () {
								patch({
									advancedStyles: (draft.advancedStyles || []).concat([{
										id: 'as_' + Date.now().toString(36),
										name: '新样式', weight: 1, rotate: 0, scale: 1.1, bold: false, opacity: 1
									}])
								})
							}
						}, '+')
					])
				]),
				row('ambient', t('ambient'), React.createElement('input', {
					key: 'c', type: 'text',
					value: (draft.ambientMinMs / 1000).toFixed(1) + ' – ' + (draft.ambientMaxMs / 1000).toFixed(1),
					onChange: function (e) {
						var parts = String(e.target.value).split(/[–\-~]/)
						var a = Number(String(parts[0] || '').trim()) * 1000
						var b = Number(String(parts[1] || parts[0] || '').trim()) * 1000
						if (Number.isFinite(a) && Number.isFinite(b)) {
							patch({ ambientMinMs: Math.max(200, a), ambientMaxMs: Math.max(a + 100, b) })
						}
					}
				})),
				row('density', t('density'), sliderField({
					min: 1, max: 5, step: 1, value: draft.density || 3,
					onChange: function (v) { patch({ density: v }) }
				})),
				row('maxPoolEntries', t('maxPoolEntries'), clampedNumberInput({
					key: 'c', min: 20, max: 2000, value: draft.maxPoolEntries || 200,
					onChange: function (v) { patch({ maxPoolEntries: v }) }
				})),
				row('historyReplayMax', t('historyReplayMax'), clampedNumberInput({
					key: 'c', min: 0, max: 50, value: draft.historyReplayMax != null ? draft.historyReplayMax : 12,
					onChange: function (v) { patch({ historyReplayMax: v }) }
				})),
				longTextArea({
					key: 'blockedWords',
					label: t('blockedWords'),
					value: (draft.blockedWords || []).join(', '),
					onChange: function (raw) {
						patch({ blockedWords: raw.split(/[,，]/).map(function (s) { return s.trim() }).filter(Boolean) })
					}
				}),
				row('allowEmoji', t('allowEmoji'), React.createElement('input', {
					key: 'c', type: 'checkbox', checked: draft.allowEmoji !== false,
					onChange: function (e) { patch({ allowEmoji: e.target.checked }) }
				})),
				React.createElement('div', { className: 'dsh-danmaku-hr', key: 'hr-color' }),
				React.createElement('div', { className: 'dsh-danmaku-section', key: 'sColor', 'data-sec': 'content' }, t('secFx')),
				row('uniformColor', t('uniformColor'), React.createElement('input', {
					key: 'c', type: 'checkbox', checked: !!draft.uniformColor,
					onChange: function (e) { patch({ uniformColor: e.target.checked }) }
				})),
				row('color', t('color'), React.createElement('input', {
					key: 'c', type: 'color', value: draft.color || '#FFFFFF',
					disabled: !draft.uniformColor,
					onChange: function (e) { patch({ color: e.target.value }) }
				})),
				row('colorWeightsBtn', t('colorWeightsBtn'), React.createElement('button', {
					key: 'c',
					type: 'button',
					disabled: !!draft.uniformColor,
					style: {
						borderRadius: 8, border: '1px solid rgba(128,128,128,.4)',
						background: 'transparent', color: 'inherit', padding: '6px 10px', cursor: 'pointer'
					},
					onClick: function () { setColorOpen(true) }
				}, t('colorWeightsBtn'))),
				row('historyReplayEnabled', t('historyReplayEnabled'), React.createElement('input', {
					key: 'c', type: 'checkbox', checked: draft.historyReplayEnabled !== false,
					onChange: function (e) { patch({ historyReplayEnabled: e.target.checked }) }
				})),
				row('halfLifeDays', t('halfLifeDays'), clampedNumberInput({
					key: 'c', min: 1, max: 30, value: draft.halfLifeDays || 7,
					disabled: draft.historyReplayEnabled === false,
					onChange: function (v) { patch({ halfLifeDays: v }) }
				})),
				row('archiveAfterDays', t('archiveAfterDays'), clampedNumberInput({
					key: 'c', min: 1, max: 365, value: draft.archiveAfterDays || 60,
					onChange: function (v) { patch({ archiveAfterDays: v }) }
				})),
				row('restoreMaxAgeHours', t('restoreMaxAgeHours') + ' (h)', clampedNumberInput({
					key: 'c', min: 1, max: 720, value: draft.restoreMaxAgeHours || 168,
					onChange: function (v) { patch({ restoreMaxAgeHours: v }) }
				})),
				row('welcomeOnEnter', t('welcomeOnEnter'), React.createElement('input', {
					key: 'c', type: 'checkbox', checked: draft.welcomeOnEnter !== false,
					onChange: function (e) { patch({ welcomeOnEnter: e.target.checked }) }
				})),
				row('taskDoneRain', t('taskDoneRain'), React.createElement('input', {
					key: 'c', type: 'checkbox', checked: draft.taskDoneRain !== false,
					onChange: function (e) { patch({ taskDoneRain: e.target.checked }) }
				})),
				row('toolErrorSc', t('toolErrorSc'), React.createElement('input', {
					key: 'c', type: 'checkbox', checked: draft.toolErrorSc !== false,
					onChange: function (e) { patch({ toolErrorSc: e.target.checked }) }
				})),
				row('showHeat', t('showHeat'), React.createElement('input', {
					key: 'c', type: 'checkbox', checked: draft.showHeat !== false,
					onChange: function (e) { patch({ showHeat: e.target.checked }) }
				})),
				React.createElement('div', { className: 'dsh-danmaku-hr', key: 'hr-dbg' }),
				React.createElement('div', { className: 'dsh-danmaku-section', key: 'sDbg' }, t('secDebug')),
				row('debugSource', t('debugSource'), React.createElement('input', {
					key: 'c', type: 'checkbox', checked: draft.debugSource === true,
					onChange: function (e) { patch({ debugSource: e.target.checked }) }
				})),
				React.createElement('div', {
					key: 'dbgNote',
					style: { fontSize: 11, opacity: 0.7, textAlign: 'right', marginBottom: 6 }
				}, t('debugNote')),
				row('debugLogs', t('debugLogs'), React.createElement('input', {
					key: 'c', type: 'checkbox', checked: draft.debugLogs === true,
					onChange: function (e) { patch({ debugLogs: e.target.checked }) }
				})),
				React.createElement('div', {
					key: 'dbgLogsNote',
					style: { fontSize: 11, opacity: 0.7, textAlign: 'right', marginBottom: 6 }
				}, t('debugLogsNote')),
				React.createElement('div', { className: 'dsh-danmaku-hr', key: 'hr-llm' }),
				React.createElement('div', { className: 'dsh-danmaku-section', key: 's3', 'data-sec': 'llm' }, t('secLlm')),
				row('llmEnabled', t('llmEnabled'), React.createElement('input', {
					key: 'c', type: 'checkbox', checked: !!draft.llmEnabled,
					onChange: function (e) { patch({ llmEnabled: e.target.checked }) }
				})),
			llmModelControl(),
				row('wakeupType', t('wakeupType'), React.createElement('select', {
					key: 'c', value: draft.wakeupType || 'smart',
					onChange: function (e) { patch({ wakeupType: e.target.value }) }
				}, [
					React.createElement('option', { key: 's', value: 'smart' }, t('wakeupSmart')),
					React.createElement('option', { key: 'i', value: 'interval' }, t('wakeupInterval')),
					React.createElement('option', { key: 't', value: 'toolcall' }, t('wakeupToolcall'))
				])),
				(draft.wakeupType === 'smart' || !draft.wakeupType) ? longTextArea({
					key: 'wakeupEvents',
					label: t('wakeupEvents'),
					value: (draft.wakeupEvents || []).join(', '),
					onChange: function (raw) {
						patch({ wakeupEvents: raw.split(/[,，]/).map(function (s) { return s.trim() }).filter(Boolean) })
					}
				}) : null,
				(draft.wakeupType === 'smart' || !draft.wakeupType) ? row('smartMinGapSec', t('smartMinGapSec'), clampedNumberInput({
					key: 'c', min: 3, max: 60, value: draft.smartMinGapSec || 8,
					onChange: function (v) { patch({ smartMinGapSec: v }) }
				})) : null,
				draft.wakeupType === 'toolcall' ? row('toolcallFilterMode', t('toolcallFilterMode'), React.createElement('select', {
					key: 'c', value: draft.toolcallFilterMode || 'all',
					onChange: function (e) { patch({ toolcallFilterMode: e.target.value }) }
				}, [
					React.createElement('option', { key: 'a', value: 'all' }, t('filterAll')),
					React.createElement('option', { key: 'w', value: 'whitelist' }, t('filterWhitelist')),
					React.createElement('option', { key: 'b', value: 'blacklist' }, t('filterBlacklist'))
				])) : null,
				draft.wakeupType === 'toolcall' ? longTextArea({
					key: 'toolcallTools',
					label: t('toolcallTools'),
					value: (draft.toolcallTools || []).join(', '),
					onChange: function (raw) {
						patch({ toolcallTools: raw.split(/[,，]/).map(function (s) { return s.trim() }).filter(Boolean) })
					}
				}) : null,
				row('toolcallOnErrorExtra', t('toolcallOnErrorExtra'), React.createElement('input', {
					key: 'c', type: 'checkbox', checked: draft.toolcallOnErrorExtra !== false,
					onChange: function (e) { patch({ toolcallOnErrorExtra: e.target.checked }) }
				})),
				row('globalMinGapSec', t('globalMinGapSec'), clampedNumberInput({
					key: 'c', min: 1, max: 60, value: draft.globalMinGapSec || 5,
					onChange: function (v) { patch({ globalMinGapSec: v }) }
				})),
				React.createElement(CollapseSection, {
					key: 'wakeAdv',
					sectionKey: 'wakeAdv',
					title: t('secWakeAdv'),
					defaultOpen: false
				}, [
					row('backoffEnabled', t('backoffEnabled'), React.createElement('input', {
						key: 'c', type: 'checkbox', checked: draft.backoffEnabled !== false,
						onChange: function (e) { patch({ backoffEnabled: e.target.checked }) }
					})),
					row('backoffBaseSec', t('backoffBaseSec'), clampedNumberInput({
						key: 'c', min: 5, max: 120, value: draft.backoffBaseSec || 12,
						disabled: draft.backoffEnabled === false,
						onChange: function (v) { patch({ backoffBaseSec: v }) }
					})),
					row('backoffMaxSec', t('backoffMaxSec'), clampedNumberInput({
						key: 'c', min: 10, max: 300, value: draft.backoffMaxSec || 60,
						disabled: draft.backoffEnabled === false,
						onChange: function (v) { patch({ backoffMaxSec: v }) }
					})),
					row('backoffFactor', t('backoffFactor'), clampedNumberInput({
						key: 'c', min: 1.1, max: 3, step: 0.1, value: draft.backoffFactor || 1.5,
						disabled: draft.backoffEnabled === false,
						onChange: function (v) { patch({ backoffFactor: v }) }
					})),
					row('backoffResetSec', t('backoffResetSec'), clampedNumberInput({
						key: 'c', min: 2, max: 60, value: draft.backoffResetSec || 6,
						disabled: draft.backoffEnabled === false,
						onChange: function (v) { patch({ backoffResetSec: v }) }
					})),
					row('thinkingAsActive', t('thinkingAsActive'), React.createElement('input', {
						key: 'c', type: 'checkbox', checked: draft.thinkingAsActive !== false,
						onChange: function (e) { patch({ thinkingAsActive: e.target.checked }) }
					})),
					row('warningAlwaysWake', t('warningAlwaysWake'), React.createElement('input', {
						key: 'c', type: 'checkbox', checked: draft.warningAlwaysWake !== false,
						onChange: function (e) { patch({ warningAlwaysWake: e.target.checked }) }
					})),
					row('thinkingExcerptChars', t('thinkingExcerptChars'), clampedNumberInput({
						key: 'c', min: 80, max: 480, step: 20, value: draft.thinkingExcerptChars || 240,
						onChange: function (v) { patch({ thinkingExcerptChars: v }) }
					}))
				]),
				React.createElement(CollapseSection, {
					key: 'ctxSrc',
					sectionKey: 'ctxSrc',
					title: t('secCtxSrc'),
					defaultOpen: false
				}, (function () {
					var src = draft.contextSources || DEFAULTS.contextSources
					function setSrc(key, val) {
						var next = Object.assign({}, src)
						next[key] = val
						patch({ contextSources: next })
					}
					return [
						row('ctxConversation', t('ctxConversation'), React.createElement('input', {
							key: 'c', type: 'checkbox', checked: src.conversation !== false,
							onChange: function (e) { setSrc('conversation', e.target.checked) }
						})),
						row('ctxThinking', t('ctxThinking'), React.createElement('input', {
							key: 'c', type: 'checkbox', checked: src.thinking !== false,
							onChange: function (e) { setSrc('thinking', e.target.checked) }
						})),
						row('ctxWarning', t('ctxWarning'), React.createElement('input', {
							key: 'c', type: 'checkbox', checked: src.warning !== false,
							onChange: function (e) { setSrc('warning', e.target.checked) }
						})),
						row('ctxUsage', t('ctxUsage'), React.createElement('input', {
							key: 'c', type: 'checkbox', checked: src.usage !== false,
							onChange: function (e) { setSrc('usage', e.target.checked) }
						})),
						row('ctxTools', t('ctxTools'), React.createElement('input', {
							key: 'c', type: 'checkbox', checked: src.tools !== false,
							onChange: function (e) { setSrc('tools', e.target.checked) }
						})),
						row('ctxEvents', t('ctxEvents'), React.createElement('input', {
							key: 'c', type: 'checkbox', checked: src.events !== false,
							onChange: function (e) { setSrc('events', e.target.checked) }
						}))
					]
				})()),
				row('llmIntervalSec', t('llmIntervalSec'), clampedNumberInput({
					key: 'c', min: 5, max: 120, value: draft.llmIntervalSec,
					disabled: !draft.llmEnabled,
					onChange: function (v) { patch({ llmIntervalSec: v }) }
				})),
				row('llmBurstCount', t('llmBurstCount'), clampedNumberInput({
					key: 'c', min: 1, max: 20, value: draft.llmBurstCount,
					disabled: !draft.llmEnabled,
					onChange: function (v) { patch({ llmBurstCount: v }) }
				})),
				longTextArea({
					key: 'stylePrompt',
					label: t('stylePrompt'),
					value: draft.stylePrompt || '',
					draftMode: false,
					onChange: function (raw) { patch({ stylePrompt: raw }) }
				}),
				React.createElement('div', {
					key: 'tpl',
					style: { display: 'flex', flexWrap: 'wrap', gap: 6, margin: '4px 0 8px', justifyContent: 'flex-end' }
				}, (draft.styleTemplates || DEFAULTS.styleTemplates).map(function (tpl) {
					return React.createElement('button', {
						key: tpl.id,
						type: 'button',
						style: {
							borderRadius: 999,
							border: '1px solid rgba(128,128,128,.4)',
							background: 'transparent',
							color: 'inherit',
							padding: '4px 10px',
							cursor: 'pointer',
							fontSize: 12
						},
						onClick: function () { patch({ stylePrompt: tpl.prompt }) }
					}, tpl.name)
				})),
				row('editTemplates', t('editTemplates'), React.createElement('button', {
					key: 'c', type: 'button',
					style: { border: '1px solid var(--dsw-alias-border-l4,rgba(0,0,0,.16))', background: 'transparent', color: 'inherit', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' },
					onClick: function () { setTplOpen(true) }
				}, t('editTemplates'))),
				row('styleMaxChars', t('styleMaxChars'), clampedNumberInput({
					key: 'c', min: 8, max: 48, value: draft.styleMaxChars || 24,
					onChange: function (v) { patch({ styleMaxChars: v }) }
				})),
				row('matchThreshold', t('matchThreshold'), sliderField({
					min: 0, max: 1, step: 0.05, value: draft.matchThreshold != null ? draft.matchThreshold : 0.35,
					onChange: function (v) { patch({ matchThreshold: v }) }
				})),
				React.createElement('div', { className: 'dsh-danmaku-hr', key: 'hr-render' }),
				React.createElement('div', { className: 'dsh-danmaku-section', key: 'sRender', 'data-sec': 'render' }, t('secRender')),
				row('renderBackend', t('renderBackend'), React.createElement('select', {
					key: 'c', value: draft.renderBackend || 'dom',
					onChange: function (e) { patch({ renderBackend: e.target.value }) }
				}, [
					React.createElement('option', { key: 'a', value: 'auto' }, t('backendAuto')),
					React.createElement('option', { key: 'd', value: 'dom' }, t('backendDom')),
					React.createElement('option', { key: 'w', value: 'webgl2' }, t('backendWebgl2')),
					React.createElement('option', { key: 'k', value: 'webgl2-worker' }, t('backendWebgl2Worker'))
				])),
				hideActions ? null : React.createElement('div', { className: 'actions', key: 'a' }, [
					React.createElement('span', { key: 'st', style: { marginRight: 'auto', opacity: 0.7, fontSize: 12 } }, status || dirtyText || ''),
					onUndo ? React.createElement('button', {
						key: 'undo',
						onClick: onUndo
					}, t('undo')) : null,
					React.createElement('button', { key: 'save', className: 'primary', onClick: onSave }, t('save'))
				]),
				colorOpen ? React.createElement(ColorWeightsEditor, {
					key: 'cwe',
					t: t,
					weights: draft.colorWeights || DEFAULTS.colorWeights,
					onChange: function (next) { patch({ colorWeights: next }) },
					onClose: function () { setColorOpen(false) }
				}) : null,
				tplOpen ? React.createElement(TemplatesEditor, {
					key: 'tpl-editor',
					t: t,
					templates: draft.styleTemplates || DEFAULTS.styleTemplates,
					onChange: function (next) { patch({ styleTemplates: next }) },
					onClose: function () { setTplOpen(false) }
				}) : null,
				presetsOpen ? React.createElement(PresetEditorModal, {
					key: 'presets-editor',
					t: t,
					showToast: props.showToast,
					onClose: function () { setPresetsOpen(false) },
					onSaved: function (s) {
						applyPresetStore(s)
						var order = (s && s.order) || Object.keys((s && s.packs) || {})
						setPackList(order.map(function (id) {
							return { id: id, name: (s.packs[id] && s.packs[id].name) || id }
						}))
					}
				}) : null,
				emojiOpen ? React.createElement(EmojiEditorModal, {
					key: 'emoji-editor',
					t: t,
					showToast: props.showToast,
					onClose: function () { setEmojiOpen(false) }
				}) : null
			])
		}

		function TemplatesEditor(props) {
			var t = props.t
			var onClose = props.onClose
			// Work on a private copy so open/close never mutates draft/DEFAULTS
			var listState = React.useState(function () {
				return JSON.parse(JSON.stringify(props.templates || []))
			})
			var list = listState[0]
			var setList = listState[1]

			function commit(next) {
				setList(next)
				if (props.onChange) props.onChange(JSON.parse(JSON.stringify(next)))
			}

			function patchAt(i, partial) {
				commit(list.map(function (x, idx) {
					return idx === i ? Object.assign({}, x, partial) : x
				}))
			}

			return React.createElement('div', Object.assign({ className: 'dsh-danmaku-modal' }, backdropCloseProps(onClose)), [
				React.createElement('div', {
					key: 'card',
					className: 'dsh-danmaku-modal-card',
					style: { width: 'min(520px,92vw)' },
					onClick: function (e) { e.stopPropagation() }
				}, [
					React.createElement('h3', { key: 'h' }, t('templatesTitle')),
					list.map(function (tpl, i) {
						return React.createElement('div', {
							key: tpl.id || ('i' + i),
							style: { display: 'flex', gap: 6, margin: '8px 0', alignItems: 'center' }
						}, [
							React.createElement('input', {
								key: 'n', type: 'text', value: tpl.name || '', style: { width: 90 },
								placeholder: t('tplName'),
								onChange: function (e) { patchAt(i, { name: e.target.value }) }
							}),
							React.createElement('input', {
								key: 'p', type: 'text', value: tpl.prompt || '', style: { flex: 1 },
								placeholder: t('tplPrompt'),
								onChange: function (e) { patchAt(i, { prompt: e.target.value }) }
							}),
							React.createElement('button', {
								key: 'd',
								style: { border: 'none', background: 'transparent', color: '#f66', cursor: 'pointer' },
								onClick: function () {
									commit(list.filter(function (_, j) { return j !== i }))
								}
							}, '×')
						])
					}),
					React.createElement('div', { className: 'dsh-danmaku-modal-actions', key: 'a' }, [
						React.createElement('button', {
							key: 'add',
							onClick: function () {
								commit(list.concat([{ id: 't' + Date.now(), name: '新模板', prompt: '' }]))
							}
						}, t('tplAdd')),
						React.createElement('button', { key: 'ok', onClick: onClose }, t('close'))
					])
				])
			])
		}

		// ---------- Pool editor modal ----------
		function PoolEditorModal(props) {
			var t = props.t
			var onClose = props.onClose
			var sessionsState = React.useState([])
			var sessions = sessionsState[0]
			var setSessions = sessionsState[1]
			var selState = React.useState('')
			var selected = selState[0]
			var setSelected = selState[1]
			var scopeState = React.useState('live')
			var scope = scopeState[0]
			var setScope = scopeState[1]
			var itemsState = React.useState([])
			var items = itemsState[0]
			var setItems = itemsState[1]
			var msgState = React.useState('')
			var msg = msgState[0]
			var setMsg = msgState[1]
			var clearConfirmState = React.useState(false)
			var clearConfirm = clearConfirmState[0]
			var setClearConfirm = clearConfirmState[1]
			var draftsRef = React.useRef({})

			function loadSessions() {
				return fetchJson('/api/danmaku/pools').then(function (d) {
					var list = (d && d.sessions) || []
					setSessions(list)
					if (!selected && list.length) setSelected(list[0].sessionId)
					return list
				}).catch(function () { setSessions([]) })
			}

			function loadItems(sid, sc) {
				if (!sid) return
				fetchJson('/api/danmaku/pool?sessionId=' + encodeURIComponent(sid) + '&scope=' + (sc || 'live')).then(function (d) {
					setItems((d && d.items) || [])
					draftsRef.current = {}
				}).catch(function () { setItems([]) })
			}

			React.useEffect(function () {
				loadSessions()
			}, [])

			React.useEffect(function () {
				if (selected) loadItems(selected, scope)
			}, [selected, scope])

			function saveRow(item) {
				var draft = draftsRef.current[item.id] || {}
				fetchJson('/api/danmaku/pool/item', {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						sessionId: selected,
						id: item.id,
						content: draft.content !== undefined ? draft.content : item.content,
						weight: draft.weight !== undefined ? draft.weight : item.weight
					})
				}).then(function () {
					setMsg(t('saved'))
					loadItems(selected, scope)
					loadSessions()
				}).catch(function () { setMsg(t('saveFail')) })
			}

			function removeRow(item) {
				fetchJson('/api/danmaku/pool/item', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ sessionId: selected, id: item.id, scope: item.scope || scope })
				}).then(function () {
					loadItems(selected, scope)
					loadSessions()
				})
			}

			function restoreRow(item) {
				fetchJson('/api/danmaku/pool/restore', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ sessionId: selected, id: item.id })
				}).then(function (d) {
					if (d && d.ok) {
						setMsg(t('poolRestored'))
						loadItems(selected, scope)
						loadSessions()
					} else {
						setMsg(t('poolRestoreFail'))
					}
				}).catch(function () { setMsg(t('poolRestoreFail')) })
			}

			function clearAllPools() {
				fetchJson('/api/danmaku/pools/clear', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({})
				}).then(function (d) {
					if (d && d.ok) {
						setMsg(t('poolCleared'))
						if (props.showToast) props.showToast('success', t('poolCleared'), '')
						setSelected('')
						setItems([])
						loadSessions().then(function (list) {
							if (list && list.length) setSelected(list[0].sessionId)
						})
					} else {
						setMsg(t('poolClearFail'))
						if (props.showToast) props.showToast('error', t('poolClearFail'), '')
					}
				}).catch(function () {
					setMsg(t('poolClearFail'))
					if (props.showToast) props.showToast('error', t('poolClearFail'), '')
				})
			}

			function fmt(at) {
				if (!at) return ''
				try { return new Date(at).toLocaleString() } catch (e) { return String(at) }
			}

			return React.createElement('div', Object.assign({ className: 'dsh-danmaku-pool' }, backdropCloseProps(onClose)), [
				React.createElement('div', {
					key: 'box',
					className: 'dsh-danmaku-pool-box',
					onClick: function (e) { e.stopPropagation() }
				}, [
					React.createElement('div', { key: 'h', className: 'dsh-danmaku-pool-head' }, [
						React.createElement('span', { key: 't' }, t('poolEditorTitle')),
						React.createElement('div', { key: 'r', style: { display: 'flex', gap: 8, alignItems: 'center' } }, [
							React.createElement('button', {
								key: 'clear', type: 'button',
								title: t('poolClearConfirm'),
								style: {
									border: '1px solid rgba(220,38,38,.45)',
									background: 'transparent',
									color: '#dc2626',
									borderRadius: 8,
									padding: '4px 10px',
									cursor: 'pointer',
									fontSize: 12
								},
								onClick: function () { setClearConfirm(true) }
							}, t('poolClearAll')),
							React.createElement('button', {
								key: 're', type: 'button',
								style: { border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15))', background: 'transparent', color: 'inherit', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' },
								onClick: function () { loadSessions(); if (selected) loadItems(selected, scope) }
							}, t('poolReload')),
							React.createElement('button', {
								key: 'x', type: 'button',
								style: { border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 18 },
								onClick: onClose
							}, '×')
						])
					]),
					React.createElement('div', { key: 'b', className: 'dsh-danmaku-pool-body' }, [
						React.createElement('div', { key: 's', className: 'dsh-danmaku-pool-sessions' }, [
							React.createElement('div', { key: 'l', style: { fontSize: 11, opacity: 0.7, marginBottom: 6 } }, t('poolSessions')),
							sessions.length === 0 ? React.createElement('div', { key: 'e', style: { opacity: 0.6, fontSize: 12 } }, t('poolEmpty')) : null
						].concat(sessions.map(function (s) {
							return React.createElement('button', {
								key: s.sessionId,
								type: 'button',
								'data-active': selected === s.sessionId ? '1' : '0',
								onClick: function () { setSelected(s.sessionId) }
							}, [
								React.createElement('div', {
									key: 'i',
									className: 'dsh-danmaku-pool-session-title'
								}, s.title || s.sessionId.slice(0, 18) + '…'),
								s.title
									? React.createElement('div', {
										key: 'sid',
										className: 'dsh-danmaku-pool-session-id',
										title: s.sessionId
									}, s.sessionId.slice(0, 18) + '…')
									: null,
								React.createElement('div', { key: 'c', style: { opacity: 0.7, marginTop: 2 } },
									t('poolScopeLive') + ' ' + s.live + ' · ' + t('poolScopeArchive') + ' ' + s.archived)
							])
						}))),
						React.createElement('div', { key: 'm', className: 'dsh-danmaku-pool-main' }, [
							React.createElement('div', { key: 'sc', style: { display: 'flex', gap: 8, marginBottom: 10 } }, [
								React.createElement('button', {
									key: 'l', type: 'button',
									style: { border: '1px solid ' + (scope === 'live' ? '#fb7299' : 'var(--dsw-alias-border-l3,rgba(0,0,0,.15))'), background: scope === 'live' ? 'rgba(251,114,153,.15)' : 'transparent', color: 'inherit', borderRadius: 8, padding: '4px 12px', cursor: 'pointer' },
									onClick: function () { setScope('live') }
								}, t('poolScopeLive')),
								React.createElement('button', {
									key: 'a', type: 'button',
									style: { border: '1px solid ' + (scope === 'archive' ? '#fb7299' : 'var(--dsw-alias-border-l3,rgba(0,0,0,.15))'), background: scope === 'archive' ? 'rgba(251,114,153,.15)' : 'transparent', color: 'inherit', borderRadius: 8, padding: '4px 12px', cursor: 'pointer' },
									onClick: function () { setScope('archive') }
								}, t('poolScopeArchive')),
								React.createElement('span', { key: 'm', style: { marginLeft: 'auto', opacity: 0.7, fontSize: 12 } }, msg || '')
							]),
							items.length === 0
								? React.createElement('div', { key: 'empty', style: { opacity: 0.6 } }, t('poolEmpty'))
								: React.createElement('table', { key: 'tbl', className: 'dsh-danmaku-pool-table' }, [
									React.createElement('thead', { key: 'th' }, [
										React.createElement('tr', { key: 'r' }, [
											React.createElement('th', { key: 'c' }, t('poolContent')),
											React.createElement('th', { key: 'w' }, t('poolWeight')),
											React.createElement('th', { key: 's' }, t('poolSource')),
											React.createElement('th', { key: 't' }, t('poolTime')),
											React.createElement('th', { key: 'o' }, '')
										])
									]),
									React.createElement('tbody', { key: 'tb' }, items.map(function (item) {
										var d = draftsRef.current[item.id] || {}
										return React.createElement('tr', { key: item.id }, [
											React.createElement('td', { key: 'c' }, [
												React.createElement('input', {
													key: 'i', type: 'text', defaultValue: item.content,
													onChange: function (e) {
														draftsRef.current[item.id] = Object.assign({}, draftsRef.current[item.id], { content: e.target.value })
													}
												})
											]),
											React.createElement('td', { key: 'w' }, [
												clampedNumberInput({
													key: 'i', min: 0, max: 10, step: 0.5, defaultValue: item.weight || 1, style: { width: 70 },
													onChange: function (v) {
														draftsRef.current[item.id] = Object.assign({}, draftsRef.current[item.id], { weight: v })
													}
												})
											]),
											React.createElement('td', { key: 's' }, item.source || ''),
											React.createElement('td', { key: 't' }, fmt(item.at)),
											React.createElement('td', { key: 'o', style: { whiteSpace: 'nowrap' } }, [
												React.createElement('button', {
													key: 'sv', type: 'button',
													style: { border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15))', background: 'transparent', color: 'inherit', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', marginRight: 4 },
													onClick: function () { saveRow(item) }
												}, t('poolSaveRow')),
												(scope === 'archive') ? React.createElement('button', {
													key: 'rs', type: 'button',
													style: { border: '1px solid #fb7299', background: 'rgba(251,114,153,.12)', color: 'inherit', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', marginRight: 4 },
													onClick: function () { restoreRow(item) }
												}, t('poolRestore')) : null,
												React.createElement('button', {
													key: 'dl', type: 'button',
													style: { border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15))', background: 'transparent', color: 'inherit', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' },
													onClick: function () { removeRow(item) }
												}, t('poolDelete'))
											])
										])
									}))
								])
						])
					])
				]),
				clearConfirm ? React.createElement('div', Object.assign({
					key: 'clear-confirm',
					className: 'dsh-danmaku-modal',
					style: { zIndex: 10040 }
				}, backdropCloseProps(function () { setClearConfirm(false) })), [
					React.createElement('div', {
						key: 'card',
						className: 'dsh-danmaku-modal-card',
						style: { width: 'min(360px,90vw)' },
						onClick: function (e) { e.stopPropagation() }
					}, [
						React.createElement('h3', { key: 'h', style: { color: '#dc2626' } }, t('poolClearConfirmTitle')),
						React.createElement('div', { key: 'p', className: 'meta', style: { marginBottom: 14, lineHeight: 1.6 } }, t('poolClearConfirm')),
						React.createElement('div', { className: 'dsh-danmaku-modal-actions', key: 'a' }, [
							React.createElement('button', {
								key: 'cancel',
								onClick: function () { setClearConfirm(false) }
							}, t('poolClearCancel')),
							React.createElement('button', {
								key: 'ok',
								style: { borderColor: '#dc2626', color: '#dc2626' },
								onClick: function () {
									setClearConfirm(false)
									clearAllPools()
								}
							}, t('poolClearOk'))
						])
					])
				]) : null
			])
		}

		// ---------- Large (non-fullscreen) settings modal ----------
		function DanmakuSettingsModal(props) {
			var t = props.t
			var onClose = props.onClose
			var draftState = React.useState(clampConfig(DEFAULTS))
			var draft = draftState[0]
			var setDraft = draftState[1]
			var savedRef = React.useRef(clampConfig(DEFAULTS))
			var statusState = React.useState('')
			var status = statusState[0]
			var setStatus = statusState[1]
			var tabState = React.useState('basics')
			var tab = tabState[0]
			var setTab = tabState[1]
			var poolOpenState = React.useState(false)
			var poolOpen = poolOpenState[0]
			var setPoolOpen = poolOpenState[1]
			var giftOpenState = React.useState(false)
			var giftOpen = giftOpenState[0]
			var setGiftOpen = giftOpenState[1]
			var giftAnchorState = React.useState(null)
			var giftAnchor = giftAnchorState[0]
			var setGiftAnchor = giftAnchorState[1]
			var mainRef = React.useRef(null)
			var navLockUntilRef = React.useRef(0)
			var flashTimerRef = React.useRef(null)

			React.useEffect(function () {
				fetchJson('/api/danmaku/config').then(function (data) {
					var c = clampConfig(data && data.config)
					savedRef.current = c
					setDraft(c)
				}).catch(function () { /* defaults */ })
			}, [])

			function dirty() {
				return JSON.stringify(draft) !== JSON.stringify(savedRef.current)
			}

			function onSave() {
				setStatus(t('saving'))
				fetchJson('/api/danmaku/config', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ config: draft })
				}).then(function (data) {
					var c = clampConfig(data && data.config)
					savedRef.current = c
					setDraft(c)
					// The host reports whether the config reached disk; a save that
					// only lives in memory must never look like a successful one.
					var degraded = !!(data && data.persisted && data.persisted.file === false)
					setStatus(degraded ? t('savedNoDisk') : t('saved'))
					if (props.showToast) props.showToast(degraded ? 'error' : 'success', degraded ? t('savedNoDisk') : t('saved'), '')
				}).catch(function () {
					setStatus(t('saveFail'))
					if (props.showToast) props.showToast('error', t('saveFail'), '')
				})
			}

			function onUndo() {
				if (!dirty()) {
					setStatus(t('nothingToUndo'))
					if (props.showToast) props.showToast('info', t('nothingToUndo'), '')
					return
				}
				fetchJson('/api/danmaku/config').then(function (data) {
					var c = clampConfig(data && data.config)
					savedRef.current = c
					setDraft(c)
					setStatus(t('undone'))
					if (props.showToast) props.showToast('success', t('undone'), '')
				}).catch(function () {
					setDraft(clampConfig(savedRef.current))
					setStatus(t('undone'))
					if (props.showToast) props.showToast('success', t('undone'), '')
				})
			}

			var tabs = [
				{ id: 'basics', label: t('modalBasics'), sec: 'basics' },
				{ id: 'pool', label: t('modalPool'), sec: 'pool' },
				{ id: 'gift', label: t('modalGift'), sec: 'gift' },
				{ id: 'content', label: t('modalContent'), sec: 'content' },
				{ id: 'llm', label: t('modalLlm'), sec: 'llm' },
				{ id: 'render', label: t('modalRender'), sec: 'render' }
			]

			function findSectionEl(sec) {
				var root = mainRef.current
				if (!root) return null
				return root.querySelector('.dsh-danmaku-section[data-sec="' + sec + '"]')
			}

			function sectionBlockEls(sec) {
				var root = mainRef.current
				var card = root && root.querySelector('.dsh-danmaku-card')
				if (!card) {
					var only = findSectionEl(sec)
					return only ? [only] : []
				}
				var children = Array.prototype.slice.call(card.children)
				var start = -1
				for (var i = 0; i < children.length; i++) {
					if (children[i].getAttribute && children[i].getAttribute('data-sec') === sec) {
						start = i
						break
					}
				}
				if (start < 0) return []
				var end = children.length
				for (var j = start + 1; j < children.length; j++) {
					if (children[j].getAttribute && children[j].getAttribute('data-sec')) {
						end = j
						break
					}
				}
				return children.slice(start, end)
			}

			function flashSection(sec) {
				if (flashTimerRef.current) {
					clearTimeout(flashTimerRef.current)
					flashTimerRef.current = null
				}
				var prev = mainRef.current && mainRef.current.querySelectorAll('.dsh-danmaku-flash')
				if (prev) {
					for (var k = 0; k < prev.length; k++) prev[k].classList.remove('dsh-danmaku-flash')
				}
				var els = sectionBlockEls(sec)
				if (!els.length) return
				for (var i = 0; i < els.length; i++) {
					void els[i].offsetWidth
					els[i].classList.add('dsh-danmaku-flash')
				}
				flashTimerRef.current = setTimeout(function () {
					for (var n = 0; n < els.length; n++) els[n].classList.remove('dsh-danmaku-flash')
					flashTimerRef.current = null
				}, 1350)
			}

			function scrollTo(sec, flash) {
				var el = findSectionEl(sec)
				if (!el) return
				// Freeze scroll-spy while smooth-scrolling so nav does not flicker
				navLockUntilRef.current = Date.now() + 1000
				el.scrollIntoView({ block: 'start', behavior: 'smooth' })
				if (flash !== false) flashSection(sec)
				setTimeout(function () {
					navLockUntilRef.current = 0
					// settle highlight after scroll completes
					var root = mainRef.current
					if (!root) return
					var ev = new Event('scroll')
					root.dispatchEvent(ev)
				}, 1000)
			}

			// Scroll spy: highlight nav while scrolling the content pane
			React.useEffect(function () {
				var root = mainRef.current
				if (!root) return
				function onScroll() {
					if (Date.now() < navLockUntilRef.current) return
					var nodes = root.querySelectorAll('.dsh-danmaku-section[data-sec]')
					if (!nodes.length) return
					var rootTop = root.getBoundingClientRect().top
					var active = nodes[0].getAttribute('data-sec') || 'basics'
					for (var i = 0; i < nodes.length; i++) {
						var r = nodes[i].getBoundingClientRect()
						if (r.top <= rootTop + 56) {
							active = nodes[i].getAttribute('data-sec') || active
						}
					}
					var atBottom = root.scrollTop + root.clientHeight >= root.scrollHeight - 8
					if (atBottom) {
						active = nodes[nodes.length - 1].getAttribute('data-sec') || active
					}
					setTab(active)
				}
				root.addEventListener('scroll', onScroll, { passive: true })
				onScroll()
				return function () {
					root.removeEventListener('scroll', onScroll)
					if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
				}
			}, [])

			return React.createElement('div', Object.assign({
				className: 'dsh-danmaku-settings'
			}, backdropCloseProps(onClose)), [
				React.createElement('div', {
					key: 'box',
					className: 'dsh-danmaku-settings-box',
					onClick: function (e) { e.stopPropagation() }
				}, [
					React.createElement('div', { key: 'h', className: 'dsh-danmaku-settings-head' }, [
						React.createElement('span', { key: 't' }, t('cardTitle')),
						React.createElement('button', {
							key: 'x',
							type: 'button',
							style: { border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 18 },
							onClick: onClose
						}, '×')
					]),
					React.createElement('div', { key: 'b', className: 'dsh-danmaku-settings-body' }, [
						React.createElement('div', { key: 'nav', className: 'dsh-danmaku-settings-nav' },
							tabs.map(function (item) {
								return React.createElement('button', {
									key: item.id,
									type: 'button',
									'data-active': tab === item.id ? '1' : '0',
									onClick: function () {
										setTab(item.id)
										scrollTo(item.sec, true)
										if (item.id === 'pool' && props.onOpenPoolSection) props.onOpenPoolSection()
									}
								}, item.label)
							})
						),
						React.createElement('div', { key: 'main', className: 'dsh-danmaku-settings-main', ref: mainRef },
							React.createElement(SettingsPanel, {
								t: t,
								draft: draft,
								setDraft: setDraft,
								onSave: onSave,
								onUndo: onUndo,
								status: status,
								dirtyText: dirty() ? t('dirty') : '',
								hideHeader: true,
								hideActions: true,
								onOpenPool: function () { setPoolOpen(true) },
								onOpenGift: function (anchor) { setGiftAnchor(anchor || null); setGiftOpen(true) }
							})
						)
					]),
					React.createElement('div', { key: 'f', className: 'dsh-danmaku-settings-foot' }, [
						React.createElement('span', { key: 'st', style: { marginRight: 'auto', opacity: 0.75, fontSize: 12 } },
							status || (dirty() ? t('dirty') : '')),
						React.createElement('button', {
							key: 'pool',
							type: 'button',
							onClick: function () { setPoolOpen(true) }
						}, t('openPoolEditor')),
						React.createElement('button', {
							key: 'area',
							type: 'button',
							onClick: function () {
								if (props.onOpenAreaEditor) props.onOpenAreaEditor()
							}
						}, t('areaEditor')),
						React.createElement('button', { key: 'undo', type: 'button', onClick: onUndo }, t('undo')),
						React.createElement('button', { key: 'save', type: 'button', className: 'primary', onClick: onSave }, t('save'))
					]),
					poolOpen ? React.createElement(PoolEditorModal, {
						key: 'pool',
						t: t,
						showToast: props.showToast,
						onClose: function () { setPoolOpen(false) }
					}) : null,
					giftOpen ? React.createElement(GiftConfigModal, {
						key: 'gift',
						t: t,
						showToast: props.showToast,
						initialAnchor: giftAnchor,
						onClose: function () { setGiftOpen(false) }
					}) : null
				])
			])
		}

		// ---------- Display area editor ----------
		// Crops the region danmaku are allowed to cover. dsh's own top buttons used
		// to get buried under a busy stream; this lets the user pull the band below
		// them. Crop box + 8 handles, Enter applies, Esc cancels, Shift+Z / Shift+Ctrl+Z
		// walk the edit history.
		function AreaEditor(props) {
			var t = props.t
			var hostRef = props.hostRef
			var initial = props.initialArea || { x: 0, y: 0, w: 1, h: 1 }
			var AREA_MIN = 0.08

			// The overlay root is inset:0 of its parent, so the parent's box is the
			// full area we can crop within — measured even while the root is shrunk.
			function readBase() {
				var el = hostRef && hostRef.current
				var p = el && el.parentElement
				var r = null
				try { r = p ? p.getBoundingClientRect() : null } catch (e) { r = null }
				if (!r || !r.width || !r.height) {
					return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
				}
				return { left: r.left, top: r.top, width: r.width, height: r.height }
			}

			var baseState = React.useState(readBase)
			var base = baseState[0]
			var setBase = baseState[1]
			var areaState = React.useState(initial)
			var area = areaState[0]
			var setArea = areaState[1]
			var histState = React.useState(function () { return [initial] })
			var hist = histState[0]
			var setHist = histState[1]
			var idxState = React.useState(0)
			var idx = idxState[0]
			var setIdx = idxState[1]
			var dragRef = React.useRef(null)
			var hintRef = React.useRef(null)
			var hintHoverState = React.useState(false)
			var hintHover = hintHoverState[0]
			var setHintHover = hintHoverState[1]

			// The hint sits at top-centre, right where dsh's own toolbar is — fade it
			// almost out while the pointer is over it so the user can see what is
			// underneath. Detected on the container (the hint itself is
			// pointer-events:none so it never steals the north handle).
			function onAreaMove(e) {
				var el = hintRef.current
				if (!el) return
				var r = el.getBoundingClientRect()
				var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
				if (inside !== hintHover) setHintHover(inside)
			}

			function pushHistory(a) {
				var nh = hist.slice(0, idx + 1)
				nh.push(a)
				if (nh.length > 60) nh.shift()
				setHist(nh)
				setIdx(nh.length - 1)
			}

			function undo() {
				if (idx <= 0) return
				setIdx(idx - 1)
				setArea(hist[idx - 1])
			}

			function redo() {
				if (idx >= hist.length - 1) return
				setIdx(idx + 1)
				setArea(hist[idx + 1])
			}

			React.useEffect(function () {
				function onKey(e) {
					if (e.key === 'Escape') {
						e.preventDefault()
						e.stopPropagation()
						if (props.onCancel) props.onCancel()
						return
					}
					if (e.key === 'Enter') {
						e.preventDefault()
						e.stopPropagation()
						if (props.onApply) props.onApply(area)
						return
					}
					if ((e.key === 'z' || e.key === 'Z') && e.shiftKey) {
						e.preventDefault()
						e.stopPropagation()
						if (e.ctrlKey || e.metaKey) redo()
						else undo()
					}
				}
				window.addEventListener('keydown', onKey, true)
				return function () { window.removeEventListener('keydown', onKey, true) }
			}, [area, hist, idx])

			React.useEffect(function () {
				function onResize() { setBase(readBase()) }
				window.addEventListener('resize', onResize)
				return function () { window.removeEventListener('resize', onResize) }
			}, [])

			function onHandleDown(e, which) {
				e.preventDefault()
				e.stopPropagation()
				dragRef.current = {
					id: e.pointerId,
					which: which,
					sx: e.clientX,
					sy: e.clientY,
					start: { x: area.x, y: area.y, w: area.w, h: area.h }
				}
				try { e.currentTarget.setPointerCapture(e.pointerId) } catch (err) { /* ignore */ }
			}

			function onHandleMove(e) {
				var d = dragRef.current
				if (!d || d.id !== e.pointerId) return
				var dx = (e.clientX - d.sx) / base.width
				var dy = (e.clientY - d.sy) / base.height
				var a = { x: d.start.x, y: d.start.y, w: d.start.w, h: d.start.h }
				if (d.which.indexOf('w') >= 0) {
					var nx = Math.min(a.x + a.w - AREA_MIN, Math.max(0, a.x + dx))
					a.w = a.x + a.w - nx
					a.x = nx
				}
				if (d.which.indexOf('e') >= 0) {
					a.w = Math.min(1 - a.x, Math.max(AREA_MIN, a.w + dx))
				}
				if (d.which.indexOf('n') >= 0) {
					var ny = Math.min(a.y + a.h - AREA_MIN, Math.max(0, a.y + dy))
					a.h = a.y + a.h - ny
					a.y = ny
				}
				if (d.which.indexOf('s') >= 0) {
					a.h = Math.min(1 - a.y, Math.max(AREA_MIN, a.h + dy))
				}
				setArea(a)
			}

			function onHandleUp(e) {
				var d = dragRef.current
				dragRef.current = null
				try { e.currentTarget.releasePointerCapture(e.pointerId) } catch (err) { /* ignore */ }
				if (d) pushHistory(area)
			}

			var px = {
				left: base.left + area.x * base.width,
				top: base.top + area.y * base.height,
				width: area.w * base.width,
				height: area.h * base.height
			}
			// Handle centres: 4 corners + 4 edge midpoints. They are clamped into the
			// viewport so a handle on a screen-edge crop stays fully visible and
			// clickable instead of hanging half off the window.
			var HIT = 34
			var pad = HIT / 2 + 2
			var vw = window.innerWidth
			var vh = window.innerHeight
			var cx0 = px.left + px.width / 2
			var cy0 = px.top + px.height / 2
			var xr = px.left + px.width
			var yb = px.top + px.height
			function clampX(v) { return Math.min(vw - pad, Math.max(pad, v)) }
			function clampY(v) { return Math.min(vh - pad, Math.max(pad, v)) }
			var handles = [
				{ k: 'nw', x: px.left, y: px.top, c: 'nwse-resize' },
				{ k: 'n', x: cx0, y: px.top, c: 'ns-resize' },
				{ k: 'ne', x: xr, y: px.top, c: 'nesw-resize' },
				{ k: 'e', x: xr, y: cy0, c: 'ew-resize' },
				{ k: 'se', x: xr, y: yb, c: 'nwse-resize' },
				{ k: 's', x: cx0, y: yb, c: 'ns-resize' },
				{ k: 'sw', x: px.left, y: yb, c: 'nesw-resize' },
				{ k: 'w', x: px.left, y: cy0, c: 'ew-resize' }
			]

			var dark = false
			try { dark = !!(document.body && document.body.hasAttribute('data-ds-dark-theme')) } catch (e) { dark = false }
			var hintStyle = dark
				? { background: 'rgba(32,32,36,.92)', color: '#f2f2f5', border: '1px solid rgba(255,255,255,.16)' }
				: { background: 'rgba(255,255,255,.92)', color: '#2b2b30', border: '1px solid rgba(0,0,0,.12)' }

			// Handles are siblings of the crop box, not children: an absolutely
			// positioned child would be offset by the box again, and our pixel
			// coordinates only line up when the offsetParent is the fixed container.
			var kids = [React.createElement('div', {
				key: 'r',
				className: 'dsh-danmaku-area-rect',
				style: { left: px.left + 'px', top: px.top + 'px', width: px.width + 'px', height: px.height + 'px' }
			})]
			kids = kids.concat(handles.map(function (h) {
				return React.createElement('div', {
					key: h.k,
					className: 'dsh-danmaku-area-hit',
					style: {
						left: clampX(h.x) + 'px',
						top: clampY(h.y) + 'px',
						width: HIT + 'px',
						height: HIT + 'px',
						cursor: h.c
					},
					onPointerDown: function (e) { onHandleDown(e, h.k) },
					onPointerMove: onHandleMove,
					onPointerUp: onHandleUp
				}, React.createElement('div', { key: 'v', className: 'dsh-danmaku-area-handle' }))
			}))
			kids.push(React.createElement('div', {
				key: 'h',
				ref: hintRef,
				className: 'dsh-danmaku-area-hint',
				style: Object.assign({}, hintStyle, { opacity: hintHover ? 0.2 : 1 })
			}, t('areaEditorHint')))
			return React.createElement('div', {
				className: 'dsh-danmaku-area',
				onMouseMove: onAreaMove,
				onMouseLeave: function () { setHintHover(false) }
			}, kids)
		}

		// ---------- High-energy heat bar ----------
		function HeatBar(props) {
			var t = props.t
			var heat = props.heat
			var enabled = props.enabled
			if (!enabled) return null
			var pct = Math.round((Number(heat) || 0) * 100)
			return React.createElement('div', {
				className: 'dsh-danmaku-heat',
				title: t('heat') + ' ' + pct + '%',
				'data-hot': pct >= 60 ? '1' : '0'
			}, [
				React.createElement('div', {
					key: 'f',
					className: 'dsh-danmaku-heat-fill',
					style: { height: Math.max(4, pct) + '%' }
				})
			])
		}

		// ---------- Preset pack editor ----------
		function PresetEditorModal(props) {
			var t = props.t
			var onClose = props.onClose
			var storeState = React.useState(null)
			var store = storeState[0]
			var setStore = storeState[1]
			var selState = React.useState('')
			var selected = selState[0]
			var setSelected = selState[1]
			var msgState = React.useState('')
			var msg = msgState[0]
			var setMsg = msgState[1]

			React.useEffect(function () {
				fetchJson('/api/danmaku/presets').then(function (s) {
					setStore(s)
					var order = (s && s.order) || Object.keys((s && s.packs) || {})
					if (order.length) setSelected(order[0])
				}).catch(function () { setStore({ packs: {}, order: [] }) })
			}, [])

			function save(next) {
				setStore(next)
				fetchJson('/api/danmaku/presets', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(next)
				}).then(function (s) {
					applyPresetStore(s)
					setMsg(t('saved'))
					if (props.showToast) props.showToast('success', t('saved'), '')
					if (props.onSaved) props.onSaved(s)
				}).catch(function () {
					setMsg(t('saveFail'))
					if (props.showToast) props.showToast('error', t('saveFail'), '')
				})
			}

			if (!store) {
				return React.createElement('div', { className: 'dsh-danmaku-modal' }, [
					React.createElement('div', { key: 'c', className: 'dsh-danmaku-modal-card' }, t('loading') || '…')
				])
			}

			var pack = store.packs[selected]
			var linesText = pack ? (pack.lines || []).join('\n') : ''
			var roundBtn = {
				width: 32,
				height: 32,
				borderRadius: '50%',
				border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.18))',
				background: '#fff',
				color: 'inherit',
				cursor: 'pointer',
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 0,
				flexShrink: 0,
				fontSize: 18,
				lineHeight: 1
			}

			return React.createElement('div', Object.assign({ className: 'dsh-danmaku-modal' }, backdropCloseProps(onClose)), [
				React.createElement('div', {
					key: 'box',
					className: 'dsh-danmaku-modal-card',
					style: {
						width: 'min(640px,94vw)',
						maxHeight: '86vh',
						display: 'flex',
						flexDirection: 'column',
						boxSizing: 'border-box',
						overflow: 'hidden'
					},
					onClick: function (e) { e.stopPropagation() }
				}, [
					React.createElement('h3', { key: 'h', style: { margin: '0 0 12px' } }, t('presetsTitle')),
					React.createElement('div', {
						key: 'row',
						style: {
							display: 'flex',
							gap: 8,
							marginBottom: 10,
							alignItems: 'center',
							minWidth: 0,
							overflow: 'hidden'
						}
					}, [
						React.createElement('select', {
							key: 'sel',
							value: selected,
							style: {
								flex: '1 1 auto',
								minWidth: 0,
								width: '100%',
								padding: '6px 8px',
								borderRadius: 8,
								boxSizing: 'border-box',
								border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15))'
							},
							onChange: function (e) { setSelected(e.target.value) }
						}, (store.order || []).map(function (id) {
							return React.createElement('option', { key: id, value: id }, (store.packs[id] && store.packs[id].name) || id)
						})),
						React.createElement('button', {
							key: 'add',
							type: 'button',
							title: t('presetsNewPack'),
							'aria-label': t('presetsNewPack'),
							style: roundBtn,
							onClick: function () {
								var id = 'pack_' + Date.now().toString(36)
								var next = {
									packs: Object.assign({}, store.packs),
									order: (store.order || []).concat([id])
								}
								next.packs[id] = { name: t('presetsNewPack'), lines: [] }
								setStore(next)
								setSelected(id)
							}
						}, '+'),
						pack && (store.order || []).length > 1 ? React.createElement('button', {
							key: 'del',
							type: 'button',
							title: t('presetsDeletePack'),
							'aria-label': t('presetsDeletePack'),
							style: Object.assign({}, roundBtn, { color: '#dc2626' }),
							onClick: function () {
								var nextPacks = Object.assign({}, store.packs)
								delete nextPacks[selected]
								var nextOrder = (store.order || []).filter(function (x) { return x !== selected })
								var next = { packs: nextPacks, order: nextOrder }
								setStore(next)
								setSelected(nextOrder[0] || '')
								save(next)
							}
						}, React.createElement('svg', {
							key: 'i',
							width: 16,
							height: 16,
							viewBox: '0 0 24 24',
							fill: 'none',
							stroke: 'currentColor',
							strokeWidth: 2,
							strokeLinecap: 'round',
							strokeLinejoin: 'round',
							'aria-hidden': 'true'
						}, [
							React.createElement('polyline', { key: 'p', points: '3 6 5 6 21 6' }),
							React.createElement('path', { key: 'd', d: 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6' }),
							React.createElement('path', { key: 'v', d: 'M10 11v6' }),
							React.createElement('path', { key: 'v2', d: 'M14 11v6' }),
							React.createElement('path', { key: 'h', d: 'M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2' })
						])) : null
					]),
					pack ? React.createElement('input', {
						key: 'name',
						type: 'text',
						value: pack.name || '',
						placeholder: t('presetsPackName'),
						style: {
							width: '100%',
							maxWidth: '100%',
							marginBottom: 8,
							padding: 8,
							borderRadius: 8,
							boxSizing: 'border-box',
							border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15))'
						},
						onChange: function (e) {
							var next = {
								packs: Object.assign({}, store.packs),
								order: store.order
							}
							next.packs[selected] = Object.assign({}, pack, { name: e.target.value })
							setStore(next)
						}
					}) : null,
					pack ? React.createElement('textarea', {
						key: 'lines',
						value: linesText,
						rows: 12,
						style: {
							width: '100%',
							maxWidth: '100%',
							fontFamily: 'monospace',
							fontSize: 12,
							borderRadius: 8,
							padding: 8,
							boxSizing: 'border-box',
							border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15))',
							resize: 'vertical',
							minWidth: 0
						},
						placeholder: t('presetsLines'),
						onChange: function (e) {
							var lines = e.target.value.split('\n').map(function (s) { return s.trim() }).filter(Boolean)
							var next = { packs: Object.assign({}, store.packs), order: store.order }
							next.packs[selected] = Object.assign({}, pack, { lines: lines })
							setStore(next)
						}
					}) : null,
					React.createElement('div', { key: 'st', style: { fontSize: 12, opacity: 0.7, margin: '8px 0' } }, msg),
					React.createElement('div', { className: 'dsh-danmaku-modal-actions', key: 'a' }, [
						React.createElement('button', {
							key: 'save',
							onClick: function () {
								save(store)
							}
						}, t('presetsSave')),
						React.createElement('button', { key: 'x', onClick: onClose }, t('close'))
					])
				])
			])
		}


		// ---------- Emoji library editor (folders / multi-select / import) ----------
		function EmojiEditorModal(props) {
			var t = props.t
			var onClose = props.onClose
			var showToast = props.showToast
			var itemsState = React.useState([])
			var items = itemsState[0]
			var setItems = itemsState[1]
			var foldersState = React.useState([])
			var folders = foldersState[0]
			var setFolders = foldersState[1]
			var folderIdState = React.useState(null)
			var folderId = folderIdState[0]
			var setFolderId = folderIdState[1]
			var selState = React.useState({})
			var sel = selState[0]
			var setSel = selState[1]
			var lastIdxRef = React.useRef(null)
			var msgState = React.useState('')
			var msg = msgState[0]
			var setMsg = msgState[1]
			var fileRef = React.useRef(null)
			var weightDrafts = React.useRef({})
			var draftTickState = React.useState(0)
			var draftTick = draftTickState[0]
			var setDraftTick = draftTickState[1]
			var importDlgState = React.useState(false)
			var importDlg = importDlgState[0]
			var setImportDlg = importDlgState[1]
			var gitUrlState = React.useState('https://github.com/ccmuyuu/bilibili-emotes.git')
			var gitUrl = gitUrlState[0]
			var setGitUrl = gitUrlState[1]
			var limitState = React.useState(100)
			var importLimit = limitState[0]
			var setImportLimit = limitState[1]
			var jobState = React.useState(null)
			var job = jobState[0]
			var setJob = jobState[1]
			var confirmFolderState = React.useState(null)
			var confirmFolder = confirmFolderState[0]
			var setConfirmFolder = confirmFolderState[1]
			var confirmClearState = React.useState(false)
			var confirmClear = confirmClearState[0]
			var setConfirmClear = confirmClearState[1]

			function reload() {
				return fetchJson('/api/danmaku/emojis').then(function (d) {
					setItems((d && d.items) || [])
					setFolders((d && d.folders) || [])
					weightDrafts.current = {}
					setSel({})
					lastIdxRef.current = null
				}).catch(function () {
					setItems([])
					setFolders([])
				})
			}

			React.useEffect(function () { reload() }, [])

			React.useEffect(function () {
				var stopped = false
				var timer = setInterval(function () {
					if (stopped) return
					fetchJson('/api/danmaku/emojis/import/status').then(function (st) {
						if (stopped) return
						setJob(st && st.running ? st : (st && st.done ? st : null))
						if (st && st.done > 0) reload()
					}).catch(function () {})
				}, 900)
				return function () {
					stopped = true
					clearInterval(timer)
				}
			}, [])

			function childFolders() {
				return folders.filter(function (f) { return (f.parentId || null) === (folderId || null) })
			}
			function childItems() {
				return items.filter(function (it) { return (it.folderId || null) === (folderId || null) })
			}
			function breadcrumb() {
				var chain = []
				var cur = folderId
				var guard = 0
				while (cur && guard++ < 20) {
					var f = folders.find(function (x) { return x.id === cur })
					if (!f) break
					chain.unshift(f)
					cur = f.parentId || null
				}
				return chain
			}
			function selectedIds() {
				return Object.keys(sel).filter(function (k) { return sel[k] })
			}

			function toggleSelect(id, index, e) {
				var ids = childItems()
				if (e.shiftKey && lastIdxRef.current != null) {
					var a = Math.min(lastIdxRef.current, index)
					var b = Math.max(lastIdxRef.current, index)
					var next = Object.assign({}, sel)
					for (var i = a; i <= b; i++) {
						if (ids[i]) next[ids[i].id] = true
					}
					setSel(next)
				} else if (e.ctrlKey || e.metaKey) {
					var n2 = Object.assign({}, sel)
					if (n2[id]) delete n2[id]
					else n2[id] = true
					setSel(n2)
					lastIdxRef.current = index
				} else {
					var o = {}
					o[id] = true
					setSel(o)
					lastIdxRef.current = index
				}
			}

			function clearSel() {
				setSel({})
				lastIdxRef.current = null
			}

			function createFolderHere() {
				fetchJson('/api/danmaku/emojis', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'folderCreate', name: '新建文件夹', parentId: folderId || null })
				}).then(function () {
					if (showToast) showToast('success', '已保存', '')
					reload()
				}).catch(function () {
					if (showToast) showToast('error', '保存失败', '')
				})
			}

			function requestDeleteFolder(f) {
				setConfirmFolder(f)
			}

			function doDeleteFolder(force) {
				var f = confirmFolder
				if (!f) return
				fetchJson('/api/danmaku/emojis', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'folderDelete', id: f.id, force: !!force })
				}).then(function (r) {
					if (r && r.ok) {
						if (showToast) showToast('success', '已删除', '')
						setConfirmFolder(null)
						reload()
					} else if (r && r.reason === 'not_empty') {
						setConfirmFolder(Object.assign({}, f, { needForce: true, nested: r.items || 0 }))
					} else {
						if (showToast) showToast('error', '删除失败', '')
					}
				}).catch(function () {
					if (showToast) showToast('error', '删除失败', '')
				})
			}

			function clearAll() {
				fetchJson('/api/danmaku/emojis', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'clearAll' })
				}).then(function () {
					setConfirmClear(false)
					setFolderId(null)
					if (showToast) showToast('success', '已清空', '')
					reload()
				}).catch(function () {
					if (showToast) showToast('error', '清空失败', '')
				})
			}

			function moveSelectedTo(targetFolderId) {
				var ids = selectedIds()
				if (!ids.length) return
				fetchJson('/api/danmaku/emojis', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'move', ids: ids, folderId: targetFolderId || null })
				}).then(function () {
					if (showToast) showToast('success', '已保存', '')
					reload()
				}).catch(function () {})
			}

			function onDropOnFolder(e, fid) {
				e.preventDefault()
				e.stopPropagation()
				var ids = selectedIds()
				if (ids.length) {
					moveSelectedTo(fid)
					return
				}
				var dragId = e.dataTransfer && e.dataTransfer.getData('text/danmaku-item')
				if (dragId) {
					fetchJson('/api/danmaku/emojis', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ action: 'move', ids: [dragId], folderId: fid || null })
					}).then(function () { reload() }).catch(function () {})
				}
			}

			function onFile(e) {
				var files = e.target.files
				if (!files || !files.length) return
				var list = Array.prototype.slice.call(files)
				var zip = list.find(function (f) { return /\.zip$/i.test(f.name) })
				if (zip) {
					var zr = new FileReader()
					zr.onload = function () {
						var b64 = String(zr.result).replace(/^data:.*;base64,/, '')
						setJob({ running: true, done: 0, total: 0, type: 'zip' })
						fetchJson('/api/danmaku/emojis/upload', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ kind: 'zip', name: zip.name, dataBase64: b64, folderId: folderId || null, limit: Number(importLimit) || 0 })
						}).then(function () {
							if (showToast) showToast('info', '导入中', zip.name)
						}).catch(function () {
							if (showToast) showToast('error', '导入失败', '')
						})
					}
					zr.readAsDataURL(zip)
					e.target.value = ''
					return
				}
				var i = 0
				var ok = 0
				function next() {
					if (i >= list.length) {
						if (showToast) showToast('success', '导入完成', String(ok))
						reload()
						return
					}
					var f = list[i++]
					var rd = new FileReader()
					rd.onload = function () {
						fetchJson('/api/danmaku/emojis/upload', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ name: f.name.replace(/\.[^.]+$/, ''), dataUrl: rd.result, weight: 1, folderId: folderId || null })
						}).then(function () {
							ok++
							next()
						}).catch(function () { next() })
					}
					rd.readAsDataURL(f)
				}
				next()
				e.target.value = ''
			}

			function startGitImport() {
				var url = String(gitUrl || '').trim()
				if (!url) return
				setImportDlg(false)
				setJob({ running: true, done: 0, total: 0, type: 'git' })
				fetchJson('/api/danmaku/emojis/import', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ kind: 'git', url: url, folderId: folderId || null, limit: Number(importLimit) || 0 })
				}).then(function () {
					if (showToast) showToast('info', '导入中', url.slice(0, 48))
				}).catch(function () {
					if (showToast) showToast('error', '导入失败', '')
					setJob(null)
				})
			}

			function abortImportJob() {
				fetchJson('/api/danmaku/emojis/import', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'abort' })
				}).catch(function () {})
			}

			function commitWeight(id, w) {
				fetchJson('/api/danmaku/emojis', {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'weight', id: id, weight: w })
				}).catch(function () {})
			}

			function weightDisplay(it) {
				var d = weightDrafts.current[it.id]
				if (d !== undefined) return d
				return String(it.weight != null ? it.weight : 0)
			}

			function onWeightInput(it, raw) {
				weightDrafts.current[it.id] = raw
				setDraftTick(draftTick + 1)
				if (raw === '' || raw === '-') return
				var w = Number(raw)
				if (!Number.isFinite(w)) return
				w = Math.max(0, Math.min(100, w))
				setItems(items.map(function (x) {
					return x.id === it.id ? Object.assign({}, x, { weight: w }) : x
				}))
				commitWeight(it.id, w)
			}

			function deleteItem(id) {
				fetchJson('/api/danmaku/emojis', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'delete', id: id })
				}).then(function () {
					if (showToast) showToast('success', '已删除', '')
					reload()
				}).catch(function () {})
			}

			function deleteSelected() {
				var ids = selectedIds()
				if (!ids.length) return
				fetchJson('/api/danmaku/emojis', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'deleteMany', ids: ids })
				}).then(function () {
					if (showToast) showToast('success', '已删除', String(ids.length))
					reload()
				}).catch(function () {})
			}

			var roundBtn = {
				borderRadius: 10,
				border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.18))',
				background: '#fff',
				color: 'inherit',
				padding: '8px 12px',
				cursor: 'pointer',
				fontSize: 12,
				whiteSpace: 'nowrap'
			}

			var cardStyle = {
				position: 'relative',
				width: '100%',
				maxWidth: 160,
				margin: '0 auto',
				borderRadius: 12,
				overflow: 'visible',
				background: 'var(--dsw-alias-bg-layer-1,rgba(0,0,0,.04))',
				border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.1))',
				paddingBottom: 4,
				cursor: 'pointer',
				userSelect: 'none',
				display: 'flex',
				flexDirection: 'column'
			}

			var foldersIn = childFolders()
			var itemsIn = childItems()
			var crumbs = breadcrumb()
			var importing = !!(job && job.running)

			return React.createElement('div', Object.assign({ className: 'dsh-danmaku-modal' }, backdropCloseProps(onClose)), [
				React.createElement('div', {
					key: 'box',
					className: 'dsh-danmaku-modal-card',
					style: { width: 'min(720px,94vw)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' },
					onClick: function (e) { e.stopPropagation() }
				}, [
					React.createElement('div', {
						key: 'head',
						style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }
					}, [
						React.createElement('div', { key: 't' }, [
							React.createElement('h3', { key: 'h', style: { margin: '0 0 4px' } }, '表情包库'),
							React.createElement('div', { key: 'hint', style: { fontSize: 12, opacity: 0.7 } }, 'P(i)=总概率×(权重_i/Σ权重)')
						]),
						React.createElement('div', {
							key: 'acts',
							style: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', maxWidth: 460 }
						}, [
							React.createElement('button', { key: 'nf', type: 'button', style: roundBtn, onClick: createFolderHere }, '新建文件夹'),
							React.createElement('button', { key: 'gl', type: 'button', style: roundBtn, onClick: function () { setImportDlg(true) } }, '导入链接'),
							React.createElement('input', {
								key: 'f', ref: fileRef, type: 'file', accept: 'image/*,.zip', multiple: true,
								style: { display: 'none' }, onChange: onFile
							}),
							React.createElement('button', {
								key: 'im', type: 'button', style: roundBtn,
								onClick: function () { fileRef.current && fileRef.current.click() }
							}, '导入图片…'),
							React.createElement('button', {
								key: 'ca', type: 'button',
								style: Object.assign({}, roundBtn, { color: '#dc2626', borderColor: 'rgba(220,38,38,.4)' }),
								onClick: function () { setConfirmClear(true) }
							}, '清空全部')
						])
					]),
					importing ? React.createElement('div', {
						key: 'prog',
						style: {
							display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
							padding: '8px 10px', borderRadius: 8, background: 'rgba(251,114,153,.08)'
						}
					}, [
						React.createElement('div', { key: 'l', style: { fontSize: 12, minWidth: 90 } },
							(job.done || 0) + ' / ' + (job.total || '…')),
						React.createElement('div', {
							key: 'bar',
							style: { flex: 1, height: 8, borderRadius: 99, background: 'rgba(128,128,128,.2)', overflow: 'hidden' }
						}, [
							React.createElement('div', {
								key: 'fill',
								style: {
									height: '100%',
									width: job.total > 0 ? Math.min(100, Math.round((job.done / job.total) * 100)) + '%' : '15%',
									background: '#fb7299',
									transition: 'width .3s'
								}
							})
						]),
						React.createElement('div', {
							key: 'cur',
							style: { fontSize: 11, opacity: 0.7, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
						}, job.current || ''),
						React.createElement('button', {
							key: 'ab',
							type: 'button',
							style: Object.assign({}, roundBtn, { padding: '4px 10px', color: '#dc2626' }),
							onClick: abortImportJob
						}, '中止')
					]) : null,
					selectedIds().length ? React.createElement('div', {
						key: 'selbar',
						style: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontSize: 12 }
					}, [
						React.createElement('span', { key: 'n' }, String(selectedIds().length)),
						React.createElement('button', {
							key: 'mv',
							type: 'button',
							style: roundBtn,
							onClick: function () { moveSelectedTo(folderId) }
						}, '移入当前文件夹'),
						React.createElement('button', {
							key: 'dl',
							type: 'button',
							style: Object.assign({}, roundBtn, { color: '#dc2626' }),
							onClick: deleteSelected
						}, '删除')
					]) : null,
					React.createElement('div', {
						key: 'grid',
						onDragOver: function (e) { e.preventDefault() },
						onClick: function (e) { if (e.target === e.currentTarget) clearSel() },
						style: {
							overflow: 'auto',
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fill,minmax(128px,1fr))',
							gap: 12,
							padding: '4px 2px 8px',
							minHeight: 180
						}
					},
						foldersIn.map(function (f) {
							return React.createElement('div', {
								key: f.id,
								style: Object.assign({}, cardStyle, {
									height: 112,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									gap: 8,
									paddingBottom: 0
								}),
								onClick: function () { setFolderId(f.id); clearSel() },
								onDragOver: function (e) { e.preventDefault() },
								onDrop: function (e) { onDropOnFolder(e, f.id) }
							}, [
								React.createElement('div', { key: 'icon', style: { fontSize: 36 } }, '📁'),
								React.createElement('div', {
									key: 'nm',
									style: { fontSize: 12, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
								}, f.name),
								React.createElement('button', {
									key: 'del',
									type: 'button',
									title: '删除',
									onClick: function (e) {
										e.stopPropagation()
										requestDeleteFolder(f)
									},
									style: {
										position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%',
										border: 'none', background: 'rgba(0,0,0,.45)', color: '#fff', cursor: 'pointer', fontSize: 14
									}
								}, '×')
							])
						}).concat(itemsIn.map(function (it, index) {
							var on = !!sel[it.id]
							return React.createElement('div', {
								key: it.id,
								className: 'dsh-emoji-card',
								draggable: true,
								style: Object.assign({}, cardStyle, on ? { outline: '2px solid #fb7299', outlineOffset: -2 } : null),
								onDragStart: function (e) {
									try { e.dataTransfer.setData('text/danmaku-item', it.id) } catch (err) { /* ignore */ }
									if (!sel[it.id]) {
										var o = {}
										o[it.id] = true
										setSel(o)
									}
								},
								onClick: function (e) {
									e.stopPropagation()
									toggleSelect(it.id, index, e)
								}
							}, [
								React.createElement('div', {
									key: 'iw',
									className: 'dsh-emoji-thumb'
								}, [
									React.createElement('img', {
										key: 'i', src: it.url, alt: it.name, draggable: false,
										loading: 'lazy'
									}),
									React.createElement('div', {
										key: 'n',
										className: 'dsh-emoji-name',
										style: {
											position: 'absolute', left: 0, right: 0, bottom: 0,
											padding: '14px 8px 6px', fontSize: 12, color: '#fff',
											background: 'linear-gradient(transparent,rgba(0,0,0,.55))',
											opacity: 0, transition: 'opacity .15s', pointerEvents: 'none',
											whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center'
										}
									}, it.name || ''),
									React.createElement('button', {
										key: 'd', type: 'button',
										className: 'dsh-emoji-del',
										title: '删除',
										onClick: function (e) { e.stopPropagation(); deleteItem(it.id) },
										style: {
											position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: '50%',
											border: 'none', background: 'rgba(0,0,0,.55)', color: '#fff', cursor: 'pointer',
											display: 'flex', alignItems: 'center', justifyContent: 'center',
											opacity: 0, transition: 'opacity .15s', padding: 0
										}
									}, '🗑')
								]),
								React.createElement('div', {
									key: 'wr',
									style: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px' }
								}, [
									React.createElement('span', { key: 'l', style: { fontSize: 11, opacity: 0.7 } }, '权重'),
									clampedNumberInput({
										key: 'wi', min: 0, max: 100, step: 0.5,
										value: weightDisplay(it),
										onClick: function (e) { e.stopPropagation() },
										style: {
											width: 56, padding: '2px 4px', borderRadius: 6,
											border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15))',
											background: 'transparent', color: 'inherit', boxSizing: 'border-box', fontSize: 12
										},
										onChange: function (v) { onWeightInput(it, String(v)) }
									})
								])
							])
						}))
					),
					React.createElement('div', {
						key: 'foot',
						style: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }
					}, [
						React.createElement('button', {
							key: 'back',
							type: 'button',
							disabled: !folderId,
							style: Object.assign({}, roundBtn, folderId ? null : { opacity: 0.4, cursor: 'default' }),
							onClick: function () {
								if (!folderId) return
								var f = folders.find(function (x) { return x.id === folderId })
								setFolderId(f ? (f.parentId || null) : null)
								clearSel()
							}
						}, '← 返回'),
						React.createElement('div', {
							key: 'crumbs',
							style: { flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4, fontSize: 12, alignItems: 'center', minWidth: 0 }
						}, [
							React.createElement('button', {
								key: 'root',
								type: 'button',
								style: {
									border: 'none', background: folderId ? 'transparent' : 'rgba(251,114,153,.15)',
									color: 'inherit', cursor: 'pointer', borderRadius: 6, padding: '2px 6px'
								},
								onClick: function () { setFolderId(null); clearSel() }
							}, '根目录')
						].concat(crumbs.reduce(function (acc, f, i) {
							acc.push(React.createElement('span', { key: 's' + f.id }, '/'))
							acc.push(React.createElement('button', {
								key: f.id,
								type: 'button',
								style: {
									border: 'none',
									background: i === crumbs.length - 1 ? 'rgba(251,114,153,.15)' : 'transparent',
									color: 'inherit', cursor: 'pointer', borderRadius: 6, padding: '2px 6px'
								},
								onClick: function () { setFolderId(f.id); clearSel() }
							}, f.name))
							return acc
						}, []))),
						React.createElement('div', {
							key: 'st',
							style: { fontSize: 12, opacity: 0.7, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
						}, msg),
						React.createElement('button', { key: 'x', type: 'button', style: roundBtn, onClick: onClose }, '关闭')
					])
				]),
				importDlg ? React.createElement('div', Object.assign({
					key: 'gitdlg',
					className: 'dsh-danmaku-modal',
					style: { zIndex: 10060 }
				}, backdropCloseProps(function () { setImportDlg(false) })), [
					React.createElement('div', {
						key: 'c',
						className: 'dsh-danmaku-modal-card',
						style: { width: 'min(480px,92vw)' },
						onClick: function (e) { e.stopPropagation() }
					}, [
						React.createElement('h3', { key: 'h' }, '导入链接'),
						React.createElement('input', {
							key: 'u', type: 'text', value: gitUrl,
							placeholder: 'https://github.com/user/repo.git',
							style: {
								width: '100%', boxSizing: 'border-box', padding: 8, borderRadius: 8, marginBottom: 10,
								border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15))'
							},
							onChange: function (e) { setGitUrl(e.target.value) }
						}),
						React.createElement('label', { key: 'll', style: { fontSize: 12, display: 'block', marginBottom: 8 } }, [
							React.createElement('span', { key: 's', style: { marginRight: 8 } }, '导入上限'),
							clampedNumberInput({
								key: 'i', min: 1, value: importLimit,
								style: { width: 90, padding: 4, borderRadius: 6, border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15))' },
								onChange: function (v) { setImportLimit(v) }
							})
						]),
						React.createElement('div', { className: 'dsh-danmaku-modal-actions', key: 'a' }, [
							React.createElement('button', { key: 'c2', onClick: function () { setImportDlg(false) } }, '关闭'),
							React.createElement('button', { key: 'ok', onClick: startGitImport }, '导入')
						])
					])
				]) : null,
				confirmFolder ? React.createElement('div', Object.assign({
					key: 'fd',
					className: 'dsh-danmaku-modal',
					style: { zIndex: 10060 }
				}, backdropCloseProps(function () { setConfirmFolder(null) })), [
					React.createElement('div', {
						key: 'c',
						className: 'dsh-danmaku-modal-card',
						style: { width: 'min(380px,90vw)' },
						onClick: function (e) { e.stopPropagation() }
					}, [
						React.createElement('h3', { key: 'h' }, '删除文件夹'),
						React.createElement('div', { key: 'p', style: { fontSize: 13, marginBottom: 12, lineHeight: 1.5 } },
							confirmFolder.needForce
								? ('文件夹非空（含 ' + (confirmFolder.nested || 0) + ' 张图），确认删除？')
								: (confirmFolder.name || '')),
						React.createElement('div', { className: 'dsh-danmaku-modal-actions', key: 'a' }, [
							React.createElement('button', { key: 'c2', onClick: function () { setConfirmFolder(null) } }, '取消'),
							React.createElement('button', {
								key: 'ok',
								style: { borderColor: '#dc2626', color: '#dc2626' },
								onClick: function () { doDeleteFolder(true) }
							}, '确定')
						])
					])
				]) : null,
				confirmClear ? React.createElement('div', Object.assign({
					key: 'cd',
					className: 'dsh-danmaku-modal',
					style: { zIndex: 10060 }
				}, backdropCloseProps(function () { setConfirmClear(false) })), [
					React.createElement('div', {
						key: 'c',
						className: 'dsh-danmaku-modal-card',
						style: { width: 'min(380px,90vw)' },
						onClick: function (e) { e.stopPropagation() }
					}, [
						React.createElement('h3', { key: 'h', style: { color: '#dc2626' } }, '清空全部'),
						React.createElement('div', { key: 'p', style: { fontSize: 13, marginBottom: 12 } },
							'将删除全部表情包与文件夹，不可恢复。'),
						React.createElement('div', { className: 'dsh-danmaku-modal-actions', key: 'a' }, [
							React.createElement('button', { key: 'c2', onClick: function () { setConfirmClear(false) } }, '取消'),
							React.createElement('button', {
								key: 'ok',
								style: { borderColor: '#dc2626', color: '#dc2626' },
								onClick: clearAll
							}, '确定')
						])
					])
				]) : null
			])
		}

		// ---------- Gift asset import toolbar (todo 8) ----------
		// Four entries: multi-file binary upload (SERIAL, one request at a time, with
		// a progress bar + abort), pasted SVG source, a git/GitHub URL and a zip
		// package. The host owns the extension whitelist, the size cap and SVG
		// sanitize; this UI only pre-filters extensions (a non-whitelisted file is
		// never sent) and surfaces every server failure reason as a toast instead of
		// swallowing it. No client-side sanitize — the host cleans pasted/uploaded SVG.
		var GIFT_IMPORT_ACCEPT = '.svg,.svga,.gif,.apng,.webp,.png,.jpg'
		var GIFT_IMPORT_EXT_CT = {
			'.svg': 'image/svg+xml',
			'.svga': 'application/octet-stream',
			'.gif': 'image/gif',
			'.apng': 'image/apng',
			'.webp': 'image/webp',
			'.png': 'image/png',
			'.jpg': 'image/jpeg',
		}

		function giftImportExt(name) {
			var n = String(name || '').toLowerCase()
			var dot = n.lastIndexOf('.')
			var slash = n.lastIndexOf('/')
			if (dot <= slash || dot < 0) return ''
			return n.slice(dot)
		}

		function giftImportErrorText(status, body) {
			var err = (body && (body.error || body.reason)) || ''
			if (status === 413) return '超出上限' + (body && body.limitMB ? '（' + body.limitMB + 'MB）' : '')
			if (status === 415) return '不支持的文件类型'
			if (status === 409) return '已有导入任务进行中'
			if (status === 400) return '文件无效：' + (err || 'unknown')
			return err || ('HTTP ' + status)
		}

		function giftImportUploadUrl(name, folderId) {
			return '/api/danmaku/gift/assets/upload?name=' + encodeURIComponent(name)
				+ (folderId ? '&folderId=' + encodeURIComponent(folderId) : '')
		}

		function GiftImportToolbar(props) {
			var folderId = props.folderId || null
			var onChanged = props.onChanged || function () { }
			var showToast = props.showToast || giftToast
			var fileRef = React.useRef(null)
			var zipRef = React.useRef(null)
			var busyRef = React.useRef(false)
			var abortRef = React.useRef(false)
			var ctrlRef = React.useRef(null)
			var pasteOpenState = React.useState(false)
			var pasteOpen = pasteOpenState[0]
			var setPasteOpen = pasteOpenState[1]
			var pasteTextState = React.useState('')
			var pasteText = pasteTextState[0]
			var setPasteText = pasteTextState[1]
			var gitOpenState = React.useState(false)
			var gitOpen = gitOpenState[0]
			var setGitOpen = gitOpenState[1]
			var gitUrlState = React.useState('')
			var gitUrl = gitUrlState[0]
			var setGitUrl = gitUrlState[1]
			var gitLimitState = React.useState(0)
			var gitLimit = gitLimitState[0]
			var setGitLimit = gitLimitState[1]
			var jobState = React.useState(null)
			var job = jobState[0]
			var setJob = jobState[1]
			var jobType = job && job.type
			var running = !!(job && job.running)

			// Host import job (git/zip): poll status until it leaves `running`.
			React.useEffect(function () {
				if (!running || (jobType !== 'git' && jobType !== 'zip')) return undefined
				var stopped = false
				var timer = setInterval(function () {
					if (stopped) return
					fetchJson('/api/danmaku/gift/assets/import/status').then(function (st) {
						if (stopped || !st) return
						if (st.running) {
							setJob({ type: jobType, running: true, done: st.done || 0, total: st.total || 0, current: st.current || '' })
							return
						}
						stopped = true
						clearInterval(timer)
						setJob(null)
						if (st.error) showToast('error', '导入失败', String(st.error).slice(0, 120))
						else if (st.aborted) showToast('info', '已中止', '')
						else { showToast('success', '导入完成', String(st.done || 0)); onChanged() }
					}).catch(function () { /* transient: keep polling */ })
				}, 800)
				return function () { stopped = true; clearInterval(timer) }
			}, [running, jobType])

			async function runFileQueue(list) {
				busyRef.current = true
				abortRef.current = false
				var ok = 0
				var failed = []
				for (var i = 0; i < list.length; i++) {
					if (abortRef.current) break
					var f = list[i]
					setJob({ type: 'files', running: true, done: i, total: list.length, current: f.name })
					var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
					ctrlRef.current = ctrl
					try {
						var res = await fetch(giftImportUploadUrl(f.name, folderId), {
							method: 'POST',
							headers: { 'Content-Type': GIFT_IMPORT_EXT_CT[giftImportExt(f.name)] || 'application/octet-stream' },
							body: f,
							signal: ctrl ? ctrl.signal : undefined,
						})
						if (!res.ok) {
							var body = null
							try { body = await res.json() } catch (e) { /* ignore */ }
							throw new Error(giftImportErrorText(res.status, body))
						}
						ok++
					} catch (e) {
						if (abortRef.current || (e && e.name === 'AbortError')) break
						failed.push(f.name + '：' + String(e && e.message ? e.message : e))
					}
				}
				ctrlRef.current = null
				busyRef.current = false
				setJob(null)
				if (abortRef.current) showToast('info', '已中止', ok + ' / ' + list.length)
				else if (failed.length) showToast('error', '上传失败（' + failed.length + '）', failed[0])
				else showToast('success', '导入完成', String(ok))
				if (ok > 0) onChanged()
			}

			function onFilePick(e) {
				var files = Array.prototype.slice.call((e.target && e.target.files) || [])
				e.target.value = ''
				if (!files.length) return
				if (busyRef.current) { showToast('info', '已有导入任务进行中', ''); return }
				var allowed = []
				var rejected = []
				files.forEach(function (f) {
					if (GIFT_IMPORT_EXT_CT[giftImportExt(f.name)]) allowed.push(f)
					else rejected.push(f.name)
				})
				if (rejected.length) showToast('error', '已跳过不支持的文件', rejected.slice(0, 3).join('、'))
				if (allowed.length) runFileQueue(allowed)
			}

			function onZipPick(e) {
				var f = e.target && e.target.files && e.target.files[0]
				e.target.value = ''
				if (!f) return
				setJob({ type: 'zip', running: true, done: 0, total: 0, current: f.name })
				f.arrayBuffer().then(function (buf) {
					return fetch('/api/danmaku/gift/assets/upload?kind=zip' + (folderId ? '&folderId=' + encodeURIComponent(folderId) : ''), {
						method: 'POST',
						headers: { 'Content-Type': 'application/zip' },
						body: buf,
					})
				}).then(function (res) {
					if (res.ok) return null
					return res.json().catch(function () { return null }).then(function (body) {
						throw new Error(giftImportErrorText(res.status, body))
					})
				}).catch(function (err) {
					setJob(null)
					showToast('error', '导入失败', String(err && err.message ? err.message : err))
				})
			}

			function submitPaste() {
				var text = String(pasteText || '')
				if (!text.trim()) return
				setPasteOpen(false)
				setJob({ type: 'paste', running: true, done: 0, total: 1, current: 'pasted.svg' })
				fetch(giftImportUploadUrl('pasted.svg', folderId), {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-svg-text' },
					body: text,
				}).then(function (res) {
					if (res.ok) return null
					return res.json().catch(function () { return null }).then(function (body) {
						throw new Error(giftImportErrorText(res.status, body))
					})
				}).then(function () {
					setJob(null)
					setPasteText('')
					showToast('success', '导入完成', '1')
					onChanged()
				}).catch(function (err) {
					setJob(null)
					showToast('error', '导入失败', String(err && err.message ? err.message : err))
				})
			}

			function startGitImport() {
				var url = String(gitUrl || '').trim()
				if (!url) return
				setGitOpen(false)
				setJob({ type: 'git', running: true, done: 0, total: 0, current: 'cloning…' })
				fetchJson('/api/danmaku/gift/assets/import', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ kind: 'git', url: url, folderId: folderId, limit: Number(gitLimit) || 0 }),
				}).catch(function (err) {
					setJob(null)
					showToast('error', '导入失败', String(err && err.message ? err.message : err))
				})
			}

			function abortImport() {
				if (jobType === 'files') {
					abortRef.current = true
					if (ctrlRef.current) { try { ctrlRef.current.abort() } catch (e) { /* ignore */ } }
					return
				}
				if (jobType === 'git' || jobType === 'zip') {
					fetchJson('/api/danmaku/gift/assets/import', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ action: 'abort' }),
					}).catch(function () { /* ignore */ })
				}
			}

			var pct = job && job.total > 0 ? Math.min(100, Math.round((job.done / job.total) * 100)) : 15
			return React.createElement('div', { className: 'dsh-gift-import', 'data-gift-import': '1' }, [
				React.createElement('input', {
					key: 'f', ref: fileRef, type: 'file', multiple: true,
					accept: GIFT_IMPORT_ACCEPT, className: 'dsh-gift-import-file',
					style: { display: 'none' }, onChange: onFilePick,
				}),
				React.createElement('button', {
					key: 'fb', type: 'button', className: 'dsh-gift-import-btn',
					onClick: function () { if (fileRef.current) fileRef.current.click() },
				}, '导入文件…'),
				React.createElement('button', {
					key: 'pb', type: 'button', className: 'dsh-gift-import-btn',
					onClick: function () { setPasteOpen(!pasteOpen) },
				}, '粘贴 SVG 代码'),
				React.createElement('button', {
					key: 'gb', type: 'button', className: 'dsh-gift-import-btn',
					onClick: function () { setGitOpen(!gitOpen) },
				}, 'GitHub 导入…'),
				React.createElement('input', {
					key: 'z', ref: zipRef, type: 'file', accept: '.zip',
					className: 'dsh-gift-import-zip', style: { display: 'none' }, onChange: onZipPick,
				}),
				React.createElement('button', {
					key: 'zb', type: 'button', className: 'dsh-gift-import-btn',
					onClick: function () { if (zipRef.current) zipRef.current.click() },
				}, '导入 zip…'),
				job ? React.createElement('div', {
					key: 'prog', className: 'dsh-gift-import-progress',
					'data-gift-import-progress': '1', 'data-type': job.type || '',
					'data-done': String(job.done || 0), 'data-total': String(job.total || 0),
				}, [
					React.createElement('div', { key: 'c', className: 'dsh-gift-import-count' }, (job.done || 0) + ' / ' + (job.total || '…')),
					React.createElement('div', { key: 'b', className: 'dsh-gift-import-bar' }, [
						React.createElement('div', { key: 'fill', style: { width: pct + '%' } }),
					]),
					React.createElement('div', { key: 'cur', className: 'dsh-gift-import-cur' }, job.current || ''),
					React.createElement('button', {
						key: 'ab', type: 'button', className: 'dsh-gift-import-abort', onClick: abortImport,
					}, '中止'),
				]) : null,
				pasteOpen ? React.createElement('div', { key: 'pd', className: 'dsh-gift-import-dialog' }, [
					React.createElement('div', { key: 't', style: { fontSize: 12, marginBottom: 6 } }, '粘贴 SVG 代码（host 清洗后入库）'),
					React.createElement('textarea', {
						key: 'ta', className: 'dsh-gift-paste-text', value: pasteText, placeholder: '<svg …>',
						onChange: function (e) { setPasteText(e.target.value) },
					}),
					React.createElement('div', { key: 'a', className: 'dsh-danmaku-modal-actions', style: { marginTop: 8 } }, [
						React.createElement('button', { key: 'c2', type: 'button', onClick: function () { setPasteOpen(false) } }, '取消'),
						React.createElement('button', { key: 'ok', type: 'button', className: 'dsh-gift-paste-submit', onClick: submitPaste }, '导入'),
					]),
				]) : null,
				gitOpen ? React.createElement('div', { key: 'gd', className: 'dsh-gift-import-dialog' }, [
					React.createElement('div', { key: 't', style: { fontSize: 12, marginBottom: 6 } }, 'GitHub / git 仓库地址（支持 https / git@ / file://）'),
					React.createElement('input', {
						key: 'u', type: 'text', className: 'dsh-gift-git-url', value: gitUrl,
						placeholder: 'https://github.com/user/repo.git',
						onChange: function (e) { setGitUrl(e.target.value) },
					}),
					React.createElement('label', { key: 'l', style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginTop: 8 } }, [
						React.createElement('span', { key: 's' }, '导入上限（0 = 不限）'),
						React.createElement('input', {
							key: 'n', type: 'number', min: 0, className: 'dsh-gift-git-limit', value: gitLimit,
							style: { width: 90 },
							onChange: function (e) { setGitLimit(e.target.value) },
						}),
					]),
					React.createElement('div', { key: 'a', className: 'dsh-danmaku-modal-actions', style: { marginTop: 8 } }, [
						React.createElement('button', { key: 'c2', type: 'button', onClick: function () { setGitOpen(false) } }, '取消'),
						React.createElement('button', { key: 'ok', type: 'button', className: 'dsh-gift-git-start', onClick: startGitImport }, '导入'),
					]),
				]) : null,
			])
		}

		// Mount any gift UI component into an arbitrary container. Test/acceptance
		// mount point only — the future big modal embeds the panel as a child.
		function mountGiftUi(component, props, container) {
			if (!container) return null
			var ReactDomClient = require('react-dom/client')
			var root = ReactDomClient.createRoot(container)
			root.render(React.createElement(component, props || {}))
			return { unmount: function () { try { root.unmount() } catch (e) { /* ignore */ } } }
		}

		// ---------- Gift asset library panel (todo 9) ----------
		// A PANEL component, not a modal: the big config modal (todo 23) hosts it as
		// the first right-column section, and the debug mount point hosts it for
		// acceptance. Grid (minmax(128px,1fr)) + folder breadcrumb/enter/back +
		// multi-select (click/ctrl/shift) + drag-into-folder + draft-style weight
		// input (0-100 step .5) + single/batch delete + confirm dialogs. The import
		// toolbar (todo 8) sits at the top. State is panel-local — the emoji editor's
		// state is deliberately not reused.
		function GiftAssetsPanel(props) {
			var onToast = props.onToast || giftToast
			var itemsState = React.useState([])
			var items = itemsState[0]
			var setItems = itemsState[1]
			var foldersState = React.useState([])
			var folders = foldersState[0]
			var setFolders = foldersState[1]
			var folderIdState = React.useState(null)
			var folderId = folderIdState[0]
			var setFolderId = folderIdState[1]
			var selState = React.useState({})
			var sel = selState[0]
			var setSel = selState[1]
			var lastIdxRef = React.useRef(null)
			var weightDrafts = React.useRef({})
			var draftTickState = React.useState(0)
			var draftTick = draftTickState[0]
			var setDraftTick = draftTickState[1]
			var confirmFolderState = React.useState(null)
			var confirmFolder = confirmFolderState[0]
			var setConfirmFolder = confirmFolderState[1]
			var confirmClearState = React.useState(false)
			var confirmClear = confirmClearState[0]
			var setConfirmClear = confirmClearState[1]

			function reload() {
				giftPreviewStop()
				return fetchJson('/api/danmaku/gift/assets').then(function (d) {
					setItems((d && d.items) || [])
					setFolders((d && d.folders) || [])
					weightDrafts.current = {}
					setSel({})
					lastIdxRef.current = null
				}).catch(function () {
					setItems([])
					setFolders([])
				})
			}

			React.useEffect(function () { reload() }, [])

			// Never leak the shared hover preview past this panel's lifetime.
			React.useEffect(function () { return function () { giftPreviewStop() } }, [])

			function childFolders() {
				return folders.filter(function (f) { return (f.parentId || null) === (folderId || null) })
			}
			function childItems() {
				return items.filter(function (it) { return (it.folderId || null) === (folderId || null) })
			}
			function breadcrumb() {
				var chain = []
				var cur = folderId
				var guard = 0
				while (cur && guard++ < 20) {
					var f = folders.find(function (x) { return x.id === cur })
					if (!f) break
					chain.unshift(f)
					cur = f.parentId || null
				}
				return chain
			}
			function selectedIds() {
				return Object.keys(sel).filter(function (k) { return sel[k] })
			}

			function toggleSelect(id, index, e) {
				var ids = childItems()
				if (e.shiftKey && lastIdxRef.current != null) {
					var a = Math.min(lastIdxRef.current, index)
					var b = Math.max(lastIdxRef.current, index)
					var next = Object.assign({}, sel)
					for (var i = a; i <= b; i++) if (ids[i]) next[ids[i].id] = true
					setSel(next)
				} else if (e.ctrlKey || e.metaKey) {
					var n2 = Object.assign({}, sel)
					if (n2[id]) delete n2[id]
					else n2[id] = true
					setSel(n2)
					lastIdxRef.current = index
				} else {
					var o = {}
					o[id] = true
					setSel(o)
					lastIdxRef.current = index
				}
			}

			function clearSel() {
				setSel({})
				lastIdxRef.current = null
			}

			function createFolderHere() {
				fetchJson('/api/danmaku/gift/assets', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'folderCreate', name: '新建文件夹', parentId: folderId || null }),
				}).then(function () {
					onToast('success', '已保存', '')
					reload()
				}).catch(function () {
					onToast('error', '保存失败', '')
				})
			}

			function requestDeleteFolder(f) {
				setConfirmFolder(f)
			}

			function doDeleteFolder(force) {
				var f = confirmFolder
				if (!f) return
				fetchJson('/api/danmaku/gift/assets', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'folderDelete', id: f.id, force: !!force }),
				}).then(function (r) {
					if (r && r.ok) {
						onToast('success', '已删除', '')
						setConfirmFolder(null)
						if (folderId === f.id) setFolderId(null)
						reload()
					} else if (r && r.reason === 'not_empty') {
						setConfirmFolder(Object.assign({}, f, { needForce: true, nested: r.items || 0 }))
					} else {
						onToast('error', '删除失败', '')
					}
				}).catch(function () {
					onToast('error', '删除失败', '')
				})
			}

			function clearAll() {
				fetchJson('/api/danmaku/gift/assets', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'clearAll' }),
				}).then(function () {
					setConfirmClear(false)
					setFolderId(null)
					onToast('success', '已清空', '')
					reload()
				}).catch(function () {
					onToast('error', '清空失败', '')
				})
			}

			function moveTo(ids, targetFolderId) {
				if (!ids.length) return
				fetchJson('/api/danmaku/gift/assets', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'move', ids: ids, folderId: targetFolderId || null }),
				}).then(function () {
					onToast('success', '已保存', '')
					reload()
				}).catch(function () {
					onToast('error', '移动失败', '')
				})
			}

			function onDropOnFolder(e, fid) {
				e.preventDefault()
				e.stopPropagation()
				var dragId = ''
				try { dragId = (e.dataTransfer && e.dataTransfer.getData('text/dsh-gift-item')) || '' } catch (err) { /* ignore */ }
				var ids = selectedIds()
				if (dragId && ids.indexOf(dragId) >= 0) moveTo(ids, fid)
				else if (dragId) moveTo([dragId], fid)
				else if (ids.length) moveTo(ids, fid)
			}

			function commitWeight(id, w) {
				fetchJson('/api/danmaku/gift/assets', {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'weight', id: id, weight: w }),
				}).catch(function () { /* keep the local draft */ })
			}

			function weightDisplay(it) {
				var d = weightDrafts.current[it.id]
				if (d !== undefined) return d
				return String(it.weight != null ? it.weight : 0)
			}

			function onWeightInput(it, raw) {
				weightDrafts.current[it.id] = raw
				setDraftTick(draftTick + 1)
				if (raw === '' || raw === '-') return
				var w = Number(raw)
				if (!Number.isFinite(w)) return
				w = Math.max(0, Math.min(100, w))
				setItems(items.map(function (x) {
					return x.id === it.id ? Object.assign({}, x, { weight: w }) : x
				}))
				commitWeight(it.id, w)
			}

			function deleteItem(id) {
				fetchJson('/api/danmaku/gift/assets', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'delete', id: id }),
				}).then(function () {
					onToast('success', '已删除', '')
					reload()
				}).catch(function () {
					onToast('error', '删除失败', '')
				})
			}

			function deleteSelected() {
				var ids = selectedIds()
				if (!ids.length) return
				fetchJson('/api/danmaku/gift/assets', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'deleteMany', ids: ids }),
				}).then(function () {
					onToast('success', '已删除', String(ids.length))
					reload()
				}).catch(function () {
					onToast('error', '删除失败', '')
				})
			}

			function confirmOverlay(opts) {
				return React.createElement('div', Object.assign({
					className: 'dsh-danmaku-modal ' + (opts.className || ''),
					style: { zIndex: 10060 },
				}, backdropCloseProps(opts.onCancel)), [
					React.createElement('div', {
						key: 'c', className: 'dsh-danmaku-modal-card',
						style: { width: 'min(380px,90vw)' },
						onClick: function (e) { e.stopPropagation() },
					}, [
						React.createElement('h3', { key: 'h', style: opts.danger ? { color: '#dc2626' } : null }, opts.title),
						React.createElement('div', { key: 'p', style: { fontSize: 13, marginBottom: 12, lineHeight: 1.5 } }, opts.body),
						React.createElement('div', { key: 'a', className: 'dsh-danmaku-modal-actions' }, [
							React.createElement('button', { key: 'c2', type: 'button', className: 'dsh-gift-confirm-cancel', onClick: opts.onCancel }, '取消'),
							React.createElement('button', {
								key: 'ok', type: 'button', className: 'dsh-gift-confirm-ok',
								style: opts.danger ? { borderColor: '#dc2626', color: '#dc2626' } : null,
								onClick: opts.onOk,
							}, opts.okLabel || '确定'),
						]),
					]),
				])
			}

			var roundBtn = {
				borderRadius: 10,
				border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.18))',
				background: '#fff',
				color: 'inherit',
				padding: '8px 12px',
				cursor: 'pointer',
				fontSize: 12,
				whiteSpace: 'nowrap',
			}
			var foldersIn = childFolders()
			var itemsIn = childItems()
			var crumbs = breadcrumb()
			var selCount = selectedIds().length

			return React.createElement('div', { className: 'dsh-gift-assets', 'data-gift-assets': '1' }, [
				React.createElement(GiftImportToolbar, {
					key: 'import', folderId: folderId, onChanged: reload, showToast: onToast,
				}),
				React.createElement('div', { key: 'acts', className: 'dsh-gift-assets-actions' }, [
					React.createElement('button', { key: 'nf', type: 'button', className: 'dsh-gift-folder-new', onClick: createFolderHere }, '新建文件夹'),
					React.createElement('button', {
						key: 'ca', type: 'button', className: 'dsh-gift-clear',
						style: { color: '#dc2626', borderColor: 'rgba(220,38,38,.4)' },
						onClick: function () { setConfirmClear(true) },
					}, '清空全部'),
				]),
				selCount ? React.createElement('div', { key: 'selbar', className: 'dsh-gift-selbar' }, [
					React.createElement('span', { key: 'n', className: 'dsh-gift-selcount' }, String(selCount)),
					React.createElement('button', {
						key: 'mv', type: 'button', className: 'dsh-gift-sel-move',
						onClick: function () { moveTo(selectedIds(), folderId) },
					}, '移入当前文件夹'),
					React.createElement('button', {
						key: 'dl', type: 'button', className: 'dsh-gift-sel-del', style: { color: '#dc2626' },
						onClick: deleteSelected,
					}, '删除'),
				]) : null,
				React.createElement('div', {
					key: 'grid', className: 'dsh-gift-assets-grid',
					onDragOver: function (e) { e.preventDefault() },
					onClick: function (e) { if (e.target === e.currentTarget) clearSel() },
				}, foldersIn.map(function (f) {
					return React.createElement('div', {
						key: f.id, className: 'dsh-gift-folder-card', 'data-folder-id': f.id,
						onClick: function () { setFolderId(f.id); clearSel() },
						onDragOver: function (e) { e.preventDefault(); try { e.currentTarget.setAttribute('data-drop', '1') } catch (err) { /* ignore */ } },
						onDragLeave: function (e) { try { e.currentTarget.removeAttribute('data-drop') } catch (err) { /* ignore */ } },
						onDrop: function (e) {
							try { e.currentTarget.removeAttribute('data-drop') } catch (err) { /* ignore */ }
							onDropOnFolder(e, f.id)
						},
					}, [
						React.createElement('div', { key: 'ic', className: 'dsh-gift-folder-icon' }),
						React.createElement('div', { key: 'nm', className: 'dsh-gift-folder-name' }, f.name),
						React.createElement('button', {
							key: 'del', type: 'button', title: '删除文件夹', className: 'dsh-gift-folder-del',
							onClick: function (e) { e.stopPropagation(); requestDeleteFolder(f) },
						}, '×'),
					])
				}).concat(itemsIn.map(function (it, index) {
					var on = !!sel[it.id]
					return React.createElement('div', {
						key: it.id, className: 'dsh-gift-asset-card', 'data-item-id': it.id, draggable: true,
						style: on ? { outline: '2px solid #fb7299', outlineOffset: -2 } : null,
						onDragStart: function (e) {
							try {
								e.dataTransfer.setData('text/dsh-gift-item', it.id)
								e.dataTransfer.effectAllowed = 'move'
							} catch (err) { /* ignore */ }
							if (!sel[it.id]) {
								var o = {}
								o[it.id] = true
								setSel(o)
							}
						},
						onClick: function (e) { e.stopPropagation(); toggleSelect(it.id, index, e) },
						onMouseEnter: function (e) { giftPreviewHoverStart(it, e.currentTarget) },
						onMouseLeave: function () { giftPreviewStop() },
					}, [
						React.createElement('div', { key: 'iw', className: 'dsh-gift-asset-thumb' }, [
							giftThumbContent(it),
							React.createElement('div', { key: 'n', className: 'dsh-gift-asset-name' }, it.name || ''),
							React.createElement('button', {
								key: 'd', type: 'button', title: '删除', className: 'dsh-gift-asset-del',
								onClick: function (e) { e.stopPropagation(); deleteItem(it.id) },
							}, '×'),
						]),
						React.createElement('div', { key: 'wr', className: 'dsh-gift-asset-weight-row' }, [
							React.createElement('span', { key: 'l', style: { fontSize: 11, opacity: 0.7 } }, '权重'),
							clampedNumberInput({
								key: 'wi', min: 0, max: 100, step: 0.5,
								className: 'dsh-gift-asset-weight',
								value: weightDisplay(it),
								onClick: function (e) { e.stopPropagation() },
								onChange: function (v) { onWeightInput(it, String(v)) },
							}),
						]),
					])
				}))
				),
				(!foldersIn.length && !itemsIn.length) ? React.createElement('div', {
					key: 'empty', className: 'dsh-gift-assets-empty',
				}, '当前文件夹还没有素材 —— 用上方工具条导入文件 / 粘贴 SVG / GitHub / zip。') : null,
				React.createElement('div', { key: 'foot', className: 'dsh-gift-assets-foot' }, [
					React.createElement('button', {
						key: 'back', type: 'button', className: 'dsh-gift-back',
						disabled: !folderId,
						style: folderId ? null : { opacity: 0.4, cursor: 'default' },
						onClick: function () {
							if (!folderId) return
							var f = folders.find(function (x) { return x.id === folderId })
							setFolderId(f ? (f.parentId || null) : null)
							clearSel()
						},
					}, '← 返回'),
					React.createElement('div', { key: 'crumbs', className: 'dsh-gift-crumbs' }, [
						React.createElement('button', {
							key: 'root', type: 'button', className: 'dsh-gift-crumb dsh-gift-crumb-root',
							'data-active': folderId ? '0' : '1',
							onClick: function () { setFolderId(null); clearSel() },
						}, '根目录'),
					].concat(crumbs.reduce(function (acc, f) {
						acc.push(React.createElement('span', { key: 's' + f.id }, '/'))
						acc.push(React.createElement('button', {
							key: f.id, type: 'button', className: 'dsh-gift-crumb',
							'data-active': (f.id === folderId) ? '1' : '0',
							onClick: function () { setFolderId(f.id); clearSel() },
						}, f.name))
						return acc
					}, []))),
					React.createElement('div', { key: 'st', className: 'dsh-gift-assets-count' },
						itemsIn.length + ' 项 / ' + foldersIn.length + ' 夹'),
				]),
				confirmFolder ? confirmOverlay({
					className: 'dsh-gift-confirm-folder',
					title: '删除文件夹',
					danger: true,
					body: confirmFolder.needForce
						? ('文件夹非空（含 ' + (confirmFolder.nested || 0) + ' 个素材），确认删除？其中的素材会一并删除。')
						: (confirmFolder.name || ''),
					onCancel: function () { setConfirmFolder(null) },
					onOk: function () { doDeleteFolder(true) },
				}) : null,
				confirmClear ? confirmOverlay({
					className: 'dsh-gift-confirm-clear',
					title: '清空全部',
					danger: true,
					body: '将删除全部素材与文件夹，不可恢复。',
					onCancel: function () { setConfirmClear(false) },
					onOk: clearAll,
				}) : null,
			])
		}


		// ---------- Gift sender presets editor (todo 19) ----------
		// The batch textarea section of the simulation area (the big modal, todo
		// 23, hosts it). Controlled when `senders` + `onChange` are supplied — the
		// modal owns persistence via its draft/save. Otherwise it fetches the live
		// config, edits locally and saves through POST /api/danmaku/config, so it
		// is independently mountable for acceptance. Parsing is line-level:
		// `名字` / `名字*权重` (default 1), blank lines skipped, illegal lines
		// ignored and surfaced as a hint.
		function GiftSendersEditor(props) {
			props = props || {}
			var controlled = props.senders !== undefined
			var onToast = props.onToast || giftToast
			var initial = controlled && Array.isArray(props.senders) ? props.senders : []
			var sendersState = React.useState(initial)
			var senders = sendersState[0]
			var setSenders = sendersState[1]
			var textState = React.useState(formatSenderBatch(initial))
			var text = textState[0]
			var setText = textState[1]
			var hintState = React.useState('')
			var hint = hintState[0]
			var setHint = hintState[1]

			// Uncontrolled: load the current senders once.
			React.useEffect(function () {
				if (controlled) return
				fetchJson('/api/danmaku/config').then(function (data) {
					var s = (data && data.config && data.config.giftSenders) || []
					setSenders(s)
					setText(formatSenderBatch(s))
				}).catch(function () { /* defaults */ })
			}, [])

			function applyText(raw) {
				setText(raw)
				var parsed = parseSenderBatch(raw)
				setSenders(parsed.senders)
				var bits = ['共 ' + parsed.senders.length + ' 个送礼用户']
				if (parsed.invalid.length) {
					bits.unshift('已忽略 ' + parsed.invalid.length + ' 行：' +
						parsed.invalid.map(function (x) { return '第' + x.line + '行' }).join('、'))
				}
				if (parsed.overflow) bits.push('超出上限 ' + parsed.overflow + ' 条已丢弃')
				setHint(bits.join(' · '))
				if (controlled && typeof props.onChange === 'function') props.onChange(parsed.senders)
			}

			function save() {
				if (controlled) return
				fetchJson('/api/danmaku/config').then(function (data) {
					var cfg = (data && data.config) || {}
					cfg.giftSenders = senders
					return fetchJson('/api/danmaku/config', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ config: cfg }),
					})
				}).then(function () {
					onToast('success', '已保存', String(senders.length))
				}).catch(function () { onToast('error', '保存失败', '') })
			}

			return React.createElement('div', { className: 'dsh-gift-senders', 'data-gift-senders': '1' }, [
				React.createElement('div', { key: 'l', className: 'dsh-gift-senders-label' },
					'送礼用户（逗号或换行分隔；名字*权重，默认 1；上限 ' + GIFT_SENDERS_MAX + ' 条）'),
				React.createElement('textarea', {
					key: 'ta', className: 'dsh-gift-senders-text', 'data-gift-senders-text': '1',
					rows: 4, value: text, spellCheck: false,
					placeholder: '小林*3\n路人甲\n匿名用户*0.5',
					onChange: function (e) { applyText(e.target.value) },
				}),
				hint ? React.createElement('div', {
					key: 'h', className: 'dsh-gift-senders-hint', 'data-gift-senders-hint': '1',
				}, hint) : null,
				controlled ? null : React.createElement('div', { key: 'a', className: 'dsh-danmaku-modal-actions' }, [
					React.createElement('button', {
						key: 's', type: 'button', className: 'dsh-gift-senders-save', onClick: save,
					}, '保存送礼用户'),
				]),
				React.createElement('div', {
					key: 'c', className: 'dsh-gift-senders-count', 'data-gift-senders-count': '1',
				}, String(senders.length)),
			])
		}


		// ---------- Gift catalog list (todo 21) ----------
		// The big config modal's LEFT column. Search (name / ID), category filter
		// (coin_type / type), lazy render (first 100 + 「加载更多」) and rows of
		// icon (CDN direct + onerror placeholder) + name + price + 「未绑定」
		// badge. Clicking a row notifies the right pane via onSelect. NEVER
		// renders all 905 rows at once and never downloads icons into the store.
		//
		// Props: `onSelect(gift)` (right-pane hook), `bindings` (giftBindings map;
		// fetched from config when omitted) and `gifts` (injected catalog; fetched
		// from /api/danmaku/gift/catalog when omitted — used by acceptance to make
		// the icon-404 path deterministic).
		var GIFT_CATALOG_PAGE = 100
		function giftCatalogIconUrl(g) {
			return (g && (g.img_basic || g.img_dynamic || g.gif || g.webp)) || ''
		}
		function giftCatalogCoinLabel(c) {
			if (c === 'silver') return '银瓜子'
			if (c === 'gold') return '金瓜子'
			return String(c)
		}
		function giftCatalogPriceLabel(p) {
			var n = Number(p)
			return Number.isFinite(n) && n > 0 ? '¥' + Math.round(n * 100) / 100 : '免费'
		}
		function GiftCatalogList(props) {
			props = props || {}
			var onSelect = typeof props.onSelect === 'function' ? props.onSelect : function () { }
			var injected = Array.isArray(props.gifts) ? props.gifts : null
			var giftsState = React.useState(injected || [])
			var gifts = giftsState[0]
			var setGifts = giftsState[1]
			var queryState = React.useState('')
			var query = queryState[0]
			var setQuery = queryState[1]
			var catState = React.useState('')
			var cat = catState[0]
			var setCat = catState[1]
			var limitState = React.useState(GIFT_CATALOG_PAGE)
			var limit = limitState[0]
			var setLimit = limitState[1]
			var selState = React.useState(null)
			var sel = selState[0]
			var setSel = selState[1]
			var bindingsState = React.useState(props.bindings && typeof props.bindings === 'object' ? props.bindings : null)
			var bindings = bindingsState[0]
			var setBindings = bindingsState[1]

			React.useEffect(function () {
				if (injected) return
				fetchJson('/api/danmaku/gift/catalog').then(function (d) {
					setGifts((d && d.gifts) || [])
				}).catch(function () { setGifts([]) })
			}, [])

			React.useEffect(function () {
				if (bindings) return
				fetchJson('/api/danmaku/config').then(function (d) {
					setBindings((d && d.config && d.config.giftBindings) || {})
				}).catch(function () { setBindings({}) })
			}, [])

			function matches(g) {
				if (cat) {
					var i = cat.indexOf(':')
					var kind = cat.slice(0, i)
					var val = cat.slice(i + 1)
					if (kind === 'ct' && String(g.coin_type) !== val) return false
					if (kind === 'ty' && String(g.type) !== val) return false
				}
				if (!query) return true
				var q = query.trim().toLowerCase()
				return String(g.name || '').toLowerCase().indexOf(q) >= 0
					|| String(g.id).indexOf(q) === 0
			}
			function isBound(g) {
				var b = bindings && bindings[g.id]
				return !!(b && b.assetId)
			}

			function onIconError(e) {
				var img = e.currentTarget
				try { img.style.display = 'none' } catch (err) { /* ignore */ }
				var host = img.parentNode
				if (host && !host.querySelector('[data-icon-fallback]')) {
					var ph = document.createElement('span')
					ph.className = 'dsh-gift-catalog-icon-fallback'
					ph.setAttribute('data-icon-fallback', '1')
					ph.textContent = '无图'
					host.appendChild(ph)
				}
			}
			function row(g) {
				var url = giftCatalogIconUrl(g)
				var bound = isBound(g)
				return React.createElement('div', {
					key: 'g' + g.id, className: 'dsh-gift-catalog-row', 'data-gift-id': String(g.id),
					'data-unbound': bound ? '0' : '1', 'data-selected': sel === g.id ? '1' : '0',
					onClick: function () { setSel(g.id); onSelect(g) },
				}, [
					React.createElement('div', { key: 'ic', className: 'dsh-gift-catalog-icon' }, url
						? React.createElement('img', {
							key: 'i', src: url, alt: '', loading: 'lazy', draggable: false,
							className: 'dsh-gift-catalog-img', onError: onIconError,
						})
						: React.createElement('span', {
							key: 'ph', className: 'dsh-gift-catalog-icon-fallback', 'data-icon-fallback': '1',
						}, '无图')),
					React.createElement('div', { key: 'mn', className: 'dsh-gift-catalog-main' }, [
						React.createElement('div', { key: 'n', className: 'dsh-gift-catalog-name' }, g.name || '(未命名)'),
						React.createElement('div', { key: 'm', className: 'dsh-gift-catalog-meta' },
							giftCatalogPriceLabel(g.price) + ' · ID ' + g.id),
					]),
					bound ? null : React.createElement('span', {
						key: 'ub', className: 'dsh-gift-catalog-unbound', 'data-gift-unbound-badge': '1',
					}, '未绑定'),
				])
			}

			var filtered = gifts.filter(matches)
			var shown = filtered.slice(0, limit)
			var ct = {}
			var ty = {}
			gifts.forEach(function (g) {
				if (g.coin_type != null) ct[g.coin_type] = true
				if (g.type != null) ty[g.type] = true
			})
			var catChildren = [React.createElement('option', { key: 'all', value: '' }, '全部分类')]
			var ctKeys = Object.keys(ct)
			var tyKeys = Object.keys(ty).sort(function (a, b) { return Number(a) - Number(b) })
			if (ctKeys.length) {
				catChildren.push(React.createElement('optgroup', { key: 'ctg', label: '瓜子类型' },
					ctKeys.map(function (c) {
						return React.createElement('option', { key: 'ct' + c, value: 'ct:' + c }, giftCatalogCoinLabel(c))
					})))
			}
			if (tyKeys.length) {
				catChildren.push(React.createElement('optgroup', { key: 'tyg', label: '礼物类型' },
					tyKeys.map(function (t) {
						return React.createElement('option', { key: 'ty' + t, value: 'ty:' + t }, '类型 ' + t)
					})))
			}

			return React.createElement('div', { className: 'dsh-gift-catalog', 'data-gift-catalog': '1' }, [
				React.createElement('div', { key: 'bar', className: 'dsh-gift-catalog-bar' }, [
					React.createElement('input', {
						key: 'q', type: 'text', className: 'dsh-gift-catalog-search',
						'data-gift-catalog-search': '1', value: query, placeholder: '搜索礼物名称 / ID',
						onChange: function (e) { setQuery(e.target.value); setLimit(GIFT_CATALOG_PAGE) },
					}),
					React.createElement('select', {
						key: 'c', className: 'dsh-gift-catalog-cat', 'data-gift-catalog-cat': '1',
						value: cat, onChange: function (e) { setCat(e.target.value); setLimit(GIFT_CATALOG_PAGE) },
					}, catChildren),
				]),
				React.createElement('div', {
					key: 'st', className: 'dsh-gift-catalog-status', 'data-gift-catalog-count': '1',
				}, filtered.length + ' 项 · 已显示 ' + shown.length),
				React.createElement('div', {
					key: 'list', className: 'dsh-gift-catalog-list', 'data-gift-catalog-list': '1',
				}, shown.length
					? shown.map(row)
					: React.createElement('div', {
						key: 'empty', className: 'dsh-gift-catalog-empty', 'data-gift-catalog-empty': '1',
					}, '无匹配')),
				(filtered.length > limit) ? React.createElement('button', {
					key: 'more', type: 'button', className: 'dsh-gift-catalog-more', 'data-gift-catalog-more': '1',
					onClick: function () { setLimit(limit + GIFT_CATALOG_PAGE) },
				}, '加载更多（剩余 ' + (filtered.length - limit) + '）') : null,
			])
		}


		// ---------- Gift binding + effect params panel (todo 22) ----------
		// The big config modal's right-pane middle section. Given the selected
		// catalog gift it lets the user: ① bind a library asset (thumbnail-grid
		// mini popup over the todo-9 store) ② set effect params (position preset
		// dropdown of 7 anchors + random / scale 0.25-2 / duration 1-10s / loop)
		// ③ see a small position preview bar ④ unbind. Writes go through
		// `giftBindings` (schema + clamp owned by todo 6). There is deliberately
		// NO free-drag positioning (ruling D8) — the marker is driven only by the
		// preset dropdown. An empty-state guide shows when no gift is selected.
		var GIFT_BIND_POSITIONS = [
			['center', '居中'], ['top', '顶部'], ['bottom', '底部'],
			['top-left', '左上'], ['top-right', '右上'],
			['bottom-left', '左下'], ['bottom-right', '右下'], ['random', '随机']
		]
		function giftBindingAnchor(position) {
			if (position === 'random') return null
			return GIFT_ANCHORS[position] || GIFT_ANCHORS.center
		}
		function GiftBindingPanel(props) {
			props = props || {}
			var gift = props.gift || null
			var controlled = props.bindings !== undefined
			var onToast = props.onToast || giftToast
			var bindingsState = React.useState(controlled ? props.bindings : null)
			var bindings = bindingsState[0]
			var setBindings = bindingsState[1]
			var bindingsRef = React.useRef(bindings)
			bindingsRef.current = bindings
			var pickingState = React.useState(false)
			var picking = pickingState[0]
			var setPicking = pickingState[1]
			var assetsState = React.useState(Array.isArray(props.assets) ? props.assets : null)
			var assets = assetsState[0]
			var setAssets = assetsState[1]
			// Serialize writes so rapid slider/dropdown changes can't interleave
			// stale giftBindings maps and lose an update.
			var writeChain = React.useRef(Promise.resolve())

			React.useEffect(function () {
				if (controlled || bindings) return
				fetchJson('/api/danmaku/config').then(function (d) {
					setBindings((d && d.config && d.config.giftBindings) || {})
				}).catch(function () { setBindings({}) })
			}, [])
			React.useEffect(function () {
				if (assets) return
				fetchJson('/api/danmaku/gift/assets').then(function (d) { setAssets((d && d.items) || []) }).catch(function () { setAssets([]) })
			}, [])

			function persist(next) {
				bindingsRef.current = next
				setBindings(next)
				if (typeof props.onChange === 'function') { try { props.onChange(next) } catch (e) { /* ignore */ } }
				if (controlled) return
				writeChain.current = writeChain.current.then(function () {
					return fetchJson('/api/danmaku/config').then(function (d) {
						var cfg = (d && d.config) || {}
						cfg.giftBindings = next
						return fetchJson('/api/danmaku/config', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ config: cfg })
						})
					})
				}).catch(function () { onToast('error', '保存失败', '') })
			}
			function currentBinding() {
				if (!gift) return null
				var m = bindingsRef.current || {}
				return m[gift.id] || null
			}
			function patchBinding(patch) {
				if (!gift) return
				var cur = currentBinding() || {}
				var def = { assetId: '', position: 'center', scale: 1, durationMs: 3000, loop: false }
				var next = Object.assign({}, bindingsRef.current || {})
				next[gift.id] = Object.assign({}, def, cur, patch)
				persist(next)
			}
			function bindAsset(a) { patchBinding({ assetId: a.id }); setPicking(false) }
			function unbind() {
				var next = Object.assign({}, bindingsRef.current || {})
				delete next[gift.id]
				persist(next)
			}

			if (!gift) {
				return React.createElement('div', { className: 'dsh-gift-bind', 'data-gift-bind': '1' }, [
					React.createElement('div', {
						key: 'e', className: 'dsh-gift-bind-empty', 'data-gift-bind-empty': '1',
					}, '从左侧选择一个礼物后，在此绑定素材并调整特效参数')
				])
			}

			var b = currentBinding() || {}
			var bound = String(b.assetId == null ? '' : b.assetId) !== ''
			var position = GIFT_POSITIONS.indexOf(b.position) >= 0 ? b.position : 'center'
			var scale = Number(b.scale)
			if (!Number.isFinite(scale)) scale = 1
			var durationS = Number(b.durationMs)
			if (!Number.isFinite(durationS)) durationS = 3000
			durationS = Math.min(10, Math.max(1, durationS / 1000))
			var loop = b.loop === true
			var assetList = Array.isArray(assets) ? assets : []
			var boundAsset = null
			if (bound) {
				for (var i = 0; i < assetList.length; i++) {
					if (String(assetList[i].id) === String(b.assetId)) { boundAsset = assetList[i]; break }
				}
			}
			var anchor = giftBindingAnchor(position)
			var markerStyle = anchor ? { left: (anchor[0] * 100) + '%', top: (anchor[1] * 100) + '%' } : { left: '50%', top: '50%' }

			function thumb(a) {
				var url = giftAssetUrl(a)
				var isImg = a.kind === 'image' || a.kind === 'svg'
				return React.createElement('button', {
					key: 'a' + a.id, type: 'button', className: 'dsh-gift-bind-thumb',
					'data-gift-asset-option': String(a.id),
					'data-selected': bound && String(b.assetId) === String(a.id) ? '1' : '0',
					title: a.name || a.id,
					onClick: function () { bindAsset(a) },
				}, [
					isImg && url
						? React.createElement('img', { key: 'i', src: url, alt: '', loading: 'lazy', draggable: false })
						: React.createElement('span', { key: 'k' }, String(a.kind || '?').toUpperCase())
				])
			}

			return React.createElement('div', { className: 'dsh-gift-bind', 'data-gift-bind': '1' }, [
				React.createElement('div', { key: 'h', className: 'dsh-gift-bind-head' }, [
					React.createElement('span', { key: 'n' }, gift.name || '(未命名)'),
					React.createElement('span', { key: 'id', className: 'dsh-gift-bind-id' }, 'ID ' + gift.id)
				]),
				React.createElement('div', { key: 'bind', className: 'dsh-gift-bind-row' }, [
					React.createElement('span', { key: 'l', className: 'dsh-gift-bind-label' }, '绑定素材'),
					bound
						? React.createElement('span', { key: 'c', className: 'dsh-gift-bind-chip', 'data-gift-bound-asset': '1' },
							boundAsset ? (boundAsset.name || b.assetId) : (b.assetId + (assetList.length ? '（素材已失效）' : '')))
						: React.createElement('span', { key: 'u', className: 'dsh-gift-bind-hint' }, '未绑定'),
					React.createElement('button', {
						key: 'o', type: 'button', 'data-gift-bind-open': '1',
						onClick: function () { setPicking(!picking) },
					}, bound ? '更换素材' : '选择素材'),
					bound ? React.createElement('button', {
						key: 'x', type: 'button', 'data-gift-unbind': '1', onClick: unbind,
					}, '解除绑定') : null
				]),
				picking ? React.createElement('div', {
					key: 'p', className: 'dsh-gift-bind-picker', 'data-gift-bind-picker': '1',
				}, assetList.length
					? React.createElement('div', { key: 'g', className: 'dsh-gift-bind-grid' }, assetList.map(thumb))
					: React.createElement('div', { key: 'e', className: 'dsh-gift-bind-picker-empty' }, '素材库为空，请先在素材仓库导入'))
					: null,
				React.createElement('div', { key: 'pos', className: 'dsh-gift-bind-row' }, [
					React.createElement('span', { key: 'l', className: 'dsh-gift-bind-label' }, '位置'),
					React.createElement('select', {
						key: 's', className: 'dsh-gift-bind-select', 'data-gift-param-position': '1', value: position,
						onChange: function (e) { patchBinding({ position: e.target.value }) },
					}, GIFT_BIND_POSITIONS.map(function (op) {
						return React.createElement('option', { key: op[0], value: op[0] }, op[1])
					})),
					React.createElement('div', {
						key: 'pv', className: 'dsh-gift-preview', 'data-gift-position-preview': '1', 'data-position': position,
					}, [
						React.createElement('div', {
							key: 'm', className: 'dsh-gift-preview-marker', 'data-gift-preview-marker': '1',
							'data-position': position, style: markerStyle,
						})
					])
				]),
				React.createElement('div', { key: 'sc', className: 'dsh-gift-bind-row' }, [
					React.createElement('span', { key: 'l', className: 'dsh-gift-bind-label' }, '缩放'),
					React.createElement('input', {
						key: 'r', type: 'range', className: 'dsh-gift-bind-range', 'data-gift-param-scale': '1',
						min: 0.25, max: 2, step: 0.25, value: scale,
						onChange: function (e) { patchBinding({ scale: Number(e.target.value) }) },
					}),
					React.createElement('span', {
						key: 'v', className: 'dsh-gift-bind-scale-read', 'data-gift-param-scale-val': '1',
					}, scale.toFixed(2) + '×')
				]),
				React.createElement('div', { key: 'du', className: 'dsh-gift-bind-row' }, [
					React.createElement('span', { key: 'l', className: 'dsh-gift-bind-label' }, '时长'),
					React.createElement('input', {
						key: 'r', type: 'range', className: 'dsh-gift-bind-range', 'data-gift-param-duration': '1',
						min: 1, max: 10, step: 0.5, value: durationS,
						onChange: function (e) { patchBinding({ durationMs: Math.round(Number(e.target.value) * 1000) }) },
					}),
					React.createElement('span', {
						key: 'v', className: 'dsh-gift-bind-scale-read', 'data-gift-param-duration-val': '1',
					}, durationS.toFixed(1) + 's')
				]),
				React.createElement('div', { key: 'lp', className: 'dsh-gift-bind-row' }, [
					React.createElement('span', { key: 'l', className: 'dsh-gift-bind-label' }, '循环'),
					React.createElement('label', { key: 'c', className: 'dsh-gift-bind-loop' }, [
						React.createElement('input', {
							key: 'i', type: 'checkbox', 'data-gift-param-loop': '1', checked: loop,
							onChange: function (e) { patchBinding({ loop: e.target.checked }) },
						}),
						React.createElement('span', { key: 't' }, loop ? '循环播放' : '仅一次')
					])
				])
			])
		}


		// ---------- Gift config modal (todo 23) ----------
		// Composes the existing gift pieces into ONE split-panel page (NO inner
		// tabs): left = catalog list (todo 21), right = a single scroll column with
		// three stacked sections (assets t9 / binding+params t22 / simulation
		// t19+t20) plus a thin right anchor strip. Reuses `backdropCloseProps`
		// (ruling C): a first backdrop click while an input is focused only blurs.
		// The master switch is owned by the settings section; this modal mirrors
		// the LIVE config (`giftRuntime.configRef`) so opening it never mutates it.
		function GiftConfigModal(props) {
			props = props || {}
			var t = props.t || function (k) { return k }
			var onClose = props.onClose || function () { }
			var onToast = props.showToast || giftToast
			var initialAnchor = props.initialAnchor || null
			var selState = React.useState(null)
			var selected = selState[0]
			var setSelected = selState[1]
			var rightRef = React.useRef(null)
			var secRefs = React.useRef({})
			function readCfg() {
				try { return (giftRuntime.configRef && giftRuntime.configRef.current) || null } catch (e) { return null }
			}
			var cfgState = React.useState(readCfg)
			var cfg = cfgState[0]
			var setCfg = cfgState[1]
			var lastState = React.useState(function () { try { return giftSimState().last } catch (e) { return null } })
			var last = lastState[0]
			var setLast = lastState[1]
			var errState = React.useState('')
			var errText = errState[0]
			var setErrText = errState[1]

			// Mirror the live config (the app polls every ~2.5s into configRef); the
			// modal only READS it so it reflects external master-switch changes.
			React.useEffect(function () {
				var id = setInterval(function () { var c = readCfg(); if (c) setCfg(c) }, 800)
				return function () { clearInterval(id) }
			}, [])

			function jumpTo(sec) {
				var root = rightRef.current
				var el = secRefs.current[sec]
				if (!root || !el) return
				root.scrollTop = Math.max(0, el.offsetTop - root.offsetTop)
			}
			React.useEffect(function () { if (initialAnchor) jumpTo(initialAnchor) }, [])

			var giftOn = !!(cfg && cfg.giftEnabled === true)

			// Manual test = a RANDOM trigger among bound gifts. Errors are surfaced
			// in the status line, never swallowed.
			function runTest() {
				if (!giftOn) return
				try {
					var p = triggerGift({})
					if (p && typeof p.then === 'function') {
						p.then(function (rec) {
							if (rec) { setErrText(''); setLast(rec) }
							else { setErrText(''); setLast(null) }
						}).catch(function (e) { setErrText(t('giftTriggerErr') + ': ' + String((e && e.message) || e)) })
					}
				} catch (e) { setErrText(t('giftTriggerErr') + ': ' + String((e && e.message) || e)) }
			}

			var lastText = last
				? ((last.sender || '匿名') + ' → ' + (last.giftName || last.giftId))
				: t('giftNoneYet')

			return React.createElement('div', Object.assign({
				className: 'dsh-gift-modal', 'data-gift-modal': '1',
				'data-gift-modal-anchor': initialAnchor || '',
			}, backdropCloseProps(onClose)), [
				React.createElement('div', {
					key: 'box', className: 'dsh-gift-modal-box',
					onClick: function (e) { e.stopPropagation() },
				}, [
					React.createElement('div', { key: 'h', className: 'dsh-gift-modal-head' }, [
						React.createElement('span', { key: 't' }, t('giftModalTitle')),
						React.createElement('button', {
							key: 'x', type: 'button',
							style: { border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 18 },
							onClick: onClose,
						}, '×'),
					]),
					React.createElement('div', { key: 'b', className: 'dsh-gift-modal-body' }, [
						React.createElement('div', { key: 'l', className: 'dsh-gift-modal-left' },
							React.createElement(GiftCatalogList, {
								onSelect: function (g) { setSelected(g) },
							})),
						React.createElement('div', { key: 'r', className: 'dsh-gift-modal-right', ref: rightRef, 'data-gift-modal-right': '1' }, [
							React.createElement('div', {
								key: 'sa', className: 'dsh-gift-modal-sec', 'data-gift-sec': 'assets',
								ref: function (el) { secRefs.current.assets = el },
							}, [
								React.createElement('div', { key: 'h', className: 'dsh-gift-modal-sec-title' }, t('giftSecAssets')),
								React.createElement(GiftAssetsPanel, { onToast: onToast }),
							]),
							React.createElement('div', {
								key: 'sb', className: 'dsh-gift-modal-sec', 'data-gift-sec': 'bind',
								ref: function (el) { secRefs.current.bind = el },
							}, [
								React.createElement('div', { key: 'h', className: 'dsh-gift-modal-sec-title' }, t('giftSecBind')),
								React.createElement(GiftBindingPanel, { gift: selected, onToast: onToast }),
							]),
							React.createElement('div', {
								key: 'ss', className: 'dsh-gift-modal-sec', 'data-gift-sec': 'sim',
								ref: function (el) { secRefs.current.sim = el },
							}, [
								React.createElement('div', { key: 'h', className: 'dsh-gift-modal-sec-title' }, t('giftSecSim')),
								React.createElement('div', { key: 'sim', className: 'dsh-gift-sim', 'data-gift-sim': '1' }, [
									giftOn ? null : React.createElement('div', {
										key: 'off', className: 'dsh-gift-sim-off', 'data-gift-sim-off': '1',
									}, t('giftNeedOn')),
									React.createElement(GiftSendersEditor, { key: 'se', onToast: onToast }),
									React.createElement('div', { key: 'row', className: 'dsh-gift-sim-row' }, [
										React.createElement('button', {
											key: 'test', type: 'button', 'data-gift-sim-test': '1',
											disabled: !giftOn, onClick: runTest,
										}, t('giftSimTest')),
										errText ? React.createElement('span', { key: 'e', 'data-gift-sim-err': '1' }, errText) : null,
									]),
									React.createElement('div', {
										key: 'last', className: 'dsh-gift-sim-last', 'data-gift-sim-last': '1',
									}, t('giftLastStatus') + ': ' + lastText),
								]),
							]),
						]),
						React.createElement('div', { key: 'a', className: 'dsh-gift-modal-anchors' }, [
							React.createElement('button', { key: 'assets', type: 'button', 'data-gift-anchor': 'assets', onClick: function () { jumpTo('assets') } }, t('giftAnchorAssets')),
							React.createElement('button', { key: 'bind', type: 'button', 'data-gift-anchor': 'bind', onClick: function () { jumpTo('bind') } }, t('giftAnchorBind')),
							React.createElement('button', { key: 'sim', type: 'button', 'data-gift-anchor': 'sim', onClick: function () { jumpTo('sim') } }, t('giftAnchorSim')),
						]),
					]),
				]),
			])
		}


		// ---------- Gift asset thumbnails + SVGA hover preview (todo 10) ----------
		// Raster + SVG thumbs use <img loading="lazy" src=/api/danmaku/gift/file?id=>
		// — SVG is never inlined (the served file is ingest-sanitized, but an <img>
		// is the inert path). SVGA cards keep a static type badge and start a SHARED
		// single-instance preview only after 300ms of hover; leaving destroys it, so
		// at most one player exists at any time (no per-card players, no autoplay).
		var giftPreview = { handle: null, timer: null, token: 0, el: null, badge: null, url: '' }

		function giftPreviewStop() {
			giftPreview.token++
			giftPreview.url = ''
			if (giftPreview.timer) { clearTimeout(giftPreview.timer); giftPreview.timer = null }
			var h = giftPreview.handle
			giftPreview.handle = null
			if (h && typeof h.destroy === 'function') { try { h.destroy() } catch (e) { /* ignore */ } }
			if (giftPreview.badge) { try { giftPreview.badge.style.display = '' } catch (e) { /* ignore */ } }
			if (giftPreview.el && giftPreview.el.parentNode) {
				try { giftPreview.el.parentNode.removeChild(giftPreview.el) } catch (e) { /* ignore */ }
			}
			giftPreview.el = null
			giftPreview.badge = null
		}

		function giftPreviewHoverStart(asset, cardEl) {
			if (!asset || asset.kind !== 'svga' || !cardEl) return
			giftPreviewStop()
			var url = giftAssetUrl(asset)
			if (!url) return
			var token = ++giftPreview.token
			giftPreview.timer = setTimeout(function () {
				giftPreview.timer = null
				if (token !== giftPreview.token) return
				var host = cardEl.querySelector('.dsh-gift-asset-thumb')
				if (!host) return
				var badge = host.querySelector('.dsh-gift-asset-badge')
				var el = document.createElement('div')
				el.className = 'dsh-gift-asset-preview'
				host.appendChild(el)
				giftPreview.el = el
				giftPreview.badge = badge
				giftPreview.url = url
				if (badge) badge.style.display = 'none'
				playSvga(url, el, { loop: true, silent: true }).then(function (h) {
					if (token !== giftPreview.token) { try { h.destroy() } catch (e) { /* ignore */ } return }
					giftPreview.handle = h
					// Unplayable/corrupt file: no canvas materialized — put the badge back.
					if (!el.querySelector('canvas') && badge) { try { badge.style.display = '' } catch (e) { /* ignore */ } }
				})
			}, 300)
		}

		// Static thumb content: inert <img> for image/svg, type badge for svga.
		function giftThumbContent(it) {
			if (it.kind === 'image' || it.kind === 'svg') {
				return React.createElement('img', {
					key: 'i', src: it.url, alt: it.name || '', loading: 'lazy', draggable: false,
					className: 'dsh-gift-asset-img', 'data-gift-thumb': 'img',
				})
			}
			return React.createElement('span', {
				key: 'b', className: 'dsh-gift-asset-badge', 'data-kind': it.kind || '', 'data-gift-thumb': 'badge',
			}, String(it.kind || '').toUpperCase())
		}

		// Clearable clamped number input (shared by every bare number field).
		// While focused the shown text is a local draft: it may be empty and is
		// never auto-filled or clamped. On blur/Enter it commits - '' -> min,
		// non-numeric -> revert to the last committed value, numeric -> clamp to
		// [min,max] - then clears the draft so the controlled value shows.
		function ClampedNumberInput(props) {
			var uncontrolled = props.value === undefined && props.defaultValue !== undefined
			var localState = React.useState(props.defaultValue)
			var localValue = localState[0]
			var setLocalValue = localState[1]
			var draftState = React.useState(null)
			var draft = draftState[0]
			var setDraft = draftState[1]
			var committed = uncontrolled ? localValue : props.value
			var shown = draft != null ? draft : (committed == null ? '' : String(committed))
			function commit() {
				if (draft == null) return
				var min = Number(props.min)
				var max = Number(props.max)
				var n = draft === '' ? min : Number(draft)
				if (!Number.isFinite(n)) { setDraft(null); return }
				if (Number.isFinite(min) && n < min) n = min
				if (Number.isFinite(max) && n > max) n = max
				setDraft(null)
				if (uncontrolled) setLocalValue(n)
				if (props.onChange) props.onChange(n)
			}
			return React.createElement('input', {
				type: 'number',
				value: shown,
				min: props.min,
				max: props.max,
				step: props.step,
				disabled: !!props.disabled,
				style: props.style,
				title: props.title,
				className: props.className,
				placeholder: props.placeholder,
				onClick: props.onClick,
				onFocus: function () { setDraft(committed == null ? '' : String(committed)) },
				onChange: function (e) { setDraft(e.target.value) },
				onBlur: commit,
				onKeyDown: function (e) { if (e.key === 'Enter') { e.preventDefault(); commit() } }
			})
		}
		function clampedNumberInput(opts) {
			return React.createElement(ClampedNumberInput, opts)
		}

		// Multiline long-text control (shared): label on top, full-row-width
		// textarea below. Fixed height (~rows) with internal vertical scroll —
		// never auto-grows. draftMode (default) keeps a local raw-text draft
		// while focused and commits on blur, so comma-list fields are not
		// re-parsed on every keystroke (which would jump the caret).
		function LongTextArea(props) {
			var draftMode = props.draftMode !== false
			var value = props.value == null ? '' : String(props.value)
			var draftState = React.useState(null)
			var draft = draftState[0]
			var setDraft = draftState[1]
			var shown = (draftMode && draft != null) ? draft : value
			function commit() {
				if (!draftMode) return
				var raw = draft
				setDraft(null)
				if (raw != null && raw !== value) props.onChange(raw)
			}
			return React.createElement('textarea', {
				className: 'dsh-danmaku-textarea',
				rows: props.rows != null ? props.rows : 4,
				value: shown,
				disabled: !!props.disabled,
				placeholder: props.placeholder,
				spellCheck: false,
				onFocus: draftMode ? function () { setDraft(value) } : undefined,
				onChange: function (e) {
					if (draftMode) setDraft(e.target.value)
					else props.onChange(e.target.value)
				},
				onBlur: draftMode ? commit : undefined
			})
		}
		function longTextArea(opts) {
			return React.createElement('div', { className: 'dsh-danmaku-row dsh-danmaku-row-stacked', key: opts.key }, [
				React.createElement('span', { key: 'l' }, opts.label),
				React.createElement(LongTextArea, {
					key: 'c',
					value: opts.value,
					draftMode: opts.draftMode,
					rows: opts.rows,
					disabled: opts.disabled,
					placeholder: opts.placeholder,
					onChange: opts.onChange
				})
			])
		}

		// Slider + editable number input (shared by ball pop & settings)
		function sliderField(opts) {
			var numStyle = {
				width: 64,
				marginLeft: 8,
				padding: '3px 6px',
				borderRadius: 6,
				border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.15))',
				background: 'transparent',
				color: 'inherit',
				boxSizing: 'border-box',
				fontSize: 12,
				flexShrink: 0
			}
			function commit(v) {
				if (!Number.isFinite(v)) return
				var min = Number(opts.min)
				var max = Number(opts.max)
				if (Number.isFinite(min)) v = Math.max(min, v)
				if (Number.isFinite(max)) v = Math.min(max, v)
				opts.onChange(v)
			}
			return React.createElement('div', {
				key: opts.key || 'sl',
				style: {
					display: 'flex',
					alignItems: 'center',
					flex: '1 1 auto',
					minWidth: 0,
					justifyContent: 'flex-end'
				}
			}, [
				React.createElement('input', {
					key: 'r',
					type: 'range',
					min: opts.min,
					max: opts.max,
					step: opts.step != null ? opts.step : 1,
					value: opts.value,
					disabled: !!opts.disabled,
					style: { flex: '1 1 auto', minWidth: 0, maxWidth: opts.rangeMax || 200 },
					onChange: function (e) { commit(Number(e.target.value)) }
				}),
				clampedNumberInput({
					key: 'n',
					min: opts.min,
					max: opts.max,
					step: opts.step != null ? opts.step : 1,
					value: opts.value,
					disabled: !!opts.disabled,
					style: numStyle,
					title: String(opts.value),
					onChange: commit
				})
			])
		}

		// ---------- toast (omni-style) ----------
		var toastSeq = 0
		var toastTimers = {}

		function ToastCard(props) {
			var t = props.toast || {}
			return React.createElement('div', {
				className: 'dsh-toast-card dsh-toast-' + (t.type || 'info'),
				onClick: function () { if (props.onExtend) props.onExtend(t.id) }
			}, [
				React.createElement('div', { key: 'b', className: 'dsh-toast-body' }, [
					t.title ? React.createElement('div', { key: 't', className: 'dsh-toast-title' }, t.title) : null,
					t.desc ? React.createElement('div', { key: 'd', className: 'dsh-toast-desc' }, t.desc) : null
				]),
				React.createElement('button', {
					key: 'x',
					className: 'dsh-toast-close',
					onClick: function (e) {
						e.stopPropagation()
						if (props.onClose) props.onClose()
					}
				}, '×')
			])
		}

		function ToastContainer(props) {
			var toasts = Array.isArray(props.toasts) ? props.toasts : []
			if (!toasts.length) return null
			return React.createElement('div', { className: 'dsh-toast-container' },
				toasts.map(function (t) {
					return React.createElement(ToastCard, {
						key: t.id,
						toast: t,
						onClose: function () { props.onClose(t.id) },
						onExtend: function () { props.onExtend(t.id) }
					})
				})
			)
		}

		function useToastHost() {
			var toastsState = React.useState([])
			var toasts = toastsState[0]
			var setToasts = toastsState[1]

			function closeToast(id) {
				if (toastTimers[id]) {
					clearTimeout(toastTimers[id])
					delete toastTimers[id]
				}
				setToasts(function (prev) {
					return (prev || []).filter(function (x) { return x.id !== id })
				})
			}

			function showToast(type, title, desc) {
				var id = 't_' + (++toastSeq)
				setToasts(function (prev) {
					var next = [{ id: id, type: type || 'info', title: title || '', desc: desc || '' }].concat(prev || [])
					return next.length > 4 ? next.slice(0, 4) : next
				})
				toastTimers[id] = setTimeout(function () { closeToast(id) }, 3200)
			}

			function extendToast(id) {
				if (toastTimers[id]) clearTimeout(toastTimers[id])
				toastTimers[id] = setTimeout(function () { closeToast(id) }, 10000)
			}

			return {
				toasts: toasts,
				showToast: showToast,
				closeToast: closeToast,
				extendToast: extendToast
			}
		}

		// ---------- Collapsible settings section (收纳栏) ----------
		var COLLAPSE_KEY = 'dsh-danmaku-collapse'
		function loadCollapseState() {
			try {
				var raw = localStorage.getItem(COLLAPSE_KEY)
				return raw ? JSON.parse(raw) : {}
			} catch (e) {
				return {}
			}
		}
		function saveCollapseState(map) {
			try {
				localStorage.setItem(COLLAPSE_KEY, JSON.stringify(map))
			} catch (e) { /* ignore */ }
		}
		function CollapseSection(props) {
			var title = props.title
			var children = props.children
			var sectionKey = props.sectionKey || 'default'
			var defaultOpen = props.defaultOpen === true
			var stored = loadCollapseState()
			var hasStored = Object.prototype.hasOwnProperty.call(stored, sectionKey)
			var openState = React.useState(hasStored ? !!stored[sectionKey] : defaultOpen)
			var open = openState[0]
			var setOpen = openState[1]
			function toggle() {
				var next = !open
				setOpen(next)
				var map = loadCollapseState()
				map[sectionKey] = next
				saveCollapseState(map)
			}
			return React.createElement('div', {
				key: props.sectionKey,
				style: {
					border: '1px solid var(--dsw-alias-border-l3,rgba(0,0,0,.12))',
					borderRadius: 10,
					margin: '10px 0',
					overflow: 'hidden'
				}
			}, [
				React.createElement('button', {
					key: 'h',
					type: 'button',
					style: {
						width: '100%', textAlign: 'left', border: 'none', background: 'transparent',
						color: 'inherit', padding: '8px 12px', cursor: 'pointer', fontWeight: 600,
						fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
					},
					onClick: toggle
				}, [
					React.createElement('span', { key: 't' }, title),
					React.createElement('span', { key: 'i', style: { opacity: 0.6, fontSize: 12 } }, open ? '−' : '+')
				]),
				open ? React.createElement('div', {
					key: 'b',
					style: { padding: '0 12px 10px', borderTop: '1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08))' }
				}, children) : null
			])
		}

		// ---------- Overlay host ----------
		function DanmakuOverlay(props) {
			var t = props.t
			var useSessions = props.useSessions
			var toastHost = useToastHost()
			var showToast = toastHost.showToast
			// Let module-scope playSvga failures surface through the real toast UI.
			React.useEffect(function () { giftToastRef.fn = toastHost.showToast })
			var configState = React.useState(clampConfig(DEFAULTS))
			var config = configState[0]
			var setConfig = configState[1]
			var detailState = React.useState(null)
			var detail = detailState[0]
			var setDetail = detailState[1]
			var heatState = React.useState(0)
			var heat = heatState[0]
			var setHeat = heatState[1]
			var settingsOpenState = React.useState(false)
			var settingsOpen = settingsOpenState[0]
			var setSettingsOpen = settingsOpenState[1]
			var likedState = React.useState({})
			var likedMap = likedState[0]
			var setLikedMap = likedState[1]
			var hostRef = React.useRef(null)
			var rendererRef = React.useRef(null)
			var queueRef = React.useRef([])
			var lastSinceRef = React.useRef(Date.now())
			var lastUserMsgRef = React.useRef(0)
			var lastLlmAtRef = React.useRef(0)
			var areaRatioRef = React.useRef(DEFAULTS.areaRatio)
			var historyLoadedRef = React.useRef(null)
			var workPoolRef = React.useRef([])
			var lastEventAtRef = React.useRef(0)
			var configRef = React.useRef(config)
			configRef.current = config
			// Gift effect layer reads live giftMaxConcurrent from here.
			giftRuntime.configRef = configRef
			// Gift tip danmaku (todo 16) spawns through the active renderer.
			giftRuntime.rendererRef = rendererRef

			// --- display area editor ------------------------------------------------
			// popOpen is lifted out of ControlBall so the editor can hide the floating
			// window and hand it back in exactly the state it was opened from.
			var popOpenState = React.useState(false)
			var popOpen = popOpenState[0]
			var setPopOpen = popOpenState[1]
			// null = closed; otherwise the visibility snapshot taken when it opened
			var areaEditorState = React.useState(null)
			var areaEditor = areaEditorState[0]
			var setAreaEditor = areaEditorState[1]

			function openAreaEditor() {
				setAreaEditor({ restorePop: popOpen, restoreSettings: settingsOpen })
				setPopOpen(false)
				setSettingsOpen(false)
			}

			function closeAreaEditor() {
				var snap = areaEditor || {}
				setAreaEditor(null)
				setPopOpen(!!snap.restorePop)
				setSettingsOpen(!!snap.restoreSettings)
			}

			function applyArea(a) {
				patchLive({ displayArea: a })
				closeAreaEditor()
			}

			// Shrink the overlay root to the configured rect. The renderer's
			// ResizeObserver picks the new box up, so danmaku stay inside it.
			React.useEffect(function () {
				var el = hostRef.current
				if (!el) return
				var a = config.displayArea || { x: 0, y: 0, w: 1, h: 1 }
				el.style.left = (a.x * 100) + '%'
				el.style.top = (a.y * 100) + '%'
				el.style.right = 'auto'
				el.style.bottom = 'auto'
				el.style.width = (a.w * 100) + '%'
				el.style.height = (a.h * 100) + '%'
			}, [config])

			// Current session id (undefined on blank/initial page)
			var sessionId = null
			var sessionBlank = false
			try {
				if (useSessions) {
					sessionId = useSessions(function (s) { return s && s.current })
					sessionBlank = useSessions(function (s) {
						if (!s || !s.current) return true
						var rec = s.byId && s.byId[s.current]
						// blank/new-session records should not receive danmaku
						return !!(rec && rec.blank)
					})
				}
			} catch (e) {
				sessionId = null
				sessionBlank = true
			}
			var sessionIdRef = React.useRef(sessionId)
			sessionIdRef.current = sessionId
			var sessionBlankRef = React.useRef(sessionBlank)
			sessionBlankRef.current = sessionBlank

			function inSession() {
				return !!sessionIdRef.current && !sessionBlankRef.current
			}

			function enqueue(items, source) {
				var arr = (items || []).map(function (it) {
					return {
						content: it.content,
						source: it.source || source || 'preset',
						color: it.color || undefined,
						kind: it.kind || 'normal',
						at: it.at,
						tags: it.tags
					}
				}).filter(function (it) { return it.content && !isBlocked(it.content, configRef.current.blockedWords) })
				queueRef.current = queueRef.current.concat(arr)
			}

			/** Bilibili-style roulette sample without replacement into work pool */
			function rebuildWorkPool(poolItems) {
				var cfg = configRef.current
				var halfLife = cfg.halfLifeDays || 7
				var thr = cfg.matchThreshold != null ? cfg.matchThreshold : 0.35
				var now = Date.now()
				var scored = (poolItems || []).map(function (e) {
					var ageDays = (now - (e.at || now)) / 86400000
					var decay = Math.pow(0.5, ageDays / halfLife)
					var weight = Number(e.weight) || 1
					var likes = 1 + 0.15 * (Number(e.likes) || 0)
					var tags = e.tags || []
					var match = tags.length ? 0.7 : 0.9
					return { e: e, score: Math.max(0.01, decay * weight * likes * match) }
				})
				var pool = scored.slice()
				var picked = []
				var n = Math.min(pool.length, Math.max(8, cfg.historyReplayMax || 12))
				for (var i = 0; i < n && pool.length; i++) {
					var total = 0
					for (var j = 0; j < pool.length; j++) total += pool[j].score
					var r = Math.random() * total
					var idx = 0
					for (var k = 0; k < pool.length; k++) {
						r -= pool[k].score
						if (r <= 0) { idx = k; break }
					}
					picked.push(pool.splice(idx, 1)[0].e)
				}
				// mix in local presets
				var presets = sampleLocalPresets(cfg.presetPack, 6, cfg.blockedWords)
				workPoolRef.current = picked.map(function (e) {
					return { content: e.content, source: e.source || 'preset', tags: e.tags, at: e.at }
				}).concat(presets)
			}

			function drainQueue() {
				var renderer = rendererRef.current
				if (!renderer || !configRef.current.enabled || !inSession()) return
				if (queueRef.current.length === 0) return
				var item = queueRef.current.shift()
				renderer.spawn([{
					content: item.content,
					source: item.source,
					color: item.color,
					kind: item.kind,
					layout: item.kind === 'sc' ? 'top' : pickLayout(configRef.current.layoutWeights)
				}])
			}

			function spawnImmediate(list) {
				if (!rendererRef.current || !configRef.current.enabled || !inSession()) return
				rendererRef.current.spawn(list)
			}

			function likeDanmaku(content, id) {
				if (!inSession() || !content) return
				fetchJson('/api/danmaku/like', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ content: content, sessionId: sessionIdRef.current })
				}).then(function () {
					setLikedMap(function (m) {
						var n = {}
						for (var k in m) n[k] = m[k]
						n[id || content] = true
						return n
					})
					if (rendererRef.current && id) {
						var layer = rendererRef.current.getLayer && rendererRef.current.getLayer()
						if (layer) {
							var node = layer.querySelector('[data-id="' + id + '"]')
							if (node) node.dataset.liked = '1'
						}
					}
				}).catch(function () { /* ignore */ })
			}

			// Poll heat score
			React.useEffect(function () {
				if (!config.enabled) return
				var stopped = false
				var timer = setInterval(function () {
					if (stopped || !inSession()) return
					fetchJson('/api/danmaku/heat?window=30').then(function (d) {
						if (!stopped) setHeat(Number(d && d.heat) || 0)
					}).catch(function () { /* ignore */ })
				}, 2000)
				return function () {
					stopped = true
					clearInterval(timer)
				}
			}, [config.enabled, sessionId])

			function fireWelcome() {
				var cfg = configRef.current
				if (!cfg.welcomeOnEnter) return
				spawnImmediate([
					{ content: '欢迎进入围观间', source: 'preset', kind: 'normal', color: '#FB7299', layout: 'top' },
					{ content: '弹幕护体，围观开始', source: 'preset', kind: 'normal', layout: 'roll' }
				])
			}

			function fireRain(phrase) {
				var cfg = configRef.current
				if (!cfg.taskDoneRain) return
				var lines = [
					phrase || '任务完成！',
					'好耶',
					'这波稳了',
					'撒花',
					'太强了吧',
					'前方高能解除'
				]
				var n = Math.min(8, lines.length)
				for (var i = 0; i < n; i++) {
					;(function (text, delay) {
						setTimeout(function () {
							spawnImmediate([{
								content: text,
								source: 'preset',
								kind: 'rain',
								color: pickColor(configRef.current),
								layout: 'roll'
							}])
						}, delay)
					})(lines[i], i * 180)
				}
			}

			function fireScError(text) {
				var cfg = configRef.current
				if (!cfg.toolErrorSc) return
				var label = '工具报错：' + String(text || '出错了').slice(0, 20)
				spawnImmediate([{
					content: label,
					source: 'preset',
					kind: 'sc',
					color: '#FFFFFF',
					layout: 'top'
				}])
			}

			// Detail modal freezes only the clicked danmaku (Bilibili-like); others keep rolling.
			var detailHoldIdRef = React.useRef(null)
			React.useEffect(function () {
				var r = rendererRef.current
				var prevId = detailHoldIdRef.current
				if (prevId && r) {
					if (prevId === '*') {
						if (r.resumeAll) r.resumeAll()
					} else if (r.resumeOne) {
						r.resumeOne(prevId)
					}
					detailHoldIdRef.current = null
				}
				if (detail && detail.id && r) {
					if (r.pauseOne) {
						r.pauseOne(detail.id)
						detailHoldIdRef.current = detail.id
					} else if (r.pauseAll) {
						r.pauseAll()
						detailHoldIdRef.current = '*'
					}
				}
			}, [detail])

			// Session switch: drop on-screen items + queue; history reloads below
			React.useEffect(function () {
				queueRef.current = []
				if (rendererRef.current && rendererRef.current.clear) rendererRef.current.clear()
			}, [sessionId])

			// Load history + welcome when entering a non-blank session
			React.useEffect(function () {
				if (!sessionId || sessionBlank) return
				if (historyLoadedRef.current === sessionId) return
				historyLoadedRef.current = sessionId
				var sid = sessionId
				fetchJson('/api/danmaku/pool?sessionId=' + encodeURIComponent(sid)).then(function (data) {
					if (sessionIdRef.current !== sid) return
					var items = (data && data.items) || []
					enqueue(items.map(function (it) {
						return { content: it.content, source: it.source || 'preset' }
					}), 'preset')
				}).catch(function () { /* no history */ })
				setTimeout(function () {
					if (sessionIdRef.current === sid) fireWelcome()
				}, 350)
			}, [sessionId, sessionBlank])

			React.useEffect(function () {
				ensureStyles()
				var renderer = createRenderer(configRef.current && configRef.current.renderBackend)
				rendererRef.current = renderer
				if (hostRef.current) renderer.mount(hostRef.current)
				renderer.onHit(function (id, meta) {
					if (meta && meta.action === 'like') {
						likeDanmaku(meta.content, id)
						return
					}
					setDetail(meta)
				})
				try { window.__dshDanmaku = renderer } catch (e) { /* ignore */ }
				areaRatioRef.current = config.areaRatio
				fetchJson('/api/danmaku/presets').then(applyPresetStore).catch(function () {})

				function layout() {
					if (!hostRef.current) return
					var rect = hostRef.current.getBoundingClientRect()
					renderer.resize(rect.width || window.innerWidth, rect.height || window.innerHeight, areaRatioRef.current)
				}

				fetchJson('/api/danmaku/config').then(function (data) {
					var c = clampConfig(data && data.config)
					areaRatioRef.current = c.areaRatio
					setConfig(c)
					renderer.setConfig(c)
					renderer.setEnabled(c.enabled)
					layout()
				}).catch(function () {
					renderer.setConfig(config)
					layout()
				})

				var ro = null
				if (typeof ResizeObserver !== 'undefined' && hostRef.current) {
					ro = new ResizeObserver(layout)
					ro.observe(hostRef.current)
				}
				window.addEventListener('resize', layout)
				return function () {
					window.removeEventListener('resize', layout)
					if (ro) ro.disconnect()
					renderer.unmount()
				}
			}, [])

			React.useEffect(function () {
				if (!rendererRef.current) return
				rendererRef.current.setConfig(config)
				rendererRef.current.setEnabled(config.enabled)
				areaRatioRef.current = config.areaRatio
				if (hostRef.current) {
					var rect = hostRef.current.getBoundingClientRect()
					rendererRef.current.resize(rect.width || window.innerWidth, rect.height || window.innerHeight, config.areaRatio)
				}
			}, [config])

			// Recreate renderer when backend changes (settings save → config poll)
			React.useEffect(function () {
				var backend = config.renderBackend || 'dom'
				var prev = rendererRef.current
				if (prev && prev.kind === backend) return
				if (prev && prev.kind === 'webgl2' && (backend === 'webgl2' || backend === 'webgl2-main')) return
				if (prev && prev.kind === 'webgl2-worker' && backend === 'webgl2-worker') return
				if (prev) {
					try { prev.unmount() } catch (e) { /* ignore */ }
					rendererRef.current = null
				}
				if (!hostRef.current) return
				ensureStyles()
				var renderer = createRenderer(backend)
				rendererRef.current = renderer
				renderer.mount(hostRef.current)
				renderer.onHit(function (id, meta) {
					if (meta && meta.action === 'like') {
						likeDanmaku(meta.content, id)
						return
					}
					setDetail(meta)
				})
				try { window.__dshDanmaku = renderer } catch (e) { /* ignore */ }
				renderer.setConfig(config)
				renderer.setEnabled(config.enabled)
				var rect = hostRef.current.getBoundingClientRect()
				renderer.resize(rect.width || window.innerWidth, rect.height || window.innerHeight, config.areaRatio)
				if (detail) {
					if (renderer.pauseOne && detail.id) {
						renderer.pauseOne(detail.id)
						detailHoldIdRef.current = detail.id
					} else if (renderer.pauseAll) {
						renderer.pauseAll()
						detailHoldIdRef.current = '*'
					}
				}
			}, [config.renderBackend])

			// Page hidden → pause render loop / polls (resume on visible)
			React.useEffect(function () {
				function onVis() {
					var r = rendererRef.current
					if (!r) return
					if (document.visibilityState === 'hidden') {
						if (r.pauseLoop) r.pauseLoop()
					} else if (r.resumeLoop) {
						r.resumeLoop()
					}
				}
				document.addEventListener('visibilitychange', onVis)
				onVis()
				return function () {
					document.removeEventListener('visibilitychange', onVis)
				}
			}, [])

			// Ambient continuous stream (Bilibili-like) — only inside a session
			React.useEffect(function () {
				if (!config.enabled) return
				var stopped = false
				var timer = null
				var emojiCache = []

				function loadEmojiCache() {
					if (!configRef.current.emojiEnabled) return Promise.resolve([])
					return fetchJson('/api/danmaku/emojis').then(function (d) {
						emojiCache = (d && d.items) || []
					}).catch(function () { emojiCache = [] })
				}
				loadEmojiCache()

				function maybeSpawnEmoji() {
					if (!configRef.current.emojiEnabled) return false
					var p = Number(configRef.current.emojiTotalProb) || 0
					if (p <= 0 || Math.random() > p) return false
					if (!emojiCache.length) return false
					var total = 0
					for (var i = 0; i < emojiCache.length; i++) total += Number(emojiCache[i].weight) || 0
					if (total <= 0) return false
					var r = Math.random() * total
					var pick = emojiCache[0]
					for (var j = 0; j < emojiCache.length; j++) {
						r -= Number(emojiCache[j].weight) || 0
						if (r <= 0) { pick = emojiCache[j]; break }
					}
					if (!rendererRef.current) return false
					rendererRef.current.spawn([{
						content: pick.name || 'emoji',
						source: 'preset',
						kind: 'emoji',
						emojiUrl: pick.url,
						layout: 'roll'
					}])
					return true
				}

				function schedule() {
					if (stopped) return
					var dens = Math.max(1, Number(config.density) || 3)
					var minMs = Math.max(180, (config.ambientMinMs || 500) / Math.sqrt(dens))
					var maxMs = Math.max(minMs + 80, (config.ambientMaxMs || 1400) / Math.sqrt(dens))
					var span = maxMs - minMs
					var delay = minMs + Math.random() * Math.max(0, span)
					timer = setTimeout(function () {
						if (stopped) return
						if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
							schedule()
							return
						}
						// No session (blank page): do not spawn, do not clear
						if (!inSession()) {
							schedule()
							return
						}
						// Random gift dice (todo 20): reuses THIS ambient timer (no
						// second timer) and draws independently of the danmaku
						// ambient dice. Participates only when the danmaku master
						// switch is on AND in-session (plan todo-20 note); placed
						// below the session guard so gift tips never fire on the
						// blank/no-session page.
						maybeSpawnRandomGift()
						if (maybeSpawnEmoji()) {
							schedule()
							return
						}
						if (queueRef.current.length > 0) {
							drainQueue()
						} else if (workPoolRef.current.length > 0) {
							var wp = workPoolRef.current.shift()
							rendererRef.current.spawn([{
								content: wp.content,
								source: wp.source,
								color: undefined,
								layout: pickLayout(configRef.current.layoutWeights)
							}])
						} else {
							var cfg = configRef.current
							var dens = Math.max(1, Number(cfg.density) || 3)
							var n = dens >= 4 ? 2 : 1
							var items = sampleLocalPresets(cfg.presetPack, n, cfg.blockedWords)
							if (rendererRef.current) {
								rendererRef.current.spawn(items.map(function (it) {
									return {
										content: it.content,
										source: 'preset',
										color: undefined,
										layout: pickLayout(cfg.layoutWeights)
									}
								}))
							}
						}
						schedule()
					}, delay)
				}
				schedule()
				return function () {
					stopped = true
					if (timer) clearTimeout(timer)
				}
			}, [config.enabled, config.ambientMinMs, config.ambientMaxMs, config.presetPack, config.blockedWords, JSON.stringify(config.layoutWeights), sessionId])

			// Event bursts → queue (staggered by ambient drain)
			React.useEffect(function () {
				if (!config.enabled) return
				var stopped = false

				function handleTrigger(kind) {
					if (!inSession()) return
					var cfg = configRef.current
					var dens = Math.max(1, Number(cfg.density) || 3)
					var base = kind === 'task_done' ? 4 : kind === 'user_message' ? 3 : kind === 'reply_complete' ? 2 : 1
					var count = Math.min(12, Math.round(base * (0.6 + dens * 0.25)))
					fetchJson('/api/danmaku/preset-sample', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ event: kind, count: count, sessionId: sessionIdRef.current })
					}).then(function (data) {
						if (stopped) return
						var items = (data && data.items) || []
						if (!items.length) items = sampleLocalPresets(cfg.presetPack, count, cfg.blockedWords)
						enqueue(items, 'preset')
					}).catch(function () {
						if (!stopped) enqueue(sampleLocalPresets(cfg.presetPack, count, cfg.blockedWords), 'preset')
					})
				}

				function requestLlm(event) {
					if (!config.llmEnabled || !inSession()) return
					var model = String(configRef.current.llmModel || '').trim()
					if (!model || model === '-' || model === '—') return
					var now = Date.now()
					var gap = Math.max(3, Number(configRef.current.globalMinGapSec) || 5) * 1000
					if (configRef.current.wakeupType === 'smart' || !configRef.current.wakeupType) {
						gap = Math.max(gap, (Number(configRef.current.smartMinGapSec) || 8) * 1000)
					}
					// assistant text can arrive very fast — never let it thrash LLM
					if (event === 'reply_complete') gap = Math.max(gap, 12000)
					if (now - lastLlmAtRef.current < gap) return
					lastLlmAtRef.current = now
					lastEventAtRef.current = now
					fetchJson('/api/danmaku/generate', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ event: event, sessionId: sessionIdRef.current })
					}).then(function (data) {
						if (stopped) return
						enqueue((data && data.items) || [], data && data.source === 'ai' ? 'ai' : 'preset')
					}).catch(function () { /* silent */ })
				}

				function poll() {
					if (stopped) return
					if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
					fetchJson('/api/danmaku/triggers?since=' + lastSinceRef.current).then(function (data) {
						if (stopped) return
						var list = (data && data.triggers) || []
						if (list.length) lastSinceRef.current = data.now || Date.now()
						var kinds = {}
						list.forEach(function (tr) { kinds[tr.kind] = (kinds[tr.kind] || 0) + 1 })
						if (kinds.user_message) {
							var now = Date.now()
							lastEventAtRef.current = now
							if (now - lastUserMsgRef.current > 1200) {
								lastUserMsgRef.current = now
								handleTrigger('user_message')
								requestLlm('user_message')
								// rebuild work pool from this session's history
								fetchJson('/api/danmaku/pool?sessionId=' + encodeURIComponent(sessionIdRef.current || '')).then(function (d) {
									rebuildWorkPool((d && d.items) || [])
								}).catch(function () { rebuildWorkPool([]) })
							}
						}
						if (kinds.reply_complete || kinds.task_done || kinds.tool_call || kinds.tool_error || kinds.step || kinds.todo || kinds.warning || (kinds.thinking && configRef.current.thinkingAsActive !== false)) {
							lastEventAtRef.current = Date.now()
						}
						if (kinds.reply_complete) {
							handleTrigger('reply_complete')
							requestLlm('reply_complete')
						}
						if (kinds.task_done) {
							handleTrigger('task_done')
							fireRain('任务完成！')
							requestLlm('task_done')
						}
						if (kinds.tool_error) {
							var errTool = ''
							list.forEach(function (tr) {
								if (tr.kind === 'tool_error' && tr.meta && tr.meta.tool) errTool = tr.meta.tool
							})
							fireScError(errTool || '工具执行失败')
							if (configRef.current.toolcallOnErrorExtra) requestLlm('tool_error')
						}
						if (kinds.warning) {
							var warnText = '已达到输出 token 上限'
							list.forEach(function (tr) {
								if (tr.kind === 'warning' && tr.meta && tr.meta.warning) warnText = tr.meta.warning
							})
							fireScError(warnText)
							requestLlm('warning')
						}
						if (kinds.tool_call) handleTrigger('tool_call')
						// Long thinking: keep as activity so interval does not back off;
						// do not burst LLM on every chunk (host already throttles the trigger).
						if (kinds.thinking && configRef.current.thinkingAsActive !== false) {
							lastEventAtRef.current = Date.now()
						}
					}).catch(function () { /* host not ready */ })
				}

				var timer = setInterval(poll, POLL_MS)
				poll()
				return function () {
					stopped = true
					clearInterval(timer)
				}
			}, [config.enabled, config.llmEnabled, config.presetPack, config.blockedWords, sessionId])

			// Periodic LLM refresh + silence heartbeat (waker design)
			React.useEffect(function () {
				if (!config.enabled || !config.llmEnabled) return
				if (config.wakeupType === 'toolcall') return
				var model = String(config.llmModel || '').trim()
				if (!model || model === '-' || model === '—') return
				var stopped = false
				var backoffN = 0
				var timer = null
				var lastLlmCallAt = 0

				function scheduleNext() {
					if (stopped) return
					var cfg = configRef.current
					var base = Math.max(5, cfg.llmIntervalSec || 18) * 1000
					var silence = Date.now() - lastEventAtRef.current
					var delay = base
					var resetSec = Number(cfg.backoffResetSec) || 6
					var baseSec = Number(cfg.backoffBaseSec) || 12
					var maxSec = Number(cfg.backoffMaxSec) || 60
					var factor = Number(cfg.backoffFactor) || 1.5
					var backoffOn = cfg.backoffEnabled !== false && cfg.intervalOnlyWhenActive !== false
					if (backoffOn) {
						// Heartbeat: quiet → backoff; active (incl. thinking) → base interval
						if (silence < resetSec * 1000) {
							backoffN = 0
							delay = base
						} else {
							var hb = Math.min(maxSec, baseSec * Math.pow(factor, backoffN))
							delay = Math.max(base, hb * 1000)
							backoffN++
						}
					}
					timer = setTimeout(function () {
						if (stopped || !inSession()) {
							scheduleNext()
							return
						}
						// Rate limit: never LLM more often than global min gap
						var gap = Math.max(3, Number(configRef.current.globalMinGapSec) || 5) * 1000
						if (Date.now() - lastLlmCallAt < gap) {
							scheduleNext()
							return
						}
						lastLlmCallAt = Date.now()
						fetchJson('/api/danmaku/generate', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ event: silence > 6000 ? 'heartbeat' : 'interval', sessionId: sessionIdRef.current })
						}).then(function (data) {
							if (!stopped) enqueue((data && data.items) || [], data && data.source === 'ai' ? 'ai' : 'preset')
						}).catch(function () { /* silent */ })
						scheduleNext()
					}, delay)
				}
				scheduleNext()
				return function () {
					stopped = true
					if (timer) clearTimeout(timer)
				}
			}, [config.enabled, config.llmEnabled, config.llmIntervalSec, config.wakeupType, config.intervalOnlyWhenActive, sessionId])

			// Poll host config so settings-page saves apply to live overlay
			React.useEffect(function () {
				var stopped = false
				var timer = setInterval(function () {
					if (stopped) return
					if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
					fetchJson('/api/danmaku/config').then(function (data) {
						if (stopped) return
						var next = clampConfig(data && data.config)
						setConfig(function (prev) {
							if (JSON.stringify(prev) === JSON.stringify(next)) return prev
							return next
						})
					}).catch(function () { /* ignore */ })
				}, 2500)
				return function () {
					stopped = true
					clearInterval(timer)
				}
			}, [])

			// Anti-occlude
			React.useEffect(function () {
				if (!config.antiOcclude || !config.enabled) {
					if (rendererRef.current) rendererRef.current.setIdleAlpha(1)
					return
				}
				function update() {
					if (!rendererRef.current) return
					var sel = false
					try { sel = !!(window.getSelection && String(window.getSelection()).length > 0) } catch (e) { /* ignore */ }
					rendererRef.current.setIdleAlpha(sel ? Math.max(0.05, config.opacityIdle / Math.max(config.opacity, 0.01)) : 1)
				}
				document.addEventListener('selectionchange', update)
				return function () {
					document.removeEventListener('selectionchange', update)
					if (rendererRef.current) rendererRef.current.setIdleAlpha(1)
				}
			}, [config.antiOcclude, config.enabled, config.opacity, config.opacityIdle])

			function patchLive(partial) {
				var next = clampConfig(Object.assign({}, config, partial))
				setConfig(next)
				fetchJson('/api/danmaku/config', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ config: next })
				}).catch(function () { /* local still applies */ })
			}

			var modal = detail ? React.createElement('div', Object.assign({
				key: 'modal',
				className: 'dsh-danmaku-modal'
			}, backdropCloseProps(function () { setDetail(null) })), [
				React.createElement('div', {
					key: 'card',
					className: 'dsh-danmaku-modal-card',
					onClick: function (e) { e.stopPropagation() }
				}, [
					React.createElement('h3', { key: 'h' }, t('detailTitle')),
					React.createElement('div', { className: 'meta', key: 'm' }, [
						React.createElement('div', { key: 'c' }, '内容：' + detail.content),
						React.createElement('div', { key: 's' }, '来源：' + detail.source),
						React.createElement('div', { key: 'i' }, 'ID：' + detail.id),
						detail.at ? React.createElement('div', { key: 't' }, t('time') + '：' + new Date(detail.at).toLocaleString()) : null,
						(detail.tags && detail.tags.length)
							? React.createElement('div', { key: 'g' }, t('tags') + '：' + detail.tags.join(', '))
							: null
					]),
					React.createElement('div', { className: 'dsh-danmaku-modal-actions', key: 'a' }, [
						React.createElement('button', {
							key: 'like',
							className: 'dsh-danmaku-like',
							'data-on': likedMap[detail.id] ? '1' : '0',
							onClick: function () { likeDanmaku(detail.content, detail.id) }
						}, likedMap[detail.id] ? t('liked') : t('like')),
						React.createElement('button', {
							key: 'copy',
							onClick: function () {
								try { navigator.clipboard.writeText(detail.content) } catch (e) { /* ignore */ }
							}
						}, t('copy')),
						React.createElement('button', {
							key: 'block',
							onClick: function () {
								patchLive({ blockedWords: (config.blockedWords || []).concat([detail.content]) })
								setDetail(null)
							}
						}, t('block')),
						React.createElement('button', {
							key: 'rm',
							onClick: function () {
								if (rendererRef.current && detail.id && rendererRef.current.removeOne) {
									rendererRef.current.removeOne(detail.id)
								} else if (rendererRef.current) {
									var layer = rendererRef.current.getLayer && rendererRef.current.getLayer()
									if (layer) {
										var node = layer.querySelector('[data-id="' + detail.id + '"]')
										if (node) node.remove()
									}
								}
								if (detailHoldIdRef.current === detail.id) detailHoldIdRef.current = null
								setDetail(null)
							}
						}, t('remove')),
						React.createElement('button', { key: 'x', onClick: function () { setDetail(null) } }, t('close'))
					])
				])
			]) : null

			return React.createElement('div', { className: 'dsh-danmaku-root', ref: hostRef, 'data-interactive': config.interactive ? '1' : '0' }, [
				React.createElement(HeatBar, {
					key: 'heat',
					t: t,
					heat: heat,
					enabled: config.enabled && inSession() && config.showHeat !== false
				}),
				React.createElement(ControlBall, {
					key: 'ball',
					t: t,
					config: config,
					patchLive: patchLive,
					popOpen: popOpen,
					setPopOpen: setPopOpen,
					hidden: !!areaEditor,
					onOpenSettings: function () { setSettingsOpen(true) },
					onOpenAreaEditor: openAreaEditor
				}),
				modal,
				settingsOpen ? React.createElement(DanmakuSettingsModal, {
					key: 'settings',
					t: t,
					showToast: showToast,
					onOpenAreaEditor: openAreaEditor,
					onClose: function () { setSettingsOpen(false) }
				}) : null,
				areaEditor ? React.createElement(AreaEditor, {
					key: 'areaeditor',
					t: t,
					hostRef: hostRef,
					initialArea: config.displayArea || { x: 0, y: 0, w: 1, h: 1 },
					onApply: applyArea,
					onCancel: closeAreaEditor
				}) : null,
				React.createElement(ToastContainer, {
					key: 'toasts',
					toasts: toastHost.toasts,
					onClose: toastHost.closeToast,
					onExtend: toastHost.extendToast
				})
			])
		}

		// ---------- plugin entry ----------
		function apply(ctx) {
			ensureStyles()
			var locale = ctx.get ? ctx.get('locale') : null
			var tBound = null
			if (locale) {
				try {
					if (locale.register) {
						var reg = locale.register('settings.danmaku', DICTS)
						if (typeof ctx.effect === 'function') ctx.effect(function () { return reg })
					}
					if (typeof locale.bind === 'function') {
						tBound = locale.bind('settings.danmaku')
					}
				} catch (e) { /* fallback below */ }
			}
			if (!tBound) tBound = tFactory(locale)

			var slots = ctx.get ? ctx.get('slots') : ctx.slots
			if (!slots) return
			var effect = typeof ctx.effect === 'function' ? ctx.effect : function (fn) { return fn() }

			// Conversation overlay
			effect(function () {
				return slots.inject('shell.overlay', function () {
					return slots.register(
						{ name: 'shell.overlay', id: 'dsh-danmaku-layer', order: 20 },
						function (props) {
							return React.createElement(DanmakuOverlay, {
								t: (props && props.t) || tBound,
								useSessions: props && props.useSessions
							})
						}
					)
				})
			})

			// Settings live in the large modal opened from the floating ball
		}

		exports.apply = apply
		exports.inject = ['slots', 'locale']
		return module.exports
	}
})
