using UnityEngine;

namespace LakeNavigation
{
    public class AppBootstrapper : MonoBehaviour
    {
        private GameConfig _gameConfig;

        private void Awake()
        {
            ServiceLocator.Initialize();

            _gameConfig = ScriptableObject.CreateInstance<GameConfig>();
            ServiceLocator.Instance.Register(_gameConfig);

            var gameManagerObj = new GameObject("GameManager");
            var gameManager = gameManagerObj.AddComponent<GameManager>();

            var uiManagerObj = new GameObject("UIManager");
            var uiManager = uiManagerObj.AddComponent<UIManager>();

            var weatherSystemObj = new GameObject("WeatherSystem");
            var weatherSystem = weatherSystemObj.AddComponent<WeatherSystem>();

            var levelManagerObj = new GameObject("LevelManager");
            var levelManager = levelManagerObj.AddComponent<LevelManager>();

            var boatControllerObj = new GameObject("BoatController");
            var boatController = boatControllerObj.AddComponent<BoatController>();

            var supplyManagerObj = new GameObject("SupplyManager");
            var supplyManager = supplyManagerObj.AddComponent<SupplyManager>();

            var missionManagerObj = new GameObject("MissionManager");
            var missionManager = missionManagerObj.AddComponent<MissionManager>();

            var collisionDetectorObj = new GameObject("CollisionDetector");
            var collisionDetector = collisionDetectorObj.AddComponent<CollisionDetector>();

            var boatAnimObj = new GameObject("BoatAnimation");
            var boatAnim = boatAnimObj.AddComponent<BoatAnimationController>();
            boatAnimObj.transform.SetParent(boatController.transform);
            boatAnim.Initialize(boatController.transform);

            var encyclopediaSystemObj = new GameObject("EncyclopediaSystem");
            var encyclopediaSystem = encyclopediaSystemObj.AddComponent<EncyclopediaSystem>();
            encyclopediaSystem.Initialize(DefaultEntries.GetAll());

            var sailingControllerObj = new GameObject("SailingController");
            var sailingController = sailingControllerObj.AddComponent<SailingController>();

            var inputHandlerObj = new GameObject("InputHandler");
            inputHandlerObj.AddComponent<InputHandler>();

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
            ServiceLocator.Instance.Register<GameConfig>(null);
            ServiceLocator.Instance.Reset();
        }
    }
}
