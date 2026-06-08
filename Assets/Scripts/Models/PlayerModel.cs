using System;
using System.Collections.Generic;
using YouthTrainingManagement.Core;

namespace YouthTrainingManagement.Models
{
    [Serializable]
    public class PlayerStats
    {
        public float Strength;
        public float Speed;
        public float Technique;
        public float Endurance;
        public float TacticalAwareness;

        public PlayerStats() { }

        public PlayerStats(float str, float spd, float tech, float end, float tac)
        {
            Strength = str;
            Speed = spd;
            Technique = tech;
            Endurance = end;
            TacticalAwareness = tac;
        }

        public static PlayerStats operator +(PlayerStats a, PlayerStats b)
        {
            return new PlayerStats
            {
                Strength = a.Strength + b.Strength,
                Speed = a.Speed + b.Speed,
                Technique = a.Technique + b.Technique,
                Endurance = a.Endurance + b.Endurance,
                TacticalAwareness = a.TacticalAwareness + b.TacticalAwareness
            };
        }

        public static PlayerStats operator *(PlayerStats a, float multiplier)
        {
            return new PlayerStats
            {
                Strength = a.Strength * multiplier,
                Speed = a.Speed * multiplier,
                Technique = a.Technique * multiplier,
                Endurance = a.Endurance * multiplier,
                TacticalAwareness = a.TacticalAwareness * multiplier
            };
        }

        public float GetOverallRating()
        {
            return (Strength + Speed + Technique + Endurance + TacticalAwareness) / 5f;
        }

        public void Clamp(float min, float max)
        {
            Strength = Math.Clamp(Strength, min, max);
            Speed = Math.Clamp(Speed, min, max);
            Technique = Math.Clamp(Technique, min, max);
            Endurance = Math.Clamp(Endurance, min, max);
            TacticalAwareness = Math.Clamp(TacticalAwareness, min, max);
        }
    }

    [Serializable]
    public class PlayerModel
    {
        public string Id;
        public string Name;
        public int Age;
        public PlayerPosition Position;
        public PlayerStats BaseStats;
        public PlayerStats CurrentStats;
        public PlayerStats TrainingGains;
        public float Fatigue;
        public float Morale;
        public InjurySeverity CurrentInjury;
        public int InjuryDaysRemaining;
        public int TrainingStreak;
        public List<string> RecentTraining = new List<string>();
        public bool IsSelected;
        public int JerseyNumber;

        public float InjuryRisk => CalculateInjuryRisk();
        public float MatchReadiness => CalculateMatchReadiness();

        private float CalculateInjuryRisk()
        {
            float baseRisk = 5f;
            baseRisk += Fatigue * 0.4f;
            baseRisk += (100f - Morale) * 0.15f;
            if (CurrentInjury != InjurySeverity.None) baseRisk += 30f;
            baseRisk += TrainingStreak * 2f;
            return Math.Clamp(baseRisk, 0f, 100f);
        }

        private float CalculateMatchReadiness()
        {
            float readiness = CurrentStats.GetOverallRating() * 0.5f;
            readiness += (100f - Fatigue) * 0.3f;
            readiness += Morale * 0.2f;
            if (CurrentInjury != InjurySeverity.None) readiness *= 0.3f;
            return Math.Clamp(readiness, 0f, 100f);
        }

        public void ApplyTraining(PlayerStats gains, float fatigueIncrease, float moraleChange)
        {
            TrainingGains += gains;
            Fatigue = Math.Clamp(Fatigue + fatigueIncrease, 0f, 100f);
            Morale = Math.Clamp(Morale + moraleChange, 0f, 100f);
            TrainingStreak++;
            RecentTraining.Add(DateTime.Now.Ticks.ToString());
            if (RecentTraining.Count > 10) RecentTraining.RemoveAt(0);
        }

        public void ApplyRecovery(float fatigueRecovery, float moraleBoost, float injuryRecoveryRate)
        {
            Fatigue = Math.Clamp(Fatigue - fatigueRecovery, 0f, 100f);
            Morale = Math.Clamp(Morale + moraleBoost, 0f, 100f);
            TrainingStreak = Math.Max(0, TrainingStreak - 1);

            if (CurrentInjury != InjurySeverity.None)
            {
                InjuryDaysRemaining = Math.Max(0, (int)(InjuryDaysRemaining * (1f - injuryRecoveryRate)));
                if (InjuryDaysRemaining <= 0)
                {
                    CurrentInjury = InjurySeverity.None;
                }
            }
        }

        public void ApplyInjury(InjurySeverity severity, int days)
        {
            CurrentInjury = severity;
            InjuryDaysRemaining = days;
            Morale = Math.Clamp(Morale - 15f, 0f, 100f);
        }

        public void CommitTrainingGains()
        {
            CurrentStats = BaseStats + TrainingGains;
            CurrentStats.Clamp(0f, 100f);
            BaseStats = CurrentStats;
            TrainingGains = new PlayerStats();
        }
    }
}
