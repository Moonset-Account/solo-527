using UnityEngine;
using System;
using System.Collections.Generic;
using System.Linq;

namespace ShadowPlatformer.Level
{
    [Serializable]
    public class PlatformConfig
    {
        public string id;
        public Vector2 position;
        public Vector2 size = new Vector2(2f, 0.5f);
        public bool isShadowPlatform;
        public Light.LightDirection shadowDirection;
        public Light.ShadowVisibility shadowVisibility;
    }

    [Serializable]
    public class TriggerConfig
    {
        public string id;
        public Mechanisms.TriggerType type;
        public Vector2 position;
        public bool isOneShot;
        public float timedDuration;
        public Light.LightDirection requiredLightDirection;
    }

    [Serializable]
    public class ReceiverConfig
    {
        public string id;
        public string[] requiredTriggerIds;
        public bool requireAllTriggers = true;
        public Vector2 position;
        public bool isDoor;
        public bool doorOpenByDefault;
        public bool isMovingPlatform;
        public Vector2 moveTargetOffset;
        public float moveSpeed = 2f;
    }

    [Serializable]
    public class HazardConfig
    {
        public string id;
        public Vector2 position;
        public Vector2 size;
        public bool instantKill = true;
    }

    [Serializable]
    public class CheckpointConfig
    {
        public string id;
        public Vector2 position;
    }

    [Serializable]
    public class LevelLayout
    {
        public string levelId;
        public Vector2 playerSpawn = new Vector2(0f, 1f);
        public Vector2 levelExitPosition;
        public Light.LightDirection startLightDirection = Light.LightDirection.Right;
        public PlatformConfig[] platforms;
        public TriggerConfig[] triggers;
        public ReceiverConfig[] receivers;
        public HazardConfig[] hazards;
        public CheckpointConfig[] checkpoints;
        public string[] requiredTriggerIdsForExit;
    }
}
