import * as functions from "firebase-functions";
import fetch from "node-fetch-commonjs";
import { launch } from "puppeteer";

import { send } from "./telegram";

const getDateFromSource = async () => {
  const browser = await launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto("https://danhmuchanhchinh.gso.gov.vn/NghiDinh.aspx");

  const date = await page.evaluate(() => {
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
  });

  const png = await page.screenshot({
    encoding: "binary",
    fullPage: true,
    type: "png",
  });
  await browser.close();

  const error = date ? undefined : "Date cell could not be found";
  return { date, error, png };
};

export const getDateFromRepo = async () => {
  const url =
    "https://raw.githubusercontent.com/daohoangson/dvhcvn/master/data/date.txt";
  const response = await fetch(url);
  const text = await response.text();
  const date = text.trim();
  return { date, error: undefined };
};

export default functions
  .runWith({ memory: "512MB" })
  .pubsub.schedule("every 24 hours")
  .onRun(async (_) => {
    const [
      { date: source, error: errorSource, png },
      { date: repo, error: errorRepo },
    ] = await Promise.all([
      getDateFromSource().catch((error) => ({
        date: undefined,
        error,
        png: undefined,
      })),
      getDateFromRepo().catch((error) => ({ date: undefined, error })),
    ]);
    const sendMessage = (text: string) => send(text, { png });

    if (errorSource || errorRepo) {
      const summary: string[] = ["❌❌❌"];
      summary.push("[getDateFromSource] " + (errorSource || `date=${source}`));
      summary.push("[getDateFromRepo] " + (errorRepo || `date=${repo}`));
      const errorMessage = summary.join("\n");
      console.error(errorMessage);
      await sendMessage(errorMessage);
      return;
    }

    if (source === repo) {
      const logMessage = `✅ ${repo}`;
      console.log(logMessage);
      return;
    }

    const warnMessage = `${source} ❌ ${repo}`;
    console.warn(warnMessage);
    await sendMessage(warnMessage);
  });
