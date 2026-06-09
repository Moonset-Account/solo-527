using System;
using System.Collections.Generic;
using System.Text;
using UnityEngine;

namespace BalloonPost.UI
{
    using BalloonPost.Core;

    public static class SettlementPresenter
    {
        public class SettlementViewData
        {
            public string TitleText;
            public string ScoreText;
            public string EarningsBreakdown;
            public string DeliveredList;
            public string ComplaintsList;
            public string UndeliveredList;
            public string HighlightsText;
            public string SummaryGrade;
            public int Stars;
        }

        public static SettlementViewData BuildView(SettlementReport report, GameManager game)
        {
            var view = new SettlementViewData();

            bool isWin = report.FinalScore >= 300 && report.ComplaintCount <= 2;
            view.TitleText = isWin ? "🎈 任务完成！" : "📋 结算报告";

            view.ScoreText = $"总分：{report.FinalScore}\n" +
                           $"剩余金币：{game?.Player?.Money ?? report.TotalEarnings}\n" +
                           $"声望值：{game?.Player?.Reputation ?? (100 + report.FinalReputationChange)}";

            var sb = new StringBuilder();
            sb.AppendLine("=== 收支明细 ===");
            sb.AppendLine($"合同基础价值：  {report.BaseContractValue,6} 金币");
            if (report.OnTimeBonus > 0)
                sb.AppendLine($"准时奖励：      +{report.OnTimeBonus,6} 金币");
            if (report.FragileBonus > 0)
                sb.AppendLine($"完好奖励：      +{report.FragileBonus,6} 金币");
            if (report.PriorityBonus > 0)
                sb.AppendLine($"效率奖励：      +{report.PriorityBonus,6} 金币");
            if (report.FuelSavings > 0)
                sb.AppendLine($"节油奖励：      +{report.FuelSavings,6} 金币");
            if (report.LatePenalties > 0)
                sb.AppendLine($"超时罚款：      -{report.LatePenalties,6} 金币");
            if (report.DamagePenalties > 0)
                sb.AppendLine($"损坏罚款：      -{report.DamagePenalties,6} 金币");
            if (report.FuelCosts > 0)
                sb.AppendLine($"救援/燃油费：   -{report.FuelCosts,6} 金币");
            sb.AppendLine(new string('-', 25));
            sb.AppendLine($"净收入：        {report.TotalEarnings,7} 金币");
            view.EarningsBreakdown = sb.ToString();

            var delivered = new StringBuilder();
            if (report.DeliveryRecords.Count == 0)
            {
                delivered.AppendLine("（本回合没有完成投递）");
            }
            else
            {
                delivered.AppendLine($"=== 已送达 ({report.DeliveredCount}) ===");
                foreach (var rec in report.DeliveryRecords)
                {
                    var contract = game?.ContractManager?.AllContracts?.Find(c => c.Id == rec.ContractId);
                    string name = contract != null
                        ? $"{contract.FromTown}→{contract.ToTown}"
                        : rec.ContractId;
                    string typeTag = contract != null
                        ? (contract.Type switch { ContractType.TimeSensitive => "[限时]", ContractType.Fragile => "[易碎]", _ => "[普通]" })
                        : "";
                    string status = (rec.OnTime ? "✅准时" : "⚠超时") + " " + (rec.Intact ? "✅完好" : "⚠损坏");
                    delivered.AppendLine($"{typeTag} {name}");
                    delivered.AppendLine($"  收益 {rec.RewardEarned} | 耗时 {rec.TurnsTaken}回合 | {status}");
                }
            }
            view.DeliveredList = delivered.ToString();

            var complaints = new StringBuilder();
            if (report.ComplaintDetails.Count == 0)
            {
                complaints.AppendLine("（零投诉，干得漂亮！）");
            }
            else
            {
                complaints.AppendLine($"=== 投诉与扣分 ({report.ComplaintCount}) ===");
                foreach (var detail in report.ComplaintDetails)
                {
                    complaints.AppendLine($"❌ {detail}");
                }
            }
            view.ComplaintsList = complaints.ToString();

            var undelivered = new StringBuilder();
            if (report.UndeliveredContractIds.Count == 0)
            {
                undelivered.AppendLine("（没有积压的邮包）");
            }
            else
            {
                undelivered.AppendLine($"=== 未送达 ({report.UndeliveredCount}) ===");
                foreach (var id in report.UndeliveredContractIds)
                {
                    var contract = game?.ContractManager?.AllContracts?.Find(c => c.Id == id);
                    if (contract != null)
                    {
                        undelivered.AppendLine($"📦 {contract.Description}");
                    }
                    else
                    {
                        undelivered.AppendLine($"📦 合同 {id}");
                    }
                }
                if (report.ExpiredCount > 0)
                {
                    undelivered.AppendLine($"\n⚠ 已作废合同：{report.ExpiredCount} 份");
                }
            }
            view.UndeliveredList = undelivered.ToString();

            var highlights = new StringBuilder();
            if (report.Highlights.Count == 0)
            {
                if (report.ComplaintCount == 0 && report.DeliveredCount > 0)
                {
                    highlights.AppendLine("✨ 完美执行，零失误！");
                }
            }
            else
            {
                highlights.AppendLine("=== 高光时刻 ===");
                foreach (var h in report.Highlights)
                {
                    highlights.AppendLine($"⭐ {h}");
                }
            }
            view.HighlightsText = highlights.ToString();

            (view.SummaryGrade, view.Stars) = CalculateGrade(report, game);

            return view;
        }

        private static (string grade, int stars) CalculateGrade(SettlementReport report, GameManager game)
        {
            int score = report.FinalScore;
            int delivered = report.DeliveredCount;
            int complaints = report.ComplaintCount;

            if (score >= 1000 && complaints == 0 && delivered >= 5)
                return ("S 传说级邮差", 5);
            if (score >= 700 && complaints <= 1)
                return ("A 王牌飞行员", 5);
            if (score >= 500 && complaints <= 1)
                return ("B 优秀飞行员", 4);
            if (score >= 300 && complaints <= 2)
                return ("C 合格飞行员", 3);
            if (score >= 100)
                return ("D 新手上路", 2);
            return ("F 实习期", 1);
        }

        public static string GenerateReplaySummary(GameManager game, SettlementReport report)
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== 🎈 热气球邮差 - 复盘报告 ===");
            sb.AppendLine($"关卡：第 {game.LevelIndex + 1} 关");
            sb.AppendLine($"总回合：{game.TurnsElapsed} / {game.MaxTurns}");
            sb.AppendLine($"最终位置：{game.Player.Position}");
            sb.AppendLine($"剩余燃料：{game.Player.Fuel} / {game.Player.MaxFuel}");
            sb.AppendLine();
            sb.AppendLine(BuildView(report, game).EarningsBreakdown);
            sb.AppendLine();
            sb.AppendLine(BuildView(report, game).DeliveredList);
            sb.AppendLine();
            sb.AppendLine(BuildView(report, game).ComplaintsList);
            sb.AppendLine();
            sb.AppendLine(BuildView(report, game).HighlightsText);
            sb.AppendLine();
            var view = BuildView(report, game);
            sb.AppendLine($"评级：{view.SummaryGrade}（{view.Stars}星）");
            sb.AppendLine($"最终分数：{report.FinalScore}");
            return sb.ToString();
        }
    }
}
