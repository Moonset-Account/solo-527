using UnityEngine;
using UnityEngine.UI;

namespace InkMountainBridge
{
    public class MaterialPalette : MonoBehaviour
    {
        [SerializeField] private Button beamButton;
        [SerializeField] private Button ropeButton;
        [SerializeField] private Button pierButton;
        [SerializeField] private GameObject selectedHighlight;
        [SerializeField] private MaterialBudgetManager budgetManager;

        private MaterialType selectedType;

        private void OnEnable()
        {
            GameEvents.OnMaterialUsed += OnMaterialUsed;
            beamButton?.onClick.AddListener(SelectBeam);
            ropeButton?.onClick.AddListener(SelectRope);
            pierButton?.onClick.AddListener(SelectPier);
        }

        private void OnDisable()
        {
            GameEvents.OnMaterialUsed -= OnMaterialUsed;
            beamButton?.onClick.RemoveListener(SelectBeam);
            ropeButton?.onClick.RemoveListener(SelectRope);
            pierButton?.onClick.RemoveListener(SelectPier);
        }

        private void Start()
        {
            UpdatePalette();
        }

        public void SelectBeam()
        {
            selectedType = MaterialType.Beam;
            HighlightSelected(MaterialType.Beam);
        }

        public void SelectRope()
        {
            selectedType = MaterialType.Rope;
            HighlightSelected(MaterialType.Rope);
        }

        public void SelectPier()
        {
            selectedType = MaterialType.StonePier;
            HighlightSelected(MaterialType.StonePier);
        }

        public void UpdatePalette()
        {
            if (beamButton != null)
            {
                beamButton.interactable = budgetManager.GetRemaining(MaterialType.Beam) > 0;
                var text = beamButton.GetComponentInChildren<Text>();
                if (text != null)
                    text.text = $"Beam ({budgetManager.GetRemaining(MaterialType.Beam)})";
            }

            if (ropeButton != null)
            {
                ropeButton.interactable = budgetManager.GetRemaining(MaterialType.Rope) > 0;
                var text = ropeButton.GetComponentInChildren<Text>();
                if (text != null)
                    text.text = $"Rope ({budgetManager.GetRemaining(MaterialType.Rope)})";
            }

            if (pierButton != null)
            {
                pierButton.interactable = budgetManager.GetRemaining(MaterialType.StonePier) > 0;
                var text = pierButton.GetComponentInChildren<Text>();
                if (text != null)
                    text.text = $"Pier ({budgetManager.GetRemaining(MaterialType.StonePier)})";
            }
        }

        public void HighlightSelected(MaterialType type)
        {
            if (selectedHighlight == null)
                return;

            selectedHighlight.SetActive(true);
            switch (type)
            {
                case MaterialType.Beam:
                    selectedHighlight.transform.SetParent(beamButton?.transform, false);
                    break;
                case MaterialType.Rope:
                    selectedHighlight.transform.SetParent(ropeButton?.transform, false);
                    break;
                case MaterialType.StonePier:
                    selectedHighlight.transform.SetParent(pierButton?.transform, false);
                    break;
            }
        }

        private void OnMaterialUsed(MaterialType type, int remaining)
        {
            UpdatePalette();
        }
    }
}
