from pydantic import BaseModel
from datetime import datetime

class ImageResponse(BaseModel):
    id: int
    filename: str
    filepath: str

    model_config = {
        "from_attributes": True
    }


class TeamIntroBase(BaseModel):
    title: str
    description: str


class TeamIntroCreate(TeamIntroBase):
    pass


class TeamIntroResponse(TeamIntroBase):
    id: int

    model_config = {
        "from_attributes": True
    }


class TeamImageResponse(BaseModel):
    id: int
    filename: str
    filepath: str

    model_config = {
        "from_attributes": True
    }


class TeamMemberResponse(BaseModel):
    id: int
    title: str
    description: str
    filename: str
    filepath: str

    model_config = {
        "from_attributes": True
    }


class EnquiryCreate(BaseModel):
    name: str
    email: str
    message: str


class EnquiryResponse(BaseModel):
    id: int
    name: str
    email: str
    message: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
