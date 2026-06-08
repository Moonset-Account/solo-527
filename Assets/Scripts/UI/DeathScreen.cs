using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowPlatformer.Core;
using ShadowPlatformer.Level;
using ShadowPlatformer.Player;
using ShadowPlatformer.Save;

namespace ShadowPlatformer.UI
{
    public class DeathScreen : MonoBehaviour
    {
        public GameObject deathPanel;
        public TMP_Text deathMessageText;
        public Button retryButton;
        public Button checkpointButton;
        public Button quitButton;

        public float displayDelay = 1f;

        private float _deathTimer;
        private bool _isShowing;

        private void OnEnable()
        {
            EventBus.Instance.OnPlayerDeath += OnPlayerDeath;
            EventBus.Instance.OnPlayerRespawn += OnPlayerRespawn;

            if (retryButton != null) retryButton.onClick.AddListener(OnRetry);
            if (checkpointButton != null) checkpointButton.onClick.AddListener(OnRespawnAtCheckpoint);
            if (quitButton != null) quitButton.onClick.AddListener(OnQuitToMenu);
        }

        private void OnDisable()
        {
            EventBus.Instance.OnPlayerDeath -= OnPlayerDeath;
            EventBus.Instance.OnPlayerRespawn -= OnPlayerRespawn;

            if (retryButton != null) retryButton.onClick.RemoveListener(OnRetry);
            if (checkpointButton != null) checkpointButton.onClick.RemoveListener(OnRespawnAtCheckpoint);
            if (quitButton != null) quitButton.onClick.RemoveListener(OnQuitToMenu);
        }

        private void Update()
        {
            if (!_isShowing) return;
            _deathTimer -= Time.unscaledDeltaTime;
            if (_deathTimer <= 0f && deathPanel != null && !deathPanel.activeSelf)
            {
                deathPanel.SetActive(true);
                GameManager.Instance.SetGameMode(GameMode.Paused);
                if (retryButton != null) retryButton.Select();
            }
        }

        private void OnPlayerDeath()
        {
            _isShowing = true;
            _deathTimer = displayDelay;
            LevelManager.Instance?.RecordDeath();

            if (deathMessageText != null)
                deathMessageText.text = GetDeathMessage();
        }

        private void OnPlayerRespawn()
        {
            _isShowing = false;
            if (deathPanel != null) deathPanel.SetActive(false);
        }

        private void OnRetry()
        {
            GameManager.Instance.SetGameMode(GameMode.Playing);
            var player = FindObjectOfType<PlayerController>();
            if (player != null)
                player.Respawn();
        }

        private void OnRespawnAtCheckpoint()
        {
            GameManager.Instance.SetGameMode(GameMode.Playing);
            var player = FindObjectOfType<PlayerController>();
            if (player != null)
                player.Respawn();
        }

        private void OnQuitToMenu()
        {
            GameManager.Instance.SetGameMode(GameMode.Menu);
            SceneLoader.Instance.LoadScene("MainMenu");
        }

        private string GetDeathMessage()
        {
            string[] messages = {
                "暗影吞噬了你...",
                "光影交错，再试一次",
                "方向错了？换盏灯试试",
                "别急，观察光的方向"
            };
            return messages[Random.Range(0, messages.Length)];
        }
    }
}
