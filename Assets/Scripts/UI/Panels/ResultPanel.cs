using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Events;

namespace LakeNavigation
{
    public class ResultPanel : IPanel
    {
        private Font _font;
        private ColorBlock _buttonColors;
        private ColorBlock _failButtonColors;

        public LevelScoreResult LastResult { get; private set; }
        public FailReason LastFailReason { get; private set; }
        public bool WasSuccess { get; private set; }

        private GameObject _successContainer;
        private GameObject _failureContainer;
        private Text _successTitle;
        private Text[] _starTexts = new Text[3];
        private Text _totalScoreValue;
        private Text _photoScoreValue;
        private Text _speedBonusValue;
        private Text _supplyBonusValue;
        private Text _weatherBonusValue;
        private Text _gradeText;
        private Text _discoveredText;
        private Text _failTitle;
        private Text _failIconText;
        private Text _failReasonText;
        private Text _failTipsText;
        private LevelManager _levelManager;

        public override void Setup(Transform parent)
        {
            _font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

            _buttonColors = new ColorBlock
            {
                normalColor = new Color32(70, 130, 180, 255),
                highlightedColor = new Color32(100, 160, 210, 255),
                pressedColor = new Color32(50, 110, 160, 255),
                selectedColor = new Color32(100, 160, 210, 255),
                disabledColor = new Color32(128, 128, 128, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            };

            _failButtonColors = new ColorBlock
            {
                normalColor = new Color32(160, 60, 60, 255),
                highlightedColor = new Color32(190, 90, 90, 255),
                pressedColor = new Color32(130, 40, 40, 255),
                selectedColor = new Color32(190, 90, 90, 255),
                disabledColor = new Color32(128, 128, 128, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            };

            _panelObject = new GameObject("ResultPanel");
            _panelObject.transform.SetParent(parent, false);

            RectTransform rt = _panelObject.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            Image bg = _panelObject.AddComponent<Image>();
            bg.color = new Color32(0, 0, 0, 200);

            CreateSuccessView();
            CreateFailureView();

            _successContainer.SetActive(false);
            _failureContainer.SetActive(false);
            _panelObject.SetActive(false);
        }

        public void SetResult(LevelScoreResult result, FailReason failReason)
        {
            LastResult = result;
            LastFailReason = failReason;
            WasSuccess = failReason == FailReason.None;
        }

        public override void Show()
        {
            _levelManager = FindObjectOfType<LevelManager>();

            if (WasSuccess)
            {
                PopulateSuccessView();
                _successContainer.SetActive(true);
                _failureContainer.SetActive(false);
            }
            else
            {
                PopulateFailureView();
                _successContainer.SetActive(false);
                _failureContainer.SetActive(true);
            }

            _panelObject.SetActive(true);
            IsVisible = true;
        }

        public override void Hide()
        {
            _panelObject.SetActive(false);
            IsVisible = false;
        }

        private void CreateSuccessView()
        {
            _successContainer = new GameObject("SuccessContainer");
            _successContainer.transform.SetParent(_panelObject.transform, false);

            RectTransform srt = _successContainer.AddComponent<RectTransform>();
            srt.anchorMin = Vector2.zero;
            srt.anchorMax = Vector2.one;
            srt.offsetMin = Vector2.zero;
            srt.offsetMax = Vector2.zero;

            VerticalLayoutGroup layout = _successContainer.AddComponent<VerticalLayoutGroup>();
            layout.childAlignment = TextAnchor.MiddleCenter;
            layout.spacing = 12f;
            layout.childControlWidth = true;
            layout.childControlHeight = false;
            layout.childForceExpandWidth = true;
            layout.childForceExpandHeight = false;
            layout.padding = new RectOffset(120, 120, 40, 40);

            GameObject titleObj = new GameObject("SuccessTitle");
            titleObj.transform.SetParent(_successContainer.transform, false);
            _successTitle = titleObj.AddComponent<Text>();
            _successTitle.font = _font;
            _successTitle.text = "MISSION COMPLETE!";
            _successTitle.fontSize = 40;
            _successTitle.color = new Color32(80, 220, 80, 255);
            _successTitle.alignment = TextAnchor.MiddleCenter;
            _successTitle.fontStyle = FontStyle.Bold;
            LayoutElement titleLe = titleObj.AddComponent<LayoutElement>();
            titleLe.preferredHeight = 55f;

            GameObject starsRow = new GameObject("StarsRow");
            starsRow.transform.SetParent(_successContainer.transform, false);
            HorizontalLayoutGroup starsLayout = starsRow.AddComponent<HorizontalLayoutGroup>();
            starsLayout.childAlignment = TextAnchor.MiddleCenter;
            starsLayout.spacing = 15f;
            starsLayout.childControlWidth = false;
            starsLayout.childControlHeight = false;
            starsLayout.childForceExpandWidth = false;
            starsLayout.childForceExpandHeight = false;
            LayoutElement starsLe = starsRow.AddComponent<LayoutElement>();
            starsLe.preferredHeight = 55f;

            for (int i = 0; i < 3; i++)
            {
                GameObject starObj = new GameObject("Star_" + i);
                starObj.transform.SetParent(starsRow.transform, false);
                _starTexts[i] = starObj.AddComponent<Text>();
                _starTexts[i].font = _font;
                _starTexts[i].text = "\u2605";
                _starTexts[i].fontSize = 44;
                _starTexts[i].alignment = TextAnchor.MiddleCenter;
                LayoutElement starLe = starObj.AddComponent<LayoutElement>();
                starLe.preferredWidth = 55f;
                starLe.preferredHeight = 55f;
            }

            AddSpacer(_successContainer, 8f);

            GameObject breakdownObj = new GameObject("ScoreBreakdown");
            breakdownObj.transform.SetParent(_successContainer.transform, false);
            VerticalLayoutGroup breakdownLayout = breakdownObj.AddComponent<VerticalLayoutGroup>();
            breakdownLayout.childAlignment = TextAnchor.MiddleCenter;
            breakdownLayout.spacing = 6f;
            breakdownLayout.childControlWidth = true;
            breakdownLayout.childControlHeight = false;
            breakdownLayout.childForceExpandWidth = true;
            breakdownLayout.childForceExpandHeight = false;
            LayoutElement breakdownLe = breakdownObj.AddComponent<LayoutElement>();
            breakdownLe.preferredHeight = 160f;

            _totalScoreValue = CreateScoreLine(breakdownObj.transform, "Total Score", Color.white, 24);
            AddSpacer(breakdownObj, 4f);
            _photoScoreValue = CreateScoreLine(breakdownObj.transform, "Photo Score", new Color32(200, 215, 235, 255), 18);
            _speedBonusValue = CreateScoreLine(breakdownObj.transform, "Speed Bonus", new Color32(200, 215, 235, 255), 18);
            _supplyBonusValue = CreateScoreLine(breakdownObj.transform, "Supply Bonus", new Color32(200, 215, 235, 255), 18);
            _weatherBonusValue = CreateScoreLine(breakdownObj.transform, "Weather Mastery Bonus", new Color32(200, 215, 235, 255), 18);

            AddSpacer(_successContainer, 8f);

            GameObject gradeObj = new GameObject("Grade");
            gradeObj.transform.SetParent(_successContainer.transform, false);
            _gradeText = gradeObj.AddComponent<Text>();
            _gradeText.font = _font;
            _gradeText.text = "S";
            _gradeText.fontSize = 64;
            _gradeText.alignment = TextAnchor.MiddleCenter;
            _gradeText.fontStyle = FontStyle.Bold;
            LayoutElement gradeLe = gradeObj.AddComponent<LayoutElement>();
            gradeLe.preferredHeight = 75f;

            GameObject discObj = new GameObject("Discovered");
            discObj.transform.SetParent(_successContainer.transform, false);
            _discoveredText = discObj.AddComponent<Text>();
            _discoveredText.font = _font;
            _discoveredText.text = "Discovered: 0/0 species & landmarks";
            _discoveredText.fontSize = 18;
            _discoveredText.color = new Color32(180, 210, 240, 255);
            _discoveredText.alignment = TextAnchor.MiddleCenter;
            LayoutElement discLe = discObj.AddComponent<LayoutElement>();
            discLe.preferredHeight = 28f;

            AddSpacer(_successContainer, 12f);

            GameObject btnRow = new GameObject("SuccessButtons");
            btnRow.transform.SetParent(_successContainer.transform, false);
            HorizontalLayoutGroup btnLayout = btnRow.AddComponent<HorizontalLayoutGroup>();
            btnLayout.childAlignment = TextAnchor.MiddleCenter;
            btnLayout.spacing = 15f;
            btnLayout.childControlWidth = true;
            btnLayout.childControlHeight = false;
            btnLayout.childForceExpandWidth = true;
            btnLayout.childForceExpandHeight = false;
            LayoutElement btnRowLe = btnRow.AddComponent<LayoutElement>();
            btnRowLe.preferredHeight = 55f;

            CreateButton(btnRow.transform, "Next Level", new Color32(50, 160, 80, 255), OnNextLevel);
            CreateButton(btnRow.transform, "Retry", _buttonColors, OnRetry);
            CreateButton(btnRow.transform, "Encyclopedia", new Color32(140, 100, 180, 255), OnEncyclopedia);
            CreateButton(btnRow.transform, "Main Menu", new Color32(90, 90, 110, 255), OnMainMenu);
        }

        private void CreateFailureView()
        {
            _failureContainer = new GameObject("FailureContainer");
            _failureContainer.transform.SetParent(_panelObject.transform, false);

            RectTransform frt = _failureContainer.AddComponent<RectTransform>();
            frt.anchorMin = Vector2.zero;
            frt.anchorMax = Vector2.one;
            frt.offsetMin = Vector2.zero;
            frt.offsetMax = Vector2.zero;

            VerticalLayoutGroup layout = _failureContainer.AddComponent<VerticalLayoutGroup>();
            layout.childAlignment = TextAnchor.MiddleCenter;
            layout.spacing = 18f;
            layout.childControlWidth = true;
            layout.childControlHeight = false;
            layout.childForceExpandWidth = true;
            layout.childForceExpandHeight = false;
            layout.padding = new RectOffset(150, 150, 60, 60);

            GameObject titleObj = new GameObject("FailTitle");
            titleObj.transform.SetParent(_failureContainer.transform, false);
            _failTitle = titleObj.AddComponent<Text>();
            _failTitle.font = _font;
            _failTitle.text = "MISSION FAILED";
            _failTitle.fontSize = 40;
            _failTitle.color = new Color32(220, 60, 60, 255);
            _failTitle.alignment = TextAnchor.MiddleCenter;
            _failTitle.fontStyle = FontStyle.Bold;
            LayoutElement failTitleLe = titleObj.AddComponent<LayoutElement>();
            failTitleLe.preferredHeight = 55f;

            GameObject iconObj = new GameObject("FailIcon");
            iconObj.transform.SetParent(_failureContainer.transform, false);
            _failIconText = iconObj.AddComponent<Text>();
            _failIconText.font = _font;
            _failIconText.text = "\u26A0";
            _failIconText.fontSize = 36;
            _failIconText.color = new Color32(255, 180, 0, 255);
            _failIconText.alignment = TextAnchor.MiddleCenter;
            LayoutElement iconLe = iconObj.AddComponent<LayoutElement>();
            iconLe.preferredHeight = 45f;

            GameObject reasonBox = new GameObject("ReasonBox");
            reasonBox.transform.SetParent(_failureContainer.transform, false);
            Image reasonBg = reasonBox.AddComponent<Image>();
            reasonBg.color = new Color32(40, 20, 20, 200);
            Outline reasonOutline = reasonBox.AddComponent<Outline>();
            reasonOutline.effectColor = new Color32(180, 50, 50, 120);
            reasonOutline.effectDistance = new Vector2(2, -2);
            VerticalLayoutGroup reasonLayout = reasonBox.AddComponent<VerticalLayoutGroup>();
            reasonLayout.childAlignment = TextAnchor.MiddleCenter;
            reasonLayout.spacing = 6f;
            reasonLayout.childControlWidth = true;
            reasonLayout.childControlHeight = false;
            reasonLayout.childForceExpandWidth = true;
            reasonLayout.childForceExpandHeight = false;
            reasonLayout.padding = new RectOffset(30, 30, 20, 20);
            LayoutElement reasonLe = reasonBox.AddComponent<LayoutElement>();
            reasonLe.minHeight = 80f;
            reasonLe.preferredHeight = 100f;

            _failReasonText = reasonBox.AddComponent<Text>();
            _failReasonText.font = _font;
            _failReasonText.text = "";
            _failReasonText.fontSize = 18;
            _failReasonText.color = new Color32(255, 200, 180, 255);
            _failReasonText.alignment = TextAnchor.MiddleCenter;

            AddSpacer(_failureContainer, 8f);

            GameObject tipsObj = new GameObject("TipsSection");
            tipsObj.transform.SetParent(_failureContainer.transform, false);
            VerticalLayoutGroup tipsLayout = tipsObj.AddComponent<VerticalLayoutGroup>();
            tipsLayout.childAlignment = TextAnchor.MiddleCenter;
            tipsLayout.spacing = 6f;
            tipsLayout.childControlWidth = true;
            tipsLayout.childControlHeight = false;
            tipsLayout.childForceExpandWidth = true;
            tipsLayout.childForceExpandHeight = false;
            tipsLayout.padding = new RectOffset(30, 30, 15, 15);
            LayoutElement tipsLe = tipsObj.AddComponent<LayoutElement>();
            tipsLe.preferredHeight = 110f;

            GameObject tipsHeaderObj = new GameObject("TipsHeader");
            tipsHeaderObj.transform.SetParent(tipsObj.transform, false);
            Text tipsHeader = tipsHeaderObj.AddComponent<Text>();
            tipsHeader.font = _font;
            tipsHeader.text = "TIPS";
            tipsHeader.fontSize = 20;
            tipsHeader.color = new Color32(255, 220, 100, 255);
            tipsHeader.alignment = TextAnchor.MiddleCenter;
            tipsHeader.fontStyle = FontStyle.Bold;
            LayoutElement tipsHdrLe = tipsHeaderObj.AddComponent<LayoutElement>();
            tipsHdrLe.preferredHeight = 28f;

            _failTipsText = tipsObj.AddComponent<Text>();
            _failTipsText.font = _font;
            _failTipsText.text = "";
            _failTipsText.fontSize = 16;
            _failTipsText.color = new Color32(200, 200, 200, 255);
            _failTipsText.alignment = TextAnchor.MiddleCenter;

            AddSpacer(_failureContainer, 18f);

            GameObject btnRow = new GameObject("FailButtons");
            btnRow.transform.SetParent(_failureContainer.transform, false);
            HorizontalLayoutGroup btnLayout = btnRow.AddComponent<HorizontalLayoutGroup>();
            btnLayout.childAlignment = TextAnchor.MiddleCenter;
            btnLayout.spacing = 20f;
            btnLayout.childControlWidth = true;
            btnLayout.childControlHeight = false;
            btnLayout.childForceExpandWidth = true;
            btnLayout.childForceExpandHeight = false;
            LayoutElement btnRowLe = btnRow.AddComponent<LayoutElement>();
            btnRowLe.preferredHeight = 55f;

            CreateButton(btnRow.transform, "Retry", _buttonColors, OnRetry);
            CreateButton(btnRow.transform, "Main Menu", new Color32(90, 90, 110, 255), OnMainMenu);
        }

        private void PopulateSuccessView()
        {
            Color goldColor = new Color32(255, 215, 0, 255);
            Color grayColor = new Color32(128, 128, 128, 255);

            for (int i = 0; i < 3; i++)
            {
                bool filled = i < LastResult.StarCount;
                _starTexts[i].text = filled ? "\u2605" : "\u2606";
                _starTexts[i].color = filled ? goldColor : grayColor;
            }

            _totalScoreValue.text = "Total Score: " + LastResult.TotalScore;
            _photoScoreValue.text = "Photo Score: " + LastResult.PhotoScore;
            _speedBonusValue.text = "Speed Bonus: " + LastResult.SpeedBonus;
            _supplyBonusValue.text = "Supply Bonus: " + LastResult.SupplyBonus;
            _weatherBonusValue.text = "Weather Mastery Bonus: " + LastResult.WeatherMasteryBonus;

            _gradeText.text = LastResult.Grade;
            _gradeText.color = GetGradeColor(LastResult.Grade);

            var mission = FindObjectOfType<MissionManager>();
            if (mission != null)
            {
                _discoveredText.text = "Discovered: " + mission.GetCompletedMissionCount() + "/" + mission.GetTotalMissionCount() + " species & landmarks";
            }
            else
            {
                _discoveredText.text = "Discovered: 0/0 species & landmarks";
            }
        }

        private void PopulateFailureView()
        {
            _failReasonText.text = GetFailReasonDescription(LastFailReason);
            _failTipsText.text = GetFailTips(LastFailReason);
        }

        private string GetFailReasonDescription(FailReason reason)
        {
            return reason switch
            {
                FailReason.OutOfFuel => "Out of Fuel! Your boat ran out of fuel and became stranded. Plan a shorter route or conserve fuel in headwinds.",
                FailReason.OutOfFood => "Out of Food! Your crew ran out of provisions. Bring more supplies or complete the mission faster.",
                FailReason.BoatDamaged => "Boat Damaged! Storms and obstacles damaged your boat beyond repair. Avoid storms and steer clear of rocks.",
                FailReason.TimeExpired => "Time Expired! You ran out of time. Plan a more efficient route.",
                FailReason.MissionFailed => "Mission Failed! Required objectives were not completed. Focus on required photo targets first.",
                _ => "Unknown failure."
            };
        }

        private string GetFailTips(FailReason reason)
        {
            return reason switch
            {
                FailReason.OutOfFuel => "\u2022 Plan a shorter route with fewer waypoints\n\u2022 Avoid sailing into headwinds to conserve fuel\n\u2022 Check the weather forecast before setting sail",
                FailReason.OutOfFood => "\u2022 Complete missions more quickly\n\u2022 Choose a more direct route to your targets\n\u2022 Monitor your food gauge carefully during the trip",
                FailReason.BoatDamaged => "\u2022 Avoid stormy areas when possible\n\u2022 Steer clear of rocky obstacles\n\u2022 Watch for weather warnings and plan alternate routes",
                FailReason.TimeExpired => "\u2022 Plan a more efficient route\n\u2022 Use tailwinds to your advantage\n\u2022 Skip optional targets and focus on required ones",
                FailReason.MissionFailed => "\u2022 Focus on required photo targets first\n\u2022 Check which objectives are marked as required\n\u2022 Ensure you reach all required targets before time runs out",
                _ => ""
            };
        }

        private Color GetGradeColor(string grade)
        {
            return grade switch
            {
                "S" => new Color32(255, 215, 0, 255),
                "A" => new Color32(80, 220, 80, 255),
                "B" => new Color32(80, 140, 255, 255),
                "C" => Color.white,
                "D" => new Color32(220, 60, 60, 255),
                _ => Color.white
            };
        }

        private void OnNextLevel()
        {
            if (_levelManager != null)
                _levelManager.LoadLevel(GameManager.Instance.CurrentLevelIndex + 1);
            GameManager.Instance.ChangeState(GameState.Planning);
        }

        private void OnRetry()
        {
            if (_levelManager != null)
                _levelManager.LoadLevel(GameManager.Instance.CurrentLevelIndex);
            GameManager.Instance.ChangeState(GameState.Planning);
        }

        private void OnEncyclopedia()
        {
            GameManager.Instance.ChangeState(GameState.Encyclopedia);
        }

        private void OnMainMenu()
        {
            GameManager.Instance.ChangeState(GameState.MainMenu);
        }

        private Text CreateScoreLine(Transform parent, string label, Color color, int fontSize)
        {
            GameObject lineObj = new GameObject("ScoreLine_" + label.Replace(" ", ""));
            lineObj.transform.SetParent(parent, false);

            Text t = lineObj.AddComponent<Text>();
            t.font = _font;
            t.text = label + ": 0";
            t.fontSize = fontSize;
            t.color = color;
            t.alignment = TextAnchor.MiddleCenter;

            LayoutElement le = lineObj.AddComponent<LayoutElement>();
            le.preferredHeight = fontSize + 6;

            return t;
        }

        private void AddSpacer(GameObject parent, float height)
        {
            GameObject spacer = new GameObject("Spacer");
            spacer.transform.SetParent(parent.transform, false);
            LayoutElement le = spacer.AddComponent<LayoutElement>();
            le.preferredHeight = height;
            le.minHeight = height;
        }

        private void CreateButton(Transform parent, string label, ColorBlock colors, UnityAction onClick)
        {
            GameObject btnObj = new GameObject("Btn_" + label.Replace(" ", ""));
            btnObj.transform.SetParent(parent, false);

            Image btnImage = btnObj.AddComponent<Image>();
            btnImage.color = colors.normalColor;

            Button button = btnObj.AddComponent<Button>();
            button.targetGraphic = btnImage;
            button.colors = colors;
            button.onClick.AddListener(onClick);

            GameObject textObj = new GameObject("Text");
            textObj.transform.SetParent(btnObj.transform, false);

            RectTransform textRt = textObj.GetComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = Vector2.zero;
            textRt.offsetMax = Vector2.zero;

            Text btnText = textObj.AddComponent<Text>();
            btnText.text = label;
            btnText.font = _font;
            btnText.fontSize = 22;
            btnText.color = Color.white;
            btnText.alignment = TextAnchor.MiddleCenter;

            LayoutElement le = btnObj.AddComponent<LayoutElement>();
            le.preferredHeight = 50f;
            le.minWidth = 120f;
        }

        private void CreateButton(Transform parent, string label, Color32 bgColor, UnityAction onClick)
        {
            CreateButton(parent, label, new ColorBlock
            {
                normalColor = bgColor,
                highlightedColor = new Color32(
                    Mathf.Min(bgColor.r + 30, 255), Mathf.Min(bgColor.g + 30, 255),
                    Mathf.Min(bgColor.b + 30, 255), bgColor.a),
                pressedColor = new Color32(
                    Mathf.Max(bgColor.r - 20, 0), Mathf.Max(bgColor.g - 20, 0),
                    Mathf.Max(bgColor.b - 20, 0), bgColor.a),
                selectedColor = new Color32(
                    Mathf.Min(bgColor.r + 30, 255), Mathf.Min(bgColor.g + 30, 255),
                    Mathf.Min(bgColor.b + 30, 255), bgColor.a),
                disabledColor = new Color32(80, 80, 80, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            }, onClick);
        }
    }
}
