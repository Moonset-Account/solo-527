using UnityEngine;
using System.Collections.Generic;

public class LevelManager : Singleton<LevelManager>
{
    public LevelData currentLevelData;
    public Timer levelTimer;
    public bool isLevelActive;

    private List<LevelMechanic> activeMechanics = new List<LevelMechanic>();

    public void LoadLevel(LevelData data)
    {
        currentLevelData = data;
        isLevelActive = false;
        levelTimer = new Timer(data.timeLimit);

        foreach (var mechanic in activeMechanics)
        {
            if (mechanic != null)
                Destroy(mechanic);
        }
        activeMechanics.Clear();

        ApplySpatialConstraints(data.spatialConstraints);

        if (data.hasConveyorBelt)
        {
            var conveyor = gameObject.AddComponent<ConveyorBeltMechanic>();
            conveyor.conveyorSpeed = data.conveyorSpeed;
            activeMechanics.Add(conveyor);
        }
    }

    public void StartLevel()
    {
        isLevelActive = true;
        levelTimer.Start();

        foreach (var mechanic in activeMechanics)
        {
            mechanic.Activate();
        }
    }

    public int CompleteLevel()
    {
        isLevelActive = false;

        foreach (var mechanic in activeMechanics)
        {
            mechanic.Deactivate();
        }

        int stars = GetCurrentStars(ScoringManager.Instance.currentScore);
        return stars;
    }

    public void FailLevel()
    {
        isLevelActive = false;

        foreach (var mechanic in activeMechanics)
        {
            mechanic.Deactivate();
        }
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
        if (!isLevelActive || currentLevelData == null) return;

        float dt = Time.deltaTime;
        levelTimer.Tick(dt);

        if (levelTimer.IsFinished)
        {
            isLevelActive = false;
            GameManager.Instance.FailLevel();
            return;
        }

        if (OrderManager.HasInstance && ScoringManager.HasInstance)
        {
            int targetScore = currentLevelData.targetScore;
            if (ScoringManager.Instance.currentScore >= targetScore)
            {
                isLevelActive = false;
                GameManager.Instance.CompleteLevel();
                return;
            }
        }

        foreach (var mechanic in activeMechanics)
        {
            mechanic.Tick(dt);
        }
    }

    private void ApplySpatialConstraints(List<SpatialConstraint> constraints)
    {
        if (constraints == null) return;

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

    protected override void OnDestroy()
    {
        foreach (var mechanic in activeMechanics)
        {
            if (mechanic != null)
            {
                Destroy(mechanic);
            }
        }
        activeMechanics.Clear();
        base.OnDestroy();
    }
}
