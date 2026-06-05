def mask_phone(phone: str) -> str:
    if not phone or len(phone) < 7:
        return "***********"
    return phone[:3] + "****" + phone[-4:]
