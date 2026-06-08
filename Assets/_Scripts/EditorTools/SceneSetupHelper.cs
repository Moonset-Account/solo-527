using UnityEngine;

namespace LightShadowPlatformer.EditorTools
{
    public class SceneSetupHelper : MonoBehaviour
    {
        [Header("Level Setup")]
        public int levelIndex = 0;
        public string levelName = "MainMenu";
        public LevelPreset preset = LevelPreset.MainMenu;

        public enum LevelPreset
        {
            MainMenu,
            Level01_Tutorial,
            Level02_Combination,
            Level03_Final
        }

        public void CreateSceneHierarchy()
        {
            GameObject root = new GameObject($"[Level_{levelIndex}]");

            GameObject managers = CreateChild(root, "_Managers");
            GameObject environment = CreateChild(root, "Environment");
            GameObject platforms = CreateChild(environment, "Platforms");
            GameObject hazards = CreateChild(environment, "Hazards");
            GameObject interactables = CreateChild(root, "Interactables");
            GameObject collectibles = CreateChild(root, "Collectibles");
            GameObject player = CreateChild(root, "Player");
            GameObject cameras = CreateChild(root, "_Cameras");
            GameObject lighting = CreateChild(root, "_Lighting");
            GameObject ui = CreateChild(root, "_UI");

            SetupLevelBuilder(root, levelIndex);
        }

        private GameObject CreateChild(GameObject parent, string name)
        {
            GameObject go = new GameObject(name);
            if (parent != null) go.transform.SetParent(parent.transform, false);
            return go;
        }

        private void SetupLevelBuilder(GameObject root, int idx)
        {
            Level.LevelBuilder lb = root.AddComponent<Level.LevelBuilder>();
            lb.levelIndex = idx;
            lb.killY = -15f;
            lb.cameraMinBounds = new Vector2(-20f, -5f);
            lb.cameraMaxBounds = new Vector2(idx * 50 + 50, 20f);
            lb.cameraStartZoom = 7.5f;

            GameObject spawn = new GameObject("PlayerSpawn");
            spawn.transform.SetParent(root.transform, false);
            spawn.transform.position = new Vector3(-5f, 1f, 0);
            lb.playerSpawnPoint = spawn.transform;

            if (idx == 0)
            {
                lb.tutorialIdsToShow = new[] { "movement", "jump", "light", "checkpoint" };
            }
        }

        public static GameObject CreatePlaceholderPlatform(Vector3 position, Vector2 size,
            Core.ShadowPlatform.PlatformType type, string name = "Platform")
        {
            GameObject go = new GameObject(name);
            go.transform.position = position;
            go.layer = type == Core.ShadowPlatform.PlatformType.AlwaysActive ?
                LayerMask.NameToLayer("Platform") : LayerMask.NameToLayer("ShadowPlatform");

            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Platforms";
            sr.sprite = PlaceholderSprites.SolidPlatform();
            sr.drawMode = SpriteDrawMode.Sliced;
            sr.size = size;

            BoxCollider2D bc = go.AddComponent<BoxCollider2D>();
            bc.size = size;

            Core.ShadowPlatform sp = go.AddComponent<Core.ShadowPlatform>();
            sp.platformType = type;
            sp.platformRenderer = sr;
            sp.platformCollider = bc;

            return go;
        }

        public static GameObject CreateCheckpoint(Vector3 position, string id)
        {
            GameObject go = new GameObject($"Checkpoint_{id}");
            go.transform.position = position;
            go.tag = "Checkpoint";

            GameObject pole = new GameObject("Pole");
            pole.transform.SetParent(go.transform, false);
            SpriteRenderer poleSr = pole.AddComponent<SpriteRenderer>();
            poleSr.sortingLayerName = "Foreground";
            poleSr.sprite = PlaceholderResourceGenerator.CreateSolidTexture(8, 192, new Color(0.5f, 0.4f, 0.3f)).CreateSprite(new Rect(0,0,8,192), new Vector2(0.5f, 0), 16f);

            GameObject flag = new GameObject("Flag");
            flag.transform.SetParent(pole.transform, false);
            flag.transform.localPosition = new Vector3(0.5f, 10f, 0);
            SpriteRenderer flagSr = flag.AddComponent<SpriteRenderer>();
            flagSr.sortingLayerName = "Foreground";
            flagSr.sprite = PlaceholderSprites.Flag();

            BoxCollider2D bc = go.AddComponent<BoxCollider2D>();
            bc.isTrigger = true;
            bc.size = new Vector2(2f, 3f);
            bc.offset = new Vector2(0, 1.5f);

            Checkpoint cp = go.AddComponent<Checkpoint>();
            cp.checkpointId = id;
            cp.flagRenderer = flagSr;
            cp.poleRenderer = poleSr;

            GameObject respawn = new GameObject("Respawn");
            respawn.transform.SetParent(go.transform, false);
            respawn.transform.localPosition = new Vector3(0, 0.5f, 0);
            cp.respawnPoint = respawn.transform;

            return go;
        }

        public static GameObject CreateGoal(Vector3 position)
        {
            GameObject go = new GameObject("Goal");
            go.transform.position = position;
            go.tag = "Goal";

            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Foreground";
            sr.sprite = PlaceholderSprites.Portal();
            sr.color = new Color(0.3f, 0.7f, 1f, 0.8f);

            CircleCollider2D cc = go.AddComponent<CircleCollider2D>();
            cc.isTrigger = true;
            cc.radius = 1.2f;

            LevelGoal lg = go.AddComponent<LevelGoal>();
            lg.portalRenderer = sr;
            lg.levelIndex = 0;

            return go;
        }

        public static GameObject CreateHazard(Vector3 position, Vector2 size)
        {
            GameObject go = new GameObject("Hazard_Spikes");
            go.transform.position = position;
            go.tag = "Hazard";
            go.layer = LayerMask.NameToLayer("Hazard");

            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Foreground";
            sr.sprite = PlaceholderSprites.Spike();
            sr.drawMode = SpriteDrawMode.Sliced;
            sr.size = size;
            sr.color = new Color(0.85f, 0.2f, 0.2f);

            BoxCollider2D bc = go.AddComponent<BoxCollider2D>();
            bc.isTrigger = true;
            bc.size = size * 0.8f;
            bc.offset = new Vector2(0, size.y * 0.3f);

            Hazard.HazardBase hb = go.AddComponent<Hazard.HazardBase>();
            hb.hazardRenderer = sr;
            hb.hazardCollider = bc;

            return go;
        }

        public static GameObject CreateSwitch(Vector3 position, string id, string[] linkedDoorIds)
        {
            GameObject go = new GameObject($"Switch_{id}");
            go.transform.position = position;
            go.tag = "Switch";
            go.layer = LayerMask.NameToLayer("Interactive");

            GameObject btn = new GameObject("Button");
            btn.transform.SetParent(go.transform, false);
            SpriteRenderer sr = btn.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Foreground";
            sr.sprite = PlaceholderSprites.SwitchButton();
            sr.color = new Color(0.9f, 0.3f, 0.3f);

            GameObject baseGo = new GameObject("Base");
            baseGo.transform.SetParent(go.transform, false);
            baseGo.transform.localPosition = new Vector3(0, -0.3f, 0);
            SpriteRenderer baseSr = baseGo.AddComponent<SpriteRenderer>();
            baseSr.sortingLayerName = "Foreground";
            baseSr.sprite = PlaceholderResourceGenerator.CreateBoxSprite(new Color(0.4f,0.4f,0.4f), new Color(0.2f,0.2f,0.2f), 48, 16, 3, 16f);

            BoxCollider2D bc = go.AddComponent<BoxCollider2D>();
            bc.isTrigger = true;
            bc.size = new Vector2(1.5f, 2f);

            InteractableSwitch sw = go.AddComponent<InteractableSwitch>();
            sw.switchId = id;
            sw.linkedDoorIds = linkedDoorIds;
            sw.switchRenderer = sr;
            sw.indicatorRenderer = sr;

            return go;
        }

        public static GameObject CreateDoor(Vector3 position, string id, bool open = false)
        {
            GameObject go = new GameObject($"Door_{id}");
            go.transform.position = position;
            go.tag = "Door";

            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Foreground";
            sr.sprite = PlaceholderSprites.Door();
            sr.color = new Color(0.6f, 0.4f, 0.25f);

            BoxCollider2D bc = go.AddComponent<BoxCollider2D>();
            bc.size = new Vector2(1.5f, 3f);

            DoorController dc = go.AddComponent<DoorController>();
            dc.doorId = id;
            dc.startsOpen = open;
            dc.doorRenderer = sr;
            dc.doorCollider = bc;
            dc.doorType = DoorController.DoorType.VerticalSlide;
            dc.moveDistance = 3.2f;

            return go;
        }

        public static GameObject CreateCollectible(Vector3 position, string id)
        {
            GameObject go = new GameObject($"Gem_{id}");
            go.transform.position = position;
            go.tag = "Collectible";

            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Foreground";
            sr.sprite = PlaceholderSprites.CollectibleGem();
            sr.color = new Color(1f, 0.85f, 0.2f);

            CircleCollider2D cc = go.AddComponent<CircleCollider2D>();
            cc.isTrigger = true;
            cc.radius = 0.4f;

            Collectible col = go.AddComponent<Collectible>();
            col.collectibleId = id;
            col.itemRenderer = sr;
            col.type = Collectible.CollectibleType.Gem;

            return go;
        }
    }
}
