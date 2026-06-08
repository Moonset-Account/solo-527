using System;
using UnityEngine;
using DecorMatch3.Data;

namespace DecorMatch3.Gameplay.Decoration
{
    public class DecorationSlotVisual : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer slotRenderer;
        [SerializeField] private SpriteRenderer furnitureRenderer;
        [SerializeField] private GameObject highlightEffect;
        [SerializeField] private GameObject occupiedIndicator;

        public DecorationSlot SlotData { get; private set; }
        public bool IsOccupied { get; private set; }

        public event Action<DecorationSlot> OnSlotClicked;

        public void Initialize(DecorationSlot slot)
        {
            SlotData = slot;
            IsOccupied = false;
            UpdateVisualState();
        }

        public void SetOccupied(bool occupied)
        {
            IsOccupied = occupied;
            UpdateVisualState();
        }

        private void UpdateVisualState()
        {
            if (highlightEffect != null)
            {
                highlightEffect.SetActive(false);
            }

            if (occupiedIndicator != null)
            {
                occupiedIndicator.SetActive(IsOccupied);
            }

            if (slotRenderer != null)
            {
                Color baseColor = IsOccupied ? new Color(0.8f, 0.9f, 1f, 0.2f) : new Color(0.8f, 0.85f, 0.95f, 0.4f);
                slotRenderer.color = baseColor;
            }
        }

        public void ShowHighlight(bool show)
        {
            if (highlightEffect != null)
            {
                highlightEffect.SetActive(show);
            }
        }

        public void SetFurnitureColor(Color color)
        {
            if (furnitureRenderer != null)
            {
                furnitureRenderer.color = color;
            }
        }

        private void OnMouseEnter()
        {
            ShowHighlight(true);
        }

        private void OnMouseExit()
        {
            ShowHighlight(false);
        }

        private void OnMouseDown()
        {
            OnSlotClicked?.Invoke(SlotData);
        }
    }
}
