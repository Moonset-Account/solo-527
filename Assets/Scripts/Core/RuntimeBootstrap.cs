using UnityEngine;
using UnityEngine.SceneManagement;

public class RuntimeBootstrap : MonoBehaviour
{
    private static bool _initialized;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
    private static void EnsureCoreManagers()
    {
        if (_initialized) return;
        _initialized = true;

        EnsureSingleton<SaveSystem>();
        EnsureSingleton<InputMapper>();
        EnsureSingleton<AudioTrigger>();
        EnsureSingleton<CoroutineRunner>();
        EnsureSingleton<SceneMgr>();
        EnsureSingleton<UIStateManager>();
        EnsureSingleton<GameFlowManager>();

        SceneManager.sceneLoaded += OnSceneLoaded;
    }

    private static void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        string sceneName = scene.name;

        if (UIStateManager.Instance != null)
        {
            switch (sceneName)
            {
                case "MainMenu":
                    UIStateManager.Instance.ChangeState(UIState.MainMenu);
                    break;
                case "LevelSelect":
                    UIStateManager.Instance.ChangeState(UIState.LevelSelect);
                    break;
                case "Gameplay":
                    UIStateManager.Instance.ChangeState(UIState.Gameplay);
                    break;
            }
        }

        if (GameFlowManager.Instance != null)
        {
            switch (sceneName)
            {
                case "MainMenu":
                    GameFlowManager.Instance.SetPhase(GameFlowManager.GamePhase.MainMenu);
                    break;
                case "LevelSelect":
                    GameFlowManager.Instance.SetPhase(GameFlowManager.GamePhase.LevelSelect);
                    break;
                case "Gameplay":
                    GameFlowManager.Instance.SetPhase(GameFlowManager.GamePhase.Gameplay);
                    break;
            }
        }

        if (sceneName == "Gameplay")
        {
            EnsureGameplayManagers();
            WireGameplayReferences();

            if (GameFlowManager.Instance != null)
                GameFlowManager.Instance.OnGameplaySceneReady();
        }
    }

    private static void EnsureGameplayManagers()
    {
        EnsureSingleton<WeatherSystem>();
        EnsureSingleton<WeatherAudioPlayer>();
        EnsureSingleton<LevelManager>();
        EnsureSingleton<MissionManager>();
        EnsureSingleton<CollectionManager>();
        EnsureSingleton<GameDataRecorder>();
    }

    private static void WireGameplayReferences()
    {
        var weatherSys = FindObjectOfType<WeatherSystem>();
        if (weatherSys != null && (weatherSys.weatherPresets == null || weatherSys.weatherPresets.Count == 0))
        {
            var presets = new System.Collections.Generic.List<WeatherData>();
            var allWeather = ResLoader.Instance.LoadAll<WeatherData>("Weather");
            if (allWeather != null)
            {
                foreach (var w in allWeather)
                {
                    if (w != null) presets.Add(w);
                }
            }
            weatherSys.weatherPresets = presets;
        }

        var boat = FindObjectOfType<BoatController>();
        var supply = FindObjectOfType<SupplySystem>();
        if (boat != null && supply != null)
        {
            supply.boatTransform = boat.transform;
        }
    }

    private static void EnsureSingleton<T>() where T : Component
    {
        if (FindObjectOfType<T>() != null) return;

        var go = new GameObject(typeof(T).Name);
        go.AddComponent<T>();
        Debug.Log($"[RuntimeBootstrap] 自动创建 {typeof(T).Name}");
    }
}
