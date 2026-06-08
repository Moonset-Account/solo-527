using System.Collections.Generic;
using Kitchen.Config;
using Kitchen.Core;
using UnityEngine;

namespace Kitchen.Gameplay
{
    public class PlateStack : StationBase
    {
        [Header("Plate Stack")]
        public GameObject platePrefab;
        public Transform stackPoint;
        public int maxPlates = 8;
        public float plateOffset = 0.05f;

        [SerializeField] private List<HeldItem> availablePlates = new List<HeldItem>();

        protected override void Awake()
        {
            base.Awake();
            RespawnAllPlates();
        }

        public void RespawnAllPlates()
        {
            foreach (var p in availablePlates) if (p != null) Destroy(p.gameObject);
            availablePlates.Clear();

            for (int i = 0; i < maxPlates; i++)
            {
                SpawnPlate(i);
            }
        }

        private void SpawnPlate(int index)
        {
            GameObject plateObj = Instantiate(platePrefab, stackPoint != null ? stackPoint.position : transform.position + Vector3.up * (index * plateOffset), Quaternion.identity);
            HeldItem plate = plateObj.GetComponent<HeldItem>();
            if (plate == null) plate = plateObj.AddComponent<HeldItem>();
            availablePlates.Add(plate);
        }

        public override void Interact(PlayerController player)
        {
            if (!player.IsHoldingItem)
            {
                TryGivePlate(player);
            }
            else if (player.HeldItem != null && !player.HeldItem.IsPlated)
            {
                TryPlateIngredient(player);
            }
        }

        private void TryGivePlate(PlayerController player)
        {
            if (availablePlates.Count == 0) return;
            HeldItem plate = availablePlates[availablePlates.Count - 1];
            availablePlates.RemoveAt(availablePlates.Count - 1);

            if (player.PickUpItem(plate, stationId))
            {
            }
            else
            {
                availablePlates.Add(plate);
            }
        }

        private void TryPlateIngredient(PlayerController player)
        {
            if (availablePlates.Count == 0) return;
            HeldItem ingredient = player.HeldItem;

            IngredientState requiredState = ingredient.ingredient?.requiresCooking == true ? IngredientState.Cooked :
                                             ingredient.ingredient?.requiresChopping == true ? IngredientState.Chopped : IngredientState.Raw;

            if (ingredient.CurrentState != requiredState)
            {
                Kitchen.Core.GameManager.Instance?.BroadcastMessage("OnPlateFailed", "食材状态不对");
                return;
            }

            RecipeConfig match = FindMatchingRecipe(ingredient);
            if (match == null) return;

            HeldItem plate = availablePlates[availablePlates.Count - 1];
            availablePlates.RemoveAt(availablePlates.Count - 1);

            ingredient.DestroyItem();
            player.PlaceItem(stationId);
            plate.PlateWith(match);
            player.PickUpItem(plate, stationId);
            PlayerController.TriggerTutorialAction(TutorialAction.PlateFood, stationId);
        }

        private RecipeConfig FindMatchingRecipe(HeldItem ingredient)
        {
            var config = Kitchen.Core.GameManager.Instance?.currentLevelConfig;
            if (config == null || ingredient.ingredient == null) return null;

            foreach (var recipe in config.availableRecipes)
            {
                foreach (var req in recipe.requiredIngredients)
                {
                    if (req.ingredient.id == ingredient.ingredient.id &&
                        req.requiredState == ingredient.CurrentState &&
                        req.amount == 1)
                    {
                        if (recipe.requiredIngredients.Count == 1) return recipe;
                    }
                }
            }
            return null;
        }

        public void ReturnPlate(HeldItem plate)
        {
            if (availablePlates.Count >= maxPlates) { plate.DestroyItem(); return; }
            plate.transform.SetParent(stackPoint);
            plate.transform.position = transform.position + Vector3.up * (availablePlates.Count * plateOffset);
            availablePlates.Add(plate);
        }
    }
}
