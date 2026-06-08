using UnityEngine;
using System;
using System.Collections.Generic;

namespace LakeNavigation
{
    public class RoutePlanner : MonoBehaviour
    {
        public List<Vector2> PlannedRoute => new List<Vector2>(_plannedRoute);

        public event Action<Vector2> OnWaypointAdded;
        public event Action<int> OnWaypointRemoved;
        public event Action<List<Vector2>> OnRouteConfirmed;
        public event Action OnRouteCleared;

        private List<Vector2> _plannedRoute = new List<Vector2>();
        private GameConfig _gameConfig;
        private const int MaxWaypoints = 30;
        private const float MaxAdjacentDistance = 1.5f;

        private void Start()
        {
            ServiceLocator.Instance.TryGet(out _gameConfig);
        }

        public void AddWaypoint(Vector2 gridPos)
        {
            if (_plannedRoute.Count >= MaxWaypoints)
                return;

            if (!IsPositionValid(gridPos))
                return;

            if (_plannedRoute.Count > 0)
            {
                Vector2 lastWaypoint = _plannedRoute[_plannedRoute.Count - 1];
                if (Vector2.Distance(gridPos, lastWaypoint) < 0.001f)
                    return;

                if (Vector2.Distance(gridPos, lastWaypoint) > MaxAdjacentDistance)
                    return;
            }

            _plannedRoute.Add(gridPos);
            OnWaypointAdded?.Invoke(gridPos);
        }

        public void RemoveLastWaypoint()
        {
            if (_plannedRoute.Count == 0)
                return;

            int removedIndex = _plannedRoute.Count - 1;
            _plannedRoute.RemoveAt(removedIndex);
            OnWaypointRemoved?.Invoke(removedIndex);
        }

        public void ClearRoute()
        {
            _plannedRoute.Clear();
            OnRouteCleared?.Invoke();
        }

        public void ConfirmRoute()
        {
            if (_plannedRoute.Count == 0)
                return;

            OnRouteConfirmed?.Invoke(new List<Vector2>(_plannedRoute));
        }

        public bool IsPositionValid(Vector2 pos)
        {
            float gridWidth = _gameConfig != null ? _gameConfig.GridWidth : 20f;
            float gridHeight = _gameConfig != null ? _gameConfig.GridHeight : 15f;

            if (pos.x < 0f || pos.x > gridWidth)
                return false;

            if (pos.y < 0f || pos.y > gridHeight)
                return false;

            return true;
        }
    }
}
