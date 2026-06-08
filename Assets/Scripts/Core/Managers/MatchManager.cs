using UnityEngine;
using System;
using System.Collections.Generic;

public class MatchManager : MonoBehaviour
{
    public static MatchManager Instance { get; private set; }

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    public int SimulateMatchScore(TeamData ourTeam, MatchData matchData)
    {
        float ourRating = ourTeam.GetTeamOverall();
        float ratingDiff = ourRating - matchData.opponentStrength;
        float expectedGoals = Mathf.Max(0.5f, 1.2f + ratingDiff * 0.03f);
        return PoissonRandom(expectedGoals);
    }

    public int SimulateOpponentScore(int opponentStrength)
    {
        float expected = Mathf.Max(0.5f, 1.0f + opponentStrength * 0.01f);
        return PoissonRandom(expected);
    }

    public List<PlayerData> SelectSquad(TeamData team)
    {
        if (team == null || team.players == null) return new List<PlayerData>();
        List<PlayerData> available = team.GetAvailablePlayers();
        available.Sort((a, b) => b.GetOverallRating().CompareTo(a.GetOverallRating()));
        int count = Mathf.Min(11, available.Count);
        return available.GetRange(0, count);
    }

    int PoissonRandom(float lambda)
    {
        float L = Mathf.Exp(-lambda);
        int k = 0;
        float p = 1f;
        do
        {
            k++;
            p *= UnityEngine.Random.value;
        } while (p > L);
        return k - 1;
    }
}
