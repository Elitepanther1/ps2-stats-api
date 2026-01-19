export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: "Missing character name" });
  }

  try {
    const url =
      "https://census.daybreakgames.com/s:example/get/ps2:v2/character/" +
      "?name.first_lower=" + encodeURIComponent(name.toLowerCase()) +
      "&c:resolve=stat_history(stat_name,all_time)" +
      "&c:limit=1";

    const response = await fetch(url);
    const data = await response.json();

    const char = data.character_list?.[0];
    if (!char) {
      return res.status(404).json({ error: "Character not found" });
    }

    // ✅ stat_history is an ARRAY
    const stats = char.stats?.stat_history || [];

    const getStat = (name) => {
      const s = stats.find(x => x.stat_name === name);
      return Number(s?.all_time || 0);
    };

    const kills = getStat("kills");
    const deaths = getStat("deaths");
    const headshots = getStat("headshots");
    const playtimeSeconds = getStat("play_time");

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
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
