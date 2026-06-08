using System;
using System.Collections.Generic;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class HintManager
    {
        private Queue<HintMessage> _hintQueue;
        private List<HintMessage> _activeHints;
        private int _maxActiveHints = 3;
        private float _hintLifetime = 4f;

        private LevelConfig _levelConfig;
        private GameManager _gameManager;

        private Dictionary<string, float> _hintCooldowns;
        private Dictionary<string, int> _hintTriggerCounts;

        public event Action<HintMessage> OnHintAdded;
        public event Action<HintMessage> OnHintRemoved;
        public event Action<string> OnToastShown;

        public HintManager()
        {
            _hintQueue = new Queue<HintMessage>();
            _activeHints = new List<HintMessage>();
            _hintCooldowns = new Dictionary<string, float>();
            _hintTriggerCounts = new Dictionary<string, int>();
        }

        public void Initialize(LevelConfig levelConfig, GameManager gameManager)
        {
            _levelConfig = levelConfig;
            _gameManager = gameManager;
            _hintQueue.Clear();
            _activeHints.Clear();
            _hintCooldowns.Clear();
            _hintTriggerCounts.Clear();
        }

        public void Update(float deltaTime)
        {
            for (int i = _activeHints.Count - 1; i >= 0; i--)
            {
                var hint = _activeHints[i];
                hint.elapsedTime += deltaTime;
                if (hint.elapsedTime >= hint.duration)
                {
                    _activeHints.RemoveAt(i);
                    OnHintRemoved?.Invoke(hint);
                }
            }

            while (_activeHints.Count < _maxActiveHints && _hintQueue.Count > 0)
            {
                var hint = _hintQueue.Dequeue();
                hint.elapsedTime = 0;
                hint.displayedTime = Time.time;
                _activeHints.Add(hint);
                OnHintAdded?.Invoke(hint);
            }

            CheckDynamicHints(deltaTime);
        }

        public void ShowHint(string hintId, string message, string title = "",
            HintType type = HintType.Info, float duration = 4f, bool force = false)
        {
            if (!force && IsOnCooldown(hintId)) return;

            if (!force && HasTriggeredTooMany(hintId)) return;

            var hint = new HintMessage
            {
                hintId = hintId,
                title = title,
                message = message,
                type = type,
                duration = duration
            };

            _hintQueue.Enqueue(hint);
            SetCooldown(hintId, 15f);
            IncrementTrigger(hintId);
        }

        public void ShowToast(string message, float duration = 2f)
        {
            OnToastShown?.Invoke(message);
        }

        private void CheckDynamicHints(float deltaTime)
        {
            CheckBaseHealthHint();
            CheckGoldHint();
            CheckDPSHint();
            CheckWaveHint();
            CheckWeatherHint();
        }

        private void CheckBaseHealthHint()
        {
            if (_gameManager == null) return;
            var resources = _gameManager.Resources;
            if (resources == null) return;

            float healthPercent = (float)resources.BaseHealth / resources.MaxBaseHealth;
            if (healthPercent <= 0.25f && resources.BaseHealth > 0)
            {
                ShowHint("base_critical", "基地血量危急！快速击杀敌人或使用减速塔延缓敌人前进！",
                    "基地警报！", HintType.Warning, 5f);
            }
            else if (healthPercent <= 0.5f)
            {
                ShowHint("base_low", "基地血量不足50%，注意防守薄弱的位置。",
                    "基地受损", HintType.Warning, 3f);
            }
        }

        private void CheckGoldHint()
        {
            if (_gameManager == null) return;
            var resources = _gameManager.Resources;
            var towers = _gameManager.Towers;
            if (resources == null || towers == null) return;

            if (resources.Gold < 50 && towers.TowerCount < 3 && !_gameManager.Waves.IsWaveActive)
            {
                ShowHint("gold_low", "金币不足！可以出售性价比不高的塔，或者等待波次奖励。",
                    "资源警告", HintType.Info, 3f);
            }

            if (resources.Gold > 500 && towers.TowerCount > 0 && !_gameManager.Waves.IsWaveActive)
            {
                bool canUpgradeAny = false;
                foreach (var tower in towers.GetAllTowers())
                {
                    if (tower.CanUpgrade) { canUpgradeAny = true; break; }
                }
                if (canUpgradeAny)
                {
                    ShowHint("upgrade_available", "有大量金币剩余！可以升级现有塔来增强火力。",
                        "升级建议", HintType.Suggestion, 3f);
                }
            }
        }

        private void CheckDPSHint()
        {
            if (_gameManager == null) return;
            var enemies = _gameManager.Enemies;
            var towers = _gameManager.Towers;
            if (enemies == null || towers == null) return;

            if (_gameManager.Waves.CurrentWaveNumber > 2 &&
                enemies.ActiveEnemyCount > 5 &&
                enemies.TotalPassed > 0)
            {
                int dps = towers.GetTotalDPS();
                if (dps < 100)
                {
                    ShowHint("low_dps", "整体伤害偏低！建议增加AOE塔或升级主力输出塔。",
                        "火力不足", HintType.Suggestion, 4f);
                }
            }
        }

        private void CheckWaveHint()
        {
            if (_gameManager == null) return;
            var waves = _gameManager.Waves;
            if (waves == null || waves.IsBetweenWaves == false) return;

            var nextWave = waves.GetNextWave();
            if (nextWave == null) return;

            bool hasBoss = false;
            int totalEnemies = 0;
            foreach (var spawn in nextWave.spawns)
            {
                totalEnemies += spawn.count;
                if (spawn.enemyId.Contains("boss")) hasBoss = true;
            }

            if (hasBoss)
            {
                ShowHint("boss_incoming", $"警告：下一波包含Boss！确保已建造毒伤塔和减速塔！",
                    "Boss来袭！", HintType.Critical, 6f, true);
            }
            else if (totalEnemies > 15)
            {
                ShowHint("large_wave", $"下一波有 {totalEnemies} 个敌人！确保AOE塔数量充足。",
                    "大波次警告", HintType.Warning, 4f);
            }
        }

        private void CheckWeatherHint()
        {
            if (_gameManager == null) return;
            var weather = _gameManager.Weather;
            if (weather == null) return;

            if (!_gameManager.Waves.IsWaveActive) return;

            if (weather.CurrentWeather != WeatherType.Sunny)
            {
                ShowHint($"weather_{weather.CurrentWeather}", weather.GetWeatherDescription(),
                    $"当前天气：{weather.CurrentWeatherName}", HintType.Info, 5f);
            }
        }

        private bool IsOnCooldown(string hintId)
        {
            if (!_hintCooldowns.ContainsKey(hintId)) return false;
            return _hintCooldowns[hintId] > Time.time;
        }

        private void SetCooldown(string hintId, float seconds)
        {
            _hintCooldowns[hintId] = Time.time + seconds;
        }

        private bool HasTriggeredTooMany(string hintId)
        {
            if (!_hintTriggerCounts.ContainsKey(hintId)) return false;
            return _hintTriggerCounts[hintId] > 5;
        }

        private void IncrementTrigger(string hintId)
        {
            _hintTriggerCounts[hintId] = _hintTriggerCounts.ContainsKey(hintId)
                ? _hintTriggerCounts[hintId] + 1
                : 1;
        }

        public void ClearAllHints()
        {
            foreach (var hint in _activeHints)
            {
                OnHintRemoved?.Invoke(hint);
            }
            _activeHints.Clear();
            _hintQueue.Clear();
        }

        public List<HintMessage> GetActiveHints()
        {
            return new List<HintMessage>(_activeHints);
        }
    }

    [Serializable]
    public class HintMessage
    {
        public string hintId;
        public string title;
        public string message;
        public HintType type;
        public float duration;
        public float elapsedTime;
        public float displayedTime;
    }

    public enum HintType
    {
        Info,
        Warning,
        Critical,
        Suggestion,
        Success,
        Error
    }
}
