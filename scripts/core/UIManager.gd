extends Node
## UI管理器 - 管理全局UI状态、提示和弹窗

signal ui_opened(panel_name: String)
signal ui_closed(panel_name: String)

var _active_panels: Dictionary = {}
var _toast_queue: Array = []
var _is_toast_showing: bool = false
var _toast_overlay: CanvasLayer = null
var _toast_label: Label = null

static func clear_container(container: Node) -> void:
    if container == null:
        return
    for child in container.get_children():
        container.remove_child(child)
        child.queue_free()

func _ready() -> void:
    _setup_toast_system()

func _setup_toast_system() -> void:
    _toast_overlay = CanvasLayer.new()
    _toast_overlay.layer = 100
    add_child(_toast_overlay)

    var center: CenterContainer = CenterContainer.new()
    center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    center.anchor_top = 0.15
    center.offset_bottom = center.anchor_top
    _toast_overlay.add_child(center)

    var panel: PanelContainer = PanelContainer.new()
    var style: StyleBoxFlat = StyleBoxFlat.new()
    style.bg_color = Color(0, 0, 0, 0.8)
    style.corner_radius_top_left = 12
    style.corner_radius_top_right = 12
    style.corner_radius_bottom_left = 12
    style.corner_radius_bottom_right = 12
    style.content_margin_left = 24
    style.content_margin_right = 24
    style.content_margin_top = 12
    style.content_margin_bottom = 12
    panel.add_theme_stylebox_override("panel", style)
    center.add_child(panel)

    _toast_label = Label.new()
    _toast_label.add_theme_font_size_override("font_size", 28)
    _toast_label.add_theme_color_override("font_color", Color.WHITE)
    _toast_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    panel.add_child(_toast_label)

    panel.modulate.a = 0.0
    panel.visible = false

func open_panel(panel_name: String, panel_instance: Control) -> void:
    if _active_panels.has(panel_name):
        close_panel(panel_name)
    _active_panels[panel_name] = panel_instance
    ui_opened.emit(panel_name)
    if panel_instance.get_tree() == null:
        add_child(panel_instance)
    panel_instance.visible = true
    _animate_panel_in(panel_instance)

func close_panel(panel_name: String) -> void:
    if not _active_panels.has(panel_name):
        return
    var panel: Control = _active_panels[panel_name]
    _animate_panel_out(panel)
    _active_panels.erase(panel_name)
    ui_closed.emit(panel_name)

func _animate_panel_in(panel: Control) -> void:
    panel.modulate.a = 0.0
    panel.scale = Vector2(0.9, 0.9)
    var tween: Tween = create_tween()
    tween.set_parallel(true)
    tween.tween_property(panel, "modulate:a", 1.0, 0.2)
    tween.tween_property(panel, "scale", Vector2.ONE, 0.25).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)

func _animate_panel_out(panel: Control) -> void:
    var tween: Tween = create_tween()
    tween.set_parallel(true)
    tween.tween_property(panel, "modulate:a", 0.0, 0.15)
    tween.tween_property(panel, "scale", Vector2(0.9, 0.9), 0.15).set_ease(Tween.EASE_IN)
    await tween.finished
    if is_instance_valid(panel):
        panel.visible = false

func is_panel_open(panel_name: String) -> bool:
    return _active_panels.has(panel_name)

func show_toast(message: String, duration: float = 2.0) -> void:
    _toast_queue.append({"msg": message, "dur": duration})
    if not _is_toast_showing:
        _process_toast_queue()

func _process_toast_queue() -> void:
    if _toast_queue.is_empty():
        _is_toast_showing = false
        return
    _is_toast_showing = true
    var data: Dictionary = _toast_queue.pop_front()
    _show_single_toast(data["msg"], data["dur"])

func _show_single_toast(message: String, duration: float) -> void:
    _toast_label.text = message
    var panel: Control = _toast_label.get_parent()
    panel.visible = true

    var tween_in: Tween = create_tween()
    tween_in.tween_property(panel, "modulate:a", 1.0, 0.25).set_ease(Tween.EASE_OUT)
    await tween_in.finished

    await get_tree().create_timer(duration).timeout

    var tween_out: Tween = create_tween()
    tween_out.tween_property(panel, "modulate:a", 0.0, 0.25).set_ease(Tween.EASE_IN)
    await tween_out.finished
    panel.visible = false
    _process_toast_queue()

func confirm_dialog(title: String, message: String, on_confirm: Callable = Callable()) -> ConfirmationDialog:
    var dialog: ConfirmationDialog = ConfirmationDialog.new()
    dialog.title = title
    dialog.dialog_text = message
    dialog.get_ok_button().text = "确定"
    dialog.get_cancel_button().text = "取消"
    if on_confirm.is_valid():
        dialog.confirmed.connect(on_confirm)
    dialog.canceled.connect(func(): dialog.queue_free())
    dialog.confirmed.connect(func(): dialog.queue_free())
    add_child(dialog)
    dialog.popup_centered()
    return dialog

func create_button(text: String, callback: Callable) -> Button:
    var btn: Button = Button.new()
    btn.text = text
    btn.pressed.connect(callback)
    btn.pressed.connect(func(): AudioManager.play_sfx("click"))
    return btn

func vibrate(strength: float = 0.5) -> void:
    if not SaveSystem.settings_data.get("vibration_enabled", true):
        return
    if Engine.has_singleton("JavaClass"):
        pass
    else:
        DisplayServer.window_set_ime_active(false)
