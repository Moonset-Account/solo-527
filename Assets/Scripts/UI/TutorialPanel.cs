using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Audio;

namespace LakeSailing.UI
{
    public class TutorialPanel : UIPanelBase
    {
        [Header("教程页")]
        [SerializeField] private List<GameObject> tutorialPages = new List<GameObject>();
        [SerializeField] private int currentPageIndex;
        [SerializeField] private Transform pagesContainer;

        [Header("导航")]
        [SerializeField] private Button previousButton;
        [SerializeField] private Button nextButton;
        [SerializeField] private Button skipButton;
        [SerializeField] private Button startButton;
        [SerializeField] private Text pageIndicatorText;
        [SerializeField] private Image[] pageDots;

        [Header("内容")]
        [SerializeField] private Text pageTitleText;
        [SerializeField] private Text pageContentText;
        [SerializeField] private Image pageIllustration;

        private string[] tutorialTitles = {
            "欢迎来到湖面航行",
            "了解天气系统",
            "风向与航行",
            "补给管理",
            "路线规划",
            "拍摄任务",
            "评分系统",
            "开始你的航行"
        };

        private string[] tutorialContents = {
            "你是一名摄影师兼船长，驾驶小船在美丽的湖泊中航行，拍摄珍稀的动植物和风景。\n\n合理规划路线，应对变幻莫测的天气，完成所有拍摄任务吧！",
            "天气会对航行产生重要影响：\n• 晴朗：适合拍摄，视野极佳\n• 大风：有助于航行，但要注意控制\n• 雨天/雾天：能见度降低，更耗油\n• 暴风雨：危险！尽量避开\n\n系统会提前15秒预警天气变化。",
            "风向用箭头和文字显示在HUD上：\n• 顺风：速度提升，节省燃料\n• 逆风：速度降低，消耗更多燃料\n• 横风：可能让船只偏移航线\n\n合理利用风力可以节省补给！",
            "三种关键补给需要管理：\n• 燃料：航行消耗，耗尽将无法移动\n• 食物：随时间消耗，太低会减速\n• 电量：拍摄消耗，低电量无法拍照\n\n补给站可以补充物资，但会占用时间。",
            "点击「路线规划」打开规划界面：\n1. 在地图上依次点击航点\n2. 系统会计算所需燃料和时间\n3. 确认后自动沿路线航行\n4. 可随时调整或取消路线\n\n好的路线是高分的关键！",
            "接近目标时，「拍摄」按钮会亮起：\n• 距离：最佳距离内画质最好\n• 角度：正对目标效果最佳\n• 天气：晴天拍摄得分更高\n\n达到70分以上画质才算拍摄成功！",
            "最终得分由以下部分组成：\n• 拍摄任务完成度（核心）\n• 每张照片的画质（距离/角度/天气）\n• 剩余时间奖励（越快越多）\n• 补给剩余奖励\n• 无损伤奖励\n\n获得3星需要综合规划能力！",
            "现在你已经了解了所有基本操作。\n记住：\n• 关注天气预报\n• 合理规划路线\n• 管理好补给\n• 追求完美拍摄\n\n准备好了吗？开始你的第一次航行吧！"
        };

        private void Awake()
        {
            panelType = UIType.Tutorial;
            UIManager.Instance?.RegisterPanel(panelType, this);
        }

        private void Start()
        {
            InitializeButtons();
            GenerateTutorialPages();
        }

        private void InitializeButtons()
        {
            if (previousButton) previousButton.onClick.AddListener(OnPreviousClicked);
            if (nextButton) nextButton.onClick.AddListener(OnNextClicked);
            if (skipButton) skipButton.onClick.AddListener(OnSkipClicked);
            if (startButton) startButton.onClick.AddListener(OnStartClicked);
        }

        private void GenerateTutorialPages()
        {
            if (pagesContainer == null) return;

            int pageCount = tutorialTitles.Length;
            tutorialPages = new List<GameObject>(pageCount);

            for (int i = 0; i < pageCount; i++)
            {
                var pageGO = new GameObject($"TutorialPage_{i}");
                pageGO.transform.SetParent(pagesContainer, false);
                var rt = pageGO.AddComponent<RectTransform>();
                rt.anchorMin = Vector2.zero;
                rt.anchorMax = Vector2.one;
                rt.offsetMin = Vector2.zero;
                rt.offsetMax = Vector2.zero;
                pageGO.SetActive(false);
                tutorialPages.Add(pageGO);
            }

            if (pageDots != null && pageDots.Length < pageCount)
            {
                var dotsList = new List<Image>(pageDots);
                for (int i = pageDots.Length; i < pageCount; i++)
                {
                    var dotGO = new GameObject($"Dot_{i}");
                    var img = dotGO.AddComponent<Image>();
                    img.color = Color.gray;
                    dotsList.Add(img);
                }
                pageDots = dotsList.ToArray();
            }
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            currentPageIndex = 0;
            UpdatePageDisplay();
        }

        private void UpdatePageDisplay()
        {
            for (int i = 0; i < tutorialPages.Count; i++)
            {
                if (tutorialPages[i] != null)
                {
                    tutorialPages[i].SetActive(i == currentPageIndex);
                }
            }

            if (pageTitleText != null) pageTitleText.text = tutorialTitles[currentPageIndex];
            if (pageContentText != null) pageContentText.text = tutorialContents[currentPageIndex];
            if (pageIndicatorText != null) pageIndicatorText.text = $"{currentPageIndex + 1}/{tutorialTitles.Length}";

            for (int i = 0; i < pageDots?.Length; i++)
            {
                if (pageDots[i] != null)
                {
                    pageDots[i].color = (i == currentPageIndex) ? Color.white : new Color(1, 1, 1, 0.3f);
                }
            }

            if (previousButton != null) previousButton.interactable = currentPageIndex > 0;
            bool isLastPage = currentPageIndex >= tutorialTitles.Length - 1;
            if (nextButton != null) nextButton.gameObject.SetActive(!isLastPage);
            if (startButton != null) startButton.gameObject.SetActive(isLastPage);
        }

        private void OnPreviousClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            if (currentPageIndex > 0)
            {
                currentPageIndex--;
                UpdatePageDisplay();
            }
        }

        private void OnNextClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            if (currentPageIndex < tutorialTitles.Length - 1)
            {
                currentPageIndex++;
                UpdatePageDisplay();
            }
        }

        private void OnSkipClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
            if (GameManager.Instance.CurrentState == GameState.Tutorial)
            {
                GameManager.Instance.ChangeState(GameState.MainMenu);
            }
        }

        private void OnStartClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
            GameManager.Instance?.ChangeState(GameState.LevelSelect);
            UIManager.Instance?.OpenPanel(UIType.LevelSelect, true);
        }
    }
}
