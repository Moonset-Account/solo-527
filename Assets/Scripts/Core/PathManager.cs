using System;
using System.Collections.Generic;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class PathManager
    {
        private List<Vector3> _pathPoints;
        private float[] _segmentLengths;
        private float _totalLength;
        private bool _isInitialized;

        public bool IsInitialized => _isInitialized;
        public float TotalLength => _totalLength;
        public int PointCount => _pathPoints.Count;

        public event Action OnPathChanged;

        public PathManager()
        {
            _pathPoints = new List<Vector3>();
        }

        public void Initialize(List<PathPoint> configPoints)
        {
            _pathPoints.Clear();
            foreach (var p in configPoints)
            {
                _pathPoints.Add(new Vector3(p.x, p.y, p.z));
            }
            CalculateSegmentLengths();
            _isInitialized = true;
            OnPathChanged?.Invoke();
        }

        public void SetCustomPath(List<Vector3> newPath)
        {
            _pathPoints = new List<Vector3>(newPath);
            CalculateSegmentLengths();
            OnPathChanged?.Invoke();
        }

        private void CalculateSegmentLengths()
        {
            _segmentLengths = new float[_pathPoints.Count - 1];
            _totalLength = 0;
            for (int i = 0; i < _segmentLengths.Length; i++)
            {
                _segmentLengths[i] = Vector3.Distance(_pathPoints[i], _pathPoints[i + 1]);
                _totalLength += _segmentLengths[i];
            }
        }

        public Vector3 GetPointAtDistance(float distance)
        {
            if (_pathPoints.Count < 2) return Vector3.zero;
            distance = Mathf.Clamp(distance, 0, _totalLength);

            float remaining = distance;
            for (int i = 0; i < _segmentLengths.Length; i++)
            {
                if (remaining <= _segmentLengths[i])
                {
                    float t = remaining / _segmentLengths[i];
                    return Vector3.Lerp(_pathPoints[i], _pathPoints[i + 1], t);
                }
                remaining -= _segmentLengths[i];
            }
            return _pathPoints[_pathPoints.Count - 1];
        }

        public Vector3 GetDirectionAtDistance(float distance)
        {
            if (_pathPoints.Count < 2) return Vector3.forward;
            distance = Mathf.Clamp(distance, 0, _totalLength - 0.01f);

            float remaining = distance;
            for (int i = 0; i < _segmentLengths.Length; i++)
            {
                if (remaining <= _segmentLengths[i])
                {
                    return (_pathPoints[i + 1] - _pathPoints[i]).normalized;
                }
                remaining -= _segmentLengths[i];
            }
            return (_pathPoints[_pathPoints.Count - 1] - _pathPoints[_pathPoints.Count - 2]).normalized;
        }

        public float GetNormalizedProgress(float distance)
        {
            return Mathf.Clamp01(distance / _totalLength);
        }

        public Vector3 GetStartPoint()
        {
            return _pathPoints.Count > 0 ? _pathPoints[0] : Vector3.zero;
        }

        public Vector3 GetEndPoint()
        {
            return _pathPoints.Count > 0 ? _pathPoints[_pathPoints.Count - 1] : Vector3.zero;
        }

        public List<Vector3> GetAllPoints()
        {
            return new List<Vector3>(_pathPoints);
        }

        public bool InsertPoint(int index, Vector3 point)
        {
            if (index < 0 || index > _pathPoints.Count) return false;
            _pathPoints.Insert(index, point);
            CalculateSegmentLengths();
            OnPathChanged?.Invoke();
            return true;
        }

        public bool RemovePoint(int index)
        {
            if (index <= 0 || index >= _pathPoints.Count - 1) return false;
            if (_pathPoints.Count <= 2) return false;
            _pathPoints.RemoveAt(index);
            CalculateSegmentLengths();
            OnPathChanged?.Invoke();
            return true;
        }

        public bool MovePoint(int index, Vector3 newPosition)
        {
            if (index < 0 || index >= _pathPoints.Count) return false;
            _pathPoints[index] = newPosition;
            CalculateSegmentLengths();
            OnPathChanged?.Invoke();
            return true;
        }

        public float GetDistanceToPath(Vector3 position)
        {
            float minDist = float.MaxValue;
            for (int i = 0; i < _segmentLengths.Length; i++)
            {
                float dist = DistanceToSegment(position, _pathPoints[i], _pathPoints[i + 1]);
                if (dist < minDist) minDist = dist;
            }
            return minDist;
        }

        private float DistanceToSegment(Vector3 point, Vector3 a, Vector3 b)
        {
            Vector3 ab = b - a;
            Vector3 ap = point - a;
            float t = Mathf.Clamp01(Vector3.Dot(ap, ab) / ab.sqrMagnitude);
            return Vector3.Distance(point, a + ab * t);
        }
    }
}
