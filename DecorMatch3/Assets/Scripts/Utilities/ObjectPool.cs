using System;
using System.Collections.Generic;
using UnityEngine;

namespace DecorMatch3
{
    public class ObjectPool<T> where T : Component
    {
        private readonly Func<T> _createFunc;
        private readonly Action<T> _onGet;
        private readonly Action<T> _onReturn;
        private readonly Stack<T> _pool;

        public int CountInactive => _pool.Count;

        public ObjectPool(Func<T> createFunc, Action<T> onGet = null, Action<T> onReturn = null, int initialSize = 0)
        {
            _createFunc = createFunc;
            _onGet = onGet;
            _onReturn = onReturn;
            _pool = new Stack<T>(initialSize);

            for (int i = 0; i < initialSize; i++)
            {
                T obj = _createFunc();
                obj.gameObject.SetActive(false);
                _onReturn?.Invoke(obj);
                _pool.Push(obj);
            }
        }

        public T Get()
        {
            T obj;
            if (_pool.Count > 0)
            {
                obj = _pool.Pop();
            }
            else
            {
                obj = _createFunc();
            }
            obj.gameObject.SetActive(true);
            _onGet?.Invoke(obj);
            return obj;
        }

        public void Return(T obj)
        {
            obj.gameObject.SetActive(false);
            _onReturn?.Invoke(obj);
            _pool.Push(obj);
        }

        public void Clear()
        {
            while (_pool.Count > 0)
            {
                T obj = _pool.Pop();
                if (obj != null && obj.gameObject != null)
                {
                    UnityEngine.Object.Destroy(obj.gameObject);
                }
            }
            _pool.Clear();
        }
    }
}
