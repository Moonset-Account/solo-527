extends Node

signal game_state_changed(new_state)
signal day_started(day_number)
signal day_ended(day_number, report)
signal phase_changed(new_phase)
signal money_changed(amount, total)
signal inventory_changed(item_id, new_count)
signal customer_served(customer, item, price)
signal stall_upgraded(stall_id, new_level)
signal level_completed(level_id, stars)
signal tutorial_step_changed(step_id)
signal input_mode_changed(mode)
signal audio_played(sound_id)

var _listeners: Dictionary = {}

func emit_event(event_name: String, data1: Variant = null, data2: Variant = null, data3: Variant = null) -> void:
    match event_name:
        "game_state_changed":
            game_state_changed.emit(data1)
        "day_started":
            day_started.emit(data1)
        "day_ended":
            day_ended.emit(data1, data2)
        "phase_changed":
            phase_changed.emit(data1)
        "money_changed":
            money_changed.emit(data1, data2)
        "inventory_changed":
            inventory_changed.emit(data1, data2)
        "customer_served":
            customer_served.emit(data1, data2, data3)
        "stall_upgraded":
            stall_upgraded.emit(data1, data2)
        "level_completed":
            level_completed.emit(data1, data2)
        "tutorial_step_changed":
            tutorial_step_changed.emit(data1)
        "input_mode_changed":
            input_mode_changed.emit(data1)
        "audio_played":
            audio_played.emit(data1)
    
    if event_name in _listeners:
        for callback in _listeners[event_name]:
            if typeof(callback) == TYPE_CALLABLE:
                if data3 != null:
                    callback.call(data1, data2, data3)
                elif data2 != null:
                    callback.call(data1, data2)
                else:
                    callback.call(data1)

func on_event(event_name: String, callback: Callable) -> void:
    if not (event_name in _listeners):
        _listeners[event_name] = []
    _listeners[event_name].append(callback)

func remove_listener(event_name: String, callback: Callable) -> void:
    if event_name in _listeners:
        _listeners[event_name].erase(callback)

func clear_all() -> void:
    _listeners.clear()
