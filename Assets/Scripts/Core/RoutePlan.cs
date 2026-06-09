using System;
using System.Collections.Generic;

namespace BalloonPost.Core
{
    [Serializable]
    public class RouteStep
    {
        public AxialCoord From;
        public AxialCoord To;
        public int FuelCost;
        public int TimeCost;
        public int WindModifier;
        public int DamageTaken;
        public int TurnIndex;
        public bool IsLocked;
        public string Notes;

        public RouteStep() { }

        public RouteStep(AxialCoord from, AxialCoord to, int fuelCost, int timeCost, int turnIndex)
        {
            From = from;
            To = to;
            FuelCost = fuelCost;
            TimeCost = timeCost;
            TurnIndex = turnIndex;
            WindModifier = 0;
            DamageTaken = 0;
            IsLocked = false;
        }

        public override string ToString()
        {
            return $"{From} -> {To} (Fuel:{FuelCost}, Time:{TimeCost}, Wind:{WindModifier:+#;-#;0})";
        }
    }

    [Serializable]
    public class RoutePlan
    {
        public List<RouteStep> Steps;
        public AxialCoord StartPosition;
        public int TotalFuelCost;
        public int TotalTimeCost;
        public int EstimatedTurns;
        public int LockedStepCount;

        public RoutePlan()
        {
            Steps = new List<RouteStep>();
            TotalFuelCost = 0;
            TotalTimeCost = 0;
            EstimatedTurns = 0;
            LockedStepCount = 0;
        }

        public RoutePlan(AxialCoord start) : this()
        {
            StartPosition = start;
        }

        public AxialCoord CurrentEndPosition
        {
            get
            {
                if (Steps.Count == 0) return StartPosition;
                return Steps[Steps.Count - 1].To;
            }
        }

        public void AddStep(RouteStep step)
        {
            Steps.Add(step);
            RecalculateTotals();
        }

        public bool RemoveLastStep(out RouteStep removed)
        {
            removed = null;
            if (Steps.Count == 0) return false;
            if (Steps[Steps.Count - 1].IsLocked) return false;

            removed = Steps[Steps.Count - 1];
            Steps.RemoveAt(Steps.Count - 1);
            RecalculateTotals();
            return true;
        }

        public bool RemoveStepsAfter(int index)
        {
            if (index < 0 || index >= Steps.Count) return false;
            for (int i = Steps.Count - 1; i > index; i--)
            {
                if (Steps[i].IsLocked) return false;
            }
            Steps.RemoveRange(index + 1, Steps.Count - index - 1);
            RecalculateTotals();
            return true;
        }

        public int LockStepsUpTo(int count)
        {
            int locked = 0;
            for (int i = 0; i < Math.Min(count, Steps.Count); i++)
            {
                if (!Steps[i].IsLocked)
                {
                    Steps[i].IsLocked = true;
                    locked++;
                }
            }
            LockedStepCount = 0;
            foreach (var step in Steps)
            {
                if (step.IsLocked) LockedStepCount++;
            }
            return locked;
        }

        public void RecalculateTotals()
        {
            TotalFuelCost = 0;
            TotalTimeCost = 0;
            LockedStepCount = 0;
            foreach (var step in Steps)
            {
                TotalFuelCost += step.FuelCost;
                TotalTimeCost += step.TimeCost;
                if (step.IsLocked) LockedStepCount++;
            }
            EstimatedTurns = Steps.Count;
        }

        public void Clear()
        {
            int i = Steps.Count - 1;
            while (i >= 0 && !Steps[i].IsLocked)
            {
                Steps.RemoveAt(i);
                i--;
            }
            RecalculateTotals();
        }

        public bool ContainsPosition(AxialCoord coord)
        {
            if (StartPosition == coord) return true;
            foreach (var step in Steps)
            {
                if (step.To == coord) return true;
            }
            return false;
        }

        public int GetPositionIndex(AxialCoord coord)
        {
            if (StartPosition == coord) return -1;
            for (int i = 0; i < Steps.Count; i++)
            {
                if (Steps[i].To == coord) return i;
            }
            return -2;
        }
    }
}
