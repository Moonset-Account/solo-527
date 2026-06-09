using System;
using System.Collections.Generic;
using UnityEngine;

namespace PixelPlantLab
{
    public static class PlantDatabase
    {
        private static readonly List<PlantMutation> _allPlants = new List<PlantMutation>();
        private static readonly Dictionary<string, PlantMutation> _plantLookup = new Dictionary<string, PlantMutation>();

        public static IReadOnlyList<PlantMutation> AllPlants => _allPlants;

        static PlantDatabase()
        {
            InitPlants();
        }

        private static void InitPlants()
        {
            AddPlant(new PlantMutation("sprout_normal", "普通幼苗", "健康生长的标准幼苗，没什么特别的。",
                Rarity.Common, MutationTrait.None, "sprout_01"));

            AddPlant(new PlantMutation("leafy_green", "茂盛绿叶", "叶片饱满，绿意盎然。",
                Rarity.Common, MutationTrait.Fruity, "leafy_01"));

            AddPlant(new PlantMutation("sunny_bloom", "向阳花", "花瓣总是朝向光源方向。",
                Rarity.Common, MutationTrait.Fruity, "flower_01"));

            AddPlant(new PlantMutation("cactus_small", "迷你仙人掌", "耐旱的小家伙，刺很柔软。",
                Rarity.Common, MutationTrait.Spiky, "cactus_01"));

            AddPlant(new PlantMutation("moss_cluster", "苔藓团", "湿润环境下生长的密集苔藓。",
                Rarity.Common, MutationTrait.None, "moss_01"));

            AddPlant(new PlantMutation("vine_sprout", "藤蔓初芽", "已经能看到小小的卷须了。",
                Rarity.Common, MutationTrait.None, "vine_01"));

            AddPlant(new PlantMutation("glow_shroom", "荧光菌菇", "菌盖在暗处散发微弱蓝光。",
                Rarity.Rare, MutationTrait.Glowing, "shroom_01"));

            AddPlant(new PlantMutation("crystal_flower", "晶簇花", "花瓣结晶化，折射出彩虹光泽。",
                Rarity.Rare, MutationTrait.Crystalline | MutationTrait.Rainbow, "crystal_01"));

            AddPlant(new PlantMutation("giant_sprout", "巨型幼苗", "比同类大出三倍！生长旺盛。",
                Rarity.Rare, MutationTrait.Giant | MutationTrait.Fruity, "giant_01"));

            AddPlant(new PlantMutation("mini_bonsai", "迷你盆景", "完美的微型树木，自带禅意。",
                Rarity.Rare, MutationTrait.Miniature, "bonsai_01"));

            AddPlant(new PlantMutation("poison_ivy", "剧毒藤蔓", "警告：请勿直接接触叶片。",
                Rarity.Rare, MutationTrait.Poisonous | MutationTrait.Spiky, "poison_01"));

            AddPlant(new PlantMutation("burning_lily", "火焰百合", "花瓣如火焰般跃动，温度却正常。",
                Rarity.Rare, MutationTrait.Burning | MutationTrait.Glowing, "flame_01"));

            AddPlant(new PlantMutation("frost_fern", "冰霜蕨", "叶片永远覆盖着一层薄霜。",
                Rarity.Rare, MutationTrait.Frozen | MutationTrait.Crystalline, "frost_01"));

            AddPlant(new PlantMutation("spark_moss", "电光苔", "触碰时会有轻微的麻感。",
                Rarity.Rare, MutationTrait.Electric | MutationTrait.Glowing, "spark_01"));

            AddPlant(new PlantMutation("ghost_weed", "幽灵草", "半透明的叶片，时而消失时而显现。",
                Rarity.Rare, MutationTrait.Invisible | MutationTrait.Glowing, "ghost_01"));

            AddPlant(new PlantMutation("hydra_head", "九头芽", "顶端分裂出多个生长点。",
                Rarity.Rare, MutationTrait.MultiHead, "hydra_01"));

            AddPlant(new PlantMutation("flying_dandelion", "飞行蒲公英", "种子带着小翅膀，会悬浮。",
                Rarity.Rare, MutationTrait.Winged | MutationTrait.Miniature, "dandelion_01"));

            AddPlant(new PlantMutation("aurora_bloom", "极光花", "花瓣呈现流动的极光色彩。",
                Rarity.Legendary, MutationTrait.Rainbow | MutationTrait.Glowing | MutationTrait.Invisible, "aurora_01"));

            AddPlant(new PlantMutation("dragon_tree", "龙晶树", "传说中的金属木质，坚硬无比。",
                Rarity.Legendary, MutationTrait.Metallic | MutationTrait.Crystalline | MutationTrait.Spiky | MutationTrait.Giant, "dragon_01"));

            AddPlant(new PlantMutation("phoenix_rose", "凤凰玫瑰", "花瓣燃烧后会重生。",
                Rarity.Legendary, MutationTrait.Burning | MutationTrait.Glowing | MutationTrait.MultiHead | MutationTrait.Rainbow, "phoenix_01"));

            AddPlant(new PlantMutation("wither_bones", "枯骨花", "脱水过度，已经彻底枯萎。",
                Rarity.Failure, MutationTrait.Withered, "wither_01"));

            AddPlant(new PlantMutation("mold_mess", "霉团", "水分过多导致发霉，不能用了。",
                Rarity.Failure, MutationTrait.Moldy, "mold_01"));

            AddPlant(new PlantMutation("stunt_dwarf", "侏儒残株", "营养失衡，发育不良。",
                Rarity.Failure, MutationTrait.Stunted | MutationTrait.Miniature, "stunt_01"));

            AddPlant(new PlantMutation("burn_scorch", "焦黑残体", "光照过强，被烤焦了。",
                Rarity.Failure, MutationTrait.Withered | MutationTrait.Burning, "scorch_01"));

            AddPlant(new PlantMutation("rot_puddle", "腐烂糊", "完全失败的实验，只剩一滩烂泥。",
                Rarity.Failure, MutationTrait.Moldy | MutationTrait.Withered, "rot_01"));
        }

        private static void AddPlant(PlantMutation plant)
        {
            _allPlants.Add(plant);
            _plantLookup[plant.Id] = plant;
        }

        public static PlantMutation GetPlant(string id)
        {
            return _plantLookup.ContainsKey(id) ? _plantLookup[id] : null;
        }

        public static List<PlantMutation> GetPlantsByRarity(Rarity rarity)
        {
            return _allPlants.FindAll(p => p.Rarity == rarity);
        }

        public static List<PlantMutation> GetPlantsWithTrait(MutationTrait trait)
        {
            return _allPlants.FindAll(p => p.HasTrait(trait));
        }
    }
}
