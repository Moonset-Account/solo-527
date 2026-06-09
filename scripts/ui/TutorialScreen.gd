extends Control

signal closed()

var overlay: ColorRect
var panel: PanelContainer
var page_idx: int = 0
var tutorial_pages: Array = []

func _ready():
	AudioManager.play_sfx("dialog")
	tutorial_pages = [
		{
			"title": "📚 第1页：游戏目标",
			"content": "社团活动战术棋\n\n你的目标是在有限的回合内，指挥社团成员完成布展 🎪、宣传 📣 和接待 🤝 三类任务，累积足够的【满意度】即可获胜。\n\n如果满意度降到最低线以下，或者回合用尽但目标未达成，则活动失败。"
		},
		{
			"title": "🎮 第2页：基础操作",
			"content": "• 点击角色 → 选中\n• 蓝色高亮格子 → 可以移动（消耗行动点）\n• 站在任务旁边 → 点击【工作】按钮开始任务\n• 按 E 键或【结束回合】按钮 → 结束当前回合\n\n快捷键：WASD/方向键 视角, 空格确认, Esc取消, 1/2/3技能"
		},
		{
			"title": "🎲 第3页：行动点与属性",
			"content": "每位成员每回合拥有一定行动点(AP)。\n移动1格消耗1AP，工作1次消耗1AP，技能消耗各不同。\n\n不同成员擅长不同任务：\n🎪 布展属性高 → 布置展板快速\n📣 宣传属性高 → 派发传单给力\n🤝 接待属性高 → 嘉宾接待优秀\n\n站在任务格子上工作效率最高（×1.5），相邻格子×1.2"
		},
		{
			"title": "✨ 第4页：角色技能",
			"content": "每位角色有 3 个独特技能（按 1 2 3 使用）：\n\n• 会长：领导型，恢复队友AP、立即完成任务\n• 设计：创意型，布展翻倍、放置海报\n• 宣传：行动型，大量推进宣传、额外AP\n• 接待：亲和型，满意度提升、士气大增\n\n合理安排技能时机，是过关关键！"
		},
		{
			"title": "⚡ 第5页：随机事件",
			"content": "游戏中会随机出现【事件】弹窗，影响整个活动走向：\n\n🟢 有利事件：前辈帮忙、媒体采访、高潮时刻\n🟡 选择事件：参观团、下雨、校长参观\n🔴 不利事件：雨天干扰、突发状况\n\n认真选择应对方式，甚至可能扭转战局！"
		},
		{
			"title": "💡 最后：策略建议",
			"content": "✦ 合理分配任务：让擅长的人做擅长的事\n✦ 前期集中推进一两个任务拿奖励满意度\n✦ 关键节点使用技能（例如接近回合末）\n✦ 注意任务格子站位：直接站上去效率最高\n✦ 失败后按 🔄 重试，数值配置在 data/ 下可自由调整\n\n祝你活动圆满成功！🎉"
		}
	]
	_build_ui()

func _build_ui():
	mouse_filter = Control.MOUSE_FILTER_STOP
	set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay = ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.65)
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(overlay)
	overlay.modulate.a = 0
	var ft: Tween = create_tween()
	ft.tween_property(overlay, "modulate:a", 1.0, 0.2)
	var center: CenterContainer = CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(center)
	panel = PanelContainer.new()
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = Color(0.08, 0.1, 0.22)
	sb.corner_radius_top_left = 16
	sb.corner_radius_top_right = 16
	sb.corner_radius_bottom_left = 16
	sb.corner_radius_bottom_right = 16
	sb.content_margin_left = 36
	sb.content_margin_right = 36
	sb.content_margin_top = 24
	sb.content_margin_bottom = 24
	sb.border_width_left = 2
	sb.border_width_right = 2
	sb.border_width_top = 2
	sb.border_width_bottom = 2
	sb.border_color = Color(0.4, 0.85, 0.95)
	panel.add_theme_stylebox_override("panel", sb)
	center.add_child(panel)
	var mv: VBoxContainer = VBoxContainer.new()
	mv.add_theme_constant_override("separation", 16)
	mv.custom_minimum_size = Vector2(680, 520)
	panel.add_child(mv)
	var title: Label = Label.new()
	title.name = "tutorial_title"
	title.text = "📚 游戏教程"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 30)
	title.modulate = Color(1, 0.9, 0.5)
	mv.add_child(title)
	var content_lbl: Label = Label.new()
	content_lbl.name = "tutorial_content"
	content_lbl.text = ""
	content_lbl.add_theme_font_size_override("font_size", 17)
	content_lbl.modulate = Color(0.93, 0.96, 1.0)
	content_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
	content_lbl.size_flags_vertical = Control.SIZE_EXPAND_FILL
	content_lbl.custom_minimum_size = Vector2(0, 360)
	mv.add_child(content_lbl)
	var page_indicator: Label = Label.new()
	page_indicator.name = "tutorial_pages"
	page_indicator.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	page_indicator.add_theme_font_size_override("font_size", 14)
	page_indicator.modulate = Color(0.7, 0.8, 0.95)
	mv.add_child(page_indicator)
	var btn_h: HBoxContainer = HBoxContainer.new()
	btn_h.alignment = BoxContainer.ALIGNMENT_CENTER
	btn_h.add_theme_constant_override("separation", 14)
	mv.add_child(btn_h)
	var prev: StyledButton = StyledButton.new("◀ 上一页", Color(0.3, 0.3, 0.5), Color(0.45, 0.45, 0.65))
	prev.name = "btn_prev"
	prev.custom_minimum_size = Vector2(170, 48)
	prev.pressed.connect(_prev_page)
	btn_h.add_child(prev)
	var next: StyledButton = StyledButton.new("下一页 ▶", Color(0.2, 0.4, 0.65), Color(0.35, 0.55, 0.8))
	next.name = "btn_next"
	next.custom_minimum_size = Vector2(170, 48)
	next.pressed.connect(_next_page)
	btn_h.add_child(next)
	var close: StyledButton = StyledButton.new("关闭教程", Color(0.22, 0.5, 0.3), Color(0.35, 0.65, 0.45))
	close.custom_minimum_size = Vector2(170, 48)
	close.pressed.connect(_on_close)
	btn_h.add_child(close)
	_update_page()

func _update_page():
	page_idx = clamp(page_idx, 0, tutorial_pages.size() - 1)
	var t_lbl: Label = get_node_or_null("*/tutorial_title")
	var c_lbl: Label = get_node_or_null("*/tutorial_content")
	var p_lbl: Label = get_node_or_null("*/tutorial_pages")
	var prev_btn: StyledButton = get_node_or_null("*/btn_prev")
	var next_btn: StyledButton = get_node_or_null("*/btn_next")
	if t_lbl:
		t_lbl.text = tutorial_pages[page_idx].get("title", "")
	if c_lbl:
		c_lbl.text = tutorial_pages[page_idx].get("content", "")
	if p_lbl:
		p_lbl.text = "- 第 %d / %d 页 -" % [page_idx + 1, tutorial_pages.size()]
	if prev_btn:
		prev_btn.disabled = page_idx == 0
	if next_btn:
		if page_idx == tutorial_pages.size() - 1:
			next_btn.set_text("✓ 已到最后一页")
			next_btn.disabled = true
		else:
			next_btn.set_text("下一页 ▶")
			next_btn.disabled = false

func _prev_page():
	AudioManager.play_sfx("click")
	page_idx = max(0, page_idx - 1)
	_update_page()

func _next_page():
	AudioManager.play_sfx("click")
	page_idx = min(tutorial_pages.size() - 1, page_idx + 1)
	_update_page()

func _on_close():
	AudioManager.play_sfx("click")
	var tw: Tween = create_tween()
	tw.tween_property(overlay, "modulate:a", 0.0, 0.2)
	tw.tween_callback(queue_free)
	tw.tween_callback(func (): emit_signal("closed"))

func _input(event: InputEvent):
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_ESCAPE:
			_on_close()
			get_viewport().set_input_as_handled()
		elif event.keycode in [KEY_LEFT, KEY_PAGE_UP]:
			_prev_page()
			get_viewport().set_input_as_handled()
		elif event.keycode in [KEY_RIGHT, KEY_PAGE_DOWN, KEY_SPACE]:
			if page_idx < tutorial_pages.size() - 1:
				_next_page()
			get_viewport().set_input_as_handled()
