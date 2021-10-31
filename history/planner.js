const fs = require("fs");
const puppeteer = require("puppeteer");

const getData = async () => {
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();
  try {
    await page.goto("https://danhmuchanhchinh.gso.gov.vn/NghiDinh.aspx");
  } catch (e) {
    console.error(e);
    return {};
  }

  const data = await page.evaluate(() => {
    const className = "dxgvDataRow_Office2003_Blue";
    const rows = document.getElementsByClassName(className);

    const data = {};
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.cells || row.cells < 4) continue;

      const { cells } = row;
      const [id, , date, description] = cells;
      if (!id || !date || !description) continue;

      const dateText = date.innerText;
      const dateMatch = dateText.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!dateMatch) continue;
      const [, day, month, year] = dateMatch;
      const dataKey = `${year}${month}${day}`;

      if (typeof data[dataKey] === "undefined")
        data[dataKey] = { date: { day, month, year }, docs: [] };
      data[dataKey].docs.push(`${id.innerText}: ${description.innerText};`);
    }

    return data;
  });

  await browser.close();

  return data;
};

const getKey = () =>
  new Promise(resolve =>
    fs.readFile("./data/key.txt", { encoding: "utf8" }, (err, data) =>
      resolve(err ? "" : data)
    )
  );

const _ = lines => {
  if (typeof lines === "string") lines = [lines];
  process.stdout.write(lines.join("\n") + "\n");
};

_([
  `#!/usr/bin/env bash\n\nset -euo pipefail\ncd $( dirname $BASH_SOURCE[0] )\n`,
  `_date=""`,
  `_message=""`,
  `_pathKey=./key.txt`,
  `_pathJson=./data.json`,
  `_pathTree=./tree.json`
]);

_([
  ``,
  `_latestPath=../../data/dvhcvn.json`,
  `_latestDate=$( cat $_latestPath | jq -r .data_date )`,
  `echo Latest date from $_latestPath: $_latestDate`
]);

Promise.all([getData(), getKey()]).then(([data, key]) =>
  Object.keys(data)
    .sort()
    .filter(dataKey => dataKey > key)
    .forEach(dataKey => {
      const dateData = data[dataKey];
      const { date, docs } = dateData;
      const { day, month, year } = date;

      _([
        ``,
        ``,
        `_date=${day}/${month}/${year}`,
        `_stderr=../logs/${dataKey}.log`,
        `_stdout=../logs/${dataKey}.txt`
      ]);
      docs.forEach(d => _(`_message=$( echo "$_message" && echo "${d}" )`));
      _([
        `if [ "x$_date" = "x$_latestDate" ]; then`,
        `  echo Using latest data from $_latestPath for $_date...`,
        `  cp $_latestPath $_stdout`,
        `else`,
        `  if [ ! -f $_stdout ]; then`,
        `    echo Downloading $_date...`,
        `    php ../../downloader/01_gso.gov.vn.php $_date >$_stdout 2>$_stderr`,
        `  else`,
        `    echo Skipped downloading $_date`,
        `  fi`,
        `fi`,
        `cat $_stdout | jq .data >$_pathJson`,
        ``,
        `_diff=$( git diff $_pathJson )`,
        `if [ ! -z "$_diff" ]; then`,
        `  git add $_pathJson`,
        `  echo ${dataKey} >$_pathKey\n  git add $_pathKey`,
        `  php ../tree.php >$\{_pathTree\}.tmp\n  mv $\{_pathTree\}.tmp $_pathTree && git add $_pathTree`,
        `  export GIT_AUTHOR_DATE="${year}-${month}-${day} 00:00:00"`,
        `  export GIT_COMMITTER_DATE=$GIT_AUTHOR_DATE`,
        `  git commit -m "$_message"`,
        `  _message=""`,
        `else`,
        `  echo Diff is empty`,
        `fi`
      ]);
    })
);
