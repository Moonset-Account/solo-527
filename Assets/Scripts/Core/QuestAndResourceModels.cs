using System;
using System.Collections.Generic;

namespace PixelPlantLab
{
    [Serializable]
    public class QuestObjective
    {
        public string Description;
        public int TargetCount;
        public int CurrentCount;
        public bool IsCompleted;
        public Func<bool> CheckCondition;
    }

    [Serializable]
    public class Quest
    {
        public string Id;
        public string Title;
        public string Description;
        public bool IsTutorial;
        public List<QuestObjective> Objectives;
        public List<string> RewardResourceKeys;
        public List<int> RewardAmounts;
        public bool IsCompleted;
        public bool IsClaimed;
        public int OrderIndex;

        public Quest(string id, string title, string description, bool isTutorial, int orderIndex = 0)
        {
            Id = id;
            Title = title;
            Description = description;
            IsTutorial = isTutorial;
            Objectives = new List<QuestObjective>();
            RewardResourceKeys = new List<string>();
            RewardAmounts = new List<int>();
            IsCompleted = false;
            IsClaimed = false;
            OrderIndex = orderIndex;
        }

        public void AddObjective(string description, int targetCount)
        {
            Objectives.Add(new QuestObjective
            {
                Description = description,
                TargetCount = targetCount,
                CurrentCount = 0,
                IsCompleted = false
            });
        }

        public void AddReward(string resourceKey, int amount)
        {
            RewardResourceKeys.Add(resourceKey);
            RewardAmounts.Add(amount);
        }

        public void UpdateProgress(int objectiveIndex, int amount = 1)
        {
            if (objectiveIndex < 0 || objectiveIndex >= Objectives.Count) return;
            var obj = Objectives[objectiveIndex];
            if (obj.IsCompleted) return;

            obj.CurrentCount = Math.Min(obj.CurrentCount + amount, obj.TargetCount);
            if (obj.CurrentCount >= obj.TargetCount)
            {
                obj.IsCompleted = true;
            }

            CheckAllObjectives();
        }

        private void CheckAllObjectives()
        {
            bool allDone = true;
            foreach (var obj in Objectives)
            {
                if (!obj.IsCompleted)
                {
                    allDone = false;
                    break;
                }
            }
            if (allDone) IsCompleted = true;
        }
    }

    [Serializable]
    public class DailyChallenge
    {
        public string Id;
        public string Title;
        public string Description;
        public DateTime Date;
        public QuestObjective Objective;
        public string RewardResourceKey;
        public int RewardAmount;
        public bool IsCompleted;
        public bool IsClaimed;

        public DailyChallenge(string id, string title, string description, QuestObjective objective, string rewardKey, int rewardAmount)
        {
            Id = id;
            Title = title;
            Description = description;
            Date = DateTime.Today;
            Objective = objective;
            RewardResourceKey = rewardKey;
            RewardAmount = rewardAmount;
            IsCompleted = false;
            IsClaimed = false;
        }

        public void UpdateProgress(int amount = 1)
        {
            if (Objective.IsCompleted) return;
            Objective.CurrentCount = Math.Min(Objective.CurrentCount + amount, Objective.TargetCount);
            if (Objective.CurrentCount >= Objective.TargetCount)
            {
                Objective.IsCompleted = true;
                IsCompleted = true;
            }
        }

        public bool IsExpired()
        {
            return Date.Date != DateTime.Today;
        }
    }

    [Serializable]
    public class ResourceData
    {
        public int Seeds;
        public int Nutrients;
        public int Credits;

        public ResourceData(int seeds = 0, int nutrients = 0, int credits = 0)
        {
            Seeds = seeds;
            Nutrients = nutrients;
            Credits = credits;
        }

        public static ResourceData operator +(ResourceData a, ResourceData b)
        {
            return new ResourceData(
                a.Seeds + b.Seeds,
                a.Nutrients + b.Nutrients,
                a.Credits + b.Credits
            );
        }

        public static ResourceData operator -(ResourceData a, ResourceData b)
        {
            return new ResourceData(
                Math.Max(0, a.Seeds - b.Seeds),
                Math.Max(0, a.Nutrients - b.Nutrients),
                Math.Max(0, a.Credits - b.Credits)
            );
        }

        public bool CanAfford(ResourceData cost)
        {
            return Seeds >= cost.Seeds && Nutrients >= cost.Nutrients && Credits >= cost.Credits;
        }

        public ResourceData Scale(float factor)
        {
            return new ResourceData(
                (int)Math.Floor(Seeds * factor),
                (int)Math.Floor(Nutrients * factor),
                (int)Math.Floor(Credits * factor)
            );
        }
    }
}
