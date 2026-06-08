using System;
using System.Collections.Generic;
using UnityEngine;
using YouthTrainingManagement.Core;
using YouthTrainingManagement.Models;

namespace YouthTrainingManagement.Systems
{
    public class MatchSystem
    {
        private readonly GameManager _gameManager;
        public FixtureModel CurrentFixture { get; private set; }
        public MatchSimulationResult CurrentResult { get; private set; }
        public event Action<FixtureModel, MatchSimulationResult> OnMatchCompleted;
        public event Action<string, string> OnMatchEvent;

        public MatchSystem(GameManager gameManager)
        {
            _gameManager = gameManager ?? throw new ArgumentNullException(nameof(gameManager));
        }

        public bool HasUpcomingMatch() => _gameManager.Season.GetNextFixture() != null;

        public FixtureModel PreviewNextMatch()
        {
            var fixture = _gameManager.Season.GetNextFixture();
            if (fixture == null) return null;
            return fixture;
        }

        public void StartNextMatch()
        {
            CurrentFixture = PreviewNextMatch();
            if (CurrentFixture == null)
            {
                _gameManager.FeedbackSystem.ShowFeedback("No upcoming matches.", FeedbackType.Warning);
                return;
            }
            OnMatchEvent?.Invoke("KICKOFF", $"Match vs {CurrentFixture.OpponentName} begins!");
        }

        public MatchSimulationResult SimulateMatch()
        {
            if (CurrentFixture == null) return null;

            var rng = new System.Random();
            var cfg = _gameManager.Config.GameConfig;
            var strings = _gameManager.Config.FeedbackStringsConfig;

            var selectedPlayers = _gameManager.PlayerSystem.GetSelectedPlayers();
            var availablePlayers = new List<PlayerModel>();
            foreach (var p in selectedPlayers)
            {
                if (p.CurrentInjury == InjurySeverity.None)
                    availablePlayers.Add(p);
            }
            if (availablePlayers.Count < 7)
            {
                _gameManager.FeedbackSystem.ShowFeedback($"Not enough fit players ({availablePlayers.Count}/11)!", FeedbackType.Error);
                var lossResult = AutoLoss(CurrentFixture, "Insufficient players");
                FinalizeMatch(CurrentFixture, lossResult);
                return lossResult;
            }

            float teamStrength = 0f, teamSpeed = 0f, teamTech = 0f, teamEndurance = 0f, teamTactical = 0f;
            float teamReadiness = 0f;

            foreach (var p in availablePlayers)
            {
                teamStrength += p.CurrentStats.Strength * (1f + (100f - p.Fatigue) / 200f);
                teamSpeed += p.CurrentStats.Speed * (1f + (100f - p.Fatigue) / 200f);
                teamTech += p.CurrentStats.Technique * (1f + (100f - p.Fatigue) / 200f);
                teamEndurance += p.CurrentStats.Endurance * (1f + (100f - p.Fatigue) / 200f);
                teamTactical += p.CurrentStats.TacticalAwareness * (1f + p.Morale / 150f);
                teamReadiness += p.MatchReadiness;
            }
            int count = availablePlayers.Count;
            teamStrength /= count; teamSpeed /= count; teamTech /= count;
            teamEndurance /= count; teamTactical /= count; teamReadiness /= count;

            var opp = CurrentFixture.OpponentStats;
            float oppStrength = opp.Strength;
            float oppSpeed = opp.Speed;
            float oppTech = opp.Technique;
            float oppEndurance = opp.Endurance;
            float oppTactical = opp.TacticalAwareness;

            float attackRating = (teamSpeed * 0.35f + teamTech * 0.45f + teamStrength * 0.2f) * (teamReadiness / 70f);
            float defenseRating = (teamStrength * 0.35f + teamTactical * 0.35f + teamEndurance * 0.3f) * (teamReadiness / 70f);
            float oppAttackRating = (oppSpeed * 0.35f + oppTech * 0.45f + oppStrength * 0.2f) * (CurrentFixture.DifficultyRating / 55f);
            float oppDefenseRating = (oppStrength * 0.35f + oppTactical * 0.35f + oppEndurance * 0.3f) * (CurrentFixture.DifficultyRating / 55f);

            float attackFactor = attackRating / (attackRating + oppDefenseRating);
            float defenseFactor = defenseRating / (defenseRating + oppAttackRating);

            int goalsFor = Mathf.RoundToInt(3.5f * attackFactor * (0.7f + (float)(rng.NextDouble() * 0.6f)));
            int goalsAgainst = Mathf.RoundToInt(3.5f * (1f - defenseFactor) * (0.7f + (float)(rng.NextDouble() * 0.6f)));

            MatchResult result;
            if (goalsFor > goalsAgainst) result = MatchResult.Win;
            else if (goalsFor == goalsAgainst) result = MatchResult.Draw;
            else result = MatchResult.Loss;

            var simResult = new MatchSimulationResult
            {
                Result = result,
                GoalsFor = goalsFor,
                GoalsAgainst = goalsAgainst,
                PossessionPercentage = Mathf.RoundToInt(40f + attackFactor * 30f),
                ShotsOnTarget = Mathf.RoundToInt(5f + attackFactor * 10f),
                TeamPerformanceRating = ((attackFactor + defenseFactor) / 2f) * 100f,
                TacticalEffectiveness = teamTactical / (teamTactical + oppTactical) * 100f,
                Attendance = Mathf.RoundToInt(CurrentFixture.ExpectedAttendance * (0.8f + (float)(rng.NextDouble() * 0.4f))),
                RevenueFromMatch = 0
            };

            for (int i = 0; i < goalsFor; i++)
            {
                var scorer = availablePlayers[rng.Next(availablePlayers.Count)];
                simResult.GoalScorers.Add(scorer.Name);
                var msg = strings?.GoalScoredMessages ?? new[] { " scores!" };
                simResult.KeyEvents.Add($"GOAL! {scorer.Name}{msg[rng.Next(msg.Length)]} ({goalsFor}-{goalsAgainst})");
            }

            CheckForMatchInjuries(simResult, availablePlayers, cfg.MatchInjuryBaseRisk);
            foreach (var injuredId in simResult.InjuredPlayers)
            {
                var player = _gameManager.PlayerSystem.GetPlayerById(injuredId);
                var msg = strings?.InjuryMessages ?? new[] { " is injured!" };
                simResult.KeyEvents.Add($"INJURY: {player?.Name}{msg[rng.Next(msg.Length)]}");
            }

            var resultMsgs = result switch
            {
                MatchResult.Win => strings?.WinMessages,
                MatchResult.Draw => strings?.DrawMessages,
                _ => strings?.LossMessages
            };
            if (resultMsgs != null && resultMsgs.Length > 0)
            {
                simResult.KeyEvents.Add(resultMsgs[rng.Next(resultMsgs.Length)]);
            }

            simResult.RevenueFromMatch = simResult.Attendance * CurrentFixture.TicketPrice;
            FinalizeMatch(CurrentFixture, simResult);
            CurrentResult = simResult;
            return simResult;
        }

        private void CheckForMatchInjuries(MatchSimulationResult result, List<PlayerModel> players, float baseRisk)
        {
            var rng = new System.Random();
            foreach (var p in players)
            {
                float roll = (float)(rng.NextDouble() * 100f);
                float threshold = p.InjuryRisk + baseRisk + cfg_FatigueRisk(p.Fatigue);
                if (roll < threshold * 0.5f)
                {
                    InjurySeverity severity;
                    int days;
                    float sRoll = (float)rng.NextDouble();
                    if (sRoll < 0.55f) { severity = InjurySeverity.Minor; days = 1 + rng.Next(2); }
                    else if (sRoll < 0.9f) { severity = InjurySeverity.Moderate; days = 2 + rng.Next(4); }
                    else { severity = InjurySeverity.Severe; days = 6 + rng.Next(8); }

                    p.ApplyInjury(severity, days);
                    result.InjuredPlayers.Add(p.Id);
                    if (!result.InjuryDetails.ContainsKey(severity))
                        result.InjuryDetails[severity] = 0;
                    result.InjuryDetails[severity]++;
                    result.KeyEvents.Add($"INJURY: {p.Name} ({severity}, {days} days out)");
                    _gameManager.Stats.TotalInjuries++;

                    var cost = severity switch
                    {
                        InjurySeverity.Minor => 300f,
                        InjurySeverity.Moderate => 1200f,
                        InjurySeverity.Severe => 3500f,
                        _ => 0f
                    };
                    if (cost > 0)
                    {
                        _gameManager.Finance.AddTransaction($"Match Injury: {p.Name}", cost,
                            TransactionCategory.MedicalCosts, false, CurrentFixture.Id, p.Id);
                    }
                }
                p.Fatigue = Math.Clamp(p.Fatigue + _gameManager.Config.GameConfig.MatchFatigueIncrease, 0f, 100f);
            }
        }

        private static float cfg_FatigueRisk(float fatigue)
        {
            if (fatigue < 50f) return 0f;
            if (fatigue < 70f) return fatigue * 0.08f;
            if (fatigue < 85f) return fatigue * 0.2f;
            return fatigue * 0.35f;
        }

        private void FinalizeMatch(FixtureModel fixture, MatchSimulationResult simResult)
        {
            fixture.IsCompleted = true;
            fixture.Result = simResult.Result;
            fixture.GoalsFor = simResult.GoalsFor;
            fixture.GoalsAgainst = simResult.GoalsAgainst;
            fixture.InjuredPlayersDuringMatch = simResult.InjuredPlayers;

            var cfg = _gameManager.Config.GameConfig;
            int prize = simResult.Result switch
            {
                MatchResult.Win => cfg.BasePrizeMoneyWin + fixture.PrizeMoney,
                MatchResult.Draw => cfg.BasePrizeMoneyDraw + fixture.PrizeMoney / 3,
                MatchResult.Loss => cfg.BasePrizeMoneyLoss,
                _ => 0
            };

            _gameManager.Finance.AddTransaction($"Prize vs {fixture.OpponentName} ({simResult.Result})",
                prize, TransactionCategory.PrizeMoney, true, fixture.Id);
            _gameManager.Finance.AddTransaction($"Ticket Revenue vs {fixture.OpponentName}",
                simResult.RevenueFromMatch, TransactionCategory.TicketSales, true, fixture.Id);

            UpdateLeagueStandings(simResult.Result);
            _gameManager.Season.Wins += simResult.Result == MatchResult.Win ? 1 : 0;
            _gameManager.Season.Draws += simResult.Result == MatchResult.Draw ? 1 : 0;
            _gameManager.Season.Losses += simResult.Result == MatchResult.Loss ? 1 : 0;
            _gameManager.Season.Points = _gameManager.Season.Wins * 3 + _gameManager.Season.Draws;
            _gameManager.Season.GoalsScored += simResult.GoalsFor;
            _gameManager.Season.GoalsConceded += simResult.GoalsAgainst;

            _gameManager.PlayerSystem.ApplyMoraleFromResult(simResult.Result);
            _gameManager.Stats.MatchesPlayed++;
            if (simResult.Result == MatchResult.Win) _gameManager.Stats.MatchesWon++;

            OnMatchCompleted?.Invoke(fixture, simResult);

            var feedback = simResult.Result switch
            {
                MatchResult.Win => $"Victory! {simResult.GoalsFor}-{simResult.GoalsAgainst} vs {fixture.OpponentName}",
                MatchResult.Draw => $"Draw! {simResult.GoalsFor}-{simResult.GoalsAgainst} vs {fixture.OpponentName}",
                _ => $"Defeat. {simResult.GoalsFor}-{simResult.GoalsAgainst} vs {fixture.OpponentName}"
            };
            _gameManager.FeedbackSystem.ShowFeedback(feedback,
                simResult.Result == MatchResult.Win ? FeedbackType.Success :
                simResult.Result == MatchResult.Draw ? FeedbackType.Info : FeedbackType.Warning);
        }

        private MatchSimulationResult AutoLoss(FixtureModel fixture, string reason)
        {
            _gameManager.Season.Losses++;
            _gameManager.Season.Points += 0;
            _gameManager.Stats.MatchesPlayed++;
            _gameManager.Finance.AddTransaction($"Forfeit - {fixture.OpponentName}", 0,
                TransactionCategory.Other, false, fixture.Id);
            fixture.IsCompleted = true;
            fixture.Result = MatchResult.Loss;
            fixture.GoalsFor = 0;
            fixture.GoalsAgainst = 3;

            return new MatchSimulationResult
            {
                Result = MatchResult.Loss,
                GoalsFor = 0,
                GoalsAgainst = 3,
                PossessionPercentage = 25,
                ShotsOnTarget = 0,
                KeyEvents = new List<string> { $"Forfeited: {reason}" },
                TeamPerformanceRating = 10f
            };
        }

        private void UpdateLeagueStandings(MatchResult result)
        {
            int delta = result switch
            {
                MatchResult.Win => -1,
                MatchResult.Draw => 0,
                _ => 1
            };
            int newPos = _gameManager.Season.LeaguePosition + delta;
            _gameManager.Season.LeaguePosition = Math.Clamp(newPos, 1, _gameManager.Season.TotalTeams);
        }
    }
}
