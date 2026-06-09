using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using KitchenChaos.Core;
using KitchenChaos.OrderSystem;
using KitchenChaos.Ingredients;

namespace KitchenChaos.UI
{
    public class HUDPanel : MonoBehaviour
    {
        [SerializeField] TMP_Text _scoreText;
        [SerializeField] TMP_Text _comboText;
        [SerializeField] TMP_Text _timerText;
        [SerializeField] Image _timerFill;
        [SerializeField] Transform _ordersParent;
        [SerializeField] GameObject _orderCardPrefab;
        [SerializeField] Image[] _starImages;
        [SerializeField] TMP_Text _levelNameText;

        readonly List<GameObject> _orderCards = new();
        float _totalTime = 180f;

        void OnEnable()
        {
            AutoBuildUI();
            EventBus.Subscribe<ScoreUpdatedEvent>(OnScore);
            EventBus.Subscribe<TimerUpdatedEvent>(OnTimer);
            EventBus.Subscribe<OrderCreatedEvent>(OnOrderCreated);
            EventBus.Subscribe<OrderDeliveredEvent>(OnOrderDelivered);
            EventBus.Subscribe<OrderFailedEvent>(OnOrderFailed);
            EventBus.Subscribe<LevelStartedEvent>(OnLevelStarted);
        }

        void AutoBuildUI()
        {
            var root = (RectTransform)transform;
            root.anchorMin = Vector2.zero; root.anchorMax = Vector2.one;
            root.offsetMin = Vector2.zero; root.offsetMax = Vector2.zero;

            BuildTopBar(root);
            BuildStarProgress(root);
            BuildOrderTray(root);
        }

        void BuildTopBar(RectTransform root)
        {
            var topGo = new GameObject("TopBar", typeof(RectTransform), typeof(Image));
            topGo.transform.SetParent(root, false);
            var trt = (RectTransform)topGo.transform;
            trt.anchorMin = new Vector2(0, 1); trt.anchorMax = new Vector2(1, 1);
            trt.pivot = new Vector2(0.5f, 1);
            trt.sizeDelta = new Vector2(0, 80);
            var bg = topGo.GetComponent<Image>();
            bg.color = new Color(0, 0, 0, 0.55f);

            _levelNameText = HUDBuildText(topGo.transform, "LevelName", "—", 24,
                new Vector2(0, 0.5f), new Vector2(0.35f, 0.5f), TextAlignmentOptions.MidlineLeft,
                new Color(0.85f, 0.95f, 1f), new Vector2(20, 0, -10, 0));

            var timerGo = new GameObject("TimerArea", typeof(RectTransform));
            timerGo.transform.SetParent(topGo.transform, false);
            var tirt = (RectTransform)timerGo.transform;
            tirt.anchorMin = new Vector2(0.35f, 0); tirt.anchorMax = new Vector2(0.65f, 1);
            tirt.offsetMin = Vector2.zero; tirt.offsetMax = Vector2.zero;

            _timerText = HUDBuildText(timerGo.transform, "TimerText", "3:00", 34,
                new Vector2(0, 0), new Vector2(1, 1), TextAlignmentOptions.Center, Color.white);
            _timerText.fontStyle = FontStyles.Bold;

            var fillGo = new GameObject("TimerFill", typeof(RectTransform), typeof(Image));
            fillGo.transform.SetParent(timerGo.transform, false);
            fillGo.transform.SetAsFirstSibling();
            var frt = (RectTransform)fillGo.transform;
            frt.anchorMin = new Vector2(0, 0.9f); frt.anchorMax = new Vector2(1, 1);
            frt.offsetMin = Vector2.zero; frt.offsetMax = Vector2.zero;
            var fimg = fillGo.GetComponent<Image>();
            fimg.color = new Color(0.3f, 0.9f, 0.5f, 0.6f);
            fimg.type = Image.Type.Filled;
            fimg.fillMethod = Image.FillMethod.Horizontal;
            _timerFill = fimg;

            _scoreText = HUDBuildText(topGo.transform, "Score", "$ 0", 26,
                new Vector2(0.65f, 0.5f), new Vector2(0.88f, 0.5f), TextAlignmentOptions.MidlineRight,
                new Color(1f, 0.95f, 0.4f), Vector2.zero);
            _scoreText.fontStyle = FontStyles.Bold;

            _comboText = HUDBuildText(topGo.transform, "Combo", "连击 x1", 16,
                new Vector2(0.88f, 0.5f), new Vector2(1, 0.5f), TextAlignmentOptions.MidlineRight,
                new Color(1f, 0.6f, 0.3f), new Vector2(0, 0, -10, 0));
            _comboText.enabled = false;
        }

        void BuildStarProgress(RectTransform root)
        {
            var starsGo = new GameObject("Stars", typeof(RectTransform));
            starsGo.transform.SetParent(root, false);
            var srt = (RectTransform)starsGo.transform;
            srt.anchorMin = new Vector2(0.5f, 1); srt.anchorMax = new Vector2(0.5f, 1);
            srt.pivot = new Vector2(0.5f, 1);
            srt.sizeDelta = new Vector2(260, 40);
            srt.anchoredPosition = new Vector2(0, -70);
            _starImages = new Image[3];
            for (int i = 0; i < 3; i++)
            {
                var sg = new GameObject($"Star{i}", typeof(RectTransform), typeof(Image));
                sg.transform.SetParent(starsGo.transform, false);
                var s = (RectTransform)sg.transform;
                s.anchorMin = new Vector2((float)i / 3, 0); s.anchorMax = new Vector2((float)(i + 1) / 3, 1);
                s.offsetMin = new Vector2(5, 0); s.offsetMax = new Vector2(-5, 0);
                var img = sg.GetComponent<Image>();
                img.color = new Color(1, 1, 1, 0.25f);
                var txt = sg.AddComponent<TextMeshProUGUI>();
                txt.text = "⭐"; txt.fontSize = 28; txt.alignment = TextAlignmentOptions.Center;
                _starImages[i] = img;
            }
        }

        void BuildOrderTray(RectTransform root)
        {
            var trayGo = new GameObject("OrdersTray", typeof(RectTransform), typeof(Image));
            trayGo.transform.SetParent(root, false);
            var tart = (RectTransform)trayGo.transform;
            tart.anchorMin = new Vector2(0, 0); tart.anchorMax = new Vector2(1, 0);
            tart.pivot = new Vector2(0.5f, 0);
            tart.sizeDelta = new Vector2(0, 140);
            trayGo.GetComponent<Image>().color = new Color(0, 0, 0, 0.45f);

            var scrollGo = new GameObject("Scroll", typeof(RectTransform), typeof(ScrollRect));
            scrollGo.transform.SetParent(trayGo.transform, false);
            var srt = (RectTransform)scrollGo.transform;
            srt.anchorMin = new Vector2(0.03f, 0.1f); srt.anchorMax = new Vector2(0.97f, 0.9f);
            srt.offsetMin = Vector2.zero; srt.offsetMax = Vector2.zero;

            var view = new GameObject("Viewport", typeof(RectTransform), typeof(RectMask2D));
            view.transform.SetParent(scrollGo.transform, false);
            var vrt = (RectTransform)view.transform;
            vrt.anchorMin = Vector2.zero; vrt.anchorMax = Vector2.one;
            vrt.offsetMin = Vector2.zero; vrt.offsetMax = Vector2.zero;

            var ordersGo = new GameObject("Orders", typeof(RectTransform), typeof(HorizontalLayoutGroup), typeof(ContentSizeFitter));
            ordersGo.transform.SetParent(view.transform, false);
            var ort = (RectTransform)ordersGo.transform;
            ort.anchorMin = new Vector2(0, 0.5f); ort.anchorMax = new Vector2(0, 0.5f);
            ort.pivot = new Vector2(0, 0.5f); ort.sizeDelta = new Vector2(0, 110);
            var hg = ordersGo.GetComponent<HorizontalLayoutGroup>();
            hg.childAlignment = TextAnchor.MiddleLeft;
            hg.childControlHeight = true; hg.childControlWidth = true;
            hg.childForceExpandHeight = true; hg.childForceExpandWidth = false;
            hg.spacing = 12; hg.padding = new RectOffset(10, 10, 0, 0);
            var csf = ordersGo.GetComponent<ContentSizeFitter>();
            csf.horizontalFit = ContentSizeFitter.FitMode.PreferredSize;
            csf.verticalFit = ContentSizeFitter.FitMode.Unconstrained;
            var sr = scrollGo.GetComponent<ScrollRect>();
            sr.viewport = vrt; sr.content = ort;
            sr.horizontal = true; sr.vertical = false; sr.scrollSensitivity = 20;

            _ordersParent = ort;
        }

        static TMP_Text HUDBuildText(Transform parent, string name, string txt, int size,
            Vector2 aMin, Vector2 aMax, TextAlignmentOptions align, Color? c = null, Vector2? ofs = null)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = aMin; rt.anchorMax = aMax;
            var o = ofs ?? Vector2.zero;
            rt.offsetMin = new Vector2(o.x, o.y); rt.offsetMax = new Vector2(o.z, o.w);
            var t = go.AddComponent<TextMeshProUGUI>();
            t.text = txt; t.fontSize = size; t.alignment = align; t.color = c ?? Color.white;
            t.enableWordWrapping = false; t.overflowMode = TextOverflowModes.Overflow;
            return t;
        }

        void OnDisable()
        {
            EventBus.Unsubscribe<ScoreUpdatedEvent>(OnScore);
            EventBus.Unsubscribe<TimerUpdatedEvent>(OnTimer);
            EventBus.Unsubscribe<OrderCreatedEvent>(OnOrderCreated);
            EventBus.Unsubscribe<OrderDeliveredEvent>(OnOrderDelivered);
            EventBus.Unsubscribe<OrderFailedEvent>(OnOrderFailed);
            EventBus.Unsubscribe<LevelStartedEvent>(OnLevelStarted);
        }

        void OnLevelStarted(LevelStartedEvent e)
        {
            _totalTime = e.Duration;
            var gm = ServiceLocator.Get<GameManager>();
            if (_levelNameText != null && gm != null)
                _levelNameText.text = gm.CurrentLevelConfig.LevelName;
            ClearOrderCards();
        }

        void OnScore(ScoreUpdatedEvent e)
        {
            if (_scoreText != null) _scoreText.text = $"$ {e.CurrentScore}";
            if (_comboText != null)
            {
                _comboText.enabled = e.ComboCount > 1;
                _comboText.text = $"连击 x{e.ComboCount}";
            }
            UpdateStarProgress(e.CurrentScore);
        }

        void UpdateStarProgress(int score)
        {
            var gm = ServiceLocator.Get<GameManager>();
            if (gm == null || _starImages == null) return;
            var thresh = gm.CurrentLevelConfig.StarThresholds;
            for (int i = 0; i < _starImages.Length; i++)
            {
                if (_starImages[i] == null) continue;
                bool earned = i < thresh.Length && score >= thresh[i];
                _starImages[i].color = earned ? Color.yellow : new Color(1f, 1f, 1f, 0.3f);
            }
        }

        void OnTimer(TimerUpdatedEvent e)
        {
            if (_timerText != null)
            {
                var t = Mathf.Max(0, e.TimeRemaining);
                int m = (int)(t / 60);
                int s = (int)(t % 60);
                _timerText.text = $"{m}:{s:00}";
                _timerText.color = t < 30 ? Color.red : t < 60 ? new Color(1f, 0.7f, 0.2f) : Color.white;
            }
            if (_timerFill != null)
                _timerFill.fillAmount = Mathf.Clamp01(e.TimeRemaining / Mathf.Max(0.01f, _totalTime));
        }

        void OnOrderCreated(OrderCreatedEvent e)
        {
            var go = _orderCardPrefab != null
                ? Instantiate(_orderCardPrefab, _ordersParent)
                : CreateFallbackCard(_ordersParent);
            var card = go.GetComponent<OrderCard>() ?? go.AddComponent<OrderCard>();
            card.SetOrder(e);
            _orderCards.Add(go);
            LayoutRebuild();
        }

        void OnOrderDelivered(OrderDeliveredEvent e)
        {
            RemoveCard(e.OrderId, true);
        }

        void OnOrderFailed(OrderFailedEvent e)
        {
            RemoveCard(e.OrderId, false);
        }

        void RemoveCard(Guid orderId, bool success)
        {
            for (int i = _orderCards.Count - 1; i >= 0; i--)
            {
                var c = _orderCards[i];
                if (c == null) { _orderCards.RemoveAt(i); continue; }
                var card = c.GetComponent<OrderCard>();
                if (card != null && card.OrderId == orderId)
                {
                    card.PlayOutAnimation(success, () => Destroy(c));
                    _orderCards.RemoveAt(i);
                    break;
                }
            }
        }

        void ClearOrderCards()
        {
            foreach (var c in _orderCards) if (c) Destroy(c);
            _orderCards.Clear();
        }

        void LateUpdate()
        {
            foreach (var c in _orderCards)
                c?.GetComponent<OrderCard>()?.UpdateTiming();
        }

        GameObject CreateFallbackCard(Transform parent)
        {
            var go = new GameObject("OrderCard", typeof(RectTransform), typeof(Image), typeof(OrderCard));
            go.transform.SetParent(parent, false);
            var img = go.GetComponent<Image>();
            img.color = new Color(0.15f, 0.15f, 0.2f, 0.95f);
            var rt = (RectTransform)go.transform;
            rt.sizeDelta = new Vector2(200, 120);
            var layout = go.AddComponent<VerticalLayoutGroup>();
            layout.padding = new RectOffset(8, 8, 6, 6);
            layout.spacing = 4;
            layout.childForceExpandWidth = true;
            layout.childControlHeight = true;
            return go;
        }

        void LayoutRebuild()
        {
            if (_ordersParent != null) LayoutRebuilder.ForceRebuildLayoutImmediate((RectTransform)_ordersParent);
        }
    }

    public class OrderCard : MonoBehaviour
    {
        [SerializeField] TMP_Text _titleText;
        [SerializeField] TMP_Text _ingredientsText;
        [SerializeField] TMP_Text _scoreText;
        [SerializeField] Image _timerBar;
        [SerializeField] RectTransform _root;

        public Guid OrderId { get; private set; }
        float _timeLimit;
        float _createTime;
        CanvasGroup _cg;

        public void SetOrder(OrderCreatedEvent e)
        {
            OrderId = e.OrderId;
            _timeLimit = e.TimeLimit;
            _createTime = Time.time;

            if (_cg == null) _cg = gameObject.AddComponent<CanvasGroup>();
            _cg.alpha = 1f;

            var recipe = RecipeLibrary.Get(e.RecipeName);
            if (_titleText != null) _titleText.text = recipe.DisplayName;
            else
            {
                var t = GetOrAddText("Title", 18, TextAlignmentOptions.Center);
                t.color = Color.white;
                t.text = recipe.DisplayName;
            }
            if (_ingredientsText != null)
                _ingredientsText.text = string.Join(" + ", e.Ingredients);
            else
            {
                var t = GetOrAddText("Ingredients", 13, TextAlignmentOptions.Left);
                t.color = new Color(0.85f, 0.85f, 0.7f);
                t.text = string.Join(" + ", e.Ingredients);
            }
            if (_scoreText != null) _scoreText.text = $"${e.BaseScore}";
            else
            {
                var t = GetOrAddText("Score", 14, TextAlignmentOptions.Right);
                t.color = new Color(1f, 0.85f, 0.2f);
                t.text = $"${e.BaseScore}";
            }

            if (_timerBar == null)
            {
                var go = new GameObject("TimerBar", typeof(RectTransform), typeof(Image));
                go.transform.SetParent(transform, false);
                var rt = (RectTransform)go.transform;
                rt.anchorMin = new Vector2(0, 0); rt.anchorMax = new Vector2(1, 0);
                rt.pivot = new Vector2(0.5f, 0);
                rt.sizeDelta = new Vector2(0, 6);
                var img = go.GetComponent<Image>();
                img.color = new Color(0.4f, 0.8f, 0.4f);
                img.type = Image.Type.Filled;
                img.fillMethod = Image.FillMethod.Horizontal;
                img.fillAmount = 1f;
                _timerBar = img;
            }
            else { _timerBar.fillAmount = 1f; }
        }

        TMP_Text GetOrAddText(string goName, int size, TextAlignmentOptions align)
        {
            var t = transform.Find(goName)?.GetComponent<TMP_Text>();
            if (t != null) return t;
            var go = new GameObject(goName, typeof(RectTransform));
            go.transform.SetParent(transform, false);
            t = go.AddComponent<TextMeshProUGUI>();
            t.fontSize = size;
            t.alignment = align;
            t.enableWordWrapping = true;
            t.overflowMode = TextOverflowModes.Ellipsis;
            return t;
        }

        public void UpdateTiming()
        {
            float remaining = _timeLimit - (Time.time - _createTime);
            float ratio = Mathf.Clamp01(remaining / _timeLimit);
            if (_timerBar != null)
            {
                _timerBar.fillAmount = ratio;
                _timerBar.color = ratio < 0.25f ? Color.red : ratio < 0.5f ? new Color(1f, 0.7f, 0.2f) : new Color(0.4f, 0.8f, 0.4f);
            }
        }

        public void PlayOutAnimation(bool success, Action onDone)
        {
            StartCoroutine(OutAnim(success, onDone));
        }

        System.Collections.IEnumerator OutAnim(bool success, Action onDone)
        {
            float t = 0;
            if (_cg == null) _cg = gameObject.AddComponent<CanvasGroup>();
            while (t < 0.3f)
            {
                t += Time.deltaTime;
                _cg.alpha = 1 - (t / 0.3f);
                if (_root != null) _root.localScale = Vector3.one * (success ? 1 + t : 1 - t);
                yield return null;
            }
            onDone?.Invoke();
        }
    }
}
