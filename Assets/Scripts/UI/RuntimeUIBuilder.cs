using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;

namespace LakeSailing.UI
{
    public static class RuntimeUIBuilder
    {
        private static Font cachedFont;

        public static Font GetDefaultFont()
        {
            if (cachedFont != null) return cachedFont;
            cachedFont = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            if (cachedFont == null) cachedFont = Resources.GetBuiltinResource<Font>("Arial.ttf");
            return cachedFont;
        }

        public static void EnsureEventSystem()
        {
            if (Object.FindObjectOfType<EventSystem>() != null) return;
            var go = new GameObject("EventSystem");
            go.AddComponent<EventSystem>();
            go.AddComponent<StandaloneInputModule>();
        }

        public static GameObject CreatePanel(Transform parent, string name)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            StretchFull(rt);
            go.AddComponent<CanvasRenderer>();
            var img = go.AddComponent<Image>();
            img.color = new Color(0, 0, 0, 0.78f);
            return go;
        }

        public static GameObject CreateContent(Transform parent, string name = "Content")
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            StretchFull(rt, 40f);
            return go;
        }

        public static Text CreateTitle(Transform parent, string text, int fontSize = 48, float yOffset = 0)
        {
            var go = new GameObject("Title_" + text.Replace(" ", ""));
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 1f);
            rt.anchorMax = new Vector2(0.5f, 1f);
            rt.pivot = new Vector2(0.5f, 1f);
            rt.anchoredPosition = new Vector2(0, -80f + yOffset);
            rt.sizeDelta = new Vector2(800, fontSize + 20);

            var t = go.AddComponent<Text>();
            t.text = text;
            t.font = GetDefaultFont();
            t.fontSize = fontSize;
            t.fontStyle = FontStyle.Bold;
            t.color = Color.white;
            t.alignment = TextAnchor.MiddleCenter;
            t.horizontalOverflow = HorizontalWrapMode.Overflow;
            return t;
        }

        public static Text CreateLabel(Transform parent, string text, int fontSize = 22,
            TextAnchor anchor = TextAnchor.MiddleLeft, float width = 600, float height = 36)
        {
            var go = new GameObject("Label");
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 0.5f);
            rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(width, height);

            var t = go.AddComponent<Text>();
            t.text = text;
            t.font = GetDefaultFont();
            t.fontSize = fontSize;
            t.color = Color.white;
            t.alignment = anchor;
            t.horizontalOverflow = HorizontalWrapMode.Wrap;
            t.verticalOverflow = VerticalWrapMode.Truncate;
            return t;
        }

        public static Button CreateButton(Transform parent, string label, Vector2 size,
            System.Action onClick, int fontSize = 26, Color? normalColor = null, Color? hoverColor = null)
        {
            var go = new GameObject("Button_" + label);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 0.5f);
            rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = size;

            var img = go.AddComponent<Image>();
            img.color = normalColor ?? new Color(0.2f, 0.4f, 0.85f, 0.95f);
            img.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            img.type = Image.Type.Sliced;

            var btn = go.AddComponent<Button>();
            var colors = btn.colors;
            colors.normalColor = img.color;
            colors.highlightedColor = hoverColor ?? new Color(img.color.r * 1.3f, img.color.g * 1.3f, img.color.b * 1.3f, 1f);
            colors.pressedColor = new Color(img.color.r * 0.7f, img.color.g * 0.7f, img.color.b * 0.7f, 1f);
            colors.disabledColor = new Color(0.3f, 0.3f, 0.3f, 0.5f);
            colors.colorMultiplier = 1f;
            colors.fadeDuration = 0.08f;
            btn.colors = colors;

            if (onClick != null) btn.onClick.AddListener(() => onClick());

            var labelGO = new GameObject("Label");
            labelGO.transform.SetParent(go.transform, false);
            var lrt = labelGO.AddComponent<RectTransform>();
            StretchFull(lrt);
            var lt = labelGO.AddComponent<Text>();
            lt.text = label;
            lt.font = GetDefaultFont();
            lt.fontSize = fontSize;
            lt.fontStyle = FontStyle.Bold;
            lt.color = Color.white;
            lt.alignment = TextAnchor.MiddleCenter;
            lt.horizontalOverflow = HorizontalWrapMode.Overflow;
            lt.verticalOverflow = VerticalWrapMode.Truncate;

            return btn;
        }

        public static GameObject CreateVerticalGroup(Transform parent, string name = "VGroup",
            float spacing = 15, float padTop = 0, float padBottom = 0, float padLeft = 0, float padRight = 0,
            TextAnchor anchor = TextAnchor.UpperCenter)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            StretchFull(rt, 20f);

            var vl = go.AddComponent<VerticalLayoutGroup>();
            vl.spacing = spacing;
            vl.padding = new RectOffset((int)padLeft, (int)padRight, (int)padTop, (int)padBottom);
            vl.childAlignment = anchor;
            vl.childControlHeight = true;
            vl.childControlWidth = false;
            vl.childForceExpandHeight = false;
            vl.childForceExpandWidth = false;

            var fitter = go.AddComponent<ContentSizeFitter>();
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            fitter.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;
            return go;
        }

        public static GameObject CreateHorizontalGroup(Transform parent, string name = "HGroup",
            float spacing = 20, TextAnchor anchor = TextAnchor.MiddleCenter)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 0.5f);
            rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(1200, 60);

            var hl = go.AddComponent<HorizontalLayoutGroup>();
            hl.spacing = spacing;
            hl.padding = new RectOffset(20, 20, 5, 5);
            hl.childAlignment = anchor;
            hl.childControlHeight = true;
            hl.childControlWidth = false;
            hl.childForceExpandHeight = true;
            hl.childForceExpandWidth = false;
            return go;
        }

        public static Slider CreateSlider(Transform parent, string label, float width = 400,
            float min = 0, float max = 1, float init = 0.5f)
        {
            var go = new GameObject("Slider_" + label);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 0.5f);
            rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(width, 30);

            var slider = go.AddComponent<Slider>();
            slider.minValue = min;
            slider.maxValue = max;
            slider.value = init;

            var bgGO = new GameObject("Background");
            bgGO.transform.SetParent(go.transform, false);
            var bgRT = bgGO.AddComponent<RectTransform>();
            StretchFull(bgRT);
            var bgImg = bgGO.AddComponent<Image>();
            bgImg.color = new Color(0.2f, 0.2f, 0.25f, 1);
            slider.targetGraphic = bgImg;

            var fillArea = new GameObject("Fill Area");
            fillArea.transform.SetParent(go.transform, false);
            var faRT = fillArea.AddComponent<RectTransform>();
            faRT.anchorMin = new Vector2(0, 0.25f);
            faRT.anchorMax = new Vector2(1, 0.75f);
            faRT.sizeDelta = new Vector2(-20, 0);
            faRT.offsetMin = new Vector2(5, faRT.offsetMin.y);
            faRT.offsetMax = new Vector2(-15, faRT.offsetMax.y);

            var fillGO = new GameObject("Fill");
            fillGO.transform.SetParent(fillArea.transform, false);
            var fillRT = fillGO.AddComponent<RectTransform>();
            StretchFull(fillRT);
            var fillImg = fillGO.AddComponent<Image>();
            fillImg.color = new Color(0.3f, 0.7f, 1f, 0.95f);
            slider.fillRect = fillRT;

            var handleArea = new GameObject("Handle Slide Area");
            handleArea.transform.SetParent(go.transform, false);
            var haRT = handleArea.AddComponent<RectTransform>();
            haRT.anchorMin = new Vector2(0, 0);
            haRT.anchorMax = new Vector2(1, 1);
            haRT.sizeDelta = new Vector2(-20, 0);
            haRT.offsetMin = new Vector2(10, haRT.offsetMin.y);
            haRT.offsetMax = new Vector2(-10, haRT.offsetMax.y);

            var handleGO = new GameObject("Handle");
            handleGO.transform.SetParent(handleArea.transform, false);
            var hRT = handleGO.AddComponent<RectTransform>();
            hRT.sizeDelta = new Vector2(24, 32);
            hRT.anchorMin = new Vector2(0.5f, 0.5f);
            hRT.anchorMax = new Vector2(0.5f, 0.5f);
            hRT.pivot = new Vector2(0.5f, 0.5f);
            var hImg = handleGO.AddComponent<Image>();
            hImg.color = Color.white;
            hImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            slider.handleRect = hRT;
            slider.targetGraphic = hImg;

            return slider;
        }

        public static Toggle CreateToggle(Transform parent, string label, bool init = false,
            System.Action<bool> onValueChanged = null)
        {
            var go = new GameObject("Toggle_" + label);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 0.5f);
            rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(300, 40);

            var hg = go.AddComponent<HorizontalLayoutGroup>();
            hg.spacing = 10;
            hg.childAlignment = TextAnchor.MiddleLeft;
            hg.childForceExpandHeight = true;

            var toggle = go.AddComponent<Toggle>();
            toggle.isOn = init;
            if (onValueChanged != null) toggle.onValueChanged.AddListener(v => onValueChanged(v));

            var checkGO = new GameObject("Checkmark");
            checkGO.transform.SetParent(go.transform, false);
            var cRT = checkGO.AddComponent<RectTransform>();
            cRT.sizeDelta = new Vector2(24, 24);
            var cImg = checkGO.AddComponent<Image>();
            cImg.color = new Color(0.15f, 0.15f, 0.2f);
            toggle.targetGraphic = cImg;

            var markGO = new GameObject("Mark");
            markGO.transform.SetParent(checkGO.transform, false);
            var mRT = markGO.AddComponent<RectTransform>();
            StretchFull(mRT, 4f);
            var mImg = markGO.AddComponent<Image>();
            mImg.color = new Color(0.4f, 0.9f, 1f);
            toggle.graphic = mImg;

            var lblGO = new GameObject("Label");
            lblGO.transform.SetParent(go.transform, false);
            var lRT = lblGO.AddComponent<RectTransform>();
            lRT.sizeDelta = new Vector2(260, 40);
            var l = lblGO.AddComponent<Text>();
            l.text = label;
            l.font = GetDefaultFont();
            l.fontSize = 22;
            l.color = Color.white;
            l.alignment = TextAnchor.MiddleLeft;
            return toggle;
        }

        public static Image CreateIconBox(Transform parent, Vector2 size, Color bgColor)
        {
            var go = new GameObject("IconBox");
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 0.5f);
            rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = size;
            var img = go.AddComponent<Image>();
            img.color = bgColor;
            img.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            img.type = Image.Type.Sliced;
            return img;
        }

        public static void StretchFull(RectTransform rt, float margin = 0f)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.offsetMin = new Vector2(margin, margin);
            rt.offsetMax = new Vector2(-margin, -margin);
        }

        public static void SetAnchoredPosition(RectTransform rt, float x, float y)
        {
            rt.anchorMin = new Vector2(0.5f, 0.5f);
            rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.anchoredPosition = new Vector2(x, y);
        }
    }
}
