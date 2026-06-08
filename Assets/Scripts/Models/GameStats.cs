using System;

namespace YouthTrainingManagement.Models
{
    [Serializable]
    public class GameStats
    {
        public int TotalInjuries;
        public int TrainingSessionsCompleted;
        public int RecoverySessionsCompleted;
        public int MatchesPlayed;
        public int MatchesWon;
        public int DaysPlayed;
        public int WeeksCompleted;
        public long TotalRevenue;
        public long TotalExpenditure;
        public int HighestTeamRating;
        public int BestLeaguePosition;
        public int MostGoalsInAMatch;
        public int FewestGoalsConceded;
        public int LongestWinStreak;
        public int CurrentWinStreak;

        public float WinRate => MatchesPlayed > 0 ? (float)MatchesWon / MatchesPlayed : 0f;
        public float NetProfit => TotalRevenue - TotalExpenditure;
    }
}
