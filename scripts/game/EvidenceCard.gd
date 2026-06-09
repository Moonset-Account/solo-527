extends Control

const CARD_TYPE_COLORS = {
	"letter": Color(0.96, 0.9, 0.78),
	"photo": Color(0.85, 0.88, 0.95),
	"document": Color(0.8, 0.92, 0.82),
	"newspaper": Color(0.92, 0.82, 0.75),
	"note": Color(0.98, 0.92, 0.7)
}

const CARD_TYPE_ICONS = {
	"letter": "✉",
	"photo": "📷",
	"document": "📄",
	"newspaper": "📰",
	"note": "📝"
}

signal card_drag_started(card: Control)
signal card_drag_ended(card: Control, position: Vector2)
signal card_pressed(card: Control)
signal card_double_clicked(card: Control)

@export var card_id: String = ""
@export var card_type: String = "document"
@export var card_title: String = ""
@export var card_content: String = ""
@export var image_hint: String = ""
@export var is_draggable: bool = true
@export var show_tags: bool = true
@export var card_width: float = 220.0
@export var card_height: float = 280.0

var card_data: Dictionary = {}
var is_dragging: bool = false
var is_selected: bool = false
var is_placed: bool = false
var slot_index: int = -1
var drag_offset: Vector2 = Vector2.ZERO
var original_position: Vector2 = Vector2.ZERO
var original_parent: Node = null
var home_parent: Node = null
var home_position: Vector2 = Vector2.ZERO
var tags_container: HBoxContainer
var tags: Array = []
var click_time: float = 0.0
var last_click_time: float = 0.0
var tween: Tween

@onready var bg_panel: Panel = $BgPanel
@onready var type_label: Label = $Header/TypeLabel
@onready var icon_label: Label = $Header/IconLabel
@onready var title_label: Label = $Content/TitleLabel
@onready var content_label: Label = $Content/ContentLabel
@onready var image_hint_label: Label = $Footer/ImageHintLabel

func _ready() -> void:
	_setup_card()
	custom_minimum_size = Vector2(card_width, card_height)
	size = Vector2(card_width, card_height)
	mouse_filter = Control.MOUSE_FILTER_STOP
	bg_panel.size = Vector2(card_width, card_height)
	if show_tags:
		_create_tags_container()

func _setup_card() -> void:
	if bg_panel:
		var color = CARD_TYPE_COLORS.get(card_type, Color(0.9, 0.9, 0.9))
		bg_panel.add_theme_stylebox_override("panel", _make_stylebox(color))
	if icon_label:
		icon_label.text = CARD_TYPE_ICONS.get(card_type, "📄")
	if type_label:
		type_label.text = _get_type_display_name()
	if title_label:
		title_label.text = card_title
	if content_label:
		content_label.text = card_content
	if image_hint_label:
		image_hint_label.text = image_hint if not image_hint.is_empty() else ""

func _make_stylebox(color: Color) -> StyleBoxFlat:
	var sb = StyleBoxFlat.new()
	sb.bg_color = color
	sb.border_color = color.darkened(0.3)
	sb.border_width_left = 2
	sb.border_width_right = 2
	sb.border_width_top = 2
	sb.border_width_bottom = 2
	sb.corner_radius_top_left = 8
	sb.corner_radius_top_right = 8
	sb.corner_radius_bottom_left = 8
	sb.corner_radius_bottom_right = 8
	sb.shadow_color = Color(0, 0, 0, 0.25)
	sb.shadow_size = 6
	sb.shadow_offset = Vector2(2, 4)
	sb.content_margin_left = 12
	sb.content_margin_right = 12
	sb.content_margin_top = 8
	sb.content_margin_bottom = 8
	return sb

func _get_type_display_name() -> String:
	match card_type:
		"letter":
			return "信件"
		"photo":
			return "照片"
		"document":
			return "档案"
		"newspaper":
			return "剪报"
		"note":
			return "便签"
	return "档案"

func _create_tags_container() -> void:
	tags_container = HBoxContainer.new()
	tags_container.name = "TagsContainer"
	tags_container.position = Vector2(10, card_height - 30)
	tags_container.size = Vector2(card_width - 20, 24)
	add_child(tags_container)
	refresh_tags_display()

func set_card_data(data: Dictionary) -> void:
	card_data = data.duplicate(true)
	card_id = data.get("id", "")
	card_type = data.get("type", "document")
	card_title = data.get("title", "")
	card_content = data.get("content", "")
	image_hint = data.get("image_hint", "")
	tags = data.get("tags", [])
	if is_node_ready():
		_setup_card()
		refresh_tags_display()

func refresh_tags_display() -> void:
	if not tags_container:
		return
	var children: Array = tags_container.get_children()
	for c: Node in children:
		c.queue_free()
	var player_tags: Array = GameManager.get_card_tags(card_id)
	var available_tags: Array = player_tags if player_tags.size() > 0 else []
	for tag: String in available_tags:
		var tag_label: Label = Label.new()
		tag_label.text = tag
		tag_label.add_theme_font_size_override("font_size", 11)
		var tag_sb: StyleBoxFlat = StyleBoxFlat.new()
		tag_sb.bg_color = Color(0.2, 0.5, 0.8, 0.85)
		tag_sb.corner_radius_top_left = 6
		tag_sb.corner_radius_top_right = 6
		tag_sb.corner_radius_bottom_left = 6
		tag_sb.corner_radius_bottom_right = 6
		tag_sb.content_margin_left = 6
		tag_sb.content_margin_right = 6
		tag_sb.content_margin_top = 2
		tag_sb.content_margin_bottom = 2
		tag_label.add_theme_color_override("font_color", Color.WHITE)
		tag_label.add_theme_stylebox_override("normal", tag_sb)
		tags_container.add_child(tag_label)

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				last_click_time = click_time
				click_time = Time.get_ticks_msec()
				if click_time - last_click_time < 300:
					emit_signal("card_double_clicked", self)
					EventBus.emit_signal("card_pressed", card_id)
					AudioManager.play_ui_sound("ui_click")
					return
				if is_draggable:
					_start_drag(event.position)
				emit_signal("card_pressed", self)
				EventBus.emit_signal("card_pressed", card_id)
				AudioManager.play_ui_sound("card_pickup")
			else:
				if is_dragging:
					_end_drag(get_global_mouse_position())
	elif event is InputEventMouseMotion and is_dragging:
		_update_drag_position()

func _start_drag(local_pos: Vector2) -> void:
	is_dragging = true
	original_position = position
	original_parent = get_parent()
	drag_offset = local_pos
	z_index = 100
	var viewport_rect = get_viewport().get_visible_rect()
	var global_pos = get_global_position()
	if get_parent():
		get_parent().remove_child(self)
	get_tree().root.add_child(self)
	global_position = global_pos
	emit_signal("card_drag_started", self)
	EventBus.emit_signal("card_dragged", card_id, get_global_position())
	AudioManager.play_ui_sound("drag_start")
	_animate_lift()

func _update_drag_position() -> void:
	if not is_dragging:
		return
	global_position = get_global_mouse_position() - drag_offset * get_global_transform().get_scale()
	EventBus.emit_signal("card_dragged", card_id, get_global_position())

func _end_drag(final_position: Vector2) -> void:
	is_dragging = false
	z_index = 0
	emit_signal("card_drag_ended", self, final_position)
	AudioManager.play_ui_sound("drag_end")
	_animate_drop()

func return_to_original_parent() -> void:
	var target_parent = home_parent if home_parent else original_parent
	var target_pos = home_position if home_parent else original_position
	if target_parent and get_parent() != target_parent:
		if get_parent():
			get_parent().remove_child(self)
		target_parent.add_child(self)
		position = target_pos
	elif home_parent:
		position = target_pos

func _animate_lift() -> void:
	if tween:
		tween.kill()
	tween = create_tween()
	tween.set_parallel(true)
	tween.tween_property(self, "scale", Vector2(1.08, 1.08), 0.1 * GameManager.animation_speed).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	var shadow_sb = bg_panel.get_theme_stylebox("panel") as StyleBoxFlat
	if shadow_sb:
		shadow_sb.shadow_size = 12
		shadow_sb.shadow_offset = Vector2(4, 8)

func _animate_drop() -> void:
	if tween:
		tween.kill()
	tween = create_tween()
	tween.set_parallel(true)
	tween.tween_property(self, "scale", Vector2.ONE, 0.15 * GameManager.animation_speed).set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)

func set_selected(value: bool) -> void:
	is_selected = value
	if bg_panel:
		var color = CARD_TYPE_COLORS.get(card_type, Color(0.9, 0.9, 0.9))
		if is_selected:
			color = color.lightened(0.1)
		var sb = bg_panel.get_theme_stylebox("panel") as StyleBoxFlat
		if sb:
			sb.border_color = Color(0.2, 0.6, 1.0) if is_selected else color.darkened(0.3)
			sb.border_width_left = 3 if is_selected else 2
			sb.border_width_right = 3 if is_selected else 2
			sb.border_width_top = 3 if is_selected else 2
			sb.border_width_bottom = 3 if is_selected else 2

func animate_wrong() -> void:
	var tw = create_tween()
	tw.set_loops(2)
	tw.tween_property(self, "position:x", position.x - 8, 0.05 * GameManager.animation_speed)
	tw.tween_property(self, "position:x", position.x + 8, 0.05 * GameManager.animation_speed)
	tw.tween_property(self, "position:x", position.x, 0.05 * GameManager.animation_speed)
	var sb = bg_panel.get_theme_stylebox("panel") as StyleBoxFlat
	if sb:
		var orig_color = sb.border_color
		sb.border_color = Color(1.0, 0.2, 0.2)
		await tw.finished
		sb.border_color = orig_color

func animate_correct() -> void:
	var tw = create_tween()
	var orig_scale = scale
	tw.tween_property(self, "scale", orig_scale * 1.1, 0.1 * GameManager.animation_speed).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(self, "scale", orig_scale, 0.15 * GameManager.animation_speed).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
	var sb = bg_panel.get_theme_stylebox("panel") as StyleBoxFlat
	if sb:
		var orig_color = sb.border_color
		sb.border_color = Color(0.2, 0.9, 0.4)
		await tw.finished
		sb.border_color = orig_color

func animate_appear(delay: float = 0.0) -> void:
	visible = false
	scale = Vector2(0.5, 0.5)
	modulate.a = 0.0
	await get_tree().create_timer(delay).timeout
	visible = true
	var tw = create_tween()
	tw.set_parallel(true)
	tw.tween_property(self, "scale", Vector2.ONE, 0.25 * GameManager.animation_speed).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(self, "modulate:a", 1.0, 0.25 * GameManager.animation_speed).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)

func fade_out_and_free() -> void:
	var tw = create_tween()
	tw.tween_property(self, "modulate:a", 0.0, 0.2 * GameManager.animation_speed)
	tw.tween_property(self, "scale", Vector2(0.8, 0.8), 0.2 * GameManager.animation_speed)
	tw.finished.connect(queue_free)
