using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

public class AnalyticsManager : Singleton<AnalyticsManager>
{
    public PlaySessionData currentSession;
    public List<PlaySessionData> sessionHistory = new List<PlaySessionData>();
    public float autoSaveInterval = 30f;
    public string savePath = Application.persistentDataPath + "/analytics/";

    private float autoSaveTimer;

    private void Update()
    {
        if (currentSession == null) return;

        autoSaveTimer += Time.deltaTime;
        if (autoSaveTimer >= autoSaveInterval)
        {
            autoSaveTimer = 0f;
            SaveSession();
        }
    }

    public void StartSession(int level, int players, bool solo)
    {
        currentSession = new PlaySessionData
        {
            sessionID = Guid.NewGuid().ToString(),
            levelIndex = level,
            playerCount = players,
            isSoloMode = solo,
            startTime = DateTime.Now,
            ordersCompleted = 0,
            ordersFailed = 0,
            score = 0,
            starsEarned = 0,
            failureCount = 0
        };
        autoSaveTimer = 0f;
    }

    public void EndSession()
    {
        if (currentSession == null) return;

        currentSession.endTime = DateTime.Now;
        currentSession.totalTimeSeconds = (float)(currentSession.endTime - currentSession.startTime).TotalSeconds;

        if (LevelManager.HasInstance && LevelManager.Instance.currentLevelData != null)
        {
            currentSession.score = ScoringManager.HasInstance ? ScoringManager.Instance.currentScore : 0;
            currentSession.starsEarned = ScoringManager.HasInstance ? ScoringManager.Instance.CalculateStars(
                currentSession.score, LevelManager.Instance.currentLevelData) : 0;
        }

        sessionHistory.Add(currentSession);
        SaveSession();
        currentSession = null;
    }

    public void RecordKeyChoice(KeyChoice choice)
    {
        if (currentSession == null) return;
        currentSession.keyChoices.Add(choice);
    }

    public void RecordCheckpoint()
    {
        if (currentSession == null) return;

        var checkpoint = new CheckpointData
        {
            timestamp = (float)(DateTime.Now - currentSession.startTime).TotalSeconds,
            score = ScoringManager.HasInstance ? ScoringManager.Instance.currentScore : 0,
            ordersCompleted = OrderManager.HasInstance ? OrderManager.Instance.completedOrders.Count : 0,
            activeOrders = OrderManager.HasInstance ? OrderManager.Instance.activeOrders.Count : 0,
            failureCount = currentSession.failureCount
        };
        currentSession.checkpoints.Add(checkpoint);
    }

    public void RecordFailure()
    {
        if (currentSession == null) return;
        currentSession.failureCount++;
    }

    public void SaveSession()
    {
        if (currentSession == null) return;

        if (!Directory.Exists(savePath))
            Directory.CreateDirectory(savePath);

        string fileName = $"session_{currentSession.sessionID}.json";
        string filePath = Path.Combine(savePath, fileName);
        string json = currentSession.ToJson();
        File.WriteAllText(filePath, json);
    }

    public void LoadSessionHistory()
    {
        sessionHistory.Clear();

        if (!Directory.Exists(savePath)) return;

        string[] files = Directory.GetFiles(savePath, "session_*.json");
        foreach (string file in files)
        {
            try
            {
                string json = File.ReadAllText(file);
                var session = PlaySessionData.FromJson(json);
                if (session != null)
                    sessionHistory.Add(session);
            }
            catch
            {
            }
        }
    }

    private void OnEnable()
    {
        if (GameManager.HasInstance)
            GameManager.Instance.OnLevelStarted += OnLevelStarted;

        EventBus.Subscribe<GameEvents.OrderCompletedEvent>(OnOrderCompleted);
        EventBus.Subscribe<GameEvents.OrderFailedEvent>(OnOrderFailed);
    }

    private void OnDisable()
    {
        if (GameManager.HasInstance)
            GameManager.Instance.OnLevelStarted -= OnLevelStarted;

        EventBus.Unsubscribe<GameEvents.OrderCompletedEvent>(OnOrderCompleted);
        EventBus.Unsubscribe<GameEvents.OrderFailedEvent>(OnOrderFailed);
    }

    private void OnLevelStarted(int levelIndex)
    {
        int players = PlayerManager.HasInstance ? PlayerManager.Instance.activePlayerCount : 1;
        bool solo = PlayerManager.HasInstance && PlayerManager.Instance.isSoloMode;
        StartSession(levelIndex, players, solo);
    }

    private void OnOrderCompleted(GameEvents.OrderCompletedEvent evt)
    {
        if (currentSession != null)
            currentSession.ordersCompleted++;
    }

    private void OnOrderFailed(GameEvents.OrderFailedEvent evt)
    {
        if (currentSession != null)
            currentSession.ordersFailed++;
        RecordFailure();
    }
}
