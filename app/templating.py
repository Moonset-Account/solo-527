from jinja2 import ChoiceLoader, FileSystemLoader
from starlette.templating import Jinja2Templates

templates = Jinja2Templates(
    directory="app/templates",
    loader=ChoiceLoader(
        [
            FileSystemLoader("app/templates"),
        ]
    ),
)
