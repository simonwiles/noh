import fs from "fs";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

import {
  ParserException,
  logError,
  toCamelCase,
  toCamelCaseTrim,
  normalize,
  extractVoices,
  cleanObject,
  extractCells,
  extractRows,
  processPhrases,
  processMetadata,
  downloadCSV,
  main as parserMain
} from "../scripts/parser";
import fixtures from "./fixtures/parser";

const mock = new MockAdapter(axios);

describe("parser", () => {
  let consoleError;

  beforeEach(() => {
    consoleError = console.error;
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error = consoleError;
  });

  it("toCamelCase turns strings to camel case", () => {
    expect(toCamelCase("This is four words")).toEqual("thisIsFourWords");
    expect(toCamelCase("This is four words")).toEqual("thisIsFourWords");
    expect(toCamelCase(" THIS is   FOUR WoRDS ")).toEqual("thisIsFourWords");
  });

  it("toCamelCaseTrim turns strings to camel case and remove strings after ?, ( or [", () => {
    expect(toCamelCaseTrim("This is four words(extra)")).toEqual(
      "thisIsFourWords"
    );
    expect(toCamelCaseTrim("This is four words? MORE TEXT")).toEqual(
      "thisIsFourWords"
    );
    expect(toCamelCaseTrim(" THIS is   FOUR WoRDS[? and this] ")).toEqual(
      "thisIsFourWords"
    );
  });

  it("normalize turns string to lower case, trims spaces and replaces them with dashes", () => {
    expect(normalize("This is four words")).toEqual("this-is-four-words");
    expect(normalize("This is four words")).toEqual("this-is-four-words");
    expect(normalize(" THIS is   FOUR WoRDS ")).toEqual("this-is-four-words");
  });

  it("extractVoices extracts voices tags and takes them out of string", () => {
    const [voices, text] = extractVoices("[ J, S ]   Some text.");
    expect(voices).toEqual(["J", "S"]);
    expect(text).toEqual("Some text.");
  });

  it("cleanObject cleans keys with empty values in a hash map", () => {
    expect(cleanObject({ a: "content", b: null, c: null })).toEqual({
      a: "content"
    });
  });

  it("extractCells extracts and formats an individual row", () => {
    const row = [
      "",
      "",
      "[Wt]2. Open-retreat.",
      "",
      "",
      "%",
      "[J]Us#",
      "",
      "1. R. Step pivot facing bridge.",
      "",
      "",
      "",
      "",
      "$",
      "",
      "",
      "",
      ""
    ];
    const expected = [
      {
        length: 4,
        start: 2,
        style: "justified",
        text: "2. Open-retreat.",
        voices: ["waki-tsure"]
      },
      {
        length: 1,
        start: 6,
        style: "extended-vowel",
        text: "Us",
        voices: ["jiutai"]
      },
      {
        length: 6,
        start: 8,
        style: "normal",
        text: "1. R. Step pivot facing bridge.",
        voices: []
      }
    ];
    expect(extractCells(row)).toEqual(expected);
  });

  it("extractRows extracts and formats content for a series of rows", () => {
    expect(extractRows(fixtures.multipleRows)).toMatchSnapshot();
  });

  it("processPhrases parse rows of raw data into structured phrases", () => {
    expect(processPhrases(fixtures.phrases)).toMatchSnapshot();
  });

  it("processMetadata turns metadata into a hash map", () => {
    expect(processMetadata(fixtures.metadata)).toMatchSnapshot();
  });

  it("logError logs errors and throws an exception", () => {
    expect(() => {
      logError("Error message");
    }).toThrow();
  });

  it("logError logs errors and throws an exception", () => {
    expect(() => {
      throw new ParserException();
    }).toThrow();
  });

  it("downloadCSV downloads and parses a CSV of phrases", () => {
    const type = "phrases";
    const fileName = `path/to/write/file.${type}.json`;
    const url = `/data/${type}.csv`;
    mock.reset();
    mock.onGet(url).reply(200, fixtures.phrasesCSV);
    jest.spyOn(fs, "writeFile").mockImplementation((file, jsonData) => {
      expect(file).toEqual(fileName);
      expect(jsonData).toMatchSnapshot();
    });
    downloadCSV(url, type, fileName);
  });

  it("downloadCSV downloads and parses a CSV of metadata", () => {
    const type = "metadata";
    const fileName = `path/to/write/file.${type}.json`;
    const url = `/data/${type}.csv`;
    mock.reset();
    mock.onGet(url).reply(200, fixtures.metadataCSV);
    jest.spyOn(fs, "writeFile").mockImplementation((file, jsonData) => {
      expect(file).toEqual(fileName);
      expect(jsonData).toMatchSnapshot();
    });
    downloadCSV(url, type, fileName);
  });

  it("downloadCSV raises an exception when writing the file fails", () => {
    const type = "metadata";
    const fileName = `path/to/write/file.${type}.json`;
    const url = `/data/${type}.csv`;
    mock.reset();
    mock.onGet(url).reply(200, fixtures.metadataCSV);
    jest
      .spyOn(fs, "writeFile")
      .mockImplementation((file, jsonData, callback) => {
        expect(file).toEqual(fileName);
        expect(jsonData).toMatchSnapshot();
        expect(() => {
          callback(true);
        }).toThrow();
      });
    downloadCSV(url, type, fileName);
  });

  it("downloadCSV raises an exception when URL is not found", () => {
    const url = `/some/url`;
    mock.reset();
    mock.onGet(url).reply(404, "");
    jest.spyOn(fs, "writeFile").mockImplementation(() => {
      throw new Error("");
    });
    expect(() => {
      downloadCSV(url, "metadata", "path/to/some/file");
    }).toThrow();
  });

  it("downloadCSV raises an exception when URL does not exist", () => {
    const url = `http://some.fake.url/`;
    expect(() => {
      downloadCSV(url, "metadata", "path/to/some/file");
    }).toThrow();
  });

  it("downloadCSV raises an exception when protocol is unknown", () => {
    const url = `proto://some.fake.url/`;
    expect(() => {
      downloadCSV(url, "metadata", "path/to/some/file");
    }).toThrow();
  });

  it("main fails when no config is given", () => {
    expect(() => {
      parserMain(null);
    }).toThrow();
  });

  it("main fails when config is malformed", () => {
    expect(() => {
      jest
        .spyOn(fs, "readFileSync")
        .mockReturnValueOnce(JSON.stringify({ key: null }));
      parserMain("path/to/config", true);
    }).toThrow();
  });

  it("main downloads and parses phrases and metadata", () => {
    const config = [
      {
        playName: "kokaji",
        sections: [
          {
            sectionName: "ageuta-3",
            phrases: "data/phrases.csv",
            metadata: "data/metadata.csv"
          }
        ]
      }
    ];
    mock.reset();
    mock
      .onGet(config[0].sections[0].phrases)
      .reply(200, fixtures.phrasesCSV)
      .onGet(config[0].sections[0].metadata)
      .reply(200, fixtures.metadataCSV);
    jest.spyOn(fs, "readFileSync").mockReturnValueOnce(JSON.stringify(config));
    jest.spyOn(fs, "writeFile").mockImplementation((file, jsonData) => {
      expect(jsonData).toMatchSnapshot();
    });
    parserMain("path/to/config", true);
  });
});
