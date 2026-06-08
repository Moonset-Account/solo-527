using UnityEngine;
using ShadowPlatformer.Player;
using ShadowPlatformer.Mechanics;

namespace ShadowPlatformer.Mechanics
{
    public class InteractableLever : MonoBehaviour
    {
        public MechanismTrigger linkedTrigger;
        public Sprite leverOffSprite;
        public Sprite leverOnSprite;
        public float interactionRadius = 1.5f;

        private SpriteRenderer _sr;
        private bool _playerInRange;

        private void Awake()
        {
            _sr = GetComponent<SpriteRenderer>();
        }

        private void Update()
        {
            var player = FindObjectOfType<PlayerController>();
            if (player == null) return;

            float dist = Vector2.Distance(transform.position, player.transform.position);
            _playerInRange = dist <= interactionRadius;

            if (_playerInRange && Input.GetButtonDown("Interact"))
            {
                linkedTrigger?.Interact();
                UpdateVisual();
            }
        }

        private void UpdateVisual()
        {
            if (_sr == null || linkedTrigger == null) return;
            _sr.sprite = linkedTrigger.IsActivated ? leverOnSprite : leverOffSprite;
        }
    }
}
