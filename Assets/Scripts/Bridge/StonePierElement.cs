using UnityEngine;

namespace InkMountainBridge
{
    public class StonePierElement : BridgeElement
    {
        [SerializeField] private float sinkThreshold;
        [SerializeField] private float sinkRate = 0.1f;
        [SerializeField] private float currentSinkAmount;
        [SerializeField] private SpriteRenderer spriteRenderer;
        [SerializeField] private float sinkAnimDuration = 1.5f;

        private bool isSinking;
        private float sinkAnimTimer;

        public float SinkThreshold => sinkThreshold;
        public float CurrentSinkAmount => currentSinkAmount;
        public bool IsSinking => isSinking;

        private void Awake()
        {
            elementType = MaterialType.StonePier;
            spriteRenderer = GetComponent<SpriteRenderer>();
            isBroken = false;
        }

        public void SetSinkThreshold(float value)
        {
            sinkThreshold = value;
        }

        public override float CalculateStress(float appliedForce)
        {
            if (startNode == null) return 0f;

            float verticalLoad = Mathf.Abs(appliedForce.y);
            float stress = verticalLoad / (maxStress > 0 ? maxStress : 1f);
            currentStress = stress;
            return stress;
        }

        public override void ApplyForce(Vector2 force)
        {
            float stress = CalculateStress(force);
            currentStress = stress;

            if (stress >= sinkThreshold && !isSinking)
            {
                Sink();
            }
            UpdateVisual();
        }

        public override void Break()
        {
            Sink();
        }

        public void Sink()
        {
            if (isSinking) return;
            isSinking = true;
            sinkAnimTimer = sinkAnimDuration;
        }

        public override void UpdateVisual()
        {
            if (spriteRenderer == null) return;

            if (isSinking)
            {
                float sinkRatio = Mathf.Clamp01(currentSinkAmount / sinkThreshold);
                Color c = Color.Lerp(new Color(0.6f, 0.5f, 0.4f), new Color(0.4f, 0.3f, 0.2f), sinkRatio);
                spriteRenderer.color = c;
            }
            else
            {
                float stressRatio = maxStress > 0 ? Mathf.Clamp01(currentStress / sinkThreshold) : 0f;
                Color c = Color.Lerp(new Color(0.7f, 0.65f, 0.6f), new Color(0.5f, 0.45f, 0.35f), stressRatio);
                spriteRenderer.color = c;
            }
        }

        private void Update()
        {
            if (!isSinking) return;

            sinkAnimTimer -= Time.deltaTime;
            currentSinkAmount += sinkRate * Time.deltaTime;

            Vector3 pos = transform.position;
            pos.y -= sinkRate * Time.deltaTime;
            transform.position = pos;

            UpdateVisual();

            if (sinkAnimTimer <= 0f || currentSinkAmount >= sinkThreshold * 2f)
            {
                isSinking = false;
                isBroken = true;
                if (spriteRenderer != null)
                {
                    Color c = spriteRenderer.color;
                    c.a = 0.2f;
                    spriteRenderer.color = c;
                }
                if (startNode != null) startNode.RemoveElement(this);
                if (endNode != null) endNode.RemoveElement(this);
            }
        }
    }
}
