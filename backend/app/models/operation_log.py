from sqlalchemy import Column, Integer, String, Text, JSON, DateTime

from app.models.base import BaseModel


class OperationLog(BaseModel):
    __tablename__ = "operation_logs"

    user_id = Column(Integer, nullable=True, comment="用户ID")
    username = Column(String(50), nullable=True, comment="用户名")
    operation_type = Column(String(50), nullable=False, comment="操作类型")
    module = Column(String(50), nullable=False, comment="模块")
    description = Column(String(500), nullable=True, comment="操作描述")
    ip_address = Column(String(50), nullable=True, comment="IP地址")
    user_agent = Column(String(500), nullable=True, comment="用户代理")
    request_method = Column(String(10), nullable=True, comment="请求方法")
    request_url = Column(String(500), nullable=True, comment="请求URL")
    request_params = Column(JSON, nullable=True, comment="请求参数")
    response_data = Column(JSON, nullable=True, comment="响应数据")
    old_data = Column(JSON, nullable=True, comment="修改前数据")
    new_data = Column(JSON, nullable=True, comment="修改后数据")
    status = Column(String(20), default="success", nullable=False, comment="状态")
    error_msg = Column(Text, nullable=True, comment="错误信息")
    duration = Column(Integer, nullable=True, comment="耗时(ms)")
