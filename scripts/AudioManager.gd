extends Node

var sfx_bus: int = 0
var music_bus: int = 1
var sfx_players: Dictionary = {}
var music_player: AudioStreamPlayer = null
var ambient_player: AudioStreamPlayer = null

enum SFX {
	GRAB,
	DROP,
	DROP_INVALID,
	ROTATE,
	PLACE,
	PLACE_FAIL,
	UNDO,
	REDO,
	STAR,
	FRAGILE_WARN,
	FRAGILE_BREAK,
	WEIGHT_WARN,
	BUTTON_CLICK,
	BUTTON_HOVER,
	LEVEL_COMPLETE,
	LEVEL_FAIL,
	TIME_WARNING,
	MISTAKE,
	UNLOCK,
	TICK
}

var sfx_cache: Dictionary = {}
var _sfx_config: Dictionary = {}

func _ready() -> void:
	_init_buses()
	_init_players()
	_build_sfx_config()
	_apply_volume_settings()

func _init_buses() -> void:
	sfx_bus = AudioServer.get_bus_index("SFX")
	if sfx_bus == -1:
		sfx_bus = 0
	music_bus = AudioServer.get_bus_index("Music")
	if music_bus == -1:
		music_bus = 1

func _init_players() -> void:
	music_player = AudioStreamPlayer.new()
	music_player.bus = &"Music"
	add_child(music_player)
	ambient_player = AudioStreamPlayer.new()
	ambient_player.bus = &"Music"
	ambient_player.volume_db = -10.0
	add_child(ambient_player)
	for i in range(8):
		var p: AudioStreamPlayer = AudioStreamPlayer.new()
		p.bus = &"SFX"
		p.name = "SFXPlayer_%d" % i
		add_child(p)
		sfx_players[i] = p

func _build_sfx_config() -> void:
	_sfx_config = {
		SFX.GRAB: {"freq": 440.0, "duration": 0.06, "type": "square", "volume": -8.0},
		SFX.DROP: {"freq": 220.0, "duration": 0.1, "type": "triangle", "volume": -6.0},
		SFX.DROP_INVALID: {"freq": 110.0, "duration": 0.15, "type": "sawtooth", "volume": -10.0},
		SFX.ROTATE: {"freq": 660.0, "duration": 0.04, "type": "square", "volume": -12.0},
		SFX.PLACE: {"freq": 523.25, "duration": 0.08, "type": "sine", "volume": -5.0},
		SFX.PLACE_FAIL: {"freq": 196.0, "duration": 0.12, "type": "sawtooth", "volume": -8.0},
		SFX.UNDO: {"freq": 349.23, "duration": 0.07, "type": "triangle", "volume": -10.0},
		SFX.REDO: {"freq": 392.0, "duration": 0.07, "type": "triangle", "volume": -10.0},
		SFX.STAR: {"freq": 1046.5, "duration": 0.15, "type": "sine", "volume": -3.0},
		SFX.FRAGILE_WARN: {"freq": 880.0, "duration": 0.2, "type": "sine", "volume": -10.0},
		SFX.FRAGILE_BREAK: {"freq": 80.0, "duration": 0.3, "type": "sawtooth", "volume": -4.0},
		SFX.WEIGHT_WARN: {"freq": 146.83, "duration": 0.25, "type": "square", "volume": -6.0},
		SFX.BUTTON_CLICK: {"freq": 587.33, "duration": 0.05, "type": "square", "volume": -10.0},
		SFX.BUTTON_HOVER: {"freq": 783.99, "duration": 0.03, "type": "sine", "volume": -14.0},
		SFX.LEVEL_COMPLETE: {"chord": [523.25, 659.25, 783.99], "duration": 0.4, "type": "sine", "volume": -3.0},
		SFX.LEVEL_FAIL: {"chord": [293.66, 246.94, 196.0], "duration": 0.5, "type": "sawtooth", "volume": -5.0},
		SFX.TIME_WARNING: {"freq": 880.0, "duration": 0.1, "type": "square", "volume": -8.0},
		SFX.MISTAKE: {"freq": 220.0, "duration": 0.15, "type": "sawtooth", "volume": -7.0},
		SFX.UNLOCK: {"chord": [659.25, 783.99, 1046.5], "duration": 0.3, "type": "triangle", "volume": -4.0},
		SFX.TICK: {"freq": 1200.0, "duration": 0.02, "type": "square", "volume": -16.0}
	}

func _apply_volume_settings() -> void:
	set_master_volume(SaveManager.get_setting("master_volume", 0.8))
	set_music_volume(SaveManager.get_setting("music_volume", 0.6))
	set_sfx_volume(SaveManager.get_setting("sfx_volume", 0.9))

func play_sfx(sfx_id: int) -> void:
	if not _sfx_config.has(sfx_id):
		return
	var config: Dictionary = _sfx_config[sfx_id]
	if config.has("chord"):
		var chord: Array = config["chord"]
		for i in range(chord.size()):
			_play_tone(chord[i], config["duration"] + (i * 0.05), config["type"], config["volume"])
	else:
		_play_tone(config["freq"], config["duration"], config["type"], config["volume"])

func _play_tone(frequency: float, duration: float, wave_type: String, volume_db: float) -> void:
	var player := _get_free_sfx_player()
	if player == null:
		return
	var stream: AudioStreamWAV = _generate_tone(frequency, duration, wave_type)
	if stream == null:
		return
	player.volume_db = volume_db
	player.stream = stream
	player.play()

func _get_free_sfx_player() -> AudioStreamPlayer:
	for i in sfx_players:
		var p: AudioStreamPlayer = sfx_players[i]
		if not p.playing:
			return p
	var new_p: AudioStreamPlayer = AudioStreamPlayer.new()
	new_p.bus = &"SFX"
	add_child(new_p)
	sfx_players[sfx_players.size()] = new_p
	return new_p

func _generate_tone(frequency: float, duration: float, wave_type: String) -> AudioStreamWAV:
	var sample_rate: int = 44100
	var mix_rate: int = sample_rate
	var phase: float = 0.0
	var amplitude: float = 0.5
	var total_samples: int = int(duration * mix_rate)
	var data: PackedByteArray = PackedByteArray()
	data.resize(total_samples * 2)
	var phase_increment: float = TAU * frequency / mix_rate
	for i in range(total_samples):
		var t: float = float(i) / total_samples
		var env: float = 1.0
		if t < 0.05:
			env = t / 0.05
		elif t > 0.7:
			env = max(0.0, 1.0 - (t - 0.7) / 0.3)
		var sample_val: float = 0.0
		match wave_type:
			"sine":
				sample_val = sin(phase) * amplitude * env
			"square":
				sample_val = (1.0 if sin(phase) > 0 else -1.0) * amplitude * env * 0.6
			"triangle":
				var p: float = fmod(phase / TAU + 0.25, 1.0)
				sample_val = (4.0 * abs(p - 0.5) - 1.0) * amplitude * env
			"sawtooth":
				var p2: float = fmod(phase / TAU, 1.0)
				sample_val = (2.0 * p2 - 1.0) * amplitude * env * 0.7
			_:
				sample_val = sin(phase) * amplitude * env
		phase += phase_increment
		var sample_i16: int = clamp(int(sample_val * 32767.0), -32768, 32767)
		var idx: int = i * 2
		data[idx] = sample_i16 & 0xFF
		data[idx + 1] = (sample_i16 >> 8) & 0xFF
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = mix_rate
	stream.stereo = false
	stream.data = data
	return stream

func play_music(music_type: String = "menu") -> void:
	if music_player.playing:
		music_player.stop()
	var freq_map: Dictionary = {
		"menu": 261.63,
		"game": 329.63,
		"result": 392.0,
		"credits": 349.23
	}
	var base_freq: float = freq_map.get(music_type, 261.63)
	var duration: float = 8.0
	var sample_rate: int = 22050
	var total_samples: int = int(duration * sample_rate)
	var data: PackedByteArray = PackedByteArray()
	data.resize(total_samples * 2)
	var melody: Array = [base_freq, base_freq * 1.25, base_freq * 1.5, base_freq * 1.25, base_freq * 1.333, base_freq * 1.5, base_freq * 1.667, base_freq]
	var note_duration: float = duration / melody.size()
	for i in range(total_samples):
		var t: float = float(i) / sample_rate
		var note_idx: int = int(t / note_duration)
		note_idx = min(note_idx, melody.size() - 1)
		var note_t: float = fmod(t, note_duration) / note_duration
		var env: float = 0.0
		if note_t < 0.1:
			env = note_t / 0.1
		elif note_t < 0.7:
			env = 1.0
		else:
			env = max(0.0, 1.0 - (note_t - 0.7) / 0.3)
		var phase: float = t * TAU * melody[note_idx]
		var sample_val: float = sin(phase) * 0.3 * env
		sample_val += sin(phase * 2.0) * 0.1 * env
		var sample_i16: int = clamp(int(sample_val * 32767.0), -32768, 32767)
		var idx: int = i * 2
		data[idx] = sample_i16 & 0xFF
		data[idx + 1] = (sample_i16 >> 8) & 0xFF
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = sample_rate
	stream.stereo = false
	stream.data = data
	music_player.stream = stream
	music_player.volume_db = -12.0
	music_player.play(0.0)

func stop_music() -> void:
	if music_player.playing:
		var tween := create_tween()
		tween.tween_property(music_player, "volume_db", -60.0, 0.5)
		tween.tween_callback(music_player.stop)

func set_master_volume(value: float) -> void:
	AudioServer.set_bus_volume_db(0, linear_to_db(clamp(value, 0.0, 1.0)))

func set_music_volume(value: float) -> void:
	AudioServer.set_bus_volume_db(music_bus, linear_to_db(clamp(value, 0.0, 1.0)))

func set_sfx_volume(value: float) -> void:
	AudioServer.set_bus_volume_db(sfx_bus, linear_to_db(clamp(value, 0.0, 1.0)))

func linear_to_db(value: float) -> float:
	if value <= 0.0001:
		return -80.0
	return 20.0 * log10(clamp(value, 0.0001, 1.0))
