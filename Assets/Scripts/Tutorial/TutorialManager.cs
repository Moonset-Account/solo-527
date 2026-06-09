using System;
using System.Collections.Generic;
using UnityEngine;

namespace BalloonPost.Tutorial
{
    using BalloonPost.Core;
    using BalloonPost.UI;

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
        public bool RequireOnTime;
        public bool RequireNoDamage;
        public bool RequireWindReverseNotice;
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
                    StepId = "step1_on_time_delivery",
                    TutorialLevelIndex = 1,
                    Title = "第一课：准时投递",
                    Description = "🎈 欢迎成为热气球邮差！\n\n" +
                                  "这一关的目标非常简单：**把邮包准时送到**。\n\n" +
                                  "📍 操作方法：\n" +
                                  "   1. 点击地图上与当前位置相邻的绿色格子，那是下一步可选位置\n" +
                                  "   2. 规划好整条航线后，点击「▶ 执行航线」按钮\n" +
                                  "   3. 热气球会按步骤飞行，到达城镇时自动投递\n\n" +
                                  "⏰ **准时**是什么意思？\n" +
                                  "   合同写了「5回合内送达」，在5步以内送到就算准时，\n" +
                                  "   提前送达还有奖金！超时会被扣分和投诉。\n\n" +
                                  "💡 本关地图只有一条直路，不用担心迷路～",
                    Hint = "提示：\n" +
                           "• 从邮局✉出发，走3步到🏘清风镇\n" +
                           "• 每一步都是绿色，都可以走\n" +
                           "• 点击「执行」后就不能撤销啦，确认好路线再执行\n" +
                           "• 注意右上角剩余步数不要超过合同的 MaxTurns！",
                    RequiredMinDeliveries = 1,
                    RequiredMinScore = 50,
                    RequireOnTime = true,
                    RequireNoDamage = false,
                    RequireWindReverseNotice = false,
                    Objectives = new List<string>
                    {
                        "完成至少1次投递",
                        "投递必须准时（不超过MaxTurns回合）",
                        "路线评分达到50分以上"
                    },
                    NextStepId = "step2_wind_reversal"
                },
                new TutorialStep
                {
                    StepId = "step2_wind_reversal",
                    TutorialLevelIndex = 2,
                    Title = "第二课：风向反转的陷阱",
                    Description = "🌬 上一关顺利！现在你需要认识——风。\n\n" +
                                  "📍 风向系统（提前2步预告！）：\n" +
                                  "   看左上角的面板，你能看到「本回合」「下一步」「两步后」的风向。\n\n" +
                                  "   • 🟢 **顺风**：和你飞行方向相同 → 省燃料，飞的轻松\n" +
                                  "   • � **逆风**：和你飞行方向相反 → 耗燃料，还会晃到包裹\n" +
                                  "   • 🟡 **侧风**：和飞行方向垂直 → 几乎没有影响\n\n" +
                                  "⚠️ **风向反转**：\n" +
                                  "   每过几个回合，风向可能会突然180度大逆转！\n" +
                                  "   如果你只看了第1步顺风就冲出去，第2步风向反过来就麻烦了。\n\n" +
                                  "🧸 本关还有易碎包裹，逆风山地都会加损坏度。",
                    Hint = "关键技巧：\n" +
                           "① 先看2步预告，再规划整条航线，不要走一步算一步\n" +
                           "② 本关T3回合风向会反转！检查预报面板\n" +
                           "③ 如果第2步是逆风，考虑绕一下避开，别硬冲\n" +
                           "④ 易碎包裹损坏度到4就完全赔本了，小心！",
                    RequiredMinDeliveries = 1,
                    RequiredMinScore = 80,
                    RequireOnTime = false,
                    RequireNoDamage = true,
                    RequireWindReverseNotice = true,
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
                    Title = "第三课：优先级与限时合同",
                    Description = "⏰ 现在是综合考验：多合同和优先级！\n\n" +
                                  "� **合同优先级**（评分时权重不同）：\n" +
                                  "   ★★★ 🔴 限时快递：最高优先级！不送要全额赔偿\n" +
                                  "   ★★  🟠 易碎包裹：损坏扣钱，完好有奖励\n" +
                                  "   ★   🟢 普通邮件：最基础，不着急\n\n" +
                                  "🗺 **路线规划不是越短越好**：\n" +
                                  "   最短路径未必最优！要优先送：\n" +
                                  "   ① 回合快用完的限时合同\n" +
                                  "   ② 高价值合同\n" +
                                  "   ③ 顺路能一起送的\n\n" +
                                  "🌟 评分面板会显示「优先级解释」，\n" +
                                  "   告诉你哪些合同在路线上、哪些错过了。\n\n" +
                                  "↩️ 规划错了？点「撤销」！最多50步历史！",
                    Hint = "过关建议：\n" +
                           "① 先送风车村的限时快递（8回合限制），它最急\n" +
                           "② 看2步风向预报，规划顺风路线\n" +
                           "③ 如果评分不够，看看「优先级解释」，调整顺序\n" +
                           "④ 撤销是免费的！大胆试不同方案",
                    RequiredMinDeliveries = 2,
                    RequiredMinScore = 200,
                    RequireOnTime = true,
                    RequireNoDamage = false,
                    RequireWindReverseNotice = false,
                    Objectives = new List<string>
                    {
                        "完成至少2次投递",
                        "所有限时合同必须准时",
                        "路线评分达到200分以上"
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
                onTimeOK = onTimeOK && report.DeliveredCount > 0;
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

            return deliveriesOK && scoreOK && onTimeOK && noDamageOK;
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
                OnTutorialMessage?.Invoke("🎉 恭喜！你已完成全部教程，现在可以挑战正式关卡了！");
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
                status.Add((done ? "✅ " : "⬜ ") + obj);
            }
            return status;
        }

        private bool EvaluateObjective(string obj, SettlementReport report, GameManager game)
        {
            int n;
            if (TryParseNumber(obj, "1次投递", out n) || TryParseNumber(obj, "至少1次投递", out n))
                return report.DeliveredCount >= 1;
            if (TryParseNumber(obj, "2次投递", out n) || TryParseNumber(obj, "至少2次投递", out n))
                return report.DeliveredCount >= 2;
            if (obj.Contains("评分达到50")) return report.FinalScore >= 50;
            if (obj.Contains("评分达到80")) return report.FinalScore >= 80;
            if (obj.Contains("评分达到200")) return report.FinalScore >= 200;
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
            if (obj.Contains("所有限时合同必须准时"))
            {
                foreach (var r in report.DeliveryRecords)
                    if (!r.OnTime) return false;
                return report.DeliveredCount > 0;
            }
            return false;
        }

        private bool TryParseNumber(string text, string pattern, out int num)
        {
            num = 0;
            return text.Contains(pattern);
        }
    }
}
