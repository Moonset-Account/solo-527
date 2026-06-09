using UnityEngine;
using System;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Data;

namespace LakeSailing.Meta
{
    [Serializable]
    public class LeaderboardEntry
    {
        public string playerName;
        public int score;
        public int stars;
        public string date;
        public int rank;
    }

    [Serializable]
    public class DailyChallengeData
    {
        public string dateKey;
        public string levelId;
        public int seed;
        public int targetScore;
        public int bonusCoins;
        public int bonusXP;
        public WeatherForecast[] forcedWeather;
        public string modifierName;
        public float modifierValue;
    }

    public class LeaderboardSystem : PersistentSingleton<LeaderboardSystem>
    {
        [SerializeField] private Dictionary<string, List<LeaderboardEntry>> levelLeaderboards =
            new Dictionary<string, List<LeaderboardEntry>>();
        [SerializeField] private List<LeaderboardEntry> globalLeaderboard = new List<LeaderboardEntry>();
        [SerializeField] private DailyChallengeData todayChallenge;
        [SerializeField] private bool isLoaded;

        public event Action<DailyChallengeData> OnDailyChallengeLoaded;
        public event Action OnLeaderboardUpdated;
        public event Action<int> OnScoreSubmitted;

        public bool IsLoaded => isLoaded;
        public DailyChallengeData TodayChallenge => todayChallenge;

        public void Initialize()
        {
            GenerateMockLeaderboards();
            GenerateDailyChallenge();
            isLoaded = true;
        }

        private void GenerateMockLeaderboards()
        {
            string[] names = { "船长小王", "海风", "夕阳垂钓", "碧波", "云帆", "逐浪", "观星者", "海鸥", "老渔民", "远航" };
            var rng = new System.Random();

            string[] levels = { "tutorial_01", "level_01", "level_02", "level_03", "level_04", "level_05" };

            foreach (var level in levels)
            {
                var entries = new List<LeaderboardEntry>();
                for (int i = 0; i < 10; i++)
                {
                    entries.Add(new LeaderboardEntry
                    {
                        playerName = names[rng.Next(names.Length)],
                        score = rng.Next(800, 4000),
                        stars = rng.Next(1, 4),
                        date = DateTime.Now.AddDays(-rng.Next(30)).ToString("yyyy-MM-dd"),
                        rank = i + 1
                    });
                }
                entries.Sort((a, b) => b.score.CompareTo(a.score));
                for (int i = 0; i < entries.Count; i++) entries[i].rank = i + 1;
                levelLeaderboards[level] = entries;
            }

            globalLeaderboard = new List<LeaderboardEntry>();
            for (int i = 0; i < 20; i++)
            {
                globalLeaderboard.Add(new LeaderboardEntry
                {
                    playerName = names[rng.Next(names.Length)],
                    score = rng.Next(10000, 80000),
                    stars = rng.Next(10, 60),
                    date = DateTime.Now.AddDays(-rng.Next(60)).ToString("yyyy-MM-dd"),
                    rank = i + 1
                });
            }
            globalLeaderboard.Sort((a, b) => b.score.CompareTo(a.score));
            for (int i = 0; i < globalLeaderboard.Count; i++) globalLeaderboard[i].rank = i + 1;
        }

        public void GenerateDailyChallenge()
        {
            string today = DateTime.Now.ToString("yyyy-MM-dd");
            int seed = today.GetHashCode();
            var rng = new System.Random(seed);

            string[] modifiers = { "双倍补给", "无风挑战", "极限风暴", "限时加速", "黄金视野" };
            int modifierIndex = rng.Next(modifiers.Length);

            todayChallenge = new DailyChallengeData
            {
                dateKey = today,
                levelId = $"level_{rng.Next(1, 5):D2}",
                seed = seed,
                targetScore = 2500 + rng.Next(500),
                bonusCoins = 200 + rng.Next(100),
                bonusXP = 300 + rng.Next(200),
                forcedWeather = GenerateDailyWeather(seed),
                modifierName = modifiers[modifierIndex],
                modifierValue = 0.5f + (float)rng.NextDouble() * 1f
            };

            OnDailyChallengeLoaded?.Invoke(todayChallenge);
        }

        private WeatherForecast[] GenerateDailyWeather(int seed)
        {
            var rng = new System.Random(seed);
            var weathers = (WeatherType[])Enum.GetValues(typeof(WeatherType));
            var directions = (WindDirection[])Enum.GetValues(typeof(WindDirection));

            var result = new WeatherForecast[8];
            for (int i = 0; i < 8; i++)
            {
                result[i] = new WeatherForecast
                {
                    weather = weathers[rng.Next(weathers.Length)],
                    windDirection = directions[rng.Next(directions.Length)],
                    windStrength = (float)(rng.NextDouble() * 0.9),
                    visibility = (VisibilityLevel)rng.Next(1, 6),
                    duration = 45f,
                    temperature = (float)(rng.NextDouble() * 0.7 + 0.15)
                };
            }
            return result;
        }

        public List<LeaderboardEntry> GetLevelLeaderboard(string levelId)
        {
            if (levelLeaderboards.TryGetValue(levelId, out var entries))
            {
                return new List<LeaderboardEntry>(entries);
            }
            return new List<LeaderboardEntry>();
        }

        public List<LeaderboardEntry> GetGlobalLeaderboard()
        {
            return new List<LeaderboardEntry>(globalLeaderboard);
        }

        public int SubmitScore(string levelId, int score, int stars)
        {
            if (!levelLeaderboards.ContainsKey(levelId))
            {
                levelLeaderboards[levelId] = new List<LeaderboardEntry>();
            }

            var entry = new LeaderboardEntry
            {
                playerName = SaveSystem.Instance.CurrentSave?.playerName ?? "Player",
                score = score,
                stars = stars,
                date = DateTime.Now.ToString("yyyy-MM-dd"),
                rank = 0
            };

            var entries = levelLeaderboards[levelId];
            entries.Add(entry);
            entries.Sort((a, b) => b.score.CompareTo(a.score));

            int rank = -1;
            for (int i = 0; i < entries.Count; i++)
            {
                entries[i].rank = i + 1;
                if (entries[i] == entry) rank = i + 1;
            }

            if (entries.Count > 50) entries.RemoveRange(50, entries.Count - 50);

            OnLeaderboardUpdated?.Invoke();
            OnScoreSubmitted?.Invoke(rank);
            EventBus.Trigger(new ScoreSubmittedEvent(levelId, score, rank));

            return rank;
        }

        public async void CompleteDailyChallenge(int achievedScore)
        {
            if (todayChallenge == null) return;

            string today = todayChallenge.dateKey;
            var save = SaveSystem.Instance.CurrentSave;

            if (save.completedDailyChallengeDates.Contains(today)) return;

            save.completedDailyChallengeDates.Add(today);

            DateTime todayDate = DateTime.Parse(today);
            if (!string.IsNullOrEmpty(save.lastDailyChallengeDate))
            {
                DateTime lastDate = DateTime.Parse(save.lastDailyChallengeDate);
                if ((todayDate - lastDate).TotalDays == 1)
                {
                    save.currentDailyChallengeStreak++;
                }
                else if ((todayDate - lastDate).TotalDays > 1)
                {
                    save.currentDailyChallengeStreak = 1;
                }
            }
            else
            {
                save.currentDailyChallengeStreak = 1;
            }

            save.highestDailyChallengeStreak = Mathf.Max(save.highestDailyChallengeStreak, save.currentDailyChallengeStreak);
            save.lastDailyChallengeDate = today;

            if (achievedScore >= todayChallenge.targetScore)
            {
                await SaveSystem.Instance.AddCoins(todayChallenge.bonusCoins);
                await SaveSystem.Instance.AddXP(todayChallenge.bonusXP);
            }

            await SaveSystem.Instance.SaveGame();
            EventBus.Trigger(new DailyChallengeCompletedEvent(today, achievedScore));
        }

        public bool HasCompletedTodayChallenge()
        {
            if (todayChallenge == null) return false;
            return SaveSystem.Instance.CurrentSave?.completedDailyChallengeDates.Contains(todayChallenge.dateKey) ?? false;
        }

        public int GetPlayerRankOnLevel(string levelId)
        {
            var best = SaveSystem.Instance.GetLevelBestScore(levelId);
            if (best.score <= 0) return -1;
            var entries = GetLevelLeaderboard(levelId);
            for (int i = 0; i < entries.Count; i++)
            {
                if (entries[i].score <= best.score) return i + 1;
            }
            return entries.Count + 1;
        }
    }

    public struct ScoreSubmittedEvent : IEvent
    {
        public readonly string LevelId;
        public readonly int Score;
        public readonly int Rank;

        public ScoreSubmittedEvent(string levelId, int score, int rank)
        {
            LevelId = levelId;
            Score = score;
            Rank = rank;
        }
    }

    public struct DailyChallengeCompletedEvent : IEvent
    {
        public readonly string Date;
        public readonly int Score;

        public DailyChallengeCompletedEvent(string date, int score)
        {
            Date = date;
            Score = score;
        }
    }
}
