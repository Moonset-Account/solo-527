extends Node
## 音效管理器 - 统一管理所有音效播放
## 支持按类型设置音量、播放成功/失败/操作等反馈音效

const SFX_PATH: String = "res://assets/sfx/"

enum SFXType {
	CARD_DRAW,
	CARD_PLAY,
	CARD_INVALID,
	CARD_HOVER,
	EXHIBIT_REPAIR,
	EXHIBIT_COMPLETE,
	EXHIBIT_FAIL,
	TURN_START,
	TURN_END,
	LEVEL_COMPLETE,
	LEVEL_FAIL,
	REWARD,
	CLICK,
	EVENT,
	WARNING
}

var master_volume: float = 0.8
var sfx_volume: float = 0.7

var _audio_players: Dictionary = {}
var _sfx_map: Dictionary = {
	SFXType.CARD_DRAW: "card_draw.wav",
	SFXType.CARD_PLAY: "card_play.wav",
	SFXType.CARD_INVALID: "card_invalid.wav",
	SFXType.CARD_HOVER: "card_hover.wav",
	SFXType.EXHIBIT_REPAIR: "repair.wav",
	SFXType.EXHIBIT_COMPLETE: "complete.wav",
	SFXType.EXHIBIT_FAIL: "fail.wav",
	SFXType.TURN_START: "turn_start.wav",
	SFXType.TURN_END: "turn_end.wav",
	SFXType.LEVEL_COMPLETE: "level_complete.wav",
	SFXType.LEVEL_FAIL: "level_fail.wav",
	SFXType.REWARD: "reward.wav",
	SFXType.CLICK: "click.wav",
	SFXType.EVENT: "event.wav",
	SFXType.WARNING: "warning.wav"
}

var _fallback_enabled: bool = true

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_create_pooled_players()

func play_sfx(sfx_type: int, volume_scale: float = 1.0) -> void:
	if not _sfx_map.has(sfx_type):
		return
	var filename: String = _sfx_map[sfx_type]
	var full_path: String = SFX_PATH + filename
	
	if ResourceLoader.exists(full_path):
		_play_from_pool(full_path, volume_scale)
	elif _fallback_enabled:
		_play_tone_for_type(sfx_type, volume_scale)

func play_ui_click() -> void:
	play_sfx(SFXType.CLICK, 0.5)

func play_card_draw() -> void:
	play_sfx(SFXType.CARD_DRAW)

func play_card_play(success: bool) -> void:
	if success:
		play_sfx(SFXType.CARD_PLAY)
	else:
		play_sfx(SFXType.CARD_INVALID, 0.8)

func play_repair() -> void:
	play_sfx(SFXType.EXHIBIT_REPAIR)

func play_exhibit_complete() -> void:
	play_sfx(SFXType.EXHIBIT_COMPLETE)

func play_level_result(won: bool) -> void:
	if won:
		play_sfx(SFXType.LEVEL_COMPLETE)
	else:
		play_sfx(SFXType.LEVEL_FAIL)

func play_reward() -> void:
	play_sfx(SFXType.REWARD)

func play_warning() -> void:
	play_sfx(SFXType.WARNING, 0.6)

func set_master_volume(vol: float) -> void:
	master_volume = clampf(vol, 0.0, 1.0)
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"), linear_to_db(master_volume))

func set_sfx_volume(vol: float) -> void:
	sfx_volume = clampf(vol, 0.0, 1.0)

func _create_pooled_players() -> void:
	for i in range(8):
		var player: AudioStreamPlayer = AudioStreamPlayer.new()
		player.name = "SFXPlayer_%d" % i
		player.bus = "Master"
		add_child(player)
		_audio_players[i] = {
			"player": player,
			"busy": false
		}

func _play_from_pool(path: String, volume_scale: float) -> void:
	var stream: AudioStream = load(path)
	if stream == null:
		return
	for id in _audio_players:
		var entry: Dictionary = _audio_players[id]
		if not entry.busy:
			var player: AudioStreamPlayer = entry.player
			player.stream = stream
			player.volume_db = linear_to_db(sfx_volume * volume_scale * master_volume)
			player.finished.connect(_on_player_finished.bind(id), CONNECT_ONE_SHOT)
			entry.busy = true
			player.play()
			return

func _on_player_finished(id: int) -> void:
	if _audio_players.has(id):
		_audio_players[id].busy = false

func _play_tone_for_type(sfx_type: int, volume_scale: float) -> void:
	var sample_rate: int = 22050
	var mix_rate: float = 1.0
	var duration: float = 0.15
	var frequency: float = 440.0
	
	match sfx_type:
		SFXType.CARD_DRAW:
			frequency = 520.0
			duration = 0.12
		SFXType.CARD_PLAY:
			frequency = 660.0
			duration = 0.18
		SFXType.CARD_INVALID:
			frequency = 200.0
			duration = 0.2
		SFXType.EXHIBIT_REPAIR:
			frequency = 440.0
			duration = 0.15
		SFXType.EXHIBIT_COMPLETE:
			frequency = 880.0
			duration = 0.35
		SFXType.LEVEL_COMPLETE:
			frequency = 720.0
			duration = 0.6
		SFXType.LEVEL_FAIL:
			frequency = 180.0
			duration = 0.5
		SFXType.REWARD:
			frequency = 780.0
			duration = 0.25
		SFXType.WARNING:
			frequency = 300.0
			duration = 0.3
		_:
			frequency = 440.0
			duration = 0.1
	
	var stw: AudioStreamWAV = AudioStreamWAV.new()
	var data: PackedByteArray = PackedByteArray()
	var phase: float = 0.0
	var phase_inc: float = 2.0 * PI * frequency / float(sample_rate)
	var num_frames: int = int(sample_rate * duration)
	
	for i in range(num_frames):
		var t: float = float(i) / float(num_frames)
		var envelope: float = sin(t * PI)
		var sample: float = sin(phase) * envelope * 0.3 * sfx_volume * volume_scale * master_volume
		var sample_val: int = int(clampf(sample, -1.0, 1.0) * 32767.0)
		data.append(sample_val & 0xff)
		data.append((sample_val >> 8) & 0xff)
		phase += phase_inc
	
	stw.format = AudioStreamWAV.FORMAT_16_BITS
	stw.mix_rate = sample_rate
	stw.stereo = false
	stw.data = data
	
	_play_from_memory(stw)

func _play_from_memory(stream: AudioStreamWAV) -> void:
	for id in _audio_players:
		var entry: Dictionary = _audio_players[id]
		if not entry.busy:
			var player: AudioStreamPlayer = entry.player
			player.stream = stream
			entry.busy = true
			player.finished.connect(_on_player_finished.bind(id), CONNECT_ONE_SHOT)
			player.play()
			return
