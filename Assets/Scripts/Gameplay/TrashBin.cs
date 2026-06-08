using Kitchen.Core;
using UnityEngine;

namespace Kitchen.Gameplay
{
    public class TrashBin : StationBase
    {
        [Header("Trash Bin")]
        public ParticleSystem trashParticles;
        public int penaltyScore = -20;

        public override void Interact(PlayerController player)
        {
            if (!player.IsHoldingItem) return;

            HeldItem trash = player.PlaceItem();
            if (trash != null)
            {
                trash.DestroyItem();
                if (trashParticles != null) trashParticles.Play();

                if (trash.CurrentState == Kitchen.Config.IngredientState.Burned || trash.IsDirty)
                {
                    Kitchen.Core.GameManager.Instance?.AddScore(10, "清理");
                }
                else
                {
                    Kitchen.Core.GameManager.Instance?.AddScore(penaltyScore, "丢弃");
                }
            }
        }
    }
}
