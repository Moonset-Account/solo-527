import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///data/recruitment.db")
    DATABASE_MODE = os.getenv("DATABASE_MODE", "sqlite")
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    PORT = int(os.getenv("PORT", 8050))
    HOST = os.getenv("HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", 5000))
    API_BASE_URL = os.getenv("API_BASE_URL", f"http://localhost:{API_PORT}")

    STAGES = [
        "职位发布",
        "简历投递",
        "简历筛选",
        "一面",
        "二面",
        "HR面",
        "Offer发放",
        "入职",
    ]

    STAGE_ORDER = {stage: idx for idx, stage in enumerate(STAGES)}

    DIMENSIONS = ["职位", "部门", "招聘官", "渠道", "面试官", "月份"]

    CHANNELS = [
        "LinkedIn",
        "猎聘",
        "BOSS直聘",
        "智联招聘",
        "前程无忧",
        "内部推荐",
        "企业官网",
        "校园招聘",
    ]

    DEPARTMENTS = ["技术部", "产品部", "运营部", "市场部", "人力资源部", "财务部"]

    RECRUITERS = ["张三", "李四", "王五", "赵六", "钱七", "孙八"]

    INTERVIEWERS = ["张技术", "李产品", "王运营", "赵市场", "钱HR", "孙财务"]

    POSITIONS = [
        "高级Python工程师",
        "Java开发工程师",
        "前端开发工程师",
        "产品经理",
        "运营专员",
        "市场营销经理",
        "HRBP",
        "财务分析师",
        "数据分析师",
        "测试工程师",
    ]
