extends Control
class_name OutlineLabelContainer

func _draw():
	for c in get_children():
		if c is Label:
			var lbl: Label = c
			var orig_pos: Vector2 = lbl.position
			var orig_col: Color = lbl.modulate
			var text: String = lbl.text
			var font: Font = lbl.get_theme_font("font")
			var font_size: int = lbl.get_theme_font_size("font_size")
			var text_size: Vector2 = font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size)
			var draw_pos: Vector2 = lbl.position + Vector2(0, text_size.y)
			for ox in [-2, 0, 2]:
				for oy in [-2, 0, 2]:
					if ox == 0 and oy == 0:
						continue
					draw_string(font, draw_pos + Vector2(ox, oy), text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, Color.BLACK)
			draw_string(font, draw_pos, text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, orig_col)
			lbl.modulate = Color(1, 1, 1, 0)
			return
