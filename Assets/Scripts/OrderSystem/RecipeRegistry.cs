using System;
using System.Collections.Generic;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Ingredients;
using KitchenChaos.Config;

namespace KitchenChaos.OrderSystem
{
    [Serializable]
    public class RecipeStep
    {
        public IngredientDefinition Ingredient;
        public IngredientState RequiredState = IngredientState.Raw;
    }

    [Serializable]
    public class RecipeConfig
    {
        public string RecipeId;
        public string DisplayName;
        public int BaseScore = 100;
        public int CoinReward = 20;
        public string Description;
        public List<RecipeStep> Steps = new();

        public int TotalIngredients => Steps?.Count ?? 0;

        public bool MatchesIngredients(IEnumerable<IngredientItem> items)
        {
            if (items == null || Steps == null) return false;
            var list = new List<IngredientItem>(items);
            if (list.Count != Steps.Count) return false;

            var steps = new List<RecipeStep>(Steps);
            foreach (var it in list)
            {
                int idx = -1;
                for (int i = 0; i < steps.Count; i++)
                {
                    if (steps[i].Ingredient != null &&
                        string.Equals(steps[i].Ingredient.Name, it.Definition?.Name, StringComparison.OrdinalIgnoreCase) &&
                        (it.State & steps[i].RequiredState) == steps[i].RequiredState)
                    {
                        idx = i; break;
                    }
                }
                if (idx < 0) return false;
                steps.RemoveAt(idx);
            }
            return true;
        }
    }

    public static class RecipeRegistry
    {
        static Dictionary<string, IngredientDefinition> _ingredientByName;
        static Dictionary<string, RecipeConfig> _recipeById;
        static List<RecipeConfig> _allRecipes;
        static bool _built;

        public static IReadOnlyList<RecipeConfig> AllRecipes
        {
            get
            {
                if (!_built) BuildDefaults();
                return _allRecipes;
            }
        }

        public static IngredientDefinition GetIngredient(string name)
        {
            if (!_built) BuildDefaults();
            if (string.IsNullOrEmpty(name)) return FallbackIngredient(name);
            return _ingredientByName.TryGetValue(name, out var r) ? r : FallbackIngredient(name);
        }

        public static RecipeConfig GetRecipe(string name)
        {
            if (!_built) BuildDefaults();
            if (string.IsNullOrEmpty(name)) return _allRecipes[0];
            return _recipeById.TryGetValue(name, out var r) ? r : _allRecipes[0];
        }

        public static RecipeConfig GetRandomRecipe(System.Random rng)
        {
            if (!_built) BuildDefaults();
            return _allRecipes[rng.Next(_allRecipes.Count)];
        }

        public static RecipeConfig GetRandomRecipeFromNames(System.Random rng, string[] available)
        {
            if (!_built) BuildDefaults();
            if (available == null || available.Length == 0) return GetRandomRecipe(rng);
            var list = new List<RecipeConfig>(available.Length);
            foreach (var n in available)
            {
                if (_recipeById.TryGetValue(n, out var r)) list.Add(r);
            }
            if (list.Count == 0) return GetRandomRecipe(rng);
            return list[rng.Next(list.Count)];
        }

        static IngredientDefinition FallbackIngredient(string name)
        {
            if (!_built) BuildDefaults();
            if (string.IsNullOrEmpty(name)) name = "Unknown";
            var d = new IngredientDefinition { Name = name };
            d.CanBeChopped = true; d.CanBeCooked = true;
            d.ChopTime = 2.5f; d.CookTime = 5f; d.BurnTime = 12f;
            d.BaseValue = 10;
            _ingredientByName[name] = d;
            return d;
        }

        public static void BuildDefaults()
        {
            if (_built) return;
            _built = true;
            _ingredientByName = new Dictionary<string, IngredientDefinition>(StringComparer.OrdinalIgnoreCase);
            _recipeById = new Dictionary<string, RecipeConfig>(StringComparer.OrdinalIgnoreCase);
            _allRecipes = new List<RecipeConfig>();

            AddIng("Lettuce", IngredientCategory.Vegetable, true, false, 1.2f, 0, 999f, false, 6);
            AddIng("Tomato", IngredientCategory.Vegetable, true, true, 1.4f, 4f, 12f, false, 7);
            AddIng("Potato", IngredientCategory.Vegetable, true, true, 1.2f, 4.5f, 10f, false, 8);
            AddIng("Onion", IngredientCategory.Vegetable, true, true, 1.6f, 4f, 12f, false, 5);
            AddIng("Carrot", IngredientCategory.Vegetable, true, true, 1.5f, 5f, 12f, false, 6);
            AddIng("Beef", IngredientCategory.Meat, true, true, 1.5f, 8f, 16f, false, 15);
            AddIng("Chicken", IngredientCategory.Meat, true, true, 1.2f, 7f, 15f, false, 14);
            AddIng("Cheese", IngredientCategory.Dairy, true, false, 1.0f, 0, 999f, false, 10);
            AddIng("Bread", IngredientCategory.Grain, false, false, 0, 0, 999f, false, 6);
            AddIng("Fish", IngredientCategory.Seafood, true, true, 1.2f, 6f, 12f, false, 18);
            AddIng("Pasta", IngredientCategory.Grain, false, true, 0, 7f, 14f, false, 10);
            AddIng("Mushroom", IngredientCategory.Vegetable, true, true, 1.4f, 4f, 12f, false, 7);
            AddIng("Sausage", IngredientCategory.Meat, false, true, 0, 6f, 15f, false, 13);
            AddIng("Pepper", IngredientCategory.Spice, true, false, 1.3f, 0, 999f, false, 5);
            AddIng("Lemon", IngredientCategory.Spice, true, false, 1.0f, 0, 999f, false, 6);
            AddIng("Cucumber", IngredientCategory.Vegetable, true, false, 1.5f, 0, 999f, false, 5);
            AddIng("Egg", IngredientCategory.Dairy, false, true, 0, 4f, 10f, false, 8);
            AddIng("Rice", IngredientCategory.Grain, false, true, 0, 8f, 15f, false, 8);

            _allRecipes.Add(MakeRecipe("Salad", "田园沙拉", 120, 25, "新鲜蔬菜拌制", new (string, IngredientState)[]
            {
                ("Lettuce", IngredientState.Chopped),
                ("Tomato", IngredientState.Chopped),
                ("Cucumber", IngredientState.Chopped)
            }));
            _allRecipes.Add(MakeRecipe("Soup", "家常浓汤", 180, 40, "暖心暖胃", new (string, IngredientState)[]
            {
                ("Potato", IngredientState.Chopped | IngredientState.Cooked),
                ("Carrot", IngredientState.Chopped | IngredientState.Cooked),
                ("Onion", IngredientState.Chopped)
            }));
            _allRecipes.Add(MakeRecipe("Burger", "经典汉堡", 260, 55, "双层芝士牛肉堡", new (string, IngredientState)[]
            {
                ("Bread", IngredientState.Raw),
                ("Beef", IngredientState.Chopped | IngredientState.Cooked),
                ("Cheese", IngredientState.Raw),
                ("Lettuce", IngredientState.Chopped)
            }));
            _allRecipes.Add(MakeRecipe("Pasta", "奶油意面", 280, 60, "浓郁奶香意面", new (string, IngredientState)[]
            {
                ("Pasta", IngredientState.Cooked),
                ("Cheese", IngredientState.Raw),
                ("Mushroom", IngredientState.Chopped)
            }));
            _allRecipes.Add(MakeRecipe("Steak", "香煎牛排", 380, 80, "三分熟刚刚好", new (string, IngredientState)[]
            {
                ("Beef", IngredientState.Chopped | IngredientState.Cooked),
                ("Potato", IngredientState.Chopped | IngredientState.Cooked),
                ("Pepper", IngredientState.Chopped)
            }));
            _allRecipes.Add(MakeRecipe("Pizza", "至尊披萨", 420, 90, "香肠蘑菇披萨", new (string, IngredientState)[]
            {
                ("Bread", IngredientState.Raw),
                ("Cheese", IngredientState.Raw),
                ("Sausage", IngredientState.Cooked),
                ("Mushroom", IngredientState.Chopped),
                ("Tomato", IngredientState.Chopped)
            }));
            _allRecipes.Add(MakeRecipe("Fish", "香煎鱼排", 350, 75, "鲜嫩多汁鱼排", new (string, IngredientState)[]
            {
                ("Fish", IngredientState.Chopped | IngredientState.Cooked),
                ("Lemon", IngredientState.Raw)
            }));
            _allRecipes.Add(MakeRecipe("StirFry", "时蔬炒菜", 240, 55, "清淡新鲜", new (string, IngredientState)[]
            {
                ("Carrot", IngredientState.Chopped | IngredientState.Cooked),
                ("Mushroom", IngredientState.Chopped | IngredientState.Cooked),
                ("Pepper", IngredientState.Chopped)
            }));

            foreach (var r in _allRecipes)
                _recipeById[r.RecipeId] = r;
        }

        static void AddIng(string name, IngredientCategory cat, bool chop, bool cook, float chopTime, float cookTime, float burnTime, bool wash, int value)
        {
            var def = new IngredientDefinition
            {
                Name = name,
                Category = cat,
                CanBeChopped = chop,
                CanBeCooked = cook,
                ChopTime = chopTime,
                CookTime = cookTime,
                BurnTime = burnTime,
                RequiresWashing = wash,
                BaseValue = value
            };
            _ingredientByName[name] = def;
        }

        static RecipeConfig MakeRecipe(string id, string display, int score, int coins, string desc, (string Ing, IngredientState State)[] steps)
        {
            var r = new RecipeConfig
            {
                RecipeId = id,
                DisplayName = display,
                BaseScore = score,
                CoinReward = coins,
                Description = desc
            };
            foreach (var s in steps)
            {
                var def = GetIngredient(s.Ing);
                if (def != null)
                    r.Steps.Add(new RecipeStep { Ingredient = def, RequiredState = s.State });
            }
            return r;
        }
    }
}
