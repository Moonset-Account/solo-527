using System;
using System.Collections.Generic;
using UnityEngine;
using RainAlley.Core;

namespace RainAlley.Leaderboard
{
    [Serializable]
    public class LeaderboardEntry
    {
        public string LevelId;
        public string PlayerName;
        public int Score;
        public double Accuracy;
        public int PerfectCount;
        public int EarlyCount;
        public int LateCount;
        public int MissCount;
        public int MaxCombo;
        public long TimestampUtc;

        public string Grade
        {
            get
            {
                double acc = Accuracy;
                if (acc >= 0.98) return "S+";
                if (acc >= 0.95) return "S";
                if (acc >= 0.90) return "A";
                if (acc >= 0.80) return "B";
                if (acc >= 0.70) return "C";
                if (acc >= 0.60) return "D";
                return "F";
            }
        }

        public string FormattedDate
        {
            get
            {
                try
                {
                    var dt = DateTimeOffset.FromUnixTimeSeconds(TimestampUtc).LocalDateTime;
                    return dt.ToString("yyyy-MM-dd HH:mm");
                }
                catch { return "未知"; }
            }
        }

        public int CompareTo(LeaderboardEntry other)
        {
            if (other == null) return 1;
            int scoreCmp = other.Score.CompareTo(Score);
            if (scoreCmp != 0) return scoreCmp;
            return other.Accuracy.CompareTo(Accuracy);
        }
    }

    [Serializable]
    public class LeaderboardData
    {
        public List<LeaderboardEntry> Entries = new List<LeaderboardEntry>();
    }

    public class LeaderboardManager
    {
        private LeaderboardData _data;
        private const string PlayerPrefsKey = "RainAlley_Leaderboard_v1";
        public const int MaxEntriesPerLevel = 10;

        public event Action<string> OnLeaderboardUpdated;

        public LeaderboardManager()
        {
            Load();
        }

        public bool AddEntry(GameStats stats, LevelConfig level, string playerName = "玩家")
        {
            if (level == null) return false;
            if (stats.TotalObstacles == 0) return false;

            var entry = new LeaderboardEntry
            {
                LevelId = level.LevelId,
                PlayerName = playerName,
                Score = stats.TotalScore,
                Accuracy = stats.Accuracy,
                PerfectCount = stats.PerfectCount,
                EarlyCount = stats.EarlyCount,
                LateCount = stats.LateCount,
                MissCount = stats.MissCount,
                MaxCombo = stats.MaxCombo,
                TimestampUtc = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            };

            _data.Entries.Add(entry);
            TrimLevelEntries(level.LevelId);
            Save();
            OnLeaderboardUpdated?.Invoke(level.LevelId);
            return true;
        }

        public List<LeaderboardEntry> GetEntriesForLevel(string levelId)
        {
            var result = new List<LeaderboardEntry>();
            foreach (var e in _data.Entries)
            {
                if (e.LevelId == levelId) result.Add(e);
            }
            result.Sort((a, b) => a.CompareTo(b));
            return result;
        }

        public int GetRankForScore(string levelId, int score, double accuracy)
        {
            var entries = GetEntriesForLevel(levelId);
            int rank = 1;
            foreach (var e in entries)
            {
                if (e.Score > score || (e.Score == score && e.Accuracy > accuracy))
                    rank++;
            }
            return rank;
        }

        public LeaderboardEntry GetBestEntry(string levelId)
        {
            var entries = GetEntriesForLevel(levelId);
            return entries.Count > 0 ? entries[0] : null;
        }

        public int GetHighestScore(string levelId)
        {
            var best = GetBestEntry(levelId);
            return best != null ? best.Score : 0;
        }

        public void ClearLevel(string levelId)
        {
            _data.Entries.RemoveAll(e => e.LevelId == levelId);
            Save();
            OnLeaderboardUpdated?.Invoke(levelId);
        }

        public void ClearAll()
        {
            var levelIds = new HashSet<string>();
            foreach (var e in _data.Entries) levelIds.Add(e.LevelId);

            _data.Entries.Clear();
            Save();

            foreach (var id in levelIds) OnLeaderboardUpdated?.Invoke(id);
        }

        private void TrimLevelEntries(string levelId)
        {
            var levelEntries = new List<LeaderboardEntry>();
            var otherEntries = new List<LeaderboardEntry>();

            foreach (var e in _data.Entries)
            {
                if (e.LevelId == levelId) levelEntries.Add(e);
                else otherEntries.Add(e);
            }

            levelEntries.Sort((a, b) => a.CompareTo(b));

            _data.Entries = otherEntries;
            int count = Math.Min(MaxEntriesPerLevel, levelEntries.Count);
            for (int i = 0; i < count; i++) _data.Entries.Add(levelEntries[i]);
        }

        private void Save()
        {
            try
            {
                string json = JsonUtility.ToJson(_data);
                PlayerPrefs.SetString(PlayerPrefsKey, json);
                PlayerPrefs.Save();
            }
            catch (Exception e)
            {
                Debug.LogWarning($"保存排行榜失败: {e.Message}");
            }
        }

        private void Load()
        {
            try
            {
                if (PlayerPrefs.HasKey(PlayerPrefsKey))
                {
                    string json = PlayerPrefs.GetString(PlayerPrefsKey);
                    _data = JsonUtility.FromJson<LeaderboardData>(json) ?? new LeaderboardData();
                }
                else
                {
                    _data = new LeaderboardData();
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"加载排行榜失败: {e.Message}");
                _data = new LeaderboardData();
            }
        }
    }
}
