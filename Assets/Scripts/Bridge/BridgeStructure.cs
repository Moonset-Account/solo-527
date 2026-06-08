using UnityEngine;
using System.Collections.Generic;

namespace InkMountainBridge
{
    public class BridgeStructure : MonoBehaviour
    {
        [SerializeField] private List<BridgeNode> nodes = new List<BridgeNode>();
        [SerializeField] private List<BridgeElement> elements = new List<BridgeElement>();
        [SerializeField] private List<BridgeNode> anchorNodes = new List<BridgeNode>();
        [SerializeField] private float gravity = 9.81f;
        [SerializeField] private float physicsDamping = 0.98f;

        private int nextNodeId;
        private Dictionary<Vector2, BridgeNode> nodeLookup = new Dictionary<Vector2, BridgeNode>();

        public List<BridgeNode> Nodes => nodes;
        public List<BridgeElement> Elements => elements;
        public List<BridgeNode> AnchorNodes => anchorNodes;

        public BridgeNode AddNode(Vector2 position, bool isAnchor)
        {
            Vector2 key = new Vector2(
                Mathf.Round(position.x * 10f) / 10f,
                Mathf.Round(position.y * 10f) / 10f
            );

            if (nodeLookup.ContainsKey(key)) return nodeLookup[key];

            GameObject nodeObj = new GameObject($"Node_{nextNodeId}");
            nodeObj.transform.SetParent(transform);
            nodeObj.transform.position = position;

            BridgeNode node = nodeObj.AddComponent<BridgeNode>();
            node.Initialize(nextNodeId, position, isAnchor);
            nextNodeId++;

            nodes.Add(node);
            nodeLookup[key] = node;

            if (isAnchor)
            {
                anchorNodes.Add(node);
            }

            return node;
        }

        public BridgeNode GetOrCreateNode(Vector2 position, bool isAnchor)
        {
            return AddNode(position, isAnchor);
        }

        public void AddElement(BridgeElement element)
        {
            if (elements.Contains(element)) return;
            elements.Add(element);
        }

        public void RemoveElement(BridgeElement element)
        {
            elements.Remove(element);
        }

        public float GetTotalWeight()
        {
            float total = 0f;
            foreach (var element in elements)
            {
                if (!element.IsBroken)
                    total += element.Weight;
            }
            return total;
        }

        public float GetMaxStress()
        {
            float max = 0f;
            foreach (var element in elements)
            {
                if (!element.IsBroken)
                    max = Mathf.Max(max, element.CurrentStress / element.MaxStress);
            }
            return max;
        }

        public bool IsStructurallySound()
        {
            if (anchorNodes.Count < 2) return false;

            foreach (var element in elements)
            {
                if (element.IsBroken) continue;

                if (element.StartNode == null || element.EndNode == null) return false;

                if (element.CurrentStress > element.MaxStress) return false;
            }

            HashSet<BridgeNode> visited = new HashSet<BridgeNode>();
            Queue<BridgeNode> queue = new Queue<BridgeNode>();

            if (anchorNodes.Count > 0)
            {
                queue.Enqueue(anchorNodes[0]);
                visited.Add(anchorNodes[0]);
            }

            while (queue.Count > 0)
            {
                BridgeNode current = queue.Dequeue();
                foreach (var element in current.ConnectedElements)
                {
                    if (element.IsBroken) continue;

                    BridgeNode neighbor = element.StartNode == current ? element.EndNode : element.StartNode;
                    if (neighbor != null && !visited.Contains(neighbor))
                    {
                        visited.Add(neighbor);
                        queue.Enqueue(neighbor);
                    }
                }
            }

            foreach (var anchor in anchorNodes)
            {
                if (!visited.Contains(anchor)) return false;
            }

            return true;
        }

        public void SimulatePhysics(float deltaTime)
        {
            foreach (var element in elements)
            {
                if (element.IsBroken) continue;

                float verticalForce = -gravity * element.Weight;
                Vector2 force = new Vector2(0f, verticalForce);

                element.ApplyForce(force);
                element.UpdateVisual();

                if (element.CurrentStress > 0f && element.CurrentStress / element.MaxStress > 0.8f)
                {
                    GameEvents.OnStressWarning?.Invoke(element.CurrentStress / element.MaxStress);
                }
            }
        }

        public void CollapseAll()
        {
            Vector2 center = Vector2.zero;
            int count = 0;

            foreach (var element in elements)
            {
                if (!element.IsBroken)
                {
                    center += (Vector2)element.transform.position;
                    count++;
                    element.Break();
                }
            }

            if (count > 0)
            {
                center /= count;
                GameEvents.OnBridgeCollapsed?.Invoke(center);
            }
        }

        private void Update()
        {
            SimulatePhysics(Time.deltaTime);
        }
    }
}
