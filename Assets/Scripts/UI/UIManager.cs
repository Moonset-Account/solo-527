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

            AutoFindPanels();
        }

        private void AutoFindPanels()
        {
            if (hudPanel == null) hudPanel = FindChildByName("HUDPanel");
            if (buildPanel == null) buildPanel = FindChildByName("BuildPanel");
            if (testPanel == null) testPanel = FindChildByName("TestPanel");
            if (settlementPanel == null) settlementPanel = FindChildByName("SettlementPanel");
            if (tutorialPanel == null) tutorialPanel = FindChildByName("TutorialPanel");
            if (pausePanel == null) pausePanel = FindChildByName("PausePanel");
            if (failPromptPanel == null) failPromptPanel = FindChildByName("FailPromptPanel");
        }

        private GameObject FindChildByName(string name)
        {
            for (int i = 0; i < transform.childCount; i++)
            {
                var child = transform.GetChild(i);
                if (child.name.Contains(name) || child.name == name)
                    return child.gameObject;
            }
            return null;
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
                    ShowFailPrompt("");
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
            if (hudPanel != null) hudPanel.SetActive(true);
        }

        public void ShowBuildPanel()
        {
            HideAll();
            if (hudPanel != null) hudPanel.SetActive(true);
            if (buildPanel != null) buildPanel.SetActive(true);
        }

        public void ShowTestPanel()
        {
            HideAll();
            if (hudPanel != null) hudPanel.SetActive(true);
            if (testPanel != null) testPanel.SetActive(true);
        }

        public void ShowSettlement(LevelResult result)
        {
            HideAll();
            if (settlementPanel != null) settlementPanel.SetActive(true);
        }

        public void ShowTutorial(string[] steps)
        {
            HideAll();
            if (tutorialPanel != null)
            {
                tutorialPanel.SetActive(true);
                var controller = tutorialPanel.GetComponent<TutorialController>();
                if (controller != null)
                    controller.StartTutorial(steps);
            }
        }

        public void ShowPauseMenu()
        {
            if (pausePanel != null) pausePanel.SetActive(true);
        }

        public void ShowFailPrompt(string reason)
        {
            HideAll();
            if (failPromptPanel != null)
            {
                failPromptPanel.SetActive(true);
                var controller = failPromptPanel.GetComponent<FailPromptController>();
                if (controller != null)
                    controller.Show(reason);
            }
        }

        public void HideAll()
        {
            if (hudPanel != null) hudPanel.SetActive(false);
            if (buildPanel != null) buildPanel.SetActive(false);
            if (testPanel != null) testPanel.SetActive(false);
            if (settlementPanel != null) settlementPanel.SetActive(false);
            if (tutorialPanel != null) tutorialPanel.SetActive(false);
            if (pausePanel != null) pausePanel.SetActive(false);
            if (failPromptPanel != null) failPromptPanel.SetActive(false);
        }
    }
}
