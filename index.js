/**
 * @author tony <ashaid2@lsu.edu>
 */

import fetch from "node-fetch";
import fs from "fs";

async function getItem(item) {
  const baseURL = `https://api.warframe.market/v1/items/${item}/orders`;

  const response = await fetch(baseURL, {
    method: "GET",
    headers: { "Content-Type": "application/json", Platform: "pc" },
  });
  const data = await response.json();

  // sort by plat
  data.payload.orders.sort(function (a, b) {
    return a.platinum - b.platinum;
  });

  // filter by order type sell
  data.payload.orders.filter(function (item) {
    return item.order_type == "sell";
  });
  var filtered = data.payload.orders.filter((a) => a.user.status == "ingame");
}

async function getItemInfo(item) {
  const baseURL = `https://api.warframe.market/v1/items/${item}`;

  const response = await fetch(baseURL, {
    method: "GET",
    headers: { "Content-Type": "application/json", Platform: "pc" },
  });
  const data = await response.json();
  return data.payload.item.items_in_set[0].mod_max_rank;
}

async function getStats(item) {
  const baseURL = `https://api.warframe.market/v1/items/${item}/statistics`;

  const response = await fetch(baseURL, {
    method: "GET",
    headers: { "Content-Type": "application/json", Platform: "pc" },
  });
  const data = await response.json();
  let arr = Object.values(data.payload.statistics_closed);
  let arr2 = arr[arr.length - 1];
  //   console.log(arr2[arr2.length - 1]);
  if (arr2[arr2.length - 1] == undefined) {
    return 0;
  } else {
    return arr2[arr2.length - 1].volume;
  }
}

async function getPrimedMod(item) {
  const baseURL = `https://api.warframe.market/v1/items/${item}/orders`;

  const response = await fetch(baseURL, {
    method: "GET",
    headers: { "Content-Type": "application/json", Platform: "pc" },
  });
  const data = await response.json();

  // sort by plat
  data.payload.orders.sort(function (a, b) {
    return a.platinum - b.platinum;
  });

  //   find online, buy order, and max rank
  var filtered = data.payload.orders.filter(
    (a) =>
      a.user.status == "ingame" && a.order_type == "sell" && a.mod_rank == 0
  );
  if (filtered[0] == undefined) {
    return 999;
  } else {
    return filtered[0].platinum;
  }
}

async function getMaxPrimedMod(item, rank) {
  const baseURL = `https://api.warframe.market/v1/items/${item}/orders`;
  const response = await fetch(baseURL, {
    method: "GET",
    headers: { "Content-Type": "application/json", Platform: "pc" },
  });
  const data = await response.json();
  // sort by plat
  data.payload.orders.sort(function (a, b) {
    return a.platinum - b.platinum;
  });
  //   find online, buy order, and max rank
  var filtered = data.payload.orders.filter(
    (a) =>
      a.user.status == "ingame" && a.order_type == "sell" && a.mod_rank == rank
  );
  if (filtered[0] == undefined) {
    return -999;
  } else {
    return filtered[0].platinum;
  }
}

let modsArr = [];
try {
  // read contents of the file
  const data = fs.readFileSync("./items/mods", "UTF-8");
  // split the contents by new line
  const lines = data.split(/\r?\n/);
  // print all lines

  lines.forEach((line) => {
    modsArr.push(line);
  });
} catch (err) {
  console.error(err);
}

let results = [];

async function start() {
  for (let i = 0; i < modsArr.length; i++) {
    let modName = modsArr[i];
    const itemInfo = await getItemInfo(modName);
    const stats = await getStats(modName);

    const primedMod = await getPrimedMod(modName);
    const primedModMax = await getMaxPrimedMod(modName, itemInfo);

    Promise.all([itemInfo, stats, primedMod, primedModMax]).then((values) => {
      let hotness = (values[3] - values[2]) * values[1];
      console.log(`${modName}: ${hotness}`);
      results.push({ modName: modName, hotness: hotness });
    });
  }

  // sort by plat
}

start().then(function () {
  setTimeout(function () {
    try {
      results.sort(function (a, b) {
        return b.hotness - a.hotness;
      });
      console.log(results);
      fs.writeFile(
        "./items/temp.json",
        JSON.stringify(results, null, 2),
        "utf8",
        function (err, data) {
          if (err) {
            console.log(err);
          } else {
            console.log("data written");
          }
        }
      );
    } catch (err) {
      console.error(err);
    }
  }, 1000);
});
