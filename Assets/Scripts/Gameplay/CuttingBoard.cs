using Kitchen.Config;
using Kitchen.Core;
using UnityEngine;

namespace Kitchen.Gameplay
{
    public class CuttingBoard : StationBase
    {
        [Header("Cutting Board")]
        public Transform itemSlot;
        public ParticleSystem chopParticles;
        public AudioClip chopSound;

        [SerializeField] private HeldItem currentItem;
        [SerializeField] private bool isChopping;

        public HeldItem CurrentItem => currentItem;
        public bool IsChopping => isChopping;

        public override void Interact(PlayerController player)
        {
            if (isChopping) return;

            if (player.IsHoldingItem)
            {
                if (currentItem == null)
                {
                    PlaceItemFromPlayer(player);
                }
            }
            else
            {
                if (currentItem != null && !isChopping)
                {
                    PickUpItem(player);
                }
            }
        }

        private void PlaceItemFromPlayer(PlayerController player)
        {
            HeldItem item = player.PlaceItem();
            if (item == null) return;

            currentItem = item;
            item.transform.SetParent(itemSlot != null ? itemSlot : transform);
            item.transform.localPosition = Vector3.up * 0.1f;
            item.transform.localRotation = Quaternion.identity;

            if (item.ingredient != null && item.ingredient.requiresChopping && item.CurrentState == IngredientState.Raw)
            {
                StartChopping(item, player);
            }
        }

        private void PickUpItem(PlayerController player)
        {
            if (player.PickUpItem(currentItem))
            {
                currentItem = null;
            }
        }

        private void StartChopping(HeldItem item, PlayerController player)
        {
            isChopping = true;
            bool started = item.StartChopping(() =>
            {
                isChopping = false;
                if (chopParticles != null) chopParticles.Play();
            });
            if (!started) isChopping = false;
        }
    }
}
