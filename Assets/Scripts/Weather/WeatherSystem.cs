using UnityEngine;
using System.Collections.Generic;

namespace InkMountainBridge
{
    public class WeatherSystem : MonoBehaviour
    {
        [SerializeField] private WeatherType currentWeather;
        [SerializeField] private Vector2 windDirection = Vector2.right;
        [SerializeField] private float windStrength;
        [SerializeField] private float rainIntensity;
        [SerializeField] private float stormTimer;
        [SerializeField] private float weatherTransitionDuration = 2f;
        [SerializeField] private ForceSimulator forceSimulator;

        private Dictionary<WeatherType, ParticleSystem> particleSystems = new Dictionary<WeatherType, ParticleSystem>();

        private WeatherType targetWeather;
        private float transitionProgress = 1f;
        private float targetWindStrength;
        private float targetRainIntensity;
        private Vector2 targetWindDirection;
        private float previousWindStrength;
        private float previousRainIntensity;
        private Vector2 previousWindDirection;
        private float stormBurstInterval = 3f;
        private float stormBurstTimer;
        private LevelConfig activeLevelConfig;

        public WeatherType CurrentWeather => currentWeather;

        public void Initialize(LevelConfig config)
        {
            activeLevelConfig = config;
            stormBurstInterval = 3f;
        }

        public void SetWeather(WeatherType type)
        {
            if (targetWeather == type && transitionProgress >= 1f) return;

            previousWindStrength = windStrength;
            previousRainIntensity = rainIntensity;
            previousWindDirection = windDirection;

            targetWeather = type;
            transitionProgress = 0f;

            switch (type)
            {
                case WeatherType.Clear:
                    targetWindStrength = 0f;
                    targetRainIntensity = 0f;
                    break;
                case WeatherType.Rain:
                    targetWindStrength = 0f;
                    targetRainIntensity = activeLevelConfig != null ? activeLevelConfig.maxRainWeight : 0.5f;
                    break;
                case WeatherType.Wind:
                    targetWindStrength = activeLevelConfig != null ? activeLevelConfig.maxWindForce : 1f;
                    targetRainIntensity = 0f;
                    targetWindDirection = windDirection.normalized;
                    break;
                case WeatherType.Storm:
                    targetWindStrength = activeLevelConfig != null ? activeLevelConfig.maxWindForce : 1.5f;
                    targetRainIntensity = activeLevelConfig != null ? activeLevelConfig.maxRainWeight : 0.8f;
                    targetWindDirection = windDirection.normalized;
                    stormBurstTimer = stormBurstInterval;
                    break;
            }

            currentWeather = type;
            GameEvents.OnWeatherChanged?.Invoke(type);
        }

        public void UpdateWeather(float dt)
        {
            if (transitionProgress < 1f)
            {
                transitionProgress += dt / weatherTransitionDuration;
                if (transitionProgress >= 1f)
                {
                    transitionProgress = 1f;
                }

                float t = Mathf.SmoothStep(0f, 1f, transitionProgress);
                windStrength = Mathf.Lerp(previousWindStrength, targetWindStrength, t);
                rainIntensity = Mathf.Lerp(previousRainIntensity, targetRainIntensity, t);
                windDirection = Vector2.Lerp(previousWindDirection, targetWindDirection, t);
            }

            if (forceSimulator != null)
            {
                forceSimulator.SetWindForce(GetWindForce());
                forceSimulator.SetRainWeight(rainIntensity);
            }

            if (currentWeather == WeatherType.Storm)
            {
                stormBurstTimer -= dt;
                if (stormBurstTimer <= 0f)
                {
                    TriggerStormBurst();
                    stormBurstTimer = stormBurstInterval;
                }
            }
        }

        public Vector2 GetWindForce()
        {
            return windDirection.normalized * windStrength;
        }

        public float GetRainWeightMultiplier()
        {
            return rainIntensity;
        }

        public void TriggerStormBurst()
        {
            if (currentWeather != WeatherType.Storm) return;

            float burstMultiplier = 2.5f;
            Vector2 burstForce = windDirection.normalized * windStrength * burstMultiplier;
            float burstRain = rainIntensity * burstMultiplier;

            if (forceSimulator != null)
            {
                forceSimulator.SetWindForce(burstForce);
                forceSimulator.SetRainWeight(burstRain);
            }
        }

        public void RegisterParticleSystem(WeatherType type, ParticleSystem ps)
        {
            if (!particleSystems.ContainsKey(type))
            {
                particleSystems.Add(type, ps);
            }
            else
            {
                particleSystems[type] = ps;
            }
        }

        private void Update()
        {
            UpdateWeather(Time.deltaTime);
        }
    }
}
