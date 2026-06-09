using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace PixelPlantLab
{
    public class QuestAndChallengePanel : MonoBehaviour
    {
        [Header("主面板")]
        public GameObject PanelRoot;
        public Button CloseButton;
        public Button OpenButton;
        public Toggle TutorialToggle;
        public Toggle DailyToggle;

        [Header("教程任务列表")]
        public RectTransform TutorialListContainer;
        public GameObject QuestItemPrefab;

        [Header("每日挑战列表")]
        public RectTransform DailyListContainer;
        public GameObject ChallengeItemPrefab;
        public Text DailyRefreshText;

        [Header("资源显示")]
        public Text SeedsText;
        public Text NutrientsText;
        public Text CreditsText;

        [Header("通知")]
        public GameObject NewQuestNotice;
        public Text NoticeText;

        private readonly List<GameObject> _questObjects = new List<GameObject>();
        private readonly List<GameObject> _challengeObjects = new List<GameObject>();

        private void Start()
        {
            RegisterEvents();
            if (PanelRoot != null) PanelRoot.SetActive(false);
            if (TutorialToggle != null) TutorialToggle.isOn = true;
            SwitchToTutorial();
            UpdateResourceDisplay();
        }

        private void RegisterEvents()
        {
            if (OpenButton != null) OpenButton.onClick.AddListener(Open);
            if (CloseButton != null) CloseButton.onClick.AddListener(Close);
            if (TutorialToggle != null) TutorialToggle.onValueChanged.AddListener(b => { if (b) SwitchToTutorial(); });
            if (DailyToggle != null) DailyToggle.onValueChanged.AddListener(b => { if (b) SwitchToDaily(); });

            if (ResourceManager.Instance != null)
                ResourceManager.Instance.OnResourcesChanged += (_, __) => UpdateResourceDisplay();

            if (QuestManager.Instance != null)
            {
                QuestManager.Instance.OnQuestProgressUpdated += _ => RefreshTutorialList();
                QuestManager.Instance.OnQuestCompleted += _ => { RefreshTutorialList(); ShowQuestNotice("任务完成！"); };
            }

            if (DailyChallengeManager.Instance != null)
            {
                DailyChallengeManager.Instance.OnChallengesRefreshed += RefreshDailyList;
                DailyChallengeManager.Instance.OnChallengeProgressUpdated += _ => RefreshDailyList();
                DailyChallengeManager.Instance.OnChallengeCompleted += _ => { RefreshDailyList(); ShowQuestNotice("挑战完成！"); };
            }
        }

        public void Open()
        {
            if (PanelRoot != null) PanelRoot.SetActive(true);
            RefreshTutorialList();
            RefreshDailyList();
            UpdateResourceDisplay();
        }

        public void Close()
        {
            if (PanelRoot != null) PanelRoot.SetActive(false);
        }

        private void SwitchToTutorial()
        {
            if (TutorialListContainer != null) TutorialListContainer.gameObject.SetActive(true);
            if (DailyListContainer != null) DailyListContainer.gameObject.SetActive(false);
            RefreshTutorialList();
        }

        private void SwitchToDaily()
        {
            if (TutorialListContainer != null) TutorialListContainer.gameObject.SetActive(false);
            if (DailyListContainer != null) DailyListContainer.gameObject.SetActive(true);
            RefreshDailyList();
        }

        private void RefreshTutorialList()
        {
            if (QuestManager.Instance == null) return;
            ClearQuestObjects();
            if (QuestItemPrefab == null || TutorialListContainer == null) return;

            var quests = QuestManager.Instance.GetTutorialQuests();
            quests.Sort((a, b) => a.OrderIndex.CompareTo(b.OrderIndex));

            foreach (var quest in quests)
            {
                var go = Instantiate(QuestItemPrefab, TutorialListContainer);
                _questObjects.Add(go);
                SetupQuestItem(go, quest);
            }
        }

        private void SetupQuestItem(GameObject go, Quest quest)
        {
            var texts = go.GetComponentsInChildren<Text>();
            string statusColor = quest.IsClaimed ? "#888888>" :
                quest.IsCompleted ? "#66FF66>" : quest.OrderIndex == GetActiveTutorialIndex() ? "#FFFF88>" : "#AAAAAA>";

            foreach (var t in texts)
            {
                if (t.name.Contains("Title"))
                    t.text = $"<color={statusColor}{(quest.IsClaimed ? "[已完成] " : "")}{quest.Title}</color>";
                if (t.name.Contains("Desc"))
                    t.text = quest.Description;
                if (t.name.Contains("Obj"))
                {
                    string objStr = "";
                    for (int i = 0; i < quest.Objectives.Count; i++)
                    {
                        var obj = quest.Objectives[i];
                        string done = obj.IsCompleted ? "✓" : "·";
                        objStr += $"{done} {obj.Description} ({obj.CurrentCount}/{obj.TargetCount})\n";
                    }
                    t.text = objStr.TrimEnd();
                }
                if (t.name.Contains("Reward"))
                {
                    string r = "奖励: ";
                    var parts = new List<string>();
                    for (int i = 0; i < quest.RewardResourceKeys.Count; i++)
                    {
                        int amt = i < quest.RewardAmounts.Count ? quest.RewardAmounts[i] : 0;
                        parts.Add($"{ResourceKeyToName(quest.RewardResourceKeys[i])}×{amt}");
                    }
                    t.text = r + string.Join(", ", parts);
                }
            }

            var buttons = go.GetComponentsInChildren<Button>();
            foreach (var btn in buttons)
            {
                if (btn.name.Contains("Claim"))
                {
                    btn.gameObject.SetActive(quest.IsCompleted && !quest.IsClaimed);
                    btn.onClick.AddListener(() =>
                    {
                        QuestManager.Instance.ClaimQuestRewards(quest);
                        RefreshTutorialList();
                    });
                }
            }
        }

        private static int GetActiveTutorialIndex()
        {
            var q = QuestManager.Instance?.GetCurrentTutorialQuest();
            return q != null ? q.OrderIndex : -1;
        }

        private void RefreshDailyList()
        {
            if (DailyChallengeManager.Instance == null) return;
            ClearChallengeObjects();
            if (ChallengeItemPrefab == null || DailyListContainer == null) return;

            if (DailyRefreshText != null)
            {
                int completed = DailyChallengeManager.Instance.GetCompletedCount();
                int total = DailyChallengeManager.Instance.Challenges.Count;
                DailyRefreshText.text = $"每日挑战（每日刷新） {completed}/{total}";
            }

            foreach (var challenge in DailyChallengeManager.Instance.Challenges)
            {
                var go = Instantiate(ChallengeItemPrefab, DailyListContainer);
                _challengeObjects.Add(go);
                SetupChallengeItem(go, challenge);
            }
        }

        private void SetupChallengeItem(GameObject go, DailyChallenge challenge)
        {
            var texts = go.GetComponentsInChildren<Text>();
            string statusColor = challenge.IsClaimed ? "#888888>" :
                challenge.IsCompleted ? "#66FF66>" : "#AAAAAA>";

            foreach (var t in texts)
            {
                if (t.name.Contains("Title"))
                    t.text = $"<color={statusColor}{(challenge.IsClaimed ? "[已领取] " : "")}{challenge.Title}</color>";
                if (t.name.Contains("Desc"))
                    t.text = challenge.Description;
                if (t.name.Contains("Obj"))
                {
                    string done = challenge.Objective.IsCompleted ? "✓" : "·";
                    t.text = $"{done} {challenge.Objective.Description} ({challenge.Objective.CurrentCount}/{challenge.Objective.TargetCount})";
                }
                if (t.name.Contains("Reward"))
                    t.text = $"奖励: {ResourceKeyToName(challenge.RewardResourceKey)}×{challenge.RewardAmount}";
            }

            var buttons = go.GetComponentsInChildren<Button>();
            foreach (var btn in buttons)
            {
                if (btn.name.Contains("Claim"))
                {
                    btn.gameObject.SetActive(challenge.IsCompleted && !challenge.IsClaimed);
                    btn.onClick.AddListener(() =>
                    {
                        DailyChallengeManager.Instance.ClaimReward(challenge);
                        RefreshDailyList();
                    });
                }
            }
        }

        private void UpdateResourceDisplay()
        {
            if (ResourceManager.Instance == null) return;
            if (SeedsText != null) SeedsText.text = $"种子: {ResourceManager.Instance.CurrentResources.Seeds}";
            if (NutrientsText != null) NutrientsText.text = $"营养: {ResourceManager.Instance.CurrentResources.Nutrients}";
            if (CreditsText != null) CreditsText.text = $"积分: {ResourceManager.Instance.CurrentResources.Credits}";
        }

        private void ShowQuestNotice(string message)
        {
            if (NewQuestNotice == null || NoticeText == null) return;
            NoticeText.text = message;
            NewQuestNotice.SetActive(true);
            CancelInvoke(nameof(HideNotice));
            Invoke(nameof(HideNotice), 2.5f);
        }

        private void HideNotice()
        {
            if (NewQuestNotice != null) NewQuestNotice.SetActive(false);
        }

        private void ClearQuestObjects()
        {
            foreach (var go in _questObjects) if (go != null) Destroy(go);
            _questObjects.Clear();
        }

        private void ClearChallengeObjects()
        {
            foreach (var go in _challengeObjects) if (go != null) Destroy(go);
            _challengeObjects.Clear();
        }

        private static string ResourceKeyToName(string key)
        {
            return key switch
            {
                "Seeds" => "种子",
                "Nutrients" => "营养素",
                "Credits" => "积分",
                _ => key
            };
        }
    }
}
