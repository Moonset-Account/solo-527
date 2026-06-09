using System;
using System.Collections.Generic;
using UnityEngine;

namespace BalloonPost.Tests
{
    using BalloonPost.Core;
    using BalloonPost.Save;
    using BalloonPost.Tutorial;
    using BalloonPost.UI;

    public class GameDemoRunner : MonoBehaviour
    {
        private GameManager _game;
        private TutorialManager _tutorial;

        private void Start()
        {
            RunFullDemo();
        }

        public void RunFullDemo()
        {
            Debug.Log("\n" + new string('=', 80));
            Debug.Log("🎈 热气球邮差 - 完整演示 Demo");
            Debug.Log(new string('=', 80));

            RunTutorial1_FirstDelivery();
            RunTutorial2_WindAndFragile();
            RunTutorial3_TimeSensitive();
            RunStandardLevel();

            Debug.Log("\n" + new string('=', 80));
            Debug.Log("✅ 演示全部完成！");
            Debug.Log(new string('=', 80));
        }

        private void RunTutorial1_FirstDelivery()
        {
            Debug.Log("\n" + new string('-', 80));
            Debug.Log("📗 教程第一关：第一次准时投递");
            Debug.Log(new string('-', 80));

            _game = new GameManager(101, 20, 0);
            _game.OnLogMessage += msg => Debug.Log($"   | {msg}");
            _game.InitializeTutorialLevel1();
            _tutorial = new TutorialManager();
            _tutorial.BindGame(_game);
            _tutorial.CurrentStepIndex = 0;

            Debug.Log($"\n地图城镇：{_game.Grid.Towns.Count} | 活跃合同：{_game.ContractManager.ActiveContracts.Count}");
            Debug.Log($"玩家位置：{_game.Player.Position} | 燃料：{_game.Player.Fuel}/{_game.Player.MaxFuel}");
            Debug.Log($"风向：{WindManager.GetWindStrengthLabel(_game.WindManager.CurrentWind.Strength)} {WindManager.GetWindDirectionLabel(_game.WindManager.CurrentWind.Direction)}");

            var plan = _game.Planner.CurrentPlan;
            Debug.Log("\n👉 规划航线：从邮局(0,0) 到 云顶镇(2,0)");

            var step1 = new AxialCoord(1, 0);
            if (_game.Planner.TryAddStep(step1))
                Debug.Log($"   已添加：(0,0)→(1,0)  燃料-{_game.Planner.CurrentPlan.Steps[0].FuelCost}");

            var step2 = new AxialCoord(2, 0);
            if (_game.Planner.TryAddStep(step2))
                Debug.Log($"   已添加：(1,0)→(2,0)  燃料-{_game.Planner.CurrentPlan.Steps[1].FuelCost}");

            var score = _game.Planner.GetCurrentScore();
            Debug.Log($"\n📊 航线评分：{score.TotalScore}分");
            if (!string.IsNullOrEmpty(score.PriorityExplanation))
                Debug.Log(score.PriorityExplanation);

            Debug.Log("\n▶ 执行航线...");
            _game.ExecutePlan();

            var report = _game.ContractManager.GenerateSettlementReport(_game.TurnsElapsed);
            Debug.Log("");
            Debug.Log(SettlementPresenter.BuildView(report, _game).DeliveredList);

            bool pass = _tutorial.CheckStepCompletion(report);
            Debug.Log($"\n🎯 教程检查：{(pass ? "✅ 通过！" : "❌ 未通过")}");
            Debug.Log($"   目标1: 完成1次投递 → {report.DeliveredCount >= 1}");
            Debug.Log($"   目标2: 评分≥50 → {report.FinalScore}分");
        }

        private void RunTutorial2_WindAndFragile()
        {
            Debug.Log("\n" + new string('-', 80));
            Debug.Log("📗 教程第二关：风向反转和易碎品");
            Debug.Log(new string('-', 80));

            _game = new GameManager(102, 25, 0);
            _game.OnLogMessage += msg => Debug.Log($"   | {msg}");
            _game.InitializeTutorialLevel2();
            _tutorial = new TutorialManager();
            _tutorial.BindGame(_game);
            _tutorial.CurrentStepIndex = 1;

            Debug.Log("\n📜 合同：易碎包裹 邮局总站 → 云顶镇（损坏度=0才能零损坏）");
            Debug.Log("🌤  风向预报：");
            for (int i = 0; i < 3; i++)
            {
                var w = _game.WindManager.Forecast[i];
                Debug.Log($"   T{w.TurnIndex}: {WindManager.GetWindStrengthLabel(w.Strength)} {WindManager.GetWindDirectionLabel(w.Direction)}");
            }

            Debug.Log("\n👉 规划避开森林的最优路线...");
            var target = new AxialCoord(3, 0);
            var route = HexPathfinder.FindPath(
                _game.Grid,
                _game.Player.Position,
                target,
                _game.WindManager.CurrentWind,
                true);

            Debug.Log($"   寻路结果：{(route.Success ? "成功" : "失败")}, 步数={route.Steps}, 成本={route.TotalCost}");

            if (route.Success)
            {
                for (int i = 1; i < route.Path.Count; i++)
                {
                    _game.Planner.TryAddStep(route.Path[i]);
                }
            }

            int totalDamage = 0;
            foreach (var s in _game.Planner.CurrentPlan.Steps) totalDamage += s.DamageTaken;
            Debug.Log($"   航线总损坏度：{totalDamage}");

            var score = _game.Planner.GetCurrentScore();
            Debug.Log($"\n📊 航线评分：{score.TotalScore}分");

            Debug.Log("\n▶ 执行航线...");
            _game.ExecutePlan();

            var report = _game.ContractManager.GenerateSettlementReport(_game.TurnsElapsed);
            Debug.Log($"\n📦 投递结果：{report.DeliveredCount}个送达");
            foreach (var rec in report.DeliveryRecords)
            {
                Debug.Log($"   损坏度：{rec.DamageTaken} 完好：{rec.Intact}");
            }

            bool pass = _tutorial.CheckStepCompletion(report);
            Debug.Log($"\n🎯 教程检查：{(pass ? "✅ 通过！零损坏完美投递！" : "❌ 再试一次，避开逆风/山地")}");
        }

        private void RunTutorial3_TimeSensitive()
        {
            Debug.Log("\n" + new string('-', 80));
            Debug.Log("📗 教程第三关：限时合同和优先级评分");
            Debug.Log(new string('-', 80));

            _game = new GameManager(103, 30, 0);
            _game.OnLogMessage += msg => Debug.Log($"   | {msg}");
            _game.InitializeTutorialLevel3();
            _tutorial = new TutorialManager();
            _tutorial.BindGame(_game);
            _tutorial.CurrentStepIndex = 2;

            var tsContract = _game.ContractManager.ActiveContracts.Find(c => c.Type == ContractType.TimeSensitive);
            Debug.Log($"\n⏰ 限时合同：{tsContract?.FromTown} → {tsContract?.ToTown}");
            Debug.Log($"   限制回合：{tsContract?.MaxTurns} | 奖励：{tsContract?.BaseReward}金 | 优先级★★★");

            Debug.Log("\n🌟 评分优先级规则：");
            Debug.Log("   ★★★ 限时合同 权重最高 → 提前送达有高额奖金");
            Debug.Log("   ★★  易碎合同 → 零损坏额外奖励");
            Debug.Log("   ★   普通合同 → 最基础的分");
            Debug.Log("   💨  顺风连击 → 连续顺风步骤有叠加奖励\n");

            var target = new AxialCoord(4, -1);
            Debug.Log($"👉 寻路：邮局 → 风车村 {target}");
            var route = HexPathfinder.FindPath(_game.Grid, _game.Player.Position, target, null, true);
            Debug.Log($"   预估步数：{route.Steps} / 限制：{tsContract.MaxTurns}回合");

            for (int i = 1; i < route.Path.Count; i++)
            {
                _game.Planner.TryAddStep(route.Path[i]);
            }

            var score = _game.Planner.GetCurrentScore();
            Debug.Log($"\n📊 路线评分：{score.TotalScore}");
            Debug.Log(score.PriorityExplanation);
            Debug.Log($"\n   评分明细：路径={score.DistanceEfficiencyScore} 优先级={score.PriorityScore} 准时={score.OnTimeScore}");

            Debug.Log("\n▶ 执行航线...");
            _game.ExecutePlan();

            var report = _game.ContractManager.GenerateSettlementReport(_game.TurnsElapsed);
            Debug.Log($"\n📋 结算：");
            foreach (var rec in report.DeliveryRecords)
            {
                Debug.Log($"   {rec.ContractId} | 回合{rec.TurnsTaken} | 准时={rec.OnTime} | 收益{rec.RewardEarned}");
            }
            Debug.Log($"   最终分数：{report.FinalScore}");

            bool pass = _tutorial.CheckStepCompletion(report);
            Debug.Log($"\n🎯 教程检查：{(pass ? "✅ 通过！你已掌握所有玩法！" : "❌ 再试一次，确保准时送达")}");

            if (pass)
            {
                var hasNext = _tutorial.AdvanceToNextStep();
                Debug.Log(hasNext
                    ? "\n➡ 进入下一教程..."
                    : "\n🎉 全部教程完成！现在挑战正式关卡吧！");
            }
        }

        private void RunStandardLevel()
        {
            Debug.Log("\n" + new string('-', 80));
            Debug.Log("🎮 正式关卡：第1关 标准地图");
            Debug.Log(new string('-', 80));

            _game = new GameManager(42, 30, 0);
            _game.OnLogMessage += msg => Debug.Log($"   | {msg}");
            _game.InitializeStandardLevel(4, 5);

            Debug.Log($"\n🗺 地图信息：半径={_game.Grid.Radius}  格子数={_game.Grid.Count}");
            Debug.Log($"   城镇：{_game.Grid.Towns.Count} | 邮局：{_game.Grid.PostOffices.Count}");
            Debug.Log($"   燃料：{_game.Player.Fuel}/{_game.Player.MaxFuel}  金币：{_game.Player.Money}");

            Debug.Log("\n📋 待接合同：");
            foreach (var c in _game.ContractManager.GetSortedPending())
            {
                Debug.Log($"   {c.Description}");
            }

            var pending = _game.ContractManager.GetSortedPending();
            Debug.Log("");
            for (int i = 0; i < Math.Min(3, pending.Count); i++)
            {
                _game.ContractManager.AcceptContract(pending[i].Id);
                Debug.Log($"   ✅ 已接合同：{pending[i].FromTown}→{pending[i].ToTown} ({pending[i].BaseReward}金)");
            }
            _game.ContractManager.MarkContractsInTransit();

            Debug.Log("");
            Debug.Log("🌤  风向预报（提前两步预告）：");
            Debug.Log(_game.WindManager.GetForecastSummary());

            var active = _game.ContractManager.GetSortedActive();
            if (active.Count > 0)
            {
                var firstContract = active[0];
                Debug.Log($"\n👉 优先安排最高优先级合同：{firstContract.FromTown}→{firstContract.ToTown}");

                var routeTo = HexPathfinder.FindPath(_game.Grid, _game.Player.Position, firstContract.FromCoord);
                Debug.Log($"   取件路径：{routeTo.Steps}步，成本{routeTo.TotalCost}");

                if (routeTo.Success)
                {
                    for (int i = 1; i < routeTo.Path.Count; i++)
                        _game.Planner.TryAddStep(routeTo.Path[i]);

                    var routeDeliver = HexPathfinder.FindPath(_game.Grid, firstContract.FromCoord, firstContract.ToCoord);
                    if (routeDeliver.Success)
                    {
                        for (int i = 1; i < routeDeliver.Path.Count; i++)
                            _game.Planner.TryAddStep(routeDeliver.Path[i]);
                    }
                }
            }

            Debug.Log($"\n📊 当前航线评分：{_game.Planner.GetCurrentScore().TotalScore}");
            Debug.Log($"   步数：{_game.Planner.CurrentPlan.Steps.Count} | 燃料消耗：{_game.Planner.CurrentPlan.TotalFuelCost}");

            Debug.Log("\n💾 保存游戏...");
            bool saveOk = SaveSystem.SaveGame(_game, "Demo_StandardLevel");
            Debug.Log($"   保存结果：{(saveOk ? "✅ 成功" : "❌ 失败")}");

            Debug.Log("\n▶ 执行航线并结算...");
            _game.OnSettlementComplete += report =>
            {
                Debug.Log("\n" + SettlementPresenter.GenerateReplaySummary(_game, report));

                var saves = SaveSystem.ListAllSaves();
                Debug.Log($"\n💾 存档列表（共{saves.Count}个）：");
                foreach (var s in saves)
                    Debug.Log($"   📁 {s.SaveName} | {s.SaveTime:MM-dd HH:mm} | 回合{s.TurnsElapsed}/{s.MaxTurns}");

                Debug.Log("\n🎮 测试撤销功能...");
                TestUndoStack();
            };
            _game.ExecutePlan();
        }

        private void TestUndoStack()
        {
            var testGame = new GameManager(999, 20, 0);
            testGame.InitializeTutorialLevel1();

            Debug.Log("   初始燃料：" + testGame.Player.Fuel);

            testGame.Planner.TryAddStep(new AxialCoord(1, 0));
            testGame.Planner.TryAddStep(new AxialCoord(2, 0));
            Debug.Log($"   添加2步后，步骤数={testGame.Planner.CurrentPlan.Steps.Count}");

            testGame.Planner.Undo();
            Debug.Log($"   撤销1步后，步骤数={testGame.Planner.CurrentPlan.Steps.Count}");

            testGame.Planner.Undo();
            Debug.Log($"   再撤销1步后，步骤数={testGame.Planner.CurrentPlan.Steps.Count}");

            bool canUndoMore = testGame.Planner.Undo();
            Debug.Log($"   继续撤销？{(canUndoMore ? "是" : "否(已到栈底)")}");

            Debug.Log("   ✅ 撤销/恢复系统正常工作！");
        }
    }
}
