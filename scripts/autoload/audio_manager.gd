extends Node

var _sfx_players: Array[AudioStreamPlayer] = []
var _music_player: AudioStreamPlayer
var _sfx_cache: Dictionary = {}
var _initialized: bool = false

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_init_audio()
	_initialized = true

func _init_audio() -> void:
	for i in range(8):
		var player = AudioStreamPlayer.new()
		player.bus = "SFX"
		add_child(player)
		_sfx_players.append(player)
	_music_player = AudioStreamPlayer.new()
	_music_player.bus = "Music"
	add_child(_music_player)
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"), linear_to_db(0.8))
	if AudioServer.get_bus_index("SFX") == -1:
		AudioServer.add_bus()
		AudioServer.set_bus_name(AudioServer.bus_count - 1, "SFX")
		AudioServer.set_bus_send(AudioServer.bus_count - 1, "Master")
	if AudioServer.get_bus_index("Music") == -1:
		AudioServer.add_bus()
		AudioServer.set_bus_name(AudioServer.bus_count - 1, "Music")
		AudioServer.set_bus_send(AudioServer.bus_count - 1, "Master")

func play_sfx(name: String, pitch_variation: float = 0.1) -> void:
	if not _initialized:
		return
	var stream = _get_or_create_sfx(name)
	if stream == null:
		stream = _generate_sfx(name)
		if stream == null:
			return
		_sfx_cache[name] = stream
	var player = _get_available_player()
	if player:
		player.stream = stream
		player.pitch_scale = 1.0 + randf_range(-pitch_variation, pitch_variation)
		player.volume_db = linear_to_db(SaveManager.get_setting("sfx_volume", 1.0))
		player.play()

func play_music(name: String) -> void:
	var stream = _generate_music(name)
	if stream:
		_music_player.stream = stream
		_music_player.volume_db = linear_to_db(SaveManager.get_setting("music_volume", 0.6))
		_music_player.play()

func stop_music() -> void:
	_music_player.stop()

func set_sfx_volume(vol: float) -> void:
	var idx = AudioServer.get_bus_index("SFX")
	if idx >= 0:
		AudioServer.set_bus_volume_db(idx, linear_to_db(vol))

func set_music_volume(vol: float) -> void:
	var idx = AudioServer.get_bus_index("Music")
	if idx >= 0:
		AudioServer.set_bus_volume_db(idx, linear_to_db(vol))

func _get_available_player() -> AudioStreamPlayer:
	for player in _sfx_players:
		if not player.playing:
			return player
	_sfx_players[0].stop()
	return _sfx_players[0]

func _get_or_create_sfx(name: String) -> AudioStream:
	if _sfx_cache.has(name):
		return _sfx_cache[name]
	return null

func _generate_sfx(name: String) -> AudioStream:
	var stream = AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = 22050
	stream.stereo = false
	var samples = PackedByteArray()
	match name:
		"place":
			samples = _gen_thud(0.15)
		"pickup":
			samples = _gen_pickup(0.1)
		"rotate":
			samples = _gen_click(0.05)
		"glass_break":
			samples = _gen_break(0.3)
		"undo":
			samples = _gen_swoosh(0.1)
		"collision":
			samples = _gen_bump(0.08)
		"success":
			samples = _gen_chime(0.4)
		"fail":
			samples = _gen_buzz(0.3)
		"button":
			samples = _gen_click(0.03)
		_:
			samples = _gen_click(0.02)
	stream.data = samples
	return stream

func _generate_music(name: String) -> AudioStream:
	var stream = AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = 22050
	stream.stereo = false
	var samples = PackedByteArray()
	match name:
		"menu":
			samples = _gen_ambient_loop(2.0)
		"game":
			samples = _gen_ambient_loop(3.0)
		_:
			samples = _gen_ambient_loop(2.0)
	stream.data = samples
	return stream

func _gen_thud(duration: float) -> PackedByteArray:
	var count = int(22050 * duration)
	var data = PackedByteArray()
	data.resize(count * 2)
	for i in count:
		var t = float(i) / 22050.0
		var val = int(16000.0 * exp(-t * 30.0) * sin(t * 200.0))
		val = clampi(val, -32768, 32767)
		data.encode_s16(i * 2, val)
	return data

func _gen_pickup(duration: float) -> PackedByteArray:
	var count = int(22050 * duration)
	var data = PackedByteArray()
	data.resize(count * 2)
	for i in count:
		var t = float(i) / 22050.0
		var freq = 400.0 + t * 800.0
		var val = int(10000.0 * exp(-t * 15.0) * sin(t * freq))
		val = clampi(val, -32768, 32767)
		data.encode_s16(i * 2, val)
	return data

func _gen_click(duration: float) -> PackedByteArray:
	var count = int(22050 * duration)
	var data = PackedByteArray()
	data.resize(count * 2)
	for i in count:
		var t = float(i) / 22050.0
		var val = int(12000.0 * exp(-t * 80.0) * sin(t * 1200.0))
		val = clampi(val, -32768, 32767)
		data.encode_s16(i * 2, val)
	return data

func _gen_break(duration: float) -> PackedByteArray:
	var count = int(22050 * duration)
	var data = PackedByteArray()
	data.resize(count * 2)
	for i in count:
		var t = float(i) / 22050.0
		var noise = randf_range(-1.0, 1.0)
		var val = int(12000.0 * exp(-t * 8.0) * noise * sin(t * 3000.0))
		val = clampi(val, -32768, 32767)
		data.encode_s16(i * 2, val)
	return data

func _gen_swoosh(duration: float) -> PackedByteArray:
	var count = int(22050 * duration)
	var data = PackedByteArray()
	data.resize(count * 2)
	for i in count:
		var t = float(i) / 22050.0
		var freq = 800.0 - t * 600.0
		var val = int(8000.0 * exp(-t * 10.0) * sin(t * freq))
		val = clampi(val, -32768, 32767)
		data.encode_s16(i * 2, val)
	return data

func _gen_bump(duration: float) -> PackedByteArray:
	var count = int(22050 * duration)
	var data = PackedByteArray()
	data.resize(count * 2)
	for i in count:
		var t = float(i) / 22050.0
		var val = int(10000.0 * exp(-t * 40.0) * sin(t * 150.0))
		val = clampi(val, -32768, 32767)
		data.encode_s16(i * 2, val)
	return data

func _gen_chime(duration: float) -> PackedByteArray:
	var count = int(22050 * duration)
	var data = PackedByteArray()
	data.resize(count * 2)
	var freqs = [523.0, 659.0, 784.0]
	for i in count:
		var t = float(i) / 22050.0
		var val = 0.0
		for f in freqs:
			val += sin(t * f) * exp(-t * 3.0) * 5000.0
		val = clampi(int(val), -32768, 32767)
		data.encode_s16(i * 2, int(val))
	return data

func _gen_buzz(duration: float) -> PackedByteArray:
	var count = int(22050 * duration)
	var data = PackedByteArray()
	data.resize(count * 2)
	for i in count:
		var t = float(i) / 22050.0
		var val = int(8000.0 * exp(-t * 5.0) * sign(sin(t * 150.0)))
		val = clampi(val, -32768, 32767)
		data.encode_s16(i * 2, val)
	return data

func _gen_ambient_loop(duration: float) -> PackedByteArray:
	var count = int(22050 * duration)
	var data = PackedByteArray()
	data.resize(count * 2)
	for i in count:
		var t = float(i) / 22050.0
		var val = int(3000.0 * (sin(t * 220.0) * 0.3 + sin(t * 330.0) * 0.2 + sin(t * 440.0) * 0.1) * exp(-fmod(t, 2.0) * 0.5))
		val = clampi(val, -32768, 32767)
		data.encode_s16(i * 2, val)
	return data
