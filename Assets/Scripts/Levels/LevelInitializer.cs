using UnityEngine;
using System.Collections.Generic;

namespace InkMountainBridge
{
    public class LevelInitializer : MonoBehaviour
    {
        public int levelId;
        public List<LevelConfig> allLevelConfigs;

        private LevelController levelController;

        private void Start()
        {
            levelController = FindObjectOfType<LevelController>();
            if (levelController == null) return;

            if (allLevelConfigs == null || allLevelConfigs.Count == 0)
            {
                LevelConfig config = CreateConfigById(levelId);
                if (config != null)
                {
                    levelController.Initialize(config);
                    levelController.StartBuildPhase();
                }
                return;
            }

            LevelConfig found = GetLevelConfig(levelId);
            if (found != null)
            {
                levelController.Initialize(found);
                levelController.StartBuildPhase();
            }
        }

        public LevelConfig GetLevelConfig(int id)
        {
            if (allLevelConfigs == null) return null;

            foreach (var config in allLevelConfigs)
            {
                if (config != null && config.levelId == id)
                {
                    return config;
                }
            }

            return null;
        }

        private LevelConfig CreateConfigById(int id)
        {
            switch (id)
            {
                case 1: return LevelConfig_Tutorial.Create();
                case 2: return LevelConfig_Challenge.Create();
                case 3: return LevelConfig_FailTest.Create();
                default: return null;
            }
        }
    }
}
