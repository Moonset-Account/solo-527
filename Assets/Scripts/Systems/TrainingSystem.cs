using System;
using System.Collections.Generic;
using UnityEngine;
using YouthTrainingManagement.Core;
using YouthTrainingManagement.Models;

namespace YouthTrainingManagement.Systems
{
    public class TrainingSystem
    {
        private readonly GameManager _gameManager;

        public event Action<TrainingSession, List<TrainingFeedback>> OnTrainingCompleted;

        public TrainingSystem(GameManager gameManager)
        {
            _gameManager = gameManager ?? throw new ArgumentNullException(nameof(gameManager));
        }

        public List<TrainingDrill> GetAvailableDrills()
        {
            return _gameManager.Config.GetAllDrills();
        }

        public TrainingSessionPreview PreviewTraining(string drillId, List<string> playerIds)
        {
            var drill = _gameManager.Config.GetDrillById(drillId);
            var preview = new TrainingSessionPreview();
            if (drill == null) return preview;

            preview.Drill = drill;
            preview.TotalCost = drill.BaseCost + (playerIds.Count * (drill.BaseCost * 0.05f));
            preview.CanAfford = _gameManager.Finance.CanAffordTraining(preview.TotalCost);

            float avgFatigue = 0f, avgReadiness = 0f, avgRisk = 0f;
            foreach (var id in playerIds)
            {
                var player = _gameManager.PlayerSystem.GetPlayerById(id);
                if (player == null) continue;
                avgFatigue += player.Fatigue;
                avgReadiness += player.MatchReadiness;
                avgRisk += player.InjuryRisk;
            }
            if (playerIds.Count > 0)
            {
                avgFatigue /= playerIds.Count;
                avgReadiness /= playerIds.Count;
                avgRisk /= playerIds.Count;
            }

            preview.AverageFatigueAfter = Math.Clamp(avgFatigue + drill.FatiguePerPlayer, 0f, 100f);
            preview.AverageInjuryRisk = Math.Clamp(avgRisk + drill.InjuryRiskIncrease, 0f, 100f);
            preview.ExpectedStatsGain = drill.StatsGainMultiplier * drill.SuccessRate * playerIds.Count;
            preview.ExpectedMoraleChange = drill.MoraleEffect;

            return preview;
        }

        public TrainingSession ExecuteTraining(string drillId, List<string> playerIds)
        {
            var drill = _gameManager.Config.GetDrillById(drillId);
            if (drill == null)
            {
                _gameManager.FeedbackSystem.ShowFeedback("Training drill not found.", FeedbackType.Error);
                return null;
            }

            float totalCost = drill.BaseCost + (playerIds.Count * (drill.BaseCost * 0.05f));
            if (!_gameManager.Finance.CanAffordTraining(totalCost))
            {
                _gameManager.FeedbackSystem.ShowFeedback(_gameManager.Config.FeedbackStringsConfig.BudgetExceededWarning, FeedbackType.Warning);
                return null;
            }

            var session = new TrainingSession
            {
                SessionId = Guid.NewGuid().ToString(),
                DrillId = drillId,
                SelectedPlayerIds = new List<string>(playerIds),
                ScheduledTime = DateTime.Now,
                WeekNumber = _gameManager.Season.CurrentWeek,
                DayPhase = _gameManager.Season.CurrentPhase,
                TotalCost = totalCost,
                ActualSuccessRate = drill.SuccessRate * (1f + (100f - CalculateAvgFatigue(playerIds)) / 200f)
            };
            session.ActualSuccessRate = Math.Clamp(session.ActualSuccessRate, 0.3f, 1.1f);

            var feedbacks = new List<TrainingFeedback>();
            var rng = new System.Random();
            var strings = _gameManager.Config.FeedbackStringsConfig;

            foreach (var id in playerIds)
            {
                var player = _gameManager.PlayerSystem.GetPlayerById(id);
                if (player == null) continue;

                float individualPerformance = (float)(rng.NextDouble() * 0.4f + 0.8f) * session.ActualSuccessRate;
                var gains = drill.StatsGainMultiplier * individualPerformance;
                float fatigueGain = drill.FatiguePerPlayer * (0.8f + (float)(rng.NextDouble() * 0.4f));
                float moraleChange = drill.MoraleEffect + (float)(rng.NextDouble() * 4f - 2f);

                player.ApplyTraining(gains, fatigueGain, moraleChange);

                var feedback = new TrainingFeedback
                {
                    PlayerId = id,
                    StatsGained = gains,
                    FatigueGained = fatigueGain,
                    MoraleChange = moraleChange,
                    IndividualPerformanceRating = individualPerformance * 100f,
                    PerformanceNote = GetPerformanceNote(individualPerformance, strings)
                };
                feedbacks.Add(feedback);
            }

            _gameManager.PlayerSystem.CheckForTrainingInjuries(feedbacks, drill.InjuryRiskIncrease);
            foreach (var f in feedbacks)
            {
                if (f.WasInjured)
                {
                    session.InjuriesDuringSession.Add(f.PlayerId);
                    var cost = f.InjurySustained switch
                    {
                        InjurySeverity.Minor => 200f,
                        InjurySeverity.Moderate => 800f,
                        InjurySeverity.Severe => 2500f,
                        _ => 0f
                    };
                    if (cost > 0)
                    {
                        _gameManager.Finance.AddTransaction(
                            $"Medical - {_gameManager.PlayerSystem.GetPlayerById(f.PlayerId)?.Name}",
                            cost, TransactionCategory.MedicalCosts, false, null, f.PlayerId);
                    }
                }
            }

            _gameManager.Finance.AddTransaction(
                $"Training: {drill.Name} ({playerIds.Count} players)",
                totalCost, TransactionCategory.TrainingCosts, false);

            session.IsCompleted = true;
            session.PlayerFeedbacks = feedbacks;
            _gameManager.Stats.TrainingSessionsCompleted++;

            OnTrainingCompleted?.Invoke(session, feedbacks);
            _gameManager.FeedbackSystem.ShowFeedback($"{drill.Name} completed!", FeedbackType.Success);

            return session;
        }

        private float CalculateAvgFatigue(List<string> playerIds)
        {
            if (playerIds.Count == 0) return 50f;
            float sum = 0;
            foreach (var id in playerIds)
            {
                var p = _gameManager.PlayerSystem.GetPlayerById(id);
                sum += p?.Fatigue ?? 50f;
            }
            return sum / playerIds.Count;
        }

        private string GetPerformanceNote(float performance, FeedbackStringsConfig strings)
        {
            if (strings == null) return "Session complete.";
            string[] pool = performance switch
            {
                >= 0.9f => strings.TrainingExcellentNotes,
                >= 0.75f => strings.TrainingGoodNotes,
                >= 0.55f => strings.TrainingAverageNotes,
                _ => strings.TrainingPoorNotes
            };
            if (pool == null || pool.Length == 0) return "Session complete.";
            return pool[new System.Random().Next(pool.Length)];
        }
    }

    public class TrainingSessionPreview
    {
        public TrainingDrill Drill;
        public float TotalCost;
        public bool CanAfford;
        public float AverageFatigueAfter;
        public float AverageInjuryRisk;
        public PlayerStats ExpectedStatsGain;
        public float ExpectedMoraleChange;
    }
}
