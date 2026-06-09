using System;
using System.Collections.Generic;
using BeatRunner.Data;
using UnityEngine;

namespace BeatRunner.EditorTools
{
    public static class CsvLevelImporter
    {
        public class CsvNoteRow
        {
            public int beatIndex;
            public float beatOffset;
            public int trackIndex;
            public string type;
            public int fragmentValue;
        }

        public static LevelData ImportFromCsv(string csvText, string levelId, string levelName, int difficulty)
        {
            var level = new LevelData
            {
                levelId = levelId,
                levelName = levelName,
                difficulty = difficulty,
                startDelay = 4f,
                endDelay = 2f,
                beatsPerMeasure = 4
            };

            var rows = ParseCsv(csvText);
            int maxBeat = 0;

            foreach (var row in rows)
            {
                var note = new NoteData
                {
                    beatIndex = row.beatIndex,
                    beatOffset = row.beatOffset,
                    trackIndex = Mathf.Clamp(row.trackIndex, 0, 2),
                    fragmentValue = row.fragmentValue
                };

                switch (row.type.ToLower())
                {
                    case "jump": case "j": note.type = NoteType.Jump; break;
                    case "slide": case "s": note.type = NoteType.Slide; break;
                    case "obstacle_high": case "oh": case "high": note.type = NoteType.ObstacleHigh; break;
                    case "obstacle_low": case "ol": case "low": note.type = NoteType.ObstacleLow; break;
                    case "fragment": case "f": case "coin":
                        note.type = NoteType.Fragment;
                        if (note.fragmentValue <= 0) note.fragmentValue = 1;
                        break;
                    default: note.type = NoteType.Fragment; break;
                }

                level.notes.Add(note);
                if (row.beatIndex > maxBeat) maxBeat = row.beatIndex;
            }

            level.startBeat = 0;
            level.endBeat = maxBeat + 8;
            level.notes.Sort((a, b) =>
            {
                float ta = a.beatIndex + a.beatOffset;
                float tb = b.beatIndex + b.beatOffset;
                return ta.CompareTo(tb);
            });

            return level;
        }

        public static List<CsvNoteRow> ParseCsv(string csvText)
        {
            var result = new List<CsvNoteRow>();
            var lines = csvText.Split(new[] { '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
            bool firstLine = true;

            foreach (var line in lines)
            {
                if (firstLine)
                {
                    firstLine = false;
                    if (line.ToLower().Contains("beat")) continue;
                }

                var cols = line.Split(',');
                if (cols.Length < 3) continue;

                var row = new CsvNoteRow();
                if (int.TryParse(cols[0].Trim(), out int beat)) row.beatIndex = beat;
                if (cols.Length > 1 && float.TryParse(cols[1].Trim(), out float offset)) row.beatOffset = offset;
                if (cols.Length > 2 && int.TryParse(cols[2].Trim(), out int track)) row.trackIndex = track;
                if (cols.Length > 3) row.type = cols[3].Trim();
                if (cols.Length > 4 && int.TryParse(cols[4].Trim(), out int val)) row.fragmentValue = val;

                result.Add(row);
            }
            return result;
        }

        public static string ExportLevelToCsv(LevelData level)
        {
            var csv = new System.Text.StringBuilder();
            csv.AppendLine("beat,offset,track,type,fragments");
            foreach (var note in level.notes)
            {
                string typeStr = note.type.ToString().ToLower();
                csv.AppendLine($"{note.beatIndex},{note.beatOffset:F2},{note.trackIndex},{typeStr},{note.fragmentValue}");
            }
            return csv.ToString();
        }
    }
}
