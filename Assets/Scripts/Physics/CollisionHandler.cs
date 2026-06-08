using UnityEngine;

namespace InkMountainBridge
{
    public class CollisionHandler : MonoBehaviour
    {
        [SerializeField] private GameObject destructionDebrisPrefab;
        [SerializeField] private GameObject collapseParticleEffect;

        public void HandleElementBreak(BridgeElement element, Vector2 breakPoint)
        {
            if (element == null) return;

            if (destructionDebrisPrefab != null)
            {
                Instantiate(destructionDebrisPrefab, breakPoint, Quaternion.identity);
            }

            if (collapseParticleEffect != null)
            {
                Instantiate(collapseParticleEffect, breakPoint, Quaternion.identity);
            }

            element.Break();

            GameEvents.RaiseBridgeCollapsed(breakPoint);
        }

        public void HandleCaravanCollision(GameObject caravan, BridgeElement element)
        {
            if (caravan == null || element == null) return;

            Vector2 contactPoint = element.transform.position;

            if (element.CurrentStress >= element.MaxStress || element.IsBroken)
            {
                HandleElementBreak(element, contactPoint);

                Rigidbody2D caravanRb = caravan.GetComponent<Rigidbody2D>();
                if (caravanRb != null)
                {
                    caravanRb.gravityScale = 1f;
                }
            }
            else
            {
                float impactForce = caravan.GetComponent<Rigidbody2D>() != null
                    ? caravan.GetComponent<Rigidbody2D>().velocity.magnitude * caravan.GetComponent<Rigidbody2D>().mass
                    : 1f;

                Vector2 impactDirection = (contactPoint - (Vector2)caravan.transform.position).normalized;
                element.ApplyForce(impactDirection * impactForce);
            }
        }
    }
}
