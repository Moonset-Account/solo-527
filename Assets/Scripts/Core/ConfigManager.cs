using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class ConfigManager
    {
        private static ConfigManager _instance;
        public static ConfigManager Instance
        {
            get
            {
                if (_instance == null) _instance = new ConfigManager();
                return _instance;
            }
        }

        private GameConfig _gameConfig;
        private Dictionary<string, TowerConfig> _towerConfigs;
        private Dictionary<string, EnemyConfig> _enemyConfigs;
        private Dictionary<string, LevelConfig> _levelConfigs;

        private string _configFilePath;

        public event Action OnConfigLoaded;

        public bool IsLoaded { get; private set; }

        private ConfigManager()
        {
            _towerConfigs = new Dictionary<string, TowerConfig>();
            _enemyConfigs = new Dictionary<string, EnemyConfig>();
            _levelConfigs = new Dictionary<string, LevelConfig>();
        }

        public void Initialize(string customPath = null)
        {
            _configFilePath = customPath ?? Path.Combine(Application.streamingAssetsPath, "Config/game_config.json");
            LoadConfig();
        }

        public void LoadConfig()
        {
            try
            {
                if (File.Exists(_configFilePath))
                {
                    string json = File.ReadAllText(_configFilePath);
                    _gameConfig = JsonUtility.FromJson<GameConfig>(json);
                }
                else
                {
                    Debug.LogWarning($"Config file not found at {_configFilePath}, generating default config");
                    _gameConfig = GenerateDefaultConfig();
                    SaveConfigToDisk();
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load config: {e.Message}, using default");
                _gameConfig = GenerateDefaultConfig();
            }
            BuildLookupDictionaries();
            IsLoaded = true;
            OnConfigLoaded?.Invoke();
        }

        private void BuildLookupDictionaries()
        {
            _towerConfigs.Clear();
            _enemyConfigs.Clear();
            _levelConfigs.Clear();

            foreach (var tower in _gameConfig.towers)
                _towerConfigs[tower.id] = tower;

            foreach (var enemy in _gameConfig.enemies)
                _enemyConfigs[enemy.id] = enemy;

            foreach (var level in _gameConfig.levels)
                _levelConfigs[level.levelId] = level;
        }

        public TowerConfig GetTowerConfig(string towerId)
        {
            if (_towerConfigs.TryGetValue(towerId, out var config))
                return config;
            Debug.LogError($"Tower config not found: {towerId}");
            return null;
        }

        public EnemyConfig GetEnemyConfig(string enemyId)
        {
            if (_enemyConfigs.TryGetValue(enemyId, out var config))
                return config;
            Debug.LogError($"Enemy config not found: {enemyId}");
            return null;
        }

        public LevelConfig GetLevelConfig(string levelId)
        {
            if (_levelConfigs.TryGetValue(levelId, out var config))
                return config;
            Debug.LogError($"Level config not found: {levelId}");
            return null;
        }

        public List<LevelConfig> GetAllLevels()
        {
            return _gameConfig.levels;
        }

        public List<TowerConfig> GetAllTowers()
        {
            return _gameConfig.towers;
        }

        public GlobalSettings GetGlobalSettings()
        {
            return _gameConfig.settings;
        }

        public void UpdateTowerConfig(TowerConfig config)
        {
            if (_towerConfigs.ContainsKey(config.id))
                _towerConfigs[config.id] = config;
            else
            {
                _towerConfigs.Add(config.id, config);
                _gameConfig.towers.Add(config);
            }
        }

        public void UpdateLevelConfig(LevelConfig config)
        {
            if (_levelConfigs.ContainsKey(config.levelId))
                _levelConfigs[config.levelId] = config;
            else
            {
                _levelConfigs.Add(config.levelId, config);
                _gameConfig.levels.Add(config);
            }
        }

        public void SaveConfigToDisk()
        {
            try
            {
                string json = JsonUtility.ToJson(_gameConfig, true);
                string dir = Path.GetDirectoryName(_configFilePath);
                if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                File.WriteAllText(_configFilePath, json);
                Debug.Log($"Config saved to {_configFilePath}");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save config: {e.Message}");
            }
        }

        private GameConfig GenerateDefaultConfig()
        {
            return new GameConfig
            {
                version = "1.0.0",
                settings = new GlobalSettings(),
                towers = GenerateDefaultTowers(),
                enemies = GenerateDefaultEnemies(),
                levels = GenerateDefaultLevels()
            };
        }

        private List<TowerConfig> GenerateDefaultTowers()
        {
            return new List<TowerConfig>
            {
                new TowerConfig
                {
                    id = "tea_archer",
                    towerName = "茶农弓手",
                    description = "单体攻击，平衡型防御塔",
                    type = TowerType.SingleTarget,
                    baseCost = 100,
                    levels = new List<TowerLevel>
                    {
                        new TowerLevel { level = 1, damage = 20, range = 5f, fireRate = 1f, upgradeCost = 0, specialEffectValue = 0, upgradeDescription = "基础塔" },
                        new TowerLevel { level = 2, damage = 35, range = 5.5f, fireRate = 0.9f, upgradeCost = 80, specialEffectValue = 0, upgradeDescription = "提升伤害和射速" },
                        new TowerLevel { level = 3, damage = 55, range = 6f, fireRate = 0.8f, upgradeCost = 150, specialEffectValue = 0, upgradeDescription = "大幅强化" }
                    }
                },
                new TowerConfig
                {
                    id = "rain_cannon",
                    towerName = "洒水炮",
                    description = "范围溅射伤害，适合密集敌群",
                    type = TowerType.Splash,
                    baseCost = 180,
                    levels = new List<TowerLevel>
                    {
                        new TowerLevel { level = 1, damage = 15, range = 4f, fireRate = 1.5f, upgradeCost = 0, specialEffectValue = 1.5f, upgradeDescription = "范围溅射" },
                        new TowerLevel { level = 2, damage = 28, range = 4.5f, fireRate = 1.4f, upgradeCost = 120, specialEffectValue = 1.8f, upgradeDescription = "增大溅射范围" },
                        new TowerLevel { level = 3, damage = 45, range = 5f, fireRate = 1.2f, upgradeCost = 200, specialEffectValue = 2.2f, upgradeDescription = "终极洒水炮" }
                    }
                },
                new TowerConfig
                {
                    id = "slow_fog",
                    towerName = "迷雾塔",
                    description = "减速敌人，控制型防御塔",
                    type = TowerType.Slow,
                    baseCost = 150,
                    levels = new List<TowerLevel>
                    {
                        new TowerLevel { level = 1, damage = 5, range = 4.5f, fireRate = 1.2f, upgradeCost = 0, specialEffectValue = 0.3f, upgradeDescription = "减速30%" },
                        new TowerLevel { level = 2, damage = 10, range = 5f, fireRate = 1.0f, upgradeCost = 100, specialEffectValue = 0.45f, upgradeDescription = "减速45%" },
                        new TowerLevel { level = 3, damage = 18, range = 5.5f, fireRate = 0.8f, upgradeCost = 180, specialEffectValue = 0.6f, upgradeDescription = "减速60%" }
                    }
                },
                new TowerConfig
                {
                    id = "poison_teapot",
                    towerName = "毒茶壶",
                    description = "持续毒伤，对付高血量敌人",
                    type = TowerType.Poison,
                    baseCost = 200,
                    levels = new List<TowerLevel>
                    {
                        new TowerLevel { level = 1, damage = 8, range = 5f, fireRate = 1.3f, upgradeCost = 0, specialEffectValue = 5f, upgradeDescription = "每秒5点毒伤" },
                        new TowerLevel { level = 2, damage = 14, range = 5.5f, fireRate = 1.2f, upgradeCost = 140, specialEffectValue = 10f, upgradeDescription = "毒伤翻倍" },
                        new TowerLevel { level = 3, damage = 22, range = 6f, fireRate = 1.0f, upgradeCost = 220, specialEffectValue = 18f, upgradeDescription = "剧毒" }
                    }
                },
                new TowerConfig
                {
                    id = "aef_mill",
                    towerName = "采茶风车",
                    description = "范围AOE伤害",
                    type = TowerType.AreaOfEffect,
                    baseCost = 250,
                    levels = new List<TowerLevel>
                    {
                        new TowerLevel { level = 1, damage = 25, range = 4f, fireRate = 2f, upgradeCost = 0, specialEffectValue = 3.5f, upgradeDescription = "范围AOE" },
                        new TowerLevel { level = 2, damage = 40, range = 4.5f, fireRate = 1.8f, upgradeCost = 160, specialEffectValue = 4f, upgradeDescription = "强化AOE" },
                        new TowerLevel { level = 3, damage = 65, range = 5f, fireRate = 1.5f, upgradeCost = 260, specialEffectValue = 5f, upgradeDescription = "毁灭风车" }
                    }
                }
            };
        }

        private List<EnemyConfig> GenerateDefaultEnemies()
        {
            return new List<EnemyConfig>
            {
                new EnemyConfig
                {
                    id = "tea_leopard",
                    enemyName = "茶虫",
                    description = "基础害虫，数量多",
                    type = EnemyType.Normal,
                    baseHealth = 80,
                    moveSpeed = 2f,
                    reward = 15,
                    damageToBase = 1,
                    fireResistance = 0,
                    iceResistance = 0,
                    poisonResistance = 0
                },
                new EnemyConfig
                {
                    id = "fast_mite",
                    enemyName = "茶叶螨",
                    description = "移动速度快",
                    type = EnemyType.Fast,
                    baseHealth = 50,
                    moveSpeed = 3.5f,
                    reward = 20,
                    damageToBase = 1,
                    fireResistance = 0,
                    iceResistance = 0.2f,
                    poisonResistance = 0
                },
                new EnemyConfig
                {
                    id = "tank_beetle",
                    enemyName = "甲壳虫",
                    description = "高血量坦克",
                    type = EnemyType.Tank,
                    baseHealth = 300,
                    moveSpeed = 1.2f,
                    reward = 50,
                    damageToBase = 3,
                    fireResistance = 0.3f,
                    iceResistance = 0,
                    poisonResistance = 0.2f
                },
                new EnemyConfig
                {
                    id = "flying_moth",
                    enemyName = "飞蛾",
                    description = "飞行单位，部分塔无法攻击",
                    type = EnemyType.Flying,
                    baseHealth = 100,
                    moveSpeed = 2.5f,
                    reward = 35,
                    damageToBase = 2,
                    fireResistance = 0,
                    iceResistance = 0.1f,
                    poisonResistance = 0
                },
                new EnemyConfig
                {
                    id = "boss_queen",
                    enemyName = "蚂蚁后",
                    description = "Boss单位，血厚攻高",
                    type = EnemyType.Boss,
                    baseHealth = 1500,
                    moveSpeed = 0.8f,
                    reward = 500,
                    damageToBase = 10,
                    fireResistance = 0.4f,
                    iceResistance = 0.2f,
                    poisonResistance = 0.3f
                }
            };
        }

        private List<LevelConfig> GenerateDefaultLevels()
        {
            return new List<LevelConfig>
            {
                GenerateLevel1(),
                GenerateLevel2(),
                GenerateLevel3()
            };
        }

        private LevelConfig GenerateLevel1()
        {
            var path = new List<PathPoint>
            {
                new PathPoint { x = -10, y = 0, z = 0 },
                new PathPoint { x = -5, y = 0, z = 0 },
                new PathPoint { x = -5, y = 0, z = 5 },
                new PathPoint { x = 0, y = 0, z = 5 },
                new PathPoint { x = 0, y = 0, z = -5 },
                new PathPoint { x = 5, y = 0, z = -5 },
                new PathPoint { x = 5, y = 0, z = 0 },
                new PathPoint { x = 10, y = 0, z = 0 }
            };

            var slots = new List<TowerSlot>
            {
                new TowerSlot { slotId = "s1", x = -7, y = 0, z = 3, isUnlocked = true, unlockCost = 0 },
                new TowerSlot { slotId = "s2", x = -3, y = 0, z = 7, isUnlocked = true, unlockCost = 0 },
                new TowerSlot { slotId = "s3", x = 3, y = 0, z = 3, isUnlocked = true, unlockCost = 0 },
                new TowerSlot { slotId = "s4", x = 3, y = 0, z = -8, isUnlocked = true, unlockCost = 0 },
                new TowerSlot { slotId = "s5", x = 7, y = 0, z = -3, isUnlocked = false, unlockCost = 50 },
                new TowerSlot { slotId = "s6", x = 8, y = 0, z = 3, isUnlocked = false, unlockCost = 50 }
            };

            var waves = new List<WaveConfig>
            {
                new WaveConfig
                {
                    waveNumber = 1,
                    preDelay = 5f,
                    reward = 50,
                    spawns = new List<WaveSpawn>
                    {
                        new WaveSpawn { enemyId = "tea_leopard", count = 5, interval = 1f, startDelay = 0 }
                    }
                },
                new WaveConfig
                {
                    waveNumber = 2,
                    preDelay = 8f,
                    reward = 70,
                    spawns = new List<WaveSpawn>
                    {
                        new WaveSpawn { enemyId = "tea_leopard", count = 8, interval = 0.8f, startDelay = 0 },
                        new WaveSpawn { enemyId = "fast_mite", count = 3, interval = 1f, startDelay = 5f }
                    }
                },
                new WaveConfig
                {
                    waveNumber = 3,
                    preDelay = 10f,
                    reward = 100,
                    spawns = new List<WaveSpawn>
                    {
                        new WaveSpawn { enemyId = "tea_leopard", count = 10, interval = 0.7f, startDelay = 0 },
                        new WaveSpawn { enemyId = "tank_beetle", count = 2, interval = 3f, startDelay = 4f }
                    }
                }
            };

            return new LevelConfig
            {
                levelId = "level_1",
                levelName = "第一章：茶园入门",
                difficulty = 1,
                description = "欢迎来到茶园！学习放置防御塔，保护采摘车到达仓库。",
                tutorialMessage = "点击高亮的塔位放置茶农弓手，按开始键开始第一波害虫入侵！",
                startGold = 300,
                baseHealth = 20,
                maxTimeSeconds = 0,
                pathPoints = path,
                towerSlots = slots,
                waves = waves,
                availableTowerIds = new List<string> { "tea_archer", "slow_fog", "rain_cannon" },
                weatherPatterns = new List<WeatherPattern>
                {
                    new WeatherPattern { type = WeatherType.Sunny, startAtWave = 0, durationWaves = 3, intensity = 1f }
                },
                victoryCondition = new VictoryCondition { minSurvivingBaseHealth = 1, maxFailedEnemies = 5, maxTimeSeconds = 0 },
                failedReasons = new List<FailedReasonCheck>
                {
                    new FailedReasonCheck { reason = FailedReason.BaseDestroyed, suggestion = "基地血量耗尽！尝试在早期放置更多高伤害防御塔。", priority = 1 },
                    new FailedReasonCheck { reason = FailedReason.TooManyEnemiesPassed, suggestion = "漏掉太多害虫！在转弯处增加减速塔可以减少漏怪。", priority = 2 },
                    new FailedReasonCheck { reason = FailedReason.InsufficientDPS, suggestion = "伤害输出不足！尝试升级现有塔而不是建造新塔。", priority = 3 }
                }
            };
        }

        private LevelConfig GenerateLevel2()
        {
            var path = new List<PathPoint>
            {
                new PathPoint { x = -12, y = 0, z = 0 },
                new PathPoint { x = -8, y = 0, z = -4 },
                new PathPoint { x = -4, y = 0, z = -4 },
                new PathPoint { x = -4, y = 0, z = 4 },
                new PathPoint { x = 4, y = 0, z = 4 },
                new PathPoint { x = 4, y = 0, z = -4 },
                new PathPoint { x = 8, y = 0, z = -4 },
                new PathPoint { x = 8, y = 0, z = 4 },
                new PathPoint { x = 12, y = 0, z = 4 }
            };

            var slots = new List<TowerSlot>
            {
                new TowerSlot { slotId = "s1", x = -10, y = 0, z = -7, isUnlocked = true, unlockCost = 0 },
                new TowerSlot { slotId = "s2", x = -6, y = 0, z = 0, isUnlocked = true, unlockCost = 0 },
                new TowerSlot { slotId = "s3", x = -2, y = 0, z = 7, isUnlocked = true, unlockCost = 0 },
                new TowerSlot { slotId = "s4", x = 0, y = 0, z = -7, isUnlocked = true, unlockCost = 0 },
                new TowerSlot { slotId = "s5", x = 6, y = 0, z = 0, isUnlocked = true, unlockCost = 0 },
                new TowerSlot { slotId = "s6", x = 10, y = 0, z = 7, isUnlocked = false, unlockCost = 80 },
                new TowerSlot { slotId = "s7", x = 6, y = 0, z = -7, isUnlocked = false, unlockCost = 80 }
            };

            var waves = new List<WaveConfig>
            {
                new WaveConfig
                {
                    waveNumber = 1,
                    preDelay = 5f,
                    reward = 80,
                    spawns = new List<WaveSpawn>
                    {
                        new WaveSpawn { enemyId = "tea_leopard", count = 8, interval = 0.8f, startDelay = 0 },
                        new WaveSpawn { enemyId = "fast_mite", count = 5, interval = 0.6f, startDelay = 4f }
                    }
                },
                new WaveConfig
                {
                    waveNumber = 2,
                    preDelay = 10f,
                    reward = 120,
                    spawns = new List<WaveSpawn>
                    {
                        new WaveSpawn { enemyId = "fast_mite", count = 10, interval = 0.5f, startDelay = 0 },
                        new WaveSpawn { enemyId = "flying_moth", count = 4, interval = 2f, startDelay = 3f }
                    }
                },
                new WaveConfig
                {
                    waveNumber = 3,
                    preDelay = 12f,
                    reward = 150,
                    spawns = new List<WaveSpawn>
                    {
                        new WaveSpawn { enemyId = "tea_leopard", count = 15, interval = 0.6f, startDelay = 0 },
                        new WaveSpawn { enemyId = "tank_beetle", count = 4, interval = 2.5f, startDelay = 5f },
                        new WaveSpawn { enemyId = "flying_moth", count = 3, interval = 2f, startDelay = 8f }
                    }
                },
                new WaveConfig
                {
                    waveNumber = 4,
                    preDelay = 15f,
                    reward = 250,
                    spawns = new List<WaveSpawn>
                    {
                        new WaveSpawn { enemyId = "tank_beetle", count = 6, interval = 2f, startDelay = 0 },
                        new WaveSpawn { enemyId = "fast_mite", count = 12, interval = 0.4f, startDelay = 3f },
                        new WaveSpawn { enemyId = "flying_moth", count = 6, interval = 1.5f, startDelay = 6f }
                    }
                }
            };

            return new LevelConfig
            {
                levelId = "level_2",
                levelName = "第二章：雨季考验",
                difficulty = 2,
                description = "雨季来了，雨天会影响防御塔射程。小心飞行的飞蛾！",
                tutorialMessage = "新塔类型已解锁！毒茶壶对付高血量敌人很有效。注意雨天射程降低哦。",
                startGold = 400,
                baseHealth = 25,
                maxTimeSeconds = 0,
                pathPoints = path,
                towerSlots = slots,
                waves = waves,
                availableTowerIds = new List<string> { "tea_archer", "slow_fog", "rain_cannon", "poison_teapot" },
                weatherPatterns = new List<WeatherPattern>
                {
                    new WeatherPattern { type = WeatherType.Sunny, startAtWave = 0, durationWaves = 1, intensity = 1f },
                    new WeatherPattern { type = WeatherType.Rain, startAtWave = 1, durationWaves = 2, intensity = 0.85f },
                    new WeatherPattern { type = WeatherType.Fog, startAtWave = 3, durationWaves = 1, intensity = 0.8f }
                },
                victoryCondition = new VictoryCondition { minSurvivingBaseHealth = 5, maxFailedEnemies = 8, maxTimeSeconds = 0 },
                failedReasons = new List<FailedReasonCheck>
                {
                    new FailedReasonCheck { reason = FailedReason.BaseDestroyed, suggestion = "雨季影响射程，尝试把塔建得离路更近！", priority = 1 },
                    new FailedReasonCheck { reason = FailedReason.TooManyEnemiesPassed, suggestion = "漏了飞蛾？确认你的塔能攻击飞行单位。", priority = 2 },
                    new FailedReasonCheck { reason = FailedReason.InsufficientDPS, suggestion = "雨天伤害不足！多造几个毒茶壶对付坦克虫。", priority = 3 }
                }
            };
        }

        private LevelConfig GenerateLevel3()
        {
            var path = new List<PathPoint>
            {
                new PathPoint { x = -15, y = 0, z = -5 },
                new PathPoint { x = -10, y = 0, z = -5 },
                new PathPoint { x = -10, y = 0, z = 5 },
                new PathPoint { x = -5, y = 0, z = 5 },
                new PathPoint { x = -5, y = 0, z = -5 },
                new PathPoint { x = 0, y = 0, z = -5 },
                new PathPoint { x = 0, y = 0, z = 5 },
                new PathPoint { x = 5, y = 0, z = 5 },
                new PathPoint { x = 5, y = 0, z = -5 },
                new PathPoint { x = 10, y = 0, z = -5 },
                new PathPoint { x = 10, y = 0, z = 5 },
                new PathPoint { x = 15, y = 0, z = 5 }
            };

            var slots = new List<TowerSlot>
            {
                new TowerSlot { slotId = "s1", x = -12, y = 0, z = 0, isUnlocked = true, unlockCost = 0 },
                new TowerSlot { slotId = "s2", x = -8, y = 0, z = 8, isUnlocked = true, unlockCost = 0 },
                new TowerSlot { slotId = "s3", x = -8, y = 0, z = -8, isUnlocked = true, unlockCost = 0 },
                new TowerSlot { slotId = "s4", x = -2, y = 0, z = 0, isUnlocked = true, unlockCost = 0 },
                new TowerSlot { slotId = "s5", x = -2, y = 0, z = 8, isUnlocked = true, unlockCost = 0 },
                new TowerSlot { slotId = "s6", x = 2, y = 0, z = -8, isUnlocked = false, unlockCost = 100 },
                new TowerSlot { slotId = "s7", x = 8, y = 0, z = 0, isUnlocked = false, unlockCost = 100 },
                new TowerSlot { slotId = "s8", x = 8, y = 0, z = 8, isUnlocked = false, unlockCost = 150 },
                new TowerSlot { slotId = "s9", x = 13, y = 0, z = 0, isUnlocked = false, unlockCost = 200 }
            };

            var waves = new List<WaveConfig>
            {
                new WaveConfig
                {
                    waveNumber = 1,
                    preDelay = 5f,
                    reward = 100,
                    spawns = new List<WaveSpawn>
                    {
                        new WaveSpawn { enemyId = "tea_leopard", count = 12, interval = 0.6f, startDelay = 0 },
                        new WaveSpawn { enemyId = "fast_mite", count = 8, interval = 0.5f, startDelay = 3f }
                    }
                },
                new WaveConfig
                {
                    waveNumber = 2,
                    preDelay = 12f,
                    reward = 150,
                    spawns = new List<WaveSpawn>
                    {
                        new WaveSpawn { enemyId = "fast_mite", count = 15, interval = 0.4f, startDelay = 0 },
                        new WaveSpawn { enemyId = "tank_beetle", count = 5, interval = 2f, startDelay = 4f }
                    }
                },
                new WaveConfig
                {
                    waveNumber = 3,
                    preDelay = 14f,
                    reward = 200,
                    spawns = new List<WaveSpawn>
                    {
                        new WaveSpawn { enemyId = "tank_beetle", count = 8, interval = 1.8f, startDelay = 0 },
                        new WaveSpawn { enemyId = "flying_moth", count = 8, interval = 1.2f, startDelay = 5f },
                        new WaveSpawn { enemyId = "tea_leopard", count = 20, interval = 0.4f, startDelay = 8f }
                    }
                },
                new WaveConfig
                {
                    waveNumber = 4,
                    preDelay = 18f,
                    reward = 300,
                    spawns = new List<WaveSpawn>
                    {
                        new WaveSpawn { enemyId = "flying_moth", count = 12, interval = 1f, startDelay = 0 },
                        new WaveSpawn { enemyId = "tank_beetle", count = 10, interval = 1.5f, startDelay = 3f },
                        new WaveSpawn { enemyId = "fast_mite", count = 20, interval = 0.3f, startDelay = 6f }
                    }
                },
                new WaveConfig
                {
                    waveNumber = 5,
                    preDelay = 20f,
                    reward = 600,
                    spawns = new List<WaveSpawn>
                    {
                        new WaveSpawn { enemyId = "boss_queen", count = 1, interval = 0, startDelay = 2f },
                        new WaveSpawn { enemyId = "tank_beetle", count = 6, interval = 2f, startDelay = 5f },
                        new WaveSpawn { enemyId = "tea_leopard", count = 30, interval = 0.3f, startDelay = 8f },
                        new WaveSpawn { enemyId = "flying_moth", count = 10, interval = 1f, startDelay = 12f }
                    }
                }
            };

            return new LevelConfig
            {
                levelId = "level_3",
                levelName = "第三章：蚂蚁后之战",
                difficulty = 3,
                description = "最终决战！准备好面对蚂蚁后和它的大军吧。",
                tutorialMessage = "采茶风车已解锁！Boss前记得把所有塔升到满级哦。",
                startGold = 500,
                baseHealth = 30,
                maxTimeSeconds = 0,
                pathPoints = path,
                towerSlots = slots,
                waves = waves,
                availableTowerIds = new List<string> { "tea_archer", "slow_fog", "rain_cannon", "poison_teapot", "aef_mill" },
                weatherPatterns = new List<WeatherPattern>
                {
                    new WeatherPattern { type = WeatherType.Sunny, startAtWave = 0, durationWaves = 1, intensity = 1f },
                    new WeatherPattern { type = WeatherType.Wind, startAtWave = 1, durationWaves = 1, intensity = 1.1f },
                    new WeatherPattern { type = WeatherType.Snow, startAtWave = 2, durationWaves = 2, intensity = 0.75f },
                    new WeatherPattern { type = WeatherType.Sunny, startAtWave = 4, durationWaves = 1, intensity = 1.15f }
                },
                victoryCondition = new VictoryCondition { minSurvivingBaseHealth = 10, maxFailedEnemies = 10, maxTimeSeconds = 0 },
                failedReasons = new List<FailedReasonCheck>
                {
                    new FailedReasonCheck { reason = FailedReason.BaseDestroyed, suggestion = "Boss伤害太高！在Boss波次前确保所有减速塔都已升级。", priority = 1 },
                    new FailedReasonCheck { reason = FailedReason.TooManyEnemiesPassed, suggestion = "小怪潮压力大！AOE风车和洒水炮组合可以清理密集敌群。", priority = 2 },
                    new FailedReasonCheck { reason = FailedReason.InsufficientDPS, suggestion = "打Boss太慢？毒茶壶叠毒+弓手输出是Boss最佳组合。", priority = 3 },
                    new FailedReasonCheck { reason = FailedReason.GoldDepleted, suggestion = "金币不够？尝试用更少的塔但升级更高等级。", priority = 4 }
                }
            };
        }
    }
}
