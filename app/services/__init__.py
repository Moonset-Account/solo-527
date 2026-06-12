import os
import importlib.util

_services_py_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "services.py")
if os.path.isfile(_services_py_path):
    _spec = importlib.util.spec_from_file_location("app_services", _services_py_path)
    _services_mod = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(_services_mod)
    for _name in dir(_services_mod):
        if not _name.startswith("_"):
            globals()[_name] = getattr(_services_mod, _name)

__all__ = [n for n in globals() if not n.startswith("_") and n not in ("os", "importlib", "importlib_util")]
