using UnityEngine;
using ShadowPlatformer.Player;
using ShadowPlatformer.Core;

namespace ShadowPlatformer.Save
{
    public class Checkpoint : MonoBehaviour
    {
        public string checkpointId;
        public bool isActivated { get; private set; }

        [Header("Visual")]
        public GameObject activatedVisual;
        public GameObject deactivatedVisual;

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (isActivated) return;
            var player = other.GetComponent<PlayerController>();
            if (player == null) return;

            Activate(other.transform.position);
        }

        public void Activate(Vector2 playerPos)
        {
            isActivated = true;
            var player = FindObjectOfType<PlayerController>();
            if (player != null)
                player.SetSpawnPoint(playerPos);

            SaveManager.Instance?.SaveCheckpoint(checkpointId, playerPos);

            if (activatedVisual != null) activatedVisual.SetActive(true);
            if (deactivatedVisual != null) deactivatedVisual.SetActive(false);

            EventBus.Instance.RaiseCheckpointReached();
        }

        private void Start()
        {
            if (activatedVisual != null) activatedVisual.SetActive(false);
            if (deactivatedVisual != null) deactivatedVisual.SetActive(true);
        }
    }
}
