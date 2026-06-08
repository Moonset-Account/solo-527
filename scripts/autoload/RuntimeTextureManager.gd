extends Node
## 运行时占位纹理管理器 - 自动为所有PlaceholderTexture2D生成视觉化纹理
## 确保在没有美术资源时游戏也能正常显示

var _texture_cache: Dictionary = {}
var _generator_rng: RandomNumberGenerator = RandomNumberGenerator.new()

var PALETTE_ROBOT := {
	"body": Color(0.35, 0.65, 0.95),
	"body_dark": Color(0.18, 0.38, 0.6),
	"accent": Color(1.0, 0.85, 0.2),
	"eye": Color(0.2, 1.0, 0.5),
	"leg": Color(0.2, 0.22, 0.28),
}

var PALETTE_SHELF := {
	"frame": Color(0.4, 0.3, 0.25),
	"frame_dark": Color(0.25, 0.18, 0.14),
	"shelf": Color(0.55, 0.48, 0.38),
	"box_a": Color(0.8, 0.5, 0.3),
	"box_b": Color(0.35, 0.6, 0.85),
	"box_c": Color(0.5, 0.75, 0.4),
	"label_bg": Color(0.9, 0.9, 0.85),
}

var PALETTE_LIGHT := {
	"base": Color(0.5, 0.5, 0.55),
	"pole": Color(0.35, 0.35, 0.4),
	"lens": Color(1.0, 0.95, 0.3),
	"lens_dim": Color(0.8, 0.65, 0.15),
}

var PALETTE_CP := {
	"base": Color(0.25, 0.3, 0.4),
	"glow": Color(0.3, 1.0, 0.5),
	"glow_dim": Color(0.2, 0.6, 0.35),
	"beam": Color(0.4, 0.9, 0.6),
}

var PALETTE_ICON := {
	"bg": Color(0.08, 0.12, 0.2),
	"robot": Color(0.35, 0.65, 0.95),
	"eye": Color(0.2, 1.0, 0.5),
	"light": Color(1.0, 0.9, 0.3),
	"ring": Color(0.3, 1.0, 0.5),
}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_generator_rng.seed = 1337
	_make_dirs()
	generate_all_placeholder_art()
	print("[RuntimeTextureManager] 占位纹理生成完成")

func _make_dirs() -> void:
	var dirs := [
		"res://assets",
		"res://assets/art",
		"res://assets/art/characters",
		"res://assets/art/environment",
		"res://assets/art/ui",
		"res://assets/audio",
		"res://assets/animations",
	]
	for d in dirs:
		if not DirAccess.dir_exists_absolute(d):
			DirAccess.make_dir_absolute(d)

func generate_all_placeholder_art() -> void:
	_generate_player_textures()
	_generate_shelf_textures()
	_generate_patrol_light_textures()
	_generate_checkpoint_textures()
	_generate_ui_icon()

func _get_cache_key(prefix: String, variant: int, width: int, height: int) -> String:
	return "%s_%d_%dx%d" % [prefix, variant, width, height]

func _generate_image(width: int, height: int, color: Color) -> Image:
	var img := Image.create(width, height, false, Image.FORMAT_RGBA8)
	img.fill(color)
	return img

func _save_img_as_tex(img: Image, path: String) -> void:
	img.save_png(path)

func _generate_player_textures() -> void:
	var variants_idle = [0]
	var variants_walk = [0, 1, 2, 1]
	for i in variants_idle.size():
		var img := _make_robot_image(48, 64, 0, false, i)
		_save_img_as_tex(img, "res://assets/art/characters/player_idle_%d.png" % i)
	for i in 4:
		var offset := i % 2
		var img := _make_robot_image(48, 64, offset, false, i)
		_save_img_as_tex(img, "res://assets/art/characters/player_walk_%d.png" % i)
	for i in 4:
		var offset := i % 2
		var img := _make_robot_image(48, 64, offset, true, i)
		_save_img_as_tex(img, "res://assets/art/characters/player_run_%d.png" % i)
	for i in 2:
		var img := _make_robot_crouch(48, 48, i)
		var path: String = ""
		if i == 0:
			path = "res://assets/art/characters/player_crouch_idle.png"
		else:
			path = "res://assets/art/characters/player_crouch_walk_%d.png" % i
		_save_img_as_tex(img, path)
		_save_img_as_tex(img, "res://assets/art/characters/player_crouch_walk_%d.png" % i)
	for i in 3:
		var img := _make_robot_image(48, 64, 0, false, 0)
		_draw_scan_beam(img, i)
		_save_img_as_tex(img, "res://assets/art/characters/player_scan_%d.png" % i)

func _make_robot_image(width: int, height: int, leg_offset: int, running: bool, variant: int) -> Image:
	var img := _generate_image(width, height, Color.TRANSPARENT)
	var cx := width / 2
	var pal := PALETTE_ROBOT
	var head_r := 10
	var head_cy := int(height * 0.25)
	for y in range(head_cy - head_r, head_cy + head_r + 1):
		for x in range(cx - head_r, cx + head_r + 1):
			var dx := x - cx
			var dy := y - head_cy
			if dx * dx + dy * dy <= head_r * head_r:
				if y < head_cy - 3:
					img.set_pixel(x, y, pal["body_dark"])
				else:
					img.set_pixel(x, y, pal["body"])
	var eye_y := head_cy + 1
	for ey in range(eye_y - 1, eye_y + 2):
		for ex in range(cx - 6, cx - 3):
			img.set_pixel(ex, ey, pal["eye"])
		for ex in range(cx + 4, cx + 7):
			img.set_pixel(ex, ey, pal["eye"])
	var body_top := head_cy + head_r + 2
	var body_bottom := int(height * 0.7)
	var body_left := cx - 12
	var body_right := cx + 12
	for y in range(body_top, body_bottom):
		for x in range(body_left, body_right):
			if y < body_top + 3 or y > body_bottom - 4 or x < body_left + 2 or x > body_right - 3:
				img.set_pixel(x, y, pal["body_dark"])
			else:
				img.set_pixel(x, y, pal["body"])
	for y in range(body_top + 8, body_top + 13):
		for x in range(body_left + 4, body_right - 4):
			if y != body_top + 10:
				img.set_pixel(x, y, pal["accent"])
	if variant % 3 == 0:
		for y in range(body_top + 18, body_top + 25):
			for x in range(body_left + 7, body_right - 7):
				var c: Color = pal["eye"]
				c.a = 0.6
				img.set_pixel(x, y, c)
	var leg_col: Color = pal["leg"]
	var leg_top: int = body_bottom
	var leg_bottom: int = height - 2
	var leg_width: int = 4
	var positions: Array = [cx - 9, cx - 3, cx + 3, cx + 9]
	for idx in positions.size():
		var loff: int = 0
		if running:
			if (idx + variant) % 2 == 0:
				loff = -2
			else:
				loff = 2
		elif leg_offset != 0:
			if idx % 2 == 0:
				loff = -1
			else:
				loff = 1
		var lx: int = positions[idx] + loff
		for y in range(leg_top, leg_bottom):
			for w in range(leg_width):
				var px: int = lx - 2 + w
				if px >= 0 and px < width and y >= 0 and y < height:
					img.set_pixel(px, y, leg_col)
	return img

func _make_robot_crouch(width: int, height: int, variant: int) -> Image:
	var img := _generate_image(width, height, Color.TRANSPARENT)
	var cx := width / 2
	var pal := PALETTE_ROBOT
	var body_top := int(height * 0.2)
	var body_bottom := height - 4
	var body_left := cx - 14
	var body_right := cx + 14
	for y in range(body_top, body_bottom):
		for x in range(body_left, body_right):
			if y < body_top + 3 or y > body_bottom - 4 or x < body_left + 2 or x > body_right - 3:
				img.set_pixel(x, y, pal["body_dark"])
			else:
				img.set_pixel(x, y, pal["body"])
	var eye_y := body_top + int((body_bottom - body_top) * 0.22)
	for ey in range(eye_y - 1, eye_y + 2):
		for ex in range(cx - 8, cx - 5):
			img.set_pixel(ex, ey, pal["eye"])
		for ex in range(cx + 5, cx + 8):
			img.set_pixel(ex, ey, pal["eye"])
	for y in range(body_top + int((body_bottom - body_top) * 0.4), body_top + int((body_bottom - body_top) * 0.4) + 4):
		for x in range(body_left + 5, body_right - 5):
			img.set_pixel(x, y, pal["accent"])
	var leg_top: int = body_bottom - 3
	var positions: Array = [cx - 9, cx - 3, cx + 3, cx + 9]
	for idx in positions.size():
		var lx: int = positions[idx]
		for y in range(leg_top, height - 1):
			for w in range(5):
				var px: int = lx - 2 + w
				if px >= 0 and px < width and y >= 0 and y < height:
					img.set_pixel(px, y, pal["leg"])
	return img

func _draw_scan_beam(img: Image, variant: int) -> void:
	var width := img.get_width()
	var height := img.get_height()
	var start_x := int(width * 0.72)
	var start_y := int(height * 0.4)
	var beam_color: Color = PALETTE_ROBOT["eye"]
	beam_color.a = 0.7
	var glow: Color = PALETTE_ROBOT["accent"]
	glow.a = 0.35
	for step in range(width - start_x - 2):
		var wobble := int(sin(step * 0.35 + variant * 1.2) * 2.5)
		for w in range(3):
			var x := start_x + step
			var y := start_y + wobble + w - 1
			if x >= 0 and x < width and y >= 0 and y < height:
				var alpha_fade := 1.0 - float(step) / float(width - start_x)
				if w == 1:
					var c := beam_color
					c.a = beam_color.a * alpha_fade
					img.set_pixel(x, y, c)
				else:
					var c := glow
					c.a = glow.a * alpha_fade
					img.set_pixel(x, y, c)
	for y in range(start_y - 3, start_y + 4):
		for x in range(start_x - 4, start_x + 2):
			if x >= 0 and x < width and y >= 0 and y < height:
				img.set_pixel(x, y, glow)

func _generate_shelf_textures() -> void:
	for i in range(3):
		var img := _make_shelf_image(64, 128, i)
		_save_img_as_tex(img, "res://assets/art/environment/shelf_%d.png" % i)
	_save_img_as_tex(_make_shelf_image(64, 128, 0), "res://assets/art/environment/shelf_base.png")

func _make_shelf_image(width: int, height: int, variant: int) -> Image:
	var img := _generate_image(width, height, Color.TRANSPARENT)
	var pal := PALETTE_SHELF
	var frame_l := 4
	var frame_r := width - 4
	var levels := 4
	var level_step := int(height / (levels + 1))
	var frame_color: Color = pal["frame"]
	var frame_dark: Color = pal["frame_dark"]
	for y in range(height):
		for x in range(frame_l - 2, frame_l + 3):
			var pixel_color_l: Color
			if x >= frame_l:
				pixel_color_l = frame_color
			else:
				pixel_color_l = frame_dark
			img.set_pixel(x, y, pixel_color_l)
		for x in range(frame_r - 2, frame_r + 3):
			var pixel_color_r: Color
			if x < frame_r:
				pixel_color_r = frame_color
			else:
				pixel_color_r = frame_dark
			img.set_pixel(x, y, pixel_color_r)
	for lv in range(levels + 1):
		var y := int(level_step * (lv + 0.5))
		for x in range(frame_l - 2, frame_r + 2):
			if y >= 0 and y < height:
				if lv == levels:
					img.set_pixel(x, y, frame_dark)
				else:
					img.set_pixel(x, y, frame_color)
	for lv in range(levels):
		var shelf_top := int(level_step * (lv + 0.5)) + 1
		var shelf_bottom := int(level_step * (lv + 1.5)) - 1
		if variant == 0:
			_draw_box(img, 8, shelf_top + 4, 20, shelf_bottom - 2, pal["box_a"])
			_draw_box(img, width - 28, shelf_top + 2, 20, shelf_bottom - 4, pal["box_b"])
		elif variant == 1:
			_draw_box(img, 10, shelf_top + 6, 18, shelf_bottom - 2, pal["box_c"])
			_draw_box(img, width - 26, shelf_top + 3, 16, shelf_bottom - 5, pal["box_a"])
			_draw_box(img, int(width / 2) - 8, shelf_top + 4, 16, shelf_bottom - 3, pal["box_b"])
		else:
			_draw_box(img, 6, shelf_top + 3, 14, shelf_bottom - 4, pal["box_b"])
			_draw_box(img, 22, shelf_top + 5, 18, shelf_bottom - 2, pal["box_c"])
			_draw_box(img, width - 22, shelf_top + 2, 16, shelf_bottom - 5, pal["box_a"])
	return img

func _draw_box(img: Image, x: int, y: int, w: int, h: int, c: Color) -> void:
	var width := img.get_width()
	var height := img.get_height()
	for py in range(y, y + h):
		for px in range(x, x + w):
			if px >= 0 and px < width and py >= 0 and py < height:
				var edge := px < x + 1 or px >= x + w - 1 or py < y + 1 or py >= y + h - 1
				if edge:
					var dark_c := Color(c.r * 0.6, c.g * 0.6, c.b * 0.6, c.a)
					img.set_pixel(px, py, dark_c)
				else:
					img.set_pixel(px, py, c)

func _generate_patrol_light_textures() -> void:
	var img := _make_patrol_light(64, 64)
	_save_img_as_tex(img, "res://assets/art/environment/patrol_light_base.png")

func _make_patrol_light(width: int, height: int) -> Image:
	var img := _generate_image(width, height, Color.TRANSPARENT)
	var pal := PALETTE_LIGHT
	var cx := width / 2
	var cy := int(height * 0.65)
	var pole_top := int(height * 0.15)
	for y in range(pole_top, cy):
		for x in range(cx - 4, cx + 5):
			img.set_pixel(x, y, pal["pole"])
	var base_r := 18
	for y in range(cy - base_r, cy + base_r + 1):
		for x in range(cx - base_r, cx + base_r + 1):
			var dx := x - cx
			var dy := y - cy
			if dx * dx + dy * dy <= base_r * base_r:
				if abs(dx) > base_r - 4 or dy < -base_r + 4:
					img.set_pixel(x, y, Color(pal["base"].r * 0.7, pal["base"].g * 0.7, pal["base"].b * 0.7))
				else:
					img.set_pixel(x, y, pal["base"])
	var lens_cx := cx
	var lens_cy := cy - 2
	var lens_r := 10
	for y in range(lens_cy - lens_r, lens_cy + lens_r + 1):
		for x in range(lens_cx - lens_r, lens_cx + lens_r + 1):
			var dx := x - lens_cx
			var dy := y - lens_cy
			if dx * dx + dy * dy <= lens_r * lens_r:
				if dy < -3 and dx > -4 and dx < 4:
					img.set_pixel(x, y, Color(1, 1, 1, 0.95))
				else:
					img.set_pixel(x, y, pal["lens"])
	return img

func _generate_checkpoint_textures() -> void:
	var img := _make_checkpoint_image(64, 128)
	_save_img_as_tex(img, "res://assets/art/environment/checkpoint_base.png")

func _make_checkpoint_image(width: int, height: int) -> Image:
	var img := _generate_image(width, height, Color.TRANSPARENT)
	var pal := PALETTE_CP
	var cx := width / 2
	var base_top := int(height * 0.55)
	var base_bottom := height - 4
	var base_l := cx - 16
	var base_r := cx + 16
	for y in range(base_top, base_bottom):
		for x in range(base_l, base_r):
			var edge := y < base_top + 2 or y > base_bottom - 3 or x < base_l + 2 or x > base_r - 3
			var base_pixel: Color
			if not edge:
				base_pixel = pal["base"]
			else:
				base_pixel = Color(pal["base"].r * 0.6, pal["base"].g * 0.6, pal["base"].b * 0.6)
			img.set_pixel(x, y, base_pixel)
	var pole_cx := cx
	var pole_top := int(height * 0.05)
	var pole_bottom := base_top
	for y in range(pole_top, pole_bottom):
		for x in range(pole_cx - 2, pole_cx + 3):
			img.set_pixel(x, y, pal["base"])
	var diamond_cy := pole_top + 16
	var diamond_r := 14
	for y in range(diamond_cy - diamond_r, diamond_cy + diamond_r):
		for x in range(cx - diamond_r, cx + diamond_r):
			var md: int = abs(x - cx) + abs(y - diamond_cy)
			if md <= diamond_r:
				var dist_ratio := 1.0 - float(md) / diamond_r
				var c: Color = pal["glow"]
				c.a = dist_ratio
				img.set_pixel(x, y, c)
	return img

func _generate_ui_icon() -> void:
	var sizes := [[16, 16], [32, 32], [64, 64], [128, 128], [256, 256], [512, 512]]
	for sz in sizes:
		var img := _make_icon(sz[0], sz[1])
		var path: String = ""
		if sz[0] == 128:
			path = "res://assets/art/ui/icon.png"
		else:
			path = "res://assets/art/ui/icon_%d.png" % sz[0]
		_save_img_as_tex(img, path)
	_save_img_as_tex(_make_icon(128, 128), "res://icon.png")

func _make_icon(size: int, _size_y: int) -> Image:
	var img := _generate_image(size, size, PALETTE_ICON["bg"])
	var cx := size / 2
	var cy := int(size * 0.52)
	var pal := PALETTE_ICON
	var robot_r := int(size * 0.28)
	for y in range(cy - robot_r, cy + robot_r + 1):
		for x in range(cx - robot_r, cx + robot_r + 1):
			var dx := x - cx
			var dy := y - cy
			if dx * dx + dy * dy <= robot_r * robot_r:
				var dist := float(dx * dx + dy * dy) / float(robot_r * robot_r)
				if dist > 0.75:
					img.set_pixel(x, y, Color(pal["robot"].r * 0.6, pal["robot"].g * 0.6, pal["robot"].b * 0.7))
				else:
					img.set_pixel(x, y, pal["robot"])
	var eye_y := cy - int(robot_r * 0.2)
	var eye_dx := int(robot_r * 0.45)
	var eye_r: int = max(2, int(robot_r * 0.18))
	for side in [-1, 1]:
		var ecx: int = cx + side * eye_dx
		for y in range(eye_y - eye_r, eye_y + eye_r + 1):
			for x in range(ecx - eye_r, ecx + eye_r + 1):
				var dx: int = x - ecx
				var dy: int = y - eye_y
				if dx * dx + dy * dy <= eye_r * eye_r:
					img.set_pixel(x, y, pal["eye"])
	var ring_r := int(size * 0.4)
	var t := Time.get_ticks_msec() / 1000.0
	for a in range(360):
		var rad := deg_to_rad(a)
		var wobble := sin(a * 0.03 + t) * 2.0
		for w in range(max(2, int(size / 80))):
			var r := ring_r + wobble - w
			var x := cx + int(cos(rad) * r)
			var y := int(size * 0.2) + int(sin(rad) * r * 0.6)
			if x >= 0 and x < size and y >= 0 and y < size:
				if w == 0:
					img.set_pixel(x, y, pal["ring"])
				else:
					var c: Color = pal["ring"]
					c.a = 0.4
					img.set_pixel(x, y, c)
	return img

func get_texture(key: String) -> ImageTexture:
	if _texture_cache.has(key):
		return _texture_cache[key]
	return null
