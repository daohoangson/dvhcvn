import { stdout as STDOUT } from "process";
import { getKey } from "./helpers/fs.mjs";
import { getData } from "./helpers/puppeteer.mjs";

/**
 * @param {string|string[]} lines
 */
function _(lines) {
  if (typeof lines === "string") lines = [lines];
  STDOUT.write(lines.join("\n") + "\n");
}

export function generateScript() {
  _([
    `#!/usr/bin/env bash\n\nset -euo pipefail\ncd $( dirname $BASH_SOURCE[0] )\n`,
    `_date=""`,
    `_message=""`,
    `_pathKey=./key.txt`,
    `_pathJson=./data.json`,
    `_pathTree=./tree.json`,
  ]);

  _([
    ``,
    `_latestPath=../../data/dvhcvn.json`,
    `_latestDate=$( cat $_latestPath | jq -r .data_date )`,
    `echo Latest date from $_latestPath: $_latestDate`,
  ]);

  return Promise.all([getData(), getKey()]).then(([data, key]) =>
    Object.keys(data)
      .sort()
      .filter((dataKey) => dataKey > key)
      .forEach((dataKey) => {
        const dateData = data[dataKey];
        const { date, docs } = dateData;
        const { day, month, year } = date;

        _([
          ``,
          ``,
          `_date=${day}/${month}/${year}`,
          `_stderr=../logs/${dataKey}.log`,
          `_stdout=../logs/${dataKey}.txt`,
        ]);
        docs.forEach((d) => _(`_message=$( echo "$_message" && echo "${d}" )`));
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
          `  php ../tree.php >\${_pathTree}.tmp\n  mv \${_pathTree}.tmp $_pathTree && git add $_pathTree`,
          `  export GIT_AUTHOR_DATE="${year}-${month}-${day} 00:00:00"`,
          `  export GIT_COMMITTER_DATE=$GIT_AUTHOR_DATE`,
          `  git commit -m "$_message"`,
          `  _message=""`,
          `else`,
          `  echo Diff is empty`,
          `fi`,
        ]);
      })
  );
}
