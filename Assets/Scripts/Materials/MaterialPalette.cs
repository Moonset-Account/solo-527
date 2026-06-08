using UnityEngine;
using UnityEngine.UI;

namespace InkMountainBridge
{
    public class MaterialPalette : MonoBehaviour
    {
        [SerializeField] private Button beamButton;
        [SerializeField] private Button ropeButton;
        [SerializeField] private Button pierButton;
        [SerializeField] private Button testBridgeButton;
        [SerializeField] private GameObject selectedHighlight;
        [SerializeField] private MaterialBudgetManager budgetManager;

        private BridgeBuilder bridgeBuilder;
        private MaterialType selectedType;

        private void Start()
        {
            bridgeBuilder = FindObjectOfType<BridgeBuilder>();
            AutoWireButtons();
            UpdatePalette();
        }

        private void AutoWireButtons()
        {
            if (beamButton == null)
                beamButton = FindChildButtonByName("BeamButton");
            if (ropeButton == null)
                ropeButton = FindChildButtonByName("RopeButton");
            if (pierButton == null)
                pierButton = FindChildButtonByName("PierButton");
            if (testBridgeButton == null)
                testBridgeButton = FindChildButtonByName("TestBridgeButton");
        }

        private Button FindChildButtonByName(string name)
        {
            var t = transform.Find(name);
            if (t != null) return t.GetComponent<Button>();
            for (int i = 0; i < transform.childCount; i++)
            {
                var child = transform.GetChild(i);
                if (child.name.Contains(name) || child.name.Contains(name.Replace("Button", "")))
                    return child.GetComponent<Button>();
            }
            return null;
        }

        private void OnEnable()
        {
            GameEvents.OnMaterialUsed += OnMaterialUsed;

            if (beamButton != null) beamButton.onClick.AddListener(SelectBeam);
            if (ropeButton != null) ropeButton.onClick.AddListener(SelectRope);
            if (pierButton != null) pierButton.onClick.AddListener(SelectPier);
            if (testBridgeButton != null) testBridgeButton.onClick.AddListener(OnTestBridgeClicked);
        }

        private void OnDisable()
        {
            GameEvents.OnMaterialUsed -= OnMaterialUsed;

            if (beamButton != null) beamButton.onClick.RemoveListener(SelectBeam);
            if (ropeButton != null) ropeButton.onClick.RemoveListener(SelectRope);
            if (pierButton != null) pierButton.onClick.RemoveListener(SelectPier);
            if (testBridgeButton != null) testBridgeButton.onClick.RemoveListener(OnTestBridgeClicked);
        }

        public void SelectBeam()
        {
            selectedType = MaterialType.Beam;
            HighlightSelected(MaterialType.Beam);
            if (bridgeBuilder != null) bridgeBuilder.SelectMaterial(MaterialType.Beam);
        }

        public void SelectRope()
        {
            selectedType = MaterialType.Rope;
            HighlightSelected(MaterialType.Rope);
            if (bridgeBuilder != null) bridgeBuilder.SelectMaterial(MaterialType.Rope);
        }

        public void SelectPier()
        {
            selectedType = MaterialType.StonePier;
            HighlightSelected(MaterialType.StonePier);
            if (bridgeBuilder != null) bridgeBuilder.SelectMaterial(MaterialType.StonePier);
        }

        public void OnTestBridgeClicked()
        {
            var levelController = FindObjectOfType<LevelController>();
            if (levelController != null)
            {
                levelController.StartTestPhase();
            }
        }

        public void UpdatePalette()
        {
            if (budgetManager == null) return;

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
            if (selectedHighlight == null) return;

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
