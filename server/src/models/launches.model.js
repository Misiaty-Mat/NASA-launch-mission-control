const launches = new Map();

const launch = {
  flightNumber: 100,
  mission: "Keppler Explor XV",
  rocket: "Super Star Explorer",
  launchDate: new Date("December 27, 2030"),
  destination: "Kepler-442 b",
  customer: ["SpaceX", "NASA"],
  upcoming: true,
  success: true,
};

launches.set(launch.flightNumber, launch);

const getAllLaunches = () => {
  return Array.from(launches.values());
};

module.exports = {
  getAllLaunches,
};
