using System;
using UnityEngine;
using PuppetTheater.Data;
using PuppetTheater.Core;
using PuppetTheater.Audio;
using PuppetTheater.Input;
using PuppetTheater.Light;
using PuppetTheater.Stage;
using PuppetTheater.Story;
using PuppetTheater.UI;
using PuppetTheater.Leaderboard;

namespace PuppetTheater.Core
{
    public class GameSession : MonoBehaviour
    {
        [SerializeField] private BeatManager _beatManager;
        [SerializeField] private LightStateSystem _lightStateSystem;
        [SerializeField] private StageMechanism _stageMechanism;
        [SerializeField] private StoryNodeSystem _storyNodeSystem;
        [SerializeField] private InputManager _inputManager;
        [SerializeField] private AudioManager _audioManager;
        [SerializeField] private AnimationFeedback _animationFeedback;
        [SerializeField] private ResultScreen _resultScreen;
        [SerializeField] private CalibrationPage _calibrationPage;
        [SerializeField] private LeaderboardSystem _leaderboardSystem;

        private GameMode _gameMode;
        private PerformanceStats _currentStats;
        private int _consecutiveMisses;
        private int _angryBeatCount;
        private bool _isSessionActive;
        private bool _isPaused;
        private bool _sessionEnded;
        private int _currentCombo;
        private int _maxCombo;

        public GameMode GameMode => _gameMode;
        public bool IsPaused => _isPaused;
        public bool IsSessionActive => _isSessionActive;

        public void StartSession(StoryScriptData storyScript, GameMode mode)
        {
            _gameMode = mode;
            _isSessionActive = true;
            _isPaused = false;
            _sessionEnded = false;
            _consecutiveMisses = 0;
            _angryBeatCount = 0;
            _currentCombo = 0;
            _maxCombo = 0;

            _currentStats = new PerformanceStats();

            _lightStateSystem.SetSongTimeProvider(() => _beatManager.SongPositionMs);
            _storyNodeSystem.LoadStoryScript(storyScript);
            _audioManager.PreloadSounds();

            SubscribeEvents();

            _audioManager.SetMusicVolume(0.6f);
            _beatManager.StartSong();
        }

        public void EndSession()
        {
            if (_sessionEnded) return;
            _sessionEnded = true;
            _isSessionActive = false;

            UnsubscribeEvents();

            _animationFeedback.StopAllFeedback();
            _audioManager.PauseMusic();

            FinalizeStats();

            _resultScreen.DisplayResults(_currentStats);

            if (_currentStats.FailReason == FailReason.None && _gameMode == GameMode.Normal)
            {
                _leaderboardSystem.SubmitScore(_currentStats, _gameMode, "Player");
            }
        }

        public void PauseSession()
        {
            if (!_isSessionActive || _isPaused) return;
            _isPaused = true;
            _audioManager.PauseMusic();
        }

        public void ResumeSession()
        {
            if (!_isSessionActive || !_isPaused) return;
            _isPaused = false;
            _audioManager.ResumeMusic();
        }

        public PerformanceStats GetCurrentStats()
        {
            return _currentStats;
        }

        private void SubscribeEvents()
        {
            _inputManager.OnLightInput += HandleLightInput;
            _beatManager.OnBeatHit += HandleBeatHit;
            _beatManager.OnBeatMissed += HandleBeatMissed;
            _beatManager.OnBeatApproaching += HandleBeatApproaching;
            _storyNodeSystem.OnAudienceEmotionChanged += HandleAudienceEmotionChanged;
            _storyNodeSystem.OnNodeChanged += HandleNodeChanged;
            _stageMechanism.OnPuppetCollapsed += HandlePuppetCollapsed;
        }

        private void UnsubscribeEvents()
        {
            _inputManager.OnLightInput -= HandleLightInput;
            _beatManager.OnBeatHit -= HandleBeatHit;
            _beatManager.OnBeatMissed -= HandleBeatMissed;
            _beatManager.OnBeatApproaching -= HandleBeatApproaching;
            _storyNodeSystem.OnAudienceEmotionChanged -= HandleAudienceEmotionChanged;
            _storyNodeSystem.OnNodeChanged -= HandleNodeChanged;
            _stageMechanism.OnPuppetCollapsed -= HandlePuppetCollapsed;
        }

        private void HandleLightInput(LightColor inputColor, double inputTimeMs)
        {
            if (!_isSessionActive || _isPaused) return;

            _beatManager.JudgeInput(inputColor, inputTimeMs);
        }

        private void HandleBeatHit(JudgmentResult result)
        {
            ProcessJudgmentResult(result);
        }

        private void HandleBeatMissed(int beatIndex)
        {
            if (!_isSessionActive || _isPaused) return;

            var missResult = new JudgmentResult
            {
                Grade = JudgmentGrade.Miss,
                OffsetMs = 0,
                ExpectedColor = LightColor.White,
                ActualColor = LightColor.White,
                BeatIndex = beatIndex
            };

            ProcessJudgmentResult(missResult);
        }

        private void ProcessJudgmentResult(JudgmentResult result)
        {
            UpdatePerformanceStats(result);

            PuppetActionType beatAction = GetBeatAction(result.BeatIndex);
            _storyNodeSystem.RecordChoice(result.ActualColor, beatAction);

            if (result.IsMiss)
            {
                _consecutiveMisses++;
                _audioManager.PlayJudgmentSound(JudgmentGrade.Miss);
                _animationFeedback.TriggerJudgmentFeedback(JudgmentGrade.Miss, result.ActualColor);
                _storyNodeSystem.UpdateAudienceEmotion(JudgmentGrade.Miss);

                if (result.ExpectedColor != result.ActualColor)
                {
                    _lightStateSystem.FlashError();
                    _audioManager.PlayLightSwitchSound(result.ExpectedColor, result.ActualColor, false);
                }

                CheckFailConditions();
                return;
            }

            _consecutiveMisses = 0;

            _lightStateSystem.SwitchLight(result.ActualColor, result.IsHit);
            _stageMechanism.CurrentStageLight = result.ActualColor;
            _audioManager.PlayJudgmentSound(result.Grade);
            _animationFeedback.TriggerJudgmentFeedback(result.Grade, result.ActualColor);
            _animationFeedback.TriggerComboFeedback(_currentCombo);
            _storyNodeSystem.UpdateAudienceEmotion(result.Grade);

            if (result.IsHit)
            {
                int puppetPos = result.BeatIndex % 5;
                _stageMechanism.TriggerPuppetAction(puppetPos, beatAction, result.ExpectedColor);
            }
            else
            {
                _lightStateSystem.FlashError();
                _audioManager.PlayLightSwitchSound(result.ExpectedColor, result.ActualColor, false);
            }
        }

        private void UpdatePerformanceStats(JudgmentResult result)
        {
            switch (result.Grade)
            {
                case JudgmentGrade.Perfect:
                    _currentStats.PerfectCount++;
                    _currentCombo++;
                    break;
                case JudgmentGrade.Great:
                    _currentStats.GreatCount++;
                    _currentCombo++;
                    break;
                case JudgmentGrade.Good:
                    _currentStats.GoodCount++;
                    _currentCombo++;
                    break;
                case JudgmentGrade.Early:
                    _currentStats.EarlyCount++;
                    _currentCombo = 0;
                    break;
                case JudgmentGrade.Late:
                    _currentStats.LateCount++;
                    _currentCombo = 0;
                    break;
                case JudgmentGrade.Miss:
                    _currentStats.MissCount++;
                    _currentCombo = 0;
                    break;
            }

            if (_currentCombo > _maxCombo)
                _maxCombo = _currentCombo;

            _currentStats.MaxCombo = _maxCombo;
            _currentStats.TotalBeats++;
            _currentStats.TotalScore = ComputeRunningScore();
        }

        private double ComputeRunningScore()
        {
            double score = 0;
            score += _currentStats.PerfectCount * 300;
            score += _currentStats.GreatCount * 200;
            score += _currentStats.GoodCount * 100;
            score += _maxCombo * 10;
            return score;
        }

        private void HandleBeatApproaching(int beatIndex, double timeUntilMs)
        {
            if (!_isSessionActive || _isPaused) return;
            _animationFeedback.TriggerBeatApproachingFeedback(beatIndex, timeUntilMs);
        }

        private void HandleAudienceEmotionChanged(AudienceEmotion previousEmotion, AudienceEmotion newEmotion)
        {
            if (!_isSessionActive) return;

            _audioManager.PlayAudienceReaction(newEmotion);
            _animationFeedback.TriggerAudienceFeedback(newEmotion);

            if (newEmotion == AudienceEmotion.Angry)
            {
                _angryBeatCount++;
                CheckFailConditions();
            }
            else
            {
                _angryBeatCount = 0;
            }
        }

        private void HandleNodeChanged(StoryNode previousNode, StoryNode currentNode)
        {
            if (!_isSessionActive) return;

            if (currentNode != null && !string.IsNullOrEmpty(currentNode.nodeId))
            {
                _audioManager.PlayStoryEventSound(currentNode.nodeId);
            }

            if (currentNode != null && currentNode.nextNodeIds != null && currentNode.nextNodeIds.Count == 0)
            {
                _currentStats.Completed = true;
                EndSession();
            }
        }

        private void HandlePuppetCollapsed(int positionIndex)
        {
            if (!_isSessionActive) return;

            _audioManager.PlayPuppetCollapseSound();

            if (_stageMechanism.IsCriticalPuppet(positionIndex))
            {
                _currentStats.FailReason = FailReason.PuppetCollapsed;
                _animationFeedback.TriggerFailFeedback(FailReason.PuppetCollapsed);
                EndSession();
            }
        }

        private void CheckFailConditions()
        {
            if (_consecutiveMisses >= 5)
            {
                _currentStats.FailReason = FailReason.TooManyMisses;
                _animationFeedback.TriggerFailFeedback(FailReason.TooManyMisses);
                EndSession();
                return;
            }

            if (_angryBeatCount >= 3)
            {
                _currentStats.FailReason = FailReason.AudienceLeft;
                _animationFeedback.TriggerFailFeedback(FailReason.AudienceLeft);
                EndSession();
                return;
            }
        }

        private PuppetActionType GetBeatAction(int beatIndex)
        {
            var map = _beatManager.BeatMap;
            if (beatIndex >= 0 && beatIndex < map.Count && map[beatIndex].actionType.HasValue)
                return map[beatIndex].actionType.Value;
            return PuppetActionType.Idle;
        }

        private void FinalizeStats()
        {
            _currentStats.TotalScore = ComputeRunningScore();

            _currentStats.AudienceEmotionScore = _storyNodeSystem.GetAudienceEmotionValue() / 4f;
            _currentStats.FinalBranch = _storyNodeSystem.EvaluateBranch();

            if (_currentStats.FailReason != FailReason.None)
            {
                _currentStats.Completed = false;
            }
        }

        private void OnDestroy()
        {
            if (_isSessionActive)
            {
                UnsubscribeEvents();
            }
        }
    }
}
