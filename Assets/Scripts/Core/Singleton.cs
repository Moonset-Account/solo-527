using UnityEngine;

namespace SpaceCourier.Core
{
    public abstract class Singleton<T> : MonoBehaviour where T : MonoBehaviour
    {
        private static T instance;
        private static readonly object lockObject = new object();
        private static bool isShuttingDown = false;

        public static T Instance
        {
            get
            {
                if (isShuttingDown)
                {
                    return null;
                }

                lock (lockObject)
                {
                    if (instance == null)
                    {
                        instance = FindObjectOfType<T>();
                        if (instance == null)
                        {
                            var gameObject = new GameObject($"[Singleton_{typeof(T).Name}]");
                            instance = gameObject.AddComponent<T>();
                        }
                    }
                    return instance;
                }
            }
        }

        protected virtual void Awake()
        {
            if (instance == null)
            {
                instance = this as T;
                DontDestroyOnLoad(gameObject);
            }
            else if (instance != this)
            {
                Destroy(gameObject);
            }
        }

        protected virtual void OnApplicationQuit()
        {
            isShuttingDown = true;
        }

        protected virtual void OnDestroy()
        {
            if (instance == this)
            {
                isShuttingDown = true;
            }
        }
    }
}
