export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: "Missing character name" });
  }

  try {
    const url =
      "https://census.daybreakgames.com/s:Elite112608/get/ps2:v2/character/" +
      "?name.first_lower=" + encodeURIComponent(name.toLowerCase()) +
      "&c:join=title,characters_online_status,outfit_member_extended" +
      "&c:resolve=stat,stat_history(stat_name,all_time),weapon_stat_by_faction" +
      "&c:tree=stat_name^start:stats.stat_history";

    const response = await fetch(url);
    const data = await response.json();

    const char = data.character_list?.[0];
    if (!char) {
      return res.status(404).json({ error: "Character not found" });
    }

    const history = char.stats?.stat_history || [];
    const stat = char.stats?.stat || [];

    const getHistory = (name) =>
      Number(history.find(s => s.stat_name === name)?.all_time || 0);

    const getStat = (name) =>
      Number(stat.find(s => s.stat_name === name)?.value_forever || 0);

    const kills = getHistory("kills");
    const deaths = getHistory("deaths");
    const playtimeSeconds = getHistory("play_time");
    const headshots = getStat("headshots");

    res.json({
      name: char.name.first,
      battleRank: Number(char.battle_rank.value),
      factionId: char.faction_id,
      online: char.characters_online_status?.online_status === "1",
      kills,
      deaths,
      kd: deaths > 0 ? (kills / deaths).toFixed(2) : "∞",
      headshots,
      playtimeHours: (playtimeSeconds / 3600).toFixed(1)
    });

  } catch (err) {
    console.error("Census API error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
