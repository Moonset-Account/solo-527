using System;
using System.Collections.Generic;
using UnityEngine;
using YouthTrainingManagement.Core;

namespace YouthTrainingManagement.Models
{
    [Serializable]
    public class FixtureModel
    {
        public string Id;
        public string OpponentName;
        public string OpponentTeamId;
        public PlayerStats OpponentStats;
        public int WeekNumber;
        public DayPhase DayPhase;
        public int DifficultyRating;
        public int ExpectedAttendance;
        public int TicketPrice;
        public bool IsHomeMatch;
        public MatchResult Result;
        public int GoalsFor;
        public int GoalsAgainst;
        public bool IsCompleted;
        public int PrizeMoney;
        public List<string> InjuredPlayersDuringMatch = new List<string>();

        public int ScheduledWeek { get { return WeekNumber; } set { WeekNumber = value; } }
        public int DifficultyStars { get { return Mathf.Clamp(Mathf.RoundToInt(DifficultyRating / 20f), 1, 5); } }
        public int TicketRevenue { get { return ExpectedAttendance * TicketPrice; } }
        public bool CanPlayNow { get { return !IsCompleted; } }
    }

    [Serializable]
    public class MatchSimulationResult
    {
        public MatchResult Result;
        public int GoalsFor;
        public int GoalsAgainst;
        public int PossessionPercentage;
        public int ShotsOnTarget;
        public List<string> GoalScorers = new List<string>();
        public List<string> InjuredPlayers = new List<string>();
        public Dictionary<InjurySeverity, int> InjuryDetails = new Dictionary<InjurySeverity, int>();
        public float TeamPerformanceRating;
        public float TacticalEffectiveness;
        public List<string> KeyEvents = new List<string>();
        public int Attendance;
        public int RevenueFromMatch;
    }

    [Serializable]
    public class SeasonModel
    {
        public string SeasonId;
        public int SeasonYear;
        public string LeagueName;
        public int TotalWeeks;
        public int CurrentWeek;
        public int CurrentDayInWeek;
        public DayPhase CurrentPhase;
        public List<FixtureModel> Fixtures = new List<FixtureModel>();
        public int Points;
        public int Wins;
        public int Draws;
        public int Losses;
        public int GoalsScored;
        public int GoalsConceded;
        public int LeaguePosition;
        public int TotalTeams;

        public FixtureModel GetNextFixture()
        {
            foreach (var fixture in Fixtures)
            {
                if (!fixture.IsCompleted && fixture.WeekNumber >= CurrentWeek)
                {
                    return fixture;
                }
            }
            return null;
        }

        public List<FixtureModel> GetUpcomingFixtures(int count)
        {
            var upcoming = new List<FixtureModel>();
            foreach (var fixture in Fixtures)
            {
                if (!fixture.IsCompleted && fixture.WeekNumber >= CurrentWeek)
                {
                    upcoming.Add(fixture);
                    if (upcoming.Count >= count) break;
                }
            }
            return upcoming;
        }

        public List<FixtureModel> GetRecentResults(int count)
        {
            var results = new List<FixtureModel>();
            for (int i = Fixtures.Count - 1; i >= 0; i--)
            {
                if (Fixtures[i].IsCompleted)
                {
                    results.Add(Fixtures[i]);
                    if (results.Count >= count) break;
                }
            }
            return results;
        }
    }
}
