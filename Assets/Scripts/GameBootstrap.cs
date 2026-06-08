using UnityEngine;
using RainAlley.GameFlow;

namespace RainAlley
{
    public class GameBootstrap : MonoBehaviour
    {
        [Header("核心预制体")]
        public GameManager GameManagerPrefab;

        [Header("UI 预制体")]
        public GameObject MainMenuPrefab;
        public GameObject CalibrationPagePrefab;
        public GameObject GameplayHUDPrefab;
        public GameObject ResultsPagePrefab;

        [Header("场景对象")]
        public Transform UICanvasRoot;

        private static bool _bootstrapped = false;

        private void Awake()
        {
            if (_bootstrapped)
            {
                Destroy(gameObject);
                return;
            }
            _bootstrapped = true;
            DontDestroyOnLoad(gameObject);
            Bootstrap();
        }

        private void Bootstrap()
        {
            if (GameManager.Instance == null && GameManagerPrefab != null)
            {
                Instantiate(GameManagerPrefab);
            }
            else if (GameManager.Instance == null)
            {
                var gmGo = new GameObject("GameManager");
                gmGo.AddComponent<GameManager>();
            }

            if (UICanvasRoot == null)
            {
                var canvasGo = new GameObject("UI Canvas");
                var canvas = canvasGo.AddComponent<Canvas>();
                canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                canvas.sortingOrder = 100;
                canvasGo.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                canvasGo.AddComponent<GraphicRaycaster>();
                UICanvasRoot = canvasGo.transform;
                DontDestroyOnLoad(canvasGo);
            }

            if (MainMenuPrefab != null) InstantiateUI(MainMenuPrefab, "MainMenu");
            if (CalibrationPagePrefab != null) InstantiateUI(CalibrationPagePrefab, "CalibrationPage");
            if (GameplayHUDPrefab != null) InstantiateUI(GameplayHUDPrefab, "GameplayHUD");
            if (ResultsPagePrefab != null) InstantiateUI(ResultsPagePrefab, "ResultsPage");

            if (Camera.main == null)
            {
                var camGo = new GameObject("Main Camera");
                camGo.tag = "MainCamera";
                var cam = camGo.AddComponent<Camera>();
                cam.clearFlags = CameraClearFlags.SolidColor;
                cam.backgroundColor = new Color(0.1f, 0.12f, 0.18f);
            }

            if (FindObjectOfType<AudioListener>() == null)
            {
                Camera.main.gameObject.AddComponent<AudioListener>();
            }

            Debug.Log("[RainAlley] 引导完成。模块已就绪：\n" +
                      "  • 节拍判定 (BeatJudge)\n" +
                      "  • 颜色状态机 (ColorStateMachine)\n" +
                      "  • 延迟校准 (CalibrationManager)\n" +
                      "  • 轨道障碍 (TrackObstacleManager)\n" +
                      "  • 失败回放 (ReplayManager)\n" +
                      "  • 排行榜 (LeaderboardManager)\n" +
                      "  • 关卡配置 (LevelConfig x4)\n" +
                      "  • 输入系统 (InputManager 键盘/触屏)");
        }

        private GameObject InstantiateUI(GameObject prefab, string fallbackName)
        {
            if (prefab == null) return null;
            var go = Instantiate(prefab, UICanvasRoot);
            go.name = fallbackName;
            return go;
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void AutoBoot()
        {
            if (_bootstrapped) return;
            if (FindObjectOfType<GameBootstrap>() != null) return;

            var go = new GameObject("[RainAlley Bootstrap]");
            go.AddComponent<GameBootstrap>();
        }
    }
}
