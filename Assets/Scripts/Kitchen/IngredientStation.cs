using UnityEngine;
using System.Collections.Generic;

public class IngredientStation : KitchenStation
{
    public List<Ingredient> availableIngredients;
    public int currentIndex;

    private void Awake()
    {
        stationType = StationType.Ingredient;
        currentIndex = 0;
    }

    public override bool CanInteract(PlayerController player)
    {
        if (player == null)
            return false;
        if (player.CarriedIngredient != null)
            return false;
        return availableIngredients != null && availableIngredients.Count > 0;
    }

    public override void Interact(PlayerController player)
    {
        if (!CanInteract(player))
            return;

        Ingredient template = availableIngredients[currentIndex];
        Ingredient clone = (Ingredient)template.Clone();
        clone.currentState = IngredientState.Raw;
        player.CarriedIngredient = clone;

        currentIndex = (currentIndex + 1) % availableIngredients.Count;
        NotifyStationComplete();
    }
}
