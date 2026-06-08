using UnityEngine;
using System.Collections.Generic;

namespace InkMountainBridge
{
    public abstract class BridgeElement : MonoBehaviour
    {
        [SerializeField] protected MaterialType elementType;
        [SerializeField] protected BridgeNode startNode;
        [SerializeField] protected BridgeNode endNode;
        [SerializeField] protected float currentStress;
        [SerializeField] protected float maxStress;
        [SerializeField] protected bool isBroken;
        [SerializeField] protected float weight;

        public MaterialType ElementType => elementType;
        public BridgeNode StartNode => startNode;
        public BridgeNode EndNode => endNode;
        public float CurrentStress => currentStress;
        public float MaxStress => maxStress;
        public bool IsBroken => isBroken;
        public float Weight => weight;

        public void Initialize(BridgeNode start, BridgeNode end, float maxStressValue, float elementWeight)
        {
            startNode = start;
            endNode = end;
            maxStress = maxStressValue;
            weight = elementWeight;
        }

        public abstract float CalculateStress(float appliedForce);
        public abstract void ApplyForce(Vector2 force);
        public abstract void Break();

        public virtual void OnPlaced()
        {
            if (startNode != null) startNode.AddElement(this);
            if (endNode != null) endNode.AddElement(this);
        }

        public virtual void UpdateVisual()
        {
        }
    }
}
