using System.Collections.Generic;
using UnityEngine;

namespace DecorMatch3.Utils
{
    public class ObjectPool<T> where T : Component
    {
        private readonly Queue<T> _pool = new Queue<T>();
        private readonly T _prefab;
        private readonly Transform _parentTransform;
        private readonly int _maxSize;

        public ObjectPool(T prefab, Transform parentTransform = null, int initialSize = 10, int maxSize = 100)
        {
            _prefab = prefab;
            _parentTransform = parentTransform;
            _maxSize = maxSize;

            for (int i = 0; i < initialSize; i++)
            {
                T obj = CreateNew();
                obj.gameObject.SetActive(false);
                _pool.Enqueue(obj);
            }
        }

        public T Get()
        {
            if (_pool.Count > 0)
            {
                T obj = _pool.Dequeue();
                obj.gameObject.SetActive(true);
                return obj;
            }

            return CreateNew();
        }

        public void Return(T obj)
        {
            if (obj == null) return;

            if (_pool.Count < _maxSize)
            {
                obj.gameObject.SetActive(false);
                if (_parentTransform != null)
                {
                    obj.transform.SetParent(_parentTransform);
                }
                _pool.Enqueue(obj);
            }
            else
            {
                Object.Destroy(obj.gameObject);
            }
        }

        private T CreateNew()
        {
            T newObj = Object.Instantiate(_prefab, _parentTransform);
            return newObj;
        }

        public void Clear()
        {
            while (_pool.Count > 0)
            {
                T obj = _pool.Dequeue();
                if (obj != null)
                {
                    Object.Destroy(obj.gameObject);
                }
            }
        }
    }
}
