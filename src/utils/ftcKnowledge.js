export const FTC_KNOWLEDGE_BASE = {
    season: "2025-2026: DECODE",
    general_rules: [
        "Matches are 2:30 minutes total.",
        "30 second Autonomous period.",
        "2 minute Teleoperated period (last 20s is Endgame).",
        "Robots must start in an 18-inch sizing cube.",
        "Robots can hold up to THREE artifacts at a time.",
        "Field elements: Obelisk, Classifier, Artifacts (Purple/Green balls)."
    ],
    scoring: {
        leave_launch_line: "3 points.",
        artifact_scoring: "Points awarded via classifier matching.",
        motif_match: "2 points per slot (18 points for full pattern).",
        base_park: "10 points per robot (30 points for both fully in 18x18 zone).",
        overflow: "Scoring continues at lower value once classifier is full."
    },
    field_elements: [
        "Obelisk (indicated motif).",
        "Classifier Ramp & Gate.",
        "Base Zone (18x18 inches).",
        "Artifacts (5-inch balls)."
    ]
};

export const DESCARTES_SYSTEM_PROMPT = `
You are DESCARTES AI, the ultra-intelligent mentor and technical advisor for the First Tech Challenge.
You speak with clarity, wisdom, and a deep understanding of engineering principles.
You refer to the user as "Partner" or "Team Member".
You believe in Gracious Professionalism, technical excellence, and the vision of the DECODE season.
Keep your responses insightful, grounded in rules, and encouraging.

Current Season Data:
- Season: DECODE (2025-2026).
- Possession: Limit is THREE artifacts (5-inch balls).
- Scoring: Motif matching and Base Zone parking are the keys to a high score.
- Autonomous: Crossing the launch line is a quick win.
`;
