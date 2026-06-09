using UnityEngine;
using KitchenChaos.Stations;
using KitchenChaos.Ingredients;
using KitchenChaos.Config;
using KitchenChaos.Core;

namespace KitchenChaos.World
{
    [RequireComponent(typeof(Collider2D))]
    public class StationSpawner : MonoBehaviour
    {
        public void SpawnLayout(StationPlacement[] placements)
        {
            if (placements == null) return;
            foreach (var p in placements)
                SpawnStation(p);
        }

        public BaseStation SpawnStation(StationPlacement placement)
        {
            GameObject go;
            BaseStation station;
            switch (placement.StationType)
            {
                case "IngredientBox":
                    go = new GameObject($"Box_{(placement.IngredientsProvided?.Length ?? 0)}ing");
                    station = go.AddComponent<IngredientBox>();
                    var box = (IngredientBox)station;
                    if (placement.IngredientsProvided != null)
                    {
                        var defs = new IngredientDefinition[placement.IngredientsProvided.Length];
                        for (int i = 0; i < placement.IngredientsProvided.Length; i++)
                            defs[i] = BuildDef(placement.IngredientsProvided[i]);
                        box.SetProvidedIngredients(defs);
                    }
                    break;
                case "CuttingStation":
                    go = new GameObject("CuttingStation");
                    station = go.AddComponent<CuttingStation>();
                    break;
                case "CookingStation":
                    go = new GameObject("CookingStation");
                    station = go.AddComponent<CookingStation>();
                    break;
                case "PlateStation":
                    go = new GameObject("PlateStation");
                    station = go.AddComponent<PlateStation>();
                    break;
                case "WashingStation":
                    go = new GameObject("WashingStation");
                    station = go.AddComponent<WashingStation>();
                    break;
                case "DeliveryStation":
                    go = new GameObject("DeliveryStation");
                    station = go.AddComponent<DeliveryStation>();
                    break;
                default:
                    go = new GameObject($"Station_{placement.StationType}");
                    station = go.AddComponent<CuttingStation>();
                    break;
            }

            go.transform.position = placement.Position;
            go.transform.rotation = Quaternion.Euler(placement.RotationEuler);
            go.tag = "Station";
            go.layer = LayerMask.NameToLayer("Default");

            var col = go.GetComponent<Collider2D>();
            if (col == null)
            {
                var bc = go.AddComponent<BoxCollider2D>();
                bc.size = new Vector2(1.2f, 1.2f);
                bc.isTrigger = true;
            }
            SetupAnchor(go);
            SetupVisual(go, placement.StationType);
            return station;
        }

        static void SetupAnchor(GameObject go)
        {
            var t = go.transform.Find("Anchor");
            if (t == null)
            {
                var a = new GameObject("Anchor");
                a.transform.SetParent(go.transform, false);
                a.transform.localPosition = new Vector3(0, 0.7f, 0);
            }
        }

        static void SetupVisual(GameObject go, string type)
        {
            var sr = go.GetComponent<SpriteRenderer>();
            if (sr == null) sr = go.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 2;
            sr.color = type switch
            {
                "IngredientBox" => new Color(0.8f, 0.6f, 0.4f),
                "CuttingStation" => new Color(0.7f, 0.8f, 0.9f),
                "CookingStation" => new Color(0.4f, 0.4f, 0.5f),
                "PlateStation" => new Color(0.95f, 0.92f, 0.85f),
                "WashingStation" => new Color(0.5f, 0.75f, 0.9f),
                "DeliveryStation" => new Color(1f, 0.7f, 0.3f),
                _ => Color.gray
            };
            var hl = go.transform.Find("Highlight");
            Transform hlt;
            if (hl == null)
            {
                var hgo = new GameObject("Highlight");
                hgo.transform.SetParent(go.transform, false);
                hlt = hgo.transform;
                var hsr = hgo.AddComponent<SpriteRenderer>();
                hsr.color = new Color(1f, 1f, 0.5f, 0.35f);
                hsr.sortingOrder = 1;
                hsr.enabled = false;
            }
            else hlt = hl;
            hlt.localPosition = Vector3.zero;
            hlt.localScale = Vector3.one * 1.15f;
        }

        static IngredientDefinition BuildDef(string name)
        {
            var d = new IngredientDefinition { Name = name };
            switch (name.ToLower())
            {
                case "lettuce":
                    d.Category = IngredientCategory.Vegetable; d.CanBeChopped = true; d.CanBeCooked = false; d.ChopTime = 2.5f; d.BaseValue = 6;
                    break;
                case "tomato":
                    d.Category = IngredientCategory.Vegetable; d.CanBeChopped = true; d.CanBeCooked = true; d.ChopTime = 2.5f; d.CookTime = 4f; d.BaseValue = 7;
                    break;
                case "cucumber":
                    d.Category = IngredientCategory.Vegetable; d.CanBeChopped = true; d.CanBeCooked = false; d.ChopTime = 2f; d.BaseValue = 5;
                    break;
                case "potato":
                    d.Category = IngredientCategory.Vegetable; d.CanBeChopped = true; d.CanBeCooked = true; d.ChopTime = 3.5f; d.CookTime = 6f; d.BaseValue = 8;
                    break;
                case "carrot":
                    d.Category = IngredientCategory.Vegetable; d.CanBeChopped = true; d.CanBeCooked = true; d.ChopTime = 3f; d.CookTime = 5f; d.BaseValue = 6;
                    break;
                case "onion":
                    d.Category = IngredientCategory.Vegetable; d.CanBeChopped = true; d.CanBeCooked = true; d.ChopTime = 3.5f; d.CookTime = 4f; d.BaseValue = 5;
                    break;
                case "pepper":
                    d.Category = IngredientCategory.Spice; d.CanBeChopped = true; d.CanBeCooked = false; d.ChopTime = 2.5f; d.BaseValue = 5;
                    break;
                case "beef":
                    d.Category = IngredientCategory.Meat; d.CanBeChopped = true; d.CanBeCooked = true; d.ChopTime = 4f; d.CookTime = 8f; d.BaseValue = 15;
                    break;
                case "steak":
                    d.Category = IngredientCategory.Meat; d.CanBeChopped = false; d.CanBeCooked = true; d.CookTime = 10f; d.BurnTime = 18f; d.BaseValue = 22;
                    break;
                case "fish":
                    d.Category = IngredientCategory.Seafood; d.CanBeChopped = true; d.CanBeCooked = true; d.ChopTime = 3f; d.CookTime = 7f; d.BaseValue = 18;
                    break;
                case "shrimp":
                    d.Category = IngredientCategory.Seafood; d.CanBeChopped = false; d.CanBeCooked = true; d.CookTime = 5f; d.BaseValue = 14;
                    break;
                case "noodle":
                    d.Category = IngredientCategory.Grain; d.CanBeChopped = false; d.CanBeCooked = true; d.CookTime = 7f; d.BaseValue = 10;
                    break;
                case "rice":
                    d.Category = IngredientCategory.Grain; d.CanBeChopped = false; d.CanBeCooked = true; d.CookTime = 8f; d.BaseValue = 8;
                    break;
                case "dough":
                    d.Category = IngredientCategory.Grain; d.CanBeChopped = false; d.CanBeCooked = true; d.CookTime = 10f; d.BaseValue = 10;
                    break;
                case "bun":
                    d.Category = IngredientCategory.Grain; d.CanBeChopped = false; d.CanBeCooked = false; d.BaseValue = 6;
                    break;
                case "cheese":
                    d.Category = IngredientCategory.Dairy; d.CanBeChopped = true; d.CanBeCooked = false; d.ChopTime = 2f; d.BaseValue = 10;
                    break;
                case "egg":
                    d.Category = IngredientCategory.Dairy; d.CanBeChopped = false; d.CanBeCooked = true; d.CookTime = 4f; d.BaseValue = 8;
                    break;
                case "water":
                    d.Category = IngredientCategory.Liquid; d.CanBeChopped = false; d.CanBeCooked = false; d.BaseValue = 2;
                    break;
                case "lemon":
                    d.Category = IngredientCategory.Vegetable; d.CanBeChopped = true; d.CanBeCooked = false; d.ChopTime = 2f; d.BaseValue = 6;
                    break;
                case "seaweed":
                    d.Category = IngredientCategory.Vegetable; d.CanBeChopped = true; d.CanBeCooked = false; d.ChopTime = 2f; d.BaseValue = 7;
                    break;
                default:
                    d.Category = IngredientCategory.Vegetable; d.CanBeChopped = true; d.CanBeCooked = true; d.ChopTime = 3f; d.CookTime = 6f; d.BaseValue = 8;
                    break;
            }
            return d;
        }
    }
}
