using UnityEngine;
using RainAlley.Core;

namespace RainAlley.Track
{
    public class TrackSwitchVisualizer : MonoBehaviour
    {
        [Header("轨道")]
        public Transform LeftTrackAnchor;
        public Transform RightTrackAnchor;
        public float TrackSwitchDurationMs = 200f;

        [Header("角色")]
        public Transform PlayerTransform;

        private TrackPosition _currentTrack = TrackPosition.Left;
        private TrackPosition _targetTrack = TrackPosition.Left;
        private float _switchProgress = 1f;
        private Vector3 _startPos;
        private Vector3 _endPos;

        public void SetInitialTrack(TrackPosition track)
        {
            _currentTrack = track;
            _targetTrack = track;
            _switchProgress = 1f;
            UpdatePlayerPosition(track, 1f);
        }

        public void RequestSwitch(TrackPosition target)
        {
            if (_targetTrack == target) return;
            _startPos = GetTrackPosition(_currentTrack);
            _targetTrack = target;
            _endPos = GetTrackPosition(_targetTrack);
            _switchProgress = 0f;
        }

        public void UpdateVisual(float deltaTimeMs)
        {
            if (_switchProgress < 1f)
            {
                _switchProgress = Mathf.Min(1f, _switchProgress + deltaTimeMs / TrackSwitchDurationMs);
                float t = EaseOutCubic(_switchProgress);
                PlayerTransform.position = Vector3.Lerp(_startPos, _endPos, t);

                if (_switchProgress >= 1f)
                {
                    _currentTrack = _targetTrack;
                }
            }
        }

        private Vector3 GetTrackPosition(TrackPosition track)
        {
            if (track == TrackPosition.Left && LeftTrackAnchor != null)
                return LeftTrackAnchor.position;
            if (track == TrackPosition.Right && RightTrackAnchor != null)
                return RightTrackAnchor.position;
            return PlayerTransform != null ? PlayerTransform.position : Vector3.zero;
        }

        private void UpdatePlayerPosition(TrackPosition track, float t)
        {
            if (PlayerTransform == null) return;
            PlayerTransform.position = GetTrackPosition(track);
        }

        private float EaseOutCubic(float t)
        {
            return 1f - Mathf.Pow(1f - t, 3);
        }
    }
}
