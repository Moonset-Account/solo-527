using System;
using UnityEngine;
using SpaceCourier.Core;
using SpaceCourier.Data;
using SpaceCourier.DataModule;

namespace SpaceCourier.Gameplay
{
    public class FuelManager : MonoBehaviour, IModule
    {
        public ModuleType Type => ModuleType.FuelManager;

        private DataManager dataManager;

        public event Action<int, int, int, string> OnFuelChanged;
        public event Action OnFuelDepleted;
        public event Action OnFuelLow;

        public int CurrentFuel => dataManager?.RuntimeData?.Ship?.CurrentFuel ?? 0;
        public int MaxFuel => dataManager?.RuntimeData?.Ship?.MaxFuel ?? 0;
        public float FuelPercentage => MaxFuel > 0 ? (float)CurrentFuel / MaxFuel : 0f;
        public bool IsFuelLow => FuelPercentage <= 0.2f;
        public bool IsEmpty => CurrentFuel <= 0;

        public void Initialize()
        {
            dataManager = GameManager.Instance?.GetModule<DataManager>(ModuleType.DataManager);
            Debug.Log("[FuelManager] Initialized.");
        }

        public int GetTravelCost(int fromNodeId, int toNodeId)
        {
            return dataManager?.CalculateFuelCost(fromNodeId, toNodeId) ?? int.MaxValue;
        }

        public int GetPathCost(System.Collections.Generic.List<int> path)
        {
            return dataManager?.CalculatePathFuelCost(path) ?? 0;
        }

        public bool CanAffordTravel(int fromNodeId, int toNodeId)
        {
            return CurrentFuel >= GetTravelCost(fromNodeId, toNodeId);
        }

        public bool CanAffordPath(System.Collections.Generic.List<int> path)
        {
            return CurrentFuel >= GetPathCost(path);
        }

        public bool ConsumeFuel(int amount, string reason = "Travel")
        {
            if (amount <= 0) return true;
            if (CurrentFuel < amount)
            {
                Debug.LogWarning($"[FuelManager] Not enough fuel! Need {amount}, have {CurrentFuel}");
                return false;
            }

            var runtimeData = dataManager.RuntimeData;
            runtimeData.Ship.CurrentFuel -= amount;

            var delta = -amount;
            OnFuelChanged?.Invoke(CurrentFuel, MaxFuel, delta, reason);
            EventBus.Publish(new GameEvents.FuelChanged
            {
                CurrentFuel = CurrentFuel,
                MaxFuel = MaxFuel,
                Delta = delta,
                Reason = reason
            });

            if (IsFuelLow && !IsEmpty)
            {
                OnFuelLow?.Invoke();
                Debug.LogWarning("[FuelManager] Fuel is running low!");
            }

            if (IsEmpty)
            {
                OnFuelDepleted?.Invoke();
                Debug.LogError("[FuelManager] Fuel depleted!");
            }

            dataManager.NotifyDataChanged();
            return true;
        }

        public bool AddFuel(int amount, string reason = "Refuel")
        {
            if (amount <= 0) return false;

            var runtimeData = dataManager.RuntimeData;
            var oldFuel = runtimeData.Ship.CurrentFuel;
            runtimeData.Ship.CurrentFuel = Mathf.Min(MaxFuel, oldFuel + amount);
            var actualAdded = runtimeData.Ship.CurrentFuel - oldFuel;

            if (actualAdded > 0)
            {
                OnFuelChanged?.Invoke(CurrentFuel, MaxFuel, actualAdded, reason);
                EventBus.Publish(new GameEvents.FuelChanged
                {
                    CurrentFuel = CurrentFuel,
                    MaxFuel = MaxFuel,
                    Delta = actualAdded,
                    Reason = reason
                });

                dataManager.NotifyDataChanged();
                return true;
            }

            return false;
        }

        public bool RefuelAtCurrentStation(int fuelToBuy, int creditsPerUnit)
        {
            var runtimeData = dataManager.RuntimeData;
            var currentNode = dataManager.GetNode(runtimeData.Ship.CurrentNodeId);
            if (currentNode == null || !currentNode.HasFuelStation)
            {
                Debug.LogWarning("[FuelManager] Cannot refuel here - no fuel station.");
                return false;
            }

            var maxAffordable = runtimeData.Player.Credits / creditsPerUnit;
            var maxRoom = MaxFuel - CurrentFuel;
            var actualBuy = Mathf.Min(fuelToBuy, maxAffordable, maxRoom);

            if (actualBuy <= 0)
            {
                Debug.LogWarning("[FuelManager] Cannot buy fuel - not enough credits or tank is full.");
                return false;
            }

            var cost = actualBuy * creditsPerUnit;
            runtimeData.Player.Credits -= cost;

            return AddFuel(actualBuy, $"Station refuel (-{cost}c)");
        }

        public void SetMaxFuel(int newMax)
        {
            var runtimeData = dataManager.RuntimeData;
            runtimeData.Ship.MaxFuel = Mathf.Max(1, newMax);
            if (runtimeData.Ship.CurrentFuel > runtimeData.Ship.MaxFuel)
            {
                runtimeData.Ship.CurrentFuel = runtimeData.Ship.MaxFuel;
            }

            OnFuelChanged?.Invoke(CurrentFuel, MaxFuel, 0, "Max fuel changed");
            dataManager.NotifyDataChanged();
        }

        public void ResetToStartingFuel(int startingFuel, int maxFuel)
        {
            var runtimeData = dataManager.RuntimeData;
            runtimeData.Ship.MaxFuel = maxFuel;
            runtimeData.Ship.CurrentFuel = startingFuel;

            OnFuelChanged?.Invoke(CurrentFuel, MaxFuel, 0, "Reset");
            dataManager.NotifyDataChanged();
        }

        public void Shutdown()
        {
            Debug.Log("[FuelManager] Shutdown.");
        }
    }
}
