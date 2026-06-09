using System;
using System.Collections.Generic;
using KitchenChaos.Core;

namespace KitchenChaos.Ingredients
{
    public enum IngredientCategory
    {
        Vegetable,
        Meat,
        Seafood,
        Dairy,
        Grain,
        Liquid,
        Spice,
        Dishware
    }

    [Serializable]
    public class IngredientDefinition
    {
        public string Name;
        public IngredientCategory Category;
        public IngredientState InitialState = IngredientState.Raw;
        public float ChopTime = 3f;
        public float CookTime = 6f;
        public float BurnTime = 12f;
        public float WashTime = 5f;
        public bool CanBeChopped = true;
        public bool CanBeCooked;
        public bool CanBeBurned = true;
        public bool RequiresWashing;
        public int BaseValue = 10;
    }
}
