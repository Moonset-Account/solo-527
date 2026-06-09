using System;
using System.Collections.Generic;

namespace BeatRunner.Core
{
    public static class ServiceLocator
    {
        private static readonly Dictionary<Type, object> _services = new Dictionary<Type, object>();
        private static bool _isInitialized;

        public static void Initialize()
        {
            _services.Clear();
            _isInitialized = true;
        }

        public static void Register<T>(T service) where T : class
        {
            if (!_isInitialized) Initialize();

            var type = typeof(T);
            if (_services.ContainsKey(type))
            {
                UnityEngine.Debug.LogWarning($"Service {type.Name} is already registered. Overwriting.");
                _services[type] = service;
            }
            else
            {
                _services.Add(type, service);
            }
        }

        public static T Get<T>() where T : class
        {
            if (!_isInitialized)
            {
                UnityEngine.Debug.LogError("ServiceLocator is not initialized.");
                return null;
            }

            var type = typeof(T);
            if (_services.TryGetValue(type, out var service))
            {
                return service as T;
            }

            UnityEngine.Debug.LogError($"Service {type.Name} is not registered.");
            return null;
        }

        public static bool TryGet<T>(out T service) where T : class
        {
            service = null;
            if (!_isInitialized) return false;

            var type = typeof(T);
            if (_services.TryGetValue(type, out var obj))
            {
                service = obj as T;
                return service != null;
            }
            return false;
        }

        public static void Unregister<T>() where T : class
        {
            var type = typeof(T);
            if (_services.ContainsKey(type))
            {
                _services.Remove(type);
            }
        }
    }
}
