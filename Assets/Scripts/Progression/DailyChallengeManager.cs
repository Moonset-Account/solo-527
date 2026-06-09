using System;
using System.Collections.Generic;
using UnityEngine;

namespace DecorMatch3.Progression
{
    public enum DailyChallengeType
    {
        ScoreTarget,
        MatchCount,
        MaterialCollection,
        TimeAttack,
        NoFailLevel
    }

    [CreateAssetMenu(fileName = "NewDailyChallenge", menuName = "DecorMatch3/Daily Challenge", order = 31)]
    public class DailyChallengeData : ScriptableObject
    {
        [Header("基础信息")]
        public string ChallengeId;
        public string Title;
        [TextArea(2, 3)] public string Description;
        public Sprite Icon;

        [Header("类型")]
        public DailyChallengeType ChallengeType;

        [Header("参数")]
        public int LevelId;
        public int TargetValue;
        public int DurationSeconds;
        public int MaxFailsAllowed;

        [Header("奖励")]
        public int CoinReward;
        public int GemReward;
        public int StarReward;

        [Header("难度")]
        [Range(1, 5)] public int DifficultyLevel = 1;
    }

    public class DailyChallengeInstance
    {
        public DailyChallengeData Data;
        public DateTime Date;
        public bool IsCompleted;
        public int CurrentProgress;
        public int BestScore;
    }

    public class DailyChallengeManager
    {
        private readonly List<DailyChallengeData> _allChallenges = new List<DailyChallengeData>();
        private readonly Dictionary<string, DailyChallengeInstance> _todaysChallenges = new Dictionary<string, DailyChallengeInstance>();

        public IReadOnlyDictionary<string, DailyChallengeInstance> TodaysChallenges => _todaysChallenges;

        public event Action<DailyChallengeInstance> OnChallengeStarted;
        public event Action<DailyChallengeInstance, int, bool> OnChallengeCompleted;

        public void RegisterChallenges(IEnumerable<DailyChallengeData> challenges)
        {
            foreach (DailyChallengeData c in challenges)
            {
                if (!_allChallenges.Contains(c))
                    _allChallenges.Add(c);
            }
            GenerateTodaysChallenges();
        }

        public void GenerateTodaysChallenges()
        {
            _todaysChallenges.Clear();
            string dateKey = DateTime.UtcNow.ToString("yyyy-MM-dd");

            if (_allChallenges.Count == 0) return;

            int seed = dateKey.GetHashCode();
            System.Random rng = new System.Random(seed);

            int challengeCount = Math.Min(3, _allChallenges.Count);
            HashSet<int> selectedIndices = new HashSet<int>();

            while (selectedIndices.Count < challengeCount)
            {
                selectedIndices.Add(rng.Next(_allChallenges.Count));
            }

            foreach (int idx in selectedIndices)
            {
                DailyChallengeData data = _allChallenges[idx];
                DailyChallengeInstance instance = new DailyChallengeInstance
                {
                    Data = data,
                    Date = DateTime.UtcNow.Date,
                    IsCompleted = Core.SaveSystem.Instance != null &&
                                  Core.SaveSystem.Instance.IsDailyChallengeCompleted(dateKey + "_" + data.ChallengeId),
                    CurrentProgress = 0,
                    BestScore = 0
                };
                _todaysChallenges[data.ChallengeId] = instance;
            }
        }

        public void StartChallenge(DailyChallengeData challenge)
        {
            if (!_todaysChallenges.TryGetValue(challenge.ChallengeId, out DailyChallengeInstance instance))
            {
                GenerateTodaysChallenges();
                if (!_todaysChallenges.TryGetValue(challenge.ChallengeId, out instance))
                    return;
            }

            if (instance.IsCompleted) return;

            Core.AnalyticsSystem.Instance?.RecordDailyChallengeStart(challenge.ChallengeId);
            OnChallengeStarted?.Invoke(instance);
        }

        public void SubmitChallengeResult(DailyChallengeData challenge, int score, bool isSuccess)
        {
            if (!_todaysChallenges.TryGetValue(challenge.ChallengeId, out DailyChallengeInstance instance))
                return;

            if (instance.IsCompleted) return;

            instance.BestScore = Math.Max(instance.BestScore, score);

            if (isSuccess)
            {
                instance.IsCompleted = true;
                instance.CurrentProgress = challenge.TargetValue;

                if (Core.SaveSystem.Instance != null)
                {
                    if (challenge.CoinReward > 0) Core.SaveSystem.Instance.AddCoins(challenge.CoinReward);
                    if (challenge.GemReward > 0) Core.SaveSystem.Instance.AddGems(challenge.GemReward);
                    if (challenge.StarReward > 0) Core.SaveSystem.Instance.AddStars(challenge.StarReward);
                }

                Core.AnalyticsSystem.Instance?.RecordDailyChallengeComplete(challenge.ChallengeId, score, true);
            }
            else
            {
                Core.AnalyticsSystem.Instance?.RecordDailyChallengeComplete(challenge.ChallengeId, score, false);
            }

            OnChallengeCompleted?.Invoke(instance, score, isSuccess);
        }

        public int GetCompletedCount()
        {
            int count = 0;
            foreach (var kvp in _todaysChallenges)
                if (kvp.Value.IsCompleted) count++;
            return count;
        }

        public bool AreAllChallengesCompleted()
        {
            foreach (var kvp in _todaysChallenges)
                if (!kvp.Value.IsCompleted) return false;
            return _todaysChallenges.Count > 0;
        }

        public void UpdateProgress(DailyChallengeType type, int progress)
        {
            foreach (var kvp in _todaysChallenges)
            {
                DailyChallengeInstance instance = kvp.Value;
                if (instance.IsCompleted) continue;
                if (instance.Data.ChallengeType != type) continue;

                instance.CurrentProgress = Math.Max(instance.CurrentProgress, progress);
            }
        }

        public void IncrementProgress(DailyChallengeType type, int increment)
        {
            foreach (var kvp in _todaysChallenges)
            {
                DailyChallengeInstance instance = kvp.Value;
                if (instance.IsCompleted) continue;
                if (instance.Data.ChallengeType != type) continue;

                instance.CurrentProgress += increment;
            }
        }
    }
}
