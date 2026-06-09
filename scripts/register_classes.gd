extends EditorSceneFormatImporter
class_name RegisterClasses

func _get_import_options(_path: String, _flags: int) -> Array:
	return []

func _import(_source_file: String, _save_path: String, _options: Dictionary, _platform_variants: Array, _gen_files: Array) -> int:
	return OK
