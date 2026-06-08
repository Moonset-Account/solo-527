using UnityEngine;
using System;
using System.Collections.Generic;

[System.Serializable]
public class SaveData
{
    public string saveId;
    public string levelId;
    public int currentWeek;
    public TeamData teamData;
    public List<MatchData> matchHistory;
    public string lastSaveTime;

    public static SaveData CreateFromCurrent(string id)
    {
        var gm = GameManager.Instance;
        return new SaveData
        {
            saveId = id,
            levelId = gm.currentLevel != null ? gm.currentLevel.levelId : "",
            currentWeek = gm.currentWeek,
            teamData = gm.currentTeam,
            matchHistory = gm.currentLevel != null ? gm.currentLevel.scheduledMatches : new List<MatchData>(),
            lastSaveTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
        };
    }
}
