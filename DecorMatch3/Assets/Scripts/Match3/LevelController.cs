using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace DecorMatch3
{
    public class LevelController : MonoBehaviour
    {
        private Board _board;
        private SwapHandler _swapHandler;
        private ComboSystem _comboSystem;
        private LevelConfigData _config;
        private int _currentMoves;
        private int _currentScore;
        private int _collectedMaterials;
        private bool _isLevelActive;

        public void StartLevel(int levelId)
        {
            _config = ConfigManager.Instance.GetLevel(levelId);
            if (_config == null)
            {
                Debug.LogError("Level config not found: " + levelId);
                return;
            }

            _currentMoves = _config.movesLimit;
            _currentScore = 0;
            _collectedMaterials = 0;
            _isLevelActive = true;

            _board = GetComponent<Board>();
            if (_board == null)
            {
                _board = gameObject.AddComponent<Board>();
            }
            _board.Initialize(_config);

            _swapHandler = GetComponent<SwapHandler>();
            if (_swapHandler == null)
            {
                _swapHandler = gameObject.AddComponent<SwapHandler>();
            }
            _swapHandler.Initialize(_board);

            _comboSystem = GetComponent<ComboSystem>();
            if (_comboSystem == null)
            {
                _comboSystem = gameObject.AddComponent<ComboSystem>();
            }

            _board.OnBoardStabilized += OnBoardStabilized;
            GameEvents.TriggerMovesChanged(_currentMoves);
            GameEvents.TriggerScoreChanged(_currentScore);
        }

        private void OnBoardStabilized(List<MatchGroup> matches)
        {
            if (!_isLevelActive) return;

            if (matches != null && matches.Count > 0)
            {
                OnMatchProcessed(matches);
            }

            CheckLevelEnd();
        }

        public void OnMatchProcessed(List<MatchGroup> matches)
        {
            _currentMoves--;
            GameEvents.TriggerMovesChanged(_currentMoves);

            _comboSystem.StartCombo();

            int matchScore = 0;
            foreach (MatchGroup match in matches)
            {
                _comboSystem.IncrementCombo();
                matchScore += GetScoreForMatch(match);
                _collectedMaterials += match.count;
                GameEvents.TriggerTileMatched(match.count, match.type);
            }

            _currentScore += matchScore;
            GameEvents.TriggerScoreChanged(_currentScore);
        }

        public void OnMovesChanged()
        {
            GameEvents.TriggerMovesChanged(_currentMoves);
        }

        public void CheckLevelEnd()
        {
            if (_currentScore >= _config.targetScore)
            {
                EndLevel(true);
            }
            else if (_currentMoves <= 0)
            {
                EndLevel(false);
            }
        }

        public void EndLevel(bool completed)
        {
            _isLevelActive = false;

            if (completed)
            {
                int stars = CalculateStars();
                GameEvents.TriggerLevelCompleted(_config.levelId, _currentScore, stars);
                AudioManager.Instance.PlaySFX("level_complete");
            }
            else
            {
                GameEvents.TriggerLevelFailed(_config.levelId, "out_of_moves");
                AudioManager.Instance.PlaySFX("level_fail");
            }

            RecordLevelResult();
        }

        public int CalculateStars()
        {
            if (_currentScore >= _config.star3Score) return 3;
            if (_currentScore >= _config.star2Score) return 2;
            if (_currentScore >= _config.star1Score) return 1;
            return 0;
        }

        public void RecordLevelResult()
        {
            if (SaveManager.Instance != null && _config != null)
            {
                int stars = CalculateStars();
                SaveManager.Instance.UpdateLevelRecord(_config.levelId, _currentScore, stars, completed: _currentScore >= _config.targetScore);
            }
        }

        public int GetScoreForMatch(MatchGroup match)
        {
            int baseScore = match.count * 10;
            return _comboSystem.CalculateScore(baseScore);
        }

        private void OnDisable()
        {
            if (_board != null)
            {
                _board.OnBoardStabilized -= OnBoardStabilized;
            }
        }
    }
}
