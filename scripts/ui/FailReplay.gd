extends Control

var replay_data: Dictionary = {}
var settlement_data: Dictionary = {}

@onready var score_label: Label = $ScoreLabel
@onready var failures_content: VBoxContainer = $FailuresPanel/FailuresVBox/FailuresScroll/FailuresContent
@onready var replay_stats_hbox: HBoxContainer = $ReplayPanel/ReplayVBox/ReplayStatsHBox
@onready var view_settlement_button: Button = $ButtonContainer/ViewSettlementButton
@onready var retry_button: Button = $ButtonContainer/RetryButton
@onready var back_button: Button = $ButtonContainer/BackButton

func _ready() -> void:
	LevelLoader.initialize()
	var combined: Dictionary = GameData.get_fail_replay()
	settlement_data = combined.get("settlement", {})
	replay_data = combined.get("replay", {})
	if settlement_data.is_empty() and replay_data.is_empty():
		settlement_data = GameData.get_settlement()
		if settlement_data.is_empty():
			GameManager.change_scene("MainMenu")
			return
	_build_ui()
	view_settlement_button.pressed.connect(_on_view_settlement)
	retry_button.pressed.connect(_on_retry_pressed)
	back_button.pressed.connect(_on_back_pressed)

func _build_ui() -> void:
	var score: int = settlement_data.get("score", 0)
	var level_id: int = settlement_data.get("level_id", 0)
	var level_data: Dictionary = LevelLoader.get_level(level_id)
	var passing_score: int = level_data.get("passing_score", 60)
	score_label.text = "得分：%d  /  合格线：%d" % [score, passing_score]
	_build_failures()
	_build_replay_stats()

func _build_failures() -> void:
	for child in failures_content.get_children():
		child.queue_free()
	var failures: Array = settlement_data.get("failures", [])
	if failures.is_empty():
		var none: Label = Label.new()
		none.text = "未检测到明确的失败原因，可能是综合评分未达标。"
		none.add_theme_font_size_override("font_size", 16)
		failures_content.add_child(none)
		return
	for i in range(failures.size()):
		var f: Dictionary = failures[i]
		var panel: PanelContainer = PanelContainer.new()
		failures_content.add_child(panel)
		var inner_vbox: VBoxContainer = VBoxContainer.new()
		inner_vbox.add_theme_constant_override("separation", 6)
		panel.add_child(inner_vbox)
		var header_hbox: HBoxContainer = HBoxContainer.new()
		header_hbox.add_theme_constant_override("separation", 12)
		inner_vbox.add_child(header_hbox)
		var severity: int = f.get("severity", 1)
		var stars: String = "⚠".repeat(severity)
		var type_label: Label = Label.new()
		type_label.text = "【%s】%s" % [f.get("type", "未知"), stars]
		type_label.add_theme_font_size_override("font_size", 18)
		var color: Color
		match severity:
			5:
				color = Color(0.75, 0.1, 0.1, 1)
			3, 4:
				color = Color(0.85, 0.4, 0.1, 1)
			_:
				color = Color(0.7, 0.55, 0.1, 1)
		type_label.add_theme_color_override("font_color", color)
		header_hbox.add_child(type_label)
		var zone_name: String = f.get("zone_name", "")
		if not zone_name.is_empty():
			var zl: Label = Label.new()
			zl.text = "区域：%s" % zone_name
			zl.add_theme_font_size_override("font_size", 14)
			header_hbox.add_child(zl)
		var desc: Label = Label.new()
		desc.text = "📌 " + f.get("description", "")
		desc.add_theme_font_size_override("font_size", 15)
		desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		inner_vbox.add_child(desc)
		var sug: Label = Label.new()
		sug.text = "💡 建议：" + f.get("suggestion", "")
		sug.add_theme_font_size_override("font_size", 14)
		sug.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		sug.add_theme_color_override("font_color", Color(0.2, 0.4, 0.65, 1))
		inner_vbox.add_child(sug)

func _build_replay_stats() -> void:
	for child in replay_stats_hbox.get_children():
		child.queue_free()
	var time_taken: float = replay_data.get("time_taken", 0)
	var mins: int = int(time_taken) / 60
	var secs: int = int(time_taken) % 60
	_add_stat("⏱ 用时", "%d分%02d秒" % [mins, secs])
	var s_final: float = replay_data.get("final_strength", 0)
	var level_data: Dictionary = LevelLoader.get_level(settlement_data.get("level_id", 0))
	var s_base: float = level_data.get("book", {}).get("base_strength", 50)
	_add_stat("💪 剩余强度", "%.0f / %.0f" % [s_final, s_base])
	var h: float = replay_data.get("final_humidity", 0)
	var htarget = level_data.get("book", {}).get("humidity_target", null)
	if htarget != null:
		_add_stat("💧 最终湿度", "%.0f%%（目标 %.0f%%）" % [h, float(htarget)])
	var materials: Dictionary = replay_data.get("materials_used", {})
	var papers: Dictionary = materials.get("paper", {})
	var paper_count: int = 0
	for p in papers.keys():
		paper_count += papers[p]
	var glues: Dictionary = materials.get("glue", {})
	var glue_count: int = 0
	for g in glues.keys():
		glue_count += glues[g]
	_add_stat("📦 材料", "纸×%d / 胶×%d" % [paper_count, glue_count])
	var zones_detail: Array = replay_data.get("zones_detail", [])
	var repaired: int = 0
	for zd in zones_detail:
		if zd.get("repaired", false):
			repaired += 1
	_add_stat("🔧 进度", "%d/%d 完成" % [repaired, zones_detail.size()])
	var total_actions: int = replay_data.get("action_log", []).size()
	_add_stat("📝 操作数", "%d 次" % total_actions)

func _add_stat(label: String, value: String) -> void:
	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 2)
	replay_stats_hbox.add_child(vbox)
	var l: Label = Label.new()
	l.text = label
	l.add_theme_font_size_override("font_size", 13)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(l)
	var v: Label = Label.new()
	v.text = value
	v.add_theme_font_size_override("font_size", 16)
	v.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_theme_color_override("font_color", Color(0.2, 0.35, 0.6, 1))
	vbox.add_child(v)

func _on_view_settlement() -> void:
	GameData.store_settlement(settlement_data)
	GameManager.change_scene("Settlement")

func _on_retry_pressed() -> void:
	var level_id: int = settlement_data.get("level_id", 0)
	GameManager.start_level(level_id)

func _on_back_pressed() -> void:
	GameManager.change_scene("LevelSelect")
