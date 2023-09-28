import { describe, expect, it } from "vitest";
import { getDateFromRepo } from "./github";

describe("getDateFromRepo", () => {
  it("should return date", async () => {
    const actual = await getDateFromRepo();
    expect(actual).toMatchObject({
      date: expect.stringMatching(/^\d{2}\/\d{2}\/\d{4}$/),
    });
  });
});
