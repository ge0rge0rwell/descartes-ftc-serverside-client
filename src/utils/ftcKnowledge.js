export const FTC_KNOWLEDGE_BASE = {
    season: "2025-2026: DECODE",
    periods: {
        autonomous: "30 seconds",
        teleop: "2 minutes (No separate endgame, but endgame maneuvers apply)",
    },
    artifacts: {
        total: "24 Purple, 12 Green",
        possession_limit: 3,
        size: "5-inch balls"
    },
    scoring: {
        autonomous: {
            launch_line: "3 points per robot",
            purple_artifact: "10 points",
            green_artifact: "20 points",
            motif_bonus: "20 points (Matching the random motif)"
        },
        teleop: {
            purple_artifact: "5 points",
            green_artifact: "10 points",
            overflow_artifact: "Reduced points once classifier is full",
            motif_bonus: "40 points (Completing motif in endgame)"
        },
        base_zone_parking: {
            robot_parked: "20 points per robot",
            dual_park_bonus: "30 points (If both robots fit in the 18x18 inch zone)"
        }
    },
    ranking_points: {
        win: "3 RPs",
        tie: "1 RP",
        loss: "0 RPs",
        goal_rp: "Achieved by scoring 36+ classified artifacts",
        movement_rp: "Achieved by combined launch line and base zone points"
    },
    field_elements: [
        "Obelisk (displays the random motif)",
        "Classifier Ramp & Gate",
        "Base Zone (18x18 inches)",
        "Launch Line"
    ]
};

export const DESCARTES_SYSTEM_PROMPT = `
You are DESCARTES AI, the ultra-intelligent mentor and technical advisor for the First Tech Challenge.
You speak with clarity, wisdom, and a deep understanding of engineering principles. 
You refer to the user as "Partner" or "Team Member".
You have been specifically trained on the DECODE (2025-2026) game manual.

Core Knowledge (DECODE Season):
- Artifacts: Robots can hold up to 3 artifacts (5-inch balls). There are 24 purple and 12 green artifacts.
- Scoring: Green artifacts are worth double (20pt in Auto, 10pt in Tele-Op) compared to purple (10pt in Auto, 5pt in Tele-Op).
- Motif: A 3-artifact pattern displayed on the Obelisk. Worth 20pts in Auto and 40pts in the endgame.
- Parking: Returning to the Base Zone is worth 20pts per robot. A special 30pt bonus is awarded if both alliance robots fit in the 18x18 zone.
- Ranking: RPs are earned by Winning (3), Tying (1), or hitting thresholds (Goal RP: 36+ artifacts, Movement RP: launch/park).

Always provide advice that maximizes these scoring opportunities. Promote Gracious Professionalism and technical excellence.
`;
