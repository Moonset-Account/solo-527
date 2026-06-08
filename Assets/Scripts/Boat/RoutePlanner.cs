using System.Collections.Generic;
using UnityEngine;

public struct RouteData
{
    public List<Vector2> waypoints;
    public float estimatedFuel;
    public float estimatedTime;
}

public class RoutePlanner : MonoBehaviour
{
    public int maxWaypoints = 8;
    public float waypointReachThreshold = 0.5f;
    public float autoNavigateSpeed = 3f;
    public LineRenderer routeLine;
    public GameObject waypointMarkerPrefab;
    public BoatController boatController;

    public List<Vector2> waypoints = new List<Vector2>();
    public int currentWaypointIndex;
    public bool isPlanning;
    public bool isSailing;

    private List<GameObject> waypointMarkers = new List<GameObject>();
    private List<Color> segmentColors = new List<Color>();

    public System.Action<RouteData> OnRouteConfirmed;

    public void StartPlanning()
    {
        isPlanning = true;
        isSailing = false;
        ClearVisuals();
    }

    public void ConfirmRoute()
    {
        if (waypoints.Count < 2) return;

        isPlanning = false;
        isSailing = true;
        currentWaypointIndex = 0;

        RouteData data = CalculateRouteData();
        OnRouteConfirmed?.Invoke(data);
    }

    public void ClearRoute()
    {
        waypoints.Clear();
        segmentColors.Clear();
        currentWaypointIndex = 0;
        isPlanning = false;
        isSailing = false;
        ClearVisuals();
    }

    public void UndoLastWaypoint()
    {
        if (waypoints.Count == 0) return;

        waypoints.RemoveAt(waypoints.Count - 1);
        if (segmentColors.Count > 0) segmentColors.RemoveAt(segmentColors.Count - 1);

        if (waypointMarkers.Count > 0)
        {
            Destroy(waypointMarkers[waypointMarkers.Count - 1]);
            waypointMarkers.RemoveAt(waypointMarkers.Count - 1);
        }

        UpdateRouteLine();
    }

    public RouteData CalculateRouteData()
    {
        float totalFuel = 0f;
        float totalTime = 0f;
        WeatherState weather = WeatherSystem.Instance.GetCurrentState();
        Vector2 windDir = new Vector2(Mathf.Cos(weather.windAngle * Mathf.Deg2Rad), Mathf.Sin(weather.windAngle * Mathf.Deg2Rad));

        for (int i = 0; i < waypoints.Count - 1; i++)
        {
            Vector2 seg = waypoints[i + 1] - waypoints[i];
            float segLen = seg.magnitude;
            Vector2 segDir = seg.normalized;

            float windAlignment = Vector2.Dot(windDir, segDir);
            float fuelModifier = 1f - windAlignment * 0.5f;
            fuelModifier = Mathf.Clamp(fuelModifier, 0.5f, 1.5f);

            totalFuel += segLen * boatController.fuelPerUnit * fuelModifier;
            totalTime += segLen / (boatController.moveSpeed * 0.8f);
        }

        return new RouteData
        {
            waypoints = new List<Vector2>(waypoints),
            estimatedFuel = totalFuel,
            estimatedTime = totalTime
        };
    }

    private void Update()
    {
        if (isPlanning)
        {
            HandlePlanningInput();
            UpdateRouteLine();
        }
        else if (isSailing)
        {
            HandleAutoNavigation();
        }
    }

    private void HandlePlanningInput()
    {
        if (Input.GetMouseButtonDown(0) && waypoints.Count < maxWaypoints)
        {
            Vector3 worldPos = GetWorldPositionFromMouse();
            Vector2 point = new Vector2(worldPos.x, worldPos.z);
            waypoints.Add(point);
            CreateWaypointMarker(point);
            UpdateSegmentColors();
            UpdateRouteLine();
        }

        if (Input.GetMouseButtonDown(1))
        {
            UndoLastWaypoint();
        }
    }

    private Vector3 GetWorldPositionFromMouse()
    {
        Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
        Plane plane = new Plane(Vector3.up, Vector3.zero);
        plane.Raycast(ray, out float distance);
        return ray.GetPoint(distance);
    }

    private void CreateWaypointMarker(Vector2 position)
    {
        if (waypointMarkerPrefab == null) return;

        GameObject marker = Instantiate(waypointMarkerPrefab, new Vector3(position.x, 0f, position.y), Quaternion.identity, transform);
        waypointMarkers.Add(marker);
    }

    private void UpdateSegmentColors()
    {
        segmentColors.Clear();
        WeatherState weather = WeatherSystem.Instance.GetCurrentState();
        Vector2 windDir = new Vector2(Mathf.Cos(weather.windAngle * Mathf.Deg2Rad), Mathf.Sin(weather.windAngle * Mathf.Deg2Rad));

        for (int i = 0; i < waypoints.Count - 1; i++)
        {
            Vector2 segDir = (waypoints[i + 1] - waypoints[i]).normalized;
            float dot = Vector2.Dot(windDir, segDir);

            if (dot > 0.3f)
                segmentColors.Add(Color.green);
            else if (dot < -0.3f)
                segmentColors.Add(Color.red);
            else
                segmentColors.Add(Color.yellow);
        }
    }

    private void UpdateRouteLine()
    {
        if (routeLine == null) return;

        if (waypoints.Count < 2)
        {
            routeLine.positionCount = 0;
            return;
        }

        routeLine.positionCount = waypoints.Count;
        for (int i = 0; i < waypoints.Count; i++)
        {
            routeLine.SetPosition(i, new Vector3(waypoints[i].x, 0f, waypoints[i].y));
        }

        UpdateSegmentColors();

        for (int i = 0; i < segmentColors.Count && i < routeLine.positionCount - 1; i++)
        {
            routeLine.startColor = segmentColors[0];
            routeLine.endColor = segmentColors[segmentColors.Count - 1];
        }
    }

    private void HandleAutoNavigation()
    {
        if (currentWaypointIndex >= waypoints.Count)
        {
            isSailing = false;
            return;
        }

        Vector2 boatPos = new Vector2(boatController.transform.position.x, boatController.transform.position.z);
        Vector2 target = waypoints[currentWaypointIndex];
        Vector2 toTarget = target - boatPos;
        float dist = toTarget.magnitude;

        if (dist <= waypointReachThreshold)
        {
            GameEvents.TriggerRoutePointReached(currentWaypointIndex);
            currentWaypointIndex++;
            return;
        }

        Vector2 direction = toTarget.normalized;
        float targetHeading = Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg;
        boatController.transform.rotation = Quaternion.Euler(0f, targetHeading, 0f);
    }

    private void ClearVisuals()
    {
        foreach (var marker in waypointMarkers)
        {
            if (marker != null) Destroy(marker);
        }
        waypointMarkers.Clear();
        segmentColors.Clear();

        if (routeLine != null) routeLine.positionCount = 0;
    }
}
