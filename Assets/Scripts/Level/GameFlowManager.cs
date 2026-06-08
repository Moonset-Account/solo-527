using UnityEngine;
using UnityEngine.SceneManagement;

public class GameFlowManager : MonoBehaviour
{
    public static GameFlowManager Instance { get; private set; }

    public enum GamePhase
    {
        None,
        MainMenu,
        LevelSelect,
        Gameplay,
        Paused,
        Result,
        Collection,
        Settings,
        Map,
        SupplyPanel,
        RoutePlanner
    }

    public GamePhase CurrentPhase { get; private set; } = GamePhase.None;

    public void SetPhase(GamePhase phase)
    {
        CurrentPhase = phase;
    }

    private string _pendingLevelId;

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
        GameEvents.InputActionTriggered += HandleInputAction;
        if (UIStateManager.Instance != null)
            UIStateManager.Instance.OnStateChanged += HandleUIStateChanged;
    }

    private void OnDisable()
    {
        GameEvents.InputActionTriggered -= HandleInputAction;
        if (UIStateManager.Instance != null)
            UIStateManager.Instance.OnStateChanged -= HandleUIStateChanged;
    }

    private void HandleUIStateChanged(UIState previous, UIState current)
    {
        CurrentPhase = UIStateToPhase(current);
    }

    private GamePhase UIStateToPhase(UIState state)
    {
        switch (state)
        {
            case UIState.MainMenu: return GamePhase.MainMenu;
            case UIState.LevelSelect: return GamePhase.LevelSelect;
            case UIState.Gameplay: return GamePhase.Gameplay;
            case UIState.Paused: return GamePhase.Paused;
            case UIState.MissionResult: return GamePhase.Result;
            case UIState.Collection: return GamePhase.Collection;
            case UIState.Settings: return GamePhase.Settings;
            case UIState.Map: return GamePhase.Map;
            case UIState.SupplyPanel: return GamePhase.SupplyPanel;
            case UIState.RoutePlanner: return GamePhase.RoutePlanner;
            default: return GamePhase.None;
        }
    }

    private void HandleInputAction(string action)
    {
        switch (action)
        {
            case "Pause":
                if (CurrentPhase == GamePhase.Gameplay)
                    LevelManager.Instance?.PauseLevel();
                else if (CurrentPhase == GamePhase.Paused)
                    LevelManager.Instance?.ResumeLevel();
                break;

            case "Cancel":
                HandleCancel();
                break;

            case "OpenMap":
                if (CurrentPhase == GamePhase.Gameplay)
                    UIStateManager.Instance?.PushState(UIState.Map);
                break;

            case "OpenSupply":
                if (CurrentPhase == GamePhase.Gameplay)
                    UIStateManager.Instance?.PushState(UIState.SupplyPanel);
                break;

            case "OpenCollection":
                if (CurrentPhase == GamePhase.MainMenu || CurrentPhase == GamePhase.LevelSelect)
                    UIStateManager.Instance?.PushState(UIState.Collection);
                break;
        }
    }

    private void HandleCancel()
    {
        var uiMgr = UIStateManager.Instance;
        if (uiMgr == null) return;

        switch (CurrentPhase)
        {
            case GamePhase.Paused:
                LevelManager.Instance?.ResumeLevel();
                break;
            case GamePhase.Map:
            case GamePhase.SupplyPanel:
                uiMgr.PopState();
                break;
            case GamePhase.Collection:
            case GamePhase.Settings:
                uiMgr.PopState();
                break;
            case GamePhase.Result:
                ReturnToLevelSelect();
                break;
        }
    }

    public void StartNewGame(int slotIndex)
    {
        if (SaveSystem.Instance != null)
        {
            SaveSystem.Instance.SetCurrentSlot(slotIndex);

            if (SaveSystem.Instance.HasSave(slotIndex))
            {
                SaveSystem.Instance.Load(slotIndex);
            }
            else
            {
                SaveSystem.Instance.UpdatePlayerProfile("Player", 0, 0);
                SaveSystem.Instance.SaveToSlot(slotIndex);
            }
        }

        GoToLevelSelect();
    }

    public void ContinueGame(int slotIndex)
    {
        if (SaveSystem.Instance != null && SaveSystem.Instance.HasSave(slotIndex))
        {
            SaveSystem.Instance.SetCurrentSlot(slotIndex);
            SaveSystem.Instance.Load(slotIndex);
            RestoreGameSettings();
            GoToLevelSelect();
        }
    }

    public void GoToMainMenu()
    {
        if (SceneMgr.Instance != null)
            SceneMgr.Instance.LoadScene("MainMenu");

        UIStateManager.Instance?.ChangeState(UIState.MainMenu);
        CurrentPhase = GamePhase.MainMenu;
    }

    public void GoToLevelSelect()
    {
        if (SceneMgr.Instance != null)
            SceneMgr.Instance.LoadScene("LevelSelect");

        UIStateManager.Instance?.ChangeState(UIState.LevelSelect);
        CurrentPhase = GamePhase.LevelSelect;
    }

    public void SelectLevel(string levelId)
    {
        _pendingLevelId = levelId;

        if (LevelManager.Instance == null || !LevelManager.Instance.IsLevelUnlocked(levelId))
        {
            GameEvents.TriggerAudioTriggerRequested("ui_locked", 0.5f);
            return;
        }

        var config = ResLoader.Instance.LoadLevelConfig(levelId);
        string sceneName = config != null && !string.IsNullOrEmpty(config.sceneName)
            ? config.sceneName
            : "Gameplay";

        if (SceneMgr.Instance != null)
            SceneMgr.Instance.LoadScene(sceneName);
        else
            SceneManager.LoadScene(sceneName);
    }

    public void OnGameplaySceneReady()
    {
        if (!string.IsNullOrEmpty(_pendingLevelId))
        {
            LevelManager.Instance?.StartLevel(_pendingLevelId);
            _pendingLevelId = null;
        }
    }

    public void CompleteLevel()
    {
        if (LevelManager.Instance != null)
        {
            LevelManager.Instance.EndLevel(true);
        }
    }

    public void ReturnToLevelSelect()
    {
        Time.timeScale = 1f;
        LevelManager.Instance?.ReturnToLevelSelect();
    }

    public void OpenSettings()
    {
        UIStateManager.Instance?.PushState(UIState.Settings);
    }

    public void OpenCollection()
    {
        UIStateManager.Instance?.PushState(UIState.Collection);
    }

    private void RestoreGameSettings()
    {
        if (SaveSystem.Instance == null || SaveSystem.Instance.CurrentSaveData == null) return;

        var settings = SaveSystem.Instance.CurrentSaveData.settings;
        if (AudioTrigger.Instance != null)
        {
            AudioTrigger.Instance.SetMusicVolume(settings.musicVolume);
            AudioTrigger.Instance.SetSFXVolume(settings.sfxVolume);
        }

        if (WeatherSystem.Instance != null)
        {
            WeatherSystem.Instance.weatherTimeScale = settings.weatherTimeScale;
        }

        QualitySettings.SetQualityLevel(settings.qualityLevel, true);
    }
}
