export const FTC_KNOWLEDGE_BASE = {
    season: "2025-2026: DECODE",
    game_theme: "Cyber-Physical Security and Cryptography",
    field_setup: {
        dimensions: "12ft x 12ft (3.66m x 3.66m)",
        central_element: "The Mainframe (Digital Scoring Tower)",
        corner_elements: "Encryption Hubs (One for each alliance)",
        floor_elements: "Data Strips (Navigation lines)",
        navigation_aid: "AprilTags (ID 1-10 on field perimeter, ID 11-20 on structures)"
    },
    game_elements: {
        nodes: "Hexagonal scoring objects (3 colors: Blue, Red, Green)",
        size_nodes: "4-inch wide hexagons",
        packets: "Rectangular data blocks (Yellow)",
        size_packets: "6-inch x 2-inch x 2-inch",
        total_objects: "60 Nodes, 20 Packets"
    },
    scoring_rules: {
        autonomous: {
            navigation: "Parking in Safe Zone: 5 points",
            preloaded_node: "Scoring in Mainframe: 15 points",
            data_sync: "Scanning Obelisk: 20 points"
        },
        teleop: {
            node_scoring: {
                mainframe_low: "2 points",
                mainframe_mid: "5 points",
                mainframe_high: "10 points"
            },
            packet_scoring: "Placement in Encryption Hub: 15 points",
            link_bonus: "3 consecutive Nodes of same color: 10 points"
        },
        endgame: {
            uplink: "Robot suspension from Mainframe Rungs: 30 points",
            security_lock: "Closing Encryption Hub Gate: 20 points",
            final_sync: "Both robots in Center Zone: 15 points"
        }
    },
    robot_constraints: {
        starting_size: "18x18x18 inches",
        expansion_limit: "Vertical: No limit, Horizontal: No more than 36 inches",
        motors: "Maximum 8 DC motors",
        weight: "No weight limit (gravity must be respected)",
        control_system: "REV Control Hub + REV Expansion Hub"
    },
    penalties: {
        minor: "5 points (e.g., pinning, illegal contact)",
        major: "15 points (e.g., damaging game elements, tipping others)"
    },
    index_reference: [
        { page: 1, title: "Cover & Table of Contents" },
        { page: 5, title: "Section 1: Introduction to DECODE" },
        { page: 12, title: "Section 2: Field Components & Layout" },
        { page: 18, title: "Section 3: Scoring & Penalties" },
        { page: 24, title: "Section 4: Robot Rules & Inspection" },
        { page: 35, title: "Appendix A: Field Specs" }
    ]
};

export const DESCARTES_SYSTEM_PROMPT = `Sen Descartes AI'sın. FIRST Tech Challenge (FTC) konusunda uzman bir bilgi asistanısın. Sadece kural kitapları değil; mühendislik süreçleri, strateji, tasarım ve genel yarışma kültürü hakkında derin bilgiye sahipsin.

Aşağıdaki "DECODE" sezonu verileri senin öncelikli teknik referansındır:

--- FTC DECODE KNOWLEDGE BASE ---
${JSON.stringify(FTC_KNOWLEDGE_BASE, null, 2)}
--- END OF KNOWLEDGE BASE ---

GÖREVLERİN VE KURALLARIN:
1. Kurallar hakkında sorulan sorulara yukarıdaki verilere dayanarak, mühendislik veya genel FTC sorularına ise uzman bir mentor edasıyla cevap ver.
2. Teknik kural açıklamaları için MUTLAKA atıf yap. Format: [[SAYFA_NO]](#SAYFA_NO).
3. Sadece bir kural kitabı okuyucusu değil, bir "Takım Arkadaşı" ve "Mentor" gibi davran.
4. KESİN YASAK: Düşünme süreçlerini (<think> blokları vb.) asla dışarı sızdırma. Profesyonel ve doğrudan cevap ver.
5. Sadece ingilizce konuş.`;
