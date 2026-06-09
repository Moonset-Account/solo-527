using System.Collections.Generic;
using System.Reflection;
using BeatRunner.Audio;
using BeatRunner.Core;
using BeatRunner.Resources;
using UnityEngine;
using UnityEngine.UI;

namespace BeatRunner.SceneBuild
{
    public static partial class UIBuilder
    {
        private static readonly BindingFlags Flags = BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public;
        private static readonly Color AccentYellow = new Color(1f, 0.85f, 0.3f);

        private static void SetField(object target, string name, object value)
        {
            var type = target.GetType();
            var f = type.GetField(name, Flags);
            if (f == null)
            {
                var baseT = type.BaseType;
                while (baseT != null)
                {
                    f = baseT.GetField(name, Flags);
                    if (f != null) break;
                    baseT = baseT.BaseType;
                }
            }
            if (f != null) f.SetValue(target, value);
        }

        private static void PositionChild(Transform t, float xMin, float yMin, float xMax, float yMax)
        {
            var rt = (RectTransform)t;
            rt.anchorMin = new Vector2(xMin, yMin);
            rt.anchorMax = new Vector2(xMax, yMax);
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }

        public static UI.MainMenu BuildMainMenu(Transform canvasT)
        {
            var root = UIFactory.MakePanel("MainMenuRoot", canvasT,
                new Color(0.04f, 0.06f, 0.12f, 1f), Vector2.zero, Vector2.one);
            var script = root.AddComponent<UI.MainMenu>();

            var title = UIFactory.MakeText("Title", root.transform, "<b>节拍跑酷</b>", 72,
                UIFactory.AccentCyan, TextAnchor.UpperCenter);
            PositionChild(title.transform, 0, 0.85f, 1, 1);
            title.rectTransform.offsetMin = new Vector2(0, 20);
            title.rectTransform.offsetMax = new Vector2(0, -30);

            var sub = UIFactory.MakeText("Subtitle", root.transform, "Beat Runner - Rhythm Parkour", 24,
                new Color(0.55f, 0.75f, 1f), TextAnchor.UpperCenter);
            PositionChild(sub.transform, 0, 0.78f, 1, 0.86f);

            UIFactory.MakeImage("PanelTracks", root.transform,
                new Vector2(0.03f, 0.12f), new Vector2(0.47f, 0.75f),
                new Color(0.08f, 0.1f, 0.18f, 0.85f));

            var tl = UIFactory.MakeText("TracksLabel", root.transform, "曲 目 库", 28,
                UIFactory.AccentBlue, TextAnchor.UpperLeft);
            PositionChild(tl.transform, 0.04f, 0.70f, 0.46f, 0.75f);

            RectTransform trackContent;
            UIFactory.MakeScrollList("TrackList", root.transform,
                new Vector2(0.04f, 0.14f), new Vector2(0.46f, 0.68f), out trackContent);

            UIFactory.MakeImage("PanelInfo", root.transform,
                new Vector2(0.52f, 0.42f), new Vector2(0.97f, 0.75f),
                new Color(0.08f, 0.1f, 0.18f, 0.85f));

            var cover = UIFactory.MakeImage("CoverArt", root.transform,
                new Vector2(0.54f, 0.50f), new Vector2(0.68f, 0.72f),
                new Color(0.3f, 0.6f, 1f));
            var selName = UIFactory.MakeText("SelectedName", root.transform, "选择曲目", 36,
                Color.white, TextAnchor.UpperLeft);
            PositionChild(selName.transform, 0.70f, 0.55f, 0.95f, 0.70f);
            var artistT = UIFactory.MakeText("ArtistText", root.transform, "", 22,
                UIFactory.TextMuted, TextAnchor.UpperLeft);
            PositionChild(artistT.transform, 0.70f, 0.48f, 0.95f, 0.55f);
            var bpmT = UIFactory.MakeText("BpmText", root.transform, "", 20,
                UIFactory.AccentCyan, TextAnchor.UpperLeft);
            PositionChild(bpmT.transform, 0.70f, 0.43f, 0.95f, 0.48f);
            var desc = UIFactory.MakeText("DescText", root.transform, "", 16,
                UIFactory.TextMuted, TextAnchor.UpperLeft);
            PositionChild(desc.transform, 0.54f, 0.20f, 0.95f, 0.42f);

            UIFactory.MakeImage("DiffPanel", root.transform,
                new Vector2(0.52f, 0.20f), new Vector2(0.97f, 0.38f),
                new Color(0.08f, 0.1f, 0.18f, 0.85f));

            var dLbl = UIFactory.MakeText("DiffLbl", root.transform, "难度", 22,
                UIFactory.AccentBlue, TextAnchor.UpperLeft);
            PositionChild(dLbl.transform, 0.54f, 0.32f, 0.65f, 0.36f);

            Text dVal;
            var dSlider = UIFactory.MakeSlider("Difficulty", root.transform,
                new Vector2(0.66f, 0.26f), new Vector2(0.84f, 0.32f), 0, 2, 1, out dVal);
            var dValLbl = UIFactory.MakeText("DiffValue", root.transform, "", 24,
                Color.white, TextAnchor.UpperRight);
            PositionChild(dValLbl.transform, 0.86f, 0.22f, 0.96f, 0.32f);

            UIFactory.MakeImage("SkinsPanel", root.transform,
                new Vector2(0.03f, 0.02f), new Vector2(0.97f, 0.09f),
                new Color(0.08f, 0.1f, 0.18f, 0.85f));

            RectTransform skinContent;
            UIFactory.MakeScrollList("SkinList", root.transform,
                new Vector2(0.04f, 0.03f), new Vector2(0.68f, 0.085f), out skinContent);

            var skinNameLbl = UIFactory.MakeText("SkinNameLabel", root.transform, "当前皮肤：默认", 20,
                UIFactory.TextMuted, TextAnchor.MiddleRight);
            PositionChild(skinNameLbl.transform, 0.70f, 0.03f, 0.93f, 0.09f);

            var skinPrev = UIFactory.MakeImage("SkinPreview", root.transform,
                new Vector2(0.93f, 0.035f), new Vector2(0.97f, 0.085f), Color.white);

            UIFactory.MakeImage("StatsPanel", root.transform,
                new Vector2(0.52f, 0.42f), new Vector2(0.97f, 0.42f),
                new Color(0, 0, 0, 0));

            var statsPanel2 = UIFactory.MakeImage("StatsPanel2", root.transform,
                new Vector2(0.03f, 0.095f), new Vector2(0.30f, 0.115f),
                new Color(0, 0, 0, 0));

            var fragsText = UIFactory.MakeText("FragmentsText", root.transform, "碎片：0", 20,
                UIFactory.AccentCyan, TextAnchor.MiddleLeft);
            PositionChild(fragsText.transform, 0.54f, 0.37f, 0.75f, 0.41f);
            var unlockedText = UIFactory.MakeText("UnlockedText", root.transform, "已解锁：0/5", 18,
                UIFactory.TextMuted, TextAnchor.MiddleLeft);
            PositionChild(unlockedText.transform, 0.54f, 0.33f, 0.75f, 0.37f);

            Text sLbl, tLbl, seLbl, qLbl;
            var startBtn = UIFactory.MakeButton("StartBtn", root.transform,
                new Vector2(0.52f, 0.10f), new Vector2(0.75f, 0.19f), "开 始", 32,
                out sLbl, UIFactory.AccentBlue);
            var tutBtn = UIFactory.MakeButton("TutorialBtn", root.transform,
                new Vector2(0.76f, 0.10f), new Vector2(0.85f, 0.19f), "教程", 22, out tLbl);
            var setBtn = UIFactory.MakeButton("SettingsBtn", root.transform,
                new Vector2(0.86f, 0.10f), new Vector2(0.91f, 0.19f), "设置", 22, out seLbl);
            var quitBtn = UIFactory.MakeButton("QuitBtn", root.transform,
                new Vector2(0.92f, 0.10f), new Vector2(0.97f, 0.19f), "退出", 22, out qLbl,
                new Color(0.6f, 0.2f, 0.25f));

            SetField(script, "_mainMenuRoot", root);
            SetField(script, "_trackListContainer", trackContent);
            SetField(script, "_trackItemPrefab", MakeTrackItemPrefab());
            SetField(script, "_selectedTrackName", selName);
            SetField(script, "_selectedTrackArtist", artistT);
            SetField(script, "_selectedTrackBpm", bpmT);
            SetField(script, "_selectedTrackDescription", desc);
            SetField(script, "_selectedTrackCover", cover);
            SetField(script, "_difficultySlider", dSlider);
            SetField(script, "_difficultyText", dValLbl);

            SetField(script, "_skinListContainer", skinContent);
            SetField(script, "_skinItemPrefab", MakeSkinItemPrefab());
            SetField(script, "_selectedSkinName", (Text)skinNameLbl);
            SetField(script, "_skinPreview", skinPrev);

            SetField(script, "_totalFragmentsText", fragsText);
            SetField(script, "_unlockedTracksText", unlockedText);

            SetField(script, "_startBtn", startBtn);
            SetField(script, "_tutorialBtn", tutBtn);
            SetField(script, "_settingsBtn", setBtn);
            SetField(script, "_quitBtn", quitBtn);

            root.SetActive(false);
            return script;
        }

        private static GameObject MakeTrackItemPrefab()
        {
            var go = new GameObject("TrackItemPrefab", typeof(RectTransform), typeof(LayoutElement),
                typeof(Image), typeof(Button));
            var rt = (RectTransform)go.transform;
            rt.sizeDelta = new Vector2(0, 64);
            var le = go.GetComponent<LayoutElement>();
            le.minHeight = 64;
            le.preferredHeight = 64;
            var img = go.GetComponent<Image>();
            img.sprite = RuntimeContentLoader.GetWhiteSprite();
            img.color = new Color(0.15f, 0.2f, 0.32f, 1f);

            var cover = UIFactory.MakeImage("Cover", go.transform,
                new Vector2(0, 0.1f), new Vector2(0.13f, 0.9f), new Color(0.3f, 0.6f, 1f));

            var name = UIFactory.MakeText("Name", go.transform, "Track Name", 22,
                Color.white, TextAnchor.MiddleLeft);
            var nrt = name.rectTransform;
            nrt.anchorMin = new Vector2(0.16f, 0.5f);
            nrt.anchorMax = new Vector2(0.72f, 0.95f);
            nrt.offsetMin = Vector2.zero;
            nrt.offsetMax = Vector2.zero;

            var artist = UIFactory.MakeText("Artist", go.transform, "Artist", 16,
                UIFactory.TextMuted, TextAnchor.MiddleLeft);
            var art = artist.rectTransform;
            art.anchorMin = new Vector2(0.16f, 0.05f);
            art.anchorMax = new Vector2(0.72f, 0.50f);
            art.offsetMin = Vector2.zero;
            art.offsetMax = Vector2.zero;

            var bpm = UIFactory.MakeText("Bpm", go.transform, "120 BPM", 18,
                UIFactory.AccentCyan, TextAnchor.MiddleRight);
            var brt = bpm.rectTransform;
            brt.anchorMin = new Vector2(0.75f, 0.40f);
            brt.anchorMax = new Vector2(0.97f, 0.95f);
            brt.offsetMin = Vector2.zero;
            brt.offsetMax = Vector2.zero;

            var lockT = UIFactory.MakeText("Lock", go.transform, "", 14,
                new Color(1f, 0.8f, 0.3f), TextAnchor.MiddleRight);
            var lrt = lockT.rectTransform;
            lrt.anchorMin = new Vector2(0.75f, 0.05f);
            lrt.anchorMax = new Vector2(0.97f, 0.40f);
            lrt.offsetMin = Vector2.zero;
            lrt.offsetMax = Vector2.zero;

            go.SetActive(false);
            return go;
        }

        private static GameObject MakeSkinItemPrefab()
        {
            var go = new GameObject("SkinItemPrefab", typeof(RectTransform), typeof(LayoutElement),
                typeof(HorizontalLayoutGroup), typeof(Image), typeof(Button));
            var rt = (RectTransform)go.transform;
            rt.sizeDelta = new Vector2(140, 52);
            var le = go.GetComponent<LayoutElement>();
            le.minWidth = 140;
            le.minHeight = 52;
            le.preferredWidth = 140;
            le.preferredHeight = 52;
            var hlg = go.GetComponent<HorizontalLayoutGroup>();
            hlg.padding = new RectOffset(6, 6, 6, 6);
            hlg.spacing = 8;
            hlg.childForceExpandHeight = true;
            hlg.childForceExpandWidth = false;
            hlg.childControlHeight = true;
            hlg.childControlWidth = false;
            var img = go.GetComponent<Image>();
            img.sprite = RuntimeContentLoader.GetWhiteSprite();
            img.color = new Color(0.15f, 0.2f, 0.32f, 1f);

            var color = UIFactory.MakeImage("Color", go.transform, Vector2.zero, Vector2.zero, Color.white);
            var crt = color.rectTransform;
            crt.sizeDelta = new Vector2(40, 40);

            var name = UIFactory.MakeText("Name", go.transform, "Default", 18,
                Color.white, TextAnchor.MiddleLeft);
            var nrt = name.rectTransform;
            nrt.sizeDelta = new Vector2(80, 40);

            go.SetActive(false);
            return go;
        }
    }
}
