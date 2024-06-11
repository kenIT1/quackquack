const postAction = require("../actions/post");
const sleep = require("./sleep");
const config = require("../config.json");

async function layEgg(token, ua, nest_id, duck_id) {
  let retry = 0;
  let data = null;
  while (retry < config.retryCount) {
    if (!!data) {
      break;
    }
    data = await layEggInternal(token, ua, nest_id, duck_id);
    retry++;
  }

  return data;
}

async function layEggInternal(token, ua, nest_id, duck_id) {
  // console.log(nest_id, duck_id);
  try {
    const { data } = await postAction(
      token,
      "nest/lay-egg",
      "nest_id=" + nest_id + "&duck_id=" + duck_id,
      ua
    );
    // console.log("layEgg", data);
    return data;
  } catch (error) {
    console.log("layEgg error");
    if (error.response) {
      // console.log(error.response.data);
      console.log("status", error.response.status);
      // console.log("data", error.response.data);
      const status = error.response.status;
      // console.log(error.response.headers);
      if (status === 503 || status === 502 || status === 504) {
        console.log("Mat ket noi, tu dong ket noi sau 30s");
        await sleep(30);
        return null;
      } else if (status === 401) {
        console.log(`\nToken loi hoac het han roi\n`);
        process.exit(1);
      } else if (status === 400) {
        console.log("data", error.response.data);
        console.log("Mat ket noi, tu dong ket noi sau 10s");
        await sleep(10);
        return null;
      } else {
        await sleep(5);
        return null;
      }
    } else if (error.request) {
      console.log("request", error.request);
    } else {
      console.log("error", error.message);
    }
  }
}

module.exports = layEgg;
