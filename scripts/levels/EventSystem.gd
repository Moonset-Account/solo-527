extends Node
## 事件处理系统 - 处理关卡中定义的各种事件
## 独立模块，可单独扩展新的事件类型

signal event_applied(event_data: Dictionary)

var active_events: Array = []
var triggered_events: Dictionary = {}

func load_events(event_definitions: Array) -> void:
	active_events.clear()
	triggered_events.clear()
	for evt in event_definitions:
		active_events.append(evt.duplicate(true))

func check_and_apply_events(current_turn: int) -> Array:
	var applied: Array = []
	for evt in active_events:
		var event_id: String = evt.get("id", "")
		if triggered_events.has(event_id):
			continue
		var trigger_turn: int = evt.get("trigger_turn", -1)
		var trigger_condition: String = evt.get("trigger_condition", "")
		
		var should_trigger: bool = false
		if trigger_turn > 0 and current_turn == trigger_turn:
			should_trigger = true
		elif trigger_condition != "":
			should_trigger = _evaluate_condition(trigger_condition, current_turn)
		
		if should_trigger:
			_apply_event(evt)
			triggered_events[event_id] = true
			applied.append(evt)
			EventBus.publish("event_triggered", [evt])
			AudioManager.play_sfx(AudioManager.SFXType.EVENT)
	return applied

func _evaluate_condition(condition: String, turn: int) -> bool:
	match condition:
		"half_level":
			return turn == int(ResourceManager.max_turns / 2)
		"low_resources":
			return ResourceManager.current_budget <= 1 and turn > 2
		_:
			return false

func _apply_event(evt: Dictionary) -> void:
	var effect: Dictionary = evt.get("effect", {})
	var effect_type: String = effect.get("type", "")
	var value: int = effect.get("value", 0)
	
	match effect_type:
		"global_damage":
			_apply_global_damage(value)
		"tagged_damage":
			_apply_tagged_damage(effect.get("tag", ""), value)
		"low_condition_damage":
			_apply_low_condition_damage(effect.get("threshold", 50), value)
		"gain_budget":
			ResourceManager.gain("budget", value)
			EventBus.publish("ui_toast", ["%s：获得 %d 预算" % [evt.get("name", "事件"), value], "buff", 2.0])
		"gain_tools":
			ResourceManager.gain("tools", value)
			EventBus.publish("ui_toast", ["%s：获得 %d 修复工具" % [evt.get("name", "事件"), value], "buff", 2.0])
		"gain_experts":
			ResourceManager.gain("experts", value)
			EventBus.publish("ui_toast", ["%s：获得 %d 专家" % [evt.get("name", "事件"), value], "buff", 2.0])
		_:
			push_warning("EventSystem: Unknown effect type '%s'" % effect_type)
	
	emit_signal("event_applied", evt)

func _apply_global_damage(amount: int) -> void:
	var exhibits: Dictionary = GameManager.get_all_exhibits()
	var count: int = 0
	for id in exhibits:
		var ex: Dictionary = exhibits[id]
		if ex.completed or ex.failed:
			continue
		ex.current_condition = max(0, ex.current_condition - amount)
		EventBus.publish("exhibit_damaged", [id, amount, ex.current_condition])
		count += 1
	EventBus.publish("ui_toast", ["事件：%d 件展品受到损坏" % count, "debuff", 2.5])
	AudioManager.play_warning()

func _apply_tagged_damage(tag: String, amount: int) -> void:
	if tag.is_empty():
		return
	var exhibits: Dictionary = GameManager.get_all_exhibits()
	var count: int = 0
	for id in exhibits:
		var ex: Dictionary = exhibits[id]
		if ex.completed or ex.failed:
			continue
		if tag in ex.get("tags", []):
			ex.current_condition = max(0, ex.current_condition - amount)
			EventBus.publish("exhibit_damaged", [id, amount, ex.current_condition])
			count += 1
	if count > 0:
		EventBus.publish("ui_toast", ["事件：%d 件%s类展品受损" % [count, tag], "debuff", 2.5])
		AudioManager.play_warning()

func _apply_low_condition_damage(threshold: int, amount: int) -> void:
	var exhibits: Dictionary = GameManager.get_all_exhibits()
	var count: int = 0
	for id in exhibits:
		var ex: Dictionary = exhibits[id]
		if ex.completed or ex.failed:
			continue
		if ex.current_condition < threshold:
			ex.current_condition = max(0, ex.current_condition - amount)
			EventBus.publish("exhibit_damaged", [id, amount, ex.current_condition])
			count += 1
	if count > 0:
		EventBus.publish("ui_toast", ["事件：%d 件脆弱展品额外受损" % count, "debuff", 2.5])
		AudioManager.play_warning()

func get_pending_events(current_turn: int) -> Array:
	var pending: Array = []
	for evt in active_events:
		var event_id: String = evt.get("id", "")
		if triggered_events.has(event_id):
			continue
		var trigger_turn: int = evt.get("trigger_turn", -1)
		if trigger_turn > 0 and trigger_turn >= current_turn:
			pending.append({
				"event": evt,
				"turns_remaining": trigger_turn - current_turn
			})
	return pending
