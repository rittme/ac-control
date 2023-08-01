// HumanizeDuration.js - https://git.io/j0HgmQ

// @ts-check

/**
 * @typedef {string | ((unitCount: number) => string)} Unit
 */

/**
 * @typedef {("y" | "mo" | "w" | "d" | "h" | "m" | "s" | "ms")} UnitName
 */

/**
 * @typedef {Object} UnitMeasures
 * @prop {number} y
 * @prop {number} mo
 * @prop {number} w
 * @prop {number} d
 * @prop {number} h
 * @prop {number} m
 * @prop {number} s
 * @prop {number} ms
 */

/**
 * @typedef {Record<"0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9", string>} DigitReplacements
 */

/**
 * @typedef {Object} Language
 * @prop {Unit} y
 * @prop {Unit} mo
 * @prop {Unit} w
 * @prop {Unit} d
 * @prop {Unit} h
 * @prop {Unit} m
 * @prop {Unit} s
 * @prop {Unit} ms
 * @prop {string} [decimal]
 * @prop {string} [delimiter]
 * @prop {DigitReplacements} [_digitReplacements]
 * @prop {boolean} [_numberFirst]
 */

/**
 * @typedef {Object} Options
 * @prop {string} [language]
 * @prop {Record<string, Language>} [languages]
 * @prop {string[]} [fallbacks]
 * @prop {string} [delimiter]
 * @prop {string} [spacer]
 * @prop {boolean} [round]
 * @prop {number} [largest]
 * @prop {UnitName[]} [units]
 * @prop {string} [decimal]
 * @prop {string} [conjunction]
 * @prop {number} [maxDecimalPoints]
 * @prop {UnitMeasures} [unitMeasures]
 * @prop {boolean} [serialComma]
 * @prop {DigitReplacements} [digitReplacements]
 */

/**
 * @typedef {Required<Options>} NormalizedOptions
 */

(function () {
  /** @type {Record<string, Language>} */
  var LANGUAGES = {
    en: language(
      function (c) {
        return "year" + (c === 1 ? "" : "s");
      },
      function (c) {
        return "month" + (c === 1 ? "" : "s");
      },
      function (c) {
        return "week" + (c === 1 ? "" : "s");
      },
      function (c) {
        return "day" + (c === 1 ? "" : "s");
      },
      function (c) {
        return "hour" + (c === 1 ? "" : "s");
      },
      function (c) {
        return "minute" + (c === 1 ? "" : "s");
      },
      function (c) {
        return "second" + (c === 1 ? "" : "s");
      },
      function (c) {
        return "millisecond" + (c === 1 ? "" : "s");
      }
    ),
    fr: language(
      function (c) {
        return "an" + (c >= 2 ? "s" : "");
      },
      "mois",
      function (c) {
        return "semaine" + (c >= 2 ? "s" : "");
      },
      function (c) {
        return "jour" + (c >= 2 ? "s" : "");
      },
      function (c) {
        return "heure" + (c >= 2 ? "s" : "");
      },
      function (c) {
        return "minute" + (c >= 2 ? "s" : "");
      },
      function (c) {
        return "seconde" + (c >= 2 ? "s" : "");
      },
      function (c) {
        return "milliseconde" + (c >= 2 ? "s" : "");
      },
      ","
    ),
    pt: language(
      function (c) {
        return "ano" + (c === 1 ? "" : "s");
      },
      function (c) {
        return c === 1 ? "mês" : "meses";
      },
      function (c) {
        return "semana" + (c === 1 ? "" : "s");
      },
      function (c) {
        return "dia" + (c === 1 ? "" : "s");
      },
      function (c) {
        return "hora" + (c === 1 ? "" : "s");
      },
      function (c) {
        return "minuto" + (c === 1 ? "" : "s");
      },
      function (c) {
        return "segundo" + (c === 1 ? "" : "s");
      },
      function (c) {
        return "milissegundo" + (c === 1 ? "" : "s");
      },
      ","
    )
  };

  /**
   * Helper function for creating language definitions.
   *
   * @param {Unit} y
   * @param {Unit} mo
   * @param {Unit} w
   * @param {Unit} d
   * @param {Unit} h
   * @param {Unit} m
   * @param {Unit} s
   * @param {Unit} ms
   * @param {string} [decimal]
   * @returns {Language}
   */
  function language(y, mo, w, d, h, m, s, ms, decimal) {
    /** @type {Language} */
    var result = { y: y, mo: mo, w: w, d: d, h: h, m: m, s: s, ms: ms };
    if (typeof decimal !== "undefined") {
      result.decimal = decimal;
    }
    return result;
  }

  function assign(destination) {
    var source;
    for (var i = 1; i < arguments.length; i++) {
      source = arguments[i];
      for (var prop in source) {
        if (has(source, prop)) {
          destination[prop] = source[prop];
        }
      }
    }
    return destination;
  }

  // We need to make sure we support browsers that don't have
  // `Array.isArray`, so we define a fallback here.
  var isArray =
    Array.isArray ||
    function (arg) {
      return Object.prototype.toString.call(arg) === "[object Array]";
    };

  function has(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  /**
   * @param {Pick<Required<Options>, "language" | "fallbacks" | "languages">} options
   * @throws {Error} Throws an error if language is not found.
   * @returns {Language}
   */
  function getLanguage(options) {
    var possibleLanguages = [options.language];

    if (has(options, "fallbacks")) {
      if (isArray(options.fallbacks) && options.fallbacks.length) {
        possibleLanguages = possibleLanguages.concat(options.fallbacks);
      } else {
        throw new Error("fallbacks must be an array with at least one element");
      }
    }

    for (var i = 0; i < possibleLanguages.length; i++) {
      var languageToTry = possibleLanguages[i];
      if (has(options.languages, languageToTry)) {
        return options.languages[languageToTry];
      }
      if (has(LANGUAGES, languageToTry)) {
        return LANGUAGES[languageToTry];
      }
    }

    throw new Error("No language found.");
  }

  /**
   * @param {Piece} piece
   * @param {Language} language
   * @param {Pick<Required<Options>, "decimal" | "spacer" | "maxDecimalPoints" | "digitReplacements">} options
   */
  function renderPiece(piece, language, options) {
    var unitName = piece.unitName;
    var unitCount = piece.unitCount;

    var spacer = options.spacer;
    var maxDecimalPoints = options.maxDecimalPoints;

    /** @type {string} */
    var decimal;
    if (has(options, "decimal")) {
      decimal = options.decimal;
    } else if (has(language, "decimal")) {
      decimal = language.decimal;
    } else {
      decimal = ".";
    }

    /** @type {undefined | DigitReplacements} */
    var digitReplacements;
    if ("digitReplacements" in options) {
      digitReplacements = options.digitReplacements;
    } else if ("_digitReplacements" in language) {
      digitReplacements = language._digitReplacements;
    }

    /** @type {string} */
    var formattedCount;
    var normalizedUnitCount =
      maxDecimalPoints === void 0
        ? unitCount
        : Math.floor(unitCount * Math.pow(10, maxDecimalPoints)) /
          Math.pow(10, maxDecimalPoints);
    var countStr = normalizedUnitCount.toString();
    if (digitReplacements) {
      formattedCount = "";
      for (var i = 0; i < countStr.length; i++) {
        var char = countStr[i];
        if (char === ".") {
          formattedCount += decimal;
        } else {
          formattedCount += digitReplacements[char];
        }
      }
    } else {
      formattedCount = countStr.replace(".", decimal);
    }

    var languageWord = language[unitName];
    var word;
    if (typeof languageWord === "function") {
      word = languageWord(unitCount);
    } else {
      word = languageWord;
    }

    if (language._numberFirst) {
      return word + spacer + formattedCount;
    }
    return formattedCount + spacer + word;
  }

  /**
   * @typedef {Object} Piece
   * @prop {UnitName} unitName
   * @prop {number} unitCount
   */

  /**
   * @param {number} ms
   * @param {Pick<Required<Options>, "units" | "unitMeasures" | "largest" | "round">} options
   * @returns {Piece[]}
   */
  function getPieces(ms, options) {
    /** @type {UnitName} */
    var unitName;

    /** @type {number} */
    var i;

    /** @type {number} */
    var unitCount;

    /** @type {number} */
    var msRemaining;

    var units = options.units;
    var unitMeasures = options.unitMeasures;
    var largest = "largest" in options ? options.largest : Infinity;

    if (!units.length) return [];

    // Get the counts for each unit. Doesn't round or truncate anything.
    // For example, might create an object like `{ y: 7, m: 6, w: 0, d: 5, h: 23.99 }`.
    /** @type {Partial<Record<UnitName, number>>} */
    var unitCounts = {};
    msRemaining = ms;
    for (i = 0; i < units.length; i++) {
      unitName = units[i];
      var unitMs = unitMeasures[unitName];

      var isLast = i === units.length - 1;
      unitCount = isLast
        ? msRemaining / unitMs
        : Math.floor(msRemaining / unitMs);
      unitCounts[unitName] = unitCount;

      msRemaining -= unitCount * unitMs;
    }

    if (options.round) {
      // Update counts based on the `largest` option.
      // For example, if `largest === 2` and `unitCount` is `{ y: 7, m: 6, w: 0, d: 5, h: 23.99 }`,
      // updates to something like `{ y: 7, m: 6.2 }`.
      var unitsRemainingBeforeRound = largest;
      for (i = 0; i < units.length; i++) {
        unitName = units[i];
        unitCount = unitCounts[unitName];

        if (unitCount === 0) continue;

        unitsRemainingBeforeRound--;

        // "Take" the rest of the units into this one.
        if (unitsRemainingBeforeRound === 0) {
          for (var j = i + 1; j < units.length; j++) {
            var smallerUnitName = units[j];
            var smallerUnitCount = unitCounts[smallerUnitName];
            unitCounts[unitName] +=
              (smallerUnitCount * unitMeasures[smallerUnitName]) /
              unitMeasures[unitName];
            unitCounts[smallerUnitName] = 0;
          }
          break;
        }
      }

      // Round the last piece (which should be the only non-integer).
      //
      // This can be a little tricky if the last piece "bubbles up" to a larger
      // unit. For example, "3 days, 23.99 hours" should be rounded to "4 days".
      // It can also require multiple passes. For example, "6 days, 23.99 hours"
      // should become "1 week".
      for (i = units.length - 1; i >= 0; i--) {
        unitName = units[i];
        unitCount = unitCounts[unitName];

        if (unitCount === 0) continue;

        var rounded = Math.round(unitCount);
        unitCounts[unitName] = rounded;

        if (i === 0) break;

        var previousUnitName = units[i - 1];
        var previousUnitMs = unitMeasures[previousUnitName];
        var amountOfPreviousUnit = Math.floor(
          (rounded * unitMeasures[unitName]) / previousUnitMs
        );
        if (amountOfPreviousUnit) {
          unitCounts[previousUnitName] += amountOfPreviousUnit;
          unitCounts[unitName] = 0;
        } else {
          break;
        }
      }
    }

    /** @type {Piece[]} */
    var result = [];
    for (i = 0; i < units.length && result.length < largest; i++) {
      unitName = units[i];
      unitCount = unitCounts[unitName];
      if (unitCount) {
        result.push({ unitName: unitName, unitCount: unitCount });
      }
    }
    return result;
  }

  /**
   * @param {Piece[]} pieces
   * @param {Pick<Required<Options>, "units" | "language" | "languages" | "fallbacks" | "delimiter" | "spacer" | "decimal" | "conjunction" | "maxDecimalPoints" | "serialComma" | "digitReplacements">} options
   * @returns {string}
   */
  function formatPieces(pieces, options) {
    var language = getLanguage(options);

    if (!pieces.length) {
      var units = options.units;
      var smallestUnitName = units[units.length - 1];
      return renderPiece(
        { unitName: smallestUnitName, unitCount: 0 },
        language,
        options
      );
    }

    var conjunction = options.conjunction;
    var serialComma = options.serialComma;

    var delimiter;
    if (has(options, "delimiter")) {
      delimiter = options.delimiter;
    } else if (has(language, "delimiter")) {
      delimiter = language.delimiter;
    } else {
      delimiter = ", ";
    }

    /** @type {string[]} */
    var renderedPieces = [];
    for (var i = 0; i < pieces.length; i++) {
      renderedPieces.push(renderPiece(pieces[i], language, options));
    }

    if (!conjunction || pieces.length === 1) {
      return renderedPieces.join(delimiter);
    }

    if (pieces.length === 2) {
      return renderedPieces.join(conjunction);
    }

    return (
      renderedPieces.slice(0, -1).join(delimiter) +
      (serialComma ? "," : "") +
      conjunction +
      renderedPieces.slice(-1)
    );
  }

  /**
   * Create a humanizer, which lets you change the default options.
   */
  function humanizer(passedOptions) {
    var result = function humanizer(ms, humanizerOptions) {
      // Make sure we have a positive number.
      //
      // Has the nice side-effect of converting things to numbers. For example,
      // converts `"123"` and `Number(123)` to `123`.
      ms = Math.abs(ms);

      var options = assign({}, result, humanizerOptions || {});

      var pieces = getPieces(ms, options);

      return formatPieces(pieces, options);
    };

    return assign(
      result,
      {
        language: "en",
        spacer: " ",
        conjunction: "",
        serialComma: true,
        units: ["y", "mo", "w", "d", "h", "m", "s"],
        languages: {},
        round: false,
        unitMeasures: {
          y: 31557600000,
          mo: 2629800000,
          w: 604800000,
          d: 86400000,
          h: 3600000,
          m: 60000,
          s: 1000,
          ms: 1
        }
      },
      passedOptions
    );
  }

  /**
   * Humanize a duration.
   *
   * This is a wrapper around the default humanizer.
   */
  var humanizeDuration = humanizer({});

  humanizeDuration.getSupportedLanguages = function getSupportedLanguages() {
    var result = [];
    for (var language in LANGUAGES) {
      if (has(LANGUAGES, language) && language !== "gr") {
        result.push(language);
      }
    }
    return result;
  };

  humanizeDuration.humanizer = humanizer;

  // @ts-ignore
  if (typeof define === "function" && define.amd) {
    // @ts-ignore
    define(function () {
      return humanizeDuration;
    });
  } else if (typeof module !== "undefined" && module.exports) {
    module.exports = humanizeDuration;
  } else {
    this.humanizeDuration = humanizeDuration;
  }
})();
