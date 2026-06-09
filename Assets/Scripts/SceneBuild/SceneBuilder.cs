using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using BeatRunner.Audio;
using BeatRunner.Core;
using BeatRunner.Data;
using BeatRunner.Diagnostics;
using BeatRunner.Gameplay;
using BeatRunner.Input;
using BeatRunner.Player;
using BeatRunner.Resources;
using BeatRunner.UI;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace BeatRunner.SceneBuild
{
    public static class SceneBuilder
    {
        private static bool _built;
        private static Mesh _cachedOctahedronMesh;

        private static void DestroyImmediateSafe(Object obj)
        {
            if (obj != null) Object.DestroyImmediate(obj);
        }

        private static Mesh GetOctahedronMesh()
        {
            if (_cachedOctahedronMesh != null) return _cachedOctahedronMesh;
            var mesh = new Mesh();
            mesh.name = "Octahedron";
            float s = 1f;
            Vector3[] vertices =
            {
                new Vector3(0, s, 0),
                new Vector3(s, 0, 0),
                new Vector3(0, 0, s),
                new Vector3(-s, 0, 0),
                new Vector3(0, 0, -s),
                new Vector3(0, -s, 0)
            };
            int[] triangles =
            {
                0, 1, 2,
                0, 2, 3,
                0, 3, 4,
                0, 4, 1,
                5, 2, 1,
                5, 3, 2,
                5, 4, 3,
                5, 1, 4
            };
            mesh.vertices = vertices;
            mesh.triangles = triangles;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            _cachedOctahedronMesh = mesh;
            return mesh;
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        public static void AutoBuildMainScene()
        {
            if (_built) return;
            _built = true;

            BootstrapServices();

            GameObject systemsRoot = EnsureSystemsRoot();
            EnsureCameraAndLight();
            var eventSystem = EnsureEventSystem();
            var canvas = EnsureUICanvas(eventSystem);

            Transform gameplayRoot = EnsureGameplayRoot();
            PlayerController player = EnsurePlayer(gameplayRoot);
            LevelManager levelManager = EnsureLevelManager(gameplayRoot, player);
            AttachGameplayController(gameplayRoot, player, levelManager);

            BuildAllUi(canvas, out MainMenu mainMenu, out TutorialController tutorial,
                out HudController hud, out PauseMenu pause, out SettingsMenu settings,
                out ResultsScreen results, out GameOverScreen gameOver, out AudioCalibration calibration);

            EnsureGameManager(levelManager, player, gameplayRoot,
                mainMenu, tutorial, hud, pause, settings, results, gameOver, calibration);

            var marker = new GameObject("[SceneBuildValidated]");
            marker.tag = "Untagged";
            Debug.Log("[SceneBuilder] Main scene built successfully.");
            SceneBuildValidator.RunFullValidation();
        }

        private static void BootstrapServices()
        {
            SaveSystem.LoadSaveData();
            ServiceLocator.Initialize();
            RuntimeContentLoader.GetOrCreateGameSettings();
            RuntimeContentLoader.GetOrCreateRuntimeData();
            RuntimeContentLoader.GetOrCreateTrackLibrary();
        }

        private static GameObject EnsureSystemsRoot()
        {
            var existing = GameObject.Find("[BeatRunnerSystems]");
            if (existing != null) return existing;
            var go = new GameObject("[BeatRunnerSystems]");
            return go;
        }

        private static void EnsureCameraAndLight()
        {
            if (Camera.main == null)
            {
                var camGo = new GameObject("Main Camera", typeof(Camera), typeof(AudioListener));
                camGo.tag = "MainCamera";
                var cam = camGo.GetComponent<Camera>();
                cam.orthographic = false;
                cam.fieldOfView = 60f;
                cam.nearClipPlane = 0.03f;
                cam.farClipPlane = 1000f;
                cam.backgroundColor = new Color(0.04f, 0.06f, 0.1f, 1f);
                cam.clearFlags = CameraClearFlags.SolidColor;
                camGo.transform.position = new Vector3(0, 3.5f, -6.5f);
                camGo.transform.rotation = Quaternion.Euler(15, 0, 0);
                cam.tag = "MainCamera";
            }

            bool hasDirLight = false;
            foreach (var l in GameObject.FindObjectsOfType<Light>())
            {
                if (l.type == LightType.Directional) { hasDirLight = true; break; }
            }
            if (!hasDirLight)
            {
                var lightGo = new GameObject("Directional Light", typeof(Light));
                var light = lightGo.GetComponent<Light>();
                light.type = LightType.Directional;
                light.color = Color.white;
                light.intensity = 1.1f;
                light.shadows = LightShadows.Soft;
                lightGo.transform.rotation = Quaternion.Euler(45, -30, 0);
            }

            if (GameObject.FindObjectOfType<AmbientLightingSetup>() == null)
            {
                RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
                RenderSettings.ambientSkyColor = new Color(0.15f, 0.2f, 0.35f);
                RenderSettings.ambientEquatorColor = new Color(0.08f, 0.1f, 0.18f);
                RenderSettings.ambientGroundColor = new Color(0.03f, 0.04f, 0.07f);
                var existing = Camera.main;
                if (existing != null) existing.gameObject.AddComponent<AmbientLightingSetup>();
            }
        }

        private static EventSystem EnsureEventSystem()
        {
            var existing = EventSystem.current;
            if (existing != null) return existing;
            var go = new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            return go.GetComponent<EventSystem>();
        }

        private static Canvas EnsureUICanvas(EventSystem eventSystem)
        {
            var existing = GameObject.FindObjectOfType<Canvas>();
            if (existing != null && existing.gameObject.name == "MainCanvas") return existing;

            var canvasGo = new GameObject("MainCanvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            var canvas = canvasGo.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            canvas.pixelPerfect = true;

            var scaler = canvasGo.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.5f;
            scaler.referencePixelsPerUnit = 100;

            return canvas;
        }

        private static Transform EnsureGameplayRoot()
        {
            var go = new GameObject("GameplayRoot");
            var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.name = "Ground";
            ground.transform.SetParent(go.transform, false);
            ground.transform.localPosition = new Vector3(0, -0.01f, 0);
            ground.transform.localScale = new Vector3(6, 1, 500);
            var mr = ground.GetComponent<MeshRenderer>();
            if (mr != null)
            {
                var mat = new Material(Shader.Find("Standard"));
                mat.color = new Color(0.1f, 0.12f, 0.18f);
                mr.sharedMaterial = mat;
            }

            for (int i = 0; i < 3; i++)
            {
                var lane = GameObject.CreatePrimitive(PrimitiveType.Cube);
                lane.name = $"Lane_{i}";
                lane.transform.SetParent(go.transform, false);
                int mid = 1;
                float x = (i - mid) * 2f;
                lane.transform.localPosition = new Vector3(x, 0.02f, 0);
                lane.transform.localScale = new Vector3(1.8f, 0.04f, 1000f);
                DestroyImmediateSafe(lane.GetComponent<BoxCollider>());
                var laneMat = new Material(Shader.Find("Standard"));
                laneMat.color = i == 1
                    ? new Color(0.2f, 0.3f, 0.5f)
                    : new Color(0.15f, 0.18f, 0.28f);
                lane.GetComponent<MeshRenderer>().sharedMaterial = laneMat;
            }

            return go.transform;
        }

        private static PlayerController EnsurePlayer(Transform root)
        {
            var go = GameObject.Find("Player");
            if (go == null)
            {
                go = GameObject.CreatePrimitive(PrimitiveType.Capsule);
                go.name = "Player";
            }
            go.transform.SetParent(root, false);
            go.transform.localPosition = new Vector3(0, 1f, -1);

            var rb = go.GetComponent<Rigidbody>();
            if (rb == null) rb = go.AddComponent<Rigidbody>();
            rb.useGravity = true;
            rb.isKinematic = true;
            rb.constraints = RigidbodyConstraints.FreezeRotation;
            rb.interpolation = RigidbodyInterpolation.Interpolate;
            rb.collisionDetectionMode = CollisionDetectionMode.ContinuousSpeculative;

            var coll = go.GetComponent<CapsuleCollider>();
            if (coll == null) coll = go.AddComponent<CapsuleCollider>();
            coll.height = 2f;
            coll.radius = 0.45f;
            coll.center = new Vector3(0, 1f, 0);

            var visual = new GameObject("VisualRoot");
            visual.transform.SetParent(go.transform, false);
            visual.transform.localPosition = Vector3.zero;

            var mr = go.GetComponent<MeshRenderer>();
            if (mr != null)
            {
                var pm = new Material(Shader.Find("Standard"));
                pm.color = new Color(0.3f, 0.7f, 1f);
                mr.sharedMaterial = pm;
            }

            var player = go.GetComponent<PlayerController>();
            if (player == null) player = go.AddComponent<PlayerController>();

            var rbField = typeof(PlayerController).GetField("_rb", BindingFlags.Instance | BindingFlags.NonPublic);
            rbField?.SetValue(player, rb);
            var collField = typeof(PlayerController).GetField("_collider", BindingFlags.Instance | BindingFlags.NonPublic);
            collField?.SetValue(player, coll);
            var visualField = typeof(PlayerController).GetField("_visualRoot", BindingFlags.Instance | BindingFlags.NonPublic);
            visualField?.SetValue(player, visual.transform);

            return player;
        }

        private static LevelManager EnsureLevelManager(Transform root, PlayerController player)
        {
            var go = new GameObject("LevelManager");
            go.transform.SetParent(root, false);
            var lm = go.AddComponent<LevelManager>();

            var obstacleHigh = MakeObstaclePrefab(ObstacleHeight.High);
            var obstacleLow = MakeObstaclePrefab(ObstacleHeight.Low);
            var fragment = MakeFragmentPrefab();
            var lane = MakeLaneIndicator();

            var f1 = typeof(LevelManager).GetField("_levelRoot", BindingFlags.Instance | BindingFlags.NonPublic);
            f1?.SetValue(lm, root);
            var f2 = typeof(LevelManager).GetField("_player", BindingFlags.Instance | BindingFlags.NonPublic);
            f2?.SetValue(lm, player);
            var f3 = typeof(LevelManager).GetField("_obstacleHighPrefab", BindingFlags.Instance | BindingFlags.NonPublic);
            f3?.SetValue(lm, obstacleHigh);
            var f4 = typeof(LevelManager).GetField("_obstacleLowPrefab", BindingFlags.Instance | BindingFlags.NonPublic);
            f4?.SetValue(lm, obstacleLow);
            var f5 = typeof(LevelManager).GetField("_fragmentPrefab", BindingFlags.Instance | BindingFlags.NonPublic);
            f5?.SetValue(lm, fragment);
            var f6 = typeof(LevelManager).GetField("_laneIndicatorPrefab", BindingFlags.Instance | BindingFlags.NonPublic);
            f6?.SetValue(lm, lane);

            return lm;
        }

        private enum ObstacleHeight { Low, High }

        private static GameObject MakeObstaclePrefab(ObstacleHeight height)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
            go.name = height == ObstacleHeight.High ? "ObstacleHigh" : "ObstacleLow";
            DestroyImmediateSafe(go.GetComponent<BoxCollider>());
            go.AddComponent<BoxCollider>().isTrigger = true;
            go.AddComponent<Gameplay.Obstacle>();
            var mat = new Material(Shader.Find("Standard"));
            mat.color = height == ObstacleHeight.High
                ? new Color(1f, 0.3f, 0.4f)
                : new Color(0.9f, 0.4f, 0.2f);
            go.GetComponent<MeshRenderer>().sharedMaterial = mat;
            go.transform.localScale = height == ObstacleHeight.High
                ? new Vector3(1.4f, 1.6f, 1.4f)
                : new Vector3(1.4f, 0.6f, 1.4f);
            go.SetActive(false);
            return go;
        }

        private static GameObject MakeFragmentPrefab()
        {
            var go = new GameObject("Fragment", typeof(MeshFilter), typeof(MeshRenderer));
            go.GetComponent<MeshFilter>().mesh = GetOctahedronMesh();
            var c = go.AddComponent<SphereCollider>();
            c.isTrigger = true;
            c.radius = 0.5f;
            go.AddComponent<Gameplay.CollectibleFragment>();
            var mat = new Material(Shader.Find("Standard"));
            mat.color = new Color(0.3f, 0.9f, 1f);
            mat.SetColor("_EmissionColor", new Color(0.1f, 0.4f, 0.6f));
            go.GetComponent<MeshRenderer>().sharedMaterial = mat;
            go.transform.localScale = Vector3.one * 0.45f;
            go.SetActive(false);
            return go;
        }

        private static GameObject MakeLaneIndicator()
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
            go.name = "LaneIndicator";
            DestroyImmediateSafe(go.GetComponent<Collider>());
            var mat = new Material(Shader.Find("Standard"));
            mat.color = new Color(1f, 1f, 1f, 0.15f);
            go.GetComponent<MeshRenderer>().sharedMaterial = mat;
            go.transform.localScale = new Vector3(1.6f, 0.02f, 1.2f);
            go.SetActive(false);
            return go;
        }

        private static void AttachGameplayController(Transform root, PlayerController player, LevelManager lm)
        {
            var go = new GameObject("GameplayController");
            go.transform.SetParent(root, false);
            var gc = go.AddComponent<GameplayController>();

            var f1 = typeof(GameplayController).GetField("_levelManager", BindingFlags.Instance | BindingFlags.NonPublic);
            f1?.SetValue(gc, lm);
            var f2 = typeof(GameplayController).GetField("_player", BindingFlags.Instance | BindingFlags.NonPublic);
            f2?.SetValue(gc, player);
        }

        private static void BuildAllUi(Canvas canvas,
            out MainMenu mainMenu, out TutorialController tutorial,
            out HudController hud, out PauseMenu pause, out SettingsMenu settings,
            out ResultsScreen results, out GameOverScreen gameOver, out AudioCalibration calibration)
        {
            var canvasT = canvas.transform;

            mainMenu = UIBuilder.BuildMainMenu(canvasT);
            tutorial = UIBuilder.BuildTutorial(canvasT);
            hud = UIBuilder.BuildHUD(canvasT);
            pause = UIBuilder.BuildPause(canvasT);
            settings = UIBuilder.BuildSettings(canvasT);
            results = UIBuilder.BuildResults(canvasT);
            gameOver = UIBuilder.BuildGameOver(canvasT);
            calibration = UIBuilder.BuildAudioCalibration(canvasT);
        }

        private static void EnsureGameManager(
            LevelManager levelManager, PlayerController player, Transform gameplayRoot,
            MainMenu mainMenu, TutorialController tutorial, HudController hud,
            PauseMenu pause, SettingsMenu settings, ResultsScreen results,
            GameOverScreen gameOver, AudioCalibration calibration)
        {
            var existing = GameManager.Instance;
            if (existing != null) return;

            var go = new GameObject("[GameManager]");
            GameObject.DontDestroyOnLoad(go);
            var gm = go.AddComponent<GameManager>();

            var set = typeof(GameManager).GetField("_levelManager", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, levelManager);
            set = typeof(GameManager).GetField("_player", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, player);
            set = typeof(GameManager).GetField("_gameplayRoot", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, gameplayRoot);
            set = typeof(GameManager).GetField("_gameplayController", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, player.GetComponent<GameplayController>() ??
                GameObject.FindObjectOfType<GameplayController>());

            set = typeof(GameManager).GetField("_mainMenu", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, mainMenu);
            set = typeof(GameManager).GetField("_tutorialController", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, tutorial);
            set = typeof(GameManager).GetField("_hud", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, hud);
            set = typeof(GameManager).GetField("_pauseMenu", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, pause);
            set = typeof(GameManager).GetField("_settingsMenu", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, settings);
            set = typeof(GameManager).GetField("_results", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, results);
            set = typeof(GameManager).GetField("_gameOver", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, gameOver);
            set = typeof(GameManager).GetField("_audioCalibration", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, calibration);

            set = typeof(GameManager).GetField("_trackLibrary", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, RuntimeContentLoader.GetOrCreateTrackLibrary());
            set = typeof(GameManager).GetField("_gameSettings", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, RuntimeContentLoader.GetOrCreateGameSettings());
            set = typeof(GameManager).GetField("_runtimeData", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, RuntimeContentLoader.GetOrCreateRuntimeData());

            set = typeof(GameManager).GetField("_audioManager", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, FindOrAdd<AudioManager>("[AudioManager]"));
            set = typeof(GameManager).GetField("_beatSystem", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, FindOrAdd<BeatSystem>("[BeatSystem]"));
            set = typeof(GameManager).GetField("_inputManager", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, FindOrAdd<InputManager>("[InputManager]"));
            set = typeof(GameManager).GetField("_stateManager", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, FindOrAdd<GameStateManager>("[GameStateManager]"));
            set = typeof(GameManager).GetField("_perfStats", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, FindOrAdd<PerformanceStats>("[PerformanceStats]"));
            set = typeof(GameManager).GetField("_frameRateAdaptor", BindingFlags.Instance | BindingFlags.NonPublic);
            set?.SetValue(gm, FindOrAdd<FrameRateAdaptor>("[FrameRateAdaptor]"));
        }

        private static T FindOrAdd<T>(string goName) where T : MonoBehaviour
        {
            var found = GameObject.FindObjectOfType<T>();
            if (found != null) return found;
            var go = new GameObject(goName);
            GameObject.DontDestroyOnLoad(go);
            return go.AddComponent<T>();
        }
    }

    public class AmbientLightingSetup : MonoBehaviour { }
}
