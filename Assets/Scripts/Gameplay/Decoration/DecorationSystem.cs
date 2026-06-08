using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using DecorMatch3.Core;
using DecorMatch3.Data;
using DecorMatch3.Audio;

namespace DecorMatch3.Gameplay.Decoration
{
    public class DecorationSystem : Singleton<DecorationSystem>
    {
        [Header("Room Rendering")]
        [SerializeField] private Transform roomContainer;
        [SerializeField] private SpriteRenderer wallRenderer;
        [SerializeField] private SpriteRenderer floorRenderer;
        [SerializeField] private Transform furnitureContainer;

        [Header("Slot Prefab")]
        [SerializeField] private GameObject decorationSlotVisualPrefab;

        private RoomData _currentRoom;
        private OrderData _currentOrder;
        private Dictionary<string, GameObject> _slotVisuals = new Dictionary<string, GameObject>();
        private Dictionary<string, FurnitureItem> _placedFurniture = new Dictionary<string, FurnitureItem>();
        private Dictionary<string, ColorOption> _appliedColors = new Dictionary<string, ColorOption>();

        private ColorOption _currentWallColor;
        private ColorOption _currentFloorColor;
        private int _totalCost;

        public RoomData CurrentRoom => _currentRoom;
        public OrderData CurrentOrder => _currentOrder;
        public int TotalCost => _totalCost;
        public IReadOnlyDictionary<string, FurnitureItem> PlacedFurniture => _placedFurniture;
        public IReadOnlyDictionary<string, ColorOption> AppliedColors => _appliedColors;
        public ColorOption CurrentWallColor => _currentWallColor;
        public ColorOption CurrentFloorColor => _currentFloorColor;

        public event Action<RoomData> OnRoomLoaded;
        public event Action<string, FurnitureItem> OnFurniturePlaced;
        public event Action<string, FurnitureItem> OnFurnitureRemoved;
        public event Action<MaterialType, ColorOption> OnColorApplied;
        public event Action<int> OnTotalCostChanged;
        public event Action OnDecorationReset;

        protected override void Awake()
        {
            base.Awake();
        }

        private void Start()
        {
            EventBus.Subscribe<OrderStartedEvent>(OnOrderStarted);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<OrderStartedEvent>(OnOrderStarted);
        }

        private void OnOrderStarted(OrderStartedEvent e)
        {
            LoadRoomForOrder(e.OrderData);
        }

        public void LoadRoomForOrder(OrderData order)
        {
            if (order == null || order.TargetRoom == null)
            {
                Debug.LogError("[DecorationSystem] Invalid order data!");
                return;
            }

            _currentOrder = order;
            _currentRoom = order.TargetRoom;
            ResetDecoration();
            InitializeRoomVisuals();

            AudioManager.Instance?.PlayMusic(MusicType.Decoration);
            GameStateManager.Instance.ChangeState(GameState.Decorating);
            OnRoomLoaded?.Invoke(_currentRoom);
        }

        private void InitializeRoomVisuals()
        {
            ClearFurnitureContainer();

            if (_currentRoom.BaseWallColor != null)
            {
                ApplyWallColor(_currentRoom.BaseWallColor);
            }

            if (_currentRoom.BaseFloorColor != null)
            {
                ApplyFloorColor(_currentRoom.BaseFloorColor);
            }

            foreach (var slot in _currentRoom.DecorationSlots)
            {
                CreateSlotVisual(slot);
            }
        }

        private void CreateSlotVisual(DecorationSlot slot)
        {
            if (decorationSlotVisualPrefab != null && furnitureContainer != null)
            {
                GameObject slotObj = Instantiate(decorationSlotVisualPrefab, furnitureContainer);
                slotObj.transform.localPosition = slot.Position;
                slotObj.transform.localEulerAngles = slot.Rotation;
                slotObj.transform.localScale = slot.Scale;
                slotObj.name = $"Slot_{slot.SlotId}";

                DecorationSlotVisual visual = slotObj.GetComponent<DecorationSlotVisual>();
                if (visual != null)
                {
                    visual.Initialize(slot);
                    visual.OnSlotClicked += HandleSlotClicked;
                }

                _slotVisuals[slot.SlotId] = slotObj;
            }
        }

        private void ClearFurnitureContainer()
        {
            if (furnitureContainer == null) return;

            for (int i = furnitureContainer.childCount - 1; i >= 0; i--)
            {
                Destroy(furnitureContainer.GetChild(i).gameObject);
            }

            _slotVisuals.Clear();
            _placedFurniture.Clear();
        }

        private void HandleSlotClicked(DecorationSlot slot)
        {
            if (_placedFurniture.ContainsKey(slot.SlotId))
            {
                RemoveFurniture(slot.SlotId);
            }

            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            EventBus.Publish(new DecorationSlotClickedEvent { Slot = slot });
        }

        public bool PlaceFurniture(string slotId, FurnitureItem furniture)
        {
            if (furniture == null || !_currentRoom.DecorationSlots.Exists(s => s.SlotId == slotId))
            {
                Debug.LogWarning("[DecorationSystem] Cannot place furniture: invalid slot or furniture.");
                return false;
            }

            DecorationSlot slot = _currentRoom.DecorationSlots.Find(s => s.SlotId == slotId);
            if (slot.AcceptedCategory != furniture.Category)
            {
                Debug.LogWarning($"[DecorationSystem] Category mismatch: slot needs {slot.AcceptedCategory}, furniture is {furniture.Category}");
                return false;
            }

            if (!SaveManager.Instance.SpendCoins(furniture.Cost))
            {
                Debug.LogWarning("[DecorationSystem] Not enough coins!");
                EventBus.Publish(new InsufficientFundsEvent { Required = furniture.Cost, Current = SaveManager.Instance.CurrentSave.Progress.Coins });
                return false;
            }

            if (_slotVisuals.TryGetValue(slotId, out GameObject slotObj))
            {
                if (slot.AcceptedCategory == FurnitureCategory.Sofa)
                {
                    SpriteRenderer renderer = slotObj.GetComponentInChildren<SpriteRenderer>() ?? slotObj.AddComponent<SpriteRenderer>();
                    renderer.color = Color.white;
                    renderer.sortingOrder = 5;
                }
                else
                {
                    SpriteRenderer renderer = slotObj.GetComponentInChildren<SpriteRenderer>();
                    if (renderer == null)
                    {
                        renderer = slotObj.AddComponent<SpriteRenderer>();
                    }
                    renderer.color = new Color(0.9f, 0.9f, 0.95f);
                }
            }

            if (_placedFurniture.TryGetValue(slotId, out FurnitureItem oldFurniture))
            {
                _totalCost -= oldFurniture.Cost;
            }

            _placedFurniture[slotId] = furniture;
            _totalCost += furniture.Cost;
            slot.AssignedFurniture = furniture;

            AudioManager.Instance?.PlaySFX(SFXType.DecorationPlace);
            OnFurniturePlaced?.Invoke(slotId, furniture);
            OnTotalCostChanged?.Invoke(_totalCost);

            return true;
        }

        public void RemoveFurniture(string slotId)
        {
            if (!_placedFurniture.ContainsKey(slotId)) return;

            FurnitureItem furniture = _placedFurniture[slotId];

            int refund = Mathf.FloorToInt(furniture.Cost * 0.8f);
            SaveManager.Instance.AddCoins(refund);
            _totalCost -= furniture.Cost;

            DecorationSlot slot = _currentRoom.DecorationSlots.Find(s => s.SlotId == slotId);
            if (slot != null)
            {
                slot.AssignedFurniture = null;
                slot.AssignedColor = null;
            }

            if (_slotVisuals.TryGetValue(slotId, out GameObject slotObj))
            {
                SpriteRenderer renderer = slotObj.GetComponentInChildren<SpriteRenderer>();
                if (renderer != null)
                {
                    renderer.color = new Color(1f, 1f, 1f, 0.3f);
                }
            }

            _placedFurniture.Remove(slotId);
            if (_appliedColors.ContainsKey(slotId))
            {
                _appliedColors.Remove(slotId);
            }

            AudioManager.Instance?.PlaySFX(SFXType.Popup);
            OnFurnitureRemoved?.Invoke(slotId, furniture);
            OnTotalCostChanged?.Invoke(_totalCost);
        }

        public bool ApplyWallColor(ColorOption colorOption)
        {
            if (colorOption == null) return false;

            if (colorOption.MaterialType != MaterialType.Paint && colorOption.MaterialType != MaterialType.Wallpaper)
            {
                return false;
            }

            if (!SaveManager.Instance.ConsumeMaterial(colorOption.MaterialType, 5))
            {
                EventBus.Publish(new InsufficientMaterialsEvent
                {
                    Material = colorOption.MaterialType,
                    Required = 5,
                    Current = SaveManager.Instance.GetMaterialAmount(colorOption.MaterialType)
                });
                return false;
            }

            _currentWallColor = colorOption;

            if (wallRenderer != null)
            {
                StartCoroutine(ChangeColorSmooth(wallRenderer, colorOption.HexColor, 0.3f));
            }

            if (!SaveManager.Instance.SpendCoins(colorOption.Cost))
            {
                SaveManager.Instance.AddMaterial(colorOption.MaterialType, 5);
                return false;
            }

            _totalCost += colorOption.Cost;

            AudioManager.Instance?.PlaySFX(SFXType.MaterialGain, 0.8f);
            OnColorApplied?.Invoke(MaterialType.Paint, colorOption);
            OnTotalCostChanged?.Invoke(_totalCost);

            return true;
        }

        public bool ApplyFloorColor(ColorOption colorOption)
        {
            if (colorOption == null) return false;

            MaterialType floorMaterial = colorOption.MaterialType;
            if (floorMaterial != MaterialType.Wood && floorMaterial != MaterialType.Tile && floorMaterial != MaterialType.Fabric)
            {
                return false;
            }

            if (!SaveManager.Instance.ConsumeMaterial(floorMaterial, 8))
            {
                EventBus.Publish(new InsufficientMaterialsEvent
                {
                    Material = floorMaterial,
                    Required = 8,
                    Current = SaveManager.Instance.GetMaterialAmount(floorMaterial)
                });
                return false;
            }

            _currentFloorColor = colorOption;

            if (floorRenderer != null)
            {
                StartCoroutine(ChangeColorSmooth(floorRenderer, colorOption.HexColor, 0.3f));
            }

            if (!SaveManager.Instance.SpendCoins(colorOption.Cost))
            {
                SaveManager.Instance.AddMaterial(floorMaterial, 8);
                return false;
            }

            _totalCost += colorOption.Cost;

            AudioManager.Instance?.PlaySFX(SFXType.MaterialGain, 0.8f);
            OnColorApplied?.Invoke(floorMaterial, colorOption);
            OnTotalCostChanged?.Invoke(_totalCost);

            return true;
        }

        public bool ApplyFurnitureColor(string slotId, ColorOption colorOption)
        {
            if (colorOption == null || !_placedFurniture.ContainsKey(slotId)) return false;

            FurnitureItem furniture = _placedFurniture[slotId];
            if (!SaveManager.Instance.ConsumeMaterial(colorOption.MaterialType, 3))
            {
                EventBus.Publish(new InsufficientMaterialsEvent
                {
                    Material = colorOption.MaterialType,
                    Required = 3,
                    Current = SaveManager.Instance.GetMaterialAmount(colorOption.MaterialType)
                });
                return false;
            }

            if (!SaveManager.Instance.SpendCoins(colorOption.Cost))
            {
                SaveManager.Instance.AddMaterial(colorOption.MaterialType, 3);
                return false;
            }

            _appliedColors[slotId] = colorOption;
            DecorationSlot slot = _currentRoom.DecorationSlots.Find(s => s.SlotId == slotId);
            if (slot != null)
            {
                slot.AssignedColor = colorOption;
            }

            if (_slotVisuals.TryGetValue(slotId, out GameObject slotObj))
            {
                SpriteRenderer renderer = slotObj.GetComponentInChildren<SpriteRenderer>();
                if (renderer != null)
                {
                    StartCoroutine(ChangeColorSmooth(renderer, colorOption.HexColor, 0.25f));
                }
            }

            _totalCost += colorOption.Cost;

            AudioManager.Instance?.PlaySFX(SFXType.DecorationPlace, 0.7f);
            OnColorApplied?.Invoke(colorOption.MaterialType, colorOption);
            OnTotalCostChanged?.Invoke(_totalCost);

            return true;
        }

        private IEnumerator ChangeColorSmooth(SpriteRenderer renderer, Color targetColor, float duration)
        {
            Color startColor = renderer.color;
            float timer = 0f;

            while (timer < duration)
            {
                timer += Time.deltaTime;
                renderer.color = Color.Lerp(startColor, targetColor, timer / duration);
                yield return null;
            }

            renderer.color = targetColor;
        }

        public void ResetDecoration()
        {
            _placedFurniture.Clear();
            _appliedColors.Clear();
            _currentWallColor = null;
            _currentFloorColor = null;
            _totalCost = 0;

            OnDecorationReset?.Invoke();
            OnTotalCostChanged?.Invoke(0);
        }

        public List<DecorationSlot> GetEmptySlots()
        {
            List<DecorationSlot> emptySlots = new List<DecorationSlot>();
            foreach (var slot in _currentRoom.DecorationSlots)
            {
                if (!_placedFurniture.ContainsKey(slot.SlotId))
                {
                    emptySlots.Add(slot);
                }
            }
            return emptySlots;
        }

        public List<DecorationSlot> GetFilledSlots()
        {
            List<DecorationSlot> filledSlots = new List<DecorationSlot>();
            foreach (var slot in _currentRoom.DecorationSlots)
            {
                if (_placedFurniture.ContainsKey(slot.SlotId))
                {
                    filledSlots.Add(slot);
                }
            }
            return filledSlots;
        }

        public bool IsSlotEmpty(string slotId)
        {
            return !_placedFurniture.ContainsKey(slotId);
        }

        public int GetPlacedCategoryCount(FurnitureCategory category)
        {
            int count = 0;
            foreach (var furniture in _placedFurniture.Values)
            {
                if (furniture.Category == category)
                {
                    count++;
                }
            }
            return count;
        }

        public List<ColorStyle> GetAppliedColorStyles()
        {
            List<ColorStyle> styles = new List<ColorStyle>();

            if (_currentWallColor != null)
            {
                styles.Add(_currentWallColor.Style);
            }
            if (_currentFloorColor != null)
            {
                styles.Add(_currentFloorColor.Style);
            }
            foreach (var color in _appliedColors.Values)
            {
                if (color != null)
                {
                    styles.Add(color.Style);
                }
            }
            foreach (var furniture in _placedFurniture.Values)
            {
                styles.Add(furniture.PrimaryColorStyle);
            }

            return styles;
        }

        public int GetAverageQualityRating()
        {
            if (_placedFurniture.Count == 0) return 0;

            int totalQuality = 0;
            foreach (var furniture in _placedFurniture.Values)
            {
                totalQuality += furniture.QualityRating;
            }
            return Mathf.RoundToInt((float)totalQuality / _placedFurniture.Count);
        }
    }

    public struct DecorationSlotClickedEvent
    {
        public DecorationSlot Slot;
    }

    public struct InsufficientFundsEvent
    {
        public int Required;
        public int Current;
    }

    public struct InsufficientMaterialsEvent
    {
        public MaterialType Material;
        public int Required;
        public int Current;
    }
}
