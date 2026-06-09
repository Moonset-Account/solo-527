using System.Collections.Generic;
using System;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Config;
using KitchenChaos.Persistence;
using KitchenChaos.Achievements;

namespace KitchenChaos.Levels
{
    [Serializable]
    public class DailyChallenge
    {
        public int LevelIndex;
        public int TargetBonusScore;
        public int BonusCoins;
        public string Description;
    }

    public class DailyChallengeManager : MonoBehaviour
    {
        [SerializeField] string _todayKey;
        [SerializeField] int _todayBest;

        public static DailyChallengeManager Instance { get; private set; }

        SaveSystem _save;

        void Awake()
        {
            Instance = this;
            ServiceLocator.Register(this);
        }

        void Start()
        {
            ServiceLocator.TryGet(out _save);
            RefreshTodayKey();
        }

        void RefreshTodayKey()
        {
            _todayKey = $"daily_{DateTime.Today:yyyyMMdd}";
            _todayBest = 0;
            if (_save != null && _save.Data.DailyBestScoresList != null)
            {
                var entry = _save.Data.DailyBestScoresList.Find(e => e.DateKey == _todayKey);
                if (entry != null) _todayBest = entry.Score;
            }
        }

        public DailyChallenge GetTodayChallenge()
        {
            var seed = DateTime.Today.DayOfYear + DateTime.Today.Year * 366;
            var rng = new System.Random(seed);
            var gm = ServiceLocator.Get<GameManager>();
            int levelCount = gm?.Config?.Levels?.Length ?? 1;
            return new DailyChallenge
            {
                LevelIndex = rng.Next(0, levelCount),
                TargetBonusScore = 300 + rng.Next(0, 300),
                BonusCoins = 80 + rng.Next(0, 120),
                Description = $"在 L{rng.Next(1, levelCount + 1)} 关取得额外 {300 + rng.Next(0, 300)} 分"
            };
        }

        public int TodayBestScore
        {
            get
            {
                RefreshTodayKey();
                return _todayBest;
            }
        }

        public bool HasCompletedToday()
        {
            var challenge = GetTodayChallenge();
            return _todayBest >= challenge.TargetBonusScore;
        }

        public void RecordDailyScore(int levelIndex, int score)
        {
            RefreshTodayKey();
            if (score > _todayBest)
            {
                _todayBest = score;
                if (_save != null && _save.Data.DailyBestScoresList != null)
                {
                    var entry = _save.Data.DailyBestScoresList.Find(e => e.DateKey == _todayKey);
                    if (entry == null)
                    {
                        entry = new DailyScoreEntry { DateKey = _todayKey, Score = score };
                        _save.Data.DailyBestScoresList.Add(entry);
                    }
                    else
                    {
                        entry.Score = score;
                    }
                    if (score >= GetTodayChallenge().TargetBonusScore)
                    {
                        var am = AchievementManager.Instance;
                        if (am != null) am.TryUnlock("daily_3");
                    }
                    _save.SaveNow();
                }
            }
        }
    }
}
