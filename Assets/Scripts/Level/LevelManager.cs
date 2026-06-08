using System.Collections.Generic;
using UnityEngine;

public class LevelManager : MonoBehaviour
{
    public static LevelManager Instance { get; private set; }

    public string CurrentLevelId { get; private set; }
    public LevelConfig CurrentConfig { get; private set; }
    public bool IsLevelActive { get; private set; }
    public float LevelElapsedTime { get; private set; }

    private float _levelStartTime;
    private bool _levelCompleted;

    public System.Action<LevelConfig> OnLevelStarted;
    public System.Action<string, int> OnLevelEnded;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    private void OnEnable()
    {
        GameEvents.LevelCompleted += HandleLevelCompleted;
    }

    private void OnDisable()
    {
        GameEvents.LevelCompleted -= HandleLevelCompleted;
    }

    private void Update()
    {
        if (!IsLevelActive || _levelCompleted) return;

        LevelElapsedTime = Time.time - _levelStartTime;

        if (CurrentConfig != null && CurrentConfig.hasTimeLimit && LevelElapsedTime >= CurrentConfig.timeLimit)
        {
            EndLevel(false);
        }
    }

    public void StartLevel(string levelId)
    {
        CurrentLevelId = levelId;
        CurrentConfig = ResLoader.Instance.LoadLevelConfig(levelId);

        if (CurrentConfig == null)
        {
            Debug.LogError($"LevelConfig not found for levelId: {levelId}");
            return;
        }

        if (!IsLevelUnlocked(levelId))
        {
            Debug.LogWarning($"Level {levelId} is not unlocked yet");
            return;
        }

        IsLevelActive = true;
        _levelCompleted = false;
        _levelStartTime = Time.time;
        LevelElapsedTime = 0f;

        InitializeWeather();
        InitializeBoat();
        InitializeSupplySystem();
        InitializeMissions();

        if (AudioTrigger.Instance != null && !string.IsNullOrEmpty(CurrentConfig.ambientAudioId))
        {
            AudioTrigger.Instance.Play(CurrentConfig.ambientAudioId, 0.5f, true);
        }

        if (UIStateManager.Instance != null)
        {
            UIStateManager.Instance.ChangeState(UIState.Gameplay);
        }

        OnLevelStarted?.Invoke(CurrentConfig);
        GameEvents.TriggerLevelStarted(levelId);
        GameEvents.TriggerAudioTriggerRequested("level_start", 0.7f);
    }

    public void EndLevel(bool success)
    {
        if (!IsLevelActive) return;

        IsLevelActive = false;
        _levelCompleted = true;

        if (MissionManager.Instance != null)
        {
            MissionManager.Instance.EndLevel();
        }

        int totalScore = MissionManager.Instance != null ? MissionManager.Instance.GetTotalScore() : 0;
        int starCount = CalculateStarCount(totalScore);

        if (SaveSystem.Instance != null)
        {
            SaveSystem.Instance.UpdateLevelSave(CurrentLevelId, totalScore, starCount, success);
            SaveSystem.Instance.AutoSave();
        }

        if (success)
        {
            UnlockNextLevels();
        }

        if (AudioTrigger.Instance != null && !string.IsNullOrEmpty(CurrentConfig.ambientAudioId))
        {
            AudioTrigger.Instance.Stop(CurrentConfig.ambientAudioId);
        }

        GameEvents.TriggerAudioTriggerRequested(success ? "level_success" : "level_fail", 0.8f);

        OnLevelEnded?.Invoke(CurrentLevelId, totalScore);

        if (UIStateManager.Instance != null)
        {
            UIStateManager.Instance.PushState(UIState.MissionResult);
        }
    }

    private void HandleLevelCompleted(string levelId, int totalScore)
    {
        if (levelId == CurrentLevelId && IsLevelActive)
        {
            EndLevel(true);
        }
    }

    public int CalculateStarCount(int totalScore)
    {
        if (CurrentConfig == null) return 0;

        if (totalScore >= CurrentConfig.starThreshold3) return 3;
        if (totalScore >= CurrentConfig.starThreshold2) return 2;
        if (totalScore >= CurrentConfig.starThreshold1) return 1;
        return 0;
    }

    public bool IsLevelUnlocked(string levelId)
    {
        if (levelId == "level_01") return true;

        var config = ResLoader.Instance.LoadLevelConfig(levelId);
        if (config == null || config.requiredLevelIds == null || config.requiredLevelIds.Count == 0)
            return false;

        if (SaveSystem.Instance == null || SaveSystem.Instance.CurrentSaveData == null) return false;

        var saveData = SaveSystem.Instance.CurrentSaveData;
        foreach (var requiredId in config.requiredLevelIds)
        {
            bool foundCompleted = false;
            if (saveData.levels != null)
            {
                foreach (var level in saveData.levels)
                {
                    if (level.levelId == requiredId && level.isCompleted)
                    {
                        foundCompleted = true;
                        break;
                    }
                }
            }
            if (!foundCompleted) return false;
        }

        return true;
    }

    private void UnlockNextLevels()
    {
    }

    private void InitializeWeather()
    {
        if (WeatherSystem.Instance == null || CurrentConfig == null) return;

        WeatherData startWeather = null;
        if (WeatherSystem.Instance.weatherPresets != null)
        {
            startWeather = WeatherSystem.Instance.weatherPresets.Find(p => p.type == CurrentConfig.startWeather);
        }

        if (startWeather != null)
        {
            WeatherSystem.Instance.InitializeWeather(startWeather);
        }
    }

    private void InitializeBoat()
    {
        var boat = FindObjectOfType<BoatController>();
        if (boat == null) return;

        boat.transform.position = new Vector3(
            CurrentConfig.boatStartPosition.x,
            boat.transform.position.y,
            CurrentConfig.boatStartPosition.y
        );
        boat.transform.rotation = Quaternion.Euler(0f, CurrentConfig.boatStartHeading, 0f);
    }

    private void InitializeSupplySystem()
    {
        var supply = FindObjectOfType<SupplySystem>();
        if (supply != null)
        {
            supply.SetStartValues(CurrentConfig.startFuel, CurrentConfig.startFood, CurrentConfig.startFilm);
        }
    }

    private void InitializeMissions()
    {
        if (MissionManager.Instance == null) return;

        MissionManager.Instance.StartLevelMissions(CurrentConfig.missions);
    }

    public void PauseLevel()
    {
        Time.timeScale = 0f;
        IsLevelActive = false;
        GameEvents.TriggerGamePaused(true);
        UIStateManager.Instance?.PushState(UIState.Paused);
    }

    public void ResumeLevel()
    {
        Time.timeScale = 1f;
        IsLevelActive = true;
        GameEvents.TriggerGamePaused(false);
        UIStateManager.Instance?.PopState();
    }

    public void RetryLevel()
    {
        Time.timeScale = 1f;
        if (CurrentConfig != null)
        {
            StartLevel(CurrentConfig.levelId);
        }
    }

    public void ReturnToLevelSelect()
    {
        Time.timeScale = 1f;
        IsLevelActive = false;
        if (SceneMgr.Instance != null && CurrentConfig != null)
        {
            SceneMgr.Instance.LoadScene(CurrentConfig.completionScene);
        }
        UIStateManager.Instance?.ChangeState(UIState.LevelSelect);
    }
}
