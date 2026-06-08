using System.Collections.Generic;
using UnityEngine;

namespace SpaceCourier.Data
{
    [CreateAssetMenu(fileName = "ContractData", menuName = "SpaceCourier/Contract")]
    public class ContractData : ScriptableObject
    {
        public int ContractId;
        public string Title;
        public string Description;
        public CargoType Cargo;
        public int StartNodeId;
        public int EndNodeId;
        public int TimeLimit;
        public int RewardCredits;
        public int RewardReputation;
        public int FailureReputationPenalty;
        public List<string> RequiredItems = new List<string>();
        public CargoRiskLevel RiskLevel;
        public bool IsUrgent;
        public bool IsMainContract;
    }

    public enum CargoType
    {
        GeneralGoods,
        MedicalSupplies,
        HighValueTech,
        PerishableFood,
        Hazardous,
        LiveAnimals,
        Mail,
        Passenger
    }

    public enum CargoRiskLevel
    {
        Low,
        Medium,
        High,
        Critical
    }
}
