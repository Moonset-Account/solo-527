using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Config;
using KitchenChaos.OrderSystem;

namespace KitchenChaos.Scoring
{
    public class ScoreManager : MonoBehaviour
    {
        [SerializeField] int _score;
        [SerializeField] int _combo;
        [SerializeField] float _comboTimer;

        public int CurrentScore => _score;
        public int CurrentCombo => _combo;
        public float ComboTimeRemaining => _comboTimer;

        GameConfig _config;

        void Awake()
        {
            ServiceLocator.Register(this);
            ServiceLocator.TryGet(out _config);
        }

        void Update()
        {
            if (_combo > 0)
            {
                float window = _config != null ? _config.ComboTimeWindow : 8f;
                _comboTimer -= Time.deltaTime;
                if (_comboTimer <= 0) { _combo = 0; _comboTimer = 0; }
            }
        }

        public void ResetCombo()
        {
            _combo = 0;
            _comboTimer = 0;
            _score = 0;
        }

        public int OnOrderDelivered(Order order, OrderMatchResult match, int playerId)
        {
            if (order == null) return 0;

            _config ??= ServiceLocator.Get<GameConfig>();

            int baseScore = order.BaseScore;
            int delta = baseScore;

            if (match.PerfectTiming && _config != null)
                delta += _config.PerfectDeliveryBonus;

            if (match.TimeRemainingRatio > 0.75f)
                delta += Mathf.RoundToInt(baseScore * 0.25f);
            else if (match.TimeRemainingRatio < 0.25f)
                delta = Mathf.RoundToInt(delta * 0.5f);

            _combo++;
            _comboTimer = _config != null ? _config.ComboTimeWindow : 8f;

            int comboBonus = 0;
            if (_config != null && _combo > 1)
                comboBonus = Mathf.Min(_config.MaxComboBonus, (_combo - 1) * _config.ComboMultiplierPerStack);

            delta += comboBonus;

            _score += delta;
            EventBus.Raise(new ScoreUpdatedEvent { CurrentScore = _score, Delta = delta, ComboCount = _combo });
            return delta;
        }

        public void OnOrderFailed(int penalty)
        {
            _score = Mathf.Max(0, _score - penalty);
            _combo = 0;
            _comboTimer = 0;
            EventBus.Raise(new ScoreUpdatedEvent { CurrentScore = _score, Delta = -penalty, ComboCount = 0 });
        }

        public void OnWrongDelivery()
        {
            _config ??= ServiceLocator.Get<GameConfig>();
            int penalty = _config != null ? Mathf.RoundToInt(_config.FailPenaltyScore * 0.3f) : 30;
            _score = Mathf.Max(0, _score - penalty);
            _combo = 0;
            _comboTimer = 0;
            EventBus.Raise(new ScoreUpdatedEvent { CurrentScore = _score, Delta = -penalty, ComboCount = 0 });
        }

        public void AddBonus(int amount)
        {
            _score += amount;
            EventBus.Raise(new ScoreUpdatedEvent { CurrentScore = _score, Delta = amount, ComboCount = _combo });
        }
    }
}
