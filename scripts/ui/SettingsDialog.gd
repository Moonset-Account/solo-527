extends AcceptDialog

var tab_container: TabContainer
var audio_tab: VBoxContainer
var input_tab: VBoxContainer
var gameplay_tab: VBoxContainer

var master_volume_slider: HSlider
var bgm_volume_slider: HSlider
var sfx_volume_slider: HSlider
var fullscreen_checkbox: CheckBox
var hints_checkbox: CheckBox
var input_mode_option: OptionButton
var reset_progress_button: Button
var close_button: Button

func _ready() -> void:
    title = "⚙️  游戏设置"
    unresizable = false
    custom_minimum_size = Vector2(520, 500)
    
    if not _is_children_ready():
        _build_ui()
    
    _load_settings()
    _connect_signals()

func _is_children_ready() -> bool:
    return master_volume_slider != null

func _build_ui() -> void:
    tab_container = TabContainer.new()
    tab_container.custom_minimum_size = Vector2(500, 400)
    tab_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    tab_container.size_flags_vertical = Control.SIZE_EXPAND_FILL
    add_child(tab_container)
    
    audio_tab = _create_tab("🔊 音频")
    input_tab = _create_tab("🎮 输入")
    gameplay_tab = _create_tab("🎯 游戏")
    tab_container.add_child(audio_tab)
    tab_container.add_child(input_tab)
    tab_container.add_child(gameplay_tab)
    
    _build_audio_tab()
    _build_input_tab()
    _build_gameplay_tab()
    
    var btn_row = HBoxContainer.new()
    btn_row.add_theme_constant_override("separation", 10)
    btn_row.alignment = BoxContainer.ALIGNMENT_END
    btn_row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    btn_row.custom_minimum_size = Vector2(0, 50)
    add_child(btn_row)
    
    reset_progress_button = Button.new()
    reset_progress_button.text = "🗑️ 重置进度"
    reset_progress_button.custom_minimum_size = Vector2(140, 40)
    btn_row.add_child(reset_progress_button)
    
    close_button = Button.new()
    close_button.text = "✓ 关闭"
    close_button.custom_minimum_size = Vector2(120, 40)
    btn_row.add_child(close_button)

func _create_tab(name: String) -> VBoxContainer:
    var scroll = ScrollContainer.new()
    scroll.name = name
    scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
    
    var vbox = VBoxContainer.new()
    vbox.add_theme_constant_override("separation", 16)
    vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    scroll.add_child(vbox)
    
    return vbox

func _add_section_header(parent: VBoxContainer, text: String) -> void:
    var label = Label.new()
    label.text = text
    label.add_theme_font_size_override("font_size", 16)
    label.modulate = Color(0.9, 0.8, 0.6)
    parent.add_child(label)
    
    var sep = HSeparator.new()
    sep.custom_minimum_size = Vector2(0, 8)
    parent.add_child(sep)

func _add_slider(parent: VBoxContainer, label_text: String, value: float) -> HSlider:
    var label = Label.new()
    label.text = "%s: %d%%" % [label_text, int(value * 100)]
    parent.add_child(label)
    
    var slider = HSlider.new()
    slider.min_value = 0.0
    slider.max_value = 1.0
    slider.step = 0.05
    slider.value = value
    slider.custom_minimum_size = Vector2(0, 30)
    parent.add_child(slider)
    
    slider.value_changed.connect(func(v): label.text = "%s: %d%%" % [label_text, int(v * 100)])
    
    return slider

func _build_audio_tab() -> void:
    _add_section_header(audio_tab, "音量设置")
    master_volume_slider = _add_slider(audio_tab, "主音量", AudioManager.get_master_volume())
    bgm_volume_slider = _add_slider(audio_tab, "背景音乐", AudioManager.get_bgm_volume())
    sfx_volume_slider = _add_slider(audio_tab, "音效", AudioManager.get_sfx_volume())

func _build_input_tab() -> void:
    _add_section_header(input_tab, "输入方式")
    
    var mode_label = Label.new()
    mode_label.text = "当前输入: " + InputMapper.get_input_mode_name()
    input_tab.add_child(mode_label)
    
    var option_label = Label.new()
    option_label.text = "默认输入方式:"
    input_tab.add_child(option_label)
    
    input_mode_option = OptionButton.new()
    input_mode_option.add_item("自动检测", 0)
    input_mode_option.add_item("键盘/鼠标", 1)
    input_mode_option.add_item("游戏手柄", 2)
    input_mode_option.add_item("触屏", 3)
    input_mode_option.custom_minimum_size = Vector2(0, 35)
    input_tab.add_child(input_mode_option)
    
    _add_section_header(input_tab, "操作说明")
    var hints = InputMapper.get_all_action_hints()
    for action in hints.keys():
        var row = HBoxContainer.new()
        row.add_theme_constant_override("separation", 10)
        input_tab.add_child(row)
        
        var action_names = {
            "ui_accept": "确认/选择",
            "ui_cancel": "取消/返回",
            "game_purchase": "采购",
            "game_sell": "销售",
            "game_inventory": "背包",
            "game_next_phase": "下一阶段",
            "game_pause": "暂停",
            "ui_up": "上",
            "ui_down": "下",
            "ui_left": "左",
            "ui_right": "右"
        }
        var name_lbl = Label.new()
        name_lbl.text = action_names.get(action, action)
        name_lbl.custom_minimum_size = Vector2(100, 0)
        row.add_child(name_lbl)
        
        var key_lbl = Label.new()
        key_lbl.text = hints[action]
        key_lbl.modulate = Color(0.3, 0.7, 1.0)
        row.add_child(key_lbl)

func _build_gameplay_tab() -> void:
    _add_section_header(gameplay_tab, "显示设置")
    fullscreen_checkbox = CheckBox.new()
    fullscreen_checkbox.text = "全屏模式"
    fullscreen_checkbox.custom_minimum_size = Vector2(0, 30)
    gameplay_tab.add_child(fullscreen_checkbox)
    
    hints_checkbox = CheckBox.new()
    hints_checkbox.text = "显示新手引导和操作提示"
    hints_checkbox.custom_minimum_size = Vector2(0, 30)
    gameplay_tab.add_child(hints_checkbox)
    
    _add_section_header(gameplay_tab, "数据管理")
    var data_lbl = Label.new()
    var total_money = SaveManager.total_money_earned
    var games = SaveManager.games_played
    var completed = 0
    for level_id in SaveManager.level_progress.keys():
        if SaveManager.level_progress[level_id].get("completed", false):
            completed += 1
    data_lbl.text = "累计赚取: %d 金币\n游玩次数: %d\n完成关卡: %d" % [total_money, games, completed]
    gameplay_tab.add_child(data_lbl)

func _load_settings() -> void:
    var s = SaveManager.settings
    master_volume_slider.value = s.get("master_volume", 0.8)
    bgm_volume_slider.value = s.get("bgm_volume", 0.6)
    sfx_volume_slider.value = s.get("sfx_volume", 0.9)
    fullscreen_checkbox.button_pressed = s.get("fullscreen", false)
    hints_checkbox.button_pressed = s.get("show_hints", true)
    input_mode_option.selected = int(s.get("input_mode", 0))

func _connect_signals() -> void:
    master_volume_slider.value_changed.connect(_on_master_volume_changed)
    bgm_volume_slider.value_changed.connect(_on_bgm_volume_changed)
    sfx_volume_slider.value_changed.connect(_on_sfx_volume_changed)
    fullscreen_checkbox.toggled.connect(_on_fullscreen_toggled)
    hints_checkbox.toggled.connect(_on_hints_toggled)
    input_mode_option.item_selected.connect(_on_input_mode_selected)
    reset_progress_button.pressed.connect(_on_reset_progress_pressed)
    close_button.pressed.connect(_on_close_pressed)
    canceled.connect(_on_close_pressed)

func _on_master_volume_changed(value: float) -> void:
    AudioManager.set_master_volume(value)
    SaveManager.update_setting("master_volume", value)

func _on_bgm_volume_changed(value: float) -> void:
    AudioManager.set_bgm_volume(value)
    SaveManager.update_setting("bgm_volume", value)

func _on_sfx_volume_changed(value: float) -> void:
    AudioManager.set_sfx_volume(value)
    SaveManager.update_setting("sfx_volume", value)
    AudioManager.play_sfx("coin")

func _on_fullscreen_toggled(pressed: bool) -> void:
    SaveManager.update_setting("fullscreen", pressed)

func _on_hints_toggled(pressed: bool) -> void:
    SaveManager.update_setting("show_hints", pressed)
    UIState.show_hints(pressed)

func _on_input_mode_selected(index: int) -> void:
    SaveManager.update_setting("input_mode", index)
    if index > 0:
        InputMapper.set_input_mode(int(index - 1))

func _on_reset_progress_pressed() -> void:
    AudioManager.play_sfx("click")
    var confirm = ConfirmationDialog.new()
    confirm.title = "⚠️ 确认重置"
    confirm.dialog_text = "确定要重置所有游戏进度吗？\n此操作无法撤销！"
    confirm.confirmed.connect(func():
        SaveManager.reset_progress()
        AudioManager.play_sfx("success")
        var info = AcceptDialog.new()
        info.title = "✓ 进度已重置"
        info.dialog_text = "游戏进度已成功重置。"
        add_child(info)
        info.popup_centered()
    )
    add_child(confirm)
    confirm.popup_centered()

func _on_close_pressed() -> void:
    AudioManager.play_sfx("click")
    UIState.close_dialog()
    queue_free()
