using System;
using System.Collections.Generic;
using UnityEngine;
using YouthTrainingManagement.Core;

namespace YouthTrainingManagement.Systems
{
    public class FeedbackSystem
    {
        private readonly GameManager _gameManager;
        private readonly Queue<FeedbackMessage> _messageQueue = new Queue<FeedbackMessage>();
        private readonly List<FeedbackMessage> _activeMessages = new List<FeedbackMessage>();

        public event Action<FeedbackMessage> OnFeedbackShown;
        public event Action<string, FeedbackType, float> OnToastShown;
        public event Action<string, float, float> OnStatChanged;
        public event Action<string> OnScreenShake;

        public FeedbackSystem(GameManager gameManager)
        {
            _gameManager = gameManager ?? throw new ArgumentNullException(nameof(gameManager));
        }

        public void ShowFeedback(string message, FeedbackType type = FeedbackType.Info, float duration = 3f)
        {
            var msg = new FeedbackMessage
            {
                Message = message,
                Type = type,
                Duration = duration,
                Timestamp = Time.unscaledTime
            };

            _messageQueue.Enqueue(msg);
            ProcessQueue();
            PlayFeedbackSound(type);
            Debug.Log($"[{type}] {message}");
        }

        public void ShowDetailedFeedback(string title, string message, FeedbackType type,
            Dictionary<string, float> statsDelta = null, Action onConfirm = null)
        {
            var msg = new FeedbackMessage
            {
                Title = title,
                Message = message,
                Type = type,
                StatsDelta = statsDelta,
                OnConfirm = onConfirm,
                IsModal = true,
                Timestamp = Time.unscaledTime
            };
            OnFeedbackShown?.Invoke(msg);
            PlayFeedbackSound(type);

            if (type == FeedbackType.Error || type == FeedbackType.Warning)
            {
                OnScreenShake?.Invoke(type == FeedbackType.Error ? "strong" : "light");
            }
        }

        public void ShowStatChange(string statName, float oldValue, float newValue)
        {
            if (Math.Abs(oldValue - newValue) > 0.01f)
            {
                OnStatChanged?.Invoke(statName, oldValue, newValue);
                _gameManager.AudioManager?.PlaySound(SoundType.StatChange);
            }
        }

        public void TriggerScreenShake(string intensity)
        {
            OnScreenShake?.Invoke(intensity);
        }

        public void TriggerPulseAnimation(string elementId)
        {
            _gameManager.UIManager?.PlayPulseAnimation(elementId);
        }

        public void TriggerHighlight(string elementId)
        {
            _gameManager.UIManager?.PlayHighlightAnimation(elementId);
        }

        private void ProcessQueue()
        {
            while (_messageQueue.Count > 0)
            {
                var msg = _messageQueue.Dequeue();
                if (!msg.IsModal)
                {
                    OnToastShown?.Invoke(msg.Message, msg.Type, msg.Duration);
                }
                _activeMessages.Add(msg);
            }
        }

        private void PlayFeedbackSound(FeedbackType type)
        {
            var sound = type switch
            {
                FeedbackType.Success => SoundType.Success,
                FeedbackType.Warning => SoundType.Warning,
                FeedbackType.Error => SoundType.Error,
                FeedbackType.Achievement => SoundType.Achievement,
                _ => SoundType.UIClick
            };
            _gameManager.AudioManager?.PlaySound(sound);
        }

        public List<FeedbackMessage> GetActiveMessages() => new List<FeedbackMessage>(_activeMessages);

        public void ClearExpired()
        {
            float now = Time.unscaledTime;
            _activeMessages.RemoveAll(m => !m.IsModal && now - m.Timestamp > m.Duration);
        }
    }

    [Serializable]
    public class FeedbackMessage
    {
        public string Title;
        public string Message;
        public FeedbackType Type;
        public float Duration;
        public float Timestamp;
        public bool IsModal;
        public Dictionary<string, float> StatsDelta;
        public Action OnConfirm;
        public Action OnCancel;
    }
}
