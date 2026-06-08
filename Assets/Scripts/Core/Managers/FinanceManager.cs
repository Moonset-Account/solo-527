using UnityEngine;
using System;
using System.Collections.Generic;

public class FinanceManager : MonoBehaviour
{
    public static FinanceManager Instance { get; private set; }

    public int weeklySalaryCost = 2000;
    public int matchWinBonus = 5000;
    public int matchDrawBonus = 1500;

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

    public void ProcessWeeklyFinance(TeamData team)
    {
        if (team == null) return;
        team.budget -= weeklySalaryCost;
    }

    public void ApplyMatchBonus(TeamData team, MatchResult result)
    {
        if (team == null) return;
        if (result == MatchResult.Win)
        {
            team.budget += matchWinBonus;
        }
        else if (result == MatchResult.Draw)
        {
            team.budget += matchDrawBonus;
        }
    }

    public bool CanAfford(TeamData team, int amount)
    {
        if (team == null) return false;
        return team.budget >= amount;
    }

    public void Spend(TeamData team, int amount)
    {
        if (team == null) return;
        if (!CanAfford(team, amount)) return;
        team.budget -= amount;
    }
}
