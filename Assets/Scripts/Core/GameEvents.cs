using UnityEngine;

public enum WeatherType
{
    Clear,
    Cloudy,
    Fog,
    Rain,
    Storm,
    Snow
}

public enum SupplyType
{
    Fuel,
    Food,
    Film
}

public static class GameEvents
{
    public static event System.Action<WeatherType, float, float, float> WeatherChanged;
    public static event System.Action<WeatherType, float> WeatherWarning;
    public static event System.Action<Vector2, float> BoatMoved;
    public static event System.Action<int> RoutePointReached;
    public static event System.Action<SupplyType, float> SupplyConsumed;
    public static event System.Action<SupplyType> SupplyDepleted;
    public static event System.Action<string, int> MissionPhotoTaken;
    public static event System.Action<string, int> MissionCompleted;
    public static event System.Action<string, int> LevelCompleted;
    public static event System.Action<string> CollectionItemUnlocked;
    public static event System.Action<bool> GamePaused;
    public static event System.Action<string> SceneLoadRequested;
    public static event System.Action<string, float> AudioTriggerRequested;
    public static event System.Action<string> InputActionTriggered;
    public static event System.Action SaveRequested;
    public static event System.Action LoadRequested;
    public static event System.Action<string> PhotoTargetInRange;
    public static event System.Action<string> PhotoTargetOutOfRange;
    public static event System.Action<string> LevelStarted;

    public static void TriggerWeatherChanged(WeatherType type, float windSpeed, float windAngle, float visibility)
    {
        WeatherChanged?.Invoke(type, windSpeed, windAngle, visibility);
    }

    public static void TriggerWeatherWarning(WeatherType incoming, float secondsUntil)
    {
        WeatherWarning?.Invoke(incoming, secondsUntil);
    }

    public static void TriggerBoatMoved(Vector2 position, float heading)
    {
        BoatMoved?.Invoke(position, heading);
    }

    public static void TriggerRoutePointReached(int index)
    {
        RoutePointReached?.Invoke(index);
    }

    public static void TriggerSupplyConsumed(SupplyType type, float amount)
    {
        SupplyConsumed?.Invoke(type, amount);
    }

    public static void TriggerSupplyDepleted(SupplyType type)
    {
        SupplyDepleted?.Invoke(type);
    }

    public static void TriggerMissionPhotoTaken(string photoId, int quality)
    {
        MissionPhotoTaken?.Invoke(photoId, quality);
    }

    public static void TriggerMissionCompleted(string missionId, int score)
    {
        MissionCompleted?.Invoke(missionId, score);
    }

    public static void TriggerLevelCompleted(string levelId, int totalScore)
    {
        LevelCompleted?.Invoke(levelId, totalScore);
    }

    public static void TriggerCollectionItemUnlocked(string itemId)
    {
        CollectionItemUnlocked?.Invoke(itemId);
    }

    public static void TriggerGamePaused(bool paused)
    {
        GamePaused?.Invoke(paused);
    }

    public static void TriggerSceneLoadRequested(string sceneName)
    {
        SceneLoadRequested?.Invoke(sceneName);
    }

    public static void TriggerAudioTriggerRequested(string clipId, float volume)
    {
        AudioTriggerRequested?.Invoke(clipId, volume);
    }

    public static void TriggerInputActionTriggered(string actionName)
    {
        InputActionTriggered?.Invoke(actionName);
    }

    public static void TriggerSaveRequested()
    {
        SaveRequested?.Invoke();
    }

    public static void TriggerLoadRequested()
    {
        LoadRequested?.Invoke();
    }

    public static void TriggerPhotoTargetInRange(string targetId)
    {
        PhotoTargetInRange?.Invoke(targetId);
    }

    public static void TriggerPhotoTargetOutOfRange(string targetId)
    {
        PhotoTargetOutOfRange?.Invoke(targetId);
    }

    public static void TriggerLevelStarted(string levelId)
    {
        LevelStarted?.Invoke(levelId);
    }
}
