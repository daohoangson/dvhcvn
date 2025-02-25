import { onSchedule } from "firebase-functions/v2/scheduler";
import { compareDateValuesBetweenSourceAndRepo } from "./cron";
import { telegramToken } from "./helpers/telegram";

export const compareDateValuesBetweenSourceAndRepoDailyGen2 = onSchedule(
  {
    memory: "512MiB",
    schedule: "every day 23:00",
    secrets: [telegramToken],
    timeZone: "Asia/Saigon",
  },
  compareDateValuesBetweenSourceAndRepo,
);
