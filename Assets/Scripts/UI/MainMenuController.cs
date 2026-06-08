using System.Collections.Generic;
using Kitchen.Config;
using Kitchen.Core;
using Kitchen.Save;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

namespace Kitchen.UI
{
    public class MainMenuController : MonoBehaviour
    {
        [Header("Panels")]
        public GameObject mainMenuPanel;
        public GameObject levelSelectPanel;
        public GameObject playerSetupPanel;
        public GameObject settingsPanelRef;

        [Header("Main Menu Buttons")]
        public Button playButton;
        public Button settingsButton;
        public Button quitButton;
        public Button creditsButton;

        [Header("Level Select")]
        public Transform levelCardContainer;
        public GameObject levelCardPrefab;
        public Button levelSelectBackButton;

        [Header("Player Setup")]
        public Button singlePlayerButton;
        public Button multiPlayerButton;
        public Transform joinStatusContainer;
        public GameObject playerJoinStatusPrefab;
        public Button startGameButton;
        public Button playerSetupBackButton;
        public TextMeshProUGUI waitingText;

        private LevelConfig selectedLevel;
        private bool isSinglePlayerMode = true;
        private Dictionary<int, GameObject> joinStatusIndicators = new Dictionary<int, GameObject>();

        private void OnEnable()
        {
            if (playButton != null) playButton.onClick.AddListener(OnPlayClicked);
            if (settingsButton != null) settingsButton.onClick.AddListener(OnSettingsClicked);
            if (quitButton != null) quitButton.onClick.AddListener(OnQuitClicked);
            if (levelSelectBackButton != null) levelSelectBackButton.onClick.AddListener(() => SwitchPanel(0));
            if (playerSetupBackButton != null) playerSetupBackButton.onClick.AddListener(() => SwitchPanel(1));
            if (singlePlayerButton != null) singlePlayerButton.onClick.AddListener(() => SetMode(true));
            if (multiPlayerButton != null) multiPlayerButton.onClick.AddListener(() => SetMode(false));
            if (startGameButton != null) startGameButton.onClick.AddListener(OnStartGame);

            if (Kitchen.Input.InputManager.Instance != null)
                Kitchen.Input.InputManager.Instance.OnPlayerJoinedInput += HandlePlayerJoined;

            SaveManager.Instance?.LoadOrCreateSave();
            Kitchen.Performance.FrameRateAdapter.Instance?.ApplySettingsFromSave();

            SwitchPanel(0);
            PopulateLevelCards();
        }

        private void OnDisable()
        {
            if (Kitchen.Input.InputManager.Instance != null)
                Kitchen.Input.InputManager.Instance.OnPlayerJoinedInput -= HandlePlayerJoined;
        }

        private void Update()
        {
            UpdateJoinStatus();
            if (GameManager.Instance?.CurrentState == GameManager.GameState.MainMenu)
            {
                if (Kitchen.Input.InputManager.Instance != null && !isSinglePlayerMode)
                {
                    int count = Kitchen.Input.InputManager.Instance.ConnectedPlayers.Count;
                    if (startGameButton != null)
                    {
                        startGameButton.interactable = count >= 1 && selectedLevel != null;
                    }
                    if (waitingText != null)
                    {
                        waitingText.text = count == 0 ? "等待玩家按 确认键 加入..." : $"已加入 {count} 名玩家";
                    }
                }
                else if (isSinglePlayerMode && startGameButton != null)
                {
                    startGameButton.interactable = selectedLevel != null;
                    if (waitingText != null) waitingText.text = selectedLevel != null ? "已就绪，点击开始" : "请先选择上方关卡";
                }
            }
        }

        private void SwitchPanel(int panelIndex)
        {
            if (mainMenuPanel != null) mainMenuPanel.SetActive(panelIndex == 0);
            if (levelSelectPanel != null) levelSelectPanel.SetActive(panelIndex == 1);
            if (playerSetupPanel != null) playerSetupPanel.SetActive(panelIndex == 2);
            if (settingsPanelRef != null) settingsPanelRef.SetActive(panelIndex == 3);
        }

        private void OnPlayClicked()
        {
            SwitchPanel(1);
            PopulateLevelCards();
        }

        private void OnSettingsClicked()
        {
            SwitchPanel(3);
            settingsPanelRef?.GetComponent<SettingsMenuController>()?.Open();
        }

        private void OnQuitClicked()
        {
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }

        private void PopulateLevelCards()
        {
            if (levelCardContainer == null || levelCardPrefab == null) return;
            for (int i = levelCardContainer.childCount - 1; i >= 0; i--)
                Destroy(levelCardContainer.GetChild(i).gameObject);

            LevelConfig[] levels = LevelConfigRegistry.GetAllLevels();
            List<LevelConfig> sorted = new List<LevelConfig>(levels);
            sorted.Sort((a, b) => a.orderIndex.CompareTo(b.orderIndex));

            foreach (var lv in sorted)
            {
                GameObject card = Instantiate(levelCardPrefab, levelCardContainer);
                LevelSaveData data = SaveManager.Instance != null ? SaveManager.Instance.GetOrCreateLevelData(lv) : null;
                bool unlocked = data != null ? data.isUnlocked : lv.isUnlockedByDefault;

                var nameTxt = card.transform.Find("LevelName")?.GetComponent<TextMeshProUGUI>();
                var descTxt = card.transform.Find("Description")?.GetComponent<TextMeshProUGUI>();
                var starsContainer = card.transform.Find("Stars");
                var lockOverlay = card.transform.Find("LockOverlay")?.gameObject;
                var bestScoreTxt = card.transform.Find("BestScore")?.GetComponent<TextMeshProUGUI>();
                var btn = card.GetComponent<Button>();

                if (nameTxt != null) nameTxt.text = lv.displayName;
                if (descTxt != null) descTxt.text = lv.description;
                if (bestScoreTxt != null) bestScoreTxt.text = data != null && data.bestScore > 0 ? $"最佳: {data.bestScore:N0}" : "";
                if (lockOverlay != null) lockOverlay.SetActive(!unlocked);
                if (btn != null)
                {
                    btn.interactable = unlocked;
                    LevelConfig captured = lv;
                    btn.onClick.AddListener(() => OnLevelSelected(captured));
                }

                if (starsContainer != null && data != null)
                {
                    for (int i = 0; i < starsContainer.childCount; i++)
                    {
                        var img = starsContainer.GetChild(i).GetComponent<Image>();
                        if (img != null) img.color = i < data.starRating ? Color.yellow : Color.gray;
                    }
                }
            }
        }

        private void OnLevelSelected(LevelConfig level)
        {
            selectedLevel = level;
            SwitchPanel(2);
            SetMode(true);
        }

        private void SetMode(bool single)
        {
            isSinglePlayerMode = single;
            if (Kitchen.Input.InputManager.Instance != null)
            {
                foreach (var pid in new List<int>(Kitchen.Input.InputManager.Instance.ConnectedPlayers))
                    Kitchen.Input.InputManager.Instance.DisconnectPlayer(pid);
            }

            if (singlePlayerButton != null) singlePlayerButton.image.color = single ? Color.green : Color.white;
            if (multiPlayerButton != null) multiPlayerButton.image.color = !single ? Color.green : Color.white;
            if (joinStatusContainer != null)
            {
                for (int i = joinStatusContainer.childCount - 1; i >= 0; i--)
                    Destroy(joinStatusContainer.GetChild(i).gameObject);
            }
            joinStatusIndicators.Clear();

            if (!single)
            {
                for (int i = 0; i < (selectedLevel != null ? selectedLevel.maxPlayers : 4); i++)
                {
                    if (playerJoinStatusPrefab != null && joinStatusContainer != null)
                    {
                        GameObject indicator = Instantiate(playerJoinStatusPrefab, joinStatusContainer);
                        var txt = indicator.GetComponentInChildren<TextMeshProUGUI>();
                        if (txt != null) txt.text = $"P{i + 1}: 等待...";
                        joinStatusIndicators[i] = indicator;
                    }
                }
            }
        }

        private void HandlePlayerJoined(int playerId)
        {
            if (joinStatusIndicators.TryGetValue(playerId, out var indicator))
            {
                var txt = indicator.GetComponentInChildren<TextMeshProUGUI>();
                if (txt != null) txt.text = $"P{playerId + 1}: 已加入";
                Color[] colors = new[] { Color.red, Color.blue, Color.green, Color.yellow };
                var img = indicator.GetComponent<Image>();
                if (img != null) img.color = colors[playerId % colors.Length];
            }
        }

        private void UpdateJoinStatus()
        {
        }

        private void OnStartGame()
        {
            if (selectedLevel == null) return;
            int playerCount = isSinglePlayerMode ? 1 : Kitchen.Input.InputManager.Instance?.ConnectedPlayers.Count ?? 1;
            if (playerCount < selectedLevel.minPlayers) return;

            PlayerManager.Instance?.ClearAllPlayers();

            if (isSinglePlayerMode)
            {
                int spawns = Mathf.Min(2, selectedLevel.maxPlayers);
                for (int i = 0; i < spawns; i++)
                {
                    PlayerController pc = PlayerManager.Instance?.CreatePlayer(i, i);
                    if (pc != null) pc.SetControllable(i == 0);
                }
            }
            else
            {
                List<int> players = new List<int>(Kitchen.Input.InputManager.Instance.ConnectedPlayers);
                for (int i = 0; i < players.Count; i++)
                {
                    PlayerManager.Instance?.CreatePlayer(players[i], i);
                }
            }

            OrderManager.Instance?.Initialize(selectedLevel);
            GameManager.Instance?.StartLevel(selectedLevel, isSinglePlayerMode);
        }
    }
}
