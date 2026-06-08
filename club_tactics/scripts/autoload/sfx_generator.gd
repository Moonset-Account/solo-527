class_name SFXGenerator
extends Node

var _audio_player: AudioStreamPlayer = null

func _ready() -> void:
	_audio_player = AudioStreamPlayer.new()
	add_child(_audio_player)

func play_click() -> void:
	_play_tone(800.0, 0.05, -10.0)

func play_move() -> void:
	_play_tone(440.0, 0.1, -8.0)

func play_task_complete() -> void:
	_play_tone(660.0, 0.15, -5.0)
	await get_tree().create_timer(0.1).timeout
	_play_tone(880.0, 0.2, -5.0)

func play_task_fail() -> void:
	_play_tone(330.0, 0.2, -5.0)
	await get_tree().create_timer(0.15).timeout
	_play_tone(220.0, 0.3, -5.0)

func play_event() -> void:
	_play_tone(550.0, 0.1, -8.0)
	await get_tree().create_timer(0.1).timeout
	_play_tone(770.0, 0.15, -8.0)

func _play_tone(freq: float, duration: float, volume_db: float) -> void:
	var stream: AudioStreamWAV = AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = 22050
	var samples: int = int(22050 * duration)
	var data: PackedByteArray = PackedByteArray()
	data.resize(samples * 2)
	for i in samples:
		var t: float = float(i) / 22050.0
		var val: float = sin(t * freq * TAU) * 0.3
		val *= maxf(1.0 - t / duration, 0.0)
		var sample: int = int(val * 32767.0)
		sample = clampi(sample, -32768, 32767)
		data.encode_s16(i * 2, sample)
	stream.data = data
	_audio_player.volume_db = volume_db
	_audio_player.stream = stream
	_audio_player.play()
