class_name Unit
extends Control

signal unit_moved(unit: Unit, from: Vector2i, to: Vector2i)
signal unit_action_completed(unit: Unit)
signal unit_selected(unit: Unit)

var data: CharacterData = null
var grid_position: Vector2i = Vector2i.ZERO
var current_ap: int = 0
var max_ap: int = 3
var is_selected: bool = false
var has_acted: bool = false
var exhibition_bonus: int = 0
var publicity_bonus: int = 0
var reception_bonus: int = 0
var _skill_active: bool = false
var _sprite: ColorRect = null
var _label: Label = null
var _move_cost: int = 1
var _action_cost: int = 2

func setup(char_data: CharacterData, start_pos: Vector2i) -> void:
	data = char_data
	grid_position = start_pos
	max_ap = char_data.max_ap
	current_ap = max_ap
	_move_cost = 1
	_action_cost = 2
	_create_visual()

func _create_visual() -> void:
	_sprite = ColorRect.new()
	_sprite.custom_minimum_size = Vector2(48, 48)
	_sprite.size = Vector2(48, 48)
	_sprite.color = data.color
	_sprite.position = Vector2(8, 4)
	add_child(_sprite)
	_label = Label.new()
	_label.text = data.display_name
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.add_theme_font_size_override("font_size", 10)
	_label.position = Vector2(0, 50)
	_label.size = Vector2(64, 16)
	add_child(_label)
	custom_minimum_size = Vector2(64, 66)
	gui_input.connect(_on_gui_input)

func reset_ap() -> void:
	current_ap = max_ap
	has_acted = false
	exhibition_bonus = 0
	publicity_bonus = 0
	reception_bonus = 0
	_skill_active = false

func can_move(ap_system: ActionPoints) -> bool:
	return ap_system.has_enough(_move_cost)

func can_act(ap_system: ActionPoints) -> bool:
	return ap_system.has_enough(_action_cost)

func move_to(new_pos: Vector2i, ap_system: ActionPoints) -> bool:
	if not can_move(ap_system):
		return false
	if not ap_system.spend(_move_cost):
		return false
	var old_pos: Vector2i = grid_position
	grid_position = new_pos
	unit_moved.emit(self, old_pos, new_pos)
	return true

func perform_action(task_type: int, ap_system: ActionPoints) -> int:
	if not can_act(ap_system):
		return 0
	if not ap_system.spend(_action_cost):
		return 0
	has_acted = true
	var power: int = 0
	match task_type:
		TaskData.TaskType.EXHIBITION:
			power = data.exhibition_power + exhibition_bonus
		TaskData.TaskType.PUBLICITY:
			power = data.publicity_power + publicity_bonus
		TaskData.TaskType.RECEPTION:
			power = data.reception_power + reception_bonus
	exhibition_bonus = 0
	publicity_bonus = 0
	reception_bonus = 0
	_skill_active = false
	unit_action_completed.emit(self)
	return power

func get_power_for_task(task_type: int) -> int:
	match task_type:
		TaskData.TaskType.EXHIBITION:
			return data.exhibition_power + exhibition_bonus
		TaskData.TaskType.PUBLICITY:
			return data.publicity_power + publicity_bonus
		TaskData.TaskType.RECEPTION:
			return data.reception_power + reception_bonus
	return 0

func activate_skill() -> String:
	if _skill_active:
		return ""
	if data.skill_ids.size() == 0:
		return ""
	var skill_id: String = data.skill_ids[0]
	match skill_id:
		"exhibition_boost":
			exhibition_bonus += 2
		"publicity_boost":
			publicity_bonus += 2
		"reception_boost":
			reception_bonus += 2
	_skill_active = true
	return skill_id

func is_skill_active() -> bool:
	return _skill_active

func set_selected(selected: bool) -> void:
	is_selected = selected
	if _sprite:
		if selected:
			_sprite.color = Color(data.color.r + 0.3, data.color.g + 0.3, data.color.b + 0.3)
		else:
			_sprite.color = data.color

func update_display_position(cell_size: int) -> void:
	position = Vector2(grid_position.x * cell_size, grid_position.y * cell_size)

func _on_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		unit_selected.emit(self)
