class_name AudioManager
extends Node

enum AlarmType { POWER_CRITICAL, OXYGEN_CRITICAL, SONAR_CRITICAL, REPAIR_NEEDED, HULL_BREACH, NIGHT_START, NIGHT_END, GAME_OVER }

var _audio_players: Dictionary = {}
var _alarm_active: Dictionary = {}
var _alarm_intervals: Dictionary = {}
var _master_volume: float = 1.0
var _sfx_volume: float = 1.0
var _alarm_volume: float = 0.8

func _ready() -> void:
	for at: AlarmType in AlarmType.values():
		_alarm_active[at] = false
		_alarm_intervals[at] = 0.0

func _process(delta: float) -> void:
	for at: AlarmType in _alarm_active:
		if _alarm_active[at]:
			_alarm_intervals[at] -= delta
			if _alarm_intervals[at] <= 0.0:
				_play_alarm_sound(at)
				_alarm_intervals[at] = _get_alarm_interval(at)

func play_sfx(resource_path: String, volume_db: float = 0.0) -> void:
	if not ResourceLoader.exists(resource_path):
		return
	var player := AudioStreamPlayer.new()
	player.stream = load(resource_path)
	player.volume_db = volume_db + _linear_to_db(_sfx_volume * _master_volume)
	player.finished.connect(player.queue_free)
	add_child(player)
	player.play()

func trigger_alarm(alarm_type: AlarmType) -> void:
	_alarm_active[alarm_type] = true
	_alarm_intervals[alarm_type] = 0.0

func stop_alarm(alarm_type: AlarmType) -> void:
	_alarm_active[alarm_type] = false
	if _audio_players.has(alarm_type):
		var player: AudioStreamPlayer = _audio_players[alarm_type]
		player.stop()
		player.queue_free()
		_audio_players.erase(alarm_type)

func stop_all_alarms() -> void:
	for at: AlarmType in _alarm_active:
		stop_alarm(at)

func set_master_volume(vol: float) -> void:
	_master_volume = clampf(vol, 0.0, 1.0)

func set_sfx_volume(vol: float) -> void:
	_sfx_volume = clampf(vol, 0.0, 1.0)

func set_alarm_volume(vol: float) -> void:
	_alarm_volume = clampf(vol, 0.0, 1.0)

func _play_alarm_sound(alarm_type: AlarmType) -> void:
	if _audio_players.has(alarm_type):
		var existing: AudioStreamPlayer = _audio_players[alarm_type]
		if existing.is_playing():
			return

	var sound_path := _get_alarm_sound_path(alarm_type)
	if not ResourceLoader.exists(sound_path):
		var player := AudioStreamPlayer.new()
		player.volume_db = -6.0 + _linear_to_db(_alarm_volume * _master_volume)
		player.finished.connect(player.queue_free)
		add_child(player)
		_audio_players[alarm_type] = player
		return

	var player := AudioStreamPlayer.new()
	player.stream = load(sound_path)
	player.volume_db = _linear_to_db(_alarm_volume * _master_volume)
	player.finished.connect(player.queue_free)
	add_child(player)
	_audio_players[alarm_type] = player
	player.play()

func _get_alarm_interval(alarm_type: AlarmType) -> float:
	match alarm_type:
		AlarmType.OXYGEN_CRITICAL: return 2.0
		AlarmType.POWER_CRITICAL: return 3.0
		AlarmType.SONAR_CRITICAL: return 4.0
		AlarmType.HULL_BREACH: return 1.5
		AlarmType.REPAIR_NEEDED: return 5.0
		_: return 3.0

func _get_alarm_sound_path(alarm_type: AlarmType) -> String:
	match alarm_type:
		AlarmType.POWER_CRITICAL: return "res://assets/audio/alarm_power.ogg"
		AlarmType.OXYGEN_CRITICAL: return "res://assets/audio/alarm_oxygen.ogg"
		AlarmType.SONAR_CRITICAL: return "res://assets/audio/alarm_sonar.ogg"
		AlarmType.REPAIR_NEEDED: return "res://assets/audio/alarm_repair.ogg"
		AlarmType.HULL_BREACH: return "res://assets/audio/alarm_hull.ogg"
		AlarmType.NIGHT_START: return "res://assets/audio/night_start.ogg"
		AlarmType.NIGHT_END: return "res://assets/audio/night_end.ogg"
		AlarmType.GAME_OVER: return "res://assets/audio/game_over.ogg"
		_: return ""

func _linear_to_db(linear: float) -> float:
	if linear <= 0.0:
		return -80.0
	return logf(linear) * 8.685889638065037
