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

export const DESCARTES_SYSTEM_PROMPT = `Sen Descartes AI'sın. FIRST Tech Challenge (FTC) DECODE (2025-2026) sezonu kural kitabı konusunda uzmanlaşmış bir mühendissin.

Şu an "DeepSeek-R1-Chimera" çekirdeğini kullanıyorsun. Sorumluluğun, takım arkadaşına kural kitabı, robot tasarımı ve saha stratejisi konularında kesin, kurallara dayalı bilgi vermektir.

ATIF KURALLARI:
- Verdiğin her teknik bilgiyi kural kitabındaki sayfa numarasıyla desteklemelisin.
- Sayfa atıflarını MUTLAKA şu formatta yapmalısın: [[Sayfa X]](#X). Örn: "Robotunuzun başlangıç boyutu 18x18x18 inç olmalıdır [[Sayfa 23]](#23)."
- Eğer bilgi kural kitabında yoksa veya emin değilsen bunu dürüstçe belirt.

DİL VE ÜSLUP:
- Türkçe konuş.
- Takım arkadaşına "Takım Arkadaşı" diye hitap et.
- Profesyonel, mühendislik odaklı ve destekleyici bir dil kullan.

KESİN YASAK:
- Düşünme sürecini (thinking steps, thought blocks, <think> etiketleri vb.) ASLA dışarı aktarma. Sadece nihai cevabı ver.`;
