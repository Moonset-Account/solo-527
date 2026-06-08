using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(fileName = "LevelConfig", menuName = "Sailing/LevelConfig")]
public class LevelConfig : ScriptableObject
{
    public string levelId;
    public string levelName;
    [TextArea] public string description;
    public string sceneName;
    public WeatherType startWeather;
    public float startWindSpeed;
    public float startWindAngle;
    public float startFuel = 100f;
    public float startFood = 100f;
    public int startFilm = 30;
    public float timeLimit;
    public List<MissionData> missions = new List<MissionData>();
    public List<string> requiredLevelIds = new List<string>();
    public int starThreshold1 = 100;
    public int starThreshold2 = 200;
    public int starThreshold3 = 350;
    public string ambientAudioId;
    public string completionScene = "LevelSelect";
    public Vector2 boatStartPosition;
    public float boatStartHeading;
    public string lakeMapPath;
    public List<string> supplyDockPositions = new List<string>();
    public bool hasTimeLimit;
    public float weatherChangeFrequency = 1f;
}
