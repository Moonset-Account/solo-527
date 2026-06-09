using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using KitchenChaos.Core;

namespace KitchenChaos.Persistence
{
    [Serializable]
    public class LevelResult
    {
        public int LevelIndex;
        public int BestScore;
        public int Stars;
        public bool Completed;
        public long Timestamp;
    }

    [Serializable]
    public class GameSaveData
    {
        public string PlayerName = "Chef";
        public int TotalScore;
        public int TotalCoins;
        public List<LevelResult> LevelResults = new();
        public List<string> UnlockedAchievements = new();
        public long LastDailyChallengeDate;
        public int DailyChallengeBestScore;
        public Dictionary<string, int> LeaderboardScores = new();
        public int TutorialProgress;
        public bool FirstTimeLaunch = true;
        public string SettingsJson;
    }

    public class SaveSystem : MonoBehaviour
    {
        [SerializeField] string _fileName = "kitchenchaos_save.json";
        GameSaveData _data;
        string _path;
        readonly Dictionary<int, Action<GameSaveData>> _subscribers = new();
        int _subId;

        public GameSaveData Data => _data;
        public static SaveSystem Instance { get; private set; }

        void Awake()
        {
            Instance = this;
            _path = Path.Combine(Application.persistentDataPath, _fileName);
            ServiceLocator.Register(this);
            Load();
        }

        public void Load()
        {
            try
            {
                if (File.Exists(_path))
                {
                    var json = File.ReadAllText(_path);
                    _data = JsonUtility.FromJson<GameSaveData>(json);
                }
            }
            catch (Exception e) { Debug.LogWarning($"Load failed: {e.Message}"); }
            if (_data == null)
            {
                _data = new GameSaveData();
                SaveNow();
            }
        }

        public void SaveNow()
        {
            try
            {
                var json = JsonUtility.ToJson(_data, true);
                File.WriteAllText(_path, json);
                NotifySubscribers();
            }
            catch (Exception e) { Debug.LogWarning($"Save failed: {e.Message}"); }
        }

        public int Subscribe(Action<GameSaveData> onChanged)
        {
            int id = ++_subId;
            _subscribers[id] = onChanged;
            return id;
        }

        public void Unsubscribe(int id) => _subscribers.Remove(id);

        void NotifySubscribers()
        {
            foreach (var kv in _subscribers)
                try { kv.Value?.Invoke(_data); } catch { }
        }

        public void SaveLevelResult(int levelIndex, int score, int stars, bool victory)
        {
            var existing = _data.LevelResults.Find(l => l.LevelIndex == levelIndex);
            if (existing == null)
            {
                existing = new LevelResult { LevelIndex = levelIndex };
                _data.LevelResults.Add(existing);
            }
            if (score > existing.BestScore) existing.BestScore = score;
            if (stars > existing.Stars) existing.Stars = stars;
            if (victory) existing.Completed = true;
            existing.Timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            _data.TotalScore += score;
            if (victory) _data.TotalCoins += Mathf.Max(10, score / 10);
            SaveNow();
        }

        public LevelResult GetLevelResult(int idx) => _data.LevelResults.Find(l => l.LevelIndex == idx);

        public int TotalStarsEarned()
        {
            int s = 0;
            foreach (var r in _data.LevelResults) s += r.Stars;
            return s;
        }

        public void UnlockAchievement(string id)
        {
            if (!_data.UnlockedAchievements.Contains(id))
            {
                _data.UnlockedAchievements.Add(id);
                SaveNow();
            }
        }

        public bool IsAchievementUnlocked(string id) => _data.UnlockedAchievements.Contains(id);

        public DateTime? GetLastDailyChallengeDate()
        {
            if (_data.LastDailyChallengeDate <= 0) return null;
            return DateTimeOffset.FromUnixTimeSeconds(_data.LastDailyChallengeDate).DateTime;
        }

        public void SetDailyChallengeResult(int bestScore)
        {
            var today = DateTime.Today;
            _data.LastDailyChallengeDate = new DateTimeOffset(today).ToUnixTimeSeconds();
            if (bestScore > _data.DailyChallengeBestScore)
                _data.DailyChallengeBestScore = bestScore;
            SaveNow();
        }

        public void SetPlayerName(string name) { _data.PlayerName = name; SaveNow(); }
    }
}
