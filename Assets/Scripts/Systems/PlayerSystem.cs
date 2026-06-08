using System;
using System.Collections.Generic;
using UnityEngine;
using YouthTrainingManagement.Core;
using YouthTrainingManagement.Models;

namespace YouthTrainingManagement.Systems
{
    public class PlayerSystem
    {
        private readonly GameManager _gameManager;
        private readonly List<PlayerModel> _players = new List<PlayerModel>();
        private readonly string[] _firstNames = { "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Cameron", "Sage", "Reese", "Rowan", "Parker", "Emerson", "Dakota", "Skyler", "Finley", "Hayden", "Kendall", "Perry" };
        private readonly string[] _lastNames = { "Smith", "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson", "Clark" };

        public event Action<PlayerModel> OnPlayerInjured;
        public event Action<PlayerModel> OnPlayerRecovered;
        public event Action<string, PlayerStats> OnStatsGained;

        public PlayerSystem(GameManager gameManager)
        {
            _gameManager = gameManager ?? throw new ArgumentNullException(nameof(gameManager));
        }

        public void InitializeDefaultPlayers()
        {
            _players.Clear();
            var rng = new System.Random();
            var playerCount = _gameManager.Config.GameConfig.DefaultPlayerCount;
            var minStat = _gameManager.Config.GameConfig.BaseStatRangeMin;
            var maxStat = _gameManager.Config.GameConfig.BaseStatRangeMax;

            var positions = new[]
            {
                PlayerPosition.Goalkeeper,
                PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Defender,
                PlayerPosition.Midfielder, PlayerPosition.Midfielder, PlayerPosition.Midfielder, PlayerPosition.Midfielder,
                PlayerPosition.Forward, PlayerPosition.Forward, PlayerPosition.Forward,
                PlayerPosition.Defender, PlayerPosition.Midfielder, PlayerPosition.Forward, PlayerPosition.Goalkeeper
            };

            for (int i = 0; i < playerCount; i++)
            {
                var baseStats = new PlayerStats(
                    (float)(rng.NextDouble() * (maxStat - minStat) + minStat),
                    (float)(rng.NextDouble() * (maxStat - minStat) + minStat),
                    (float)(rng.NextDouble() * (maxStat - minStat) + minStat),
                    (float)(rng.NextDouble() * (maxStat - minStat) + minStat),
                    (float)(rng.NextDouble() * (maxStat - minStat) + minStat)
                );

                var position = i < positions.Length ? positions[i] : PlayerPosition.Midfielder;
                AdjustStatsForPosition(baseStats, position);

                var player = new PlayerModel
                {
                    Id = $"P{i:D4}",
                    Name = $"{_firstNames[rng.Next(_firstNames.Length)]} {_lastNames[rng.Next(_lastNames.Length)]}",
                    Age = rng.Next(16, 21),
                    Position = position,
                    BaseStats = baseStats,
                    CurrentStats = new PlayerStats(baseStats.Strength, baseStats.Speed, baseStats.Technique, baseStats.Endurance, baseStats.TacticalAwareness),
                    TrainingGains = new PlayerStats(),
                    Fatigue = 20f + (float)(rng.NextDouble() * 15f),
                    Morale = 70f + (float)(rng.NextDouble() * 20f),
                    CurrentInjury = InjurySeverity.None,
                    InjuryDaysRemaining = 0,
                    TrainingStreak = 0,
                    JerseyNumber = i + 1,
                    IsSelected = i < 11
                };
                _players.Add(player);
            }
            Debug.Log($"Initialized {_players.Count} players.");
        }

        public void InitializePlayers(PlayerModel[] savedPlayers)
        {
            _players.Clear();
            _players.AddRange(savedPlayers);
        }

        private void AdjustStatsForPosition(PlayerStats stats, PlayerPosition position)
        {
            switch (position)
            {
                case PlayerPosition.Goalkeeper:
                    stats.Strength += 8f;
                    stats.TacticalAwareness += 5f;
                    stats.Speed -= 5f;
                    break;
                case PlayerPosition.Defender:
                    stats.Strength += 10f;
                    stats.Endurance += 5f;
                    stats.Technique -= 3f;
                    break;
                case PlayerPosition.Midfielder:
                    stats.Endurance += 8f;
                    stats.TacticalAwareness += 6f;
                    stats.Speed += 2f;
                    break;
                case PlayerPosition.Forward:
                    stats.Speed += 10f;
                    stats.Technique += 7f;
                    stats.Strength -= 3f;
                    break;
            }
            stats.Clamp(0f, 100f);
        }

        public List<PlayerModel> GetAllPlayers() => new List<PlayerModel>(_players);
        public PlayerModel GetPlayerById(string id) => _players.Find(p => p.Id == id);

        public List<PlayerModel> GetSelectedPlayers() => _players.FindAll(p => p.IsSelected);

        public List<PlayerModel> GetAvailablePlayers() => _players.FindAll(p => p.CurrentInjury == InjurySeverity.None);

        public void TogglePlayerSelection(string playerId)
        {
            var player = GetPlayerById(playerId);
            if (player != null && player.CurrentInjury == InjurySeverity.None)
            {
                player.IsSelected = !player.IsSelected;
            }
        }

        public void SetAllSelection(bool selected)
        {
            foreach (var p in _players)
            {
                if (p.CurrentInjury == InjurySeverity.None)
                {
                    p.IsSelected = selected;
                }
            }
        }

        public float CalculateTeamOverall()
        {
            if (_players.Count == 0) return 0f;
            float sum = 0f;
            foreach (var p in _players)
            {
                if (p.CurrentInjury == InjurySeverity.None)
                    sum += p.CurrentStats.GetOverallRating();
            }
            return sum / _players.Count;
        }

        public float CalculateTeamReadiness()
        {
            if (_players.Count == 0) return 0f;
            float sum = 0f;
            int count = 0;
            foreach (var p in _players)
            {
                if (p.IsSelected && p.CurrentInjury == InjurySeverity.None)
                {
                    sum += p.MatchReadiness;
                    count++;
                }
            }
            return count > 0 ? sum / count : 0f;
        }

        public int GetInjuryCount()
        {
            int count = 0;
            foreach (var p in _players)
            {
                if (p.CurrentInjury != InjurySeverity.None) count++;
            }
            return count;
        }

        public void CheckForTrainingInjuries(List<TrainingFeedback> feedbacks, float baseRiskIncrease)
        {
            var rng = new System.Random();
            foreach (var feedback in feedbacks)
            {
                var player = GetPlayerById(feedback.PlayerId);
                if (player == null) continue;

                float injuryRoll = (float)(rng.NextDouble() * 100f);
                float threshold = player.InjuryRisk + baseRiskIncrease;

                if (injuryRoll < threshold)
                {
                    InjurySeverity severity;
                    int days;
                    float severityRoll = (float)rng.NextDouble();
                    if (severityRoll < 0.6f)
                    {
                        severity = InjurySeverity.Minor;
                        days = 1 + rng.Next(2);
                    }
                    else if (severityRoll < 0.9f)
                    {
                        severity = InjurySeverity.Moderate;
                        days = 3 + rng.Next(4);
                    }
                    else
                    {
                        severity = InjurySeverity.Severe;
                        days = 8 + rng.Next(8);
                    }

                    player.ApplyInjury(severity, days);
                    feedback.WasInjured = true;
                    feedback.InjurySustained = severity;
                    feedback.PerformanceNote = $"{player.Name}" +
                        GetRandomInjuryMessage() + $" ({severity}, {days} days)";
                    OnPlayerInjured?.Invoke(player);
                    _gameManager.Stats.TotalInjuries++;
                }
            }
        }

        private string GetRandomInjuryMessage()
        {
            var msgs = _gameManager.Config.FeedbackStringsConfig?.TrainingInjuryMessages;
            if (msgs == null || msgs.Length == 0) return " got injured.";
            return msgs[new System.Random().Next(msgs.Length)];
        }

        public void CommitWeeklyGains()
        {
            float multiplier = _gameManager.Config.GameConfig.WeeklyGainMultiplier;
            float decay = _gameManager.Config.GameConfig.FatigueDecayPerDay;

            foreach (var player in _players)
            {
                if (player.TrainingGains.GetOverallRating() > 0)
                {
                    var scaled = player.TrainingGains * multiplier;
                    player.CurrentStats = player.BaseStats + scaled;
                    player.CurrentStats.Clamp(0f, 100f);
                    player.BaseStats = player.CurrentStats;
                    player.TrainingGains = new PlayerStats();
                }
                player.Fatigue = Math.Max(0f, player.Fatigue - decay);
                player.TrainingStreak = Math.Max(0, player.TrainingStreak - 1);
            }
        }

        public void ApplyMoraleFromResult(MatchResult result)
        {
            var cfg = _gameManager.Config.GameConfig;
            float change = result switch
            {
                MatchResult.Win => cfg.MoraleBoostPerWin,
                MatchResult.Draw => 1f,
                MatchResult.Loss => -cfg.MoraleDecayPerLoss,
                _ => 0f
            };

            foreach (var p in _players)
            {
                p.Morale = Math.Clamp(p.Morale + change, 0f, 100f);
            }
        }
    }
}
