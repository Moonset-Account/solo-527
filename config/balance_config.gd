extends Resource
class_name GameBalanceConfig

const SCORE := {
	"place_item_base": 50,
	"place_fragile_bonus": 100,
	"place_heavy_bonus": 80,
	"place_optimized_bonus": 150,
	"combo_multiplier_per": 0.1,
	"combo_max_multiplier": 3.0,
	"time_bonus_per_second": 8,
	"time_bonus_max": 500,
	"weight_fill_bonus_max": 300,
	"fragile_intact_bonus": 400,
	"mistake_penalty": 50,
	"collision_warning_penalty": 5,
	"out_of_bounds_penalty": 30
}

const PHYSICS := {
	"gravity_scale": 0.0,
	"drag_lerp_speed": 25.0,
	"rotate_lerp_speed": 15.0,
	"snap_grid_size": 10.0,
	"snap_distance_threshold": 25.0,
	"valid_place_highlight_color": Color(0.3, 0.85, 0.4, 0.7),
	"invalid_place_highlight_color": Color(0.9, 0.3, 0.3, 0.7),
	"warning_place_highlight_color": Color(0.9, 0.75, 0.2, 0.7),
	"collision_pulse_duration": 0.3,
	"fragile_warn_weight_ratio": 0.75,
	"fragile_break_weight_ratio": 1.25
}

const TIMING := {
	"notification_short": 1.5,
	"notification_medium": 2.5,
	"notification_long": 4.0,
	"shake_duration_small": 0.15,
	"shake_duration_medium": 0.3,
	"shake_duration_large": 0.5,
	"shake_amplitude_small": 2.0,
	"shake_amplitude_medium": 5.0,
	"shake_amplitude_large": 10.0,
	"drop_animation_duration": 0.2,
	"rotate_animation_duration": 0.15,
	"score_popup_duration": 1.2,
	"auto_save_interval": 30.0
}

const WEIGHT_CATEGORIES := {
	"very_light_max": 5.0,
	"light_max": 20.0,
	"medium_max": 60.0,
	"heavy_max": 150.0
}

@export var score_values: Dictionary = SCORE
@export var physics_params: Dictionary = PHYSICS
@export var timing_params: Dictionary = TIMING
@export var weight_categories: Dictionary = WEIGHT_CATEGORIES
