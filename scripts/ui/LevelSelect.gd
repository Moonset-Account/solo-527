extends Control

@onready var levels_container: VBoxContainer = $LevelsContainer
@onready var back_button: Button = $BackButton
@onready var gold_label: Label = $GoldLabel

func _ready() -> void:
	back_button.pressed.connect(_on_back_pressed)
	_build_level_list()
	_update_gold()

func _update_gold() -> void:
	gold_label.text = "金币：%d" % GameManager.player_gold

func _build_level_list() -> void:
	for child in levels_container.get_children():
		child.queue_free()
	var all_levels: Array[Dictionary] = LevelLoader.get_all_levels()
	for level in all_levels:
		var level_id: int = level.get("id", 0)
		var unlocked: bool = level_id in GameManager.unlocked_levels
		var panel: PanelContainer = PanelContainer.new()
		panel.custom_minimum_size = Vector2(900, 140)
		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.add_theme_constant_override("separation", 20)
		panel.add_child(hbox)
		var left_vbox: VBoxContainer = VBoxContainer.new()
		left_vbox.custom_minimum_size = Vector2(650, 0)
		hbox.add_child(left_vbox)
		var title_hbox: HBoxContainer = HBoxContainer.new()
		left_vbox.add_child(title_hbox)
		var name_label: Label = Label.new()
		name_label.text = level.get("name", "")
		name_label.add_theme_font_size_override("font_size", 26)
		name_label.add_theme_color_override("font_color", Color(0.36, 0.24, 0.18, 1))
		title_hbox.add_child(name_label)
		if level.get("is_tutorial", false):
			var tutorial_tag: Label = Label.new()
			tutorial_tag.text = "  【教程】"
			tutorial_tag.add_theme_font_size_override("font_size", 18)
			tutorial_tag.add_theme_color_override("font_color", Color(0.8, 0.2, 0.2, 1))
			title_hbox.add_child(tutorial_tag)
		var desc_label: Label = Label.new()
		desc_label.text = level.get("description", "")
		desc_label.add_theme_font_size_override("font_size", 16)
		desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		left_vbox.add_child(desc_label)
		var info_hbox: HBoxContainer = HBoxContainer.new()
		info_hbox.add_theme_constant_override("separation", 30)
		left_vbox.add_child(info_hbox)
		var book: Dictionary = level.get("book", {})
		var book_label: Label = Label.new()
		book_label.text = "📜 %s（%s）" % [book.get("name", ""), book.get("dynasty", "")]
		book_label.add_theme_font_size_override("font_size", 14)
		info_hbox.add_child(book_label)
		var zones_count: int = book.get("damage_zones", []).size()
		var zone_label: Label = Label.new()
		zone_label.text = "🔧 损伤区域：%d处" % zones_count
		zone_label.add_theme_font_size_override("font_size", 14)
		info_hbox.add_child(zone_label)
		var time_limit: int = level.get("time_limit", 0)
		var time_label: Label = Label.new()
		time_label.text = "⏱ 时限：%d分%d秒" % [time_limit / 60, time_limit % 60]
		time_label.add_theme_font_size_override("font_size", 14)
		info_hbox.add_child(time_label)
		var tools: Array = level.get("unlocked_tools", [])
		var tools_label: Label = Label.new()
		tools_label.text = "🛠 可用工具：%s" % "、".join(tools)
		tools_label.add_theme_font_size_override("font_size", 14)
		info_hbox.add_child(tools_label)
		var right_vbox: VBoxContainer = VBoxContainer.new()
		right_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
		hbox.add_child(right_vbox)
		var button: Button = Button.new()
		button.custom_minimum_size = Vector2(180, 60)
		button.add_theme_font_size_override("font_size", 22)
		if unlocked:
			button.text = "接受委托"
			button.pressed.connect(_on_level_selected.bind(level_id))
		else:
			button.text = "🔒 未解锁"
			button.disabled = true
		right_vbox.add_child(button)
		var reward_label: Label = Label.new()
		reward_label.text = "💰 基础酬金：%d" % level.get("client", {}).get("reward", 0)
		reward_label.add_theme_font_size_override("font_size", 14)
		reward_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		right_vbox.add_child(reward_label)
		levels_container.add_child(panel)

func _on_back_pressed() -> void:
	GameManager.change_scene("MainMenu")

func _on_level_selected(level_id: int) -> void:
	GameManager.start_level(level_id)
