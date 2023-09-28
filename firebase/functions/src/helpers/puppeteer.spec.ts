import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDateFromSource, getDateInBrowserContext } from "./puppeteer";

describe("getDateInBrowserContext", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return date", () => {
    const dom = new JSDOM(`
<table id="ctl00_PlaceHolderMain_ASPxGridView1_DXMainTable" class="dxgvTable_Office2003_Blue" cellspacing="0" cellpadding="0" border="0" style="width: 748px; border-collapse: collapse; empty-cells: show; table-layout: fixed; overflow: hidden;">
  <colgroup>
    <col width="100px"><col width="80px"><col width="80px"><col width="420px">
  </colgroup>
  <tbody>
    <tr id="ctl00_PlaceHolderMain_ASPxGridView1_DXDataRow0" class="dxgvDataRow_Office2003_Blue">
      <td class="dxgv" style="text-align:Left;vertical-align:Middle;white-space:normal;">721/NQ-UBTVQH15</td>
      <td class="dxgv" style="text-align:Center;vertical-align:Middle;white-space:nowrap;">13/02/2023</td>
      <td class="dxgv">10/04/2023</td>
      <td class="dxgv" style="text-align:Left;vertical-align:Middle;white-space:normal;">Nghị quyết về việc thành lập thị xã Tịnh Biên, các phường thuộc thị xã Tịnh Biên, thị trấn Đa Phước thuộc huyện An Phú và thị trấn Hội An thuộc huyện Chợ Mới, tỉnh An Giang</td>
    </tr>
  </tbody>
</table>`);
    vi.stubGlobal("document", dom.window.document);

    const date = getDateInBrowserContext();
    expect(date).toBe("10/04/2023");
  });

  it("should return undefined", () => {
    const dom = new JSDOM(`<p>Foo</p>`);
    vi.stubGlobal("document", dom.window.document);

    const date = getDateInBrowserContext();
    expect(date).toBeUndefined();
  });
});

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
