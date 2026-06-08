#if UNITY_EDITOR
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using UnityEditor;
using UnityEditor.SceneManagement;
using System.Collections.Generic;

public static class ProjectBootstrapper
{
    private const string MenuPath = "Sailing/一键生成工程资源";

    [MenuItem(MenuPath)]
    public static void BootstrapAll()
    {
        CreateScriptableObjects();
        CreateScenes();
        EditorSceneManager.SaveOpenScenes();
        Debug.Log("[ProjectBootstrapper] 全部资源生成完毕！请打开 MainMenu 场景开始游戏。");
    }

    private static void CreateScriptableObjects()
    {
        CreateWeatherPresets();
        CreateMissions();
        CreateCollectionItems();
        CreateLevels();
    }

    private static void CreateWeatherPresets()
    {
        string dir = "Assets/Resources/Weather";
        EnsureDirectory(dir);

        CreateWeatherData(dir, "Clear", WeatherType.Clear,
            0f, 3f, 0.8f, 1f, 40f, 120f, 5f,
            new Color(0.76f, 0.85f, 0.92f), 0.001f, "ambient_clear");

        CreateWeatherData(dir, "Cloudy", WeatherType.Cloudy,
            1f, 6f, 0.5f, 0.9f, 35f, 100f, 6f,
            new Color(0.7f, 0.73f, 0.76f), 0.005f, "ambient_cloudy");

        CreateWeatherData(dir, "Fog", WeatherType.Fog,
            0f, 3f, 0.1f, 0.4f, 25f, 80f, 8f,
            new Color(0.75f, 0.78f, 0.8f), 0.04f, "ambient_fog");

        CreateWeatherData(dir, "Rain", WeatherType.Rain,
            2f, 8f, 0.3f, 0.7f, 30f, 90f, 6f,
            new Color(0.55f, 0.6f, 0.65f), 0.015f, "ambient_rain");

        CreateWeatherData(dir, "Storm", WeatherType.Storm,
            6f, 15f, 0.1f, 0.4f, 20f, 60f, 4f,
            new Color(0.35f, 0.38f, 0.42f), 0.03f, "ambient_storm");

        CreateWeatherData(dir, "Snow", WeatherType.Snow,
            0f, 4f, 0.2f, 0.6f, 30f, 80f, 7f,
            new Color(0.88f, 0.9f, 0.93f), 0.012f, "ambient_snow");

        AssetDatabase.Refresh();
    }

    private static void CreateWeatherData(string dir, string name, WeatherType type,
        float minWind, float maxWind, float minVis, float maxVis,
        float minDur, float maxDur, float transDur,
        Color fogColor, float fogDensity, string audioId)
    {
        string path = $"{dir}/{name}.asset";
        if (AssetDatabase.LoadAssetAtPath<WeatherData>(path) != null) return;

        var data = ScriptableObject.CreateInstance<WeatherData>();
        data.type = type;
        data.minWindSpeed = minWind;
        data.maxWindSpeed = maxWind;
        data.minVisibility = minVis;
        data.maxVisibility = maxVis;
        data.minDuration = minDur;
        data.maxDuration = maxDur;
        data.transitionDuration = transDur;
        data.fogColor = fogColor;
        data.fogDensity = fogDensity;
        data.ambientAudioClipId = audioId;

        AssetDatabase.CreateAsset(data, path);
        Debug.Log($"[ProjectBootstrapper] 创建天气预设: {path}");
    }

    private static void CreateMissions()
    {
        string dir = "Assets/Resources/Missions";
        EnsureDirectory(dir);

        CreateMissionData(dir, "mission_01_01", "拍摄白鹭", "驶近湖心小岛，拍摄一只栖息的白鹭",
            MissionType.Photo, " egret", 8f, 150, 15, 30f, 50,
            "collection_egret", "mission_complete");

        CreateMissionData(dir, "mission_01_02", "到达灯塔", "航行至北岸老灯塔附近",
            MissionType.ReachPoint, "lighthouse", 6f, 120, 10, 25f, 40,
            "collection_lighthouse", "mission_complete");

        CreateMissionData(dir, "mission_01_03", "拍摄荷花", "在东岸浅水区拍摄盛开的荷花",
            MissionType.Photo, "lotus", 8f, 130, 12, 35f, 45,
            "collection_lotus", "mission_complete");

        AssetDatabase.Refresh();
    }

    private static void CreateMissionData(string dir, string id, string name, string desc,
        MissionType type, string targetId, float radius,
        int baseScore, int bonusPerSec, float timeThreshold, int qualityMax,
        string collectionItemId, string audioId)
    {
        string path = $"{dir}/{id}.asset";
        if (AssetDatabase.LoadAssetAtPath<MissionData>(path) != null) return;

        var data = ScriptableObject.CreateInstance<MissionData>();
        data.missionId = id;
        data.missionName = name;
        data.description = desc;
        data.missionType = type;
        data.targetId = targetId;
        data.targetRadius = radius;
        data.baseScore = baseScore;
        data.bonusScorePerSecond = bonusPerSec;
        data.timeBonusThreshold = timeThreshold;
        data.qualityBonusMax = qualityMax;
        data.collectionItemId = collectionItemId;
        data.completionAudioId = audioId;

        AssetDatabase.CreateAsset(data, path);
        Debug.Log($"[ProjectBootstrapper] 创建任务配置: {path}");
    }

    private static void CreateCollectionItems()
    {
        string dir = "Assets/Resources/Collection";
        EnsureDirectory(dir);

        CreateCollectionItem(dir, "collection_egret", "白鹭", "湖面上优雅的白鹭，喜在清晨出没", "民间传说白鹭是湖神的信使，指引迷航的渔民回家。", CollectionCategory.Wildlife, 1, "mission_01_01");
        CreateCollectionItem(dir, "collection_lighthouse", "老灯塔", "北岸矗立的百年灯塔", "灯塔建于上世纪初，至今仍在为夜航的渔船指引方向。", CollectionCategory.Landmark, 0, "mission_01_02");
        CreateCollectionItem(dir, "collection_lotus", "荷花", "东岸浅水区盛开的粉色荷花", "每年盛夏，东岸的荷花如约绽放，是湖面最美的风景。", CollectionCategory.Flora, 0, "mission_01_03");
        CreateCollectionItem(dir, "collection_sunset", "落日余晖", "湖面上的金色落日", "传说在暴风雨后的日落时分，能看到湖底古城的光影。", CollectionCategory.Weather, 2, "");
        CreateCollectionItem(dir, "collection_rainbow", "雨后彩虹", "雨后湖面上出现的彩虹", "湖上彩虹被视为幸运的征兆，渔民相信看到它便能平安归来。", CollectionCategory.Weather, 2, "");
        CreateCollectionItem(dir, "collection_fishing_boat", "渔船", "停靠在码头的老渔船", "这条渔船陪伴了三代渔民，见证了湖上无数风风雨雨。", CollectionCategory.ShipType, 0, "");

        AssetDatabase.Refresh();
    }

    private static void CreateCollectionItem(string dir, string id, string name, string desc, string lore, CollectionCategory category, int rarity, string missionId)
    {
        string path = $"{dir}/{id}.asset";
        if (AssetDatabase.LoadAssetAtPath<CollectionItemData>(path) != null) return;

        var data = ScriptableObject.CreateInstance<CollectionItemData>();
        data.itemId = id;
        data.displayName = name;
        data.description = desc;
        data.loreText = lore;
        data.category = category;
        data.rarity = rarity;
        data.requiredMissionId = missionId;

        AssetDatabase.CreateAsset(data, path);
        Debug.Log($"[ProjectBootstrapper] 创建图鉴条目: {path}");
    }

    private static void CreateLevels()
    {
        string dir = "Assets/Resources/Levels";
        EnsureDirectory(dir);

        var m1 = AssetDatabase.LoadAssetAtPath<MissionData>("Assets/Resources/Missions/mission_01_01.asset");
        var m2 = AssetDatabase.LoadAssetAtPath<MissionData>("Assets/Resources/Missions/mission_01_02.asset");
        var m3 = AssetDatabase.LoadAssetAtPath<MissionData>("Assets/Resources/Missions/mission_01_03.asset");

        CreateLevelData(dir, "level_01", "晨雾初航", "在晨雾中驶过湖面，完成拍摄任务，小心雾中的暗礁。",
            "Gameplay", WeatherType.Fog,
            2f, 45f, 80f, 80f, 20,
            100f, false, 0f,
            new Vector2(0f, 0f), 0f,
            80, 180, 320,
            m1, m2, m3);

        CreateLevelData(dir, "level_02", "风暴前线", "暴风即将来临，在有限时间内完成航行拍摄。",
            "Gameplay", WeatherType.Cloudy,
            5f, 90f, 100f, 90f, 25,
            180f, true, 1.5f,
            new Vector2(0f, -10f), 0f,
            120, 250, 400,
            m1, m2);

        AssetDatabase.Refresh();
    }

    private static void CreateLevelData(string dir, string id, string name, string desc,
        string sceneName, WeatherType startWeather,
        float startWindSpeed, float startWindAngle,
        float startFuel, float startFood, int startFilm,
        float timeLimit, bool hasTimeLimit, float weatherFreq,
        Vector2 boatStart, float boatHeading,
        int star1, int star2, int star3,
        params MissionData[] missions)
    {
        string path = $"{dir}/{id}.asset";
        if (AssetDatabase.LoadAssetAtPath<LevelConfig>(path) != null) return;

        var data = ScriptableObject.CreateInstance<LevelConfig>();
        data.levelId = id;
        data.levelName = name;
        data.description = desc;
        data.sceneName = sceneName;
        data.startWeather = startWeather;
        data.startWindSpeed = startWindSpeed;
        data.startWindAngle = startWindAngle;
        data.startFuel = startFuel;
        data.startFood = startFood;
        data.startFilm = startFilm;
        data.timeLimit = timeLimit;
        data.hasTimeLimit = hasTimeLimit;
        data.weatherChangeFrequency = weatherFreq;
        data.boatStartPosition = boatStart;
        data.boatStartHeading = boatHeading;
        data.starThreshold1 = star1;
        data.starThreshold2 = star2;
        data.starThreshold3 = star3;
        data.completionScene = "LevelSelect";

        var missionList = new List<MissionData>();
        foreach (var m in missions)
        {
            if (m != null) missionList.Add(m);
        }
        data.missions = missionList;

        if (id == "level_02")
        {
            data.requiredLevelIds = new List<string> { "level_01" };
        }

        AssetDatabase.CreateAsset(data, path);
        Debug.Log($"[ProjectBootstrapper] 创建关卡配置: {path}");
    }

    private static void CreateScenes()
    {
        CreateMainMenuScene();
        CreateLevelSelectScene();
        CreateGameplayScene();
    }

    private static void CreateMainMenuScene()
    {
        string path = "Assets/Scenes/MainMenu.unity";
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        CreateEventSystem(scene);
        CreateCamera(scene, "Main Camera", new Color(0.15f, 0.25f, 0.4f, 1f));
        CreateDirectionalLight(scene);
        CreatePersistentManagers(scene);
        CreateUICanvas(scene, "MainMenuCanvas", out var canvas, out var scaler);

        var panelObj = new GameObject("MainMenuPanel");
        panelObj.transform.SetParent(canvas.transform, false);
        var rect = panelObj.AddComponent<RectTransform>();
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.sizeDelta = Vector2.zero;
        panelObj.AddComponent<MainMenuPanel>();

        var title = CreateUIText(canvas, "Title", "湖面航行·天气挑战", 42, new Color(1f, 0.95f, 0.8f));
        var rt = title.GetComponent<RectTransform>();
        rt.anchorMin = new Vector2(0.5f, 0.85f);
        rt.anchorMax = new Vector2(0.5f, 0.85f);
        rt.sizeDelta = new Vector2(600f, 80f);
        rt.anchoredPosition = Vector2.zero;

        var settingsObj = new GameObject("SettingsPanel");
        settingsObj.transform.SetParent(canvas.transform, false);
        settingsObj.AddComponent<RectTransform>();
        settingsObj.AddComponent<SettingsPanel>();
        settingsObj.SetActive(false);

        var collectionObj = new GameObject("CollectionPanel");
        collectionObj.transform.SetParent(canvas.transform, false);
        collectionObj.AddComponent<RectTransform>();
        collectionObj.AddComponent<CollectionPanel>();
        collectionObj.SetActive(false);

        var dispatcherObj = new GameObject("UIStateDispatcher");
        dispatcherObj.transform.SetParent(canvas.transform, false);
        var dispatcher = dispatcherObj.AddComponent<UIStateDispatcher>();
        var soDisp = new SerializedObject(dispatcher);
        soDisp.FindProperty("mainMenuPanel").objectReferenceValue = panelObj;
        soDisp.FindProperty("settingsPanel").objectReferenceValue = settingsObj;
        soDisp.FindProperty("collectionPanel").objectReferenceValue = collectionObj;
        soDisp.ApplyModifiedProperties();

        EditorSceneManager.SaveScene(scene, path);
        Debug.Log($"[ProjectBootstrapper] 创建主菜单场景: {path}");
    }

    private static void CreateLevelSelectScene()
    {
        string path = "Assets/Scenes/LevelSelect.unity";
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        CreateEventSystem(scene);
        CreateCamera(scene, "Main Camera", new Color(0.15f, 0.25f, 0.4f, 1f));
        CreateDirectionalLight(scene);

        var canvasObj = CreateUICanvasRaw(scene, "LevelSelectCanvas");
        var canvas = canvasObj.GetComponent<Canvas>();

        var panelObj = new GameObject("LevelSelectPanel");
        panelObj.transform.SetParent(canvas.transform, false);
        var rect = panelObj.AddComponent<RectTransform>();
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.sizeDelta = Vector2.zero;
        panelObj.AddComponent<LevelSelectPanel>();

        var settingsObj = new GameObject("SettingsPanel");
        settingsObj.transform.SetParent(canvas.transform, false);
        settingsObj.AddComponent<RectTransform>();
        settingsObj.AddComponent<SettingsPanel>();
        settingsObj.SetActive(false);

        var collectionObj = new GameObject("CollectionPanel");
        collectionObj.transform.SetParent(canvas.transform, false);
        collectionObj.AddComponent<RectTransform>();
        collectionObj.AddComponent<CollectionPanel>();
        collectionObj.SetActive(false);

        var dispatcherObj = new GameObject("UIStateDispatcher");
        dispatcherObj.transform.SetParent(canvas.transform, false);
        var dispatcher = dispatcherObj.AddComponent<UIStateDispatcher>();
        var soDisp = new SerializedObject(dispatcher);
        soDisp.FindProperty("levelSelectPanel").objectReferenceValue = panelObj;
        soDisp.FindProperty("settingsPanel").objectReferenceValue = settingsObj;
        soDisp.FindProperty("collectionPanel").objectReferenceValue = collectionObj;
        soDisp.ApplyModifiedProperties();

        EditorSceneManager.SaveScene(scene, path);
        Debug.Log($"[ProjectBootstrapper] 创建关卡选择场景: {path}");
    }

    private static void CreateGameplayScene()
    {
        string path = "Assets/Scenes/Gameplay.unity";
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        CreateEventSystem(scene);
        CreateCamera(scene, "Main Camera", new Color(0.2f, 0.35f, 0.55f, 1f));
        var cam = GameObject.Find("Main Camera").GetComponent<Camera>();
        cam.orthographic = true;
        cam.orthographicSize = 20f;
        cam.transform.position = new Vector3(0f, 30f, 0f);
        cam.transform.rotation = Quaternion.Euler(90f, 0f, 0f);

        CreateDirectionalLight(scene);

        var waterPlane = GameObject.CreatePrimitive(PrimitiveType.Plane);
        waterPlane.name = "Water";
        waterPlane.transform.position = Vector3.zero;
        waterPlane.transform.localScale = new Vector3(10f, 1f, 10f);
        var waterRenderer = waterPlane.GetComponent<Renderer>();
        waterRenderer.material.color = new Color(0.15f, 0.4f, 0.6f, 0.8f);
        Object.DestroyImmediate(waterPlane.GetComponent<Collider>());

        var boatObj = new GameObject("Boat");
        boatObj.transform.position = new Vector3(0f, 0.5f, 0f);
        var boatCtrl = boatObj.AddComponent<BoatController>();
        var supplySys = boatObj.AddComponent<SupplySystem>();
        boatObj.AddComponent<RoutePlanner>();

        var weatherWarningCanvasObj = new GameObject("WeatherWarningCanvas");
        var wgCanvas = weatherWarningCanvasObj.AddComponent<Canvas>();
        wgCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
        weatherWarningCanvasObj.AddComponent<CanvasScaler>();
        var wgGroup = weatherWarningCanvasObj.AddComponent<CanvasGroup>();
        wgGroup.alpha = 0f;
        wgGroup.blocksRaycasts = false;

        var warningTextObj = new GameObject("WarningText");
        warningTextObj.transform.SetParent(weatherWarningCanvasObj.transform, false);
        var wgText = warningTextObj.AddComponent<TMPro.TextMeshProUGUI>();
        wgText.fontSize = 28;
        wgText.alignment = TMPro.TextAlignmentOptions.Center;
        wgText.color = Color.yellow;
        var wgRect = warningTextObj.GetComponent<RectTransform>();
        wgRect.anchorMin = new Vector2(0.5f, 0.9f);
        wgRect.anchorMax = new Vector2(0.5f, 0.9f);
        wgRect.sizeDelta = new Vector2(600f, 60f);

        var warningUI = weatherWarningCanvasObj.AddComponent<WeatherWarningUI>();
        var soWarning = new SerializedObject(warningUI);
        soWarning.FindProperty("canvasGroup").objectReferenceValue = wgGroup;
        soWarning.FindProperty("warningText").objectReferenceValue = wgText;
        soWarning.ApplyModifiedProperties();

        CreatePhotoTarget(scene, "Egret", new Vector3(15f, 0.5f, 10f), "egret", 8f, "collection_egret");
        CreatePhotoTarget(scene, "Lighthouse", new Vector3(-20f, 2f, 25f), "lighthouse", 6f, "collection_lighthouse");
        CreatePhotoTarget(scene, "Lotus", new Vector3(10f, 0.3f, -15f), "lotus", 8f, "collection_lotus");

        CreateSupplyDock(scene, "Dock_North", new Vector3(0f, 0.5f, 20f));
        CreateSupplyDock(scene, "Dock_South", new Vector3(0f, 0.5f, -20f));

        var canvasObj = CreateUICanvasRaw(scene, "GameplayCanvas");
        var canvas = canvasObj.GetComponent<Canvas>();

        var hudObj = new GameObject("HUDPanel");
        hudObj.transform.SetParent(canvas.transform, false);
        var hudRect = hudObj.AddComponent<RectTransform>();
        hudRect.anchorMin = Vector2.zero;
        hudRect.anchorMax = Vector2.one;
        hudRect.sizeDelta = Vector2.zero;
        hudObj.AddComponent<HUDPanel>();

        var pauseObj = new GameObject("PausePanel");
        pauseObj.transform.SetParent(canvas.transform, false);
        pauseObj.AddComponent<RectTransform>();
        pauseObj.AddComponent<PausePanel>();
        pauseObj.SetActive(false);

        var resultObj = new GameObject("MissionResultPanel");
        resultObj.transform.SetParent(canvas.transform, false);
        resultObj.AddComponent<RectTransform>();
        resultObj.AddComponent<MissionResultPanel>();
        resultObj.SetActive(false);

        var supplyPanelObj = new GameObject("SupplyPanel");
        supplyPanelObj.transform.SetParent(canvas.transform, false);
        supplyPanelObj.AddComponent<RectTransform>();
        supplyPanelObj.AddComponent<SupplyPanel>();
        supplyPanelObj.SetActive(false);

        var mapPanelObj = new GameObject("MapPanel");
        mapPanelObj.transform.SetParent(canvas.transform, false);
        mapPanelObj.AddComponent<RectTransform>();
        mapPanelObj.AddComponent<MapPanel>();
        mapPanelObj.SetActive(false);

        var settingsObj = new GameObject("SettingsPanel");
        settingsObj.transform.SetParent(canvas.transform, false);
        settingsObj.AddComponent<RectTransform>();
        settingsObj.AddComponent<SettingsPanel>();
        settingsObj.SetActive(false);

        var collectionObj = new GameObject("CollectionPanel");
        collectionObj.transform.SetParent(canvas.transform, false);
        collectionObj.AddComponent<RectTransform>();
        collectionObj.AddComponent<CollectionPanel>();
        collectionObj.SetActive(false);

        var dispatcherObj = new GameObject("UIStateDispatcher");
        dispatcherObj.transform.SetParent(canvas.transform, false);
        var dispatcher = dispatcherObj.AddComponent<UIStateDispatcher>();
        var soDisp = new SerializedObject(dispatcher);
        soDisp.FindProperty("hudPanel").objectReferenceValue = hudObj;
        soDisp.FindProperty("pausePanel").objectReferenceValue = pauseObj;
        soDisp.FindProperty("missionResultPanel").objectReferenceValue = resultObj;
        soDisp.FindProperty("settingsPanel").objectReferenceValue = settingsObj;
        soDisp.FindProperty("supplyPanel").objectReferenceValue = supplyPanelObj;
        soDisp.FindProperty("collectionPanel").objectReferenceValue = collectionObj;
        soDisp.FindProperty("mapPanel").objectReferenceValue = mapPanelObj;
        soDisp.ApplyModifiedProperties();

        EditorSceneManager.SaveScene(scene, path);
        Debug.Log($"[ProjectBootstrapper] 创建游戏场景: {path}");
    }

    private static void CreatePhotoTarget(Scene scene, string name, Vector3 pos, string targetId, float radius, string collectionId)
    {
        var obj = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        obj.name = name;
        obj.transform.position = pos;
        obj.transform.localScale = new Vector3(1.5f, 0.5f, 1.5f);
        var renderer = obj.GetComponent<Renderer>();
        renderer.material.color = Color.cyan;

        var photoTarget = obj.AddComponent<PhotoTarget>();
        var so = new SerializedObject(photoTarget);
        so.FindProperty("targetId").stringValue = targetId;
        so.FindProperty("detectionRadius").floatValue = radius;
        so.FindProperty("collectionItemId").stringValue = collectionId;
        so.ApplyModifiedProperties();
    }

    private static void CreateSupplyDock(Scene scene, string name, Vector3 pos)
    {
        var obj = GameObject.CreatePrimitive(PrimitiveType.Cube);
        obj.name = name;
        obj.transform.position = pos;
        obj.transform.localScale = new Vector3(2f, 0.3f, 2f);
        var renderer = obj.GetComponent<Renderer>();
        renderer.material.color = new Color(0.6f, 0.5f, 0.3f);
    }

    private static void CreatePersistentManagers(Scene scene)
    {
        var managersObj = new GameObject("Managers");
        managersObj.AddComponent<SaveSystem>();
        managersObj.AddComponent<InputMapper>();
        managersObj.AddComponent<AudioTrigger>();
        managersObj.AddComponent<CoroutineRunner>();
        managersObj.AddComponent<SceneMgr>();
        managersObj.AddComponent<UIStateManager>();
        managersObj.AddComponent<GameFlowManager>();
    }

    private static void CreateEventSystem(Scene scene)
    {
        var esObj = new GameObject("EventSystem");
        esObj.AddComponent<UnityEngine.EventSystems.EventSystem>();
        esObj.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
    }

    private static void CreateCamera(Scene scene, string name, Color bgColor)
    {
        var camObj = new GameObject(name);
        var cam = camObj.AddComponent<Camera>();
        cam.backgroundColor = bgColor;
        cam.clearFlags = CameraClearFlags.SolidColor;
    }

    private static void CreateDirectionalLight(Scene scene)
    {
        var lightObj = new GameObject("Directional Light");
        var light = lightObj.AddComponent<Light>();
        light.type = LightType.Directional;
        light.color = new Color(1f, 0.95f, 0.85f);
        light.intensity = 0.8f;
        lightObj.transform.rotation = Quaternion.Euler(50f, -30f, 0f);
    }

    private static void CreateUICanvas(Scene scene, string name, out Canvas canvas, out CanvasScaler scaler)
    {
        var obj = new GameObject(name);
        canvas = obj.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        scaler = obj.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1920f, 1080f);
        obj.AddComponent<UnityEngine.UI.GraphicRaycaster>();
    }

    private static GameObject CreateUICanvasRaw(Scene scene, string name)
    {
        var obj = new GameObject(name);
        var canvas = obj.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        var scaler = obj.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1920f, 1080f);
        obj.AddComponent<UnityEngine.UI.GraphicRaycaster>();
        return obj;
    }

    private static GameObject CreateUIText(Canvas canvas, string name, string text, int fontSize, Color color)
    {
        var obj = new GameObject(name);
        obj.transform.SetParent(canvas.transform, false);
        var tmp = obj.AddComponent<TMPro.TextMeshProUGUI>();
        tmp.text = text;
        tmp.fontSize = fontSize;
        tmp.color = color;
        tmp.alignment = TMPro.TextAlignmentOptions.Center;
        return obj;
    }

    private static void EnsureDirectory(string path)
    {
        if (!AssetDatabase.IsValidFolder(path))
        {
            string[] parts = path.Split('/');
            string current = parts[0];
            for (int i = 1; i < parts.Length; i++)
            {
                string next = current + "/" + parts[i];
                if (!AssetDatabase.IsValidFolder(next))
                    AssetDatabase.CreateFolder(current, parts[i]);
                current = next;
            }
        }
    }
}
#endif
