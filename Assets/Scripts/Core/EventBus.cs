using System;
using System.Collections.Generic;

namespace DecorMatch3.Core
{
    public static class EventBus
    {
        private static Dictionary<Type, Delegate> eventHandlers = new Dictionary<Type, Delegate>();

        public static void Subscribe<T>(Action<T> handler) where T : struct
        {
            Type eventType = typeof(T);
            if (!eventHandlers.ContainsKey(eventType))
            {
                eventHandlers[eventType] = null;
            }
            eventHandlers[eventType] = Delegate.Combine(eventHandlers[eventType], handler);
        }

        public static void Unsubscribe<T>(Action<T> handler) where T : struct
        {
            Type eventType = typeof(T);
            if (eventHandlers.ContainsKey(eventType))
            {
                eventHandlers[eventType] = Delegate.Remove(eventHandlers[eventType], handler);
            }
        }

        public static void Publish<T>(T eventData) where T : struct
        {
            Type eventType = typeof(T);
            if (eventHandlers.TryGetValue(eventType, out Delegate handlers))
            {
                (handlers as Action<T>)?.Invoke(eventData);
            }
        }

        public static void ClearAll()
        {
            eventHandlers.Clear();
        }
    }
}
