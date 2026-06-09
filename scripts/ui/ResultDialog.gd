extends CanvasLayer
## ResultDialog - 关卡结算弹窗

const DP := preload("res://scripts/data/DataProvider.gd")

@onready var lbl_title: Label = $Overlay/Panel/VBox/Title
@onready var lbl_stats: RichTextLabel = $Overlay/Panel/VBox/Stats
@onready var btn_next: Button = $Overlay/Panel/VBox/Buttons/ButtonNext
@onready var btn_retry: Button = $Overlay/Panel/VBox/Buttons/ButtonRetry
@onready var btn_menu: Button = $Overlay/Panel/VBox/Buttons/ButtonMenu
@onready var score_display: Label = $Overlay/Panel/VBox/ScoreDisplay

var _next_level_id: String = ""

func show_result(success: bool, stats: Dictionary) -> void:
	visible = true
	lbl_title.text = "🏆 关卡通过!" if success else "⏱ 时间耗尽"
	lbl_title.modulate = Color(1.0, 0.88, 0.35) if success else Color(1.0, 0.5, 0.45)
	score_display.text = "得分: %d" % stats.get("score", 0)
	score_display.modulate = Color(0.85, 0.95, 1.0)
	_build_stats_text(success, stats)
	_connect_buttons(stats.get("level_id"))
	score_display.scale = Vector2(0.2, 0.2)
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(score_display, "scale", Vector2(1.2, 1.2), 0.4).set_ease(Tween.EASE_OUT)
	tween.tween_property(score_display, "modulate:a", 1.0, 0.3)
	tween.tween_property(score_display, "scale", Vector2(1.0, 1.0), 0.2)

func _build_stats_text(success: bool, stats: Dictionary) -> void:
	var t: String = ""
	t += "[center][b][color=yellow]== 关卡统计 ==[/color][/b][/center]\n\n"
	t += "[color=cyan]⏱ 用时:[/color] %d秒\n" % stats.get("duration_seconds", 0)
	t += "[color=green]📦 完成订单:[/color] %d / %d\n" % [stats.get("orders_completed", 0), stats.get("orders_target", 0)]
	t += "[color=red]❌ 失败订单:[/color] %d\n" % stats.get("orders_failed", 0)
	t += "[color=purple]⚙️ 机器数:[/color] %d\n" % stats.get("machines_used", 0)
	t += "[color=purple]➡️ 传送带数:[/color] %d\n" % stats.get("conveyors_used", 0)
	t += "[color=orange]🏭 总产量:[/color] %d 件\n" % stats.get("total_produced", 0)
	t += "[color=gold]💰 剩余金币:[/color] %d\n" % stats.get("money_remaining", 0)
	var ph: float = stats.get("pipeline_health", 0.0)
	var ph_color: String = "green" if ph > 0.7 else ("yellow" if ph > 0.4 else "red")
	t += "[color=%s]📊 流水线健康度:[/color] %d%%\n" % [ph_color, int(ph * 100)]
	var bonus: int = stats.get("bonus_reward", 0)
	if bonus > 0:
		t += "\n[color=gold][b]🎁 奖励目标达成:[/b] +%d 💰[/color]\n" % bonus
		for bid in stats.get("bonus_objectives", {}).keys():
			var entry: Dictionary = stats["bonus_objectives"][bid]
			if entry.get("completed", false):
				var obj: Dictionary = entry.get("data", {})
				t += "  ✓ %s [color=gray](+%d)[/color]\n" % [obj.get("desc", bid), obj.get("reward", 0)]
	lbl_stats.text = t

func _connect_buttons(current_lid: String) -> void:
	var ids: Array = DP.get_all_level_ids()
	var idx: int = ids.find(current_lid)
	var next_available: bool = idx >= 0 and idx < ids.size() - 1
	_next_level_id = ids[idx + 1] if next_available else ""
	btn_next.disabled = not next_available
	if btn_next.is_inside_tree():
		for c in btn_next.get_signal_connection_list("pressed"):
			btn_next.pressed.disconnect(c.callable)
		btn_next.pressed.connect(_on_next)
	if btn_retry.is_inside_tree():
		for c in btn_retry.get_signal_connection_list("pressed"):
			btn_retry.pressed.disconnect(c.callable)
		btn_retry.pressed.connect(_on_retry)
	if btn_menu.is_inside_tree():
		for c in btn_menu.get_signal_connection_list("pressed"):
			btn_menu.pressed.disconnect(c.callable)
		btn_menu.pressed.connect(_on_menu)
	for b in [btn_next, btn_retry, btn_menu]:
		if b.is_inside_tree():
			b.mouse_entered.connect(func(): AudioManager.play_sfx("button_hover"))

func _on_next() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("next_level", "ResultDialog")
	PlaytestRecorder.record_key_decision("next_level", {"from": GameState.current_level_id, "to": _next_level_id})
	GameState.reset_for_new_level()
	GameState.current_level_id = _next_level_id
	GameState.is_paused = false
	SceneManager.change_scene("GameScene", true, {"level_id": _next_level_id})

func _on_retry() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("retry", "ResultDialog")
	GameState.reset_for_new_level()
	GameState.is_paused = false
	if get_tree().current_scene and get_tree().current_scene.has_method("retry_level"):
		get_tree().current_scene.retry_level()

func _on_menu() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("menu", "ResultDialog")
	GameState.reset_for_new_level()
	GameState.is_paused = false
	SceneManager.change_scene("LevelSelect")
