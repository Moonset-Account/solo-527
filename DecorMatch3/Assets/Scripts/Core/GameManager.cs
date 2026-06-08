using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace DecorMatch3
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public GameState CurrentState { get; private set; }

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
        }

        public void ChangeState(GameState newState)
        {
            CurrentState = newState;
            GameEvents.OnStateChanged?.Invoke(newState);
        }

        public void StartNewGame()
        {
            SaveManager.Instance.DeleteSave();
            SaveManager.Instance.Load();
            ChangeState(GameState.LevelSelect);
        }

        public void LoadLevel(int levelId)
        {
            StartCoroutine(LoadLevelCoroutine(levelId));
        }

        private IEnumerator LoadLevelCoroutine(int levelId)
        {
            ChangeState(GameState.Loading);
            AsyncOperation asyncLoad = SceneManager.LoadSceneAsync($"Level_{levelId}");
            while (!asyncLoad.isDone)
            {
                yield return null;
            }
            ChangeState(GameState.Playing);
        }

        public void ReturnToMenu()
        {
            StartCoroutine(ReturnToMenuCoroutine());
        }

        private IEnumerator ReturnToMenuCoroutine()
        {
            AsyncOperation asyncLoad = SceneManager.LoadSceneAsync("MainMenu");
            while (!asyncLoad.isDone)
            {
                yield return null;
            }
            ChangeState(GameState.Menu);
        }

        public void QuitGame()
        {
            SaveManager.Instance.Save();
            Application.Quit();
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
    }
}
