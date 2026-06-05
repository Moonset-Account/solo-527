import logging
import sys
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
import os
from datetime import datetime


def setup_logger(name: str = "reagent_inventory", log_level: int = logging.INFO) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(log_level)
    logger.propagate = False

    if not logger.handlers:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(module)s:%(lineno)d - %(message)s"
        )

        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(log_level)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        log_dir = "logs"
        os.makedirs(log_dir, exist_ok=True)

        file_handler = TimedRotatingFileHandler(
            f"{log_dir}/app.log",
            when="midnight",
            interval=1,
            backupCount=30,
            encoding="utf-8"
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

        error_handler = RotatingFileHandler(
            f"{log_dir}/error.log",
            maxBytes=10 * 1024 * 1024,
            backupCount=5,
            encoding="utf-8"
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(formatter)
        logger.addHandler(error_handler)

    return logger


logger = setup_logger()
