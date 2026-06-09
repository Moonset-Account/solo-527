using System;
using System.Collections.Generic;

namespace LakeSailing.Core
{
    public interface IEvent { }

    public static class EventBus
    {
        private static readonly Dictionary<Type, Delegate> eventHandlers = new Dictionary<Type, Delegate>();

        public static void Subscribe<T>(Action<T> handler) where T : struct, IEvent
        {
            var type = typeof(T);
            if (!eventHandlers.TryGetValue(type, out var existingHandler))
            {
                eventHandlers[type] = handler;
            }
            else
            {
                eventHandlers[type] = Delegate.Combine(existingHandler, handler);
            }
        }

        public static void Unsubscribe<T>(Action<T> handler) where T : struct, IEvent
        {
            var type = typeof(T);
            if (eventHandlers.TryGetValue(type, out var existingHandler))
            {
                var newHandler = Delegate.Remove(existingHandler, handler);
                if (newHandler == null)
                {
                    eventHandlers.Remove(type);
                }
                else
                {
                    eventHandlers[type] = newHandler;
                }
            }
        }

        public static void Trigger<T>(T eventData) where T : struct, IEvent
        {
            var type = typeof(T);
            if (eventHandlers.TryGetValue(type, out var handler))
            {
                if (handler is Action<T> typedHandler)
                {
                    typedHandler.Invoke(eventData);
                }
            }
        }

        public static void Clear()
        {
            eventHandlers.Clear();
        }

        public static void Clear<T>() where T : struct, IEvent
        {
            eventHandlers.Remove(typeof(T));
        }
    }
}
