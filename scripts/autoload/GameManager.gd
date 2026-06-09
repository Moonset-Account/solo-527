extends Node

enum GameState {
	TITLE, LEVEL_SELECT, PLAYING, PAUSED, DIALOG, RESULT, SETTINGS
}

var current_state: int = GameState.TITLE
var current_level_id: String = ""
var turn: int = 1
var max_turns: int = 10
var satisfaction: float = 0.0
var target_satisfaction: float = 30.0
var min_satisfaction: float = -5.0
var required_tasks: int = 2
var completed_tasks: int = 0
var selected_character_idx: int = -1
var characters: Array = []
var tasks: Array = []
var turn_phase: String = "player"
var level_data: Dictionary = {}
var is_victory: bool = false
var pending_events: Array = []
var tutorial_shown: Dictionary = {}

signal state_changed(new_state: int, old_state: int)
signal turn_changed(new_turn: int)
signal satisfaction_changed(new_value: float, delta: float)
signal task_completed(task_data: Dictionary)
signal character_selected(idx: int)
signal game_over(victory: bool)
signal dialog_requested(dialog_data: Dictionary)
signal toast_message(message: String, color: Color)
signal float_text(position: Vector2, text: String, color: Color)

func _ready():
	randomize()

func change_state(new_state: int):
	var old: int = current_state
	current_state = new_state
	emit_signal("state_changed", new_state, old)

func start_level(level_id: String):
	current_level_id = level_id
	level_data = ConfigLoader.load_level_data(level_id)
	if level_data.is_empty():
		push_error("Level not found: " + level_id)
		return
	var win: Dictionary = level_data.get("win_condition", {})
	var lose: Dictionary = level_data.get("lose_condition", {})
	max_turns = win.get("turn_limit", 10)
	target_satisfaction = win.get("satisfaction_needed", 30)
	min_satisfaction = lose.get("satisfaction_min", -5)
	required_tasks = win.get("task_completion_required", 2)
	turn = 1
	satisfaction = ConfigLoader.get_balance("balance.default_satisfaction_start", 0)
	completed_tasks = 0
	characters.clear()
	tasks.clear()
	tutorial_shown.clear()
	selected_character_idx = -1
	turn_phase = "player"
	is_victory = false
	pending_events.clear()
	for ch_cfg in level_data.get("characters", []):
		var ch_full: Dictionary = ConfigLoader.get_character(ch_cfg.get("id", ""))
		if ch_full.is_empty():
			continue
		var ch: Dictionary = ch_full.duplicate(true)
		ch["grid_x"] = ch_cfg.get("start_x", 0)
		ch["grid_y"] = ch_cfg.get("start_y", 0)
		ch["ap"] = ch.get("max_ap", 3)
		ch["buffs"] = []
		ch["skill_cooldowns"] = {}
		for sk in ch.get("skills", []):
			ch["skill_cooldowns"][sk.get("id", "")] = 0
		characters.append(ch)
	for task_cfg in level_data.get("tasks", []):
		var task: Dictionary = task_cfg.duplicate(true)
		task["progress"] = 0
		task["completed"] = false
		tasks.append(task)
	change_state(GameState.PLAYING)
	_check_triggered_events("turn_start", {"turn": turn})
	if characters.size() > 0:
		select_character(0)
	emit_signal("turn_changed", turn)

func select_character(idx: int):
	if idx < 0 or idx >= characters.size():
		return
	selected_character_idx = idx
	emit_signal("character_selected", idx)

func get_selected_character() -> Dictionary:
	if selected_character_idx >= 0 and selected_character_idx < characters.size():
		return characters[selected_character_idx]
	return {}

func get_character_at(gx: int, gy: int) -> int:
	for i in characters.size():
		var ch: Dictionary = characters[i]
		if ch.get("grid_x", -1) == gx and ch.get("grid_y", -1) == gy:
			return i
	return -1

func get_task_at(gx: int, gy: int) -> int:
	for i in tasks.size():
		var t: Dictionary = tasks[i]
		if t.get("x", -1) == gx and t.get("y", -1) == gy and not t.get("completed", false):
			return i
	return -1

func add_satisfaction(delta: float, source_pos: Vector2 = Vector2.ZERO):
	satisfaction += delta
	emit_signal("satisfaction_changed", satisfaction, delta)
	if source_pos != Vector2.ZERO:
		var txt: String = "%+g 满意度" % delta
		var col: Color = Color.GREEN if delta >= 0 else Color.RED
		emit_signal("float_text", source_pos, txt, col)
	_check_lose_condition()

func spend_ap(amount: int) -> bool:
	var ch: Dictionary = get_selected_character()
	if ch.is_empty():
		return false
	var cur: int = ch.get("ap", 0)
	if cur < amount:
		return false
	ch["ap"] = cur - amount
	return true

func is_character_adjacent_to_task(ch_idx: int, task_idx: int) -> bool:
	if ch_idx < 0 or task_idx < 0 or ch_idx >= characters.size() or task_idx >= tasks.size():
		return false
	var ch: Dictionary = characters[ch_idx]
	var t: Dictionary = tasks[task_idx]
	if ch.get("grid_x", -1) == t.get("x", -1) and ch.get("grid_y", -1) == t.get("y", -1):
		return true
	var dx: int = abs(int(ch.get("grid_x", -1)) - int(t.get("x", -1)))
	var dy: int = abs(int(ch.get("grid_y", -1)) - int(t.get("y", -1)))
	return (dx <= 1 and dy <= 1) and (dx + dy > 0)

func get_effective_stat(ch_idx: int, stat: String) -> float:
	if ch_idx < 0 or ch_idx >= characters.size():
		return 0.0
	var ch: Dictionary = characters[ch_idx]
	var base: float = float(ch.get("stats", {}).get(stat, 0))
	var mult: float = 1.0
	var add: float = 0.0
	for buff in ch.get("buffs", []):
		if buff.get("stat", "") == stat or buff.get("stat", "") == "all":
			mult *= buff.get("mult", 1.0)
			add += buff.get("add", 0.0)
	return base * mult + add

func end_turn():
	if current_state != GameState.PLAYING:
		return
	_process_buffs_turn_end()
	_process_skill_cooldowns_turn_end()
	turn += 1
	if turn > max_turns:
		var lose: Dictionary = level_data.get("lose_condition", {})
		if lose.get("turn_exceeded", true):
			_finish_game(false, "回合用尽！活动时间到了，但满意度还不够...")
			return
	for ch in characters:
		ch["ap"] = ch.get("max_ap", 3)
	selected_character_idx = 0 if characters.size() > 0 else -1
	turn_phase = "player"
	emit_signal("turn_changed", turn)
	_check_triggered_events("turn_start", {"turn": turn})
	var penalty: float = ConfigLoader.get_balance("balance.empty_turn_satisfaction_penalty", -2)
	var worked_this_turn: bool = false
	add_satisfaction(penalty if not worked_this_turn else 0)

func _process_buffs_turn_end():
	for ch in characters:
		var new_buffs: Array = []
		for buff in ch.get("buffs", []):
			buff["duration"] = int(buff.get("duration", 0)) - 1
			if buff["duration"] > 0:
				new_buffs.append(buff)
		ch["buffs"] = new_buffs

func _process_skill_cooldowns_turn_end():
	for ch in characters:
		var cds: Dictionary = ch.get("skill_cooldowns", {})
		for key in cds.keys():
			cds[key] = max(0, int(cds[key]) - 1)

func work_on_task(task_idx: int) -> bool:
	var ch: Dictionary = get_selected_character()
	if ch.is_empty() or task_idx < 0 or task_idx >= tasks.size():
		return false
	var t: Dictionary = tasks[task_idx]
	if t.get("completed", false):
		return false
	var ap_cost: int = int(ConfigLoader.get_balance("balance.task_work_ap_cost", 1))
	if not spend_ap(ap_cost):
		show_toast("行动点不足！", Color.RED)
		return false
	var is_adj: bool = is_character_adjacent_to_task(selected_character_idx, task_idx)
	var on_tile: bool = (ch.get("grid_x", -1) == t.get("x", -1) and ch.get("grid_y", -1) == t.get("y", -1))
	var task_type: String = t.get("type", "")
	var eff_stat: float = get_effective_stat(selected_character_idx, task_type)
	var bonus: float = ConfigLoader.get_balance("balance.on_tile_bonus", 1.5) if on_tile else ConfigLoader.get_balance("balance.adjacency_bonus", 1.2)
	var progress: float = eff_stat * bonus
	var global_mult: float = 1.0
	for event_b in pending_events:
		if event_b.get("type", "") == "buff_task_type" and event_b.get("task_type", "") == task_type and event_b.get("duration", 0) > 0:
			global_mult *= event_b.get("value", 1.0)
	progress *= global_mult
	progress = round(progress * 10.0) / 10.0
	t["progress"] = float(t.get("progress", 0)) + progress
	var prog_txt: String = "+%g %s" % [progress, _task_type_name(task_type)]
	emit_signal("float_text", Vector2(t.get("x", 0), t.get("y", 0)), prog_txt, Color.YELLOW)
	if float(t["progress"]) >= float(t.get("required_progress", 100)):
		t["progress"] = t.get("required_progress", 100)
		t["completed"] = true
		completed_tasks += 1
		var reward: float = float(t.get("reward_satisfaction", 0))
		add_satisfaction(reward)
		emit_signal("task_completed", t)
		show_toast("🎉 任务完成: %s (满意度+%g)" % [t.get("name", ""), reward], Color.GREEN)
		_check_triggered_events("task_completed", {"task": t, "task_type": task_type})
	else:
		show_toast("%s 进度 %g/%g" % [t.get("name", ""), t.get("progress", 0), t.get("required_progress", 100)], Color.WHITE)
	_check_win_condition()
	AudioManager.play_sfx("work")
	return true

func _task_type_name(t: String) -> String:
	match t:
		"booth": return "布展"
		"promo": return "宣传"
		"reception": return "接待"
	return "任务"

func show_toast(msg: String, col: Color = Color.WHITE):
	emit_signal("toast_message", msg, col)

func _check_win_condition():
	if completed_tasks >= required_tasks and satisfaction >= target_satisfaction:
		_finish_game(true, "活动圆满成功！大家辛苦了！")

func _check_lose_condition():
	if satisfaction <= min_satisfaction:
		_finish_game(false, "满意度太低了...来宾都走光了。")

func _finish_game(victory: bool, reason: String):
	is_victory = victory
	var result: Dictionary = {
		"victory": victory,
		"reason": reason,
		"level_id": current_level_id,
		"turns_used": turn,
		"final_satisfaction": satisfaction,
		"target_satisfaction": target_satisfaction,
		"tasks_completed": completed_tasks,
		"tasks_required": required_tasks,
		"total_tasks": tasks.size()
	}
	SaveSystem.add_completed_level(current_level_id) if victory else null
	SaveSystem.save_last_result(result)
	change_state(GameState.RESULT)
	emit_signal("game_over", victory)

func use_skill(skill_idx: int, target_gx: int = -1, target_gy: int = -1, target_char_idx: int = -1) -> bool:
	var ch: Dictionary = get_selected_character()
	if ch.is_empty():
		return false
	var skill: Dictionary = ConfigLoader.get_skill(ch.get("id", ""), skill_idx)
	if skill.is_empty():
		return false
	var skill_id: String = skill.get("id", "")
	var cd: int = int(ch.get("skill_cooldowns", {}).get(skill_id, 0))
	if cd > 0:
		show_toast("技能冷却中: %d 回合" % cd, Color.ORANGE)
		return false
	var ap_cost: int = int(skill.get("ap_cost", 1))
	if not spend_ap(ap_cost):
		show_toast("行动点不足！", Color.RED)
		return false
	_execute_skill(skill, ch, target_gx, target_gy, target_char_idx)
	ch["skill_cooldowns"][skill_id] = int(skill.get("cooldown", 0))
	AudioManager.play_sfx("skill")
	show_toast("✨ %s 发动: %s" % [ch.get("name", ""), skill.get("name", "")], Color.LIGHT_BLUE)
	return true

func _execute_skill(skill: Dictionary, caster: Dictionary, gx: int, gy: int, ci: int):
	var eff: String = skill.get("effect", "")
	var val: float = float(skill.get("value", 0))
	var dur: int = int(skill.get("duration", 1))
	var caster_idx: int = characters.find(caster)
	match eff:
		"restore_ap":
			var tgt: Dictionary = caster if skill.get("target", "") == "self" else (characters[ci] if ci >= 0 else caster)
			tgt["ap"] = int(tgt.get("ap", 0)) + int(val)
		"gain_ap":
			caster["ap"] = int(caster.get("ap", 0)) + int(val)
		"complete_booth":
			var ti: int = -1
			if caster_idx >= 0:
				ti = get_task_at(int(caster.get("grid_x", -1)), int(caster.get("grid_y", -1)))
			if ti >= 0 and tasks[ti].get("type", "") == "booth":
				tasks[ti]["progress"] = tasks[ti].get("required_progress", 1)
				tasks[ti]["completed"] = true
				completed_tasks += 1
				var rw: float = float(tasks[ti].get("reward_satisfaction", 0))
				add_satisfaction(rw)
				emit_signal("task_completed", tasks[ti])
				_check_win_condition()
		"double_booth_next":
			caster["buffs"].append({"stat": "booth", "mult": val, "add": 0, "duration": dur})
		"buff_all_stats":
			var r: int = int(skill.get("range", 0))
			for i in characters.size():
				var d: Dictionary = characters[i]
				if _manhattan_distance(caster, d) <= r:
					d["buffs"].append({"stat": "all", "mult": 1.0, "add": val, "duration": dur})
		"boost_promo":
			if gx >= 0 and gy >= 0:
				var tidx: int = get_task_at(gx, gy)
				if tidx >= 0 and tasks[tidx].get("type", "") == "promo":
					tasks[tidx]["progress"] = float(tasks[tidx].get("progress", 0)) + val
		"area_promo_satisfaction":
			add_satisfaction(float(skill.get("satisfaction_value", 0)))
			var rng: int = int(skill.get("range", 0))
			for ti in tasks.size():
				var t: Dictionary = tasks[ti]
				if t.get("type", "") == "promo" and not t.get("completed", false):
					if abs(int(t.get("x", 0)) - int(caster.get("grid_x", 0))) <= rng and abs(int(t.get("y", 0)) - int(caster.get("grid_y", 0))) <= rng:
						t["progress"] = float(t.get("progress", 0)) + float(skill.get("promo_value", 0))
		"boost_reception":
			if gx >= 0 and gy >= 0:
				var tidx: int = get_task_at(gx, gy)
				if tidx >= 0 and tasks[tidx].get("type", "") == "reception":
					tasks[tidx]["progress"] = float(tasks[tidx].get("progress", 0)) + val
			add_satisfaction(float(skill.get("satisfaction_value", 0)))
		"party_restore_ap_satisfaction":
			add_satisfaction(float(skill.get("satisfaction_value", 0)))
			var rng2: int = int(skill.get("range", 0))
			for i in characters.size():
				var d: Dictionary = characters[i]
				if _manhattan_distance(caster, d) <= rng2:
					d["ap"] = int(d.get("ap", 0)) + int(skill.get("ap_value", 0))
		"vip_boost":
			add_satisfaction(float(skill.get("satisfaction_value", 0)))
			for ti in tasks.size():
				if tasks[ti].get("type", "") == "reception" and not tasks[ti].get("completed", false):
					tasks[ti]["progress"] = float(tasks[ti].get("progress", 0)) + float(skill.get("reception_value", 0))
		"spawn_poster":
			pass

func _manhattan_distance(a: Dictionary, b: Dictionary) -> int:
	var dx: int = abs(int(a.get("grid_x", 0)) - int(b.get("grid_x", 0)))
	var dy: int = abs(int(a.get("grid_y", 0)) - int(b.get("grid_y", 0)))
	return dx + dy

func _check_triggered_events(trigger: String, ctx: Dictionary):
	for ev in level_data.get("events", []):
		if ev.get("trigger", "") != trigger:
			continue
		var is_match: bool = false
		if trigger == "turn_start":
			var target_turn: int = int(ev.get("turn", -1))
			is_match = (turn == target_turn)
		elif trigger == "task_completed":
			var tt: String = ev.get("task_type", "")
			is_match = (tt == "any" or tt == ctx.get("task_type", ""))
			if tutorial_shown.get("task_completed", false):
				is_match = false
		if is_match:
			if trigger == "task_completed":
				tutorial_shown["task_completed"] = true
			var show_dialog: Dictionary = ev.duplicate(true)
			show_dialog["_resolved"] = false
			pending_events.append(show_dialog)
			emit_signal("dialog_requested", show_dialog)

func resolve_event_choice(event: Dictionary, choice_idx: int):
	var choices: Array = event.get("choices", [])
	if choice_idx < 0 or choice_idx >= choices.size():
		return
	var choice: Dictionary = choices[choice_idx]
	var action: String = choice.get("action", "close")
	var params: Dictionary = choice.get("params", {})
	match action:
		"temp_satisfaction":
			add_satisfaction(float(params.get("value", 0)))
			var btype: String = params.get("buff_type", "")
			if btype != "":
				pending_events.append({"type": "buff_task_type", "task_type": btype, "value": float(params.get("buff_value", 1.0)), "duration": int(params.get("buff_duration", 1))})
			var dtype: String = params.get("debuff_type", "")
			if dtype != "":
				pending_events.append({"type": "buff_task_type", "task_type": dtype, "value": float(params.get("debuff_value", 1.0)), "duration": int(params.get("debuff_duration", 1))})
		"boost_all_tasks":
			for t in tasks:
				if t.get("type", "") == params.get("task_type", "") and not t.get("completed", false):
					t["progress"] = float(t.get("progress", 0)) + float(params.get("value", 0))
		"delayed_satisfaction":
			for k in int(params.get("duration", 1)):
				add_satisfaction(float(params.get("value", 0)))
		"buff_task_type":
			pending_events.append({"type": "buff_task_type", "task_type": params.get("task_type", ""), "value": float(params.get("value", 1.0)), "duration": int(params.get("duration", 1))})
		"satisfaction_and_boost":
			add_satisfaction(float(params.get("satisfaction", 0)))
			for t in tasks:
				if t.get("type", "") == params.get("task_type", "") and not t.get("completed", false):
					t["progress"] = float(t.get("progress", 0)) + float(params.get("boost", 0))
		"final_spurt":
			for ch in characters:
				ch["ap"] = int(ch.get("ap", 0)) + int(params.get("ap", 0))
			add_satisfaction(float(params.get("satisfaction", 0)))
		_:
			pass
	event["_resolved"] = true
	var idx: int = pending_events.find(event)
	if idx >= 0:
		pending_events.remove_at(idx)
	_check_win_condition()
