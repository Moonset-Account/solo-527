using System;
using System.Collections.Generic;
using YouthTrainingManagement.Core;

namespace YouthTrainingManagement.Models
{
    [Serializable]
    public class TrainingDrill
    {
        public string DrillId;
        public string Name;
        public TrainingType Type;
        public string Description;
        public PlayerStats StatsGainMultiplier;
        public float FatiguePerPlayer;
        public float MoraleEffect;
        public float BaseCost;
        public float InjuryRiskIncrease;
        public int DurationMinutes;
        public int DifficultyLevel;
        public float SuccessRate;
    }

    [Serializable]
    public class TrainingSession
    {
        public string SessionId;
        public string DrillId;
        public List<string> SelectedPlayerIds = new List<string>();
        public DateTime ScheduledTime;
        public DayPhase DayPhase;
        public int WeekNumber;
        public bool IsCompleted;
        public float ActualSuccessRate;
        public List<TrainingFeedback> PlayerFeedbacks = new List<TrainingFeedback>();
        public float TotalCost;
        public List<string> InjuriesDuringSession = new List<string>();
    }

    [Serializable]
    public class TrainingFeedback
    {
        public string PlayerId;
        public PlayerStats StatsGained;
        public float FatigueGained;
        public float MoraleChange;
        public bool WasInjured;
        public InjurySeverity InjurySustained;
        public string PerformanceNote;
        public float IndividualPerformanceRating;
    }

    [Serializable]
    public class RecoveryOption
    {
        public string OptionId;
        public string Name;
        public string Description;
        public float FatigueRecoveryAmount;
        public float MoraleBoostAmount;
        public float InjuryRecoveryRate;
        public float CostPerPlayer;
        public RecoveryType Type;
        public int DurationHours;
    }

    [Serializable]
    public enum RecoveryType
    {
        Rest,
        IceBath,
        Massage,
        Physiotherapy,
        Yoga,
        Sleep,
        FullMedical
    }

    [Serializable]
    public class WeeklyTrainingPlan
    {
        public int WeekNumber;
        public Dictionary<DayPhase, TrainingSession> ScheduledSessions = new Dictionary<DayPhase, TrainingSession>();
        public Dictionary<DayPhase, string> ScheduledRecovery = new Dictionary<DayPhase, string>();
        public float TotalPlannedCost;
    }
}
