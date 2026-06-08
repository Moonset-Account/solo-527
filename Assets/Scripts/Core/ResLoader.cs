using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ResLoader
{
    public static ResLoader Instance { get; } = new ResLoader();

    private Dictionary<string, UnityEngine.Object> _cache = new Dictionary<string, UnityEngine.Object>();

    public T Load<T>(string path) where T : UnityEngine.Object
    {
        if (_cache.TryGetValue(path, out var cached))
        {
            if (cached is T typed) return typed;
            if (cached != null) return null;
        }

        var asset = Resources.Load<T>(path);
        if (asset != null)
        {
            _cache[path] = asset;
        }
        return asset;
    }

    public void LoadAsync<T>(string path, Action<T> callback) where T : UnityEngine.Object
    {
        if (_cache.TryGetValue(path, out var cached))
        {
            if (cached is T typed)
            {
                callback?.Invoke(typed);
                return;
            }
        }

        CoroutineRunner.Instance.StartCoroutine(LoadAsyncRoutine(path, callback));
    }

    private IEnumerator LoadAsyncRoutine<T>(string path, Action<T> callback) where T : UnityEngine.Object
    {
        var request = Resources.LoadAsync<T>(path);
        yield return request;

        if (request.asset is T asset)
        {
            _cache[path] = asset;
            callback?.Invoke(asset);
        }
        else
        {
            callback?.Invoke(null);
        }
    }

    public T Instantiate<T>(string path, Transform parent) where T : UnityEngine.Object
    {
        var asset = Load<T>(path);
        if (asset == null) return null;

        if (asset is GameObject go)
        {
            var instance = UnityEngine.Object.Instantiate(go, parent);
            return instance as T;
        }

        return null;
    }

    public LevelConfig LoadLevelConfig(string levelId)
    {
        return Load<LevelConfig>("Levels/" + levelId);
    }

    public AudioClip LoadAudioClip(string clipId)
    {
        return Load<AudioClip>("Audio/" + clipId);
    }

    public T[] LoadAll<T>(string path) where T : UnityEngine.Object
    {
        return Resources.LoadAll<T>(path);
    }

    public void Unload(string path)
    {
        if (_cache.TryGetValue(path, out var asset))
        {
            Resources.UnloadAsset(asset);
            _cache.Remove(path);
        }
    }

    public void UnloadAll()
    {
        foreach (var kvp in _cache)
        {
            if (kvp.Value != null)
            {
                Resources.UnloadAsset(kvp.Value);
            }
        }
        _cache.Clear();
        Resources.UnloadUnusedAssets();
    }
}

public class CoroutineRunner : MonoBehaviour
{
    public static CoroutineRunner Instance { get; private set; }

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }
}
