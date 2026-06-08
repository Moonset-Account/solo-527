extends Control

var _result_vbox: VBoxContainer
var _title_label: Label
var _subtitle_label: Label
var _stats_label: Label
var _reward_container: VBoxContainer
var _reward_card_label: Label
var _reward_desc_label: Label
var _btn_retry: Button
var _btn_next: Button
var _btn_menu: Button
var _is_victory: bool = false
var _level_data: Dictionary = {}
var _anim_timer: float = 0.0
var _showing_reward: bool = false

func _ready() -> void:
	_build_ui()
	_connect_signals()
	_show_result()
	print("[SETTLEMENT] _ready done, victory=", _is_victory, " level_id=", GameManager.current_level_id)

func _process(delta: float) -> void:
	if _showing_reward:
		_anim_timer += delta
		var pulse = 0.7 + 0.3 * sin(_anim_timer * 4.0)
		_reward_card_label.modulate.a = pulse

func _build_ui() -> void:
	var bg = ColorRect.new()
	bg.color = Color("#0d0d1a")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)

	var center = VBoxContainer.new()
	center.set_anchors_preset(Control.PRESET_CENTER)
	center.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_theme_constant_override("separation", 16)
	center.custom_minimum_size = Vector2(600, 500)
	center.position = Vector2(340, 110)
	add_child(center)

	_title_label = Label.new()
	_title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_title_label.add_theme_font_size_override("font_size", 40)
	center.add_child(_title_label)

	_subtitle_label = Label.new()
	_subtitle_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_subtitle_label.add_theme_font_size_override("font_size", 18)
	_subtitle_label.add_theme_color_override("font_color", Color("#aaaaaa"))
	center.add_child(_subtitle_label)

	var sep = HSeparator.new()
	center.add_child(sep)

	_stats_label = Label.new()
	_stats_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_stats_label.add_theme_font_size_override("font_size", 16)
	_stats_label.add_theme_color_override("font_color", Color("#cccccc"))
	_stats_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	center.add_child(_stats_label)

	_reward_container = VBoxContainer.new()
	_reward_container.alignment = BoxContainer.ALIGNMENT_CENTER
	_reward_container.add_theme_constant_override("separation", 8)
	center.add_child(_reward_container)

	var reward_header = Label.new()
	reward_header.text = "🎁 解锁新卡牌"
	reward_header.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	reward_header.add_theme_font_size_override("font_size", 18)
	reward_header.add_theme_color_override("font_color", Color("#ffd700"))
	_reward_container.add_child(reward_header)

	_reward_card_label = Label.new()
	_reward_card_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_reward_card_label.add_theme_font_size_override("font_size", 24)
	_reward_card_label.add_theme_color_override("font_color", Color("#f39c12"))
	_reward_container.add_child(_reward_card_label)

	_reward_desc_label = Label.new()
	_reward_desc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_reward_desc_label.add_theme_font_size_override("font_size", 14)
	_reward_desc_label.add_theme_color_override("font_color", Color("#2ecc71"))
	_reward_desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_reward_container.add_child(_reward_desc_label)

	_reward_container.visible = false

	var spacer = Control.new()
	spacer.custom_minimum_size = Vector2(0, 20)
	center.add_child(spacer)

	var btn_hbox = HBoxContainer.new()
	btn_hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	btn_hbox.add_theme_constant_override("separation", 16)
	center.add_child(btn_hbox)

	_btn_retry = Button.new()
	_btn_retry.text = "重新挑战"
	_btn_retry.custom_minimum_size = Vector2(140, 48)
	_btn_retry.add_theme_font_size_override("font_size", 16)
	btn_hbox.add_child(_btn_retry)

	_btn_next = Button.new()
	_btn_next.text = "下一关"
	_btn_next.custom_minimum_size = Vector2(140, 48)
	_btn_next.add_theme_font_size_override("font_size", 16)
	btn_hbox.add_child(_btn_next)

	_btn_menu = Button.new()
	_btn_menu.text = "返回菜单"
	_btn_menu.custom_minimum_size = Vector2(140, 48)
	_btn_menu.add_theme_font_size_override("font_size", 16)
	btn_hbox.add_child(_btn_menu)

func _connect_signals() -> void:
	_btn_retry.pressed.connect(_on_retry)
	_btn_next.pressed.connect(_on_next)
	_btn_menu.pressed.connect(_on_menu)

func _show_result() -> void:
	_level_data = LevelDatabase.get_level(GameManager.current_level_id)
	_is_victory = GameManager.check_win()

	if _is_victory:
		_title_label.text = "🎉 修复完成！"
		_title_label.add_theme_color_override("font_color", Color("#2ecc71"))
		_subtitle_label.text = "所有展品已成功修复！"
		_btn_next.visible = true
		_show_reward()
	else:
		_title_label.text = "💔 修复失败"
		_title_label.add_theme_color_override("font_color", Color("#e94560"))
		if GameManager.turn_number > GameManager.max_turns:
			_subtitle_label.text = "回合数已耗尽！"
		else:
			_subtitle_label.text = "有展品的状态降到了0！"
		_btn_next.visible = false
		_reward_container.visible = false

	_build_stats()

	_btn_retry.visible = true

func _show_reward() -> void:
	var reward_card_id = _level_data.get("reward_card", "")
	if reward_card_id.is_empty():
		_reward_container.visible = false
		return

	var card_data = CardDatabase.get_card(reward_card_id)
	if card_data.is_empty():
		_reward_container.visible = false
		return

	CardDatabase.unlock_card(reward_card_id)
	_showing_reward = true
	_anim_timer = 0.0

	_reward_card_label.text = card_data.get("name", "???")
	_reward_desc_label.text = _level_data.get("reward_description", card_data.get("description", ""))
	_reward_container.visible = true

func _build_stats() -> void:
	var stats_text = ""
	stats_text += "关卡: " + _level_data.get("name", "") + "\n"
	stats_text += "使用回合: " + str(GameManager.turn_number) + "/" + str(GameManager.max_turns) + "\n"
	stats_text += "剩余预算: " + str(GameManager.budget) + "\n"

	var total_points = 0
	var total_condition = 0
	var total_max = 0
	for ex in GameManager.exhibits:
		var cond = int(ex.get("current_condition", 0))
		var max_c = int(ex.get("max_condition", 1))
		total_condition += cond
		total_max += max_c
		if cond >= max_c:
			total_points += int(ex.get("point_value", 0))
		stats_text += ex.get("name", "???") + ": " + str(cond) + "/" + str(max_c) + "\n"

	stats_text += "\n获得分值: " + str(total_points)

	var rating = ""
	if _is_victory:
		var efficiency = float(total_condition) / float(max(total_max, 1))
		if efficiency >= 1.0 and GameManager.budget >= 5:
			rating = "⭐⭐⭐ 完美修复！"
		elif efficiency >= 0.8:
			rating = "⭐⭐ 良好修复"
		else:
			rating = "⭐ 勉强过关"
		stats_text += "\n\n评级: " + rating

	_stats_label.text = stats_text

func _on_retry() -> void:
	GameManager.retry_level()

func _on_next() -> void:
	var next_id = GameManager.current_level_id + 1
	var next_level = LevelDatabase.get_level(next_id)
	if not next_level.is_empty():
		GameManager.max_unlocked_level = maxi(GameManager.max_unlocked_level, next_id)
		GameManager.save_progress()
		GameManager.start_level(next_id)
	else:
		GameManager.change_state(GameManager.GameState.MENU)

func _on_menu() -> void:
	if _is_victory:
		GameManager.max_unlocked_level = maxi(GameManager.max_unlocked_level, GameManager.current_level_id + 1)
		GameManager.save_progress()
	GameManager.change_state(GameManager.GameState.MENU)
