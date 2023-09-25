import * as functions from "firebase-functions";
import { compareDateValuesBetweenSourceAndRepo } from "./cron";

export const compareDateValuesBetweenSourceAndRepoDaily = functions
  .runWith({ memory: "512MB" })
  .pubsub.schedule("every 24 hours")
  .onRun(compareDateValuesBetweenSourceAndRepo);
