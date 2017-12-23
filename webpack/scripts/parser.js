import axios from "axios";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

export const parserConfig = path.join("webpack", "config", "parser.json");

export const regexps = {
  groupedLetters: new RegExp(/(?:^\w|[A-Z]|\b\w)/, "g"),
  whiteSpaces: new RegExp(/\s+/, "gm"),
  betweenBrackets: new RegExp(/\[(.*?)\]/)
};

export const textStyles = {
  $: "normal",
  "%": "justified",
  "#": "extended-vowel"
};
export const defaultTextStyle = "$";

export const voiceStyles = {
  J: "jiutai",
  S: "shite",
  W: "waki",
  Wt: "waki-tsure",
  A: "aikyōgen"
};

export const ParserException = function(message) {
  this.message = (message && message.toString()) || "";
  this.name = "ParserException";
  process.exitCode = 1;
};

export const logError = (...messages) => {
  [...messages].map(message => console.error(message));
  throw new ParserException(messages && messages[0]);
};

export const toCamelCase = str =>
  str
    .toLowerCase()
    .trim()
    .replace(
      regexps.groupedLetters,
      (ltr, idx) => (idx === 0 ? ltr.toLowerCase() : ltr.toUpperCase())
    )
    .replace(regexps.whiteSpaces, "");

export const toCamelCaseTrim = str => toCamelCase(str.split(/[(?[]/)[0]);

export const normalize = str =>
  str
    .trim()
    .toLowerCase()
    .replace(regexps.whiteSpaces, "-");

export const extractVoices = str => [
  str &&
    (str.match(regexps.betweenBrackets) || [null, ""])[1]
      .split(",")
      .map(s => s.trim())
      .filter(Boolean),
  str &&
    str
      .replace(regexps.betweenBrackets, "")
      .replace(regexps.whiteSpaces, " ")
      .trim()
];

export const cleanObject = obj =>
  Object.entries(obj).reduce((acc, [key, val]) => {
    if (val) acc[key] = val;
    return acc;
  }, {});

export const extractCells = cells => {
  const texts = [];
  const styles = Object.keys(textStyles);
  let start = null;
  // eslint-disable-next-line no-restricted-syntax
  for (const [index, cell] of cells.entries()) {
    const content = cell.trim();
    let element = null;
    if (content.length !== 0) {
      if (styles.includes(content) && start !== null) {
        const length = index - start + 1;
        const style = textStyles[content];
        Object.assign(texts[start], { length, style });
        start = null;
        element = null;
      } else {
        let [voices, text] = extractVoices(content);
        let styleSymbol = text.slice(-1);
        if (styles.includes(styleSymbol)) {
          text = text.slice(0, -1);
        } else {
          styleSymbol = defaultTextStyle;
        }
        voices = voices.map(voice => voiceStyles[voice]);
        const style = textStyles[styleSymbol];
        start = index;
        element = { text, voices, start, style, length: 1 };
      }
    }
    texts.push(element);
  }
  return texts.filter(Boolean);
};

export const extractRows = rows =>
  rows.reduce(
    (obj, row) =>
      Object.assign(obj, {
        [toCamelCase(row[0])]: {
          value: normalize(row[1]),
          grid: extractCells(row.slice(2))
        }
      }),
    {}
  );

export const processPhrases = data => {
  const sectionName = data[0][1].toLowerCase();
  const rows = data.slice(1);
  const phrases = [...Array(rows.length).keys()]
    .map(idx => {
      // range(rows.length)
      const row = rows[idx];
      if (row[0].toLowerCase() === "phrase") {
        const values = extractRows(rows.slice(idx + 1, idx + 10));
        Object.assign(values, { phrase: row[1] });
        return values;
      }
      return null;
    })
    .filter(Boolean);
  const score = { sectionName, phrases };
  return score;
};

export const processMetadata = data => {
  const keys = data[0]
    .filter(Boolean)
    .map(str => toCamelCaseTrim(str))
    .slice(0, -1);
  const rows = data.slice(1);
  return rows.reduce(
    (obj, row) =>
      Object.assign(obj, {
        [toCamelCaseTrim(row[0])]: cleanObject(
          Object.assign(
            {},
            ...keys.map((key, idx) => ({ [key]: row.slice(1)[idx] }))
          )
        )
      }),
    {}
  );
};

export const downloadCSV = (url, type, to) => {
  axios
    .get(url.replace("edit#gid", "export?format=csv&gid"))
    .then(response => {
      Papa.parse(response.data, {
        skipEmptyLines: true,
        complete: results => {
          try {
            const { data } = results;
            const parsedData =
              type === "phrases" ? processPhrases(data) : processMetadata(data);
            fs.writeFile(to, JSON.stringify(parsedData, null, 4), error => {
              if (error) {
                logError(`Unable to write ${type} from ${url} to ${to}`, error);
              }
            });
          } catch (error) {
            logError(`Error found while processing ${url}`, error);
          }
        }
      });
    })
    .catch(error => {
      logError(`Unable to download ${url}`, error);
    });
};

export const main = (configPath, quiet) => {
  if (!configPath) {
    logError("Usage: parse [path/to/parser.json] [-q/--quiet]");
  }
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    config.forEach(play => {
      if (!quiet) console.info(`Downloading and parsing ${play.playName}:`);
      play.sections.forEach(section => {
        if (!quiet) console.info(`- ${section.sectionName}`);
        const fileName = path.join(
          "src",
          "data",
          play.playName,
          section.sectionName
        );
        const keys = ["phrases", "metadata"];
        keys.map(key =>
          downloadCSV(section[key], key, `${fileName}.${key}.json`)
        );
      });
    });
    process.exitCode = 0;
  } catch (error) {
    logError(error);
  }
};

// If used as a CLI
if (!module.parent) {
  main(
    process.argv[2] && process.argv[2][0] !== "-"
      ? process.argv[2]
      : parserConfig,
    ["-q", "--quiet"].includes(process.argv.slice(-1)[0])
  );
}
