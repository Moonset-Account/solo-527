extends Control

const TUTORIAL_PAGES := [
	{
		"title": "🎯 游戏目标",
		"sections": [
			"在有限的回合数内，安排社团成员完成布展、宣传和接待任务。",
			"通过完成任务提升活动【满意度】，达标即可获得胜利！",
			"注意：失败条件是活动结束时满意度不足，而非角色阵亡。",
		],
		"key_tips": ["满意度达标 = 胜利", "回合用尽 = 结算"],
	},
	{
		"title": "🧭 基础操作",
		"sections": [
			"【点击角色】选中成员，查看其行动点(AP)和技能。",
			"【点击高亮格子】移动角色（每移动1格消耗1点移动力，基于move属性）。",
			"【移动到任务格】自动执行对应任务，消耗1 AP并按属性推进进度。",
			"【空格 / 结束回合按钮】结束当前回合，所有角色AP重置。",
		],
		"key_tips": ["WASD / 方向键：移动光标", "鼠标点击：主要操作方式"],
	},
	{
		"title": "👥 角色与属性",
		"sections": [
			"每名角色拥有不同属性：布展🎪 / 宣传📣 / 接待🤝 / 移动👟。",
			"在对应任务格执行任务时，属性值就是推进的进度点数。",
			"属性越高，单次执行效率越高！合理安排角色到对应岗位！",
			"行动点(AP)：每回合开始恢复满，用于移动+任务+技能。",
		],
		"key_tips": ["苏设计 → 布展", "陈宣传 → 宣传", "何接待 → 接待"],
	},
	{
		"title": "✨ 技能系统",
		"sections": [
			"每名角色拥有2个独特技能，使用时消耗AP，并有冷却回合。",
			"技能类型包括：任务加速、全局增益、队友恢复、机动支援等。",
			"点击角色后点【技能】按钮，选择目标格/队友/自身使用。",
			"灵活使用技能能大幅缩短通关回合数！",
		],
		"key_tips": ["技能有冷却，规划好时机", "全局技能收益最高"],
	},
	{
		"title": "📜 剧情事件",
		"sections": [
			"游戏中会随机触发剧情事件（暴雨、嘉宾、媒体采访等）。",
			"事件可能带来增益或减益，做好心理准备！",
			"事件触发时有弹窗提示，说明其影响。",
			"应对策略：分散风险，同时推进多个任务以免被单一事件打击。",
		],
		"key_tips": ["事件弹窗可关闭", "好事件要把握，坏事件可分散风险"],
	},
	{
		"title": "🏆 胜利与奖励",
		"sections": [
			"战斗结束后进入结算界面，显示详细战绩。",
			"胜利会解锁下一关，并记录最高满意度分数。",
			"失败可选择重试关卡或返回菜单。",
			"想挑战更高分？用更少回合、更多技能奖励、完美完成所有任务！",
		],
		"key_tips": ["失败≠GameOver，可重试", "高分可解锁成就感"],
	},
]

var _current_page: int = 0
var _page_title: Label
var _content_vbox: VBoxContainer
var _tips_hbox: HBoxContainer
var _page_indicator: Label
var _button_prev: Button
var _button_next: Button
var _button_back: Button

func _ready() -> void:
	_build_ui()
	_render_page()
	DebugLog.log_info("教程界面加载, 共 %d 页" % TUTORIAL_PAGES.size())
	SaveSystem.mark_tutorial_seen()

func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.09, 0.11, 0.18)
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	add_child(bg)

	var main_panel := PanelContainer.new()
	main_panel.anchor_left = 0.5
	main_panel.anchor_top = 0.5
	main_panel.anchor_right = 0.5
	main_panel.anchor_bottom = 0.5
	main_panel.offset_left = -500
	main_panel.offset_top = -320
	main_panel.offset_right = 500
	main_panel.offset_bottom = 320
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.15, 0.18, 0.28)
	style.border_width_left = 2
	style.border_width_top = 2
	style.border_width_right = 2
	style.border_width_bottom = 2
	style.border_color = Color(0.4, 0.6, 0.9)
	style.corner_radius_top_left = 12
	style.corner_radius_top_right = 12
	style.corner_radius_bottom_left = 12
	style.corner_radius_bottom_right = 12
	main_panel.add_theme_stylebox_override("panel", style)
	add_child(main_panel)

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 28)
	margin.add_theme_constant_override("margin_right", 28)
	margin.add_theme_constant_override("margin_top", 24)
	margin.add_theme_constant_override("margin_bottom", 24)
	main_panel.add_child(margin)

	var main_vbox := VBoxContainer.new()
	margin.add_child(main_vbox)

	var header := HBoxContainer.new()
	main_vbox.add_child(header)

	_page_title = Label.new()
	_page_title.text = ""
	_page_title.add_theme_font_size_override("font_size", 28)
	_page_title.add_theme_color_override("font_color", Color(0.8, 0.9, 1.0))
	_page_title.size_flags_horizontal = 3
	header.add_child(_page_title)

	_page_indicator = Label.new()
	_page_indicator.text = ""
	_page_indicator.add_theme_font_size_override("font_size", 16)
	_page_indicator.add_theme_color_override("font_color", Color(0.6, 0.7, 0.85))
	header.add_child(_page_indicator)

	var sep := HSeparator.new()
	sep.add_theme_color_override("separator_color", Color(0.3, 0.4, 0.6))
	sep.custom_minimum_size = Vector2(0, 12)
	main_vbox.add_child(sep)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = 3
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	main_vbox.add_child(scroll)

	_content_vbox = VBoxContainer.new()
	_content_vbox.size_flags_horizontal = 3
	_content_vbox.add_theme_constant_override("separation", 10)
	scroll.add_child(_content_vbox)

	_tips_hbox = HBoxContainer.new()
	_tips_hbox.custom_minimum_size = Vector2(0, 56)
	_tips_hbox.add_theme_constant_override("separation", 10)
	main_vbox.add_child(_tips_hbox)

	var footer := HBoxContainer.new()
	main_vbox.add_child(footer)

	_button_back = Button.new()
	_button_back.text = "← 返回菜单"
	_button_back.custom_minimum_size = Vector2(140, 44)
	_button_back.pressed.connect(_on_back)
	footer.add_child(_button_back)

	var footer_spacer := Control.new()
	footer_spacer.size_flags_horizontal = 3
	footer.add_child(footer_spacer)

	_button_prev = Button.new()
	_button_prev.text = "上一页"
	_button_prev.custom_minimum_size = Vector2(120, 44)
	_button_prev.pressed.connect(_on_prev)
	footer.add_child(_button_prev)

	_button_next = Button.new()
	_button_next.text = "下一页"
	_button_next.custom_minimum_size = Vector2(120, 44)
	_button_next.pressed.connect(_on_next)
	footer.add_child(_button_next)

func _render_page() -> void:
	var page: Dictionary = TUTORIAL_PAGES[_current_page]
	_page_title.text = page["title"]
	_page_indicator.text = "第 %d / %d 页" % [_current_page + 1, TUTORIAL_PAGES.size()]

	for c in _content_vbox.get_children():
		c.queue_free()
	for section in page["sections"]:
		var item := _build_content_item(section)
		_content_vbox.add_child(item)
	for c in _tips_hbox.get_children():
		c.queue_free()
	for tip in page["key_tips"]:
		var pill := PanelContainer.new()
		var style2 := StyleBoxFlat.new()
		style2.bg_color = Color(0.25, 0.35, 0.55)
		style2.corner_radius_top_left = 8
		style2.corner_radius_top_right = 8
		style2.corner_radius_bottom_left = 8
		style2.corner_radius_bottom_right = 8
		pill.add_theme_stylebox_override("panel", style2)
		var m := MarginContainer.new()
		m.add_theme_constant_override("margin_left", 10)
		m.add_theme_constant_override("margin_right", 10)
		m.add_theme_constant_override("margin_top", 6)
		m.add_theme_constant_override("margin_bottom", 6)
		pill.add_child(m)
		var l := Label.new()
		l.text = "💡  " + tip
		l.add_theme_font_size_override("font_size", 13)
		l.add_theme_color_override("font_color", Color(1.0, 1.0, 1.0))
		m.add_child(l)
		_tips_hbox.add_child(pill)

	_button_prev.disabled = _current_page == 0
	if _current_page == TUTORIAL_PAGES.size() - 1:
		_button_next.text = "完成 ✓"
	else:
		_button_next.text = "下一页 →"

func _build_content_item(text: String) -> Control:
	var hb := HBoxContainer.new()
	hb.size_flags_horizontal = 3
	var dot := Label.new()
	dot.text = "▸"
	dot.add_theme_font_size_override("font_size", 18)
	dot.add_theme_color_override("font_color", Color(0.5, 0.8, 1.0))
	dot.custom_minimum_size = Vector2(20, 0)
	hb.add_child(dot)
	var content := Label.new()
	content.text = text
	content.add_theme_font_size_override("font_size", 15)
	content.add_theme_color_override("font_color", Color(0.9, 0.92, 0.98))
	content.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content.size_flags_horizontal = 3
	hb.add_child(content)
	return hb

func _on_prev() -> void:
	if _current_page > 0:
		_current_page -= 1
		AudioManager.play_sfx("select")
		_render_page()

func _on_next() -> void:
	if _current_page < TUTORIAL_PAGES.size() - 1:
		_current_page += 1
		AudioManager.play_sfx("select")
		_render_page()
	else:
		_on_back()

func _on_back() -> void:
	AudioManager.play_sfx("click")
	GameState.goto_main_menu()
