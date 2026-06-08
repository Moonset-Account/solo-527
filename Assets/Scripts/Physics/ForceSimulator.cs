using UnityEngine;
using System.Collections.Generic;

namespace InkMountainBridge
{
    public class ForceSimulator : MonoBehaviour
    {
        [SerializeField] private BridgeStructure bridgeStructure;
        [SerializeField] private float gravity = 9.81f;
        [SerializeField] private float caravanLoad;
        [SerializeField] private Vector2 windForce;
        [SerializeField] private float rainWeight;
        [SerializeField] private float simulationSpeed = 1f;

        public void SimulateStep(float dt)
        {
            if (bridgeStructure == null) return;

            float scaledDt = dt * simulationSpeed;

            foreach (var element in bridgeStructure.Elements)
            {
                if (element.IsBroken) continue;

                Vector2 totalForce = Vector2.zero;

                totalForce.y -= gravity * element.Weight;

                totalForce += windForce * element.Weight;

                totalForce.y -= rainWeight * element.Weight;

                element.ApplyForce(totalForce);

                float stressRatio = element.MaxStress > 0f ? element.CurrentStress / element.MaxStress : 0f;
                if (stressRatio > 0.8f)
                {
                    GameEvents.OnStressWarning?.Invoke(stressRatio);
                }
            }
        }

        public void ApplyCaravanLoad(Vector2 position, float weight)
        {
            if (bridgeStructure == null) return;

            caravanLoad += weight;

            foreach (var element in bridgeStructure.Elements)
            {
                if (element.IsBroken) continue;

                Vector2 elementPos = element.transform.position;
                float distance = Vector2.Distance(position, elementPos);

                if (distance < 2f)
                {
                    float influence = 1f - (distance / 2f);
                    Vector2 loadForce = Vector2.down * weight * influence;
                    element.ApplyForce(loadForce);

                    float stressRatio = element.MaxStress > 0f ? element.CurrentStress / element.MaxStress : 0f;
                    if (stressRatio > 0.8f)
                    {
                        GameEvents.OnStressWarning?.Invoke(stressRatio);
                    }
                }
            }
        }

        public void SetWindForce(Vector2 force)
        {
            windForce = force;
        }

        public void SetRainWeight(float weight)
        {
            rainWeight = weight;
        }

        public float GetTotalLoad()
        {
            if (bridgeStructure == null) return 0f;

            float total = 0f;
            foreach (var element in bridgeStructure.Elements)
            {
                if (!element.IsBroken)
                {
                    total += gravity * element.Weight;
                    total += windForce.magnitude * element.Weight;
                    total += rainWeight * element.Weight;
                }
            }
            total += caravanLoad;
            return total;
        }

        private void Update()
        {
            SimulateStep(Time.deltaTime);
        }
    }
}
