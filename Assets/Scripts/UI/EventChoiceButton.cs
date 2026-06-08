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

        private void Awake()
        {
            EnsureComponents();
        }

        private void EnsureComponents()
        {
            var rt = GetComponent<RectTransform>();
            if (rt == null)
            {
                rt = gameObject.AddComponent<RectTransform>();
            }
            if (rt.sizeDelta == Vector2.zero)
            {
                rt.sizeDelta = new Vector2(850, 90);
            }

            if (backgroundImage == null)
            {
                backgroundImage = GetComponent<Image>();
                if (backgroundImage == null)
                {
                    backgroundImage = gameObject.AddComponent<Image>();
                    backgroundImage.color = availableColor;
                }
            }
            if (button == null)
            {
                button = GetComponent<Button>();
                if (button == null)
                {
                    button = gameObject.AddComponent<Button>();
                    button.targetGraphic = backgroundImage;
                    var cols = button.colors;
                    cols.highlightedColor = hoverColor;
                    cols.normalColor = availableColor;
                    cols.pressedColor = hoverColor * 0.7f;
                    cols.disabledColor = unavailableColor;
                    button.colors = cols;
                }
            }
            if (canvasGroup == null)
            {
                canvasGroup = GetComponent<CanvasGroup>();
                if (canvasGroup == null)
                {
                    canvasGroup = gameObject.AddComponent<CanvasGroup>();
                }
            }
            if (choiceIndicator == null)
            {
                var obj = new GameObject("ChoiceIndicator");
                obj.transform.SetParent(transform, false);
                var iRT = obj.AddComponent<RectTransform>();
                iRT.anchorMin = new Vector2(0, 0.5f);
                iRT.anchorMax = new Vector2(0, 0.5f);
                iRT.pivot = new Vector2(0, 0.5f);
                iRT.offsetMin = new Vector2(0, -30);
                iRT.offsetMax = new Vector2(6, 30);
                var img = obj.AddComponent<Image>();
                img.color = new Color(0.4f, 1f, 0.6f);
                img.enabled = false;
                choiceIndicator = img;
            }

            var fonts = Resources.FindObjectsOfTypeAll<TMP_FontAsset>();
            TMP_FontAsset font = fonts.Length > 0 ? fonts[0] : null;

            if (choiceText == null)
            {
                var obj = new GameObject("ChoiceText");
                obj.transform.SetParent(transform, false);
                var iRT = obj.AddComponent<RectTransform>();
                iRT.anchorMin = new Vector2(0.03f, 0.6f);
                iRT.anchorMax = new Vector2(0.97f, 0.6f);
                iRT.offsetMin = new Vector2(12, -18);
                iRT.offsetMax = new Vector2(-12, 18);
                var txt = obj.AddComponent<TextMeshProUGUI>();
                txt.fontSize = 20;
                txt.color = Color.white;
                txt.alignment = TextAlignmentOptions.Left;
                txt.font = font;
                choiceText = txt;
            }
            if (requirementText == null)
            {
                var obj = new GameObject("RequirementText");
                obj.transform.SetParent(transform, false);
                var iRT = obj.AddComponent<RectTransform>();
                iRT.anchorMin = new Vector2(0.03f, 0.2f);
                iRT.anchorMax = new Vector2(0.97f, 0.2f);
                iRT.offsetMin = new Vector2(12, -12);
                iRT.offsetMax = new Vector2(-12, 12);
                var txt = obj.AddComponent<TextMeshProUGUI>();
                txt.fontSize = 15;
                txt.color = new Color(1f, 0.85f, 0.45f);
                txt.alignment = TextAlignmentOptions.Left;
                txt.font = font;
                requirementText = txt;
            }
        }

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
