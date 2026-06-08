extends Control

signal tutorial_step_completed(step_id: String)
signal tutorial_finished

class TutorialStep:
	var id: String
	var title: String
	var description: String
	var highlight_area: Rect2
	var arrow_position: Vector2
	var action_required: String

	func _init(p_id: String = "", p_title: String = "", p_description: String = "", p_highlight_area: Rect2 = Rect2(), p_arrow_position: Vector2 = Vector2(), p_action_required: String = "") -> void:
		id = p_id
		title = p_title
		description = p_description
		highlight_area = p_highlight_area
		arrow_position = p_arrow_position
		action_required = p_action_required

var title_label: Label
var description_label: Label
var highlight_rect: ColorRect
var next_button: Button
var skip_button: Button

var steps: Array[TutorialStep] = []
var current_step_index: int = 0
var is_active: bool = false

func _ready() -> void:
	_build_ui()
	visible = false
	_create_level_1_tutorial()

func _build_ui() -> void:
	highlight_rect = ColorRect.new()
	highlight_rect.anchors_preset = Control.PRESET_FULL_RECT
	highlight_rect.color = Color(0, 0, 0, 0.4)
	highlight_rect.visible = false
	add_child(highlight_rect)

	var panel := PanelContainer.new()
	panel.anchors_preset = Control.PRESET_CENTER_BOTTOM
	panel.offset_left = -250
	panel.offset_right = 250
	panel.offset_top = -180
	panel.offset_bottom = -20
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.17, 0.09, 0.06, 0.95)
	style.set_corner_radius_all(8)
	style.border_color = Color(0.96, 0.64, 0.38)
	style.border_width_bottom = 2
	style.border_width_top = 2
	style.border_width_left = 2
	style.border_width_right = 2
	panel.add_theme_stylebox_override("panel", style)
	add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)
	panel.add_child(vbox)

	title_label = Label.new()
	title_label.add_theme_font_size_override("font_size", 20)
	title_label.add_theme_color_override("font_color", Color(0.96, 0.64, 0.38))
	vbox.add_child(title_label)

	description_label = Label.new()
	description_label.add_theme_color_override("font_color", Color.WHITE)
	description_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(description_label)

	var btn_box := HBoxContainer.new()
	btn_box.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_child(btn_box)

	next_button = Button.new()
	next_button.text = "Next"
	next_button.custom_minimum_size = Vector2(80, 30)
	next_button.pressed.connect(advance_step)
	btn_box.add_child(next_button)

	skip_button = Button.new()
	skip_button.text = "Skip Tutorial"
	skip_button.custom_minimum_size = Vector2(120, 30)
	skip_button.pressed.connect(skip_tutorial)
	btn_box.add_child(skip_button)

func _create_level_1_tutorial() -> void:
	steps.clear()
	steps.append(TutorialStep.new("welcome", "Welcome", "Welcome to your first factory! Let's learn the basics."))
	steps.append(TutorialStep.new("place_cutter", "Place a Cutter", "Open the Shop and place a Cutter machine on the grid. Raw materials will be cut into pieces."))
	steps.append(TutorialStep.new("place_conveyor", "Place Conveyors", "Connect machines with Conveyor belts. Products move along conveyors to the next station."))
	steps.append(TutorialStep.new("place_packer", "Place a Packer", "Products need to be packed before delivery. Place a Packer before the delivery point."))
	steps.append(TutorialStep.new("start_production", "Start Production", "Products will automatically flow through your assembly line. Watch them move!"))
	steps.append(TutorialStep.new("complete_orders", "Complete Orders", "Fill orders before time runs out to earn money and stars. Check the order panel on the right."))

func load_tutorial(level_id: int) -> void:
	steps.clear()
	match level_id:
		1:
			_create_level_1_tutorial()
		_:
			_create_level_1_tutorial()
	current_step_index = 0

func start_tutorial() -> void:
	is_active = true
	current_step_index = 0
	visible = true
	_display_step()

func advance_step() -> void:
	if current_step_index < steps.size():
		var step: TutorialStep = steps[current_step_index]
		tutorial_step_completed.emit(step.id)
	current_step_index += 1
	if current_step_index >= steps.size():
		complete_tutorial()
	else:
		_display_step()

func complete_tutorial() -> void:
	is_active = false
	visible = false
	highlight_rect.visible = false
	tutorial_finished.emit()

func skip_tutorial() -> void:
	complete_tutorial()

func set_highlight(area: Rect2) -> void:
	if area == Rect2():
		highlight_rect.visible = false
		return
	highlight_rect.visible = true
	highlight_rect.position = area.position
	highlight_rect.size = area.size

func set_arrow(pos: Vector2) -> void:
	pass

func get_current_step() -> TutorialStep:
	if current_step_index < steps.size():
		return steps[current_step_index]
	return null

func _display_step() -> void:
	var step: TutorialStep = get_current_step()
	if step == null:
		return
	title_label.text = step.title
	description_label.text = step.description
	next_button.text = "Next (%d/%d)" % [current_step_index + 1, steps.size()]
	if current_step_index >= steps.size() - 1:
		next_button.text = "Finish"
