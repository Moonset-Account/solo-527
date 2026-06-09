extends Node2D

signal tile_clicked(grid_x: int, grid_y: int, mouse_button: int)
signal character_clicked(char_idx: int)
signal task_clicked(task_idx: int)

var tile_size: int = 64
var map_width: int = 8
var map_height: int = 6
var grid: Array = []
var tile_types: Dictionary = {}
var tiles_container: Node2D
var characters_container: Node2D
var tasks_container: Node2D
var effects_container: Node2D
var overlay_container: Node2D
var _move_highlight_tiles: Array = []
var _path_tiles: Array = []
var _skill_range_tiles: Array = []
var _selectable_char_ring: Array = []
var current_cursor: Vector2i = Vector2i(-1, -1)
var character_nodes: Array = []
var task_nodes: Array = []
var float_texts: Array = []

func _ready():
	_build_containers()
	GameManager.connect("character_selected", _on_character_selected)
	GameManager.connect("float_text", _on_float_text)
	GameManager.connect("turn_changed", _on_turn_changed)
	GameManager.connect("satisfaction_changed", _on_satisfaction_changed)

func _build_containers():
	tiles_container = Node2D.new()
	tiles_container.name = "Tiles"
	add_child(tiles_container)
	tasks_container = Node2D.new()
	tasks_container.name = "Tasks"
	add_child(tasks_container)
	characters_container = Node2D.new()
	characters_container.name = "Characters"
	add_child(characters_container)
	effects_container = Node2D.new()
	effects_container.name = "Effects"
	add_child(effects_container)
	overlay_container = Node2D.new()
	overlay_container.name = "Overlay"
	add_child(overlay_container)

func setup_from_level(level: Dictionary):
	var m: Dictionary = level.get("map", {})
	tile_size = int(m.get("tile_size", 64))
	map_width = int(m.get("width", 8))
	map_height = int(m.get("height", 6))
	grid = m.get("grid", [])
	tile_types = m.get("tile_types", {})
	_clear_containers()
	_build_tiles()
	_build_tasks(level.get("tasks", []))
	_build_characters(level.get("characters", []))
	_update_all_visuals()

func _clear_containers():
	for c in tiles_container.get_children():
		c.queue_free()
	for c in tasks_container.get_children():
		c.queue_free()
	for c in characters_container.get_children():
		c.queue_free()
	for c in effects_container.get_children():
		c.queue_free()
	for c in overlay_container.get_children():
		c.queue_free()
	_move_highlight_tiles.clear()
	_path_tiles.clear()
	_skill_range_tiles.clear()
	_selectable_char_ring.clear()
	character_nodes.clear()
	task_nodes.clear()

func _build_tiles():
	for y in map_height:
		for x in map_width:
			var tcode: String = str(grid[y][x]) if y < grid.size() and x < (grid[y] as Array).size() else "0"
			var tinfo: Dictionary = tile_types.get(tcode, {"walkable": true, "color": "#374151"})
			var tr: ColorRect = ColorRect.new()
			tr.size = Vector2(tile_size - 2, tile_size - 2)
			tr.position = Vector2(x * tile_size + 1, y * tile_size + 1)
			tr.color = Color(tinfo.get("color", "#374151"))
			tr.custom_data = {"gx": x, "gy": y, "walkable": tinfo.get("walkable", true)}
			tiles_container.add_child(tr)
			if tinfo.get("walkable", true):
				var gu: GuiInputDetector = GuiInputDetector.new()
				gu.rect_min_size = tr.size
				gu.position = tr.position
				gu.custom_data = {"gx": x, "gy": y}
				gu.input_detected.connect(_on_tile_gui_input)
				gu.mouse_enter_detector.connect(func _(gd=gu): _on_tile_mouse_enter(gd))
				gu.mouse_exit_detector.connect(func _(gd=gu): _on_tile_mouse_exit(gd))
				overlay_container.add_child(gu)

func _on_tile_gui_input(event: InputEvent, gd: GuiInputDetector):
	var cd: Dictionary = gd.custom_data
	if event is InputEventMouseButton and event.pressed:
		emit_signal("tile_clicked", int(cd.get("gx", 0)), int(cd.get("gy", 0)), int(event.button_index))
		get_viewport().set_input_as_handled()

func _on_tile_mouse_enter(gd: GuiInputDetector):
	var cd: Dictionary = gd.custom_data
	current_cursor = Vector2i(int(cd.get("gx", 0)), int(cd.get("gy", 0)))

func _on_tile_mouse_exit(_gd: GuiInputDetector):
	current_cursor = Vector2i(-1, -1)

func _build_tasks(tasks: Array):
	for i in tasks.size():
		var t: Dictionary = tasks[i]
		var tn: TaskNode = TaskNode.new()
		tn.setup(t, tile_size, i)
		tn.clicked.connect(_on_task_node_clicked)
		tn.position = Vector2(int(t.get("x", 0)) * tile_size, int(t.get("y", 0)) * tile_size)
		tasks_container.add_child(tn)
		task_nodes.append(tn)

func _on_task_node_clicked(task_idx: int):
	emit_signal("task_clicked", task_idx)

func _build_characters(chars_cfg: Array):
	for i in GameManager.characters.size():
		var ch: Dictionary = GameManager.characters[i]
		var cn: CharacterNode = CharacterNode.new()
		cn.setup(ch, tile_size, i)
		cn.clicked.connect(_on_character_node_clicked)
		cn.position = grid_to_world(int(ch.get("grid_x", 0)), int(ch.get("grid_y", 0)))
		characters_container.add_child(cn)
		character_nodes.append(cn)

func _on_character_node_clicked(idx: int):
	emit_signal("character_clicked", idx)

func grid_to_world(gx: int, gy: int) -> Vector2:
	return Vector2(gx * tile_size, gy * tile_size)

func is_walkable(gx: int, gy: int) -> bool:
	if gx < 0 or gy < 0 or gx >= map_width or gy >= map_height:
		return false
	if gy >= grid.size() or gx >= (grid[gy] as Array).size():
		return false
	var tcode: String = str((grid[gy] as Array)[gx])
	var info: Dictionary = tile_types.get(tcode, {})
	return info.get("walkable", true)

func is_blocked_by_character(gx: int, gy: int, exclude_idx: int = -1) -> bool:
	var idx: int = GameManager.get_character_at(gx, gy)
	return idx >= 0 and idx != exclude_idx

func find_path(sx: int, sy: int, tx: int, ty: int, ch_idx: int = -1) -> PackedVector2Array:
	if not is_walkable(tx, ty) or (sx == tx and sy == ty):
		return PackedVector2Array()
	if is_blocked_by_character(tx, ty, ch_idx):
		return PackedVector2Array()
	var open: Array = [{"x": sx, "y": sy, "g": 0, "h": _heuristic(sx, sy, tx, ty), "f": _heuristic(sx, sy, tx, ty), "parent": null}]
	var closed: Dictionary = {}
	var dirs: Array = [[0, -1], [1, 0], [0, 1], [-1, 0]]
	while open.size() > 0:
		open.sort_custom(func (a, b): return a["f"] < b["f"])
		var cur: Dictionary = open.pop_front()
		var key: String = "%d,%d" % [int(cur["x"]), int(cur["y"])]
		if int(cur["x"]) == tx and int(cur["y"]) == ty:
			var path: PackedVector2Array = PackedVector2Array()
			var node: Dictionary = cur
			while node:
				path.insert(0, Vector2(int(node["x"]), int(node["y"])))
				node = node.get("parent", null)
			return path
		closed[key] = true
		for d in dirs:
			var nx: int = int(cur["x"]) + int(d[0])
			var ny: int = int(cur["y"]) + int(d[1])
			var nkey: String = "%d,%d" % [nx, ny]
			if closed.has(nkey):
				continue
			if not is_walkable(nx, ny):
				continue
			if is_blocked_by_character(nx, ny, ch_idx) and not (nx == tx and ny == ty):
				continue
			var ng: float = float(cur["g"]) + 1.0
			var nh: float = _heuristic(nx, ny, tx, ty)
			var nf: float = ng + nh
			var found: bool = false
			for o in open:
				if int(o["x"]) == nx and int(o["y"]) == ny:
					if ng < float(o["g"]):
						o["g"] = ng
						o["f"] = nf
						o["parent"] = cur
					found = true
					break
			if not found:
				open.append({"x": nx, "y": ny, "g": ng, "h": nh, "f": nf, "parent": cur})
	return PackedVector2Array()

func _heuristic(x1: int, y1: int, x2: int, y2: int) -> float:
	return float(abs(x1 - x2) + abs(y1 - y2))

func get_reachable_tiles(ch_idx: int) -> Array:
	if ch_idx < 0 or ch_idx >= GameManager.characters.size():
		return []
	var ch: Dictionary = GameManager.characters[ch_idx]
	var sx: int = int(ch.get("grid_x", 0))
	var sy: int = int(ch.get("grid_y", 0))
	var ap: int = int(ch.get("ap", 0))
	var move_cost: int = int(ConfigLoader.get_balance("balance.move_ap_cost", 1))
	var max_steps: int = min(ap / move_cost, int(ch.get("move_range", 3))) if move_cost > 0 else 0
	if max_steps <= 0:
		return []
	var result: Array = []
	var visited: Dictionary = {"%d,%d" % [sx, sy]: 0}
	var queue: Array = [{"x": sx, "y": sy, "d": 0}]
	var dirs: Array = [[0, -1], [1, 0], [0, 1], [-1, 0]]
	while queue.size() > 0:
		var cur: Dictionary = queue.pop_front()
		if int(cur["d"]) >= max_steps:
			continue
		for d in dirs:
			var nx: int = int(cur["x"]) + int(d[0])
			var ny: int = int(cur["y"]) + int(d[1])
			var nkey: String = "%d,%d" % [nx, ny]
			if visited.has(nkey):
				continue
			if not is_walkable(nx, ny):
				continue
			if is_blocked_by_character(nx, ny, ch_idx):
				continue
			visited[nkey] = int(cur["d"]) + 1
			result.append(Vector2i(nx, ny))
			queue.append({"x": nx, "y": ny, "d": int(cur["d"]) + 1})
	return result

func show_move_highlights(ch_idx: int):
	_hide_move_highlights()
	var tiles: Array = get_reachable_tiles(ch_idx)
	for t in tiles:
		var hl: ColorRect = ColorRect.new()
		hl.color = Color(0.2, 0.5, 1.0, 0.45)
		hl.size = Vector2(tile_size - 4, tile_size - 4)
		hl.position = Vector2(int(t.x) * tile_size + 2, int(t.y) * tile_size + 2)
		var anim: ColorRect = hl
		var tween: Tween = create_tween()
		tween.set_loops()
		tween.tween_property(anim, "color:a", 0.7, 0.6)
		tween.tween_property(anim, "color:a", 0.35, 0.6)
		overlay_container.add_child(hl)
		_move_highlight_tiles.append(hl)

func _hide_move_highlights():
	for n in _move_highlight_tiles:
		n.queue_free()
	_move_highlight_tiles.clear()

func show_skill_range_tiles(range: int, gx: int, gy: int):
	_hide_skill_range()
	for dy in range(-range, range + 1):
		for dx in range(-range, range + 1):
			if abs(dx) + abs(dy) > range:
				continue
			if dx == 0 and dy == 0:
				continue
			var nx: int = gx + dx
			var ny: int = gy + dy
			if nx < 0 or ny < 0 or nx >= map_width or ny >= map_height:
				continue
			var hl: ColorRect = ColorRect.new()
			hl.color = Color(0.9, 0.4, 0.9, 0.45)
			hl.size = Vector2(tile_size - 4, tile_size - 4)
			hl.position = Vector2(nx * tile_size + 2, ny * tile_size + 2)
			overlay_container.add_child(hl)
			_skill_range_tiles.append(hl)

func _hide_skill_range():
	for n in _skill_range_tiles:
		n.queue_free()
	_skill_range_tiles.clear()

func show_selectable_ring(ch_idx: int):
	_hide_selectable_ring()
	if ch_idx < 0 or ch_idx >= character_nodes.size():
		return
	var cn: CharacterNode = character_nodes[ch_idx]
	var ring: ColorRect = ColorRect.new()
	ring.color = Color(1, 0.85, 0.2, 0.0)
	ring.size = Vector2(tile_size + 6, tile_size + 6)
	ring.position = cn.position - Vector2(3, 3)
	var border: StyleBoxFlat = StyleBoxFlat.new()
	border.border_width_left = 3
	border.border_width_right = 3
	border.border_width_top = 3
	border.border_width_bottom = 3
	border.border_color = Color(1.0, 0.85, 0.2, 0.9)
	border.bg_color = Color(0, 0, 0, 0)
	var pp: Panel = Panel.new()
	pp.size = ring.size
	pp.position = ring.position
	pp.add_theme_stylebox_override("panel", border)
	var tw: Tween = create_tween()
	tw.set_loops()
	tw.tween_property(border, "border_color:a", 0.3, 0.5)
	tw.tween_property(border, "border_color:a", 1.0, 0.5)
	overlay_container.add_child(pp)
	_selectable_char_ring.append(pp)

func _hide_selectable_ring():
	for n in _selectable_char_ring:
		n.queue_free()
	_selectable_char_ring.clear()

func move_character_to(ch_idx: int, path: PackedVector2Array):
	if ch_idx < 0 or ch_idx >= character_nodes.size() or path.size() <= 1:
		return
	var cn: CharacterNode = character_nodes[ch_idx]
	var move_cost: int = int(ConfigLoader.get_balance("balance.move_ap_cost", 1))
	var steps: int = path.size() - 1
	var ch: Dictionary = GameManager.characters[ch_idx]
	var ap_per_step: int = move_cost
	var max_affordable: int = int(ch.get("ap", 0)) / ap_per_step if ap_per_step > 0 else steps
	var actual_steps: int = min(steps, max_affordable)
	var actual_path: PackedVector2Array = PackedVector2Array()
	for i in actual_steps + 1:
		actual_path.append(path[i])
	var tw: Tween = create_tween()
	tw.set_parallel(false)
	var duration: float = float(ConfigLoader.get_balance("ui.animation_duration_move", 0.3))
	for i in range(1, actual_path.size()):
		var target: Vector2 = grid_to_world(int(actual_path[i].x), int(actual_path[i].y))
		tw.tween_property(cn, "position", target, duration).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
		tw.parallel().tween_property(cn, "scale", Vector2(1.08, 0.92), duration * 0.5)
		tw.parallel().tween_property(cn, "scale", Vector2(1, 1), duration * 0.5).set_delay(duration * 0.5)
	tw.tween_callback(func _():
		var final_step: Vector2 = actual_path[actual_path.size() - 1]
		ch["grid_x"] = int(final_step.x)
		ch["grid_y"] = int(final_step.y)
		ch["ap"] = int(ch.get("ap", 0)) - actual_steps * ap_per_step
		_update_all_visuals()
		AudioManager.play_sfx("move")
	)

func work_animation(ch_idx: int):
	if ch_idx < 0 or ch_idx >= character_nodes.size():
		return
	var cn: CharacterNode = character_nodes[ch_idx]
	var tw: Tween = create_tween()
	tw.tween_property(cn, "rotation_degrees", -10.0, 0.08)
	tw.tween_property(cn, "rotation_degrees", 8.0, 0.12)
	tw.tween_property(cn, "rotation_degrees", -6.0, 0.1)
	tw.tween_property(cn, "rotation_degrees", 0.0, 0.08)
	var dur: float = float(ConfigLoader.get_balance("ui.animation_duration_work", 0.5))
	var spark: ColorRect = ColorRect.new()
	spark.color = Color(1, 0.95, 0.3, 0.9)
	spark.size = Vector2(10, 10)
	spark.position = cn.position + Vector2(tile_size / 2, -4)
	spark.z_index = 5
	effects_container.add_child(spark)
	var tw2: Tween = create_tween()
	tw2.tween_property(spark, "scale", Vector2(2.5, 2.5), dur)
	tw2.parallel().tween_property(spark, "color:a", 0.0, dur)
	tw2.tween_callback(spark.queue_free)

func skill_animation(ch_idx: int):
	if ch_idx < 0 or ch_idx >= character_nodes.size():
		return
	var cn: CharacterNode = character_nodes[ch_idx]
	var tw: Tween = create_tween()
	tw.tween_property(cn, "modulate", Color(1.5, 1.5, 1.8, 1.0), 0.15)
	tw.tween_property(cn, "scale", Vector2(1.2, 1.2), 0.1)
	tw.tween_property(cn, "scale", Vector2(1.0, 1.0), 0.15)
	tw.tween_property(cn, "modulate", Color.WHITE, 0.2)

func task_complete_animation(task_idx: int):
	if task_idx < 0 or task_idx >= task_nodes.size():
		return
	var tn: TaskNode = task_nodes[task_idx]
	var tw: Tween = create_tween()
	tw.tween_property(tn, "scale", Vector2(1.4, 1.4), 0.25)
	tw.tween_property(tn, "scale", Vector2(1.0, 1.0), 0.2)
	tw.tween_property(tn, "modulate:a", 0.5, 0.3)

func _update_all_visuals():
	for i in character_nodes.size():
		var cn: CharacterNode = character_nodes[i]
		var ch: Dictionary = GameManager.characters[i]
		cn.update_visual(ch)
	for i in task_nodes.size():
		var tn: TaskNode = task_nodes[i]
		tn.update_visual(GameManager.tasks[i])

func _on_character_selected(idx: int):
	_hide_move_highlights()
	_hide_selectable_ring()
	_hide_skill_range()
	if idx >= 0:
		show_move_highlights(idx)
		show_selectable_ring(idx)
	_update_all_visuals()

func _on_float_text(grid_pos: Vector2, text: String, color: Color):
	var world_pos: Vector2 = grid_to_world(int(grid_pos.x), int(grid_pos.y)) + Vector2(tile_size / 2, tile_size / 2)
	_spawn_float_text(world_pos, text, color)

func _spawn_float_text(pos: Vector2, text: String, color: Color):
	var lbl: Label = Label.new()
	lbl.text = text
	lbl.add_theme_font_size_override("font_size", 18)
	lbl.modulate = color
	var fb: FontFile = lbl.get_theme_font("font")
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.position = pos - Vector2(0, 0)
	lbl.z_index = 20
	var tfs: OutlineLabelContainer = OutlineLabelContainer.new()
	tfs.add_child(lbl)
	tfs.position = pos
	effects_container.add_child(tfs)
	var tw: Tween = create_tween()
	tw.tween_property(tfs, "position:y", pos.y - 40, 0.8).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(lbl, "modulate:a", 0.0, 0.8).set_delay(0.4)
	tw.tween_callback(tfs.queue_free)

func _on_turn_changed(_nt: int):
	_update_all_visuals()

func _on_satisfaction_changed(_nv, _d):
	pass

func hide_all_highlights():
	_hide_move_highlights()
	_hide_selectable_ring()
	_hide_skill_range()
