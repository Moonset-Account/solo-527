using UnityEngine;
using System;
using System.Collections.Generic;

public class InjuryManager : MonoBehaviour
{
    public static InjuryManager Instance { get; private set; }

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

    public void ProcessWeeklyInjuries(TeamData team, float injuryRateMultiplier)
    {
        if (team == null || team.players == null) return;
        foreach (var player in team.players)
        {
            if (player.IsInjured()) continue;
            float chance = player.injuryRisk * injuryRateMultiplier;
            if (UnityEngine.Random.value < chance)
            {
                int severity = UnityEngine.Random.Range(1, 5);
                player.SetInjured(severity);
            }
        }
        foreach (var player in team.players)
        {
            if (!player.IsInjured()) continue;
            player.HealInjury(1);
        }
    }

    public void HealPlayer(PlayerData player, int recoveryAmount)
    {
        if (player == null || !player.IsInjured()) return;
        player.HealInjury(recoveryAmount);
    }
}
