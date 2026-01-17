const axios = require("axios");

module.exports = async (req, res) => {
  const name = req.query.name;

  if (!name) {
    return res.status(400).json({ error: "Missing character name" });
  }

  const SERVICE_ID = process.env.SERVICE_ID;
  const BASE = "https://census.daybreakgames.com";

  if (!SERVICE_ID) {
    return res.status(500).json({ error: "Service ID not set" });
  }

  try {
    const url = `${BASE}/${SERVICE_ID}/get/ps2:v2/character/?name.first_lower=${name.toLowerCase()}&c:resolve=stats&c:limit=1`;

    const r = await axios.get(url);
    const c = r.data.character_list[0];

    if (!c) {
      return res.json({ error: "Character not found" });
    }

    res.json({
      name: c.name.first,
      br: c.battle_rank.value,
      faction: c.faction_id,
      kills: c.stats.stat.find(s => s.stat_name === "kills")?.value || 0,
      deaths: c.stats.stat.find(s => s.stat_name === "deaths")?.value || 0
    });
  } catch (err) {
    res.status(500).json({ error: "API error", details: err.message });
  }
};
