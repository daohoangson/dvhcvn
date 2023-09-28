import { launch } from "puppeteer";

export function getDateInBrowserContext() {
  const dateCell = document.querySelector(
    "#ctl00_PlaceHolderMain_ASPxGridView1_DXDataRow0 > td:nth-child(3)"
  );
  if (dateCell === null) {
    return undefined;
  }

  // highlight date cell for the screenshot
  const { style } = dateCell as HTMLTableCellElement;
  style.backgroundColor = "red";
  style.color = "white";
  style.fontWeight = "bold";

  return dateCell.innerHTML.trim();
}

export async function getDateFromSource() {
  const browser = await launch({
    args: ["--no-sandbox"],
    headless: "new",
  });
  const page = await browser.newPage();
  await page.goto("https://danhmuchanhchinh.gso.gov.vn/NghiDinh.aspx");

  const date = await page.evaluate(getDateInBrowserContext);

  const png = await page.screenshot({
    encoding: "binary",
    fullPage: true,
    type: "png",
  });
  await browser.close();

  const error = date ? undefined : "Date cell could not be found";
  return { date, error, png };
}
