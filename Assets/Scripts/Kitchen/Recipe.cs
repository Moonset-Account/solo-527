using UnityEngine;
using System.Collections.Generic;

[CreateAssetMenu(fileName = "Recipe", menuName = "Kitchen/Recipe")]
public class Recipe : ScriptableObject
{
    public string recipeName;
    public List<Ingredient> requiredIngredients;
    public float cookTime;
    public float platingTime;
    public int scoreValue;
    public Sprite sprite;

    public bool IsComplete(List<IngredientState> states)
    {
        if (states == null || states.Count != requiredIngredients.Count)
            return false;

        for (int i = 0; i < requiredIngredients.Count; i++)
        {
            if (states[i] != IngredientState.Cooked)
                return false;
        }

        return true;
    }
}
