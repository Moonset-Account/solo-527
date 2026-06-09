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
        public int TutorialLevelIndex;
        public string Title;
        public string Description;
        public string Hint;
        public int RequiredMinDeliveries;
        public int RequiredMinScore;

        public bool RequireStepPunctual;
        public int ExpectedMaxTurns;

        public bool RequireContractOnTime;
        public bool RequireNoDamage;
        public bool RequireWindReverseNotice;
        public bool RequireTimeSensitiveType;

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
        public event Action<string> OnTutorialMessage;

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
                    StepId = "step1_punctual_delivery",
                    TutorialLevelIndex = 1,
                    Title = "第一课：完成一次准时投递",
                    Description = "🎈 欢迎成为热气球邮差！\n\n" +
                                  "我们先做一次最简单的「普通邮件」投递。\n" +
                                  "你手上的合同类型是「普通邮件」，没有损坏惩罚。\n\n" +
                                  "📍 操作方法：\n" +
                                  "   1. 看地图：邮局✉在中心(0,0)，清风镇🏘在正东方向3格\n" +
                                  "   2. 点击地图上绿色高亮的相邻格子 → 把它加入航线\n" +
                                  "   3. 路线规划好后，点底部绿色按钮「▶ 执行航线」\n\n" +
                                  "⏰ 什么是「准时」？\n" +
                                  "   这次的投递虽然是普通合同，但我们有个内部目标：**5回合内送达**\n" +
                                  "   从邮局到清风镇直线只有3步，你应该能轻松完成！\n\n" +
                                  "💡 先点(1,0)，再点(2,0)，再点(3,0)，然后执行！",
                    Hint = "操作口诀：看颜色 → 点绿格 → 按执行\n\n" +
                           "• 绿格：下一步可以走到的位置\n" +
                           "• 蓝格：需要取件的起点（邮局一般就是起点）\n" +
                           "• 红格：需要投递的终点（城镇）\n" +
                           "• 规划错了？点「撤销一步」或者「清空航线」重来",
                    RequiredMinDeliveries = 1,
                    RequiredMinScore = 50,
                    RequireStepPunctual = true,
                    ExpectedMaxTurns = 5,
                    RequireContractOnTime = false,
                    RequireNoDamage = false,
                    RequireWindReverseNotice = false,
                    RequireTimeSensitiveType = false,
                    Objectives = new List<string>
                    {
                        "完成至少1次投递",
                        "投递必须在5回合内完成（准时）",
                        "路线评分达到50分以上"
                    },
                    NextStepId = "step2_wind_reversal"
                },
                new TutorialStep
                {
                    StepId = "step2_wind_reversal",
                    TutorialLevelIndex = 2,
                    Title = "第二课：风向反转与易碎包裹",
                    Description = "🌬 不错！现在你需要学会两件事：**风**和**易碎品**。\n\n" +
                                  "📍 风向系统（提前2步预告！）：\n" +
                                  "   顶部风向面板显示3个回合的风：本回合、下一步、两步后\n" +
                                  "   • 🟢 顺风：和飞行方向一致 → 省燃料\n" +
                                  "   • 🔴 逆风：和飞行方向相反 → 费燃料 + 损包裹\n" +
                                  "   • 🟡 侧风：垂直方向 → 几乎没影响\n\n" +
                                  "⚠️ **风向反转**：\n" +
                                  "   每隔几回合风可能180°大逆转！\n" +
                                  "   这关**T3回合风向会反转**！提前看2步预告，不要只看一步～\n\n" +
                                  "🧸 本关合同类型是「易碎品」：\n" +
                                  "   逆风、山地、风暴都会让损坏度上升，损坏到4就赔本了！",
                    Hint = "过关技巧：\n" +
                           "① 先看完2步风向预报，再整条规划，别走一步看一步\n" +
                           "② 第3回合风向会反转，别让第3步撞到逆风！\n" +
                           "③ 如果某步会逆风/山地，考虑绕一下（哪怕多走一步）\n" +
                           "④ 本关目标是「零损坏」，别心疼燃料！",
                    RequiredMinDeliveries = 1,
                    RequiredMinScore = 80,
                    RequireStepPunctual = false,
                    ExpectedMaxTurns = 0,
                    RequireContractOnTime = false,
                    RequireNoDamage = true,
                    RequireWindReverseNotice = true,
                    RequireTimeSensitiveType = false,
                    Objectives = new List<string>
                    {
                        "完成1次易碎品投递",
                        "包裹损坏度必须为0（零损坏）",
                        "评分达到80分以上"
                    },
                    NextStepId = "step3_time_sensitive"
                },
                new TutorialStep
                {
                    StepId = "step3_time_sensitive",
                    TutorialLevelIndex = 3,
                    Title = "第三课：限时合同与优先级评分",
                    Description = "⏰ 终极考验！全新合同类型登场——「限时快递」！\n\n" +
                                  "📦 **合同优先级（决定评分的关键）**：\n" +
                                  "   ★★★ 🔴 **限时快递**（本关首次出现！）\n" +
                                  "         超过MaxTurns回合 → 全额赔偿！必须优先送！\n" +
                                  "   ★★  🟠 易碎包裹\n" +
                                  "         损坏扣钱，完好额外奖励\n" +
                                  "   ★   � 普通邮件\n" +
                                  "         基础合同，没有额外要求\n\n" +
                                  "🗺 **为什么最短路径不一定得分高？**\n" +
                                  "   评分系统会看：你有没有先送优先级高的？\n" +
                                  "   如果绕路先送限时合同，总分反而更高！\n\n" +
                                  "🌟 路线评分面板里有「优先级解释」：\n" +
                                  "   告诉你每一份合同得分/失分的原因。\n\n" +
                                  "↩️ 规划错了？「撤销一步」可回退50步！大胆试！",
                    Hint = "本关过关建议：\n" +
                           "① 先送风车村的「限时快递」（8回合限制），它最急\n" +
                           "② 剩余燃料再顺路送其他两个\n" +
                           "③ 如果分不够，看评分面板的「优先级解释」找问题\n" +
                           "④ 目标200分以上，多送合同优先级就高，加油！",
                    RequiredMinDeliveries = 2,
                    RequiredMinScore = 200,
                    RequireStepPunctual = false,
                    ExpectedMaxTurns = 0,
                    RequireContractOnTime = true,
                    RequireNoDamage = false,
                    RequireWindReverseNotice = false,
                    RequireTimeSensitiveType = true,
                    Objectives = new List<string>
                    {
                        "完成至少2次投递",
                        "所有限时快递必须准时送达",
                        "至少完成1份★★★限时快递",
                        "路线总分达到200分以上"
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
                OnTutorialMessage?.Invoke("=== " + CurrentStep.Title + " ===");
                OnTutorialMessage?.Invoke(CurrentStep.Description);
                OnStepStarted?.Invoke(CurrentStep);
            }
        }

        public bool CheckStepCompletion(SettlementReport report)
        {
            if (CurrentStep == null || Game == null) return false;

            bool deliveriesOK = report.DeliveredCount >= CurrentStep.RequiredMinDeliveries;
            bool scoreOK = report.FinalScore >= CurrentStep.RequiredMinScore;

            bool punctualOK = true;
            if (CurrentStep.RequireStepPunctual && CurrentStep.ExpectedMaxTurns > 0)
            {
                foreach (var rec in report.DeliveryRecords)
                {
                    if (rec.TurnsTaken > CurrentStep.ExpectedMaxTurns)
                    {
                        punctualOK = false;
                        break;
                    }
                }
                punctualOK = punctualOK && report.DeliveredCount > 0;
            }

            bool contractOnTimeOK = true;
            if (CurrentStep.RequireContractOnTime)
            {
                foreach (var rec in report.DeliveryRecords)
                {
                    if (!rec.OnTime)
                    {
                        contractOnTimeOK = false;
                        break;
                    }
                }
                contractOnTimeOK = contractOnTimeOK && report.DeliveredCount > 0;
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
                noDamageOK = noDamageOK && report.DeliveredCount > 0;
            }

            bool hasTimeSensOK = true;
            if (CurrentStep.RequireTimeSensitiveType)
            {
                bool found = false;
                foreach (var rec in report.DeliveryRecords)
                {
                    var c = Game.ContractManager.AllContracts.Find(x => x.Id == rec.ContractId);
                    if (c != null && c.Type == ContractType.TimeSensitive)
                    {
                        found = true;
                        break;
                    }
                }
                hasTimeSensOK = found;
            }

            return deliveriesOK && scoreOK && punctualOK
                   && contractOnTimeOK && noDamageOK && hasTimeSensOK;
        }

        public List<string> GetObjectiveChecks(SettlementReport report)
        {
            var result = new List<string>();
            if (CurrentStep == null) return result;

            foreach (var obj in CurrentStep.Objectives)
            {
                bool ok = EvalObjective(obj, report);
                result.Add((ok ? "✅ " : "⬜ ") + obj);
            }
            return result;
        }

        private bool EvalObjective(string obj, SettlementReport report)
        {
            if (obj.Contains("至少1次投递")) return report.DeliveredCount >= 1;
            if (obj.Contains("至少2次投递")) return report.DeliveredCount >= 2;
            if (obj.Contains("1份★★★限时快递") || obj.Contains("1份") && obj.Contains("限时"))
            {
                foreach (var rec in report.DeliveryRecords)
                {
                    var c = Game.ContractManager?.AllContracts?.Find(x => x.Id == rec.ContractId);
                    if (c != null && c.Type == ContractType.TimeSensitive) return true;
                }
                return false;
            }
            if (obj.Contains("5回合内完成") || obj.Contains("5回合内") && obj.Contains("准时"))
            {
                if (report.DeliveredCount == 0) return false;
                foreach (var rec in report.DeliveryRecords)
                    if (rec.TurnsTaken > 5) return false;
                return true;
            }
            if (obj.Contains("限时快递必须准时") || obj.Contains("所有限时"))
            {
                if (report.DeliveredCount == 0) return false;
                foreach (var rec in report.DeliveryRecords)
                    if (!rec.OnTime) return false;
                return true;
            }
            if (obj.Contains("损坏度必须为0") || obj.Contains("零损坏"))
            {
                if (report.DeliveredCount == 0) return false;
                foreach (var rec in report.DeliveryRecords)
                    if (rec.DamageTaken > 0) return false;
                return true;
            }
            if (obj.Contains("评分达到50")) return report.FinalScore >= 50;
            if (obj.Contains("评分达到80")) return report.FinalScore >= 80;
            if (obj.Contains("总分达到200") || obj.Contains("评分达到200")) return report.FinalScore >= 200;
            return false;
        }

        public bool AdvanceToNextStep()
        {
            if (CurrentStep == null) return false;
            CurrentStep.IsComplete = true;
            OnTutorialMessage?.Invoke("✅ 教程完成：" + CurrentStep.Title);
            OnStepCompleted?.Invoke(CurrentStep);
            Game?.Player?.CompletedTutorialSteps?.Add(CurrentStep.StepId);

            if (string.IsNullOrEmpty(CurrentStep.NextStepId))
            {
                OnTutorialMessage?.Invoke("🎉 恭喜！你已完成全部教程，可以挑战正式关卡了！");
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
                bool done = EvalObjective(obj, report);
                status.Add((done ? "✅ " : "⬜ ") + obj);
            }
            return status;
        }
    }
}
