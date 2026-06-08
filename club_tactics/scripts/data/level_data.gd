class_name LevelData
extends Resource

@export var id: String = ""
@export var display_name: String = ""
@export var description: String = ""
@export var grid_width: int = 8
@export var grid_height: int = 6
@export var turn_limit: int = 5
@export var satisfaction_threshold: float = 60.0
@export var initial_satisfaction: float = 50.0
@export var character_ids: Array[String] = []
@export var task_list: Array[TaskData] = []
@export var event_list: Array[EventData] = []
@export var obstacle_positions: Array[Vector2i] = []
@export var is_tutorial: bool = false
@export var tutorial_steps: Array[String] = []
