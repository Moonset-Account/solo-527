using UnityEngine;
using ShadowPlatformer.Core;
using ShadowPlatformer.Level;
using ShadowPlatformer.Player;
using ShadowPlatformer.Light;
using ShadowPlatformer.Save;

namespace ShadowPlatformer.Core
{
    public class GameLoopController : MonoBehaviour
    {
        public LevelBuilder levelBuilder;
        public LevelLayout testLayout;

        private void Start()
        {
            InitializeManagers();

            EventBus.Instance.OnPlayerDeath += OnPlayerDeath;
            EventBus.Instance.OnLevelCompleted += OnLevelCompleted;
        }

        private void OnDestroy()
        {
            EventBus.Instance.OnPlayerDeath -= OnPlayerDeath;
            EventBus.Instance.OnLevelCompleted -= OnLevelCompleted;
        }

        private void InitializeManagers()
        {
            GameManager.Instance.SetGameMode(GameMode.Playing);

            if (LightManager.Instance != null && testLayout != null)
                LightManager.Instance.SetDirection(testLayout.startLightDirection);

            if (levelBuilder != null && testLayout != null)
                levelBuilder.BuildLevel(testLayout);

            if (LevelManager.Instance != null && testLayout != null)
                LevelManager.Instance.StartLevel(testLayout.levelId);

            var player = FindObjectOfType<PlayerController>();
            if (player != null && testLayout != null)
                player.SetSpawnPoint(testLayout.playerSpawn);
        }

        private void OnPlayerDeath()
        {
            LevelManager.Instance?.RecordDeath();
        }

        private void OnLevelCompleted(string levelId)
        {
            LevelManager.Instance?.CompleteCurrentLevel();
            SaveManager.Instance?.SaveLevelCompletion(
                levelId,
                LevelManager.Instance.LevelTimer,
                LevelManager.Instance.CurrentDeaths
            );
        }

        public void RestartCurrentLevel()
        {
            var player = FindObjectOfType<PlayerController>();
            if (player != null) player.Respawn();
        }

        public void LoadNextLevel()
        {
            var next = LevelManager.Instance?.GetNextLevel();
            if (next != null)
            {
                LevelManager.Instance.StartLevel(next.levelId);
                SceneLoader.Instance.LoadScene(next.sceneName);
            }
        }
    }
}
