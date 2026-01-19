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
      "&c:resolve=stat,stat_history(stat_name,all_time)" +
      "&c:limit=1";

    const response = await fetch(url);
    if (!response.ok) throw new Error("Census API failed");

    const data = await response.json();
    const char = data.character_list?.[0];
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

    // ✅ LIFETIME PLAYTIME (SECONDS — NOT minutes)
    const playtimeSeconds = getStat("play_time");
    
    const totalHours = Math.floor(playtimeSeconds / 3600);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;


    res.json({
      name: char.name.first,
      battleRank: Number(char.battle_rank.value),
      factionId: char.faction_id,
      kills,
      deaths,
      kd: deaths > 0 ? (kills / deaths).toFixed(2) : "∞",
      playtime: `${days}d ${hours}h`
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}
