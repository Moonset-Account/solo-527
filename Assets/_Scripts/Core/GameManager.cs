using UnityEngine;

namespace LightShadowPlatformer.Core
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public enum GameState { MainMenu, Playing, Paused, GameOver, Victory }
        public GameState CurrentState { get; private set; } = GameState.MainMenu;

        [Header("Game Settings")]
        public int currentLevelIndex = 0;
        public int totalLevels = 3;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void ChangeState(GameState newState)
        {
            if (CurrentState == newState) return;

            var oldState = CurrentState;
            CurrentState = newState;
            EventManager.Instance.TriggerGameStateChanged(oldState, newState);

            switch (newState)
            {
                case GameState.Playing:
                    Time.timeScale = 1f;
                    break;
                case GameState.Paused:
                case GameState.GameOver:
                case GameState.Victory:
                case GameState.MainMenu:
                    Time.timeScale = newState == GameState.MainMenu ? 1f : 0f;
                    break;
            }
        }

        public void StartNewGame()
        {
            currentLevelIndex = 0;
            SaveManager.Instance.DeleteSave();
            LoadLevel(currentLevelIndex);
        }

        public void ContinueGame()
        {
            if (SaveManager.Instance.HasSaveData())
            {
                var save = SaveManager.Instance.LoadSave();
                currentLevelIndex = save.currentLevel;
                LoadLevel(currentLevelIndex);
            }
            else
            {
                StartNewGame();
            }
        }

        public void LoadLevel(int levelIndex)
        {
            currentLevelIndex = Mathf.Clamp(levelIndex, 0, totalLevels - 1);
            ChangeState(GameState.Playing);
            EventManager.Instance.TriggerLevelLoaded(currentLevelIndex);
        }

        public void CompleteLevel()
        {
            if (currentLevelIndex < totalLevels - 1)
            {
                currentLevelIndex++;
                SaveManager.Instance.SaveProgress(currentLevelIndex);
                LoadLevel(currentLevelIndex);
            }
            else
            {
                ChangeState(GameState.Victory);
            }
        }

        public void RestartLevel()
        {
            LoadLevel(currentLevelIndex);
        }

        public void ReturnToMainMenu()
        {
            ChangeState(GameState.MainMenu);
        }

        public void TogglePause()
        {
            if (CurrentState == GameState.Playing)
                ChangeState(GameState.Paused);
            else if (CurrentState == GameState.Paused)
                ChangeState(GameState.Playing);
        }
    }
}
