from flask import request


def parse_common_filters():
    filters = {}
    vehicle_id = request.args.get("vehicle_id")
    route_id = request.args.get("route_id")
    batch_id = request.args.get("batch_id")
    box_id = request.args.get("box_id")
    customer = request.args.get("customer")
    date_start = request.args.get("date_start")
    date_end = request.args.get("date_end")
    exception_type = request.args.get("exception_type")
    severity = request.args.get("severity")
    if vehicle_id:
        filters["vehicle_id"] = vehicle_id
    if route_id:
        filters["route_id"] = route_id
    if batch_id:
        filters["batch_id"] = batch_id
    if box_id:
        filters["box_id"] = box_id
    if customer:
        filters["customer"] = customer
    if date_start:
        filters["date_start"] = date_start
    if date_end:
        filters["date_end"] = date_end
    if exception_type:
        filters["exception_type"] = exception_type
    if severity:
        filters["severity"] = severity
    return filters
