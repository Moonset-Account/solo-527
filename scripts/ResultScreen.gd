extends Control
class_name ResultScreen

@onready var title_label: Label = %ResultTitle
@onready var sub_title_label: Label = %ResultSubtitle
@onready var stars_container: HBoxContainer = %StarsContainer
@onready var score_label: Label = %FinalScore
@onready var breakdown_box: VBoxContainer = %BreakdownBox
@onready var stats_box: GridContainer = %StatsGrid
@onready var next_level_btn: Button = %NextLevelBtn
@onready var retry_btn: Button = %RetryBtn
@onready var back_btn: Button = %BackBtn
@onready var unlocks_box: VBoxContainer = %UnlocksBox
@onready var unlocks_label: Label = %UnlocksLabel
@onready var result_panel: PanelContainer = %ResultPanel

var result_data: Dictionary = {}
var stars_shown: int = 0
var pending_level_id: int = 0

func show_result(data: Dictionary) -> void:
	result_data = data
	visible = true
	result_panel.modulate.a = 0.0
	result_panel.scale = Vector2(0.8, 0.8)
	_process_data()
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(result_panel, "modulate:a", 1.0, 0.35)
	tween.tween_property(result_panel, "scale", Vector2.ONE, 0.45).set_trans(Tween.TRANS_BACK)
	_connect_buttons()
	_animate_stars()
	if data.get("success", false):
		AudioManager.play_sfx(AudioManager.SFX.LEVEL_COMPLETE)
		AudioManager.play_music("result")
	else:
		AudioManager.play_sfx(AudioManager.SFX.LEVEL_FAIL)

func hide_result() -> void:
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(result_panel, "modulate:a", 0.0, 0.25)
	tween.tween_property(result_panel, "scale", Vector2(0.85, 0.85), 0.3)
	tween.chain().tween_callback(func():
		visible = false
	)

func _process_data() -> void:
	var success: bool = result_data.get("success", false)
	title_label.text = "搬家完成！" if success else "搬家失败"
	title_label.add_theme_color_override("font_color",
		Color(0.4, 0.9, 0.55) if success else Color(0.95, 0.4, 0.4))
	if success:
		var stars: int = result_data.get("stars", 0)
		sub_title_label.text = _subtitle_for_stars(stars)
	else:
		sub_title_label.text = "原因：%s" % result_data.get("fail_reason", "未知原因")
	score_label.text = "总分：%d" % result_data.get("final_score", result_data.get("score", 0))
	_build_breakdown()
	_build_stats()
	_build_unlocks()
	_configure_buttons(success)

func _subtitle_for_stars(stars: int) -> String:
	match stars:
		3: return "完美搬家！三星通关！"
		2: return "出色完成！值得表扬！"
		1: return "勉强过关，继续加油！"
		_: return "顺利完成搬家"

func _build_breakdown() -> void:
	for c in breakdown_box.get_children():
		c.queue_free()
	if not result_data.get("success", false):
		_add_row(breakdown_box, "本局得分", str(result_data.get("score", 0)))
		return
	_add_row(breakdown_box, "基础分", str(result_data.get("base_score", 0)))
	_add_row(breakdown_box, "时间奖励", "+%d" % result_data.get("time_bonus", 0),
		Color(0.55, 0.85, 1.0) if result_data.get("time_bonus", 0) > 0 else null)
	_add_row(breakdown_box, "重量利用", "+%d" % result_data.get("weight_bonus", 0),
		Color(0.8, 1.0, 0.55) if result_data.get("weight_bonus", 0) > 0 else null)
	_add_row(breakdown_box, "易碎保护", "+%d" % result_data.get("fragile_bonus", 0),
		Color(0.95, 0.7, 1.0) if result_data.get("fragile_bonus", 0) > 0 else null)
	_add_row(breakdown_box, "失误惩罚", "-%d" % result_data.get("penalty", 0),
		Color(1.0, 0.55, 0.55) if result_data.get("penalty", 0) > 0 else null)

func _build_stats() -> void:
	for c in stats_box.get_children():
		c.queue_free()
	stats_box.columns = 2
	var labels: Array = [
		["用时", _format_time(result_data.get("time_elapsed", 0))],
		["已放置", "%d / %d" % [result_data.get("items_placed", 0), result_data.get("items_total", 0)]],
		["易碎品", "%d 损坏 / %d 总数" % [result_data.get("fragile_broken", 0), result_data.get("fragile_total", 0)]],
		["失误次数", str(result_data.get("mistakes", 0))],
		["重量使用", "%.0f / %.0f kg" % [result_data.get("weight_used", 0), result_data.get("weight_max", 0)]]
	]
	for pair in labels:
		_add_stat(pair[0], pair[1])

func _add_row(parent: VBoxContainer, label: String, value: String, highlight_color: Color = Color(1,1,1,0)) -> void:
	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 12)
	parent.add_child(hbox)
	var l := Label.new()
	l.text = label
	l.add_theme_font_size_override("font_size", 16)
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	l.add_theme_color_override("font_color", Color(0.85, 0.85, 0.9))
	hbox.add_child(l)
	var v := Label.new()
	v.text = value
	v.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	v.add_theme_font_size_override("font_size", 16)
	v.add_theme_color_override("font_color", highlight_color if highlight_color.a > 0 else Color.WHITE)
	hbox.add_child(v)

func _add_stat(key: String, value: String) -> void:
	var k := Label.new()
	k.text = key
	k.add_theme_font_size_override("font_size", 15)
	k.add_theme_color_override("font_color", Color(0.7, 0.7, 0.75))
	stats_box.add_child(k)
	var v := Label.new()
	v.text = value
	v.add_theme_font_size_override("font_size", 15)
	v.add_theme_color_override("font_color", Color.WHITE)
	stats_box.add_child(v)

func _build_unlocks() -> void:
	var unlocked_items: Array = result_data.get("unlocked_items", [])
	var unlocked_next: bool = result_data.get("unlocked_next", false)
	if unlocked_items.size() == 0 and not unlocked_next:
		unlocks_label.visible = false
		unlocks_box.visible = false
		return
	unlocks_label.visible = true
	unlocks_box.visible = true
	for c in unlocks_box.get_children():
		c.queue_free()
	if unlocked_next:
		var lbl := Label.new()
		lbl.text = "🗝️  解锁下一关！"
		lbl.add_theme_font_size_override("font_size", 16)
		lbl.add_theme_color_override("font_color", Color(1.0, 0.85, 0.4))
		unlocks_box.add_child(lbl)
		AudioManager.play_sfx(AudioManager.SFX.UNLOCK)
	for item_id in unlocked_items:
		var lbl := Label.new()
		lbl.text = "📦  解锁新物品：%s" % item_id
		lbl.add_theme_font_size_override("font_size", 16)
		lbl.add_theme_color_override("font_color", Color(0.7, 0.9, 1.0))
		unlocks_box.add_child(lbl)

func _animate_stars() -> void:
	for c in stars_container.get_children():
		c.queue_free()
	var total: int = 3
	var earned: int = result_data.get("stars", 0)
	stars_shown = 0
	for i in range(total):
		var lbl := Label.new()
		lbl.text = "★"
		lbl.add_theme_font_size_override("font_size", 54)
		lbl.add_theme_color_override("font_color", Color(0.25, 0.25, 0.3))
		lbl.modulate.a = 0.0
		stars_container.add_child(lbl)
		var idx: int = i
		await get_tree().create_timer(0.3 + idx * 0.35).timeout
		if is_instance_valid(lbl):
			lbl.modulate.a = 1.0
			if idx < earned:
				lbl.add_theme_color_override("font_color", Color(1.0, 0.85, 0.2))
				var tween := create_tween()
				lbl.scale = Vector2(0.4, 0.4)
				tween.set_parallel(true)
				tween.tween_property(lbl, "scale", Vector2(1.3, 1.3), 0.25).set_trans(Tween.TRANS_BACK)
				tween.chain().tween_property(lbl, "scale", Vector2.ONE, 0.2)
				AudioManager.play_sfx(AudioManager.SFX.STAR)

func _configure_buttons(success: bool) -> void:
	if not success:
		next_level_btn.disabled = true
		next_level_btn.modulate.a = 0.4
		return
	var next_unlocked: bool = result_data.get("unlocked_next", false)
	var levels := load("res://config/levels.tres")
	pending_level_id = result_data.get("level_id", 0) + 1
	if not levels or not levels.get_level_data().has(pending_level_id):
		next_level_btn.text = "已是最后一关"
		next_level_btn.disabled = true
		next_level_btn.modulate.a = 0.4
	elif not next_unlocked:
		next_level_btn.text = "重刷关卡解锁"
		next_level_btn.disabled = true
		next_level_btn.modulate.a = 0.5

func _connect_buttons() -> void:
	next_level_btn.pressed.connect(_on_next_level)
	retry_btn.pressed.connect(_on_retry)
	back_btn.pressed.connect(_on_back)

func _on_next_level() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	if pending_level_id > 0:
		hide_result()
		await get_tree().create_timer(0.3).timeout
		var root := get_tree().root
		if root.has_node("GameRoot"):
			var gr := root.get_node("GameRoot")
			if gr.has_method("start_level"):
				gr.start_level(pending_level_id)

func _on_retry() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	hide_result()
	await get_tree().create_timer(0.3).timeout
	var root := get_tree().root
	if root.has_node("GameRoot"):
		var gr := root.get_node("GameRoot")
		if gr.has_method("start_level"):
			gr.start_level(result_data.get("level_id", 1))

func _on_back() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	hide_result()
	await get_tree().create_timer(0.3).timeout
	get_tree().change_scene_to_file("res://scenes/LevelSelect.tscn")

func _format_time(sec: float) -> String:
	var m: int = int(sec / 60)
	var s: int = int(sec % 60)
	var cs: int = int((sec - int(sec)) * 100)
	return "%d:%02d.%02d" % [m, s, cs]
