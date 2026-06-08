using System;
using System.Collections.Generic;

namespace InkMountainBridge
{
    [Serializable]
    public class SessionRecord
    {
        public string sessionId;
        public int levelId;
        public List<InputRecord> inputs = new List<InputRecord>();
        public LevelResult result;
        public List<FailureRecord> failureReasons = new List<FailureRecord>();
        public string startTime;
        public string endTime;
        public string platform;
    }
}
