extends Node

signal log_added(message: String, log_type: String)

enum LogType {
	INFO,
	WARNING,
	SUCCESS,
	ERROR,
	DEBUG
}

var logs: Array = []
const MAX_LOGS = 100
var _log_verbose = true

func _ready():
	add_log("调试日志系统初始化完成", LogType.INFO)

func add_log(message: String, log_type: int = LogType.INFO):
	var timestamp = Time.get_time_string_from_system()
	var type_str = _type_to_string(log_type)
	var log_entry = {
		"time": timestamp,
		"message": message,
		"type": type_str
	}
	logs.append(log_entry)
	if logs.size() > MAX_LOGS:
		logs.remove_at(0)
	if _log_verbose:
		print("[%s] [%s] %s" % [timestamp, type_str, message])
	emit_signal("log_added", message, type_str)

func info(message: String):
	add_log(message, LogType.INFO)

func warning(message: String):
	add_log(message, LogType.WARNING)

func success(message: String):
	add_log(message, LogType.SUCCESS)

func error(message: String):
	add_log(message, LogType.ERROR)

func debug(message: String):
	add_log(message, LogType.DEBUG)

func _type_to_string(log_type: int) -> String:
	match log_type:
		LogType.INFO:
			return "INFO"
		LogType.WARNING:
			return "WARN"
		LogType.SUCCESS:
			return "OK"
		LogType.ERROR:
			return "ERR"
		LogType.DEBUG:
			return "DBG"
		_:
			return "???"

func get_logs() -> Array:
	return logs.duplicate()

func clear_logs():
	logs.clear()
