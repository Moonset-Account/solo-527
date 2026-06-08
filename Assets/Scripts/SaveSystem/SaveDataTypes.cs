using System;
using UnityEngine;

namespace SpaceCourier.SaveSystem
{
    [Serializable]
    public class SettingsData
    {
        [Header("Audio")]
        public float MasterVolume = 1.0f;
        public float MusicVolume = 0.8f;
        public float SfxVolume = 0.9f;
        public bool Muted = false;

        [Header("Display")]
        public bool Fullscreen = true;
        public int ResolutionIndex = 1;
        public int QualityLevel = 2;

        [Header("Gameplay")]
        public bool EnableEventAnimations = true;
        public bool EnableRoutePreview = true;
        public float TextSpeed = 1.0f;

        public static SettingsData GetDefault()
        {
            return new SettingsData
            {
                MasterVolume = 1.0f,
                MusicVolume = 0.8f,
                SfxVolume = 0.9f,
                Muted = false,
                Fullscreen = true,
                ResolutionIndex = 1,
                QualityLevel = 2,
                EnableEventAnimations = true,
                EnableRoutePreview = true,
                TextSpeed = 1.0f
            };
        }
    }

    [Serializable]
    public class SaveData
    {
        public int SaveSlot;
        public string SaveTime;
        public int LevelId;
        public int CurrentTurn;
        public int TotalScore;
        public int CurrentNodeId;

        public ShipSaveData Ship = new ShipSaveData();
        public PlayerSaveData Player = new PlayerSaveData();
        public System.Collections.Generic.List<ContractSaveData> ActiveContracts = new System.Collections.Generic.List<ContractSaveData>();
        public System.Collections.Generic.List<ContractSaveData> CompletedContracts = new System.Collections.Generic.List<ContractSaveData>();
        public System.Collections.Generic.List<int> VisitedNodeIds = new System.Collections.Generic.List<int>();
        public System.Collections.Generic.List<string> EventHistory = new System.Collections.Generic.List<string>();

        public void FromRuntimeData(SpaceCourier.Data.GameRuntimeData runtime)
        {
            if (runtime == null) return;

            CurrentTurn = runtime.CurrentTurn;
            TotalScore = runtime.TotalScore;
            CurrentNodeId = runtime.Ship.CurrentNodeId;

            Ship.FromShipState(runtime.Ship);
            Player.FromPlayerState(runtime.Player);

            ActiveContracts.Clear();
            foreach (var c in runtime.ActiveContracts)
            {
                ActiveContracts.Add(ContractSaveData.FromState(c));
            }

            CompletedContracts.Clear();
            foreach (var c in runtime.CompletedContracts)
            {
                CompletedContracts.Add(ContractSaveData.FromState(c));
            }

            VisitedNodeIds = new System.Collections.Generic.List<int>(runtime.VisitedNodeIds);
            EventHistory = new System.Collections.Generic.List<string>(runtime.EventHistory);
        }

        public SpaceCourier.Data.GameRuntimeData ToRuntimeData()
        {
            var runtime = new SpaceCourier.Data.GameRuntimeData
            {
                CurrentLevelId = LevelId,
                CurrentTurn = CurrentTurn,
                TotalScore = TotalScore,
                Ship = Ship.ToShipState(),
                Player = Player.ToPlayerState(),
                ActiveContracts = new System.Collections.Generic.List<SpaceCourier.Data.ContractState>(),
                CompletedContracts = new System.Collections.Generic.List<SpaceCourier.Data.ContractState>(),
                VisitedNodeIds = new System.Collections.Generic.List<int>(VisitedNodeIds),
                EventHistory = new System.Collections.Generic.List<string>(EventHistory)
            };

            foreach (var c in ActiveContracts)
                runtime.ActiveContracts.Add(c.ToState());
            foreach (var c in CompletedContracts)
                runtime.CompletedContracts.Add(c.ToState());

            return runtime;
        }
    }

    [Serializable]
    public class ShipSaveData
    {
        public int CurrentNodeId;
        public int CurrentFuel;
        public int MaxFuel;
        public int ShipHealth;
        public int CargoIntegrity;
        public string ShipName;

        public void FromShipState(SpaceCourier.Data.ShipState state)
        {
            if (state == null) return;
            CurrentNodeId = state.CurrentNodeId;
            CurrentFuel = state.CurrentFuel;
            MaxFuel = state.MaxFuel;
            ShipHealth = state.ShipHealth;
            CargoIntegrity = state.CargoIntegrity;
            ShipName = state.ShipName;
        }

        public SpaceCourier.Data.ShipState ToShipState()
        {
            return new SpaceCourier.Data.ShipState
            {
                CurrentNodeId = CurrentNodeId,
                CurrentFuel = CurrentFuel,
                MaxFuel = MaxFuel,
                ShipHealth = ShipHealth,
                CargoIntegrity = CargoIntegrity,
                ShipName = ShipName
            };
        }
    }

    [Serializable]
    public class PlayerSaveData
    {
        public int Credits;
        public int Reputation;
        public int TotalDeliveries;
        public int FailedDeliveries;
        public System.Collections.Generic.List<string> UnlockedUpgrades = new System.Collections.Generic.List<string>();
        public System.Collections.Generic.List<string> InventoryItems = new System.Collections.Generic.List<string>();

        public void FromPlayerState(SpaceCourier.Data.PlayerState state)
        {
            if (state == null) return;
            Credits = state.Credits;
            Reputation = state.Reputation;
            TotalDeliveries = state.TotalDeliveries;
            FailedDeliveries = state.FailedDeliveries;
            UnlockedUpgrades = new System.Collections.Generic.List<string>(state.UnlockedUpgrades);
            InventoryItems = new System.Collections.Generic.List<string>(state.InventoryItems);
        }

        public SpaceCourier.Data.PlayerState ToPlayerState()
        {
            return new SpaceCourier.Data.PlayerState
            {
                Credits = Credits,
                Reputation = Reputation,
                TotalDeliveries = TotalDeliveries,
                FailedDeliveries = FailedDeliveries,
                UnlockedUpgrades = new System.Collections.Generic.List<string>(UnlockedUpgrades),
                InventoryItems = new System.Collections.Generic.List<string>(InventoryItems)
            };
        }
    }

    [Serializable]
    public class ContractSaveData
    {
        public int ContractId;
        public string Title;
        public int StatusValue;
        public int TimeRemaining;
        public int CargoIntegrity;
        public int RewardCredits;
        public int RewardReputation;
        public int StartNodeId;
        public int EndNodeId;
        public bool IsMainContract;
        public int CargoValue;
        public int RiskValue;

        public static ContractSaveData FromState(SpaceCourier.Data.ContractState state)
        {
            return new ContractSaveData
            {
                ContractId = state.ContractId,
                Title = state.Title,
                StatusValue = (int)state.Status,
                TimeRemaining = state.TimeRemaining,
                CargoIntegrity = state.CargoIntegrity,
                RewardCredits = state.RewardCredits,
                RewardReputation = state.RewardReputation,
                StartNodeId = state.StartNodeId,
                EndNodeId = state.EndNodeId,
                IsMainContract = state.IsMainContract,
                CargoValue = (int)state.Cargo,
                RiskValue = (int)state.RiskLevel
            };
        }

        public SpaceCourier.Data.ContractState ToState()
        {
            return new SpaceCourier.Data.ContractState
            {
                ContractId = ContractId,
                Title = Title,
                Status = (SpaceCourier.Data.ContractStatus)StatusValue,
                TimeRemaining = TimeRemaining,
                CargoIntegrity = CargoIntegrity,
                RewardCredits = RewardCredits,
                RewardReputation = RewardReputation,
                StartNodeId = StartNodeId,
                EndNodeId = EndNodeId,
                IsMainContract = IsMainContract,
                Cargo = (SpaceCourier.Data.CargoType)CargoValue,
                RiskLevel = (SpaceCourier.Data.CargoRiskLevel)RiskValue
            };
        }
    }

    [Serializable]
    public class PlayRecord
    {
        public string RecordId;
        public string StartTime;
        public string EndTime;
        public float PlayTimeSeconds;
        public int LevelId;
        public bool IsVictory;
        public string EndReason;
        public int FinalScore;
        public int TurnsUsed;
        public int MaxTurns;
        public int DeliveriesCompleted;
        public int DeliveriesFailed;
        public int EventsTriggered;
        public int TotalFuelUsed;
        public int EndingFuel;
        public int EndingCredits;
        public int EndingReputation;
        public System.Collections.Generic.List<CriticalChoiceLog> CriticalChoices = new System.Collections.Generic.List<CriticalChoiceLog>();
    }

    [Serializable]
    public class CriticalChoiceLog
    {
        public string ChoiceType;
        public string ChoiceValue;
        public int TurnNumber;
        public int FuelAtChoice;
        public int ReputationAtChoice;
        public string OutcomeNote;
        public string Timestamp;
    }
}
