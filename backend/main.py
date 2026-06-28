import os
import shutil
import secrets
from typing import List

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
app = FastAPI(
    title="7HIVE Image Upload API",
    docs_url=None,
    redoc_url=None
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
@app.post("/upload-images/", response_model=List[schemas.ImageResponse])
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
@app.get("/images/", response_model=List[schemas.ImageResponse])
def list_images(
    db: Session = Depends(get_db),
):
    images = crud.get_images(db)

    for img in images:
        img.filepath = public_upload_url(img.filepath)

    return images


TEAM_UPLOAD_FOLDER = "uploads/teamimages"
os.makedirs(TEAM_UPLOAD_FOLDER, exist_ok=True)


@app.post("/teamintro", response_model=schemas.TeamIntroResponse)
def create_team_intro(
    intro: schemas.TeamIntroCreate,
    db: Session = Depends(get_db),
):
    return crud.create_team_intro(db, intro)


@app.get("/teamintro", response_model=List[schemas.TeamIntroResponse])
def get_team_intro(db: Session = Depends(get_db)):
    return crud.get_team_intro(db)


@app.post("/teamimages", response_model=List[schemas.TeamImageResponse])
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


@app.get("/teamimages", response_model=List[schemas.TeamImageResponse])
def get_team_images(
    db: Session = Depends(get_db),
):
    images = crud.get_team_images(db)

    for img in images:
        img.filepath = public_upload_url("uploads/" + img.filepath)

    return images


@app.delete("/images/{image_id}")
def delete_project_image(
    image_id: int,
    db: Session = Depends(get_db),
):
    image = crud.delete_image(db, image_id)

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    return {"message": "Project image deleted successfully"}


@app.delete("/teamimages/{image_id}")
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


@app.post("/team-members", response_model=schemas.TeamMemberResponse)
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


@app.get("/team-members", response_model=List[schemas.TeamMemberResponse])
def get_team_members(
    db: Session = Depends(get_db),
):
    members = crud.get_team_members(db)
    for m in members:
        m.filepath = public_upload_url("uploads/" + m.filepath)
    return members


@app.delete("/team-members/{member_id}")
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

@app.post("/enquiries", response_model=schemas.EnquiryResponse)
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


@app.get("/enquiries", response_model=List[schemas.EnquiryResponse])
def get_enquiries(
    username: str = Depends(authenticate),
    db: Session = Depends(get_db),
):
    return crud.get_enquiries(db)