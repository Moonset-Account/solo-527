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

    private bool _uiBuilt;

    private void Start()
    {
        if (!_uiBuilt) BuildUI();

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

    private void BuildUI()
    {
        _uiBuilt = true;

        var overlay = UIFactory.CreatePanel(transform, "PauseOverlay", false);
        var overlayRt = overlay.GetComponent<RectTransform>();
        overlayRt.anchorMin = Vector2.zero;
        overlayRt.anchorMax = Vector2.one;
        overlayRt.sizeDelta = Vector2.zero;

        var panelImg = overlay.GetComponent<Image>();
        panelImg.color = new Color(0f, 0f, 0f, 0.7f);

        var centerPanel = UIFactory.CreatePanel(overlay.transform, "PauseCenterPanel", false);
        var centerRt = centerPanel.GetComponent<RectTransform>();
        centerRt.anchorMin = new Vector2(0.5f, 0.5f);
        centerRt.anchorMax = new Vector2(0.5f, 0.5f);
        centerRt.pivot = new Vector2(0.5f, 0.5f);
        centerRt.sizeDelta = new Vector2(320f, 400f);
        centerRt.anchoredPosition = Vector2.zero;

        var container = UIFactory.CreateContainer(centerPanel.transform, "ButtonContainer");
        var containerRt = container.GetComponent<RectTransform>();
        containerRt.anchorMin = Vector2.zero;
        containerRt.anchorMax = Vector2.one;
        containerRt.sizeDelta = Vector2.zero;

        resumeButton = UIFactory.CreateButton(container, "ResumeButton", "继续", 280f, 56f);
        retryButton = UIFactory.CreateButton(container, "RetryButton", "重试", 280f, 56f);
        settingsButton = UIFactory.CreateButton(container, "SettingsButton", "设置", 280f, 56f);
        levelSelectButton = UIFactory.CreateButton(container, "LevelSelectButton", "关卡选择", 280f, 56f);
        mainMenuButton = UIFactory.CreateButton(container, "MainMenuButton", "主菜单", 280f, 56f);
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
