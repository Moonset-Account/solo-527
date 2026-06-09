using UnityEngine;

namespace BeatRunner.Core
{
    [CreateAssetMenu(fileName = "GameSettings", menuName = "BeatRunner/GameSettings")]
    public class GameSettings : ScriptableObject
    {
        [Header("Performance")]
        public int targetFrameRate = 60;
        public int physicsFrameRate = 60;
        public bool enablePerformanceStats = true;

        [Header("Track")]
        public int trackCount = 3;
        public float trackWidth = 2f;
        public float trackSwitchSpeed = 15f;

        [Header("Player")]
        public float jumpHeight = 2.5f;
        public float jumpDuration = 0.4f;
        public float slideDuration = 0.6f;
        public float slideColliderHeight = 0.5f;
        public float playerForwardSpeed = 10f;
        public float gravityMultiplier = 2.5f;

        [Header("Beat Timing")]
        public float perfectWindow = 0.05f;
        public float greatWindow = 0.08f;
        public float goodWindow = 0.12f;
        public float missWindow = 0.18f;

        [Header("Audio")]
        public float defaultAudioLatencyMs = 0f;
        public float minAudioLatencyMs = -500f;
        public float maxAudioLatencyMs = 500f;

        [Header("Scoring")]
        public int perfectScore = 300;
        public int greatScore = 200;
        public int goodScore = 100;
        public int missScore = 0;
        public float comboMultiplier = 0.1f;
        public int maxComboMultiplier = 5;

        [Header("Unlock")]
        public int fragmentsPerTrack = 10;
        public int fragmentsToUnlockNext = 50;

        public static GameSettings Default
        {
            get
            {
                var settings = CreateInstance<GameSettings>();
                return settings;
            }
        }
    }
}
