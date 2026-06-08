using System;
using System.Collections.Generic;
using UnityEngine;
using SpaceCourier.Core;
using SpaceCourier.Data;
using SpaceCourier.DataModule;

namespace SpaceCourier.Gameplay
{
    public class GameplayController : MonoBehaviour
    {
        private DataManager dataManager;
        private TurnManager turnManager;
        private FuelManager fuelManager;
        private ReputationManager reputationManager;
        private EventManager eventManager;

        public event Action<int, int> OnShipArrived;
        public event Action<string, bool> OnFeedbackMessage;

        public bool IsReady { get; private set; } = false;

        public void Initialize()
        {
            dataManager = GameManager.Instance?.GetModule<DataManager>(ModuleType.DataManager);
            turnManager = GameManager.Instance?.GetModule<TurnManager>(ModuleType.TurnManager);
            fuelManager = GameManager.Instance?.GetModule<FuelManager>(ModuleType.FuelManager);
            reputationManager = GameManager.Instance?.GetModule<ReputationManager>(ModuleType.ReputationManager);
            eventManager = GameManager.Instance?.GetModule<EventManager>(ModuleType.EventManager);

            IsReady = true;
            Debug.Log("[GameplayController] Initialized.");
        }

        public bool StartLevel(int levelId)
        {
            if (!dataManager.LoadLevel(levelId)) return false;

            var level = dataManager.CurrentLevel;
            fuelManager.ResetToStartingFuel(level.StartingFuel, level.MaxFuel);

            turnManager.StartNewGame();

            if (!level.MandatoryContractIds.Contains(level.MainContractId))
            {
                var mainContract = dataManager.GetContract(level.MainContractId);
                if (mainContract != null)
                {
                    turnManager.AcceptContract(mainContract);
                }
            }

            Debug.Log($"[GameplayController] Level {level.LevelName} started.");
            return true;
        }

        public List<int> PlanRoute(int targetNodeId, out int fuelCost, out string errorMsg)
        {
            fuelCost = 0;
            errorMsg = string.Empty;

            var runtimeData = dataManager.RuntimeData;
            var shipNodeId = runtimeData.Ship.CurrentNodeId;

            if (shipNodeId == targetNodeId)
            {
                errorMsg = "目标与当前位置相同";
                return null;
            }

            var path = dataManager.FindOptimalPath(shipNodeId, targetNodeId, out int totalCost);
            if (path == null || path.Count < 2)
            {
                errorMsg = "无法找到有效航线";
                return null;
            }

            if (!fuelManager.CanAffordPath(path))
            {
                errorMsg = $"燃料不足！需要 {totalCost}，当前只有 {fuelManager.CurrentFuel}";
                fuelCost = totalCost;
                return null;
            }

            fuelCost = totalCost;
            runtimeData.PlannedRoute = new List<int>(path);
            runtimeData.CurrentRouteFuelCost = totalCost;
            dataManager.NotifyDataChanged();

            EventBus.Publish(new GameEvents.RoutePlanned { NodePath = path.ToArray(), TotalFuelCost = totalCost });
            return path;
        }

        public RouteExecutingResult ExecuteRoute(List<int> path)
        {
            var result = new RouteExecutingResult { Success = false };

            if (path == null || path.Count < 2)
            {
                result.Message = "无效路线";
                return result;
            }

            turnManager.StartTravelTurn();

            var runtimeData = dataManager.RuntimeData;
            int fuelUsed = 0;

            for (int i = 0; i < path.Count - 1; i++)
            {
                var fromNode = path[i];
                var toNode = path[i + 1];
                var cost = dataManager.CalculateFuelCost(fromNode, toNode);

                if (!fuelManager.ConsumeFuel(cost, $"航行 {dataManager.GetNode(fromNode)?.NodeName} -> {dataManager.GetNode(toNode)?.NodeName}"))
                {
                    result.Message = $"燃料耗尽于 {dataManager.GetNode(fromNode)?.NodeName}";
                    result.InterruptedAtNodeId = fromNode;
                    result.FuelUsed = fuelUsed;
                    CheckGameOver();
                    return result;
                }

                fuelUsed += cost;
                runtimeData.Ship.CurrentNodeId = toNode;
                runtimeData.VisitedNodeIds.Add(toNode);

                EventBus.Publish(new GameEvents.ShipMoved { FromNodeId = fromNode, ToNodeId = toNode });
                OnShipArrived?.Invoke(fromNode, toNode);

                if (!turnManager.AdvanceTurn())
                {
                    result.Message = "时间耗尽";
                    result.InterruptedAtNodeId = toNode;
                    result.FuelUsed = fuelUsed;
                    CheckGameOver();
                    return result;
                }

                var nodeEvent = eventManager?.TriggerEventForNode(toNode);
                if (nodeEvent != null && nodeEvent.BlocksProgress)
                {
                    result.Message = "途中遇到事件";
                    result.InterruptedAtNodeId = toNode;
                    result.FuelUsed = fuelUsed;
                    result.EncounteredEvent = true;
                    result.Paused = true;
                    dataManager.NotifyDataChanged();
                    return result;
                }
            }

            runtimeData.PlannedRoute.Clear();
            runtimeData.CurrentRouteFuelCost = 0;
            ProcessNodeArrival();

            result.Success = true;
            result.FuelUsed = fuelUsed;
            result.FinalNodeId = path[path.Count - 1];
            result.Message = "航行成功";

            dataManager.NotifyDataChanged();
            CheckGameOver();
            return result;
        }

        public void ProcessNodeArrival()
        {
            var runtimeData = dataManager.RuntimeData;
            var currentNodeId = runtimeData.Ship.CurrentNodeId;
            var currentNode = dataManager.GetNode(currentNodeId);

            Debug.Log($"[GameplayController] Arrived at {currentNode?.NodeName}");

            var toDeliver = dataManager.GetContractsToDeliver(currentNodeId);
            foreach (var contract in toDeliver)
            {
                turnManager.CompleteContractDelivery(contract.ContractId, out int credits, out int rep);
                if (credits > 0)
                {
                    OnFeedbackMessage?.Invoke($"{contract.Title} 已送达！+{credits}星币 +{rep}声望", true);
                }
            }

            var pickupContracts = runtimeData.ActiveContracts.FindAll(
                c => c.StartNodeId == currentNodeId && c.Status == ContractStatus.Accepted);

            foreach (var contract in pickupContracts)
            {
                turnManager.PickUpCargo(contract.ContractId);
                OnFeedbackMessage?.Invoke($"已装载: {contract.Title}", true);
            }

            if (currentNode?.HasFuelStation == true)
            {
                OnFeedbackMessage?.Invoke("到达加油站，可以补充燃料", true);
            }

            CheckDangerLevelPenalty(currentNode);
        }

        private void CheckDangerLevelPenalty(StarNodeData node)
        {
            if (node == null) return;

            float damageChance = 0;
            int damageAmount = 0;

            switch (node.DangerLevel)
            {
                case NodeDangerLevel.Medium:
                    damageChance = 0.15f;
                    damageAmount = 5;
                    break;
                case NodeDangerLevel.High:
                    damageChance = 0.30f;
                    damageAmount = 10;
                    break;
                case NodeDangerLevel.Extreme:
                    damageChance = 0.50f;
                    damageAmount = 15;
                    break;
            }

            if (damageChance > 0 && UnityEngine.Random.value < damageChance)
            {
                turnManager.DamageCargo(damageAmount);
                OnFeedbackMessage?.Invoke($"警告：在危险区域航行，货物受损 -{damageAmount}%", false);
            }
        }

        public bool RefuelAtStation(int fuelUnits)
        {
            var runtimeData = dataManager.RuntimeData;
            var node = dataManager.GetNode(runtimeData.Ship.CurrentNodeId);
            if (node == null || !node.HasFuelStation)
            {
                OnFeedbackMessage?.Invoke("此节点没有加油站", false);
                return false;
            }

            var costPerUnit = node.RefuelCost;
            var repManager = reputationManager;
            float discount = repManager != null ? repManager.GetTradeDiscount() : 0;
            int finalCostPerUnit = Mathf.Max(1, Mathf.RoundToInt(costPerUnit * (1 - discount)));

            bool success = fuelManager.RefuelAtCurrentStation(fuelUnits, finalCostPerUnit);

            if (success)
            {
                OnFeedbackMessage?.Invoke($"加油成功！单价 {finalCostPerUnit}星币", true);
            }
            else
            {
                OnFeedbackMessage?.Invoke("加油失败，检查星币或油箱容量", false);
            }

            return success;
        }

        public bool AcceptNewContract(int contractId)
        {
            var contract = dataManager.GetContract(contractId);
            if (contract == null)
            {
                OnFeedbackMessage?.Invoke("合同不存在", false);
                return false;
            }

            bool success = turnManager.AcceptContract(contract);
            if (success)
            {
                OnFeedbackMessage?.Invoke($"接受合同: {contract.Title}", true);

                var runtimeData = dataManager.RuntimeData;
                if (runtimeData.Ship.CurrentNodeId == contract.StartNodeId)
                {
                    turnManager.PickUpCargo(contractId);
                }
            }
            else
            {
                OnFeedbackMessage?.Invoke("合同已被接受", false);
            }

            return success;
        }

        public void CheckGameOver()
        {
            var runtimeData = dataManager.RuntimeData;
            var gameManager = GameManager.Instance;
            if (gameManager == null) return;

            if (turnManager.IsMainContractCompleted())
            {
                var finalScore = turnManager.CalculateFinalScore();
                gameManager.EndGame(true, "主合同已完成，任务成功！", finalScore);
                return;
            }

            if (turnManager.IsMainContractFailed())
            {
                var finalScore = turnManager.CalculateFinalScore();
                gameManager.EndGame(false, "主合同失败，任务失败", finalScore);
                return;
            }

            if (fuelManager.IsEmpty && !CanRefuelOrGetHelp())
            {
                var finalScore = turnManager.CalculateFinalScore();
                gameManager.EndGame(false, "燃料耗尽，无法继续航行", finalScore);
                return;
            }

            if (turnManager.CurrentTurn > turnManager.MaxTurns)
            {
                var finalScore = turnManager.CalculateFinalScore();
                gameManager.EndGame(false, "时间耗尽，任务超时", finalScore);
                return;
            }
        }

        private bool CanRefuelOrGetHelp()
        {
            var runtimeData = dataManager.RuntimeData;
            var currentNode = dataManager.GetNode(runtimeData.Ship.CurrentNodeId);
            if (currentNode == null) return false;

            if (currentNode.HasFuelStation && runtimeData.Player.Credits >= currentNode.RefuelCost)
            {
                return true;
            }

            if (runtimeData.Player.Credits >= 200) return true;

            return false;
        }

        public void RecordCriticalChoice(string choiceType, string choiceValue, string outcomeNote = "")
        {
            var runtimeData = dataManager.RuntimeData;
            runtimeData.CriticalChoices.Add(new CriticalChoiceRecord
            {
                ChoiceType = choiceType,
                ChoiceValue = choiceValue,
                TurnNumber = turnManager.CurrentTurn,
                FuelAtChoice = fuelManager.CurrentFuel,
                ReputationAtChoice = reputationManager?.CurrentReputation ?? 0,
                OutcomeNote = outcomeNote
            });

            EventBus.Publish(new GameEvents.CriticalChoiceMade
            {
                ChoiceType = choiceType,
                ChoiceValue = choiceValue,
                TurnNumber = turnManager.CurrentTurn
            });
        }
    }

    public class RouteExecutingResult
    {
        public bool Success;
        public bool Paused;
        public bool EncounteredEvent;
        public int FuelUsed;
        public int FinalNodeId;
        public int InterruptedAtNodeId;
        public string Message;
    }
}
