extends Control

signal closed

@onready var music_slider: HSlider = $VBoxContainer/MusicBox/MusicSlider
@onready var sfx_slider: HSlider = $VBoxContainer/SfxBox/SfxSlider
@onready var close_button: Button = $VBoxContainer/CloseButton
@onready var music_value_label: Label = $VBoxContainer/MusicBox/MusicValue
@onready var sfx_value_label: Label = $VBoxContainer/SfxBox/SfxValue

func _ready() -> void:
	music_slider.value = AudioManager.get_music_volume() * 100
	sfx_slider.value = AudioManager.get_sfx_volume() * 100
	_update_labels()
	music_slider.value_changed.connect(_on_music_changed)
	sfx_slider.value_changed.connect(_on_sfx_changed)
	close_button.pressed.connect(_on_close)

func _on_music_changed(value: float) -> void:
	AudioManager.set_music_volume(value / 100.0)
	_update_labels()

func _on_sfx_changed(value: float) -> void:
	AudioManager.set_sfx_volume(value / 100.0)
	_update_labels()

func _update_labels() -> void:
	music_value_label.text = "%d%%" % int(music_slider.value)
	sfx_value_label.text = "%d%%" % int(sfx_slider.value)

func _on_close() -> void:
	closed.emit()
	SaveManager.save_game()
	queue_free()

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		_on_close()
		get_viewport().set_input_as_handled()
