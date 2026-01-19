import axios from "axios";

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
      "&c:resolve=stat,stat_history(stat_name,all_time)" +
      "&c:limit=1";

    const r = await axios.get(url);
    const char = r.data.character_list?.[0];

    if (!char) {
      return res.status(404).json({ error: "Character not found" });
    }

    const history = char.stats?.stat_history || [];
    const stats = char.stats?.stat || [];

    const getHistory = (n) =>
      Number(history.find(s => s.stat_name === n)?.all_time || 0);

    const getStat = (n) =>
      Number(stats.find(s => s.stat_name === n)?.value_forever || 0);

    const kills = getHistory("kills");
    const deaths = getHistory("deaths");
    const playtimeSeconds = getHistory("play_time");
    const headshots = getStat("headshots");

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
    console.error("API ERROR:", err?.response?.data || err);
    res.status(500).json({ error: "Server error" });
  }
}
