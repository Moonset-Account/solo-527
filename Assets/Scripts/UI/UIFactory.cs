using UnityEngine;
using UnityEngine.UI;
using TMPro;

public static class UIFactory
{
    private static readonly Color PanelBg = new Color(0.12f, 0.18f, 0.28f, 0.92f);
    private static readonly Color BtnNormal = new Color(0.2f, 0.35f, 0.55f, 1f);
    private static readonly Color BtnHover = new Color(0.3f, 0.45f, 0.65f, 1f);
    private static readonly Color BarBg = new Color(0.15f, 0.15f, 0.15f, 1f);

    public static GameObject CreatePanel(Transform parent, string name, bool fullRect = true)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        var img = go.AddComponent<Image>();
        img.color = PanelBg;
        var rt = go.GetComponent<RectTransform>();
        if (fullRect)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.sizeDelta = Vector2.zero;
        }
        return go;
    }

    public static Button CreateButton(Transform parent, string name, string label, float w = 280f, float h = 56f)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        var rt = go.AddComponent<RectTransform>();
        rt.sizeDelta = new Vector2(w, h);

        var img = go.AddComponent<Image>();
        img.color = BtnNormal;
        var btn = go.AddComponent<Button>();

        var colors = btn.colors;
        colors.highlightedColor = BtnHover;
        colors.pressedColor = new Color(0.15f, 0.25f, 0.4f, 1f);
        btn.colors = colors;

        var txt = CreateLabel(go.transform, "Label", label, 22, Color.white);
        var txtRt = txt.GetComponent<RectTransform>();
        txtRt.anchorMin = Vector2.zero;
        txtRt.anchorMax = Vector2.one;
        txtRt.sizeDelta = Vector2.zero;

        return btn;
    }

    public static Button CreateSmallButton(Transform parent, string name, string label, float w = 120f, float h = 40f)
    {
        return CreateButton(parent, name, label, w, h);
    }

    public static TMP_Text CreateLabel(Transform parent, string name, string text, int size, Color color)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        var tmp = go.AddComponent<TextMeshProUGUI>();
        tmp.text = text;
        tmp.fontSize = size;
        tmp.color = color;
        tmp.alignment = TextAlignmentOptions.Center;
        return tmp;
    }

    public static Image CreateBar(Transform parent, string name, Color fillColor, float w = 200f, float h = 24f)
    {
        var bg = new GameObject(name + "_Bg");
        bg.transform.SetParent(parent, false);
        var bgRt = bg.AddComponent<RectTransform>();
        bgRt.sizeDelta = new Vector2(w, h);
        var bgImg = bg.AddComponent<Image>();
        bgImg.color = BarBg;
        bgImg.type = Image.Type.Filled;
        bgImg.fillMethod = Image.FillMethod.Horizontal;

        var fill = new GameObject(name);
        fill.transform.SetParent(bg.transform, false);
        var fillRt = fill.AddComponent<RectTransform>();
        fillRt.anchorMin = Vector2.zero;
        fillRt.anchorMax = Vector2.one;
        fillRt.sizeDelta = Vector2.zero;
        var fillImg = fill.AddComponent<Image>();
        fillImg.color = fillColor;
        fillImg.type = Image.Type.Filled;
        fillImg.fillMethod = Image.FillMethod.Horizontal;

        return fillImg;
    }

    public static Slider CreateSlider(Transform parent, string name, float w = 300f, float h = 20f)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        var rt = go.AddComponent<RectTransform>();
        rt.sizeDelta = new Vector2(w, h);

        var bg = new GameObject("Background");
        bg.transform.SetParent(go.transform, false);
        var bgRt = bg.AddComponent<RectTransform>();
        bgRt.anchorMin = Vector2.zero;
        bgRt.anchorMax = Vector2.one;
        bgRt.sizeDelta = Vector2.zero;
        var bgImg = bg.AddComponent<Image>();
        bgImg.color = BarBg;

        var fillArea = new GameObject("Fill Area");
        fillArea.transform.SetParent(go.transform, false);
        var fillAreaRt = fillArea.AddComponent<RectTransform>();
        fillAreaRt.anchorMin = Vector2.zero;
        fillAreaRt.anchorMax = Vector2.one;
        fillAreaRt.sizeDelta = Vector2.zero;

        var fill = new GameObject("Fill");
        fill.transform.SetParent(fillArea.transform, false);
        var fillRt = fill.AddComponent<RectTransform>();
        fillRt.anchorMin = Vector2.zero;
        fillRt.anchorMax = new Vector2(1f, 1f);
        fillRt.sizeDelta = Vector2.zero;
        var fillImg = fill.AddComponent<Image>();
        fillImg.color = new Color(0.3f, 0.7f, 0.4f, 1f);

        var handleArea = new GameObject("Handle Slide Area");
        handleArea.transform.SetParent(go.transform, false);
        var handleAreaRt = handleArea.AddComponent<RectTransform>();
        handleAreaRt.anchorMin = Vector2.zero;
        handleAreaRt.anchorMax = Vector2.one;
        handleAreaRt.sizeDelta = Vector2.zero;

        var handle = new GameObject("Handle");
        handle.transform.SetParent(handleArea.transform, false);
        var handleRt = handle.AddComponent<RectTransform>();
        handleRt.sizeDelta = new Vector2(20f, 20f);
        var handleImg = handle.AddComponent<Image>();
        handleImg.color = Color.white;

        var slider = go.AddComponent<Slider>();
        slider.targetGraphic = handleImg;
        slider.fillRect = fillRt;
        slider.handleRect = handleRt;
        slider.minValue = 0f;
        slider.maxValue = 1f;
        slider.value = 1f;

        return slider;
    }

    public static Toggle CreateToggle(Transform parent, string name, string label)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        var rt = go.AddComponent<RectTransform>();
        rt.sizeDelta = new Vector2(300f, 40f);

        var bg = new GameObject("Background");
        bg.transform.SetParent(go.transform, false);
        var bgRt = bg.AddComponent<RectTransform>();
        bgRt.anchorMin = new Vector2(0f, 0.5f);
        bgRt.anchorMax = new Vector2(0f, 0.5f);
        bgRt.pivot = new Vector2(0.5f, 0.5f);
        bgRt.sizeDelta = new Vector2(30f, 30f);
        bgRt.anchoredPosition = new Vector2(15f, 0f);
        var bgImg = bg.AddComponent<Image>();
        bgImg.color = Color.white;

        var check = new GameObject("Checkmark");
        check.transform.SetParent(bg.transform, false);
        var checkRt = check.AddComponent<RectTransform>();
        checkRt.anchorMin = Vector2.zero;
        checkRt.anchorMax = Vector2.one;
        checkRt.sizeDelta = Vector2.zero;
        var checkImg = check.AddComponent<Image>();
        checkImg.color = Color.green;

        var labelGo = new GameObject("Label");
        labelGo.transform.SetParent(go.transform, false);
        var labelRt = labelGo.AddComponent<RectTransform>();
        labelRt.anchorMin = new Vector2(0f, 0f);
        labelRt.anchorMax = new Vector2(1f, 0f);
        labelRt.pivot = new Vector2(0f, 0.5f);
        labelRt.sizeDelta = new Vector2(-50f, 0f);
        labelRt.anchoredPosition = new Vector2(40f, 0f);
        var tmp = labelGo.AddComponent<TextMeshProUGUI>();
        tmp.text = label;
        tmp.fontSize = 18;
        tmp.color = Color.white;
        tmp.alignment = TextAlignmentOptions.Left;

        var toggle = go.AddComponent<Toggle>();
        toggle.targetGraphic = bgImg;
        toggle.graphic = checkImg;
        toggle.isOn = true;

        return toggle;
    }

    public static TMP_Dropdown CreateDropdown(Transform parent, string name, string[] options, float w = 250f, float h = 40f)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        var rt = go.AddComponent<RectTransform>();
        rt.sizeDelta = new Vector2(w, h);

        var tmpDrop = go.AddComponent<TMP_Dropdown>();

        var labelGo = new GameObject("Label");
        labelGo.transform.SetParent(go.transform, false);
        var labelRt = labelGo.AddComponent<RectTransform>();
        labelRt.anchorMin = Vector2.zero;
        labelRt.anchorMax = Vector2.one;
        labelRt.sizeDelta = Vector2.zero;
        labelRt.offsetMin = new Vector2(10f, 6f);
        labelRt.offsetMax = new Vector2(-30f, -6f);
        var tmpLabel = labelGo.AddComponent<TextMeshProUGUI>();
        tmpLabel.fontSize = 18;
        tmpLabel.color = Color.white;
        tmpLabel.alignment = TextAlignmentOptions.Left;

        var arrow = new GameObject("Arrow");
        arrow.transform.SetParent(go.transform, false);
        var arrowRt = arrow.AddComponent<RectTransform>();
        arrowRt.anchorMin = new Vector2(1f, 0.5f);
        arrowRt.anchorMax = new Vector2(1f, 0.5f);
        arrowRt.sizeDelta = new Vector2(20f, 20f);
        arrowRt.anchoredPosition = new Vector2(-20f, 0f);
        var arrowImg = arrow.AddComponent<Image>();
        arrowImg.color = Color.white;

        var template = new GameObject("Template");
        template.transform.SetParent(go.transform, false);
        template.SetActive(false);
        var templateRt = template.AddComponent<RectTransform>();
        templateRt.anchorMin = new Vector2(0f, 0f);
        templateRt.anchorMax = new Vector2(1f, 0f);
        templateRt.pivot = new Vector2(0.5f, 1f);
        templateRt.anchoredPosition = new Vector2(0f, -2f);
        templateRt.sizeDelta = new Vector2(0f, 150f);
        var templateBg = template.AddComponent<Image>();
        templateBg.color = new Color(0.15f, 0.15f, 0.15f, 1f);
        var templateScroll = template.AddComponent<ScrollRect>();
        template.AddComponent<Mask>();

        var viewport = new GameObject("Viewport");
        viewport.transform.SetParent(template.transform, false);
        var vpRt = viewport.AddComponent<RectTransform>();
        vpRt.anchorMin = Vector2.zero;
        vpRt.anchorMax = Vector2.one;
        vpRt.sizeDelta = Vector2.zero;
        viewport.AddComponent<Image>().color = Color.clear;
        viewport.AddComponent<Mask>();

        var content = new GameObject("Content");
        content.transform.SetParent(viewport.transform, false);
        var contentRt = content.AddComponent<RectTransform>();
        contentRt.anchorMin = new Vector2(0f, 1f);
        contentRt.anchorMax = new Vector2(1f, 1f);
        contentRt.sizeDelta = new Vector2(0f, 0f);
        contentRt.pivot = new Vector2(0.5f, 1f);

        var item = new GameObject("Item");
        item.transform.SetParent(content.transform, false);
        var itemRt = item.AddComponent<RectTransform>();
        itemRt.sizeDelta = new Vector2(0f, 40f);
        var itemBg = item.AddComponent<Image>();
        itemBg.color = new Color(0.2f, 0.2f, 0.2f, 1f);

        var itemCheck = new GameObject("Item Check");
        itemCheck.transform.SetParent(item.transform, false);
        var icRt = itemCheck.AddComponent<RectTransform>();
        icRt.anchorMin = new Vector2(0f, 0.5f);
        icRt.sizeDelta = new Vector2(16f, 16f);
        icRt.anchoredPosition = new Vector2(16f, 0f);
        var icImg = itemCheck.AddComponent<Image>();
        icImg.color = Color.cyan;

        var itemLabel = new GameObject("Item Label");
        itemLabel.transform.SetParent(item.transform, false);
        var ilRt = itemLabel.AddComponent<RectTransform>();
        ilRt.anchorMin = Vector2.zero;
        ilRt.anchorMax = Vector2.one;
        ilRt.sizeDelta = new Vector2(-40f, 0f);
        ilRt.offsetMin = new Vector2(30f, 0f);
        var ilTmp = itemLabel.AddComponent<TextMeshProUGUI>();
        ilTmp.fontSize = 16;
        ilTmp.color = Color.white;
        ilTmp.alignment = TextAlignmentOptions.Left;

        var bgImg = go.AddComponent<Image>();
        bgImg.color = BtnNormal;

        tmpDrop.targetGraphic = bgImg;
        tmpDrop.captionText = tmpLabel;
        tmpDrop.itemText = ilTmp;
        tmpDrop.template = templateRt;

        var optList = new System.Collections.Generic.List<TMP_Dropdown.OptionData>();
        foreach (var o in options)
            optList.Add(new TMP_Dropdown.OptionData(o));
        tmpDrop.options = optList;
        tmpDrop.value = 0;

        templateScroll.content = contentRt;
        templateScroll.viewport = vpRt;

        return tmpDrop;
    }

    public static RectTransform CreateContainer(Transform parent, string name)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        var rt = go.AddComponent<RectTransform>();
        rt.anchorMin = new Vector2(0f, 0f);
        rt.anchorMax = new Vector2(1f, 1f);
        rt.sizeDelta = Vector2.zero;
        var layout = go.AddComponent<VerticalLayoutGroup>();
        layout.spacing = 8f;
        layout.childAlignment = TextAnchor.MiddleCenter;
        layout.childControlWidth = true;
        layout.childControlHeight = false;
        layout.childForceExpandWidth = true;
        layout.childForceExpandHeight = false;
        return rt;
    }

    public static RectTransform CreateGridContainer(Transform parent, string name, int columns = 3, float cellW = 200f, float cellH = 100f)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        var rt = go.AddComponent<RectTransform>();
        rt.anchorMin = new Vector2(0f, 0f);
        rt.anchorMax = new Vector2(1f, 1f);
        rt.sizeDelta = Vector2.zero;
        var grid = go.AddComponent<GridLayoutGroup>();
        grid.cellSize = new Vector2(cellW, cellH);
        grid.spacing = new Vector2(12f, 12f);
        grid.childAlignment = TextAnchor.MiddleCenter;
        grid.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
        grid.constraintCount = columns;
        return rt;
    }

    public static GameObject CreateSlotButton(Transform parent, string name, int slotIndex)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        var rt = go.AddComponent<RectTransform>();
        rt.sizeDelta = new Vector2(500f, 80f);

        var img = go.AddComponent<Image>();
        img.color = new Color(0.18f, 0.28f, 0.42f, 1f);
        var btn = go.AddComponent<Button>();
        var colors = btn.colors;
        colors.highlightedColor = new Color(0.25f, 0.38f, 0.55f, 1f);
        btn.colors = colors;

        var titleTxt = CreateLabel(go.transform, "SlotTitle", $"存档 {slotIndex + 1}", 20, Color.white);
        var titleRt = titleTxt.GetComponent<RectTransform>();
        titleRt.anchorMin = new Vector2(0f, 0.6f);
        titleRt.anchorMax = new Vector2(0.8f, 1f);
        titleRt.sizeDelta = Vector2.zero;
        titleRt.offsetMin = new Vector2(20f, 0f);
        titleTxt.alignment = TextAlignmentOptions.Left;

        var infoTxt = CreateLabel(go.transform, "SlotInfo", "空 - 点击开始新游戏", 16, new Color(0.7f, 0.75f, 0.8f, 1f));
        var infoRt = infoTxt.GetComponent<RectTransform>();
        infoRt.anchorMin = new Vector2(0f, 0f);
        infoRt.anchorMax = new Vector2(0.8f, 0.6f);
        infoRt.sizeDelta = Vector2.zero;
        infoRt.offsetMin = new Vector2(20f, 0f);
        infoTxt.alignment = TextAlignmentOptions.Left;

        return go;
    }

    public static GameObject CreateLevelButton(Transform parent, string levelName, string stars, bool unlocked)
    {
        var go = new GameObject(levelName);
        go.transform.SetParent(parent, false);
        var rt = go.AddComponent<RectTransform>();

        var img = go.AddComponent<Image>();
        img.color = unlocked ? new Color(0.2f, 0.35f, 0.55f, 1f) : new Color(0.3f, 0.3f, 0.3f, 0.8f);
        var btn = go.AddComponent<Button>();
        btn.interactable = unlocked;
        if (unlocked)
        {
            var colors = btn.colors;
            colors.highlightedColor = new Color(0.3f, 0.45f, 0.65f, 1f);
            btn.colors = colors;
        }

        var nameTxt = CreateLabel(go.transform, "LevelName", unlocked ? levelName : "🔒", 20, Color.white);
        var nameRt = nameTxt.GetComponent<RectTransform>();
        nameRt.anchorMin = new Vector2(0f, 0.5f);
        nameRt.anchorMax = new Vector2(1f, 1f);
        nameRt.sizeDelta = Vector2.zero;

        var starTxt = CreateLabel(go.transform, "StarDisplay", stars, 18, new Color(1f, 0.85f, 0.2f, 1f));
        var starRt = starTxt.GetComponent<RectTransform>();
        starRt.anchorMin = new Vector2(0f, 0f);
        starRt.anchorMax = new Vector2(1f, 0.5f);
        starRt.sizeDelta = Vector2.zero;

        return go;
    }
}
