using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Events;
using System.Collections.Generic;

namespace LakeNavigation
{
    public class EncyclopediaPanel : IPanel
    {
        private Font _font;
        private EncyclopediaSystem _encyclopediaSystem;
        private CollectionCategory? _activeFilter;

        private Text _progressText;
        private Image _progressBarFill;
        private Transform _tabContainer;
        private Transform _entryContainer;
        private ScrollRect _entryScrollRect;
        private readonly List<Button> _tabButtons = new List<Button>();
        private readonly List<Text> _tabTexts = new List<Text>();

        private static readonly Dictionary<CollectionCategory, Color32> CategoryColors = new Dictionary<CollectionCategory, Color32>
        {
            { CollectionCategory.Bird, new Color32(100, 180, 255, 255) },
            { CollectionCategory.Fish, new Color32(0, 200, 200, 255) },
            { CollectionCategory.Mammal, new Color32(180, 140, 100, 255) },
            { CollectionCategory.Plant, new Color32(100, 200, 100, 255) },
            { CollectionCategory.Landmark, new Color32(255, 200, 50, 255) },
            { CollectionCategory.WeatherEvent, new Color32(180, 100, 255, 255) }
        };

        private static readonly string[] TabNames = new string[]
        {
            "All", "Birds", "Fish", "Mammals", "Plants", "Landmarks", "Weather"
        };

        private static readonly CollectionCategory?[] TabCategories = new CollectionCategory?[]
        {
            null,
            CollectionCategory.Bird,
            CollectionCategory.Fish,
            CollectionCategory.Mammal,
            CollectionCategory.Plant,
            CollectionCategory.Landmark,
            CollectionCategory.WeatherEvent
        };

        private ColorBlock _tabButtonColors;
        private ColorBlock _activeTabColors;
        private ColorBlock _backButtonColors;

        public override void Setup(Transform parent)
        {
            _font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

            _tabButtonColors = new ColorBlock
            {
                normalColor = new Color32(50, 60, 80, 255),
                highlightedColor = new Color32(70, 80, 100, 255),
                pressedColor = new Color32(40, 50, 70, 255),
                selectedColor = new Color32(70, 80, 100, 255),
                disabledColor = new Color32(80, 80, 80, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            };

            _activeTabColors = new ColorBlock
            {
                normalColor = new Color32(70, 130, 180, 255),
                highlightedColor = new Color32(100, 160, 210, 255),
                pressedColor = new Color32(50, 110, 160, 255),
                selectedColor = new Color32(100, 160, 210, 255),
                disabledColor = new Color32(80, 80, 80, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            };

            _backButtonColors = new ColorBlock
            {
                normalColor = new Color32(70, 130, 180, 255),
                highlightedColor = new Color32(100, 160, 210, 255),
                pressedColor = new Color32(50, 110, 160, 255),
                selectedColor = new Color32(100, 160, 210, 255),
                disabledColor = new Color32(80, 80, 80, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            };

            _panelObject = new GameObject("EncyclopediaPanel");
            _panelObject.transform.SetParent(parent, false);

            RectTransform rt = _panelObject.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            Image bg = _panelObject.AddComponent<Image>();
            bg.color = new Color32(20, 28, 45, 255);

            VerticalLayoutGroup mainLayout = _panelObject.AddComponent<VerticalLayoutGroup>();
            mainLayout.childAlignment = TextAnchor.UpperCenter;
            mainLayout.spacing = 0f;
            mainLayout.childControlWidth = true;
            mainLayout.childControlHeight = false;
            mainLayout.childForceExpandWidth = true;
            mainLayout.childForceExpandHeight = false;
            mainLayout.padding = new RectOffset(40, 40, 30, 30);

            CreateTitle();
            CreateProgressBar();
            AddSpacer(8f);
            CreateCategoryTabs();
            AddSpacer(4f);
            CreateEntryList();
            AddSpacer(10f);
            CreateBackButton();

            _panelObject.SetActive(false);
        }

        public override void Show()
        {
            _encyclopediaSystem = FindObjectOfType<EncyclopediaSystem>();
            _activeFilter = null;
            UpdateTabHighlight();
            RefreshEntries();
            _panelObject.SetActive(true);
            IsVisible = true;
        }

        public override void Hide()
        {
            _panelObject.SetActive(false);
            IsVisible = false;
        }

        private void CreateTitle()
        {
            GameObject titleObj = new GameObject("Title");
            titleObj.transform.SetParent(_panelObject.transform, false);

            Text title = titleObj.AddComponent<Text>();
            title.text = "ENCYCLOPEDIA";
            title.font = _font;
            title.fontSize = 40;
            title.color = Color.white;
            title.alignment = TextAnchor.MiddleCenter;
            title.fontStyle = FontStyle.Bold;

            LayoutElement le = titleObj.AddComponent<LayoutElement>();
            le.preferredHeight = 55f;
        }

        private void CreateProgressBar()
        {
            GameObject rowObj = new GameObject("ProgressRow");
            rowObj.transform.SetParent(_panelObject.transform, false);

            HorizontalLayoutGroup rowLayout = rowObj.AddComponent<HorizontalLayoutGroup>();
            rowLayout.childAlignment = TextAnchor.MiddleCenter;
            rowLayout.spacing = 10f;
            rowLayout.childControlWidth = true;
            rowLayout.childControlHeight = false;
            rowLayout.childForceExpandWidth = true;
            rowLayout.childForceExpandHeight = false;

            LayoutElement rowLe = rowObj.AddComponent<LayoutElement>();
            rowLe.preferredHeight = 30f;

            _progressText = CreateLabel(rowObj.transform, "0/0", 16, new Color32(180, 200, 230, 255), TextAnchor.MiddleLeft);
            LayoutElement ptLe = _progressText.gameObject.AddComponent<LayoutElement>();
            ptLe.minWidth = 80f;
            ptLe.preferredWidth = 100f;
            ptLe.flexibleWidth = 0;

            GameObject barObj = new GameObject("ProgressBar");
            barObj.transform.SetParent(rowObj.transform, false);

            LayoutElement barLe = barObj.AddComponent<LayoutElement>();
            barLe.preferredHeight = 16f;
            barLe.flexibleWidth = 1;

            Image barBg = barObj.AddComponent<Image>();
            barBg.color = new Color32(40, 50, 70, 255);

            GameObject fillObj = new GameObject("Fill");
            fillObj.transform.SetParent(barObj.transform, false);

            RectTransform fillRt = fillObj.GetComponent<RectTransform>();
            fillRt.anchorMin = Vector2.zero;
            fillRt.anchorMax = new Vector2(0f, 1f);
            fillRt.offsetMin = Vector2.zero;
            fillRt.offsetMax = Vector2.zero;

            _progressBarFill = fillObj.AddComponent<Image>();
            _progressBarFill.color = new Color32(70, 180, 130, 255);
        }

        private void CreateCategoryTabs()
        {
            GameObject tabScrollObj = new GameObject("TabScroll");
            tabScrollObj.transform.SetParent(_panelObject.transform, false);

            LayoutElement tabScrollLe = tabScrollObj.AddComponent<LayoutElement>();
            tabScrollLe.preferredHeight = 42f;

            Image tabScrollBg = tabScrollObj.AddComponent<Image>();
            tabScrollBg.color = new Color32(25, 35, 55, 255);

            ScrollRect tabScroll = tabScrollObj.AddComponent<ScrollRect>();
            tabScroll.horizontal = true;
            tabScroll.vertical = false;
            tabScroll.scrollSensitivity = 30f;

            GameObject viewportObj = new GameObject("Viewport");
            viewportObj.transform.SetParent(tabScrollObj.transform, false);

            RectTransform vpRt = viewportObj.AddComponent<RectTransform>();
            vpRt.anchorMin = Vector2.zero;
            vpRt.anchorMax = Vector2.one;
            vpRt.offsetMin = Vector2.zero;
            vpRt.offsetMax = Vector2.zero;

            Image vpMask = viewportObj.AddComponent<Image>();
            vpMask.color = new Color32(1, 1, 1, 0);

            Mask mask = viewportObj.AddComponent<Mask>();
            mask.showMaskGraphic = false;

            GameObject contentObj = new GameObject("Content");
            contentObj.transform.SetParent(viewportObj.transform, false);

            RectTransform contentRt = contentObj.AddComponent<RectTransform>();
            contentRt.anchorMin = new Vector2(0f, 0f);
            contentRt.anchorMax = new Vector2(0f, 1f);
            contentRt.pivot = new Vector2(0f, 0.5f);

            HorizontalLayoutGroup hlg = contentObj.AddComponent<HorizontalLayoutGroup>();
            hlg.childAlignment = TextAnchor.MiddleLeft;
            hlg.spacing = 6f;
            hlg.childControlWidth = true;
            hlg.childControlHeight = true;
            hlg.childForceExpandWidth = false;
            hlg.childForceExpandHeight = true;
            hlg.padding = new RectOffset(8, 8, 4, 4);

            ContentSizeFitter csf = contentObj.AddComponent<ContentSizeFitter>();
            csf.horizontalFit = ContentSizeFitter.FitMode.PreferredSize;

            _tabContainer = contentObj.transform;

            tabScroll.content = contentRt;
            tabScroll.viewport = viewportObj.GetComponent<RectTransform>();

            for (int i = 0; i < TabNames.Length; i++)
            {
                CreateTabButton(TabNames[i], i);
            }
        }

        private void CreateTabButton(string label, int index)
        {
            GameObject btnObj = new GameObject("Tab_" + label);
            btnObj.transform.SetParent(_tabContainer, false);

            Image btnImage = btnObj.AddComponent<Image>();
            btnImage.color = _tabButtonColors.normalColor;

            Button button = btnObj.AddComponent<Button>();
            button.targetGraphic = btnImage;
            button.colors = _tabButtonColors;

            int capturedIndex = index;
            button.onClick.AddListener(() => OnTabClicked(capturedIndex));

            GameObject textObj = new GameObject("Text");
            textObj.transform.SetParent(btnObj.transform, false);

            RectTransform textRt = textObj.GetComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = new Vector2(8, 0);
            textRt.offsetMax = new Vector2(-8, 0);

            Text btnText = textObj.AddComponent<Text>();
            btnText.text = label;
            btnText.font = _font;
            btnText.fontSize = 16;
            btnText.color = new Color32(180, 200, 230, 255);
            btnText.alignment = TextAnchor.MiddleCenter;

            LayoutElement le = btnObj.AddComponent<LayoutElement>();
            le.minWidth = 80f;
            le.preferredWidth = 100f;

            _tabButtons.Add(button);
            _tabTexts.Add(btnText);
        }

        private void CreateEntryList()
        {
            GameObject scrollObj = new GameObject("EntryScroll");
            scrollObj.transform.SetParent(_panelObject.transform, false);

            LayoutElement scrollLe = scrollObj.AddComponent<LayoutElement>();
            scrollLe.flexibleHeight = 1;
            scrollLe.minHeight = 200f;

            Image scrollBg = scrollObj.AddComponent<Image>();
            scrollBg.color = new Color32(15, 22, 38, 255);

            _entryScrollRect = scrollObj.AddComponent<ScrollRect>();
            _entryScrollRect.horizontal = false;
            _entryScrollRect.vertical = true;
            _entryScrollRect.scrollSensitivity = 40f;
            _entryScrollRect.movementType = ScrollRect.MovementType.Elastic;

            GameObject viewportObj = new GameObject("Viewport");
            viewportObj.transform.SetParent(scrollObj.transform, false);

            RectTransform vpRt = viewportObj.AddComponent<RectTransform>();
            vpRt.anchorMin = Vector2.zero;
            vpRt.anchorMax = Vector2.one;
            vpRt.offsetMin = Vector2.zero;
            vpRt.offsetMax = Vector2.zero;

            Image vpImg = viewportObj.AddComponent<Image>();
            vpImg.color = new Color32(1, 1, 1, 0);

            Mask vpMask = viewportObj.AddComponent<Mask>();
            vpMask.showMaskGraphic = false;

            GameObject contentObj = new GameObject("Content");
            contentObj.transform.SetParent(viewportObj.transform, false);

            RectTransform contentRt = contentObj.AddComponent<RectTransform>();
            contentRt.anchorMin = new Vector2(0f, 1f);
            contentRt.anchorMax = new Vector2(1f, 1f);
            contentRt.pivot = new Vector2(0.5f, 1f);

            VerticalLayoutGroup vlg = contentObj.AddComponent<VerticalLayoutGroup>();
            vlg.childAlignment = TextAnchor.UpperCenter;
            vlg.spacing = 8f;
            vlg.childControlWidth = true;
            vlg.childControlHeight = false;
            vlg.childForceExpandWidth = true;
            vlg.childForceExpandHeight = false;
            vlg.padding = new RectOffset(10, 10, 10, 10);

            ContentSizeFitter csf = contentObj.AddComponent<ContentSizeFitter>();
            csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            _entryContainer = contentObj.transform;

            _entryScrollRect.content = contentRt;
            _entryScrollRect.viewport = viewportObj.GetComponent<RectTransform>();
        }

        private void CreateBackButton()
        {
            GameObject btnObj = new GameObject("Btn_Back");
            btnObj.transform.SetParent(_panelObject.transform, false);

            Image btnImage = btnObj.AddComponent<Image>();
            btnImage.color = _backButtonColors.normalColor;

            Button button = btnObj.AddComponent<Button>();
            button.targetGraphic = btnImage;
            button.colors = _backButtonColors;
            button.onClick.AddListener(() => GameManager.Instance.ChangeState(GameState.MainMenu));

            GameObject textObj = new GameObject("Text");
            textObj.transform.SetParent(btnObj.transform, false);

            RectTransform textRt = textObj.GetComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = Vector2.zero;
            textRt.offsetMax = Vector2.zero;

            Text btnText = textObj.AddComponent<Text>();
            btnText.text = "Back";
            btnText.font = _font;
            btnText.fontSize = 24;
            btnText.color = Color.white;
            btnText.alignment = TextAnchor.MiddleCenter;

            LayoutElement le = btnObj.AddComponent<LayoutElement>();
            le.preferredHeight = 50f;
        }

        private void OnTabClicked(int index)
        {
            _activeFilter = TabCategories[index];
            UpdateTabHighlight();
            RefreshEntries();
        }

        private void UpdateTabHighlight()
        {
            for (int i = 0; i < _tabButtons.Count; i++)
            {
                bool isActive = TabCategories[i] == _activeFilter;
                _tabButtons[i].colors = isActive ? _activeTabColors : _tabButtonColors;
                _tabTexts[i].color = isActive ? Color.white : new Color32(180, 200, 230, 255);
                _tabTexts[i].fontStyle = isActive ? FontStyle.Bold : FontStyle.Normal;
            }
        }

        private void RefreshEntries()
        {
            if (_encyclopediaSystem == null) return;

            UpdateProgressBar();

            for (int i = _entryContainer.childCount - 1; i >= 0; i--)
            {
                Destroy(_entryContainer.GetChild(i).gameObject);
            }

            List<CollectibleEntry> entries = GetFilteredEntries();

            foreach (var entry in entries)
            {
                CreateEntryCard(entry);
            }

            if (_entryScrollRect != null)
            {
                _entryScrollRect.verticalNormalizedPosition = 1f;
            }
        }

        private void UpdateProgressBar()
        {
            int discovered = _encyclopediaSystem.GetTotalDiscovered();
            int total = _encyclopediaSystem.GetTotalEntries();

            if (_progressText != null)
            {
                _progressText.text = discovered + "/" + total;
            }

            if (_progressBarFill != null)
            {
                float progress = total > 0 ? (float)discovered / total : 0f;
                RectTransform fillRt = _progressBarFill.rectTransform;
                fillRt.anchorMax = new Vector2(Mathf.Clamp01(progress), 1f);
            }
        }

        private List<CollectibleEntry> GetFilteredEntries()
        {
            if (_activeFilter == null)
            {
                return _encyclopediaSystem.allEntries;
            }
            return _encyclopediaSystem.GetEntriesByCategory(_activeFilter.Value);
        }

        private void CreateEntryCard(CollectibleEntry entry)
        {
            GameObject cardObj = new GameObject("Entry_" + entry.Id);
            cardObj.transform.SetParent(_entryContainer, false);

            LayoutElement cardLe = cardObj.AddComponent<LayoutElement>();
            cardLe.minHeight = entry.IsDiscovered ? 130f : 55f;
            cardLe.preferredHeight = entry.IsDiscovered ? -1f : 55f;

            HorizontalLayoutGroup cardLayout = cardObj.AddComponent<HorizontalLayoutGroup>();
            cardLayout.childAlignment = TextAnchor.UpperLeft;
            cardLayout.spacing = 0f;
            cardLayout.childControlWidth = true;
            cardLayout.childControlHeight = false;
            cardLayout.childForceExpandWidth = true;
            cardLayout.childForceExpandHeight = false;
            cardLayout.padding = new RectOffset(0, 0, 0, 0);

            Image cardBg = cardObj.AddComponent<Image>();
            cardBg.color = new Color32(35, 48, 70, 255);

            if (entry.IsDiscovered)
            {
                GameObject borderObj = new GameObject("LeftBorder");
                borderObj.transform.SetParent(cardObj.transform, false);

                LayoutElement borderLe = borderObj.AddComponent<LayoutElement>();
                borderLe.minWidth = 5f;
                borderLe.preferredWidth = 5f;
                borderLe.flexibleWidth = 0;

                Image borderImg = borderObj.AddComponent<Image>();
                borderImg.color = GetCategoryColor(entry.Category);
            }

            GameObject contentObj = new GameObject("Content");
            contentObj.transform.SetParent(cardObj.transform, false);

            VerticalLayoutGroup contentLayout = contentObj.AddComponent<VerticalLayoutGroup>();
            contentLayout.childAlignment = TextAnchor.UpperLeft;
            contentLayout.spacing = 2f;
            contentLayout.childControlWidth = true;
            contentLayout.childControlHeight = false;
            contentLayout.childForceExpandWidth = true;
            contentLayout.childForceExpandHeight = false;
            contentLayout.padding = new RectOffset(12, 10, 8, 8);

            if (entry.IsDiscovered)
            {
                CreateDiscoveredEntry(contentObj.transform, entry);
            }
            else
            {
                CreateUndiscoveredEntry(contentObj.transform, entry);
            }
        }

        private void CreateDiscoveredEntry(Transform parent, CollectibleEntry entry)
        {
            GameObject nameRow = new GameObject("NameRow");
            nameRow.transform.SetParent(parent, false);

            HorizontalLayoutGroup nameLayout = nameRow.AddComponent<HorizontalLayoutGroup>();
            nameLayout.childAlignment = TextAnchor.MiddleLeft;
            nameLayout.spacing = 8f;
            nameLayout.childControlWidth = true;
            nameLayout.childControlHeight = false;
            nameLayout.childForceExpandWidth = true;
            nameLayout.childForceExpandHeight = false;

            LayoutElement nameRowLe = nameRow.AddComponent<LayoutElement>();
            nameRowLe.preferredHeight = 26f;

            Text nameText = CreateLabel(nameRow.transform, entry.DisplayName, 20, Color.white, TextAnchor.MiddleLeft);
            LayoutElement nameLe = nameText.gameObject.AddComponent<LayoutElement>();
            nameLe.flexibleWidth = 1;

            CreateCategoryTag(nameRow.transform, entry.Category);

            Text descText = CreateLabel(parent, entry.Description, 15, new Color32(200, 215, 235, 255), TextAnchor.UpperLeft);

            GameObject countRow = new GameObject("CountRow");
            countRow.transform.SetParent(parent, false);

            HorizontalLayoutGroup countLayout = countRow.AddComponent<HorizontalLayoutGroup>();
            countLayout.childAlignment = TextAnchor.MiddleLeft;
            countLayout.spacing = 4f;
            countLayout.childControlWidth = true;
            countLayout.childControlHeight = false;
            countLayout.childForceExpandWidth = true;
            countLayout.childForceExpandHeight = false;

            LayoutElement countRowLe = countRow.AddComponent<LayoutElement>();
            countRowLe.preferredHeight = 20f;

            Text countLabel = CreateLabel(countRow.transform, "Times found:", 13, new Color32(150, 165, 190, 255), TextAnchor.MiddleLeft);
            LayoutElement clLe = countLabel.gameObject.AddComponent<LayoutElement>();
            clLe.preferredWidth = 90f;
            clLe.flexibleWidth = 0;

            Text countValue = CreateLabel(countRow.transform, entry.DiscoveryCount.ToString(), 13, new Color32(200, 215, 235, 255), TextAnchor.MiddleLeft);

            if (!string.IsNullOrEmpty(entry.FunFact))
            {
                Text factText = CreateLabel(parent, entry.FunFact, 13, new Color32(160, 180, 210, 255), TextAnchor.UpperLeft);
                factText.fontStyle = FontStyle.Italic;
            }
        }

        private void CreateUndiscoveredEntry(Transform parent, CollectibleEntry entry)
        {
            GameObject nameRow = new GameObject("NameRow");
            nameRow.transform.SetParent(parent, false);

            HorizontalLayoutGroup nameLayout = nameRow.AddComponent<HorizontalLayoutGroup>();
            nameLayout.childAlignment = TextAnchor.MiddleLeft;
            nameLayout.spacing = 8f;
            nameLayout.childControlWidth = true;
            nameLayout.childControlHeight = false;
            nameLayout.childForceExpandWidth = true;
            nameLayout.childForceExpandHeight = false;

            LayoutElement nameRowLe = nameRow.AddComponent<LayoutElement>();
            nameRowLe.preferredHeight = 26f;

            Text nameText = CreateLabel(nameRow.transform, "???", 20, new Color32(120, 120, 140, 255), TextAnchor.MiddleLeft);
            LayoutElement nameLe = nameText.gameObject.AddComponent<LayoutElement>();
            nameLe.flexibleWidth = 1;

            CreateCategoryTag(nameRow.transform, entry.Category);

            CreateLabel(parent, "Not yet discovered", 14, new Color32(100, 110, 130, 255), TextAnchor.MiddleLeft);
        }

        private void CreateCategoryTag(Transform parent, CollectionCategory category)
        {
            Color32 tagColor = GetCategoryColor(category);
            string tagLabel = CategoryLabel(category);

            GameObject tagObj = new GameObject("CategoryTag");
            tagObj.transform.SetParent(parent, false);

            LayoutElement tagLe = tagObj.AddComponent<LayoutElement>();
            tagLe.minWidth = 70f;
            tagLe.preferredWidth = 90f;
            tagLe.preferredHeight = 22f;
            tagLe.flexibleWidth = 0;

            Image tagBg = tagObj.AddComponent<Image>();
            tagBg.color = new Color32(tagColor.r, tagColor.g, tagColor.b, 60);

            GameObject textObj = new GameObject("Text");
            textObj.transform.SetParent(tagObj.transform, false);

            RectTransform textRt = textObj.GetComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = new Vector2(4, 0);
            textRt.offsetMax = new Vector2(-4, 0);

            Text tagText = textObj.AddComponent<Text>();
            tagText.text = tagLabel;
            tagText.font = _font;
            tagText.fontSize = 12;
            tagText.color = tagColor;
            tagText.alignment = TextAnchor.MiddleCenter;
        }

        private Text CreateLabel(Transform parent, string text, int fontSize, Color color, TextAnchor alignment)
        {
            GameObject obj = new GameObject("Label");
            obj.transform.SetParent(parent, false);

            Text t = obj.AddComponent<Text>();
            t.text = text;
            t.font = _font;
            t.fontSize = fontSize;
            t.color = color;
            t.alignment = alignment;

            return t;
        }

        private Color32 GetCategoryColor(CollectionCategory category)
        {
            if (CategoryColors.TryGetValue(category, out Color32 c))
                return c;
            return new Color32(200, 200, 200, 255);
        }

        private string CategoryLabel(CollectionCategory category)
        {
            switch (category)
            {
                case CollectionCategory.Bird: return "Bird";
                case CollectionCategory.Fish: return "Fish";
                case CollectionCategory.Mammal: return "Mammal";
                case CollectionCategory.Plant: return "Plant";
                case CollectionCategory.Landmark: return "Landmark";
                case CollectionCategory.WeatherEvent: return "Weather";
                default: return category.ToString();
            }
        }

        private void AddSpacer(float height)
        {
            GameObject spacer = new GameObject("Spacer");
            spacer.transform.SetParent(_panelObject.transform, false);

            LayoutElement le = spacer.AddComponent<LayoutElement>();
            le.preferredHeight = height;
            le.minHeight = height;
        }
    }
}
