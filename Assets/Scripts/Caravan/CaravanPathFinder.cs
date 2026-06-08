using UnityEngine;
using System.Collections.Generic;

namespace InkMountainBridge
{
    public class CaravanPathFinder : MonoBehaviour
    {
        [SerializeField] private Vector2 startPoint;
        [SerializeField] private Vector2 endPoint;
        [SerializeField] private BridgeStructure bridgeStructure;
        [SerializeField] private float stepResolution = 0.5f;

        private List<Vector2> cachedPath = new List<Vector2>();

        public void SetEndpoints(Vector2 start, Vector2 end)
        {
            startPoint = start;
            endPoint = end;
        }

        public List<Vector2> CalculatePath()
        {
            cachedPath.Clear();

            if (bridgeStructure == null) return cachedPath;

            float totalDistance = endPoint.x - startPoint.x;
            int stepCount = Mathf.CeilToInt(totalDistance / stepResolution);

            cachedPath.Add(startPoint);

            for (int i = 1; i <= stepCount; i++)
            {
                float t = (float)i / stepCount;
                float x = Mathf.Lerp(startPoint.x, endPoint.x, t);
                Vector2 surfacePoint = GetBridgeSurfacePoint(x);

                if (surfacePoint.y > float.NegativeInfinity)
                {
                    cachedPath.Add(surfacePoint);
                }
            }

            cachedPath.Add(endPoint);

            return cachedPath;
        }

        public bool IsPathComplete()
        {
            if (cachedPath == null || cachedPath.Count < 2) return false;

            for (int i = 1; i < cachedPath.Count; i++)
            {
                float stepDistance = Vector2.Distance(cachedPath[i - 1], cachedPath[i]);

                if (stepDistance > stepResolution * 2f) return false;
            }

            foreach (var point in cachedPath)
            {
                RaycastHit2D hit = Physics2D.Raycast(point + Vector2.up * 0.5f, Vector2.down, 2f);
                if (hit.collider == null) return false;
            }

            return true;
        }

        public Vector2 GetBridgeSurfacePoint(float x)
        {
            if (bridgeStructure == null || bridgeStructure.Nodes == null || bridgeStructure.Nodes.Count == 0)
            {
                return new Vector2(x, float.NegativeInfinity);
            }

            float closestY = float.NegativeInfinity;

            foreach (var node in bridgeStructure.Nodes)
            {
                if (Mathf.Abs(node.Position.x - x) < stepResolution)
                {
                    if (node.Position.y > closestY)
                    {
                        closestY = node.Position.y;
                    }
                }
            }

            if (closestY > float.NegativeInfinity)
            {
                return new Vector2(x, closestY);
            }

            BridgeNode leftNode = null;
            BridgeNode rightNode = null;
            float leftDist = float.MaxValue;
            float rightDist = float.MaxValue;

            foreach (var node in bridgeStructure.Nodes)
            {
                if (node.Position.x < x)
                {
                    float dist = x - node.Position.x;
                    if (dist < leftDist)
                    {
                        leftDist = dist;
                        leftNode = node;
                    }
                }
                else if (node.Position.x > x)
                {
                    float dist = node.Position.x - x;
                    if (dist < rightDist)
                    {
                        rightDist = dist;
                        rightNode = node;
                    }
                }
            }

            if (leftNode != null && rightNode != null)
            {
                float t = (x - leftNode.Position.x) / (rightNode.Position.x - leftNode.Position.x);
                float y = Mathf.Lerp(leftNode.Position.y, rightNode.Position.y, t);
                return new Vector2(x, y);
            }

            if (leftNode != null) return new Vector2(x, leftNode.Position.y);
            if (rightNode != null) return new Vector2(x, rightNode.Position.y);

            return new Vector2(x, float.NegativeInfinity);
        }
    }
}
