using UnityEngine;
using System;

public enum MatchResult
{
    NotPlayed,
    Win,
    Loss,
    Draw
}

[System.Serializable]
public class MatchData
{
    public string matchId;
    public string opponentName;
    public int opponentStrength;
    public int matchDay;
    public MatchResult result;
    public int ourScore;
    public int opponentScore;
}
