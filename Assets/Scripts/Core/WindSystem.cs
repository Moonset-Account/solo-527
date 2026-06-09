using System;

namespace BalloonPost.Core
{
    [Serializable]
    public enum WindDirection
    {
        None = -1,
        East = 0,
        Northeast = 1,
        Northwest = 2,
        West = 3,
        Southwest = 4,
        Southeast = 5
    }

    [Serializable]
    public enum WindStrength
    {
        Calm = 0,
        Light = 1,
        Moderate = 2,
        Strong = 3,
        Gale = 4
    }

    [Serializable]
    public class WindInfo
    {
        public WindDirection Direction;
        public WindStrength Strength;
        public int TurnIndex;

        public WindInfo() { }

        public WindInfo(WindDirection direction, WindStrength strength, int turnIndex)
        {
            Direction = direction;
            Strength = strength;
            TurnIndex = turnIndex;
        }

        public static int OppositeDirection(int dir)
        {
            return (dir + 3) % 6;
        }

        public bool IsHeadwind(int movementDirection)
        {
            if (Direction == WindDirection.None || Strength == WindStrength.Calm) return false;
            return (int)Direction == OppositeDirection(movementDirection);
        }

        public bool IsTailwind(int movementDirection)
        {
            if (Direction == WindDirection.None || Strength == WindStrength.Calm) return false;
            return (int)Direction == movementDirection;
        }

        public int GetModifier(int movementDirection)
        {
            if (Direction == WindDirection.None || Strength == WindStrength.Calm) return 0;
            int windDir = (int)Direction;
            
            if (windDir == movementDirection) return (int)Strength;
            if (OppositeDirection(windDir) == movementDirection) return -(int)Strength;
            
            int clockwiseDiff = (movementDirection - windDir + 6) % 6;
            int counterDiff = (windDir - movementDirection + 6) % 6;
            int minDiff = Math.Min(clockwiseDiff, counterDiff);
            
            if (minDiff == 1) return (int)Strength / 2;
            if (minDiff == 2) return (int)Strength / 3;
            return 0;
        }

        public override string ToString()
        {
            return $"Turn {TurnIndex}: {Strength} {Direction}";
        }
    }

    [Serializable]
    public class WindForecast
    {
        public WindInfo[] ForecastTurns;
        public int LookAheadCount;

        public WindForecast(int lookAhead = 3)
        {
            LookAheadCount = lookAhead;
            ForecastTurns = new WindInfo[lookAhead];
        }

        public WindInfo this[int index]
        {
            get
            {
                if (index >= 0 && index < LookAheadCount)
                    return ForecastTurns[index];
                return null;
            }
            set
            {
                if (index >= 0 && index < LookAheadCount)
                    ForecastTurns[index] = value;
            }
        }

        public void Shift(WindInfo newWind)
        {
            for (int i = 0; i < LookAheadCount - 1; i++)
            {
                ForecastTurns[i] = ForecastTurns[i + 1];
                if (ForecastTurns[i] != null)
                    ForecastTurns[i].TurnIndex = ForecastTurns[i].TurnIndex;
            }
            newWind.TurnIndex = (ForecastTurns[LookAheadCount - 2]?.TurnIndex ?? 0) + 1;
            ForecastTurns[LookAheadCount - 1] = newWind;
        }

        public WindInfo GetWindForTurn(int currentTurn, int futureTurn)
        {
            int offset = futureTurn - currentTurn;
            if (offset >= 0 && offset < LookAheadCount)
                return ForecastTurns[offset];
            return null;
        }
    }
}
