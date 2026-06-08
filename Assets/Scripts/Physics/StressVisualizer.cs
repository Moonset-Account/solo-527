using UnityEngine;
using System.Collections.Generic;

namespace InkMountainBridge
{
    public class StressVisualizer : MonoBehaviour
    {
        [SerializeField] private Color lowStressColor = Color.green;
        [SerializeField] private Color medStressColor = Color.yellow;
        [SerializeField] private Color highStressColor = Color.red;
        [SerializeField] private Color criticalStressColor = Color.red;
        [SerializeField] private float stressWarningThreshold = 0.8f;
        [SerializeField] private float creakSoundInterval = 2f;

        [SerializeField] private BridgeStructure bridgeStructure;

        private float creakTimer;
        private bool isFlashing;
        private float flashTimer;
        private Dictionary<BridgeElement, Renderer> elementRenderers = new Dictionary<BridgeElement, Renderer>();

        private void Update()
        {
            if (bridgeStructure == null) return;

            creakTimer -= Time.deltaTime;
            flashTimer += Time.deltaTime;

            bool anyHighStress = false;

            foreach (var element in bridgeStructure.Elements)
            {
                if (element.IsBroken) continue;

                float stressRatio = element.MaxStress > 0f ? element.CurrentStress / element.MaxStress : 0f;
                Color targetColor = GetStressColor(stressRatio);

                Renderer renderer = GetOrCreateRenderer(element);
                if (renderer != null)
                {
                    if (stressRatio > 0.95f)
                    {
                        bool flashOn = Mathf.Sin(flashTimer * 10f) > 0f;
                        renderer.material.color = flashOn ? criticalStressColor : Color.black;
                    }
                    else
                    {
                        renderer.material.color = targetColor;
                    }
                }

                if (stressRatio > stressWarningThreshold)
                {
                    anyHighStress = true;
                }
            }

            if (anyHighStress && creakTimer <= 0f)
            {
                PlayCreakSound();
                creakTimer = creakSoundInterval;
            }
        }

        private Color GetStressColor(float ratio)
        {
            if (ratio < 0.4f) return lowStressColor;
            if (ratio < 0.7f) return Color.Lerp(lowStressColor, medStressColor, (ratio - 0.4f) / 0.3f);
            if (ratio < stressWarningThreshold) return Color.Lerp(medStressColor, highStressColor, (ratio - 0.7f) / (stressWarningThreshold - 0.7f));
            return highStressColor;
        }

        private Renderer GetOrCreateRenderer(BridgeElement element)
        {
            if (elementRenderers.TryGetValue(element, out Renderer renderer) && renderer != null)
            {
                return renderer;
            }

            renderer = element.GetComponent<Renderer>();
            if (renderer != null)
            {
                elementRenderers[element] = renderer;
            }
            return renderer;
        }

        private void PlayCreakSound()
        {
            AudioSource source = GetComponent<AudioSource>();
            if (source != null)
            {
                source.Play();
            }
        }
    }
}
