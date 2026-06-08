class_name SettingsMenu
extends Control

var _master_slider: HSlider = null
var _bgm_slider: HSlider = null
var _sfx_slider: HSlider = null
var _back_button: Button = null
var _master_label: Label = null
var _bgm_label: Label = null
var _sfx_label: Label = null

func _ready() -> void:
    var vbox: VBoxContainer = VBoxContainer.new()
    vbox.position = Vector2(390, 150)
    vbox.add_theme_constant_override("separation", 20)
    add_child(vbox)

    var title: Label = Label.new()
    title.text = "设置"
    title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    title.add_theme_font_size_override("font_size", 32)
    vbox.add_child(title)

    _master_label = Label.new()
    _master_label.text = "主音量: 100%"
    vbox.add_child(_master_label)
    _master_slider = HSlider.new()
    _master_slider.min_value = 0.0
    _master_slider.max_value = 100.0
    _master_slider.value = 100.0
    _master_slider.min_size = Vector2(500, 30)
    _master_slider.value_changed.connect(_on_master_changed)
    vbox.add_child(_master_slider)

    _bgm_label = Label.new()
    _bgm_label.text = "背景音乐: 70%"
    vbox.add_child(_bgm_label)
    _bgm_slider = HSlider.new()
    _bgm_slider.min_value = 0.0
    _bgm_slider.max_value = 100.0
    _bgm_slider.value = 70.0
    _bgm_slider.min_size = Vector2(500, 30)
    _bgm_slider.value_changed.connect(_on_bgm_changed)
    vbox.add_child(_bgm_slider)

    _sfx_label = Label.new()
    _sfx_label.text = "音效: 100%"
    vbox.add_child(_sfx_label)
    _sfx_slider = HSlider.new()
    _sfx_slider.min_value = 0.0
    _sfx_slider.max_value = 100.0
    _sfx_slider.value = 100.0
    _sfx_slider.min_size = Vector2(500, 30)
    _sfx_slider.value_changed.connect(_on_sfx_changed)
    vbox.add_child(_sfx_slider)

    _back_button = Button.new()
    _back_button.text = "返回"
    _back_button.min_size = Vector2(200, 50)
    vbox.add_child(_back_button)
    _back_button.pressed.connect(_on_back)

func _on_master_changed(value: float) -> void:
    _master_label.text = "主音量: %d%%" % int(value)
    AudioManager.set_master_volume(value / 100.0)

func _on_bgm_changed(value: float) -> void:
    _bgm_label.text = "背景音乐: %d%%" % int(value)
    AudioManager.set_bgm_volume(value / 100.0)

func _on_sfx_changed(value: float) -> void:
    _sfx_label.text = "音效: %d%%" % int(value)
    AudioManager.set_sfx_volume(value / 100.0)

func _on_back() -> void:
    SceneManager.change_scene("res://scenes/main_menu.tscn")
