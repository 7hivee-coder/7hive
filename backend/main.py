import os
import shutil
import secrets
from typing import List, Optional

from fastapi import (
    FastAPI,
    File,
    Form,
    UploadFile,
    Depends,
    HTTPException,
    status,
    Security,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

import models, schemas, crud
from database import engine, SessionLocal

# Create tables
models.Base.metadata.create_all(bind=engine)


def public_upload_url(path: str) -> str:
    return "/" + path.lstrip("/")

# Disable default docs
_TAGS = [
    {"name": "Home Images", "description": "Upload and manage homepage background/project images"},
    {"name": "Team", "description": "Team intro text, team images, and team member cards"},
    {"name": "Our Leader", "description": "Single leader showcase (image + title + description)"},
    {"name": "Portfolio", "description": "Portfolio projects, main images, and progress stages"},
    {"name": "Messages", "description": "Contact form enquiries"},
]

app = FastAPI(
    title="7HIVE API",
    docs_url=None,
    redoc_url=None,
    openapi_tags=_TAGS,
)

# -------------------------------
# CORS (Allow Angular / nginx)
# -------------------------------
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:4200,http://localhost")
CORS_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Static Files
# -------------------------------
UPLOAD_FOLDER = "uploads/projectimages"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# -------------------------------
# Database Dependency
# -------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------
# Swagger Basic Auth
# -------------------------------
security = HTTPBasic()

def authenticate(credentials: HTTPBasicCredentials = Security(security)):
    correct_username = secrets.compare_digest(
        credentials.username,
        "7hivedesignstudio@gmail.com"
    )
    correct_password = secrets.compare_digest(
        credentials.password,
        "7hivedesignstudio"
    )

    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )

    return credentials.username

# -------------------------------
# Protected Swagger Route
# -------------------------------
@app.get("/docs", response_class=HTMLResponse)
def custom_swagger_ui(username: str = Depends(authenticate)):
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="7HIVE API Docs"
    )

# -------------------------------
# Upload Images (Public)
# -------------------------------
@app.post("/upload-images/", response_model=List[schemas.ImageResponse], tags=["Home Images"])
def upload_images(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    saved_images = []

    for file in files:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        db_image = crud.create_image(db, file.filename, file_path)
        saved_images.append(db_image)

    return saved_images

# -------------------------------
# Get All Images (Public)
# -------------------------------
@app.get("/images/", response_model=List[schemas.ImageResponse], tags=["Home Images"])
def list_images(
    db: Session = Depends(get_db),
):
    images = crud.get_images(db)

    for img in images:
        img.filepath = public_upload_url(img.filepath)

    return images


TEAM_UPLOAD_FOLDER = "uploads/teamimages"
os.makedirs(TEAM_UPLOAD_FOLDER, exist_ok=True)


@app.post("/teamintro", response_model=schemas.TeamIntroResponse, tags=["Team"])
def create_team_intro(
    intro: schemas.TeamIntroCreate,
    db: Session = Depends(get_db),
):
    return crud.create_team_intro(db, intro)


@app.get("/teamintro", response_model=List[schemas.TeamIntroResponse], tags=["Team"])
def get_team_intro(db: Session = Depends(get_db)):
    return crud.get_team_intro(db)


@app.post("/teamimages", response_model=List[schemas.TeamImageResponse], tags=["Team"])
def upload_team_images(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    saved_images = []

    for file in files:
        file_path = os.path.join(TEAM_UPLOAD_FOLDER, file.filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        db_image = crud.create_team_image(
            db,
            file.filename,
            f"teamimages/{file.filename}"
        )

        saved_images.append(db_image)

    return saved_images


@app.get("/teamimages", response_model=List[schemas.TeamImageResponse], tags=["Team"])
def get_team_images(
    db: Session = Depends(get_db),
):
    images = crud.get_team_images(db)

    for img in images:
        img.filepath = public_upload_url("uploads/" + img.filepath)

    return images


@app.delete("/images/{image_id}", tags=["Home Images"])
def delete_project_image(
    image_id: int,
    db: Session = Depends(get_db),
):
    image = crud.delete_image(db, image_id)

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    return {"message": "Project image deleted successfully"}


@app.delete("/teamimages/{image_id}", tags=["Team"])
def delete_team_image(
    image_id: int,
    db: Session = Depends(get_db),
):
    image = crud.delete_team_image(db, image_id)

    if not image:
        raise HTTPException(status_code=404, detail="Team image not found")

    return {"message": "Team image deleted successfully"}


# -------------------------------
# Team Members (unified)
# -------------------------------
TEAM_MEMBER_FOLDER = "uploads/teammembers"
os.makedirs(TEAM_MEMBER_FOLDER, exist_ok=True)


@app.post("/team-members", response_model=schemas.TeamMemberResponse, tags=["Team"])
def create_team_member(
    title: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    file_path = os.path.join(TEAM_MEMBER_FOLDER, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return crud.create_team_member(
        db,
        title=title,
        description=description,
        filename=file.filename,
        filepath=f"teammembers/{file.filename}"
    )


@app.get("/team-members", response_model=List[schemas.TeamMemberResponse], tags=["Team"])
def get_team_members(
    db: Session = Depends(get_db),
):
    members = crud.get_team_members(db)
    for m in members:
        m.filepath = public_upload_url("uploads/" + m.filepath)
    return members


@app.delete("/team-members/{member_id}", tags=["Team"])
def delete_team_member(
    member_id: int,
    db: Session = Depends(get_db),
):
    member = crud.delete_team_member(db, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    return {"message": "Team member deleted successfully"}


# -------------------------------
# Enquiries
# -------------------------------

@app.post("/enquiries", response_model=schemas.EnquiryResponse, tags=["Messages"])
def create_enquiry(
    enquiry: schemas.EnquiryCreate,
    db: Session = Depends(get_db),
):
    name = enquiry.name.strip()
    email = enquiry.email.strip().lower()
    message = enquiry.message.strip()

    if not name or not email or not message:
        raise HTTPException(status_code=422, detail="All fields are required")
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=422, detail="Invalid email address")

    return crud.create_enquiry(db, name=name, email=email, message=message)


@app.get("/enquiries", response_model=List[schemas.EnquiryResponse], tags=["Messages"])
def get_enquiries(
    username: str = Depends(authenticate),
    db: Session = Depends(get_db),
):
    return crud.get_enquiries(db)


# -------------------------------------------------------
# OUR LEADER
# -------------------------------------------------------

OUR_LEADER_FOLDER = "uploads/ourleader"
os.makedirs(OUR_LEADER_FOLDER, exist_ok=True)


@app.get("/ourleader", response_model=schemas.OurLeaderResponse, tags=["Our Leader"])
def get_our_leader(db: Session = Depends(get_db)):
    leader = db.query(models.OurLeader).first()
    if not leader:
        raise HTTPException(status_code=404, detail="No leader entry found")
    leader.filepath = public_upload_url(leader.filepath)
    return leader


@app.post("/ourleader", response_model=schemas.OurLeaderResponse, status_code=status.HTTP_201_CREATED, tags=["Our Leader"])
def create_or_replace_our_leader(
    title: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    existing = db.query(models.OurLeader).first()
    if existing:
        old_path = existing.filepath
        if os.path.exists(old_path):
            os.remove(old_path)
        db.delete(existing)
        db.commit()

    file_path = os.path.join(OUR_LEADER_FOLDER, file.filename)
    with open(file_path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    leader = models.OurLeader(
        title=title,
        description=description,
        filename=file.filename,
        filepath=file_path,
    )
    db.add(leader)
    db.commit()
    db.refresh(leader)
    leader.filepath = public_upload_url(leader.filepath)
    return leader


@app.delete("/ourleader", tags=["Our Leader"])
def delete_our_leader(db: Session = Depends(get_db)):
    leader = db.query(models.OurLeader).first()
    if not leader:
        raise HTTPException(status_code=404, detail="No leader entry found")
    if os.path.exists(leader.filepath):
        os.remove(leader.filepath)
    db.delete(leader)
    db.commit()
    return {"message": "Leader entry deleted"}


# -------------------------------------------------------
# PORTFOLIO
# -------------------------------------------------------

PORTFOLIO_UPLOAD_FOLDER = "uploads/portfolio"
os.makedirs(PORTFOLIO_UPLOAD_FOLDER, exist_ok=True)


@app.get(
    "/portfolio/home-preview",
    response_model=List[schemas.CategoryPreview],
    response_model_by_alias=True,
    tags=["Portfolio"],
)
def home_preview(db: Session = Depends(get_db)):
    return crud.get_home_preview(db)


@app.get(
    "/portfolio",
    response_model=List[schemas.PortfolioListItem],
    response_model_by_alias=True,
    tags=["Portfolio"],
)
def list_portfolio(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return crud.get_portfolio_projects(db, skip=skip, limit=limit, category=category)


@app.get(
    "/portfolio/{portfolio_project_id}",
    response_model=schemas.PortfolioDetail,
    response_model_by_alias=True,
    tags=["Portfolio"],
)
def detail_portfolio(portfolio_project_id: str, db: Session = Depends(get_db)):
    project = crud.get_portfolio_project(db, portfolio_project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Portfolio project not found")
    return project


@app.post(
    "/portfolio",
    response_model=schemas.PortfolioListItem,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
    tags=["Portfolio"],
)
def create_portfolio(data: schemas.PortfolioCreate, db: Session = Depends(get_db)):
    return crud.create_portfolio_project(db, data)


@app.put(
    "/portfolio/{portfolio_project_id}",
    response_model=schemas.PortfolioListItem,
    response_model_by_alias=True,
    tags=["Portfolio"],
)
def update_portfolio(
    portfolio_project_id: str,
    data: schemas.PortfolioUpdate,
    db: Session = Depends(get_db),
):
    project = crud.update_portfolio_project(db, portfolio_project_id, data)
    if not project:
        raise HTTPException(status_code=404, detail="Portfolio project not found")
    return project


@app.delete("/portfolio/{portfolio_project_id}", tags=["Portfolio"])
def delete_portfolio(portfolio_project_id: str, db: Session = Depends(get_db)):
    project = crud.delete_portfolio_project(db, portfolio_project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Portfolio project not found")
    return {"message": "Portfolio project deleted successfully"}


@app.post(
    "/portfolio/{portfolio_project_id}/main-images",
    response_model=schemas.PortfolioDetail,
    response_model_by_alias=True,
    tags=["Portfolio"],
)
def upload_main_images(
    portfolio_project_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    folder = os.path.join(PORTFOLIO_UPLOAD_FOLDER, portfolio_project_id, "main")
    os.makedirs(folder, exist_ok=True)

    urls = []
    for file in files:
        file_path = os.path.join(folder, file.filename)
        with open(file_path, "wb") as buf:
            shutil.copyfileobj(file.file, buf)
        urls.append(public_upload_url(file_path))

    result = crud.add_main_frame_images(db, portfolio_project_id, urls)
    if not result:
        raise HTTPException(status_code=404, detail="Portfolio project not found")
    return crud.get_portfolio_project(db, portfolio_project_id)


@app.post(
    "/portfolio/{portfolio_project_id}/progress-stage",
    response_model=schemas.ProgressStageResponse,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
    tags=["Portfolio"],
)
def add_progress_stage(
    portfolio_project_id: str,
    data: schemas.ProgressStageCreate,
    db: Session = Depends(get_db),
):
    stage = crud.create_progress_stage(db, portfolio_project_id, data)
    if not stage:
        raise HTTPException(status_code=404, detail="Portfolio project not found")
    return stage


@app.post(
    "/portfolio/{portfolio_project_id}/progress-stage/{stage_id}/images",
    response_model=schemas.ProgressStageResponse,
    response_model_by_alias=True,
    tags=["Portfolio"],
)
def upload_progress_images(
    portfolio_project_id: str,
    stage_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    project = (
        db.query(models.PortfolioProject)
        .filter(models.PortfolioProject.portfolio_project_id == portfolio_project_id)
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"Portfolio project '{portfolio_project_id}' not found",
        )

    stage_check = (
        db.query(models.ProgressStage)
        .filter(
            models.ProgressStage.id == stage_id,
            models.ProgressStage.project_id == project.id,
        )
        .first()
    )
    if not stage_check:
        raise HTTPException(
            status_code=404,
            detail=f"Progress stage id={stage_id} does not belong to project '{portfolio_project_id}'. Use the 'id' field from the stage creation response.",
        )

    folder = os.path.join(
        PORTFOLIO_UPLOAD_FOLDER, portfolio_project_id, "progress", str(stage_id)
    )
    os.makedirs(folder, exist_ok=True)

    urls = []
    for file in files:
        file_path = os.path.join(folder, file.filename)
        with open(file_path, "wb") as buf:
            shutil.copyfileobj(file.file, buf)
        urls.append(public_upload_url(file_path))

    stage = crud.add_progress_images(db, stage_id, urls)
    return stage