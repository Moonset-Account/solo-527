using UnityEngine;

namespace InkMountainBridge
{
    public class GameBootstrap : MonoBehaviour
    {
        public LevelConfig[] levelConfigs;
        public CharacterStateConfig characterStateConfig;
        public UITextConfig uiTextConfig;
        public AudioEventConfig audioEventConfig;
        public TrialStatsConfig trialStatsConfig;

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
                var am = go.AddComponent<AudioManager>();
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

            foreach (var config in levelConfigs)
            {
                if (config != null && config.levelId == id)
                {
                    GameManager.Instance?.StartLevel(config);
                    break;
                }
            }
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
    }
}
