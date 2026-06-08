using UnityEngine;

namespace LakeNavigation
{
    public class AppBootstrapper : MonoBehaviour
    {
        private GameConfig _gameConfig;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void AutoInit()
        {
            var go = new GameObject("AppBootstrapper");
            go.AddComponent<AppBootstrapper>();
            DontDestroyOnLoad(go);
        }

        private void Awake()
        {
            ServiceLocator.Initialize();

            _gameConfig = ScriptableObject.CreateInstance<GameConfig>();
            ServiceLocator.Instance.Register(_gameConfig);

            var gameManagerObj = new GameObject("GameManager");
            gameManagerObj.AddComponent<GameManager>();
            DontDestroyOnLoad(gameManagerObj);

            var uiManagerObj = new GameObject("UIManager");
            uiManagerObj.AddComponent<UIManager>();
            DontDestroyOnLoad(uiManagerObj);

            var weatherSystemObj = new GameObject("WeatherSystem");
            weatherSystemObj.AddComponent<WeatherSystem>();
            DontDestroyOnLoad(weatherSystemObj);

            var levelManagerObj = new GameObject("LevelManager");
            var levelManager = levelManagerObj.AddComponent<LevelManager>();
            DontDestroyOnLoad(levelManagerObj);

            var boatControllerObj = new GameObject("BoatController");
            boatControllerObj.AddComponent<BoatController>();
            DontDestroyOnLoad(boatControllerObj);

            var supplyManagerObj = new GameObject("SupplyManager");
            supplyManagerObj.AddComponent<SupplyManager>();
            DontDestroyOnLoad(supplyManagerObj);

            var missionManagerObj = new GameObject("MissionManager");
            missionManagerObj.AddComponent<MissionManager>();
            DontDestroyOnLoad(missionManagerObj);

            var collisionDetectorObj = new GameObject("CollisionDetector");
            collisionDetectorObj.AddComponent<CollisionDetector>();
            DontDestroyOnLoad(collisionDetectorObj);

            var boatAnimObj = new GameObject("BoatAnimation");
            var boatAnim = boatAnimObj.AddComponent<BoatAnimationController>();
            DontDestroyOnLoad(boatAnimObj);
            boatAnim.Initialize(boatControllerObj.transform);

            var encyclopediaSystemObj = new GameObject("EncyclopediaSystem");
            var encyclopediaSystem = encyclopediaSystemObj.AddComponent<EncyclopediaSystem>();
            DontDestroyOnLoad(encyclopediaSystemObj);
            encyclopediaSystem.Initialize(DefaultEntries.GetAll());

            var sailingControllerObj = new GameObject("SailingController");
            sailingControllerObj.AddComponent<SailingController>();
            DontDestroyOnLoad(sailingControllerObj);

            var routePlannerObj = new GameObject("RoutePlanner");
            routePlannerObj.AddComponent<RoutePlanner>();
            DontDestroyOnLoad(routePlannerObj);

            var inputHandlerObj = new GameObject("InputHandler");
            inputHandlerObj.AddComponent<InputHandler>();
            DontDestroyOnLoad(inputHandlerObj);

            levelManager.levels.Add(LevelPresets.FirstVoyage());
            levelManager.levels.Add(LevelPresets.MistyMorning());
            levelManager.levels.Add(LevelPresets.WindyCrossing());
            levelManager.levels.Add(LevelPresets.StormChase());
            levelManager.levels.Add(LevelPresets.TheGrandTour());

            UIManager.Instance.Initialize();

            var debugPanelObj = new GameObject("DebugPanel");
            debugPanelObj.transform.SetParent(UIManager.Instance.transform);
            debugPanelObj.AddComponent<DebugPanel>();

            GameManager.Instance.ChangeState(GameState.MainMenu);
        }

        private void OnDestroy()
        {
            if (ServiceLocator.Instance != null)
            {
                ServiceLocator.Instance.Register<GameConfig>(null);
                ServiceLocator.Instance.Reset();
            }
        }
    }
}
