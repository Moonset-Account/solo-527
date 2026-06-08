using System;
using System.Collections.Generic;
using UnityEngine;

[Serializable]
public class StringIntPair
{
    public string key;
    public int value;

    public StringIntPair(string key, int value)
    {
        this.key = key;
        this.value = value;
    }
}

[Serializable]
public class StringStringPair
{
    public string key;
    public string value;

    public StringStringPair(string key, string value)
    {
        this.key = key;
        this.value = value;
    }
}

[Serializable]
public class LevelSaveData
{
    public string levelId;
    public bool isUnlocked;
    public int bestScore;
    [Range(0, 3)]
    public int starCount;
    public bool isCompleted;
    public int attemptCount;
    public List<StringIntPair> missionBestScores = new List<StringIntPair>();

    public Dictionary<string, int> GetMissionBestScoresDict()
    {
        var dict = new Dictionary<string, int>();
        foreach (var pair in missionBestScores)
            dict[pair.key] = pair.value;
        return dict;
    }

    public static void SetMissionBestScoresFromDict(LevelSaveData data, Dictionary<string, int> dict)
    {
        data.missionBestScores.Clear();
        foreach (var kvp in dict)
            data.missionBestScores.Add(new StringIntPair(kvp.Key, kvp.Value));
    }
}

[Serializable]
public class CollectionEntry
{
    public string id;
    public string unlockedTime;
    public int viewCount;

    public DateTime GetUnlockedTime()
    {
        return DateTime.TryParse(unlockedTime, out var dt) ? dt : DateTime.MinValue;
    }

    public void SetUnlockedTime(DateTime time)
    {
        unlockedTime = time.ToString("o");
    }
}

[Serializable]
public class CollectionSaveData
{
    public List<string> unlockedItemIds = new List<string>();
    public List<CollectionEntry> entries = new List<CollectionEntry>();
}

[Serializable]
public class SettingsSaveData
{
    public float musicVolume = 1f;
    public float sfxVolume = 1f;
    public int qualityLevel;
    public string language = "en";
    public bool showWeatherWarnings = true;
    public float weatherTimeScale = 1f;
    public List<StringStringPair> inputBindings = new List<StringStringPair>();

    public Dictionary<string, string> GetInputBindingsDict()
    {
        var dict = new Dictionary<string, string>();
        foreach (var pair in inputBindings)
            dict[pair.key] = pair.value;
        return dict;
    }

    public static void SetInputBindingsFromDict(SettingsSaveData data, Dictionary<string, string> dict)
    {
        data.inputBindings.Clear();
        foreach (var kvp in dict)
            data.inputBindings.Add(new StringStringPair(kvp.Key, kvp.Value));
    }
}

[Serializable]
public class PlayerProfile
{
    public string playerName = "";
    public int totalScore;
    public int levelsCompleted;
    public string firstPlayDate;

    public DateTime GetFirstPlayDate()
    {
        return DateTime.TryParse(firstPlayDate, out var dt) ? dt : DateTime.MinValue;
    }

    public void SetFirstPlayDate(DateTime date)
    {
        firstPlayDate = date.ToString("o");
    }
}

[Serializable]
public class SaveData
{
    public string version = "1.0";
    public string saveTime;
    public int totalPlayTimeSeconds;
    public LevelSaveData[] levels = new LevelSaveData[0];
    public CollectionSaveData collection = new CollectionSaveData();
    public SettingsSaveData settings = new SettingsSaveData();
    public PlayerProfile profile = new PlayerProfile();
    public List<StringStringPair> customData = new List<StringStringPair>();

    public DateTime GetSaveTime()
    {
        return DateTime.TryParse(saveTime, out var dt) ? dt : DateTime.MinValue;
    }

    public void SetSaveTime(DateTime time)
    {
        saveTime = time.ToString("o");
    }

    public Dictionary<string, string> GetCustomDataDict()
    {
        var dict = new Dictionary<string, string>();
        foreach (var pair in customData)
            dict[pair.key] = pair.value;
        return dict;
    }

    public void SetCustomDataFromDict(Dictionary<string, string> dict)
    {
        customData.Clear();
        foreach (var kvp in dict)
            customData.Add(new StringStringPair(kvp.Key, kvp.Value));
    }

    public void SetCustomValue(string key, string value)
    {
        for (int i = 0; i < customData.Count; i++)
        {
            if (customData[i].key == key)
            {
                customData[i].value = value;
                return;
            }
        }
        customData.Add(new StringStringPair(key, value));
    }

    public string GetCustomValue(string key)
    {
        foreach (var pair in customData)
        {
            if (pair.key == key)
                return pair.value;
        }
        return null;
    }
}

[Serializable]
public class SaveSlotPreview
{
    public string levelId;
    public string saveTime;
    public int totalScore;
    public string playerName;

    public DateTime GetSaveTime()
    {
        return DateTime.TryParse(saveTime, out var dt) ? dt : DateTime.MinValue;
    }
}
