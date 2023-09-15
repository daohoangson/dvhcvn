export function similarText(first: string, second: string, percent = false) {
  // https://github.com/locutusjs/locutus/blob/aa2751437a92cc1b33204b5e1252e8ef899206ad/src/php/strings/similar_text.js
  if (
    first === null ||
    second === null ||
    typeof first === "undefined" ||
    typeof second === "undefined"
  ) {
    return 0;
  }

  first += "";
  second += "";

  let pos1 = 0;
  let pos2 = 0;
  let max = 0;
  const firstLength = first.length;
  const secondLength = second.length;
  let p;
  let q;
  let l;
  let sum;

  for (p = 0; p < firstLength; p++) {
    for (q = 0; q < secondLength; q++) {
      for (
        l = 0;
        p + l < firstLength &&
        q + l < secondLength &&
        first.charAt(p + l) === second.charAt(q + l);
        l++
      ) {
        // eslint-disable-line max-len
        // @todo: ^-- break up this crazy for loop and put the logic in its body
      }
      if (l > max) {
        max = l;
        pos1 = p;
        pos2 = q;
      }
    }
  }

  sum = max;

  if (sum) {
    if (pos1 && pos2) {
      sum += similarText(first.substr(0, pos1), second.substr(0, pos2));
    }

    if (pos1 + max < firstLength && pos2 + max < secondLength) {
      sum += similarText(
        first.substr(pos1 + max, firstLength - pos1 - max),
        second.substr(pos2 + max, secondLength - pos2 - max)
      );
    }
  }

  if (!percent) {
    return sum;
  }

  return (sum * 200) / (firstLength + secondLength);
}
