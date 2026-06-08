using Kitchen.Core;
using UnityEngine;

namespace Kitchen.Gameplay
{
    public class ServingWindow : StationBase
    {
        [Header("Serving Window")]
        public Transform deliverPoint;
        public ParticleSystem successParticles;
        public ParticleSystem failParticles;
        public AudioClip successClip;
        public AudioClip failClip;

        public override void Interact(PlayerController player)
        {
            if (!player.IsHoldingItem) return;

            HeldItem held = player.HeldItem;
            if (!held.IsPlated || held.platedRecipe == null)
            {
                if (failParticles != null) failParticles.Play();
                Kitchen.Core.GameManager.Instance?.BroadcastMessage("OnServeFailed", "请先装盘");
                return;
            }

            int score = OrderManager.Instance.SubmitPlatedItem(held.platedRecipe);

            if (successParticles != null) successParticles.Play();
            PlayerController.TriggerTutorialAction(TutorialAction.ServeOrder, stationId);

            Kitchen.Core.GameManager.Instance?.BroadcastMessage("OnServed", score);

            HeldItem served = player.PlaceItem(stationId);
            if (served != null)
            {
                served.SetDirty();
                DeliverToSink(served);
            }
        }

        private void DeliverToSink(HeldItem dirtyPlate)
        {
            Sink sink = FindObjectOfType<Sink>();
            if (sink != null)
            {
                sink.ReceiveDirtyPlate(dirtyPlate);
            }
            else
            {
                dirtyPlate.DestroyItem();
            }
        }
    }
}
