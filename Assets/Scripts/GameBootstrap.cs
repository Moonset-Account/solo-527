using UnityEngine;
using UnityEngine.UI;
using RainAlley.GameFlow;
using RainAlley.UI;
using RainAlley.Audio;

namespace RainAlley
{
    public class GameBootstrap : MonoBehaviour
    {
        private static bool _bootstrapped = false;
        public static Transform UICanvasRoot { get; private set; }
        public static GameManager GM { get; private set; }

        private void Awake()
        {
            if (_bootstrapped) { Destroy(gameObject); return; }
            _bootstrapped = true;
            DontDestroyOnLoad(gameObject);
            Bootstrap();
        }

        private void Bootstrap()
        {
            BuildCamera();
            BuildCanvas();
            BuildGameManager();
            BuildAudio();
            UIFactory.BuildAll(UICanvasRoot);
            Debug.Log("[RainAlley] 引导完成：\n" +
                      "  • GameManager / BeatJudge / ColorStateMachine\n" +
                      "  • CalibrationManager / TrackObstacleManager / ReplayManager\n" +
                      "  • LeaderboardManager / InputManager\n" +
                      "  • 纯代码构建：主菜单 / 校准页 / 游戏HUD / 结算页\n" +
                      "  • 雨声 + 节拍音效（程序化生成 AudioClip）");
        }

        private void BuildCamera()
        {
            if (Camera.main == null)
            {
                var camGo = new GameObject("Main Camera");
                camGo.tag = "MainCamera";
                var cam = camGo.AddComponent<Camera>();
                cam.clearFlags = CameraClearFlags.SolidColor;
                cam.backgroundColor = new Color(0.08f, 0.1f, 0.16f, 1f);
                cam.orthographic = true;
                cam.orthographicSize = 5f;
                camGo.AddComponent<AudioListener>();
            }
            else if (Camera.main.GetComponent<AudioListener>() == null)
            {
                Camera.main.gameObject.AddComponent<AudioListener>();
            }
        }

        private void BuildCanvas()
        {
            var canvasGo = new GameObject("UI Canvas");
            canvasGo.layer = 5;
            var canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            canvas.pixelPerfect = true;

            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280, 720);
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.5f;

            canvasGo.AddComponent<GraphicRaycaster>();

            UICanvasRoot = canvasGo.transform;
            DontDestroyOnLoad(canvasGo);

            var es = FindObjectOfType<UnityEngine.EventSystems.EventSystem>();
            if (es == null)
            {
                var esGo = new GameObject("EventSystem");
                esGo.AddComponent<UnityEngine.EventSystems.EventSystem>();
                esGo.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
                DontDestroyOnLoad(esGo);
            }
        }

        private void BuildGameManager()
        {
            if (GameManager.Instance != null) { GM = GameManager.Instance; return; }
            var gmGo = new GameObject("GameManager");
            GM = gmGo.AddComponent<GameManager>();
        }

        private void BuildAudio()
        {
            if (FindObjectOfType<AudioSystem>() == null)
            {
                var audioGo = new GameObject("AudioSystem");
                audioGo.AddComponent<AudioSystem>();
            }
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
