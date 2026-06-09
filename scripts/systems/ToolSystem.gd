extends Node

signal tool_selected(tool_id: String)
signal tool_unlocked(tool_id: String)

var current_tool: String = ""
var available_tools: Array[String] = []

func set_available_tools(tools: Array[String]) -> void:
	available_tools = tools.duplicate()
	if not available_tools.is_empty() and current_tool.is_empty():
		select_tool(available_tools[0])

func select_tool(tool_id: String) -> bool:
	if not is_tool_available(tool_id):
		return false
	current_tool = tool_id
	emit_signal("tool_selected", tool_id)
	return true

func is_tool_available(tool_id: String) -> bool:
	return tool_id in available_tools

func get_tool_for_action(action_name: String) -> Dictionary:
	return LevelLoader.get_tool_by_action(action_name)

func is_action_available(action_name: String) -> bool:
	var tool: Dictionary = get_tool_for_action(action_name)
	if tool.is_empty():
		return false
	var tool_id: String = tool.get("id", "")
	return is_tool_available(tool_id)

func get_action_for_current_tool() -> String:
	if current_tool.is_empty():
		return ""
	var tool: Dictionary = LevelLoader.get_tool_by_id(current_tool)
	return tool.get("action", "")

func get_available_tools_detail() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for tool_id in available_tools:
		var detail: Dictionary = LevelLoader.get_tool_by_id(tool_id)
		if not detail.is_empty():
			result.append(detail)
	return result
