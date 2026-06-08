using System;
using System.Collections.Generic;
using UnityEngine;
using RainAlley.Core;

namespace RainAlley.BeatSystem
{
    public class ColorStateMachine
    {
        public UmbrellaColorType CurrentColor { get; private set; }
        public TrackPosition CurrentTrack { get; private set; }

        public event Action<UmbrellaColorType, UmbrellaColorType> OnColorChanged;
        public event Action<TrackPosition, TrackPosition> OnTrackChanged;

        private List<UmbrellaColorType> _availableColors;
        private bool _dualTrackEnabled;

        public ColorStateMachine(List<UmbrellaColorType> availableColors, bool dualTrackEnabled)
        {
            _availableColors = new List<UmbrellaColorType>(availableColors);
            _dualTrackEnabled = dualTrackEnabled;
            CurrentColor = availableColors.Count > 0 ? availableColors[0] : UmbrellaColorType.Blue;
            CurrentTrack = TrackPosition.Left;
        }

        public void SetAvailableColors(List<UmbrellaColorType> colors)
        {
            _availableColors = new List<UmbrellaColorType>(colors);
            if (!_availableColors.Contains(CurrentColor))
            {
                SetColor(_availableColors.Count > 0 ? _availableColors[0] : UmbrellaColorType.Blue);
            }
        }

        public void SetDualTrackEnabled(bool enabled)
        {
            _dualTrackEnabled = enabled;
            if (!enabled && CurrentTrack == TrackPosition.Right)
            {
                SetTrack(TrackPosition.Left);
            }
        }

        public void SetColor(UmbrellaColorType color)
        {
            if (!_availableColors.Contains(color)) return;
            if (CurrentColor == color) return;

            var old = CurrentColor;
            CurrentColor = color;
            OnColorChanged?.Invoke(old, color);
        }

        public void CycleColorForward()
        {
            if (_availableColors.Count <= 1) return;
            int idx = _availableColors.IndexOf(CurrentColor);
            idx = (idx + 1) % _availableColors.Count;
            SetColor(_availableColors[idx]);
        }

        public void CycleColorBackward()
        {
            if (_availableColors.Count <= 1) return;
            int idx = _availableColors.IndexOf(CurrentColor);
            idx = (idx - 1 + _availableColors.Count) % _availableColors.Count;
            SetColor(_availableColors[idx]);
        }

        public void SetColorByIndex(int index)
        {
            if (index < 0 || index >= _availableColors.Count) return;
            SetColor(_availableColors[index]);
        }

        public void SetTrack(TrackPosition track)
        {
            if (!_dualTrackEnabled && track == TrackPosition.Right) return;
            if (CurrentTrack == track) return;

            var old = CurrentTrack;
            CurrentTrack = track;
            OnTrackChanged?.Invoke(old, track);
        }

        public void ToggleTrack()
        {
            if (!_dualTrackEnabled) return;
            SetTrack(CurrentTrack == TrackPosition.Left ? TrackPosition.Right : TrackPosition.Left);
        }

        public void Reset()
        {
            SetColor(_availableColors.Count > 0 ? _availableColors[0] : UmbrellaColorType.Blue);
            SetTrack(TrackPosition.Left);
        }

        public List<UmbrellaColorType> GetAvailableColors()
        {
            return new List<UmbrellaColorType>(_availableColors);
        }
    }
}
