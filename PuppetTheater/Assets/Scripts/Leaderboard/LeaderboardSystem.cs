using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using PuppetTheater.Data;

namespace PuppetTheater.Leaderboard
{
    [Serializable]
    public struct LeaderboardEntry
    {
        public string playerName;
        public double score;
        public int maxCombo;
        public float accuracy;
        public StoryBranch branch;
        public DateTime timestamp;
        public int perfectCount;
        public int greatCount;
        public int goodCount;
        public int earlyCount;
        public int lateCount;
        public int missCount;
    }

    public class LeaderboardSystem : MonoBehaviour
    {
        private const int MaxEntries = 100;
        private const string PlayerPrefsKey = "LeaderboardData";

        private List<LeaderboardEntry> _entries = new List<LeaderboardEntry>();

        public event Action<LeaderboardEntry, int> OnScoreSubmitted;
        public event Action OnLeaderboardUpdated;

        [Serializable]
        private struct SerializableEntry
        {
            public string playerName;
            public double score;
            public int maxCombo;
            public float accuracy;
            public string branch;
            public long timestampTicks;
            public int perfectCount;
            public int greatCount;
            public int goodCount;
            public int earlyCount;
            public int lateCount;
            public int missCount;
        }

        [Serializable]
        private struct LeaderboardData
        {
            public List<SerializableEntry> entries;
        }

        private void Awake()
        {
            LoadFromPlayerPrefs();
        }

        public void SubmitScore(PerformanceStats stats, GameMode mode, string playerName)
        {
            if (mode != GameMode.Normal)
                return;

            if (!stats.Completed)
                return;

            var entry = new LeaderboardEntry
            {
                playerName = playerName,
                score = stats.TotalScore,
                maxCombo = stats.MaxCombo,
                accuracy = stats.Accuracy,
                branch = stats.FinalBranch,
                timestamp = DateTime.Now,
                perfectCount = stats.PerfectCount,
                greatCount = stats.GreatCount,
                goodCount = stats.GoodCount,
                earlyCount = stats.EarlyCount,
                lateCount = stats.LateCount,
                missCount = stats.MissCount
            };

            _entries.Add(entry);
            SortAndPrune();
            SaveToPlayerPrefs();

            int rank = GetRank(entry.score);
            OnScoreSubmitted?.Invoke(entry, rank);
            OnLeaderboardUpdated?.Invoke();
        }

        public List<LeaderboardEntry> GetTopEntries(int count)
        {
            return _entries.Take(Math.Min(count, _entries.Count)).ToList();
        }

        public List<LeaderboardEntry> GetEntriesByBranch(StoryBranch branch)
        {
            return _entries.Where(e => e.branch.Equals(branch)).ToList();
        }

        public LeaderboardEntry? GetPlayerBest(string playerName)
        {
            LeaderboardEntry? best = null;
            foreach (var entry in _entries)
            {
                if (entry.playerName == playerName)
                {
                    if (best == null || entry.score > best.Value.score)
                        best = entry;
                }
            }
            return best;
        }

        public int GetRank(double score)
        {
            for (int i = 0; i < _entries.Count; i++)
            {
                if (_entries[i].score <= score)
                    return i + 1;
            }
            return _entries.Count + 1;
        }

        public void ClearLeaderboard()
        {
            _entries.Clear();
            PlayerPrefs.DeleteKey(PlayerPrefsKey);
            PlayerPrefs.Save();
            OnLeaderboardUpdated?.Invoke();
        }

        public string ExportToJson()
        {
            var data = new LeaderboardData
            {
                entries = _entries.ConvertAll(ToSerializable)
            };
            return JsonUtility.ToJson(data, true);
        }

        public void ImportFromJson(string json)
        {
            var data = JsonUtility.FromJson<LeaderboardData>(json);
            _entries = data.entries.ConvertAll(FromSerializable);
            SortAndPrune();
            SaveToPlayerPrefs();
            OnLeaderboardUpdated?.Invoke();
        }

        private void SortAndPrune()
        {
            _entries = _entries
                .OrderByDescending(e => e.score)
                .ThenByDescending(e => e.timestamp)
                .ToList();

            if (_entries.Count > MaxEntries)
            {
                _entries = _entries.Take(MaxEntries).ToList();
            }
        }

        private void SaveToPlayerPrefs()
        {
            string json = ExportToJson();
            PlayerPrefs.SetString(PlayerPrefsKey, json);
            PlayerPrefs.Save();
        }

        private void LoadFromPlayerPrefs()
        {
            if (!PlayerPrefs.HasKey(PlayerPrefsKey))
                return;

            string json = PlayerPrefs.GetString(PlayerPrefsKey);
            if (string.IsNullOrEmpty(json))
                return;

            var data = JsonUtility.FromJson<LeaderboardData>(json);
            _entries = data.entries.ConvertAll(FromSerializable);
            SortAndPrune();
        }

        private SerializableEntry ToSerializable(LeaderboardEntry entry)
        {
            return new SerializableEntry
            {
                playerName = entry.playerName,
                score = entry.score,
                maxCombo = entry.maxCombo,
                accuracy = entry.accuracy,
                branch = entry.branch.ToString(),
                timestampTicks = entry.timestamp.Ticks,
                perfectCount = entry.perfectCount,
                greatCount = entry.greatCount,
                goodCount = entry.goodCount,
                earlyCount = entry.earlyCount,
                lateCount = entry.lateCount,
                missCount = entry.missCount
            };
        }

        private LeaderboardEntry FromSerializable(SerializableEntry se)
        {
            return new LeaderboardEntry
            {
                playerName = se.playerName,
                score = se.score,
                maxCombo = se.maxCombo,
                accuracy = se.accuracy,
                branch = (StoryBranch)Enum.Parse(typeof(StoryBranch), se.branch),
                timestamp = new DateTime(se.timestampTicks),
                perfectCount = se.perfectCount,
                greatCount = se.greatCount,
                goodCount = se.goodCount,
                earlyCount = se.earlyCount,
                lateCount = se.lateCount,
                missCount = se.missCount
            };
        }
    }
}
