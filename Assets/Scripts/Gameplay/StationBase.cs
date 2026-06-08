using Kitchen.Config;
using Kitchen.Core;
using UnityEngine;

namespace Kitchen.Gameplay
{
    public abstract class StationBase : MonoBehaviour, IInteractable
    {
        [Header("Station Config")]
        public StationType stationType;
        public string stationId;
        public float interactionRadius = 1.5f;
        public SpriteRenderer highlightRenderer;

        [Header("Runtime")]
        [SerializeField] protected bool isHighlighted;
        [SerializeField] protected PlayerController lastInteractingPlayer;

        public bool IsHighlighted => isHighlighted;

        public abstract void Interact(PlayerController player);

        public virtual void SetHighlight(bool highlighted, PlayerController player)
        {
            isHighlighted = highlighted;
            lastInteractingPlayer = player;
            if (highlightRenderer != null)
            {
                highlightRenderer.enabled = highlighted;
            }
        }

        protected virtual void Awake()
        {
            if (highlightRenderer != null)
            {
                highlightRenderer.enabled = false;
            }
        }
    }
}
