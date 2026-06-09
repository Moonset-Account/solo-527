extends Node
## 游戏状态 - 全局游戏状态管理

signal state_changed(old_state: int, new_state: int)
signal level_started(level_id: int)
signal level_completed(level_id: int, score: int, stars: int)
signal level_failed(level_id: int, reason: String)

enum GameStates {
    MENU,
    LEVEL_SELECT,
    GAME_PLAYING,
    GAME_PAUSED,
    GAME_RESULT,
    TUTORIAL,
    SETTINGS,
    ACHIEVEMENTS,
    LEADERBOARD,
    DAILY_CHALLENGE
}

var current_state: int = GameStates.MENU
var previous_state: int = GameStates.MENU
var current_level_id: int = 1
var is_daily_mode: bool = false
var current_score: int = 0
var current_stars: int = 0

func change_state(new_state: int) -> void:
    if current_state == new_state:
        return
    var old: int = current_state
    previous_state = old
    current_state = new_state
    state_changed.emit(old, new_state)

func start_level(level_id: int, daily: bool = false) -> void:
    current_level_id = level_id
    is_daily_mode = daily
    current_score = 0
    current_stars = 0
    change_state(GameStates.GAME_PLAYING)
    level_started.emit(level_id)

func complete_level(score: int, stars: int) -> void:
    current_score = score
    current_stars = stars
    if not is_daily_mode:
        SaveSystem.set_level_progress(current_level_id, score, stars, true)
    change_state(GameStates.GAME_RESULT)
    level_completed.emit(current_level_id, score, stars)

func fail_level(reason: String) -> void:
    change_state(GameStates.GAME_RESULT)
    level_failed.emit(current_level_id, reason)

func pause_game() -> void:
    if current_state == GameStates.GAME_PLAYING:
        change_state(GameStates.GAME_PAUSED)
        get_tree().paused = true
        AudioManager.pause_music()

func resume_game() -> void:
    if current_state == GameStates.GAME_PAUSED:
        change_state(GameStates.GAME_PLAYING)
        get_tree().paused = false
        AudioManager.resume_music()

func restart_level() -> void:
    get_tree().paused = false
    start_level(current_level_id, is_daily_mode)
    SceneManager.change_scene("game")

func go_to_main_menu() -> void:
    get_tree().paused = false
    change_state(GameStates.MENU)
    SceneManager.change_scene("main")

func go_to_level_select() -> void:
    get_tree().paused = false
    change_state(GameStates.LEVEL_SELECT)
    SceneManager.change_scene("level_select")

func go_to_settings() -> void:
    change_state(GameStates.SETTINGS)
    SceneManager.change_scene("settings")

func go_to_tutorial() -> void:
    change_state(GameStates.TUTORIAL)
    SceneManager.change_scene("tutorial")

func go_to_achievements() -> void:
    change_state(GameStates.ACHIEVEMENTS)
    SceneManager.change_scene("achievements")

func go_to_leaderboard() -> void:
    change_state(GameStates.LEADERBOARD)
    SceneManager.change_scene("leaderboard")

func go_to_daily_challenge() -> void:
    change_state(GameStates.DAILY_CHALLENGE)
    SceneManager.change_scene("daily")
