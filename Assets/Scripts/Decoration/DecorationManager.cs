using System;
using System.Collections.Generic;
using UnityEngine;
using DecorMatch3.Core;

namespace DecorMatch3.Decoration
{
    public class DecorationChoice
    {
        public string SlotId;
        public DecorationSlotType SlotType;
        public DecorationChoiceType ChoiceType;

        public FurnitureItem SelectedFurniture;
        public ColorPalette SelectedPalette;
        public MaterialData SelectedMaterial;

        public int ChoiceId;
        public string ChoiceValue;
        public int MaterialCost;
        public int CoinCost;
    }

    public enum DecorationChoiceType
    {
        Furniture,
        ColorPalette,
        Material,
        Custom
    }

    public class DecorationManager
    {
        private readonly DecorationOrder _currentOrder;
        private readonly Dictionary<string, DecorationChoice> _choices = new Dictionary<string, DecorationChoice>();
        private readonly Dictionary<int, int> _materialsSpent = new Dictionary<int, int>();
        private int _coinsSpent;

        public DecorationOrder CurrentOrder => _currentOrder;
        public IReadOnlyDictionary<string, DecorationChoice> Choices => _choices;
        public int TotalCoinsSpent => _coinsSpent;
        public IReadOnlyDictionary<int, int> MaterialsSpent => _materialsSpent;

        public event Action<string, DecorationChoice> OnChoiceMade;
        public event Action<string, DecorationChoice> OnChoiceChanged;
        public event Action OnAllChoicesMade;

        public DecorationManager(DecorationOrder order)
        {
            _currentOrder = order;
        }

        public void MakeFurnitureChoice(string slotId, FurnitureItem furniture, bool recordAnalytics = true)
        {
            DecorationSlot slot = FindSlot(slotId);
            if (slot == null)
            {
                Debug.LogError($"[DecorationManager] Slot not found: {slotId}");
                return;
            }

            if (furniture != null && !slot.AvailableFurniture.Contains(furniture))
            {
                Debug.LogWarning($"[DecorationManager] Furniture not available for slot: {slotId}");
            }

            DecorationChoice choice = new DecorationChoice
            {
                SlotId = slotId,
                SlotType = slot.SlotType,
                ChoiceType = DecorationChoiceType.Furniture,
                SelectedFurniture = furniture,
                ChoiceId = furniture?.FurnitureId ?? -1,
                ChoiceValue = furniture?.FurnitureName ?? "None",
                MaterialCost = 0,
                CoinCost = furniture?.Cost ?? 0
            };

            ApplyChoice(slotId, choice);

            if (furniture != null)
            {
                foreach (var kvp in furniture.MaterialCost)
                {
                    SpendMaterial(kvp.Key, kvp.Value);
                }
                _coinsSpent += furniture.Cost;
            }

            int preferenceScore = CalculatePreferenceScore(slot, choice);

            if (recordAnalytics)
            {
                AnalyticsSystem.Instance?.RecordDecorationChoice(
                    _currentOrder.OrderId,
                    slot.SlotType.ToString(),
                    choice.ChoiceId,
                    choice.ChoiceValue,
                    preferenceScore);
            }
        }

        public void MakeColorPaletteChoice(string slotId, ColorPalette palette, bool recordAnalytics = true)
        {
            DecorationSlot slot = FindSlot(slotId);
            if (slot == null)
            {
                Debug.LogError($"[DecorationManager] Slot not found: {slotId}");
                return;
            }

            DecorationChoice choice = new DecorationChoice
            {
                SlotId = slotId,
                SlotType = slot.SlotType,
                ChoiceType = DecorationChoiceType.ColorPalette,
                SelectedPalette = palette,
                ChoiceId = palette?.PaletteId ?? -1,
                ChoiceValue = palette?.PaletteName ?? "None",
                MaterialCost = 0,
                CoinCost = 0
            };

            ApplyChoice(slotId, choice);

            if (palette != null)
            {
                SpendMaterial(palette.WallMaterialId, palette.WallMaterialAmount);
                SpendMaterial(palette.FloorMaterialId, palette.FloorMaterialAmount);
            }

            int preferenceScore = CalculatePreferenceScore(slot, choice);

            if (recordAnalytics)
            {
                AnalyticsSystem.Instance?.RecordDecorationChoice(
                    _currentOrder.OrderId,
                    slot.SlotType.ToString(),
                    choice.ChoiceId,
                    choice.ChoiceValue,
                    preferenceScore);
            }
        }

        public void MakeMaterialChoice(string slotId, MaterialData material, int amount, bool recordAnalytics = true)
        {
            DecorationSlot slot = FindSlot(slotId);
            if (slot == null)
            {
                Debug.LogError($"[DecorationManager] Slot not found: {slotId}");
                return;
            }

            DecorationChoice choice = new DecorationChoice
            {
                SlotId = slotId,
                SlotType = slot.SlotType,
                ChoiceType = DecorationChoiceType.Material,
                SelectedMaterial = material,
                ChoiceId = material?.MaterialId ?? -1,
                ChoiceValue = material?.MaterialName ?? "None",
                MaterialCost = amount,
                CoinCost = 0
            };

            ApplyChoice(slotId, choice);

            if (material != null)
            {
                SpendMaterial(material.MaterialId, amount);
            }

            int preferenceScore = CalculatePreferenceScore(slot, choice);

            if (recordAnalytics)
            {
                AnalyticsSystem.Instance?.RecordDecorationChoice(
                    _currentOrder.OrderId,
                    slot.SlotType.ToString(),
                    choice.ChoiceId,
                    choice.ChoiceValue,
                    preferenceScore);
            }
        }

        private void ApplyChoice(string slotId, DecorationChoice choice)
        {
            bool isNew = !_choices.ContainsKey(slotId);

            if (!isNew)
            {
                DecorationChoice oldChoice = _choices[slotId];
                RefundChoice(oldChoice);
                OnChoiceChanged?.Invoke(slotId, choice);
            }

            _choices[slotId] = choice;
            OnChoiceMade?.Invoke(slotId, choice);

            CheckAllRequiredSlots();
        }

        private void RefundChoice(DecorationChoice oldChoice)
        {
            if (oldChoice == null) return;

            _coinsSpent -= oldChoice.CoinCost;

            if (oldChoice.SelectedFurniture != null)
            {
                foreach (var kvp in oldChoice.SelectedFurniture.MaterialCost)
                {
                    RefundMaterial(kvp.Key, kvp.Value);
                }
            }

            if (oldChoice.SelectedPalette != null)
            {
                RefundMaterial(oldChoice.SelectedPalette.WallMaterialId, oldChoice.SelectedPalette.WallMaterialAmount);
                RefundMaterial(oldChoice.SelectedPalette.FloorMaterialId, oldChoice.SelectedPalette.FloorMaterialAmount);
            }

            if (oldChoice.SelectedMaterial != null && oldChoice.MaterialCost > 0)
            {
                RefundMaterial(oldChoice.SelectedMaterial.MaterialId, oldChoice.MaterialCost);
            }
        }

        private void SpendMaterial(int materialId, int amount)
        {
            if (!_materialsSpent.ContainsKey(materialId))
                _materialsSpent[materialId] = 0;
            _materialsSpent[materialId] += amount;
        }

        private void RefundMaterial(int materialId, int amount)
        {
            if (_materialsSpent.ContainsKey(materialId))
            {
                _materialsSpent[materialId] -= amount;
                if (_materialsSpent[materialId] <= 0)
                    _materialsSpent.Remove(materialId);
            }
        }

        private void CheckAllRequiredSlots()
        {
            foreach (DecorationSlot slot in _currentOrder.RequiredSlots)
            {
                if (!_choices.ContainsKey(slot.SlotId) || _choices[slot.SlotId] == null)
                    return;
            }

            OnAllChoicesMade?.Invoke();
        }

        public int CalculatePreferenceScore(DecorationSlot slot, DecorationChoice choice)
        {
            if (_currentOrder?.Customer == null || choice == null) return 50;

            int score = 50;
            CustomerProfile customer = _currentOrder.Customer;

            if (slot.PreferredStyles != null)
            {
                foreach (DecorationStyle style in slot.PreferredStyles)
                {
                    int styleScore = customer.GetStyleScore(style);
                    if (choice.SelectedFurniture != null && choice.SelectedFurniture.StyleTags != null)
                    {
                        foreach (DecorationStyle fs in choice.SelectedFurniture.StyleTags)
                        {
                            if (fs == style) score += 15;
                        }
                    }
                    if (choice.SelectedPalette != null && choice.SelectedPalette.OverallStyleTags != null)
                    {
                        foreach (DecorationStyle ps in choice.SelectedPalette.OverallStyleTags)
                        {
                            if (ps == style) score += 15;
                        }
                    }
                    score += Mathf.RoundToInt(styleScore * 0.2f);
                }
            }

            if (choice.SelectedFurniture != null)
            {
                score += customer.GetFurnitureTypeScore(choice.SelectedFurniture.Type) - 50;
                score += customer.GetMaterialScore(choice.SelectedFurniture.PrimaryMaterial) - 50;
                score += Mathf.RoundToInt(customer.GetColorScore(choice.SelectedFurniture.PrimaryColor) * 0.3f);
            }

            if (choice.SelectedPalette != null)
            {
                score += Mathf.RoundToInt(customer.GetColorScore(choice.SelectedPalette.WallPrimary) * 0.4f);
                score += Mathf.RoundToInt(customer.GetColorScore(choice.SelectedPalette.FloorPrimary) * 0.3f);
                score += customer.GetMaterialScore(choice.SelectedPalette.WallMaterial) - 50;
                score += customer.GetMaterialScore(choice.SelectedPalette.FloorMaterial) - 50;
            }

            if (choice.SelectedMaterial != null)
            {
                score += customer.GetMaterialScore(choice.SelectedMaterial.Category) - 50;
                if (choice.SelectedMaterial.StyleTags != null)
                {
                    foreach (DecorationStyle style in choice.SelectedMaterial.StyleTags)
                    {
                        score += Mathf.RoundToInt(customer.GetStyleScore(style) * 0.1f);
                    }
                }
            }

            return Mathf.Clamp(score, 0, 100);
        }

        public DecorationChoice GetChoiceForSlot(string slotId)
        {
            _choices.TryGetValue(slotId, out DecorationChoice choice);
            return choice;
        }

        public bool AreAllRequiredSlotsFilled()
        {
            foreach (DecorationSlot slot in _currentOrder.RequiredSlots)
            {
                if (!_choices.ContainsKey(slot.SlotId) || _choices[slot.SlotId] == null)
                    return false;
            }
            return true;
        }

        public int GetTotalSpent()
        {
            int total = _coinsSpent;
            foreach (var kvp in _materialsSpent)
            {
                total += kvp.Value * 5;
            }
            return total;
        }

        public bool IsWithinBudget()
        {
            int spent = GetTotalSpent();
            return spent <= _currentOrder.BudgetMax;
        }

        public DecorationSlot FindSlot(string slotId)
        {
            DecorationSlot slot = _currentOrder.RequiredSlots.Find(s => s.SlotId == slotId);
            if (slot != null) return slot;
            return _currentOrder.OptionalSlots.Find(s => s.SlotId == slotId);
        }

        public void ClearChoice(string slotId)
        {
            if (_choices.TryGetValue(slotId, out DecorationChoice oldChoice))
            {
                RefundChoice(oldChoice);
                _choices.Remove(slotId);
            }
        }

        public void ClearAllChoices()
        {
            _choices.Clear();
            _materialsSpent.Clear();
            _coinsSpent = 0;
        }
    }
}
