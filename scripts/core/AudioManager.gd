extends Node

const SFX_LIBRARY := {
	"ui_click": {"freq": 800, "duration": 0.06, "wave": 2, "volume": 0.7},
	"ui_hover": {"freq": 600, "duration": 0.03, "wave": 2, "volume": 0.4},
	"card_pickup": {"freq": 440, "duration": 0.08, "wave": 1, "volume": 0.6},
	"card_place": {"freq": 330, "duration": 0.1, "wave": 3, "volume": 0.6},
	"card_remove": {"freq": 220, "duration": 0.08, "wave": 3, "volume": 0.5},
	"card_swap": {"freq": 520, "duration": 0.07, "wave": 2, "volume": 0.5},
	"tag_add": {"freq": 880, "duration": 0.09, "wave": 2, "volume": 0.5},
	"tag_remove": {"freq": 660, "duration": 0.07, "wave": 2, "volume": 0.4},
	"link_add": {"freq": 740, "duration": 0.12, "wave": 1, "volume": 0.5},
	"link_remove": {"freq": 370, "duration": 0.09, "wave": 1, "volume": 0.4},
	"hint_reveal": {"freq": 587, "duration": 0.15, "wave": 0, "volume": 0.5},
	"submit_fail": {"freq": 180, "duration": 0.2, "wave": 3, "volume": 0.6},
	"level_complete": {"chord": [523, 659, 784, 1047], "duration": 0.5, "wave": 0, "volume": 0.7},
	"level_fail": {"freq": 150, "duration": 0.4, "wave": 3, "volume": 0.6},
	"feedback_success": {"freq": 1046, "duration": 0.1, "wave": 0, "volume": 0.5},
	"feedback_warning": {"freq": 392, "duration": 0.15, "wave": 1, "volume": 0.5},
	"feedback_error": {"freq": 261, "duration": 0.2, "wave": 3, "volume": 0.6},
	"drag_start": {"freq": 500, "duration": 0.04, "wave": 2, "volume": 0.4},
	"drag_end": {"freq": 350, "duration": 0.04, "wave": 2, "volume": 0.4}
}

var music_player: AudioStreamPlayer
var sfx_player: AudioStreamPlayer
var ui_player: AudioStreamPlayer
var master_bus: String = "Master"
var music_bus: String = "Music"
var sfx_bus: String = "SFX"
var ui_bus: String = "UI"
var _initialized: bool = false

func _ready() -> void:
	_initialize_buses()
	_create_players()
	_apply_volume_settings()
	EventBus.audio_play.connect(_on_audio_play)
	_initialized = true

func _initialize_buses() -> void:
	var buses: Array = [
		{"name": music_bus, "parent": master_bus},
		{"name": sfx_bus, "parent": master_bus},
		{"name": ui_bus, "parent": master_bus}
	]
	for b: Dictionary in buses:
		if AudioServer.get_bus_index(b.name) == -1:
			AudioServer.add_bus()
			var idx: int = AudioServer.get_bus_count() - 1
			AudioServer.set_bus_name(idx, b.name)

func _create_players() -> void:
	music_player = AudioStreamPlayer.new()
	music_player.bus = music_bus
	add_child(music_player)
	sfx_player = AudioStreamPlayer.new()
	sfx_player.bus = sfx_bus
	add_child(sfx_player)
	ui_player = AudioStreamPlayer.new()
	ui_player.bus = ui_bus
	add_child(ui_player)

func _apply_volume_settings() -> void:
	var master_db: float = float(SaveManager.get_setting("audio.master_volume", 0.0))
	var music_db: float = float(SaveManager.get_setting("audio.music_volume", -5.0))
	var sfx_db: float = float(SaveManager.get_setting("audio.sfx_volume", -3.0))
	var ui_db: float = float(SaveManager.get_setting("audio.ui_volume", -2.0))
	var master_idx: int = AudioServer.get_bus_index(master_bus)
	if master_idx >= 0:
		AudioServer.set_bus_volume_db(master_idx, master_db)
	var music_idx: int = AudioServer.get_bus_index(music_bus)
	if music_idx >= 0:
		AudioServer.set_bus_volume_db(music_idx, music_db)
	var sfx_idx: int = AudioServer.get_bus_index(sfx_bus)
	if sfx_idx >= 0:
		AudioServer.set_bus_volume_db(sfx_idx, sfx_db)
	var ui_idx: int = AudioServer.get_bus_index(ui_bus)
	if ui_idx >= 0:
		AudioServer.set_bus_volume_db(ui_idx, ui_db)

func _on_audio_play(sound_id: String, volume_db: float = -5.0) -> void:
	play_sfx(sound_id, volume_db)

func play_sfx(sound_id: String, volume_db: float = 0.0) -> void:
	if not _initialized:
		return
	var config: Variant = SFX_LIBRARY.get(sound_id, null)
	if not config:
		return
	var stream: AudioStream = _create_sfx_stream(config)
	if stream:
		if SFX_LIBRARY.get(sound_id, {}).get("chord", null):
			_play_chord(config, volume_db)
		else:
			var player: AudioStreamPlayer = sfx_player.duplicate() as AudioStreamPlayer
			add_child(player)
			player.volume_db = volume_db
			player.stream = stream
			player.finished.connect(func(): player.queue_free())
			player.play()

func _create_sfx_stream(config: Dictionary) -> AudioStream:
	var freq: float = float(config.get("freq", 440.0))
	var duration: float = float(config.get("duration", 0.1))
	var wave: int = int(config.get("wave", 0))
	var vol: float = float(config.get("volume", 0.5))
	var sample_rate: int = 44100
	var total_samples: int = int(sample_rate * duration)
	var pcm: PackedFloat32Array = PackedFloat32Array()
	pcm.resize(total_samples)
	var waveform_func: Callable = _get_waveform_func(wave)
	var envelope: Callable = _adsr_envelope(duration, 0.01, 0.05, 0.6, 0.1)
	for i: int in range(total_samples):
		var t: float = float(i) / float(sample_rate)
		var sample: float = waveform_func.call(t, freq)
		var env_t: float = t / duration
		sample *= envelope.call(env_t)
		sample *= vol
		pcm[i] = clamp(sample, -1.0, 1.0)
	var stream_wav: AudioStreamWAV = AudioStreamWAV.new()
	stream_wav.format = AudioStreamWAV.FORMAT_16_BITS
	stream_wav.mix_rate = sample_rate
	stream_wav.stereo = false
	var bytes: PackedByteArray = PackedByteArray()
	var total_bytes: int = total_samples * 2
	bytes.resize(total_bytes)
	for i: int in range(total_samples):
		var raw_s: int = int(round(clamp(pcm[i] * 32767.0, -32768.0, 32767.0)))
		if raw_s < 0:
			raw_s += 65536
		var offset: int = i * 2
		bytes[offset] = raw_s & 0xFF
		bytes[offset + 1] = (raw_s >> 8) & 0xFF
	stream_wav.data = bytes
	return stream_wav

func _play_chord(config: Dictionary, volume_db: float) -> void:
	var chord_notes: Array = config.get("chord", [440])
	var duration: float = float(config.get("duration", 0.3))
	var wave: int = int(config.get("wave", 0))
	var vol: float = float(config.get("volume", 0.5))
	var sample_rate: int = 44100
	var total_samples: int = int(sample_rate * duration)
	var pcm: PackedFloat32Array = PackedFloat32Array()
	pcm.resize(total_samples)
	var waveform_func: Callable = _get_waveform_func(wave)
	var envelope: Callable = _adsr_envelope(duration, 0.02, 0.1, 0.7, 0.2)
	var note_vol: float = 1.0 / float(max(1, chord_notes.size()))
	for i: int in range(total_samples):
		var t: float = float(i) / float(sample_rate)
		var combined: float = 0.0
		for freq: float in chord_notes:
			combined += waveform_func.call(t, float(freq))
		combined *= note_vol
		var env_t: float = t / duration
		combined *= envelope.call(env_t)
		combined *= vol
		pcm[i] = clamp(combined, -1.0, 1.0)
	var stream_wav: AudioStreamWAV = AudioStreamWAV.new()
	stream_wav.format = AudioStreamWAV.FORMAT_16_BITS
	stream_wav.mix_rate = sample_rate
	stream_wav.stereo = false
	var bytes: PackedByteArray = PackedByteArray()
	var total_bytes: int = total_samples * 2
	bytes.resize(total_bytes)
	for i: int in range(total_samples):
		var raw_s2: int = int(round(clamp(pcm[i] * 32767.0, -32768.0, 32767.0)))
		if raw_s2 < 0:
			raw_s2 += 65536
		var offset: int = i * 2
		bytes[offset] = raw_s2 & 0xFF
		bytes[offset + 1] = (raw_s2 >> 8) & 0xFF
	stream_wav.data = bytes
	var player: AudioStreamPlayer = sfx_player.duplicate() as AudioStreamPlayer
	add_child(player)
	player.volume_db = volume_db
	player.stream = stream_wav
	player.finished.connect(func(): player.queue_free())
	player.play()

func _get_waveform_func(wave_type: int) -> Callable:
	match wave_type:
		0:
			return Callable(self, "_wave_sine")
		1:
			return Callable(self, "_wave_square")
		2:
			return Callable(self, "_wave_sawtooth")
		_:
			return Callable(self, "_wave_triangle")

func _wave_sine(t: float, freq: float) -> float:
	return sin(t * TAU * freq)

func _wave_square(t: float, freq: float) -> float:
	return -1.0 if fmod(t * freq, 1.0) < 0.5 else 1.0

func _wave_sawtooth(t: float, freq: float) -> float:
	return 2.0 * fmod(t * freq, 1.0) - 1.0

func _wave_triangle(t: float, freq: float) -> float:
	var phase: float = fmod(t * freq, 1.0)
	return 4.0 * abs(phase - 0.5) - 1.0

func _adsr_envelope(total_dur: float, attack: float, decay: float, sustain: float, release: float) -> Callable:
	var a: float = attack
	var d: float = decay
	var s: float = clamp(sustain, 0.0, 1.0)
	var r: float = release
	var total: float = a + d + r
	if total > 1.0:
		var scale: float = 1.0 / total
		a *= scale
		d *= scale
		r *= scale
	return Callable(self, "_adsr_envelope_calc").bind(a, d, s, r)

func _adsr_envelope_calc(t: float, a: float, d: float, s: float, r: float) -> float:
	if t < a:
		return t / a
	elif t < a + d:
		return 1.0 - (t - a) / d * (1.0 - s)
	elif t < 1.0 - r:
		return s
	else:
		var rt: float = (t - (1.0 - r)) / r
		return s * (1.0 - rt)
	return 0.0

func set_bus_volume(bus_name: String, volume_db: float) -> void:
	var idx: int = AudioServer.get_bus_index(bus_name)
	if idx >= 0:
		AudioServer.set_bus_volume_db(idx, volume_db)

func play_ui_sound(sound_id: String, volume_db: float = 0.0) -> void:
	var config: Variant = SFX_LIBRARY.get(sound_id, null)
	if not config:
		return
	var stream: AudioStream = _create_sfx_stream(config)
	if stream:
		var player: AudioStreamPlayer = ui_player.duplicate() as AudioStreamPlayer
		add_child(player)
		player.volume_db = volume_db
		player.stream = stream
		player.finished.connect(func(): player.queue_free())
		player.play()

func reload_volume_settings() -> void:
	_apply_volume_settings()
