using UnityEngine;
using System;

namespace InkMountainBridge
{
    [Serializable]
    public class MaterialBudgetConfig
    {
        public int beamCount;
        public int ropeCount;
        public int pierCount;
        public float maxTotalWeight;
    }

    [CreateAssetMenu(fileName = "LevelConfig", menuName = "InkMountainBridge/Level Config")]
    public class LevelConfig : ScriptableObject
    {
        public int levelId;
        public string levelName;
        public float valleyWidth;
        public float valleyDepth;
        public Vector2[] anchorPoints;
        public MaterialBudgetConfig availableMaterials;
        public WeatherType weatherType;
        public float maxWindForce;
        public float maxRainWeight;
        public float timeLimit;
        public int targetScore;
        public bool isTutorial;
        public bool forceFailOnComplete;
        public string[] tutorialSteps;
        public float caravanWeight;
        public float caravanSpeed;
    }
}
