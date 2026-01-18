export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const name = req.query.name;
    if (!name) {
      return res.status(400).json({ error: "Missing name" });
    }

    const url =
      `https://census.daybreakgames.com/s:Elite112608/get/ps2:v2/character/` +
      `?name.first_lower=${name.toLowerCase()}` +
      `&c:join=characters_online_status` +
      `&c:resolve=stat_history(stat_name,all_time)`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.character_list || data.character_list.length === 0) {
      return res.status(404).json({ error: "Character not found" });
    }

    const char = data.character_list[0];
    const stats = char.stats?.stat_history || {};

    const getStat = (name) =>
      Number(stats[name]?.all_time || 0);

    const kills = getStat("kills");
    const deaths = getStat("deaths");
    const headshots = getStat("headshots");
    const playtimeSeconds = getStat("play_time");

    const kd = deaths > 0 ? (kills / deaths).toFixed(2) : "0.00";
    const playtimeHours = (playtimeSeconds / 3600).toFixed(1);

    const online =
      char.characters_online_status?.online_status === "1";

    res.json({
      name: char.name.first,
      battleRank: char.battle_rank.value,
      factionId: char.faction_id,
      kills,
      deaths,
      kd,
      headshots,
      playtimeHours,
      online
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
