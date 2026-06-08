using System;
using System.Collections.Generic;

namespace LakeNavigation
{
    public class ServiceLocator
    {
        private static ServiceLocator _instance;
        public static ServiceLocator Instance => _instance ??= new ServiceLocator();

        private readonly Dictionary<Type, object> _services = new Dictionary<Type, object>();

        public static void Initialize()
        {
            _instance = new ServiceLocator();
        }

        public void Register<T>(T service) where T : class
        {
            var type = typeof(T);
            if (_services.ContainsKey(type))
            {
                _services[type] = service;
            }
            else
            {
                _services.Add(type, service);
            }
        }

        public T Get<T>() where T : class
        {
            var type = typeof(T);
            if (_services.TryGetValue(type, out var service))
            {
                return (T)service;
            }
            DebugLog($"Service of type {type.Name} not found.");
            return null;
        }

        public bool TryGet<T>(out T service) where T : class
        {
            var type = typeof(T);
            if (_services.TryGetValue(type, out var obj))
            {
                service = (T)obj;
                return true;
            }
            service = null;
            return false;
        }

        public void Reset()
        {
            _services.Clear();
        }

        private void DebugLog(string message)
        {
            UnityEngine.Debug.LogWarning($"[ServiceLocator] {message}");
        }
    }
}
