import { getDateFromRepo } from "./helpers/github";
import { getDateFromSource } from "./helpers/puppeteer";
import { send } from "./helpers/telegram";

export async function compareDateValuesBetweenSourceAndRepo() {
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
}
