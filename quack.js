const loadToken = require("./modules/loadToken");
const ACCESS_TOKEN = loadToken();
const randomUseragent = require("random-useragent");

const ua = randomUseragent.getRandom((ua) => {
  return ua.browserName === "Chrome";
});
// console.log(ua);

const config = require("./config.json");
// console.log(config);

const getBalance = require("./modules/getBalance");
const getListReload = require("./modules/getListReload");
const collectEgg = require("./modules/collectEgg");
const layEgg = require("./modules/layEgg");
const sleep = require("./modules/sleep");
const getGoldenDuckInfo = require("./modules/getGoldenDuckInfo");
const getGoldenDuckReward = require("./modules/getGoldenDuckReward");
const claimGoldenDuck = require("./modules/claimGoldenDuck");
const addLog = require("./modules/addLog");
const Timer = require("easytimer.js").Timer;

let run = false;
let wallets = null;
let timerInstance = new Timer();
let eggs = 0;
let timeToGoldenDuck = 0;

function getDuckToLay(ducks) {
  const duck = ducks.reduce((prev, curr) =>
    prev.last_active_time < curr.last_active_time ? prev : curr
  );

  return duck;
}

async function collectFromList(token, ua, listNests, listDucks) {
  if (listNests.length === 0) return console.clear(), harvestAllEgg();
  // if (listNests.length === 0) return harvestAllEgg();
  // console.log(listNests.length, listDucks.length);

  const { data } = await collectEgg(token, ua, listNests[0].id);
  // console.log(data);
  if (data) {
    const duck = getDuckToLay(listDucks);
    await layEgg(token, ua, listNests[0].id, duck.id);
    console.log(`Da thu hoach [ NEST 🌕 ${listNests[0].id} ]`);

    wallets.forEach((w) => {
      if (w.symbol === "EGG 🥚") w.balance = Number(w.balance) + 1;
    });

    eggs++;
    listNests.shift();
    listDucks = listDucks.filter((d) => d.id !== duck.id);
    // console.log(listNests.length, listDucks.length);

    await sleep(config.sleepTime);
    collectFromList(token, ua, listNests, listDucks);
  }
}

async function harvestAllEgg() {
  try {
    if (!run) {
      wallets = await getBalance(ACCESS_TOKEN, ua);
      timerInstance.start();
    }
    // console.log(wallets);
    console.log("LINK TOOL : [ j2c.cc/quack ]");
    console.log(
      `THOI GIAN CHAY : [ ${timerInstance
        .getTimeValues()
        .toString(["days", "hours", "minutes", "seconds"])} ]`
    );
    console.log(`TONG THU HOACH : [ ${eggs} EGG 🥚]`);
    console.log("---");

    if (timeToGoldenDuck <= 0) {
      const data = await getGoldenDuckInfo(ACCESS_TOKEN, ua);
      // console.log("collectGoldenDuck", data);

      if (data.time_to_golden_duck === 0) {
        console.log("[ GOLDEN DUCK 🐥 ] : Zit Zang xuat hien");
        const rewardData = await getGoldenDuckReward(ACCESS_TOKEN, ua);
        // console.log("rewardData", rewardData);
        if (rewardData.data.type === 0) {
          console.log("[ GOLDEN DUCK 🐥 ] : Chuc ban may man lan sau");
          addLog("[ GOLDEN DUCK 🐥 ] : Chuc ban may man lan sau\n");
        } else if (rewardData.data.type === 1 || rewardData.data.type === 4) {
          console.log("[ GOLDEN DUCK 🐥 ] : TON | TRU -> Bo qua");
          addLog("[ GOLDEN DUCK 🐥 ] : TON | TRU -> Bo qua\n");
        } else {
          const claimReward = await claimGoldenDuck(
            ACCESS_TOKEN,
            ua,
            rewardData.data
          );
          // console.log("claimReward", claimReward);
        }
      } else timeToGoldenDuck = data.time_to_golden_duck;

      setInterval(() => {
        timeToGoldenDuck--;
      }, 1e3);
    }

    console.log(`[ GOLDEN DUCK 🐥 ] : ${timeToGoldenDuck}s nua gap`);

    if (!run) {
      let walletStr = "";
      wallets.forEach((w) => {
        walletStr += `[ ${Number(w.balance).toFixed(2)} ${w.symbol} ] `;
      });
      console.log("[ WALLETS 💰 ] :", walletStr);
      console.log("---");
    }

    // console.log("timeToGoldenDuck", timeToGoldenDuck);

    const { listNests, listDucks } = await getListReload(
      ACCESS_TOKEN,
      ua,
      run ? false : true
    );
    // console.log(listNests, listDucks);

    run = true;
    const nestIds = listNests.map((i) => i.id);
    console.log(`[ NEST 🌕 ${listNests.length} ] :`, nestIds);
    collectFromList(ACCESS_TOKEN, ua, listNests, listDucks);
  } catch (error) {
    console.log("harvestAllEgg error", error);
  }
}

harvestAllEgg();
