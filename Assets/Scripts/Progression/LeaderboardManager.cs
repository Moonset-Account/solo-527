using System;
using System.Collections.Generic;
using UnityEngine;
using DecorMatch3.Core;

namespace DecorMatch3.Progression
{
    public enum LeaderboardType
    {
        GlobalScore,
        WeeklyScore,
        LevelScore,
        OrderSatisfaction,
        Achievements
    }

    [System.Serializable]
    public class LeaderboardEntry
    {
        public string PlayerId;
        public string PlayerName;
        public int Rank;
        public long Score;
        public int Level;
        public int Stars;
        public long Timestamp;
        public Sprite Avatar;
        public bool IsCurrentPlayer;
    }

    public class LeaderboardManager
    {
        private readonly Dictionary<LeaderboardType, List<LeaderboardEntry>> _leaderboards =
            new Dictionary<LeaderboardType, List<LeaderboardEntry>>();

        public event Action<LeaderboardType, List<LeaderboardEntry>> OnLeaderboardUpdated;

        public LeaderboardManager()
        {
            foreach (LeaderboardType type in Enum.GetValues(typeof(LeaderboardType)))
            {
                _leaderboards[type] = new List<LeaderboardEntry>();
            }
            LoadLocalLeaderboard();
        }

        private void LoadLocalLeaderboard()
        {
            if (SaveSystem.Instance == null) return;

            List<LeaderboardEntryData> saved = SaveSystem.Instance.CurrentSave.LocalLeaderboard;
            if (saved == null || saved.Count == 0)
            {
                GenerateMockLeaderboard();
                return;
            }

            List<LeaderboardEntry> entries = new List<LeaderboardEntry>();
            foreach (LeaderboardEntryData data in saved)
            {
                entries.Add(new LeaderboardEntry
                {
                    PlayerId = data.PlayerName,
                    PlayerName = data.PlayerName,
                    Score = data.Score,
                    Level = data.Level,
                    Timestamp = data.Timestamp,
                    IsCurrentPlayer = data.PlayerName == SaveSystem.Instance.CurrentSave.PlayerName
                });
            }

            _leaderboards[LeaderboardType.GlobalScore] = entries;
        }

        private void GenerateMockLeaderboard()
        {
            List<LeaderboardEntry> globalEntries = new List<LeaderboardEntry>();
            string[] mockNames = { "Alice", "Bob", "Charlie", "Diana", "Evan", "Fiona", "George", "Hannah", "Ivan", "Julia" };
            System.Random rng = new System.Random();

            for (int i = 0; i < mockNames.Length; i++)
            {
                globalEntries.Add(new LeaderboardEntry
                {
                    PlayerId = mockNames[i] + "_ID",
                    PlayerName = mockNames[i],
                    Score = 50000 - i * 3000 + rng.Next(-500, 500),
                    Level = 50 - i * 3 + rng.Next(0, 5),
                    Stars = 150 - i * 10 + rng.Next(0, 10),
                    Rank = i + 1,
                    Timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds() - rng.Next(0, 86400 * 7),
                    IsCurrentPlayer = false
                });
            }

            _leaderboards[LeaderboardType.GlobalScore] = globalEntries;
        }

        public void SubmitScore(LeaderboardType type, long score, int level = 0, int stars = 0)
        {
            if (!_leaderboards.ContainsKey(type)) return;

            LeaderboardEntry entry = new LeaderboardEntry
            {
                PlayerId = SaveSystem.Instance?.CurrentSave.PlayerId ?? "Unknown",
                PlayerName = SaveSystem.Instance?.CurrentSave.PlayerName ?? "Player",
                Score = score,
                Level = level,
                Stars = stars,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                IsCurrentPlayer = true
            };

            _leaderboards[type].Add(entry);
            SortLeaderboard(type);
            UpdateRanks(type);

            if (SaveSystem.Instance != null)
            {
                SaveSystem.Instance.AddLeaderboardEntry(new LeaderboardEntryData
                {
                    PlayerName = entry.PlayerName,
                    Score = (int)score,
                    Level = level,
                    Timestamp = entry.Timestamp
                });
            }

            OnLeaderboardUpdated?.Invoke(type, _leaderboards[type]);
        }

        public List<LeaderboardEntry> GetLeaderboard(LeaderboardType type, int topCount = 100)
        {
            if (!_leaderboards.ContainsKey(type) || _leaderboards[type].Count == 0)
                return new List<LeaderboardEntry>();

            List<LeaderboardEntry> result = new List<LeaderboardEntry>();
            int count = Math.Min(topCount, _leaderboards[type].Count);

            for (int i = 0; i < count; i++)
            {
                result.Add(_leaderboards[type][i]);
            }

            return result;
        }

        public LeaderboardEntry GetPlayerRank(LeaderboardType type)
        {
            if (!_leaderboards.ContainsKey(type)) return null;

            string playerId = SaveSystem.Instance?.CurrentSave.PlayerId ?? "";
            return _leaderboards[type].Find(e => e.IsCurrentPlayer);
        }

        public int GetPlayerRankNumber(LeaderboardType type)
        {
            LeaderboardEntry entry = GetPlayerRank(type);
            return entry?.Rank ?? -1;
        }

        private void SortLeaderboard(LeaderboardType type)
        {
            _leaderboards[type].Sort((a, b) =>
            {
                int comparison = b.Score.CompareTo(a.Score);
                if (comparison == 0)
                    comparison = b.Timestamp.CompareTo(a.Timestamp);
                return comparison;
            });
        }

        private void UpdateRanks(LeaderboardType type)
        {
            for (int i = 0; i < _leaderboards[type].Count; i++)
            {
                _leaderboards[type][i].Rank = i + 1;
            }
        }

        public void ClearLeaderboard(LeaderboardType type)
        {
            if (_leaderboards.ContainsKey(type))
            {
                _leaderboards[type].Clear();
                OnLeaderboardUpdated?.Invoke(type, _leaderboards[type]);
            }
        }

        public void RefreshWeeklyLeaderboard()
        {
            _leaderboards[LeaderboardType.WeeklyScore].Clear();
            OnLeaderboardUpdated?.Invoke(LeaderboardType.WeeklyScore, _leaderboards[LeaderboardType.WeeklyScore]);
        }
    }
}
