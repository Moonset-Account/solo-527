using UnityEngine;
using LakeSailing.Core;
using LakeSailing.UI;
using LakeSailing.Gameplay;
using LakeSailing.Audio;
using LakeSailing.Meta;

namespace LakeSailing
{
    public class GameBootstrapper : PersistentSingleton<GameBootstrapper>
    {
        [SerializeField] private bool skipIntro = true;
        [SerializeField] private float bootTime = 0.5f;

        private bool isBooted;

        protected override void Awake()
        {
            base.Awake();
            Application.runInBackground = true;
        }

        private void Start()
        {
            Bootstrap();
        }

        private async void Bootstrap()
        {
            if (isBooted) return;
            isBooted = true;

            CreateCoreSystems();

            await SaveSystem.Instance.LoadAllData();

            AudioManager.Instance.ApplySettings(
                SaveSystem.Instance.CurrentSettings.masterVolume,
                SaveSystem.Instance.CurrentSettings.musicVolume,
                SaveSystem.Instance.CurrentSettings.sfxVolume,
                SaveSystem.Instance.CurrentSettings.ambientVolume);

            LeaderboardSystem.Instance.Initialize();

            CreateGameplaySystems();
            CreateUISystems();

            GameManager.Instance.ChangeState(GameState.Boot);

            Invoke(nameof(ShowMainMenu), bootTime);
        }

        private void CreateCoreSystems()
        {
            EnsureComponent<GameManager>();
            EnsureComponent<SaveSystem>();
            EnsureComponent<EventBusProxy>();
            EnsureComponent<AudioManager>();
        }

        private void CreateGameplaySystems()
        {
            EnsureComponent<WeatherSystem>();
            EnsureComponent<TaskSystem>();
            EnsureComponent<GallerySystem>();
            EnsureComponent<LeaderboardSystem>();
            EnsureComponent<AchievementSystem>();
        }

        private void CreateUISystems()
        {
            EnsureComponent<UIManager>();
            CreateAllPanels();
        }

        private void CreateAllPanels()
        {
            var uiRoot = UIManager.Instance.UIRoot;

            CreatePanel<MainMenuPanel>(uiRoot, "MainMenuPanel");
            CreatePanel<HUDPanel>(uiRoot, "HUDPanel");
            CreatePanel<PauseMenuPanel>(uiRoot, "PauseMenuPanel");
            CreatePanel<SettingsMenuPanel>(uiRoot, "SettingsMenuPanel");
            CreatePanel<TutorialPanel>(uiRoot, "TutorialPanel");
            CreatePanel<LevelSelectPanel>(uiRoot, "LevelSelectPanel");
            CreatePanel<ResultPanel>(uiRoot, "VictoryPanel", true);
            CreatePanel<ResultPanel>(uiRoot, "DefeatPanel", false);
            CreatePanel<GalleryPanel>(uiRoot, "GalleryPanel");
            CreatePanel<AchievementsPanel>(uiRoot, "AchievementsPanel");
            CreatePanel<LeaderboardPanel>(uiRoot, "LeaderboardPanel");
            CreatePanel<DailyChallengePanel>(uiRoot, "DailyChallengePanel");
        }

        private void CreatePanel<T>(Transform parent, string name, bool configureVictory = false) where T : UIPanelBase
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var panel = go.AddComponent<T>();

            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            var content = new GameObject("Content");
            content.transform.SetParent(go.transform, false);
            var crt = content.AddComponent<RectTransform>();
            crt.anchorMin = Vector2.zero;
            crt.anchorMax = Vector2.one;
            crt.offsetMin = Vector2.zero;
            crt.offsetMax = Vector2.zero;
            content.SetActive(false);

            var panelField = typeof(UIPanelBase).GetField("panelContent",
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            if (panelField != null) panelField.SetValue(panel, content);

            if (configureVictory)
            {
                var isVictoryField = typeof(ResultPanel).GetField("isVictoryPanel",
                    System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
                if (isVictoryField != null) isVictoryField.SetValue(panel, true);
            }
        }

        private void EnsureComponent<T>() where T : Component
        {
            if (FindObjectOfType<T>() == null)
            {
                var go = new GameObject(typeof(T).Name);
                go.transform.SetParent(transform, false);
                go.AddComponent<T>();
            }
        }

        private void ShowMainMenu()
        {
            UIManager.Instance.OpenPanel(UIType.MainMenu);
            AudioManager.Instance.PlayMusic(0);
        }

        public void OnApplicationPause(bool paused)
        {
            if (!paused)
            {
                _ = SaveSystem.Instance.SaveGame();
            }
        }
    }

    public class EventBusProxy : MonoBehaviour { }
}
