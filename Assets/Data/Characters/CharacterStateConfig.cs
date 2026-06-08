using UnityEngine;

namespace InkMountainBridge
{
    [CreateAssetMenu(fileName = "CharacterStateConfig", menuName = "InkMountainBridge/Character State Config")]
    public class CharacterStateConfig : ScriptableObject
    {
        public float maxHealth;
        public float moveSpeed;
        public float staminaDrainRate;
        public float staminaRecoveryRate;
        public float carryCapacity;
        public float fallDamageThreshold;
        public float fallDamageMultiplier;
        public float drownTime;
    }
}
