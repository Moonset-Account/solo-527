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
                    HeldItem returned = player.PlaceItem(stationId);
                    ReceiveDirtyPlate(returned);
                }
                else if (!held.IsPlated && held.ingredient != null)
                {
                    HeldItem trash = player.PlaceItem(stationId);
                    trash?.DestroyItem();
                }
                return;
            }

            if (isCleaning) return;

            if (cleanPlates.Count > 0)
            {
                HeldItem clean = cleanPlates[cleanPlates.Count - 1];
                cleanPlates.RemoveAt(cleanPlates.Count - 1);
                PlateStack stack = FindNearestPlateStack();
                if (stack != null)
                {
                    stack.ReturnPlate(clean);
                }
                else
                {
                    player.PickUpItem(clean, stationId);
                }
                return;
            }

            if (dirtyPlates.Count > 0)
            {
                StartCleaning();
            }
        }

        private PlateStack FindNearestPlateStack()
        {
            PlateStack[] stacks = FindObjectsOfType<PlateStack>();
            PlateStack best = null; float minD = float.MaxValue;
            foreach (var s in stacks)
            {
                float d = Vector3.Distance(transform.position, s.transform.position);
                if (d < minD) { minD = d; best = s; }
            }
            return best;
        }

        public void ReceiveDirtyPlate(HeldItem plate)
        {
            if (plate == null) return;
            plate.SetDirty();
            dirtyPlates.Add(plate);
            plate.transform.SetParent(dirtyStackPoint != null ? dirtyStackPoint : transform);
            plate.transform.localPosition = Vector3.up * (dirtyPlates.Count - 1) * 0.05f;
            plate.transform.localRotation = Quaternion.identity;
        }

        private void StartCleaning()
        {
            if (dirtyPlates.Count == 0 || isCleaning) return;
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

                HeldItem plate = dirtyPlates[0];
                dirtyPlates.RemoveAt(0);
                plate.ResetForReuse();

                PlateStack stack = FindNearestPlateStack();
                if (stack != null)
                {
                    if (plate.visualRenderer != null)
                    {
                        Renderer r = plate.visualRenderer;
                        if (r.sharedMaterial != null) r.sharedMaterial.color = Color.white;
                        else if (r.material != null) r.material.color = Color.white;
                    }
                    stack.ReturnPlate(plate);
                }
                else
                {
                    cleanPlates.Add(plate);
                    plate.transform.SetParent(cleanStackPoint != null ? cleanStackPoint : transform);
                    plate.transform.localPosition = Vector3.up * (cleanPlates.Count - 1) * 0.05f;
                }
            }
            isCleaning = false;
        }
    }
}
