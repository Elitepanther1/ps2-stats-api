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
      "&c:resolve=stat_history(stat_name,all_time)" +
      "&c:tree=stat_name^start:stats.stat_history" +
      "&c:resolve=times(minutes_played)" +
      "&c:limit=1";

    const response = await fetch(url);
    if (!response.ok) throw new Error("Census API failed");

    const data = await response.json();
    const char = data.character_list?.[0];
    if (!char) {
      return res.status(404).json({ error: "Character not found" });
    }

    // Stat history
    const history = char.stats?.stat_history || {};
    const kills = Number(history.kills?.all_time || 0);
    const deaths = Number(history.deaths?.all_time || 0);

    // Playtime
    const minutesPlayed = Number(char.times?.minutes_played || 0);
    const totalHours = Math.floor(minutesPlayed / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    res.json({
      name: char.name.first,
      battleRank: Number(char.battle_rank.value),
      factionId: char.faction_id,
      kills,
      deaths,
      kd: deaths === 0 ? "∞" : (kills / deaths).toFixed(2),
      playtime: `${days}d ${hours}h`
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}
