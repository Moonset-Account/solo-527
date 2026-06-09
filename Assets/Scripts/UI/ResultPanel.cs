using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Audio;

namespace LakeSailing.UI
{
    public class ResultPanel : UIPanelBase
    {
        private static readonly Color ButtonNormalColor = new Color(0.2f, 0.45f, 0.9f, 0.95f);
        private static readonly Color ButtonHoverColor = new Color(0.2f * 1.3f, 0.45f * 1.3f, 0.9f * 1.3f, 1f);
        private static readonly Color ConfirmColor = new Color(0.2f, 0.7f, 0.4f, 0.95f);
        private static readonly Color ConfirmHoverColor = new Color(0.2f * 1.3f, 0.7f * 1.3f, 0.4f * 1.3f, 1f);
        private static readonly Color DangerColor = new Color(0.8f, 0.3f, 0.3f, 0.95f);
        private static readonly Color DangerHoverColor = new Color(Mathf.Clamp01(0.8f * 1.3f), Mathf.Clamp01(0.3f * 1.3f), Mathf.Clamp01(0.3f * 1.3f), 1f);

        private static readonly Color PanelBgVictory = new Color(0.1f, 0.22f, 0.16f, 0.85f);
        private static readonly Color PanelBgDefeat = new Color(0.22f, 0.1f, 0.12f, 0.85f);
        private static readonly Color VictoryTextColor = new Color(0.4f, 1f, 0.55f);
        private static readonly Color DefeatTextColor = new Color(1f, 0.45f, 0.45f);
        private static readonly Color CardBgColor = new Color(0.12f, 0.14f, 0.22f, 0.95f);
        private static readonly Color StarOnColor = new Color(1f, 0.85f, 0.2f, 1f);
        private static readonly Color StarOffColor = new Color(0.35f, 0.35f, 0.4f, 0.45f);

        private struct DetailRow
        {
            public string Label;
            public int Value;
            public DetailRow(string l, int v) { Label = l; Value = v; }
        }

        private struct UnlockInfo
        {
            public string Name;
            public string Type;
            public UnlockInfo(string n, string t) { Name = n; Type = t; }
        }

        private bool resultVictory;
        private int resultScore;
        private int resultStars;
        private Dictionary<string, int> resultDetailScores;
        private readonly List<UnlockInfo> unlockList = new List<UnlockInfo>();

        private Text builtTitleText;
        private Image builtPanelBgImg;
        private Image[] builtStarImages;
        private Text builtTotalScoreText;
        private Text builtGradeText;
        private GameObject builtDetailRowsRoot;
        private GameObject builtUnlocksRoot;
        private GameObject builtContinueBtnGO;

        private bool isUIBuilt = false;

        private void Awake()
        {
            panelType = UIType.Result;
            UIManager.Instance?.RegisterPanel(panelType, this);
            BuildUI();
        }

        public void SetVictoryFlag(bool victory)
        {
            resultVictory = victory;
            if (isUIBuilt) UpdateResultDisplay();
        }

        public void SetResult(bool victory, int score, int stars, Dictionary<string, int> detailScores)
        {
            resultVictory = victory;
            resultScore = Mathf.Max(0, score);
            resultStars = Mathf.Clamp(stars, 0, 3);
            resultDetailScores = detailScores ?? new Dictionary<string, int>();

            unlockList.Clear();
            if (victory)
            {
                if (Random.value > 0.5f) unlockList.Add(new UnlockInfo("稀有收藏", "成就"));
                if (Random.value > 0.5f) unlockList.Add(new UnlockInfo("彩虹拱桥", "图鉴"));
            }

            UpdateResultDisplay();
        }

        private void BuildUI()
        {
            RuntimeUIBuilder.EnsureEventSystem();

            if (panelContent == null)
            {
                panelContent = RuntimeUIBuilder.CreatePanel(transform, "ResultPanelContent");
                gameObject.SetActive(false);
            }

            var contentRoot = panelContent.transform;
            foreach (Transform child in contentRoot) Destroy(child.gameObject);

            var panelImg = panelContent.GetComponent<Image>();
            builtPanelBgImg = panelImg;

            var innerCard = new GameObject("InnerCard");
            innerCard.transform.SetParent(contentRoot, false);
            var icRT = innerCard.AddComponent<RectTransform>();
            icRT.anchorMin = new Vector2(0.5f, 0.5f);
            icRT.anchorMax = new Vector2(0.5f, 0.5f);
            icRT.pivot = new Vector2(0.5f, 0.5f);
            icRT.anchoredPosition = Vector2.zero;
            icRT.sizeDelta = new Vector2(1100, 900);
            var icImg = innerCard.AddComponent<Image>();
            icImg.color = CardBgColor;
            icImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            icImg.type = Image.Type.Sliced;

            var icTransform = icRT;

            builtTitleText = RuntimeUIBuilder.CreateLabel(icTransform, "🎉 关卡完成！", 56,
                TextAnchor.MiddleCenter, 900, 80);
            builtTitleText.fontStyle = FontStyle.Bold;
            var titleRT = builtTitleText.rectTransform;
            titleRT.anchorMin = new Vector2(0.5f, 1f);
            titleRT.anchorMax = new Vector2(0.5f, 1f);
            titleRT.pivot = new Vector2(0.5f, 1f);
            titleRT.anchoredPosition = new Vector2(0, -40f);

            var starsGO = new GameObject("StarsRow");
            starsGO.transform.SetParent(icTransform, false);
            var starsRT = starsGO.AddComponent<RectTransform>();
            starsRT.anchorMin = new Vector2(0.5f, 1f);
            starsRT.anchorMax = new Vector2(0.5f, 1f);
            starsRT.pivot = new Vector2(0.5f, 1f);
            starsRT.anchoredPosition = new Vector2(0, -150f);
            starsRT.sizeDelta = new Vector2(420, 110);

            var starsHG = starsGO.AddComponent<HorizontalLayoutGroup>();
            starsHG.spacing = 30f;
            starsHG.childAlignment = TextAnchor.MiddleCenter;
            starsHG.childControlHeight = true;
            starsHG.childControlWidth = true;
            starsHG.childForceExpandHeight = true;
            starsHG.childForceExpandWidth = true;

            builtStarImages = new Image[3];
            var starSprite = CreateStarSprite();
            for (int s = 0; s < 3; s++)
            {
                var starGO = new GameObject($"Star_{s}");
                starGO.transform.SetParent(starsRT, false);
                var starRT = starGO.AddComponent<RectTransform>();
                starRT.sizeDelta = new Vector2(100, 100);
                var starImg = starGO.AddComponent<Image>();
                starImg.color = StarOffColor;
                starImg.sprite = starSprite;
                starImg.type = Image.Type.Simple;
                starImg.preserveAspect = true;
                builtStarImages[s] = starImg;
            }

            var detailCardGO = new GameObject("DetailCard");
            detailCardGO.transform.SetParent(icTransform, false);
            var dcRT = detailCardGO.AddComponent<RectTransform>();
            dcRT.anchorMin = new Vector2(0.5f, 1f);
            dcRT.anchorMax = new Vector2(0.5f, 1f);
            dcRT.pivot = new Vector2(0.5f, 1f);
            dcRT.anchoredPosition = new Vector2(0, -290f);
            dcRT.sizeDelta = new Vector2(900, 300);
            var dcImg = detailCardGO.AddComponent<Image>();
            dcImg.color = new Color(0.1f, 0.12f, 0.18f, 0.95f);
            dcImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            dcImg.type = Image.Type.Sliced;

            var detailHeader = RuntimeUIBuilder.CreateLabel(dcRT, "📊 详细得分", 24,
                TextAnchor.MiddleLeft, 300, 36);
            detailHeader.fontStyle = FontStyle.Bold;
            detailHeader.color = new Color(0.85f, 0.9f, 1f);
            var dhRT = detailHeader.rectTransform;
            dhRT.anchorMin = new Vector2(0, 1f);
            dhRT.anchorMax = new Vector2(0, 1f);
            dhRT.pivot = new Vector2(0, 1f);
            dhRT.anchoredPosition = new Vector2(28f, -20f);

            builtDetailRowsRoot = new GameObject("DetailRows");
            builtDetailRowsRoot.transform.SetParent(dcRT, false);
            var ddrRT = builtDetailRowsRoot.AddComponent<RectTransform>();
            ddrRT.anchorMin = new Vector2(0, 0);
            ddrRT.anchorMax = new Vector2(1, 1);
            ddrRT.offsetMin = new Vector2(20, 16);
            ddrRT.offsetMax = new Vector2(-20, -64);

            var ddrVG = builtDetailRowsRoot.AddComponent<VerticalLayoutGroup>();
            ddrVG.spacing = 6f;
            ddrVG.childAlignment = TextAnchor.UpperCenter;
            ddrVG.childControlHeight = true;
            ddrVG.childControlWidth = true;
            ddrVG.childForceExpandHeight = false;
            ddrVG.childForceExpandWidth = true;

            var totalCardGO = new GameObject("TotalCard");
            totalCardGO.transform.SetParent(icTransform, false);
            var tcRT = totalCardGO.AddComponent<RectTransform>();
            tcRT.anchorMin = new Vector2(0.5f, 0f);
            tcRT.anchorMax = new Vector2(0.5f, 0f);
            tcRT.pivot = new Vector2(0.5f, 0f);
            tcRT.anchoredPosition = new Vector2(0, 290f);
            tcRT.sizeDelta = new Vector2(900, 130);
            var tcImg = totalCardGO.AddComponent<Image>();
            tcImg.color = new Color(0.18f, 0.22f, 0.34f, 0.95f);
            tcImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            tcImg.type = Image.Type.Sliced;

            var totalLabel = RuntimeUIBuilder.CreateLabel(tcRT, "总计", 22,
                TextAnchor.MiddleLeft, 100, 36);
            totalLabel.color = new Color(0.7f, 0.75f, 0.85f);
            var tlRT = totalLabel.rectTransform;
            tlRT.anchorMin = new Vector2(0, 0.5f);
            tlRT.anchorMax = new Vector2(0, 0.5f);
            tlRT.pivot = new Vector2(0, 0.5f);
            tlRT.anchoredPosition = new Vector2(30f, 20f);

            builtTotalScoreText = RuntimeUIBuilder.CreateLabel(tcRT, "0", 64,
                TextAnchor.MiddleLeft, 450, 88);
            builtTotalScoreText.fontStyle = FontStyle.Bold;
            builtTotalScoreText.color = Color.white;
            var tsRT = builtTotalScoreText.rectTransform;
            tsRT.anchorMin = new Vector2(0, 0.5f);
            tsRT.anchorMax = new Vector2(0, 0.5f);
            tsRT.pivot = new Vector2(0, 0.5f);
            tsRT.anchoredPosition = new Vector2(30f, -24f);

            builtGradeText = RuntimeUIBuilder.CreateLabel(tcRT, "B", 80,
                TextAnchor.MiddleCenter, 180, 110);
            builtGradeText.fontStyle = FontStyle.Bold;
            var gradeRT = builtGradeText.rectTransform;
            gradeRT.anchorMin = new Vector2(1, 0.5f);
            gradeRT.anchorMax = new Vector2(1, 0.5f);
            gradeRT.pivot = new Vector2(1, 0.5f);
            gradeRT.anchoredPosition = new Vector2(-40f, 0);

            var unlocksCardGO = new GameObject("UnlocksCard");
            unlocksCardGO.transform.SetParent(icTransform, false);
            var ucRT = unlocksCardGO.AddComponent<RectTransform>();
            ucRT.anchorMin = new Vector2(0.5f, 0f);
            ucRT.anchorMax = new Vector2(0.5f, 0f);
            ucRT.pivot = new Vector2(0.5f, 0f);
            ucRT.anchoredPosition = new Vector2(0, 160f);
            ucRT.sizeDelta = new Vector2(900, 100);
            var ucImg = unlocksCardGO.AddComponent<Image>();
            ucImg.color = new Color(0.1f, 0.12f, 0.18f, 0.95f);
            ucImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            ucImg.type = Image.Type.Sliced;

            var unlocksLabel = RuntimeUIBuilder.CreateLabel(ucRT, "🎁 新解锁", 22,
                TextAnchor.MiddleLeft, 200, 32);
            unlocksLabel.color = new Color(1f, 0.85f, 0.45f);
            unlocksLabel.fontStyle = FontStyle.Bold;
            var ulRT = unlocksLabel.rectTransform;
            ulRT.anchorMin = new Vector2(0, 1f);
            ulRT.anchorMax = new Vector2(0, 1f);
            ulRT.pivot = new Vector2(0, 1f);
            ulRT.anchoredPosition = new Vector2(20f, -10f);

            builtUnlocksRoot = new GameObject("UnlocksList");
            builtUnlocksRoot.transform.SetParent(ucRT, false);
            var urRT = builtUnlocksRoot.AddComponent<RectTransform>();
            urRT.anchorMin = new Vector2(0, 0);
            urRT.anchorMax = new Vector2(1, 1);
            urRT.offsetMin = new Vector2(20, 8);
            urRT.offsetMax = new Vector2(-20, -48);

            var urHG = builtUnlocksRoot.AddComponent<HorizontalLayoutGroup>();
            urHG.spacing = 16f;
            urHG.childAlignment = TextAnchor.MiddleLeft;
            urHG.childControlHeight = true;

            var bottomBar = new GameObject("BottomBar");
            bottomBar.transform.SetParent(icTransform, false);
            var botRT = bottomBar.AddComponent<RectTransform>();
            botRT.anchorMin = new Vector2(0.5f, 0f);
            botRT.anchorMax = new Vector2(0.5f, 0f);
            botRT.pivot = new Vector2(0.5f, 0f);
            botRT.anchoredPosition = new Vector2(0, 30f);
            botRT.sizeDelta = new Vector2(1060, 90);

            var botHG = bottomBar.AddComponent<HorizontalLayoutGroup>();
            botHG.spacing = 20f;
            botHG.childAlignment = TextAnchor.MiddleCenter;
            botHG.childControlHeight = true;

            RuntimeUIBuilder.CreateButton(bottomBar.transform, "再来一次",
                new Vector2(230, 70), OnRetryClicked, 22, ButtonNormalColor, ButtonHoverColor);
            RuntimeUIBuilder.CreateButton(bottomBar.transform, "关卡选择",
                new Vector2(230, 70), OnLevelSelectClicked, 22, ButtonNormalColor, ButtonHoverColor);
            RuntimeUIBuilder.CreateButton(bottomBar.transform, "主菜单",
                new Vector2(230, 70), OnMainMenuClicked, 22, ButtonNormalColor, ButtonHoverColor);

            var continueBtn = RuntimeUIBuilder.CreateButton(bottomBar.transform, "继续",
                new Vector2(230, 70), OnContinueClicked, 22, ConfirmColor, ConfirmHoverColor);
            builtContinueBtnGO = continueBtn.gameObject;

            isUIBuilt = true;
            SetDefaultResult();
        }

        private void SetDefaultResult()
        {
            resultVictory = true;
            resultScore = 0;
            resultStars = 0;
            resultDetailScores = new Dictionary<string, int>
            {
                { "任务得分", 0 },
                { "距离得分", 0 },
                { "稀有度加成", 0 },
                { "剩余燃料加成", 0 },
                { "总时间奖励", 0 },
            };
            UpdateResultDisplay();
        }

        private Sprite CreateStarSprite()
        {
            int size = 128;
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            var colors = new Color[size * size];
            Vector2 center = new Vector2(size / 2f, size / 2f);
            float outerR = size * 0.47f;
            float innerR = size * 0.2f;
            int points = 5;

            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    Vector2 p = new Vector2(x, y) - center;
                    float dist = p.magnitude;
                    float angle = Mathf.Atan2(p.y, p.x) * Mathf.Rad2Deg;
                    if (angle < 0) angle += 360f;
                    float seg = 360f / (points * 2);
                    float segIdx = Mathf.Floor(angle / seg);
                    float t = (angle - segIdx * seg) / seg;
                    float r = (segIdx % 2 == 0) ? outerR : innerR;
                    float nextR = ((segIdx + 1) % 2 == 0) ? outerR : innerR;
                    float radius = Mathf.Lerp(r, nextR, t);
                    colors[y * size + x] = dist <= radius ? Color.white : new Color(0, 0, 0, 0);
                }
            }
            tex.SetPixels(colors);
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f));
        }

        private string GetGrade(int score, out Color gradeColor)
        {
            if (score >= 9000) { gradeColor = new Color(1f, 0.45f, 0.85f); return "S"; }
            if (score >= 7000) { gradeColor = new Color(1f, 0.6f, 0.3f); return "A"; }
            if (score >= 5000) { gradeColor = new Color(0.4f, 0.85f, 0.55f); return "B"; }
            if (score >= 3000) { gradeColor = new Color(0.45f, 0.7f, 1f); return "C"; }
            gradeColor = new Color(0.7f, 0.7f, 0.75f); return "D";
        }

        private void UpdateResultDisplay()
        {
            if (!isUIBuilt) return;

            if (builtTitleText != null)
            {
                builtTitleText.text = resultVictory ? "🎉 关卡完成！" : "💧 任务失败";
                builtTitleText.color = resultVictory ? VictoryTextColor : DefeatTextColor;
            }

            if (builtPanelBgImg != null)
            {
                builtPanelBgImg.color = resultVictory
                    ? new Color(PanelBgVictory.r, PanelBgVictory.g, PanelBgVictory.b, builtPanelBgImg.color.a)
                    : new Color(PanelBgDefeat.r, PanelBgDefeat.g, PanelBgDefeat.b, builtPanelBgImg.color.a);
            }

            for (int s = 0; s < 3 && s < builtStarImages.Length; s++)
            {
                if (builtStarImages[s] != null)
                {
                    builtStarImages[s].color = s < resultStars ? StarOnColor : StarOffColor;
                }
            }

            BuildDetailRows();
            BuildUnlockItems();

            if (builtTotalScoreText != null) builtTotalScoreText.text = resultScore.ToString("N0");

            if (builtGradeText != null)
            {
                Color gc;
                builtGradeText.text = GetGrade(resultScore, out gc);
                builtGradeText.color = resultVictory ? gc : new Color(0.6f, 0.6f, 0.65f);
            }

            if (builtContinueBtnGO != null)
            {
                builtContinueBtnGO.SetActive(resultVictory);
            }
        }

        private void BuildDetailRows()
        {
            if (builtDetailRowsRoot == null) return;
            foreach (Transform child in builtDetailRowsRoot.transform) Destroy(child.gameObject);

            var defaultKeys = new List<string>
            {
                "任务得分", "距离得分", "稀有度加成", "剩余燃料加成", "总时间奖励"
            };

            int total = 0;
            foreach (var key in defaultKeys)
            {
                int value = 0;
                if (resultDetailScores != null && resultDetailScores.ContainsKey(key))
                    value = resultDetailScores[key];
                total += value;
                CreateDetailRow(key, value);
            }

            if (resultDetailScores != null)
            {
                foreach (var kvp in resultDetailScores)
                {
                    if (!defaultKeys.Contains(kvp.Key))
                    {
                        total += kvp.Value;
                        CreateDetailRow(kvp.Key, kvp.Value);
                    }
                }
            }
        }

        private void CreateDetailRow(string label, int value)
        {
            var rowGO = new GameObject($"Row_{label}");
            rowGO.transform.SetParent(builtDetailRowsRoot.transform, false);
            var rt = rowGO.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(860, 40);

            var rowImg = rowGO.AddComponent<Image>();
            rowImg.color = new Color(1, 1, 1, 0.03f);
            rowImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            rowImg.type = Image.Type.Sliced;

            var labelT = RuntimeUIBuilder.CreateLabel(rt, label, 18,
                TextAnchor.MiddleLeft, 400, 36);
            labelT.color = new Color(0.75f, 0.8f, 0.9f);
            var lRT = labelT.rectTransform;
            lRT.anchorMin = new Vector2(0, 0.5f);
            lRT.anchorMax = new Vector2(0, 0.5f);
            lRT.pivot = new Vector2(0, 0.5f);
            lRT.anchoredPosition = new Vector2(20f, 0);

            var valStr = value >= 0 ? $"+{value}" : value.ToString();
            var valueT = RuntimeUIBuilder.CreateLabel(rt, valStr, 20,
                TextAnchor.MiddleRight, 200, 36);
            valueT.fontStyle = FontStyle.Bold;
            valueT.color = value >= 0 ? new Color(0.9f, 0.95f, 1f) : new Color(1f, 0.6f, 0.6f);
            var vRT = valueT.rectTransform;
            vRT.anchorMin = new Vector2(1, 0.5f);
            vRT.anchorMax = new Vector2(1, 0.5f);
            vRT.pivot = new Vector2(1, 0.5f);
            vRT.anchoredPosition = new Vector2(-20f, 0);
        }

        private void BuildUnlockItems()
        {
            if (builtUnlocksRoot == null) return;
            foreach (Transform child in builtUnlocksRoot.transform) Destroy(child.gameObject);

            if (unlockList == null || unlockList.Count == 0)
            {
                var emptyT = RuntimeUIBuilder.CreateLabel(builtUnlocksRoot.transform,
                    "暂无新解锁内容", 16,
                    TextAnchor.MiddleLeft, 400, 32);
                emptyT.color = new Color(0.5f, 0.55f, 0.65f);
                return;
            }

            foreach (var info in unlockList) CreateUnlockItem(info);
        }

        private void CreateUnlockItem(UnlockInfo info)
        {
            var go = new GameObject($"Unlock_{info.Name}");
            go.transform.SetParent(builtUnlocksRoot.transform, false);
            var rt = go.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(260, 40);

            var img = go.AddComponent<Image>();
            img.color = new Color(1f, 0.85f, 0.45f, 0.12f);
            img.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            img.type = Image.Type.Sliced;

            var typeT = RuntimeUIBuilder.CreateLabel(rt, $"[{info.Type}]", 14,
                TextAnchor.MiddleLeft, 90, 32);
            typeT.color = new Color(1f, 0.85f, 0.45f);
            var tRT = typeT.rectTransform;
            tRT.anchorMin = new Vector2(0, 0.5f);
            tRT.anchorMax = new Vector2(0, 0.5f);
            tRT.pivot = new Vector2(0, 0.5f);
            tRT.anchoredPosition = new Vector2(10f, 0);

            var nameT = RuntimeUIBuilder.CreateLabel(rt, info.Name, 16,
                TextAnchor.MiddleLeft, 160, 32);
            nameT.color = Color.white;
            nameT.fontStyle = FontStyle.Bold;
            var nRT = nameT.rectTransform;
            nRT.anchorMin = new Vector2(0, 0.5f);
            nRT.anchorMax = new Vector2(0, 0.5f);
            nRT.pivot = new Vector2(0, 0.5f);
            nRT.anchoredPosition = new Vector2(100f, 0);
        }

        private void OnRetryClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
            GameManager.Instance?.RestartLevel();
        }

        private void OnLevelSelectClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
            UIManager.Instance?.OpenPanel(UIType.LevelSelect, true);
        }

        private void OnMainMenuClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
            GameManager.Instance?.ReturnToMainMenu();
            UIManager.Instance?.OpenPanel(UIType.MainMenu, true);
        }

        private void OnContinueClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            GameManager.Instance?.ChangeState(resultVictory ? GameState.Victory : GameState.Defeat);
            if (resultVictory) AudioManager.Instance?.PlaySfx(SfxType.LevelComplete);
            else AudioManager.Instance?.PlaySfx(SfxType.LevelFail);
        }
    }
}
