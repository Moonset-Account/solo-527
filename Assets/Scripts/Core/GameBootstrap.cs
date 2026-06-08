using UnityEngine;
using UnityEngine.SceneManagement;

namespace InkMountainBridge
{
    public class GameBootstrap : MonoBehaviour
    {
        public LevelConfig[] levelConfigs;
        public CharacterStateConfig characterStateConfig;
        public UITextConfig uiTextConfig;
        public AudioEventConfig audioEventConfig;
        public TrialStatsConfig trialStatsConfig;

        private static readonly string[] LevelSceneNames = { "", "Tutorial", "Challenge", "FailTest" };

        private void Awake()
        {
            InitializeManagers();
            InitializeSubscribers();
        }

        private void InitializeManagers()
        {
            if (GameManager.Instance == null)
            {
                GameObject go = new GameObject(nameof(GameManager));
                go.AddComponent<GameManager>();
            }

            if (AudioManager.Instance == null)
            {
                GameObject go = new GameObject(nameof(AudioManager));
                go.AddComponent<AudioManager>();
            }

            if (FindObjectOfType<AnalyticsRecorder>() == null)
            {
                GameObject go = new GameObject(nameof(AnalyticsRecorder));
                go.AddComponent<AnalyticsRecorder>();
            }

            var gm = GameManager.Instance;
            if (gm != null)
            {
                gm.uiTextConfig = uiTextConfig;
                gm.audioEventConfig = audioEventConfig;
                gm.trialStatsConfig = trialStatsConfig;
            }
        }

        private void InitializeSubscribers()
        {
            if (FindObjectOfType<AudioEventListener>() == null)
            {
                GameObject go = new GameObject(nameof(AudioEventListener));
                go.AddComponent<AudioEventListener>();
            }
        }

        public void StartLevelById(int id)
        {
            if (levelConfigs == null) return;
            if (id < 1 || id >= LevelSceneNames.Length) return;

            LevelConfig config = null;
            foreach (var c in levelConfigs)
            {
                if (c != null && c.levelId == id)
                {
                    config = c;
                    break;
                }
            }

            if (config == null) return;

            GameManager.Instance?.StartLevel(config);
            SceneManager.LoadScene(LevelSceneNames[id]);
        }

        public void StartTutorialLevel()
        {
            StartLevelById(1);
        }

        public void StartChallengeLevel()
        {
            StartLevelById(2);
        }

        public void StartFailTestLevel()
        {
            StartLevelById(3);
        }

        public void ReturnToMenu()
        {
            SceneManager.LoadScene("MainMenu");
        }
    }
}
