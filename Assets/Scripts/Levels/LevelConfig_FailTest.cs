using UnityEngine;

namespace InkMountainBridge
{
    [CreateAssetMenu(fileName = "LevelConfig_FailTest", menuName = "InkMountainBridge/Level Config - Fail Test")]
    public class LevelConfig_FailTest : LevelConfig
    {
        public static LevelConfig Create()
        {
            LevelConfig config = ScriptableObject.CreateInstance<LevelConfig>();
            config.levelId = 3;
            config.levelName = "断桥危崖";
            config.valleyWidth = 20f;
            config.valleyDepth = 12f;
            config.anchorPoints = new Vector2[] { new Vector2(-10f, 0f), new Vector2(10f, 0f) };
            config.availableMaterials = new MaterialBudgetConfig
            {
                beamCount = 3,
                ropeCount = 2,
                pierCount = 1,
                maxTotalWeight = 150f
            };
            config.weatherType = WeatherType.Storm;
            config.maxWindForce = 60f;
            config.maxRainWeight = 40f;
            config.timeLimit = 60f;
            config.targetScore = 999;
            config.isTutorial = false;
            config.forceFailOnComplete = true;
            config.tutorialSteps = new string[]
            {
                "这座桥注定会塌——故意体验失败流程",
                "材料远远不够，天气极其恶劣",
                "观察桥梁应力和崩溃动画",
                "体验失败提示和重试流程"
            };
            config.caravanWeight = 120f;
            config.caravanSpeed = 2f;
            return config;
        }
    }
}
