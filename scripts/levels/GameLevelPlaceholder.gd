extends Node2D

func _ready():
	var bootstrap = get_tree().get_first_node_in_group("main_bootstrap")
	if bootstrap and bootstrap.has_method("build_game_level"):
		bootstrap.build_game_level(1)
		queue_free()
