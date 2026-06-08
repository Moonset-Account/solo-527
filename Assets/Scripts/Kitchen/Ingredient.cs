using UnityEngine;
using System;

[CreateAssetMenu(fileName = "Ingredient", menuName = "Kitchen/Ingredient")]
public class Ingredient : ScriptableObject, ICloneable
{
    public string ingredientName;
    public Sprite sprite;
    public float prepTime;
    public float cookTime;
    public float burnTime;

    [NonSerialized] public IngredientState currentState = IngredientState.Raw;

    public bool CanChop()
    {
        return currentState == IngredientState.Raw;
    }

    public bool CanCook()
    {
        return currentState == IngredientState.Chopped;
    }

    public bool IsBurned()
    {
        return currentState == IngredientState.Burned;
    }

    public object Clone()
    {
        Ingredient copy = Instantiate(this);
        copy.currentState = currentState;
        return copy;
    }
}
