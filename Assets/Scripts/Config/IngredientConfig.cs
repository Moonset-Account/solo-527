using UnityEngine;

namespace Kitchen.Config
{
    [CreateAssetMenu(fileName = "Ingredient_", menuName = "Kitchen/Config/Ingredient", order = 0)]
    public class IngredientConfig : ScriptableObject
    {
        public string id;
        public string displayName;
        public Sprite icon;
        public Color color = Color.white;
        public float chopTime = 1.5f;
        public float cookTime = 3f;
        public float burnTime = 8f;
        public bool requiresChopping = false;
        public bool requiresCooking = false;
        public IngredientState defaultState = IngredientState.Raw;
    }

    public enum IngredientState
    {
        Raw,
        Chopped,
        Cooking,
        Cooked,
        Burned,
        Plated
    }
}
