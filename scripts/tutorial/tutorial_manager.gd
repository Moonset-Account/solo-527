extends Control

signal tutorial_completed
signal tutorial_step_changed(step_index: int)

enum TutorialPhase { WELCOME, CARD_TYPES, PLAYING_CARDS, BUDGET_SYSTEM, EXHIBIT_REPAIR, EXPERT_CARDS, END_TURN, EVENTS, COMPLETE }

var current_step: int = 0
var total_steps: int = 9

@onready var tutorial_text: RichTextLabel = $VBoxContainer/TutorialText
@onready var next_button: Button = $VBoxContainer/HBoxContainer/NextButton
@onready var skip_button: Button = $VBoxContainer/HBoxContainer/SkipButton
@onready var step_label: Label = $VBoxContainer/StepLabel
@onready var demo_area: Control = $VBoxContainer/DemoArea

var _step_texts: Dictionary = {}

func _ready() -> void:
	_init_step_texts()
	next_button.pressed.connect(_on_next)
	skip_button.pressed.connect(_on_skip)
	_show_step(0)

func _init_step_texts() -> void:
	_step_texts = {
		0: "[b]欢迎来到博物馆卡牌修复战！[/b]\n\n你是一位博物馆修复专家，需要用卡牌修复损坏的展品。\n每种卡牌都有独特的效果，合理组合才能完成修复任务。",
		1: "[b]卡牌类型[/b]\n\n[color=cyan]修复工具卡[/color]：对展品施加修复效果，恢复展品HP。\n[color=yellow]预算卡[/color]：获得额外预算点数，让你能打出更多卡牌。\n[color=green]专家卡[/color]：提供特殊效果，如揭示隐藏损伤、稳定展品等。",
		2: "[b]出牌操作[/b]\n\n1. 点击手牌中的卡牌选中它\n2. 点击目标展品打出卡牌\n\n每张卡牌都有费用（左上角），出牌需要消耗等量的预算。",
		3: "[b]预算系统[/b]\n\n每回合你会获得一定数量的预算点数。\n- 修复工具卡通常需要1-3点预算\n- 预算卡本身免费，还能增加预算\n- 合理规划预算是关键！",
		4: "[b]展品修复[/b]\n\n展品有不同的HP值，HP归零则被毁坏。\n- [color=green]已修复[/color]：HP已满\n- [color=yellow]损坏[/color]：需要修复\n- [color=red]危急[/color]：急需关注！\n- [color=dark_red]毁坏[/color]：无法修复（游戏失败）\n\n修复所有展品即可过关！",
		5: "[b]专家卡策略[/b]\n\n专家卡虽然不直接修复，但能改变战局：\n- 历史学家：查看展品隐藏信息\n- 修复师：增强下一次修复效果\n- 化学家：稳定所有展品\n- 策展人：跳过下一个负面事件",
		6: "[b]结束回合[/b]\n\n当你无法或不想出牌时，点击「结束回合」：\n1. 结算回合事件\n2. 展品可能自然退化\n3. 抽一张新牌\n4. 预算恢复满额",
		7: "[b]随机事件[/b]\n\n从第二章开始，每回合可能触发随机事件：\n- 地震：所有展品受伤\n- 水灾：纸类和丝织品重伤\n- 盗贼：随机展品受伤\n- 隐藏损伤：未揭示的损伤显现\n\n使用策展人或气候控制卡可以应对！",
		8: "[b]准备就绪！[/b]\n\n你已经了解了所有基础操作！\n\n策略提示：\n- 不要忽视专家卡的价值\n- 优先修复危急展品\n- 保留预算卡应对紧急情况\n- 揭示隐藏损伤后再集中修复\n\n祝你好运，修复大师！",
	}

func _show_step(step: int) -> void:
	current_step = step
	step_label.text = "步骤 %d/%d" % [step + 1, total_steps]
	if _step_texts.has(step):
		tutorial_text.text = _step_texts[step]
	if step >= total_steps - 1:
		next_button.text = "开始游戏"
	else:
		next_button.text = "下一步"
	tutorial_step_changed.emit(step)
	_update_demo_area(step)

func _update_demo_area(step: int) -> void:
	for child in demo_area.get_children():
		child.queue_free()
	match step:
		1:
			_show_card_type_demo()
		2:
			_show_play_demo()
		3:
			_show_budget_demo()
		4:
			_show_exhibit_demo()
		5:
			_show_expert_demo()

func _show_card_type_demo() -> void:
	var hbox = HBoxContainer.new()
	for card_type in ["修复工具", "预算", "专家"]:
		var panel = PanelContainer.new()
		panel.custom_minimum_size = Vector2(120, 80)
		var label = Label.new()
		label.text = card_type
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		panel.add_child(label)
		hbox.add_child(panel)
	demo_area.add_child(hbox)

func _show_play_demo() -> void:
	var label = Label.new()
	label.text = "选中卡牌 → 点击展品 → 卡牌生效"
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	demo_area.add_child(label)

func _show_budget_demo() -> void:
	var label = Label.new()
	label.text = "预算: ●●● (3/3) → 出牌消耗 → 回合结束恢复"
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	demo_area.add_child(label)

func _show_exhibit_demo() -> void:
	var hbox = HBoxContainer.new()
	for state_text in ["已修复", "损坏", "危急", "毁坏"]:
		var panel = PanelContainer.new()
		panel.custom_minimum_size = Vector2(80, 50)
		var label = Label.new()
		label.text = state_text
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		match state_text:
			"已修复":
				label.add_theme_color_override("font_color", Color(0.3, 0.8, 0.3))
			"损坏":
				label.add_theme_color_override("font_color", Color(0.9, 0.7, 0.2))
			"危急":
				label.add_theme_color_override("font_color", Color(0.9, 0.3, 0.2))
			"毁坏":
				label.add_theme_color_override("font_color", Color(0.5, 0.1, 0.1))
		panel.add_child(label)
		hbox.add_child(panel)
	demo_area.add_child(hbox)

func _show_expert_demo() -> void:
	var label = Label.new()
	label.text = "历史学家 | 修复师+2 | 化学家(稳定) | 策展人(跳事件)"
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	demo_area.add_child(label)

func _on_next() -> void:
	if current_step >= total_steps - 1:
		tutorial_completed.emit()
		GameManager.set_tutorial_skipped(false)
		SaveManager.save_game()
		SceneManager.go_to_battle(0, 0)
		return
	_show_step(current_step + 1)

func _on_skip() -> void:
	GameManager.set_tutorial_skipped(true)
	SaveManager.save_game()
	SceneManager.go_to_battle(0, 0)
