import { onSchedule } from "firebase-functions/v2/scheduler";
import { compareDateValuesBetweenSourceAndRepo } from "./cron";
import { telegramToken } from "./helpers/telegram";

export const compareDateValuesBetweenSourceAndRepoDaily = onSchedule(
  {
    schedule: "every 24 hours",
    memory: "512MiB",
    secrets: [telegramToken],
    timeZone: "Asia/Saigon",
  },
  compareDateValuesBetweenSourceAndRepo
);
