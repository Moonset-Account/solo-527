using System;
using UnityEngine;

[Serializable]
public class LogEntry
{
    public float timestamp;
    public string message;
    public DebugLogType category;
    public LogLevel logLevel;
}

public enum DebugLogType
{
    All,
    Core,
    Input,
    Kitchen,
    Order,
    Level,
    Player,
    Scoring,
    UI,
    Analytics,
    Audio
}

public enum LogLevel
{
    Info,
    Warning,
    Error
}
