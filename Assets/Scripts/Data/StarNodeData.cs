using System.Collections.Generic;
using UnityEngine;

namespace SpaceCourier.Data
{
    [CreateAssetMenu(fileName = "StarNodeData", menuName = "SpaceCourier/StarNode")]
    public class StarNodeData : ScriptableObject
    {
        public int NodeId;
        public string NodeName;
        public string Description;
        public Vector2 Position;
        public NodeType Type;
        public NodeDangerLevel DangerLevel;
        public int RefuelCost = 2;
        public List<int> ConnectedNodeIds = new List<int>();
        public bool HasFuelStation;
        public Sprite NodeIcon;
        public Color NodeColor = Color.white;
    }

    public enum NodeType
    {
        Station,
        Planet,
        Outpost,
        Wormhole,
        Asteroid,
        Derelict
    }

    public enum NodeDangerLevel
    {
        Safe,
        Low,
        Medium,
        High,
        Extreme
    }
}
