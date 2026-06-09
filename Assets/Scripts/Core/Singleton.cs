using UnityEngine;

namespace KitchenChaos.Core
{
    public abstract class Singleton<T> : MonoBehaviour where T : MonoBehaviour
    {
        static T _instance;
        static readonly object _lock = new();
        static bool _applicationQuitting;

        public static T Instance
        {
            get
            {
                if (_applicationQuitting) return null;
                lock (_lock)
                {
                    if (_instance == null)
                    {
                        _instance = FindObjectOfType<T>();
                        if (_instance == null)
                        {
                            var go = new GameObject(typeof(T).Name);
                            _instance = go.AddComponent<T>();
                        }
                    }
                    return _instance;
                }
            }
        }

        [SerializeField] protected bool _dontDestroyOnLoad = true;

        protected virtual void Awake()
        {
            lock (_lock)
            {
                if (_instance == null)
                {
                    _instance = this as T;
                    if (_dontDestroyOnLoad)
                        DontDestroyOnLoad(gameObject);
                    OnAwake();
                }
                else if (_instance != this)
                {
                    Destroy(gameObject);
                }
            }
        }

        protected virtual void OnAwake() { }

        void OnApplicationQuit() => _applicationQuitting = true;
        void OnDestroy()
        {
            if (_instance == this)
                _instance = null;
        }
    }
}
