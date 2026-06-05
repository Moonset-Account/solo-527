def mobile_detection(request):
    user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
    mobile_keywords = ['android', 'iphone', 'ipad', 'ipod', 'mobile', 'webos', 'blackberry']
    is_mobile = any(keyword in user_agent for keyword in mobile_keywords)
    return {
        'is_mobile': is_mobile,
        'is_htmx': getattr(request, 'htmx', False),
    }
