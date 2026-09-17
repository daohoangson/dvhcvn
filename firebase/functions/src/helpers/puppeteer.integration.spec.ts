import { describe, expect, it } from "vitest";
import { getDateFromSource } from "./puppeteer";

const testIfLive = process.env.RUN_GSO_LIVE_TEST === "1" ? it : it.skip;

describe("getDateFromSource integration", () => {
  testIfLive(
    "should return a date from the GSO website",
    { timeout: 30000 },
    async () => {
      const actual = await getDateFromSource();
      expect(actual).toMatchObject({
        date: expect.stringMatching(/^\d{2}\/\d{2}\/\d{4}$/),
      });
    },
  );
});
