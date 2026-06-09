using System.Collections.Generic;
using UnityEngine;
using DecorMatch3.Match3;
using DecorMatch3.Decoration;
using DecorMatch3.Progression;

namespace DecorMatch3.Data
{
    public class DataManager : MonoBehaviour
    {
        [SerializeField] private List<LevelData> _levelDataList = new List<LevelData>();
        [SerializeField] private List<MaterialData> _materialDataList = new List<MaterialData>();
        [SerializeField] private List<CustomerProfile> _customerProfiles = new List<CustomerProfile>();
        [SerializeField] private List<FurnitureItem> _furnitureItems = new List<FurnitureItem>();
        [SerializeField] private List<ColorPalette> _colorPalettes = new List<ColorPalette>();
        [SerializeField] private List<DecorationOrder> _decorationOrders = new List<DecorationOrder>();
        [SerializeField] private List<AchievementData> _achievementDataList = new List<AchievementData>();
        [SerializeField] private List<DailyChallengeData> _dailyChallengeDataList = new List<DailyChallengeData>();

        public IReadOnlyList<LevelData> Levels => _levelDataList;
        public IReadOnlyList<MaterialData> Materials => _materialDataList;
        public IReadOnlyList<CustomerProfile> Customers => _customerProfiles;
        public IReadOnlyList<FurnitureItem> Furniture => _furnitureItems;
        public IReadOnlyList<ColorPalette> Palettes => _colorPalettes;
        public IReadOnlyList<DecorationOrder> Orders => _decorationOrders;
        public IReadOnlyList<AchievementData> Achievements => _achievementDataList;
        public IReadOnlyList<DailyChallengeData> DailyChallenges => _dailyChallengeDataList;

        private static DataManager _instance;
        public static DataManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    GameObject go = new GameObject("DataManager");
                    _instance = go.AddComponent<DataManager>();
                    DontDestroyOnLoad(go);
                    _instance.InitializeWithDefaultData();
                }
                return _instance;
            }
        }

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }
            _instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void InitializeWithDefaultData()
        {
            if (_levelDataList.Count == 0) GenerateDefaultLevels();
            if (_materialDataList.Count == 0) GenerateDefaultMaterials();
            if (_customerProfiles.Count == 0) GenerateDefaultCustomers();
            if (_furnitureItems.Count == 0) GenerateDefaultFurniture();
            if (_colorPalettes.Count == 0) GenerateDefaultPalettes();
            if (_decorationOrders.Count == 0) GenerateDefaultOrders();
            if (_achievementDataList.Count == 0) GenerateDefaultAchievements();
            if (_dailyChallengeDataList.Count == 0) GenerateDefaultDailyChallenges();
        }

        public LevelData GetLevelById(int id)
        {
            return _levelDataList.Find(l => l.LevelId == id);
        }

        public MaterialData GetMaterialById(int id)
        {
            return _materialDataList.Find(m => m.MaterialId == id);
        }

        public CustomerProfile GetCustomerById(string id)
        {
            return _customerProfiles.Find(c => c.CustomerId == id);
        }

        public FurnitureItem GetFurnitureById(int id)
        {
            return _furnitureItems.Find(f => f.FurnitureId == id);
        }

        public ColorPalette GetPaletteById(int id)
        {
            return _colorPalettes.Find(p => p.PaletteId == id);
        }

        public DecorationOrder GetOrderById(int id)
        {
            return _decorationOrders.Find(o => o.OrderId == id);
        }

        public AchievementData GetAchievementById(string id)
        {
            return _achievementDataList.Find(a => a.AchievementId == id);
        }

        private void GenerateDefaultLevels()
        {
            LevelData level1 = ScriptableObject.CreateInstance<LevelData>();
            level1.name = "Level_1";
            level1.LevelId = 1;
            level1.LevelName = "初学者的第一步";
            level1.Description = "收集足够的基础颜料，完成第一个装修订单！";
            level1.BoardWidth = 6;
            level1.BoardHeight = 6;
            level1.LimitType = LevelLimitType.Moves;
            level1.MaxMoves = 25;
            level1.OneStarScore = 500;
            level1.TwoStarScore = 1200;
            level1.ThreeStarScore = 2000;
            level1.AvailableTileTypes = new List<TileType>
            {
                TileType.PaintRed, TileType.PaintBlue, TileType.PaintYellow,
                TileType.PaintGreen, TileType.PaintPurple
            };
            level1.CollectionTargets = new List<MaterialRequirement>
            {
                new MaterialRequirement(TileType.PaintRed, 8),
                new MaterialRequirement(TileType.PaintBlue, 8),
                new MaterialRequirement(TileType.PaintYellow, 5)
            };
            level1.BaseCoinsReward = 30;
            level1.PerStarCoinBonus = 20;
            _levelDataList.Add(level1);

            LevelData level2 = ScriptableObject.CreateInstance<LevelData>();
            level2.name = "Level_2";
            level2.LevelId = 2;
            level2.LevelName = "木材与布料";
            level2.Description = "收集木材料和布料，给客厅准备家具！";
            level2.BoardWidth = 7;
            level2.BoardHeight = 7;
            level2.LimitType = LevelLimitType.Moves;
            level2.MaxMoves = 30;
            level2.OneStarScore = 800;
            level2.TwoStarScore = 1800;
            level2.ThreeStarScore = 3000;
            level2.AvailableTileTypes = new List<TileType>
            {
                TileType.PaintRed, TileType.PaintBlue, TileType.PaintYellow,
                TileType.PaintGreen, TileType.PaintPurple, TileType.PaintOrange,
                TileType.WoodLight, TileType.Fabric
            };
            level2.CollectionTargets = new List<MaterialRequirement>
            {
                new MaterialRequirement(TileType.WoodLight, 12),
                new MaterialRequirement(TileType.Fabric, 10),
                new MaterialRequirement(TileType.PaintGreen, 6)
            };
            level2.BaseCoinsReward = 50;
            level2.PerStarCoinBonus = 25;
            _levelDataList.Add(level2);

            LevelData level3 = ScriptableObject.CreateInstance<LevelData>();
            level3.name = "Level_3";
            level3.LevelId = 3;
            level3.LevelName = "金属与瓷砖";
            level3.Description = "厨房装修需要更多的硬质材料！";
            level3.BoardWidth = 8;
            level3.BoardHeight = 8;
            level3.LimitType = LevelLimitType.Time;
            level3.TimeLimitSeconds = 90f;
            level3.OneStarScore = 1500;
            level3.TwoStarScore = 3000;
            level3.ThreeStarScore = 5000;
            level3.AvailableTileTypes = new List<TileType>
            {
                TileType.PaintBlue, TileType.PaintYellow, TileType.PaintGreen,
                TileType.PaintOrange, TileType.WoodDark, TileType.Metal,
                TileType.Tile
            };
            level3.CollectionTargets = new List<MaterialRequirement>
            {
                new MaterialRequirement(TileType.Metal, 15),
                new MaterialRequirement(TileType.Tile, 18),
                new MaterialRequirement(TileType.WoodDark, 10)
            };
            level3.BaseCoinsReward = 80;
            level3.PerStarCoinBonus = 35;
            level3.GemReward = 2;
            _levelDataList.Add(level3);

            LevelData level4 = ScriptableObject.CreateInstance<LevelData>();
            level4.name = "Level_4";
            level4.LevelId = 4;
            level4.LevelName = "壁纸大作战";
            level4.Description = "给卧室换上温馨的壁纸！";
            level4.BoardWidth = 8;
            level4.BoardHeight = 8;
            level4.LimitType = LevelLimitType.Moves;
            level4.MaxMoves = 28;
            level4.OneStarScore = 2000;
            level4.TwoStarScore = 4000;
            level4.ThreeStarScore = 6500;
            level4.AvailableTileTypes = new List<TileType>
            {
                TileType.PaintRed, TileType.PaintBlue, TileType.PaintPurple,
                TileType.Wallpaper, TileType.Fabric, TileType.WoodLight
            };
            level4.CollectionTargets = new List<MaterialRequirement>
            {
                new MaterialRequirement(TileType.Wallpaper, 20),
                new MaterialRequirement(TileType.Fabric, 12),
                new MaterialRequirement(TileType.PaintPurple, 10)
            };
            level4.BaseCoinsReward = 100;
            level4.PerStarCoinBonus = 40;
            level4.GemReward = 3;
            _levelDataList.Add(level4);

            LevelData level5 = ScriptableObject.CreateInstance<LevelData>();
            level5.name = "Level_5";
            level5.LevelId = 5;
            level5.LevelName = "豪华大挑战";
            level5.Description = "综合考验：收集所有材料完成豪华订单！";
            level5.BoardWidth = 9;
            level5.BoardHeight = 9;
            level5.LimitType = LevelLimitType.Moves;
            level5.MaxMoves = 40;
            level5.OneStarScore = 3500;
            level5.TwoStarScore = 6000;
            level5.ThreeStarScore = 10000;
            level5.AvailableTileTypes = new List<TileType>
            {
                TileType.PaintRed, TileType.PaintBlue, TileType.PaintYellow,
                TileType.PaintGreen, TileType.PaintPurple, TileType.PaintOrange,
                TileType.WoodLight, TileType.WoodDark, TileType.Fabric,
                TileType.Metal, TileType.Tile, TileType.Wallpaper
            };
            level5.CollectionTargets = new List<MaterialRequirement>
            {
                new MaterialRequirement(TileType.WoodLight, 15),
                new MaterialRequirement(TileType.Metal, 12),
                new MaterialRequirement(TileType.Fabric, 10),
                new MaterialRequirement(TileType.PaintPurple, 8)
            };
            level5.BaseCoinsReward = 150;
            level5.PerStarCoinBonus = 60;
            level5.GemReward = 5;
            _levelDataList.Add(level5);
        }

        private void GenerateDefaultMaterials()
        {
            _materialDataList.Add(CreateMaterial(1, "红色颜料", "鲜艳的红色涂料",
                Match3.MaterialCategory.Paint, new Color(0.9f, 0.3f, 0.3f), TileType.PaintRed));
            _materialDataList.Add(CreateMaterial(2, "蓝色颜料", "宁静的蓝色涂料",
                Match3.MaterialCategory.Paint, new Color(0.3f, 0.5f, 0.9f), TileType.PaintBlue));
            _materialDataList.Add(CreateMaterial(3, "黄色颜料", "明亮的黄色涂料",
                Match3.MaterialCategory.Paint, new Color(0.95f, 0.85f, 0.3f), TileType.PaintYellow));
            _materialDataList.Add(CreateMaterial(4, "绿色颜料", "清新的绿色涂料",
                Match3.MaterialCategory.Paint, new Color(0.3f, 0.8f, 0.4f), TileType.PaintGreen));
            _materialDataList.Add(CreateMaterial(5, "紫色颜料", "优雅的紫色涂料",
                Match3.MaterialCategory.Paint, new Color(0.7f, 0.4f, 0.85f), TileType.PaintPurple));
            _materialDataList.Add(CreateMaterial(6, "橙色颜料", "温暖的橙色涂料",
                Match3.MaterialCategory.Paint, new Color(0.95f, 0.6f, 0.2f), TileType.PaintOrange));

            _materialDataList.Add(CreateMaterial(10, "浅色木材", "清新自然的浅色木料",
                Match3.MaterialCategory.Wood, new Color(0.85f, 0.7f, 0.5f), TileType.WoodLight));
            _materialDataList.Add(CreateMaterial(11, "深色木材", "沉稳大气的深色木料",
                Match3.MaterialCategory.Wood, new Color(0.55f, 0.35f, 0.2f), TileType.WoodDark));
            _materialDataList.Add(CreateMaterial(12, "高级布料", "柔软舒适的织物料",
                Match3.MaterialCategory.Fabric, new Color(0.8f, 0.75f, 0.65f), TileType.Fabric));
            _materialDataList.Add(CreateMaterial(13, "金属材料", "坚固耐用的金属件",
                Match3.MaterialCategory.Metal, new Color(0.7f, 0.72f, 0.75f), TileType.Metal));
            _materialDataList.Add(CreateMaterial(14, "瓷砖", "光滑易清洁的瓷砖",
                Match3.MaterialCategory.Tile, new Color(0.95f, 0.95f, 0.92f), TileType.Tile));
            _materialDataList.Add(CreateMaterial(15, "壁纸", "精美图案的墙面壁纸",
                Match3.MaterialCategory.Wallpaper, new Color(0.95f, 0.88f, 0.82f), TileType.Wallpaper));
        }

        private MaterialData CreateMaterial(int id, string name, string desc,
            Match3.MaterialCategory category, Color color, TileType sourceType)
        {
            MaterialData mat = ScriptableObject.CreateInstance<MaterialData>();
            mat.name = $"Material_{id}";
            mat.MaterialId = id;
            mat.MaterialName = name;
            mat.Description = desc;
            mat.Category = category;
            mat.SourceTileType = sourceType;
            mat.MaterialColor = color;
            mat.RarityLevel = 1;
            mat.UsedForWalls = category == Match3.MaterialCategory.Paint || category == Match3.MaterialCategory.Wallpaper;
            mat.UsedForFloors = category == Match3.MaterialCategory.Tile || category == Match3.MaterialCategory.Wood;
            mat.UsedForFurniture = true;
            mat.UsedForDecorations = true;
            mat.StyleTags = new[] { DecorationStyle.Modern, DecorationStyle.Minimalist };
            return mat;
        }

        private void GenerateDefaultCustomers()
        {
            CustomerProfile c1 = ScriptableObject.CreateInstance<CustomerProfile>();
            c1.name = "Customer_Lily";
            c1.CustomerId = "CUSTOMER_001";
            c1.CustomerName = "莉莉";
            c1.Age = 26;
            c1.Occupation = "设计师";
            c1.Bio = "追求时尚的年轻设计师，喜欢有创意的设计。";
            c1.MinBudget = 500;
            c1.MaxBudget = 1500;
            c1.Personality = CustomerPersonality.Creative;

            c1.StylePreferences = new List<StylePreference>
            {
                new StylePreference { Style = DecorationStyle.Modern, Weight = 85 },
                new StylePreference { Style = DecorationStyle.Minimalist, Weight = 75 },
                new StylePreference { Style = DecorationStyle.Scandinavian, Weight = 70 },
                new StylePreference { Style = DecorationStyle.Classic, Weight = 30 },
                new StylePreference { Style = DecorationStyle.Industrial, Weight = 50 }
            };

            c1.ColorPreferences = new List<ColorPreference>
            {
                new ColorPreference { Color = new Color(0.95f, 0.9f, 0.85f), Weight = 85 },
                new ColorPreference { Color = new Color(0.7f, 0.85f, 0.9f), Weight = 80 },
                new ColorPreference { Color = new Color(0.9f, 0.7f, 0.7f), Weight = 60 },
                new ColorPreference { Color = new Color(0.4f, 0.4f, 0.4f), Weight = 30 }
            };

            c1.MaterialPreferences = new List<MaterialPreference>
            {
                new MaterialPreference { Category = Match3.MaterialCategory.Fabric, Weight = 85 },
                new MaterialPreference { Category = Match3.MaterialCategory.Wood, Weight = 75 },
                new MaterialPreference { Category = Match3.MaterialCategory.Paint, Weight = 70 },
                new MaterialPreference { Category = Match3.MaterialCategory.Metal, Weight = 50 }
            };

            c1.FurniturePreferences = new List<FurnitureTypePreference>
            {
                new FurnitureTypePreference { FurnitureType = FurnitureType.Sofa, Weight = 90 },
                new FurnitureTypePreference { FurnitureType = FurnitureType.Lamp, Weight = 85 },
                new FurnitureTypePreference { FurnitureType = FurnitureType.Rug, Weight = 80 }
            };

            c1.GreetingLines = new[] { "嗨！我想给客厅换个新造型~", "你好呀~我最近想装修，有什么好建议吗？" };
            c1.HintLines = new[] { "我喜欢明亮、有设计感的东西！", "最好能有一些创意的小细节~" };
            c1.HappyLines = new[] { "哇！太有创意了，我超喜欢！", "这就是我想要的感觉！太棒了！" };
            c1.NeutralLines = new[] { "嗯，整体还不错。", "可以接受，谢谢。" };
            c1.DisappointedLines = new[] { "这个...感觉有点普通呢。", "和我想象的不太一样..." };

            _customerProfiles.Add(c1);

            CustomerProfile c2 = ScriptableObject.CreateInstance<CustomerProfile>();
            c2.name = "Customer_Mark";
            c2.CustomerId = "CUSTOMER_002";
            c2.CustomerName = "马克";
            c2.Age = 45;
            c2.Occupation = "企业高管";
            c2.Bio = "对品质要求极高的商务人士，追求经典和奢华。";
            c2.MinBudget = 2000;
            c2.MaxBudget = 5000;
            c2.Personality = CustomerPersonality.Demanding;

            c2.StylePreferences = new List<StylePreference>
            {
                new StylePreference { Style = DecorationStyle.Classic, Weight = 95 },
                new StylePreference { Style = DecorationStyle.Luxurious, Weight = 90 },
                new StylePreference { Style = DecorationStyle.Modern, Weight = 60 },
                new StylePreference { Style = DecorationStyle.Minimalist, Weight = 40 }
            };

            c2.ColorPreferences = new List<ColorPreference>
            {
                new ColorPreference { Color = new Color(0.5f, 0.35f, 0.2f), Weight = 90 },
                new ColorPreference { Color = new Color(0.85f, 0.75f, 0.55f), Weight = 85 },
                new ColorPreference { Color = new Color(0.25f, 0.25f, 0.3f), Weight = 80 },
                new ColorPreference { Color = new Color(1f, 1f, 1f), Weight = 60 }
            };

            c2.MaterialPreferences = new List<MaterialPreference>
            {
                new MaterialPreference { Category = Match3.MaterialCategory.Wood, Weight = 95 },
                new MaterialPreference { Category = Match3.MaterialCategory.Metal, Weight = 85 },
                new MaterialPreference { Category = Match3.MaterialCategory.Fabric, Weight = 70 },
                new MaterialPreference { Category = Match3.MaterialCategory.Tile, Weight = 65 }
            };

            c2.FurniturePreferences = new List<FurnitureTypePreference>
            {
                new FurnitureTypePreference { FurnitureType = FurnitureType.Cabinet, Weight = 90 },
                new FurnitureTypePreference { FurnitureType = FurnitureType.Table, Weight = 88 },
                new FurnitureTypePreference { FurnitureType = FurnitureType.Chair, Weight = 85 }
            };

            c2.SpecialRequirements = new[] { "书房的书架一定要足够大", "必须使用实木材料" };
            c2.GreetingLines = new[] { "我需要你帮我重新装修书房。", "预算不是问题，但质量必须最好。" };
            c2.HintLines = new[] { "我更喜欢经典、稳重的设计风格。", "实木和真皮是我比较偏好的材质。" };
            c2.HappyLines = new[] { "不错，达到了我的标准。", "很好，这才是我想要的品质。" };
            c2.NeutralLines = new[] { "还行吧，有些地方可以再改进。" };
            c2.DisappointedLines = new[] { "这不符合我的要求。", "品质不够，重新设计。" };

            _customerProfiles.Add(c2);

            CustomerProfile c3 = ScriptableObject.CreateInstance<CustomerProfile>();
            c3.name = "Customer_Nana";
            c3.CustomerId = "CUSTOMER_003";
            c3.CustomerName = "娜娜";
            c3.Age = 22;
            c3.Occupation = "大学生";
            c3.Bio = "刚毕业的大学生，预算有限但想让小窝变温馨。";
            c3.MinBudget = 200;
            c3.MaxBudget = 600;
            c3.Personality = CustomerPersonality.Easygoing;

            c3.StylePreferences = new List<StylePreference>
            {
                new StylePreference { Style = DecorationStyle.Cozy, Weight = 95 },
                new StylePreference { Style = DecorationStyle.Warm, Weight = 90 },
                new StylePreference { Style = DecorationStyle.Scandinavian, Weight = 75 },
                new StylePreference { Style = DecorationStyle.Fresh, Weight = 80 }
            };

            c3.ColorPreferences = new List<ColorPreference>
            {
                new ColorPreference { Color = new Color(1f, 0.95f, 0.9f), Weight = 95 },
                new ColorPreference { Color = new Color(0.95f, 0.85f, 0.75f), Weight = 90 },
                new ColorPreference { Color = new Color(0.85f, 0.9f, 1f), Weight = 75 },
                new ColorPreference { Color = new Color(1f, 0.85f, 0.85f), Weight = 85 }
            };

            c3.MaterialPreferences = new List<MaterialPreference>
            {
                new MaterialPreference { Category = Match3.MaterialCategory.Fabric, Weight = 95 },
                new MaterialPreference { Category = Match3.MaterialCategory.Wallpaper, Weight = 90 },
                new MaterialPreference { Category = Match3.MaterialCategory.Wood, Weight = 75 },
                new MaterialPreference { Category = Match3.MaterialCategory.Paint, Weight = 70 }
            };

            c3.FurniturePreferences = new List<FurnitureTypePreference>
            {
                new FurnitureTypePreference { FurnitureType = FurnitureType.Bed, Weight = 95 },
                new FurnitureTypePreference { FurnitureType = FurnitureType.Lamp, Weight = 90 },
                new FurnitureTypePreference { FurnitureType = FurnitureType.Curtain, Weight = 88 }
            };

            c3.GreetingLines = new[] { "你好~我想把我的小房间变得很温馨！", "哈哈，终于可以装修我的房间啦！" };
            c3.HintLines = new[] { "一定要软软的、暖暖的那种感觉！", "灯光最好是暖黄色的哦~" };
            c3.HappyLines = new[] { "太可爱啦！我好喜欢！谢谢你！", "哇呜！这就是梦想中的房间！" };
            c3.NeutralLines = new[] { "嗯，还可以啦~", "这个颜色我再想想。" };
            c3.DisappointedLines = new[] { "这个好像有点太成熟了...", "感觉不是很温馨呢..." };

            _customerProfiles.Add(c3);
        }

        private void GenerateDefaultFurniture()
        {
            FurnitureItem sofa1 = ScriptableObject.CreateInstance<FurnitureItem>();
            sofa1.name = "Furniture_ModernSofa";
            sofa1.FurnitureId = 1;
            sofa1.FurnitureName = "现代简约沙发";
            sofa1.Type = FurnitureType.Sofa;
            sofa1.PrimaryColor = new Color(0.6f, 0.75f, 0.85f);
            sofa1.SecondaryColor = new Color(0.9f, 0.9f, 0.9f);
            sofa1.PrimaryMaterial = Match3.MaterialCategory.Fabric;
            sofa1.SecondaryMaterial = Match3.MaterialCategory.Wood;
            sofa1.StyleTags = new[] { DecorationStyle.Modern, DecorationStyle.Minimalist };
            sofa1.Cost = 200;
            sofa1.ComfortRating = 90;
            sofa1.DurabilityRating = 75;
            sofa1.AestheticRating = 85;
            sofa1.PracticalityRating = 80;
            sofa1.Dimensions = new Vector3(2.2f, 0.85f, 0.9f);
            _furnitureItems.Add(sofa1);

            FurnitureItem bed1 = ScriptableObject.CreateInstance<FurnitureItem>();
            bed1.name = "Furniture_CozyBed";
            bed1.FurnitureId = 2;
            bed1.FurnitureName = "温暖实木床";
            bed1.Type = FurnitureType.Bed;
            bed1.PrimaryColor = new Color(0.8f, 0.65f, 0.5f);
            bed1.SecondaryColor = new Color(0.95f, 0.9f, 0.85f);
            bed1.PrimaryMaterial = Match3.MaterialCategory.Wood;
            bed1.SecondaryMaterial = Match3.MaterialCategory.Fabric;
            bed1.StyleTags = new[] { DecorationStyle.Cozy, DecorationStyle.Scandinavian, DecorationStyle.Warm };
            bed1.Cost = 300;
            bed1.ComfortRating = 95;
            bed1.DurabilityRating = 85;
            bed1.AestheticRating = 80;
            bed1.PracticalityRating = 85;
            bed1.Dimensions = new Vector3(1.8f, 0.5f, 2.0f);
            _furnitureItems.Add(bed1);

            FurnitureItem cabinet1 = ScriptableObject.CreateInstance<FurnitureItem>();
            cabinet1.name = "Furniture_ClassicCabinet";
            cabinet1.FurnitureId = 3;
            cabinet1.FurnitureName = "经典实木书柜";
            cabinet1.Type = FurnitureType.Cabinet;
            cabinet1.PrimaryColor = new Color(0.45f, 0.3f, 0.15f);
            cabinet1.SecondaryColor = new Color(0.85f, 0.7f, 0.5f);
            cabinet1.PrimaryMaterial = Match3.MaterialCategory.Wood;
            cabinet1.SecondaryMaterial = Match3.MaterialCategory.Metal;
            cabinet1.StyleTags = new[] { DecorationStyle.Classic, DecorationStyle.Luxurious };
            cabinet1.Cost = 450;
            cabinet1.ComfortRating = 50;
            cabinet1.DurabilityRating = 95;
            cabinet1.AestheticRating = 85;
            cabinet1.PracticalityRating = 95;
            cabinet1.Dimensions = new Vector3(1.5f, 2.4f, 0.4f);
            _furnitureItems.Add(cabinet1);

            FurnitureItem lamp1 = ScriptableObject.CreateInstance<FurnitureItem>();
            lamp1.name = "Furniture_WarmLamp";
            lamp1.FurnitureId = 4;
            lamp1.FurnitureName = "暖光装饰灯";
            lamp1.Type = FurnitureType.Lamp;
            lamp1.PrimaryColor = new Color(1f, 0.9f, 0.7f);
            lamp1.SecondaryColor = new Color(0.6f, 0.5f, 0.4f);
            lamp1.PrimaryMaterial = Match3.MaterialCategory.Fabric;
            lamp1.SecondaryMaterial = Match3.MaterialCategory.Metal;
            lamp1.StyleTags = new[] { DecorationStyle.Cozy, DecorationStyle.Warm, DecorationStyle.Modern };
            lamp1.Cost = 80;
            lamp1.ComfortRating = 85;
            lamp1.DurabilityRating = 70;
            lamp1.AestheticRating = 90;
            lamp1.PracticalityRating = 75;
            lamp1.Dimensions = new Vector3(0.4f, 1.6f, 0.4f);
            _furnitureItems.Add(lamp1);
        }

        private void GenerateDefaultPalettes()
        {
            ColorPalette p1 = ScriptableObject.CreateInstance<ColorPalette>();
            p1.name = "Palette_ScandinavianWhite";
            p1.PaletteId = 1;
            p1.PaletteName = "北欧纯白";
            p1.WallPrimary = new Color(0.97f, 0.96f, 0.94f);
            p1.WallAccent = new Color(0.85f, 0.9f, 0.92f);
            p1.WallMaterial = Match3.MaterialCategory.Paint;
            p1.FloorPrimary = new Color(0.85f, 0.72f, 0.55f);
            p1.FloorPattern = new Color(0.75f, 0.62f, 0.45f);
            p1.FloorMaterial = Match3.MaterialCategory.Wood;
            p1.OverallStyleTags = new[] { DecorationStyle.Scandinavian, DecorationStyle.Minimalist, DecorationStyle.Fresh };
            p1.WallStyleTags = new[] { DecorationStyle.Minimalist, DecorationStyle.Fresh };
            p1.FloorStyleTags = new[] { DecorationStyle.Scandinavian, DecorationStyle.Warm };
            p1.WallMaterialId = (int)TileType.PaintBlue;
            p1.FloorMaterialId = (int)TileType.WoodLight;
            p1.WallMaterialAmount = 8;
            p1.FloorMaterialAmount = 10;
            _colorPalettes.Add(p1);

            ColorPalette p2 = ScriptableObject.CreateInstance<ColorPalette>();
            p2.name = "Palette_ClassicBrown";
            p2.PaletteId = 2;
            p2.PaletteName = "经典棕调";
            p2.WallPrimary = new Color(0.92f, 0.88f, 0.82f);
            p2.WallAccent = new Color(0.75f, 0.65f, 0.55f);
            p2.WallMaterial = Match3.MaterialCategory.Wallpaper;
            p2.FloorPrimary = new Color(0.45f, 0.32f, 0.2f);
            p2.FloorPattern = new Color(0.35f, 0.25f, 0.15f);
            p2.FloorMaterial = Match3.MaterialCategory.Wood;
            p2.OverallStyleTags = new[] { DecorationStyle.Classic, DecorationStyle.Luxurious, DecorationStyle.Warm };
            p2.WallStyleTags = new[] { DecorationStyle.Classic, DecorationStyle.Warm };
            p2.FloorStyleTags = new[] { DecorationStyle.Classic, DecorationStyle.Luxurious };
            p2.WallMaterialId = (int)TileType.Wallpaper;
            p2.FloorMaterialId = (int)TileType.WoodDark;
            p2.WallMaterialAmount = 12;
            p2.FloorMaterialAmount = 15;
            _colorPalettes.Add(p2);

            ColorPalette p3 = ScriptableObject.CreateInstance<ColorPalette>();
            p3.name = "Palette_CozyPastel";
            p3.PaletteId = 3;
            p3.PaletteName = "温馨粉彩";
            p3.WallPrimary = new Color(1f, 0.95f, 0.92f);
            p3.WallAccent = new Color(1f, 0.85f, 0.88f);
            p3.WallMaterial = Match3.MaterialCategory.Paint;
            p3.FloorPrimary = new Color(0.9f, 0.82f, 0.7f);
            p3.FloorPattern = new Color(0.8f, 0.7f, 0.55f);
            p3.FloorMaterial = Match3.MaterialCategory.Tile;
            p3.OverallStyleTags = new[] { DecorationStyle.Cozy, DecorationStyle.Warm, DecorationStyle.Fresh };
            p3.WallStyleTags = new[] { DecorationStyle.Cozy, DecorationStyle.Fresh };
            p3.FloorStyleTags = new[] { DecorationStyle.Cozy, DecorationStyle.Warm };
            p3.WallMaterialId = (int)TileType.PaintRed;
            p3.FloorMaterialId = (int)TileType.Tile;
            p3.WallMaterialAmount = 10;
            p3.FloorMaterialAmount = 12;
            _colorPalettes.Add(p3);
        }

        private void GenerateDefaultOrders()
        {
            DecorationOrder o1 = ScriptableObject.CreateInstance<DecorationOrder>();
            o1.name = "Order_LilyLivingRoom";
            o1.OrderId = 1;
            o1.OrderTitle = "莉莉的客厅改造";
            o1.OrderDescription = "帮我把客厅变得更有设计感、更明亮！喜欢现代简约的风格。";
            o1.Category = OrderCategory.LivingRoom;
            o1.RoomSize = RoomSize.Medium;
            o1.Customer = _customerProfiles.Count > 0 ? _customerProfiles[0] : null;
            o1.PriorityLevel = 1;
            o1.BudgetMin = 500;
            o1.BudgetMax = 1500;
            o1.BaseReward = 100;
            o1.StarRewardMultiplier = 50;
            o1.RequiredLevelIds = new[] { 1 };
            o1.MinLevelRequirement = 1;

            DecorationSlot wallSlot = new DecorationSlot
            {
                SlotId = "WALL_MAIN",
                SlotName = "墙面配色",
                SlotType = DecorationSlotType.WallColor,
                Description = "选择客厅墙面的主色调",
                IsRequired = true,
                AvailableColorPalettes = _colorPalettes,
                PreferredStyles = new[] { DecorationStyle.Modern, DecorationStyle.Minimalist }
            };
            o1.RequiredSlots.Add(wallSlot);

            DecorationSlot sofaSlot = new DecorationSlot
            {
                SlotId = "SOFA_MAIN",
                SlotName = "主沙发",
                SlotType = DecorationSlotType.MainFurniture,
                Description = "客厅的核心家具",
                IsRequired = true,
                AvailableFurniture = _furnitureItems.FindAll(f => f.Type == FurnitureType.Sofa),
                PreferredStyles = new[] { DecorationStyle.Modern, DecorationStyle.Minimalist }
            };
            o1.RequiredSlots.Add(sofaSlot);

            DecorationSlot lampSlot = new DecorationSlot
            {
                SlotId = "LAMP_DECOR",
                SlotName = "装饰灯",
                SlotType = DecorationSlotType.Lighting,
                Description = "增加氛围感的灯饰",
                IsRequired = false,
                AvailableFurniture = _furnitureItems.FindAll(f => f.Type == FurnitureType.Lamp)
            };
            o1.OptionalSlots.Add(lampSlot);

            _decorationOrders.Add(o1);

            DecorationOrder o2 = ScriptableObject.CreateInstance<DecorationOrder>();
            o2.name = "Order_NanaBedroom";
            o2.OrderId = 2;
            o2.OrderTitle = "娜娜的温馨小窝";
            o2.OrderDescription = "我的小卧室想要超级超级温馨的感觉！预算有限但想花得值！";
            o2.Category = OrderCategory.Bedroom;
            o2.RoomSize = RoomSize.Small;
            o2.Customer = _customerProfiles.Count > 2 ? _customerProfiles[2] : null;
            o2.PriorityLevel = 2;
            o2.BudgetMin = 200;
            o2.BudgetMax = 600;
            o2.BaseReward = 80;
            o2.StarRewardMultiplier = 40;
            o2.RequiredLevelIds = new[] { 2, 4 };
            o2.MinLevelRequirement = 2;
            o2.UnlockOrderId = 1;

            DecorationSlot bedWallSlot = new DecorationSlot
            {
                SlotId = "WALL_BED",
                SlotName = "卧室配色",
                SlotType = DecorationSlotType.WallColor,
                Description = "卧室墙面整体色调",
                IsRequired = true,
                AvailableColorPalettes = _colorPalettes,
                PreferredStyles = new[] { DecorationStyle.Cozy, DecorationStyle.Warm }
            };
            o2.RequiredSlots.Add(bedWallSlot);

            DecorationSlot bedSlot = new DecorationSlot
            {
                SlotId = "BED_MAIN",
                SlotName = "舒适大床",
                SlotType = DecorationSlotType.MainFurniture,
                Description = "卧室最最重要的床！",
                IsRequired = true,
                AvailableFurniture = _furnitureItems.FindAll(f => f.Type == FurnitureType.Bed),
                PreferredStyles = new[] { DecorationStyle.Cozy, DecorationStyle.Warm }
            };
            o2.RequiredSlots.Add(bedSlot);

            DecorationSlot bedLampSlot = new DecorationSlot
            {
                SlotId = "LAMP_BEDSIDE",
                SlotName = "床头灯",
                SlotType = DecorationSlotType.Lighting,
                Description = "暖暖的床头灯是必备的~",
                IsRequired = false,
                AvailableFurniture = _furnitureItems.FindAll(f => f.Type == FurnitureType.Lamp),
                PreferredStyles = new[] { DecorationStyle.Cozy, DecorationStyle.Warm }
            };
            o2.OptionalSlots.Add(bedLampSlot);

            _decorationOrders.Add(o2);

            DecorationOrder o3 = ScriptableObject.CreateInstance<DecorationOrder>();
            o3.name = "Order_MarkStudy";
            o3.OrderId = 3;
            o3.OrderTitle = "马克的精英书房";
            o3.OrderDescription = "我的私人书房需要符合我的身份。品质、经典、实用，缺一不可。";
            o3.Category = OrderCategory.Study;
            o3.RoomSize = RoomSize.Large;
            o3.Customer = _customerProfiles.Count > 1 ? _customerProfiles[1] : null;
            o3.PriorityLevel = 3;
            o3.BudgetMin = 2000;
            o3.BudgetMax = 5000;
            o3.BaseReward = 300;
            o3.StarRewardMultiplier = 100;
            o3.GemReward = 10;
            o3.RequiredLevelIds = new[] { 3, 5 };
            o3.MinLevelRequirement = 3;
            o3.UnlockOrderId = 2;

            DecorationSlot studyWallSlot = new DecorationSlot
            {
                SlotId = "WALL_STUDY",
                SlotName = "书房配色",
                SlotType = DecorationSlotType.WallColor,
                Description = "书房墙面，需要沉稳大气",
                IsRequired = true,
                AvailableColorPalettes = _colorPalettes,
                PreferredStyles = new[] { DecorationStyle.Classic, DecorationStyle.Luxurious }
            };
            o3.RequiredSlots.Add(studyWallSlot);

            DecorationSlot bookshelfSlot = new DecorationSlot
            {
                SlotId = "CABINET_MAIN",
                SlotName = "实木大书柜",
                SlotType = DecorationSlotType.MainFurniture,
                Description = "必须使用实木，容量要大",
                IsRequired = true,
                AvailableFurniture = _furnitureItems.FindAll(f => f.Type == FurnitureType.Cabinet),
                PreferredStyles = new[] { DecorationStyle.Classic, DecorationStyle.Luxurious }
            };
            o3.RequiredSlots.Add(bookshelfSlot);

            DecorationSlot deskSlot = new DecorationSlot
            {
                SlotId = "TABLE_MAIN",
                SlotName = "办公桌",
                SlotType = DecorationSlotType.SecondaryFurniture,
                Description = "宽大实用的办公桌",
                IsRequired = true,
                AvailableFurniture = _furnitureItems.FindAll(f => f.Type == FurnitureType.Table),
                PreferredStyles = new[] { DecorationStyle.Classic, DecorationStyle.Luxurious }
            };
            o3.RequiredSlots.Add(deskSlot);

            _decorationOrders.Add(o3);
        }

        private void GenerateDefaultAchievements()
        {
            AchievementData a1 = ScriptableObject.CreateInstance<AchievementData>();
            a1.name = "Ach_FirstLevel";
            a1.AchievementId = "ACH_FIRST_LEVEL";
            a1.Name = "初出茅庐";
            a1.Description = "完成第一个三消关卡";
            a1.Category = AchievementCategory.Match3;
            a1.ConditionType = AchievementConditionType.LevelsCompleted;
            a1.TargetValue = 1;
            a1.CoinReward = 50;
            _achievementDataList.Add(a1);

            AchievementData a2 = ScriptableObject.CreateInstance<AchievementData>();
            a2.name = "Ach_MatchMaster";
            a2.AchievementId = "ACH_MATCH_100";
            a2.Name = "消除达人";
            a2.Description = "累计消除100组方块";
            a2.Category = AchievementCategory.Match3;
            a2.ConditionType = AchievementConditionType.TotalMatches;
            a2.TargetValue = 300;
            a2.CoinReward = 100;
            a2.Milestones = new List<AchievementMilestone>
            {
                new AchievementMilestone { Value = 100, Description = "完成三分之一", CoinBonus = 30 },
                new AchievementMilestone { Value = 200, Description = "即将达成", CoinBonus = 50 }
            };
            _achievementDataList.Add(a2);

            AchievementData a3 = ScriptableObject.CreateInstance<AchievementData>();
            a3.name = "Ach_PerfectFive";
            a3.AchievementId = "ACH_PERFECT_5";
            a3.Name = "三星大师";
            a3.Description = "累计获得5次三星评价";
            a3.Category = AchievementCategory.Match3;
            a3.ConditionType = AchievementConditionType.PerfectLevels;
            a3.TargetValue = 5;
            a3.CoinReward = 200;
            a3.GemReward = 5;
            _achievementDataList.Add(a3);

            AchievementData a4 = ScriptableObject.CreateInstance<AchievementData>();
            a4.name = "Ach_Decorator";
            a4.AchievementId = "ACH_FIRST_ORDER";
            a4.Name = "装修新手";
            a4.Description = "完成第一个装修订单";
            a4.Category = AchievementCategory.Decoration;
            a4.ConditionType = AchievementConditionType.OrdersCompleted;
            a4.TargetValue = 1;
            a4.CoinReward = 80;
            _achievementDataList.Add(a4);

            AchievementData a5 = ScriptableObject.CreateInstance<AchievementData>();
            a5.name = "Ach_HappyCustomer";
            a5.AchievementId = "ACH_FIVESTAR_ORDER";
            a5.Name = "五星好评";
            a5.Description = "获得一次客户满意度90分以上的评价";
            a5.Category = AchievementCategory.Decoration;
            a5.ConditionType = AchievementConditionType.FiveStarOrders;
            a5.TargetValue = 1;
            a5.CoinReward = 300;
            a5.GemReward = 10;
            _achievementDataList.Add(a5);

            AchievementData a6 = ScriptableObject.CreateInstance<AchievementData>();
            a6.name = "Ach_MaterialCollector";
            a6.AchievementId = "ACH_MATERIAL_1000";
            a6.Name = "材料大亨";
            a6.Description = "累计收集1000份材料";
            a6.Category = AchievementCategory.Collection;
            a6.ConditionType = AchievementConditionType.MaterialsCollected;
            a6.TargetValue = 1000;
            a6.CoinReward = 500;
            a6.GemReward = 15;
            a6.Milestones = new List<AchievementMilestone>
            {
                new AchievementMilestone { Value = 100, Description = "100份材料", CoinBonus = 50 },
                new AchievementMilestone { Value = 500, Description = "500份材料", CoinBonus = 150 }
            };
            _achievementDataList.Add(a6);

            AchievementData a7 = ScriptableObject.CreateInstance<AchievementData>();
            a7.name = "Ach_DailyHardcore";
            a7.AchievementId = "ACH_DAILY_7";
            a7.Name = "连续挑战";
            a7.Description = "累计完成7次每日挑战";
            a7.Category = AchievementCategory.Social;
            a7.ConditionType = AchievementConditionType.DailyChallengesCompleted;
            a7.TargetValue = 7;
            a7.CoinReward = 300;
            a7.GemReward = 8;
            _achievementDataList.Add(a7);
        }

        private void GenerateDefaultDailyChallenges()
        {
            DailyChallengeData d1 = ScriptableObject.CreateInstance<DailyChallengeData>();
            d1.name = "DC_ScoreTarget";
            d1.ChallengeId = "DC_SCORE_1";
            d1.Title = "分数冲刺";
            d1.Description = "在任意关卡获得3000分以上";
            d1.ChallengeType = DailyChallengeType.ScoreTarget;
            d1.TargetValue = 3000;
            d1.CoinReward = 100;
            d1.GemReward = 3;
            d1.DifficultyLevel = 2;
            _dailyChallengeDataList.Add(d1);

            DailyChallengeData d2 = ScriptableObject.CreateInstance<DailyChallengeData>();
            d2.name = "DC_MatchCount";
            d2.ChallengeId = "DC_MATCH_1";
            d2.Title = "消除狂魔";
            d2.Description = "单局游戏内消除50组方块";
            d2.ChallengeType = DailyChallengeType.MatchCount;
            d2.TargetValue = 50;
            d1.CoinReward = 120;
            d1.GemReward = 4;
            d1.DifficultyLevel = 3;
            _dailyChallengeDataList.Add(d2);

            DailyChallengeData d3 = ScriptableObject.CreateInstance<DailyChallengeData>();
            d3.name = "DC_MaterialRush";
            d3.ChallengeId = "DC_MATERIAL_1";
            d3.Title = "材料大搜集";
            d3.Description = "单局收集40份各类材料";
            d3.ChallengeType = DailyChallengeType.MaterialCollection;
            d3.TargetValue = 40;
            d3.CoinReward = 150;
            d3.GemReward = 5;
            d3.DifficultyLevel = 3;
            _dailyChallengeDataList.Add(d3);

            DailyChallengeData d4 = ScriptableObject.CreateInstance<DailyChallengeData>();
            d4.name = "DC_TimeAttack";
            d4.ChallengeId = "DC_TIME_1";
            d4.Title = "极速通关";
            d4.Description = "在60秒内完成任意关卡";
            d4.ChallengeType = DailyChallengeType.TimeAttack;
            d4.DurationSeconds = 60;
            d4.CoinReward = 180;
            d4.GemReward = 6;
            d4.DifficultyLevel = 4;
            _dailyChallengeDataList.Add(d4);
        }
    }
}
