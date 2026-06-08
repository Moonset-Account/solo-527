using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace LightShadowPlatformer.Runtime
{
    public static class RuntimeFactory
    {
        // ================= SPRITE HELPERS =================
        public static Sprite MakeSolidSprite(Color c, int w = 4, int h = 4, float ppu = 16f)
        {
            Texture2D tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            Color[] px = new Color[w * h];
            for (int i = 0; i < px.Length; i++) px[i] = c;
            tex.SetPixels(px); tex.filterMode = FilterMode.Point;
            tex.wrapMode = TextureWrapMode.Clamp; tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), ppu);
        }

        public static Sprite MakeBoxSprite(Color fill, Color border, int outer, int bw = 3, float ppu = 16f)
        {
            Texture2D tex = new Texture2D(outer, outer, TextureFormat.RGBA32, false);
            for (int y = 0; y < outer; y++)
                for (int x = 0; x < outer; x++)
                {
                    bool b = x < bw || x >= outer - bw || y < bw || y >= outer - bw;
                    tex.SetPixel(x, y, b ? border : fill);
                }
            tex.filterMode = FilterMode.Point; tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, outer, outer), new Vector2(0.5f, 0.5f), ppu);
        }

        public static Sprite MakeCircleSprite(Color c, int size = 48)
        {
            Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            float r = size * 0.45f; Vector2 ctr = new Vector2(size * 0.5f, size * 0.5f);
            for (int y = 0; y < size; y++) for (int x = 0; x < size; x++)
                {
                    float d = Vector2.Distance(new Vector2(x + 0.5f, y + 0.5f), ctr);
                    tex.SetPixel(x, y, d <= r ? c : new Color(0, 0, 0, 0));
                }
            tex.filterMode = FilterMode.Point; tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), 16f);
        }

        public static T AddSpriteRenderer(GameObject go, Color c, string sortingLayer = "Default", int order = 0, bool sliced = false, Vector2? size = null)
        {
            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = MakeSolidSprite(c);
            if (sliced) { sr.drawMode = SpriteDrawMode.Sliced; if (size.HasValue) sr.size = size.Value; }
            if (!string.IsNullOrEmpty(sortingLayer)) sr.sortingLayerName = sortingLayer;
            sr.sortingOrder = order; return sr;
        }

        // ================= BACKGROUND =================
        public static GameObject CreateBackground(string name, Vector3 pos, Vector2 size, Color c, float scale = 1f)
        {
            GameObject go = new GameObject(name); go.transform.position = pos;
            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Background";
            sr.sortingOrder = -1000;
            sr.sprite = MakeSolidSprite(c, 4, 4, 1f);
            sr.drawMode = SpriteDrawMode.Sliced;
            sr.size = size;
            go.transform.localScale = Vector3.one * scale;
            return go;
        }

        public static GameObject CreateTitleArea(Vector3 pos)
        {
            GameObject root = new GameObject("TitleArea"); root.transform.position = pos;
            GameObject glow = new GameObject("Glow");
            glow.transform.SetParent(root.transform, false);
            var gsr = glow.AddComponent<SpriteRenderer>();
            gsr.sprite = MakeCircleSprite(new Color(0.3f, 0.5f, 1f, 0.3f), 256);
            gsr.sortingLayerName = "Background"; gsr.sortingOrder = 1;
            glow.transform.localScale = Vector3.one * 8f;
            return root;
        }

        // ================= PLAYER =================
        public static LightShadowPlatformer.Player.PlayerController CreatePlayer(Vector3 pos)
        {
            var existing = Object.FindObjectOfType<LightShadowPlatformer.Player.PlayerController>();
            if (existing != null) { existing.transform.position = pos; existing.SetSpawnPosition(pos); return existing; }

            GameObject go = new GameObject("Player");
            go.transform.position = pos; go.tag = "Player";
            int playerLayer = LayerMask.NameToLayer("Player");
            if (playerLayer >= 0) go.layer = playerLayer;

            Rigidbody2D rb = go.AddComponent<Rigidbody2D>();
            rb.gravityScale = 3f; rb.freezeRotation = true;
            rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            rb.interpolation = RigidbodyInterpolation2D.Interpolate;

            CapsuleCollider2D col = go.AddComponent<CapsuleCollider2D>();
            col.size = new Vector2(0.6f, 1.5f);

            GameObject spriteGO = new GameObject("Sprite");
            spriteGO.transform.SetParent(go.transform, false);
            SpriteRenderer sr = spriteGO.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Player"; sr.sortingOrder = 5;
            sr.color = new Color(0.35f, 0.7f, 1f);
            sr.sprite = MakeBoxSprite(new Color(0.35f, 0.7f, 1f), new Color(0.15f, 0.35f, 0.65f), 48, 4);
            sr.drawMode = SpriteDrawMode.Sliced; sr.size = new Vector2(0.9f, 1.7f);

            GameObject eyeL = new GameObject("EyeL");
            eyeL.transform.SetParent(spriteGO.transform, false);
            eyeL.transform.localPosition = new Vector3(-0.12f, 0.15f, -0.1f);
            SpriteRenderer esrL = eyeL.AddComponent<SpriteRenderer>();
            esrL.sprite = MakeSolidSprite(Color.white, 4, 4, 32f);
            esrL.sortingLayerName = "Player"; esrL.sortingOrder = 6;
            esrL.drawMode = SpriteDrawMode.Sliced; esrL.size = new Vector2(0.08f, 0.08f);
            GameObject pupilL = new GameObject("PupilL");
            pupilL.transform.SetParent(eyeL.transform, false);
            pupilL.transform.localPosition = new Vector3(0.01f, 0, 0);
            SpriteRenderer psrL = pupilL.AddComponent<SpriteRenderer>();
            psrL.sprite = MakeSolidSprite(Color.black, 3, 3, 32f);
            psrL.sortingLayerName = "Player"; psrL.sortingOrder = 7;
            psrL.drawMode = SpriteDrawMode.Sliced; psrL.size = new Vector2(0.04f, 0.04f);
            GameObject eyeR = Object.Instantiate(eyeL, spriteGO.transform);
            eyeR.name = "EyeR"; eyeR.transform.localPosition = new Vector3(0.12f, 0.15f, -0.1f);

            GameObject gc = new GameObject("GroundCheck");
            gc.transform.SetParent(go.transform, false);
            gc.transform.localPosition = new Vector3(0, -0.85f, 0);

            LightShadowPlatformer.Player.PlayerController pc = go.AddComponent<LightShadowPlatformer.Player.PlayerController>();
            pc.rb = rb; pc.bodyRenderer = sr; pc.groundCheck = gc.transform;
            pc.groundLayer = LayerMask.GetMask("Platform", "LightPlatform", "ShadowPlatform", "Default");
            pc.platformLayer = LayerMask.GetMask("LightPlatform", "ShadowPlatform");
            pc.SetSpawnPosition(pos);

            LightShadowPlatformer.Player.PlayerAnimator anim = spriteGO.AddComponent<LightShadowPlatformer.Player.PlayerAnimator>();
            anim.controller = pc; anim.bodyRenderer = sr;

            LightShadowPlatformer.Player.PlayerAudio paudio = go.AddComponent<LightShadowPlatformer.Player.PlayerAudio>();
            paudio.controller = pc;

            Animator animator = spriteGO.AddComponent<Animator>();
            anim.animator = animator;

            return pc;
        }

        // ================= PLATFORMS =================
        public static GameObject CreateGroundPlatform(Vector3 pos, Vector2 size)
        {
            GameObject go = new GameObject($"Platform_Ground");
            go.transform.position = pos;
            int pl = LayerMask.NameToLayer("Platform");
            if (pl >= 0) go.layer = pl;
            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Platforms";
            sr.sprite = MakeBoxSprite(new Color(0.45f, 0.38f, 0.3f), new Color(0.25f, 0.2f, 0.15f), 64, 4);
            sr.drawMode = SpriteDrawMode.Sliced; sr.size = size;
            BoxCollider2D bc = go.AddComponent<BoxCollider2D>(); bc.size = size;
            return go;
        }

        public static LightShadowPlatformer.Core.ShadowPlatform CreateShadowPlatform(Vector3 pos, Vector2 size,
            LightShadowPlatformer.Core.ShadowPlatform.PlatformType type, string id)
        {
            GameObject go = new GameObject($"ShadowPlatform_{id}");
            go.name = $"SP_{type}_{id}";
            go.transform.position = pos;
            int layer = type == LightShadowPlatformer.Core.ShadowPlatform.PlatformType.AlwaysActive ?
                LayerMask.NameToLayer("Platform") : LayerMask.NameToLayer("ShadowPlatform");
            if (layer >= 0) go.layer = layer;

            Color fill; Color border;
            switch (type)
            {
                case LightShadowPlatformer.Core.ShadowPlatform.PlatformType.LeftOnly:
                    fill = new Color(1f, 0.82f, 0.6f); border = new Color(0.7f, 0.45f, 0.2f); break;
                case LightShadowPlatformer.Core.ShadowPlatform.PlatformType.RightOnly:
                    fill = new Color(0.6f, 0.82f, 1f); border = new Color(0.3f, 0.5f, 0.8f); break;
                case LightShadowPlatformer.Core.ShadowPlatform.PlatformType.TopOnly:
                    fill = new Color(1f, 1f, 0.92f); border = new Color(0.8f, 0.75f, 0.35f); break;
                case LightShadowPlatformer.Core.ShadowPlatform.PlatformType.BottomOnly:
                    fill = new Color(0.85f, 0.75f, 1f); border = new Color(0.55f, 0.4f, 0.75f); break;
                case LightShadowPlatformer.Core.ShadowPlatform.PlatformType.HorizontalOnly:
                    fill = new Color(0.5f, 0.8f, 0.7f); border = new Color(0.2f, 0.55f, 0.55f); break;
                case LightShadowPlatformer.Core.ShadowPlatform.PlatformType.VerticalOnly:
                    fill = new Color(0.9f, 0.6f, 0.85f); border = new Color(0.6f, 0.3f, 0.6f); break;
                default:
                    fill = new Color(0.55f, 0.5f, 0.45f); border = new Color(0.3f, 0.25f, 0.2f); break;
            }

            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Platforms"; sr.sortingOrder = 5;
            sr.sprite = MakeBoxSprite(fill, border, 64, 3);
            sr.drawMode = SpriteDrawMode.Sliced; sr.size = size;
            sr.color = fill;

            BoxCollider2D bc2 = go.AddComponent<BoxCollider2D>(); bc2.size = size;

            LightShadowPlatformer.Core.ShadowPlatform sp = go.AddComponent<LightShadowPlatformer.Core.ShadowPlatform>();
            sp.platformType = type; sp.platformRenderer = sr; sp.platformCollider = bc2;
            sp.activeColor = fill; sp.inactiveColor = new Color(fill.r * 0.4f, fill.g * 0.4f, fill.b * 0.4f, 0.3f);
            return sp;
        }

        // ================= COLLECTIBLES =================
        public static LightShadowPlatformer.Collectible CreateCollectible(Vector3 pos, string id)
        {
            GameObject go = new GameObject($"Collectible_{id}");
            go.transform.position = pos;
            go.tag = "Collectible";
            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Foreground"; sr.sortingOrder = 8;
            sr.color = new Color(1f, 0.85f, 0.25f);
            sr.sprite = MakeCircleSprite(new Color(1f, 0.85f, 0.25f), 48);
            CircleCollider2D cc = go.AddComponent<CircleCollider2D>();
            cc.isTrigger = true; cc.radius = 0.45f;

            LightShadowPlatformer.Collectible c = go.AddComponent<LightShadowPlatformer.Collectible>();
            c.collectibleId = id; c.itemRenderer = sr;
            c.type = LightShadowPlatformer.Collectible.CollectibleType.Gem;
            return c;
        }

        // ================= CHECKPOINTS =================
        public static LightShadowPlatformer.Checkpoint CreateCheckpoint(Vector3 pos, string id)
        {
            GameObject go = new GameObject($"Checkpoint_{id}");
            go.transform.position = pos; go.tag = "Checkpoint";

            GameObject pole = new GameObject("Pole"); pole.transform.SetParent(go.transform, false);
            pole.transform.localPosition = new Vector3(0, 0, 0);
            SpriteRenderer psr = pole.AddComponent<SpriteRenderer>();
            psr.sortingLayerName = "Foreground"; psr.sortingOrder = 9;
            psr.sprite = MakeBoxSprite(new Color(0.5f, 0.4f, 0.3f), new Color(0.3f, 0.25f, 0.2f), 12, 192, 2);
            psr.drawMode = SpriteDrawMode.Sliced; psr.size = new Vector2(0.2f, 3.2f);
            pole.transform.localPosition = new Vector3(0, 1.6f, 0);

            GameObject flag = new GameObject("Flag");
            flag.transform.SetParent(pole.transform, false);
            flag.transform.localPosition = new Vector3(0.4f, 0.8f, 0);
            SpriteRenderer fsr = flag.AddComponent<SpriteRenderer>();
            fsr.sortingLayerName = "Foreground"; fsr.sortingOrder = 10;
            fsr.color = new Color(0.4f, 0.95f, 0.4f);
            fsr.sprite = MakeBoxSprite(new Color(0.4f, 0.95f, 0.4f), new Color(0.2f, 0.6f, 0.3f), 64, 96, 4);
            fsr.drawMode = SpriteDrawMode.Sliced; fsr.size = new Vector2(1.4f, 2.1f);

            BoxCollider2D bc = go.AddComponent<BoxCollider2D>();
            bc.isTrigger = true; bc.size = new Vector2(1.8f, 3.5f); bc.offset = new Vector2(0, 1.75f);

            LightShadowPlatformer.Checkpoint cp = go.AddComponent<LightShadowPlatformer.Checkpoint>();
            cp.checkpointId = id; cp.flagRenderer = fsr; cp.poleRenderer = psr;

            GameObject respawn = new GameObject("Respawn");
            respawn.transform.SetParent(go.transform, false);
            respawn.transform.localPosition = new Vector3(0, 0.6f, 0);
            cp.respawnPoint = respawn.transform;
            return cp;
        }

        // ================= TUTORIAL =================
        public static LightShadowPlatformer.TutorialTrigger CreateTutorialTrigger(Vector3 pos, Vector2 size, string id, string message, float duration)
        {
            GameObject go = new GameObject($"Tutorial_{id}");
            go.transform.position = pos;
            BoxCollider2D bc = go.AddComponent<BoxCollider2D>();
            bc.isTrigger = true; bc.size = size;
            LightShadowPlatformer.TutorialTrigger tt = go.AddComponent<LightShadowPlatformer.TutorialTrigger>();
            tt.tutorialId = id; tt.message = message;
            tt.triggerType = LightShadowPlatformer.TutorialTrigger.TriggerType.OnEnter;
            tt.dismissType = LightShadowPlatformer.TutorialTrigger.DismissType.Auto;
            tt.displayDuration = duration;
            return tt;
        }

        // ================= HAZARDS =================
        public static LightShadowPlatformer.Hazard.HazardBase CreateHazard(Vector3 pos, Vector2 size)
        {
            GameObject go = new GameObject("Hazard_Spikes");
            go.transform.position = pos; go.tag = "Hazard";
            int hl = LayerMask.NameToLayer("Hazard");
            if (hl >= 0) go.layer = hl;
            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Foreground"; sr.sortingOrder = 7;
            sr.color = new Color(0.9f, 0.2f, 0.25f);
            sr.sprite = MakeSolidSprite(new Color(0.9f, 0.2f, 0.25f), 64, 64, 16f);
            sr.drawMode = SpriteDrawMode.Sliced; sr.size = size;
            BoxCollider2D bc = go.AddComponent<BoxCollider2D>();
            bc.isTrigger = true; bc.size = size * 0.8f; bc.offset = new Vector2(0, size.y * 0.3f);
            LightShadowPlatformer.Hazard.HazardBase hb = go.AddComponent<LightShadowPlatformer.Hazard.HazardBase>();
            hb.hazardRenderer = sr; hb.hazardCollider = bc;
            hb.hazardType = LightShadowPlatformer.Hazard.HazardType.Spikes;
            hb.damageLayers = LayerMask.GetMask("Player");
            return hb;
        }

        // ========== GOAL ===========
        public static LightShadowPlatformer.LevelGoal CreateGoal(Vector3 pos)
        {
            GameObject go = new GameObject("Goal");
            go.transform.position = pos; go.tag = "Goal";
            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Foreground"; sr.sortingOrder = 12;
            sr.color = new Color(0.3f, 0.7f, 1f, 0.85f);
            sr.sprite = MakeCircleSprite(new Color(0.3f, 0.7f, 1f, 0.85f), 128);
            go.transform.localScale = Vector3.one * 1.8f;
            CircleCollider2D cc = go.AddComponent<CircleCollider2D>();
            cc.isTrigger = true; cc.radius = 0.9f;
            LightShadowPlatformer.LevelGoal lg = go.AddComponent<LightShadowPlatformer.LevelGoal>();
            lg.portalRenderer = sr;
            return lg;
        }

        // ================= INTERACTABLES: SWITCH / DOOR / PLATE =================
        public static LightShadowPlatformer.InteractableSwitch CreateSwitch(Vector3 pos, string id, string[] doors)
        {
            GameObject go = new GameObject($"Switch_{id}");
            go.transform.position = pos; go.tag = "Switch";
            int il = LayerMask.NameToLayer("Interactive");
            if (il >= 0) go.layer = il;

            GameObject button = new GameObject("Button");
            button.transform.SetParent(go.transform, false);
            SpriteRenderer bsr = button.AddComponent<SpriteRenderer>();
            bsr.sortingLayerName = "Foreground"; bsr.sortingOrder = 10;
            bsr.color = new Color(0.9f, 0.35f, 0.35f);
            bsr.sprite = MakeCircleSprite(new Color(0.9f, 0.35f, 0.35f), 32);
            button.transform.localPosition = new Vector3(0, 0.2f, 0);

            GameObject baseGO = new GameObject("Base");
            baseGO.transform.SetParent(go.transform, false);
            baseGO.transform.localPosition = new Vector3(0, -0.15f, 0);
            SpriteRenderer basr = baseGO.AddComponent<SpriteRenderer>();
            basr.sortingLayerName = "Foreground"; basr.sortingOrder = 9;
            basr.sprite = MakeBoxSprite(new Color(0.45f, 0.45f, 0.5f), new Color(0.25f, 0.25f, 0.3f), 48, 24, 3);
            basr.drawMode = SpriteDrawMode.Sliced; basr.size = new Vector2(0.9f, 0.5f);

            BoxCollider2D bc = go.AddComponent<BoxCollider2D>();
            bc.isTrigger = true; bc.size = new Vector2(1.5f, 2f); bc.offset = new Vector2(0, 0.8f);

            LightShadowPlatformer.InteractableSwitch sw = go.AddComponent<LightShadowPlatformer.InteractableSwitch>();
            sw.switchId = id; sw.switchType = LightShadowPlatformer.InteractableSwitch.SwitchType.Toggle;
            sw.linkedDoorIds = doors; sw.switchRenderer = bsr; sw.indicatorRenderer = bsr;
            return sw;
        }

        public static LightShadowPlatformer.DoorController CreateDoor(Vector3 pos, string id, bool open)
        {
            GameObject go = new GameObject($"Door_{id}");
            go.transform.position = pos; go.tag = "Door";
            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Foreground"; sr.sortingOrder = 6;
            sr.color = new Color(0.65f, 0.45f, 0.25f);
            sr.sprite = MakeBoxSprite(new Color(0.65f, 0.45f, 0.25f), new Color(0.4f, 0.25f, 0.1f), 48, 96, 4);
            sr.drawMode = SpriteDrawMode.Sliced; sr.size = new Vector2(1.4f, 3.1f);
            BoxCollider2D bc = go.AddComponent<BoxCollider2D>();
            bc.size = new Vector2(1.3f, 3f); bc.offset = new Vector2(0, 1.5f);
            LightShadowPlatformer.DoorController dc = go.AddComponent<LightShadowPlatformer.DoorController>();
            dc.doorId = id; dc.startsOpen = open; dc.doorRenderer = sr; dc.doorCollider = bc;
            dc.doorType = LightShadowPlatformer.DoorController.DoorType.VerticalSlide;
            dc.moveDistance = 3.3f;
            // move up by default
            return dc;
        }

        public static LightShadowPlatformer.PressurePlate CreatePressurePlate(Vector3 pos, string id, string[] linkedDoorIds)
        {
            GameObject go = new GameObject($"Plate_{id}");
            go.transform.position = pos;
            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Foreground"; sr.sortingOrder = 8;
            sr.sprite = MakeBoxSprite(new Color(0.6f, 0.6f, 0.65f), new Color(0.35f, 0.35f, 0.4f), 96, 32, 3);
            sr.drawMode = SpriteDrawMode.Sliced; sr.size = new Vector2(2.2f, 0.5f);
            BoxCollider2D bc = go.AddComponent<BoxCollider2D>();
            bc.isTrigger = true; bc.size = new Vector2(2f, 0.8f); bc.offset = new Vector2(0, 0.2f);
            LightShadowPlatformer.PressurePlate pp = go.AddComponent<LightShadowPlatformer.PressurePlate>();
            pp.plateId = id; pp.plateRenderer = sr; pp.linkedDoorIds = linkedDoorIds;
            return pp;
        }
    }
}
