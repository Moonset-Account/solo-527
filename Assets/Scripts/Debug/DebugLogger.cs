using UnityEngine;
using System;
using System.Collections.Generic;
using System.IO;

public enum GameLogType
{
    Info,
    Warning,
    Error
}

public class DebugLogger : MonoBehaviour
{
    public static DebugLogger Instance;

    public bool isEnabled = true;
    public int maxLogEntries = 200;
    public List<LogEntry> logEntries = new List<LogEntry>();

    public class LogEntry
    {
        public string timestamp;
        public string category;
        public string message;
        public GameLogType type;
    }

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

    public void Log(string category, string message)
    {
        if (!isEnabled) return;
        AddEntry(category, message, GameLogType.Info);
        Debug.Log("[" + category + "] " + message);
    }

    public void LogWarning(string category, string message)
    {
        if (!isEnabled) return;
        AddEntry(category, message, GameLogType.Warning);
        Debug.LogWarning("[" + category + "] " + message);
    }

    public void LogError(string category, string message)
    {
        if (!isEnabled) return;
        AddEntry(category, message, GameLogType.Error);
        Debug.LogError("[" + category + "] " + message);
    }

    public List<LogEntry> GetRecentEntries(int count)
    {
        int startIndex = Mathf.Max(0, logEntries.Count - count);
        return logEntries.GetRange(startIndex, logEntries.Count - startIndex);
    }

    public List<LogEntry> GetEntriesByCategory(string category)
    {
        List<LogEntry> result = new List<LogEntry>();
        for (int i = 0; i < logEntries.Count; i++)
        {
            if (logEntries[i].category == category)
            {
                result.Add(logEntries[i]);
            }
        }
        return result;
    }

    public void Clear()
    {
        logEntries.Clear();
    }

    public void Toggle(bool enabled)
    {
        isEnabled = enabled;
    }

    public void ExportToFile(string path)
    {
        using (StreamWriter writer = new StreamWriter(path, false))
        {
            for (int i = 0; i < logEntries.Count; i++)
            {
                LogEntry entry = logEntries[i];
                writer.WriteLine("[" + entry.timestamp + "] [" + entry.type + "] [" + entry.category + "] " + entry.message);
            }
        }
    }

    void AddEntry(string category, string message, GameLogType type)
    {
        LogEntry entry = new LogEntry
        {
            timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"),
            category = category,
            message = message,
            type = type
        };
        logEntries.Add(entry);
        if (logEntries.Count > maxLogEntries)
        {
            logEntries.RemoveAt(0);
        }
    }
}
