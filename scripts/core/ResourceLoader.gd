extends Node

const ITEMS_PATH: String = "res://scripts/data/Items.gd"
const ITEM_SPRITES_PATH: String = "res://assets/sprites/items/"
const AUDIO_PATH: String = "res://assets/audio/"

var _scene_cache: Dictionary = {}
var _texture_cache: Dictionary = {}
var _audio_cache: Dictionary = {}
var _item_data: Dictionary = {}

func _ready() -> void:
    _load_item_data()
    print("[ResourceLoader] 初始化完成")

func _load_item_data() -> void:
    if ResourceLoader.exists(ITEMS_PATH):
        var script = load(ITEMS_PATH)
        if script:
            _item_data = script.get_all()
            print("[ResourceLoader] 加载了 " + str(_item_data.size()) + " 个物品数据")

func load_scene(path: String, use_cache: bool = true) -> PackedScene:
    if use_cache and path in _scene_cache:
        return _scene_cache[path]
    
    if not ResourceLoader.exists(path):
        push_warning("资源不存在: " + path)
        return null
    
    var scene = load(path)
    if use_cache and scene != null:
        _scene_cache[path] = scene
    return scene

func get_item_data(item_id: String) -> Dictionary:
    return _item_data.get(item_id, {})

func get_all_items() -> Dictionary:
    return _item_data

func get_item_texture(item_id: String) -> Texture2D:
    var path = ITEM_SPRITES_PATH + item_id + ".svg"
    if path in _texture_cache:
        return _texture_cache[path]
    
    if ResourceLoader.exists(path):
        var tex = load(path)
        _texture_cache[path] = tex
        return tex
    
    return _create_default_texture(item_id)

func _create_default_texture(item_id: String) -> Texture2D:
    var color_map: Dictionary = {
        "apple": Color(1, 0.3, 0.3),
        "bread": Color(0.85, 0.65, 0.35),
        "carrot": Color(1, 0.55, 0.15),
        "fish": Color(0.4, 0.7, 0.9),
        "meat": Color(0.75, 0.3, 0.25),
        "cheese": Color(1, 0.9, 0.3),
        "vegetable": Color(0.3, 0.7, 0.3),
        "fruit": Color(0.9, 0.4, 0.6),
        "craft": Color(0.6, 0.4, 0.8),
        "flower": Color(1, 0.5, 0.8)
    }
    
    var color = color_map.get(item_id, Color(0.7, 0.7, 0.7))
    var image = Image.create(64, 64, false, Image.FORMAT_RGBA8)
    image.fill(Color(0, 0, 0, 0))
    
    for x in range(8, 56):
        for y in range(8, 56):
            var dx = (x - 32.0) / 24.0
            var dy = (y - 32.0) / 24.0
            var dist = sqrt(dx * dx + dy * dy)
            if dist <= 1.0:
                var alpha = clamp(1.0 - dist * 0.3, 0.5, 1.0)
                image.set_pixel(x, y, Color(color.r, color.g, color.b, alpha))
    
    var texture = ImageTexture.create_from_image(image)
    _texture_cache[ITEM_SPRITES_PATH + item_id + ".svg"] = texture
    return texture

func get_audio_stream(audio_id: String) -> AudioStream:
    var path = AUDIO_PATH + audio_id + ".wav"
    if path in _audio_cache:
        return _audio_cache[path]
    
    if ResourceLoader.exists(path):
        var stream = load(path)
        _audio_cache[path] = stream
        return stream
    
    return null

func clear_cache() -> void:
    _scene_cache.clear()
    _texture_cache.clear()
    _audio_cache.clear()
