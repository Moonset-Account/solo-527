extends CanvasLayer
## BottleneckHints - 瓶颈提示面板

const DP := preload("res://scripts/data/DataProvider.gd")

@onready var hint_container: VBoxContainer = $Panel/List
@onready var lbl_title: Label = $Panel/List/ListTitle

var _active_hints: Dictionary = {}
var _decay_timer: float = 0.0

func initialize() -> void:
	for c in hint_container.get_children():
		if c.name != "ListTitle":
			c.queue_free()
	_active_hints.clear()
	visible = true

func add_hint(machine_id: String, score: float) -> void:
	if _active_hints.has(machine_id):
		_update_hint(machine_id, score)
		return
	if _active_hints.size() >= 4:
		_remove_oldest_hint()
	var machine = _find_machine(machine_id)
	var mtype: String = machine.machine_type if machine else "?"
	var cfg: Dictionary = DP.get_machine_config(mtype)
	var name: String = cfg.get("name", "机器")
	var row := HBoxContainer.new()
	row.name = machine_id
	row.add_theme_constant_override("separation", 8)
	var warn_icon := Label.new()
	warn_icon.text = "⚠"
	warn_icon.modulate = Color(1.0, 0.55, 0.3)
	warn_icon.add_theme_font_size_override("font_size", 16)
	row.add_child(warn_icon)
	var vb := VBoxContainer.new()
	vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(vb)
	var name_lbl := Label.new()
	name_lbl.name = "NameLabel"
	name_lbl.text = name
	name_lbl.modulate = Color(1.0, 0.78, 0.55)
	name_lbl.add_theme_font_size_override("font_size", 12)
	vb.add_child(name_lbl)
	var pct_lbl := Label.new()
	pct_lbl.name = "PctLabel"
	pct_lbl.text = "空闲率 %d%%" % int(score * 100)
	pct_lbl.modulate = Color(0.85, 0.7, 0.6)
	pct_lbl.add_theme_font_size_override("font_size", 10)
	vb.add_child(pct_lbl)
	_active_hints[machine_id] = {"time": Time.get_ticks_msec(), "row": row, "score": score}
	hint_container.add_child(row)
	PlaytestRecorder.record_event("bottleneck_detected", {"machine_id": machine_id, "score": score})

func _update_hint(machine_id: String, score: float) -> void:
	if not _active_hints.has(machine_id):
		return
	var entry: Dictionary = _active_hints[machine_id]
	entry["time"] = Time.get_ticks_msec()
	entry["score"] = score
	var row = entry["row"]
	if row and is_instance_valid(row):
		var pct_lbl = row.get_node_or_null("PctLabel")
		if pct_lbl:
			pct_lbl.text = "空闲率 %d%%" % int(score * 100)

func _remove_oldest_hint() -> void:
	var oldest_time: int = 999999999999
	var oldest_id: String = ""
	for mid in _active_hints.keys():
		var entry: Dictionary = _active_hints[mid]
		if entry["time"] < oldest_time:
			oldest_time = entry["time"]
			oldest_id = mid
	if oldest_id != "":
		remove_hint(oldest_id)

func remove_hint(machine_id: String) -> void:
	if not _active_hints.has(machine_id):
		return
	var entry: Dictionary = _active_hints[machine_id]
	var row = entry["row"]
	if row and is_instance_valid(row):
		var tween := create_tween()
		tween.tween_property(row, "modulate:a", 0.0, 0.2)
		tween.finished.connect(func():
			if is_instance_valid(row):
				row.queue_free()
		)
	_active_hints.erase(machine_id)

func _find_machine(mid: String):
	var root = get_tree().current_scene
	if root and root.has_node("PipelineController"):
		return root.get_node("PipelineController").get_machine_by_id(mid)
	return null

func _process(delta: float) -> void:
	_decay_timer += delta
	if _decay_timer < 2.0:
		return
	_decay_timer = 0.0
	var now: int = Time.get_ticks_msec()
	var to_remove: Array = []
	for mid in _active_hints.keys():
		var entry: Dictionary = _active_hints[mid]
		if now - entry["time"] > 8000:
			to_remove.append(mid)
	for mid in to_remove:
		remove_hint(mid)
