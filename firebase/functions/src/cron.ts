import axios from 'axios';
import * as functions from 'firebase-functions';
import { launch } from 'puppeteer';

import { sendMessage } from './telegram';

const getDateFromSource = async () => {
  const browser = await launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto("https://www.gso.gov.vn/dmhc2015/NghiDinh.aspx");

  const date = await page.evaluate(() => {
    const dateCell = document.querySelector('#ctl00_PlaceHolderMain_ASPxGridView1_DXDataRow0 > td:nth-child(3)');
    if (dateCell === null) {
      return '';
    }
    return dateCell.innerHTML.trim();
  })

  await browser.close();

  return date;
}

const getDateFromRepo = async () => {
  const response = await axios('https://raw.githubusercontent.com/daohoangson/dvhcvn/master/data/date.txt');
  return (response.data as string).trim();
}

export default functions.
  runWith({ memory: '512MB' }).
  pubsub.schedule('every 24 hours').
  onRun(async (_) => {
    const [source, repo] = await Promise.all([
      getDateFromSource(),
      getDateFromRepo()
    ]);
    if (source === '' || repo === '') {
      const errorMessage = `Date values cannot be determined! source=${source}, repo=${repo}`;
      console.error(errorMessage);
      await sendMessage(errorMessage);
      return;
    }

    if (source === repo) {
      const logMessage = `Date values match between source and repo: ${source}`;
      console.log(logMessage);

      // TODO: stop sending this via Telegram (after 2w?) to avoid overly noisy logging
      await sendMessage(logMessage);

      return;
    }

    const warnMessage = `Date values mismatch! source=${source}, repo=${repo}`;
    console.warn(warnMessage);
    await sendMessage(warnMessage);
  });
