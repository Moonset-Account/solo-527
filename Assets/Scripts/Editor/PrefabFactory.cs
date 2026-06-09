#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using System.IO;
using DecorMatch3.Match3;
using DecorMatch3.UI;
using DecorMatch3.Audio;
using DecorMatch3.Utils;

namespace DecorMatch3.EditorTools
{
    public static class PrefabFactory
    {
        private const string PREFAB_DIR = "Assets/Prefabs";
        private const string UI_PREFAB_DIR = "Assets/Prefabs/UI";
        private const string MATCH3_PREFAB_DIR = "Assets/Prefabs/Match3";

        [MenuItem("DecorMatch3/Factory/Create All Prefabs")]
        public static void CreateAllPrefabs()
        {
            EnsureDirectory(PREFAB_DIR);
            EnsureDirectory(UI_PREFAB_DIR);
            EnsureDirectory(MATCH3_PREFAB_DIR);

            CreateTilePrefab();
            CreateToastPrefab();
            CreateDialogPrefab();
            CreateMainCanvasPrefab();
            CreateLoadingScreenPrefab();
            CreateBoardContainerPrefab();

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            Debug.Log("[PrefabFactory] All prefabs created successfully!");
        }

        private static void EnsureDirectory(string path)
        {
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }
        }

        public static void CreateTilePrefab()
        {
            GameObject tileGO = new GameObject("Tile");
            tileGO.AddComponent<RectTransform>();

            Image tileImage = tileGO.AddComponent<Image>();
            tileImage.color = Color.white;
            tileImage.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/UISprite.psd");
            tileImage.type = Image.Type.Sliced;

            GameObject highlightGO = new GameObject("Highlight");
            highlightGO.transform.SetParent(tileGO.transform, false);
            Image highlightImage = highlightGO.AddComponent<Image>();
            highlightImage.color = new Color(1f, 1f, 0.5f, 0.6f);
            highlightImage.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/UISprite.psd");
            highlightImage.type = Image.Type.Sliced;
            highlightImage.enabled = false;
            RectTransform highlightRT = highlightGO.GetComponent<RectTransform>();
            highlightRT.anchorMin = Vector2.zero;
            highlightRT.anchorMax = Vector2.one;
            highlightRT.offsetMin = new Vector2(-5, -5);
            highlightRT.offsetMax = new Vector2(5, 5);

            CanvasGroup cg = tileGO.AddComponent<CanvasGroup>();
            cg.alpha = 1f;
            cg.blocksRaycasts = true;

            Tile tileComponent = tileGO.AddComponent<Tile>();

            SerializeObject(tileGO, "Tile", out Tile tileComp);
            if (tileComp != null)
            {
                SerializedObject so = new SerializedObject(tileComp);
                so.FindProperty("_tileImage").objectReferenceValue = tileImage;
                so.FindProperty("_highlightImage").objectReferenceValue = highlightImage;
                so.FindProperty("_canvasGroup").objectReferenceValue = cg;
                so.ApplyModifiedPropertiesWithoutUndo();
            }

            string path = $"{MATCH3_PREFAB_DIR}/Tile.prefab";
            PrefabUtility.SaveAsPrefabAsset(tileGO, path);
            Object.DestroyImmediate(tileGO);
            Debug.Log($"[PrefabFactory] Created: {path}");
        }

        public static void CreateToastPrefab()
        {
            GameObject toastGO = new GameObject("Toast");
            toastGO.AddComponent<RectTransform>();
            CanvasGroup cg = toastGO.AddComponent<CanvasGroup>();
            cg.alpha = 1f;

            GameObject bgGO = new GameObject("Background");
            bgGO.transform.SetParent(toastGO.transform, false);
            Image bgImage = bgGO.AddComponent<Image>();
            bgImage.color = new Color(0, 0, 0, 0.85f);
            bgImage.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/UISprite.psd");
            bgImage.type = Image.Type.Sliced;
            RectTransform bgRT = bgGO.GetComponent<RectTransform>();
            bgRT.anchorMin = new Vector2(0, 1);
            bgRT.anchorMax = new Vector2(1, 1);
            bgRT.pivot = new Vector2(0.5f, 1f);
            bgRT.anchoredPosition = new Vector2(0, -20);
            bgRT.sizeDelta = new Vector2(0, 60);

            GameObject textGO = new GameObject("Text");
            textGO.transform.SetParent(bgGO.transform, false);
            Text text = textGO.AddComponent<Text>();
            text.text = "Toast Message";
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            text.fontSize = 20;
            text.color = Color.white;
            text.alignment = TextAnchor.MiddleCenter;
            RectTransform textRT = textGO.GetComponent<RectTransform>();
            textRT.anchorMin = Vector2.zero;
            textRT.anchorMax = Vector2.one;
            textRT.offsetMin = Vector2.zero;
            textRT.offsetMax = Vector2.zero;

            string path = $"{UI_PREFAB_DIR}/Toast.prefab";
            PrefabUtility.SaveAsPrefabAsset(toastGO, path);
            Object.DestroyImmediate(toastGO);
            Debug.Log($"[PrefabFactory] Created: {path}");
        }

        public static void CreateDialogPrefab()
        {
            GameObject dialogGO = new GameObject("Dialog");
            dialogGO.AddComponent<RectTransform>();
            CanvasGroup cg = dialogGO.AddComponent<CanvasGroup>();

            GameObject blockerGO = new GameObject("Blocker");
            blockerGO.transform.SetParent(dialogGO.transform, false);
            Image blockerImage = blockerGO.AddComponent<Image>();
            blockerImage.color = new Color(0, 0, 0, 0.6f);
            RectTransform blockerRT = blockerGO.GetComponent<RectTransform>();
            blockerRT.anchorMin = Vector2.zero;
            blockerRT.anchorMax = Vector2.one;
            blockerRT.offsetMin = Vector2.zero;
            blockerRT.offsetMax = Vector2.zero;
            Button blockerBtn = blockerGO.AddComponent<Button>();
            ColorBlock cb = blockerBtn.colors;
            cb.normalColor = Color.clear;
            cb.highlightedColor = Color.clear;
            cb.pressedColor = Color.clear;
            blockerBtn.colors = cb;

            GameObject panelGO = new GameObject("Panel");
            panelGO.transform.SetParent(dialogGO.transform, false);
            Image panelImage = panelGO.AddComponent<Image>();
            panelImage.color = new Color(0.95f, 0.95f, 0.97f, 1f);
            panelImage.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/Background.psd");
            panelImage.type = Image.Type.Sliced;
            RectTransform panelRT = panelGO.GetComponent<RectTransform>();
            panelRT.anchorMin = new Vector2(0.5f, 0.5f);
            panelRT.anchorMax = new Vector2(0.5f, 0.5f);
            panelRT.pivot = new Vector2(0.5f, 0.5f);
            panelRT.sizeDelta = new Vector2(600, 400);

            GameObject titleGO = new GameObject("Title");
            titleGO.transform.SetParent(panelGO.transform, false);
            Text titleText = titleGO.AddComponent<Text>();
            titleText.text = "标题";
            titleText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            titleText.fontSize = 28;
            titleText.fontStyle = FontStyle.Bold;
            titleText.color = new Color(0.2f, 0.2f, 0.25f);
            titleText.alignment = TextAnchor.MiddleCenter;
            RectTransform titleRT = titleGO.GetComponent<RectTransform>();
            titleRT.anchorMin = new Vector2(0, 1);
            titleRT.anchorMax = new Vector2(1, 1);
            titleRT.pivot = new Vector2(0.5f, 1f);
            titleRT.anchoredPosition = new Vector2(0, -30);
            titleRT.sizeDelta = new Vector2(0, 50);

            GameObject msgGO = new GameObject("Message");
            msgGO.transform.SetParent(panelGO.transform, false);
            Text msgText = msgGO.AddComponent<Text>();
            msgText.text = "这是对话框内容。";
            msgText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            msgText.fontSize = 20;
            msgText.color = new Color(0.3f, 0.3f, 0.35f);
            msgText.alignment = TextAnchor.UpperCenter;
            msgText.horizontalOverflow = HorizontalWrapMode.Wrap;
            msgText.verticalOverflow = VerticalWrapMode.Overflow;
            RectTransform msgRT = msgGO.GetComponent<RectTransform>();
            msgRT.anchorMin = new Vector2(0.05f, 0.3f);
            msgRT.anchorMax = new Vector2(0.95f, 0.85f);
            msgRT.offsetMin = Vector2.zero;
            msgRT.offsetMax = Vector2.zero;

            GameObject confirmBtnGO = new GameObject("ConfirmButton");
            confirmBtnGO.transform.SetParent(panelGO.transform, false);
            Image confirmImage = confirmBtnGO.AddComponent<Image>();
            confirmImage.color = new Color(0.3f, 0.6f, 0.95f);
            confirmImage.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/UISprite.psd");
            confirmImage.type = Image.Type.Sliced;
            Button confirmBtn = confirmBtnGO.AddComponent<Button>();
            RectTransform confirmRT = confirmBtnGO.GetComponent<RectTransform>();
            confirmRT.anchorMin = new Vector2(0.1f, 0);
            confirmRT.anchorMax = new Vector2(0.45f, 0);
            confirmRT.pivot = new Vector2(0.5f, 0);
            confirmRT.anchoredPosition = new Vector2(0, 30);
            confirmRT.sizeDelta = new Vector2(0, 60);

            GameObject confirmTextGO = new GameObject("Text");
            confirmTextGO.transform.SetParent(confirmBtnGO.transform, false);
            Text confirmText = confirmTextGO.AddComponent<Text>();
            confirmText.text = "确定";
            confirmText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            confirmText.fontSize = 22;
            confirmText.color = Color.white;
            confirmText.alignment = TextAnchor.MiddleCenter;
            RectTransform confirmTextRT = confirmTextGO.GetComponent<RectTransform>();
            confirmTextRT.anchorMin = Vector2.zero;
            confirmTextRT.anchorMax = Vector2.one;
            confirmTextRT.offsetMin = Vector2.zero;
            confirmTextRT.offsetMax = Vector2.zero;

            GameObject cancelBtnGO = new GameObject("CancelButton");
            cancelBtnGO.transform.SetParent(panelGO.transform, false);
            Image cancelImage = cancelBtnGO.AddComponent<Image>();
            cancelImage.color = new Color(0.85f, 0.85f, 0.9f);
            cancelImage.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/UISprite.psd");
            cancelImage.type = Image.Type.Sliced;
            Button cancelBtn = cancelBtnGO.AddComponent<Button>();
            RectTransform cancelRT = cancelBtnGO.GetComponent<RectTransform>();
            cancelRT.anchorMin = new Vector2(0.55f, 0);
            cancelRT.anchorMax = new Vector2(0.9f, 0);
            cancelRT.pivot = new Vector2(0.5f, 0);
            cancelRT.anchoredPosition = new Vector2(0, 30);
            cancelRT.sizeDelta = new Vector2(0, 60);

            GameObject cancelTextGO = new GameObject("Text");
            cancelTextGO.transform.SetParent(cancelBtnGO.transform, false);
            Text cancelText = cancelTextGO.AddComponent<Text>();
            cancelText.text = "取消";
            cancelText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            cancelText.fontSize = 22;
            cancelText.color = new Color(0.4f, 0.4f, 0.45f);
            cancelText.alignment = TextAnchor.MiddleCenter;
            RectTransform cancelTextRT = cancelTextGO.GetComponent<RectTransform>();
            cancelTextRT.anchorMin = Vector2.zero;
            cancelTextRT.anchorMax = Vector2.one;
            cancelTextRT.offsetMin = Vector2.zero;
            cancelTextRT.offsetMax = Vector2.zero;

            string path = $"{UI_PREFAB_DIR}/Dialog.prefab";
            PrefabUtility.SaveAsPrefabAsset(dialogGO, path);
            Object.DestroyImmediate(dialogGO);
            Debug.Log($"[PrefabFactory] Created: {path}");
        }

        public static void CreateMainCanvasPrefab()
        {
            GameObject canvasGO = new GameObject("MainCanvas");
            Canvas canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            CanvasScaler scaler = canvasGO.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            GraphicRaycaster raycaster = canvasGO.AddComponent<GraphicRaycaster>();

            GameObject topBarGO = new GameObject("TopBar");
            topBarGO.transform.SetParent(canvasGO.transform, false);
            Image topBarImage = topBarGO.AddComponent<Image>();
            topBarImage.color = new Color(0.15f, 0.18f, 0.25f, 0.95f);
            RectTransform topBarRT = topBarGO.GetComponent<RectTransform>();
            topBarRT.anchorMin = new Vector2(0, 1);
            topBarRT.anchorMax = new Vector2(1, 1);
            topBarRT.pivot = new Vector2(0.5f, 1);
            topBarRT.anchoredPosition = Vector2.zero;
            topBarRT.sizeDelta = new Vector2(0, 80);

            GameObject coinsGO = new GameObject("CoinsText");
            coinsGO.transform.SetParent(topBarGO.transform, false);
            Text coinsText = coinsGO.AddComponent<Text>();
            coinsText.text = "0";
            coinsText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            coinsText.fontSize = 24;
            coinsText.color = new Color(1f, 0.85f, 0.3f);
            RectTransform coinsRT = coinsGO.GetComponent<RectTransform>();
            coinsRT.anchorMin = new Vector2(0, 0.5f);
            coinsRT.anchorMax = new Vector2(0, 0.5f);
            coinsRT.pivot = new Vector2(0, 0.5f);
            coinsRT.anchoredPosition = new Vector2(30, 0);
            coinsRT.sizeDelta = new Vector2(200, 40);

            GameObject gemsGO = new GameObject("GemsText");
            gemsGO.transform.SetParent(topBarGO.transform, false);
            Text gemsText = gemsGO.AddComponent<Text>();
            gemsText.text = "0";
            gemsText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            gemsText.fontSize = 24;
            gemsText.color = new Color(0.5f, 0.8f, 1f);
            RectTransform gemsRT = gemsGO.GetComponent<RectTransform>();
            gemsRT.anchorMin = new Vector2(0, 0.5f);
            gemsRT.anchorMax = new Vector2(0, 0.5f);
            gemsRT.pivot = new Vector2(0, 0.5f);
            gemsRT.anchoredPosition = new Vector2(250, 0);
            gemsRT.sizeDelta = new Vector2(200, 40);

            GameObject starsGO = new GameObject("StarsText");
            starsGO.transform.SetParent(topBarGO.transform, false);
            Text starsText = starsGO.AddComponent<Text>();
            starsText.text = "0";
            starsText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            starsText.fontSize = 24;
            starsText.color = new Color(1f, 1f, 0.5f);
            RectTransform starsRT = starsGO.GetComponent<RectTransform>();
            starsRT.anchorMin = new Vector2(0, 0.5f);
            starsRT.anchorMax = new Vector2(0, 0.5f);
            starsRT.pivot = new Vector2(0, 0.5f);
            starsRT.anchoredPosition = new Vector2(470, 0);
            starsRT.sizeDelta = new Vector2(200, 40);

            GameObject contentAreaGO = new GameObject("ContentArea");
            contentAreaGO.transform.SetParent(canvasGO.transform, false);
            RectTransform contentRT = contentAreaGO.GetComponent<RectTransform>();
            contentRT.anchorMin = new Vector2(0, 0);
            contentRT.anchorMax = new Vector2(1, 1);
            contentRT.offsetMin = new Vector2(0, 0);
            contentRT.offsetMax = new Vector2(0, -80);

            GameObject popupContainerGO = new GameObject("PopupContainer");
            popupContainerGO.transform.SetParent(canvasGO.transform, false);
            RectTransform popupRT = popupContainerGO.GetComponent<RectTransform>();
            popupRT.anchorMin = Vector2.zero;
            popupRT.anchorMax = Vector2.one;
            popupRT.offsetMin = Vector2.zero;
            popupRT.offsetMax = Vector2.zero;

            UIManager uiManager = canvasGO.AddComponent<UIManager>();
            SerializedObject so = new SerializedObject(uiManager);
            so.FindProperty("_mainCanvas").objectReferenceValue = canvas;
            so.FindProperty("_topBar").objectReferenceValue = topBarRT;
            so.FindProperty("_bottomBar").objectReferenceValue = null;
            so.FindProperty("_contentArea").objectReferenceValue = contentRT;
            so.FindProperty("_popupContainer").objectReferenceValue = popupRT;
            so.FindProperty("_coinsText").objectReferenceValue = coinsText;
            so.FindProperty("_gemsText").objectReferenceValue = gemsText;
            so.FindProperty("_starsText").objectReferenceValue = starsText;
            so.ApplyModifiedPropertiesWithoutUndo();

            string path = $"{UI_PREFAB_DIR}/MainCanvas.prefab";
            PrefabUtility.SaveAsPrefabAsset(canvasGO, path);
            Object.DestroyImmediate(canvasGO);
            Debug.Log($"[PrefabFactory] Created: {path}");
        }

        public static void CreateLoadingScreenPrefab()
        {
            GameObject loadingGO = new GameObject("LoadingScreen");
            loadingGO.AddComponent<RectTransform>();
            CanvasGroup cg = loadingGO.AddComponent<CanvasGroup>();
            cg.alpha = 1f;

            Image bgImage = loadingGO.AddComponent<Image>();
            bgImage.color = new Color(0.08f, 0.1f, 0.15f, 1f);

            GameObject titleGO = new GameObject("LoadingText");
            titleGO.transform.SetParent(loadingGO.transform, false);
            Text titleText = titleGO.AddComponent<Text>();
            titleText.text = "加载中... 0%";
            titleText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            titleText.fontSize = 36;
            titleText.color = Color.white;
            titleText.alignment = TextAnchor.MiddleCenter;
            RectTransform titleRT = titleGO.GetComponent<RectTransform>();
            titleRT.anchorMin = new Vector2(0.5f, 0.6f);
            titleRT.anchorMax = new Vector2(0.5f, 0.6f);
            titleRT.pivot = new Vector2(0.5f, 0.5f);
            titleRT.sizeDelta = new Vector2(600, 60);

            GameObject barBgGO = new GameObject("ProgressBarBG");
            barBgGO.transform.SetParent(loadingGO.transform, false);
            Image barBgImage = barBgGO.AddComponent<Image>();
            barBgImage.color = new Color(0.2f, 0.25f, 0.35f);
            RectTransform barBgRT = barBgGO.GetComponent<RectTransform>();
            barBgRT.anchorMin = new Vector2(0.5f, 0.5f);
            barBgRT.anchorMax = new Vector2(0.5f, 0.5f);
            barBgRT.pivot = new Vector2(0.5f, 0.5f);
            barBgRT.sizeDelta = new Vector2(600, 30);

            GameObject barFillGO = new GameObject("ProgressBar");
            barFillGO.transform.SetParent(barBgGO.transform, false);
            Image barFillImage = barFillGO.AddComponent<Image>();
            barFillImage.color = new Color(0.3f, 0.8f, 0.5f);
            RectTransform barFillRT = barFillGO.GetComponent<RectTransform>();
            barFillRT.anchorMin = new Vector2(0, 0);
            barFillRT.anchorMax = new Vector2(0, 1);
            barFillRT.pivot = new Vector2(0, 0.5f);
            barFillRT.sizeDelta = new Vector2(0, 0);

            string path = $"{UI_PREFAB_DIR}/LoadingScreen.prefab";
            PrefabUtility.SaveAsPrefabAsset(loadingGO, path);
            Object.DestroyImmediate(loadingGO);
            Debug.Log($"[PrefabFactory] Created: {path}");
        }

        public static void CreateBoardContainerPrefab()
        {
            GameObject boardGO = new GameObject("BoardContainer");
            boardGO.AddComponent<RectTransform>();

            GameObject tileParentGO = new GameObject("TileParent");
            tileParentGO.transform.SetParent(boardGO.transform, false);
            RectTransform tileParentRT = tileParentGO.GetComponent<RectTransform>();
            tileParentRT.anchorMin = Vector2.zero;
            tileParentRT.anchorMax = Vector2.one;
            tileParentRT.offsetMin = Vector2.zero;
            tileParentRT.offsetMax = Vector2.zero;

            BoardManager boardManager = boardGO.AddComponent<BoardManager>();
            SerializedObject so = new SerializedObject(boardManager);
            so.FindProperty("_boardContainer").objectReferenceValue = boardGO.GetComponent<RectTransform>();
            so.FindProperty("_tileParent").objectReferenceValue = tileParentRT;
            so.ApplyModifiedPropertiesWithoutUndo();

            string path = $"{MATCH3_PREFAB_DIR}/BoardContainer.prefab";
            PrefabUtility.SaveAsPrefabAsset(boardGO, path);
            Object.DestroyImmediate(boardGO);
            Debug.Log($"[PrefabFactory] Created: {path}");
        }

        private static void SerializeObject<T>(GameObject go, string componentName, out T component) where T : Component
        {
            component = go.GetComponent<T>();
        }
    }
}
#endif
