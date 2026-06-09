using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using DecorMatch3.Utils;

namespace DecorMatch3.VFX
{
    public enum VfxType
    {
        MatchBurst,
        ComboBurst,
        TileSpawn,
        MaterialCollect,
        StarEarn,
        CoinGain,
        AchievementUnlock,
        Confetti,
        Ripple,
        GlowPulse,
        Explosion,
        Smoke,
        Sparkles
    }

    [System.Serializable]
    public class VfxMapping
    {
        public VfxType Type;
        public GameObject Prefab;
        public float Duration = 1f;
        public bool AutoDestroy = true;
        public int PoolSize = 10;
    }

    public class VFXManager : MonoBehaviour
    {
        private static VFXManager _instance;
        public static VFXManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    GameObject go = new GameObject("VFXManager");
                    _instance = go.AddComponent<VFXManager>();
                }
                return _instance;
            }
        }

        [SerializeField] private List<VfxMapping> _vfxMappings = new List<VfxMapping>();
        [SerializeField] private Transform _vfxContainer;

        private readonly Dictionary<VfxType, ObjectPool<ParticleEffect>> _effectPools =
            new Dictionary<VfxType, ObjectPool<ParticleEffect>>();
        private readonly Dictionary<VfxType, VfxMapping> _mappingLookup = new Dictionary<VfxType, VfxMapping>();

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }
            _instance = this;

            if (_vfxContainer == null)
            {
                GameObject containerGO = new GameObject("VFXContainer");
                containerGO.transform.SetParent(transform);
                _vfxContainer = containerGO.transform;
            }

            InitializePools();
        }

        private void InitializePools()
        {
            foreach (VfxMapping mapping in _vfxMappings)
            {
                RegisterMapping(mapping);
            }
        }

        public void RegisterMapping(VfxMapping mapping)
        {
            if (mapping.Prefab == null) return;

            _mappingLookup[mapping.Type] = mapping;

            ParticleEffect effect = mapping.Prefab.GetComponent<ParticleEffect>();
            if (effect == null) effect = mapping.Prefab.AddComponent<ParticleEffect>();

            ObjectPool<ParticleEffect> pool = new ObjectPool<ParticleEffect>(
                effect, _vfxContainer, mapping.PoolSize, mapping.PoolSize * 2);
            _effectPools[mapping.Type] = pool;
        }

        public ParticleEffect Play(VfxType type, Vector3 position, Transform parent = null, Quaternion? rotation = null)
        {
            if (!_effectPools.TryGetValue(type, out ObjectPool<ParticleEffect> pool) ||
                !_mappingLookup.TryGetValue(type, out VfxMapping mapping))
            {
                Debug.LogWarning($"[VFXManager] Effect not registered: {type}");
                return null;
            }

            ParticleEffect effect = pool.Get();
            if (effect == null) return null;

            Transform t = effect.transform;
            if (parent != null)
                t.SetParent(parent, false);
            else
                t.SetParent(_vfxContainer, false);

            t.localPosition = position;
            t.localRotation = rotation ?? Quaternion.identity;
            t.localScale = Vector3.one;

            effect.Play(mapping.Duration, mapping.AutoDestroy, () =>
            {
                if (mapping.AutoDestroy)
                {
                    pool.Return(effect);
                    effect.transform.SetParent(_vfxContainer);
                }
            });

            return effect;
        }

        public ParticleEffect PlayAtWorld(VfxType type, Vector3 worldPosition, Quaternion? rotation = null)
        {
            if (!_effectPools.TryGetValue(type, out ObjectPool<ParticleEffect> pool) ||
                !_mappingLookup.TryGetValue(type, out VfxMapping mapping))
            {
                return null;
            }

            ParticleEffect effect = pool.Get();
            if (effect == null) return null;

            effect.transform.position = worldPosition;
            effect.transform.rotation = rotation ?? Quaternion.identity;
            effect.transform.localScale = Vector3.one;

            effect.Play(mapping.Duration, mapping.AutoDestroy, () =>
            {
                if (mapping.AutoDestroy)
                {
                    pool.Return(effect);
                    effect.transform.SetParent(_vfxContainer);
                }
            });

            return effect;
        }

        public void PlayMatchBurst(Vector3 position, Color color, int comboLevel = 1)
        {
            ParticleEffect effect = Play(VfxType.MatchBurst, position);
            if (effect != null)
            {
                effect.SetColor(color);
                effect.SetScale(1f + comboLevel * 0.2f);
            }

            if (comboLevel >= 2)
            {
                StartCoroutine(DelayedPlay(VfxType.ComboBurst, position, 0.1f));
            }
        }

        public void PlayMaterialCollect(Vector3 start, Vector3 end, int count = 1)
        {
            StartCoroutine(MaterialCollectRoutine(start, end, count));
        }

        private IEnumerator MaterialCollectRoutine(Vector3 start, Vector3 end, int count)
        {
            for (int i = 0; i < count; i++)
            {
                Play(VfxType.MaterialCollect, start);
                yield return new WaitForSeconds(0.1f);
            }

            yield return new WaitForSeconds(0.3f);
            Play(VfxType.StarEarn, end);
        }

        public void PlayConfettiBurst(Vector3 position, float intensity = 1f)
        {
            for (int i = 0; i < 3; i++)
            {
                Vector3 offset = new Vector3(Random.Range(-50f, 50f), Random.Range(-20f, 20f), 0);
                ParticleEffect effect = Play(VfxType.Confetti, position + offset);
                if (effect != null) effect.SetScale(intensity);
            }
        }

        public void PlayAchievementUnlock(Vector3 center)
        {
            Play(VfxType.AchievementUnlock, center);
            Play(VfxType.Sparkles, center);
            StartCoroutine(DelayedPlay(VfxType.Confetti, center, 0.3f));
        }

        public IEnumerator DelayedPlay(VfxType type, Vector3 position, float delay)
        {
            yield return new WaitForSeconds(delay);
            Play(type, position);
        }

        public void StopAll()
        {
            foreach (var kvp in _effectPools)
            {
                kvp.Value.Clear();
            }
        }
    }

    public class ParticleEffect : MonoBehaviour
    {
        private ParticleSystem[] _particles;
        private Coroutine _lifetimeRoutine;

        public System.Action OnComplete;

        private void Awake()
        {
            _particles = GetComponentsInChildren<ParticleSystem>(true);
        }

        public void Play(float duration, bool autoDestroy, System.Action onComplete)
        {
            OnComplete = onComplete;
            gameObject.SetActive(true);

            foreach (ParticleSystem ps in _particles)
            {
                if (ps != null)
                {
                    var main = ps.main;
                    main.stopAction = ParticleSystemStopAction.None;
                    ps.Play(true);
                }
            }

            if (_lifetimeRoutine != null) StopCoroutine(_lifetimeRoutine);
            _lifetimeRoutine = StartCoroutine(LifetimeRoutine(duration, autoDestroy));
        }

        private IEnumerator LifetimeRoutine(float duration, bool autoDestroy)
        {
            yield return new WaitForSeconds(duration);
            Stop();
        }

        public void Stop()
        {
            foreach (ParticleSystem ps in _particles)
            {
                if (ps != null) ps.Stop(true);
            }

            if (_lifetimeRoutine != null)
            {
                StopCoroutine(_lifetimeRoutine);
                _lifetimeRoutine = null;
            }

            OnComplete?.Invoke();
        }

        public void SetColor(Color color)
        {
            foreach (ParticleSystem ps in _particles)
            {
                if (ps != null)
                {
                    var main = ps.main;
                    main.startColor = new ParticleSystem.MinMaxGradient(color);
                }
            }
        }

        public void SetScale(float scale)
        {
            transform.localScale = Vector3.one * scale;
        }
    }
}
