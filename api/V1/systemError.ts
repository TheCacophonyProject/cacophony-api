// Fuzzily checks that error logs are similar
// METHOD
// Find the larger non over lapping substrings that are contained in both lines
// Consider a match if these substrings cover a certain percentage of the string length
// Consider the logs matching if enough lines are considered matching
// Example comparing the following lines
// line1 "the power error has occurred on test-pi 34 the power has gone down"
// line2 "the power error has occurred on test-pi 40 the power has gone down"
// subsets are "the power error has occurred on" and "the power has gone down"
//  and "the power" from the start of line 1 to "the power has gone down" of line 2
// this last match will be ignored, as the first substring "the power error has occurred on"
// is longer and overlaps
// The matching subsets create total of 10 words out of 12 this makes for a match of
// 100 * 10/12 = 84%

import { Event } from "../../models/Event";

// minimum number of words in a substring to be considered a match
const MIN_MATCH_LENGTH = 3;
// number of lines from the log to compare. in reverse order
const LINES_CHECK = 5;
// minimum percentage a line should match to be considered the same
const MATCH_MIN_COVERAGE = 60;

// how many lines must match with MATCH_MIN_COVERAGE out of the last LINES_CHECK lines
const MATCH_MIN_LINES = 2;

interface ServiceErrorMap {
  [key: string]: ServiceError;
}

// group provided events by logs are that are similar
function groupSystemErrors(events: Event[]): ServiceErrorMap {
  const serviceMap: ServiceErrorMap = {};

  for (const errorEvent of events) {
    let serviceError: ServiceError;
    const details = errorEvent.EventDetail.details;
    if (!("unitName" in details && "logs" in details)) {
      continue;
    }
    if (details["unitName"] in serviceMap) {
      serviceError = serviceMap[details["unitName"]];
    } else {
      serviceError = new ServiceError(details["unitName"]);
      serviceMap[details["unitName"]] = serviceError;
    }

    const log = new Log(
      errorEvent.Device.devicename,
      errorEvent.dateTime,
      details["logs"]
    );
    serviceError.match(log);
  }
  scores = [];
  return serviceMap;
}

let scores = [];
class ServiceError {
  devices: string[];
  errors: LogError[];
  constructor(public name: string) {
    this.devices = [];
    this.errors = [];
  }

  match(log: Log): boolean {
    if (this.devices.indexOf(log.device) == -1) {
      this.devices.push(log.device);
    }
    let matched = false;
    for (const logGroup of this.errors) {
      matched = logGroup.compare(log);
      if (matched) {
        return true;
      }
    }
    this.errors.push(new LogError(log));
    return false;
  }
}

class LinePattern {
  patterns: string[];
  score: number;
  index: number;
  constructor(matches: Match[], words: string[], score: number, index: number) {
    this.score = score;
    this.index = index;
    this.patterns = [];
    for (const match of matches) {
      this.patterns.push(
        words.slice(match.start[0], match.start[0] + match.length).join(" ")
      );
    }
  }

  // check if supplied string contains all patters/substrings
  match(line: string): boolean {
    let index: number;
    let compareTo = line;
    for (const pattern of this.patterns) {
      index = compareTo.indexOf(pattern);
      if (index == -1) {
        return false;
      }
      compareTo = compareTo.slice(index + pattern.length);
    }
    return true;
  }
}

class LogError {
  timestamps: Date[];
  devices: string[];
  similar: Log[];
  patterns: LinePattern[];
  constructor(log: Log) {
    this.devices = [];
    this.timestamps = [];
    this.similar = [];
    this.add(log);
  }

  compare(other: Log): boolean {
    if (this.patterns) {
      // already has a pattern so attempt to match
      const correct = this.match(other);
      return correct;
    }
    if (this.similar.length == 0) {
      return false;
    }

    this.patterns = this.similar[0].compare(other);
    if (this.patterns) {
      this.add(other);
      return true;
    }
    return false;
  }

  // match checks if the supplied logs matches this logs patterns, sufficiently
  match(other: Log): boolean {
    let matches = 0;
    let otherIndex = 0;
    for (const linePattern of this.patterns) {
      for (let i = otherIndex; i < LINES_CHECK && i < other.lines.length; i++) {
        const match = linePattern.match(other.lines[i]);
        if (match) {
          matches += 1;
          otherIndex = i + 1;
          break;
        }
      }
    }

    if (
      (other.lines.length == this.patterns.length &&
        matches == other.lines.length) ||
      matches >= MATCH_MIN_LINES
    ) {
      this.add(other);
      // matched all lines, may be less than MATCH_MIN_LNIES
      return true;
    }

    return false;
  }

  add(log: Log) {
    this.similar.push(log);
    this.timestamps.push(log.timestamp);
    if (this.devices.indexOf(log.device) == -1) {
      this.devices.push(log.device);
    }
  }
}

class Log {
  constructor(
    public device: string,
    public timestamp: Date,
    public lines: string[]
  ) {
    this.lines = this.lines.reverse();
  }

  // generateMatch compare this log to the other log and if they similar create the patterns
  // that define this log to match future logs
  compare(other: Log): LinePattern[] | null {
    const patterns: LinePattern[] = [];
    let matchedLines = 0;
    let otherIndex = 0;
    let minLength = MIN_MATCH_LENGTH;
    for (let i = 0; i < LINES_CHECK && i < this.lines.length; i++) {
      const words = this.lines[i].split(" ");
      for (let j = otherIndex; j < LINES_CHECK && j < other.lines.length; j++) {
        const otherWords = other.lines[j].split(" ");
        let matches = align(words, otherWords);
        // matches.sort((a, b) => b.length - a.length);
        if (words.length == otherWords.length) {
          minLength = Math.min(MIN_MATCH_LENGTH, words.length);
        }
        matches = findUniqueSubstrings(
          matches,
          [0, 0],
          [words.length, otherWords.length],
          minLength
        );
        let score = 0;
        for (const match of matches) {
          if (match.startDiffer()) {
            score = 0;
            break;
          }
          score += match.score(words.length);
        }
        if (score > MATCH_MIN_COVERAGE) {
          patterns.push(new LinePattern(matches, words, score, i));
          matchedLines += 1;
          otherIndex = j + 1;
          break;
        }
      }
    }
    if (
      other.lines.length == this.lines.length &&
      matchedLines == this.lines.length
    ) {
      // matched all lines, may be less than MATCH_MIN_LNIES
      return patterns;
    }
    if (matchedLines >= MATCH_MIN_LINES) {
      return patterns;
    }
    return null;
  }
}

class Match {
  length: number;

  constructor(public start: number[]) {
    this.length = 1;
  }

  // if one substring starts at 0 the other almost definitely should too
  startDiffer(): boolean {
    return (
      (this.start[0] == 0 && this.start[1] > 0) ||
      (this.start[1] == 0 && this.start[0] > 0)
    );
  }

  score(stringLength: number): number {
    var startSame = this.start[0] == this.start[1] ? 0.9 : 0;

    return Math.round((this.length / stringLength) * 100) + startSame;
  }
}

// align words a with words b, calculate all substring matches of a and b
function align(a: string[], b: string[]): Match[] {
  const substrings: Match[] = [];
  let row;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      if (scores.length < i + 1) {
        row = [{}];
        scores.push(row);
      } else {
        row = scores[i];
      }
      if (row.length < j + 1) {
        row.push({});
      }
      if (a[i] == b[j]) {
        let match: Match;
        if (i == 0 || j == 0) {
          const pattern = new Match([i, j]);
          substrings.push(pattern);
          match = pattern;
        } else {
          match = scores[i - 1][j - 1];
          if (!match) {
            const pattern = new Match([i, j]);
            match = pattern;
            substrings.push(pattern);
          } else {
            match.length += 1;
          }
        }
        scores[i][j] = match;
      } else {
        scores[i][j] = null;
      }
    }
  }
  return substrings;
}

// findUniqueSubstrings that do not overlap by choosing the longest match, and then search left and right of that
function findUniqueSubstrings(
  substrings: any[],
  start: number[],
  end: number[],
  minLength: number
): Match[] {
  let patterns: Match[] = [];

  if (
    substrings.length == 0 ||
    end[0] - start[0] < minLength ||
    end[1] - start[1] < minLength
  ) {
    return patterns;
  }
  if (end[0] < start[0] || end[1] < start[1]) {
    return patterns;
  }
  let max: Match;
  let index = 0;
  for (let i = 0; i < substrings.length; i++) {
    const sub = substrings[i];
    if (
      (!max || sub.lenth > max.length) &&
      sub.start[0] >= start[0] &&
      sub.start[1] >= start[1] &&
      sub.start[0] + sub.length <= end[0] &&
      sub.start[1] + sub.length <= end[1]
    ) {
      max = sub;
      index = i;
    }
  }

  if (max && max.length >= minLength) {
    const right = substrings.slice(index + 1);
    substrings.pop();
    // left side
    patterns.push(
      ...findUniqueSubstrings(substrings, start, max.start, minLength)
    );
    patterns.push(max);
    // right side
    patterns.push(
      ...findUniqueSubstrings(
        right,
        [max.start[0] + max.length, max.start[1] + max.length],
        end,
        minLength
      )
    );
  }
  return patterns;
}

export default function () {
  console.log("");
}

export { Log, ServiceError, groupSystemErrors, ServiceErrorMap };
