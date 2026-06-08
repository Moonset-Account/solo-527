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
