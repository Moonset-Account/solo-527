extends Node
## 噪音系统 - 玩家移动产生噪音，影响巡逻灯检测

signal noise_spawned(world_pos: Vector2, strength: float, radius: float)
signal noise_decayed(world_pos: Vector2)

class NoiseSource:
	var position: Vector2
	var max_strength: float
	var current_strength: float
	var radius: float
	var lifetime: float
	var elapsed: float
	var source_id: int

	func _init(pos: Vector2, stren: float, rad: float, life: float, sid: int) -> void:
		position = pos
		max_strength = stren
		current_strength = stren
		radius = rad
		lifetime = life
		elapsed = 0.0
		source_id = sid

var active_noises: Array = []
var _noise_counter: int = 0

const DEFAULT_LIFETIME := 0.8
const MIN_STRENGTH_THRESHOLD := 0.1

func _process(delta: float) -> void:
	_update_noises(delta)

func spawn_noise(world_pos: Vector2, strength: float, radius: float, lifetime: float = DEFAULT_LIFETIME) -> void:
	if strength < MIN_STRENGTH_THRESHOLD:
		return
	_noise_counter += 1
	var noise := NoiseSource.new(world_pos, strength, radius, lifetime, _noise_counter)
	active_noises.append(noise)
	noise_spawned.emit(world_pos, strength, radius)
	EventBus.emit_noise_triggered(world_pos, strength)
	if strength > 0.6:
		EventBus.emit_sfx_play("noise_alert")

func get_noises_in_range(world_pos: Vector2, max_range: float) -> Array:
	var result: Array = []
	for noise in active_noises:
		var dist := world_pos.distance_to(noise.position)
		if dist <= max_range + noise.radius:
			var effective_strength: float = noise.current_strength * clamp(1.0 - dist / (max_range + noise.radius), 0.0, 1.0)
			if effective_strength >= MIN_STRENGTH_THRESHOLD:
				result.append({
					"position": noise.position,
					"strength": effective_strength,
					"distance": dist,
					"source_id": noise.source_id,
				})
	result.sort_custom(func(a, b): return a["strength"] > b["strength"])
	return result

func get_strongest_noise_in_range(world_pos: Vector2, max_range: float) -> Dictionary:
	var noises := get_noises_in_range(world_pos, max_range)
	if noises.is_empty():
		return {}
	return noises[0]

func _update_noises(delta: float) -> void:
	var to_remove: Array = []
	for i in active_noises.size():
		var noise: NoiseSource = active_noises[i]
		noise.elapsed += delta
		var progress := clamp(noise.elapsed / noise.lifetime, 0.0, 1.0)
		noise.current_strength = noise.max_strength * (1.0 - ease(progress, 3.0))
		if progress >= 1.0 or noise.current_strength < MIN_STRENGTH_THRESHOLD:
			to_remove.append(i)
			noise_decayed.emit(noise.position)
	for i in range(to_remove.size() - 1, -1, -1):
		active_noises.remove_at(to_remove[i])

func clear_all_noises() -> void:
	active_noises.clear()

func calculate_movement_noise(speed: float, is_crouching: bool, is_running: bool) -> float:
	var base_noise: float = clamp(speed / 300.0, 0.0, 1.0)
	if is_crouching:
		base_noise *= 0.25
	elif is_running:
		base_noise *= 1.6
	return clamp(base_noise, 0.0, 1.0)
