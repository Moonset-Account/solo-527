using System;
using System.Collections.Generic;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Config;
using KitchenChaos.Players;

namespace KitchenChaos.Levels
{
    public abstract class LevelMechanicHandler : MonoBehaviour
    {
        public LevelMechanicType MechanicType;
        public float Intensity = 1f;
        public bool Active { get; protected set; }

        public abstract void Initialize(LevelMechanic config);
        public abstract void Apply(PlayerController player);
        public virtual void Tick() { }
        public virtual void Disable() => Active = false;
    }

    public class TightCorridorMechanic : LevelMechanicHandler
    {
        [SerializeField] Collider2D[] _corridorZones;
        [SerializeField] float _speedMultiplier = 0.55f;
        [SerializeField] float _playerRadius = 0.38f;
        Dictionary<int, float> _originalSpeeds = new();

        public override void Initialize(LevelMechanic config)
        {
            MechanicType = LevelMechanicType.TightCorridor;
            Intensity = config.Intensity;
            Active = true;
            _speedMultiplier = Mathf.Clamp01(1f - (Intensity * 0.45f));
        }

        public override void Apply(PlayerController player)
        {
            if (!Active || player == null) return;
            foreach (var zone in _corridorZones)
            {
                if (zone == null) continue;
                if (zone.OverlapPoint(player.transform.position))
                {
                    if (!_originalSpeeds.ContainsKey(player.PlayerId))
                        _originalSpeeds[player.PlayerId] = 1f;
                    return;
                }
            }
        }

        public float GetSpeedMultiplierFor(Vector2 pos)
        {
            if (!Active) return 1f;
            foreach (var zone in _corridorZones)
                if (zone != null && zone.OverlapPoint(pos))
                    return _speedMultiplier;
            return 1f;
        }

        void FixedUpdate()
        {
            if (!Active) return;
            var pm = ServiceLocator.Get<PlayerManager>();
            foreach (var p in pm.AllPlayers)
            {
                if (p == null) continue;
                float mult = GetSpeedMultiplierFor(p.transform.position);
                var rb = p.GetComponent<Rigidbody2D>();
                if (rb != null && Math.Abs(mult - 1f) > 0.001f)
                    rb.velocity *= mult;
            }
        }
    }

    public class ConveyorBeltMechanic : LevelMechanicHandler
    {
        [Serializable]
        public class ConveyorZone
        {
            public Collider2D Zone;
            public Vector2 Direction = Vector2.right;
            public float Speed = 3f;
        }

        [SerializeField] List<ConveyorZone> _belts = new();

        public override void Initialize(LevelMechanic config)
        {
            MechanicType = LevelMechanicType.ConveyorBelt;
            Intensity = config.Intensity;
            Active = true;
        }

        public override void Apply(PlayerController player) { }

        void FixedUpdate()
        {
            if (!Active) return;
            var pm = ServiceLocator.Get<PlayerManager>();
            foreach (var p in pm.AllPlayers)
            {
                if (p == null) continue;
                var rb = p.GetComponent<Rigidbody2D>();
                if (rb == null) continue;
                foreach (var belt in _belts)
                {
                    if (belt.Zone == null) continue;
                    if (belt.Zone.OverlapPoint(p.transform.position))
                    {
                        rb.position += belt.Direction.normalized * belt.Speed * Intensity * Time.fixedDeltaTime;
                        break;
                    }
                }
            }
        }
    }

    public class MovingPlatformMechanic : LevelMechanicHandler
    {
        [Serializable]
        public class Platform
        {
            public Transform PlatformTransform;
            public Vector2 MoveOffset = new Vector2(3f, 0);
            public float CycleDuration = 4f;
            [HideInInspector] public Vector2 Origin;
            [HideInInspector] public float Time;
        }

        [SerializeField] List<Platform> _platforms = new();

        public override void Initialize(LevelMechanic config)
        {
            MechanicType = LevelMechanicType.MovingPlatform;
            Intensity = config.Intensity;
            Active = true;
            foreach (var p in _platforms)
                if (p.PlatformTransform != null) p.Origin = p.PlatformTransform.position;
        }

        public override void Apply(PlayerController player) { }

        void FixedUpdate()
        {
            if (!Active) return;
            foreach (var p in _platforms)
            {
                if (p.PlatformTransform == null) continue;
                p.Time += Time.fixedDeltaTime * Intensity;
                float t = (Mathf.Sin((p.Time / p.CycleDuration) * Mathf.PI * 2f) + 1f) * 0.5f;
                p.PlatformTransform.position = p.Origin + p.MoveOffset * t;
            }
        }
    }

    public class FireHazardMechanic : LevelMechanicHandler
    {
        [SerializeField] Collider2D[] _fireZones;
        [SerializeField] float _stunDuration = 1.2f;
        float _timer;
        bool _firesActive;

        public override void Initialize(LevelMechanic config)
        {
            MechanicType = LevelMechanicType.FireHazard;
            Intensity = config.Intensity;
            Active = true;
        }

        public override void Apply(PlayerController player) { }

        void Update()
        {
            if (!Active) return;
            _timer += Time.deltaTime;
            float cycle = 6f / Intensity;
            _firesActive = Mathf.Sin((_timer / cycle) * Mathf.PI * 2f) > 0.2f;

            if (!_firesActive) return;
            var pm = ServiceLocator.Get<PlayerManager>();
            foreach (var p in pm.AllPlayers)
            {
                if (p == null) continue;
                foreach (var zone in _fireZones)
                {
                    if (zone == null) continue;
                    if (zone.OverlapPoint(p.transform.position))
                    {
                        p.StartProcess(_stunDuration, () => { }, PlayerAnimationState.Idle);
                        break;
                    }
                }
            }
        }
    }

    public class LevelMechanicManager : MonoBehaviour
    {
        readonly List<LevelMechanicHandler> _handlers = new();

        void Awake() => ServiceLocator.Register(this);

        public void ApplyLevelMechanics(LevelConfig config)
        {
            ClearHandlers();
            if (config.Mechanics == null) return;
            foreach (var m in config.Mechanics)
            {
                if (!m.Enabled) continue;
                var handler = FindOrCreateHandler(m.Type);
                if (handler != null)
                {
                    handler.Initialize(m);
                    _handlers.Add(handler);
                }
            }
        }

        LevelMechanicHandler FindOrCreateHandler(LevelMechanicType type)
        {
            foreach (var h in FindObjectsOfType<LevelMechanicHandler>())
                if (h.MechanicType == type) return h;

            GameObject go;
            switch (type)
            {
                case LevelMechanicType.TightCorridor:
                    go = new GameObject("Mechanic_TightCorridor");
                    return go.AddComponent<TightCorridorMechanic>();
                case LevelMechanicType.ConveyorBelt:
                    go = new GameObject("Mechanic_ConveyorBelt");
                    return go.AddComponent<ConveyorBeltMechanic>();
                case LevelMechanicType.MovingPlatform:
                    go = new GameObject("Mechanic_MovingPlatform");
                    return go.AddComponent<MovingPlatformMechanic>();
                case LevelMechanicType.FireHazard:
                    go = new GameObject("Mechanic_FireHazard");
                    return go.AddComponent<FireHazardMechanic>();
                default: return null;
            }
        }

        void ClearHandlers()
        {
            foreach (var h in _handlers) h.Disable();
            _handlers.Clear();
        }
    }
}
