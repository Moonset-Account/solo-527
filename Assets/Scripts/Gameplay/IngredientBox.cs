using Kitchen.Config;
using Kitchen.Core;
using UnityEngine;

namespace Kitchen.Gameplay
{
    public class IngredientBox : StationBase
    {
        [Header("Ingredient Box")]
        public IngredientConfig storedIngredient;
        public GameObject heldItemPrefab;
        public float respawnDelay = 2f;
        public Transform spawnPoint;
        public int maxStock = 99;

        [SerializeField] private int currentStock;
        [SerializeField] private float respawnTimer;
        [SerializeField] private bool isResupplying;

        protected override void Awake()
        {
            base.Awake();
            currentStock = maxStock;
        }

        private void Update()
        {
            if (isResupplying)
            {
                respawnTimer -= Time.deltaTime;
                if (respawnTimer <= 0)
                {
                    currentStock = maxStock;
                    isResupplying = false;
                }
            }
        }

        public override void Interact(PlayerController player)
        {
            if (player.IsHoldingItem)
            {
                TryReturnItem(player);
                return;
            }

            if (storedIngredient == null || currentStock <= 0) return;

            GameObject itemObj = Instantiate(heldItemPrefab, spawnPoint != null ? spawnPoint.position : transform.position + Vector3.up, Quaternion.identity);
            HeldItem item = itemObj.GetComponent<HeldItem>();
            item.Initialize(storedIngredient);

            if (player.PickUpItem(item, stationId))
            {
                currentStock--;
                if (currentStock <= 0)
                {
                    isResupplying = true;
                    respawnTimer = respawnDelay;
                }
            }
            else
            {
                Destroy(itemObj);
            }
        }

        private void TryReturnItem(PlayerController player)
        {
            HeldItem held = player.HeldItem;
            if (held.CurrentState == IngredientState.Raw && held.ingredient == storedIngredient)
            {
                HeldItem returned = player.PlaceItem(stationId);
                returned?.DestroyItem();
                currentStock = Mathf.Min(maxStock, currentStock + 1);
            }
        }
    }
}
