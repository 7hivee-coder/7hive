from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)

class TeamIntro(Base):
    __tablename__ = "team_intro"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)


class TeamImage(Base):
    __tablename__ = "team_images"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)


class Enquiry(Base):
    __tablename__ = "enquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# -------------------------------------------------------
# PORTFOLIO
# -------------------------------------------------------

class PortfolioProject(Base):
    __tablename__ = "portfolio_projects"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_project_id = Column(String(20), unique=True, nullable=False, index=True)
    project_title = Column(String(500), nullable=False)
    short_description = Column(Text, nullable=False)
    full_description = Column(Text, nullable=True)
    location = Column(String(200), nullable=True)
    area = Column(String(100), nullable=True)
    client_name = Column(String(200), nullable=True)
    year = Column(Integer, nullable=True)
    cover_image = Column(String(1000), nullable=True)
    category = Column(String(50), nullable=True)

    main_frame_images = relationship(
        "MainFrameImage",
        back_populates="project",
        order_by="MainFrameImage.display_order",
        cascade="all, delete-orphan",
    )
    progress_stages = relationship(
        "ProgressStage",
        back_populates="project",
        order_by="ProgressStage.progress_number",
        cascade="all, delete-orphan",
    )


class MainFrameImage(Base):
    __tablename__ = "portfolio_main_images"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("portfolio_projects.id"), nullable=False)
    image_url = Column(String(1000), nullable=False)
    display_order = Column(Integer, default=0)

    project = relationship("PortfolioProject", back_populates="main_frame_images")


class ProgressStage(Base):
    __tablename__ = "portfolio_progress_stages"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("portfolio_projects.id"), nullable=False)
    progress_number = Column(Integer, nullable=False)
    stage_title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)

    project = relationship("PortfolioProject", back_populates="progress_stages")
    progress_images = relationship(
        "ProgressImage",
        back_populates="stage",
        cascade="all, delete-orphan",
    )


class ProgressImage(Base):
    __tablename__ = "portfolio_progress_images"

    id = Column(Integer, primary_key=True, index=True)
    stage_id = Column(Integer, ForeignKey("portfolio_progress_stages.id"), nullable=False)
    image_url = Column(String(1000), nullable=False)

    stage = relationship("ProgressStage", back_populates="progress_images")