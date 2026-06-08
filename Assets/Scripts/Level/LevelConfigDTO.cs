using System;
using System.Collections.Generic;

[Serializable]
public class LevelConfigDTO
{
    public string levelName;
    public int levelIndex;
    public string description;
    public float timeLimit;
    public float orderInterval;
    public int maxOrders;
    public int targetScore;
    public int targetScore2Stars;
    public int targetScore3Stars;
    public bool hasConveyorBelt;
    public float conveyorSpeed;
    public bool isTutorialLevel;
    public bool requireAllDishesCleaned;

    public List<StationEntryDTO> stationLayout;
    public List<ConstraintDTO> spatialConstraints;
    public List<TutorialStepDTO> tutorialSteps;
    public List<string> recipeNames;
    public List<IngredientConfigDTO> ingredientConfigs;

    [Serializable]
    public class StationEntryDTO
    {
        public int stationType;
        public float positionX;
        public float positionY;
        public float positionZ;
        public float rotation;
        public string stationName;
        public bool isLocked;
    }

    [Serializable]
    public class ConstraintDTO
    {
        public string constraintName;
        public int constraintType;
        public float positionX;
        public float positionY;
        public float sizeX;
        public float sizeY;
        public float moveSpeed;
        public float moveRange;
    }

    [Serializable]
    public class TutorialStepDTO
    {
        public int stepIndex;
        public string description;
        public int targetStationType;
        public string requiredAction;
        public float highlightX;
        public float highlightY;
        public float highlightRadius;
    }

    [Serializable]
    public class IngredientConfigDTO
    {
        public string name;
        public float prepTime;
        public float cookTime;
        public float burnTime;
    }
}
