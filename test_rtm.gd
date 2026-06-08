extends SceneTree

func _init():
	print("=== Testing RuntimeTextureManager parse ===")
	var err := load("res://scripts/autoload/RuntimeTextureManager.gd")
	if err:
		print("Loaded successfully!")
	else:
		print("Load failed (see error above)")
	quit()
