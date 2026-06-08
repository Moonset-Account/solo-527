using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Config")]
        [SerializeField] private string _startLevelId = "level_1";
        [SerializeField] private bool _autoStartOnLoad = true;
        [SerializeField] private bool _enableTutorial = true;

        public ConfigManager Configs { get; private set; }
        public PathManager Path { get; private set; }
        public ResourceManager Resources { get; private set; }
        public EnemyManager Enemies { get; private set; }
        public TowerManager Towers { get; private set; }
        public WaveManager Waves { get; private set; }
        public WeatherSystem Weather { get; private set; }
        public TutorialManager Tutorial { get; private set; }
        public HintManager Hints { get; private set; }
        public SettlementSystem Settlement { get; private set; }

        private LevelConfig _currentLevel;
        private GameState _currentState;

        public string SelectedTowerId { get; private set; }
        public string SelectedSlotId { get; private set; }

        public LevelConfig CurrentLevel => _currentLevel;
        public GameState CurrentState => _currentState;

        public event Action<GameState> OnGameStateChanged;
        public event Action<string> OnLevelLoaded;
        public event Action<string> OnTowerSelected;
        public event Action<string> OnSlotSelected;
        public event Action<float> OnTimeScaleChanged;

        private float _timeScale = 1f;
        private bool _isPaused;
        private float _autoSaveTimer;

        public bool IsPaused => _isPaused;
        public float TimeScale => _timeScale;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            InitializeSystems();
        }

        private void InitializeSystems()
        {
            Configs = ConfigManager.Instance;
            Path = new PathManager();
            Resources = new ResourceManager();
            Enemies = new EnemyManager(Path);
            Waves = new WaveManager(Enemies);
            Weather = new WeatherSystem(Waves);
            Towers = new TowerManager(Enemies, Weather, Resources);
            Tutorial = new TutorialManager();
            Hints = new HintManager();
            Settlement = new SettlementSystem();

            SaveSystem.Instance.Initialize();
            InputManager.Instance.Initialize();
        }

        private void Start()
        {
            Configs.Initialize();
            SubscribeEvents();

            if (gameObject.GetComponent<PerformanceStats>() == null)
            {
                gameObject.AddComponent<PerformanceStats>();
            }

            FrameRateManager.Instance.Initialize(Configs.GetGlobalSettings());
            FrameRateManager.Instance.InitializeFromSave();

            if (_autoStartOnLoad)
            {
                LoadLevel(_startLevelId);
            }
        }

        private void SubscribeEvents()
        {
            Configs.OnConfigLoaded += HandleConfigLoaded;
            Enemies.OnEnemyDied += HandleEnemyDied;
            Enemies.OnEnemyReachedEnd += HandleEnemyReachedEnd;
            Resources.OnBaseDestroyed += HandleBaseDestroyed;
            Waves.OnWaveStarted += HandleWaveStarted;
            Waves.OnWaveCompleted += HandleWaveCompleted;
            Waves.OnAllWavesCompleted += HandleAllWavesCompleted;
            InputManager.Instance.OnActionPressed += HandleInputAction;
        }

        private void HandleConfigLoaded()
        {
            Debug.Log($"[Config] 加载完成: {Configs.GetAllLevels().Count} 关卡, {Configs.GetAllTowers().Count} 塔类型");
        }

        public void LoadLevel(string levelId)
        {
            LevelConfig config = Configs.GetLevelConfig(levelId);
            if (config == null)
            {
                Debug.LogError($"[Game] 加载关卡失败: {levelId}");
                return;
            }

            ResetGameplaySystems(config);
            _currentLevel = config;

            Debug.Log($"[Game] 加载关卡: {config.levelName} ({config.levelId})");
            OnLevelLoaded?.Invoke(levelId);
        }

        private void ResetGameplaySystems(LevelConfig config)
        {
            Resources.Initialize(config);
            Path.Initialize(config.pathPoints);

            var enemyIds = config.waves
                .SelectMany(w => w.spawns)
                .Select(s => s.enemyId)
                .Distinct()
                .ToList();
            var enemyConfigs = enemyIds
                .Select(id => Configs.GetEnemyConfig(id))
                .Where(e => e != null)
                .ToList();
            Enemies.SetEnemyConfigs(enemyConfigs);
            Enemies.Reset();

            var availableTowers = Configs.GetAllTowers()
                .Where(t => config.availableTowerIds.Contains(t.id))
                .ToList();
            Towers.SetTowerConfigs(availableTowers);
            Towers.SetTowerSlots(config.towerSlots);
            Towers.Reset();

            Waves.Reset();
            Weather.Initialize(config.weatherPatterns);
            Waves.Initialize(config.waves, this);
            Settlement.Initialize(this, config);

            if (_enableTutorial)
                Tutorial.Initialize(config);
            else
                Tutorial.SkipTutorial();

            Hints.Initialize(config, this);

            _currentState = GameState.Setup;
            _timeScale = 1f;
            _autoSaveTimer = 0;
            OnGameStateChanged?.Invoke(_currentState);
        }

        public void StartGameplay()
        {
            _currentState = GameState.Playing;
            OnGameStateChanged?.Invoke(_currentState);
        }

        private void Update()
        {
            InputManager.Instance.Update();

            if (_currentState == GameState.Playing || _currentState == GameState.Setup)
            {
                if (!_isPaused)
                {
                    float dt = Time.deltaTime * _timeScale;
                    float unscaledDt = Time.unscaledDeltaTime;
                    UpdateGameplay(dt, unscaledDt);
                }
            }

            UpdateAutoSave(Time.unscaledDeltaTime);
        }

        private void UpdateGameplay(float scaledDeltaTime, float unscaledDeltaTime)
        {
            Resources.Update(scaledDeltaTime);
            Enemies.Update(scaledDeltaTime);
            Towers.Update(scaledDeltaTime);
            Waves.Update(scaledDeltaTime);
            Tutorial.Update(unscaledDeltaTime);
            Hints.Update(unscaledDeltaTime);

            Weather.UpdateWeatherForWave(Waves.CurrentWaveNumber);
            Enemies.ApplyWeatherSpeedModifier(Weather.GetEnemySpeedModifier());

            CheckVictoryCondition();
            CheckFailureConditions();
        }

        private void UpdateAutoSave(float unscaledDeltaTime)
        {
            _autoSaveTimer += unscaledDeltaTime;
            var interval = Configs.GetGlobalSettings().autoSaveIntervalSeconds;
            if (_autoSaveTimer >= interval)
            {
                _autoSaveTimer = 0;
                SaveCurrentSession();
            }
        }

        private void HandleInputAction(string action)
        {
            if ((_currentState == GameState.Setup || (_currentState == GameState.Playing && !Waves.IsWaveActive))
                && action == "start_wave")
            {
                StartNextWave();
                return;
            }

            if (action == "pause")
            {
                TogglePause();
                return;
            }

            if (action == "speed_up")
            {
                _timeScale = _timeScale > 1f ? 1f : 2f;
                OnTimeScaleChanged?.Invoke(_timeScale);
                Hints?.ShowToast(_timeScale > 1f ? "加速模式" : "正常速度");
                return;
            }

            if (action.StartsWith("select_tower_"))
            {
                string[] parts = action.Split('_');
                if (parts.Length == 3 && int.TryParse(parts[2], out int num))
                {
                    int index = num - 1;
                    if (_currentLevel != null && index >= 0 && index < _currentLevel.availableTowerIds.Count)
                    {
                        SelectTowerId(_currentLevel.availableTowerIds[index]);
                    }
                }
                return;
            }

            if (action == "upgrade_tower")
            {
                UpgradeSelectedTower();
                return;
            }

            if (action == "sell_tower")
            {
                SellSelectedTower();
                return;
            }

            if (action == "cancel")
            {
                SelectedTowerId = null;
                SelectedSlotId = null;
                OnTowerSelected?.Invoke(null);
                OnSlotSelected?.Invoke(null);
                return;
            }

            Tutorial.HandleInputAction(action);
        }

        public void SelectTowerId(string towerId)
        {
            SelectedTowerId = towerId;
            OnTowerSelected?.Invoke(towerId);
            Hints?.ShowToast($"选择塔: {Configs.GetTowerConfig(towerId)?.towerName ?? towerId}");

            if (!string.IsNullOrEmpty(SelectedSlotId))
            {
                TryPlaceSelectedTower();
            }
        }

        public void SelectSlot(string slotId)
        {
            SelectedSlotId = slotId;
            OnSlotSelected?.Invoke(slotId);

            var slot = Towers.GetSlot(slotId);
            if (slot != null && !slot.isUnlocked)
            {
                if (Towers.CanUnlockSlot(slotId))
                {
                    UnlockSlot();
                }
                return;
            }

            var existingTower = Towers.GetTower(slotId);
            if (existingTower != null)
            {
                Hints?.ShowToast($"已选中塔: {existingTower.Config.towerName} Lv.{existingTower.CurrentLevel}");
            }
            else if (!string.IsNullOrEmpty(SelectedTowerId))
            {
                TryPlaceSelectedTower();
            }
        }

        public bool TryPlaceSelectedTower()
        {
            if (string.IsNullOrEmpty(SelectedSlotId) || string.IsNullOrEmpty(SelectedTowerId)) return false;

            Tower tower = Towers.PlaceTower(SelectedSlotId, SelectedTowerId);
            if (tower != null)
            {
                RecordChoice("place_tower", $"{SelectedTowerId}@{SelectedSlotId}");
                Hints?.ShowToast($"建造成功: {tower.Config.towerName}");
                SelectedTowerId = null;
                OnTowerSelected?.Invoke(null);
                PerformanceStats.Instance?.IncrementCounter("TowersBuilt");
                return true;
            }
            else
            {
                var cfg = Configs.GetTowerConfig(SelectedTowerId);
                Hints?.ShowToast($"金币不足! 需要 {cfg?.baseCost ?? 0}");
            }
            return false;
        }

        public bool UpgradeSelectedTower()
        {
            if (string.IsNullOrEmpty(SelectedSlotId))
            {
                Hints?.ShowToast("请先选择一个塔");
                return false;
            }
            if (!Towers.CanUpgradeTower(SelectedSlotId))
            {
                var tower = Towers.GetTower(SelectedSlotId);
                if (tower != null && !tower.CanUpgrade)
                    Hints?.ShowToast("已达最高等级");
                else
                    Hints?.ShowToast("金币不足，无法升级");
                return false;
            }

            var t = Towers.GetTower(SelectedSlotId);
            string towerId = t.Config.id;
            int oldLevel = t.CurrentLevel;
            int cost = t.GetUpgradeCost();

            if (Towers.UpgradeTower(SelectedSlotId))
            {
                RecordChoice("upgrade_tower", $"{towerId}@{SelectedSlotId}:Lv{oldLevel}->Lv{oldLevel + 1},cost:{cost}");
                Hints?.ShowToast($"升级成功! Lv.{oldLevel + 1}");
                PerformanceStats.Instance?.IncrementCounter("TowersUpgraded");
                return true;
            }
            return false;
        }

        public bool SellSelectedTower()
        {
            if (string.IsNullOrEmpty(SelectedSlotId)) return false;

            var tower = Towers.GetTower(SelectedSlotId);
            if (tower == null) return false;

            int refund = tower.GetSellValue();
            string name = tower.Config.towerName;
            if (Towers.RemoveTower(SelectedSlotId))
            {
                RecordChoice("sell_tower", $"{tower.Config.id}@{SelectedSlotId},refund:{refund}");
                Hints?.ShowToast($"出售 {name} +{refund}金");
                SelectedSlotId = null;
                OnSlotSelected?.Invoke(null);
                return true;
            }
            return false;
        }

        public bool UnlockSlot()
        {
            if (string.IsNullOrEmpty(SelectedSlotId)) return false;

            var slot = Towers.GetSlot(SelectedSlotId);
            int cost = slot?.unlockCost ?? 0;
            if (Towers.UnlockSlot(SelectedSlotId))
            {
                RecordChoice("unlock_slot", $"{SelectedSlotId},cost:{cost}");
                Hints?.ShowToast($"解锁塔位! 花费 {cost} 金币");
                return true;
            }
            else
            {
                Hints?.ShowToast($"金币不足! 需要 {cost}");
            }
            return false;
        }

        public void StartNextWave()
        {
            if (Waves.AllWavesCompleted || Waves.IsWaveActive) return;

            _currentState = GameState.Playing;
            OnGameStateChanged?.Invoke(_currentState);
            Waves.StartNextWave();
            RecordChoice("start_wave", $"Wave {Waves.CurrentWaveNumber}/{Waves.TotalWaves}");
            PerformanceStats.Instance?.IncrementCounter("WavesStarted");
        }

        private void HandleWaveStarted(int waveNumber)
        {
            Weather.UpdateWeatherForWave(waveNumber);
            Enemies.ApplyWeatherSpeedModifier(Weather.GetEnemySpeedModifier());
            Hints?.ShowToast($"第 {waveNumber} 波开始! 天气:{Weather.CurrentWeatherName}");
        }

        private void HandleWaveCompleted(int waveNumber)
        {
            Resources.AddGold(Waves.LastWaveReward, "wave_reward");
            Hints?.ShowToast($"第 {waveNumber} 波完成! +{Waves.LastWaveReward}金币");

            if (!Waves.AllWavesCompleted)
            {
                _currentState = GameState.Setup;
                OnGameStateChanged?.Invoke(_currentState);
            }
        }

        private void HandleAllWavesCompleted()
        {
            HandleVictory();
        }

        private void HandleEnemyDied(Enemy enemy)
        {
            Resources.AddGold(enemy.Config.reward, "enemy_kill");
            PerformanceStats.Instance?.IncrementCounter("EnemiesKilled");
        }

        private void HandleEnemyReachedEnd(Enemy enemy)
        {
            Resources.DamageBase(enemy.Config.damageToBase);
            PerformanceStats.Instance?.IncrementCounter("EnemiesPassed");
        }

        private void HandleBaseDestroyed()
        {
            HandleDefeat(FailedReason.BaseDestroyed);
        }

        private void CheckVictoryCondition()
        {
            if (_currentState != GameState.Playing) return;
            if (!Waves.AllWavesCompleted) return;
            if (Enemies.ActiveEnemyCount > 0) return;

            var condition = _currentLevel.victoryCondition;
            if (condition == null) { HandleVictory(); return; }

            if (condition.minSurvivingBaseHealth > 0 && Resources.BaseHealth < condition.minSurvivingBaseHealth)
            {
                HandleDefeat(FailedReason.InsufficientDPS);
                return;
            }

            if (condition.maxFailedEnemies > 0 && Enemies.TotalPassed > condition.maxFailedEnemies)
            {
                HandleDefeat(FailedReason.TooManyEnemiesPassed);
                return;
            }

            HandleVictory();
        }

        private void CheckFailureConditions()
        {
            if (_currentState != GameState.Playing) return;

            var condition = _currentLevel.victoryCondition;

            if (_currentLevel.maxTimeSeconds > 0 && Resources.ElapsedTime > _currentLevel.maxTimeSeconds)
            {
                HandleDefeat(FailedReason.TimeOut);
                return;
            }

            if (condition != null && condition.maxFailedEnemies > 0 &&
                Enemies.TotalPassed > condition.maxFailedEnemies)
            {
                HandleDefeat(FailedReason.TooManyEnemiesPassed);
                return;
            }
        }

        private void HandleVictory()
        {
            if (_currentState == GameState.Victory) return;

            _currentState = GameState.Victory;
            OnGameStateChanged?.Invoke(_currentState);
            Settlement.HandleVictory();
            SaveSystem.Instance.DeleteSavedSession();

            PerformanceStats.Instance?.IncrementCounter("Victories");
            var report = PerformanceStats.Instance?.GenerateReport();
            Debug.Log(report?.ToString());
        }

        private void HandleDefeat(FailedReason reason)
        {
            if (_currentState == GameState.Defeat) return;

            _currentState = GameState.Defeat;
            OnGameStateChanged?.Invoke(_currentState);
            Settlement.HandleDefeat(reason);

            PerformanceStats.Instance?.IncrementCounter("Defeats");
            var report = PerformanceStats.Instance?.GenerateReport();
            Debug.Log(report?.ToString());
        }

        public void RestartLevel()
        {
            _isPaused = false;
            Time.timeScale = 1f;
            if (_currentLevel != null)
            {
                LoadLevel(_currentLevel.levelId);
            }
        }

        public void TogglePause()
        {
            _isPaused = !_isPaused;
            Time.timeScale = _isPaused ? 0f : 1f;
            OnGameStateChanged?.Invoke(_currentState);
            Hints?.ShowToast(_isPaused ? "游戏暂停" : "继续游戏");
        }

        public void SetTimeScale(float scale)
        {
            _timeScale = Mathf.Clamp(scale, 0.25f, 4f);
            OnTimeScaleChanged?.Invoke(_timeScale);
        }

        private void SaveCurrentSession()
        {
            try
            {
                var session = new GameSessionData
                {
                    levelId = _currentLevel?.levelId ?? "",
                    currentWave = Waves.CurrentWaveNumber,
                    gold = Resources.Gold,
                    baseHealth = Resources.BaseHealth,
                    elapsedTime = Resources.ElapsedTime,
                    placedTowers = new List<PlacedTowerData>(),
                    currentWeather = Weather.CurrentWeather.ToString(),
                    enemiesKilled = Enemies.TotalKilled,
                    enemiesPassed = Enemies.TotalPassed,
                    sessionChoices = SaveSystem.Instance.GetRecentChoices(100)
                };

                foreach (var tower in Towers.GetAllTowers())
                {
                    session.placedTowers.Add(new PlacedTowerData
                    {
                        slotId = tower.Slot.slotId,
                        towerId = tower.Config.id,
                        level = tower.CurrentLevel
                    });
                }

                SaveSystem.Instance.SaveGameSession(session);
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[Save] 自动保存失败: {e.Message}");
            }
        }

        public bool LoadSavedSession()
        {
            var session = SaveSystem.Instance.LoadGameSession();
            if (session == null) return false;
            if (string.IsNullOrEmpty(session.levelId)) return false;

            LoadLevel(session.levelId);

            typeof(ResourceManager).GetField("_gold",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.SetValue(Resources, session.gold);
            typeof(ResourceManager).GetField("_baseHealth",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.SetValue(Resources, session.baseHealth);
            typeof(ResourceManager).GetField("_elapsedTime",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.SetValue(Resources, session.elapsedTime);

            foreach (var placed in session.placedTowers)
            {
                SelectSlot(placed.slotId);
                SelectTowerId(placed.towerId);

                var tower = Towers.GetTower(placed.slotId);
                if (tower != null)
                {
                    for (int i = 1; i < placed.level; i++)
                    {
                        SelectSlot(placed.slotId);
                        UpgradeSelectedTower();
                    }
                }
            }

            Hints?.ShowToast("存档已加载");
            return true;
        }

        public void RecordChoice(string choiceType, string detail)
        {
            var entry = new ChoiceLogEntry
            {
                levelId = _currentLevel?.levelId ?? "",
                gameTime = Resources?.ElapsedTime ?? 0,
                choiceType = choiceType,
                choiceDetail = detail,
                goldBefore = Resources?.Gold ?? 0,
                goldAfter = Resources?.Gold ?? 0,
                waveNumber = Waves?.CurrentWaveNumber ?? 0
            };
            SaveSystem.Instance.RecordChoiceLog(entry);
        }

        private void OnDestroy()
        {
            if (Instance == this)
            {
                if (Configs != null) Configs.OnConfigLoaded -= HandleConfigLoaded;
                Instance = null;
            }
        }
    }

    public enum GameState
    {
        Menu,
        Setup,
        Playing,
        Paused,
        Victory,
        Defeat
    }
}
