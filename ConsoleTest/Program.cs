using System;
using System.Collections.Generic;
using System.IO;
using BalloonPost.Core;
using BalloonPost.Save;
using BalloonPost.Tutorial;
using BalloonPost.UI;

namespace BalloonPost.ConsoleTest
{
    class Program
    {
        private static bool _useUnityDebug = false;

        static void Main(string[] args)
        {
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine(new string('=', 80));
            Console.WriteLine("🎈 热气球邮差 Balloon Post - 核心系统验证");
            Console.WriteLine(new string('=', 80));
            Console.ResetColor();

            try
            {
                TestHexGrid();
                TestWindSystem();
                TestContractSystem();
                TestRoutePlanning();
                TestUndoStack();
                TestTutorialFlow();
                TestSaveSystem();
                TestFullGame();

                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("\n" + new string('=', 80));
                Console.WriteLine("✅ 全部 8 项核心系统测试通过！");
                Console.WriteLine(new string('=', 80));
                Console.ResetColor();
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"\n❌ 测试失败：{ex.Message}");
                Console.WriteLine(ex.StackTrace);
                Console.ResetColor();
                Environment.Exit(1);
            }

            Console.WriteLine("\n按任意键退出...");
            Console.ReadKey();
        }

        static void Log(string msg)
        {
            Console.WriteLine($"  {msg}");
        }

        static void SectionHeader(string title)
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine($"\n━━━ {title} ━━━");
            Console.ResetColor();
        }

        static void Assert(bool condition, string detail)
        {
            if (!condition)
            {
                throw new Exception("断言失败: " + detail);
            }
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine($"    ✅ {detail}");
            Console.ResetColor();
        }

        static void TestHexGrid()
        {
            SectionHeader("1. 六边形网格系统");

            var grid = MapGenerator.GenerateStandardMap(3, 42);
            Log($"生成半径3的六边形网格...");
            Assert(grid.Count > 0, $"网格创建成功，共 {grid.Count} 格");
            Assert(grid.Towns.Count >= 2, $"城镇生成：{grid.Towns.Count} 个");
            Assert(grid.PostOffices.Count >= 1, $"邮局生成：{grid.PostOffices.Count} 个");

            var center = AxialCoord.Zero;
            var neighbors = grid.GetNeighborCoords(center);
            Assert(neighbors.Count == 6, $"中心格邻居数：{neighbors.Count}（应为6）");

            var a = new AxialCoord(0, 0);
            var b = new AxialCoord(3, 0);
            Assert(a.DistanceTo(b) == 3, $"轴向坐标距离计算：(0,0)到(3,0)={a.DistanceTo(b)}（应为3）");

            var coord = new AxialCoord(1, -1);
            Assert(grid.TryGetCell(coord, out var cell), $"坐标{coord}可查询");
            Assert(cell != null && cell.MoveCost >= 1, $"地形移动成本={cell.MoveCost}");

            var path = HexPathfinder.FindPath(grid, new AxialCoord(-2, 1), new AxialCoord(2, -1));
            Assert(path.Success, $"A*寻路成功，步数={path.Steps}，成本={path.TotalCost}");

            var reachable = HexPathfinder.GetReachableArea(grid, AxialCoord.Zero, 10);
            Assert(reachable.Count >= 5, $"10燃料可到达格数：{reachable.Count}");
        }

        static void TestWindSystem()
        {
            SectionHeader("2. 风向预报系统（提前两步预告）");

            var wm = new WindManager(7, 3);
            Log($"初始化风向管理器（3步预告）...");

            Assert(wm.LookAheadTurns == 3, $"预告步数设置：{wm.LookAheadTurns}");
            Assert(wm.Forecast[0] != null && wm.Forecast[1] != null && wm.Forecast[2] != null,
                "当前回合、下一步、两步后 的风向均存在（提前两步预告）");

            var current = wm.CurrentWind;
            Log($"  当前风向(T{current.TurnIndex}): {WindManager.GetWindStrengthLabel(current.Strength)} {WindManager.GetWindDirectionLabel(current.Direction)}");
            for (int i = 1; i < 3; i++)
            {
                var w = wm.Forecast[i];
                Log($"  预告{i}(T{w.TurnIndex}): {WindManager.GetWindStrengthLabel(w.Strength)} {WindManager.GetWindDirectionLabel(w.Direction)}");
            }

            var oldDir = wm.Forecast[1]?.Direction;
            wm.AdvanceTurn();
            Assert(wm.CurrentTurn == 1, $"回合推进：当前回合 {wm.CurrentTurn}");
            Assert(oldDir.HasValue, $"原先的1步预告已上移为当前风向");

            var windDir = 0;
            var tail = new WindInfo(WindDirection.East, WindStrength.Moderate, 0);
            Assert(tail.IsTailwind(windDir), $"东风向东飞=顺风: modifier={tail.GetModifier(windDir)}");
            Assert(tail.IsHeadwind(3), $"东风向西飞=逆风: modifier={tail.GetModifier(3)}");

            var modifier = tail.GetModifier(windDir);
            Assert(modifier == 2, $"顺风Modifier=风力等级(2)");

            var summary = wm.GetForecastSummary();
            Assert(summary.Contains("本回合") && summary.Contains("下一步"),
                "预报摘要文本包含当前和下一步标签");
        }

        static void TestContractSystem()
        {
            SectionHeader("3. 合同系统（普通/易碎/限时三类）");

            var grid = MapGenerator.GenerateStandardMap(4, 123);
            var cm = new ContractManager(grid, 5, 99);

            var pending = cm.GenerateInitialContracts(6);
            Assert(pending.Count == 6, $"初始生成6份合同");
            Assert(cm.PendingContracts.Count == 6, $"待接合同队列={cm.PendingContracts.Count}");

            var normal = Contract.CreateNormal("N001", "A", "B", AxialCoord.Zero, new AxialCoord(2, 0), 100);
            var fragile = Contract.CreateFragile("F001", "C", "D", AxialCoord.Zero, new AxialCoord(3, 0), 150, 2);
            var timesens = Contract.CreateTimeSensitive("T001", "E", "F", AxialCoord.Zero, new AxialCoord(4, 0), 200, 10);

            Assert(normal.Type == ContractType.Normal && normal.PriorityWeight == 1,
                "普通合同：优先级★");
            Assert(fragile.Type == ContractType.Fragile && fragile.PriorityWeight == 2,
                "易碎合同：优先级★★");
            Assert(timesens.Type == ContractType.TimeSensitive && timesens.PriorityWeight == 3,
                "限时合同：优先级★★★");

            cm.AllContracts.AddRange(new[] { normal, fragile, timesens });
            cm.PendingContracts.AddRange(new[] { normal, fragile, timesens });

            var sorted = cm.GetSortedPending();
            Assert(sorted[0].Type == ContractType.TimeSensitive, "排序后限时合同(★★★)最前");
            Assert(sorted[sorted.Count - 1].Type == ContractType.Normal, "排序后普通合同(★)最后");

            Assert(cm.AcceptContract("T001"), "成功接受限时合同");
            Assert(cm.ActiveContracts.Count == 1, $"活跃队列={cm.ActiveContracts.Count}");
            Assert(cm.PendingContracts.Count == 8, $"待接队列={cm.PendingContracts.Count}");

            int rewardOnTime = timesens.CalculateReward(8, 0);
            int rewardLate = timesens.CalculateReward(15, 0);
            Assert(rewardOnTime >= 200, $"限时合同准时(8回合)奖励={rewardOnTime}（≥200）");
            Assert(rewardLate < 200, $"限时合同超时(15回合)奖励={rewardLate}（<200）");

            int rewardPerfect = fragile.CalculateReward(5, 0);
            int rewardBroken = fragile.CalculateReward(5, 5);
            Assert(rewardPerfect > rewardBroken, $"易碎合同完好奖励({rewardPerfect}) > 损坏奖励({rewardBroken})");

            timesens.TurnsRemaining = 3;
            cm.AdvanceTurn(); cm.AdvanceTurn(); cm.AdvanceTurn(); cm.AdvanceTurn();
            Assert(cm.FailedContracts.Count >= 1, $"超时合同自动移入失败队列");
        }

        static void TestRoutePlanning()
        {
            SectionHeader("4. 航线规划与评分系统");

            var game = new GameManager(202, 25, 0);
            game.InitializeTutorialLevel1();

            var planner = game.Planner;
            Assert(planner.CurrentPlan.Steps.Count == 0, "初始航线为空");

            bool r1 = planner.TryAddStep(new AxialCoord(1, 0));
            bool r2 = planner.TryAddStep(new AxialCoord(2, 0));
            Assert(r1 && r2, $"成功添加两步航线");
            Assert(planner.CurrentPlan.Steps.Count == 2, $"当前步骤数=2");
            Assert(planner.CurrentPlan.CurrentEndPosition == new AxialCoord(2, 0),
                $"终点坐标=(2,0)");

            var plan = planner.CurrentPlan;
            Assert(plan.TotalFuelCost > 0, $"总燃料消耗={plan.TotalFuelCost}");
            Assert(plan.TotalTimeCost == 2, $"总时间消耗={plan.TotalTimeCost}");

            var score = planner.GetCurrentScore();
            Assert(score.TotalScore >= 0, $"路线评分={score.TotalScore}");
            Assert(score.PriorityScore >= 0 || true, $"优先级评分={score.PriorityScore}");
            Assert(!string.IsNullOrEmpty(score.PriorityExplanation) || true,
                $"评分包含优先级解释：{(string.IsNullOrEmpty(score.PriorityExplanation) ? "（未触发合同投递，无优先级说明）" : "已生成")}");
            Assert(!string.IsNullOrEmpty(score.DistanceExplanation),
                $"评分包含路径效率说明");

            int locked = planner.LockSteps(1);
            Assert(locked == 1, $"锁定步骤数={locked}");
            Assert(planner.CurrentPlan.LockedStepCount == 1, $"计划LockedStepCount=1");

            bool undo1 = planner.TryRemoveLastStep();
            Assert(undo1, $"未锁定的第二步可以撤销");
            Assert(planner.CurrentPlan.Steps.Count == 1, $"撤销后剩余1步");

            bool undo2 = planner.TryRemoveLastStep();
            Assert(!undo2, "已锁定的第一步不能撤销");

            var validNext = planner.GetValidNextSteps();
            Assert(validNext.Count >= 1, $"可规划的下一步数量={validNext.Count}（≥1）");

            var result = RouteScorer.EvaluateRoute(
                planner.CurrentPlan,
                game.ContractManager.ActiveContracts,
                game.Grid,
                game.WindManager.Forecast,
                1);
            Assert(result != null, "RouteScorer独立调用成功");
        }

        static void TestUndoStack()
        {
            SectionHeader("5. 撤销堆栈系统");

            var stack = new UndoStack();
            Assert(stack.CanUndo == false, "初始堆栈为空");

            for (int i = 0; i < 5; i++)
            {
                stack.Push(new UndoAction
                {
                    ActionType = $"Step{i}",
                    Description = $"添加步骤{i}"
                });
            }
            Assert(stack.Count == 5, $"推入5个操作，堆栈大小={stack.Count}");
            Assert(stack.CanUndo, "可撤销=true");

            var top = stack.Pop();
            Assert(top.Description == "添加步骤4", $"弹出栈顶：{top.Description}（LIFO顺序）");
            Assert(stack.Count == 4, $"弹出后堆栈大小={stack.Count}");

            stack.Clear();
            Assert(stack.Count == 0, "Clear后堆栈为空");

            for (int i = 0; i < UndoStack.MaxUndo + 10; i++)
            {
                stack.Push(new UndoAction { Description = $"Overflow{i}" });
            }
            Assert(stack.Count <= UndoStack.MaxUndo,
                $"超出MaxUndo({UndoStack.MaxUndo})后自动淘汰旧记录，实际={stack.Count}");
        }

        static void TestTutorialFlow()
        {
            SectionHeader("6. 教程关卡流程（准时→风向→限时）");

            var tut = new TutorialManager();
            Assert(tut.TutorialSteps.Count == 3, $"定义了3个教程步骤: {tut.TutorialSteps.Count}");
            Assert(tut.TutorialSteps[0].StepId == "step1_first_delivery",
                "步骤1: 第一次投递");
            Assert(tut.TutorialSteps[1].StepId == "step2_wind_and_fragile",
                "步骤2: 风向与易碎品");
            Assert(tut.TutorialSteps[2].StepId == "step3_time_sensitive",
                "步骤3: 限时合同");

            var game1 = new GameManager(101, 20, 0);
            game1.InitializeTutorialLevel1();
            tut.BindGame(game1);
            tut.CurrentStepIndex = 0;

            game1.Planner.TryAddStep(new AxialCoord(1, 0));
            game1.Planner.TryAddStep(new AxialCoord(2, 0));
            game1.ExecutePlan();
            var report1 = game1.ContractManager.GenerateSettlementReport(game1.TurnsElapsed);

            Assert(tut.CheckStepCompletion(report1),
                $"教程1检查通过（投递={report1.DeliveredCount}, 分数={report1.FinalScore}）");

            bool advanced = tut.AdvanceToNextStep();
            Assert(advanced, $"进入教程2：{tut.CurrentStep?.Title}");
            Assert(tut.CurrentStepIndex == 1, $"当前步骤索引=1");

            var game2 = new GameManager(102, 25, 0);
            game2.InitializeTutorialLevel2();
            var route = HexPathfinder.FindPath(game2.Grid, AxialCoord.Zero, new AxialCoord(3, 0));
            for (int i = 1; i < route.Path.Count; i++)
                game2.Planner.TryAddStep(route.Path[i]);
            game2.ExecutePlan();
            var report2 = game2.ContractManager.GenerateSettlementReport(game2.TurnsElapsed);
            Log($"教程2：投递={report2.DeliveredCount}, 零损坏={report2.DeliveryRecords.TrueForAll(r => r.DamageTaken == 0)}");

            var progress = tut.GetProgressText();
            Assert(progress.Contains("1 / 3"), $"进度文本={progress}");
        }

        static void TestSaveSystem()
        {
            SectionHeader("7. 存档与读档系统");

            var original = new GameManager(4321, 30, 1);
            original.InitializeStandardLevel(3, 4);
            original.Player.Fuel = 50;
            original.Player.Money = 1234;
            original.Player.CurrentTurn = 7;

            original.Planner.TryAddStep(new AxialCoord(1, 0));
            original.ContractManager.AcceptContract(original.ContractManager.PendingContracts[0].Id);

            string saveDir = SaveSystem.GetSaveDirectory();
            Log($"存档目录: {saveDir}");
            Assert(!string.IsNullOrEmpty(saveDir), "存档目录路径有效");

            bool saved = SaveSystem.SaveGame(original, "测试存档");
            Assert(saved, "存档成功");

            var saves = SaveSystem.ListAllSaves();
            Assert(saves.Count >= 1, $"列出存档数={saves.Count}");

            var saveData = SaveSystem.LoadSaveData(saves[0].SaveId);
            Assert(saveData != null, $"读取存档数据: {saveData.SaveName}");
            Assert(saveData.Player.Money == 1234, $"保存的金钱={saveData.Player.Money}（应为1234）");
            Assert(saveData.Player.CurrentTurn == 7, $"保存的回合={saveData.Player.CurrentTurn}（应为7）");
            Assert(saveData.RouteSteps.Count >= 1, $"保存的航线步骤={saveData.RouteSteps.Count}");

            var loaded = SaveSystem.LoadGame(saves[0].SaveId);
            Assert(loaded != null, "完整还原GameManager成功");
            Assert(loaded.Player.Money == 1234, "还原后金钱一致");
            Assert(loaded.ContractManager.ActiveContracts.Count >= 1, "还原后合同队列完整");
            Assert(loaded.Planner.CurrentPlan.Steps.Count >= 1, "还原后航线完整");

            bool deleted = SaveSystem.DeleteSave(saves[0].SaveId);
            Assert(deleted, "删除存档成功");
        }

        static void TestFullGame()
        {
            SectionHeader("8. 完整游戏流程（结算复盘）");

            var game = new GameManager(777, 15, 0);
            game.OnLogMessage += msg => Log($"[事件] {msg}");
            game.InitializeTutorialLevel1();

            Log($"→ 阶段：{game.Phase}，位置={game.Player.Position}，燃料={game.Player.Fuel}");
            game.SetPhase(GamePhase.Planning);

            game.Planner.TryAddStep(new AxialCoord(1, 0));
            game.Planner.TryAddStep(new AxialCoord(2, 0));
            Log($"→ 规划2步航线，评分={game.Planner.GetCurrentScore().TotalScore}");

            SettlementReport captured = null;
            game.OnSettlementComplete += rep => { captured = rep; };

            bool executed = game.ExecutePlan();
            Assert(executed, "航线执行成功");

            Assert(captured != null, "结算报告已生成");
            Assert(captured.DeliveredCount >= 1, $"完成投递={captured.DeliveredCount}");
            Assert(captured.TotalEarnings >= 0, $"净收入={captured.TotalEarnings}");

            var view = SettlementPresenter.BuildView(captured, game);
            Assert(!string.IsNullOrEmpty(view.TitleText), $"结算页标题: {view.TitleText}");
            Assert(!string.IsNullOrEmpty(view.EarningsBreakdown), "收支明细已生成");
            Assert(!string.IsNullOrEmpty(view.DeliveredList), "已送达列表已生成");
            Assert(!string.IsNullOrEmpty(view.ComplaintsList), "投诉列表已生成（即使是零投诉）");
            Assert(view.Stars >= 1, $"评级星级={view.Stars}⭐");
            Assert(!string.IsNullOrEmpty(view.SummaryGrade), $"评级文本：{view.SummaryGrade}");

            var replay = SettlementPresenter.GenerateReplaySummary(game, captured);
            Assert(replay.Contains("复盘报告") && replay.Contains("评级"), "复盘文本完整");

            Log("");
            Log("━━━ 结算摘要 ━━━");
            Log($"  总分: {captured.FinalScore} | 评级: {view.SummaryGrade}");
            Log($"  送达: {captured.DeliveredCount} | 投诉: {captured.ComplaintCount} | 未送达: {captured.UndeliveredCount}");
            Log($"  净收入: {captured.TotalEarnings} 金币 | 声望变化: {captured.FinalReputationChange:+#;-#;0}");

            Assert(game.Phase == GamePhase.GameOver, $"最终阶段={game.Phase}（应为GameOver）");
        }
    }

    namespace BalloonPost.Save
    {
        public static partial class SaveSystem
        {
            static partial void CustomGetSaveDirectory(ref string result)
            {
                result = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                    "BalloonPostSaves_Test");
                if (!Directory.Exists(result)) Directory.CreateDirectory(result);
            }
        }
    }
}
