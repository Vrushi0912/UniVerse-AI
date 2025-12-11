from __future__ import annotations
import json
import argparse

from orchestrator import MasterOrchestrator


def build_mcg_text(topic: str, result) -> str:
    # 1) Title
    title_line = f"1. Title: **{topic}**\n"

    # 2) Content (max 5 points, H2 subheadings + one concise line)
    points = [
        ("Big Idea", f"{topic} helps you reach a clear goal by following a simple plan."),
        ("How It Works", "Take inputs, apply a few steps, and get a result you can check and improve."),
        ("When To Use It", f"Use {topic} when you want faster, clearer outcomes than trial-and-error."),
        ("Common Pitfall", "Skipping small checks creates bigger problems later—verify each step."),
        ("Outcome", "You finish with a usable result and a path to make it better next time."),
    ]
    content_lines = ["2. Content:"] + [
        f"## {h}\n{line}" for h, line in points[:5]
    ]
    content_block = "\n".join(content_lines) + "\n"

    # 3) Image Instruction from diagram instructions
    di = result.mcg.diagram_instructions
    node_list = ", ".join(n.label for n in di.nodes)
    edge_list = "; ".join(
        f"{e.source} -> {e.target}{' ('+e.label+')' if e.label else ''}"
        for e in di.edges
    )
    img_line = (
        "3. Image Instruction:\n"
        f"[DIAGRAM PROMPT:] Draw a professional, labeled {di.diagram_type} titled \"{di.title}\". "
        f"Place nodes: {node_list}. Connect edges: {edge_list}. "
        f"Layout {di.layout.direction} with clear spacing (rank {di.layout.rank_spacing}, node {di.layout.node_spacing}). "
        f"Style nodes with accent {di.style.accent_color} and consistent shapes; include a small legend for layout and theme."
    )

    # 4) Voice Script (concatenate Title and Content into one paragraph for TTS)
    voice_parts = [
        f"{topic}.",
        points[0][1],
        points[1][1],
        points[2][1],
        points[3][1],
        points[4][1],
    ]
    voice_line = "4. Voice Script:\n" + " ".join(voice_parts)

    return "\n\n".join([title_line, content_block, img_line, voice_line])


def main():
    parser = argparse.ArgumentParser(description="Master Content Generator runner")
    parser.add_argument("topic", nargs="*", help="Topic to generate content for")
    parser.add_argument("--audience", choices=["beginner", "intermediate", "advanced"], default="beginner")
    parser.add_argument("--demo", dest="make_demo", action="store_true", help="Also generate a short demo narration")
    parser.add_argument("--no-demo", dest="make_demo", action="store_false")
    parser.set_defaults(make_demo=False)
    parser.add_argument("--project-name", default=None)
    parser.add_argument("--duration", type=int, default=45, help="Demo duration in seconds")
    parser.add_argument("--output", choices=["json", "mcg"], default="json", help="Output format")
    args = parser.parse_args()

    topic = " ".join(args.topic).strip()
    if not topic:
        try:
            topic = input("Enter topic: ").strip()
        except EOFError:
            topic = "General Topic"
    if not topic:
        topic = "General Topic"

    orchestrator = MasterOrchestrator()
    result = orchestrator.run(
        prompt=topic,
        audience=args.audience,
        make_demo=args.make_demo,
        project_name=args.project_name,
        demo_duration_sec=args.duration,
    )

    if args.output == "json":
        print(json.dumps(result.model_dump(), indent=2))
    else:
        print(build_mcg_text(topic, result))


if __name__ == "__main__":
    main()
