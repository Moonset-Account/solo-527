using System;
using System.Collections.Generic;
using UnityEngine;

namespace DecorMatch3.Progression
{
    public enum AchievementCategory
    {
        Match3,
        Decoration,
        Collection,
        Social,
        Special,
        Tutorial
    }

    public enum AchievementConditionType
    {
        TotalMatches,
        LevelsCompleted,
        PerfectLevels,
        ComboReached,
        MaterialsCollected,
        OrdersCompleted,
        FiveStarOrders,
        HighScore,
        TotalCoinsEarned,
        PlayTime,
        ConsecutiveDays,
        DailyChallengesCompleted
    }

    [CreateAssetMenu(fileName = "NewAchievement", menuName = "DecorMatch3/Achievement", order = 30)]
    public class AchievementData : ScriptableObject
    {
        [Header("基础信息")]
        public string AchievementId;
        public string Name;
        [TextArea(2, 4)] public string Description;
        public Sprite Icon;
        public Sprite LockedIcon;

        [Header("分类")]
        public AchievementCategory Category;

        [Header("条件")]
        public AchievementConditionType ConditionType;
        public long TargetValue;

        [Header("奖励")]
        public int CoinReward;
        public int GemReward;
        public string RewardItemId;

        [Header("隐藏成就")]
        public bool IsHidden;

        [Header("里程碑")]
        public List<AchievementMilestone> Milestones = new List<AchievementMilestone>();
    }

    [System.Serializable]
    public class AchievementMilestone
    {
        public long Value;
        public string Description;
        public int CoinBonus;
        public int GemBonus;
    }

    public class AchievementProgress
    {
        public string AchievementId;
        public long CurrentValue;
        public bool IsUnlocked;
        public DateTime UnlockTime;
        public List<long> CompletedMilestones = new List<long>();

        public float GetProgressPercentage(long target)
        {
            return target > 0 ? Mathf.Clamp01((float)CurrentValue / target) : 0f;
        }
    }
}
