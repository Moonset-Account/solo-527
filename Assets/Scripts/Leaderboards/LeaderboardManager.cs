using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Persistence;
using KitchenChaos.Config;

namespace KitchenChaos.Leaderboards
{
    [Serializable]
    public class LeaderboardEntry
    {
        public string PlayerName;
        public int Score;
        public int Stars;
        public long Timestamp;
        public string Meta;
    }

    [Serializable]
    public class LeaderboardData
    {
        public string Id;
        public List<LeaderboardEntry> Entries = new();
    }

    public class LeaderboardManager : MonoBehaviour
    {
        readonly Dictionary<string, LeaderboardData> _boards = new(StringComparer.OrdinalIgnoreCase);
        SaveSystem _save;

        public static LeaderboardManager Instance { get; private set; }

        void Awake()
        {
            Instance = this;
            ServiceLocator.Register(this);
            _save = ServiceLocator.Get<SaveSystem>();
        }

        public List<LeaderboardEntry> GetLeaderboard(string boardId, int topN = 10)
        {
            if (!_boards.TryGetValue(boardId, out var board))
            {
                board = new LeaderboardData { Id = boardId };
                _boards[boardId] = board;
            }
            return board.Entries.OrderByDescending(e => e.Score).Take(topN).ToList();
        }

        public int SubmitScore(string boardId, int score, int stars, string meta = null)
        {
            if (!_boards.TryGetValue(boardId, out var board))
            {
                board = new LeaderboardData { Id = boardId };
                _boards[boardId] = board;
            }
            _save ??= ServiceLocator.Get<SaveSystem>();
            var entry = new LeaderboardEntry
            {
                PlayerName = _save != null ? _save.Data.PlayerName : "Chef",
                Score = score,
                Stars = stars,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                Meta = meta ?? ""
            };
            board.Entries.Add(entry);
            if (board.Entries.Count > 100)
            {
                board.Entries = board.Entries.OrderByDescending(e => e.Score).Take(50).ToList();
            }
            return GetRank(boardId, score);
        }

        public int GetRank(string boardId, int score)
        {
            if (!_boards.TryGetValue(boardId, out var board)) return 0;
            return board.Entries.Count(e => e.Score > score) + 1;
        }

        public LeaderboardEntry GetBest(string boardId)
        {
            if (!_boards.TryGetValue(boardId, out var board)) return null;
            return board.Entries.OrderByDescending(e => e.Score).FirstOrDefault();
        }
    }

    public class DailyChallengeManager : MonoBehaviour
    {
        [SerializeField] int _levelPoolSize = 5;
        [SerializeField] int _dailySeed;
        LevelConfig _cachedConfig;
        DateTime _cachedDate;

        public static DailyChallengeManager Instance { get; private set; }

        void Awake()
        {
            Instance = this;
            ServiceLocator.Register(this);
            EventBus.Subscribe<LevelEndedEvent>(OnLevelEnded);
        }

        void OnDestroy()
        {
            EventBus.Unsubscribe<LevelEndedEvent>(OnLevelEnded);
        }

        public int TodaySeed
        {
            get
            {
                var today = DateTime.Today;
                return today.Year * 10000 + today.Month * 100 + today.Day;
            }
        }

        public LevelConfig GetTodayChallenge()
        {
            var today = DateTime.Today;
            if (_cachedConfig != null && _cachedDate == today) return _cachedConfig;

            var gm = ServiceLocator.Get<GameManager>();
            var baseConfig = gm?.Config;
            if (baseConfig == null || baseConfig.Levels == null || baseConfig.Levels.Length == 0)
                return LevelConfig.Default;

            var rng = new System.Random(TodaySeed);
            int idx = rng.Next(Mathf.Min(_levelPoolSize, baseConfig.Levels.Length));
            var baseLevel = baseConfig.Levels[idx];

            var copy = ScriptableObject.CreateInstance<LevelConfig>();
            copy.LevelName = $"Daily_{today:yyyyMMdd}";
            copy.Duration = Mathf.RoundToInt(baseLevel.Duration * 0.85f);
            copy.StarThresholds = baseLevel.StarThresholds.Select(s => (int)(s * 1.2f)).ToArray();
            copy.MaxFailedOrders = Mathf.Max(2, baseLevel.MaxFailedOrders - 1);
            copy.OrderSpawnInterval = baseLevel.OrderSpawnInterval * 0.85f;
            copy.MaxActiveOrders = Mathf.Min(7, baseLevel.MaxActiveOrders + 1);
            copy.PlayerSpawnPoints = baseLevel.PlayerSpawnPoints;
            copy.AvailableRecipeNames = baseLevel.AvailableRecipeNames;
            copy.Mechanics = baseLevel.Mechanics;
            copy.LevelIndex = baseLevel.LevelIndex;

            _cachedConfig = copy;
            _cachedDate = today;
            return copy;
        }

        public bool HasCompletedToday()
        {
            var save = ServiceLocator.Get<SaveSystem>();
            if (save == null) return false;
            var last = save.GetLastDailyChallengeDate();
            return last.HasValue && last.Value.Date == DateTime.Today;
        }

        public int TodayBestScore
        {
            get
            {
                var save = ServiceLocator.Get<SaveSystem>();
                return save != null && HasCompletedToday() ? save.Data.DailyChallengeBestScore : 0;
            }
        }

        void OnLevelEnded(LevelEndedEvent e)
        {
            if (!e.Victory) return;
            var save = ServiceLocator.Get<SaveSystem>();
            if (save == null) return;
            save.SetDailyChallengeResult(Math.Max(save.Data.DailyChallengeBestScore, e.FinalScore));

            var ach = ServiceLocator.Get<Achievements.AchievementManager>();
            ach?.NotifyDailyCompleted();

            var lb = ServiceLocator.Get<LeaderboardManager>();
            lb?.SubmitScore($"daily_{TodaySeed}", e.FinalScore, e.StarsEarned, DateTime.Today.ToString("d"));
        }
    }
}
