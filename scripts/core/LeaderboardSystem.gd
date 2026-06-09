extends Node
## 排行榜系统 - 本地排行榜和每日挑战

signal score_submitted(level_id: int, score: int, rank: int)

const LEADERBOARD_KEY := "leaderboard"
const DAILY_LEVEL_ID := 9999

var _daily_level_seed: int = 0

func _ready() -> void:
    _generate_daily_seed()
    if not SaveSystem.save_data.has(LEADERBOARD_KEY):
        SaveSystem.save_data[LEADERBOARD_KEY] = {}

func _generate_daily_seed() -> void:
    var date_str: String = Time.get_date_string_from_system()
    var hash_val: int = date_str.hash()
    _daily_level_seed = abs(hash_val) % 1000000

func get_daily_seed() -> int:
    return _daily_level_seed

func submit_score(level_id: int, score: int, player_name: String = "玩家") -> Dictionary:
    var key: String = str(level_id)
    if not SaveSystem.save_data[LEADERBOARD_KEY].has(key):
        SaveSystem.save_data[LEADERBOARD_KEY][key] = []
    var leaderboard: Array = SaveSystem.save_data[LEADERBOARD_KEY][key]
    var entry: Dictionary = {
        "name": player_name,
        "score": score,
        "date": Time.get_date_string_from_system(),
        "timestamp": Time.get_unix_time_from_system()
    }
    leaderboard.append(entry)
    leaderboard.sort_custom(func(a, b): return int(a["score"]) > int(b["score"]))
    while leaderboard.size() > 10:
        leaderboard.remove_at(leaderboard.size() - 1)
    SaveSystem.save_game()
    var rank: int = leaderboard.find(entry) + 1
    score_submitted.emit(level_id, score, rank)
    return {"entry": entry, "rank": rank, "total_entries": leaderboard.size()}

func get_leaderboard(level_id: int, limit: int = 10) -> Array:
    var key: String = str(level_id)
    if not SaveSystem.save_data[LEADERBOARD_KEY].has(key):
        return []
    var board: Array = SaveSystem.save_data[LEADERBOARD_KEY][key]
    return board.slice(0, min(limit, board.size())).duplicate(true)

func get_player_best(level_id: int) -> int:
    var progress: Dictionary = SaveSystem.get_level_progress(level_id)
    return int(progress.get("score", 0))

func is_high_score(level_id: int, score: int) -> bool:
    return score > get_player_best(level_id)

func generate_daily_challenge() -> Dictionary:
    var seed: int = _daily_level_seed
    var rng: RandomNumberGenerator = RandomNumberGenerator.new()
    rng.seed = seed
    var level_count: int = ResourceLoader_.get_level_count()
    var base_level: int = rng.randi_range(1, level_count)
    var base_def: Dictionary = ResourceLoader_.get_level_def(base_level)
    if base_def.is_empty():
        base_def = ResourceLoader_.get_level_def(1)
    var challenge: Dictionary = base_def.duplicate(true)
    challenge["level_id"] = DAILY_LEVEL_ID
    challenge["name"] = "每日挑战 - %s" % Time.get_date_string_from_system()
    challenge["description"] = "今天的种子: %d\n物品顺序已随机打乱！" % seed
    var extra_item_count: int = rng.randi_range(1, 3)
    var all_items: Dictionary = ResourceLoader_.get_all_items()
    var item_ids: Array = all_items.keys()
    for i in extra_item_count:
        challenge["items"].append(item_ids[rng.randi() % item_ids.size()])
    challenge["items"].shuffle()
    var mult: float = rng.randf_range(0.9, 1.2)
    challenge["max_weight"] = float(challenge["max_weight"]) * mult
    challenge["target_score"] = int(float(challenge["target_score"]) * mult)
    challenge["two_star_score"] = int(float(challenge["two_star_score"]) * mult)
    challenge["three_star_score"] = int(float(challenge["three_star_score"]) * mult)
    challenge["time_limit"] = 180
    return challenge

func get_daily_completion_status() -> Dictionary:
    return {
        "completed": SaveSystem.is_daily_completed(),
        "best_score": _get_daily_best(),
        "global_leaderboard": get_leaderboard(DAILY_LEVEL_ID, 5)
    }

func _get_daily_best() -> int:
    var leaderboard: Array = get_leaderboard(DAILY_LEVEL_ID, 1)
    if leaderboard.size() > 0:
        return int(leaderboard[0].get("score", 0))
    return 0

func submit_daily_score(score: int) -> Dictionary:
    SaveSystem.record_daily_completed(score)
    SaveSystem.save_data["daily_completed_count"] = int(SaveSystem.save_data.get("daily_completed_count", 0)) + 1
    SaveSystem.save_game()
    return submit_score(DAILY_LEVEL_ID, score)

func clear_leaderboard(level_id: int) -> void:
    var key: String = str(level_id)
    if SaveSystem.save_data[LEADERBOARD_KEY].has(key):
        SaveSystem.save_data[LEADERBOARD_KEY][key] = []
        SaveSystem.save_game()
