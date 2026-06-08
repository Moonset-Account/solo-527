using UnityEngine;
using UnityEngine.UI;

namespace InkMountainBridge
{
    public class UIManager : MonoBehaviour
    {
        public static UIManager Instance { get; private set; }

        public UITextConfig uiTextConfig;
        public GameObject hudPanel;
        public GameObject buildPanel;
        public GameObject testPanel;
        public GameObject settlementPanel;
        public GameObject tutorialPanel;
        public GameObject pausePanel;
        public GameObject failPromptPanel;

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
            GameEvents.OnPhaseChanged += HandlePhaseChanged;
            GameEvents.OnLevelFailed += HandleLevelFailed;
        }

        private void OnDisable()
        {
            GameEvents.OnPhaseChanged -= HandlePhaseChanged;
            GameEvents.OnLevelFailed -= HandleLevelFailed;
        }

        private void HandlePhaseChanged(GameState state)
        {
            switch (state)
            {
                case GameState.Building:
                    ShowBuildPanel();
                    break;
                case GameState.Testing:
                    ShowTestPanel();
                    break;
                case GameState.Settlement:
                    break;
                case GameState.Paused:
                    ShowPauseMenu();
                    break;
            }
        }

        private void HandleLevelFailed(string reason)
        {
            ShowFailPrompt(reason);
        }

        public void ShowHUD()
        {
            HideAll();
            hudPanel.SetActive(true);
        }

        public void ShowBuildPanel()
        {
            HideAll();
            hudPanel.SetActive(true);
            buildPanel.SetActive(true);
        }

        public void ShowTestPanel()
        {
            HideAll();
            hudPanel.SetActive(true);
            testPanel.SetActive(true);
        }

        public void ShowSettlement(LevelResult result)
        {
            HideAll();
            settlementPanel.SetActive(true);
        }

        public void ShowTutorial(string[] steps)
        {
            HideAll();
            tutorialPanel.SetActive(true);
            var controller = tutorialPanel.GetComponent<TutorialController>();
            if (controller != null)
                controller.StartTutorial(steps);
        }

        public void ShowPauseMenu()
        {
            pausePanel.SetActive(true);
        }

        public void ShowFailPrompt(string reason)
        {
            HideAll();
            failPromptPanel.SetActive(true);
            var controller = failPromptPanel.GetComponent<FailPromptController>();
            if (controller != null)
                controller.Show(reason);
        }

        public void HideAll()
        {
            hudPanel.SetActive(false);
            buildPanel.SetActive(false);
            testPanel.SetActive(false);
            settlementPanel.SetActive(false);
            tutorialPanel.SetActive(false);
            pausePanel.SetActive(false);
            failPromptPanel.SetActive(false);
        }
    }
}
