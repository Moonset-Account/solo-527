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

        private SettlementScreen settlementScreen;
        private FailPromptController failPromptController;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            DiscoverPanels();
        }

        private void DiscoverPanels()
        {
            if (hudPanel == null) hudPanel = FindChildGO("HUDPanel");
            if (buildPanel == null) buildPanel = FindChildGO("BuildPanel");
            if (testPanel == null) testPanel = FindChildGO("TestPanel");
            if (settlementPanel == null) settlementPanel = FindChildGO("SettlementPanel");
            if (tutorialPanel == null) tutorialPanel = FindChildGO("TutorialPanel");
            if (pausePanel == null) pausePanel = FindChildGO("PausePanel");
            if (failPromptPanel == null) failPromptPanel = FindChildGO("FailPromptPanel");

            if (settlementPanel != null)
                settlementScreen = settlementPanel.GetComponent<SettlementScreen>();
            if (failPromptPanel != null)
                failPromptController = failPromptPanel.GetComponent<FailPromptController>();
        }

        private GameObject FindChildGO(string name)
        {
            Transform t = transform.Find(name);
            if (t != null) return t.gameObject;

            for (int i = 0; i < transform.childCount; i++)
            {
                Transform child = transform.GetChild(i);
                if (child.name.Contains(name))
                    return child.gameObject;
            }
            return null;
        }

        private void OnEnable()
        {
            GameEvents.OnPhaseChanged += HandlePhaseChanged;
            GameEvents.OnLevelFailed += HandleLevelFailed;
            GameEvents.OnLevelCompleted += HandleLevelCompleted;
        }

        private void OnDisable()
        {
            GameEvents.OnPhaseChanged -= HandlePhaseChanged;
            GameEvents.OnLevelFailed -= HandleLevelFailed;
            GameEvents.OnLevelCompleted -= HandleLevelCompleted;
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
                    ShowSettlementPanel();
                    break;
            }
        }

        private void HandleLevelFailed(string reason)
        {
            ShowFailPrompt(reason);
        }

        private void HandleLevelCompleted(int levelId)
        {
        }

        public void ShowHUD()
        {
            HideAll();
            SafeSetActive(hudPanel, true);
        }

        public void ShowBuildPanel()
        {
            HideAll();
            SafeSetActive(hudPanel, true);
            SafeSetActive(buildPanel, true);
        }

        public void ShowTestPanel()
        {
            HideAll();
            SafeSetActive(hudPanel, true);
            SafeSetActive(testPanel, true);
        }

        public void ShowSettlementPanel()
        {
            HideAll();
            SafeSetActive(settlementPanel, true);

            if (settlementScreen == null && settlementPanel != null)
                settlementScreen = settlementPanel.GetComponent<SettlementScreen>();

            if (settlementScreen != null)
            {
                var lc = FindObjectOfType<LevelController>();
                if (lc != null && lc.lastResult != null)
                    settlementScreen.Show(lc.lastResult);
            }
        }

        public void ShowSettlement(LevelResult result)
        {
            HideAll();
            SafeSetActive(settlementPanel, true);

            if (settlementScreen == null && settlementPanel != null)
                settlementScreen = settlementPanel.GetComponent<SettlementScreen>();

            if (settlementScreen != null)
                settlementScreen.Show(result);
        }

        public void ShowTutorial(string[] steps)
        {
            HideAll();
            SafeSetActive(tutorialPanel, true);

            if (tutorialPanel != null)
            {
                var controller = tutorialPanel.GetComponent<TutorialController>();
                if (controller != null)
                    controller.StartTutorial(steps);
            }
        }

        public void ShowPauseMenu()
        {
            SafeSetActive(pausePanel, true);
        }

        public void ShowFailPrompt(string reason)
        {
            HideAll();
            SafeSetActive(failPromptPanel, true);

            if (failPromptController == null && failPromptPanel != null)
                failPromptController = failPromptPanel.GetComponent<FailPromptController>();

            if (failPromptController != null)
                failPromptController.Show(reason);
        }

        public void HideAll()
        {
            SafeSetActive(hudPanel, false);
            SafeSetActive(buildPanel, false);
            SafeSetActive(testPanel, false);
            SafeSetActive(settlementPanel, false);
            SafeSetActive(tutorialPanel, false);
            SafeSetActive(pausePanel, false);
            SafeSetActive(failPromptPanel, false);
        }

        private void SafeSetActive(GameObject go, bool active)
        {
            if (go != null) go.SetActive(active);
        }
    }
}
