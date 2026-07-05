from pydantic import BaseModel, ConfigDict, model_validator
from pydantic.alias_generators import to_camel
from typing import Optional, List
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


# -------------------------------------------------------
# PORTFOLIO SCHEMAS
# -------------------------------------------------------

_PORTFOLIO_CONFIG = ConfigDict(
    from_attributes=True,
    populate_by_name=True,
    alias_generator=to_camel,
)


class MainFrameImageResponse(BaseModel):
    model_config = _PORTFOLIO_CONFIG

    id: int
    image_url: str
    display_order: int


class ProgressStageResponse(BaseModel):
    model_config = _PORTFOLIO_CONFIG

    id: int
    progress_number: int
    stage_title: str
    description: Optional[str] = None
    images: List[str] = []

    @model_validator(mode="before")
    @classmethod
    def extract_images(cls, v):
        if hasattr(v, "progress_images"):
            return {
                "id": v.id,
                "progress_number": v.progress_number,
                "stage_title": v.stage_title,
                "description": v.description,
                "images": [img.image_url for img in v.progress_images],
            }
        return v


class PortfolioListItem(BaseModel):
    model_config = _PORTFOLIO_CONFIG

    portfolio_project_id: str
    project_title: str
    short_description: str
    cover_image: Optional[str] = None
    location: Optional[str] = None
    year: Optional[int] = None


class PortfolioDetail(BaseModel):
    model_config = _PORTFOLIO_CONFIG

    portfolio_project_id: str
    project_title: str
    short_description: str
    full_description: Optional[str] = None
    location: Optional[str] = None
    area: Optional[str] = None
    client_name: Optional[str] = None
    year: Optional[int] = None
    cover_image: Optional[str] = None
    main_frame_images: List[MainFrameImageResponse] = []
    progress_stages: List[ProgressStageResponse] = []


class PortfolioCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    project_title: str
    short_description: str
    full_description: Optional[str] = None
    location: Optional[str] = None
    area: Optional[str] = None
    client_name: Optional[str] = None
    year: Optional[int] = None


class PortfolioUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    project_title: Optional[str] = None
    short_description: Optional[str] = None
    full_description: Optional[str] = None
    location: Optional[str] = None
    area: Optional[str] = None
    client_name: Optional[str] = None
    year: Optional[int] = None


class ProgressStageCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    progress_number: int
    stage_title: str
    description: Optional[str] = None
