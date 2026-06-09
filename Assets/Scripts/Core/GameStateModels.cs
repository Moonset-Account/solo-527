using System;
using System.Collections.Generic;

namespace BalloonPost.Core
{
    [Serializable]
    public class PlayerState
    {
        public AxialCoord Position;
        public int Fuel;
        public int MaxFuel;
        public int Money;
        public int MaxCarryWeight;
        public int CurrentWeight;
        public int CurrentTurn;
        public int Reputation;
        public List<string> CompletedTutorialSteps;

        public PlayerState()
        {
            CompletedTutorialSteps = new List<string>();
        }

        public PlayerState Clone()
        {
            return new PlayerState
            {
                Position = Position,
                Fuel = Fuel,
                MaxFuel = MaxFuel,
                Money = Money,
                MaxCarryWeight = MaxCarryWeight,
                CurrentWeight = CurrentWeight,
                CurrentTurn = CurrentTurn,
                Reputation = Reputation,
                CompletedTutorialSteps = new List<string>(CompletedTutorialSteps)
            };
        }
    }

    [Serializable]
    public class DeliveryRecord
    {
        public string ContractId;
        public int RewardEarned;
        public int TurnsTaken;
        public int DamageTaken;
        public bool OnTime;
        public bool Intact;
        public int Complaints;
    }

    [Serializable]
    public class SettlementReport
    {
        public int TotalEarnings;
        public int BaseContractValue;
        public int PriorityBonus;
        public int OnTimeBonus;
        public int FragileBonus;
        public int FuelSavings;
        public int Deductions;
        public int LatePenalties;
        public int DamagePenalties;
        public int FuelCosts;
        public int ComplaintCount;
        public int DeliveredCount;
        public int UndeliveredCount;
        public int ExpiredCount;
        public int FinalReputationChange;
        public int FinalScore;

        public List<DeliveryRecord> DeliveryRecords;
        public List<string> UndeliveredContractIds;
        public List<string> ComplaintDetails;
        public List<string> Highlights;

        public SettlementReport()
        {
            DeliveryRecords = new List<DeliveryRecord>();
            UndeliveredContractIds = new List<string>();
            ComplaintDetails = new List<string>();
            Highlights = new List<string>();
        }
    }

    [Serializable]
    public class UndoAction
    {
        public string ActionType;
        public PlayerState PreviousPlayerState;
        public RoutePlan PreviousRoutePlan;
        public List<Contract> PreviousContracts;
        public int RemovedStepCount;
        public string Description;
    }
}
