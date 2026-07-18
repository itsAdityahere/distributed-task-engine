import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";

const path = "./data.json";

const START_DATE = "2023-11-01";
const END_DATE = "2026-07-19";

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Build a realistic-looking schedule of commit timestamps between START_DATE
// and END_DATE: most weekdays get a handful of commits, weekends and some
// random days are skipped entirely, and a few days get a burst of commits.
const buildSchedule = () => {
  const schedule = [];
  const cursor = moment(START_DATE);
  const end = moment(END_DATE);

  while (cursor.isSameOrBefore(end, "day")) {
    const isWeekend = cursor.day() === 0 || cursor.day() === 6;
    const activityChance = isWeekend ? 0.25 : 0.7;

    if (Math.random() < activityChance) {
      const maxCommits = isWeekend ? 3 : 6;
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