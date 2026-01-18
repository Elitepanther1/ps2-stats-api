export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const name = req.query.name;
    if (!name) {
      return res.status(400).json({ error: "Missing character name" });
    }

    // ===============================
    // 1) GET BASIC CHARACTER INFO
    // ===============================
    const charUrl =
      `https://census.daybreakgames.com/s:example/get/ps2:v2/character` +
      `?name.first_lower=${name.toLowerCase()}` +
      `&c:resolve=online_status,faction`;

    const charRes = await fetch(charUrl);
    const charData = await charRes.json();

    if (!charData.character_list || charData.character_list.length === 0) {
      return res.status(404).json({ error: "Character not found" });
    }

    const character = charData.character_list[0];
    const charId = character.character_id;

    // ===============================
    // 2) GET REAL LIFETIME STATS
    // ===============================
    const statsUrl =
      `https://census.daybreakgames.com/s:example/get/ps2:v2/characters_stat_history` +
      `?character_id=${charId}`;

    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();

    const statsList = statsData.characters_stat_history_list || [];

    // Helper: safely read stat by name
    const getStat = (statName) => {
      const stat = statsList.find(s => s.stat_name === statName);
      return stat ? Number(stat.all_time || 0) : 0;
    };

    const kills = getStat("kills");
    const deaths = getStat("deaths");
    const headshots = getStat("headshots");
    const playtimeSeconds = getStat("play_time");

    const kd = deaths > 0 ? (kills / deaths).toFixed(2) : "∞";
    const playtimeHours = (playtimeSeconds / 3600).toFixed(1);

    // ===============================
    // 3) ONLINE STATUS (BEST POSSIBLE)
    // ===============================
    const isOnline =
      character.online_status?.online_status === "1";

    // ===============================
    // 4) SEND CLEAN RESPONSE TO PANEL
    // ===============================
    res.json({
      name: character.name.first,
      battleRank: character.battle_rank?.value || 0,
      factionId: character.faction_id || null,
      kills,
      deaths,
      kd,
      headshots,
      playtimeHours,
      online: isOnline
    });

  } catch (err) {
    res.status(500).json({
      error: "API error",
      details: err.message
    });
  }
}
