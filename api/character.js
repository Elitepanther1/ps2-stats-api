export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: "Missing character name" });
  }

  try {
    const url =
      "https://census.daybreakgames.com/get/ps2:v2/character/" +
      "?name.first_lower=" + encodeURIComponent(name.toLowerCase()) +
      "&c:resolve=stat,stat_history(stat_name,all_time),weapon_stat_by_faction" +
      "&c:limit=1";

    const response = await fetch(url);
    if (!response.ok) throw new Error("Census API failed");

    const data = await response.json();
    const char = data.character_list?.[0];
    if (!char) {
      return res.status(404).json({ error: "Character not found" });
    }

    // ===== EXISTING WORKING STATS =====
    const statHistory = char.stats?.stat_history || [];

    const getHistory = (n) =>
      Number(statHistory.find(s => s.stat_name === n)?.all_time || 0);

    const kills = getHistory("kills");
    const deaths = getHistory("deaths");
    const playtimeSeconds = getHistory("play_time");

    // ===== FIXED HEADSHOTS =====
    const weaponStats = char.weapon_stat_by_faction || [];
    let headshots = 0;

    for (const weapon of weaponStats) {
      for (const stat of weapon.stats || []) {
        if (stat.stat_name === "headshots") {
          headshots += Number(stat.value || 0);
        }
      }
    }

    // ===== RESPONSE =====
    res.json({
      name: char.name.first,
      battleRank: Number(char.battle_rank.value),
      factionId: char.faction_id,
      kills,
      deaths,
      kd: deaths > 0 ? (kills / deaths).toFixed(2) : "∞",
      headshots,
      playtimeHours: (playtimeSeconds / 3600).toFixed(1)
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}
