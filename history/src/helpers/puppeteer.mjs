// @ts-check

import { launch } from "puppeteer";

/**
 * @typedef {{
 *   [key: string]: {
 *      date: {
 *        day: string
 *        month: string
 *        year: string
 *      }
 *      docs: string[]
 *    }
 *  }} Data
 */

/**
 * @returns {Promise<Data>}
 */
export async function getDataInBrowserContext() {
  const className = "dxgvDataRow_Office2003_Blue";
  /** @type {HTMLCollectionOf<HTMLTableRowElement>} */
  // @ts-ignore
  const rows = document.getElementsByClassName(className);

  const textOf = (/** @type {HTMLElement} */ el) => el.innerHTML.trim();

  /** @type {Data} */
  const data = {};
  for (const row of rows) {
    if (!row.cells || row.cells.length < 4) continue;
    const { cells } = row;
    const [id, , date, description] = cells;

    const dateMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(textOf(date));
    if (!dateMatch) continue;
    const [, day, month, year] = dateMatch;
    const dataKey = `${year}${month}${day}`;

    if (typeof data[dataKey] === "undefined") {
      data[dataKey] = { date: { day, month, year }, docs: [] };
    }
    data[dataKey].docs.push(`${textOf(id)}: ${textOf(description)};`);
  }

  return data;
}

/**
 * @param {string|undefined} customUrl
 * @returns {Promise<Data>}
 */
export async function getData(customUrl) {
  const browser = await launch({
    args: ["--no-sandbox"],
    headless: "new",
  });
  const page = await browser.newPage();
  const url = customUrl || "https://danhmuchanhchinh.gso.gov.vn/NghiDinh.aspx";

  try {
    await page.goto(url);
  } catch (gotoError) {
    console.error("Could not go to URL", { url, gotoError });
    return {};
  }

  try {
    const data = await page.evaluate(getDataInBrowserContext);
    return data;
  } finally {
    await browser.close();
  }
}
