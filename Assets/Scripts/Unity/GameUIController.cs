using System.Text;
using UnityEngine;

namespace BalloonPost.Unity
{
    using BalloonPost.Core;
    using BalloonPost.Save;
    using BalloonPost.Tutorial;
    using BalloonPost.UI;

    public class GameUIController : MonoBehaviour
    {
        public GameBootstrap Bootstrap;
        public HexGridRenderer GridRenderer;

        [Header("面板引用 (可选)")]
        public GameObject TopBarPanel;
        public GameObject ForecastPanel;
        public GameObject ContractsPanel;
        public GameObject RouteScorePanel;
        public GameObject ActionPanel;
        public GameObject SettlementPanel;
        public GameObject TutorialPanel;

        private StringBuilder _logBuilder;

        private void Awake()
        {
            if (Bootstrap == null)
                Bootstrap = FindObjectOfType<GameBootstrap>();
            if (GridRenderer == null)
                GridRenderer = FindObjectOfType<HexGridRenderer>();

            _logBuilder = new StringBuilder();
        }

        private void Start()
        {
            if (Bootstrap?.Game != null)
            {
                BindGame();
            }
        }

        public void BindGame()
        {
            var game = Bootstrap.Game;
            if (GridRenderer != null)
            {
                GridRenderer.Initialize(game);
                GridRenderer.OnCellClicked += OnCellClicked;
                GridRenderer.UpdatePlayerPosition(game.Player.Position);
                GridRenderer.UpdateRouteVisual(game.Planner.CurrentPlan);
            }
            RefreshAllPanels();
        }

        private void OnCellClicked(AxialCoord coord)
        {
            var game = Bootstrap.Game;
            if (game == null || (game.Phase != GamePhase.Planning && game.Phase != GamePhase.Tutorial))
                return;

            bool added = game.Planner.TryAddStep(coord);
            if (added)
            {
                GridRenderer?.UpdateRouteVisual(game.Planner.CurrentPlan);
                RefreshRouteScorePanel();
            }
        }

        #region UI Actions

        public void OnClickExecutePlan()
        {
            var game = Bootstrap.Game;
            if (game == null) return;
            Log("执行航线...");
            bool ok = game.ExecutePlan();
            if (ok)
            {
                GridRenderer?.UpdatePlayerPosition(game.Player.Position);
                GridRenderer?.UpdateRouteVisual(game.Planner.CurrentPlan);
                RefreshAllPanels();
            }
        }

        public void OnClickUndo()
        {
            var game = Bootstrap.Game;
            if (game?.Planner == null) return;
            bool ok = game.Planner.Undo();
            if (ok)
            {
                GridRenderer?.UpdateRouteVisual(game.Planner.CurrentPlan);
                GridRenderer?.UpdatePlayerPosition(game.Player.Position);
                RefreshRouteScorePanel();
            }
            else
            {
                Log("没有可撤销的操作");
            }
        }

        public void OnClickClearRoute()
        {
            var game = Bootstrap.Game;
            if (game?.Planner == null) return;
            game.Planner.ClearPlan();
            GridRenderer?.UpdateRouteVisual(game.Planner.CurrentPlan);
            RefreshRouteScorePanel();
            Log("航线已清空");
        }

        public void OnClickRefuel()
        {
            var game = Bootstrap.Game;
            game?.TryRefuelAtPostOffice();
            RefreshStatusBar();
        }

        public void OnClickSave()
        {
            bool ok = Bootstrap?.SaveGame() ?? false;
            Log(ok ? "存档成功" : "存档失败");
        }

        public void OnClickShowScoreBreakdown()
        {
            var game = Bootstrap.Game;
            if (game?.Planner == null) return;
            var score = game.Planner.GetCurrentScore();
            Log(GetScoreBreakdownText(score));
        }

        public void OnClickShowForecast()
        {
            var game = Bootstrap.Game;
            if (game?.WindManager == null) return;
            Log(game.WindManager.GetForecastSummary());
        }

        public void OnClickRestartTutorial(int level)
        {
            Bootstrap?.StartTutorialLevel(level);
            BindGame();
            Log($"重新开始教程 {level}");
        }

        #endregion

        #region 面板刷新

        public void RefreshAllPanels()
        {
            RefreshStatusBar();
            RefreshForecastPanel();
            RefreshContractsPanel();
            RefreshRouteScorePanel();
            RefreshTutorialPanel();
        }

        public void RefreshStatusBar()
        {
            var game = Bootstrap.Game;
            if (game == null) return;
            var sb = new StringBuilder();
            sb.AppendLine("=== 🎈 热气球邮差 ===");
            sb.AppendLine($"回合：{game.TurnsElapsed} / {game.MaxTurns}");
            sb.AppendLine($"位置：{game.Player.Position}");
            sb.AppendLine($"燃料：{game.Player.Fuel} / {game.Player.MaxFuel}");
            sb.AppendLine($"金币：{game.Player.Money}");
            sb.AppendLine($"声望：{game.Player.Reputation}");
            sb.AppendLine($"阶段：{game.Phase}");
            sb.AppendLine($"待处理合同：{game.ContractManager.ActiveContracts.Count}");
            sb.Append($"已投递：{game.ContractManager.DeliveredContracts.Count}");
            Debug.Log(sb.ToString());
        }

        public void RefreshForecastPanel()
        {
            var game = Bootstrap.Game;
            if (game?.WindManager == null) return;
            Debug.Log(game.WindManager.GetForecastSummary());
        }

        public void RefreshContractsPanel()
        {
            var game = Bootstrap.Game;
            if (game?.ContractManager == null) return;

            var sb = new StringBuilder();
            sb.AppendLine("=== 📋 进行中的合同 ===");
            var active = game.ContractManager.GetSortedActive();
            if (active.Count == 0)
                sb.AppendLine("（暂无，去接一些合同吧！）");
            foreach (var c in active)
            {
                string tag = c.Type switch
                {
                    ContractType.TimeSensitive => "⏰[限时★★★]",
                    ContractType.Fragile => "🧸[易碎★★]",
                    _ => "✉[普通★]"
                };
                string turns = c.TurnsRemaining == int.MaxValue ? "∞" : c.TurnsRemaining.ToString();
                string status = c.Status switch
                {
                    ContractStatus.Accepted => "待取件",
                    ContractStatus.InTransit => "运输中",
                    _ => c.Status.ToString()
                };
                sb.AppendLine($"{tag} {c.FromTown}→{c.ToTown}");
                sb.AppendLine($"   奖励{c.BaseReward}金 | 剩余{turns}回合 | {status}");
                if (c.Type == ContractType.Fragile)
                    sb.AppendLine($"   损坏度: {c.CurrentDamage}/{c.FragilityLevel * 2}");
            }

            var pending = game.ContractManager.GetSortedPending();
            if (pending.Count > 0)
            {
                sb.AppendLine($"\n=== 可接合同 ({pending.Count}) ===");
                foreach (var c in pending)
                {
                    sb.AppendLine($"  {c.Description} ({c.BaseReward}金)");
                }
            }
            Debug.Log(sb.ToString());
        }

        public void RefreshRouteScorePanel()
        {
            var game = Bootstrap.Game;
            if (game?.Planner == null) return;

            var plan = game.Planner.CurrentPlan;
            var score = game.Planner.GetCurrentScore();
            var sb = new StringBuilder();

            sb.AppendLine("=== 🗺️ 航线规划 ===");
            sb.AppendLine($"步数：{plan.Steps.Count} | 总燃料：{plan.TotalFuelCost} | 已锁定：{plan.LockedStepCount}");
            if (plan.Steps.Count > 0)
            {
                sb.AppendLine($"终点：{plan.CurrentEndPosition}");
                sb.AppendLine($"终点距离邮局：{plan.CurrentEndPosition.DistanceTo(AxialCoord.Zero)} 格");
            }
            sb.AppendLine("");
            sb.Append(GetScoreBreakdownText(score));

            Debug.Log(sb.ToString());
        }

        public string GetScoreBreakdownText(RouteScoreBreakdown score)
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== ⭐ 路线评分明细 ===");
            sb.AppendLine($"总分：{score.TotalScore}");
            sb.AppendLine($"  路径效率：{score.DistanceEfficiencyScore,+5} | {score.DistanceExplanation}");
            sb.AppendLine($"  合同优先级：{score.PriorityScore,+5}");
            if (!string.IsNullOrEmpty(score.PriorityExplanation))
                sb.AppendLine($"    {score.PriorityExplanation.Replace("\n", "\n    ")}");
            sb.AppendLine($"  燃油效率：{score.FuelEfficiencyScore,+5}");
            if (score.OnTimeScore != 0)
                sb.AppendLine($"  准时奖励：{score.OnTimeScore,+5} | {score.OnTimeExplanation}");
            if (score.FragilityScore != 0)
                sb.AppendLine($"  完好奖励：{score.FragilityScore,+5}");
            if (score.ComboBonus > 0)
                sb.AppendLine($"  顺风连击：{score.ComboBonus,+5}");
            if (score.Penalties != 0)
                sb.AppendLine($"  惩罚：{score.Penalties,+5}");
            return sb.ToString();
        }

        public void RefreshTutorialPanel()
        {
            var game = Bootstrap.Game;
            var tut = Bootstrap.Tutorial;
            if (game == null || tut == null || tut.CurrentStep == null) return;

            var sb = new StringBuilder();
            sb.AppendLine($"\n=== 📚 {tut.CurrentStep.Title} ({tut.GetProgressText()}) ===");
            sb.AppendLine(tut.CurrentStep.Description);
            if (!string.IsNullOrEmpty(tut.CurrentStep.Hint))
            {
                sb.AppendLine($"\n💡 {tut.CurrentStep.Hint}");
            }
            Debug.Log(sb.ToString());
        }

        #endregion

        public void Log(string message)
        {
            Debug.Log($"[UI] {message}");
        }
    }
}
