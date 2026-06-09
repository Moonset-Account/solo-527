using System;
using System.Collections.Generic;
using UnityEngine;

namespace PixelPlantLab
{
    public class DailyChallengeManager : MonoBehaviour
    {
        public static DailyChallengeManager Instance { get; private set; }

        public int ChallengesPerDay = 3;

        private readonly List<DailyChallenge> _challenges = new List<DailyChallenge>();
        private DateTime _lastGeneratedDate;

        public event Action<DailyChallenge> OnChallengeProgressUpdated;
        public event Action<DailyChallenge> OnChallengeCompleted;
        public event Action<DailyChallenge, ResourceData> OnChallengeRewardsClaimed;
        public event Action OnChallengesRefreshed;

        public IReadOnlyList<DailyChallenge> Challenges => _challenges;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            GenerateDailyChallenges();
        }

        private void Update()
        {
            if (_lastGeneratedDate.Date != DateTime.Today)
            {
                GenerateDailyChallenges();
            }
        }

        public void GenerateDailyChallenges()
        {
            _challenges.Clear();
            _lastGeneratedDate = DateTime.Today;
            var seed = _lastGeneratedDate.Year * 10000 + _lastGeneratedDate.Month * 100 + _lastGeneratedDate.Day;
            var rng = new System.Random(seed);

            var templates = GetChallengeTemplates();
            var shuffled = new List<ChallengeTemplate>(templates);
            Shuffle(shuffled, rng);

            int count = Math.Min(ChallengesPerDay, shuffled.Count);
            for (int i = 0; i < count; i++)
            {
                var t = shuffled[i];
                int objectiveAmount = t.BaseAmount + rng.Next(t.MinVariance, t.MaxVariance + 1);
                var objective = new QuestObjective
                {
                    Description = string.Format(t.DescriptionFormat, objectiveAmount),
                    TargetCount = objectiveAmount,
                    CurrentCount = 0,
                    IsCompleted = false
                };
                var challenge = new DailyChallenge(
                    id: $"daily_{_lastGeneratedDate:yyyyMMdd}_{i}",
                    title: t.Title,
                    description: t.Description,
                    objective: objective,
                    rewardKey: t.RewardResourceKey,
                    rewardAmount: t.BaseReward + rng.Next(0, t.RewardVariance + 1)
                );
                _challenges.Add(challenge);
            }
            OnChallengesRefreshed?.Invoke();
        }

        private static void Shuffle<T>(List<T> list, System.Random rng)
        {
            for (int i = list.Count - 1; i > 0; i--)
            {
                int j = rng.Next(i + 1);
                (list[i], list[j]) = (list[j], list[i]);
            }
        }

        public void NotifyExperimentCompleted(PlantMutation result, bool isFirstDiscovery)
        {
            if (result == null) return;
            foreach (var c in _challenges)
            {
                if (c.IsCompleted || c.IsExpired()) continue;

                bool shouldCount = c.Id switch
                {
                    var id when id.Contains("experiment") => true,
                    var id when id.Contains("success") => result.Rarity != Rarity.Failure,
                    var id when id.Contains("failure") => result.Rarity == Rarity.Failure,
                    var id when id.Contains("rare") => result.Rarity >= Rarity.Rare,
                    var id when id.Contains("discovery") => isFirstDiscovery,
                    var id when id.Contains("trait_glow") => result.HasTrait(MutationTrait.Glowing),
                    var id when id.Contains("trait_crystal") => result.HasTrait(MutationTrait.Crystalline),
                    _ => false
                };

                if (shouldCount)
                {
                    bool wasCompleted = c.IsCompleted;
                    c.UpdateProgress();
                    OnChallengeProgressUpdated?.Invoke(c);
                    if (!wasCompleted && c.IsCompleted)
                        OnChallengeCompleted?.Invoke(c);
                }
            }
        }

        public bool ClaimReward(DailyChallenge challenge)
        {
            if (challenge == null || !challenge.IsCompleted || challenge.IsClaimed) return false;
            if (ResourceManager.Instance == null) return false;

            challenge.IsClaimed = true;
            var reward = new ResourceData();
            switch (challenge.RewardResourceKey)
            {
                case "Seeds": reward.Seeds = challenge.RewardAmount; break;
                case "Nutrients": reward.Nutrients = challenge.RewardAmount; break;
                case "Credits": reward.Credits = challenge.RewardAmount; break;
            }
            ResourceManager.Instance.AddResources(reward);
            OnChallengeRewardsClaimed?.Invoke(challenge, reward);
            return true;
        }

        private class ChallengeTemplate
        {
            public string IdKeyword;
            public string Title;
            public string Description;
            public string DescriptionFormat;
            public int BaseAmount;
            public int MinVariance;
            public int MaxVariance;
            public string RewardResourceKey;
            public int BaseReward;
            public int RewardVariance;
        }

        private static List<ChallengeTemplate> GetChallengeTemplates()
        {
            return new List<ChallengeTemplate>
            {
                new ChallengeTemplate
                {
                    IdKeyword = "experiment",
                    Title = "勤勉实验员",
                    Description = "进行一定次数的实验以磨练技艺",
                    DescriptionFormat = "完成 {0} 次任意实验",
                    BaseAmount = 5, MinVariance = 0, MaxVariance = 3,
                    RewardResourceKey = "Credits", BaseReward = 30, RewardVariance = 15
                },
                new ChallengeTemplate
                {
                    IdKeyword = "success",
                    Title = "丰收之日",
                    Description = "获得足够多的成功样本",
                    DescriptionFormat = "获得 {0} 个非失败结果",
                    BaseAmount = 3, MinVariance = 0, MaxVariance = 2,
                    RewardResourceKey = "Nutrients", BaseReward = 5, RewardVariance = 3
                },
                new ChallengeTemplate
                {
                    IdKeyword = "failure",
                    Title = "失败乃成功之母",
                    Description = "从失败中学习，收集失败样本",
                    DescriptionFormat = "获得 {0} 个失败结果",
                    BaseAmount = 2, MinVariance = 0, MaxVariance = 2,
                    RewardResourceKey = "Seeds", BaseReward = 4, RewardVariance = 2
                },
                new ChallengeTemplate
                {
                    IdKeyword = "rare",
                    Title = "稀有猎人",
                    Description = "寻找稀有突变体",
                    DescriptionFormat = "获得 {0} 个稀有或更高级的植物",
                    BaseAmount = 1, MinVariance = 0, MaxVariance = 1,
                    RewardResourceKey = "Credits", BaseReward = 60, RewardVariance = 30
                },
                new ChallengeTemplate
                {
                    IdKeyword = "discovery",
                    Title = "探险先锋",
                    Description = "发现图鉴中未记录的新品种",
                    DescriptionFormat = "解锁 {0} 种新的植物图鉴",
                    BaseAmount = 1, MinVariance = 0, MaxVariance = 2,
                    RewardResourceKey = "Nutrients", BaseReward = 6, RewardVariance = 4
                },
                new ChallengeTemplate
                {
                    IdKeyword = "trait_glow",
                    Title = "暗夜之光",
                    Description = "找到能够在黑暗中发光的植物",
                    DescriptionFormat = "获得 {0} 株发光特征的植物",
                    BaseAmount = 1, MinVariance = 0, MaxVariance = 2,
                    RewardResourceKey = "Seeds", BaseReward = 5, RewardVariance = 3
                },
                new ChallengeTemplate
                {
                    IdKeyword = "trait_crystal",
                    Title = "瑰丽结晶",
                    Description = "培育出结晶结构的植物",
                    DescriptionFormat = "获得 {0} 株结晶特征的植物",
                    BaseAmount = 1, MinVariance = 0, MaxVariance = 1,
                    RewardResourceKey = "Credits", BaseReward = 50, RewardVariance = 25
                }
            };
        }

        public int GetCompletedCount()
        {
            int count = 0;
            foreach (var c in _challenges) if (c.IsCompleted) count++;
            return count;
        }

        public int GetClaimedCount()
        {
            int count = 0;
            foreach (var c in _challenges) if (c.IsClaimed) count++;
            return count;
        }
    }
}
