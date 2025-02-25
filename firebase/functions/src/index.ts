import { onSchedule } from "firebase-functions/v2/scheduler";
import { compareDateValuesBetweenSourceAndRepo } from "./cron";
import { telegramToken } from "./helpers/telegram";

export const compareDateValuesBetweenSourceAndRepoDailySingapore = onSchedule(
  {
    memory: "1GiB",
    schedule: "every day 23:00",
    secrets: [telegramToken],
    region: "asia-southeast1",
    timeZone: "Asia/Saigon",
  },
  compareDateValuesBetweenSourceAndRepo,
);
