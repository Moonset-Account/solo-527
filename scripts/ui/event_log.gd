class_name EventLog
extends VBoxContainer

var _log_entries: Array[Label] = []
var _max_entries: int = 8

func add_entry(text: String, color: Color = Color.LIGHT_GRAY) -> void:
	var lbl = Label.new()
	lbl.text = "▸ " + text
	lbl.add_theme_font_size_override("font_size", 13)
	lbl.add_theme_color_override("font_color", color)
	lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	lbl.custom_minimum_size.x = 300
	add_child(lbl)
	_log_entries.append(lbl)
	if _log_entries.size() > _max_entries:
		var old = _log_entries.pop_front()
		old.queue_free()

func add_event(event_name: String, desc: String) -> void:
	add_entry("⚠ %s: %s" % [event_name, desc], Color(1.0, 0.6, 0.3))

func add_repair(target: StringName) -> void:
	add_entry("✓ 维修完成: %s已恢复" % ResourceManager.resource_display_name(target), Color(0.4, 0.9, 0.4))

func clear_log() -> void:
	for lbl in _log_entries:
		lbl.queue_free()
	_log_entries.clear()
