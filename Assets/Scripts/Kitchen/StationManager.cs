using UnityEngine;
using System.Collections.Generic;

public class StationManager : Singleton<StationManager>
{
    public List<KitchenStation> allStations;

    private List<KitchenStation> _registeredStations = new List<KitchenStation>();

    protected override void Awake()
    {
        base.Awake();
        if (allStations == null)
            allStations = new List<KitchenStation>();
    }

    public void RegisterStation(KitchenStation station)
    {
        if (station == null || _registeredStations.Contains(station))
            return;

        _registeredStations.Add(station);
        if (!allStations.Contains(station))
            allStations.Add(station);
    }

    public KitchenStation GetNearestStation(Vector3 position, float range)
    {
        KitchenStation nearest = null;
        float nearestDistance = range;

        for (int i = 0; i < allStations.Count; i++)
        {
            KitchenStation station = allStations[i];
            float distance = Vector3.Distance(position, station.interactPoint != null ? station.interactPoint.position : station.transform.position);
            if (distance < nearestDistance)
            {
                nearestDistance = distance;
                nearest = station;
            }
        }

        return nearest;
    }

    public KitchenStation GetNearestStation(Vector3 position, StationType type)
    {
        KitchenStation nearest = null;
        float nearestDistance = float.MaxValue;

        List<KitchenStation> stations = GetStationsByType(type);
        for (int i = 0; i < stations.Count; i++)
        {
            KitchenStation station = stations[i];
            float distance = Vector3.Distance(position, station.interactPoint != null ? station.interactPoint.position : station.transform.position);
            if (distance < nearestDistance)
            {
                nearestDistance = distance;
                nearest = station;
            }
        }

        return nearest;
    }

    public List<KitchenStation> GetStationsByType(StationType type)
    {
        List<KitchenStation> result = new List<KitchenStation>();
        for (int i = 0; i < allStations.Count; i++)
        {
            if (allStations[i].stationType == type)
                result.Add(allStations[i]);
        }
        return result;
    }
}
