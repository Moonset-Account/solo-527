using System;
using UnityEngine;

public class GameManager : Singleton<GameManager>
{
    public event Action<GameState, GameState> OnGameStateChanged;
    public event Action<int> OnLevelStarted;
    public event Action<int> OnLevelCompleted;
    public event Action<int> OnLevelFailed;

    [SerializeField] private GameState _currentState = GameState.Menu;
    [SerializeField] private int _currentLevelIndex = -1;

    public GameState CurrentState => _currentState;
    public int CurrentLevelIndex => _currentLevelIndex;

    public LevelManager LevelManager { get; private set; }
    public OrderManager OrderManager { get; private set; }
    public ScoringManager ScoringManager { get; private set; }
    public AnalyticsManager AnalyticsManager { get; private set; }

    protected override void Awake()
    {
        base.Awake();
        LevelManager = GetComponent<LevelManager>();
        OrderManager = GetComponent<OrderManager>();
        ScoringManager = GetComponent<ScoringManager>();
        AnalyticsManager = GetComponent<AnalyticsManager>();
    }

    public void StartLevel(int levelIndex)
    {
        _currentLevelIndex = levelIndex;
        SetState(GameState.Gameplay);
        OnLevelStarted?.Invoke(levelIndex);
        EventBus.Publish(new GameEvents.LevelStartedEvent { LevelIndex = levelIndex });
    }

    public void CompleteLevel()
    {
        int completedLevel = _currentLevelIndex;
        int score = ScoringManager != null ? ScoringManager.Instance.currentScore : 0;
        int stars = LevelManager != null ? LevelManager.Instance.GetCurrentStars(score) : 0;
        SetState(GameState.Settlement);
        OnLevelCompleted?.Invoke(completedLevel);
        EventBus.Publish(new GameEvents.LevelCompletedEvent { LevelIndex = completedLevel, Score = score, Stars = stars });
    }

    public void FailLevel()
    {
        int failedLevel = _currentLevelIndex;
        SetState(GameState.Failure);
        OnLevelFailed?.Invoke(failedLevel);
        EventBus.Publish(new GameEvents.LevelFailedEvent { LevelIndex = failedLevel, Reason = "Level Failed" });
    }

    public void PauseGame()
    {
        if (_currentState == GameState.Gameplay)
        {
            SetState(GameState.Paused);
            Time.timeScale = 0f;
        }
    }

    public void ResumeGame()
    {
        if (_currentState == GameState.Paused)
        {
            SetState(GameState.Gameplay);
            Time.timeScale = 1f;
        }
    }

    public void ReturnToMenu()
    {
        Time.timeScale = 1f;
        _currentLevelIndex = -1;
        SetState(GameState.Menu);
    }

    private void SetState(GameState newState)
    {
        if (_currentState == newState)
            return;

        GameState previousState = _currentState;
        _currentState = newState;
        OnGameStateChanged?.Invoke(previousState, newState);
    }
}
