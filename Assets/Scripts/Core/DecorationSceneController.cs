using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using DecorMatch3.Core;
using DecorMatch3.Match3;
using DecorMatch3.Decoration;
using DecorMatch3.Data;
using DecorMatch3.UI;
using DecorMatch3.GameFlow;

namespace DecorMatch3.Scenes
{
    public class DecorationSceneController : MonoBehaviour
    {
        [SerializeField] private DecorationOrder _currentOrder;
        [SerializeField] private DecorationManager _decorationManager;

        private Transform _contentRoot;
        private Canvas _canvas;
        private Transform _roomPreviewArea;
        private Transform _choicePanel;
        private Transform _slotListArea;
        private Transform _materialsInventory;

        private DecorationSlot _currentEditingSlot;
        private string _currentEditingSlotId;

        private void Awake()
        {
            EnsureUIStructure();
            InitializeDecoration();
        }

        private void EnsureUIStructure()
        {
            if (FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
            {
                GameObject es = new GameObject("EventSystem");
                es.AddComponent<UnityEngine.EventSystems.EventSystem>();
                es.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
            }

            _canvas = FindObjectOfType<Canvas>();
            if (_canvas == null)
            {
                GameObject canvasGO = new GameObject("MainCanvas");
                _canvas = canvasGO.AddComponent<Canvas>();
                _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                CanvasScaler scaler = canvasGO.AddComponent<CanvasScaler>();
                scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                scaler.referenceResolution = new Vector2(1920, 1080);
                canvasGO.AddComponent<GraphicRaycaster>();
            }

            GameObject rootGO = new GameObject("DecorationContent");
            rootGO.transform.SetParent(_canvas.transform, false);
            RectTransform rt = rootGO.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = new Vector2(0, 80);
            rt.offsetMax = Vector2.zero;
            _contentRoot = rt.transform;
        }

        private void InitializeDecoration()
        {
            GameFlowController flow = GameFlowController.Instance;
            if (flow != null && flow.CurrentOrder != null)
            {
                _currentOrder = flow.CurrentOrder;
                _decorationManager = flow.GetDecorationManager();
            }

            if (_currentOrder == null)
            {
                _currentOrder = DataManager.Instance.Orders.Count > 0 ? DataManager.Instance.Orders[0] : null;
                if (_currentOrder != null)
                {
                    _decorationManager = new DecorationManager(_currentOrder);
                }
            }

            if (_currentOrder == null)
            {
                UIManager.Instance?.ShowToast("暂无订单数据");
                return;
            }

            BuildLayout();
            BuildRoomPreview();
            BuildSlotList();
            BuildMaterialsInventory();
            BuildSubmitButton();

            UIManager.Instance?.UpdateCurrencyDisplay();
        }

        private void BuildLayout()
        {
            GameObject orderInfoGO = new GameObject("OrderInfoBar");
            orderInfoGO.transform.SetParent(_contentRoot, false);
            RectTransform oirt = orderInfoGO.AddComponent<RectTransform>();
            oirt.anchorMin = new Vector2(0, 1);
            oirt.anchorMax = new Vector2(1, 1);
            oirt.pivot = new Vector2(0.5f, 1);
            oirt.anchoredPosition = new Vector2(0, -10);
            oirt.sizeDelta = new Vector2(0, 70);
            Image oibg = orderInfoGO.AddComponent<Image>();
            oibg.color = new Color(0.2f, 0.3f, 0.5f, 0.95f);

            string orderTitle = $"📋 {_currentOrder.OrderTitle} | 客户：{_currentOrder.Customer?.CustomerName ?? "未命名"} | 预算：${_currentOrder.BudgetMin}~${_currentOrder.BudgetMax}";
            Text orderText = orderInfoGO.AddComponent<Text>();
            orderText.text = orderTitle;
            orderText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            orderText.fontSize = 24;
            orderText.fontStyle = FontStyle.Bold;
            orderText.color = Color.white;
            orderText.alignment = TextAnchor.MiddleCenter;
            RectTransform orderTextRT = orderText.GetComponent<RectTransform>();
            orderTextRT.anchorMin = Vector2.zero;
            orderTextRT.anchorMax = Vector2.one;
            orderTextRT.offsetMin = new Vector2(20, 5);
            orderTextRT.offsetMax = new Vector2(-20, -5);

            GameObject hintGO = new GameObject("CustomerHint");
            hintGO.transform.SetParent(_contentRoot, false);
            RectTransform hintRT = hintGO.AddComponent<RectTransform>();
            hintRT.anchorMin = new Vector2(0.02f, 0.88f);
            hintRT.anchorMax = new Vector2(0.98f, 0.88f);
            hintRT.pivot = new Vector2(0.5f, 1f);
            hintRT.sizeDelta = new Vector2(0, 45);
            Image hintBg = hintGO.AddComponent<Image>();
            hintBg.color = new Color(1f, 0.95f, 0.8f, 0.95f);
            Text hintText = hintGO.AddComponent<Text>();
            string customerHint = _currentOrder.Customer?.GetRandomHint() ?? "请根据要求完成装修。";
            hintText.text = $"💬 \"{customerHint}\"";
            hintText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            hintText.fontSize = 20;
            hintText.color = new Color(0.5f, 0.35f, 0.1f);
            hintText.alignment = TextAnchor.MiddleCenter;
            RectTransform hintTextRT = hintText.GetComponent<RectTransform>();
            hintTextRT.anchorMin = Vector2.zero;
            hintTextRT.anchorMax = Vector2.one;
            hintTextRT.offsetMin = new Vector2(15, 5);
            hintTextRT.offsetMax = new Vector2(-15, -5);
        }

        private void BuildRoomPreview()
        {
            GameObject previewGO = new GameObject("RoomPreview");
            previewGO.transform.SetParent(_contentRoot, false);
            RectTransform prt = previewGO.AddComponent<RectTransform>();
            prt.anchorMin = new Vector2(0.02f, 0.18f);
            prt.anchorMax = new Vector2(0.68f, 0.84f);
            prt.offsetMin = Vector2.zero;
            prt.offsetMax = Vector2.zero;
            Image previewBg = previewGO.AddComponent<Image>();
            previewBg.color = new Color(0.95f, 0.95f, 0.92f);
            previewBg.sprite = Resources.GetBuiltinResource<Sprite>("UI/Skin/Background.psd");
            previewBg.type = Image.Type.Sliced;

            GameObject wallGO = new GameObject("WallArea");
            wallGO.transform.SetParent(previewGO.transform, false);
            RectTransform wallRT = wallGO.AddComponent<RectTransform>();
            wallRT.anchorMin = new Vector2(0, 0.4f);
            wallRT.anchorMax = new Vector2(1, 1);
            wallRT.offsetMin = Vector2.zero;
            wallRT.offsetMax = Vector2.zero;
            Image wallImage = wallGO.AddComponent<Image>();
            wallImage.color = new Color(0.97f, 0.94f, 0.9f);
            wallImage.name = "WallColorImage";

            GameObject floorGO = new GameObject("FloorArea");
            floorGO.transform.SetParent(previewGO.transform, false);
            RectTransform floorRT = floorGO.AddComponent<RectTransform>();
            floorRT.anchorMin = new Vector2(0, 0);
            floorRT.anchorMax = new Vector2(1, 0.4f);
            floorRT.offsetMin = Vector2.zero;
            floorRT.offsetMax = Vector2.zero;
            Image floorImage = floorGO.AddComponent<Image>();
            floorImage.color = new Color(0.8f, 0.7f, 0.55f);
            floorImage.name = "FloorColorImage";

            GameObject labelGO = new GameObject("PreviewLabel");
            labelGO.transform.SetParent(previewGO.transform, false);
            RectTransform labelRT = labelGO.AddComponent<RectTransform>();
            labelRT.anchorMin = new Vector2(0.5f, 0.95f);
            labelRT.anchorMax = new Vector2(0.5f, 0.95f);
            labelRT.pivot = new Vector2(0.5f, 1f);
            labelRT.sizeDelta = new Vector2(300, 40);
            Text labelText = labelGO.AddComponent<Text>();
            labelText.text = "🏠 房间预览";
            labelText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            labelText.fontSize = 22;
            labelText.fontStyle = FontStyle.Bold;
            labelText.color = new Color(0.3f, 0.3f, 0.4f);
            labelText.alignment = TextAnchor.MiddleCenter;

            _roomPreviewArea = previewGO.transform;
        }

        private void BuildSlotList()
        {
            GameObject listGO = new GameObject("SlotList");
            listGO.transform.SetParent(_contentRoot, false);
            RectTransform listRT = listGO.AddComponent<RectTransform>();
            listRT.anchorMin = new Vector2(0.72f, 0.18f);
            listRT.anchorMax = new Vector2(0.98f, 0.84f);
            listRT.offsetMin = Vector2.zero;
            listRT.offsetMax = Vector2.zero;
            Image listBg = listGO.AddComponent<Image>();
            listBg.color = new Color(0.97f, 0.97f, 0.99f);
            listBg.sprite = Resources.GetBuiltinResource<Sprite>("UI/Skin/Background.psd");
            listBg.type = Image.Type.Sliced;

            GameObject titleGO = new GameObject("Title");
            titleGO.transform.SetParent(listGO.transform, false);
            RectTransform titleRT = titleGO.AddComponent<RectTransform>();
            titleRT.anchorMin = new Vector2(0, 1);
            titleRT.anchorMax = new Vector2(1, 1);
            titleRT.pivot = new Vector2(0.5f, 1);
            titleRT.anchoredPosition = new Vector2(0, -10);
            titleRT.sizeDelta = new Vector2(0, 40);
            Text titleText = titleGO.AddComponent<Text>();
            titleText.text = "🎨 装修项目";
            titleText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            titleText.fontSize = 22;
            titleText.fontStyle = FontStyle.Bold;
            titleText.color = new Color(0.3f, 0.3f, 0.4f);
            titleText.alignment = TextAnchor.MiddleCenter;

            GameObject scrollContentGO = new GameObject("ScrollContent");
            scrollContentGO.transform.SetParent(listGO.transform, false);
            RectTransform scrollRT = scrollContentGO.AddComponent<RectTransform>();
            scrollRT.anchorMin = new Vector2(0, 0);
            scrollRT.anchorMax = new Vector2(1, 0.92f);
            scrollRT.offsetMin = new Vector2(10, 10);
            scrollRT.offsetMax = new Vector2(-10, -10);
            _slotListArea = scrollContentGO.transform;

            float y = -10;
            int idx = 0;

            foreach (DecorationSlot slot in _currentOrder.RequiredSlots)
            {
                y -= CreateSlotButton(slot, idx++, y, true);
            }

            if (_currentOrder.OptionalSlots.Count > 0)
            {
                Text dividerText = CreateDivider(_slotListArea, y - 5, "—— 可选项目（+分） ——");
                y -= 40;
                idx++;
            }

            foreach (DecorationSlot slot in _currentOrder.OptionalSlots)
            {
                y -= CreateSlotButton(slot, idx++, y, false);
            }
        }

        private float CreateSlotButton(DecorationSlot slot, int index, float y, bool isRequired)
        {
            string slotName = isRequired ? $"* {slot.SlotName}" : slot.SlotName;
            Color color = isRequired ? new Color(0.4f, 0.6f, 0.95f) : new Color(0.6f, 0.6f, 0.75f);

            GameObject btnGO = new GameObject($"SlotBtn_{index}");
            btnGO.transform.SetParent(_slotListArea, false);
            Image btnImage = btnGO.AddComponent<Image>();
            btnImage.color = color;
            btnImage.sprite = Resources.GetBuiltinResource<Sprite>("UI/Skin/UISprite.psd");
            btnImage.type = Image.Type.Sliced;
            Button btn = btnGO.AddComponent<Button>();
            ColorBlock cb = btn.colors;
            cb.normalColor = color;
            cb.highlightedColor = color * 1.1f;
            cb.pressedColor = color * 0.85f;
            btn.colors = cb;

            string tempSlotId = slot.SlotId;
            DecorationSlot tempSlot = slot;
            btn.onClick.AddListener(() => { OnSlotClicked(tempSlotId, tempSlot); });

            RectTransform btnRT = btnGO.GetComponent<RectTransform>();
            btnRT.anchorMin = new Vector2(0, 1);
            btnRT.anchorMax = new Vector2(1, 1);
            btnRT.pivot = new Vector2(0.5f, 1);
            btnRT.anchoredPosition = new Vector2(0, y);
            btnRT.sizeDelta = new Vector2(0, 60);

            GameObject textGO = new GameObject("Label");
            textGO.transform.SetParent(btnGO.transform, false);
            Text btnText = textGO.AddComponent<Text>();
            btnText.text = slotName;
            btnText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            btnText.fontSize = 18;
            btnText.fontStyle = FontStyle.Bold;
            btnText.color = Color.white;
            btnText.alignment = TextAnchor.MiddleCenter;
            RectTransform textRT = textGO.GetComponent<RectTransform>();
            textRT.anchorMin = new Vector2(0, 0.4f);
            textRT.anchorMax = new Vector2(1, 1);
            textRT.offsetMin = new Vector2(10, 0);
            textRT.offsetMax = new Vector2(-10, 0);

            GameObject descGO = new GameObject("Desc");
            descGO.transform.SetParent(btnGO.transform, false);
            Text descText = descGO.AddComponent<Text>();
            descText.text = slot.Description;
            descText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            descText.fontSize = 12;
            descText.color = new Color(1f, 1f, 1f, 0.85f);
            descText.alignment = TextAnchor.MiddleCenter;
            RectTransform descRT = descGO.GetComponent<RectTransform>();
            descRT.anchorMin = new Vector2(0, 0);
            descRT.anchorMax = new Vector2(1, 0.4f);
            descRT.offsetMin = new Vector2(10, 2);
            descRT.offsetMax = new Vector2(-10, 0);

            return 70;
        }

        private Text CreateDivider(Transform parent, float y, string text)
        {
            GameObject go = new GameObject("Divider");
            go.transform.SetParent(parent, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0, 1);
            rt.anchorMax = new Vector2(1, 1);
            rt.pivot = new Vector2(0.5f, 1);
            rt.anchoredPosition = new Vector2(0, y);
            rt.sizeDelta = new Vector2(0, 30);
            Text t = go.AddComponent<Text>();
            t.text = text;
            t.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            t.fontSize = 14;
            t.color = new Color(0.5f, 0.5f, 0.6f);
            t.alignment = TextAnchor.MiddleCenter;
            return t;
        }

        private void BuildMaterialsInventory()
        {
            GameObject invGO = new GameObject("InventoryPanel");
            invGO.transform.SetParent(_contentRoot, false);
            RectTransform invRT = invGO.AddComponent<RectTransform>();
            invRT.anchorMin = new Vector2(0.02f, 0.02f);
            invRT.anchorMax = new Vector2(0.68f, 0.16f);
            invRT.offsetMin = Vector2.zero;
            invRT.offsetMax = Vector2.zero;
            Image invBg = invGO.AddComponent<Image>();
            invBg.color = new Color(0.95f, 0.92f, 0.85f);
            invBg.sprite = Resources.GetBuiltinResource<Sprite>("UI/Skin/Background.psd");
            invBg.type = Image.Type.Sliced;

            Text titleText = CreateText(invGO.transform, "📦 材料库存", new Vector2(0.5f, 0.85f), new Vector2(200, 30), 18, FontStyle.Bold, new Color(0.4f, 0.35f, 0.2f));
            titleText.alignment = TextAnchor.MiddleCenter;

            _materialsInventory = new GameObject("MaterialItems").transform;
            _materialsInventory.SetParent(invGO.transform, false);
            RectTransform miRT = _materialsInventory.gameObject.AddComponent<RectTransform>();
            miRT.anchorMin = new Vector2(0, 0);
            miRT.anchorMax = new Vector2(1, 0.75f);
            miRT.offsetMin = new Vector2(10, 5);
            miRT.offsetMax = new Vector2(-10, -5);

            RefreshInventoryDisplay();
        }

        private void RefreshInventoryDisplay()
        {
            if (_materialsInventory == null) return;

            for (int i = _materialsInventory.childCount - 1; i >= 0; i--)
            {
                Destroy(_materialsInventory.GetChild(i).gameObject);
            }

            GameFlowController flow = GameFlowController.Instance;
            Dictionary<int, int> levelMats = flow?.GetLevelMaterials() ?? new Dictionary<int, int>();

            int x = 0;
            int idx = 0;
            foreach (MaterialData mat in DataManager.Instance.Materials)
            {
                int count = 0;
                if (SaveSystem.Instance != null)
                {
                    count += SaveSystem.Instance.GetMaterialCount(mat.MaterialId);
                }
                if (levelMats.TryGetValue(mat.MaterialId, out int lc)) count += lc;

                if (count <= 0) continue;

                CreateMaterialItem(mat, count, idx % 8, idx / 8);
                idx++;
                x++;
            }

            if (idx == 0)
            {
                CreateText(_materialsInventory, "暂无材料，先去三消关卡收集吧！", new Vector2(0.5f, 0.5f), new Vector2(600, 40), 18, FontStyle.Normal, new Color(0.6f, 0.55f, 0.45f))
                    .alignment = TextAnchor.MiddleCenter;
            }
        }

        private void CreateMaterialItem(MaterialData mat, int count, int col, int row)
        {
            GameObject itemGO = new GameObject($"Mat_{mat.MaterialId}");
            itemGO.transform.SetParent(_materialsInventory, false);
            RectTransform irt = itemGO.AddComponent<RectTransform>();
            float cellW = 1f / 8f;
            irt.anchorMin = new Vector2(col * cellW, 1 - (row + 1));
            irt.anchorMax = new Vector2((col + 1) * cellW, 1 - row);
            irt.pivot = new Vector2(0.5f, 0.5f);
            irt.offsetMin = new Vector2(3, 3);
            irt.offsetMax = new Vector2(-3, -3);

            GameObject iconGO = new GameObject("Icon");
            iconGO.transform.SetParent(itemGO.transform, false);
            Image iconImage = iconGO.AddComponent<Image>();
            iconImage.color = mat.MaterialColor;
            iconImage.sprite = Resources.GetBuiltinResource<Sprite>("UI/Skin/UISprite.psd");
            RectTransform iconRT = iconGO.GetComponent<RectTransform>();
            iconRT.anchorMin = new Vector2(0, 0.3f);
            iconRT.anchorMax = new Vector2(1, 1);
            iconRT.offsetMin = new Vector2(2, 2);
            iconRT.offsetMax = new Vector2(-2, -2);

            GameObject countGO = new GameObject("Count");
            countGO.transform.SetParent(itemGO.transform, false);
            Text countText = countGO.AddComponent<Text>();
            countText.text = $"×{count}";
            countText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            countText.fontSize = 16;
            countText.fontStyle = FontStyle.Bold;
            countText.color = new Color(0.3f, 0.3f, 0.35f);
            countText.alignment = TextAnchor.MiddleCenter;
            RectTransform countRT = countGO.GetComponent<RectTransform>();
            countRT.anchorMin = new Vector2(0, 0);
            countRT.anchorMax = new Vector2(1, 0.3f);
            countRT.offsetMin = Vector2.zero;
            countRT.offsetMax = Vector2.zero;
        }

        private Text CreateText(Transform parent, string content, Vector2 anchor, Vector2 size, int fontSize, FontStyle style, Color color)
        {
            GameObject go = new GameObject("Text_" + content.Substring(0, Math.Min(5, content.Length)));
            go.transform.SetParent(parent, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = anchor;
            rt.anchorMax = anchor;
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = size;

            Text t = go.AddComponent<Text>();
            t.text = content;
            t.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            t.fontSize = fontSize;
            t.fontStyle = style;
            t.color = color;
            return t;
        }

        private void BuildSubmitButton()
        {
            GameObject btnGO = new GameObject("SubmitButton");
            btnGO.transform.SetParent(_contentRoot, false);
            Image btnImage = btnGO.AddComponent<Image>();
            Color btnColor = new Color(0.95f, 0.55f, 0.3f);
            btnImage.color = btnColor;
            btnImage.sprite = Resources.GetBuiltinResource<Sprite>("UI/Skin/UISprite.psd");
            btnImage.type = Image.Type.Sliced;
            Button btn = btnGO.AddComponent<Button>();
            ColorBlock cb = btn.colors;
            cb.normalColor = btnColor;
            cb.highlightedColor = btnColor * 1.1f;
            cb.pressedColor = btnColor * 0.85f;
            btn.colors = cb;
            btn.onClick.AddListener(OnSubmitClicked);

            RectTransform btnRT = btnGO.GetComponent<RectTransform>();
            btnRT.anchorMin = new Vector2(0.72f, 0.02f);
            btnRT.anchorMax = new Vector2(0.98f, 0.16f);
            btnRT.offsetMin = Vector2.zero;
            btnRT.offsetMax = Vector2.zero;

            GameObject textGO = new GameObject("Label");
            textGO.transform.SetParent(btnGO.transform, false);
            Text btnText = textGO.AddComponent<Text>();
            btnText.text = "✅ 提交装修方案";
            btnText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            btnText.fontSize = 28;
            btnText.fontStyle = FontStyle.Bold;
            btnText.color = Color.white;
            btnText.alignment = TextAnchor.MiddleCenter;
            RectTransform textRT = textGO.GetComponent<RectTransform>();
            textRT.anchorMin = Vector2.zero;
            textRT.anchorMax = Vector2.one;
            textRT.offsetMin = Vector2.zero;
            textRT.offsetMax = Vector2.zero;
        }

        private void OnSlotClicked(string slotId, DecorationSlot slot)
        {
            _currentEditingSlotId = slotId;
            _currentEditingSlot = slot;

            string availableItems = "";
            int count = 0;

            if (slot.SlotType == DecorationSlotType.WallColor || slot.SlotType == DecorationSlotType.FloorColor)
            {
                if (slot.AvailableColorPalettes != null && slot.AvailableColorPalettes.Count > 0)
                {
                    foreach (ColorPalette p in slot.AvailableColorPalettes)
                    {
                        count++;
                        availableItems += $"【{count}】{p.PaletteName} - 墙面:RGB({Mathf.RoundToInt(p.WallPrimary.r * 255)},{Mathf.RoundToInt(p.WallPrimary.g * 255)},{Mathf.RoundToInt(p.WallPrimary.b * 255)})\n";
                    }
                }
                else
                {
                    foreach (ColorPalette p in DataManager.Instance.Palettes)
                    {
                        count++;
                        availableItems += $"【{count}】{p.PaletteName}\n";
                    }
                }
            }
            else
            {
                if (slot.AvailableFurniture != null && slot.AvailableFurniture.Count > 0)
                {
                    foreach (FurnitureItem f in slot.AvailableFurniture)
                    {
                        count++;
                        availableItems += $"【{count}】{f.FurnitureName} (${f.Cost})\n";
                    }
                }
                else
                {
                    foreach (FurnitureItem f in DataManager.Instance.Furniture)
                    {
                        count++;
                        availableItems += $"【{count}】{f.FurnitureName} (${f.Cost})\n";
                    }
                }
            }

            if (count == 0)
            {
                availableItems = "（暂无可用选项，已自动跳过此槽位）";
                _decorationManager?.MakeFurnitureChoice(slotId, null);
                return;
            }

            string currentChoice = "";
            DecorationChoice existing = _decorationManager?.GetChoiceForSlot(slotId);
            if (existing != null && !string.IsNullOrEmpty(existing.ChoiceValue))
            {
                currentChoice = $"\n当前选择：{existing.ChoiceValue}";
            }

            UIManager.Instance?.ShowDialog(
                $"选择：{slot.SlotName}{(slot.IsRequired ? " *必选" : "")}",
                $"{slot.Description}\n\n{currentChoice}\n\n请输入序号选择（1~{count}）：\n\n{availableItems}",
                "选第1个", "取消",
                () => { ApplyChoiceByIndex(slot, 0); });
        }

        private void ApplyChoiceByIndex(DecorationSlot slot, int zeroBasedIndex)
        {
            try
            {
                if (slot.SlotType == DecorationSlotType.WallColor || slot.SlotType == DecorationSlotType.FloorColor)
                {
                    var palettes = (slot.AvailableColorPalettes != null && slot.AvailableColorPalettes.Count > 0)
                        ? slot.AvailableColorPalettes
                        : DataManager.Instance.Palettes;

                    if (zeroBasedIndex >= 0 && zeroBasedIndex < palettes.Count)
                    {
                        ColorPalette palette = palettes[zeroBasedIndex];
                        _decorationManager?.MakeColorPaletteChoice(_currentEditingSlotId, palette);
                        ApplyPaletteToPreview(palette);
                        UIManager.Instance?.ShowToast($"已选择：{palette.PaletteName}");
                    }
                }
                else
                {
                    var furnitures = (slot.AvailableFurniture != null && slot.AvailableFurniture.Count > 0)
                        ? slot.AvailableFurniture
                        : DataManager.Instance.Furniture;

                    if (zeroBasedIndex >= 0 && zeroBasedIndex < furnitures.Count)
                    {
                        FurnitureItem furniture = furnitures[zeroBasedIndex];
                        _decorationManager?.MakeFurnitureChoice(_currentEditingSlotId, furniture);
                        ApplyFurnitureToPreview(slot, furniture);
                        UIManager.Instance?.ShowToast($"已选择：{furniture.FurnitureName}");
                    }
                }

                RefreshInventoryDisplay();
            }
            catch (Exception e)
            {
                Debug.LogError(e);
                UIManager.Instance?.ShowToast("选择失败，请重试");
            }
        }

        private void ApplyPaletteToPreview(ColorPalette palette)
        {
            if (_roomPreviewArea == null || palette == null) return;

            Transform wall = _roomPreviewArea.Find("RoomPreview/WallArea") ?? FindDeep(_roomPreviewArea, "WallArea");
            if (wall != null)
            {
                Image img = wall.GetComponent<Image>();
                if (img != null) img.color = palette.WallPrimary;
            }

            Transform floor = _roomPreviewArea.Find("FloorArea") ?? FindDeep(_roomPreviewArea, "FloorArea");
            if (floor != null)
            {
                Image img = floor.GetComponent<Image>();
                if (img != null) img.color = palette.FloorPrimary;
            }
        }

        private void ApplyFurnitureToPreview(DecorationSlot slot, FurnitureItem furniture)
        {
            if (_roomPreviewArea == null || furniture == null) return;
            string pieceName = $"Furniture_{slot.SlotId}";

            Transform existing = FindDeep(_roomPreviewArea, pieceName);
            if (existing != null) Destroy(existing.gameObject);

            GameObject pieceGO = new GameObject(pieceName);
            pieceGO.transform.SetParent(_roomPreviewArea, false);
            RectTransform prt = pieceGO.AddComponent<RectTransform>();

            switch (slot.SlotType)
            {
                case DecorationSlotType.MainFurniture:
                    prt.anchorMin = new Vector2(0.15f, 0.05f);
                    prt.anchorMax = new Vector2(0.55f, 0.45f);
                    break;
                case DecorationSlotType.SecondaryFurniture:
                    prt.anchorMin = new Vector2(0.6f, 0.05f);
                    prt.anchorMax = new Vector2(0.9f, 0.35f);
                    break;
                case DecorationSlotType.Lighting:
                    prt.anchorMin = new Vector2(0.75f, 0.55f);
                    prt.anchorMax = new Vector2(0.95f, 0.85f);
                    break;
                default:
                    prt.anchorMin = new Vector2(0.1f, 0.5f);
                    prt.anchorMax = new Vector2(0.3f, 0.8f);
                    break;
            }
            prt.offsetMin = Vector2.zero;
            prt.offsetMax = Vector2.zero;

            Image img = pieceGO.AddComponent<Image>();
            img.color = furniture.PrimaryColor;
            img.sprite = Resources.GetBuiltinResource<Sprite>("UI/Skin/UISprite.psd");

            GameObject labelGO = new GameObject("Label");
            labelGO.transform.SetParent(pieceGO.transform, false);
            Text label = labelGO.AddComponent<Text>();
            label.text = furniture.FurnitureName;
            label.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            label.fontSize = 14;
            label.color = new Color(0.3f, 0.3f, 0.35f);
            label.alignment = TextAnchor.MiddleCenter;
            RectTransform lrt = labelGO.GetComponent<RectTransform>();
            lrt.anchorMin = Vector2.zero;
            lrt.anchorMax = Vector2.one;
            lrt.offsetMin = Vector2.zero;
            lrt.offsetMax = Vector2.zero;
        }

        private Transform FindDeep(Transform parent, string name)
        {
            if (parent == null) return null;
            if (parent.name == name) return parent;
            foreach (Transform child in parent)
            {
                Transform found = FindDeep(child, name);
                if (found != null) return found;
            }
            return null;
        }

        private void OnSubmitClicked()
        {
            if (_decorationManager == null) return;

            if (!_decorationManager.AreAllRequiredSlotsFilled())
            {
                int filled = 0;
                int total = _currentOrder.RequiredSlots.Count;
                foreach (DecorationSlot s in _currentOrder.RequiredSlots)
                {
                    if (_decorationManager.GetChoiceForSlot(s.SlotId) != null) filled++;
                }

                UIManager.Instance?.ShowDialog(
                    "提示",
                    $"还有 {total - filled} 个必选项目未完成！\n请完成所有带 * 标记的项目。",
                    "继续编辑");
                return;
            }

            int spent = _decorationManager.GetTotalSpent();
            bool withinBudget = spent <= _currentOrder.BudgetMax;

            if (!withinBudget)
            {
                UIManager.Instance?.ShowDialog(
                    $"预算超限！(${spent} > ${_currentOrder.BudgetMax})",
                    $"你的方案花费 ${spent}，超过客户预算上限 ${_currentOrder.BudgetMax}。\n评分会被扣除，确定要提交吗？",
                    "仍然提交", "返回修改",
                    () => { DoSubmit(); });
            }
            else
            {
                DoSubmit();
            }
        }

        private void DoSubmit()
        {
            UIManager.Instance?.ShowToast("正在生成客户评价...");
            GameFlowController.Instance?.SubmitDecoration();
        }
    }
}
