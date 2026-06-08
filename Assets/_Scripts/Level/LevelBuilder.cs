using UnityEngine;

namespace LightShadowPlatformer.Level
{
    public class LevelBuilder : MonoBehaviour
    {
        [Header("Level Info")]
        public string levelName = "Level 1";
        public int levelIndex = 0;
        [TextArea] public string levelDescription;

        [Header("Spawn")]
        public Transform playerSpawnPoint;
        public GameObject playerPrefab;

        [Header("Bounds")]
        public Vector2 cameraMinBounds;
        public Vector2 cameraMaxBounds;
        public float cameraStartZoom = 7.5f;

        [Header("Kill Zone")]
        public float killY = -10f;

        [Header("Required Tutorials")]
        public string[] tutorialIdsToShow;

        private void Start()
        {
            BuildLevel();
        }

        private void Update()
        {
            CheckKillZone();
        }

        public void BuildLevel()
        {
            SpawnPlayer();
            SetupCamera();

            if (LightShadowPlatformer.Core.SaveManager.Instance != null &&
                !string.IsNullOrEmpty(LightShadowPlatformer.Core.SaveManager.Instance.GetActiveCheckpointId()))
            {
                string cpId = LightShadowPlatformer.Core.SaveManager.Instance.GetActiveCheckpointId();
                Checkpoint[] cps = FindObjectsOfType<Checkpoint>();
                foreach (var cp in cps)
                {
                    if (cp.checkpointId == cpId && playerSpawnPoint != null)
                    {
                        playerSpawnPoint.position = cp.GetRespawnPosition();
                    }
                }
            }

            if (levelIndex == 0)
            {
                AddTutorialsToLevel();
            }
        }

        private void SpawnPlayer()
        {
            Player.PlayerController existing = FindObjectOfType<Player.PlayerController>();
            if (existing != null)
            {
                if (playerSpawnPoint != null)
                {
                    existing.transform.position = playerSpawnPoint.position;
                    existing.SetSpawnPosition(playerSpawnPoint.position);
                }
                return;
            }

            if (playerPrefab != null && playerSpawnPoint != null)
            {
                Instantiate(playerPrefab, playerSpawnPoint.position, Quaternion.identity);
            }
            else if (playerSpawnPoint != null)
            {
                CreatePlayerPlaceholder(playerSpawnPoint.position);
            }
        }

        private void CreatePlayerPlaceholder(Vector3 pos)
        {
            GameObject go = new GameObject("Player");
            go.tag = "Player";
            go.layer = LayerMask.NameToLayer("Player");
            go.transform.position = pos;

            go.AddComponent<Rigidbody2D>().gravityScale = 3f;
            Rigidbody2D rb = go.GetComponent<Rigidbody2D>();
            rb.freezeRotation = true;
            rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;

            CapsuleCollider2D col = go.AddComponent<CapsuleCollider2D>();
            col.size = new Vector2(0.6f, 1.5f);

            GameObject sprite = new GameObject("Sprite");
            sprite.transform.SetParent(go.transform, false);
            SpriteRenderer sr = sprite.AddComponent<SpriteRenderer>();
            sr.sortingLayerName = "Player";
            sr.sortingOrder = 5;
            sr.color = new Color(0.3f, 0.6f, 1f);

            GameObject gc = new GameObject("GroundCheck");
            gc.transform.SetParent(go.transform, false);
            gc.transform.localPosition = new Vector3(0, -0.8f, 0);

            Player.PlayerController pc = go.AddComponent<Player.PlayerController>();
            pc.groundCheck = gc.transform;
            pc.groundLayer = LayerMask.GetMask("Platform", "LightPlatform", "ShadowPlatform");
            pc.platformLayer = LayerMask.GetMask("LightPlatform", "ShadowPlatform");

            Player.PlayerAnimator pa = sprite.AddComponent<Player.PlayerAnimator>();
            pa.controller = pc;
            pa.bodyRenderer = sr;

            Player.PlayerAudio pa2 = go.AddComponent<Player.PlayerAudio>();
            pa2.controller = pc;

            pc.rb = rb;
            pc.bodyRenderer = sr;
            pc.SetSpawnPosition(pos);
        }

        private void SetupCamera()
        {
            Camera.CameraController cam = FindObjectOfType<Camera.CameraController>();
            if (cam == null)
            {
                UnityEngine.Camera existing = FindObjectOfType<UnityEngine.Camera>();
                if (existing != null)
                {
                    cam = existing.gameObject.AddComponent<Camera.CameraController>();
                }
            }
            if (cam != null)
            {
                cam.useBounds = cameraMinBounds != cameraMaxBounds;
                cam.minBounds = cameraMinBounds;
                cam.maxBounds = cameraMaxBounds;
                cam.SetZoom(cameraStartZoom, true);

                Player.PlayerController player = FindObjectOfType<Player.PlayerController>();
                if (player != null) cam.SetTarget(player.transform);
            }
        }

        private void CheckKillZone()
        {
            Player.PlayerController player = FindObjectOfType<Player.PlayerController>();
            if (player == null) return;
            if (player.transform.position.y < killY)
            {
                player.Die();
            }
        }

        private void AddTutorialsToLevel()
        {
            if (tutorialIdsToShow == null || tutorialIdsToShow.Length == 0) return;
            foreach (string id in tutorialIdsToShow)
            {
                if (id == "movement")
                {
                    EnsureTutorialExists(id, "教学: 移动\n使用 A / D 或 ← → 键左右移动",
                        new Vector3(-2f, 1f, 0));
                }
                else if (id == "jump")
                {
                    EnsureTutorialExists(id, "教学: 跳跃\n使用 空格键 跳跃\n跳起后松开可以提前下落",
                        new Vector3(5f, 1f, 0));
                }
                else if (id == "light")
                {
                    EnsureTutorialExists(id, "教学: 切换光源\n使用 E 键切换光线方向\n影子平台会根据光线出现或消失",
                        new Vector3(12f, 2f, 0));
                }
                else if (id == "checkpoint")
                {
                    EnsureTutorialExists(id, "教学: 存档点\n走过旗帜激活存档\n死亡后从最近的存档点复活",
                        new Vector3(20f, 1f, 0));
                }
            }
        }

        private void EnsureTutorialExists(string id, string msg, Vector3 position)
        {
            TutorialTrigger[] existing = FindObjectsOfType<TutorialTrigger>();
            foreach (var t in existing) if (t.tutorialId == id) return;

            GameObject go = new GameObject($"Tutorial_{id}");
            go.transform.position = position;
            BoxCollider2D col = go.AddComponent<BoxCollider2D>();
            col.isTrigger = true;
            col.size = new Vector2(3f, 3f);

            TutorialTrigger tt = go.AddComponent<TutorialTrigger>();
            tt.tutorialId = id;
            tt.message = msg;
        }

        private void OnDrawGizmosSelected()
        {
            if (cameraMinBounds != cameraMaxBounds)
            {
                Gizmos.color = Color.cyan;
                Vector3 size = new Vector3(cameraMaxBounds.x - cameraMinBounds.x, cameraMaxBounds.y - cameraMinBounds.y, 1f);
                Vector3 center = new Vector3((cameraMinBounds.x + cameraMaxBounds.x) * 0.5f, (cameraMinBounds.y + cameraMaxBounds.y) * 0.5f, 0f);
                Gizmos.DrawWireCube(center, size);
            }

            Gizmos.color = Color.red;
            Gizmos.DrawLine(new Vector3(-1000f, killY, 0), new Vector3(1000f, killY, 0));
        }
    }
}
