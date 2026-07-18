import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";

const path = "./data.json";

const START_DATE = "2023-01-01";
const END_DATE = "2026-07-19";

// Tiered density per calendar period: ramps up year over year, peaking at
// ~300 commits/year in 2025 and holding steady into 2026.
//   2023-01-01 -> 2023-12-31 : ~115-120 commits/year
//   2024-01-01 -> 2024-12-31 : ~200 commits/year
//   2025-01-01 -> 2025-12-31 : ~300 commits/year (peak)
//   2026-01-01 -> 2026-07-19 : holds at the 2025 peak rate
const PERIODS = [
  { start: "2023-01-01", end: "2023-12-31", pWeekday: 0.18, maxWeekday: 3, pWeekend: 0.15, maxWeekend: 2 },
  { start: "2024-01-01", end: "2024-12-31", pWeekday: 0.31, maxWeekday: 3, pWeekend: 0.25, maxWeekend: 2 },
  { start: "2025-01-01", end: "2025-12-31", pWeekday: 0.46, maxWeekday: 3, pWeekend: 0.38, maxWeekend: 2 },
  { start: "2026-01-01", end: "2026-07-19", pWeekday: 0.46, maxWeekday: 3, pWeekend: 0.38, maxWeekend: 2 },
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getPeriodFor = (m) =>
  PERIODS.find((p) => m.isBetween(moment(p.start), moment(p.end), "day", "[]"));

// Build a realistic-looking schedule of commit timestamps between START_DATE
// and END_DATE: density ramps up per PERIODS above, weekends get less
// activity than weekdays, and some days are skipped entirely.
const buildSchedule = () => {
  const schedule = [];
  const cursor = moment(START_DATE);
  const end = moment(END_DATE);

  while (cursor.isSameOrBefore(end, "day")) {
    const period = getPeriodFor(cursor);
    const isWeekend = cursor.day() === 0 || cursor.day() === 6;
    const activityChance = isWeekend ? period.pWeekend : period.pWeekday;

    if (Math.random() < activityChance) {
      const maxCommits = isWeekend ? period.maxWeekend : period.maxWeekday;
      const commitCount = randomInt(1, maxCommits);

      for (let i = 0; i < commitCount; i++) {
        const commitMoment = cursor
          .clone()
          .hour(randomInt(8, 22))
          .minute(randomInt(0, 59))
          .second(randomInt(0, 59));
        schedule.push(commitMoment.format());
      }
    }

    cursor.add(1, "day");
  }

  // Commits within the same day must be committed in chronological order.
  schedule.sort((a, b) => moment(a).valueOf() - moment(b).valueOf());
  return schedule;
};

const schedule = buildSchedule();
console.log(`Scheduled ${schedule.length} commits from ${START_DATE} to ${END_DATE}`);

const makeCommits = (queue) => {
  if (queue.length === 0) return simpleGit().push();

  const [date, ...rest] = queue;
  const data = { date };

  console.log(date);
  jsonfile.writeFile(path, data, () => {
    simpleGit()
      .add([path])
      .commit(date, { "--date": date }, () => makeCommits(rest));
  });
};

makeCommits(schedule);