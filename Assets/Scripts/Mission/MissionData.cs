using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(fileName = "MissionData", menuName = "Sailing/MissionData")]
public class MissionData : ScriptableObject
{
    public string missionId;
    public string missionName;
    [TextArea] public string description;
    public MissionType missionType;
    public string targetId;
    public float targetRadius = 5f;
    public int baseScore = 100;
    public int bonusScorePerSecond = 10;
    public float timeBonusThreshold = 30f;
    public int qualityBonusMax = 50;
    public string collectionItemId;
    public WeatherType requiredWeather = WeatherType.Clear;
    public bool requireSpecificWeather;
    public float minVisibility = 0.3f;
    public float maxWindSpeed = 15f;
    public string completionAudioId;
    public string photoFrameSpritePath;
}

public enum MissionType
{
    Photo,
    ReachPoint,
    SupplyRun,
    WeatherWitness,
    TimedRoute
}
