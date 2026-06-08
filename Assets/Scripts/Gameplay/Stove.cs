using Kitchen.Config;
using Kitchen.Core;
using UnityEngine;

namespace Kitchen.Gameplay
{
    public class Stove : StationBase
    {
        [Header("Stove")]
        public Transform[] burners;
        public ParticleSystem fireParticles;
        public ParticleSystem smokeParticles;
        public float fireSpreadChance = 0.01f;

        [SerializeField] private HeldItem[] burnerItems;
        [SerializeField] private bool[] burnerHasFire;
        [SerializeField] private bool[] burnerIsOn;

        protected override void Awake()
        {
            base.Awake();
            int count = burners == null || burners.Length == 0 ? 1 : burners.Length;
            burnerItems = new HeldItem[count];
            burnerHasFire = new bool[count];
            burnerIsOn = new bool[count];
        }

        public override void Interact(PlayerController player)
        {
            int emptyIdx = -1;
            int filledIdx = -1;

            for (int i = 0; i < burnerItems.Length; i++)
            {
                if (burnerItems[i] == null && emptyIdx == -1) emptyIdx = i;
                if (burnerItems[i] != null && filledIdx == -1) filledIdx = i;
            }

            if (player.IsHoldingItem)
            {
                if (emptyIdx >= 0) PlaceOnBurner(player, emptyIdx);
            }
            else
            {
                if (filledIdx >= 0) PickUpFromBurner(player, filledIdx);
            }
        }

        private void PlaceOnBurner(PlayerController player, int index)
        {
            HeldItem item = player.PlaceItem();
            if (item == null) return;

            burnerItems[index] = item;
            item.transform.SetParent(burners[index]);
            item.transform.localPosition = Vector3.up * 0.15f;
            item.transform.localRotation = Quaternion.identity;

            if (item.ingredient != null && item.ingredient.requiresCooking)
            {
                StartCooking(index, item);
            }
        }

        private void PickUpFromBurner(PlayerController player, int index)
        {
            HeldItem item = burnerItems[index];
            if (item == null) return;

            item.StopCooking();
            if (player.PickUpItem(item))
            {
                burnerItems[index] = null;
                burnerIsOn[index] = false;
                if (fireParticles != null && burners[index].childCount > 0) fireParticles.Stop();
            }
        }

        private void StartCooking(int index, HeldItem item)
        {
            burnerIsOn[index] = true;
            if (fireParticles != null) fireParticles.Play();

            bool started = item.StartCooking(
                () => { },
                () =>
                {
                    burnerHasFire[index] = true;
                    if (smokeParticles != null) smokeParticles.Play();
                }
            );
            if (!started) burnerIsOn[index] = false;
        }
    }
}
