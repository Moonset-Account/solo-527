using UnityEngine;
using TeaGardenDefense.Core;
using TeaGardenDefense.Tests;

namespace TeaGardenDefense
{
    public class SceneInitializer : MonoBehaviour
    {
        public bool runAcceptanceTests = true;
        public bool addMainCamera = true;
        public bool addEventSystem = true;
        public bool addDebugConsole = true;
        public string startLevelId = "level_1";

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void AutoInitialize()
        {
            if (FindObjectOfType<SceneInitializer>() == null)
            {
                var go = new GameObject("[SceneInitializer]");
                go.AddComponent<SceneInitializer>();
            }
        }

        private void Awake()
        {
            if (addMainCamera && Camera.main == null)
            {
                var camGo = new GameObject("Main Camera");
                camGo.tag = "MainCamera";
                var cam = camGo.AddComponent<Camera>();
                cam.clearFlags = CameraClearFlags.SolidColor;
                cam.backgroundColor = new Color(0.15f, 0.3f, 0.15f);
                cam.orthographic = true;
                cam.orthographicSize = 15f;
                camGo.transform.position = new Vector3(0, 15, -10);
                camGo.transform.rotation = Quaternion.Euler(45, 0, 0);
                camGo.AddComponent<AudioListener>();
            }

            if (addEventSystem && FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
            {
                var esGo = new GameObject("EventSystem");
                esGo.AddComponent<UnityEngine.EventSystems.EventSystem>();
                esGo.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
            }
        }

        private void Start()
        {
            if (GameManager.Instance == null)
            {
                var gmGo = new GameObject("[GameManager]");
                gmGo.AddComponent<GameManager>();
                DontDestroyOnLoad(gmGo);
            }

            if (GameManager.Instance.GetComponent<PerformanceStats>() == null)
            {
                GameManager.Instance.gameObject.AddComponent<PerformanceStats>();
            }

            if (FindObjectOfType<GameBootstrap>() == null)
            {
                gameObject.AddComponent<GameBootstrap>();
            }

            if (addDebugConsole && FindObjectOfType<DebugConsole>() == null)
            {
                gameObject.AddComponent<DebugConsole>();
            }

            if (runAcceptanceTests && FindObjectOfType<AcceptanceTestRunner>() == null)
            {
                gameObject.AddComponent<AcceptanceTestRunner>();
            }

            if (PerformanceStats.Instance != null)
            {
                PerformanceStats.Instance.RegisterCounter("TowersBuilt", "建造塔数");
                PerformanceStats.Instance.RegisterCounter("TowersUpgraded", "升级次数");
                PerformanceStats.Instance.RegisterCounter("WavesStarted", "开始波次");
                PerformanceStats.Instance.RegisterCounter("EnemiesKilled", "击杀敌人");
                PerformanceStats.Instance.RegisterCounter("EnemiesPassed", "漏掉敌人");
                PerformanceStats.Instance.RegisterCounter("Victories", "胜利次数");
                PerformanceStats.Instance.RegisterCounter("Defeats", "失败次数");
            }

            Debug.Log("🏯 茶园塔防 场景初始化完成");
            Debug.Log("📖 操作说明: Space=开始波次 | Shift=加速 | ESC=暂停 | 1-5=选塔 | U=升级 | S=出售 | F1=控制台 | F5=重玩 | F6=下一关");
        }
    }
}
