extends Control

class_name TutorialPanel

func _ready():
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_build_ui()

func _build_ui():
	var dim = ColorRect.new()
	dim.color = Color(0, 0, 0, 0.6)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(dim)
	var panel = Panel.new()
	panel.name = "PanelContainer"
	panel.position = Vector2(240, 60)
	panel.size = Vector2(800, 600)
	panel.modulate = Color(0.07, 0.1, 0.16, 0.98)
	add_child(panel)
	var vbox = VBoxContainer.new()
	vbox.position = Vector2(260, 80)
	vbox.custom_minimum_size = Vector2(760, 560)
	vbox.add_theme_constant_override("separation", 8)
	add_child(vbox)
	var title = Label.new()
	title.name = "TitleLabel"
	title.text = "📖 游戏教程"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 28)
	title.modulate = Color(1.0, 0.85, 0.4)
	vbox.add_child(title)
	var scroll = ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(760, 480)
	vbox.add_child(scroll)
	var content = RichTextLabel.new()
	content.name = "RichTextLabel"
	content.bbcode_enabled = true
	content.scroll_active = true
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content.size_flags_vertical = Control.SIZE_EXPAND_FILL
	content.add_theme_font_size_override("normal_font_size", 14)
	content.text = """
[center][b][size=24]仓库潜行机器人 - 操作指南[/size][/b][/center]

[size=16][b]🎮 基础操作[/b][/size]
  [b]WASD / 方向键[/b] - 移动机器人
  [b]空格键 (长按)[/b] - 扫描附近货架（消耗能量）
  [b]E键[/b] - 修复错误标签（需先扫描发现错误）
  [b]Shift键[/b] - 冲刺加速（消耗更多能量，产生高噪音）
  [b]Ctrl键[/b] - 蹲伏减速（恢复能量，噪音极低）
  [b]ESC键[/b] - 暂停游戏
  [b]F1键[/b] - 显示/隐藏调试日志

[size=16][b]🔋 能量系统[/b][/size]
  - 能量是你最重要的资源，[color=yellow]扫描和冲刺会消耗能量[/color]
  - 蹲伏不动时可以[color=green]缓慢恢复能量[/color]
  - 能量为0时无法扫描和冲刺

[size=16][b]📡 噪音系统[/b][/size]
  - 机器人移动会产生噪音，[color=red]噪音太大可能被巡逻灯听到[/color]
  - 正常行走噪音中等，冲刺噪音很高，蹲伏几乎无噪音
  - 合理利用蹲伏穿过危险区域

[size=16][b]👁 巡逻灯[/b][/size]
  - 黄色视野锥 = 正常巡逻状态
  - 橙色视野锥 = 正在调查可疑区域
  - 红色视野锥 = 已发现目标！即将触发警报
  - [color=red]被发现后会重置到最近的检查点[/color]

[size=16][b]📦 货架交互[/b][/size]
  - 白色 = 未扫描
  - 蓝色 = 已扫描，标签正常
  - [color=red]红色[/color] = 已扫描，[color=red]发现错误标签[/color]
  - [color=green]绿色[/color] = 已修复
  - 长按[空格]扫描，按[E]修复错误

[size=16][b]🏁 通关条件[/b][/size]
  - 完成关卡要求的[color=yellow]扫描数量[/color]
  - 完成关卡要求的[color=yellow]修复数量[/color]
  - 到达出口区域（右上角）

[size=16][b]💡 小技巧[/b][/size]
  1. 注意利用检查点节省时间，被发现只回退到最近检查点
  2. 先规划巡逻灯路线再行动
  3. 冲刺穿过短距离危险区
  4. 蹲伏等待安全时机
  5. 优先修复错误标签多的区域

祝你好运，仓库维护大师！
"""
	scroll.add_child(content)
	var close_btn = Button.new()
	close_btn.name = "CloseButton"
	close_btn.text = "✅ 我明白了"
	close_btn.custom_minimum_size = Vector2(760, 40)
	close_btn.add_theme_font_size_override("font_size", 15)
	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0.3, 0.7, 0.45)
	sb.corner_radius_top_left = 5
	sb.corner_radius_top_right = 5
	sb.corner_radius_bottom_left = 5
	sb.corner_radius_bottom_right = 5
	close_btn.add_theme_stylebox_override("normal", sb)
	vbox.add_child(close_btn)
	close_btn.pressed.connect(func():
		AudioManager.play_sfx("ui_click")
		queue_free())
