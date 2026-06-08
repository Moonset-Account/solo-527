extends Node

const DEFAULT_VOLUME_MASTER := -6.0
const DEFAULT_VOLUME_BGM := -10.0
const DEFAULT_VOLUME_SFX := 0.0

const BUS_MASTER := "Master"
const BUS_BGM := "BGM"
const BUS_SFX := "SFX"

var _volume_master: float = DEFAULT_VOLUME_MASTER
var _volume_bgm: float = DEFAULT_VOLUME_BGM
var _volume_sfx: float = DEFAULT_VOLUME_SFX

var _sfx_players: Array = []
var _bgm_player: AudioStreamPlayer
const MAX_SFX_PLAYERS := 8

var _sfx_cache: Dictionary = {}

func _ready() -> void:
	_ensure_bus_exists(BUS_BGM, 1)
	_ensure_bus_exists(BUS_SFX, 2)
	_apply_volumes()

	_bgm_player = AudioStreamPlayer.new()
	_bgm_player.bus = BUS_BGM
	add_child(_bgm_player)

	for i in MAX_SFX_PLAYERS:
		var p := AudioStreamPlayer.new()
		p.bus = BUS_SFX
		add_child(p)
		_sfx_players.append(p)

	EventBus.audio_play.connect(_on_play_sfx)

func _ensure_bus_exists(bus_name: String, at_index: int) -> void:
	var audio_server := AudioServer
	if audio_server.get_bus_index(bus_name) == -1:
		audio_server.add_bus(at_index)
		audio_server.set_bus_name(at_index, bus_name)

func _apply_volumes() -> void:
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index(BUS_MASTER), _volume_master)
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index(BUS_BGM), _volume_bgm)
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index(BUS_SFX), _volume_sfx)

func set_master_volume(linear_value: float) -> void:
	_volume_master = linear_to_db(clampf(linear_value, 0.0, 1.0))
	_apply_volumes()

func set_bgm_volume(linear_value: float) -> void:
	_volume_bgm = linear_to_db(clampf(linear_value, 0.0, 1.0))
	_apply_volumes()

func set_sfx_volume(linear_value: float) -> void:
	_volume_sfx = linear_to_db(clampf(linear_value, 0.0, 1.0))
	_apply_volumes()

func get_master_volume_linear() -> float: return db_to_linear(_volume_master)
func get_bgm_volume_linear() -> float: return db_to_linear(_volume_bgm)
func get_sfx_volume_linear() -> float: return db_to_linear(_volume_sfx)

func linear_to_db(linear: float) -> float:
	if linear <= 0.001:
		return -80.0
	return 20.0 * log(linear) / log(10.0)

func db_to_linear(db: float) -> float:
	return pow(10.0, db / 20.0)

func play_sfx(sfx_id: String) -> void:
	var stream: AudioStream = _get_or_build_sfx(sfx_id)
	if stream == null:
		return
	for p in _sfx_players:
		if not p.playing:
			p.stream = stream
			p.play()
			return
	var first: AudioStreamPlayer = _sfx_players[0]
	first.stream = stream
	first.play()

func play_bgm(bgm_id: String, loop: bool = true) -> void:
	var stream: AudioStream = _get_or_build_bgm(bgm_id)
	if stream == null:
		return
	_bgm_player.stream = stream
	_bgm_player.finished.connect(func():
		if loop:
			_bgm_player.play()
	)
	_bgm_player.play()

func stop_bgm() -> void:
	if _bgm_player.playing:
		_bgm_player.stop()

func _on_play_sfx(sfx_id: String) -> void:
	play_sfx(sfx_id)

func _get_or_build_sfx(sfx_id: String) -> AudioStream:
	if _sfx_cache.has(sfx_id):
		return _sfx_cache[sfx_id]
	var gen: AudioStreamGenerator = AudioStreamGenerator.new()
	gen.mix_rate = 44100
	gen.buffer_length = 0.1
	var stream: AudioStream = gen
	match sfx_id:
		"click", "button_click":
			stream = _build_tone_sfx(880.0, 0.06, 0.3, "square")
		"move":
			stream = _build_tone_sfx(440.0, 0.08, 0.2, "sine")
		"task":
			stream = _build_tone_sfx(660.0, 0.12, 0.25, "triangle")
		"task_done", "success":
			stream = _build_chord_sfx([523.25, 659.25, 783.99], 0.3, 0.35)
		"turn":
			stream = _build_tone_sfx(330.0, 0.1, 0.3, "sawtooth")
		"warn", "fail":
			stream = _build_tone_sfx(200.0, 0.3, 0.4, "sawtooth")
		"select":
			stream = _build_tone_sfx(700.0, 0.04, 0.2, "square")
		"skill":
			stream = _build_chord_sfx([440.0, 554.37, 659.25], 0.2, 0.3)
		"event_story":
			stream = _build_tone_sfx(523.25, 0.5, 0.25, "sine")
		_:
			stream = _build_tone_sfx(600.0, 0.05, 0.2, "sine")
	_sfx_cache[sfx_id] = stream
	return stream

func _build_tone_sfx(freq: float, duration: float, amplitude: float, wave_type: String) -> AudioStreamWAV:
	var sample_rate := 44100
	var total_samples := int(duration * sample_rate)
	var data := PackedByteArray()
	data.resize(total_samples * 2)
	for i in total_samples:
		var t := float(i) / float(sample_rate)
		var envelope := 1.0
		var attack := 0.01
		var release := 0.05
		if t < attack:
			envelope = t / attack
		elif t > duration - release:
			envelope = max(0.0, (duration - t) / release)
		var sample := 0.0
		match wave_type:
			"sine":
				sample = sin(2.0 * PI * freq * t)
			"square":
				sample = 1.0 if sin(2.0 * PI * freq * t) >= 0.0 else -1.0
			"triangle":
				sample = 2.0 * abs(2.0 * (freq * t - floor(freq * t + 0.5))) - 1.0
			"sawtooth":
				sample = 2.0 * (freq * t - floor(freq * t + 0.5))
			_:
				sample = sin(2.0 * PI * freq * t)
		sample *= amplitude * envelope
		var s16: int = int(clampf(sample, -1.0, 1.0) * 32767.0)
		data[i * 2] = s16 & 0xFF
		data[i * 2 + 1] = (s16 >> 8) & 0xFF
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = sample_rate
	wav.stereo = false
	wav.data = data
	return wav

func _build_chord_sfx(freqs: Array, duration: float, amplitude: float) -> AudioStreamWAV:
	var sample_rate := 44100
	var total_samples := int(duration * sample_rate)
	var data := PackedByteArray()
	data.resize(total_samples * 2)
	for i in total_samples:
		var t := float(i) / float(sample_rate)
		var envelope := 1.0
		var attack := 0.02
		var release := 0.1
		if t < attack:
			envelope = t / attack
		elif t > duration - release:
			envelope = max(0.0, (duration - t) / release)
		var sample := 0.0
		for f in freqs:
			sample += sin(2.0 * PI * f * t)
		sample /= float(freqs.size())
		sample *= amplitude * envelope
		var s16: int = int(clampf(sample, -1.0, 1.0) * 32767.0)
		data[i * 2] = s16 & 0xFF
		data[i * 2 + 1] = (s16 >> 8) & 0xFF
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = sample_rate
	wav.stereo = false
	wav.data = data
	return wav

func _get_or_build_bgm(_bgm_id: String) -> AudioStream:
	var sample_rate := 44100
	var total_samples := int(8.0 * sample_rate)
	var data := PackedByteArray()
	data.resize(total_samples * 2)
	var melody := [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880.0, 698.46]
	var note_duration := 0.5
	for i in total_samples:
		var t := float(i) / float(sample_rate)
		var note_idx := int(t / note_duration) % melody.size()
		var note_t := fmod(t, note_duration)
		var envelope := 1.0
		var attack := 0.02
		var release := 0.08
		if note_t < attack:
			envelope = note_t / attack
		elif note_t > note_duration - release:
			envelope = max(0.0, (note_duration - note_t) / release)
		var sample := sin(2.0 * PI * melody[note_idx] * note_t) * 0.12 * envelope
		sample += sin(2.0 * PI * melody[note_idx] * 0.5 * note_t) * 0.06 * envelope
		var s16: int = int(clampf(sample, -1.0, 1.0) * 32767.0)
		data[i * 2] = s16 & 0xFF
		data[i * 2 + 1] = (s16 >> 8) & 0xFF
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = sample_rate
	wav.stereo = false
	wav.data = data
	return wav
