"""Independent singleton storage: never writes About or article data."""
from sqlalchemy import Column, Integer, Text, JSON, DateTime

from .database import Base


class NowContent(Base):
    __tablename__ = "now_content"

    id = Column(Integer, primary_key=True)
    overview = Column(Text, nullable=False)
    focuses = Column(JSON, nullable=False)
    log_description = Column(Text, nullable=False)
    log_url = Column(Text, nullable=False)
    content_updated_at = Column(DateTime, nullable=False)
