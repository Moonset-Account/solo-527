using System.Collections.Generic;
using System.IO;
using UnityEngine;

public class GameDataRecorder : MonoBehaviour
{
    public static GameDataRecorder Instance { get; private set; }

    private Dictionary<string, int> _sessionStats = new Dictionary<string, int>();
    private List<PlaySessionRecord> _sessionRecords = new List<PlaySessionRecord>();
    private float _sessionStartTime;
    private string _currentLevelId;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    private void OnEnable()
    {
        GameEvents.LevelStarted += HandleLevelStarted;
        GameEvents.LevelCompleted += HandleLevelCompleted;
        GameEvents.MissionCompleted += HandleMissionCompleted;
        GameEvents.MissionPhotoTaken += HandlePhotoTaken;
        GameEvents.SupplyDepleted += HandleSupplyDepleted;
        GameEvents.WeatherWarning += HandleWeatherWarning;
    }

    private void OnDisable()
    {
        GameEvents.LevelStarted -= HandleLevelStarted;
        GameEvents.LevelCompleted -= HandleLevelCompleted;
        GameEvents.MissionCompleted -= HandleMissionCompleted;
        GameEvents.MissionPhotoTaken -= HandlePhotoTaken;
        GameEvents.SupplyDepleted -= HandleSupplyDepleted;
        GameEvents.WeatherWarning -= HandleWeatherWarning;
    }

    private void HandleLevelStarted(string levelId)
    {
        StartSession(levelId);
    }

    public void StartSession(string levelId)
    {
        _currentLevelId = levelId;
        _sessionStartTime = Time.time;
        _sessionStats.Clear();
        IncrementStat("sessions_played");
    }

    public void EndSession()
    {
        float duration = Time.time - _sessionStartTime;

        var record = new PlaySessionRecord
        {
            levelId = _currentLevelId,
            durationSeconds = duration,
            photosTaken = GetStat("photos_taken"),
            missionsCompleted = GetStat("missions_completed"),
            supplyDepletions = GetStat("supply_depletions"),
            warningsReceived = GetStat("warnings_received"),
            timestamp = System.DateTime.Now.ToString("o")
        };

        _sessionRecords.Add(record);
        SaveSessionRecord(record);
    }

    private void HandleLevelCompleted(string levelId, int totalScore)
    {
        IncrementStat("levels_completed");
        SetStat("last_level_score", totalScore);
        EndSession();
    }

    private void HandleMissionCompleted(string missionId, int score)
    {
        IncrementStat("missions_completed");
    }

    private void HandlePhotoTaken(string photoId, int quality)
    {
        IncrementStat("photos_taken");
    }

    private void HandleSupplyDepleted(SupplyType type)
    {
        IncrementStat("supply_depletions");
    }

    private void HandleWeatherWarning(WeatherType type, float seconds)
    {
        IncrementStat("warnings_received");
    }

    public void IncrementStat(string key)
    {
        if (_sessionStats.ContainsKey(key))
            _sessionStats[key]++;
        else
            _sessionStats[key] = 1;

        if (SaveSystem.Instance != null && SaveSystem.Instance.CurrentSaveData != null)
        {
            string current = SaveSystem.Instance.CurrentSaveData.GetCustomValue("stat_" + key);
            int total = 0;
            if (!string.IsNullOrEmpty(current) && int.TryParse(current, out int parsed))
                total = parsed;
            SaveSystem.Instance.CurrentSaveData.SetCustomValue("stat_" + key, (total + 1).ToString());
        }
    }

    public void SetStat(string key, int value)
    {
        _sessionStats[key] = value;

        if (SaveSystem.Instance != null && SaveSystem.Instance.CurrentSaveData != null)
        {
            SaveSystem.Instance.CurrentSaveData.SetCustomValue("stat_" + key, value.ToString());
        }
    }

    public int GetStat(string key)
    {
        return _sessionStats.ContainsKey(key) ? _sessionStats[key] : 0;
    }

    public int GetTotalStat(string key)
    {
        if (SaveSystem.Instance != null && SaveSystem.Instance.CurrentSaveData != null)
        {
            string val = SaveSystem.Instance.CurrentSaveData.GetCustomValue("stat_" + key);
            if (!string.IsNullOrEmpty(val) && int.TryParse(val, out int parsed))
                return parsed;
        }
        return 0;
    }

    private void SaveSessionRecord(PlaySessionRecord record)
    {
        string dir = Path.Combine(Application.persistentDataPath, "Stats");
        if (!Directory.Exists(dir))
            Directory.CreateDirectory(dir);

        string filename = $"session_{record.timestamp.Replace(":", "-").Replace(".", "_")}.json";
        string path = Path.Combine(dir, filename);

        try
        {
            string json = JsonUtility.ToJson(record, true);
            File.WriteAllText(path, json);
        }
        catch (System.Exception e)
        {
            Debug.LogWarning($"Failed to save session record: {e.Message}");
        }
    }

    public Dictionary<string, int> GetAllTimeStats()
    {
        var stats = new Dictionary<string, int>();
        if (SaveSystem.Instance == null || SaveSystem.Instance.CurrentSaveData == null) return stats;

        var custom = SaveSystem.Instance.CurrentSaveData.GetCustomDataDict();
        foreach (var kvp in custom)
        {
            if (kvp.Key.StartsWith("stat_"))
            {
                string statKey = kvp.Key.Substring(5);
                if (int.TryParse(kvp.Value, out int val))
                    stats[statKey] = val;
            }
        }

        return stats;
    }
}

[System.Serializable]
public class PlaySessionRecord
{
    public string levelId;
    public float durationSeconds;
    public int photosTaken;
    public int missionsCompleted;
    public int supplyDepletions;
    public int warningsReceived;
    public string timestamp;
}
