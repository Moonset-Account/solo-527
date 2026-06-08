using UnityEngine;

namespace InkMountainBridge
{
    [CreateAssetMenu(fileName = "LevelConfig_Challenge", menuName = "InkMountainBridge/Level Config - Challenge")]
    public class LevelConfig_Challenge : LevelConfig
    {
        public static LevelConfig Create()
        {
            LevelConfig config = ScriptableObject.CreateInstance<LevelConfig>();
            config.levelId = 2;
            config.levelName = "云岭险渡";
            config.valleyWidth = 16f;
            config.valleyDepth = 10f;
            config.anchorPoints = new Vector2[] { new Vector2(-8f, 0f), new Vector2(0f, -3f), new Vector2(8f, 0f) };
            config.availableMaterials = new MaterialBudgetConfig
            {
                beamCount = 12,
                ropeCount = 8,
                pierCount = 4,
                maxTotalWeight = 800f
            };
            config.weatherType = WeatherType.Wind;
            config.maxWindForce = 30f;
            config.maxRainWeight = 0f;
            config.timeLimit = 180f;
            config.targetScore = 200;
            config.isTutorial = false;
            config.forceFailOnComplete = false;
            config.tutorialSteps = new string[0];
            config.caravanWeight = 80f;
            config.caravanSpeed = 2.5f;
            return config;
        }
    }
}
