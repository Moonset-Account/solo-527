extends Node
## 纹理替换器 - 场景加载后自动将PlaceholderTexture2D替换为运行时生成的实际纹理
## 这个单例确保即使使用占位纹理，游戏在运行时也有正常显示效果

var _player_tex_cache: Dictionary = {}
var _shelf_tex_cache: Dictionary = {}
var _light_tex_cache: Dictionary = {}
var _cp_tex_cache: Dictionary = {}
var _initialized: bool = false

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	get_tree().scene_changed.connect(_on_scene_changed)
	await get_tree().process_frame
	_initialize_textures()

func _initialize_textures() -> void:
	if _initialized:
		return
	_initialized = true
	_load_player_textures()
	_load_shelf_textures()
	_load_light_textures()
	_load_cp_textures()

func _load_player_textures() -> void:
	var tex_paths := {
		"idle_0": "res://assets/art/characters/player_idle_0.png",
		"walk_0": "res://assets/art/characters/player_walk_0.png",
		"walk_1": "res://assets/art/characters/player_walk_1.png",
		"walk_2": "res://assets/art/characters/player_walk_2.png",
		"walk_3": "res://assets/art/characters/player_walk_3.png",
		"run_0": "res://assets/art/characters/player_run_0.png",
		"run_1": "res://assets/art/characters/player_run_1.png",
		"run_2": "res://assets/art/characters/player_run_2.png",
		"run_3": "res://assets/art/characters/player_run_3.png",
		"crouch_idle": "res://assets/art/characters/player_crouch_idle.png",
		"crouch_walk_0": "res://assets/art/characters/player_crouch_walk_0.png",
		"crouch_walk_1": "res://assets/art/characters/player_crouch_walk_1.png",
		"scan_0": "res://assets/art/characters/player_scan_0.png",
		"scan_1": "res://assets/art/characters/player_scan_1.png",
		"scan_2": "res://assets/art/characters/player_scan_2.png",
	}
	for key in tex_paths.keys():
		var path: String = tex_paths[key]
		if ResourceLoader.exists(path):
			_player_tex_cache[key] = load(path)

func _load_shelf_textures() -> void:
	for i in 3:
		var path := "res://assets/art/environment/shelf_%d.png" % i
		if ResourceLoader.exists(path):
			_shelf_tex_cache[str(i)] = load(path)
	var base_path := "res://assets/art/environment/shelf_base.png"
	if ResourceLoader.exists(base_path):
		_shelf_tex_cache["base"] = load(base_path)

func _load_light_textures() -> void:
	var path := "res://assets/art/environment/patrol_light_base.png"
	if ResourceLoader.exists(path):
		_light_tex_cache["base"] = load(path)

func _load_cp_textures() -> void:
	var path := "res://assets/art/environment/checkpoint_base.png"
	if ResourceLoader.exists(path):
		_cp_tex_cache["base"] = load(path)

func _on_scene_changed(root: Node) -> void:
	await get_tree().process_frame
	if root:
		_replace_placeholders_in_tree(root)

func replace_all_in(node: Node) -> void:
	_replace_placeholders_in_tree(node)

func _replace_placeholders_in_tree(node: Node) -> void:
	_process_node_for_placeholder(node)
	for child in node.get_children():
		_replace_placeholders_in_tree(child)

func _process_node_for_placeholder(node: Node) -> void:
	if node is Sprite2D:
		_replace_sprite_placeholder(node)
	elif node is AnimatedSprite2D:
		_replace_animated_sprite_placeholder(node)

func _replace_sprite_placeholder(sprite: Sprite2D) -> void:
	var tex := sprite.texture
	if tex == null:
		_assign_default_texture(sprite)
		return
	if tex is PlaceholderTexture2D or tex.get_class() == "PlaceholderTexture2D":
		_assign_default_texture(sprite)

func _assign_default_texture(sprite: Sprite2D) -> void:
	var parent := sprite.get_parent()
	if parent == null:
		return
	var parent_name := parent.name
	if "shelf" in parent_name.to_lower() or parent is StaticBody2D and parent.has_method("is_fixed"):
		if _shelf_tex_cache.has("base"):
			sprite.texture = _shelf_tex_cache["base"]
		elif not _shelf_tex_cache.is_empty():
			sprite.texture = _shelf_tex_cache.values()[0]
	elif "patrol" in parent_name.to_lower() or "light" in parent_name.to_lower():
		if _light_tex_cache.has("base"):
			sprite.texture = _light_tex_cache["base"]
	elif "checkpoint" in parent_name.to_lower() or "cp_" in parent_name.to_lower():
		if _cp_tex_cache.has("base"):
			sprite.texture = _cp_tex_cache["base"]
	elif sprite.name.to_lower().contains("icon"):
		var icon_path := "res://assets/art/ui/icon.png"
		if ResourceLoader.exists(icon_path):
			sprite.texture = load(icon_path)
	elif parent.name.to_lower().contains("player") or "player" in sprite.get_path().to_lower():
		if _player_tex_cache.has("idle_0"):
			sprite.texture = _player_tex_cache["idle_0"]

func _replace_animated_sprite_placeholder(anim_sprite: AnimatedSprite2D) -> void:
	var frames := anim_sprite.sprite_frames
	if frames == null:
		return
	var animations := frames.get_animation_names()
	for anim_name in animations:
		var frame_count := frames.get_frame_count(anim_name)
		for i in frame_count:
			var frame_tex := frames.get_frame_texture(anim_name, i)
			if frame_tex == null or frame_tex is PlaceholderTexture2D or frame_tex.get_class() == "PlaceholderTexture2D":
				var replacement_tex := _find_replacement_for_animation(anim_name, i)
				if replacement_tex:
					frames.set_frame_texture(anim_name, i, replacement_tex)

func _find_replacement_for_animation(anim_name: StringName, frame_idx: int) -> Texture2D:
	var str_name := String(anim_name)
	match str_name:
		"idle":
			return _player_tex_cache.get("idle_0", null)
		"walk":
			var idx := frame_idx % 4
			var key := "walk_%d" % idx
			if _player_tex_cache.has(key):
				return _player_tex_cache[key]
			return _player_tex_cache.get("walk_0", null)
		"run":
			var ridx := frame_idx % 4
			var rkey := "run_%d" % ridx
			if _player_tex_cache.has(rkey):
				return _player_tex_cache[rkey]
			return _player_tex_cache.get("run_0", _player_tex_cache.get("walk_0", null))
		"crouch_idle":
			return _player_tex_cache.get("crouch_idle", _player_tex_cache.get("crouch_walk_0", null))
		"crouch_walk":
			var cidx := frame_idx % 2
			var ckey := "crouch_walk_%d" % cidx
			if _player_tex_cache.has(ckey):
				return _player_tex_cache[ckey]
			return _player_tex_cache.get("crouch_idle", null)
		"scan":
			var sidx := frame_idx % 3
			var skey := "scan_%d" % sidx
			if _player_tex_cache.has(skey):
				return _player_tex_cache[skey]
			return _player_tex_cache.get("idle_0", null)
		_:
			return _player_tex_cache.get("idle_0", null)

func get_player_texture(key: String) -> Texture2D:
	return _player_tex_cache.get(key, null)

func get_shelf_texture(key: String) -> Texture2D:
	return _shelf_tex_cache.get(key, null)

func get_light_texture(key: String) -> Texture2D:
	return _light_tex_cache.get(key, null)

func get_cp_texture(key: String) -> Texture2D:
	return _cp_tex_cache.get(key, null)
