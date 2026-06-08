extends Control

var _desc_label: Label
var _reward_label: Label
var _level_buttons: Array = []
var _hovered_level: int = -1

func _ready() -> void:
	_build_ui()
	print("[START_MENU] _ready done, levels count: ", LevelDatabase.get_all_levels().size())

func _build_ui() -> void:
	var bg = ColorRect.new()
	bg.color = Color("#1a1a2e")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)

	var root = HBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_theme_constant_override("separation", 0)
	add_child(root)

	var left_panel = VBoxContainer.new()
	left_panel.custom_minimum_size = Vector2(800, 0)
	left_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left_panel.alignment = BoxContainer.ALIGNMENT_CENTER
	left_panel.add_theme_constant_override("separation", 8)
	root.add_child(left_panel)

	var spacer_top = Control.new()
	spacer_top.size_flags_vertical = Control.SIZE_EXPAND_FILL
	left_panel.add_child(spacer_top)

	var title = Label.new()
	title.text = "博物馆卡牌修复战"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 44)
	title.add_theme_color_override("font_color", Color.WHITE)
	left_panel.add_child(title)

	var subtitle = Label.new()
	subtitle.text = "Museum Card Restoration"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 20)
	subtitle.add_theme_color_override("font_color", Color("#667799"))
	left_panel.add_child(subtitle)

	var spacer_title = Control.new()
	spacer_title.custom_minimum_size = Vector2(0, 20)
	left_panel.add_child(spacer_title)

	var level_vbox = VBoxContainer.new()
	level_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	level_vbox.add_theme_constant_override("separation", 8)
	left_panel.add_child(level_vbox)

	var levels = LevelDatabase.get_all_levels()
	for level_data in levels:
		var btn_container = HBoxContainer.new()
		btn_container.alignment = BoxContainer.ALIGNMENT_CENTER
		level_vbox.add_child(btn_container)

		var btn = Button.new()
		var level_id = int(level_data.get("id", 0))
		var unlocked = level_id <= GameManager.max_unlocked_level

		if unlocked:
			btn.text = "  第" + str(level_id) + "章: " + str(level_data.get("name", "")) + "  "
			btn.custom_minimum_size = Vector2(360, 44)
			btn.add_theme_font_size_override("font_size", 16)
			btn.pressed.connect(_on_level_selected.bind(level_id))
			btn.mouse_entered.connect(_on_level_hovered.bind(level_id))
		else:
			btn.text = "  🔒 第" + str(level_id) + "章: " + str(level_data.get("name", "")) + "  "
			btn.custom_minimum_size = Vector2(360, 44)
			btn.add_theme_font_size_override("font_size", 16)
			btn.disabled = true
			btn.modulate = Color(0.5, 0.5, 0.5, 1.0)

		btn_container.add_child(btn)
		_level_buttons.append(btn)

	var spacer_bottom = Control.new()
	spacer_bottom.size_flags_vertical = Control.SIZE_EXPAND_FILL
	left_panel.add_child(spacer_bottom)

	var btn_hbox = HBoxContainer.new()
	btn_hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	btn_hbox.add_theme_constant_override("separation", 20)
	left_panel.add_child(btn_hbox)

	var reset_btn = Button.new()
	reset_btn.text = "重置进度"
	reset_btn.custom_minimum_size = Vector2(140, 40)
	reset_btn.pressed.connect(_on_reset_progress)
	btn_hbox.add_child(reset_btn)

	var quit_btn = Button.new()
	quit_btn.text = "退出游戏"
	quit_btn.custom_minimum_size = Vector2(140, 40)
	quit_btn.pressed.connect(_on_quit)
	btn_hbox.add_child(quit_btn)

	var right_panel = PanelContainer.new()
	right_panel.custom_minimum_size = Vector2(420, 0)
	root.add_child(right_panel)

	var right_style = StyleBoxFlat.new()
	right_style.bg_color = Color("#0f1a2e")
	right_style.border_color = Color("#334466")
	right_style.border_width_left = 2
	right_panel.add_theme_stylebox_override("panel", right_style)

	var right_vbox = VBoxContainer.new()
	right_vbox.add_theme_constant_override("separation", 12)
	right_panel.add_child(right_vbox)

	var info_header = Label.new()
	info_header.text = "📋 关卡信息"
	info_header.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	info_header.add_theme_font_size_override("font_size", 20)
	info_header.add_theme_color_override("font_color", Color("#ffd700"))
	right_vbox.add_child(info_header)

	var spacer_r = Control.new()
	spacer_r.custom_minimum_size = Vector2(0, 16)
	right_vbox.add_child(spacer_r)

	_desc_label = Label.new()
	_desc_label.add_theme_font_size_override("font_size", 15)
	_desc_label.add_theme_color_override("font_color", Color("#cccccc"))
	_desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_desc_label.custom_minimum_size = Vector2(380, 0)
	right_vbox.add_child(_desc_label)

	_reward_label = Label.new()
	_reward_label.add_theme_font_size_override("font_size", 14)
	_reward_label.add_theme_color_override("font_color", Color("#2ecc71"))
	_reward_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_reward_label.custom_minimum_size = Vector2(380, 0)
	right_vbox.add_child(_reward_label)

	_show_default_info()

func _on_level_selected(level_id: int) -> void:
	print("[START_MENU] level selected: ", level_id)
	GameManager.start_level(level_id)

func _on_level_hovered(level_id: int) -> void:
	_hovered_level = level_id
	var level_data = LevelDatabase.get_level(level_id)
	if level_data.is_empty():
		return

	_desc_label.text = str(level_data.get("name", "")) + "\n\n" + str(level_data.get("description", ""))
	_desc_label.text += "\n\n展品: " + str(level_data.get("exhibits", []).size()) + "件"
	_desc_label.text += "  |  初始预算: " + str(level_data.get("starting_budget", 0))
	_desc_label.text += "  |  回合上限: " + str(level_data.get("max_turns", 0))

	var reward_id = level_data.get("reward_card", "")
	if not reward_id.is_empty():
		var card_data = CardDatabase.get_card(reward_id)
		if not card_data.is_empty():
			_reward_label.text = "🎁 通关奖励: " + str(card_data.get("name", "")) + "\n" + str(level_data.get("reward_description", card_data.get("description", "")))
		else:
			_reward_label.text = "🎁 通关奖励: " + str(level_data.get("reward_description", ""))
	else:
		_reward_label.text = ""

func _show_default_info() -> void:
	_desc_label.text = "将鼠标悬停在关卡上查看详细信息\n\n修复所有展品至满状态即可通关。\n展品每回合会持续恶化，合理使用手牌和预算！"
	_reward_label.text = ""

func _on_reset_progress() -> void:
	GameManager.max_unlocked_level = 1
	GameManager.save_progress()
	GameManager.change_state(GameManager.GameState.MENU)

func _on_quit() -> void:
	get_tree().quit()
