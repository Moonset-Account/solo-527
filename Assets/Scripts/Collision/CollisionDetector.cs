using UnityEngine;
using System;
using System.Collections.Generic;

namespace LakeNavigation
{
    public class CollisionDetector : MonoBehaviour
    {
        public float proximityRadius = 0.5f;
        public float obstacleRadius = 0.8f;
        public float supplyRadius = 0.6f;

        public event Action<PhotoTarget, float> OnPhotoTargetProximity;
        public event Action<Vector2> OnObstacleCollision;
        public event Action<Vector2> OnSupplyPickup;
        public event Action<Vector2> OnDockReached;

        private List<PhotoTarget> _photoTargets = new List<PhotoTarget>();
        private List<Vector2> _obstacles = new List<Vector2>();
        private List<Vector2> _supplyPickups = new List<Vector2>();
        private List<Vector2> _docks = new List<Vector2>();
        private Dictionary<Vector2, float> _obstacleCooldowns = new Dictionary<Vector2, float>();
        private MissionManager _missionManager;
        private const float ObstacleCooldownDuration = 2f;
        private const float DockRadius = 1.0f;

        public void Initialize(Vector2 boatPos, List<Vector2> obstacles, List<Vector2> supplyPickups, List<Vector2> docks, List<PhotoTarget> photoTargets)
        {
            _obstacles = new List<Vector2>(obstacles);
            _supplyPickups = new List<Vector2>(supplyPickups);
            _docks = new List<Vector2>(docks);
            _photoTargets = new List<PhotoTarget>(photoTargets);
            _obstacleCooldowns.Clear();
            _missionManager = FindObjectOfType<MissionManager>();
        }

        public void CheckCollisions(Vector2 currentBoatPos)
        {
            UpdateObstacleCooldowns();

            for (int i = 0; i < _photoTargets.Count; i++)
            {
                if (_photoTargets[i].IsCompleted) continue;
                if (_missionManager != null && i < _missionManager.photoTargets.Count && _missionManager.photoTargets[i].IsCompleted)
                {
                    var t = _photoTargets[i];
                    t.IsCompleted = true;
                    _photoTargets[i] = t;
                    continue;
                }
                float distance = Vector2.Distance(currentBoatPos, _photoTargets[i].GridPosition);
                if (distance < _photoTargets[i].RequiredProximity)
                {
                    OnPhotoTargetProximity?.Invoke(_photoTargets[i], distance);
                }
            }

            for (int i = 0; i < _obstacles.Count; i++)
            {
                Vector2 obstacle = _obstacles[i];
                float distance = Vector2.Distance(currentBoatPos, obstacle);
                if (distance < obstacleRadius && !_obstacleCooldowns.ContainsKey(obstacle))
                {
                    _obstacleCooldowns[obstacle] = ObstacleCooldownDuration;
                    OnObstacleCollision?.Invoke(obstacle);

                    BoatController boatController = FindObjectOfType<BoatController>();
                    if (boatController != null)
                    {
                        boatController.TakeDamage(10f, "Obstacle collision");
                    }
                }
            }

            for (int i = _supplyPickups.Count - 1; i >= 0; i--)
            {
                Vector2 supply = _supplyPickups[i];
                float distance = Vector2.Distance(currentBoatPos, supply);
                if (distance < supplyRadius)
                {
                    OnSupplyPickup?.Invoke(supply);
                    _supplyPickups.RemoveAt(i);

                    SupplyManager supplyManager = FindObjectOfType<SupplyManager>();
                    if (supplyManager != null)
                    {
                        SupplyType type = (SupplyType)UnityEngine.Random.Range(0, 3);
                        float amount = UnityEngine.Random.Range(20f, 40f);
                        supplyManager.Replenish(type, amount);
                    }
                }
            }

            for (int i = 0; i < _docks.Count; i++)
            {
                Vector2 dock = _docks[i];
                float distance = Vector2.Distance(currentBoatPos, dock);
                if (distance < DockRadius)
                {
                    OnDockReached?.Invoke(dock);
                }
            }
        }

        private void UpdateObstacleCooldowns()
        {
            List<Vector2> expired = new List<Vector2>();
            foreach (var kvp in _obstacleCooldowns)
            {
                float remaining = kvp.Value - Time.deltaTime;
                if (remaining <= 0f)
                {
                    expired.Add(kvp.Key);
                }
                else
                {
                    _obstacleCooldowns[kvp.Key] = remaining;
                }
            }

            for (int i = 0; i < expired.Count; i++)
            {
                _obstacleCooldowns.Remove(expired[i]);
            }
        }
    }
}
