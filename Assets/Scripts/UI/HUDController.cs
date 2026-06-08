using UnityEngine;
using UnityEngine.UI;

namespace InkMountainBridge
{
    public class HUDController : MonoBehaviour
    {
        public Text budgetText;
        public Slider stressBar;
        public Image weatherIcon;
        public Text timerText;
        public Slider healthBar;
        public Slider staminaBar;

        private void OnEnable()
        {
            GameEvents.OnMaterialUsed += HandleMaterialUsed;
            GameEvents.OnStressWarning += HandleStressWarning;
            GameEvents.OnWeatherChanged += HandleWeatherChanged;
            GameEvents.OnCaravanFailed += HandleCaravanFailed;
        }

        private void OnDisable()
        {
            GameEvents.OnMaterialUsed -= HandleMaterialUsed;
            GameEvents.OnStressWarning -= HandleStressWarning;
            GameEvents.OnWeatherChanged -= HandleWeatherChanged;
            GameEvents.OnCaravanFailed -= HandleCaravanFailed;
        }

        private void HandleMaterialUsed(MaterialType type, int count)
        {
        }

        private void HandleStressWarning(float ratio)
        {
            UpdateStress(ratio);
        }

        private void HandleWeatherChanged(WeatherType weather)
        {
            UpdateWeather(weather);
        }

        private void HandleCaravanFailed(string reason)
        {
        }

        public void UpdateBudget(int used, int total)
        {
            if (budgetText != null)
                budgetText.text = $"{used}/{total}";
        }

        public void UpdateStress(float ratio)
        {
            if (stressBar != null)
                stressBar.value = Mathf.Clamp01(ratio);
        }

        public void UpdateWeather(WeatherType weather)
        {
        }

        public void UpdateTimer(float remaining)
        {
            if (timerText != null)
            {
                int minutes = Mathf.FloorToInt(remaining / 60f);
                int seconds = Mathf.FloorToInt(remaining % 60f);
                timerText.text = $"{minutes:00}:{seconds:00}";
            }
        }

        public void UpdateHealth(float ratio)
        {
            if (healthBar != null)
                healthBar.value = Mathf.Clamp01(ratio);
        }

        public void UpdateStamina(float ratio)
        {
            if (staminaBar != null)
                staminaBar.value = Mathf.Clamp01(ratio);
        }
    }
}
