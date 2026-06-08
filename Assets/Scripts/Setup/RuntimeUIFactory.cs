using System.Collections.Generic;
using Kitchen.Core;
using Kitchen.Gameplay;
using Kitchen.Performance;
using Kitchen.Save;
using Kitchen.UI;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Kitchen.Setup
{
    public static class RuntimeUIFactory
    {
        private static Font _defaultFont;
        private static TMP_FontAsset _tmpFont;

        public static void EnsureFonts()
        {
            if (_defaultFont == null) _defaultFont = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            if (_tmpFont == null)
            {
                _tmpFont = TMP_Settings.defaultFontAsset;
                if (_tmpFont == null)
                {
                    var fonts = Resources.FindObjectsOfTypeAll<TMP_FontAsset>();
                    if (fonts != null && fonts.Length > 0) _tmpFont = fonts[0];
                }
            }
        }

        public static GameObject CreateUIRoot()
        {
            EnsureFonts();
            GameObject root = new GameObject("UISystem");
            CanvasScaler cs = root.AddComponent<CanvasScaler>();
            cs.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            cs.referenceResolution = new Vector2(1920, 1080);
            cs.matchWidthOrHeight = 0.5f;
            Canvas canvas = root.GetComponent<Canvas>();
            if (canvas == null) canvas = root.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            GraphicRaycaster gr = root.GetComponent<GraphicRaycaster>();
            if (gr == null) root.AddComponent<GraphicRaycaster>();
            if (root.GetComponent<UIStateController>() == null) root.AddComponent<UIStateController>();
            return root;
        }

        public static RectTransform AddPanel(Transform parent, string name, Vector2 anchorMin, Vector2 anchorMax, Vector2 offsetMin, Vector2 offsetMax, Color? bg = null)
        {
            GameObject go = new GameObject(name, typeof(RectTransform), typeof(Image));
            go.transform.SetParent(parent, false);
            RectTransform rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin; rt.anchorMax = anchorMax;
            rt.offsetMin = offsetMin; rt.offsetMax = offsetMax;
            Image img = go.GetComponent<Image>();
            img.color = bg ?? new Color(0, 0, 0, 0.75f);
            return rt;
        }

        public static TextMeshProUGUI AddText(Transform parent, string name, string text, Vector2 anchorMin, Vector2 anchorMax,
            Vector2 offsetMin, Vector2 offsetMax, int fontSize = 24, TextAlignmentOptions align = TextAlignmentOptions.Center, Color? color = null)
        {
            EnsureFonts();
            GameObject go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            RectTransform rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin; rt.anchorMax = anchorMax;
            rt.offsetMin = offsetMin; rt.offsetMax = offsetMax;
            TextMeshProUGUI txt = go.AddComponent<TextMeshProUGUI>();
            txt.text = text;
            txt.fontSize = fontSize;
            txt.alignment = align;
            txt.color = color ?? Color.white;
            if (_tmpFont != null) txt.font = _tmpFont;
            txt.enableWordWrapping = true;
            return txt;
        }

        public static Image AddImage(Transform parent, string name, Sprite sprite, Vector2 anchorMin, Vector2 anchorMax,
            Vector2 offsetMin, Vector2 offsetMax, Color? color = null)
        {
            GameObject go = new GameObject(name, typeof(RectTransform), typeof(Image));
            go.transform.SetParent(parent, false);
            RectTransform rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin; rt.anchorMax = anchorMax;
            rt.offsetMin = offsetMin; rt.offsetMax = offsetMax;
            Image img = go.GetComponent<Image>();
            if (sprite != null) img.sprite = sprite;
            if (color.HasValue) img.color = color.Value;
            return img;
        }

        public static Button AddButton(Transform parent, string name, string label, Vector2 anchorMin, Vector2 anchorMax,
            Vector2 offsetMin, Vector2 offsetMax, Color? normalColor = null, int fontSize = 22)
        {
            GameObject go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Button));
            go.transform.SetParent(parent, false);
            RectTransform rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin; rt.anchorMax = anchorMax;
            rt.offsetMin = offsetMin; rt.offsetMax = offsetMax;
            Image img = go.GetComponent<Image>();
            Color c = normalColor ?? new Color(0.2f, 0.5f, 0.9f);
            img.color = c;
            SpriteState ss = new SpriteState();
            ColorBlock cb = go.GetComponent<Button>().colors;
            cb.normalColor = c;
            cb.highlightedColor = new Color(c.r * 1.2f, c.g * 1.2f, c.b * 1.2f);
            cb.pressedColor = new Color(c.r * 0.7f, c.g * 0.7f, c.b * 0.7f);
            cb.selectedColor = cb.highlightedColor;
            go.GetComponent<Button>().colors = cb;

            AddText(rt, "Label", label, new Vector2(0, 0), new Vector2(1, 1),
                new Vector2(5, 5), new Vector2(-5, -5), fontSize, TextAlignmentOptions.Center, Color.white);
            return go.GetComponent<Button>();
        }

        public static Slider AddSlider(Transform parent, string name, Vector2 anchorMin, Vector2 anchorMax,
            Vector2 offsetMin, Vector2 offsetMax, float min, float max, float value)
        {
            GameObject go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            RectTransform rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin; rt.anchorMax = anchorMax;
            rt.offsetMin = offsetMin; rt.offsetMax = offsetMax;

            GameObject bg = new GameObject("Background", typeof(RectTransform), typeof(Image));
            bg.transform.SetParent(rt, false);
            ((RectTransform)bg.transform).anchorMin = new Vector2(0, 0.25f);
            ((RectTransform)bg.transform).anchorMax = new Vector2(1, 0.75f);
            ((RectTransform)bg.transform).offsetMin = Vector2.zero;
            ((RectTransform)bg.transform).offsetMax = Vector2.zero;
            bg.GetComponent<Image>().color = new Color(0.2f, 0.2f, 0.2f);

            GameObject fillArea = new GameObject("Fill Area", typeof(RectTransform));
            fillArea.transform.SetParent(rt, false);
            RectTransform faRt = (RectTransform)fillArea.transform;
            faRt.anchorMin = new Vector2(0, 0.25f);
            faRt.anchorMax = new Vector2(1, 0.75f);
            faRt.offsetMin = new Vector2(5, 0);
            faRt.offsetMax = new Vector2(-20, 0);

            GameObject fill = new GameObject("Fill", typeof(RectTransform), typeof(Image));
            fill.transform.SetParent(faRt.transform, false);
            ((RectTransform)fill.transform).anchorMin = new Vector2(0, 0);
            ((RectTransform)fill.transform).anchorMax = new Vector2(1, 1);
            ((RectTransform)fill.transform).offsetMin = Vector2.zero;
            ((RectTransform)fill.transform).offsetMax = Vector2.zero;
            fill.GetComponent<Image>().color = new Color(0.2f, 0.7f, 0.3f);

            GameObject handleArea = new GameObject("Handle Slide Area", typeof(RectTransform));
            handleArea.transform.SetParent(rt, false);
            RectTransform haRt = (RectTransform)handleArea.transform;
            haRt.anchorMin = new Vector2(0, 0);
            haRt.anchorMax = new Vector2(1, 1);
            haRt.offsetMin = new Vector2(15, 0);
            haRt.offsetMax = new Vector2(-15, 0);

            GameObject handle = new GameObject("Handle", typeof(RectTransform), typeof(Image));
            handle.transform.SetParent(haRt.transform, false);
            ((RectTransform)handle.transform).anchorMin = new Vector2(0.5f, 0);
            ((RectTransform)handle.transform).anchorMax = new Vector2(0.5f, 1);
            ((RectTransform)handle.transform).sizeDelta = new Vector2(20, 0);
            handle.GetComponent<Image>().color = new Color(0.9f, 0.9f, 0.9f);

            Slider slider = go.AddComponent<Slider>();
            slider.fillRect = (RectTransform)fill.transform;
            slider.handleRect = (RectTransform)handle.transform;
            slider.targetGraphic = handle.GetComponent<Image>();
            slider.minValue = min;
            slider.maxValue = max;
            slider.value = value;
            slider.direction = Slider.Direction.LeftToRight;
            return slider;
        }

        public static Toggle AddToggle(Transform parent, string name, Vector2 anchorMin, Vector2 anchorMax,
            Vector2 offsetMin, Vector2 offsetMax, bool defaultValue)
        {
            GameObject go = new GameObject(name, typeof(RectTransform), typeof(Toggle));
            go.transform.SetParent(parent, false);
            RectTransform rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin; rt.anchorMax = anchorMax;
            rt.offsetMin = offsetMin; rt.offsetMax = offsetMax;

            GameObject bg = new GameObject("Background", typeof(RectTransform), typeof(Image));
            bg.transform.SetParent(rt, false);
            RectTransform bgRt = (RectTransform)bg.transform;
            bgRt.anchorMin = new Vector2(0, 0);
            bgRt.anchorMax = new Vector2(0, 1);
            bgRt.sizeDelta = new Vector2(30, 0);
            bg.GetComponent<Image>().color = Color.white;

            GameObject checkmark = new GameObject("Checkmark", typeof(RectTransform), typeof(Image));
            checkmark.transform.SetParent(bg.transform, false);
            RectTransform cmRt = (RectTransform)checkmark.transform;
            cmRt.anchorMin = new Vector2(0.15f, 0.15f);
            cmRt.anchorMax = new Vector2(0.85f, 0.85f);
            cmRt.offsetMin = Vector2.zero;
            cmRt.offsetMax = Vector2.zero;
            checkmark.GetComponent<Image>().color = new Color(0.2f, 0.6f, 0.2f);

            Toggle toggle = go.GetComponent<Toggle>();
            toggle.graphic = checkmark.GetComponent<Image>();
            toggle.isOn = defaultValue;
            ColorBlock cb = toggle.colors;
            cb.normalColor = Color.white;
            toggle.colors = cb;

            AddText(rt, "Label", name, new Vector2(0, 0), new Vector2(1, 1),
                new Vector2(40, 2), new Vector2(-5, -2), 18, TextAlignmentOptions.MidlineLeft, Color.white);
            return toggle;
        }

        public static TMP_Dropdown AddDropdown(Transform parent, string name, Vector2 anchorMin, Vector2 anchorMax,
            Vector2 offsetMin, Vector2 offsetMax, List<string> options, int defaultValue = 0)
        {
            GameObject go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            RectTransform rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin; rt.anchorMax = anchorMax;
            rt.offsetMin = offsetMin; rt.offsetMax = offsetMax;

            TMP_Dropdown dd = go.AddComponent<TMP_Dropdown>();
            Image templateBg = go.AddComponent<Image>();
            templateBg.color = new Color(0.15f, 0.15f, 0.15f);
            dd.targetGraphic = templateBg;

            GameObject label = new GameObject("Label", typeof(RectTransform));
            label.transform.SetParent(rt, false);
            RectTransform lblRt = (RectTransform)label.transform;
            lblRt.anchorMin = new Vector2(0, 0); lblRt.anchorMax = new Vector2(1, 1);
            lblRt.offsetMin = new Vector2(10, 4); lblRt.offsetMax = new Vector2(-30, -4);
            TextMeshProUGUI lblTxt = label.AddComponent<TextMeshProUGUI>();
            lblTxt.text = options.Count > 0 ? options[Mathf.Clamp(defaultValue, 0, options.Count - 1)] : "";
            lblTxt.alignment = TextAlignmentOptions.MidlineLeft;
            lblTxt.color = Color.white;
            lblTxt.fontSize = 18;
            if (_tmpFont != null) lblTxt.font = _tmpFont;
            dd.captionText = lblTxt;

            GameObject template = new GameObject("Template", typeof(RectTransform), typeof(Image));
            template.transform.SetParent(rt, false);
            RectTemplate(template);
            dd.template = (RectTransform)template.transform;

            dd.AddOptions(options);
            dd.value = defaultValue;
            return dd;
        }

        private static void RectTemplate(GameObject template)
        {
            RectTransform rt = (RectTransform)template.transform;
            rt.anchorMin = new Vector2(0, 0);
            rt.anchorMax = new Vector2(1, 0);
            rt.pivot = new Vector2(0.5f, 1);
            rt.sizeDelta = new Vector2(0, 150);
            template.GetComponent<Image>().color = new Color(0.1f, 0.1f, 0.1f, 0.95f);

            GameObject viewport = new GameObject("Viewport", typeof(RectTransform), typeof(Mask), typeof(Image));
            viewport.transform.SetParent(rt, false);
            ((RectTransform)viewport.transform).anchorMin = Vector2.zero;
            ((RectTransform)viewport.transform).anchorMax = Vector2.one;
            ((RectTransform)viewport.transform).offsetMin = Vector2.zero;
            ((RectTransform)viewport.transform).offsetMax = Vector2.zero;
            viewport.GetComponent<Image>().color = Color.clear;
            viewport.GetComponent<Mask>().showMaskGraphic = false;

            GameObject content = new GameObject("Content", typeof(RectTransform));
            content.transform.SetParent(viewport.transform, false);
            RectTransform crt = (RectTransform)content.transform;
            crt.anchorMin = new Vector2(0, 1); crt.anchorMax = new Vector2(1, 1);
            crt.pivot = new Vector2(0.5f, 1); crt.sizeDelta = new Vector2(0, 300);
        }
    }

    public class UIStateController : MonoBehaviour
    {
        public MainMenuController MainMenu { get; private set; }
        public HUDController HUD { get; private set; }
        public TutorialController Tutorial { get; private set; }
        public PauseMenuController PauseMenu { get; private set; }
        public SettingsMenuController SettingsMenu { get; private set; }
        public ResultScreenController ResultScreen { get; private set; }
        public PerformanceOverlay PerfOverlay { get; private set; }
    }
}
