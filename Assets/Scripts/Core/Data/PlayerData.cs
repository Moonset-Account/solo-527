using UnityEngine;
using System;

public enum PlayerPosition
{
    Goalkeeper,
    Defender,
    Midfielder,
    Forward
}

public enum PlayerState
{
    Healthy,
    Fatigued,
    Injured,
    Recovering
}

[System.Serializable]
public class PlayerData
{
    public string playerId;
    public string playerName;
    public int age;
    public PlayerPosition position;
    public PlayerState state;
    public int stamina;
    public int speed;
    public int technique;
    public int tactical;
    public int mental;
    public float injuryRisk;
    public int morale;

    public float GetOverallRating()
    {
        return speed * 0.2f + technique * 0.3f + tactical * 0.25f + mental * 0.15f + stamina * 0.1f;
    }

    public void ApplyFatigue(int amount)
    {
        stamina = Math.Max(0, stamina - amount);
        if (stamina < 20)
        {
            injuryRisk = Math.Min(1f, injuryRisk + 0.1f);
        }
        if (stamina < 30)
        {
            state = PlayerState.Fatigued;
        }
    }

    public void ApplyRest(int amount)
    {
        stamina = Math.Min(100, stamina + amount);
        injuryRisk = Math.Max(0f, injuryRisk - 0.05f);
        if (stamina >= 60)
        {
            if (state == PlayerState.Fatigued)
            {
                state = PlayerState.Healthy;
            }
            else if (state == PlayerState.Recovering && stamina >= 80)
            {
                state = PlayerState.Healthy;
            }
        }
    }

    public void ApplyTraining(string statType, int amount)
    {
        switch (statType)
        {
            case "speed":
                speed = Math.Min(100, speed + amount);
                break;
            case "technique":
                technique = Math.Min(100, technique + amount);
                break;
            case "tactical":
                tactical = Math.Min(100, tactical + amount);
                break;
            case "mental":
                mental = Math.Min(100, mental + amount);
                break;
            case "stamina":
                stamina = Math.Min(100, stamina + amount);
                break;
        }
        ApplyFatigue(amount / 2);
    }

    public bool IsInjured()
    {
        return state == PlayerState.Injured;
    }

    public bool IsAvailable()
    {
        return state != PlayerState.Injured;
    }

    public void SetInjured(int severity)
    {
        state = PlayerState.Injured;
        injuryRisk = Math.Min(1f, injuryRisk + severity * 0.1f);
    }

    public void HealInjury(int amount)
    {
        if (state != PlayerState.Injured) return;
        injuryRisk = Math.Max(0f, injuryRisk - amount * 0.1f);
        if (injuryRisk < 0.3f)
        {
            state = PlayerState.Recovering;
        }
    }
}
