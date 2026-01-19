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
    if (!char) return res.status(404).json({ error: "Character not found" });

    const statHistory = char.stats?.stat_history || [];
    const stats = char.stats?.stat || [];

    // From stat_history
    const getHistory = (n) =>
      Number(statHistory.find(s => s.stat_name === n)?.all_time || 0);

    // ✅ FIXED: support both value_forever AND value
    const getStat = (n) => {
      const stat = stats.find(s => s.stat_name === n);
      return Number(stat?.value_forever ?? stat?.value ?? 0);
    };

    const kills = getHistory("kills");
    const deaths = getHistory("deaths");

    const headshots = getStat("headshots");        // ✅ FIXED
    const playtimeSeconds = getStat("play_time"); // unchanged

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
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
