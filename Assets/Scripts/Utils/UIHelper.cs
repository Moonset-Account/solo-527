using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public static class UIHelper
{
    static Font _defaultFont;
    public static Font DefaultFont
    {
        get
        {
            if (_defaultFont == null)
            {
                _defaultFont = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                if (_defaultFont == null) _defaultFont = Font.CreateDynamicFontFromOSFont("Arial", 14);
            }
            return _defaultFont;
        }
    }

    public static Color PrimaryColor = new Color(0.12f, 0.14f, 0.18f, 1f);
    public static Color PanelBgColor = new Color(0.15f, 0.17f, 0.22f, 0.95f);
    public static Color ButtonColor = new Color(0.2f, 0.35f, 0.55f, 1f);
    public static Color ButtonHoverColor = new Color(0.25f, 0.45f, 0.7f, 1f);
    public static Color TextColor = Color.white;
    public static Color AccentColor = new Color(0.3f, 0.7f, 0.4f, 1f);
    public static Color DangerColor = new Color(0.7f, 0.2f, 0.2f, 1f);
    public static Color WarningColor = new Color(0.8f, 0.6f, 0.1f, 1f);

    public static GameObject CreatePanel(Transform parent, string name)
    {
        GameObject obj = new GameObject(name);
        obj.transform.SetParent(parent, false);
        RectTransform rt = obj.AddComponent<RectTransform>();
        rt.anchorMin = Vector2.zero;
        rt.anchorMax = Vector2.one;
        rt.offsetMin = Vector2.zero;
        rt.offsetMax = Vector2.zero;
        Image img = obj.AddComponent<Image>();
        img.color = PanelBgColor;
        return obj;
    }

    public static GameObject CreateSubPanel(Transform parent, string name, float top, float bottom, float left, float right)
    {
        GameObject obj = new GameObject(name);
        obj.transform.SetParent(parent, false);
        RectTransform rt = obj.AddComponent<RectTransform>();
        rt.anchorMin = Vector2.zero;
        rt.anchorMax = Vector2.one;
        rt.offsetMin = new Vector2(left, bottom);
        rt.offsetMax = new Vector2(-right, -top);
        Image img = obj.AddComponent<Image>();
        img.color = new Color(0.18f, 0.2f, 0.25f, 0.9f);
        return obj;
    }

    public static Text CreateTitle(Transform parent, string name, string text, int fontSize = 36)
    {
        GameObject obj = new GameObject(name);
        obj.transform.SetParent(parent, false);
        RectTransform rt = obj.AddComponent<RectTransform>();
        rt.anchorMin = new Vector2(0.5f, 0.85f);
        rt.anchorMax = new Vector2(0.5f, 0.95f);
        rt.offsetMin = new Vector2(-300, 0);
        rt.offsetMax = new Vector2(300, 0);
        Text txt = obj.AddComponent<Text>();
        txt.font = DefaultFont;
        txt.text = text;
        txt.fontSize = fontSize;
        txt.color = AccentColor;
        txt.alignment = TextAnchor.MiddleCenter;
        return txt;
    }

    public static Text CreateLabel(Transform parent, string name, string text, int fontSize = 20)
    {
        GameObject obj = new GameObject(name);
        obj.transform.SetParent(parent, false);
        RectTransform rt = obj.AddComponent<RectTransform>();
        rt.anchorMin = new Vector2(0, 0.5f);
        rt.anchorMax = new Vector2(1, 0.5f);
        rt.offsetMin = new Vector2(20, -15);
        rt.offsetMax = new Vector2(-20, 15);
        Text txt = obj.AddComponent<Text>();
        txt.font = DefaultFont;
        txt.text = text;
        txt.fontSize = fontSize;
        txt.color = TextColor;
        txt.alignment = TextAnchor.MiddleLeft;
        return txt;
    }

    public static Text CreateText(Transform parent, string name, string text, Vector2 anchorMin, Vector2 anchorMax, int fontSize = 22)
    {
        GameObject obj = new GameObject(name);
        obj.transform.SetParent(parent, false);
        RectTransform rt = obj.AddComponent<RectTransform>();
        rt.anchorMin = anchorMin;
        rt.anchorMax = anchorMax;
        rt.offsetMin = new Vector2(10, 5);
        rt.offsetMax = new Vector2(-10, -5);
        Text txt = obj.AddComponent<Text>();
        txt.font = DefaultFont;
        txt.text = text;
        txt.fontSize = fontSize;
        txt.color = TextColor;
        txt.alignment = TextAnchor.MiddleCenter;
        return txt;
    }

    public static Button CreateButton(Transform parent, string name, string text, Vector2 anchorMin, Vector2 anchorMax, int fontSize = 22, Color? bgColor = null)
    {
        GameObject obj = new GameObject(name);
        obj.transform.SetParent(parent, false);
        RectTransform rt = obj.AddComponent<RectTransform>();
        rt.anchorMin = anchorMin;
        rt.anchorMax = anchorMax;
        rt.offsetMin = new Vector2(5, 5);
        rt.offsetMax = new Vector2(-5, -5);
        Image img = obj.AddComponent<Image>();
        img.color = bgColor ?? ButtonColor;
        Button btn = obj.AddComponent<Button>();
        btn.targetGraphic = img;
        ColorBlock colors = btn.colors;
        colors.highlightedColor = ButtonHoverColor;
        colors.pressedColor = new Color(0.15f, 0.25f, 0.4f, 1f);
        btn.colors = colors;
        GameObject textObj = new GameObject("Text");
        textObj.transform.SetParent(obj.transform, false);
        RectTransform textRt = textObj.AddComponent<RectTransform>();
        textRt.anchorMin = Vector2.zero;
        textRt.anchorMax = Vector2.one;
        textRt.offsetMin = Vector2.zero;
        textRt.offsetMax = Vector2.zero;
        Text txt = textObj.AddComponent<Text>();
        txt.font = DefaultFont;
        txt.text = text;
        txt.fontSize = fontSize;
        txt.color = Color.white;
        txt.alignment = TextAnchor.MiddleCenter;
        return btn;
    }

    public static Button CreateWideButton(Transform parent, string name, string text, float yCenter, float height = 55f, int fontSize = 24)
    {
        return CreateButton(parent, name, text,
            new Vector2(0.2f, yCenter - height / 1080f),
            new Vector2(0.8f, yCenter + height / 1080f),
            fontSize);
    }

    public static Slider CreateSlider(Transform parent, string name, Vector2 anchorMin, Vector2 anchorMax, float defaultValue = 0.7f)
    {
        GameObject obj = new GameObject(name);
        obj.transform.SetParent(parent, false);
        RectTransform rt = obj.AddComponent<RectTransform>();
        rt.anchorMin = anchorMin;
        rt.anchorMax = anchorMax;
        rt.offsetMin = new Vector2(10, 5);
        rt.offsetMax = new Vector2(-10, -5);
        GameObject bgObj = new GameObject("Background");
        bgObj.transform.SetParent(obj.transform, false);
        RectTransform bgRt = bgObj.AddComponent<RectTransform>();
        bgRt.anchorMin = Vector2.zero;
        bgRt.anchorMax = Vector2.one;
        bgRt.offsetMin = Vector2.zero;
        bgRt.offsetMax = Vector2.zero;
        Image bgImg = bgObj.AddComponent<Image>();
        bgImg.color = new Color(0.1f, 0.1f, 0.15f, 1f);
        GameObject fillAreaObj = new GameObject("Fill Area");
        fillAreaObj.transform.SetParent(obj.transform, false);
        RectTransform fillAreaRt = fillAreaObj.AddComponent<RectTransform>();
        fillAreaRt.anchorMin = Vector2.zero;
        fillAreaRt.anchorMax = Vector2.one;
        fillAreaRt.offsetMin = Vector2.zero;
        fillAreaRt.offsetMax = Vector2.zero;
        GameObject fillObj = new GameObject("Fill");
        fillObj.transform.SetParent(fillAreaObj.transform, false);
        RectTransform fillRt = fillObj.AddComponent<RectTransform>();
        fillRt.anchorMin = Vector2.zero;
        fillRt.anchorMax = new Vector2(defaultValue, 1f);
        fillRt.offsetMin = Vector2.zero;
        fillRt.offsetMax = Vector2.zero;
        Image fillImg = fillObj.AddComponent<Image>();
        fillImg.color = AccentColor;
        Slider slider = obj.AddComponent<Slider>();
        slider.targetGraphic = bgImg;
        slider.fillRect = fillRt;
        slider.handleRect = null;
        slider.direction = Slider.Direction.LeftToRight;
        slider.minValue = 0f;
        slider.maxValue = 1f;
        slider.value = defaultValue;
        slider.onValueChanged.AddListener((v) =>
        {
            fillRt.anchorMax = new Vector2(v, 1f);
        });
        return slider;
    }

    public static Toggle CreateToggle(Transform parent, string name, string label, Vector2 anchorMin, Vector2 anchorMax, bool defaultValue = true)
    {
        GameObject obj = new GameObject(name);
        obj.transform.SetParent(parent, false);
        RectTransform rt = obj.AddComponent<RectTransform>();
        rt.anchorMin = anchorMin;
        rt.anchorMax = anchorMax;
        rt.offsetMin = new Vector2(10, 5);
        rt.offsetMax = new Vector2(-10, -5);
        GameObject bgObj = new GameObject("Background");
        bgObj.transform.SetParent(obj.transform, false);
        RectTransform bgRt = bgObj.AddComponent<RectTransform>();
        bgRt.anchorMin = new Vector2(0f, 0.5f);
        bgRt.anchorMax = new Vector2(0f, 0.5f);
        bgRt.sizeDelta = new Vector2(30, 30);
        bgRt.anchoredPosition = new Vector2(15, 0);
        Image bgImg = bgObj.AddComponent<Image>();
        bgImg.color = new Color(0.1f, 0.1f, 0.15f, 1f);
        GameObject checkObj = new GameObject("Checkmark");
        checkObj.transform.SetParent(bgObj.transform, false);
        RectTransform checkRt = checkObj.AddComponent<RectTransform>();
        checkRt.anchorMin = Vector2.zero;
        checkRt.anchorMax = Vector2.one;
        checkRt.offsetMin = new Vector2(4, 4);
        checkRt.offsetMax = new Vector2(-4, -4);
        Image checkImg = checkObj.AddComponent<Image>();
        checkImg.color = AccentColor;
        GameObject labelObj = new GameObject("Label");
        labelObj.transform.SetParent(obj.transform, false);
        RectTransform labelRt = labelObj.AddComponent<RectTransform>();
        labelRt.anchorMin = Vector2.zero;
        labelRt.anchorMax = Vector2.one;
        labelRt.offsetMin = new Vector2(50, 0);
        labelRt.offsetMax = Vector2.zero;
        Text labelText = labelObj.AddComponent<Text>();
        labelText.font = DefaultFont;
        labelText.text = label;
        labelText.fontSize = 18;
        labelText.color = TextColor;
        labelText.alignment = TextAnchor.MiddleLeft;
        Toggle toggle = obj.AddComponent<Toggle>();
        toggle.targetGraphic = bgImg;
        toggle.graphic = checkImg;
        toggle.isOn = defaultValue;
        return toggle;
    }

    public static ScrollRect CreateScrollList(Transform parent, string name, Vector2 anchorMin, Vector2 anchorMax, out Transform contentTransform)
    {
        GameObject obj = new GameObject(name);
        obj.transform.SetParent(parent, false);
        RectTransform rt = obj.AddComponent<RectTransform>();
        rt.anchorMin = anchorMin;
        rt.anchorMax = anchorMax;
        rt.offsetMin = new Vector2(10, 10);
        rt.offsetMax = new Vector2(-10, -10);
        Image bgImg = obj.AddComponent<Image>();
        bgImg.color = new Color(0.1f, 0.12f, 0.16f, 0.9f);
        GameObject viewportObj = new GameObject("Viewport");
        viewportObj.transform.SetParent(obj.transform, false);
        RectTransform vpRt = viewportObj.AddComponent<RectTransform>();
        vpRt.anchorMin = Vector2.zero;
        vpRt.anchorMax = Vector2.one;
        vpRt.offsetMin = Vector2.zero;
        vpRt.offsetMax = Vector2.zero;
        Image vpMask = viewportObj.AddComponent<Image>();
        vpMask.color = Color.clear;
        viewportObj.AddComponent<Mask>().showMaskGraphic = false;
        GameObject contentObj = new GameObject("Content");
        contentObj.transform.SetParent(viewportObj.transform, false);
        RectTransform contentRt = contentObj.AddComponent<RectTransform>();
        contentRt.anchorMin = new Vector2(0, 1);
        contentRt.anchorMax = new Vector2(1, 1);
        contentRt.pivot = new Vector2(0.5f, 1);
        contentRt.offsetMin = new Vector2(0, 0);
        contentRt.offsetMax = new Vector2(0, 0);
        VerticalLayoutGroup vlg = contentObj.AddComponent<VerticalLayoutGroup>();
        vlg.childAlignment = TextAnchor.UpperCenter;
        vlg.childControlWidth = true;
        vlg.childControlHeight = false;
        vlg.childForceExpandWidth = true;
        vlg.childForceExpandHeight = false;
        vlg.spacing = 5;
        ContentSizeFitter csf = contentObj.AddComponent<ContentSizeFitter>();
        csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
        ScrollRect scroll = obj.AddComponent<ScrollRect>();
        scroll.content = contentRt;
        scroll.viewport = vpRt;
        scroll.horizontal = false;
        scroll.vertical = true;
        scroll.movementType = ScrollRect.MovementType.Elastic;
        contentTransform = contentObj.transform;
        return scroll;
    }

    public static Button CreateListItem(Transform contentParent, string name, string text, int height = 45)
    {
        GameObject obj = new GameObject(name);
        obj.transform.SetParent(contentParent, false);
        RectTransform rt = obj.AddComponent<RectTransform>();
        rt.offsetMin = new Vector2(0, 0);
        rt.offsetMax = new Vector2(0, 0);
        LayoutElement le = obj.AddComponent<LayoutElement>();
        le.minHeight = height;
        le.preferredHeight = height;
        Image img = obj.AddComponent<Image>();
        img.color = new Color(0.2f, 0.28f, 0.38f, 1f);
        Button btn = obj.AddComponent<Button>();
        btn.targetGraphic = img;
        ColorBlock colors = btn.colors;
        colors.highlightedColor = ButtonHoverColor;
        colors.pressedColor = new Color(0.15f, 0.2f, 0.3f, 1f);
        btn.colors = colors;
        GameObject textObj = new GameObject("Text");
        textObj.transform.SetParent(obj.transform, false);
        RectTransform textRt = textObj.AddComponent<RectTransform>();
        textRt.anchorMin = Vector2.zero;
        textRt.anchorMax = Vector2.one;
        textRt.offsetMin = new Vector2(15, 0);
        textRt.offsetMax = new Vector2(-15, 0);
        Text txt = textObj.AddComponent<Text>();
        txt.font = DefaultFont;
        txt.text = text;
        txt.fontSize = 18;
        txt.color = TextColor;
        txt.alignment = TextAnchor.MiddleLeft;
        return btn;
    }

    public static Image CreateStatBar(Transform parent, string name, string label, float value, Vector2 anchorMin, Vector2 anchorMax)
    {
        GameObject obj = new GameObject(name);
        obj.transform.SetParent(parent, false);
        RectTransform rt = obj.AddComponent<RectTransform>();
        rt.anchorMin = anchorMin;
        rt.anchorMax = anchorMax;
        rt.offsetMin = new Vector2(10, 2);
        rt.offsetMax = new Vector2(-10, -2);
        GameObject bgObj = new GameObject("Bg");
        bgObj.transform.SetParent(obj.transform, false);
        RectTransform bgRt = bgObj.AddComponent<RectTransform>();
        bgRt.anchorMin = Vector2.zero;
        bgRt.anchorMax = Vector2.one;
        bgRt.offsetMin = Vector2.zero;
        bgRt.offsetMax = Vector2.zero;
        Image bgImg = bgObj.AddComponent<Image>();
        bgImg.color = new Color(0.08f, 0.08f, 0.12f, 1f);
        GameObject fillObj = new GameObject("Fill");
        fillObj.transform.SetParent(obj.transform, false);
        RectTransform fillRt = fillObj.AddComponent<RectTransform>();
        fillRt.anchorMin = Vector2.zero;
        fillRt.anchorMax = new Vector2(Mathf.Clamp01(value), 1f);
        fillRt.offsetMin = Vector2.zero;
        fillRt.offsetMax = Vector2.zero;
        Image fillImg = fillObj.AddComponent<Image>();
        fillImg.color = value > 0.6f ? AccentColor : (value > 0.3f ? WarningColor : DangerColor);
        GameObject labelObj = new GameObject("Label");
        labelObj.transform.SetParent(obj.transform, false);
        RectTransform labelRt = labelObj.AddComponent<RectTransform>();
        labelRt.anchorMin = Vector2.zero;
        labelRt.anchorMax = Vector2.one;
        labelRt.offsetMin = new Vector2(10, 0);
        labelRt.offsetMax = Vector2.zero;
        Text txt = labelObj.AddComponent<Text>();
        txt.font = DefaultFont;
        txt.text = label + ": " + (value * 100).ToString("F0");
        txt.fontSize = 14;
        txt.color = Color.white;
        txt.alignment = TextAnchor.MiddleLeft;
        return fillImg;
    }
}
