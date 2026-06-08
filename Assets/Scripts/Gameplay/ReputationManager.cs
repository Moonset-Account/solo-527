using System;
using UnityEngine;
using SpaceCourier.Core;
using SpaceCourier.Data;
using SpaceCourier.DataModule;

namespace SpaceCourier.Gameplay
{
    public class ReputationManager : MonoBehaviour, IModule
    {
        public ModuleType Type => ModuleType.ReputationManager;

        private DataManager dataManager;

        public event Action<int, int, string> OnReputationChanged;
        public event Action<ReputationTier> OnReputationTierChanged;

        public int CurrentReputation => dataManager?.RuntimeData?.Player?.Reputation ?? 0;
        public ReputationTier CurrentTier => GetReputationTier(CurrentReputation);

        public void Initialize()
        {
            dataManager = GameManager.Instance?.GetModule<DataManager>(ModuleType.DataManager);
            Debug.Log("[ReputationManager] Initialized.");
        }

        public bool ChangeReputation(int amount, string reason = "Action")
        {
            if (amount == 0) return false;

            var runtimeData = dataManager.RuntimeData;
            var oldTier = CurrentTier;
            runtimeData.Player.Reputation = Mathf.Clamp(runtimeData.Player.Reputation + amount, 0, 100);

            OnReputationChanged?.Invoke(CurrentReputation, amount, reason);
            EventBus.Publish(new GameEvents.ReputationChanged
            {
                CurrentReputation = CurrentReputation,
                Delta = amount,
                Reason = reason
            });

            var newTier = CurrentTier;
            if (oldTier != newTier)
            {
                OnReputationTierChanged?.Invoke(newTier);
                Debug.Log($"[ReputationManager] Tier changed: {oldTier} -> {newTier}");
            }

            dataManager.NotifyDataChanged();
            return true;
        }

        public bool HasMinimumReputation(int minReputation)
        {
            return CurrentReputation >= minReputation;
        }

        public ReputationTier GetReputationTier(int repValue)
        {
            if (repValue >= 90) return ReputationTier.Legendary;
            if (repValue >= 75) return ReputationTier.Excellent;
            if (repValue >= 50) return ReputationTier.Good;
            if (repValue >= 25) return ReputationTier.Neutral;
            if (repValue >= 10) return ReputationTier.Poor;
            return ReputationTier.Infamous;
        }

        public string GetReputationDescription(ReputationTier tier)
        {
            switch (tier)
            {
                case ReputationTier.Legendary: return "传奇快递员 - 全银河系都知道你的名字";
                case ReputationTier.Excellent: return "优秀快递员 - 深受客户信赖";
                case ReputationTier.Good: return "良好快递员 - 可靠的选择";
                case ReputationTier.Neutral: return "普通快递员 - 中立评价";
                case ReputationTier.Poor: return "差评快递员 - 不推荐";
                case ReputationTier.Infamous: return "臭名昭著 - 没人愿意和你做生意";
                default: return "未知";
            }
        }

        public Color GetReputationColor(ReputationTier tier)
        {
            switch (tier)
            {
                case ReputationTier.Legendary: return new Color(1f, 0.85f, 0f);
                case ReputationTier.Excellent: return new Color(0.2f, 0.9f, 0.3f);
                case ReputationTier.Good: return new Color(0.4f, 0.7f, 0.4f);
                case ReputationTier.Neutral: return Color.white;
                case ReputationTier.Poor: return new Color(1f, 0.6f, 0.2f);
                case ReputationTier.Infamous: return new Color(1f, 0.2f, 0.2f);
                default: return Color.gray;
            }
        }

        public float GetTradeDiscount()
        {
            switch (CurrentTier)
            {
                case ReputationTier.Legendary: return 0.3f;
                case ReputationTier.Excellent: return 0.2f;
                case ReputationTier.Good: return 0.1f;
                default: return 0f;
            }
        }

        public int GetBonusRewardPercentage()
        {
            switch (CurrentTier)
            {
                case ReputationTier.Legendary: return 30;
                case ReputationTier.Excellent: return 15;
                case ReputationTier.Good: return 5;
                default: return 0;
            }
        }

        public void Shutdown()
        {
            Debug.Log("[ReputationManager] Shutdown.");
        }
    }

    public enum ReputationTier
    {
        Infamous,
        Poor,
        Neutral,
        Good,
        Excellent,
        Legendary
    }
}
