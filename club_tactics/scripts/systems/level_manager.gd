class_name LevelManager
extends RefCounted

static func build_level_tasks(level_id: String) -> Array[TaskData]:
	var tasks: Array[TaskData] = []
	match level_id:
		"tutorial":
			var t: TaskData = TaskData.new()
			t.id = "tut_exh_1"
			t.task_type = TaskData.TaskType.EXHIBITION
			t.display_name = "布置展台"
			t.description = "将展台布置好"
			t.grid_position = Vector2i(3, 2)
			t.required_power = 2
			t.turns_remaining = 4
			t.satisfaction_reward = 20.0
			t.satisfaction_penalty = 5.0
			tasks.append(t)
		"level_1":
			var t1: TaskData = TaskData.new()
			t1.id = "l1_exh_1"
			t1.task_type = TaskData.TaskType.EXHIBITION
			t1.display_name = "布置展台A"
			t1.description = "将展台A布置好"
			t1.grid_position = Vector2i(2, 1)
			t1.required_power = 3
			t1.turns_remaining = 4
			t1.satisfaction_reward = 15.0
			t1.satisfaction_penalty = 10.0
			tasks.append(t1)
			var t2: TaskData = TaskData.new()
			t2.id = "l1_exh_2"
			t2.task_type = TaskData.TaskType.EXHIBITION
			t2.display_name = "布置展台B"
			t2.description = "将展台B布置好"
			t2.grid_position = Vector2i(5, 4)
			t2.required_power = 3
			t2.turns_remaining = 4
			t2.satisfaction_reward = 15.0
			t2.satisfaction_penalty = 10.0
			tasks.append(t2)
			var t3: TaskData = TaskData.new()
			t3.id = "l1_pub_1"
			t3.task_type = TaskData.TaskType.PUBLICITY
			t3.display_name = "发传单"
			t3.description = "在校园里发放传单宣传"
			t3.grid_position = Vector2i(6, 2)
			t3.required_power = 3
			t3.turns_remaining = 5
			t3.satisfaction_reward = 15.0
			t3.satisfaction_penalty = 10.0
			tasks.append(t3)
		"level_2":
			var t1: TaskData = TaskData.new()
			t1.id = "l2_exh_1"
			t1.task_type = TaskData.TaskType.EXHIBITION
			t1.display_name = "布置展台"
			t1.description = "将展台布置好"
			t1.grid_position = Vector2i(3, 1)
			t1.required_power = 3
			t1.turns_remaining = 5
			t1.satisfaction_reward = 12.0
			t1.satisfaction_penalty = 10.0
			tasks.append(t1)
			var t2: TaskData = TaskData.new()
			t2.id = "l2_pub_1"
			t2.task_type = TaskData.TaskType.PUBLICITY
			t2.display_name = "宣传点A"
			t2.description = "在宣传点A进行宣传"
			t2.grid_position = Vector2i(2, 3)
			t2.required_power = 3
			t2.turns_remaining = 5
			t2.satisfaction_reward = 12.0
			t2.satisfaction_penalty = 10.0
			tasks.append(t2)
			var t3: TaskData = TaskData.new()
			t3.id = "l2_pub_2"
			t3.task_type = TaskData.TaskType.PUBLICITY
			t3.display_name = "宣传点B"
			t3.description = "在宣传点B进行宣传"
			t3.grid_position = Vector2i(6, 1)
			t3.required_power = 3
			t3.turns_remaining = 5
			t3.satisfaction_reward = 12.0
			t3.satisfaction_penalty = 10.0
			tasks.append(t3)
			var t4: TaskData = TaskData.new()
			t4.id = "l2_rec_1"
			t4.task_type = TaskData.TaskType.RECEPTION
			t4.display_name = "接待来宾"
			t4.description = "接待到访来宾"
			t4.grid_position = Vector2i(7, 4)
			t4.required_power = 2
			t4.turns_remaining = 5
			t4.satisfaction_reward = 12.0
			t4.satisfaction_penalty = 10.0
			tasks.append(t4)
		"level_3":
			var t1: TaskData = TaskData.new()
			t1.id = "l3_exh_1"
			t1.task_type = TaskData.TaskType.EXHIBITION
			t1.display_name = "展台A"
			t1.description = "布置展台A"
			t1.grid_position = Vector2i(2, 2)
			t1.required_power = 3
			t1.turns_remaining = 5
			t1.satisfaction_reward = 12.0
			t1.satisfaction_penalty = 8.0
			tasks.append(t1)
			var t2: TaskData = TaskData.new()
			t2.id = "l3_exh_2"
			t2.task_type = TaskData.TaskType.EXHIBITION
			t2.display_name = "展台B"
			t2.description = "布置展台B"
			t2.grid_position = Vector2i(8, 3)
			t2.required_power = 3
			t2.turns_remaining = 5
			t2.satisfaction_reward = 12.0
			t2.satisfaction_penalty = 8.0
			tasks.append(t2)
			var t3: TaskData = TaskData.new()
			t3.id = "l3_pub_1"
			t3.task_type = TaskData.TaskType.PUBLICITY
			t3.display_name = "校园宣传"
			t3.description = "在校园内进行宣传"
			t3.grid_position = Vector2i(5, 1)
			t3.required_power = 4
			t3.turns_remaining = 5
			t3.satisfaction_reward = 12.0
			t3.satisfaction_penalty = 8.0
			tasks.append(t3)
			var t4: TaskData = TaskData.new()
			t4.id = "l3_rec_1"
			t4.task_type = TaskData.TaskType.RECEPTION
			t4.display_name = "接待点A"
			t4.description = "在接待点A接待来宾"
			t4.grid_position = Vector2i(3, 5)
			t4.required_power = 3
			t4.turns_remaining = 5
			t4.satisfaction_reward = 12.0
			t4.satisfaction_penalty = 8.0
			tasks.append(t4)
			var t5: TaskData = TaskData.new()
			t5.id = "l3_rec_2"
			t5.task_type = TaskData.TaskType.RECEPTION
			t5.display_name = "接待点B"
			t5.description = "在接待点B接待来宾"
			t5.grid_position = Vector2i(7, 5)
			t5.required_power = 3
			t5.turns_remaining = 5
			t5.satisfaction_reward = 12.0
			t5.satisfaction_penalty = 8.0
			tasks.append(t5)
		"level_4":
			var t1: TaskData = TaskData.new()
			t1.id = "l4_exh_1"
			t1.task_type = TaskData.TaskType.EXHIBITION
			t1.display_name = "展台A"
			t1.description = "布置展台A"
			t1.grid_position = Vector2i(2, 2)
			t1.required_power = 4
			t1.turns_remaining = 6
			t1.satisfaction_reward = 10.0
			t1.satisfaction_penalty = 8.0
			tasks.append(t1)
			var t2: TaskData = TaskData.new()
			t2.id = "l4_exh_2"
			t2.task_type = TaskData.TaskType.EXHIBITION
			t2.display_name = "展台B"
			t2.description = "布置展台B"
			t2.grid_position = Vector2i(8, 2)
			t2.required_power = 4
			t2.turns_remaining = 6
			t2.satisfaction_reward = 10.0
			t2.satisfaction_penalty = 8.0
			tasks.append(t2)
			var t3: TaskData = TaskData.new()
			t3.id = "l4_pub_1"
			t3.task_type = TaskData.TaskType.PUBLICITY
			t3.display_name = "宣传点A"
			t3.description = "在宣传点A进行宣传"
			t3.grid_position = Vector2i(4, 1)
			t3.required_power = 4
			t3.turns_remaining = 6
			t3.satisfaction_reward = 10.0
			t3.satisfaction_penalty = 8.0
			tasks.append(t3)
			var t4: TaskData = TaskData.new()
			t4.id = "l4_pub_2"
			t4.task_type = TaskData.TaskType.PUBLICITY
			t4.display_name = "宣传点B"
			t4.description = "在宣传点B进行宣传"
			t4.grid_position = Vector2i(6, 5)
			t4.required_power = 4
			t4.turns_remaining = 6
			t4.satisfaction_reward = 10.0
			t4.satisfaction_penalty = 8.0
			tasks.append(t4)
			var t5: TaskData = TaskData.new()
			t5.id = "l4_rec_1"
			t5.task_type = TaskData.TaskType.RECEPTION
			t5.display_name = "接待点A"
			t5.description = "在接待点A接待来宾"
			t5.grid_position = Vector2i(3, 6)
			t5.required_power = 3
			t5.turns_remaining = 6
			t5.satisfaction_reward = 10.0
			t5.satisfaction_penalty = 8.0
			tasks.append(t5)
			var t6: TaskData = TaskData.new()
			t6.id = "l4_rec_2"
			t6.task_type = TaskData.TaskType.RECEPTION
			t6.display_name = "接待点B"
			t6.description = "在接待点B接待来宾"
			t6.grid_position = Vector2i(7, 6)
			t6.required_power = 3
			t6.turns_remaining = 6
			t6.satisfaction_reward = 10.0
			t6.satisfaction_penalty = 8.0
			tasks.append(t6)
			var t7: TaskData = TaskData.new()
			t7.id = "l4_pub_3"
			t7.task_type = TaskData.TaskType.PUBLICITY
			t7.display_name = "宣传点C"
			t7.description = "在宣传点C进行宣传"
			t7.grid_position = Vector2i(5, 3)
			t7.required_power = 3
			t7.turns_remaining = 6
			t7.satisfaction_reward = 10.0
			t7.satisfaction_penalty = 8.0
			tasks.append(t7)
	return tasks

static func build_level_events(level_id: String) -> Array[EventData]:
	var events: Array[EventData] = []
	match level_id:
		"tutorial":
			pass
		"level_1":
			var e: EventData = EventData.new()
			e.id = "l1_coffee"
			e.display_name = "咖啡时间"
			e.description = "社团成员送来咖啡"
			e.trigger_condition = EventData.TriggerCondition.TURN_START
			e.trigger_turn = 3
			e.satisfaction_modifier = 5.0
			e.ap_modifier = 0
			e.is_one_shot = true
			e.has_triggered = false
			events.append(e)
		"level_2":
			var e1: EventData = EventData.new()
			e1.id = "l2_flyer"
			e1.display_name = "传单不够了"
			e1.description = "传单不够了"
			e1.trigger_condition = EventData.TriggerCondition.TURN_START
			e1.trigger_turn = 2
			e1.satisfaction_modifier = -5.0
			e1.ap_modifier = 0
			e1.is_one_shot = true
			e1.has_triggered = false
			events.append(e1)
			var e2: EventData = EventData.new()
			e2.id = "l2_teacher"
			e2.display_name = "老师来帮忙"
			e2.description = "老师来帮忙"
			e2.trigger_condition = EventData.TriggerCondition.TURN_START
			e2.trigger_turn = 4
			e2.satisfaction_modifier = 10.0
			e2.ap_modifier = 0
			e2.is_one_shot = true
			e2.has_triggered = false
			events.append(e2)
		"level_3":
			var e1: EventData = EventData.new()
			e1.id = "l3_unhappy"
			e1.display_name = "来宾不满"
			e1.description = "来宾不满"
			e1.trigger_condition = EventData.TriggerCondition.SATISFACTION_BELOW
			e1.trigger_value = 30.0
			e1.satisfaction_modifier = -10.0
			e1.ap_modifier = 0
			e1.is_one_shot = true
			e1.has_triggered = false
			events.append(e1)
			var e2: EventData = EventData.new()
			e2.id = "l3_volunteer"
			e2.display_name = "志愿者加入"
			e2.description = "志愿者加入"
			e2.trigger_condition = EventData.TriggerCondition.TURN_START
			e2.trigger_turn = 3
			e2.satisfaction_modifier = 8.0
			e2.ap_modifier = 1
			e2.is_one_shot = true
			e2.has_triggered = false
			events.append(e2)
		"level_4":
			var e1: EventData = EventData.new()
			e1.id = "l4_venue"
			e1.display_name = "场地临时调整"
			e1.description = "场地临时调整"
			e1.trigger_condition = EventData.TriggerCondition.TURN_START
			e1.trigger_turn = 2
			e1.satisfaction_modifier = -8.0
			e1.ap_modifier = 0
			e1.is_one_shot = true
			e1.has_triggered = false
			events.append(e1)
			var e2: EventData = EventData.new()
			e2.id = "l4_guest"
			e2.display_name = "嘉宾到访"
			e2.description = "嘉宾到访"
			e2.trigger_condition = EventData.TriggerCondition.TURN_START
			e2.trigger_turn = 4
			e2.satisfaction_modifier = 5.0
			e2.ap_modifier = 0
			e2.is_one_shot = true
			e2.has_triggered = false
			events.append(e2)
			var e3: EventData = EventData.new()
			e3.id = "l4_emergency"
			e3.display_name = "紧急状况"
			e3.description = "紧急状况"
			e3.trigger_condition = EventData.TriggerCondition.SATISFACTION_BELOW
			e3.trigger_value = 25.0
			e3.satisfaction_modifier = -15.0
			e3.ap_modifier = 0
			e3.is_one_shot = true
			e3.has_triggered = false
			events.append(e3)
	return events

static func build_obstacles(level_id: String) -> Array[Vector2i]:
	var obstacles: Array[Vector2i] = []
	match level_id:
		"tutorial":
			pass
		"level_1":
			obstacles.append(Vector2i(4, 3))
		"level_2":
			obstacles.append(Vector2i(4, 2))
			obstacles.append(Vector2i(3, 4))
		"level_3":
			obstacles.append(Vector2i(4, 3))
			obstacles.append(Vector2i(5, 3))
			obstacles.append(Vector2i(3, 4))
			obstacles.append(Vector2i(6, 4))
		"level_4":
			obstacles.append(Vector2i(4, 3))
			obstacles.append(Vector2i(5, 3))
			obstacles.append(Vector2i(3, 5))
			obstacles.append(Vector2i(6, 5))
			obstacles.append(Vector2i(5, 6))
	return obstacles

static func get_start_positions(level_id: String, character_ids: Array[String]) -> Dictionary:
	var positions: Dictionary = {}
	match level_id:
		"tutorial":
			positions["xiaoming"] = Vector2i(0, 2)
		"level_1":
			positions["xiaoming"] = Vector2i(0, 1)
			positions["xiaohong"] = Vector2i(0, 4)
		"level_2":
			positions["xiaoming"] = Vector2i(0, 1)
			positions["xiaohong"] = Vector2i(0, 3)
			positions["xiaoli"] = Vector2i(0, 5)
		"level_3":
			positions["xiaoming"] = Vector2i(0, 1)
			positions["xiaohong"] = Vector2i(0, 2)
			positions["xiaoli"] = Vector2i(0, 5)
			positions["xiaozhang"] = Vector2i(0, 6)
		"level_4":
			positions["xiaoming"] = Vector2i(0, 1)
			positions["xiaohong"] = Vector2i(0, 3)
			positions["xiaoli"] = Vector2i(0, 5)
			positions["xiaozhang"] = Vector2i(0, 6)
			positions["xiaowang"] = Vector2i(0, 7)
	return positions
