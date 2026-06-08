using System;
using System.Collections.Generic;
using UnityEngine;
using SpaceCourier.Core;
using SpaceCourier.Data;
using SpaceCourier.DataModule;

namespace SpaceCourier.Gameplay
{
    public class TurnManager : MonoBehaviour, IModule
    {
        public ModuleType Type => ModuleType.TurnManager;

        private DataManager dataManager;

        public event Action<int> OnTurnStarted;
        public event Action<int> OnTurnEnded;
        public event Action<int> OnTurnsLowWarning;
        public event Action OnOutOfTurns;

        public int CurrentTurn => dataManager?.RuntimeData?.CurrentTurn ?? 1;
        public int MaxTurns => dataManager?.CurrentLevel?.MaxTurns ?? 30;
        public int TurnsRemaining => Mathf.Max(0, MaxTurns - CurrentTurn + 1);
        public bool IsFinalTurn => TurnsRemaining <= 1;
        public float TurnProgress => (float)CurrentTurn / MaxTurns;

        private bool isProcessingTurn = false;
        public bool IsProcessingTurn => isProcessingTurn;

        public void Initialize()
        {
            dataManager = GameManager.Instance?.GetModule<DataManager>(ModuleType.DataManager);
            Debug.Log("[TurnManager] Initialized.");
        }

        public void StartNewGame()
        {
            var runtimeData = dataManager.RuntimeData;
            runtimeData.CurrentTurn = 1;
            isProcessingTurn = false;

            TriggerTurnStarted();
        }

        public bool AdvanceTurn(int turnCost = 1)
        {
            if (isProcessingTurn)
            {
                Debug.LogWarning("[TurnManager] Cannot advance turn - still processing.");
                return false;
            }

            if (turnCost <= 0) turnCost = 1;

            TriggerTurnEnded();

            isProcessingTurn = true;
            var runtimeData = dataManager.RuntimeData;
            runtimeData.CurrentTurn += turnCost;

            CheckContractTimeLimits();

            if (TurnsRemaining <= 3 && TurnsRemaining > 0)
            {
                OnTurnsLowWarning?.Invoke(TurnsRemaining);
            }

            if (CurrentTurn > MaxTurns)
            {
                OnOutOfTurns?.Invoke();
                isProcessingTurn = false;
                return false;
            }

            TriggerTurnStarted();
            isProcessingTurn = false;
            return true;
        }

        private void CheckContractTimeLimits()
        {
            var runtimeData = dataManager.RuntimeData;
            var contractsToFail = new List<ContractState>();

            foreach (var contract in runtimeData.ActiveContracts)
            {
                if (contract.Status == ContractStatus.Accepted ||
                    contract.Status == ContractStatus.CargoPickedUp ||
                    contract.Status == ContractStatus.InTransit)
                {
                    contract.TimeRemaining--;

                    if (contract.TimeRemaining <= 0)
                    {
                        contractsToFail.Add(contract);
                    }
                }
            }

            foreach (var contract in contractsToFail)
            {
                FailContract(contract, "时间到期");
            }
        }

        public void StartTravelTurn()
        {
            var runtimeData = dataManager.RuntimeData;

            foreach (var contract in runtimeData.ActiveContracts)
            {
                if (contract.Status == ContractStatus.CargoPickedUp)
                {
                    contract.Status = ContractStatus.InTransit;
                }
            }
        }

        public void ApplyTurnDelta(int delta, string reason = "Event")
        {
            if (delta == 0) return;

            var runtimeData = dataManager.RuntimeData;
            runtimeData.CurrentTurn += delta;

            Debug.Log($"[TurnManager] Turn adjusted by {delta} ({reason}). Now turn {CurrentTurn}");

            if (delta < 0)
            {
                CheckContractTimeLimits();
            }

            if (TurnsRemaining <= 3 && TurnsRemaining > 0)
            {
                OnTurnsLowWarning?.Invoke(TurnsRemaining);
            }

            if (CurrentTurn > MaxTurns)
            {
                OnOutOfTurns?.Invoke();
            }
        }

        private void TriggerTurnStarted()
        {
            OnTurnStarted?.Invoke(CurrentTurn);
            EventBus.Publish(new GameEvents.TurnStarted { TurnNumber = CurrentTurn });
            Debug.Log($"[TurnManager] Turn {CurrentTurn} started. {TurnsRemaining} turns remaining.");
        }

        private void TriggerTurnEnded()
        {
            OnTurnEnded?.Invoke(CurrentTurn);
            EventBus.Publish(new GameEvents.TurnEnded { TurnNumber = CurrentTurn });
            Debug.Log($"[TurnManager] Turn {CurrentTurn} ended.");
        }

        public bool AcceptContract(ContractData contractData)
        {
            if (contractData == null) return false;

            var runtimeData = dataManager.RuntimeData;

            var existing = runtimeData.ActiveContracts.Find(c => c.ContractId == contractData.ContractId);
            if (existing != null)
            {
                Debug.LogWarning("[TurnManager] Contract already accepted.");
                return false;
            }

            var state = new ContractState
            {
                ContractId = contractData.ContractId,
                Title = contractData.Title,
                Status = ContractStatus.Accepted,
                TimeRemaining = contractData.TimeLimit,
                CargoIntegrity = 100,
                RewardCredits = contractData.RewardCredits,
                RewardReputation = contractData.RewardReputation,
                StartNodeId = contractData.StartNodeId,
                EndNodeId = contractData.EndNodeId,
                IsMainContract = contractData.IsMainContract,
                Cargo = contractData.Cargo,
                RiskLevel = contractData.RiskLevel
            };

            runtimeData.ActiveContracts.Add(state);

            EventBus.Publish(new GameEvents.ContractAccepted { ContractId = contractData.ContractId });
            Debug.Log($"[TurnManager] Contract accepted: {contractData.Title}");

            dataManager.NotifyDataChanged();
            return true;
        }

        public bool PickUpCargo(int contractId)
        {
            var runtimeData = dataManager.RuntimeData;
            var contract = runtimeData.ActiveContracts.Find(c => c.ContractId == contractId);
            if (contract == null || contract.Status != ContractStatus.Accepted) return false;

            if (contract.StartNodeId != runtimeData.Ship.CurrentNodeId)
            {
                Debug.LogWarning("[TurnManager] Cannot pick up cargo - wrong node.");
                return false;
            }

            contract.Status = ContractStatus.CargoPickedUp;
            Debug.Log($"[TurnManager] Cargo picked up for contract: {contract.Title}");
            dataManager.NotifyDataChanged();
            return true;
        }

        public bool CompleteContractDelivery(int contractId, out int creditsEarned, out int repEarned)
        {
            creditsEarned = 0;
            repEarned = 0;

            var runtimeData = dataManager.RuntimeData;
            var contract = runtimeData.ActiveContracts.Find(c => c.ContractId == contractId);
            if (contract == null) return false;

            if (contract.Status != ContractStatus.CargoPickedUp &&
                contract.Status != ContractStatus.InTransit)
            {
                Debug.LogWarning("[TurnManager] Cannot deliver - contract not in transit.");
                return false;
            }

            if (contract.EndNodeId != runtimeData.Ship.CurrentNodeId)
            {
                Debug.LogWarning("[TurnManager] Cannot deliver - wrong node.");
                return false;
            }

            if (contract.TimeRemaining < 0)
            {
                FailContract(contract, "延迟送达");
                return false;
            }

            var cargoIntegrityFactor = contract.CargoIntegrity / 100f;
            var repManager = GameManager.Instance?.GetModule<ReputationManager>(ModuleType.ReputationManager);
            var bonusPercent = repManager?.GetBonusRewardPercentage() ?? 0;
            var bonusMultiplier = 1 + (bonusPercent / 100f);

            creditsEarned = Mathf.RoundToInt(contract.RewardCredits * cargoIntegrityFactor * bonusMultiplier);
            repEarned = Mathf.RoundToInt(contract.RewardReputation * cargoIntegrityFactor);

            runtimeData.Player.Credits += creditsEarned;
            repManager?.ChangeReputation(repEarned, $"完成合同: {contract.Title}");

            contract.Status = ContractStatus.Completed;
            runtimeData.Player.TotalDeliveries++;
            runtimeData.CompletedContracts.Add(contract);
            runtimeData.ActiveContracts.Remove(contract);

            runtimeData.TotalScore += creditsEarned + repEarned * 10;

            EventBus.Publish(new GameEvents.ContractCompleted
            {
                ContractId = contractId,
                IsSuccess = true,
                Reward = creditsEarned
            });

            Debug.Log($"[TurnManager] Contract delivered: {contract.Title}. +{creditsEarned}c, +{repEarned} rep");
            dataManager.NotifyDataChanged();
            return true;
        }

        public void FailContract(ContractState contract, string reason)
        {
            if (contract == null) return;

            var runtimeData = dataManager.RuntimeData;
            contract.Status = ContractStatus.Failed;
            runtimeData.Player.FailedDeliveries++;

            var contractData = dataManager.GetContract(contract.ContractId);
            var repPenalty = contractData != null ? contractData.FailureReputationPenalty : 10;

            var repManager = GameManager.Instance?.GetModule<ReputationManager>(ModuleType.ReputationManager);
            repManager?.ChangeReputation(-repPenalty, $"合同失败: {contract.Title} ({reason})");

            runtimeData.CompletedContracts.Add(contract);
            runtimeData.ActiveContracts.Remove(contract);

            EventBus.Publish(new GameEvents.ContractCompleted
            {
                ContractId = contract.ContractId,
                IsSuccess = false,
                Reward = 0
            });

            Debug.Log($"[TurnManager] Contract failed: {contract.Title} - {reason}");
            dataManager.NotifyDataChanged();
        }

        public void DamageCargo(int damagePercent)
        {
            if (damagePercent <= 0) return;

            var runtimeData = dataManager.RuntimeData;
            foreach (var contract in runtimeData.ActiveContracts)
            {
                if (contract.Status == ContractStatus.CargoPickedUp ||
                    contract.Status == ContractStatus.InTransit)
                {
                    contract.CargoIntegrity = Mathf.Max(0, contract.CargoIntegrity - damagePercent);
                    Debug.Log($"[TurnManager] Cargo damaged: {contract.Title} -> {contract.CargoIntegrity}%");
                }
            }
            dataManager.NotifyDataChanged();
        }

        public ContractState GetMainContract()
        {
            var runtimeData = dataManager.RuntimeData;
            var mainContractId = dataManager.CurrentLevel?.MainContractId ?? -1;

            var active = runtimeData.ActiveContracts.Find(c => c.ContractId == mainContractId);
            if (active != null) return active;

            return runtimeData.CompletedContracts.Find(c => c.ContractId == mainContractId);
        }

        public bool IsMainContractCompleted()
        {
            var main = GetMainContract();
            return main != null && main.Status == ContractStatus.Completed;
        }

        public bool IsMainContractFailed()
        {
            var main = GetMainContract();
            return main != null && main.Status == ContractStatus.Failed;
        }

        public int CalculateFinalScore()
        {
            var runtimeData = dataManager.RuntimeData;
            var score = runtimeData.TotalScore;

            score += runtimeData.Player.Credits;
            score += runtimeData.Player.Reputation * 15;
            score += TurnsRemaining * 50;

            var mainContract = GetMainContract();
            if (mainContract != null && mainContract.Status == ContractStatus.Completed)
            {
                score += 1000;
            }

            var successRate = runtimeData.Player.TotalDeliveries > 0
                ? (float)runtimeData.Player.TotalDeliveries /
                  (runtimeData.Player.TotalDeliveries + runtimeData.Player.FailedDeliveries)
                : 0f;
            score = Mathf.RoundToInt(score * (1 + successRate));

            return score;
        }

        public void Shutdown()
        {
            Debug.Log("[TurnManager] Shutdown.");
        }
    }
}
