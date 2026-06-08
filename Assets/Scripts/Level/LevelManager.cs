using UnityEngine;
using System.Collections.Generic;
using System.Linq;

namespace ShadowPlatformer.Level
{
    public class LevelManager : MonoBehaviour
    {
        public static LevelManager Instance { get; private set; }

        public LevelManifest manifest;
        public LevelLayout currentLayout;

        private Dictionary<string, LevelData> _levelMap = new Dictionary<string, LevelData>();
        private LevelData _currentLevel;
        private float _levelTimer;
        private int _currentDeaths;

        public LevelData CurrentLevel => _currentLevel;
        public float LevelTimer => _levelTimer;
        public int CurrentDeaths => _currentDeaths;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            BuildLevelMap();
        }

        private void BuildLevelMap()
        {
            _levelMap.Clear();
            if (manifest == null) return;
            foreach (var lvl in manifest.levels)
                _levelMap[lvl.levelId] = lvl;
        }

        public void LoadManifest(LevelManifest newManifest)
        {
            manifest = newManifest;
            BuildLevelMap();
        }

        public LevelData GetLevelData(string levelId)
        {
            _levelMap.TryGetValue(levelId, out var data);
            return data;
        }

        public List<LevelData> GetOrderedLevels()
        {
            if (manifest == null) return new List<LevelData>();
            return manifest.levels.OrderBy(l => l.order).ToList();
        }

        public bool IsLevelUnlocked(string levelId)
        {
            if (!_levelMap.TryGetValue(levelId, out var data)) return false;
            if (data.prerequisiteLevelIds == null || data.prerequisiteLevelIds.Length == 0)
                return true;
            return data.prerequisiteLevelIds.All(preId =>
            {
                if (_levelMap.TryGetValue(preId, out var preData))
                    return preData.isCompleted;
                return false;
            });
        }

        public void StartLevel(string levelId)
        {
            if (!_levelMap.TryGetValue(levelId, out var data)) return;
            _currentLevel = data;
            _levelTimer = 0f;
            _currentDeaths = 0;
            Core.EventBus.Instance.RaiseLevelStarted(levelId);
        }

        public void CompleteCurrentLevel()
        {
            if (_currentLevel == null) return;
            _currentLevel.isCompleted = true;
            if (_levelTimer < _currentLevel.bestTime || _currentLevel.bestTime <= 0f)
                _currentLevel.bestTime = _levelTimer;
            _currentLevel.deathCount = _currentDeaths;
        }

        public void RecordDeath()
        {
            _currentDeaths++;
        }

        public LevelData GetNextLevel()
        {
            if (_currentLevel == null) return null;
            var ordered = GetOrderedLevels();
            int idx = ordered.FindIndex(l => l.levelId == _currentLevel.levelId);
            if (idx >= 0 && idx < ordered.Count - 1)
                return ordered[idx + 1];
            return null;
        }

        private void Update()
        {
            if (_currentLevel != null && Core.GameManager.Instance.CurrentMode == Core.GameMode.Playing)
                _levelTimer += Time.deltaTime;
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }
    }
}
