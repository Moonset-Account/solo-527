using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Audio;

namespace LakeSailing.UI
{
    public class DailyChallengePanel : UIPanelBase
    {
        private static readonly Color ButtonNormalColor = new Color(0.2f, 0.45f, 0.9f, 0.95f);
        private static readonly Color ButtonHoverColor = new Color(0.2f * 1.3f, 0.45f * 1.3f, 0.9f * 1.3f, 1f);
        private static readonly Color ConfirmColor = new Color(0.2f, 0.7f, 0.4f, 0.95f);
        private static readonly Color ConfirmHoverColor = new Color(0.2f * 1.3f, 0.7f * 1.3f, 0.4f * 1.3f, 1f);
        private static readonly Color BannerBgColor = new Color(0.2f, 0.35f, 0.6f, 0.95f);
        private static readonly Color CardBgColor = new Color(0.15f, 0.18f, 0.28f, 0.95f);
        private static readonly Color ProgressBgColor = new Color(0.1f, 0.12f, 0.18f, 1f);
        private static readonly Color ProgressFillColor = new Color(0.4f, 0.85f, 0.55f, 1f);
        private static readonly Color ModifierCardBg = new Color(0.18f, 0.22f, 0.34f, 0.95f);
        private static readonly Color TodayHighlight = new Color(1f, 0.85f, 0.25f, 0.95f);
        private static readonly Color CompletedDay = new Color(0.4f, 0.85f, 0.55f, 0.9f);
        private static readonly Color MissedDay = new Color(0.35f, 0.35f, 0.4f, 0.6f);
        private static readonly Color FutureDay = new Color(0.25f, 0.28f, 0.36f, 0.8f);

        private struct ModifierData
        {
            public string Icon;
            public string Name;
            public string Description;
            public Color AccentColor;

            public ModifierData(string icon, string name, string desc, Color color)
            {
                Icon = icon; Name = name; Description = desc; AccentColor = color;
            }
        }

        private static readonly ModifierData[] AllModifiers =
        {
            new ModifierData("📦", "双倍补给", "关卡开始时所有补给翻倍", new Color(0.4f, 0.85f, 0.55f)),
            new ModifierData("🍃", "无风", "全程无风，船只完全依赖燃料", new Color(0.7f, 0.75f, 0.85f)),
            new ModifierData("🌪", "极限风暴", "极端天气概率大幅增加", new Color(0.9f, 0.45f, 0.35f)),
            new ModifierData("⏱", "限时加速", "船只速度+30%，燃料消耗更快", new Color(0.95f, 0.75f, 0.35f)),
            new ModifierData("👁", "黄金视野", "能见度提升，拍摄画质+30分", new Color(0.85f, 0.55f, 0.95f)),
        };

        private readonly ModifierData[] todayModifiers = new ModifierData[3];

        private struct CalendarDay
        {
            public string Label;
            public int State;

            public CalendarDay(string l, int s) { Label = l; State = s; }
        }

        private readonly CalendarDay[] weekCalendar =
        {
            new CalendarDay("周一", 1),
            new CalendarDay("周二", 1),
            new CalendarDay("周三", 2),
            new CalendarDay("周四", 1),
            new CalendarDay("周五", 0),
            new CalendarDay("周六", 3),
            new CalendarDay("周日", 4),
        };

        private Text builtDateText;
        private Text builtChallengeNameText;
        private Text builtGoalText;
        private Text builtProgressText;
        private Text builtCoinRewardText;
        private Text builtXPRewardText;
        private Text builtBonusRewardText;
        private Image builtProgressFillImg;

        private int targetValue = 3;
        private int currentValue = 1;

        private void Awake()
        {
            panelType = UIType.DailyChallenge;
            UIManager.Instance?.RegisterPanel(panelType, this);
            PickRandomModifiers();
            BuildUI();
        }

        private void PickRandomModifiers()
        {
            var list = new List<ModifierData>(AllModifiers);
            var result = new List<ModifierData>();
            for (int i = 0; i < 3 && list.Count > 0; i++)
            {
                int idx = Random.Range(0, list.Count);
                result.Add(list[idx]);
                list.RemoveAt(idx);
            }
            for (int i = 0; i < 3 && i < result.Count; i++) todayModifiers[i] = result[i];
        }

        private void BuildUI()
        {
            RuntimeUIBuilder.EnsureEventSystem();

            if (panelContent == null)
            {
                panelContent = RuntimeUIBuilder.CreatePanel(transform, "DailyChallengePanelContent");
                gameObject.SetActive(false);
            }

            var contentRoot = panelContent.transform;
            foreach (Transform child in contentRoot) Destroy(child.gameObject);

            RuntimeUIBuilder.CreateTitle(contentRoot, "每日挑战", 52, -10f);

            var bannerGO = new GameObject("BannerCard");
            bannerGO.transform.SetParent(contentRoot, false);
            var bannerRT = bannerGO.AddComponent<RectTransform>();
            bannerRT.anchorMin = new Vector2(0.5f, 1f);
            bannerRT.anchorMax = new Vector2(0.5f, 1f);
            bannerRT.pivot = new Vector2(0.5f, 1f);
            bannerRT.anchoredPosition = new Vector2(0, -130f);
            bannerRT.sizeDelta = new Vector2(1400, 160);
            var bannerImg = bannerGO.AddComponent<Image>();
            bannerImg.color = BannerBgColor;
            bannerImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            bannerImg.type = Image.Type.Sliced;

            var bannerDecor = new GameObject("DecorIcon");
            bannerDecor.transform.SetParent(bannerRT, false);
            var decorRT = bannerDecor.AddComponent<RectTransform>();
            decorRT.anchorMin = new Vector2(0, 0.5f);
            decorRT.anchorMax = new Vector2(0, 0.5f);
            decorRT.pivot = new Vector2(0, 0.5f);
            decorRT.anchoredPosition = new Vector2(32f, 0);
            decorRT.sizeDelta = new Vector2(110, 110);
            var decorT = bannerDecor.AddComponent<Text>();
            decorT.text = "🌩";
            decorT.font = RuntimeUIBuilder.GetDefaultFont();
            decorT.fontSize = 88;
            decorT.alignment = TextAnchor.MiddleCenter;
            decorT.color = Color.white;

            var bannerContentGO = new GameObject("BannerContent");
            bannerContentGO.transform.SetParent(bannerRT, false);
            var bcRT = bannerContentGO.AddComponent<RectTransform>();
            bcRT.anchorMin = new Vector2(0, 0);
            bcRT.anchorMax = new Vector2(1, 1);
            bcRT.offsetMin = new Vector2(170, 10);
            bcRT.offsetMax = new Vector2(-20, -10);
            var bcVG = bannerContentGO.AddComponent<VerticalLayoutGroup>();
            bcVG.spacing = 8f;
            bcVG.childAlignment = TextAnchor.MiddleLeft;
            bcVG.childControlHeight = true;
            bcVG.childControlWidth = true;
            bcVG.childForceExpandHeight = false;
            bcVG.childForceExpandWidth = true;

            builtDateText = RuntimeUIBuilder.CreateLabel(bcVG.transform,
                $"📅 2026年6月9日 · 星期二", 22,
                TextAnchor.MiddleLeft, 800, 36);
            builtDateText.color = new Color(0.85f, 0.9f, 1f);

            builtChallengeNameText = RuntimeUIBuilder.CreateLabel(bcVG.transform,
                "暴风雨摄影日", 40,
                TextAnchor.MiddleLeft, 800, 56);
            builtChallengeNameText.fontStyle = FontStyle.Bold;
            builtChallengeNameText.color = Color.white;

            var subLabel = RuntimeUIBuilder.CreateLabel(bcVG.transform,
                "在恶劣天气中完成拍摄挑战，赢取丰厚奖励！", 18,
                TextAnchor.MiddleLeft, 800, 28);
            subLabel.color = new Color(0.75f, 0.8f, 0.9f);

            var modifierRowGO = new GameObject("ModifierRow");
            modifierRowGO.transform.SetParent(contentRoot, false);
            var modRowRT = modifierRowGO.AddComponent<RectTransform>();
            modRowRT.anchorMin = new Vector2(0.5f, 1f);
            modRowRT.anchorMax = new Vector2(0.5f, 1f);
            modRowRT.pivot = new Vector2(0.5f, 1f);
            modRowRT.anchoredPosition = new Vector2(0, -315f);
            modRowRT.sizeDelta = new Vector2(1400, 180);

            var modHG = modifierRowGO.AddComponent<HorizontalLayoutGroup>();
            modHG.spacing = 30f;
            modHG.childAlignment = TextAnchor.MiddleCenter;
            modHG.childControlHeight = true;
            modHG.childControlWidth = true;
            modHG.childForceExpandHeight = true;
            modHG.childForceExpandWidth = true;
            modHG.padding = new RectOffset(10, 10, 10, 10);

            for (int i = 0; i < 3; i++) CreateModifierCard(modHG.transform, todayModifiers[i], i);

            var middleRowGO = new GameObject("MiddleRow");
            middleRowGO.transform.SetParent(contentRoot, false);
            var midRT = middleRowGO.AddComponent<RectTransform>();
            midRT.anchorMin = new Vector2(0.5f, 0.5f);
            midRT.anchorMax = new Vector2(0.5f, 0.5f);
            midRT.pivot = new Vector2(0.5f, 0.5f);
            midRT.anchoredPosition = new Vector2(0, 40f);
            midRT.sizeDelta = new Vector2(1400, 260);

            var midHG = middleRowGO.AddComponent<HorizontalLayoutGroup>();
            midHG.spacing = 30f;
            midHG.childAlignment = TextAnchor.MiddleCenter;
            midHG.childControlHeight = true;
            midHG.childControlWidth = true;
            midHG.childForceExpandHeight = true;
            midHG.childForceExpandWidth = false;
            midHG.padding = new RectOffset(5, 5, 5, 5);

            BuildProgressCard(midHG.transform);
            BuildCalendarCard(midHG.transform);

            var rewardCardGO = new GameObject("RewardCard");
            rewardCardGO.transform.SetParent(contentRoot, false);
            var rewardRT = rewardCardGO.AddComponent<RectTransform>();
            rewardRT.anchorMin = new Vector2(0.5f, 0f);
            rewardRT.anchorMax = new Vector2(0.5f, 0f);
            rewardRT.pivot = new Vector2(0.5f, 0f);
            rewardRT.anchoredPosition = new Vector2(0, 140f);
            rewardRT.sizeDelta = new Vector2(1400, 110);
            var rewardImg = rewardCardGO.AddComponent<Image>();
            rewardImg.color = CardBgColor;
            rewardImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            rewardImg.type = Image.Type.Sliced;

            var rewardContentGO = new GameObject("RewardContent");
            rewardContentGO.transform.SetParent(rewardRT, false);
            var rcRT = rewardContentGO.AddComponent<RectTransform>();
            RuntimeUIBuilder.StretchFull(rcRT, 12f);
            var rcHG = rewardContentGO.AddComponent<HorizontalLayoutGroup>();
            rcHG.spacing = 60f;
            rcHG.childAlignment = TextAnchor.MiddleCenter;
            rcHG.childControlHeight = true;

            var titleReward = RuntimeUIBuilder.CreateLabel(rcHG.transform, "🎁 奖励", 24,
                TextAnchor.MiddleCenter, 140, 60);
            titleReward.fontStyle = FontStyle.Bold;
            titleReward.color = new Color(1f, 0.85f, 0.4f);

            builtCoinRewardText = RuntimeUIBuilder.CreateLabel(rcHG.transform, "💰 500 金币", 22,
                TextAnchor.MiddleCenter, 220, 60);
            builtCoinRewardText.color = new Color(1f, 0.8f, 0.35f);

            builtXPRewardText = RuntimeUIBuilder.CreateLabel(rcHG.transform, "⭐ 300 经验", 22,
                TextAnchor.MiddleCenter, 220, 60);
            builtXPRewardText.color = new Color(0.55f, 0.8f, 1f);

            builtBonusRewardText = RuntimeUIBuilder.CreateLabel(rcHG.transform, "✨ 完美奖励: 额外200金币", 18,
                TextAnchor.MiddleCenter, 360, 60);
            builtBonusRewardText.color = new Color(0.95f, 0.55f, 0.95f);

            var bottomBar = new GameObject("BottomBar");
            bottomBar.transform.SetParent(contentRoot, false);
            var bottomRT = bottomBar.AddComponent<RectTransform>();
            bottomRT.anchorMin = new Vector2(0.5f, 0f);
            bottomRT.anchorMax = new Vector2(0.5f, 0f);
            bottomRT.pivot = new Vector2(0.5f, 0f);
            bottomRT.anchoredPosition = new Vector2(0, 40f);
            bottomRT.sizeDelta = new Vector2(900, 80);

            var botHG = bottomBar.AddComponent<HorizontalLayoutGroup>();
            botHG.spacing = 40f;
            botHG.childAlignment = TextAnchor.MiddleCenter;

            RuntimeUIBuilder.CreateButton(bottomBar.transform, "开始挑战",
                new Vector2(400, 72), OnStartChallengeClicked, 28, ConfirmColor, ConfirmHoverColor);
            RuntimeUIBuilder.CreateButton(bottomBar.transform, "返回",
                new Vector2(340, 72), OnBackClicked, 26, ButtonNormalColor, ButtonHoverColor);

            UpdateProgressDisplay();
        }

        private void CreateModifierCard(Transform parent, ModifierData data, int idx)
        {
            var cardGO = new GameObject($"ModifierCard_{idx}");
            cardGO.transform.SetParent(parent, false);
            var cardRT = cardGO.AddComponent<RectTransform>();
            cardRT.sizeDelta = new Vector2(420, 160);

            var cardImg = cardGO.AddComponent<Image>();
            cardImg.color = ModifierCardBg;
            cardImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            cardImg.type = Image.Type.Sliced;

            var accentGO = new GameObject("AccentBar");
            accentGO.transform.SetParent(cardRT, false);
            var accentRT = accentGO.AddComponent<RectTransform>();
            accentRT.anchorMin = new Vector2(0, 0);
            accentRT.anchorMax = new Vector2(1, 0);
            accentRT.pivot = new Vector2(0.5f, 0);
            accentRT.offsetMin = new Vector2(0, 0);
            accentRT.offsetMax = new Vector2(0, 6);
            var accentImg = accentGO.AddComponent<Image>();
            accentImg.color = data.AccentColor;

            var iconBoxGO = new GameObject("IconBox");
            iconBoxGO.transform.SetParent(cardRT, false);
            var iconBoxRT = iconBoxGO.AddComponent<RectTransform>();
            iconBoxRT.anchorMin = new Vector2(0, 0.5f);
            iconBoxRT.anchorMax = new Vector2(0, 0.5f);
            iconBoxRT.pivot = new Vector2(0, 0.5f);
            iconBoxRT.anchoredPosition = new Vector2(20f, 12f);
            iconBoxRT.sizeDelta = new Vector2(80, 80);
            var iconBoxImg = iconBoxGO.AddComponent<Image>();
            iconBoxImg.color = new Color(data.AccentColor.r * 0.3f, data.AccentColor.g * 0.3f, data.AccentColor.b * 0.4f, 1f);
            iconBoxImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            iconBoxImg.type = Image.Type.Sliced;

            var iconChar = iconBoxGO.AddComponent<Text>();
            iconChar.text = data.Icon;
            iconChar.font = RuntimeUIBuilder.GetDefaultFont();
            iconChar.fontSize = 48;
            iconChar.alignment = TextAnchor.MiddleCenter;
            var iconCharRT = iconChar.rectTransform;
            RuntimeUIBuilder.StretchFull(iconCharRT);

            var contentGO = new GameObject("Content");
            contentGO.transform.SetParent(cardRT, false);
            var contentRT = contentGO.AddComponent<RectTransform>();
            contentRT.anchorMin = new Vector2(0, 0);
            contentRT.anchorMax = new Vector2(1, 1);
            contentRT.offsetMin = new Vector2(120, 14);
            contentRT.offsetMax = new Vector2(-16, -10);

            var vg = contentGO.AddComponent<VerticalLayoutGroup>();
            vg.spacing = 8f;
            vg.childAlignment = TextAnchor.UpperLeft;
            vg.childControlHeight = true;
            vg.childControlWidth = true;
            vg.childForceExpandHeight = false;
            vg.childForceExpandWidth = true;

            var nameT = RuntimeUIBuilder.CreateLabel(vg.transform, data.Name, 24,
                TextAnchor.MiddleLeft, 260, 36);
            nameT.fontStyle = FontStyle.Bold;
            nameT.color = data.AccentColor;

            var descT = RuntimeUIBuilder.CreateLabel(vg.transform, data.Description, 16,
                TextAnchor.UpperLeft, 260, 60);
            descT.color = new Color(0.72f, 0.76f, 0.86f);
            descT.horizontalOverflow = HorizontalWrapMode.Wrap;
            descT.verticalOverflow = VerticalWrapMode.Truncate;
        }

        private void BuildProgressCard(Transform parent)
        {
            var cardGO = new GameObject("ProgressCard");
            cardGO.transform.SetParent(parent, false);
            var cardRT = cardGO.AddComponent<RectTransform>();
            cardRT.sizeDelta = new Vector2(700, 240);
            var cardImg = cardGO.AddComponent<Image>();
            cardImg.color = CardBgColor;
            cardImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            cardImg.type = Image.Type.Sliced;

            var titleT = RuntimeUIBuilder.CreateLabel(cardRT, "🎯 今日目标", 24,
                TextAnchor.MiddleLeft, 300, 36);
            titleT.fontStyle = FontStyle.Bold;
            titleT.color = new Color(0.85f, 0.9f, 1f);
            var tRT = titleT.rectTransform;
            tRT.anchorMin = new Vector2(0, 1f);
            tRT.anchorMax = new Vector2(0, 1f);
            tRT.pivot = new Vector2(0, 1f);
            tRT.anchoredPosition = new Vector2(28f, -24f);

            builtGoalText = RuntimeUIBuilder.CreateLabel(cardRT, $"完成 {targetValue} 个拍摄任务", 22,
                TextAnchor.MiddleLeft, 600, 34);
            builtGoalText.color = Color.white;
            var gRT = builtGoalText.rectTransform;
            gRT.anchorMin = new Vector2(0, 1f);
            gRT.anchorMax = new Vector2(0, 1f);
            gRT.pivot = new Vector2(0, 1f);
            gRT.anchoredPosition = new Vector2(28f, -68f);

            var barBG = new GameObject("ProgressBarBG");
            barBG.transform.SetParent(cardRT, false);
            var barBGRt = barBG.AddComponent<RectTransform>();
            barBGRt.anchorMin = new Vector2(0, 0.5f);
            barBGRt.anchorMax = new Vector2(1, 0.5f);
            barBGRt.pivot = new Vector2(0.5f, 0.5f);
            barBGRt.anchoredPosition = new Vector2(0, 6f);
            barBGRt.offsetMin = new Vector2(28, -16);
            barBGRt.offsetMax = new Vector2(-28, 16);
            var barBGImg = barBG.AddComponent<Image>();
            barBGImg.color = ProgressBgColor;
            barBGImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            barBGImg.type = Image.Type.Sliced;

            var fillGO = new GameObject("Fill");
            fillGO.transform.SetParent(barBG.transform, false);
            var fillRT = fillGO.AddComponent<RectTransform>();
            fillRT.anchorMin = new Vector2(0, 0);
            fillRT.anchorMax = new Vector2(0, 1);
            fillRT.pivot = new Vector2(0, 0.5f);
            fillRT.offsetMin = new Vector2(3, 3);
            float ratio = targetValue > 0 ? Mathf.Clamp01((float)currentValue / targetValue) : 0f;
            float fillWidth = (barBGRt.rect.width - 6f) * ratio;
            fillRT.offsetMax = new Vector2(3 + fillWidth, -3);
            builtProgressFillImg = fillGO.AddComponent<Image>();
            builtProgressFillImg.color = ProgressFillColor;
            builtProgressFillImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            builtProgressFillImg.type = Image.Type.Sliced;

            builtProgressText = RuntimeUIBuilder.CreateLabel(cardRT, $"{currentValue} / {targetValue}", 26,
                TextAnchor.MiddleRight, 200, 40);
            builtProgressText.fontStyle = FontStyle.Bold;
            builtProgressText.color = new Color(0.9f, 0.95f, 1f);
            var pRT = builtProgressText.rectTransform;
            pRT.anchorMin = new Vector2(1, 0.5f);
            pRT.anchorMax = new Vector2(1, 0.5f);
            pRT.pivot = new Vector2(1, 0.5f);
            pRT.anchoredPosition = new Vector2(-28f, 52f);

            var hintT = RuntimeUIBuilder.CreateLabel(cardRT, "进度在完成挑战后更新", 16,
                TextAnchor.MiddleLeft, 400, 26);
            hintT.color = new Color(0.6f, 0.65f, 0.75f);
            var hRT = hintT.rectTransform;
            hRT.anchorMin = new Vector2(0, 0f);
            hRT.anchorMax = new Vector2(0, 0f);
            hRT.pivot = new Vector2(0, 0f);
            hRT.anchoredPosition = new Vector2(28f, 22f);
        }

        private void BuildCalendarCard(Transform parent)
        {
            var cardGO = new GameObject("CalendarCard");
            cardGO.transform.SetParent(parent, false);
            var cardRT = cardGO.AddComponent<RectTransform>();
            cardRT.sizeDelta = new Vector2(640, 240);
            var cardImg = cardGO.AddComponent<Image>();
            cardImg.color = CardBgColor;
            cardImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            cardImg.type = Image.Type.Sliced;

            var titleT = RuntimeUIBuilder.CreateLabel(cardRT, "📆 连续挑战", 24,
                TextAnchor.MiddleLeft, 280, 36);
            titleT.fontStyle = FontStyle.Bold;
            titleT.color = new Color(0.85f, 0.9f, 1f);
            var tRT = titleT.rectTransform;
            tRT.anchorMin = new Vector2(0, 1f);
            tRT.anchorMax = new Vector2(0, 1f);
            tRT.pivot = new Vector2(0, 1f);
            tRT.anchoredPosition = new Vector2(28f, -24f);

            var streakT = RuntimeUIBuilder.CreateLabel(cardRT, "已连续 3 天 · 最高 7 天", 20,
                TextAnchor.MiddleLeft, 350, 30);
            streakT.color = new Color(1f, 0.85f, 0.4f);
            var sRT = streakT.rectTransform;
            sRT.anchorMin = new Vector2(1, 1f);
            sRT.anchorMax = new Vector2(1, 1f);
            sRT.pivot = new Vector2(1, 1f);
            sRT.anchoredPosition = new Vector2(-28f, -27f);

            var daysRowGO = new GameObject("DaysRow");
            daysRowGO.transform.SetParent(cardRT, false);
            var daysRowRT = daysRowGO.AddComponent<RectTransform>();
            daysRowRT.anchorMin = new Vector2(0.5f, 0.5f);
            daysRowRT.anchorMax = new Vector2(0.5f, 0.5f);
            daysRowRT.pivot = new Vector2(0.5f, 0.5f);
            daysRowRT.anchoredPosition = new Vector2(0, 10f);
            daysRowRT.sizeDelta = new Vector2(580, 120);

            var daysHG = daysRowGO.AddComponent<HorizontalLayoutGroup>();
            daysHG.spacing = 8f;
            daysHG.childAlignment = TextAnchor.MiddleCenter;
            daysHG.childControlHeight = true;
            daysHG.childControlWidth = true;
            daysHG.childForceExpandHeight = true;
            daysHG.childForceExpandWidth = true;

            for (int i = 0; i < weekCalendar.Length; i++) CreateCalendarDay(daysHG.transform, weekCalendar[i], i);
        }

        private void CreateCalendarDay(Transform parent, CalendarDay day, int idx)
        {
            var dayGO = new GameObject($"Day_{idx}");
            dayGO.transform.SetParent(parent, false);
            var dayRT = dayGO.AddComponent<RectTransform>();
            dayRT.sizeDelta = new Vector2(76, 110);

            Color bgColor;
            switch (day.State)
            {
                case 0: bgColor = MissedDay; break;
                case 1: bgColor = CompletedDay; break;
                case 2: bgColor = TodayHighlight; break;
                case 3: bgColor = FutureDay; break;
                default: bgColor = FutureDay; break;
            }

            var dayImg = dayGO.AddComponent<Image>();
            dayImg.color = bgColor;
            dayImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            dayImg.type = Image.Type.Sliced;

            var vg = dayGO.AddComponent<VerticalLayoutGroup>();
            vg.spacing = 2f;
            vg.padding = new RectOffset(4, 4, 6, 6);
            vg.childAlignment = TextAnchor.UpperCenter;
            vg.childControlHeight = true;
            vg.childControlWidth = true;
            vg.childForceExpandHeight = false;
            vg.childForceExpandWidth = true;

            var dayLabel = RuntimeUIBuilder.CreateLabel(vg.transform, day.Label, 16,
                TextAnchor.MiddleCenter, 64, 24);
            dayLabel.color = day.State == 2 ? new Color(0.2f, 0.18f, 0.05f) : new Color(0.85f, 0.88f, 0.95f);

            var dateLabel = RuntimeUIBuilder.CreateLabel(vg.transform, (idx + 3).ToString(), 22,
                TextAnchor.MiddleCenter, 64, 28);
            dateLabel.fontStyle = FontStyle.Bold;
            dateLabel.color = day.State == 2 ? new Color(0.2f, 0.18f, 0.05f) : Color.white;

            string markStr = "";
            if (day.State == 1) markStr = "✓";
            else if (day.State == 2) markStr = "●";
            else if (day.State == 0) markStr = "✗";
            var markLabel = RuntimeUIBuilder.CreateLabel(vg.transform, markStr, 26,
                TextAnchor.MiddleCenter, 64, 36);
            markLabel.fontStyle = FontStyle.Bold;
            switch (day.State)
            {
                case 0: markLabel.color = new Color(0.85f, 0.45f, 0.45f); break;
                case 1: markLabel.color = new Color(0.2f, 0.55f, 0.3f); break;
                case 2: markLabel.color = new Color(0.75f, 0.45f, 0.05f); break;
                default: markLabel.color = new Color(0.45f, 0.48f, 0.58f); break;
            }
        }

        private void UpdateProgressDisplay()
        {
            if (builtProgressText != null)
                builtProgressText.text = $"{Mathf.Min(currentValue, targetValue)} / {targetValue}";
        }

        private void OnStartChallengeClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            GameManager.Instance?.SetCurrentLevel("DailyChallenge_01", 99);
            GameManager.Instance?.ChangeState(GameState.Playing);
            Close();
            UIManager.Instance?.ShowNotification("每日挑战开始！", 1.5f);
        }

        private void OnBackClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
            UIManager.Instance?.OpenPanel(UIType.MainMenu, true);
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            GameManager.Instance?.ChangeState(GameState.DailyChallenge);
        }
    }
}
