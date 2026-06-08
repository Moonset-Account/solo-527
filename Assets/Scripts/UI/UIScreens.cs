using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
using YouthTrainingManagement.Audio;
using YouthTrainingManagement.Core;
using YouthTrainingManagement.Models;
using YouthTrainingManagement.Systems;
using YouthTrainingManagement.InputSystem;

namespace YouthTrainingManagement.UI
{
    public static class UIUtils
    {
        public static readonly Color ColorSuccess = new Color(0.2f, 0.8f, 0.3f);
        public static readonly Color ColorWarning = new Color(1f, 0.78f, 0.2f);
        public static readonly Color ColorError = new Color(0.9f, 0.25f, 0.2f);
        public static readonly Color ColorInfo = new Color(0.2f, 0.6f, 1f);
        public static readonly Color ColorPanel = new Color(0.08f, 0.1f, 0.15f, 0.95f);
        public static readonly Color ColorPanelLight = new Color(0.15f, 0.18f, 0.25f, 0.95f);
        public static readonly Color ColorAccent = new Color(0.3f, 0.7f, 1f);
        public static readonly Color ColorText = new Color(0.95f, 0.95f, 0.95f);
        public static readonly Color ColorTextDim = new Color(0.7f, 0.7f, 0.75f);

        public static GameObject CreatePanel(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax,
            Vector2 offsetMin, Vector2 offsetMax, Color color)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = offsetMin;
            rt.offsetMax = offsetMax;
            var img = go.AddComponent<Image>();
            img.color = color;
            img.sprite = CreateRoundedSprite();
            img.type = Image.Type.Sliced;
            return go;
        }

        public static Text CreateText(string name, Transform parent, string text, int fontSize,
            TextAnchor anchor, Color color, Vector2 anchorMin, Vector2 anchorMax,
            Vector2 offsetMin, Vector2 offsetMax, FontStyle style = FontStyle.Normal)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = offsetMin;
            rt.offsetMax = offsetMax;
            var txt = go.AddComponent<Text>();
            txt.text = text;
            txt.fontSize = fontSize;
            txt.alignment = anchor;
            txt.color = color;
            txt.fontStyle = style;
            txt.horizontalOverflow = HorizontalWrapMode.Overflow;
            txt.verticalOverflow = VerticalWrapMode.Overflow;
            try { txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"); } catch { }
            return txt;
        }

        public static Button CreateButton(string name, Transform parent, string text, Vector2 anchorMin,
            Vector2 anchorMax, Vector2 offsetMin, Vector2 offsetMax, Action onClick,
            Color? bgColor = null, Color? textColor = null, int fontSize = 18)
        {
            var bg = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Button));
            bg.transform.SetParent(parent, false);
            var rt = (RectTransform)bg.transform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = offsetMin;
            rt.offsetMax = offsetMax;
            var img = bg.GetComponent<Image>();
            img.color = bgColor ?? ColorAccent;
            img.sprite = CreateRoundedSprite();
            img.type = Image.Type.Sliced;

            var colors = bg.GetComponent<Button>().colors;
            colors.normalColor = bgColor ?? ColorAccent;
            colors.highlightedColor = (bgColor ?? ColorAccent) * 1.2f;
            colors.pressedColor = (bgColor ?? ColorAccent) * 0.8f;
            colors.selectedColor = colors.highlightedColor;
            bg.GetComponent<Button>().colors = colors;

            var txt = CreateText("Text", bg.transform, text, fontSize, TextAnchor.MiddleCenter,
                textColor ?? Color.white, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, FontStyle.Bold);

            bg.GetComponent<Button>().onClick.AddListener(() =>
            {
                GameManager.Instance?.AudioManager?.PlaySound(YouthTrainingManagement.Audio.SoundType.ButtonPress);
                onClick?.Invoke();
            });

            return bg.GetComponent<Button>();
        }

        public static GameObject CreateProgressBar(Transform parent, Vector2 anchorMin, Vector2 anchorMax,
            Vector2 offsetMin, Vector2 offsetMax, float value01, Color fillColor, string label = null)
        {
            var container = new GameObject("ProgressBar", typeof(RectTransform));
            container.transform.SetParent(parent, false);
            var rt = (RectTransform)container.transform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = offsetMin;
            rt.offsetMax = offsetMax;

            var bg = new GameObject("BG", typeof(RectTransform), typeof(Image));
            bg.transform.SetParent(container.transform, false);
            var bgRt = (RectTransform)bg.transform;
            bgRt.anchorMin = Vector2.zero;
            bgRt.anchorMax = Vector2.one;
            bgRt.offsetMin = Vector2.zero;
            bgRt.offsetMax = Vector2.zero;
            var bgImg = bg.GetComponent<Image>();
            bgImg.color = new Color(0f, 0f, 0f, 0.5f);
            bgImg.sprite = CreateRoundedSprite();
            bgImg.type = Image.Type.Sliced;

            var fill = new GameObject("Fill", typeof(RectTransform), typeof(Image));
            fill.transform.SetParent(container.transform, false);
            var fillRt = (RectTransform)fill.transform;
            fillRt.anchorMin = Vector2.zero;
            fillRt.anchorMax = new Vector2(Math.Clamp(value01, 0f, 1f), 1f);
            fillRt.offsetMin = Vector2.zero;
            fillRt.offsetMax = Vector2.zero;
            var fillImg = fill.GetComponent<Image>();
            fillImg.color = fillColor;
            fillImg.sprite = CreateRoundedSprite();
            fillImg.type = Image.Type.Sliced;

            if (!string.IsNullOrEmpty(label))
            {
                CreateText("Label", container.transform, label, 12, TextAnchor.MiddleLeft,
                    Color.white, Vector2.zero, Vector2.one, new Vector2(8, 0), Vector2.zero);
            }

            return container;
        }

        public static Sprite CreateRoundedSprite()
        {
            var tex = new Texture2D(8, 8, TextureFormat.RGBA32, false);
            var fill = new Color(1, 1, 1, 1);
            var clear = new Color(0, 0, 0, 0);
            for (int x = 0; x < 8; x++)
            {
                for (int y = 0; y < 8; y++)
                {
                    bool corner = (x < 2 && y < 2) || (x >= 6 && y < 2) || (x < 2 && y >= 6) || (x >= 6 && y >= 6);
                    bool innerCorner = (x < 1 && y < 1) || (x >= 7 && y < 1) || (x < 1 && y >= 7) || (x >= 7 && y >= 7);
                    tex.SetPixel(x, y, innerCorner ? clear : (corner ? new Color(1, 1, 1, 0.5f) : fill));
                }
            }
            tex.Apply();
            tex.wrapMode = TextureWrapMode.Clamp;
            var sprite = Sprite.Create(tex, new Rect(0, 0, 8, 8), new Vector2(0.5f, 0.5f), 8f, 0,
                SpriteMeshType.FullRect, new Vector4(2, 2, 2, 2));
            return sprite;
        }

        public static Color GetRiskColor(float value01)
        {
            if (value01 < 0.3f) return ColorSuccess;
            if (value01 < 0.6f) return ColorWarning;
            return ColorError;
        }
    }

    public class DashboardScreen : UIScreenBase
    {
        private Text _weekText, _phaseText, _positionText, _pointsText;
        private Text _balanceText, _teamRatingText, _readinessText, _injuryCountText;
        private Transform _playerCardsContainer;
        private Transform _nextMatchContainer;

        protected override void CreateUI()
        {
            ScreenRoot = UIUtils.CreatePanel("Dashboard", ParentTransform,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0.05f, 0.07f, 0.1f, 1f));

            var topBar = UIUtils.CreatePanel("TopBar", ScreenRoot.transform,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -80), Vector2.zero,
                UIUtils.ColorPanelLight);

            UIUtils.CreateText("Title", topBar.transform, "YOUTH TRAINING MANAGER", 28,
                TextAnchor.MiddleLeft, UIUtils.ColorAccent,
                new Vector2(0, 0), new Vector2(0.3f, 1), new Vector2(24, 0), Vector2.zero, FontStyle.Bold);

            _weekText = UIUtils.CreateText("Week", topBar.transform, "Week 1", 20,
                TextAnchor.MiddleCenter, UIUtils.ColorText,
                new Vector2(0.3f, 0), new Vector2(0.45f, 1), Vector2.zero, Vector2.zero, FontStyle.Bold);

            _phaseText = UIUtils.CreateText("Phase", topBar.transform, "Morning", 16,
                TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                new Vector2(0.45f, 0), new Vector2(0.55f, 1), Vector2.zero, Vector2.zero);

            _positionText = UIUtils.CreateText("Position", topBar.transform, "4th", 20,
                TextAnchor.MiddleCenter, UIUtils.ColorWarning,
                new Vector2(0.55f, 0), new Vector2(0.7f, 1), Vector2.zero, Vector2.zero, FontStyle.Bold);

            _pointsText = UIUtils.CreateText("Points", topBar.transform, "0 pts", 18,
                TextAnchor.MiddleCenter, UIUtils.ColorText,
                new Vector2(0.7f, 0), new Vector2(0.8f, 1), Vector2.zero, Vector2.zero);

            UIUtils.CreateButton("BtnSettings", topBar.transform, "⚙ Settings",
                new Vector2(0.8f, 0.15f), new Vector2(0.9f, 0.85f), Vector2.zero, Vector2.zero,
                () => GameManager.OpenSettings(), new Color(0.25f, 0.3f, 0.4f));

            UIUtils.CreateButton("BtnPause", topBar.transform, "⏸ Pause",
                new Vector2(0.9f, 0.15f), new Vector2(0.99f, 0.85f), Vector2.zero, Vector2.zero,
                () => GameManager.PauseGame(), UIUtils.ColorWarning);

            var leftPanel = UIUtils.CreatePanel("LeftPanel", ScreenRoot.transform,
                new Vector2(0, 0), new Vector2(0.35f, 1), new Vector2(16, 96), new Vector2(-8, -16),
                UIUtils.ColorPanel);

            UIUtils.CreateText("StatTitle", leftPanel.transform, "CLUB STATUS", 16,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, -36), Vector2.zero, FontStyle.Bold);

            _teamRatingText = UIUtils.CreateText("TeamRating", leftPanel.transform, "Team Rating: 55", 20,
                TextAnchor.MiddleLeft, UIUtils.ColorText,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, -80), Vector2.zero, FontStyle.Bold);

            _readinessText = UIUtils.CreateText("Readiness", leftPanel.transform, "Match Readiness: 70%", 16,
                TextAnchor.MiddleLeft, UIUtils.ColorText,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, -110), Vector2.zero);

            _injuryCountText = UIUtils.CreateText("Injuries", leftPanel.transform, "Injuries: 0", 16,
                TextAnchor.MiddleLeft, UIUtils.ColorSuccess,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, -140), Vector2.zero);

            _balanceText = UIUtils.CreateText("Balance", leftPanel.transform, "💰 $50,000", 24,
                TextAnchor.MiddleLeft, UIUtils.ColorSuccess,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, -200), Vector2.zero, FontStyle.Bold);

            UIUtils.CreateText("NavTitle", leftPanel.transform, "QUICK ACTIONS", 16,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 0.7f), new Vector2(1, 0.7f), new Vector2(20, -30), Vector2.zero, FontStyle.Bold);

            UIUtils.CreateButton("BtnTraining", leftPanel.transform, "🏋 TRAINING",
                new Vector2(0.05f, 0.5f), new Vector2(0.95f, 0.62f), Vector2.zero, Vector2.zero,
                () => GameManager.StartTraining(), new Color(0.2f, 0.5f, 0.9f)).gameObject.name = "btn_training";

            UIUtils.CreateButton("BtnRecovery", leftPanel.transform, "💊 RECOVERY",
                new Vector2(0.05f, 0.38f), new Vector2(0.95f, 0.50f), Vector2.zero, Vector2.zero,
                () => GameManager.StartRecovery(), new Color(0.2f, 0.7f, 0.4f)).gameObject.name = "btn_recovery";

            UIUtils.CreateButton("BtnMatch", leftPanel.transform, "⚽ NEXT MATCH",
                new Vector2(0.05f, 0.26f), new Vector2(0.95f, 0.38f), Vector2.zero, Vector2.zero,
                () => GameManager.StartMatch(), new Color(0.85f, 0.35f, 0.25f)).gameObject.name = "btn_match";

            UIUtils.CreateButton("BtnSquad", leftPanel.transform, "👥 SQUAD",
                new Vector2(0.05f, 0.16f), new Vector2(0.47f, 0.26f), Vector2.zero, Vector2.zero,
                () => GameManager.UIManager.ShowScreen(UIScreen.Squad), new Color(0.4f, 0.3f, 0.7f));

            UIUtils.CreateButton("BtnFixtures", leftPanel.transform, "📅 FIXTURES",
                new Vector2(0.53f, 0.16f), new Vector2(0.95f, 0.26f), Vector2.zero, Vector2.zero,
                () => GameManager.UIManager.ShowScreen(UIScreen.Fixtures), new Color(0.5f, 0.4f, 0.2f));

            UIUtils.CreateButton("BtnAdvance", leftPanel.transform, "⏭ ADVANCE PHASE (SPACE)",
                new Vector2(0.05f, 0.03f), new Vector2(0.95f, 0.13f), Vector2.zero, Vector2.zero,
                () => GameManager.AdvanceDayPhase(), new Color(0.6f, 0.4f, 0.8f),
                fontSize: 16);

            var rightPanel = UIUtils.CreatePanel("RightPanel", ScreenRoot.transform,
                new Vector2(0.35f, 0), new Vector2(1, 1), new Vector2(8, 96), new Vector2(-16, -16),
                UIUtils.ColorPanel);

            _nextMatchContainer = UIUtils.CreatePanel("NextMatch", rightPanel.transform,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -150), new Vector2(-16, -16),
                UIUtils.ColorPanelLight).transform;

            UIUtils.CreateText("NextMatchTitle", _nextMatchContainer, "NEXT MATCH", 14,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -24), Vector2.zero, FontStyle.Bold);

            var playerListHeader = UIUtils.CreatePanel("SquadHeader", rightPanel.transform,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -220), new Vector2(-16, -166),
                UIUtils.ColorPanelLight);

            UIUtils.CreateText("SquadTitle", playerListHeader.transform, "SQUAD STATUS", 14,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 0), new Vector2(1, 1), new Vector2(16, 0), Vector2.zero, FontStyle.Bold);

            _playerCardsContainer = new GameObject("PlayerCards", typeof(RectTransform)).transform;
            _playerCardsContainer.SetParent(rightPanel.transform, false);
            var prt = (RectTransform)_playerCardsContainer;
            prt.anchorMin = new Vector2(0, 0);
            prt.anchorMax = new Vector2(1, 1);
            prt.offsetMin = new Vector2(16, 16);
            prt.offsetMax = new Vector2(-16, -230);
        }

        public override void RefreshData()
        {
            if (GameManager?.Season == null) return;
            var s = GameManager.Season;
            if (_weekText != null) _weekText.text = $"Week {s.CurrentWeek} / {s.TotalWeeks}";
            if (_phaseText != null) _phaseText.text = $"• {s.CurrentPhase}";
            if (_positionText != null)
            {
                string ord = "";
                switch (s.LeaguePosition)
                {
                    case 1: ord = "1st"; break;
                    case 2: ord = "2nd"; break;
                    case 3: ord = "3rd"; break;
                    default: ord = $"{s.LeaguePosition}th"; break;
                }
                _positionText.text = ord;
                _positionText.color = s.LeaguePosition <= 2 ? UIUtils.ColorSuccess :
                    s.LeaguePosition <= 4 ? UIUtils.ColorWarning : UIUtils.ColorError;
            }
            if (_pointsText != null) _pointsText.text = $"{s.Points} pts";

            if (_teamRatingText != null)
                _teamRatingText.text = $"Team Rating: {GameManager.PlayerSystem.CalculateTeamOverall():0}";
            if (_readinessText != null)
            {
                float r = GameManager.PlayerSystem.CalculateTeamReadiness();
                _readinessText.text = $"Match Readiness: {r:0}%";
                _readinessText.color = UIUtils.GetRiskColor(1f - r / 100f);
            }
            int inj = GameManager.PlayerSystem.GetInjuryCount();
            if (_injuryCountText != null)
            {
                _injuryCountText.text = $"Injuries: {inj}";
                _injuryCountText.color = inj == 0 ? UIUtils.ColorSuccess : inj < 3 ? UIUtils.ColorWarning : UIUtils.ColorError;
            }
            if (_balanceText != null)
            {
                float bal = GameManager.Finance.CurrentBalance;
                _balanceText.text = $"💰 ${bal:0,0}";
                _balanceText.color = bal < GameManager.Config.GameConfig.WeeklyBudget * 2 ? UIUtils.ColorWarning : UIUtils.ColorSuccess;
            }

            RebuildNextMatch();
            RebuildSquadList();
        }

        private void RebuildNextMatch()
        {
            if (_nextMatchContainer == null) return;
            for (int i = _nextMatchContainer.childCount - 1; i >= 2; i--)
                Destroy(_nextMatchContainer.GetChild(i).gameObject);

            var next = GameManager.MatchSystem.PreviewNextMatch();
            if (next == null)
            {
                UIUtils.CreateText("NoMatch", _nextMatchContainer,
                    "Season Complete! No more matches scheduled.",
                    16, TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                    new Vector2(0, 0), new Vector2(1, 1), new Vector2(16, 0), new Vector2(-16, 0));
                return;
            }

            UIUtils.CreateText("Opponent", _nextMatchContainer,
                $"{(next.IsHomeMatch ? "🏠 vs " : "✈️ @ ")}{next.OpponentName}",
                20, TextAnchor.MiddleLeft, UIUtils.ColorText,
                new Vector2(0, 0.5f), new Vector2(0.7f, 1f), new Vector2(16, 0), Vector2.zero, FontStyle.Bold);

            UIUtils.CreateText("Difficulty", _nextMatchContainer,
                $"Difficulty: {next.DifficultyRating}",
                14, TextAnchor.MiddleLeft,
                UIUtils.GetRiskColor(next.DifficultyRating / 100f),
                new Vector2(0, 0f), new Vector2(0.5f, 0.5f), new Vector2(16, 0), Vector2.zero);

            UIUtils.CreateText("Week", _nextMatchContainer,
                $"Week {next.WeekNumber}",
                14, TextAnchor.MiddleRight, UIUtils.ColorTextDim,
                new Vector2(0.5f, 0.5f), new Vector2(1f, 1f), Vector2.zero, new Vector2(-16, 0));

            UIUtils.CreateText("Prize", _nextMatchContainer,
                $"Prize: ${next.PrizeMoney:0,0}",
                14, TextAnchor.MiddleRight, UIUtils.ColorWarning,
                new Vector2(0.5f, 0f), new Vector2(1f, 0.5f), Vector2.zero, new Vector2(-16, 0));
        }

        private void RebuildSquadList()
        {
            if (_playerCardsContainer == null) return;
            for (int i = _playerCardsContainer.childCount - 1; i >= 0; i--)
                Destroy(_playerCardsContainer.GetChild(i).gameObject);

            var players = GameManager.PlayerSystem.GetAllPlayers();
            float rowH = 52f;
            int idx = 0;
            var parentRT = _playerCardsContainer as RectTransform;
            float totalH = players.Count * (rowH + 6f);
            parentRT.sizeDelta = new Vector2(0, totalH);

            foreach (var p in players)
            {
                float y = -idx * (rowH + 6f);
                var card = UIUtils.CreatePanel($"P_{p.Id}", _playerCardsContainer,
                    new Vector2(0, 1), new Vector2(1, 1),
                    new Vector2(0, y - rowH), new Vector2(0, y),
                    p.CurrentInjury != InjurySeverity.None
                        ? new Color(0.3f, 0.15f, 0.15f, 0.8f)
                        : new Color(0.15f, 0.2f, 0.28f, 0.8f));

                UIUtils.CreateText("Name", card.transform,
                    $"#{p.JerseyNumber} {p.Name}", 14,
                    TextAnchor.MiddleLeft, UIUtils.ColorText,
                    new Vector2(0, 0), new Vector2(0.3f, 0.6f), new Vector2(8, 0), Vector2.zero, FontStyle.Bold);

                UIUtils.CreateText("Pos", card.transform,
                    p.Position.ToString(), 10,
                    TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                    new Vector2(0, 0.6f), new Vector2(0.3f, 1f), new Vector2(8, 0), Vector2.zero);

                var statColor = UIUtils.GetRiskColor(1f - p.MatchReadiness / 100f);
                UIUtils.CreateText("Rating", card.transform,
                    p.CurrentStats.GetOverallRating().ToString("0"), 18,
                    TextAnchor.MiddleCenter, statColor,
                    new Vector2(0.3f, 0), new Vector2(0.4f, 1f), Vector2.zero, Vector2.zero, FontStyle.Bold);

                UIUtils.CreateProgressBar(card.transform,
                    new Vector2(0.42f, 0.55f), new Vector2(0.72f, 0.85f),
                    Vector2.zero, Vector2.zero, p.Fatigue / 100f,
                    UIUtils.GetRiskColor(p.Fatigue / 100f),
                    $"Fatigue {p.Fatigue:0}%");

                UIUtils.CreateProgressBar(card.transform,
                    new Vector2(0.42f, 0.15f), new Vector2(0.72f, 0.45f),
                    Vector2.zero, Vector2.zero, p.Morale / 100f,
                    UIUtils.GetRiskColor(1f - p.Morale / 100f),
                    $"Morale {p.Morale:0}%");

                string injuryTxt = p.CurrentInjury != InjurySeverity.None
                    ? $"{p.CurrentInjury} ({p.InjuryDaysRemaining}d)"
                    : $"Injury Risk: {p.InjuryRisk:0}%";
                UIUtils.CreateText("Injury", card.transform, injuryTxt, 12,
                    TextAnchor.MiddleCenter,
                    p.CurrentInjury != InjurySeverity.None ? UIUtils.ColorError : UIUtils.GetRiskColor(p.InjuryRisk / 100f),
                    new Vector2(0.74f, 0), new Vector2(0.95f, 1f), Vector2.zero, Vector2.zero);

                idx++;
            }
        }

        public override void UpdateTimeDisplay()
        {
            if (GameManager?.Season == null) return;
            RefreshData();
        }
    }

    public class TrainingScreen : UIScreenBase
    {
        private string _selectedDrillId;
        private readonly List<string> _selectedPlayers = new List<string>();
        private Transform _drillContainer, _playerContainer, _previewContainer;

        protected override void CreateUI()
        {
            ScreenRoot = UIUtils.CreatePanel("TrainingScreen", ParentTransform,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0.05f, 0.07f, 0.1f, 1f));

            UIUtils.CreateText("Title", ScreenRoot.transform, "🏋 TRAINING CENTER", 32,
                TextAnchor.MiddleCenter, UIUtils.ColorAccent,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -56), Vector2.zero, FontStyle.Bold);

            UIUtils.CreateButton("BtnBack", ScreenRoot.transform, "← BACK",
                new Vector2(0.02f, 1f), new Vector2(0.12f, 1f),
                new Vector2(0, -64), new Vector2(0, -16),
                () =>
                {
                    GameManager.StateMachine.GetState<TrainingState>()?.CompleteTraining();
                    GameManager.UIManager.ShowScreen(UIScreen.Dashboard);
                }, new Color(0.3f, 0.35f, 0.45f), fontSize: 16);

            _drillContainer = UIUtils.CreatePanel("DrillPanel", ScreenRoot.transform,
                new Vector2(0, 0), new Vector2(0.35f, 1),
                new Vector2(16, 96), new Vector2(-8, -16),
                UIUtils.ColorPanel).transform;

            UIUtils.CreateText("DrillTitle", _drillContainer, "SELECT DRILL", 16,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, -36), Vector2.zero, FontStyle.Bold);

            _playerContainer = UIUtils.CreatePanel("PlayerPanel", ScreenRoot.transform,
                new Vector2(0.35f, 0), new Vector2(0.7f, 1),
                new Vector2(8, 96), new Vector2(-8, -16),
                UIUtils.ColorPanel).transform;

            UIUtils.CreateText("PlayerTitle", _playerContainer, "SELECT PLAYERS", 16,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(0.5f, 1), new Vector2(20, -36), Vector2.zero, FontStyle.Bold);

            UIUtils.CreateButton("BtnAll", _playerContainer, "ALL",
                new Vector2(0.5f, 1f), new Vector2(0.7f, 1f),
                new Vector2(0, -60), new Vector2(-8, -12),
                () =>
                {
                    GameManager.PlayerSystem.SetAllSelection(true);
                    _selectedPlayers.Clear();
                    foreach (var p in GameManager.PlayerSystem.GetAvailablePlayers())
                        _selectedPlayers.Add(p.Id);
                    RefreshData();
                }, new Color(0.2f, 0.5f, 0.7f), fontSize: 14);

            UIUtils.CreateButton("BtnClear", _playerContainer, "CLEAR",
                new Vector2(0.7f, 1f), new Vector2(0.9f, 1f),
                new Vector2(8, -60), new Vector2(0, -12),
                () =>
                {
                    GameManager.PlayerSystem.SetAllSelection(false);
                    _selectedPlayers.Clear();
                    RefreshData();
                }, new Color(0.5f, 0.3f, 0.3f), fontSize: 14);

            _previewContainer = UIUtils.CreatePanel("PreviewPanel", ScreenRoot.transform,
                new Vector2(0.7f, 0), new Vector2(1, 1),
                new Vector2(8, 96), new Vector2(-16, -16),
                UIUtils.ColorPanel).transform;

            UIUtils.CreateButton("BtnStart", _previewContainer, "▶ START TRAINING",
                new Vector2(0.05f, 0.03f), new Vector2(0.95f, 0.13f),
                Vector2.zero, Vector2.zero, ExecuteTraining,
                new Color(0.2f, 0.7f, 0.3f), fontSize: 20);
        }

        public override void RefreshData()
        {
            RebuildDrillList();
            RebuildPlayerList();
            RebuildPreview();
        }

        private void RebuildDrillList()
        {
            if (_drillContainer == null) return;
            for (int i = _drillContainer.childCount - 1; i >= 2; i--)
                Destroy(_drillContainer.GetChild(i).gameObject);

            var drills = GameManager.TrainingSystem.GetAvailableDrills();
            float y = -56f;
            foreach (var d in drills)
            {
                bool selected = _selectedDrillId == d.DrillId;
                var card = UIUtils.CreatePanel($"Drill_{d.DrillId}", _drillContainer,
                    new Vector2(0, 1), new Vector2(1, 1),
                    new Vector2(12, y - 130), new Vector2(-12, y),
                    selected ? new Color(0.25f, 0.4f, 0.6f, 0.95f) : UIUtils.ColorPanelLight);

                var btn = card.gameObject.AddComponent<Button>();
                btn.onClick.AddListener(() =>
                {
                    _selectedDrillId = d.DrillId;
                    RefreshData();
                });
                var colors = btn.colors;
                colors.normalColor = Color.white;
                colors.highlightedColor = new Color(1f, 1f, 1f, 0.05f);
                colors.pressedColor = new Color(0.5f, 0.5f, 0.5f, 0.1f);
                btn.colors = colors;
                btn.targetGraphic = card.GetComponent<Image>();

                UIUtils.CreateText("Name", card.transform, d.Name, 16,
                    TextAnchor.MiddleLeft, UIUtils.ColorText,
                    new Vector2(0, 0.75f), new Vector2(1, 1f), new Vector2(12, 0), Vector2.zero, FontStyle.Bold);

                UIUtils.CreateText("Type", card.transform, d.Type.ToString(), 11,
                    TextAnchor.MiddleLeft, UIUtils.ColorAccent,
                    new Vector2(0, 0.6f), new Vector2(1, 0.8f), new Vector2(12, 0), Vector2.zero);

                UIUtils.CreateText("Desc", card.transform, d.Description, 11,
                    TextAnchor.UpperLeft, UIUtils.ColorTextDim,
                    new Vector2(0, 0.15f), new Vector2(1, 0.6f), new Vector2(12, 2), new Vector2(-12, 0));

                UIUtils.CreateText("Cost", card.transform, $"${d.BaseCost:0}", 13,
                    TextAnchor.MiddleLeft, UIUtils.ColorWarning,
                    new Vector2(0, 0), new Vector2(0.4f, 0.2f), new Vector2(12, 0), Vector2.zero, FontStyle.Bold);

                UIUtils.CreateText("Fatigue", card.transform,
                    $"{(d.FatiguePerPlayer > 0 ? "+" : "")}{d.FatiguePerPlayer:0} Fatigue", 11,
                    TextAnchor.MiddleRight,
                    d.FatiguePerPlayer > 0 ? UIUtils.ColorWarning : UIUtils.ColorSuccess,
                    new Vector2(0.4f, 0), new Vector2(0.8f, 0.2f), Vector2.zero, Vector2.zero);

                UIUtils.CreateText("Success", card.transform, $"{d.SuccessRate * 100:0}%", 12,
                    TextAnchor.MiddleRight, UIUtils.ColorInfo,
                    new Vector2(0.8f, 0), new Vector2(1, 0.2f), Vector2.zero, new Vector2(-8, 0));

                y -= 142f;
            }
        }

        private void RebuildPlayerList()
        {
            if (_playerContainer == null) return;
            for (int i = _playerContainer.childCount - 1; i >= 4; i--)
                Destroy(_playerContainer.GetChild(i).gameObject);

            var players = GameManager.PlayerSystem.GetAllPlayers();
            float y = -80f;
            foreach (var p in players)
            {
                bool selected = p.IsSelected;
                bool injured = p.CurrentInjury != InjurySeverity.None;

                var card = UIUtils.CreatePanel($"P_{p.Id}", _playerContainer,
                    new Vector2(0, 1), new Vector2(1, 1),
                    new Vector2(12, y - 62), new Vector2(-12, y),
                    injured ? new Color(0.25f, 0.1f, 0.1f, 0.8f) :
                    selected ? new Color(0.25f, 0.45f, 0.3f, 0.8f) :
                    new Color(0.15f, 0.18f, 0.25f, 0.8f));

                var btn = card.gameObject.AddComponent<Button>();
                btn.onClick.AddListener(() =>
                {
                    if (injured) return;
                    GameManager.PlayerSystem.TogglePlayerSelection(p.Id);
                    if (p.IsSelected) _selectedPlayers.Add(p.Id);
                    else _selectedPlayers.Remove(p.Id);
                    RefreshData();
                });
                var colors = btn.colors;
                colors.normalColor = Color.white;
                colors.highlightedColor = new Color(1f, 1f, 1f, 0.08f);
                colors.pressedColor = new Color(0.5f, 0.5f, 0.5f, 0.1f);
                btn.colors = colors;
                btn.targetGraphic = card.GetComponent<Image>();

                UIUtils.CreateText("Check", card.transform, selected ? "✓" : injured ? "⛑" : "", 20,
                    TextAnchor.MiddleCenter,
                    selected ? UIUtils.ColorSuccess : injured ? UIUtils.ColorError : UIUtils.ColorTextDim,
                    new Vector2(0, 0), new Vector2(0.1f, 1f), Vector2.zero, Vector2.zero, FontStyle.Bold);

                UIUtils.CreateText("Name", card.transform, $"#{p.JerseyNumber} {p.Name}", 13,
                    TextAnchor.MiddleLeft, injured ? UIUtils.ColorTextDim : UIUtils.ColorText,
                    new Vector2(0.1f, 0.5f), new Vector2(0.5f, 1f), new Vector2(4, 0), Vector2.zero, FontStyle.Bold);

                UIUtils.CreateText("Pos", card.transform, p.Position.ToString(), 10,
                    TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                    new Vector2(0.1f, 0), new Vector2(0.5f, 0.5f), new Vector2(4, 0), Vector2.zero);

                UIUtils.CreateText("Rating", card.transform, p.CurrentStats.GetOverallRating().ToString("0"), 16,
                    TextAnchor.MiddleCenter,
                    injured ? UIUtils.ColorTextDim : UIUtils.ColorAccent,
                    new Vector2(0.5f, 0), new Vector2(0.65f, 1f), Vector2.zero, Vector2.zero, FontStyle.Bold);

                UIUtils.CreateProgressBar(card.transform,
                    new Vector2(0.68f, 0.55f), new Vector2(1f, 0.9f),
                    new Vector2(-8, 0), new Vector2(-8, 0),
                    p.Fatigue / 100f, UIUtils.GetRiskColor(p.Fatigue / 100f), $"F {p.Fatigue:0}%");

                UIUtils.CreateProgressBar(card.transform,
                    new Vector2(0.68f, 0.1f), new Vector2(1f, 0.45f),
                    new Vector2(-8, 0), new Vector2(-8, 0),
                    p.InjuryRisk / 100f, UIUtils.GetRiskColor(p.InjuryRisk / 100f), $"R {p.InjuryRisk:0}%");

                y -= 70f;
            }
        }

        private void RebuildPreview()
        {
            if (_previewContainer == null) return;
            for (int i = _previewContainer.childCount - 1; i >= 1; i--)
                Destroy(_previewContainer.GetChild(i).gameObject);

            UIUtils.CreateText("Title", _previewContainer, "SESSION PREVIEW", 16,
                TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -36), Vector2.zero, FontStyle.Bold);

            if (string.IsNullOrEmpty(_selectedDrillId) || _selectedPlayers.Count == 0)
            {
                UIUtils.CreateText("Hint", _previewContainer,
                    "Select a drill and at least one player to begin.\n\nHigher stat gains = more fatigue & injury risk.\nBalance is key!",
                    16, TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                    new Vector2(0.1f, 0.5f), new Vector2(0.9f, 0.9f),
                    Vector2.zero, Vector2.zero);
                return;
            }

            var preview = GameManager.TrainingSystem.PreviewTraining(_selectedDrillId, _selectedPlayers);
            if (preview?.Drill == null) return;

            float y = -80f;
            UIUtils.CreateText("DrillName", _previewContainer, preview.Drill.Name, 22,
                TextAnchor.MiddleCenter, UIUtils.ColorAccent,
                new Vector2(0.05f, 1f), new Vector2(0.95f, 1f),
                new Vector2(0, y), Vector2.zero, FontStyle.Bold);
            y -= 40f;

            UIUtils.CreateText("CostLabel", _previewContainer, $"TOTAL COST", 12,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0.08f, 1f), new Vector2(0.5f, 1f),
                new Vector2(0, y), Vector2.zero);
            UIUtils.CreateText("CostVal", _previewContainer, $"${preview.TotalCost:0,0}", 18,
                TextAnchor.MiddleRight,
                preview.CanAfford ? UIUtils.ColorWarning : UIUtils.ColorError,
                new Vector2(0.5f, 1f), new Vector2(0.92f, 1f),
                Vector2.zero, new Vector2(0, y), FontStyle.Bold);
            y -= 36f;

            UIUtils.CreateText("PlayersLabel", _previewContainer, $"PLAYERS", 12,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0.08f, 1f), new Vector2(0.5f, 1f),
                new Vector2(0, y), Vector2.zero);
            UIUtils.CreateText("PlayersVal", _previewContainer, $"{_selectedPlayers.Count}", 16,
                TextAnchor.MiddleRight, UIUtils.ColorText,
                new Vector2(0.5f, 1f), new Vector2(0.92f, 1f),
                Vector2.zero, new Vector2(0, y), FontStyle.Bold);
            y -= 36f;

            UIUtils.CreateText("FatigueLabel", _previewContainer, $"FATIGUE AFTER", 12,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0.08f, 1f), new Vector2(0.5f, 1f),
                new Vector2(0, y), Vector2.zero);
            UIUtils.CreateText("FatigueVal", _previewContainer, $"{preview.AverageFatigueAfter:0}%", 16,
                TextAnchor.MiddleRight, UIUtils.GetRiskColor(preview.AverageFatigueAfter / 100f),
                new Vector2(0.5f, 1f), new Vector2(0.92f, 1f),
                Vector2.zero, new Vector2(0, y), FontStyle.Bold);
            y -= 40f;

            UIUtils.CreateText("RiskLabel", _previewContainer, $"INJURY RISK", 12,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0.08f, 1f), new Vector2(0.5f, 1f),
                new Vector2(0, y), Vector2.zero);
            UIUtils.CreateText("RiskVal", _previewContainer, $"{preview.AverageInjuryRisk:0}%", 16,
                TextAnchor.MiddleRight, UIUtils.GetRiskColor(preview.AverageInjuryRisk / 100f),
                new Vector2(0.5f, 1f), new Vector2(0.92f, 1f),
                Vector2.zero, new Vector2(0, y), FontStyle.Bold);
            y -= 50f;

            UIUtils.CreateText("GainsTitle", _previewContainer, "EXPECTED GAINS (avg/player)", 14,
                TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                new Vector2(0.05f, 1f), new Vector2(0.95f, 1f),
                Vector2.zero, new Vector2(0, y), FontStyle.Bold);
            y -= 36f;

            var g = preview.ExpectedStatsGain;
            var gains = new (string label, float val)[]
            {
                ("STR", g.Strength), ("SPD", g.Speed), ("TEC", g.Technique),
                ("END", g.Endurance), ("TAC", g.TacticalAwareness)
            };
            foreach (var (label, val) in gains)
            {
                UIUtils.CreateText("GL", _previewContainer, label, 12,
                    TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                    new Vector2(0.08f, 1f), new Vector2(0.3f, 1f),
                    new Vector2(0, y), Vector2.zero);
                UIUtils.CreateText("GV", _previewContainer, $"+{val:0.0}", 14,
                    TextAnchor.MiddleRight, UIUtils.ColorSuccess,
                    new Vector2(0.3f, 1f), new Vector2(0.92f, 1f),
                    Vector2.zero, new Vector2(0, y), FontStyle.Bold);
                y -= 28f;
            }

            y -= 16f;
            UIUtils.CreateText("MoraleLbl", _previewContainer, "MORALE CHANGE", 12,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0.08f, 1f), new Vector2(0.5f, 1f),
                new Vector2(0, y), Vector2.zero);
            UIUtils.CreateText("MoraleVal", _previewContainer,
                $"{(preview.ExpectedMoraleChange >= 0 ? "+" : "")}{preview.ExpectedMoraleChange:0}", 14,
                TextAnchor.MiddleRight,
                preview.ExpectedMoraleChange >= 0 ? UIUtils.ColorSuccess : UIUtils.ColorWarning,
                new Vector2(0.5f, 1f), new Vector2(0.92f, 1f),
                Vector2.zero, new Vector2(0, y), FontStyle.Bold);
        }

        private void ExecuteTraining()
        {
            if (string.IsNullOrEmpty(_selectedDrillId) || _selectedPlayers.Count == 0)
            {
                GameManager.FeedbackSystem.ShowFeedback("Select a drill and players first!", FeedbackType.Warning);
                return;
            }
            var result = GameManager.TrainingSystem.ExecuteTraining(_selectedDrillId, _selectedPlayers);
            if (result != null)
            {
                GameManager.UIManager.ShowScreen(UIScreen.Result);
                var rs = GameManager.UIManager.GetScreen<ResultScreen>(UIScreen.Result);
                rs?.ShowTrainingResult(result, result.PlayerFeedbacks);
            }
        }
    }

    public class RecoveryScreen : UIScreenBase
    {
        private string _selectedOptionId;
        private readonly List<string> _selectedPlayers = new List<string>();
        private Transform _optionsContainer, _playerContainer, _previewContainer;

        protected override void CreateUI()
        {
            ScreenRoot = UIUtils.CreatePanel("RecoveryScreen", ParentTransform,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0.05f, 0.07f, 0.1f, 1f));

            UIUtils.CreateText("Title", ScreenRoot.transform, "💊 RECOVERY CENTER", 32,
                TextAnchor.MiddleCenter, new Color(0.3f, 0.8f, 0.5f),
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -56), Vector2.zero, FontStyle.Bold);

            UIUtils.CreateButton("BtnBack", ScreenRoot.transform, "← BACK",
                new Vector2(0.02f, 1f), new Vector2(0.12f, 1f),
                new Vector2(0, -64), new Vector2(0, -16),
                () =>
                {
                    GameManager.StateMachine.GetState<RecoveryState>()?.CompleteRecovery();
                    GameManager.UIManager.ShowScreen(UIScreen.Dashboard);
                }, new Color(0.3f, 0.35f, 0.45f), fontSize: 16);

            _optionsContainer = UIUtils.CreatePanel("OptionsPanel", ScreenRoot.transform,
                new Vector2(0, 0), new Vector2(0.35f, 1),
                new Vector2(16, 96), new Vector2(-8, -16),
                UIUtils.ColorPanel).transform;

            UIUtils.CreateText("OptionsTitle", _optionsContainer, "SELECT TREATMENT", 16,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, -36), Vector2.zero, FontStyle.Bold);

            _playerContainer = UIUtils.CreatePanel("PlayerPanel", ScreenRoot.transform,
                new Vector2(0.35f, 0), new Vector2(0.7f, 1),
                new Vector2(8, 96), new Vector2(-8, -16),
                UIUtils.ColorPanel).transform;

            UIUtils.CreateText("PlayerTitle", _playerContainer, "SELECT PLAYERS", 16,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(0.5f, 1), new Vector2(20, -36), Vector2.zero, FontStyle.Bold);

            UIUtils.CreateButton("BtnInjured", _playerContainer, "INJURED",
                new Vector2(0.5f, 1f), new Vector2(0.7f, 1f),
                new Vector2(0, -60), new Vector2(-8, -12),
                () =>
                {
                    GameManager.PlayerSystem.SetAllSelection(false);
                    _selectedPlayers.Clear();
                    foreach (var p in GameManager.PlayerSystem.GetAllPlayers())
                    {
                        if (p.CurrentInjury != InjurySeverity.None)
                        {
                            p.IsSelected = true;
                            _selectedPlayers.Add(p.Id);
                        }
                    }
                    RefreshData();
                }, new Color(0.7f, 0.3f, 0.3f), fontSize: 14);

            UIUtils.CreateButton("BtnTired", _playerContainer, "TIRED+",
                new Vector2(0.7f, 1f), new Vector2(0.9f, 1f),
                new Vector2(8, -60), new Vector2(0, -12),
                () =>
                {
                    _selectedPlayers.Clear();
                    foreach (var p in GameManager.PlayerSystem.GetAllPlayers())
                    {
                        p.IsSelected = p.Fatigue >= 50f;
                        if (p.IsSelected) _selectedPlayers.Add(p.Id);
                    }
                    RefreshData();
                }, new Color(0.6f, 0.4f, 0.2f), fontSize: 14);

            _previewContainer = UIUtils.CreatePanel("PreviewPanel", ScreenRoot.transform,
                new Vector2(0.7f, 0), new Vector2(1, 1),
                new Vector2(8, 96), new Vector2(-16, -16),
                UIUtils.ColorPanel).transform;

            UIUtils.CreateButton("BtnStart", _previewContainer, "▶ START RECOVERY",
                new Vector2(0.05f, 0.03f), new Vector2(0.95f, 0.13f),
                Vector2.zero, Vector2.zero, ExecuteRecovery,
                new Color(0.2f, 0.7f, 0.4f), fontSize: 20);
        }

        public override void RefreshData()
        {
            RebuildOptionsList();
            RebuildPlayerList();
            RebuildPreview();
        }

        private void RebuildOptionsList()
        {
            if (_optionsContainer == null) return;
            for (int i = _optionsContainer.childCount - 1; i >= 2; i--)
                Destroy(_optionsContainer.GetChild(i).gameObject);

            var options = GameManager.RecoverySystem.GetAvailableOptions();
            float y = -56f;
            foreach (var o in options)
            {
                bool selected = _selectedOptionId == o.OptionId;
                var card = UIUtils.CreatePanel($"Opt_{o.OptionId}", _optionsContainer,
                    new Vector2(0, 1), new Vector2(1, 1),
                    new Vector2(12, y - 112), new Vector2(-12, y),
                    selected ? new Color(0.2f, 0.5f, 0.35f, 0.95f) : UIUtils.ColorPanelLight);

                var btn = card.gameObject.AddComponent<Button>();
                btn.onClick.AddListener(() => { _selectedOptionId = o.OptionId; RefreshData(); });
                var colors = btn.colors;
                colors.normalColor = Color.white;
                colors.highlightedColor = new Color(1f, 1f, 1f, 0.05f);
                colors.pressedColor = new Color(0.5f, 0.5f, 0.5f, 0.1f);
                btn.colors = colors;
                btn.targetGraphic = card.GetComponent<Image>();

                UIUtils.CreateText("Name", card.transform, o.Name, 16,
                    TextAnchor.MiddleLeft, UIUtils.ColorText,
                    new Vector2(0, 0.75f), new Vector2(1, 1f), new Vector2(12, 0), Vector2.zero, FontStyle.Bold);

                UIUtils.CreateText("Type", card.transform, o.Type.ToString(), 11,
                    TextAnchor.MiddleLeft, new Color(0.3f, 0.8f, 0.5f),
                    new Vector2(0, 0.6f), new Vector2(1, 0.8f), new Vector2(12, 0), Vector2.zero);

                UIUtils.CreateText("Desc", card.transform, o.Description, 11,
                    TextAnchor.UpperLeft, UIUtils.ColorTextDim,
                    new Vector2(0, 0.15f), new Vector2(1, 0.6f), new Vector2(12, 2), new Vector2(-12, 0));

                UIUtils.CreateText("Cost", card.transform, $"${o.CostPerPlayer:0}/player", 13,
                    TextAnchor.MiddleLeft, UIUtils.ColorWarning,
                    new Vector2(0, 0), new Vector2(0.5f, 0.2f), new Vector2(12, 0), Vector2.zero, FontStyle.Bold);

                UIUtils.CreateText("Duration", card.transform, $"{o.DurationHours}h", 11,
                    TextAnchor.MiddleRight, UIUtils.ColorTextDim,
                    new Vector2(0.5f, 0), new Vector2(1f, 0.2f), Vector2.zero, new Vector2(-12, 0));

                y -= 124f;
            }
        }

        private void RebuildPlayerList()
        {
            if (_playerContainer == null) return;
            for (int i = _playerContainer.childCount - 1; i >= 4; i--)
                Destroy(_playerContainer.GetChild(i).gameObject);

            var players = GameManager.PlayerSystem.GetAllPlayers();
            float y = -80f;
            foreach (var p in players)
            {
                bool selected = p.IsSelected;
                bool injured = p.CurrentInjury != InjurySeverity.None;

                var card = UIUtils.CreatePanel($"P_{p.Id}", _playerContainer,
                    new Vector2(0, 1), new Vector2(1, 1),
                    new Vector2(12, y - 62), new Vector2(-12, y),
                    selected ? new Color(0.25f, 0.45f, 0.3f, 0.8f) :
                    injured ? new Color(0.25f, 0.15f, 0.15f, 0.8f) :
                    new Color(0.15f, 0.18f, 0.25f, 0.8f));

                var btn = card.gameObject.AddComponent<Button>();
                btn.onClick.AddListener(() =>
                {
                    GameManager.PlayerSystem.TogglePlayerSelection(p.Id);
                    if (p.IsSelected) _selectedPlayers.Add(p.Id);
                    else _selectedPlayers.Remove(p.Id);
                    RefreshData();
                });
                var colors = btn.colors;
                colors.normalColor = Color.white;
                colors.highlightedColor = new Color(1f, 1f, 1f, 0.08f);
                colors.pressedColor = new Color(0.5f, 0.5f, 0.5f, 0.1f);
                btn.colors = colors;
                btn.targetGraphic = card.GetComponent<Image>();

                UIUtils.CreateText("Check", card.transform, selected ? "✓" : "", 20,
                    TextAnchor.MiddleCenter, new Color(0.4f, 0.9f, 0.6f),
                    new Vector2(0, 0), new Vector2(0.1f, 1), new Vector2(4, 0), new Vector2(-4, 0), FontStyle.Bold);

                UIUtils.CreateText("Name", card.transform, p.Name, 14,
                    TextAnchor.MiddleLeft, UIUtils.ColorText,
                    new Vector2(0.1f, 0.55f), new Vector2(0.45f, 0.95f), new Vector2(8, 0), Vector2.zero, FontStyle.Bold);

                UIUtils.CreateText("Pos", card.transform, p.Position.ToString().Substring(0, 3).ToUpper(), 10,
                    TextAnchor.MiddleLeft, UIUtils.ColorAccent,
                    new Vector2(0.1f, 0.1f), new Vector2(0.35f, 0.55f), new Vector2(8, 0), Vector2.zero);

                UIUtils.CreateText("Rating", card.transform, $"{p.OverallRating}", 16,
                    TextAnchor.MiddleRight, injured ? UIUtils.ColorDanger : UIUtils.ColorText,
                    new Vector2(0.85f, 0.5f), new Vector2(1f, 1f), Vector2.zero, new Vector2(-8, 0), FontStyle.Bold);

                UIUtils.CreateText("Injury", card.transform, injured ? $"{p.CurrentInjury} {p.InjuryDaysLeft}d" : "", 10,
                    TextAnchor.MiddleRight, UIUtils.ColorDanger,
                    new Vector2(0.85f, 0.05f), new Vector2(1f, 0.45f), Vector2.zero, new Vector2(-8, 0));

                var fatigueBar = UIUtils.CreateProgressBar("Fatigue", card.transform,
                    new Vector2(0.35f, 0.08f), new Vector2(0.7f, 0.28f),
                    new Vector2(8, 0), new Vector2(-4, 0),
                    p.Fatigue, UIUtils.GetRiskColor(p.Fatigue, reverse: true), "FATIGUE");

                var moraleBar = UIUtils.CreateProgressBar("Morale", card.transform,
                    new Vector2(0.35f, 0.38f), new Vector2(0.7f, 0.58f),
                    new Vector2(8, 0), new Vector2(-4, 0),
                    p.Morale, new Color(0.4f, 0.7f, 1f), "MORALE");

                y -= 70f;
            }
        }

        private void RebuildPreview()
        {
            if (_previewContainer == null) return;
            for (int i = _previewContainer.childCount - 1; i >= 1; i--)
                Destroy(_previewContainer.GetChild(i).gameObject);

            float y = -36f;
            UIUtils.CreateText("PreviewTitle", _previewContainer, "RECOVERY PREVIEW", 16,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, y), Vector2.zero, FontStyle.Bold);
            y -= 36f;

            if (string.IsNullOrEmpty(_selectedOptionId) || _selectedPlayers.Count == 0)
            {
                UIUtils.CreateText("Hint", _previewContainer, "Select a treatment and players to view preview", 13,
                    TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                    new Vector2(0, 0.5f), new Vector2(1, 0.6f),
                    new Vector2(20, 0), new Vector2(-20, 0));
                return;
            }

            var option = GameManager.RecoverySystem.GetOptionById(_selectedOptionId);
            if (option == null) return;

            var preview = GameManager.RecoverySystem.PreviewRecovery(_selectedOptionId, _selectedPlayers);

            UIUtils.CreateText("OptionName", _previewContainer, $"▶ {option.Name}", 18,
                TextAnchor.MiddleLeft, UIUtils.ColorAccent,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, y), Vector2.zero, FontStyle.Bold);
            y -= 30f;

            UIUtils.CreateText("SelCount", _previewContainer, $"Selected: {_selectedPlayers.Count} players", 13,
                TextAnchor.MiddleLeft, UIUtils.ColorText,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, y), Vector2.zero);
            y -= 28f;

            var statsPanel = UIUtils.CreatePanel("StatsPanel", _previewContainer,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(12, y - 180), new Vector2(-12, y),
                UIUtils.ColorPanelLight);
            y -= 192f;

            UIUtils.CreateProgressBar("FatigueRed", statsPanel.transform,
                new Vector2(0, 0.75f), new Vector2(1, 0.95f),
                new Vector2(12, 0), new Vector2(-12, 0),
                Mathf.Min(100, preview.EstimatedFatigueReduction * 10),
                new Color(0.3f, 0.8f, 0.5f), $"FATIGUE -{preview.EstimatedFatigueReduction:0}");

            UIUtils.CreateProgressBar("MoraleUp", statsPanel.transform,
                new Vector2(0, 0.5f), new Vector2(1, 0.7f),
                new Vector2(12, 0), new Vector2(-12, 0),
                preview.EstimatedMoraleBoost * 5,
                new Color(0.4f, 0.7f, 1f), $"MORALE +{preview.EstimatedMoraleBoost:0}");

            UIUtils.CreateProgressBar("Heal", statsPanel.transform,
                new Vector2(0, 0.25f), new Vector2(1, 0.45f),
                new Vector2(12, 0), new Vector2(-12, 0),
                preview.EstimatedHealingChance,
                new Color(0.9f, 0.6f, 0.3f), $"HEAL CHANCE {preview.EstimatedHealingChance:0}%");

            UIUtils.CreateText("Desc", statsPanel.transform,
                preview.EstimatedDurationHours > 0
                    ? $"Duration: {preview.EstimatedDurationHours}h  |  Recovery quality: {preview.ExpectedQuality:P0}"
                    : $"Recovery quality: {preview.ExpectedQuality:P0}",
                11, TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                new Vector2(0, 0), new Vector2(1, 0.2f),
                new Vector2(12, 0), new Vector2(-12, 0));

            var costColor = preview.EstimatedTotalCost > GameManager.Finance.Balance
                ? UIUtils.ColorDanger : UIUtils.ColorWarning;
            UIUtils.CreateText("Cost", _previewContainer, $"TOTAL COST: ${preview.EstimatedTotalCost:0}", 18,
                TextAnchor.MiddleLeft, costColor,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, y), Vector2.zero, FontStyle.Bold);
            y -= 28f;

            UIUtils.CreateText("Balance", _previewContainer,
                $"Current balance: ${GameManager.Finance.Balance:0}", 12,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, y), Vector2.zero);
        }

        private void ExecuteRecovery()
        {
            if (string.IsNullOrEmpty(_selectedOptionId) || _selectedPlayers.Count == 0)
            {
                GameManager.FeedbackSystem.ShowFeedback("Select a treatment and players first!", FeedbackType.Warning);
                return;
            }
            var result = GameManager.RecoverySystem.ExecuteRecovery(_selectedOptionId, _selectedPlayers);
            if (result != null)
            {
                GameManager.UIManager.ShowScreen(UIScreen.Result);
                var rs = GameManager.UIManager.GetScreen<ResultScreen>(UIScreen.Result);
                rs?.ShowRecoveryResult(result);
            }
        }
    }

    public class MatchScreen : UIScreenBase
    {
        private int _selectedFixtureIdx = -1;
        private readonly List<string> _lineupIds = new List<string>();
        private Transform _fixturesContainer, _lineupContainer, _previewContainer;

        protected override void CreateUI()
        {
            ScreenRoot = UIUtils.CreatePanel("MatchScreen", ParentTransform,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0.06f, 0.05f, 0.08f, 1f));

            UIUtils.CreateText("Title", ScreenRoot.transform, "⚽ MATCH CENTER", 32,
                TextAnchor.MiddleCenter, new Color(0.9f, 0.6f, 0.3f),
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -56), Vector2.zero, FontStyle.Bold);

            UIUtils.CreateButton("BtnBack", ScreenRoot.transform, "← BACK",
                new Vector2(0.02f, 1f), new Vector2(0.12f, 1f),
                new Vector2(0, -64), new Vector2(0, -16),
                () =>
                {
                    GameManager.StateMachine.GetState<MatchState>()?.CompleteMatch(false);
                    GameManager.UIManager.ShowScreen(UIScreen.Dashboard);
                }, new Color(0.3f, 0.35f, 0.45f), fontSize: 16);

            _fixturesContainer = UIUtils.CreatePanel("FixturesPanel", ScreenRoot.transform,
                new Vector2(0, 0), new Vector2(0.33f, 1),
                new Vector2(16, 96), new Vector2(-8, -16),
                UIUtils.ColorPanel).transform;

            UIUtils.CreateText("FixTitle", _fixturesContainer, "FIXTURES", 16,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, -36), Vector2.zero, FontStyle.Bold);

            _lineupContainer = UIUtils.CreatePanel("LineupPanel", ScreenRoot.transform,
                new Vector2(0.33f, 0), new Vector2(0.68f, 1),
                new Vector2(8, 96), new Vector2(-8, -16),
                UIUtils.ColorPanel).transform;

            UIUtils.CreateText("LuTitle", _lineupContainer, "LINEUP (pick 7-11 players)", 16,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(0.7f, 1), new Vector2(20, -36), Vector2.zero, FontStyle.Bold);

            UIUtils.CreateButton("BtnAuto", _lineupContainer, "AUTO XI",
                new Vector2(0.7f, 1f), new Vector2(0.98f, 1f),
                new Vector2(0, -60), new Vector2(-8, -12),
                () => { AutoPickLineup(); },
                new Color(0.3f, 0.5f, 0.8f), fontSize: 14);

            _previewContainer = UIUtils.CreatePanel("PreviewPanel", ScreenRoot.transform,
                new Vector2(0.68f, 0), new Vector2(1, 1),
                new Vector2(8, 96), new Vector2(-16, -16),
                UIUtils.ColorPanel).transform;

            UIUtils.CreateButton("BtnKickoff", _previewContainer, "▶ KICK OFF!",
                new Vector2(0.05f, 0.03f), new Vector2(0.95f, 0.13f),
                Vector2.zero, Vector2.zero, ExecuteMatch,
                new Color(0.8f, 0.35f, 0.2f), fontSize: 20);
        }

        private void AutoPickLineup()
        {
            _lineupIds.Clear();
            var all = GameManager.PlayerSystem.GetAllPlayers()
                .Where(p => p.CurrentInjury == InjurySeverity.None)
                .OrderByDescending(p => p.MatchReadiness)
                .Take(11).ToList();
            foreach (var p in GameManager.PlayerSystem.GetAllPlayers())
                p.IsSelected = false;
            foreach (var p in all)
            {
                p.IsSelected = true;
                _lineupIds.Add(p.Id);
            }
            RefreshData();
        }

        public override void RefreshData()
        {
            RebuildFixtures();
            RebuildLineup();
            RebuildPreview();
        }

        private void RebuildFixtures()
        {
            if (_fixturesContainer == null) return;
            for (int i = _fixturesContainer.childCount - 1; i >= 2; i--)
                Destroy(_fixturesContainer.GetChild(i).gameObject);

            var fixtures = GameManager.MatchSystem.GetUpcomingFixtures();
            float y = -56f;
            for (int idx = 0; idx < fixtures.Count; idx++)
            {
                var f = fixtures[idx];
                bool selected = _selectedFixtureIdx == idx;
                bool available = f.CanPlayNow;
                var card = UIUtils.CreatePanel($"Fix_{idx}", _fixturesContainer,
                    new Vector2(0, 1), new Vector2(1, 1),
                    new Vector2(12, y - 128), new Vector2(-12, y),
                    !available ? new Color(0.15f, 0.15f, 0.18f, 0.8f) :
                    selected ? new Color(0.55f, 0.35f, 0.15f, 0.95f) : UIUtils.ColorPanelLight);

                if (available)
                {
                    var btn = card.gameObject.AddComponent<Button>();
                    btn.onClick.AddListener(() => { _selectedFixtureIdx = idx; RefreshData(); });
                    var c = btn.colors; c.normalColor = Color.white;
                    c.highlightedColor = new Color(1, 1, 1, 0.06f);
                    c.pressedColor = new Color(0.5f, 0.5f, 0.5f, 0.1f);
                    btn.colors = c; btn.targetGraphic = card.GetComponent<Image>();
                }

                UIUtils.CreateText("Opp", card.transform, f.OpponentName, 16,
                    TextAnchor.MiddleLeft, UIUtils.ColorText,
                    new Vector2(0, 0.75f), new Vector2(1, 1), new Vector2(12, 0), Vector2.zero, FontStyle.Bold);

                UIUtils.CreateText("Diff", card.transform,
                    new string('★', Mathf.Clamp(f.DifficultyStars, 1, 5)) + new string('☆', 5 - Mathf.Clamp(f.DifficultyStars, 1, 5)),
                    12, TextAnchor.MiddleLeft,
                    f.DifficultyStars <= 2 ? new Color(0.4f, 0.9f, 0.5f) :
                    f.DifficultyStars <= 3 ? new Color(0.9f, 0.8f, 0.3f) : new Color(0.95f, 0.4f, 0.35f),
                    new Vector2(0, 0.5f), new Vector2(1, 0.75f), new Vector2(12, 0), Vector2.zero);

                UIUtils.CreateText("Date", card.transform, $"Week {f.ScheduledWeek}  {(available ? "▶ AVAILABLE" : "SCHEDULED")}",
                    10, TextAnchor.MiddleLeft, available ? UIUtils.ColorAccent : UIUtils.ColorTextDim,
                    new Vector2(0, 0.28f), new Vector2(1, 0.5f), new Vector2(12, 0), Vector2.zero);

                UIUtils.CreateText("Prize", card.transform, $"Win: ${f.PrizeMoney:0}", 12,
                    TextAnchor.MiddleLeft, UIUtils.ColorWarning,
                    new Vector2(0, 0.05f), new Vector2(0.5f, 0.28f), new Vector2(12, 0), Vector2.zero, FontStyle.Bold);

                UIUtils.CreateText("Tkt", card.transform, $"Gate: ${f.TicketRevenue:0}", 11,
                    TextAnchor.MiddleRight, UIUtils.ColorTextDim,
                    new Vector2(0.5f, 0.05f), new Vector2(1, 0.28f), Vector2.zero, new Vector2(-12, 0));

                y -= 140f;
            }
        }

        private void RebuildLineup()
        {
            if (_lineupContainer == null) return;
            for (int i = _lineupContainer.childCount - 1; i >= 3; i--)
                Destroy(_lineupContainer.GetChild(i).gameObject);

            _lineupIds.Clear();
            var players = GameManager.PlayerSystem.GetAllPlayers();
            float y = -80f;
            foreach (var p in players)
            {
                if (p.IsSelected && p.CurrentInjury == InjurySeverity.None)
                    _lineupIds.Add(p.Id);

                bool selected = p.IsSelected;
                bool injured = p.CurrentInjury != InjurySeverity.None;

                var card = UIUtils.CreatePanel($"P_{p.Id}", _lineupContainer,
                    new Vector2(0, 1), new Vector2(1, 1),
                    new Vector2(12, y - 62), new Vector2(-12, y),
                    selected ? new Color(0.45f, 0.3f, 0.15f, 0.8f) :
                    injured ? new Color(0.25f, 0.15f, 0.15f, 0.8f) :
                    new Color(0.15f, 0.18f, 0.25f, 0.8f));

                if (!injured)
                {
                    var btn = card.gameObject.AddComponent<Button>();
                    btn.onClick.AddListener(() =>
                    {
                        p.IsSelected = !p.IsSelected;
                        RefreshData();
                    });
                    var c = btn.colors; c.normalColor = Color.white;
                    c.highlightedColor = new Color(1, 1, 1, 0.08f);
                    c.pressedColor = new Color(0.5f, 0.5f, 0.5f, 0.1f);
                    btn.colors = c; btn.targetGraphic = card.GetComponent<Image>();
                }

                UIUtils.CreateText("Check", card.transform, selected ? "✓" : "", 20,
                    TextAnchor.MiddleCenter, new Color(1f, 0.8f, 0.4f),
                    new Vector2(0, 0), new Vector2(0.1f, 1), new Vector2(4, 0), new Vector2(-4, 0), FontStyle.Bold);

                UIUtils.CreateText("Name", card.transform, p.Name, 14,
                    TextAnchor.MiddleLeft, UIUtils.ColorText,
                    new Vector2(0.1f, 0.55f), new Vector2(0.45f, 0.95f), new Vector2(8, 0), Vector2.zero, FontStyle.Bold);

                UIUtils.CreateText("Pos", card.transform, p.Position.ToString().Substring(0, 3).ToUpper(), 10,
                    TextAnchor.MiddleLeft, UIUtils.ColorAccent,
                    new Vector2(0.1f, 0.1f), new Vector2(0.35f, 0.55f), new Vector2(8, 0), Vector2.zero);

                UIUtils.CreateText("Rating", card.transform, $"{p.OverallRating}", 16,
                    TextAnchor.MiddleRight, injured ? UIUtils.ColorDanger : UIUtils.ColorText,
                    new Vector2(0.7f, 0.5f), new Vector2(0.85f, 1f), Vector2.zero, new Vector2(-4, 0), FontStyle.Bold);

                var ready = p.MatchReadiness;
                UIUtils.CreateProgressBar("Readiness", card.transform,
                    new Vector2(0.35f, 0.08f), new Vector2(0.7f, 0.28f),
                    new Vector2(8, 0), new Vector2(-4, 0),
                    ready, UIUtils.GetRiskColor(100 - ready, true), $"READY {ready:0}");

                UIUtils.CreateText("Injury", card.transform, injured ? $"INJURED" : "", 10,
                    TextAnchor.MiddleRight, UIUtils.ColorDanger,
                    new Vector2(0.85f, 0.05f), new Vector2(1f, 0.5f), Vector2.zero, new Vector2(-8, 0));

                y -= 70f;
            }
        }

        private void RebuildPreview()
        {
            if (_previewContainer == null) return;
            for (int i = _previewContainer.childCount - 1; i >= 1; i--)
                Destroy(_previewContainer.GetChild(i).gameObject);

            float y = -36f;
            UIUtils.CreateText("PreviewTitle", _previewContainer, "MATCH PREVIEW", 16,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, y), Vector2.zero, FontStyle.Bold);
            y -= 36f;

            if (_selectedFixtureIdx < 0 || _lineupIds.Count < 7)
            {
                UIUtils.CreateText("Hint", _previewContainer,
                    _selectedFixtureIdx < 0 ? "Select a fixture first" : $"Need at least 7 players (current: {_lineupIds.Count})",
                    13, TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                    new Vector2(0, 0.5f), new Vector2(1, 0.6f),
                    new Vector2(20, 0), new Vector2(-20, 0));
                return;
            }

            var fixtures = GameManager.MatchSystem.GetUpcomingFixtures();
            if (_selectedFixtureIdx >= fixtures.Count) return;
            var fixture = fixtures[_selectedFixtureIdx];
            var preview = GameManager.MatchSystem.PreviewMatch(fixture, _lineupIds);

            UIUtils.CreateText("VSTitle", _previewContainer, $"▶ vs {fixture.OpponentName}", 20,
                TextAnchor.MiddleLeft, new Color(1f, 0.8f, 0.4f),
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, y), Vector2.zero, FontStyle.Bold);
            y -= 32f;

            var powerPanel = UIUtils.CreatePanel("PowerPanel", _previewContainer,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(12, y - 100), new Vector2(-12, y),
                UIUtils.ColorPanelLight);
            y -= 112f;

            UIUtils.CreateText("OurAttack", powerPanel.transform, $"OUR ATTACK", 10,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 0.78f), new Vector2(0.5f, 1f), new Vector2(12, 0), Vector2.zero);
            UIUtils.CreateProgressBar("AtkBar", powerPanel.transform,
                new Vector2(0, 0.6f), new Vector2(0.9f, 0.78f),
                new Vector2(12, 0), new Vector2(-12, 0),
                Mathf.Min(100, preview.OurAttackRating * 2), new Color(0.3f, 0.8f, 0.5f), $"{preview.OurAttackRating:0}");

            UIUtils.CreateText("OurDef", powerPanel.transform, $"OUR DEFENSE", 10,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 0.48f), new Vector2(0.5f, 0.6f), new Vector2(12, 0), Vector2.zero);
            UIUtils.CreateProgressBar("DefBar", powerPanel.transform,
                new Vector2(0, 0.3f), new Vector2(0.9f, 0.48f),
                new Vector2(12, 0), new Vector2(-12, 0),
                Mathf.Min(100, preview.OurDefenseRating * 2), new Color(0.4f, 0.7f, 1f), $"{preview.OurDefenseRating:0}");

            UIUtils.CreateText("OppRating", powerPanel.transform, $"OPPONENT RATING: {fixture.DifficultyStars * 10 + 20}", 10,
                TextAnchor.MiddleLeft, UIUtils.ColorDanger,
                new Vector2(0, 0.15f), new Vector2(1, 0.3f), new Vector2(12, 0), Vector2.zero, FontStyle.Bold);

            var winChance = Mathf.Clamp(preview.ExpectedWinChance, 5, 95);
            UIUtils.CreateText("WinChance", powerPanel.transform, $"WIN CHANCE", 10,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 0.0f), new Vector2(0.35f, 0.15f), new Vector2(12, 0), Vector2.zero);
            UIUtils.CreateProgressBar("WinBar", powerPanel.transform,
                new Vector2(0.35f, 0f), new Vector2(1, 0.15f),
                new Vector2(0, 0), new Vector2(-12, 0),
                winChance,
                winChance > 50 ? new Color(0.3f, 0.8f, 0.5f) : winChance > 30 ? new Color(0.9f, 0.8f, 0.3f) : new Color(0.9f, 0.4f, 0.3f),
                $"{winChance:0}%");

            var riskPanel = UIUtils.CreatePanel("RiskPanel", _previewContainer,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(12, y - 110), new Vector2(-12, y),
                UIUtils.ColorPanelLight);
            y -= 122f;

            UIUtils.CreateProgressBar("InjuryRisk", riskPanel.transform,
                new Vector2(0, 0.6f), new Vector2(1, 0.85f),
                new Vector2(12, 0), new Vector2(-12, 0),
                preview.EstimatedInjuryRisk,
                UIUtils.GetRiskColor(preview.EstimatedInjuryRisk),
                $"INJURY RISK {preview.EstimatedInjuryRisk:0}%");

            UIUtils.CreateProgressBar("AvgFatigue", riskPanel.transform,
                new Vector2(0, 0.2f), new Vector2(1, 0.45f),
                new Vector2(12, 0), new Vector2(-12, 0),
                preview.AverageLineupFatigue,
                UIUtils.GetRiskColor(preview.AverageLineupFatigue, true),
                $"AVG FATIGUE {preview.AverageLineupFatigue:0}");

            UIUtils.CreateText("Note", riskPanel.transform,
                $"Morale impact: ±{preview.EstimatedMoraleImpact}  |  Stamina: {preview.EstimatedStaminaCost:0}/player",
                10, TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                new Vector2(0, 0), new Vector2(1, 0.2f), new Vector2(12, 0), new Vector2(-12, 0));

            UIUtils.CreateText("Prize", _previewContainer, $"PRIZE + GATE: ${fixture.PrizeMoney + fixture.TicketRevenue:0}", 16,
                TextAnchor.MiddleLeft, UIUtils.ColorWarning,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, y), Vector2.zero, FontStyle.Bold);
        }

        private void ExecuteMatch()
        {
            if (_selectedFixtureIdx < 0 || _lineupIds.Count < 7)
            {
                GameManager.FeedbackSystem.ShowFeedback(_selectedFixtureIdx < 0 ? "Select fixture!" : "Need 7+ players!", FeedbackType.Warning);
                return;
            }
            var fixtures = GameManager.MatchSystem.GetUpcomingFixtures();
            var f = fixtures[_selectedFixtureIdx];
            var result = GameManager.MatchSystem.SimulateMatch(f, _lineupIds);
            if (result != null)
            {
                GameManager.UIManager.ShowScreen(UIScreen.Result);
                var rs = GameManager.UIManager.GetScreen<ResultScreen>(UIScreen.Result);
                rs?.ShowMatchResult(result, f);
            }
        }
    }

    public class SquadScreen : UIScreenBase
    {
        private string _selectedPlayerId;
        private Transform _listContainer, _detailContainer;

        protected override void CreateUI()
        {
            ScreenRoot = UIUtils.CreatePanel("SquadScreen", ParentTransform,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0.05f, 0.08f, 0.07f, 1f));

            UIUtils.CreateText("Title", ScreenRoot.transform, "👥 SQUAD", 32,
                TextAnchor.MiddleCenter, new Color(0.3f, 0.85f, 0.7f),
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -56), Vector2.zero, FontStyle.Bold);

            UIUtils.CreateButton("BtnBack", ScreenRoot.transform, "← BACK",
                new Vector2(0.02f, 1f), new Vector2(0.12f, 1f),
                new Vector2(0, -64), new Vector2(0, -16),
                () => GameManager.UIManager.ShowScreen(UIScreen.Dashboard),
                new Color(0.3f, 0.35f, 0.45f), fontSize: 16);

            _listContainer = UIUtils.CreatePanel("ListPanel", ScreenRoot.transform,
                new Vector2(0, 0), new Vector2(0.42f, 1),
                new Vector2(16, 96), new Vector2(-8, -16),
                UIUtils.ColorPanel).transform;

            UIUtils.CreateText("ListTitle", _listContainer, "SQUAD LIST", 16,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, -36), Vector2.zero, FontStyle.Bold);

            _detailContainer = UIUtils.CreatePanel("DetailPanel", ScreenRoot.transform,
                new Vector2(0.42f, 0), new Vector2(1, 1),
                new Vector2(8, 96), new Vector2(-16, -16),
                UIUtils.ColorPanel).transform;
        }

        public override void RefreshData()
        {
            RebuildList();
            RebuildDetail();
        }

        private void RebuildList()
        {
            if (_listContainer == null) return;
            for (int i = _listContainer.childCount - 1; i >= 2; i--)
                Destroy(_listContainer.GetChild(i).gameObject);

            var players = GameManager.PlayerSystem.GetAllPlayers()
                .OrderByDescending(p => p.OverallRating).ToList();
            float y = -56f;
            foreach (var p in players)
            {
                bool selected = _selectedPlayerId == p.Id;
                var card = UIUtils.CreatePanel($"P_{p.Id}", _listContainer,
                    new Vector2(0, 1), new Vector2(1, 1),
                    new Vector2(12, y - 56), new Vector2(-12, y),
                    selected ? new Color(0.2f, 0.5f, 0.45f, 0.95f) :
                    p.CurrentInjury != InjurySeverity.None ? new Color(0.25f, 0.15f, 0.15f, 0.7f) :
                    UIUtils.ColorPanelLight);

                var btn = card.gameObject.AddComponent<Button>();
                btn.onClick.AddListener(() => { _selectedPlayerId = p.Id; RefreshData(); });
                var c = btn.colors; c.normalColor = Color.white;
                c.highlightedColor = new Color(1, 1, 1, 0.06f);
                c.pressedColor = new Color(0.5f, 0.5f, 0.5f, 0.1f);
                btn.colors = c; btn.targetGraphic = card.GetComponent<Image>();

                UIUtils.CreateText("Name", card.transform, p.Name, 14,
                    TextAnchor.MiddleLeft, UIUtils.ColorText,
                    new Vector2(0, 0.55f), new Vector2(0.55f, 1), new Vector2(48, 0), Vector2.zero, FontStyle.Bold);

                UIUtils.CreateText("Pos", card.transform, p.Position.ToString().Substring(0, 3).ToUpper(), 11,
                    TextAnchor.MiddleLeft, UIUtils.ColorAccent,
                    new Vector2(0, 0.05f), new Vector2(0.4f, 0.55f), new Vector2(48, 0), Vector2.zero);

                UIUtils.CreateText("Rating", card.transform, $"{p.OverallRating}", 20,
                    TextAnchor.MiddleRight, UIUtils.ColorText,
                    new Vector2(0.85f, 0), new Vector2(1, 1), Vector2.zero, new Vector2(-12, 0), FontStyle.Bold);

                UIUtils.CreateText("Age", card.transform, $"{p.Age}y", 10,
                    TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                    new Vector2(0.55f, 0.55f), new Vector2(0.85f, 1), new Vector2(8, 0), Vector2.zero);

                y -= 64f;
            }
        }

        private void RebuildDetail()
        {
            if (_detailContainer == null) return;
            for (int i = _detailContainer.childCount - 1; i >= 0; i--)
                Destroy(_detailContainer.GetChild(i).gameObject);

            var p = GameManager.PlayerSystem.GetPlayer(_selectedPlayerId);
            if (p == null)
            {
                UIUtils.CreateText("Hint", _detailContainer, "Select a player to view details", 14,
                    TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                    new Vector2(0, 0.5f), new Vector2(1, 0.6f), Vector2.zero, Vector2.zero);
                return;
            }

            float y = -32f;
            var headerPanel = UIUtils.CreatePanel("Header", _detailContainer,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(12, y - 110), new Vector2(-12, y),
                new Color(0.15f, 0.3f, 0.3f, 0.9f));
            y -= 122f;

            UIUtils.CreateText("Name", headerPanel.transform, p.Name, 28,
                TextAnchor.MiddleLeft, UIUtils.ColorText,
                new Vector2(0, 0.55f), new Vector2(1, 1), new Vector2(24, 0), Vector2.zero, FontStyle.Bold);

            UIUtils.CreateText("PosRating", headerPanel.transform,
                $"{p.Position}  |  Rating {p.OverallRating}  |  Age {p.Age}", 14,
                TextAnchor.MiddleLeft, UIUtils.ColorAccent,
                new Vector2(0, 0.22f), new Vector2(1, 0.55f), new Vector2(24, 0), Vector2.zero);

            UIUtils.CreateText("Status", headerPanel.transform,
                p.CurrentInjury != InjurySeverity.None ? $"⚕ {p.CurrentInjury} ({p.InjuryDaysLeft}d)" :
                p.Fatigue > 70 ? "😫 EXHAUSTED" : p.Fatigue > 50 ? "😓 TIRED" : p.Morale < 30 ? "😤 UNHAPPY" : "✅ FIT",
                13, TextAnchor.MiddleRight,
                p.CurrentInjury != InjurySeverity.None ? UIUtils.ColorDanger :
                p.Fatigue > 50 ? UIUtils.ColorWarning : p.Morale < 30 ? UIUtils.ColorDanger : new Color(0.4f, 0.9f, 0.6f),
                new Vector2(0.4f, 0), new Vector2(1, 0.3f), Vector2.zero, new Vector2(-24, 0), FontStyle.Bold);

            var attrPanel = UIUtils.CreatePanel("Attrs", _detailContainer,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(12, y - 330), new Vector2(-12, y),
                UIUtils.ColorPanelLight);
            y -= 342f;

            UIUtils.CreateText("AttrsTitle", attrPanel.transform, "ATTRIBUTES", 14,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 0.93f), new Vector2(1, 1), new Vector2(20, 0), Vector2.zero, FontStyle.Bold);

            var attrs = new (string Name, float Value, Color C)[]
            {
                ("STRENGTH", p.Attributes.Strength, new Color(0.95f, 0.45f, 0.35f)),
                ("SPEED", p.Attributes.Speed, new Color(0.4f, 0.85f, 0.95f)),
                ("TECHNIQUE", p.Attributes.Technique, new Color(0.55f, 0.4f, 0.95f)),
                ("STAMINA", p.Attributes.Stamina, new Color(0.4f, 0.9f, 0.55f)),
                ("TACTICS", p.Attributes.Tactics, new Color(0.95f, 0.8f, 0.35f)),
            };
            float ay = 0.88f;
            foreach (var a in attrs)
            {
                UIUtils.CreateProgressBar($"Bar_{a.Name}", attrPanel.transform,
                    new Vector2(0, ay - 0.12f), new Vector2(1, ay),
                    new Vector2(20, 0), new Vector2(-120, 0),
                    a.Value, a.C, "");
                UIUtils.CreateText($"Val_{a.Name}", attrPanel.transform, $"{a.Value:0.0}", 14,
                    TextAnchor.MiddleRight, a.C,
                    new Vector2(0.85f, ay - 0.12f), new Vector2(1, ay),
                    Vector2.zero, new Vector2(-20, 0), FontStyle.Bold);
                ay -= 0.14f;
            }

            var derivedPanel = UIUtils.CreatePanel("Derived", _detailContainer,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(12, y - 260), new Vector2(-12, y),
                UIUtils.ColorPanelLight);
            y -= 272f;

            UIUtils.CreateText("DerivedTitle", derivedPanel.transform, "STATUS", 14,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 0.93f), new Vector2(1, 1), new Vector2(20, 0), Vector2.zero, FontStyle.Bold);

            var stats = new (string Name, float Value, bool Risk)[]
            {
                ("FATIGUE", p.Fatigue, true),
                ("MORALE", p.Morale, false),
                ("MATCH READINESS", p.MatchReadiness, false),
                ("INJURY RISK", p.InjuryRisk, false),
                ("TRAINING CONSISTENCY", p.TrainingConsistency, false),
            };
            float sy = 0.88f;
            foreach (var s in stats)
            {
                var col = s.Risk ? UIUtils.GetRiskColor(s.Value, true) :
                    s.Name == "INJURY RISK" ? UIUtils.GetRiskColor(s.Value) :
                    UIUtils.GetRiskColor(100 - s.Value, true);
                UIUtils.CreateProgressBar($"P_{s.Name}", derivedPanel.transform,
                    new Vector2(0, sy - 0.12f), new Vector2(0.9f, sy),
                    new Vector2(20, 0), new Vector2(-20, 0),
                    Mathf.Clamp(s.Value, 0, 100), col, $"{s.Name}  {s.Value:0}");
                sy -= 0.15f;
            }

            var infoPanel = UIUtils.CreatePanel("Info", _detailContainer,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(12, y - 110), new Vector2(-12, y),
                UIUtils.ColorPanelLight);

            UIUtils.CreateText("InfoT", infoPanel.transform,
                $"Form: {new string(p.Form > 0 ? '▲' : p.Form < 0 ? '▼' : '●', Mathf.Clamp(Mathf.Abs(p.Form), 1, 5))}  " +
                $"|  Career Goals: {p.CareerGoals}  |  Matches: {p.CareerMatches}  " +
                $"|  Wage: ${p.WeeklyWage}/w  |  Value: ${p.EstimatedValue:0}",
                11, TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                new Vector2(0, 0.2f), new Vector2(1, 0.8f),
                new Vector2(12, 0), new Vector2(-12, 0));
        }
    }

    public class FixturesScreen : UIScreenBase
    {
        private Transform _fixturesContainer, _tableContainer;
        private int _currentTab = 0;

        protected override void CreateUI()
        {
            ScreenRoot = UIUtils.CreatePanel("FixturesScreen", ParentTransform,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0.06f, 0.06f, 0.09f, 1f));

            UIUtils.CreateText("Title", ScreenRoot.transform, "📅 FIXTURES & TABLE", 32,
                TextAnchor.MiddleCenter, new Color(0.6f, 0.5f, 0.95f),
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -56), Vector2.zero, FontStyle.Bold);

            UIUtils.CreateButton("BtnBack", ScreenRoot.transform, "← BACK",
                new Vector2(0.02f, 1f), new Vector2(0.12f, 1f),
                new Vector2(0, -64), new Vector2(0, -16),
                () => GameManager.UIManager.ShowScreen(UIScreen.Dashboard),
                new Color(0.3f, 0.35f, 0.45f), fontSize: 16);

            UIUtils.CreateButton("TabFix", ScreenRoot.transform, "FIXTURES",
                new Vector2(0.3f, 1f), new Vector2(0.5f, 1f),
                new Vector2(0, -96), new Vector2(0, -60),
                () => { _currentTab = 0; RefreshData(); },
                new Color(0.4f, 0.3f, 0.7f), fontSize: 14);

            UIUtils.CreateButton("TabTable", ScreenRoot.transform, "LEAGUE TABLE",
                new Vector2(0.5f, 1f), new Vector2(0.7f, 1f),
                new Vector2(0, -96), new Vector2(0, -60),
                () => { _currentTab = 1; RefreshData(); },
                new Color(0.3f, 0.3f, 0.5f), fontSize: 14);

            _fixturesContainer = UIUtils.CreatePanel("FixPanel", ScreenRoot.transform,
                Vector2.zero, Vector2.one,
                new Vector2(16, 140), new Vector2(-16, -16),
                UIUtils.ColorPanel).transform;

            _tableContainer = UIUtils.CreatePanel("TablePanel", ScreenRoot.transform,
                Vector2.zero, Vector2.one,
                new Vector2(16, 140), new Vector2(-16, -16),
                UIUtils.ColorPanel).transform;
        }

        public override void RefreshData()
        {
            _fixturesContainer.gameObject.SetActive(_currentTab == 0);
            _tableContainer.gameObject.SetActive(_currentTab == 1);
            if (_currentTab == 0) RebuildFixtures();
            else RebuildTable();
        }

        private void RebuildFixtures()
        {
            if (_fixturesContainer == null) return;
            for (int i = _fixturesContainer.childCount - 1; i >= 0; i--)
                Destroy(_fixturesContainer.GetChild(i).gameObject);

            UIUtils.CreateText("Head", _fixturesContainer,
                $"SEASON PROGRESS: Week {GameManager.TimeSystem.CurrentWeek} / {GameManager.Season.TotalWeeks}", 16,
                TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -36), Vector2.zero, FontStyle.Bold);

            var fixtures = GameManager.Season.AllFixtures;
            float y = -76f;
            int playedCount = 0;
            foreach (var f in fixtures)
            {
                if (f.IsPlayed) playedCount++;
                var card = UIUtils.CreatePanel($"Fix_{f.FixtureId}", _fixturesContainer,
                    new Vector2(0, 1), new Vector2(1, 1),
                    new Vector2(12, y - 72), new Vector2(-12, y),
                    f.IsPlayed ? new Color(0.12f, 0.18f, 0.15f, 0.9f) :
                    f.CanPlayNow ? new Color(0.25f, 0.2f, 0.12f, 0.9f) :
                    new Color(0.14f, 0.15f, 0.2f, 0.9f));

                UIUtils.CreateText("Week", card.transform, $"W{f.ScheduledWeek}", 12,
                    TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                    new Vector2(0, 0), new Vector2(0.12f, 1),
                    new Vector2(12, 0), Vector2.zero, FontStyle.Bold);

                UIUtils.CreateText("Opp", card.transform, $"vs {f.OpponentName}", 16,
                    TextAnchor.MiddleLeft, UIUtils.ColorText,
                    new Vector2(0.12f, 0.4f), new Vector2(0.5f, 0.95f),
                    new Vector2(8, 0), Vector2.zero, FontStyle.Bold);

                UIUtils.CreateText("Diff", card.transform,
                    new string('★', Mathf.Clamp(f.DifficultyStars, 1, 5)), 11,
                    TextAnchor.MiddleLeft,
                    f.DifficultyStars <= 2 ? new Color(0.4f, 0.9f, 0.5f) :
                    f.DifficultyStars <= 3 ? new Color(0.9f, 0.8f, 0.3f) : new Color(0.95f, 0.4f, 0.35f),
                    new Vector2(0.12f, 0f), new Vector2(0.4f, 0.4f),
                    new Vector2(8, 0), Vector2.zero);

                if (f.IsPlayed)
                {
                    var resCol = f.Result == MatchResult.Win ? new Color(0.4f, 0.9f, 0.5f) :
                        f.Result == MatchResult.Draw ? new Color(0.8f, 0.8f, 0.3f) : new Color(0.9f, 0.4f, 0.35f);
                    UIUtils.CreateText("Score", card.transform,
                        $"{f.OurScore} - {f.OpponentScore}", 22,
                        TextAnchor.MiddleCenter, resCol,
                        new Vector2(0.45f, 0.1f), new Vector2(0.75f, 0.9f),
                        Vector2.zero, Vector2.zero, FontStyle.Bold);

                    UIUtils.CreateText("Result", card.transform, f.Result.ToString().ToUpper(), 12,
                        TextAnchor.MiddleCenter, resCol,
                        new Vector2(0.45f, 0f), new Vector2(0.75f, 0.15f),
                        Vector2.zero, Vector2.zero);
                }
                else
                {
                    UIUtils.CreateText("Status", card.transform,
                        f.CanPlayNow ? "▶ READY" : "UPCOMING", 14,
                        TextAnchor.MiddleCenter,
                        f.CanPlayNow ? UIUtils.ColorAccent : UIUtils.ColorTextDim,
                        new Vector2(0.45f, 0f), new Vector2(0.75f, 1f),
                        Vector2.zero, Vector2.zero, FontStyle.Bold);
                }

                UIUtils.CreateText("Prize", card.transform, $"${f.PrizeMoney:0}", 12,
                    TextAnchor.MiddleRight, UIUtils.ColorWarning,
                    new Vector2(0.75f, 0.5f), new Vector2(1, 1f),
                    Vector2.zero, new Vector2(-12, 0), FontStyle.Bold);

                UIUtils.CreateText("Gate", card.transform, $"+${f.TicketRevenue:0} gate", 10,
                    TextAnchor.MiddleRight, UIUtils.ColorTextDim,
                    new Vector2(0.75f, 0f), new Vector2(1, 0.5f),
                    Vector2.zero, new Vector2(-12, 0));

                y -= 82f;
            }
        }

        private void RebuildTable()
        {
            if (_tableContainer == null) return;
            for (int i = _tableContainer.childCount - 1; i >= 0; i--)
                Destroy(_tableContainer.GetChild(i).gameObject);

            var table = GameManager.Season.LeagueTable.OrderByDescending(t => t.Points)
                .ThenByDescending(t => t.GoalDifference).ToList();

            UIUtils.CreateText("OurPos", _tableContainer,
                $"CURRENT POSITION: #{table.FindIndex(t => t.IsUs) + 1}   " +
                $"Points: {table.First(t => t.IsUs).Points}   " +
                $"GD: {table.First(t => t.IsUs).GoalDifference}",
                16, TextAnchor.MiddleCenter, UIUtils.ColorAccent,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -36), Vector2.zero, FontStyle.Bold);

            float y = -80f;
            var header = UIUtils.CreatePanel("Header", _tableContainer,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(12, y - 34), new Vector2(-12, y),
                new Color(0.2f, 0.2f, 0.25f, 1f));
            y -= 46f;

            string[] hdrs = { "#", "TEAM", "P", "W", "D", "L", "GF", "GA", "GD", "PTS" };
            float[] widths = { 0.06f, 0.34f, 0.06f, 0.06f, 0.06f, 0.06f, 0.08f, 0.08f, 0.08f, 0.12f };
            float cx = 0;
            for (int h = 0; h < hdrs.Length; h++)
            {
                UIUtils.CreateText($"H_{h}", header.transform, hdrs[h], 11,
                    TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                    new Vector2(cx, 0), new Vector2(cx + widths[h], 1),
                    new Vector2(4, 0), new Vector2(-4, 0), FontStyle.Bold);
                cx += widths[h];
            }

            for (int rk = 0; rk < table.Count; rk++)
            {
                var t = table[rk];
                var row = UIUtils.CreatePanel($"Row_{rk}", _tableContainer,
                    new Vector2(0, 1), new Vector2(1, 1),
                    new Vector2(12, y - 34), new Vector2(-12, y),
                    t.IsUs ? new Color(0.2f, 0.4f, 0.55f, 0.95f) :
                    rk < 2 ? new Color(0.15f, 0.35f, 0.2f, 0.7f) :
                    rk >= table.Count - 2 ? new Color(0.35f, 0.15f, 0.15f, 0.7f) :
                    UIUtils.ColorPanelLight);

                string[] vals = {
                    $"{rk + 1}", t.TeamName, $"{t.Played}",
                    $"{t.Won}", $"{t.Drawn}", $"{t.Lost}",
                    $"{t.GoalsFor}", $"{t.GoalsAgainst}",
                    $"{(t.GoalDifference >= 0 ? "+" : "")}{t.GoalDifference}", $"{t.Points}"
                };
                float rx = 0;
                for (int c = 0; c < vals.Length; c++)
                {
                    UIUtils.CreateText($"C_{c}", row.transform, vals[c], 12,
                        TextAnchor.MiddleCenter,
                        c == 9 ? UIUtils.ColorWarning : t.IsUs ? UIUtils.ColorText : UIUtils.ColorTextDim,
                        new Vector2(rx, 0), new Vector2(rx + widths[c], 1),
                        new Vector2(4, 0), new Vector2(-4, 0),
                        c == 9 ? FontStyle.Bold : FontStyle.Normal);
                    rx += widths[c];
                }
                y -= 42f;
            }
        }
    }

    public class FinanceScreen : UIScreenBase
    {
        private Transform _summaryContainer, _historyContainer;
        private int _currentTab = 0;

        protected override void CreateUI()
        {
            ScreenRoot = UIUtils.CreatePanel("FinanceScreen", ParentTransform,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0.05f, 0.07f, 0.06f, 1f));

            UIUtils.CreateText("Title", ScreenRoot.transform, "💰 FINANCE", 32,
                TextAnchor.MiddleCenter, new Color(0.95f, 0.85f, 0.35f),
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -56), Vector2.zero, FontStyle.Bold);

            UIUtils.CreateButton("BtnBack", ScreenRoot.transform, "← BACK",
                new Vector2(0.02f, 1f), new Vector2(0.12f, 1f),
                new Vector2(0, -64), new Vector2(0, -16),
                () => GameManager.UIManager.ShowScreen(UIScreen.Dashboard),
                new Color(0.3f, 0.35f, 0.45f), fontSize: 16);

            UIUtils.CreateButton("TabSum", ScreenRoot.transform, "SUMMARY",
                new Vector2(0.3f, 1f), new Vector2(0.5f, 1f),
                new Vector2(0, -96), new Vector2(0, -60),
                () => { _currentTab = 0; RefreshData(); },
                new Color(0.6f, 0.5f, 0.2f), fontSize: 14);

            UIUtils.CreateButton("TabHist", ScreenRoot.transform, "HISTORY",
                new Vector2(0.5f, 1f), new Vector2(0.7f, 1f),
                new Vector2(0, -96), new Vector2(0, -60),
                () => { _currentTab = 1; RefreshData(); },
                new Color(0.3f, 0.3f, 0.4f), fontSize: 14);

            _summaryContainer = UIUtils.CreatePanel("SumPanel", ScreenRoot.transform,
                Vector2.zero, Vector2.one,
                new Vector2(16, 140), new Vector2(-16, -16),
                UIUtils.ColorPanel).transform;

            _historyContainer = UIUtils.CreatePanel("HistPanel", ScreenRoot.transform,
                Vector2.zero, Vector2.one,
                new Vector2(16, 140), new Vector2(-16, -16),
                UIUtils.ColorPanel).transform;
        }

        public override void RefreshData()
        {
            _summaryContainer.gameObject.SetActive(_currentTab == 0);
            _historyContainer.gameObject.SetActive(_currentTab == 1);
            if (_currentTab == 0) RebuildSummary();
            else RebuildHistory();
        }

        private void RebuildSummary()
        {
            if (_summaryContainer == null) return;
            for (int i = _summaryContainer.childCount - 1; i >= 0; i--)
                Destroy(_summaryContainer.GetChild(i).gameObject);

            var fin = GameManager.Finance;
            float y = -32f;

            var balancePanel = UIUtils.CreatePanel("Balance", _summaryContainer,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(12, y - 120), new Vector2(-12, y),
                new Color(0.25f, 0.3f, 0.15f, 0.9f));
            y -= 132f;

            UIUtils.CreateText("BalT", balancePanel.transform, "CURRENT BALANCE", 12,
                TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                new Vector2(0, 0.65f), new Vector2(1, 1), Vector2.zero, Vector2.zero);

            UIUtils.CreateText("BalV", balancePanel.transform,
                $"${fin.Balance:0,0}", 42, TextAnchor.MiddleCenter,
                fin.Balance >= 0 ? new Color(0.55f, 1f, 0.45f) : new Color(1f, 0.4f, 0.35f),
                new Vector2(0, 0.1f), new Vector2(1, 0.7f), Vector2.zero, Vector2.zero, FontStyle.Bold);

            var weekPanel = UIUtils.CreatePanel("WeekPanel", _summaryContainer,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(12, y - 200), new Vector2(-12, y),
                UIUtils.ColorPanelLight);
            y -= 212f;

            UIUtils.CreateText("WkT", weekPanel.transform, "WEEKLY PROJECTION", 14,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 0.9f), new Vector2(1, 1), new Vector2(20, 0), Vector2.zero, FontStyle.Bold);

            var incomes = new (string L, float V)[]
            {
                ("SPONSORSHIP", fin.WeeklySponsorship),
                ("TICKET AVG", fin.AverageTicketRevenuePerMatch),
            };
            var expenses = new (string L, float V)[]
            {
                ("WAGES", fin.TotalWeeklyWages),
                ("MEDICAL EST", fin.EstimatedWeeklyMedicalCost),
                ("TRAINING EST", fin.EstimatedWeeklyTrainingCost),
            };
            float cy = 0.78f;
            float totalIn = 0, totalOut = 0;
            UIUtils.CreateText("InH", weekPanel.transform, "INCOME", 11,
                TextAnchor.MiddleLeft, new Color(0.4f, 0.9f, 0.5f),
                new Vector2(0, cy - 0.06f), new Vector2(1, cy),
                new Vector2(20, 0), new Vector2(-20, 0), FontStyle.Bold);
            cy -= 0.08f;
            foreach (var inc in incomes)
            {
                UIUtils.CreateText($"In_L_{inc.L}", weekPanel.transform, inc.L, 11,
                    TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                    new Vector2(0.05f, cy - 0.05f), new Vector2(0.6f, cy), new Vector2(0, 0), Vector2.zero);
                UIUtils.CreateText($"In_V_{inc.L}", weekPanel.transform, $"+${inc.V:0}", 11,
                    TextAnchor.MiddleRight, new Color(0.4f, 0.9f, 0.5f),
                    new Vector2(0.6f, cy - 0.05f), new Vector2(1, cy), new Vector2(0, 0), new Vector2(-20, 0));
                totalIn += inc.V;
                cy -= 0.065f;
            }
            cy -= 0.03f;
            UIUtils.CreateText("OutH", weekPanel.transform, "EXPENSES", 11,
                TextAnchor.MiddleLeft, new Color(0.9f, 0.4f, 0.35f),
                new Vector2(0, cy - 0.06f), new Vector2(1, cy),
                new Vector2(20, 0), new Vector2(-20, 0), FontStyle.Bold);
            cy -= 0.08f;
            foreach (var exp in expenses)
            {
                UIUtils.CreateText($"Ex_L_{exp.L}", weekPanel.transform, exp.L, 11,
                    TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                    new Vector2(0.05f, cy - 0.05f), new Vector2(0.6f, cy), new Vector2(0, 0), Vector2.zero);
                UIUtils.CreateText($"Ex_V_{exp.L}", weekPanel.transform, $"-${exp.V:0}", 11,
                    TextAnchor.MiddleRight, new Color(0.9f, 0.4f, 0.35f),
                    new Vector2(0.6f, cy - 0.05f), new Vector2(1, cy), new Vector2(0, 0), new Vector2(-20, 0));
                totalOut += exp.V;
                cy -= 0.065f;
            }
            cy -= 0.04f;
            float net = totalIn - totalOut;
            UIUtils.CreateText("NetL", weekPanel.transform, "NET / WEEK", 12,
                TextAnchor.MiddleLeft, UIUtils.ColorText,
                new Vector2(0.05f, cy - 0.08f), new Vector2(0.5f, cy),
                new Vector2(0, 0), Vector2.zero, FontStyle.Bold);
            UIUtils.CreateText("NetV", weekPanel.transform,
                $"{(net >= 0 ? "+" : "")}${net:0,0}", 16,
                TextAnchor.MiddleRight, net >= 0 ? new Color(0.4f, 0.9f, 0.5f) : new Color(0.9f, 0.4f, 0.35f),
                new Vector2(0.5f, cy - 0.08f), new Vector2(1, cy),
                new Vector2(0, 0), new Vector2(-20, 0), FontStyle.Bold);

            var seasonPanel = UIUtils.CreatePanel("SeasonPanel", _summaryContainer,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(12, y - 180), new Vector2(-12, y),
                UIUtils.ColorPanelLight);
            y -= 192f;

            UIUtils.CreateText("SeasH", seasonPanel.transform, "SEASON TOTAL", 14,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 0.9f), new Vector2(1, 1), new Vector2(20, 0), Vector2.zero, FontStyle.Bold);

            var statLines = new (string L, string V, Color C)[]
            {
                ("TOTAL REVENUE", $"${fin.TotalRevenue:0,0}", new Color(0.4f, 0.9f, 0.5f)),
                ("TOTAL EXPENSES", $"${fin.TotalExpenses:0,0}", new Color(0.9f, 0.4f, 0.35f)),
                ("PRIZE MONEY", $"${fin.TotalPrizeMoney:0,0}", UIUtils.ColorWarning),
                ("MATCHES PLAYED", $"{GameManager.Stats.MatchesPlayed}", UIUtils.ColorText),
                ("INJURY COSTS", $"${fin.TotalMedicalCost:0,0}", UIUtils.ColorDanger),
                ("RUNWAY (wks)", fin.Balance > 0 && totalOut > 0
                    ? $"{(int)(fin.Balance / Mathf.Max(1, totalOut - fin.WeeklySponsorship))}"
                    : fin.Balance > 0 ? "∞" : "BROKE",
                    fin.Balance > 0 ? new Color(0.4f, 0.9f, 0.5f) : UIUtils.ColorDanger),
            };
            float sy = 0.78f;
            foreach (var s in statLines)
            {
                UIUtils.CreateText($"SL_{s.L}", seasonPanel.transform, s.L, 11,
                    TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                    new Vector2(0.05f, sy - 0.1f), new Vector2(0.55f, sy),
                    new Vector2(20, 0), Vector2.zero);
                UIUtils.CreateText($"SV_{s.L}", seasonPanel.transform, s.V, 14,
                    TextAnchor.MiddleRight, s.C,
                    new Vector2(0.55f, sy - 0.1f), new Vector2(1, sy),
                    new Vector2(0, 0), new Vector2(-20, 0), FontStyle.Bold);
                sy -= 0.135f;
            }
        }

        private void RebuildHistory()
        {
            if (_historyContainer == null) return;
            for (int i = _historyContainer.childCount - 1; i >= 0; i--)
                Destroy(_historyContainer.GetChild(i).gameObject);

            var hist = GameManager.Finance.RecentTransactions
                .OrderByDescending(t => t.TimestampTicks).Take(30).ToList();

            UIUtils.CreateText("HistH", _historyContainer,
                $"RECENT TRANSACTIONS ({hist.Count})", 14,
                TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -36), Vector2.zero, FontStyle.Bold);

            float y = -72f;
            if (hist.Count == 0)
            {
                UIUtils.CreateText("Empty", _historyContainer, "No transactions yet. Play matches to generate activity!",
                    13, TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                    new Vector2(0, 0.5f), new Vector2(1, 0.6f), Vector2.zero, Vector2.zero);
                return;
            }

            foreach (var t in hist)
            {
                var row = UIUtils.CreatePanel($"T_{t.TimestampTicks}", _historyContainer,
                    new Vector2(0, 1), new Vector2(1, 1),
                    new Vector2(12, y - 40), new Vector2(-12, y),
                    UIUtils.ColorPanelLight);

                UIUtils.CreateText("Type", row.transform, t.Type.ToString(), 11,
                    TextAnchor.MiddleLeft,
                    t.Amount >= 0 ? new Color(0.4f, 0.9f, 0.5f) : new Color(0.9f, 0.4f, 0.35f),
                    new Vector2(0, 0.55f), new Vector2(0.35f, 1f),
                    new Vector2(12, 0), Vector2.zero, FontStyle.Bold);

                UIUtils.CreateText("Desc", row.transform, t.Description, 10,
                    TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                    new Vector2(0, 0), new Vector2(0.7f, 0.55f),
                    new Vector2(12, 0), Vector2.zero);

                UIUtils.CreateText("Wk", row.transform, $"W{t.WeekNumber}", 9,
                    TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                    new Vector2(0.35f, 0.55f), new Vector2(0.5f, 1f),
                    new Vector2(8, 0), Vector2.zero);

                UIUtils.CreateText("Amt", row.transform,
                    $"{(t.Amount >= 0 ? "+" : "")}${t.Amount:0}", 13,
                    TextAnchor.MiddleRight,
                    t.Amount >= 0 ? new Color(0.4f, 0.9f, 0.5f) : new Color(0.9f, 0.4f, 0.35f),
                    new Vector2(0.7f, 0), new Vector2(1, 1f),
                    Vector2.zero, new Vector2(-12, 0), FontStyle.Bold);

                y -= 48f;
            }
        }
    }

    public class TutorialScreen : UIScreenBase
    {
        private int _currentStep;
        private Transform _contentContainer;
        private Text _stepCounter, _title, _body;

        protected override void CreateUI()
        {
            ScreenRoot = UIUtils.CreatePanel("TutorialScreen", ParentTransform,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0.02f, 0.04f, 0.08f, 0.98f));

            UIUtils.CreateText("Title", ScreenRoot.transform, "📖 TUTORIAL", 32,
                TextAnchor.MiddleCenter, new Color(0.4f, 0.8f, 1f),
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -56), Vector2.zero, FontStyle.Bold);

            _stepCounter = UIUtils.CreateText("Counter", ScreenRoot.transform, "", 14,
                TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -92), Vector2.zero, FontStyle.Bold)
                .GetComponent<Text>();

            _contentContainer = UIUtils.CreatePanel("Content", ScreenRoot.transform,
                new Vector2(0.1f, 0.25f), new Vector2(0.9f, 0.85f),
                Vector2.zero, Vector2.zero, new Color(0.1f, 0.14f, 0.2f, 0.95f)).transform;

            _title = UIUtils.CreateText("TutTitle", _contentContainer, "", 24,
                TextAnchor.MiddleCenter, UIUtils.ColorAccent,
                new Vector2(0, 0.8f), new Vector2(1, 1),
                new Vector2(32, 0), new Vector2(-32, 0), FontStyle.Bold).GetComponent<Text>();

            _body = UIUtils.CreateText("TutBody", _contentContainer, "", 15,
                TextAnchor.UpperLeft, UIUtils.ColorText,
                new Vector2(0, 0.05f), new Vector2(1, 0.78f),
                new Vector2(40, 0), new Vector2(-40, 0)).GetComponent<Text>();
            _body.horizontalOverflow = HorizontalWrapMode.Wrap;
            _body.verticalOverflow = VerticalWrapMode.Truncate;

            UIUtils.CreateButton("BtnPrev", ScreenRoot.transform, "◀ PREV",
                new Vector2(0.2f, 0.08f), new Vector2(0.4f, 0.18f),
                Vector2.zero, Vector2.zero, PrevStep,
                new Color(0.3f, 0.35f, 0.5f), fontSize: 18);

            UIUtils.CreateButton("BtnNext", ScreenRoot.transform, "NEXT ▶",
                new Vector2(0.6f, 0.08f), new Vector2(0.8f, 0.18f),
                Vector2.zero, Vector2.zero, NextStep,
                new Color(0.25f, 0.5f, 0.8f), fontSize: 18);

            UIUtils.CreateButton("BtnSkip", ScreenRoot.transform, "SKIP →",
                new Vector2(0.82f, 1f), new Vector2(0.98f, 1f),
                new Vector2(0, -64), new Vector2(0, -16),
                () => CompleteTutorial(),
                new Color(0.3f, 0.3f, 0.4f), fontSize: 14);
        }

        public override void RefreshData()
        {
            _currentStep = 0;
            UpdateStep();
        }

        private void PrevStep()
        {
            _currentStep = Mathf.Max(0, _currentStep - 1);
            UpdateStep();
        }

        private void NextStep()
        {
            var steps = GameManager.ConfigLoader.Tutorial?.Steps;
            int max = steps != null ? steps.Count - 1 : 6;
            if (_currentStep >= max) CompleteTutorial();
            else { _currentStep++; UpdateStep(); }
        }

        private void UpdateStep()
        {
            var steps = GameManager.ConfigLoader.Tutorial?.Steps;
            int total = steps != null && steps.Count > 0 ? steps.Count : 7;
            _stepCounter.text = $"STEP {_currentStep + 1} / {total}";
            if (steps != null && _currentStep < steps.Count)
            {
                _title.text = steps[_currentStep].Title;
                _body.text = steps[_currentStep].Body;
            }
            else
            {
                var defaults = new (string T, string B)[]
                {
                    ("🎯 GOAL", "You are a youth team manager. Balance training, matches and recovery to finish top of the league in 10 weeks. Every decision counts — over-training causes injuries, resting too much loses form."),
                    ("⚡ TRAINING", "Use the TRAINING panel to schedule drills. Each drill improves specific attributes but increases fatigue. Higher fatigue = lower success rate + higher injury risk. Preview the cost and effects before committing!"),
                    ("💊 RECOVERY", "After heavy sessions, use the RECOVERY center. Fatigued players underperform and get injured easily. Select injured players first — physiotherapy and medical options reduce recovery time."),
                    ("⚽ MATCHES", "Matches are scheduled every 2 weeks. Pick 7-11 players — Auto-XI picks the most ready. Check the preview: win chance, injury risk, and team fatigue. Wins give prize money, losses hurt morale."),
                    ("📊 SQUAD & FINANCE", "Open SQUAD to check every player's 5 attributes and form. Open FINANCE to track weekly wages, sponsorship, and medical costs — go broke and your training options get limited!"),
                    ("⚠️ THE BALANCE", "The game punishes extremes. If you field tired players → injuries. If you skip training → low ratings → losses. If you spend lavishly on medical → no runway. Rotate the squad wisely."),
                    ("🏆 WINNING", "Finish top 2 in the league table for the best ending. Complete all fixtures before season end. Use hotkeys: T=Training, M=Match, R=Recovery, ESC=Pause, F1=Settings, Space=Advance Time. Good luck!"),
                };
                int i = Mathf.Clamp(_currentStep, 0, defaults.Length - 1);
                _title.text = defaults[i].T;
                _body.text = defaults[i].B;
            }
        }

        private void CompleteTutorial()
        {
            GameManager.SaveSystem.HasSeenTutorial = true;
            GameManager.SaveSystem.SaveSettings();
            GameManager.StateMachine.GetState<TutorialState>()?.CompleteTutorial();
        }
    }

    public class SettingsScreen : UIScreenBase
    {
        private Transform _content;
        private GameSettings _staging;
        private int _rebindActionIdx = -1;
        private string _rebindSlot = "";

        protected override void CreateUI()
        {
            ScreenRoot = UIUtils.CreatePanel("SettingsScreen", ParentTransform,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0.04f, 0.04f, 0.06f, 0.98f));

            UIUtils.CreateText("Title", ScreenRoot.transform, "⚙️ SETTINGS", 32,
                TextAnchor.MiddleCenter, new Color(0.8f, 0.8f, 0.9f),
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -56), Vector2.zero, FontStyle.Bold);

            UIUtils.CreateButton("BtnBack", ScreenRoot.transform, "← BACK",
                new Vector2(0.02f, 1f), new Vector2(0.12f, 1f),
                new Vector2(0, -64), new Vector2(0, -16),
                () =>
                {
                    GameManager.ApplySettings(_staging);
                    GameManager.SaveSystem.SaveSettings();
                    GameManager.StateMachine.GetState<SettingsState>()?.CloseSettings();
                }, new Color(0.3f, 0.35f, 0.45f), fontSize: 16);

            UIUtils.CreateButton("BtnReset", ScreenRoot.transform, "RESET",
                new Vector2(0.86f, 1f), new Vector2(0.98f, 1f),
                new Vector2(0, -64), new Vector2(0, -16),
                () => { _staging = new GameSettings(); RefreshData(); },
                new Color(0.6f, 0.2f, 0.25f), fontSize: 14);

            _content = UIUtils.CreatePanel("Content", ScreenRoot.transform,
                Vector2.zero, Vector2.one,
                new Vector2(16, 96), new Vector2(-16, -16),
                UIUtils.ColorPanel).transform;

            _staging = GameManager.SaveSystem.Settings?.Clone() ?? new GameSettings();
        }

        public override void RefreshData()
        {
            RebuildContent();
        }

        private void RebuildContent()
        {
            if (_content == null) return;
            for (int i = _content.childCount - 1; i >= 0; i--)
                Destroy(_content.GetChild(i).gameObject);
            if (_staging == null) _staging = new GameSettings();

            float y = -24f;
            DrawSection(ref y, "DISPLAY");
            DrawSlider(ref y, "MASTER VOLUME", _staging.MasterVolume, 0f, 1f,
                v => { _staging.MasterVolume = v; GameManager.Audio.SetVolume(VolumeChannel.Master, v); });
            DrawSlider(ref y, "MUSIC VOLUME", _staging.MusicVolume, 0f, 1f,
                v => { _staging.MusicVolume = v; GameManager.Audio.SetVolume(VolumeChannel.Music, v); });
            DrawSlider(ref y, "SFX VOLUME", _staging.SfxVolume, 0f, 1f,
                v => { _staging.SfxVolume = v; GameManager.Audio.SetVolume(VolumeChannel.SFX, v); });
            DrawSlider(ref y, "UI VOLUME", _staging.UiVolume, 0f, 1f,
                v => { _staging.UiVolume = v; GameManager.Audio.SetVolume(VolumeChannel.UI, v); });

            DrawSection(ref y, "DISPLAY");
            DrawDropdown(ref y, "TARGET FRAMERATE",
                new[] { "30 FPS", "60 FPS", "120 FPS", "144 FPS", "UNLIMITED" },
                new[] { 30, 60, 120, 144, 0 }, _staging.TargetFramerate,
                v => _staging.TargetFramerate = v);

            DrawToggle(ref y, "V-SYNC", _staging.VSync, v => _staging.VSync = v);
            DrawToggle(ref y, "SHOW FPS STATS", _staging.ShowPerformanceStats,
                v => { _staging.ShowPerformanceStats = v; GameManager.Instance?.TogglePerfStats(v); });

            int qIdx = Mathf.Clamp(_staging.QualityLevel, 0, QualitySettings.names.Length - 1);
            DrawDropdown(ref y, "QUALITY LEVEL", QualitySettings.names,
                Enumerable.Range(0, QualitySettings.names.Length).ToArray(),
                qIdx, v => _staging.QualityLevel = v);

            DrawSection(ref y, "ANIMATION");
            DrawSlider(ref y, "UI ANIMATION SPEED", _staging.UiAnimationSpeed, 0.3f, 2f,
                v => _staging.UiAnimationSpeed = v);
            DrawSlider(ref y, "SCREEN SHAKE", _staging.ScreenShakeIntensity, 0f, 1f,
                v => _staging.ScreenShakeIntensity = v);

            DrawSection(ref y, "INPUT BINDINGS");
            DrawInputBindings(ref y);
        }

        private void DrawSection(ref float y, string title)
        {
            UIUtils.CreateText($"Sec_{title}", _content, title, 13,
                TextAnchor.MiddleLeft, new Color(0.5f, 0.6f, 0.9f),
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(20, y - 4), new Vector2(-20, y), FontStyle.Bold);
            y -= 20f;
            var line = UIUtils.CreatePanel($"Line_{title}", _content,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(20, y - 2), new Vector2(-20, y),
                new Color(0.3f, 0.35f, 0.45f, 0.5f));
            y -= 14f;
        }

        private void DrawSlider(ref float y, string label, float value, float min, float max, Action<float> onSet)
        {
            var row = UIUtils.CreatePanel($"Slider_{label}", _content,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(16, y - 40), new Vector2(-16, y),
                UIUtils.ColorPanelLight);

            UIUtils.CreateText($"L_{label}", row.transform, label, 11,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 0.55f), new Vector2(0.5f, 1), new Vector2(16, 0), Vector2.zero);
            UIUtils.CreateText($"V_{label}", row.transform,
                Mathf.Abs(max - min) > 2 ? value.ToString("0") : value.ToString("0.00"), 14,
                TextAnchor.MiddleRight, UIUtils.ColorAccent,
                new Vector2(0.5f, 0.55f), new Vector2(1, 1), Vector2.zero, new Vector2(-16, 0), FontStyle.Bold);

            var sliderObj = new GameObject($"Slider", typeof(RectTransform), typeof(Slider), typeof(Image));
            sliderObj.transform.SetParent(row.transform, false);
            var rt = (RectTransform)sliderObj.transform;
            rt.anchorMin = new Vector2(0, 0); rt.anchorMax = new Vector2(1, 0.5f);
            rt.offsetMin = new Vector2(16, 4); rt.offsetMax = new Vector2(-16, -2);
            var bg = sliderObj.GetComponent<Image>();
            bg.color = new Color(0.15f, 0.18f, 0.25f);
            var slider = sliderObj.GetComponent<Slider>();
            slider.minValue = min; slider.maxValue = max; slider.value = value;
            slider.onValueChanged.AddListener(newVal => { onSet?.Invoke(newVal); RefreshData(); });

            var fillArea = new GameObject("FillArea", typeof(RectTransform));
            fillArea.transform.SetParent(sliderObj.transform, false);
            var faRt = (RectTransform)fillArea.transform;
            faRt.anchorMin = Vector2.zero; faRt.anchorMax = Vector2.one;
            faRt.offsetMin = new Vector2(4, 6); faRt.offsetMax = new Vector2(-4, -6);

            var fill = new GameObject("Fill", typeof(RectTransform), typeof(Image));
            fill.transform.SetParent(fillArea.transform, false);
            var fillImg = fill.GetComponent<Image>();
            fillImg.color = new Color(0.35f, 0.55f, 0.9f);
            var fillRt = (RectTransform)fill.transform;
            fillRt.anchorMin = Vector2.zero; fillRt.anchorMax = Vector2.one;
            fillRt.offsetMin = Vector2.zero; fillRt.offsetMax = Vector2.zero;
            slider.fillRect = fillRt;

            var handleArea = new GameObject("HandleArea", typeof(RectTransform));
            handleArea.transform.SetParent(sliderObj.transform, false);
            var haRt = (RectTransform)handleArea.transform;
            haRt.anchorMin = Vector2.zero; haRt.anchorMax = Vector2.one;
            haRt.offsetMin = new Vector2(4, 4); haRt.offsetMax = new Vector2(-4, -4);

            var handle = new GameObject("Handle", typeof(RectTransform), typeof(Image));
            handle.transform.SetParent(handleArea.transform, false);
            var hImg = handle.GetComponent<Image>();
            hImg.color = Color.white;
            var hRt = (RectTransform)handle.transform;
            hRt.sizeDelta = new Vector2(12, 18);
            slider.handleRect = hRt;
            slider.targetGraphic = hImg;
            slider.direction = Slider.Direction.LeftToRight;

            y -= 52f;
        }

        private void DrawToggle(ref float y, string label, bool value, Action<bool> onSet)
        {
            var row = UIUtils.CreatePanel($"Toggle_{label}", _content,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(16, y - 36), new Vector2(-16, y),
                UIUtils.ColorPanelLight);

            UIUtils.CreateText($"L_{label}", row.transform, label, 12,
                TextAnchor.MiddleLeft, UIUtils.ColorText,
                new Vector2(0, 0), new Vector2(0.7f, 1),
                new Vector2(16, 0), Vector2.zero);

            var btn = UIUtils.CreateButton($"Btn_{label}", row.transform, value ? "✓ ON" : "✗ OFF",
                new Vector2(0.75f, 0.1f), new Vector2(0.98f, 0.9f),
                Vector2.zero, Vector2.zero,
                () => { onSet?.Invoke(!value); RefreshData(); },
                value ? new Color(0.3f, 0.65f, 0.4f) : new Color(0.4f, 0.25f, 0.25f), 14);

            y -= 46f;
        }

        private void DrawDropdown<T>(ref float y, string label, string[] names, T[] values, T current, Action<T> onSet)
            where T : IEquatable<T>
        {
            int curIdx = 0;
            for (int i = 0; i < values.Length; i++)
                if (values[i].Equals(current)) { curIdx = i; break; }

            var row = UIUtils.CreatePanel($"DD_{label}", _content,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(16, y - 38), new Vector2(-16, y),
                UIUtils.ColorPanelLight);

            UIUtils.CreateText($"L_{label}", row.transform, label, 11,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 0.55f), new Vector2(0.5f, 1),
                new Vector2(16, 0), Vector2.zero);

            UIUtils.CreateText($"V_{label}", row.transform, names[curIdx], 13,
                TextAnchor.MiddleRight, UIUtils.ColorAccent,
                new Vector2(0.5f, 0.55f), new Vector2(1, 1),
                Vector2.zero, new Vector2(-16, 0), FontStyle.Bold);

            UIUtils.CreateButton($"BtnPrev_{label}", row.transform, "◀",
                new Vector2(0.5f, 0f), new Vector2(0.6f, 0.5f),
                Vector2.zero, Vector2.zero,
                () => { int i = (curIdx - 1 + names.Length) % names.Length; onSet(values[i]); RefreshData(); },
                new Color(0.3f, 0.35f, 0.45f), 12);

            UIUtils.CreateButton($"BtnNext_{label}", row.transform, "▶",
                new Vector2(0.6f, 0f), new Vector2(0.7f, 0.5f),
                Vector2.zero, Vector2.zero,
                () => { int i = (curIdx + 1) % names.Length; onSet(values[i]); RefreshData(); },
                new Color(0.3f, 0.35f, 0.45f), 12);

            y -= 48f;
        }

        private void DrawInputBindings(ref float y)
        {
            if (_staging.InputBindings == null)
                _staging.InputBindings = InputManager.GetDefaultBindings();

            var actions = Enum.GetValues(typeof(GameAction)).Cast<GameAction>().ToArray();
            foreach (var act in actions)
            {
                if (!_staging.InputBindings.TryGetValue(act, out var kb)) kb = new KeyBinding();
                var row = UIUtils.CreatePanel($"KB_{act}", _content,
                    new Vector2(0, 1), new Vector2(1, 1),
                    new Vector2(16, y - 34), new Vector2(-16, y),
                    UIUtils.ColorPanelLight);

                UIUtils.CreateText($"Act_{act}", row.transform, act.ToString(), 10,
                    TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                    new Vector2(0, 0), new Vector2(0.3f, 1),
                    new Vector2(12, 0), Vector2.zero, FontStyle.Bold);

                DrawKeyButton(row.transform, "Primary", 0.32f, 0.6f, kb.PrimaryKey,
                    () => StartRebind((int)act, "primary"));
                DrawKeyButton(row.transform, "Secondary", 0.62f, 0.9f, kb.SecondaryKey,
                    () => StartRebind((int)act, "secondary"));

                y -= 42f;
                if (y < -1400) break;
            }
        }

        private void DrawKeyButton(Transform parent, string name, float xMin, float xMax, KeyCode key, Action onClick)
        {
            var rebinding = _rebindActionIdx >= 0 && _rebindSlot == name;
            var btn = UIUtils.CreateButton(name, parent,
                rebinding ? "LISTENING..." : key.ToString(),
                new Vector2(xMin, 0.1f), new Vector2(xMax, 0.9f),
                Vector2.zero, Vector2.zero, onClick,
                rebinding ? new Color(0.8f, 0.5f, 0.2f) :
                key != KeyCode.None ? new Color(0.2f, 0.35f, 0.55f) : new Color(0.2f, 0.2f, 0.25f), 11);
        }

        private void StartRebind(int actionIdx, string slot)
        {
            _rebindActionIdx = actionIdx;
            _rebindSlot = slot;
            GameManager.InputManager.StartRebind((GameAction)actionIdx, slot, kc =>
            {
                var act = (GameAction)_rebindActionIdx;
                if (!_staging.InputBindings.ContainsKey(act))
                    _staging.InputBindings[act] = new KeyBinding();
                var kb = _staging.InputBindings[act];
                if (_rebindSlot == "primary") kb.PrimaryKey = kc;
                else kb.SecondaryKey = kc;
                _staging.InputBindings[act] = kb;
                GameManager.InputManager.SetBindings(_staging.InputBindings);
                _rebindActionIdx = -1; _rebindSlot = "";
                RefreshData();
            });
            RefreshData();
        }
    }

    public class PauseScreen : UIScreenBase
    {
        private Transform _menuContainer;

        protected override void CreateUI()
        {
            ScreenRoot = UIUtils.CreatePanel("PauseScreen", ParentTransform,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0f, 0f, 0f, 0.7f));

            var dim = UIUtils.CreatePanel("Dim", ScreenRoot.transform,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0f, 0f, 0f, 0.5f));

            _menuContainer = UIUtils.CreatePanel("Menu", ScreenRoot.transform,
                new Vector2(0.3f, 0.15f), new Vector2(0.7f, 0.85f),
                Vector2.zero, Vector2.zero, new Color(0.1f, 0.12f, 0.18f, 0.98f)).transform;

            UIUtils.CreateText("Title", _menuContainer, "⏸ PAUSED", 36,
                TextAnchor.MiddleCenter, new Color(0.9f, 0.9f, 1f),
                new Vector2(0, 0.82f), new Vector2(1, 0.98f),
                Vector2.zero, Vector2.zero, FontStyle.Bold);

            UIUtils.CreateButton("BtnResume", _menuContainer, "▶ RESUME",
                new Vector2(0.1f, 0.68f), new Vector2(0.9f, 0.78f),
                Vector2.zero, Vector2.zero,
                () => GameManager.StateMachine.GetState<PausedState>()?.ResumeGame(),
                new Color(0.3f, 0.6f, 0.35f), 20);

            UIUtils.CreateButton("BtnTutorial", _menuContainer, "📖 TUTORIAL",
                new Vector2(0.1f, 0.56f), new Vector2(0.9f, 0.64f),
                Vector2.zero, Vector2.zero,
                () => GameManager.UIManager.ShowScreen(UIScreen.Tutorial),
                new Color(0.25f, 0.4f, 0.6f), 16);

            UIUtils.CreateButton("BtnSettings", _menuContainer, "⚙️ SETTINGS",
                new Vector2(0.1f, 0.44f), new Vector2(0.9f, 0.52f),
                Vector2.zero, Vector2.zero,
                () =>
                {
                    GameManager.StateMachine.ChangeState<SettingsState>();
                    GameManager.UIManager.ShowScreen(UIScreen.Settings);
                }, new Color(0.4f, 0.35f, 0.5f), 16);

            UIUtils.CreateButton("BtnSave", _menuContainer, "💾 SAVE GAME",
                new Vector2(0.1f, 0.32f), new Vector2(0.45f, 0.4f),
                Vector2.zero, Vector2.zero,
                () => { GameManager.SaveGame(); GameManager.FeedbackSystem?.ShowToast("Game saved!", FeedbackType.Success); },
                new Color(0.25f, 0.45f, 0.35f), 14);

            UIUtils.CreateButton("BtnLoad", _menuContainer, "📂 LOAD GAME",
                new Vector2(0.55f, 0.32f), new Vector2(0.9f, 0.4f),
                Vector2.zero, Vector2.zero,
                () =>
                {
                    if (GameManager.LoadGame())
                        GameManager.FeedbackSystem?.ShowToast("Game loaded!", FeedbackType.Success);
                    else
                        GameManager.FeedbackSystem?.ShowToast("No save found", FeedbackType.Warning);
                }, new Color(0.35f, 0.35f, 0.55f), 14);

            UIUtils.CreateButton("BtnQuit", _menuContainer, "🏠 MAIN MENU",
                new Vector2(0.1f, 0.16f), new Vector2(0.9f, 0.24f),
                Vector2.zero, Vector2.zero,
                () =>
                {
                    GameManager.SaveSystem.SaveSettings();
                    GameManager.StateMachine.ChangeState<MainMenuState>();
                    GameManager.UIManager.ShowScreen(UIScreen.Dashboard);
                }, new Color(0.55f, 0.25f, 0.25f), 16);

            UIUtils.CreateText("Hint", _menuContainer, "Press ESC to resume", 11,
                TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                new Vector2(0, 0.04f), new Vector2(1, 0.1f),
                Vector2.zero, Vector2.zero);
        }

        public override void RefreshData() { }
    }

    public class ResultScreen : UIScreenBase
    {
        private enum ResultKind { None, Training, Recovery, Match }
        private ResultKind _kind;
        private Transform _content;

        protected override void CreateUI()
        {
            ScreenRoot = UIUtils.CreatePanel("ResultScreen", ParentTransform,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0.02f, 0.03f, 0.05f, 0.98f));

            _content = UIUtils.CreatePanel("Content", ScreenRoot.transform,
                new Vector2(0.05f, 0.05f), new Vector2(0.95f, 0.95f),
                Vector2.zero, Vector2.zero, UIUtils.ColorPanel).transform;

            UIUtils.CreateButton("BtnClose", ScreenRoot.transform, "✓ CONTINUE",
                new Vector2(0.35f, 0.05f), new Vector2(0.65f, 0.12f),
                Vector2.zero, Vector2.zero,
                () =>
                {
                    switch (_kind)
                    {
                        case ResultKind.Training:
                            GameManager.StateMachine.GetState<TrainingState>()?.CompleteTraining();
                            GameManager.UIManager.ShowScreen(UIScreen.Dashboard);
                            break;
                        case ResultKind.Recovery:
                            GameManager.StateMachine.GetState<RecoveryState>()?.CompleteRecovery();
                            GameManager.UIManager.ShowScreen(UIScreen.Dashboard);
                            break;
                        case ResultKind.Match:
                            GameManager.StateMachine.GetState<MatchState>()?.CompleteMatch(true);
                            if (GameManager.Season.IsSeasonComplete)
                            {
                                GameManager.StateMachine.ChangeState<GameOverState>();
                            }
                            else GameManager.UIManager.ShowScreen(UIScreen.Dashboard);
                            break;
                    }
                    _kind = ResultKind.None;
                }, new Color(0.3f, 0.6f, 0.85f), 20);
        }

        public override void RefreshData() { }

        public void ShowTrainingResult(TrainingSessionResult result, List<TrainingPlayerFeedback> feedbacks)
        {
            _kind = ResultKind.Training;
            RebuildForTraining(result, feedbacks);
        }

        public void ShowRecoveryResult(RecoverySessionResult result)
        {
            _kind = ResultKind.Recovery;
            RebuildForRecovery(result);
        }

        public void ShowMatchResult(MatchSimulationResult result, FixtureModel fixture)
        {
            _kind = ResultKind.Match;
            RebuildForMatch(result, fixture);
        }

        private void ClearContent()
        {
            if (_content == null) return;
            for (int i = _content.childCount - 1; i >= 0; i--)
                Destroy(_content.GetChild(i).gameObject);
        }

        private void RebuildForTraining(TrainingSessionResult r, List<TrainingPlayerFeedback> fbs)
        {
            ClearContent();
            float y = -24f;
            UIUtils.CreateText("Title", _content, "🏋️ TRAINING COMPLETE", 30,
                TextAnchor.MiddleCenter, new Color(0.5f, 0.85f, 0.45f),
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, y), Vector2.zero, FontStyle.Bold);
            y -= 44f;

            UIUtils.CreateText("Drill", _content, $"{r.DrillName}  ·  {fbs.Count} players  ·  ${r.TotalCost:0}",
                16, TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, y), Vector2.zero);
            y -= 36f;

            var sumPanel = UIUtils.CreatePanel("Sum", _content,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(16, y - 96), new Vector2(-16, y), UIUtils.ColorPanelLight);
            y -= 108f;
            UIUtils.CreateProgressBar("Success", sumPanel.transform,
                new Vector2(0, 0.55f), new Vector2(1, 0.8f),
                new Vector2(16, 0), new Vector2(-16, 0),
                r.AverageSuccessRate, new Color(0.45f, 0.85f, 0.45f),
                $"SUCCESS RATE {r.AverageSuccessRate:0}%");
            UIUtils.CreateProgressBar("AvgFat", sumPanel.transform,
                new Vector2(0, 0.15f), new Vector2(1, 0.4f),
                new Vector2(16, 0), new Vector2(-16, 0),
                r.AverageFatigueIncrease * 3,
                UIUtils.GetRiskColor(r.AverageFatigueIncrease * 3, true),
                $"AVG FATIGUE +{r.AverageFatigueIncrease:0}");

            if (r.PlayersInjuredThisSession.Count > 0)
            {
                UIUtils.CreateText("InjAlert", _content,
                    $"⚠️  {r.PlayersInjuredThisSession.Count} NEW INJURIES: {string.Join(", ", r.PlayersInjuredThisSession)}",
                    14, TextAnchor.MiddleCenter, UIUtils.ColorDanger,
                    new Vector2(0, 1), new Vector2(1, 1),
                    new Vector2(16, y), new Vector2(-16, y), FontStyle.Bold);
                y -= 26f;
            }

            UIUtils.CreateText("FBHead", _content, "PLAYER BREAKDOWN", 13,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(20, y), Vector2.zero, FontStyle.Bold);
            y -= 22f;

            foreach (var fb in fbs.Take(12))
            {
                var row = UIUtils.CreatePanel($"FB_{fb.PlayerId}", _content,
                    new Vector2(0, 1), new Vector2(1, 1),
                    new Vector2(12, y - 42), new Vector2(-12, y), UIUtils.ColorPanelLight);
                UIUtils.CreateText("Name", row.transform, fb.PlayerName, 13,
                    TextAnchor.MiddleLeft, UIUtils.ColorText,
                    new Vector2(0, 0.55f), new Vector2(0.35f, 1),
                    new Vector2(12, 0), Vector2.zero, FontStyle.Bold);
                UIUtils.CreateText("Result", row.transform,
                    fb.WasInjured ? "INJURED" : fb.WasExhausted ? "EXHAUSTED" :
                    fb.SuccessRate >= 75 ? "EXCELLENT" : fb.SuccessRate >= 50 ? "GOOD" : "POOR", 11,
                    TextAnchor.MiddleCenter,
                    fb.WasInjured ? UIUtils.ColorDanger : fb.WasExhausted ? UIUtils.ColorWarning :
                    fb.SuccessRate >= 75 ? new Color(0.4f, 0.9f, 0.5f) :
                    fb.SuccessRate >= 50 ? new Color(0.85f, 0.75f, 0.35f) : UIUtils.ColorDanger,
                    new Vector2(0.35f, 0.55f), new Vector2(0.55f, 1),
                    Vector2.zero, Vector2.zero, FontStyle.Bold);
                UIUtils.CreateText("Gains", row.transform, fb.AttributeGainSummary, 10,
                    TextAnchor.MiddleLeft, new Color(0.4f, 0.9f, 0.5f),
                    new Vector2(0, 0.05f), new Vector2(0.65f, 0.55f),
                    new Vector2(12, 0), Vector2.zero);
                UIUtils.CreateText("Fat", row.transform, $"FAT +{fb.FatigueGain:0}", 11,
                    TextAnchor.MiddleRight, UIUtils.ColorWarning,
                    new Vector2(0.65f, 0), new Vector2(1, 0.55f),
                    Vector2.zero, new Vector2(-12, 0));
                UIUtils.CreateProgressBar("SR", row.transform,
                    new Vector2(0.55f, 0.6f), new Vector2(1, 0.9f),
                    new Vector2(0, 0), new Vector2(-12, 0),
                    fb.SuccessRate,
                    fb.SuccessRate >= 60 ? new Color(0.4f, 0.9f, 0.5f) : UIUtils.ColorWarning,
                    $"{fb.SuccessRate:0}%");
                y -= 52f;
                if (y < -750) break;
            }
        }

        private void RebuildForRecovery(RecoverySessionResult r)
        {
            ClearContent();
            float y = -24f;
            UIUtils.CreateText("Title", _content, "💊 RECOVERY COMPLETE", 30,
                TextAnchor.MiddleCenter, new Color(0.4f, 0.85f, 0.65f),
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, y), Vector2.zero, FontStyle.Bold);
            y -= 44f;

            UIUtils.CreateText("Opt", _content, $"{r.OptionUsed}  ·  {r.PlayersTreated} players  ·  ${r.TotalCost:0}",
                16, TextAnchor.MiddleCenter, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, y), Vector2.zero);
            y -= 36f;

            var sum = UIUtils.CreatePanel("Sum", _content,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(16, y - 96), new Vector2(-16, y), UIUtils.ColorPanelLight);
            y -= 108f;
            UIUtils.CreateProgressBar("Fat↓", sum.transform,
                new Vector2(0, 0.6f), new Vector2(1, 0.82f),
                new Vector2(16, 0), new Vector2(-16, 0),
                Mathf.Min(100, r.AverageFatigueReduction * 5), new Color(0.4f, 0.9f, 0.55f),
                $"FATIGUE ↓ {r.AverageFatigueReduction:0} avg");
            UIUtils.CreateProgressBar("Mor↑", sum.transform,
                new Vector2(0, 0.25f), new Vector2(1, 0.48f),
                new Vector2(16, 0), new Vector2(-16, 0),
                Mathf.Min(100, r.AverageMoraleBoost * 5), new Color(0.4f, 0.75f, 1f),
                $"MORALE ↑ {r.AverageMoraleBoost:0} avg");
            UIUtils.CreateText("Healed", sum.transform,
                r.PlayersHealed.Count > 0
                    ? $"✅ HEALED: {string.Join(", ", r.PlayersHealed.Take(4))}"
                    : "No injuries healed this session",
                12, TextAnchor.MiddleCenter,
                r.PlayersHealed.Count > 0 ? new Color(0.4f, 0.95f, 0.5f) : UIUtils.ColorTextDim,
                new Vector2(0, 0), new Vector2(1, 0.25f),
                new Vector2(12, 0), new Vector2(-12, 0), FontStyle.Bold);

            UIUtils.CreateText("Head", _content, "PER-PLAYER", 13,
                TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(20, y), Vector2.zero, FontStyle.Bold);
            y -= 22f;
            foreach (var fb in r.PlayerFeedbacks.Take(12))
            {
                var row = UIUtils.CreatePanel($"FB_{fb.PlayerId}", _content,
                    new Vector2(0, 1), new Vector2(1, 1),
                    new Vector2(12, y - 40), new Vector2(-12, y), UIUtils.ColorPanelLight);
                UIUtils.CreateText("Name", row.transform, fb.PlayerName, 13,
                    TextAnchor.MiddleLeft, UIUtils.ColorText,
                    new Vector2(0, 0.55f), new Vector2(0.4f, 1),
                    new Vector2(12, 0), Vector2.zero, FontStyle.Bold);
                UIUtils.CreateText("Stat", row.transform,
                    $"FAT -{fb.FatigueReduced:0}  MOR +{fb.MoraleGained:0}" +
                    (fb.WasHealed ? "  ✅ HEALED" : fb.HealingProgress > 0 ? $"  ⏳ -{fb.HealingProgress}d" : ""),
                    11, TextAnchor.MiddleRight,
                    fb.WasHealed ? new Color(0.4f, 0.95f, 0.5f) : UIUtils.ColorAccent,
                    new Vector2(0.4f, 0), new Vector2(1, 1),
                    Vector2.zero, new Vector2(-12, 0));
                y -= 50f;
                if (y < -800) break;
            }
        }

        private void RebuildForMatch(MatchSimulationResult r, FixtureModel f)
        {
            ClearContent();
            var resCol = r.Result == MatchResult.Win ? new Color(0.4f, 0.9f, 0.5f) :
                r.Result == MatchResult.Draw ? new Color(0.9f, 0.85f, 0.4f) : new Color(0.95f, 0.4f, 0.35f);
            float y = -24f;
            UIUtils.CreateText("Title", _content, "⚽ FULL TIME", 30,
                TextAnchor.MiddleCenter, resCol,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, y), Vector2.zero, FontStyle.Bold);
            y -= 44f;

            var scorePanel = UIUtils.CreatePanel("Score", _content,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(16, y - 140), new Vector2(-16, y),
                new Color(0.08f, 0.1f, 0.18f, 0.95f));
            y -= 152f;

            UIUtils.CreateText("Us", scorePanel.transform, "US", 16,
                TextAnchor.MiddleLeft, UIUtils.ColorAccent,
                new Vector2(0.05f, 0.6f), new Vector2(0.35f, 0.95f),
                Vector2.zero, Vector2.zero, FontStyle.Bold);
            UIUtils.CreateText("Opp", scorePanel.transform, f.OpponentName.ToUpper(), 16,
                TextAnchor.MiddleRight, UIUtils.ColorWarning,
                new Vector2(0.65f, 0.6f), new Vector2(0.95f, 0.95f),
                Vector2.zero, Vector2.zero, FontStyle.Bold);

            UIUtils.CreateText("Score", scorePanel.transform,
                $"{r.OurGoals}  -  {r.OpponentGoals}", 56,
                TextAnchor.MiddleCenter, resCol,
                new Vector2(0, 0.15f), new Vector2(1, 0.6f),
                Vector2.zero, Vector2.zero, FontStyle.Bold);

            UIUtils.CreateText("Result", scorePanel.transform,
                $"— {r.Result.ToString().ToUpper()} —", 18,
                TextAnchor.MiddleCenter, resCol,
                new Vector2(0, 0f), new Vector2(1, 0.18f),
                Vector2.zero, Vector2.zero, FontStyle.Bold);

            var statsPanel = UIUtils.CreatePanel("Stats", _content,
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(16, y - 170), new Vector2(-16, y), UIUtils.ColorPanelLight);
            y -= 182f;
            UIUtils.CreateText("SH", statsPanel.transform,
                $"SHOTS:  {r.OurShots}  -  {r.OpponentShots}", 13,
                TextAnchor.MiddleLeft, UIUtils.ColorText,
                new Vector2(0.05f, 0.78f), new Vector2(0.5f, 0.95f),
                Vector2.zero, Vector2.zero);
            UIUtils.CreateText("SOT", statsPanel.transform,
                $"ON TARGET:  {r.OurShotsOnTarget}  -  {r.OpponentShotsOnTarget}", 13,
                TextAnchor.MiddleRight, UIUtils.ColorText,
                new Vector2(0.5f, 0.78f), new Vector2(0.95f, 0.95f),
                Vector2.zero, Vector2.zero);
            UIUtils.CreateText("Poss", statsPanel.transform,
                $"POSSESSION:  {r.OurPossession:0}%  -  {100 - r.OurPossession:0}%", 13,
                TextAnchor.MiddleCenter, UIUtils.ColorAccent,
                new Vector2(0, 0.55f), new Vector2(1, 0.75f),
                Vector2.zero, Vector2.zero);

            var fin = GameManager.Finance;
            int prize = r.Result == MatchResult.Win ? f.PrizeMoney :
                r.Result == MatchResult.Draw ? Mathf.RoundToInt(f.PrizeMoney * 0.3f) : 0;
            int total = prize + f.TicketRevenue;
            UIUtils.CreateText("Fin", statsPanel.transform,
                $"PRIZE ${prize:0}  +  GATE ${f.TicketRevenue:0}  =  ${total:0}   " +
                $"|  MORALE {(r.Result == MatchResult.Win ? "▲" : r.Result == MatchResult.Loss ? "▼" : "—")}  " +
                $"|  INJURIES {r.InjuriesDuringMatch.Count}",
                12, TextAnchor.MiddleCenter,
                r.Result == MatchResult.Win ? UIUtils.ColorWarning : UIUtils.ColorTextDim,
                new Vector2(0, 0.25f), new Vector2(1, 0.5f),
                Vector2.zero, Vector2.zero, FontStyle.Bold);

            if (r.InjuriesDuringMatch.Count > 0)
            {
                UIUtils.CreateText("Inj", statsPanel.transform,
                    $"⚠️  Injured: {string.Join(", ", r.InjuriesDuringMatch)}",
                    11, TextAnchor.MiddleCenter, UIUtils.ColorDanger,
                    new Vector2(0, 0f), new Vector2(1, 0.25f),
                    Vector2.zero, Vector2.zero);
            }

            if (r.KeyEvents != null && r.KeyEvents.Count > 0)
            {
                UIUtils.CreateText("EVHead", _content, "KEY EVENTS", 13,
                    TextAnchor.MiddleLeft, UIUtils.ColorTextDim,
                    new Vector2(0, 1), new Vector2(1, 1),
                    new Vector2(20, y), Vector2.zero, FontStyle.Bold);
                y -= 22f;
                foreach (var ev in r.KeyEvents.Take(10))
                {
                    var row = UIUtils.CreatePanel($"EV_{ev.Minute}_{ev.PlayerId}", _content,
                        new Vector2(0, 1), new Vector2(1, 1),
                        new Vector2(12, y - 32), new Vector2(-12, y), UIUtils.ColorPanelLight);
                    UIUtils.CreateText("Min", row.transform, $"{ev.Minute}'", 13,
                        TextAnchor.MiddleLeft, UIUtils.ColorAccent,
                        new Vector2(0, 0), new Vector2(0.12f, 1),
                        new Vector2(12, 0), Vector2.zero, FontStyle.Bold);
                    UIUtils.CreateText("Desc", row.transform,
                        $"{(ev.IsForUs ? "●" : "○")} {ev.EventType} — {ev.Description}", 11,
                        TextAnchor.MiddleLeft,
                        ev.IsForUs ? UIUtils.ColorText : new Color(0.95f, 0.6f, 0.55f),
                        new Vector2(0.12f, 0), new Vector2(1, 1),
                        new Vector2(8, 0), new Vector2(-12, 0));
                    y -= 42f;
                    if (y < -650) break;
                }
            }

            if (GameManager.Season.IsSeasonComplete)
            {
                var table = GameManager.Season.LeagueTable
                    .OrderByDescending(t => t.Points).ThenByDescending(t => t.GoalDifference).ToList();
                int pos = table.FindIndex(t => t.IsUs) + 1;
                var our = table.First(t => t.IsUs);
                var endPanel = UIUtils.CreatePanel("End", _content,
                    new Vector2(0.1f, 0.12f), new Vector2(0.9f, 0.28f),
                    Vector2.zero, Vector2.zero,
                    pos <= 2 ? new Color(0.25f, 0.5f, 0.25f, 0.95f) :
                    pos <= 4 ? new Color(0.5f, 0.45f, 0.2f, 0.95f) :
                    new Color(0.5f, 0.25f, 0.25f, 0.95f));
                UIUtils.CreateText("EndT", endPanel.transform,
                    pos <= 2 ? "🏆 TROPHY WINNERS!" : pos <= 4 ? "🎉 RESPECTABLE SEASON" : "📉 NEEDS IMPROVEMENT",
                    22, TextAnchor.MiddleCenter, Color.white,
                    new Vector2(0, 0.5f), new Vector2(1, 1),
                    Vector2.zero, Vector2.zero, FontStyle.Bold);
                UIUtils.CreateText("EndD", endPanel.transform,
                    $"FINAL POSITION: #{pos}  |  {our.Points} PTS  |  GD {our.GoalDifference}  |  REVENUE ${fin.TotalRevenue:0,0}",
                    12, TextAnchor.MiddleCenter, new Color(0.95f, 0.95f, 1f),
                    new Vector2(0, 0), new Vector2(1, 0.5f),
                    Vector2.zero, Vector2.zero, FontStyle.Bold);
            }
        }
    }
}

