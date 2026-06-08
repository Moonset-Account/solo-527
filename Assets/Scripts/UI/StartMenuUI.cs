using UnityEngine;
using UnityEngine.UI;

public class StartMenuUI : MonoBehaviour
{
    public Button startButton;
    public Button tutorialButton;
    public Button levelSelectButton;
    public Button settingsButton;
    public Button quitButton;

    private void Start()
    {
        startButton.onClick.AddListener(OnStartClicked);
        tutorialButton.onClick.AddListener(OnTutorialClicked);
        levelSelectButton.onClick.AddListener(OnLevelSelectClicked);
        settingsButton.onClick.AddListener(OnSettingsClicked);
        quitButton.onClick.AddListener(OnQuitClicked);
    }

    private void OnDestroy()
    {
        startButton.onClick.RemoveListener(OnStartClicked);
        tutorialButton.onClick.RemoveListener(OnTutorialClicked);
        levelSelectButton.onClick.RemoveListener(OnLevelSelectClicked);
        settingsButton.onClick.RemoveListener(OnSettingsClicked);
        quitButton.onClick.RemoveListener(OnQuitClicked);
    }

    private void OnStartClicked()
    {
        SceneFlowManager.Instance.LoadScene("Gameplay");
    }

    private void OnTutorialClicked()
    {
        SceneFlowManager.Instance.LoadScene("Tutorial");
    }

    private void OnLevelSelectClicked()
    {
        UIManager.Instance.ShowPanel(GameState.LevelSelect);
    }

    private void OnSettingsClicked()
    {
        UIManager.Instance.ShowPanel(GameState.Menu);
    }

    private void OnQuitClicked()
    {
        Application.Quit();
    }
}
