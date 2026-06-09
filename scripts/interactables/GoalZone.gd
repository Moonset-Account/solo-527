extends Area2D

class_name GoalZone

@export var required_scans: int = 3
@export var required_fixes: int = 1

signal goal_reached()

@onready var visual: ColorRect = $Visual
@onready var label: Label = $Label
@onready var locked_marker: ColorRect = $LockedMarker

func _ready():
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	if visual:
		visual.color = Color(1.0, 0.7, 0.1, 0.3)
	_update_display()

func _process(delta):
	_update_display()

func _update_display():
	var progress = GameManager.get_progress()
	var scans_done = progress["scans"] >= required_scans
	var fixes_done = progress["fixes"] >= required_fixes
	if label:
		label.text = "出口\n扫描: %d/%d\n修复: %d/%d" % [
			progress["scans"], required_scans,
			progress["fixes"], required_fixes
		]
	if locked_marker:
		locked_marker.visible = not (scans_done and fixes_done)
		locked_marker.color = Color(1.0, 0, 0, 0.6)
	if visual:
		if scans_done and fixes_done:
			visual.color = Color(0.2, 1.0, 0.3, 0.4)
		else:
			visual.color = Color(1.0, 0.7, 0.1, 0.3)

func _on_body_entered(body):
	if not body.has_method("get_nearby_interactables"):
		return
	var progress = GameManager.get_progress()
	var scans_done = progress["scans"] >= required_scans
	var fixes_done = progress["fixes"] >= required_fixes
	if scans_done and fixes_done:
		emit_signal("goal_reached")
		GameManager.complete_level()
		DebugLog.success("到达目标！关卡完成")
	else:
		DebugLog.warning("还未完成目标！需要扫描 %d/%d，修复 %d/%d" % [
			progress["scans"], required_scans, progress["fixes"], required_fixes
		])

func _on_body_exited(body):
	pass
