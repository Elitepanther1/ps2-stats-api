export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const name = req.query.name;
    if (!name) {
      return res.status(400).json({ error: "Missing character name" });
    }

    const url =
      "https://census.daybreakgames.com/s:example/get/ps2:v2/character/" +
      "?name.first_lower=" + encodeURIComponent(name.toLowerCase()) +
      "&c:join=characters_online_status" +
      "&c:resolve=stat_history(stat_name,all_time)" +
      "&c:tree=stat_name^start:stats.stat_history";

    const response = await fetch(url);
    const data = await response.json();

    if (!data.character_list || data.character_list.length === 0) {
      return res.status(404).json({ error: "Character not found" });
    }

    const char = data.character_list[0];

    // Convert stat array → map
    const statArray = char.stats?.stat_history || [];
    const statMap = {};
    for (const stat of statArray) {
      statMap[stat.stat_name] = Number(stat.all_time || 0);
    }

    const kills = statMap.kills || 0;
    const deaths = statMap.deaths || 0;
    const headshots = statMap.headshots || 0;
    const playtimeSeconds = statMap.play_time || 0;

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
      head
