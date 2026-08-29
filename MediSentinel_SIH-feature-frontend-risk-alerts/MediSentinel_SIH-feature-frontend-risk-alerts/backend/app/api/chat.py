"""MEDISENTINEL AI Health Chatbot API Router."""
from typing import Annotated, Any
from fastapi import APIRouter, Body, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.areas import _frontend_area_summary
from app.db.session import get_db
from app.models.domain import Area
from app.services.chatbot_engine import process_chat_message

router = APIRouter(prefix="/chat", tags=["chatbot"])


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User query or symptom question")
    conversation_history: list[dict[str, str]] | None = Field(default=None, description="Previous message history")
    selected_area_id: str | None = Field(default=None, description="Currently selected ward ID for context")


class ChatResponse(BaseModel):
    response: str
    category: str
    suggested_questions: list[str]
    related_actions: list[str]
    timestamp: str


@router.post("", response_model=ChatResponse)
def handle_chat_message(
    payload: ChatMessageRequest,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, Any]:
    """Process user queries regarding disease outbreak, prevention protocols, medical questions, or app usage."""
    # Retrieve current live area statistics from DB
    areas = db.scalars(select(Area).order_by(Area.name)).all()
    summaries = [_frontend_area_summary(db, area) for area in areas]

    return process_chat_message(
        message=payload.message,
        conversation_history=payload.conversation_history,
        areas_data=summaries,
        selected_area_id=payload.selected_area_id,
    )

