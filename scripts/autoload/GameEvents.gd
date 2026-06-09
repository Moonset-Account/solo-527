extends Node
## 全局事件总线 - 解耦各系统间通信
## 所有跨系统通信都通过这里的信号发射，避免硬依赖

signal card_played(card_data: Dictionary, source: Node)
signal card_discarded(card_data: Dictionary)
signal card_drawn(card_data: Dictionary)
signal budget_changed(delta: int, current: int)
signal exhibit_progress_changed(exhibit_id: String, delta: int, current: int, max: int)
signal exhibit_damaged(exhibit_id: String, damage: int)
signal exhibit_restored(exhibit_id: String)
signal turn_started(turn_number: int)
signal turn_ended(turn_number: int)
signal battle_started(level_id: String)
signal battle_ended(victory: bool, level_id: String)
signal event_triggered(event_id: String, event_data: Dictionary)
signal reward_granted(reward_type: String, reward_data: Dictionary)
signal card_unlocked(card_id: String)
signal input_method_changed(method: String)
signal settings_changed(category: String, key: String, value)
signal save_created(slot_index: int)
signal save_loaded(slot_index: int)
signal sfx_requested(sfx_name: String, volume_db: float)
signal vfx_requested(vfx_type: String, global_position: Vector2, params: Dictionary)
signal level_completed(level_id: String, stars: int, stats: Dictionary)
signal chapter_unlocked(chapter_id: String)
signal popup_shown(popup_id: String)
signal popup_closed(popup_id: String)

func emit_card_played(card_data: Dictionary, source: Node) -> void:
	card_played.emit(card_data, source)
	sfx_requested.emit("card_play", -3.0)

func emit_budget_changed(delta: int, current: int) -> void:
	budget_changed.emit(delta, current)
	if delta > 0:
		sfx_requested.emit("budget_gain", -2.0)
	elif delta < 0:
		sfx_requested.emit("budget_spend", -4.0)

func emit_exhibit_progress(exhibit_id: String, delta: int, current: int, max: int) -> void:
	exhibit_progress_changed.emit(exhibit_id, delta, current, max)
	if current >= max:
		exhibit_restored.emit(exhibit_id)
		sfx_requested.emit("exhibit_complete", -1.0)

func emit_turn_started(n: int) -> void:
	turn_started.emit(n)
	sfx_requested.emit("turn_start", -5.0)

func emit_turn_ended(n: int) -> void:
	turn_ended.emit(n)
	sfx_requested.emit("turn_end", -5.0)

func emit_battle_ended(victory: bool, level_id: String) -> void:
	battle_ended.emit(victory, level_id)
	sfx_requested.emit("battle_" + ("win" if victory else "lose"), 0.0)
