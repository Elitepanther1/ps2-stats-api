import axios from "axios";

export default async function handler(req, res) {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Missing character name" });
  }

  const SERVICE_ID = process.env.SERVICE_ID; // ex: s:Elite112608
  const BASE = "https://census.daybreakgames.com";

  try {
    const url =
      `${BASE}/${SERVICE_ID}/get/ps2:v2/character/` +
      `?name.first_lower=${encodeURIComponent(name.toLowerCase())}` +
      `&c:resolve=stat` +
      `&c:limit=1`;

    const r = await axios.get(url);
    const c = r.data.character_list?.[0];

    if (!c) {
      return res.status(404).json({ error: "Character not found" });
    }

    const stats = c.stats?.stat ?? [];

    const getStat = (name) =>
      Number(stats.find(s => s.stat_name === name)?.value ?? 0);

    res.json({
      name: c.name.first,
      br: Number(c.battle_rank.value),
      faction: c.faction_id,
      kills: getStat("kills"),
      deaths: getStat("deaths")
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "API error" });
  }
}
