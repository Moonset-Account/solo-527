extends Node

var master_bus: int = 0
var sfx_bus: int = 1
var bgm_bus: int = 2
var sfx_players: Dictionary = {}

func _ready():
	_setup_buses()
	_preload_sfx()
	apply_volumes()

func _setup_buses():
	while AudioServer.bus_count < 3:
		AudioServer.add_bus()
	AudioServer.set_bus_name(0, "Master")
	AudioServer.set_bus_name(1, "SFX")
	AudioServer.set_bus_name(2, "BGM")
	AudioServer.set_bus_effect_enabled(0, 0, false)

func _preload_sfx():
	var sfx_list: Array = ["click", "move", "work", "skill", "success", "fail", "toast", "dialog", "end_turn"]
	for name in sfx_list:
		var p: AudioStreamPlayer = AudioStreamPlayer.new()
		p.bus = "SFX"
		p.stream = _generate_tone(name)
		add_child(p)
		sfx_players[name] = p

func _generate_tone(kind: String) -> AudioStreamWAV:
	var wav: AudioStreamWAV = AudioStreamWAV.new()
	var rate: int = 22050
	var duration: float = 0.12
	var samples: int = int(rate * duration)
	var data: PackedByteArray = PackedByteArray()
	data.resize(samples * 2)
	var freq: float = 440.0
	var type: int = 0
	match kind:
		"click":
			freq = 880.0
			duration = 0.05
			samples = int(rate * duration)
			data.resize(samples * 2)
			type = 1
		"move":
			freq = 520.0
			duration = 0.12
			samples = int(rate * duration)
			data.resize(samples * 2)
		"work":
			freq = 330.0
			type = 2
		"skill":
			freq = 660.0
			duration = 0.25
			samples = int(rate * duration)
			data.resize(samples * 2)
			type = 1
		"success":
			freq = 660.0
			duration = 0.35
			samples = int(rate * duration)
			data.resize(samples * 2)
			type = 2
		"fail":
			freq = 180.0
			duration = 0.4
			samples = int(rate * duration)
			data.resize(samples * 2)
		"toast":
			freq = 580.0
			duration = 0.08
			samples = int(rate * duration)
			data.resize(samples * 2)
		"dialog":
			freq = 540.0
			duration = 0.1
			samples = int(rate * duration)
			data.resize(samples * 2)
			type = 1
		"end_turn":
			freq = 380.0
			duration = 0.2
			samples = int(rate * duration)
			data.resize(samples * 2)
			type = 2
	for i in samples:
		var t: float = float(i) / float(rate)
		var env: float = clamp(1.0 - (t / duration), 0.0, 1.0)
		env = env * env
		var sample_val: float = 0.0
		match type:
			0:
				sample_val = sin(2.0 * PI * freq * t)
			1:
				var phase: float = fmod(freq * t, 1.0)
				sample_val = (phase * 2.0 - 1.0)
			2:
				var phase2: float = fmod(freq * t, 1.0)
				sample_val = 1.0 - abs(phase2 - 0.5) * 4.0
				sample_val = clamp(sample_val, -1.0, 1.0)
		sample_val *= env * 0.35
		var s16: int = int(clamp(sample_val, -1.0, 1.0) * 32767.0)
		data[i * 2] = s16 & 0xff
		data[i * 2 + 1] = (s16 >> 8) & 0xff
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = rate
	wav.stereo = false
	wav.data = data
	return wav

func apply_volumes():
	var mv: float = SaveSystem.get_setting("master_volume", 0.8)
	var sv: float = SaveSystem.get_setting("sfx_volume", 0.7)
	var bv: float = SaveSystem.get_setting("bgm_volume", 0.5)
	AudioServer.set_bus_volume_db(0, linear_to_db(clampf(mv, 0.0, 1.0)))
	AudioServer.set_bus_volume_db(1, linear_to_db(clampf(sv, 0.0, 1.0)))
	AudioServer.set_bus_volume_db(2, linear_to_db(clampf(bv, 0.0, 1.0)))

func linear_to_db(v: float) -> float:
	if v <= 0.0001:
		return -80.0
	return 20.0 * log(v) / log(10.0)

func play_sfx(name: String):
	if sfx_players.has(name):
		var p: AudioStreamPlayer = sfx_players[name]
		p.stop()
		p.play()
