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
