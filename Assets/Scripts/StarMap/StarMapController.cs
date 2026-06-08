using System;
using System.Collections.Generic;
using UnityEngine;
using SpaceCourier.Core;
using SpaceCourier.Data;
using SpaceCourier.DataModule;
using SpaceCourier.Gameplay;
using SpaceCourier.InputSystem;

namespace SpaceCourier.StarMap
{
    public class StarMapController : MonoBehaviour
    {
        [Header("References")]
        public Transform nodesContainer;
        public Transform connectionsContainer;
        public Transform shipTransform;
        public LineRenderer routeLineRenderer;

        [Header("Prefabs")]
        public GameObject starNodePrefab;
        public GameObject connectionPrefab;

        [Header("Settings")]
        public float nodeScale = 1f;
        public float routePreviewSpeed = 0.5f;
        public Color defaultRouteColor = Color.cyan;
        public Color warningRouteColor = Color.yellow;
        public Color errorRouteColor = Color.red;

        private DataManager dataManager;
        private InputManager inputManager;
        private GameplayController gameplayController;
        private FuelManager fuelManager;

        private Dictionary<int, StarNodeView> nodeViews = new Dictionary<int, StarNodeView>();
        private Dictionary<string, GameObject> connectionViews = new Dictionary<string, GameObject>();

        private int selectedNodeId = -1;
        private int hoveredNodeId = -1;
        private List<int> previewRoute = new List<int>();
        private int previewRouteFuelCost = 0;

        public bool IsInitialized { get; private set; } = false;

        public event Action<int> OnNodeSelected;
        public event Action<int> OnNodeHovered;
        public event Action<int, int, string> OnRoutePlanned;
        public event Action<string, bool> OnFeedbackMessage;

        public void Initialize()
        {
            dataManager = GameManager.Instance?.GetModule<DataManager>(ModuleType.DataManager);
            inputManager = GameManager.Instance?.GetModule<InputManager>(ModuleType.InputManager);
            fuelManager = GameManager.Instance?.GetModule<FuelManager>(ModuleType.FuelManager);

            if (inputManager != null)
            {
                inputManager.OnPointerClicked += HandlePointerClicked;
                inputManager.OnDragging += HandleDragging;
                inputManager.OnDragEnd += HandleDragEnd;
                inputManager.OnScroll += HandleScroll;
                inputManager.OnKeyPressed += HandleKeyPressed;
            }

            ClearMap();
            IsInitialized = true;
            Debug.Log("[StarMapController] Initialized.");
        }

        public void SetGameplayController(GameplayController controller)
        {
            gameplayController = controller;
        }

        public void BuildStarMap()
        {
            if (dataManager?.CurrentLevel == null)
            {
                Debug.LogWarning("[StarMapController] No level loaded, cannot build map.");
                return;
            }

            ClearMap();
            CreateNodeViews();
            CreateConnectionViews();
            UpdateShipPosition(dataManager.RuntimeData.Ship.CurrentNodeId);
            HighlightAvailableNodes();
            IsInitialized = true;
        }

        private void ClearMap()
        {
            foreach (var node in nodeViews.Values)
            {
                if (node != null && node.gameObject != null)
                {
                    Destroy(node.gameObject);
                }
            }
            nodeViews.Clear();

            foreach (var conn in connectionViews.Values)
            {
                if (conn != null) Destroy(conn);
            }
            connectionViews.Clear();

            if (routeLineRenderer != null)
            {
                routeLineRenderer.positionCount = 0;
            }

            selectedNodeId = -1;
            hoveredNodeId = -1;
            previewRoute.Clear();
            previewRouteFuelCost = 0;
        }

        private void CreateNodeViews()
        {
            if (dataManager?.CurrentLevel?.StarNodes == null) return;

            foreach (var nodeData in dataManager.CurrentLevel.StarNodes)
            {
                if (nodeData == null) continue;

                var nodeObj = Instantiate(starNodePrefab, nodesContainer);
                var nodeView = nodeObj.GetComponent<StarNodeView>();
                if (nodeView == null)
                {
                    nodeView = nodeObj.AddComponent<StarNodeView>();
                }

                var localPos = new Vector3(nodeData.Position.x, nodeData.Position.y, 0);
                nodeView.Initialize(nodeData, localPos, nodeScale);
                nodeViews[nodeData.NodeId] = nodeView;

                nodeView.OnHovered += HandleNodeHovered;
                nodeView.OnClicked += HandleNodeClicked;
            }
        }

        private void CreateConnectionViews()
        {
            if (dataManager?.CurrentLevel?.StarNodes == null) return;

            foreach (var nodeData in dataManager.CurrentLevel.StarNodes)
            {
                if (nodeData == null) continue;

                foreach (var connectedId in nodeData.ConnectedNodeIds)
                {
                    string key = GetConnectionKey(nodeData.NodeId, connectedId);
                    string reverseKey = GetConnectionKey(connectedId, nodeData.NodeId);

                    if (connectionViews.ContainsKey(key) || connectionViews.ContainsKey(reverseKey))
                        continue;

                    var fromNode = dataManager.GetNode(nodeData.NodeId);
                    var toNode = dataManager.GetNode(connectedId);
                    if (fromNode == null || toNode == null) continue;

                    var connectionObj = Instantiate(connectionPrefab, connectionsContainer);
                    var line = connectionObj.GetComponent<LineRenderer>();
                    if (line == null)
                    {
                        line = connectionObj.AddComponent<LineRenderer>();
                        ConfigureConnectionLine(line);
                    }

                    line.positionCount = 2;
                    line.SetPosition(0, new Vector3(fromNode.Position.x, fromNode.Position.y, 0.5f));
                    line.SetPosition(1, new Vector3(toNode.Position.x, toNode.Position.y, 0.5f));

                    int cost = dataManager.CalculateFuelCost(nodeData.NodeId, connectedId);
                    var textMesh = connectionObj.GetComponentInChildren<TMPro.TextMeshPro>();
                    if (textMesh != null)
                    {
                        var midPoint = (fromNode.Position + toNode.Position) / 2f;
                        textMesh.transform.localPosition = new Vector3(midPoint.x, midPoint.y, 0.1f);
                        textMesh.text = $"⛽{cost}";
                    }

                    connectionViews[key] = connectionObj;
                }
            }
        }

        private void ConfigureConnectionLine(LineRenderer line)
        {
            line.useWorldSpace = false;
            line.startWidth = 0.15f;
            line.endWidth = 0.15f;
            line.material = new Material(Shader.Find("Sprites/Default"));
            line.startColor = new Color(0.3f, 0.3f, 0.4f, 0.6f);
            line.endColor = new Color(0.3f, 0.3f, 0.4f, 0.6f);
            line.sortingOrder = 1;
        }

        private string GetConnectionKey(int from, int to) => $"{from}-{to}";

        private void HighlightAvailableNodes()
        {
            if (dataManager?.RuntimeData == null) return;
            var currentNodeId = dataManager.RuntimeData.Ship.CurrentNodeId;
            var connected = dataManager.GetConnectedNodes(currentNodeId);
            var connectedIds = new HashSet<int>(connected.ConvertAll(n => n.NodeId));

            foreach (var kvp in nodeViews)
            {
                bool isCurrent = kvp.Key == currentNodeId;
                bool isConnected = connectedIds.Contains(kvp.Key);
                kvp.Value.SetAvailability(isCurrent, isConnected);
            }
        }

        public void UpdateShipPosition(int nodeId)
        {
            if (shipTransform == null || !nodeViews.TryGetValue(nodeId, out var nodeView)) return;
            shipTransform.localPosition = new Vector3(
                nodeView.LocalPosition.x,
                nodeView.LocalPosition.y,
                -1f);
        }

        public void AnimateShipMovement(List<int> path, Action onComplete = null)
        {
            if (path == null || path.Count < 2 || shipTransform == null)
            {
                onComplete?.Invoke();
                return;
            }

            StartCoroutine(AnimateShipMovementCoroutine(path, onComplete));
        }

        private System.Collections.IEnumerator AnimateShipMovementCoroutine(List<int> path, Action onComplete)
        {
            float moveDuration = 0.5f;

            for (int i = 0; i < path.Count - 1; i++)
            {
                if (!nodeViews.TryGetValue(path[i], out var fromView)) continue;
                if (!nodeViews.TryGetValue(path[i + 1], out var toView)) continue;

                var fromPos = new Vector3(fromView.LocalPosition.x, fromView.LocalPosition.y, -1f);
                var toPos = new Vector3(toView.LocalPosition.x, toView.LocalPosition.y, -1f);

                float elapsed = 0f;
                while (elapsed < moveDuration)
                {
                    elapsed += Time.deltaTime;
                    float t = elapsed / moveDuration;
                    t = t * t * (3f - 2f * t);
                    shipTransform.localPosition = Vector3.Lerp(fromPos, toPos, t);
                    yield return null;
                }

                shipTransform.localPosition = toPos;
                OnShipArrivedNode?.Invoke(path[i + 1]);
                yield return new WaitForSeconds(0.1f);
            }

            HighlightAvailableNodes();
            ClearRoutePreview();
            onComplete?.Invoke();
        }

        public event Action<int> OnShipArrivedNode;

        public void ShowRoutePreview(int targetNodeId)
        {
            if (dataManager?.RuntimeData == null) return;

            var startNodeId = dataManager.RuntimeData.Ship.CurrentNodeId;
            previewRoute = dataManager.FindOptimalPath(startNodeId, targetNodeId, out int totalCost);
            previewRouteFuelCost = totalCost;

            if (previewRoute.Count < 2)
            {
                OnFeedbackMessage?.Invoke("无法到达该节点", false);
                ClearRoutePreview();
                return;
            }

            DrawRouteLine(previewRoute, totalCost);

            Color lineColor = defaultRouteColor;
            if (!fuelManager.CanAffordPath(previewRoute))
            {
                lineColor = errorRouteColor;
                OnFeedbackMessage?.Invoke($"燃料不足！需要 {totalCost}，当前 {fuelManager.CurrentFuel}", false);
            }
            else if (fuelManager.FuelPercentage - (float)totalCost / fuelManager.MaxFuel < 0.2f)
            {
                lineColor = warningRouteColor;
                OnFeedbackMessage?.Invoke($"航线规划完成，燃料消耗：{totalCost}", true);
            }
            else
            {
                OnFeedbackMessage?.Invoke($"航线规划完成，燃料消耗：{totalCost}", true);
            }

            if (routeLineRenderer != null)
            {
                var colorGradient = new Gradient();
                colorGradient.SetKeys(
                    new[] { new GradientColorKey(lineColor, 0f), new GradientColorKey(lineColor, 1f) },
                    new[] { new GradientAlphaKey(0.9f, 0f), new GradientAlphaKey(0.9f, 1f) }
                );
                routeLineRenderer.colorGradient = colorGradient;
            }

            OnRoutePlanned?.Invoke(startNodeId, targetNodeId, $"燃料:{totalCost}");
        }

        private void DrawRouteLine(List<int> path, int fuelCost)
        {
            if (routeLineRenderer == null || path.Count < 2) return;

            routeLineRenderer.positionCount = path.Count;
            routeLineRenderer.useWorldSpace = false;
            routeLineRenderer.sortingOrder = 10;
            routeLineRenderer.startWidth = 0.25f;
            routeLineRenderer.endWidth = 0.25f;

            for (int i = 0; i < path.Count; i++)
            {
                if (nodeViews.TryGetValue(path[i], out var view))
                {
                    routeLineRenderer.SetPosition(i,
                        new Vector3(view.LocalPosition.x, view.LocalPosition.y, -0.5f));
                }
            }
        }

        public void ClearRoutePreview()
        {
            if (routeLineRenderer != null)
            {
                routeLineRenderer.positionCount = 0;
            }
            previewRoute.Clear();
            previewRouteFuelCost = 0;

            if (selectedNodeId > 0 && nodeViews.TryGetValue(selectedNodeId, out var selectedView))
            {
                selectedView.SetSelected(false);
            }
            selectedNodeId = -1;
        }

        public List<int> GetPreviewRoute() => previewRoute;
        public int GetPreviewRouteFuelCost() => previewRouteFuelCost;

        public bool ExecutePreviewRoute()
        {
            if (previewRoute.Count < 2)
            {
                OnFeedbackMessage?.Invoke("请先选择目标节点", false);
                return false;
            }

            if (!fuelManager.CanAffordPath(previewRoute))
            {
                OnFeedbackMessage?.Invoke($"燃料不足！", false);
                return false;
            }

            if (gameplayController == null)
            {
                OnFeedbackMessage?.Invoke("系统未就绪", false);
                return false;
            }

            var nodesToAnimate = new List<int>(previewRoute);
            ClearRoutePreview();

            AnimateShipMovement(nodesToAnimate, () =>
            {
                var result = gameplayController.ExecuteRoute(nodesToAnimate);
                if (!string.IsNullOrEmpty(result.Message))
                {
                    OnFeedbackMessage?.Invoke(result.Message, result.Success);
                }
            });

            return true;
        }

        private void HandlePointerClicked(Vector2 screenPos, int pointerId)
        {
            if (dataManager == null) return;

            var worldPos = inputManager.ScreenToWorldPoint(screenPos);
            Collider2D hit = Physics2D.OverlapPoint(worldPos);
            if (hit != null)
            {
                var nodeView = hit.GetComponentInParent<StarNodeView>();
                if (nodeView != null)
                {
                    HandleNodeClicked(nodeView.NodeId);
                }
            }
        }

        private void HandleDragging(Vector2 startPos, Vector2 currentPos, int pointerId)
        {
            if (Camera.main == null) return;
            float dragFactor = 0.01f;
            Vector2 delta = (currentPos - startPos) * dragFactor;
            nodesContainer.position += new Vector3(delta.x, delta.y, 0);
        }

        private void HandleDragEnd(Vector2 startPos, Vector2 endPos, int pointerId) { }

        private void HandleScroll(float scrollDelta)
        {
            float zoomFactor = 1 + scrollDelta * 0.5f;
            float minZoom = 0.5f;
            float maxZoom = 2f;
            float currentScale = nodesContainer.localScale.x;
            float newScale = Mathf.Clamp(currentScale * zoomFactor, minZoom, maxZoom);
            nodesContainer.localScale = Vector3.one * newScale;
        }

        private void HandleKeyPressed(string key)
        {
            if (key == "Escape")
            {
                ClearRoutePreview();
            }
        }

        private void HandleNodeClicked(int nodeId)
        {
            if (selectedNodeId == nodeId)
            {
                ExecutePreviewRoute();
                return;
            }

            if (selectedNodeId > 0 && nodeViews.TryGetValue(selectedNodeId, out var prevView))
            {
                prevView.SetSelected(false);
            }

            selectedNodeId = nodeId;
            if (nodeViews.TryGetValue(nodeId, out var view))
            {
                view.SetSelected(true);
            }

            OnNodeSelected?.Invoke(nodeId);
            EventBus.Publish(new GameEvents.NodeSelected { NodeId = nodeId });
            ShowRoutePreview(nodeId);
        }

        private void HandleNodeHovered(int nodeId, bool isHover)
        {
            if (isHover)
            {
                hoveredNodeId = nodeId;
                OnNodeHovered?.Invoke(nodeId);
            }
            else if (hoveredNodeId == nodeId)
            {
                hoveredNodeId = -1;
            }
        }

        public StarNodeView GetNodeView(int nodeId)
        {
            nodeViews.TryGetValue(nodeId, out var view);
            return view;
        }

        public void PanToNode(int nodeId, bool animate = true)
        {
            if (!nodeViews.TryGetValue(nodeId, out var view)) return;
            var target = -view.LocalPosition;
            target.z = nodesContainer.position.z;

            if (animate) StartCoroutine(PanToPositionCoroutine(target, 0.3f));
            else nodesContainer.position = target;
        }

        private System.Collections.IEnumerator PanToPositionCoroutine(Vector3 target, float duration)
        {
            var from = nodesContainer.position;
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                t = t * t * (3f - 2f * t);
                nodesContainer.position = Vector3.Lerp(from, target, t);
                yield return null;
            }
            nodesContainer.position = target;
        }

        public void Shutdown()
        {
            if (inputManager != null)
            {
                inputManager.OnPointerClicked -= HandlePointerClicked;
                inputManager.OnDragging -= HandleDragging;
                inputManager.OnDragEnd -= HandleDragEnd;
                inputManager.OnScroll -= HandleScroll;
                inputManager.OnKeyPressed -= HandleKeyPressed;
            }
            ClearMap();
        }
    }
}
