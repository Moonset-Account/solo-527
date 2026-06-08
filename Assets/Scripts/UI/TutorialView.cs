using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DecorMatch3.Core;
using DecorMatch3.Audio;
using DecorMatch3.Data;

namespace DecorMatch3.UI
{
    public class TutorialView : UIViewBase
    {
        [Header("Tutorial Steps")]
        [SerializeField] private List<TutorialStep> tutorialSteps = new List<TutorialStep>();
        [SerializeField] private int currentStepIndex = 0;

        [Header("UI Elements")]
        [SerializeField] private TextMeshProUGUI titleText;
        [SerializeField] private TextMeshProUGUI descriptionText;
        [SerializeField] private Image highlightImage;
        [SerializeField] private GameObject nextButton;
        [SerializeField] private GameObject prevButton;
        [SerializeField] private GameObject closeButton;
        [SerializeField] private GameObject skipButton;
        [SerializeField] private TextMeshProUGUI stepCounterText;
        [SerializeField] private Image progressBarFill;

        [Header("Buttons")]
        [SerializeField] private Button nextBtn;
        [SerializeField] private Button prevBtn;
        [SerializeField] private Button closeBtn;
        [SerializeField] private Button skipBtn;

        [System.Serializable]
        public class TutorialStep
        {
            public string Title;
            [TextArea] public string Description;
            public Sprite HighlightSprite;
            public Vector2 HighlightPosition;
            public Vector2 HighlightSize;
        }

        protected override void Awake()
        {
            base.Awake();
            viewType = UIView.Tutorial;
        }

        public override void Initialize()
        {
            base.Initialize();

            if (nextBtn != null) nextBtn.onClick.AddListener(NextStep);
            if (prevBtn != null) prevBtn.onClick.AddListener(PrevStep);
            if (closeBtn != null) closeBtn.onClick.AddListener(CloseTutorial);
            if (skipBtn != null) skipBtn.onClick.AddListener(SkipTutorial);

            if (tutorialSteps.Count == 0)
            {
                CreateDefaultTutorialSteps();
            }
        }

        private void CreateDefaultTutorialSteps()
        {
            tutorialSteps.Add(new TutorialStep
            {
                Title = "欢迎来到装修配色三消！",
                Description = "在这个游戏中，你将扮演一名室内设计师。通过三消游戏获取材料，为客户打造理想的家居空间！",
                HighlightSize = new Vector2(400, 400)
            });

            tutorialSteps.Add(new TutorialStep
            {
                Title = "三消玩法",
                Description = "点击两个相邻的宝石进行交换，让三个或更多相同颜色的宝石连成一线就能消除它们。完成所有目标即可过关！",
                HighlightSize = new Vector2(500, 500)
            });

            tutorialSteps.Add(new TutorialStep
            {
                Title = "收集材料",
                Description = "消除不同颜色的宝石可以获得对应的装修材料。红=油漆，蓝=布料，绿=木材，黄=金属，紫=瓷砖，橙=壁纸！",
                HighlightSize = new Vector2(400, 200),
                HighlightPosition = new Vector2(0, -200)
            });

            tutorialSteps.Add(new TutorialStep
            {
                Title = "装修房间",
                Description = "过关后会进入装修界面。根据客户的喜好选择家具和配色方案，打造一个让客户满意的空间！",
                HighlightSize = new Vector2(600, 300),
                HighlightPosition = new Vector2(0, 0)
            });

            tutorialSteps.Add(new TutorialStep
            {
                Title = "客户评价",
                Description = "装修完成后，客户会从颜色、家具、品质、预算等方面给你打分。评分越高奖励越丰厚！注意看客户的偏好提示哦~",
                HighlightSize = new Vector2(400, 400)
            });

            tutorialSteps.Add(new TutorialStep
            {
                Title = "准备好了吗？",
                Description = "就是这么简单！现在开始你的设计师之路吧。完成更多订单，解锁更多家具和颜色，成为顶级设计师！",
                HighlightSize = new Vector2(300, 300)
            });
        }

        public override void Open()
        {
            base.Open();
            currentStepIndex = 0;
            UpdateStepDisplay();
            AudioManager.Instance?.PlaySFX(SFXType.Tutorial);
        }

        private void UpdateStepDisplay()
        {
            if (tutorialSteps.Count == 0) return;

            TutorialStep step = tutorialSteps[currentStepIndex];

            if (titleText != null)
                titleText.text = step.Title;

            if (descriptionText != null)
                descriptionText.text = step.Description;

            if (stepCounterText != null)
                stepCounterText.text = $"{currentStepIndex + 1} / {tutorialSteps.Count}";

            if (progressBarFill != null)
                progressBarFill.fillAmount = (float)(currentStepIndex + 1) / tutorialSteps.Count;

            if (highlightImage != null)
            {
                highlightImage.sprite = step.HighlightSprite;
                if (step.HighlightSize != Vector2.zero)
                {
                    RectTransform rt = highlightImage.GetComponent<RectTransform>();
                    if (rt != null) rt.sizeDelta = step.HighlightSize;
                }
                RectTransform hrt = highlightImage.GetComponent<RectTransform>();
                if (hrt != null) hrt.anchoredPosition = step.HighlightPosition;
                highlightImage.gameObject.SetActive(step.HighlightSprite != null);
            }

            if (prevButton != null)
                prevButton.SetActive(currentStepIndex > 0);

            if (closeButton != null)
                closeButton.SetActive(currentStepIndex == tutorialSteps.Count - 1);

            if (nextButton != null)
                nextButton.SetActive(currentStepIndex < tutorialSteps.Count - 1);

            StartCoroutine(AnimateStepIn());
        }

        private IEnumerator AnimateStepIn()
        {
            if (titleText != null)
            {
                CanvasGroup titleCG = titleText.GetComponent<CanvasGroup>();
                if (titleCG == null) titleCG = titleText.gameObject.AddComponent<CanvasGroup>();
                titleCG.alpha = 0;

                CanvasGroup descCG = descriptionText.GetComponent<CanvasGroup>();
                if (descCG == null) descCG = descriptionText.gameObject.AddComponent<CanvasGroup>();
                descCG.alpha = 0;

                float timer = 0f;
                while (timer < 0.3f)
                {
                    timer += Time.deltaTime;
                    float t = timer / 0.3f;
                    titleCG.alpha = t;
                    descCG.alpha = Mathf.Max(0, (t - 0.2f) / 0.8f);
                    yield return null;
                }
            }
        }

        private void NextStep()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            if (currentStepIndex < tutorialSteps.Count - 1)
            {
                currentStepIndex++;
                UpdateStepDisplay();
            }
        }

        private void PrevStep()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            if (currentStepIndex > 0)
            {
                currentStepIndex--;
                UpdateStepDisplay();
            }
        }

        private void CloseTutorial()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            SaveManager.Instance.MarkTutorialCompleted();
            SaveManager.Instance.SaveGame();
            Close();

            if (GameStateManager.Instance.PreviousState == GameState.MainMenu)
            {
                GameStateManager.Instance.ChangeState(GameState.MainMenu);
            }
        }

        private void SkipTutorial()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            SaveManager.Instance.MarkTutorialCompleted();
            SaveManager.Instance.SaveGame();
            Close();
        }

        private void OnDestroy()
        {
            if (nextBtn != null) nextBtn.onClick.RemoveListener(NextStep);
            if (prevBtn != null) prevBtn.onClick.RemoveListener(PrevStep);
            if (closeBtn != null) closeBtn.onClick.RemoveListener(CloseTutorial);
            if (skipBtn != null) skipBtn.onClick.RemoveListener(SkipTutorial);
        }
    }
}
