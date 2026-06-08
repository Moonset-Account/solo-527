using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public abstract class UIPanel : MonoBehaviour
{
    public CanvasGroup canvasGroup;

    public virtual void Show()
    {
        gameObject.SetActive(true);
        if (canvasGroup != null)
        {
            canvasGroup.alpha = 1f;
            canvasGroup.blocksRaycasts = true;
        }
        OnShow();
    }

    public virtual void Hide()
    {
        gameObject.SetActive(false);
        OnHide();
    }

    public virtual void OnInit()
    {
    }

    public virtual void OnShow()
    {
    }

    public virtual void OnHide()
    {
    }
}
