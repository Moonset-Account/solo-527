// =============================================================================
// 主菜单关卡 - 关卡配置说明（蓝图主菜单关卡配置
// 关卡名: /Game/Maps/MainMenu.umap
// =============================================================================

1. 新建空关卡，关卡名 MainMenu
2. 世界设置 -> GameMode Override: 设为 None 或 OAMGameMode
3. 放置空的 GameMode 下有：
   - PlayerControllerClass: OAMPlayerController
4. 将 BP_MainMenu（蓝图子类 OAMGameMode)
   - BeginPlay:
      - 显示 UMG: WB_MainMenu
      - 设置输入模式 UI Only
      - 显示鼠标
      - 播放环境音（主菜单环境音

WB_MainMenu:
   - 「开始游戏」→ OAMGameInstance::StartNewGame(1)
   - 「关卡选择」→ 创建 WB_LevelSelect
   - 「设置」→ 创建 WB_Settings
   - 「继续」→ 判断是否有存档，有则显示
   - 「退出」→ UKismetSystemLibrary::QuitGame

关卡蓝图中 BeginPlay 中设置背景
