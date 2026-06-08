using UnityEngine;
using UnityEngine.UI;

namespace DecorMatch3
{
    public class DecorationUI : MonoBehaviour
    {
        [SerializeField] private Transform _furnitureListContainer;
        [SerializeField] private Transform _paletteListContainer;
        [SerializeField] private GameObject _furnitureItemPrefab;
        [SerializeField] private GameObject _paletteItemPrefab;
        [SerializeField] private Image _roomPreview;
        [SerializeField] private Text _budgetText;
        [SerializeField] private Text _customerNameText;
        [SerializeField] private Text _customerFeedbackText;
        [SerializeField] private Button _submitBtn;
        [SerializeField] private Button _backBtn;
        [SerializeField] private Dropdown _slotSelector;

        private CustomerData _currentCustomer;
        private int _remainingBudget;
        private string _selectedSlot;
        private string _selectedFurnitureId;
        private string _selectedPaletteId;

        private void Start()
        {
            _submitBtn.onClick.AddListener(OnSubmit);
            _backBtn.onClick.AddListener(OnBack);
            if (_slotSelector != null)
            {
                _slotSelector.onValueChanged.AddListener(OnSlotDropdownChanged);
            }
        }

        public void Initialize(string customerId, string roomType)
        {
            if (ConfigManager.Instance != null)
            {
                _currentCustomer = ConfigManager.Instance.GetCustomer(customerId);
            }

            if (_customerNameText != null && _currentCustomer != null)
            {
                _customerNameText.text = _currentCustomer.displayName;
            }

            _remainingBudget = 500;
            UpdateBudget(_remainingBudget);
            PopulatePalettes();

            if (_slotSelector != null && _slotSelector.options != null && _slotSelector.options.Count > 0)
            {
                OnSlotDropdownChanged(0);
            }
        }

        public void PopulateFurnitureList(string slotName)
        {
            if (_furnitureListContainer == null) return;

            foreach (Transform child in _furnitureListContainer)
            {
                Destroy(child.gameObject);
            }

            if (ConfigManager.Instance == null) return;

            _selectedSlot = slotName;

            foreach (var furniture in ConfigManager.Instance.FurnitureCatalog)
            {
                if (furniture.category == slotName)
                {
                    GameObject item = Instantiate(_furnitureItemPrefab, _furnitureListContainer);
                    Text itemText = item.GetComponentInChildren<Text>();
                    Button itemBtn = item.GetComponent<Button>();

                    if (itemText != null) itemText.text = furniture.displayName;
                    string fid = furniture.furnitureId;
                    if (itemBtn != null) itemBtn.onClick.AddListener(() => OnFurnitureSelected(fid));
                }
            }
        }

        public void PopulatePalettes()
        {
            if (_paletteListContainer == null) return;

            foreach (Transform child in _paletteListContainer)
            {
                Destroy(child.gameObject);
            }

            if (ConfigManager.Instance == null) return;

            foreach (var palette in ConfigManager.Instance.ColorPalettes)
            {
                GameObject item = Instantiate(_paletteItemPrefab, _paletteListContainer);
                Text itemText = item.GetComponentInChildren<Text>();
                Button itemBtn = item.GetComponent<Button>();

                if (itemText != null) itemText.text = palette.displayName;
                string pid = palette.paletteId;
                if (itemBtn != null) itemBtn.onClick.AddListener(() => OnPaletteSelected(pid));
            }
        }

        public void OnFurnitureSelected(string furnitureId)
        {
            _selectedFurnitureId = furnitureId;
            UpdateRoomPreview();
            PlayPlaceSound();
        }

        public void OnPaletteSelected(string paletteId)
        {
            _selectedPaletteId = paletteId;
            UpdateRoomPreview();
        }

        public void OnSlotSelected(string slotName)
        {
            PopulateFurnitureList(slotName);
        }

        private void OnSlotDropdownChanged(int index)
        {
            if (_slotSelector != null && _slotSelector.options.Count > index)
            {
                string slotName = _slotSelector.options[index].text;
                OnSlotSelected(slotName);
            }
        }

        public void UpdateRoomPreview()
        {
            if (_roomPreview == null) return;

            if (!string.IsNullOrEmpty(_selectedPaletteId) && ConfigManager.Instance != null)
            {
                var palette = ConfigManager.Instance.GetColorPalette(_selectedPaletteId);
                if (palette != null && palette.hexColors != null && palette.hexColors.Length > 0)
                {
                    Color c;
                    if (ColorUtility.TryParseHtmlString(palette.hexColors[0], out c))
                    {
                        _roomPreview.color = c;
                    }
                }
            }
        }

        public void UpdateBudget(int remaining)
        {
            _remainingBudget = remaining;
            if (_budgetText != null) _budgetText.text = "Budget: " + remaining;
        }

        public void OnSubmit()
        {
            PlayButtonSound();
        }

        public void OnBack()
        {
            PlayButtonSound();
            GameManager.Instance.ChangeState(GameState.LevelSelect);
        }

        public void ShowEvaluationResult(float totalScore, int stars, string feedback)
        {
            if (_customerFeedbackText != null)
            {
                _customerFeedbackText.text = feedback + "\nScore: " + totalScore.ToString("F1") + " | Stars: " + stars;
            }
        }

        public void PlayPlaceSound()
        {
            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySFX("furniture_place");
            }
        }
    }
}
