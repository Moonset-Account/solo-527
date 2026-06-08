class_name BottleneckDetector
extends Node

signal bottleneck_found(position, severity)
signal bottleneck_cleared(position)

class BottleneckInfo:
	var position: Vector2i
	var machine_type: String
	var queue_length: int
	var avg_wait_time: float
	var severity: float

	func _init(p: Vector2i = Vector2i.ZERO, mtype: String = "", q: int = 0, wait: float = 0.0, sev: float = 0.0) -> void:
		position = p
		machine_type = mtype
		queue_length = q
		avg_wait_time = wait
		severity = sev

var bottlenecks: Dictionary = {}
var scan_interval: float = 3.0
var scan_timer: float = 0.0
var is_enabled: bool = true

func _process(delta: float) -> void:
	if not is_enabled:
		return
	scan_timer += delta
	if scan_timer >= scan_interval:
		scan_timer = 0.0

func update(grid: FactoryGrid) -> void:
	if not is_enabled or grid == null:
		return
	scan_for_bottlenecks(grid)

func scan_for_bottlenecks(grid: FactoryGrid) -> void:
	if not is_enabled or grid == null:
		return
	var new_bottlenecks: Dictionary = {}
	var machines := grid.get_all_machines()
	for machine in machines:
		var queue_length := machine.get_queue_length()
		var processing_time := machine.get_processing_time()
		var machine_type := machine.machine_type
		var pos := machine.grid_position
		var severity := calculate_severity(queue_length, processing_time, 1.0)
		if severity > 0.3:
			var info = BottleneckInfo.new(pos, machine_type, queue_length, processing_time, severity)
			new_bottlenecks[pos] = info
			if not bottlenecks.has(pos):
				bottleneck_found.emit(pos, severity)
	for pos in bottlenecks:
		if not new_bottlenecks.has(pos):
			bottleneck_cleared.emit(pos)
	bottlenecks = new_bottlenecks

func calculate_severity(queue_length: int, processing_time: float, avg_throughput: float) -> float:
	var queue_severity = float(queue_length) / 5.0
	var time_severity = processing_time / 5.0
	var throughput_severity = 0.0
	if avg_throughput > 0.0:
		throughput_severity = 1.0 - minf(avg_throughput / 2.0, 1.0)
	else:
		throughput_severity = 1.0
	var severity = (queue_severity * 0.5 + time_severity * 0.3 + throughput_severity * 0.2)
	return clampf(severity, 0.0, 1.0)

func get_bottlenecks() -> Array[BottleneckInfo]:
	var result: Array[BottleneckInfo] = []
	result.assign(bottlenecks.values())
	return result

func get_worst_bottleneck() -> BottleneckInfo:
	var worst: BottleneckInfo = null
	var worst_severity := 0.0
	for info in bottlenecks.values():
		if info.severity > worst_severity:
			worst_severity = info.severity
			worst = info
	return worst

func get_suggestion(bottleneck: BottleneckInfo) -> String:
	if bottleneck == null:
		return ""
	match bottleneck.machine_type:
		"conveyor":
			return "Add another conveyor to reduce queue buildup"
		"cutter":
			return "Upgrade the cutter for faster processing"
		"assembler":
			if bottleneck.queue_length > 3:
				return "Add another assembler to share the load"
			else:
				return "Upgrade assembler for faster processing"
		"painter":
			return "Upgrade the painter to speed up painting"
		"packer":
			return "Upgrade packer or add another one"
		_:
			if bottleneck.severity > 0.7:
				return "Upgrade this machine immediately"
			else:
				return "Monitor this area for slowdowns"

func clear_bottleneck(pos: Vector2i) -> void:
	if bottlenecks.has(pos):
		bottlenecks.erase(pos)
		bottleneck_cleared.emit(pos)

func reset() -> void:
	bottlenecks.clear()
	scan_timer = 0.0
