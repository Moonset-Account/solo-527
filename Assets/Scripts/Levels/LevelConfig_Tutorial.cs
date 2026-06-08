using UnityEngine;

namespace InkMountainBridge
{
    [CreateAssetMenu(fileName = "LevelConfig_Tutorial", menuName = "InkMountainBridge/Level Config - Tutorial")]
    public class LevelConfig_Tutorial : LevelConfig
    {
        public static LevelConfig Create()
        {
            LevelConfig config = ScriptableObject.CreateInstance<LevelConfig>();
            config.levelId = 1;
            config.levelName = "山径初学";
            config.valleyWidth = 8f;
            config.valleyDepth = 4f;
            config.anchorPoints = new Vector2[] { new Vector2(-4f, 0f), new Vector2(4f, 0f) };
            config.availableMaterials = new MaterialBudgetConfig
            {
                beamCount = 10,
                ropeCount = 5,
                pierCount = 3,
                maxTotalWeight = 500f
            };
            config.weatherType = WeatherType.Clear;
            config.maxWindForce = 0f;
            config.maxRainWeight = 0f;
            config.timeLimit = 0f;
            config.targetScore = 100;
            config.isTutorial = true;
            config.forceFailOnComplete = false;
            config.tutorialSteps = new string[]
            {
                "欢迎来到水墨山路修桥记！学会用木梁、绳索和石墩搭桥",
                "点击并拖拽放置木梁——木梁承受拉力和压力",
                "用绳索连接两点——绳索只能承受拉力",
                "在下方放置石墩作为支撑柱",
                "按下测试按钮，让商队通过你的桥梁！"
            };
            config.caravanWeight = 50f;
            config.caravanSpeed = 3f;
            return config;
        }
    }
}
