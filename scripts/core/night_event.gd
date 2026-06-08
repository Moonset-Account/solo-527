class_name NightEvent
extends Resource

enum Severity { LOW, MEDIUM, HIGH, CRITICAL }
enum AffectedSystem { POWER, OXYGEN, SONAR, STRUCTURE, MULTIPLE }

@export var id: String = ""
@export var display_name: String = ""
@export var description: String = ""
@export var severity: Severity = Severity.LOW
@export var affected_system: AffectedSystem = AffectedSystem.POWER
@export var power_drain: int = 0
@export var oxygen_drain: int = 0
@export var sonar_drain: int = 0
@export var structure_damage: int = 0
@export var weight: float = 1.0
@export var cooldown_nights: int = 0
@export var min_night: int = 1
@export var max_night: int = -1
@export var is_tutorial_only: bool = false
@export var requires_sonar: bool = false
