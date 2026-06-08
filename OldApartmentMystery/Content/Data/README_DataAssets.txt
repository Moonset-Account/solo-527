# DataAsset 目录
- Items/      → 所有物品数据资产
- Notes/      → 笔记数据资产
- Puzzles/    → 锁谜题数据资产
- Chapters/   → 章节数据资产
- Levels/     → 关卡配置数据资产
- Interactables/ → 可交互物体数据资产

创建步骤：
1. 在目录 → OAMItemData 父类 → 命名约定:
   - DA_Item_EmploymentLetter     (第1章)
   - DA_Item_OldPhoto1      2. DA_Item_OldPhoto1   雇佣信
   - DA_Item_ShoppingList    (冰箱清单
   - DA_Item_FridgeMagnet      冰箱磁贴 (密码: 1991)
   - DA_Item_DrawerKey       抽屉钥匙
   - DA_Item_Diary           日记本 (锁
   - DA_Item_Calendar        日历 (密码714)
   - DA_Item_CDBox        CD盒1991
   - DA_Item_LetterBox      信件盒
   - DA_Item_Camera         旧相机
   - DA_Item_HallwayKey2       走廊钥匙
   - DA_Item_NewspaperStack     报纸堆
   - DA_Item_CaseFileClip      案件条密码781498)
   - DA_Item_OldChest       铁皮箱
   - DA_Item_MotherLetter       妈妈的信
   - DA_Item_AdmissionLetter       录取通知书
   - DA_Item_MementoBox    遗物盒

Notes: 6篇)
- DA_Note_DiaryPage1     日记1
- DA_Note_DiaryPage2     日记2
- DA_Note_DiaryPage3     日记3
- DA_Note_Letter1     信件1
- DA_Note_Letter2     信件2
- DA_Note_CaseReport     案件档案

Puzzles/: 3个谜题
- DA_Puzzle_CDBox        4位密码: {1,9,9,1,  奖励: 笔记
- DA_Puzzle_ JewelryBox      3位: {7,1,4}  → 奖励: 走廊钥匙2
- DA_Puzzle_Chest        6位: {7,8,1,4,9,8}  → 解锁EndingDoor_Ending)

Chapters/:
- DA_Chapter1   客厅 (LevelName LivingRoom)
  目标 (Objective):
  - obj_letter (CollectItem)
  - obj_photo_examine
  - obj_fridge
  - obj_calendar
  - obj_puzzle_calendar
  - obj_puzzle_calendar
  - obj_key

DA_Chapter2  走廊/女儿房
  - obj_cdplayer
  - obj_diary
  - obj_letterbox
  - obj_puzzle_calendar
  - obj_letter2
  - obj_puzzle_jewelrybox
  - obj_key2
  - obj_basement_door

DA_Chapter3  地下室
  - obj_newspaper
  - obj_casefile
  - obj_puzzle_chest
  - obj_mother_letter
  - obj_admission
  - obj_memento
  - obj_end_door
