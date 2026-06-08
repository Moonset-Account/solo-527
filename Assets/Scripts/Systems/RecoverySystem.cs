using System;
using System.Collections.Generic;
using UnityEngine;
using YouthTrainingManagement.Core;
using YouthTrainingManagement.Models;

namespace YouthTrainingManagement.Systems
{
    public class RecoverySystem
    {
        private readonly GameManager _gameManager;
        public event Action<List<RecoveryFeedback>> OnRecoveryCompleted;

        public RecoverySystem(GameManager gameManager)
        {
            _gameManager = gameManager ?? throw new ArgumentNullException(nameof(gameManager));
        }

        public List<RecoveryOption> GetAvailableOptions()
        {
            return _gameManager.Config.GetAllRecoveryOptions();
        }

        public RecoveryPreview PreviewRecovery(string optionId, List<string> playerIds)
        {
            var option = _gameManager.Config.GetRecoveryOptionById(optionId);
            var preview = new RecoveryPreview();
            if (option == null) return preview;

            preview.Option = option;
            preview.TotalCost = option.CostPerPlayer * playerIds.Count;
            preview.CanAfford = _gameManager.Finance.CanAffordTraining(preview.TotalCost);

            float avgFatigue = 0f, avgMorale = 0f, avgInjuryDays = 0f;
            int injuredCount = 0;

            foreach (var id in playerIds)
            {
                var player = _gameManager.PlayerSystem.GetPlayerById(id);
                if (player == null) continue;
                avgFatigue += player.Fatigue;
                avgMorale += player.Morale;
                if (player.CurrentInjury != InjurySeverity.None)
                {
                    avgInjuryDays += player.InjuryDaysRemaining;
                    injuredCount++;
                }
            }
            if (playerIds.Count > 0)
            {
                avgFatigue /= playerIds.Count;
                avgMorale /= playerIds.Count;
            }

            preview.AverageFatigueAfter = Math.Clamp(avgFatigue - option.FatigueRecoveryAmount, 0f, 100f);
            preview.AverageMoraleAfter = Math.Clamp(avgMorale + option.MoraleBoostAmount, 0f, 100f);
            preview.ExpectedInjuryDaysReduction = injuredCount > 0
                ? Math.Max(1, (int)(avgInjuryDays * option.InjuryRecoveryRate))
                : 0;
            preview.InjuredPlayersCount = injuredCount;

            return preview;
        }

        public List<RecoveryFeedback> ExecuteRecovery(string optionId, List<string> playerIds)
        {
            var option = _gameManager.Config.GetRecoveryOptionById(optionId);
            if (option == null)
            {
                _gameManager.FeedbackSystem.ShowFeedback("Recovery option not found.", FeedbackType.Error);
                return new List<RecoveryFeedback>();
            }

            float totalCost = option.CostPerPlayer * playerIds.Count;
            if (!_gameManager.Finance.CanAffordTraining(totalCost))
            {
                _gameManager.FeedbackSystem.ShowFeedback(
                    _gameManager.Config.FeedbackStringsConfig?.BudgetExceededWarning ?? "Insufficient funds.",
                    FeedbackType.Warning);
                return new List<RecoveryFeedback>();
            }

            var rng = new System.Random();
            var strings = _gameManager.Config.FeedbackStringsConfig;
            var feedbacks = new List<RecoveryFeedback>();

            foreach (var id in playerIds)
            {
                var player = _gameManager.PlayerSystem.GetPlayerById(id);
                if (player == null) continue;

                float effectiveness = 0.85f + (float)(rng.NextDouble() * 0.3f);
                float fatigueRecovered = option.FatigueRecoveryAmount * effectiveness;
                float moraleGained = option.MoraleBoostAmount * effectiveness;
                float injuryRate = option.InjuryRecoveryRate * effectiveness;

                player.ApplyRecovery(fatigueRecovered, moraleGained, injuryRate);

                string note;
                if (effectiveness >= 0.95f && strings?.RecoveryExcellentNotes?.Length > 0)
                    note = strings.RecoveryExcellentNotes[rng.Next(strings.RecoveryExcellentNotes.Length)];
                else if (strings?.RecoveryGoodNotes?.Length > 0)
                    note = strings.RecoveryGoodNotes[rng.Next(strings.RecoveryGoodNotes.Length)];
                else note = "Recovery completed.";

                feedbacks.Add(new RecoveryFeedback
                {
                    PlayerId = id,
                    FatigueRecovered = fatigueRecovered,
                    MoraleGained = moraleGained,
                    InjuryDaysReduced = player.CurrentInjury != InjurySeverity.None
                        ? Math.Max(0, (int)(player.InjuryDaysRemaining * injuryRate))
                        : 0,
                    Effectiveness = effectiveness,
                    Note = note
                });
            }

            _gameManager.Finance.AddTransaction(
                $"Recovery: {option.Name} ({playerIds.Count} players)",
                totalCost, TransactionCategory.MedicalCosts, false);

            _gameManager.Stats.RecoverySessionsCompleted++;
            OnRecoveryCompleted?.Invoke(feedbacks);
            _gameManager.FeedbackSystem.ShowFeedback($"{option.Name} completed!", FeedbackType.Success);
            return feedbacks;
        }
    }

    public class RecoveryPreview
    {
        public RecoveryOption Option;
        public float TotalCost;
        public bool CanAfford;
        public float AverageFatigueAfter;
        public float AverageMoraleAfter;
        public int ExpectedInjuryDaysReduction;
        public int InjuredPlayersCount;
    }

    [Serializable]
    public class RecoveryFeedback
    {
        public string PlayerId;
        public float FatigueRecovered;
        public float MoraleGained;
        public int InjuryDaysReduced;
        public float Effectiveness;
        public string Note;
    }
}
