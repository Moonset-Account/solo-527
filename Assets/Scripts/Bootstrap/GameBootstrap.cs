using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using YouthTrainingManagement.Animation;
using YouthTrainingManagement.Audio;
using YouthTrainingManagement.Core;
using YouthTrainingManagement.InputSystem;
using YouthTrainingManagement.UI;
using YouthTrainingManagement.Utils;

namespace YouthTrainingManagement.Bootstrap
{
    public class GameBootstrap : MonoBehaviour
    {
        public static bool Bootstrapped = false;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void AutoBoot()
        {
            if (Bootstrapped) return;
            Bootstrapped = true;
            var go = new GameObject("=GameBootstrap=", typeof(GameBootstrap));
            DontDestroyOnLoad(go);
        }

        private IEnumerator Start()
        {
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 1;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;

            if (Camera.main == null)
            {
                var camGO = new GameObject("Main Camera", typeof(Camera), typeof(AudioListener));
                camGO.tag = "MainCamera";
                camGO.GetComponent<Camera>().clearFlags = CameraClearFlags.SolidColor;
                camGO.GetComponent<Camera>().backgroundColor = new Color(0.04f, 0.04f, 0.07f, 1f);
                camGO.GetComponent<Camera>().orthographic = true;
                camGO.GetComponent<Camera>().orthographicSize = 5;
            }

            if (EventSystem.current == null)
            {
                new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            }

            var canvasGO = new GameObject("UICanvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster), typeof(UIManager));
            DontDestroyOnLoad(canvasGO);
            var canvas = canvasGO.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 10;
            var scaler = canvasGO.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;

            var perfGO = new GameObject("PerformanceStats", typeof(PerformanceStats));
            perfGO.transform.SetParent(canvasGO.transform, false);
            var perf = perfGO.GetComponent<PerformanceStats>();
            perf.PerformanceCanvas = canvas;

            var gmGO = new GameObject("=GameManager=", typeof(GameManager));
            DontDestroyOnLoad(gmGO);
            var gm = gmGO.GetComponent<GameManager>();

            gm.InitializeSystems();
            yield return null;

            var ui = canvasGO.GetComponent<UIManager>();
            ui.Initialize(gm, canvas.transform);
            gm.SetUIManager(ui);
            gm.SetPerformanceStats(perf);

            ScreenShake.Instance.GlobalIntensity = gm.Settings.ScreenShakeIntensity;
            UITweener.GlobalSpeed = gm.Settings.UiAnimationSpeed;

            gm.ApplySettings(gm.Settings);
            gm.StartGame();
        }
    }
}
