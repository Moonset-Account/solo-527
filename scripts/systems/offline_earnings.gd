class_name OfflineEarnings
extends Node

signal offline_earnings_calculated(amount, duration)

var earning_rate: float = 0.0
var max_offline_hours: float = 8.0
var efficiency_rate: float = 0.5

func calculate_earnings(last_save_time: int, avg_hourly_rate: float) -> Dictionary:
	var current_time = Time.get_unix_time_from_system()
	var elapsed_seconds = current_time - float(last_save_time)
	var elapsed_hours = elapsed_seconds / 3600.0
	var capped_hours = minf(elapsed_hours, max_offline_hours)
	var effective_hours = capped_hours * efficiency_rate
	var amount = int(avg_hourly_rate * effective_hours)
	if amount < 0:
		amount = 0
	var result = {
		"amount": amount,
		"duration_hours": capped_hours,
		"efficiency": efficiency_rate
	}
	offline_earnings_calculated.emit(amount, capped_hours)
	return result

func set_earning_rate(rate: float) -> void:
	earning_rate = rate

func get_earning_rate() -> float:
	return earning_rate

func update_earning_rate(recent_earnings: float, time_period: float) -> void:
	if time_period <= 0.0:
		return
	var hourly_rate = (recent_earnings / time_period) * 3600.0
	if earning_rate <= 0.0:
		earning_rate = hourly_rate
	else:
		earning_rate = (earning_rate * 0.7) + (hourly_rate * 0.3)

func format_duration(seconds: float) -> String:
	if seconds < 0.0:
		seconds = 0.0
	var hours = int(seconds / 3600.0)
	var minutes = int(fmod(seconds, 3600.0) / 60.0)
	var secs = int(fmod(seconds, 60.0))
	if hours > 0:
		return "%dh %dm %ds" % [hours, minutes, secs]
	elif minutes > 0:
		return "%dm %ds" % [minutes, secs]
	else:
		return "%ds" % secs

func format_earnings(amount: int) -> String:
	if amount >= 1000000:
		return "%.1fM" % (float(amount) / 1000000.0)
	elif amount >= 1000:
		return "%.1fK" % (float(amount) / 1000.0)
	else:
		return str(amount)
