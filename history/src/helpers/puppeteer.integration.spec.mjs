import { describe, expect, it } from "vitest";
import { getData } from "./puppeteer.mjs";

const testIfLive = process.env.RUN_GSO_LIVE_TEST === "1" ? it : it.skip;

describe("getData integration", () => {
  testIfLive(
    "should return data from the GSO website",
    { timeout: 30000 },
    async () => {
      const data = await getData();
      expect(data).toMatchObject({
        19790329: {
          date: {
            day: "29",
            month: "03",
            year: "1979",
          },
          docs: expect.arrayContaining([expect.stringContaining("116-CP")]),
        },
        20230410: {
          date: {
            day: "10",
            month: "04",
            year: "2023",
          },
          docs: expect.arrayContaining([
            expect.stringContaining("730/NQ-UBTVQH15"),
          ]),
        },
      });
    },
  );
});
