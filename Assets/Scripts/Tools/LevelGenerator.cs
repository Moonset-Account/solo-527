using System.Collections.Generic;
using BeatRunner.Core;
using BeatRunner.Data;
using UnityEngine;

namespace BeatRunner.Tools
{
    public static class LevelGenerator
    {
        public static LevelData GenerateTutorialLevel()
        {
            var level = new LevelData
            {
                levelId = "tutorial",
                levelName = "教程",
                difficulty = 0,
                startDelay = 3f,
                endDelay = 2f,
                beatsPerMeasure = 4,
                startBeat = 0,
                endBeat = 32
            };

            int beat = 4;
            level.notes.Add(new NoteData
            {
                type = NoteType.Fragment,
                trackIndex = 1,
                beatIndex = beat,
                fragmentValue = 1
            });

            beat = 8;
            level.notes.Add(new NoteData
            {
                type = NoteType.Jump,
                trackIndex = 1,
                beatIndex = beat
            });
            level.notes.Add(new NoteData
            {
                type = NoteType.Fragment,
                trackIndex = 1,
                beatIndex = beat,
                fragmentValue = 2
            });

            beat = 12;
            level.notes.Add(new NoteData
            {
                type = NoteType.Fragment,
                trackIndex = 0,
                beatIndex = beat,
                fragmentValue = 1
            });

            beat = 13;
            level.notes.Add(new NoteData
            {
                type = NoteType.Fragment,
                trackIndex = 1,
                beatIndex = beat,
                fragmentValue = 1
            });

            beat = 14;
            level.notes.Add(new NoteData
            {
                type = NoteType.Fragment,
                trackIndex = 2,
                beatIndex = beat,
                fragmentValue = 1
            });

            beat = 16;
            level.notes.Add(new NoteData
            {
                type = NoteType.Slide,
                trackIndex = 1,
                beatIndex = beat
            });
            level.notes.Add(new NoteData
            {
                type = NoteType.Fragment,
                trackIndex = 1,
                beatIndex = beat,
                fragmentValue = 2
            });

            beat = 20;
            level.notes.Add(new NoteData
            {
                type = NoteType.ObstacleHigh,
                trackIndex = 0,
                beatIndex = beat
            });
            level.notes.Add(new NoteData
            {
                type = NoteType.ObstacleLow,
                trackIndex = 1,
                beatIndex = beat
            });
            level.notes.Add(new NoteData
            {
                type = NoteType.Fragment,
                trackIndex = 2,
                beatIndex = beat,
                fragmentValue = 2
            });

            beat = 24;
            level.notes.Add(new NoteData
            {
                type = NoteType.Jump,
                trackIndex = 0,
                beatIndex = beat
            });
            level.notes.Add(new NoteData
            {
                type = NoteType.Fragment,
                trackIndex = 0,
                beatIndex = beat,
                fragmentValue = 1
            });

            beat = 25;
            level.notes.Add(new NoteData
            {
                type = NoteType.Slide,
                trackIndex = 1,
                beatIndex = beat
            });
            level.notes.Add(new NoteData
            {
                type = NoteType.Fragment,
                trackIndex = 1,
                beatIndex = beat,
                fragmentValue = 1
            });

            beat = 26;
            level.notes.Add(new NoteData
            {
                type = NoteType.Jump,
                trackIndex = 2,
                beatIndex = beat
            });
            level.notes.Add(new NoteData
            {
                type = NoteType.Fragment,
                trackIndex = 2,
                beatIndex = beat,
                fragmentValue = 1
            });

            beat = 28;
            for (int i = 0; i < 8; i++)
            {
                level.notes.Add(new NoteData
                {
                    type = NoteType.Fragment,
                    trackIndex = i % 3,
                    beatIndex = beat + i / 2,
                    beatOffset = (i % 2) * 0.5f,
                    fragmentValue = 1
                });
            }

            return level;
        }

        public static LevelData GenerateLevelEasy(float bpm, int totalMeasures = 32)
        {
            var level = new LevelData
            {
                levelId = "easy",
                levelName = "简单",
                difficulty = 0,
                startDelay = 4f,
                endDelay = 2f,
                beatsPerMeasure = 4,
                startBeat = 0,
                endBeat = totalMeasures * 4
            };

            System.Random rng = new System.Random(42);

            for (int measure = 2; measure < totalMeasures - 2; measure++)
            {
                int baseBeat = measure * 4;
                int pattern = rng.Next(4);

                switch (pattern)
                {
                    case 0:
                        level.notes.Add(new NoteData
                        {
                            type = NoteType.Fragment,
                            trackIndex = rng.Next(3),
                            beatIndex = baseBeat,
                            fragmentValue = 1
                        });
                        level.notes.Add(new NoteData
                        {
                            type = NoteType.Fragment,
                            trackIndex = rng.Next(3),
                            beatIndex = baseBeat + 2,
                            fragmentValue = 1
                        });
                        break;

                    case 1:
                        int track = rng.Next(3);
                        level.notes.Add(new NoteData
                        {
                            type = NoteType.Jump,
                            trackIndex = track,
                            beatIndex = baseBeat
                        });
                        level.notes.Add(new NoteData
                        {
                            type = NoteType.Fragment,
                            trackIndex = track,
                            beatIndex = baseBeat,
                            fragmentValue = 2
                        });
                        break;

                    case 2:
                        int track2 = rng.Next(3);
                        level.notes.Add(new NoteData
                        {
                            type = NoteType.Slide,
                            trackIndex = track2,
                            beatIndex = baseBeat
                        });
                        level.notes.Add(new NoteData
                        {
                            type = NoteType.Fragment,
                            trackIndex = track2,
                            beatIndex = baseBeat,
                            fragmentValue = 2
                        });
                        break;

                    case 3:
                        for (int i = 0; i < 3; i++)
                        {
                            level.notes.Add(new NoteData
                            {
                                type = NoteType.Fragment,
                                trackIndex = i,
                                beatIndex = baseBeat + i,
                                fragmentValue = 1
                            });
                        }
                        break;
                }
            }

            return level;
        }

        public static LevelData GenerateLevelNormal(float bpm, int totalMeasures = 48)
        {
            var level = new LevelData
            {
                levelId = "normal",
                levelName = "普通",
                difficulty = 1,
                startDelay = 3f,
                endDelay = 2f,
                beatsPerMeasure = 4,
                startBeat = 0,
                endBeat = totalMeasures * 4
            };

            System.Random rng = new System.Random(123);

            for (int measure = 1; measure < totalMeasures - 2; measure++)
            {
                int baseBeat = measure * 4;

                if (measure % 4 == 0)
                {
                    for (int beat = 0; beat < 4; beat++)
                    {
                        int track = beat % 3;
                        level.notes.Add(new NoteData
                        {
                            type = NoteType.Fragment,
                            trackIndex = track,
                            beatIndex = baseBeat + beat,
                            fragmentValue = 1
                        });
                    }
                }
                else
                {
                    int actionTrack = rng.Next(3);
                    NoteType actionType = rng.Next(2) == 0 ? NoteType.Jump : NoteType.Slide;

                    level.notes.Add(new NoteData
                    {
                        type = actionType,
                        trackIndex = actionTrack,
                        beatIndex = baseBeat
                    });
                    level.notes.Add(new NoteData
                    {
                        type = NoteType.Fragment,
                        trackIndex = actionTrack,
                        beatIndex = baseBeat,
                        fragmentValue = 2
                    });

                    for (int i = 0; i < 2; i++)
                    {
                        int fragTrack = (actionTrack + 1 + i) % 3;
                        level.notes.Add(new NoteData
                        {
                            type = NoteType.Fragment,
                            trackIndex = fragTrack,
                            beatIndex = baseBeat + 2 + i,
                            beatOffset = 0f,
                            fragmentValue = 1
                        });
                    }
                }
            }

            return level;
        }

        public static LevelData GenerateLevelHard(float bpm, int totalMeasures = 64)
        {
            var level = new LevelData
            {
                levelId = "hard",
                levelName = "困难",
                difficulty = 2,
                startDelay = 2f,
                endDelay = 2f,
                beatsPerMeasure = 4,
                startBeat = 0,
                endBeat = totalMeasures * 4
            };

            System.Random rng = new System.Random(777);

            for (int measure = 0; measure < totalMeasures - 2; measure++)
            {
                int baseBeat = measure * 4;

                for (int sub = 0; sub < 8; sub++)
                {
                    if (rng.Next(3) == 0)
                    {
                        int track = rng.Next(3);
                        bool isAction = rng.Next(4) == 0;

                        if (isAction)
                        {
                            NoteType actionType = rng.Next(2) == 0 ? NoteType.Jump : NoteType.Slide;
                            level.notes.Add(new NoteData
                            {
                                type = actionType,
                                trackIndex = track,
                                beatIndex = baseBeat + sub / 2,
                                beatOffset = (sub % 2) * 0.5f
                            });
                        }

                        level.notes.Add(new NoteData
                        {
                            type = NoteType.Fragment,
                            trackIndex = track,
                            beatIndex = baseBeat + sub / 2,
                            beatOffset = (sub % 2) * 0.5f,
                            fragmentValue = isAction ? 2 : 1
                        });
                    }
                }
            }

            return level;
        }
    }
}
