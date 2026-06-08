using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;
using ShadowPlatformer.Core;
using ShadowPlatformer.Level;
using ShadowPlatformer.Save;

namespace ShadowPlatformer.UI
{
    public class MainMenu : MonoBehaviour
    {
        [Header("Panels")]
        public GameObject mainPanel;
        public GameObject levelSelectPanel;

        [Header("Main Buttons")]
        public Button continueButton;
        public Button newGameButton;
        public Button levelSelectButton;
        public Button settingsButton;
        public Button quitButton;

        [Header("Level Select")]
        public Transform levelButtonContainer;
        public GameObject levelButtonPrefab;
        public Button levelSelectBackButton;

        [Header("Settings")]
        public SettingsPanel settingsPanel;

        private List<LevelButton> _levelButtons = new List<LevelButton>();

        private void OnEnable()
        {
            if (continueButton != null) continueButton.onClick.AddListener(OnContinue);
            if (newGameButton != null) newGameButton.onClick.AddListener(OnNewGame);
            if (levelSelectButton != null) levelSelectButton.onClick.AddListener(ShowLevelSelect);
            if (settingsButton != null) settingsButton.onClick.AddListener(ShowSettings);
            if (quitButton != null) quitButton.onClick.AddListener(OnQuit);
            if (levelSelectBackButton != null) levelSelectBackButton.onClick.AddListener(HideLevelSelect);

            RefreshContinueButton();
        }

        private void OnDisable()
        {
            if (continueButton != null) continueButton.onClick.RemoveListener(OnContinue);
            if (newGameButton != null) newGameButton.onClick.RemoveListener(OnNewGame);
            if (levelSelectButton != null) levelSelectButton.onClick.RemoveListener(ShowLevelSelect);
            if (settingsButton != null) settingsButton.onClick.RemoveListener(ShowSettings);
            if (quitButton != null) quitButton.onClick.RemoveListener(OnQuit);
            if (levelSelectBackButton != null) levelSelectBackButton.onClick.RemoveListener(HideLevelSelect);
        }

        private void RefreshContinueButton()
        {
            if (continueButton != null)
            {
                var save = SaveManager.Instance?.CurrentSave;
                continueButton.interactable = save != null && !string.IsNullOrEmpty(save.currentLevelId);
            }
        }

        private void OnContinue()
        {
            var save = SaveManager.Instance?.CurrentSave;
            if (save == null || string.IsNullOrEmpty(save.currentLevelId)) return;
            GameManager.Instance.SetGameMode(GameMode.Playing);
            SceneLoader.Instance.LoadScene(save.currentLevelId);
        }

        private void OnNewGame()
        {
            SaveManager.Instance?.DeleteSave();
            var levels = LevelManager.Instance?.GetOrderedLevels();
            if (levels != null && levels.Count > 0)
            {
                GameManager.Instance.SetGameMode(GameMode.Playing);
                LevelManager.Instance.StartLevel(levels[0].levelId);
                SceneLoader.Instance.LoadScene(levels[0].sceneName);
            }
        }

        private void ShowLevelSelect()
        {
            if (levelSelectPanel != null) levelSelectPanel.SetActive(true);
            if (mainPanel != null) mainPanel.SetActive(false);
            PopulateLevelButtons();
        }

        private void HideLevelSelect()
        {
            if (levelSelectPanel != null) levelSelectPanel.SetActive(false);
            if (mainPanel != null) mainPanel.SetActive(true);
        }

        private void PopulateLevelButtons()
        {
            foreach (var btn in _levelButtons)
            {
                if (btn != null) Destroy(btn.gameObject);
            }
            _levelButtons.Clear();

            var levels = LevelManager.Instance?.GetOrderedLevels();
            if (levels == null || levelButtonContainer == null || levelButtonPrefab == null) return;

            foreach (var lvl in levels)
            {
                var go = Instantiate(levelButtonPrefab, levelButtonContainer);
                var lb = go.GetComponent<LevelButton>();
                if (lb != null)
                {
                    bool unlocked = LevelManager.Instance.IsLevelUnlocked(lvl.levelId);
                    lb.Setup(lvl, unlocked, OnLevelSelected);
                    _levelButtons.Add(lb);
                }
            }
        }

        private void OnLevelSelected(LevelData level)
        {
            GameManager.Instance.SetGameMode(GameMode.Playing);
            LevelManager.Instance.StartLevel(level.levelId);
            SceneLoader.Instance.LoadScene(level.sceneName);
        }

        private void ShowSettings()
        {
            if (settingsPanel != null) settingsPanel.gameObject.SetActive(true);
        }

        private void OnQuit()
        {
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }
    }
}
