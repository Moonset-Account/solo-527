extends Node

func _repeat_str(s: String, n: int) -> String:
    var result: String = ""
    for i in range(max(0, n)):
        result += s
    return result

func _ready() -> void:
    name = "TestLauncher"
    print("\n\n")
    print(_repeat_str("=", 60))
    print("🏪  小镇集市经营模拟 - 启动测试套件")
    print(_repeat_str("=", 60))
    print("\n系统初始化完成，所有autoload加载成功！\n")
    
    var runner = load("res://scripts/game/TestRunner.gd").new()
    add_child(runner)
    
    await get_tree().process_frame
    await get_tree().process_frame
    
    runner.run_all_tests()
    
    await get_tree().process_frame
    
    if DataRecorder and DataRecorder.has_method("print_statistics"):
        DataRecorder.print_statistics()
    
    print("\n✅ 测试完成！按任意键退出...")
    
    await get_tree().create_timer(1.0).timeout
    get_tree().quit()
