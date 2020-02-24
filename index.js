const ObjectsToCsv = require("objects-to-csv");

(async () => {
  const fetch = require("node-fetch");
  const data = await fetch(
    "https://snokinghockeyleague.com/api/game/list/1063/178/0?v=1020620"
  );
  const games = await data.json();
  const gamesWithBoxscore = games.filter(x => x.isScoresheetSet);

  let allPenalties = [];

  for (i = 0; i < gamesWithBoxscore.length; i++) {
    console.log(`on game ${i} of ${gamesWithBoxscore.length}`);
    try {
      const gameToCheck = gamesWithBoxscore[i];
      const gameData = await (
        await fetch(
          `https://snokinghockeyleague.com/api/scoresheet/getView/${gameToCheck.id}?v=1020620`
        )
      ).json();
      const penalties = [
        gameData.penaltySummary.p1,
        gameData.penaltySummary.p2,
        gameData.penaltySummary.p3
      ]
        .reduce((a, b) => a.concat(b))
        .filter(x => x.time != 0)
        .map(x => {
          const raw = x.html;
          return {
            team: raw.split(" - ")[0],
            infraction: raw.includes("<a")
              ? raw.split("</a> (")[1].split("),")[0]
              : raw.split(" - ")[1].split(", ")[0],
            who: raw.match(/\d+\. (?<name>[\S\s]+)<\/a>/)
              ? raw.match(/\d+\. (?<name>[\S\s]+)<\/a>/).groups.name
              : null,
            link: `https://snokinghockeyleague.com/#/scoresheet/${gameToCheck.id}`,
            frostGiantsInvolved:
              gameToCheck.teamAwayName === "Frost Giants" ||
              gameToCheck.teamHomeName === "Frost Giants"
                ? "YES"
                : "NO"
          };
        });
      allPenalties = allPenalties.concat(penalties);
    } catch (e) {
      console.error(e);
    }
  }
  const csv = new ObjectsToCsv(allPenalties);
  await csv.toDisk("./data.csv");
})();
