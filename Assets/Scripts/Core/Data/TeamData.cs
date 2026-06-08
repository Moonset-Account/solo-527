using UnityEngine;
using System;
using System.Collections.Generic;

[System.Serializable]
public class TeamData
{
    public string teamId;
    public string teamName;
    public List<PlayerData> players;
    public int budget;
    public int reputation;
    public int seasonWins;
    public int seasonLosses;
    public int seasonDraws;
    public MatchResult lastMatchResult;
    public int lastMatchOurScore;
    public int lastMatchOpponentScore;

    public PlayerData GetPlayer(string playerId)
    {
        if (players == null) return null;
        foreach (var p in players)
        {
            if (p.playerId == playerId) return p;
        }
        return null;
    }

    public float GetTeamOverall()
    {
        if (players == null || players.Count == 0) return 0f;
        float total = 0f;
        foreach (var p in players)
        {
            total += p.GetOverallRating();
        }
        return total / players.Count;
    }

    public List<PlayerData> GetAvailablePlayers()
    {
        if (players == null) return new List<PlayerData>();
        List<PlayerData> available = new List<PlayerData>();
        foreach (var p in players)
        {
            if (p.IsAvailable()) available.Add(p);
        }
        return available;
    }
}
