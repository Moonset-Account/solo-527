using System;
using System.Collections.Generic;
using UnityEngine;

[Serializable]
public class PlaySessionData
{
    public string sessionID;
    public int levelIndex;
    public int playerCount;
    public bool isSoloMode;
    public DateTime startTime;
    public DateTime endTime;
    public float totalTimeSeconds;
    public int ordersCompleted;
    public int ordersFailed;
    public int score;
    public int starsEarned;
    public int failureCount;
    public List<KeyChoice> keyChoices = new List<KeyChoice>();
    public List<CheckpointData> checkpoints = new List<CheckpointData>();

    public string ToJson()
    {
        return JsonUtility.ToJson(this, true);
    }

    public static PlaySessionData FromJson(string json)
    {
        return JsonUtility.FromJson<PlaySessionData>(json);
    }
}
