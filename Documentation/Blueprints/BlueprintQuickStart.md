# 蓝图快速创建指南

> 文件：[BlueprintQuickStart.md
> 本指南列出了在UE编辑器中快速创建核心蓝图的步骤参考

---

## 第1步：核心蓝图创建顺序 (在编辑器中依次创建以下蓝图：

### 1. BP_GameInstance (父类: UOldApartmentGameInstance
2. BP_GameMode (父类: AOldApartmentMysteryGameMode
3. BP_PlayerController (父类: AOldApartmentPlayerController
4. BP_PlayerCharacter (父类: BP_PlayerCharacter (父类: AOldApartmentPlayerCharacter
5. BP_GameState (父类: AGameStateBase
6. BP_HUD (父类: AHUD
7. BP_PlayerState (父类: APlayerState

---

## 第2步：游戏内容  2. 可交互物品基类 → → BP_Interactable_Base (父类: AOldApartmentInteractable
  2.1 BP_ClueItem (父类: BP_Interactable_Base
  2.2 BP_Door_Locked (父类: BP_Interactable_Base
  2.3 BP_Furniture (父类: BP_Interactable_Base
  2.4 BP_LightSwitch (父类: BP_Interactable_Base
  2.5 BP_RoomTrigger (父类: BP_Interactable_Base

---

##  第3步：谜题蓝图 (Blueprints/Puzzles
  3.1 BP_Puzzle_DialLock (父类: AActor
  3.2 BP_Puzzle_Keypad
  3.3 BP_Puzzle_Pattern
  3.4 BP_Puzzle_Logic

---

## 第4步：UI 蓝图 (Blueprints/UI/WBP
  4.1 WBP_MainMenu
  4.2 WBP_NewGameDialog
  4.3 WBP_ContinueMenu
  4.4 WBP_Settings
  4.5 WBP_Leaderboard
  4.6 WBP_Achievements
  4.7 WBP_MainHUD
  4.8 WBP_InteractionPrompt
  4.9 WBP_Notebook
  4.10 WBP_ExamineOverlay
  4.11 WBP_PauseMenu
  4.12 WBP_ChapterResult
  4.13 WBP_Tutorial
  4.14 WBP_AchievementToast
  4.15 WBP_SaveNotice

---

## 第5步：动画蓝图 (Blueprints/Animation
  5.1 ABP_PlayerArms
  5.2 ABP_Door

---

## 第6步：章节管理蓝图
  6.1 BP_ChapterManager
  6.2 BP_AudioDirector
  6.3 BP_EventDispatcher
  6.4 BP_ExamineViewer (3D检视Actor

---

## 7步：在关卡创建

在 Content/Maps/
  7.1 MainMenu
  7.2 Chapter00_
  7.3 Chapter01
  7.4 Chapter02 (占位
  7.5 Chapter03 (占位
  7.6 Chapter04 (占位
  7.7 Chapter05 (占位
  7.8 Rooms子关卡
  7.9 RM_Lobby
  7.10 RM_Corridor
  7.11 RM_Apt101
  7.12 RM_Apt102
  7.13 RM_Apt103
  7.14 RM_Basement

---

## 8步：
  8.1 输入输入映射 (Content/Input/IMC_Default
  8.2 IA_Move Input Asset
  8.3 Input资产：
  8.4 ：
    8.5 Enhanced Input  :
  8.6     : MappingContext 输入绑定：
    8.7 Input Action,  (   8.8 Input Binding
    8.9 Mapping  8.10 IMC_Default:
         - IA_Move    Axis2D (Vector2D
         - IA_Look    Axis2D (Vector2D
         - IA_Interact    (Digital
         - IA_Examine   Digital
         - IA_Notebook   Digital
         - IA_Inventory Digital
         - IA_Pause   Digital
         - IA_Crouch  Digital
         - IA_Sprint  Digital
         - IA_Flashlight
         - IA_Back  Digital
         - IA_UINavigate (Digital)
    8.11 Modifiers:
         IA_Look    Swizzle Input   数据资产 (

---

##  9.  9.1  在 Data Assets:
         DA_Chapter00 (教程序章
         DA_Chapter01  (第一章
         DA_Chapter02  (第二章(占位
         DA_Chapter03
         DA_Chapter04
         DA_ClueDatabase (全部线索
         DT_ClueRelations  (线索关联表
         DT_AchievementDefinitions  (成就定义表
         DT_FurnitureDialogues (家具环境对白表

---

## 完成
