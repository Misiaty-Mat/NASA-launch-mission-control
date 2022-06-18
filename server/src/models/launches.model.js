const axios = require("axios");

const launchesDB = require("./launches.mongo");
const planets = require("./planets.mongo");

const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";
const DEFAULT_FLIGHT_NUMBER = 100;

const populateLaunches = async () => {
  console.log("Downloading launch data...");
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log("Problem downloading launch data");
    throw new Error("Launch data download failed");
  }

  const launchDocs = response.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });

    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
      customers,
    };
    console.log(`${launch.flightNumber} ${launch.mission}`);

    await saveLaunch(launch);
  }
};

const loadLaunchesData = async () => {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });

  if (firstLaunch) {
    console.log("Launch data alerady loaded!");
  } else {
    await populateLaunches();
  }
};

const findLaunch = async (filter) => {
  return await launchesDB.findOne(filter);
};

const existsLaunchWithId = async (launchId) => {
  return await findLaunch({
    flightNumber: launchId,
  });
};

const getLatestFlightNumber = async () => {
  const latestLaunch = await launchesDB.findOne().sort("-flightNumber");
  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return latestLaunch.flightNumber;
};

const getAllLaunches = async (skip, limit) => {
  return await launchesDB
    .find({}, { _id: 0, __v: 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
};

const saveLaunch = async (launch) => {
  await launchesDB.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    {
      upsert: true,
    }
  );
};

const scheduleNewLaunch = async (launch) => {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });

  if (!planet) {
    throw new Error("No matching planet was found");
  }

  const newFlightNumber = (await getLatestFlightNumber()) + 1;
  const newLaunch = Object.assign(launch, {
    flightNumber: newFlightNumber,
    success: true,
    upcoming: true,
    customers: ["Zero to Mastery", "NASA"],
  });

  await saveLaunch(newLaunch);
};

const abortLaunchById = async (launchId) => {
  const aborted = await launchesDB.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    }
  );

  return aborted.modifiedCount === 1;
};

module.exports = {
  loadLaunchesData,
  existsLaunchWithId,
  getAllLaunches,
  scheduleNewLaunch,
  abortLaunchById,
};
