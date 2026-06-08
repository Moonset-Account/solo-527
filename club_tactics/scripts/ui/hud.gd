class_name HUD
extends Control

var _turn_label: Label = null
var _ap_label: Label = null
var _satisfaction_bar: ProgressBar = null
var _satisfaction_label: Label = null
var _task_list: VBoxContainer = null
var _end_turn_button: Button = null
var _skill_button: Button = null
var _info_panel: Panel = null
var _info_label: RichTextLabel = null
var _feedback_label: Label = null
var _feedback_tween: Tween = null

func _ready() -> void:
    _turn_label = Label.new()
    _turn_label.position = Vector2(10, 10)
    _turn_label.add_theme_font_size_override("font_size", 18)
    add_child(_turn_label)

    _ap_label = Label.new()
    _ap_label.position = Vector2(10, 35)
    _ap_label.add_theme_font_size_override("font_size", 16)
    add_child(_ap_label)

    _satisfaction_bar = ProgressBar.new()
    _satisfaction_bar.position = Vector2(10, 60)
    _satisfaction_bar.size = Vector2(200, 20)
    _satisfaction_bar.min_value = 0.0
    _satisfaction_bar.max_value = 100.0
    _satisfaction_bar.value = 50.0
    add_child(_satisfaction_bar)

    _satisfaction_label = Label.new()
    _satisfaction_label.position = Vector2(220, 60)
    _satisfaction_label.add_theme_font_size_override("font_size", 14)
    add_child(_satisfaction_label)

    _task_list = VBoxContainer.new()
    _task_list.position = Vector2(10, 90)
    _task_list.add_theme_constant_override("separation", 4)
    add_child(_task_list)

    _end_turn_button = Button.new()
    _end_turn_button.text = "结束回合"
    _end_turn_button.position = Vector2(1050, 670)
    _end_turn_button.custom_minimum_size = Vector2(150, 40)
    add_child(_end_turn_button)

    _skill_button = Button.new()
    _skill_button.text = "使用技能"
    _skill_button.position = Vector2(870, 670)
    _skill_button.custom_minimum_size = Vector2(150, 40)
    _skill_button.visible = false
    add_child(_skill_button)

    _info_panel = Panel.new()
    _info_panel.position = Vector2(700, 10)
    _info_panel.size = Vector2(570, 150)
    add_child(_info_panel)

    _info_label = RichTextLabel.new()
    _info_label.position = Vector2(710, 15)
    _info_label.size = Vector2(550, 140)
    _info_label.bbcode_enabled = true
    add_child(_info_label)

    _feedback_label = Label.new()
    _feedback_label.position = Vector2(540, 300)
    _feedback_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    _feedback_label.add_theme_font_size_override("font_size", 24)
    _feedback_label.visible = false
    add_child(_feedback_label)

func update_turn(turn: int, remaining: int) -> void:
    _turn_label.text = "回合 %d | 剩余 %d 回合" % [turn, remaining]

func update_ap(current: int, maximum: int) -> void:
    _ap_label.text = "行动点: %d / %d" % [current, maximum]

func update_satisfaction(value: float, threshold: float) -> void:
    _satisfaction_bar.value = value
    _satisfaction_label.text = "满意度: %.0f (需要 %.0f)" % [value, threshold]
    if value >= threshold:
        _satisfaction_bar.modulate = Color.GREEN
    elif value < 30:
        _satisfaction_bar.modulate = Color.RED
    else:
        _satisfaction_bar.modulate = Color.YELLOW

func update_tasks(tasks: Array[TaskData]) -> void:
    for child in _task_list.get_children():
        child.queue_free()
    for t in tasks:
        var lbl: Label = Label.new()
        var status: String = "进行中"
        if t.is_completed:
            status = "已完成"
        elif t.is_failed:
            status = "已失败"
        var type_name: String = ["布展", "宣传", "接待"][t.task_type]
        lbl.text = "%s - %s (%d/%d) [%s]" % [type_name, t.display_name, t.required_power, t.required_power + (3 - t.required_power), status]
        lbl.add_theme_font_size_override("font_size", 12)
        _task_list.add_child(lbl)

func show_unit_info(unit: Unit) -> void:
    var skill_text: String = ""
    if unit.is_skill_active():
        if unit.exhibition_bonus > 0:
            skill_text = " [布展+%d]" % unit.exhibition_bonus
        elif unit.publicity_bonus > 0:
            skill_text = " [宣传+%d]" % unit.publicity_bonus
        elif unit.reception_bonus > 0:
            skill_text = " [接待+%d]" % unit.reception_bonus
    _info_label.text = "[b]%s[/b]\n布展: %d | 宣传: %d | 接待: %d\nAP: %d/%d | 移动范围: %d%s" % [
        unit.data.display_name,
        unit.data.exhibition_power + unit.exhibition_bonus,
        unit.data.publicity_power + unit.publicity_bonus,
        unit.data.reception_power + unit.reception_bonus,
        unit.current_ap,
        unit.max_ap,
        unit.data.movement_range,
        skill_text
    ]
    _skill_button.visible = true
    _skill_button.disabled = unit.is_skill_active()
    if unit.is_skill_active():
        _skill_button.text = "技能已使用"
    else:
        _skill_button.text = "使用技能"

func hide_unit_info() -> void:
    _info_label.text = ""
    _skill_button.visible = false

func show_feedback(text: String, color: Color = Color.WHITE) -> void:
    _feedback_label.text = text
    _feedback_label.modulate = color
    _feedback_label.visible = true
    if _feedback_tween:
        _feedback_tween.kill()
    _feedback_tween = create_tween()
    _feedback_tween.tween_property(_feedback_label, "position:y", 250, 1.5).set_ease(Tween.EASE_OUT)
    _feedback_tween.parallel().tween_property(_feedback_label, "modulate:a", 0.0, 1.5).set_delay(0.5)
    _feedback_tween.tween_callback(func() -> void: _feedback_label.visible = false)

func get_end_turn_button() -> Button:
    return _end_turn_button

func get_skill_button() -> Button:
    return _skill_button

func get_satisfaction_bar() -> ProgressBar:
    return _satisfaction_bar
