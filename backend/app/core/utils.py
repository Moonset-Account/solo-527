import re
from typing import Any, Dict, List


def to_camel_case(snake_str: str) -> str:
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


def convert_dict_keys_to_camel(data: Any) -> Any:
    if isinstance(data, dict):
        return {to_camel_case(k): convert_dict_keys_to_camel(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_dict_keys_to_camel(item) for item in data]
    else:
        return data


def convert_to_camel(*args):
    def decorator(func):
        async def wrapper(*func_args, **func_kwargs):
            result = await func(*func_args, **func_kwargs) if hasattr(func, '__await__') else func(*func_args, **func_kwargs)
            return convert_dict_keys_to_camel(result)
        return wrapper
    return decorator
