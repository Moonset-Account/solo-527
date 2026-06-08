using System.Collections.Generic;
using UnityEngine;

namespace LightShadowPlatformer.Core
{
    [CreateAssetMenu(fileName = "LevelConfig_", menuName = "LightShadow/Level Config", order = 1)]
    public class LevelConfig : ScriptableObject
    {
        [Header("Level Info")]
        public string levelId = "level_01";
        public string levelName = "第一关";
        public int levelOrder = 1;
        [TextArea(3, 10)] public string levelDescription;

        [Header("Difficulty")]
        public int difficulty = 1;
        public int collectibleCount;
        public int hazardCount;
        public int puzzleComplexity;

        [Header("Light Mechanics")]
        public bool enableLeftLight = true;
        public bool enableRightLight = true;
        public bool enableTopLight = false;
        public bool enableBottomLight = false;
        public LightManager.LightDirection startingDirection = LightManager.LightDirection.Left;

        [Header("Scene")]
        public string scenePath = "Assets/_Scenes/Level01.unity";
        public Vector2 spawnPosition;
        public Vector2 cameraMin;
        public Vector2 cameraMax;
        public float killZoneY = -10f;

        [Header("Mechanics")]
        public List<string> introducedMechanics = new List<string>();
        public bool usesSwitches;
        public bool usesPressurePlates;
        public bool usesDoors;
        public bool usesMovingPlatforms;
        public bool usesAllLightDirections;

        [Header("Estimated Time")]
        public float estimatedPlayTimeMinutes = 3f;

        [Header("Tutorials")]
        public TutorialEntry[] tutorialsInLevel;

        [System.Serializable]
        public class TutorialEntry
        {
            public string id;
            public string message;
            public Vector3 position;
            public float delayBeforeShow;
            public float displayDuration = 5f;
        }
    }
}
