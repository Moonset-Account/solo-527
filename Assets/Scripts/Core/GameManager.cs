using UnityEngine;

namespace InkMountainBridge
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public LevelConfig currentLevel;
        public GameState gameState = GameState.Menu;

        public UITextConfig uiTextConfig;
        public AudioEventConfig audioEventConfig;
        public TrialStatsConfig trialStatsConfig;

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

        public void StartLevel(LevelConfig levelConfig)
        {
            currentLevel = levelConfig;
            gameState = GameState.Building;
            GameEvents.OnLevelStarted?.Invoke(levelConfig);
            GameEvents.OnPhaseChanged?.Invoke(gameState);
        }

        public void EnterBuildPhase()
        {
            gameState = GameState.Building;
            GameEvents.OnPhaseChanged?.Invoke(gameState);
        }

        public void EnterTestPhase()
        {
            gameState = GameState.Testing;
            GameEvents.OnPhaseChanged?.Invoke(gameState);
        }

        public void HandleLevelComplete()
        {
            gameState = GameState.Settlement;
            GameEvents.OnPhaseChanged?.Invoke(gameState);
            int score = CalculateScore();
            GameEvents.OnLevelCompleted?.Invoke(score);
        }

        public void HandleLevelFail(string reason)
        {
            gameState = GameState.Settlement;
            GameEvents.OnPhaseChanged?.Invoke(gameState);
            GameEvents.OnLevelFailed?.Invoke(reason);
        }

        public void RetryLevel()
        {
            if (currentLevel != null)
            {
                StartLevel(currentLevel);
            }
        }

        public void ReturnToMenu()
        {
            gameState = GameState.Menu;
            currentLevel = null;
            GameEvents.OnPhaseChanged?.Invoke(gameState);
        }

        private int CalculateScore()
        {
            return 0;
        }
    }
}
