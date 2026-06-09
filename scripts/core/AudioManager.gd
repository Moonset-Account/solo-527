extends Node
## 音频管理器 - 统一管理音效和音乐播放

signal volume_changed(type: String, volume: float)

var _music_player: AudioStreamPlayer
var _sfx_players: Array[AudioStreamPlayer] = []
var _max_sfx_players: int = 10
var _current_music: String = ""

const SOUND_PATHS := {
    "click": "res://assets/audio/click.wav",
    "pickup": "res://assets/audio/pickup.wav",
    "drop": "res://assets/audio/drop.wav",
    "rotate": "res://assets/audio/rotate.wav",
    "place": "res://assets/audio/place.wav",
    "break": "res://assets/audio/break.wav",
    "success": "res://assets/audio/success.wav",
    "fail": "res://assets/audio/fail.wav",
    "star": "res://assets/audio/star.wav",
    "undo": "res://assets/audio/undo.wav",
    "menu_music": "res://assets/audio/menu.wav",
    "game_music": "res://assets/audio/game.wav"
}

func _ready() -> void:
    _music_player = AudioStreamPlayer.new()
    _music_player.bus = "Master"
    add_child(_music_player)
    _init_sfx_players()
    apply_settings()

func _init_sfx_players() -> void:
    for i in _max_sfx_players:
        var player: AudioStreamPlayer = AudioStreamPlayer.new()
        player.bus = "Master"
        add_child(player)
        _sfx_players.append(player)

func apply_settings() -> void:
    var master: float = SaveSystem.settings_data.get("master_volume", 0.8)
    var music: float = SaveSystem.settings_data.get("music_volume", 0.6)
    var sfx: float = SaveSystem.settings_data.get("sfx_volume", 0.8)
    _music_player.volume_db = _linear_to_db(master * music)
    for player in _sfx_players:
        player.volume_db = _linear_to_db(master * sfx)

func set_master_volume(volume: float) -> void:
    SaveSystem.settings_data["master_volume"] = clampf(volume, 0.0, 1.0)
    SaveSystem.save_settings()
    apply_settings()
    volume_changed.emit("master", volume)

func set_music_volume(volume: float) -> void:
    SaveSystem.settings_data["music_volume"] = clampf(volume, 0.0, 1.0)
    SaveSystem.save_settings()
    apply_settings()
    volume_changed.emit("music", volume)

func set_sfx_volume(volume: float) -> void:
    SaveSystem.settings_data["sfx_volume"] = clampf(volume, 0.0, 1.0)
    SaveSystem.save_settings()
    apply_settings()
    volume_changed.emit("sfx", volume)

func _linear_to_db(linear: float) -> float:
    if linear <= 0.001:
        return -80.0
    return 20.0 * log(linear) / log(10.0)

func play_sfx(sound_id: String, pitch: float = 1.0) -> void:
    if not SOUND_PATHS.has(sound_id):
        return
    var path: String = SOUND_PATHS[sound_id]
    var stream: AudioStream = ResourceLoader_.get_audio_stream(path)
    if stream == null:
        return
    for player in _sfx_players:
        if not player.playing:
            player.stream = stream
            player.pitch_scale = pitch
            player.play()
            return
    var fallback: AudioStreamPlayer = _sfx_players[0]
    fallback.stream = stream
    fallback.pitch_scale = pitch
    fallback.play()

func play_music(sound_id: String, loop: bool = true) -> void:
    if _current_music == sound_id and _music_player.playing:
        return
    if not SOUND_PATHS.has(sound_id):
        return
    var path: String = SOUND_PATHS[sound_id]
    var stream: AudioStream = ResourceLoader_.get_audio_stream(path)
    if stream == null:
        return
    _current_music = sound_id
    _music_player.stream = stream
    if _music_player.stream is AudioStreamWAV:
        (_music_player.stream as AudioStreamWAV).loop_mode = AudioStreamWAV.LOOP_FORWARD if loop else AudioStreamWAV.LOOP_DISABLED
    _music_player.play()

func stop_music(fade: bool = true) -> void:
    if fade and _music_player.playing:
        var tween: Tween = create_tween()
        var start: float = _music_player.volume_db
        tween.tween_property(_music_player, "volume_db", -80.0, 0.5)
        await tween.finished
        _music_player.stop()
        apply_settings()
    else:
        _music_player.stop()
    _current_music = ""

func pause_music() -> void:
    if _music_player.playing:
        _music_player.stream_paused = true

func resume_music() -> void:
    if _music_player.stream_paused:
        _music_player.stream_paused = false
