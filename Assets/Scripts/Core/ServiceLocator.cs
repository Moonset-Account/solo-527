using System;
using System.Collections.Generic;

namespace KitchenChaos.Core
{
    public static class ServiceLocator
    {
        static readonly Dictionary<Type, object> _services = new();
        static readonly Dictionary<Type, Func<object>> _factories = new();

        public static void Register<T>(T service) where T : class
        {
            _services[typeof(T)] = service;
        }

        public static void RegisterFactory<T>(Func<T> factory) where T : class
        {
            _factories[typeof(T)] = () => factory();
        }

        public static T Get<T>() where T : class
        {
            var type = typeof(T);
            if (_services.TryGetValue(type, out var svc))
                return (T)svc;
            if (_factories.TryGetValue(type, out var factory))
            {
                var created = (T)factory();
                _services[type] = created;
                return created;
            }
            throw new InvalidOperationException($"Service of type {type.Name} not registered.");
        }

        public static bool TryGet<T>(out T service) where T : class
        {
            service = null;
            var type = typeof(T);
            if (_services.TryGetValue(type, out var svc))
            {
                service = (T)svc;
                return true;
            }
            if (_factories.TryGetValue(type, out var factory))
            {
                service = (T)factory();
                _services[type] = service;
                return true;
            }
            return false;
        }

        public static void Clear()
        {
            _services.Clear();
            _factories.Clear();
        }
    }
}
