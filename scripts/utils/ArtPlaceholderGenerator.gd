extends Node
## 美术占位资源生成器 - 程序化生成所有游戏内占位纹理
## 在编辑器首次运行时调用 generate_all() 创建完整的占位图资源

var _image_cache: Dictionary = {}

const ART_DIR := "res://assets/art/"
const CHAR_DIR := ART_DIR + "characters/"
const ENV_DIR := ART_DIR + "environment/"
const UI_DIR := ART_DIR + "ui/"

func _ready() -> void:
	generate_all()

func generate_all() -> void:
	var dir := DirAccess.open("user://")
	_generate_player_textures()
	_generate_shelf_textures()
	_generate_environment_textures()
	_generate_ui_textures()
	_generate_patrol_light_textures()
	print("美术占位资源生成完成")

func _make_dir_recursive(path: String) -> void:
	var parts := path.split("/")
	var current := ""
	for part in parts:
		if part == "res:":
			current = "res://"
			continue
		current += "/" + part
		DirAccess.make_dir_absolute(current)

func _create_rect_image(width: int, height: int, color: Color, border: Color = Color.BLACK, border_width: int = 2) -> Image:
	var img := Image.create(width, height, false, Image.FORMAT_RGBA8)
	img.fill(Color.TRANSPARENT)
	var draw_rect := Rect2(Vector2.ZERO, Vector2(width, height))
	for y in height:
		for x in width:
			var px_color: Color
			if x < border_width or x >= width - border_width or y < border_width or y >= height - border_width:
				px_color = border
			else:
				px_color = color
			img.set_pixel(x, y, px_color)
	return img

func _create_robot_image(width: int, height: int, variant: int = 0) -> Image:
	var img := Image.create(width, height, false, Image.FORMAT_RGBA8)
	img.fill(Color.TRANSPARENT)
	var body_color := Color(0.35, 0.65, 0.95)
	var body_dark := Color(0.18, 0.38, 0.6)
	var accent := Color(1.0, 0.85, 0.2)
	var eye := Color(0.2, 1.0, 0.5)
	var leg := Color(0.25, 0.25, 0.3)
	var cx := width / 2
	var top_offset := int(height * 0.1)
	var head_r := int(width * 0.22)
	for y in head_r * 2:
		for x in head_r * 2:
			var dx := x - head_r
			var dy := y - head_r
			if dx * dx + dy * dy <= head_r * head_r:
				img.set_pixel(cx - head_r + x, top_offset + y, body_color)
	var eye_y := top_offset + head_r
	var eye_x_l := cx - 5
	var eye_x_r := cx + 5
	for ey in 3:
		for ex in 3:
			img.set_pixel(eye_x_l + ex - 1, eye_y + ey - 1, eye)
			img.set_pixel(eye_x_r + ex - 1, eye_y + ey - 1, eye)
	var body_top := top_offset + head_r * 2 + 2
	var body_bottom := int(height * 0.72)
	var body_left := int(width * 0.22)
	var body_right := int(width * 0.78)
	for y in range(body_top, body_bottom):
		for x in range(body_left, body_right):
			var c: Color
			if y < body_top + 3 or y > body_bottom - 3:
				c = body_dark
			else:
				c = body_color
			img.set_pixel(x, y, c)
	var acc_w := body_right - body_left - 8
	for x in acc_w:
		img.set_pixel(body_left + 4 + x, body_top + 8, accent)
		img.set_pixel(body_left + 4 + x, body_top + 9, accent)
	if variant == 1:
		for y in range(body_top + 20, body_top + 26):
			for x in range(body_left + 8, body_right - 8):
				img.set_pixel(x, y, Color(0.2, 1.0, 0.5) * 0.5)
	elif variant == 2:
		for x in range(body_left + 10, body_right - 10):
			img.set_pixel(x, body_top + 18, Color(0.2, 1.0, 0.5))
	leg = Color(0.2, 0.2, 0.25)
	var leg_top := body_bottom + 1
	var leg_bottom := height - 2
	var leg_offsets := [int(width * 0.3), int(width * 0.45), int(width * 0.55), int(width * 0.7)]
	if variant == 1:
		leg_offsets[0] -= 2
		leg_offsets[3] += 2
	elif variant == 2:
		leg_offsets[0] += 2
		leg_offsets[3] -= 2
	for lo in leg_offsets:
		for y in range(leg_top, leg_bottom):
			for w in 4:
				img.set_pixel(lo + w - 2, y, leg)
	return img

func _create_crouch_robot_image(width: int, height: int, variant: int = 0) -> Image:
	var img := Image.create(width, height, false, Image.FORMAT_RGBA8)
	img.fill(Color.TRANSPARENT)
	var body_color := Color(0.35, 0.65, 0.95)
	var body_dark := Color(0.18, 0.38, 0.6)
	var accent := Color(1.0, 0.85, 0.2)
	var eye := Color(0.2, 1.0, 0.5)
	var leg := Color(0.2, 0.2, 0.25)
	var cx := width / 2
	var squish := 0.75
	var body_top := int(height * 0.25)
	var body_bottom := height - 4
	var body_left := int(width * 0.18)
	var body_right := int(width * 0.82)
	for y in range(body_top, body_bottom):
		for x in range(body_left, body_right):
			var c: Color
			if y < body_top + 3 or y > body_bottom - 4 or x < body_left + 2 or x > body_right - 3:
				c = body_dark
			else:
				c = body_color
			img.set_pixel(x, y, c)
	var eye_y := body_top + int((body_bottom - body_top) * 0.22)
	for ey in 3:
		for ex in 3:
			img.set_pixel(cx - 7 + ex - 1, eye_y + ey - 1, eye)
			img.set_pixel(cx + 7 + ex - 1, eye_y + ey - 1, eye)
	var acc_w := body_right - body_left - 10
	for x in acc_w:
		img.set_pixel(body_left + 5 + x, body_top + int((body_bottom - body_top) * 0.4), accent)
	leg_top := body_bottom - 3
	leg_offsets = [int(width * 0.28), int(width * 0.45), int(width * 0.55), int(width * 0.72)]
	for lo in leg_offsets:
		for y in range(leg_top, height - 1):
			for w in 5:
				img.set_pixel(lo + w - 2, y, leg)
	return img

func _create_scan_robot_image(width: int, height: int, variant: int = 0) -> Image:
	var img := _create_robot_image(width, height, 0)
	var scanner_color := Color(0.2, 1.0, 0.4)
	var scanner_beam := Color(0.2, 1.0, 0.4, 0.6)
	var start_x := int(width * 0.7)
	var base_y := int(height * 0.4)
	for y in range(base_y - 2, base_y + 3):
		for x in range(start_x, width - 2):
			img.set_pixel(x, y, scanner_color)
	var beam_len := width
	for step in beam_len:
		var y_off := int(sin(step * 0.3 + variant) * 3)
		for w in 2:
			if start_x + step < width:
				var c := scanner_beam * (1.0 - float(step) / beam_len)
				if img.get_pixel(start_x + step, base_y + y_off + w).a > 0.1:
					c = c.blend(img.get_pixel(start_x + step, base_y + y_off + w))
				img.set_pixel(start_x + step, base_y + y_off + w, c)
	return img

func _save_image(img: Image, path: String) -> void:
	img.save_png(path)

func _generate_player_textures() -> void:
	var sizes := [["idle", 0, false], ["walk", 1, false], ["walk", 2, false], ["walk", 3, false]]
	for frame_info in sizes:
		var img := _create_robot_image(48, 64, frame_info[1])
		var fname := "player_%s_%d.png" % [frame_info[0], frame_info[1]]
		_save_image(img, "res://assets/art/characters/" + fname)
	_image_cache["player_idle"] = sizes[0]
	for i in 2:
		var img := _create_crouch_robot_image(48, 48, i)
		_save_image(img, "res://assets/art/characters/player_crouch_walk_%d.png" % i)
	var img := _create_crouch_robot_image(48, 48, 0)
	_save_image(img, "res://assets/art/characters/player_crouch_idle.png")
	for i in 3:
		var img := _create_scan_robot_image(48, 64, i)
		_save_image(img, "res://assets/art/characters/player_scan_%d.png" % i)
