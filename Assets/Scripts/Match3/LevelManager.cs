using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using DecorMatch3.Core;
using DecorMatch3.Utils;

namespace DecorMatch3.Match3
{
    public class LevelManager : MonoBehaviour
    {
        [SerializeField] private BoardManager _boardManager;
        [SerializeField] private LevelData _currentLevel;

        private int _currentScore;
        private int _movesRemaining;
        private float _timeRemaining;
        private bool _isLevelActive;
        private bool _isPaused;

        private Dictionary<int, int> _collectedMaterials = new Dictionary<int, int>();
        private Dictionary<int, int> _remainingTargets = new Dictionary<int, int>();

        public int CurrentScore => _currentScore;
        public int MovesRemaining => _movesRemaining;
        public float TimeRemaining => _timeRemaining;
        public bool IsLevelActive => _isLevelActive;
        public LevelData CurrentLevel => _currentLevel;
        public IReadOnlyDictionary<int, int> CollectedMaterials => _collectedMaterials;
        public IReadOnlyDictionary<int, int> RemainingTargets => _remainingTargets;

        public event Action<int> OnScoreChanged;
        public event Action<int> OnMovesChanged;
        public event Action<float> OnTimeChanged;
        public event Action<int, int> OnMaterialCollected;
        public event Action<int, bool, int, int, Dictionary<int, int>> OnLevelEnded;

        private void OnEnable()
        {
            if (_boardManager != null)
            {
                _boardManager.OnMatchesFound += HandleMatchesFound;
                _boardManager.OnBoardStabilized += HandleBoardStabilized;
            }
        }

        private void OnDisable()
        {
            if (_boardManager != null)
            {
                _boardManager.OnMatchesFound -= HandleMatchesFound;
                _boardManager.OnBoardStabilized -= HandleBoardStabilized;
            }
        }

        public void StartLevel(LevelData levelData)
        {
            _currentLevel = levelData;
            _currentScore = 0;
            _isPaused = false;

            InitializeLimit();
            InitializeMaterialTargets();

            _boardManager.Initialize(levelData);
            _isLevelActive = true;

            AnalyticsSystem.Instance?.StartLevelPlaythrough(levelData.LevelId);

            GameManager.Instance?.ChangeState(GameState.Match3Level);

            OnScoreChanged?.Invoke(_currentScore);
            OnMovesChanged?.Invoke(_movesRemaining);
            OnTimeChanged?.Invoke(_timeRemaining);
        }

        private void InitializeLimit()
        {
            switch (_currentLevel.LimitType)
            {
                case LevelLimitType.Moves:
                    _movesRemaining = _currentLevel.MaxMoves;
                    _timeRemaining = -1f;
                    break;
                case LevelLimitType.Time:
                    _movesRemaining = -1;
                    _timeRemaining = _currentLevel.TimeLimitSeconds;
                    break;
                case LevelLimitType.Unlimited:
                    _movesRemaining = -1;
                    _timeRemaining = -1f;
                    break;
            }
        }

        private void InitializeMaterialTargets()
        {
            _collectedMaterials.Clear();
            _remainingTargets.Clear();

            foreach (MaterialRequirement req in _currentLevel.CollectionTargets)
            {
                _remainingTargets[req.MaterialId] = req.RequiredAmount;
            }
        }

        private void Update()
        {
            if (!_isLevelActive || _isPaused) return;

            if (_currentLevel.LimitType == LevelLimitType.Time)
            {
                _timeRemaining -= Time.deltaTime;
                OnTimeChanged?.Invoke(_timeRemaining);

                if (_timeRemaining <= 0f)
                {
                    EndLevel(false, "时间耗尽");
                }
            }
        }

        private void HandleMatchesFound(List<MatchInfo> matches)
        {
            int totalScoreGained = 0;
            Dictionary<int, int> materialsGained = new Dictionary<int, int>();

            foreach (MatchInfo match in matches)
            {
                foreach (Vector2Int pos in match.TilePositions)
                {
                    TileType type = _boardManager.GridData[pos.x, pos.y];
                    int scoreForTile = _currentLevel.GetTileScore(type, match.ComboLevel);
                    totalScoreGained += scoreForTile;

                    MaterialCategory? category = type.GetMaterialCategory();
                    if (category.HasValue)
                    {
                        int matId = type.GetMaterialId();
                        if (!materialsGained.ContainsKey(matId)) materialsGained[matId] = 0;
                        materialsGained[matId]++;
                    }
                }
            }

            _currentScore += totalScoreGained;
            OnScoreChanged?.Invoke(_currentScore);

            foreach (var kvp in materialsGained)
            {
                if (!_collectedMaterials.ContainsKey(kvp.Key)) _collectedMaterials[kvp.Key] = 0;
                _collectedMaterials[kvp.Key] += kvp.Value;

                if (_remainingTargets.ContainsKey(kvp.Key))
                {
                    _remainingTargets[kvp.Key] = Mathf.Max(0, _remainingTargets[kvp.Key] - kvp.Value);
                }

                OnMaterialCollected?.Invoke(kvp.Key, kvp.Value);
            }
        }

        private void HandleBoardStabilized()
        {
            if (!_isLevelActive) return;

            if (_currentLevel.LimitType == LevelLimitType.Moves)
            {
                _movesRemaining--;
                OnMovesChanged?.Invoke(_movesRemaining);
            }

            if (CheckVictory())
            {
                EndLevel(true);
            }
            else if (_currentLevel.LimitType == LevelLimitType.Moves && _movesRemaining <= 0)
            {
                EndLevel(false, "步数耗尽");
            }
        }

        private bool CheckVictory()
        {
            if (_currentLevel.CollectionTargets.Count == 0)
            {
                return _currentScore >= _currentLevel.OneStarScore;
            }

            foreach (MaterialRequirement req in _currentLevel.CollectionTargets)
            {
                if (_remainingTargets.ContainsKey(req.MaterialId) && _remainingTargets[req.MaterialId] > 0)
                {
                    return false;
                }
            }

            return true;
        }

        private void EndLevel(bool isSuccess, string failReason = "")
        {
            _isLevelActive = false;
            int stars = _currentLevel.GetStarsForScore(_currentScore);
            int coinReward = _currentLevel.BaseCoinsReward + stars * _currentLevel.PerStarCoinBonus;

            if (isSuccess)
            {
                if (SaveSystem.Instance != null)
                {
                    SaveSystem.Instance.AddCoins(coinReward);
                    if (_currentLevel.GemReward > 0)
                    {
                        SaveSystem.Instance.AddGems(_currentLevel.GemReward);
                    }
                }

                AnalyticsSystem.Instance?.RecordLevelComplete(
                    _currentLevel.LevelId,
                    _currentScore,
                    stars,
                    _currentLevel.LimitType == LevelLimitType.Moves ? _currentLevel.MaxMoves - _movesRemaining : 0,
                    new Dictionary<int, int>(_collectedMaterials));

                if (SaveSystem.Instance != null)
                {
                    AnalyticsSystem.Instance?.RecordMaterialsCollected(_collectedMaterials);
                }
            }
            else
            {
                AnalyticsSystem.Instance?.RecordLevelFail(_currentLevel.LevelId, failReason);
            }

            OnLevelEnded?.Invoke(stars, isSuccess, _currentScore, coinReward, _collectedMaterials);
        }

        public void PauseLevel()
        {
            _isPaused = true;
            Time.timeScale = 0f;
            GameManager.Instance?.ChangeState(GameState.Paused);
        }

        public void ResumeLevel()
        {
            _isPaused = false;
            Time.timeScale = 1f;
            GameManager.Instance?.ChangeState(GameState.Match3Level);
        }

        public void QuitLevel()
        {
            _isLevelActive = false;
            _isPaused = false;
            Time.timeScale = 1f;
            _boardManager.ClearBoard();
        }

        public void RestartLevel()
        {
            if (_currentLevel != null)
            {
                QuitLevel();
                StartLevel(_currentLevel);
            }
        }

        public float GetScoreProgress()
        {
            if (_currentScore >= _currentLevel.ThreeStarScore) return 1f;
            return (float)_currentScore / _currentLevel.ThreeStarScore;
        }

        public float GetMaterialProgress(int materialId)
        {
            if (!_remainingTargets.ContainsKey(materialId)) return 1f;

            MaterialRequirement req = _currentLevel.CollectionTargets.Find(r => r.MaterialId == materialId);
            if (req == null) return 1f;

            int collected = _collectedMaterials.ContainsKey(materialId) ? _collectedMaterials[materialId] : 0;
            return Mathf.Clamp01((float)collected / req.RequiredAmount);
        }

        public Dictionary<int, int> GetRemainingMaterialTargets()
        {
            return new Dictionary<int, int>(_remainingTargets);
        }
    }
}
