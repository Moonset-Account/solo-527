using UnityEngine;
using System.Collections.Generic;

namespace DecorMatch3
{
    public enum ActionType
    {
        Furniture,
        Color,
        Palette
    }

    public class DecorationAction
    {
        public ActionType Type;
        public string SlotName;
        public string OldValue;
        public string NewValue;
    }

    public class DecorationController : MonoBehaviour
    {
        private Room _currentRoom;
        private CustomerOrder _currentOrder;
        private FurnitureCatalog _catalog;
        private DecorationEvaluator _evaluator;
        private int _remainingBudget;
        private bool _isActive;
        private int _currentLevelId;
        private Stack<DecorationAction> _actionHistory = new Stack<DecorationAction>();

        public void StartDecoration(string customerId, string roomType)
        {
            var config = ConfigManager.Instance;
            if (config == null) return;
            CustomerData customer = config.GetCustomer(customerId);
            if (customer == null) return;
            _currentOrder = null;
            _currentRoom = new Room();
            _currentRoom.RoomType = roomType;
            _remainingBudget = 0;
            _actionHistory.Clear();
            _isActive = true;
            _currentLevelId = 0;
        }

        public void SetupOrder(CustomerOrderData orderData, CustomerData customer, RoomSlotData[] slotData)
        {
            _currentOrder = CustomerOrder.FromData(orderData, customer);
            if (_currentRoom == null) _currentRoom = new Room();
            _currentRoom.Initialize(_currentOrder.RoomType, slotData);
            _remainingBudget = _currentOrder != null ? _currentOrder.Budget : 0;
        }

        public void SetDependencies(FurnitureCatalog catalog, DecorationEvaluator evaluator)
        {
            _catalog = catalog;
            _evaluator = evaluator;
            if (_evaluator != null)
            {
                _evaluator.OnEvaluationComplete += OnEvaluationComplete;
            }
        }

        public void SelectFurniture(string slotName, string furnitureId)
        {
            if (!_isActive || _currentRoom == null || _catalog == null) return;
            var furniture = _catalog.GetFurniture(furnitureId);
            if (furniture == null) return;
            if (!_catalog.IsUnlocked(furnitureId)) return;
            if (!CanAfford(furniture.cost)) return;
            var slot = _currentRoom.GetSlot(slotName);
            if (slot == null) return;
            string oldValue = slot.CurrentFurnitureId;
            _remainingBudget -= furniture.cost;
            _currentRoom.SetSlotFurniture(slotName, furnitureId);
            _actionHistory.Push(new DecorationAction
            {
                Type = ActionType.Furniture,
                SlotName = slotName,
                OldValue = oldValue,
                NewValue = furnitureId
            });
            GameEvents.TriggerDecorationApplied(slotName, furnitureId);
            AudioManager.Instance.PlaySFX("furniture_place");
        }

        public void SelectColor(string slotName, string hexColor)
        {
            if (!_isActive || _currentRoom == null) return;
            var slot = _currentRoom.GetSlot(slotName);
            if (slot == null) return;
            string oldValue = slot.AppliedColorHex;
            _currentRoom.SetSlotColor(slotName, hexColor);
            _actionHistory.Push(new DecorationAction
            {
                Type = ActionType.Color,
                SlotName = slotName,
                OldValue = oldValue,
                NewValue = hexColor
            });
            GameEvents.TriggerDecorationApplied(slotName, hexColor);
        }

        public void ApplyPalette(string paletteId)
        {
            if (!_isActive || _currentRoom == null) return;
            var config = ConfigManager.Instance;
            if (config == null) return;
            var palette = config.GetColorPalette(paletteId);
            if (palette == null) return;
            string oldPaletteId = _currentRoom.AppliedPaletteId;
            _currentRoom.ApplyPalette(paletteId, palette);
            _actionHistory.Push(new DecorationAction
            {
                Type = ActionType.Palette,
                SlotName = "",
                OldValue = oldPaletteId ?? "",
                NewValue = paletteId
            });
        }

        public void SubmitDecoration()
        {
            if (!_isActive || _evaluator == null) return;
            _evaluator.StartEvaluation(_currentRoom, _currentOrder, _catalog);
            _evaluator.PlayEvaluationAnimation();
        }

        public void OnEvaluationComplete(DecorationResult result)
        {
            if (result == null) return;
            _isActive = false;
            var save = SaveManager.Instance;
            if (save != null && save.CurrentSave != null)
            {
                save.UpdateLevelRecord(_currentLevelId, (int)result.TotalScore, result.Stars, result.Stars > 0);
            }
            if (result.Stars >= 1)
            {
                int nextLevel = save != null && save.CurrentSave != null ? save.CurrentSave.playerProfile.currentLevel + 1 : 1;
                if (save != null && save.CurrentSave != null)
                {
                    save.CurrentSave.playerProfile.currentLevel = nextLevel;
                }
            }
            int reward = result.Stars * 50;
            if (save != null && save.CurrentSave != null)
            {
                save.CurrentSave.playerProfile.coins += reward;
            }
            GameEvents.TriggerCoinsChanged(reward);
        }

        public int GetRemainingBudget()
        {
            return _remainingBudget;
        }

        public List<FurnitureData> GetAvailableFurnitureForSlot(string slotName)
        {
            if (_catalog == null || _currentRoom == null) return new List<FurnitureData>();
            var slot = _currentRoom.GetSlot(slotName);
            if (slot == null) return new List<FurnitureData>();
            var result = new List<FurnitureData>();
            var byCategory = _catalog.GetByCategory(slotName);
            if (byCategory != null)
            {
                foreach (var f in byCategory)
                {
                    if (_catalog.IsUnlocked(f.furnitureId) && f.cost <= _remainingBudget)
                    {
                        result.Add(f);
                    }
                }
            }
            return result;
        }

        public List<ColorPaletteData> GetAvailablePalettes()
        {
            var result = new List<ColorPaletteData>();
            var config = ConfigManager.Instance;
            if (config == null || config.ColorPalettes == null) return result;
            foreach (var palette in config.ColorPalettes)
            {
                result.Add(palette);
            }
            return result;
        }

        public bool CanAfford(int cost)
        {
            return _remainingBudget >= cost;
        }

        public void UndoLastAction()
        {
            if (_actionHistory.Count == 0 || _currentRoom == null) return;
            var action = _actionHistory.Pop();
            switch (action.Type)
            {
                case ActionType.Furniture:
                    var slot = _currentRoom.GetSlot(action.SlotName);
                    if (slot != null)
                    {
                        if (!string.IsNullOrEmpty(action.NewValue) && _catalog != null)
                        {
                            var furniture = _catalog.GetFurniture(action.NewValue);
                            if (furniture != null) _remainingBudget += furniture.cost;
                        }
                        slot.CurrentFurnitureId = action.OldValue;
                    }
                    break;
                case ActionType.Color:
                    _currentRoom.SetSlotColor(action.SlotName, action.OldValue);
                    break;
                case ActionType.Palette:
                    _currentRoom.AppliedPaletteId = action.OldValue;
                    break;
            }
        }
    }
}
