using System.Collections.Generic;
using System;

public class Dish
{
    public Recipe recipe;
    public List<Ingredient> currentIngredients;
    public float platingProgress;
    public bool isPlated;

    public Dish(Recipe recipe)
    {
        this.recipe = recipe;
        currentIngredients = new List<Ingredient>();
        platingProgress = 0f;
        isPlated = false;
    }

    public bool AddIngredient(Ingredient ingredient)
    {
        if (isPlated)
            return false;

        if (ingredient == null || ingredient.IsBurned())
            return false;

        int requiredCount = recipe.requiredIngredients.Count;
        int currentCount = currentIngredients.Count;
        if (currentCount >= requiredCount)
            return false;

        currentIngredients.Add(ingredient);
        return true;
    }

    public bool CanPlate()
    {
        if (currentIngredients.Count != recipe.requiredIngredients.Count)
            return false;

        for (int i = 0; i < currentIngredients.Count; i++)
        {
            if (currentIngredients[i].currentState != IngredientState.Cooked)
                return false;
        }

        return true;
    }

    public DishRating CalculateRating()
    {
        if (!isPlated)
            return DishRating.None;

        int correctCount = 0;
        for (int i = 0; i < currentIngredients.Count; i++)
        {
            if (currentIngredients[i].currentState == IngredientState.Cooked)
                correctCount++;
        }

        float ratio = (float)correctCount / recipe.requiredIngredients.Count;

        if (ratio >= 1f)
            return DishRating.Perfect;
        if (ratio >= 0.75f)
            return DishRating.Gold;
        if (ratio >= 0.5f)
            return DishRating.Silver;

        return DishRating.None;
    }
}
