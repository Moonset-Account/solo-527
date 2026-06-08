using UnityEngine;

namespace InkMountainBridge
{
    public class WeatherParticleController : MonoBehaviour
    {
        [SerializeField] private ParticleSystem rainParticleSystem;
        [SerializeField] private ParticleSystem windParticleSystem;
        [SerializeField] private ParticleSystem stormParticleSystem;
        [SerializeField] private ParticleSystem inkSplashEffect;

        public void PlayWeatherEffect(WeatherType type)
        {
            switch (type)
            {
                case WeatherType.Rain:
                    if (rainParticleSystem != null && !rainParticleSystem.isPlaying) rainParticleSystem.Play();
                    break;
                case WeatherType.Wind:
                    if (windParticleSystem != null && !windParticleSystem.isPlaying) windParticleSystem.Play();
                    break;
                case WeatherType.Storm:
                    if (stormParticleSystem != null && !stormParticleSystem.isPlaying) stormParticleSystem.Play();
                    if (rainParticleSystem != null && !rainParticleSystem.isPlaying) rainParticleSystem.Play();
                    if (windParticleSystem != null && !windParticleSystem.isPlaying) windParticleSystem.Play();
                    if (inkSplashEffect != null && !inkSplashEffect.isPlaying) inkSplashEffect.Play();
                    break;
            }
        }

        public void StopWeatherEffect(WeatherType type)
        {
            switch (type)
            {
                case WeatherType.Clear:
                    if (rainParticleSystem != null && rainParticleSystem.isPlaying) rainParticleSystem.Stop();
                    if (windParticleSystem != null && windParticleSystem.isPlaying) windParticleSystem.Stop();
                    if (stormParticleSystem != null && stormParticleSystem.isPlaying) stormParticleSystem.Stop();
                    if (inkSplashEffect != null && inkSplashEffect.isPlaying) inkSplashEffect.Stop();
                    break;
                case WeatherType.Rain:
                    if (rainParticleSystem != null && rainParticleSystem.isPlaying) rainParticleSystem.Stop();
                    break;
                case WeatherType.Wind:
                    if (windParticleSystem != null && windParticleSystem.isPlaying) windParticleSystem.Stop();
                    break;
                case WeatherType.Storm:
                    if (stormParticleSystem != null && stormParticleSystem.isPlaying) stormParticleSystem.Stop();
                    if (rainParticleSystem != null && rainParticleSystem.isPlaying) rainParticleSystem.Stop();
                    if (windParticleSystem != null && windParticleSystem.isPlaying) windParticleSystem.Stop();
                    if (inkSplashEffect != null && inkSplashEffect.isPlaying) inkSplashEffect.Stop();
                    break;
            }
        }

        public void SetRainIntensity(float intensity)
        {
            intensity = Mathf.Clamp01(intensity);
            if (rainParticleSystem == null) return;

            var emission = rainParticleSystem.emission;
            emission.rateOverTime = Mathf.Lerp(10f, 200f, intensity);

            var main = rainParticleSystem.main;
            main.startSpeed = Mathf.Lerp(2f, 8f, intensity);
            main.startColor = new Color(0.6f, 0.65f, 0.75f, Mathf.Lerp(0.2f, 0.7f, intensity));
        }

        public void SetWindDirection(Vector2 direction)
        {
            if (windParticleSystem == null) return;

            var shape = windParticleSystem.shape;
            shape.rotation = new Vector3(0f, 0f, Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg);

            var velocityOverLifetime = windParticleSystem.velocityOverLifetime;
            velocityOverLifetime.x = direction.normalized.x * 3f;
            velocityOverLifetime.y = direction.normalized.y * 3f;
        }

        public void SetStormIntensity(float intensity)
        {
            intensity = Mathf.Clamp01(intensity);
            if (stormParticleSystem == null) return;

            var emission = stormParticleSystem.emission;
            emission.rateOverTime = Mathf.Lerp(20f, 300f, intensity);

            var main = stormParticleSystem.main;
            main.startSpeed = Mathf.Lerp(3f, 12f, intensity);
            main.startSize = Mathf.Lerp(0.3f, 1.5f, intensity);

            if (inkSplashEffect != null)
            {
                var inkEmission = inkSplashEffect.emission;
                inkEmission.rateOverTime = Mathf.Lerp(5f, 50f, intensity);

                var inkMain = inkSplashEffect.main;
                inkMain.startColor = new Color(0.1f, 0.1f, 0.15f, Mathf.Lerp(0.3f, 0.8f, intensity));
                inkMain.startSize = Mathf.Lerp(0.5f, 2f, intensity);
            }
        }
    }
}
