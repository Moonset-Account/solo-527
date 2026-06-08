extends Node

enum LogLevel {
	DEBUG,
	INFO,
	WARN,
	ERROR,
}

signal log_entry_added(entry: Dictionary)

var log_level: LogLevel = LogLevel.INFO
var log_entries: Array = []

const LOG_DIR: String = "user://logs/"


func debug(msg: String) -> void:
	_add_entry(LogLevel.DEBUG, msg)


func info(msg: String) -> void:
	_add_entry(LogLevel.INFO, msg)


func warn(msg: String) -> void:
	_add_entry(LogLevel.WARN, msg)


func error(msg: String) -> void:
	_add_entry(LogLevel.ERROR, msg)


func set_log_level(level: LogLevel) -> void:
	log_level = level


func get_log_entries() -> Array:
	return log_entries


func clear_log() -> void:
	log_entries.clear()


func save_log_to_file() -> bool:
	var dir := DirAccess.open("user://")
	if dir != null and not dir.dir_exists("logs"):
		dir.make_dir("logs")
	var timestamp := Time.get_datetime_string_from_system().replace(":", "-")
	var file_path: String = LOG_DIR + "log_" + timestamp + ".log"
	var file := FileAccess.open(file_path, FileAccess.WRITE)
	if file == null:
		return false
	for entry in log_entries:
		var level_name: String = _level_to_string(entry.get("level", LogLevel.INFO))
		var time_str: String = entry.get("time", "")
		var message: String = entry.get("message", "")
		file.store_line("[%s][%s] %s" % [time_str, level_name, message])
	return true


func _add_entry(level: LogLevel, msg: String) -> void:
	if level < log_level:
		return
	var entry := {
		"level": level,
		"message": msg,
		"time": Time.get_time_string_from_system(),
	}
	log_entries.append(entry)
	log_entry_added.emit(entry)
	var level_name: String = _level_to_string(level)
	print("[%s][%s] %s" % [entry.time, level_name, msg])


func _level_to_string(level: LogLevel) -> String:
	match level:
		LogLevel.DEBUG:
			return "DEBUG"
		LogLevel.INFO:
			return "INFO"
		LogLevel.WARN:
			return "WARN"
		LogLevel.ERROR:
			return "ERROR"
	return "UNKNOWN"
