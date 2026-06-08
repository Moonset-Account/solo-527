using System.Collections.Generic;
using System.IO;
using UnityEngine;

public class DebugLogger : Singleton<DebugLogger>
{
    public List<LogEntry> logEntries = new List<LogEntry>();
    public int maxEntries = 500;
    public bool isLogEnabled = true;
    public DebugLogType logFilter = DebugLogType.All;

    private bool showOverlay;
    private Vector2 scrollPosition;
    private const string ToggleKey = "f1";

    private void Update()
    {
        if (Input.GetKeyDown(KeyCode.F1))
            showOverlay = !showOverlay;
    }

    public void Log(string message, DebugLogType category)
    {
        if (!isLogEnabled) return;
        if (logFilter != DebugLogType.All && category != logFilter) return;

        AddEntry(message, category, LogLevel.Info);
    }

    public void LogWarning(string message, DebugLogType category)
    {
        if (!isLogEnabled) return;
        if (logFilter != DebugLogType.All && category != logFilter) return;

        AddEntry(message, category, LogLevel.Warning);
    }

    public void LogError(string message, DebugLogType category)
    {
        if (!isLogEnabled) return;
        if (logFilter != DebugLogType.All && category != logFilter) return;

        AddEntry(message, category, LogLevel.Error);
    }

    public void ClearLogs()
    {
        logEntries.Clear();
    }

    public string ExportLogs()
    {
        var sb = new System.Text.StringBuilder();
        foreach (var entry in logEntries)
        {
            sb.AppendLine($"[{entry.timestamp:F2}][{entry.logLevel}][{entry.category}] {entry.message}");
        }
        return sb.ToString();
    }

    public void SaveLogToFile()
    {
        string dir = Application.persistentDataPath + "/logs/";
        if (!Directory.Exists(dir))
            Directory.CreateDirectory(dir);

        string filePath = dir + $"log_{System.DateTime.Now:yyyyMMdd_HHmmss}.txt";
        File.WriteAllText(filePath, ExportLogs());
    }

    private void AddEntry(string message, DebugLogType category, LogLevel level)
    {
        var entry = new LogEntry
        {
            timestamp = Time.time,
            message = message,
            category = category,
            logLevel = level
        };

        logEntries.Add(entry);

        if (logEntries.Count > maxEntries)
            logEntries.RemoveAt(0);
    }

    private void OnGUI()
    {
        if (!showOverlay) return;

        float width = Screen.width * 0.5f;
        float height = Screen.height * 0.6f;
        float x = Screen.width - width - 10;
        float y = 10;

        GUI.Box(new Rect(x, y, width, height), "Debug Log");

        float toolbarHeight = 30f;
        float contentY = y + toolbarHeight;
        float contentHeight = height - toolbarHeight - 30f;

        GUILayout.BeginArea(new Rect(x + 5, y + 25, width - 10, toolbarHeight));
        GUILayout.BeginHorizontal();

        if (GUILayout.Button("Clear"))
            ClearLogs();

        if (GUILayout.Button("Save"))
            SaveLogToFile();

        isLogEnabled = GUILayout.Toggle(isLogEnabled, "Enabled");

        GUILayout.EndHorizontal();
        GUILayout.EndArea();

        scrollPosition = GUI.BeginScrollView(
            new Rect(x + 5, contentY, width - 10, contentHeight),
            scrollPosition,
            new Rect(0, 0, width - 30, logEntries.Count * 20f));

        for (int i = 0; i < logEntries.Count; i++)
        {
            LogEntry entry = logEntries[i];
            Color color = GetLogColor(entry.logLevel);
            GUI.color = color;
            GUI.Label(new Rect(0, i * 20f, width - 30, 20f),
                $"[{entry.timestamp:F1}][{entry.category}] {entry.message}");
        }

        GUI.EndScrollView();
        GUI.color = Color.white;
    }

    private Color GetLogColor(LogLevel level)
    {
        switch (level)
        {
            case LogLevel.Warning: return Color.yellow;
            case LogLevel.Error: return Color.red;
            default: return Color.white;
        }
    }
}
