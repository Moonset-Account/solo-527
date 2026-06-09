using System;
using System.Collections.Generic;

namespace BalloonPost.Core
{
    [Serializable]
    public class RouteScoreBreakdown
    {
        public int TotalScore;
        public int DistanceEfficiencyScore;
        public int PriorityScore;
        public int FuelEfficiencyScore;
        public int OnTimeScore;
        public int FragilityScore;
        public int ComboBonus;
        public int Penalties;

        public string PriorityExplanation;
        public string DistanceExplanation;
        public string OnTimeExplanation;

        public RouteScoreBreakdown()
        {
            PriorityExplanation = "";
            DistanceExplanation = "";
            OnTimeExplanation = "";
        }

        public void CalculateTotal()
        {
            TotalScore = DistanceEfficiencyScore + PriorityScore + FuelEfficiencyScore
                         + OnTimeScore + FragilityScore + ComboBonus + Penalties;
        }
    }

    public static class RouteScorer
    {
        public const int BaseScorePerStep = 10;
        public const int PriorityMultiplier = 50;
        public const int FuelBonusPerSaved = 5;
        public const int OnTimeBonusPerTurn = 20;
        public const int FragilityPerfectBonus = 100;
        public const int ComboStepBonus = 5;

        public static RouteScoreBreakdown EvaluateRoute(
            RoutePlan plan,
            List<Contract> activeContracts,
            HexGrid grid,
            WindForecast forecast,
            int baseFuelCost)
        {
            var result = new RouteScoreBreakdown();

            if (plan.Steps.Count == 0) return result;

            int actualFuel = plan.TotalFuelCost;
            int expectedFuel = CalculateExpectedFuel(plan, grid);
            int fuelSaved = Math.Max(0, expectedFuel - actualFuel);
            result.FuelEfficiencyScore = fuelSaved * FuelBonusPerSaved;
            if (actualFuel > expectedFuel)
            {
                result.Penalties -= (actualFuel - expectedFuel) * FuelBonusPerSaved;
            }

            int totalPriorityWeight = 0;
            int priorityMatched = 0;
            var explanations = new List<string>();

            foreach (var contract in activeContracts)
            {
                totalPriorityWeight += contract.PriorityWeight;
                bool passesOrigin = plan.ContainsPosition(contract.FromCoord);
                bool passesDest = plan.ContainsPosition(contract.ToCoord);

                if (passesOrigin && passesDest)
                {
                    int originIdx = plan.GetPositionIndex(contract.FromCoord);
                    int destIdx = plan.GetPositionIndex(contract.ToCoord);

                    if (destIdx > originIdx)
                    {
                        priorityMatched += contract.PriorityWeight;
                        int bonus = contract.PriorityWeight * PriorityMultiplier;
                        result.PriorityScore += bonus;

                        string typeLabel = contract.Type switch
                        {
                            ContractType.TimeSensitive => $"限时(★★★)",
                            ContractType.Fragile => $"易碎(★★)",
                            _ => $"普通(★)"
                        };
                        explanations.Add($"{typeLabel} {contract.FromTown}→{contract.ToTown}: +{bonus}分");
                    }
                }

                if (contract.Type == ContractType.TimeSensitive)
                {
                    int destIndex = plan.GetPositionIndex(contract.ToCoord);
                    if (destIndex >= 0)
                    {
                        int turnsToDeliver = destIndex + 1;
                        if (turnsToDeliver <= contract.MaxTurns)
                        {
                            int savedTurns = contract.MaxTurns - turnsToDeliver;
                            result.OnTimeScore += savedTurns * OnTimeBonusPerTurn;
                            result.OnTimeExplanation = $"提前{savedTurns}回合送达限时合同，+{savedTurns * OnTimeBonusPerTurn}分";
                        }
                        else
                        {
                            int lateTurns = turnsToDeliver - contract.MaxTurns;
                            result.Penalties -= lateTurns * OnTimeBonusPerTurn;
                            result.OnTimeExplanation = $"超时{lateTurns}回合，-{lateTurns * OnTimeBonusPerTurn}分";
                        }
                    }
                }

                if (contract.Type == ContractType.Fragile)
                {
                    int totalDamage = 0;
                    foreach (var step in plan.Steps)
                    {
                        if (step.DamageTaken > 0) totalDamage += step.DamageTaken;
                    }
                    if (totalDamage == 0)
                    {
                        result.FragilityScore += FragilityPerfectBonus;
                    }
                    else if (totalDamage >= contract.FragilityLevel * 2)
                    {
                        result.Penalties -= FragilityPerfectBonus;
                    }
                }
            }

            if (totalPriorityWeight > 0)
            {
                double matchRatio = (double)priorityMatched / totalPriorityWeight;
                result.DistanceEfficiencyScore = (int)(BaseScorePerStep * plan.Steps.Count * matchRatio);

                int optimalSteps = EstimateOptimalSteps(activeContracts, grid);
                if (plan.Steps.Count <= optimalSteps * 1.2)
                {
                    result.DistanceEfficiencyScore += (int)(BaseScorePerStep * optimalSteps * 0.5);
                }
                result.DistanceExplanation = $"路径长度：{plan.Steps.Count}步，参考最优：{optimalSteps}步";
            }

            if (explanations.Count > 0)
            {
                result.PriorityExplanation = "合同优先级评分：\n" + string.Join("\n", explanations);
            }
            else
            {
                result.PriorityExplanation = "未在路径中安排有效投递序列，请确保：\n1. 经过起点(取件)\n2. 经过终点(投递)\n3. 取件发生在投递之前";
            }

            int combo = 0;
            for (int i = 0; i < plan.Steps.Count; i++)
            {
                if (plan.Steps[i].WindModifier > 0)
                {
                    combo++;
                    result.ComboBonus += combo * ComboStepBonus;
                }
                else
                {
                    combo = 0;
                }
            }

            result.CalculateTotal();
            return result;
        }

        private static int CalculateExpectedFuel(RoutePlan plan, HexGrid grid)
        {
            int total = 0;
            foreach (var step in plan.Steps)
            {
                if (grid.TryGetCell(step.From, out var fromCell))
                {
                    total += fromCell.FuelCost;
                }
                else
                {
                    total += 1;
                }
            }
            return total;
        }

        private static int EstimateOptimalSteps(List<Contract> contracts, HexGrid grid)
        {
            if (contracts.Count == 0) return 0;
            int total = 0;
            foreach (var c in contracts)
            {
                total += c.FromCoord.DistanceTo(c.ToCoord);
            }
            return Math.Max(1, total);
        }
    }
}
