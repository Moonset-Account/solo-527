using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace DecorMatch3
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public GameState CurrentState { get; private set; }
        public int CurrentLevelId { get; private set; }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void EnsureExists()
        {
            if (Instance != null) return;
            GameObject go = new GameObject("[GameManager]");
            go.AddComponent<GameManager>();
        }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            gameObject.AddComponent<SaveManager>();
            gameObject.AddComponent<ConfigManager>();
            gameObject.AddComponent<AudioManager>();
            gameObject.AddComponent<InputManager>();
            gameObject.AddComponent<PerformanceMonitor>();

            SaveManager.Instance.Load();
            ConfigManager.Instance.Init();
            AudioManager.Instance.Init();
            InputManager.Instance.Init();
            PerformanceMonitor.Instance.Init();

            SceneManager.sceneLoaded += OnSceneLoaded;
        }

        private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            if (scene.name == "MainMenu")
            {
                var boot = FindObjectOfType<MainMenuBootstrapper>();
                if (boot == null)
                {
                    GameObject bootObj = new GameObject("MainMenuBootstrapper");
                    boot = bootObj.AddComponent<MainMenuBootstrapper>();
                }
                boot.Setup();
                ChangeState(GameState.MainMenu);
            }
            else if (scene.name == "Gameplay")
            {
                ChangeState(GameState.Playing);
            }
        }

        public void ChangeState(GameState newState)
        {
            CurrentState = newState;
            GameEvents.TriggerStateChanged(newState);
        }

        public void StartNewGame()
        {
            SaveManager.Instance.DeleteSave();
            SaveManager.Instance.Load();
            ChangeState(GameState.LevelSelect);
        }

        public void LoadLevel(int levelId)
        {
            CurrentLevelId = levelId;
            StartCoroutine(LoadSceneAndStart("Gameplay", () =>
            {
                var boot = FindObjectOfType<GameplayBootstrapper>();
                if (boot == null)
                {
                    GameObject bootObj = new GameObject("GameplayBootstrapper");
                    boot = bootObj.AddComponent<GameplayBootstrapper>();
                }
                boot.LaunchLevel(levelId);
            }));
        }

        public void LoadDecoration(int levelId)
        {
            CurrentLevelId = levelId;
            StartCoroutine(LoadSceneAndStart("Gameplay", () =>
            {
                var boot = FindObjectOfType<GameplayBootstrapper>();
                if (boot == null)
                {
                    GameObject bootObj = new GameObject("GameplayBootstrapper");
                    boot = bootObj.AddComponent<GameplayBootstrapper>();
                }
                boot.LaunchDecoration(levelId);
            }));
        }

        public void ReturnToMenu()
        {
            StartCoroutine(LoadSceneAndStart("MainMenu", () =>
            {
                ChangeState(GameState.MainMenu);
            }));
        }

        public void QuitGame()
        {
            SaveManager.Instance.Save();
            Application.Quit();
        }

        private IEnumerator LoadSceneAndStart(string sceneName, System.Action onLoaded)
        {
            ChangeState(GameState.Loading);
            AsyncOperation asyncLoad = SceneManager.LoadSceneAsync(sceneName);
            if (asyncLoad == null)
            {
                Debug.LogError("Failed to load scene: " + sceneName);
                yield break;
            }
            while (!asyncLoad.isDone)
            {
                yield return null;
            }
            onLoaded?.Invoke();
        }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                if (CurrentState == GameState.Playing)
                {
                    ChangeState(GameState.Paused);
                }
                else if (CurrentState == GameState.Paused)
                {
                    ChangeState(GameState.Playing);
                }
            }
        }

        private void OnDestroy()
        {
            SceneManager.sceneLoaded -= OnSceneLoaded;
        }
    }
}
