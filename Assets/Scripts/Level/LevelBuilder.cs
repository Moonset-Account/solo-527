using UnityEngine;
using System.Collections.Generic;

namespace ShadowPlatformer.Level
{
    public class LevelBuilder : MonoBehaviour
    {
        public GameObject platformPrefab;
        public GameObject shadowPlatformPrefab;
        public GameObject triggerPrefabs_PressurePlate;
        public GameObject triggerPrefabs_Lever;
        public GameObject triggerPrefabs_TimedSwitch;
        public GameObject triggerPrefabs_LightSensor;
        public GameObject receiverPrefab_Door;
        public GameObject receiverPrefab_MovingPlatform;
        public GameObject hazardPrefab;
        public GameObject checkpointPrefab;
        public GameObject levelExitPrefab;
        public Transform levelRoot;

        private List<GameObject> _spawnedObjects = new List<GameObject>();

        public void BuildLevel(LevelLayout layout)
        {
            ClearLevel();
            if (levelRoot == null)
            {
                var rootObj = new GameObject("LevelRoot");
                levelRoot = rootObj.transform;
            }

            SpawnPlatforms(layout);
            SpawnTriggers(layout);
            SpawnReceivers(layout);
            SpawnHazards(layout);
            SpawnCheckpoints(layout);
            SpawnLevelExit(layout);
        }

        public void ClearLevel()
        {
            foreach (var obj in _spawnedObjects)
            {
                if (obj != null) Destroy(obj);
            }
            _spawnedObjects.Clear();
        }

        private void SpawnPlatforms(LevelLayout layout)
        {
            if (layout.platforms == null) return;
            foreach (var p in layout.platforms)
            {
                GameObject prefab = p.isShadowPlatform ? shadowPlatformPrefab : platformPrefab;
                if (prefab == null) continue;
                var go = Instantiate(prefab, p.position, Quaternion.identity, levelRoot);
                go.name = $"Platform_{p.id}";
                var sr = go.GetComponent<SpriteRenderer>();
                if (sr != null) sr.size = p.size;
                var col = go.GetComponent<BoxCollider2D>();
                if (col != null) col.size = p.size;

                if (p.isShadowPlatform)
                {
                    var sp = go.GetComponent<Light.ShadowPlatform>();
                    if (sp != null)
                    {
                        sp.shadowDirection = p.shadowDirection;
                        sp.visibilityRule = p.shadowVisibility;
                    }
                }
                _spawnedObjects.Add(go);
            }
        }

        private void SpawnTriggers(LevelLayout layout)
        {
            if (layout.triggers == null) return;
            foreach (var t in layout.triggers)
            {
                GameObject prefab = t.type switch
                {
                    Mechanisms.TriggerType.PressurePlate => triggerPrefabs_PressurePlate,
                    Mechanisms.TriggerType.Lever => triggerPrefabs_Lever,
                    Mechanisms.TriggerType.TimedSwitch => triggerPrefabs_TimedSwitch,
                    Mechanisms.TriggerType.LightSensor => triggerPrefabs_LightSensor,
                    _ => null
                };
                if (prefab == null) continue;
                var go = Instantiate(prefab, t.position, Quaternion.identity, levelRoot);
                go.name = $"Trigger_{t.id}";
                var mt = go.GetComponent<Mechanisms.MechanismTrigger>();
                if (mt != null)
                {
                    mt.triggerId = t.id;
                    mt.triggerType = t.type;
                    mt.isOneShot = t.isOneShot;
                    mt.timedDuration = t.timedDuration;
                    mt.requiredLightDirection = t.requiredLightDirection;
                }
                _spawnedObjects.Add(go);
            }
        }

        private void SpawnReceivers(LevelLayout layout)
        {
            if (layout.receivers == null) return;
            foreach (var r in layout.receivers)
            {
                GameObject prefab = r.isDoor ? receiverPrefab_Door :
                    r.isMovingPlatform ? receiverPrefab_MovingPlatform : null;
                if (prefab == null) continue;
                var go = Instantiate(prefab, r.position, Quaternion.identity, levelRoot);
                go.name = $"Receiver_{r.id}";
                var mr = go.GetComponent<Mechanisms.MechanismReceiver>();
                if (mr != null)
                {
                    mr.receiverId = r.id;
                    mr.requiredTriggerIds = r.requiredTriggerIds;
                    mr.requireAllTriggers = r.requireAllTriggers;
                    mr.moveSpeed = r.moveSpeed;
                }
                _spawnedObjects.Add(go);
            }
        }

        private void SpawnHazards(LevelLayout layout)
        {
            if (layout.hazards == null) return;
            foreach (var h in layout.hazards)
            {
                if (hazardPrefab == null) continue;
                var go = Instantiate(hazardPrefab, h.position, Quaternion.identity, levelRoot);
                go.name = $"Hazard_{h.id}";
                var col = go.GetComponent<BoxCollider2D>();
                if (col != null) col.size = h.size;
                var hz = go.GetComponent<Mechanisms.HazardZone>();
                if (hz != null) hz.instantKill = h.instantKill;
                _spawnedObjects.Add(go);
            }
        }

        private void SpawnCheckpoints(LevelLayout layout)
        {
            if (layout.checkpoints == null) return;
            foreach (var c in layout.checkpoints)
            {
                if (checkpointPrefab == null) continue;
                var go = Instantiate(checkpointPrefab, c.position, Quaternion.identity, levelRoot);
                go.name = $"Checkpoint_{c.id}";
                var cp = go.GetComponent<Save.Checkpoint>();
                if (cp != null) cp.checkpointId = c.id;
                _spawnedObjects.Add(go);
            }
        }

        private void SpawnLevelExit(LevelLayout layout)
        {
            if (levelExitPrefab == null) return;
            var go = Instantiate(levelExitPrefab, layout.levelExitPosition, Quaternion.identity, levelRoot);
            go.name = "LevelExit";
            var exit = go.GetComponent<Mechanisms.LevelExit>();
            if (exit != null && layout.requiredTriggerIdsForExit != null)
                exit.requiredTriggerIds = layout.requiredTriggerIdsForExit;
            _spawnedObjects.Add(go);
        }
    }
}
