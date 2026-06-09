using System;
using System.Collections.Generic;
using System.Linq;

namespace BalloonPost.Core
{
    public class RoutePlanner
    {
        public RoutePlan CurrentPlan;
        public HexGrid Grid;
        public WindManager WindManager;
        public ContractManager ContractManager;
        public PlayerState Player;
        public UndoStack UndoStack;
        public event Action OnPlanChanged;
        public event Action<string> OnMessage;

        public const int RerouteTimePenalty = 1;
        public const int RerouteFuelPenalty = 2;

        public RoutePlanner(HexGrid grid, WindManager windManager, ContractManager contractManager, PlayerState player)
        {
            Grid = grid;
            WindManager = windManager;
            ContractManager = contractManager;
            Player = player;
            CurrentPlan = new RoutePlan(player.Position);
            UndoStack = new UndoStack();
        }

        public bool TryAddStep(AxialCoord targetCoord)
        {
            var endPos = CurrentPlan.CurrentEndPosition;

            if (endPos == targetCoord)
            {
                OnMessage?.Invoke("已经在此位置");
                return false;
            }

            int dir = AxialCoord.DirectionIndex(endPos, targetCoord);
            if (dir < 0)
            {
                OnMessage?.Invoke("只能移动到相邻格子");
                return false;
            }

            if (!Grid.Contains(targetCoord) || !Grid.TryGetCell(targetCoord, out var cell))
            {
                OnMessage?.Invoke("目标不在地图范围内");
                return false;
            }

            if (!cell.IsPassable)
            {
                OnMessage?.Invoke("目标不可通行");
                return false;
            }

            int stepOffset = CurrentPlan.Steps.Count;
            var wind = WindManager.GetWindForStep(stepOffset);
            int fuelCost = HexPathfinder.CalculateStepFuelCost(Grid, endPos, targetCoord, wind);
            int timeCost = 1;

            int windModifier = 0;
            if (wind != null && dir >= 0)
            {
                windModifier = wind.GetModifier(dir);
            }

            if (CurrentPlan.TotalFuelCost + fuelCost > Player.MaxFuel)
            {
                OnMessage?.Invoke($"燃料不足！需要{fuelCost}，剩余可规划{Player.MaxFuel - CurrentPlan.TotalFuelCost}");
                return false;
            }

            var activeFragile = ContractManager.ActiveContracts
                .Where(c => c.Type == ContractType.Fragile && c.Status == ContractStatus.InTransit)
                .ToList();

            int damage = HexPathfinder.CalculateStepDamage(Grid, endPos, targetCoord, wind, activeFragile);

            var step = new RouteStep(endPos, targetCoord, fuelCost, timeCost, WindManager.CurrentTurn + stepOffset)
            {
                WindModifier = windModifier,
                DamageTaken = damage
            };

            SaveUndoState($"添加航点 {targetCoord}", 1);
            CurrentPlan.AddStep(step);
            OnPlanChanged?.Invoke();
            return true;
        }

        public bool TryRemoveLastStep()
        {
            var prevEnd = CurrentPlan.CurrentEndPosition;
            if (CurrentPlan.RemoveLastStep(out var removed))
            {
                var undoAction = new UndoAction
                {
                    ActionType = "RemoveStep",
                    RemovedStepCount = 1,
                    Description = $"撤销航点 {prevEnd}",
                    PreviousRoutePlan = ClonePlan(CurrentPlan)
                };
                undoAction.PreviousRoutePlan.AddStep(removed);
                undoAction.PreviousRoutePlan.RecalculateTotals();
                UndoStack.Push(undoAction);
                OnPlanChanged?.Invoke();
                return true;
            }
            OnMessage?.Invoke("无法撤销：最后一步已锁定或没有步骤");
            return false;
        }

        public bool TryRerouteAfterStep(int stepIndex, AxialCoord newTarget)
        {
            if (stepIndex < -1 || stepIndex >= CurrentPlan.Steps.Count) return false;

            AxialCoord basePos = stepIndex < 0 ? CurrentPlan.StartPosition : CurrentPlan.Steps[stepIndex].To;

            var snapshot = SaveUndoState($"改道 (步骤{stepIndex + 1})", CurrentPlan.Steps.Count - Math.Max(0, stepIndex));
            if (snapshot == null) return false;

            if (stepIndex >= 0)
            {
                CurrentPlan.RemoveStepsAfter(stepIndex);
            }
            else
            {
                CurrentPlan.Steps.Clear();
                CurrentPlan.RecalculateTotals();
            }

            if (!TryAddStep(newTarget))
            {
                RestoreUndoState(snapshot);
                return false;
            }

            if (Player.Fuel >= RerouteFuelPenalty)
            {
                Player.Fuel -= RerouteFuelPenalty;
            }
            Player.CurrentTurn += RerouteTimePenalty;

            OnMessage?.Invoke($"改道完成！扣除时间{RerouteTimePenalty}回合，燃料{RerouteFuelPenalty}");
            OnPlanChanged?.Invoke();
            return true;
        }

        public int LockSteps(int count)
        {
            int actualLocked = CurrentPlan.LockStepsUpTo(count);
            OnPlanChanged?.Invoke();
            OnMessage?.Invoke($"已锁定前 {actualLocked} 步航线");
            return actualLocked;
        }

        public RouteScoreBreakdown GetCurrentScore()
        {
            return RouteScorer.EvaluateRoute(
                CurrentPlan,
                ContractManager.ActiveContracts,
                Grid,
                WindManager.Forecast,
                1);
        }

        public void ClearPlan()
        {
            var snapshot = SaveUndoState("清空航线", CurrentPlan.Steps.Count);
            CurrentPlan.Clear();
            OnPlanChanged?.Invoke();
        }

        public UndoAction SaveUndoState(string description, int stepsAffected)
        {
            var action = new UndoAction
            {
                ActionType = description,
                Description = description,
                PreviousPlayerState = Player.Clone(),
                PreviousRoutePlan = ClonePlan(CurrentPlan),
                PreviousContracts = CloneContracts(ContractManager.ActiveContracts),
                RemovedStepCount = stepsAffected
            };
            UndoStack.Push(action);
            return action;
        }

        public bool Undo()
        {
            var action = UndoStack.Pop();
            if (action == null) return false;
            return RestoreUndoState(action);
        }

        private bool RestoreUndoState(UndoAction action)
        {
            if (action.PreviousPlayerState != null)
            {
                Player.Position = action.PreviousPlayerState.Position;
                Player.Fuel = action.PreviousPlayerState.Fuel;
                Player.CurrentTurn = action.PreviousPlayerState.CurrentTurn;
                Player.CurrentWeight = action.PreviousPlayerState.CurrentWeight;
            }

            CurrentPlan = action.PreviousRoutePlan ?? new RoutePlan(Player.Position);

            if (action.PreviousContracts != null)
            {
                ContractManager.ActiveContracts.Clear();
                ContractManager.ActiveContracts.AddRange(action.PreviousContracts);
            }

            OnPlanChanged?.Invoke();
            OnMessage?.Invoke($"已撤销：{action.Description}");
            return true;
        }

        private RoutePlan ClonePlan(RoutePlan plan)
        {
            var clone = new RoutePlan(plan.StartPosition)
            {
                TotalFuelCost = plan.TotalFuelCost,
                TotalTimeCost = plan.TotalTimeCost,
                EstimatedTurns = plan.EstimatedTurns,
                LockedStepCount = plan.LockedStepCount
            };
            foreach (var step in plan.Steps)
            {
                clone.Steps.Add(new RouteStep
                {
                    From = step.From,
                    To = step.To,
                    FuelCost = step.FuelCost,
                    TimeCost = step.TimeCost,
                    WindModifier = step.WindModifier,
                    DamageTaken = step.DamageTaken,
                    TurnIndex = step.TurnIndex,
                    IsLocked = step.IsLocked,
                    Notes = step.Notes
                });
            }
            return clone;
        }

        private List<Contract> CloneContracts(List<Contract> contracts)
        {
            var list = new List<Contract>();
            foreach (var c in contracts)
            {
                list.Add(new Contract
                {
                    Id = c.Id,
                    Type = c.Type,
                    Status = c.Status,
                    FromTown = c.FromTown,
                    ToTown = c.ToTown,
                    FromCoord = c.FromCoord,
                    ToCoord = c.ToCoord,
                    BaseReward = c.BaseReward,
                    PriorityWeight = c.PriorityWeight,
                    MaxTurns = c.MaxTurns,
                    TurnsRemaining = c.TurnsRemaining,
                    FragilityLevel = c.FragilityLevel,
                    Description = c.Description,
                    AcceptTurn = c.AcceptTurn,
                    DeliverTurn = c.DeliverTurn,
                    CurrentDamage = c.CurrentDamage
                });
            }
            return list;
        }

        public List<AxialCoord> GetValidNextSteps()
        {
            var result = new List<AxialCoord>();
            var endPos = CurrentPlan.CurrentEndPosition;
            var neighbors = Grid.GetNeighborCoords(endPos);
            int stepOffset = CurrentPlan.Steps.Count;

            foreach (var n in neighbors)
            {
                if (!Grid.TryGetCell(n, out var cell)) continue;
                if (!cell.IsPassable) continue;

                var wind = WindManager.GetWindForStep(stepOffset);
                int fuel = HexPathfinder.CalculateStepFuelCost(Grid, endPos, n, wind);
                if (CurrentPlan.TotalFuelCost + fuel <= Player.MaxFuel)
                {
                    result.Add(n);
                }
            }
            return result;
        }
    }
}
