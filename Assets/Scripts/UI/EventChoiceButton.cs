using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using SpaceCourier.Data;

namespace SpaceCourier.UI
{
    public class EventChoiceButton : MonoBehaviour
    {
        [Header("References")]
        public Button button;
        public Image backgroundImage;
        public TextMeshProUGUI choiceText;
        public TextMeshProUGUI requirementText;
        public Image choiceIndicator;
        public CanvasGroup canvasGroup;

        [Header("Colors")]
        public Color availableColor = new Color(0.15f, 0.3f, 0.45f, 1f);
        public Color unavailableColor = new Color(0.15f, 0.15f, 0.15f, 1f);
        public Color remediationColor = new Color(0.2f, 0.4f, 0.2f, 1f);
        public Color hoverColor = new Color(0.25f, 0.5f, 0.7f, 1f);

        private EventChoice choiceData;
        public event Action<EventChoice> OnChoiceClicked;

        public void Initialize(EventChoice choice, bool isAvailable, bool isRemediation)
        {
            choiceData = choice;

            if (choiceText != null)
            {
                choiceText.text = choice.Text;
            }

            if (requirementText != null)
            {
                requirementText.text = BuildRequirementText(choice.Requirement);
                requirementText.gameObject.SetActive(!string.IsNullOrEmpty(requirementText.text));
            }

            if (backgroundImage != null)
            {
                if (!isAvailable) backgroundImage.color = unavailableColor;
                else if (isRemediation) backgroundImage.color = remediationColor;
                else backgroundImage.color = availableColor;
            }

            if (canvasGroup != null)
            {
                canvasGroup.interactable = isAvailable;
                canvasGroup.blocksRaycasts = isAvailable;
                canvasGroup.alpha = isAvailable ? 1f : 0.5f;
            }

            if (choiceIndicator != null)
            {
                choiceIndicator.enabled = isRemediation;
                if (isRemediation)
                {
                    choiceIndicator.color = new Color(0.4f, 1f, 0.6f, 0.8f);
                }
            }

            if (button != null)
            {
                button.onClick.RemoveAllListeners();
                button.onClick.AddListener(() =>
                {
                    if (isAvailable) OnChoiceClicked?.Invoke(choiceData);
                });
            }
        }

        private string BuildRequirementText(ChoiceRequirement req)
        {
            if (req == null) return string.Empty;

            var parts = new System.Collections.Generic.List<string>();
            if (req.FuelCost > 0) parts.Add($"⛽-{req.FuelCost}");
            if (req.MinFuel > 0 && req.FuelCost == 0) parts.Add($"⛽≥{req.MinFuel}");
            if (req.CreditCost > 0) parts.Add($"💰-{req.CreditCost}");
            if (req.ReputationCost > 0) parts.Add($"⭐-{req.ReputationCost}");
            if (req.MinReputation > 0) parts.Add($"⭐≥{req.MinReputation}");
            if (!string.IsNullOrEmpty(req.RequiredItem)) parts.Add($"🎒{req.RequiredItem}");

            return parts.Count > 0 ? string.Join("  ", parts) : string.Empty;
        }
    }
}
