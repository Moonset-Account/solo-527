using UnityEngine;
using System;
using System.Collections.Generic;
using System.IO;

[CreateAssetMenu(fileName = "GameBalanceConfig", menuName = "YouthTraining/GameBalanceConfig")]
public class GameBalanceConfig : ScriptableObject
{
    public int baseSalaryPerPlayer;
    public int winBonus;
    public int drawBonus;
    public float baseInjuryRate;
    public float trainingGainPerDay;
    public float restRecoveryPerDay;
    public float fatiguePerTraining;

    public static GameBalanceConfig GetDefault()
    {
        GameBalanceConfig config = CreateInstance<GameBalanceConfig>();
        config.baseSalaryPerPlayer = 3000;
        config.winBonus = 5000;
        config.drawBonus = 1500;
        config.baseInjuryRate = 0.02f;
        config.trainingGainPerDay = 0.1f;
        config.restRecoveryPerDay = 0.15f;
        config.fatiguePerTraining = 0.08f;
        return config;
    }
}
