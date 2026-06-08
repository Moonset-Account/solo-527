using UnityEngine;

namespace LightShadowPlatformer.Hazard
{
    public enum HazardType { Spikes, Saw, Laser, Falling, Moving, Pit }

    public class HazardBase : MonoBehaviour
    {
        [Header("Hazard Settings")]
        public HazardType hazardType = HazardType.Spikes;
        public int damageAmount = 1;
        public bool instantKill = true;
        public float knockbackForce = 5f;
        public float knockbackLift = 3f;
        public float activationDelay = 0f;
        public float deactivationInterval = 0f;

        [Header("Visual")]
        public SpriteRenderer hazardRenderer;
        public Color activeColor = Color.red;
        public Color inactiveColor = new Color(0.4f, 0f, 0f, 0.3f);
        public float warningDuration = 0.5f;
        public ParticleSystem hitParticles;
        public ParticleSystem idleParticles;

        [Header("Collision")]
        public Collider2D hazardCollider;
        public LayerMask damageLayers;

        [Header("Moving")]
        public Vector2 moveDirection = Vector2.right;
        public float moveSpeed = 2f;
        public float moveRange = 3f;

        private bool _isActive = true;
        private bool _isWarning;
        private Vector3 _originPosition;
        private float _traveled;

        private void Awake()
        {
            _originPosition = transform.position;
            if (hazardRenderer == null) hazardRenderer = GetComponent<SpriteRenderer>();
            if (hazardCollider == null) hazardCollider = GetComponent<Collider2D>();

            if (damageLayers.value == 0)
                damageLayers = LayerMask.GetMask("Player");
        }

        private void Start()
        {
            UpdateVisual();
            if (activationDelay > 0f)
            {
                _isActive = false;
                UpdateVisual();
                Invoke(nameof(Activate), activationDelay);
            }
            if (idleParticles != null && _isActive) idleParticles.Play();
        }

        private void Update()
        {
            if (hazardType == HazardType.Moving)
                UpdateMovingHazard();

            if (deactivationInterval > 0f && _isActive)
            {
                if (!_isWarning)
                {
                    StartCoroutine(WarningCycle());
                }
            }
        }

        private void UpdateMovingHazard()
        {
            float move = moveSpeed * Time.deltaTime;
            transform.position += (Vector3)(moveDirection.normalized * move);
            _traveled += move;

            if (_traveled >= moveRange)
            {
                moveDirection = -moveDirection;
                _traveled = 0f;
                transform.position = _originPosition;
            }
        }

        private System.Collections.IEnumerator WarningCycle()
        {
            _isWarning = true;
            float warning = warningDuration;
            float onTime = deactivationInterval * 0.7f;
            float offTime = deactivationInterval * 0.3f;

            while (warning > 0f)
            {
                warning -= Time.deltaTime;
                if (hazardRenderer != null)
                {
                    float t = Mathf.PingPong(Time.time * 8f, 1f);
                    hazardRenderer.color = Color.Lerp(inactiveColor, activeColor, t);
                }
                yield return null;
            }

            _isActive = false;
            UpdateVisual();
            if (idleParticles != null) idleParticles.Stop();
            if (hazardCollider != null) hazardCollider.enabled = false;

            yield return new WaitForSeconds(offTime);

            _isActive = true;
            UpdateVisual();
            if (idleParticles != null) idleParticles.Play();
            if (hazardCollider != null) hazardCollider.enabled = true;

            yield return new WaitForSeconds(onTime);
            _isWarning = false;
        }

        private void Activate()
        {
            _isActive = true;
            UpdateVisual();
            if (idleParticles != null) idleParticles.Play();
        }

        private void UpdateVisual()
        {
            if (hazardRenderer != null)
            {
                hazardRenderer.color = _isActive ? activeColor : inactiveColor;
            }
        }

        private void OnTriggerStay2D(Collider2D other)
        {
            if (!_isActive) return;
            if ((damageLayers.value & (1 << other.gameObject.layer)) == 0) return;
            if (!other.CompareTag("Player")) return;

            ApplyDamage(other);
        }

        private void OnCollisionStay2D(Collision2D collision)
        {
            if (!_isActive) return;
            if (!collision.collider.CompareTag("Player")) return;

            ApplyDamage(collision.collider);
        }

        private void ApplyDamage(Collider2D target)
        {
            Player.PlayerController player = target.GetComponent<Player.PlayerController>();
            if (player == null) player = target.GetComponentInParent<Player.PlayerController>();
            if (player == null) return;

            if (hitParticles != null)
            {
                Instantiate(hitParticles, player.transform.position, Quaternion.identity);
            }

            Vector2 kbDir = ((Vector2)player.transform.position - (Vector2)transform.position).normalized;
            kbDir.y = Mathf.Max(kbDir.y, 0.3f);
            player.ApplyKnockback(transform.position, knockbackForce * 0.2f);

            LightShadowPlatformer.Core.AudioManager.Instance?.PlaySfx(
                LightShadowPlatformer.Core.AudioManager.SfxType.HazardDeath);

            if (instantKill)
            {
                Invoke(nameof(DelayDie), 0.15f);
            }
        }

        private void DelayDie()
        {
            Player.PlayerController player = FindObjectOfType<Player.PlayerController>();
            if (player != null) player.Die();
        }
    }
}
