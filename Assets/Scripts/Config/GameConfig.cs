using UnityEngine;
using System.Collections.Generic;

namespace KitchenChaos.Config
{
    [CreateAssetMenu(fileName = "GameConfig", menuName = "KitchenChaos/GameConfig", order = 0)]
    public class GameConfig : ScriptableObject
    {
        [Header("Global")]
        public int MaxPlayers = 4;
        public float PlayerMoveSpeed = 4f;
        public float PlayerInteractionRange = 1.5f;
        public float ThrowForce = 6f;

        [Header("Scoring")]
        public int PerfectDeliveryBonus = 50;
        public float PerfectDeliveryTimeRatio = 0.5f;
        public int ComboMultiplierPerStack = 25;
        public int MaxComboBonus = 500;

        [Header("Combo")]
        public float ComboTimeWindow = 8f;
        public int FailPenaltyScore = 100;

        [Header("Levels")]
        public LevelConfig[] Levels;

        [Header("Debug")]
        public bool EnableDebugPanel = true;
        public bool GodMode = false;
    }
}
