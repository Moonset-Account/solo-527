using UnityEngine;

namespace InkMountainBridge
{
    public class BeamElement : BridgeElement
    {
        [SerializeField] private float beamMaxStress;
        [SerializeField] private SpriteRenderer spriteRenderer;
        [SerializeField] private float collapseAnimDuration = 0.5f;

        private float collapseTimer;

        private void Awake()
        {
            elementType = MaterialType.Beam;
            spriteRenderer = GetComponent<SpriteRenderer>();
        }

        public void SetMaxStress(float value)
        {
            beamMaxStress = value;
            maxStress = value;
        }

        public override float CalculateStress(float appliedForce)
        {
            if (startNode == null || endNode == null) return 0f;

            Vector2 direction = endNode.Position - startNode.Position;
            float length = direction.magnitude;
            if (length < 0.001f) return 0f;

            Vector2 normalizedDir = direction / length;
            float axialForce = appliedForce.x * normalizedDir.x + appliedForce.y * normalizedDir.y;
            float stress = Mathf.Abs(axialForce) / (length * 0.1f);
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
            collapseTimer = collapseAnimDuration;

            if (startNode != null) startNode.RemoveElement(this);
            if (endNode != null) endNode.RemoveElement(this);

            GameEvents.OnBridgeCollapsed?.Invoke(transform.position);
        }

        public override void UpdateVisual()
        {
            if (spriteRenderer == null) return;
            if (isBroken)
            {
                spriteRenderer.color = new Color(0.3f, 0.3f, 0.3f, 0.3f);
                return;
            }

            float ratio = maxStress > 0 ? Mathf.Clamp01(currentStress / maxStress) : 0f;
            if (ratio < 0.5f)
            {
                float t = ratio * 2f;
                spriteRenderer.color = Color.Lerp(Color.green, Color.yellow, t);
            }
            else
            {
                float t = (ratio - 0.5f) * 2f;
                spriteRenderer.color = Color.Lerp(Color.yellow, Color.red, t);
            }
        }

        private void Update()
        {
            if (!isBroken) return;

            if (collapseTimer > 0f)
            {
                collapseTimer -= Time.deltaTime;
                float progress = 1f - (collapseTimer / collapseAnimDuration);
                Vector3 collapseOffset = Vector3.down * progress * 2f;
                transform.position += collapseOffset * Time.deltaTime;
                if (spriteRenderer != null)
                {
                    Color c = spriteRenderer.color;
                    c.a = Mathf.Lerp(0.3f, 0f, progress);
                    spriteRenderer.color = c;
                }
            }
            else
            {
                gameObject.SetActive(false);
            }
        }
    }
}
