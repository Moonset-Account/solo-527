using BeatRunner.Resources;
using UnityEngine;
using UnityEngine.UI;

namespace BeatRunner.SceneBuild
{
    public static class UIFactory
    {
        public static readonly Color PanelBg = new Color(0.05f, 0.07f, 0.12f, 0.95f);
        public static readonly Color AccentBlue = new Color(0.3f, 0.6f, 1f, 1f);
        public static readonly Color AccentCyan = new Color(0.3f, 0.9f, 1f, 1f);
        public static readonly Color AccentPink = new Color(1f, 0.4f, 0.7f, 1f);
        public static readonly Color TextWhite = Color.white;
        public static readonly Color TextMuted = new Color(0.75f, 0.8f, 0.9f, 1f);
        public static readonly Color ButtonNormal = new Color(0.15f, 0.2f, 0.3f, 1f);
        public static readonly Color ButtonHighlight = new Color(0.25f, 0.4f, 0.65f, 1f);
        public static readonly Color ButtonPressed = new Color(0.1f, 0.15f, 0.25f, 1f);

        public static Sprite White => RuntimeContentLoader.GetWhiteSprite();
        public static Font DefaultFont => RuntimeContentLoader.GetDefaultFont();

        public static GameObject MakePanel(string name, Transform parent, Color bg, Vector2 anchorMin, Vector2 anchorMax)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(CanvasRenderer));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var img = go.GetComponent<Image>();
            img.sprite = White;
            img.color = bg;
            return go;
        }

        public static Text MakeText(string name, Transform parent, string value, int size, Color color,
            TextAnchor anchor = TextAnchor.MiddleCenter, bool rich = true, FontStyle style = FontStyle.Normal)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Text), typeof(CanvasRenderer));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var t = go.GetComponent<Text>();
            t.font = DefaultFont;
            t.fontSize = size;
            t.fontStyle = style;
            t.alignment = anchor;
            t.color = color;
            t.supportRichText = rich;
            t.horizontalOverflow = HorizontalWrapMode.Overflow;
            t.verticalOverflow = VerticalWrapMode.Overflow;
            t.text = value;
            return t;
        }

        public static Button MakeButton(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax,
            string label, int fontSize, out Text labelText, Color? bg = null)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Button), typeof(CanvasRenderer));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            var img = go.GetComponent<Image>();
            img.sprite = White;
            img.color = bg ?? ButtonNormal;
            img.type = Image.Type.Sliced;

            var btn = go.GetComponent<Button>();
            var colors = btn.colors;
            colors.normalColor = Color.white;
            colors.highlightedColor = new Color(1.1f, 1.1f, 1.1f, 1f);
            colors.pressedColor = new Color(0.85f, 0.85f, 0.9f, 1f);
            colors.colorMultiplier = 1f;
            btn.colors = colors;
            btn.targetGraphic = img;

            labelText = MakeText("Label", go.transform, label, fontSize, TextWhite);
            return btn;
        }

        public static Slider MakeSlider(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax,
            float min, float max, float val, out Text valueText)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Slider), typeof(CanvasRenderer));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            var bgGo = new GameObject("Background", typeof(RectTransform), typeof(Image));
            bgGo.transform.SetParent(go.transform, false);
            var bgRt = (RectTransform)bgGo.transform;
            bgRt.anchorMin = new Vector2(0, 0.35f);
            bgRt.anchorMax = new Vector2(1, 0.65f);
            bgRt.offsetMin = Vector2.zero;
            bgRt.offsetMax = Vector2.zero;
            var bgImg = bgGo.GetComponent<Image>();
            bgImg.sprite = White;
            bgImg.color = new Color(0.15f, 0.18f, 0.25f, 1f);

            var fillArea = new GameObject("Fill Area", typeof(RectTransform));
            fillArea.transform.SetParent(go.transform, false);
            var faRt = (RectTransform)fillArea.transform;
            faRt.anchorMin = new Vector2(0, 0.35f);
            faRt.anchorMax = new Vector2(1, 0.65f);
            faRt.offsetMin = new Vector2(5, 0);
            faRt.offsetMax = new Vector2(-5, 0);

            var fillGo = new GameObject("Fill", typeof(RectTransform), typeof(Image));
            fillGo.transform.SetParent(fillArea.transform, false);
            var fillRt = (RectTransform)fillGo.transform;
            fillRt.anchorMin = Vector2.zero;
            fillRt.anchorMax = Vector2.one;
            fillRt.offsetMin = Vector2.zero;
            fillRt.offsetMax = Vector2.zero;
            var fillImg = fillGo.GetComponent<Image>();
            fillImg.sprite = White;
            fillImg.color = AccentBlue;

            var handleArea = new GameObject("Handle Slide Area", typeof(RectTransform));
            handleArea.transform.SetParent(go.transform, false);
            var haRt = (RectTransform)handleArea.transform;
            haRt.anchorMin = Vector2.zero;
            haRt.anchorMax = Vector2.one;
            haRt.offsetMin = new Vector2(15, -5);
            haRt.offsetMax = new Vector2(-15, 5);

            var handleGo = new GameObject("Handle", typeof(RectTransform), typeof(Image));
            handleGo.transform.SetParent(handleArea.transform, false);
            var hRt = (RectTransform)handleGo.transform;
            hRt.anchorMin = new Vector2(0, 0);
            hRt.anchorMax = new Vector2(0, 1);
            hRt.sizeDelta = new Vector2(24, 0);
            var hImg = handleGo.GetComponent<Image>();
            hImg.sprite = White;
            hImg.color = Color.white;

            var slider = go.GetComponent<Slider>();
            slider.fillRect = fillRt;
            slider.handleRect = hRt;
            slider.targetGraphic = hImg;
            slider.minValue = min;
            slider.maxValue = max;
            slider.value = val;
            slider.direction = Slider.Direction.LeftToRight;

            var valGo = new GameObject("Value", typeof(RectTransform));
            valGo.transform.SetParent(go.transform, false);
            var valRt = (RectTransform)valGo.transform;
            valRt.anchorMin = new Vector2(0, 1f);
            valRt.anchorMax = new Vector2(1, 1.6f);
            valRt.offsetMin = Vector2.zero;
            valRt.offsetMax = Vector2.zero;
            valueText = MakeText("valText", valGo.transform, val.ToString(), 16, TextWhite, TextAnchor.MiddleRight);

            return slider;
        }

        public static Toggle MakeToggle(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax,
            string label, bool on, out Text labelText)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(LayoutElement));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var le = go.GetComponent<LayoutElement>();
            le.minHeight = 28;

            var toggleGo = new GameObject("Toggle", typeof(RectTransform), typeof(Image), typeof(Toggle));
            toggleGo.transform.SetParent(go.transform, false);
            var tRt = (RectTransform)toggleGo.transform;
            tRt.anchorMin = new Vector2(0, 0);
            tRt.anchorMax = new Vector2(0, 1);
            tRt.pivot = new Vector2(0, 0.5f);
            tRt.sizeDelta = new Vector2(28, 0);
            var tImg = toggleGo.GetComponent<Image>();
            tImg.sprite = White;
            tImg.color = ButtonNormal;
            var toggle = toggleGo.GetComponent<Toggle>();
            toggle.targetGraphic = tImg;
            toggle.isOn = on;

            var chkGo = new GameObject("Checkmark", typeof(RectTransform), typeof(Image));
            chkGo.transform.SetParent(toggleGo.transform, false);
            var cRt = (RectTransform)chkGo.transform;
            cRt.anchorMin = new Vector2(0.2f, 0.2f);
            cRt.anchorMax = new Vector2(0.8f, 0.8f);
            cRt.offsetMin = Vector2.zero;
            cRt.offsetMax = Vector2.zero;
            var cImg = chkGo.GetComponent<Image>();
            cImg.sprite = White;
            cImg.color = AccentCyan;
            toggle.graphic = cImg;

            var lblGo = new GameObject("Label", typeof(RectTransform));
            lblGo.transform.SetParent(go.transform, false);
            var lblRt = (RectTransform)lblGo.transform;
            lblRt.anchorMin = new Vector2(0.05f, 0);
            lblRt.anchorMax = new Vector2(1, 1);
            lblRt.offsetMin = new Vector2(28, 0);
            lblRt.offsetMax = Vector2.zero;
            labelText = MakeText("labelTxt", lblGo.transform, label, 18, TextWhite, TextAnchor.MiddleLeft);

            return toggle;
        }

        public static Image MakeImage(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax, Color color)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var img = go.GetComponent<Image>();
            img.sprite = White;
            img.color = color;
            return img;
        }

        public static ScrollRect MakeScrollList(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax,
            out RectTransform contentRt, Color bgColor = default)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(ScrollRect), typeof(Mask));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var img = go.GetComponent<Image>();
            img.sprite = White;
            img.color = bgColor == default ? new Color(0.08f, 0.1f, 0.16f, 1f) : bgColor;
            var mask = go.GetComponent<Mask>();
            mask.showMaskGraphic = true;

            var viewport = new GameObject("Viewport", typeof(RectTransform), typeof(RectMask2D));
            viewport.transform.SetParent(go.transform, false);
            var vRt = (RectTransform)viewport.transform;
            vRt.anchorMin = Vector2.zero;
            vRt.anchorMax = Vector2.one;
            vRt.offsetMin = Vector2.zero;
            vRt.offsetMax = Vector2.zero;
            vRt.pivot = new Vector2(0, 1);

            var content = new GameObject("Content", typeof(RectTransform), typeof(VerticalLayoutGroup), typeof(ContentSizeFitter));
            content.transform.SetParent(viewport.transform, false);
            contentRt = (RectTransform)content.transform;
            contentRt.anchorMin = new Vector2(0, 1);
            contentRt.anchorMax = new Vector2(1, 1);
            contentRt.pivot = new Vector2(0.5f, 1);
            contentRt.sizeDelta = new Vector2(0, 0);
            var vlg = content.GetComponent<VerticalLayoutGroup>();
            vlg.spacing = 8;
            vlg.padding = new RectOffset(8, 8, 8, 8);
            vlg.childForceExpandWidth = true;
            vlg.childForceExpandHeight = false;
            vlg.childControlHeight = true;
            vlg.childControlWidth = true;
            var csf = content.GetComponent<ContentSizeFitter>();
            csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            var sr = go.GetComponent<ScrollRect>();
            sr.viewport = vRt;
            sr.content = contentRt;
            sr.horizontal = false;
            sr.vertical = true;
            sr.scrollSensitivity = 30;
            sr.verticalScrollbarVisibility = ScrollRect.ScrollbarVisibility.AutoHideAndExpandViewport;
            return sr;
        }

        public static RectTransform MakeRow(Transform parent, float preferredHeight = 64)
        {
            var go = new GameObject("Row", typeof(RectTransform), typeof(LayoutElement));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = new Vector2(0.5f, 0.5f);
            rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(-16, preferredHeight);
            var le = go.GetComponent<LayoutElement>();
            le.minHeight = preferredHeight;
            le.preferredHeight = preferredHeight;
            return rt;
        }

        public static Dropdown MakeDropdown(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax,
            out Text labelText)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Dropdown));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var img = go.GetComponent<Image>();
            img.sprite = White;
            img.color = ButtonNormal;
            var dd = go.GetComponent<Dropdown>();
            dd.targetGraphic = img;

            var lblGo = new GameObject("Label", typeof(RectTransform));
            lblGo.transform.SetParent(go.transform, false);
            var lrt = (RectTransform)lblGo.transform;
            lrt.anchorMin = new Vector2(0.1f, 0.1f);
            lrt.anchorMax = new Vector2(0.75f, 0.9f);
            lrt.offsetMin = Vector2.zero;
            lrt.offsetMax = Vector2.zero;
            labelText = MakeText("Lbl", lblGo.transform, "", 16, TextWhite, TextAnchor.MiddleLeft);
            dd.captionText = labelText;

            var itemTextGo = new GameObject("ItemLabel", typeof(RectTransform));
            itemTextGo.SetActive(false);
            var itemLbl = MakeText("Txt", itemTextGo.transform, "", 14, Color.black, TextAnchor.MiddleLeft);
            dd.itemText = itemLbl;

            return dd;
        }

        public static Animator MakeFadeAnimator(GameObject target)
        {
            var animator = target.AddComponent<Animator>();
            return animator;
        }

        public static Slider InternalMakeSlider(Transform parent, out GameObject sliderGo,
            out Image fill, out Image handle)
        {
            var go = new GameObject("Slider", typeof(RectTransform), typeof(Slider), typeof(CanvasRenderer));
            go.transform.SetParent(parent, false);
            sliderGo = go;
            var rt = (RectTransform)go.transform;
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            var bgGo = new GameObject("Background", typeof(RectTransform), typeof(Image));
            bgGo.transform.SetParent(go.transform, false);
            var bgRt = (RectTransform)bgGo.transform;
            bgRt.anchorMin = new Vector2(0, 0.35f);
            bgRt.anchorMax = new Vector2(1, 0.65f);
            bgRt.offsetMin = Vector2.zero;
            bgRt.offsetMax = Vector2.zero;
            var bgImg = bgGo.GetComponent<Image>();
            bgImg.sprite = White;
            bgImg.color = new Color(0.15f, 0.18f, 0.25f, 1f);

            var fillArea = new GameObject("Fill Area", typeof(RectTransform));
            fillArea.transform.SetParent(go.transform, false);
            var faRt = (RectTransform)fillArea.transform;
            faRt.anchorMin = new Vector2(0, 0.35f);
            faRt.anchorMax = new Vector2(1, 0.65f);
            faRt.offsetMin = new Vector2(5, 0);
            faRt.offsetMax = new Vector2(-5, 0);

            var fillGo = new GameObject("Fill", typeof(RectTransform), typeof(Image));
            fillGo.transform.SetParent(fillArea.transform, false);
            var fillRt = (RectTransform)fillGo.transform;
            fillRt.anchorMin = Vector2.zero;
            fillRt.anchorMax = Vector2.one;
            fillRt.offsetMin = Vector2.zero;
            fillRt.offsetMax = Vector2.zero;
            fill = fillGo.GetComponent<Image>();
            fill.sprite = White;
            fill.color = AccentBlue;

            var handleArea = new GameObject("Handle Slide Area", typeof(RectTransform));
            handleArea.transform.SetParent(go.transform, false);
            var haRt = (RectTransform)handleArea.transform;
            haRt.anchorMin = Vector2.zero;
            haRt.anchorMax = Vector2.one;
            haRt.offsetMin = new Vector2(15, -5);
            haRt.offsetMax = new Vector2(-15, 5);

            var handleGo = new GameObject("Handle", typeof(RectTransform), typeof(Image));
            handleGo.transform.SetParent(handleArea.transform, false);
            var hRt = (RectTransform)handleGo.transform;
            hRt.anchorMin = new Vector2(0, 0);
            hRt.anchorMax = new Vector2(0, 1);
            hRt.sizeDelta = new Vector2(24, 0);
            handle = handleGo.GetComponent<Image>();
            handle.sprite = White;
            handle.color = Color.white;

            var slider = go.GetComponent<Slider>();
            slider.fillRect = fillRt;
            slider.handleRect = hRt;
            slider.targetGraphic = handle;
            slider.direction = Slider.Direction.LeftToRight;
            return slider;
        }

        public static Toggle MakeToggle(string name, Transform parent,
            Vector2 anchorMin, Vector2 anchorMax, bool on)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Toggle));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var tImg = go.GetComponent<Image>();
            tImg.sprite = White;
            tImg.color = ButtonNormal;
            var toggle = go.GetComponent<Toggle>();
            toggle.targetGraphic = tImg;
            toggle.isOn = on;

            var chkGo = new GameObject("Checkmark", typeof(RectTransform), typeof(Image));
            chkGo.transform.SetParent(go.transform, false);
            var cRt = (RectTransform)chkGo.transform;
            cRt.anchorMin = new Vector2(0.15f, 0.15f);
            cRt.anchorMax = new Vector2(0.85f, 0.85f);
            cRt.offsetMin = Vector2.zero;
            cRt.offsetMax = Vector2.zero;
            var cImg = chkGo.GetComponent<Image>();
            cImg.sprite = White;
            cImg.color = AccentCyan;
            toggle.graphic = cImg;
            return toggle;
        }

        public static Dropdown MakeDropdown(string name, Transform parent,
            Vector2 anchorMin, Vector2 anchorMax, System.Collections.Generic.List<string> options)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Dropdown));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var img = go.GetComponent<Image>();
            img.sprite = White;
            img.color = ButtonNormal;
            var dd = go.GetComponent<Dropdown>();
            dd.targetGraphic = img;

            var lblGo = new GameObject("Label", typeof(RectTransform));
            lblGo.transform.SetParent(go.transform, false);
            var lrt = (RectTransform)lblGo.transform;
            lrt.anchorMin = new Vector2(0.1f, 0.1f);
            lrt.anchorMax = new Vector2(0.80f, 0.9f);
            lrt.offsetMin = Vector2.zero;
            lrt.offsetMax = Vector2.zero;
            var caption = MakeText("Lbl", lblGo.transform, "", 16, TextWhite, TextAnchor.MiddleLeft);
            dd.captionText = caption;

            var arrow = MakeText("Arrow", go.transform, "▼", 14, TextWhite, TextAnchor.MiddleRight);
            var art = arrow.rectTransform;
            art.anchorMin = new Vector2(0.82f, 0.1f);
            art.anchorMax = new Vector2(0.95f, 0.9f);
            art.offsetMin = Vector2.zero;
            art.offsetMax = Vector2.zero;

            var itemTextGo = new GameObject("ItemLabel", typeof(RectTransform));
            itemTextGo.SetActive(false);
            var itemLbl = MakeText("Txt", itemTextGo.transform, "", 14, Color.black, TextAnchor.MiddleLeft);
            dd.itemText = itemLbl;

            if (options != null && options.Count > 0)
            {
                dd.ClearOptions();
                dd.AddOptions(options);
            }
            return dd;
        }

        public static RectTransform MakeRow(Transform parent, float yMin,
            out RectTransform rowT, out LayoutElement layout)
        {
            var go = new GameObject("Row", typeof(RectTransform), typeof(LayoutElement));
            go.transform.SetParent(parent, false);
            rowT = (RectTransform)go.transform;
            rowT.anchorMin = new Vector2(0, yMin);
            rowT.anchorMax = new Vector2(1, yMin + 0.12f);
            rowT.offsetMin = Vector2.zero;
            rowT.offsetMax = Vector2.zero;
            layout = go.GetComponent<LayoutElement>();
            return rowT;
        }
    }
}
