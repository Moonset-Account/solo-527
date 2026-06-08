extends Node

signal money_changed(new_amount)
signal reputation_changed(new_amount)
signal level_started(level_id)
signal level_completed(level_id, stars)
signal game_over(reason)
signal paused_changed(is_paused)

var current_level_id: String = ""
var money: int = 0
var reputation: int = 100
var is_paused: bool = false
var is_game_active: bool = false

func start_level(level_id: String) -> void:
	current_level_id = level_id
	is_paused = false
	is_game_active = true
	level_started.emit(level_id)

func set_money(value: int) -> void:
	money = value
	money_changed.emit(money)

func set_reputation(value: int) -> void:
	reputation = value
	reputation_changed.emit(reputation)

func complete_level(stars: int = 0) -> void:
	is_game_active = false
	level_completed.emit(current_level_id, stars)

func fail_level(reason: String) -> void:
	is_game_active = false
	game_over.emit(reason)

func add_money(amount: int) -> void:
	money += amount
	money_changed.emit(money)

func spend_money(amount: int) -> bool:
	if money < amount:
		return false
	money -= amount
	money_changed.emit(money)
	return true

func add_reputation(amount: int) -> void:
	reputation += amount
	reputation_changed.emit(reputation)

func lose_reputation(amount: int) -> void:
	reputation -= amount
	if reputation < 0:
		reputation = 0
	reputation_changed.emit(reputation)
	if reputation <= 0:
		fail_level("reputation_zero")

func toggle_pause() -> void:
	if not is_game_active:
		return
	is_paused = not is_paused
	paused_changed.emit(is_paused)

func get_money() -> int:
	return money

func get_reputation() -> int:
	return reputation
