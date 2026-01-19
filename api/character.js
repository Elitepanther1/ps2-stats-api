import axios from "axios";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: "Missing character name" });
  }

  // 🔥 HARDCODED ON PURPOSE (TEST)
  const SERVICE_ID = "s:example";

  try {
    const url =
      `https://census.daybreakgames.com/${SERVICE_ID}/get/ps2:v2/character/` +
      `?name.first_lower=${encodeURIComponent(name.toLowerCase())}` +
      `&c:resolve=stat` +
      `&c:limit=1`;

    const r = await axios.get(url);
    const c = r.data.character_list?.[0];

    if (!c) {
      return res.status(404).json({ error: "Character not found" });
    }

    const stats = c.stats?.stat ?? [];

    const getStat = (stat) =>
      Number(stats.find(s => s.stat_name === stat)?.value || 0);

    res.json({
      name: c.name.first,
      br: Number(c.battle_rank.value),
      faction: c.faction_id,
      kills: getStat("kills"),
      deaths: getStat("deaths")
    });

  } catch (err) {
    console.error("API ERROR:", err.message);
    res.status(500).json({
      error: "Census API error",
      details: err.message
    });
  }
}
