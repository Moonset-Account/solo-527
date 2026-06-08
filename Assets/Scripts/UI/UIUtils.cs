using UnityEngine;
using UnityEngine.UI;

namespace RainAlley.UI
{
    public static class UIUtils
    {
        public const string DefaultFontName = "LegacyRuntime.ttf";
        public static Font DefaultUIFont { get; private set; }

        static UIUtils()
        {
            DefaultUIFont = Resources.GetBuiltinResource<Font>(DefaultFontName);
            if (DefaultUIFont == null) DefaultUIFont = Resources.GetBuiltinResource<Font>("Arial.ttf");
        }

        public static GameObject NewPanel(string name, Transform parent, Color bgColor)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var img = go.AddComponent<Image>();
            img.color = bgColor;
            Stretch(go.GetComponent<RectTransform>());
            return go;
        }

        public static GameObject NewText(string name, Transform parent, string text,
                                         int fontSize = 24, TextAnchor anchor = TextAnchor.MiddleCenter,
                                         Color? color = null, Font font = null)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var t = go.AddComponent<Text>();
            t.text = text;
            t.font = font ?? DefaultUIFont;
            t.fontSize = fontSize;
            t.alignment = anchor;
            t.color = color ?? Color.white;
            t.horizontalOverflow = HorizontalWrapMode.Overflow;
            t.verticalOverflow = VerticalWrapMode.Overflow;
            Stretch(go.GetComponent<RectTransform>());
            return go;
        }

        public static Button NewButton(string name, Transform parent, string labelText,
                                        Vector2 anchorMin, Vector2 anchorMax, Vector2 offsetMin, Vector2 offsetMax,
                                        Color? bgColor = null, Color? labelColor = null, int fontSize = 22,
                                        Font font = null)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = offsetMin;
            rt.offsetMax = offsetMax;

            var img = go.AddComponent<Image>();
            img.color = bgColor ?? new Color(0.2f, 0.25f, 0.4f, 0.95f);

            var btn = go.AddComponent<Button>();
            var colors = btn.colors;
            colors.normalColor = img.color;
            colors.highlightedColor = new Color(img.color.r * 1.2f, img.color.g * 1.2f, img.color.b * 1.2f, img.color.a);
            colors.pressedColor = new Color(img.color.r * 0.7f, img.color.g * 0.7f, img.color.b * 0.7f, img.color.a);
            colors.selectedColor = colors.highlightedColor;
            colors.colorMultiplier = 1f;
            colors.fadeDuration = 0.1f;
            btn.colors = colors;

            var txtGo = NewText("Label", go.transform, labelText, fontSize, TextAnchor.MiddleCenter,
                                labelColor ?? Color.white, font);
            Stretch(txtGo.GetComponent<RectTransform>());
            return btn;
        }

        public static Slider NewSlider(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax,
                                       Vector2 offsetMin, Vector2 offsetMax, float min, float max, float defaultValue)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = offsetMin;
            rt.offsetMax = offsetMax;
            go.AddComponent<Image>().color = new Color(0.15f, 0.15f, 0.2f, 0.8f);

            var slider = go.AddComponent<Slider>();
            slider.minValue = min;
            slider.maxValue = max;
            slider.value = defaultValue;

            var fillArea = NewEmpty("Fill Area", go.transform);
            fillArea.GetComponent<RectTransform>().anchorMin = new Vector2(0, 0.25f);
            fillArea.GetComponent<RectTransform>().anchorMax = new Vector2(1, 0.75f);
            fillArea.GetComponent<RectTransform>().offsetMin = new Vector2(4, 0);
            fillArea.GetComponent<RectTransform>().offsetMax = new Vector2(-4, 0);

            var fill = NewEmpty("Fill", fillArea.transform);
            fill.GetComponent<RectTransform>().sizeDelta = Vector2.zero;
            fill.GetComponent<RectTransform>().anchorMin = Vector2.zero;
            fill.GetComponent<RectTransform>().anchorMax = Vector2.one;
            fill.GetComponent<RectTransform>().offsetMin = Vector2.zero;
            fill.GetComponent<RectTransform>().offsetMax = Vector2.zero;
            var fillImg = fill.AddComponent<Image>();
            fillImg.color = new Color(0.3f, 0.8f, 1f);
            slider.fillRect = fill.GetComponent<RectTransform>();

            var handleArea = NewEmpty("Handle Slide Area", go.transform);
            handleArea.GetComponent<RectTransform>().anchorMin = new Vector2(0, 0);
            handleArea.GetComponent<RectTransform>().anchorMax = new Vector2(1, 1);
            handleArea.GetComponent<RectTransform>().offsetMin = new Vector2(10, 0);
            handleArea.GetComponent<RectTransform>().offsetMax = new Vector2(-10, 0);

            var handle = NewEmpty("Handle", handleArea.transform);
            handle.GetComponent<RectTransform>().sizeDelta = new Vector2(20, 0);
            var handleImg = handle.AddComponent<Image>();
            handleImg.color = Color.white;
            slider.handleRect = handle.GetComponent<RectTransform>();
            slider.targetGraphic = handleImg;
            slider.direction = Slider.Direction.LeftToRight;

            return slider;
        }

        public static Image NewImage(string name, Transform parent, Color color,
                                      Vector2 anchorMin, Vector2 anchorMax, Vector2 size,
                                      Vector2? pivot = null)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.sizeDelta = size;
            rt.anchoredPosition = Vector2.zero;
            if (pivot.HasValue) rt.pivot = pivot.Value;
            var img = go.AddComponent<Image>();
            img.color = color;
            return img;
        }

        public static GameObject NewEmpty(string name, Transform parent)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 0.5f);
            rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
            return go;
        }

        public static void Stretch(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }

        public static void SetAnchors(RectTransform rt, Vector2 anchor, Vector2 pivot, Vector2 size, Vector2 pos)
        {
            rt.anchorMin = anchor;
            rt.anchorMax = anchor;
            rt.pivot = pivot;
            rt.sizeDelta = size;
            rt.anchoredPosition = pos;
        }

        public static Outline AddOutline(GameObject go, Color color, int dist = 2)
        {
            var o = go.AddComponent<Outline>();
            o.effectColor = color;
            o.effectDistance = new Vector2(dist, -dist);
            return o;
        }

        public static Shadow AddShadow(GameObject go, Color? color = null, int dist = 3)
        {
            var s = go.AddComponent<Shadow>();
            s.effectColor = color ?? new Color(0, 0, 0, 0.5f);
            s.effectDistance = new Vector2(dist, -dist);
            return s;
        }
    }
}
