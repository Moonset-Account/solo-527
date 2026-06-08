using UnityEngine;
using System.Collections.Generic;

namespace InkMountainBridge
{
    public class CaravanController : MonoBehaviour
    {
        [SerializeField] private CharacterStateConfig characterConfig;
        [SerializeField] private Rigidbody2D rigidbody2D;
        [SerializeField] private List<Vector2> pathPoints = new List<Vector2>();

        public float moveSpeed;
        public float currentHealth;
        public float maxHealth;
        public float stamina;
        public bool isOnBridge;
        public bool isMoving;
        public bool hasArrived;
        public bool isDrowning;

        private int currentPathIndex;
        private float drownTimer;

        private void Awake()
        {
            if (characterConfig != null)
            {
                moveSpeed = characterConfig.moveSpeed;
                maxHealth = characterConfig.maxHealth;
                currentHealth = maxHealth;
                stamina = characterConfig.carryCapacity;
            }
        }

        public void StartCrossing()
        {
            if (pathPoints.Count == 0) return;

            isMoving = true;
            hasArrived = false;
            isDrowning = false;
            currentPathIndex = 0;
            transform.position = pathPoints[0];
        }

        public void StopCrossing()
        {
            isMoving = false;
        }

        public void UpdateMovement(float dt)
        {
            if (!isMoving || hasArrived || isDrowning) return;

            if (currentPathIndex >= pathPoints.Count)
            {
                Arrive();
                return;
            }

            Vector2 target = pathPoints[currentPathIndex];
            Vector2 current = rigidbody2D != null ? rigidbody2D.position : (Vector2)transform.position;
            Vector2 direction = target - current;
            float distance = direction.magnitude;

            if (distance < 0.1f)
            {
                currentPathIndex++;
                return;
            }

            Vector2 movement = direction.normalized * moveSpeed * dt;

            if (movement.magnitude > distance)
            {
                movement = direction;
            }

            if (rigidbody2D != null)
            {
                rigidbody2D.MovePosition(current + movement);
            }
            else
            {
                transform.position = current + movement;
            }

            CheckBridgeSurface();

            if (characterConfig != null)
            {
                stamina -= characterConfig.staminaDrainRate * dt;
                if (stamina <= 0f)
                {
                    stamina = 0f;
                    Fail("Stamina depleted");
                }
            }
        }

        private void CheckBridgeSurface()
        {
            if (rigidbody2D != null)
            {
                RaycastHit2D hit = Physics2D.Raycast(rigidbody2D.position, Vector2.down, 1f);
                isOnBridge = hit.collider != null;
            }
        }

        public void TakeDamage(float amount)
        {
            currentHealth -= amount;
            if (currentHealth <= 0f)
            {
                currentHealth = 0f;
                Fail("Health depleted");
            }
        }

        public void ApplyFallDamage(float fallDistance)
        {
            if (characterConfig == null) return;

            float excessFall = fallDistance - characterConfig.fallDamageThreshold;
            if (excessFall > 0f)
            {
                TakeDamage(excessFall * characterConfig.fallDamageMultiplier);
            }
        }

        public void StartDrowning()
        {
            isDrowning = true;
            isMoving = false;
            drownTimer = 0f;
        }

        private void Update()
        {
            UpdateMovement(Time.deltaTime);

            if (isDrowning)
            {
                drownTimer += Time.deltaTime;
                if (characterConfig != null && drownTimer >= characterConfig.drownTime)
                {
                    Fail("Drowned");
                }
            }
        }

        public void Arrive()
        {
            isMoving = false;
            hasArrived = true;
            GameEvents.OnCaravanArrived?.Invoke();
        }

        public void Fail(string cause)
        {
            isMoving = false;
            GameEvents.OnCaravanFailed?.Invoke(cause);
        }
    }
}
