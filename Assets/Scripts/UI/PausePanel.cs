using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class PausePanel : MonoBehaviour
{
    [SerializeField] private Button resumeButton;
    [SerializeField] private Button retryButton;
    [SerializeField] private Button settingsButton;
    [SerializeField] private Button levelSelectButton;
    [SerializeField] private Button mainMenuButton;

    private void Start()
    {
        if (resumeButton != null)
            resumeButton.onClick.AddListener(OnResumeClicked);

        if (retryButton != null)
            retryButton.onClick.AddListener(OnRetryClicked);

        if (settingsButton != null)
            settingsButton.onClick.AddListener(OnSettingsClicked);

        if (levelSelectButton != null)
            levelSelectButton.onClick.AddListener(OnLevelSelectClicked);

        if (mainMenuButton != null)
            mainMenuButton.onClick.AddListener(OnMainMenuClicked);
    }

    private void OnResumeClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_click", 0.5f);

        if (LevelManager.Instance != null)
            LevelManager.Instance.ResumeLevel();
    }

    private void OnRetryClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_click", 0.5f);

        if (LevelManager.Instance != null)
            LevelManager.Instance.RetryLevel();
    }

    private void OnSettingsClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_click", 0.5f);

        if (UIStateManager.Instance != null)
            UIStateManager.Instance.PushState(UIState.Settings);
    }

    private void OnLevelSelectClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_click", 0.5f);

        if (GameFlowManager.Instance != null)
            GameFlowManager.Instance.ReturnToLevelSelect();
    }

    private void OnMainMenuClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_click", 0.5f);

        Time.timeScale = 1f;

        if (GameFlowManager.Instance != null)
            GameFlowManager.Instance.GoToMainMenu();
    }
}
