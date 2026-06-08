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

            LevelConfig config = GetLevelConfig(levelId);
            if (config != null && levelController != null)
            {
                levelController.Initialize(config);
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
    }
}
