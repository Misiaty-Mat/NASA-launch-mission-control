const express = require("express");

const { HttpGetAllLaunches } = require("./launches.controller");

const launchesRouter = express.Router();

launchesRouter.get("/launches", HttpGetAllLaunches);

module.exports = launchesRouter;
