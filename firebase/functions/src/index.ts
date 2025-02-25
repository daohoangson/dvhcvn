import { onSchedule } from "firebase-functions/v2/scheduler";
import { compareDateValuesBetweenSourceAndRepo } from "./cron";

export const compareDateValuesBetweenSourceAndRepoDaily = onSchedule(
  {
    schedule: "every 24 hours",
    memory: "512MiB",
    timeZone: "Asia/Saigon",
  },
  compareDateValuesBetweenSourceAndRepo
);
