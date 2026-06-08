using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace LightShadowPlatformer.Runtime
{
    public enum SceneType { MainMenu, Level01, Level02, Level03 }

    public class RuntimeSceneBuilder : MonoBehaviour
    {
        public SceneType sceneType = SceneType.MainMenu;
        public bool autoBuildOnStart = true;

        private static RuntimeSceneBuilder _instance;
        private static bool _builtThisScene;

        private void Awake()
        {
            if (_instance == null) _instance = this;
        }

        private void Start()
        {
            if (autoBuildOnStart && !_builtThisScene)
            {
                Build(sceneType);
            }
        }

        public static RuntimeSceneBuilder Get() => _instance;

        public static void EnsureAllManagersExist()
        {
            EnsureManager<LightShadowPlatformer.Core.GameManager>("[GameManager]");
            EnsureManager<LightShadowPlatformer.Core.SaveManager>("[SaveManager]");
            EnsureManager<LightShadowPlatformer.Core.SettingsManager>("[SettingsManager]");
            EnsureManager<LightShadowPlatformer.Core.AudioManager>("[AudioManager]");
            EnsureManager<LightShadowPlatformer.Core.LightManager>("[LightManager]");
            EnsureManager<LightShadowPlatformer.UI.UIManager>("[UIManager]");
        }

        public void Rebuild(SceneType type)
        {
            ClearScene();
            Build(type);
        }

        public static void Build(SceneType type)
        {
            _builtThisScene = true;
            EnsureAllManagersExist();

            RuntimeSceneBuilder inst = Get();
            if (inst == null)
            {
                GameObject go = new GameObject("RuntimeSceneBuilder");
                inst = go.AddComponent<RuntimeSceneBuilder>();
            }

            switch (type)
            {
                case SceneType.MainMenu: inst.BuildMainMenu(); break;
                case SceneType.Level01: inst.BuildLevel1(); break;
                case SceneType.Level02: inst.BuildLevel2(); break;
                case SceneType.Level03: inst.BuildLevel3(); break;
            }

            inst.EnsureCamera();
            RuntimeUIFactory.EnsureAllUI();
            RuntimeAudioFactory.EnsureAllAudio();
            int lvlIdx = type == SceneType.MainMenu ? -1 : (int)type - 1;
            LightShadowPlatformer.Core.EventManager.Instance.TriggerLevelLoaded(lvlIdx);
        }

        private void ClearScene()
        {
            var roots = SceneManager.GetActiveScene().GetRootGameObjects();
            foreach (var r in roots)
            {
                if (r.GetComponent<RuntimeSceneBuilder>() == null &&
                    r.name.StartsWith("[") && r.name.EndsWith("]")) continue;
                if (r.name == "RuntimeSceneBuilder") continue;
                Destroy(r);
            }
            _builtThisScene = false;
        }

        private void EnsureManagersExist()
        {
            EnsureAllManagersExist();
        }

        private static T EnsureManager<T>(string name) where T : MonoBehaviour
        {
            T existing = Object.FindObjectOfType<T>();
            if (existing != null) return existing;
            GameObject go = new GameObject(name);
            Object.DontDestroyOnLoad(go);
            return go.AddComponent<T>();
        }

        private void EnsureCamera()
        {
            Camera cam = Camera.main;
            if (cam == null)
            {
                GameObject cgo = new GameObject("Main Camera");
                cgo.tag = "MainCamera";
                cam = cgo.AddComponent<Camera>();
                cgo.AddComponent<AudioListener>();
            }
            cam.orthographic = true;
            cam.orthographicSize = 7.5f;
            cam.backgroundColor = new Color(0.12f, 0.13f, 0.18f);
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.transform.position = new Vector3(0, 5, -10);

            if (cam.GetComponent<LightShadowPlatformer.Camera.CameraController>() == null)
            {
                cam.gameObject.AddComponent<LightShadowPlatformer.Camera.CameraController>();
            }
        }

        // ============== MAIN MENU ==============
        private void BuildMainMenu()
        {
            var bg = RuntimeFactory.CreateBackground(
                "MenuBackground", Vector3.zero, new Vector2(1280, 720),
                new Color(0.12f, 0.15f, 0.22f), 100f);

            var title = RuntimeFactory.CreateTitleArea(new Vector3(0, 3f, 0));

            LightShadowPlatformer.Core.GameManager.Instance.ChangeState(
                LightShadowPlatformer.Core.GameManager.GameState.MainMenu);
        }

        // ============== LEVEL 1: TUTORIAL ==============
        private void BuildLevel1()
        {
            LightShadowPlatformer.Core.LightManager.Instance.currentDirection =
                LightShadowPlatformer.Core.LightManager.LightDirection.Left;

            BuildEnvironment(new Vector2(-50, -10), new Vector2(60, 15), killY: -15f,
                bgColor: new Color(0.14f, 0.16f, 0.24f));

            var player = RuntimeFactory.CreatePlayer(new Vector3(-7, 2, 0));

            RuntimeFactory.CreateGroundPlatform(new Vector3(-1, -0.5f, 0), new Vector2(12, 1));
            RuntimeFactory.CreateShadowPlatform(new Vector3(7, 2, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.LeftOnly, "L1_Left1");
            RuntimeFactory.CreateShadowPlatform(new Vector3(13, 4, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.RightOnly, "L1_Right1");
            RuntimeFactory.CreateShadowPlatform(new Vector3(19, 5.5f, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.HorizontalOnly, "L1_Hori1");
            RuntimeFactory.CreateGroundPlatform(new Vector3(26, 6, 0), new Vector2(6, 1));

            RuntimeFactory.CreateCollectible(new Vector3(7, 3.5f, 0), "L1_G1");
            RuntimeFactory.CreateCollectible(new Vector3(13, 5.5f, 0), "L1_G2");
            RuntimeFactory.CreateCollectible(new Vector3(19, 7f, 0), "L1_G3");

            RuntimeFactory.CreateTutorialTrigger(new Vector3(-5, 1, 0), new Vector2(5, 4),
                "movement", "【教程 1/4】移动\n按 A / D 键左右移动", 6f);
            RuntimeFactory.CreateTutorialTrigger(new Vector3(2, 2, 0), new Vector2(4, 5),
                "jump", "【教程 2/4】跳跃\n按 空格键 跳跃\n松开空格可提前下落", 6f);
            RuntimeFactory.CreateTutorialTrigger(new Vector3(7, 3, 0), new Vector2(5, 5),
                "light", "【教程 3/4】切换光源\n按 E 键切换光线方向\n蓝平台在右光时出现，黄平台在左光时出现\n切换后观察平台变化！", 8f);
            RuntimeFactory.CreateTutorialTrigger(new Vector3(24, 6, 0), new Vector2(4, 4),
                "checkpoint", "【教程 4/4】存档点\n走过去自动激活\n死亡后从最近存档点复活", 5f);

            RuntimeFactory.CreateCheckpoint(new Vector3(26, 7, 0), "L1_CP1");
            RuntimeFactory.CreateGroundPlatform(new Vector3(36, 5, 0), new Vector2(5, 1));
            RuntimeFactory.CreateGoal(new Vector3(37, 6.5f, 0));

            AddHazardIfEnabled(new Vector3(32, 0.3f, 0), new Vector2(3, 0.6f), false);

            SetupCameraForLevel(new Vector2(-50, -10), new Vector2(50, 18), 7.5f);
            SetLevelIndex(0);
        }

        // ============== LEVEL 2: PUZZLE ==============
        private void BuildLevel2()
        {
            LightShadowPlatformer.Core.LightManager.Instance.currentDirection =
                LightShadowPlatformer.Core.LightManager.LightDirection.Right;

            BuildEnvironment(new Vector2(-50, -10), new Vector2(90, 20), killY: -15f,
                bgColor: new Color(0.14f, 0.18f, 0.20f));

            var player = RuntimeFactory.CreatePlayer(new Vector3(-7, 2, 0));

            RuntimeFactory.CreateGroundPlatform(new Vector3(0, -0.5f, 0), new Vector2(14, 1));
            RuntimeFactory.CreateShadowPlatform(new Vector3(10, 2, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.RightOnly, "L2_R1");
            RuntimeFactory.CreateShadowPlatform(new Vector3(16, 4, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.TopOnly, "L2_T1");
            RuntimeFactory.CreateGroundPlatform(new Vector3(23, 6, 0), new Vector2(6, 1));

            RuntimeFactory.CreateSwitch(new Vector3(24, 7.3f, 0), "L2_SW1", new[] { "L2_DOOR1" });

            RuntimeFactory.CreateTutorialTrigger(new Vector3(24, 8, 0), new Vector2(4, 4),
                "l2_switch", "【机关教学】开关\n走过去按 F 键互动\n红门会打开！", 6f);

            RuntimeFactory.CreateDoor(new Vector3(33, 8, 0), "L2_DOOR1", false);

            RuntimeFactory.CreateGroundPlatform(new Vector3(37, 6, 0), new Vector2(4, 1));
            RuntimeFactory.CreateShadowPlatform(new Vector3(44, 7, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.LeftOnly, "L2_L1");
            RuntimeFactory.CreatePressurePlate(new Vector3(50, 9, 0), "L2_PP1", new[] { "L2_DOOR2" });

            RuntimeFactory.CreateDoor(new Vector3(57, 10, 0), "L2_DOOR2", false);

            RuntimeFactory.CreateTutorialTrigger(new Vector3(50, 10, 0), new Vector2(4, 4),
                "l2_plate", "【机关教学】压力板\n站上去即可开门\n离开后门会关闭\n需要用光源切换技巧快速通过！", 7f);

            RuntimeFactory.CreateGroundPlatform(new Vector3(63, 8, 0), new Vector2(5, 1));
            RuntimeFactory.CreateShadowPlatform(new Vector3(71, 7, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.VerticalOnly, "L2_V1");
            RuntimeFactory.CreateShadowPlatform(new Vector3(77, 9, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.AlwaysActive, "L2_Alw1");
            RuntimeFactory.CreateCheckpoint(new Vector3(77, 10.5f, 0), "L2_CP1");
            RuntimeFactory.CreateGroundPlatform(new Vector3(86, 8, 0), new Vector2(5, 1));

            RuntimeFactory.CreateCollectible(new Vector3(10, 3.5f, 0), "L2_G1");
            RuntimeFactory.CreateCollectible(new Vector3(37, 7.5f, 0), "L2_G2");
            RuntimeFactory.CreateCollectible(new Vector3(88, 9.5f, 0), "L2_G3");
            RuntimeFactory.CreateCollectible(new Vector3(71, 8.5f, 0), "L2_G4");

            RuntimeFactory.CreateHazard(new Vector3(67, 0.3f, 0), new Vector2(4, 0.6f));

            RuntimeFactory.CreateGoal(new Vector3(88, 9.5f, 0));

            SetupCameraForLevel(new Vector2(-50, -10), new Vector2(100, 20), 8f);
            SetLevelIndex(1);
        }

        // ============== LEVEL 3: FINAL ==============
        private void BuildLevel3()
        {
            LightShadowPlatformer.Core.LightManager.Instance.currentDirection =
                LightShadowPlatformer.Core.LightManager.LightDirection.Top;

            BuildEnvironment(new Vector2(-50, -15), new Vector2(120, 25), killY: -20f,
                bgColor: new Color(0.16f, 0.12f, 0.22f));

            var player = RuntimeFactory.CreatePlayer(new Vector3(-7, 2, 0));

            RuntimeFactory.CreateGroundPlatform(new Vector3(-1, -0.5f, 0), new Vector2(10, 1));

            RuntimeFactory.CreateTutorialTrigger(new Vector3(3, 1.5f, 0), new Vector2(5, 5),
                "l3_intro", "【终关：光影协奏】\n上下方向的光线首次登场\n蓝色竖线平台 = 仅上/下光激活\n红色水平平台 = 仅左/右光激活\n组合切换 4 种方向通关！", 9f);

            RuntimeFactory.CreateShadowPlatform(new Vector3(8, 2, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.HorizontalOnly, "L3_H1");
            RuntimeFactory.CreateShadowPlatform(new Vector3(15, 4, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.VerticalOnly, "L3_V1");
            RuntimeFactory.CreateShadowPlatform(new Vector3(22, 6, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.HorizontalOnly, "L3_H2");
            RuntimeFactory.CreateShadowPlatform(new Vector3(29, 8, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.VerticalOnly, "L3_V2");
            RuntimeFactory.CreateGroundPlatform(new Vector3(37, 9, 0), new Vector2(5, 1));

            RuntimeFactory.CreateCheckpoint(new Vector3(39, 10.5f, 0), "L3_CP1");

            RuntimeFactory.CreateHazard(new Vector3(18, 0.3f, 0), new Vector2(8, 0.6f));
            RuntimeFactory.CreateHazard(new Vector3(32, 0.3f, 0), new Vector2(4, 0.6f));

            RuntimeFactory.CreateSwitch(new Vector3(38, 10.3f, 0), "L3_SW1", new[] { "L3_DOOR1" });

            RuntimeFactory.CreateDoor(new Vector3(48, 11, 0), "L3_DOOR1", false);

            RuntimeFactory.CreateShadowPlatform(new Vector3(54, 10, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.TopOnly, "L3_T1");
            RuntimeFactory.CreateShadowPlatform(new Vector3(61, 12, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.BottomOnly, "L3_B1");
            RuntimeFactory.CreateShadowPlatform(new Vector3(68, 14, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.TopOnly, "L3_T2");
            RuntimeFactory.CreateShadowPlatform(new Vector3(75, 16, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.LeftOnly, "L3_L1");

            RuntimeFactory.CreatePressurePlate(new Vector3(77, 17.3f, 0), "L3_PP1", new[] { "L3_DOOR2" });

            RuntimeFactory.CreateDoor(new Vector3(87, 16, 0), "L3_DOOR2", false);

            RuntimeFactory.CreateGroundPlatform(new Vector3(94, 15, 0), new Vector2(5, 1));

            RuntimeFactory.CreateCheckpoint(new Vector3(96, 16.5f, 0), "L3_CP2");

            RuntimeFactory.CreateHazard(new Vector3(55, 0.3f, 0), new Vector2(15, 0.6f));
            RuntimeFactory.CreateHazard(new Vector3(76, 0.3f, 0), new Vector2(8, 0.6f));

            RuntimeFactory.CreateShadowPlatform(new Vector3(101, 16, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.RightOnly, "L3_R1");
            RuntimeFactory.CreateShadowPlatform(new Vector3(108, 18, 0), new Vector2(3, 0.8f),
                LightShadowPlatformer.Core.ShadowPlatform.PlatformType.AlwaysActive, "L3_A1");

            RuntimeFactory.CreateCollectible(new Vector3(15, 5.5f, 0), "L3_G1");
            RuntimeFactory.CreateCollectible(new Vector3(61, 13.5f, 0), "L3_G2");
            RuntimeFactory.CreateCollectible(new Vector3(101, 17.5f, 0), "L3_G3");
            RuntimeFactory.CreateCollectible(new Vector3(75, 17.5f, 0), "L3_G4");
            RuntimeFactory.CreateCollectible(new Vector3(108, 19.5f, 0), "L3_G5");

            RuntimeFactory.CreateGroundPlatform(new Vector3(117, 18, 0), new Vector2(6, 1));
            RuntimeFactory.CreateGoal(new Vector3(119, 19.5f, 0));

            SetupCameraForLevel(new Vector2(-50, -15), new Vector2(140, 28), 9f);
            SetLevelIndex(2);
        }

        private void BuildEnvironment(Vector2 camMin, Vector2 camMax, float killY = -15f, Color? bgColor = null)
        {
            var env = new GameObject("Environment");
            var bg = new GameObject("Background");
            bg.transform.SetParent(env.transform, false);
            bg.transform.position = new Vector3((camMin.x + camMax.x) * 0.5f, (camMin.y + camMax.y) * 0.5f, 10);
            var sr = bg.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Background";
            sr.sortingOrder = -100;
            sr.sprite = RuntimeFactory.MakeSolidSprite(bgColor ?? new Color(0.15f, 0.16f, 0.22f), 4, 4, 1f);
            sr.drawMode = SpriteDrawMode.Sliced;
            sr.size = new Vector2(camMax.x - camMin.x + 100, camMax.y - camMin.y + 100);

            if (LightShadowPlatformer.Core.LightManager.Instance != null)
            {
                LightShadowPlatformer.Core.LightManager.Instance.backgroundRenderer = sr;
                LightShadowPlatformer.Core.LightManager.Instance.mainCamera = Camera.main;
            }

            var b = new GameObject("LevelBounds");
            b.transform.SetParent(env.transform, false);
            var lb = b.AddComponent<LevelBounds>();
            lb.killY = killY;
        }

        private void AddHazardIfEnabled(Vector3 pos, Vector2 size, bool enabled)
        {
            if (enabled) RuntimeFactory.CreateHazard(pos, size);
        }

        private void SetupCameraForLevel(Vector2 min, Vector2 max, float zoom)
        {
            var cam = Camera.main?.GetComponent<LightShadowPlatformer.Camera.CameraController>();
            if (cam != null)
            {
                cam.useBounds = true;
                cam.minBounds = min;
                cam.maxBounds = max;
                cam.SetZoom(zoom, true);

                var player = FindObjectOfType<LightShadowPlatformer.Player.PlayerController>();
                if (player != null) cam.SetTarget(player.transform);
            }
        }

        private void SetLevelIndex(int i)
        {
            if (LightShadowPlatformer.Core.GameManager.Instance != null)
            {
                LightShadowPlatformer.Core.GameManager.Instance.currentLevelIndex = i;
                LightShadowPlatformer.Core.GameManager.Instance.ChangeState(
                    LightShadowPlatformer.Core.GameManager.GameState.Playing);
            }
        }
    }

    public class LevelBounds : MonoBehaviour
    {
        public float killY = -15f;
        private void Update()
        {
            var p = FindObjectOfType<LightShadowPlatformer.Player.PlayerController>();
            if (p != null && p.transform.position.y < killY && p.CurrentState != LightShadowPlatformer.Player.PlayerState.Dying)
            {
                p.Die();
            }
        }
    }
}
