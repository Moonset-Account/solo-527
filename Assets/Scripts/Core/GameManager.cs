using UnityEngine;
using System;

namespace ShadowPlatformer.Core
{
    public enum GameMode
    {
        Menu,
        Playing,
        Paused,
        Cutscene,
        Editor
    }

    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public GameMode CurrentMode { get; private set; } = GameMode.Menu;
        public event Action<GameMode> OnGameModeChanged;

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

        public void SetGameMode(GameMode mode)
        {
            if (CurrentMode == mode) return;
            var prev = CurrentMode;
            CurrentMode = mode;
            ApplyTimeScale();
            OnGameModeChanged?.Invoke(mode);
        }

        public void TogglePause()
        {
            if (CurrentMode == GameMode.Playing)
                SetGameMode(GameMode.Paused);
            else if (CurrentMode == GameMode.Paused)
                SetGameMode(GameMode.Playing);
        }

        private void ApplyTimeScale()
        {
            switch (CurrentMode)
            {
                case GameMode.Playing:
                case GameMode.Cutscene:
                case GameMode.Editor:
                    Time.timeScale = 1f;
                    break;
                case GameMode.Paused:
                case GameMode.Menu:
                    Time.timeScale = 0f;
                    break;
            }
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }
    }
}
