using UnityEngine;
using System.Collections.Generic;
using System;

[CreateAssetMenu(fileName = "LevelData", menuName = "Kitchen/LevelData")]
public class LevelData : ScriptableObject
{
    public string levelName;
    public int levelIndex;
    public string description;
    public float timeLimit;
    public float orderInterval;
    public int maxOrders;
    public List<Recipe> availableRecipes;
    public List<Ingredient> availableIngredients;
    public int targetScore;
    public int targetScore2Stars;
    public int targetScore3Stars;
    public List<SpatialConstraint> spatialConstraints;
    public List<StationLayoutEntry> stationLayout;
    public bool hasConveyorBelt;
    public float conveyorSpeed;
    public bool isTutorialLevel;
    public List<TutorialStep> tutorialSteps;
}
