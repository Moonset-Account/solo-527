using System;
using System.Collections.Generic;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Persistence;

namespace KitchenChaos.Achievements
{
    [Serializable]
    public class Achievement
    {
        public string Id;
        public string Name;
        public string Description;
        public string Icon;
        public int RewardCoins = 50;
        public int RewardScore;
    }

    public static class AchievementLibrary
    {
        public static readonly IReadOnlyList<Achievement> All = new List<Achievement>
        {
            new() { Id = "first_win", Name = "初出茅庐", Description = "完成第一个关卡", Icon = "🏆", RewardCoins = 50 },
            new() { Id = "three_stars", Name = "完美主厨", Description = "任意关卡获得3星", Icon = "⭐", RewardCoins = 100 },
            new() { Id = "combo_10", Name = "行云流水", Description = "连续完成10个订单不出错", Icon = "🔥", RewardCoins = 80 },
            new() { Id = "score_1000", Name = "财大气粗", Description = "单局得分超过1000", Icon = "💰", RewardCoins = 150 },
            new() { Id = "speed_demon", Name = "闪电侠", Description = "在订单剩余80%时间内交付", Icon = "⚡", RewardCoins = 60 },
            new() { Id = "coop_4p", Name = "团队默契", Description = "4人模式完成任意关卡", Icon = "👥", RewardCoins = 200 },
            new() { Id = "no_burn", Name = "火候大师", Description = "一整局不烧糊任何食材", Icon = "🔥", RewardCoins = 100 },
            new() { Id = "single_switch_50", Name = "手忙脚乱", Description = "单人模式累计切换角色50次", Icon = "🔄", RewardCoins = 80 },
            new() { Id = "all_levels", Name = "厨房主宰", Description = "完成所有关卡", Icon = "👑", RewardCoins = 500 },
            new() { Id = "daily_3", Name = "坚持不懈", Description = "完成3次每日挑战", Icon = "📅", RewardCoins = 120 }
        };

        public static Achievement Find(string id)
        {
            foreach (var a in All) if (a.Id == id) return a;
            return null;
        }
    }

    public class AchievementManager : MonoBehaviour
    {
        int _bestComboInSession;
        int _singleSwitchCount;
        bool _burnedThisSession;
        int _dailyCompletedCount;

        public static AchievementManager Instance { get; private set; }

        void Awake()
        {
            Instance = this;
            ServiceLocator.Register(this);
            EventBus.Subscribe<ScoreUpdatedEvent>(OnScoreUpdate);
            EventBus.Subscribe<IngredientProcessedEvent>(OnIngredientProcessed);
            EventBus.Subscribe<PlayerSwitchedEvent>(OnPlayerSwitch);
            EventBus.Subscribe<LevelEndedEvent>(OnLevelEnded);
        }

        void OnDestroy()
        {
            EventBus.Unsubscribe<ScoreUpdatedEvent>(OnScoreUpdate);
            EventBus.Unsubscribe<IngredientProcessedEvent>(OnIngredientProcessed);
            EventBus.Unsubscribe<PlayerSwitchedEvent>(OnPlayerSwitch);
            EventBus.Unsubscribe<LevelEndedEvent>(OnLevelEnded);
        }

        void OnScoreUpdate(ScoreUpdatedEvent e)
        {
            if (e.ComboCount > _bestComboInSession) _bestComboInSession = e.ComboCount;
        }

        void OnIngredientProcessed(IngredientProcessedEvent e)
        {
            if (e.ToState == IngredientState.Burned) _burnedThisSession = true;
        }

        void OnPlayerSwitch(PlayerSwitchedEvent e)
        {
            _singleSwitchCount++;
            if (_singleSwitchCount >= 50) TryUnlock("single_switch_50");
        }

        void OnLevelEnded(LevelEndedEvent e)
        {
            if (e.Victory)
            {
                TryUnlock("first_win");
                if (e.StarsEarned >= 3) TryUnlock("three_stars");
                if (e.FinalScore >= 1000) TryUnlock("score_1000");
                if (_bestComboInSession >= 10) TryUnlock("combo_10");
                if (!_burnedThisSession) TryUnlock("no_burn");

                var save = ServiceLocator.Get<SaveSystem>();
                int totalCompleted = 0;
                foreach (var r in save.Data.LevelResults) if (r.Completed) totalCompleted++;
                var gm = ServiceLocator.Get<GameManager>();
                if (gm != null && gm.Config != null && totalCompleted >= gm.Config.Levels.Length)
                    TryUnlock("all_levels");
            }
            _bestComboInSession = 0;
            _burnedThisSession = false;
        }

        public void CheckScoreAchievements(int score, int stars) { }

        public void CheckLevelAchievements(int levelIdx, bool victory) { }

        public void NotifyDailyCompleted()
        {
            _dailyCompletedCount++;
            if (_dailyCompletedCount >= 3) TryUnlock("daily_3");
        }

        public void TryUnlock(string id)
        {
            var save = ServiceLocator.Get<SaveSystem>();
            if (save == null || save.IsAchievementUnlocked(id)) return;
            var ach = AchievementLibrary.Find(id);
            if (ach == null) return;
            save.UnlockAchievement(id);
            save.Data.TotalCoins += ach.RewardCoins;
            save.Data.TotalScore += ach.RewardScore;
            save.SaveNow();
            EventBus.Raise(new AchievementUnlockedEvent { AchievementId = id, AchievementName = ach.Name });
        }
    }
}
