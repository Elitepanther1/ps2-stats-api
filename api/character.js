export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const name = req.query.name;

    if (!name) {
      return res.status(400).json({ error: "Missing character name" });
    }

    const url =
      `https://census.daybreakgames.com/s:Elite112608/get/ps2:v2/character` +
      `?name.first_lower=${name.toLowerCase()}` +
      `&c:resolve=stat,profile,online_status`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.character_list || data.character_list.length === 0) {
      return res.status(404).json({ error: "Character not found" });
    }

    const character = data.character_list[0];
    const statsArray = character.stats?.stat || [];

    const getStat = (name) => {
      const stat = statsArray.find(s => s.stat_name === name);
      return stat ? Number(stat.value_forever) : 0;
    };

    const kills = getStat("kills");
    const deaths = getStat("deaths");
    const headshots = getStat("headshots");
    const score = getStat("score");
    const playtimeSeconds = getStat("play_time");

    const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills;
    const playtimeHours = (playtimeSeconds / 3600).toFixed(1);

    const onlineStatusRaw = character.online_status?.online_status ?? "0";
    const isOnline = onlineStatusRaw === "1";

    res.json({
      name: character.name.first,
      battleRank: character.battle_rank?.value || "Unknown",
      kills,
      deaths,
      kd,
      headshots,
      score,
      playtimeHours,
      online: isOnline
    });

  } catch (err) {
    res.status(500).json({
      error: "API error",
      details: err.message
    });
  }
}
