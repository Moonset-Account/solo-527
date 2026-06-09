using System;
using System.Collections.Generic;

namespace BalloonPost.Core
{
    public class WindManager
    {
        public WindForecast Forecast;
        public int CurrentTurn;
        public int LookAheadTurns;
        private Random _random;
        private int _seed;

        public WindManager(int seed = 42, int lookAheadTurns = 3)
        {
            _seed = seed;
            _random = new Random(seed);
            LookAheadTurns = lookAheadTurns;
            Forecast = new WindForecast(lookAheadTurns);
            CurrentTurn = 0;
            InitializeForecast();
        }

        private void InitializeForecast()
        {
            for (int i = 0; i < LookAheadTurns; i++)
            {
                Forecast[i] = GenerateWindInfo(CurrentTurn + i);
            }
        }

        public WindInfo CurrentWind => Forecast[0];

        public WindInfo GetWindForStep(int stepOffset)
        {
            if (stepOffset >= 0 && stepOffset < LookAheadTurns)
            {
                return Forecast[stepOffset];
            }
            return GenerateWindInfo(CurrentTurn + stepOffset);
        }

        public WindInfo AdvanceTurn()
        {
            CurrentTurn++;
            var nextTurn = CurrentTurn + LookAheadTurns - 1;
            var newWind = GenerateWindInfo(nextTurn);
            Forecast.Shift(newWind);
            return Forecast[0];
        }

        public WindInfo GenerateWindInfo(int turnIndex)
        {
            var direction = (WindDirection)_random.Next(0, 6);
            var strengthRoll = _random.Next(0, 100);
            WindStrength strength;

            if (strengthRoll < 10) strength = WindStrength.Calm;
            else if (strengthRoll < 35) strength = WindStrength.Light;
            else if (strengthRoll < 70) strength = WindStrength.Moderate;
            else if (strengthRoll < 90) strength = WindStrength.Strong;
            else strength = WindStrength.Gale;

            if (ShouldReverse(turnIndex))
            {
                int dirInt = (int)direction;
                direction = (WindDirection)((dirInt + 3) % 6);
            }

            return new WindInfo(direction, strength, turnIndex);
        }

        private bool ShouldReverse(int turnIndex)
        {
            return turnIndex > 0 && turnIndex % 5 == 0 && _random.Next(0, 100) < 30;
        }

        public int CalculateWindFuelModifier(AxialCoord from, AxialCoord to, int stepOffset)
        {
            var wind = GetWindForStep(stepOffset);
            int moveDir = AxialCoord.DirectionIndex(from, to);
            if (moveDir < 0) return 0;
            return wind.GetModifier(moveDir);
        }

        public string GetForecastSummary()
        {
            var lines = new List<string>();
            lines.Add($"=== 风向预报 (当前回合 {CurrentTurn}) ===");
            for (int i = 0; i < LookAheadTurns; i++)
            {
                var wind = Forecast[i];
                if (wind == null) continue;
                string prefix = i == 0 ? "[本回合]" : i == 1 ? "[下一步]" : $"[{i}步后]";
                lines.Add($"{prefix} T{wind.TurnIndex}: {GetWindStrengthLabel(wind.Strength)} {GetWindDirectionLabel(wind.Direction)}");
            }
            return string.Join("\n", lines);
        }

        public static string GetWindDirectionLabel(WindDirection dir)
        {
            return dir switch
            {
                WindDirection.East => "东风→",
                WindDirection.Northeast => "东北风↗",
                WindDirection.Northwest => "西北风↖",
                WindDirection.West => "西风←",
                WindDirection.Southwest => "西南风↙",
                WindDirection.Southeast => "东南风↘",
                _ => "无风"
            };
        }

        public static string GetWindStrengthLabel(WindStrength strength)
        {
            return strength switch
            {
                WindStrength.Calm => "无风",
                WindStrength.Light => "微风",
                WindStrength.Moderate => "和风",
                WindStrength.Strong => "劲风",
                WindStrength.Gale => "烈风",
                _ => "?"
            };
        }

        public void Reset(int? newSeed = null)
        {
            if (newSeed.HasValue)
            {
                _seed = newSeed.Value;
            }
            _random = new Random(_seed);
            CurrentTurn = 0;
            Forecast = new WindForecast(LookAheadTurns);
            InitializeForecast();
        }
    }
}
