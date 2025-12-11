from __future__ import annotations
from typing import List, Literal, Optional, Dict
from pydantic import BaseModel, Field


class DiagramNode(BaseModel):
    id: str
    label: str
    description: Optional[str] = None
    group: Optional[str] = None


class DiagramEdge(BaseModel):
    source: str
    target: str
    label: Optional[str] = None


class DiagramLayout(BaseModel):
    direction: Literal["LR", "TB", "BT", "RL"] = Field(
        default="LR", description="Graph layout direction: LR, TB, BT, RL"
    )
    rank_spacing: int = 50
    node_spacing: int = 30


class DiagramStyle(BaseModel):
    theme: Literal["default", "neutral", "primary", "contrast"] = "default"
    accent_color: str = "#3b82f6"
    node_shape: Literal["rounded", "rect", "stadium"] = "rounded"


class DiagramInstructions(BaseModel):
    diagram_type: Literal["flowchart", "mindmap", "sequence", "timeline"] = "flowchart"
    title: str
    description: str
    nodes: List[DiagramNode]
    edges: List[DiagramEdge]
    layout: DiagramLayout = DiagramLayout()
    style: DiagramStyle = DiagramStyle()


class Section(BaseModel):
    title: str
    bullets: List[str]


class MCGOutput(BaseModel):
    topic: str
    audience: Literal["beginner", "intermediate", "advanced"] = "beginner"
    outline: List[str]
    sections: List[Section]
    diagram_instructions: DiagramInstructions
    voice_script: str
    metadata: Dict[str, str] = {}


class VCAInput(BaseModel):
    instructions: DiagramInstructions


class VCAOutput(BaseModel):
    diagram_type: str
    mermaid: str
    alt_text: str
    legend: List[str] = []


class AGAInput(BaseModel):
    text: str
    voice: str = "alloy"
    rate: str = "medium"  # x-slow, slow, medium, fast, x-fast
    pitch: str = "medium"  # x-low, low, medium, high, x-high
    format: Literal["ssml", "mp3", "wav", "ogg"] = "ssml"


class AGAOutput(BaseModel):
    transcript: str
    ssml: str
    audio_format: Literal["ssml", "mp3", "wav", "ogg"] = "ssml"
    audio_b64: Optional[str] = None  # Optional base64 encoded audio


class DSAInput(BaseModel):
    topic: str
    project_name: str
    duration_sec: int = 45
    tone: Literal["formal", "friendly", "enthusiastic"] = "friendly"


class DSAOutput(BaseModel):
    narration: str


class PipelineResult(BaseModel):
    mcg: MCGOutput
    vca: VCAOutput
    aga: AGAOutput
    dsa: Optional[DSAOutput] = None
