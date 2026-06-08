extends CanvasLayer
## 教程提示系统 - 游戏内逐步提示

@onready var tutorial_panel: PanelContainer = $TutorialPanel
@onready var step_title: Label = $TutorialPanel/VBox/StepTitle
@onready var step_content: RichTextLabel = $TutorialPanel/VBox/StepContent
@onready var step_indicator: Label = $TutorialPanel/VBox/StepIndicator
@onready var next_btn: Button = $TutorialPanel/VBox/ButtonsRow/NextButton
@onready var skip_btn: Button = $TutorialPanel/VBox/ButtonsRow/SkipButton
@onready var step_highlighter: ColorRect = $StepHighlighter
@onready var step_panel: VBoxContainer = $TutorialPanel/VBox

var tutorial_steps: Array = [
	{
		"title": "欢迎，维护机器人！",
		"content": "你是一个仓库维护机器人。你的任务是避开巡逻灯的视野，扫描货架并修复错误的库存标签。\n\n[b]目标：[/b] 在不被发现的情况下修复所有货架！",
		"next_hint": "点击下一步继续"
	},
	{
		"title": "基础移动",
		"content": "[b]移动：[/b] W/A/S/D 键 或 方向键\n[b]奔跑：[/b] 按住 Shift 加速（会产生更多噪音）\n[b]蹲伏：[/b] C 键 切换蹲伏状态（更安静，但移动变慢）\n\n[b]提示：[/b] 蹲伏时噪音极小，巡逻灯很难听到你！",
		"next_hint": "移动后点击下一步"
	},
	{
		"title": "扫描与修复",
		"content": "面对货架时会自动出现锁定标记。\n\n[b]扫描/修复：[/b] 按 E 键启动扫描\n扫描需要消耗能量，共3个阶段：\n 1. 扫描中（收集数据）\n 2. 分析中（定位错误）\n 3. 修复中（重写标签）\n\n[b]提示：[/b] 扫描中移动会变慢，确保安全后再操作！",
		"next_hint": "扫描货架后点击下一步"
	},
	{
		"title": "警惕巡逻灯",
		"content": "[b]视野锥：[/b] 黄色半透明扇形是巡逻灯的视野\n[b]警戒等级：[/b] 右上角3个红灯表示警戒级别\n- 0=安全，1=听到动静，2=正在搜索，3=已发现！\n\n[b]噪音系统：[/b] 移动产生的噪音圈会吸引巡逻灯\n\n[b]被抓住怎么办？[/b] 游戏会自动重置到你上一个存档点，不会让你重玩整关！",
		"next_hint": "避开巡逻灯后点击下一步"
	},
	{
		"title": "存档点与能量",
		"content": "[b]存档点：[/b] 走到发光的方块位置会激活当前段存档\n绿色菱形亮起=存档已记录\n\n[b]能量系统：[/b] 左上角进度条显示能量\n- 扫描消耗能量\n- 站立/蹲伏自动恢复\n- 能量过低会发出警告\n\n现在开始你的任务吧，加油！",
		"next_hint": "激活存档点后完成教程"
	}
]

var current_step: int = 0
var _step_completed_flags: Dictionary = {
	0: false,
	1: false,
	2: false,
	3: false,
	4: false
}

func _ready() -> void:
	_connect_events()
	current_step = 0
	_show_step(0)

func _connect_events() -> void:
	EventBus.tutorial_step_changed.connect(_on_tutorial_step_changed)
	if next_btn:
		next_btn.pressed.connect(_on_next_pressed)
		next_btn.mouse_entered.connect(_on_btn_mouse_entered)
	if skip_btn:
		skip_btn.pressed.connect(_on_skip_pressed)
		skip_btn.mouse_entered.connect(_on_btn_mouse_entered)

func _show_step(step_idx: int) -> void:
	current_step = step_idx
	if step_idx >= tutorial_steps.size():
		_complete_tutorial()
		return
	var step_data: Dictionary = tutorial_steps[step_idx]
	if step_title:
		step_title.text = step_data["title"]
		_animate_label_in(step_title)
	if step_content:
		step_content.text = step_data["content"]
	if step_indicator:
		step_indicator.text = "教程进度 %d / %d" % [step_idx + 1, tutorial_steps.size()]
	if next_btn:
		if step_idx == tutorial_steps.size() - 1:
			next_btn.text = step_data["next_hint"]
		else:
			next_btn.text = "下一步 ▶"
	if tutorial_panel:
		tutorial_panel.visible = true
		tutorial_panel.modulate.a = 0.0
		tutorial_panel.scale = Vector2(0.9, 0.9)
		var tween := create_tween()
		tween.set_ease(Tween.EASE_OUT)
		tween.tween_property(tutorial_panel, "modulate:a", 1.0, 0.25)
		tween.parallel().tween_property(tutorial_panel, "scale", Vector2(1.0, 1.0), 0.25)

func _animate_label_in(label: Label) -> void:
	if not label:
		return
	label.modulate.a = 0.0
	label.position.y = -10
	var tween := create_tween()
	tween.tween_property(label, "modulate:a", 1.0, 0.2)
	tween.parallel().tween_property(label, "position:y", 0.0, 0.2)

func _on_next_pressed() -> void:
	EventBus.emit_sfx_play("menu_confirm")
	var next_idx: int = current_step + 1
	if next_idx >= tutorial_steps.size():
		_complete_tutorial()
		return
	GameManager.tutorial_step = next_idx
	var tween := create_tween()
	if tutorial_panel:
		tween.tween_property(tutorial_panel, "modulate:a", 0.0, 0.15)
		tween.tween_callback(Callable(self, "_do_next_step"))

func _do_next_step() -> void:
	if current_step >= tutorial_steps.size():
		_complete_tutorial()
	else:
		EventBus.emit_tutorial_step_changed(current_step)
		_show_step(current_step)

func _on_skip_pressed() -> void:
	EventBus.emit_sfx_play("menu_cancel")
	_complete_tutorial()

func _complete_tutorial() -> void:
	if tutorial_panel:
		var tween := create_tween()
		tween.tween_property(tutorial_panel, "modulate:a", 0.0, 0.2)
		tween.tween_callback(tutorial_panel.set_visible.bind(false))
	GameManager.complete_tutorial()

func _on_tutorial_step_changed(step_idx: int) -> void:
	current_step = step_idx

func mark_step_complete(step_idx: int) -> void:
	_step_completed_flags[step_idx] = true
	if next_btn:
		next_btn.disabled = false

func set_step_waiting(step_idx: int, waiting: bool) -> void:
	if step_idx != current_step:
		return
	if next_btn:
		next_btn.disabled = waiting
		if waiting:
			next_btn.text = "请先完成操作..."
		else:
			var next_text := "下一步 ▶"
			if step_idx == tutorial_steps.size() - 1:
				next_text = "完成教程 ✓"
			next_btn.text = next_text

func _on_btn_mouse_entered() -> void:
	EventBus.emit_sfx_play("menu_move")
