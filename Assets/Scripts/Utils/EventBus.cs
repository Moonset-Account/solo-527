using System;
using System.Collections.Generic;

namespace DecorMatch3.Utils
{
    public static class EventBus
    {
        private static readonly Dictionary<Type, Delegate> _eventHandlers = new Dictionary<Type, Delegate>();

        public static void Subscribe<T>(Action<T> handler) where T : struct
        {
            Type eventType = typeof(T);
            if (_eventHandlers.TryGetValue(eventType, out Delegate existingHandler))
            {
                _eventHandlers[eventType] = Delegate.Combine(existingHandler, handler);
            }
            else
            {
                _eventHandlers[eventType] = handler;
            }
        }

        public static void Unsubscribe<T>(Action<T> handler) where T : struct
        {
            Type eventType = typeof(T);
            if (_eventHandlers.TryGetValue(eventType, out Delegate existingHandler))
            {
                Delegate newHandler = Delegate.Remove(existingHandler, handler);
                if (newHandler == null)
                {
                    _eventHandlers.Remove(eventType);
                }
                else
                {
                    _eventHandlers[eventType] = newHandler;
                }
            }
        }

        public static void Publish<T>(T eventData) where T : struct
        {
            Type eventType = typeof(T);
            if (_eventHandlers.TryGetValue(eventType, out Delegate handler))
            {
                (handler as Action<T>)?.Invoke(eventData);
            }
        }

        public static void ClearAll()
        {
            _eventHandlers.Clear();
        }
    }
}
