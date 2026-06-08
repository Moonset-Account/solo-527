extends Control

signal next_level_pressed
signal retry_pressed
signal menu_pressed

var result_title: Label
var stars_display: HBoxContainer
var stats_panel: VBoxContainer
var orders_completed_label: Label
var products_delivered_label: Label
var money_earned_label: Label
var time_elapsed_label: Label
var failures_label: Label
var reward_label: Label
var failure_reason_label: Label
var btn_next: Button
var btn_retry: Button
var btn_menu: Button

var level_stars: int = 0
var is_victory: bool = true
var failure_reason: String = ""

func _ready() -> void:
	visible = false
	_build_ui()

func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.anchors_preset = Control.PRESET_FULL_RECT
	bg.color = Color(0, 0, 0, 0.7)
	add_child(bg)

	var center := VBoxContainer.new()
	center.anchors_preset = Control.PRESET_CENTER
	center.offset_left = -200
	center.offset_right = 200
	center.offset_top = -250
	center.offset_bottom = 250
	center.alignment = BoxContainer.ALIGNMENT_CENTER
	add_child(center)

	result_title = Label.new()
	result_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	result_title.add_theme_font_size_override("font_size", 36)
	result_title.add_theme_color_override("font_color", Color(0.96, 0.64, 0.38))
	center.add_child(result_title)

	stars_display = HBoxContainer.new()
	stars_display.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(stars_display)

	stats_panel = VBoxContainer.new()
	center.add_child(stats_panel)

	orders_completed_label = _make_stat_label()
	stats_panel.add_child(orders_completed_label)
	products_delivered_label = _make_stat_label()
	stats_panel.add_child(products_delivered_label)
	money_earned_label = _make_stat_label()
	stats_panel.add_child(money_earned_label)
	time_elapsed_label = _make_stat_label()
	stats_panel.add_child(time_elapsed_label)
	failures_label = _make_stat_label()
	stats_panel.add_child(failures_label)

	failure_reason_label = Label.new()
	failure_reason_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	failure_reason_label.add_theme_color_override("font_color", Color.RED)
	failure_reason_label.add_theme_font_size_override("font_size", 18)
	failure_reason_label.visible = false
	center.add_child(failure_reason_label)

	reward_label = Label.new()
	reward_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	reward_label.add_theme_font_size_override("font_size", 22)
	reward_label.add_theme_color_override("font_color", Color(0.96, 0.64, 0.38))
	center.add_child(reward_label)

	var btn_box := HBoxContainer.new()
	btn_box.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(btn_box)

	btn_next = _make_button("Next Level")
	btn_next.pressed.connect(_on_next_pressed)
	btn_box.add_child(btn_next)

	btn_retry = _make_button("Retry")
	btn_retry.pressed.connect(_on_retry_pressed)
	btn_box.add_child(btn_retry)

	btn_menu = _make_button("Main Menu")
	btn_menu.pressed.connect(_on_menu_pressed)
	btn_box.add_child(btn_menu)

func _make_stat_label() -> Label:
	var label := Label.new()
	label.add_theme_color_override("font_color", Color.WHITE)
	return label

func _make_button(text: String) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(120, 40)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.29, 0.22, 0.16)
	style.set_corner_radius_all(4)
	btn.add_theme_stylebox_override("normal", style)
	var hover := StyleBoxFlat.new()
	hover.bg_color = Color(0.42, 0.31, 0.23)
	hover.set_corner_radius_all(4)
	btn.add_theme_stylebox_override("hover", hover)
	btn.add_theme_color_override("font_color", Color(0.96, 0.64, 0.38))
	return btn

func show_victory(stars: int, stats: Dictionary) -> void:
	is_victory = true
	level_stars = stars
	result_title.text = "Level Complete!"
	result_title.add_theme_color_override("font_color", Color(0.2, 0.8, 0.2))
	failure_reason_label.visible = false
	_populate_stats(stats)
	var base_reward: int = int(stats.get("total_rewards", 0))
	var star_bonus: int = stars * 100
	reward_label.text = "Reward: $%d (+$%d star bonus)" % [base_reward, star_bonus]
	btn_next.visible = true
	animate_stars(stars)
	visible = true

func show_failure(reason: String, stats: Dictionary) -> void:
	is_victory = false
	level_stars = 0
	failure_reason = reason
	result_title.text = "Level Failed!"
	result_title.add_theme_color_override("font_color", Color.RED)
	failure_reason_label.text = reason
	failure_reason_label.visible = true
	_populate_stats(stats)
	reward_label.text = "Reward: $0"
	btn_next.visible = false
	_clear_stars()
	visible = true

func _on_next_pressed() -> void:
	next_level_pressed.emit()

func _on_retry_pressed() -> void:
	retry_pressed.emit()

func _on_menu_pressed() -> void:
	menu_pressed.emit()

func animate_stars(target: int) -> void:
	_clear_stars()
	for i in range(3):
		var star := Label.new()
		star.text = "★"
		star.add_theme_font_size_override("font_size", 40)
		star.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		star.modulate.a = 0.3
		stars_display.add_child(star)
	for i in range(target):
		var star: Label = stars_display.get_child(i) as Label
		star.add_theme_color_override("font_color", Color(0.96, 0.84, 0.2))
		star.modulate.a = 0.0
		var tween := create_tween()
		tween.tween_interval(0.3 * float(i))
		tween.tween_property(star, "modulate:a", 1.0, 0.4).set_ease(Tween.EASE_OUT)
		tween.parallel().tween_property(star, "scale", Vector2(1.3, 1.3), 0.2).set_ease(Tween.EASE_OUT)
		tween.tween_property(star, "scale", Vector2(1.0, 1.0), 0.2).set_ease(Tween.EASE_IN)

func format_time(seconds: float) -> String:
	var mins: int = int(seconds) / 60
	var secs: int = int(seconds) % 60
	return "%02d:%02d" % [mins, secs]

func _populate_stats(stats: Dictionary) -> void:
	orders_completed_label.text = "Orders: %d completed / %d failed" % [int(stats.get("orders_completed", 0)), int(stats.get("orders_failed", 0))]
	products_delivered_label.text = "Products: %d delivered / %d failed" % [int(stats.get("products_delivered", 0)), int(stats.get("products_failed", 0))]
	money_earned_label.text = "Money Earned: $%d (Penalties: $%d)" % [int(stats.get("total_rewards", 0)), int(stats.get("total_penalties", 0))]
	time_elapsed_label.text = "Time: %s" % format_time(float(stats.get("time_elapsed", 0.0)))
	var conveyors: int = int(stats.get("conveyors_placed", 0))
	var bn_fixed: int = int(stats.get("bottlenecks_fixed", 0))
	failures_label.text = "Conveyors: %d | Bottlenecks Fixed: %d" % [conveyors, bn_fixed]

func _clear_stars() -> void:
	for child in stars_display.get_children():
		child.queue_free()
