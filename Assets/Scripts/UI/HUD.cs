using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowPlatformer.Core;
using ShadowPlatformer.Level;
using ShadowPlatformer.Light;
using ShadowPlatformer.Save;

namespace ShadowPlatformer.UI
{
    public class HUD : MonoBehaviour
    {
        [Header("References")]
        public TMP_Text levelNameText;
        public TMP_Text timerText;
        public TMP_Text deathCountText;
        public Image lightDirectionIndicator;
        public GameObject tutorialPanel;
        public TMP_Text tutorialText;
        public GameObject deathOverlay;

        [Header("Light Direction Icons")]
        public Sprite lightRightIcon;
        public Sprite lightLeftIcon;
        public Sprite lightUpIcon;
        public Sprite lightDownIcon;

        private float _tutorialShowTime;
        private bool _showingTutorial;

        private void OnEnable()
        {
            EventBus.Instance.OnLevelStarted += OnLevelStarted;
            EventBus.Instance.OnPlayerDeath += OnPlayerDeath;
            EventBus.Instance.OnLightSwitched += OnLightSwitched;
        }

        private void OnDisable()
        {
            EventBus.Instance.OnLevelStarted -= OnLevelStarted;
            EventBus.Instance.OnPlayerDeath -= OnPlayerDeath;
            EventBus.Instance.OnLightSwitched -= OnLightSwitched;
        }

        private void Update()
        {
            UpdateTimer();
            UpdateDeathCount();
            UpdateTutorial();
        }

        private void OnLevelStarted(string levelId)
        {
            var data = LevelManager.Instance?.GetLevelData(levelId);
            if (data != null)
            {
                if (levelNameText != null)
                    levelNameText.text = data.levelName;

                if (!string.IsNullOrEmpty(data.tutorialText))
                    ShowTutorial(data.tutorialText, 4f);
            }

            if (deathOverlay != null) deathOverlay.SetActive(false);
        }

        private void OnPlayerDeath()
        {
            if (deathOverlay != null)
                deathOverlay.SetActive(true);
        }

        private void OnLightSwitched()
        {
            UpdateLightDirection();
        }

        private void UpdateTimer()
        {
            if (LevelManager.Instance == null || timerText == null) return;
            float t = LevelManager.Instance.LevelTimer;
            timerText.text = FormatTime(t);
        }

        private void UpdateDeathCount()
        {
            if (LevelManager.Instance == null || deathCountText == null) return;
            deathCountText.text = LevelManager.Instance.CurrentDeaths.ToString();
        }

        private void UpdateLightDirection()
        {
            if (LightManager.Instance == null || lightDirectionIndicator == null) return;
            var dir = LightManager.Instance.currentDirection;
            lightDirectionIndicator.sprite = dir switch
            {
                LightDirection.Right => lightRightIcon,
                LightDirection.Left => lightLeftIcon,
                LightDirection.Up => lightUpIcon,
                LightDirection.Down => lightDownIcon,
                _ => lightRightIcon
            };
        }

        public void ShowTutorial(string text, float duration)
        {
            if (tutorialPanel != null) tutorialPanel.SetActive(true);
            if (tutorialText != null) tutorialText.text = text;
            _tutorialShowTime = duration;
            _showingTutorial = true;
        }

        private void UpdateTutorial()
        {
            if (!_showingTutorial) return;
            _tutorialShowTime -= Time.deltaTime;
            if (_tutorialShowTime <= 0f)
            {
                _showingTutorial = false;
                if (tutorialPanel != null) tutorialPanel.SetActive(false);
            }
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
