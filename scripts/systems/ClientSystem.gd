extends Node

signal client_request_updated(level_id: int)
signal reward_claimed(level_id: int, amount: int)

func get_client_info(level_data: Dictionary) -> Dictionary:
	return level_data.get("client", {})

func calculate_reward(
	level_data: Dictionary,
	score: int,
	grade: String,
	time_taken: float,
	time_limit: float
) -> int:
	var base_reward: int = level_data.get("client", {}).get("reward", 100)
	var urgency: int = level_data.get("client", {}).get("urgency", 1)
	var score_multiplier: float = 1.0
	match grade:
		"S":
			score_multiplier = 1.8
		"A":
			score_multiplier = 1.5
		"B":
			score_multiplier = 1.2
		"C":
			score_multiplier = 1.0
		"D":
			score_multiplier = 0.7
		_:
			score_multiplier = 0.3
	var time_ratio: float = 1.0 - (time_taken / max(1.0, time_limit))
	var time_bonus: float = 1.0 + clamp(time_ratio * 0.3, 0.0, 0.3)
	var urgency_multiplier: float = 1.0 + (urgency - 1) * 0.1
	var final_reward: int = int(base_reward * score_multiplier * time_bonus * urgency_multiplier)
	return max(0, final_reward)

func format_deadline_display(time_limit: float) -> String:
	var minutes: int = int(time_limit) / 60
	var seconds: int = int(time_limit) % 60
	return "%d分%d秒" % [minutes, seconds]

func get_urgency_stars(urgency: int) -> String:
	var stars: String = ""
	for i in range(urgency):
		stars += "★"
	for i in range(3 - urgency):
		stars += "☆"
	return stars
