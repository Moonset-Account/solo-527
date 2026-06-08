using System.Collections.Generic;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace LightShadowPlatformer.EditorTools
{
    public class ProjectBuilder
    {
        [MenuItem("LightShadowProject/Setup/1. Create Folders")]
        public static void CreateFolders()
        {
            string[] folders = {
                "Assets/_Art",
                "Assets/_Art/Sprites",
                "Assets/_Art/Animations",
                "Assets/_Art/Materials",
                "Assets/_Audio",
                "Assets/_Audio/Music",
                "Assets/_Audio/SFX",
                "Assets/_Prefabs",
                "Assets/_Prefabs/Core",
                "Assets/_Prefabs/Player",
                "Assets/_Prefabs/Environment",
                "Assets/_Prefabs/UI",
                "Assets/_Scenes",
                "Assets/_Data",
                "Assets/_Data/Levels",
                "Assets/_Data/Settings"
            };

            foreach (var folder in folders)
            {
                if (!AssetDatabase.IsValidFolder(folder))
                {
                    string parent = System.IO.Path.GetDirectoryName(folder);
                    string name = System.IO.Path.GetFileName(folder);
                    AssetDatabase.CreateFolder(parent, name);
                    Debug.Log($"Created: {folder}");
                }
            }
            AssetDatabase.Refresh();
            Debug.Log("Folders created successfully.");
        }

        [MenuItem("LightShadowProject/Setup/2. Create All Scene Placeholders")]
        public static void CreateAllScenes()
        {
            CreateScene("MainMenu", -1);
            CreateScene("Level01", 0);
            CreateScene("Level02", 1);
            CreateScene("Level03", 2);

            EditorBuildSettingsScene[] scenes = {
                NewBuildScene("Assets/_Scenes/MainMenu.unity", true),
                NewBuildScene("Assets/_Scenes/Level01.unity", true),
                NewBuildScene("Assets/_Scenes/Level02.unity", true),
                NewBuildScene("Assets/_Scenes/Level03.unity", true)
            };
            EditorBuildSettings.scenes = scenes;
            AssetDatabase.SaveAssets();
            Debug.Log("All scenes created and added to build.");
        }

        [MenuItem("LightShadowProject/Setup/3. Create ScriptableObjects")]
        public static void CreateScriptableObjects()
        {
            CreateGameConfig();
            CreateLevelConfigs();
            AssetDatabase.SaveAssets();
            Debug.Log("ScriptableObjects created.");
        }

        [MenuItem("LightShadowProject/Setup/4. Build Player Prefab")]
        public static void BuildPlayerPrefab()
        {
            GameObject player = new GameObject("Player");
            player.tag = "Player";
            player.layer = LayerMask.NameToLayer("Player");

            Rigidbody2D rb = player.AddComponent<Rigidbody2D>();
            rb.gravityScale = 3f;
            rb.freezeRotation = true;
            rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            rb.interpolation = RigidbodyInterpolation2D.Interpolate;

            CapsuleCollider2D col = player.AddComponent<CapsuleCollider2D>();
            col.size = new Vector2(0.6f, 1.5f);

            GameObject sprite = new GameObject("Sprite");
            sprite.transform.SetParent(player.transform, false);
            SpriteRenderer sr = sprite.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Player";
            sr.sortingOrder = 5;
            sr.color = new Color(0.3f, 0.6f, 1f);
            sr.sprite = PlaceholderSprites.Player();
            sr.drawMode = SpriteDrawMode.Sliced;
            sr.size = new Vector2(1f, 1.8f);

            GameObject gc = new GameObject("GroundCheck");
            gc.transform.SetParent(player.transform, false);
            gc.transform.localPosition = new Vector3(0, -0.85f, 0);

            LightShadowPlatformer.Player.PlayerController pc = player.AddComponent<LightShadowPlatformer.Player.PlayerController>();
            pc.rb = rb;
            pc.bodyRenderer = sr;
            pc.groundCheck = gc.transform;
            pc.groundLayer = LayerMask.GetMask("Platform", "LightPlatform", "ShadowPlatform", "Default");
            pc.platformLayer = LayerMask.GetMask("LightPlatform", "ShadowPlatform");

            LightShadowPlatformer.Player.PlayerAnimator pa = sprite.AddComponent<LightShadowPlatformer.Player.PlayerAnimator>();
            pa.controller = pc;
            pa.bodyRenderer = sr;
            pa.animator = sprite.AddComponent<Animator>();

            LightShadowPlatformer.Player.PlayerAudio pa2 = player.AddComponent<LightShadowPlatformer.Player.PlayerAudio>();
            pa2.controller = pc;

            string path = "Assets/_Prefabs/Player/Player.prefab";
            PrefabUtility.SaveAsPrefabAsset(player, path);
            Object.DestroyImmediate(player);
            Debug.Log($"Player prefab saved: {path}");
        }

        [MenuItem("LightShadowProject/Setup/5. Full Auto Setup")]
        public static void FullSetup()
        {
            CreateFolders();
            EditorApplication.delayCall += () =>
            {
                CreateAllScenes();
                EditorApplication.delayCall += () =>
                {
                    CreateScriptableObjects();
                    EditorApplication.delayCall += () =>
                    {
                        BuildPlayerPrefab();
                        Debug.Log("======= FULL SETUP COMPLETE =======");
                    };
                };
            };
        }

        private static EditorBuildSettingsScene NewBuildScene(string path, bool enabled)
        {
            GUID g = AssetDatabase.GUIDFromAssetPath(path);
            return new EditorBuildSettingsScene(g, enabled);
        }

        private static void CreateScene(string name, int levelIndex)
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            // SceneBootstrap is auto-created via RuntimeInitializeOnLoadMethod in Runtime.SceneBootstrap

            GameObject env = new GameObject("Environment");
            GameObject bg = new GameObject("Background");
            bg.transform.SetParent(env.transform, false);
            bg.transform.localScale = new Vector3(200, 120, 1);
            SpriteRenderer bgSr = bg.AddComponent<SpriteRenderer>();
            bgSr.sortingLayerName = "Background";
            bgSr.color = new Color(0.15f, 0.17f, 0.22f);
            bgSr.sprite = PlaceholderResourceGenerator.CreateSolidTexture(4, 4, new Color(0.15f, 0.17f, 0.22f)).CreateSprite(new Rect(0,0,4,4), new Vector2(0.5f,0.5f), 1f);
            bgSr.drawMode = SpriteDrawMode.Sliced;

            GameObject lightGo = new GameObject("GlobalLight");
            try
            {
                System.Type light2dType = System.Type.GetType("UnityEngine.Rendering.Universal.Light2D, Unity.RenderPipelines.Universal.Runtime");
                if (light2dType != null) lightGo.AddComponent(light2dType);
            }
            catch { }
            Light l = lightGo.AddComponent<Light>();
            l.type = LightType.Point;
            l.intensity = 0.4f;
            l.color = new Color(1f, 0.95f, 0.85f);
            lightGo.transform.position = new Vector3(0, 5, -5);

            GameObject mainCam = new GameObject("Main Camera");
            mainCam.tag = "MainCamera";
            Camera cam = mainCam.AddComponent<Camera>();
            cam.orthographic = true;
            cam.orthographicSize = 7.5f;
            cam.backgroundColor = new Color(0.12f, 0.13f, 0.18f);
            cam.clearFlags = CameraClearFlags.SolidColor;
            mainCam.AddComponent<AudioListener>();
            LightShadowPlatformer.Camera.CameraController cc = mainCam.AddComponent<LightShadowPlatformer.Camera.CameraController>();
            cc.useBounds = true;
            cc.minBounds = new Vector2(-50, -10);
            cc.maxBounds = new Vector2(150, 20);

            if (levelIndex >= 0)
            {
                GameObject level = new GameObject($"[Level{levelIndex + 1}]");
                LightShadowPlatformer.Level.LevelBuilder lb = level.AddComponent<LightShadowPlatformer.Level.LevelBuilder>();
                lb.levelIndex = levelIndex;
                lb.killY = -15f;

                GameObject spawn = new GameObject("PlayerSpawn");
                spawn.transform.SetParent(level.transform, false);
                spawn.transform.position = new Vector3(-6f, 2f, 0);
                lb.playerSpawnPoint = spawn.transform;
                lb.cameraMinBounds = new Vector2(-50f, -10f);
                lb.cameraMaxBounds = new Vector2(50f + levelIndex * 40f, 20f);

                if (levelIndex == 0)
                    lb.tutorialIdsToShow = new[] { "movement", "jump", "light", "checkpoint" };

                PlaceholderLevelBuilder.Populate(levelIndex, level.transform);
            }

            string path = $"Assets/_Scenes/{name}.unity";
            EditorSceneManager.SaveScene(scene, path);
            EditorSceneManager.CloseScene(scene, true);
            Debug.Log($"Created scene: {path}");
        }

        private static void CreateGameConfig()
        {
            Core.GameConfig config = ScriptableObject.CreateInstance<Core.GameConfig>();
            config.gameTitle = "光与影的迷途";
            config.gameSubtitle = "Light & Shadow Platformer";
            config.version = "0.1.0";
            AssetDatabase.CreateAsset(config, "Assets/_Data/Settings/GameConfig.asset");
        }

        private static void CreateLevelConfigs()
        {
            for (int i = 0; i < 3; i++)
            {
                Core.LevelConfig lc = ScriptableObject.CreateInstance<Core.LevelConfig>();
                lc.levelId = $"level_{i + 1:00}";
                lc.levelName = new[] { "教学关：光的方向", "第二关：机关迷城", "终关：光影协奏" }[i];
                lc.levelOrder = i + 1;
                lc.levelDescription = new[] {
                    "学习基础操作与光影切换",
                    "将开关、压力板、门与光影结合",
                    "综合所有机制的最终挑战"
                }[i];
                lc.difficulty = i + 1;
                lc.startingDirection = Core.LightManager.LightDirection.Left;
                lc.spawnPosition = new Vector2(-6f, 2f);
                lc.cameraMin = new Vector2(-50f, -10f);
                lc.cameraMax = new Vector2(50f + i * 40f, 20f);
                lc.estimatedPlayTimeMinutes = i + 2;
                if (i == 0) lc.introducedMechanics = new List<string> { "Move", "Jump", "SwitchLight", "Checkpoint" };
                if (i == 1) lc.introducedMechanics = new List<string> { "Switch", "Door", "Plate" };
                if (i == 2) lc.introducedMechanics = new List<string> { "Hazard", "Collectible", "ComboMechanic" };
                AssetDatabase.CreateAsset(lc, $"Assets/_Data/Levels/LevelConfig_{i + 1:00}.asset");
            }
        }
    }

    public static class PlaceholderLevelBuilder
    {
        public static void Populate(int levelIndex, Transform parent)
        {
            GameObject platformsGo = new GameObject("Platforms");
            platformsGo.transform.SetParent(parent, false);
            GameObject hazardsGo = new GameObject("Hazards");
            hazardsGo.transform.SetParent(parent, false);
            GameObject interGo = new GameObject("Interactables");
            interGo.transform.SetParent(parent, false);
            GameObject collectGo = new GameObject("Collectibles");
            collectGo.transform.SetParent(parent, false);

            SceneSetupHelper.CreatePlaceholderPlatform(new Vector3(0, 0, 0), new Vector2(20, 2),
                Core.ShadowPlatform.PlatformType.AlwaysActive, "Ground1")
                .transform.SetParent(platformsGo.transform);

            SceneSetupHelper.CreatePlaceholderPlatform(new Vector3(5, 3, 0), new Vector2(4, 1),
                Core.ShadowPlatform.PlatformType.LeftOnly, "Shadow_LeftOnly")
                .transform.SetParent(platformsGo.transform);

            SceneSetupHelper.CreatePlaceholderPlatform(new Vector3(11, 5, 0), new Vector2(4, 1),
                Core.ShadowPlatform.PlatformType.RightOnly, "Light_RightOnly")
                .transform.SetParent(platformsGo.transform);

            if (levelIndex >= 0)
            {
                SceneSetupHelper.CreateCheckpoint(new Vector3(16, 0, 0), $"CP_L{levelIndex}_1")
                    .transform.SetParent(interGo.transform);
            }

            if (levelIndex >= 1)
            {
                SceneSetupHelper.CreateDoor(new Vector3(22, 2, 0), $"door_L{levelIndex}_1")
                    .transform.SetParent(interGo.transform);
                SceneSetupHelper.CreateSwitch(new Vector3(18, 0.5f, 0), $"sw_L{levelIndex}_1", new[] { $"door_L{levelIndex}_1" })
                    .transform.SetParent(interGo.transform);
            }

            if (levelIndex >= 2)
            {
                SceneSetupHelper.CreateHazard(new Vector3(27, 0.5f, 0), new Vector2(4, 1))
                    .transform.SetParent(hazardsGo.transform);
            }

            SceneSetupHelper.CreateGoal(new Vector3(40f + levelIndex * 20f, 2f, 0))
                .transform.SetParent(parent);

            SceneSetupHelper.CreateCollectible(new Vector3(5, 4.5f, 0), $"g_L{levelIndex}_1")
                .transform.SetParent(collectGo.transform);
            SceneSetupHelper.CreateCollectible(new Vector3(11, 6.5f, 0), $"g_L{levelIndex}_2")
                .transform.SetParent(collectGo.transform);
            SceneSetupHelper.CreateCollectible(new Vector3(25, 3, 0), $"g_L{levelIndex}_3")
                .transform.SetParent(collectGo.transform);
        }
    }
}
