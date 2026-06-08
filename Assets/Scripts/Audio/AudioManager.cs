using System.Collections.Generic;
using UnityEngine;

public class AudioManager : Singleton<AudioManager>
{
    public AudioSource musicSource;
    public List<AudioSource> sfxSources = new List<AudioSource>();
    public float musicVolume = 1f;
    public float sfxVolume = 1f;
    public float masterVolume = 1f;

    private const int SfxPoolSize = 4;
    private int nextSfxIndex;
    private AudioClip pendingMusicClip;
    private bool isCrossfading;
    private float crossfadeDuration = 1f;
    private float crossfadeTimer;

    protected override void Awake()
    {
        base.Awake();

        GameObject musicObj = new GameObject("MusicSource");
        musicObj.transform.SetParent(transform);
        musicSource = musicObj.AddComponent<AudioSource>();
        musicSource.loop = true;
        musicSource.playOnAwake = false;

        for (int i = 0; i < SfxPoolSize; i++)
        {
            GameObject sfxObj = new GameObject($"SFXSource_{i}");
            sfxObj.transform.SetParent(transform);
            AudioSource source = sfxObj.AddComponent<AudioSource>();
            source.playOnAwake = false;
            sfxSources.Add(source);
        }
    }

    public void PlayMusic(AudioClip clip, bool loop = true)
    {
        if (clip == null) return;

        if (musicSource.clip != null && musicSource.isPlaying)
        {
            StartCrossfade(clip, loop);
        }
        else
        {
            musicSource.clip = clip;
            musicSource.loop = loop;
            musicSource.volume = musicVolume * masterVolume;
            musicSource.Play();
        }
    }

    public void StopMusic()
    {
        musicSource.Stop();
        musicSource.clip = null;
        isCrossfading = false;
    }

    public void PlaySFX(AudioClip clip, float volumeScale = 1f)
    {
        if (clip == null || sfxSources.Count == 0) return;

        AudioSource source = sfxSources[nextSfxIndex];
        source.clip = clip;
        source.volume = sfxVolume * masterVolume * volumeScale;
        source.pitch = 1f;
        source.loop = false;
        source.Play();

        nextSfxIndex = (nextSfxIndex + 1) % sfxSources.Count;
    }

    public void SetMasterVolume(float volume)
    {
        masterVolume = Mathf.Clamp01(volume);
        ApplyVolumes();
    }

    public void SetMusicVolume(float volume)
    {
        musicVolume = Mathf.Clamp01(volume);
        ApplyVolumes();
    }

    public void SetSFXVolume(float volume)
    {
        sfxVolume = Mathf.Clamp01(volume);
        ApplyVolumes();
    }

    private void ApplyVolumes()
    {
        if (musicSource != null)
            musicSource.volume = musicVolume * masterVolume;

        foreach (AudioSource source in sfxSources)
        {
            if (source != null && source.isPlaying)
                source.volume = sfxVolume * masterVolume;
        }
    }

    private void StartCrossfade(AudioClip newClip, bool loop)
    {
        pendingMusicClip = newClip;
        isCrossfading = true;
        crossfadeTimer = 0f;
        musicSource.loop = loop;
        StartCoroutine(CrossfadeRoutine(loop));
    }

    private System.Collections.IEnumerator CrossfadeRoutine(bool loop)
    {
        float startVolume = musicSource.volume;
        float targetVolume = musicVolume * masterVolume;

        while (crossfadeTimer < crossfadeDuration)
        {
            crossfadeTimer += Time.unscaledDeltaTime;
            float t = crossfadeTimer / crossfadeDuration;
            musicSource.volume = Mathf.Lerp(startVolume, 0f, t);
            yield return null;
        }

        musicSource.clip = pendingMusicClip;
        musicSource.loop = loop;
        musicSource.volume = 0f;
        musicSource.Play();

        crossfadeTimer = 0f;
        while (crossfadeTimer < crossfadeDuration)
        {
            crossfadeTimer += Time.unscaledDeltaTime;
            float t = crossfadeTimer / crossfadeDuration;
            musicSource.volume = Mathf.Lerp(0f, targetVolume, t);
            yield return null;
        }

        musicSource.volume = targetVolume;
        isCrossfading = false;
        pendingMusicClip = null;
    }
}
