using UnityEngine;
using System;
using System.Collections.Generic;

namespace ShadowPlatformer.Level
{
    [Serializable]
    public class LevelData
    {
        public string levelId;
        public string levelName;
        public string sceneName;
        public int order;
        public string tutorialText;
        public bool isCompleted;
        public float bestTime;
        public int deathCount;

        [Header("Light Config")]
        public Light.LightDirection startLightDirection;

        [Header("Mechanics")]
        public string[] introducedMechanics;

        [Header("Difficulty")]
        public float difficultyRating;
        public string[] prerequisiteLevelIds;
    }

    [Serializable]
    public class LevelManifest
    {
        public LevelData[] levels;
    }
}
