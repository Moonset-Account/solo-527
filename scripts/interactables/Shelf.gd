extends StaticBody2D

class_name Shelf

@export var shelf_id: String = "shelf_001"
@export var has_error: bool = false
@export var expected_label: String = "A-001"
@export var actual_label: String = "A-001"
@export var shelf_color: Color = Color(0.6, 0.5, 0.3)
@export var is_goal_shelf: bool = false

var scanned: bool = false
var fixed: bool = false
var is_in_range: bool = false

signal scanned_success(shelf: Node)
signal fixed_success(shelf: Node)

@onready var label_text: Label = $Label
@onready var status_indicator: ColorRect = $StatusIndicator
@onready var interact_prompt: Label = $InteractPrompt
@onready var error_marker: Sprite2D = $ErrorMarker
@onready var highlight: ColorRect = $Highlight

func _ready():
	_update_label_display()
	_update_status_indicator()
	if interact_prompt:
		interact_prompt.visible = false
	if error_marker:
		error_marker.visible = has_error and not fixed
	if highlight:
		highlight.visible = false
	DebugLog.debug("货架 %s 初始化 - %s错误标签" % [shelf_id, ("有" if has_error else "无")])

func can_scan() -> bool:
	return not scanned

func needs_fix() -> bool:
	return has_error and not fixed

func can_interact() -> bool:
	return has_error and scanned and not fixed

func on_scanned() -> bool:
	if scanned:
		return false
	scanned = true
	_update_status_indicator()
	_update_label_display()
	if highlight:
		highlight.color = Color(0.3, 0.8, 1.0, 0.3)
		highlight.visible = true
	await get_tree().create_timer(0.5).timeout
	if highlight:
		highlight.visible = false
	emit_signal("scanned_success", self)
	if has_error:
		AudioManager.play_sfx("scan_error_found", 1.0, 0.7)
		DebugLog.info("扫描完成 - 货架 %s 发现错误标签: %s (应为: %s)" % [shelf_id, actual_label, expected_label])
	else:
		AudioManager.play_sfx("scan_ok", 1.0, 0.6)
		DebugLog.info("扫描完成 - 货架 %s 标签正常" % shelf_id)
	return true

func on_interact(player: Node):
	if not can_interact():
		return
	fixed = true
	actual_label = expected_label
	_update_label_display()
	_update_status_indicator()
	if error_marker:
		error_marker.visible = false
	emit_signal("fixed_success", self)
	GameManager.increment_fix()
	AudioManager.play_sfx("fix_complete", 1.0, 0.7)
	DebugLog.success("修复完成 - 货架 %s 标签已更正为 %s" % [shelf_id, expected_label])
	if highlight:
		highlight.color = Color(0.3, 1.0, 0.5, 0.4)
		highlight.visible = true
	await get_tree().create_timer(0.5).timeout
	if highlight:
		highlight.visible = false

func _update_label_display():
	if label_text:
		var status = ""
		if has_error and not scanned:
			status = actual_label
		elif has_error and scanned and not fixed:
			status = "[color=red]%s[/color]" % actual_label
		elif has_error and fixed:
			status = "[color=green]%s[/color]" % expected_label
		else:
			status = actual_label
		label_text.text = "%s\n%s" % [shelf_id, status]

func _update_status_indicator():
	if not status_indicator:
		return
	if fixed:
		status_indicator.color = Color(0.2, 1.0, 0.3)
	elif scanned and has_error:
		status_indicator.color = Color(1.0, 0.3, 0.3)
	elif scanned:
		status_indicator.color = Color(0.3, 0.6, 1.0)
	else:
		status_indicator.color = Color(0.8, 0.8, 0.8)

func set_in_range(in_range: bool):
	is_in_range = in_range
	if interact_prompt:
		interact_prompt.visible = in_range and can_interact()
