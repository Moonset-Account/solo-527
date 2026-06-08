using System;
using System.Collections.Generic;

namespace SpaceCourier.Data
{
    [Serializable]
    public class GameRuntimeData
    {
        public int CurrentLevelId;
        public int CurrentTurn;
        public int TotalScore;

        public ShipState Ship = new ShipState();
        public PlayerState Player = new PlayerState();
        public List<ContractState> ActiveContracts = new List<ContractState>();
        public List<ContractState> CompletedContracts = new List<ContractState>();
        public List<int> VisitedNodeIds = new List<int>();
        public List<string> EventHistory = new List<string>();
        public List<CriticalChoiceRecord> CriticalChoices = new List<CriticalChoiceRecord>();
        public int CurrentRouteFuelCost;
        public List<int> PlannedRoute = new List<int>();
    }

    [Serializable]
    public class ShipState
    {
        public int CurrentNodeId;
        public int CurrentFuel;
        public int MaxFuel;
        public int ShipHealth = 100;
        public int CargoCapacity = 100;
        public int UsedCargoSpace;
        public int CargoIntegrity = 100;
        public bool HasShieldUpgrade;
        public bool HasAutoNav;
        public string ShipName = "Reliant";
    }

    [Serializable]
    public class PlayerState
    {
        public int Credits;
        public int Reputation;
        public int TotalDeliveries;
        public int FailedDeliveries;
        public List<string> UnlockedUpgrades = new List<string>();
        public List<string> InventoryItems = new List<string>();
    }

    [Serializable]
    public class ContractState
    {
        public int ContractId;
        public string Title;
        public ContractStatus Status;
        public int TimeRemaining;
        public int CargoIntegrity = 100;
        public int RewardCredits;
        public int RewardReputation;
        public int StartNodeId;
        public int EndNodeId;
        public bool IsMainContract;
        public CargoType Cargo;
        public CargoRiskLevel RiskLevel;
    }

    [Serializable]
    public class CriticalChoiceRecord
    {
        public string ChoiceType;
        public string ChoiceValue;
        public int TurnNumber;
        public int FuelAtChoice;
        public int ReputationAtChoice;
        public string OutcomeNote;
    }

    public enum ContractStatus
    {
        Available,
        Accepted,
        CargoPickedUp,
        InTransit,
        Completed,
        Failed,
        Expired
    }
}
