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
        private bool listenersRegistered;

        private void Awake()
        {
            bridgeBuilder = FindObjectOfType<BridgeBuilder>();
            DiscoverButtons();
            RegisterListeners();
        }

        private void OnDestroy()
        {
            UnregisterListeners();
        }

        private void DiscoverButtons()
        {
            if (beamButton == null) beamButton = FindChildButton("BeamButton");
            if (ropeButton == null) ropeButton = FindChildButton("RopeButton");
            if (pierButton == null) pierButton = FindChildButton("PierButton");
            if (testBridgeButton == null) testBridgeButton = FindChildButton("TestBridgeButton");
            if (budgetManager == null) budgetManager = FindObjectOfType<MaterialBudgetManager>();
        }

        private Button FindChildButton(string name)
        {
            Transform t = transform.Find(name);
            if (t != null) return t.GetComponent<Button>();

            for (int i = 0; i < transform.childCount; i++)
            {
                Transform child = transform.GetChild(i);
                if (child.name.Contains(name))
                    return child.GetComponent<Button>();
            }
            return null;
        }

        private void RegisterListeners()
        {
            if (listenersRegistered) return;
            listenersRegistered = true;

            if (beamButton != null) beamButton.onClick.AddListener(SelectBeam);
            if (ropeButton != null) ropeButton.onClick.AddListener(SelectRope);
            if (pierButton != null) pierButton.onClick.AddListener(SelectPier);
            if (testBridgeButton != null) testBridgeButton.onClick.AddListener(OnTestBridgeClicked);

            GameEvents.OnMaterialUsed += OnMaterialUsed;
        }

        private void UnregisterListeners()
        {
            if (!listenersRegistered) return;
            listenersRegistered = false;

            if (beamButton != null) beamButton.onClick.RemoveListener(SelectBeam);
            if (ropeButton != null) ropeButton.onClick.RemoveListener(SelectRope);
            if (pierButton != null) pierButton.onClick.RemoveListener(SelectPier);
            if (testBridgeButton != null) testBridgeButton.onClick.RemoveListener(OnTestBridgeClicked);

            GameEvents.OnMaterialUsed -= OnMaterialUsed;
        }

        private void Start()
        {
            UpdatePalette();
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
            var lc = FindObjectOfType<LevelController>();
            if (lc != null) lc.StartTestPhase();
        }

        public void UpdatePalette()
        {
            if (budgetManager == null) return;

            UpdateButtonLabel(beamButton, "Beam", budgetManager.GetRemaining(MaterialType.Beam));
            UpdateButtonLabel(ropeButton, "Rope", budgetManager.GetRemaining(MaterialType.Rope));
            UpdateButtonLabel(pierButton, "Pier", budgetManager.GetRemaining(MaterialType.StonePier));
        }

        private void UpdateButtonLabel(Button btn, string label, int remaining)
        {
            if (btn == null) return;
            btn.interactable = remaining > 0;
            var txt = btn.GetComponentInChildren<Text>();
            if (txt != null) txt.text = $"{label} ({remaining})";
        }

        public void HighlightSelected(MaterialType type)
        {
            if (selectedHighlight == null) return;
            selectedHighlight.SetActive(true);
            switch (type)
            {
                case MaterialType.Beam:
                    if (beamButton != null) selectedHighlight.transform.SetParent(beamButton.transform, false);
                    break;
                case MaterialType.Rope:
                    if (ropeButton != null) selectedHighlight.transform.SetParent(ropeButton.transform, false);
                    break;
                case MaterialType.StonePier:
                    if (pierButton != null) selectedHighlight.transform.SetParent(pierButton.transform, false);
                    break;
            }
        }

        private void OnMaterialUsed(MaterialType type, int remaining)
        {
            UpdatePalette();
        }
    }
}
