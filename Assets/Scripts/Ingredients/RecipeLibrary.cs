using System;
using System.Collections.Generic;

namespace KitchenChaos.Ingredients
{
    [Serializable]
    public class RecipeStep
    {
        public IngredientState RequiredState;
        public string IngredientName;
    }

    [Serializable]
    public class Recipe
    {
        public string Name;
        public string DisplayName;
        public List<RecipeStep> Steps = new();
        public int BaseScore = 50;
        public float TimeLimit = 45f;
        public string PlateColor = "#FFFFFF";
        public bool RequiresCleanPlate = true;
    }

    public static class RecipeLibrary
    {
        static readonly Dictionary<string, Recipe> _cache = new(StringComparer.OrdinalIgnoreCase);

        public static Recipe Get(string name)
        {
            if (_cache.TryGetValue(name, out var r)) return r;
            r = BuildByName(name);
            _cache[name] = r;
            return r;
        }

        public static IReadOnlyDictionary<string, Recipe> All => BuildAll();

        static Dictionary<string, Recipe> BuildAll()
        {
            if (_cache.Count == 0)
            {
                _ = Get("Salad"); _ = Get("Soup"); _ = Get("Burger");
                _ = Get("Pasta"); _ = Get("Steak"); _ = Get("Sushi");
                _ = Get("Pizza"); _ = Get("FishFry");
            }
            return _cache;
        }

        static Recipe BuildByName(string name) => name.ToLower() switch
        {
            "salad" => new Recipe
            {
                Name = "Salad", DisplayName = "田园沙拉", BaseScore = 40, TimeLimit = 40f,
                Steps = new List<RecipeStep>
                {
                    new() { IngredientName = "Lettuce", RequiredState = IngredientState.Chopped },
                    new() { IngredientName = "Tomato", RequiredState = IngredientState.Chopped },
                    new() { IngredientName = "Cucumber", RequiredState = IngredientState.Chopped }
                }
            },
            "soup" => new Recipe
            {
                Name = "Soup", DisplayName = "蔬菜汤", BaseScore = 60, TimeLimit = 50f,
                Steps = new List<RecipeStep>
                {
                    new() { IngredientName = "Potato", RequiredState = IngredientState.Chopped },
                    new() { IngredientName = "Carrot", RequiredState = IngredientState.Chopped },
                    new() { IngredientName = "Water", RequiredState = IngredientState.Raw }
                }
            },
            "burger" => new Recipe
            {
                Name = "Burger", DisplayName = "经典汉堡", BaseScore = 80, TimeLimit = 55f,
                Steps = new List<RecipeStep>
                {
                    new() { IngredientName = "Bun", RequiredState = IngredientState.Raw },
                    new() { IngredientName = "Beef", RequiredState = IngredientState.Cooked },
                    new() { IngredientName = "Lettuce", RequiredState = IngredientState.Chopped }
                }
            },
            "pasta" => new Recipe
            {
                Name = "Pasta", DisplayName = "番茄意面", BaseScore = 90, TimeLimit = 60f,
                Steps = new List<RecipeStep>
                {
                    new() { IngredientName = "Noodle", RequiredState = IngredientState.Cooked },
                    new() { IngredientName = "Tomato", RequiredState = IngredientState.Chopped },
                    new() { IngredientName = "Cheese", RequiredState = IngredientState.Raw }
                }
            },
            "steak" => new Recipe
            {
                Name = "Steak", DisplayName = "煎牛排", BaseScore = 120, TimeLimit = 65f,
                Steps = new List<RecipeStep>
                {
                    new() { IngredientName = "Steak", RequiredState = IngredientState.Cooked },
                    new() { IngredientName = "Potato", RequiredState = IngredientState.Chopped },
                    new() { IngredientName = "Pepper", RequiredState = IngredientState.Chopped }
                }
            },
            "sushi" => new Recipe
            {
                Name = "Sushi", DisplayName = "寿司卷", BaseScore = 100, TimeLimit = 55f,
                Steps = new List<RecipeStep>
                {
                    new() { IngredientName = "Rice", RequiredState = IngredientState.Cooked },
                    new() { IngredientName = "Fish", RequiredState = IngredientState.Chopped },
                    new() { IngredientName = "Seaweed", RequiredState = IngredientState.Raw }
                }
            },
            "pizza" => new Recipe
            {
                Name = "Pizza", DisplayName = "玛格丽特披萨", BaseScore = 110, TimeLimit = 70f,
                Steps = new List<RecipeStep>
                {
                    new() { IngredientName = "Dough", RequiredState = IngredientState.Cooked },
                    new() { IngredientName = "Tomato", RequiredState = IngredientState.Chopped },
                    new() { IngredientName = "Cheese", RequiredState = IngredientState.Raw }
                }
            },
            "fishfry" => new Recipe
            {
                Name = "FishFry", DisplayName = "香煎鱼排", BaseScore = 100, TimeLimit = 60f,
                Steps = new List<RecipeStep>
                {
                    new() { IngredientName = "Fish", RequiredState = IngredientState.Cooked },
                    new() { IngredientName = "Lemon", RequiredState = IngredientState.Chopped }
                }
            },
            _ => new Recipe
            {
                Name = name, DisplayName = name, BaseScore = 50, TimeLimit = 45f,
                Steps = new List<RecipeStep>
                {
                    new() { IngredientName = "Lettuce", RequiredState = IngredientState.Chopped },
                    new() { IngredientName = "Tomato", RequiredState = IngredientState.Chopped }
                }
            }
        };
    }
}
