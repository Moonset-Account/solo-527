using System;
using System.Collections.Generic;
using UnityEngine;

namespace BalloonPost.Tutorial
{
    using BalloonPost.Core;

    [Serializable]
    public class TutorialStep
    {
        public string StepId;
        public string Title;
        public string Description;
        public string Hint;
        public int RequiredMinDeliveries;
        public int RequiredMinScore;
        public bool RequireOnTime;
        public bool RequireNoDamage;
        public List<string> Objectives;
        public string NextStepId;
        public bool IsComplete;
    }

    public class TutorialManager
    {
        public List<TutorialStep> TutorialSteps;
        public int CurrentStepIndex;
        public GameManager Game;
        public event Action<TutorialStep> OnStepStarted;
        public event Action<TutorialStep> OnStepCompleted;
        public event Action OnAllCompleted;

        public TutorialManager()
        {
            InitializeSteps();
        }

        private void InitializeSteps()
        {
            TutorialSteps = new List<TutorialStep>
            {
                new TutorialStep
                {
                    StepId = "step1_first_delivery",
                    Title = "第一课：第一次投递",
                    Description = "欢迎来到热气球邮差！让我们完成一次最简单的投递。\n\n" +
                                  "1. 看看地图上的 ✉邮局（原点）和 🏘云顶镇（右边2格）\n" +
                                  "2. 点击相邻的格子来规划航线\n" +
                                  "3. 查看左上角的风向预告，顺风可以节省燃料\n" +
                                  "4. 点击「执行航线」按钮让热气球出发！",
                    Hint = "提示：从邮局出发，往东走2步就能到达云顶镇。\n注意燃料消耗，别规划超出燃料范围的路线。",
                    RequiredMinDeliveries = 1,
                    RequiredMinScore = 50,
                    RequireOnTime = false,
                    RequireNoDamage = false,
                    Objectives = new List<string>
                    {
                        "完成至少1次投递",
                        "路线评分达到50分以上"
                    },
                    NextStepId = "step2_wind_and_fragile"
                },
                new TutorialStep
                {
                    StepId = "step2_wind_and_fragile",
                    Title = "第二课：风向与易碎品",
                    Description = "风会影响你的飞行！注意：\n\n" +
                                  "🌀 **顺风**：减少燃料消耗（看箭头方向一致）\n" +
                                  "💨 **逆风**：增加燃料消耗，还可能损坏包裹\n" +
                                  "⛰ **山地/森林**：移动成本高\n" +
                                  "🌪 **风暴格**：尽量绕开，非常耗油且伤货\n\n" +
                                  "这关有个易碎包裹[易碎★★]，别让它受到太多撞击！",
                    Hint = "查看风向面板的两步预告。\n如果风是向东的，向东飞会省油；向西飞就会很费力。\n" +
                           "易碎包裹在逆风、山地、风暴中都会累积损坏。",
                    RequiredMinDeliveries = 1,
                    RequiredMinScore = 80,
                    RequireOnTime = false,
                    RequireNoDamage = true,
                    Objectives = new List<string>
                    {
                        "完成1次易碎品投递",
                        "货物损坏度为0（零损坏）",
                        "评分达到80分以上"
                    },
                    NextStepId = "step3_time_sensitive"
                },
                new TutorialStep
                {
                    StepId = "step3_time_sensitive",
                    Title = "第三课：限时合同",
                    Description = "高价值的限时快递来了！⏰\n\n" +
                                  "📜 **限时合同[★★★]**：\n" +
                                  "- 优先级最高，必须在MaxTurns回合内送达\n" +
                                  "- 超时会有严重罚款（可能全额赔偿）\n" +
                                  "- 提前送达有额外奖金！\n\n" +
                                  "🌟 **优先级评分规则**：\n" +
                                  "评分 = 路径效率 + 合同优先级 + 准时奖励 + 完好奖励 + 顺风连击\n\n" +
                                  "最短路径未必最优！要优先送限时合同。",
                    Hint = "规划路线时先看看路线评分面板的「优先级解释」。\n" +
                           "确保限时合同在限定回合内送达，再考虑其他。\n" +
                           "可以使用「撤销」按钮修改不满意的航点。",
                    RequiredMinDeliveries = 1,
                    RequiredMinScore = 120,
                    RequireOnTime = true,
                    RequireNoDamage = false,
                    Objectives = new List<string>
                    {
                        "完成1次限时合同投递",
                        "限时合同必须准时送达",
                        "路线评分达到120分以上"
                    },
                    NextStepId = null
                }
            };
        }

        public void BindGame(GameManager game)
        {
            Game = game;
            CurrentStepIndex = 0;
            foreach (var step in TutorialSteps)
            {
                step.IsComplete = false;
            }
        }

        public TutorialStep CurrentStep => CurrentStepIndex >= 0 && CurrentStepIndex < TutorialSteps.Count
            ? TutorialSteps[CurrentStepIndex]
            : null;

        public void StartCurrentStep()
        {
            if (CurrentStep != null)
            {
                OnStepStarted?.Invoke(CurrentStep);
            }
        }

        public bool CheckStepCompletion(SettlementReport report)
        {
            if (CurrentStep == null || Game == null) return false;

            bool deliveriesOK = report.DeliveredCount >= CurrentStep.RequiredMinDeliveries;
            bool scoreOK = report.FinalScore >= CurrentStep.RequiredMinScore;

            bool onTimeOK = true;
            if (CurrentStep.RequireOnTime)
            {
                foreach (var rec in report.DeliveryRecords)
                {
                    if (!rec.OnTime)
                    {
                        onTimeOK = false;
                        break;
                    }
                }
            }

            bool noDamageOK = true;
            if (CurrentStep.RequireNoDamage)
            {
                foreach (var rec in report.DeliveryRecords)
                {
                    if (!rec.Intact || rec.DamageTaken > 0)
                    {
                        noDamageOK = false;
                        break;
                    }
                }
            }

            return deliveriesOK && scoreOK && onTimeOK && noDamageOK;
        }

        public bool AdvanceToNextStep()
        {
            if (CurrentStep == null) return false;
            CurrentStep.IsComplete = true;
            OnStepCompleted?.Invoke(CurrentStep);
            Game?.Player?.CompletedTutorialSteps?.Add(CurrentStep.StepId);

            if (string.IsNullOrEmpty(CurrentStep.NextStepId))
            {
                OnAllCompleted?.Invoke();
                return false;
            }

            for (int i = 0; i < TutorialSteps.Count; i++)
            {
                if (TutorialSteps[i].StepId == CurrentStep.NextStepId)
                {
                    CurrentStepIndex = i;
                    StartCurrentStep();
                    return true;
                }
            }
            return false;
        }

        public string GetProgressText()
        {
            int completed = 0;
            foreach (var s in TutorialSteps) if (s.IsComplete) completed++;
            return $"教程进度：{completed} / {TutorialSteps.Count}";
        }

        public List<string> GetObjectiveStatus(SettlementReport report, GameManager game)
        {
            var status = new List<string>();
            if (CurrentStep == null) return status;

            foreach (var obj in CurrentStep.Objectives)
            {
                bool done = EvaluateObjective(obj, report, game);
                status.Add($"{(done ? "✅" : "⬜")} {obj}");
            }
            return status;
        }

        private bool EvaluateObjective(string obj, SettlementReport report, GameManager game)
        {
            if (obj.Contains("1次投递") || obj.Contains("1次"))
                return report.DeliveredCount >= 1;
            if (obj.Contains("评分达到50"))
                return report.FinalScore >= 50;
            if (obj.Contains("评分达到80"))
                return report.FinalScore >= 80;
            if (obj.Contains("评分达到120"))
                return report.FinalScore >= 120;
            if (obj.Contains("损坏度为0") || obj.Contains("零损坏"))
            {
                foreach (var r in report.DeliveryRecords)
                    if (r.DamageTaken > 0) return false;
                return report.DeliveredCount > 0;
            }
            if (obj.Contains("准时"))
            {
                foreach (var r in report.DeliveryRecords)
                    if (!r.OnTime) return false;
                return report.DeliveredCount > 0;
            }
            return false;
        }
    }
}
