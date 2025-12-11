from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Optional
import os
import requests
import json

from schemas import (
    MCGOutput,
    DiagramInstructions,
    VCAInput,
    VCAOutput,
    AGAInput,
    AGAOutput,
    DSAInput,
    DSAOutput,
)

# Gemini API Configuration
GEMINI_API_KEY = "AIzaSyCBKYLT_8T9eVQF7zm-2eaMHJi-zaQVwu8"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"


class BaseAgent(ABC):
    name: str

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def __call__(self, *args, **kwargs):  # pragma: no cover
        raise NotImplementedError


class MCGAgent(BaseAgent):
    def __init__(self):
        super().__init__("Master Content Generator")

    def _call_gemini(self, prompt: str) -> str:
        """Call Gemini API and return the response text"""
        try:
            response = requests.post(
                f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}]
                },
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"Gemini API error: {e}")
            return ""

    def __call__(self, prompt: str, audience: str = "beginner") -> MCGOutput:
        topic = prompt.strip().rstrip(".")

        # Generate outline using Gemini
        outline_prompt = f"""For the topic "{topic}" at {audience} level, provide a 4-point outline for educational content.
Return only 4 concise section titles, one per line, no numbering or formatting."""
        outline_text = self._call_gemini(outline_prompt)
        outline = [line.strip() for line in outline_text.strip().split("\n") if line.strip()][:4] or [
            "Core Concepts",
            "Step-by-step Explanation",
            "Visual Diagram Plan",
            "Voiceover Script",
        ]

        # Generate sections using Gemini
        sections_prompt = f"""For the topic "{topic}" at {audience} level, create 3 sections with bullets:
1. Core Concepts (3 bullets)
2. Step-by-step Explanation (3 bullets)
3. Key Takeaways (3 bullets)

Format as:
Section: Title
- Bullet 1
- Bullet 2
- Bullet 3

Section: Title
- Bullet 1
- Bullet 2
- Bullet 3"""
        
        sections_text = self._call_gemini(sections_prompt)
        sections = self._parse_sections(sections_text, topic)

        # Generate diagram nodes and edges using Gemini
        diagram_prompt = f"""For "{topic}", design a flowchart with 4 key nodes and their connections.
Provide:
- 4 node labels (short, 1-2 words each)
- Connections between them (which nodes connect to which)

Format:
Nodes: Node1, Node2, Node3, Node4
Edges: Node1->Node2 (label), Node2->Node3 (label), Node3->Node4 (label)"""
        
        diagram_text = self._call_gemini(diagram_prompt)
        diagram = self._parse_diagram(diagram_text, topic)

        # Generate voice script using Gemini
        voice_prompt = f"""Create a brief 2-3 sentence voiceover script introducing "{topic}" for {audience} learners. Make it engaging and welcoming."""
        voice_script = self._call_gemini(voice_prompt) or (
            f"Welcome! In this lesson, we'll explore {topic}. "
            f"We'll start with the core concepts, then walk through a simple workflow, "
            f"and finally review how outputs are evaluated to improve the process. "
            f"Let's begin."
        )

        return MCGOutput(
            topic=topic,
            audience=audience if audience in {"beginner", "intermediate", "advanced"} else "beginner",
            outline=outline,
            sections=sections,  # type: ignore
            diagram_instructions=diagram,
            voice_script=voice_script,
            metadata={"version": "1.0", "generated_by": "Gemini API"},
        )

    def _parse_sections(self, text: str, topic: str):
        """Parse Gemini response into sections format"""
        sections = []
        current_section = None
        current_bullets = []
        
        for line in text.split("\n"):
            line = line.strip()
            if line.startswith("Section:") or (line and not line.startswith("-") and current_section):
                if current_section:
                    sections.append({"title": current_section, "bullets": current_bullets})
                current_section = line.replace("Section:", "").strip()
                current_bullets = []
            elif line.startswith("-"):
                current_bullets.append(line[1:].strip())
        
        if current_section and current_bullets:
            sections.append({"title": current_section, "bullets": current_bullets})
        
        # Fallback if parsing fails
        if len(sections) < 2:
            sections = [
                {
                    "title": "Core Concepts",
                    "bullets": [
                        f"Definition and purpose of {topic}.",
                        f"When to use {topic} and typical scenarios.",
                        f"Key terminology and mental models.",
                    ],
                },
                {
                    "title": "Step-by-step Explanation",
                    "bullets": [
                        f"Set up prerequisites for {topic}.",
                        f"Walk through the main workflow with an example.",
                        f"Common pitfalls and how to avoid them.",
                    ],
                },
            ]
        
        return sections[:3]

    def _parse_diagram(self, text: str, topic: str):
        """Parse Gemini response into diagram format"""
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        
        # Try to extract nodes and edges
        nodes_line = next((l for l in lines if l.lower().startswith("nodes:")), "")
        edges_line = next((l for l in lines if l.lower().startswith("edges:")), "")
        
        # Parse nodes
        node_labels = []
        if nodes_line:
            node_text = nodes_line.split(":", 1)[1] if ":" in nodes_line else nodes_line
            node_labels = [n.strip() for n in node_text.split(",") if n.strip()][:4]
        
        if not node_labels:
            node_labels = ["Input", "Process", "Output", "Feedback"]
        
        # Create nodes
        nodes = [
            {"id": f"n{i}", "label": label, "description": f"{label} stage"}
            for i, label in enumerate(node_labels)
        ]
        
        # Create simple linear edges
        edges = []
        for i in range(len(nodes) - 1):
            edges.append({"source": nodes[i]["id"], "target": nodes[i+1]["id"], "label": "next"})
        # Add feedback loop
        if len(nodes) > 2:
            edges.append({"source": nodes[-1]["id"], "target": nodes[0]["id"], "label": "refine"})
        
        return DiagramInstructions(
            diagram_type="flowchart",
            title=f"{topic} — Overview",
            description=f"A high-level flow of {topic} showing key stages.",
            nodes=nodes,
            edges=edges,
        )


class VCAgent(BaseAgent):
    def __init__(self):
        super().__init__("Visual Creator Agent")

    def __call__(self, data: VCAInput) -> VCAOutput:
        di = data.instructions
        dir_map = {"LR": "LR", "TB": "TD", "BT": "BT", "RL": "RL"}
        direction = dir_map.get(di.layout.direction, "LR")

        def node_line(n):
            shape_open = "([" if di.style.node_shape == "stadium" else "("
            shape_close = "])" if di.style.node_shape == "stadium" else ")"
            return f"    {n.id}{shape_open}{n.label}{shape_close}:::node"

        nodes_str = "\n".join(node_line(n) for n in di.nodes)
        edges_str = "\n".join(
            f"    {e.source}-->{'|'+e.label+'|' if e.label else ''}{e.target}" for e in di.edges
        )

        mermaid = f"""
flowchart {direction}
{nodes_str}
{edges_str}

classDef node fill:{di.style.accent_color},stroke:#1f2937,color:#111827,rx:6,ry:6;
%% Title: {di.title}
%% Desc: {di.description}
""".strip()

        alt_text = (
            f"{di.diagram_type.capitalize()} showing: "
            + ", ".join(f"{n.label}" for n in di.nodes)
            + ". Arrows indicate: "
            + "; ".join(
                f"{e.source} to {e.target}{' ('+e.label+')' if e.label else ''}" for e in di.edges
            )
            + "."
        )

        legend = [
            f"Layout: {di.layout.direction}",
            f"Theme: {di.style.theme}",
            f"Accent: {di.style.accent_color}",
        ]

        return VCAOutput(
            diagram_type=di.diagram_type,
            mermaid=mermaid,
            alt_text=alt_text,
            legend=legend,
        )


class AGAagent(BaseAgent):
    def __init__(self):
        super().__init__("Audio Generator Agent")

    def __call__(self, data: AGAInput) -> AGAOutput:
        # Produce SSML and leave audio synthesis to pluggable backend (not included by default)
        ssml = f"""
<speak>
  <voice name="{data.voice}">
    <prosody rate="{data.rate}" pitch="{data.pitch}">{data.text}</prosody>
  </voice>
</speak>
""".strip()
        return AGAOutput(
            transcript=data.text,
            ssml=ssml,
            audio_format=data.format,
            audio_b64=None,
        )


class DSAagent(BaseAgent):
    def __init__(self):
        super().__init__("Demo Script Agent")

    def __call__(self, data: DSAInput) -> DSAOutput:
        narration = (
            f"Hi, this is a quick demo of {data.project_name}. In under {data.duration_sec} seconds, "
            f"I'll show how it tackles {data.topic}. First, we set up the inputs, then run the core process, "
            f"and finish by checking the output. That's {data.project_name} in a nutshell!"
        )
        return DSAOutput(narration=narration)
