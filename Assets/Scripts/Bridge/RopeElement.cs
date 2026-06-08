using UnityEngine;

namespace InkMountainBridge
{
    public class RopeElement : BridgeElement
    {
        [SerializeField] private LineRenderer lineRenderer;
        [SerializeField] private float droopHeight = 0.5f;
        [SerializeField] private int segmentCount = 10;
        [SerializeField] private float snapAnimDuration = 0.3f;

        private bool isSnapping;
        private float snapTimer;
        private Vector2 snapPosition;

        private void Awake()
        {
            elementType = MaterialType.Rope;
            lineRenderer = GetComponent<LineRenderer>();
            if (lineRenderer == null)
            {
                lineRenderer = gameObject.AddComponent<LineRenderer>();
            }
            lineRenderer.positionCount = segmentCount;
        }

        public override float CalculateStress(float appliedForce)
        {
            if (startNode == null || endNode == null) return 0f;

            Vector2 direction = endNode.Position - startNode.Position;
            float length = direction.magnitude;
            if (length < 0.001f) return 0f;

            Vector2 normalizedDir = direction / length;
            float axialForce = appliedForce.x * normalizedDir.x + appliedForce.y * normalizedDir.y;

            if (axialForce <= 0f) return 0f;

            float stress = axialForce / (length * 0.08f);
            currentStress = stress;
            return stress;
        }

        public override void ApplyForce(Vector2 force)
        {
            float stress = CalculateStress(force.x + force.y);
            if (stress >= maxStress && !isBroken)
            {
                Break();
            }
            UpdateVisual();
        }

        public override void Break()
        {
            if (isBroken) return;
            isBroken = true;
            isSnapping = true;
            snapTimer = snapAnimDuration;
            snapPosition = transform.position;

            if (startNode != null) startNode.RemoveElement(this);
            if (endNode != null) endNode.RemoveElement(this);

            GameEvents.RaiseBridgeCollapsed(snapPosition);
        }

        public override void UpdateVisual()
        {
            if (lineRenderer == null) return;

            if (isBroken)
            {
                lineRenderer.positionCount = 0;
                return;
            }

            lineRenderer.positionCount = segmentCount;
            if (startNode == null || endNode == null) return;

            Vector2 start = startNode.Position;
            Vector2 end = endNode.Position;
            float stressRatio = maxStress > 0 ? Mathf.Clamp01(currentStress / maxStress) : 0f;

            for (int i = 0; i < segmentCount; i++)
            {
                float t = (float)i / (segmentCount - 1);
                Vector2 point = Vector2.Lerp(start, end, t);
                float droop = Mathf.Sin(t * Mathf.PI) * droopHeight * (1f + stressRatio);
                point.y -= droop;
                lineRenderer.SetPosition(i, point);
            }

            Color ropeColor = Color.Lerp(Color.white, Color.red, stressRatio);
            lineRenderer.startColor = ropeColor;
            lineRenderer.endColor = ropeColor;
        }

        private void Update()
        {
            if (!isSnapping) return;

            snapTimer -= Time.deltaTime;
            if (snapTimer <= 0f)
            {
                isSnapping = false;
                if (lineRenderer != null) lineRenderer.positionCount = 0;
                return;
            }

            float progress = 1f - (snapTimer / snapAnimDuration);
            if (lineRenderer != null)
            {
                lineRenderer.positionCount = segmentCount;
                Vector2 midPoint = snapPosition + Vector2.down * (droopHeight * 2f * progress);
                for (int i = 0; i < segmentCount; i++)
                {
                    float t = (float)i / (segmentCount - 1);
                    Vector2 point = Vector2.Lerp(snapPosition, midPoint, t < 0.5f ? t * 2f : 1f);
                    if (t >= 0.5f)
                    {
                        point = Vector2.Lerp(midPoint, snapPosition, (t - 0.5f) * 2f);
                        point.y -= droopHeight * progress * 2f;
                    }
                    point.y -= Mathf.Sin(t * Mathf.PI) * droopHeight * (1f + progress);
                    lineRenderer.SetPosition(i, point);
                }

                Color c = lineRenderer.startColor;
                c.a = Mathf.Lerp(1f, 0f, progress);
                lineRenderer.startColor = c;
                lineRenderer.endColor = c;
            }
        }
    }
}
