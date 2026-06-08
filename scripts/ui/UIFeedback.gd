class_name UIFeedback
extends Control

var _hint_label: Label = null
var _hint_timer: Timer = null
var _canvas_modulate: Color = Color(1, 1, 1, 1)

signal hint_shown(text, duration)
signal hint_hidden()

func _ready() -> void:
    name = "UIFeedback"
    anchor_right = 1.0
    anchor_bottom = 1.0
    mouse_filter = Control.MOUSE_FILTER_IGNORE
    z_index = 100
    _setup_hint_label()
    _setup_timer()
    EventBus.on_event("money_changed", _on_money_changed)
    EventBus.on_event("customer_served", _on_customer_served)
    EventBus.on_event("inventory_changed", _on_inventory_changed)

func _setup_hint_label() -> void:
    _hint_label = Label.new()
    _hint_label.name = "HintLabel"
    _hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    _hint_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
    _hint_label.anchor_left = 0.5
    _hint_label.anchor_top = 0.85
    _hint_label.anchor_right = 0.5
    _hint_label.anchor_bottom = 0.9
    _hint_label.offset_left = -200
    _hint_label.offset_right = 200
    _hint_label.offset_top = -20
    _hint_label.offset_bottom = 20
    _hint_label.add_theme_font_size_override("font_size", 20)
    _hint_label.modulate.a = 0.0
    _hint_label.z_index = 101
    add_child(_hint_label)
    
    var style = StyleBoxFlat.new()
    style.bg_color = Color(0, 0, 0, 0.7)
    style.corner_radius_top_left = 8
    style.corner_radius_top_right = 8
    style.corner_radius_bottom_left = 8
    style.corner_radius_bottom_right = 8
    style.content_margin_left = 16
    style.content_margin_right = 16
    style.content_margin_top = 8
    style.content_margin_bottom = 8
    _hint_label.add_theme_stylebox_override("normal", style)

func _setup_timer() -> void:
    _hint_timer = Timer.new()
    _hint_timer.name = "HintTimer"
    _hint_timer.wait_time = 2.0
    _hint_timer.one_shot = true
    _hint_timer.timeout.connect(_on_hint_timeout)
    add_child(_hint_timer)

func show_hint(text: String, duration: float = 2.0) -> void:
    if _hint_label == null:
        return
    _hint_label.text = text
    _hint_label.modulate = Color(1, 1, 1, 0.0)
    _hint_label.visible = true
    
    var tween = create_tween()
    tween.tween_property(_hint_label, "modulate:a", 1.0, 0.2)
    
    _hint_timer.wait_time = duration
    _hint_timer.start()
    emit_signal("hint_shown", text, duration)

func _on_hint_timeout() -> void:
    if _hint_label == null:
        return
    var tween = create_tween()
    tween.tween_property(_hint_label, "modulate:a", 0.0, 0.3)
    tween.tween_callback(func(): _hint_label.visible = false)
    emit_signal("hint_hidden()")

func show_floating_text(position: Vector2, text: String, color: Color = Color.YELLOW, duration: float = 1.0) -> void:
    var label = Label.new()
    label.text = text
    label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    label.add_theme_font_size_override("font_size", 18)
    label.modulate = color
    label.z_index = 102
    
    var bg = StyleBoxFlat.new()
    bg.bg_color = Color(0, 0, 0, 0.6)
    bg.corner_radius_top_left = 4
    bg.corner_radius_top_right = 4
    bg.corner_radius_bottom_left = 4
    bg.corner_radius_bottom_right = 4
    bg.content_margin_left = 8
    bg.content_margin_right = 8
    bg.content_margin_top = 4
    bg.content_margin_bottom = 4
    label.add_theme_stylebox_override("normal", bg)
    
    label.position = position
    label.pivot_offset = Vector2(label.size.x / 2, label.size.y / 2)
    add_child(label)
    
    var tween = create_tween()
    tween.tween_property(label, "position:y", position.y - 40, duration)
    tween.parallel().tween_property(label, "modulate:a", 0.0, duration)
    tween.tween_callback(label.queue_free)

func flash_screen(color: Color, duration: float = 0.2) -> void:
    var rect = ColorRect.new()
    rect.color = color
    rect.anchor_right = 1.0
    rect.anchor_bottom = 1.0
    rect.modulate.a = 0.0
    rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
    rect.z_index = 99
    add_child(rect)
    
    var tween = create_tween()
    tween.tween_property(rect, "modulate:a", 0.3, duration * 0.4)
    tween.tween_property(rect, "modulate:a", 0.0, duration * 0.6)
    tween.tween_callback(rect.queue_free)

func shake_node(node: Node, intensity: float = 5.0, duration: float = 0.3) -> void:
    if node == null:
        return
    var original_pos: Vector2 = Vector2.ZERO
    if node is Control:
        original_pos = node.position
    elif node is Node2D:
        original_pos = node.position
    
    var elapsed = 0.0
    var tween = create_tween()
    while elapsed < duration:
        var delta = get_process_delta_time()
        elapsed += delta
        var progress = elapsed / duration
        var current_intensity = intensity * (1.0 - progress)
        var offset = Vector2(
            randf_range(-current_intensity, current_intensity),
            randf_range(-current_intensity, current_intensity)
        )
        if node is Control:
            node.position = original_pos + offset
        elif node is Node2D:
            node.position = original_pos + offset
        await get_tree().process_frame
    if node is Control:
        node.position = original_pos
    elif node is Node2D:
        node.position = original_pos

func pulse_scale(node: Node, scale_factor: float = 1.1, duration: float = 0.2) -> void:
    if node == null:
        return
    var original_scale: Vector2 = Vector2.ONE
    if node is Control:
        original_scale = node.scale
    elif node is Node2D:
        original_scale = node.scale
    
    var tween = create_tween()
    tween.set_trans(Tween.TRANS_BACK)
    tween.set_ease(Tween.EASE_OUT)
    if node is Control:
        tween.tween_property(node, "scale", original_scale * scale_factor, duration * 0.5)
        tween.tween_property(node, "scale", original_scale, duration * 0.5)
    elif node is Node2D:
        tween.tween_property(node, "scale", original_scale * scale_factor, duration * 0.5)
        tween.tween_property(node, "scale", original_scale, duration * 0.5)

func _on_money_changed(amount: int, _total: int) -> void:
    var text = ""
    var color = Color.YELLOW
    if amount > 0:
        text = "+%d 金币" % amount
        color = Color(0.2, 1.0, 0.3)
    elif amount < 0:
        text = "%d 金币" % amount
        color = Color(1.0, 0.3, 0.2)
    else:
        return
    show_floating_text(Vector2(size.x / 2, size.y * 0.15), text, color, 1.2)

func _on_customer_served(_customer, _item_id, price: int) -> void:
    show_hint("售出商品！获得 %d 金币" % price, 1.5)
    AudioManager.play_sfx("success")

func _on_inventory_changed(_item_id, _count) -> void:
    pass
