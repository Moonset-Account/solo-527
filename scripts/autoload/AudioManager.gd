extends Node
## AudioManager - 音效管理器
## 负责BGM播放、SFX播放、音量管理

signal volume_changed(channel: String, value: float)

const SFX_LIBRARY := {
	"click": {freq=800, duration=0.08, type=0, volume=0.3},
	"place": {freq=500, duration=0.15, type=1, volume=0.4},
	"upgrade": {freq=600, duration=0.2, type=2, volume=0.5},
	"coin": {freq=1200, duration=0.1, type=0, volume=0.35},
	"success": {freq=880, duration=0.3, type=2, volume=0.4},
	"fail": {freq=200, duration=0.4, type=0, volume=0.4},
	"order_new": {freq=700, duration=0.15, type=1, volume=0.35},
	"machine_run": {freq=300, duration=0.1, type=1, volume=0.2},
	"warning": {freq=440, duration=0.2, type=0, volume=0.3},
	"button_hover": {freq=1000, duration=0.05, type=0, volume=0.2}
}

var master_volume: float = 0.8
var music_volume: float = 0.6
var sfx_volume: float = 0.9

var _music_player: AudioStreamPlayer = null
var _sfx_players: Array = []
var _max_sfx_players: int = 8
var _current_bgm: String = ""

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_music_player = AudioStreamPlayer.new()
	_music_player.bus = "Master"
	add_child(_music_player)
	for i in _max_sfx_players:
		var p := AudioStreamPlayer.new()
		p.bus = "Master"
		add_child(p)
		_sfx_players.append(p)
	var settings: Dictionary = SaveSystem.load_settings()
	master_volume = settings.get("master_volume", 0.8)
	music_volume = settings.get("music_volume", 0.6)
	sfx_volume = settings.get("sfx_volume", 0.9)
	_apply_volumes()

func _apply_volumes() -> void:
	_music_player.volume_db = linear_to_db(master_volume * music_volume)
	for p in _sfx_players:
		p.volume_db = linear_to_db(master_volume * sfx_volume)

func set_volume(channel: String, value: float) -> void:
	value = clamp(value, 0.0, 1.0)
	match channel:
		"master":
			master_volume = value
		"music":
			music_volume = value
		"sfx":
			sfx_volume = value
	_apply_volumes()
	volume_changed.emit(channel, value)
	_save_volumes()

func get_volume(channel: String) -> float:
	match channel:
		"master": return master_volume
		"music": return music_volume
		"sfx": return sfx_volume
	return 0.0

func _save_volumes() -> void:
	var settings: Dictionary = SaveSystem.load_settings()
	settings["master_volume"] = master_volume
	settings["music_volume"] = music_volume
	settings["sfx_volume"] = sfx_volume
	SaveSystem.save_settings(settings)

func play_sfx(sfx_name: String) -> void:
	if not SFX_LIBRARY.has(sfx_name):
		return
	var cfg: Dictionary = SFX_LIBRARY[sfx_name]
	var stream := _generate_procedural_sound(cfg)
	for p in _sfx_players:
		if not p.playing:
			p.stream = stream
			p.volume_db = linear_to_db(master_volume * sfx_volume * cfg.get("volume", 0.3))
			p.play()
			return
	var p: AudioStreamPlayer = _sfx_players[0]
	p.stream = stream
	p.volume_db = linear_to_db(master_volume * sfx_volume * cfg.get("volume", 0.3))
	p.play()

func _generate_procedural_sound(cfg: Dictionary) -> AudioStreamWAV:
	var freq: float = cfg.get("freq", 440)
	var duration: float = cfg.get("duration", 0.1)
	var sound_type: int = cfg.get("type", 0)
	var sample_rate: int = 22050
	var num_samples: int = int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(num_samples * 2)
	for i in num_samples:
		var t: float = float(i) / float(sample_rate)
		var sample: float = 0.0
		var envelope: float = 1.0 - (float(i) / float(num_samples))
		envelope = clamp(envelope * 2.0, 0.0, 1.0)
		match sound_type:
			0:
				sample = sin(2.0 * PI * freq * t)
			1:
				sample = sign(sin(2.0 * PI * freq * t))
			2:
				var freq2: float = freq * (1.0 - t * 2.0)
				sample = sin(2.0 * PI * max(freq2, 80) * t) * 0.5 + sin(2.0 * PI * freq * t) * 0.5
		sample *= envelope * 0.6
		var s16: int = int(clamp(sample, -1.0, 1.0) * 32767.0)
		data[i * 2] = s16 & 0xff
		data[i * 2 + 1] = (s16 >> 8) & 0xff
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = sample_rate
	wav.stereo = false
	wav.data = data
	return wav

func play_music_loop() -> void:
	if _music_player.playing:
		return
	var bgm_stream := _generate_procedural_bgm()
	_music_player.stream = bgm_stream
	_music_player.volume_db = linear_to_db(master_volume * music_volume)
	_music_player.play()

func _generate_procedural_bgm() -> AudioStreamWAV:
	var sample_rate: int = 22050
	var bpm: int = 90
	var beat: float = 60.0 / float(bpm)
	var bar_length: float = beat * 4
	var total_bars: int = 8
	var duration: float = bar_length * total_bars
	var num_samples: int = int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(num_samples * 2)
	var notes_bass := [55, 55, 73, 65, 55, 55, 73, 82]
	var notes_melody := [220, 277, 330, 294, 262, 294, 330, 440]
	for i in num_samples:
		var t: float = float(i) / float(sample_rate)
		var bar_idx: int = int(t / bar_length) % total_bars
		var t_in_bar: float = fmod(t, bar_length)
		var bass_freq: float = notes_bass[bar_idx]
		var beat_idx: int = int(t_in_bar / beat)
		var melody_note_idx: int = (bar_idx * 4 + beat_idx) % notes_melody.size()
		var melody_freq: float = notes_melody[melody_note_idx]
		var envelope: float = 1.0 - fmod(t_in_bar, beat) / beat
		envelope = pow(envelope, 2.0)
		var bass: float = sin(2.0 * PI * bass_freq * t) * 0.25 * envelope
		var melody: float = 0.0
		if beat_idx < 3:
			melody = sin(2.0 * PI * melody_freq * t) * 0.12 * envelope
		var kick: float = 0.0
		if fmod(t_in_bar, beat * 2) < 0.05:
			var k_t: float = fmod(t_in_bar, beat * 2) / 0.05
			kick = sin(2.0 * PI * (120.0 - k_t * 80.0) * fmod(t_in_bar, beat * 2)) * 0.35 * (1.0 - k_t)
		var hat: float = 0.0
		if fmod(t_in_bar, beat * 0.5) < 0.02:
			var h_t: float = fmod(t_in_bar, beat * 0.5) / 0.02
			hat = (randf() * 2.0 - 1.0) * 0.06 * (1.0 - h_t)
		var sample: float = clamp(bass + melody + kick + hat, -1.0, 1.0) * 0.5
		var s16: int = int(sample * 32767.0)
		data[i * 2] = s16 & 0xff
		data[i * 2 + 1] = (s16 >> 8) & 0xff
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = sample_rate
	wav.stereo = false
	wav.loop_mode = AudioStreamWAV.LOOP_FORWARD
	wav.loop_begin = 0
	wav.loop_end = num_samples
	wav.data = data
	return wav

func stop_music() -> void:
	if _music_player.playing:
		_music_player.stop()

func toggle_music() -> bool:
	if _music_player.playing:
		stop_music()
		return false
	else:
		play_music_loop()
		return true
