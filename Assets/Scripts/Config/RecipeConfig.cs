using System.Collections.Generic;
using UnityEngine;

namespace Kitchen.Config
{
    [CreateAssetMenu(fileName = "Recipe_", menuName = "Kitchen/Config/Recipe", order = 1)]
    public class RecipeConfig : ScriptableObject
    {
        public string id;
        public string displayName;
        public Sprite icon;
        public int baseScore = 100;
        public float timeLimitSeconds = 60f;
        public float prepareTime = 10f;
        public List<RecipeIngredient> requiredIngredients = new List<RecipeIngredient>();
        public List<RecipeStep> requiredSteps = new List<RecipeStep>();
        public int rewardCoins = 10;
        public float difficultyWeight = 1f;
    }

    [System.Serializable]
    public class RecipeIngredient
    {
        public IngredientConfig ingredient;
        public int amount = 1;
        public IngredientState requiredState = IngredientState.Raw;
    }

    [System.Serializable]
    public class RecipeStep
    {
        public StepType type;
        public float duration;
        public string description;
    }

    public enum StepType
    {
        PickUp,
        Chop,
        Cook,
        Plate,
        Serve,
        Clean
    }
}
