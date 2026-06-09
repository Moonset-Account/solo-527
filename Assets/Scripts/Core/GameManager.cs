using System;
using System.Collections.Generic;

namespace BalloonPost.Core
{
    public enum GamePhase
    {
        Planning,
        Executing,
        Settlement,
        GameOver,
        Tutorial
    }

    public class GameManager
    {
        public HexGrid Grid;
        public WindManager WindManager;
        public ContractManager ContractManager;
        public PlayerState Player;
        public RoutePlanner Planner;
        public UndoStack UndoStack;

        public GamePhase Phase;
        public int GameSeed;
        public int MaxTurns;
        public int TurnsElapsed;
        public int LevelIndex;

        public event Action<GamePhase> OnPhaseChanged;
        public event Action<int> OnTurnAdvanced;
        public event Action<SettlementReport> OnSettlementComplete;
        public event Action<string> OnLogMessage;

        public GameManager(int seed = 42, int maxTurns = 30, int levelIndex = 0)
        {
            GameSeed = seed;
            MaxTurns = maxTurns;
            LevelIndex = levelIndex;
            Phase = GamePhase.Planning;
            TurnsElapsed = 0;
        }

        public void InitializeStandardLevel(int radius = 4, int initialContracts = 4)
        {
            Grid = MapGenerator.GenerateStandardMap(radius, GameSeed);
            InitializeSystems(initialContracts);
        }

        public void InitializeTutorialLevel1()
        {
            Grid = MapGenerator.GenerateTutorialMap1();
            var seed = 101;
            WindManager = new WindManager(seed, 3);
            Player = new PlayerState
            {
                Position = AxialCoord.Zero,
                Fuel = 20,
                MaxFuel = 30,
                Money = 0,
                MaxCarryWeight = 10,
                CurrentWeight = 0,
                CurrentTurn = 0,
                Reputation = 100
            };
            ContractManager = new ContractManager(Grid, 5, seed);
            ContractManager.CreateTutorialContract1(Grid);
            ContractManager.AcceptContract("TUT-0001");
            ContractManager.MarkContractsInTransit();

            Planner = new RoutePlanner(Grid, WindManager, ContractManager, Player);
            Planner.OnMessage += (msg) => OnLogMessage?.Invoke(msg);
            UndoStack = Planner.UndoStack;
            Phase = GamePhase.Tutorial;
        }

        public void InitializeTutorialLevel2()
        {
            Grid = MapGenerator.GenerateTutorialMap2();
            var seed = 102;
            WindManager = new WindManager(seed, 3);
            Player = new PlayerState
            {
                Position = AxialCoord.Zero,
                Fuel = 35,
                MaxFuel = 50,
                Money = 100,
                MaxCarryWeight = 15,
                CurrentWeight = 0,
                CurrentTurn = 0,
                Reputation = 100
            };
            ContractManager = new ContractManager(Grid, 5, seed);
            ContractManager.CreateTutorialContract2(Grid);
            ContractManager.AcceptContract("TUT-0002");
            ContractManager.MarkContractsInTransit();

            Planner = new RoutePlanner(Grid, WindManager, ContractManager, Player);
            Planner.OnMessage += (msg) => OnLogMessage?.Invoke(msg);
            UndoStack = Planner.UndoStack;
            Phase = GamePhase.Tutorial;
        }

        public void InitializeTutorialLevel3()
        {
            Grid = MapGenerator.GenerateTutorialMap3();
            var seed = 103;
            WindManager = new WindManager(seed, 3);
            Player = new PlayerState
            {
                Position = AxialCoord.Zero,
                Fuel = 70,
                MaxFuel = 100,
                Money = 300,
                MaxCarryWeight = 25,
                CurrentWeight = 0,
                CurrentTurn = 0,
                Reputation = 100
            };
            ContractManager = new ContractManager(Grid, 5, seed);
            ContractManager.CreateTutorialContract3(Grid);

            ContractManager.ContractCounter++;
            string id2 = $"TUT-0003B";
            var coordB = new AxialCoord(-2, 3);
            string from2 = Grid.GetCell(AxialCoord.Zero)?.TownName ?? "邮局总站";
            string to2 = Grid.GetCell(coordB)?.TownName ?? "暮光城";
            var extraB = Contract.CreateNormal(id2, from2, to2, AxialCoord.Zero, coordB, 90);
            extraB.Description = "【普通邮件】邮局总站 → 暮光城，优先级较低，顺路可送";
            ContractManager.AllContracts.Add(extraB);
            ContractManager.PendingContracts.Add(extraB);

            ContractManager.ContractCounter++;
            string id3 = $"TUT-0003C";
            var coordC = new AxialCoord(0, -4);
            string to3 = Grid.GetCell(coordC)?.TownName ?? "晨雾港";
            var extraC = Contract.CreateFragile(id3, from2, to3, AxialCoord.Zero, coordC, 110, 2);
            extraC.Description = "【易碎品】邮局总站 → 晨雾港，小心轻放，不要走山地和逆风";
            ContractManager.AllContracts.Add(extraC);
            ContractManager.PendingContracts.Add(extraC);

            ContractManager.AcceptContract("TUT-0003");
            ContractManager.AcceptContract("TUT-0003B");
            ContractManager.AcceptContract("TUT-0003C");
            ContractManager.MarkContractsInTransit();

            Planner = new RoutePlanner(Grid, WindManager, ContractManager, Player);
            Planner.OnMessage += (msg) => OnLogMessage?.Invoke(msg);
            UndoStack = Planner.UndoStack;
            Phase = GamePhase.Tutorial;
        }

        private void InitializeSystems(int initialContracts)
        {
            WindManager = new WindManager(GameSeed, 3);
            Player = new PlayerState
            {
                Position = AxialCoord.Zero,
                Fuel = 80,
                MaxFuel = 100,
                Money = 500,
                MaxCarryWeight = 30,
                CurrentWeight = 0,
                CurrentTurn = 0,
                Reputation = 100
            };
            ContractManager = new ContractManager(Grid, 5, GameSeed);
            ContractManager.GenerateInitialContracts(initialContracts);

            Planner = new RoutePlanner(Grid, WindManager, ContractManager, Player);
            Planner.OnMessage += (msg) => OnLogMessage?.Invoke(msg);
            Planner.OnPlanChanged += () => { };
            UndoStack = Planner.UndoStack;
        }

        public void SetPhase(GamePhase newPhase)
        {
            Phase = newPhase;
            OnPhaseChanged?.Invoke(newPhase);
        }

        public bool ExecutePlan()
        {
            if (Planner.CurrentPlan.Steps.Count == 0)
            {
                OnLogMessage?.Invoke("没有规划任何航线！");
                return false;
            }

            SetPhase(GamePhase.Executing);
            Planner.LockSteps(Planner.CurrentPlan.Steps.Count);
            ExecuteAllSteps();
            return true;
        }

        private void ExecuteAllSteps()
        {
            int totalDamageThisTurn = 0;

            for (int i = 0; i < Planner.CurrentPlan.Steps.Count; i++)
            {
                var step = Planner.CurrentPlan.Steps[i];
                Player.Position = step.To;
                Player.Fuel -= step.FuelCost;
                TurnsElapsed++;

                if (step.DamageTaken > 0)
                {
                    totalDamageThisTurn += step.DamageTaken;
                    ContractManager.ApplyDamage(step.DamageTaken);
                }

                var pickedUp = ContractManager.CheckPickups(step.To);
                foreach (var c in pickedUp)
                {
                    OnLogMessage?.Invoke($"[取件] {c.Description}");
                }

                var delivered = ContractManager.CheckDeliveries(step.To, TurnsElapsed);
                foreach (var c in delivered)
                {
                    int turnsTaken = TurnsElapsed - (c.AcceptTurn == 0 ? 1 : c.AcceptTurn);
                    int reward = c.CalculateReward(turnsTaken, c.CurrentDamage);
                    Player.Money += reward;
                    OnLogMessage?.Invoke($"[投递] {c.FromTown}→{c.ToTown} 获得 {reward} 金币");
                }

                WindManager.AdvanceTurn();
                Player.CurrentTurn = TurnsElapsed;
                ContractManager.AdvanceTurn();

                if (TurnsElapsed >= MaxTurns)
                {
                    break;
                }
                if (Player.Fuel <= 0)
                {
                    OnLogMessage?.Invoke("⚠ 燃料耗尽！无法继续执行");
                    break;
                }
            }

            CompleteTurn();
        }

        private void CompleteTurn()
        {
            Planner.CurrentPlan.Steps.Clear();
            Planner.CurrentPlan.StartPosition = Player.Position;
            Planner.CurrentPlan.RecalculateTotals();

            if (ShouldEndGame())
            {
                TriggerSettlement();
            }
            else
            {
                OnTurnAdvanced?.Invoke(TurnsElapsed);
                SetPhase(GamePhase.Planning);
            }
        }

        private bool ShouldEndGame()
        {
            if (TurnsElapsed >= MaxTurns) return true;
            if (Player.Fuel <= 0)
            {
                int homeDist = Player.Position.DistanceTo(AxialCoord.Zero);
                if (Player.Fuel < homeDist) return true;
            }
            if (ContractManager.ActiveContracts.Count == 0
                && ContractManager.PendingContracts.Count == 0
                && TurnsElapsed > 5)
            {
                return true;
            }
            return false;
        }

        public void TriggerSettlement()
        {
            SetPhase(GamePhase.Settlement);
            var report = ContractManager.GenerateSettlementReport(TurnsElapsed);

            int homeDist = Player.Position.DistanceTo(AxialCoord.Zero);
            if (homeDist > 0 && Player.Fuel < homeDist)
            {
                report.FuelCosts += homeDist * 10;
                report.Deductions += homeDist * 10;
                report.ComplaintCount += 1;
                report.ComplaintDetails.Add($"燃料不足返航，需支付救援费 {homeDist * 10} 金币");
                report.TotalEarnings -= homeDist * 10;
                OnLogMessage?.Invoke($"⚠ 燃料不足以返航，支付救援费用 {homeDist * 10} 金币");
            }

            Player.Money = Math.Max(0, report.TotalEarnings);
            Player.Reputation = Math.Max(0, Player.Reputation + report.FinalReputationChange);
            report.FinalScore = Player.Money + Player.Reputation * 10;

            OnSettlementComplete?.Invoke(report);
            SetPhase(GamePhase.GameOver);
        }

        public bool TryRefuelAtPostOffice()
        {
            if (!Grid.TryGetCell(Player.Position, out var cell) || !cell.HasPostOffice)
            {
                OnLogMessage?.Invoke("只能在邮局补给燃料");
                return false;
            }
            int needed = Player.MaxFuel - Player.Fuel;
            if (needed <= 0)
            {
                OnLogMessage?.Invoke("燃料已满");
                return false;
            }
            int cost = needed * 2;
            if (Player.Money < cost)
            {
                OnLogMessage?.Invoke($"金币不足，补给需要 {cost} 金币");
                return false;
            }
            Player.Money -= cost;
            Player.Fuel = Player.MaxFuel;
            OnLogMessage?.Invoke($"补给完成！花费 {cost} 金币，燃料恢复满值");
            return true;
        }
    }
}
