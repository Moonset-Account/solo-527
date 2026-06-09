extends Control
## TutorialPanel - 新手教程面板

@onready var page_container: VBoxContainer = $Overlay/Panel/VBox/PageContainer
@onready var btn_prev: Button = $Overlay/Panel/VBox/Buttons/PrevButton
@onready var btn_next: Button = $Overlay/Panel/VBox/Buttons/NextButton
@onready var btn_skip: Button = $Overlay/Panel/VBox/Buttons/SkipButton
@onready var btn_close: Button = $Overlay/Panel/VBox/Buttons/CloseButton
@onready var page_indicator: Label = $Overlay/Panel/VBox/PageIndicator

const PAGES := [
	{
		"title": "🎮 欢迎来到复古工厂!",
		"content": "你将经营一条自动化流水线工厂。布置机器和传送带，按时完成客户订单！\n\n目标很简单：花最少的钱，用最聪明的布局，完成更多订单。"
	},
	{
		"title": "📦 订单系统",
		"content": "右上角显示当前订单列表，每个订单需要特定的产品数量和时间限制。\n\n完成越快，奖励越多！失败的订单会扣除信用评级。"
	},
	{
		"title": "⚙️ 放置机器",
		"content": "在右侧选择建造面板，点击想要放置的机器，然后在网格中选择位置确认。\n\n按 [R] 键旋转机器方向，按 [ESC] 取消放置。"
	},
	{
		"title": "➡️ 传送带连接",
		"content": "传送带负责把机器的产物运送到下一台机器。要确保方向正确！\n\n原料从绿色入口进入，成品必须送到红色出口才能完成订单。"
	},
	{
		"title": "⬆️ 升级与质检",
		"content": "点击已放置的机器可查看详情和升级（效率+25%/级）。\n\n放置质检点可以让订单奖励+20%，但有概率拒绝次品。"
	},
	{
		"title": "⏱ 游戏技巧",
		"content": "[空格]/[ESC] 暂停  |  [+]/[-] 调整速度\n\n⚠ 注意瓶颈提示！空闲率高的机器说明前面断供或后面堵塞。\n\n祝你经营愉快！🏭"
	}
]

var current_page: int = 0

func _ready() -> void:
	_connect_buttons()
	_show_page(0)

func _connect_buttons() -> void:
	btn_prev.pressed.connect(_on_prev)
	btn_next.pressed.connect(_on_next)
	btn_skip.pressed.connect(_on_skip)
	btn_close.pressed.connect(_on_close)
	for b in [btn_prev, btn_next, btn_skip, btn_close]:
		b.mouse_entered.connect(func(): AudioManager.play_sfx("button_hover"))

func _show_page(idx: int) -> void:
	current_page = clamp(idx, 0, PAGES.size() - 1)
	for c in page_container.get_children():
		c.queue_free()
	var page: Dictionary = PAGES[current_page]
	var title_lbl := Label.new()
	title_lbl.text = page.get("title", "")
	title_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title_lbl.modulate = Color(1.0, 0.88, 0.4)
	title_lbl.add_theme_font_size_override("font_size", 24)
	title_lbl.custom_minimum_size = Vector2(0, 50)
	page_container.add_child(title_lbl)
	var content_lbl := Label.new()
	content_lbl.text = page.get("content", "")
	content_lbl.modulate = Color(0.9, 0.88, 1.0)
	content_lbl.add_theme_font_size_override("font_size", 16)
	content_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content_lbl.custom_minimum_size = Vector2(0, 200)
	content_lbl.size_flags_vertical = Control.SIZE_EXPAND_FILL
	page_container.add_child(content_lbl)
	page_indicator.text = "第 %d / %d 页" % [current_page + 1, PAGES.size()]
	btn_prev.disabled = current_page == 0
	btn_next.visible = current_page < PAGES.size() - 1
	btn_close.visible = current_page >= PAGES.size() - 1

func _on_prev() -> void:
	AudioManager.play_sfx("click")
	_show_page(current_page - 1)

func _on_next() -> void:
	AudioManager.play_sfx("click")
	_show_page(current_page + 1)

func _on_skip() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("skip_tutorial", "Tutorial")
	queue_free()

func _on_close() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("close_tutorial", "Tutorial")
	PlaytestRecorder.record_key_decision("complete_tutorial", {})
	queue_free()
