using System.Collections.Generic;
using UnityEngine;

namespace LakeNavigation
{
    public static class LevelPresets
    {
        public static LevelData FirstVoyage()
        {
            var data = ScriptableObject.CreateInstance<LevelData>();
            data.LevelName = "First Voyage";
            data.LevelDescription = "A gentle introduction to lake navigation.";
            data.LevelIndex = 0;
            data.BoatStartPosition = new Vector2(1f, 7f);
            data.BoatStartHealth = 100f;
            data.StartingSupplies = new List<SupplyAmount>
            {
                new SupplyAmount { Type = SupplyType.Fuel, Current = 100f, Max = 100f, DrainRate = 1f },
                new SupplyAmount { Type = SupplyType.Food, Current = 80f, Max = 80f, DrainRate = 0.5f },
                new SupplyAmount { Type = SupplyType.Battery, Current = 100f, Max = 100f, DrainRate = 2f }
            };
            data.PhotoTargets = new List<PhotoTarget>
            {
                new PhotoTarget
                {
                    Id = "heron_01",
                    DisplayName = "Great Blue Heron",
                    Category = CollectionCategory.Bird,
                    GridPosition = new Vector2(8f, 10f),
                    RequiredProximity = 2f,
                    MinQuality = PhotoQuality.Good,
                    IsCompleted = false,
                    IsRequired = true,
                    PreferredWeather = WeatherType.Clear
                }
            };
            data.Objectives = new List<LevelObjective>
            {
                new LevelObjective { Description = "Photograph the Heron", IsRequired = true, IsCompleted = false, ScoreReward = 100 },
                new LevelObjective { Description = "Return to dock", IsRequired = true, IsCompleted = false, ScoreReward = 50 }
            };
            data.TimeLimit = 120f;
            data.WeatherSchedule = new List<WeatherScheduleEntry>
            {
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Clear,
                    Wind = new WindInfo { Direction = WindDirection.West, Speed = 3f, Variance = 0.5f },
                    Duration = 120f,
                    WarningMessage = ""
                }
            };
            data.ObstaclePositions = new List<Vector2>();
            data.SupplyPickupPositions = new List<Vector2>();
            data.DockPositions = new List<Vector2> { new Vector2(0f, 7f), new Vector2(10f, 10f) };
            data.MaxWaypoints = 10;
            data.RequiredStarsToUnlock = 0;
            data.TutorialHint = "Use waypoints to plan your route. Click on the water to add waypoints, then confirm to sail!";
            data.IsTutorialLevel = true;
            return data;
        }

        public static LevelData MistyMorning()
        {
            var data = ScriptableObject.CreateInstance<LevelData>();
            data.LevelName = "Misty Morning";
            data.LevelDescription = "Fog rolls in across the lake. Navigate carefully!";
            data.LevelIndex = 1;
            data.BoatStartPosition = new Vector2(1f, 7f);
            data.BoatStartHealth = 100f;
            data.StartingSupplies = new List<SupplyAmount>
            {
                new SupplyAmount { Type = SupplyType.Fuel, Current = 80f, Max = 80f, DrainRate = 1f },
                new SupplyAmount { Type = SupplyType.Food, Current = 60f, Max = 60f, DrainRate = 0.5f },
                new SupplyAmount { Type = SupplyType.Battery, Current = 80f, Max = 80f, DrainRate = 2f }
            };
            data.PhotoTargets = new List<PhotoTarget>
            {
                new PhotoTarget
                {
                    Id = "swan_01",
                    DisplayName = "Mute Swan",
                    Category = CollectionCategory.Bird,
                    GridPosition = new Vector2(6f, 8f),
                    RequiredProximity = 2f,
                    MinQuality = PhotoQuality.Fair,
                    IsCompleted = false,
                    IsRequired = true,
                    PreferredWeather = WeatherType.Clear
                },
                new PhotoTarget
                {
                    Id = "lily_01",
                    DisplayName = "Water Lily",
                    Category = CollectionCategory.Plant,
                    GridPosition = new Vector2(12f, 5f),
                    RequiredProximity = 1.5f,
                    MinQuality = PhotoQuality.Good,
                    IsCompleted = false,
                    IsRequired = true,
                    PreferredWeather = WeatherType.Foggy
                }
            };
            data.Objectives = new List<LevelObjective>
            {
                new LevelObjective { Description = "Photograph both subjects", IsRequired = true, IsCompleted = false, ScoreReward = 200 },
                new LevelObjective { Description = "Return to dock", IsRequired = true, IsCompleted = false, ScoreReward = 50 }
            };
            data.TimeLimit = 150f;
            data.WeatherSchedule = new List<WeatherScheduleEntry>
            {
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Clear,
                    Wind = new WindInfo { Direction = WindDirection.West, Speed = 5f, Variance = 1f },
                    Duration = 60f,
                    WarningMessage = "Fog approaching"
                },
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Foggy,
                    Wind = new WindInfo { Direction = WindDirection.None, Speed = 2f, Variance = 1f },
                    Duration = 60f,
                    WarningMessage = "Fog clearing"
                },
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Clear,
                    Wind = new WindInfo { Direction = WindDirection.West, Speed = 5f, Variance = 1f },
                    Duration = 30f,
                    WarningMessage = ""
                }
            };
            data.ObstaclePositions = new List<Vector2>();
            data.SupplyPickupPositions = new List<Vector2> { new Vector2(4f, 6f) };
            data.DockPositions = new List<Vector2> { new Vector2(0f, 7f), new Vector2(14f, 5f) };
            data.MaxWaypoints = 15;
            data.RequiredStarsToUnlock = 0;
            data.TutorialHint = "Watch the weather forecast! Fog will reduce visibility significantly.";
            data.IsTutorialLevel = false;
            return data;
        }

        public static LevelData WindyCrossing()
        {
            var data = ScriptableObject.CreateInstance<LevelData>();
            data.LevelName = "Windy Crossing";
            data.LevelDescription = "Strong winds make for challenging navigation.";
            data.LevelIndex = 2;
            data.BoatStartPosition = new Vector2(2f, 2f);
            data.BoatStartHealth = 100f;
            data.StartingSupplies = new List<SupplyAmount>
            {
                new SupplyAmount { Type = SupplyType.Fuel, Current = 90f, Max = 90f, DrainRate = 1.2f },
                new SupplyAmount { Type = SupplyType.Food, Current = 70f, Max = 70f, DrainRate = 0.6f },
                new SupplyAmount { Type = SupplyType.Battery, Current = 80f, Max = 80f, DrainRate = 2.2f }
            };
            data.PhotoTargets = new List<PhotoTarget>
            {
                new PhotoTarget
                {
                    Id = "eagle_01",
                    DisplayName = "Bald Eagle",
                    Category = CollectionCategory.Bird,
                    GridPosition = new Vector2(8f, 10f),
                    RequiredProximity = 2f,
                    MinQuality = PhotoQuality.Good,
                    IsCompleted = false,
                    IsRequired = true,
                    PreferredWeather = WeatherType.Cloudy
                },
                new PhotoTarget
                {
                    Id = "deer_01",
                    DisplayName = "White-tailed Deer",
                    Category = CollectionCategory.Mammal,
                    GridPosition = new Vector2(14f, 6f),
                    RequiredProximity = 2.5f,
                    MinQuality = PhotoQuality.Fair,
                    IsCompleted = false,
                    IsRequired = true,
                    PreferredWeather = WeatherType.Clear
                },
                new PhotoTarget
                {
                    Id = "lighthouse_01",
                    DisplayName = "Old Lighthouse",
                    Category = CollectionCategory.Landmark,
                    GridPosition = new Vector2(16f, 12f),
                    RequiredProximity = 3f,
                    MinQuality = PhotoQuality.Good,
                    IsCompleted = false,
                    IsRequired = false,
                    PreferredWeather = WeatherType.Rainy
                }
            };
            data.Objectives = new List<LevelObjective>
            {
                new LevelObjective { Description = "Photograph all three subjects", IsRequired = true, IsCompleted = false, ScoreReward = 300 },
                new LevelObjective { Description = "Navigate through obstacles safely", IsRequired = true, IsCompleted = false, ScoreReward = 150 },
                new LevelObjective { Description = "Return to dock", IsRequired = true, IsCompleted = false, ScoreReward = 50 }
            };
            data.TimeLimit = 180f;
            data.WeatherSchedule = new List<WeatherScheduleEntry>
            {
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Cloudy,
                    Wind = new WindInfo { Direction = WindDirection.East, Speed = 8f, Variance = 2f },
                    Duration = 60f,
                    WarningMessage = "Rain approaching"
                },
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Rainy,
                    Wind = new WindInfo { Direction = WindDirection.East, Speed = 10f, Variance = 2f },
                    Duration = 60f,
                    WarningMessage = "Storm brewing"
                },
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Stormy,
                    Wind = new WindInfo { Direction = WindDirection.East, Speed = 12f, Variance = 3f },
                    Duration = 30f,
                    WarningMessage = "Storm subsiding"
                },
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Rainy,
                    Wind = new WindInfo { Direction = WindDirection.East, Speed = 8f, Variance = 2f },
                    Duration = 30f,
                    WarningMessage = ""
                }
            };
            data.ObstaclePositions = new List<Vector2>
            {
                new Vector2(5f, 5f),
                new Vector2(10f, 8f),
                new Vector2(15f, 3f)
            };
            data.SupplyPickupPositions = new List<Vector2> { new Vector2(7f, 7f), new Vector2(12f, 4f) };
            data.DockPositions = new List<Vector2> { new Vector2(1f, 2f), new Vector2(18f, 12f) };
            data.MaxWaypoints = 15;
            data.RequiredStarsToUnlock = 1;
            data.TutorialHint = "Strong winds affect your speed and fuel consumption. Plan your route wisely!";
            data.IsTutorialLevel = false;
            return data;
        }

        public static LevelData StormChase()
        {
            var data = ScriptableObject.CreateInstance<LevelData>();
            data.LevelName = "Storm Chase";
            data.LevelDescription = "Brave the storm to capture rare weather phenomena.";
            data.LevelIndex = 3;
            data.BoatStartPosition = new Vector2(1f, 12f);
            data.BoatStartHealth = 100f;
            data.StartingSupplies = new List<SupplyAmount>
            {
                new SupplyAmount { Type = SupplyType.Fuel, Current = 70f, Max = 70f, DrainRate = 1.5f },
                new SupplyAmount { Type = SupplyType.Food, Current = 50f, Max = 50f, DrainRate = 0.8f },
                new SupplyAmount { Type = SupplyType.Battery, Current = 60f, Max = 60f, DrainRate = 2.5f }
            };
            data.PhotoTargets = new List<PhotoTarget>
            {
                new PhotoTarget
                {
                    Id = "cormorant_01",
                    DisplayName = "Cormorant",
                    Category = CollectionCategory.Bird,
                    GridPosition = new Vector2(6f, 4f),
                    RequiredProximity = 2f,
                    MinQuality = PhotoQuality.Good,
                    IsCompleted = false,
                    IsRequired = true,
                    PreferredWeather = WeatherType.Clear
                },
                new PhotoTarget
                {
                    Id = "lightning_01",
                    DisplayName = "Lightning Strike",
                    Category = CollectionCategory.WeatherEvent,
                    GridPosition = new Vector2(10f, 10f),
                    RequiredProximity = 4f,
                    MinQuality = PhotoQuality.Fair,
                    IsCompleted = false,
                    IsRequired = true,
                    PreferredWeather = WeatherType.Stormy
                },
                new PhotoTarget
                {
                    Id = "flooded_dock_01",
                    DisplayName = "Flooded Dock",
                    Category = CollectionCategory.Landmark,
                    GridPosition = new Vector2(14f, 8f),
                    RequiredProximity = 2.5f,
                    MinQuality = PhotoQuality.Good,
                    IsCompleted = false,
                    IsRequired = false,
                    PreferredWeather = WeatherType.Rainy
                }
            };
            data.Objectives = new List<LevelObjective>
            {
                new LevelObjective { Description = "Photograph all three subjects", IsRequired = true, IsCompleted = false, ScoreReward = 300 },
                new LevelObjective { Description = "Capture the storm", IsRequired = true, IsCompleted = false, ScoreReward = 200 },
                new LevelObjective { Description = "Return to dock", IsRequired = true, IsCompleted = false, ScoreReward = 50 }
            };
            data.TimeLimit = 200f;
            data.WeatherSchedule = new List<WeatherScheduleEntry>
            {
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Clear,
                    Wind = new WindInfo { Direction = WindDirection.South, Speed = 4f, Variance = 1f },
                    Duration = 40f,
                    WarningMessage = "Clouds gathering"
                },
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Cloudy,
                    Wind = new WindInfo { Direction = WindDirection.South, Speed = 6f, Variance = 2f },
                    Duration = 30f,
                    WarningMessage = "Rain approaching"
                },
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Rainy,
                    Wind = new WindInfo { Direction = WindDirection.SouthEast, Speed = 8f, Variance = 2f },
                    Duration = 40f,
                    WarningMessage = "Storm incoming!"
                },
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Stormy,
                    Wind = new WindInfo { Direction = WindDirection.SouthEast, Speed = 12f, Variance = 3f },
                    Duration = 30f,
                    WarningMessage = "Storm passing"
                },
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Rainy,
                    Wind = new WindInfo { Direction = WindDirection.South, Speed = 6f, Variance = 2f },
                    Duration = 30f,
                    WarningMessage = "Clearing up"
                },
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Clear,
                    Wind = new WindInfo { Direction = WindDirection.South, Speed = 4f, Variance = 1f },
                    Duration = 30f,
                    WarningMessage = ""
                }
            };
            data.ObstaclePositions = new List<Vector2>
            {
                new Vector2(4f, 6f),
                new Vector2(8f, 3f),
                new Vector2(12f, 9f),
                new Vector2(16f, 5f),
                new Vector2(9f, 12f)
            };
            data.SupplyPickupPositions = new List<Vector2> { new Vector2(5f, 8f), new Vector2(11f, 5f), new Vector2(15f, 10f) };
            data.DockPositions = new List<Vector2> { new Vector2(0f, 12f), new Vector2(18f, 8f) };
            data.MaxWaypoints = 20;
            data.RequiredStarsToUnlock = 3;
            data.TutorialHint = "Storms deal damage to your boat. Try to avoid the worst weather when possible.";
            data.IsTutorialLevel = false;
            return data;
        }

        public static LevelData TheGrandTour()
        {
            var data = ScriptableObject.CreateInstance<LevelData>();
            data.LevelName = "The Grand Tour";
            data.LevelDescription = "The ultimate challenge across the entire lake.";
            data.LevelIndex = 4;
            data.BoatStartPosition = new Vector2(1f, 1f);
            data.BoatStartHealth = 100f;
            data.StartingSupplies = new List<SupplyAmount>
            {
                new SupplyAmount { Type = SupplyType.Fuel, Current = 60f, Max = 60f, DrainRate = 1.5f },
                new SupplyAmount { Type = SupplyType.Food, Current = 40f, Max = 40f, DrainRate = 0.8f },
                new SupplyAmount { Type = SupplyType.Battery, Current = 50f, Max = 50f, DrainRate = 2.5f }
            };
            data.PhotoTargets = new List<PhotoTarget>
            {
                new PhotoTarget
                {
                    Id = "kingfisher_01",
                    DisplayName = "Kingfisher",
                    Category = CollectionCategory.Bird,
                    GridPosition = new Vector2(5f, 3f),
                    RequiredProximity = 1.5f,
                    MinQuality = PhotoQuality.Good,
                    IsCompleted = false,
                    IsRequired = true,
                    PreferredWeather = WeatherType.Clear
                },
                new PhotoTarget
                {
                    Id = "otter_01",
                    DisplayName = "River Otter",
                    Category = CollectionCategory.Mammal,
                    GridPosition = new Vector2(15f, 5f),
                    RequiredProximity = 2f,
                    MinQuality = PhotoQuality.Good,
                    IsCompleted = false,
                    IsRequired = true,
                    PreferredWeather = WeatherType.Clear
                },
                new PhotoTarget
                {
                    Id = "ruins_01",
                    DisplayName = "Ancient Ruins",
                    Category = CollectionCategory.Landmark,
                    GridPosition = new Vector2(18f, 12f),
                    RequiredProximity = 3f,
                    MinQuality = PhotoQuality.Fair,
                    IsCompleted = false,
                    IsRequired = true,
                    PreferredWeather = WeatherType.Cloudy
                },
                new PhotoTarget
                {
                    Id = "waterspout_01",
                    DisplayName = "Waterspout",
                    Category = CollectionCategory.WeatherEvent,
                    GridPosition = new Vector2(10f, 10f),
                    RequiredProximity = 4f,
                    MinQuality = PhotoQuality.Fair,
                    IsCompleted = false,
                    IsRequired = false,
                    PreferredWeather = WeatherType.Stormy
                }
            };
            data.Objectives = new List<LevelObjective>
            {
                new LevelObjective { Description = "Photograph all four subjects", IsRequired = true, IsCompleted = false, ScoreReward = 400 },
                new LevelObjective { Description = "Collect all supply pickups", IsRequired = false, IsCompleted = false, ScoreReward = 200 },
                new LevelObjective { Description = "Return to dock", IsRequired = true, IsCompleted = false, ScoreReward = 50 }
            };
            data.TimeLimit = 240f;
            data.WeatherSchedule = new List<WeatherScheduleEntry>
            {
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Clear,
                    Wind = new WindInfo { Direction = WindDirection.North, Speed = 3f, Variance = 1f },
                    Duration = 30f,
                    WarningMessage = "Clouds approaching"
                },
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Cloudy,
                    Wind = new WindInfo { Direction = WindDirection.NorthEast, Speed = 5f, Variance = 2f },
                    Duration = 30f,
                    WarningMessage = "Fog rolling in"
                },
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Foggy,
                    Wind = new WindInfo { Direction = WindDirection.None, Speed = 2f, Variance = 1f },
                    Duration = 40f,
                    WarningMessage = "Rain on the way"
                },
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Rainy,
                    Wind = new WindInfo { Direction = WindDirection.East, Speed = 8f, Variance = 2f },
                    Duration = 35f,
                    WarningMessage = "Storm incoming!"
                },
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Stormy,
                    Wind = new WindInfo { Direction = WindDirection.East, Speed = 12f, Variance = 3f },
                    Duration = 25f,
                    WarningMessage = "Storm passing"
                },
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Clear,
                    Wind = new WindInfo { Direction = WindDirection.West, Speed = 4f, Variance = 1f },
                    Duration = 40f,
                    WarningMessage = "Clouds returning"
                },
                new WeatherScheduleEntry
                {
                    Weather = WeatherType.Cloudy,
                    Wind = new WindInfo { Direction = WindDirection.West, Speed = 6f, Variance = 2f },
                    Duration = 40f,
                    WarningMessage = ""
                }
            };
            data.ObstaclePositions = new List<Vector2>
            {
                new Vector2(3f, 5f),
                new Vector2(7f, 8f),
                new Vector2(11f, 3f),
                new Vector2(14f, 10f),
                new Vector2(17f, 7f),
                new Vector2(5f, 12f),
                new Vector2(9f, 6f),
                new Vector2(13f, 2f)
            };
            data.SupplyPickupPositions = new List<Vector2>
            {
                new Vector2(6f, 6f),
                new Vector2(12f, 8f),
                new Vector2(16f, 4f)
            };
            data.DockPositions = new List<Vector2> { new Vector2(0f, 1f), new Vector2(19f, 14f) };
            data.MaxWaypoints = 25;
            data.RequiredStarsToUnlock = 5;
            data.TutorialHint = "This is the ultimate challenge. Manage your supplies carefully and watch the weather!";
            data.IsTutorialLevel = false;
            return data;
        }
    }
}
