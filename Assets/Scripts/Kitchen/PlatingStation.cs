using UnityEngine;

public class PlatingStation : KitchenStation
{
    public Dish currentDish;

    private void Awake()
    {
        stationType = StationType.Plating;
    }

    public override bool CanInteract(PlayerController player)
    {
        if (player == null)
            return false;

        if (player.CarriedIngredient != null && player.CarriedIngredient.currentState == IngredientState.Cooked)
            return true;

        if (currentDish != null && currentDish.isPlated && player.CarriedIngredient == null)
            return true;

        return false;
    }

    public override void Interact(PlayerController player)
    {
        if (player == null)
            return;

        if (player.CarriedIngredient != null && player.CarriedIngredient.currentState == IngredientState.Cooked)
        {
            if (currentDish == null)
            {
                currentDish = new Dish(null);
            }

            if (currentDish.AddIngredient(player.CarriedIngredient))
            {
                player.CarriedIngredient = null;
            }

            UpdatePlatingProgress();
        }
        else if (currentDish != null && currentDish.isPlated && player.CarriedIngredient == null)
        {
            player.CarriedDish = currentDish;
            currentDish = null;
            isOccupied = false;
            NotifyStationComplete();
        }
    }

    private void UpdatePlatingProgress()
    {
        if (currentDish == null)
            return;

        if (currentDish.CanPlate())
        {
            currentDish.platingProgress = 1f;
            currentDish.isPlated = true;
            isOccupied = true;
            NotifyStationComplete();
        }
        else if (currentDish.recipe != null && currentDish.recipe.requiredIngredients.Count > 0)
        {
            currentDish.platingProgress = (float)currentDish.currentIngredients.Count / currentDish.recipe.requiredIngredients.Count;
        }
    }
}
