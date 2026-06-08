using UnityEngine;
using System.Collections.Generic;

public class GameBootstrapper : MonoBehaviour
{
    [SerializeField] private string levelDataResourcesPath = "Data/Levels";
    private List<LevelData> loadedLevelDatas = new List<LevelData>();

    private void Awake()
    {
        GameInputActions.CreateAsset();
    }

    private void Start()
    {
        LoadLevelDataAssets();
        SubscribeEvents();
    }

    private void LoadLevelDataAssets()
    {
        LevelData[] levelDatas = Resources.LoadAll<LevelData>(levelDataResourcesPath);
        loadedLevelDatas = new List<LevelData>(levelDatas);
    }

    private void SubscribeEvents()
    {
        EventBus.Subscribe<GameEvents.LevelStartedEvent>(OnLevelStarted);
        EventBus.Subscribe<GameEvents.LevelCompletedEvent>(OnLevelCompleted);
        EventBus.Subscribe<GameEvents.LevelFailedEvent>(OnLevelFailed);
    }

    private void OnLevelStarted(GameEvents.LevelStartedEvent e)
    {
        if (DebugLogger.Instance != null)
            DebugLogger.Instance.Log($"Level {e.LevelIndex} started", DebugLogType.Core);
    }

    private void OnLevelCompleted(GameEvents.LevelCompletedEvent e)
    {
        if (DebugLogger.Instance != null)
            DebugLogger.Instance.Log($"Level {e.LevelIndex} completed: score={e.Score} stars={e.Stars}", DebugLogType.Core);
    }

    private void OnLevelFailed(GameEvents.LevelFailedEvent e)
    {
        if (DebugLogger.Instance != null)
            DebugLogger.Instance.Log($"Level {e.LevelIndex} failed: {e.Reason}", DebugLogType.Core);
    }

    private void OnDestroy()
    {
        EventBus.Unsubscribe<GameEvents.LevelStartedEvent>(OnLevelStarted);
        EventBus.Unsubscribe<GameEvents.LevelCompletedEvent>(OnLevelCompleted);
        EventBus.Unsubscribe<GameEvents.LevelFailedEvent>(OnLevelFailed);
    }
}
