using UnityEngine;

namespace InkMountainBridge
{
    [System.Serializable]
    public class InputRecord
    {
        public double timestamp;
        public string action;
        public Vector2 position;
        public MaterialType materialType;
        public int levelId;
    }
}
