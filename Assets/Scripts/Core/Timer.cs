using System;
using UnityEngine;

public class Timer
{
    private float _duration;
    private float _elapsedTime;
    private bool _isRunning;
    private bool _isFinished;
    private bool _isPaused;

    public bool IsRunning => _isRunning && !_isPaused;
    public bool IsFinished => _isFinished;
    public float RemainingTime => Mathf.Max(0f, _duration - _elapsedTime);
    public float Progress => _duration > 0f ? Mathf.Clamp01(_elapsedTime / _duration) : 0f;

    public event Action OnFinished;

    public Timer(float duration)
    {
        _duration = duration;
        _elapsedTime = 0f;
        _isRunning = false;
        _isFinished = false;
        _isPaused = false;
    }

    public void Start()
    {
        _elapsedTime = 0f;
        _isRunning = true;
        _isFinished = false;
        _isPaused = false;
    }

    public void Pause()
    {
        if (_isRunning && !_isFinished)
            _isPaused = true;
    }

    public void Resume()
    {
        if (_isRunning && _isPaused)
            _isPaused = false;
    }

    public void Reset()
    {
        _elapsedTime = 0f;
        _isRunning = false;
        _isFinished = false;
        _isPaused = false;
    }

    public void Tick(float deltaTime)
    {
        if (!_isRunning || _isPaused || _isFinished)
            return;

        _elapsedTime += deltaTime;

        if (_elapsedTime >= _duration)
        {
            _elapsedTime = _duration;
            _isFinished = true;
            _isRunning = false;
            OnFinished?.Invoke();
        }
    }
}
