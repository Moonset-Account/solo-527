using System;
using System.Collections.Generic;
using UnityEngine;

namespace DecorMatch3.Data
{
    public class LevelManager : DecorMatch3.Core.Singleton<LevelManager>
    {
        private Dictionary<int, LevelData> _levels = new Dictionary<int, LevelData>();
        private Dictionary<int, OrderData> _orders = new Dictionary<int, OrderData>();
        private Dictionary<int, CustomerData> _customers = new Dictionary<int, CustomerData>();
        private Dictionary<RoomType, RoomData> _rooms = new Dictionary<RoomType, RoomData>();
        private Dictionary<string, ColorOption> _colorOptions = new Dictionary<string, ColorOption>();
        private Dictionary<string, FurnitureItem> _furnitureItems = new Dictionary<string, FurnitureItem>();

        public LevelData CurrentLevel { get; private set; }
        public OrderData CurrentOrder { get; private set; }
        public Match3Stats CurrentMatch3Stats { get; private set; } = new Match3Stats();

        public event Action<LevelData> OnLevelStarted;
        public event Action<OrderData> OnOrderStarted;
        public event Action OnDataLoaded;

        protected override void Awake()
        {
            base.Awake();
            LoadAllData();
        }

        public void LoadAllData()
        {
            LoadLevels();
            LoadCustomers();
            LoadRooms();
            LoadColorOptions();
            LoadFurnitureItems();
            LoadOrders();
            OnDataLoaded?.Invoke();
        }

        private void LoadLevels()
        {
            _levels.Clear();
            TextAsset[] levelFiles = Resources.LoadAll<TextAsset>("LevelData");
            foreach (TextAsset file in levelFiles)
            {
                try
                {
                    LevelData level = JsonUtility.FromJson<LevelData>(file.text);
                    if (level != null && !_levels.ContainsKey(level.LevelId))
                    {
                        _levels[level.LevelId] = level;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"[LevelManager] Failed to parse level data {file.name}: {e.Message}");
                }
            }

            if (_levels.Count == 0)
            {
                CreateDefaultLevels();
            }
        }

        private void CreateDefaultLevels()
        {
            Debug.Log("[LevelManager] Creating default levels...");

            for (int i = 1; i <= 10; i++)
            {
                LevelData level = new LevelData
                {
                    LevelId = i,
                    LevelName = $"关卡 {i}",
                    Description = GetLevelDescription(i),
                    BoardWidth = 8,
                    BoardHeight = 8,
                    MovesLimit = Mathf.Max(20, 35 - i),
                    TargetScore = 3000 + i * 500,
                    DifficultyRating = Mathf.Clamp((i + 1) / 2, 1, 5),
                    CoinReward = 50 + i * 20,
                    XpReward = 30 + i * 10,
                    AvailableGems = GetAvailableGems(i),
                    Objectives = GetLevelObjectives(i),
                    MaterialRewards = GetMaterialRewards(i)
                };

                _levels[i] = level;
            }
        }

        private string GetLevelDescription(int levelId)
        {
            switch (levelId)
            {
                case 1: return "消除红色和蓝色宝石，收集装修材料！";
                case 2: return "更多挑战等着你，加油收集材料吧！";
                default: return $"挑战关卡 {levelId}，获得丰厚奖励！";
            }
        }

        private List<GemType> GetAvailableGems(int levelId)
        {
            List<GemType> gems = new List<GemType> { GemType.Red, GemType.Blue, GemType.Green, GemType.Yellow };
            if (levelId >= 3) gems.Add(GemType.Purple);
            if (levelId >= 6) gems.Add(GemType.Orange);
            return gems;
        }

        private List<LevelObjective> GetLevelObjectives(int levelId)
        {
            List<LevelObjective> objectives = new List<LevelObjective>();
            int baseCount = 10 + levelId * 2;

            objectives.Add(new LevelObjective { TargetGem = GemType.Red, RequiredCount = baseCount });
            objectives.Add(new LevelObjective { TargetGem = GemType.Blue, RequiredCount = baseCount });

            if (levelId >= 2)
            {
                objectives.Add(new LevelObjective { TargetGem = GemType.Green, RequiredCount = baseCount / 2 });
            }
            if (levelId >= 4)
            {
                objectives.Add(new LevelObjective { TargetGem = GemType.Yellow, RequiredCount = baseCount / 2 });
            }

            return objectives;
        }

        private List<MaterialReward> GetMaterialRewards(int levelId)
        {
            List<MaterialReward> rewards = new List<MaterialReward>
            {
                new MaterialReward { MaterialType = MaterialType.Paint, Amount = 5 + levelId },
                new MaterialReward { MaterialType = MaterialType.Fabric, Amount = 3 + levelId / 2 }
            };

            if (levelId >= 3)
            {
                rewards.Add(new MaterialReward { MaterialType = MaterialType.Wood, Amount = 2 + levelId / 3 });
            }
            if (levelId >= 5)
            {
                rewards.Add(new MaterialReward { MaterialType = MaterialType.Metal, Amount = 1 + levelId / 5 });
            }

            return rewards;
        }

        private void LoadCustomers()
        {
            _customers.Clear();
            TextAsset[] customerFiles = Resources.LoadAll<TextAsset>("CustomerData");
            foreach (TextAsset file in customerFiles)
            {
                try
                {
                    CustomerData customer = JsonUtility.FromJson<CustomerData>(file.text);
                    if (customer != null && !_customers.ContainsKey(customer.CustomerId))
                    {
                        _customers[customer.CustomerId] = customer;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"[LevelManager] Failed to parse customer data {file.name}: {e.Message}");
                }
            }

            if (_customers.Count == 0)
            {
                CreateDefaultCustomers();
            }
        }

        private void CreateDefaultCustomers()
        {
            _customers[1] = new CustomerData
            {
                CustomerId = 1,
                Name = "小明",
                Description = "年轻的上班族，喜欢现代简约风格",
                AvatarSpritePath = "",
                TargetRoom = RoomType.LivingRoom,
                Preferences = new CustomerPreference
                {
                    PreferredColorStyle = ColorStyle.Cool,
                    DislikedColorStyles = new List<ColorStyle> { ColorStyle.Earthy },
                    ColorImportance = 60,
                    FurnitureStyleImportance = 70,
                    MaterialQualityImportance = 50,
                    PreferredFurniture = new List<FurnitureCategory> { FurnitureCategory.Sofa, FurnitureCategory.Lamp },
                    RequiredFurniture = new List<FurnitureCategory> { FurnitureCategory.Sofa, FurnitureCategory.Table },
                    BudgetMin = 800,
                    BudgetMax = 3000
                },
                StoryDialogue = new List<string> { "最近刚搬新家，想装一个舒适的客厅！", "我喜欢冷色调，能让人放松。" },
                PositiveFeedback = new List<string> { "太棒了！这就是我想要的！", "完美，你太懂我了！" },
                NegativeFeedback = new List<string> { "这个颜色不是我喜欢的...", "感觉还差一点。" }
            };

            _customers[2] = new CustomerData
            {
                CustomerId = 2,
                Name = "李阿姨",
                Description = "退休教师，喜欢温馨典雅的风格",
                AvatarSpritePath = "",
                TargetRoom = RoomType.Bedroom,
                Preferences = new CustomerPreference
                {
                    PreferredColorStyle = ColorStyle.Warm,
                    DislikedColorStyles = new List<ColorStyle> { ColorStyle.Vibrant },
                    ColorImportance = 80,
                    FurnitureStyleImportance = 60,
                    MaterialQualityImportance = 70,
                    PreferredFurniture = new List<FurnitureCategory> { FurnitureCategory.Bed, FurnitureCategory.Cabinet },
                    RequiredFurniture = new List<FurnitureCategory> { FurnitureCategory.Bed, FurnitureCategory.Lamp },
                    BudgetMin = 1200,
                    BudgetMax = 4000
                },
                StoryDialogue = new List<string> { "年纪大了，想要一个温暖的卧室。", "材料要好一点，睡得踏实。" },
                PositiveFeedback = new List<string> { "真温馨，睡得一定很香！", "谢谢你，小姑娘/小伙子！" },
                NegativeFeedback = new List<string> { "颜色太艳了，眼睛不舒服...", "这个材料感觉不太好。" }
            };

            _customers[3] = new CustomerData
            {
                CustomerId = 3,
                Name = "小王",
                Description = "自由职业设计师，追求个性和创意",
                AvatarSpritePath = "",
                TargetRoom = RoomType.Study,
                Preferences = new CustomerPreference
                {
                    PreferredColorStyle = ColorStyle.Vibrant,
                    DislikedColorStyles = new List<ColorStyle> { ColorStyle.Neutral },
                    ColorImportance = 75,
                    FurnitureStyleImportance = 85,
                    MaterialQualityImportance = 40,
                    PreferredFurniture = new List<FurnitureCategory> { FurnitureCategory.Chair, FurnitureCategory.Lamp, FurnitureCategory.Decoration },
                    RequiredFurniture = new List<FurnitureCategory> { FurnitureCategory.Table, FurnitureCategory.Chair },
                    BudgetMin = 600,
                    BudgetMax = 2500
                },
                StoryDialogue = new List<string> { "我需要一个有灵感的工作空间！", "越有创意越好，不要太无聊。" },
                PositiveFeedback = new List<string> { "太酷了！灵感爆棚！", "这才是我想要的工作室！" },
                NegativeFeedback = new List<string> { "太单调了，没有灵魂...", "感觉像个办公室，不像工作室。" }
            };
        }

        private void LoadRooms()
        {
            _rooms.Clear();
            if (_rooms.Count == 0)
            {
                CreateDefaultRooms();
            }
        }

        private void CreateDefaultRooms()
        {
            _rooms[RoomType.LivingRoom] = new RoomData
            {
                RoomType = RoomType.LivingRoom,
                RoomName = "客厅",
                BackgroundPath = "",
                BaseWallColor = GetDefaultColor("wall_white"),
                BaseFloorColor = GetDefaultColor("floor_wood"),
                DecorationSlots = new List<DecorationSlot>
                {
                    new DecorationSlot { SlotId = "slot_sofa", SlotName = "沙发位", AcceptedCategory = FurnitureCategory.Sofa,
                        Position = new Vector3(0, 0, 0), Rotation = Vector3.zero, Scale = Vector3.one },
                    new DecorationSlot { SlotId = "slot_table", SlotName = "茶几", AcceptedCategory = FurnitureCategory.Table,
                        Position = new Vector3(0, -1, 0), Rotation = Vector3.zero, Scale = Vector3.one },
                    new DecorationSlot { SlotId = "slot_lamp", SlotName = "落地灯", AcceptedCategory = FurnitureCategory.Lamp,
                        Position = new Vector3(2, 0, 0), Rotation = Vector3.zero, Scale = Vector3.one },
                    new DecorationSlot { SlotId = "slot_rug", SlotName = "地毯", AcceptedCategory = FurnitureCategory.Rug,
                        Position = new Vector3(0, -1.5f, 0), Rotation = Vector3.zero, Scale = Vector3.one },
                    new DecorationSlot { SlotId = "slot_deco", SlotName = "装饰", AcceptedCategory = FurnitureCategory.Decoration,
                        Position = new Vector3(-2, 1, 0), Rotation = Vector3.zero, Scale = Vector3.one }
                }
            };

            _rooms[RoomType.Bedroom] = new RoomData
            {
                RoomType = RoomType.Bedroom,
                RoomName = "卧室",
                BackgroundPath = "",
                BaseWallColor = GetDefaultColor("wall_beige"),
                BaseFloorColor = GetDefaultColor("floor_carpet"),
                DecorationSlots = new List<DecorationSlot>
                {
                    new DecorationSlot { SlotId = "slot_bed", SlotName = "床", AcceptedCategory = FurnitureCategory.Bed,
                        Position = new Vector3(0, -0.5f, 0), Rotation = Vector3.zero, Scale = Vector3.one },
                    new DecorationSlot { SlotId = "slot_cabinet", SlotName = "衣柜", AcceptedCategory = FurnitureCategory.Cabinet,
                        Position = new Vector3(-2.5f, 0, 0), Rotation = Vector3.zero, Scale = Vector3.one },
                    new DecorationSlot { SlotId = "slot_lamp", SlotName = "台灯", AcceptedCategory = FurnitureCategory.Lamp,
                        Position = new Vector3(2, -0.5f, 0), Rotation = Vector3.zero, Scale = Vector3.one },
                    new DecorationSlot { SlotId = "slot_rug", SlotName = "地毯", AcceptedCategory = FurnitureCategory.Rug,
                        Position = new Vector3(0, -1.8f, 0), Rotation = Vector3.zero, Scale = Vector3.one }
                }
            };

            _rooms[RoomType.Study] = new RoomData
            {
                RoomType = RoomType.Study,
                RoomName = "书房",
                BackgroundPath = "",
                BaseWallColor = GetDefaultColor("wall_lightblue"),
                BaseFloorColor = GetDefaultColor("floor_wood_dark"),
                DecorationSlots = new List<DecorationSlot>
                {
                    new DecorationSlot { SlotId = "slot_table", SlotName = "书桌", AcceptedCategory = FurnitureCategory.Table,
                        Position = new Vector3(0, -0.5f, 0), Rotation = Vector3.zero, Scale = Vector3.one },
                    new DecorationSlot { SlotId = "slot_chair", SlotName = "椅子", AcceptedCategory = FurnitureCategory.Chair,
                        Position = new Vector3(0, -1.5f, 0), Rotation = Vector3.zero, Scale = Vector3.one },
                    new DecorationSlot { SlotId = "slot_cabinet", SlotName = "书架", AcceptedCategory = FurnitureCategory.Cabinet,
                        Position = new Vector3(-2.5f, 0.5f, 0), Rotation = Vector3.zero, Scale = Vector3.one },
                    new DecorationSlot { SlotId = "slot_lamp", SlotName = "台灯", AcceptedCategory = FurnitureCategory.Lamp,
                        Position = new Vector3(1.5f, 0, 0), Rotation = Vector3.zero, Scale = Vector3.one },
                    new DecorationSlot { SlotId = "slot_deco", SlotName = "装饰", AcceptedCategory = FurnitureCategory.Decoration,
                        Position = new Vector3(2.5f, 0.5f, 0), Rotation = Vector3.zero, Scale = Vector3.one }
                }
            };
        }

        private ColorOption GetDefaultColor(string colorId)
        {
            switch (colorId)
            {
                case "wall_white":
                    return new ColorOption { ColorId = "wall_white", ColorName = "纯白", HexColor = Color.white, Style = ColorStyle.Neutral, MaterialType = MaterialType.Paint, Cost = 50, QualityRating = 3 };
                case "wall_beige":
                    return new ColorOption { ColorId = "wall_beige", ColorName = "米色", HexColor = new Color(0.96f, 0.90f, 0.82f), Style = ColorStyle.Warm, MaterialType = MaterialType.Paint, Cost = 80, QualityRating = 4 };
                case "wall_lightblue":
                    return new ColorOption { ColorId = "wall_lightblue", ColorName = "浅蓝", HexColor = new Color(0.68f, 0.85f, 0.95f), Style = ColorStyle.Cool, MaterialType = MaterialType.Paint, Cost = 70, QualityRating = 3 };
                case "floor_wood":
                    return new ColorOption { ColorId = "floor_wood", ColorName = "原木色", HexColor = new Color(0.75f, 0.60f, 0.42f), Style = ColorStyle.Earthy, MaterialType = MaterialType.Wood, Cost = 150, QualityRating = 4 };
                case "floor_wood_dark":
                    return new ColorOption { ColorId = "floor_wood_dark", ColorName = "深胡桃色", HexColor = new Color(0.40f, 0.27f, 0.17f), Style = ColorStyle.Earthy, MaterialType = MaterialType.Wood, Cost = 200, QualityRating = 5 };
                case "floor_carpet":
                    return new ColorOption { ColorId = "floor_carpet", ColorName = "米色地毯", HexColor = new Color(0.90f, 0.85f, 0.75f), Style = ColorStyle.Neutral, MaterialType = MaterialType.Fabric, Cost = 180, QualityRating = 4 };
                default:
                    return new ColorOption { ColorId = "default", ColorName = "默认", HexColor = Color.white, Style = ColorStyle.Neutral, MaterialType = MaterialType.Paint, Cost = 0, QualityRating = 3 };
            }
        }

        private void LoadColorOptions()
        {
            _colorOptions.Clear();
            CreateDefaultColorOptions();
        }

        private void CreateDefaultColorOptions()
        {
            AddColorOption("paint_skyblue", "天空蓝", new Color(0.53f, 0.81f, 0.92f), ColorStyle.Cool, MaterialType.Paint, 80, 3);
            AddColorOption("paint_cream", "奶油色", new Color(0.99f, 0.96f, 0.86f), ColorStyle.Warm, MaterialType.Paint, 60, 3);
            AddColorOption("paint_lavender", "薰衣草紫", new Color(0.82f, 0.71f, 0.90f), ColorStyle.Pastel, MaterialType.Paint, 100, 4);
            AddColorOption("paint_mint", "薄荷绿", new Color(0.71f, 0.90f, 0.78f), ColorStyle.Cool, MaterialType.Paint, 90, 3);
            AddColorOption("paint_peach", "桃粉色", new Color(1f, 0.80f, 0.70f), ColorStyle.Pastel, MaterialType.Paint, 85, 3);
            AddColorOption("paint_gray", "高级灰", new Color(0.70f, 0.70f, 0.72f), ColorStyle.Neutral, MaterialType.Paint, 120, 5);
            AddColorOption("paint_forest", "森林绿", new Color(0.20f, 0.40f, 0.25f), ColorStyle.Earthy, MaterialType.Paint, 110, 4);
            AddColorOption("paint_sunshine", "阳光黄", new Color(0.98f, 0.85f, 0.37f), ColorStyle.Vibrant, MaterialType.Paint, 75, 3);
            AddColorOption("paint_terracotta", "赤陶色", new Color(0.80f, 0.45f, 0.30f), ColorStyle.Earthy, MaterialType.Paint, 100, 4);

            AddColorOption("fabric_velvet_blue", "丝绒蓝", new Color(0.25f, 0.38f, 0.60f), ColorStyle.Cool, MaterialType.Fabric, 200, 5);
            AddColorOption("fabric_velvet_green", "丝绒绿", new Color(0.23f, 0.47f, 0.34f), ColorStyle.Earthy, MaterialType.Fabric, 200, 5);
            AddColorOption("fabric_linen_beige", "亚麻米", new Color(0.92f, 0.88f, 0.78f), ColorStyle.Warm, MaterialType.Fabric, 150, 4);
            AddColorOption("fabric_sofa_gray", "高级灰布", new Color(0.55f, 0.55f, 0.57f), ColorStyle.Neutral, MaterialType.Fabric, 180, 4);
            AddColorOption("fabric_leather_brown", "复古棕皮", new Color(0.45f, 0.30f, 0.20f), ColorStyle.Earthy, MaterialType.Fabric, 250, 5);

            AddColorOption("wood_oak", "橡木色", new Color(0.75f, 0.60f, 0.42f), ColorStyle.Earthy, MaterialType.Wood, 200, 4);
            AddColorOption("wood_walnut", "胡桃木", new Color(0.40f, 0.27f, 0.17f), ColorStyle.Earthy, MaterialType.Wood, 280, 5);
            AddColorOption("wood_whitewash", "白蜡木", new Color(0.92f, 0.88f, 0.80f), ColorStyle.Neutral, MaterialType.Wood, 220, 4);
        }

        private void AddColorOption(string id, string name, Color color, ColorStyle style, MaterialType type, int cost, int quality)
        {
            _colorOptions[id] = new ColorOption
            {
                ColorId = id,
                ColorName = name,
                HexColor = color,
                Style = style,
                MaterialType = type,
                Cost = cost,
                QualityRating = quality
            };
        }

        private void LoadFurnitureItems()
        {
            _furnitureItems.Clear();
            CreateDefaultFurniture();
        }

        private void CreateDefaultFurniture()
        {
            AddFurniture("sofa_modern_3", "现代三人沙发", FurnitureCategory.Sofa, "", "", 800, 4, ColorStyle.Neutral, "简约现代风格三人沙发，舒适耐用。");
            AddFurniture("sofa_modern_2", "双人布艺沙发", FurnitureCategory.Sofa, "", "", 550, 3, ColorStyle.Cool, "温馨双人位，适合小空间。");
            AddFurniture("sofa_l_shape", "L型转角沙发", FurnitureCategory.Sofa, "", "", 1200, 5, ColorStyle.Warm, "宽敞转角设计，家庭聚会首选。");
            AddFurniture("sofa_chesterfield", "复古切斯特菲尔德", FurnitureCategory.Sofa, "", "", 1500, 5, ColorStyle.Earthy, "经典复古风格，品质之选。");

            AddFurniture("table_coffee_round", "圆形茶几", FurnitureCategory.Table, "", "", 250, 3, ColorStyle.Neutral, "简约圆形玻璃茶几。");
            AddFurniture("table_coffee_wood", "木质茶几", FurnitureCategory.Table, "", "", 350, 4, ColorStyle.Earthy, "天然实木材质，自然大气。");
            AddFurniture("table_desk_modern", "现代书桌", FurnitureCategory.Table, "", "", 400, 4, ColorStyle.Neutral, "人体工学设计，办公舒适。");
            AddFurniture("table_desk_white", "白色书桌", FurnitureCategory.Table, "", "", 380, 3, ColorStyle.Cool, "简约白色，明亮整洁。");

            AddFurniture("chair_ergonomic", "人体工学椅", FurnitureCategory.Chair, "", "", 500, 5, ColorStyle.Neutral, "长时间办公也不累。");
            AddFurniture("chair_wooden", "实木餐椅", FurnitureCategory.Chair, "", "", 200, 3, ColorStyle.Earthy, "简约实木设计。");
            AddFurniture("chair_accent", "单人休闲椅", FurnitureCategory.Chair, "", "", 350, 4, ColorStyle.Vibrant, "点缀空间的亮点。");

            AddFurniture("bed_queen", "1.8米双人床", FurnitureCategory.Bed, "", "", 900, 4, ColorStyle.Neutral, "标准双人尺寸，舒适安稳。");
            AddFurniture("bed_single", "1.2米单人床", FurnitureCategory.Bed, "", "", 500, 3, ColorStyle.Warm, "适合小卧室或儿童房。");
            AddFurniture("bed_storage", "储物床架", FurnitureCategory.Bed, "", "", 1100, 5, ColorStyle.Neutral, "床下大容量储物空间。");

            AddFurniture("cabinet_wardrobe", "四门衣柜", FurnitureCategory.Cabinet, "", "", 800, 4, ColorStyle.Neutral, "大容量衣物收纳。");
            AddFurniture("cabinet_bookshelf", "开放式书架", FurnitureCategory.Cabinet, "", "", 450, 3, ColorStyle.Warm, "展示藏书和装饰品。");
            AddFurniture("cabinet_tv", "电视柜组合", FurnitureCategory.Cabinet, "", "", 600, 4, ColorStyle.Neutral, "客厅影音收纳方案。");

            AddFurniture("lamp_floor_modern", "现代落地灯", FurnitureCategory.Lamp, "", "", 200, 3, ColorStyle.Neutral, "柔和漫射光，氛围营造。");
            AddFurniture("lamp_table_reading", "护眼阅读灯", FurnitureCategory.Lamp, "", "", 150, 4, ColorStyle.Cool, "三档调光，护眼舒适。");
            AddFurniture("lamp_pendant", "北欧吊灯", FurnitureCategory.Lamp, "", "", 300, 4, ColorStyle.Vibrant, "个性设计，空间点睛。");

            AddFurniture("rug_living_big", "客厅大地毯", FurnitureCategory.Rug, "", "", 400, 4, ColorStyle.Warm, "柔软舒适，脚感极佳。");
            AddFurniture("rug_bedside", "卧室床边毯", FurnitureCategory.Rug, "", "", 200, 3, ColorStyle.Pastel, "下床第一步就温暖。");

            AddFurniture("deco_painting", "抽象装饰画", FurnitureCategory.Decoration, "", "", 150, 3, ColorStyle.Vibrant, "提升空间艺术感。");
            AddFurniture("deco_plant", "绿植盆栽", FurnitureCategory.Decoration, "", "", 100, 3, ColorStyle.Earthy, "为空间注入生机。");
            AddFurniture("deco_vase", "陶瓷花瓶", FurnitureCategory.Decoration, "", "", 80, 3, ColorStyle.Pastel, "简约雅致的装饰品。");
        }

        private void AddFurniture(string id, string name, FurnitureCategory category, string prefabPath, string iconPath,
            int cost, int quality, ColorStyle style, string description)
        {
            _furnitureItems[id] = new FurnitureItem
            {
                FurnitureId = id,
                Name = name,
                Category = category,
                PrefabPath = prefabPath,
                IconPath = iconPath,
                Cost = cost,
                QualityRating = quality,
                PrimaryColorStyle = style,
                Description = description
            };
        }

        private void LoadOrders()
        {
            _orders.Clear();
            CreateDefaultOrders();
        }

        private void CreateDefaultOrders()
        {
            _orders[1] = new OrderData
            {
                OrderId = 1,
                Customer = _customers.ContainsKey(1) ? _customers[1] : null,
                TargetRoom = _rooms.ContainsKey(RoomType.LivingRoom) ? _rooms[RoomType.LivingRoom] : null,
                LinkedLevelId = 1,
                IsCompleted = false
            };

            _orders[2] = new OrderData
            {
                OrderId = 2,
                Customer = _customers.ContainsKey(2) ? _customers[2] : null,
                TargetRoom = _rooms.ContainsKey(RoomType.Bedroom) ? _rooms[RoomType.Bedroom] : null,
                LinkedLevelId = 2,
                IsCompleted = false
            };

            _orders[3] = new OrderData
            {
                OrderId = 3,
                Customer = _customers.ContainsKey(3) ? _customers[3] : null,
                TargetRoom = _rooms.ContainsKey(RoomType.Study) ? _rooms[RoomType.Study] : null,
                LinkedLevelId = 3,
                IsCompleted = false
            };
        }

        public LevelData GetLevel(int levelId)
        {
            _levels.TryGetValue(levelId, out LevelData level);
            return level;
        }

        public List<LevelData> GetAllLevels()
        {
            return new List<LevelData>(_levels.Values);
        }

        public OrderData GetOrder(int orderId)
        {
            _orders.TryGetValue(orderId, out OrderData order);
            return order;
        }

        public OrderData GetOrderForLevel(int levelId)
        {
            foreach (var order in _orders.Values)
            {
                if (order.LinkedLevelId == levelId)
                {
                    return order;
                }
            }
            return null;
        }

        public List<OrderData> GetAllOrders()
        {
            return new List<OrderData>(_orders.Values);
        }

        public CustomerData GetCustomer(int customerId)
        {
            _customers.TryGetValue(customerId, out CustomerData customer);
            return customer;
        }

        public RoomData GetRoom(RoomType roomType)
        {
            _rooms.TryGetValue(roomType, out RoomData room);
            return room;
        }

        public ColorOption GetColorOption(string colorId)
        {
            _colorOptions.TryGetValue(colorId, out ColorOption option);
            return option;
        }

        public List<ColorOption> GetColorOptionsByMaterial(MaterialType materialType)
        {
            List<ColorOption> result = new List<ColorOption>();
            foreach (var color in _colorOptions.Values)
            {
                if (color.MaterialType == materialType)
                {
                    result.Add(color);
                }
            }
            return result;
        }

        public List<ColorOption> GetAllColorOptions()
        {
            return new List<ColorOption>(_colorOptions.Values);
        }

        public FurnitureItem GetFurnitureItem(string furnitureId)
        {
            _furnitureItems.TryGetValue(furnitureId, out FurnitureItem item);
            return item;
        }

        public List<FurnitureItem> GetFurnitureByCategory(FurnitureCategory category)
        {
            List<FurnitureItem> result = new List<FurnitureItem>();
            foreach (var item in _furnitureItems.Values)
            {
                if (item.Category == category)
                {
                    result.Add(item);
                }
            }
            return result;
        }

        public List<FurnitureItem> GetAllFurniture()
        {
            return new List<FurnitureItem>(_furnitureItems.Values);
        }

        public bool StartLevel(int levelId)
        {
            LevelData level = GetLevel(levelId);
            if (level == null)
            {
                Debug.LogError($"[LevelManager] Level {levelId} not found!");
                return false;
            }

            CurrentLevel = level;
            CurrentMatch3Stats = new Match3Stats();

            foreach (var obj in level.Objectives)
            {
                obj.CurrentCount = 0;
            }

            OnLevelStarted?.Invoke(level);
            DecorMatch3.Core.EventBus.Publish(new LevelStartedEvent { LevelData = level });
            return true;
        }

        public bool StartOrder(int orderId)
        {
            OrderData order = GetOrder(orderId);
            if (order == null)
            {
                Debug.LogError($"[LevelManager] Order {orderId} not found!");
                return false;
            }

            CurrentOrder = order;
            OnOrderStarted?.Invoke(order);
            DecorMatch3.Core.EventBus.Publish(new OrderStartedEvent { OrderData = order });
            return true;
        }

        public void UpdateObjectiveProgress(GemType gemType, int count)
        {
            if (CurrentLevel == null) return;

            foreach (var obj in CurrentLevel.Objectives)
            {
                if (obj.TargetGem == gemType)
                {
                    obj.CurrentCount = Mathf.Min(obj.CurrentCount + count, obj.RequiredCount);
                }
            }
        }

        public bool AreAllObjectivesComplete()
        {
            if (CurrentLevel == null) return false;

            foreach (var obj in CurrentLevel.Objectives)
            {
                if (obj.CurrentCount < obj.RequiredCount)
                {
                    return false;
                }
            }
            return true;
        }

        public void CompleteCurrentLevel()
        {
            if (CurrentLevel == null) return;

            var saveManager = DecorMatch3.Data.SaveManager.Instance;
            saveManager.CompleteLevel(CurrentLevel.LevelId);
            saveManager.AddCoins(CurrentLevel.CoinReward);
            saveManager.AddXP(CurrentLevel.XpReward);

            foreach (var reward in CurrentLevel.MaterialRewards)
            {
                saveManager.AddMaterial(reward.MaterialType, reward.Amount);
            }

            saveManager.SaveGame();
        }
    }

    public struct LevelStartedEvent
    {
        public LevelData LevelData;
    }

    public struct OrderStartedEvent
    {
        public OrderData OrderData;
    }

    public struct LevelCompletedEvent
    {
        public LevelData LevelData;
        public int FinalScore;
        public int StarsEarned;
    }

    public struct LevelFailedEvent
    {
        public LevelData LevelData;
        public int FinalScore;
        public string Reason;
    }
}
