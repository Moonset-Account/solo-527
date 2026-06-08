using UnityEngine;
using System.Collections.Generic;
using System;

public class LevelManager : Singleton<LevelManager>
{
    public LevelData currentLevelData;
    public Timer levelTimer;
    public bool isLevelActive;

    private List<KitchenStation> spawnedStations = new List<KitchenStation>();
    private List<LevelMechanic> activeMechanics = new List<LevelMechanic>();
    private float orderSpawnTimer;

    public void LoadLevel(LevelData data)
    {
        currentLevelData = data;
        isLevelActive = false;
        levelTimer = new Timer(data.timeLimit);

        SpawnStations(data.stationLayout);
        ApplySpatialConstraints(data.spatialConstraints);

        if (data.hasConveyorBelt)
        {
            var conveyor = gameObject.AddComponent<ConveyorBeltMechanic>();
            conveyor.conveyorSpeed = data.conveyorSpeed;
            activeMechanics.Add(conveyor);
        }

        EventBus.Publish(new GameEvents.LevelStartedEvent { LevelIndex = data.levelIndex });
    }

    public void StartLevel()
    {
        isLevelActive = true;
        levelTimer.Start();
        orderSpawnTimer = 0f;

        foreach (var mechanic in activeMechanics)
        {
            mechanic.Activate();
        }

        OrderManager.Instance.SpawnOrder();
    }

    public int CompleteLevel()
    {
        isLevelActive = false;

        foreach (var mechanic in activeMechanics)
        {
            mechanic.Deactivate();
        }

        int stars = GetCurrentStars(ScoringManager.Instance.currentScore);
        int score = ScoringManager.Instance.currentScore;

        EventBus.Publish(new GameEvents.LevelCompletedEvent { LevelIndex = currentLevelData.levelIndex, Score = score, Stars = stars });

        return stars;
    }

    public void FailLevel()
    {
        isLevelActive = false;

        foreach (var mechanic in activeMechanics)
        {
            mechanic.Deactivate();
        }

        EventBus.Publish(new GameEvents.LevelFailedEvent { LevelIndex = currentLevelData.levelIndex, Reason = "Time's Up!" });
    }

    public int GetCurrentStars(int score)
    {
        if (currentLevelData == null) return 0;

        if (score >= currentLevelData.targetScore3Stars) return 3;
        if (score >= currentLevelData.targetScore2Stars) return 2;
        if (score >= currentLevelData.targetScore) return 1;
        return 0;
    }

    private void Update()
    {
        if (!isLevelActive) return;

        float dt = Time.deltaTime;
        levelTimer.Tick(dt);

        if (levelTimer.IsFinished)
        {
            FailLevel();
            return;
        }

        orderSpawnTimer += dt;
        if (orderSpawnTimer >= currentLevelData.orderInterval && OrderManager.Instance.activeOrders.Count < currentLevelData.maxOrders)
        {
            OrderManager.Instance.SpawnOrder();
            orderSpawnTimer = 0f;
        }

        foreach (var mechanic in activeMechanics)
        {
            mechanic.Tick(dt);
        }
    }

    private void SpawnStations(List<StationLayoutEntry> layout)
    {
        foreach (var entry in layout)
        {
            if (entry.isLocked) continue;

            var stationObj = new GameObject(entry.stationName);
            stationObj.transform.position = entry.position;
            stationObj.transform.rotation = Quaternion.Euler(0f, 0f, entry.rotation);

            KitchenStation station = null;
            switch (entry.stationType)
            {
                case StationType.Prep:
                    station = stationObj.AddComponent<PrepStation>();
                    break;
                case StationType.Cooking:
                    station = stationObj.AddComponent<CookingStation>();
                    break;
                case StationType.Plating:
                    station = stationObj.AddComponent<PlatingStation>();
                    break;
                case StationType.Cleaning:
                    station = stationObj.AddComponent<CleaningStation>();
                    break;
                case StationType.Ingredient:
                    station = stationObj.AddComponent<IngredientStation>();
                    break;
            }

            if (station != null)
            {
                station.stationType = entry.stationType;
                station.stationName = entry.stationName;
                StationManager.Instance.RegisterStation(station);
                spawnedStations.Add(station);
            }
        }
    }

    private void ApplySpatialConstraints(List<SpatialConstraint> constraints)
    {
        foreach (var constraint in constraints)
        {
            if (constraint.constraintType == SpatialConstraint.ConstraintType.MovingObstacle)
            {
                var obstacleObj = new GameObject(constraint.constraintName);
                var mechanic = obstacleObj.AddComponent<RotatingObstacleMechanic>();
                mechanic.moveSpeed = constraint.moveSpeed;
                mechanic.moveRange = constraint.moveRange;
                mechanic.constraintPosition = constraint.position;
                activeMechanics.Add(mechanic);
            }
        }
    }

    private void OnDestroy()
    {
        foreach (var mechanic in activeMechanics)
        {
            if (mechanic != null)
            {
                Destroy(mechanic);
            }
        }
        activeMechanics.Clear();
    }
}
