import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getData, getDataInBrowserContext } from "./puppeteer.mjs";

describe("getDataInBrowserContext", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const table = (/** @type {string[]} */ rows) => `
<table id="ctl00_PlaceHolderMain_ASPxGridView1_DXMainTable" class="dxgvTable_Office2003_Blue" cellspacing="0" cellpadding="0" border="0" style="width: 748px; border-collapse: collapse; empty-cells: show; table-layout: fixed; overflow: hidden;">
  <colgroup>
    <col width="100px"><col width="80px"><col width="80px"><col width="420px">
  </colgroup>
  <tbody>
    ${rows.join("\n")}
  </tbody>
</table>`;

  const row721 = `
<tr id="ctl00_PlaceHolderMain_ASPxGridView1_DXDataRow0" class="dxgvDataRow_Office2003_Blue">
  <td class="dxgv" style="text-align:Left;vertical-align:Middle;white-space:normal;">721/NQ-UBTVQH15</td>
  <td class="dxgv" style="text-align:Center;vertical-align:Middle;white-space:nowrap;">13/02/2023</td>
  <td class="dxgv">10/04/2023</td>
  <td class="dxgv" style="text-align:Left;vertical-align:Middle;white-space:normal;">Nghị quyết về việc thành lập thị xã Tịnh Biên, các phường thuộc thị xã Tịnh Biên, thị trấn Đa Phước thuộc huyện An Phú và thị trấn Hội An thuộc huyện Chợ Mới, tỉnh An Giang</td>
</tr>`;

  const row722 = `
<tr id="ctl00_PlaceHolderMain_ASPxGridView1_DXDataRow1" class="dxgvDataRow_Office2003_Blue dxgvDataRowAlt_Office2003_Blue" style="background-color:AliceBlue;">
  <td class="dxgv" style="text-align:Left;vertical-align:Middle;white-space:normal;">722/NQ-UBTVQH15</td>
  <td class="dxgv" style="text-align:Center;vertical-align:Middle;white-space:nowrap;">13/02/2023</td>
  <td class="dxgv">10/04/2023</td>
  <td class="dxgv" style="text-align:Left;vertical-align:Middle;white-space:normal;">Nghị quyết về việc thành lập thị trấn Vân Tùng thuộc huyện Ngân Sơn, tỉnh Bắc Kạn</td>
</tr>`;

  const row569 = `
<tr id="ctl00_PlaceHolderMain_ASPxGridView1_DXDataRow10" class="dxgvDataRow_Office2003_Blue">
  <td class="dxgv" style="text-align:Left;vertical-align:Middle;white-space:normal;">569/NQ-UBTVQH15</td>
  <td class="dxgv" style="text-align:Center;vertical-align:Middle;white-space:nowrap;">11/08/2022</td>
  <td class="dxgv">01/10/2022</td>
  <td class="dxgv" style="text-align:Left;vertical-align:Middle;white-space:normal;">Nghị quyết về việc thành lập thị trấn Bình Phú thuộc huyện Cai Lậy, tỉnh Tiền Giang</td>
</tr>`;

  it("should return data", async () => {
    const dom = new JSDOM(table([row721]));
    vi.stubGlobal("document", dom.window.document);

    const data = await getDataInBrowserContext();
    expect(data).toStrictEqual({
      20230410: {
        date: { day: "10", month: "04", year: "2023" },
        docs: [
          "721/NQ-UBTVQH15: Nghị quyết về việc thành lập thị xã Tịnh Biên, các phường thuộc thị xã Tịnh Biên, thị trấn Đa Phước thuộc huyện An Phú và thị trấn Hội An thuộc huyện Chợ Mới, tỉnh An Giang;",
        ],
      },
    });
  });

  it("should return multiple dates", async () => {
    const dom = new JSDOM(table([row721, row569]));
    vi.stubGlobal("document", dom.window.document);

    const data = await getDataInBrowserContext();
    expect(data).toStrictEqual({
      20230410: {
        date: { day: "10", month: "04", year: "2023" },
        docs: [
          "721/NQ-UBTVQH15: Nghị quyết về việc thành lập thị xã Tịnh Biên, các phường thuộc thị xã Tịnh Biên, thị trấn Đa Phước thuộc huyện An Phú và thị trấn Hội An thuộc huyện Chợ Mới, tỉnh An Giang;",
        ],
      },
      20221001: {
        date: { day: "01", month: "10", year: "2022" },
        docs: [
          "569/NQ-UBTVQH15: Nghị quyết về việc thành lập thị trấn Bình Phú thuộc huyện Cai Lậy, tỉnh Tiền Giang;",
        ],
      },
    });
  });

  it("should merge docs", async () => {
    const dom = new JSDOM(table([row721, row722]));
    vi.stubGlobal("document", dom.window.document);

    const data = await getDataInBrowserContext();
    expect(data).toStrictEqual({
      20230410: {
        date: { day: "10", month: "04", year: "2023" },
        docs: [
          "721/NQ-UBTVQH15: Nghị quyết về việc thành lập thị xã Tịnh Biên, các phường thuộc thị xã Tịnh Biên, thị trấn Đa Phước thuộc huyện An Phú và thị trấn Hội An thuộc huyện Chợ Mới, tỉnh An Giang;",
          "722/NQ-UBTVQH15: Nghị quyết về việc thành lập thị trấn Vân Tùng thuộc huyện Ngân Sơn, tỉnh Bắc Kạn;",
        ],
      },
    });
  });
});

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
