from __future__ import annotations
from typing import Optional

from schemas import PipelineResult, VCAInput, AGAInput, DSAInput
from agents import MCGAgent, VCAgent, AGAagent, DSAagent


class MasterOrchestrator:
    def __init__(self):
        self.mcg = MCGAgent()
        self.vca = VCAgent()
        self.aga = AGAagent()
        self.dsa = DSAagent()

    def run(self, prompt: str, audience: str = "beginner", make_demo: bool = False,
            project_name: Optional[str] = None, demo_duration_sec: int = 45) -> PipelineResult:
        # 1) Generate master structured content
        mcg_out = self.mcg(prompt, audience=audience)

        # 2) Visual from diagram instructions
        vca_out = self.vca(VCAInput(instructions=mcg_out.diagram_instructions))

        # 3) Audio from voice script
        aga_out = self.aga(AGAInput(text=mcg_out.voice_script))

        # 4) Optional demo narration
        dsa_out = None
        if make_demo:
            dsa_out = self.dsa(
                DSAInput(
                    topic=mcg_out.topic,
                    project_name=project_name or f"{mcg_out.topic} Demo",
                    duration_sec=demo_duration_sec,
                )
            )

        return PipelineResult(mcg=mcg_out, vca=vca_out, aga=aga_out, dsa=dsa_out)
