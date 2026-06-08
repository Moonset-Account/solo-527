using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class AudioTrigger : MonoBehaviour
{
    public static AudioTrigger Instance { get; private set; }

    private const int PoolSize = 8;

    private List<AudioSource> _sources = new List<AudioSource>();
    private Dictionary<string, AudioClip> _clipCache = new Dictionary<string, AudioClip>();
    private Dictionary<string, AudioSource> _playingClips = new Dictionary<string, AudioSource>();

    private float _musicVolume = 1f;
    private float _sfxVolume = 1f;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);

        for (int i = 0; i < PoolSize; i++)
        {
            var go = new GameObject("AudioSource_" + i);
            go.transform.SetParent(transform);
            var src = go.AddComponent<AudioSource>();
            src.playOnAwake = false;
            _sources.Add(src);
        }

        GameEvents.AudioTriggerRequested += HandleAudioTriggerRequested;
    }

    private void HandleAudioTriggerRequested(string clipId, float volume)
    {
        Play(clipId, volume);
    }

    public void Play(string clipId, float volume = 1f, bool loop = false)
    {
        var clip = GetClip(clipId);
        if (clip == null) return;

        var source = GetAvailableSource();
        if (source == null) return;

        source.clip = clip;
        source.volume = volume * _sfxVolume;
        source.loop = loop;
        source.Play();

        _playingClips[clipId] = source;
    }

    public void PlayOneShot(string clipId, float volume = 1f)
    {
        var clip = GetClip(clipId);
        if (clip == null) return;

        var source = GetAvailableSource();
        if (source == null) return;

        source.PlayOneShot(clip, volume * _sfxVolume);
    }

    public void Stop(string clipId)
    {
        if (_playingClips.TryGetValue(clipId, out var source))
        {
            source.Stop();
            source.clip = null;
            source.loop = false;
            _playingClips.Remove(clipId);
        }
    }

    public void StopAll()
    {
        foreach (var source in _sources)
        {
            source.Stop();
            source.clip = null;
            source.loop = false;
        }
        _playingClips.Clear();
    }

    public void SetMusicVolume(float vol)
    {
        _musicVolume = Mathf.Clamp01(vol);
    }

    public void SetSFXVolume(float vol)
    {
        _sfxVolume = Mathf.Clamp01(vol);
        foreach (var kvp in _playingClips)
        {
            kvp.Value.volume = _sfxVolume;
        }
    }

    public void Crossfade(string fromClipId, string toClipId, float duration)
    {
        StartCoroutine(CrossfadeRoutine(fromClipId, toClipId, duration));
    }

    private IEnumerator CrossfadeRoutine(string fromClipId, string toClipId, float duration)
    {
        AudioSource fromSource = null;
        if (_playingClips.TryGetValue(fromClipId, out fromSource))
        {
            _playingClips.Remove(fromClipId);
        }

        var toClip = GetClip(toClipId);
        if (toClip == null) yield break;

        var toSource = GetAvailableSource();
        if (toSource == null) yield break;

        toSource.clip = toClip;
        toSource.volume = 0f;
        toSource.loop = true;
        toSource.Play();
        _playingClips[toClipId] = toSource;

        float elapsed = 0f;
        float fromStartVol = fromSource != null ? fromSource.volume : 0f;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / duration;

            if (fromSource != null)
            {
                fromSource.volume = Mathf.Lerp(fromStartVol, 0f, t);
            }

            toSource.volume = Mathf.Lerp(0f, _musicVolume, t);
            yield return null;
        }

        if (fromSource != null)
        {
            fromSource.Stop();
            fromSource.clip = null;
            fromSource.loop = false;
        }

        toSource.volume = _musicVolume;
    }

    private AudioSource GetAvailableSource()
    {
        foreach (var source in _sources)
        {
            if (!source.isPlaying) return source;
        }
        return _sources[0];
    }

    private AudioClip GetClip(string clipId)
    {
        if (_clipCache.TryGetValue(clipId, out var cached)) return cached;

        var clip = ResLoader.Instance.LoadAudioClip(clipId);
        if (clip != null)
        {
            _clipCache[clipId] = clip;
        }
        return clip;
    }

    private void OnDestroy()
    {
        GameEvents.AudioTriggerRequested -= HandleAudioTriggerRequested;
    }
}
