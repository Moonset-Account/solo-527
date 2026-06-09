using UnityEngine;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Data;
using LakeSailing.Gameplay;
using LakeSailing.UI;
using LakeSailing.Audio;

namespace LakeSailing.Bootstrap
{
    public class LevelSceneManager : PersistentSingleton<LevelSceneManager>
    {
        [SerializeField] private Transform worldRoot;
        [SerializeField] private Camera mainCamera;
        [SerializeField] private List<GameObject> sceneObjects = new List<GameObject>();
        [SerializeField] private LevelConfigData currentLevel;

        public event System.Action OnSceneInitialized;
        public BoatController Boat { get; private set; }
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
            var level = CreateMockLevelConfig(e.LevelId);
            StartCoroutine(LoadLevelRoutine(level));
        }
        private void OnLevelRestart(LevelRestartEvent e) { if (currentLevel != null) StartCoroutine(LoadLevelRoutine(currentLevel)); }

        private void OnGameStateChanged(GameStateChangedEvent e)
        {
            if (e.NewState == GameState.Playing && e.OldState != GameState.Paused && e.OldState != GameState.Settings)
            {
                if (currentLevel != null && Boat == null)
                {
                    StartCoroutine(LoadLevelRoutine(currentLevel));
                }
            }
        }

        private void OnWeatherChanged(WeatherChangedEvent e) { UpdateWeatherVisuals(e.NewWeather); }

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
            CreatePlaceholderDecorations(level);

            WeatherSystem.Instance.Initialize(level);
            TaskSystem.Instance.Initialize(level);

            var hud = UIManager.Instance.GetPanel<HUDPanel>(UIType.HUD);
            if (hud != null)
            {
                hud.SetBoatReference(Boat);
                hud.InitializeTasks();
                hud.InitializeForecast();
            }

            BindSceneServiceDelegates(level);

            UpdateWeatherVisuals(WeatherSystem.Instance.CurrentWeather);
            OnSceneInitialized?.Invoke();
            EventBus.Trigger(new SceneInitializedEvent(level));
            GameManager.Instance.ChangeState(GameState.Playing);
        }

        private void CreateWorldRoot()
        {
            if (worldRoot == null) { var go = new GameObject("WorldRoot"); worldRoot = go.transform; }
        }

        private void ClearScene()
        {
            foreach (var obj in sceneObjects) if (obj != null) Destroy(obj);
            sceneObjects.Clear();
            Boat = null;
            SceneService.ResetAll();
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
                var mat = new Material(Shader.Find("Sprites/Default"));
                mat.color = new Color(0.15f, 0.45f, 0.65f, 0.9f);
                renderer.material = mat;
                renderer.sortingOrder = -50;
            }
            Destroy(lake.GetComponent<Collider>());
            sceneObjects.Add(lake);
        }

        private void CreateDock(LevelConfigData level)
        {
            var dock = GameObject.CreatePrimitive(PrimitiveType.Cube);
            dock.name = "StartDock";
            dock.transform.SetParent(worldRoot, false);
            dock.transform.position = new Vector3(level.startDockPosition.x, level.startDockPosition.y, 0);
            dock.transform.localScale = new Vector3(6, 2, 0.3f);
            var dr = dock.GetComponent<MeshRenderer>();
            if (dr != null) { dr.material = MakeSolid(new Color(0.55f, 0.35f, 0.15f, 1f)); dr.sortingOrder = 10; }
            Destroy(dock.GetComponent<Collider>());
            sceneObjects.Add(dock);
            sceneObjects.Add(CreateWorldLabel("起点码头", level.startDockPosition + new Vector2(0, -2.8f), Color.white, 16));
        }

        private void CreateSupplyStops(LevelConfigData level)
        {
            if (level.supplyStops == null) return;
            for (int i = 0; i < level.supplyStops.Length; i++)
            {
                var stop = GameObject.CreatePrimitive(PrimitiveType.Quad);
                stop.name = $"SupplyStop_{i}";
                stop.transform.SetParent(worldRoot, false);
                stop.transform.position = new Vector3(level.supplyStops[i].x, level.supplyStops[i].y, -0.2f);
                stop.transform.localScale = new Vector3(3.5f, 3.5f, 1);
                var sr = stop.GetComponent<MeshRenderer>();
                if (sr != null) { sr.material = MakeSolid(new Color(1f, 0.85f, 0.2f, 0.95f)); sr.sortingOrder = 5; }
                Destroy(stop.GetComponent<Collider>());
                sceneObjects.Add(stop);
                sceneObjects.Add(CreateWorldLabel($"补给站{i + 1}", level.supplyStops[i] + new Vector2(0, 3.2f), Color.yellow, 14));
            }
        }

        private void CreateTargetMarkers(LevelConfigData level)
        {
            if (level.photoTasks == null) return;
            for (int i = 0; i < level.photoTasks.Length; i++)
            {
                var task = level.photoTasks[i];
                float scale = 1.3f + task.targetRarity * 0.4f;
                Color rarityColor = GetRarityColor(task.targetRarity);

                var ring = GameObject.CreatePrimitive(PrimitiveType.Quad);
                ring.name = $"TargetRing_{task.taskId}";
                ring.transform.SetParent(worldRoot, false);
                ring.transform.position = new Vector3(task.targetPosition.x, task.targetPosition.y, -0.1f);
                float s = task.detectionRadius * 2;
                ring.transform.localScale = new Vector3(s, s, 1);
                var rr = ring.GetComponent<MeshRenderer>();
                if (rr != null) { rr.material = MakeSolid(new Color(rarityColor.r, rarityColor.g, rarityColor.b, 0.08f)); rr.sortingOrder = 2; }
                Destroy(ring.GetComponent<Collider>());
                sceneObjects.Add(ring);

                var marker = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                marker.name = $"Target_{task.taskId}";
                marker.transform.SetParent(worldRoot, false);
                marker.transform.position = new Vector3(task.targetPosition.x, task.targetPosition.y, -0.3f);
                marker.transform.localScale = new Vector3(scale, scale, scale);
                var mr = marker.GetComponent<MeshRenderer>();
                if (mr != null) { mr.material = MakeSolid(rarityColor); mr.sortingOrder = 8; }
                Destroy(marker.GetComponent<Collider>());
                sceneObjects.Add(marker);
                sceneObjects.Add(CreateWorldLabel(task.targetName, task.targetPosition + new Vector2(0, scale + 1.2f), rarityColor, 14));
            }
        }

        private void CreateBoat(LevelConfigData level)
        {
            var boatGO = new GameObject("PlayerBoat");
            boatGO.transform.SetParent(worldRoot, false);
            boatGO.transform.position = new Vector3(level.startDockPosition.x + 4f, level.startDockPosition.y, -0.5f);

            var hull = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            hull.name = "Hull";
            hull.transform.SetParent(boatGO.transform, false);
            hull.transform.localScale = new Vector3(1.6f, 3.8f, 1);
            Destroy(hull.GetComponent<Collider>());
            var hr = hull.GetComponent<MeshRenderer>();
            if (hr != null) { hr.material = MakeSolid(new Color(0.9f, 0.4f, 0.2f, 1f)); hr.sortingOrder = 20; }

            var sail = GameObject.CreatePrimitive(PrimitiveType.Quad);
            sail.name = "Sail";
            sail.transform.SetParent(boatGO.transform, false);
            sail.transform.localPosition = new Vector3(0, 0.3f, -0.15f);
            sail.transform.localScale = new Vector3(2.2f, 3.2f, 1);
            Destroy(sail.GetComponent<Collider>());
            var sr = sail.GetComponent<MeshRenderer>();
            if (sr != null) { sr.material = MakeSolid(new Color(1f, 1f, 1f, 0.9f)); sr.sortingOrder = 21; }

            Boat = boatGO.AddComponent<BoatController>();
            Boat.Initialize(level, level.startDockPosition + new Vector2(4, 0));
            boatGO.AddComponent<BoatAnimationController>();
            var anim = boatGO.GetComponent<BoatAnimationController>();
            var bf = typeof(BoatAnimationController).GetField("boat",
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            bf?.SetValue(anim, Boat);
            var bv = typeof(BoatAnimationController).GetField("boatVisual",
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            bv?.SetValue(anim, hull.transform);
            var bs = typeof(BoatAnimationController).GetField("sailTransform",
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            bs?.SetValue(anim, sail.transform);

            mainCamera = Camera.main;
            sceneObjects.Add(boatGO);
        }

        private void CreatePlaceholderDecorations(LevelConfigData level)
        {
            var rng = new System.Random(level.seed);
            int islandCount = 3 + rng.Next(5);
            for (int i = 0; i < islandCount; i++)
            {
                float angle = (float)(rng.NextDouble() * Mathf.PI * 2);
                float radius = 18f + (float)rng.NextDouble() * (Mathf.Min(level.lakeSize.x, level.lakeSize.y) * 0.35f);
                Vector2 pos = new Vector2(Mathf.Cos(angle) * radius, Mathf.Sin(angle) * radius);

                var island = GameObject.CreatePrimitive(PrimitiveType.Quad);
                island.name = $"Island_{i}";
                island.transform.SetParent(worldRoot, false);
                island.transform.position = new Vector3(pos.x, pos.y, 0.5f);
                float size = 2.5f + (float)rng.NextDouble() * 4.5f;
                island.transform.localScale = new Vector3(size, size * 0.7f, 1);
                Destroy(island.GetComponent<Collider>());
                var ir = island.GetComponent<MeshRenderer>();
                if (ir != null)
                {
                    ir.material = MakeSolid(new Color(0.28f + (float)rng.NextDouble() * 0.08f,
                        0.52f + (float)rng.NextDouble() * 0.08f,
                        0.18f + (float)rng.NextDouble() * 0.08f, 1f));
                    ir.sortingOrder = -10;
                }
                sceneObjects.Add(island);
            }
        }

        private GameObject CreateWorldLabel(string text, Vector2 position, Color color, int fontSize)
        {
            var go = new GameObject("TextLabel");
            go.transform.SetParent(worldRoot, false);
            go.transform.position = new Vector3(position.x, position.y, -0.8f);
            go.transform.localScale = Vector3.one * 0.035f;

            var tm = go.AddComponent<TextMesh>();
            tm.text = text;
            tm.color = color;
            tm.characterSize = 1;
            tm.fontSize = Mathf.Max(24, fontSize * 2);
            tm.anchor = TextAnchor.MiddleCenter;
            tm.alignment = TextAlignment.Center;
            var renderer = go.GetComponent<MeshRenderer>();
            if (renderer != null) renderer.sortingOrder = 50;
            return go;
        }

        private void UpdateWeatherVisuals(WeatherType weather)
        {
            if (mainCamera == null) mainCamera = Camera.main;
            if (mainCamera == null) return;

            switch (weather)
            {
                case WeatherType.Sunny: mainCamera.backgroundColor = new Color(0.53f, 0.81f, 0.92f); break;
                case WeatherType.Cloudy: mainCamera.backgroundColor = new Color(0.62f, 0.68f, 0.74f); break;
                case WeatherType.Rainy: mainCamera.backgroundColor = new Color(0.38f, 0.44f, 0.52f); break;
                case WeatherType.Windy: mainCamera.backgroundColor = new Color(0.58f, 0.72f, 0.82f); break;
                case WeatherType.Foggy: mainCamera.backgroundColor = new Color(0.76f, 0.79f, 0.82f); break;
                case WeatherType.Stormy: mainCamera.backgroundColor = new Color(0.22f, 0.25f, 0.32f); break;
            }
        }

        private static Material MakeSolid(Color c)
        {
            var m = new Material(Shader.Find("Sprites/Default"));
            m.color = c;
            return m;
        }

        private static Color GetRarityColor(int rarity)
        {
            switch (rarity)
            {
                case 1: return new Color(0.75f, 0.75f, 0.75f);
                case 2: return new Color(0.3f, 0.85f, 0.45f);
                case 3: return new Color(0.3f, 0.6f, 1f);
                case 4: return new Color(0.85f, 0.35f, 0.95f);
                case 5: return new Color(1f, 0.78f, 0.15f);
                default: return Color.white;
            }
        }
        private static LevelConfigData CreateMockLevelConfig(int id)
        {
            var level = ScriptableObject.CreateInstance<LevelConfigData>();
            level.levelId = $"L{id:000}";
            level.levelName = id switch
            {
                1 => "新手湖：微风启航",
                2 => "翠鸟湾：多样天气",
                3 => "金鳞岛：长距离航行",
                4 => "迷雾峡：低能见度挑战",
                5 => "风暴角：暴风雨拍摄",
                6 => "无尽湖：全难度综合",
                _ => $"自定义关卡 {id}"
            };
            level.description = "自动生成的关卡配置";
            level.difficulty = Mathf.Clamp(id, 1, 5);
            level.timeLimit = 600f + id * 60f;
            level.lakeSize = new Vector2(180 + id * 10, 140 + id * 8);
            level.seed = 10000 + id * 37;
            level.startDockPosition = new Vector2(-80f, 0f);
            level.baseMaxFuel = 100f;
            level.baseMaxFood = 50f;
            level.baseMaxBattery = 100f;
            level.baseMaxHealth = 100f;
            level.supplyStops = new Vector2[]
            {
                new Vector2(-30f, -25f),
                new Vector2(40f, 30f),
                new Vector2(0f, 55f),
                new Vector2(60f, -20f)
            };
            level.weatherWeights = new float[]
            {
                0.30f, 0.25f, 0.15f, 0.12f, 0.10f, 0.08f
            };
            level.initialWeather = WeatherType.Sunny;
            level.weatherChangeInterval = 45f - Mathf.Clamp(id * 3f, 0, 20f);
            level.weatherForecastPeriods = 6;
            level.warningLeadTime = 15f;
            level.baseSpeed = 10f;
            level.fuelConsumptionRate = 0.18f;
            level.photoTasks = new PhotoTaskData[]
            {
                new PhotoTaskData
                {
                    taskId = $"L{id}_T1",
                    targetName = "白鹭群",
                    description = "拍摄水面飞翔的白鹭",
                    targetPosition = new Vector2(10f, 35f),
                    targetRarity = 1,
                    basePoints = 300,
                    optimalDistance = 8f,
                    detectionRadius = 14f
                },
                new PhotoTaskData
                {
                    taskId = $"L{id}_T2",
                    targetName = "朝阳古塔",
                    description = "拍摄湖中小岛古塔远景",
                    targetPosition = new Vector2(50f, 10f),
                    targetRarity = 2,
                    basePoints = 600,
                    optimalDistance = 12f,
                    detectionRadius = 18f
                },
                new PhotoTaskData
                {
                    taskId = $"L{id}_T3",
                    targetName = "渔舟唱晚",
                    description = "拍摄扬帆的传统渔船",
                    targetPosition = new Vector2(-10f, -40f),
                    targetRarity = 2,
                    basePoints = 550,
                    optimalDistance = 10f,
                    detectionRadius = 16f
                },
                new PhotoTaskData
                {
                    taskId = $"L{id}_T4",
                    targetName = "彩虹拱桥",
                    description = "拍摄雨后湖面上的彩虹桥",
                    targetPosition = new Vector2(70f, 50f),
                    targetRarity = 3,
                    basePoints = 900,
                    optimalDistance = 18f,
                    detectionRadius = 22f
                },
                new PhotoTaskData
                {
                    taskId = $"L{id}_T5",
                    targetName = "湖心水怪",
                    description = "传说中的巨大生物浮出水面",
                    targetPosition = new Vector2(25f, -60f),
                    targetRarity = 4,
                    basePoints = 1400,
                    optimalDistance = 20f,
                    detectionRadius = 26f
                },
                new PhotoTaskData
                {
                    taskId = $"L{id}_T6",
                    targetName = "金鲤跃波",
                    description = "金色锦鲤跃出水面瞬间",
                    targetPosition = new Vector2(40f, -5f),
                    targetRarity = 5,
                    basePoints = 2200,
                    optimalDistance = 7f,
                    detectionRadius = 12f
                }
            };
            return level;
        }

        private void BindSceneServiceDelegates(LevelConfigData level)
        {
            SceneService.ResetAll();

            if (level.supplyStops != null)
            {
                var supply = level.supplyStops;
                SceneService.GetSupplyStationPositions = () => supply;
            }

            if (level.photoTasks != null)
            {
                var tasks = level.photoTasks;
                var positions = new Vector2[tasks.Length];
                var names = new string[tasks.Length];
                var rarities = new int[tasks.Length];
                for (int i = 0; i < tasks.Length; i++)
                {
                    positions[i] = tasks[i].targetPosition;
                    names[i] = tasks[i].targetName;
                    rarities[i] = tasks[i].targetRarity;
                }
                SceneService.GetTaskTargetPositions = () => positions;
                SceneService.GetTaskTargetNames = () => names;
                SceneService.GetTaskTargetRarities = () => rarities;
            }

            if (Boat != null)
            {
                var boat = Boat;
                SceneService.GetBoatPosition = () => boat.GetPosition2D();
                SceneService.GetBoatHeading = () => boat.CurrentHeading;
                SceneService.GetBoatCurrentFuel = () => boat.CurrentFuel;
                SceneService.GetBoatMaxFuel = () => boat.MaxFuel;
                SceneService.GetBoatSpeed = () => boat.CurrentSpeed;
                SceneService.GetBoatCanShootPhoto = () => boat.CanShootPhoto();
                SceneService.BoatAddWaypoint = wp => boat.AddWaypoint(wp);
                SceneService.BoatUndoWaypoint = () => boat.UndoWaypoint();
                SceneService.BoatClearWaypoints = () => boat.ClearWaypoints();
                SceneService.BoatPlanRoute = () => boat.PlanRoute();
                SceneService.BoatShootPhoto = () => boat.ShootPhoto();
                SceneService.BoatFinishShooting = () => boat.FinishShooting();
                SceneService.BoatAnchor = () => boat.Anchor();
                SceneService.BoatSetSail = () => boat.SetSail();
            }

            if (TaskSystem.Instance != null)
            {
                SceneService.GetTaskCompletedCount = () => TaskSystem.Instance.GetCompletedTaskCount();
                SceneService.GetTaskTotalCount = () => TaskSystem.Instance.GetTotalTaskCount();
            }
        }
    }

    public struct SceneInitializedEvent : IEvent
    {
        public readonly LevelConfigData Level;
        public SceneInitializedEvent(LevelConfigData level) { Level = level; }
    }
}
