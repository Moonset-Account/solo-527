using UnityEngine;
using System.Collections.Generic;

namespace InkMountainBridge
{
    public class BridgeBuilder : MonoBehaviour
    {
        [SerializeField] private MaterialType currentMaterial;
        [SerializeField] private GameObject beamGhostPrefab;
        [SerializeField] private GameObject ropeGhostPrefab;
        [SerializeField] private GameObject pierGhostPrefab;
        [SerializeField] private float gridSnapSize = 0.5f;
        [SerializeField] private bool isPlacementValid;
        [SerializeField] private BridgeStructure bridgeStructure;
        [SerializeField] private LevelConfig levelConfig;
        [SerializeField] private Camera mainCamera;
        [SerializeField] private LayerMask placementLayerMask;

        private GameObject currentGhost;
        private Vector2 ghostStartPosition;
        private bool isDragging;
        private Dictionary<MaterialType, int> materialBudget = new Dictionary<MaterialType, int>();

        public MaterialType CurrentMaterial => currentMaterial;
        public bool IsPlacementValid => isPlacementValid;

        public void SetLevelConfig(LevelConfig config)
        {
            levelConfig = config;
            if (config != null && config.availableMaterials != null)
            {
                materialBudget[MaterialType.Beam] = config.availableMaterials.beamCount;
                materialBudget[MaterialType.Rope] = config.availableMaterials.ropeCount;
                materialBudget[MaterialType.StonePier] = config.availableMaterials.pierCount;
            }
        }

        private void Start()
        {
            mainCamera = Camera.main;
            if (bridgeStructure == null)
                bridgeStructure = FindObjectOfType<BridgeStructure>();
            if (levelConfig != null && levelConfig.availableMaterials != null)
            {
                materialBudget[MaterialType.Beam] = levelConfig.availableMaterials.beamCount;
                materialBudget[MaterialType.Rope] = levelConfig.availableMaterials.ropeCount;
                materialBudget[MaterialType.StonePier] = levelConfig.availableMaterials.pierCount;
            }
        }

        public void SelectMaterial(MaterialType type)
        {
            currentMaterial = type;
            DestroyCurrentGhost();

            GameObject prefab = GetGhostPrefab(type);
            if (prefab != null)
            {
                currentGhost = Instantiate(prefab);
                SetGhostAlpha(currentGhost, 0.5f);
            }
        }

        public BridgeElement PlaceElement(Vector2 start, Vector2 end)
        {
            if (!ValidatePlacement(start, end)) return null;
            if (!HasBudget(currentMaterial)) return null;

            Vector2 snappedStart = SnapToGrid(start);
            Vector2 snappedEnd = SnapToGrid(end);

            BridgeNode startNode = bridgeStructure.GetOrCreateNode(snappedStart, false);
            BridgeNode endNode = bridgeStructure.GetOrCreateNode(snappedEnd, false);

            if (startNode == null || endNode == null) return null;

            BridgeElement element = CreateElement(currentMaterial, startNode, endNode);
            if (element == null) return null;

            element.OnPlaced();
            bridgeStructure.AddElement(element);

            UseBudget(currentMaterial);

            GameEvents.RaiseMaterialUsed(currentMaterial, GetRemainingBudget(currentMaterial));

            GameEvents.RaiseInputRecorded(new InputRecord
            {
                timestamp = System.DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                action = "PlaceElement",
                position = snappedStart,
                materialType = currentMaterial,
                levelId = levelConfig != null ? levelConfig.levelId : 0
            });

            return element;
        }

        public void RemoveElement(BridgeElement element)
        {
            if (element == null) return;

            RefundBudget(element.ElementType);

            if (element.StartNode != null) element.StartNode.RemoveElement(element);
            if (element.EndNode != null) element.EndNode.RemoveElement(element);

            bridgeStructure.RemoveElement(element);

            GameEvents.RaiseInputRecorded(new InputRecord
            {
                timestamp = System.DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                action = "RemoveElement",
                position = element.transform.position,
                materialType = element.ElementType,
                levelId = levelConfig != null ? levelConfig.levelId : 0
            });

            Destroy(element.gameObject);
        }

        public bool ValidatePlacement(Vector2 start, Vector2 end)
        {
            Vector2 snappedStart = SnapToGrid(start);
            Vector2 snappedEnd = SnapToGrid(end);

            float distance = Vector2.Distance(snappedStart, snappedEnd);
            if (distance < gridSnapSize) return false;

            if (!HasBudget(currentMaterial)) return false;

            if (levelConfig != null)
            {
                if (snappedStart.x < -levelConfig.valleyWidth / 2f - 1f || snappedStart.x > levelConfig.valleyWidth / 2f + 1f)
                    return false;
                if (snappedEnd.x < -levelConfig.valleyWidth / 2f - 1f || snappedEnd.x > levelConfig.valleyWidth / 2f + 1f)
                    return false;
            }

            return true;
        }

        private void Update()
        {
            if (mainCamera == null) return;

            Vector2 mouseWorldPos = mainCamera.ScreenToWorldPoint(Input.mousePosition);
            Vector2 snappedPos = SnapToGrid(mouseWorldPos);

            if (currentGhost != null)
            {
                currentGhost.transform.position = snappedPos;
            }

            if (Input.GetMouseButtonDown(0))
            {
                isDragging = true;
                ghostStartPosition = snappedPos;
            }

            if (Input.GetMouseButtonUp(0) && isDragging)
            {
                isDragging = false;
                PlaceElement(ghostStartPosition, snappedPos);
            }

            if (Input.GetMouseButtonDown(1))
            {
                RaycastHit2D hit = Physics2D.Raycast(mouseWorldPos, Vector2.zero, Mathf.Infinity, placementLayerMask);
                if (hit.collider != null)
                {
                    BridgeElement element = hit.collider.GetComponent<BridgeElement>();
                    if (element != null) RemoveElement(element);
                }
            }

            isPlacementValid = ValidatePlacement(ghostStartPosition, snappedPos);
            if (currentGhost != null)
            {
                SetGhostColor(currentGhost, isPlacementValid);
            }
        }

        private Vector2 SnapToGrid(Vector2 position)
        {
            float x = Mathf.Round(position.x / gridSnapSize) * gridSnapSize;
            float y = Mathf.Round(position.y / gridSnapSize) * gridSnapSize;
            return new Vector2(x, y);
        }

        private GameObject GetGhostPrefab(MaterialType type)
        {
            switch (type)
            {
                case MaterialType.Beam: return beamGhostPrefab;
                case MaterialType.Rope: return ropeGhostPrefab;
                case MaterialType.StonePier: return pierGhostPrefab;
                default: return null;
            }
        }

        private BridgeElement CreateElement(MaterialType type, BridgeNode start, BridgeNode end)
        {
            GameObject elementObj = null;

            switch (type)
            {
                case MaterialType.Beam:
                    elementObj = new GameObject("Beam");
                    elementObj.AddComponent<SpriteRenderer>();
                    var beam = elementObj.AddComponent<BeamElement>();
                    beam.Initialize(start, end, GetConfigMaxStress(type), 1f);
                    beam.SetMaxStress(GetConfigMaxStress(type));
                    PositionElement(elementObj, start.Position, end.Position);
                    return beam;

                case MaterialType.Rope:
                    elementObj = new GameObject("Rope");
                    var rope = elementObj.AddComponent<RopeElement>();
                    rope.Initialize(start, end, GetConfigMaxStress(type), 0.5f);
                    PositionElement(elementObj, start.Position, end.Position);
                    return rope;

                case MaterialType.StonePier:
                    elementObj = new GameObject("StonePier");
                    elementObj.AddComponent<SpriteRenderer>();
                    var pier = elementObj.AddComponent<StonePierElement>();
                    pier.Initialize(start, end, GetConfigMaxStress(type), 3f);
                    pier.SetSinkThreshold(GetConfigMaxStress(type) * 1.5f);
                    PositionElement(elementObj, start.Position, end.Position);
                    return pier;

                default: return null;
            }
        }

        private void PositionElement(GameObject obj, Vector2 start, Vector2 end)
        {
            Vector2 mid = (start + end) / 2f;
            obj.transform.position = mid;
            Vector2 dir = end - start;
            float angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg;
            obj.transform.rotation = Quaternion.Euler(0f, 0f, angle);
        }

        private float GetConfigMaxStress(MaterialType type)
        {
            if (levelConfig == null) return 100f;

            switch (type)
            {
                case MaterialType.Beam: return 200f;
                case MaterialType.Rope: return 80f;
                case MaterialType.StonePier: return 500f;
                default: return 100f;
            }
        }

        private bool HasBudget(MaterialType type)
        {
            if (!materialBudget.ContainsKey(type)) return false;
            return materialBudget[type] > 0;
        }

        private void UseBudget(MaterialType type)
        {
            if (materialBudget.ContainsKey(type) && materialBudget[type] > 0)
            {
                materialBudget[type]--;
                if (materialBudget[type] <= 0)
                {
                    GameEvents.RaiseBudgetExceeded();
                }
            }
        }

        private void RefundBudget(MaterialType type)
        {
            if (materialBudget.ContainsKey(type))
            {
                materialBudget[type]++;
            }
        }

        private int GetRemainingBudget(MaterialType type)
        {
            if (materialBudget.ContainsKey(type)) return materialBudget[type];
            return 0;
        }

        private void DestroyCurrentGhost()
        {
            if (currentGhost != null)
            {
                Destroy(currentGhost);
                currentGhost = null;
            }
        }

        private void SetGhostAlpha(GameObject ghost, float alpha)
        {
            var renderer = ghost.GetComponent<SpriteRenderer>();
            if (renderer != null)
            {
                Color c = renderer.color;
                c.a = alpha;
                renderer.color = c;
            }
        }

        private void SetGhostColor(GameObject ghost, bool valid)
        {
            var renderer = ghost.GetComponent<SpriteRenderer>();
            if (renderer != null)
            {
                renderer.color = valid ? new Color(0f, 1f, 0f, 0.5f) : new Color(1f, 0f, 0f, 0.5f);
            }
        }
    }
}
