using UnityEngine;
using System.Collections.Generic;

namespace InkMountainBridge
{
    public class BridgeNode : MonoBehaviour
    {
        [SerializeField] private int nodeId;
        [SerializeField] private Vector2 position;
        [SerializeField] private bool isAnchor;
        [SerializeField] private List<BridgeElement> connectedElements = new List<BridgeElement>();
        [SerializeField] private int maxConnections = 4;

        public int NodeId => nodeId;
        public Vector2 Position => position;
        public bool IsAnchor => isAnchor;
        public List<BridgeElement> ConnectedElements => connectedElements;
        public int MaxConnections => maxConnections;

        public void Initialize(int id, Vector2 nodePosition, bool anchor, int connections = 4)
        {
            nodeId = id;
            position = nodePosition;
            isAnchor = anchor;
            maxConnections = connections;
            transform.position = nodePosition;
        }

        public bool AddElement(BridgeElement element)
        {
            if (connectedElements.Count >= maxConnections) return false;
            if (connectedElements.Contains(element)) return false;
            connectedElements.Add(element);
            return true;
        }

        public void RemoveElement(BridgeElement element)
        {
            connectedElements.Remove(element);
        }

        public float GetStressLevel()
        {
            if (connectedElements.Count == 0) return 0f;
            float totalStress = 0f;
            foreach (var element in connectedElements)
            {
                if (!element.IsBroken)
                    totalStress += element.CurrentStress / element.MaxStress;
            }
            return totalStress / connectedElements.Count;
        }
    }
}
