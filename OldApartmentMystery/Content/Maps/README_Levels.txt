# 关卡章节关卡)
# Chapter1 第1章 客厅 → 客厅Level: LivingRoom
# 启动关卡: LivingRoom
Grid Size 24 × 18
Walls:
  #
  外围 (0, 0, 24, 1 (四周 4 (0,0, 24, 18, 2, 24)
  客厅 / 厨房隔断墙
  # 厨房 12, 1, 1, 8 (0, 9, 0, 14

FloorZones:
  客厅 (0, 1, 12, 17 色 棕色
  厨房 (12, 1, 11, 8, 厨房黄色
  阳台 (12, 9, 11, 9 瓷砖

FurnitureTiles:  (4, 3, 5 沙发电视柜)
ItemSpawns:
  Item_EmploymentLetter 5 5 客厅
  Item_OldPhoto1 16 4 客厅
  Item_ShoppingList 20 12 厨房
  Item_FridgeMagnet 22 12 厨房
  Item_DrawerKey 18 13 厨房/电视柜
  Item_Diary 2 15 阳台

Doors:
  Door_Corridor   0, 10, 走廊 24, 10 1, 3  Chapter2, Spawn 5, 10 走廊 钥匙 Key_Hallway   「走廊门
RoomTriggers:
  Room_Living (0, 0, 11, 17) 客厅
  Room_Kitchen (12, 0, 11, 8, 厨房
  Room_Balcony (12, 9, 11, 9, 阳台
  Corridor 走廊走廊2. Chapter2 Corridor 走廊 (20 × 20)
3. Chapter3 Basement 地下室 (22 × 16)
