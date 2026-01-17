export default async function handler(req, res) {
  try {
    const name = req.query.name;

    if (!name) {
      return res.status(400).json({ error: "Missing character name" });
    }

    const url =
      `https://census.daybreakgames.com/s:example/get/ps2:v2/character` +
      `?name.first_lower=${name.toLowerCase()}` +
      `&c:resolve=stat`;

    const response = await fetch(url);
    const data = await response.json();

    // Make sure character exists
    if (!data.character_list || data.character_list.length === 0) {
      return res.status(404).json({ error: "Character not found" });
    }

    const character = data.character_list[0];

    // SAFE access (this is the fix)
    const stats = character.stats?.stat || [];

    res.json({
      name: character.name.first,
      stats: stats
    });

  } catch (err) {
    res.status(500).json({
      error: "API error",
      details: err.message
    });
  }
}
