using UnityEngine;
using ShadowPlatformer.Player;

namespace ShadowPlatformer.Mechanics
{
    public class HazardZone : MonoBehaviour
    {
        [Header("Hazard Config")]
        public bool instantKill = true;
        public int damageAmount = 1;

        private void OnTriggerEnter2D(Collider2D other)
        {
            var player = other.GetComponent<PlayerController>();
            if (player == null || player.IsDead) return;

            if (instantKill)
                player.Die();
        }
    }
}
