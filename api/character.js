export default async function handler(req, res) {
  const name = req.query.name;
  if (!name) {
    return res.status(400).json({ error: "Missing character name" });
  }

  try {
    const url =
      "https://census.daybreakgames.com/s:example/get/ps2:v2/character" +
      "?name.first_lower=" + encodeURIComponent(name.toLowerCase()) +
      "&c:resolve=stat,online_status" +
      "&c:join=characters_stat^list:1^on:character_id^to:character_id";

    const r = await fetch(url);
    const j = await r.json();

    if (!j.character_list || j.character_list.length === 0) {
      return res.status(404).json({ error: "Character not found" });
    }

    const c = j.character_list[0];

    const stats = {};
    if (c.characters_stat) {
      for (const s of c.characters_stat) {
        stats[s.stat_name] = Number(s.value_forever || 0);
      }
    }

    const kills = stats.kills || 0;
    const deaths = stats.deaths || 0;
    const headshots = stats.headshots || 0;
    const playtimeSeconds = stats.play_time || 0;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({
      name: c.name.first,
      battleRank: c.battle_rank.value,
      factionId: c.faction_id,

      kills,
      deaths,
      kd: deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2),
      headshots,

      playtimeHours: (playtimeSeconds / 3600).toFixed(1),

      online: c.online_status?.online_status === "1"
    });

  } catch (err) {
    res.status(500).json({ error: "API failure", details: err.message });
  }
}
