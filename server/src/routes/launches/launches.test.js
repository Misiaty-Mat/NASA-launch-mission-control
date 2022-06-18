const request = require("supertest");

const app = require("../../app");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");

describe("Launches API", () => {
  beforeAll(async () => {
    await mongoConnect();
  });

  afterAll(async () => {
    await mongoDisconnect();
  });

  describe("Test GET /launches", () => {
    test("Does respond with 200 success?", async () => {
      const response = await request(app)
        .get("/v1/launches")
        .expect(200)
        .expect("Content-Type", /json/);
    });
  });

  describe("Test POST /launches", () => {
    const completeLaunchData = {
      mission: "MIStellar",
      rocket: "MI-S21",
      target: "Kepler-62 f",
      launchDate: "29 March, 2030",
    };

    const launchDataWithoutDate = {
      mission: "MIStellar",
      rocket: "MI-S21",
      target: "Kepler-62 f",
    };

    const launchDataWithInvalidDate = {
      mission: "MIStellar",
      rocket: "MI-S21",
      target: "Kepler-62 f",
      launchDate: "Noot noot",
    };

    test("Does respond with 201 success?", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(completeLaunchData)
        .expect(201)
        .expect("Content-Type", /json/);

      const requestDate = new Date(completeLaunchData.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();
      expect(responseDate).toBe(requestDate);

      expect(response.body).toMatchObject(launchDataWithoutDate);
    });

    test("Catches missing property with 400 Bad Request?", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchDataWithoutDate)
        .expect(400)
        .expect("Content-Type", /json/);

      expect(response.body).toStrictEqual({
        error: "Missing required data",
      });
    });
    test("Catches invalid dates with 400 Bad Request?", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchDataWithInvalidDate)
        .expect(400)
        .expect("Content-Type", /json/);

      expect(response.body).toStrictEqual({
        error: "Ivalid date entered",
      });
    });
  });
});
