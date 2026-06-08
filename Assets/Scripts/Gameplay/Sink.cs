using System.Collections.Generic;
using Kitchen.Core;
using UnityEngine;

namespace Kitchen.Gameplay
{
    public class Sink : StationBase
    {
        [Header("Sink")]
        public Transform dirtyStackPoint;
        public Transform cleanStackPoint;
        public float cleanTimePerDish = 2f;
        public AudioClip washClip;

        [SerializeField] private List<HeldItem> dirtyPlates = new List<HeldItem>();
        [SerializeField] private List<HeldItem> cleanPlates = new List<HeldItem>();
        [SerializeField] private bool isCleaning;
        [SerializeField] private float cleanProgress;

        public IReadOnlyList<HeldItem> DirtyPlates => dirtyPlates;

        public override void Interact(PlayerController player)
        {
            if (player.IsHoldingItem)
            {
                HeldItem held = player.HeldItem;
                if (held.IsDirty)
                {
                    HeldItem returned = player.PlaceItem();
                    ReceiveDirtyPlate(returned);
                }
                else if (!held.IsPlated)
                {
                    HeldItem trash = player.PlaceItem();
                    trash?.DestroyItem();
                }
                return;
            }

            if (isCleaning) return;

            if (cleanPlates.Count > 0)
            {
                HeldItem clean = cleanPlates[cleanPlates.Count - 1];
                cleanPlates.RemoveAt(cleanPlates.Count - 1);
                if (player.PickUpItem(clean))
                {
                    PlateStack stack = FindObjectOfType<PlateStack>();
                    stack?.ReturnPlate(clean);
                    player.PlaceItem();
                    if (player.PickUpItem(clean) == false)
                    {
                        stack?.ReturnPlate(clean);
                    }
                }
            }
            else if (dirtyPlates.Count > 0)
            {
                StartCleaning();
            }
        }

        public void ReceiveDirtyPlate(HeldItem plate)
        {
            if (plate == null) return;
            dirtyPlates.Add(plate);
            plate.transform.SetParent(dirtyStackPoint != null ? dirtyStackPoint : transform);
            plate.transform.localPosition = Vector3.up * (dirtyPlates.Count - 1) * 0.05f;
        }

        private void StartCleaning()
        {
            if (dirtyPlates.Count == 0) return;
            isCleaning = true;
            cleanProgress = 0f;
            StartCoroutine(CleanRoutine());
        }

        private System.Collections.IEnumerator CleanRoutine()
        {
            while (dirtyPlates.Count > 0)
            {
                cleanProgress = 0f;
                while (cleanProgress < cleanTimePerDish)
                {
                    cleanProgress += Time.deltaTime;
                    yield return null;
                }

                HeldItem cleaned = dirtyPlates[0];
                dirtyPlates.RemoveAt(0);
                cleaned.Clean();

                PlateStack stack = FindObjectOfType<PlateStack>();
                if (stack != null)
                {
                    cleaned.DestroyItem();
                    stack.BroadcastMessage("OnPlateCleaned");
                }
            }
            isCleaning = false;
        }
    }
}
