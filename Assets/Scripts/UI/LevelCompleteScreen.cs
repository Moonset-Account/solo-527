using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowPlatformer.Core;
using ShadowPlatformer.Level;
using ShadowPlatformer.Save;

namespace ShadowPlatformer.UI
{
    public class LevelCompleteScreen : MonoBehaviour
    {
        public GameObject completePanel;
        public TMP_Text levelNameText;
        public TMP_Text timeText;
        public TMP_Text deathsText;
        public Button nextLevelButton;
        public Button replayButton;
        public Button menuButton;

        private void OnEnable()
        {
            EventBus.Instance.OnLevelCompleted += OnLevelCompleted;

            if (nextLevelButton != null) nextLevelButton.onClick.AddListener(OnNextLevel);
            if (replayButton != null) replayButton.onClick.AddListener(OnReplay);
            if (menuButton != null) menuButton.onClick.AddListener(OnMenu);
        }

        private void OnDisable()
        {
            EventBus.Instance.OnLevelCompleted -= OnLevelCompleted;

            if (nextLevelButton != null) nextLevelButton.onClick.RemoveListener(OnNextLevel);
            if (replayButton != null) replayButton.onClick.RemoveListener(OnReplay);
            if (menuButton != null) menuButton.onClick.RemoveListener(OnMenu);
        }

        private void OnLevelCompleted(string levelId)
        {
            var lm = LevelManager.Instance;
            if (lm == null) return;

            lm.CompleteCurrentLevel();

            var save = SaveManager.Instance;
            save?.SaveLevelCompletion(levelId, lm.LevelTimer, lm.CurrentDeaths);

            if (completePanel != null) completePanel.SetActive(true);
            if (levelNameText != null) levelNameText.text = lm.CurrentLevel?.levelName ?? "";
            if (timeText != null) timeText.text = FormatTime(lm.LevelTimer);
            if (deathsText != null) deathsText.text = lm.CurrentDeaths.ToString();

            var next = lm.GetNextLevel();
            if (nextLevelButton != null)
                nextLevelButton.interactable = next != null;

            GameManager.Instance.SetGameMode(GameMode.Paused);
        }

        private void OnNextLevel()
        {
            var next = LevelManager.Instance?.GetNextLevel();
            if (next == null) return;
            GameManager.Instance.SetGameMode(GameMode.Playing);
            LevelManager.Instance.StartLevel(next.levelId);
            SceneLoader.Instance.LoadScene(next.sceneName);
        }

        private void OnReplay()
        {
            var current = LevelManager.Instance?.CurrentLevel;
            if (current == null) return;
            GameManager.Instance.SetGameMode(GameMode.Playing);
            LevelManager.Instance.StartLevel(current.levelId);
            SceneLoader.Instance.LoadScene(current.sceneName);
        }

        private void OnMenu()
        {
            GameManager.Instance.SetGameMode(GameMode.Menu);
            SceneLoader.Instance.LoadScene("MainMenu");
        }

        private string FormatTime(float seconds)
        {
            int m = (int)(seconds / 60f);
            int s = (int)(seconds % 60f);
            int ms = (int)((seconds * 100f) % 100f);
            return $"{m:00}:{s:00}.{ms:00}";
        }
    }
}
