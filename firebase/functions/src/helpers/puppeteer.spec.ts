import { JSDOM } from "jsdom";
import { launch } from "puppeteer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDateFromSource, getDateInBrowserContext } from "./puppeteer";

vi.mock("puppeteer", () => ({
  launch: vi.fn(),
}));

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
    const dom = new JSDOM("<p>Foo</p>");
    vi.stubGlobal("document", dom.window.document);

    const date = getDateInBrowserContext();
    expect(date).toBeUndefined();
  });
});

describe("getDateFromSource", () => {
  const close = vi.fn();
  const evaluate = vi.fn();
  const goto = vi.fn();
  const newPage = vi.fn();
  const png = new Uint8Array([137, 80, 78, 71]);
  const screenshot = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    evaluate.mockResolvedValue("10/04/2023");
    screenshot.mockResolvedValue(png);
    newPage.mockResolvedValue({ evaluate, goto, screenshot });
    vi.mocked(launch).mockResolvedValue({
      close,
      newPage,
    } as unknown as Awaited<ReturnType<typeof launch>>);
  });

  it("should return date", async () => {
    const actual = await getDateFromSource();

    expect(goto).toHaveBeenCalledWith(
      "https://danhmuchanhchinh.gso.gov.vn/NghiDinh.aspx",
    );
    expect(evaluate).toHaveBeenCalledWith(getDateInBrowserContext);
    expect(screenshot).toHaveBeenCalledWith({
      encoding: "binary",
      fullPage: true,
      type: "png",
    });
    expect(actual).toStrictEqual({
      date: "10/04/2023",
      error: undefined,
      png,
    });
    expect(close).toHaveBeenCalledOnce();
  });

  it("should report a missing date", async () => {
    evaluate.mockResolvedValue(undefined);

    const actual = await getDateFromSource();

    expect(actual).toStrictEqual({
      date: undefined,
      error: "Date cell could not be found",
      png,
    });
    expect(close).toHaveBeenCalledOnce();
  });

  it("should close the browser when navigation fails", async () => {
    goto.mockRejectedValue(new Error("Source unavailable"));

    await expect(getDateFromSource()).rejects.toThrow("Source unavailable");
    expect(close).toHaveBeenCalledOnce();
  });
});
