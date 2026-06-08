using UnityEngine;
using System;
using System.Collections.Generic;

[System.Serializable]
public class LevelConfig
{
    public string levelId;
    public string levelName;
    public string description;
    public int difficulty;
    public int totalWeeks;
    public int budgetStart;
    public int targetWins;
    public int targetReputation;
    public List<MatchData> scheduledMatches;
    public float injuryRateMultiplier;
    public float trainingEfficiencyMultiplier;

    public bool IsLevelComplete(TeamData team)
    {
        return team.seasonWins >= targetWins && team.reputation >= targetReputation;
    }

    public bool IsLevelFailed(TeamData team, int currentWeek)
    {
        int remainingWeeks = totalWeeks - currentWeek;
        int matchesRemaining = scheduledMatches.FindAll(m => m.matchDay > currentWeek).Count;
        if (team.seasonWins + matchesRemaining < targetWins)
        {
            return true;
        }
        int maxPossibleReputation = team.reputation + remainingWeeks * 3;
        if (maxPossibleReputation < targetReputation)
        {
            return true;
        }
        return false;
    }
}
