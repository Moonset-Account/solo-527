using UnityEngine;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Data;
using LakeSailing.Gameplay;
using LakeSailing.UI;
using LakeSailing.Audio;

namespace LakeSailing
{
    public class LevelSceneManager : PersistentSingleton<LevelSceneManager>
    {
        [Header("场景对象")]
        [SerializeField] private GameObject lakeBackground;
        [SerializeField] private GameObject boatPrefab;
        [SerializeField] private GameObject targetMarkerPrefab;
        [SerializeField] private GameObject supplyStopPrefab;
        [SerializeField] private GameObject dockPrefab;
        [SerializeField] private Transform worldRoot;

        [Header("引用")]
        [SerializeField] private BoatController boatInstance;
        [SerializeField] private Camera mainCamera;
        [SerializeField] private List<GameObject> sceneObjects = new List<GameObject>();
        [SerializeField] private LevelConfigData currentLevel;

        [Header("视觉效果")]
        [SerializeField] private ParticleSystem rainEffect;
        [SerializeField] private ParticleSystem fogEffect;
        [SerializeField] private ParticleSystem windEffect;
        [SerializeField] private ParticleSystem sunEffect;
        [SerializeField] private Material skyboxMaterial;

        public event System.Action OnSceneInitialized;
        public BoatController Boat => boatInstance;
        public LevelConfigData CurrentLevel => currentLevel;

        private void Awake()
        {
            SubscribeToEvents();
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<LoadLevelEvent>(OnLoadLevel);
            EventBus.Unsubscribe<LevelRestartEvent>(OnLevelRestart);
            EventBus.Unsubscribe<GameStateChangedEvent>(OnGameStateChanged);
            EventBus.Unsubscribe<WeatherChangedEvent>(OnWeatherChanged);
        }

        private void SubscribeToEvents()
        {
            EventBus.Subscribe<LoadLevelEvent>(OnLoadLevel);
            EventBus.Subscribe<LevelRestartEvent>(OnLevelRestart);
            EventBus.Subscribe<GameStateChangedEvent>(OnGameStateChanged);
            EventBus.Subscribe<WeatherChangedEvent>(OnWeatherChanged);
        }

        private void OnLoadLevel(LoadLevelEvent e)
        {
            StartCoroutine(LoadLevelRoutine(e.Level));
        }

        private void OnLevelRestart(LevelRestartEvent e)
        {
            if (currentLevel != null)
            {
                StartCoroutine(LoadLevelRoutine(currentLevel));
            }
        }

        private void OnGameStateChanged(GameStateChangedEvent e)
        {
            if (e.NewState == GameState.Playing && e.OldState != GameState.Paused)
            {
                if (currentLevel != null)
                {
                    StartCoroutine(LoadLevelRoutine(currentLevel));
                }
            }
        }

        private void OnWeatherChanged(WeatherChangedEvent e)
        {
            UpdateWeatherVisuals(e.NewWeather);
        }

        private System.Collections.IEnumerator LoadLevelRoutine(LevelConfigData level)
        {
            currentLevel = level;
            ClearScene();

            yield return new WaitForEndOfFrame();

            CreateWorldRoot();
            CreateLakeBackground(level);
            CreateDock(level);
            CreateSupplyStops(level);
            CreateTargetMarkers(level);
            CreateBoat(level);
            SetupCamera();
            CreatePlaceholderDecorations(level);

            WeatherSystem.Instance.Initialize(level);
            TaskSystem.Instance.Initialize(level);

            var hud = UIManager.Instance.GetPanel<HUDPanel>(UIType.HUD);
            if (hud != null)
            {
                hud.SetBoatReference(boatInstance);
                hud.InitializeTasks();
                hud.InitializeForecast();
            }

            AudioManager.Instance.PlayMusic(1);
            AudioManager.Instance.PlayAmbient(0);

            UpdateWeatherVisuals(WeatherSystem.Instance.CurrentWeather);

            OnSceneInitialized?.Invoke();
            EventBus.Trigger(new SceneInitializedEvent(level));
        }

        private void CreateWorldRoot()
        {
            if (worldRoot == null)
            {
                var go = new GameObject("WorldRoot");
                worldRoot = go.transform;
            }
        }

        private void ClearScene()
        {
            foreach (var obj in sceneObjects)
            {
                if (obj != null) Destroy(obj);
            }
            sceneObjects.Clear();
            boatInstance = null;
        }

        private void CreateLakeBackground(LevelConfigData level)
        {
            var lake = GameObject.CreatePrimitive(PrimitiveType.Quad);
            lake.name = "LakeBackground";
            lake.transform.SetParent(worldRoot, false);
            lake.transform.localScale = new Vector3(level.lakeSize.x, level.lakeSize.y, 1);
            var renderer = lake.GetComponent<MeshRenderer>();
            if (renderer != null)
            {
                var mat = new Material(Shader.Find("Unlit/Transparent"));
                mat.color = new Color(0.1f, 0.4f, 0.6f, 0.85f);
                renderer.material = mat;
            }
            sceneObjects.Add(lake);

            var border = GameObject.CreatePrimitive(PrimitiveType.Cube);
            border.name = "LakeBorder";
            border.transform.SetParent(worldRoot, false);
            border.transform.localScale = new Vector3(level.lakeSize.x + 4, level.lakeSize.y + 4, 0.5f);
            border.transform.position = new Vector3(0, 0, 1);
            var br = border.GetComponent<MeshRenderer>();
            if (br != null)
            {
                var mat = new Material(Shader.Find("Unlit/Transparent"));
                mat.color = new Color(0.2f, 0.5f, 0.3f, 1f);
                br.material = mat;
            }
            sceneObjects.Add(border);
        }

        private void CreateDock(LevelConfigData level)
        {
            var dock = GameObject.CreatePrimitive(PrimitiveType.Cube);
            dock.name = "StartDock";
            dock.transform.SetParent(worldRoot, false);
            dock.transform.position = new Vector3(level.startDockPosition.x, level.startDockPosition.y, 0);
            dock.transform.localScale = new Vector3(6, 2, 0.3f);
            var dr = dock.GetComponent<MeshRenderer>();
            if (dr != null)
            {
                var mat = new Material(Shader.Find("Unlit/Transparent"));
                mat.color = new Color(0.55f, 0.35f, 0.15f, 1f);
                dr.material = mat;
            }
            sceneObjects.Add(dock);

            var label = CreateTextLabel("起点码头", level.startDockPosition + new Vector2(0, -2.5f), Color.white, 14);
            sceneObjects.Add(label);
        }

        private void CreateSupplyStops(LevelConfigData level)
        {
            if (level.supplyStops == null) return;
            for (int i = 0; i < level.supplyStops.Length; i++)
            {
                var stop = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                stop.name = $"SupplyStop_{i}";
                stop.transform.SetParent(worldRoot, false);
                stop.transform.position = new Vector3(level.supplyStops[i].x, level.supplyStops[i].y, 0);
                stop.transform.localScale = new Vector3(2.5f, 2.5f, 0.3f);
                var sr = stop.GetComponent<MeshRenderer>();
                if (sr != null)
                {
                    var mat = new Material(Shader.Find("Unlit/Transparent"));
                    mat.color = new Color(1f, 0.85f, 0.2f, 0.9f);
                    sr.material = mat;
                }
                sceneObjects.Add(stop);

                var label = CreateTextLabel($"补给站{i + 1}", level.supplyStops[i] + new Vector2(0, 2.5f), Color.yellow, 12);
                sceneObjects.Add(label);
            }
        }

        private void CreateTargetMarkers(LevelConfigData level)
        {
            if (level.photoTasks == null) return;
            for (int i = 0; i < level.photoTasks.Length; i++)
            {
                var task = level.photoTasks[i];
                var marker = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                marker.name = $"Target_{task.taskId}";
                marker.transform.SetParent(worldRoot, false);
                marker.transform.position = new Vector3(task.targetPosition.x, task.targetPosition.y, -0.2f);
                float scale = 1.2f + task.targetRarity * 0.3f;
                marker.transform.localScale = new Vector3(scale, scale, scale);

                Color rarityColor;
                switch (task.targetRarity)
                {
                    case 1: rarityColor = new Color(0.7f, 0.7f, 0.7f); break;
                    case 2: rarityColor = new Color(0.2f, 0.8f, 0.4f); break;
                    case 3: rarityColor = new Color(0.2f, 0.5f, 1f); break;
                    case 4: rarityColor = new Color(0.8f, 0.3f, 0.9f); break;
                    default: rarityColor = new Color(1f, 0.7f, 0.1f); break;
                }

                var mr = marker.GetComponent<MeshRenderer>();
                if (mr != null)
                {
                    var mat = new Material(Shader.Find("Unlit/Transparent"));
                    mat.color = rarityColor;
                    mr.material = mat;
                }

                var detection = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                detection.name = "DetectionRange";
                detection.transform.SetParent(marker.transform, false);
                detection.transform.localScale = Vector3.one * (task.detectionRadius / scale);
                var dmr = detection.GetComponent<MeshRenderer>();
                if (dmr != null)
                {
                    var mat = new Material(Shader.Find("Unlit/Transparent"));
                    mat.color = new Color(rarityColor.r, rarityColor.g, rarityColor.b, 0.15f);
                    dmr.material = mat;
                }
                Destroy(detection.GetComponent<Collider>());

                sceneObjects.Add(marker);

                var label = CreateTextLabel(task.targetName, task.targetPosition + new Vector2(0, scale + 0.8f), rarityColor, 12);
                sceneObjects.Add(label);
            }
        }

        private void CreateBoat(LevelConfigData level)
        {
            var boatGO = new GameObject("PlayerBoat");
            boatGO.transform.SetParent(worldRoot, false);
            boatGO.transform.position = new Vector3(level.startDockPosition.x + 4, level.startDockPosition.y, -0.5f);

            var visual = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            visual.name = "BoatVisual";
            visual.transform.SetParent(boatGO.transform, false);
            visual.transform.localScale = new Vector3(1.5f, 3.5f, 1);
            Destroy(visual.GetComponent<Collider>());
            var vr = visual.GetComponent<MeshRenderer>();
            if (vr != null)
            {
                var mat = new Material(Shader.Find("Unlit/Transparent"));
                mat.color = new Color(0.9f, 0.4f, 0.2f, 1f);
                vr.material = mat;
            }

            var sail = GameObject.CreatePrimitive(PrimitiveType.Quad);
            sail.name = "Sail";
            sail.transform.SetParent(boatGO.transform, false);
            sail.transform.localPosition = new Vector3(0, 0.5f, -0.1f);
            sail.transform.localScale = new Vector3(2, 3, 1);
            Destroy(sail.GetComponent<Collider>());
            var sr = sail.GetComponent<MeshRenderer>();
            if (sr != null)
            {
                var mat = new Material(Shader.Find("Unlit/Transparent"));
                mat.color = new Color(1f, 1f, 1f, 0.85f);
                sr.material = mat;
            }

            boatInstance = boatGO.AddComponent<BoatController>();
            boatGO.AddComponent<Rigidbody2D>();
            var rb2D = boatGO.GetComponent<Rigidbody2D>();
            rb2D.bodyType = RigidbodyType2D.Kinematic;

            boatInstance.Initialize(level, level.startDockPosition + new Vector2(4, 0));

            var cameraObj = GameObject.Find("Main Camera");
            if (cameraObj == null)
            {
                cameraObj = new GameObject("Main Camera");
                cameraObj.tag = "MainCamera";
                mainCamera = cameraObj.AddComponent<Camera>();
            }
            else
            {
                mainCamera = cameraObj.GetComponent<Camera>();
            }

            sceneObjects.Add(boatGO);
        }

        private void SetupCamera()
        {
            if (mainCamera == null) return;
            mainCamera.orthographic = true;
            mainCamera.orthographicSize = 30f;
            mainCamera.backgroundColor = new Color(0.53f, 0.81f, 0.92f);
            mainCamera.clearFlags = CameraClearFlags.SolidColor;
            mainCamera.transform.position = new Vector3(0, 0, -10f);
        }

        private void CreatePlaceholderDecorations(LevelConfigData level)
        {
            var rng = new System.Random(level.seed);
            int islandCount = 3 + rng.Next(5);
            for (int i = 0; i < islandCount; i++)
            {
                float angle = (float)(rng.NextDouble() * 360 * Mathf.Deg2Rad);
                float radius = 15f + (float)rng.NextDouble() * (Mathf.Min(level.lakeSize.x, level.lakeSize.y) * 0.4f);
                Vector2 pos = new Vector2(Mathf.Cos(angle) * radius, Mathf.Sin(angle) * radius);

                var island = GameObject.CreatePrimitive(PrimitiveType.Quad);
                island.name = $"Island_{i}";
                island.transform.SetParent(worldRoot, false);
                island.transform.position = new Vector3(pos.x, pos.y, 0.5f);
                float size = 2f + (float)rng.NextDouble() * 4f;
                island.transform.localScale = new Vector3(size, size * 0.7f, 1);
                Destroy(island.GetComponent<Collider>());
                var ir = island.GetComponent<MeshRenderer>();
                if (ir != null)
                {
                    var mat = new Material(Shader.Find("Unlit/Transparent"));
                    mat.color = new Color(0.25f + (float)rng.NextDouble() * 0.1f,
                                           0.5f + (float)rng.NextDouble() * 0.1f,
                                           0.15f + (float)rng.NextDouble() * 0.1f, 1f);
                    ir.material = mat;
                }
                sceneObjects.Add(island);
            }

            int treeCount = 8 + rng.Next(12);
            for (int i = 0; i < treeCount; i++)
            {
                Vector2 edgePos = RandomEdgePosition(level, rng);
                var tree = GameObject.CreatePrimitive(PrimitiveType.Cone);
                tree.name = $"Tree_{i}";
                tree.transform.SetParent(worldRoot, false);
                tree.transform.position = new Vector3(edgePos.x, edgePos.y, 0.4f);
                tree.transform.localScale = new Vector3(1.2f, 2.5f, 1.2f);
                Destroy(tree.GetComponent<Collider>());
                var tr = tree.GetComponent<MeshRenderer>();
                if (tr != null)
                {
                    var mat = new Material(Shader.Find("Unlit/Transparent"));
                    mat.color = new Color(0.1f + (float)rng.NextDouble() * 0.1f,
                                           0.5f + (float)rng.NextDouble() * 0.2f,
                                           0.1f, 1f);
                    tr.material = mat;
                }
                sceneObjects.Add(tree);
            }
        }

        private Vector2 RandomEdgePosition(LevelConfigData level, System.Random rng)
        {
            float margin = 2f;
            int edge = rng.Next(4);
            float x, y;
            switch (edge)
            {
                case 0:
                    x = (float)rng.NextDouble() * level.lakeSize.x - level.lakeSize.x / 2;
                    y = level.lakeSize.y / 2 - margin;
                    break;
                case 1:
                    x = (float)rng.NextDouble() * level.lakeSize.x - level.lakeSize.x / 2;
                    y = -level.lakeSize.y / 2 + margin;
                    break;
                case 2:
                    x = -level.lakeSize.x / 2 + margin;
                    y = (float)rng.NextDouble() * level.lakeSize.y - level.lakeSize.y / 2;
                    break;
                default:
                    x = level.lakeSize.x / 2 - margin;
                    y = (float)rng.NextDouble() * level.lakeSize.y - level.lakeSize.y / 2;
                    break;
            }
            return new Vector2(x, y);
        }

        private GameObject CreateTextLabel(string text, Vector2 position, Color color, int fontSize)
        {
            var go = new GameObject("TextLabel");
            go.transform.SetParent(worldRoot, false);
            go.transform.position = new Vector3(position.x, position.y, -0.8f);
            go.transform.localScale = Vector3.one * 0.03f;

            var tm = go.AddComponent<TextMesh>();
            tm.text = text;
            tm.color = color;
            tm.characterSize = 1;
            tm.fontSize = Mathf.Max(20, fontSize * 2);
            tm.anchor = TextAnchor.MiddleCenter;
            tm.alignment = TextAlignment.Center;

            var renderer = go.GetComponent<MeshRenderer>();
            if (renderer != null)
            {
                renderer.sortingOrder = 10;
            }

            return go;
        }

        private void UpdateWeatherVisuals(WeatherType weather)
        {
            switch (weather)
            {
                case WeatherType.Sunny:
                    if (mainCamera != null) mainCamera.backgroundColor = new Color(0.53f, 0.81f, 0.92f);
                    SetEffectActive(sunEffect, true);
                    SetEffectActive(rainEffect, false);
                    SetEffectActive(fogEffect, false);
                    SetEffectActive(windEffect, false);
                    break;
                case WeatherType.Cloudy:
                    if (mainCamera != null) mainCamera.backgroundColor = new Color(0.6f, 0.65f, 0.7f);
                    SetEffectActive(sunEffect, false);
                    SetEffectActive(rainEffect, false);
                    SetEffectActive(fogEffect, false);
                    SetEffectActive(windEffect, true);
                    break;
                case WeatherType.Rainy:
                    if (mainCamera != null) mainCamera.backgroundColor = new Color(0.35f, 0.4f, 0.5f);
                    SetEffectActive(sunEffect, false);
                    SetEffectActive(rainEffect, true);
                    SetEffectActive(fogEffect, false);
                    SetEffectActive(windEffect, true);
                    AudioManager.Instance?.PlaySfx(SfxType.Rain);
                    break;
                case WeatherType.Windy:
                    if (mainCamera != null) mainCamera.backgroundColor = new Color(0.55f, 0.7f, 0.8f);
                    SetEffectActive(sunEffect, false);
                    SetEffectActive(rainEffect, false);
                    SetEffectActive(fogEffect, false);
                    SetEffectActive(windEffect, true);
                    AudioManager.Instance?.PlaySfx(SfxType.Wind);
                    break;
                case WeatherType.Foggy:
                    if (mainCamera != null) mainCamera.backgroundColor = new Color(0.75f, 0.78f, 0.8f);
                    SetEffectActive(sunEffect, false);
                    SetEffectActive(rainEffect, false);
                    SetEffectActive(fogEffect, true);
                    SetEffectActive(windEffect, false);
                    break;
                case WeatherType.Stormy:
                    if (mainCamera != null) mainCamera.backgroundColor = new Color(0.2f, 0.22f, 0.3f);
                    SetEffectActive(sunEffect, false);
                    SetEffectActive(rainEffect, true);
                    SetEffectActive(fogEffect, true);
                    SetEffectActive(windEffect, true);
                    AudioManager.Instance?.PlaySfx(SfxType.Thunder);
                    break;
            }
        }

        private void SetEffectActive(ParticleSystem effect, bool active)
        {
            if (effect == null) return;
            if (active) effect.Play();
            else effect.Stop();
        }
    }

    public struct SceneInitializedEvent : IEvent
    {
        public readonly LevelConfigData Level;
        public SceneInitializedEvent(LevelConfigData level) { Level = level; }
    }
}
