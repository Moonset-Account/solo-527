extends Node
## 全局事件总线 - 用于模块间解耦通信
## 所有跨系统的事件都通过这里发布和订阅，避免模块直接依赖

signal turn_started(turn_number: int)
signal turn_ended(turn_number: int)
signal resources_changed(budget: int, tools: int, experts: int)

signal card_drawn(card_data: Dictionary, hand_index: int)
signal card_played(card_data: Dictionary, target_exhibit_id: String)
signal card_play_failed(card_data: Dictionary, reason: String)
signal card_discarded(card_data: Dictionary, reason: String)
signal deck_empty()
signal hand_changed(hand_cards: Array)

signal exhibit_repaired(exhibit_id: String, amount: int, new_progress: int)
signal exhibit_damaged(exhibit_id: String, amount: int, new_condition: int)
signal exhibit_completed(exhibit_id: String)
signal exhibit_failed(exhibit_id: String, reason: String)
signal exhibit_selected(exhibit_id: String)
signal exhibit_target_mode(enabled: bool, valid_targets: Array)

signal level_started(level_data: Dictionary)
signal level_completed(level_data: Dictionary, rewards: Array)
signal level_failed(level_data: Dictionary, reasons: Array)
signal chapter_completed(chapter_id: String, rewards: Array)

signal event_triggered(event_data: Dictionary)
signal event_resolved(event_data: Dictionary, choice_index: int)

signal reward_card_selected(card_data: Dictionary)
signal reward_claimed(reward_type: String, value)

signal ui_toast(message: String, toast_type: String, duration: float)
signal ui_floating_text(position: Vector2, text: String, color: Color)
signal ui_animation_completed(animation_id: String)

signal game_paused
signal game_resumed
signal scene_changing(scene_name: String)
signal scene_changed(scene_name: String)

signal save_created(slot_id: int, save_data: Dictionary)
signal save_loaded(slot_id: int, save_data: Dictionary)

var _subscribers: Dictionary = {}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func publish(event_name: String, args: Array = []) -> void:
	if not signal_exists(event_name):
		push_warning("EventBus: Unknown event '%s'" % event_name)
		return
	emit_signal(event_name, *args)

func subscribe(event_name: String, listener: Callable) -> void:
	if not signal_exists(event_name):
		push_warning("EventBus: Cannot subscribe to unknown event '%s'" % event_name)
		return
	connect(event_name, listener)
