using System;
using System.Collections.Generic;

namespace SpaceCourier.Core
{
    public static class EventBus
    {
        private static readonly Dictionary<Type, Delegate> eventHandlers = new Dictionary<Type, Delegate>();

        public static void Subscribe<T>(Action<T> handler) where T : struct
        {
            var type = typeof(T);
            if (!eventHandlers.ContainsKey(type))
            {
                eventHandlers[type] = handler;
            }
            else
            {
                eventHandlers[type] = Delegate.Combine(eventHandlers[type], handler);
            }
        }

        public static void Unsubscribe<T>(Action<T> handler) where T : struct
        {
            var type = typeof(T);
            if (eventHandlers.TryGetValue(type, out var existing))
            {
                var newDelegate = Delegate.Remove(existing, handler);
                if (newDelegate == null)
                {
                    eventHandlers.Remove(type);
                }
                else
                {
                    eventHandlers[type] = newDelegate;
                }
            }
        }

        public static void Publish<T>(T eventData) where T : struct
        {
            var type = typeof(T);
            if (eventHandlers.TryGetValue(type, out var handler))
            {
                ((Action<T>)handler)?.Invoke(eventData);
            }
        }
    }
}
