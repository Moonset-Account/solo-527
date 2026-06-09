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
            EventBus.Subscribe<ScoreUpdatedEvent>(OnScore);
            EventBus.Subscribe<TimerUpdatedEvent>(OnTimer);
            EventBus.Subscribe<OrderCreatedEvent>(OnOrderCreated);
            EventBus.Subscribe<OrderDeliveredEvent>(OnOrderDelivered);
            EventBus.Subscribe<OrderFailedEvent>(OnOrderFailed);
            EventBus.Subscribe<LevelStartedEvent>(OnLevelStarted);
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
