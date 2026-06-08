class_name TaskData
extends Resource

enum TaskType { EXHIBITION, PUBLICITY, RECEPTION }

@export var id: String = ""
@export var task_type: TaskType = TaskType.EXHIBITION
@export var display_name: String = ""
@export var description: String = ""
@export var grid_position: Vector2i = Vector2i.ZERO
@export var required_power: int = 3
@export var turns_remaining: int = 3
@export var satisfaction_reward: float = 15.0
@export var satisfaction_penalty: float = 10.0
@export var is_completed: bool = false
@export var is_failed: bool = false
