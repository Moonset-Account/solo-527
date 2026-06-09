using System;
using System.Collections.Generic;
using UnityEngine;

namespace PixelPlantLab
{
    public class QuestManager : MonoBehaviour
    {
        public static QuestManager Instance { get; private set; }

        private readonly List<Quest> _quests = new List<Quest>();
        private readonly Dictionary<string, Quest> _questLookup = new Dictionary<string, Quest>();

        public event Action<Quest> OnQuestProgressUpdated;
        public event Action<Quest> OnQuestCompleted;
        public event Action<Quest, ResourceData> OnQuestRewardsClaimed;

        public IReadOnlyList<Quest> AllQuests => _quests;

        private void Awake()
        {
            InitializeSingleton();
        }

        public void InitializeSingleton()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            InitializeTutorialQuests();
        }

        private void InitializeTutorialQuests()
        {
            var quest1 = new Quest("tutorial_01",
                "初识实验",
                "欢迎来到像素植物实验室！先完成你的第一次实验吧——无论结果如何，都会被记录到图鉴中。",
                isTutorial: true, orderIndex: 1);
            quest1.AddObjective("完成任意 1 次实验", 1);
            quest1.AddObjective("在图鉴中查看结果", 1);
            quest1.AddReward("Seeds", 3);
            quest1.AddReward("Nutrients", 3);
            quest1.AddReward("Credits", 30);
            AddQuestInternal(quest1);

            var quest2 = new Quest("tutorial_02",
                "失败也有价值",
                "并非每次实验都能成功。故意制造一次失败（如极度缺水或营养失衡），观察失败样本同样会进入图鉴，帮助你完善记录！",
                isTutorial: true, orderIndex: 2);
            quest2.AddObjective("获得 2 种不同的失败植物", 2);
            quest2.AddObjective("在图鉴中查看失败样本的首次配方", 1);
            quest2.AddReward("Seeds", 5);
            quest2.AddReward("Nutrients", 4);
            quest2.AddReward("Credits", 50);
            AddQuestInternal(quest2);

            var quest3 = new Quest("tutorial_03",
                "探索突变",
                "掌握配方的力量！均衡的营养、合适的光照水分会大幅提升稀有突变概率。使用日志和图鉴追溯配方，找到你的第一株稀有植物。",
                isTutorial: true, orderIndex: 3);
            quest3.AddObjective("发现任意 1 种稀有植物", 1);
            quest3.AddObjective("通过图鉴或日志的「载入配方」功能复制上次参数", 1);
            quest3.AddObjective("使用同一配方重复实验 2 次，观察概率变化", 2);
            quest3.AddReward("Seeds", 8);
            quest3.AddReward("Nutrients", 8);
            quest3.AddReward("Credits", 100);
            AddQuestInternal(quest3);
        }

        private void AddQuestInternal(Quest quest)
        {
            _quests.Add(quest);
            _questLookup[quest.Id] = quest;
        }

        public Quest GetQuest(string id)
        {
            return _questLookup.ContainsKey(id) ? _questLookup[id] : null;
        }

        public List<Quest> GetTutorialQuests()
        {
            return _quests.FindAll(q => q.IsTutorial);
        }

        public Quest GetCurrentTutorialQuest()
        {
            var tutorials = GetTutorialQuests();
            tutorials.Sort((a, b) => a.OrderIndex.CompareTo(b.OrderIndex));
            foreach (var q in tutorials)
            {
                if (!q.IsCompleted) return q;
            }
            return null;
        }

        public void NotifyExperimentCompleted(PlantMutation result, bool isFirstDiscovery, ExperimentParams @params)
        {
            var tutorial1 = GetQuest("tutorial_01");
            if (tutorial1 != null && !tutorial1.Objectives[0].IsCompleted)
            {
                tutorial1.UpdateProgress(0);
                NotifyProgress(tutorial1);
            }

            if (result != null && result.Rarity == Rarity.Failure)
            {
                var tutorial2 = GetQuest("tutorial_02");
                if (tutorial2 != null && isFirstDiscovery)
                {
                    int failures = CountFailureTypesDiscovered();
                    int needed = tutorial2.Objectives[0].TargetCount;
                    int delta = Math.Min(needed, failures) - tutorial2.Objectives[0].CurrentCount;
                    if (delta > 0) tutorial2.UpdateProgress(0, delta);
                    NotifyProgress(tutorial2);
                }
            }

            if (result != null && result.Rarity >= Rarity.Rare)
            {
                var tutorial3 = GetQuest("tutorial_03");
                if (tutorial3 != null && !tutorial3.Objectives[0].IsCompleted && isFirstDiscovery)
                {
                    tutorial3.UpdateProgress(0);
                    NotifyProgress(tutorial3);
                }
            }

            CheckQuestCompletion();
        }

        public void NotifyDexViewed(string plantId)
        {
            var tutorial1 = GetQuest("tutorial_01");
            if (tutorial1 != null && tutorial1.Objectives[0].IsCompleted && !tutorial1.Objectives[1].IsCompleted)
            {
                tutorial1.UpdateProgress(1);
                NotifyProgress(tutorial1);
            }

            var plant = PlantDatabase.GetPlant(plantId);
            if (plant != null && plant.Rarity == Rarity.Failure)
            {
                var tutorial2 = GetQuest("tutorial_02");
                if (tutorial2 != null && tutorial2.Objectives[0].IsCompleted && !tutorial2.Objectives[1].IsCompleted)
                {
                    tutorial2.UpdateProgress(1);
                    NotifyProgress(tutorial2);
                }
            }
            CheckQuestCompletion();
        }

        public void NotifyRecipeLoadedFromDexOrLog()
        {
            var tutorial3 = GetQuest("tutorial_03");
            if (tutorial3 != null && !tutorial3.Objectives[1].IsCompleted)
            {
                tutorial3.UpdateProgress(1);
                NotifyProgress(tutorial3);
            }
            CheckQuestCompletion();
        }

        public void NotifySameRecipeExperimentRun(ExperimentParams p, int runCount)
        {
            var tutorial3 = GetQuest("tutorial_03");
            if (tutorial3 != null && tutorial3.Objectives[0].IsCompleted && !tutorial3.Objectives[2].IsCompleted)
            {
                if (runCount >= 2)
                {
                    tutorial3.Objectives[2].CurrentCount = runCount;
                    if (runCount >= tutorial3.Objectives[2].TargetCount)
                    {
                        tutorial3.Objectives[2].IsCompleted = true;
                    }
                    NotifyProgress(tutorial3);
                }
            }
            CheckQuestCompletion();
        }

        private int CountFailureTypesDiscovered()
        {
            if (DexManager.Instance == null) return 0;
            int count = 0;
            foreach (var plant in PlantDatabase.GetPlantsByRarity(Rarity.Failure))
            {
                if (DexManager.Instance.IsDiscovered(plant.Id)) count++;
            }
            return count;
        }

        private void NotifyProgress(Quest q)
        {
            OnQuestProgressUpdated?.Invoke(q);
        }

        private void CheckQuestCompletion()
        {
            foreach (var q in _quests)
            {
                bool prev = q.IsCompleted;
                bool allDone = true;
                foreach (var obj in q.Objectives)
                {
                    if (!obj.IsCompleted) { allDone = false; break; }
                }
                q.IsCompleted = allDone;
                if (!prev && q.IsCompleted)
                {
                    OnQuestCompleted?.Invoke(q);
                }
            }
        }

        public bool ClaimQuestRewards(Quest quest)
        {
            if (quest == null || !quest.IsCompleted || quest.IsClaimed) return false;
            if (ResourceManager.Instance == null) return false;

            quest.IsClaimed = true;
            var reward = new ResourceData();
            for (int i = 0; i < quest.RewardResourceKeys.Count; i++)
            {
                string key = quest.RewardResourceKeys[i];
                int amt = i < quest.RewardAmounts.Count ? quest.RewardAmounts[i] : 0;
                switch (key)
                {
                    case "Seeds": reward.Seeds += amt; break;
                    case "Nutrients": reward.Nutrients += amt; break;
                    case "Credits": reward.Credits += amt; break;
                }
            }
            ResourceManager.Instance.AddResources(reward);
            OnQuestRewardsClaimed?.Invoke(quest, reward);
            return true;
        }
    }
}
