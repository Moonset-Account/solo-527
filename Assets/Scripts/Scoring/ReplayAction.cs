using UnityEngine;

namespace InkMountainBridge
{
    [System.Serializable]
    public class ReplayAction
    {
        public float timestamp;
        public string actionType;
        public Vector2 position;
        public MaterialType materialType;
    }
}
