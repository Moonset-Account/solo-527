using System;
using System.Collections.Generic;

public static class EventBus
{
    private static readonly Dictionary<string, Delegate> _events = new Dictionary<string, Delegate>();
    private static readonly object _lock = new object();

    public static void Subscribe<T>(Action<T> handler)
    {
        lock (_lock)
        {
            string key = typeof(T).Name;
            if (_events.ContainsKey(key))
                _events[key] = Delegate.Combine(_events[key], handler);
            else
                _events[key] = handler;
        }
    }

    public static void Unsubscribe<T>(Action<T> handler)
    {
        lock (_lock)
        {
            string key = typeof(T).Name;
            if (_events.ContainsKey(key))
            {
                _events[key] = Delegate.Remove(_events[key], handler);
                if (_events[key] == null)
                    _events.Remove(key);
            }
        }
    }

    public static void Publish<T>(T eventData)
    {
        Delegate d;
        lock (_lock)
        {
            string key = typeof(T).Name;
            if (!_events.TryGetValue(key, out d))
                return;
        }

        (d as Action<T>)?.Invoke(eventData);
    }

    public static void Subscribe(string eventName, Action handler)
    {
        lock (_lock)
        {
            if (_events.ContainsKey(eventName))
                _events[eventName] = Delegate.Combine(_events[eventName], handler);
            else
                _events[eventName] = handler;
        }
    }

    public static void Unsubscribe(string eventName, Action handler)
    {
        lock (_lock)
        {
            if (_events.ContainsKey(eventName))
            {
                _events[eventName] = Delegate.Remove(_events[eventName], handler);
                if (_events[eventName] == null)
                    _events.Remove(eventName);
            }
        }
    }

    public static void Publish(string eventName)
    {
        Delegate d;
        lock (_lock)
        {
            if (!_events.TryGetValue(eventName, out d))
                return;
        }

        (d as Action)?.Invoke();
    }

    public static void Clear()
    {
        lock (_lock)
        {
            _events.Clear();
        }
    }
}
