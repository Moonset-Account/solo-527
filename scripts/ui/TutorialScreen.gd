extends Control

signal tutorial_completed()
signal back_requested()

var vb_main: VBoxContainer
var title_label: Label
var content_rich: RichTextLabel
var steps_container: VBoxContainer
var step_indicators: HBoxContainer
var current_step: int = 0
var total_steps: int = 6
var next_btn: Button
var prev_btn: Button
var skip_btn: Button
var start_btn: Button
var step_dots: Array = []
var anim_tween: Tween

const TUTORIAL_STEPS = [
	{
		"title": "📚 欢迎来到档案室",
		"content": "你是一名档案管理员，你的任务是整理历史档案。\n\n通过将散落的信件、照片和档案卡按时间顺序排列，还原事件的真相。",
		"icon": "📋"
	},
	{
		"title": "🖱 拖拽排序",
		"content": "[b]核心操作：[/b]按住鼠标左键拖动卡片，将它们放到时间线上正确的位置。\n\n时间线从左到右代表[color=yellow]时间由早到晚[/color]，最左侧是最早发生的事件。\n\n提示：仔细阅读每张卡片上的日期线索！",
		"icon": "📅"
	},
	{
		"title": "🏷 标签系统",
		"content": "双击卡片可以为它添加合适的标签。\n\n标签可以是[color=cyan]类别[/color]（信件/照片/公文）、[color=cyan]季节[/color]或[color=cyan]主题[/color]。\n\n正确的标签会为你带来额外分数。",
		"icon": "🏷"
	},
	{
		"title": "🔗 证据关联",
		"content": "有些卡片之间存在因果关系，使用[color=yellow]关联面板[/color]将它们连接起来。\n\n例如：一封威胁信 →  一封给友人的预警信\n\n找出正确的关联可以获得奖励分数。",
		"icon": "🔗"
	},
	{
		"title": "💡 分层提示",
		"content": "如果推理遇到困难，可以按 [color=yellow]H[/color] 键或点击提示按钮。\n\n提示分为[color=yellow]三个级别[/color]，由浅入深：\n  • 级别1：给出方向建议\n  • 级别2：给出部分线索\n  • 级别3：给出答案\n\n注意：使用提示会扣除一定分数。",
		"icon": "💡"
	},
	{
		"title": "🎯 评分与目标",
		"content": "[b]最终评分[/b]由以下因素组成：\n  ✓ 时间线正确性（每张卡片）\n  ✓ 标签准确度\n  ✓ 证据关联度\n  ✓ 用时奖励\n  ✗ 使用提示的惩罚\n  ✗ 重复尝试的惩罚\n\n评价等级从低到高：D → C → B → A → [color=gold]S[/color]\n\n准备好接受挑战了吗？",
		"icon": "🏆"
	}
]

func _ready() -> void:
	_setup_screen()
	_build_steps()
	_show_step(0)

func _setup_screen() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var bg = ColorRect.new()
	bg.color = Color(0.08, 0.08, 0.12, 1)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var center = CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	center.offset_left = 60
	center.offset_top = 40
	center.offset_right = -60
	center.offset_bottom = -40
	add_child(center)
	var main_panel = Panel.new()
	main_panel.custom_minimum_size = Vector2(900, 600)
	var main_sb = StyleBoxFlat.new()
	main_sb.bg_color = Color(0.1, 0.1, 0.14, 0.98)
	main_sb.border_color = Color(0.35, 0.5, 0.7, 0.5)
	main_sb.border_width_left = 2
	main_sb.border_width_right = 2
	main_sb.border_width_top = 2
	main_sb.border_width_bottom = 2
	main_sb.corner_radius_top_left = 20
	main_sb.corner_radius_top_right = 20
	main_sb.corner_radius_bottom_left = 20
	main_sb.corner_radius_bottom_right = 20
	main_sb.shadow_color = Color(0, 0, 0, 0.5)
	main_sb.shadow_size = 16
	main_sb.content_margin_left = 40
	main_sb.content_margin_right = 40
	main_sb.content_margin_top = 32
	main_sb.content_margin_bottom = 32
	main_panel.add_theme_stylebox_override("panel", main_sb)
	center.add_child(main_panel)
	vb_main = VBoxContainer.new()
	vb_main.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vb_main.offset_left = 40
	vb_main.offset_top = 32
	vb_main.offset_right = -40
	vb_main.offset_bottom = -32
	vb_main.add_theme_constant_override("separation", 16)
	main_panel.add_child(vb_main)
	title_label = Label.new()
	title_label.text = ""
	title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title_label.add_theme_font_size_override("font_size", 32)
	title_label.add_theme_color_override("font_color", Color(0.9, 0.92, 0.98, 1))
	title_label.custom_minimum_size.y = 56
	vb_main.add_child(title_label)
	step_indicators = HBoxContainer.new()
	step_indicators.custom_minimum_size.y = 20
	step_indicators.alignment = BoxContainer.ALIGNMENT_CENTER
	step_indicators.add_theme_constant_override("separation", 10)
	vb_main.add_child(step_indicators)
	for i in range(total_steps):
		var dot = ColorRect.new()
		dot.custom_minimum_size = Vector2(32, 6)
		dot.color = Color(0.3, 0.3, 0.4, 1)
		dot.name = "dot_%d" % i
		step_indicators.add_child(dot)
		step_dots.append(dot)
	var sep = HSeparator.new()
	sep.custom_minimum_size.y = 8
	vb_main.add_child(sep)
	content_rich = RichTextLabel.new()
	content_rich.bbcode_enabled = true
	content_rich.scroll_active = true
	content_rich.fit_content = false
	content_rich.size_flags_vertical = Control.SIZE_EXPAND_FILL
	content_rich.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content_rich.add_theme_font_size_override("normal_font_size", 18)
	content_rich.add_theme_color_override("default_color", Color(0.85, 0.85, 0.92, 1))
	var content_sb = StyleBoxFlat.new()
	content_sb.bg_color = Color(0.13, 0.13, 0.18, 1)
	content_sb.corner_radius_top_left = 12
	content_sb.corner_radius_top_right = 12
	content_sb.corner_radius_bottom_left = 12
	content_sb.corner_radius_bottom_right = 12
	content_sb.content_margin_left = 24
	content_sb.content_margin_right = 24
	content_sb.content_margin_top = 20
	content_sb.content_margin_bottom = 20
	content_rich.add_theme_stylebox_override("normal", content_sb)
	vb_main.add_child(content_rich)
	var bottom_row = HBoxContainer.new()
	bottom_row.custom_minimum_size.y = 52
	bottom_row.add_theme_constant_override("separation", 12)
	vb_main.add_child(bottom_row)
	var sp_l = Control.new()
	sp_l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bottom_row.add_child(sp_l)
	skip_btn = Button.new()
	skip_btn.text = "跳过教程"
	skip_btn.custom_minimum_size = Vector2(130, 44)
	skip_btn.add_theme_font_size_override("font_size", 14)
	skip_btn.pressed.connect(_on_skip)
	bottom_row.add_child(skip_btn)
	prev_btn = Button.new()
	prev_btn.text = "◀ 上一步"
	prev_btn.custom_minimum_size = Vector2(130, 44)
	prev_btn.add_theme_font_size_override("font_size", 14)
	prev_btn.disabled = true
	prev_btn.pressed.connect(_on_prev)
	bottom_row.add_child(prev_btn)
	next_btn = Button.new()
	next_btn.text = "下一步 ▶"
	next_btn.custom_minimum_size = Vector2(130, 44)
	next_btn.add_theme_font_size_override("font_size", 14)
	next_btn.pressed.connect(_on_next)
	bottom_row.add_child(next_btn)
	start_btn = Button.new()
	start_btn.text = "开始游戏！"
	start_btn.custom_minimum_size = Vector2(150, 44)
	start_btn.add_theme_font_size_override("font_size", 15)
	var start_sb = StyleBoxFlat.new()
	start_sb.bg_color = Color(0.2, 0.65, 0.35, 1)
	start_sb.corner_radius_top_left = 8
	start_sb.corner_radius_top_right = 8
	start_sb.corner_radius_bottom_left = 8
	start_sb.corner_radius_bottom_right = 8
	start_btn.add_theme_stylebox_override("normal", start_sb)
	start_btn.add_theme_color_override("font_color", Color.WHITE)
	start_btn.visible = false
	start_btn.pressed.connect(_on_start)
	bottom_row.add_child(start_btn)

func _build_steps() -> void:
	total_steps = TUTORIAL_STEPS.size()

func _show_step(idx: int) -> void:
	current_step = clamp(idx, 0, total_steps - 1)
	var step: Dictionary = TUTORIAL_STEPS[current_step]
	title_label.text = step["title"]
	content_rich.text = "\n" + step["content"]
	for i in range(step_dots.size()):
		if step_dots[i]:
			var c: ColorRect = step_dots[i]
			if i < current_step:
				c.color = Color(0.3, 0.7, 0.9, 0.5)
			elif i == current_step:
				c.color = Color(0.3, 0.75, 1.0, 1)
			else:
				c.color = Color(0.3, 0.3, 0.4, 1)
	prev_btn.disabled = current_step == 0
	if current_step >= total_steps - 1:
		next_btn.visible = false
		start_btn.visible = true
	else:
		next_btn.visible = true
		start_btn.visible = false
	_animate_step_transition()

func _animate_step_transition() -> void:
	if anim_tween:
		anim_tween.kill()
	content_rich.modulate.a = 0.0
	content_rich.position.y = 20
	title_label.modulate.a = 0.0
	anim_tween = create_tween()
	anim_tween.set_parallel(true)
	anim_tween.tween_property(content_rich, "modulate:a", 1.0, 0.25 * GameManager.animation_speed)
	anim_tween.tween_property(content_rich, "position:y", 0.0, 0.3 * GameManager.animation_speed).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	anim_tween.tween_property(title_label, "modulate:a", 1.0, 0.2 * GameManager.animation_speed)

func _on_next() -> void:
	AudioManager.play_ui_sound("ui_click")
	_show_step(current_step + 1)

func _on_prev() -> void:
	AudioManager.play_ui_sound("ui_click")
	_show_step(current_step - 1)

func _on_skip() -> void:
	AudioManager.play_ui_sound("ui_click")
	emit_signal("tutorial_completed")

func _on_start() -> void:
	AudioManager.play_ui_sound("ui_click")
	emit_signal("tutorial_completed")

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		match event.keycode:
			KEY_RIGHT, KEY_ENTER, KEY_SPACE:
				if current_step < total_steps - 1:
					_on_next()
				else:
					_on_start()
			KEY_LEFT:
				if current_step > 0:
					_on_prev()
			KEY_ESCAPE:
				_on_skip()
