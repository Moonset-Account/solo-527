using UnityEngine;

namespace ShadowPlatformer.Light
{
    public class LightSourceObject : MonoBehaviour
    {
        public LightDirection sourceDirection;
        public bool isActive = true;
        public float intensity = 1f;
        public Color lightColor = Color.yellow;

        private Light _light;

        private void Awake()
        {
            _light = GetComponent<Light>();
        }

        public void SetActive(bool active)
        {
            isActive = active;
            if (_light != null)
                _light.intensity = active ? intensity : 0f;
        }
    }
}
