using System.Collections.Generic;
using UnityEngine;
using DecorMatch3.Core;
using DecorMatch3.Match3;
using DecorMatch3.Decoration;
using DecorMatch3.Data;
using DecorMatch3.UI;
using DecorMatch3.Utils;
using DecorMatch3.Progression;
using DecorMatch3.Scenes;

namespace DecorMatch3.GameFlow
{
    public enum PlayFlowState
    {
        MainMenu,
        OrderSelection,
        Match3Level,
        DecorationStudio,
        OrderResult,
        ProgressionResult
    }

    public class GameFlowController : Singleton<GameFlowController>
    {
        private PlayFlowState _currentState;
        private DecorationOrder _currentOrder;
        private LevelData _currentLevel;
        private int _lastLevelScore;
        private int _lastLevelStars;
        private Dictionary<int, int> _lastLevelMaterials;
        private DecorationManager _currentDecorationManager;
        private OrderManager _orderManager;
        private DailyChallengeManager _dailyChallengeManager;
        private LeaderboardManager _leaderboardManager;

        public PlayFlowState CurrentState => _currentState;
        public DecorationOrder CurrentOrder => _currentOrder;
        public LevelData CurrentLevel => _currentLevel;
        public OrderManager OrderManager => _orderManager;
        public DailyChallengeManager DailyChallengeManager => _dailyChallengeManager;
        public LeaderboardManager LeaderboardManager => _leaderboardManager;

        protected override void Awake()
        {
            base.Awake();
            InitializeManagers();
        }

        private void Start()
        {
            GoToMainMenu();
        }

        private void InitializeManagers()
        {
            _orderManager = new OrderManager();
            _orderManager.RegisterOrders(DataManager.Instance.Orders);

            _dailyChallengeManager = new DailyChallengeManager();
            _dailyChallengeManager.RegisterChallenges(DataManager.Instance.DailyChallenges);

            _leaderboardManager = new LeaderboardManager();

            _currentState = PlayFlowState.MainMenu;
        }

        public void GoToMainMenu()
        {
            _currentState = PlayFlowState.MainMenu;
            GameBootstrap.SwitchSceneController<MainMenuSceneController>();
            GameManager.Instance?.ChangeState(GameState.MainMenu);
            UIManager.Instance?.ChangeState(UIState.MainMenu);
            UIManager.Instance?.ShowTopBar(true);
            UIManager.Instance?.ShowBottomBar(true);
            UIManager.Instance?.UpdateCurrencyDisplay();
        }

        public void GoToOrderSelection()
        {
            _currentState = PlayFlowState.OrderSelection;
            GameManager.Instance?.ChangeState(GameState.OrderManagement);
            UIManager.Instance?.ChangeState(UIState.OrderSelect);
        }

        public void SelectOrder(int orderId)
        {
            DecorationOrder order = DataManager.Instance.GetOrderById(orderId);
            if (order == null)
            {
                UIManager.Instance?.ShowToast("订单不存在");
                return;
            }

            _currentOrder = order;
            _orderManager.AcceptOrder(order);

            if (order.RequiredLevelIds != null && order.RequiredLevelIds.Length > 0)
            {
                int firstLevelId = order.RequiredLevelIds[0];
                StartLevel(firstLevelId);
            }
            else
            {
                StartDecoration(order);
            }
        }

        public void StartLevel(int levelId)
        {
            LevelData level = DataManager.Instance.GetLevelById(levelId);
            if (level == null)
            {
                UIManager.Instance?.ShowToast($"关卡 {levelId} 不存在");
                return;
            }

            _currentLevel = level;
            _currentState = PlayFlowState.Match3Level;
            GameBootstrap.SwitchSceneController<Match3SceneController>();
            GameManager.Instance?.ChangeState(GameState.Match3Level);
            UIManager.Instance?.ChangeState(UIState.Match3);
        }

        public void OnLevelComplete(int levelId, int stars, int score, int coins, Dictionary<int, int> materials)
        {
            _lastLevelScore = score;
            _lastLevelStars = stars;
            _lastLevelMaterials = materials ?? new Dictionary<int, int>();

            if (SaveSystem.Instance != null)
            {
                SaveSystem.Instance.AddCoins(coins);
            }

            UIManager.Instance?.UpdateCurrencyDisplay();
            _leaderboardManager?.SubmitScore(LeaderboardType.LevelScore, score, levelId, stars);

            if (_currentOrder != null)
            {
                StartDecoration(_currentOrder);
            }
            else
            {
                _currentState = PlayFlowState.ProgressionResult;
                UIManager.Instance?.ChangeState(UIState.Result);
            }
        }

        public void OnLevelFail(int levelId)
        {
            UIManager.Instance?.ShowDialog(
                "挑战失败",
                "要不要再试一次？材料不够可过不了关哦~",
                "重试",
                "返回",
                () => { StartLevel(levelId); },
                () => { GoToMainMenu(); });
        }

        public void StartDecoration(DecorationOrder order)
        {
            _currentOrder = order;
            _currentDecorationManager = new DecorationManager(order);
            _currentState = PlayFlowState.DecorationStudio;
            GameBootstrap.SwitchSceneController<DecorationSceneController>();
            GameManager.Instance?.ChangeState(GameState.Decoration);
            UIManager.Instance?.ChangeState(UIState.Decoration);
        }

        public void SubmitDecoration()
        {
            if (_currentDecorationManager == null) return;

            if (!_currentDecorationManager.AreAllRequiredSlotsFilled())
            {
                UIManager.Instance?.ShowDialog(
                    "还有必选项未完成",
                    "请先完成所有带*号的必选装修项目~",
                    "继续编辑");
                return;
            }

            ScoringSystem scoring = new ScoringSystem();
            ScoringResult result = scoring.Evaluate(_currentOrder, _currentDecorationManager);

            _orderManager.SubmitOrder();

            int coinsEarned = _currentOrder.BaseReward + result.Stars * _currentOrder.StarRewardMultiplier;
            int gemsEarned = result.Stars >= 4 ? _currentOrder.GemReward : 0;

            if (SaveSystem.Instance != null)
            {
                SaveSystem.Instance.AddCoins(coinsEarned);
                if (gemsEarned > 0) SaveSystem.Instance.AddGems(gemsEarned);
                SaveSystem.Instance.AddStars(result.Stars);
            }

            UIManager.Instance?.UpdateCurrencyDisplay();

            _leaderboardManager?.SubmitScore(LeaderboardType.OrderSatisfaction, result.CustomerSatisfaction, 0, result.Stars);
            _leaderboardManager?.SubmitScore(LeaderboardType.GlobalScore, result.TotalScore + _lastLevelScore);

            ShowOrderResult(result, coinsEarned, gemsEarned);
        }

        private void ShowOrderResult(ScoringResult result, int coins, int gems)
        {
            _currentState = PlayFlowState.OrderResult;
            GameManager.Instance?.ChangeState(GameState.MainMenu);
            UIManager.Instance?.ChangeState(UIState.Result);

            string feedback = $"客户评价：{GetStarDisplay(result.Stars)}\n\n" +
                              $"总评分：{result.TotalScore}/100\n" +
                              $"满意度：{result.CustomerSatisfaction}%\n\n" +
                              $"客户反应：\n{result.CustomerReaction}\n\n";

            if (result.PositiveFeedbacks.Count > 0)
            {
                feedback += "\n✅ 好评点：\n";
                foreach (string s in result.PositiveFeedbacks) feedback += $"• {s}\n";
            }

            if (result.NegativeFeedbacks.Count > 0)
            {
                feedback += "\n❌ 待改进：\n";
                foreach (string s in result.NegativeFeedbacks) feedback += $"• {s}\n";
            }

            feedback += $"\n\n💰 金币奖励：+{coins}\n";
            if (gems > 0) feedback += $"💎 宝石奖励：+{gems}\n";
            feedback += $"⭐ 获得星星：{result.Stars}\n";

            UIManager.Instance?.ShowDialog(
                $"订单完成 - {GetStarDisplay(result.Stars)}",
                feedback,
                "返回主菜单",
                null,
                () => { GoToMainMenu(); });
        }

        private string GetStarDisplay(int stars)
        {
            string s = "";
            for (int i = 0; i < 5; i++)
            {
                s += i < stars ? "★" : "☆";
            }
            return s;
        }

        public DecorationManager GetDecorationManager()
        {
            return _currentDecorationManager;
        }

        public Dictionary<int, int> GetLevelMaterials()
        {
            return _lastLevelMaterials ?? new Dictionary<int, int>();
        }

        public int GetLastLevelScore()
        {
            return _lastLevelScore;
        }

        public int GetLastLevelStars()
        {
            return _lastLevelStars;
        }
    }
}
