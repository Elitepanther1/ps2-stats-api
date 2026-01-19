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
      "&c:resolve=stat" +
      "&c:limit=1";

    const response = await fetch(url);
    const data = await response.json();

    const c = data.character_list?.[0];

    if (!c) {
      return res.status(404).json({ error: "Character not found" });
    }

    const stats = c.stats?.stat || [];

    const getStat = (stat) =>
      Number(stats.find(s => s.stat_name === stat)?.value || 0);

    res.json({
      name: c.name.first,
      battleRank: Number(c.battle_rank.value),
      factionId: c.faction_id,
      kills: getStat("kills"),
      deaths: getStat("deaths"),
      headshots: getStat("headshots"),
      playtimeSeconds: getStat("play_time")
    });

  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({
      error: "Server error",
      details: String(err)
    });
  }
}
