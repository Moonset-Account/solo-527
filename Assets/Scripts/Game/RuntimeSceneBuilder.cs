using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Audio;
using TMPro;
using System.Collections.Generic;
using ShadowPlatformer.Core;
using ShadowPlatformer.Player;
using ShadowPlatformer.Light;
using ShadowPlatformer.Level;
using ShadowPlatformer.Save;
using ShadowPlatformer.Audio;
using ShadowPlatformer.Mechanics;
using ShadowPlatformer.UI;
using ShadowPlatformer.Analytics;

namespace ShadowPlatformer.Game
{
    public class RuntimeSceneBuilder : MonoBehaviour
    {
        public enum SceneType
        {
            MainMenu,
            Level
        }

        public SceneType sceneType;
        public string levelId = "tut_01";

        private void Start()
        {
            switch (sceneType)
            {
                case SceneType.MainMenu:
                    CreateMainMenuUI();
                    break;
                case SceneType.Level:
                    CreateLevelScene();
                    break;
            }
        }

        private LevelLayout LoadLayout(string id)
        {
            string path = "Levels/layout_" + id;
            var asset = Resources.Load<TextAsset>(path);
            if (asset != null)
                return JsonUtility.FromJson<LevelLayout>(asset.text);
            Debug.LogWarning("Level layout not found: " + path);
            return null;
        }

        private LevelData GetNextLevelId(string currentId)
        {
            if (LevelManager.Instance == null) return null;
            var ordered = LevelManager.Instance.GetOrderedLevels();
            int idx = ordered.FindIndex(l => l.levelId == currentId);
            if (idx >= 0 && idx < ordered.Count - 1)
                return ordered[idx + 1];
            return null;
        }

        private void CreateMainMenuUI()
        {
            GameManager.Instance.SetGameMode(GameMode.Menu);

            var canvas = CreateCanvas("MenuCanvas", RenderMode.ScreenSpaceOverlay);
            var scaler = canvas.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            var panel = CreateUIObject("MainPanel", canvas.transform);
            var rect = panel.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;

            var titleText = CreateText("Title", panel.transform, "光影平台跳跃", 72, new Vector2(0, 200));
            var continueBtn = CreateButton("ContinueBtn", panel.transform, "继续", new Vector2(0, 50));
            var newGameBtn = CreateButton("NewGameBtn", panel.transform, "新游戏", new Vector2(0, -20));
            var levelSelectBtn = CreateButton("LevelSelectBtn", panel.transform, "关卡选择", new Vector2(0, -55));
            var settingsBtn = CreateButton("SettingsBtn", panel.transform, "设置", new Vector2(0, -90));
            var quitBtn = CreateButton("QuitBtn", panel.transform, "退出", new Vector2(0, -160));

            var mainMenu = canvas.AddComponent<MainMenu>();
            mainMenu.continueButton = continueBtn;
            mainMenu.newGameButton = newGameBtn;
            mainMenu.levelSelectButton = levelSelectBtn;
            mainMenu.settingsButton = settingsBtn;
            mainMenu.quitButton = quitBtn;
            mainMenu.mainPanel = panel;

            var levelSelectPanel = CreateUIObject("LevelSelectPanel", canvas.transform);
            var lsRect = levelSelectPanel.AddComponent<RectTransform>();
            lsRect.anchorMin = Vector2.zero;
            lsRect.anchorMax = Vector2.one;
            lsRect.offsetMin = Vector2.zero;
            lsRect.offsetMax = Vector2.zero;
            levelSelectPanel.SetActive(false);
            mainMenu.levelSelectPanel = levelSelectPanel;

            var lsBackBtn = CreateButton("LevelSelectBackBtn", levelSelectPanel.transform, "返回", new Vector2(0, -400));
            mainMenu.levelSelectBackButton = lsBackBtn;

            var lsContainer = CreateUIObject("LevelButtonContainer", levelSelectPanel.transform);
            var lsContRect = lsContainer.AddComponent<RectTransform>();
            lsContRect.anchorMin = new Vector2(0.5f, 1f);
            lsContRect.anchorMax = new Vector2(0.5f, 1f);
            lsContRect.pivot = new Vector2(0.5f, 1f);
            lsContRect.sizeDelta = new Vector2(600, 800);
            lsContRect.anchoredPosition = new Vector2(0, -50);
            var lsLayout = lsContainer.AddComponent<VerticalLayoutGroup>();
            lsLayout.childControlWidth = true;
            lsLayout.childControlHeight = false;
            lsLayout.childForceExpandWidth = true;
            lsLayout.spacing = 10;
            mainMenu.levelButtonContainer = lsContainer.transform;

            var settingsPanelObj = CreateSettingsPanel(canvas);
            mainMenu.settingsPanel = settingsPanelObj.GetComponent<SettingsPanel>();

            var eventSystemGo = new GameObject("EventSystem");
            eventSystemGo.AddComponent<UnityEngine.EventSystems.EventSystem>();
            eventSystemGo.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();

            AudioManager.Instance?.PlayMenuMusic();
        }

        private void CreateLevelScene()
        {
            var layout = LoadLayout(levelId);

            GameManager.Instance.SetGameMode(GameMode.Playing);

            var camObj = new GameObject("Main Camera");
            camObj.tag = "MainCamera";
            var cam = camObj.AddComponent<Camera>();
            cam.orthographic = true;
            cam.orthographicSize = 5f;
            cam.backgroundColor = new Color(0.08f, 0.08f, 0.12f, 1f);
            camObj.AddComponent<AudioListener>();
            var camCtrl = camObj.AddComponent<CameraController>();
            camObj.transform.position = new Vector3(0f, 1f, -10f);

            var lightObj = new GameObject("DirectionalLight");
            var dLight = lightObj.AddComponent<Light>();
            dLight.type = LightType.Directional;
            dLight.intensity = 0.8f;
            dLight.color = new Color(1f, 0.95f, 0.8f);
            lightObj.transform.rotation = Quaternion.Euler(0f, 0f, 0f);
            if (LightManager.Instance != null)
                LightManager.Instance.directionalLightObject = lightObj;

            Vector2 spawnPos = layout != null ? layout.playerSpawn : new Vector2(-5f, 1f);
            CreatePlayer(camCtrl, spawnPos);

            if (layout != null && LightManager.Instance != null)
            {
                LightManager.Instance.ForceSetDirection(layout.startLightDirection);
            }

            var levelRoot = new GameObject("LevelRoot");

            if (layout != null)
            {
                BuildFromLayout(layout, levelRoot);
            }
            else
            {
                CreateStaticPlatform("Ground", new Vector2(0f, -3f), new Vector2(40f, 1f), levelRoot);
                CreateShadowPlatform("SP_Right", new Vector2(3f, 0f), new Vector2(3f, 0.5f), LightDirection.Right, levelRoot);
                CreateLevelExit(new Vector2(14f, 3f), "tut_02", levelRoot);
                CreateCheckpoint("CP_Start", new Vector2(-4f, -2.5f), levelRoot);
            }

            CreateHUD();
            CreateDeathScreen();
            CreateLevelCompleteScreen();
            CreatePauseMenu();

            if (!FindObjectOfType<UnityEngine.EventSystems.EventSystem>())
            {
                var es = new GameObject("EventSystem");
                es.AddComponent<UnityEngine.EventSystems.EventSystem>();
                es.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
            }

            if (LevelManager.Instance != null)
                LevelManager.Instance.StartLevel(levelId);

            if (SaveManager.Instance != null && SaveManager.Instance.CurrentSave != null)
            {
                SaveManager.Instance.CurrentSave.currentLevelId = levelId;
                SaveManager.Instance.SaveGame();
            }

            AudioManager.Instance?.PlayLevelMusic(0);
        }

        private void BuildFromLayout(LevelLayout layout, GameObject levelRoot)
        {
            if (layout.platforms != null)
            {
                foreach (var p in layout.platforms)
                {
                    if (p.isShadowPlatform)
                        CreateShadowPlatform(p.id, p.position, p.size, p.shadowDirection, levelRoot);
                    else
                        CreateStaticPlatform(p.id, p.position, p.size, levelRoot);
                }
            }

            var triggerMap = new Dictionary<string, MechanismTrigger>();
            if (layout.triggers != null)
            {
                foreach (var t in layout.triggers)
                {
                    var mt = CreateTrigger(t, levelRoot);
                    if (mt != null)
                        triggerMap[t.id] = mt;
                }
            }

            if (layout.receivers != null)
            {
                foreach (var r in layout.receivers)
                {
                    CreateReceiver(r, levelRoot);
                }
            }

            if (layout.triggers != null && layout.triggers.Length > 0 && layout.receivers != null && layout.receivers.Length > 0)
            {
                var allTriggers = new List<MechanismTrigger>();
                foreach (var t in layout.triggers)
                {
                    if (triggerMap.TryGetValue(t.id, out var mt))
                        allTriggers.Add(mt);
                }

                var allReceivers = levelRoot.GetComponentsInChildren<MechanismReceiver>();
                if (allTriggers.Count > 0 && allReceivers.Length > 0)
                {
                    var linker = levelRoot.AddComponent<MechanismLinker>();
                    linker.triggers = allTriggers.ToArray();
                    linker.receivers = allReceivers;
                }
            }

            if (layout.hazards != null)
            {
                foreach (var h in layout.hazards)
                    CreateHazard(h, levelRoot);
            }

            string nextId = "tut_02";
            var next = GetNextLevelId(layout.levelId);
            if (next != null)
                nextId = next.levelId;

            CreateLevelExit(layout.levelExitPosition, nextId, levelRoot);

            if (layout.checkpoints != null)
            {
                foreach (var c in layout.checkpoints)
                    CreateCheckpoint(c.id, c.position, levelRoot);
            }
        }

        private void CreatePlayer(CameraController camCtrl, Vector2 spawnPos)
        {
            var playerObj = new GameObject("Player");
            playerObj.tag = "Player";
            playerObj.transform.position = spawnPos;
            playerObj.layer = LayerMask.NameToLayer("Player");

            var rb = playerObj.AddComponent<Rigidbody2D>();
            rb.constraints = RigidbodyConstraints2D.FreezeRotation;
            rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            rb.gravityScale = 3f;

            var col = playerObj.AddComponent<BoxCollider2D>();
            col.size = new Vector2(0.6f, 1f);

            var sr = playerObj.AddComponent<SpriteRenderer>();
            sr.color = Color.white;
            sr.sprite = CreatePixelSprite();

            var input = playerObj.AddComponent<PlayerInput>();
            var ctrl = playerObj.AddComponent<PlayerController>();

            var gcp = new GameObject("GroundCheck");
            gcp.transform.SetParent(playerObj.transform);
            gcp.transform.localPosition = new Vector3(0f, -0.5f, 0f);
            ctrl.groundCheckPoint = gcp.transform;
            ctrl.groundLayer = LayerMask.GetMask("Default", "Ground");

            camCtrl.target = playerObj.transform;
        }

        private void CreateStaticPlatform(string name, Vector2 pos, Vector2 size, GameObject parent)
        {
            var obj = new GameObject(name);
            obj.transform.SetParent(parent.transform);
            obj.transform.position = pos;
            obj.layer = LayerMask.NameToLayer("Ground");

            var sr = obj.AddComponent<SpriteRenderer>();
            sr.color = new Color(0.35f, 0.35f, 0.4f);
            sr.size = size;
            sr.sprite = CreatePixelSprite();

            var col = obj.AddComponent<BoxCollider2D>();
            col.size = size;
        }

        private void CreateShadowPlatform(string name, Vector2 pos, Vector2 size, LightDirection dir, GameObject parent)
        {
            var obj = new GameObject(name);
            obj.transform.SetParent(parent.transform);
            obj.transform.position = pos;

            var sr = obj.AddComponent<SpriteRenderer>();
            sr.color = new Color(0.4f, 0.4f, 0.7f, 0.8f);
            sr.size = size;
            sr.sprite = CreatePixelSprite();

            var col = obj.AddComponent<BoxCollider2D>();
            col.size = size;

            var sp = obj.AddComponent<ShadowPlatform>();
            sp.shadowDirection = dir;
            sp.visibilityRule = ShadowVisibility.WhenLightMatches;
        }

        private MechanismTrigger CreateTrigger(TriggerConfig cfg, GameObject parent)
        {
            var obj = new GameObject("Trigger_" + cfg.id);
            obj.transform.SetParent(parent.transform);
            obj.transform.position = cfg.position;

            var sr = obj.AddComponent<SpriteRenderer>();
            var col = obj.AddComponent<BoxCollider2D>();

            var mt = obj.AddComponent<MechanismTrigger>();
            mt.triggerId = cfg.id;
            mt.triggerType = cfg.type;
            mt.isOneShot = cfg.isOneShot;
            mt.timedDuration = cfg.timedDuration;
            mt.requiredLightDirection = cfg.requiredLightDirection;

            switch (cfg.type)
            {
                case TriggerType.PressurePlate:
                    col.size = new Vector2(1.5f, 0.2f);
                    col.isTrigger = true;
                    sr.color = new Color(0.8f, 0.6f, 0.2f);
                    sr.size = new Vector2(1.5f, 0.2f);
                    break;
                case TriggerType.Lever:
                    col.size = new Vector2(0.8f, 1.2f);
                    col.isTrigger = true;
                    sr.color = new Color(0.9f, 0.5f, 0.1f);
                    sr.size = new Vector2(0.5f, 1.2f);
                    var lever = obj.AddComponent<InteractableLever>();
                    lever.linkedTrigger = mt;
                    lever.interactionRadius = 1.5f;
                    break;
                case TriggerType.TimedSwitch:
                    col.size = new Vector2(1f, 0.8f);
                    col.isTrigger = true;
                    sr.color = new Color(0.2f, 0.7f, 0.9f);
                    sr.size = new Vector2(1f, 0.8f);
                    break;
                case TriggerType.LightSensor:
                    col.size = new Vector2(1.5f, 0.3f);
                    col.isTrigger = false;
                    sr.color = new Color(0.9f, 0.9f, 0.2f);
                    sr.size = new Vector2(1.5f, 0.3f);
                    break;
            }

            sr.sprite = CreatePixelSprite();
            return mt;
        }

        private void CreateReceiver(ReceiverConfig cfg, GameObject parent)
        {
            var obj = new GameObject("Receiver_" + cfg.id);
            obj.transform.SetParent(parent.transform);
            obj.transform.position = cfg.position;

            var sr = obj.AddComponent<SpriteRenderer>();
            sr.sprite = CreatePixelSprite();

            if (cfg.isDoor)
            {
                var col = obj.AddComponent<BoxCollider2D>();
                col.size = new Vector2(1f, 2f);
                sr.color = new Color(0.7f, 0.2f, 0.2f);
                sr.size = new Vector2(1f, 2f);

                var doorChild = new GameObject("DoorObject");
                doorChild.transform.SetParent(obj.transform);
                doorChild.transform.localPosition = Vector3.zero;
                var doorCol = doorChild.AddComponent<BoxCollider2D>();
                doorCol.size = new Vector2(1f, 2f);
                var doorSr = doorChild.AddComponent<SpriteRenderer>();
                doorSr.color = new Color(0.7f, 0.2f, 0.2f);
                doorSr.size = new Vector2(1f, 2f);
                doorSr.sprite = CreatePixelSprite();

                var mr = obj.AddComponent<MechanismReceiver>();
                mr.receiverId = cfg.id;
                mr.requiredTriggerIds = cfg.requiredTriggerIds;
                mr.requireAllTriggers = cfg.requireAllTriggers;
                mr.isDoor = true;
                mr.doorObject = doorChild;
                mr.doorOpenByDefault = cfg.doorOpenByDefault;
            }
            else if (cfg.isMovingPlatform)
            {
                var col = obj.AddComponent<BoxCollider2D>();
                col.size = new Vector2(3f, 0.5f);
                sr.color = new Color(0.5f, 0.8f, 0.5f);
                sr.size = new Vector2(3f, 0.5f);
                obj.layer = LayerMask.NameToLayer("Ground");

                var targetObj = new GameObject("MoveTarget");
                targetObj.transform.SetParent(obj.transform.parent);
                targetObj.transform.position = cfg.position + cfg.moveTargetOffset;

                var mr = obj.AddComponent<MechanismReceiver>();
                mr.receiverId = cfg.id;
                mr.requiredTriggerIds = cfg.requiredTriggerIds;
                mr.requireAllTriggers = cfg.requireAllTriggers;
                mr.moveTarget = targetObj.transform;
                mr.moveSpeed = cfg.moveSpeed;
                mr.isMovingPlatform = true;
            }
        }

        private void CreateHazard(HazardConfig cfg, GameObject parent)
        {
            var obj = new GameObject("Hazard_" + cfg.id);
            obj.transform.SetParent(parent.transform);
            obj.transform.position = cfg.position;

            var hCol = obj.AddComponent<BoxCollider2D>();
            hCol.size = cfg.size;
            hCol.isTrigger = true;

            var hSr = obj.AddComponent<SpriteRenderer>();
            hSr.color = new Color(1f, 0.2f, 0.2f, 0.6f);
            hSr.size = cfg.size;
            hSr.sprite = CreatePixelSprite();

            var hz = obj.AddComponent<HazardZone>();
            hz.instantKill = cfg.instantKill;
        }

        private void CreateLevelExit(Vector2 pos, string nextLevelId, GameObject parent)
        {
            var exitObj = new GameObject("LevelExit");
            exitObj.transform.SetParent(parent.transform);
            exitObj.transform.position = pos;

            var col = exitObj.AddComponent<BoxCollider2D>();
            col.size = new Vector2(1f, 2f);
            col.isTrigger = true;

            var sr = exitObj.AddComponent<SpriteRenderer>();
            sr.color = new Color(0f, 1f, 0.5f, 0.5f);
            sr.size = new Vector2(1f, 2f);
            sr.sprite = CreatePixelSprite();

            var exit = exitObj.AddComponent<LevelExit>();
            exit.nextLevelId = nextLevelId;
            exit.currentLevelId = levelId;
        }

        private void CreateCheckpoint(string name, Vector2 pos, GameObject parent)
        {
            var obj = new GameObject(name);
            obj.transform.SetParent(parent.transform);
            obj.transform.position = pos;

            var col = obj.AddComponent<BoxCollider2D>();
            col.size = new Vector2(1f, 1.5f);
            col.isTrigger = true;

            var sr = obj.AddComponent<SpriteRenderer>();
            sr.color = Color.cyan;
            sr.size = new Vector2(0.5f, 1.5f);
            sr.sprite = CreatePixelSprite();

            var cp = obj.AddComponent<Checkpoint>();
            cp.checkpointId = name;
        }

        private Canvas CreateHUD()
        {
            var canvas = CreateCanvas("HUD", RenderMode.ScreenSpaceOverlay);
            var scaler = canvas.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            var hud = canvas.AddComponent<HUD>();
            hud.timerText = CreateText("Timer", canvas.transform, "00:00", 36, new Vector2(-600, 450)).GetComponent<TMP_Text>();
            hud.deathCountText = CreateText("Deaths", canvas.transform, "0", 36, new Vector2(600, 450)).GetComponent<TMP_Text>();

            var tutorialPanel = CreateUIObject("TutorialPanel", canvas.transform);
            var tutRect = tutorialPanel.AddComponent<RectTransform>();
            tutRect.anchorMin = new Vector2(0.5f, 0.3f);
            tutRect.anchorMax = new Vector2(0.5f, 0.3f);
            tutRect.sizeDelta = new Vector2(800, 80);
            tutorialPanel.SetActive(false);
            var tutText = CreateText("TutorialText", tutorialPanel.transform, "", 28, Vector2.zero);
            hud.tutorialPanel = tutorialPanel;
            hud.tutorialText = tutText.GetComponent<TMP_Text>();

            var lightDirText = CreateText("LightDir", canvas.transform, "→", 48, new Vector2(0, 450));
            hud.lightDirectionIndicator = null;

            return canvas;
        }

        private void CreateDeathScreen()
        {
            var canvas = CreateCanvas("DeathScreen", RenderMode.ScreenSpaceOverlay);
            canvas.sortingOrder = 10;
            var scaler = canvas.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            var panel = CreateUIObject("DeathPanel", canvas.transform);
            var rect = panel.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
            var img = panel.AddComponent<Image>();
            img.color = new Color(0, 0, 0, 0.7f);
            panel.SetActive(false);

            var ds = canvas.AddComponent<DeathScreen>();
            ds.deathPanel = panel;

            var msgText = CreateText("DeathMsg", panel.transform, "", 42, new Vector2(0, 100));
            ds.deathMessageText = msgText.GetComponent<TMP_Text>();

            var retryBtn = CreateButton("RetryBtn", panel.transform, "重试", new Vector2(0, -20));
            ds.retryButton = retryBtn;
            var menuBtn = CreateButton("MenuBtn", panel.transform, "主菜单", new Vector2(0, -90));
            ds.quitButton = menuBtn;
        }

        private void CreateLevelCompleteScreen()
        {
            var canvas = CreateCanvas("LevelComplete", RenderMode.ScreenSpaceOverlay);
            canvas.sortingOrder = 10;
            var scaler = canvas.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            var panel = CreateUIObject("CompletePanel", canvas.transform);
            var rect = panel.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
            var img = panel.AddComponent<Image>();
            img.color = new Color(0, 0, 0, 0.7f);
            panel.SetActive(false);

            var lcs = canvas.AddComponent<LevelCompleteScreen>();
            lcs.completePanel = panel;

            var titleText = CreateText("CompleteTitle", panel.transform, "关卡完成!", 52, new Vector2(0, 150));
            lcs.levelNameText = CreateText("LevelName", panel.transform, "", 36, new Vector2(0, 80)).GetComponent<TMP_Text>();
            lcs.timeText = CreateText("Time", panel.transform, "", 30, new Vector2(0, 20)).GetComponent<TMP_Text>();
            lcs.deathsText = CreateText("Deaths", panel.transform, "", 30, new Vector2(0, -20)).GetComponent<TMP_Text>();

            var nextBtn = CreateButton("NextBtn", panel.transform, "下一关", new Vector2(0, -80));
            lcs.nextLevelButton = nextBtn;
            var replayBtn = CreateButton("ReplayBtn", panel.transform, "重玩", new Vector2(0, -140));
            lcs.replayButton = replayBtn;
            var menuBtn = CreateButton("MenuBtn", panel.transform, "主菜单", new Vector2(0, -200));
            lcs.menuButton = menuBtn;
        }

        private void CreatePauseMenu()
        {
            var canvas = CreateCanvas("PauseMenu", RenderMode.ScreenSpaceOverlay);
            canvas.sortingOrder = 10;
            var scaler = canvas.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            var panel = CreateUIObject("PausePanel", canvas.transform);
            var rect = panel.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
            var img = panel.AddComponent<Image>();
            img.color = new Color(0, 0, 0, 0.7f);
            panel.SetActive(false);

            var pm = canvas.AddComponent<PauseMenu>();
            pm.pausePanel = panel;

            var resumeBtn = CreateButton("ResumeBtn", panel.transform, "继续", new Vector2(0, 50));
            pm.resumeButton = resumeBtn;
            var restartBtn = CreateButton("RestartBtn", panel.transform, "重启关卡", new Vector2(0, -20));
            pm.restartButton = restartBtn;
            var settingsBtn = CreateButton("SettingsBtn", panel.transform, "设置", new Vector2(0, -90));
            pm.settingsButton = settingsBtn;
            var quitBtn = CreateButton("QuitBtn", panel.transform, "主菜单", new Vector2(0, -160));
            pm.quitButton = quitBtn;
        }

        private GameObject CreateSettingsPanel(Canvas parentCanvas)
        {
            var panel = CreateUIObject("SettingsPanel", parentCanvas.transform);
            var rect = panel.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;

            var img = panel.AddComponent<Image>();
            img.color = new Color(0.1f, 0.1f, 0.15f, 0.95f);

            var sp = panel.AddComponent<SettingsPanel>();

            var masterLabel = CreateText("MasterLabel", panel.transform, "主音量", 24, new Vector2(-200, 300));
            var masterSlider = CreateSlider("MasterVolume", panel.transform, new Vector2(0, 260));
            sp.masterVolumeSlider = masterSlider;

            var musicLabel = CreateText("MusicLabel", panel.transform, "音乐音量", 24, new Vector2(-200, 200));
            var musicSlider = CreateSlider("MusicVolume", panel.transform, new Vector2(0, 160));
            sp.musicVolumeSlider = musicSlider;

            var sfxLabel = CreateText("SFXLabel", panel.transform, "音效音量", 24, new Vector2(-200, 100));
            var sfxSlider = CreateSlider("SFXVolume", panel.transform, new Vector2(0, 60));
            sp.sfxVolumeSlider = sfxSlider;

            var backBtn = CreateButton("BackBtn", panel.transform, "返回", new Vector2(0, -300));
            sp.backButton = backBtn;

            panel.SetActive(false);
            return panel;
        }

        private Slider CreateSlider(string name, Transform parent, Vector2 anchoredPos)
        {
            var obj = CreateUIObject(name, parent);
            var rect = obj.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.5f);
            rect.anchorMax = new Vector2(0.5f, 0.5f);
            rect.sizeDelta = new Vector2(400f, 20f);
            rect.anchoredPosition = anchoredPos;

            var bgObj = CreateUIObject("Background", obj.transform);
            var bgRect = bgObj.AddComponent<RectTransform>();
            bgRect.anchorMin = Vector2.zero;
            bgRect.anchorMax = Vector2.one;
            bgRect.offsetMin = Vector2.zero;
            bgRect.offsetMax = Vector2.zero;
            var bgImg = bgObj.AddComponent<Image>();
            bgImg.color = new Color(0.3f, 0.3f, 0.35f);

            var fillObj = CreateUIObject("Fill", obj.transform);
            var fillRect = fillObj.AddComponent<RectTransform>();
            fillRect.anchorMin = Vector2.zero;
            fillRect.anchorMax = new Vector2(1f, 1f);
            fillRect.offsetMin = Vector2.zero;
            fillRect.offsetMax = Vector2.zero;
            var fillImg = fillObj.AddComponent<Image>();
            fillImg.color = new Color(0.5f, 0.5f, 0.8f);

            var handleObj = CreateUIObject("Handle", obj.transform);
            var handleRect = handleObj.AddComponent<RectTransform>();
            handleRect.sizeDelta = new Vector2(20f, 30f);
            var handleImg = handleObj.AddComponent<Image>();
            handleImg.color = Color.white;

            var slider = obj.AddComponent<Slider>();
            slider.targetGraphic = handleImg;
            slider.fillRect = fillRect;
            slider.handleRect = handleRect;
            slider.minValue = 0.0001f;
            slider.maxValue = 1f;
            slider.value = 0.8f;
            slider.direction = Slider.Direction.LeftToRight;

            return slider;
        }

        private Canvas CreateCanvas(string name, RenderMode renderMode)
        {
            var obj = new GameObject(name);
            var canvas = obj.AddComponent<Canvas>();
            canvas.renderMode = renderMode;
            canvas.sortingOrder = 0;
            return canvas;
        }

        private GameObject CreateUIObject(string name, Transform parent)
        {
            var obj = new GameObject(name);
            obj.transform.SetParent(parent, false);
            return obj;
        }

        private Button CreateButton(string name, Transform parent, string text, Vector2 anchoredPos)
        {
            var obj = CreateUIObject(name, parent);
            var rect = obj.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.5f);
            rect.anchorMax = new Vector2(0.5f, 0.5f);
            rect.sizeDelta = new Vector2(300f, 60f);
            rect.anchoredPosition = anchoredPos;

            var img = obj.AddComponent<Image>();
            img.color = new Color(0.2f, 0.2f, 0.3f, 0.9f);

            var btn = obj.AddComponent<Button>();
            btn.targetGraphic = img;

            var colors = btn.colors;
            colors.highlightedColor = new Color(0.4f, 0.4f, 0.6f);
            colors.pressedColor = new Color(0.15f, 0.15f, 0.2f);
            btn.colors = colors;

            var childObj = CreateUIObject("Text", obj.transform);
            var childRect = childObj.AddComponent<RectTransform>();
            childRect.anchorMin = Vector2.zero;
            childRect.anchorMax = Vector2.one;
            childRect.offsetMin = Vector2.zero;
            childRect.offsetMax = Vector2.zero;

            var tmp = childObj.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = 28;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = Color.white;

            return btn;
        }

        private GameObject CreateText(string name, Transform parent, string text, int fontSize, Vector2 anchoredPos)
        {
            var obj = CreateUIObject(name, parent);
            var rect = obj.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.5f);
            rect.anchorMax = new Vector2(0.5f, 0.5f);
            rect.sizeDelta = new Vector2(800f, 60f);
            rect.anchoredPosition = anchoredPos;

            var tmp = obj.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = fontSize;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = Color.white;

            return obj;
        }

        private Sprite CreatePixelSprite()
        {
            var tex = new Texture2D(1, 1);
            tex.SetPixel(0, 0, Color.white);
            tex.Apply();
            var sprite = Sprite.Create(tex, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 100f);
            return sprite;
        }
    }
}
