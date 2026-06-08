using UnityEngine;
using Kitchen.Core;
using Kitchen.Gameplay;
using Kitchen.Levels;
using Kitchen.UI;
using Kitchen.Input;
using Kitchen.Save;
using Kitchen.Performance;

namespace Kitchen.Setup
{
    public class SceneInitializer : MonoBehaviour
    {
        [Header("Managers")]
        public GameManager gameManager;
        public PlayerManager playerManager;
        public InputManager inputManager;
        public OrderManager orderManager;
        public LevelManager levelManager;
        public SaveManager saveManager;
        public PerformanceStats perfStats;
        public FrameRateAdapter frameRateAdapter;

        [Header("UI")]
        public HUDController hud;
        public TutorialController tutorial;
        public PauseMenuController pauseMenu;
        public SettingsMenuController settingsMenu;
        public ResultScreenController resultScreen;
        public MainMenuController mainMenu;
        public PerformanceOverlay perfOverlay;

        [Header("Environment")]
        public Transform playerSpawnRoot;
        public Transform stationSpawnRoot;

        [Header("Gameplay Prefabs")]
        public GameObject playerPrefab;
        public GameObject[] stationPrefabs;
        public GameObject heldItemPrefab;
        public GameObject platePrefab;

        private void Awake()
        {
            CreateOrAssign(ref gameManager);
            CreateOrAssign(ref playerManager);
            CreateOrAssign(ref inputManager);
            CreateOrAssign(ref orderManager);
            CreateOrAssign(ref levelManager);
            CreateOrAssign(ref saveManager);
            CreateOrAssign(ref perfStats);
            CreateOrAssign(ref frameRateAdapter);

            SetupReferences();
        }

        private void Start()
        {
            saveManager?.LoadOrCreateSave();
            frameRateAdapter?.ApplySettingsFromSave();
            frameRateAdapter?.StartAdaptation();

            if (GameManager.Instance.CurrentState == GameManager.GameState.Boot)
            {
                GameManager.Instance.ChangeState(GameManager.GameState.MainMenu);
            }
        }

        private void SetupReferences()
        {
            if (playerManager != null)
            {
                playerManager.playerPrefab = playerPrefab;
                if (playerSpawnRoot != null)
                {
                    var spawns = new System.Collections.Generic.List<Transform>();
                    foreach (Transform t in playerSpawnRoot) spawns.Add(t);
                    playerManager.spawnPoints = spawns.ToArray();
                }
            }

            if (orderManager != null)
            {
                orderManager.heldItemPrefab = heldItemPrefab;
            }

            if (levelManager != null)
            {
                levelManager.stationPrefabs = stationPrefabs;
                levelManager.stationSpawnRoot = stationSpawnRoot;
            }
        }

        private void CreateOrAssign<T>(ref T field) where T : MonoBehaviour
        {
            if (field != null) return;
            T existing = FindObjectOfType<T>();
            if (existing != null) { field = existing; return; }
            GameObject go = new GameObject(typeof(T).Name);
            field = go.AddComponent<T>();
        }
    }
}
