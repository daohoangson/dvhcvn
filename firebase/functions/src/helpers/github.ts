import fetch from "node-fetch-commonjs";

export const getDateFromRepo = async () => {
  const url =
    "https://raw.githubusercontent.com/daohoangson/dvhcvn/master/data/date.txt";
  const response = await fetch(url);
  const text = await response.text();
  const date = text.trim();
  return { date, error: undefined };
};
