extends Control

var _game_controller: GameController
var _main_menu: MainMenu
var _resource_panel: ResourcePanel
var _allocation_panel: AllocationPanel
var _settlement_panel: NightSettlementPanel
var _repair_select_panel: RepairSelectPanel
var _game_over_panel: GameOverPanel
var _tutorial_overlay: TutorialOverlay
var _replay_panel: ReplayPanel
var _stats_panel: StatsPanel
var _night_label: Label

func _ready() -> void:
	_game_controller = GameController.new()
	_game_controller.name = "GameController"
	add_child(_game_controller)

	_add_system_nodes()
	_game_controller.initialize()
	_build_ui()
	_connect_signals()
	_show_menu()

func _add_system_nodes() -> void:
	var rm := ResourceManager.new()
	rm.name = "ResourceManager"
	_game_controller.add_child(rm)

	var es := EventScheduler.new()
	es.name = "EventScheduler"
	_game_controller.add_child(es)

	var ew := EquipmentWearSystem.new()
	ew.name = "EquipmentWearSystem"
	_game_controller.add_child(ew)

	var rq := RepairQueue.new()
	rq.name = "RepairQueue"
	_game_controller.add_child(rq)

	var nr := NightResolver.new()
	nr.name = "NightResolver"
	_game_controller.add_child(nr)

	var sm := SaveManager.new()
	sm.name = "SaveManager"
	_game_controller.add_child(sm)

	var am := AudioManager.new()
	am.name = "AudioManager"
	_game_controller.add_child(am)

	var stm := StatsManager.new()
	stm.name = "StatsManager"
	_game_controller.add_child(stm)

	var tm := TutorialManager.new()
	tm.name = "TutorialManager"
	_game_controller.add_child(tm)

	_game_controller.resource_manager = rm
	_game_controller.event_scheduler = es
	_game_controller.equipment_system = ew
	_game_controller.repair_queue = rq
	_game_controller.night_resolver = nr
	_game_controller.save_manager = sm
	_game_controller.audio_manager = am
	_game_controller.stats_manager = stm
	_game_controller.tutorial_manager = tm

func _build_ui() -> void:
	_night_label = Label.new()
	_night_label.name = "NightLabel"
	_night_label.add_theme_font_size_override("font_size", 20)
	_night_label.position = Vector2(10, 10)
	_night_label.visible = false
	add_child(_night_label)

	_resource_panel = ResourcePanel.new()
	_resource_panel.name = "ResourcePanel"
	_resource_panel.setup(_game_controller.resource_manager)
	add_child(_resource_panel)

	_allocation_panel = AllocationPanel.new()
	_allocation_panel.name = "AllocationPanel"
	_allocation_panel.setup(_game_controller.resource_manager, _game_controller.equipment_system)
	add_child(_allocation_panel)

	_settlement_panel = NightSettlementPanel.new()
	_settlement_panel.name = "SettlementPanel"
	_settlement_panel.setup()
	add_child(_settlement_panel)

	_repair_select_panel = RepairSelectPanel.new()
	_repair_select_panel.name = "RepairSelectPanel"
	_repair_select_panel.setup(_game_controller.equipment_system, _game_controller.repair_queue, _game_controller.resource_manager)
	add_child(_repair_select_panel)

	_game_over_panel = GameOverPanel.new()
	_game_over_panel.name = "GameOverPanel"
	add_child(_game_over_panel)

	_tutorial_overlay = TutorialOverlay.new()
	_tutorial_overlay.name = "TutorialOverlay"
	add_child(_tutorial_overlay)

	_replay_panel = ReplayPanel.new()
	_replay_panel.name = "ReplayPanel"
	add_child(_replay_panel)

	_stats_panel = StatsPanel.new()
	_stats_panel.name = "StatsPanel"
	_stats_panel.setup(_game_controller.stats_manager)
	add_child(_stats_panel)

	_main_menu = MainMenu.new()
	_main_menu.name = "MainMenu"
	add_child(_main_menu)

func _connect_signals() -> void:
	_main_menu.new_game_pressed.connect(_on_new_game)
	_main_menu.load_game_pressed.connect(_on_load_game)
	_main_menu.replay_pressed.connect(_on_replay)
	_main_menu.quit_pressed.connect(_on_quit)

	_allocation_panel.allocation_confirmed.connect(_on_allocation_confirmed)
	_settlement_panel.continue_pressed.connect(_on_settlement_continue)
	_settlement_panel.repair_select_pressed.connect(_on_repair_select)
	_repair_select_panel.repair_confirmed.connect(_on_repair_confirmed)
	_repair_select_panel.repair_cancelled.connect(_on_repair_cancelled)
	_game_over_panel.retry_pressed.connect(_on_retry)
	_game_over_panel.menu_pressed.connect(_on_back_to_menu)
	_tutorial_overlay.dismissed.connect(_on_tutorial_dismissed)
	_replay_panel.closed.connect(_on_replay_closed)
	_stats_panel.closed.connect(_on_stats_closed)

	_game_controller.state_changed.connect(_on_state_changed)
	_game_controller.night_started.connect(_on_night_started)
	_game_controller.night_ended.connect(_on_night_ended)
	_game_controller.game_over.connect(_on_game_over)
	_game_controller.tutorial_manager.tutorial_step_shown.connect(_on_tutorial_step)

func _show_menu() -> void:
	_main_menu.visible = true
	_resource_panel.visible = false
	_allocation_panel.visible = false
	_settlement_panel.visible = false
	_repair_select_panel.visible = false
	_game_over_panel.visible = false
	_tutorial_overlay.visible = false
	_replay_panel.visible = false
	_stats_panel.visible = false
	_night_label.visible = false

func _on_new_game() -> void:
	_main_menu.visible = false
	_game_controller.start_new_game()

func _on_load_game() -> void:
	if _game_controller.load_game():
		_main_menu.visible = false
		_resource_panel.visible = true
		_night_label.visible = true
		_night_label.text = "第 %d 夜 - 准备阶段" % _game_controller.get_current_night()
	else:
		push_warning("No save game found")

func _on_replay() -> void:
	_replay_panel.load_history(_game_controller.get_night_history())
	_replay_panel.show_panel()

func _on_quit() -> void:
	get_tree().quit()

func _on_state_changed(old_state: GameController.GameState, new_state: GameController.GameState) -> void:
	match new_state:
		GameController.GameState.MENU:
			_show_menu()
		GameController.GameState.NIGHT_PREP:
			_allocation_panel.show_panel()
			_night_label.text = "第 %d 夜 - 准备阶段" % _game_controller.get_current_night()
		GameController.GameState.NIGHT_ACTIVE:
			_allocation_panel.hide_panel()
			_night_label.text = "第 %d 夜 - 进行中" % _game_controller.get_current_night()
		GameController.GameState.NIGHT_RESULT:
			_settlement_panel.show_result(_game_controller.get_last_result())
		GameController.GameState.REPAIR_SELECT:
			_repair_select_panel.show_panel()
		GameController.GameState.GAME_OVER:
			var result := _game_controller.get_last_result()
			if result:
				_game_over_panel.show_game_over(result.failure_type, result.night_number)
		GameController.GameState.REPLAY_VIEW:
			_replay_panel.show_panel()

func _on_night_started(night: int) -> void:
	_night_label.visible = true
	_resource_panel.visible = true

func _on_night_ended(result: NightResult) -> void:
	pass

func _on_game_over(failure_type: NightResult.FailureType) -> void:
	var result := _game_controller.get_last_result()
	if result:
		_game_over_panel.show_game_over(failure_type, result.night_number)

func _on_allocation_confirmed(choices: Dictionary) -> void:
	_game_controller.end_night(choices)

func _on_settlement_continue() -> void:
	_settlement_panel.hide_panel()
	var result := _game_controller.get_last_result()
	if result and result.survived:
		_game_controller.continue_to_next_night()
	else:
		_show_menu()

func _on_repair_select() -> void:
	_settlement_panel.hide_panel()
	_game_controller.open_repair_select()

func _on_repair_confirmed() -> void:
	_repair_select_panel.hide_panel()
	_game_controller.close_repair_select()
	_game_controller.continue_to_next_night()

func _on_repair_cancelled() -> void:
	_repair_select_panel.hide_panel()
	_game_controller.close_repair_select()
	_game_controller.continue_to_next_night()

func _on_retry() -> void:
	_game_over_panel.visible = false
	_game_controller.start_new_game()

func _on_back_to_menu() -> void:
	_game_over_panel.visible = false
	_show_menu()

func _on_tutorial_step(step_id: String, text: String) -> void:
	_tutorial_overlay.show_tutorial(step_id, text)

func _on_tutorial_dismissed() -> void:
	_game_controller.tutorial_manager.dismiss_current()

func _on_replay_closed() -> void:
	_replay_panel.hide_panel()

func _on_stats_closed() -> void:
	_stats_panel.hide_panel()
