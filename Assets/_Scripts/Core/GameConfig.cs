using System.Collections.Generic;
using UnityEngine;

namespace LightShadowPlatformer.Core
{
    [CreateAssetMenu(fileName = "GameConfig", menuName = "LightShadow/Game Config", order = 0)]
    public class GameConfig : ScriptableObject
    {
        [Header("General")]
        public string gameTitle = "光与影的迷途";
        public string gameSubtitle = "Light & Shadow Platformer";
        public string version = "0.1.0";

        [Header("Player Tuning")]
        [Range(3f, 15f)] public float playerMoveSpeed = 7f;
        [Range(8f, 25f)] public float playerJumpForce = 14f;
        [Range(0.5f, 2f)] public float playerGravityMultiplier = 1f;
        [Range(0, 3)] public int maxAirJumps = 0;
        [Range(0.05f, 0.25f)] public float coyoteTime = 0.1f;
        [Range(0.05f, 0.25f)] public float jumpBufferTime = 0.12f;

        [Header("Light Tuning")]
        [Range(0.1f, 1f)] public float lightSwitchDuration = 0.3f;
        [Range(0f, 0.5f)] public float lightSwitchCooldown = 0.1f;
        public Color leftLightTint = new Color(1f, 0.95f, 0.85f, 1f);
        public Color rightLightTint = new Color(0.85f, 0.95f, 1f, 1f);
        public Color topLightTint = new Color(1f, 1f, 1f, 1f);
        public Color bottomLightTint = new Color(0.95f, 0.85f, 1f, 1f);

        [Header("Audio Tuning")]
        [Range(0f, 1f)] public float defaultMasterVolume = 1f;
        [Range(0f, 1f)] public float defaultMusicVolume = 0.8f;
        [Range(0f, 1f)] public float defaultSfxVolume = 1f;

        [Header("Levels")]
        public List<LevelConfig> allLevels = new List<LevelConfig>();
        public int totalLevels => allLevels.Count;

        [Header("Pacing")]
        [Range(8f, 15f)] public float targetPlayTimeMinutes = 10f;

        public LevelConfig GetLevel(int index)
        {
            if (index < 0 || index >= allLevels.Count) return null;
            return allLevels[index];
        }
    }
}
