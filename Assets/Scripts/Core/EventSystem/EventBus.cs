using System;
using System.Collections.Generic;

namespace KitchenChaos.Core
{
    public interface IEvent { }

    public static class EventBus<T> where T : IEvent
    {
        static readonly Dictionary<Delegate, Action<T>> _wrappers = new();
        public static event Action<T> OnEvent;

        public static void Subscribe(Action<T> handler) => OnEvent += handler;
        public static void Unsubscribe(Action<T> handler) => OnEvent -= handler;
        public static void Raise(T e) => OnEvent?.Invoke(e);

        public static void Subscribe(object target, Delegate handler)
        {
            Action<T> wrapper = (Action<T>)Delegate.CreateDelegate(typeof(Action<T>), target, handler.Method);
            _wrappers[handler] = wrapper;
            OnEvent += wrapper;
        }

        public static void Unsubscribe(Delegate handler)
        {
            if (_wrappers.TryGetValue(handler, out var wrapper))
            {
                OnEvent -= wrapper;
                _wrappers.Remove(handler);
            }
        }
    }

    public static class EventBus
    {
        public static void Raise<T>(T e) where T : IEvent => EventBus<T>.Raise(e);
        public static void Subscribe<T>(Action<T> handler) where T : IEvent => EventBus<T>.Subscribe(handler);
        public static void Unsubscribe<T>(Action<T> handler) where T : IEvent => EventBus<T>.Unsubscribe(handler);
    }
}
