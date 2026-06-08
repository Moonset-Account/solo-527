using System;
using UnityEngine;
using SpaceCourier.Data;

namespace SpaceCourier.StarMap
{
    public class StarNodeView : MonoBehaviour
    {
        [Header("Components")]
        public SpriteRenderer nodeRenderer;
        public SpriteRenderer haloRenderer;
        public SpriteRenderer selectorRenderer;
        public TMPro.TextMeshPro nameLabel;
        public GameObject fuelStationIndicator;
        public GameObject dangerIndicator;
        public Collider2D hitCollider;

        [Header("Animation")]
        public float hoverScaleMultiplier = 1.2f;
        public float pulseFrequency = 2f;
        public Color defaultHaloColor = new Color(0.3f, 0.5f, 1f, 0.3f);
        public Color availableHaloColor = new Color(0.3f, 1f, 0.5f, 0.5f);
        public Color currentHaloColor = new Color(1f, 0.9f, 0.3f, 0.7f);
        public Color selectedHaloColor = new Color(0f, 1f, 1f, 0.8f);

        private StarNodeData nodeData;
        private Vector3 localPosition;
        private Vector3 baseScale;

        private bool isHovered = false;
        private bool isSelected = false;
        private bool isCurrent = false;
        private bool isAvailable = false;
        private float pulseTimer = 0f;

        public int NodeId => nodeData?.NodeId ?? -1;
        public Vector2 LocalPosition => localPosition;
        public StarNodeData NodeData => nodeData;

        public event Action<int, bool> OnHovered;
        public event Action<int> OnClicked;

        private void Awake()
        {
            EnsureComponents();
        }

        private void EnsureComponents()
        {
            if (nodeRenderer == null)
            {
                var nodeSpriteChild = transform.Find("NodeSprite");
                if (nodeSpriteChild != null) nodeRenderer = nodeSpriteChild.GetComponent<SpriteRenderer>();
                if (nodeRenderer == null)
                {
                    nodeRenderer = gameObject.GetComponent<SpriteRenderer>();
                    if (nodeRenderer == null)
                    {
                        var sr = gameObject.AddComponent<SpriteRenderer>();
                        sr.sprite = CreateCircleSprite(32, Color.white);
                        sr.sortingOrder = 10;
                        nodeRenderer = sr;
                    }
                }
            }
            if (haloRenderer == null)
            {
                var haloChild = transform.Find("RingGlow");
                if (haloChild != null) haloRenderer = haloChild.GetComponent<SpriteRenderer>();
                if (haloRenderer == null)
                {
                    var haloObj = new GameObject("RingGlow");
                    haloObj.transform.SetParent(transform, false);
                    haloObj.transform.localScale = Vector3.one * 1.8f;
                    var sr = haloObj.AddComponent<SpriteRenderer>();
                    sr.sprite = CreateCircleSprite(40, Color.white);
                    sr.sortingOrder = 5;
                    sr.color = defaultHaloColor;
                    haloRenderer = sr;
                }
            }
            if (selectorRenderer == null)
            {
                var selObj = new GameObject("Selector");
                selObj.transform.SetParent(transform, false);
                selObj.transform.localScale = Vector3.one * 2.2f;
                var sr = selObj.AddComponent<SpriteRenderer>();
                sr.sprite = CreateRingSprite(48, 4, Color.white);
                sr.sortingOrder = 6;
                sr.enabled = false;
                selectorRenderer = sr;
            }
            if (nameLabel == null)
            {
                var labelChild = transform.Find("Label");
                if (labelChild != null) nameLabel = labelChild.GetComponent<TMPro.TextMeshPro>();
                if (nameLabel == null)
                {
                    var lblObj = new GameObject("Label");
                    lblObj.transform.SetParent(transform, false);
                    lblObj.transform.localPosition = new Vector3(0f, -1.1f, 0f);
                    var tmpro = lblObj.AddComponent<TMPro.TextMeshPro>();
                    tmpro.alignment = TMPro.TextAlignmentOptions.Center;
                    tmpro.fontSize = 14;
                    tmpro.color = Color.white;
                    tmpro.sortingOrder = 15;
                    var fonts = Resources.FindObjectsOfTypeAll<TMPro.TMP_FontAsset>();
                    if (fonts.Length > 0) tmpro.font = fonts[0];
                    nameLabel = tmpro;
                }
            }
            if (fuelStationIndicator == null)
            {
                var fsObj = new GameObject("FuelStationIndicator");
                fsObj.transform.SetParent(transform, false);
                fsObj.transform.localPosition = new Vector3(0.6f, 0.5f, 0f);
                fsObj.transform.localScale = Vector3.one * 0.5f;
                var fsSr = fsObj.AddComponent<SpriteRenderer>();
                fsSr.sprite = CreateCircleSprite(16, new Color(0.3f, 0.85f, 0.4f));
                fsSr.sortingOrder = 12;
                fuelStationIndicator = fsObj;
                fuelStationIndicator.SetActive(false);
            }
            if (dangerIndicator == null)
            {
                var dObj = new GameObject("DangerIndicator");
                dObj.transform.SetParent(transform, false);
                dObj.transform.localPosition = new Vector3(-0.6f, 0.5f, 0f);
                dObj.transform.localScale = Vector3.one * 0.5f;
                var dSr = dObj.AddComponent<SpriteRenderer>();
                dSr.sprite = CreateTriangleSprite(16, new Color(1f, 0.4f, 0.3f));
                dSr.sortingOrder = 12;
                dangerIndicator = dObj;
                dangerIndicator.SetActive(false);
            }
            if (hitCollider == null)
            {
                hitCollider = GetComponent<Collider2D>();
                if (hitCollider == null)
                {
                    var col = gameObject.AddComponent<CircleCollider2D>();
                    col.radius = 0.8f;
                    hitCollider = col;
                }
            }
        }

        private static Sprite CreateCircleSprite(int size, Color color)
        {
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            tex.filterMode = FilterMode.Bilinear;
            var pixels = new Color[size * size];
            float r = size * 0.5f;
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float dx = x - r + 0.5f;
                    float dy = y - r + 0.5f;
                    float d = Mathf.Sqrt(dx * dx + dy * dy);
                    pixels[y * size + x] = d <= r ? color : new Color(0, 0, 0, 0);
                    if (d > r - 2f && d <= r) pixels[y * size + x].a *= (r - d) / 2f;
                }
            }
            tex.SetPixels(pixels);
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), 100f);
        }

        private static Sprite CreateRingSprite(int size, int thickness, Color color)
        {
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            tex.filterMode = FilterMode.Bilinear;
            var pixels = new Color[size * size];
            float outerR = size * 0.5f;
            float innerR = outerR - thickness;
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float dx = x - outerR + 0.5f;
                    float dy = y - outerR + 0.5f;
                    float d = Mathf.Sqrt(dx * dx + dy * dy);
                    pixels[y * size + x] = (d <= outerR && d >= innerR) ? color : new Color(0, 0, 0, 0);
                }
            }
            tex.SetPixels(pixels);
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), 100f);
        }

        private static Sprite CreateTriangleSprite(int size, Color color)
        {
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            tex.filterMode = FilterMode.Bilinear;
            var pixels = new Color[size * size];
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float t = (float)y / size;
                    float halfW = (0.5f * t) * size;
                    float cx = size * 0.5f;
                    bool inside = y < size && x > cx - halfW && x < cx + halfW;
                    pixels[y * size + x] = inside ? color : new Color(0, 0, 0, 0);
                }
            }
            tex.SetPixels(pixels);
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), 100f);
        }

        public void Initialize(StarNodeData data, Vector3 position, float scale)
        {
            nodeData = data;
            localPosition = position;
            transform.localPosition = position;
            baseScale = Vector3.one * scale;
            transform.localScale = baseScale;

            ConfigureVisuals();
            ConfigureInteractivity();
            UpdateIndicators();
        }

        private void ConfigureVisuals()
        {
            if (nodeRenderer != null)
            {
                nodeRenderer.color = nodeData != null ? nodeData.NodeColor : Color.white;
                if (nodeData != null && nodeData.NodeIcon != null)
                {
                    nodeRenderer.sprite = nodeData.NodeIcon;
                }
                else
                {
                    SetDefaultNodeSprite();
                }
            }

            if (nameLabel != null)
            {
                nameLabel.text = nodeData?.NodeName ?? "Unknown";
                nameLabel.color = Color.white;
                nameLabel.fontSize = 14;
            }

            if (haloRenderer != null)
            {
                haloRenderer.color = defaultHaloColor;
            }

            if (selectorRenderer != null)
            {
                selectorRenderer.enabled = false;
            }
        }

        private void SetDefaultNodeSprite()
        {
            if (nodeRenderer == null || nodeData == null) return;
            switch (nodeData.Type)
            {
                case NodeType.Station:
                    nodeRenderer.color = new Color(0.4f, 0.7f, 1f);
                    break;
                case NodeType.Planet:
                    nodeRenderer.color = new Color(0.4f, 0.9f, 0.5f);
                    break;
                case NodeType.Outpost:
                    nodeRenderer.color = new Color(1f, 0.8f, 0.4f);
                    break;
                case NodeType.Wormhole:
                    nodeRenderer.color = new Color(0.8f, 0.4f, 1f);
                    break;
                case NodeType.Asteroid:
                    nodeRenderer.color = new Color(0.7f, 0.55f, 0.4f);
                    break;
                case NodeType.Derelict:
                    nodeRenderer.color = new Color(0.5f, 0.5f, 0.5f);
                    break;
            }
        }

        private void ConfigureInteractivity()
        {
            if (hitCollider == null)
            {
                hitCollider = GetComponent<CircleCollider2D>();
                if (hitCollider == null)
                {
                    var col2D = gameObject.AddComponent<CircleCollider2D>();
                    col2D.radius = 0.8f;
                    hitCollider = col2D;
                }
            }
        }

        private void UpdateIndicators()
        {
            if (fuelStationIndicator != null)
            {
                fuelStationIndicator.SetActive(nodeData != null && nodeData.HasFuelStation);
            }

            if (dangerIndicator != null && nodeData != null)
            {
                bool showDanger = nodeData.DangerLevel >= NodeDangerLevel.Medium;
                dangerIndicator.SetActive(showDanger);
            }
        }

        public void SetAvailability(bool isCurrentNode, bool isAvailableDestination)
        {
            isCurrent = isCurrentNode;
            isAvailable = isAvailableDestination;
            UpdateHaloColor();
        }

        public void SetSelected(bool selected)
        {
            isSelected = selected;
            if (selectorRenderer != null)
            {
                selectorRenderer.enabled = selected;
            }
            UpdateHaloColor();
        }

        private void UpdateHaloColor()
        {
            if (haloRenderer == null) return;

            Color targetColor;
            if (isSelected)
            {
                targetColor = selectedHaloColor;
            }
            else if (isCurrent)
            {
                targetColor = currentHaloColor;
            }
            else if (isAvailable)
            {
                targetColor = availableHaloColor;
            }
            else
            {
                targetColor = defaultHaloColor;
            }

            if (Application.isPlaying)
            {
                StartCoroutine(LerpHaloColor(targetColor, 0.2f));
            }
            else
            {
                haloRenderer.color = targetColor;
            }
        }

        private System.Collections.IEnumerator LerpHaloColor(Color target, float duration)
        {
            if (haloRenderer == null) yield break;
            var from = haloRenderer.color;
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                haloRenderer.color = Color.Lerp(from, target, t);
                yield return null;
            }
            haloRenderer.color = target;
        }

        private void Update()
        {
            if (isHovered || isSelected || isCurrent)
            {
                pulseTimer += Time.deltaTime * pulseFrequency;
                float pulse = 1f + Mathf.Sin(pulseTimer) * 0.08f;
                var targetScale = isHovered
                    ? baseScale * hoverScaleMultiplier * pulse
                    : baseScale * pulse;

                if (Application.isPlaying && gameObject != null)
                {
                    transform.localScale = Vector3.Lerp(transform.localScale, targetScale, Time.deltaTime * 8f);
                }
            }
            else
            {
                if (Application.isPlaying && gameObject != null)
                {
                    transform.localScale = Vector3.Lerp(transform.localScale, baseScale, Time.deltaTime * 8f);
                }
            }
        }

        private void OnMouseEnter()
        {
            isHovered = true;
            OnHovered?.Invoke(NodeId, true);
        }

        private void OnMouseExit()
        {
            isHovered = false;
            OnHovered?.Invoke(NodeId, false);
        }

        private void OnMouseDown()
        {
            OnClicked?.Invoke(NodeId);
        }

        public string GetTooltipText()
        {
            if (nodeData == null) return string.Empty;

            string tooltip = $"<b>{nodeData.NodeName}</b>\n";
            tooltip += $"类型: {GetNodeTypeText(nodeData.Type)}\n";
            tooltip += $"危险等级: {GetDangerText(nodeData.DangerLevel)}\n";
            if (nodeData.HasFuelStation)
            {
                tooltip += $"⛽ 加油站 (单价 {nodeData.RefuelCost})\n";
            }
            if (!string.IsNullOrEmpty(nodeData.Description))
            {
                tooltip += $"\n{nodeData.Description}";
            }
            return tooltip;
        }

        private string GetNodeTypeText(NodeType type)
        {
            switch (type)
            {
                case NodeType.Station: return "空间站";
                case NodeType.Planet: return "行星";
                case NodeType.Outpost: return "前哨站";
                case NodeType.Wormhole: return "虫洞";
                case NodeType.Asteroid: return "小行星带";
                case NodeType.Derelict: return "废弃船只";
                default: return "未知";
            }
        }

        private string GetDangerText(NodeDangerLevel danger)
        {
            switch (danger)
            {
                case NodeDangerLevel.Safe: return "<color=#4CAF50>安全</color>";
                case NodeDangerLevel.Low: return "<color=#8BC34A>低风险</color>";
                case NodeDangerLevel.Medium: return "<color=#FFC107>中等风险</color>";
                case NodeDangerLevel.High: return "<color=#FF9800>高风险</color>";
                case NodeDangerLevel.Extreme: return "<color=#F44336>极危险</color>";
                default: return "未知";
            }
        }
    }
}
