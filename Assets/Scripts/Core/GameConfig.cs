using UnityEngine;
using System;
using System.Collections.Generic;

namespace LakeNavigation
{
    [CreateAssetMenu(fileName = "GameConfig", menuName = "Lake Navigation/Game Config")]
    public class GameConfig : ScriptableObject
    {
        [Header("Grid Settings")]
        public int GridWidth = 20;
        public int GridHeight = 15;
        public float CellSize = 1f;

        [Header("Boat Settings")]
        public float BaseBoatSpeed = 3f;
        public float HeadwindSpeedPenalty = 0.4f;
        public float TailwindSpeedBonus = 0.3f;
        public float StormDamageChance = 0.15f;
        public float CollisionDamageChance = 0.2f;

        [Header("Supply Settings")]
        public float BaseFuelDrainRate = 1f;
        public float BaseFoodDrainRate = 0.5f;
        public float BaseBatteryDrainRate = 2f;
        public float HeadwindFuelMultiplier = 1.5f;
        public float StormFuelMultiplier = 2f;

        [Header("Weather Settings")]
        public float WeatherCheckInterval = 10f;
        public float MinWeatherDuration = 20f;
        public float MaxWeatherDuration = 60f;
        public float ForecastLeadTime = 15f;
        public float FogVisibilityRadius = 3f;
        public float RainVisibilityRadius = 6f;
        public float StormVisibilityRadius = 2f;

        [Header("Scoring")]
        public int BasePhotoScore = 100;
        public float QualityMultiplierPoor = 0.5f;
        public float QualityMultiplierFair = 0.8f;
        public float QualityMultiplierGood = 1f;
        public float QualityMultiplierExcellent = 1.5f;
        public float SpeedBonusThreshold = 0.7f;
        public float SupplyBonusThreshold = 0.5f;

        [Header("UI")]
        public Color ClearWeatherColor = new Color(0.53f, 0.81f, 0.92f, 1f);
        public Color CloudyWeatherColor = new Color(0.65f, 0.73f, 0.78f, 1f);
        public Color FoggyWeatherColor = new Color(0.78f, 0.82f, 0.84f, 1f);
        public Color RainyWeatherColor = new Color(0.45f, 0.55f, 0.65f, 1f);
        public Color StormyWeatherColor = new Color(0.3f, 0.35f, 0.45f, 1f);

        [Header("Audio")]
        public float MainMenuMusicVolume = 0.5f;
        public float GameplayMusicVolume = 0.3f;
        public float SFXVolume = 0.7f;

        public float GetQualityMultiplier(PhotoQuality quality)
        {
            return quality switch
            {
                PhotoQuality.Poor => QualityMultiplierPoor,
                PhotoQuality.Fair => QualityMultiplierFair,
                PhotoQuality.Good => QualityMultiplierGood,
                PhotoQuality.Excellent => QualityMultiplierExcellent,
                _ => QualityMultiplierGood
            };
        }

        public float GetVisibilityRadius(WeatherType weather)
        {
            return weather switch
            {
                WeatherType.Clear => GridWidth,
                WeatherType.Cloudy => GridWidth * 0.8f,
                WeatherType.Foggy => FogVisibilityRadius,
                WeatherType.Rainy => RainVisibilityRadius,
                WeatherType.Stormy => StormVisibilityRadius,
                _ => GridWidth
            };
        }

        public Color GetWeatherColor(WeatherType weather)
        {
            return weather switch
            {
                WeatherType.Clear => ClearWeatherColor,
                WeatherType.Cloudy => CloudyWeatherColor,
                WeatherType.Foggy => FoggyWeatherColor,
                WeatherType.Rainy => RainyWeatherColor,
                WeatherType.Stormy => StormyWeatherColor,
                _ => ClearWeatherColor
            };
        }
    }
}
