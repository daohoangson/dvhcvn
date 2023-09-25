import { describe, expect, it } from "vitest";
import { getDateFromSource } from "./puppeteer";

describe("getDateFromSource", () => {
  it(
    "should return date",
    async () => {
      const actual = await getDateFromSource();
      expect(actual).toMatchObject({
        date: expect.stringMatching(/^\d{2}\/\d{2}\/\d{4}$/),
      });
    },
    {
      // CI is slow, especially here because we are connecting to some local DC
      timeout: 30000,
    }
  );
});
