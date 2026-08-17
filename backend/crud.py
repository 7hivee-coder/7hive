from sqlalchemy.orm import Session
import models

def create_image(db: Session, filename: str, filepath: str):
    db_image = models.Image(filename=filename, filepath=filepath)
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image

def get_images(db: Session):
    return db.query(models.Image).all()



# -------------------------
# TEAM INTRO
# -------------------------

def create_team_intro(db: Session, intro):
    db_intro = models.TeamIntro(
        title=intro.title,
        description=intro.description
    )
    db.add(db_intro)
    db.commit()
    db.refresh(db_intro)
    return db_intro


def get_team_intro(db: Session):
    return db.query(models.TeamIntro).all()


# -------------------------
# TEAM IMAGES
# -------------------------

def create_team_image(db: Session, filename: str, filepath: str):
    db_image = models.TeamImage(
        filename=filename,
        filepath=filepath
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image


def get_team_images(db: Session):
    return db.query(models.TeamImage).all()


import os

# -------------------------
# DELETE PROJECT IMAGE
# -------------------------

def delete_image(db: Session, image_id: int):
    image = db.query(models.Image).filter(models.Image.id == image_id).first()

    if not image:
        return None

    # Delete file from folder
    if os.path.exists(image.filepath):
        os.remove(image.filepath)

    db.delete(image)
    db.commit()
    return image


# -------------------------
# DELETE TEAM IMAGE
# -------------------------

def delete_team_image(db: Session, image_id: int):
    image = db.query(models.TeamImage).filter(models.TeamImage.id == image_id).first()

    if not image:
        return None

    file_path = os.path.join("uploads", image.filepath)

    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(image)
    db.commit()
    return image


# -------------------------
# TEAM MEMBERS (unified)
# -------------------------

def create_team_member(db: Session, title: str, description: str, filename: str, filepath: str):
    member = models.TeamMember(
        title=title,
        description=description,
        filename=filename,
        filepath=filepath
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def get_team_members(db: Session):
    return db.query(models.TeamMember).all()


def delete_team_member(db: Session, member_id: int):
    member = db.query(models.TeamMember).filter(models.TeamMember.id == member_id).first()

    if not member:
        return None

    file_path = os.path.join("uploads", member.filepath)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(member)
    db.commit()
    return member


# -------------------------
# ENQUIRIES
# -------------------------

def create_enquiry(db: Session, name: str, email: str, message: str):
    enquiry = models.Enquiry(name=name, email=email, message=message)
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    return enquiry


def get_enquiries(db: Session):
    return db.query(models.Enquiry).order_by(models.Enquiry.created_at.desc()).all()


# -------------------------
# PORTFOLIO
# -------------------------

from sqlalchemy.orm import selectinload
from typing import List as TypingList, Optional as TypingOptional
import uuid as _uuid

_CATEGORY_TITLES = {
    'architecture': 'Architecture',
    'interior': 'Interior',
    'turnkey': 'Turnkey',
    'siteexecution': 'Site Execution',
}


def create_portfolio_project(db: Session, data) -> models.PortfolioProject:
    project = models.PortfolioProject(
        portfolio_project_id=_uuid.uuid4().hex[:19],  # temp unique placeholder
        project_title=data.project_title,
        short_description=data.short_description,
        full_description=data.full_description,
        location=data.location,
        area=data.area,
        client_name=data.client_name,
        year=data.year,
        category=data.category,
    )
    db.add(project)
    db.flush()  # Gets the auto-increment integer id from PostgreSQL (never resets on DELETE)
    project.portfolio_project_id = f"P{project.id:03d}"
    db.commit()
    db.refresh(project)
    return project


def get_portfolio_projects(db: Session, skip: int = 0, limit: int = 100, category: TypingOptional[str] = None):
    query = db.query(models.PortfolioProject)
    if category:
        query = query.filter(models.PortfolioProject.category == category)
    return query.offset(skip).limit(limit).all()


def get_portfolio_project(db: Session, portfolio_project_id: str):
    return (
        db.query(models.PortfolioProject)
        .filter(models.PortfolioProject.portfolio_project_id == portfolio_project_id)
        .options(
            selectinload(models.PortfolioProject.main_frame_images),
            selectinload(models.PortfolioProject.progress_stages).selectinload(
                models.ProgressStage.progress_images
            ),
        )
        .first()
    )


def update_portfolio_project(db: Session, portfolio_project_id: str, data):
    project = (
        db.query(models.PortfolioProject)
        .filter(models.PortfolioProject.portfolio_project_id == portfolio_project_id)
        .first()
    )
    if not project:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


def delete_portfolio_project(db: Session, portfolio_project_id: str):
    project = (
        db.query(models.PortfolioProject)
        .filter(models.PortfolioProject.portfolio_project_id == portfolio_project_id)
        .first()
    )
    if not project:
        return None
    db.delete(project)
    db.commit()
    return project


def get_home_preview(db: Session):
    result = []
    for slug, title in _CATEGORY_TITLES.items():
        projects = (
            db.query(models.PortfolioProject)
            .filter(models.PortfolioProject.category == slug)
            .options(selectinload(models.PortfolioProject.main_frame_images))
            .all()
        )
        preview_images: TypingList[str] = []
        for p in projects:
            for img in p.main_frame_images:
                preview_images.append(img.image_url)
                if len(preview_images) >= 6:
                    break
            if len(preview_images) >= 6:
                break
        result.append({
            'slug': slug,
            'title': title,
            'project_count': len(projects),
            'preview_images': preview_images,
            'projects': projects,
        })
    return result


def add_main_frame_images(
    db: Session, portfolio_project_id: str, image_urls: TypingList[str]
):
    project = (
        db.query(models.PortfolioProject)
        .filter(models.PortfolioProject.portfolio_project_id == portfolio_project_id)
        .options(selectinload(models.PortfolioProject.main_frame_images))
        .first()
    )
    if not project:
        return None
    existing_count = len(project.main_frame_images)
    for i, url in enumerate(image_urls):
        db.add(
            models.MainFrameImage(
                project_id=project.id,
                image_url=url,
                display_order=existing_count + i + 1,
            )
        )
    if not project.cover_image and image_urls:
        project.cover_image = image_urls[0]
    db.commit()
    return project


def create_progress_stage(db: Session, portfolio_project_id: str, data):
    project = (
        db.query(models.PortfolioProject)
        .filter(models.PortfolioProject.portfolio_project_id == portfolio_project_id)
        .first()
    )
    if not project:
        return None
    stage = models.ProgressStage(
        project_id=project.id,
        progress_number=data.progress_number,
        stage_title=data.stage_title,
        description=data.description,
    )
    db.add(stage)
    db.commit()
    db.refresh(stage)
    return get_progress_stage(db, stage.id)


def get_progress_stage(db: Session, stage_id: int):
    return (
        db.query(models.ProgressStage)
        .filter(models.ProgressStage.id == stage_id)
        .options(selectinload(models.ProgressStage.progress_images))
        .first()
    )


def add_progress_images(
    db: Session, stage_id: int, image_urls: TypingList[str]
):
    stage = db.query(models.ProgressStage).filter(models.ProgressStage.id == stage_id).first()
    if not stage:
        return None
    for url in image_urls:
        db.add(models.ProgressImage(stage_id=stage_id, image_url=url))
    db.commit()
    return get_progress_stage(db, stage_id)
