extends Node

var _master_bus: AudioBusLayout = null
var _bgm_player: AudioStreamPlayer = null
var _sfx_players: Array[AudioStreamPlayer] = []

var master_volume: float = 0.8
var bgm_volume: float = 0.6
var sfx_volume: float = 0.9

const MAX_SFX_PLAYERS: int = 8

const SFX_LIBRARY: Dictionary = {
    "coin": {"frequency": 880.0, "duration": 0.15, "type": "sine"},
    "pickup": {"frequency": 660.0, "duration": 0.1, "type": "square"},
    "sale": {"frequency": 523.25, "duration": 0.2, "type": "sine"},
    "upgrade": {"frequency": 784.0, "duration": 0.3, "type": "triangle"},
    "transition": {"frequency": 440.0, "duration": 0.12, "type": "sawtooth"},
    "click": {"frequency": 1200.0, "duration": 0.05, "type": "square"},
    "error": {"frequency": 200.0, "duration": 0.2, "type": "sawtooth"},
    "success": {"frequency": 659.25, "duration": 0.4, "type": "sine"},
    "customer_arrive": {"frequency": 330.0, "duration": 0.08, "type": "sine"},
    "customer_leave": {"frequency": 293.66, "duration": 0.08, "type": "sine"}
}

func _ready() -> void:
    _create_bgm_player()
    _create_sfx_pool()
    EventBus.on_event("audio_played", _on_audio_played)
    call_deferred("_play_bgm_deferred")
    print("[AudioManager] 初始化完成")

func _play_bgm_deferred() -> void:
    _play_default_bgm()

func _create_bgm_player() -> void:
    _bgm_player = AudioStreamPlayer.new()
    _bgm_player.bus = "Master"
    _bgm_player.volume_db = linear_to_db(bgm_volume)
    add_child(_bgm_player)
    _play_default_bgm()

func _create_sfx_pool() -> void:
    for i in range(MAX_SFX_PLAYERS):
        var player = AudioStreamPlayer.new()
        player.bus = "Master"
        player.volume_db = linear_to_db(sfx_volume)
        add_child(player)
        _sfx_players.append(player)

func _play_default_bgm() -> void:
    var bgm = _generate_bgm()
    if bgm != null:
        _bgm_player.stream = bgm
        _bgm_player.volume_db = linear_to_db(bgm_volume * master_volume)
        _bgm_player.play()

func _generate_bgm() -> AudioStream:
    var sample_rate = 44100
    var total_duration = 4.0
    var sample_count = int(sample_rate * total_duration)
    var data = PackedByteArray()
    data.resize(sample_count * 2)
    
    var notes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63]
    var note_duration = total_duration / float(notes.size())
    
    for i in range(sample_count):
        var t = float(i) / sample_rate
        var note_idx = int(floor(t / note_duration)) % notes.size()
        var freq = notes[note_idx]
        
        var note_t = fmod(t, note_duration)
        var envelope: float = 0.0
        if note_t < 0.02:
            envelope = note_t / 0.02
        elif note_t > note_duration - 0.05:
            envelope = max(0.0, (note_duration - note_t) / 0.05)
        else:
            envelope = 1.0
        
        var sample = sin(t * freq * TAU) * 0.12 * envelope
        var int_val = int(clamp(sample, -1.0, 1.0) * 32767)
        data[i * 2] = int(int_val & 0xFF)
        data[i * 2 + 1] = int((int_val >> 8) & 0xFF)
    
    var stream = AudioStreamWAV.new()
    stream.format = AudioStreamWAV.FORMAT_16_BITS
    stream.mix_rate = sample_rate
    stream.stereo = false
    stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
    stream.loop_begin = 0
    stream.loop_end = sample_count
    stream.data = data
    
    return stream

func play_sfx(sfx_id: String) -> void:
    if not (sfx_id in SFX_LIBRARY):
        return
    
    var config = SFX_LIBRARY[sfx_id]
    var stream = _generate_tone(
        config.get("frequency", 440.0),
        config.get("duration", 0.1),
        config.get("type", "sine")
    )
    
    if stream == null:
        return
    
    for player in _sfx_players:
        if not player.playing:
            player.stream = stream
            player.volume_db = linear_to_db(sfx_volume * master_volume)
            player.play()
            return
    
    var backup_player = AudioStreamPlayer.new()
    backup_player.bus = "Master"
    add_child(backup_player)
    backup_player.stream = stream
    backup_player.volume_db = linear_to_db(sfx_volume * master_volume)
    backup_player.play()
    backup_player.finished.connect(backup_player.queue_free)

func _generate_tone(frequency: float, duration: float, wave_type: String) -> AudioStreamWAV:
    var sample_rate = 44100
    var sample_count = int(sample_rate * duration)
    var data = PackedByteArray()
    data.resize(sample_count * 2)
    
    for i in range(sample_count):
        var t = float(i) / sample_rate
        var value: float = 0.0
        var phase = t * frequency * TAU
        
        match wave_type:
            "sine":
                value = sin(phase)
            "square":
                value = 1.0 if sin(phase) >= 0 else -1.0
            "sawtooth":
                value = 2.0 * (fmod(t * frequency, 1.0) - 0.5)
            "triangle":
                value = 2.0 * abs(2.0 * fmod(t * frequency, 1.0) - 1.0) - 1.0
            _:
                value = sin(phase)
        
        var envelope = 1.0
        if t < 0.01:
            envelope = t / 0.01
        elif t > duration - 0.02:
            envelope = max(0.0, (duration - t) / 0.02)
        
        value *= envelope * 0.3
        
        var int_value = int(clamp(value, -1.0, 1.0) * 32767.0)
        data[i * 2] = int(int_value & 0xFF)
        data[i * 2 + 1] = int((int_value >> 8) & 0xFF)
    
    var stream = AudioStreamWAV.new()
    stream.format = AudioStreamWAV.FORMAT_16_BITS
    stream.mix_rate = sample_rate
    stream.stereo = false
    stream.data = data
    
    return stream

func set_master_volume(volume: float) -> void:
    master_volume = clamp(volume, 0.0, 1.0)
    if _bgm_player:
        _bgm_player.volume_db = linear_to_db(bgm_volume * master_volume)

func set_bgm_volume(volume: float) -> void:
    bgm_volume = clamp(volume, 0.0, 1.0)
    if _bgm_player:
        _bgm_player.volume_db = linear_to_db(bgm_volume * master_volume)

func set_sfx_volume(volume: float) -> void:
    sfx_volume = clamp(volume, 0.0, 1.0)
    for player in _sfx_players:
        player.volume_db = linear_to_db(sfx_volume * master_volume)

func get_master_volume() -> float:
    return master_volume

func get_bgm_volume() -> float:
    return bgm_volume

func get_sfx_volume() -> float:
    return sfx_volume

func linear_to_db(linear: float) -> float:
    if linear <= 0.0001:
        return -80.0
    return 20.0 * log(linear) / log(10.0)

func _on_audio_played(sound_id: String) -> void:
    play_sfx(sound_id)
