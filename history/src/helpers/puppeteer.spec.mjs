import { describe, expect, it, vi } from "vitest";
import { getData } from "./puppeteer.mjs";

describe("getData", () => {
  it(
    "should return data",
    async () => {
      const data = await getData();
      expect(data).toMatchObject({
        19790329: {
          date: {
            day: "29",
            month: "03",
            year: "1979",
          },
          docs: expect.arrayContaining([
            expect.stringContaining(
              // Chia một số huyện thuộc tỉnh Lâm Đồng
              "116-CP"
            ),
          ]),
        },
        20230410: {
          date: {
            day: "10",
            month: "04",
            year: "2023",
          },
          docs: expect.arrayContaining([
            expect.stringContaining(
              // Nghị quyết về việc thành lập thị trấn Kim Long thuộc huyện Tam Dương,
              // thị trấn Tam Hồng thuộc huyện Yên Lạc và phường Định Trung thuộc
              // thành phố Vĩnh Yên, tỉnh Vĩnh Phúc
              "730/NQ-UBTVQH15"
            ),
          ]),
        },
      });
    },
    { timeout: 30000 }
  );

  it("should handle bad URL", async () => {
    const data = await getData("https://NXDOMAIN.hoangson.vn");
    expect(data).toStrictEqual({});
  });
});
