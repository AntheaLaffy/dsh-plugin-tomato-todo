// packages/core/src/errors.ts
var AppError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "AppError";
  }
};
function ensure(ok, message) {
  if (!ok) throw new AppError(message);
}
function require2(value, message) {
  if (value === null || value === void 0) throw new AppError(message);
  return value;
}
function charCount(s) {
  return Array.from(s).length;
}
function utf8Len(s) {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(s).length;
  }
  return charCount(s) * 3;
}
function clone(value) {
  if (Array.isArray(value)) {
    return value.map((v) => clone(v));
  }
  if (value !== null && typeof value === "object") {
    const out = Object.create(Object.getPrototypeOf(value));
    for (const key of Object.keys(value)) {
      out[key] = clone(value[key]);
    }
    return out;
  }
  return value;
}
function deepEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object" && a !== null && typeof b === "object" && b !== null && !Array.isArray(a) && !Array.isArray(b)) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(
      (k) => deepEqual(
        a[k],
        b[k]
      )
    );
  }
  return false;
}

// packages/core/src/ids.ts
function id() {
  const crypto = globalThis.crypto;
  if (crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = bytes[6] & 15 | 64;
  bytes[8] = bytes[8] & 63 | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    ""
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// packages/core/src/time.ts
var DAY_MS = 864e5;
var pad2 = (n) => n < 10 ? `0${n}` : String(n);
var pad4 = (n) => String(n).padStart(4, "0");
function localDateOf(at) {
  const d = new Date(at * 1e3);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}
function dateAt(at) {
  const { year, month, day } = localDateOf(at);
  return `${pad4(year)}-${pad2(month)}-${pad2(day)}`;
}
function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day };
}
function validDate(value) {
  return parseDate(value) !== null;
}
function addDays(date, days) {
  const t = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: t.getUTCFullYear(),
    month: t.getUTCMonth() + 1,
    day: t.getUTCDate()
  };
}
function weekdayMonday(date) {
  const day = new Date(
    Date.UTC(date.year, date.month - 1, date.day)
  ).getUTCDay();
  return day === 0 ? 7 : day;
}
function weekStart(date) {
  return addDays(date, -(weekdayMonday(date) - 1));
}
function daysBetween(from, to) {
  const a = Date.UTC(from.year, from.month - 1, from.day);
  const b = Date.UTC(to.year, to.month - 1, to.day);
  return Math.floor((b - a) / DAY_MS);
}
function formatDate(date) {
  return `${pad4(date.year)}-${pad2(date.month)}-${pad2(date.day)}`;
}
function atLocal(year, month, day, hour, minute, second = 0) {
  return Math.floor(
    new Date(year, month - 1, day, hour, minute, second).getTime() / 1e3
  );
}
function atLocalDate(date, hour = 0, minute = 0) {
  return atLocal(date.year, date.month, date.day, hour, minute);
}
function atLocalDateString(date) {
  const parsed = parseDate(date);
  if (parsed === null) return null;
  return atLocalDate(parsed);
}
function hourMinuteString(at) {
  const d = new Date(at * 1e3);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function secondsOfDay(at) {
  const d = new Date(at * 1e3);
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}
function hourMinuteOf(at) {
  const d = new Date(at * 1e3);
  return { hour: d.getHours(), minute: d.getMinutes() };
}
function validTime(value) {
  return value.length === 5 && value.charCodeAt(2) === 58 && value.slice(0, 2) >= "00" && value.slice(0, 2) <= "23" && value.slice(3) >= "00" && value.slice(3) <= "59";
}
function minutesOf(value) {
  if (value.length !== 5 || value.charCodeAt(2) !== 58) return null;
  const hour = Number(value.slice(0, 2));
  const minute = Number(value.slice(3));
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour > 23 || minute > 59) {
    return null;
  }
  return hour * 60 + minute;
}
function now() {
  return Math.floor(Date.now() / 1e3);
}

// packages/core/src/model.ts
function kindOf(task) {
  return task.reminderTime !== null && (task.habitId !== null || task.recurring) ? "habit" : "ordinary";
}
function isHabit(task) {
  return kindOf(task) === "habit";
}

// packages/core/src/json.ts
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function rejectUnknown(obj, allowed2, what) {
  for (const key of Object.keys(obj)) {
    if (!allowed2.includes(key)) {
      throw new AppError(`\u672A\u77E5\u5B57\u6BB5\uFF1A${what} \u4E0D\u63A5\u53D7 "${key}"`);
    }
  }
}
function asStr(value, what) {
  if (typeof value !== "string") throw new AppError(`${what}\u5FC5\u987B\u662F\u5B57\u7B26\u4E32`);
  return value;
}
function asBool(value, what) {
  if (typeof value !== "boolean") throw new AppError(`${what}\u5FC5\u987B\u662F\u5E03\u5C14\u503C`);
  return value;
}
function asInt(value, what) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new AppError(`${what}\u5FC5\u987B\u662F\u6574\u6570`);
  }
  return value;
}
function asArray(value, what) {
  if (!Array.isArray(value)) throw new AppError(`${what}\u5FC5\u987B\u662F\u6570\u7EC4`);
  return value;
}
function asOpt(value, what, parse) {
  if (value === null) return null;
  return parse(value, what);
}
function field(obj, key, what, parse, def) {
  const value = obj[key];
  if (value === void 0) return def;
  return parse(value, what);
}
function requiredField(obj, key, what, parse) {
  const value = obj[key];
  if (value === void 0) throw new AppError(`${what}\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5 ${key}`);
  return parse(value, what);
}
function oneOf(value, what, allowed2) {
  const s = asStr(value, what);
  if (!allowed2.includes(s))
    throw new AppError(`${what}\u53D6\u503C\u65E0\u6548\uFF1A${s}`);
  return s;
}

// packages/core/src/lock.ts
var SCHEDULE_KEYS = [
  "id",
  "name",
  "start",
  "end",
  "days",
  "enabled",
  "strict"
];
var ACTIVE_KEYS = ["name", "startedAt", "endsAt", "strict"];
var STATE_KEYS = ["schedules", "active", "suppressedUntil"];
function parseLockSchedule(raw) {
  if (!isObject(raw)) throw new AppError("\u9501\u673A\u89C4\u5219\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...SCHEDULE_KEYS], "\u9501\u673A\u89C4\u5219");
  return {
    id: requiredField(raw, "id", "\u9501\u673A\u89C4\u5219", asStr),
    name: requiredField(raw, "name", "\u9501\u673A\u89C4\u5219", asStr),
    start: requiredField(raw, "start", "\u9501\u673A\u89C4\u5219", asStr),
    end: requiredField(raw, "end", "\u9501\u673A\u89C4\u5219", asStr),
    days: asArray(
      requiredField(raw, "days", "\u9501\u673A\u89C4\u5219", (v) => v),
      "days"
    ).map((d) => asInt(d, "\u9501\u673A\u661F\u671F")),
    enabled: requiredField(raw, "enabled", "\u9501\u673A\u89C4\u5219", asBool),
    strict: field(raw, "strict", "\u9501\u673A\u89C4\u5219", asBool, false)
  };
}
function serializeLockSchedule(s) {
  return {
    id: s.id,
    name: s.name,
    start: s.start,
    end: s.end,
    days: s.days,
    enabled: s.enabled,
    strict: s.strict
  };
}
function parseActiveLock(raw) {
  if (!isObject(raw)) throw new AppError("\u9501\u673A\u72B6\u6001\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...ACTIVE_KEYS], "\u9501\u673A\u72B6\u6001");
  return {
    name: requiredField(raw, "name", "\u9501\u673A\u72B6\u6001", asStr),
    startedAt: requiredField(raw, "startedAt", "\u9501\u673A\u72B6\u6001", asInt),
    endsAt: requiredField(raw, "endsAt", "\u9501\u673A\u72B6\u6001", asInt),
    strict: requiredField(raw, "strict", "\u9501\u673A\u72B6\u6001", asBool)
  };
}
function serializeActiveLock(a) {
  return {
    name: a.name,
    startedAt: a.startedAt,
    endsAt: a.endsAt,
    strict: a.strict
  };
}
function parseLockState(raw) {
  if (!isObject(raw)) throw new AppError("\u9501\u673A\u914D\u7F6E\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...STATE_KEYS], "\u9501\u673A\u914D\u7F6E");
  return {
    schedules: field(
      raw,
      "schedules",
      "\u9501\u673A\u914D\u7F6E",
      (v) => asArray(v, "schedules").map(parseLockSchedule),
      []
    ),
    active: field(
      raw,
      "active",
      "\u9501\u673A\u914D\u7F6E",
      (v) => v === null ? null : parseActiveLock(v),
      null
    ),
    suppressedUntil: field(raw, "suppressedUntil", "\u9501\u673A\u914D\u7F6E", asInt, 0)
  };
}
function serializeLockState(s) {
  return {
    schedules: s.schedules.map(serializeLockSchedule),
    // 与 Rust 一致：Option 直接序列化，None 显式写 "active": null（serde 两端接受）。
    active: s.active === null ? null : serializeActiveLock(s.active),
    suppressedUntil: s.suppressedUntil
  };
}
function validateLock(state) {
  if (state.schedules.length > 20) {
    throw new AppError("\u6700\u591A\u8BBE\u7F6E 20 \u4E2A\u9501\u673A\u65F6\u6BB5");
  }
  const ids = /* @__PURE__ */ new Set();
  const occupied = new Array(7 * 1440).fill(false);
  for (const s of state.schedules) {
    if (s.id.length === 0 || ids.has(s.id) || s.name.trim().length === 0 || Array.from(s.name).length > 40) {
      throw new AppError("\u9501\u673A\u540D\u79F0\u9700\u4E3A 1\u201340 \u5B57\u7B26\uFF0CID \u9700\u552F\u4E00\u4E14\u975E\u7A7A");
    }
    ids.add(s.id);
    if (minutesOf(s.start) === null || minutesOf(s.end) === null || s.start === s.end) {
      throw new AppError("\u9501\u673A\u65F6\u95F4\u9700\u4E3A\u6709\u6548 HH:MM\uFF0C\u5F00\u59CB\u4E0E\u7ED3\u675F\u4E0D\u80FD\u76F8\u540C");
    }
    const unique = new Set(s.days);
    if (s.days.length === 0 || s.days.length > 7 || unique.size !== s.days.length || s.days.some((d) => d < 1 || d > 7)) {
      throw new AppError("\u8BF7\u9009\u62E9\u4E0D\u91CD\u590D\u7684\u661F\u671F\uFF08\u5468\u4E00\u4E3A 1\uFF0C\u5468\u65E5\u4E3A 7\uFF09");
    }
    if (s.enabled) {
      const start = minutesOf(s.start);
      const end = minutesOf(s.end);
      const duration = (end + 1440 - start) % 1440;
      for (const day of s.days) {
        for (let offset = 0; offset < duration; offset += 1) {
          const minute = ((day - 1) * 1440 + start + offset) % (7 * 1440);
          if (occupied[minute]) {
            throw new AppError("\u542F\u7528\u7684\u9501\u673A\u65F6\u6BB5\u4E0D\u80FD\u91CD\u53E0\uFF0C\u8BF7\u8C03\u6574\u65E5\u671F\u6216\u65F6\u95F4");
          }
          occupied[minute] = true;
        }
      }
    }
  }
  if (state.active !== null) {
    const a = state.active;
    if (a.name.trim().length === 0 || Array.from(a.name).length > 40 || a.endsAt <= a.startedAt || a.endsAt - a.startedAt > 8 * 86400) {
      throw new AppError("\u65E0\u6548\u7684\u9501\u673A\u72B6\u6001");
    }
  }
}
function scheduledAt(state, at) {
  if (at < state.suppressedUntil) return null;
  const today = localDateOf(at);
  let result = null;
  for (const date of [addDays(today, -1), today]) {
    const weekday = weekdayMonday(date);
    for (const s of state.schedules) {
      if (!s.enabled || !s.days.includes(weekday)) continue;
      const startTime = minutesOf(s.start);
      const endTime = minutesOf(s.end);
      if (startTime === null || endTime === null) continue;
      const endDate = endTime <= startTime ? addDays(date, 1) : date;
      const start = atLocalDate(
        date,
        Math.floor(startTime / 60),
        startTime % 60
      );
      const end = atLocalDate(endDate, Math.floor(endTime / 60), endTime % 60);
      if (at >= start && at < end) {
        if (result !== null) {
          result.startedAt = Math.min(result.startedAt, start);
          result.endsAt = Math.max(result.endsAt, end);
          result.strict = result.strict || s.strict;
        } else {
          result = {
            name: s.name,
            startedAt: start,
            endsAt: end,
            strict: s.strict
          };
        }
      }
    }
  }
  return result;
}
function releaseLock(state, at) {
  const scheduled = scheduledAt(state, at);
  if (scheduled !== null) {
    state.suppressedUntil = Math.max(state.suppressedUntil, scheduled.endsAt);
  }
  state.active = null;
}

// packages/core/src/blocks.ts
var BLOCK_KEYS = [
  "id",
  "title",
  "days",
  "start",
  "end",
  "attention",
  "notes"
];
function parseBlock(raw) {
  if (!isObject(raw)) throw new AppError("\u963B\u585E\u65F6\u6BB5\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...BLOCK_KEYS], "\u963B\u585E\u65F6\u6BB5");
  return {
    id: requiredField(raw, "id", "\u963B\u585E\u65F6\u6BB5", asStr),
    title: requiredField(raw, "title", "\u963B\u585E\u65F6\u6BB5", asStr),
    days: asArray(
      requiredField(raw, "days", "\u963B\u585E\u65F6\u6BB5", (v) => v),
      "days"
    ).map((d) => asInt(d, "\u963B\u585E\u65F6\u6BB5\u661F\u671F")),
    start: requiredField(raw, "start", "\u963B\u585E\u65F6\u6BB5", asStr),
    end: requiredField(raw, "end", "\u963B\u585E\u65F6\u6BB5", asStr),
    attention: field(
      raw,
      "attention",
      "\u963B\u585E\u65F6\u6BB5",
      (v) => oneOf(v, "attention", ["required", "light"]),
      "required"
    ),
    notes: field(raw, "notes", "\u963B\u585E\u65F6\u6BB5", asStr, "")
  };
}
function serializeBlock(b) {
  return {
    id: b.id,
    title: b.title,
    days: b.days,
    start: b.start,
    end: b.end,
    attention: b.attention,
    notes: b.notes
  };
}
function band(block, date) {
  const parsed = parseDate(date);
  if (parsed === null) return null;
  if (!block.days.includes(weekdayMonday(parsed))) return null;
  const start = minutesOf(block.start);
  const end = minutesOf(block.end);
  if (start === null || end === null) return null;
  return { start, end: end <= start ? end + 1440 : end };
}
function overlapMinutes(block, date, start, end) {
  const b = band(block, date);
  if (b === null) return 0;
  return Math.min(end, b.end) - Math.max(start, b.start) > 0 ? Math.min(end, b.end) - Math.max(start, b.start) : 0;
}
function validateBlock(block) {
  if (block.id.length === 0) {
    throw new AppError("\u963B\u585E\u65F6\u6BB5 ID \u4E0D\u80FD\u4E3A\u7A7A");
  }
  if (block.title.trim().length === 0 || Array.from(block.title).length > 40) {
    throw new AppError("\u963B\u585E\u65F6\u6BB5\u540D\u79F0\u9700\u4E3A 1\u201340 \u4E2A\u5B57\u7B26");
  }
  if (minutesOf(block.start) === null || minutesOf(block.end) === null) {
    throw new AppError("\u963B\u585E\u65F6\u6BB5\u9700\u4E3A\u6709\u6548\u7684 HH:MM \u65F6\u95F4");
  }
  if (block.start === block.end) {
    throw new AppError("\u963B\u585E\u65F6\u6BB5\u7684\u5F00\u59CB\u4E0E\u7ED3\u675F\u4E0D\u80FD\u76F8\u540C");
  }
  const unique = new Set(block.days);
  if (block.days.length === 0 || block.days.length > 7 || unique.size !== block.days.length || block.days.some((d) => d < 1 || d > 7)) {
    throw new AppError("\u8BF7\u9009\u62E9\u4E0D\u91CD\u590D\u7684\u661F\u671F\uFF08\u5468\u4E00\u4E3A 1\uFF0C\u5468\u65E5\u4E3A 7\uFF09");
  }
  if (Array.from(block.notes).length > 2e3) {
    throw new AppError("\u963B\u585E\u65F6\u6BB5\u5907\u6CE8\u8FC7\u957F");
  }
}
function validateBlocks(blocks) {
  if (blocks.length > 60) {
    throw new AppError("\u8BFE\u8868\u963B\u585E\u65F6\u6BB5\u6700\u591A 60 \u9879");
  }
  const ids = /* @__PURE__ */ new Set();
  for (const block of blocks) {
    validateBlock(block);
    if (ids.has(block.id)) {
      throw new AppError("\u963B\u585E\u65F6\u6BB5 ID \u91CD\u590D");
    }
    ids.add(block.id);
  }
}
function blocksOnDate(blocks, date) {
  if (parseDate(date) === null) return [];
  return blocks.filter((b) => band(b, date) !== null).slice().sort(
    (a, b) => a.start < b.start ? -1 : a.start > b.start ? 1 : a.title < b.title ? -1 : a.title > b.title ? 1 : 0
  );
}
function requiredMinutes(blocks, date) {
  if (parseDate(date) === null) return 0;
  let total = 0;
  for (const b of blocks) {
    if (b.attention !== "required") continue;
    const bandValue = band(b, date);
    if (bandValue !== null) total += bandValue.end - bandValue.start;
  }
  return total;
}

// packages/core/src/habits.ts
var HABIT_KEYS = ["id", "name"];
function parseHabit(raw) {
  if (!isObject(raw)) throw new AppError("\u4E60\u60EF\u7EC4\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...HABIT_KEYS], "\u4E60\u60EF\u7EC4");
  return {
    id: requiredField(raw, "id", "\u4E60\u60EF\u7EC4", asStr),
    name: requiredField(raw, "name", "\u4E60\u60EF\u7EC4", asStr)
  };
}
function serializeHabit(h) {
  return { id: h.id, name: h.name };
}
function validateHabit(habit) {
  if (habit.name.trim().length === 0 || Array.from(habit.name).length > 40) {
    throw new AppError("\u4E60\u60EF\u540D\u79F0\u9700\u4E3A 1\u201340 \u4E2A\u5B57\u7B26");
  }
}

// packages/core/src/reminders.ts
function validateReminderTask(task) {
  if (task.dueDate === null || !validDate(task.dueDate)) {
    throw new AppError("\u4EFB\u52A1\u5FC5\u987B\u6307\u5B9A\u6709\u6548\u7684\u8BA1\u5212\u65E5\u671F");
  }
  if (task.focusMinutes !== null && (task.focusMinutes < 1 || task.focusMinutes > 180)) {
    throw new AppError("\u5355\u6B21\u4E13\u6CE8\u65F6\u957F\u9700\u4E3A1\u2014180\u5206\u949F");
  }
  if (task.reminderTime !== null) {
    if (task.dueDate === null || minutesOf(task.reminderTime) === null) {
      throw new AppError("\u63D0\u9192\u9700\u8981\u8BA1\u5212\u65E5\u671F\u548C\u6709\u6548\u7684 HH:MM \u65F6\u95F4");
    }
  }
}
function windowMinutes(task, settings) {
  const focus = task.focusMinutes ?? settings.focusMinutes;
  const sessions = Math.max(1, task.estimate);
  const every = Math.max(1, settings.longBreakEvery);
  let breaks = 0;
  for (let i = 1; i < sessions; i += 1) {
    breaks += i % every === 0 ? settings.longBreakMinutes : settings.shortBreakMinutes;
  }
  return sessions * focus + breaks;
}
function reminderIdle(data) {
  return !data.timer.running && data.timer.startedAt === null && data.timer.remainingSecs === data.timer.durationSecs && data.lock.active === null;
}
function pendingReminder(data) {
  if (!reminderIdle(data)) return null;
  let best = null;
  for (const t of data.tasks) {
    if (t.completed || !t.reminderPending) continue;
    if (best === null || `${t.dueDate}|${t.reminderTime}|${t.id}` < `${best.dueDate}|${best.reminderTime}|${best.id}`) {
      best = t;
    }
  }
  return best;
}
function dueAutoTask(data) {
  let best = null;
  for (const t of data.tasks) {
    if (!t.reminderPending || !taskHasRoundsLeft(data, t)) continue;
    if (best === null || `${t.dueDate}|${t.reminderTime}|${t.id}` < `${best.dueDate}|${best.reminderTime}|${best.id}`) {
      best = t;
    }
  }
  return best;
}
function taskHasRoundsLeft(data, task) {
  if (task.completed || task.reminderExpired) return false;
  const completedRounds = data.sessions.filter(
    (s) => s.source === "timer" && s.completed && s.taskId === task.id
  ).length;
  return completedRounds < task.estimate;
}
function startDueTask(data, at) {
  if (!data.settings.autoStartTasks || !reminderIdle(data) || data.education.assessments.some(
    (a) => a.startedAt !== null && a.stoppedAt === null
  )) {
    return false;
  }
  const task = dueAutoTask(data);
  if (task === null) return false;
  data.timer.taskId = task.id;
  resetTo(data, "focus");
  startTimer(data, at);
  return true;
}
function tickReminders(data, at) {
  const today = dateAt(at);
  const nowMinutes = Math.floor(secondsOfDay(at) / 60);
  const nowSeconds = secondsOfDay(at);
  const settings = data.settings;
  let changed = false;
  for (const t of data.tasks) {
    const isToday = t.dueDate === today;
    const past = t.dueDate !== null && t.dueDate < today;
    const start = t.reminderTime !== null ? minutesOf(t.reminderTime) : null;
    const expired = !t.completed && (start !== null ? (() => {
      const spentAt = start + windowMinutes(t, settings) + (isHabit(t) ? 0 : t.scrapMinutes);
      return past || isToday && nowSeconds >= spentAt * 60;
    })() : false);
    if (expired && !t.reminderExpired) {
      t.reminderExpired = true;
      changed = true;
    }
    if ((t.completed || expired || !isToday) && t.reminderPending) {
      t.reminderPending = false;
      changed = true;
    }
    if (expired && !t.reminderFired) {
      t.reminderFired = true;
      changed = true;
    }
    if (!t.completed && !t.reminderFired && isToday && !expired && start !== null && start <= nowMinutes) {
      t.reminderFired = true;
      t.reminderPending = true;
      changed = true;
    }
  }
  return changed;
}
function timerRemaining(timer, at) {
  if (timer.running && timer.deadline !== null) {
    const remaining = timer.deadline - at;
    return Math.min(Math.max(remaining, 0), timer.durationSecs);
  }
  return timer.remainingSecs;
}
function recordSession(data, at, completed) {
  const elapsed = data.timer.durationSecs - timerRemaining(data.timer, at);
  if (data.timer.mode !== "focus" || elapsed === 0) return;
  const task = data.tasks.find((t) => t.id === data.timer.taskId);
  const project = task !== void 0 && task.projectId !== null ? data.projects.find((p) => p.id === task.projectId) : void 0;
  data.sessions.push({
    id: id(),
    source: "timer",
    taskId: data.timer.taskId,
    taskTitle: task?.title ?? "\u81EA\u7531\u4E13\u6CE8",
    projectName: project?.name ?? "\u672A\u5206\u7C7B",
    startedAt: data.timer.startedAt ?? at - elapsed,
    endedAt: at,
    durationSecs: elapsed,
    completed
  });
}
function resetTo(data, mode) {
  data.timer.autoFocusBlocked = false;
  data.timer.mode = mode;
  data.timer.running = false;
  data.timer.durationSecs = durationOf(data, mode);
  data.timer.remainingSecs = data.timer.durationSecs;
  data.timer.deadline = null;
  data.timer.startedAt = null;
}
function durationOf(data, mode) {
  const minutes = mode === "focus" ? data.tasks.find((t) => t.id === data.timer.taskId)?.focusMinutes ?? data.settings.focusMinutes : mode === "shortBreak" ? data.settings.shortBreakMinutes : data.settings.longBreakMinutes;
  return 60 * minutes;
}
function startTimer(data, at) {
  if (data.timer.mode === "focus") {
    if (data.timer.startedAt === null && !data.timer.running && data.timer.remainingSecs === data.timer.durationSecs) {
      resetTo(data, "focus");
    }
    const task = data.tasks.find((t) => t.id === data.timer.taskId);
    if (task !== void 0) task.reminderPending = false;
  }
  if (!data.timer.running) {
    if (data.timer.startedAt === null) data.timer.startedAt = at;
    data.timer.deadline = at + data.timer.remainingSecs;
    data.timer.running = true;
  }
}

// packages/core/src/templates.ts
var TEMPLATE_SUBTASK_KEYS = ["id", "title"];
var SHAPE_KEYS = [
  "title",
  "notes",
  "projectId",
  "habitId",
  "focusMinutes",
  "scrapMinutes",
  "priority",
  "estimate",
  "tags",
  "subtasks"
];
var PRINT_SLOT_KEYS = ["days", "time"];
var CALENDAR_SLOT_KEYS = ["dates", "time"];
var TEMPLATE_KEYS = [
  "id",
  "shape",
  "printing",
  "automatic",
  "printAheadDays"
];
var PRINT_RECORD_KEYS = ["templateId", "date"];
function parseTemplateSubtask(raw) {
  if (!isObject(raw)) throw new AppError("\u6A21\u677F\u5B50\u4EFB\u52A1\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...TEMPLATE_SUBTASK_KEYS], "\u6A21\u677F\u5B50\u4EFB\u52A1");
  return {
    id: requiredField(raw, "id", "\u6A21\u677F\u5B50\u4EFB\u52A1", asStr),
    title: requiredField(raw, "title", "\u6A21\u677F\u5B50\u4EFB\u52A1", asStr)
  };
}
function parseShape(raw) {
  if (!isObject(raw)) throw new AppError("\u6A21\u677F\u5F62\u72B6\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...SHAPE_KEYS], "\u6A21\u677F\u5F62\u72B6");
  return {
    title: requiredField(raw, "title", "\u6A21\u677F\u5F62\u72B6", asStr),
    notes: field(raw, "notes", "\u6A21\u677F\u5F62\u72B6", asStr, ""),
    projectId: field(
      raw,
      "projectId",
      "\u6A21\u677F\u5F62\u72B6",
      (v) => asOpt(v, "projectId", asStr),
      null
    ),
    habitId: field(
      raw,
      "habitId",
      "\u6A21\u677F\u5F62\u72B6",
      (v) => asOpt(v, "habitId", asStr),
      null
    ),
    focusMinutes: field(
      raw,
      "focusMinutes",
      "\u6A21\u677F\u5F62\u72B6",
      (v) => asOpt(v, "focusMinutes", (x) => asInt(x, "focusMinutes")),
      null
    ),
    scrapMinutes: field(raw, "scrapMinutes", "\u6A21\u677F\u5F62\u72B6", asInt, 0),
    priority: field(raw, "priority", "\u6A21\u677F\u5F62\u72B6", asInt, 0),
    estimate: field(raw, "estimate", "\u6A21\u677F\u5F62\u72B6", asInt, 1),
    tags: field(
      raw,
      "tags",
      "\u6A21\u677F\u5F62\u72B6",
      (v) => asArray(v, "tags").map((t) => asStr(t, "\u6807\u7B7E")),
      []
    ),
    subtasks: field(
      raw,
      "subtasks",
      "\u6A21\u677F\u5F62\u72B6",
      (v) => asArray(v, "subtasks").map(parseTemplateSubtask),
      []
    )
  };
}
function serializeShape(s) {
  return {
    title: s.title,
    notes: s.notes,
    projectId: s.projectId,
    habitId: s.habitId,
    focusMinutes: s.focusMinutes,
    scrapMinutes: s.scrapMinutes,
    priority: s.priority,
    estimate: s.estimate,
    tags: s.tags,
    subtasks: s.subtasks.map((sub) => ({ id: sub.id, title: sub.title }))
  };
}
function parsePrintSlot(raw) {
  if (!isObject(raw)) throw new AppError("\u5468\u671F\u65F6\u6BB5\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...PRINT_SLOT_KEYS], "\u5468\u671F\u65F6\u6BB5");
  return {
    days: asArray(
      requiredField(raw, "days", "\u5468\u671F\u65F6\u6BB5", (v) => v),
      "days"
    ).map((d) => asInt(d, "\u5468\u671F\u661F\u671F")),
    time: field(
      raw,
      "time",
      "\u5468\u671F\u65F6\u6BB5",
      (v) => asOpt(v, "time", asStr),
      null
    )
  };
}
function parseCalendarSlot(raw) {
  if (!isObject(raw)) throw new AppError("\u65E5\u7A0B\u65F6\u6BB5\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...CALENDAR_SLOT_KEYS], "\u65E5\u7A0B\u65F6\u6BB5");
  return {
    dates: asArray(
      requiredField(raw, "dates", "\u65E5\u7A0B\u65F6\u6BB5", (v) => v),
      "dates"
    ).map((d) => asStr(d, "\u65E5\u7A0B\u65E5\u671F")),
    time: field(
      raw,
      "time",
      "\u65E5\u7A0B\u65F6\u6BB5",
      (v) => asOpt(v, "time", asStr),
      null
    )
  };
}
function parsePrinting(raw) {
  if (!isObject(raw)) throw new AppError("\u5370\u5237\u89C4\u5219\u5FC5\u987B\u662F\u5BF9\u8C61");
  const kind = oneOf(
    requiredField(raw, "kind", "\u5370\u5237\u89C4\u5219", (v) => v),
    "\u5370\u5237\u89C4\u5219 kind",
    ["once", "calendar", "weekly"]
  );
  if (kind === "once") {
    rejectUnknown(raw, ["kind", "date", "time"], "\u4E00\u6B21\u6027\u5370\u5237\u89C4\u5219");
    return {
      kind,
      date: field(
        raw,
        "date",
        "\u4E00\u6B21\u6027\u5370\u5237\u89C4\u5219",
        (v) => asOpt(v, "date", asStr),
        null
      ),
      time: field(
        raw,
        "time",
        "\u4E00\u6B21\u6027\u5370\u5237\u89C4\u5219",
        (v) => asOpt(v, "time", asStr),
        null
      )
    };
  }
  if (kind === "calendar") {
    rejectUnknown(raw, ["kind", "slots"], "\u65E5\u7A0B\u5370\u5237\u89C4\u5219");
    return {
      kind,
      slots: asArray(
        requiredField(raw, "slots", "\u65E5\u7A0B\u5370\u5237\u89C4\u5219", (v) => v),
        "slots"
      ).map(parseCalendarSlot)
    };
  }
  rejectUnknown(raw, ["kind", "slots"], "\u5468\u671F\u5370\u5237\u89C4\u5219");
  return {
    kind,
    slots: asArray(
      requiredField(raw, "slots", "\u5468\u671F\u5370\u5237\u89C4\u5219", (v) => v),
      "slots"
    ).map(parsePrintSlot)
  };
}
function serializePrinting(p) {
  if (p.kind === "once") {
    return { kind: "once", date: p.date, time: p.time };
  }
  if (p.kind === "calendar") {
    return {
      kind: "calendar",
      slots: p.slots.map((s) => ({ dates: s.dates, time: s.time }))
    };
  }
  return {
    kind: "weekly",
    slots: p.slots.map((s) => ({ days: s.days, time: s.time }))
  };
}
function parseTemplate(raw) {
  if (!isObject(raw)) throw new AppError("\u6A21\u677F\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...TEMPLATE_KEYS], "\u6A21\u677F");
  return {
    id: requiredField(raw, "id", "\u6A21\u677F", asStr),
    shape: parseShape(requiredField(raw, "shape", "\u6A21\u677F", (v) => v)),
    printing: parsePrinting(requiredField(raw, "printing", "\u6A21\u677F", (v) => v)),
    automatic: field(raw, "automatic", "\u6A21\u677F", asBool, false),
    printAheadDays: field(raw, "printAheadDays", "\u6A21\u677F", asInt, 7)
  };
}
function serializeTemplate(t) {
  return {
    id: t.id,
    shape: serializeShape(t.shape),
    printing: serializePrinting(t.printing),
    automatic: t.automatic,
    printAheadDays: t.printAheadDays
  };
}
function parsePrintRecord(raw) {
  if (!isObject(raw)) throw new AppError("\u5370\u5237\u8BB0\u5F55\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...PRINT_RECORD_KEYS], "\u5370\u5237\u8BB0\u5F55");
  return {
    templateId: requiredField(raw, "templateId", "\u5370\u5237\u8BB0\u5F55", asStr),
    date: field(
      raw,
      "date",
      "\u5370\u5237\u8BB0\u5F55",
      (v) => asOpt(v, "date", asStr),
      null
    )
  };
}
function serializePrintRecord(p) {
  return { templateId: p.templateId, date: p.date };
}
function templateRecurring(template) {
  return template.printing.kind === "weekly";
}
function templateTimes(template, date) {
  if (date === null || !validDate(date)) {
    throw new AppError("\u65E0\u6548\u7684\u5370\u5237\u65E5\u671F");
  }
  const printing = template.printing;
  if (printing.kind === "once") {
    if (printing.time !== null && date === null) {
      throw new AppError("\u5B9A\u65F6\u5B9E\u4F8B\u9700\u8981\u65E5\u671F");
    }
    return [printing.time];
  }
  if (printing.kind === "calendar") {
    const times2 = printing.slots.filter((s) => s.dates.includes(date)).map((s) => s.time);
    if (times2.length === 0) {
      throw new AppError("\u8BE5\u65E5\u671F\u4E0D\u5728\u65E5\u7A0B\u8868\u4E2D");
    }
    return times2;
  }
  const weekday = weekdayMonday(parseDate(date));
  const times = printing.slots.filter((s) => s.days.includes(weekday)).map((s) => s.time);
  if (times.length === 0) {
    throw new AppError("\u8BE5\u65E5\u671F\u4E0D\u5728\u672C\u5468\u5B89\u6392\u4E2D");
  }
  return times;
}
function templateInstance(template, date, time, at) {
  const task = {
    id: id(),
    templateId: template.id,
    recurring: templateRecurring(template),
    title: "",
    notes: "",
    projectId: null,
    habitId: null,
    dueDate: date,
    reminderTime: time,
    focusMinutes: null,
    scrapMinutes: 0,
    priority: 0,
    estimate: 1,
    reminderFired: false,
    reminderPending: false,
    reminderExpired: false,
    completed: false,
    completedAt: null,
    createdAt: at,
    tags: [],
    subtasks: []
  };
  copyShape(template.shape, task);
  return task;
}
function copyShape(shape, task) {
  task.title = shape.title;
  task.notes = shape.notes;
  task.projectId = shape.projectId;
  task.habitId = shape.habitId;
  task.focusMinutes = shape.focusMinutes;
  task.scrapMinutes = isHabit(task) ? 0 : shape.scrapMinutes;
  task.priority = shape.priority;
  task.estimate = shape.estimate;
  task.tags = [...shape.tags];
  task.subtasks = shape.subtasks.map((sub) => ({
    id: sub.id,
    title: sub.title,
    done: task.subtasks.some((old) => old.id === sub.id && old.done)
  }));
}
function validateTemplates(data) {
  if (data.templates.length > 5e3 || data.prints.length > 2e5) {
    throw new AppError("\u6A21\u677F\u6216\u5370\u5237\u8BB0\u5F55\u8D85\u51FA\u9650\u5236");
  }
  const ids = /* @__PURE__ */ new Set();
  for (const t of data.templates) {
    if (t.id.length === 0 || ids.has(t.id)) {
      throw new AppError("\u6A21\u677F ID \u91CD\u590D\u6216\u4E3A\u7A7A");
    }
    ids.add(t.id);
    const s = t.shape;
    if (t.printAheadDays > 90) {
      throw new AppError("\u9884\u5370\u5929\u6570\u9700\u4E3A 0\u201390 \u5929");
    }
    if (s.title.trim().length === 0 || Array.from(s.title).length > 200 || s.notes.length > 5e4 || s.priority > 3 || s.estimate < 1 || s.estimate > 99 || s.scrapMinutes > 10080 || s.focusMinutes !== null && (s.focusMinutes < 1 || s.focusMinutes > 180) || s.tags.length > 20 || s.tags.some((tag) => Array.from(tag).length > 40)) {
      throw new AppError("\u65E0\u6548\u7684\u6A21\u677F\u5F62\u72B6");
    }
    const subs = /* @__PURE__ */ new Set();
    if (s.subtasks.length > 200 || s.subtasks.some(
      (sub) => sub.id.length === 0 || subs.has(sub.id) || sub.title.trim().length === 0 || Array.from(sub.title).length > 200
    )) {
      throw new AppError("\u65E0\u6548\u7684\u6A21\u677F\u5B50\u4EFB\u52A1");
    }
    for (const sub of s.subtasks) subs.add(sub.id);
    if (s.projectId !== null && !data.projects.some((p) => p.id === s.projectId) || s.habitId !== null && !data.habits.some((h) => h.id === s.habitId)) {
      throw new AppError("\u6A21\u677F\u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u5BB9\u5668");
    }
    const printing = t.printing;
    if (printing.kind === "once") {
      if (printing.date === null || !validDate(printing.date) || printing.time !== null && !validTime(printing.time)) {
        throw new AppError("\u65E0\u6548\u7684\u4E00\u6B21\u5370\u5237\u65E5\u671F\u6216\u65F6\u95F4");
      }
      if (s.habitId !== null) {
        throw new AppError("\u4E60\u60EF\u6A21\u677F\u5FC5\u987B\u91CD\u590D\u5370\u5237");
      }
    } else if (printing.kind === "calendar") {
      if (printing.slots.length === 0 || printing.slots.length > 49 || s.habitId !== null) {
        throw new AppError("\u975E\u91CD\u590D\u65E5\u7A0B\u9700\u8981 1\u201349 \u4E2A\u65F6\u6BB5\uFF0C\u4E0D\u80FD\u5C5E\u4E8E\u4E60\u60EF\u7EC4");
      }
      const seen = /* @__PURE__ */ new Set();
      const times = /* @__PURE__ */ new Set();
      for (const slot of printing.slots) {
        const timeKey = slot.time ?? "null";
        if (slot.dates.length === 0 || slot.dates.length > 366 || slot.time !== null && !validTime(slot.time) || (times.has(timeKey) ? true : (times.add(timeKey), false)) || slot.dates.some((date) => {
          const key = `${date}|${timeKey}`;
          return !validDate(date) || (seen.has(key) ? true : (seen.add(key), false));
        })) {
          throw new AppError(
            "\u65E0\u6548\u6216\u91CD\u590D\u7684\u65E5\u7A0B\u65F6\u6BB5\uFF0C\u8BF7\u628A\u540C\u4E00\u5F00\u59CB\u65F6\u95F4\u7684\u65E5\u671F\u5408\u5E76"
          );
        }
      }
      if (seen.size > 366) {
        throw new AppError("\u4E00\u6B21\u65E5\u7A0B\u8868\u6700\u591A 366 \u9879");
      }
    } else {
      if (printing.slots.length === 0 || printing.slots.length > 49) {
        throw new AppError("\u6BCF\u5468\u5FAA\u73AF\u9700\u8981 1\u201349 \u4E2A\u65F6\u6BB5");
      }
      const seen = /* @__PURE__ */ new Set();
      for (const slot of printing.slots) {
        const unique = new Set(slot.days);
        if (slot.days.length === 0 || slot.days.length > 7 || unique.size !== slot.days.length || slot.days.some((d) => d < 1 || d > 7) || slot.time !== null && !validTime(slot.time) || s.habitId !== null && slot.time === null || slot.days.some((day) => seen.has(`${day}|${slot.time ?? "null"}`))) {
          throw new AppError("\u65E0\u6548\u6216\u91CD\u590D\u7684\u5468\u671F\u65F6\u6BB5");
        }
        for (const day of slot.days) seen.add(`${day}|${slot.time ?? "null"}`);
      }
      if (printing.slots.some((s2) => s2.time !== null) && printing.slots.some((s2) => s2.time === null)) {
        throw new AppError("\u4E00\u4E2A\u5468\u671F\u4E0D\u80FD\u6DF7\u7528\u5B9A\u65F6\u4E0E\u4E0D\u5B9A\u65F6\u5355\u5143");
      }
    }
  }
  const prints = /* @__PURE__ */ new Set();
  for (const p of data.prints) {
    if (!ids.has(p.templateId) || p.date === null || !validDate(p.date) || prints.has(`${p.templateId}|${p.date}`)) {
      throw new AppError("\u65E0\u6548\u6216\u91CD\u590D\u7684\u5370\u5237\u8BB0\u5F55");
    }
    prints.add(`${p.templateId}|${p.date}`);
  }
  if (data.tasks.some((t) => t.templateId !== null && !ids.has(t.templateId))) {
    throw new AppError("\u5B9E\u4F8B\u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u6A21\u677F");
  }
}
function printInstances(data, shape, printing, at) {
  if (printing.kind === "weekly") {
    throw new AppError("\u5FAA\u73AF\u89C4\u5219\u9700\u8981\u4FDD\u7559\u4E3A\u6A21\u677F");
  }
  const dates = printing.kind === "once" ? [printing.date] : [...new Set(printing.slots.flatMap((s) => s.dates))].sort();
  const templateId = id();
  data.templates.push({
    id: templateId,
    shape,
    printing,
    automatic: false,
    printAheadDays: 0
  });
  data.validate();
  printTemplate(data, templateId, dates, at);
  deleteTemplate(data, templateId);
}
function saveTemplate(data, template) {
  template.shape.title = template.shape.title.trim();
  if (template.shape.habitId === null && template.printing.kind === "weekly" && template.printing.slots.every((s) => s.time !== null)) {
    const existingHabit = data.templates.find((t) => t.id === template.id)?.shape.habitId ?? null;
    const hid = existingHabit ?? id();
    if (!data.habits.some((h) => h.id === hid)) {
      data.habits.push({
        id: hid,
        name: Array.from(template.shape.title).slice(0, 40).join("")
      });
    }
    template.shape.habitId = hid;
  }
  const index = data.templates.findIndex((t) => t.id === template.id);
  if (index >= 0) {
    data.templates[index] = template;
  } else {
    data.templates.push(template);
  }
}
function deleteTemplate(data, id2) {
  data.templates = data.templates.filter((t) => t.id !== id2);
  data.prints = data.prints.filter((p) => p.templateId !== id2);
  for (const task of data.tasks) {
    if (task.templateId === id2) task.templateId = null;
  }
}
function printTemplate(data, id2, dates, at) {
  if (dates.length === 0 || dates.length > 366) {
    throw new AppError("\u6BCF\u6B21\u5370\u5237\u9700\u8981 1\u2013366 \u4E2A\u65E5\u671F");
  }
  const templateIndex = data.templates.findIndex((t) => t.id === id2);
  if (templateIndex < 0) {
    throw new AppError("\u6A21\u677F\u4E0D\u5B58\u5728");
  }
  const template = data.templates[templateIndex];
  let resolved;
  if (template.printing.kind === "weekly") {
    const days = [
      ...new Set(template.printing.slots.flatMap((s) => s.days))
    ].sort((a, b) => a - b);
    const expanded = /* @__PURE__ */ new Set();
    for (const date of dates) {
      if (date === null) throw new AppError("\u5468\u671F\u5370\u5237\u9700\u8981\u65E5\u671F");
      if (!validDate(date)) throw new AppError("\u65E0\u6548\u7684\u5468\u671F\u65E5\u671F");
      const parsed = parseDate(date);
      const monday = weekStart(parsed);
      for (const day of days) {
        const d = addDays(monday, day - 1);
        expanded.add(
          `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`
        );
      }
    }
    if (expanded.size > 366) {
      throw new AppError("\u4E00\u6B21\u5370\u5237\u8303\u56F4\u8FC7\u5927\uFF0C\u8BF7\u62C6\u5206\u5468\u671F");
    }
    resolved = [...expanded].sort();
  } else {
    resolved = [...dates];
  }
  const batches = resolved.map((date) => ({
    date,
    times: templateTimes(template, date)
  }));
  const printedDates = new Set(
    data.prints.filter((p) => p.templateId === id2).map((p) => p.date)
  );
  for (const { date, times } of batches) {
    if (printedDates.has(date)) continue;
    let printed = false;
    for (const time of times) {
      const task = templateInstance(template, date, time, at);
      if (printingExpired(data, task, at)) continue;
      data.tasks.push(task);
      printed = true;
    }
    if (printed) {
      printedDates.add(date);
      data.prints.push({ templateId: id2, date });
    }
  }
}
function printingExpired(data, task, at) {
  if (task.reminderTime === null) return false;
  if (task.dueDate === null) return false;
  const today = dateAt(at);
  if (task.dueDate < today) return true;
  if (task.dueDate > today) return false;
  const start = minutesOf(task.reminderTime);
  const grace = isHabit(task) ? 0 : task.scrapMinutes;
  const end = start + windowMinutes(task, data.settings) + grace;
  return secondsOfDay(at) >= end * 60;
}
function syncTemplate(data, id2) {
  const template = data.templates.find((t) => t.id === id2);
  if (template === void 0) {
    throw new AppError("\u6A21\u677F\u4E0D\u5B58\u5728");
  }
  const voidIds = new Set(
    data.tasks.filter((t) => taskIsVoid(t)).map((t) => t.id)
  );
  for (const task of data.tasks) {
    if (!voidIds.has(task.id) && !task.completed && task.templateId === id2) {
      const shape = { ...template.shape };
      shape.habitId = task.habitId;
      copyShape(shape, task);
    }
  }
}
function taskIsVoid(task) {
  return !task.completed && task.reminderTime !== null && task.reminderExpired;
}
function materializeTemplates(data, at) {
  const today = parseDate(dateAt(at));
  const printed = new Set(
    data.prints.map((p) => `${p.templateId}|${p.date ?? "null"}`)
  );
  const requests = [];
  for (const template of data.templates) {
    if (!template.automatic) continue;
    const end = addDays(today, template.printAheadDays);
    const endStr = `${end.year}-${String(end.month).padStart(2, "0")}-${String(end.day).padStart(2, "0")}`;
    let dates = [];
    const printing = template.printing;
    if (printing.kind === "once") {
      if (printing.date !== null && printing.date <= endStr)
        dates = [printing.date];
    } else if (printing.kind === "calendar") {
      dates = [
        ...new Set(
          printing.slots.flatMap((s) => s.dates).filter((d) => d <= endStr)
        )
      ].sort();
    } else {
      const days = [...new Set(printing.slots.flatMap((s) => s.days))].sort(
        (a, b) => a - b
      );
      let monday = weekStart(today);
      const last = weekStart(end);
      while (compareIso(monday) <= compareIso(last)) {
        for (const day of days) {
          const d = addDays(monday, day - 1);
          dates.push(
            `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`
          );
        }
        monday = addDays(monday, 7);
      }
    }
    const missing = dates.filter((d) => !printed.has(`${template.id}|${d}`));
    if (missing.length > 0) {
      requests.push({ id: template.id, dates: missing });
    }
  }
  let changed = false;
  for (const { id: templateId, dates } of requests) {
    const candidate = clone(data);
    try {
      printTemplate(candidate, templateId, dates, at);
      if (candidate.tasks.length !== data.tasks.length) {
        candidate.validate();
        replaceAppData(data, candidate);
        changed = true;
      }
    } catch {
    }
  }
  return changed;
}
function compareIso(date) {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}
function replaceAppData(target, source) {
  for (const key of Object.keys(source)) {
    target[key] = source[key];
  }
}
function fromTask(task, repeat, at) {
  const date = task.dueDate ?? dateAt(at);
  const weekday = (() => {
    const parsed = parseDate(date);
    return parsed === null ? 1 : weekdayMonday(parsed);
  })();
  const days = repeat === "daily" ? [1, 2, 3, 4, 5, 6, 7] : repeat === "weekdays" ? [1, 2, 3, 4, 5] : [weekday];
  return {
    id: id(),
    automatic: true,
    printAheadDays: 0,
    printing: { kind: "weekly", slots: [{ days, time: task.reminderTime }] },
    shape: {
      title: task.title,
      notes: task.notes,
      projectId: task.projectId,
      habitId: task.habitId,
      focusMinutes: task.focusMinutes,
      scrapMinutes: task.scrapMinutes,
      priority: task.priority,
      estimate: task.estimate,
      tags: [...task.tags],
      subtasks: task.subtasks.map((s) => ({ id: s.id, title: s.title }))
    }
  };
}

// packages/core/src/learning.ts
function parseCompletedStudyTask(raw) {
  if (!isObject(raw)) throw new AppError("\u5DF2\u5B8C\u6210\u5B66\u4E60\u4EFB\u52A1\u5FEB\u7167\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(
    raw,
    ["id", "projectId", "title", "notes", "topics", "completedAt"],
    "\u5DF2\u5B8C\u6210\u5B66\u4E60\u4EFB\u52A1\u5FEB\u7167"
  );
  return {
    id: requiredField(raw, "id", "\u5DF2\u5B8C\u6210\u5B66\u4E60\u4EFB\u52A1\u5FEB\u7167", asStr),
    projectId: requiredField(raw, "projectId", "\u5DF2\u5B8C\u6210\u5B66\u4E60\u4EFB\u52A1\u5FEB\u7167", asStr),
    title: requiredField(raw, "title", "\u5DF2\u5B8C\u6210\u5B66\u4E60\u4EFB\u52A1\u5FEB\u7167", asStr),
    notes: requiredField(raw, "notes", "\u5DF2\u5B8C\u6210\u5B66\u4E60\u4EFB\u52A1\u5FEB\u7167", asStr),
    topics: field(
      raw,
      "topics",
      "\u5DF2\u5B8C\u6210\u5B66\u4E60\u4EFB\u52A1\u5FEB\u7167",
      (v) => asArray(v, "topics").map((x) => asStr(x, "\u77E5\u8BC6\u70B9")),
      []
    ),
    completedAt: requiredField(raw, "completedAt", "\u5DF2\u5B8C\u6210\u5B66\u4E60\u4EFB\u52A1\u5FEB\u7167", asInt)
  };
}
function serializeCompletedStudyTask(t) {
  return {
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    notes: t.notes,
    topics: t.topics,
    completedAt: t.completedAt
  };
}
function text(s, max) {
  return s.trim().length > 0 && Array.from(s).length <= max;
}
function validateLearning(data) {
  const e = data.education;
  ensure(
    e.progress.length + e.completedTasks.length + e.corrections.length <= 1e5,
    "\u5B66\u4E60\u8BC1\u636E\u6570\u91CF\u8D85\u51FA\u9650\u5236"
  );
  const ids = /* @__PURE__ */ new Set();
  for (const task of e.completedTasks) {
    ensure(
      !ids.has(`task|${task.id}`) && task.id.length > 0 && data.projects.some((p) => p.id === task.projectId) && text(task.title, 200) && task.notes.length <= 5e4 && task.topics.length <= 20,
      "\u65E0\u6548\u7684\u5DF2\u5B8C\u6210\u5B66\u4E60\u4EFB\u52A1\u5FEB\u7167"
    );
    ids.add(`task|${task.id}`);
  }
  for (const record of e.progress) {
    ensure(
      !ids.has(`progress|${record.id}`) && record.id.length > 0 && data.projects.some((p) => p.id === record.projectId) && text(record.topic, 200) && text(record.position, 2e3) && text(record.evidence, 8e3) && Array.from(record.nextAction).length <= 2e3,
      "\u5B66\u4E60\u8FDB\u5EA6\u9700\u8981\u9879\u76EE\u3001\u77E5\u8BC6\u70B9\u3001\u5B9E\u9645\u4F4D\u7F6E\u548C\u4F9D\u636E"
    );
    ids.add(`progress|${record.id}`);
  }
  for (const correction of e.corrections) {
    const grade = require2(e.grades.find(
      (g) => g.id === correction.gradeId
    ), "\u8BA2\u6B63\u7F3A\u5C11\u6279\u6539\u8BB0\u5F55");
    const assessment = require2((() => {
      const sub = e.submissions.find((s) => s.id === grade.submissionId);
      return sub === void 0 ? void 0 : e.assessments.find((a) => a.id === sub.assessmentId);
    })(), "\u8BA2\u6B63\u7F3A\u5C11\u8BD5\u9898");
    ensure(
      !ids.has(`correction|${correction.id}`) && correction.id.length > 0 && assessment.questions.some((q) => q.id === correction.questionId) && Array.from(correction.explanation).length <= 8e3 && (text(correction.explanation, 8e3) || correction.resourceIds.length > 0) && correction.resourceIds.every(
        (id2) => e.resources.some(
          (r) => r.id === id2 && r.projectId === assessment.projectId
        )
      ) && correction.accepted !== null === (correction.reviewedAt !== null) && (correction.reviewedAt === null || correction.reviewedAt >= correction.submittedAt && text(correction.feedback, 8e3)),
      "\u8BA2\u6B63\u9700\u8981\u539F\u9898\u3001\u89E3\u91CA\u6216\u672C\u9879\u76EE\u9644\u4EF6\uFF1B\u68C0\u67E5\u7ED3\u679C\u5FC5\u987B\u6709\u53CD\u9988"
    );
    ids.add(`correction|${correction.id}`);
  }
}
function validateLearningTransition(before, after) {
  for (const record of before.progress) {
    ensure(
      after.progress.some((r) => r.id === record.id),
      "\u8FDB\u5EA6\u5386\u53F2\u4E0D\u80FD\u5220\u9664\uFF0C\u8BF7\u65B0\u589E\u66F4\u6B63\u8BB0\u5F55"
    );
    const next = after.progress.find((r) => r.id === record.id);
    if (next !== void 0) {
      const old = { ...record };
      old.confirmed = next.confirmed;
      ensure(progressEquals(old, next), "\u8FDB\u5EA6\u5386\u53F2\u4E0D\u53EF\u6539\u5199\uFF0C\u8BF7\u65B0\u589E\u4E00\u6761\u66F4\u6B63\u8BB0\u5F55");
    }
  }
  for (const record of before.completedTasks) {
    ensure(
      after.completedTasks.find((r) => r.id === record.id) !== void 0 && completedTaskEquals(
        after.completedTasks.find((r) => r.id === record.id),
        record
      ),
      "\u5DF2\u5B8C\u6210\u4EFB\u52A1\u7684\u5B66\u4E60\u5185\u5BB9\u5FEB\u7167\u4E0D\u53EF\u6539\u5199"
    );
  }
  for (const record of before.corrections) {
    ensure(
      after.corrections.some((r) => r.id === record.id),
      "\u8BA2\u6B63\u5386\u53F2\u4E0D\u80FD\u5220\u9664"
    );
    const next = after.corrections.find((r) => r.id === record.id);
    if (next !== void 0) {
      const old = { ...record, resourceIds: [...record.resourceIds] };
      if (old.reviewedAt === null) {
        old.accepted = next.accepted;
        old.feedback = next.feedback;
        old.reviewedAt = next.reviewedAt;
      }
      ensure(
        correctionEquals(old, next),
        "\u8BA2\u6B63\u4E0E\u68C0\u67E5\u5386\u53F2\u4E0D\u53EF\u6539\u5199\uFF0C\u8BF7\u65B0\u589E\u4E00\u6B21\u8BA2\u6B63"
      );
    }
  }
}
function progressEquals(a, b) {
  return a.id === b.id && a.projectId === b.projectId && a.topic === b.topic && a.position === b.position && a.state === b.state && a.evidence === b.evidence && a.nextAction === b.nextAction && a.source === b.source && a.confirmed === b.confirmed && a.recordedAt === b.recordedAt;
}
function completedTaskEquals(a, b) {
  return a.id === b.id && a.projectId === b.projectId && a.title === b.title && a.notes === b.notes && a.topics.length === b.topics.length && a.topics.every((t, i) => b.topics[i] === t) && a.completedAt === b.completedAt;
}
function correctionEquals(a, b) {
  return a.id === b.id && a.gradeId === b.gradeId && a.questionId === b.questionId && a.explanation === b.explanation && a.resourceIds.length === b.resourceIds.length && a.resourceIds.every((r, i) => b.resourceIds[i] === r) && a.submittedAt === b.submittedAt && a.accepted === b.accepted && a.feedback === b.feedback && a.reviewedAt === b.reviewedAt;
}
function buildSummaryIndex(e) {
  const index = {
    submissions: /* @__PURE__ */ new Map(),
    grades: /* @__PURE__ */ new Map(),
    assessmentGrades: /* @__PURE__ */ new Map(),
    accepted: /* @__PURE__ */ new Set(),
    retests: /* @__PURE__ */ new Map()
  };
  const parents = /* @__PURE__ */ new Map();
  for (const s of e.submissions) {
    parents.set(s.id, s.assessmentId);
    const old = index.submissions.get(s.assessmentId);
    if (old === void 0 || s.submittedAt >= old.submittedAt) {
      index.submissions.set(s.assessmentId, s);
    }
  }
  for (const g of e.grades) {
    const old = index.grades.get(g.submissionId);
    if (old === void 0 || g.gradedAt >= old.gradedAt) {
      index.grades.set(g.submissionId, g);
    }
    const assessment = parents.get(g.submissionId);
    if (assessment !== void 0) {
      const oldA = index.assessmentGrades.get(assessment);
      if (oldA === void 0 || g.gradedAt >= oldA.gradedAt) {
        index.assessmentGrades.set(assessment, g);
      }
    }
  }
  for (const c of e.corrections) {
    if (c.accepted === true) {
      index.accepted.add(`${c.gradeId}|${c.questionId}`);
    }
  }
  for (const a of e.assessments) {
    if (a.retestOfGradeId !== null) {
      const list = index.retests.get(a.retestOfGradeId) ?? [];
      list.push(a);
      index.retests.set(a.retestOfGradeId, list);
    }
  }
  return index;
}
function assessmentSummary(index, a, at) {
  const submission = index.submissions.get(a.id) ?? null;
  const grade = submission !== null ? index.grades.get(submission.id) ?? null : null;
  const status = (() => {
    if (grade !== null) {
      if (grade.needsReview) return "needsReview";
      if (grade.errors.some(
        (error) => !index.accepted.has(`${grade.id}|${error.questionId}`)
      )) {
        return "correctionDue";
      }
      return "graded";
    }
    if (submission !== null) return "submitted";
    if (a.kind !== "homework" && a.startedAt === null && dateAt(at) > dateAt(a.startsAt)) {
      return "missed";
    }
    if (a.kind !== "homework" && a.startedAt !== null && a.stoppedAt === null && at < examDeadline(a)) {
      return "inProgress";
    }
    if (a.kind !== "homework" && a.startedAt !== null && (a.stoppedAt !== null || at >= examDeadline(a))) {
      return "awaitingSubmission";
    }
    if (a.kind === "homework" && at >= a.endsAt) return "overdue";
    if (at < a.startsAt || a.kind !== "homework" && a.startedAt === null)
      return "upcoming";
    return "awaitingSubmission";
  })();
  return {
    id: a.id,
    title: a.title,
    kind: a.kind,
    status,
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    submissionId: submission?.id ?? null,
    submittedAt: submission?.submittedAt ?? null,
    unfinished: submission !== null && submission.unfinished,
    late: a.kind === "homework" && submission !== null && submission.submittedAt > a.endsAt,
    gradeId: grade?.id ?? null,
    gradedAt: grade?.gradedAt ?? null,
    score: grade !== null && !grade.needsReview ? grade.awards.reduce((n, p) => n + p.awarded, 0) : null,
    total: a.questions.reduce(
      (n, q) => n + q.scoring.reduce((m, p) => m + p.points, 0),
      0
    ),
    needsReview: grade !== null && grade.needsReview
  };
}
function examDeadline(a) {
  return a.startedAt === null ? a.endsAt : a.startedAt + (a.endsAt - a.startsAt);
}
function summaries(data, at) {
  const e = data.education;
  const index = buildSummaryIndex(e);
  const out = [];
  for (const project of data.projects.filter(
    (p) => e.projects.some((s) => s.projectId === p.id) || e.progress.some((r) => r.projectId === p.id)
  )) {
    const progress = e.progress.filter((r) => r.projectId === project.id).slice().sort((a, b) => a.recordedAt - b.recordedAt);
    const topics = /* @__PURE__ */ new Set();
    const latest = progress.slice().reverse().filter((r) => {
      if (topics.has(r.topic)) return false;
      topics.add(r.topic);
      return true;
    });
    const assessments = e.assessments.filter((a) => a.projectId === project.id).map((a) => assessmentSummary(index, a, at)).sort((a, b) => b.startsAt - a.startsAt);
    const retests = [];
    const grades = e.assessments.filter((a) => a.projectId === project.id).map((a) => index.assessmentGrades.get(a.id)).filter((g) => g !== void 0);
    for (const grade of grades) {
      const attempts = (index.retests.get(grade.id) ?? []).map(
        (a) => assessmentSummary(index, a, at)
      );
      for (const error of grade.errors) {
        retests.push({
          gradeId: grade.id,
          questionId: error.questionId,
          cause: error.cause,
          confirmed: error.confirmed,
          retestDate: error.retestDate,
          nextCheck: error.nextCheck,
          correctionAccepted: index.accepted.has(
            `${grade.id}|${error.questionId}`
          ),
          attempts
        });
      }
    }
    retests.sort(
      (a, b) => String(a["retestDate"]).localeCompare(String(b["retestDate"]))
    );
    const recentTasks = e.completedTasks.slice().reverse().filter((t) => t.projectId === project.id).slice(0, 5);
    const lessons = e.lessons.filter((l) => l.projectId === project.id);
    const lastLesson = lessons.filter((l) => l.attended).reduce(
      (best, l) => best === null || l.startsAt > best.startsAt ? l : best,
      null
    );
    const latestReview = e.reviews.filter((r) => r.projectId === project.id).reduce(
      (best, r) => best === null || r.date > best.date ? r : best,
      null
    );
    const reviewTime = latestReview === null ? null : atLocalDateString(latestReview.date);
    const updated = Math.max(
      ...[
        ...latest.map((r) => r.recordedAt),
        ...recentTasks.map((r) => r.completedAt),
        ...lastLesson !== null ? [lastLesson.startsAt] : [],
        ...reviewTime !== null ? [reviewTime] : [],
        ...assessments.filter((a) => typeof a["submittedAt"] === "number").map((a) => a["submittedAt"]),
        ...assessments.filter((a) => typeof a["gradedAt"] === "number").map((a) => a["gradedAt"]),
        ...e.corrections.filter((c) => assessments.some((a) => a["gradeId"] === c.gradeId)).map((c) => c.reviewedAt ?? c.submittedAt)
      ].filter((n) => typeof n === "number"),
      -Infinity
    );
    const taskIds = /* @__PURE__ */ new Set([
      ...data.tasks.filter((t) => t.projectId === project.id).map((t) => t.id),
      ...e.completedTasks.filter((t) => t.projectId === project.id).map((t) => t.id)
    ]);
    const actualSeconds = data.sessions.filter(
      (s) => s.source === "timer" && s.endedAt >= at - 7 * 86400 && s.endedAt <= at && s.taskId !== null && taskIds.has(s.taskId)
    ).reduce((n, s) => n + s.durationSecs, 0);
    const assessmentCount = assessments.length;
    const retestCount = retests.length;
    out.push({
      projectId: project.id,
      projectName: project.name,
      updatedAt: Number.isFinite(updated) ? updated : null,
      progress: latest.slice(0, 12),
      progressCount: e.progress.filter((r) => r.projectId === project.id).length,
      recentCompletedTasks: recentTasks,
      lastAttendedLesson: lastLesson === null ? null : {
        id: lastLesson.id,
        title: lastLesson.title,
        progress: lastLesson.progress,
        state: lastLesson.state
      },
      lessons: {
        planned: lessons.filter((l) => l.state === "planned").length,
        attended: lessons.filter((l) => l.attended).length,
        missed: lessons.filter((l) => l.state === "missed").length
      },
      actualFocusSeconds7d: actualSeconds,
      assessments: assessments.slice(0, 20),
      assessmentCount,
      retests: retests.slice(0, 20),
      retestCount,
      latestReview,
      pendingEvents: e.events.filter(
        (r) => r.projectId === project.id && r.state !== "done"
      ).length,
      note: "\u8BA1\u65F6\u4E0E\u4EFB\u52A1\u5B8C\u6210\u53EA\u8BF4\u660E\u6295\u5165\u6216\u81EA\u62A5\u5B8C\u6210\uFF1B\u638C\u63E1\u987B\u67E5\u770B\u7B54\u5377\u3001\u6279\u6539\u4E0E\u72EC\u7ACB\u590D\u6D4B\u3002\u7A7A\u8BB0\u5F55\u8868\u793A\u672A\u77E5\u3002"
    });
  }
  return out;
}

// packages/core/src/education.ts
var COMMAND_KEYS = {
  saveProject: ["op", "project"],
  saveResource: ["op", "resource"],
  saveResources: ["op", "resources"],
  removeResources: ["op", "ids"],
  saveSemester: ["op", "semester"],
  saveLesson: ["op", "lesson"],
  setLessonResources: ["op", "id", "resourceIds"],
  attendLesson: ["op", "id", "progress"],
  publishAssessment: ["op", "assessment"],
  confirmPrinted: ["op", "id"],
  startExam: ["op", "id"],
  endExam: ["op", "id"],
  submit: ["op", "submission"],
  recordQuestionTimes: ["op", "id", "questionTimes"],
  grade: ["op", "grade"],
  saveReview: ["op", "review"],
  claimEvent: ["op", "id"],
  finishEvent: ["op", "id"],
  retryEvent: ["op", "id"],
  recordProgress: ["op", "record"],
  confirmProgress: ["op", "id"],
  submitCorrection: ["op", "correction"],
  reviewCorrection: ["op", "id", "accepted", "feedback"]
};
function parseCommand(raw) {
  if (!isObject(raw)) throw new AppError("\u6559\u5B66\u547D\u4EE4\u5FC5\u987B\u662F\u5BF9\u8C61");
  const op = oneOf(
    requiredField(raw, "op", "\u6559\u5B66\u547D\u4EE4", (v) => v),
    "\u6559\u5B66\u547D\u4EE4 op",
    Object.keys(COMMAND_KEYS)
  );
  rejectUnknown(raw, COMMAND_KEYS[op], "\u6559\u5B66\u547D\u4EE4");
  switch (op) {
    case "saveProject":
      return {
        op,
        project: parseProjectStudy(
          requiredField(raw, "project", "\u6559\u5B66\u547D\u4EE4", (v) => v)
        )
      };
    case "saveResource":
      return {
        op,
        resource: parseResource(
          requiredField(raw, "resource", "\u6559\u5B66\u547D\u4EE4", (v) => v)
        )
      };
    case "saveResources": {
      const list = asArray(
        requiredField(raw, "resources", "\u6559\u5B66\u547D\u4EE4", (v) => v),
        "resources"
      );
      ensure(
        list.length > 0 && list.length <= 5e3,
        "\u6279\u91CF\u767B\u8BB0\u9700\u8981 1\u20135000 \u6761\u8D44\u6E90"
      );
      return { op, resources: list.map((item) => parseResource(item)) };
    }
    case "removeResources":
      return {
        op,
        ids: asArray(
          requiredField(raw, "ids", "\u6559\u5B66\u547D\u4EE4", (v) => v),
          "ids"
        ).map((x) => asStr(x, "\u8D44\u6E90 ID"))
      };
    case "saveSemester":
      return {
        op,
        semester: parseSemester(
          requiredField(raw, "semester", "\u6559\u5B66\u547D\u4EE4", (v) => v)
        )
      };
    case "saveLesson":
      return {
        op,
        lesson: parseLesson(requiredField(raw, "lesson", "\u6559\u5B66\u547D\u4EE4", (v) => v))
      };
    case "setLessonResources":
      return {
        op,
        id: requiredField(raw, "id", "\u6559\u5B66\u547D\u4EE4", asStr),
        resourceIds: asArray(
          requiredField(raw, "resourceIds", "\u6559\u5B66\u547D\u4EE4", (v) => v),
          "resourceIds"
        ).map((x) => asStr(x, "\u8D44\u6E90 ID"))
      };
    case "attendLesson":
      return {
        op,
        id: requiredField(raw, "id", "\u6559\u5B66\u547D\u4EE4", asStr),
        progress: requiredField(raw, "progress", "\u6559\u5B66\u547D\u4EE4", asStr)
      };
    case "publishAssessment":
      return {
        op,
        assessment: parseAssessment(
          requiredField(raw, "assessment", "\u6559\u5B66\u547D\u4EE4", (v) => v)
        )
      };
    case "confirmPrinted":
    case "startExam":
    case "endExam":
    case "claimEvent":
    case "finishEvent":
    case "retryEvent":
    case "confirmProgress":
      return { op, id: requiredField(raw, "id", "\u6559\u5B66\u547D\u4EE4", asStr) };
    case "submit":
      return {
        op,
        submission: parseSubmission(
          requiredField(raw, "submission", "\u6559\u5B66\u547D\u4EE4", (v) => v)
        )
      };
    case "recordQuestionTimes":
      return {
        op,
        id: requiredField(raw, "id", "\u6559\u5B66\u547D\u4EE4", asStr),
        questionTimes: asArray(
          requiredField(raw, "questionTimes", "\u6559\u5B66\u547D\u4EE4", (v) => v),
          "questionTimes"
        ).map(parseQuestionTime)
      };
    case "grade":
      return {
        op,
        grade: parseGrade(requiredField(raw, "grade", "\u6559\u5B66\u547D\u4EE4", (v) => v))
      };
    case "saveReview":
      return {
        op,
        review: parseReview(requiredField(raw, "review", "\u6559\u5B66\u547D\u4EE4", (v) => v))
      };
    case "recordProgress":
      return {
        op,
        record: parseProgressRecord(
          requiredField(raw, "record", "\u6559\u5B66\u547D\u4EE4", (v) => v)
        )
      };
    case "submitCorrection":
      return {
        op,
        correction: parseCorrection(
          requiredField(raw, "correction", "\u6559\u5B66\u547D\u4EE4", (v) => v)
        )
      };
    case "reviewCorrection":
      return {
        op,
        id: requiredField(raw, "id", "\u6559\u5B66\u547D\u4EE4", asStr),
        accepted: requiredField(raw, "accepted", "\u6559\u5B66\u547D\u4EE4", asBool),
        feedback: requiredField(raw, "feedback", "\u6559\u5B66\u547D\u4EE4", asStr)
      };
    default:
      throw new AppError(`\u6559\u5B66\u547D\u4EE4\u53D6\u503C\u65E0\u6548\uFF1A${op}`);
  }
}
function assistantOnly(command) {
  return [
    "saveSemester",
    "saveLesson",
    "publishAssessment",
    "grade",
    "recordQuestionTimes",
    "saveReview",
    "finishEvent",
    "claimEvent",
    "reviewCorrection"
  ].includes(command.op);
}
function parseProjectStudy(raw) {
  if (!isObject(raw)) throw new AppError("\u6559\u5B66\u9879\u76EE\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(
    raw,
    [
      "projectId",
      "directory",
      "examMode",
      "visionId",
      "target",
      "examDate",
      "syllabusId",
      "pastPaperIds",
      "mockPaperIds"
    ],
    "\u6559\u5B66\u9879\u76EE"
  );
  return {
    projectId: requiredField(raw, "projectId", "\u6559\u5B66\u9879\u76EE", asStr),
    directory: requiredField(raw, "directory", "\u6559\u5B66\u9879\u76EE", asStr),
    examMode: requiredField(raw, "examMode", "\u6559\u5B66\u9879\u76EE", asBool),
    visionId: field(
      raw,
      "visionId",
      "\u6559\u5B66\u9879\u76EE",
      (v) => asOpt(v, "visionId", asStr),
      null
    ),
    target: requiredField(raw, "target", "\u6559\u5B66\u9879\u76EE", asStr),
    examDate: field(
      raw,
      "examDate",
      "\u6559\u5B66\u9879\u76EE",
      (v) => asOpt(v, "examDate", asStr),
      null
    ),
    syllabusId: field(
      raw,
      "syllabusId",
      "\u6559\u5B66\u9879\u76EE",
      (v) => asOpt(v, "syllabusId", asStr),
      null
    ),
    pastPaperIds: field(
      raw,
      "pastPaperIds",
      "\u6559\u5B66\u9879\u76EE",
      (v) => asArray(v, "pastPaperIds").map((x) => asStr(x, "\u771F\u9898 ID")),
      []
    ),
    mockPaperIds: field(
      raw,
      "mockPaperIds",
      "\u6559\u5B66\u9879\u76EE",
      (v) => asArray(v, "mockPaperIds").map((x) => asStr(x, "\u6A21\u62DF\u9898 ID")),
      []
    )
  };
}
function serializeProjectStudy(p) {
  return {
    projectId: p.projectId,
    directory: p.directory,
    examMode: p.examMode,
    visionId: p.visionId,
    target: p.target,
    examDate: p.examDate,
    syllabusId: p.syllabusId,
    pastPaperIds: p.pastPaperIds,
    mockPaperIds: p.mockPaperIds
  };
}
function parseResource(raw) {
  if (!isObject(raw)) throw new AppError("\u8D44\u6E90\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(
    raw,
    ["id", "projectId", "title", "kind", "path", "source", "edition", "topics"],
    "\u8D44\u6E90"
  );
  return {
    id: requiredField(raw, "id", "\u8D44\u6E90", asStr),
    projectId: requiredField(raw, "projectId", "\u8D44\u6E90", asStr),
    title: requiredField(raw, "title", "\u8D44\u6E90", asStr),
    kind: oneOf(
      requiredField(raw, "kind", "\u8D44\u6E90", (v) => v),
      "\u8D44\u6E90 kind",
      [
        "syllabus",
        "course",
        "book",
        "pastPaper",
        "mockPaper",
        "reference",
        "attachment",
        "answerSheet"
      ]
    ),
    path: requiredField(raw, "path", "\u8D44\u6E90", asStr),
    source: requiredField(raw, "source", "\u8D44\u6E90", asStr),
    edition: requiredField(raw, "edition", "\u8D44\u6E90", asStr),
    topics: field(
      raw,
      "topics",
      "\u8D44\u6E90",
      (v) => asArray(v, "topics").map((x) => asStr(x, "\u77E5\u8BC6\u70B9")),
      []
    )
  };
}
function serializeResource(r) {
  return {
    id: r.id,
    projectId: r.projectId,
    title: r.title,
    kind: r.kind,
    path: r.path,
    source: r.source,
    edition: r.edition,
    topics: r.topics
  };
}
function parseMilestone(raw) {
  if (!isObject(raw)) throw new AppError("\u9636\u6BB5\u8FDB\u5EA6\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(
    raw,
    ["week", "topics", "resourceIds", "objective", "lessonCount"],
    "\u9636\u6BB5\u8FDB\u5EA6"
  );
  return {
    week: requiredField(raw, "week", "\u9636\u6BB5\u8FDB\u5EA6", asInt),
    topics: field(
      raw,
      "topics",
      "\u9636\u6BB5\u8FDB\u5EA6",
      (v) => asArray(v, "topics").map((x) => asStr(x, "\u77E5\u8BC6\u70B9")),
      []
    ),
    resourceIds: field(
      raw,
      "resourceIds",
      "\u9636\u6BB5\u8FDB\u5EA6",
      (v) => asArray(v, "resourceIds").map((x) => asStr(x, "\u8D44\u6E90 ID")),
      []
    ),
    objective: requiredField(raw, "objective", "\u9636\u6BB5\u8FDB\u5EA6", asStr),
    lessonCount: requiredField(raw, "lessonCount", "\u9636\u6BB5\u8FDB\u5EA6", asInt)
  };
}
function serializeMilestone(m) {
  return {
    week: m.week,
    topics: m.topics,
    resourceIds: m.resourceIds,
    objective: m.objective,
    lessonCount: m.lessonCount
  };
}
function parseSemester(raw) {
  if (!isObject(raw)) throw new AppError("\u5B66\u671F\u8BA1\u5212\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(
    raw,
    [
      "id",
      "projectId",
      "title",
      "startDate",
      "endDate",
      "revision",
      "baseline",
      "evidence",
      "rationale",
      "milestones"
    ],
    "\u5B66\u671F\u8BA1\u5212"
  );
  return {
    id: requiredField(raw, "id", "\u5B66\u671F\u8BA1\u5212", asStr),
    projectId: requiredField(raw, "projectId", "\u5B66\u671F\u8BA1\u5212", asStr),
    title: requiredField(raw, "title", "\u5B66\u671F\u8BA1\u5212", asStr),
    startDate: requiredField(raw, "startDate", "\u5B66\u671F\u8BA1\u5212", asStr),
    endDate: requiredField(raw, "endDate", "\u5B66\u671F\u8BA1\u5212", asStr),
    revision: requiredField(raw, "revision", "\u5B66\u671F\u8BA1\u5212", asInt),
    baseline: requiredField(raw, "baseline", "\u5B66\u671F\u8BA1\u5212", asStr),
    evidence: field(
      raw,
      "evidence",
      "\u5B66\u671F\u8BA1\u5212",
      (v) => asArray(v, "evidence").map((x) => asStr(x, "\u4F9D\u636E")),
      []
    ),
    rationale: requiredField(raw, "rationale", "\u5B66\u671F\u8BA1\u5212", asStr),
    milestones: requiredField(
      raw,
      "milestones",
      "\u5B66\u671F\u8BA1\u5212",
      (v) => asArray(v, "milestones").map(parseMilestone)
    )
  };
}
function serializeSemester(s) {
  return {
    id: s.id,
    projectId: s.projectId,
    title: s.title,
    startDate: s.startDate,
    endDate: s.endDate,
    revision: s.revision,
    baseline: s.baseline,
    evidence: s.evidence,
    rationale: s.rationale,
    milestones: s.milestones.map(serializeMilestone)
  };
}
function parseLesson(raw) {
  if (!isObject(raw)) throw new AppError("\u8BFE\u7A0B\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(
    raw,
    [
      "id",
      "projectId",
      "semesterId",
      "semesterRevision",
      "title",
      "topics",
      "resourceIds",
      "startsAt",
      "endsAt",
      "aiEnabled",
      "attended",
      "progress",
      "state"
    ],
    "\u8BFE\u7A0B"
  );
  return {
    id: requiredField(raw, "id", "\u8BFE\u7A0B", asStr),
    projectId: requiredField(raw, "projectId", "\u8BFE\u7A0B", asStr),
    semesterId: requiredField(raw, "semesterId", "\u8BFE\u7A0B", asStr),
    semesterRevision: field(raw, "semesterRevision", "\u8BFE\u7A0B", asInt, 1),
    title: requiredField(raw, "title", "\u8BFE\u7A0B", asStr),
    topics: field(
      raw,
      "topics",
      "\u8BFE\u7A0B",
      (v) => asArray(v, "topics").map((x) => asStr(x, "\u77E5\u8BC6\u70B9")),
      []
    ),
    resourceIds: field(
      raw,
      "resourceIds",
      "\u8BFE\u7A0B",
      (v) => asArray(v, "resourceIds").map((x) => asStr(x, "\u8D44\u6E90 ID")),
      []
    ),
    startsAt: requiredField(raw, "startsAt", "\u8BFE\u7A0B", asInt),
    endsAt: requiredField(raw, "endsAt", "\u8BFE\u7A0B", asInt),
    aiEnabled: requiredField(raw, "aiEnabled", "\u8BFE\u7A0B", asBool),
    attended: requiredField(raw, "attended", "\u8BFE\u7A0B", asBool),
    progress: requiredField(raw, "progress", "\u8BFE\u7A0B", asStr),
    state: oneOf(
      requiredField(raw, "state", "\u8BFE\u7A0B", (v) => v),
      "\u8BFE\u7A0B state",
      ["planned", "active", "ended", "missed"]
    )
  };
}
function serializeLesson(l) {
  return {
    id: l.id,
    projectId: l.projectId,
    semesterId: l.semesterId,
    semesterRevision: l.semesterRevision,
    title: l.title,
    topics: l.topics,
    resourceIds: l.resourceIds,
    startsAt: l.startsAt,
    endsAt: l.endsAt,
    aiEnabled: l.aiEnabled,
    attended: l.attended,
    progress: l.progress,
    state: l.state
  };
}
function parseScoringPoint(raw) {
  if (!isObject(raw)) throw new AppError("\u8BC4\u5206\u70B9\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, ["id", "description", "points"], "\u8BC4\u5206\u70B9");
  return {
    id: requiredField(raw, "id", "\u8BC4\u5206\u70B9", asStr),
    description: requiredField(raw, "description", "\u8BC4\u5206\u70B9", asStr),
    points: requiredField(raw, "points", "\u8BC4\u5206\u70B9", asInt)
  };
}
function serializeScoringPoint(p) {
  return { id: p.id, description: p.description, points: p.points };
}
function parseQuestion(raw) {
  if (!isObject(raw)) throw new AppError("\u9898\u76EE\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(
    raw,
    [
      "id",
      "prompt",
      "topics",
      "sourceIds",
      "extension",
      "estimatedMinutes",
      "answer",
      "acceptableAlternatives",
      "scoring"
    ],
    "\u9898\u76EE"
  );
  return {
    id: requiredField(raw, "id", "\u9898\u76EE", asStr),
    prompt: requiredField(raw, "prompt", "\u9898\u76EE", asStr),
    topics: field(
      raw,
      "topics",
      "\u9898\u76EE",
      (v) => asArray(v, "topics").map((x) => asStr(x, "\u77E5\u8BC6\u70B9")),
      []
    ),
    sourceIds: field(
      raw,
      "sourceIds",
      "\u9898\u76EE",
      (v) => asArray(v, "sourceIds").map((x) => asStr(x, "\u6765\u6E90 ID")),
      []
    ),
    extension: requiredField(raw, "extension", "\u9898\u76EE", asBool),
    estimatedMinutes: requiredField(raw, "estimatedMinutes", "\u9898\u76EE", asInt),
    answer: requiredField(raw, "answer", "\u9898\u76EE", asStr),
    acceptableAlternatives: requiredField(
      raw,
      "acceptableAlternatives",
      "\u9898\u76EE",
      asStr
    ),
    scoring: requiredField(
      raw,
      "scoring",
      "\u9898\u76EE",
      (v) => asArray(v, "scoring").map(parseScoringPoint)
    )
  };
}
function serializeQuestion(q) {
  return {
    id: q.id,
    prompt: q.prompt,
    topics: q.topics,
    sourceIds: q.sourceIds,
    extension: q.extension,
    estimatedMinutes: q.estimatedMinutes,
    answer: q.answer,
    acceptableAlternatives: q.acceptableAlternatives,
    scoring: q.scoring.map(serializeScoringPoint)
  };
}
function parseAssessment(raw) {
  if (!isObject(raw)) throw new AppError("\u8BD5\u9898\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(
    raw,
    [
      "id",
      "projectId",
      "semesterId",
      "semesterRevision",
      "lessonId",
      "taskId",
      "retestOfGradeId",
      "title",
      "kind",
      "revision",
      "startsAt",
      "endsAt",
      "instructions",
      "reviewEvidence",
      "questions",
      "publishedAt",
      "printedAt",
      "startedAt",
      "stoppedAt"
    ],
    "\u8BD5\u9898"
  );
  return {
    id: requiredField(raw, "id", "\u8BD5\u9898", asStr),
    projectId: requiredField(raw, "projectId", "\u8BD5\u9898", asStr),
    semesterId: requiredField(raw, "semesterId", "\u8BD5\u9898", asStr),
    semesterRevision: field(raw, "semesterRevision", "\u8BD5\u9898", asInt, 1),
    lessonId: field(
      raw,
      "lessonId",
      "\u8BD5\u9898",
      (v) => asOpt(v, "lessonId", asStr),
      null
    ),
    taskId: field(
      raw,
      "taskId",
      "\u8BD5\u9898",
      (v) => asOpt(v, "taskId", asStr),
      null
    ),
    retestOfGradeId: field(
      raw,
      "retestOfGradeId",
      "\u8BD5\u9898",
      (v) => asOpt(v, "retestOfGradeId", asStr),
      null
    ),
    title: requiredField(raw, "title", "\u8BD5\u9898", asStr),
    kind: oneOf(
      requiredField(raw, "kind", "\u8BD5\u9898", (v) => v),
      "\u8BD5\u9898 kind",
      ["homework", "weeklyExam", "mockExam", "retest"]
    ),
    revision: requiredField(raw, "revision", "\u8BD5\u9898", asInt),
    startsAt: requiredField(raw, "startsAt", "\u8BD5\u9898", asInt),
    endsAt: requiredField(raw, "endsAt", "\u8BD5\u9898", asInt),
    instructions: requiredField(raw, "instructions", "\u8BD5\u9898", asStr),
    reviewEvidence: requiredField(raw, "reviewEvidence", "\u8BD5\u9898", asStr),
    questions: requiredField(
      raw,
      "questions",
      "\u8BD5\u9898",
      (v) => asArray(v, "questions").map(parseQuestion)
    ),
    publishedAt: requiredField(raw, "publishedAt", "\u8BD5\u9898", asInt),
    printedAt: field(
      raw,
      "printedAt",
      "\u8BD5\u9898",
      (v) => asOpt(v, "printedAt", asInt),
      null
    ),
    startedAt: field(
      raw,
      "startedAt",
      "\u8BD5\u9898",
      (v) => asOpt(v, "startedAt", asInt),
      null
    ),
    stoppedAt: field(
      raw,
      "stoppedAt",
      "\u8BD5\u9898",
      (v) => asOpt(v, "stoppedAt", asInt),
      null
    )
  };
}
function serializeAssessment(a) {
  return {
    id: a.id,
    projectId: a.projectId,
    semesterId: a.semesterId,
    semesterRevision: a.semesterRevision,
    lessonId: a.lessonId,
    taskId: a.taskId,
    retestOfGradeId: a.retestOfGradeId,
    title: a.title,
    kind: a.kind,
    revision: a.revision,
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    instructions: a.instructions,
    reviewEvidence: a.reviewEvidence,
    questions: a.questions.map(serializeQuestion),
    publishedAt: a.publishedAt,
    printedAt: a.printedAt,
    startedAt: a.startedAt,
    stoppedAt: a.stoppedAt
  };
}
function examDeadline2(a) {
  return a.startedAt === null ? a.endsAt : a.startedAt + (a.endsAt - a.startsAt);
}
function parseSubmission(raw) {
  if (!isObject(raw)) throw new AppError("\u63D0\u4EA4\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(
    raw,
    [
      "id",
      "assessmentId",
      "submittedAt",
      "resourceIds",
      "answers",
      "unfinished",
      "questionTimes"
    ],
    "\u63D0\u4EA4"
  );
  return {
    id: requiredField(raw, "id", "\u63D0\u4EA4", asStr),
    assessmentId: requiredField(raw, "assessmentId", "\u63D0\u4EA4", asStr),
    submittedAt: requiredField(raw, "submittedAt", "\u63D0\u4EA4", asInt),
    resourceIds: field(
      raw,
      "resourceIds",
      "\u63D0\u4EA4",
      (v) => asArray(v, "resourceIds").map((x) => asStr(x, "\u9644\u4EF6 ID")),
      []
    ),
    answers: requiredField(raw, "answers", "\u63D0\u4EA4", asStr),
    unfinished: requiredField(raw, "unfinished", "\u63D0\u4EA4", asBool),
    questionTimes: field(
      raw,
      "questionTimes",
      "\u63D0\u4EA4",
      (v) => asArray(v, "questionTimes").map(parseQuestionTime),
      []
    )
  };
}
function serializeSubmission(s) {
  return {
    id: s.id,
    assessmentId: s.assessmentId,
    submittedAt: s.submittedAt,
    resourceIds: s.resourceIds,
    answers: s.answers,
    unfinished: s.unfinished,
    questionTimes: s.questionTimes.map(serializeQuestionTime)
  };
}
function parseQuestionTime(raw) {
  if (!isObject(raw)) throw new AppError("\u5B8C\u6210\u65F6\u523B\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, ["questionId", "localTime"], "\u5B8C\u6210\u65F6\u523B");
  return {
    questionId: requiredField(raw, "questionId", "\u5B8C\u6210\u65F6\u523B", asStr),
    localTime: requiredField(raw, "localTime", "\u5B8C\u6210\u65F6\u523B", asStr)
  };
}
function serializeQuestionTime(t) {
  return { questionId: t.questionId, localTime: t.localTime };
}
function parsePointAward(raw) {
  if (!isObject(raw)) throw new AppError("\u8BC4\u5206\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, ["questionId", "pointId", "awarded", "evidence"], "\u8BC4\u5206");
  return {
    questionId: requiredField(raw, "questionId", "\u8BC4\u5206", asStr),
    pointId: requiredField(raw, "pointId", "\u8BC4\u5206", asStr),
    awarded: requiredField(raw, "awarded", "\u8BC4\u5206", asInt),
    evidence: requiredField(raw, "evidence", "\u8BC4\u5206", asStr)
  };
}
function serializePointAward(p) {
  return {
    questionId: p.questionId,
    pointId: p.pointId,
    awarded: p.awarded,
    evidence: p.evidence
  };
}
function parseErrorAnalysis(raw) {
  if (!isObject(raw)) throw new AppError("\u9519\u56E0\u5206\u6790\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(
    raw,
    [
      "questionId",
      "cause",
      "evidence",
      "correction",
      "nextCheck",
      "retestDate",
      "confirmed"
    ],
    "\u9519\u56E0\u5206\u6790"
  );
  return {
    questionId: requiredField(raw, "questionId", "\u9519\u56E0\u5206\u6790", asStr),
    cause: requiredField(raw, "cause", "\u9519\u56E0\u5206\u6790", asStr),
    evidence: requiredField(raw, "evidence", "\u9519\u56E0\u5206\u6790", asStr),
    correction: requiredField(raw, "correction", "\u9519\u56E0\u5206\u6790", asStr),
    nextCheck: requiredField(raw, "nextCheck", "\u9519\u56E0\u5206\u6790", asStr),
    retestDate: requiredField(raw, "retestDate", "\u9519\u56E0\u5206\u6790", asStr),
    confirmed: requiredField(raw, "confirmed", "\u9519\u56E0\u5206\u6790", asBool)
  };
}
function serializeErrorAnalysis(e) {
  return {
    questionId: e.questionId,
    cause: e.cause,
    evidence: e.evidence,
    correction: e.correction,
    nextCheck: e.nextCheck,
    retestDate: e.retestDate,
    confirmed: e.confirmed
  };
}
function parseGrade(raw) {
  if (!isObject(raw)) throw new AppError("\u6279\u6539\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(
    raw,
    [
      "id",
      "submissionId",
      "assessmentRevision",
      "gradedAt",
      "awards",
      "errors",
      "needsReview",
      "feedback"
    ],
    "\u6279\u6539"
  );
  return {
    id: requiredField(raw, "id", "\u6279\u6539", asStr),
    submissionId: requiredField(raw, "submissionId", "\u6279\u6539", asStr),
    assessmentRevision: requiredField(raw, "assessmentRevision", "\u6279\u6539", asInt),
    gradedAt: requiredField(raw, "gradedAt", "\u6279\u6539", asInt),
    awards: requiredField(
      raw,
      "awards",
      "\u6279\u6539",
      (v) => asArray(v, "awards").map(parsePointAward)
    ),
    errors: requiredField(
      raw,
      "errors",
      "\u6279\u6539",
      (v) => asArray(v, "errors").map(parseErrorAnalysis)
    ),
    needsReview: requiredField(raw, "needsReview", "\u6279\u6539", asBool),
    feedback: requiredField(raw, "feedback", "\u6279\u6539", asStr)
  };
}
function serializeGrade(g) {
  return {
    id: g.id,
    submissionId: g.submissionId,
    assessmentRevision: g.assessmentRevision,
    gradedAt: g.gradedAt,
    awards: g.awards.map(serializePointAward),
    errors: g.errors.map(serializeErrorAnalysis),
    needsReview: g.needsReview,
    feedback: g.feedback
  };
}
function parseReview(raw) {
  if (!isObject(raw)) throw new AppError("\u590D\u76D8\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(
    raw,
    ["id", "date", "projectId", "gradeIds", "findings", "actions"],
    "\u590D\u76D8"
  );
  return {
    id: requiredField(raw, "id", "\u590D\u76D8", asStr),
    date: requiredField(raw, "date", "\u590D\u76D8", asStr),
    projectId: requiredField(raw, "projectId", "\u590D\u76D8", asStr),
    gradeIds: field(
      raw,
      "gradeIds",
      "\u590D\u76D8",
      (v) => asArray(v, "gradeIds").map((x) => asStr(x, "\u6279\u6539 ID")),
      []
    ),
    findings: requiredField(raw, "findings", "\u590D\u76D8", asStr),
    actions: field(
      raw,
      "actions",
      "\u590D\u76D8",
      (v) => asArray(v, "actions").map((x) => asStr(x, "\u884C\u52A8")),
      []
    )
  };
}
function serializeReview(r) {
  return {
    id: r.id,
    date: r.date,
    projectId: r.projectId,
    gradeIds: r.gradeIds,
    findings: r.findings,
    actions: r.actions
  };
}
function parseTeachingEvent(raw) {
  if (!isObject(raw)) throw new AppError("\u6559\u5B66\u4E8B\u4EF6\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(
    raw,
    ["id", "projectId", "kind", "sourceId", "state", "createdAt"],
    "\u6559\u5B66\u4E8B\u4EF6"
  );
  return {
    id: requiredField(raw, "id", "\u6559\u5B66\u4E8B\u4EF6", asStr),
    projectId: requiredField(raw, "projectId", "\u6559\u5B66\u4E8B\u4EF6", asStr),
    kind: requiredField(raw, "kind", "\u6559\u5B66\u4E8B\u4EF6", asStr),
    sourceId: requiredField(raw, "sourceId", "\u6559\u5B66\u4E8B\u4EF6", asStr),
    state: requiredField(raw, "state", "\u6559\u5B66\u4E8B\u4EF6", asStr),
    createdAt: requiredField(raw, "createdAt", "\u6559\u5B66\u4E8B\u4EF6", asInt)
  };
}
function serializeTeachingEvent(e) {
  return {
    id: e.id,
    projectId: e.projectId,
    kind: e.kind,
    sourceId: e.sourceId,
    state: e.state,
    createdAt: e.createdAt
  };
}
function parseProgressRecord(raw) {
  if (!isObject(raw)) throw new AppError("\u8FDB\u5EA6\u8BB0\u5F55\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(
    raw,
    [
      "id",
      "projectId",
      "topic",
      "position",
      "state",
      "evidence",
      "nextAction",
      "source",
      "confirmed",
      "recordedAt"
    ],
    "\u8FDB\u5EA6\u8BB0\u5F55"
  );
  return {
    id: requiredField(raw, "id", "\u8FDB\u5EA6\u8BB0\u5F55", asStr),
    projectId: requiredField(raw, "projectId", "\u8FDB\u5EA6\u8BB0\u5F55", asStr),
    topic: requiredField(raw, "topic", "\u8FDB\u5EA6\u8BB0\u5F55", asStr),
    position: requiredField(raw, "position", "\u8FDB\u5EA6\u8BB0\u5F55", asStr),
    state: oneOf(
      requiredField(raw, "state", "\u8FDB\u5EA6\u8BB0\u5F55", (v) => v),
      "\u8FDB\u5EA6 state",
      ["studied", "practicing", "needsReview"]
    ),
    evidence: requiredField(raw, "evidence", "\u8FDB\u5EA6\u8BB0\u5F55", asStr),
    nextAction: requiredField(raw, "nextAction", "\u8FDB\u5EA6\u8BB0\u5F55", asStr),
    source: oneOf(
      requiredField(raw, "source", "\u8FDB\u5EA6\u8BB0\u5F55", (v) => v),
      "\u8FDB\u5EA6 source",
      ["user", "assistant"]
    ),
    confirmed: requiredField(raw, "confirmed", "\u8FDB\u5EA6\u8BB0\u5F55", asBool),
    recordedAt: requiredField(raw, "recordedAt", "\u8FDB\u5EA6\u8BB0\u5F55", asInt)
  };
}
function serializeProgressRecord(r) {
  return {
    id: r.id,
    projectId: r.projectId,
    topic: r.topic,
    position: r.position,
    state: r.state,
    evidence: r.evidence,
    nextAction: r.nextAction,
    source: r.source,
    confirmed: r.confirmed,
    recordedAt: r.recordedAt
  };
}
function parseCorrection(raw) {
  if (!isObject(raw)) throw new AppError("\u8BA2\u6B63\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(
    raw,
    [
      "id",
      "gradeId",
      "questionId",
      "explanation",
      "resourceIds",
      "submittedAt",
      "accepted",
      "feedback",
      "reviewedAt"
    ],
    "\u8BA2\u6B63"
  );
  return {
    id: requiredField(raw, "id", "\u8BA2\u6B63", asStr),
    gradeId: requiredField(raw, "gradeId", "\u8BA2\u6B63", asStr),
    questionId: requiredField(raw, "questionId", "\u8BA2\u6B63", asStr),
    explanation: requiredField(raw, "explanation", "\u8BA2\u6B63", asStr),
    resourceIds: field(
      raw,
      "resourceIds",
      "\u8BA2\u6B63",
      (v) => asArray(v, "resourceIds").map((x) => asStr(x, "\u9644\u4EF6 ID")),
      []
    ),
    submittedAt: requiredField(raw, "submittedAt", "\u8BA2\u6B63", asInt),
    accepted: field(
      raw,
      "accepted",
      "\u8BA2\u6B63",
      (v) => asOpt(v, "accepted", asBool),
      null
    ),
    feedback: field(raw, "feedback", "\u8BA2\u6B63", asStr, ""),
    reviewedAt: field(
      raw,
      "reviewedAt",
      "\u8BA2\u6B63",
      (v) => asOpt(v, "reviewedAt", asInt),
      null
    )
  };
}
function serializeCorrection(c) {
  return {
    id: c.id,
    gradeId: c.gradeId,
    questionId: c.questionId,
    explanation: c.explanation,
    resourceIds: c.resourceIds,
    submittedAt: c.submittedAt,
    accepted: c.accepted,
    feedback: c.feedback,
    reviewedAt: c.reviewedAt
  };
}
function checkText(s, max) {
  return s.trim().length > 0 && Array.from(s).length <= max;
}
function validEducationDate(s) {
  return s.length === 10 && validDate(s);
}
function isRelativePath(path) {
  if (path.length === 0 || path.includes("\\") || isAbsolutePath(path))
    return false;
  const stripped = path.replace(/\/+$/, "");
  if (stripped.length === 0) return path.length > 0 && false;
  return stripped.split("/").every((seg) => seg !== "." && seg !== ".." && seg !== "");
}
function isAbsolutePath(path) {
  return /^(\/|[A-Za-z]:[\\/]|\\\\)/.test(path);
}
var Education = class {
  focusTasks = [];
  projects = [];
  resources = [];
  semesters = [];
  semesterHistory = [];
  lessons = [];
  assessments = [];
  submissions = [];
  grades = [];
  reviews = [];
  events = [];
  completedTasks = [];
  progress = [];
  corrections = [];
  /** 每次扫描或变更时重建：含停用配置与归档计划。 */
  resourceReferenceIndex() {
    const refs = /* @__PURE__ */ new Map();
    const add = (ids, label) => {
      for (const id2 of new Set(ids)) {
        const list = refs.get(id2) ?? [];
        list.push(label);
        refs.set(id2, list);
      }
    };
    for (const p of this.projects) {
      add(
        [p.syllabusId, ...p.pastPaperIds, ...p.mockPaperIds].filter(
          (x) => x !== null
        ),
        "\u9879\u76EE\u6559\u5B66\u914D\u7F6E"
      );
    }
    for (const s of [...this.semesters, ...this.semesterHistory]) {
      for (const m of s.milestones) {
        add(m.resourceIds, `${s.title} v${s.revision} \u7B2C${m.week}\u5468`);
      }
    }
    for (const l of this.lessons) {
      add(l.resourceIds, `\u8BFE\u7A0B\uFF1A${l.title}`);
    }
    for (const a of this.assessments) {
      for (const q of a.questions) {
        add(q.sourceIds, `${a.title} / ${q.id}`);
      }
    }
    for (const s of this.submissions) {
      add(s.resourceIds, `\u7B54\u5377\uFF1A${s.id}`);
    }
    for (const c of this.corrections) {
      add(c.resourceIds, `\u8BA2\u6B63\uFF1A${c.id}`);
    }
    return refs;
  }
  resourceReferences(id2) {
    return this.resourceReferenceIndex().get(id2) ?? [];
  }
  event(project, kind, source, at) {
    const eventId = `${kind}:${source}`;
    if (!this.events.some((e) => e.id === eventId)) {
      this.events.push({
        id: eventId,
        projectId: project,
        kind,
        sourceId: source,
        state: "pending",
        createdAt: at
      });
    }
  }
  taskCompleted(task, at) {
    const record = completedStudyTaskFromTask(task, at);
    if (record === null) return;
    if (this.projects.some(
      (p) => p.projectId === record.projectId && p.examMode
    ) && !this.completedTasks.some((t) => t.id === record.id)) {
      const link = this.focusTasks.find((l) => l.taskId === record.id);
      if (link !== void 0) {
        const lesson = this.lessons.find((l) => l.id === link.sourceId);
        if (lesson !== void 0) {
          record.topics = [...lesson.topics];
          record.notes = lesson.progress;
        }
      } else {
        this.event(record.projectId, "taskHomework", record.id, at);
      }
      this.completedTasks.push(record);
    }
  }
  /** 课程/考试到点推进、持久化教学事件。 */
  tick(at) {
    let changed = false;
    const events = [];
    for (const lesson of this.lessons) {
      if ((lesson.state === "planned" || lesson.state === "active") && at >= lesson.endsAt) {
        lesson.state = lesson.attended ? "ended" : "missed";
        if (lesson.aiEnabled && lesson.attended) {
          events.push({
            project: lesson.projectId,
            kind: "homework",
            source: lesson.id
          });
        }
        changed = true;
      } else if (lesson.state === "planned" && at >= lesson.startsAt) {
        lesson.state = "active";
        changed = true;
      }
    }
    for (const a of this.assessments) {
      if ((a.kind === "homework" || a.startedAt !== null) && a.stoppedAt === null && at >= examDeadline2(a)) {
        a.stoppedAt = examDeadline2(a);
        changed = true;
      }
    }
    for (const { project, kind, source } of events) {
      this.event(project, kind, source, at);
    }
    const grades = /* @__PURE__ */ new Set();
    for (const g of this.grades) {
      const nowMinutes = minutesOf(hourMinuteNow(at)) ?? -1;
      if (dateAt(g.gradedAt) < dateAt(at) && nowMinutes >= 510) {
        const sub = this.submissions.find((s) => s.id === g.submissionId);
        if (sub === void 0) continue;
        const a = this.assessments.find((x) => x.id === sub.assessmentId);
        if (a === void 0) continue;
        grades.add(`${a.projectId}|${dateAt(g.gradedAt)}`);
      }
    }
    for (const pair of grades) {
      const [p, d] = pair.split("|");
      const n = this.events.length;
      this.event(p, "review", `${p}:${d}`, at);
      if (this.events.length !== n) changed = true;
    }
    const today = localDateOf(at);
    if (weekdayMonday(today) >= 5) {
      const terms = [];
      for (const s of this.semesters) {
        if (s.startDate <= dateAt(at) && s.endDate >= dateAt(at) && this.projects.some((p) => p.projectId === s.projectId && p.examMode)) {
          const start = parseDate(s.startDate);
          const week = Math.floor(daysBetween(start, today) / 7) + 1;
          terms.push({ project: s.projectId, source: `${s.id}:week${week}` });
        }
      }
      for (const { project, source } of terms) {
        const n = this.events.length;
        this.event(project, "weeklyExam", source, at);
        if (this.events.length !== n) changed = true;
      }
    }
    return changed;
  }
  /** 教学命令执行：校验 → 变更，全部成功后由上层统一 validate。 */
  apply(command, at) {
    switch (command.op) {
      case "recordProgress": {
        ensure(
          !this.progress.some((r) => r.id === command.record.id),
          "\u8FDB\u5EA6\u8BB0\u5F55\u4E0D\u53EF\u8986\u76D6\uFF0C\u8BF7\u65B0\u589E\u4E00\u6761\u66F4\u6B63\u8BB0\u5F55"
        );
        command.record.recordedAt = at;
        command.record.confirmed = command.record.source === "user";
        this.progress.push(command.record);
        break;
      }
      case "confirmProgress": {
        const record = this.progress.find((r) => r.id === command.id);
        ensure(record !== void 0, "\u8FDB\u5EA6\u8BB0\u5F55\u4E0D\u5B58\u5728");
        record.confirmed = true;
        break;
      }
      case "submitCorrection": {
        ensure(
          !this.corrections.some((c) => c.id === command.correction.id),
          "\u8BA2\u6B63\u7248\u672C\u4E0D\u53EF\u8986\u76D6"
        );
        command.correction.submittedAt = at;
        command.correction.accepted = null;
        command.correction.feedback = "";
        command.correction.reviewedAt = null;
        const project = (() => {
          const grade = this.grades.find(
            (g) => g.id === command.correction.gradeId
          );
          if (grade === void 0) return null;
          const sub = this.submissions.find((s) => s.id === grade.submissionId);
          if (sub === void 0) return null;
          const a = this.assessments.find((x) => x.id === sub.assessmentId);
          return a?.projectId ?? null;
        })();
        ensure(project !== null, "\u8BA2\u6B63\u7F3A\u5C11\u539F\u59CB\u6279\u6539");
        this.event(project, "correction", command.correction.id, at);
        this.corrections.push(command.correction);
        break;
      }
      case "reviewCorrection": {
        const correction = this.corrections.find(
          (c) => c.id === command.id && c.reviewedAt === null
        );
        ensure(correction !== void 0, "\u8BA2\u6B63\u5DF2\u68C0\u67E5\u6216\u4E0D\u5B58\u5728");
        ensure(checkText(command.feedback, 5e4), "\u8BA2\u6B63\u68C0\u67E5\u9700\u8981\u53CD\u9988");
        correction.accepted = command.accepted;
        correction.feedback = command.feedback;
        correction.reviewedAt = at;
        break;
      }
      case "saveProject": {
        upsertBy(this.projects, command.project, (x) => x.projectId);
        break;
      }
      case "saveResource": {
        upsertBy(this.resources, command.resource, (x) => x.id);
        break;
      }
      case "saveResources": {
        for (const resource of command.resources) {
          upsertBy(this.resources, resource, (x) => x.id);
        }
        break;
      }
      case "removeResources": {
        ensure(command.ids.length > 0, "\u8BF7\u9009\u62E9\u8981\u6E05\u7406\u7684\u8D44\u6E90\u767B\u8BB0");
        const referenced = this.resourceReferenceIndex();
        const known = new Set(this.resources.map((r) => r.id));
        for (const id2 of command.ids) {
          ensure(known.has(id2), "\u8D44\u6E90\u767B\u8BB0\u4E0D\u5B58\u5728");
          ensure(
            !referenced.has(id2),
            "\u8D44\u6E90\u4ECD\u88AB\u6559\u5B66\u914D\u7F6E\u6216\u5386\u53F2\u8BB0\u5F55\u5F15\u7528\uFF0C\u8BF7\u4FEE\u590D\u8DEF\u5F84\u5E76\u4FDD\u7559\u767B\u8BB0"
          );
        }
        const ids = new Set(command.ids);
        this.resources = this.resources.filter((r) => !ids.has(r.id));
        break;
      }
      case "saveSemester": {
        const old = this.semesters.find((s) => s.id === command.semester.id);
        if (old !== void 0) {
          ensure(
            command.semester.revision === old.revision + 1,
            "\u5B66\u671F\u8BA1\u5212\u66F4\u65B0\u5FC5\u987B\u9012\u589E\u7248\u672C"
          );
          this.semesterHistory.push({
            ...old,
            milestones: old.milestones.map((m) => ({
              ...m,
              topics: [...m.topics],
              resourceIds: [...m.resourceIds]
            }))
          });
        }
        upsertBy(this.semesters, command.semester, (x) => x.id);
        break;
      }
      case "saveLesson": {
        const semester = this.semesters.find(
          (s) => s.id === command.lesson.semesterId
        );
        ensure(semester !== void 0, "\u5B66\u671F\u8BA1\u5212\u4E0D\u5B58\u5728");
        command.lesson.semesterRevision = semester.revision;
        ensure(command.lesson.startsAt > at, "\u8BFE\u7A0B\u5FC5\u987B\u5B89\u6392\u5728\u672A\u6765");
        ensure(
          !this.lessons.some(
            (l) => l.id === command.lesson.id && (l.state !== "planned" || l.attended)
          ),
          "\u5DF2\u5F00\u59CB\u8BFE\u7A0B\u4FDD\u7559\u5386\u53F2\uFF0C\u4E0D\u80FD\u6539\u5199"
        );
        command.lesson.state = "planned";
        command.lesson.attended = false;
        upsertBy(this.lessons, command.lesson, (x) => x.id);
        break;
      }
      case "setLessonResources": {
        const lesson = this.lessons.find((l) => l.id === command.id);
        ensure(lesson !== void 0, "\u8BFE\u7A0B\u4E0D\u5B58\u5728");
        ensure(
          lesson.state === "planned" && !lesson.attended && lesson.startsAt > at,
          "\u8BFE\u7A0B\u5DF2\u5F00\u59CB\uFF0C\u4E0D\u80FD\u4FEE\u6539\u6307\u5B9A\u8D44\u6599"
        );
        ensure(
          command.resourceIds.every(
            (id2) => this.resources.some(
              (r) => r.id === id2 && r.projectId === lesson.projectId
            )
          ),
          "\u53EA\u80FD\u6307\u5B9A\u672C\u9879\u76EE\u767B\u8BB0\u7684\u8D44\u6599"
        );
        ensure(
          new Set(command.resourceIds).size === command.resourceIds.length,
          "\u8BFE\u7A0B\u8D44\u6599\u4E0D\u80FD\u91CD\u590D\u6307\u5B9A"
        );
        lesson.resourceIds = [...command.resourceIds];
        break;
      }
      case "attendLesson": {
        const lesson = this.lessons.find((l) => l.id === command.id);
        ensure(lesson !== void 0, "\u8BFE\u7A0B\u4E0D\u5B58\u5728");
        ensure(
          at >= lesson.startsAt && at < lesson.endsAt,
          "\u53EA\u80FD\u5728\u4E0A\u8BFE\u65F6\u786E\u8BA4\u53C2\u4E0E"
        );
        lesson.attended = true;
        lesson.progress = command.progress;
        break;
      }
      case "publishAssessment": {
        ensure(
          this.projects.some(
            (p) => p.projectId === command.assessment.projectId && p.examMode
          ),
          "\u53D1\u5E03\u4F5C\u4E1A\u548C\u8BD5\u5377\u524D\u8BF7\u542F\u7528\u5E94\u8BD5\u6A21\u5F0F"
        );
        ensure(
          !this.assessments.some((a) => a.id === command.assessment.id),
          "\u5DF2\u53D1\u5E03\u9898\u76EE\u548C\u8BC4\u5206\u6807\u51C6\u4E0D\u53EF\u4FEE\u6539\uFF1B\u8BF7\u53D1\u5E03\u65B0 ID \u7684\u4FEE\u8BA2\u7248"
        );
        ensure(
          command.assessment.kind === "homework" ? command.assessment.endsAt > at : dateAt(command.assessment.startsAt) >= dateAt(at),
          "\u4E0D\u80FD\u53D1\u5E03\u5DF2\u622A\u6B62\u7684\u4F5C\u4E1A\u6216\u5DF2\u8FC7\u8003\u8BD5\u65E5\u671F\u7684\u8BD5\u5377"
        );
        const semester = this.semesters.find(
          (s) => s.id === command.assessment.semesterId
        );
        ensure(semester !== void 0, "\u5B66\u671F\u8BA1\u5212\u4E0D\u5B58\u5728");
        command.assessment.semesterRevision = semester.revision;
        command.assessment.publishedAt = at;
        command.assessment.printedAt = null;
        command.assessment.startedAt = null;
        command.assessment.stoppedAt = null;
        this.assessments.push(command.assessment);
        break;
      }
      case "confirmPrinted": {
        const a = this.assessments.find((x) => x.id === command.id);
        ensure(a !== void 0, "\u8BD5\u5377\u4E0D\u5B58\u5728");
        a.printedAt = at;
        break;
      }
      case "startExam": {
        ensure(
          !this.assessments.some(
            (a2) => a2.startedAt !== null && a2.stoppedAt === null
          ),
          "\u8BF7\u5148\u7ED3\u675F\u5F53\u524D\u8003\u8BD5"
        );
        const a = this.assessments.find((x) => x.id === command.id);
        ensure(a !== void 0, "\u8BD5\u5377\u4E0D\u5B58\u5728");
        ensure(
          a.kind !== "homework" && a.printedAt !== null && a.startedAt === null && dateAt(at) === dateAt(a.startsAt),
          "\u8BF7\u5148\u6253\u5370\u8BD5\u5377\u4E0E\u7B54\u9898\u5361\uFF0C\u5E76\u5728\u8003\u8BD5\u5B89\u6392\u5F53\u5929\u5F00\u59CB\u8003\u8BD5"
        );
        a.startedAt = at;
        break;
      }
      case "endExam": {
        const a = this.assessments.find((x) => x.id === command.id);
        ensure(a !== void 0, "\u8003\u8BD5\u4E0D\u5B58\u5728");
        ensure(
          a.kind !== "homework" && a.startedAt !== null && a.stoppedAt === null,
          "\u8003\u8BD5\u5C1A\u672A\u5F00\u59CB\u6216\u5DF2\u7ECF\u505C\u7B14"
        );
        a.stoppedAt = at;
        break;
      }
      case "submit": {
        ensure(
          !this.submissions.some((s) => s.id === command.submission.id),
          "\u63D0\u4EA4\u7248\u672C\u4E0D\u53EF\u8986\u76D6"
        );
        const a = this.assessments.find(
          (x) => x.id === command.submission.assessmentId
        );
        ensure(a !== void 0, "\u4F5C\u4E1A/\u8003\u8BD5\u4E0D\u5B58\u5728");
        ensure(at >= a.startsAt, "\u5C1A\u672A\u5F00\u59CB\uFF0C\u4E0D\u80FD\u63D0\u4EA4");
        if (a.kind !== "homework") {
          ensure(
            a.startedAt !== null && a.stoppedAt !== null,
            "\u8003\u8BD5\u7ED3\u675F\u505C\u7B14\u540E\u624D\u80FD\u4E0A\u4F20\u7B54\u9898\u5361"
          );
          ensure(
            command.submission.resourceIds.length > 0,
            "\u8003\u8BD5\u9700\u8981\u4E0A\u4F20\u7EB8\u8D28\u7B54\u9898\u5361"
          );
        }
        ensure(
          checkText(command.submission.answers, 5e4) || command.submission.resourceIds.length > 0 || command.submission.unfinished,
          "\u8BF7\u63D0\u4F9B\u7B54\u6848\u3001\u9644\u4EF6\u6216\u6807\u8BB0\u672A\u5B8C\u6210"
        );
        command.submission.submittedAt = at;
        const project = a.projectId;
        const source = command.submission.id;
        this.submissions.push(command.submission);
        this.event(project, "grade", source, at);
        break;
      }
      case "recordQuestionTimes": {
        ensure(command.questionTimes.length > 0, "\u6CA1\u6709\u9700\u8981\u8865\u5F55\u7684\u5B8C\u6210\u65F6\u523B");
        ensure(
          !this.grades.some((g) => g.submissionId === command.id),
          "\u5DF2\u6279\u6539\u7684\u7B54\u5377\u4E0D\u80FD\u8865\u5F55\u5B8C\u6210\u65F6\u523B"
        );
        const submission = this.submissions.find((s) => s.id === command.id);
        ensure(submission !== void 0, "\u63D0\u4EA4\u7248\u672C\u4E0D\u5B58\u5728");
        ensure(
          command.questionTimes.every(
            (t) => !submission.questionTimes.some(
              (existing) => existing.questionId === t.questionId
            )
          ),
          "\u5DF2\u6709\u7684\u5B8C\u6210\u65F6\u523B\u4E0D\u80FD\u8986\u76D6"
        );
        submission.questionTimes.push(...command.questionTimes);
        break;
      }
      case "grade": {
        ensure(
          !this.grades.some((g) => g.id === command.grade.id),
          "\u6279\u6539\u5386\u53F2\u4E0D\u53EF\u8986\u76D6\uFF0C\u590D\u6838\u8BF7\u65B0\u589E\u6279\u6539\u8BB0\u5F55"
        );
        command.grade.gradedAt = at;
        this.grades.push(command.grade);
        break;
      }
      case "saveReview": {
        ensure(
          !this.reviews.some((r) => r.id === command.review.id),
          "\u590D\u76D8\u5386\u53F2\u4E0D\u53EF\u8986\u76D6"
        );
        this.reviews.push(command.review);
        break;
      }
      case "claimEvent": {
        const event = this.events.find(
          (e) => e.id === command.id && e.state === "pending"
        );
        ensure(event !== void 0, "\u4E8B\u4EF6\u5DF2\u5904\u7406");
        event.state = "running";
        break;
      }
      case "finishEvent": {
        const event = this.events.find((e) => e.id === command.id);
        ensure(event !== void 0, "\u6559\u5B66\u4E8B\u4EF6\u4E0D\u5B58\u5728");
        const produced = (() => {
          switch (event.kind) {
            case "homework":
              return this.assessments.some(
                (a) => a.projectId === event.projectId && a.kind === "homework" && a.lessonId === event.sourceId
              );
            case "taskHomework":
              return this.assessments.some(
                (a) => a.kind === "homework" && a.projectId === event.projectId && a.taskId === event.sourceId
              );
            case "correction":
              return this.corrections.some(
                (c) => c.id === event.sourceId && c.reviewedAt !== null
              );
            case "weeklyExam":
              return this.assessments.some(
                (a) => a.projectId === event.projectId && a.kind === "weeklyExam" && a.publishedAt >= event.createdAt
              );
            case "grade":
              return this.grades.some((g) => g.submissionId === event.sourceId);
            case "review":
              return this.reviews.some(
                (r) => r.projectId === event.projectId && event.sourceId.endsWith(r.date)
              );
            default:
              return false;
          }
        })();
        ensure(produced, "\u8BF7\u5148\u4FDD\u5B58\u672C\u6B21\u6559\u5B66\u4E8B\u4EF6\u7684\u5B9E\u9645\u4EA7\u7269");
        event.state = "done";
        break;
      }
      case "retryEvent": {
        const event = this.events.find(
          (e) => e.id === command.id && e.state !== "done"
        );
        ensure(event !== void 0, "\u6CA1\u6709\u53EF\u91CD\u8BD5\u7684\u6559\u5B66\u4E8B\u4EF6");
        event.state = "pending";
        break;
      }
    }
  }
};
function upsertBy(list, value, key) {
  const k = key(value);
  const index = list.findIndex((x) => key(x) === k);
  if (index >= 0) {
    list[index] = value;
  } else {
    list.push(value);
  }
}
function completedStudyTaskFromTask(task, at) {
  if (task.projectId === null) return null;
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    notes: task.notes,
    topics: [...task.tags],
    completedAt: at
  };
}
function hourMinuteNow(at) {
  const d = new Date(at * 1e3);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function validateEducation(data) {
  const e = data.education;
  uniqueEducationIds([
    ...e.resources.map((x) => x.id),
    ...e.semesters.map((x) => x.id),
    ...e.lessons.map((x) => x.id),
    ...e.assessments.map((x) => x.id),
    ...e.submissions.map((x) => x.id),
    ...e.grades.map((x) => x.id),
    ...e.reviews.map((x) => x.id)
  ]);
  uniqueEducationIds(e.projects.map((p) => p.projectId));
  uniqueEducationIds(e.events.map((p) => p.id));
  const projectExists = (id2) => data.projects.some((p) => p.id === id2);
  const resource = (id2, p) => e.resources.find((r) => r.id === id2 && r.projectId === p);
  ensure(
    e.lessons.length + e.assessments.length + e.submissions.length + e.grades.length <= 1e5,
    "\u6559\u5B66\u8BB0\u5F55\u6570\u91CF\u8D85\u51FA\u9650\u5236"
  );
  for (const p of e.projects) {
    ensure(
      projectExists(p.projectId) && isAbsolutePath(p.directory),
      "\u9879\u76EE\u5FC5\u987B\u7ED1\u5B9A\u7EDD\u5BF9\u76EE\u5F55"
    );
    ensure(
      p.examDate === null || validEducationDate(p.examDate),
      "\u65E0\u6548\u7684\u8003\u8BD5\u65E5\u671F"
    );
    if (p.examMode) {
      ensure(
        p.visionId !== null && data.visions.some((v) => v.id === p.visionId) && checkText(p.target, 5e4),
        "\u5E94\u8BD5\u6A21\u5F0F\u5FC5\u987B\u7ED1\u5B9A\u613F\u666F\u5E76\u660E\u786E\u9662\u6821\u3001\u4E13\u4E1A\u3001\u5E74\u4EFD\u548C\u79D1\u76EE\u76EE\u6807"
      );
      ensure(
        p.syllabusId !== null && resource(p.syllabusId, p.projectId)?.kind === "syllabus",
        "\u5E94\u8BD5\u6A21\u5F0F\u5FC5\u987B\u7ED1\u5B9A\u8003\u7EB2"
      );
      ensure(
        p.pastPaperIds.length > 0 && p.pastPaperIds.every(
          (id2) => resource(id2, p.projectId)?.kind === "pastPaper"
        ),
        "\u5E94\u8BD5\u6A21\u5F0F\u5FC5\u987B\u7ED1\u5B9A\u771F\u9898"
      );
      ensure(
        p.mockPaperIds.length > 0 && p.mockPaperIds.every(
          (id2) => resource(id2, p.projectId)?.kind === "mockPaper"
        ),
        "\u5E94\u8BD5\u6A21\u5F0F\u5FC5\u987B\u7ED1\u5B9A\u6A21\u62DF\u9898"
      );
    }
  }
  for (const r of e.resources) {
    ensure(
      e.projects.some((p) => p.projectId === r.projectId) && checkText(r.title, 5e4) && isRelativePath(r.path),
      "\u8D44\u6E90\u9700\u8981\u6240\u5C5E\u9879\u76EE\u3001\u540D\u79F0\u548C\u5B89\u5168\u7684\u76F8\u5BF9\u8DEF\u5F84"
    );
  }
  for (const s of e.semesters) {
    ensure(
      e.projects.some((p) => p.projectId === s.projectId) && checkText(s.title, 5e4) && validEducationDate(s.startDate) && validEducationDate(s.endDate) && s.startDate <= s.endDate && s.revision > 0 && checkText(s.baseline, 5e4) && checkText(s.rationale, 5e4) && s.evidence.length > 0 && s.milestones.length > 0,
      "\u5B66\u671F\u8BA1\u5212\u7F3A\u5C11\u65E5\u671F\u3001\u5B66\u60C5\u8BCA\u65AD\u3001\u4F9D\u636E\u6216\u9636\u6BB5\u8FDB\u5EA6"
    );
    for (const m of s.milestones) {
      ensure(
        m.week > 0 && m.topics.length > 0 && checkText(m.objective, 5e4) && m.lessonCount > 0 && m.resourceIds.every((id2) => resource(id2, s.projectId) !== void 0),
        "\u65E0\u6548\u7684\u5468\u8FDB\u5EA6\u6216\u5B66\u4E60\u8D44\u6E90"
      );
    }
  }
  for (const l of e.lessons) {
    const s = [...e.semesters, ...e.semesterHistory].find(
      (x) => x.id === l.semesterId && x.projectId === l.projectId && x.revision === l.semesterRevision
    );
    ensure(s !== void 0, "\u8BFE\u7A0B\u5FC5\u987B\u7ED1\u5B9A\u672C\u9879\u76EE\u5B66\u671F\u8BA1\u5212");
    ensure(
      checkText(l.title, 5e4) && l.topics.length > 0 && l.endsAt - l.startsAt === 45 * 60 && dateAt(l.startsAt) >= s.startDate && dateAt(l.endsAt) <= s.endDate && l.resourceIds.every((id2) => resource(id2, l.projectId) !== void 0),
      "\u8BFE\u7A0B\u9700\u898145\u5206\u949F\u3001\u77E5\u8BC6\u70B9\u548C\u6709\u6548\u8D44\u6E90\uFF0C\u4E14\u5728\u5B66\u671F\u8303\u56F4\u5185"
    );
    const minute = Math.floor(minutesOf(hourMinuteNow(l.startsAt)) ?? 0);
    ensure(
      minute >= 8 * 60 && minute < 12 * 60 + 40 || minute >= 14 * 60 && minute < 18 * 60 + 15,
      "\u8BFE\u7A0B\u987B\u5728\u4E0A\u5348\u6216\u4E0B\u5348\uFF0C\u665A\u95F419\u201322\u70B9\u7559\u7ED9\u4F5C\u4E1A"
    );
    const same = e.lessons.filter(
      (x) => dateAt(x.startsAt) === dateAt(l.startsAt)
    );
    let morning = 0;
    let afternoon = 0;
    for (const x of same) {
      const h = new Date(x.startsAt * 1e3).getHours();
      if (h < 12) morning += 1;
      else afternoon += 1;
    }
    ensure(morning <= 4 && afternoon <= 4, "\u8DE8\u9879\u76EE\u6BCF\u5929\u6700\u591A\u4E0A\u53484\u8282\u3001\u4E0B\u53484\u8282");
    ensure(
      !e.lessons.some(
        (x) => x.id !== l.id && x.startsAt < l.endsAt && x.endsAt > l.startsAt
      ),
      "\u8DE8\u9879\u76EE\u8BFE\u7A0B\u65F6\u95F4\u51B2\u7A81"
    );
    const date = dateAt(l.startsAt);
    for (const b of data.blocks) {
      if (b.attention === "required") {
        ensure(
          overlapMinutes(b, date, minute, minute + 45) === 0,
          "\u8BFE\u7A0B\u4E0E\u9700\u4E13\u5FC3\u7684\u56FA\u5B9A\u5360\u7528\u51B2\u7A81"
        );
      }
    }
  }
  for (const a of e.assessments) {
    ensure(
      e.projects.some((p) => p.projectId === a.projectId),
      "AI\u4F5C\u4E1A\u548C\u8003\u8BD5\u9700\u8981\u542F\u7528\u5E94\u8BD5\u6A21\u5F0F"
    );
    ensure(
      [...e.semesters, ...e.semesterHistory].some(
        (s) => s.id === a.semesterId && s.projectId === a.projectId && s.revision === a.semesterRevision
      ),
      "\u8BD5\u9898\u5FC5\u987B\u7ED1\u5B9A\u5B66\u671F\u8BA1\u5212"
    );
    ensure(
      a.revision > 0 && a.startsAt < a.endsAt && checkText(a.title, 5e4) && checkText(a.reviewEvidence, 5e4) && checkText(a.instructions, 5e4) && a.questions.length > 0,
      "\u53D1\u5E03\u524D\u5FC5\u987B\u51C6\u5907\u9898\u76EE\u3001\u8003\u8BD5\u8BF4\u660E\u3001\u7B54\u6848\u548C\u72EC\u7ACB\u590D\u6838\u8BB0\u5F55"
    );
    if (a.kind === "homework") {
      ensure(
        a.taskId === null && a.lessonId !== null && e.lessons.some(
          (l) => l.id === a.lessonId && l.projectId === a.projectId && l.aiEnabled && l.state === "ended"
        ) || a.lessonId === null && a.taskId !== null && e.completedTasks.some(
          (t) => t.id === a.taskId && t.projectId === a.projectId
        ),
        "\u4F5C\u4E1A\u5FC5\u987B\u6765\u81EA\u672C\u9879\u76EE\u5DF2\u7ED3\u675F\u7684AI\u8BFE\u7A0B\u6216\u5DF2\u5B8C\u6210\u5B66\u4E60\u4EFB\u52A1"
      );
    }
    if (a.kind === "retest") {
      ensure(
        a.retestOfGradeId !== null && e.grades.some((g) => {
          if (g.id !== a.retestOfGradeId) return false;
          return e.submissions.some((s) => {
            if (s.id !== g.submissionId) return false;
            return e.assessments.some(
              (original) => original.id === s.assessmentId && original.projectId === a.projectId
            );
          });
        }),
        "\u590D\u6D4B\u5FC5\u987B\u5173\u8054\u672C\u9879\u76EE\u539F\u59CB\u6279\u6539"
      );
    } else {
      ensure(a.retestOfGradeId === null, "\u53EA\u6709\u590D\u6D4B\u53EF\u4EE5\u5F15\u7528\u539F\u59CB\u6279\u6539");
    }
    if (a.kind === "weeklyExam") {
      ensure(weekdayMonday(localDateOf(a.startsAt)) >= 6, "\u5468\u8003\u5B89\u6392\u5728\u5468\u672B");
    }
    if (a.kind !== "homework") {
      ensure(
        !e.lessons.some(
          (l) => l.startsAt < a.endsAt && l.endsAt > a.startsAt
        ) && !e.assessments.some(
          (b) => b.id !== a.id && b.kind !== "homework" && b.startsAt < a.endsAt && b.endsAt > a.startsAt
        ),
        "\u8003\u8BD5\u4E0E\u8BFE\u7A0B\u6216\u5176\u4ED6\u8003\u8BD5\u51B2\u7A81"
      );
    }
    uniqueEducationIds(a.questions.map((q) => q.id));
    for (const q of a.questions) {
      ensure(
        checkText(q.prompt, 5e4) && checkText(q.answer, 5e4) && q.topics.length > 0 && q.estimatedMinutes > 0 && q.scoring.length > 0 && q.sourceIds.length > 0 && q.sourceIds.every((id2) => resource(id2, a.projectId) !== void 0),
        "\u6BCF\u9898\u5FC5\u987B\u6709\u6765\u6E90\u3001\u77E5\u8BC6\u70B9\u3001\u4F30\u65F6\u3001\u7B54\u6848\u548C\u8BC4\u5206\u70B9"
      );
      uniqueEducationIds(q.scoring.map((p) => p.id));
      for (const p of q.scoring) {
        ensure(
          p.points > 0 && checkText(p.description, 5e4),
          "\u8BC4\u5206\u70B9\u9700\u8981\u5206\u503C\u4E0E\u5224\u5206\u4F9D\u636E"
        );
      }
      if (!q.extension && a.kind !== "mockExam" && a.kind !== "retest") {
        ensure(
          q.topics.every(
            (t) => e.lessons.some(
              (l) => l.projectId === a.projectId && l.state === "ended" && l.topics.includes(t)
            ) || e.completedTasks.some(
              (task) => task.projectId === a.projectId && task.topics.includes(t)
            ) || e.progress.some(
              (r) => r.projectId === a.projectId && r.confirmed && r.topic === t
            )
          ),
          "\u57FA\u7840\u7EC3\u4E60\u4E0D\u80FD\u5305\u542B\u5C1A\u672A\u6388\u8BFE\u7684\u77E5\u8BC6\u70B9\uFF1B\u62D3\u5C55\u9898\u987B\u660E\u786E\u6807\u8BB0"
        );
      }
    }
  }
  for (const s of e.submissions) {
    const a = e.assessments.find((x) => x.id === s.assessmentId);
    ensure(a !== void 0, "\u63D0\u4EA4\u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u8BD5\u9898");
    ensure(
      s.resourceIds.every((id2) => resource(id2, a.projectId) !== void 0),
      "\u7B54\u5377\u9644\u4EF6\u5FC5\u987B\u5C5E\u4E8E\u672C\u9879\u76EE"
    );
    uniqueEducationIds(s.questionTimes.map((t) => t.questionId));
    for (const t of s.questionTimes) {
      ensure(
        a.questions.some((q) => q.id === t.questionId) && t.localTime.length === 5 && minutesOf(t.localTime) !== null,
        "\u6BCF\u9898\u8BB0\u5F55\u672C\u673AHH:MM\u5B8C\u6210\u65F6\u523B"
      );
    }
  }
  for (const g of e.grades) {
    const s = e.submissions.find((x) => x.id === g.submissionId);
    ensure(s !== void 0, "\u6279\u6539\u7F3A\u5C11\u63D0\u4EA4\u7248\u672C");
    const a = e.assessments.find((x) => x.id === s.assessmentId);
    ensure(a !== void 0, "\u8BD5\u9898\u4E0D\u5B58\u5728");
    ensure(
      g.assessmentRevision === a.revision && checkText(g.feedback, 5e4),
      "\u6279\u6539\u5FC5\u987B\u5F15\u7528\u53D1\u5E03\u65F6\u7684\u8BC4\u5206\u7248\u672C\u5E76\u7ED9\u51FA\u53CD\u9988"
    );
    const seen = /* @__PURE__ */ new Set();
    for (const award of g.awards) {
      const point = a.questions.find((q) => q.id === award.questionId)?.scoring.find((p) => p.id === award.pointId);
      ensure(point !== void 0, "\u6279\u6539\u4E0D\u80FD\u4E34\u65F6\u589E\u52A0\u8BC4\u5206\u70B9");
      ensure(
        award.awarded <= point.points && checkText(award.evidence, 5e4) && !seen.has(`${award.questionId}|${award.pointId}`),
        "\u8BC4\u5206\u8D85\u8303\u56F4\u3001\u91CD\u590D\u6216\u7F3A\u5C11\u7B54\u5377\u8BC1\u636E"
      );
      seen.add(`${award.questionId}|${award.pointId}`);
    }
    const totalPoints = a.questions.reduce((n, q) => n + q.scoring.length, 0);
    ensure(
      g.needsReview || g.awards.length === totalPoints,
      "\u6B63\u5F0F\u6279\u6539\u5FC5\u987B\u8986\u76D6\u5168\u90E8\u8BC4\u5206\u70B9\uFF1B\u8BC6\u522B\u4E0D\u6E05\u8BF7\u6807\u8BB0\u5F85\u590D\u6838"
    );
    for (const error of g.errors) {
      ensure(
        a.questions.some((q) => q.id === error.questionId) && checkText(error.cause, 5e4) && checkText(error.evidence, 5e4) && checkText(error.correction, 5e4) && checkText(error.nextCheck, 5e4) && validEducationDate(error.retestDate),
        "\u9519\u56E0\u5206\u6790\u9700\u8981\u8BC1\u636E\u3001\u7EA0\u6B63\u52A8\u4F5C\u548C\u590D\u6D4B\u65E5\u671F"
      );
    }
  }
  for (const r of e.reviews) {
    ensure(
      projectExists(r.projectId) && validEducationDate(r.date) && checkText(r.findings, 5e4) && r.actions.length > 0 && r.gradeIds.length > 0 && r.gradeIds.every(
        (id2) => e.grades.some((g) => {
          if (g.id !== id2) return false;
          return e.submissions.some((s) => {
            if (s.id !== g.submissionId) return false;
            return e.assessments.some(
              (a) => a.id === s.assessmentId && a.projectId === r.projectId
            );
          });
        })
      ),
      "\u590D\u76D8\u5FC5\u987B\u5F15\u7528\u672C\u9879\u76EE\u6279\u6539\u5E76\u7ED9\u51FA\u540E\u7EED\u884C\u52A8"
    );
  }
  for (const event of e.events) {
    ensure(
      projectExists(event.projectId) && ["pending", "running", "done"].includes(event.state) && [
        "homework",
        "taskHomework",
        "grade",
        "correction",
        "review",
        "weeklyExam"
      ].includes(event.kind),
      "\u65E0\u6548\u7684\u6559\u5B66\u4E8B\u4EF6"
    );
  }
  validateLearning(data);
}
function uniqueEducationIds(ids) {
  const seen = /* @__PURE__ */ new Set();
  for (const id2 of ids) {
    ensure(
      id2.trim().length > 0 && id2.length <= 200 && !seen.has(id2),
      "\u6559\u5B66\u5B9E\u4F53 ID \u4E3A\u7A7A\u3001\u8FC7\u957F\u6216\u91CD\u590D"
    );
    seen.add(id2);
  }
}
function validateEducationTransition(before, after) {
  validateLearningTransition(before, after);
  for (const link of before.focusTasks) {
    ensure(
      after.focusTasks.some(
        (x) => x.taskId === link.taskId && x.sourceId === link.sourceId && x.kind === link.kind
      ),
      "\u5DF2\u5EFA\u7ACB\u7684\u6559\u5B66\u5F85\u529E\u6765\u6E90\u5173\u8054\u4E0D\u80FD\u5220\u9664\u6216\u6539\u5199"
    );
  }
  const activeResources = new Set(after.resources.map((r) => r.id));
  const references = before.resourceReferenceIndex();
  for (const resource of before.resources) {
    if (!activeResources.has(resource.id)) {
      ensure(
        !references.has(resource.id),
        "\u6559\u5B66\u5386\u53F2\u5F15\u7528\u7684\u8D44\u6E90\u767B\u8BB0\u4E0D\u80FD\u5220\u9664\uFF0C\u8BF7\u4FEE\u590D\u8DEF\u5F84"
      );
    }
  }
  for (const a of before.assessments) {
    ensure(
      after.assessments.some((b2) => b2.id === a.id),
      "\u5DF2\u53D1\u5E03\u8BD5\u5377\u4E0D\u80FD\u5220\u9664"
    );
    const b = after.assessments.find((x) => x.id === a.id);
    if (b !== void 0) {
      const old = cloneAssessment(a);
      old.printedAt = b.printedAt;
      old.startedAt = b.startedAt;
      old.stoppedAt = b.stoppedAt;
      ensure(
        assessmentEquals(old, b),
        "\u5DF2\u53D1\u5E03\u9898\u76EE\u4E0E\u8BC4\u5206\u6807\u51C6\u4E0D\u53EF\u88AB\u5BFC\u5165\u6216\u8865\u4E01\u6539\u5199"
      );
    }
  }
  for (const s of before.submissions) {
    const b = after.submissions.find((x) => x.id === s.id);
    ensure(
      b !== void 0 && (() => {
        const old = cloneSubmission(s);
        old.questionTimes = b.questionTimes.map((t) => ({ ...t }));
        return submissionEquals(old, b) && startsWithQuestionTimes(b.questionTimes, s.questionTimes) && (b.questionTimes.length === s.questionTimes.length || !before.grades.some((g) => g.submissionId === s.id));
      })(),
      "\u63D0\u4EA4\u5386\u53F2\u4E0D\u53EF\u6539\u5199\uFF1B\u53EA\u80FD\u5728\u6279\u6539\u524D\u8865\u5145\u7F3A\u5931\u7684\u5B8C\u6210\u65F6\u523B"
    );
  }
  for (const g of before.grades) {
    const b = after.grades.find((x) => x.id === g.id);
    ensure(b !== void 0 && gradeEquals(b, g), "\u6279\u6539\u5386\u53F2\u4E0D\u53EF\u6539\u5199");
  }
}
function cloneAssessment(a) {
  return {
    ...a,
    questions: a.questions.map((q) => ({
      ...q,
      topics: [...q.topics],
      sourceIds: [...q.sourceIds],
      scoring: q.scoring.map((p) => ({ ...p }))
    }))
  };
}
function cloneSubmission(s) {
  return {
    ...s,
    resourceIds: [...s.resourceIds],
    questionTimes: s.questionTimes.map((t) => ({ ...t }))
  };
}
function assessmentEquals(a, b) {
  return JSON.stringify(serializeAssessment(a)) === JSON.stringify(serializeAssessment(b));
}
function submissionEquals(a, b) {
  return JSON.stringify(serializeSubmission(a)) === JSON.stringify(serializeSubmission(b));
}
function gradeEquals(a, b) {
  return JSON.stringify(serializeGrade(a)) === JSON.stringify(serializeGrade(b));
}
function startsWithQuestionTimes(list, prefix) {
  return prefix.every(
    (p, i) => list[i] !== void 0 && list[i].questionId === p.questionId && list[i].localTime === p.localTime
  );
}
var EDUCATION_KEYS = [
  "focusTasks",
  "projects",
  "resources",
  "semesters",
  "semesterHistory",
  "lessons",
  "assessments",
  "submissions",
  "grades",
  "reviews",
  "events",
  "completedTasks",
  "progress",
  "corrections"
];
function parseEducation(raw) {
  if (!isObject(raw)) throw new AppError("\u6559\u5B66\u6570\u636E\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...EDUCATION_KEYS], "\u6559\u5B66\u6570\u636E");
  const e = new Education();
  e.focusTasks = field(
    raw,
    "focusTasks",
    "\u6559\u5B66\u6570\u636E",
    (v) => asArray(v, "focusTasks").map((x) => {
      ensure(isObject(x), "\u6559\u5B66\u5F85\u529E\u5173\u8054\u5FC5\u987B\u662F\u5BF9\u8C61");
      rejectUnknown(x, ["taskId", "sourceId", "kind"], "\u6559\u5B66\u5F85\u529E\u5173\u8054");
      return {
        taskId: requiredField(x, "taskId", "\u6559\u5B66\u5F85\u529E\u5173\u8054", asStr),
        sourceId: requiredField(x, "sourceId", "\u6559\u5B66\u5F85\u529E\u5173\u8054", asStr),
        kind: oneOf(
          requiredField(x, "kind", "\u6559\u5B66\u5F85\u529E\u5173\u8054", (k) => k),
          "\u6559\u5B66\u5F85\u529E kind",
          ["lesson", "homework"]
        )
      };
    }),
    []
  );
  e.projects = field(
    raw,
    "projects",
    "\u6559\u5B66\u6570\u636E",
    (v) => asArray(v, "projects").map(parseProjectStudy),
    []
  );
  e.resources = field(
    raw,
    "resources",
    "\u6559\u5B66\u6570\u636E",
    (v) => asArray(v, "resources").map(parseResource),
    []
  );
  e.semesters = field(
    raw,
    "semesters",
    "\u6559\u5B66\u6570\u636E",
    (v) => asArray(v, "semesters").map(parseSemester),
    []
  );
  e.semesterHistory = field(
    raw,
    "semesterHistory",
    "\u6559\u5B66\u6570\u636E",
    (v) => asArray(v, "semesterHistory").map(parseSemester),
    []
  );
  e.lessons = field(
    raw,
    "lessons",
    "\u6559\u5B66\u6570\u636E",
    (v) => asArray(v, "lessons").map(parseLesson),
    []
  );
  e.assessments = field(
    raw,
    "assessments",
    "\u6559\u5B66\u6570\u636E",
    (v) => asArray(v, "assessments").map(parseAssessment),
    []
  );
  e.submissions = field(
    raw,
    "submissions",
    "\u6559\u5B66\u6570\u636E",
    (v) => asArray(v, "submissions").map(parseSubmission),
    []
  );
  e.grades = field(
    raw,
    "grades",
    "\u6559\u5B66\u6570\u636E",
    (v) => asArray(v, "grades").map(parseGrade),
    []
  );
  e.reviews = field(
    raw,
    "reviews",
    "\u6559\u5B66\u6570\u636E",
    (v) => asArray(v, "reviews").map(parseReview),
    []
  );
  e.events = field(
    raw,
    "events",
    "\u6559\u5B66\u6570\u636E",
    (v) => asArray(v, "events").map(parseTeachingEvent),
    []
  );
  e.completedTasks = field(
    raw,
    "completedTasks",
    "\u6559\u5B66\u6570\u636E",
    (v) => asArray(v, "completedTasks").map(parseCompletedStudyTask),
    []
  );
  e.progress = field(
    raw,
    "progress",
    "\u6559\u5B66\u6570\u636E",
    (v) => asArray(v, "progress").map(parseProgressRecord),
    []
  );
  e.corrections = field(
    raw,
    "corrections",
    "\u6559\u5B66\u6570\u636E",
    (v) => asArray(v, "corrections").map(parseCorrection),
    []
  );
  return e;
}
function serializeEducation(e) {
  return {
    focusTasks: e.focusTasks.map((t) => ({
      taskId: t.taskId,
      sourceId: t.sourceId,
      kind: t.kind
    })),
    projects: e.projects.map(serializeProjectStudy),
    resources: e.resources.map(serializeResource),
    semesters: e.semesters.map(serializeSemester),
    semesterHistory: e.semesterHistory.map(serializeSemester),
    lessons: e.lessons.map(serializeLesson),
    assessments: e.assessments.map(serializeAssessment),
    submissions: e.submissions.map(serializeSubmission),
    grades: e.grades.map(serializeGrade),
    reviews: e.reviews.map(serializeReview),
    events: e.events.map(serializeTeachingEvent),
    completedTasks: e.completedTasks.map(serializeCompletedStudyTask),
    progress: e.progress.map(serializeProgressRecord),
    corrections: e.corrections.map(serializeCorrection)
  };
}

// packages/core/src/teaching_tasks.ts
function teachingTask(data, taskId) {
  return data.education.focusTasks.find((link) => link.taskId === taskId);
}
function materializeTeachingTasks(data, at) {
  const enabled = new Set(
    data.education.projects.filter((p) => p.examMode).map((p) => p.projectId)
  );
  const sources = [];
  for (const lesson of data.education.lessons) {
    if (enabled.has(lesson.projectId) && dateAt(lesson.startsAt) >= dateAt(at)) {
      sources.push({
        kind: "lesson",
        sourceId: lesson.id,
        projectId: lesson.projectId,
        title: lesson.title,
        notes: lesson.topics.join("\u3001"),
        startsAt: lesson.startsAt,
        minutes: 45
      });
    }
  }
  for (const paper of data.education.assessments) {
    if (paper.kind === "homework" && enabled.has(paper.projectId)) {
      let minutes = 0;
      for (const q of paper.questions) {
        minutes = Math.min(4294967295, minutes + q.estimatedMinutes);
      }
      sources.push({
        kind: "homework",
        sourceId: paper.id,
        projectId: paper.projectId,
        title: paper.title,
        notes: paper.instructions,
        startsAt: paper.startsAt,
        minutes: Math.max(1, minutes)
      });
    }
  }
  const links = /* @__PURE__ */ new Map();
  for (const link of data.education.focusTasks) {
    links.set(link.sourceId, link);
  }
  const positions = /* @__PURE__ */ new Map();
  data.tasks.forEach((task, i) => positions.set(task.id, i));
  const submissions = /* @__PURE__ */ new Map();
  for (const submission of data.education.submissions) {
    const last = submissions.get(submission.assessmentId);
    if (last === void 0 || submission.submittedAt >= last.submittedAt) {
      submissions.set(submission.assessmentId, {
        submittedAt: submission.submittedAt,
        unfinished: submission.unfinished
      });
    }
  }
  let changed = false;
  for (const {
    kind,
    sourceId,
    projectId,
    title,
    notes,
    startsAt,
    minutes
  } of sources) {
    const link = links.get(sourceId);
    const taskId = link !== void 0 && link.kind === kind ? link.taskId : void 0;
    const position = taskId !== void 0 ? positions.get(taskId) : void 0;
    if (taskId !== void 0 && position === void 0) {
      continue;
    }
    const dueDate = dateAt(startsAt);
    const isLesson = kind === "lesson";
    const reminder = isLesson ? hourMinuteString(startsAt) : null;
    const focus = isLesson ? 45 : Math.min(minutes, data.settings.focusMinutes);
    const estimate = Math.max(1, Math.ceil(minutes / focus));
    const scrap = isLesson ? (() => {
      const d = new Date(startsAt * 1e3);
      return Math.max(0, 1440 - d.getHours() * 60 - d.getMinutes() - 45);
    })() : 0;
    let index;
    if (position !== void 0) {
      index = position;
    } else {
      const taskIdNew = id();
      data.education.focusTasks.push({ taskId: taskIdNew, sourceId, kind });
      data.tasks.push({
        id: taskIdNew,
        templateId: null,
        recurring: false,
        title,
        notes,
        projectId,
        habitId: null,
        dueDate,
        reminderTime: reminder,
        focusMinutes: focus,
        scrapMinutes: scrap,
        priority: 1,
        estimate,
        reminderFired: false,
        reminderPending: false,
        reminderExpired: false,
        completed: false,
        completedAt: null,
        createdAt: at,
        tags: [isLesson ? "\u8BFE\u7A0B" : "\u4F5C\u4E1A"],
        subtasks: []
      });
      changed = true;
      index = data.tasks.length - 1;
    }
    const task = data.tasks[index];
    if (!task.completed && (task.title !== title || task.notes !== notes || task.projectId !== projectId || task.dueDate !== dueDate || task.reminderTime !== reminder || task.focusMinutes !== focus || task.estimate !== estimate || task.scrapMinutes !== scrap)) {
      if (task.dueDate !== dueDate || task.reminderTime !== reminder) {
        task.reminderFired = false;
        task.reminderPending = false;
        task.reminderExpired = false;
      }
      task.title = title;
      task.notes = notes;
      task.projectId = projectId;
      task.dueDate = dueDate;
      task.reminderTime = reminder;
      task.focusMinutes = focus;
      task.estimate = estimate;
      task.scrapMinutes = scrap;
      changed = true;
    }
    if (kind === "homework") {
      const submitted = (() => {
        const last = submissions.get(sourceId);
        if (last === void 0 || last.unfinished) return null;
        return last.submittedAt;
      })();
      if (task.completed !== (submitted !== null) || task.completedAt !== submitted) {
        if (submitted !== null && data.timer.taskId === task.id) {
          recordSession(data, at, false);
          data.timer.taskId = null;
          resetTo(data, "focus");
        }
        task.completed = submitted !== null;
        task.completedAt = submitted;
        changed = true;
      }
    }
  }
  return changed;
}
function completeTeachingTask(data, taskId, at) {
  const link = teachingTask(data, taskId);
  if (link === void 0) return;
  if (link.kind === "homework") {
    throw new AppError("\u8BF7\u4ECE\u4F5C\u4E1A\u5165\u53E3\u63D0\u4EA4\u7B54\u5377\uFF0C\u63D0\u4EA4\u5B8C\u6210\u540E\u4F1A\u81EA\u52A8\u5B8C\u6210\u5F85\u529E");
  }
  const lesson = data.education.lessons.find((l) => l.id === link.sourceId);
  ensure(lesson !== void 0, "\u8BFE\u7A0B\u4E0D\u5B58\u5728");
  lesson.attended = true;
  if (lesson.progress.trim().length === 0) {
    lesson.progress = "\u672C\u4EBA\u4ECE\u4ECA\u65E5\u4E13\u6CE8\u786E\u8BA4\u8BFE\u7A0B\u4EFB\u52A1\u5B8C\u6210\uFF0C\u5177\u4F53\u5B66\u4E60\u4F4D\u7F6E\u5F85\u8865\u5145\uFF1B\u638C\u63E1\u60C5\u51B5\u5F85\u590D\u6D4B";
  }
  if (at >= lesson.endsAt) {
    lesson.state = "ended";
    if (lesson.aiEnabled) {
      data.education.event(lesson.projectId, "homework", lesson.id, at);
    }
  }
}
function startTeachingTask(data, at) {
  if (data.timer.mode !== "focus") return;
  const link = data.timer.taskId !== null ? teachingTask(data, data.timer.taskId) : void 0;
  if (link === void 0 || link.kind !== "lesson") return;
  const lesson = data.education.lessons.find((l) => l.id === link.sourceId);
  if (lesson !== void 0) {
    if (at >= lesson.startsAt && at < lesson.endsAt) {
      lesson.attended = true;
    }
  }
}
function validateTeachingTasks(data) {
  const tasks = /* @__PURE__ */ new Set();
  const sources = /* @__PURE__ */ new Set();
  for (const link of data.education.focusTasks) {
    const task = data.tasks.find((t) => t.id === link.taskId);
    ensure(task !== void 0, "\u6559\u5B66\u5F85\u529E\u5173\u8054\u7684\u4EFB\u52A1\u4E0D\u5B58\u5728");
    const project = (() => {
      if (link.kind === "lesson") {
        return data.education.lessons.find((l) => l.id === link.sourceId)?.projectId ?? null;
      }
      return data.education.assessments.find(
        (a) => a.id === link.sourceId && a.kind === "homework"
      )?.projectId ?? null;
    })();
    ensure(project !== null, "\u6559\u5B66\u5F85\u529E\u6765\u6E90\u4E0D\u5B58\u5728\u6216\u7C7B\u578B\u4E0D\u7B26");
    if (task.projectId !== project || tasks.has(link.taskId) || sources.has(link.sourceId) || task.templateId !== null || task.habitId !== null || task.recurring) {
      throw new AppError("\u6559\u5B66\u6765\u6E90\u5FC5\u987B\u5173\u8054\u540C\u9879\u76EE\u7684\u552F\u4E00\u666E\u901A\u4EFB\u52A1");
    }
    tasks.add(link.taskId);
    sources.add(link.sourceId);
  }
}

// packages/core/src/identities.ts
var IDENTITY_KEYS = ["id", "kind", "retired", "restoreTask"];
function parseIdentity(raw) {
  if (!isObject(raw)) throw new AppError("ID \u767B\u8BB0\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...IDENTITY_KEYS], "ID \u767B\u8BB0");
  return {
    id: requiredField(raw, "id", "ID \u767B\u8BB0", asStr),
    kind: requiredField(raw, "kind", "ID \u767B\u8BB0", asStr),
    retired: requiredField(raw, "retired", "ID \u767B\u8BB0", (v) => {
      if (typeof v !== "boolean") throw new AppError("retired \u5FC5\u987B\u662F\u5E03\u5C14\u503C");
      return v;
    }),
    restoreTask: field(
      raw,
      "restoreTask",
      "ID \u767B\u8BB0",
      (v) => asOpt(v, "restoreTask", asStr),
      null
    )
  };
}
function serializeIdentity(i) {
  return {
    id: i.id,
    kind: i.kind,
    retired: i.retired,
    restoreTask: i.restoreTask
  };
}
function activeIdentities(data) {
  const ids = /* @__PURE__ */ new Map();
  const add = (id2, kind) => {
    if (id2.trim().length === 0 || utf8Len(id2) > 200 || ids.has(id2)) {
      throw new AppError("\u72EC\u7ACB\u5B9E\u4F53 ID \u4E3A\u7A7A\u3001\u8FC7\u957F\u6216\u91CD\u590D");
    }
    ids.set(id2, kind);
  };
  for (const x of data.projects) add(x.id, "project");
  for (const x of data.habits) add(x.id, "habit");
  for (const x of data.visions) add(x.id, "vision");
  for (const x of data.blocks) add(x.id, "block");
  for (const x of data.tasks) add(x.id, "task");
  for (const x of data.templates) add(x.id, "template");
  for (const x of data.sessions) add(x.id, "session");
  for (const x of data.education.resources) add(x.id, "resource");
  for (const x of data.education.semesters) add(x.id, "semester");
  for (const x of data.education.lessons) add(x.id, "lesson");
  for (const x of data.education.assessments) add(x.id, "assessment");
  for (const x of data.education.submissions) add(x.id, "submission");
  for (const x of data.education.grades) add(x.id, "grade");
  for (const x of data.education.reviews) add(x.id, "review");
  for (const x of data.education.progress) add(x.id, "progress");
  for (const x of data.education.corrections) add(x.id, "correction");
  return ids;
}
var ALLOWED_KINDS = [
  "project",
  "habit",
  "vision",
  "task",
  "template",
  "session",
  "block",
  "resource",
  "semester",
  "lesson",
  "assessment",
  "submission",
  "grade",
  "review",
  "progress",
  "correction"
];
function reconcileIdentities(before, after, restoreId) {
  const oldActive = activeIdentities(before);
  const newActive = activeIdentities(after);
  const entries = /* @__PURE__ */ new Map();
  for (const record of [...before.identities, ...after.identities]) {
    const old = entries.get(record.id);
    if (old !== void 0) {
      if (old.kind !== record.kind) {
        throw new AppError("\u5386\u53F2 ID \u4E0D\u80FD\u8F6C\u7528\u4E8E\u53E6\u4E00\u79CD\u5B9E\u4F53");
      }
      old.retired = old.retired || record.retired;
      if (old.restoreTask === null) {
        old.restoreTask = record.restoreTask;
      }
    } else {
      entries.set(record.id, { ...record, restoreTask: record.restoreTask });
    }
  }
  for (const [id2, kind] of oldActive) {
    if (!entries.has(id2)) {
      entries.set(id2, { id: id2, kind, retired: false, restoreTask: null });
    }
  }
  const visit = (source, live) => {
    for (const session of source.sessions) {
      const taskId = session.taskId;
      if (taskId === null) continue;
      const record = entries.get(taskId);
      if (record !== void 0) {
        if (record.kind !== "task") {
          throw new AppError("\u5386\u53F2\u4EFB\u52A1\u5F15\u7528\u7684 ID \u4E0E\u5176\u4ED6\u5B9E\u4F53\u51B2\u7A81");
        }
      } else {
        entries.set(taskId, {
          id: taskId,
          kind: "task",
          retired: !live.has(taskId),
          restoreTask: null
        });
      }
    }
  };
  visit(before, oldActive);
  visit(after, newActive);
  for (const [id2, kind] of newActive) {
    const record = entries.get(id2);
    if (record !== void 0) {
      if (record.kind !== kind) {
        throw new AppError("\u5386\u53F2 ID \u4E0D\u80FD\u88AB\u5176\u4ED6\u5B9E\u4F53\u590D\u7528");
      }
      if (record.retired) {
        const sameTask = restoreId === id2 && kind === "task";
        if (!sameTask) {
          throw new AppError(
            "\u5386\u53F2 ID \u5DF2\u88AB\u6C38\u4E45\u4FDD\u7559\uFF0C\u4E0D\u80FD\u7528\u4E8E\u65B0\u5EFA\u6216\u5BFC\u5165\u5176\u4ED6\u5B9E\u4F53"
          );
        }
        record.retired = false;
        record.restoreTask = null;
      }
    } else {
      entries.set(id2, { id: id2, kind, retired: false, restoreTask: null });
    }
  }
  for (const record of entries.values()) {
    if (!newActive.has(record.id)) {
      record.retired = true;
      if (record.kind === "task") {
        const task = before.tasks.find((t) => t.id === record.id);
        if (task !== void 0) {
          record.restoreTask = JSON.stringify(serializeTask(task));
        }
      }
    }
  }
  const records = [...entries.values()].sort(
    (a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  );
  after.identities = records;
}
function validateIdentities(data) {
  const current = activeIdentities(data);
  const seen = /* @__PURE__ */ new Map();
  if (data.identities.length > 1e6) {
    throw new AppError("ID \u5386\u53F2\u6570\u91CF\u8D85\u51FA\u9650\u5236");
  }
  for (const record of data.identities) {
    if (record.id.trim().length === 0 || utf8Len(record.id) > 200 || seen.has(record.id) || !ALLOWED_KINDS.includes(record.kind)) {
      throw new AppError("\u65E0\u6548\u7684 ID \u5386\u53F2\u767B\u8BB0");
    }
    seen.set(record.id, true);
    if (current.has(record.id) && current.get(record.id) !== record.kind) {
      throw new AppError("\u5386\u53F2 ID \u7C7B\u578B\u51B2\u7A81");
    }
    if (record.restoreTask !== null) {
      let task;
      try {
        task = parseTask(JSON.parse(record.restoreTask));
      } catch {
        throw new AppError("\u65E0\u6548\u7684\u4EFB\u52A1\u6062\u590D\u8BB0\u5F55");
      }
      if (record.kind !== "task" || task.id !== record.id || !record.retired) {
        throw new AppError("\u4EFB\u52A1\u6062\u590D\u8BB0\u5F55\u4E0E ID \u767B\u8BB0\u4E0D\u4E00\u81F4");
      }
    }
  }
}

// packages/core/src/plan.ts
var PLAN_FILE_KEYS = [
  "format",
  "version",
  "pomodoroMinutes",
  "projects",
  "tasks",
  "blocks",
  "templates",
  "prints",
  "habits",
  "replace"
];
var PLAN_PROJECT_KEYS = ["id", "name", "color", "appWhitelist"];
var PLAN_TASK_KEYS = [
  "id",
  "title",
  "templateId",
  "habitId",
  "recurring",
  "scrapMinutes",
  "notes",
  "projectId",
  "dueDate",
  "reminderTime",
  "focusMinutes",
  "priority",
  "estimate",
  "tags",
  "subtasks",
  "repeat"
];
var PLAN_SUBTASK_KEYS = ["id", "title"];
function parsePlanFile(raw) {
  if (!isObject(raw)) throw new AppError("\u8BA1\u5212\u6587\u4EF6\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...PLAN_FILE_KEYS], "\u8BA1\u5212\u6587\u4EF6");
  return {
    format: requiredField(raw, "format", "\u8BA1\u5212\u6587\u4EF6", asStr),
    version: requiredField(raw, "version", "\u8BA1\u5212\u6587\u4EF6", asInt),
    pomodoroMinutes: requiredField(raw, "pomodoroMinutes", "\u8BA1\u5212\u6587\u4EF6", asInt),
    projects: requiredField(
      raw,
      "projects",
      "\u8BA1\u5212\u6587\u4EF6",
      (v) => asArray(v, "projects").map(parsePlanProject)
    ),
    tasks: requiredField(
      raw,
      "tasks",
      "\u8BA1\u5212\u6587\u4EF6",
      (v) => asArray(v, "tasks").map(parsePlanTask)
    ),
    blocks: field(
      raw,
      "blocks",
      "\u8BA1\u5212\u6587\u4EF6",
      (v) => asArray(v, "blocks").map(parseBlock),
      []
    ),
    templates: field(
      raw,
      "templates",
      "\u8BA1\u5212\u6587\u4EF6",
      (v) => asArray(v, "templates").map(parseTemplate),
      []
    ),
    prints: field(
      raw,
      "prints",
      "\u8BA1\u5212\u6587\u4EF6",
      (v) => asArray(v, "prints").map(parsePrintRecord),
      []
    ),
    habits: field(
      raw,
      "habits",
      "\u8BA1\u5212\u6587\u4EF6",
      (v) => asArray(v, "habits").map(parseHabit),
      []
    ),
    replace: field(raw, "replace", "\u8BA1\u5212\u6587\u4EF6", asBool, false)
  };
}
function parsePlanProject(raw) {
  if (!isObject(raw)) throw new AppError("\u8BA1\u5212\u9879\u76EE\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...PLAN_PROJECT_KEYS], "\u8BA1\u5212\u9879\u76EE");
  return {
    id: requiredField(raw, "id", "\u8BA1\u5212\u9879\u76EE", asStr),
    name: requiredField(raw, "name", "\u8BA1\u5212\u9879\u76EE", asStr),
    color: requiredField(raw, "color", "\u8BA1\u5212\u9879\u76EE", asStr),
    appWhitelist: field(
      raw,
      "appWhitelist",
      "\u8BA1\u5212\u9879\u76EE",
      (v) => asOpt(
        v,
        "appWhitelist",
        (x) => asArray(x, "appWhitelist").map((a) => asStr(a, "\u5E94\u7528 ID"))
      ),
      null
    )
  };
}
function parsePlanSubtask(raw) {
  if (!isObject(raw)) throw new AppError("\u8BA1\u5212\u5B50\u6B65\u9AA4\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...PLAN_SUBTASK_KEYS], "\u8BA1\u5212\u5B50\u6B65\u9AA4");
  return {
    id: requiredField(raw, "id", "\u8BA1\u5212\u5B50\u6B65\u9AA4", asStr),
    title: requiredField(raw, "title", "\u8BA1\u5212\u5B50\u6B65\u9AA4", asStr)
  };
}
function parsePlanTask(raw) {
  if (!isObject(raw)) throw new AppError("\u8BA1\u5212\u4EFB\u52A1\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...PLAN_TASK_KEYS], "\u8BA1\u5212\u4EFB\u52A1");
  return {
    id: requiredField(raw, "id", "\u8BA1\u5212\u4EFB\u52A1", asStr),
    title: requiredField(raw, "title", "\u8BA1\u5212\u4EFB\u52A1", asStr),
    templateId: field(
      raw,
      "templateId",
      "\u8BA1\u5212\u4EFB\u52A1",
      (v) => asOpt(v, "templateId", asStr),
      null
    ),
    habitId: field(
      raw,
      "habitId",
      "\u8BA1\u5212\u4EFB\u52A1",
      (v) => asOpt(v, "habitId", asStr),
      null
    ),
    recurring: field(raw, "recurring", "\u8BA1\u5212\u4EFB\u52A1", asBool, false),
    scrapMinutes: field(raw, "scrapMinutes", "\u8BA1\u5212\u4EFB\u52A1", asInt, 0),
    notes: field(raw, "notes", "\u8BA1\u5212\u4EFB\u52A1", asStr, ""),
    projectId: field(
      raw,
      "projectId",
      "\u8BA1\u5212\u4EFB\u52A1",
      (v) => asOpt(v, "projectId", asStr),
      null
    ),
    dueDate: field(
      raw,
      "dueDate",
      "\u8BA1\u5212\u4EFB\u52A1",
      (v) => asOpt(v, "dueDate", asStr),
      null
    ),
    reminderTime: field(
      raw,
      "reminderTime",
      "\u8BA1\u5212\u4EFB\u52A1",
      (v) => asOpt(v, "reminderTime", asStr),
      null
    ),
    focusMinutes: field(
      raw,
      "focusMinutes",
      "\u8BA1\u5212\u4EFB\u52A1",
      (v) => asOpt(v, "focusMinutes", (x) => asInt(x, "focusMinutes")),
      null
    ),
    priority: field(raw, "priority", "\u8BA1\u5212\u4EFB\u52A1", asInt, 0),
    estimate: field(raw, "estimate", "\u8BA1\u5212\u4EFB\u52A1", asInt, 1),
    tags: field(
      raw,
      "tags",
      "\u8BA1\u5212\u4EFB\u52A1",
      (v) => asArray(v, "tags").map((t) => asStr(t, "\u6807\u7B7E")),
      []
    ),
    subtasks: field(
      raw,
      "subtasks",
      "\u8BA1\u5212\u4EFB\u52A1",
      (v) => asArray(v, "subtasks").map(parsePlanSubtask),
      []
    ),
    repeat: field(
      raw,
      "repeat",
      "\u8BA1\u5212\u4EFB\u52A1",
      (v) => oneOf(v, "repeat", ["none", "daily", "weekdays", "weekly"]),
      "none"
    )
  };
}
function serializePlanFile(plan) {
  const out = {
    format: plan.format,
    version: plan.version,
    pomodoroMinutes: plan.pomodoroMinutes,
    projects: plan.projects.map((p) => {
      const o = {
        id: p.id,
        name: p.name,
        color: p.color
      };
      if (p.appWhitelist !== null) o["appWhitelist"] = p.appWhitelist;
      return o;
    }),
    tasks: plan.tasks.map((t) => {
      const o = {
        id: t.id,
        title: t.title,
        templateId: t.templateId,
        habitId: t.habitId,
        recurring: t.recurring,
        scrapMinutes: t.scrapMinutes,
        notes: t.notes,
        projectId: t.projectId,
        dueDate: t.dueDate,
        priority: t.priority,
        estimate: t.estimate,
        tags: t.tags,
        subtasks: t.subtasks.map((s) => ({ id: s.id, title: s.title })),
        repeat: t.repeat
      };
      if (t.reminderTime !== null) o["reminderTime"] = t.reminderTime;
      if (t.focusMinutes !== null) o["focusMinutes"] = t.focusMinutes;
      return o;
    }),
    blocks: plan.blocks.map(serializeBlock),
    templates: plan.templates.map(serializeTemplate),
    prints: plan.prints.map(serializePrintRecord),
    habits: plan.habits.map(serializeHabit)
  };
  if (plan.replace) out["replace"] = true;
  return out;
}
function planTaskToTask(t, at, estimate) {
  return {
    id: t.id,
    templateId: t.templateId,
    recurring: t.recurring || t.repeat !== "none",
    title: t.title,
    notes: t.notes,
    projectId: t.projectId,
    habitId: t.habitId,
    dueDate: t.dueDate,
    reminderTime: t.reminderTime,
    focusMinutes: t.focusMinutes,
    reminderFired: false,
    reminderPending: false,
    reminderExpired: false,
    scrapMinutes: t.scrapMinutes,
    priority: t.priority,
    estimate,
    completed: false,
    completedAt: null,
    createdAt: at,
    tags: [...t.tags],
    subtasks: t.subtasks.map((s) => ({
      id: s.id,
      title: s.title,
      done: false
    }))
  };
}
function planTaskMerge(t, old, at, estimate) {
  const task = planTaskToTask(t, at, estimate);
  task.createdAt = old.createdAt;
  task.completed = old.completed;
  task.completedAt = old.completedAt;
  if (old.dueDate === t.dueDate && old.reminderTime === t.reminderTime) {
    task.reminderFired = old.reminderFired;
    task.reminderPending = old.reminderPending;
    task.reminderExpired = old.reminderExpired;
  }
  for (const sub of task.subtasks) {
    const prev = old.subtasks.find((s) => s.id === sub.id);
    if (prev !== void 0) sub.done = prev.done;
  }
  return task;
}
function validatePlanFile(plan) {
  if (plan.format !== "tomato-todo-plan" || plan.version !== 6) {
    throw new AppError("\u4EC5\u652F\u6301\u8BA1\u5212 v6\uFF1B\u65E7\u8BA1\u5212\u8BF7\u6309\u65B0\u683C\u5F0F\u91CD\u65B0\u5BFC\u51FA");
  }
  if (plan.tasks.some((t) => t.repeat !== "none")) {
    throw new AppError("\u5B9E\u4F8B\u4E0D\u62E5\u6709\u91CD\u590D\u89C4\u5219\uFF0C\u8BF7\u4F7F\u7528\u5468\u671F\u6A21\u677F");
  }
  if (plan.pomodoroMinutes < 1 || plan.pomodoroMinutes > 180) {
    throw new AppError("\u8BA1\u5212\u7684\u756A\u8304\u65F6\u957F\u9700\u4E3A 1\u2013180 \u5206\u949F");
  }
  const data = new AppData({
    projects: plan.projects.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      appWhitelist: p.appWhitelist === null ? null : [...p.appWhitelist]
    })),
    tasks: plan.tasks.map((t) => planTaskToTask(t, 0, t.estimate)),
    blocks: plan.blocks.map((b) => ({ ...b, days: [...b.days] })),
    templates: plan.templates,
    prints: plan.prints,
    habits: plan.habits
  });
  data.validate();
}
function planEstimate(t, pomodoro, focus) {
  const estimate = t.focusMinutes !== null ? t.estimate : Math.ceil(t.estimate * pomodoro / focus);
  if (estimate > 99) {
    throw new AppError(`\u4EFB\u52A1\u201C${t.title}\u201D\u6362\u7B97\u540E\u8D85\u8FC7 99 \u4E2A\u756A\u8304\uFF0C\u8BF7\u5148\u62C6\u5206\u4EFB\u52A1`);
  }
  return estimate;
}
function convertedEstimate(estimate, focus, source, destination) {
  const converted = focus !== null ? estimate : Math.ceil(estimate * source / destination);
  if (converted > 99) {
    throw new AppError("\u6362\u7B97\u540E\u8D85\u8FC7 99 \u4E2A\u756A\u8304\uFF0C\u8BF7\u5148\u62C6\u5206\u6A21\u677F");
  }
  return converted;
}
function mergePlan(plan, data, at) {
  validatePlanFile(plan);
  const next = clone(data);
  for (const planProject of plan.projects) {
    const existing = next.projects.find((p) => p.id === planProject.id);
    if (existing !== void 0) {
      existing.name = planProject.name;
      existing.color = planProject.color;
      if (planProject.appWhitelist !== null) {
        existing.appWhitelist = [...planProject.appWhitelist];
      }
    } else {
      next.projects.push({
        id: planProject.id,
        name: planProject.name,
        color: planProject.color,
        appWhitelist: planProject.appWhitelist === null ? null : [...planProject.appWhitelist]
      });
    }
  }
  for (const habit of plan.habits) {
    const existing = next.habits.find((h) => h.id === habit.id);
    if (existing !== void 0) {
      existing.name = habit.name;
    } else {
      next.habits.push({ id: habit.id, name: habit.name });
    }
  }
  for (const block of plan.blocks) {
    const existing = next.blocks.find((b) => b.id === block.id);
    if (existing !== void 0) {
      next.blocks[next.blocks.indexOf(existing)] = {
        ...block,
        days: [...block.days]
      };
    } else {
      next.blocks.push({ ...block, days: [...block.days] });
    }
  }
  for (const planTemplate of plan.templates) {
    const template = clone(planTemplate);
    template.shape.estimate = convertedEstimate(
      template.shape.estimate,
      template.shape.focusMinutes,
      plan.pomodoroMinutes,
      data.settings.focusMinutes
    );
    const existing = next.templates.find((t) => t.id === template.id);
    if (existing !== void 0) {
      next.templates[next.templates.indexOf(existing)] = template;
    } else {
      next.templates.push(template);
    }
  }
  for (const print of plan.prints) {
    if (!next.prints.some(
      (p) => p.templateId === print.templateId && p.date === print.date
    )) {
      next.prints.push({ templateId: print.templateId, date: print.date });
    }
  }
  const incoming = /* @__PURE__ */ new Map();
  for (const t of plan.tasks) incoming.set(t.id, t);
  for (let i = 0; i < next.tasks.length; i += 1) {
    const task = next.tasks[i];
    const planTask = incoming.get(task.id);
    if (planTask === void 0) continue;
    if (data.teachingTask(task.id) !== void 0) {
      throw new AppError("\u8BA1\u5212\u6587\u4EF6\u4E0D\u80FD\u6539\u5199\u6559\u5B66\u5F85\u529E\uFF0C\u8BF7\u8C03\u6574\u5BF9\u5E94\u8BFE\u7A0B\u6216\u4F5C\u4E1A");
    }
    const estimate = planEstimate(
      planTask,
      plan.pomodoroMinutes,
      data.settings.focusMinutes
    );
    const old = clone(task);
    next.tasks[i] = planTaskMerge(planTask, old, at, estimate);
  }
  const localIds = new Set(next.tasks.map((t) => t.id));
  for (const planTask of plan.tasks) {
    if (localIds.has(planTask.id)) continue;
    const estimate = planEstimate(
      planTask,
      plan.pomodoroMinutes,
      data.settings.focusMinutes
    );
    const instance = planTaskToTask(planTask, at, estimate);
    if (instance.templateId !== null) {
      if (!next.prints.some(
        (p) => p.templateId === instance.templateId && p.date === instance.dueDate
      )) {
        next.prints.push({
          templateId: instance.templateId,
          date: instance.dueDate
        });
      }
    }
    next.tasks.push(instance);
  }
  if (plan.replace) {
    const plannedTasks = new Set(plan.tasks.map((t) => t.id));
    next.tasks = next.tasks.filter(
      (t) => t.completed || plannedTasks.has(t.id) || data.teachingTask(t.id) !== void 0
    );
    const plannedHabits = new Set(plan.habits.map((h) => h.id));
    const removedHabits = next.habits.filter((h) => !plannedHabits.has(h.id)).map((h) => h.id);
    if (removedHabits.length > 0) {
      next.habits = next.habits.filter((h) => !removedHabits.includes(h.id));
      for (const task of next.tasks) {
        if (task.habitId !== null && removedHabits.includes(task.habitId))
          task.habitId = null;
      }
      for (const template of next.templates) {
        if (template.shape.habitId !== null && removedHabits.includes(template.shape.habitId)) {
          template.shape.habitId = null;
        }
      }
    }
    const plannedTemplates = new Set(plan.templates.map((t) => t.id));
    const removedTemplates = next.templates.filter((t) => !plannedTemplates.has(t.id)).map((t) => t.id);
    for (const id2 of removedTemplates) {
      deleteTemplate(next, id2);
    }
    const plannedBlocks = new Set(plan.blocks.map((b) => b.id));
    next.blocks = next.blocks.filter((b) => plannedBlocks.has(b.id));
  }
  next.validate();
  replaceAppData(data, next);
}
function exportPlan(data) {
  const tasks = data.tasks.filter((t) => !t.completed && data.teachingTask(t.id) === void 0).map((t) => ({
    templateId: t.templateId,
    habitId: t.habitId,
    recurring: t.recurring,
    scrapMinutes: t.scrapMinutes,
    id: t.id,
    title: t.title,
    notes: t.notes,
    projectId: t.projectId,
    dueDate: t.dueDate,
    reminderTime: t.reminderTime,
    focusMinutes: t.focusMinutes,
    priority: t.priority,
    estimate: t.estimate,
    tags: [...t.tags],
    repeat: "none",
    subtasks: t.subtasks.map((s) => ({ id: s.id, title: s.title }))
  }));
  const used = /* @__PURE__ */ new Set([
    ...tasks.filter((t) => t.projectId !== null).map((t) => t.projectId),
    ...data.templates.filter((t) => t.shape.projectId !== null).map((t) => t.shape.projectId)
  ]);
  return {
    format: "tomato-todo-plan",
    version: 6,
    replace: false,
    blocks: data.blocks.map((b) => ({ ...b, days: [...b.days] })),
    templates: data.templates.map((t) => clone(t)),
    prints: data.prints.map((p) => ({ ...p })),
    habits: data.habits.map((h) => ({ ...h })),
    pomodoroMinutes: data.settings.focusMinutes,
    projects: data.projects.filter((p) => used.has(p.id)).map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      appWhitelist: p.appWhitelist === null ? null : [...p.appWhitelist]
    })),
    tasks
  };
}

// packages/core/src/lib.ts
function parseProject(raw) {
  if (!isObject(raw)) throw new AppError("\u9879\u76EE\u5FC5\u987B\u662F\u5BF9\u8C61");
  return {
    id: requiredField(raw, "id", "\u9879\u76EE", asStr),
    name: requiredField(raw, "name", "\u9879\u76EE", asStr),
    color: requiredField(raw, "color", "\u9879\u76EE", asStr),
    appWhitelist: field(
      raw,
      "appWhitelist",
      "\u9879\u76EE",
      (v) => asOpt(
        v,
        "appWhitelist",
        (x) => asArray(x, "appWhitelist").map((a) => asStr(a, "\u5E94\u7528 ID"))
      ),
      null
    )
  };
}
function serializeProject(p) {
  const out = {
    id: p.id,
    name: p.name,
    color: p.color
  };
  if (p.appWhitelist !== null) out["appWhitelist"] = p.appWhitelist;
  return out;
}
function parseVision(raw) {
  if (!isObject(raw)) throw new AppError("\u613F\u666F\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, ["id", "name", "notes", "projectId"], "\u613F\u666F");
  return {
    id: requiredField(raw, "id", "\u613F\u666F", asStr),
    name: requiredField(raw, "name", "\u613F\u666F", asStr),
    notes: field(raw, "notes", "\u613F\u666F", asStr, ""),
    projectId: field(
      raw,
      "projectId",
      "\u613F\u666F",
      (v) => asOpt(v, "projectId", asStr),
      null
    )
  };
}
function serializeVision(v) {
  const out = {
    id: v.id,
    name: v.name,
    notes: v.notes
  };
  if (v.projectId !== null) out["projectId"] = v.projectId;
  return out;
}
function parseSubtask(raw) {
  if (!isObject(raw)) throw new AppError("\u5B50\u4EFB\u52A1\u5FC5\u987B\u662F\u5BF9\u8C61");
  return {
    id: requiredField(raw, "id", "\u5B50\u4EFB\u52A1", asStr),
    title: requiredField(raw, "title", "\u5B50\u4EFB\u52A1", asStr),
    done: requiredField(raw, "done", "\u5B50\u4EFB\u52A1", asBool)
  };
}
function serializeSubtask(s) {
  return { id: s.id, title: s.title, done: s.done };
}
var TASK_KEYS = [
  "id",
  "templateId",
  "recurring",
  "title",
  "notes",
  "projectId",
  "habitId",
  "dueDate",
  "reminderTime",
  "focusMinutes",
  "scrapMinutes",
  "priority",
  "estimate",
  "reminderFired",
  "reminderPending",
  "reminderExpired",
  "completed",
  "completedAt",
  "createdAt",
  "tags",
  "subtasks"
];
function parseTask(raw) {
  if (!isObject(raw)) throw new AppError("\u4EFB\u52A1\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...TASK_KEYS], "\u4EFB\u52A1");
  return {
    id: requiredField(raw, "id", "\u4EFB\u52A1", asStr),
    templateId: field(
      raw,
      "templateId",
      "\u4EFB\u52A1",
      (v) => asOpt(v, "templateId", asStr),
      null
    ),
    recurring: field(raw, "recurring", "\u4EFB\u52A1", asBool, false),
    title: requiredField(raw, "title", "\u4EFB\u52A1", asStr),
    notes: requiredField(raw, "notes", "\u4EFB\u52A1", asStr),
    projectId: field(
      raw,
      "projectId",
      "\u4EFB\u52A1",
      (v) => asOpt(v, "projectId", asStr),
      null
    ),
    habitId: field(
      raw,
      "habitId",
      "\u4EFB\u52A1",
      (v) => asOpt(v, "habitId", asStr),
      null
    ),
    dueDate: field(
      raw,
      "dueDate",
      "\u4EFB\u52A1",
      (v) => asOpt(v, "dueDate", asStr),
      null
    ),
    reminderTime: field(
      raw,
      "reminderTime",
      "\u4EFB\u52A1",
      (v) => asOpt(v, "reminderTime", asStr),
      null
    ),
    focusMinutes: field(
      raw,
      "focusMinutes",
      "\u4EFB\u52A1",
      (v) => asOpt(v, "focusMinutes", (x) => asInt(x, "focusMinutes")),
      null
    ),
    scrapMinutes: field(raw, "scrapMinutes", "\u4EFB\u52A1", asInt, 0),
    priority: requiredField(raw, "priority", "\u4EFB\u52A1", asInt),
    estimate: requiredField(raw, "estimate", "\u4EFB\u52A1", asInt),
    reminderFired: field(raw, "reminderFired", "\u4EFB\u52A1", asBool, false),
    reminderPending: field(raw, "reminderPending", "\u4EFB\u52A1", asBool, false),
    reminderExpired: field(raw, "reminderExpired", "\u4EFB\u52A1", asBool, false),
    completed: requiredField(raw, "completed", "\u4EFB\u52A1", asBool),
    completedAt: field(
      raw,
      "completedAt",
      "\u4EFB\u52A1",
      (v) => asOpt(v, "completedAt", asInt),
      null
    ),
    createdAt: requiredField(raw, "createdAt", "\u4EFB\u52A1", asInt),
    tags: field(
      raw,
      "tags",
      "\u4EFB\u52A1",
      (v) => asArray(v, "tags").map((t) => asStr(t, "\u6807\u7B7E")),
      []
    ),
    subtasks: field(
      raw,
      "subtasks",
      "\u4EFB\u52A1",
      (v) => asArray(v, "subtasks").map(parseSubtask),
      []
    )
  };
}
function serializeTask(t) {
  return {
    id: t.id,
    templateId: t.templateId,
    recurring: t.recurring,
    title: t.title,
    notes: t.notes,
    projectId: t.projectId,
    habitId: t.habitId,
    dueDate: t.dueDate,
    reminderTime: t.reminderTime,
    focusMinutes: t.focusMinutes,
    scrapMinutes: t.scrapMinutes,
    priority: t.priority,
    estimate: t.estimate,
    reminderFired: t.reminderFired,
    reminderPending: t.reminderPending,
    reminderExpired: t.reminderExpired,
    completed: t.completed,
    completedAt: t.completedAt,
    createdAt: t.createdAt,
    tags: t.tags,
    subtasks: t.subtasks.map(serializeSubtask)
  };
}
var TASK_DRAFT_KEYS = [
  "id",
  "title",
  "notes",
  "projectId",
  "dueDate",
  "reminderTime",
  "focusMinutes",
  "scrapMinutes",
  "priority",
  "estimate",
  "tags",
  "subtasks",
  "repeat"
];
function parseTaskDraft(raw) {
  if (!isObject(raw)) throw new AppError("\u4EFB\u52A1\u8349\u7A3F\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...TASK_DRAFT_KEYS], "\u4EFB\u52A1\u8349\u7A3F");
  return {
    id: field(raw, "id", "\u4EFB\u52A1\u8349\u7A3F", (v) => asOpt(v, "id", asStr), null),
    title: requiredField(raw, "title", "\u4EFB\u52A1\u8349\u7A3F", asStr),
    notes: field(raw, "notes", "\u4EFB\u52A1\u8349\u7A3F", asStr, ""),
    projectId: field(
      raw,
      "projectId",
      "\u4EFB\u52A1\u8349\u7A3F",
      (v) => asOpt(v, "projectId", asStr),
      null
    ),
    dueDate: field(
      raw,
      "dueDate",
      "\u4EFB\u52A1\u8349\u7A3F",
      (v) => asOpt(v, "dueDate", asStr),
      null
    ),
    reminderTime: field(
      raw,
      "reminderTime",
      "\u4EFB\u52A1\u8349\u7A3F",
      (v) => asOpt(v, "reminderTime", asStr),
      null
    ),
    focusMinutes: field(
      raw,
      "focusMinutes",
      "\u4EFB\u52A1\u8349\u7A3F",
      (v) => asOpt(v, "focusMinutes", (x) => asInt(x, "focusMinutes")),
      null
    ),
    scrapMinutes: field(raw, "scrapMinutes", "\u4EFB\u52A1\u8349\u7A3F", asInt, 0),
    priority: field(raw, "priority", "\u4EFB\u52A1\u8349\u7A3F", asInt, 0),
    estimate: field(raw, "estimate", "\u4EFB\u52A1\u8349\u7A3F", asInt, 1),
    tags: field(
      raw,
      "tags",
      "\u4EFB\u52A1\u8349\u7A3F",
      (v) => asArray(v, "tags").map((t) => asStr(t, "\u6807\u7B7E")),
      []
    ),
    subtasks: field(
      raw,
      "subtasks",
      "\u4EFB\u52A1\u8349\u7A3F",
      (v) => asArray(v, "subtasks").map(parseSubtask),
      []
    ),
    repeat: field(
      raw,
      "repeat",
      "\u4EFB\u52A1\u8349\u7A3F",
      (v) => oneOf(v, "repeat", ["none", "daily", "weekdays", "weekly"]),
      "none"
    )
  };
}
function parseHabitSlot(raw) {
  if (!isObject(raw)) throw new AppError("\u4E60\u60EF\u65F6\u6BB5\u5FC5\u987B\u662F\u5BF9\u8C61");
  return {
    days: asArray(
      requiredField(raw, "days", "\u4E60\u60EF\u65F6\u6BB5", (v) => v),
      "days"
    ).map((d) => asInt(d, "\u4E60\u60EF\u661F\u671F")),
    time: requiredField(raw, "time", "\u4E60\u60EF\u65F6\u6BB5", asStr)
  };
}
function parseProtection(raw) {
  if (!isObject(raw)) throw new AppError("\u4FDD\u62A4\u8BBE\u7F6E\u5FC5\u987B\u662F\u5BF9\u8C61");
  return {
    mode: field(
      raw,
      "mode",
      "\u4FDD\u62A4\u8BBE\u7F6E",
      (v) => oneOf(v, "\u4FDD\u62A4 mode", ["off", "lock", "whitelist"]),
      "off"
    ),
    whitelist: field(
      raw,
      "whitelist",
      "\u4FDD\u62A4\u8BBE\u7F6E",
      (v) => asArray(v, "whitelist").map((a) => asStr(a, "\u5E94\u7528 ID")),
      []
    ),
    strict: field(raw, "strict", "\u4FDD\u62A4\u8BBE\u7F6E", asBool, false)
  };
}
function serializeProtection(p) {
  return { mode: p.mode, whitelist: p.whitelist, strict: p.strict };
}
function parseSettings(raw) {
  if (!isObject(raw)) throw new AppError("\u8BBE\u7F6E\u5FC5\u987B\u662F\u5BF9\u8C61");
  return {
    focusMinutes: requiredField(raw, "focusMinutes", "\u8BBE\u7F6E", asInt),
    shortBreakMinutes: requiredField(raw, "shortBreakMinutes", "\u8BBE\u7F6E", asInt),
    longBreakMinutes: requiredField(raw, "longBreakMinutes", "\u8BBE\u7F6E", asInt),
    longBreakEvery: requiredField(raw, "longBreakEvery", "\u8BBE\u7F6E", asInt),
    dailyGoal: requiredField(raw, "dailyGoal", "\u8BBE\u7F6E", asInt),
    autoBreak: requiredField(raw, "autoBreak", "\u8BBE\u7F6E", asBool),
    autoFocus: requiredField(raw, "autoFocus", "\u8BBE\u7F6E", asBool),
    autoStartTasks: field(raw, "autoStartTasks", "\u8BBE\u7F6E", asBool, false),
    sound: requiredField(raw, "sound", "\u8BBE\u7F6E", asBool),
    soundVolume: field(raw, "soundVolume", "\u8BBE\u7F6E", asInt, 100),
    notifications: requiredField(raw, "notifications", "\u8BBE\u7F6E", asBool),
    alwaysOnTop: requiredField(raw, "alwaysOnTop", "\u8BBE\u7F6E", asBool),
    theme: requiredField(raw, "theme", "\u8BBE\u7F6E", asStr),
    personaBackdrop: field(raw, "personaBackdrop", "\u8BBE\u7F6E", asBool, false),
    protection: field(raw, "protection", "\u8BBE\u7F6E", parseProtection, {
      mode: "off",
      whitelist: [],
      strict: false
    })
  };
}
function serializeSettings(s) {
  return {
    focusMinutes: s.focusMinutes,
    shortBreakMinutes: s.shortBreakMinutes,
    longBreakMinutes: s.longBreakMinutes,
    longBreakEvery: s.longBreakEvery,
    dailyGoal: s.dailyGoal,
    autoBreak: s.autoBreak,
    autoFocus: s.autoFocus,
    autoStartTasks: s.autoStartTasks,
    sound: s.sound,
    soundVolume: s.soundVolume,
    notifications: s.notifications,
    alwaysOnTop: s.alwaysOnTop,
    theme: s.theme,
    personaBackdrop: s.personaBackdrop,
    protection: serializeProtection(s.protection)
  };
}
function defaultSettings() {
  return {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakEvery: 4,
    dailyGoal: 8,
    autoBreak: false,
    autoFocus: false,
    autoStartTasks: false,
    sound: true,
    soundVolume: 100,
    notifications: true,
    alwaysOnTop: false,
    theme: "light",
    personaBackdrop: false,
    protection: { mode: "off", whitelist: [], strict: false }
  };
}
function parseTimer(raw) {
  if (!isObject(raw)) throw new AppError("\u8BA1\u65F6\u5668\u5FC5\u987B\u662F\u5BF9\u8C61");
  return {
    mode: oneOf(
      requiredField(raw, "mode", "\u8BA1\u65F6\u5668", (v) => v),
      "\u8BA1\u65F6\u5668 mode",
      ["focus", "shortBreak", "longBreak"]
    ),
    running: requiredField(raw, "running", "\u8BA1\u65F6\u5668", asBool),
    taskId: field(
      raw,
      "taskId",
      "\u8BA1\u65F6\u5668",
      (v) => asOpt(v, "taskId", asStr),
      null
    ),
    durationSecs: requiredField(raw, "durationSecs", "\u8BA1\u65F6\u5668", asInt),
    remainingSecs: requiredField(raw, "remainingSecs", "\u8BA1\u65F6\u5668", asInt),
    deadline: field(
      raw,
      "deadline",
      "\u8BA1\u65F6\u5668",
      (v) => asOpt(v, "deadline", asInt),
      null
    ),
    startedAt: field(
      raw,
      "startedAt",
      "\u8BA1\u65F6\u5668",
      (v) => asOpt(v, "startedAt", asInt),
      null
    ),
    cycle: requiredField(raw, "cycle", "\u8BA1\u65F6\u5668", asInt),
    cycleDate: field(
      raw,
      "cycleDate",
      "\u8BA1\u65F6\u5668",
      (v) => asOpt(v, "cycleDate", asStr),
      null
    ),
    completionSerial: requiredField(raw, "completionSerial", "\u8BA1\u65F6\u5668", asInt),
    lastFinishedMode: field(
      raw,
      "lastFinishedMode",
      "\u8BA1\u65F6\u5668",
      (v) => asOpt(
        v,
        "lastFinishedMode",
        (x) => oneOf(x, "lastFinishedMode", ["focus", "shortBreak", "longBreak"])
      ),
      null
    ),
    autoFocusBlocked: field(raw, "autoFocusBlocked", "\u8BA1\u65F6\u5668", asBool, false)
  };
}
function serializeTimer(t) {
  return {
    mode: t.mode,
    running: t.running,
    taskId: t.taskId,
    durationSecs: t.durationSecs,
    remainingSecs: t.remainingSecs,
    deadline: t.deadline,
    startedAt: t.startedAt,
    cycle: t.cycle,
    cycleDate: t.cycleDate,
    completionSerial: t.completionSerial,
    lastFinishedMode: t.lastFinishedMode,
    autoFocusBlocked: t.autoFocusBlocked
  };
}
function defaultTimer() {
  return {
    mode: "focus",
    running: false,
    taskId: null,
    durationSecs: 1500,
    remainingSecs: 1500,
    deadline: null,
    startedAt: null,
    cycle: 0,
    cycleDate: null,
    completionSerial: 0,
    lastFinishedMode: null,
    autoFocusBlocked: false
  };
}
function parseSession(raw) {
  if (!isObject(raw)) throw new AppError("\u4E13\u6CE8\u8BB0\u5F55\u5FC5\u987B\u662F\u5BF9\u8C61");
  return {
    id: requiredField(raw, "id", "\u4E13\u6CE8\u8BB0\u5F55", asStr),
    source: field(
      raw,
      "source",
      "\u4E13\u6CE8\u8BB0\u5F55",
      (v) => oneOf(v, "source", ["timer", "taskEstimate"]),
      "timer"
    ),
    taskId: field(
      raw,
      "taskId",
      "\u4E13\u6CE8\u8BB0\u5F55",
      (v) => asOpt(v, "taskId", asStr),
      null
    ),
    taskTitle: requiredField(raw, "taskTitle", "\u4E13\u6CE8\u8BB0\u5F55", asStr),
    projectName: requiredField(raw, "projectName", "\u4E13\u6CE8\u8BB0\u5F55", asStr),
    startedAt: requiredField(raw, "startedAt", "\u4E13\u6CE8\u8BB0\u5F55", asInt),
    endedAt: requiredField(raw, "endedAt", "\u4E13\u6CE8\u8BB0\u5F55", asInt),
    durationSecs: requiredField(raw, "durationSecs", "\u4E13\u6CE8\u8BB0\u5F55", asInt),
    completed: requiredField(raw, "completed", "\u4E13\u6CE8\u8BB0\u5F55", asBool)
  };
}
function serializeSession(s) {
  return {
    id: s.id,
    source: s.source,
    taskId: s.taskId,
    taskTitle: s.taskTitle,
    projectName: s.projectName,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    durationSecs: s.durationSecs,
    completed: s.completed
  };
}
var AppData = class {
  education;
  version;
  identities;
  tasks;
  blocks;
  templates;
  prints;
  projects;
  habits;
  visions;
  settings;
  timer;
  sessions;
  lock;
  constructor(init) {
    this.education = init?.education ?? new Education();
    this.version = init?.version ?? 4;
    this.identities = init?.identities ?? [];
    this.tasks = init?.tasks ?? [];
    this.blocks = init?.blocks ?? [];
    this.templates = init?.templates ?? [];
    this.prints = init?.prints ?? [];
    this.projects = init?.projects ?? [
      { id: id(), name: "\u5DE5\u4F5C", color: "#df7561", appWhitelist: null },
      { id: id(), name: "\u5B66\u4E60", color: "#849b7d", appWhitelist: null },
      { id: id(), name: "\u751F\u6D3B", color: "#d5a553", appWhitelist: null }
    ];
    this.habits = init?.habits ?? [];
    this.visions = init?.visions ?? [];
    this.settings = init?.settings ?? defaultSettings();
    this.timer = init?.timer ?? defaultTimer();
    this.sessions = init?.sessions ?? [];
    this.lock = init?.lock ?? {
      schedules: [],
      active: null,
      suppressedUntil: 0
    };
  }
  protected() {
    return this.lock.active !== null || this.timer.running && this.timer.mode === "focus" && this.settings.protection.mode !== "off";
  }
  /** 白名单专注时生效的应用清单：项目专属清单替代通用清单。 */
  effectiveWhitelist() {
    const project = (() => {
      const taskId = this.timer.taskId;
      if (taskId === null) return void 0;
      const task = this.tasks.find((t) => t.id === taskId);
      if (task === void 0 || task.projectId === null) return void 0;
      return this.projects.find((p) => p.id === task.projectId);
    })();
    const list = project?.appWhitelist;
    return list !== null && list !== void 0 ? [...list] : [...this.settings.protection.whitelist];
  }
  taskIsVoid(task) {
    return taskIsVoid(task);
  }
  strictProtected() {
    return this.lock.active !== null && this.lock.active.strict || this.timer.running && this.timer.mode === "focus" && this.settings.protection.mode !== "off" && this.settings.protection.strict;
  }
  durationOf(mode) {
    return durationOf(this, mode);
  }
  taskHasRoundsLeft(task) {
    return taskHasRoundsLeft(this, task);
  }
  resetTo(mode) {
    resetTo(this, mode);
  }
  start(at) {
    startTimer(this, at);
  }
  record(at, completed) {
    recordSession(this, at, completed);
  }
  refreshCycle(at) {
    const date = dateAt(at);
    if (this.timer.cycleDate === date) return false;
    this.timer.cycle = this.sessions.filter(
      (s) => s.completed && dateAt(s.endedAt) === date
    ).length;
    this.timer.cycleDate = date;
    return true;
  }
  /** 停机后最多推进一个阶段：绝不伪造无人值守的专注会话。 */
  tick(at) {
    const teachingChanged = this.education.tick(at);
    const teachingTasksChanged = materializeTeachingTasks(this, at);
    const materialized = materializeTemplates(this, at) || teachingChanged || teachingTasksChanged;
    const remindersChanged = tickReminders(this, at);
    const changed = this.tickWithLock(at) || materialized;
    const cycleChanged = this.refreshCycle(at);
    if (cycleChanged && this.timer.cycle === 0 && this.timer.mode !== "focus" && !this.timer.running && this.timer.startedAt === null && this.timer.remainingSecs === this.timer.durationSecs) {
      this.resetTo("focus");
    }
    return startDueTask(this, at) || remindersChanged || changed || cycleChanged;
  }
  tickWithLock(at) {
    const previous = JSON.stringify(serializeLockState(this.lock));
    if (this.lock.active !== null && at >= this.lock.active.endsAt) {
      this.lock.active = null;
    }
    const scheduled = scheduledAt(this.lock, at);
    if (scheduled !== null) {
      if (this.lock.active !== null) {
        scheduled.startedAt = Math.min(
          this.lock.active.startedAt,
          scheduled.startedAt
        );
        scheduled.endsAt = Math.max(this.lock.active.endsAt, scheduled.endsAt);
        scheduled.strict = scheduled.strict || this.lock.active.strict;
      }
      this.lock.active = scheduled;
    }
    const changed = previous !== JSON.stringify(serializeLockState(this.lock));
    if (this.lock.active !== null) {
      const start = this.lock.active.startedAt;
      if (this.timer.running) {
        const stop = Math.min(
          Math.max(start, this.timer.startedAt ?? start),
          at
        );
        this.tickTimer(stop);
        this.record(stop, false);
        this.resetTo("focus");
        return true;
      }
      return changed;
    }
    return this.tickTimer(at) || changed;
  }
  tickTimer(at) {
    if (!this.timer.running || timerRemaining(this.timer, at) > 0) {
      return false;
    }
    const end = this.timer.deadline ?? at;
    this.finishTimer(end, at);
    return true;
  }
  finishTimer(end, at) {
    const finished = this.timer.mode;
    const continuationBlocked = this.timer.autoFocusBlocked;
    if (finished === "focus") {
      this.refreshCycle(end);
    }
    this.record(end, true);
    if (finished === "focus") {
      this.timer.cycle = Math.min(this.timer.cycle + 1, 4294967295);
    }
    const next = finished === "focus" ? this.timer.cycle % this.settings.longBreakEvery === 0 ? "longBreak" : "shortBreak" : "focus";
    this.resetTo(next);
    this.timer.completionSerial = Math.min(
      this.timer.completionSerial + 1,
      Number.MAX_SAFE_INTEGER
    );
    this.timer.lastFinishedMode = finished;
    const auto = next === "focus" ? this.settings.autoFocus && !continuationBlocked && (this.timer.taskId === null || (() => {
      const task = this.tasks.find((t) => t.id === this.timer.taskId);
      return task !== void 0 && this.taskHasRoundsLeft(task);
    })()) && !(this.settings.autoStartTasks && dueAutoTask(this) !== null) : this.settings.autoBreak;
    if (auto && at - end < 5) {
      this.start(at);
    }
  }
  /** 预检 + 执行 + 教学待办生成 + 全量校验。 */
  apply(action, at) {
    this.tick(at);
    if (this.strictProtected()) {
      throw new AppError("\u4E25\u683C\u6A21\u5F0F\u751F\u6548\u4E2D\uFF0C\u4E0D\u80FD\u63D0\u524D\u7ED3\u675F\u6216\u4FEE\u6539\uFF1B\u5230\u65F6\u81EA\u52A8\u89E3\u9664");
    }
    if (this.protected() && action.type !== "emergencyUnlock" && action.type !== "completeFocus") {
      throw new AppError(
        "\u4E13\u6CE8\u4FDD\u62A4\u4E2D\uFF0C\u7ED3\u675F\u524D\u4E0D\u80FD\u4FEE\u6539\u4EFB\u52A1\u6216\u8BA1\u65F6\uFF1B\u53EF\u63D0\u524D\u5B8C\u6210\u756A\u8304\u6216\u7D27\u6025\u9000\u51FA"
      );
    }
    switch (action.type) {
      case "education": {
        if (action.command.op === "startExam" && (!this.reminderIdle() || this.timer.mode !== "focus" || this.timer.remainingSecs !== this.timer.durationSecs)) {
          throw new AppError("\u8BF7\u5148\u7ED3\u675F\u5F53\u524D\u8BA1\u65F6\u6216\u9501\u673A\uFF0C\u518D\u5F00\u59CB\u8003\u8BD5");
        }
        this.education.apply(action.command, at);
        break;
      }
      case "printInstances":
        printInstances(this, action.shape, action.printing, at);
        break;
      case "saveTemplate": {
        const id2 = action.template.id;
        saveTemplate(this, action.template);
        this.validate();
        if (action.printDates.length > 0) {
          printTemplate(this, id2, action.printDates, at);
        }
        break;
      }
      case "deleteTemplate":
        deleteTemplate(this, action.id);
        break;
      case "printTemplate":
        printTemplate(this, action.id, action.dates, at);
        break;
      case "syncTemplate":
        syncTemplate(this, action.id);
        break;
      case "startReminder": {
        if (!this.reminderIdle()) {
          throw new AppError("\u8BF7\u5148\u7ED3\u675F\u5F53\u524D\u8BA1\u65F6");
        }
        const t = this.tasks.find(
          (x) => x.id === action.id && !x.completed && x.reminderPending
        );
        if (t === void 0) {
          throw new AppError("\u63D0\u9192\u5DF2\u5931\u6548");
        }
        t.reminderPending = false;
        this.timer.taskId = action.id;
        this.resetTo("focus");
        startTeachingTask(this, at);
        this.start(at);
        break;
      }
      case "emergencyUnlock": {
        this.record(at, false);
        this.resetTo("focus");
        releaseLock(this.lock, at);
        break;
      }
      case "rearmLock": {
        this.lock.suppressedUntil = 0;
        this.tick(at);
        break;
      }
      case "completeFocus": {
        if (this.lock.active !== null || this.timer.mode !== "focus" || this.timer.startedAt === null) {
          throw new AppError("\u5F53\u524D\u6CA1\u6709\u53EF\u63D0\u524D\u5B8C\u6210\u7684\u4E13\u6CE8");
        }
        if (timerRemaining(this.timer, at) === this.timer.durationSecs) {
          throw new AppError("\u5C1A\u65E0\u4E13\u6CE8\u7528\u65F6\uFF0C\u8BF7\u7A0D\u540E\u518D\u5B8C\u6210");
        }
        this.finishTimer(at, at);
        break;
      }
      case "saveLockSchedule": {
        const index = this.lock.schedules.findIndex(
          (s) => s.id === action.schedule.id
        );
        if (index >= 0) {
          this.lock.schedules[index] = action.schedule;
        } else {
          this.lock.schedules.push(action.schedule);
        }
        validateLock(this.lock);
        this.lock.suppressedUntil = 0;
        this.tick(at);
        break;
      }
      case "deleteLockSchedule":
        this.lock.schedules = this.lock.schedules.filter(
          (s) => s.id !== action.id
        );
        break;
      case "startQuickLock": {
        if (action.minutes < 1 || action.minutes > 720) {
          throw new AppError("\u5FEB\u901F\u9501\u673A\u65F6\u957F\u9700\u4E3A 1\u2013720 \u5206\u949F");
        }
        this.record(at, false);
        this.resetTo("focus");
        this.lock.active = {
          name: "\u5C0F\u61A9",
          startedAt: at,
          endsAt: at + action.minutes * 60,
          strict: action.strict
        };
        break;
      }
      case "saveTask": {
        const d = action.task;
        if (d.id !== null && teachingTask(this, d.id) !== void 0) {
          throw new AppError(
            "\u6559\u5B66\u5F85\u529E\u968F\u8BFE\u7A0B\u6216\u4F5C\u4E1A\u5B89\u6392\u66F4\u65B0\uFF0C\u8BF7\u8C03\u6574\u5BF9\u5E94\u6559\u5B66\u5B89\u6392"
          );
        }
        const existingIndex = d.id !== null ? this.tasks.findIndex((t) => t.id === d.id) : -1;
        if (d.id !== null && existingIndex < 0) {
          throw new AppError("\u4EFB\u52A1\u4E0D\u5B58\u5728\uFF0C\u53EF\u80FD\u5DF2\u7ECF\u88AB\u5220\u9664");
        }
        const old = existingIndex >= 0 ? this.tasks[existingIndex] : void 0;
        const task = {
          templateId: old?.templateId ?? null,
          recurring: old?.recurring ?? false,
          id: d.id ?? id(),
          title: d.title.trim(),
          notes: d.notes,
          projectId: d.projectId,
          habitId: old?.habitId ?? null,
          reminderFired: old !== void 0 && old.dueDate === d.dueDate && old.reminderTime === d.reminderTime && old.reminderFired,
          reminderPending: old !== void 0 && old.dueDate === d.dueDate && old.reminderTime === d.reminderTime && old.reminderPending,
          reminderExpired: old !== void 0 && old.dueDate === d.dueDate && old.reminderTime === d.reminderTime && old.reminderExpired,
          scrapMinutes: d.scrapMinutes,
          focusMinutes: d.focusMinutes,
          reminderTime: d.reminderTime,
          dueDate: d.dueDate,
          priority: d.priority,
          estimate: d.estimate,
          completed: old?.completed ?? false,
          completedAt: old?.completedAt ?? null,
          createdAt: old?.createdAt ?? at,
          tags: d.tags.map((t) => t.trim()).filter((t) => t.length > 0),
          subtasks: d.subtasks.map((s) => ({
            id: s.id,
            title: s.title,
            done: s.done
          }))
        };
        if (d.repeat !== "none") {
          const template = fromTask(task, d.repeat, at);
          task.templateId = template.id;
          task.recurring = true;
          this.prints.push({ templateId: template.id, date: task.dueDate });
          this.templates.push(template);
        }
        if (existingIndex >= 0) {
          this.tasks[existingIndex] = task;
        } else {
          this.tasks.push(task);
        }
        break;
      }
      case "toggleTask": {
        const taskId = action.id;
        if (this.tasks.some((t2) => t2.id === taskId && this.taskIsVoid(t2))) {
          throw new AppError("\u4F5C\u5E9F\u5B9E\u4F8B\u4E0D\u80FD\u5B8C\u6210");
        }
        const task = this.tasks.find((t2) => t2.id === taskId);
        ensure(task !== void 0, "\u4EFB\u52A1\u4E0D\u5B58\u5728");
        const taskCopy = {
          ...task,
          tags: [...task.tags],
          subtasks: task.subtasks.map((s) => ({ ...s }))
        };
        if (teachingTask(this, taskId) !== void 0 && !taskCopy.completed) {
          completeTeachingTask(this, taskId, at);
        }
        if (!taskCopy.completed && this.timer.taskId === taskId) {
          const focusing = this.timer.mode === "focus";
          if (focusing) {
            this.record(at, false);
          }
          this.timer.taskId = null;
          if (focusing) {
            this.resetTo("focus");
          } else {
            this.timer.autoFocusBlocked = true;
          }
        }
        this.sessions = this.sessions.filter(
          (s) => !(s.source === "taskEstimate" && s.taskId === taskId)
        );
        if (!taskCopy.completed) {
          const actual = this.sessions.filter((s) => s.taskId === taskId).reduce((n, s) => n + s.durationSecs, 0);
          const expected = taskCopy.estimate * (taskCopy.focusMinutes ?? this.settings.focusMinutes) * 60;
          const missing = Math.max(0, expected - actual);
          if (missing > 0) {
            const project = taskCopy.projectId !== null ? this.projects.find((p) => p.id === taskCopy.projectId) : void 0;
            this.sessions.push({
              id: id(),
              source: "taskEstimate",
              taskId,
              taskTitle: taskCopy.title,
              projectName: project?.name ?? "\u672A\u5206\u7C7B",
              startedAt: at,
              endedAt: at,
              durationSecs: missing,
              completed: false
            });
          }
        }
        const t = this.tasks.find((x) => x.id === taskId);
        t.completed = !t.completed;
        t.completedAt = t.completed ? at : null;
        if (t.completed) {
          this.education.taskCompleted(t, at);
        }
        break;
      }
      case "deleteTask": {
        if (teachingTask(this, action.id) !== void 0) {
          throw new AppError("\u6559\u5B66\u5F85\u529E\u7531\u5BF9\u5E94\u8BFE\u7A0B\u6216\u4F5C\u4E1A\u7EF4\u62A4\uFF0C\u4E0D\u80FD\u5355\u72EC\u5220\u9664");
        }
        if (!this.tasks.some((t) => t.id === action.id)) {
          throw new AppError("\u4EFB\u52A1\u4E0D\u5B58\u5728");
        }
        if (this.timer.taskId === action.id) {
          this.record(at, false);
          this.resetTo(this.timer.mode);
          this.timer.taskId = null;
        }
        this.tasks = this.tasks.filter((t) => t.id !== action.id);
        break;
      }
      case "restoreTask": {
        const task = action.task;
        if (this.tasks.some((t) => t.id === task.id)) {
          throw new AppError("\u4EFB\u52A1\u5DF2\u7ECF\u5B58\u5728");
        }
        if (task.projectId !== null && !this.projects.some((p) => p.id === task.projectId)) {
          task.projectId = null;
        }
        if (task.templateId !== null && !this.templates.some((t) => t.id === task.templateId)) {
          task.templateId = null;
        }
        if (task.habitId !== null && !this.habits.some((h) => h.id === task.habitId)) {
          task.habitId = null;
        }
        this.tasks.push(task);
        break;
      }
      case "toggleSubtask": {
        const sub = this.tasks.find((t) => t.id === action.taskId)?.subtasks.find((s) => s.id === action.subtaskId);
        ensure(sub !== void 0, "\u5B50\u4EFB\u52A1\u4E0D\u5B58\u5728");
        sub.done = !sub.done;
        break;
      }
      case "saveProject": {
        if (action.id !== null) {
          const p = this.projects.find((x) => x.id === action.id);
          ensure(p !== void 0, "\u9879\u76EE\u4E0D\u5B58\u5728");
          p.name = action.name.trim();
          p.color = action.color;
        } else {
          ensure(
            action.directory !== null && isAbsolutePath(action.directory),
            "\u65B0\u9879\u76EE\u5FC5\u987B\u7ED1\u5B9A\u8D44\u6599\u76EE\u5F55\uFF1B\u8BF7\u5728\u9879\u76EE\u9875\u9009\u62E9\u76EE\u5F55\u5E76\u6388\u6743"
          );
          const projectId = id();
          this.education.projects.push({
            projectId,
            directory: action.directory,
            examMode: false,
            visionId: null,
            target: "",
            examDate: null,
            syllabusId: null,
            pastPaperIds: [],
            mockPaperIds: []
          });
          this.projects.push({
            id: projectId,
            name: action.name.trim(),
            color: action.color,
            appWhitelist: null
          });
        }
        break;
      }
      case "renameProjectDirectory": {
        const project = this.projects.find((x) => x.id === action.id);
        ensure(project !== void 0, "\u9879\u76EE\u4E0D\u5B58\u5728");
        const profile = this.education.projects.find(
          (p) => p.projectId === action.id
        );
        ensure(profile !== void 0, "\u9879\u76EE\u6CA1\u6709\u7ED1\u5B9A\u8D44\u6599\u76EE\u5F55");
        ensure(isAbsolutePath(action.directory), "\u8D44\u6599\u76EE\u5F55\u5FC5\u987B\u662F\u7EDD\u5BF9\u8DEF\u5F84");
        project.name = action.name.trim();
        project.color = action.color;
        profile.directory = action.directory;
        break;
      }
      case "setProjectWhitelist": {
        const p = this.projects.find((x) => x.id === action.id);
        ensure(p !== void 0, "\u9879\u76EE\u4E0D\u5B58\u5728");
        p.appWhitelist = action.whitelist === null ? null : [...action.whitelist];
        break;
      }
      case "deleteProject": {
        if (this.education.semesters.some((s) => s.projectId === action.id)) {
          throw new AppError(
            "\u9879\u76EE\u5DF2\u6709\u6559\u5B66\u5386\u53F2\uFF0C\u8BF7\u4FDD\u7559\u8BB0\u5F55\u5E76\u505C\u7528\u5E94\u8BD5\u6A21\u5F0F\uFF1B\u8D44\u6599\u76EE\u5F55\u4E0D\u4F1A\u88AB\u5220\u9664"
          );
        }
        this.education.projects = this.education.projects.filter(
          (p) => p.projectId !== action.id
        );
        this.education.resources = this.education.resources.filter(
          (p) => p.projectId !== action.id
        );
        this.projects = this.projects.filter((p) => p.id !== action.id);
        for (const task of this.tasks) {
          if (task.projectId === action.id) task.projectId = null;
        }
        for (const template of this.templates) {
          if (template.shape.projectId === action.id)
            template.shape.projectId = null;
        }
        this.visions = this.visions.filter((a) => a.projectId !== action.id);
        break;
      }
      case "reorderProjects": {
        if (action.ids.length !== this.projects.length || !action.ids.every((pid) => this.projects.some((p) => p.id === pid))) {
          throw new AppError("\u9879\u76EE\u6392\u5E8F\u5217\u8868\u4E0E\u73B0\u6709\u9879\u76EE\u4E0D\u4E00\u81F4");
        }
        this.projects = action.ids.map(
          (pid) => this.projects.find((p) => p.id === pid)
        );
        break;
      }
      case "detachTasks": {
        if (action.ids.some((taskId) => teachingTask(this, taskId) !== void 0)) {
          throw new AppError("\u6559\u5B66\u5F85\u529E\u987B\u4FDD\u7559\u6765\u6E90\u9879\u76EE\uFF0C\u8BF7\u8C03\u6574\u5BF9\u5E94\u6559\u5B66\u5B89\u6392");
        }
        for (const t of this.tasks) {
          if (action.ids.includes(t.id)) {
            if (action.target === "project") t.projectId = null;
            else t.habitId = null;
          }
        }
        break;
      }
      case "saveHabitGroup": {
        if (action.id !== null) {
          const h = this.habits.find((x) => x.id === action.id);
          ensure(h !== void 0, "\u4E60\u60EF\u7EC4\u4E0D\u5B58\u5728");
          h.name = action.name.trim();
        } else {
          this.habits.push({ id: id(), name: action.name.trim() });
        }
        break;
      }
      case "saveHabit": {
        const hid = action.id ?? id();
        const existing = this.habits.find((h) => h.id === hid);
        if (existing !== void 0) {
          existing.name = action.name.trim();
        } else {
          this.habits.push({ id: hid, name: action.name.trim() });
        }
        saveTemplate(this, {
          id: `habit:${hid}`,
          automatic: true,
          printAheadDays: 0,
          printing: {
            kind: "weekly",
            slots: action.slots.map((s) => ({
              days: [...s.days],
              time: s.time
            }))
          },
          shape: {
            title: action.name.trim(),
            notes: "",
            projectId: action.projectId,
            habitId: hid,
            focusMinutes: action.focusMinutes,
            scrapMinutes: 0,
            priority: 0,
            estimate: 1,
            tags: [],
            subtasks: []
          }
        });
        break;
      }
      case "deleteHabit": {
        const tids = this.templates.filter((t) => t.shape.habitId === action.id).map((t) => t.id);
        for (const tid of tids) {
          deleteTemplate(this, tid);
        }
        this.habits = this.habits.filter((h) => h.id !== action.id);
        for (const task of this.tasks) {
          if (task.habitId === action.id) task.habitId = null;
        }
        break;
      }
      case "saveVision": {
        if (action.id !== null) {
          const a = this.visions.find((x) => x.id === action.id);
          ensure(a !== void 0, "\u613F\u666F\u4E0D\u5B58\u5728");
          a.name = action.name.trim();
          a.notes = action.notes;
          a.projectId = action.projectId;
        } else {
          this.visions.push({
            id: id(),
            name: action.name.trim(),
            notes: action.notes,
            projectId: action.projectId
          });
        }
        break;
      }
      case "deleteVision":
        this.visions = this.visions.filter((a) => a.id !== action.id);
        break;
      case "saveBlock": {
        const block = {
          id: action.id ?? id(),
          title: action.title.trim(),
          days: [...action.days],
          start: action.start,
          end: action.end,
          attention: action.attention,
          notes: action.notes
        };
        validateBlock(block);
        const index = this.blocks.findIndex((b) => b.id === block.id);
        if (index >= 0) {
          this.blocks[index] = block;
        } else {
          this.blocks.push(block);
        }
        break;
      }
      case "deleteBlock":
        this.blocks = this.blocks.filter((b) => b.id !== action.id);
        break;
      case "selectTask": {
        if (this.tasks.some((t) => t.id === action.id && this.taskIsVoid(t))) {
          throw new AppError("\u4F5C\u5E9F\u5B9E\u4F8B\u4E0D\u80FD\u4E13\u6CE8");
        }
        if (action.id !== null && !this.tasks.some((t) => t.id === action.id && !t.completed)) {
          throw new AppError("\u8BF7\u9009\u62E9\u4E00\u4E2A\u672A\u5B8C\u6210\u7684\u4EFB\u52A1");
        }
        if (this.timer.running || timerRemaining(this.timer, at) < this.timer.durationSecs) {
          throw new AppError("\u8BF7\u5148\u7ED3\u675F\u5F53\u524D\u8BA1\u65F6\uFF0C\u518D\u5207\u6362\u4E13\u6CE8\u4EFB\u52A1");
        }
        this.timer.taskId = action.id;
        this.resetTo(this.timer.mode);
        break;
      }
      case "startTimer": {
        if (this.tasks.some(
          (t) => t.id === this.timer.taskId && this.taskIsVoid(t)
        )) {
          throw new AppError("\u4F5C\u5E9F\u5B9E\u4F8B\u4E0D\u80FD\u5F00\u59CB\u4E13\u6CE8");
        }
        const override = action.minutes !== void 0 && action.minutes !== null ? action.minutes : null;
        if (override !== null) {
          if (this.timer.mode !== "focus" || this.timer.running || this.timer.startedAt !== null) {
            throw new AppError("\u53EA\u6709\u5C1A\u672A\u5F00\u59CB\u7684\u4E13\u6CE8\u53EF\u4EE5\u6307\u5B9A\u5355\u6B21\u65F6\u957F");
          }
          if (!Number.isInteger(override) || override < 1 || override > 180) {
            throw new AppError("\u5355\u6B21\u65F6\u957F\u9700\u4E3A1\u2014180\u5206\u949F");
          }
        }
        startTeachingTask(this, at);
        this.start(at);
        if (override !== null) {
          this.timer.durationSecs = override * 60;
          this.timer.remainingSecs = override * 60;
          this.timer.deadline = at + override * 60;
        }
        break;
      }
      case "pauseTimer": {
        this.timer.remainingSecs = timerRemaining(this.timer, at);
        this.timer.running = false;
        this.timer.deadline = null;
        break;
      }
      case "resetTimer": {
        this.record(at, false);
        this.resetTo(this.timer.mode);
        break;
      }
      case "skipTimer": {
        this.record(at, false);
        const next = this.timer.mode === "focus" ? "shortBreak" : "focus";
        this.resetTo(next);
        break;
      }
      case "setMode": {
        if (action.mode !== this.timer.mode) {
          this.record(at, false);
          this.resetTo(action.mode);
        }
        break;
      }
      case "saveSettings": {
        this.settings = action.settings;
        if (!this.timer.running && this.timer.remainingSecs === this.timer.durationSecs) {
          this.resetTo(this.timer.mode);
        }
        break;
      }
      case "importPlan":
        mergePlan(action.plan, this, at);
        break;
      case "import": {
        action.data.validate();
        const data = clone(action.data);
        data.lock.active = null;
        data.lock.suppressedUntil = 0;
        data.settings.autoStartTasks = false;
        for (const schedule of data.lock.schedules) {
          schedule.enabled = false;
        }
        data.timer.remainingSecs = Math.max(1, timerRemaining(data.timer, at));
        data.timer.running = false;
        data.timer.deadline = null;
        data.timer.completionSerial = this.timer.completionSerial;
        replaceAppData(this, data);
        break;
      }
      case "loadExample": {
        if (this.tasks.length > 0) {
          throw new AppError("\u53EA\u6709\u7A7A\u4EFB\u52A1\u5217\u8868\u53EF\u4EE5\u8F7D\u5165\u793A\u4F8B");
        }
        const today = dateAt(at);
        const examples = [
          [
            "\u68B3\u7406\u672C\u5468\u7684\u5DE5\u4F5C\u8BA1\u5212",
            "\u628A\u5927\u76EE\u6807\u62C6\u6210\u5C0F\u6B65\u9AA4\uFF0C\u8BA9\u6BCF\u4E00\u5929\u90FD\u66F4\u4ECE\u5BB9\u3002",
            3,
            2
          ],
          [
            "\u8BFB\u5B8C\u6B63\u5728\u770B\u7684\u90A3\u4E00\u7AE0",
            "\u5173\u6389\u6D88\u606F\u63D0\u9192\uFF0C\u7ED9\u9605\u8BFB\u7559\u4E00\u6BB5\u5B8C\u6574\u7684\u65F6\u95F4\u3002",
            2,
            1
          ],
          ["\u6574\u7406\u684C\u9762\uFF0C\u6574\u7406\u601D\u7EEA", "\u4E00\u4E2A\u8212\u670D\u7684\u73AF\u5883\uFF0C\u662F\u4E13\u6CE8\u7684\u5F00\u59CB\u3002", 1, 1]
        ];
        examples.forEach(([title, notes, priority, estimate], index) => {
          this.tasks.push({
            id: id(),
            templateId: null,
            recurring: false,
            title,
            notes,
            projectId: this.projects[index]?.id ?? null,
            habitId: null,
            dueDate: today,
            reminderTime: null,
            focusMinutes: null,
            reminderFired: false,
            reminderPending: false,
            reminderExpired: false,
            scrapMinutes: 0,
            priority,
            estimate,
            completed: false,
            completedAt: null,
            createdAt: at + index,
            tags: ["\u793A\u4F8B"],
            subtasks: []
          });
        });
        break;
      }
    }
    materializeTeachingTasks(this, at);
    this.validate();
  }
  validate() {
    this.educationValidate();
    validateTeachingTasks(this);
    validateLock(this.lock);
    validateTemplates(this);
    validateIdentities(this);
    validateBlocks(this.blocks);
    ensure(this.version === 4, "\u4E0D\u652F\u6301\u6B64\u6570\u636E\u7248\u672C");
    ensure(
      this.tasks.length <= 5e4 && this.sessions.length <= 2e5 && this.projects.length <= 500,
      "\u6570\u636E\u8D85\u51FA\u6570\u91CF\u9650\u5236"
    );
    const s = this.settings;
    ensure(s.soundVolume <= 100, "\u97F3\u6548\u97F3\u91CF\u9700\u4E3A 0\u2013100");
    ensure(
      s.focusMinutes >= 1 && s.focusMinutes <= 180 && s.shortBreakMinutes >= 1 && s.shortBreakMinutes <= 60 && s.longBreakMinutes >= 1 && s.longBreakMinutes <= 120 && s.longBreakEvery >= 2 && s.longBreakEvery <= 12 && s.dailyGoal >= 1 && s.dailyGoal <= 30,
      "\u8BA1\u65F6\u8BBE\u7F6E\u8D85\u51FA\u5141\u8BB8\u8303\u56F4"
    );
    ensure(["light", "dark", "system"].includes(s.theme), "\u65E0\u6548\u7684\u4E3B\u9898");
    ensure(validAppIds(s.protection.whitelist), "\u65E0\u6548\u7684\u5E94\u7528\u767D\u540D\u5355");
    const projectIds = /* @__PURE__ */ new Set();
    for (const p of this.projects) {
      ensure(p.id.length > 0 && !projectIds.has(p.id), "\u9879\u76EE ID \u91CD\u590D\u6216\u4E3A\u7A7A");
      projectIds.add(p.id);
      ensure(
        p.name.trim().length > 0 && charCount(p.name) <= 40,
        "\u9879\u76EE\u540D\u79F0\u9700\u4E3A 1\u201340 \u4E2A\u5B57\u7B26"
      );
      ensure(
        p.color.length === 7 && p.color.startsWith("#") && /^[0-9a-fA-F]{6}$/.test(p.color.slice(1)),
        "\u65E0\u6548\u7684\u9879\u76EE\u989C\u8272"
      );
      ensure(
        p.appWhitelist === null || validAppIds(p.appWhitelist),
        "\u65E0\u6548\u7684\u9879\u76EE\u5E94\u7528\u767D\u540D\u5355"
      );
    }
    const habitIds = /* @__PURE__ */ new Set();
    ensure(this.habits.length <= 500, "\u4E60\u60EF\u6570\u91CF\u8D85\u51FA\u9650\u5236");
    for (const h of this.habits) {
      ensure(h.id.length > 0 && !habitIds.has(h.id), "\u4E60\u60EF ID \u91CD\u590D\u6216\u4E3A\u7A7A");
      habitIds.add(h.id);
      validateHabit(h);
    }
    const visionIds = /* @__PURE__ */ new Set();
    ensure(this.visions.length <= 500, "\u613F\u666F\u6570\u91CF\u8D85\u51FA\u9650\u5236");
    for (const a of this.visions) {
      ensure(a.id.length > 0 && !visionIds.has(a.id), "\u613F\u666F ID \u91CD\u590D\u6216\u4E3A\u7A7A");
      visionIds.add(a.id);
      ensure(
        a.name.trim().length > 0 && charCount(a.name) <= 40,
        "\u613F\u666F\u540D\u79F0\u9700\u4E3A 1\u201340 \u4E2A\u5B57\u7B26"
      );
      ensure(utf8Len(a.notes) <= 5e4, "\u613F\u666F\u5185\u5BB9\u8FC7\u957F");
      ensure(
        a.projectId === null || projectIds.has(a.projectId),
        "\u613F\u666F\u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u9879\u76EE"
      );
    }
    const taskIds = /* @__PURE__ */ new Set();
    for (const t2 of this.tasks) {
      this.validateReminderTask(t2);
      ensure(t2.id.length > 0 && !taskIds.has(t2.id), "\u4EFB\u52A1 ID \u91CD\u590D\u6216\u4E3A\u7A7A");
      taskIds.add(t2.id);
      ensure(
        t2.title.trim().length > 0 && charCount(t2.title) <= 200,
        "\u4EFB\u52A1\u540D\u79F0\u9700\u4E3A 1\u2013200 \u4E2A\u5B57\u7B26"
      );
      ensure(
        utf8Len(t2.notes) <= 5e4 && t2.tags.length <= 20 && t2.tags.every((tag) => charCount(tag) <= 40),
        "\u5907\u6CE8\u6216\u6807\u7B7E\u8FC7\u957F"
      );
      ensure(
        t2.priority <= 3 && t2.estimate >= 1 && t2.estimate <= 99,
        "\u65E0\u6548\u7684\u4F18\u5148\u7EA7\u6216\u9884\u8BA1\u756A\u8304\u6570"
      );
      ensure(t2.scrapMinutes <= 10080, "\u91CD\u4FEE\u7A97\u53E3\u8D85\u51FA\u8303\u56F4");
      ensure(
        t2.projectId === null || projectIds.has(t2.projectId),
        "\u4EFB\u52A1\u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u9879\u76EE"
      );
      ensure(
        t2.habitId === null || habitIds.has(t2.habitId),
        "\u4EFB\u52A1\u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u4E60\u60EF"
      );
      ensure(
        t2.habitId === null || t2.reminderTime !== null,
        "\u4E60\u60EF\u5B9E\u4F8B\u9700\u8981\u7CBE\u786E\u65F6\u95F4"
      );
      ensure(
        t2.dueDate === null || t2.dueDate.length === 10 && validDate(t2.dueDate),
        "\u65E0\u6548\u7684\u4EFB\u52A1\u65E5\u671F"
      );
      const subs = /* @__PURE__ */ new Set();
      ensure(
        t2.subtasks.length <= 200 && t2.subtasks.every((sub) => {
          if (sub.id.length === 0) return false;
          if (subs.has(sub.id)) return false;
          subs.add(sub.id);
          return sub.title.trim().length > 0 && charCount(sub.title) <= 200;
        }),
        "\u65E0\u6548\u7684\u5B50\u4EFB\u52A1"
      );
      ensure(
        t2.completed === (t2.completedAt !== null),
        "\u4EFB\u52A1\u5B8C\u6210\u72B6\u6001\u4E0E\u65E5\u671F\u4E0D\u4E00\u81F4"
      );
    }
    const t = this.timer;
    ensure(
      t.cycleDate === null || t.cycleDate.length === 10 && validDate(t.cycleDate),
      "\u65E0\u6548\u7684\u756A\u8304\u5468\u671F\u65E5\u671F"
    );
    ensure(
      t.durationSecs >= 1 && t.durationSecs <= 10800 && t.remainingSecs <= t.durationSecs && t.running === (t.deadline !== null),
      "\u8BA1\u65F6\u5668\u6570\u636E\u4E0D\u6B63\u786E"
    );
    ensure(t.taskId === null || taskIds.has(t.taskId), "\u8BA1\u65F6\u5668\u4EFB\u52A1\u4E0D\u5B58\u5728");
    const sessionIds = /* @__PURE__ */ new Set();
    const estimatedTasks = /* @__PURE__ */ new Set();
    for (const session of this.sessions) {
      const maxDuration = session.source === "timer" ? 10800 : 99 * 180 * 60;
      ensure(
        session.id.length > 0 && !sessionIds.has(session.id) && session.endedAt >= session.startedAt && session.durationSecs >= 1 && session.durationSecs <= maxDuration && (session.source !== "taskEstimate" || !session.completed && session.taskId !== null && session.taskId.length > 0 && !estimatedTasks.has(session.taskId) && session.startedAt === session.endedAt) && charCount(session.taskTitle) <= 200 && charCount(session.projectName) <= 40,
        "\u65E0\u6548\u7684\u4E13\u6CE8\u8BB0\u5F55"
      );
      sessionIds.add(session.id);
      if (session.source === "taskEstimate" && session.taskId !== null) {
        estimatedTasks.add(session.taskId);
      }
    }
  }
  stats(at) {
    const today = dateAt(at);
    const current = parseLocalDate(today);
    const byDay = /* @__PURE__ */ new Map();
    for (const session of this.sessions) {
      const entry = byDay.get(dateAt(session.endedAt)) ?? {
        seconds: 0,
        pomodoros: 0
      };
      entry.seconds += session.durationSecs;
      entry.pomodoros += session.completed ? 1 : 0;
      byDay.set(dateAt(session.endedAt), entry);
    }
    const completedByDay = /* @__PURE__ */ new Map();
    const voidedByDay = /* @__PURE__ */ new Map();
    const missedByDay = /* @__PURE__ */ new Map();
    for (const t of this.tasks) {
      if (t.completedAt !== null) {
        completedByDay.set(
          dateAt(t.completedAt),
          (completedByDay.get(dateAt(t.completedAt)) ?? 0) + 1
        );
      }
      if (t.reminderExpired && !t.completed && t.dueDate !== null) {
        if (kindOf(t) === "habit") {
          missedByDay.set(t.dueDate, (missedByDay.get(t.dueDate) ?? 0) + 1);
        } else {
          voidedByDay.set(t.dueDate, (voidedByDay.get(t.dueDate) ?? 0) + 1);
        }
      }
    }
    const days = [];
    for (let n = 27; n >= 0; n -= 1) {
      const date = formatLocalDate(addDays(current, -n));
      const entry = byDay.get(date) ?? { seconds: 0, pomodoros: 0 };
      days.push({
        date,
        seconds: entry.seconds,
        pomodoros: entry.pomodoros,
        missed: missedByDay.get(date) ?? 0,
        completed: completedByDay.get(date) ?? 0,
        voided: voidedByDay.get(date) ?? 0
      });
    }
    const focused = /* @__PURE__ */ new Set();
    for (const s of this.sessions) {
      if (s.completed || s.source === "taskEstimate") {
        focused.add(dateAt(s.endedAt));
      }
    }
    let day = current;
    if (!focused.has(today)) {
      day = addDays(day, -1);
    }
    let streak = 0;
    while (focused.has(formatLocalDate(day))) {
      streak += 1;
      day = addDays(day, -1);
    }
    const last = days[days.length - 1];
    return {
      todaySeconds: last.seconds,
      todayPomodoros: last.pomodoros,
      todayCompleted: this.tasks.filter(
        (t) => t.completedAt !== null && dateAt(t.completedAt) === today
      ).length,
      totalSeconds: this.sessions.reduce((n, s) => n + s.durationSecs, 0),
      totalPomodoros: this.sessions.filter((s) => s.completed).length,
      streak,
      days
    };
  }
  // ---- reminders 包装 ----
  reminderIdle() {
    return reminderIdle(this);
  }
  pendingReminder() {
    return pendingReminder(this);
  }
  dueAutoTask() {
    return dueAutoTask(this);
  }
  // ---- plan 包装 ----
  exportPlan() {
    return exportPlan(this);
  }
  // ---- teaching 包装 ----
  teachingTask(taskId) {
    return teachingTask(this, taskId);
  }
  completeTeachingTask(taskId, at) {
    completeTeachingTask(this, taskId, at);
  }
  // ---- education 校验包装 ----
  educationValidate() {
    validateEducation(this);
  }
  validateReminderTask(task) {
    validateReminderTask(task);
  }
};
function validAppIds(list) {
  return list.length <= 100 && list.every(
    (a) => a.trim().length > 0 && charCount(a) <= 32768 && !Array.from(a).some((c) => isControlChar(c))
  );
}
function isControlChar(c) {
  const code = c.codePointAt(0);
  return code < 32 || code >= 127 && code <= 159;
}
function parseLocalDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day };
}
function formatLocalDate(date) {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}
function checkUserAction(action) {
  if (action.type === "education" && assistantOnly(action.command)) {
    throw new AppError(
      "\u8BFE\u7A0B\u3001\u4F5C\u4E1A\u3001\u8BD5\u5377\u548C\u6279\u6539\u7531\u5B66\u4E60\u52A9\u624B\u751F\u6210\uFF0C\u8BF7\u5728\u5BF9\u8BDD\u4E2D\u63D0\u51FA\u8981\u6C42"
    );
  }
}
var ACTION_KEYS = {
  education: ["type", "command"],
  printInstances: ["type", "shape", "printing"],
  saveTemplate: ["type", "template", "printDates"],
  deleteTemplate: ["type", "id"],
  printTemplate: ["type", "id", "dates"],
  syncTemplate: ["type", "id"],
  startReminder: ["type", "id"],
  saveTask: ["type", "task"],
  toggleTask: ["type", "id"],
  deleteTask: ["type", "id"],
  restoreTask: ["type", "task"],
  toggleSubtask: ["type", "taskId", "subtaskId"],
  saveProject: ["type", "id", "name", "color", "directory"],
  renameProjectDirectory: ["type", "id", "name", "color", "directory"],
  setProjectWhitelist: ["type", "id", "whitelist"],
  deleteProject: ["type", "id"],
  reorderProjects: ["type", "ids"],
  detachTasks: ["type", "ids", "target"],
  saveHabitGroup: ["type", "id", "name"],
  saveHabit: ["type", "id", "name", "projectId", "focusMinutes", "slots"],
  deleteHabit: ["type", "id"],
  saveVision: ["type", "id", "name", "notes", "projectId"],
  deleteVision: ["type", "id"],
  saveBlock: [
    "type",
    "id",
    "title",
    "days",
    "start",
    "end",
    "attention",
    "notes"
  ],
  deleteBlock: ["type", "id"],
  selectTask: ["type", "id"],
  startTimer: ["type", "minutes"],
  completeFocus: ["type"],
  pauseTimer: ["type"],
  resetTimer: ["type"],
  skipTimer: ["type"],
  setMode: ["type", "mode"],
  saveSettings: ["type", "settings"],
  loadExample: ["type"],
  import: ["type", "data"],
  importPlan: ["type", "plan"],
  emergencyUnlock: ["type"],
  rearmLock: ["type"],
  saveLockSchedule: ["type", "schedule"],
  deleteLockSchedule: ["type", "id"],
  startQuickLock: ["type", "minutes", "strict"]
};
var ACTION_NAMES = Object.keys(ACTION_KEYS);
function parseAction(raw) {
  if (!isObject(raw)) throw new AppError("\u52A8\u4F5C\u5FC5\u987B\u662F\u5BF9\u8C61");
  const type = oneOf(
    requiredField(raw, "type", "\u52A8\u4F5C", (v) => v),
    "\u52A8\u4F5C type",
    ACTION_NAMES
  );
  rejectUnknown(raw, ACTION_KEYS[type], "\u52A8\u4F5C");
  const str = (key) => requiredField(raw, key, "\u52A8\u4F5C", asStr);
  const optStr = (key) => field(raw, key, "\u52A8\u4F5C", (v) => asOpt(v, key, asStr), null);
  const strs = (key) => asArray(
    requiredField(raw, key, "\u52A8\u4F5C", (v) => v),
    key
  ).map((x) => asStr(x, key));
  switch (type) {
    case "education":
      return {
        type,
        command: parseCommand(requiredField(raw, "command", "\u52A8\u4F5C", (v) => v))
      };
    case "printInstances":
      return {
        type,
        shape: parseShape(requiredField(raw, "shape", "\u52A8\u4F5C", (v) => v)),
        printing: parsePrinting(
          requiredField(raw, "printing", "\u52A8\u4F5C", (v) => v)
        )
      };
    case "saveTemplate":
      return {
        type,
        template: parseTemplate(
          requiredField(raw, "template", "\u52A8\u4F5C", (v) => v)
        ),
        printDates: field(
          raw,
          "printDates",
          "\u52A8\u4F5C",
          (v) => asArray(v, "printDates").map(
            (d) => d === null ? null : asStr(d, "printDates")
          ),
          []
        )
      };
    case "deleteTemplate":
    case "syncTemplate":
    case "startReminder":
    case "toggleTask":
    case "deleteTask":
    case "deleteProject":
    case "deleteHabit":
    case "deleteVision":
    case "deleteBlock":
    case "deleteLockSchedule":
      return { type, id: str("id") };
    case "printTemplate":
      return {
        type,
        id: str("id"),
        dates: asArray(
          requiredField(raw, "dates", "\u52A8\u4F5C", (v) => v),
          "dates"
        ).map((d) => d === null ? null : asStr(d, "dates"))
      };
    case "saveTask":
      return {
        type,
        task: parseTaskDraft(requiredField(raw, "task", "\u52A8\u4F5C", (v) => v))
      };
    case "restoreTask":
      return {
        type,
        task: parseTask(requiredField(raw, "task", "\u52A8\u4F5C", (v) => v))
      };
    case "toggleSubtask":
      return { type, taskId: str("taskId"), subtaskId: str("subtaskId") };
    case "saveProject":
      return {
        type,
        id: optStr("id"),
        name: str("name"),
        color: str("color"),
        directory: optStr("directory")
      };
    case "renameProjectDirectory":
      return {
        type,
        id: str("id"),
        name: str("name"),
        color: str("color"),
        directory: str("directory")
      };
    case "setProjectWhitelist":
      return {
        type,
        id: str("id"),
        whitelist: field(
          raw,
          "whitelist",
          "\u52A8\u4F5C",
          (v) => asOpt(
            v,
            "whitelist",
            (x) => asArray(x, "whitelist").map((a) => asStr(a, "whitelist"))
          ),
          null
        )
      };
    case "reorderProjects":
      return { type, ids: strs("ids") };
    case "detachTasks":
      return {
        type,
        ids: strs("ids"),
        target: oneOf(
          requiredField(raw, "target", "\u52A8\u4F5C", (v) => v),
          "detach target",
          ["project", "habit"]
        )
      };
    case "saveHabitGroup":
      return { type, id: optStr("id"), name: str("name") };
    case "saveHabit":
      return {
        type,
        id: optStr("id"),
        name: str("name"),
        projectId: optStr("projectId"),
        focusMinutes: field(
          raw,
          "focusMinutes",
          "\u52A8\u4F5C",
          (v) => asOpt(v, "focusMinutes", (x) => asInt(x, "focusMinutes")),
          null
        ),
        slots: asArray(
          requiredField(raw, "slots", "\u52A8\u4F5C", (v) => v),
          "slots"
        ).map(parseHabitSlot)
      };
    case "saveVision":
      return {
        type,
        id: optStr("id"),
        name: str("name"),
        notes: field(raw, "notes", "\u52A8\u4F5C", asStr, ""),
        projectId: optStr("projectId")
      };
    case "saveBlock":
      return {
        type,
        id: optStr("id"),
        title: str("title"),
        days: asArray(
          requiredField(raw, "days", "\u52A8\u4F5C", (v) => v),
          "days"
        ).map((d) => asInt(d, "days")),
        start: str("start"),
        end: str("end"),
        attention: field(
          raw,
          "attention",
          "\u52A8\u4F5C",
          (v) => oneOf(v, "attention", ["required", "light"]),
          "required"
        ),
        notes: field(raw, "notes", "\u52A8\u4F5C", asStr, "")
      };
    case "selectTask":
      return { type, id: optStr("id") };
    case "startTimer":
      return {
        type,
        minutes: field(
          raw,
          "minutes",
          "\u52A8\u4F5C",
          (v) => asOpt(v, "minutes", (x) => asInt(x, "minutes")),
          null
        )
      };
    case "completeFocus":
    case "pauseTimer":
    case "resetTimer":
    case "skipTimer":
    case "loadExample":
    case "emergencyUnlock":
    case "rearmLock":
      return { type };
    case "setMode":
      return {
        type,
        mode: oneOf(
          requiredField(raw, "mode", "\u52A8\u4F5C", (v) => v),
          "mode",
          ["focus", "shortBreak", "longBreak"]
        )
      };
    case "saveSettings":
      return {
        type,
        settings: parseSettings(
          requiredField(raw, "settings", "\u52A8\u4F5C", (v) => v)
        )
      };
    case "import":
      return {
        type,
        data: parseAppData(requiredField(raw, "data", "\u52A8\u4F5C", (v) => v))
      };
    case "importPlan":
      return {
        type,
        plan: parsePlanFile(requiredField(raw, "plan", "\u52A8\u4F5C", (v) => v))
      };
    case "saveLockSchedule":
      return {
        type,
        schedule: parseLockSchedule(
          requiredField(raw, "schedule", "\u52A8\u4F5C", (v) => v)
        )
      };
    case "startQuickLock":
      return {
        type,
        minutes: requiredField(raw, "minutes", "\u52A8\u4F5C", asInt),
        strict: requiredField(raw, "strict", "\u52A8\u4F5C", asBool)
      };
    default:
      throw new AppError(`\u52A8\u4F5C type \u53D6\u503C\u65E0\u6548\uFF1A${type}`);
  }
}
function parseAppData(raw) {
  if (!isObject(raw)) throw new AppError("\u6570\u636E\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(
    raw,
    [
      "education",
      "version",
      "identities",
      "tasks",
      "blocks",
      "templates",
      "prints",
      "projects",
      "habits",
      "visions",
      "settings",
      "timer",
      "sessions",
      "lock"
    ],
    "\u6570\u636E"
  );
  return new AppData({
    education: field(raw, "education", "\u6570\u636E", parseEducation, new Education()),
    version: requiredField(raw, "version", "\u6570\u636E", asInt),
    identities: field(
      raw,
      "identities",
      "\u6570\u636E",
      (v) => asArray(v, "identities").map(parseIdentity),
      []
    ),
    tasks: field(
      raw,
      "tasks",
      "\u6570\u636E",
      (v) => asArray(v, "tasks").map(parseTask),
      []
    ),
    blocks: field(
      raw,
      "blocks",
      "\u6570\u636E",
      (v) => asArray(v, "blocks").map(parseBlock),
      []
    ),
    templates: field(
      raw,
      "templates",
      "\u6570\u636E",
      (v) => asArray(v, "templates").map(parseTemplate),
      []
    ),
    prints: field(
      raw,
      "prints",
      "\u6570\u636E",
      (v) => asArray(v, "prints").map((p) => {
        ensure(isObject(p), "\u5370\u5237\u8BB0\u5F55\u5FC5\u987B\u662F\u5BF9\u8C61");
        rejectUnknown(p, ["templateId", "date"], "\u5370\u5237\u8BB0\u5F55");
        return {
          templateId: requiredField(p, "templateId", "\u5370\u5237\u8BB0\u5F55", asStr),
          date: field(
            p,
            "date",
            "\u5370\u5237\u8BB0\u5F55",
            (d) => asOpt(d, "date", asStr),
            null
          )
        };
      }),
      []
    ),
    projects: requiredField(
      raw,
      "projects",
      "\u6570\u636E",
      (v) => asArray(v, "projects").map(parseProject)
    ),
    habits: field(
      raw,
      "habits",
      "\u6570\u636E",
      (v) => asArray(v, "habits").map(parseHabit),
      []
    ),
    visions: field(
      raw,
      "visions",
      "\u6570\u636E",
      (v) => asArray(v, "visions").map(parseVision),
      []
    ),
    settings: requiredField(raw, "settings", "\u6570\u636E", parseSettings),
    timer: requiredField(raw, "timer", "\u6570\u636E", parseTimer),
    sessions: requiredField(
      raw,
      "sessions",
      "\u6570\u636E",
      (v) => asArray(v, "sessions").map(parseSession)
    ),
    lock: field(raw, "lock", "\u6570\u636E", parseLockState, {
      schedules: [],
      active: null,
      suppressedUntil: 0
    })
  });
}
function serializeAppData(data) {
  return {
    education: serializeEducation(data.education),
    version: data.version,
    identities: data.identities.map(serializeIdentity),
    tasks: data.tasks.map(serializeTask),
    blocks: data.blocks.map(serializeBlock),
    templates: data.templates.map(serializeTemplate),
    prints: data.prints.map(serializePrintRecord),
    projects: data.projects.map(serializeProject),
    habits: data.habits.map(serializeHabit),
    visions: data.visions.map(serializeVision),
    settings: serializeSettings(data.settings),
    timer: serializeTimer(data.timer),
    sessions: data.sessions.map(serializeSession),
    lock: serializeLockState(data.lock)
  };
}

// packages/core/src/migration.ts
function upgradeTaskValue(task, today) {
  const date = typeof task["createdAt"] === "number" ? dateAt(task["createdAt"]) : today;
  delete task["goalId"];
  delete task["nodeId"];
  if (task["dueDate"] === void 0 || task["dueDate"] === null) {
    task["dueDate"] = date;
  }
}
function readLocalData(raw) {
  let value;
  try {
    value = JSON.parse(raw);
  } catch (e) {
    throw new AppError(`\u6570\u636E\u8BFB\u53D6\u5931\u8D25\uFF0C\u539F\u6587\u4EF6\u5DF2\u4FDD\u7559\uFF1A${String(e)}`);
  }
  if (!isObject2(value)) {
    throw new AppError("\u6570\u636E\u8BFB\u53D6\u5931\u8D25\uFF0C\u539F\u6587\u4EF6\u5DF2\u4FDD\u7559\uFF1A\u65E0\u6548\u7684\u672C\u5730\u6570\u636E");
  }
  if (value["version"] === 3) {
    const today = dateAt(now());
    value["version"] = 4;
    delete value["goals"];
    delete value["nodeBindings"];
    delete value["signalEvents"];
    const tasks = value["tasks"];
    if (Array.isArray(tasks)) {
      for (const task of tasks) {
        if (isObject2(task)) upgradeTaskValue(task, today);
      }
    }
    const templates = value["templates"];
    if (Array.isArray(templates)) {
      for (const template of templates) {
        if (!isObject2(template)) continue;
        const shape = template["shape"];
        if (isObject2(shape)) delete shape["goalId"];
        const printing = template["printing"];
        if (isObject2(printing) && printing["kind"] === "once" && (printing["date"] === null || printing["date"] === void 0)) {
          printing["date"] = today;
        }
      }
    }
    const prints = value["prints"];
    if (Array.isArray(prints)) {
      value["prints"] = prints.filter((p) => isObject2(p) && p["date"] !== null);
    }
    const visions = value["visions"];
    if (Array.isArray(visions)) {
      for (const vision of visions) {
        if (isObject2(vision)) delete vision["goalId"];
      }
    }
    const ids = value["identities"];
    if (Array.isArray(ids)) {
      value["identities"] = ids.filter(
        (r) => isObject2(r) && !["goal", "node", "signal"].includes(r["kind"])
      );
      for (const record of value["identities"]) {
        if (typeof record["restoreTask"] === "string") {
          let task;
          try {
            task = JSON.parse(record["restoreTask"]);
          } catch (e) {
            throw new AppError(`\u6570\u636E\u8BFB\u53D6\u5931\u8D25\uFF0C\u539F\u6587\u4EF6\u5DF2\u4FDD\u7559\uFF1A${String(e)}`);
          }
          if (!isObject2(task)) {
            throw new AppError(
              "\u6570\u636E\u8BFB\u53D6\u5931\u8D25\uFF0C\u539F\u6587\u4EF6\u5DF2\u4FDD\u7559\uFF1A\u65E0\u6548\u7684\u4EFB\u52A1\u6062\u590D\u8BB0\u5F55"
            );
          }
          upgradeTaskValue(task, today);
          record["restoreTask"] = JSON.stringify(
            serializeTask(parseTask(task))
          );
        }
      }
    }
  }
  try {
    return parseAppData(value);
  } catch (e) {
    throw new AppError(
      `\u6570\u636E\u8BFB\u53D6\u5931\u8D25\uFF0C\u539F\u6587\u4EF6\u5DF2\u4FDD\u7559\uFF1A${e instanceof Error ? e.message : String(e)}`
    );
  }
}
function isObject2(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// packages/core/src/diagnostics.ts
function signal(key, kind, title, severity, evidence, question) {
  return { key, kind, title, severity, evidence, question };
}
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
function diagnose(snapshot, capacityMinutes) {
  const data = snapshot.data;
  const at = snapshot.serverTime;
  const today = parseDate(snapshot.today);
  const weekStart2 = formatDate(addDays(today, -7));
  const monthStart = formatDate(addDays(today, -28));
  const byDay = /* @__PURE__ */ new Map();
  for (const s of data.sessions) {
    const date = dateAt(s.endedAt);
    if (date >= monthStart && date < snapshot.today) {
      byDay.set(date, (byDay.get(date) ?? 0) + Math.floor(s.durationSecs / 60));
    }
  }
  const activeMinutes = [...byDay.values()].filter((m) => m >= 20);
  const historical = activeMinutes.length >= 5 ? median(activeMinutes) : null;
  const capacity = capacityMinutes !== null ? capacityMinutes : historical !== null ? Math.max(30, historical) : data.settings.dailyGoal * data.settings.focusMinutes;
  const capacitySource = capacityMinutes !== null ? "\u7528\u6237\u8BBE\u7F6E\u7684\u65E5\u9884\u7B97" : historical !== null ? "\u8FD128\u5929\u81F3\u5C115\u4E2A\u6D3B\u8DC3\u65E5\u7684\u4E2D\u4F4D\u6570\uFF08\u5E76\u975E\u53EF\u7528\u65F6\u95F4\uFF09" : "\u6BCF\u65E5\u756A\u8304\u76EE\u6807\u9884\u7B97\uFF08\u5E76\u975E\u53EF\u7528\u65F6\u95F4\uFF09";
  const completedRounds = /* @__PURE__ */ new Map();
  for (const s of data.sessions) {
    if (s.completed && s.taskId !== null) {
      completedRounds.set(s.taskId, (completedRounds.get(s.taskId) ?? 0) + 1);
    }
  }
  const result = [];
  for (let offset = 0; offset < 3; offset += 1) {
    const date = formatDate(addDays(today, offset));
    const tasks = data.tasks.filter(
      (t) => t.dueDate === date && !t.completed && !data.taskIsVoid(t)
    );
    const minutes = tasks.reduce(
      (n, t) => n + Math.max(0, t.estimate - (completedRounds.get(t.id) ?? 0)) * (t.focusMinutes ?? data.settings.focusMinutes),
      0
    );
    const day = parseDate(date);
    const blockedMinutes = requiredMinutes(data.blocks, date);
    if (capacity > 0 && minutes * 100 > capacity * 130) {
      result.push(
        signal(
          `overload/${date}`,
          "overload",
          "\u8BA1\u5212\u7528\u65F6\u9AD8\u4E8E\u5F53\u524D\u9884\u7B97",
          "warning",
          {
            date,
            remainingPlannedMinutes: minutes,
            budgetMinutes: capacity,
            budgetSource: capacitySource,
            blockedMinutes,
            taskIds: tasks.slice(0, 30).map((t) => t.id)
          },
          "\u8FD9\u4E9B\u4EFB\u52A1\u7684\u9884\u8BA1\u7528\u65F6\u662F\u5426\u51C6\u786E\uFF1F\u8FD9\u4E00\u5929\u6709\u989D\u5916\u53EF\u7528\u65F6\u95F4\uFF0C\u8FD8\u662F\u9700\u8981\u51CF\u91CF\u6216\u632A\u52A8\uFF1F"
        )
      );
    }
    if (offset === 1 && historical !== null && tasks.length > 0 && minutes * 100 < capacity * 30) {
      result.push(
        signal(
          `underload/${date}`,
          "underload",
          "\u660E\u65E5\u5B89\u6392\u660E\u663E\u4F4E\u4E8E\u8FD1\u671F\u6295\u5165",
          "notice",
          {
            date,
            plannedMinutes: minutes,
            baselineMinutes: capacity,
            baselineSource: capacitySource,
            blockedMinutes
          },
          "\u660E\u5929\u662F\u6709\u610F\u4F11\u606F\u3001\u8BFE\u7A0B\u5360\u7528\uFF0C\u8FD8\u662F\u8BA1\u5212\u5C1A\u672A\u8865\u9F50\uFF1F\u4E0D\u8981\u4EC5\u51ED\u7A7A\u95F2\u63A8\u65AD\u5E94\u8BE5\u52A0\u4EFB\u52A1\u3002"
        )
      );
    }
    const timed = tasks.map((t) => ({
      start: t.reminderTime !== null ? minutesOf(t.reminderTime) ?? -1 : -1,
      task: t
    })).filter((x) => x.start >= 0).sort(
      (a, b) => a.start - b.start || (a.task.id < b.task.id ? -1 : a.task.id > b.task.id ? 1 : 0)
    );
    if (day !== null) {
      const required = blocksOnDate(data.blocks, date).filter(
        (b) => b.attention === "required"
      );
      for (const { start, task } of timed) {
        const end = start + windowMinutes(task, data.settings);
        for (const band2 of required) {
          const overlap = overlapMinutes(band2, date, start, end);
          if (overlap > 0) {
            result.push(
              signal(
                `block/${date}/${task.id}/${band2.id}`,
                "blockConflict",
                "\u8BA1\u5212\u65F6\u6BB5\u843D\u5728\u9700\u4E13\u5FC3\u7684\u8BFE\u7A0B\u5185",
                "warning",
                {
                  date,
                  taskId: task.id,
                  taskTitle: task.title,
                  blockId: band2.id,
                  blockTitle: band2.title,
                  blockStart: band2.start,
                  blockEnd: band2.end,
                  overlapMinutes: overlap
                },
                "\u8FD9\u6BB5\u5B89\u6392\u548C\u8981\u4E13\u5FC3\u542C\u7684\u8BFE\u91CD\u53E0\uFF1A\u80FD\u632A\u5230\u6C34\u8BFE\u65F6\u6BB5\u6216\u8BFE\u540E\u5417\uFF1F\u5982\u679C\u786E\u5B9E\u8981\u8BFE\u4E0A\u505A\uFF0C\u8BF4\u660E\u540E\u6211\u4E0D\u4F1A\u518D\u628A\u5B83\u5F53\u51B2\u7A81\u3002"
              )
            );
          }
        }
      }
    }
    let previous = null;
    for (const { start, task } of timed) {
      const end = start + windowMinutes(task, data.settings);
      if (previous !== null) {
        const prev = previous;
        if (start < prev.end) {
          const ids = [prev.task.id, task.id].sort();
          const band2 = day === null ? null : data.blocks.find(
            (b) => b.attention === "light" && overlapMinutes(b, date, start, Math.min(prev.end, end)) > 0
          );
          result.push(
            signal(
              `collision/${date}/${ids[0]}/${ids[1]}`,
              "collision",
              "\u4E24\u4E2A\u8BA1\u5212\u65F6\u6BB5\u91CD\u53E0",
              "warning",
              {
                date,
                taskIds: ids,
                titles: [prev.task.title, task.title],
                overlapMinutes: Math.min(prev.end, end) - start,
                includesBreaks: true,
                blockTitle: band2?.title ?? null
              },
              "\u8FD9\u4E24\u4E2A\u5B89\u6392\u80FD\u5426\u540C\u65F6\u5B8C\u6210\uFF1F\u5982\u679C\u662F\u5728\u540C\u4E00\u8BFE\u7A0B\u5185\u505A\u4F5C\u4E1A\uFF0C\u8BF7\u8BF4\u660E\uFF0C\u907F\u514D\u628A\u5141\u8BB8\u7684\u5E76\u884C\u8BEF\u5224\u4E3A\u51B2\u7A81\u3002"
            )
          );
        }
        if (end <= previous.end) {
          continue;
        }
      }
      previous = { end, task };
    }
  }
  const habits = /* @__PURE__ */ new Map();
  for (const t of data.tasks) {
    if (!isHabit(t) || t.dueDate === null || !(t.dueDate >= weekStart2 && t.dueDate < snapshot.today)) {
      continue;
    }
    const key = t.habitId ?? t.templateId ?? t.id;
    const entry = habits.get(key) ?? { scheduled: 0, missed: 0, ids: [] };
    entry.scheduled += 1;
    if (!t.completed && t.reminderExpired) {
      entry.missed += 1;
      entry.ids.push(t.id);
    }
    habits.set(key, entry);
  }
  for (const [id2, { scheduled, missed, ids }] of habits) {
    if (scheduled >= 4 && missed >= 3 && missed * 100 >= scheduled * 50) {
      result.push(
        signal(
          `habit/${id2}`,
          "habitAbsence",
          "\u8FD1\u4E00\u5468\u4E60\u60EF\u591A\u6B21\u672A\u5B8C\u6210",
          "warning",
          {
            habitId: id2,
            observedOccurrences: scheduled,
            missedOccurrences: missed,
            windowStart: weekStart2,
            windowEnd: snapshot.today,
            taskIds: ids
          },
          "\u662F\u65F6\u95F4\u5B89\u6392\u4E0D\u5408\u9002\u3001\u4EFB\u52A1\u592A\u96BE\u3001\u5916\u90E8\u5360\u7528\uFF0C\u8FD8\u662F\u5DF2\u7ECF\u4E0D\u60F3\u7EE7\u7EED\u8FD9\u4E2A\u4E60\u60EF\uFF1F\u5148\u786E\u8BA4\u539F\u56E0\u518D\u6539\u8BA1\u5212\u3002"
        )
      );
    }
  }
  const recentSessions = data.sessions.filter(
    (s) => s.source === "timer" && s.endedAt >= at - 7 * 86400
  );
  const late = recentSessions.filter((s) => {
    const hour = new Date(s.endedAt * 1e3).getHours();
    return !(hour >= 6 && hour < 23);
  });
  const distinctLate = new Set(late.map((s) => dateAt(s.endedAt)));
  if (distinctLate.size >= 3) {
    result.push(
      signal(
        "rhythm/late",
        "rhythmDrift",
        "\u8FD1\u4E00\u5468\u591A\u5929\u6709\u6DF1\u591C\u4E13\u6CE8\u8BB0\u5F55",
        "notice",
        {
          lateDates: [...distinctLate],
          lateSessionCount: late.length,
          window: "23:00\u201306:00 \u672C\u673A\u65F6\u95F4",
          sampleSessions: recentSessions.length
        },
        "\u8FD9\u662F\u4E34\u65F6\u5B89\u6392\u8FD8\u662F\u7B26\u5408\u4F60\u7684\u4F5C\u606F\uFF1F\u7ED3\u5408\u4F60\u786E\u8BA4\u7684\u7761\u7720\u548C\u8BFE\u7A0B\u4FE1\u606F\u5224\u65AD\uFF0C\u4E0D\u4EE5\u7EDF\u4E00\u4F5C\u606F\u8BC4\u4EF7\u7528\u6237\u3002"
      )
    );
  }
  const recentDays = [...byDay.keys()].filter((d) => d >= weekStart2).length;
  if (historical !== null && recentDays >= 3) {
    const recent = [...byDay.entries()].filter(([d]) => d >= weekStart2).map(([, m]) => m);
    if (recent.reduce((n, m) => n + m, 0) * 100 < historical * recent.length * 40) {
      result.push(
        signal(
          "engagement/drop",
          "engagementDrop",
          "\u8FD1\u671F\u8BB0\u5F55\u7684\u6295\u5165\u660E\u663E\u4E0B\u964D",
          "notice",
          {
            recentActiveDays: recent.length,
            recentMeanMinutes: recent.length > 0 ? Math.floor(recent.reduce((n, m) => n + m, 0) / recent.length) : 0,
            baselineMinutes: historical
          },
          "\u662F\u5426\u6709\u8003\u8BD5\u3001\u8BFE\u7A0B\u3001\u8EAB\u4F53\u72B6\u6001\u6216\u7EBF\u4E0B\u5B66\u4E60\u53D8\u5316\uFF1F\u5148\u8865\u5168\u8BB0\u5F55\u80CC\u666F\uFF0C\u518D\u51B3\u5B9A\u662F\u5426\u8C03\u6574\u8282\u594F\u3002"
        )
      );
    }
  }
  result.sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  return result.slice(0, 30);
}

// packages/core/src/guard.ts
function allowed(window, ownPid, protection) {
  if (window.pid !== null && window.pid === ownPid) {
    return true;
  }
  return protection.mode === "off" || protection.mode === "whitelist" && window.appId !== null && protection.whitelist.some((allowedId) => allowedId === window.appId);
}
function formatAumid(id2) {
  return `aumid:${id2}`;
}
function isApplicationFrameHost(processPath) {
  const name = processPath.split(/[\\/]/).pop() ?? "";
  return name.toLowerCase() === "applicationframehost.exe";
}
function selectFrameContentPid(hostPid, children) {
  for (const child of children) {
    if (child.className === "Windows.UI.Core.CoreWindow" && child.pid !== 0 && child.pid !== hostPid) {
      return child.pid;
    }
  }
  return null;
}

// packages/core/src/engine.ts
import { readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs";
import { dirname } from "node:path";
function writeAtomic(path, data) {
  const raw = JSON.stringify(serializeAppData(data), null, 2);
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, raw, "utf8");
  renameSync(tmp, path);
}
var Engine = class _Engine {
  path;
  data;
  save;
  constructor(path, data, save) {
    this.path = path;
    this.data = data;
    this.save = save;
  }
  /** 桌面适配层专用：合成器故障后强制解除保护；不是对外 Action。 */
  releaseFailedProtection(at) {
    const next = clone(this.data);
    next.record(at, false);
    next.resetTo("focus");
    releaseLock(next.lock, at);
    next.validate();
    this.persist(next);
    this.data = next;
  }
  /**
   * 旧 runtime 的「放弃当前番茄」：不写专注记录，只回到空闲专注。
   * 保护生效时拒绝（与其它写动作同一规则：不能借放弃绕开锁定）。
   */
  discardTimer() {
    if (this.data.strictProtected()) {
      throw new AppError("\u4E25\u683C\u6A21\u5F0F\u751F\u6548\u4E2D\uFF0C\u4E0D\u80FD\u63D0\u524D\u7ED3\u675F\u6216\u4FEE\u6539\uFF1B\u5230\u65F6\u81EA\u52A8\u89E3\u9664");
    }
    if (this.data.protected()) {
      throw new AppError(
        "\u4E13\u6CE8\u4FDD\u62A4\u4E2D\uFF0C\u7ED3\u675F\u524D\u4E0D\u80FD\u4FEE\u6539\u4EFB\u52A1\u6216\u8BA1\u65F6\uFF1B\u53EF\u63D0\u524D\u5B8C\u6210\u756A\u8304\u6216\u7D27\u6025\u9000\u51FA"
      );
    }
    const next = clone(this.data);
    next.resetTo("focus");
    next.validate();
    this.persist(next);
    this.data = next;
  }
  static open(path) {
    let raw = null;
    if (path !== ":memory:") {
      const parent = dirname(path);
      if (parent !== "." && parent !== "") {
        try {
          mkdirSync(parent, { recursive: true });
        } catch (e) {
          throw new AppError(String(e));
        }
      }
      try {
        raw = readFileSync(path, "utf8");
      } catch (e) {
        if (e.code !== "ENOENT") {
          throw new AppError(String(e));
        }
        raw = null;
      }
    }
    let data;
    if (raw !== null) {
      data = readLocalData(raw);
    } else {
      data = new AppData();
    }
    reconcileIdentities(clone(data), data, null);
    data.validate();
    const engine = new _Engine(
      path,
      data,
      path === ":memory:" ? () => {
      } : (next) => writeAtomic(path, next)
    );
    engine.persist(engine.data);
    return engine;
  }
  /**
   * 用调用方加载好的数据建引擎，并以调用方给的 `save` 落盘。
   * 数据仍走同一套身份登记与全量校验；`save` 抛错会原样传出，加载失败时
   * 调用方因此不会覆盖旧文件。
   */
  static fromData(data, save, path = ":memory:") {
    const next = clone(data);
    reconcileIdentities(clone(data), next, null);
    next.validate();
    const engine = new _Engine(path, next, save);
    engine.persist(engine.data);
    return engine;
  }
  persist(data) {
    this.save(data);
  }
  /** 与 dispatch 相同的身份/历史规则，但不持久化：用于审阅文件。 */
  previewAction(action, at) {
    const restoreId = (() => {
      if (action.type === "restoreTask") {
        const record = this.data.identities.find(
          (r) => r.id === action.task.id && r.retired && r.kind === "task"
        );
        if (record === void 0) {
          throw new AppError("\u6CA1\u6709\u5BF9\u5E94\u7684\u539F\u4EFB\u52A1\u6062\u590D\u8BB0\u5F55");
        }
        if (record.restoreTask !== JSON.stringify(serializeTask(action.task))) {
          throw new AppError("\u6062\u590D\u5185\u5BB9\u4E0E\u539F\u4EFB\u52A1\u4E0D\u4E00\u81F4\uFF0C\u5386\u53F2 ID \u4E0D\u80FD\u590D\u7528");
        }
        return action.task.id;
      }
      return null;
    })();
    const next = clone(this.data);
    next.apply(action, at);
    validateEducationTransition(this.data.education, next.education);
    reconcileIdentities(this.data, next, restoreId);
    validateIdentities(next);
    return next;
  }
  /** 只推进时间（计时/提醒/锁机/自动开工），不生成快照统计；每秒 tick 用。 */
  tick(at) {
    const next = clone(this.data);
    if (!next.tick(at)) return false;
    reconcileIdentities(this.data, next, null);
    next.validate();
    this.persist(next);
    this.data = clone(next);
    return true;
  }
  dispatch(action, at) {
    const next = this.previewAction(action, at);
    this.persist(next);
    this.data = next;
    return this.snapshot(at);
  }
  snapshot(at) {
    const next = clone(this.data);
    if (next.tick(at)) {
      reconcileIdentities(this.data, next, null);
      next.validate();
      this.persist(next);
      this.data = clone(next);
    }
    const kinds = {};
    for (const t of this.data.tasks) {
      kinds[t.id] = kindOf(t);
    }
    return {
      taskKinds: kinds,
      remainingSecs: timerRemaining(this.data.timer, at),
      stats: this.data.stats(at),
      studyProgress: summaries(next, at),
      data: next,
      today: dateAt(at),
      serverTime: at
    };
  }
  export(at) {
    this.snapshot(at);
    return JSON.stringify(serializeAppData(this.data), null, 2);
  }
};
export {
  AppData,
  AppError,
  Education,
  Engine,
  addDays,
  allowed,
  assistantOnly,
  atLocal,
  atLocalDate,
  atLocalDateString,
  band,
  blocksOnDate,
  charCount,
  checkText,
  checkUserAction,
  clone,
  completeTeachingTask,
  dateAt,
  daysBetween,
  deepEqual,
  defaultSettings,
  defaultTimer,
  deleteTemplate,
  diagnose,
  dueAutoTask,
  durationOf,
  ensure,
  examDeadline2 as examDeadline,
  exportPlan,
  formatAumid,
  formatDate,
  fromTask,
  hourMinuteOf,
  hourMinuteString,
  id,
  isAbsolutePath,
  isApplicationFrameHost,
  isHabit,
  isRelativePath,
  kindOf,
  localDateOf,
  materializeTeachingTasks,
  materializeTemplates,
  mergePlan,
  minutesOf,
  now,
  overlapMinutes,
  parseAction,
  parseActiveLock,
  parseAppData,
  parseAssessment,
  parseBlock,
  parseCalendarSlot,
  parseCommand,
  parseCompletedStudyTask,
  parseCorrection,
  parseDate,
  parseEducation,
  parseErrorAnalysis,
  parseGrade,
  parseHabit,
  parseIdentity,
  parseLesson,
  parseLockSchedule,
  parseLockState,
  parseMilestone,
  parsePlanFile,
  parsePointAward,
  parsePrintRecord,
  parsePrintSlot,
  parsePrinting,
  parseProgressRecord,
  parseProject,
  parseProjectStudy,
  parseProtection,
  parseQuestion,
  parseQuestionTime,
  parseResource,
  parseReview,
  parseScoringPoint,
  parseSemester,
  parseSession,
  parseSettings,
  parseShape,
  parseSubmission,
  parseSubtask,
  parseTask,
  parseTaskDraft,
  parseTeachingEvent,
  parseTemplate,
  parseTemplateSubtask,
  parseTimer,
  parseVision,
  pendingReminder,
  planEstimate,
  printInstances,
  printTemplate,
  readLocalData,
  reconcileIdentities,
  recordSession,
  releaseLock,
  reminderIdle,
  replaceAppData,
  require2 as require,
  requiredMinutes,
  resetTo,
  saveTemplate,
  scheduledAt,
  secondsOfDay,
  selectFrameContentPid,
  serializeActiveLock,
  serializeAppData,
  serializeAssessment,
  serializeBlock,
  serializeCompletedStudyTask,
  serializeCorrection,
  serializeEducation,
  serializeErrorAnalysis,
  serializeGrade,
  serializeHabit,
  serializeIdentity,
  serializeLesson,
  serializeLockSchedule,
  serializeLockState,
  serializeMilestone,
  serializePlanFile,
  serializePointAward,
  serializePrintRecord,
  serializePrinting,
  serializeProgressRecord,
  serializeProject,
  serializeProjectStudy,
  serializeProtection,
  serializeQuestion,
  serializeQuestionTime,
  serializeResource,
  serializeReview,
  serializeScoringPoint,
  serializeSemester,
  serializeSession,
  serializeSettings,
  serializeShape,
  serializeSubmission,
  serializeSubtask,
  serializeTask,
  serializeTeachingEvent,
  serializeTemplate,
  serializeTimer,
  serializeVision,
  startDueTask,
  startTeachingTask,
  startTimer,
  summaries,
  syncTemplate,
  taskHasRoundsLeft,
  taskIsVoid,
  teachingTask,
  templateInstance,
  templateRecurring,
  templateTimes,
  tickReminders,
  timerRemaining,
  utf8Len,
  validAppIds,
  validDate,
  validEducationDate,
  validTime,
  validateBlock,
  validateBlocks,
  validateEducation,
  validateEducationTransition,
  validateHabit,
  validateIdentities,
  validateLearning,
  validateLearningTransition,
  validateLock,
  validatePlanFile,
  validateReminderTask,
  validateTeachingTasks,
  validateTemplates,
  weekStart,
  weekdayMonday,
  windowMinutes
};
//! 错误约定：Rust 侧 `AppResult<T> = Result<T, String>`，这里统一改为抛出
//! `AppError`（message 即 Rust 的中文错误文案，测试逐字断言）。
//! 对应 Rust 的 `ok_or(msg)` 即 `throw new AppError(msg)`。
//! 实体 ID：UUID v4（对应 Rust `Uuid::new_v4().to_string()`）。
//! 优先用平台 `crypto.randomUUID`，退化时用 Math.random 实现 RFC 4122 v4。
//! 本地日历与时刻工具。
//!
//! 契约（docs/PLAN_FORMAT.md、docs/BACKUP_FORMAT.md、API.md）：
//! 所有时间戳都是 Unix 秒，按**本机时区**解读（对应 Rust `chrono::Local`）；
//! 日期为 `YYYY-MM-DD`，时间为 `HH:MM`。日历运算按「自然日」进行，不受夏令时影响
//! （对应 Rust `NaiveDate` 的 `checked_add_days`）。
//! 领域数据模型：与 crates/core 的 serde 结构一一对应。
//! 命名规则：TS 内部字段名即 JSON camelCase 名（对应 `#[serde(rename_all="camelCase")]`）。
//! 枚举是字符串字面量联合（serde camelCase 取值），序列化即直接输出。
//! 可选 JSON 字段（serde `Option` / `#[serde(default)]`）解析后统一为 `T | null` 或缺省值；
//! 序列化时按 Rust 的 `skip_serializing_if` 决定是否省略键。
//! JSON 严格解码助手：模拟 serde 的 `deny_unknown_fields`、`#[serde(default)]`
//! 与 camelCase 命名。序列化由各模块手写（键序固定、与 Rust 声明序一致），
//! 保证导出 JSON 形状与旧引擎逐字节可比。
//! 定时锁机：数据模型、跨午夜本地周历、重叠检查与本轮抑制。
//! 对应 crates/core/src/lock.rs。**纯计算**——桌面锁屏执行由原生 guard 负责，
//! runtime 用本模块算出 active 状态后指挥 guard。
//! 课表阻塞时段：计划之外的每周固定占用（课程、实验）。纯描述：不带进度、不管辖实例、不锁机。
//! 对应 crates/core/src/blocks.rs。
//! 习惯组：只带管辖；形状与印刷规则由 templates 管理。
//! 对应 crates/core/src/habits.rs。
//! 时间安排：日期/时间与单次时长校验、当天待处理队列、计时/锁机延后、跨日清理。
//! 对应 crates/core/src/reminders.rs。
//! 模板与印刷：形状印时复制，账本独立于实例，删了不会重现。
//! 对应 crates/core/src/templates.rs。AppData 方法以自由函数 + lib.ts 薄包装提供。
//! 学情证据：已完成任务快照、来源可审计且不可覆写的进度历史、订正检查，
//! 按提交/批改/订正索引计算动态学情摘要及掌握/计时/订正/复测分层。
//! 对应 crates/core/src/learning.rs。
//! 教学实体、持久化事件、资源引用与历史保护。
//! 对应 crates/core/src/education.rs。
//! 教学执行：课程/作业到普通待办的一对一来源关联、改期更新、明确参与、
//! 提交完成与重复作业抑制；计划导出排除并保留教学待办。
//! 对应 crates/core/src/teaching_tasks.rs。
//! 实体身份：删除后仍保留登记；撤销恢复同一任务；跨类型唯一。
//! 对应 crates/core/src/identities.rs。
//! 学习计划 v6：便携计划刻意不含执行历史与本机偏好。
//! 对应 crates/core/src/plan.rs。
//! 共享模型、计时状态机与校验入口。
//! 对应 crates/core/src/lib.rs（Engine 在 engine.ts，桌面 guard 原生保留）。
//! 仅本地 v3→v4 转换：交换文件按当前版本严格校验，不走迁移路径。
//! 对应 crates/core/src/migration.rs（仅文件格式语义）。
//! 可解释的本地信号。不调模型、不猜缺失数据、不自动下结论。
//! 对应 crates/core/src/diagnostics.rs。
//! 专注保护的纯计算部分：窗口集合与白名单判定。
//! 对应 crates/core/src/guard.rs 的 `allowed` 与 guard_windows.rs 的
//! app-id 解析（AUMID / ApplicationFrameHost 共享 UWP 框架 / 完整进程路径）。
//! 不做任何桌面调用——枚举、聚焦与锁屏执行由原生 guard 负责。
//! Engine：预检/提交/持久化/快照。对应 crates/core/src/lib.rs 的 Engine。
//! 持久化：旧引擎用 SQLite；新架构（MIGRATION.md/API.md）以 JSON 文件为唯一数据源。
//! 本实现有两种存储入口：
//! - `Engine.open(path)`：单 JSON 文件（原子写），对应旧 Engine::open(path)；
//! - `Engine.fromData(data, save)`：调用方自带存储（runtime 用它把同一份 AppData
//!   拆成 plan.json/state.json 两个文件）。存储策略只影响落盘方式，校验、身份登记、
//!   教学转移与保护规则完全共用。
//! @tomato/core —— 番茄 Todo 领域核心（crates/core 的语义级 TypeScript 移植）。
//! 零运行时依赖、纯 ESM、可在 Node 直接 import。外部 JSON 形状与旧引擎一致：
//! camelCase、日期 `YYYY-MM-DD`、时间 `HH:MM`、时间戳 Unix 秒
//! （见 docs/PLAN_FORMAT.md 与 docs/BACKUP_FORMAT.md）。
//! 模块索引见 packages/core/CODEMAP.md。
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZXJyb3JzLnRzIiwgIi4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2lkcy50cyIsICIuLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy90aW1lLnRzIiwgIi4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL21vZGVsLnRzIiwgIi4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2pzb24udHMiLCAiLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbG9jay50cyIsICIuLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9ibG9ja3MudHMiLCAiLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaGFiaXRzLnRzIiwgIi4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbWluZGVycy50cyIsICIuLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy90ZW1wbGF0ZXMudHMiLCAiLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGVhcm5pbmcudHMiLCAiLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZWR1Y2F0aW9uLnRzIiwgIi4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3RlYWNoaW5nX3Rhc2tzLnRzIiwgIi4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2lkZW50aXRpZXMudHMiLCAiLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcGxhbi50cyIsICIuLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9saWIudHMiLCAiLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbWlncmF0aW9uLnRzIiwgIi4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpYWdub3N0aWNzLnRzIiwgIi4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2d1YXJkLnRzIiwgIi4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2VuZ2luZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8hIFx1OTUxOVx1OEJFRlx1N0VBNlx1NUI5QVx1RkYxQVJ1c3QgXHU0RkE3IGBBcHBSZXN1bHQ8VD4gPSBSZXN1bHQ8VCwgU3RyaW5nPmBcdUZGMENcdThGRDlcdTkxQ0NcdTdFREZcdTRFMDBcdTY1MzlcdTRFM0FcdTYyOUJcdTUxRkFcbi8vISBgQXBwRXJyb3JgXHVGRjA4bWVzc2FnZSBcdTUzNzMgUnVzdCBcdTc2ODRcdTRFMkRcdTY1ODdcdTk1MTlcdThCRUZcdTY1ODdcdTY4NDhcdUZGMENcdTZENEJcdThCRDVcdTkwMTBcdTVCNTdcdTY1QURcdThBMDBcdUZGMDlcdTMwMDJcbi8vISBcdTVCRjlcdTVFOTQgUnVzdCBcdTc2ODQgYG9rX29yKG1zZylgIFx1NTM3MyBgdGhyb3cgbmV3IEFwcEVycm9yKG1zZylgXHUzMDAyXG5cbmV4cG9ydCBjbGFzcyBBcHBFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gXCJBcHBFcnJvclwiO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnN1cmUob2s6IGJvb2xlYW4sIG1lc3NhZ2U6IHN0cmluZyk6IGFzc2VydHMgb2sge1xuICBpZiAoIW9rKSB0aHJvdyBuZXcgQXBwRXJyb3IobWVzc2FnZSk7XG59XG5cbi8qKiBcdTVCRjkgZmluZC9tYXAuZ2V0IFx1N0I0OVx1NTNFRlx1N0E3QVx1N0VEM1x1Njc5Q1x1NTA1QVx1NjUzNlx1N0E4NFx1RkYxQVJ1c3QgYG9rX29yKG1zZyk/YCBcdTc2ODRcdTc2RjRcdTYzQTVcdTVCRjlcdTVFOTRcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiByZXF1aXJlPFQ+KHZhbHVlOiBUIHwgbnVsbCB8IHVuZGVmaW5lZCwgbWVzc2FnZTogc3RyaW5nKTogVCB7XG4gIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgQXBwRXJyb3IobWVzc2FnZSk7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqIFx1NUI1N1x1N0IyNlx1NjU3MFx1RkYwOFVuaWNvZGUgXHU3ODAxXHU3MEI5XHVGRjA5XHVGRjBDXHU1QkY5XHU1RTk0IFJ1c3QgYHMuY2hhcnMoKS5jb3VudCgpYFx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoYXJDb3VudChzOiBzdHJpbmcpOiBudW1iZXIge1xuICByZXR1cm4gQXJyYXkuZnJvbShzKS5sZW5ndGg7XG59XG5cbi8qKiBVVEYtOCBcdTVCNTdcdTgyODJcdTY1NzBcdUZGMENcdTVCRjlcdTVFOTQgUnVzdCBgcy5sZW4oKWBcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiB1dGY4TGVuKHM6IHN0cmluZyk6IG51bWJlciB7XG4gIGlmICh0eXBlb2YgVGV4dEVuY29kZXIgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICByZXR1cm4gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHMpLmxlbmd0aDtcbiAgfVxuICAvLyBcdTRGRERcdTVCODhcdTU2REVcdTkwMDBcdUZGMUFcdTYzMDkgMyBcdTVCNTdcdTgyODIvXHU3ODAxXHU3MEI5XHU0RjMwXHU3Qjk3XHVGRjA4QVNDSUkgXHU0RUU1XHU0RTBCXHU0RjMwXHU5QUQ4XHU0RTBEXHU0RjFBXHU2NTNFXHU4RkM3XHU4RDg1XHU5NTdGXHU4RjkzXHU1MTY1XHVGRjA5XHUzMDAyXG4gIHJldHVybiBjaGFyQ291bnQocykgKiAzO1xufVxuXG4vKiogXHU2REYxXHU1RUE2XHU1MTRCXHU5Njg2XHU1RTc2XHU0RkREXHU3NTU5XHU1MzlGXHU1NzhCXHVGRjA4QXBwRGF0YS9FZHVjYXRpb24gXHU3QjQ5XHU3QzdCXHU1QjlFXHU0RjhCXHU1MTRCXHU5Njg2XHU1NDBFXHU2NUI5XHU2Q0Q1XHU0RUNEXHU1M0VGXHU3NTI4XHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gY2xvbmU8VD4odmFsdWU6IFQpOiBUIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLm1hcCgodikgPT4gY2xvbmUodikpIGFzIHVua25vd24gYXMgVDtcbiAgfVxuICBpZiAodmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSB7XG4gICAgY29uc3Qgb3V0ID0gT2JqZWN0LmNyZWF0ZShPYmplY3QuZ2V0UHJvdG90eXBlT2YodmFsdWUpKSBhcyBSZWNvcmQ8XG4gICAgICBzdHJpbmcsXG4gICAgICB1bmtub3duXG4gICAgPjtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyh2YWx1ZSkpIHtcbiAgICAgIG91dFtrZXldID0gY2xvbmUoKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtrZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIG91dCBhcyBUO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqIFx1N0VEM1x1Njc4NFx1NTMxNlx1NzZGOFx1N0I0OVx1RkYxQUpTT04gXHU1MDNDXHU3RUE3XHU1MjJCXHU3Njg0XHU2REYxXHU1RUE2XHU2QkQ0XHU4RjgzXHVGRjA4XHU1NDJCXHU1QjU3XHU2QkI1XHU5ODdBXHU1RThGXHU2NUUwXHU1MTczXHU3Njg0XHU5NTJFXHU2QkQ0XHU4RjgzXHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gZGVlcEVxdWFsKGE6IHVua25vd24sIGI6IHVua25vd24pOiBib29sZWFuIHtcbiAgaWYgKGEgPT09IGIpIHJldHVybiB0cnVlO1xuICBpZiAoQXJyYXkuaXNBcnJheShhKSAmJiBBcnJheS5pc0FycmF5KGIpKSB7XG4gICAgcmV0dXJuIGEubGVuZ3RoID09PSBiLmxlbmd0aCAmJiBhLmV2ZXJ5KCh2LCBpKSA9PiBkZWVwRXF1YWwodiwgYltpXSkpO1xuICB9XG4gIGlmIChcbiAgICB0eXBlb2YgYSA9PT0gXCJvYmplY3RcIiAmJlxuICAgIGEgIT09IG51bGwgJiZcbiAgICB0eXBlb2YgYiA9PT0gXCJvYmplY3RcIiAmJlxuICAgIGIgIT09IG51bGwgJiZcbiAgICAhQXJyYXkuaXNBcnJheShhKSAmJlxuICAgICFBcnJheS5pc0FycmF5KGIpXG4gICkge1xuICAgIGNvbnN0IGthID0gT2JqZWN0LmtleXMoYSk7XG4gICAgY29uc3Qga2IgPSBPYmplY3Qua2V5cyhiKTtcbiAgICBpZiAoa2EubGVuZ3RoICE9PSBrYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4ga2EuZXZlcnkoKGspID0+XG4gICAgICBkZWVwRXF1YWwoXG4gICAgICAgIChhIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtrXSxcbiAgICAgICAgKGIgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tdLFxuICAgICAgKSxcbiAgICApO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbiIsICIvLyEgXHU1QjlFXHU0RjUzIElEXHVGRjFBVVVJRCB2NFx1RkYwOFx1NUJGOVx1NUU5NCBSdXN0IGBVdWlkOjpuZXdfdjQoKS50b19zdHJpbmcoKWBcdUZGMDlcdTMwMDJcbi8vISBcdTRGMThcdTUxNDhcdTc1MjhcdTVFNzNcdTUzRjAgYGNyeXB0by5yYW5kb21VVUlEYFx1RkYwQ1x1OTAwMFx1NTMxNlx1NjVGNlx1NzUyOCBNYXRoLnJhbmRvbSBcdTVCOUVcdTczQjAgUkZDIDQxMjIgdjRcdTMwMDJcblxuZXhwb3J0IGZ1bmN0aW9uIGlkKCk6IHN0cmluZyB7XG4gIGNvbnN0IGNyeXB0byA9IGdsb2JhbFRoaXMuY3J5cHRvIGFzIHsgcmFuZG9tVVVJRD86ICgpID0+IHN0cmluZyB9IHwgdW5kZWZpbmVkO1xuICBpZiAoY3J5cHRvICYmIHR5cGVvZiBjcnlwdG8ucmFuZG9tVVVJRCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgcmV0dXJuIGNyeXB0by5yYW5kb21VVUlEKCk7XG4gIH1cbiAgLy8gUkZDIDQxMjIgdjQgXHU5MDAwXHU1MzE2XHU1QjlFXHU3M0IwXHVGRjA4XHU0RUM1XHU3NTI4XHU0RThFXHU2NUUwIGNyeXB0byBcdTc2ODRcdTczQUZcdTU4ODNcdUZGMDlcdTMwMDJcbiAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheSgxNik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkgKz0gMSkgYnl0ZXNbaV0gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyNTYpO1xuICBieXRlc1s2XSA9IChieXRlc1s2XSEgJiAweDBmKSB8IDB4NDA7XG4gIGJ5dGVzWzhdID0gKGJ5dGVzWzhdISAmIDB4M2YpIHwgMHg4MDtcbiAgY29uc3QgaGV4ID0gQXJyYXkuZnJvbShieXRlcywgKGIpID0+IGIudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsIFwiMFwiKSkuam9pbihcbiAgICBcIlwiLFxuICApO1xuICByZXR1cm4gYCR7aGV4LnNsaWNlKDAsIDgpfS0ke2hleC5zbGljZSg4LCAxMil9LSR7aGV4LnNsaWNlKDEyLCAxNil9LSR7aGV4LnNsaWNlKDE2LCAyMCl9LSR7aGV4LnNsaWNlKDIwKX1gO1xufVxuIiwgIi8vISBcdTY3MkNcdTU3MzBcdTY1RTVcdTUzODZcdTRFMEVcdTY1RjZcdTUyM0JcdTVERTVcdTUxNzdcdTMwMDJcbi8vIVxuLy8hIFx1NTk1MVx1N0VBNlx1RkYwOGRvY3MvUExBTl9GT1JNQVQubWRcdTMwMDFkb2NzL0JBQ0tVUF9GT1JNQVQubWRcdTMwMDFBUEkubWRcdUZGMDlcdUZGMUFcbi8vISBcdTYyNDBcdTY3MDlcdTY1RjZcdTk1RjRcdTYyMzNcdTkwRkRcdTY2MkYgVW5peCBcdTc5RDJcdUZGMENcdTYzMDkqKlx1NjcyQ1x1NjczQVx1NjVGNlx1NTMzQSoqXHU4OUUzXHU4QkZCXHVGRjA4XHU1QkY5XHU1RTk0IFJ1c3QgYGNocm9ubzo6TG9jYWxgXHVGRjA5XHVGRjFCXG4vLyEgXHU2NUU1XHU2NzFGXHU0RTNBIGBZWVlZLU1NLUREYFx1RkYwQ1x1NjVGNlx1OTVGNFx1NEUzQSBgSEg6TU1gXHUzMDAyXHU2NUU1XHU1Mzg2XHU4RkQwXHU3Qjk3XHU2MzA5XHUzMDBDXHU4MUVBXHU3MTM2XHU2NUU1XHUzMDBEXHU4RkRCXHU4ODRDXHVGRjBDXHU0RTBEXHU1M0Q3XHU1OTBGXHU0RUU0XHU2NUY2XHU1RjcxXHU1NENEXG4vLyEgXHVGRjA4XHU1QkY5XHU1RTk0IFJ1c3QgYE5haXZlRGF0ZWAgXHU3Njg0IGBjaGVja2VkX2FkZF9kYXlzYFx1RkYwOVx1MzAwMlxuXG5leHBvcnQgaW50ZXJmYWNlIENhbGVuZGFyRGF0ZSB7XG4gIHllYXI6IG51bWJlcjtcbiAgbW9udGg6IG51bWJlcjtcbiAgZGF5OiBudW1iZXI7XG59XG5cbmNvbnN0IERBWV9NUyA9IDg2NDAwMDAwO1xuXG5jb25zdCBwYWQyID0gKG46IG51bWJlcik6IHN0cmluZyA9PiAobiA8IDEwID8gYDAke259YCA6IFN0cmluZyhuKSk7XG5jb25zdCBwYWQ0ID0gKG46IG51bWJlcik6IHN0cmluZyA9PiBTdHJpbmcobikucGFkU3RhcnQoNCwgXCIwXCIpO1xuXG4vKiogVW5peCBcdTc5RDIgXHUyMTkyIFx1NjcyQ1x1NjczQVx1NjVFNVx1NTM4Nlx1NjVFNVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvY2FsRGF0ZU9mKGF0OiBudW1iZXIpOiBDYWxlbmRhckRhdGUge1xuICBjb25zdCBkID0gbmV3IERhdGUoYXQgKiAxMDAwKTtcbiAgcmV0dXJuIHsgeWVhcjogZC5nZXRGdWxsWWVhcigpLCBtb250aDogZC5nZXRNb250aCgpICsgMSwgZGF5OiBkLmdldERhdGUoKSB9O1xufVxuXG4vKiogVW5peCBcdTc5RDIgXHUyMTkyIFx1NjcyQ1x1NjczQVx1NjVFNVx1NjcxRiBgWVlZWS1NTS1ERGBcdUZGMDhcdTVCRjlcdTVFOTQgYGNyYXRlOjpkYXRlX2F0YFx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRhdGVBdChhdDogbnVtYmVyKTogc3RyaW5nIHtcbiAgY29uc3QgeyB5ZWFyLCBtb250aCwgZGF5IH0gPSBsb2NhbERhdGVPZihhdCk7XG4gIHJldHVybiBgJHtwYWQ0KHllYXIpfS0ke3BhZDIobW9udGgpfS0ke3BhZDIoZGF5KX1gO1xufVxuXG4vKipcbiAqIFx1ODlFM1x1Njc5MCBgWVlZWS1NTS1ERGBcdUZGMUJcdTY1RTBcdTY1NDhcdTYyMTZcdTk3NUVcdTc3MUZcdTVCOUVcdTY1RTVcdTY3MUZcdUZGMDhcdTU5ODIgMjAyNi0wMi0zMFx1RkYwOVx1OEZENFx1NTZERSBudWxsXHUzMDAyXG4gKiBcdTVCRjlcdTVFOTQgYE5haXZlRGF0ZTo6cGFyc2VfZnJvbV9zdHIocywgXCIlWS0lbS0lZFwiKWBcdTMwMDJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRGF0ZSh2YWx1ZTogc3RyaW5nKTogQ2FsZW5kYXJEYXRlIHwgbnVsbCB7XG4gIGlmICghL15cXGR7NH0tXFxkezJ9LVxcZHsyfSQvLnRlc3QodmFsdWUpKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgeWVhciA9IE51bWJlcih2YWx1ZS5zbGljZSgwLCA0KSk7XG4gIGNvbnN0IG1vbnRoID0gTnVtYmVyKHZhbHVlLnNsaWNlKDUsIDcpKTtcbiAgY29uc3QgZGF5ID0gTnVtYmVyKHZhbHVlLnNsaWNlKDgsIDEwKSk7XG4gIGNvbnN0IHByb2JlID0gbmV3IERhdGUoRGF0ZS5VVEMoeWVhciwgbW9udGggLSAxLCBkYXkpKTtcbiAgaWYgKFxuICAgIHByb2JlLmdldFVUQ0Z1bGxZZWFyKCkgIT09IHllYXIgfHxcbiAgICBwcm9iZS5nZXRVVENNb250aCgpICE9PSBtb250aCAtIDEgfHxcbiAgICBwcm9iZS5nZXRVVENEYXRlKCkgIT09IGRheVxuICApIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4geyB5ZWFyLCBtb250aCwgZGF5IH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZERhdGUodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gcGFyc2VEYXRlKHZhbHVlKSAhPT0gbnVsbDtcbn1cblxuLyoqIFx1ODFFQVx1NzEzNlx1NjVFNVx1NTJBMFx1NkNENVx1RkYwOFx1NTNFRlx1OEQxRlx1RkYwOVx1RkYwQ1x1NEUwRVx1NTkwRlx1NEVFNFx1NjVGNlx1NjVFMFx1NTE3M1x1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZERheXMoZGF0ZTogQ2FsZW5kYXJEYXRlLCBkYXlzOiBudW1iZXIpOiBDYWxlbmRhckRhdGUge1xuICBjb25zdCB0ID0gbmV3IERhdGUoRGF0ZS5VVEMoZGF0ZS55ZWFyLCBkYXRlLm1vbnRoIC0gMSwgZGF0ZS5kYXkgKyBkYXlzKSk7XG4gIHJldHVybiB7XG4gICAgeWVhcjogdC5nZXRVVENGdWxsWWVhcigpLFxuICAgIG1vbnRoOiB0LmdldFVUQ01vbnRoKCkgKyAxLFxuICAgIGRheTogdC5nZXRVVENEYXRlKCksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wYXJlRGF0ZXMoYTogQ2FsZW5kYXJEYXRlLCBiOiBDYWxlbmRhckRhdGUpOiBudW1iZXIge1xuICByZXR1cm4gYS55ZWFyIC0gYi55ZWFyIHx8IGEubW9udGggLSBiLm1vbnRoIHx8IGEuZGF5IC0gYi5kYXk7XG59XG5cbi8qKiAxID0gXHU1NDY4XHU0RTAwIFx1MjAyNiA3ID0gXHU1NDY4XHU2NUU1XHVGRjA4XHU1QkY5XHU1RTk0IGB3ZWVrZGF5KCkubnVtYmVyX2Zyb21fbW9uZGF5KClgXHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gd2Vla2RheU1vbmRheShkYXRlOiBDYWxlbmRhckRhdGUpOiBudW1iZXIge1xuICBjb25zdCBkYXkgPSBuZXcgRGF0ZShcbiAgICBEYXRlLlVUQyhkYXRlLnllYXIsIGRhdGUubW9udGggLSAxLCBkYXRlLmRheSksXG4gICkuZ2V0VVRDRGF5KCk7IC8vIDAgPSBTdW5kYXlcbiAgcmV0dXJuIGRheSA9PT0gMCA/IDcgOiBkYXk7XG59XG5cbi8qKiBcdTYyNDBcdTU3MjhcdTU0NjhcdTc2ODRcdTU0NjhcdTRFMDBcdUZGMDhcdTVCRjlcdTVFOTQgdGVtcGxhdGVzOjp3ZWVrX3N0YXJ0XHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gd2Vla1N0YXJ0KGRhdGU6IENhbGVuZGFyRGF0ZSk6IENhbGVuZGFyRGF0ZSB7XG4gIHJldHVybiBhZGREYXlzKGRhdGUsIC0od2Vla2RheU1vbmRheShkYXRlKSAtIDEpKTtcbn1cblxuLyoqIFx1NEUyNFx1NEUyQVx1NjVFNVx1NTM4Nlx1NjVFNVx1NzZGOFx1NURFRVx1NzY4NFx1ODFFQVx1NzEzNlx1NjVFNVx1NjU3MFx1RkYwOHRvIC0gZnJvbVx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRheXNCZXR3ZWVuKGZyb206IENhbGVuZGFyRGF0ZSwgdG86IENhbGVuZGFyRGF0ZSk6IG51bWJlciB7XG4gIGNvbnN0IGEgPSBEYXRlLlVUQyhmcm9tLnllYXIsIGZyb20ubW9udGggLSAxLCBmcm9tLmRheSk7XG4gIGNvbnN0IGIgPSBEYXRlLlVUQyh0by55ZWFyLCB0by5tb250aCAtIDEsIHRvLmRheSk7XG4gIHJldHVybiBNYXRoLmZsb29yKChiIC0gYSkgLyBEQVlfTVMpO1xufVxuXG4vKiogXHU2NUU1XHU1Mzg2XHU2NUU1IFx1MjE5MiBgWVlZWS1NTS1ERGBcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXREYXRlKGRhdGU6IENhbGVuZGFyRGF0ZSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtwYWQ0KGRhdGUueWVhcil9LSR7cGFkMihkYXRlLm1vbnRoKX0tJHtwYWQyKGRhdGUuZGF5KX1gO1xufVxuXG4vKiogXHU2NzJDXHU2NzNBXHU2NUU1XHU2NzFGXHU2NUY2XHU1MjNCIFx1MjE5MiBVbml4IFx1NzlEMlx1RkYwOFx1NUJGOVx1NUU5NCBgTG9jYWwud2l0aF95bWRfYW5kX2htcyguLi4pLnRpbWVzdGFtcCgpYFx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF0TG9jYWwoXG4gIHllYXI6IG51bWJlcixcbiAgbW9udGg6IG51bWJlcixcbiAgZGF5OiBudW1iZXIsXG4gIGhvdXI6IG51bWJlcixcbiAgbWludXRlOiBudW1iZXIsXG4gIHNlY29uZCA9IDAsXG4pOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC5mbG9vcihcbiAgICBuZXcgRGF0ZSh5ZWFyLCBtb250aCAtIDEsIGRheSwgaG91ciwgbWludXRlLCBzZWNvbmQpLmdldFRpbWUoKSAvIDEwMDAsXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhdExvY2FsRGF0ZShkYXRlOiBDYWxlbmRhckRhdGUsIGhvdXIgPSAwLCBtaW51dGUgPSAwKTogbnVtYmVyIHtcbiAgcmV0dXJuIGF0TG9jYWwoZGF0ZS55ZWFyLCBkYXRlLm1vbnRoLCBkYXRlLmRheSwgaG91ciwgbWludXRlKTtcbn1cblxuLyoqIGBZWVlZLU1NLUREYCBcdTIxOTIgXHU4QkU1XHU2NUU1XHU2NzJDXHU2NzNBIDAwOjAwIFx1NzY4NCBVbml4IFx1NzlEMlx1RkYxQlx1NjVFMFx1NjU0OFx1NjVFNVx1NjcxRlx1OEZENFx1NTZERSBudWxsXHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gYXRMb2NhbERhdGVTdHJpbmcoZGF0ZTogc3RyaW5nKTogbnVtYmVyIHwgbnVsbCB7XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlRGF0ZShkYXRlKTtcbiAgaWYgKHBhcnNlZCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIHJldHVybiBhdExvY2FsRGF0ZShwYXJzZWQpO1xufVxuXG4vKiogVW5peCBcdTc5RDIgXHUyMTkyIFx1NjcyQ1x1NjczQSBgSEg6TU1gXHVGRjA4XHU1QkY5XHU1RTk0IGB0LmZvcm1hdChcIiVIOiVNXCIpYFx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhvdXJNaW51dGVTdHJpbmcoYXQ6IG51bWJlcik6IHN0cmluZyB7XG4gIGNvbnN0IGQgPSBuZXcgRGF0ZShhdCAqIDEwMDApO1xuICByZXR1cm4gYCR7cGFkMihkLmdldEhvdXJzKCkpfToke3BhZDIoZC5nZXRNaW51dGVzKCkpfWA7XG59XG5cbi8qKiBVbml4IFx1NzlEMiBcdTIxOTIgXHU2NzJDXHU2NzNBXHU1RjUzXHU1OTI5XHU1REYyXHU4RkM3XHU3OUQyXHU2NTcwXHVGRjA4MFx1MjAxMzg2Mzk5XHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gc2Vjb25kc09mRGF5KGF0OiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBkID0gbmV3IERhdGUoYXQgKiAxMDAwKTtcbiAgcmV0dXJuIGQuZ2V0SG91cnMoKSAqIDM2MDAgKyBkLmdldE1pbnV0ZXMoKSAqIDYwICsgZC5nZXRTZWNvbmRzKCk7XG59XG5cbi8qKiBVbml4IFx1NzlEMiBcdTIxOTIgXHU2NzJDXHU2NzNBIGAoaG91ciwgbWludXRlKWBcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBob3VyTWludXRlT2YoYXQ6IG51bWJlcik6IHsgaG91cjogbnVtYmVyOyBtaW51dGU6IG51bWJlciB9IHtcbiAgY29uc3QgZCA9IG5ldyBEYXRlKGF0ICogMTAwMCk7XG4gIHJldHVybiB7IGhvdXI6IGQuZ2V0SG91cnMoKSwgbWludXRlOiBkLmdldE1pbnV0ZXMoKSB9O1xufVxuXG4vKipcbiAqIFx1NjgyMVx1OUE4QyBgSEg6TU1gXHVGRjFBXHU5NTdGXHU1RUE2IDVcdTMwMDFcdTdCMkMgMyBcdTRGNERcdTY2MkYgYDpgXHUzMDAxXHU2NTcwXHU1QjU3XHU0RTE0IFx1NUMwRlx1NjVGNiBcdTIyNjQgMjNcdTMwMDFcdTUyMDZcdTk0OUYgXHUyMjY0IDU5XHUzMDAyXG4gKiBcdTVCRjlcdTVFOTQgdGVtcGxhdGVzOjp2YWxpZF90aW1lXHUzMDAyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZFRpbWUodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIHZhbHVlLmxlbmd0aCA9PT0gNSAmJlxuICAgIHZhbHVlLmNoYXJDb2RlQXQoMikgPT09IDU4IC8qICc6JyAqLyAmJlxuICAgIHZhbHVlLnNsaWNlKDAsIDIpID49IFwiMDBcIiAmJlxuICAgIHZhbHVlLnNsaWNlKDAsIDIpIDw9IFwiMjNcIiAmJlxuICAgIHZhbHVlLnNsaWNlKDMpID49IFwiMDBcIiAmJlxuICAgIHZhbHVlLnNsaWNlKDMpIDw9IFwiNTlcIlxuICApO1xufVxuXG4vKiogYEhIOk1NYCBcdTIxOTIgXHU1MjA2XHU5NDlGXHU2NTcwXHVGRjFCXHU2NUUwXHU2NTQ4XHU4RkQ0XHU1NkRFIG51bGxcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBtaW51dGVzT2YodmFsdWU6IHN0cmluZyk6IG51bWJlciB8IG51bGwge1xuICBpZiAodmFsdWUubGVuZ3RoICE9PSA1IHx8IHZhbHVlLmNoYXJDb2RlQXQoMikgIT09IDU4KSByZXR1cm4gbnVsbDtcbiAgY29uc3QgaG91ciA9IE51bWJlcih2YWx1ZS5zbGljZSgwLCAyKSk7XG4gIGNvbnN0IG1pbnV0ZSA9IE51bWJlcih2YWx1ZS5zbGljZSgzKSk7XG4gIGlmIChcbiAgICAhTnVtYmVyLmlzSW50ZWdlcihob3VyKSB8fFxuICAgICFOdW1iZXIuaXNJbnRlZ2VyKG1pbnV0ZSkgfHxcbiAgICBob3VyID4gMjMgfHxcbiAgICBtaW51dGUgPiA1OVxuICApIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gaG91ciAqIDYwICsgbWludXRlO1xufVxuXG4vKiogXHU1RjUzXHU1MjREIFVuaXggXHU3OUQyXHVGRjA4XHU1QkY5XHU1RTk0IGBjcmF0ZTo6bm93YFx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vdygpOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCk7XG59XG4iLCAiLy8hIFx1OTg4Nlx1NTdERlx1NjU3MFx1NjM2RVx1NkEyMVx1NTc4Qlx1RkYxQVx1NEUwRSBjcmF0ZXMvY29yZSBcdTc2ODQgc2VyZGUgXHU3RUQzXHU2Nzg0XHU0RTAwXHU0RTAwXHU1QkY5XHU1RTk0XHUzMDAyXG4vLyFcbi8vISBcdTU0N0RcdTU0MERcdTg5QzRcdTUyMTlcdUZGMUFUUyBcdTUxODVcdTkwRThcdTVCNTdcdTZCQjVcdTU0MERcdTUzNzMgSlNPTiBjYW1lbENhc2UgXHU1NDBEXHVGRjA4XHU1QkY5XHU1RTk0IGAjW3NlcmRlKHJlbmFtZV9hbGw9XCJjYW1lbENhc2VcIildYFx1RkYwOVx1MzAwMlxuLy8hIFx1Njc5QVx1NEUzRVx1NjYyRlx1NUI1N1x1N0IyNlx1NEUzMlx1NUI1N1x1OTc2Mlx1OTFDRlx1ODA1NFx1NTQwOFx1RkYwOHNlcmRlIGNhbWVsQ2FzZSBcdTUzRDZcdTUwM0NcdUZGMDlcdUZGMENcdTVFOEZcdTUyMTdcdTUzMTZcdTUzNzNcdTc2RjRcdTYzQTVcdThGOTNcdTUxRkFcdTMwMDJcbi8vISBcdTUzRUZcdTkwMDkgSlNPTiBcdTVCNTdcdTZCQjVcdUZGMDhzZXJkZSBgT3B0aW9uYCAvIGAjW3NlcmRlKGRlZmF1bHQpXWBcdUZGMDlcdTg5RTNcdTY3OTBcdTU0MEVcdTdFREZcdTRFMDBcdTRFM0EgYFQgfCBudWxsYCBcdTYyMTZcdTdGM0FcdTc3MDFcdTUwM0NcdUZGMUJcbi8vISBcdTVFOEZcdTUyMTdcdTUzMTZcdTY1RjZcdTYzMDkgUnVzdCBcdTc2ODQgYHNraXBfc2VyaWFsaXppbmdfaWZgIFx1NTFCM1x1NUI5QVx1NjYyRlx1NTQyNlx1NzcwMVx1NzU2NVx1OTUyRVx1MzAwMlxuXG5leHBvcnQgaW50ZXJmYWNlIFByb2plY3Qge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGNvbG9yOiBzdHJpbmc7XG4gIC8qKiBcdTYzRDBcdTRGOUJcdTY1RjZcdTY2RkZcdTRFRTNcdTkwMUFcdTc1MjhcdTc2N0RcdTU0MERcdTUzNTVcdUZGMUJcdTVFOEZcdTUyMTdcdTUzMTZcdTY1RjYgbnVsbCBcdTc3MDFcdTc1NjVcdUZGMDhza2lwX3NlcmlhbGl6aW5nX2lmXHVGRjA5XHUzMDAyICovXG4gIGFwcFdoaXRlbGlzdDogc3RyaW5nW10gfCBudWxsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEhhYml0U2xvdCB7XG4gIC8qKiAxID0gXHU1NDY4XHU0RTAwIFx1MjAyNiA3ID0gXHU1NDY4XHU2NUU1XHUzMDAyICovXG4gIGRheXM6IG51bWJlcltdO1xuICB0aW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSGFiaXQge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmlzaW9uIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBub3Rlczogc3RyaW5nO1xuICAvKiogXHU1RThGXHU1MjE3XHU1MzE2XHU2NUY2IG51bGwgXHU3NzAxXHU3NTY1XHUzMDAyICovXG4gIHByb2plY3RJZDogc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWJ0YXNrIHtcbiAgaWQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgZG9uZTogYm9vbGVhbjtcbn1cblxuLyoqIFx1N0JBMVx1OEY5Nlx1NTIwNlx1N0M3Qlx1RkYxQVx1NzUzMVx1NTFCQlx1N0VEM1x1NUI1N1x1NkJCNVx1NjNBOFx1NUJGQ1x1RkYwQ1x1NkMzOFx1NEUwRFx1NEY1Q1x1NEUzQVx1NzUyOFx1NjIzN1x1NjU3MFx1NjM2RVx1NUI1OFx1NTBBOFx1MzAwMiAqL1xuZXhwb3J0IHR5cGUgVGFza0tpbmQgPSBcIm9yZGluYXJ5XCIgfCBcImhhYml0XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFzayB7XG4gIGlkOiBzdHJpbmc7XG4gIHRlbXBsYXRlSWQ6IHN0cmluZyB8IG51bGw7XG4gIC8qKiBcdTUzNzBcdTUyMzdcdTY1RjZcdTUxQkJcdTdFRDNcdTc2ODRcdTkxQ0RcdTU5MERcdTY3NjVcdTZFOTBcdUZGMUJcdTY1MzlcdTZBMjFcdTY3N0ZcdTRFMERcdTkxQ0RcdTUxOTlcdTUzODZcdTUzRjJcdTUyMDZcdTdDN0JcdTMwMDIgKi9cbiAgcmVjdXJyaW5nOiBib29sZWFuO1xuICB0aXRsZTogc3RyaW5nO1xuICBub3Rlczogc3RyaW5nO1xuICBwcm9qZWN0SWQ6IHN0cmluZyB8IG51bGw7XG4gIGhhYml0SWQ6IHN0cmluZyB8IG51bGw7XG4gIGR1ZURhdGU6IHN0cmluZyB8IG51bGw7XG4gIHJlbWluZGVyVGltZTogc3RyaW5nIHwgbnVsbDtcbiAgZm9jdXNNaW51dGVzOiBudW1iZXIgfCBudWxsO1xuICAvKiogXHU2NjZFXHU5MDFBXHU0RUZCXHU1MkExXHU4QkExXHU1MjEyXHU1NzU3XHU3RUQzXHU2NzVGXHU1NDBFXHU3Njg0XHU5NzU5XHU2MDAxXHU5MUNEXHU0RkVFXHU3QTk3XHU1M0UzXHVGRjA4XHU1MjA2XHU5NDlGXHVGRjA5XHVGRjFCMCBcdTUzNzNcdTUyMzBcdTcwQjlcdTRGNUNcdTVFOUZcdTMwMDIgKi9cbiAgc2NyYXBNaW51dGVzOiBudW1iZXI7XG4gIHByaW9yaXR5OiBudW1iZXI7XG4gIGVzdGltYXRlOiBudW1iZXI7XG4gIHJlbWluZGVyRmlyZWQ6IGJvb2xlYW47XG4gIHJlbWluZGVyUGVuZGluZzogYm9vbGVhbjtcbiAgcmVtaW5kZXJFeHBpcmVkOiBib29sZWFuO1xuICBjb21wbGV0ZWQ6IGJvb2xlYW47XG4gIGNvbXBsZXRlZEF0OiBudW1iZXIgfCBudWxsO1xuICBjcmVhdGVkQXQ6IG51bWJlcjtcbiAgdGFnczogc3RyaW5nW107XG4gIHN1YnRhc2tzOiBTdWJ0YXNrW107XG59XG5cbi8qKiBcdTRFRkJcdTUyQTFcdTc2ODRcdTdCQTFcdThGOTZcdTUyMDZcdTdDN0JcdUZGMDhcdTUzNTVcdTRFMDBcdTY3NDNcdTVBMDFcdTVCOUFcdTRFNDlcdUZGMENcdThCRkJcdTUxQkJcdTdFRDNcdTVCNTdcdTZCQjVcdUZGMDlcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBraW5kT2YoXG4gIHRhc2s6IFBpY2s8VGFzaywgXCJyZW1pbmRlclRpbWVcIiB8IFwiaGFiaXRJZFwiIHwgXCJyZWN1cnJpbmdcIj4sXG4pOiBUYXNrS2luZCB7XG4gIHJldHVybiB0YXNrLnJlbWluZGVyVGltZSAhPT0gbnVsbCAmJiAodGFzay5oYWJpdElkICE9PSBudWxsIHx8IHRhc2sucmVjdXJyaW5nKVxuICAgID8gXCJoYWJpdFwiXG4gICAgOiBcIm9yZGluYXJ5XCI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0hhYml0KFxuICB0YXNrOiBQaWNrPFRhc2ssIFwicmVtaW5kZXJUaW1lXCIgfCBcImhhYml0SWRcIiB8IFwicmVjdXJyaW5nXCI+LFxuKTogYm9vbGVhbiB7XG4gIHJldHVybiBraW5kT2YodGFzaykgPT09IFwiaGFiaXRcIjtcbn1cblxuZXhwb3J0IHR5cGUgUmVwZWF0ID0gXCJub25lXCIgfCBcImRhaWx5XCIgfCBcIndlZWtkYXlzXCIgfCBcIndlZWtseVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFRhc2tEcmFmdCB7XG4gIGlkOiBzdHJpbmcgfCBudWxsO1xuICB0aXRsZTogc3RyaW5nO1xuICBub3Rlczogc3RyaW5nO1xuICBwcm9qZWN0SWQ6IHN0cmluZyB8IG51bGw7XG4gIGR1ZURhdGU6IHN0cmluZyB8IG51bGw7XG4gIHJlbWluZGVyVGltZTogc3RyaW5nIHwgbnVsbDtcbiAgZm9jdXNNaW51dGVzOiBudW1iZXIgfCBudWxsO1xuICBzY3JhcE1pbnV0ZXM6IG51bWJlcjtcbiAgcHJpb3JpdHk6IG51bWJlcjtcbiAgZXN0aW1hdGU6IG51bWJlcjtcbiAgdGFnczogc3RyaW5nW107XG4gIHN1YnRhc2tzOiBTdWJ0YXNrW107XG4gIHJlcGVhdDogUmVwZWF0O1xufVxuXG5leHBvcnQgdHlwZSBHdWFyZE1vZGUgPSBcIm9mZlwiIHwgXCJsb2NrXCIgfCBcIndoaXRlbGlzdFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFByb3RlY3Rpb24ge1xuICBtb2RlOiBHdWFyZE1vZGU7XG4gIHdoaXRlbGlzdDogc3RyaW5nW107XG4gIHN0cmljdDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5ncyB7XG4gIGZvY3VzTWludXRlczogbnVtYmVyO1xuICBzaG9ydEJyZWFrTWludXRlczogbnVtYmVyO1xuICBsb25nQnJlYWtNaW51dGVzOiBudW1iZXI7XG4gIGxvbmdCcmVha0V2ZXJ5OiBudW1iZXI7XG4gIGRhaWx5R29hbDogbnVtYmVyO1xuICBhdXRvQnJlYWs6IGJvb2xlYW47XG4gIGF1dG9Gb2N1czogYm9vbGVhbjtcbiAgYXV0b1N0YXJ0VGFza3M6IGJvb2xlYW47XG4gIHNvdW5kOiBib29sZWFuO1xuICBzb3VuZFZvbHVtZTogbnVtYmVyO1xuICBub3RpZmljYXRpb25zOiBib29sZWFuO1xuICBhbHdheXNPblRvcDogYm9vbGVhbjtcbiAgdGhlbWU6IHN0cmluZztcbiAgcGVyc29uYUJhY2tkcm9wOiBib29sZWFuO1xuICBwcm90ZWN0aW9uOiBQcm90ZWN0aW9uO1xufVxuXG5leHBvcnQgdHlwZSBNb2RlID0gXCJmb2N1c1wiIHwgXCJzaG9ydEJyZWFrXCIgfCBcImxvbmdCcmVha1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFRpbWVyIHtcbiAgbW9kZTogTW9kZTtcbiAgcnVubmluZzogYm9vbGVhbjtcbiAgdGFza0lkOiBzdHJpbmcgfCBudWxsO1xuICBkdXJhdGlvblNlY3M6IG51bWJlcjtcbiAgcmVtYWluaW5nU2VjczogbnVtYmVyO1xuICBkZWFkbGluZTogbnVtYmVyIHwgbnVsbDtcbiAgc3RhcnRlZEF0OiBudW1iZXIgfCBudWxsO1xuICBjeWNsZTogbnVtYmVyO1xuICBjeWNsZURhdGU6IHN0cmluZyB8IG51bGw7XG4gIGNvbXBsZXRpb25TZXJpYWw6IG51bWJlcjtcbiAgbGFzdEZpbmlzaGVkTW9kZTogTW9kZSB8IG51bGw7XG4gIGF1dG9Gb2N1c0Jsb2NrZWQ6IGJvb2xlYW47XG59XG5cbmV4cG9ydCB0eXBlIFNlc3Npb25Tb3VyY2UgPSBcInRpbWVyXCIgfCBcInRhc2tFc3RpbWF0ZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb24ge1xuICBpZDogc3RyaW5nO1xuICBzb3VyY2U6IFNlc3Npb25Tb3VyY2U7XG4gIHRhc2tJZDogc3RyaW5nIHwgbnVsbDtcbiAgdGFza1RpdGxlOiBzdHJpbmc7XG4gIHByb2plY3ROYW1lOiBzdHJpbmc7XG4gIHN0YXJ0ZWRBdDogbnVtYmVyO1xuICBlbmRlZEF0OiBudW1iZXI7XG4gIGR1cmF0aW9uU2VjczogbnVtYmVyO1xuICBjb21wbGV0ZWQ6IGJvb2xlYW47XG59XG5cbmV4cG9ydCB0eXBlIERldGFjaFRhcmdldCA9IFwicHJvamVjdFwiIHwgXCJoYWJpdFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIERheVN0YXQge1xuICBkYXRlOiBzdHJpbmc7XG4gIHNlY29uZHM6IG51bWJlcjtcbiAgcG9tb2Rvcm9zOiBudW1iZXI7XG4gIC8qKiBcdTVCOUFcdTY1RjZcdTkxQ0RcdTU5MERcdTRFNjBcdTYwRUZcdTVGNTNcdTU5MjlcdTUyMzBcdTY3MUZcdTY3MkFcdTVCOENcdTYyMTBcdTMwMDIgKi9cbiAgbWlzc2VkOiBudW1iZXI7XG4gIGNvbXBsZXRlZDogbnVtYmVyO1xuICAvKiogXHU2NjZFXHU5MDFBXHU1QjlBXHU2NUY2XHU1QjlFXHU0RjhCXHU1RjUzXHU1OTI5XHU0RjVDXHU1RTlGXHU2NzJBXHU1QjhDXHU2MjEwXHUzMDAyICovXG4gIHZvaWRlZDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN0YXRzIHtcbiAgdG9kYXlTZWNvbmRzOiBudW1iZXI7XG4gIHRvZGF5UG9tb2Rvcm9zOiBudW1iZXI7XG4gIHRvZGF5Q29tcGxldGVkOiBudW1iZXI7XG4gIHRvdGFsU2Vjb25kczogbnVtYmVyO1xuICB0b3RhbFBvbW9kb3JvczogbnVtYmVyO1xuICBzdHJlYWs6IG51bWJlcjtcbiAgZGF5czogRGF5U3RhdFtdO1xufVxuXG4vLyAtLS0tLS0tLS0tIFx1NUI5QVx1NjVGNlx1OTUwMVx1NjczQVx1RkYwOFx1NjU3MFx1NjM2RVx1NkEyMVx1NTc4QiArIFx1N0VBRlx1OEMwM1x1NUVBNlx1OTAzQlx1OEY5MVx1RkYxQlx1Njg0Q1x1OTc2Mlx1NjI2N1x1ODg0Q1x1NzU1OVx1NTM5Rlx1NzUxRiBndWFyZFx1RkYwOSAtLS0tLS0tLS0tXG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9ja1NjaGVkdWxlIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBzdGFydDogc3RyaW5nO1xuICBlbmQ6IHN0cmluZztcbiAgZGF5czogbnVtYmVyW107XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIHN0cmljdDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBY3RpdmVMb2NrIHtcbiAgbmFtZTogc3RyaW5nO1xuICBzdGFydGVkQXQ6IG51bWJlcjtcbiAgZW5kc0F0OiBudW1iZXI7XG4gIHN0cmljdDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMb2NrU3RhdGUge1xuICBzY2hlZHVsZXM6IExvY2tTY2hlZHVsZVtdO1xuICBhY3RpdmU6IEFjdGl2ZUxvY2sgfCBudWxsO1xuICBzdXBwcmVzc2VkVW50aWw6IG51bWJlcjtcbn1cblxuLy8gLS0tLS0tLS0tLSBcdThCRkVcdTg4NjhcdTk2M0JcdTU4NUVcdTY1RjZcdTZCQjUgLS0tLS0tLS0tLVxuXG5leHBvcnQgdHlwZSBBdHRlbnRpb24gPSBcInJlcXVpcmVkXCIgfCBcImxpZ2h0XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmxvY2sge1xuICBpZDogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICAvKiogMSA9IFx1NTQ2OFx1NEUwMCBcdTIwMjYgNyA9IFx1NTQ2OFx1NjVFNVx1MzAwMiAqL1xuICBkYXlzOiBudW1iZXJbXTtcbiAgLyoqIFx1NjcyQ1x1NjczQSBISDpNTVx1RkYxQmVuZCBcdTRFMERcdTY2NUFcdTRFOEUgc3RhcnQgXHU4ODY4XHU3OTNBXHU4REU4XHU1MzQ4XHU1OTFDXHUzMDAyICovXG4gIHN0YXJ0OiBzdHJpbmc7XG4gIGVuZDogc3RyaW5nO1xuICBhdHRlbnRpb246IEF0dGVudGlvbjtcbiAgbm90ZXM6IHN0cmluZztcbn1cblxuLy8gLS0tLS0tLS0tLSBcdTZBMjFcdTY3N0ZcdTRFMEVcdTUzNzBcdTUyMzcgLS0tLS0tLS0tLVxuXG5leHBvcnQgaW50ZXJmYWNlIFRlbXBsYXRlU3VidGFzayB7XG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2hhcGUge1xuICB0aXRsZTogc3RyaW5nO1xuICBub3Rlczogc3RyaW5nO1xuICBwcm9qZWN0SWQ6IHN0cmluZyB8IG51bGw7XG4gIGhhYml0SWQ6IHN0cmluZyB8IG51bGw7XG4gIGZvY3VzTWludXRlczogbnVtYmVyIHwgbnVsbDtcbiAgc2NyYXBNaW51dGVzOiBudW1iZXI7XG4gIHByaW9yaXR5OiBudW1iZXI7XG4gIGVzdGltYXRlOiBudW1iZXI7XG4gIHRhZ3M6IHN0cmluZ1tdO1xuICBzdWJ0YXNrczogVGVtcGxhdGVTdWJ0YXNrW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJpbnRTbG90IHtcbiAgZGF5czogbnVtYmVyW107XG4gIHRpbWU6IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2FsZW5kYXJTbG90IHtcbiAgZGF0ZXM6IHN0cmluZ1tdO1xuICB0aW1lOiBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgdHlwZSBQcmludGluZyA9XG4gIHwgeyBraW5kOiBcIm9uY2VcIjsgZGF0ZTogc3RyaW5nIHwgbnVsbDsgdGltZTogc3RyaW5nIHwgbnVsbCB9XG4gIHwgeyBraW5kOiBcImNhbGVuZGFyXCI7IHNsb3RzOiBDYWxlbmRhclNsb3RbXSB9XG4gIHwgeyBraW5kOiBcIndlZWtseVwiOyBzbG90czogUHJpbnRTbG90W10gfTtcblxuZXhwb3J0IGludGVyZmFjZSBUZW1wbGF0ZSB7XG4gIGlkOiBzdHJpbmc7XG4gIHNoYXBlOiBTaGFwZTtcbiAgcHJpbnRpbmc6IFByaW50aW5nO1xuICBhdXRvbWF0aWM6IGJvb2xlYW47XG4gIHByaW50QWhlYWREYXlzOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJpbnRSZWNvcmQge1xuICB0ZW1wbGF0ZUlkOiBzdHJpbmc7XG4gIGRhdGU6IHN0cmluZyB8IG51bGw7XG59XG5cbi8vIC0tLS0tLS0tLS0gXHU2QzM4XHU0RTQ1IElEIFx1NzY3Qlx1OEJCMCAtLS0tLS0tLS0tXG5cbmV4cG9ydCBpbnRlcmZhY2UgSWRlbnRpdHkge1xuICBpZDogc3RyaW5nO1xuICBraW5kOiBzdHJpbmc7XG4gIHJldGlyZWQ6IGJvb2xlYW47XG4gIC8qKiBcdTUzOUZcdTRFRkJcdTUyQTFcdTYwNjJcdTU5MERcdThCQjBcdTVGNTVcdUZGMUFjYW5vbmljYWwgXHU1RThGXHU1MjE3XHU1MzE2XHU1NDBFXHU3Njg0IFRhc2sgSlNPTiBcdTVCNTdcdTdCMjZcdTRFMzJcdTMwMDIgKi9cbiAgcmVzdG9yZVRhc2s6IHN0cmluZyB8IG51bGw7XG59XG5cbi8vIC0tLS0tLS0tLS0gXHU4QkExXHU1MjEyXHU2NTg3XHU0RUY2IHY2IC0tLS0tLS0tLS1cblxuZXhwb3J0IGludGVyZmFjZSBQbGFuUHJvamVjdCB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgY29sb3I6IHN0cmluZztcbiAgLyoqIFx1NUU4Rlx1NTIxN1x1NTMxNlx1NjVGNiBudWxsIFx1NzcwMVx1NzU2NVx1RkYxQlx1NjNEMFx1NEY5Qlx1NjVGNlx1NUJGQ1x1NTE2NVx1NEYxQVx1ODk4Nlx1NzZENlx1NjcyQ1x1NjczQVx1NkUwNVx1NTM1NVx1MzAwMiAqL1xuICBhcHBXaGl0ZWxpc3Q6IHN0cmluZ1tdIHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQbGFuU3VidGFzayB7XG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGxhblRhc2sge1xuICBpZDogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICB0ZW1wbGF0ZUlkOiBzdHJpbmcgfCBudWxsO1xuICBoYWJpdElkOiBzdHJpbmcgfCBudWxsO1xuICByZWN1cnJpbmc6IGJvb2xlYW47XG4gIHNjcmFwTWludXRlczogbnVtYmVyO1xuICBub3Rlczogc3RyaW5nO1xuICBwcm9qZWN0SWQ6IHN0cmluZyB8IG51bGw7XG4gIGR1ZURhdGU6IHN0cmluZyB8IG51bGw7XG4gIC8qKiBcdTVFOEZcdTUyMTdcdTUzMTZcdTY1RjYgbnVsbCBcdTc3MDFcdTc1NjVcdTMwMDIgKi9cbiAgcmVtaW5kZXJUaW1lOiBzdHJpbmcgfCBudWxsO1xuICAvKiogXHU1RThGXHU1MjE3XHU1MzE2XHU2NUY2IG51bGwgXHU3NzAxXHU3NTY1XHUzMDAyICovXG4gIGZvY3VzTWludXRlczogbnVtYmVyIHwgbnVsbDtcbiAgcHJpb3JpdHk6IG51bWJlcjtcbiAgZXN0aW1hdGU6IG51bWJlcjtcbiAgdGFnczogc3RyaW5nW107XG4gIHN1YnRhc2tzOiBQbGFuU3VidGFza1tdO1xuICByZXBlYXQ6IFJlcGVhdDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQbGFuRmlsZSB7XG4gIGZvcm1hdDogc3RyaW5nO1xuICB2ZXJzaW9uOiBudW1iZXI7XG4gIHBvbW9kb3JvTWludXRlczogbnVtYmVyO1xuICBwcm9qZWN0czogUGxhblByb2plY3RbXTtcbiAgdGFza3M6IFBsYW5UYXNrW107XG4gIGJsb2NrczogQmxvY2tbXTtcbiAgdGVtcGxhdGVzOiBUZW1wbGF0ZVtdO1xuICBwcmludHM6IFByaW50UmVjb3JkW107XG4gIGhhYml0czogSGFiaXRbXTtcbiAgLyoqIFx1NUU4Rlx1NTIxN1x1NTMxNlx1NjVGNiBmYWxzZSBcdTc3MDFcdTc1NjVcdTMwMDIgKi9cbiAgcmVwbGFjZTogYm9vbGVhbjtcbn1cblxuLy8gLS0tLS0tLS0tLSBcdTY1NTlcdTVCNjYgLS0tLS0tLS0tLVxuXG5leHBvcnQgdHlwZSBSZXNvdXJjZUtpbmQgPVxuICB8IFwic3lsbGFidXNcIlxuICB8IFwiY291cnNlXCJcbiAgfCBcImJvb2tcIlxuICB8IFwicGFzdFBhcGVyXCJcbiAgfCBcIm1vY2tQYXBlclwiXG4gIHwgXCJyZWZlcmVuY2VcIlxuICB8IFwiYXR0YWNobWVudFwiXG4gIHwgXCJhbnN3ZXJTaGVldFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFByb2plY3RTdHVkeSB7XG4gIHByb2plY3RJZDogc3RyaW5nO1xuICBkaXJlY3Rvcnk6IHN0cmluZztcbiAgZXhhbU1vZGU6IGJvb2xlYW47XG4gIHZpc2lvbklkOiBzdHJpbmcgfCBudWxsO1xuICB0YXJnZXQ6IHN0cmluZztcbiAgZXhhbURhdGU6IHN0cmluZyB8IG51bGw7XG4gIHN5bGxhYnVzSWQ6IHN0cmluZyB8IG51bGw7XG4gIHBhc3RQYXBlcklkczogc3RyaW5nW107XG4gIG1vY2tQYXBlcklkczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzb3VyY2Uge1xuICBpZDogc3RyaW5nO1xuICBwcm9qZWN0SWQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAga2luZDogUmVzb3VyY2VLaW5kO1xuICAvKiogXHU3NkY4XHU1QkY5XHU5ODc5XHU3NkVFXHU2Mzg4XHU2NzQzXHU3NkVFXHU1RjU1XHVGRjFCXHU2QzM4XHU0RTBEXHU2Mzg4XHU0RTg4XHU2NTg3XHU0RUY2XHU3Q0ZCXHU3RURGXHU4QkJGXHU5NUVFXHUzMDAyICovXG4gIHBhdGg6IHN0cmluZztcbiAgc291cmNlOiBzdHJpbmc7XG4gIGVkaXRpb246IHN0cmluZztcbiAgdG9waWNzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaWxlc3RvbmUge1xuICB3ZWVrOiBudW1iZXI7XG4gIHRvcGljczogc3RyaW5nW107XG4gIHJlc291cmNlSWRzOiBzdHJpbmdbXTtcbiAgb2JqZWN0aXZlOiBzdHJpbmc7XG4gIGxlc3NvbkNvdW50OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VtZXN0ZXIge1xuICBpZDogc3RyaW5nO1xuICBwcm9qZWN0SWQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgc3RhcnREYXRlOiBzdHJpbmc7XG4gIGVuZERhdGU6IHN0cmluZztcbiAgcmV2aXNpb246IG51bWJlcjtcbiAgYmFzZWxpbmU6IHN0cmluZztcbiAgZXZpZGVuY2U6IHN0cmluZ1tdO1xuICByYXRpb25hbGU6IHN0cmluZztcbiAgbWlsZXN0b25lczogTWlsZXN0b25lW107XG59XG5cbmV4cG9ydCB0eXBlIExlc3NvblN0YXRlID0gXCJwbGFubmVkXCIgfCBcImFjdGl2ZVwiIHwgXCJlbmRlZFwiIHwgXCJtaXNzZWRcIjtcblxuZXhwb3J0IGludGVyZmFjZSBMZXNzb24ge1xuICBpZDogc3RyaW5nO1xuICBwcm9qZWN0SWQ6IHN0cmluZztcbiAgc2VtZXN0ZXJJZDogc3RyaW5nO1xuICBzZW1lc3RlclJldmlzaW9uOiBudW1iZXI7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHRvcGljczogc3RyaW5nW107XG4gIHJlc291cmNlSWRzOiBzdHJpbmdbXTtcbiAgc3RhcnRzQXQ6IG51bWJlcjtcbiAgZW5kc0F0OiBudW1iZXI7XG4gIGFpRW5hYmxlZDogYm9vbGVhbjtcbiAgYXR0ZW5kZWQ6IGJvb2xlYW47XG4gIHByb2dyZXNzOiBzdHJpbmc7XG4gIHN0YXRlOiBMZXNzb25TdGF0ZTtcbn1cblxuZXhwb3J0IHR5cGUgQXNzZXNzbWVudEtpbmQgPSBcImhvbWV3b3JrXCIgfCBcIndlZWtseUV4YW1cIiB8IFwibW9ja0V4YW1cIiB8IFwicmV0ZXN0XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2NvcmluZ1BvaW50IHtcbiAgaWQ6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgcG9pbnRzOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUXVlc3Rpb24ge1xuICBpZDogc3RyaW5nO1xuICBwcm9tcHQ6IHN0cmluZztcbiAgdG9waWNzOiBzdHJpbmdbXTtcbiAgc291cmNlSWRzOiBzdHJpbmdbXTtcbiAgZXh0ZW5zaW9uOiBib29sZWFuO1xuICBlc3RpbWF0ZWRNaW51dGVzOiBudW1iZXI7XG4gIGFuc3dlcjogc3RyaW5nO1xuICBhY2NlcHRhYmxlQWx0ZXJuYXRpdmVzOiBzdHJpbmc7XG4gIHNjb3Jpbmc6IFNjb3JpbmdQb2ludFtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFzc2Vzc21lbnQge1xuICBpZDogc3RyaW5nO1xuICBwcm9qZWN0SWQ6IHN0cmluZztcbiAgc2VtZXN0ZXJJZDogc3RyaW5nO1xuICBzZW1lc3RlclJldmlzaW9uOiBudW1iZXI7XG4gIGxlc3NvbklkOiBzdHJpbmcgfCBudWxsO1xuICB0YXNrSWQ6IHN0cmluZyB8IG51bGw7XG4gIHJldGVzdE9mR3JhZGVJZDogc3RyaW5nIHwgbnVsbDtcbiAgdGl0bGU6IHN0cmluZztcbiAga2luZDogQXNzZXNzbWVudEtpbmQ7XG4gIHJldmlzaW9uOiBudW1iZXI7XG4gIHN0YXJ0c0F0OiBudW1iZXI7XG4gIGVuZHNBdDogbnVtYmVyO1xuICBpbnN0cnVjdGlvbnM6IHN0cmluZztcbiAgcmV2aWV3RXZpZGVuY2U6IHN0cmluZztcbiAgcXVlc3Rpb25zOiBRdWVzdGlvbltdO1xuICBwdWJsaXNoZWRBdDogbnVtYmVyO1xuICBwcmludGVkQXQ6IG51bWJlciB8IG51bGw7XG4gIHN0YXJ0ZWRBdDogbnVtYmVyIHwgbnVsbDtcbiAgc3RvcHBlZEF0OiBudW1iZXIgfCBudWxsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN1Ym1pc3Npb24ge1xuICBpZDogc3RyaW5nO1xuICBhc3Nlc3NtZW50SWQ6IHN0cmluZztcbiAgc3VibWl0dGVkQXQ6IG51bWJlcjtcbiAgcmVzb3VyY2VJZHM6IHN0cmluZ1tdO1xuICBhbnN3ZXJzOiBzdHJpbmc7XG4gIHVuZmluaXNoZWQ6IGJvb2xlYW47XG4gIC8qKiBcdTY3MkNcdTY3M0FcdTVCOENcdTYyMTBcdTY1RjZcdTUyM0JcdUZGMENcdTRFMERcdTY2MkZcdTY1RjZcdTk1N0ZcdTMwMDIgKi9cbiAgcXVlc3Rpb25UaW1lczogUXVlc3Rpb25UaW1lW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUXVlc3Rpb25UaW1lIHtcbiAgcXVlc3Rpb25JZDogc3RyaW5nO1xuICBsb2NhbFRpbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQb2ludEF3YXJkIHtcbiAgcXVlc3Rpb25JZDogc3RyaW5nO1xuICBwb2ludElkOiBzdHJpbmc7XG4gIGF3YXJkZWQ6IG51bWJlcjtcbiAgZXZpZGVuY2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFcnJvckFuYWx5c2lzIHtcbiAgcXVlc3Rpb25JZDogc3RyaW5nO1xuICBjYXVzZTogc3RyaW5nO1xuICBldmlkZW5jZTogc3RyaW5nO1xuICBjb3JyZWN0aW9uOiBzdHJpbmc7XG4gIG5leHRDaGVjazogc3RyaW5nO1xuICByZXRlc3REYXRlOiBzdHJpbmc7XG4gIGNvbmZpcm1lZDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHcmFkZSB7XG4gIGlkOiBzdHJpbmc7XG4gIHN1Ym1pc3Npb25JZDogc3RyaW5nO1xuICBhc3Nlc3NtZW50UmV2aXNpb246IG51bWJlcjtcbiAgZ3JhZGVkQXQ6IG51bWJlcjtcbiAgYXdhcmRzOiBQb2ludEF3YXJkW107XG4gIGVycm9yczogRXJyb3JBbmFseXNpc1tdO1xuICBuZWVkc1JldmlldzogYm9vbGVhbjtcbiAgZmVlZGJhY2s6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZXZpZXcge1xuICBpZDogc3RyaW5nO1xuICBkYXRlOiBzdHJpbmc7XG4gIHByb2plY3RJZDogc3RyaW5nO1xuICBncmFkZUlkczogc3RyaW5nW107XG4gIGZpbmRpbmdzOiBzdHJpbmc7XG4gIGFjdGlvbnM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRlYWNoaW5nRXZlbnQge1xuICBpZDogc3RyaW5nO1xuICBwcm9qZWN0SWQ6IHN0cmluZztcbiAga2luZDogc3RyaW5nO1xuICBzb3VyY2VJZDogc3RyaW5nO1xuICBzdGF0ZTogc3RyaW5nO1xuICBjcmVhdGVkQXQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IHR5cGUgVGVhY2hpbmdUYXNrS2luZCA9IFwibGVzc29uXCIgfCBcImhvbWV3b3JrXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVhY2hpbmdUYXNrIHtcbiAgdGFza0lkOiBzdHJpbmc7XG4gIHNvdXJjZUlkOiBzdHJpbmc7XG4gIGtpbmQ6IFRlYWNoaW5nVGFza0tpbmQ7XG59XG5cbi8vIC0tLS0tLS0tLS0gXHU1QjY2XHU2MEM1XHU4QkMxXHU2MzZFIC0tLS0tLS0tLS1cblxuZXhwb3J0IGludGVyZmFjZSBDb21wbGV0ZWRTdHVkeVRhc2sge1xuICBpZDogc3RyaW5nO1xuICBwcm9qZWN0SWQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgbm90ZXM6IHN0cmluZztcbiAgdG9waWNzOiBzdHJpbmdbXTtcbiAgY29tcGxldGVkQXQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IHR5cGUgUHJvZ3Jlc3NTb3VyY2UgPSBcInVzZXJcIiB8IFwiYXNzaXN0YW50XCI7XG5leHBvcnQgdHlwZSBQcm9ncmVzc1N0YXRlID0gXCJzdHVkaWVkXCIgfCBcInByYWN0aWNpbmdcIiB8IFwibmVlZHNSZXZpZXdcIjtcblxuZXhwb3J0IGludGVyZmFjZSBQcm9ncmVzc1JlY29yZCB7XG4gIGlkOiBzdHJpbmc7XG4gIHByb2plY3RJZDogc3RyaW5nO1xuICB0b3BpYzogc3RyaW5nO1xuICBwb3NpdGlvbjogc3RyaW5nO1xuICBzdGF0ZTogUHJvZ3Jlc3NTdGF0ZTtcbiAgZXZpZGVuY2U6IHN0cmluZztcbiAgbmV4dEFjdGlvbjogc3RyaW5nO1xuICBzb3VyY2U6IFByb2dyZXNzU291cmNlO1xuICBjb25maXJtZWQ6IGJvb2xlYW47XG4gIHJlY29yZGVkQXQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb3JyZWN0aW9uIHtcbiAgaWQ6IHN0cmluZztcbiAgZ3JhZGVJZDogc3RyaW5nO1xuICBxdWVzdGlvbklkOiBzdHJpbmc7XG4gIGV4cGxhbmF0aW9uOiBzdHJpbmc7XG4gIHJlc291cmNlSWRzOiBzdHJpbmdbXTtcbiAgc3VibWl0dGVkQXQ6IG51bWJlcjtcbiAgYWNjZXB0ZWQ6IGJvb2xlYW4gfCBudWxsO1xuICBmZWVkYmFjazogc3RyaW5nO1xuICByZXZpZXdlZEF0OiBudW1iZXIgfCBudWxsO1xufVxuXG4vLyAtLS0tLS0tLS0tIFx1NUI4OFx1NjJBNFx1N0VBRlx1OEJBMVx1N0I5N1x1OTBFOFx1NTIwNlx1RkYwOFx1N0E5N1x1NTNFM1x1OTZDNlx1NTQwOC9cdTc2N0RcdTU0MERcdTUzNTVcdTUyMjRcdTVCOUFcdUZGMUJcdTY1RTBcdTY4NENcdTk3NjJcdThDMDNcdTc1MjhcdUZGMDkgLS0tLS0tLS0tLVxuXG5leHBvcnQgaW50ZXJmYWNlIFdpbmRvdyB7XG4gIGlkOiBudW1iZXI7XG4gIGFwcElkOiBzdHJpbmcgfCBudWxsO1xuICB0aXRsZTogc3RyaW5nIHwgbnVsbDtcbiAgcGlkOiBudW1iZXIgfCBudWxsO1xuICBpc0ZvY3VzZWQ6IGJvb2xlYW47XG59XG5cbi8vIC0tLS0tLS0tLS0gXHU1RkVCXHU3MTY3IC0tLS0tLS0tLS1cblxuZXhwb3J0IGludGVyZmFjZSBTbmFwc2hvdCB7XG4gIHRhc2tLaW5kczogUmVjb3JkPHN0cmluZywgVGFza0tpbmQ+O1xuICBkYXRhOiBpbXBvcnQoXCIuL2xpYlwiKS5BcHBEYXRhO1xuICBzdHVkeVByb2dyZXNzOiB1bmtub3duW107XG4gIHN0YXRzOiBTdGF0cztcbiAgcmVtYWluaW5nU2VjczogbnVtYmVyO1xuICB0b2RheTogc3RyaW5nO1xuICBzZXJ2ZXJUaW1lOiBudW1iZXI7XG59XG4iLCAiLy8hIEpTT04gXHU0RTI1XHU2ODNDXHU4OUUzXHU3ODAxXHU1MkE5XHU2MjRCXHVGRjFBXHU2QTIxXHU2MkRGIHNlcmRlIFx1NzY4NCBgZGVueV91bmtub3duX2ZpZWxkc2BcdTMwMDFgI1tzZXJkZShkZWZhdWx0KV1gXG4vLyEgXHU0RTBFIGNhbWVsQ2FzZSBcdTU0N0RcdTU0MERcdTMwMDJcdTVFOEZcdTUyMTdcdTUzMTZcdTc1MzFcdTU0MDRcdTZBMjFcdTU3NTdcdTYyNEJcdTUxOTlcdUZGMDhcdTk1MkVcdTVFOEZcdTU2RkFcdTVCOUFcdTMwMDFcdTRFMEUgUnVzdCBcdTU4RjBcdTY2MEVcdTVFOEZcdTRFMDBcdTgxRjRcdUZGMDlcdUZGMENcbi8vISBcdTRGRERcdThCQzFcdTVCRkNcdTUxRkEgSlNPTiBcdTVGNjJcdTcyQjZcdTRFMEVcdTY1RTdcdTVGMTVcdTY0Q0VcdTkwMTBcdTVCNTdcdTgyODJcdTUzRUZcdTZCRDRcdTMwMDJcblxuaW1wb3J0IHsgQXBwRXJyb3IgfSBmcm9tIFwiLi9lcnJvcnNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cblxuLyoqIGRlbnlfdW5rbm93bl9maWVsZHNcdUZGMUFcdTY3MkFcdTc3RTVcdTk1MkVcdTc2RjRcdTYzQTVcdTYyRDJcdTdFRERcdUZGMDhSdXN0IFx1NEYxQVx1NjJBNSB1bmtub3duIGZpZWxkXHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gcmVqZWN0VW5rbm93bihcbiAgb2JqOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgYWxsb3dlZDogc3RyaW5nW10sXG4gIHdoYXQ6IHN0cmluZyxcbik6IHZvaWQge1xuICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhvYmopKSB7XG4gICAgaWYgKCFhbGxvd2VkLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgIHRocm93IG5ldyBBcHBFcnJvcihgXHU2NzJBXHU3N0U1XHU1QjU3XHU2QkI1XHVGRjFBJHt3aGF0fSBcdTRFMERcdTYzQTVcdTUzRDcgXCIke2tleX1cImApO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNTdHIodmFsdWU6IHVua25vd24sIHdoYXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHRocm93IG5ldyBBcHBFcnJvcihgJHt3aGF0fVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUI1N1x1N0IyNlx1NEUzMmApO1xuICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc0Jvb2wodmFsdWU6IHVua25vd24sIHdoYXQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcImJvb2xlYW5cIikgdGhyb3cgbmV3IEFwcEVycm9yKGAke3doYXR9XHU1RkM1XHU5ODdCXHU2NjJGXHU1RTAzXHU1QzE0XHU1MDNDYCk7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzSW50KHZhbHVlOiB1bmtub3duLCB3aGF0OiBzdHJpbmcpOiBudW1iZXIge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcIm51bWJlclwiIHx8ICFOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSkge1xuICAgIHRocm93IG5ldyBBcHBFcnJvcihgJHt3aGF0fVx1NUZDNVx1OTg3Qlx1NjYyRlx1NjU3NFx1NjU3MGApO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzQXJyYXkodmFsdWU6IHVua25vd24sIHdoYXQ6IHN0cmluZyk6IHVua25vd25bXSB7XG4gIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHRocm93IG5ldyBBcHBFcnJvcihgJHt3aGF0fVx1NUZDNVx1OTg3Qlx1NjYyRlx1NjU3MFx1N0VDNGApO1xuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKiBwYXJzZSBcdTdFREZcdTRFMDBcdTVFMjYgd2hhdFx1RkYwOFx1NEY5QiBhc1N0ci9hc0ludCBcdTdCNDlcdTc2RjRcdTYzQTVcdTRGMjBcdTUxNjVcdUZGMDlcdUZGMENcdTUzNTVcdTUzQzJcdTY1NzAgbGFtYmRhIFx1NTQwQ1x1NjgzN1x1NTE3Q1x1NUJCOVx1MzAwMiAqL1xuZXhwb3J0IHR5cGUgUGFyc2VyPFQ+ID0gKHY6IHVua25vd24sIHdoYXQ6IHN0cmluZykgPT4gVDtcblxuZXhwb3J0IGZ1bmN0aW9uIGFzT3B0PFQ+KFxuICB2YWx1ZTogdW5rbm93bixcbiAgd2hhdDogc3RyaW5nLFxuICBwYXJzZTogUGFyc2VyPFQ+LFxuKTogVCB8IG51bGwge1xuICBpZiAodmFsdWUgPT09IG51bGwpIHJldHVybiBudWxsO1xuICByZXR1cm4gcGFyc2UodmFsdWUsIHdoYXQpO1xufVxuXG4vKiogXHU4QkZCXHU1M0Q2XHU1QjU3XHU2QkI1XHVGRjFBXHU3RjNBXHU3NzAxXHU2NUY2XHU1RTk0XHU3NTI4IGRlZmF1bHRcdUZGMUJcdTVCNThcdTU3MjhcdUZGMDhcdTU0MkIgbnVsbFx1RkYwOVx1NjVGNlx1NjMwOSBwYXJzZSBcdTg5RTNcdTY3OTBcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBmaWVsZDxUPihcbiAgb2JqOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAga2V5OiBzdHJpbmcsXG4gIHdoYXQ6IHN0cmluZyxcbiAgcGFyc2U6IFBhcnNlcjxUPixcbiAgZGVmOiBULFxuKTogVCB7XG4gIGNvbnN0IHZhbHVlID0gb2JqW2tleV07XG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZGVmO1xuICByZXR1cm4gcGFyc2UodmFsdWUsIHdoYXQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVxdWlyZWRGaWVsZDxUPihcbiAgb2JqOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAga2V5OiBzdHJpbmcsXG4gIHdoYXQ6IHN0cmluZyxcbiAgcGFyc2U6IFBhcnNlcjxUPixcbik6IFQge1xuICBjb25zdCB2YWx1ZSA9IG9ialtrZXldO1xuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEFwcEVycm9yKGAke3doYXR9XHU3RjNBXHU1QzExXHU1RkM1XHU1ODZCXHU1QjU3XHU2QkI1ICR7a2V5fWApO1xuICByZXR1cm4gcGFyc2UodmFsdWUsIHdoYXQpO1xufVxuXG4vKiogXHU2NzlBXHU0RTNFXHU1QjU3XHU3QjI2XHU0RTMyXHU4OUUzXHU2NzkwXHVGRjA4c2VyZGUgcmVuYW1lX2FsbCA9IFwiY2FtZWxDYXNlXCIgXHU3Njg0XHU1M0Q2XHU1MDNDXHVGRjA5XHVGRjFCXHU2Q0RCXHU1NzhCXHU0RkREXHU3NTU5XHU1QjU3XHU5NzYyXHU5MUNGXHU4MDU0XHU1NDA4XHU0RUU1XHU0RkJGXHU1MjA2XHU2NTJGXHU2NTM2XHU3QTg0XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gb25lT2Y8VCBleHRlbmRzIHN0cmluZz4oXG4gIHZhbHVlOiB1bmtub3duLFxuICB3aGF0OiBzdHJpbmcsXG4gIGFsbG93ZWQ6IHJlYWRvbmx5IFRbXSxcbik6IFQge1xuICBjb25zdCBzID0gYXNTdHIodmFsdWUsIHdoYXQpO1xuICBpZiAoIShhbGxvd2VkIGFzIHJlYWRvbmx5IHN0cmluZ1tdKS5pbmNsdWRlcyhzKSlcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoYCR7d2hhdH1cdTUzRDZcdTUwM0NcdTY1RTBcdTY1NDhcdUZGMUEke3N9YCk7XG4gIHJldHVybiBzIGFzIFQ7XG59XG5cbi8qKiBcdTVCNTdcdTdCMjZcdTRFMzJcdTY1NzBcdTdFQzRcdUZGMDhcdTYzMDlcdTUxNDNcdTdEMjBcdTg5RTNcdTY3OTBcdUZGMDlcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBhc1N0ckFycmF5KFxuICB2YWx1ZTogdW5rbm93bixcbiAgd2hhdDogc3RyaW5nLFxuICBwYXJzZTogUGFyc2VyPHN0cmluZz4sXG4pOiBzdHJpbmdbXSB7XG4gIHJldHVybiBhc0FycmF5KHZhbHVlLCB3aGF0KS5tYXAoKHYpID0+IHBhcnNlKHYsIHdoYXQpKTtcbn1cbiIsICIvLyEgXHU1QjlBXHU2NUY2XHU5NTAxXHU2NzNBXHVGRjFBXHU2NTcwXHU2MzZFXHU2QTIxXHU1NzhCXHUzMDAxXHU4REU4XHU1MzQ4XHU1OTFDXHU2NzJDXHU1NzMwXHU1NDY4XHU1Mzg2XHUzMDAxXHU5MUNEXHU1M0UwXHU2OEMwXHU2N0U1XHU0RTBFXHU2NzJDXHU4RjZFXHU2MjkxXHU1MjM2XHUzMDAyXG4vLyEgXHU1QkY5XHU1RTk0IGNyYXRlcy9jb3JlL3NyYy9sb2NrLnJzXHUzMDAyKipcdTdFQUZcdThCQTFcdTdCOTcqKlx1MjAxNFx1MjAxNFx1Njg0Q1x1OTc2Mlx1OTUwMVx1NUM0Rlx1NjI2N1x1ODg0Q1x1NzUzMVx1NTM5Rlx1NzUxRiBndWFyZCBcdThEMUZcdThEMjNcdUZGMENcbi8vISBydW50aW1lIFx1NzUyOFx1NjcyQ1x1NkEyMVx1NTc1N1x1N0I5N1x1NTFGQSBhY3RpdmUgXHU3MkI2XHU2MDAxXHU1NDBFXHU2MzA3XHU2MzI1IGd1YXJkXHUzMDAyXG5cbmltcG9ydCB7IEFwcEVycm9yLCBlbnN1cmUgfSBmcm9tIFwiLi9lcnJvcnNcIjtcbmltcG9ydCB7XG4gIGFzQXJyYXksXG4gIGFzQm9vbCxcbiAgYXNJbnQsXG4gIGFzT3B0LFxuICBhc1N0cixcbiAgZmllbGQsXG4gIGlzT2JqZWN0LFxuICBvbmVPZixcbiAgcmVqZWN0VW5rbm93bixcbiAgcmVxdWlyZWRGaWVsZCxcbn0gZnJvbSBcIi4vanNvblwiO1xuaW1wb3J0IHR5cGUgeyBBY3RpdmVMb2NrLCBMb2NrU2NoZWR1bGUsIExvY2tTdGF0ZSB9IGZyb20gXCIuL21vZGVsXCI7XG5pbXBvcnQge1xuICBhZGREYXlzLFxuICBhdExvY2FsRGF0ZSxcbiAgbG9jYWxEYXRlT2YsXG4gIG1pbnV0ZXNPZixcbiAgcGFyc2VEYXRlLFxuICB3ZWVrZGF5TW9uZGF5LFxufSBmcm9tIFwiLi90aW1lXCI7XG5cbmNvbnN0IFNDSEVEVUxFX0tFWVMgPSBbXG4gIFwiaWRcIixcbiAgXCJuYW1lXCIsXG4gIFwic3RhcnRcIixcbiAgXCJlbmRcIixcbiAgXCJkYXlzXCIsXG4gIFwiZW5hYmxlZFwiLFxuICBcInN0cmljdFwiLFxuXSBhcyBjb25zdDtcbmNvbnN0IEFDVElWRV9LRVlTID0gW1wibmFtZVwiLCBcInN0YXJ0ZWRBdFwiLCBcImVuZHNBdFwiLCBcInN0cmljdFwiXSBhcyBjb25zdDtcbmNvbnN0IFNUQVRFX0tFWVMgPSBbXCJzY2hlZHVsZXNcIiwgXCJhY3RpdmVcIiwgXCJzdXBwcmVzc2VkVW50aWxcIl0gYXMgY29uc3Q7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUxvY2tTY2hlZHVsZShyYXc6IHVua25vd24pOiBMb2NrU2NoZWR1bGUge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OTUwMVx1NjczQVx1ODlDNFx1NTIxOVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIFsuLi5TQ0hFRFVMRV9LRVlTXSwgXCJcdTk1MDFcdTY3M0FcdTg5QzRcdTUyMTlcIik7XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiXHU5NTAxXHU2NzNBXHU4OUM0XHU1MjE5XCIsIGFzU3RyKSxcbiAgICBuYW1lOiByZXF1aXJlZEZpZWxkKHJhdywgXCJuYW1lXCIsIFwiXHU5NTAxXHU2NzNBXHU4OUM0XHU1MjE5XCIsIGFzU3RyKSxcbiAgICBzdGFydDogcmVxdWlyZWRGaWVsZChyYXcsIFwic3RhcnRcIiwgXCJcdTk1MDFcdTY3M0FcdTg5QzRcdTUyMTlcIiwgYXNTdHIpLFxuICAgIGVuZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiZW5kXCIsIFwiXHU5NTAxXHU2NzNBXHU4OUM0XHU1MjE5XCIsIGFzU3RyKSxcbiAgICBkYXlzOiBhc0FycmF5KFxuICAgICAgcmVxdWlyZWRGaWVsZChyYXcsIFwiZGF5c1wiLCBcIlx1OTUwMVx1NjczQVx1ODlDNFx1NTIxOVwiLCAodikgPT4gdiksXG4gICAgICBcImRheXNcIixcbiAgICApLm1hcCgoZCkgPT4gYXNJbnQoZCwgXCJcdTk1MDFcdTY3M0FcdTY2MUZcdTY3MUZcIikpLFxuICAgIGVuYWJsZWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImVuYWJsZWRcIiwgXCJcdTk1MDFcdTY3M0FcdTg5QzRcdTUyMTlcIiwgYXNCb29sKSxcbiAgICBzdHJpY3Q6IGZpZWxkKHJhdywgXCJzdHJpY3RcIiwgXCJcdTk1MDFcdTY3M0FcdTg5QzRcdTUyMTlcIiwgYXNCb29sLCBmYWxzZSksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVMb2NrU2NoZWR1bGUoXG4gIHM6IExvY2tTY2hlZHVsZSxcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogcy5pZCxcbiAgICBuYW1lOiBzLm5hbWUsXG4gICAgc3RhcnQ6IHMuc3RhcnQsXG4gICAgZW5kOiBzLmVuZCxcbiAgICBkYXlzOiBzLmRheXMsXG4gICAgZW5hYmxlZDogcy5lbmFibGVkLFxuICAgIHN0cmljdDogcy5zdHJpY3QsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFjdGl2ZUxvY2socmF3OiB1bmtub3duKTogQWN0aXZlTG9jayB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU5NTAxXHU2NzNBXHU3MkI2XHU2MDAxXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKHJhdywgWy4uLkFDVElWRV9LRVlTXSwgXCJcdTk1MDFcdTY3M0FcdTcyQjZcdTYwMDFcIik7XG4gIHJldHVybiB7XG4gICAgbmFtZTogcmVxdWlyZWRGaWVsZChyYXcsIFwibmFtZVwiLCBcIlx1OTUwMVx1NjczQVx1NzJCNlx1NjAwMVwiLCBhc1N0ciksXG4gICAgc3RhcnRlZEF0OiByZXF1aXJlZEZpZWxkKHJhdywgXCJzdGFydGVkQXRcIiwgXCJcdTk1MDFcdTY3M0FcdTcyQjZcdTYwMDFcIiwgYXNJbnQpLFxuICAgIGVuZHNBdDogcmVxdWlyZWRGaWVsZChyYXcsIFwiZW5kc0F0XCIsIFwiXHU5NTAxXHU2NzNBXHU3MkI2XHU2MDAxXCIsIGFzSW50KSxcbiAgICBzdHJpY3Q6IHJlcXVpcmVkRmllbGQocmF3LCBcInN0cmljdFwiLCBcIlx1OTUwMVx1NjczQVx1NzJCNlx1NjAwMVwiLCBhc0Jvb2wpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplQWN0aXZlTG9jayhhOiBBY3RpdmVMb2NrKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6IGEubmFtZSxcbiAgICBzdGFydGVkQXQ6IGEuc3RhcnRlZEF0LFxuICAgIGVuZHNBdDogYS5lbmRzQXQsXG4gICAgc3RyaWN0OiBhLnN0cmljdCxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTG9ja1N0YXRlKHJhdzogdW5rbm93bik6IExvY2tTdGF0ZSB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU5NTAxXHU2NzNBXHU5MTREXHU3RjZFXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKHJhdywgWy4uLlNUQVRFX0tFWVNdLCBcIlx1OTUwMVx1NjczQVx1OTE0RFx1N0Y2RVwiKTtcbiAgcmV0dXJuIHtcbiAgICBzY2hlZHVsZXM6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJzY2hlZHVsZXNcIixcbiAgICAgIFwiXHU5NTAxXHU2NzNBXHU5MTREXHU3RjZFXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcInNjaGVkdWxlc1wiKS5tYXAocGFyc2VMb2NrU2NoZWR1bGUpLFxuICAgICAgW10sXG4gICAgKSxcbiAgICBhY3RpdmU6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJhY3RpdmVcIixcbiAgICAgIFwiXHU5NTAxXHU2NzNBXHU5MTREXHU3RjZFXCIsXG4gICAgICAodikgPT4gKHYgPT09IG51bGwgPyBudWxsIDogcGFyc2VBY3RpdmVMb2NrKHYpKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBBY3RpdmVMb2NrIHwgbnVsbCxcbiAgICBzdXBwcmVzc2VkVW50aWw6IGZpZWxkKHJhdywgXCJzdXBwcmVzc2VkVW50aWxcIiwgXCJcdTk1MDFcdTY3M0FcdTkxNERcdTdGNkVcIiwgYXNJbnQsIDApLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplTG9ja1N0YXRlKHM6IExvY2tTdGF0ZSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBzY2hlZHVsZXM6IHMuc2NoZWR1bGVzLm1hcChzZXJpYWxpemVMb2NrU2NoZWR1bGUpLFxuICAgIC8vIFx1NEUwRSBSdXN0IFx1NEUwMFx1ODFGNFx1RkYxQU9wdGlvbiBcdTc2RjRcdTYzQTVcdTVFOEZcdTUyMTdcdTUzMTZcdUZGMENOb25lIFx1NjYzRVx1NUYwRlx1NTE5OSBcImFjdGl2ZVwiOiBudWxsXHVGRjA4c2VyZGUgXHU0RTI0XHU3QUVGXHU2M0E1XHU1M0Q3XHVGRjA5XHUzMDAyXG4gICAgYWN0aXZlOiBzLmFjdGl2ZSA9PT0gbnVsbCA/IG51bGwgOiBzZXJpYWxpemVBY3RpdmVMb2NrKHMuYWN0aXZlKSxcbiAgICBzdXBwcmVzc2VkVW50aWw6IHMuc3VwcHJlc3NlZFVudGlsLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVMb2NrKHN0YXRlOiBMb2NrU3RhdGUpOiB2b2lkIHtcbiAgaWYgKHN0YXRlLnNjaGVkdWxlcy5sZW5ndGggPiAyMCkge1xuICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NjcwMFx1NTkxQVx1OEJCRVx1N0Y2RSAyMCBcdTRFMkFcdTk1MDFcdTY3M0FcdTY1RjZcdTZCQjVcIik7XG4gIH1cbiAgY29uc3QgaWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IG9jY3VwaWVkID0gbmV3IEFycmF5PGJvb2xlYW4+KDcgKiAxNDQwKS5maWxsKGZhbHNlKTtcbiAgZm9yIChjb25zdCBzIG9mIHN0YXRlLnNjaGVkdWxlcykge1xuICAgIGlmIChcbiAgICAgIHMuaWQubGVuZ3RoID09PSAwIHx8XG4gICAgICBpZHMuaGFzKHMuaWQpIHx8XG4gICAgICBzLm5hbWUudHJpbSgpLmxlbmd0aCA9PT0gMCB8fFxuICAgICAgQXJyYXkuZnJvbShzLm5hbWUpLmxlbmd0aCA+IDQwXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTk1MDFcdTY3M0FcdTU0MERcdTc5RjBcdTk3MDBcdTRFM0EgMVx1MjAxMzQwIFx1NUI1N1x1N0IyNlx1RkYwQ0lEIFx1OTcwMFx1NTUyRlx1NEUwMFx1NEUxNFx1OTc1RVx1N0E3QVwiKTtcbiAgICB9XG4gICAgaWRzLmFkZChzLmlkKTtcbiAgICBpZiAoXG4gICAgICBtaW51dGVzT2Yocy5zdGFydCkgPT09IG51bGwgfHxcbiAgICAgIG1pbnV0ZXNPZihzLmVuZCkgPT09IG51bGwgfHxcbiAgICAgIHMuc3RhcnQgPT09IHMuZW5kXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTk1MDFcdTY3M0FcdTY1RjZcdTk1RjRcdTk3MDBcdTRFM0FcdTY3MDlcdTY1NDggSEg6TU1cdUZGMENcdTVGMDBcdTU5Q0JcdTRFMEVcdTdFRDNcdTY3NUZcdTRFMERcdTgwRkRcdTc2RjhcdTU0MENcIik7XG4gICAgfVxuICAgIGNvbnN0IHVuaXF1ZSA9IG5ldyBTZXQocy5kYXlzKTtcbiAgICBpZiAoXG4gICAgICBzLmRheXMubGVuZ3RoID09PSAwIHx8XG4gICAgICBzLmRheXMubGVuZ3RoID4gNyB8fFxuICAgICAgdW5pcXVlLnNpemUgIT09IHMuZGF5cy5sZW5ndGggfHxcbiAgICAgIHMuZGF5cy5zb21lKChkKSA9PiBkIDwgMSB8fCBkID4gNylcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJGN1x1OTAwOVx1NjJFOVx1NEUwRFx1OTFDRFx1NTkwRFx1NzY4NFx1NjYxRlx1NjcxRlx1RkYwOFx1NTQ2OFx1NEUwMFx1NEUzQSAxXHVGRjBDXHU1NDY4XHU2NUU1XHU0RTNBIDdcdUZGMDlcIik7XG4gICAgfVxuICAgIGlmIChzLmVuYWJsZWQpIHtcbiAgICAgIGNvbnN0IHN0YXJ0ID0gbWludXRlc09mKHMuc3RhcnQpITtcbiAgICAgIGNvbnN0IGVuZCA9IG1pbnV0ZXNPZihzLmVuZCkhO1xuICAgICAgY29uc3QgZHVyYXRpb24gPSAoZW5kICsgMTQ0MCAtIHN0YXJ0KSAlIDE0NDA7XG4gICAgICBmb3IgKGNvbnN0IGRheSBvZiBzLmRheXMpIHtcbiAgICAgICAgZm9yIChsZXQgb2Zmc2V0ID0gMDsgb2Zmc2V0IDwgZHVyYXRpb247IG9mZnNldCArPSAxKSB7XG4gICAgICAgICAgY29uc3QgbWludXRlID0gKChkYXkgLSAxKSAqIDE0NDAgKyBzdGFydCArIG9mZnNldCkgJSAoNyAqIDE0NDApO1xuICAgICAgICAgIGlmIChvY2N1cGllZFttaW51dGVdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTU0MkZcdTc1MjhcdTc2ODRcdTk1MDFcdTY3M0FcdTY1RjZcdTZCQjVcdTRFMERcdTgwRkRcdTkxQ0RcdTUzRTBcdUZGMENcdThCRjdcdThDMDNcdTY1NzRcdTY1RTVcdTY3MUZcdTYyMTZcdTY1RjZcdTk1RjRcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIG9jY3VwaWVkW21pbnV0ZV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChzdGF0ZS5hY3RpdmUgIT09IG51bGwpIHtcbiAgICBjb25zdCBhID0gc3RhdGUuYWN0aXZlO1xuICAgIGlmIChcbiAgICAgIGEubmFtZS50cmltKCkubGVuZ3RoID09PSAwIHx8XG4gICAgICBBcnJheS5mcm9tKGEubmFtZSkubGVuZ3RoID4gNDAgfHxcbiAgICAgIGEuZW5kc0F0IDw9IGEuc3RhcnRlZEF0IHx8XG4gICAgICBhLmVuZHNBdCAtIGEuc3RhcnRlZEF0ID4gOCAqIDg2NDAwXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTY1RTBcdTY1NDhcdTc2ODRcdTk1MDFcdTY3M0FcdTcyQjZcdTYwMDFcIik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogXHU1RjUzXHU1MjREXHU2NUY2XHU1MjNCXHU1NDdEXHU0RTJEXHU3Njg0XHU1NDJGXHU3NTI4XHU4OUM0XHU1MjE5IFx1MjE5MiBcdTU0MDhcdTVFNzZcdTU0MEVcdTc2ODQgQWN0aXZlTG9ja1x1RkYxQlx1ODhBQlx1NjI5MVx1NTIzNlx1NjIxNlx1NjcyQVx1NTQ3RFx1NEUyRFx1OEZENFx1NTZERSBudWxsXHUzMDAyXG4gKiBcdTY2MUZcdTY3MUZcdTVGNTJcdTVDNUVcdTVGMDBcdTU5Q0JcdTY1RTVcdTY3MUZcdUZGMUFcdThERThcdTUzNDhcdTU5MUNcdTg5QzRcdTUyMTlcdTYzMDlcdTVGMDBcdTU5Q0JcdTY1RTVcdTUzQzJcdTRFMEVcdTUzMzlcdTkxNERcdTMwMDJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjaGVkdWxlZEF0KHN0YXRlOiBMb2NrU3RhdGUsIGF0OiBudW1iZXIpOiBBY3RpdmVMb2NrIHwgbnVsbCB7XG4gIGlmIChhdCA8IHN0YXRlLnN1cHByZXNzZWRVbnRpbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHRvZGF5ID0gbG9jYWxEYXRlT2YoYXQpO1xuICBsZXQgcmVzdWx0OiBBY3RpdmVMb2NrIHwgbnVsbCA9IG51bGw7XG4gIGZvciAoY29uc3QgZGF0ZSBvZiBbYWRkRGF5cyh0b2RheSwgLTEpLCB0b2RheV0pIHtcbiAgICBjb25zdCB3ZWVrZGF5ID0gd2Vla2RheU1vbmRheShkYXRlKTtcbiAgICBmb3IgKGNvbnN0IHMgb2Ygc3RhdGUuc2NoZWR1bGVzKSB7XG4gICAgICBpZiAoIXMuZW5hYmxlZCB8fCAhcy5kYXlzLmluY2x1ZGVzKHdlZWtkYXkpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IG1pbnV0ZXNPZihzLnN0YXJ0KTtcbiAgICAgIGNvbnN0IGVuZFRpbWUgPSBtaW51dGVzT2Yocy5lbmQpO1xuICAgICAgaWYgKHN0YXJ0VGltZSA9PT0gbnVsbCB8fCBlbmRUaW1lID09PSBudWxsKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGVuZERhdGUgPSBlbmRUaW1lIDw9IHN0YXJ0VGltZSA/IGFkZERheXMoZGF0ZSwgMSkgOiBkYXRlO1xuICAgICAgY29uc3Qgc3RhcnQgPSBhdExvY2FsRGF0ZShcbiAgICAgICAgZGF0ZSxcbiAgICAgICAgTWF0aC5mbG9vcihzdGFydFRpbWUgLyA2MCksXG4gICAgICAgIHN0YXJ0VGltZSAlIDYwLFxuICAgICAgKTtcbiAgICAgIGNvbnN0IGVuZCA9IGF0TG9jYWxEYXRlKGVuZERhdGUsIE1hdGguZmxvb3IoZW5kVGltZSAvIDYwKSwgZW5kVGltZSAlIDYwKTtcbiAgICAgIGlmIChhdCA+PSBzdGFydCAmJiBhdCA8IGVuZCkge1xuICAgICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgICAgcmVzdWx0LnN0YXJ0ZWRBdCA9IE1hdGgubWluKHJlc3VsdC5zdGFydGVkQXQsIHN0YXJ0KTtcbiAgICAgICAgICByZXN1bHQuZW5kc0F0ID0gTWF0aC5tYXgocmVzdWx0LmVuZHNBdCwgZW5kKTtcbiAgICAgICAgICByZXN1bHQuc3RyaWN0ID0gcmVzdWx0LnN0cmljdCB8fCBzLnN0cmljdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgICBuYW1lOiBzLm5hbWUsXG4gICAgICAgICAgICBzdGFydGVkQXQ6IHN0YXJ0LFxuICAgICAgICAgICAgZW5kc0F0OiBlbmQsXG4gICAgICAgICAgICBzdHJpY3Q6IHMuc3RyaWN0LFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqIFx1NjNEMFx1NTI0RFx1N0VEM1x1Njc1Rlx1NUMwRlx1NjFBOVx1NEUwRFx1NUY5N1x1NTQxRVx1NjM4OVx1NjVFMFx1NTE3M1x1NzY4NFx1NTQwRVx1N0VFRFx1Nzc2MVx1NzcyMFx1NjVGNlx1NkJCNVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbGVhc2VMb2NrKHN0YXRlOiBMb2NrU3RhdGUsIGF0OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3Qgc2NoZWR1bGVkID0gc2NoZWR1bGVkQXQoc3RhdGUsIGF0KTtcbiAgaWYgKHNjaGVkdWxlZCAhPT0gbnVsbCkge1xuICAgIHN0YXRlLnN1cHByZXNzZWRVbnRpbCA9IE1hdGgubWF4KHN0YXRlLnN1cHByZXNzZWRVbnRpbCwgc2NoZWR1bGVkLmVuZHNBdCk7XG4gIH1cbiAgc3RhdGUuYWN0aXZlID0gbnVsbDtcbn1cbiIsICIvLyEgXHU4QkZFXHU4ODY4XHU5NjNCXHU1ODVFXHU2NUY2XHU2QkI1XHVGRjFBXHU4QkExXHU1MjEyXHU0RTRCXHU1OTE2XHU3Njg0XHU2QkNGXHU1NDY4XHU1NkZBXHU1QjlBXHU1MzYwXHU3NTI4XHVGRjA4XHU4QkZFXHU3QTBCXHUzMDAxXHU1QjlFXHU5QThDXHVGRjA5XHUzMDAyXHU3RUFGXHU2M0NGXHU4RkYwXHVGRjFBXHU0RTBEXHU1RTI2XHU4RkRCXHU1RUE2XHUzMDAxXHU0RTBEXHU3QkExXHU4Rjk2XHU1QjlFXHU0RjhCXHUzMDAxXHU0RTBEXHU5NTAxXHU2NzNBXHUzMDAyXG4vLyEgXHU1QkY5XHU1RTk0IGNyYXRlcy9jb3JlL3NyYy9ibG9ja3MucnNcdTMwMDJcblxuaW1wb3J0IHsgQXBwRXJyb3IgfSBmcm9tIFwiLi9lcnJvcnNcIjtcbmltcG9ydCB7XG4gIGFzQXJyYXksXG4gIGFzSW50LFxuICBhc1N0cixcbiAgZmllbGQsXG4gIGlzT2JqZWN0LFxuICBvbmVPZixcbiAgcmVqZWN0VW5rbm93bixcbiAgcmVxdWlyZWRGaWVsZCxcbn0gZnJvbSBcIi4vanNvblwiO1xuaW1wb3J0IHR5cGUgeyBBdHRlbnRpb24sIEJsb2NrIH0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IG1pbnV0ZXNPZiwgcGFyc2VEYXRlLCB3ZWVrZGF5TW9uZGF5IH0gZnJvbSBcIi4vdGltZVwiO1xuXG5jb25zdCBCTE9DS19LRVlTID0gW1xuICBcImlkXCIsXG4gIFwidGl0bGVcIixcbiAgXCJkYXlzXCIsXG4gIFwic3RhcnRcIixcbiAgXCJlbmRcIixcbiAgXCJhdHRlbnRpb25cIixcbiAgXCJub3Rlc1wiLFxuXSBhcyBjb25zdDtcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQmxvY2socmF3OiB1bmtub3duKTogQmxvY2sge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OTYzQlx1NTg1RVx1NjVGNlx1NkJCNVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIFsuLi5CTE9DS19LRVlTXSwgXCJcdTk2M0JcdTU4NUVcdTY1RjZcdTZCQjVcIik7XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiXHU5NjNCXHU1ODVFXHU2NUY2XHU2QkI1XCIsIGFzU3RyKSxcbiAgICB0aXRsZTogcmVxdWlyZWRGaWVsZChyYXcsIFwidGl0bGVcIiwgXCJcdTk2M0JcdTU4NUVcdTY1RjZcdTZCQjVcIiwgYXNTdHIpLFxuICAgIGRheXM6IGFzQXJyYXkoXG4gICAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJkYXlzXCIsIFwiXHU5NjNCXHU1ODVFXHU2NUY2XHU2QkI1XCIsICh2KSA9PiB2KSxcbiAgICAgIFwiZGF5c1wiLFxuICAgICkubWFwKChkKSA9PiBhc0ludChkLCBcIlx1OTYzQlx1NTg1RVx1NjVGNlx1NkJCNVx1NjYxRlx1NjcxRlwiKSksXG4gICAgc3RhcnQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInN0YXJ0XCIsIFwiXHU5NjNCXHU1ODVFXHU2NUY2XHU2QkI1XCIsIGFzU3RyKSxcbiAgICBlbmQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImVuZFwiLCBcIlx1OTYzQlx1NTg1RVx1NjVGNlx1NkJCNVwiLCBhc1N0ciksXG4gICAgYXR0ZW50aW9uOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiYXR0ZW50aW9uXCIsXG4gICAgICBcIlx1OTYzQlx1NTg1RVx1NjVGNlx1NkJCNVwiLFxuICAgICAgKHYpID0+IG9uZU9mKHYsIFwiYXR0ZW50aW9uXCIsIFtcInJlcXVpcmVkXCIsIFwibGlnaHRcIl0pLFxuICAgICAgXCJyZXF1aXJlZFwiLFxuICAgICkgYXMgQXR0ZW50aW9uLFxuICAgIG5vdGVzOiBmaWVsZChyYXcsIFwibm90ZXNcIiwgXCJcdTk2M0JcdTU4NUVcdTY1RjZcdTZCQjVcIiwgYXNTdHIsIFwiXCIpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplQmxvY2soYjogQmxvY2spOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7XG4gICAgaWQ6IGIuaWQsXG4gICAgdGl0bGU6IGIudGl0bGUsXG4gICAgZGF5czogYi5kYXlzLFxuICAgIHN0YXJ0OiBiLnN0YXJ0LFxuICAgIGVuZDogYi5lbmQsXG4gICAgYXR0ZW50aW9uOiBiLmF0dGVudGlvbixcbiAgICBub3RlczogYi5ub3RlcyxcbiAgfTtcbn1cblxuLyoqIFx1OEJFNVx1NjVFNVx1NjcxRlx1NTM0OFx1NTkxQ1x1OEQ3N1x1N0I5N1x1NzY4NCBgW3N0YXJ0LCBlbmQpYCBcdTUyMDZcdTk0OUZcdTdBOTdcdTUzRTNcdUZGMUJcdThERThcdTUzNDhcdTU5MUNcdTY1RjYgZW5kIFx1OEQ4NVx1OEZDNyAxNDQwXHVGRjFCXHU4QkU1XHU2NjFGXHU2NzFGXHU2NUUwXHU2QjY0XHU1MzYwXHU3NTI4XHU4RkQ0XHU1NkRFIG51bGxcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBiYW5kKFxuICBibG9jazogQmxvY2ssXG4gIGRhdGU6IHN0cmluZyxcbik6IHsgc3RhcnQ6IG51bWJlcjsgZW5kOiBudW1iZXIgfSB8IG51bGwge1xuICBjb25zdCBwYXJzZWQgPSBwYXJzZURhdGUoZGF0ZSk7XG4gIGlmIChwYXJzZWQgPT09IG51bGwpIHJldHVybiBudWxsO1xuICBpZiAoIWJsb2NrLmRheXMuaW5jbHVkZXMod2Vla2RheU1vbmRheShwYXJzZWQpKSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHN0YXJ0ID0gbWludXRlc09mKGJsb2NrLnN0YXJ0KTtcbiAgY29uc3QgZW5kID0gbWludXRlc09mKGJsb2NrLmVuZCk7XG4gIGlmIChzdGFydCA9PT0gbnVsbCB8fCBlbmQgPT09IG51bGwpIHJldHVybiBudWxsO1xuICByZXR1cm4geyBzdGFydCwgZW5kOiBlbmQgPD0gc3RhcnQgPyBlbmQgKyAxNDQwIDogZW5kIH07XG59XG5cbi8qKiBcdTRFMEVcdTU0MENcdTY1RTUgYFtzdGFydCwgZW5kKWAgXHU3QTk3XHU1M0UzXHU5MUNEXHU1M0UwXHU3Njg0XHU1MjA2XHU5NDlGXHU2NTcwXHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gb3ZlcmxhcE1pbnV0ZXMoXG4gIGJsb2NrOiBCbG9jayxcbiAgZGF0ZTogc3RyaW5nLFxuICBzdGFydDogbnVtYmVyLFxuICBlbmQ6IG51bWJlcixcbik6IG51bWJlciB7XG4gIGNvbnN0IGIgPSBiYW5kKGJsb2NrLCBkYXRlKTtcbiAgaWYgKGIgPT09IG51bGwpIHJldHVybiAwO1xuICByZXR1cm4gTWF0aC5taW4oZW5kLCBiLmVuZCkgLSBNYXRoLm1heChzdGFydCwgYi5zdGFydCkgPiAwXG4gICAgPyBNYXRoLm1pbihlbmQsIGIuZW5kKSAtIE1hdGgubWF4KHN0YXJ0LCBiLnN0YXJ0KVxuICAgIDogMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlQmxvY2soYmxvY2s6IEJsb2NrKTogdm9pZCB7XG4gIGlmIChibG9jay5pZC5sZW5ndGggPT09IDApIHtcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTk2M0JcdTU4NUVcdTY1RjZcdTZCQjUgSUQgXHU0RTBEXHU4MEZEXHU0RTNBXHU3QTdBXCIpO1xuICB9XG4gIGlmIChibG9jay50aXRsZS50cmltKCkubGVuZ3RoID09PSAwIHx8IEFycmF5LmZyb20oYmxvY2sudGl0bGUpLmxlbmd0aCA+IDQwKSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU5NjNCXHU1ODVFXHU2NUY2XHU2QkI1XHU1NDBEXHU3OUYwXHU5NzAwXHU0RTNBIDFcdTIwMTM0MCBcdTRFMkFcdTVCNTdcdTdCMjZcIik7XG4gIH1cbiAgaWYgKG1pbnV0ZXNPZihibG9jay5zdGFydCkgPT09IG51bGwgfHwgbWludXRlc09mKGJsb2NrLmVuZCkgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTk2M0JcdTU4NUVcdTY1RjZcdTZCQjVcdTk3MDBcdTRFM0FcdTY3MDlcdTY1NDhcdTc2ODQgSEg6TU0gXHU2NUY2XHU5NUY0XCIpO1xuICB9XG4gIGlmIChibG9jay5zdGFydCA9PT0gYmxvY2suZW5kKSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU5NjNCXHU1ODVFXHU2NUY2XHU2QkI1XHU3Njg0XHU1RjAwXHU1OUNCXHU0RTBFXHU3RUQzXHU2NzVGXHU0RTBEXHU4MEZEXHU3NkY4XHU1NDBDXCIpO1xuICB9XG4gIGNvbnN0IHVuaXF1ZSA9IG5ldyBTZXQoYmxvY2suZGF5cyk7XG4gIGlmIChcbiAgICBibG9jay5kYXlzLmxlbmd0aCA9PT0gMCB8fFxuICAgIGJsb2NrLmRheXMubGVuZ3RoID4gNyB8fFxuICAgIHVuaXF1ZS5zaXplICE9PSBibG9jay5kYXlzLmxlbmd0aCB8fFxuICAgIGJsb2NrLmRheXMuc29tZSgoZCkgPT4gZCA8IDEgfHwgZCA+IDcpXG4gICkge1xuICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJGN1x1OTAwOVx1NjJFOVx1NEUwRFx1OTFDRFx1NTkwRFx1NzY4NFx1NjYxRlx1NjcxRlx1RkYwOFx1NTQ2OFx1NEUwMFx1NEUzQSAxXHVGRjBDXHU1NDY4XHU2NUU1XHU0RTNBIDdcdUZGMDlcIik7XG4gIH1cbiAgaWYgKEFycmF5LmZyb20oYmxvY2subm90ZXMpLmxlbmd0aCA+IDIwMDApIHtcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTk2M0JcdTU4NUVcdTY1RjZcdTZCQjVcdTU5MDdcdTZDRThcdThGQzdcdTk1N0ZcIik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlQmxvY2tzKGJsb2NrczogQmxvY2tbXSk6IHZvaWQge1xuICBpZiAoYmxvY2tzLmxlbmd0aCA+IDYwKSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4QkZFXHU4ODY4XHU5NjNCXHU1ODVFXHU2NUY2XHU2QkI1XHU2NzAwXHU1OTFBIDYwIFx1OTg3OVwiKTtcbiAgfVxuICBjb25zdCBpZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgZm9yIChjb25zdCBibG9jayBvZiBibG9ja3MpIHtcbiAgICB2YWxpZGF0ZUJsb2NrKGJsb2NrKTtcbiAgICBpZiAoaWRzLmhhcyhibG9jay5pZCkpIHtcbiAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OTYzQlx1NTg1RVx1NjVGNlx1NkJCNSBJRCBcdTkxQ0RcdTU5MERcIik7XG4gICAgfVxuICAgIGlkcy5hZGQoYmxvY2suaWQpO1xuICB9XG59XG5cbi8qKiBcdTg5ODZcdTc2RDYgYGRhdGVgIFx1NzY4NFx1NjVGNlx1NkJCNVx1RkYwQ1x1NjMwOVx1NUYwMFx1NTlDQlx1NjVGNlx1OTVGNFx1MzAwMVx1NTE4RFx1NjMwOVx1NjgwN1x1OTg5OFx1NjM5Mlx1NUU4Rlx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb2Nrc09uRGF0ZShibG9ja3M6IEJsb2NrW10sIGRhdGU6IHN0cmluZyk6IEJsb2NrW10ge1xuICBpZiAocGFyc2VEYXRlKGRhdGUpID09PSBudWxsKSByZXR1cm4gW107XG4gIHJldHVybiBibG9ja3NcbiAgICAuZmlsdGVyKChiKSA9PiBiYW5kKGIsIGRhdGUpICE9PSBudWxsKVxuICAgIC5zbGljZSgpXG4gICAgLnNvcnQoKGEsIGIpID0+XG4gICAgICBhLnN0YXJ0IDwgYi5zdGFydFxuICAgICAgICA/IC0xXG4gICAgICAgIDogYS5zdGFydCA+IGIuc3RhcnRcbiAgICAgICAgICA/IDFcbiAgICAgICAgICA6IGEudGl0bGUgPCBiLnRpdGxlXG4gICAgICAgICAgICA/IC0xXG4gICAgICAgICAgICA6IGEudGl0bGUgPiBiLnRpdGxlXG4gICAgICAgICAgICAgID8gMVxuICAgICAgICAgICAgICA6IDAsXG4gICAgKTtcbn1cblxuLyoqIGBkYXRlYCBcdTVGNTNcdTU5MjlcdTk3MDBcdTRFMTNcdTVGQzNcdTY1RjZcdTZCQjVcdTUzNjBcdTc1MjhcdTc2ODRcdTUyMDZcdTk0OUZcdTY1NzBcdUZGMDhcdTUzNjBcdTc1MjhcdThCQzFcdTYzNkVcdUZGMENcdTkxQ0RcdTUzRTBcdTRGMUFcdTkxQ0RcdTU5MERcdThCQTFcdTY1NzBcdUZGMDlcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiByZXF1aXJlZE1pbnV0ZXMoYmxvY2tzOiBCbG9ja1tdLCBkYXRlOiBzdHJpbmcpOiBudW1iZXIge1xuICBpZiAocGFyc2VEYXRlKGRhdGUpID09PSBudWxsKSByZXR1cm4gMDtcbiAgbGV0IHRvdGFsID0gMDtcbiAgZm9yIChjb25zdCBiIG9mIGJsb2Nrcykge1xuICAgIGlmIChiLmF0dGVudGlvbiAhPT0gXCJyZXF1aXJlZFwiKSBjb250aW51ZTtcbiAgICBjb25zdCBiYW5kVmFsdWUgPSBiYW5kKGIsIGRhdGUpO1xuICAgIGlmIChiYW5kVmFsdWUgIT09IG51bGwpIHRvdGFsICs9IGJhbmRWYWx1ZS5lbmQgLSBiYW5kVmFsdWUuc3RhcnQ7XG4gIH1cbiAgcmV0dXJuIHRvdGFsO1xufVxuIiwgIi8vISBcdTRFNjBcdTYwRUZcdTdFQzRcdUZGMUFcdTUzRUFcdTVFMjZcdTdCQTFcdThGOTZcdUZGMUJcdTVGNjJcdTcyQjZcdTRFMEVcdTUzNzBcdTUyMzdcdTg5QzRcdTUyMTlcdTc1MzEgdGVtcGxhdGVzIFx1N0JBMVx1NzQwNlx1MzAwMlxuLy8hIFx1NUJGOVx1NUU5NCBjcmF0ZXMvY29yZS9zcmMvaGFiaXRzLnJzXHUzMDAyXG5cbmltcG9ydCB7IEFwcEVycm9yLCBlbnN1cmUgfSBmcm9tIFwiLi9lcnJvcnNcIjtcbmltcG9ydCB7IGFzU3RyLCBpc09iamVjdCwgcmVqZWN0VW5rbm93biwgcmVxdWlyZWRGaWVsZCB9IGZyb20gXCIuL2pzb25cIjtcbmltcG9ydCB0eXBlIHsgSGFiaXQgfSBmcm9tIFwiLi9tb2RlbFwiO1xuXG5jb25zdCBIQUJJVF9LRVlTID0gW1wiaWRcIiwgXCJuYW1lXCJdIGFzIGNvbnN0O1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VIYWJpdChyYXc6IHVua25vd24pOiBIYWJpdCB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU0RTYwXHU2MEVGXHU3RUM0XHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKHJhdywgWy4uLkhBQklUX0tFWVNdLCBcIlx1NEU2MFx1NjBFRlx1N0VDNFwiKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTRFNjBcdTYwRUZcdTdFQzRcIiwgYXNTdHIpLFxuICAgIG5hbWU6IHJlcXVpcmVkRmllbGQocmF3LCBcIm5hbWVcIiwgXCJcdTRFNjBcdTYwRUZcdTdFQzRcIiwgYXNTdHIpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplSGFiaXQoaDogSGFiaXQpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7IGlkOiBoLmlkLCBuYW1lOiBoLm5hbWUgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlSGFiaXQoaGFiaXQ6IEhhYml0KTogdm9pZCB7XG4gIGlmIChoYWJpdC5uYW1lLnRyaW0oKS5sZW5ndGggPT09IDAgfHwgQXJyYXkuZnJvbShoYWJpdC5uYW1lKS5sZW5ndGggPiA0MCkge1xuICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NEU2MFx1NjBFRlx1NTQwRFx1NzlGMFx1OTcwMFx1NEUzQSAxXHUyMDEzNDAgXHU0RTJBXHU1QjU3XHU3QjI2XCIpO1xuICB9XG59XG4iLCAiLy8hIFx1NjVGNlx1OTVGNFx1NUI4OVx1NjM5Mlx1RkYxQVx1NjVFNVx1NjcxRi9cdTY1RjZcdTk1RjRcdTRFMEVcdTUzNTVcdTZCMjFcdTY1RjZcdTk1N0ZcdTY4MjFcdTlBOENcdTMwMDFcdTVGNTNcdTU5MjlcdTVGODVcdTU5MDRcdTc0MDZcdTk2MUZcdTUyMTdcdTMwMDFcdThCQTFcdTY1RjYvXHU5NTAxXHU2NzNBXHU1RUY2XHU1NDBFXHUzMDAxXHU4REU4XHU2NUU1XHU2RTA1XHU3NDA2XHUzMDAyXG4vLyEgXHU1QkY5XHU1RTk0IGNyYXRlcy9jb3JlL3NyYy9yZW1pbmRlcnMucnNcdTMwMDJcblxuaW1wb3J0IHsgQXBwRXJyb3IgfSBmcm9tIFwiLi9lcnJvcnNcIjtcbmltcG9ydCB7IGlkIH0gZnJvbSBcIi4vaWRzXCI7XG5pbXBvcnQgdHlwZSB7IEFwcERhdGEgfSBmcm9tIFwiLi9saWJcIjtcbmltcG9ydCB0eXBlIHsgU2V0dGluZ3MsIFRhc2ssIFRpbWVyIH0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IGlzSGFiaXQgfSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHsgZGF0ZUF0LCBtaW51dGVzT2YsIHNlY29uZHNPZkRheSwgdmFsaWREYXRlIH0gZnJvbSBcIi4vdGltZVwiO1xuXG4vKiogXHU0RUZCXHU1MkExXHU2NUU1XHU2NzFGXHU1RkM1XHU1ODZCXHUzMDAxXHU2M0QwXHU5MTkyXHU5NzAwXHU4OTgxXHU2NzA5XHU2NTQ4IEhIOk1NXHUzMDAxXHU1MzU1XHU2QjIxXHU2NUY2XHU5NTdGIDFcdTIwMTMxODBcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVJlbWluZGVyVGFzayh0YXNrOiBUYXNrKTogdm9pZCB7XG4gIGlmICh0YXNrLmR1ZURhdGUgPT09IG51bGwgfHwgIXZhbGlkRGF0ZSh0YXNrLmR1ZURhdGUpKSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU0RUZCXHU1MkExXHU1RkM1XHU5ODdCXHU2MzA3XHU1QjlBXHU2NzA5XHU2NTQ4XHU3Njg0XHU4QkExXHU1MjEyXHU2NUU1XHU2NzFGXCIpO1xuICB9XG4gIGlmIChcbiAgICB0YXNrLmZvY3VzTWludXRlcyAhPT0gbnVsbCAmJlxuICAgICh0YXNrLmZvY3VzTWludXRlcyA8IDEgfHwgdGFzay5mb2N1c01pbnV0ZXMgPiAxODApXG4gICkge1xuICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NTM1NVx1NkIyMVx1NEUxM1x1NkNFOFx1NjVGNlx1OTU3Rlx1OTcwMFx1NEUzQTFcdTIwMTQxODBcdTUyMDZcdTk0OUZcIik7XG4gIH1cbiAgaWYgKHRhc2sucmVtaW5kZXJUaW1lICE9PSBudWxsKSB7XG4gICAgaWYgKHRhc2suZHVlRGF0ZSA9PT0gbnVsbCB8fCBtaW51dGVzT2YodGFzay5yZW1pbmRlclRpbWUpID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTYzRDBcdTkxOTJcdTk3MDBcdTg5ODFcdThCQTFcdTUyMTJcdTY1RTVcdTY3MUZcdTU0OENcdTY3MDlcdTY1NDhcdTc2ODQgSEg6TU0gXHU2NUY2XHU5NUY0XCIpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFx1OEJBMVx1NTIxMlx1NTc1N1x1NjAzQlx1OTU3Rlx1RkYxQVx1NTE2OFx1OTBFOFx1NEUxM1x1NkNFOFx1NkJCNVx1NTJBMFx1NkJCNVx1OTVGNFx1NEYxMVx1NjA2Rlx1RkYwQ1x1NTkxQVx1NzU2QVx1ODMwNFx1NEVGQlx1NTJBMVx1OERFOFx1NEYxMVx1NjA2Rlx1OTVGNFx1OTY5OVx1NEVDRFx1NjcwOVx1NjU0OFx1MzAwMlxuICogXHU1QkY5XHU1RTk0IHJlbWluZGVyczo6d2luZG93X21pbnV0ZXNcdTMwMDJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpbmRvd01pbnV0ZXModGFzazogVGFzaywgc2V0dGluZ3M6IFNldHRpbmdzKTogbnVtYmVyIHtcbiAgY29uc3QgZm9jdXMgPSB0YXNrLmZvY3VzTWludXRlcyA/PyBzZXR0aW5ncy5mb2N1c01pbnV0ZXM7XG4gIGNvbnN0IHNlc3Npb25zID0gTWF0aC5tYXgoMSwgdGFzay5lc3RpbWF0ZSk7XG4gIGNvbnN0IGV2ZXJ5ID0gTWF0aC5tYXgoMSwgc2V0dGluZ3MubG9uZ0JyZWFrRXZlcnkpO1xuICBsZXQgYnJlYWtzID0gMDtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPCBzZXNzaW9uczsgaSArPSAxKSB7XG4gICAgYnJlYWtzICs9XG4gICAgICBpICUgZXZlcnkgPT09IDAgPyBzZXR0aW5ncy5sb25nQnJlYWtNaW51dGVzIDogc2V0dGluZ3Muc2hvcnRCcmVha01pbnV0ZXM7XG4gIH1cbiAgcmV0dXJuIHNlc3Npb25zICogZm9jdXMgKyBicmVha3M7XG59XG5cbi8qKiBcdTdBN0FcdTk1RjJcdUZGMUFcdTY3MkFcdThGRDBcdTg4NENcdTMwMDFcdTY3MkFcdTVGMDBcdTU5Q0JcdTMwMDFcdTUyNjlcdTRGNTlcdTZFRTFcdTk4OURcdTMwMDFcdTY1RTBcdTk1MDFcdTY3M0FcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1pbmRlcklkbGUoZGF0YTogQXBwRGF0YSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgICFkYXRhLnRpbWVyLnJ1bm5pbmcgJiZcbiAgICBkYXRhLnRpbWVyLnN0YXJ0ZWRBdCA9PT0gbnVsbCAmJlxuICAgIGRhdGEudGltZXIucmVtYWluaW5nU2VjcyA9PT0gZGF0YS50aW1lci5kdXJhdGlvblNlY3MgJiZcbiAgICBkYXRhLmxvY2suYWN0aXZlID09PSBudWxsXG4gICk7XG59XG5cbi8qKiBcdTVGNTNcdTU5MjlcdTVGODVcdTU5MDRcdTc0MDZcdTYzRDBcdTkxOTJcdUZGMDhcdTYzMDkgXHU2NUU1XHU2NzFGXHUzMDAxXHU2NUY2XHU5NUY0XHUzMDAxSUQgXHU2MzkyXHU1RThGXHU1M0Q2XHU2NzAwXHU2NUU5XHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gcGVuZGluZ1JlbWluZGVyKGRhdGE6IEFwcERhdGEpOiBUYXNrIHwgbnVsbCB7XG4gIGlmICghcmVtaW5kZXJJZGxlKGRhdGEpKSByZXR1cm4gbnVsbDtcbiAgbGV0IGJlc3Q6IFRhc2sgfCBudWxsID0gbnVsbDtcbiAgZm9yIChjb25zdCB0IG9mIGRhdGEudGFza3MpIHtcbiAgICBpZiAodC5jb21wbGV0ZWQgfHwgIXQucmVtaW5kZXJQZW5kaW5nKSBjb250aW51ZTtcbiAgICBpZiAoXG4gICAgICBiZXN0ID09PSBudWxsIHx8XG4gICAgICBgJHt0LmR1ZURhdGV9fCR7dC5yZW1pbmRlclRpbWV9fCR7dC5pZH1gIDxcbiAgICAgICAgYCR7YmVzdC5kdWVEYXRlfXwke2Jlc3QucmVtaW5kZXJUaW1lfXwke2Jlc3QuaWR9YFxuICAgICkge1xuICAgICAgYmVzdCA9IHQ7XG4gICAgfVxuICB9XG4gIHJldHVybiBiZXN0O1xufVxuXG4vKiogXHU4MUVBXHU1MkE4XHU1RjAwXHU1REU1XHU1MDE5XHU5MDA5XHVGRjFBXHU2M0QwXHU5MTkyXHU1Rjg1XHU1OTA0XHU3NDA2XHU0RTE0XHU0RUNEXHU2NzA5XHU1MjY5XHU0RjU5XHU4RjZFXHU2QjIxXHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gZHVlQXV0b1Rhc2soZGF0YTogQXBwRGF0YSk6IFRhc2sgfCBudWxsIHtcbiAgbGV0IGJlc3Q6IFRhc2sgfCBudWxsID0gbnVsbDtcbiAgZm9yIChjb25zdCB0IG9mIGRhdGEudGFza3MpIHtcbiAgICBpZiAoIXQucmVtaW5kZXJQZW5kaW5nIHx8ICF0YXNrSGFzUm91bmRzTGVmdChkYXRhLCB0KSkgY29udGludWU7XG4gICAgaWYgKFxuICAgICAgYmVzdCA9PT0gbnVsbCB8fFxuICAgICAgYCR7dC5kdWVEYXRlfXwke3QucmVtaW5kZXJUaW1lfXwke3QuaWR9YCA8XG4gICAgICAgIGAke2Jlc3QuZHVlRGF0ZX18JHtiZXN0LnJlbWluZGVyVGltZX18JHtiZXN0LmlkfWBcbiAgICApIHtcbiAgICAgIGJlc3QgPSB0O1xuICAgIH1cbiAgfVxuICByZXR1cm4gYmVzdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRhc2tIYXNSb3VuZHNMZWZ0KGRhdGE6IEFwcERhdGEsIHRhc2s6IFRhc2spOiBib29sZWFuIHtcbiAgaWYgKHRhc2suY29tcGxldGVkIHx8IHRhc2sucmVtaW5kZXJFeHBpcmVkKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IGNvbXBsZXRlZFJvdW5kcyA9IGRhdGEuc2Vzc2lvbnMuZmlsdGVyKFxuICAgIChzKSA9PiBzLnNvdXJjZSA9PT0gXCJ0aW1lclwiICYmIHMuY29tcGxldGVkICYmIHMudGFza0lkID09PSB0YXNrLmlkLFxuICApLmxlbmd0aDtcbiAgcmV0dXJuIGNvbXBsZXRlZFJvdW5kcyA8IHRhc2suZXN0aW1hdGU7XG59XG5cbi8qKiBcdTVCOUFcdTY1RjZcdTVGMDBcdTVERTVcdUZGMUFcdThCQTFcdTY1RjYvXHU2NjgyXHU1MDVDL1x1OTUwMVx1NjczQS9cdTgwMDNcdThCRDVcdTRFMkRcdTRFMERcdTYyQTJcdTUzNjBcdUZGMENcdThEODVcdThGQzdcdTRFRkJcdTUyQTFcdTY1RjZcdTZCQjVcdTRFMERcdTg4NjVcdTVGMDBcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGFydER1ZVRhc2soZGF0YTogQXBwRGF0YSwgYXQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICBpZiAoXG4gICAgIWRhdGEuc2V0dGluZ3MuYXV0b1N0YXJ0VGFza3MgfHxcbiAgICAhcmVtaW5kZXJJZGxlKGRhdGEpIHx8XG4gICAgZGF0YS5lZHVjYXRpb24uYXNzZXNzbWVudHMuc29tZShcbiAgICAgIChhKSA9PiBhLnN0YXJ0ZWRBdCAhPT0gbnVsbCAmJiBhLnN0b3BwZWRBdCA9PT0gbnVsbCxcbiAgICApXG4gICkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCB0YXNrID0gZHVlQXV0b1Rhc2soZGF0YSk7XG4gIGlmICh0YXNrID09PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gIGRhdGEudGltZXIudGFza0lkID0gdGFzay5pZDtcbiAgcmVzZXRUbyhkYXRhLCBcImZvY3VzXCIpO1xuICBzdGFydFRpbWVyKGRhdGEsIGF0KTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKiBcdTYzRDBcdTkxOTJcdTcyQjZcdTYwMDFcdTYzQThcdThGREJcdUZGMUFcdTUyMzBcdTY3MUYvXHU0RjVDXHU1RTlGL1x1NUY4NVx1NTkwNFx1NzQwNlx1RkYwQ1x1OERFOFx1NjVFNVx1NkUwNVx1NzQwNlx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRpY2tSZW1pbmRlcnMoZGF0YTogQXBwRGF0YSwgYXQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCB0b2RheSA9IGRhdGVBdChhdCk7XG4gIGNvbnN0IG5vd01pbnV0ZXMgPSBNYXRoLmZsb29yKHNlY29uZHNPZkRheShhdCkgLyA2MCk7XG4gIGNvbnN0IG5vd1NlY29uZHMgPSBzZWNvbmRzT2ZEYXkoYXQpO1xuICBjb25zdCBzZXR0aW5ncyA9IGRhdGEuc2V0dGluZ3M7XG4gIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gIGZvciAoY29uc3QgdCBvZiBkYXRhLnRhc2tzKSB7XG4gICAgY29uc3QgaXNUb2RheSA9IHQuZHVlRGF0ZSA9PT0gdG9kYXk7XG4gICAgY29uc3QgcGFzdCA9IHQuZHVlRGF0ZSAhPT0gbnVsbCAmJiB0LmR1ZURhdGUgPCB0b2RheTtcbiAgICBjb25zdCBzdGFydCA9IHQucmVtaW5kZXJUaW1lICE9PSBudWxsID8gbWludXRlc09mKHQucmVtaW5kZXJUaW1lKSA6IG51bGw7XG4gICAgLy8gXHU1QjlBXHU2NUY2XHU0RUZCXHU1MkExXHU1NzI4XHU1MTc2XHU2NUU1XHU2NzFGXHU4RkM3XHU1M0JCXHU1NDBFXHUzMDAxXHU2MjE2XHU4QkExXHU1MjEyXHU1NzU3XHU3RUQzXHU2NzVGXHU1NDBFXHU0RjVDXHU1RTlGXHVGRjFCXHU2QjY0XHU1NDBFXHU2NUUyXHU0RTBEXHU2M0QwXHU5MTkyXHU0RTVGXHU0RTBEXHU5ODdBXHU1RUY2XHUzMDAyXG4gICAgY29uc3QgZXhwaXJlZCA9XG4gICAgICAhdC5jb21wbGV0ZWQgJiZcbiAgICAgIChzdGFydCAhPT0gbnVsbFxuICAgICAgICA/ICgoKSA9PiB7XG4gICAgICAgICAgICAvLyBcdTY2NkVcdTkwMUFcdTRFRkJcdTUyQTFcdTU3MjhcdThCQTFcdTUyMTJcdTU3NTdcdTdFRDNcdTY3NUZcdTU0MEVcdTc2ODRcdTk3NTlcdTYwMDFcdTkxQ0RcdTRGRUVcdTdBOTdcdTUzRTNcdTUxODVcdTRFQ0RcdTUzRUZcdTg4NjVcdTUwNUFcdUZGMUJcdTRFNjBcdTYwRUZcdTdBOTdcdTUzRTNcdTRFM0EgMFx1MzAwMlxuICAgICAgICAgICAgY29uc3Qgc3BlbnRBdCA9XG4gICAgICAgICAgICAgIHN0YXJ0ICtcbiAgICAgICAgICAgICAgd2luZG93TWludXRlcyh0LCBzZXR0aW5ncykgK1xuICAgICAgICAgICAgICAoaXNIYWJpdCh0KSA/IDAgOiB0LnNjcmFwTWludXRlcyk7XG4gICAgICAgICAgICByZXR1cm4gcGFzdCB8fCAoaXNUb2RheSAmJiBub3dTZWNvbmRzID49IHNwZW50QXQgKiA2MCk7XG4gICAgICAgICAgfSkoKVxuICAgICAgICA6IGZhbHNlKTtcbiAgICBpZiAoZXhwaXJlZCAmJiAhdC5yZW1pbmRlckV4cGlyZWQpIHtcbiAgICAgIHQucmVtaW5kZXJFeHBpcmVkID0gdHJ1ZTtcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoKHQuY29tcGxldGVkIHx8IGV4cGlyZWQgfHwgIWlzVG9kYXkpICYmIHQucmVtaW5kZXJQZW5kaW5nKSB7XG4gICAgICB0LnJlbWluZGVyUGVuZGluZyA9IGZhbHNlO1xuICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgfVxuICAgIGlmIChleHBpcmVkICYmICF0LnJlbWluZGVyRmlyZWQpIHtcbiAgICAgIHQucmVtaW5kZXJGaXJlZCA9IHRydWU7XG4gICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgIXQuY29tcGxldGVkICYmXG4gICAgICAhdC5yZW1pbmRlckZpcmVkICYmXG4gICAgICBpc1RvZGF5ICYmXG4gICAgICAhZXhwaXJlZCAmJlxuICAgICAgc3RhcnQgIT09IG51bGwgJiZcbiAgICAgIHN0YXJ0IDw9IG5vd01pbnV0ZXNcbiAgICApIHtcbiAgICAgIHQucmVtaW5kZXJGaXJlZCA9IHRydWU7XG4gICAgICB0LnJlbWluZGVyUGVuZGluZyA9IHRydWU7XG4gICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNoYW5nZWQ7XG59XG5cbi8vIGxpYi50cyBcdTU5MERcdTc1MjhcdTc2ODRcdThCQTFcdTY1RjZcdTUzOUZcdThCRURcdUZGMDhcdTVCRjlcdTVFOTQgQXBwRGF0YSBcdTc2ODRcdTc5QzFcdTY3MDlcdTY1QjlcdTZDRDVcdUZGMDlcdTMwMDJcblxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVyUmVtYWluaW5nKHRpbWVyOiBUaW1lciwgYXQ6IG51bWJlcik6IG51bWJlciB7XG4gIGlmICh0aW1lci5ydW5uaW5nICYmIHRpbWVyLmRlYWRsaW5lICE9PSBudWxsKSB7XG4gICAgY29uc3QgcmVtYWluaW5nID0gdGltZXIuZGVhZGxpbmUgLSBhdDtcbiAgICByZXR1cm4gTWF0aC5taW4oTWF0aC5tYXgocmVtYWluaW5nLCAwKSwgdGltZXIuZHVyYXRpb25TZWNzKTtcbiAgfVxuICByZXR1cm4gdGltZXIucmVtYWluaW5nU2Vjcztcbn1cblxuLyoqIFx1N0VEM1x1NkUwNVx1NUY1M1x1NTI0RFx1OEJBMVx1NjVGNlx1NEUzQVx1NEUwMFx1Njc2MSBUaW1lciBcdTRFMTNcdTZDRThcdThCQjBcdTVGNTVcdUZGMUJcdTk3NUVcdTRFMTNcdTZDRThcdTYyMTZcdTk2RjZcdTc1MjhcdTY1RjZcdTRFMERcdTUwNUFcdTRFRkJcdTRGNTVcdTRFOEJcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiByZWNvcmRTZXNzaW9uKFxuICBkYXRhOiBBcHBEYXRhLFxuICBhdDogbnVtYmVyLFxuICBjb21wbGV0ZWQ6IGJvb2xlYW4sXG4pOiB2b2lkIHtcbiAgY29uc3QgZWxhcHNlZCA9IGRhdGEudGltZXIuZHVyYXRpb25TZWNzIC0gdGltZXJSZW1haW5pbmcoZGF0YS50aW1lciwgYXQpO1xuICBpZiAoZGF0YS50aW1lci5tb2RlICE9PSBcImZvY3VzXCIgfHwgZWxhcHNlZCA9PT0gMCkgcmV0dXJuO1xuICBjb25zdCB0YXNrID0gZGF0YS50YXNrcy5maW5kKCh0KSA9PiB0LmlkID09PSBkYXRhLnRpbWVyLnRhc2tJZCk7XG4gIGNvbnN0IHByb2plY3QgPVxuICAgIHRhc2sgIT09IHVuZGVmaW5lZCAmJiB0YXNrLnByb2plY3RJZCAhPT0gbnVsbFxuICAgICAgPyBkYXRhLnByb2plY3RzLmZpbmQoKHApID0+IHAuaWQgPT09IHRhc2sucHJvamVjdElkKVxuICAgICAgOiB1bmRlZmluZWQ7XG4gIGRhdGEuc2Vzc2lvbnMucHVzaCh7XG4gICAgaWQ6IGlkKCksXG4gICAgc291cmNlOiBcInRpbWVyXCIsXG4gICAgdGFza0lkOiBkYXRhLnRpbWVyLnRhc2tJZCxcbiAgICB0YXNrVGl0bGU6IHRhc2s/LnRpdGxlID8/IFwiXHU4MUVBXHU3NTMxXHU0RTEzXHU2Q0U4XCIsXG4gICAgcHJvamVjdE5hbWU6IHByb2plY3Q/Lm5hbWUgPz8gXCJcdTY3MkFcdTUyMDZcdTdDN0JcIixcbiAgICBzdGFydGVkQXQ6IGRhdGEudGltZXIuc3RhcnRlZEF0ID8/IGF0IC0gZWxhcHNlZCxcbiAgICBlbmRlZEF0OiBhdCxcbiAgICBkdXJhdGlvblNlY3M6IGVsYXBzZWQsXG4gICAgY29tcGxldGVkLFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0VG8oXG4gIGRhdGE6IEFwcERhdGEsXG4gIG1vZGU6IFwiZm9jdXNcIiB8IFwic2hvcnRCcmVha1wiIHwgXCJsb25nQnJlYWtcIixcbik6IHZvaWQge1xuICBkYXRhLnRpbWVyLmF1dG9Gb2N1c0Jsb2NrZWQgPSBmYWxzZTtcbiAgZGF0YS50aW1lci5tb2RlID0gbW9kZTtcbiAgZGF0YS50aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gIGRhdGEudGltZXIuZHVyYXRpb25TZWNzID0gZHVyYXRpb25PZihkYXRhLCBtb2RlKTtcbiAgZGF0YS50aW1lci5yZW1haW5pbmdTZWNzID0gZGF0YS50aW1lci5kdXJhdGlvblNlY3M7XG4gIGRhdGEudGltZXIuZGVhZGxpbmUgPSBudWxsO1xuICBkYXRhLnRpbWVyLnN0YXJ0ZWRBdCA9IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkdXJhdGlvbk9mKFxuICBkYXRhOiBBcHBEYXRhLFxuICBtb2RlOiBcImZvY3VzXCIgfCBcInNob3J0QnJlYWtcIiB8IFwibG9uZ0JyZWFrXCIsXG4pOiBudW1iZXIge1xuICBjb25zdCBtaW51dGVzID1cbiAgICBtb2RlID09PSBcImZvY3VzXCJcbiAgICAgID8gKGRhdGEudGFza3MuZmluZCgodCkgPT4gdC5pZCA9PT0gZGF0YS50aW1lci50YXNrSWQpPy5mb2N1c01pbnV0ZXMgPz9cbiAgICAgICAgZGF0YS5zZXR0aW5ncy5mb2N1c01pbnV0ZXMpXG4gICAgICA6IG1vZGUgPT09IFwic2hvcnRCcmVha1wiXG4gICAgICAgID8gZGF0YS5zZXR0aW5ncy5zaG9ydEJyZWFrTWludXRlc1xuICAgICAgICA6IGRhdGEuc2V0dGluZ3MubG9uZ0JyZWFrTWludXRlcztcbiAgcmV0dXJuIDYwICogbWludXRlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0VGltZXIoZGF0YTogQXBwRGF0YSwgYXQ6IG51bWJlcik6IHZvaWQge1xuICBpZiAoZGF0YS50aW1lci5tb2RlID09PSBcImZvY3VzXCIpIHtcbiAgICBpZiAoXG4gICAgICBkYXRhLnRpbWVyLnN0YXJ0ZWRBdCA9PT0gbnVsbCAmJlxuICAgICAgIWRhdGEudGltZXIucnVubmluZyAmJlxuICAgICAgZGF0YS50aW1lci5yZW1haW5pbmdTZWNzID09PSBkYXRhLnRpbWVyLmR1cmF0aW9uU2Vjc1xuICAgICkge1xuICAgICAgcmVzZXRUbyhkYXRhLCBcImZvY3VzXCIpO1xuICAgIH1cbiAgICBjb25zdCB0YXNrID0gZGF0YS50YXNrcy5maW5kKCh0KSA9PiB0LmlkID09PSBkYXRhLnRpbWVyLnRhc2tJZCk7XG4gICAgaWYgKHRhc2sgIT09IHVuZGVmaW5lZCkgdGFzay5yZW1pbmRlclBlbmRpbmcgPSBmYWxzZTtcbiAgfVxuICBpZiAoIWRhdGEudGltZXIucnVubmluZykge1xuICAgIGlmIChkYXRhLnRpbWVyLnN0YXJ0ZWRBdCA9PT0gbnVsbCkgZGF0YS50aW1lci5zdGFydGVkQXQgPSBhdDtcbiAgICBkYXRhLnRpbWVyLmRlYWRsaW5lID0gYXQgKyBkYXRhLnRpbWVyLnJlbWFpbmluZ1NlY3M7XG4gICAgZGF0YS50aW1lci5ydW5uaW5nID0gdHJ1ZTtcbiAgfVxufVxuIiwgIi8vISBcdTZBMjFcdTY3N0ZcdTRFMEVcdTUzNzBcdTUyMzdcdUZGMUFcdTVGNjJcdTcyQjZcdTUzNzBcdTY1RjZcdTU5MERcdTUyMzZcdUZGMENcdThEMjZcdTY3MkNcdTcyRUNcdTdBQ0JcdTRFOEVcdTVCOUVcdTRGOEJcdUZGMENcdTUyMjBcdTRFODZcdTRFMERcdTRGMUFcdTkxQ0RcdTczQjBcdTMwMDJcbi8vISBcdTVCRjlcdTVFOTQgY3JhdGVzL2NvcmUvc3JjL3RlbXBsYXRlcy5yc1x1MzAwMkFwcERhdGEgXHU2NUI5XHU2Q0Q1XHU0RUU1XHU4MUVBXHU3NTMxXHU1MUZEXHU2NTcwICsgbGliLnRzIFx1ODU4NFx1NTMwNVx1ODhDNVx1NjNEMFx1NEY5Qlx1MzAwMlxuXG5pbXBvcnQgeyBBcHBFcnJvciwgY2xvbmUsIGVuc3VyZSB9IGZyb20gXCIuL2Vycm9yc1wiO1xuaW1wb3J0IHsgaWQgfSBmcm9tIFwiLi9pZHNcIjtcbmltcG9ydCB7XG4gIGFzQXJyYXksXG4gIGFzQm9vbCxcbiAgYXNJbnQsXG4gIGFzT3B0LFxuICBhc1N0cixcbiAgZmllbGQsXG4gIGlzT2JqZWN0LFxuICBvbmVPZixcbiAgcmVqZWN0VW5rbm93bixcbiAgcmVxdWlyZWRGaWVsZCxcbn0gZnJvbSBcIi4vanNvblwiO1xuaW1wb3J0IHR5cGUge1xuICBDYWxlbmRhclNsb3QsXG4gIFByaW50UmVjb3JkLFxuICBQcmludGluZyxcbiAgUHJpbnRTbG90LFxuICBTaGFwZSxcbiAgVGFzayxcbiAgVGVtcGxhdGUsXG4gIFRlbXBsYXRlU3VidGFzayxcbn0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB0eXBlIHsgQXBwRGF0YSB9IGZyb20gXCIuL2xpYlwiO1xuaW1wb3J0IHsgaXNIYWJpdCwga2luZE9mIH0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IHdpbmRvd01pbnV0ZXMgfSBmcm9tIFwiLi9yZW1pbmRlcnNcIjtcbmltcG9ydCB7XG4gIGFkZERheXMsXG4gIGRhdGVBdCxcbiAgbWludXRlc09mLFxuICBwYXJzZURhdGUsXG4gIHNlY29uZHNPZkRheSxcbiAgdmFsaWREYXRlLFxuICB2YWxpZFRpbWUsXG4gIHdlZWtTdGFydCxcbiAgd2Vla2RheU1vbmRheSxcbn0gZnJvbSBcIi4vdGltZVwiO1xuXG5jb25zdCBURU1QTEFURV9TVUJUQVNLX0tFWVMgPSBbXCJpZFwiLCBcInRpdGxlXCJdIGFzIGNvbnN0O1xuY29uc3QgU0hBUEVfS0VZUyA9IFtcbiAgXCJ0aXRsZVwiLFxuICBcIm5vdGVzXCIsXG4gIFwicHJvamVjdElkXCIsXG4gIFwiaGFiaXRJZFwiLFxuICBcImZvY3VzTWludXRlc1wiLFxuICBcInNjcmFwTWludXRlc1wiLFxuICBcInByaW9yaXR5XCIsXG4gIFwiZXN0aW1hdGVcIixcbiAgXCJ0YWdzXCIsXG4gIFwic3VidGFza3NcIixcbl0gYXMgY29uc3Q7XG5jb25zdCBQUklOVF9TTE9UX0tFWVMgPSBbXCJkYXlzXCIsIFwidGltZVwiXSBhcyBjb25zdDtcbmNvbnN0IENBTEVOREFSX1NMT1RfS0VZUyA9IFtcImRhdGVzXCIsIFwidGltZVwiXSBhcyBjb25zdDtcbmNvbnN0IFRFTVBMQVRFX0tFWVMgPSBbXG4gIFwiaWRcIixcbiAgXCJzaGFwZVwiLFxuICBcInByaW50aW5nXCIsXG4gIFwiYXV0b21hdGljXCIsXG4gIFwicHJpbnRBaGVhZERheXNcIixcbl0gYXMgY29uc3Q7XG5jb25zdCBQUklOVF9SRUNPUkRfS0VZUyA9IFtcInRlbXBsYXRlSWRcIiwgXCJkYXRlXCJdIGFzIGNvbnN0O1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VUZW1wbGF0ZVN1YnRhc2socmF3OiB1bmtub3duKTogVGVtcGxhdGVTdWJ0YXNrIHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTZBMjFcdTY3N0ZcdTVCNTBcdTRFRkJcdTUyQTFcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24ocmF3LCBbLi4uVEVNUExBVEVfU1VCVEFTS19LRVlTXSwgXCJcdTZBMjFcdTY3N0ZcdTVCNTBcdTRFRkJcdTUyQTFcIik7XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiXHU2QTIxXHU2NzdGXHU1QjUwXHU0RUZCXHU1MkExXCIsIGFzU3RyKSxcbiAgICB0aXRsZTogcmVxdWlyZWRGaWVsZChyYXcsIFwidGl0bGVcIiwgXCJcdTZBMjFcdTY3N0ZcdTVCNTBcdTRFRkJcdTUyQTFcIiwgYXNTdHIpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTaGFwZShyYXc6IHVua25vd24pOiBTaGFwZSB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2QTIxXHU2NzdGXHU1RjYyXHU3MkI2XHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKHJhdywgWy4uLlNIQVBFX0tFWVNdLCBcIlx1NkEyMVx1Njc3Rlx1NUY2Mlx1NzJCNlwiKTtcbiAgcmV0dXJuIHtcbiAgICB0aXRsZTogcmVxdWlyZWRGaWVsZChyYXcsIFwidGl0bGVcIiwgXCJcdTZBMjFcdTY3N0ZcdTVGNjJcdTcyQjZcIiwgYXNTdHIpLFxuICAgIG5vdGVzOiBmaWVsZChyYXcsIFwibm90ZXNcIiwgXCJcdTZBMjFcdTY3N0ZcdTVGNjJcdTcyQjZcIiwgYXNTdHIsIFwiXCIpLFxuICAgIHByb2plY3RJZDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInByb2plY3RJZFwiLFxuICAgICAgXCJcdTZBMjFcdTY3N0ZcdTVGNjJcdTcyQjZcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcInByb2plY3RJZFwiLCBhc1N0ciksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgICBoYWJpdElkOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiaGFiaXRJZFwiLFxuICAgICAgXCJcdTZBMjFcdTY3N0ZcdTVGNjJcdTcyQjZcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcImhhYml0SWRcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gICAgZm9jdXNNaW51dGVzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiZm9jdXNNaW51dGVzXCIsXG4gICAgICBcIlx1NkEyMVx1Njc3Rlx1NUY2Mlx1NzJCNlwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiZm9jdXNNaW51dGVzXCIsICh4KSA9PiBhc0ludCh4LCBcImZvY3VzTWludXRlc1wiKSksXG4gICAgICBudWxsLFxuICAgICkgYXMgbnVtYmVyIHwgbnVsbCxcbiAgICBzY3JhcE1pbnV0ZXM6IGZpZWxkKHJhdywgXCJzY3JhcE1pbnV0ZXNcIiwgXCJcdTZBMjFcdTY3N0ZcdTVGNjJcdTcyQjZcIiwgYXNJbnQsIDApLFxuICAgIHByaW9yaXR5OiBmaWVsZChyYXcsIFwicHJpb3JpdHlcIiwgXCJcdTZBMjFcdTY3N0ZcdTVGNjJcdTcyQjZcIiwgYXNJbnQsIDApLFxuICAgIGVzdGltYXRlOiBmaWVsZChyYXcsIFwiZXN0aW1hdGVcIiwgXCJcdTZBMjFcdTY3N0ZcdTVGNjJcdTcyQjZcIiwgYXNJbnQsIDEpLFxuICAgIHRhZ3M6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJ0YWdzXCIsXG4gICAgICBcIlx1NkEyMVx1Njc3Rlx1NUY2Mlx1NzJCNlwiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJ0YWdzXCIpLm1hcCgodCkgPT4gYXNTdHIodCwgXCJcdTY4MDdcdTdCN0VcIikpLFxuICAgICAgW10sXG4gICAgKSxcbiAgICBzdWJ0YXNrczogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInN1YnRhc2tzXCIsXG4gICAgICBcIlx1NkEyMVx1Njc3Rlx1NUY2Mlx1NzJCNlwiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJzdWJ0YXNrc1wiKS5tYXAocGFyc2VUZW1wbGF0ZVN1YnRhc2spLFxuICAgICAgW10sXG4gICAgKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVNoYXBlKHM6IFNoYXBlKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4ge1xuICAgIHRpdGxlOiBzLnRpdGxlLFxuICAgIG5vdGVzOiBzLm5vdGVzLFxuICAgIHByb2plY3RJZDogcy5wcm9qZWN0SWQsXG4gICAgaGFiaXRJZDogcy5oYWJpdElkLFxuICAgIGZvY3VzTWludXRlczogcy5mb2N1c01pbnV0ZXMsXG4gICAgc2NyYXBNaW51dGVzOiBzLnNjcmFwTWludXRlcyxcbiAgICBwcmlvcml0eTogcy5wcmlvcml0eSxcbiAgICBlc3RpbWF0ZTogcy5lc3RpbWF0ZSxcbiAgICB0YWdzOiBzLnRhZ3MsXG4gICAgc3VidGFza3M6IHMuc3VidGFza3MubWFwKChzdWIpID0+ICh7IGlkOiBzdWIuaWQsIHRpdGxlOiBzdWIudGl0bGUgfSkpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQcmludFNsb3QocmF3OiB1bmtub3duKTogUHJpbnRTbG90IHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTU0NjhcdTY3MUZcdTY1RjZcdTZCQjVcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24ocmF3LCBbLi4uUFJJTlRfU0xPVF9LRVlTXSwgXCJcdTU0NjhcdTY3MUZcdTY1RjZcdTZCQjVcIik7XG4gIHJldHVybiB7XG4gICAgZGF5czogYXNBcnJheShcbiAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcImRheXNcIiwgXCJcdTU0NjhcdTY3MUZcdTY1RjZcdTZCQjVcIiwgKHYpID0+IHYpLFxuICAgICAgXCJkYXlzXCIsXG4gICAgKS5tYXAoKGQpID0+IGFzSW50KGQsIFwiXHU1NDY4XHU2NzFGXHU2NjFGXHU2NzFGXCIpKSxcbiAgICB0aW1lOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidGltZVwiLFxuICAgICAgXCJcdTU0NjhcdTY3MUZcdTY1RjZcdTZCQjVcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcInRpbWVcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNhbGVuZGFyU2xvdChyYXc6IHVua25vd24pOiBDYWxlbmRhclNsb3Qge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NjVFNVx1N0EwQlx1NjVGNlx1NkJCNVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIFsuLi5DQUxFTkRBUl9TTE9UX0tFWVNdLCBcIlx1NjVFNVx1N0EwQlx1NjVGNlx1NkJCNVwiKTtcbiAgcmV0dXJuIHtcbiAgICBkYXRlczogYXNBcnJheShcbiAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcImRhdGVzXCIsIFwiXHU2NUU1XHU3QTBCXHU2NUY2XHU2QkI1XCIsICh2KSA9PiB2KSxcbiAgICAgIFwiZGF0ZXNcIixcbiAgICApLm1hcCgoZCkgPT4gYXNTdHIoZCwgXCJcdTY1RTVcdTdBMEJcdTY1RTVcdTY3MUZcIikpLFxuICAgIHRpbWU6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJ0aW1lXCIsXG4gICAgICBcIlx1NjVFNVx1N0EwQlx1NjVGNlx1NkJCNVwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwidGltZVwiLCBhc1N0ciksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUHJpbnRpbmcocmF3OiB1bmtub3duKTogUHJpbnRpbmcge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NTM3MFx1NTIzN1x1ODlDNFx1NTIxOVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgY29uc3Qga2luZCA9IG9uZU9mKFxuICAgIHJlcXVpcmVkRmllbGQocmF3LCBcImtpbmRcIiwgXCJcdTUzNzBcdTUyMzdcdTg5QzRcdTUyMTlcIiwgKHYpID0+IHYpLFxuICAgIFwiXHU1MzcwXHU1MjM3XHU4OUM0XHU1MjE5IGtpbmRcIixcbiAgICBbXCJvbmNlXCIsIFwiY2FsZW5kYXJcIiwgXCJ3ZWVrbHlcIl0sXG4gICk7XG4gIGlmIChraW5kID09PSBcIm9uY2VcIikge1xuICAgIHJlamVjdFVua25vd24ocmF3LCBbXCJraW5kXCIsIFwiZGF0ZVwiLCBcInRpbWVcIl0sIFwiXHU0RTAwXHU2QjIxXHU2MDI3XHU1MzcwXHU1MjM3XHU4OUM0XHU1MjE5XCIpO1xuICAgIHJldHVybiB7XG4gICAgICBraW5kLFxuICAgICAgZGF0ZTogZmllbGQoXG4gICAgICAgIHJhdyxcbiAgICAgICAgXCJkYXRlXCIsXG4gICAgICAgIFwiXHU0RTAwXHU2QjIxXHU2MDI3XHU1MzcwXHU1MjM3XHU4OUM0XHU1MjE5XCIsXG4gICAgICAgICh2KSA9PiBhc09wdCh2LCBcImRhdGVcIiwgYXNTdHIpLFxuICAgICAgICBudWxsLFxuICAgICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgICAgdGltZTogZmllbGQoXG4gICAgICAgIHJhdyxcbiAgICAgICAgXCJ0aW1lXCIsXG4gICAgICAgIFwiXHU0RTAwXHU2QjIxXHU2MDI3XHU1MzcwXHU1MjM3XHU4OUM0XHU1MjE5XCIsXG4gICAgICAgICh2KSA9PiBhc09wdCh2LCBcInRpbWVcIiwgYXNTdHIpLFxuICAgICAgICBudWxsLFxuICAgICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgIH07XG4gIH1cbiAgaWYgKGtpbmQgPT09IFwiY2FsZW5kYXJcIikge1xuICAgIHJlamVjdFVua25vd24ocmF3LCBbXCJraW5kXCIsIFwic2xvdHNcIl0sIFwiXHU2NUU1XHU3QTBCXHU1MzcwXHU1MjM3XHU4OUM0XHU1MjE5XCIpO1xuICAgIHJldHVybiB7XG4gICAgICBraW5kLFxuICAgICAgc2xvdHM6IGFzQXJyYXkoXG4gICAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcInNsb3RzXCIsIFwiXHU2NUU1XHU3QTBCXHU1MzcwXHU1MjM3XHU4OUM0XHU1MjE5XCIsICh2KSA9PiB2KSxcbiAgICAgICAgXCJzbG90c1wiLFxuICAgICAgKS5tYXAocGFyc2VDYWxlbmRhclNsb3QpLFxuICAgIH07XG4gIH1cbiAgcmVqZWN0VW5rbm93bihyYXcsIFtcImtpbmRcIiwgXCJzbG90c1wiXSwgXCJcdTU0NjhcdTY3MUZcdTUzNzBcdTUyMzdcdTg5QzRcdTUyMTlcIik7XG4gIHJldHVybiB7XG4gICAga2luZCxcbiAgICBzbG90czogYXNBcnJheShcbiAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcInNsb3RzXCIsIFwiXHU1NDY4XHU2NzFGXHU1MzcwXHU1MjM3XHU4OUM0XHU1MjE5XCIsICh2KSA9PiB2KSxcbiAgICAgIFwic2xvdHNcIixcbiAgICApLm1hcChwYXJzZVByaW50U2xvdCksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVQcmludGluZyhwOiBQcmludGluZyk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgaWYgKHAua2luZCA9PT0gXCJvbmNlXCIpIHtcbiAgICByZXR1cm4geyBraW5kOiBcIm9uY2VcIiwgZGF0ZTogcC5kYXRlLCB0aW1lOiBwLnRpbWUgfTtcbiAgfVxuICBpZiAocC5raW5kID09PSBcImNhbGVuZGFyXCIpIHtcbiAgICByZXR1cm4ge1xuICAgICAga2luZDogXCJjYWxlbmRhclwiLFxuICAgICAgc2xvdHM6IHAuc2xvdHMubWFwKChzKSA9PiAoeyBkYXRlczogcy5kYXRlcywgdGltZTogcy50aW1lIH0pKSxcbiAgICB9O1xuICB9XG4gIHJldHVybiB7XG4gICAga2luZDogXCJ3ZWVrbHlcIixcbiAgICBzbG90czogcC5zbG90cy5tYXAoKHMpID0+ICh7IGRheXM6IHMuZGF5cywgdGltZTogcy50aW1lIH0pKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVGVtcGxhdGUocmF3OiB1bmtub3duKTogVGVtcGxhdGUge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NkEyMVx1Njc3Rlx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIFsuLi5URU1QTEFURV9LRVlTXSwgXCJcdTZBMjFcdTY3N0ZcIik7XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiXHU2QTIxXHU2NzdGXCIsIGFzU3RyKSxcbiAgICBzaGFwZTogcGFyc2VTaGFwZShyZXF1aXJlZEZpZWxkKHJhdywgXCJzaGFwZVwiLCBcIlx1NkEyMVx1Njc3RlwiLCAodikgPT4gdikpLFxuICAgIHByaW50aW5nOiBwYXJzZVByaW50aW5nKHJlcXVpcmVkRmllbGQocmF3LCBcInByaW50aW5nXCIsIFwiXHU2QTIxXHU2NzdGXCIsICh2KSA9PiB2KSksXG4gICAgYXV0b21hdGljOiBmaWVsZChyYXcsIFwiYXV0b21hdGljXCIsIFwiXHU2QTIxXHU2NzdGXCIsIGFzQm9vbCwgZmFsc2UpLFxuICAgIHByaW50QWhlYWREYXlzOiBmaWVsZChyYXcsIFwicHJpbnRBaGVhZERheXNcIiwgXCJcdTZBMjFcdTY3N0ZcIiwgYXNJbnQsIDcpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplVGVtcGxhdGUodDogVGVtcGxhdGUpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7XG4gICAgaWQ6IHQuaWQsXG4gICAgc2hhcGU6IHNlcmlhbGl6ZVNoYXBlKHQuc2hhcGUpLFxuICAgIHByaW50aW5nOiBzZXJpYWxpemVQcmludGluZyh0LnByaW50aW5nKSxcbiAgICBhdXRvbWF0aWM6IHQuYXV0b21hdGljLFxuICAgIHByaW50QWhlYWREYXlzOiB0LnByaW50QWhlYWREYXlzLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQcmludFJlY29yZChyYXc6IHVua25vd24pOiBQcmludFJlY29yZCB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU1MzcwXHU1MjM3XHU4QkIwXHU1RjU1XHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKHJhdywgWy4uLlBSSU5UX1JFQ09SRF9LRVlTXSwgXCJcdTUzNzBcdTUyMzdcdThCQjBcdTVGNTVcIik7XG4gIHJldHVybiB7XG4gICAgdGVtcGxhdGVJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwidGVtcGxhdGVJZFwiLCBcIlx1NTM3MFx1NTIzN1x1OEJCMFx1NUY1NVwiLCBhc1N0ciksXG4gICAgZGF0ZTogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImRhdGVcIixcbiAgICAgIFwiXHU1MzcwXHU1MjM3XHU4QkIwXHU1RjU1XCIsXG4gICAgICAodikgPT4gYXNPcHQodiwgXCJkYXRlXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplUHJpbnRSZWNvcmQocDogUHJpbnRSZWNvcmQpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7IHRlbXBsYXRlSWQ6IHAudGVtcGxhdGVJZCwgZGF0ZTogcC5kYXRlIH07XG59XG5cbi8qKiBcdTU0NjhcdTY3MUZcdTZBMjFcdTY3N0ZcdTYyNERcdTY2MkZcdTkxQ0RcdTU5MERcdTY3NjVcdTZFOTBcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZW1wbGF0ZVJlY3VycmluZyh0ZW1wbGF0ZTogVGVtcGxhdGUpOiBib29sZWFuIHtcbiAgcmV0dXJuIHRlbXBsYXRlLnByaW50aW5nLmtpbmQgPT09IFwid2Vla2x5XCI7XG59XG5cbi8qKiBcdTRFMDBcdTRFMkFcdTY1RTVcdTY3MUZcdTVCRjlcdTVFOTRcdTc2ODRcdTUxNjhcdTkwRThcdTVGMDBcdTU5Q0JcdTY1RjZcdTUyM0JcdUZGMUJcdTY1RTVcdTY3MUZcdTY1RTBcdTY1NDhcdTYyMTZcdTRFMERcdTU3MjhcdTVCODlcdTYzOTJcdTUxODVcdTYyQTVcdTk1MTlcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZW1wbGF0ZVRpbWVzKFxuICB0ZW1wbGF0ZTogVGVtcGxhdGUsXG4gIGRhdGU6IHN0cmluZyB8IG51bGwsXG4pOiAoc3RyaW5nIHwgbnVsbClbXSB7XG4gIGlmIChkYXRlID09PSBudWxsIHx8ICF2YWxpZERhdGUoZGF0ZSkpIHtcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTY1RTBcdTY1NDhcdTc2ODRcdTUzNzBcdTUyMzdcdTY1RTVcdTY3MUZcIik7XG4gIH1cbiAgY29uc3QgcHJpbnRpbmcgPSB0ZW1wbGF0ZS5wcmludGluZztcbiAgaWYgKHByaW50aW5nLmtpbmQgPT09IFwib25jZVwiKSB7XG4gICAgaWYgKHByaW50aW5nLnRpbWUgIT09IG51bGwgJiYgZGF0ZSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU1QjlBXHU2NUY2XHU1QjlFXHU0RjhCXHU5NzAwXHU4OTgxXHU2NUU1XHU2NzFGXCIpO1xuICAgIH1cbiAgICByZXR1cm4gW3ByaW50aW5nLnRpbWVdO1xuICB9XG4gIGlmIChwcmludGluZy5raW5kID09PSBcImNhbGVuZGFyXCIpIHtcbiAgICBjb25zdCB0aW1lcyA9IHByaW50aW5nLnNsb3RzXG4gICAgICAuZmlsdGVyKChzKSA9PiBzLmRhdGVzLmluY2x1ZGVzKGRhdGUpKVxuICAgICAgLm1hcCgocykgPT4gcy50aW1lKTtcbiAgICBpZiAodGltZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdThCRTVcdTY1RTVcdTY3MUZcdTRFMERcdTU3MjhcdTY1RTVcdTdBMEJcdTg4NjhcdTRFMkRcIik7XG4gICAgfVxuICAgIHJldHVybiB0aW1lcztcbiAgfVxuICBjb25zdCB3ZWVrZGF5ID0gd2Vla2RheU1vbmRheShwYXJzZURhdGUoZGF0ZSkhKTtcbiAgY29uc3QgdGltZXMgPSBwcmludGluZy5zbG90c1xuICAgIC5maWx0ZXIoKHMpID0+IHMuZGF5cy5pbmNsdWRlcyh3ZWVrZGF5KSlcbiAgICAubWFwKChzKSA9PiBzLnRpbWUpO1xuICBpZiAodGltZXMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4QkU1XHU2NUU1XHU2NzFGXHU0RTBEXHU1NzI4XHU2NzJDXHU1NDY4XHU1Qjg5XHU2MzkyXHU0RTJEXCIpO1xuICB9XG4gIHJldHVybiB0aW1lcztcbn1cblxuLyoqIFx1NTM3MFx1NTFGQVx1NUI5RVx1NEY4Qlx1RkYxQVx1NUY2Mlx1NzJCNlx1NTcyOFx1NTM3MFx1NTIzN1x1NjVGNlx1NTIzQlx1NTkwRFx1NTIzNlx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRlbXBsYXRlSW5zdGFuY2UoXG4gIHRlbXBsYXRlOiBUZW1wbGF0ZSxcbiAgZGF0ZTogc3RyaW5nIHwgbnVsbCxcbiAgdGltZTogc3RyaW5nIHwgbnVsbCxcbiAgYXQ6IG51bWJlcixcbik6IFRhc2sge1xuICBjb25zdCB0YXNrOiBUYXNrID0ge1xuICAgIGlkOiBpZCgpLFxuICAgIHRlbXBsYXRlSWQ6IHRlbXBsYXRlLmlkLFxuICAgIHJlY3VycmluZzogdGVtcGxhdGVSZWN1cnJpbmcodGVtcGxhdGUpLFxuICAgIHRpdGxlOiBcIlwiLFxuICAgIG5vdGVzOiBcIlwiLFxuICAgIHByb2plY3RJZDogbnVsbCxcbiAgICBoYWJpdElkOiBudWxsLFxuICAgIGR1ZURhdGU6IGRhdGUsXG4gICAgcmVtaW5kZXJUaW1lOiB0aW1lLFxuICAgIGZvY3VzTWludXRlczogbnVsbCxcbiAgICBzY3JhcE1pbnV0ZXM6IDAsXG4gICAgcHJpb3JpdHk6IDAsXG4gICAgZXN0aW1hdGU6IDEsXG4gICAgcmVtaW5kZXJGaXJlZDogZmFsc2UsXG4gICAgcmVtaW5kZXJQZW5kaW5nOiBmYWxzZSxcbiAgICByZW1pbmRlckV4cGlyZWQ6IGZhbHNlLFxuICAgIGNvbXBsZXRlZDogZmFsc2UsXG4gICAgY29tcGxldGVkQXQ6IG51bGwsXG4gICAgY3JlYXRlZEF0OiBhdCxcbiAgICB0YWdzOiBbXSxcbiAgICBzdWJ0YXNrczogW10sXG4gIH07XG4gIGNvcHlTaGFwZSh0ZW1wbGF0ZS5zaGFwZSwgdGFzayk7XG4gIHJldHVybiB0YXNrO1xufVxuXG5mdW5jdGlvbiBjb3B5U2hhcGUoc2hhcGU6IFNoYXBlLCB0YXNrOiBUYXNrKTogdm9pZCB7XG4gIHRhc2sudGl0bGUgPSBzaGFwZS50aXRsZTtcbiAgdGFzay5ub3RlcyA9IHNoYXBlLm5vdGVzO1xuICB0YXNrLnByb2plY3RJZCA9IHNoYXBlLnByb2plY3RJZDtcbiAgdGFzay5oYWJpdElkID0gc2hhcGUuaGFiaXRJZDtcbiAgdGFzay5mb2N1c01pbnV0ZXMgPSBzaGFwZS5mb2N1c01pbnV0ZXM7XG4gIHRhc2suc2NyYXBNaW51dGVzID0gaXNIYWJpdCh0YXNrKSA/IDAgOiBzaGFwZS5zY3JhcE1pbnV0ZXM7XG4gIHRhc2sucHJpb3JpdHkgPSBzaGFwZS5wcmlvcml0eTtcbiAgdGFzay5lc3RpbWF0ZSA9IHNoYXBlLmVzdGltYXRlO1xuICB0YXNrLnRhZ3MgPSBbLi4uc2hhcGUudGFnc107XG4gIC8vIFx1NjYzRVx1NUYwRlx1NTQwQ1x1NkI2NVx1NjVGNlx1NEZERFx1NzU1OVx1NTMzOVx1OTE0RFx1NkI2NVx1OUFBNFx1NzY4NFx1NUI4Q1x1NjIxMFx1NzJCNlx1NjAwMVx1MzAwMlxuICB0YXNrLnN1YnRhc2tzID0gc2hhcGUuc3VidGFza3MubWFwKChzdWIpID0+ICh7XG4gICAgaWQ6IHN1Yi5pZCxcbiAgICB0aXRsZTogc3ViLnRpdGxlLFxuICAgIGRvbmU6IHRhc2suc3VidGFza3Muc29tZSgob2xkKSA9PiBvbGQuaWQgPT09IHN1Yi5pZCAmJiBvbGQuZG9uZSksXG4gIH0pKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlVGVtcGxhdGVzKGRhdGE6IEFwcERhdGEpOiB2b2lkIHtcbiAgaWYgKGRhdGEudGVtcGxhdGVzLmxlbmd0aCA+IDUwMDAgfHwgZGF0YS5wcmludHMubGVuZ3RoID4gMjAwMDAwKSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2QTIxXHU2NzdGXHU2MjE2XHU1MzcwXHU1MjM3XHU4QkIwXHU1RjU1XHU4RDg1XHU1MUZBXHU5NjUwXHU1MjM2XCIpO1xuICB9XG4gIGNvbnN0IGlkcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IHQgb2YgZGF0YS50ZW1wbGF0ZXMpIHtcbiAgICBpZiAodC5pZC5sZW5ndGggPT09IDAgfHwgaWRzLmhhcyh0LmlkKSkge1xuICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2QTIxXHU2NzdGIElEIFx1OTFDRFx1NTkwRFx1NjIxNlx1NEUzQVx1N0E3QVwiKTtcbiAgICB9XG4gICAgaWRzLmFkZCh0LmlkKTtcbiAgICBjb25zdCBzID0gdC5zaGFwZTtcbiAgICBpZiAodC5wcmludEFoZWFkRGF5cyA+IDkwKSB7XG4gICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTk4ODRcdTUzNzBcdTU5MjlcdTY1NzBcdTk3MDBcdTRFM0EgMFx1MjAxMzkwIFx1NTkyOVwiKTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgcy50aXRsZS50cmltKCkubGVuZ3RoID09PSAwIHx8XG4gICAgICBBcnJheS5mcm9tKHMudGl0bGUpLmxlbmd0aCA+IDIwMCB8fFxuICAgICAgcy5ub3Rlcy5sZW5ndGggPiA1MDAwMCB8fFxuICAgICAgcy5wcmlvcml0eSA+IDMgfHxcbiAgICAgIHMuZXN0aW1hdGUgPCAxIHx8XG4gICAgICBzLmVzdGltYXRlID4gOTkgfHxcbiAgICAgIHMuc2NyYXBNaW51dGVzID4gMTAwODAgfHxcbiAgICAgIChzLmZvY3VzTWludXRlcyAhPT0gbnVsbCAmJlxuICAgICAgICAocy5mb2N1c01pbnV0ZXMgPCAxIHx8IHMuZm9jdXNNaW51dGVzID4gMTgwKSkgfHxcbiAgICAgIHMudGFncy5sZW5ndGggPiAyMCB8fFxuICAgICAgcy50YWdzLnNvbWUoKHRhZykgPT4gQXJyYXkuZnJvbSh0YWcpLmxlbmd0aCA+IDQwKVxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2NUUwXHU2NTQ4XHU3Njg0XHU2QTIxXHU2NzdGXHU1RjYyXHU3MkI2XCIpO1xuICAgIH1cbiAgICBjb25zdCBzdWJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgaWYgKFxuICAgICAgcy5zdWJ0YXNrcy5sZW5ndGggPiAyMDAgfHxcbiAgICAgIHMuc3VidGFza3Muc29tZShcbiAgICAgICAgKHN1YikgPT5cbiAgICAgICAgICBzdWIuaWQubGVuZ3RoID09PSAwIHx8XG4gICAgICAgICAgc3Vicy5oYXMoc3ViLmlkKSB8fFxuICAgICAgICAgIHN1Yi50aXRsZS50cmltKCkubGVuZ3RoID09PSAwIHx8XG4gICAgICAgICAgQXJyYXkuZnJvbShzdWIudGl0bGUpLmxlbmd0aCA+IDIwMCxcbiAgICAgIClcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NjVFMFx1NjU0OFx1NzY4NFx1NkEyMVx1Njc3Rlx1NUI1MFx1NEVGQlx1NTJBMVwiKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBzdWIgb2Ygcy5zdWJ0YXNrcykgc3Vicy5hZGQoc3ViLmlkKTtcbiAgICBpZiAoXG4gICAgICAocy5wcm9qZWN0SWQgIT09IG51bGwgJiZcbiAgICAgICAgIWRhdGEucHJvamVjdHMuc29tZSgocCkgPT4gcC5pZCA9PT0gcy5wcm9qZWN0SWQpKSB8fFxuICAgICAgKHMuaGFiaXRJZCAhPT0gbnVsbCAmJiAhZGF0YS5oYWJpdHMuc29tZSgoaCkgPT4gaC5pZCA9PT0gcy5oYWJpdElkKSlcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NkEyMVx1Njc3Rlx1NUYxNVx1NzUyOFx1NEU4Nlx1NEUwRFx1NUI1OFx1NTcyOFx1NzY4NFx1NUJCOVx1NTY2OFwiKTtcbiAgICB9XG4gICAgY29uc3QgcHJpbnRpbmcgPSB0LnByaW50aW5nO1xuICAgIGlmIChwcmludGluZy5raW5kID09PSBcIm9uY2VcIikge1xuICAgICAgaWYgKFxuICAgICAgICBwcmludGluZy5kYXRlID09PSBudWxsIHx8XG4gICAgICAgICF2YWxpZERhdGUocHJpbnRpbmcuZGF0ZSkgfHxcbiAgICAgICAgKHByaW50aW5nLnRpbWUgIT09IG51bGwgJiYgIXZhbGlkVGltZShwcmludGluZy50aW1lKSlcbiAgICAgICkge1xuICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTY1RTBcdTY1NDhcdTc2ODRcdTRFMDBcdTZCMjFcdTUzNzBcdTUyMzdcdTY1RTVcdTY3MUZcdTYyMTZcdTY1RjZcdTk1RjRcIik7XG4gICAgICB9XG4gICAgICBpZiAocy5oYWJpdElkICE9PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NEU2MFx1NjBFRlx1NkEyMVx1Njc3Rlx1NUZDNVx1OTg3Qlx1OTFDRFx1NTkwRFx1NTM3MFx1NTIzN1wiKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHByaW50aW5nLmtpbmQgPT09IFwiY2FsZW5kYXJcIikge1xuICAgICAgaWYgKFxuICAgICAgICBwcmludGluZy5zbG90cy5sZW5ndGggPT09IDAgfHxcbiAgICAgICAgcHJpbnRpbmcuc2xvdHMubGVuZ3RoID4gNDkgfHxcbiAgICAgICAgcy5oYWJpdElkICE9PSBudWxsXG4gICAgICApIHtcbiAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU5NzVFXHU5MUNEXHU1OTBEXHU2NUU1XHU3QTBCXHU5NzAwXHU4OTgxIDFcdTIwMTM0OSBcdTRFMkFcdTY1RjZcdTZCQjVcdUZGMENcdTRFMERcdTgwRkRcdTVDNUVcdTRFOEVcdTRFNjBcdTYwRUZcdTdFQzRcIik7XG4gICAgICB9XG4gICAgICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICBjb25zdCB0aW1lcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgZm9yIChjb25zdCBzbG90IG9mIHByaW50aW5nLnNsb3RzKSB7XG4gICAgICAgIGNvbnN0IHRpbWVLZXkgPSBzbG90LnRpbWUgPz8gXCJudWxsXCI7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBzbG90LmRhdGVzLmxlbmd0aCA9PT0gMCB8fFxuICAgICAgICAgIHNsb3QuZGF0ZXMubGVuZ3RoID4gMzY2IHx8XG4gICAgICAgICAgKHNsb3QudGltZSAhPT0gbnVsbCAmJiAhdmFsaWRUaW1lKHNsb3QudGltZSkpIHx8XG4gICAgICAgICAgKHRpbWVzLmhhcyh0aW1lS2V5KSA/IHRydWUgOiAodGltZXMuYWRkKHRpbWVLZXkpLCBmYWxzZSkpIHx8XG4gICAgICAgICAgc2xvdC5kYXRlcy5zb21lKChkYXRlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSBgJHtkYXRlfXwke3RpbWVLZXl9YDtcbiAgICAgICAgICAgIC8vIFx1NEUwRSBSdXN0IFx1NEUwMFx1ODFGNFx1RkYxQVx1NjhDMFx1NjdFNVx1NTM3M1x1NjNEMlx1NTE2NVx1MjAxNFx1MjAxNFx1NTQwQ1x1NEUwMFx1NjVGNlx1NkJCNVx1NTE4NVx1NzY4NFx1OTFDRFx1NTkwRFx1NjVFNVx1NjcxRlx1NEU1Rlx1NEYxQVx1ODhBQlx1NjJEMlx1MzAwMlxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgIXZhbGlkRGF0ZShkYXRlKSB8fFxuICAgICAgICAgICAgICAoc2Vlbi5oYXMoa2V5KSA/IHRydWUgOiAoc2Vlbi5hZGQoa2V5KSwgZmFsc2UpKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KVxuICAgICAgICApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXG4gICAgICAgICAgICBcIlx1NjVFMFx1NjU0OFx1NjIxNlx1OTFDRFx1NTkwRFx1NzY4NFx1NjVFNVx1N0EwQlx1NjVGNlx1NkJCNVx1RkYwQ1x1OEJGN1x1NjI4QVx1NTQwQ1x1NEUwMFx1NUYwMFx1NTlDQlx1NjVGNlx1OTVGNFx1NzY4NFx1NjVFNVx1NjcxRlx1NTQwOFx1NUU3NlwiLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChzZWVuLnNpemUgPiAzNjYpIHtcbiAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU0RTAwXHU2QjIxXHU2NUU1XHU3QTBCXHU4ODY4XHU2NzAwXHU1OTFBIDM2NiBcdTk4NzlcIik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChwcmludGluZy5zbG90cy5sZW5ndGggPT09IDAgfHwgcHJpbnRpbmcuc2xvdHMubGVuZ3RoID4gNDkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2QkNGXHU1NDY4XHU1RkFBXHU3M0FGXHU5NzAwXHU4OTgxIDFcdTIwMTM0OSBcdTRFMkFcdTY1RjZcdTZCQjVcIik7XG4gICAgICB9XG4gICAgICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICBmb3IgKGNvbnN0IHNsb3Qgb2YgcHJpbnRpbmcuc2xvdHMpIHtcbiAgICAgICAgY29uc3QgdW5pcXVlID0gbmV3IFNldChzbG90LmRheXMpO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgc2xvdC5kYXlzLmxlbmd0aCA9PT0gMCB8fFxuICAgICAgICAgIHNsb3QuZGF5cy5sZW5ndGggPiA3IHx8XG4gICAgICAgICAgdW5pcXVlLnNpemUgIT09IHNsb3QuZGF5cy5sZW5ndGggfHxcbiAgICAgICAgICBzbG90LmRheXMuc29tZSgoZCkgPT4gZCA8IDEgfHwgZCA+IDcpIHx8XG4gICAgICAgICAgKHNsb3QudGltZSAhPT0gbnVsbCAmJiAhdmFsaWRUaW1lKHNsb3QudGltZSkpIHx8XG4gICAgICAgICAgKHMuaGFiaXRJZCAhPT0gbnVsbCAmJiBzbG90LnRpbWUgPT09IG51bGwpIHx8XG4gICAgICAgICAgc2xvdC5kYXlzLnNvbWUoKGRheSkgPT4gc2Vlbi5oYXMoYCR7ZGF5fXwke3Nsb3QudGltZSA/PyBcIm51bGxcIn1gKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2NUUwXHU2NTQ4XHU2MjE2XHU5MUNEXHU1OTBEXHU3Njg0XHU1NDY4XHU2NzFGXHU2NUY2XHU2QkI1XCIpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgZGF5IG9mIHNsb3QuZGF5cykgc2Vlbi5hZGQoYCR7ZGF5fXwke3Nsb3QudGltZSA/PyBcIm51bGxcIn1gKTtcbiAgICAgIH1cbiAgICAgIGlmIChcbiAgICAgICAgcHJpbnRpbmcuc2xvdHMuc29tZSgocykgPT4gcy50aW1lICE9PSBudWxsKSAmJlxuICAgICAgICBwcmludGluZy5zbG90cy5zb21lKChzKSA9PiBzLnRpbWUgPT09IG51bGwpXG4gICAgICApIHtcbiAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU0RTAwXHU0RTJBXHU1NDY4XHU2NzFGXHU0RTBEXHU4MEZEXHU2REY3XHU3NTI4XHU1QjlBXHU2NUY2XHU0RTBFXHU0RTBEXHU1QjlBXHU2NUY2XHU1MzU1XHU1MTQzXCIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBjb25zdCBwcmludHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgZm9yIChjb25zdCBwIG9mIGRhdGEucHJpbnRzKSB7XG4gICAgaWYgKFxuICAgICAgIWlkcy5oYXMocC50ZW1wbGF0ZUlkKSB8fFxuICAgICAgcC5kYXRlID09PSBudWxsIHx8XG4gICAgICAhdmFsaWREYXRlKHAuZGF0ZSkgfHxcbiAgICAgIHByaW50cy5oYXMoYCR7cC50ZW1wbGF0ZUlkfXwke3AuZGF0ZX1gKVxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2NUUwXHU2NTQ4XHU2MjE2XHU5MUNEXHU1OTBEXHU3Njg0XHU1MzcwXHU1MjM3XHU4QkIwXHU1RjU1XCIpO1xuICAgIH1cbiAgICBwcmludHMuYWRkKGAke3AudGVtcGxhdGVJZH18JHtwLmRhdGV9YCk7XG4gIH1cbiAgaWYgKGRhdGEudGFza3Muc29tZSgodCkgPT4gdC50ZW1wbGF0ZUlkICE9PSBudWxsICYmICFpZHMuaGFzKHQudGVtcGxhdGVJZCkpKSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU1QjlFXHU0RjhCXHU1RjE1XHU3NTI4XHU0RTg2XHU0RTBEXHU1QjU4XHU1NzI4XHU3Njg0XHU2QTIxXHU2NzdGXCIpO1xuICB9XG59XG5cbi8qKiBcdTRFMzRcdTY1RjZcdUZGMDhcdTRFMERcdTc1NTlcdTZBMjFcdTY3N0ZcdUZGMDlcdTYyNzlcdTkxQ0ZcdTUzNzBcdTUyMzdcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBwcmludEluc3RhbmNlcyhcbiAgZGF0YTogQXBwRGF0YSxcbiAgc2hhcGU6IFNoYXBlLFxuICBwcmludGluZzogUHJpbnRpbmcsXG4gIGF0OiBudW1iZXIsXG4pOiB2b2lkIHtcbiAgaWYgKHByaW50aW5nLmtpbmQgPT09IFwid2Vla2x5XCIpIHtcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTVGQUFcdTczQUZcdTg5QzRcdTUyMTlcdTk3MDBcdTg5ODFcdTRGRERcdTc1NTlcdTRFM0FcdTZBMjFcdTY3N0ZcIik7XG4gIH1cbiAgY29uc3QgZGF0ZXM6IChzdHJpbmcgfCBudWxsKVtdID1cbiAgICBwcmludGluZy5raW5kID09PSBcIm9uY2VcIlxuICAgICAgPyBbcHJpbnRpbmcuZGF0ZV1cbiAgICAgIDogWy4uLm5ldyBTZXQocHJpbnRpbmcuc2xvdHMuZmxhdE1hcCgocykgPT4gcy5kYXRlcykpXS5zb3J0KCk7XG4gIGNvbnN0IHRlbXBsYXRlSWQgPSBpZCgpO1xuICBkYXRhLnRlbXBsYXRlcy5wdXNoKHtcbiAgICBpZDogdGVtcGxhdGVJZCxcbiAgICBzaGFwZSxcbiAgICBwcmludGluZyxcbiAgICBhdXRvbWF0aWM6IGZhbHNlLFxuICAgIHByaW50QWhlYWREYXlzOiAwLFxuICB9KTtcbiAgZGF0YS52YWxpZGF0ZSgpO1xuICBwcmludFRlbXBsYXRlKGRhdGEsIHRlbXBsYXRlSWQsIGRhdGVzLCBhdCk7XG4gIGRlbGV0ZVRlbXBsYXRlKGRhdGEsIHRlbXBsYXRlSWQpO1xufVxuXG4vKiogXHU0RkREXHU1QjU4XHU2QTIxXHU2NzdGXHVGRjFBXHU1NDY4XHU2NzFGXHU1MTY4XHU1QjlBXHU2NUY2XHU3Njg0XHU2NjZFXHU5MDFBXHU2QTIxXHU2NzdGXHU4MUVBXHU1MkE4XHU1RUZBXHU3QUNCXHU0RTYwXHU2MEVGXHU3RUM0XHVGRjA4XHU1NDBDXHU1NDBEXHU1OTBEXHU3NTI4XHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gc2F2ZVRlbXBsYXRlKGRhdGE6IEFwcERhdGEsIHRlbXBsYXRlOiBUZW1wbGF0ZSk6IHZvaWQge1xuICB0ZW1wbGF0ZS5zaGFwZS50aXRsZSA9IHRlbXBsYXRlLnNoYXBlLnRpdGxlLnRyaW0oKTtcbiAgaWYgKFxuICAgIHRlbXBsYXRlLnNoYXBlLmhhYml0SWQgPT09IG51bGwgJiZcbiAgICB0ZW1wbGF0ZS5wcmludGluZy5raW5kID09PSBcIndlZWtseVwiICYmXG4gICAgdGVtcGxhdGUucHJpbnRpbmcuc2xvdHMuZXZlcnkoKHMpID0+IHMudGltZSAhPT0gbnVsbClcbiAgKSB7XG4gICAgY29uc3QgZXhpc3RpbmdIYWJpdCA9XG4gICAgICBkYXRhLnRlbXBsYXRlcy5maW5kKCh0KSA9PiB0LmlkID09PSB0ZW1wbGF0ZS5pZCk/LnNoYXBlLmhhYml0SWQgPz8gbnVsbDtcbiAgICBjb25zdCBoaWQgPSBleGlzdGluZ0hhYml0ID8/IGlkKCk7XG4gICAgaWYgKCFkYXRhLmhhYml0cy5zb21lKChoKSA9PiBoLmlkID09PSBoaWQpKSB7XG4gICAgICBkYXRhLmhhYml0cy5wdXNoKHtcbiAgICAgICAgaWQ6IGhpZCxcbiAgICAgICAgbmFtZTogQXJyYXkuZnJvbSh0ZW1wbGF0ZS5zaGFwZS50aXRsZSkuc2xpY2UoMCwgNDApLmpvaW4oXCJcIiksXG4gICAgICB9KTtcbiAgICB9XG4gICAgdGVtcGxhdGUuc2hhcGUuaGFiaXRJZCA9IGhpZDtcbiAgfVxuICBjb25zdCBpbmRleCA9IGRhdGEudGVtcGxhdGVzLmZpbmRJbmRleCgodCkgPT4gdC5pZCA9PT0gdGVtcGxhdGUuaWQpO1xuICBpZiAoaW5kZXggPj0gMCkge1xuICAgIGRhdGEudGVtcGxhdGVzW2luZGV4XSA9IHRlbXBsYXRlO1xuICB9IGVsc2Uge1xuICAgIGRhdGEudGVtcGxhdGVzLnB1c2godGVtcGxhdGUpO1xuICB9XG59XG5cbi8qKiBcdTUyMjBcdTk2NjRcdTZBMjFcdTY3N0ZcdTRGRERcdTc1NTlcdTVCOUVcdTRGOEJcdTVFNzZcdTZFMDUgdGVtcGxhdGVJZFx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlbGV0ZVRlbXBsYXRlKGRhdGE6IEFwcERhdGEsIGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgZGF0YS50ZW1wbGF0ZXMgPSBkYXRhLnRlbXBsYXRlcy5maWx0ZXIoKHQpID0+IHQuaWQgIT09IGlkKTtcbiAgZGF0YS5wcmludHMgPSBkYXRhLnByaW50cy5maWx0ZXIoKHApID0+IHAudGVtcGxhdGVJZCAhPT0gaWQpO1xuICBmb3IgKGNvbnN0IHRhc2sgb2YgZGF0YS50YXNrcykge1xuICAgIGlmICh0YXNrLnRlbXBsYXRlSWQgPT09IGlkKSB0YXNrLnRlbXBsYXRlSWQgPSBudWxsO1xuICB9XG59XG5cbi8qKiBcdTYyNEJcdTUyQThcdTUzNzBcdTUyMzdcdUZGMUFcdTU0NjhcdTY3MUZcdTg5QzRcdTUyMTlcdTYzMDlcdTk1MUFcdTVCOUFcdTY1RTVcdTY3MUZcdTVDNTVcdTVGMDBcdTY1NzRcdTU0NjhcdUZGMUJcdTU0MENcdTZBMjFcdTY3N0ZcdTU0MENcdTY1RTVcdTY3MUZcdTk2MzJcdTkxQ0RcdUZGMUJcdTRFMDBcdTU5MjlcdTUxODVcdTRGNUNcdTVFOUZcdTY1RjZcdTZCQjVcdThERjNcdThGQzdcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBwcmludFRlbXBsYXRlKFxuICBkYXRhOiBBcHBEYXRhLFxuICBpZDogc3RyaW5nLFxuICBkYXRlczogKHN0cmluZyB8IG51bGwpW10sXG4gIGF0OiBudW1iZXIsXG4pOiB2b2lkIHtcbiAgaWYgKGRhdGVzLmxlbmd0aCA9PT0gMCB8fCBkYXRlcy5sZW5ndGggPiAzNjYpIHtcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTZCQ0ZcdTZCMjFcdTUzNzBcdTUyMzdcdTk3MDBcdTg5ODEgMVx1MjAxMzM2NiBcdTRFMkFcdTY1RTVcdTY3MUZcIik7XG4gIH1cbiAgY29uc3QgdGVtcGxhdGVJbmRleCA9IGRhdGEudGVtcGxhdGVzLmZpbmRJbmRleCgodCkgPT4gdC5pZCA9PT0gaWQpO1xuICBpZiAodGVtcGxhdGVJbmRleCA8IDApIHtcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTZBMjFcdTY3N0ZcdTRFMERcdTVCNThcdTU3MjhcIik7XG4gIH1cbiAgY29uc3QgdGVtcGxhdGUgPSBkYXRhLnRlbXBsYXRlc1t0ZW1wbGF0ZUluZGV4XSE7XG4gIGxldCByZXNvbHZlZDogKHN0cmluZyB8IG51bGwpW107XG4gIGlmICh0ZW1wbGF0ZS5wcmludGluZy5raW5kID09PSBcIndlZWtseVwiKSB7XG4gICAgY29uc3QgZGF5cyA9IFtcbiAgICAgIC4uLm5ldyBTZXQodGVtcGxhdGUucHJpbnRpbmcuc2xvdHMuZmxhdE1hcCgocykgPT4gcy5kYXlzKSksXG4gICAgXS5zb3J0KChhLCBiKSA9PiBhIC0gYik7XG4gICAgY29uc3QgZXhwYW5kZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBmb3IgKGNvbnN0IGRhdGUgb2YgZGF0ZXMpIHtcbiAgICAgIGlmIChkYXRlID09PSBudWxsKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTU0NjhcdTY3MUZcdTUzNzBcdTUyMzdcdTk3MDBcdTg5ODFcdTY1RTVcdTY3MUZcIik7XG4gICAgICBpZiAoIXZhbGlkRGF0ZShkYXRlKSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2NUUwXHU2NTQ4XHU3Njg0XHU1NDY4XHU2NzFGXHU2NUU1XHU2NzFGXCIpO1xuICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VEYXRlKGRhdGUpITtcbiAgICAgIGNvbnN0IG1vbmRheSA9IHdlZWtTdGFydChwYXJzZWQpO1xuICAgICAgZm9yIChjb25zdCBkYXkgb2YgZGF5cykge1xuICAgICAgICBjb25zdCBkID0gYWRkRGF5cyhtb25kYXksIGRheSAtIDEpO1xuICAgICAgICBleHBhbmRlZC5hZGQoXG4gICAgICAgICAgYCR7ZC55ZWFyfS0ke1N0cmluZyhkLm1vbnRoKS5wYWRTdGFydCgyLCBcIjBcIil9LSR7U3RyaW5nKGQuZGF5KS5wYWRTdGFydCgyLCBcIjBcIil9YCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGV4cGFuZGVkLnNpemUgPiAzNjYpIHtcbiAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NEUwMFx1NkIyMVx1NTM3MFx1NTIzN1x1ODMwM1x1NTZGNFx1OEZDN1x1NTkyN1x1RkYwQ1x1OEJGN1x1NjJDNlx1NTIwNlx1NTQ2OFx1NjcxRlwiKTtcbiAgICB9XG4gICAgcmVzb2x2ZWQgPSBbLi4uZXhwYW5kZWRdLnNvcnQoKTtcbiAgfSBlbHNlIHtcbiAgICByZXNvbHZlZCA9IFsuLi5kYXRlc107XG4gIH1cbiAgLy8gXHU1MTQ4XHU1QjhDXHU2NTc0XHU4OUUzXHU2NzkwXHU1NDY4XHU2NzFGL1x1NjVFNVx1N0EwQlx1NjI3OVx1NkIyMVx1RkYwQ1x1NTE4RFx1NTJBOFx1NzJCNlx1NjAwMVx1RkYwOFx1NTM5Rlx1NUI1MFx1RkYwOVx1MzAwMlxuICBjb25zdCBiYXRjaGVzOiB7IGRhdGU6IHN0cmluZyB8IG51bGw7IHRpbWVzOiAoc3RyaW5nIHwgbnVsbClbXSB9W10gPVxuICAgIHJlc29sdmVkLm1hcCgoZGF0ZSkgPT4gKHtcbiAgICAgIGRhdGUsXG4gICAgICB0aW1lczogdGVtcGxhdGVUaW1lcyh0ZW1wbGF0ZSwgZGF0ZSksXG4gICAgfSkpO1xuICBjb25zdCBwcmludGVkRGF0ZXMgPSBuZXcgU2V0KFxuICAgIGRhdGEucHJpbnRzLmZpbHRlcigocCkgPT4gcC50ZW1wbGF0ZUlkID09PSBpZCkubWFwKChwKSA9PiBwLmRhdGUgYXMgc3RyaW5nKSxcbiAgKTtcbiAgZm9yIChjb25zdCB7IGRhdGUsIHRpbWVzIH0gb2YgYmF0Y2hlcykge1xuICAgIGlmIChwcmludGVkRGF0ZXMuaGFzKGRhdGUgYXMgc3RyaW5nKSkgY29udGludWU7XG4gICAgbGV0IHByaW50ZWQgPSBmYWxzZTtcbiAgICBmb3IgKGNvbnN0IHRpbWUgb2YgdGltZXMpIHtcbiAgICAgIGNvbnN0IHRhc2sgPSB0ZW1wbGF0ZUluc3RhbmNlKHRlbXBsYXRlLCBkYXRlLCB0aW1lLCBhdCk7XG4gICAgICBpZiAocHJpbnRpbmdFeHBpcmVkKGRhdGEsIHRhc2ssIGF0KSkgY29udGludWU7XG4gICAgICBkYXRhLnRhc2tzLnB1c2godGFzayk7XG4gICAgICBwcmludGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgLy8gXHU0RTAwXHU1OTI5XHU3Njg0XHU2Mjc5XHU2QjIxXHU0RTAwXHU2NUU2XHU0RUE3XHU3NTFGXHU1QjlFXHU0RjhCXHU1MzczXHU4QkIwXHU4RDI2XHVGRjFBXHU3RjE2XHU4RjkxL1x1NTIyMFx1OTY2NFx1NEUwRFx1NUY5N1x1OTc1OVx1OUVEOFx1ODg2NVx1NkVFMVx1NUY1M1x1NTkyOVx1NTM4Nlx1NTNGMlx1MzAwMlxuICAgIGlmIChwcmludGVkKSB7XG4gICAgICBwcmludGVkRGF0ZXMuYWRkKGRhdGUgYXMgc3RyaW5nKTtcbiAgICAgIGRhdGEucHJpbnRzLnB1c2goeyB0ZW1wbGF0ZUlkOiBpZCwgZGF0ZSB9KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFx1NURGMlx1OEZDN1x1OTc1OVx1NjAwMVx1NjVGNlx1OTVGNFx1N0E5N1x1NTNFM1x1NzY4NFx1NUI5QVx1NjVGNlx1NUI5RVx1NEY4Qlx1OERGM1x1OEZDN1x1NTM3MFx1NTIzN1x1MzAwMiAqL1xuZnVuY3Rpb24gcHJpbnRpbmdFeHBpcmVkKGRhdGE6IEFwcERhdGEsIHRhc2s6IFRhc2ssIGF0OiBudW1iZXIpOiBib29sZWFuIHtcbiAgaWYgKHRhc2sucmVtaW5kZXJUaW1lID09PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gIGlmICh0YXNrLmR1ZURhdGUgPT09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgY29uc3QgdG9kYXkgPSBkYXRlQXQoYXQpO1xuICBpZiAodGFzay5kdWVEYXRlIDwgdG9kYXkpIHJldHVybiB0cnVlO1xuICBpZiAodGFzay5kdWVEYXRlID4gdG9kYXkpIHJldHVybiBmYWxzZTtcbiAgY29uc3Qgc3RhcnQgPSBtaW51dGVzT2YodGFzay5yZW1pbmRlclRpbWUpITtcbiAgY29uc3QgZ3JhY2UgPSBpc0hhYml0KHRhc2spID8gMCA6IHRhc2suc2NyYXBNaW51dGVzO1xuICBjb25zdCBlbmQgPSBzdGFydCArIHdpbmRvd01pbnV0ZXModGFzaywgZGF0YS5zZXR0aW5ncykgKyBncmFjZTtcbiAgcmV0dXJuIHNlY29uZHNPZkRheShhdCkgPj0gZW5kICogNjA7XG59XG5cbi8qKiBcdTY2M0VcdTVGMEZcdTVGNjJcdTcyQjZcdTU0MENcdTZCNjVcdUZGMUFcdTUzRUFcdTU0MENcdTZCNjVcdTY3MkFcdTVCOENcdTYyMTBcdTMwMDFcdTY3MkFcdTRGNUNcdTVFOUZcdTVCOUVcdTRGOEJcdTc2ODRcdTVGNjJcdTcyQjZcdUZGMUJcdTY1RTVcdTY3MUYvXHU3QkExXHU4Rjk2L1x1NUI4Q1x1NjIxMFx1NzJCNlx1NjAwMVx1NEUwRFx1NTJBOFx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN5bmNUZW1wbGF0ZShkYXRhOiBBcHBEYXRhLCBpZDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHRlbXBsYXRlID0gZGF0YS50ZW1wbGF0ZXMuZmluZCgodCkgPT4gdC5pZCA9PT0gaWQpO1xuICBpZiAodGVtcGxhdGUgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NkEyMVx1Njc3Rlx1NEUwRFx1NUI1OFx1NTcyOFwiKTtcbiAgfVxuICBjb25zdCB2b2lkSWRzID0gbmV3IFNldChcbiAgICBkYXRhLnRhc2tzLmZpbHRlcigodCkgPT4gdGFza0lzVm9pZCh0KSkubWFwKCh0KSA9PiB0LmlkKSxcbiAgKTtcbiAgZm9yIChjb25zdCB0YXNrIG9mIGRhdGEudGFza3MpIHtcbiAgICBpZiAoIXZvaWRJZHMuaGFzKHRhc2suaWQpICYmICF0YXNrLmNvbXBsZXRlZCAmJiB0YXNrLnRlbXBsYXRlSWQgPT09IGlkKSB7XG4gICAgICBjb25zdCBzaGFwZSA9IHsgLi4udGVtcGxhdGUuc2hhcGUgfTtcbiAgICAgIHNoYXBlLmhhYml0SWQgPSB0YXNrLmhhYml0SWQ7XG4gICAgICBjb3B5U2hhcGUoc2hhcGUsIHRhc2spO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGFza0lzVm9pZCh0YXNrOiBUYXNrKTogYm9vbGVhbiB7XG4gIHJldHVybiAhdGFzay5jb21wbGV0ZWQgJiYgdGFzay5yZW1pbmRlclRpbWUgIT09IG51bGwgJiYgdGFzay5yZW1pbmRlckV4cGlyZWQ7XG59XG5cbi8qKiBcdTgxRUFcdTUyQThcdTZFREFcdTUyQThcdTk4ODRcdTUzNzBcdUZGMUFcdTg4NjVcdTlGNTBcdTMwMENcdTRFQ0FcdTU5MjkgKyBcdTk4ODRcdTUzNzBcdTU5MjlcdTY1NzBcdTMwMERcdTgzMDNcdTU2RjRcdTUxODVcdTc2ODRcdTkwNTdcdTZGMEZcdUZGMENcdTdBMEJcdTVFOEZcdTUxNzNcdTk1RURcdTY3MUZcdTk1RjRcdTRFMERcdTYyNjdcdTg4NENcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRlcmlhbGl6ZVRlbXBsYXRlcyhkYXRhOiBBcHBEYXRhLCBhdDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IHRvZGF5ID0gcGFyc2VEYXRlKGRhdGVBdChhdCkpITtcbiAgY29uc3QgcHJpbnRlZCA9IG5ldyBTZXQoXG4gICAgZGF0YS5wcmludHMubWFwKChwKSA9PiBgJHtwLnRlbXBsYXRlSWR9fCR7cC5kYXRlID8/IFwibnVsbFwifWApLFxuICApO1xuICBjb25zdCByZXF1ZXN0czogeyBpZDogc3RyaW5nOyBkYXRlczogKHN0cmluZyB8IG51bGwpW10gfVtdID0gW107XG4gIGZvciAoY29uc3QgdGVtcGxhdGUgb2YgZGF0YS50ZW1wbGF0ZXMpIHtcbiAgICBpZiAoIXRlbXBsYXRlLmF1dG9tYXRpYykgY29udGludWU7XG4gICAgY29uc3QgZW5kID0gYWRkRGF5cyh0b2RheSwgdGVtcGxhdGUucHJpbnRBaGVhZERheXMpO1xuICAgIGNvbnN0IGVuZFN0ciA9IGAke2VuZC55ZWFyfS0ke1N0cmluZyhlbmQubW9udGgpLnBhZFN0YXJ0KDIsIFwiMFwiKX0tJHtTdHJpbmcoZW5kLmRheSkucGFkU3RhcnQoMiwgXCIwXCIpfWA7XG4gICAgbGV0IGRhdGVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IHByaW50aW5nID0gdGVtcGxhdGUucHJpbnRpbmc7XG4gICAgaWYgKHByaW50aW5nLmtpbmQgPT09IFwib25jZVwiKSB7XG4gICAgICBpZiAocHJpbnRpbmcuZGF0ZSAhPT0gbnVsbCAmJiBwcmludGluZy5kYXRlIDw9IGVuZFN0cilcbiAgICAgICAgZGF0ZXMgPSBbcHJpbnRpbmcuZGF0ZV07XG4gICAgfSBlbHNlIGlmIChwcmludGluZy5raW5kID09PSBcImNhbGVuZGFyXCIpIHtcbiAgICAgIGRhdGVzID0gW1xuICAgICAgICAuLi5uZXcgU2V0KFxuICAgICAgICAgIHByaW50aW5nLnNsb3RzLmZsYXRNYXAoKHMpID0+IHMuZGF0ZXMpLmZpbHRlcigoZCkgPT4gZCA8PSBlbmRTdHIpLFxuICAgICAgICApLFxuICAgICAgXS5zb3J0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGRheXMgPSBbLi4ubmV3IFNldChwcmludGluZy5zbG90cy5mbGF0TWFwKChzKSA9PiBzLmRheXMpKV0uc29ydChcbiAgICAgICAgKGEsIGIpID0+IGEgLSBiLFxuICAgICAgKTtcbiAgICAgIGxldCBtb25kYXkgPSB3ZWVrU3RhcnQodG9kYXkpO1xuICAgICAgY29uc3QgbGFzdCA9IHdlZWtTdGFydChlbmQpO1xuICAgICAgd2hpbGUgKGNvbXBhcmVJc28obW9uZGF5KSA8PSBjb21wYXJlSXNvKGxhc3QpKSB7XG4gICAgICAgIGZvciAoY29uc3QgZGF5IG9mIGRheXMpIHtcbiAgICAgICAgICBjb25zdCBkID0gYWRkRGF5cyhtb25kYXksIGRheSAtIDEpO1xuICAgICAgICAgIGRhdGVzLnB1c2goXG4gICAgICAgICAgICBgJHtkLnllYXJ9LSR7U3RyaW5nKGQubW9udGgpLnBhZFN0YXJ0KDIsIFwiMFwiKX0tJHtTdHJpbmcoZC5kYXkpLnBhZFN0YXJ0KDIsIFwiMFwiKX1gLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgbW9uZGF5ID0gYWRkRGF5cyhtb25kYXksIDcpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBtaXNzaW5nID0gZGF0ZXMuZmlsdGVyKChkKSA9PiAhcHJpbnRlZC5oYXMoYCR7dGVtcGxhdGUuaWR9fCR7ZH1gKSk7XG4gICAgaWYgKG1pc3NpbmcubGVuZ3RoID4gMCkge1xuICAgICAgcmVxdWVzdHMucHVzaCh7IGlkOiB0ZW1wbGF0ZS5pZCwgZGF0ZXM6IG1pc3NpbmcgfSk7XG4gICAgfVxuICB9XG4gIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gIGZvciAoY29uc3QgeyBpZDogdGVtcGxhdGVJZCwgZGF0ZXMgfSBvZiByZXF1ZXN0cykge1xuICAgIC8vIFx1NTM3MFx1NTIzN1x1NTM5Rlx1NUI1MFx1RkYxQVx1OEZCRVx1NTIzMFx1NUJCOVx1OTFDRlx1NEUwQVx1OTY1MFx1NjVGNlx1NjU3NFx1NTQ2OFx1NjcxRlx1NTE2OFx1NzU1OVx1NjIxNlx1NTE2OFx1NUYwM1x1MzAwMlxuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGNsb25lKGRhdGEpO1xuICAgIHRyeSB7XG4gICAgICBwcmludFRlbXBsYXRlKGNhbmRpZGF0ZSwgdGVtcGxhdGVJZCwgZGF0ZXMsIGF0KTtcbiAgICAgIGlmIChjYW5kaWRhdGUudGFza3MubGVuZ3RoICE9PSBkYXRhLnRhc2tzLmxlbmd0aCkge1xuICAgICAgICBjYW5kaWRhdGUudmFsaWRhdGUoKTtcbiAgICAgICAgcmVwbGFjZUFwcERhdGEoZGF0YSwgY2FuZGlkYXRlKTtcbiAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBcdTRGRERcdTc1NTlcdTUzOUZcdTcyQjZcdTYwMDFcdTMwMDJcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNoYW5nZWQ7XG59XG5cbmZ1bmN0aW9uIGNvbXBhcmVJc28oZGF0ZToge1xuICB5ZWFyOiBudW1iZXI7XG4gIG1vbnRoOiBudW1iZXI7XG4gIGRheTogbnVtYmVyO1xufSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtkYXRlLnllYXJ9LSR7U3RyaW5nKGRhdGUubW9udGgpLnBhZFN0YXJ0KDIsIFwiMFwiKX0tJHtTdHJpbmcoZGF0ZS5kYXkpLnBhZFN0YXJ0KDIsIFwiMFwiKX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVwbGFjZUFwcERhdGEodGFyZ2V0OiBBcHBEYXRhLCBzb3VyY2U6IEFwcERhdGEpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoc291cmNlKSkge1xuICAgICh0YXJnZXQgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilba2V5XSA9IChcbiAgICAgIHNvdXJjZSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4gICAgKVtrZXldO1xuICB9XG59XG5cbi8qKiBcdThCQTFcdTUyMTIvXHU4RjkzXHU1MTY1XHU4RkI5XHU3NTRDXHVGRjFBXHU2MjhBXHU2NUU3XHU1RjBGXHU5MUNEXHU1OTBEXHU4OUM0XHU1MjE5XHU4RjZDXHU2MjEwXHU1MzcwXHU1MjM3XHU2QTIxXHU1NzhCXHVGRjBDXHU0RTBEXHU3RUQ5XHU1QjlFXHU0RjhCXHU2MzAyXHU4OUM0XHU1MjE5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gZnJvbVRhc2soXG4gIHRhc2s6IFRhc2ssXG4gIHJlcGVhdDogXCJub25lXCIgfCBcImRhaWx5XCIgfCBcIndlZWtkYXlzXCIgfCBcIndlZWtseVwiLFxuICBhdDogbnVtYmVyLFxuKTogVGVtcGxhdGUge1xuICBjb25zdCBkYXRlID0gdGFzay5kdWVEYXRlID8/IGRhdGVBdChhdCk7XG4gIGNvbnN0IHdlZWtkYXkgPSAoKCkgPT4ge1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlRGF0ZShkYXRlKTtcbiAgICByZXR1cm4gcGFyc2VkID09PSBudWxsID8gMSA6IHdlZWtkYXlNb25kYXkocGFyc2VkKTtcbiAgfSkoKTtcbiAgY29uc3QgZGF5cyA9XG4gICAgcmVwZWF0ID09PSBcImRhaWx5XCJcbiAgICAgID8gWzEsIDIsIDMsIDQsIDUsIDYsIDddXG4gICAgICA6IHJlcGVhdCA9PT0gXCJ3ZWVrZGF5c1wiXG4gICAgICAgID8gWzEsIDIsIDMsIDQsIDVdXG4gICAgICAgIDogW3dlZWtkYXldO1xuICByZXR1cm4ge1xuICAgIGlkOiBpZCgpLFxuICAgIGF1dG9tYXRpYzogdHJ1ZSxcbiAgICBwcmludEFoZWFkRGF5czogMCxcbiAgICBwcmludGluZzogeyBraW5kOiBcIndlZWtseVwiLCBzbG90czogW3sgZGF5cywgdGltZTogdGFzay5yZW1pbmRlclRpbWUgfV0gfSxcbiAgICBzaGFwZToge1xuICAgICAgdGl0bGU6IHRhc2sudGl0bGUsXG4gICAgICBub3RlczogdGFzay5ub3RlcyxcbiAgICAgIHByb2plY3RJZDogdGFzay5wcm9qZWN0SWQsXG4gICAgICBoYWJpdElkOiB0YXNrLmhhYml0SWQsXG4gICAgICBmb2N1c01pbnV0ZXM6IHRhc2suZm9jdXNNaW51dGVzLFxuICAgICAgc2NyYXBNaW51dGVzOiB0YXNrLnNjcmFwTWludXRlcyxcbiAgICAgIHByaW9yaXR5OiB0YXNrLnByaW9yaXR5LFxuICAgICAgZXN0aW1hdGU6IHRhc2suZXN0aW1hdGUsXG4gICAgICB0YWdzOiBbLi4udGFzay50YWdzXSxcbiAgICAgIHN1YnRhc2tzOiB0YXNrLnN1YnRhc2tzLm1hcCgocykgPT4gKHsgaWQ6IHMuaWQsIHRpdGxlOiBzLnRpdGxlIH0pKSxcbiAgICB9LFxuICB9O1xufVxuIiwgIi8vISBcdTVCNjZcdTYwQzVcdThCQzFcdTYzNkVcdUZGMUFcdTVERjJcdTVCOENcdTYyMTBcdTRFRkJcdTUyQTFcdTVGRUJcdTcxNjdcdTMwMDFcdTY3NjVcdTZFOTBcdTUzRUZcdTVCQTFcdThCQTFcdTRFMTRcdTRFMERcdTUzRUZcdTg5ODZcdTUxOTlcdTc2ODRcdThGREJcdTVFQTZcdTUzODZcdTUzRjJcdTMwMDFcdThCQTJcdTZCNjNcdTY4QzBcdTY3RTVcdUZGMENcbi8vISBcdTYzMDlcdTYzRDBcdTRFQTQvXHU2Mjc5XHU2NTM5L1x1OEJBMlx1NkI2M1x1N0QyMlx1NUYxNVx1OEJBMVx1N0I5N1x1NTJBOFx1NjAwMVx1NUI2Nlx1NjBDNVx1NjQ1OFx1ODk4MVx1NTNDQVx1NjM4Q1x1NjNFMS9cdThCQTFcdTY1RjYvXHU4QkEyXHU2QjYzL1x1NTkwRFx1NkQ0Qlx1NTIwNlx1NUM0Mlx1MzAwMlxuLy8hIFx1NUJGOVx1NUU5NCBjcmF0ZXMvY29yZS9zcmMvbGVhcm5pbmcucnNcdTMwMDJcblxuaW1wb3J0IHsgQXBwRXJyb3IsIGVuc3VyZSwgcmVxdWlyZSB9IGZyb20gXCIuL2Vycm9yc1wiO1xuaW1wb3J0IHtcbiAgYXNBcnJheSxcbiAgYXNCb29sLFxuICBhc0ludCxcbiAgYXNPcHQsXG4gIGFzU3RyLFxuICBmaWVsZCxcbiAgaXNPYmplY3QsXG4gIG9uZU9mLFxuICByZWplY3RVbmtub3duLFxuICByZXF1aXJlZEZpZWxkLFxufSBmcm9tIFwiLi9qc29uXCI7XG5pbXBvcnQgdHlwZSB7IEVkdWNhdGlvbiB9IGZyb20gXCIuL2VkdWNhdGlvblwiO1xuaW1wb3J0IHR5cGUgeyBBcHBEYXRhIH0gZnJvbSBcIi4vbGliXCI7XG5pbXBvcnQgdHlwZSB7XG4gIEFzc2Vzc21lbnQsXG4gIENvbXBsZXRlZFN0dWR5VGFzayxcbiAgQ29ycmVjdGlvbixcbiAgR3JhZGUsXG4gIExlc3NvbixcbiAgUHJvZ3Jlc3NSZWNvcmQsXG4gIFJldmlldyxcbiAgU3VibWlzc2lvbixcbn0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IGF0TG9jYWxEYXRlU3RyaW5nLCBkYXRlQXQgfSBmcm9tIFwiLi90aW1lXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNvbXBsZXRlZFN0dWR5VGFzayhyYXc6IHVua25vd24pOiBDb21wbGV0ZWRTdHVkeVRhc2sge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NURGMlx1NUI4Q1x1NjIxMFx1NUI2Nlx1NEU2MFx1NEVGQlx1NTJBMVx1NUZFQlx1NzE2N1x1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihcbiAgICByYXcsXG4gICAgW1wiaWRcIiwgXCJwcm9qZWN0SWRcIiwgXCJ0aXRsZVwiLCBcIm5vdGVzXCIsIFwidG9waWNzXCIsIFwiY29tcGxldGVkQXRcIl0sXG4gICAgXCJcdTVERjJcdTVCOENcdTYyMTBcdTVCNjZcdTRFNjBcdTRFRkJcdTUyQTFcdTVGRUJcdTcxNjdcIixcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTVERjJcdTVCOENcdTYyMTBcdTVCNjZcdTRFNjBcdTRFRkJcdTUyQTFcdTVGRUJcdTcxNjdcIiwgYXNTdHIpLFxuICAgIHByb2plY3RJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvamVjdElkXCIsIFwiXHU1REYyXHU1QjhDXHU2MjEwXHU1QjY2XHU0RTYwXHU0RUZCXHU1MkExXHU1RkVCXHU3MTY3XCIsIGFzU3RyKSxcbiAgICB0aXRsZTogcmVxdWlyZWRGaWVsZChyYXcsIFwidGl0bGVcIiwgXCJcdTVERjJcdTVCOENcdTYyMTBcdTVCNjZcdTRFNjBcdTRFRkJcdTUyQTFcdTVGRUJcdTcxNjdcIiwgYXNTdHIpLFxuICAgIG5vdGVzOiByZXF1aXJlZEZpZWxkKHJhdywgXCJub3Rlc1wiLCBcIlx1NURGMlx1NUI4Q1x1NjIxMFx1NUI2Nlx1NEU2MFx1NEVGQlx1NTJBMVx1NUZFQlx1NzE2N1wiLCBhc1N0ciksXG4gICAgdG9waWNzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidG9waWNzXCIsXG4gICAgICBcIlx1NURGMlx1NUI4Q1x1NjIxMFx1NUI2Nlx1NEU2MFx1NEVGQlx1NTJBMVx1NUZFQlx1NzE2N1wiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJ0b3BpY3NcIikubWFwKCh4KSA9PiBhc1N0cih4LCBcIlx1NzdFNVx1OEJDNlx1NzBCOVwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICAgIGNvbXBsZXRlZEF0OiByZXF1aXJlZEZpZWxkKHJhdywgXCJjb21wbGV0ZWRBdFwiLCBcIlx1NURGMlx1NUI4Q1x1NjIxMFx1NUI2Nlx1NEU2MFx1NEVGQlx1NTJBMVx1NUZFQlx1NzE2N1wiLCBhc0ludCksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVDb21wbGV0ZWRTdHVkeVRhc2soXG4gIHQ6IENvbXBsZXRlZFN0dWR5VGFzayxcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogdC5pZCxcbiAgICBwcm9qZWN0SWQ6IHQucHJvamVjdElkLFxuICAgIHRpdGxlOiB0LnRpdGxlLFxuICAgIG5vdGVzOiB0Lm5vdGVzLFxuICAgIHRvcGljczogdC50b3BpY3MsXG4gICAgY29tcGxldGVkQXQ6IHQuY29tcGxldGVkQXQsXG4gIH07XG59XG5cbmZ1bmN0aW9uIHRleHQoczogc3RyaW5nLCBtYXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gcy50cmltKCkubGVuZ3RoID4gMCAmJiBBcnJheS5mcm9tKHMpLmxlbmd0aCA8PSBtYXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUxlYXJuaW5nKGRhdGE6IEFwcERhdGEpOiB2b2lkIHtcbiAgY29uc3QgZSA9IGRhdGEuZWR1Y2F0aW9uO1xuICBlbnN1cmUoXG4gICAgZS5wcm9ncmVzcy5sZW5ndGggKyBlLmNvbXBsZXRlZFRhc2tzLmxlbmd0aCArIGUuY29ycmVjdGlvbnMubGVuZ3RoIDw9XG4gICAgICAxMDAwMDAsXG4gICAgXCJcdTVCNjZcdTRFNjBcdThCQzFcdTYzNkVcdTY1NzBcdTkxQ0ZcdThEODVcdTUxRkFcdTk2NTBcdTUyMzZcIixcbiAgKTtcbiAgY29uc3QgaWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgdGFzayBvZiBlLmNvbXBsZXRlZFRhc2tzKSB7XG4gICAgZW5zdXJlKFxuICAgICAgIWlkcy5oYXMoYHRhc2t8JHt0YXNrLmlkfWApICYmXG4gICAgICAgIHRhc2suaWQubGVuZ3RoID4gMCAmJlxuICAgICAgICBkYXRhLnByb2plY3RzLnNvbWUoKHApID0+IHAuaWQgPT09IHRhc2sucHJvamVjdElkKSAmJlxuICAgICAgICB0ZXh0KHRhc2sudGl0bGUsIDIwMCkgJiZcbiAgICAgICAgdGFzay5ub3Rlcy5sZW5ndGggPD0gNTAwMDAgJiZcbiAgICAgICAgdGFzay50b3BpY3MubGVuZ3RoIDw9IDIwLFxuICAgICAgXCJcdTY1RTBcdTY1NDhcdTc2ODRcdTVERjJcdTVCOENcdTYyMTBcdTVCNjZcdTRFNjBcdTRFRkJcdTUyQTFcdTVGRUJcdTcxNjdcIixcbiAgICApO1xuICAgIGlkcy5hZGQoYHRhc2t8JHt0YXNrLmlkfWApO1xuICB9XG4gIGZvciAoY29uc3QgcmVjb3JkIG9mIGUucHJvZ3Jlc3MpIHtcbiAgICBlbnN1cmUoXG4gICAgICAhaWRzLmhhcyhgcHJvZ3Jlc3N8JHtyZWNvcmQuaWR9YCkgJiZcbiAgICAgICAgcmVjb3JkLmlkLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgZGF0YS5wcm9qZWN0cy5zb21lKChwKSA9PiBwLmlkID09PSByZWNvcmQucHJvamVjdElkKSAmJlxuICAgICAgICB0ZXh0KHJlY29yZC50b3BpYywgMjAwKSAmJlxuICAgICAgICB0ZXh0KHJlY29yZC5wb3NpdGlvbiwgMjAwMCkgJiZcbiAgICAgICAgdGV4dChyZWNvcmQuZXZpZGVuY2UsIDgwMDApICYmXG4gICAgICAgIEFycmF5LmZyb20ocmVjb3JkLm5leHRBY3Rpb24pLmxlbmd0aCA8PSAyMDAwLFxuICAgICAgXCJcdTVCNjZcdTRFNjBcdThGREJcdTVFQTZcdTk3MDBcdTg5ODFcdTk4NzlcdTc2RUVcdTMwMDFcdTc3RTVcdThCQzZcdTcwQjlcdTMwMDFcdTVCOUVcdTk2NDVcdTRGNERcdTdGNkVcdTU0OENcdTRGOURcdTYzNkVcIixcbiAgICApO1xuICAgIGlkcy5hZGQoYHByb2dyZXNzfCR7cmVjb3JkLmlkfWApO1xuICB9XG4gIGZvciAoY29uc3QgY29ycmVjdGlvbiBvZiBlLmNvcnJlY3Rpb25zKSB7XG4gICAgY29uc3QgZ3JhZGUgPSByZXF1aXJlKGUuZ3JhZGVzLmZpbmQoXG4gICAgICAoZykgPT4gZy5pZCA9PT0gY29ycmVjdGlvbi5ncmFkZUlkLFxuICAgICksIFwiXHU4QkEyXHU2QjYzXHU3RjNBXHU1QzExXHU2Mjc5XHU2NTM5XHU4QkIwXHU1RjU1XCIpO1xuICAgIGNvbnN0IGFzc2Vzc21lbnQgPSByZXF1aXJlKCgoKSA9PiB7XG4gICAgICBjb25zdCBzdWIgPSBlLnN1Ym1pc3Npb25zLmZpbmQoKHMpID0+IHMuaWQgPT09IGdyYWRlLnN1Ym1pc3Npb25JZCk7XG4gICAgICByZXR1cm4gc3ViID09PSB1bmRlZmluZWRcbiAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgOiBlLmFzc2Vzc21lbnRzLmZpbmQoKGEpID0+IGEuaWQgPT09IHN1Yi5hc3Nlc3NtZW50SWQpO1xuICAgIH0pKCksIFwiXHU4QkEyXHU2QjYzXHU3RjNBXHU1QzExXHU4QkQ1XHU5ODk4XCIpO1xuICAgIGVuc3VyZShcbiAgICAgICFpZHMuaGFzKGBjb3JyZWN0aW9ufCR7Y29ycmVjdGlvbi5pZH1gKSAmJlxuICAgICAgICBjb3JyZWN0aW9uLmlkLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgYXNzZXNzbWVudC5xdWVzdGlvbnMuc29tZSgocSkgPT4gcS5pZCA9PT0gY29ycmVjdGlvbi5xdWVzdGlvbklkKSAmJlxuICAgICAgICBBcnJheS5mcm9tKGNvcnJlY3Rpb24uZXhwbGFuYXRpb24pLmxlbmd0aCA8PSA4MDAwICYmXG4gICAgICAgICh0ZXh0KGNvcnJlY3Rpb24uZXhwbGFuYXRpb24sIDgwMDApIHx8XG4gICAgICAgICAgY29ycmVjdGlvbi5yZXNvdXJjZUlkcy5sZW5ndGggPiAwKSAmJlxuICAgICAgICBjb3JyZWN0aW9uLnJlc291cmNlSWRzLmV2ZXJ5KChpZCkgPT5cbiAgICAgICAgICBlLnJlc291cmNlcy5zb21lKFxuICAgICAgICAgICAgKHIpID0+IHIuaWQgPT09IGlkICYmIHIucHJvamVjdElkID09PSBhc3Nlc3NtZW50LnByb2plY3RJZCxcbiAgICAgICAgICApLFxuICAgICAgICApICYmXG4gICAgICAgIChjb3JyZWN0aW9uLmFjY2VwdGVkICE9PSBudWxsKSA9PT0gKGNvcnJlY3Rpb24ucmV2aWV3ZWRBdCAhPT0gbnVsbCkgJiZcbiAgICAgICAgKGNvcnJlY3Rpb24ucmV2aWV3ZWRBdCA9PT0gbnVsbCB8fFxuICAgICAgICAgIChjb3JyZWN0aW9uLnJldmlld2VkQXQgPj0gY29ycmVjdGlvbi5zdWJtaXR0ZWRBdCAmJlxuICAgICAgICAgICAgdGV4dChjb3JyZWN0aW9uLmZlZWRiYWNrLCA4MDAwKSkpLFxuICAgICAgXCJcdThCQTJcdTZCNjNcdTk3MDBcdTg5ODFcdTUzOUZcdTk4OThcdTMwMDFcdTg5RTNcdTkxQ0FcdTYyMTZcdTY3MkNcdTk4NzlcdTc2RUVcdTk2NDRcdTRFRjZcdUZGMUJcdTY4QzBcdTY3RTVcdTdFRDNcdTY3OUNcdTVGQzVcdTk4N0JcdTY3MDlcdTUzQ0RcdTk5ODhcIixcbiAgICApO1xuICAgIGlkcy5hZGQoYGNvcnJlY3Rpb258JHtjb3JyZWN0aW9uLmlkfWApO1xuICB9XG59XG5cbi8qKiBcdThGREJcdTVFQTYvXHU1RkVCXHU3MTY3L1x1OEJBMlx1NkI2M1x1NTM4Nlx1NTNGMlx1NEUwRFx1NTNFRlx1NTIyMFx1OTY2NFx1MzAwMVx1NEUwRFx1NTNFRlx1NjUzOVx1NTE5OVx1RkYxQlx1Nzg2RVx1OEJBNFx1NEUwRVx1NjhDMFx1NjdFNVx1NzJCNlx1NjAwMVx1NTE0MVx1OEJCOFx1NTM1NVx1NTQxMVx1NjNBOFx1OEZEQlx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlTGVhcm5pbmdUcmFuc2l0aW9uKFxuICBiZWZvcmU6IEVkdWNhdGlvbixcbiAgYWZ0ZXI6IEVkdWNhdGlvbixcbik6IHZvaWQge1xuICBmb3IgKGNvbnN0IHJlY29yZCBvZiBiZWZvcmUucHJvZ3Jlc3MpIHtcbiAgICBlbnN1cmUoXG4gICAgICBhZnRlci5wcm9ncmVzcy5zb21lKChyKSA9PiByLmlkID09PSByZWNvcmQuaWQpLFxuICAgICAgXCJcdThGREJcdTVFQTZcdTUzODZcdTUzRjJcdTRFMERcdTgwRkRcdTUyMjBcdTk2NjRcdUZGMENcdThCRjdcdTY1QjBcdTU4OUVcdTY2RjRcdTZCNjNcdThCQjBcdTVGNTVcIixcbiAgICApO1xuICAgIGNvbnN0IG5leHQgPSBhZnRlci5wcm9ncmVzcy5maW5kKChyKSA9PiByLmlkID09PSByZWNvcmQuaWQpO1xuICAgIGlmIChuZXh0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IG9sZCA9IHsgLi4ucmVjb3JkIH07XG4gICAgICBvbGQuY29uZmlybWVkID0gbmV4dC5jb25maXJtZWQ7XG4gICAgICBlbnN1cmUocHJvZ3Jlc3NFcXVhbHMob2xkLCBuZXh0KSwgXCJcdThGREJcdTVFQTZcdTUzODZcdTUzRjJcdTRFMERcdTUzRUZcdTY1MzlcdTUxOTlcdUZGMENcdThCRjdcdTY1QjBcdTU4OUVcdTRFMDBcdTY3NjFcdTY2RjRcdTZCNjNcdThCQjBcdTVGNTVcIik7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgcmVjb3JkIG9mIGJlZm9yZS5jb21wbGV0ZWRUYXNrcykge1xuICAgIGVuc3VyZShcbiAgICAgIGFmdGVyLmNvbXBsZXRlZFRhc2tzLmZpbmQoKHIpID0+IHIuaWQgPT09IHJlY29yZC5pZCkgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICBjb21wbGV0ZWRUYXNrRXF1YWxzKFxuICAgICAgICAgIGFmdGVyLmNvbXBsZXRlZFRhc2tzLmZpbmQoKHIpID0+IHIuaWQgPT09IHJlY29yZC5pZCkhLFxuICAgICAgICAgIHJlY29yZCxcbiAgICAgICAgKSxcbiAgICAgIFwiXHU1REYyXHU1QjhDXHU2MjEwXHU0RUZCXHU1MkExXHU3Njg0XHU1QjY2XHU0RTYwXHU1MTg1XHU1QkI5XHU1RkVCXHU3MTY3XHU0RTBEXHU1M0VGXHU2NTM5XHU1MTk5XCIsXG4gICAgKTtcbiAgfVxuICBmb3IgKGNvbnN0IHJlY29yZCBvZiBiZWZvcmUuY29ycmVjdGlvbnMpIHtcbiAgICBlbnN1cmUoXG4gICAgICBhZnRlci5jb3JyZWN0aW9ucy5zb21lKChyKSA9PiByLmlkID09PSByZWNvcmQuaWQpLFxuICAgICAgXCJcdThCQTJcdTZCNjNcdTUzODZcdTUzRjJcdTRFMERcdTgwRkRcdTUyMjBcdTk2NjRcIixcbiAgICApO1xuICAgIGNvbnN0IG5leHQgPSBhZnRlci5jb3JyZWN0aW9ucy5maW5kKChyKSA9PiByLmlkID09PSByZWNvcmQuaWQpO1xuICAgIGlmIChuZXh0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IG9sZCA9IHsgLi4ucmVjb3JkLCByZXNvdXJjZUlkczogWy4uLnJlY29yZC5yZXNvdXJjZUlkc10gfTtcbiAgICAgIGlmIChvbGQucmV2aWV3ZWRBdCA9PT0gbnVsbCkge1xuICAgICAgICBvbGQuYWNjZXB0ZWQgPSBuZXh0LmFjY2VwdGVkO1xuICAgICAgICBvbGQuZmVlZGJhY2sgPSBuZXh0LmZlZWRiYWNrO1xuICAgICAgICBvbGQucmV2aWV3ZWRBdCA9IG5leHQucmV2aWV3ZWRBdDtcbiAgICAgIH1cbiAgICAgIGVuc3VyZShcbiAgICAgICAgY29ycmVjdGlvbkVxdWFscyhvbGQsIG5leHQpLFxuICAgICAgICBcIlx1OEJBMlx1NkI2M1x1NEUwRVx1NjhDMFx1NjdFNVx1NTM4Nlx1NTNGMlx1NEUwRFx1NTNFRlx1NjUzOVx1NTE5OVx1RkYwQ1x1OEJGN1x1NjVCMFx1NTg5RVx1NEUwMFx1NkIyMVx1OEJBMlx1NkI2M1wiLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcHJvZ3Jlc3NFcXVhbHMoYTogUHJvZ3Jlc3NSZWNvcmQsIGI6IFByb2dyZXNzUmVjb3JkKTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgYS5pZCA9PT0gYi5pZCAmJlxuICAgIGEucHJvamVjdElkID09PSBiLnByb2plY3RJZCAmJlxuICAgIGEudG9waWMgPT09IGIudG9waWMgJiZcbiAgICBhLnBvc2l0aW9uID09PSBiLnBvc2l0aW9uICYmXG4gICAgYS5zdGF0ZSA9PT0gYi5zdGF0ZSAmJlxuICAgIGEuZXZpZGVuY2UgPT09IGIuZXZpZGVuY2UgJiZcbiAgICBhLm5leHRBY3Rpb24gPT09IGIubmV4dEFjdGlvbiAmJlxuICAgIGEuc291cmNlID09PSBiLnNvdXJjZSAmJlxuICAgIGEuY29uZmlybWVkID09PSBiLmNvbmZpcm1lZCAmJlxuICAgIGEucmVjb3JkZWRBdCA9PT0gYi5yZWNvcmRlZEF0XG4gICk7XG59XG5cbmZ1bmN0aW9uIGNvbXBsZXRlZFRhc2tFcXVhbHMoXG4gIGE6IENvbXBsZXRlZFN0dWR5VGFzayxcbiAgYjogQ29tcGxldGVkU3R1ZHlUYXNrLFxuKTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgYS5pZCA9PT0gYi5pZCAmJlxuICAgIGEucHJvamVjdElkID09PSBiLnByb2plY3RJZCAmJlxuICAgIGEudGl0bGUgPT09IGIudGl0bGUgJiZcbiAgICBhLm5vdGVzID09PSBiLm5vdGVzICYmXG4gICAgYS50b3BpY3MubGVuZ3RoID09PSBiLnRvcGljcy5sZW5ndGggJiZcbiAgICBhLnRvcGljcy5ldmVyeSgodCwgaSkgPT4gYi50b3BpY3NbaV0gPT09IHQpICYmXG4gICAgYS5jb21wbGV0ZWRBdCA9PT0gYi5jb21wbGV0ZWRBdFxuICApO1xufVxuXG5mdW5jdGlvbiBjb3JyZWN0aW9uRXF1YWxzKGE6IENvcnJlY3Rpb24sIGI6IENvcnJlY3Rpb24pOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICBhLmlkID09PSBiLmlkICYmXG4gICAgYS5ncmFkZUlkID09PSBiLmdyYWRlSWQgJiZcbiAgICBhLnF1ZXN0aW9uSWQgPT09IGIucXVlc3Rpb25JZCAmJlxuICAgIGEuZXhwbGFuYXRpb24gPT09IGIuZXhwbGFuYXRpb24gJiZcbiAgICBhLnJlc291cmNlSWRzLmxlbmd0aCA9PT0gYi5yZXNvdXJjZUlkcy5sZW5ndGggJiZcbiAgICBhLnJlc291cmNlSWRzLmV2ZXJ5KChyLCBpKSA9PiBiLnJlc291cmNlSWRzW2ldID09PSByKSAmJlxuICAgIGEuc3VibWl0dGVkQXQgPT09IGIuc3VibWl0dGVkQXQgJiZcbiAgICBhLmFjY2VwdGVkID09PSBiLmFjY2VwdGVkICYmXG4gICAgYS5mZWVkYmFjayA9PT0gYi5mZWVkYmFjayAmJlxuICAgIGEucmV2aWV3ZWRBdCA9PT0gYi5yZXZpZXdlZEF0XG4gICk7XG59XG5cbi8vIC0tLS0tLS0tLS0gXHU1QjY2XHU2MEM1XHU2NDU4XHU4OTgxIC0tLS0tLS0tLS1cblxuaW50ZXJmYWNlIFN1bW1hcnlJbmRleCB7XG4gIHN1Ym1pc3Npb25zOiBNYXA8c3RyaW5nLCBTdWJtaXNzaW9uPjtcbiAgZ3JhZGVzOiBNYXA8c3RyaW5nLCBHcmFkZT47XG4gIGFzc2Vzc21lbnRHcmFkZXM6IE1hcDxzdHJpbmcsIEdyYWRlPjtcbiAgYWNjZXB0ZWQ6IFNldDxzdHJpbmc+O1xuICByZXRlc3RzOiBNYXA8c3RyaW5nLCBBc3Nlc3NtZW50W10+O1xufVxuXG5mdW5jdGlvbiBidWlsZFN1bW1hcnlJbmRleChlOiBFZHVjYXRpb24pOiBTdW1tYXJ5SW5kZXgge1xuICBjb25zdCBpbmRleDogU3VtbWFyeUluZGV4ID0ge1xuICAgIHN1Ym1pc3Npb25zOiBuZXcgTWFwKCksXG4gICAgZ3JhZGVzOiBuZXcgTWFwKCksXG4gICAgYXNzZXNzbWVudEdyYWRlczogbmV3IE1hcCgpLFxuICAgIGFjY2VwdGVkOiBuZXcgU2V0KCksXG4gICAgcmV0ZXN0czogbmV3IE1hcCgpLFxuICB9O1xuICBjb25zdCBwYXJlbnRzID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgZm9yIChjb25zdCBzIG9mIGUuc3VibWlzc2lvbnMpIHtcbiAgICBwYXJlbnRzLnNldChzLmlkLCBzLmFzc2Vzc21lbnRJZCk7XG4gICAgY29uc3Qgb2xkID0gaW5kZXguc3VibWlzc2lvbnMuZ2V0KHMuYXNzZXNzbWVudElkKTtcbiAgICBpZiAob2xkID09PSB1bmRlZmluZWQgfHwgcy5zdWJtaXR0ZWRBdCA+PSBvbGQuc3VibWl0dGVkQXQpIHtcbiAgICAgIGluZGV4LnN1Ym1pc3Npb25zLnNldChzLmFzc2Vzc21lbnRJZCwgcyk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgZyBvZiBlLmdyYWRlcykge1xuICAgIGNvbnN0IG9sZCA9IGluZGV4LmdyYWRlcy5nZXQoZy5zdWJtaXNzaW9uSWQpO1xuICAgIGlmIChvbGQgPT09IHVuZGVmaW5lZCB8fCBnLmdyYWRlZEF0ID49IG9sZC5ncmFkZWRBdCkge1xuICAgICAgaW5kZXguZ3JhZGVzLnNldChnLnN1Ym1pc3Npb25JZCwgZyk7XG4gICAgfVxuICAgIGNvbnN0IGFzc2Vzc21lbnQgPSBwYXJlbnRzLmdldChnLnN1Ym1pc3Npb25JZCk7XG4gICAgaWYgKGFzc2Vzc21lbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3Qgb2xkQSA9IGluZGV4LmFzc2Vzc21lbnRHcmFkZXMuZ2V0KGFzc2Vzc21lbnQpO1xuICAgICAgaWYgKG9sZEEgPT09IHVuZGVmaW5lZCB8fCBnLmdyYWRlZEF0ID49IG9sZEEuZ3JhZGVkQXQpIHtcbiAgICAgICAgaW5kZXguYXNzZXNzbWVudEdyYWRlcy5zZXQoYXNzZXNzbWVudCwgZyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgYyBvZiBlLmNvcnJlY3Rpb25zKSB7XG4gICAgaWYgKGMuYWNjZXB0ZWQgPT09IHRydWUpIHtcbiAgICAgIGluZGV4LmFjY2VwdGVkLmFkZChgJHtjLmdyYWRlSWR9fCR7Yy5xdWVzdGlvbklkfWApO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IGEgb2YgZS5hc3Nlc3NtZW50cykge1xuICAgIGlmIChhLnJldGVzdE9mR3JhZGVJZCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgbGlzdCA9IGluZGV4LnJldGVzdHMuZ2V0KGEucmV0ZXN0T2ZHcmFkZUlkKSA/PyBbXTtcbiAgICAgIGxpc3QucHVzaChhKTtcbiAgICAgIGluZGV4LnJldGVzdHMuc2V0KGEucmV0ZXN0T2ZHcmFkZUlkLCBsaXN0KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGluZGV4O1xufVxuXG5mdW5jdGlvbiBhc3Nlc3NtZW50U3VtbWFyeShcbiAgaW5kZXg6IFN1bW1hcnlJbmRleCxcbiAgYTogQXNzZXNzbWVudCxcbiAgYXQ6IG51bWJlcixcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgY29uc3Qgc3VibWlzc2lvbiA9IGluZGV4LnN1Ym1pc3Npb25zLmdldChhLmlkKSA/PyBudWxsO1xuICBjb25zdCBncmFkZSA9XG4gICAgc3VibWlzc2lvbiAhPT0gbnVsbCA/IChpbmRleC5ncmFkZXMuZ2V0KHN1Ym1pc3Npb24uaWQpID8/IG51bGwpIDogbnVsbDtcbiAgY29uc3Qgc3RhdHVzID0gKCgpID0+IHtcbiAgICBpZiAoZ3JhZGUgIT09IG51bGwpIHtcbiAgICAgIGlmIChncmFkZS5uZWVkc1JldmlldykgcmV0dXJuIFwibmVlZHNSZXZpZXdcIjtcbiAgICAgIGlmIChcbiAgICAgICAgZ3JhZGUuZXJyb3JzLnNvbWUoXG4gICAgICAgICAgKGVycm9yKSA9PiAhaW5kZXguYWNjZXB0ZWQuaGFzKGAke2dyYWRlLmlkfXwke2Vycm9yLnF1ZXN0aW9uSWR9YCksXG4gICAgICAgIClcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gXCJjb3JyZWN0aW9uRHVlXCI7XG4gICAgICB9XG4gICAgICByZXR1cm4gXCJncmFkZWRcIjtcbiAgICB9XG4gICAgaWYgKHN1Ym1pc3Npb24gIT09IG51bGwpIHJldHVybiBcInN1Ym1pdHRlZFwiO1xuICAgIGlmIChcbiAgICAgIGEua2luZCAhPT0gXCJob21ld29ya1wiICYmXG4gICAgICBhLnN0YXJ0ZWRBdCA9PT0gbnVsbCAmJlxuICAgICAgZGF0ZUF0KGF0KSA+IGRhdGVBdChhLnN0YXJ0c0F0KVxuICAgICkge1xuICAgICAgcmV0dXJuIFwibWlzc2VkXCI7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIGEua2luZCAhPT0gXCJob21ld29ya1wiICYmXG4gICAgICBhLnN0YXJ0ZWRBdCAhPT0gbnVsbCAmJlxuICAgICAgYS5zdG9wcGVkQXQgPT09IG51bGwgJiZcbiAgICAgIGF0IDwgZXhhbURlYWRsaW5lKGEpXG4gICAgKSB7XG4gICAgICByZXR1cm4gXCJpblByb2dyZXNzXCI7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIGEua2luZCAhPT0gXCJob21ld29ya1wiICYmXG4gICAgICBhLnN0YXJ0ZWRBdCAhPT0gbnVsbCAmJlxuICAgICAgKGEuc3RvcHBlZEF0ICE9PSBudWxsIHx8IGF0ID49IGV4YW1EZWFkbGluZShhKSlcbiAgICApIHtcbiAgICAgIHJldHVybiBcImF3YWl0aW5nU3VibWlzc2lvblwiO1xuICAgIH1cbiAgICBpZiAoYS5raW5kID09PSBcImhvbWV3b3JrXCIgJiYgYXQgPj0gYS5lbmRzQXQpIHJldHVybiBcIm92ZXJkdWVcIjtcbiAgICBpZiAoYXQgPCBhLnN0YXJ0c0F0IHx8IChhLmtpbmQgIT09IFwiaG9tZXdvcmtcIiAmJiBhLnN0YXJ0ZWRBdCA9PT0gbnVsbCkpXG4gICAgICByZXR1cm4gXCJ1cGNvbWluZ1wiO1xuICAgIHJldHVybiBcImF3YWl0aW5nU3VibWlzc2lvblwiO1xuICB9KSgpO1xuICByZXR1cm4ge1xuICAgIGlkOiBhLmlkLFxuICAgIHRpdGxlOiBhLnRpdGxlLFxuICAgIGtpbmQ6IGEua2luZCxcbiAgICBzdGF0dXMsXG4gICAgc3RhcnRzQXQ6IGEuc3RhcnRzQXQsXG4gICAgZW5kc0F0OiBhLmVuZHNBdCxcbiAgICBzdWJtaXNzaW9uSWQ6IHN1Ym1pc3Npb24/LmlkID8/IG51bGwsXG4gICAgc3VibWl0dGVkQXQ6IHN1Ym1pc3Npb24/LnN1Ym1pdHRlZEF0ID8/IG51bGwsXG4gICAgdW5maW5pc2hlZDogc3VibWlzc2lvbiAhPT0gbnVsbCAmJiBzdWJtaXNzaW9uLnVuZmluaXNoZWQsXG4gICAgbGF0ZTpcbiAgICAgIGEua2luZCA9PT0gXCJob21ld29ya1wiICYmXG4gICAgICBzdWJtaXNzaW9uICE9PSBudWxsICYmXG4gICAgICBzdWJtaXNzaW9uLnN1Ym1pdHRlZEF0ID4gYS5lbmRzQXQsXG4gICAgZ3JhZGVJZDogZ3JhZGU/LmlkID8/IG51bGwsXG4gICAgZ3JhZGVkQXQ6IGdyYWRlPy5ncmFkZWRBdCA/PyBudWxsLFxuICAgIHNjb3JlOlxuICAgICAgZ3JhZGUgIT09IG51bGwgJiYgIWdyYWRlLm5lZWRzUmV2aWV3XG4gICAgICAgID8gZ3JhZGUuYXdhcmRzLnJlZHVjZSgobiwgcCkgPT4gbiArIHAuYXdhcmRlZCwgMClcbiAgICAgICAgOiBudWxsLFxuICAgIHRvdGFsOiBhLnF1ZXN0aW9ucy5yZWR1Y2UoXG4gICAgICAobiwgcSkgPT4gbiArIHEuc2NvcmluZy5yZWR1Y2UoKG0sIHApID0+IG0gKyBwLnBvaW50cywgMCksXG4gICAgICAwLFxuICAgICksXG4gICAgbmVlZHNSZXZpZXc6IGdyYWRlICE9PSBudWxsICYmIGdyYWRlLm5lZWRzUmV2aWV3LFxuICB9O1xufVxuXG5mdW5jdGlvbiBleGFtRGVhZGxpbmUoYTogQXNzZXNzbWVudCk6IG51bWJlciB7XG4gIHJldHVybiBhLnN0YXJ0ZWRBdCA9PT0gbnVsbFxuICAgID8gYS5lbmRzQXRcbiAgICA6IGEuc3RhcnRlZEF0ICsgKGEuZW5kc0F0IC0gYS5zdGFydHNBdCk7XG59XG5cbi8qKiBcdTZCQ0ZcdTZCMjFcdTRFQ0VcdTVGNTNcdTUyNERcdThCQzFcdTYzNkVcdTYzQThcdTVCRkNcdUZGMUJcdTZDQTFcdTY3MDlcdTdCMkNcdTRFOENcdTRFRkRcdTRGMUFcdThGQzdcdTY3MUZcdTc2ODRcdTY0NThcdTg5ODFcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBzdW1tYXJpZXMoXG4gIGRhdGE6IEFwcERhdGEsXG4gIGF0OiBudW1iZXIsXG4pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdIHtcbiAgY29uc3QgZSA9IGRhdGEuZWR1Y2F0aW9uO1xuICBjb25zdCBpbmRleCA9IGJ1aWxkU3VtbWFyeUluZGV4KGUpO1xuICBjb25zdCBvdXQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+W10gPSBbXTtcbiAgZm9yIChjb25zdCBwcm9qZWN0IG9mIGRhdGEucHJvamVjdHMuZmlsdGVyKFxuICAgIChwKSA9PlxuICAgICAgZS5wcm9qZWN0cy5zb21lKChzKSA9PiBzLnByb2plY3RJZCA9PT0gcC5pZCkgfHxcbiAgICAgIGUucHJvZ3Jlc3Muc29tZSgocikgPT4gci5wcm9qZWN0SWQgPT09IHAuaWQpLFxuICApKSB7XG4gICAgY29uc3QgcHJvZ3Jlc3MgPSBlLnByb2dyZXNzXG4gICAgICAuZmlsdGVyKChyKSA9PiByLnByb2plY3RJZCA9PT0gcHJvamVjdC5pZClcbiAgICAgIC5zbGljZSgpXG4gICAgICAuc29ydCgoYSwgYikgPT4gYS5yZWNvcmRlZEF0IC0gYi5yZWNvcmRlZEF0KTtcbiAgICBjb25zdCB0b3BpY3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb25zdCBsYXRlc3QgPSBwcm9ncmVzc1xuICAgICAgLnNsaWNlKClcbiAgICAgIC5yZXZlcnNlKClcbiAgICAgIC5maWx0ZXIoKHIpID0+IHtcbiAgICAgICAgaWYgKHRvcGljcy5oYXMoci50b3BpYykpIHJldHVybiBmYWxzZTtcbiAgICAgICAgdG9waWNzLmFkZChyLnRvcGljKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcbiAgICBjb25zdCBhc3Nlc3NtZW50cyA9IGUuYXNzZXNzbWVudHNcbiAgICAgIC5maWx0ZXIoKGEpID0+IGEucHJvamVjdElkID09PSBwcm9qZWN0LmlkKVxuICAgICAgLm1hcCgoYSkgPT4gYXNzZXNzbWVudFN1bW1hcnkoaW5kZXgsIGEsIGF0KSlcbiAgICAgIC5zb3J0KChhLCBiKSA9PiAoYi5zdGFydHNBdCBhcyBudW1iZXIpIC0gKGEuc3RhcnRzQXQgYXMgbnVtYmVyKSk7XG4gICAgY29uc3QgcmV0ZXN0czogUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXSA9IFtdO1xuICAgIGNvbnN0IGdyYWRlcyA9IGUuYXNzZXNzbWVudHNcbiAgICAgIC5maWx0ZXIoKGEpID0+IGEucHJvamVjdElkID09PSBwcm9qZWN0LmlkKVxuICAgICAgLm1hcCgoYSkgPT4gaW5kZXguYXNzZXNzbWVudEdyYWRlcy5nZXQoYS5pZCkpXG4gICAgICAuZmlsdGVyKChnKTogZyBpcyBHcmFkZSA9PiBnICE9PSB1bmRlZmluZWQpO1xuICAgIGZvciAoY29uc3QgZ3JhZGUgb2YgZ3JhZGVzKSB7XG4gICAgICBjb25zdCBhdHRlbXB0cyA9IChpbmRleC5yZXRlc3RzLmdldChncmFkZS5pZCkgPz8gW10pLm1hcCgoYSkgPT5cbiAgICAgICAgYXNzZXNzbWVudFN1bW1hcnkoaW5kZXgsIGEsIGF0KSxcbiAgICAgICk7XG4gICAgICBmb3IgKGNvbnN0IGVycm9yIG9mIGdyYWRlLmVycm9ycykge1xuICAgICAgICByZXRlc3RzLnB1c2goe1xuICAgICAgICAgIGdyYWRlSWQ6IGdyYWRlLmlkLFxuICAgICAgICAgIHF1ZXN0aW9uSWQ6IGVycm9yLnF1ZXN0aW9uSWQsXG4gICAgICAgICAgY2F1c2U6IGVycm9yLmNhdXNlLFxuICAgICAgICAgIGNvbmZpcm1lZDogZXJyb3IuY29uZmlybWVkLFxuICAgICAgICAgIHJldGVzdERhdGU6IGVycm9yLnJldGVzdERhdGUsXG4gICAgICAgICAgbmV4dENoZWNrOiBlcnJvci5uZXh0Q2hlY2ssXG4gICAgICAgICAgY29ycmVjdGlvbkFjY2VwdGVkOiBpbmRleC5hY2NlcHRlZC5oYXMoXG4gICAgICAgICAgICBgJHtncmFkZS5pZH18JHtlcnJvci5xdWVzdGlvbklkfWAsXG4gICAgICAgICAgKSxcbiAgICAgICAgICBhdHRlbXB0cyxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldGVzdHMuc29ydCgoYSwgYikgPT5cbiAgICAgIFN0cmluZyhhW1wicmV0ZXN0RGF0ZVwiXSkubG9jYWxlQ29tcGFyZShTdHJpbmcoYltcInJldGVzdERhdGVcIl0pKSxcbiAgICApO1xuICAgIGNvbnN0IHJlY2VudFRhc2tzID0gZS5jb21wbGV0ZWRUYXNrc1xuICAgICAgLnNsaWNlKClcbiAgICAgIC5yZXZlcnNlKClcbiAgICAgIC5maWx0ZXIoKHQpID0+IHQucHJvamVjdElkID09PSBwcm9qZWN0LmlkKVxuICAgICAgLnNsaWNlKDAsIDUpO1xuICAgIGNvbnN0IGxlc3NvbnMgPSBlLmxlc3NvbnMuZmlsdGVyKChsKSA9PiBsLnByb2plY3RJZCA9PT0gcHJvamVjdC5pZCk7XG4gICAgY29uc3QgbGFzdExlc3NvbiA9IGxlc3NvbnNcbiAgICAgIC5maWx0ZXIoKGwpID0+IGwuYXR0ZW5kZWQpXG4gICAgICAucmVkdWNlPExlc3NvbiB8IG51bGw+KFxuICAgICAgICAoYmVzdCwgbCkgPT4gKGJlc3QgPT09IG51bGwgfHwgbC5zdGFydHNBdCA+IGJlc3Quc3RhcnRzQXQgPyBsIDogYmVzdCksXG4gICAgICAgIG51bGwsXG4gICAgICApO1xuICAgIGNvbnN0IGxhdGVzdFJldmlldyA9IGUucmV2aWV3c1xuICAgICAgLmZpbHRlcigocikgPT4gci5wcm9qZWN0SWQgPT09IHByb2plY3QuaWQpXG4gICAgICAucmVkdWNlPFJldmlldyB8IG51bGw+KFxuICAgICAgICAoYmVzdCwgcikgPT4gKGJlc3QgPT09IG51bGwgfHwgci5kYXRlID4gYmVzdC5kYXRlID8gciA6IGJlc3QpLFxuICAgICAgICBudWxsLFxuICAgICAgKTtcbiAgICBjb25zdCByZXZpZXdUaW1lID1cbiAgICAgIGxhdGVzdFJldmlldyA9PT0gbnVsbCA/IG51bGwgOiBhdExvY2FsRGF0ZVN0cmluZyhsYXRlc3RSZXZpZXcuZGF0ZSk7XG4gICAgY29uc3QgdXBkYXRlZCA9IE1hdGgubWF4KFxuICAgICAgLi4uW1xuICAgICAgICAuLi5sYXRlc3QubWFwKChyKSA9PiByLnJlY29yZGVkQXQpLFxuICAgICAgICAuLi5yZWNlbnRUYXNrcy5tYXAoKHIpID0+IHIuY29tcGxldGVkQXQpLFxuICAgICAgICAuLi4obGFzdExlc3NvbiAhPT0gbnVsbCA/IFtsYXN0TGVzc29uLnN0YXJ0c0F0XSA6IFtdKSxcbiAgICAgICAgLi4uKHJldmlld1RpbWUgIT09IG51bGwgPyBbcmV2aWV3VGltZV0gOiBbXSksXG4gICAgICAgIC4uLmFzc2Vzc21lbnRzXG4gICAgICAgICAgLmZpbHRlcigoYSkgPT4gdHlwZW9mIGFbXCJzdWJtaXR0ZWRBdFwiXSA9PT0gXCJudW1iZXJcIilcbiAgICAgICAgICAubWFwKChhKSA9PiBhW1wic3VibWl0dGVkQXRcIl0gYXMgbnVtYmVyKSxcbiAgICAgICAgLi4uYXNzZXNzbWVudHNcbiAgICAgICAgICAuZmlsdGVyKChhKSA9PiB0eXBlb2YgYVtcImdyYWRlZEF0XCJdID09PSBcIm51bWJlclwiKVxuICAgICAgICAgIC5tYXAoKGEpID0+IGFbXCJncmFkZWRBdFwiXSBhcyBudW1iZXIpLFxuICAgICAgICAuLi5lLmNvcnJlY3Rpb25zXG4gICAgICAgICAgLmZpbHRlcigoYykgPT4gYXNzZXNzbWVudHMuc29tZSgoYSkgPT4gYVtcImdyYWRlSWRcIl0gPT09IGMuZ3JhZGVJZCkpXG4gICAgICAgICAgLm1hcCgoYykgPT4gYy5yZXZpZXdlZEF0ID8/IGMuc3VibWl0dGVkQXQpLFxuICAgICAgXS5maWx0ZXIoKG4pID0+IHR5cGVvZiBuID09PSBcIm51bWJlclwiKSxcbiAgICAgIC1JbmZpbml0eSxcbiAgICApO1xuICAgIGNvbnN0IHRhc2tJZHMgPSBuZXcgU2V0PHN0cmluZz4oW1xuICAgICAgLi4uZGF0YS50YXNrcy5maWx0ZXIoKHQpID0+IHQucHJvamVjdElkID09PSBwcm9qZWN0LmlkKS5tYXAoKHQpID0+IHQuaWQpLFxuICAgICAgLi4uZS5jb21wbGV0ZWRUYXNrc1xuICAgICAgICAuZmlsdGVyKCh0KSA9PiB0LnByb2plY3RJZCA9PT0gcHJvamVjdC5pZClcbiAgICAgICAgLm1hcCgodCkgPT4gdC5pZCksXG4gICAgXSk7XG4gICAgY29uc3QgYWN0dWFsU2Vjb25kcyA9IGRhdGEuc2Vzc2lvbnNcbiAgICAgIC5maWx0ZXIoXG4gICAgICAgIChzKSA9PlxuICAgICAgICAgIHMuc291cmNlID09PSBcInRpbWVyXCIgJiZcbiAgICAgICAgICBzLmVuZGVkQXQgPj0gYXQgLSA3ICogODY0MDAgJiZcbiAgICAgICAgICBzLmVuZGVkQXQgPD0gYXQgJiZcbiAgICAgICAgICBzLnRhc2tJZCAhPT0gbnVsbCAmJlxuICAgICAgICAgIHRhc2tJZHMuaGFzKHMudGFza0lkKSxcbiAgICAgIClcbiAgICAgIC5yZWR1Y2UoKG4sIHMpID0+IG4gKyBzLmR1cmF0aW9uU2VjcywgMCk7XG4gICAgY29uc3QgYXNzZXNzbWVudENvdW50ID0gYXNzZXNzbWVudHMubGVuZ3RoO1xuICAgIGNvbnN0IHJldGVzdENvdW50ID0gcmV0ZXN0cy5sZW5ndGg7XG4gICAgb3V0LnB1c2goe1xuICAgICAgcHJvamVjdElkOiBwcm9qZWN0LmlkLFxuICAgICAgcHJvamVjdE5hbWU6IHByb2plY3QubmFtZSxcbiAgICAgIHVwZGF0ZWRBdDogTnVtYmVyLmlzRmluaXRlKHVwZGF0ZWQpID8gdXBkYXRlZCA6IG51bGwsXG4gICAgICBwcm9ncmVzczogbGF0ZXN0LnNsaWNlKDAsIDEyKSxcbiAgICAgIHByb2dyZXNzQ291bnQ6IGUucHJvZ3Jlc3MuZmlsdGVyKChyKSA9PiByLnByb2plY3RJZCA9PT0gcHJvamVjdC5pZClcbiAgICAgICAgLmxlbmd0aCxcbiAgICAgIHJlY2VudENvbXBsZXRlZFRhc2tzOiByZWNlbnRUYXNrcyxcbiAgICAgIGxhc3RBdHRlbmRlZExlc3NvbjpcbiAgICAgICAgbGFzdExlc3NvbiA9PT0gbnVsbFxuICAgICAgICAgID8gbnVsbFxuICAgICAgICAgIDoge1xuICAgICAgICAgICAgICBpZDogbGFzdExlc3Nvbi5pZCxcbiAgICAgICAgICAgICAgdGl0bGU6IGxhc3RMZXNzb24udGl0bGUsXG4gICAgICAgICAgICAgIHByb2dyZXNzOiBsYXN0TGVzc29uLnByb2dyZXNzLFxuICAgICAgICAgICAgICBzdGF0ZTogbGFzdExlc3Nvbi5zdGF0ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICBsZXNzb25zOiB7XG4gICAgICAgIHBsYW5uZWQ6IGxlc3NvbnMuZmlsdGVyKChsKSA9PiBsLnN0YXRlID09PSBcInBsYW5uZWRcIikubGVuZ3RoLFxuICAgICAgICBhdHRlbmRlZDogbGVzc29ucy5maWx0ZXIoKGwpID0+IGwuYXR0ZW5kZWQpLmxlbmd0aCxcbiAgICAgICAgbWlzc2VkOiBsZXNzb25zLmZpbHRlcigobCkgPT4gbC5zdGF0ZSA9PT0gXCJtaXNzZWRcIikubGVuZ3RoLFxuICAgICAgfSxcbiAgICAgIGFjdHVhbEZvY3VzU2Vjb25kczdkOiBhY3R1YWxTZWNvbmRzLFxuICAgICAgYXNzZXNzbWVudHM6IGFzc2Vzc21lbnRzLnNsaWNlKDAsIDIwKSxcbiAgICAgIGFzc2Vzc21lbnRDb3VudCxcbiAgICAgIHJldGVzdHM6IHJldGVzdHMuc2xpY2UoMCwgMjApLFxuICAgICAgcmV0ZXN0Q291bnQsXG4gICAgICBsYXRlc3RSZXZpZXcsXG4gICAgICBwZW5kaW5nRXZlbnRzOiBlLmV2ZW50cy5maWx0ZXIoXG4gICAgICAgIChyKSA9PiByLnByb2plY3RJZCA9PT0gcHJvamVjdC5pZCAmJiByLnN0YXRlICE9PSBcImRvbmVcIixcbiAgICAgICkubGVuZ3RoLFxuICAgICAgbm90ZTogXCJcdThCQTFcdTY1RjZcdTRFMEVcdTRFRkJcdTUyQTFcdTVCOENcdTYyMTBcdTUzRUFcdThCRjRcdTY2MEVcdTYyOTVcdTUxNjVcdTYyMTZcdTgxRUFcdTYyQTVcdTVCOENcdTYyMTBcdUZGMUJcdTYzOENcdTYzRTFcdTk4N0JcdTY3RTVcdTc3MEJcdTdCNTRcdTUzNzdcdTMwMDFcdTYyNzlcdTY1MzlcdTRFMEVcdTcyRUNcdTdBQ0JcdTU5MERcdTZENEJcdTMwMDJcdTdBN0FcdThCQjBcdTVGNTVcdTg4NjhcdTc5M0FcdTY3MkFcdTc3RTVcdTMwMDJcIixcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuIiwgIi8vISBcdTY1NTlcdTVCNjZcdTVCOUVcdTRGNTNcdTMwMDFcdTYzMDFcdTRFNDVcdTUzMTZcdTRFOEJcdTRFRjZcdTMwMDFcdThENDRcdTZFOTBcdTVGMTVcdTc1MjhcdTRFMEVcdTUzODZcdTUzRjJcdTRGRERcdTYyQTRcdTMwMDJcbi8vISBcdTVCRjlcdTVFOTQgY3JhdGVzL2NvcmUvc3JjL2VkdWNhdGlvbi5yc1x1MzAwMlxuXG5pbXBvcnQgeyBBcHBFcnJvciwgZW5zdXJlIH0gZnJvbSBcIi4vZXJyb3JzXCI7XG5pbXBvcnQge1xuICBhc0FycmF5LFxuICBhc0Jvb2wsXG4gIGFzSW50LFxuICBhc09wdCxcbiAgYXNTdHIsXG4gIGZpZWxkLFxuICBpc09iamVjdCxcbiAgb25lT2YsXG4gIHJlamVjdFVua25vd24sXG4gIHJlcXVpcmVkRmllbGQsXG59IGZyb20gXCIuL2pzb25cIjtcbmltcG9ydCB0eXBlIHtcbiAgQXNzZXNzbWVudCxcbiAgQXNzZXNzbWVudEtpbmQsXG4gIENvcnJlY3Rpb24sXG4gIEVycm9yQW5hbHlzaXMsXG4gIEdyYWRlLFxuICBMZXNzb24sXG4gIExlc3NvblN0YXRlLFxuICBNaWxlc3RvbmUsXG4gIFBvaW50QXdhcmQsXG4gIFByb2dyZXNzUmVjb3JkLFxuICBQcm9ncmVzc1NvdXJjZSxcbiAgUHJvamVjdFN0dWR5LFxuICBRdWVzdGlvbixcbiAgUXVlc3Rpb25UaW1lLFxuICBSZXNvdXJjZSxcbiAgUmVzb3VyY2VLaW5kLFxuICBSZXZpZXcsXG4gIFNjb3JpbmdQb2ludCxcbiAgU2VtZXN0ZXIsXG4gIFN1Ym1pc3Npb24sXG4gIFRlYWNoaW5nRXZlbnQsXG59IGZyb20gXCIuL21vZGVsXCI7XG5pbXBvcnQgdHlwZSB7IEFwcERhdGEgfSBmcm9tIFwiLi9saWJcIjtcbmltcG9ydCB0eXBlIHsgQ29tcGxldGVkU3R1ZHlUYXNrLCBUYXNrIH0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7XG4gIGRheXNCZXR3ZWVuLFxuICBkYXRlQXQsXG4gIGxvY2FsRGF0ZU9mLFxuICBtaW51dGVzT2YsXG4gIHBhcnNlRGF0ZSxcbiAgdmFsaWREYXRlLFxuICB3ZWVrZGF5TW9uZGF5LFxufSBmcm9tIFwiLi90aW1lXCI7XG5pbXBvcnQge1xuICBwYXJzZUNvbXBsZXRlZFN0dWR5VGFzayxcbiAgc2VyaWFsaXplQ29tcGxldGVkU3R1ZHlUYXNrLFxuICB2YWxpZGF0ZUxlYXJuaW5nLFxuICB2YWxpZGF0ZUxlYXJuaW5nVHJhbnNpdGlvbixcbn0gZnJvbSBcIi4vbGVhcm5pbmdcIjtcbmltcG9ydCB7IG92ZXJsYXBNaW51dGVzIGFzIG92ZXJsYXBNaW51dGVzT2ZCbG9jayB9IGZyb20gXCIuL2Jsb2Nrc1wiO1xuXG4vLyAtLS0tLS0tLS0tIFx1NTQ3RFx1NEVFNCAtLS0tLS0tLS0tXG5cbmV4cG9ydCB0eXBlIENvbW1hbmQgPVxuICB8IHsgb3A6IFwic2F2ZVByb2plY3RcIjsgcHJvamVjdDogUHJvamVjdFN0dWR5IH1cbiAgfCB7IG9wOiBcInNhdmVSZXNvdXJjZVwiOyByZXNvdXJjZTogUmVzb3VyY2UgfVxuICB8IHsgb3A6IFwic2F2ZVJlc291cmNlc1wiOyByZXNvdXJjZXM6IFJlc291cmNlW10gfVxuICB8IHsgb3A6IFwicmVtb3ZlUmVzb3VyY2VzXCI7IGlkczogc3RyaW5nW10gfVxuICB8IHsgb3A6IFwic2F2ZVNlbWVzdGVyXCI7IHNlbWVzdGVyOiBTZW1lc3RlciB9XG4gIHwgeyBvcDogXCJzYXZlTGVzc29uXCI7IGxlc3NvbjogTGVzc29uIH1cbiAgfCB7IG9wOiBcInNldExlc3NvblJlc291cmNlc1wiOyBpZDogc3RyaW5nOyByZXNvdXJjZUlkczogc3RyaW5nW10gfVxuICB8IHsgb3A6IFwiYXR0ZW5kTGVzc29uXCI7IGlkOiBzdHJpbmc7IHByb2dyZXNzOiBzdHJpbmcgfVxuICB8IHsgb3A6IFwicHVibGlzaEFzc2Vzc21lbnRcIjsgYXNzZXNzbWVudDogQXNzZXNzbWVudCB9XG4gIHwgeyBvcDogXCJjb25maXJtUHJpbnRlZFwiOyBpZDogc3RyaW5nIH1cbiAgfCB7IG9wOiBcInN0YXJ0RXhhbVwiOyBpZDogc3RyaW5nIH1cbiAgfCB7IG9wOiBcImVuZEV4YW1cIjsgaWQ6IHN0cmluZyB9XG4gIHwgeyBvcDogXCJzdWJtaXRcIjsgc3VibWlzc2lvbjogU3VibWlzc2lvbiB9XG4gIHwgeyBvcDogXCJyZWNvcmRRdWVzdGlvblRpbWVzXCI7IGlkOiBzdHJpbmc7IHF1ZXN0aW9uVGltZXM6IFF1ZXN0aW9uVGltZVtdIH1cbiAgfCB7IG9wOiBcImdyYWRlXCI7IGdyYWRlOiBHcmFkZSB9XG4gIHwgeyBvcDogXCJzYXZlUmV2aWV3XCI7IHJldmlldzogUmV2aWV3IH1cbiAgfCB7IG9wOiBcImNsYWltRXZlbnRcIjsgaWQ6IHN0cmluZyB9XG4gIHwgeyBvcDogXCJmaW5pc2hFdmVudFwiOyBpZDogc3RyaW5nIH1cbiAgfCB7IG9wOiBcInJldHJ5RXZlbnRcIjsgaWQ6IHN0cmluZyB9XG4gIHwgeyBvcDogXCJyZWNvcmRQcm9ncmVzc1wiOyByZWNvcmQ6IFByb2dyZXNzUmVjb3JkIH1cbiAgfCB7IG9wOiBcImNvbmZpcm1Qcm9ncmVzc1wiOyBpZDogc3RyaW5nIH1cbiAgfCB7IG9wOiBcInN1Ym1pdENvcnJlY3Rpb25cIjsgY29ycmVjdGlvbjogQ29ycmVjdGlvbiB9XG4gIHwgeyBvcDogXCJyZXZpZXdDb3JyZWN0aW9uXCI7IGlkOiBzdHJpbmc7IGFjY2VwdGVkOiBib29sZWFuOyBmZWVkYmFjazogc3RyaW5nIH07XG5cbmNvbnN0IENPTU1BTkRfS0VZUzogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+ID0ge1xuICBzYXZlUHJvamVjdDogW1wib3BcIiwgXCJwcm9qZWN0XCJdLFxuICBzYXZlUmVzb3VyY2U6IFtcIm9wXCIsIFwicmVzb3VyY2VcIl0sXG4gIHNhdmVSZXNvdXJjZXM6IFtcIm9wXCIsIFwicmVzb3VyY2VzXCJdLFxuICByZW1vdmVSZXNvdXJjZXM6IFtcIm9wXCIsIFwiaWRzXCJdLFxuICBzYXZlU2VtZXN0ZXI6IFtcIm9wXCIsIFwic2VtZXN0ZXJcIl0sXG4gIHNhdmVMZXNzb246IFtcIm9wXCIsIFwibGVzc29uXCJdLFxuICBzZXRMZXNzb25SZXNvdXJjZXM6IFtcIm9wXCIsIFwiaWRcIiwgXCJyZXNvdXJjZUlkc1wiXSxcbiAgYXR0ZW5kTGVzc29uOiBbXCJvcFwiLCBcImlkXCIsIFwicHJvZ3Jlc3NcIl0sXG4gIHB1Ymxpc2hBc3Nlc3NtZW50OiBbXCJvcFwiLCBcImFzc2Vzc21lbnRcIl0sXG4gIGNvbmZpcm1QcmludGVkOiBbXCJvcFwiLCBcImlkXCJdLFxuICBzdGFydEV4YW06IFtcIm9wXCIsIFwiaWRcIl0sXG4gIGVuZEV4YW06IFtcIm9wXCIsIFwiaWRcIl0sXG4gIHN1Ym1pdDogW1wib3BcIiwgXCJzdWJtaXNzaW9uXCJdLFxuICByZWNvcmRRdWVzdGlvblRpbWVzOiBbXCJvcFwiLCBcImlkXCIsIFwicXVlc3Rpb25UaW1lc1wiXSxcbiAgZ3JhZGU6IFtcIm9wXCIsIFwiZ3JhZGVcIl0sXG4gIHNhdmVSZXZpZXc6IFtcIm9wXCIsIFwicmV2aWV3XCJdLFxuICBjbGFpbUV2ZW50OiBbXCJvcFwiLCBcImlkXCJdLFxuICBmaW5pc2hFdmVudDogW1wib3BcIiwgXCJpZFwiXSxcbiAgcmV0cnlFdmVudDogW1wib3BcIiwgXCJpZFwiXSxcbiAgcmVjb3JkUHJvZ3Jlc3M6IFtcIm9wXCIsIFwicmVjb3JkXCJdLFxuICBjb25maXJtUHJvZ3Jlc3M6IFtcIm9wXCIsIFwiaWRcIl0sXG4gIHN1Ym1pdENvcnJlY3Rpb246IFtcIm9wXCIsIFwiY29ycmVjdGlvblwiXSxcbiAgcmV2aWV3Q29ycmVjdGlvbjogW1wib3BcIiwgXCJpZFwiLCBcImFjY2VwdGVkXCIsIFwiZmVlZGJhY2tcIl0sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb21tYW5kKHJhdzogdW5rbm93bik6IENvbW1hbmQge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgY29uc3Qgb3AgPSBvbmVPZihcbiAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJvcFwiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCAodikgPT4gdiksXG4gICAgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTQgb3BcIixcbiAgICBPYmplY3Qua2V5cyhDT01NQU5EX0tFWVMpLFxuICApO1xuICByZWplY3RVbmtub3duKHJhdywgQ09NTUFORF9LRVlTW29wXSEsIFwiXHU2NTU5XHU1QjY2XHU1NDdEXHU0RUU0XCIpO1xuICBzd2l0Y2ggKG9wKSB7XG4gICAgY2FzZSBcInNhdmVQcm9qZWN0XCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvcCxcbiAgICAgICAgcHJvamVjdDogcGFyc2VQcm9qZWN0U3R1ZHkoXG4gICAgICAgICAgcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvamVjdFwiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCAodikgPT4gdiksXG4gICAgICAgICksXG4gICAgICB9O1xuICAgIGNhc2UgXCJzYXZlUmVzb3VyY2VcIjpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG9wLFxuICAgICAgICByZXNvdXJjZTogcGFyc2VSZXNvdXJjZShcbiAgICAgICAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJyZXNvdXJjZVwiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCAodikgPT4gdiksXG4gICAgICAgICksXG4gICAgICB9O1xuICAgIGNhc2UgXCJzYXZlUmVzb3VyY2VzXCI6IHtcbiAgICAgIGNvbnN0IGxpc3QgPSBhc0FycmF5KFxuICAgICAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJyZXNvdXJjZXNcIiwgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcIiwgKHYpID0+IHYpLFxuICAgICAgICBcInJlc291cmNlc1wiLFxuICAgICAgKTtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgbGlzdC5sZW5ndGggPiAwICYmIGxpc3QubGVuZ3RoIDw9IDUwMDAsXG4gICAgICAgIFwiXHU2Mjc5XHU5MUNGXHU3NjdCXHU4QkIwXHU5NzAwXHU4OTgxIDFcdTIwMTM1MDAwIFx1Njc2MVx1OEQ0NFx1NkU5MFwiLFxuICAgICAgKTtcbiAgICAgIHJldHVybiB7IG9wLCByZXNvdXJjZXM6IGxpc3QubWFwKChpdGVtKSA9PiBwYXJzZVJlc291cmNlKGl0ZW0pKSB9O1xuICAgIH1cbiAgICBjYXNlIFwicmVtb3ZlUmVzb3VyY2VzXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvcCxcbiAgICAgICAgaWRzOiBhc0FycmF5KFxuICAgICAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcImlkc1wiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCAodikgPT4gdiksXG4gICAgICAgICAgXCJpZHNcIixcbiAgICAgICAgKS5tYXAoKHgpID0+IGFzU3RyKHgsIFwiXHU4RDQ0XHU2RTkwIElEXCIpKSxcbiAgICAgIH07XG4gICAgY2FzZSBcInNhdmVTZW1lc3RlclwiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb3AsXG4gICAgICAgIHNlbWVzdGVyOiBwYXJzZVNlbWVzdGVyKFxuICAgICAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcInNlbWVzdGVyXCIsIFwiXHU2NTU5XHU1QjY2XHU1NDdEXHU0RUU0XCIsICh2KSA9PiB2KSxcbiAgICAgICAgKSxcbiAgICAgIH07XG4gICAgY2FzZSBcInNhdmVMZXNzb25cIjpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG9wLFxuICAgICAgICBsZXNzb246IHBhcnNlTGVzc29uKHJlcXVpcmVkRmllbGQocmF3LCBcImxlc3NvblwiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCAodikgPT4gdikpLFxuICAgICAgfTtcbiAgICBjYXNlIFwic2V0TGVzc29uUmVzb3VyY2VzXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvcCxcbiAgICAgICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiXHU2NTU5XHU1QjY2XHU1NDdEXHU0RUU0XCIsIGFzU3RyKSxcbiAgICAgICAgcmVzb3VyY2VJZHM6IGFzQXJyYXkoXG4gICAgICAgICAgcmVxdWlyZWRGaWVsZChyYXcsIFwicmVzb3VyY2VJZHNcIiwgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcIiwgKHYpID0+IHYpLFxuICAgICAgICAgIFwicmVzb3VyY2VJZHNcIixcbiAgICAgICAgKS5tYXAoKHgpID0+IGFzU3RyKHgsIFwiXHU4RDQ0XHU2RTkwIElEXCIpKSxcbiAgICAgIH07XG4gICAgY2FzZSBcImF0dGVuZExlc3NvblwiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb3AsXG4gICAgICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCBhc1N0ciksXG4gICAgICAgIHByb2dyZXNzOiByZXF1aXJlZEZpZWxkKHJhdywgXCJwcm9ncmVzc1wiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCBhc1N0ciksXG4gICAgICB9O1xuICAgIGNhc2UgXCJwdWJsaXNoQXNzZXNzbWVudFwiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb3AsXG4gICAgICAgIGFzc2Vzc21lbnQ6IHBhcnNlQXNzZXNzbWVudChcbiAgICAgICAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJhc3Nlc3NtZW50XCIsIFwiXHU2NTU5XHU1QjY2XHU1NDdEXHU0RUU0XCIsICh2KSA9PiB2KSxcbiAgICAgICAgKSxcbiAgICAgIH07XG4gICAgY2FzZSBcImNvbmZpcm1QcmludGVkXCI6XG4gICAgY2FzZSBcInN0YXJ0RXhhbVwiOlxuICAgIGNhc2UgXCJlbmRFeGFtXCI6XG4gICAgY2FzZSBcImNsYWltRXZlbnRcIjpcbiAgICBjYXNlIFwiZmluaXNoRXZlbnRcIjpcbiAgICBjYXNlIFwicmV0cnlFdmVudFwiOlxuICAgIGNhc2UgXCJjb25maXJtUHJvZ3Jlc3NcIjpcbiAgICAgIHJldHVybiB7IG9wLCBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcIiwgYXNTdHIpIH07XG4gICAgY2FzZSBcInN1Ym1pdFwiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb3AsXG4gICAgICAgIHN1Ym1pc3Npb246IHBhcnNlU3VibWlzc2lvbihcbiAgICAgICAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJzdWJtaXNzaW9uXCIsIFwiXHU2NTU5XHU1QjY2XHU1NDdEXHU0RUU0XCIsICh2KSA9PiB2KSxcbiAgICAgICAgKSxcbiAgICAgIH07XG4gICAgY2FzZSBcInJlY29yZFF1ZXN0aW9uVGltZXNcIjpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG9wLFxuICAgICAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcIiwgYXNTdHIpLFxuICAgICAgICBxdWVzdGlvblRpbWVzOiBhc0FycmF5KFxuICAgICAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcInF1ZXN0aW9uVGltZXNcIiwgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcIiwgKHYpID0+IHYpLFxuICAgICAgICAgIFwicXVlc3Rpb25UaW1lc1wiLFxuICAgICAgICApLm1hcChwYXJzZVF1ZXN0aW9uVGltZSksXG4gICAgICB9O1xuICAgIGNhc2UgXCJncmFkZVwiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb3AsXG4gICAgICAgIGdyYWRlOiBwYXJzZUdyYWRlKHJlcXVpcmVkRmllbGQocmF3LCBcImdyYWRlXCIsIFwiXHU2NTU5XHU1QjY2XHU1NDdEXHU0RUU0XCIsICh2KSA9PiB2KSksXG4gICAgICB9O1xuICAgIGNhc2UgXCJzYXZlUmV2aWV3XCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvcCxcbiAgICAgICAgcmV2aWV3OiBwYXJzZVJldmlldyhyZXF1aXJlZEZpZWxkKHJhdywgXCJyZXZpZXdcIiwgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcIiwgKHYpID0+IHYpKSxcbiAgICAgIH07XG4gICAgY2FzZSBcInJlY29yZFByb2dyZXNzXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvcCxcbiAgICAgICAgcmVjb3JkOiBwYXJzZVByb2dyZXNzUmVjb3JkKFxuICAgICAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcInJlY29yZFwiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCAodikgPT4gdiksXG4gICAgICAgICksXG4gICAgICB9O1xuICAgIGNhc2UgXCJzdWJtaXRDb3JyZWN0aW9uXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvcCxcbiAgICAgICAgY29ycmVjdGlvbjogcGFyc2VDb3JyZWN0aW9uKFxuICAgICAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcImNvcnJlY3Rpb25cIiwgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcIiwgKHYpID0+IHYpLFxuICAgICAgICApLFxuICAgICAgfTtcbiAgICBjYXNlIFwicmV2aWV3Q29ycmVjdGlvblwiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb3AsXG4gICAgICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCBhc1N0ciksXG4gICAgICAgIGFjY2VwdGVkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJhY2NlcHRlZFwiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCBhc0Jvb2wpLFxuICAgICAgICBmZWVkYmFjazogcmVxdWlyZWRGaWVsZChyYXcsIFwiZmVlZGJhY2tcIiwgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcIiwgYXNTdHIpLFxuICAgICAgfTtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKGBcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcdTUzRDZcdTUwM0NcdTY1RTBcdTY1NDhcdUZGMUEke29wfWApO1xuICB9XG59XG5cbi8qKiBcdTUyQTlcdTYyNEJcdTRFMTNcdTVDNUVcdTU0N0RcdTRFRTRcdUZGMUFcdThCRkVcdTdBMEJcdTMwMDFcdTRGNUNcdTRFMUFcdTMwMDFcdThCRDVcdTUzNzdcdTU0OENcdTYyNzlcdTY1MzlcdTUzRUFcdTgwRkRcdTc1MzFcdTVCNjZcdTRFNjBcdTUyQTlcdTYyNEJcdTc1MUZcdTYyMTBcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3Npc3RhbnRPbmx5KGNvbW1hbmQ6IENvbW1hbmQpOiBib29sZWFuIHtcbiAgcmV0dXJuIFtcbiAgICBcInNhdmVTZW1lc3RlclwiLFxuICAgIFwic2F2ZUxlc3NvblwiLFxuICAgIFwicHVibGlzaEFzc2Vzc21lbnRcIixcbiAgICBcImdyYWRlXCIsXG4gICAgXCJyZWNvcmRRdWVzdGlvblRpbWVzXCIsXG4gICAgXCJzYXZlUmV2aWV3XCIsXG4gICAgXCJmaW5pc2hFdmVudFwiLFxuICAgIFwiY2xhaW1FdmVudFwiLFxuICAgIFwicmV2aWV3Q29ycmVjdGlvblwiLFxuICBdLmluY2x1ZGVzKGNvbW1hbmQub3ApO1xufVxuXG4vLyAtLS0tLS0tLS0tIFx1NUI5RVx1NEY1M1x1ODlFM1x1Njc5MC9cdTVFOEZcdTUyMTdcdTUzMTYgLS0tLS0tLS0tLVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQcm9qZWN0U3R1ZHkocmF3OiB1bmtub3duKTogUHJvamVjdFN0dWR5IHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTY1NTlcdTVCNjZcdTk4NzlcdTc2RUVcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24oXG4gICAgcmF3LFxuICAgIFtcbiAgICAgIFwicHJvamVjdElkXCIsXG4gICAgICBcImRpcmVjdG9yeVwiLFxuICAgICAgXCJleGFtTW9kZVwiLFxuICAgICAgXCJ2aXNpb25JZFwiLFxuICAgICAgXCJ0YXJnZXRcIixcbiAgICAgIFwiZXhhbURhdGVcIixcbiAgICAgIFwic3lsbGFidXNJZFwiLFxuICAgICAgXCJwYXN0UGFwZXJJZHNcIixcbiAgICAgIFwibW9ja1BhcGVySWRzXCIsXG4gICAgXSxcbiAgICBcIlx1NjU1OVx1NUI2Nlx1OTg3OVx1NzZFRVwiLFxuICApO1xuICByZXR1cm4ge1xuICAgIHByb2plY3RJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvamVjdElkXCIsIFwiXHU2NTU5XHU1QjY2XHU5ODc5XHU3NkVFXCIsIGFzU3RyKSxcbiAgICBkaXJlY3Rvcnk6IHJlcXVpcmVkRmllbGQocmF3LCBcImRpcmVjdG9yeVwiLCBcIlx1NjU1OVx1NUI2Nlx1OTg3OVx1NzZFRVwiLCBhc1N0ciksXG4gICAgZXhhbU1vZGU6IHJlcXVpcmVkRmllbGQocmF3LCBcImV4YW1Nb2RlXCIsIFwiXHU2NTU5XHU1QjY2XHU5ODc5XHU3NkVFXCIsIGFzQm9vbCksXG4gICAgdmlzaW9uSWQ6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJ2aXNpb25JZFwiLFxuICAgICAgXCJcdTY1NTlcdTVCNjZcdTk4NzlcdTc2RUVcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcInZpc2lvbklkXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgIHRhcmdldDogcmVxdWlyZWRGaWVsZChyYXcsIFwidGFyZ2V0XCIsIFwiXHU2NTU5XHU1QjY2XHU5ODc5XHU3NkVFXCIsIGFzU3RyKSxcbiAgICBleGFtRGF0ZTogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImV4YW1EYXRlXCIsXG4gICAgICBcIlx1NjU1OVx1NUI2Nlx1OTg3OVx1NzZFRVwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiZXhhbURhdGVcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gICAgc3lsbGFidXNJZDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInN5bGxhYnVzSWRcIixcbiAgICAgIFwiXHU2NTU5XHU1QjY2XHU5ODc5XHU3NkVFXCIsXG4gICAgICAodikgPT4gYXNPcHQodiwgXCJzeWxsYWJ1c0lkXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgIHBhc3RQYXBlcklkczogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInBhc3RQYXBlcklkc1wiLFxuICAgICAgXCJcdTY1NTlcdTVCNjZcdTk4NzlcdTc2RUVcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwicGFzdFBhcGVySWRzXCIpLm1hcCgoeCkgPT4gYXNTdHIoeCwgXCJcdTc3MUZcdTk4OTggSURcIikpLFxuICAgICAgW10sXG4gICAgKSxcbiAgICBtb2NrUGFwZXJJZHM6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJtb2NrUGFwZXJJZHNcIixcbiAgICAgIFwiXHU2NTU5XHU1QjY2XHU5ODc5XHU3NkVFXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcIm1vY2tQYXBlcklkc1wiKS5tYXAoKHgpID0+IGFzU3RyKHgsIFwiXHU2QTIxXHU2MkRGXHU5ODk4IElEXCIpKSxcbiAgICAgIFtdLFxuICAgICksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVQcm9qZWN0U3R1ZHkoXG4gIHA6IFByb2plY3RTdHVkeSxcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBwcm9qZWN0SWQ6IHAucHJvamVjdElkLFxuICAgIGRpcmVjdG9yeTogcC5kaXJlY3RvcnksXG4gICAgZXhhbU1vZGU6IHAuZXhhbU1vZGUsXG4gICAgdmlzaW9uSWQ6IHAudmlzaW9uSWQsXG4gICAgdGFyZ2V0OiBwLnRhcmdldCxcbiAgICBleGFtRGF0ZTogcC5leGFtRGF0ZSxcbiAgICBzeWxsYWJ1c0lkOiBwLnN5bGxhYnVzSWQsXG4gICAgcGFzdFBhcGVySWRzOiBwLnBhc3RQYXBlcklkcyxcbiAgICBtb2NrUGFwZXJJZHM6IHAubW9ja1BhcGVySWRzLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VSZXNvdXJjZShyYXc6IHVua25vd24pOiBSZXNvdXJjZSB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4RDQ0XHU2RTkwXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKFxuICAgIHJhdyxcbiAgICBbXCJpZFwiLCBcInByb2plY3RJZFwiLCBcInRpdGxlXCIsIFwia2luZFwiLCBcInBhdGhcIiwgXCJzb3VyY2VcIiwgXCJlZGl0aW9uXCIsIFwidG9waWNzXCJdLFxuICAgIFwiXHU4RDQ0XHU2RTkwXCIsXG4gICk7XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiXHU4RDQ0XHU2RTkwXCIsIGFzU3RyKSxcbiAgICBwcm9qZWN0SWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInByb2plY3RJZFwiLCBcIlx1OEQ0NFx1NkU5MFwiLCBhc1N0ciksXG4gICAgdGl0bGU6IHJlcXVpcmVkRmllbGQocmF3LCBcInRpdGxlXCIsIFwiXHU4RDQ0XHU2RTkwXCIsIGFzU3RyKSxcbiAgICBraW5kOiBvbmVPZihcbiAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcImtpbmRcIiwgXCJcdThENDRcdTZFOTBcIiwgKHYpID0+IHYpLFxuICAgICAgXCJcdThENDRcdTZFOTAga2luZFwiLFxuICAgICAgW1xuICAgICAgICBcInN5bGxhYnVzXCIsXG4gICAgICAgIFwiY291cnNlXCIsXG4gICAgICAgIFwiYm9va1wiLFxuICAgICAgICBcInBhc3RQYXBlclwiLFxuICAgICAgICBcIm1vY2tQYXBlclwiLFxuICAgICAgICBcInJlZmVyZW5jZVwiLFxuICAgICAgICBcImF0dGFjaG1lbnRcIixcbiAgICAgICAgXCJhbnN3ZXJTaGVldFwiLFxuICAgICAgXSxcbiAgICApIGFzIFJlc291cmNlS2luZCxcbiAgICBwYXRoOiByZXF1aXJlZEZpZWxkKHJhdywgXCJwYXRoXCIsIFwiXHU4RDQ0XHU2RTkwXCIsIGFzU3RyKSxcbiAgICBzb3VyY2U6IHJlcXVpcmVkRmllbGQocmF3LCBcInNvdXJjZVwiLCBcIlx1OEQ0NFx1NkU5MFwiLCBhc1N0ciksXG4gICAgZWRpdGlvbjogcmVxdWlyZWRGaWVsZChyYXcsIFwiZWRpdGlvblwiLCBcIlx1OEQ0NFx1NkU5MFwiLCBhc1N0ciksXG4gICAgdG9waWNzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidG9waWNzXCIsXG4gICAgICBcIlx1OEQ0NFx1NkU5MFwiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJ0b3BpY3NcIikubWFwKCh4KSA9PiBhc1N0cih4LCBcIlx1NzdFNVx1OEJDNlx1NzBCOVwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplUmVzb3VyY2UocjogUmVzb3VyY2UpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7XG4gICAgaWQ6IHIuaWQsXG4gICAgcHJvamVjdElkOiByLnByb2plY3RJZCxcbiAgICB0aXRsZTogci50aXRsZSxcbiAgICBraW5kOiByLmtpbmQsXG4gICAgcGF0aDogci5wYXRoLFxuICAgIHNvdXJjZTogci5zb3VyY2UsXG4gICAgZWRpdGlvbjogci5lZGl0aW9uLFxuICAgIHRvcGljczogci50b3BpY3MsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU1pbGVzdG9uZShyYXc6IHVua25vd24pOiBNaWxlc3RvbmUge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OTYzNlx1NkJCNVx1OEZEQlx1NUVBNlx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihcbiAgICByYXcsXG4gICAgW1wid2Vla1wiLCBcInRvcGljc1wiLCBcInJlc291cmNlSWRzXCIsIFwib2JqZWN0aXZlXCIsIFwibGVzc29uQ291bnRcIl0sXG4gICAgXCJcdTk2MzZcdTZCQjVcdThGREJcdTVFQTZcIixcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICB3ZWVrOiByZXF1aXJlZEZpZWxkKHJhdywgXCJ3ZWVrXCIsIFwiXHU5NjM2XHU2QkI1XHU4RkRCXHU1RUE2XCIsIGFzSW50KSxcbiAgICB0b3BpY3M6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJ0b3BpY3NcIixcbiAgICAgIFwiXHU5NjM2XHU2QkI1XHU4RkRCXHU1RUE2XCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcInRvcGljc1wiKS5tYXAoKHgpID0+IGFzU3RyKHgsIFwiXHU3N0U1XHU4QkM2XHU3MEI5XCIpKSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgcmVzb3VyY2VJZHM6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJyZXNvdXJjZUlkc1wiLFxuICAgICAgXCJcdTk2MzZcdTZCQjVcdThGREJcdTVFQTZcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwicmVzb3VyY2VJZHNcIikubWFwKCh4KSA9PiBhc1N0cih4LCBcIlx1OEQ0NFx1NkU5MCBJRFwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICAgIG9iamVjdGl2ZTogcmVxdWlyZWRGaWVsZChyYXcsIFwib2JqZWN0aXZlXCIsIFwiXHU5NjM2XHU2QkI1XHU4RkRCXHU1RUE2XCIsIGFzU3RyKSxcbiAgICBsZXNzb25Db3VudDogcmVxdWlyZWRGaWVsZChyYXcsIFwibGVzc29uQ291bnRcIiwgXCJcdTk2MzZcdTZCQjVcdThGREJcdTVFQTZcIiwgYXNJbnQpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplTWlsZXN0b25lKG06IE1pbGVzdG9uZSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICB3ZWVrOiBtLndlZWssXG4gICAgdG9waWNzOiBtLnRvcGljcyxcbiAgICByZXNvdXJjZUlkczogbS5yZXNvdXJjZUlkcyxcbiAgICBvYmplY3RpdmU6IG0ub2JqZWN0aXZlLFxuICAgIGxlc3NvbkNvdW50OiBtLmxlc3NvbkNvdW50LFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTZW1lc3RlcihyYXc6IHVua25vd24pOiBTZW1lc3RlciB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU1QjY2XHU2NzFGXHU4QkExXHU1MjEyXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKFxuICAgIHJhdyxcbiAgICBbXG4gICAgICBcImlkXCIsXG4gICAgICBcInByb2plY3RJZFwiLFxuICAgICAgXCJ0aXRsZVwiLFxuICAgICAgXCJzdGFydERhdGVcIixcbiAgICAgIFwiZW5kRGF0ZVwiLFxuICAgICAgXCJyZXZpc2lvblwiLFxuICAgICAgXCJiYXNlbGluZVwiLFxuICAgICAgXCJldmlkZW5jZVwiLFxuICAgICAgXCJyYXRpb25hbGVcIixcbiAgICAgIFwibWlsZXN0b25lc1wiLFxuICAgIF0sXG4gICAgXCJcdTVCNjZcdTY3MUZcdThCQTFcdTUyMTJcIixcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTVCNjZcdTY3MUZcdThCQTFcdTUyMTJcIiwgYXNTdHIpLFxuICAgIHByb2plY3RJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvamVjdElkXCIsIFwiXHU1QjY2XHU2NzFGXHU4QkExXHU1MjEyXCIsIGFzU3RyKSxcbiAgICB0aXRsZTogcmVxdWlyZWRGaWVsZChyYXcsIFwidGl0bGVcIiwgXCJcdTVCNjZcdTY3MUZcdThCQTFcdTUyMTJcIiwgYXNTdHIpLFxuICAgIHN0YXJ0RGF0ZTogcmVxdWlyZWRGaWVsZChyYXcsIFwic3RhcnREYXRlXCIsIFwiXHU1QjY2XHU2NzFGXHU4QkExXHU1MjEyXCIsIGFzU3RyKSxcbiAgICBlbmREYXRlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJlbmREYXRlXCIsIFwiXHU1QjY2XHU2NzFGXHU4QkExXHU1MjEyXCIsIGFzU3RyKSxcbiAgICByZXZpc2lvbjogcmVxdWlyZWRGaWVsZChyYXcsIFwicmV2aXNpb25cIiwgXCJcdTVCNjZcdTY3MUZcdThCQTFcdTUyMTJcIiwgYXNJbnQpLFxuICAgIGJhc2VsaW5lOiByZXF1aXJlZEZpZWxkKHJhdywgXCJiYXNlbGluZVwiLCBcIlx1NUI2Nlx1NjcxRlx1OEJBMVx1NTIxMlwiLCBhc1N0ciksXG4gICAgZXZpZGVuY2U6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJldmlkZW5jZVwiLFxuICAgICAgXCJcdTVCNjZcdTY3MUZcdThCQTFcdTUyMTJcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwiZXZpZGVuY2VcIikubWFwKCh4KSA9PiBhc1N0cih4LCBcIlx1NEY5RFx1NjM2RVwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICAgIHJhdGlvbmFsZTogcmVxdWlyZWRGaWVsZChyYXcsIFwicmF0aW9uYWxlXCIsIFwiXHU1QjY2XHU2NzFGXHU4QkExXHU1MjEyXCIsIGFzU3RyKSxcbiAgICBtaWxlc3RvbmVzOiByZXF1aXJlZEZpZWxkKHJhdywgXCJtaWxlc3RvbmVzXCIsIFwiXHU1QjY2XHU2NzFGXHU4QkExXHU1MjEyXCIsICh2KSA9PlxuICAgICAgYXNBcnJheSh2LCBcIm1pbGVzdG9uZXNcIikubWFwKHBhcnNlTWlsZXN0b25lKSxcbiAgICApLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplU2VtZXN0ZXIoczogU2VtZXN0ZXIpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7XG4gICAgaWQ6IHMuaWQsXG4gICAgcHJvamVjdElkOiBzLnByb2plY3RJZCxcbiAgICB0aXRsZTogcy50aXRsZSxcbiAgICBzdGFydERhdGU6IHMuc3RhcnREYXRlLFxuICAgIGVuZERhdGU6IHMuZW5kRGF0ZSxcbiAgICByZXZpc2lvbjogcy5yZXZpc2lvbixcbiAgICBiYXNlbGluZTogcy5iYXNlbGluZSxcbiAgICBldmlkZW5jZTogcy5ldmlkZW5jZSxcbiAgICByYXRpb25hbGU6IHMucmF0aW9uYWxlLFxuICAgIG1pbGVzdG9uZXM6IHMubWlsZXN0b25lcy5tYXAoc2VyaWFsaXplTWlsZXN0b25lKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTGVzc29uKHJhdzogdW5rbm93bik6IExlc3NvbiB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4QkZFXHU3QTBCXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKFxuICAgIHJhdyxcbiAgICBbXG4gICAgICBcImlkXCIsXG4gICAgICBcInByb2plY3RJZFwiLFxuICAgICAgXCJzZW1lc3RlcklkXCIsXG4gICAgICBcInNlbWVzdGVyUmV2aXNpb25cIixcbiAgICAgIFwidGl0bGVcIixcbiAgICAgIFwidG9waWNzXCIsXG4gICAgICBcInJlc291cmNlSWRzXCIsXG4gICAgICBcInN0YXJ0c0F0XCIsXG4gICAgICBcImVuZHNBdFwiLFxuICAgICAgXCJhaUVuYWJsZWRcIixcbiAgICAgIFwiYXR0ZW5kZWRcIixcbiAgICAgIFwicHJvZ3Jlc3NcIixcbiAgICAgIFwic3RhdGVcIixcbiAgICBdLFxuICAgIFwiXHU4QkZFXHU3QTBCXCIsXG4gICk7XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiXHU4QkZFXHU3QTBCXCIsIGFzU3RyKSxcbiAgICBwcm9qZWN0SWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInByb2plY3RJZFwiLCBcIlx1OEJGRVx1N0EwQlwiLCBhc1N0ciksXG4gICAgc2VtZXN0ZXJJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwic2VtZXN0ZXJJZFwiLCBcIlx1OEJGRVx1N0EwQlwiLCBhc1N0ciksXG4gICAgc2VtZXN0ZXJSZXZpc2lvbjogZmllbGQocmF3LCBcInNlbWVzdGVyUmV2aXNpb25cIiwgXCJcdThCRkVcdTdBMEJcIiwgYXNJbnQsIDEpLFxuICAgIHRpdGxlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJ0aXRsZVwiLCBcIlx1OEJGRVx1N0EwQlwiLCBhc1N0ciksXG4gICAgdG9waWNzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidG9waWNzXCIsXG4gICAgICBcIlx1OEJGRVx1N0EwQlwiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJ0b3BpY3NcIikubWFwKCh4KSA9PiBhc1N0cih4LCBcIlx1NzdFNVx1OEJDNlx1NzBCOVwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICAgIHJlc291cmNlSWRzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwicmVzb3VyY2VJZHNcIixcbiAgICAgIFwiXHU4QkZFXHU3QTBCXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcInJlc291cmNlSWRzXCIpLm1hcCgoeCkgPT4gYXNTdHIoeCwgXCJcdThENDRcdTZFOTAgSURcIikpLFxuICAgICAgW10sXG4gICAgKSxcbiAgICBzdGFydHNBdDogcmVxdWlyZWRGaWVsZChyYXcsIFwic3RhcnRzQXRcIiwgXCJcdThCRkVcdTdBMEJcIiwgYXNJbnQpLFxuICAgIGVuZHNBdDogcmVxdWlyZWRGaWVsZChyYXcsIFwiZW5kc0F0XCIsIFwiXHU4QkZFXHU3QTBCXCIsIGFzSW50KSxcbiAgICBhaUVuYWJsZWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImFpRW5hYmxlZFwiLCBcIlx1OEJGRVx1N0EwQlwiLCBhc0Jvb2wpLFxuICAgIGF0dGVuZGVkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJhdHRlbmRlZFwiLCBcIlx1OEJGRVx1N0EwQlwiLCBhc0Jvb2wpLFxuICAgIHByb2dyZXNzOiByZXF1aXJlZEZpZWxkKHJhdywgXCJwcm9ncmVzc1wiLCBcIlx1OEJGRVx1N0EwQlwiLCBhc1N0ciksXG4gICAgc3RhdGU6IG9uZU9mKFxuICAgICAgcmVxdWlyZWRGaWVsZChyYXcsIFwic3RhdGVcIiwgXCJcdThCRkVcdTdBMEJcIiwgKHYpID0+IHYpLFxuICAgICAgXCJcdThCRkVcdTdBMEIgc3RhdGVcIixcbiAgICAgIFtcInBsYW5uZWRcIiwgXCJhY3RpdmVcIiwgXCJlbmRlZFwiLCBcIm1pc3NlZFwiXSxcbiAgICApIGFzIExlc3NvblN0YXRlLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplTGVzc29uKGw6IExlc3Nvbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogbC5pZCxcbiAgICBwcm9qZWN0SWQ6IGwucHJvamVjdElkLFxuICAgIHNlbWVzdGVySWQ6IGwuc2VtZXN0ZXJJZCxcbiAgICBzZW1lc3RlclJldmlzaW9uOiBsLnNlbWVzdGVyUmV2aXNpb24sXG4gICAgdGl0bGU6IGwudGl0bGUsXG4gICAgdG9waWNzOiBsLnRvcGljcyxcbiAgICByZXNvdXJjZUlkczogbC5yZXNvdXJjZUlkcyxcbiAgICBzdGFydHNBdDogbC5zdGFydHNBdCxcbiAgICBlbmRzQXQ6IGwuZW5kc0F0LFxuICAgIGFpRW5hYmxlZDogbC5haUVuYWJsZWQsXG4gICAgYXR0ZW5kZWQ6IGwuYXR0ZW5kZWQsXG4gICAgcHJvZ3Jlc3M6IGwucHJvZ3Jlc3MsXG4gICAgc3RhdGU6IGwuc3RhdGUsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNjb3JpbmdQb2ludChyYXc6IHVua25vd24pOiBTY29yaW5nUG9pbnQge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJDNFx1NTIwNlx1NzBCOVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIFtcImlkXCIsIFwiZGVzY3JpcHRpb25cIiwgXCJwb2ludHNcIl0sIFwiXHU4QkM0XHU1MjA2XHU3MEI5XCIpO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1OEJDNFx1NTIwNlx1NzBCOVwiLCBhc1N0ciksXG4gICAgZGVzY3JpcHRpb246IHJlcXVpcmVkRmllbGQocmF3LCBcImRlc2NyaXB0aW9uXCIsIFwiXHU4QkM0XHU1MjA2XHU3MEI5XCIsIGFzU3RyKSxcbiAgICBwb2ludHM6IHJlcXVpcmVkRmllbGQocmF3LCBcInBvaW50c1wiLCBcIlx1OEJDNFx1NTIwNlx1NzBCOVwiLCBhc0ludCksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVTY29yaW5nUG9pbnQoXG4gIHA6IFNjb3JpbmdQb2ludCxcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHsgaWQ6IHAuaWQsIGRlc2NyaXB0aW9uOiBwLmRlc2NyaXB0aW9uLCBwb2ludHM6IHAucG9pbnRzIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVF1ZXN0aW9uKHJhdzogdW5rbm93bik6IFF1ZXN0aW9uIHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTk4OThcdTc2RUVcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24oXG4gICAgcmF3LFxuICAgIFtcbiAgICAgIFwiaWRcIixcbiAgICAgIFwicHJvbXB0XCIsXG4gICAgICBcInRvcGljc1wiLFxuICAgICAgXCJzb3VyY2VJZHNcIixcbiAgICAgIFwiZXh0ZW5zaW9uXCIsXG4gICAgICBcImVzdGltYXRlZE1pbnV0ZXNcIixcbiAgICAgIFwiYW5zd2VyXCIsXG4gICAgICBcImFjY2VwdGFibGVBbHRlcm5hdGl2ZXNcIixcbiAgICAgIFwic2NvcmluZ1wiLFxuICAgIF0sXG4gICAgXCJcdTk4OThcdTc2RUVcIixcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTk4OThcdTc2RUVcIiwgYXNTdHIpLFxuICAgIHByb21wdDogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvbXB0XCIsIFwiXHU5ODk4XHU3NkVFXCIsIGFzU3RyKSxcbiAgICB0b3BpY3M6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJ0b3BpY3NcIixcbiAgICAgIFwiXHU5ODk4XHU3NkVFXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcInRvcGljc1wiKS5tYXAoKHgpID0+IGFzU3RyKHgsIFwiXHU3N0U1XHU4QkM2XHU3MEI5XCIpKSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgc291cmNlSWRzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwic291cmNlSWRzXCIsXG4gICAgICBcIlx1OTg5OFx1NzZFRVwiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJzb3VyY2VJZHNcIikubWFwKCh4KSA9PiBhc1N0cih4LCBcIlx1Njc2NVx1NkU5MCBJRFwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICAgIGV4dGVuc2lvbjogcmVxdWlyZWRGaWVsZChyYXcsIFwiZXh0ZW5zaW9uXCIsIFwiXHU5ODk4XHU3NkVFXCIsIGFzQm9vbCksXG4gICAgZXN0aW1hdGVkTWludXRlczogcmVxdWlyZWRGaWVsZChyYXcsIFwiZXN0aW1hdGVkTWludXRlc1wiLCBcIlx1OTg5OFx1NzZFRVwiLCBhc0ludCksXG4gICAgYW5zd2VyOiByZXF1aXJlZEZpZWxkKHJhdywgXCJhbnN3ZXJcIiwgXCJcdTk4OThcdTc2RUVcIiwgYXNTdHIpLFxuICAgIGFjY2VwdGFibGVBbHRlcm5hdGl2ZXM6IHJlcXVpcmVkRmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImFjY2VwdGFibGVBbHRlcm5hdGl2ZXNcIixcbiAgICAgIFwiXHU5ODk4XHU3NkVFXCIsXG4gICAgICBhc1N0cixcbiAgICApLFxuICAgIHNjb3Jpbmc6IHJlcXVpcmVkRmllbGQocmF3LCBcInNjb3JpbmdcIiwgXCJcdTk4OThcdTc2RUVcIiwgKHYpID0+XG4gICAgICBhc0FycmF5KHYsIFwic2NvcmluZ1wiKS5tYXAocGFyc2VTY29yaW5nUG9pbnQpLFxuICAgICksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVRdWVzdGlvbihxOiBRdWVzdGlvbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogcS5pZCxcbiAgICBwcm9tcHQ6IHEucHJvbXB0LFxuICAgIHRvcGljczogcS50b3BpY3MsXG4gICAgc291cmNlSWRzOiBxLnNvdXJjZUlkcyxcbiAgICBleHRlbnNpb246IHEuZXh0ZW5zaW9uLFxuICAgIGVzdGltYXRlZE1pbnV0ZXM6IHEuZXN0aW1hdGVkTWludXRlcyxcbiAgICBhbnN3ZXI6IHEuYW5zd2VyLFxuICAgIGFjY2VwdGFibGVBbHRlcm5hdGl2ZXM6IHEuYWNjZXB0YWJsZUFsdGVybmF0aXZlcyxcbiAgICBzY29yaW5nOiBxLnNjb3JpbmcubWFwKHNlcmlhbGl6ZVNjb3JpbmdQb2ludCksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFzc2Vzc21lbnQocmF3OiB1bmtub3duKTogQXNzZXNzbWVudCB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4QkQ1XHU5ODk4XHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKFxuICAgIHJhdyxcbiAgICBbXG4gICAgICBcImlkXCIsXG4gICAgICBcInByb2plY3RJZFwiLFxuICAgICAgXCJzZW1lc3RlcklkXCIsXG4gICAgICBcInNlbWVzdGVyUmV2aXNpb25cIixcbiAgICAgIFwibGVzc29uSWRcIixcbiAgICAgIFwidGFza0lkXCIsXG4gICAgICBcInJldGVzdE9mR3JhZGVJZFwiLFxuICAgICAgXCJ0aXRsZVwiLFxuICAgICAgXCJraW5kXCIsXG4gICAgICBcInJldmlzaW9uXCIsXG4gICAgICBcInN0YXJ0c0F0XCIsXG4gICAgICBcImVuZHNBdFwiLFxuICAgICAgXCJpbnN0cnVjdGlvbnNcIixcbiAgICAgIFwicmV2aWV3RXZpZGVuY2VcIixcbiAgICAgIFwicXVlc3Rpb25zXCIsXG4gICAgICBcInB1Ymxpc2hlZEF0XCIsXG4gICAgICBcInByaW50ZWRBdFwiLFxuICAgICAgXCJzdGFydGVkQXRcIixcbiAgICAgIFwic3RvcHBlZEF0XCIsXG4gICAgXSxcbiAgICBcIlx1OEJENVx1OTg5OFwiLFxuICApO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1OEJENVx1OTg5OFwiLCBhc1N0ciksXG4gICAgcHJvamVjdElkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJwcm9qZWN0SWRcIiwgXCJcdThCRDVcdTk4OThcIiwgYXNTdHIpLFxuICAgIHNlbWVzdGVySWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInNlbWVzdGVySWRcIiwgXCJcdThCRDVcdTk4OThcIiwgYXNTdHIpLFxuICAgIHNlbWVzdGVyUmV2aXNpb246IGZpZWxkKHJhdywgXCJzZW1lc3RlclJldmlzaW9uXCIsIFwiXHU4QkQ1XHU5ODk4XCIsIGFzSW50LCAxKSxcbiAgICBsZXNzb25JZDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImxlc3NvbklkXCIsXG4gICAgICBcIlx1OEJENVx1OTg5OFwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwibGVzc29uSWRcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gICAgdGFza0lkOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidGFza0lkXCIsXG4gICAgICBcIlx1OEJENVx1OTg5OFwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwidGFza0lkXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgIHJldGVzdE9mR3JhZGVJZDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInJldGVzdE9mR3JhZGVJZFwiLFxuICAgICAgXCJcdThCRDVcdTk4OThcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcInJldGVzdE9mR3JhZGVJZFwiLCBhc1N0ciksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgICB0aXRsZTogcmVxdWlyZWRGaWVsZChyYXcsIFwidGl0bGVcIiwgXCJcdThCRDVcdTk4OThcIiwgYXNTdHIpLFxuICAgIGtpbmQ6IG9uZU9mKFxuICAgICAgcmVxdWlyZWRGaWVsZChyYXcsIFwia2luZFwiLCBcIlx1OEJENVx1OTg5OFwiLCAodikgPT4gdiksXG4gICAgICBcIlx1OEJENVx1OTg5OCBraW5kXCIsXG4gICAgICBbXCJob21ld29ya1wiLCBcIndlZWtseUV4YW1cIiwgXCJtb2NrRXhhbVwiLCBcInJldGVzdFwiXSxcbiAgICApIGFzIEFzc2Vzc21lbnRLaW5kLFxuICAgIHJldmlzaW9uOiByZXF1aXJlZEZpZWxkKHJhdywgXCJyZXZpc2lvblwiLCBcIlx1OEJENVx1OTg5OFwiLCBhc0ludCksXG4gICAgc3RhcnRzQXQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInN0YXJ0c0F0XCIsIFwiXHU4QkQ1XHU5ODk4XCIsIGFzSW50KSxcbiAgICBlbmRzQXQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImVuZHNBdFwiLCBcIlx1OEJENVx1OTg5OFwiLCBhc0ludCksXG4gICAgaW5zdHJ1Y3Rpb25zOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpbnN0cnVjdGlvbnNcIiwgXCJcdThCRDVcdTk4OThcIiwgYXNTdHIpLFxuICAgIHJldmlld0V2aWRlbmNlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJyZXZpZXdFdmlkZW5jZVwiLCBcIlx1OEJENVx1OTg5OFwiLCBhc1N0ciksXG4gICAgcXVlc3Rpb25zOiByZXF1aXJlZEZpZWxkKHJhdywgXCJxdWVzdGlvbnNcIiwgXCJcdThCRDVcdTk4OThcIiwgKHYpID0+XG4gICAgICBhc0FycmF5KHYsIFwicXVlc3Rpb25zXCIpLm1hcChwYXJzZVF1ZXN0aW9uKSxcbiAgICApLFxuICAgIHB1Ymxpc2hlZEF0OiByZXF1aXJlZEZpZWxkKHJhdywgXCJwdWJsaXNoZWRBdFwiLCBcIlx1OEJENVx1OTg5OFwiLCBhc0ludCksXG4gICAgcHJpbnRlZEF0OiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwicHJpbnRlZEF0XCIsXG4gICAgICBcIlx1OEJENVx1OTg5OFwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwicHJpbnRlZEF0XCIsIGFzSW50KSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBudW1iZXIgfCBudWxsLFxuICAgIHN0YXJ0ZWRBdDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInN0YXJ0ZWRBdFwiLFxuICAgICAgXCJcdThCRDVcdTk4OThcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcInN0YXJ0ZWRBdFwiLCBhc0ludCksXG4gICAgICBudWxsLFxuICAgICkgYXMgbnVtYmVyIHwgbnVsbCxcbiAgICBzdG9wcGVkQXQ6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJzdG9wcGVkQXRcIixcbiAgICAgIFwiXHU4QkQ1XHU5ODk4XCIsXG4gICAgICAodikgPT4gYXNPcHQodiwgXCJzdG9wcGVkQXRcIiwgYXNJbnQpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIG51bWJlciB8IG51bGwsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVBc3Nlc3NtZW50KGE6IEFzc2Vzc21lbnQpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7XG4gICAgaWQ6IGEuaWQsXG4gICAgcHJvamVjdElkOiBhLnByb2plY3RJZCxcbiAgICBzZW1lc3RlcklkOiBhLnNlbWVzdGVySWQsXG4gICAgc2VtZXN0ZXJSZXZpc2lvbjogYS5zZW1lc3RlclJldmlzaW9uLFxuICAgIGxlc3NvbklkOiBhLmxlc3NvbklkLFxuICAgIHRhc2tJZDogYS50YXNrSWQsXG4gICAgcmV0ZXN0T2ZHcmFkZUlkOiBhLnJldGVzdE9mR3JhZGVJZCxcbiAgICB0aXRsZTogYS50aXRsZSxcbiAgICBraW5kOiBhLmtpbmQsXG4gICAgcmV2aXNpb246IGEucmV2aXNpb24sXG4gICAgc3RhcnRzQXQ6IGEuc3RhcnRzQXQsXG4gICAgZW5kc0F0OiBhLmVuZHNBdCxcbiAgICBpbnN0cnVjdGlvbnM6IGEuaW5zdHJ1Y3Rpb25zLFxuICAgIHJldmlld0V2aWRlbmNlOiBhLnJldmlld0V2aWRlbmNlLFxuICAgIHF1ZXN0aW9uczogYS5xdWVzdGlvbnMubWFwKHNlcmlhbGl6ZVF1ZXN0aW9uKSxcbiAgICBwdWJsaXNoZWRBdDogYS5wdWJsaXNoZWRBdCxcbiAgICBwcmludGVkQXQ6IGEucHJpbnRlZEF0LFxuICAgIHN0YXJ0ZWRBdDogYS5zdGFydGVkQXQsXG4gICAgc3RvcHBlZEF0OiBhLnN0b3BwZWRBdCxcbiAgfTtcbn1cblxuLyoqIFx1OEJBMVx1NTIxMlx1NTMzQVx1OTVGNFx1NEY5Qlx1NjVGNlx1OTU3Rlx1RkYxQlx1NUI5RVx1OTY0NVx1NUYwMFx1ODAwM1x1OEQ3N1x1OEJBMVx1NjVGNlx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4YW1EZWFkbGluZShhOiBBc3Nlc3NtZW50KTogbnVtYmVyIHtcbiAgcmV0dXJuIGEuc3RhcnRlZEF0ID09PSBudWxsXG4gICAgPyBhLmVuZHNBdFxuICAgIDogYS5zdGFydGVkQXQgKyAoYS5lbmRzQXQgLSBhLnN0YXJ0c0F0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU3VibWlzc2lvbihyYXc6IHVua25vd24pOiBTdWJtaXNzaW9uIHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTYzRDBcdTRFQTRcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24oXG4gICAgcmF3LFxuICAgIFtcbiAgICAgIFwiaWRcIixcbiAgICAgIFwiYXNzZXNzbWVudElkXCIsXG4gICAgICBcInN1Ym1pdHRlZEF0XCIsXG4gICAgICBcInJlc291cmNlSWRzXCIsXG4gICAgICBcImFuc3dlcnNcIixcbiAgICAgIFwidW5maW5pc2hlZFwiLFxuICAgICAgXCJxdWVzdGlvblRpbWVzXCIsXG4gICAgXSxcbiAgICBcIlx1NjNEMFx1NEVBNFwiLFxuICApO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1NjNEMFx1NEVBNFwiLCBhc1N0ciksXG4gICAgYXNzZXNzbWVudElkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJhc3Nlc3NtZW50SWRcIiwgXCJcdTYzRDBcdTRFQTRcIiwgYXNTdHIpLFxuICAgIHN1Ym1pdHRlZEF0OiByZXF1aXJlZEZpZWxkKHJhdywgXCJzdWJtaXR0ZWRBdFwiLCBcIlx1NjNEMFx1NEVBNFwiLCBhc0ludCksXG4gICAgcmVzb3VyY2VJZHM6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJyZXNvdXJjZUlkc1wiLFxuICAgICAgXCJcdTYzRDBcdTRFQTRcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwicmVzb3VyY2VJZHNcIikubWFwKCh4KSA9PiBhc1N0cih4LCBcIlx1OTY0NFx1NEVGNiBJRFwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICAgIGFuc3dlcnM6IHJlcXVpcmVkRmllbGQocmF3LCBcImFuc3dlcnNcIiwgXCJcdTYzRDBcdTRFQTRcIiwgYXNTdHIpLFxuICAgIHVuZmluaXNoZWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInVuZmluaXNoZWRcIiwgXCJcdTYzRDBcdTRFQTRcIiwgYXNCb29sKSxcbiAgICBxdWVzdGlvblRpbWVzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwicXVlc3Rpb25UaW1lc1wiLFxuICAgICAgXCJcdTYzRDBcdTRFQTRcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwicXVlc3Rpb25UaW1lc1wiKS5tYXAocGFyc2VRdWVzdGlvblRpbWUpLFxuICAgICAgW10sXG4gICAgKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVN1Ym1pc3Npb24oczogU3VibWlzc2lvbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogcy5pZCxcbiAgICBhc3Nlc3NtZW50SWQ6IHMuYXNzZXNzbWVudElkLFxuICAgIHN1Ym1pdHRlZEF0OiBzLnN1Ym1pdHRlZEF0LFxuICAgIHJlc291cmNlSWRzOiBzLnJlc291cmNlSWRzLFxuICAgIGFuc3dlcnM6IHMuYW5zd2VycyxcbiAgICB1bmZpbmlzaGVkOiBzLnVuZmluaXNoZWQsXG4gICAgcXVlc3Rpb25UaW1lczogcy5xdWVzdGlvblRpbWVzLm1hcChzZXJpYWxpemVRdWVzdGlvblRpbWUpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VRdWVzdGlvblRpbWUocmF3OiB1bmtub3duKTogUXVlc3Rpb25UaW1lIHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTVCOENcdTYyMTBcdTY1RjZcdTUyM0JcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24ocmF3LCBbXCJxdWVzdGlvbklkXCIsIFwibG9jYWxUaW1lXCJdLCBcIlx1NUI4Q1x1NjIxMFx1NjVGNlx1NTIzQlwiKTtcbiAgcmV0dXJuIHtcbiAgICBxdWVzdGlvbklkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJxdWVzdGlvbklkXCIsIFwiXHU1QjhDXHU2MjEwXHU2NUY2XHU1MjNCXCIsIGFzU3RyKSxcbiAgICBsb2NhbFRpbWU6IHJlcXVpcmVkRmllbGQocmF3LCBcImxvY2FsVGltZVwiLCBcIlx1NUI4Q1x1NjIxMFx1NjVGNlx1NTIzQlwiLCBhc1N0ciksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVRdWVzdGlvblRpbWUoXG4gIHQ6IFF1ZXN0aW9uVGltZSxcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHsgcXVlc3Rpb25JZDogdC5xdWVzdGlvbklkLCBsb2NhbFRpbWU6IHQubG9jYWxUaW1lIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVBvaW50QXdhcmQocmF3OiB1bmtub3duKTogUG9pbnRBd2FyZCB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4QkM0XHU1MjA2XHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKHJhdywgW1wicXVlc3Rpb25JZFwiLCBcInBvaW50SWRcIiwgXCJhd2FyZGVkXCIsIFwiZXZpZGVuY2VcIl0sIFwiXHU4QkM0XHU1MjA2XCIpO1xuICByZXR1cm4ge1xuICAgIHF1ZXN0aW9uSWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInF1ZXN0aW9uSWRcIiwgXCJcdThCQzRcdTUyMDZcIiwgYXNTdHIpLFxuICAgIHBvaW50SWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInBvaW50SWRcIiwgXCJcdThCQzRcdTUyMDZcIiwgYXNTdHIpLFxuICAgIGF3YXJkZWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImF3YXJkZWRcIiwgXCJcdThCQzRcdTUyMDZcIiwgYXNJbnQpLFxuICAgIGV2aWRlbmNlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJldmlkZW5jZVwiLCBcIlx1OEJDNFx1NTIwNlwiLCBhc1N0ciksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVQb2ludEF3YXJkKHA6IFBvaW50QXdhcmQpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7XG4gICAgcXVlc3Rpb25JZDogcC5xdWVzdGlvbklkLFxuICAgIHBvaW50SWQ6IHAucG9pbnRJZCxcbiAgICBhd2FyZGVkOiBwLmF3YXJkZWQsXG4gICAgZXZpZGVuY2U6IHAuZXZpZGVuY2UsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUVycm9yQW5hbHlzaXMocmF3OiB1bmtub3duKTogRXJyb3JBbmFseXNpcyB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU5NTE5XHU1NkUwXHU1MjA2XHU2NzkwXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKFxuICAgIHJhdyxcbiAgICBbXG4gICAgICBcInF1ZXN0aW9uSWRcIixcbiAgICAgIFwiY2F1c2VcIixcbiAgICAgIFwiZXZpZGVuY2VcIixcbiAgICAgIFwiY29ycmVjdGlvblwiLFxuICAgICAgXCJuZXh0Q2hlY2tcIixcbiAgICAgIFwicmV0ZXN0RGF0ZVwiLFxuICAgICAgXCJjb25maXJtZWRcIixcbiAgICBdLFxuICAgIFwiXHU5NTE5XHU1NkUwXHU1MjA2XHU2NzkwXCIsXG4gICk7XG4gIHJldHVybiB7XG4gICAgcXVlc3Rpb25JZDogcmVxdWlyZWRGaWVsZChyYXcsIFwicXVlc3Rpb25JZFwiLCBcIlx1OTUxOVx1NTZFMFx1NTIwNlx1Njc5MFwiLCBhc1N0ciksXG4gICAgY2F1c2U6IHJlcXVpcmVkRmllbGQocmF3LCBcImNhdXNlXCIsIFwiXHU5NTE5XHU1NkUwXHU1MjA2XHU2NzkwXCIsIGFzU3RyKSxcbiAgICBldmlkZW5jZTogcmVxdWlyZWRGaWVsZChyYXcsIFwiZXZpZGVuY2VcIiwgXCJcdTk1MTlcdTU2RTBcdTUyMDZcdTY3OTBcIiwgYXNTdHIpLFxuICAgIGNvcnJlY3Rpb246IHJlcXVpcmVkRmllbGQocmF3LCBcImNvcnJlY3Rpb25cIiwgXCJcdTk1MTlcdTU2RTBcdTUyMDZcdTY3OTBcIiwgYXNTdHIpLFxuICAgIG5leHRDaGVjazogcmVxdWlyZWRGaWVsZChyYXcsIFwibmV4dENoZWNrXCIsIFwiXHU5NTE5XHU1NkUwXHU1MjA2XHU2NzkwXCIsIGFzU3RyKSxcbiAgICByZXRlc3REYXRlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJyZXRlc3REYXRlXCIsIFwiXHU5NTE5XHU1NkUwXHU1MjA2XHU2NzkwXCIsIGFzU3RyKSxcbiAgICBjb25maXJtZWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImNvbmZpcm1lZFwiLCBcIlx1OTUxOVx1NTZFMFx1NTIwNlx1Njc5MFwiLCBhc0Jvb2wpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplRXJyb3JBbmFseXNpcyhcbiAgZTogRXJyb3JBbmFseXNpcyxcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBxdWVzdGlvbklkOiBlLnF1ZXN0aW9uSWQsXG4gICAgY2F1c2U6IGUuY2F1c2UsXG4gICAgZXZpZGVuY2U6IGUuZXZpZGVuY2UsXG4gICAgY29ycmVjdGlvbjogZS5jb3JyZWN0aW9uLFxuICAgIG5leHRDaGVjazogZS5uZXh0Q2hlY2ssXG4gICAgcmV0ZXN0RGF0ZTogZS5yZXRlc3REYXRlLFxuICAgIGNvbmZpcm1lZDogZS5jb25maXJtZWQsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUdyYWRlKHJhdzogdW5rbm93bik6IEdyYWRlIHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTYyNzlcdTY1MzlcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24oXG4gICAgcmF3LFxuICAgIFtcbiAgICAgIFwiaWRcIixcbiAgICAgIFwic3VibWlzc2lvbklkXCIsXG4gICAgICBcImFzc2Vzc21lbnRSZXZpc2lvblwiLFxuICAgICAgXCJncmFkZWRBdFwiLFxuICAgICAgXCJhd2FyZHNcIixcbiAgICAgIFwiZXJyb3JzXCIsXG4gICAgICBcIm5lZWRzUmV2aWV3XCIsXG4gICAgICBcImZlZWRiYWNrXCIsXG4gICAgXSxcbiAgICBcIlx1NjI3OVx1NjUzOVwiLFxuICApO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1NjI3OVx1NjUzOVwiLCBhc1N0ciksXG4gICAgc3VibWlzc2lvbklkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJzdWJtaXNzaW9uSWRcIiwgXCJcdTYyNzlcdTY1MzlcIiwgYXNTdHIpLFxuICAgIGFzc2Vzc21lbnRSZXZpc2lvbjogcmVxdWlyZWRGaWVsZChyYXcsIFwiYXNzZXNzbWVudFJldmlzaW9uXCIsIFwiXHU2Mjc5XHU2NTM5XCIsIGFzSW50KSxcbiAgICBncmFkZWRBdDogcmVxdWlyZWRGaWVsZChyYXcsIFwiZ3JhZGVkQXRcIiwgXCJcdTYyNzlcdTY1MzlcIiwgYXNJbnQpLFxuICAgIGF3YXJkczogcmVxdWlyZWRGaWVsZChyYXcsIFwiYXdhcmRzXCIsIFwiXHU2Mjc5XHU2NTM5XCIsICh2KSA9PlxuICAgICAgYXNBcnJheSh2LCBcImF3YXJkc1wiKS5tYXAocGFyc2VQb2ludEF3YXJkKSxcbiAgICApLFxuICAgIGVycm9yczogcmVxdWlyZWRGaWVsZChyYXcsIFwiZXJyb3JzXCIsIFwiXHU2Mjc5XHU2NTM5XCIsICh2KSA9PlxuICAgICAgYXNBcnJheSh2LCBcImVycm9yc1wiKS5tYXAocGFyc2VFcnJvckFuYWx5c2lzKSxcbiAgICApLFxuICAgIG5lZWRzUmV2aWV3OiByZXF1aXJlZEZpZWxkKHJhdywgXCJuZWVkc1Jldmlld1wiLCBcIlx1NjI3OVx1NjUzOVwiLCBhc0Jvb2wpLFxuICAgIGZlZWRiYWNrOiByZXF1aXJlZEZpZWxkKHJhdywgXCJmZWVkYmFja1wiLCBcIlx1NjI3OVx1NjUzOVwiLCBhc1N0ciksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVHcmFkZShnOiBHcmFkZSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogZy5pZCxcbiAgICBzdWJtaXNzaW9uSWQ6IGcuc3VibWlzc2lvbklkLFxuICAgIGFzc2Vzc21lbnRSZXZpc2lvbjogZy5hc3Nlc3NtZW50UmV2aXNpb24sXG4gICAgZ3JhZGVkQXQ6IGcuZ3JhZGVkQXQsXG4gICAgYXdhcmRzOiBnLmF3YXJkcy5tYXAoc2VyaWFsaXplUG9pbnRBd2FyZCksXG4gICAgZXJyb3JzOiBnLmVycm9ycy5tYXAoc2VyaWFsaXplRXJyb3JBbmFseXNpcyksXG4gICAgbmVlZHNSZXZpZXc6IGcubmVlZHNSZXZpZXcsXG4gICAgZmVlZGJhY2s6IGcuZmVlZGJhY2ssXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVJldmlldyhyYXc6IHVua25vd24pOiBSZXZpZXcge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NTkwRFx1NzZEOFx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihcbiAgICByYXcsXG4gICAgW1wiaWRcIiwgXCJkYXRlXCIsIFwicHJvamVjdElkXCIsIFwiZ3JhZGVJZHNcIiwgXCJmaW5kaW5nc1wiLCBcImFjdGlvbnNcIl0sXG4gICAgXCJcdTU5MERcdTc2RDhcIixcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTU5MERcdTc2RDhcIiwgYXNTdHIpLFxuICAgIGRhdGU6IHJlcXVpcmVkRmllbGQocmF3LCBcImRhdGVcIiwgXCJcdTU5MERcdTc2RDhcIiwgYXNTdHIpLFxuICAgIHByb2plY3RJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvamVjdElkXCIsIFwiXHU1OTBEXHU3NkQ4XCIsIGFzU3RyKSxcbiAgICBncmFkZUlkczogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImdyYWRlSWRzXCIsXG4gICAgICBcIlx1NTkwRFx1NzZEOFwiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJncmFkZUlkc1wiKS5tYXAoKHgpID0+IGFzU3RyKHgsIFwiXHU2Mjc5XHU2NTM5IElEXCIpKSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgZmluZGluZ3M6IHJlcXVpcmVkRmllbGQocmF3LCBcImZpbmRpbmdzXCIsIFwiXHU1OTBEXHU3NkQ4XCIsIGFzU3RyKSxcbiAgICBhY3Rpb25zOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiYWN0aW9uc1wiLFxuICAgICAgXCJcdTU5MERcdTc2RDhcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwiYWN0aW9uc1wiKS5tYXAoKHgpID0+IGFzU3RyKHgsIFwiXHU4ODRDXHU1MkE4XCIpKSxcbiAgICAgIFtdLFxuICAgICksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVSZXZpZXcocjogUmV2aWV3KTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4ge1xuICAgIGlkOiByLmlkLFxuICAgIGRhdGU6IHIuZGF0ZSxcbiAgICBwcm9qZWN0SWQ6IHIucHJvamVjdElkLFxuICAgIGdyYWRlSWRzOiByLmdyYWRlSWRzLFxuICAgIGZpbmRpbmdzOiByLmZpbmRpbmdzLFxuICAgIGFjdGlvbnM6IHIuYWN0aW9ucyxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVGVhY2hpbmdFdmVudChyYXc6IHVua25vd24pOiBUZWFjaGluZ0V2ZW50IHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTY1NTlcdTVCNjZcdTRFOEJcdTRFRjZcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24oXG4gICAgcmF3LFxuICAgIFtcImlkXCIsIFwicHJvamVjdElkXCIsIFwia2luZFwiLCBcInNvdXJjZUlkXCIsIFwic3RhdGVcIiwgXCJjcmVhdGVkQXRcIl0sXG4gICAgXCJcdTY1NTlcdTVCNjZcdTRFOEJcdTRFRjZcIixcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTY1NTlcdTVCNjZcdTRFOEJcdTRFRjZcIiwgYXNTdHIpLFxuICAgIHByb2plY3RJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvamVjdElkXCIsIFwiXHU2NTU5XHU1QjY2XHU0RThCXHU0RUY2XCIsIGFzU3RyKSxcbiAgICBraW5kOiByZXF1aXJlZEZpZWxkKHJhdywgXCJraW5kXCIsIFwiXHU2NTU5XHU1QjY2XHU0RThCXHU0RUY2XCIsIGFzU3RyKSxcbiAgICBzb3VyY2VJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwic291cmNlSWRcIiwgXCJcdTY1NTlcdTVCNjZcdTRFOEJcdTRFRjZcIiwgYXNTdHIpLFxuICAgIHN0YXRlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJzdGF0ZVwiLCBcIlx1NjU1OVx1NUI2Nlx1NEU4Qlx1NEVGNlwiLCBhc1N0ciksXG4gICAgY3JlYXRlZEF0OiByZXF1aXJlZEZpZWxkKHJhdywgXCJjcmVhdGVkQXRcIiwgXCJcdTY1NTlcdTVCNjZcdTRFOEJcdTRFRjZcIiwgYXNJbnQpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplVGVhY2hpbmdFdmVudChcbiAgZTogVGVhY2hpbmdFdmVudCxcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogZS5pZCxcbiAgICBwcm9qZWN0SWQ6IGUucHJvamVjdElkLFxuICAgIGtpbmQ6IGUua2luZCxcbiAgICBzb3VyY2VJZDogZS5zb3VyY2VJZCxcbiAgICBzdGF0ZTogZS5zdGF0ZSxcbiAgICBjcmVhdGVkQXQ6IGUuY3JlYXRlZEF0LFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQcm9ncmVzc1JlY29yZChyYXc6IHVua25vd24pOiBQcm9ncmVzc1JlY29yZCB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4RkRCXHU1RUE2XHU4QkIwXHU1RjU1XHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKFxuICAgIHJhdyxcbiAgICBbXG4gICAgICBcImlkXCIsXG4gICAgICBcInByb2plY3RJZFwiLFxuICAgICAgXCJ0b3BpY1wiLFxuICAgICAgXCJwb3NpdGlvblwiLFxuICAgICAgXCJzdGF0ZVwiLFxuICAgICAgXCJldmlkZW5jZVwiLFxuICAgICAgXCJuZXh0QWN0aW9uXCIsXG4gICAgICBcInNvdXJjZVwiLFxuICAgICAgXCJjb25maXJtZWRcIixcbiAgICAgIFwicmVjb3JkZWRBdFwiLFxuICAgIF0sXG4gICAgXCJcdThGREJcdTVFQTZcdThCQjBcdTVGNTVcIixcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdThGREJcdTVFQTZcdThCQjBcdTVGNTVcIiwgYXNTdHIpLFxuICAgIHByb2plY3RJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvamVjdElkXCIsIFwiXHU4RkRCXHU1RUE2XHU4QkIwXHU1RjU1XCIsIGFzU3RyKSxcbiAgICB0b3BpYzogcmVxdWlyZWRGaWVsZChyYXcsIFwidG9waWNcIiwgXCJcdThGREJcdTVFQTZcdThCQjBcdTVGNTVcIiwgYXNTdHIpLFxuICAgIHBvc2l0aW9uOiByZXF1aXJlZEZpZWxkKHJhdywgXCJwb3NpdGlvblwiLCBcIlx1OEZEQlx1NUVBNlx1OEJCMFx1NUY1NVwiLCBhc1N0ciksXG4gICAgc3RhdGU6IG9uZU9mKFxuICAgICAgcmVxdWlyZWRGaWVsZChyYXcsIFwic3RhdGVcIiwgXCJcdThGREJcdTVFQTZcdThCQjBcdTVGNTVcIiwgKHYpID0+IHYpLFxuICAgICAgXCJcdThGREJcdTVFQTYgc3RhdGVcIixcbiAgICAgIFtcInN0dWRpZWRcIiwgXCJwcmFjdGljaW5nXCIsIFwibmVlZHNSZXZpZXdcIl0sXG4gICAgKSBhcyBQcm9ncmVzc1JlY29yZFtcInN0YXRlXCJdLFxuICAgIGV2aWRlbmNlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJldmlkZW5jZVwiLCBcIlx1OEZEQlx1NUVBNlx1OEJCMFx1NUY1NVwiLCBhc1N0ciksXG4gICAgbmV4dEFjdGlvbjogcmVxdWlyZWRGaWVsZChyYXcsIFwibmV4dEFjdGlvblwiLCBcIlx1OEZEQlx1NUVBNlx1OEJCMFx1NUY1NVwiLCBhc1N0ciksXG4gICAgc291cmNlOiBvbmVPZihcbiAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcInNvdXJjZVwiLCBcIlx1OEZEQlx1NUVBNlx1OEJCMFx1NUY1NVwiLCAodikgPT4gdiksXG4gICAgICBcIlx1OEZEQlx1NUVBNiBzb3VyY2VcIixcbiAgICAgIFtcInVzZXJcIiwgXCJhc3Npc3RhbnRcIl0sXG4gICAgKSBhcyBQcm9ncmVzc1NvdXJjZSxcbiAgICBjb25maXJtZWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImNvbmZpcm1lZFwiLCBcIlx1OEZEQlx1NUVBNlx1OEJCMFx1NUY1NVwiLCBhc0Jvb2wpLFxuICAgIHJlY29yZGVkQXQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInJlY29yZGVkQXRcIiwgXCJcdThGREJcdTVFQTZcdThCQjBcdTVGNTVcIiwgYXNJbnQpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplUHJvZ3Jlc3NSZWNvcmQoXG4gIHI6IFByb2dyZXNzUmVjb3JkLFxuKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4ge1xuICAgIGlkOiByLmlkLFxuICAgIHByb2plY3RJZDogci5wcm9qZWN0SWQsXG4gICAgdG9waWM6IHIudG9waWMsXG4gICAgcG9zaXRpb246IHIucG9zaXRpb24sXG4gICAgc3RhdGU6IHIuc3RhdGUsXG4gICAgZXZpZGVuY2U6IHIuZXZpZGVuY2UsXG4gICAgbmV4dEFjdGlvbjogci5uZXh0QWN0aW9uLFxuICAgIHNvdXJjZTogci5zb3VyY2UsXG4gICAgY29uZmlybWVkOiByLmNvbmZpcm1lZCxcbiAgICByZWNvcmRlZEF0OiByLnJlY29yZGVkQXQsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNvcnJlY3Rpb24ocmF3OiB1bmtub3duKTogQ29ycmVjdGlvbiB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4QkEyXHU2QjYzXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKFxuICAgIHJhdyxcbiAgICBbXG4gICAgICBcImlkXCIsXG4gICAgICBcImdyYWRlSWRcIixcbiAgICAgIFwicXVlc3Rpb25JZFwiLFxuICAgICAgXCJleHBsYW5hdGlvblwiLFxuICAgICAgXCJyZXNvdXJjZUlkc1wiLFxuICAgICAgXCJzdWJtaXR0ZWRBdFwiLFxuICAgICAgXCJhY2NlcHRlZFwiLFxuICAgICAgXCJmZWVkYmFja1wiLFxuICAgICAgXCJyZXZpZXdlZEF0XCIsXG4gICAgXSxcbiAgICBcIlx1OEJBMlx1NkI2M1wiLFxuICApO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1OEJBMlx1NkI2M1wiLCBhc1N0ciksXG4gICAgZ3JhZGVJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiZ3JhZGVJZFwiLCBcIlx1OEJBMlx1NkI2M1wiLCBhc1N0ciksXG4gICAgcXVlc3Rpb25JZDogcmVxdWlyZWRGaWVsZChyYXcsIFwicXVlc3Rpb25JZFwiLCBcIlx1OEJBMlx1NkI2M1wiLCBhc1N0ciksXG4gICAgZXhwbGFuYXRpb246IHJlcXVpcmVkRmllbGQocmF3LCBcImV4cGxhbmF0aW9uXCIsIFwiXHU4QkEyXHU2QjYzXCIsIGFzU3RyKSxcbiAgICByZXNvdXJjZUlkczogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInJlc291cmNlSWRzXCIsXG4gICAgICBcIlx1OEJBMlx1NkI2M1wiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJyZXNvdXJjZUlkc1wiKS5tYXAoKHgpID0+IGFzU3RyKHgsIFwiXHU5NjQ0XHU0RUY2IElEXCIpKSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgc3VibWl0dGVkQXQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInN1Ym1pdHRlZEF0XCIsIFwiXHU4QkEyXHU2QjYzXCIsIGFzSW50KSxcbiAgICBhY2NlcHRlZDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImFjY2VwdGVkXCIsXG4gICAgICBcIlx1OEJBMlx1NkI2M1wiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiYWNjZXB0ZWRcIiwgYXNCb29sKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBib29sZWFuIHwgbnVsbCxcbiAgICBmZWVkYmFjazogZmllbGQocmF3LCBcImZlZWRiYWNrXCIsIFwiXHU4QkEyXHU2QjYzXCIsIGFzU3RyLCBcIlwiKSxcbiAgICByZXZpZXdlZEF0OiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwicmV2aWV3ZWRBdFwiLFxuICAgICAgXCJcdThCQTJcdTZCNjNcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcInJldmlld2VkQXRcIiwgYXNJbnQpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIG51bWJlciB8IG51bGwsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVDb3JyZWN0aW9uKGM6IENvcnJlY3Rpb24pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7XG4gICAgaWQ6IGMuaWQsXG4gICAgZ3JhZGVJZDogYy5ncmFkZUlkLFxuICAgIHF1ZXN0aW9uSWQ6IGMucXVlc3Rpb25JZCxcbiAgICBleHBsYW5hdGlvbjogYy5leHBsYW5hdGlvbixcbiAgICByZXNvdXJjZUlkczogYy5yZXNvdXJjZUlkcyxcbiAgICBzdWJtaXR0ZWRBdDogYy5zdWJtaXR0ZWRBdCxcbiAgICBhY2NlcHRlZDogYy5hY2NlcHRlZCxcbiAgICBmZWVkYmFjazogYy5mZWVkYmFjayxcbiAgICByZXZpZXdlZEF0OiBjLnJldmlld2VkQXQsXG4gIH07XG59XG5cbi8vIC0tLS0tLS0tLS0gXHU2ODIxXHU5QThDXHU4Rjg1XHU1MkE5IC0tLS0tLS0tLS1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrVGV4dChzOiBzdHJpbmcsIG1heDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiBzLnRyaW0oKS5sZW5ndGggPiAwICYmIEFycmF5LmZyb20ocykubGVuZ3RoIDw9IG1heDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkRWR1Y2F0aW9uRGF0ZShzOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIHMubGVuZ3RoID09PSAxMCAmJiB2YWxpZERhdGUocyk7XG59XG5cbi8qKiBcdTVCODlcdTUxNjhcdTc2ODRcdTk4NzlcdTc2RUVcdTUxODVcdTc2RjhcdTVCRjlcdThERUZcdTVGODRcdUZGMUFcdTk3NUVcdTdBN0FcdTMwMDFcdTY1RTBcdTUzQ0RcdTY1OUNcdTY3NjBcdTMwMDFcdTk3NUVcdTdFRERcdTVCRjlcdTMwMDFcdTY1RTAgYC4uYC9gLmAgXHU2QkI1XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gaXNSZWxhdGl2ZVBhdGgocGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGlmIChwYXRoLmxlbmd0aCA9PT0gMCB8fCBwYXRoLmluY2x1ZGVzKFwiXFxcXFwiKSB8fCBpc0Fic29sdXRlUGF0aChwYXRoKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IHN0cmlwcGVkID0gcGF0aC5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuICBpZiAoc3RyaXBwZWQubGVuZ3RoID09PSAwKSByZXR1cm4gcGF0aC5sZW5ndGggPiAwICYmIGZhbHNlO1xuICByZXR1cm4gc3RyaXBwZWRcbiAgICAuc3BsaXQoXCIvXCIpXG4gICAgLmV2ZXJ5KChzZWcpID0+IHNlZyAhPT0gXCIuXCIgJiYgc2VnICE9PSBcIi4uXCIgJiYgc2VnICE9PSBcIlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQWJzb2x1dGVQYXRoKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gL14oXFwvfFtBLVphLXpdOltcXFxcL118XFxcXFxcXFwpLy50ZXN0KHBhdGgpO1xufVxuXG4vLyAtLS0tLS0tLS0tIEVkdWNhdGlvbiBcdTY1NzBcdTYzNkVcdTdDN0IgLS0tLS0tLS0tLVxuXG5leHBvcnQgaW50ZXJmYWNlIEVkdWNhdGlvbkRhdGEge1xuICBmb2N1c1Rhc2tzOiBpbXBvcnQoXCIuL21vZGVsXCIpLlRlYWNoaW5nVGFza1tdO1xuICBwcm9qZWN0czogUHJvamVjdFN0dWR5W107XG4gIHJlc291cmNlczogUmVzb3VyY2VbXTtcbiAgc2VtZXN0ZXJzOiBTZW1lc3RlcltdO1xuICBzZW1lc3Rlckhpc3Rvcnk6IFNlbWVzdGVyW107XG4gIGxlc3NvbnM6IExlc3NvbltdO1xuICBhc3Nlc3NtZW50czogQXNzZXNzbWVudFtdO1xuICBzdWJtaXNzaW9uczogU3VibWlzc2lvbltdO1xuICBncmFkZXM6IEdyYWRlW107XG4gIHJldmlld3M6IFJldmlld1tdO1xuICBldmVudHM6IFRlYWNoaW5nRXZlbnRbXTtcbiAgY29tcGxldGVkVGFza3M6IENvbXBsZXRlZFN0dWR5VGFza1tdO1xuICBwcm9ncmVzczogUHJvZ3Jlc3NSZWNvcmRbXTtcbiAgY29ycmVjdGlvbnM6IENvcnJlY3Rpb25bXTtcbn1cblxuZXhwb3J0IGNsYXNzIEVkdWNhdGlvbiBpbXBsZW1lbnRzIEVkdWNhdGlvbkRhdGEge1xuICBmb2N1c1Rhc2tzOiBpbXBvcnQoXCIuL21vZGVsXCIpLlRlYWNoaW5nVGFza1tdID0gW107XG4gIHByb2plY3RzOiBQcm9qZWN0U3R1ZHlbXSA9IFtdO1xuICByZXNvdXJjZXM6IFJlc291cmNlW10gPSBbXTtcbiAgc2VtZXN0ZXJzOiBTZW1lc3RlcltdID0gW107XG4gIHNlbWVzdGVySGlzdG9yeTogU2VtZXN0ZXJbXSA9IFtdO1xuICBsZXNzb25zOiBMZXNzb25bXSA9IFtdO1xuICBhc3Nlc3NtZW50czogQXNzZXNzbWVudFtdID0gW107XG4gIHN1Ym1pc3Npb25zOiBTdWJtaXNzaW9uW10gPSBbXTtcbiAgZ3JhZGVzOiBHcmFkZVtdID0gW107XG4gIHJldmlld3M6IFJldmlld1tdID0gW107XG4gIGV2ZW50czogVGVhY2hpbmdFdmVudFtdID0gW107XG4gIGNvbXBsZXRlZFRhc2tzOiBDb21wbGV0ZWRTdHVkeVRhc2tbXSA9IFtdO1xuICBwcm9ncmVzczogUHJvZ3Jlc3NSZWNvcmRbXSA9IFtdO1xuICBjb3JyZWN0aW9uczogQ29ycmVjdGlvbltdID0gW107XG5cbiAgLyoqIFx1NkJDRlx1NkIyMVx1NjI2Qlx1NjNDRlx1NjIxNlx1NTNEOFx1NjZGNFx1NjVGNlx1OTFDRFx1NUVGQVx1RkYxQVx1NTQyQlx1NTA1Q1x1NzUyOFx1OTE0RFx1N0Y2RVx1NEUwRVx1NUY1Mlx1Njg2M1x1OEJBMVx1NTIxMlx1MzAwMiAqL1xuICByZXNvdXJjZVJlZmVyZW5jZUluZGV4KCk6IE1hcDxzdHJpbmcsIHN0cmluZ1tdPiB7XG4gICAgY29uc3QgcmVmcyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmdbXT4oKTtcbiAgICBjb25zdCBhZGQgPSAoaWRzOiBzdHJpbmdbXSwgbGFiZWw6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgICAgZm9yIChjb25zdCBpZCBvZiBuZXcgU2V0KGlkcykpIHtcbiAgICAgICAgY29uc3QgbGlzdCA9IHJlZnMuZ2V0KGlkKSA/PyBbXTtcbiAgICAgICAgbGlzdC5wdXNoKGxhYmVsKTtcbiAgICAgICAgcmVmcy5zZXQoaWQsIGxpc3QpO1xuICAgICAgfVxuICAgIH07XG4gICAgZm9yIChjb25zdCBwIG9mIHRoaXMucHJvamVjdHMpIHtcbiAgICAgIGFkZChcbiAgICAgICAgW3Auc3lsbGFidXNJZCwgLi4ucC5wYXN0UGFwZXJJZHMsIC4uLnAubW9ja1BhcGVySWRzXS5maWx0ZXIoXG4gICAgICAgICAgKHgpOiB4IGlzIHN0cmluZyA9PiB4ICE9PSBudWxsLFxuICAgICAgICApLFxuICAgICAgICBcIlx1OTg3OVx1NzZFRVx1NjU1OVx1NUI2Nlx1OTE0RFx1N0Y2RVwiLFxuICAgICAgKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBzIG9mIFsuLi50aGlzLnNlbWVzdGVycywgLi4udGhpcy5zZW1lc3Rlckhpc3RvcnldKSB7XG4gICAgICBmb3IgKGNvbnN0IG0gb2Ygcy5taWxlc3RvbmVzKSB7XG4gICAgICAgIGFkZChtLnJlc291cmNlSWRzLCBgJHtzLnRpdGxlfSB2JHtzLnJldmlzaW9ufSBcdTdCMkMke20ud2Vla31cdTU0NjhgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBsIG9mIHRoaXMubGVzc29ucykge1xuICAgICAgYWRkKGwucmVzb3VyY2VJZHMsIGBcdThCRkVcdTdBMEJcdUZGMUEke2wudGl0bGV9YCk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgYSBvZiB0aGlzLmFzc2Vzc21lbnRzKSB7XG4gICAgICBmb3IgKGNvbnN0IHEgb2YgYS5xdWVzdGlvbnMpIHtcbiAgICAgICAgYWRkKHEuc291cmNlSWRzLCBgJHthLnRpdGxlfSAvICR7cS5pZH1gKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBzIG9mIHRoaXMuc3VibWlzc2lvbnMpIHtcbiAgICAgIGFkZChzLnJlc291cmNlSWRzLCBgXHU3QjU0XHU1Mzc3XHVGRjFBJHtzLmlkfWApO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGMgb2YgdGhpcy5jb3JyZWN0aW9ucykge1xuICAgICAgYWRkKGMucmVzb3VyY2VJZHMsIGBcdThCQTJcdTZCNjNcdUZGMUEke2MuaWR9YCk7XG4gICAgfVxuICAgIHJldHVybiByZWZzO1xuICB9XG5cbiAgcmVzb3VyY2VSZWZlcmVuY2VzKGlkOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMucmVzb3VyY2VSZWZlcmVuY2VJbmRleCgpLmdldChpZCkgPz8gW107XG4gIH1cblxuICBldmVudChwcm9qZWN0OiBzdHJpbmcsIGtpbmQ6IHN0cmluZywgc291cmNlOiBzdHJpbmcsIGF0OiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCBldmVudElkID0gYCR7a2luZH06JHtzb3VyY2V9YDtcbiAgICBpZiAoIXRoaXMuZXZlbnRzLnNvbWUoKGUpID0+IGUuaWQgPT09IGV2ZW50SWQpKSB7XG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKHtcbiAgICAgICAgaWQ6IGV2ZW50SWQsXG4gICAgICAgIHByb2plY3RJZDogcHJvamVjdCxcbiAgICAgICAga2luZCxcbiAgICAgICAgc291cmNlSWQ6IHNvdXJjZSxcbiAgICAgICAgc3RhdGU6IFwicGVuZGluZ1wiLFxuICAgICAgICBjcmVhdGVkQXQ6IGF0LFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgdGFza0NvbXBsZXRlZCh0YXNrOiBUYXNrLCBhdDogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3QgcmVjb3JkID0gY29tcGxldGVkU3R1ZHlUYXNrRnJvbVRhc2sodGFzaywgYXQpO1xuICAgIGlmIChyZWNvcmQgPT09IG51bGwpIHJldHVybjtcbiAgICBpZiAoXG4gICAgICB0aGlzLnByb2plY3RzLnNvbWUoXG4gICAgICAgIChwKSA9PiBwLnByb2plY3RJZCA9PT0gcmVjb3JkLnByb2plY3RJZCAmJiBwLmV4YW1Nb2RlLFxuICAgICAgKSAmJlxuICAgICAgIXRoaXMuY29tcGxldGVkVGFza3Muc29tZSgodCkgPT4gdC5pZCA9PT0gcmVjb3JkLmlkKVxuICAgICkge1xuICAgICAgY29uc3QgbGluayA9IHRoaXMuZm9jdXNUYXNrcy5maW5kKChsKSA9PiBsLnRhc2tJZCA9PT0gcmVjb3JkLmlkKTtcbiAgICAgIGlmIChsaW5rICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgbGVzc29uID0gdGhpcy5sZXNzb25zLmZpbmQoKGwpID0+IGwuaWQgPT09IGxpbmsuc291cmNlSWQpO1xuICAgICAgICBpZiAobGVzc29uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICByZWNvcmQudG9waWNzID0gWy4uLmxlc3Nvbi50b3BpY3NdO1xuICAgICAgICAgIHJlY29yZC5ub3RlcyA9IGxlc3Nvbi5wcm9ncmVzcztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5ldmVudChyZWNvcmQucHJvamVjdElkLCBcInRhc2tIb21ld29ya1wiLCByZWNvcmQuaWQsIGF0KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuY29tcGxldGVkVGFza3MucHVzaChyZWNvcmQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBcdThCRkVcdTdBMEIvXHU4MDAzXHU4QkQ1XHU1MjMwXHU3MEI5XHU2M0E4XHU4RkRCXHUzMDAxXHU2MzAxXHU0RTQ1XHU1MzE2XHU2NTU5XHU1QjY2XHU0RThCXHU0RUY2XHUzMDAyICovXG4gIHRpY2soYXQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gICAgY29uc3QgZXZlbnRzOiB7IHByb2plY3Q6IHN0cmluZzsga2luZDogc3RyaW5nOyBzb3VyY2U6IHN0cmluZyB9W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGxlc3NvbiBvZiB0aGlzLmxlc3NvbnMpIHtcbiAgICAgIGlmIChcbiAgICAgICAgKGxlc3Nvbi5zdGF0ZSA9PT0gXCJwbGFubmVkXCIgfHwgbGVzc29uLnN0YXRlID09PSBcImFjdGl2ZVwiKSAmJlxuICAgICAgICBhdCA+PSBsZXNzb24uZW5kc0F0XG4gICAgICApIHtcbiAgICAgICAgbGVzc29uLnN0YXRlID0gbGVzc29uLmF0dGVuZGVkID8gXCJlbmRlZFwiIDogXCJtaXNzZWRcIjtcbiAgICAgICAgaWYgKGxlc3Nvbi5haUVuYWJsZWQgJiYgbGVzc29uLmF0dGVuZGVkKSB7XG4gICAgICAgICAgZXZlbnRzLnB1c2goe1xuICAgICAgICAgICAgcHJvamVjdDogbGVzc29uLnByb2plY3RJZCxcbiAgICAgICAgICAgIGtpbmQ6IFwiaG9tZXdvcmtcIixcbiAgICAgICAgICAgIHNvdXJjZTogbGVzc29uLmlkLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChsZXNzb24uc3RhdGUgPT09IFwicGxhbm5lZFwiICYmIGF0ID49IGxlc3Nvbi5zdGFydHNBdCkge1xuICAgICAgICBsZXNzb24uc3RhdGUgPSBcImFjdGl2ZVwiO1xuICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBhIG9mIHRoaXMuYXNzZXNzbWVudHMpIHtcbiAgICAgIGlmIChcbiAgICAgICAgKGEua2luZCA9PT0gXCJob21ld29ya1wiIHx8IGEuc3RhcnRlZEF0ICE9PSBudWxsKSAmJlxuICAgICAgICBhLnN0b3BwZWRBdCA9PT0gbnVsbCAmJlxuICAgICAgICBhdCA+PSBleGFtRGVhZGxpbmUoYSlcbiAgICAgICkge1xuICAgICAgICBhLnN0b3BwZWRBdCA9IGV4YW1EZWFkbGluZShhKTtcbiAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgeyBwcm9qZWN0LCBraW5kLCBzb3VyY2UgfSBvZiBldmVudHMpIHtcbiAgICAgIHRoaXMuZXZlbnQocHJvamVjdCwga2luZCwgc291cmNlLCBhdCk7XG4gICAgfVxuICAgIC8vIFx1NkJDRlx1NjVFNVx1NTkwRFx1NzZEOFx1NjMwMVx1NEU0NVx1RkYxQVx1NTMwNVx1NjJFQyAwODozMCBcdTVFOTRcdTc1MjhcdTY3MkFcdTVGMDBcdTc2ODRcdTY1RTVcdTY3MUZcdTMwMDJcbiAgICBjb25zdCBncmFkZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBmb3IgKGNvbnN0IGcgb2YgdGhpcy5ncmFkZXMpIHtcbiAgICAgIGNvbnN0IG5vd01pbnV0ZXMgPSBtaW51dGVzT2YoaG91ck1pbnV0ZU5vdyhhdCkpID8/IC0xO1xuICAgICAgaWYgKGRhdGVBdChnLmdyYWRlZEF0KSA8IGRhdGVBdChhdCkgJiYgbm93TWludXRlcyA+PSA1MTApIHtcbiAgICAgICAgY29uc3Qgc3ViID0gdGhpcy5zdWJtaXNzaW9ucy5maW5kKChzKSA9PiBzLmlkID09PSBnLnN1Ym1pc3Npb25JZCk7XG4gICAgICAgIGlmIChzdWIgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGEgPSB0aGlzLmFzc2Vzc21lbnRzLmZpbmQoKHgpID0+IHguaWQgPT09IHN1Yi5hc3Nlc3NtZW50SWQpO1xuICAgICAgICBpZiAoYSA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcbiAgICAgICAgZ3JhZGVzLmFkZChgJHthLnByb2plY3RJZH18JHtkYXRlQXQoZy5ncmFkZWRBdCl9YCk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgcGFpciBvZiBncmFkZXMpIHtcbiAgICAgIGNvbnN0IFtwLCBkXSA9IHBhaXIuc3BsaXQoXCJ8XCIpO1xuICAgICAgY29uc3QgbiA9IHRoaXMuZXZlbnRzLmxlbmd0aDtcbiAgICAgIHRoaXMuZXZlbnQocCEsIFwicmV2aWV3XCIsIGAke3B9OiR7ZH1gLCBhdCk7XG4gICAgICBpZiAodGhpcy5ldmVudHMubGVuZ3RoICE9PSBuKSBjaGFuZ2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgLy8gXHU1NDY4XHU0RTk0XHU4RDc3XHVGRjA4XHU1NDJCXHU1NDY4XHU2NzJCXHVGRjA5XHU0RTNBXHU0RUNEXHU1NzI4XHU4RkRCXHU4ODRDXHU0RTJEXHU3Njg0XHU1RTk0XHU4QkQ1XHU1QjY2XHU2NzFGXHU3NjdCXHU4QkIwXHU1NDY4XHU4MDAzXHU0RThCXHU0RUY2XHUzMDAyXG4gICAgY29uc3QgdG9kYXkgPSBsb2NhbERhdGVPZihhdCk7XG4gICAgaWYgKHdlZWtkYXlNb25kYXkodG9kYXkpID49IDUpIHtcbiAgICAgIGNvbnN0IHRlcm1zOiB7IHByb2plY3Q6IHN0cmluZzsgc291cmNlOiBzdHJpbmcgfVtdID0gW107XG4gICAgICBmb3IgKGNvbnN0IHMgb2YgdGhpcy5zZW1lc3RlcnMpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHMuc3RhcnREYXRlIDw9IGRhdGVBdChhdCkgJiZcbiAgICAgICAgICBzLmVuZERhdGUgPj0gZGF0ZUF0KGF0KSAmJlxuICAgICAgICAgIHRoaXMucHJvamVjdHMuc29tZSgocCkgPT4gcC5wcm9qZWN0SWQgPT09IHMucHJvamVjdElkICYmIHAuZXhhbU1vZGUpXG4gICAgICAgICkge1xuICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gcGFyc2VEYXRlKHMuc3RhcnREYXRlKSE7XG4gICAgICAgICAgY29uc3Qgd2VlayA9IE1hdGguZmxvb3IoZGF5c0JldHdlZW4oc3RhcnQsIHRvZGF5KSAvIDcpICsgMTtcbiAgICAgICAgICB0ZXJtcy5wdXNoKHsgcHJvamVjdDogcy5wcm9qZWN0SWQsIHNvdXJjZTogYCR7cy5pZH06d2VlayR7d2Vla31gIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IHsgcHJvamVjdCwgc291cmNlIH0gb2YgdGVybXMpIHtcbiAgICAgICAgY29uc3QgbiA9IHRoaXMuZXZlbnRzLmxlbmd0aDtcbiAgICAgICAgdGhpcy5ldmVudChwcm9qZWN0LCBcIndlZWtseUV4YW1cIiwgc291cmNlLCBhdCk7XG4gICAgICAgIGlmICh0aGlzLmV2ZW50cy5sZW5ndGggIT09IG4pIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2hhbmdlZDtcbiAgfVxuXG4gIC8qKiBcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcdTYyNjdcdTg4NENcdUZGMUFcdTY4MjFcdTlBOEMgXHUyMTkyIFx1NTNEOFx1NjZGNFx1RkYwQ1x1NTE2OFx1OTBFOFx1NjIxMFx1NTI5Rlx1NTQwRVx1NzUzMVx1NEUwQVx1NUM0Mlx1N0VERlx1NEUwMCB2YWxpZGF0ZVx1MzAwMiAqL1xuICBhcHBseShjb21tYW5kOiBDb21tYW5kLCBhdDogbnVtYmVyKTogdm9pZCB7XG4gICAgc3dpdGNoIChjb21tYW5kLm9wKSB7XG4gICAgICBjYXNlIFwicmVjb3JkUHJvZ3Jlc3NcIjoge1xuICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgIXRoaXMucHJvZ3Jlc3Muc29tZSgocikgPT4gci5pZCA9PT0gY29tbWFuZC5yZWNvcmQuaWQpLFxuICAgICAgICAgIFwiXHU4RkRCXHU1RUE2XHU4QkIwXHU1RjU1XHU0RTBEXHU1M0VGXHU4OTg2XHU3NkQ2XHVGRjBDXHU4QkY3XHU2NUIwXHU1ODlFXHU0RTAwXHU2NzYxXHU2NkY0XHU2QjYzXHU4QkIwXHU1RjU1XCIsXG4gICAgICAgICk7XG4gICAgICAgIGNvbW1hbmQucmVjb3JkLnJlY29yZGVkQXQgPSBhdDtcbiAgICAgICAgY29tbWFuZC5yZWNvcmQuY29uZmlybWVkID0gY29tbWFuZC5yZWNvcmQuc291cmNlID09PSBcInVzZXJcIjtcbiAgICAgICAgdGhpcy5wcm9ncmVzcy5wdXNoKGNvbW1hbmQucmVjb3JkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwiY29uZmlybVByb2dyZXNzXCI6IHtcbiAgICAgICAgY29uc3QgcmVjb3JkID0gdGhpcy5wcm9ncmVzcy5maW5kKChyKSA9PiByLmlkID09PSBjb21tYW5kLmlkKTtcbiAgICAgICAgZW5zdXJlKHJlY29yZCAhPT0gdW5kZWZpbmVkLCBcIlx1OEZEQlx1NUVBNlx1OEJCMFx1NUY1NVx1NEUwRFx1NUI1OFx1NTcyOFwiKTtcbiAgICAgICAgcmVjb3JkLmNvbmZpcm1lZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInN1Ym1pdENvcnJlY3Rpb25cIjoge1xuICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgIXRoaXMuY29ycmVjdGlvbnMuc29tZSgoYykgPT4gYy5pZCA9PT0gY29tbWFuZC5jb3JyZWN0aW9uLmlkKSxcbiAgICAgICAgICBcIlx1OEJBMlx1NkI2M1x1NzI0OFx1NjcyQ1x1NEUwRFx1NTNFRlx1ODk4Nlx1NzZENlwiLFxuICAgICAgICApO1xuICAgICAgICBjb21tYW5kLmNvcnJlY3Rpb24uc3VibWl0dGVkQXQgPSBhdDtcbiAgICAgICAgY29tbWFuZC5jb3JyZWN0aW9uLmFjY2VwdGVkID0gbnVsbDtcbiAgICAgICAgY29tbWFuZC5jb3JyZWN0aW9uLmZlZWRiYWNrID0gXCJcIjtcbiAgICAgICAgY29tbWFuZC5jb3JyZWN0aW9uLnJldmlld2VkQXQgPSBudWxsO1xuICAgICAgICBjb25zdCBwcm9qZWN0ID0gKCgpID0+IHtcbiAgICAgICAgICBjb25zdCBncmFkZSA9IHRoaXMuZ3JhZGVzLmZpbmQoXG4gICAgICAgICAgICAoZykgPT4gZy5pZCA9PT0gY29tbWFuZC5jb3JyZWN0aW9uLmdyYWRlSWQsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAoZ3JhZGUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgY29uc3Qgc3ViID0gdGhpcy5zdWJtaXNzaW9ucy5maW5kKChzKSA9PiBzLmlkID09PSBncmFkZS5zdWJtaXNzaW9uSWQpO1xuICAgICAgICAgIGlmIChzdWIgPT09IHVuZGVmaW5lZCkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgY29uc3QgYSA9IHRoaXMuYXNzZXNzbWVudHMuZmluZCgoeCkgPT4geC5pZCA9PT0gc3ViLmFzc2Vzc21lbnRJZCk7XG4gICAgICAgICAgcmV0dXJuIGE/LnByb2plY3RJZCA/PyBudWxsO1xuICAgICAgICB9KSgpO1xuICAgICAgICBlbnN1cmUocHJvamVjdCAhPT0gbnVsbCwgXCJcdThCQTJcdTZCNjNcdTdGM0FcdTVDMTFcdTUzOUZcdTU5Q0JcdTYyNzlcdTY1MzlcIik7XG4gICAgICAgIHRoaXMuZXZlbnQocHJvamVjdCwgXCJjb3JyZWN0aW9uXCIsIGNvbW1hbmQuY29ycmVjdGlvbi5pZCwgYXQpO1xuICAgICAgICB0aGlzLmNvcnJlY3Rpb25zLnB1c2goY29tbWFuZC5jb3JyZWN0aW9uKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwicmV2aWV3Q29ycmVjdGlvblwiOiB7XG4gICAgICAgIGNvbnN0IGNvcnJlY3Rpb24gPSB0aGlzLmNvcnJlY3Rpb25zLmZpbmQoXG4gICAgICAgICAgKGMpID0+IGMuaWQgPT09IGNvbW1hbmQuaWQgJiYgYy5yZXZpZXdlZEF0ID09PSBudWxsLFxuICAgICAgICApO1xuICAgICAgICBlbnN1cmUoY29ycmVjdGlvbiAhPT0gdW5kZWZpbmVkLCBcIlx1OEJBMlx1NkI2M1x1NURGMlx1NjhDMFx1NjdFNVx1NjIxNlx1NEUwRFx1NUI1OFx1NTcyOFwiKTtcbiAgICAgICAgZW5zdXJlKGNoZWNrVGV4dChjb21tYW5kLmZlZWRiYWNrLCA1MDAwMCksIFwiXHU4QkEyXHU2QjYzXHU2OEMwXHU2N0U1XHU5NzAwXHU4OTgxXHU1M0NEXHU5OTg4XCIpO1xuICAgICAgICBjb3JyZWN0aW9uLmFjY2VwdGVkID0gY29tbWFuZC5hY2NlcHRlZDtcbiAgICAgICAgY29ycmVjdGlvbi5mZWVkYmFjayA9IGNvbW1hbmQuZmVlZGJhY2s7XG4gICAgICAgIGNvcnJlY3Rpb24ucmV2aWV3ZWRBdCA9IGF0O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJzYXZlUHJvamVjdFwiOiB7XG4gICAgICAgIHVwc2VydEJ5KHRoaXMucHJvamVjdHMsIGNvbW1hbmQucHJvamVjdCwgKHgpID0+IHgucHJvamVjdElkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwic2F2ZVJlc291cmNlXCI6IHtcbiAgICAgICAgdXBzZXJ0QnkodGhpcy5yZXNvdXJjZXMsIGNvbW1hbmQucmVzb3VyY2UsICh4KSA9PiB4LmlkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwic2F2ZVJlc291cmNlc1wiOiB7XG4gICAgICAgIC8vIFx1NjI3OVx1OTFDRlx1NzY3Qlx1OEJCMFx1NTNFQVx1ODQzRFx1NEUwMFx1NkIyMVx1NzZEOFx1RkYxQVx1OTAxMFx1Njc2MSBzYXZlUmVzb3VyY2UgXHU0RjFBXHU4QkE5IHBsYW4uanNvbiBcdTg4QUJcdTkxQ0RcdTUxOTkgTiBcdTZCMjFcbiAgICAgICAgLy8gXHVGRjA4XHU4RDQ0XHU2NTk5XHU1RTkzXHU1MkE4XHU4Rjg0XHU0RTBBXHU1MzQzXHU2NzYxXHVGRjA5XHVGRjBDXHU4RkQ5XHU2NjJGXHUzMDBDXHU2MzA5XHU5ODc5XHU3NkVFXHU2NTc0XHU3NkVFXHU1RjU1XHU1QkZDXHU1MTY1XHUzMDBEXHU1RkM1XHU5ODdCXHU4RDcwXHU2Mjc5XHU5MUNGXHU3Njg0XHU1MzlGXHU1NkUwXHUzMDAyXG4gICAgICAgIGZvciAoY29uc3QgcmVzb3VyY2Ugb2YgY29tbWFuZC5yZXNvdXJjZXMpIHtcbiAgICAgICAgICB1cHNlcnRCeSh0aGlzLnJlc291cmNlcywgcmVzb3VyY2UsICh4KSA9PiB4LmlkKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJyZW1vdmVSZXNvdXJjZXNcIjoge1xuICAgICAgICBlbnN1cmUoY29tbWFuZC5pZHMubGVuZ3RoID4gMCwgXCJcdThCRjdcdTkwMDlcdTYyRTlcdTg5ODFcdTZFMDVcdTc0MDZcdTc2ODRcdThENDRcdTZFOTBcdTc2N0JcdThCQjBcIik7XG4gICAgICAgIGNvbnN0IHJlZmVyZW5jZWQgPSB0aGlzLnJlc291cmNlUmVmZXJlbmNlSW5kZXgoKTtcbiAgICAgICAgY29uc3Qga25vd24gPSBuZXcgU2V0KHRoaXMucmVzb3VyY2VzLm1hcCgocikgPT4gci5pZCkpO1xuICAgICAgICBmb3IgKGNvbnN0IGlkIG9mIGNvbW1hbmQuaWRzKSB7XG4gICAgICAgICAgZW5zdXJlKGtub3duLmhhcyhpZCksIFwiXHU4RDQ0XHU2RTkwXHU3NjdCXHU4QkIwXHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICAgIGVuc3VyZShcbiAgICAgICAgICAgICFyZWZlcmVuY2VkLmhhcyhpZCksXG4gICAgICAgICAgICBcIlx1OEQ0NFx1NkU5MFx1NEVDRFx1ODhBQlx1NjU1OVx1NUI2Nlx1OTE0RFx1N0Y2RVx1NjIxNlx1NTM4Nlx1NTNGMlx1OEJCMFx1NUY1NVx1NUYxNVx1NzUyOFx1RkYwQ1x1OEJGN1x1NEZFRVx1NTkwRFx1OERFRlx1NUY4NFx1NUU3Nlx1NEZERFx1NzU1OVx1NzY3Qlx1OEJCMFwiLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaWRzID0gbmV3IFNldChjb21tYW5kLmlkcyk7XG4gICAgICAgIHRoaXMucmVzb3VyY2VzID0gdGhpcy5yZXNvdXJjZXMuZmlsdGVyKChyKSA9PiAhaWRzLmhhcyhyLmlkKSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInNhdmVTZW1lc3RlclwiOiB7XG4gICAgICAgIGNvbnN0IG9sZCA9IHRoaXMuc2VtZXN0ZXJzLmZpbmQoKHMpID0+IHMuaWQgPT09IGNvbW1hbmQuc2VtZXN0ZXIuaWQpO1xuICAgICAgICBpZiAob2xkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgICBjb21tYW5kLnNlbWVzdGVyLnJldmlzaW9uID09PSBvbGQucmV2aXNpb24gKyAxLFxuICAgICAgICAgICAgXCJcdTVCNjZcdTY3MUZcdThCQTFcdTUyMTJcdTY2RjRcdTY1QjBcdTVGQzVcdTk4N0JcdTkwMTJcdTU4OUVcdTcyNDhcdTY3MkNcIixcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuc2VtZXN0ZXJIaXN0b3J5LnB1c2goe1xuICAgICAgICAgICAgLi4ub2xkLFxuICAgICAgICAgICAgbWlsZXN0b25lczogb2xkLm1pbGVzdG9uZXMubWFwKChtKSA9PiAoe1xuICAgICAgICAgICAgICAuLi5tLFxuICAgICAgICAgICAgICB0b3BpY3M6IFsuLi5tLnRvcGljc10sXG4gICAgICAgICAgICAgIHJlc291cmNlSWRzOiBbLi4ubS5yZXNvdXJjZUlkc10sXG4gICAgICAgICAgICB9KSksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdXBzZXJ0QnkodGhpcy5zZW1lc3RlcnMsIGNvbW1hbmQuc2VtZXN0ZXIsICh4KSA9PiB4LmlkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwic2F2ZUxlc3NvblwiOiB7XG4gICAgICAgIGNvbnN0IHNlbWVzdGVyID0gdGhpcy5zZW1lc3RlcnMuZmluZChcbiAgICAgICAgICAocykgPT4gcy5pZCA9PT0gY29tbWFuZC5sZXNzb24uc2VtZXN0ZXJJZCxcbiAgICAgICAgKTtcbiAgICAgICAgZW5zdXJlKHNlbWVzdGVyICE9PSB1bmRlZmluZWQsIFwiXHU1QjY2XHU2NzFGXHU4QkExXHU1MjEyXHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICBjb21tYW5kLmxlc3Nvbi5zZW1lc3RlclJldmlzaW9uID0gc2VtZXN0ZXIucmV2aXNpb247XG4gICAgICAgIGVuc3VyZShjb21tYW5kLmxlc3Nvbi5zdGFydHNBdCA+IGF0LCBcIlx1OEJGRVx1N0EwQlx1NUZDNVx1OTg3Qlx1NUI4OVx1NjM5Mlx1NTcyOFx1NjcyQVx1Njc2NVwiKTtcbiAgICAgICAgZW5zdXJlKFxuICAgICAgICAgICF0aGlzLmxlc3NvbnMuc29tZShcbiAgICAgICAgICAgIChsKSA9PlxuICAgICAgICAgICAgICBsLmlkID09PSBjb21tYW5kLmxlc3Nvbi5pZCAmJlxuICAgICAgICAgICAgICAobC5zdGF0ZSAhPT0gXCJwbGFubmVkXCIgfHwgbC5hdHRlbmRlZCksXG4gICAgICAgICAgKSxcbiAgICAgICAgICBcIlx1NURGMlx1NUYwMFx1NTlDQlx1OEJGRVx1N0EwQlx1NEZERFx1NzU1OVx1NTM4Nlx1NTNGMlx1RkYwQ1x1NEUwRFx1ODBGRFx1NjUzOVx1NTE5OVwiLFxuICAgICAgICApO1xuICAgICAgICBjb21tYW5kLmxlc3Nvbi5zdGF0ZSA9IFwicGxhbm5lZFwiO1xuICAgICAgICBjb21tYW5kLmxlc3Nvbi5hdHRlbmRlZCA9IGZhbHNlO1xuICAgICAgICB1cHNlcnRCeSh0aGlzLmxlc3NvbnMsIGNvbW1hbmQubGVzc29uLCAoeCkgPT4geC5pZCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInNldExlc3NvblJlc291cmNlc1wiOiB7XG4gICAgICAgIGNvbnN0IGxlc3NvbiA9IHRoaXMubGVzc29ucy5maW5kKChsKSA9PiBsLmlkID09PSBjb21tYW5kLmlkKTtcbiAgICAgICAgZW5zdXJlKGxlc3NvbiAhPT0gdW5kZWZpbmVkLCBcIlx1OEJGRVx1N0EwQlx1NEUwRFx1NUI1OFx1NTcyOFwiKTtcbiAgICAgICAgZW5zdXJlKFxuICAgICAgICAgIGxlc3Nvbi5zdGF0ZSA9PT0gXCJwbGFubmVkXCIgJiZcbiAgICAgICAgICAgICFsZXNzb24uYXR0ZW5kZWQgJiZcbiAgICAgICAgICAgIGxlc3Nvbi5zdGFydHNBdCA+IGF0LFxuICAgICAgICAgIFwiXHU4QkZFXHU3QTBCXHU1REYyXHU1RjAwXHU1OUNCXHVGRjBDXHU0RTBEXHU4MEZEXHU0RkVFXHU2NTM5XHU2MzA3XHU1QjlBXHU4RDQ0XHU2NTk5XCIsXG4gICAgICAgICk7XG4gICAgICAgIGVuc3VyZShcbiAgICAgICAgICBjb21tYW5kLnJlc291cmNlSWRzLmV2ZXJ5KChpZCkgPT5cbiAgICAgICAgICAgIHRoaXMucmVzb3VyY2VzLnNvbWUoXG4gICAgICAgICAgICAgIChyKSA9PiByLmlkID09PSBpZCAmJiByLnByb2plY3RJZCA9PT0gbGVzc29uLnByb2plY3RJZCxcbiAgICAgICAgICAgICksXG4gICAgICAgICAgKSxcbiAgICAgICAgICBcIlx1NTNFQVx1ODBGRFx1NjMwN1x1NUI5QVx1NjcyQ1x1OTg3OVx1NzZFRVx1NzY3Qlx1OEJCMFx1NzY4NFx1OEQ0NFx1NjU5OVwiLFxuICAgICAgICApO1xuICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgbmV3IFNldChjb21tYW5kLnJlc291cmNlSWRzKS5zaXplID09PSBjb21tYW5kLnJlc291cmNlSWRzLmxlbmd0aCxcbiAgICAgICAgICBcIlx1OEJGRVx1N0EwQlx1OEQ0NFx1NjU5OVx1NEUwRFx1ODBGRFx1OTFDRFx1NTkwRFx1NjMwN1x1NUI5QVwiLFxuICAgICAgICApO1xuICAgICAgICBsZXNzb24ucmVzb3VyY2VJZHMgPSBbLi4uY29tbWFuZC5yZXNvdXJjZUlkc107XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcImF0dGVuZExlc3NvblwiOiB7XG4gICAgICAgIGNvbnN0IGxlc3NvbiA9IHRoaXMubGVzc29ucy5maW5kKChsKSA9PiBsLmlkID09PSBjb21tYW5kLmlkKTtcbiAgICAgICAgZW5zdXJlKGxlc3NvbiAhPT0gdW5kZWZpbmVkLCBcIlx1OEJGRVx1N0EwQlx1NEUwRFx1NUI1OFx1NTcyOFwiKTtcbiAgICAgICAgZW5zdXJlKFxuICAgICAgICAgIGF0ID49IGxlc3Nvbi5zdGFydHNBdCAmJiBhdCA8IGxlc3Nvbi5lbmRzQXQsXG4gICAgICAgICAgXCJcdTUzRUFcdTgwRkRcdTU3MjhcdTRFMEFcdThCRkVcdTY1RjZcdTc4NkVcdThCQTRcdTUzQzJcdTRFMEVcIixcbiAgICAgICAgKTtcbiAgICAgICAgbGVzc29uLmF0dGVuZGVkID0gdHJ1ZTtcbiAgICAgICAgbGVzc29uLnByb2dyZXNzID0gY29tbWFuZC5wcm9ncmVzcztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwicHVibGlzaEFzc2Vzc21lbnRcIjoge1xuICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgdGhpcy5wcm9qZWN0cy5zb21lKFxuICAgICAgICAgICAgKHApID0+IHAucHJvamVjdElkID09PSBjb21tYW5kLmFzc2Vzc21lbnQucHJvamVjdElkICYmIHAuZXhhbU1vZGUsXG4gICAgICAgICAgKSxcbiAgICAgICAgICBcIlx1NTNEMVx1NUUwM1x1NEY1Q1x1NEUxQVx1NTQ4Q1x1OEJENVx1NTM3N1x1NTI0RFx1OEJGN1x1NTQyRlx1NzUyOFx1NUU5NFx1OEJENVx1NkEyMVx1NUYwRlwiLFxuICAgICAgICApO1xuICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgIXRoaXMuYXNzZXNzbWVudHMuc29tZSgoYSkgPT4gYS5pZCA9PT0gY29tbWFuZC5hc3Nlc3NtZW50LmlkKSxcbiAgICAgICAgICBcIlx1NURGMlx1NTNEMVx1NUUwM1x1OTg5OFx1NzZFRVx1NTQ4Q1x1OEJDNFx1NTIwNlx1NjgwN1x1NTFDNlx1NEUwRFx1NTNFRlx1NEZFRVx1NjUzOVx1RkYxQlx1OEJGN1x1NTNEMVx1NUUwM1x1NjVCMCBJRCBcdTc2ODRcdTRGRUVcdThCQTJcdTcyNDhcIixcbiAgICAgICAgKTtcbiAgICAgICAgZW5zdXJlKFxuICAgICAgICAgIGNvbW1hbmQuYXNzZXNzbWVudC5raW5kID09PSBcImhvbWV3b3JrXCJcbiAgICAgICAgICAgID8gY29tbWFuZC5hc3Nlc3NtZW50LmVuZHNBdCA+IGF0XG4gICAgICAgICAgICA6IGRhdGVBdChjb21tYW5kLmFzc2Vzc21lbnQuc3RhcnRzQXQpID49IGRhdGVBdChhdCksXG4gICAgICAgICAgXCJcdTRFMERcdTgwRkRcdTUzRDFcdTVFMDNcdTVERjJcdTYyMkFcdTZCNjJcdTc2ODRcdTRGNUNcdTRFMUFcdTYyMTZcdTVERjJcdThGQzdcdTgwMDNcdThCRDVcdTY1RTVcdTY3MUZcdTc2ODRcdThCRDVcdTUzNzdcIixcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3Qgc2VtZXN0ZXIgPSB0aGlzLnNlbWVzdGVycy5maW5kKFxuICAgICAgICAgIChzKSA9PiBzLmlkID09PSBjb21tYW5kLmFzc2Vzc21lbnQuc2VtZXN0ZXJJZCxcbiAgICAgICAgKTtcbiAgICAgICAgZW5zdXJlKHNlbWVzdGVyICE9PSB1bmRlZmluZWQsIFwiXHU1QjY2XHU2NzFGXHU4QkExXHU1MjEyXHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICBjb21tYW5kLmFzc2Vzc21lbnQuc2VtZXN0ZXJSZXZpc2lvbiA9IHNlbWVzdGVyLnJldmlzaW9uO1xuICAgICAgICBjb21tYW5kLmFzc2Vzc21lbnQucHVibGlzaGVkQXQgPSBhdDtcbiAgICAgICAgY29tbWFuZC5hc3Nlc3NtZW50LnByaW50ZWRBdCA9IG51bGw7XG4gICAgICAgIGNvbW1hbmQuYXNzZXNzbWVudC5zdGFydGVkQXQgPSBudWxsO1xuICAgICAgICBjb21tYW5kLmFzc2Vzc21lbnQuc3RvcHBlZEF0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5hc3Nlc3NtZW50cy5wdXNoKGNvbW1hbmQuYXNzZXNzbWVudCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcImNvbmZpcm1QcmludGVkXCI6IHtcbiAgICAgICAgY29uc3QgYSA9IHRoaXMuYXNzZXNzbWVudHMuZmluZCgoeCkgPT4geC5pZCA9PT0gY29tbWFuZC5pZCk7XG4gICAgICAgIGVuc3VyZShhICE9PSB1bmRlZmluZWQsIFwiXHU4QkQ1XHU1Mzc3XHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICBhLnByaW50ZWRBdCA9IGF0O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJzdGFydEV4YW1cIjoge1xuICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgIXRoaXMuYXNzZXNzbWVudHMuc29tZShcbiAgICAgICAgICAgIChhKSA9PiBhLnN0YXJ0ZWRBdCAhPT0gbnVsbCAmJiBhLnN0b3BwZWRBdCA9PT0gbnVsbCxcbiAgICAgICAgICApLFxuICAgICAgICAgIFwiXHU4QkY3XHU1MTQ4XHU3RUQzXHU2NzVGXHU1RjUzXHU1MjREXHU4MDAzXHU4QkQ1XCIsXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGEgPSB0aGlzLmFzc2Vzc21lbnRzLmZpbmQoKHgpID0+IHguaWQgPT09IGNvbW1hbmQuaWQpO1xuICAgICAgICBlbnN1cmUoYSAhPT0gdW5kZWZpbmVkLCBcIlx1OEJENVx1NTM3N1x1NEUwRFx1NUI1OFx1NTcyOFwiKTtcbiAgICAgICAgZW5zdXJlKFxuICAgICAgICAgIGEua2luZCAhPT0gXCJob21ld29ya1wiICYmXG4gICAgICAgICAgICBhLnByaW50ZWRBdCAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgYS5zdGFydGVkQXQgPT09IG51bGwgJiZcbiAgICAgICAgICAgIGRhdGVBdChhdCkgPT09IGRhdGVBdChhLnN0YXJ0c0F0KSxcbiAgICAgICAgICBcIlx1OEJGN1x1NTE0OFx1NjI1M1x1NTM3MFx1OEJENVx1NTM3N1x1NEUwRVx1N0I1NFx1OTg5OFx1NTM2MVx1RkYwQ1x1NUU3Nlx1NTcyOFx1ODAwM1x1OEJENVx1NUI4OVx1NjM5Mlx1NUY1M1x1NTkyOVx1NUYwMFx1NTlDQlx1ODAwM1x1OEJENVwiLFxuICAgICAgICApO1xuICAgICAgICBhLnN0YXJ0ZWRBdCA9IGF0O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJlbmRFeGFtXCI6IHtcbiAgICAgICAgY29uc3QgYSA9IHRoaXMuYXNzZXNzbWVudHMuZmluZCgoeCkgPT4geC5pZCA9PT0gY29tbWFuZC5pZCk7XG4gICAgICAgIGVuc3VyZShhICE9PSB1bmRlZmluZWQsIFwiXHU4MDAzXHU4QkQ1XHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgYS5raW5kICE9PSBcImhvbWV3b3JrXCIgJiYgYS5zdGFydGVkQXQgIT09IG51bGwgJiYgYS5zdG9wcGVkQXQgPT09IG51bGwsXG4gICAgICAgICAgXCJcdTgwMDNcdThCRDVcdTVDMUFcdTY3MkFcdTVGMDBcdTU5Q0JcdTYyMTZcdTVERjJcdTdFQ0ZcdTUwNUNcdTdCMTRcIixcbiAgICAgICAgKTtcbiAgICAgICAgYS5zdG9wcGVkQXQgPSBhdDtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwic3VibWl0XCI6IHtcbiAgICAgICAgZW5zdXJlKFxuICAgICAgICAgICF0aGlzLnN1Ym1pc3Npb25zLnNvbWUoKHMpID0+IHMuaWQgPT09IGNvbW1hbmQuc3VibWlzc2lvbi5pZCksXG4gICAgICAgICAgXCJcdTYzRDBcdTRFQTRcdTcyNDhcdTY3MkNcdTRFMERcdTUzRUZcdTg5ODZcdTc2RDZcIixcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgYSA9IHRoaXMuYXNzZXNzbWVudHMuZmluZChcbiAgICAgICAgICAoeCkgPT4geC5pZCA9PT0gY29tbWFuZC5zdWJtaXNzaW9uLmFzc2Vzc21lbnRJZCxcbiAgICAgICAgKTtcbiAgICAgICAgZW5zdXJlKGEgIT09IHVuZGVmaW5lZCwgXCJcdTRGNUNcdTRFMUEvXHU4MDAzXHU4QkQ1XHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICBlbnN1cmUoYXQgPj0gYS5zdGFydHNBdCwgXCJcdTVDMUFcdTY3MkFcdTVGMDBcdTU5Q0JcdUZGMENcdTRFMERcdTgwRkRcdTYzRDBcdTRFQTRcIik7XG4gICAgICAgIGlmIChhLmtpbmQgIT09IFwiaG9tZXdvcmtcIikge1xuICAgICAgICAgIGVuc3VyZShcbiAgICAgICAgICAgIGEuc3RhcnRlZEF0ICE9PSBudWxsICYmIGEuc3RvcHBlZEF0ICE9PSBudWxsLFxuICAgICAgICAgICAgXCJcdTgwMDNcdThCRDVcdTdFRDNcdTY3NUZcdTUwNUNcdTdCMTRcdTU0MEVcdTYyNERcdTgwRkRcdTRFMEFcdTRGMjBcdTdCNTRcdTk4OThcdTUzNjFcIixcbiAgICAgICAgICApO1xuICAgICAgICAgIGVuc3VyZShcbiAgICAgICAgICAgIGNvbW1hbmQuc3VibWlzc2lvbi5yZXNvdXJjZUlkcy5sZW5ndGggPiAwLFxuICAgICAgICAgICAgXCJcdTgwMDNcdThCRDVcdTk3MDBcdTg5ODFcdTRFMEFcdTRGMjBcdTdFQjhcdThEMjhcdTdCNTRcdTk4OThcdTUzNjFcIixcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGVuc3VyZShcbiAgICAgICAgICBjaGVja1RleHQoY29tbWFuZC5zdWJtaXNzaW9uLmFuc3dlcnMsIDUwMDAwKSB8fFxuICAgICAgICAgICAgY29tbWFuZC5zdWJtaXNzaW9uLnJlc291cmNlSWRzLmxlbmd0aCA+IDAgfHxcbiAgICAgICAgICAgIGNvbW1hbmQuc3VibWlzc2lvbi51bmZpbmlzaGVkLFxuICAgICAgICAgIFwiXHU4QkY3XHU2M0QwXHU0RjlCXHU3QjU0XHU2ODQ4XHUzMDAxXHU5NjQ0XHU0RUY2XHU2MjE2XHU2ODA3XHU4QkIwXHU2NzJBXHU1QjhDXHU2MjEwXCIsXG4gICAgICAgICk7XG4gICAgICAgIGNvbW1hbmQuc3VibWlzc2lvbi5zdWJtaXR0ZWRBdCA9IGF0O1xuICAgICAgICBjb25zdCBwcm9qZWN0ID0gYS5wcm9qZWN0SWQ7XG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IGNvbW1hbmQuc3VibWlzc2lvbi5pZDtcbiAgICAgICAgdGhpcy5zdWJtaXNzaW9ucy5wdXNoKGNvbW1hbmQuc3VibWlzc2lvbik7XG4gICAgICAgIHRoaXMuZXZlbnQocHJvamVjdCwgXCJncmFkZVwiLCBzb3VyY2UsIGF0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwicmVjb3JkUXVlc3Rpb25UaW1lc1wiOiB7XG4gICAgICAgIGVuc3VyZShjb21tYW5kLnF1ZXN0aW9uVGltZXMubGVuZ3RoID4gMCwgXCJcdTZDQTFcdTY3MDlcdTk3MDBcdTg5ODFcdTg4NjVcdTVGNTVcdTc2ODRcdTVCOENcdTYyMTBcdTY1RjZcdTUyM0JcIik7XG4gICAgICAgIGVuc3VyZShcbiAgICAgICAgICAhdGhpcy5ncmFkZXMuc29tZSgoZykgPT4gZy5zdWJtaXNzaW9uSWQgPT09IGNvbW1hbmQuaWQpLFxuICAgICAgICAgIFwiXHU1REYyXHU2Mjc5XHU2NTM5XHU3Njg0XHU3QjU0XHU1Mzc3XHU0RTBEXHU4MEZEXHU4ODY1XHU1RjU1XHU1QjhDXHU2MjEwXHU2NUY2XHU1MjNCXCIsXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IHN1Ym1pc3Npb24gPSB0aGlzLnN1Ym1pc3Npb25zLmZpbmQoKHMpID0+IHMuaWQgPT09IGNvbW1hbmQuaWQpO1xuICAgICAgICBlbnN1cmUoc3VibWlzc2lvbiAhPT0gdW5kZWZpbmVkLCBcIlx1NjNEMFx1NEVBNFx1NzI0OFx1NjcyQ1x1NEUwRFx1NUI1OFx1NTcyOFwiKTtcbiAgICAgICAgZW5zdXJlKFxuICAgICAgICAgIGNvbW1hbmQucXVlc3Rpb25UaW1lcy5ldmVyeShcbiAgICAgICAgICAgICh0KSA9PlxuICAgICAgICAgICAgICAhc3VibWlzc2lvbi5xdWVzdGlvblRpbWVzLnNvbWUoXG4gICAgICAgICAgICAgICAgKGV4aXN0aW5nKSA9PiBleGlzdGluZy5xdWVzdGlvbklkID09PSB0LnF1ZXN0aW9uSWQsXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgKSxcbiAgICAgICAgICBcIlx1NURGMlx1NjcwOVx1NzY4NFx1NUI4Q1x1NjIxMFx1NjVGNlx1NTIzQlx1NEUwRFx1ODBGRFx1ODk4Nlx1NzZENlwiLFxuICAgICAgICApO1xuICAgICAgICBzdWJtaXNzaW9uLnF1ZXN0aW9uVGltZXMucHVzaCguLi5jb21tYW5kLnF1ZXN0aW9uVGltZXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJncmFkZVwiOiB7XG4gICAgICAgIGVuc3VyZShcbiAgICAgICAgICAhdGhpcy5ncmFkZXMuc29tZSgoZykgPT4gZy5pZCA9PT0gY29tbWFuZC5ncmFkZS5pZCksXG4gICAgICAgICAgXCJcdTYyNzlcdTY1MzlcdTUzODZcdTUzRjJcdTRFMERcdTUzRUZcdTg5ODZcdTc2RDZcdUZGMENcdTU5MERcdTY4MzhcdThCRjdcdTY1QjBcdTU4OUVcdTYyNzlcdTY1MzlcdThCQjBcdTVGNTVcIixcbiAgICAgICAgKTtcbiAgICAgICAgY29tbWFuZC5ncmFkZS5ncmFkZWRBdCA9IGF0O1xuICAgICAgICB0aGlzLmdyYWRlcy5wdXNoKGNvbW1hbmQuZ3JhZGUpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJzYXZlUmV2aWV3XCI6IHtcbiAgICAgICAgZW5zdXJlKFxuICAgICAgICAgICF0aGlzLnJldmlld3Muc29tZSgocikgPT4gci5pZCA9PT0gY29tbWFuZC5yZXZpZXcuaWQpLFxuICAgICAgICAgIFwiXHU1OTBEXHU3NkQ4XHU1Mzg2XHU1M0YyXHU0RTBEXHU1M0VGXHU4OTg2XHU3NkQ2XCIsXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMucmV2aWV3cy5wdXNoKGNvbW1hbmQucmV2aWV3KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwiY2xhaW1FdmVudFwiOiB7XG4gICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5ldmVudHMuZmluZChcbiAgICAgICAgICAoZSkgPT4gZS5pZCA9PT0gY29tbWFuZC5pZCAmJiBlLnN0YXRlID09PSBcInBlbmRpbmdcIixcbiAgICAgICAgKTtcbiAgICAgICAgZW5zdXJlKGV2ZW50ICE9PSB1bmRlZmluZWQsIFwiXHU0RThCXHU0RUY2XHU1REYyXHU1OTA0XHU3NDA2XCIpO1xuICAgICAgICBldmVudC5zdGF0ZSA9IFwicnVubmluZ1wiO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJmaW5pc2hFdmVudFwiOiB7XG4gICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5ldmVudHMuZmluZCgoZSkgPT4gZS5pZCA9PT0gY29tbWFuZC5pZCk7XG4gICAgICAgIGVuc3VyZShldmVudCAhPT0gdW5kZWZpbmVkLCBcIlx1NjU1OVx1NUI2Nlx1NEU4Qlx1NEVGNlx1NEUwRFx1NUI1OFx1NTcyOFwiKTtcbiAgICAgICAgY29uc3QgcHJvZHVjZWQgPSAoKCkgPT4ge1xuICAgICAgICAgIHN3aXRjaCAoZXZlbnQua2luZCkge1xuICAgICAgICAgICAgY2FzZSBcImhvbWV3b3JrXCI6XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmFzc2Vzc21lbnRzLnNvbWUoXG4gICAgICAgICAgICAgICAgKGEpID0+XG4gICAgICAgICAgICAgICAgICBhLnByb2plY3RJZCA9PT0gZXZlbnQucHJvamVjdElkICYmXG4gICAgICAgICAgICAgICAgICBhLmtpbmQgPT09IFwiaG9tZXdvcmtcIiAmJlxuICAgICAgICAgICAgICAgICAgYS5sZXNzb25JZCA9PT0gZXZlbnQuc291cmNlSWQsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjYXNlIFwidGFza0hvbWV3b3JrXCI6XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmFzc2Vzc21lbnRzLnNvbWUoXG4gICAgICAgICAgICAgICAgKGEpID0+XG4gICAgICAgICAgICAgICAgICBhLmtpbmQgPT09IFwiaG9tZXdvcmtcIiAmJlxuICAgICAgICAgICAgICAgICAgYS5wcm9qZWN0SWQgPT09IGV2ZW50LnByb2plY3RJZCAmJlxuICAgICAgICAgICAgICAgICAgYS50YXNrSWQgPT09IGV2ZW50LnNvdXJjZUlkLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgY2FzZSBcImNvcnJlY3Rpb25cIjpcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29ycmVjdGlvbnMuc29tZShcbiAgICAgICAgICAgICAgICAoYykgPT4gYy5pZCA9PT0gZXZlbnQuc291cmNlSWQgJiYgYy5yZXZpZXdlZEF0ICE9PSBudWxsLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgY2FzZSBcIndlZWtseUV4YW1cIjpcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXNzZXNzbWVudHMuc29tZShcbiAgICAgICAgICAgICAgICAoYSkgPT5cbiAgICAgICAgICAgICAgICAgIGEucHJvamVjdElkID09PSBldmVudC5wcm9qZWN0SWQgJiZcbiAgICAgICAgICAgICAgICAgIGEua2luZCA9PT0gXCJ3ZWVrbHlFeGFtXCIgJiZcbiAgICAgICAgICAgICAgICAgIGEucHVibGlzaGVkQXQgPj0gZXZlbnQuY3JlYXRlZEF0LFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgY2FzZSBcImdyYWRlXCI6XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmdyYWRlcy5zb21lKChnKSA9PiBnLnN1Ym1pc3Npb25JZCA9PT0gZXZlbnQuc291cmNlSWQpO1xuICAgICAgICAgICAgY2FzZSBcInJldmlld1wiOlxuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZXZpZXdzLnNvbWUoXG4gICAgICAgICAgICAgICAgKHIpID0+XG4gICAgICAgICAgICAgICAgICByLnByb2plY3RJZCA9PT0gZXZlbnQucHJvamVjdElkICYmXG4gICAgICAgICAgICAgICAgICBldmVudC5zb3VyY2VJZC5lbmRzV2l0aChyLmRhdGUpLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkoKTtcbiAgICAgICAgZW5zdXJlKHByb2R1Y2VkLCBcIlx1OEJGN1x1NTE0OFx1NEZERFx1NUI1OFx1NjcyQ1x1NkIyMVx1NjU1OVx1NUI2Nlx1NEU4Qlx1NEVGNlx1NzY4NFx1NUI5RVx1OTY0NVx1NEVBN1x1NzI2OVwiKTtcbiAgICAgICAgZXZlbnQuc3RhdGUgPSBcImRvbmVcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwicmV0cnlFdmVudFwiOiB7XG4gICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5ldmVudHMuZmluZChcbiAgICAgICAgICAoZSkgPT4gZS5pZCA9PT0gY29tbWFuZC5pZCAmJiBlLnN0YXRlICE9PSBcImRvbmVcIixcbiAgICAgICAgKTtcbiAgICAgICAgZW5zdXJlKGV2ZW50ICE9PSB1bmRlZmluZWQsIFwiXHU2Q0ExXHU2NzA5XHU1M0VGXHU5MUNEXHU4QkQ1XHU3Njg0XHU2NTU5XHU1QjY2XHU0RThCXHU0RUY2XCIpO1xuICAgICAgICBldmVudC5zdGF0ZSA9IFwicGVuZGluZ1wiO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdXBzZXJ0Qnk8VD4obGlzdDogVFtdLCB2YWx1ZTogVCwga2V5OiAoeDogVCkgPT4gc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IGsgPSBrZXkodmFsdWUpO1xuICBjb25zdCBpbmRleCA9IGxpc3QuZmluZEluZGV4KCh4KSA9PiBrZXkoeCkgPT09IGspO1xuICBpZiAoaW5kZXggPj0gMCkge1xuICAgIGxpc3RbaW5kZXhdID0gdmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgbGlzdC5wdXNoKHZhbHVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb21wbGV0ZWRTdHVkeVRhc2tGcm9tVGFzayhcbiAgdGFzazogVGFzayxcbiAgYXQ6IG51bWJlcixcbik6IENvbXBsZXRlZFN0dWR5VGFzayB8IG51bGwge1xuICBpZiAodGFzay5wcm9qZWN0SWQgPT09IG51bGwpIHJldHVybiBudWxsO1xuICByZXR1cm4ge1xuICAgIGlkOiB0YXNrLmlkLFxuICAgIHByb2plY3RJZDogdGFzay5wcm9qZWN0SWQsXG4gICAgdGl0bGU6IHRhc2sudGl0bGUsXG4gICAgbm90ZXM6IHRhc2subm90ZXMsXG4gICAgdG9waWNzOiBbLi4udGFzay50YWdzXSxcbiAgICBjb21wbGV0ZWRBdDogYXQsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGhvdXJNaW51dGVOb3coYXQ6IG51bWJlcik6IHN0cmluZyB7XG4gIGNvbnN0IGQgPSBuZXcgRGF0ZShhdCAqIDEwMDApO1xuICByZXR1cm4gYCR7U3RyaW5nKGQuZ2V0SG91cnMoKSkucGFkU3RhcnQoMiwgXCIwXCIpfToke1N0cmluZyhkLmdldE1pbnV0ZXMoKSkucGFkU3RhcnQoMiwgXCIwXCIpfWA7XG59XG5cbi8vIC0tLS0tLS0tLS0gXHU2ODIxXHU5QThDIC0tLS0tLS0tLS1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlRWR1Y2F0aW9uKGRhdGE6IEFwcERhdGEpOiB2b2lkIHtcbiAgY29uc3QgZSA9IGRhdGEuZWR1Y2F0aW9uO1xuICB1bmlxdWVFZHVjYXRpb25JZHMoW1xuICAgIC4uLmUucmVzb3VyY2VzLm1hcCgoeCkgPT4geC5pZCksXG4gICAgLi4uZS5zZW1lc3RlcnMubWFwKCh4KSA9PiB4LmlkKSxcbiAgICAuLi5lLmxlc3NvbnMubWFwKCh4KSA9PiB4LmlkKSxcbiAgICAuLi5lLmFzc2Vzc21lbnRzLm1hcCgoeCkgPT4geC5pZCksXG4gICAgLi4uZS5zdWJtaXNzaW9ucy5tYXAoKHgpID0+IHguaWQpLFxuICAgIC4uLmUuZ3JhZGVzLm1hcCgoeCkgPT4geC5pZCksXG4gICAgLi4uZS5yZXZpZXdzLm1hcCgoeCkgPT4geC5pZCksXG4gIF0pO1xuICB1bmlxdWVFZHVjYXRpb25JZHMoZS5wcm9qZWN0cy5tYXAoKHApID0+IHAucHJvamVjdElkKSk7XG4gIHVuaXF1ZUVkdWNhdGlvbklkcyhlLmV2ZW50cy5tYXAoKHApID0+IHAuaWQpKTtcbiAgY29uc3QgcHJvamVjdEV4aXN0cyA9IChpZDogc3RyaW5nKTogYm9vbGVhbiA9PlxuICAgIGRhdGEucHJvamVjdHMuc29tZSgocCkgPT4gcC5pZCA9PT0gaWQpO1xuICBjb25zdCByZXNvdXJjZSA9IChpZDogc3RyaW5nLCBwOiBzdHJpbmcpOiBSZXNvdXJjZSB8IHVuZGVmaW5lZCA9PlxuICAgIGUucmVzb3VyY2VzLmZpbmQoKHIpID0+IHIuaWQgPT09IGlkICYmIHIucHJvamVjdElkID09PSBwKTtcbiAgZW5zdXJlKFxuICAgIGUubGVzc29ucy5sZW5ndGggK1xuICAgICAgZS5hc3Nlc3NtZW50cy5sZW5ndGggK1xuICAgICAgZS5zdWJtaXNzaW9ucy5sZW5ndGggK1xuICAgICAgZS5ncmFkZXMubGVuZ3RoIDw9XG4gICAgICAxMDAwMDAsXG4gICAgXCJcdTY1NTlcdTVCNjZcdThCQjBcdTVGNTVcdTY1NzBcdTkxQ0ZcdThEODVcdTUxRkFcdTk2NTBcdTUyMzZcIixcbiAgKTtcbiAgZm9yIChjb25zdCBwIG9mIGUucHJvamVjdHMpIHtcbiAgICBlbnN1cmUoXG4gICAgICBwcm9qZWN0RXhpc3RzKHAucHJvamVjdElkKSAmJiBpc0Fic29sdXRlUGF0aChwLmRpcmVjdG9yeSksXG4gICAgICBcIlx1OTg3OVx1NzZFRVx1NUZDNVx1OTg3Qlx1N0VEMVx1NUI5QVx1N0VERFx1NUJGOVx1NzZFRVx1NUY1NVwiLFxuICAgICk7XG4gICAgZW5zdXJlKFxuICAgICAgcC5leGFtRGF0ZSA9PT0gbnVsbCB8fCB2YWxpZEVkdWNhdGlvbkRhdGUocC5leGFtRGF0ZSksXG4gICAgICBcIlx1NjVFMFx1NjU0OFx1NzY4NFx1ODAwM1x1OEJENVx1NjVFNVx1NjcxRlwiLFxuICAgICk7XG4gICAgaWYgKHAuZXhhbU1vZGUpIHtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgcC52aXNpb25JZCAhPT0gbnVsbCAmJlxuICAgICAgICAgIGRhdGEudmlzaW9ucy5zb21lKCh2KSA9PiB2LmlkID09PSBwLnZpc2lvbklkKSAmJlxuICAgICAgICAgIGNoZWNrVGV4dChwLnRhcmdldCwgNTAwMDApLFxuICAgICAgICBcIlx1NUU5NFx1OEJENVx1NkEyMVx1NUYwRlx1NUZDNVx1OTg3Qlx1N0VEMVx1NUI5QVx1NjEzRlx1NjY2Rlx1NUU3Nlx1NjYwRVx1Nzg2RVx1OTY2Mlx1NjgyMVx1MzAwMVx1NEUxM1x1NEUxQVx1MzAwMVx1NUU3NFx1NEVGRFx1NTQ4Q1x1NzlEMVx1NzZFRVx1NzZFRVx1NjgwN1wiLFxuICAgICAgKTtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgcC5zeWxsYWJ1c0lkICE9PSBudWxsICYmXG4gICAgICAgICAgcmVzb3VyY2UocC5zeWxsYWJ1c0lkLCBwLnByb2plY3RJZCk/LmtpbmQgPT09IFwic3lsbGFidXNcIixcbiAgICAgICAgXCJcdTVFOTRcdThCRDVcdTZBMjFcdTVGMEZcdTVGQzVcdTk4N0JcdTdFRDFcdTVCOUFcdTgwMDNcdTdFQjJcIixcbiAgICAgICk7XG4gICAgICBlbnN1cmUoXG4gICAgICAgIHAucGFzdFBhcGVySWRzLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICBwLnBhc3RQYXBlcklkcy5ldmVyeShcbiAgICAgICAgICAgIChpZCkgPT4gcmVzb3VyY2UoaWQsIHAucHJvamVjdElkKT8ua2luZCA9PT0gXCJwYXN0UGFwZXJcIixcbiAgICAgICAgICApLFxuICAgICAgICBcIlx1NUU5NFx1OEJENVx1NkEyMVx1NUYwRlx1NUZDNVx1OTg3Qlx1N0VEMVx1NUI5QVx1NzcxRlx1OTg5OFwiLFxuICAgICAgKTtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgcC5tb2NrUGFwZXJJZHMubGVuZ3RoID4gMCAmJlxuICAgICAgICAgIHAubW9ja1BhcGVySWRzLmV2ZXJ5KFxuICAgICAgICAgICAgKGlkKSA9PiByZXNvdXJjZShpZCwgcC5wcm9qZWN0SWQpPy5raW5kID09PSBcIm1vY2tQYXBlclwiLFxuICAgICAgICAgICksXG4gICAgICAgIFwiXHU1RTk0XHU4QkQ1XHU2QTIxXHU1RjBGXHU1RkM1XHU5ODdCXHU3RUQxXHU1QjlBXHU2QTIxXHU2MkRGXHU5ODk4XCIsXG4gICAgICApO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IHIgb2YgZS5yZXNvdXJjZXMpIHtcbiAgICBlbnN1cmUoXG4gICAgICBlLnByb2plY3RzLnNvbWUoKHApID0+IHAucHJvamVjdElkID09PSByLnByb2plY3RJZCkgJiZcbiAgICAgICAgY2hlY2tUZXh0KHIudGl0bGUsIDUwMDAwKSAmJlxuICAgICAgICBpc1JlbGF0aXZlUGF0aChyLnBhdGgpLFxuICAgICAgXCJcdThENDRcdTZFOTBcdTk3MDBcdTg5ODFcdTYyNDBcdTVDNUVcdTk4NzlcdTc2RUVcdTMwMDFcdTU0MERcdTc5RjBcdTU0OENcdTVCODlcdTUxNjhcdTc2ODRcdTc2RjhcdTVCRjlcdThERUZcdTVGODRcIixcbiAgICApO1xuICB9XG4gIGZvciAoY29uc3QgcyBvZiBlLnNlbWVzdGVycykge1xuICAgIGVuc3VyZShcbiAgICAgIGUucHJvamVjdHMuc29tZSgocCkgPT4gcC5wcm9qZWN0SWQgPT09IHMucHJvamVjdElkKSAmJlxuICAgICAgICBjaGVja1RleHQocy50aXRsZSwgNTAwMDApICYmXG4gICAgICAgIHZhbGlkRWR1Y2F0aW9uRGF0ZShzLnN0YXJ0RGF0ZSkgJiZcbiAgICAgICAgdmFsaWRFZHVjYXRpb25EYXRlKHMuZW5kRGF0ZSkgJiZcbiAgICAgICAgcy5zdGFydERhdGUgPD0gcy5lbmREYXRlICYmXG4gICAgICAgIHMucmV2aXNpb24gPiAwICYmXG4gICAgICAgIGNoZWNrVGV4dChzLmJhc2VsaW5lLCA1MDAwMCkgJiZcbiAgICAgICAgY2hlY2tUZXh0KHMucmF0aW9uYWxlLCA1MDAwMCkgJiZcbiAgICAgICAgcy5ldmlkZW5jZS5sZW5ndGggPiAwICYmXG4gICAgICAgIHMubWlsZXN0b25lcy5sZW5ndGggPiAwLFxuICAgICAgXCJcdTVCNjZcdTY3MUZcdThCQTFcdTUyMTJcdTdGM0FcdTVDMTFcdTY1RTVcdTY3MUZcdTMwMDFcdTVCNjZcdTYwQzVcdThCQ0FcdTY1QURcdTMwMDFcdTRGOURcdTYzNkVcdTYyMTZcdTk2MzZcdTZCQjVcdThGREJcdTVFQTZcIixcbiAgICApO1xuICAgIGZvciAoY29uc3QgbSBvZiBzLm1pbGVzdG9uZXMpIHtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgbS53ZWVrID4gMCAmJlxuICAgICAgICAgIG0udG9waWNzLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICBjaGVja1RleHQobS5vYmplY3RpdmUsIDUwMDAwKSAmJlxuICAgICAgICAgIG0ubGVzc29uQ291bnQgPiAwICYmXG4gICAgICAgICAgbS5yZXNvdXJjZUlkcy5ldmVyeSgoaWQpID0+IHJlc291cmNlKGlkLCBzLnByb2plY3RJZCkgIT09IHVuZGVmaW5lZCksXG4gICAgICAgIFwiXHU2NUUwXHU2NTQ4XHU3Njg0XHU1NDY4XHU4RkRCXHU1RUE2XHU2MjE2XHU1QjY2XHU0RTYwXHU4RDQ0XHU2RTkwXCIsXG4gICAgICApO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IGwgb2YgZS5sZXNzb25zKSB7XG4gICAgY29uc3QgcyA9IFsuLi5lLnNlbWVzdGVycywgLi4uZS5zZW1lc3Rlckhpc3RvcnldLmZpbmQoXG4gICAgICAoeCkgPT5cbiAgICAgICAgeC5pZCA9PT0gbC5zZW1lc3RlcklkICYmXG4gICAgICAgIHgucHJvamVjdElkID09PSBsLnByb2plY3RJZCAmJlxuICAgICAgICB4LnJldmlzaW9uID09PSBsLnNlbWVzdGVyUmV2aXNpb24sXG4gICAgKTtcbiAgICBlbnN1cmUocyAhPT0gdW5kZWZpbmVkLCBcIlx1OEJGRVx1N0EwQlx1NUZDNVx1OTg3Qlx1N0VEMVx1NUI5QVx1NjcyQ1x1OTg3OVx1NzZFRVx1NUI2Nlx1NjcxRlx1OEJBMVx1NTIxMlwiKTtcbiAgICBlbnN1cmUoXG4gICAgICBjaGVja1RleHQobC50aXRsZSwgNTAwMDApICYmXG4gICAgICAgIGwudG9waWNzLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgbC5lbmRzQXQgLSBsLnN0YXJ0c0F0ID09PSA0NSAqIDYwICYmXG4gICAgICAgIGRhdGVBdChsLnN0YXJ0c0F0KSA+PSBzLnN0YXJ0RGF0ZSAmJlxuICAgICAgICBkYXRlQXQobC5lbmRzQXQpIDw9IHMuZW5kRGF0ZSAmJlxuICAgICAgICBsLnJlc291cmNlSWRzLmV2ZXJ5KChpZCkgPT4gcmVzb3VyY2UoaWQsIGwucHJvamVjdElkKSAhPT0gdW5kZWZpbmVkKSxcbiAgICAgIFwiXHU4QkZFXHU3QTBCXHU5NzAwXHU4OTgxNDVcdTUyMDZcdTk0OUZcdTMwMDFcdTc3RTVcdThCQzZcdTcwQjlcdTU0OENcdTY3MDlcdTY1NDhcdThENDRcdTZFOTBcdUZGMENcdTRFMTRcdTU3MjhcdTVCNjZcdTY3MUZcdTgzMDNcdTU2RjRcdTUxODVcIixcbiAgICApO1xuICAgIGNvbnN0IG1pbnV0ZSA9IE1hdGguZmxvb3IobWludXRlc09mKGhvdXJNaW51dGVOb3cobC5zdGFydHNBdCkpID8/IDApO1xuICAgIGVuc3VyZShcbiAgICAgIChtaW51dGUgPj0gOCAqIDYwICYmIG1pbnV0ZSA8IDEyICogNjAgKyA0MCkgfHxcbiAgICAgICAgKG1pbnV0ZSA+PSAxNCAqIDYwICYmIG1pbnV0ZSA8IDE4ICogNjAgKyAxNSksXG4gICAgICBcIlx1OEJGRVx1N0EwQlx1OTg3Qlx1NTcyOFx1NEUwQVx1NTM0OFx1NjIxNlx1NEUwQlx1NTM0OFx1RkYwQ1x1NjY1QVx1OTVGNDE5XHUyMDEzMjJcdTcwQjlcdTc1NTlcdTdFRDlcdTRGNUNcdTRFMUFcIixcbiAgICApO1xuICAgIGNvbnN0IHNhbWUgPSBlLmxlc3NvbnMuZmlsdGVyKFxuICAgICAgKHgpID0+IGRhdGVBdCh4LnN0YXJ0c0F0KSA9PT0gZGF0ZUF0KGwuc3RhcnRzQXQpLFxuICAgICk7XG4gICAgbGV0IG1vcm5pbmcgPSAwO1xuICAgIGxldCBhZnRlcm5vb24gPSAwO1xuICAgIGZvciAoY29uc3QgeCBvZiBzYW1lKSB7XG4gICAgICBjb25zdCBoID0gbmV3IERhdGUoeC5zdGFydHNBdCAqIDEwMDApLmdldEhvdXJzKCk7XG4gICAgICBpZiAoaCA8IDEyKSBtb3JuaW5nICs9IDE7XG4gICAgICBlbHNlIGFmdGVybm9vbiArPSAxO1xuICAgIH1cbiAgICBlbnN1cmUobW9ybmluZyA8PSA0ICYmIGFmdGVybm9vbiA8PSA0LCBcIlx1OERFOFx1OTg3OVx1NzZFRVx1NkJDRlx1NTkyOVx1NjcwMFx1NTkxQVx1NEUwQVx1NTM0ODRcdTgyODJcdTMwMDFcdTRFMEJcdTUzNDg0XHU4MjgyXCIpO1xuICAgIGVuc3VyZShcbiAgICAgICFlLmxlc3NvbnMuc29tZShcbiAgICAgICAgKHgpID0+IHguaWQgIT09IGwuaWQgJiYgeC5zdGFydHNBdCA8IGwuZW5kc0F0ICYmIHguZW5kc0F0ID4gbC5zdGFydHNBdCxcbiAgICAgICksXG4gICAgICBcIlx1OERFOFx1OTg3OVx1NzZFRVx1OEJGRVx1N0EwQlx1NjVGNlx1OTVGNFx1NTFCMlx1N0E4MVwiLFxuICAgICk7XG4gICAgY29uc3QgZGF0ZSA9IGRhdGVBdChsLnN0YXJ0c0F0KTtcbiAgICBmb3IgKGNvbnN0IGIgb2YgZGF0YS5ibG9ja3MpIHtcbiAgICAgIGlmIChiLmF0dGVudGlvbiA9PT0gXCJyZXF1aXJlZFwiKSB7XG4gICAgICAgIGVuc3VyZShcbiAgICAgICAgICBvdmVybGFwTWludXRlc09mQmxvY2soYiwgZGF0ZSwgbWludXRlLCBtaW51dGUgKyA0NSkgPT09IDAsXG4gICAgICAgICAgXCJcdThCRkVcdTdBMEJcdTRFMEVcdTk3MDBcdTRFMTNcdTVGQzNcdTc2ODRcdTU2RkFcdTVCOUFcdTUzNjBcdTc1MjhcdTUxQjJcdTdBODFcIixcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZm9yIChjb25zdCBhIG9mIGUuYXNzZXNzbWVudHMpIHtcbiAgICBlbnN1cmUoXG4gICAgICBlLnByb2plY3RzLnNvbWUoKHApID0+IHAucHJvamVjdElkID09PSBhLnByb2plY3RJZCksXG4gICAgICBcIkFJXHU0RjVDXHU0RTFBXHU1NDhDXHU4MDAzXHU4QkQ1XHU5NzAwXHU4OTgxXHU1NDJGXHU3NTI4XHU1RTk0XHU4QkQ1XHU2QTIxXHU1RjBGXCIsXG4gICAgKTtcbiAgICBlbnN1cmUoXG4gICAgICBbLi4uZS5zZW1lc3RlcnMsIC4uLmUuc2VtZXN0ZXJIaXN0b3J5XS5zb21lKFxuICAgICAgICAocykgPT5cbiAgICAgICAgICBzLmlkID09PSBhLnNlbWVzdGVySWQgJiZcbiAgICAgICAgICBzLnByb2plY3RJZCA9PT0gYS5wcm9qZWN0SWQgJiZcbiAgICAgICAgICBzLnJldmlzaW9uID09PSBhLnNlbWVzdGVyUmV2aXNpb24sXG4gICAgICApLFxuICAgICAgXCJcdThCRDVcdTk4OThcdTVGQzVcdTk4N0JcdTdFRDFcdTVCOUFcdTVCNjZcdTY3MUZcdThCQTFcdTUyMTJcIixcbiAgICApO1xuICAgIGVuc3VyZShcbiAgICAgIGEucmV2aXNpb24gPiAwICYmXG4gICAgICAgIGEuc3RhcnRzQXQgPCBhLmVuZHNBdCAmJlxuICAgICAgICBjaGVja1RleHQoYS50aXRsZSwgNTAwMDApICYmXG4gICAgICAgIGNoZWNrVGV4dChhLnJldmlld0V2aWRlbmNlLCA1MDAwMCkgJiZcbiAgICAgICAgY2hlY2tUZXh0KGEuaW5zdHJ1Y3Rpb25zLCA1MDAwMCkgJiZcbiAgICAgICAgYS5xdWVzdGlvbnMubGVuZ3RoID4gMCxcbiAgICAgIFwiXHU1M0QxXHU1RTAzXHU1MjREXHU1RkM1XHU5ODdCXHU1MUM2XHU1OTA3XHU5ODk4XHU3NkVFXHUzMDAxXHU4MDAzXHU4QkQ1XHU4QkY0XHU2NjBFXHUzMDAxXHU3QjU0XHU2ODQ4XHU1NDhDXHU3MkVDXHU3QUNCXHU1OTBEXHU2ODM4XHU4QkIwXHU1RjU1XCIsXG4gICAgKTtcbiAgICBpZiAoYS5raW5kID09PSBcImhvbWV3b3JrXCIpIHtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgKGEudGFza0lkID09PSBudWxsICYmXG4gICAgICAgICAgYS5sZXNzb25JZCAhPT0gbnVsbCAmJlxuICAgICAgICAgIGUubGVzc29ucy5zb21lKFxuICAgICAgICAgICAgKGwpID0+XG4gICAgICAgICAgICAgIGwuaWQgPT09IGEubGVzc29uSWQgJiZcbiAgICAgICAgICAgICAgbC5wcm9qZWN0SWQgPT09IGEucHJvamVjdElkICYmXG4gICAgICAgICAgICAgIGwuYWlFbmFibGVkICYmXG4gICAgICAgICAgICAgIGwuc3RhdGUgPT09IFwiZW5kZWRcIixcbiAgICAgICAgICApKSB8fFxuICAgICAgICAgIChhLmxlc3NvbklkID09PSBudWxsICYmXG4gICAgICAgICAgICBhLnRhc2tJZCAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgZS5jb21wbGV0ZWRUYXNrcy5zb21lKFxuICAgICAgICAgICAgICAodCkgPT4gdC5pZCA9PT0gYS50YXNrSWQgJiYgdC5wcm9qZWN0SWQgPT09IGEucHJvamVjdElkLFxuICAgICAgICAgICAgKSksXG4gICAgICAgIFwiXHU0RjVDXHU0RTFBXHU1RkM1XHU5ODdCXHU2NzY1XHU4MUVBXHU2NzJDXHU5ODc5XHU3NkVFXHU1REYyXHU3RUQzXHU2NzVGXHU3Njg0QUlcdThCRkVcdTdBMEJcdTYyMTZcdTVERjJcdTVCOENcdTYyMTBcdTVCNjZcdTRFNjBcdTRFRkJcdTUyQTFcIixcbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChhLmtpbmQgPT09IFwicmV0ZXN0XCIpIHtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgYS5yZXRlc3RPZkdyYWRlSWQgIT09IG51bGwgJiZcbiAgICAgICAgICBlLmdyYWRlcy5zb21lKChnKSA9PiB7XG4gICAgICAgICAgICBpZiAoZy5pZCAhPT0gYS5yZXRlc3RPZkdyYWRlSWQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBlLnN1Ym1pc3Npb25zLnNvbWUoKHMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHMuaWQgIT09IGcuc3VibWlzc2lvbklkKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgIHJldHVybiBlLmFzc2Vzc21lbnRzLnNvbWUoXG4gICAgICAgICAgICAgICAgKG9yaWdpbmFsKSA9PlxuICAgICAgICAgICAgICAgICAgb3JpZ2luYWwuaWQgPT09IHMuYXNzZXNzbWVudElkICYmXG4gICAgICAgICAgICAgICAgICBvcmlnaW5hbC5wcm9qZWN0SWQgPT09IGEucHJvamVjdElkLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSksXG4gICAgICAgIFwiXHU1OTBEXHU2RDRCXHU1RkM1XHU5ODdCXHU1MTczXHU4MDU0XHU2NzJDXHU5ODc5XHU3NkVFXHU1MzlGXHU1OUNCXHU2Mjc5XHU2NTM5XCIsXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbnN1cmUoYS5yZXRlc3RPZkdyYWRlSWQgPT09IG51bGwsIFwiXHU1M0VBXHU2NzA5XHU1OTBEXHU2RDRCXHU1M0VGXHU0RUU1XHU1RjE1XHU3NTI4XHU1MzlGXHU1OUNCXHU2Mjc5XHU2NTM5XCIpO1xuICAgIH1cbiAgICBpZiAoYS5raW5kID09PSBcIndlZWtseUV4YW1cIikge1xuICAgICAgZW5zdXJlKHdlZWtkYXlNb25kYXkobG9jYWxEYXRlT2YoYS5zdGFydHNBdCkpID49IDYsIFwiXHU1NDY4XHU4MDAzXHU1Qjg5XHU2MzkyXHU1NzI4XHU1NDY4XHU2NzJCXCIpO1xuICAgIH1cbiAgICBpZiAoYS5raW5kICE9PSBcImhvbWV3b3JrXCIpIHtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgIWUubGVzc29ucy5zb21lKFxuICAgICAgICAgIChsKSA9PiBsLnN0YXJ0c0F0IDwgYS5lbmRzQXQgJiYgbC5lbmRzQXQgPiBhLnN0YXJ0c0F0LFxuICAgICAgICApICYmXG4gICAgICAgICAgIWUuYXNzZXNzbWVudHMuc29tZShcbiAgICAgICAgICAgIChiKSA9PlxuICAgICAgICAgICAgICBiLmlkICE9PSBhLmlkICYmXG4gICAgICAgICAgICAgIGIua2luZCAhPT0gXCJob21ld29ya1wiICYmXG4gICAgICAgICAgICAgIGIuc3RhcnRzQXQgPCBhLmVuZHNBdCAmJlxuICAgICAgICAgICAgICBiLmVuZHNBdCA+IGEuc3RhcnRzQXQsXG4gICAgICAgICAgKSxcbiAgICAgICAgXCJcdTgwMDNcdThCRDVcdTRFMEVcdThCRkVcdTdBMEJcdTYyMTZcdTUxNzZcdTRFRDZcdTgwMDNcdThCRDVcdTUxQjJcdTdBODFcIixcbiAgICAgICk7XG4gICAgfVxuICAgIHVuaXF1ZUVkdWNhdGlvbklkcyhhLnF1ZXN0aW9ucy5tYXAoKHEpID0+IHEuaWQpKTtcbiAgICBmb3IgKGNvbnN0IHEgb2YgYS5xdWVzdGlvbnMpIHtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgY2hlY2tUZXh0KHEucHJvbXB0LCA1MDAwMCkgJiZcbiAgICAgICAgICBjaGVja1RleHQocS5hbnN3ZXIsIDUwMDAwKSAmJlxuICAgICAgICAgIHEudG9waWNzLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICBxLmVzdGltYXRlZE1pbnV0ZXMgPiAwICYmXG4gICAgICAgICAgcS5zY29yaW5nLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICBxLnNvdXJjZUlkcy5sZW5ndGggPiAwICYmXG4gICAgICAgICAgcS5zb3VyY2VJZHMuZXZlcnkoKGlkKSA9PiByZXNvdXJjZShpZCwgYS5wcm9qZWN0SWQpICE9PSB1bmRlZmluZWQpLFxuICAgICAgICBcIlx1NkJDRlx1OTg5OFx1NUZDNVx1OTg3Qlx1NjcwOVx1Njc2NVx1NkU5MFx1MzAwMVx1NzdFNVx1OEJDNlx1NzBCOVx1MzAwMVx1NEYzMFx1NjVGNlx1MzAwMVx1N0I1NFx1Njg0OFx1NTQ4Q1x1OEJDNFx1NTIwNlx1NzBCOVwiLFxuICAgICAgKTtcbiAgICAgIHVuaXF1ZUVkdWNhdGlvbklkcyhxLnNjb3JpbmcubWFwKChwKSA9PiBwLmlkKSk7XG4gICAgICBmb3IgKGNvbnN0IHAgb2YgcS5zY29yaW5nKSB7XG4gICAgICAgIGVuc3VyZShcbiAgICAgICAgICBwLnBvaW50cyA+IDAgJiYgY2hlY2tUZXh0KHAuZGVzY3JpcHRpb24sIDUwMDAwKSxcbiAgICAgICAgICBcIlx1OEJDNFx1NTIwNlx1NzBCOVx1OTcwMFx1ODk4MVx1NTIwNlx1NTAzQ1x1NEUwRVx1NTIyNFx1NTIwNlx1NEY5RFx1NjM2RVwiLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKCFxLmV4dGVuc2lvbiAmJiBhLmtpbmQgIT09IFwibW9ja0V4YW1cIiAmJiBhLmtpbmQgIT09IFwicmV0ZXN0XCIpIHtcbiAgICAgICAgZW5zdXJlKFxuICAgICAgICAgIHEudG9waWNzLmV2ZXJ5KFxuICAgICAgICAgICAgKHQpID0+XG4gICAgICAgICAgICAgIGUubGVzc29ucy5zb21lKFxuICAgICAgICAgICAgICAgIChsKSA9PlxuICAgICAgICAgICAgICAgICAgbC5wcm9qZWN0SWQgPT09IGEucHJvamVjdElkICYmXG4gICAgICAgICAgICAgICAgICBsLnN0YXRlID09PSBcImVuZGVkXCIgJiZcbiAgICAgICAgICAgICAgICAgIGwudG9waWNzLmluY2x1ZGVzKHQpLFxuICAgICAgICAgICAgICApIHx8XG4gICAgICAgICAgICAgIGUuY29tcGxldGVkVGFza3Muc29tZShcbiAgICAgICAgICAgICAgICAodGFzaykgPT5cbiAgICAgICAgICAgICAgICAgIHRhc2sucHJvamVjdElkID09PSBhLnByb2plY3RJZCAmJiB0YXNrLnRvcGljcy5pbmNsdWRlcyh0KSxcbiAgICAgICAgICAgICAgKSB8fFxuICAgICAgICAgICAgICBlLnByb2dyZXNzLnNvbWUoXG4gICAgICAgICAgICAgICAgKHIpID0+XG4gICAgICAgICAgICAgICAgICByLnByb2plY3RJZCA9PT0gYS5wcm9qZWN0SWQgJiYgci5jb25maXJtZWQgJiYgci50b3BpYyA9PT0gdCxcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICApLFxuICAgICAgICAgIFwiXHU1N0ZBXHU3ODQwXHU3RUMzXHU0RTYwXHU0RTBEXHU4MEZEXHU1MzA1XHU1NDJCXHU1QzFBXHU2NzJBXHU2Mzg4XHU4QkZFXHU3Njg0XHU3N0U1XHU4QkM2XHU3MEI5XHVGRjFCXHU2MkQzXHU1QzU1XHU5ODk4XHU5ODdCXHU2NjBFXHU3ODZFXHU2ODA3XHU4QkIwXCIsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgcyBvZiBlLnN1Ym1pc3Npb25zKSB7XG4gICAgY29uc3QgYSA9IGUuYXNzZXNzbWVudHMuZmluZCgoeCkgPT4geC5pZCA9PT0gcy5hc3Nlc3NtZW50SWQpO1xuICAgIGVuc3VyZShhICE9PSB1bmRlZmluZWQsIFwiXHU2M0QwXHU0RUE0XHU1RjE1XHU3NTI4XHU0RTg2XHU0RTBEXHU1QjU4XHU1NzI4XHU3Njg0XHU4QkQ1XHU5ODk4XCIpO1xuICAgIGVuc3VyZShcbiAgICAgIHMucmVzb3VyY2VJZHMuZXZlcnkoKGlkKSA9PiByZXNvdXJjZShpZCwgYS5wcm9qZWN0SWQpICE9PSB1bmRlZmluZWQpLFxuICAgICAgXCJcdTdCNTRcdTUzNzdcdTk2NDRcdTRFRjZcdTVGQzVcdTk4N0JcdTVDNUVcdTRFOEVcdTY3MkNcdTk4NzlcdTc2RUVcIixcbiAgICApO1xuICAgIHVuaXF1ZUVkdWNhdGlvbklkcyhzLnF1ZXN0aW9uVGltZXMubWFwKCh0KSA9PiB0LnF1ZXN0aW9uSWQpKTtcbiAgICBmb3IgKGNvbnN0IHQgb2Ygcy5xdWVzdGlvblRpbWVzKSB7XG4gICAgICBlbnN1cmUoXG4gICAgICAgIGEucXVlc3Rpb25zLnNvbWUoKHEpID0+IHEuaWQgPT09IHQucXVlc3Rpb25JZCkgJiZcbiAgICAgICAgICB0LmxvY2FsVGltZS5sZW5ndGggPT09IDUgJiZcbiAgICAgICAgICBtaW51dGVzT2YodC5sb2NhbFRpbWUpICE9PSBudWxsLFxuICAgICAgICBcIlx1NkJDRlx1OTg5OFx1OEJCMFx1NUY1NVx1NjcyQ1x1NjczQUhIOk1NXHU1QjhDXHU2MjEwXHU2NUY2XHU1MjNCXCIsXG4gICAgICApO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IGcgb2YgZS5ncmFkZXMpIHtcbiAgICBjb25zdCBzID0gZS5zdWJtaXNzaW9ucy5maW5kKCh4KSA9PiB4LmlkID09PSBnLnN1Ym1pc3Npb25JZCk7XG4gICAgZW5zdXJlKHMgIT09IHVuZGVmaW5lZCwgXCJcdTYyNzlcdTY1MzlcdTdGM0FcdTVDMTFcdTYzRDBcdTRFQTRcdTcyNDhcdTY3MkNcIik7XG4gICAgY29uc3QgYSA9IGUuYXNzZXNzbWVudHMuZmluZCgoeCkgPT4geC5pZCA9PT0gcy5hc3Nlc3NtZW50SWQpO1xuICAgIGVuc3VyZShhICE9PSB1bmRlZmluZWQsIFwiXHU4QkQ1XHU5ODk4XHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgIGVuc3VyZShcbiAgICAgIGcuYXNzZXNzbWVudFJldmlzaW9uID09PSBhLnJldmlzaW9uICYmIGNoZWNrVGV4dChnLmZlZWRiYWNrLCA1MDAwMCksXG4gICAgICBcIlx1NjI3OVx1NjUzOVx1NUZDNVx1OTg3Qlx1NUYxNVx1NzUyOFx1NTNEMVx1NUUwM1x1NjVGNlx1NzY4NFx1OEJDNFx1NTIwNlx1NzI0OFx1NjcyQ1x1NUU3Nlx1N0VEOVx1NTFGQVx1NTNDRFx1OTk4OFwiLFxuICAgICk7XG4gICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGZvciAoY29uc3QgYXdhcmQgb2YgZy5hd2FyZHMpIHtcbiAgICAgIGNvbnN0IHBvaW50ID0gYS5xdWVzdGlvbnNcbiAgICAgICAgLmZpbmQoKHEpID0+IHEuaWQgPT09IGF3YXJkLnF1ZXN0aW9uSWQpXG4gICAgICAgID8uc2NvcmluZy5maW5kKChwKSA9PiBwLmlkID09PSBhd2FyZC5wb2ludElkKTtcbiAgICAgIGVuc3VyZShwb2ludCAhPT0gdW5kZWZpbmVkLCBcIlx1NjI3OVx1NjUzOVx1NEUwRFx1ODBGRFx1NEUzNFx1NjVGNlx1NTg5RVx1NTJBMFx1OEJDNFx1NTIwNlx1NzBCOVwiKTtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgYXdhcmQuYXdhcmRlZCA8PSBwb2ludC5wb2ludHMgJiZcbiAgICAgICAgICBjaGVja1RleHQoYXdhcmQuZXZpZGVuY2UsIDUwMDAwKSAmJlxuICAgICAgICAgICFzZWVuLmhhcyhgJHthd2FyZC5xdWVzdGlvbklkfXwke2F3YXJkLnBvaW50SWR9YCksXG4gICAgICAgIFwiXHU4QkM0XHU1MjA2XHU4RDg1XHU4MzAzXHU1NkY0XHUzMDAxXHU5MUNEXHU1OTBEXHU2MjE2XHU3RjNBXHU1QzExXHU3QjU0XHU1Mzc3XHU4QkMxXHU2MzZFXCIsXG4gICAgICApO1xuICAgICAgc2Vlbi5hZGQoYCR7YXdhcmQucXVlc3Rpb25JZH18JHthd2FyZC5wb2ludElkfWApO1xuICAgIH1cbiAgICBjb25zdCB0b3RhbFBvaW50cyA9IGEucXVlc3Rpb25zLnJlZHVjZSgobiwgcSkgPT4gbiArIHEuc2NvcmluZy5sZW5ndGgsIDApO1xuICAgIGVuc3VyZShcbiAgICAgIGcubmVlZHNSZXZpZXcgfHwgZy5hd2FyZHMubGVuZ3RoID09PSB0b3RhbFBvaW50cyxcbiAgICAgIFwiXHU2QjYzXHU1RjBGXHU2Mjc5XHU2NTM5XHU1RkM1XHU5ODdCXHU4OTg2XHU3NkQ2XHU1MTY4XHU5MEU4XHU4QkM0XHU1MjA2XHU3MEI5XHVGRjFCXHU4QkM2XHU1MjJCXHU0RTBEXHU2RTA1XHU4QkY3XHU2ODA3XHU4QkIwXHU1Rjg1XHU1OTBEXHU2ODM4XCIsXG4gICAgKTtcbiAgICBmb3IgKGNvbnN0IGVycm9yIG9mIGcuZXJyb3JzKSB7XG4gICAgICBlbnN1cmUoXG4gICAgICAgIGEucXVlc3Rpb25zLnNvbWUoKHEpID0+IHEuaWQgPT09IGVycm9yLnF1ZXN0aW9uSWQpICYmXG4gICAgICAgICAgY2hlY2tUZXh0KGVycm9yLmNhdXNlLCA1MDAwMCkgJiZcbiAgICAgICAgICBjaGVja1RleHQoZXJyb3IuZXZpZGVuY2UsIDUwMDAwKSAmJlxuICAgICAgICAgIGNoZWNrVGV4dChlcnJvci5jb3JyZWN0aW9uLCA1MDAwMCkgJiZcbiAgICAgICAgICBjaGVja1RleHQoZXJyb3IubmV4dENoZWNrLCA1MDAwMCkgJiZcbiAgICAgICAgICB2YWxpZEVkdWNhdGlvbkRhdGUoZXJyb3IucmV0ZXN0RGF0ZSksXG4gICAgICAgIFwiXHU5NTE5XHU1NkUwXHU1MjA2XHU2NzkwXHU5NzAwXHU4OTgxXHU4QkMxXHU2MzZFXHUzMDAxXHU3RUEwXHU2QjYzXHU1MkE4XHU0RjVDXHU1NDhDXHU1OTBEXHU2RDRCXHU2NUU1XHU2NzFGXCIsXG4gICAgICApO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IHIgb2YgZS5yZXZpZXdzKSB7XG4gICAgZW5zdXJlKFxuICAgICAgcHJvamVjdEV4aXN0cyhyLnByb2plY3RJZCkgJiZcbiAgICAgICAgdmFsaWRFZHVjYXRpb25EYXRlKHIuZGF0ZSkgJiZcbiAgICAgICAgY2hlY2tUZXh0KHIuZmluZGluZ3MsIDUwMDAwKSAmJlxuICAgICAgICByLmFjdGlvbnMubGVuZ3RoID4gMCAmJlxuICAgICAgICByLmdyYWRlSWRzLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgci5ncmFkZUlkcy5ldmVyeSgoaWQpID0+XG4gICAgICAgICAgZS5ncmFkZXMuc29tZSgoZykgPT4ge1xuICAgICAgICAgICAgaWYgKGcuaWQgIT09IGlkKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gZS5zdWJtaXNzaW9ucy5zb21lKChzKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChzLmlkICE9PSBnLnN1Ym1pc3Npb25JZCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICByZXR1cm4gZS5hc3Nlc3NtZW50cy5zb21lKFxuICAgICAgICAgICAgICAgIChhKSA9PiBhLmlkID09PSBzLmFzc2Vzc21lbnRJZCAmJiBhLnByb2plY3RJZCA9PT0gci5wcm9qZWN0SWQsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KSxcbiAgICAgICAgKSxcbiAgICAgIFwiXHU1OTBEXHU3NkQ4XHU1RkM1XHU5ODdCXHU1RjE1XHU3NTI4XHU2NzJDXHU5ODc5XHU3NkVFXHU2Mjc5XHU2NTM5XHU1RTc2XHU3RUQ5XHU1MUZBXHU1NDBFXHU3RUVEXHU4ODRDXHU1MkE4XCIsXG4gICAgKTtcbiAgfVxuICBmb3IgKGNvbnN0IGV2ZW50IG9mIGUuZXZlbnRzKSB7XG4gICAgZW5zdXJlKFxuICAgICAgcHJvamVjdEV4aXN0cyhldmVudC5wcm9qZWN0SWQpICYmXG4gICAgICAgIFtcInBlbmRpbmdcIiwgXCJydW5uaW5nXCIsIFwiZG9uZVwiXS5pbmNsdWRlcyhldmVudC5zdGF0ZSkgJiZcbiAgICAgICAgW1xuICAgICAgICAgIFwiaG9tZXdvcmtcIixcbiAgICAgICAgICBcInRhc2tIb21ld29ya1wiLFxuICAgICAgICAgIFwiZ3JhZGVcIixcbiAgICAgICAgICBcImNvcnJlY3Rpb25cIixcbiAgICAgICAgICBcInJldmlld1wiLFxuICAgICAgICAgIFwid2Vla2x5RXhhbVwiLFxuICAgICAgICBdLmluY2x1ZGVzKGV2ZW50LmtpbmQpLFxuICAgICAgXCJcdTY1RTBcdTY1NDhcdTc2ODRcdTY1NTlcdTVCNjZcdTRFOEJcdTRFRjZcIixcbiAgICApO1xuICB9XG4gIHZhbGlkYXRlTGVhcm5pbmcoZGF0YSk7XG59XG5cbmZ1bmN0aW9uIHVuaXF1ZUVkdWNhdGlvbklkcyhpZHM6IHN0cmluZ1tdKTogdm9pZCB7XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgZm9yIChjb25zdCBpZCBvZiBpZHMpIHtcbiAgICBlbnN1cmUoXG4gICAgICBpZC50cmltKCkubGVuZ3RoID4gMCAmJiBpZC5sZW5ndGggPD0gMjAwICYmICFzZWVuLmhhcyhpZCksXG4gICAgICBcIlx1NjU1OVx1NUI2Nlx1NUI5RVx1NEY1MyBJRCBcdTRFM0FcdTdBN0FcdTMwMDFcdThGQzdcdTk1N0ZcdTYyMTZcdTkxQ0RcdTU5MERcIixcbiAgICApO1xuICAgIHNlZW4uYWRkKGlkKTtcbiAgfVxufVxuXG4vKiogXHU1QkZDXHU1MTY1XHU1M0VGXHU2MDYyXHU1OTBEXHU4QkIwXHU1RjU1XHVGRjBDXHU0RjQ2XHU0RTBEXHU1Rjk3XHU5NzU5XHU5RUQ4XHU2NTM5XHU1MTk5XHU1REYyXHU1M0QxXHU1RTAzXHU5ODk4XHU3NkVFXHU2MjE2XHU1Mzg2XHU1M0YyXHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVFZHVjYXRpb25UcmFuc2l0aW9uKFxuICBiZWZvcmU6IEVkdWNhdGlvbixcbiAgYWZ0ZXI6IEVkdWNhdGlvbixcbik6IHZvaWQge1xuICB2YWxpZGF0ZUxlYXJuaW5nVHJhbnNpdGlvbihiZWZvcmUsIGFmdGVyKTtcbiAgZm9yIChjb25zdCBsaW5rIG9mIGJlZm9yZS5mb2N1c1Rhc2tzKSB7XG4gICAgZW5zdXJlKFxuICAgICAgYWZ0ZXIuZm9jdXNUYXNrcy5zb21lKFxuICAgICAgICAoeCkgPT5cbiAgICAgICAgICB4LnRhc2tJZCA9PT0gbGluay50YXNrSWQgJiZcbiAgICAgICAgICB4LnNvdXJjZUlkID09PSBsaW5rLnNvdXJjZUlkICYmXG4gICAgICAgICAgeC5raW5kID09PSBsaW5rLmtpbmQsXG4gICAgICApLFxuICAgICAgXCJcdTVERjJcdTVFRkFcdTdBQ0JcdTc2ODRcdTY1NTlcdTVCNjZcdTVGODVcdTUyOUVcdTY3NjVcdTZFOTBcdTUxNzNcdTgwNTRcdTRFMERcdTgwRkRcdTUyMjBcdTk2NjRcdTYyMTZcdTY1MzlcdTUxOTlcIixcbiAgICApO1xuICB9XG4gIGNvbnN0IGFjdGl2ZVJlc291cmNlcyA9IG5ldyBTZXQoYWZ0ZXIucmVzb3VyY2VzLm1hcCgocikgPT4gci5pZCkpO1xuICBjb25zdCByZWZlcmVuY2VzID0gYmVmb3JlLnJlc291cmNlUmVmZXJlbmNlSW5kZXgoKTtcbiAgZm9yIChjb25zdCByZXNvdXJjZSBvZiBiZWZvcmUucmVzb3VyY2VzKSB7XG4gICAgaWYgKCFhY3RpdmVSZXNvdXJjZXMuaGFzKHJlc291cmNlLmlkKSkge1xuICAgICAgZW5zdXJlKFxuICAgICAgICAhcmVmZXJlbmNlcy5oYXMocmVzb3VyY2UuaWQpLFxuICAgICAgICBcIlx1NjU1OVx1NUI2Nlx1NTM4Nlx1NTNGMlx1NUYxNVx1NzUyOFx1NzY4NFx1OEQ0NFx1NkU5MFx1NzY3Qlx1OEJCMFx1NEUwRFx1ODBGRFx1NTIyMFx1OTY2NFx1RkYwQ1x1OEJGN1x1NEZFRVx1NTkwRFx1OERFRlx1NUY4NFwiLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgZm9yIChjb25zdCBhIG9mIGJlZm9yZS5hc3Nlc3NtZW50cykge1xuICAgIGVuc3VyZShcbiAgICAgIGFmdGVyLmFzc2Vzc21lbnRzLnNvbWUoKGIpID0+IGIuaWQgPT09IGEuaWQpLFxuICAgICAgXCJcdTVERjJcdTUzRDFcdTVFMDNcdThCRDVcdTUzNzdcdTRFMERcdTgwRkRcdTUyMjBcdTk2NjRcIixcbiAgICApO1xuICAgIGNvbnN0IGIgPSBhZnRlci5hc3Nlc3NtZW50cy5maW5kKCh4KSA9PiB4LmlkID09PSBhLmlkKTtcbiAgICBpZiAoYiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBvbGQgPSBjbG9uZUFzc2Vzc21lbnQoYSk7XG4gICAgICBvbGQucHJpbnRlZEF0ID0gYi5wcmludGVkQXQ7XG4gICAgICBvbGQuc3RhcnRlZEF0ID0gYi5zdGFydGVkQXQ7XG4gICAgICBvbGQuc3RvcHBlZEF0ID0gYi5zdG9wcGVkQXQ7XG4gICAgICBlbnN1cmUoXG4gICAgICAgIGFzc2Vzc21lbnRFcXVhbHMob2xkLCBiKSxcbiAgICAgICAgXCJcdTVERjJcdTUzRDFcdTVFMDNcdTk4OThcdTc2RUVcdTRFMEVcdThCQzRcdTUyMDZcdTY4MDdcdTUxQzZcdTRFMERcdTUzRUZcdTg4QUJcdTVCRkNcdTUxNjVcdTYyMTZcdTg4NjVcdTRFMDFcdTY1MzlcdTUxOTlcIixcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgcyBvZiBiZWZvcmUuc3VibWlzc2lvbnMpIHtcbiAgICBjb25zdCBiID0gYWZ0ZXIuc3VibWlzc2lvbnMuZmluZCgoeCkgPT4geC5pZCA9PT0gcy5pZCk7XG4gICAgZW5zdXJlKFxuICAgICAgYiAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgY29uc3Qgb2xkID0gY2xvbmVTdWJtaXNzaW9uKHMpO1xuICAgICAgICAgIG9sZC5xdWVzdGlvblRpbWVzID0gYi5xdWVzdGlvblRpbWVzLm1hcCgodCkgPT4gKHsgLi4udCB9KSk7XG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIHN1Ym1pc3Npb25FcXVhbHMob2xkLCBiKSAmJlxuICAgICAgICAgICAgc3RhcnRzV2l0aFF1ZXN0aW9uVGltZXMoYi5xdWVzdGlvblRpbWVzLCBzLnF1ZXN0aW9uVGltZXMpICYmXG4gICAgICAgICAgICAoYi5xdWVzdGlvblRpbWVzLmxlbmd0aCA9PT0gcy5xdWVzdGlvblRpbWVzLmxlbmd0aCB8fFxuICAgICAgICAgICAgICAhYmVmb3JlLmdyYWRlcy5zb21lKChnKSA9PiBnLnN1Ym1pc3Npb25JZCA9PT0gcy5pZCkpXG4gICAgICAgICAgKTtcbiAgICAgICAgfSkoKSxcbiAgICAgIFwiXHU2M0QwXHU0RUE0XHU1Mzg2XHU1M0YyXHU0RTBEXHU1M0VGXHU2NTM5XHU1MTk5XHVGRjFCXHU1M0VBXHU4MEZEXHU1NzI4XHU2Mjc5XHU2NTM5XHU1MjREXHU4ODY1XHU1MTQ1XHU3RjNBXHU1OTMxXHU3Njg0XHU1QjhDXHU2MjEwXHU2NUY2XHU1MjNCXCIsXG4gICAgKTtcbiAgfVxuICBmb3IgKGNvbnN0IGcgb2YgYmVmb3JlLmdyYWRlcykge1xuICAgIGNvbnN0IGIgPSBhZnRlci5ncmFkZXMuZmluZCgoeCkgPT4geC5pZCA9PT0gZy5pZCk7XG4gICAgZW5zdXJlKGIgIT09IHVuZGVmaW5lZCAmJiBncmFkZUVxdWFscyhiLCBnKSwgXCJcdTYyNzlcdTY1MzlcdTUzODZcdTUzRjJcdTRFMERcdTUzRUZcdTY1MzlcdTUxOTlcIik7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2xvbmVBc3Nlc3NtZW50KGE6IEFzc2Vzc21lbnQpOiBBc3Nlc3NtZW50IHtcbiAgcmV0dXJuIHtcbiAgICAuLi5hLFxuICAgIHF1ZXN0aW9uczogYS5xdWVzdGlvbnMubWFwKChxKSA9PiAoe1xuICAgICAgLi4ucSxcbiAgICAgIHRvcGljczogWy4uLnEudG9waWNzXSxcbiAgICAgIHNvdXJjZUlkczogWy4uLnEuc291cmNlSWRzXSxcbiAgICAgIHNjb3Jpbmc6IHEuc2NvcmluZy5tYXAoKHApID0+ICh7IC4uLnAgfSkpLFxuICAgIH0pKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2xvbmVTdWJtaXNzaW9uKHM6IFN1Ym1pc3Npb24pOiBTdWJtaXNzaW9uIHtcbiAgcmV0dXJuIHtcbiAgICAuLi5zLFxuICAgIHJlc291cmNlSWRzOiBbLi4ucy5yZXNvdXJjZUlkc10sXG4gICAgcXVlc3Rpb25UaW1lczogcy5xdWVzdGlvblRpbWVzLm1hcCgodCkgPT4gKHsgLi4udCB9KSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGFzc2Vzc21lbnRFcXVhbHMoYTogQXNzZXNzbWVudCwgYjogQXNzZXNzbWVudCk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZUFzc2Vzc21lbnQoYSkpID09PVxuICAgIEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZUFzc2Vzc21lbnQoYikpXG4gICk7XG59XG5cbmZ1bmN0aW9uIHN1Ym1pc3Npb25FcXVhbHMoYTogU3VibWlzc2lvbiwgYjogU3VibWlzc2lvbik6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZVN1Ym1pc3Npb24oYSkpID09PVxuICAgIEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZVN1Ym1pc3Npb24oYikpXG4gICk7XG59XG5cbmZ1bmN0aW9uIGdyYWRlRXF1YWxzKGE6IEdyYWRlLCBiOiBHcmFkZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZUdyYWRlKGEpKSA9PT0gSlNPTi5zdHJpbmdpZnkoc2VyaWFsaXplR3JhZGUoYikpXG4gICk7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0c1dpdGhRdWVzdGlvblRpbWVzKFxuICBsaXN0OiBRdWVzdGlvblRpbWVbXSxcbiAgcHJlZml4OiBRdWVzdGlvblRpbWVbXSxcbik6IGJvb2xlYW4ge1xuICByZXR1cm4gcHJlZml4LmV2ZXJ5KFxuICAgIChwLCBpKSA9PlxuICAgICAgbGlzdFtpXSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICBsaXN0W2ldIS5xdWVzdGlvbklkID09PSBwLnF1ZXN0aW9uSWQgJiZcbiAgICAgIGxpc3RbaV0hLmxvY2FsVGltZSA9PT0gcC5sb2NhbFRpbWUsXG4gICk7XG59XG5cbi8vIC0tLS0tLS0tLS0gRWR1Y2F0aW9uIFx1ODlFM1x1Njc5MC9cdTVFOEZcdTUyMTdcdTUzMTYgLS0tLS0tLS0tLVxuXG5jb25zdCBFRFVDQVRJT05fS0VZUyA9IFtcbiAgXCJmb2N1c1Rhc2tzXCIsXG4gIFwicHJvamVjdHNcIixcbiAgXCJyZXNvdXJjZXNcIixcbiAgXCJzZW1lc3RlcnNcIixcbiAgXCJzZW1lc3Rlckhpc3RvcnlcIixcbiAgXCJsZXNzb25zXCIsXG4gIFwiYXNzZXNzbWVudHNcIixcbiAgXCJzdWJtaXNzaW9uc1wiLFxuICBcImdyYWRlc1wiLFxuICBcInJldmlld3NcIixcbiAgXCJldmVudHNcIixcbiAgXCJjb21wbGV0ZWRUYXNrc1wiLFxuICBcInByb2dyZXNzXCIsXG4gIFwiY29ycmVjdGlvbnNcIixcbl0gYXMgY29uc3Q7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUVkdWNhdGlvbihyYXc6IHVua25vd24pOiBFZHVjYXRpb24ge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NjU1OVx1NUI2Nlx1NjU3MFx1NjM2RVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIFsuLi5FRFVDQVRJT05fS0VZU10sIFwiXHU2NTU5XHU1QjY2XHU2NTcwXHU2MzZFXCIpO1xuICBjb25zdCBlID0gbmV3IEVkdWNhdGlvbigpO1xuICBlLmZvY3VzVGFza3MgPSBmaWVsZChcbiAgICByYXcsXG4gICAgXCJmb2N1c1Rhc2tzXCIsXG4gICAgXCJcdTY1NTlcdTVCNjZcdTY1NzBcdTYzNkVcIixcbiAgICAodikgPT5cbiAgICAgIGFzQXJyYXkodiwgXCJmb2N1c1Rhc2tzXCIpLm1hcCgoeCkgPT4ge1xuICAgICAgICBlbnN1cmUoaXNPYmplY3QoeCksIFwiXHU2NTU5XHU1QjY2XHU1Rjg1XHU1MjlFXHU1MTczXHU4MDU0XHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICAgICAgICByZWplY3RVbmtub3duKHgsIFtcInRhc2tJZFwiLCBcInNvdXJjZUlkXCIsIFwia2luZFwiXSwgXCJcdTY1NTlcdTVCNjZcdTVGODVcdTUyOUVcdTUxNzNcdTgwNTRcIik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdGFza0lkOiByZXF1aXJlZEZpZWxkKHgsIFwidGFza0lkXCIsIFwiXHU2NTU5XHU1QjY2XHU1Rjg1XHU1MjlFXHU1MTczXHU4MDU0XCIsIGFzU3RyKSxcbiAgICAgICAgICBzb3VyY2VJZDogcmVxdWlyZWRGaWVsZCh4LCBcInNvdXJjZUlkXCIsIFwiXHU2NTU5XHU1QjY2XHU1Rjg1XHU1MjlFXHU1MTczXHU4MDU0XCIsIGFzU3RyKSxcbiAgICAgICAgICBraW5kOiBvbmVPZihcbiAgICAgICAgICAgIHJlcXVpcmVkRmllbGQoeCwgXCJraW5kXCIsIFwiXHU2NTU5XHU1QjY2XHU1Rjg1XHU1MjlFXHU1MTczXHU4MDU0XCIsIChrKSA9PiBrKSxcbiAgICAgICAgICAgIFwiXHU2NTU5XHU1QjY2XHU1Rjg1XHU1MjlFIGtpbmRcIixcbiAgICAgICAgICAgIFtcImxlc3NvblwiLCBcImhvbWV3b3JrXCJdLFxuICAgICAgICAgICkgYXMgXCJsZXNzb25cIiB8IFwiaG9tZXdvcmtcIixcbiAgICAgICAgfTtcbiAgICAgIH0pLFxuICAgIFtdLFxuICApO1xuICBlLnByb2plY3RzID0gZmllbGQoXG4gICAgcmF3LFxuICAgIFwicHJvamVjdHNcIixcbiAgICBcIlx1NjU1OVx1NUI2Nlx1NjU3MFx1NjM2RVwiLFxuICAgICh2KSA9PiBhc0FycmF5KHYsIFwicHJvamVjdHNcIikubWFwKHBhcnNlUHJvamVjdFN0dWR5KSxcbiAgICBbXSxcbiAgKTtcbiAgZS5yZXNvdXJjZXMgPSBmaWVsZChcbiAgICByYXcsXG4gICAgXCJyZXNvdXJjZXNcIixcbiAgICBcIlx1NjU1OVx1NUI2Nlx1NjU3MFx1NjM2RVwiLFxuICAgICh2KSA9PiBhc0FycmF5KHYsIFwicmVzb3VyY2VzXCIpLm1hcChwYXJzZVJlc291cmNlKSxcbiAgICBbXSxcbiAgKTtcbiAgZS5zZW1lc3RlcnMgPSBmaWVsZChcbiAgICByYXcsXG4gICAgXCJzZW1lc3RlcnNcIixcbiAgICBcIlx1NjU1OVx1NUI2Nlx1NjU3MFx1NjM2RVwiLFxuICAgICh2KSA9PiBhc0FycmF5KHYsIFwic2VtZXN0ZXJzXCIpLm1hcChwYXJzZVNlbWVzdGVyKSxcbiAgICBbXSxcbiAgKTtcbiAgZS5zZW1lc3Rlckhpc3RvcnkgPSBmaWVsZChcbiAgICByYXcsXG4gICAgXCJzZW1lc3Rlckhpc3RvcnlcIixcbiAgICBcIlx1NjU1OVx1NUI2Nlx1NjU3MFx1NjM2RVwiLFxuICAgICh2KSA9PiBhc0FycmF5KHYsIFwic2VtZXN0ZXJIaXN0b3J5XCIpLm1hcChwYXJzZVNlbWVzdGVyKSxcbiAgICBbXSxcbiAgKTtcbiAgZS5sZXNzb25zID0gZmllbGQoXG4gICAgcmF3LFxuICAgIFwibGVzc29uc1wiLFxuICAgIFwiXHU2NTU5XHU1QjY2XHU2NTcwXHU2MzZFXCIsXG4gICAgKHYpID0+IGFzQXJyYXkodiwgXCJsZXNzb25zXCIpLm1hcChwYXJzZUxlc3NvbiksXG4gICAgW10sXG4gICk7XG4gIGUuYXNzZXNzbWVudHMgPSBmaWVsZChcbiAgICByYXcsXG4gICAgXCJhc3Nlc3NtZW50c1wiLFxuICAgIFwiXHU2NTU5XHU1QjY2XHU2NTcwXHU2MzZFXCIsXG4gICAgKHYpID0+IGFzQXJyYXkodiwgXCJhc3Nlc3NtZW50c1wiKS5tYXAocGFyc2VBc3Nlc3NtZW50KSxcbiAgICBbXSxcbiAgKTtcbiAgZS5zdWJtaXNzaW9ucyA9IGZpZWxkKFxuICAgIHJhdyxcbiAgICBcInN1Ym1pc3Npb25zXCIsXG4gICAgXCJcdTY1NTlcdTVCNjZcdTY1NzBcdTYzNkVcIixcbiAgICAodikgPT4gYXNBcnJheSh2LCBcInN1Ym1pc3Npb25zXCIpLm1hcChwYXJzZVN1Ym1pc3Npb24pLFxuICAgIFtdLFxuICApO1xuICBlLmdyYWRlcyA9IGZpZWxkKFxuICAgIHJhdyxcbiAgICBcImdyYWRlc1wiLFxuICAgIFwiXHU2NTU5XHU1QjY2XHU2NTcwXHU2MzZFXCIsXG4gICAgKHYpID0+IGFzQXJyYXkodiwgXCJncmFkZXNcIikubWFwKHBhcnNlR3JhZGUpLFxuICAgIFtdLFxuICApO1xuICBlLnJldmlld3MgPSBmaWVsZChcbiAgICByYXcsXG4gICAgXCJyZXZpZXdzXCIsXG4gICAgXCJcdTY1NTlcdTVCNjZcdTY1NzBcdTYzNkVcIixcbiAgICAodikgPT4gYXNBcnJheSh2LCBcInJldmlld3NcIikubWFwKHBhcnNlUmV2aWV3KSxcbiAgICBbXSxcbiAgKTtcbiAgZS5ldmVudHMgPSBmaWVsZChcbiAgICByYXcsXG4gICAgXCJldmVudHNcIixcbiAgICBcIlx1NjU1OVx1NUI2Nlx1NjU3MFx1NjM2RVwiLFxuICAgICh2KSA9PiBhc0FycmF5KHYsIFwiZXZlbnRzXCIpLm1hcChwYXJzZVRlYWNoaW5nRXZlbnQpLFxuICAgIFtdLFxuICApO1xuICBlLmNvbXBsZXRlZFRhc2tzID0gZmllbGQoXG4gICAgcmF3LFxuICAgIFwiY29tcGxldGVkVGFza3NcIixcbiAgICBcIlx1NjU1OVx1NUI2Nlx1NjU3MFx1NjM2RVwiLFxuICAgICh2KSA9PiBhc0FycmF5KHYsIFwiY29tcGxldGVkVGFza3NcIikubWFwKHBhcnNlQ29tcGxldGVkU3R1ZHlUYXNrKSxcbiAgICBbXSxcbiAgKTtcbiAgZS5wcm9ncmVzcyA9IGZpZWxkKFxuICAgIHJhdyxcbiAgICBcInByb2dyZXNzXCIsXG4gICAgXCJcdTY1NTlcdTVCNjZcdTY1NzBcdTYzNkVcIixcbiAgICAodikgPT4gYXNBcnJheSh2LCBcInByb2dyZXNzXCIpLm1hcChwYXJzZVByb2dyZXNzUmVjb3JkKSxcbiAgICBbXSxcbiAgKTtcbiAgZS5jb3JyZWN0aW9ucyA9IGZpZWxkKFxuICAgIHJhdyxcbiAgICBcImNvcnJlY3Rpb25zXCIsXG4gICAgXCJcdTY1NTlcdTVCNjZcdTY1NzBcdTYzNkVcIixcbiAgICAodikgPT4gYXNBcnJheSh2LCBcImNvcnJlY3Rpb25zXCIpLm1hcChwYXJzZUNvcnJlY3Rpb24pLFxuICAgIFtdLFxuICApO1xuICByZXR1cm4gZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZUVkdWNhdGlvbihlOiBFZHVjYXRpb24pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7XG4gICAgZm9jdXNUYXNrczogZS5mb2N1c1Rhc2tzLm1hcCgodCkgPT4gKHtcbiAgICAgIHRhc2tJZDogdC50YXNrSWQsXG4gICAgICBzb3VyY2VJZDogdC5zb3VyY2VJZCxcbiAgICAgIGtpbmQ6IHQua2luZCxcbiAgICB9KSksXG4gICAgcHJvamVjdHM6IGUucHJvamVjdHMubWFwKHNlcmlhbGl6ZVByb2plY3RTdHVkeSksXG4gICAgcmVzb3VyY2VzOiBlLnJlc291cmNlcy5tYXAoc2VyaWFsaXplUmVzb3VyY2UpLFxuICAgIHNlbWVzdGVyczogZS5zZW1lc3RlcnMubWFwKHNlcmlhbGl6ZVNlbWVzdGVyKSxcbiAgICBzZW1lc3Rlckhpc3Rvcnk6IGUuc2VtZXN0ZXJIaXN0b3J5Lm1hcChzZXJpYWxpemVTZW1lc3RlciksXG4gICAgbGVzc29uczogZS5sZXNzb25zLm1hcChzZXJpYWxpemVMZXNzb24pLFxuICAgIGFzc2Vzc21lbnRzOiBlLmFzc2Vzc21lbnRzLm1hcChzZXJpYWxpemVBc3Nlc3NtZW50KSxcbiAgICBzdWJtaXNzaW9uczogZS5zdWJtaXNzaW9ucy5tYXAoc2VyaWFsaXplU3VibWlzc2lvbiksXG4gICAgZ3JhZGVzOiBlLmdyYWRlcy5tYXAoc2VyaWFsaXplR3JhZGUpLFxuICAgIHJldmlld3M6IGUucmV2aWV3cy5tYXAoc2VyaWFsaXplUmV2aWV3KSxcbiAgICBldmVudHM6IGUuZXZlbnRzLm1hcChzZXJpYWxpemVUZWFjaGluZ0V2ZW50KSxcbiAgICBjb21wbGV0ZWRUYXNrczogZS5jb21wbGV0ZWRUYXNrcy5tYXAoc2VyaWFsaXplQ29tcGxldGVkU3R1ZHlUYXNrKSxcbiAgICBwcm9ncmVzczogZS5wcm9ncmVzcy5tYXAoc2VyaWFsaXplUHJvZ3Jlc3NSZWNvcmQpLFxuICAgIGNvcnJlY3Rpb25zOiBlLmNvcnJlY3Rpb25zLm1hcChzZXJpYWxpemVDb3JyZWN0aW9uKSxcbiAgfTtcbn1cbiIsICIvLyEgXHU2NTU5XHU1QjY2XHU2MjY3XHU4ODRDXHVGRjFBXHU4QkZFXHU3QTBCL1x1NEY1Q1x1NEUxQVx1NTIzMFx1NjY2RVx1OTAxQVx1NUY4NVx1NTI5RVx1NzY4NFx1NEUwMFx1NUJGOVx1NEUwMFx1Njc2NVx1NkU5MFx1NTE3M1x1ODA1NFx1MzAwMVx1NjUzOVx1NjcxRlx1NjZGNFx1NjVCMFx1MzAwMVx1NjYwRVx1Nzg2RVx1NTNDMlx1NEUwRVx1MzAwMVxuLy8hIFx1NjNEMFx1NEVBNFx1NUI4Q1x1NjIxMFx1NEUwRVx1OTFDRFx1NTkwRFx1NEY1Q1x1NEUxQVx1NjI5MVx1NTIzNlx1RkYxQlx1OEJBMVx1NTIxMlx1NUJGQ1x1NTFGQVx1NjM5Mlx1OTY2NFx1NUU3Nlx1NEZERFx1NzU1OVx1NjU1OVx1NUI2Nlx1NUY4NVx1NTI5RVx1MzAwMlxuLy8hIFx1NUJGOVx1NUU5NCBjcmF0ZXMvY29yZS9zcmMvdGVhY2hpbmdfdGFza3MucnNcdTMwMDJcblxuaW1wb3J0IHsgQXBwRXJyb3IsIGVuc3VyZSB9IGZyb20gXCIuL2Vycm9yc1wiO1xuaW1wb3J0IHsgaWQgfSBmcm9tIFwiLi9pZHNcIjtcbmltcG9ydCB0eXBlIHsgQXBwRGF0YSB9IGZyb20gXCIuL2xpYlwiO1xuaW1wb3J0IHR5cGUgeyBUZWFjaGluZ1Rhc2ssIFRlYWNoaW5nVGFza0tpbmQgfSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHsgZGF0ZUF0LCBob3VyTWludXRlU3RyaW5nIH0gZnJvbSBcIi4vdGltZVwiO1xuaW1wb3J0IHsgcmVjb3JkU2Vzc2lvbiwgcmVzZXRUbywgc3RhcnRUaW1lciB9IGZyb20gXCIuL3JlbWluZGVyc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gdGVhY2hpbmdUYXNrKFxuICBkYXRhOiBBcHBEYXRhLFxuICB0YXNrSWQ6IHN0cmluZyxcbik6IFRlYWNoaW5nVGFzayB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiBkYXRhLmVkdWNhdGlvbi5mb2N1c1Rhc2tzLmZpbmQoKGxpbmspID0+IGxpbmsudGFza0lkID09PSB0YXNrSWQpO1xufVxuXG4vKiogXHU2NTU5XHU1QjY2XHU2NzY1XHU2RTkwXHU2MkU1XHU2NzA5XHU1Qjg5XHU2MzkyXHVGRjFBXHU4QkZFXHU3QTBCL1x1NEY1Q1x1NEUxQVx1NzUxRlx1NjIxMFx1NjIxNlx1NjZGNFx1NjVCMFx1NjY2RVx1OTAxQVx1NUY4NVx1NTI5RVx1RkYwQ1x1NjUzOVx1NjcxRlx1NjUzOVx1NTE4NVx1NUJCOVx1OTY4Rlx1Njc2NVx1NkU5MFx1OEQ3MFx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGVyaWFsaXplVGVhY2hpbmdUYXNrcyhkYXRhOiBBcHBEYXRhLCBhdDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGVuYWJsZWQgPSBuZXcgU2V0KFxuICAgIGRhdGEuZWR1Y2F0aW9uLnByb2plY3RzLmZpbHRlcigocCkgPT4gcC5leGFtTW9kZSkubWFwKChwKSA9PiBwLnByb2plY3RJZCksXG4gICk7XG4gIGNvbnN0IHNvdXJjZXM6IHtcbiAgICBraW5kOiBUZWFjaGluZ1Rhc2tLaW5kO1xuICAgIHNvdXJjZUlkOiBzdHJpbmc7XG4gICAgcHJvamVjdElkOiBzdHJpbmc7XG4gICAgdGl0bGU6IHN0cmluZztcbiAgICBub3Rlczogc3RyaW5nO1xuICAgIHN0YXJ0c0F0OiBudW1iZXI7XG4gICAgbWludXRlczogbnVtYmVyO1xuICB9W10gPSBbXTtcbiAgZm9yIChjb25zdCBsZXNzb24gb2YgZGF0YS5lZHVjYXRpb24ubGVzc29ucykge1xuICAgIGlmIChcbiAgICAgIGVuYWJsZWQuaGFzKGxlc3Nvbi5wcm9qZWN0SWQpICYmXG4gICAgICBkYXRlQXQobGVzc29uLnN0YXJ0c0F0KSA+PSBkYXRlQXQoYXQpXG4gICAgKSB7XG4gICAgICBzb3VyY2VzLnB1c2goe1xuICAgICAgICBraW5kOiBcImxlc3NvblwiLFxuICAgICAgICBzb3VyY2VJZDogbGVzc29uLmlkLFxuICAgICAgICBwcm9qZWN0SWQ6IGxlc3Nvbi5wcm9qZWN0SWQsXG4gICAgICAgIHRpdGxlOiBsZXNzb24udGl0bGUsXG4gICAgICAgIG5vdGVzOiBsZXNzb24udG9waWNzLmpvaW4oXCJcdTMwMDFcIiksXG4gICAgICAgIHN0YXJ0c0F0OiBsZXNzb24uc3RhcnRzQXQsXG4gICAgICAgIG1pbnV0ZXM6IDQ1LFxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgcGFwZXIgb2YgZGF0YS5lZHVjYXRpb24uYXNzZXNzbWVudHMpIHtcbiAgICBpZiAocGFwZXIua2luZCA9PT0gXCJob21ld29ya1wiICYmIGVuYWJsZWQuaGFzKHBhcGVyLnByb2plY3RJZCkpIHtcbiAgICAgIGxldCBtaW51dGVzID0gMDtcbiAgICAgIGZvciAoY29uc3QgcSBvZiBwYXBlci5xdWVzdGlvbnMpIHtcbiAgICAgICAgbWludXRlcyA9IE1hdGgubWluKDQyOTQ5NjcyOTUsIG1pbnV0ZXMgKyBxLmVzdGltYXRlZE1pbnV0ZXMpO1xuICAgICAgfVxuICAgICAgc291cmNlcy5wdXNoKHtcbiAgICAgICAga2luZDogXCJob21ld29ya1wiLFxuICAgICAgICBzb3VyY2VJZDogcGFwZXIuaWQsXG4gICAgICAgIHByb2plY3RJZDogcGFwZXIucHJvamVjdElkLFxuICAgICAgICB0aXRsZTogcGFwZXIudGl0bGUsXG4gICAgICAgIG5vdGVzOiBwYXBlci5pbnN0cnVjdGlvbnMsXG4gICAgICAgIHN0YXJ0c0F0OiBwYXBlci5zdGFydHNBdCxcbiAgICAgICAgbWludXRlczogTWF0aC5tYXgoMSwgbWludXRlcyksXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgY29uc3QgbGlua3MgPSBuZXcgTWFwPHN0cmluZywgVGVhY2hpbmdUYXNrPigpO1xuICBmb3IgKGNvbnN0IGxpbmsgb2YgZGF0YS5lZHVjYXRpb24uZm9jdXNUYXNrcykge1xuICAgIGxpbmtzLnNldChsaW5rLnNvdXJjZUlkLCBsaW5rKTtcbiAgfVxuICBjb25zdCBwb3NpdGlvbnMgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICBkYXRhLnRhc2tzLmZvckVhY2goKHRhc2ssIGkpID0+IHBvc2l0aW9ucy5zZXQodGFzay5pZCwgaSkpO1xuICBjb25zdCBzdWJtaXNzaW9ucyA9IG5ldyBNYXA8XG4gICAgc3RyaW5nLFxuICAgIHsgc3VibWl0dGVkQXQ6IG51bWJlcjsgdW5maW5pc2hlZDogYm9vbGVhbiB9XG4gID4oKTtcbiAgZm9yIChjb25zdCBzdWJtaXNzaW9uIG9mIGRhdGEuZWR1Y2F0aW9uLnN1Ym1pc3Npb25zKSB7XG4gICAgY29uc3QgbGFzdCA9IHN1Ym1pc3Npb25zLmdldChzdWJtaXNzaW9uLmFzc2Vzc21lbnRJZCk7XG4gICAgaWYgKGxhc3QgPT09IHVuZGVmaW5lZCB8fCBzdWJtaXNzaW9uLnN1Ym1pdHRlZEF0ID49IGxhc3Quc3VibWl0dGVkQXQpIHtcbiAgICAgIHN1Ym1pc3Npb25zLnNldChzdWJtaXNzaW9uLmFzc2Vzc21lbnRJZCwge1xuICAgICAgICBzdWJtaXR0ZWRBdDogc3VibWlzc2lvbi5zdWJtaXR0ZWRBdCxcbiAgICAgICAgdW5maW5pc2hlZDogc3VibWlzc2lvbi51bmZpbmlzaGVkLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gIGZvciAoY29uc3Qge1xuICAgIGtpbmQsXG4gICAgc291cmNlSWQsXG4gICAgcHJvamVjdElkLFxuICAgIHRpdGxlLFxuICAgIG5vdGVzLFxuICAgIHN0YXJ0c0F0LFxuICAgIG1pbnV0ZXMsXG4gIH0gb2Ygc291cmNlcykge1xuICAgIGNvbnN0IGxpbmsgPSBsaW5rcy5nZXQoc291cmNlSWQpO1xuICAgIGNvbnN0IHRhc2tJZCA9XG4gICAgICBsaW5rICE9PSB1bmRlZmluZWQgJiYgbGluay5raW5kID09PSBraW5kID8gbGluay50YXNrSWQgOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgcG9zaXRpb24gPSB0YXNrSWQgIT09IHVuZGVmaW5lZCA/IHBvc2l0aW9ucy5nZXQodGFza0lkKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAodGFza0lkICE9PSB1bmRlZmluZWQgJiYgcG9zaXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IGR1ZURhdGUgPSBkYXRlQXQoc3RhcnRzQXQpO1xuICAgIGNvbnN0IGlzTGVzc29uID0ga2luZCA9PT0gXCJsZXNzb25cIjtcbiAgICBjb25zdCByZW1pbmRlciA9IGlzTGVzc29uID8gaG91ck1pbnV0ZVN0cmluZyhzdGFydHNBdCkgOiBudWxsO1xuICAgIGNvbnN0IGZvY3VzID0gaXNMZXNzb24gPyA0NSA6IE1hdGgubWluKG1pbnV0ZXMsIGRhdGEuc2V0dGluZ3MuZm9jdXNNaW51dGVzKTtcbiAgICBjb25zdCBlc3RpbWF0ZSA9IE1hdGgubWF4KDEsIE1hdGguY2VpbChtaW51dGVzIC8gZm9jdXMpKTtcbiAgICBjb25zdCBzY3JhcCA9IGlzTGVzc29uXG4gICAgICA/ICgoKSA9PiB7XG4gICAgICAgICAgY29uc3QgZCA9IG5ldyBEYXRlKHN0YXJ0c0F0ICogMTAwMCk7XG4gICAgICAgICAgcmV0dXJuIE1hdGgubWF4KDAsIDE0NDAgLSBkLmdldEhvdXJzKCkgKiA2MCAtIGQuZ2V0TWludXRlcygpIC0gNDUpO1xuICAgICAgICB9KSgpXG4gICAgICA6IDA7XG4gICAgbGV0IGluZGV4OiBudW1iZXI7XG4gICAgaWYgKHBvc2l0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGluZGV4ID0gcG9zaXRpb247XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHRhc2tJZE5ldyA9IGlkKCk7XG4gICAgICBkYXRhLmVkdWNhdGlvbi5mb2N1c1Rhc2tzLnB1c2goeyB0YXNrSWQ6IHRhc2tJZE5ldywgc291cmNlSWQsIGtpbmQgfSk7XG4gICAgICBkYXRhLnRhc2tzLnB1c2goe1xuICAgICAgICBpZDogdGFza0lkTmV3LFxuICAgICAgICB0ZW1wbGF0ZUlkOiBudWxsLFxuICAgICAgICByZWN1cnJpbmc6IGZhbHNlLFxuICAgICAgICB0aXRsZSxcbiAgICAgICAgbm90ZXMsXG4gICAgICAgIHByb2plY3RJZCxcbiAgICAgICAgaGFiaXRJZDogbnVsbCxcbiAgICAgICAgZHVlRGF0ZSxcbiAgICAgICAgcmVtaW5kZXJUaW1lOiByZW1pbmRlcixcbiAgICAgICAgZm9jdXNNaW51dGVzOiBmb2N1cyxcbiAgICAgICAgc2NyYXBNaW51dGVzOiBzY3JhcCxcbiAgICAgICAgcHJpb3JpdHk6IDEsXG4gICAgICAgIGVzdGltYXRlLFxuICAgICAgICByZW1pbmRlckZpcmVkOiBmYWxzZSxcbiAgICAgICAgcmVtaW5kZXJQZW5kaW5nOiBmYWxzZSxcbiAgICAgICAgcmVtaW5kZXJFeHBpcmVkOiBmYWxzZSxcbiAgICAgICAgY29tcGxldGVkOiBmYWxzZSxcbiAgICAgICAgY29tcGxldGVkQXQ6IG51bGwsXG4gICAgICAgIGNyZWF0ZWRBdDogYXQsXG4gICAgICAgIHRhZ3M6IFtpc0xlc3NvbiA/IFwiXHU4QkZFXHU3QTBCXCIgOiBcIlx1NEY1Q1x1NEUxQVwiXSxcbiAgICAgICAgc3VidGFza3M6IFtdLFxuICAgICAgfSk7XG4gICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIGluZGV4ID0gZGF0YS50YXNrcy5sZW5ndGggLSAxO1xuICAgIH1cbiAgICBjb25zdCB0YXNrID0gZGF0YS50YXNrc1tpbmRleF0hO1xuICAgIGlmIChcbiAgICAgICF0YXNrLmNvbXBsZXRlZCAmJlxuICAgICAgKHRhc2sudGl0bGUgIT09IHRpdGxlIHx8XG4gICAgICAgIHRhc2subm90ZXMgIT09IG5vdGVzIHx8XG4gICAgICAgIHRhc2sucHJvamVjdElkICE9PSBwcm9qZWN0SWQgfHxcbiAgICAgICAgdGFzay5kdWVEYXRlICE9PSBkdWVEYXRlIHx8XG4gICAgICAgIHRhc2sucmVtaW5kZXJUaW1lICE9PSByZW1pbmRlciB8fFxuICAgICAgICB0YXNrLmZvY3VzTWludXRlcyAhPT0gZm9jdXMgfHxcbiAgICAgICAgdGFzay5lc3RpbWF0ZSAhPT0gZXN0aW1hdGUgfHxcbiAgICAgICAgdGFzay5zY3JhcE1pbnV0ZXMgIT09IHNjcmFwKVxuICAgICkge1xuICAgICAgaWYgKHRhc2suZHVlRGF0ZSAhPT0gZHVlRGF0ZSB8fCB0YXNrLnJlbWluZGVyVGltZSAhPT0gcmVtaW5kZXIpIHtcbiAgICAgICAgdGFzay5yZW1pbmRlckZpcmVkID0gZmFsc2U7XG4gICAgICAgIHRhc2sucmVtaW5kZXJQZW5kaW5nID0gZmFsc2U7XG4gICAgICAgIHRhc2sucmVtaW5kZXJFeHBpcmVkID0gZmFsc2U7XG4gICAgICB9XG4gICAgICB0YXNrLnRpdGxlID0gdGl0bGU7XG4gICAgICB0YXNrLm5vdGVzID0gbm90ZXM7XG4gICAgICB0YXNrLnByb2plY3RJZCA9IHByb2plY3RJZDtcbiAgICAgIHRhc2suZHVlRGF0ZSA9IGR1ZURhdGU7XG4gICAgICB0YXNrLnJlbWluZGVyVGltZSA9IHJlbWluZGVyO1xuICAgICAgdGFzay5mb2N1c01pbnV0ZXMgPSBmb2N1cztcbiAgICAgIHRhc2suZXN0aW1hdGUgPSBlc3RpbWF0ZTtcbiAgICAgIHRhc2suc2NyYXBNaW51dGVzID0gc2NyYXA7XG4gICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGtpbmQgPT09IFwiaG9tZXdvcmtcIikge1xuICAgICAgY29uc3Qgc3VibWl0dGVkID0gKCgpID0+IHtcbiAgICAgICAgY29uc3QgbGFzdCA9IHN1Ym1pc3Npb25zLmdldChzb3VyY2VJZCk7XG4gICAgICAgIGlmIChsYXN0ID09PSB1bmRlZmluZWQgfHwgbGFzdC51bmZpbmlzaGVkKSByZXR1cm4gbnVsbDtcbiAgICAgICAgcmV0dXJuIGxhc3Quc3VibWl0dGVkQXQ7XG4gICAgICB9KSgpO1xuICAgICAgaWYgKFxuICAgICAgICB0YXNrLmNvbXBsZXRlZCAhPT0gKHN1Ym1pdHRlZCAhPT0gbnVsbCkgfHxcbiAgICAgICAgdGFzay5jb21wbGV0ZWRBdCAhPT0gc3VibWl0dGVkXG4gICAgICApIHtcbiAgICAgICAgaWYgKHN1Ym1pdHRlZCAhPT0gbnVsbCAmJiBkYXRhLnRpbWVyLnRhc2tJZCA9PT0gdGFzay5pZCkge1xuICAgICAgICAgIHJlY29yZFNlc3Npb24oZGF0YSwgYXQsIGZhbHNlKTtcbiAgICAgICAgICBkYXRhLnRpbWVyLnRhc2tJZCA9IG51bGw7XG4gICAgICAgICAgcmVzZXRUbyhkYXRhLCBcImZvY3VzXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRhc2suY29tcGxldGVkID0gc3VibWl0dGVkICE9PSBudWxsO1xuICAgICAgICB0YXNrLmNvbXBsZXRlZEF0ID0gc3VibWl0dGVkO1xuICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNoYW5nZWQ7XG59XG5cbi8qKiBcdTY2MEVcdTc4NkVcdTVCOENcdTYyMTBcdThCRkVcdTdBMEJcdTVGODVcdTUyOUUgPSBcdTUzQzJcdTRFMEVcdThCRkVcdTdBMEJcdUZGMUJcdTRGNUNcdTRFMUFcdTUzRUFcdTgwRkRcdTRFQ0VcdTRGNUNcdTRFMUFcdTUxNjVcdTUzRTNcdTYzRDBcdTRFQTRcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wbGV0ZVRlYWNoaW5nVGFzayhcbiAgZGF0YTogQXBwRGF0YSxcbiAgdGFza0lkOiBzdHJpbmcsXG4gIGF0OiBudW1iZXIsXG4pOiB2b2lkIHtcbiAgY29uc3QgbGluayA9IHRlYWNoaW5nVGFzayhkYXRhLCB0YXNrSWQpO1xuICBpZiAobGluayA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gIGlmIChsaW5rLmtpbmQgPT09IFwiaG9tZXdvcmtcIikge1xuICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJGN1x1NEVDRVx1NEY1Q1x1NEUxQVx1NTE2NVx1NTNFM1x1NjNEMFx1NEVBNFx1N0I1NFx1NTM3N1x1RkYwQ1x1NjNEMFx1NEVBNFx1NUI4Q1x1NjIxMFx1NTQwRVx1NEYxQVx1ODFFQVx1NTJBOFx1NUI4Q1x1NjIxMFx1NUY4NVx1NTI5RVwiKTtcbiAgfVxuICBjb25zdCBsZXNzb24gPSBkYXRhLmVkdWNhdGlvbi5sZXNzb25zLmZpbmQoKGwpID0+IGwuaWQgPT09IGxpbmsuc291cmNlSWQpO1xuICBlbnN1cmUobGVzc29uICE9PSB1bmRlZmluZWQsIFwiXHU4QkZFXHU3QTBCXHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICBsZXNzb24uYXR0ZW5kZWQgPSB0cnVlO1xuICBpZiAobGVzc29uLnByb2dyZXNzLnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAgICBsZXNzb24ucHJvZ3Jlc3MgPVxuICAgICAgXCJcdTY3MkNcdTRFQkFcdTRFQ0VcdTRFQ0FcdTY1RTVcdTRFMTNcdTZDRThcdTc4NkVcdThCQTRcdThCRkVcdTdBMEJcdTRFRkJcdTUyQTFcdTVCOENcdTYyMTBcdUZGMENcdTUxNzdcdTRGNTNcdTVCNjZcdTRFNjBcdTRGNERcdTdGNkVcdTVGODVcdTg4NjVcdTUxNDVcdUZGMUJcdTYzOENcdTYzRTFcdTYwQzVcdTUxQjVcdTVGODVcdTU5MERcdTZENEJcIjtcbiAgfVxuICBpZiAoYXQgPj0gbGVzc29uLmVuZHNBdCkge1xuICAgIGxlc3Nvbi5zdGF0ZSA9IFwiZW5kZWRcIjtcbiAgICBpZiAobGVzc29uLmFpRW5hYmxlZCkge1xuICAgICAgZGF0YS5lZHVjYXRpb24uZXZlbnQobGVzc29uLnByb2plY3RJZCwgXCJob21ld29ya1wiLCBsZXNzb24uaWQsIGF0KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFx1ODFFQVx1NTJBOFx1OEJBMVx1NjVGNlx1NEUwRFx1Nzg2RVx1OEJBNFx1OEJGRVx1N0EwQlx1NTNDMlx1NEUwRVx1RkYxQVx1NTNFQVx1NjcwOVx1NjYwRVx1Nzg2RVx1NUYwMFx1NTlDQi9cdTVCOENcdTYyMTBcdTYyNERcdTdCOTdcdTUzQzJcdTRFMEVcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGFydFRlYWNoaW5nVGFzayhkYXRhOiBBcHBEYXRhLCBhdDogbnVtYmVyKTogdm9pZCB7XG4gIGlmIChkYXRhLnRpbWVyLm1vZGUgIT09IFwiZm9jdXNcIikgcmV0dXJuO1xuICBjb25zdCBsaW5rID1cbiAgICBkYXRhLnRpbWVyLnRhc2tJZCAhPT0gbnVsbFxuICAgICAgPyB0ZWFjaGluZ1Rhc2soZGF0YSwgZGF0YS50aW1lci50YXNrSWQpXG4gICAgICA6IHVuZGVmaW5lZDtcbiAgaWYgKGxpbmsgPT09IHVuZGVmaW5lZCB8fCBsaW5rLmtpbmQgIT09IFwibGVzc29uXCIpIHJldHVybjtcbiAgY29uc3QgbGVzc29uID0gZGF0YS5lZHVjYXRpb24ubGVzc29ucy5maW5kKChsKSA9PiBsLmlkID09PSBsaW5rLnNvdXJjZUlkKTtcbiAgaWYgKGxlc3NvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGF0ID49IGxlc3Nvbi5zdGFydHNBdCAmJiBhdCA8IGxlc3Nvbi5lbmRzQXQpIHtcbiAgICAgIGxlc3Nvbi5hdHRlbmRlZCA9IHRydWU7XG4gICAgfVxuICB9XG59XG5cbi8qKiBcdTY3NjVcdTZFOTBcdTUxNzNcdTgwNTRcdTRFMDBcdTVCRjlcdTRFMDBcdTMwMDFcdTU0MENcdTk4NzlcdTc2RUVcdTMwMDFcdTVCOUVcdTRGOEJcdTRFM0FcdTU1MkZcdTRFMDBcdTY2NkVcdTkwMUFcdTRFRkJcdTUyQTFcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVRlYWNoaW5nVGFza3MoZGF0YTogQXBwRGF0YSk6IHZvaWQge1xuICBjb25zdCB0YXNrcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBzb3VyY2VzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgbGluayBvZiBkYXRhLmVkdWNhdGlvbi5mb2N1c1Rhc2tzKSB7XG4gICAgY29uc3QgdGFzayA9IGRhdGEudGFza3MuZmluZCgodCkgPT4gdC5pZCA9PT0gbGluay50YXNrSWQpO1xuICAgIGVuc3VyZSh0YXNrICE9PSB1bmRlZmluZWQsIFwiXHU2NTU5XHU1QjY2XHU1Rjg1XHU1MjlFXHU1MTczXHU4MDU0XHU3Njg0XHU0RUZCXHU1MkExXHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgIGNvbnN0IHByb2plY3QgPSAoKCkgPT4ge1xuICAgICAgaWYgKGxpbmsua2luZCA9PT0gXCJsZXNzb25cIikge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIGRhdGEuZWR1Y2F0aW9uLmxlc3NvbnMuZmluZCgobCkgPT4gbC5pZCA9PT0gbGluay5zb3VyY2VJZClcbiAgICAgICAgICAgID8ucHJvamVjdElkID8/IG51bGxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAoXG4gICAgICAgIGRhdGEuZWR1Y2F0aW9uLmFzc2Vzc21lbnRzLmZpbmQoXG4gICAgICAgICAgKGEpID0+IGEuaWQgPT09IGxpbmsuc291cmNlSWQgJiYgYS5raW5kID09PSBcImhvbWV3b3JrXCIsXG4gICAgICAgICk/LnByb2plY3RJZCA/PyBudWxsXG4gICAgICApO1xuICAgIH0pKCk7XG4gICAgZW5zdXJlKHByb2plY3QgIT09IG51bGwsIFwiXHU2NTU5XHU1QjY2XHU1Rjg1XHU1MjlFXHU2NzY1XHU2RTkwXHU0RTBEXHU1QjU4XHU1NzI4XHU2MjE2XHU3QzdCXHU1NzhCXHU0RTBEXHU3QjI2XCIpO1xuICAgIGlmIChcbiAgICAgIHRhc2sucHJvamVjdElkICE9PSBwcm9qZWN0IHx8XG4gICAgICB0YXNrcy5oYXMobGluay50YXNrSWQpIHx8XG4gICAgICBzb3VyY2VzLmhhcyhsaW5rLnNvdXJjZUlkKSB8fFxuICAgICAgdGFzay50ZW1wbGF0ZUlkICE9PSBudWxsIHx8XG4gICAgICB0YXNrLmhhYml0SWQgIT09IG51bGwgfHxcbiAgICAgIHRhc2sucmVjdXJyaW5nXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTY1NTlcdTVCNjZcdTY3NjVcdTZFOTBcdTVGQzVcdTk4N0JcdTUxNzNcdTgwNTRcdTU0MENcdTk4NzlcdTc2RUVcdTc2ODRcdTU1MkZcdTRFMDBcdTY2NkVcdTkwMUFcdTRFRkJcdTUyQTFcIik7XG4gICAgfVxuICAgIHRhc2tzLmFkZChsaW5rLnRhc2tJZCk7XG4gICAgc291cmNlcy5hZGQobGluay5zb3VyY2VJZCk7XG4gIH1cbn1cbiIsICIvLyEgXHU1QjlFXHU0RjUzXHU4RUFCXHU0RUZEXHVGRjFBXHU1MjIwXHU5NjY0XHU1NDBFXHU0RUNEXHU0RkREXHU3NTU5XHU3NjdCXHU4QkIwXHVGRjFCXHU2NEE0XHU5NTAwXHU2MDYyXHU1OTBEXHU1NDBDXHU0RTAwXHU0RUZCXHU1MkExXHVGRjFCXHU4REU4XHU3QzdCXHU1NzhCXHU1NTJGXHU0RTAwXHUzMDAyXG4vLyEgXHU1QkY5XHU1RTk0IGNyYXRlcy9jb3JlL3NyYy9pZGVudGl0aWVzLnJzXHUzMDAyXG5cbmltcG9ydCB7IEFwcEVycm9yLCBlbnN1cmUsIHV0ZjhMZW4gfSBmcm9tIFwiLi9lcnJvcnNcIjtcbmltcG9ydCB7XG4gIGFzT3B0LFxuICBhc1N0cixcbiAgZmllbGQsXG4gIGlzT2JqZWN0LFxuICByZWplY3RVbmtub3duLFxuICByZXF1aXJlZEZpZWxkLFxufSBmcm9tIFwiLi9qc29uXCI7XG5pbXBvcnQgdHlwZSB7IEFwcERhdGEgfSBmcm9tIFwiLi9saWJcIjtcbmltcG9ydCB0eXBlIHsgSWRlbnRpdHkgfSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHsgcGFyc2VUYXNrLCBzZXJpYWxpemVUYXNrIH0gZnJvbSBcIi4vbGliXCI7XG5cbmNvbnN0IElERU5USVRZX0tFWVMgPSBbXCJpZFwiLCBcImtpbmRcIiwgXCJyZXRpcmVkXCIsIFwicmVzdG9yZVRhc2tcIl0gYXMgY29uc3Q7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUlkZW50aXR5KHJhdzogdW5rbm93bik6IElkZW50aXR5IHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJJRCBcdTc2N0JcdThCQjBcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24ocmF3LCBbLi4uSURFTlRJVFlfS0VZU10sIFwiSUQgXHU3NjdCXHU4QkIwXCIpO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIklEIFx1NzY3Qlx1OEJCMFwiLCBhc1N0ciksXG4gICAga2luZDogcmVxdWlyZWRGaWVsZChyYXcsIFwia2luZFwiLCBcIklEIFx1NzY3Qlx1OEJCMFwiLCBhc1N0ciksXG4gICAgcmV0aXJlZDogcmVxdWlyZWRGaWVsZChyYXcsIFwicmV0aXJlZFwiLCBcIklEIFx1NzY3Qlx1OEJCMFwiLCAodikgPT4ge1xuICAgICAgaWYgKHR5cGVvZiB2ICE9PSBcImJvb2xlYW5cIikgdGhyb3cgbmV3IEFwcEVycm9yKFwicmV0aXJlZCBcdTVGQzVcdTk4N0JcdTY2MkZcdTVFMDNcdTVDMTRcdTUwM0NcIik7XG4gICAgICByZXR1cm4gdjtcbiAgICB9KSxcbiAgICByZXN0b3JlVGFzazogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInJlc3RvcmVUYXNrXCIsXG4gICAgICBcIklEIFx1NzY3Qlx1OEJCMFwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwicmVzdG9yZVRhc2tcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVJZGVudGl0eShpOiBJZGVudGl0eSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogaS5pZCxcbiAgICBraW5kOiBpLmtpbmQsXG4gICAgcmV0aXJlZDogaS5yZXRpcmVkLFxuICAgIHJlc3RvcmVUYXNrOiBpLnJlc3RvcmVUYXNrLFxuICB9O1xufVxuXG4vKiogXHU1RjUzXHU1MjREXHU2RDNCXHU4REMzXHU1QjlFXHU0RjUzIElEIFx1MjE5MiBcdTdDN0JcdTU3OEJcdTMwMDIgKi9cbmZ1bmN0aW9uIGFjdGl2ZUlkZW50aXRpZXMoZGF0YTogQXBwRGF0YSk6IE1hcDxzdHJpbmcsIHN0cmluZz4ge1xuICBjb25zdCBpZHMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBjb25zdCBhZGQgPSAoaWQ6IHN0cmluZywga2luZDogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgaWYgKGlkLnRyaW0oKS5sZW5ndGggPT09IDAgfHwgdXRmOExlbihpZCkgPiAyMDAgfHwgaWRzLmhhcyhpZCkpIHtcbiAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NzJFQ1x1N0FDQlx1NUI5RVx1NEY1MyBJRCBcdTRFM0FcdTdBN0FcdTMwMDFcdThGQzdcdTk1N0ZcdTYyMTZcdTkxQ0RcdTU5MERcIik7XG4gICAgfVxuICAgIGlkcy5zZXQoaWQsIGtpbmQpO1xuICB9O1xuICBmb3IgKGNvbnN0IHggb2YgZGF0YS5wcm9qZWN0cykgYWRkKHguaWQsIFwicHJvamVjdFwiKTtcbiAgZm9yIChjb25zdCB4IG9mIGRhdGEuaGFiaXRzKSBhZGQoeC5pZCwgXCJoYWJpdFwiKTtcbiAgZm9yIChjb25zdCB4IG9mIGRhdGEudmlzaW9ucykgYWRkKHguaWQsIFwidmlzaW9uXCIpO1xuICBmb3IgKGNvbnN0IHggb2YgZGF0YS5ibG9ja3MpIGFkZCh4LmlkLCBcImJsb2NrXCIpO1xuICBmb3IgKGNvbnN0IHggb2YgZGF0YS50YXNrcykgYWRkKHguaWQsIFwidGFza1wiKTtcbiAgZm9yIChjb25zdCB4IG9mIGRhdGEudGVtcGxhdGVzKSBhZGQoeC5pZCwgXCJ0ZW1wbGF0ZVwiKTtcbiAgZm9yIChjb25zdCB4IG9mIGRhdGEuc2Vzc2lvbnMpIGFkZCh4LmlkLCBcInNlc3Npb25cIik7XG4gIGZvciAoY29uc3QgeCBvZiBkYXRhLmVkdWNhdGlvbi5yZXNvdXJjZXMpIGFkZCh4LmlkLCBcInJlc291cmNlXCIpO1xuICBmb3IgKGNvbnN0IHggb2YgZGF0YS5lZHVjYXRpb24uc2VtZXN0ZXJzKSBhZGQoeC5pZCwgXCJzZW1lc3RlclwiKTtcbiAgZm9yIChjb25zdCB4IG9mIGRhdGEuZWR1Y2F0aW9uLmxlc3NvbnMpIGFkZCh4LmlkLCBcImxlc3NvblwiKTtcbiAgZm9yIChjb25zdCB4IG9mIGRhdGEuZWR1Y2F0aW9uLmFzc2Vzc21lbnRzKSBhZGQoeC5pZCwgXCJhc3Nlc3NtZW50XCIpO1xuICBmb3IgKGNvbnN0IHggb2YgZGF0YS5lZHVjYXRpb24uc3VibWlzc2lvbnMpIGFkZCh4LmlkLCBcInN1Ym1pc3Npb25cIik7XG4gIGZvciAoY29uc3QgeCBvZiBkYXRhLmVkdWNhdGlvbi5ncmFkZXMpIGFkZCh4LmlkLCBcImdyYWRlXCIpO1xuICBmb3IgKGNvbnN0IHggb2YgZGF0YS5lZHVjYXRpb24ucmV2aWV3cykgYWRkKHguaWQsIFwicmV2aWV3XCIpO1xuICBmb3IgKGNvbnN0IHggb2YgZGF0YS5lZHVjYXRpb24ucHJvZ3Jlc3MpIGFkZCh4LmlkLCBcInByb2dyZXNzXCIpO1xuICBmb3IgKGNvbnN0IHggb2YgZGF0YS5lZHVjYXRpb24uY29ycmVjdGlvbnMpIGFkZCh4LmlkLCBcImNvcnJlY3Rpb25cIik7XG4gIHJldHVybiBpZHM7XG59XG5cbmNvbnN0IEFMTE9XRURfS0lORFMgPSBbXG4gIFwicHJvamVjdFwiLFxuICBcImhhYml0XCIsXG4gIFwidmlzaW9uXCIsXG4gIFwidGFza1wiLFxuICBcInRlbXBsYXRlXCIsXG4gIFwic2Vzc2lvblwiLFxuICBcImJsb2NrXCIsXG4gIFwicmVzb3VyY2VcIixcbiAgXCJzZW1lc3RlclwiLFxuICBcImxlc3NvblwiLFxuICBcImFzc2Vzc21lbnRcIixcbiAgXCJzdWJtaXNzaW9uXCIsXG4gIFwiZ3JhZGVcIixcbiAgXCJyZXZpZXdcIixcbiAgXCJwcm9ncmVzc1wiLFxuICBcImNvcnJlY3Rpb25cIixcbl07XG5cbi8qKlxuICogXHU2M0QwXHU0RUE0XHU1MjREXHU2ODM4XHU1QkY5XHU4RUFCXHU0RUZEXHU1Mzg2XHU1M0YyXHVGRjFBXHU1MjIwXHU5NjY0XHU3Njg0IElEIFx1NkMzOFx1NEU0NVx1NEZERFx1NzU1OVx1RkYwQ1x1NjA2Mlx1NTkwRFx1NTNFQVx1ODBGRFx1NjA2Mlx1NTkwRFx1NzY3Qlx1OEJCMFx1NEUyRFx1NzY4NFx1NTM5Rlx1NEVGQlx1NTJBMVx1MzAwMlxuICogYHJlc3RvcmVfaWRgIFx1NjYyRlx1NjcyQ1x1NkIyMVx1NTJBOFx1NEY1Q1x1OTFDQ1x1NkI2M1x1NTcyOFx1NjA2Mlx1NTkwRFx1NzY4NFx1NEVGQlx1NTJBMSBJRFx1MzAwMlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVjb25jaWxlSWRlbnRpdGllcyhcbiAgYmVmb3JlOiBBcHBEYXRhLFxuICBhZnRlcjogQXBwRGF0YSxcbiAgcmVzdG9yZUlkOiBzdHJpbmcgfCBudWxsLFxuKTogdm9pZCB7XG4gIGNvbnN0IG9sZEFjdGl2ZSA9IGFjdGl2ZUlkZW50aXRpZXMoYmVmb3JlKTtcbiAgY29uc3QgbmV3QWN0aXZlID0gYWN0aXZlSWRlbnRpdGllcyhhZnRlcik7XG4gIGNvbnN0IGVudHJpZXMgPSBuZXcgTWFwPHN0cmluZywgSWRlbnRpdHk+KCk7XG4gIGZvciAoY29uc3QgcmVjb3JkIG9mIFsuLi5iZWZvcmUuaWRlbnRpdGllcywgLi4uYWZ0ZXIuaWRlbnRpdGllc10pIHtcbiAgICBjb25zdCBvbGQgPSBlbnRyaWVzLmdldChyZWNvcmQuaWQpO1xuICAgIGlmIChvbGQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKG9sZC5raW5kICE9PSByZWNvcmQua2luZCkge1xuICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTUzODZcdTUzRjIgSUQgXHU0RTBEXHU4MEZEXHU4RjZDXHU3NTI4XHU0RThFXHU1M0U2XHU0RTAwXHU3OUNEXHU1QjlFXHU0RjUzXCIpO1xuICAgICAgfVxuICAgICAgb2xkLnJldGlyZWQgPSBvbGQucmV0aXJlZCB8fCByZWNvcmQucmV0aXJlZDtcbiAgICAgIGlmIChvbGQucmVzdG9yZVRhc2sgPT09IG51bGwpIHtcbiAgICAgICAgb2xkLnJlc3RvcmVUYXNrID0gcmVjb3JkLnJlc3RvcmVUYXNrO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBlbnRyaWVzLnNldChyZWNvcmQuaWQsIHsgLi4ucmVjb3JkLCByZXN0b3JlVGFzazogcmVjb3JkLnJlc3RvcmVUYXNrIH0pO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IFtpZCwga2luZF0gb2Ygb2xkQWN0aXZlKSB7XG4gICAgaWYgKCFlbnRyaWVzLmhhcyhpZCkpIHtcbiAgICAgIGVudHJpZXMuc2V0KGlkLCB7IGlkLCBraW5kLCByZXRpcmVkOiBmYWxzZSwgcmVzdG9yZVRhc2s6IG51bGwgfSk7XG4gICAgfVxuICB9XG4gIC8vIFx1NURGMlx1NTIyMFx1OTY2NFx1NEVGQlx1NTJBMVx1NTNFQVx1ODBGRFx1OTAxQVx1OEZDN1x1NTM4Nlx1NTNGMlx1NEUxM1x1NkNFOFx1OEJCMFx1NUY1NVx1NTNFRlx1ODlDMVx1MzAwMlxuICBjb25zdCB2aXNpdCA9IChzb3VyY2U6IEFwcERhdGEsIGxpdmU6IE1hcDxzdHJpbmcsIHN0cmluZz4pOiB2b2lkID0+IHtcbiAgICBmb3IgKGNvbnN0IHNlc3Npb24gb2Ygc291cmNlLnNlc3Npb25zKSB7XG4gICAgICBjb25zdCB0YXNrSWQgPSBzZXNzaW9uLnRhc2tJZDtcbiAgICAgIGlmICh0YXNrSWQgPT09IG51bGwpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgcmVjb3JkID0gZW50cmllcy5nZXQodGFza0lkKTtcbiAgICAgIGlmIChyZWNvcmQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAocmVjb3JkLmtpbmQgIT09IFwidGFza1wiKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU1Mzg2XHU1M0YyXHU0RUZCXHU1MkExXHU1RjE1XHU3NTI4XHU3Njg0IElEIFx1NEUwRVx1NTE3Nlx1NEVENlx1NUI5RVx1NEY1M1x1NTFCMlx1N0E4MVwiKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW50cmllcy5zZXQodGFza0lkLCB7XG4gICAgICAgICAgaWQ6IHRhc2tJZCxcbiAgICAgICAgICBraW5kOiBcInRhc2tcIixcbiAgICAgICAgICByZXRpcmVkOiAhbGl2ZS5oYXModGFza0lkKSxcbiAgICAgICAgICByZXN0b3JlVGFzazogbnVsbCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICB2aXNpdChiZWZvcmUsIG9sZEFjdGl2ZSk7XG4gIHZpc2l0KGFmdGVyLCBuZXdBY3RpdmUpO1xuICBmb3IgKGNvbnN0IFtpZCwga2luZF0gb2YgbmV3QWN0aXZlKSB7XG4gICAgY29uc3QgcmVjb3JkID0gZW50cmllcy5nZXQoaWQpO1xuICAgIGlmIChyZWNvcmQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHJlY29yZC5raW5kICE9PSBraW5kKSB7XG4gICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NTM4Nlx1NTNGMiBJRCBcdTRFMERcdTgwRkRcdTg4QUJcdTUxNzZcdTRFRDZcdTVCOUVcdTRGNTNcdTU5MERcdTc1MjhcIik7XG4gICAgICB9XG4gICAgICBpZiAocmVjb3JkLnJldGlyZWQpIHtcbiAgICAgICAgY29uc3Qgc2FtZVRhc2sgPSByZXN0b3JlSWQgPT09IGlkICYmIGtpbmQgPT09IFwidGFza1wiO1xuICAgICAgICBpZiAoIXNhbWVUYXNrKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFxuICAgICAgICAgICAgXCJcdTUzODZcdTUzRjIgSUQgXHU1REYyXHU4OEFCXHU2QzM4XHU0RTQ1XHU0RkREXHU3NTU5XHVGRjBDXHU0RTBEXHU4MEZEXHU3NTI4XHU0RThFXHU2NUIwXHU1RUZBXHU2MjE2XHU1QkZDXHU1MTY1XHU1MTc2XHU0RUQ2XHU1QjlFXHU0RjUzXCIsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZWNvcmQucmV0aXJlZCA9IGZhbHNlO1xuICAgICAgICByZWNvcmQucmVzdG9yZVRhc2sgPSBudWxsO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBlbnRyaWVzLnNldChpZCwgeyBpZCwga2luZCwgcmV0aXJlZDogZmFsc2UsIHJlc3RvcmVUYXNrOiBudWxsIH0pO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IHJlY29yZCBvZiBlbnRyaWVzLnZhbHVlcygpKSB7XG4gICAgaWYgKCFuZXdBY3RpdmUuaGFzKHJlY29yZC5pZCkpIHtcbiAgICAgIHJlY29yZC5yZXRpcmVkID0gdHJ1ZTtcbiAgICAgIGlmIChyZWNvcmQua2luZCA9PT0gXCJ0YXNrXCIpIHtcbiAgICAgICAgY29uc3QgdGFzayA9IGJlZm9yZS50YXNrcy5maW5kKCh0KSA9PiB0LmlkID09PSByZWNvcmQuaWQpO1xuICAgICAgICBpZiAodGFzayAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcmVjb3JkLnJlc3RvcmVUYXNrID0gSlNPTi5zdHJpbmdpZnkoc2VyaWFsaXplVGFzayh0YXNrKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgY29uc3QgcmVjb3JkcyA9IFsuLi5lbnRyaWVzLnZhbHVlcygpXS5zb3J0KChhLCBiKSA9PlxuICAgIGEuaWQgPCBiLmlkID8gLTEgOiBhLmlkID4gYi5pZCA/IDEgOiAwLFxuICApO1xuICBhZnRlci5pZGVudGl0aWVzID0gcmVjb3Jkcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlSWRlbnRpdGllcyhkYXRhOiBBcHBEYXRhKTogdm9pZCB7XG4gIGNvbnN0IGN1cnJlbnQgPSBhY3RpdmVJZGVudGl0aWVzKGRhdGEpO1xuICBjb25zdCBzZWVuID0gbmV3IE1hcDxzdHJpbmcsIHRydWU+KCk7XG4gIGlmIChkYXRhLmlkZW50aXRpZXMubGVuZ3RoID4gMTAwMDAwMCkge1xuICAgIHRocm93IG5ldyBBcHBFcnJvcihcIklEIFx1NTM4Nlx1NTNGMlx1NjU3MFx1OTFDRlx1OEQ4NVx1NTFGQVx1OTY1MFx1NTIzNlwiKTtcbiAgfVxuICBmb3IgKGNvbnN0IHJlY29yZCBvZiBkYXRhLmlkZW50aXRpZXMpIHtcbiAgICBpZiAoXG4gICAgICByZWNvcmQuaWQudHJpbSgpLmxlbmd0aCA9PT0gMCB8fFxuICAgICAgdXRmOExlbihyZWNvcmQuaWQpID4gMjAwIHx8XG4gICAgICBzZWVuLmhhcyhyZWNvcmQuaWQpIHx8XG4gICAgICAhQUxMT1dFRF9LSU5EUy5pbmNsdWRlcyhyZWNvcmQua2luZClcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NjVFMFx1NjU0OFx1NzY4NCBJRCBcdTUzODZcdTUzRjJcdTc2N0JcdThCQjBcIik7XG4gICAgfVxuICAgIHNlZW4uc2V0KHJlY29yZC5pZCwgdHJ1ZSk7XG4gICAgLy8gXHU5MDAwXHU0RjExXHU3MkI2XHU2MDAxXHU3NTMxIHJlY29uY2lsZSBcdTY4QzBcdTY3RTVcdUZGMENcdTUxNDFcdThCQjhcdTVERjJcdTlBOENcdThCQzFcdTc2ODRcdTY0QTRcdTk1MDBcdTUwMTlcdTkwMDlcdTVCNThcdTU3MjhcdTMwMDJcbiAgICBpZiAoY3VycmVudC5oYXMocmVjb3JkLmlkKSAmJiBjdXJyZW50LmdldChyZWNvcmQuaWQpICE9PSByZWNvcmQua2luZCkge1xuICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU1Mzg2XHU1M0YyIElEIFx1N0M3Qlx1NTc4Qlx1NTFCMlx1N0E4MVwiKTtcbiAgICB9XG4gICAgaWYgKHJlY29yZC5yZXN0b3JlVGFzayAhPT0gbnVsbCkge1xuICAgICAgbGV0IHRhc2s7XG4gICAgICB0cnkge1xuICAgICAgICB0YXNrID0gcGFyc2VUYXNrKEpTT04ucGFyc2UocmVjb3JkLnJlc3RvcmVUYXNrKSk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2NUUwXHU2NTQ4XHU3Njg0XHU0RUZCXHU1MkExXHU2MDYyXHU1OTBEXHU4QkIwXHU1RjU1XCIpO1xuICAgICAgfVxuICAgICAgaWYgKHJlY29yZC5raW5kICE9PSBcInRhc2tcIiB8fCB0YXNrLmlkICE9PSByZWNvcmQuaWQgfHwgIXJlY29yZC5yZXRpcmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NEVGQlx1NTJBMVx1NjA2Mlx1NTkwRFx1OEJCMFx1NUY1NVx1NEUwRSBJRCBcdTc2N0JcdThCQjBcdTRFMERcdTRFMDBcdTgxRjRcIik7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCAiLy8hIFx1NUI2Nlx1NEU2MFx1OEJBMVx1NTIxMiB2Nlx1RkYxQVx1NEZCRlx1NjQzQVx1OEJBMVx1NTIxMlx1NTIzQlx1NjEwRlx1NEUwRFx1NTQyQlx1NjI2N1x1ODg0Q1x1NTM4Nlx1NTNGMlx1NEUwRVx1NjcyQ1x1NjczQVx1NTA0Rlx1NTk3RFx1MzAwMlxuLy8hIFx1NUJGOVx1NUU5NCBjcmF0ZXMvY29yZS9zcmMvcGxhbi5yc1x1MzAwMlxuXG5pbXBvcnQgeyBBcHBFcnJvciwgY2xvbmUsIGVuc3VyZSB9IGZyb20gXCIuL2Vycm9yc1wiO1xuaW1wb3J0IHtcbiAgYXNBcnJheSxcbiAgYXNCb29sLFxuICBhc0ludCxcbiAgYXNPcHQsXG4gIGFzU3RyLFxuICBmaWVsZCxcbiAgaXNPYmplY3QsXG4gIG9uZU9mLFxuICByZWplY3RVbmtub3duLFxuICByZXF1aXJlZEZpZWxkLFxufSBmcm9tIFwiLi9qc29uXCI7XG5pbXBvcnQgeyBBcHBEYXRhIH0gZnJvbSBcIi4vbGliXCI7XG5pbXBvcnQgdHlwZSB7XG4gIFBsYW5GaWxlLFxuICBQbGFuUHJvamVjdCxcbiAgUGxhblN1YnRhc2ssXG4gIFBsYW5UYXNrLFxuICBSZXBlYXQsXG4gIFRhc2ssXG4gIFRlbXBsYXRlLFxufSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHtcbiAgZGVsZXRlVGVtcGxhdGUsXG4gIHBhcnNlUHJpbnRSZWNvcmQsXG4gIHBhcnNlVGVtcGxhdGUsXG4gIHJlcGxhY2VBcHBEYXRhLFxuICBzZXJpYWxpemVQcmludFJlY29yZCxcbiAgc2VyaWFsaXplVGVtcGxhdGUsXG59IGZyb20gXCIuL3RlbXBsYXRlc1wiO1xuaW1wb3J0IHsgcGFyc2VCbG9jaywgc2VyaWFsaXplQmxvY2sgfSBmcm9tIFwiLi9ibG9ja3NcIjtcbmltcG9ydCB7IHBhcnNlSGFiaXQsIHNlcmlhbGl6ZUhhYml0IH0gZnJvbSBcIi4vaGFiaXRzXCI7XG5cbmNvbnN0IFBMQU5fRklMRV9LRVlTID0gW1xuICBcImZvcm1hdFwiLFxuICBcInZlcnNpb25cIixcbiAgXCJwb21vZG9yb01pbnV0ZXNcIixcbiAgXCJwcm9qZWN0c1wiLFxuICBcInRhc2tzXCIsXG4gIFwiYmxvY2tzXCIsXG4gIFwidGVtcGxhdGVzXCIsXG4gIFwicHJpbnRzXCIsXG4gIFwiaGFiaXRzXCIsXG4gIFwicmVwbGFjZVwiLFxuXSBhcyBjb25zdDtcbmNvbnN0IFBMQU5fUFJPSkVDVF9LRVlTID0gW1wiaWRcIiwgXCJuYW1lXCIsIFwiY29sb3JcIiwgXCJhcHBXaGl0ZWxpc3RcIl0gYXMgY29uc3Q7XG5jb25zdCBQTEFOX1RBU0tfS0VZUyA9IFtcbiAgXCJpZFwiLFxuICBcInRpdGxlXCIsXG4gIFwidGVtcGxhdGVJZFwiLFxuICBcImhhYml0SWRcIixcbiAgXCJyZWN1cnJpbmdcIixcbiAgXCJzY3JhcE1pbnV0ZXNcIixcbiAgXCJub3Rlc1wiLFxuICBcInByb2plY3RJZFwiLFxuICBcImR1ZURhdGVcIixcbiAgXCJyZW1pbmRlclRpbWVcIixcbiAgXCJmb2N1c01pbnV0ZXNcIixcbiAgXCJwcmlvcml0eVwiLFxuICBcImVzdGltYXRlXCIsXG4gIFwidGFnc1wiLFxuICBcInN1YnRhc2tzXCIsXG4gIFwicmVwZWF0XCIsXG5dIGFzIGNvbnN0O1xuY29uc3QgUExBTl9TVUJUQVNLX0tFWVMgPSBbXCJpZFwiLCBcInRpdGxlXCJdIGFzIGNvbnN0O1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQbGFuRmlsZShyYXc6IHVua25vd24pOiBQbGFuRmlsZSB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4QkExXHU1MjEyXHU2NTg3XHU0RUY2XHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKHJhdywgWy4uLlBMQU5fRklMRV9LRVlTXSwgXCJcdThCQTFcdTUyMTJcdTY1ODdcdTRFRjZcIik7XG4gIHJldHVybiB7XG4gICAgZm9ybWF0OiByZXF1aXJlZEZpZWxkKHJhdywgXCJmb3JtYXRcIiwgXCJcdThCQTFcdTUyMTJcdTY1ODdcdTRFRjZcIiwgYXNTdHIpLFxuICAgIHZlcnNpb246IHJlcXVpcmVkRmllbGQocmF3LCBcInZlcnNpb25cIiwgXCJcdThCQTFcdTUyMTJcdTY1ODdcdTRFRjZcIiwgYXNJbnQpLFxuICAgIHBvbW9kb3JvTWludXRlczogcmVxdWlyZWRGaWVsZChyYXcsIFwicG9tb2Rvcm9NaW51dGVzXCIsIFwiXHU4QkExXHU1MjEyXHU2NTg3XHU0RUY2XCIsIGFzSW50KSxcbiAgICBwcm9qZWN0czogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvamVjdHNcIiwgXCJcdThCQTFcdTUyMTJcdTY1ODdcdTRFRjZcIiwgKHYpID0+XG4gICAgICBhc0FycmF5KHYsIFwicHJvamVjdHNcIikubWFwKHBhcnNlUGxhblByb2plY3QpLFxuICAgICksXG4gICAgdGFza3M6IHJlcXVpcmVkRmllbGQocmF3LCBcInRhc2tzXCIsIFwiXHU4QkExXHU1MjEyXHU2NTg3XHU0RUY2XCIsICh2KSA9PlxuICAgICAgYXNBcnJheSh2LCBcInRhc2tzXCIpLm1hcChwYXJzZVBsYW5UYXNrKSxcbiAgICApLFxuICAgIGJsb2NrczogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImJsb2Nrc1wiLFxuICAgICAgXCJcdThCQTFcdTUyMTJcdTY1ODdcdTRFRjZcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwiYmxvY2tzXCIpLm1hcChwYXJzZUJsb2NrKSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgdGVtcGxhdGVzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidGVtcGxhdGVzXCIsXG4gICAgICBcIlx1OEJBMVx1NTIxMlx1NjU4N1x1NEVGNlwiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJ0ZW1wbGF0ZXNcIikubWFwKHBhcnNlVGVtcGxhdGUpLFxuICAgICAgW10sXG4gICAgKSxcbiAgICBwcmludHM6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJwcmludHNcIixcbiAgICAgIFwiXHU4QkExXHU1MjEyXHU2NTg3XHU0RUY2XCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcInByaW50c1wiKS5tYXAocGFyc2VQcmludFJlY29yZCksXG4gICAgICBbXSxcbiAgICApLFxuICAgIGhhYml0czogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImhhYml0c1wiLFxuICAgICAgXCJcdThCQTFcdTUyMTJcdTY1ODdcdTRFRjZcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwiaGFiaXRzXCIpLm1hcChwYXJzZUhhYml0KSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgcmVwbGFjZTogZmllbGQocmF3LCBcInJlcGxhY2VcIiwgXCJcdThCQTFcdTUyMTJcdTY1ODdcdTRFRjZcIiwgYXNCb29sLCBmYWxzZSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIHBhcnNlUGxhblByb2plY3QocmF3OiB1bmtub3duKTogUGxhblByb2plY3Qge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJBMVx1NTIxMlx1OTg3OVx1NzZFRVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIFsuLi5QTEFOX1BST0pFQ1RfS0VZU10sIFwiXHU4QkExXHU1MjEyXHU5ODc5XHU3NkVFXCIpO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1OEJBMVx1NTIxMlx1OTg3OVx1NzZFRVwiLCBhc1N0ciksXG4gICAgbmFtZTogcmVxdWlyZWRGaWVsZChyYXcsIFwibmFtZVwiLCBcIlx1OEJBMVx1NTIxMlx1OTg3OVx1NzZFRVwiLCBhc1N0ciksXG4gICAgY29sb3I6IHJlcXVpcmVkRmllbGQocmF3LCBcImNvbG9yXCIsIFwiXHU4QkExXHU1MjEyXHU5ODc5XHU3NkVFXCIsIGFzU3RyKSxcbiAgICBhcHBXaGl0ZWxpc3Q6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJhcHBXaGl0ZWxpc3RcIixcbiAgICAgIFwiXHU4QkExXHU1MjEyXHU5ODc5XHU3NkVFXCIsXG4gICAgICAodikgPT5cbiAgICAgICAgYXNPcHQodiwgXCJhcHBXaGl0ZWxpc3RcIiwgKHgpID0+XG4gICAgICAgICAgYXNBcnJheSh4LCBcImFwcFdoaXRlbGlzdFwiKS5tYXAoKGEpID0+IGFzU3RyKGEsIFwiXHU1RTk0XHU3NTI4IElEXCIpKSxcbiAgICAgICAgKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmdbXSB8IG51bGwsXG4gIH07XG59XG5cbmZ1bmN0aW9uIHBhcnNlUGxhblN1YnRhc2socmF3OiB1bmtub3duKTogUGxhblN1YnRhc2sge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJBMVx1NTIxMlx1NUI1MFx1NkI2NVx1OUFBNFx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIFsuLi5QTEFOX1NVQlRBU0tfS0VZU10sIFwiXHU4QkExXHU1MjEyXHU1QjUwXHU2QjY1XHU5QUE0XCIpO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1OEJBMVx1NTIxMlx1NUI1MFx1NkI2NVx1OUFBNFwiLCBhc1N0ciksXG4gICAgdGl0bGU6IHJlcXVpcmVkRmllbGQocmF3LCBcInRpdGxlXCIsIFwiXHU4QkExXHU1MjEyXHU1QjUwXHU2QjY1XHU5QUE0XCIsIGFzU3RyKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gcGFyc2VQbGFuVGFzayhyYXc6IHVua25vd24pOiBQbGFuVGFzayB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4QkExXHU1MjEyXHU0RUZCXHU1MkExXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKHJhdywgWy4uLlBMQU5fVEFTS19LRVlTXSwgXCJcdThCQTFcdTUyMTJcdTRFRkJcdTUyQTFcIik7XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiXHU4QkExXHU1MjEyXHU0RUZCXHU1MkExXCIsIGFzU3RyKSxcbiAgICB0aXRsZTogcmVxdWlyZWRGaWVsZChyYXcsIFwidGl0bGVcIiwgXCJcdThCQTFcdTUyMTJcdTRFRkJcdTUyQTFcIiwgYXNTdHIpLFxuICAgIHRlbXBsYXRlSWQ6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJ0ZW1wbGF0ZUlkXCIsXG4gICAgICBcIlx1OEJBMVx1NTIxMlx1NEVGQlx1NTJBMVwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwidGVtcGxhdGVJZFwiLCBhc1N0ciksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgICBoYWJpdElkOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiaGFiaXRJZFwiLFxuICAgICAgXCJcdThCQTFcdTUyMTJcdTRFRkJcdTUyQTFcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcImhhYml0SWRcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gICAgcmVjdXJyaW5nOiBmaWVsZChyYXcsIFwicmVjdXJyaW5nXCIsIFwiXHU4QkExXHU1MjEyXHU0RUZCXHU1MkExXCIsIGFzQm9vbCwgZmFsc2UpLFxuICAgIHNjcmFwTWludXRlczogZmllbGQocmF3LCBcInNjcmFwTWludXRlc1wiLCBcIlx1OEJBMVx1NTIxMlx1NEVGQlx1NTJBMVwiLCBhc0ludCwgMCksXG4gICAgbm90ZXM6IGZpZWxkKHJhdywgXCJub3Rlc1wiLCBcIlx1OEJBMVx1NTIxMlx1NEVGQlx1NTJBMVwiLCBhc1N0ciwgXCJcIiksXG4gICAgcHJvamVjdElkOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwicHJvamVjdElkXCIsXG4gICAgICBcIlx1OEJBMVx1NTIxMlx1NEVGQlx1NTJBMVwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwicHJvamVjdElkXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgIGR1ZURhdGU6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJkdWVEYXRlXCIsXG4gICAgICBcIlx1OEJBMVx1NTIxMlx1NEVGQlx1NTJBMVwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiZHVlRGF0ZVwiLCBhc1N0ciksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgICByZW1pbmRlclRpbWU6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJyZW1pbmRlclRpbWVcIixcbiAgICAgIFwiXHU4QkExXHU1MjEyXHU0RUZCXHU1MkExXCIsXG4gICAgICAodikgPT4gYXNPcHQodiwgXCJyZW1pbmRlclRpbWVcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gICAgZm9jdXNNaW51dGVzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiZm9jdXNNaW51dGVzXCIsXG4gICAgICBcIlx1OEJBMVx1NTIxMlx1NEVGQlx1NTJBMVwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiZm9jdXNNaW51dGVzXCIsICh4KSA9PiBhc0ludCh4LCBcImZvY3VzTWludXRlc1wiKSksXG4gICAgICBudWxsLFxuICAgICkgYXMgbnVtYmVyIHwgbnVsbCxcbiAgICBwcmlvcml0eTogZmllbGQocmF3LCBcInByaW9yaXR5XCIsIFwiXHU4QkExXHU1MjEyXHU0RUZCXHU1MkExXCIsIGFzSW50LCAwKSxcbiAgICBlc3RpbWF0ZTogZmllbGQocmF3LCBcImVzdGltYXRlXCIsIFwiXHU4QkExXHU1MjEyXHU0RUZCXHU1MkExXCIsIGFzSW50LCAxKSxcbiAgICB0YWdzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidGFnc1wiLFxuICAgICAgXCJcdThCQTFcdTUyMTJcdTRFRkJcdTUyQTFcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwidGFnc1wiKS5tYXAoKHQpID0+IGFzU3RyKHQsIFwiXHU2ODA3XHU3QjdFXCIpKSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgc3VidGFza3M6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJzdWJ0YXNrc1wiLFxuICAgICAgXCJcdThCQTFcdTUyMTJcdTRFRkJcdTUyQTFcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwic3VidGFza3NcIikubWFwKHBhcnNlUGxhblN1YnRhc2spLFxuICAgICAgW10sXG4gICAgKSxcbiAgICByZXBlYXQ6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJyZXBlYXRcIixcbiAgICAgIFwiXHU4QkExXHU1MjEyXHU0RUZCXHU1MkExXCIsXG4gICAgICAodikgPT4gb25lT2YodiwgXCJyZXBlYXRcIiwgW1wibm9uZVwiLCBcImRhaWx5XCIsIFwid2Vla2RheXNcIiwgXCJ3ZWVrbHlcIl0pLFxuICAgICAgXCJub25lXCIsXG4gICAgKSBhcyBSZXBlYXQsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVQbGFuRmlsZShwbGFuOiBQbGFuRmlsZSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICBmb3JtYXQ6IHBsYW4uZm9ybWF0LFxuICAgIHZlcnNpb246IHBsYW4udmVyc2lvbixcbiAgICBwb21vZG9yb01pbnV0ZXM6IHBsYW4ucG9tb2Rvcm9NaW51dGVzLFxuICAgIHByb2plY3RzOiBwbGFuLnByb2plY3RzLm1hcCgocCkgPT4ge1xuICAgICAgY29uc3QgbzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgICAgIGlkOiBwLmlkLFxuICAgICAgICBuYW1lOiBwLm5hbWUsXG4gICAgICAgIGNvbG9yOiBwLmNvbG9yLFxuICAgICAgfTtcbiAgICAgIGlmIChwLmFwcFdoaXRlbGlzdCAhPT0gbnVsbCkgb1tcImFwcFdoaXRlbGlzdFwiXSA9IHAuYXBwV2hpdGVsaXN0O1xuICAgICAgcmV0dXJuIG87XG4gICAgfSksXG4gICAgdGFza3M6IHBsYW4udGFza3MubWFwKCh0KSA9PiB7XG4gICAgICBjb25zdCBvOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICAgICAgaWQ6IHQuaWQsXG4gICAgICAgIHRpdGxlOiB0LnRpdGxlLFxuICAgICAgICB0ZW1wbGF0ZUlkOiB0LnRlbXBsYXRlSWQsXG4gICAgICAgIGhhYml0SWQ6IHQuaGFiaXRJZCxcbiAgICAgICAgcmVjdXJyaW5nOiB0LnJlY3VycmluZyxcbiAgICAgICAgc2NyYXBNaW51dGVzOiB0LnNjcmFwTWludXRlcyxcbiAgICAgICAgbm90ZXM6IHQubm90ZXMsXG4gICAgICAgIHByb2plY3RJZDogdC5wcm9qZWN0SWQsXG4gICAgICAgIGR1ZURhdGU6IHQuZHVlRGF0ZSxcbiAgICAgICAgcHJpb3JpdHk6IHQucHJpb3JpdHksXG4gICAgICAgIGVzdGltYXRlOiB0LmVzdGltYXRlLFxuICAgICAgICB0YWdzOiB0LnRhZ3MsXG4gICAgICAgIHN1YnRhc2tzOiB0LnN1YnRhc2tzLm1hcCgocykgPT4gKHsgaWQ6IHMuaWQsIHRpdGxlOiBzLnRpdGxlIH0pKSxcbiAgICAgICAgcmVwZWF0OiB0LnJlcGVhdCxcbiAgICAgIH07XG4gICAgICBpZiAodC5yZW1pbmRlclRpbWUgIT09IG51bGwpIG9bXCJyZW1pbmRlclRpbWVcIl0gPSB0LnJlbWluZGVyVGltZTtcbiAgICAgIGlmICh0LmZvY3VzTWludXRlcyAhPT0gbnVsbCkgb1tcImZvY3VzTWludXRlc1wiXSA9IHQuZm9jdXNNaW51dGVzO1xuICAgICAgcmV0dXJuIG87XG4gICAgfSksXG4gICAgYmxvY2tzOiBwbGFuLmJsb2Nrcy5tYXAoc2VyaWFsaXplQmxvY2spLFxuICAgIHRlbXBsYXRlczogcGxhbi50ZW1wbGF0ZXMubWFwKHNlcmlhbGl6ZVRlbXBsYXRlKSxcbiAgICBwcmludHM6IHBsYW4ucHJpbnRzLm1hcChzZXJpYWxpemVQcmludFJlY29yZCksXG4gICAgaGFiaXRzOiBwbGFuLmhhYml0cy5tYXAoc2VyaWFsaXplSGFiaXQpLFxuICB9O1xuICBpZiAocGxhbi5yZXBsYWNlKSBvdXRbXCJyZXBsYWNlXCJdID0gdHJ1ZTtcbiAgcmV0dXJuIG91dDtcbn1cblxuLyoqIFx1NjU4N1x1NEVGNlx1NUI5RVx1NEY4QiBcdTIxOTIgXHU2NzJDXHU1NzMwXHU0RUZCXHU1MkExXHVGRjFBXHU4RkRCXHU1RUE2XHU0RTBFXHU1Mzg2XHU1M0YyXHU3NTU5XHU1NzI4XHU2NzJDXHU2NzNBXHUzMDAyICovXG5mdW5jdGlvbiBwbGFuVGFza1RvVGFzayh0OiBQbGFuVGFzaywgYXQ6IG51bWJlciwgZXN0aW1hdGU6IG51bWJlcik6IFRhc2sge1xuICByZXR1cm4ge1xuICAgIGlkOiB0LmlkLFxuICAgIHRlbXBsYXRlSWQ6IHQudGVtcGxhdGVJZCxcbiAgICByZWN1cnJpbmc6IHQucmVjdXJyaW5nIHx8IHQucmVwZWF0ICE9PSBcIm5vbmVcIixcbiAgICB0aXRsZTogdC50aXRsZSxcbiAgICBub3RlczogdC5ub3RlcyxcbiAgICBwcm9qZWN0SWQ6IHQucHJvamVjdElkLFxuICAgIGhhYml0SWQ6IHQuaGFiaXRJZCxcbiAgICBkdWVEYXRlOiB0LmR1ZURhdGUsXG4gICAgcmVtaW5kZXJUaW1lOiB0LnJlbWluZGVyVGltZSxcbiAgICBmb2N1c01pbnV0ZXM6IHQuZm9jdXNNaW51dGVzLFxuICAgIHJlbWluZGVyRmlyZWQ6IGZhbHNlLFxuICAgIHJlbWluZGVyUGVuZGluZzogZmFsc2UsXG4gICAgcmVtaW5kZXJFeHBpcmVkOiBmYWxzZSxcbiAgICBzY3JhcE1pbnV0ZXM6IHQuc2NyYXBNaW51dGVzLFxuICAgIHByaW9yaXR5OiB0LnByaW9yaXR5LFxuICAgIGVzdGltYXRlLFxuICAgIGNvbXBsZXRlZDogZmFsc2UsXG4gICAgY29tcGxldGVkQXQ6IG51bGwsXG4gICAgY3JlYXRlZEF0OiBhdCxcbiAgICB0YWdzOiBbLi4udC50YWdzXSxcbiAgICBzdWJ0YXNrczogdC5zdWJ0YXNrcy5tYXAoKHMpID0+ICh7XG4gICAgICBpZDogcy5pZCxcbiAgICAgIHRpdGxlOiBzLnRpdGxlLFxuICAgICAgZG9uZTogZmFsc2UsXG4gICAgfSkpLFxuICB9O1xufVxuXG4vKiogXHU5MTREXHU3RjZFXHU2NzY1XHU4MUVBXHU2NTg3XHU0RUY2XHVGRjFCXHU4RkRCXHU1RUE2XHU0RTBFXHU1Mzg2XHU1M0YyXHU3NTU5XHU1NzI4XHU2NzJDXHU2NzNBXHUzMDAyXHU2M0QwXHU5MTkyXHU3MkI2XHU2MDAxXHU1M0VBXHU1NzI4XHU2NUY2XHU5NUY0XHU2OUZEXHU0RTBEXHU1M0Q4XHU2NUY2XHU1QjU4XHU2RDNCXHUzMDAyICovXG5mdW5jdGlvbiBwbGFuVGFza01lcmdlKFxuICB0OiBQbGFuVGFzayxcbiAgb2xkOiBUYXNrLFxuICBhdDogbnVtYmVyLFxuICBlc3RpbWF0ZTogbnVtYmVyLFxuKTogVGFzayB7XG4gIGNvbnN0IHRhc2sgPSBwbGFuVGFza1RvVGFzayh0LCBhdCwgZXN0aW1hdGUpO1xuICB0YXNrLmNyZWF0ZWRBdCA9IG9sZC5jcmVhdGVkQXQ7XG4gIHRhc2suY29tcGxldGVkID0gb2xkLmNvbXBsZXRlZDtcbiAgdGFzay5jb21wbGV0ZWRBdCA9IG9sZC5jb21wbGV0ZWRBdDtcbiAgaWYgKG9sZC5kdWVEYXRlID09PSB0LmR1ZURhdGUgJiYgb2xkLnJlbWluZGVyVGltZSA9PT0gdC5yZW1pbmRlclRpbWUpIHtcbiAgICB0YXNrLnJlbWluZGVyRmlyZWQgPSBvbGQucmVtaW5kZXJGaXJlZDtcbiAgICB0YXNrLnJlbWluZGVyUGVuZGluZyA9IG9sZC5yZW1pbmRlclBlbmRpbmc7XG4gICAgdGFzay5yZW1pbmRlckV4cGlyZWQgPSBvbGQucmVtaW5kZXJFeHBpcmVkO1xuICB9XG4gIGZvciAoY29uc3Qgc3ViIG9mIHRhc2suc3VidGFza3MpIHtcbiAgICBjb25zdCBwcmV2ID0gb2xkLnN1YnRhc2tzLmZpbmQoKHMpID0+IHMuaWQgPT09IHN1Yi5pZCk7XG4gICAgaWYgKHByZXYgIT09IHVuZGVmaW5lZCkgc3ViLmRvbmUgPSBwcmV2LmRvbmU7XG4gIH1cbiAgcmV0dXJuIHRhc2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVBsYW5GaWxlKHBsYW46IFBsYW5GaWxlKTogdm9pZCB7XG4gIGlmIChwbGFuLmZvcm1hdCAhPT0gXCJ0b21hdG8tdG9kby1wbGFuXCIgfHwgcGxhbi52ZXJzaW9uICE9PSA2KSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU0RUM1XHU2NTJGXHU2MzAxXHU4QkExXHU1MjEyIHY2XHVGRjFCXHU2NUU3XHU4QkExXHU1MjEyXHU4QkY3XHU2MzA5XHU2NUIwXHU2ODNDXHU1RjBGXHU5MUNEXHU2NUIwXHU1QkZDXHU1MUZBXCIpO1xuICB9XG4gIGlmIChwbGFuLnRhc2tzLnNvbWUoKHQpID0+IHQucmVwZWF0ICE9PSBcIm5vbmVcIikpIHtcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTVCOUVcdTRGOEJcdTRFMERcdTYyRTVcdTY3MDlcdTkxQ0RcdTU5MERcdTg5QzRcdTUyMTlcdUZGMENcdThCRjdcdTRGN0ZcdTc1MjhcdTU0NjhcdTY3MUZcdTZBMjFcdTY3N0ZcIik7XG4gIH1cbiAgaWYgKHBsYW4ucG9tb2Rvcm9NaW51dGVzIDwgMSB8fCBwbGFuLnBvbW9kb3JvTWludXRlcyA+IDE4MCkge1xuICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJBMVx1NTIxMlx1NzY4NFx1NzU2QVx1ODMwNFx1NjVGNlx1OTU3Rlx1OTcwMFx1NEUzQSAxXHUyMDEzMTgwIFx1NTIwNlx1OTQ5RlwiKTtcbiAgfVxuICBjb25zdCBkYXRhID0gbmV3IEFwcERhdGEoe1xuICAgIHByb2plY3RzOiBwbGFuLnByb2plY3RzLm1hcCgocCkgPT4gKHtcbiAgICAgIGlkOiBwLmlkLFxuICAgICAgbmFtZTogcC5uYW1lLFxuICAgICAgY29sb3I6IHAuY29sb3IsXG4gICAgICBhcHBXaGl0ZWxpc3Q6IHAuYXBwV2hpdGVsaXN0ID09PSBudWxsID8gbnVsbCA6IFsuLi5wLmFwcFdoaXRlbGlzdF0sXG4gICAgfSkpLFxuICAgIHRhc2tzOiBwbGFuLnRhc2tzLm1hcCgodCkgPT4gcGxhblRhc2tUb1Rhc2sodCwgMCwgdC5lc3RpbWF0ZSkpLFxuICAgIGJsb2NrczogcGxhbi5ibG9ja3MubWFwKChiKSA9PiAoeyAuLi5iLCBkYXlzOiBbLi4uYi5kYXlzXSB9KSksXG4gICAgdGVtcGxhdGVzOiBwbGFuLnRlbXBsYXRlcyxcbiAgICBwcmludHM6IHBsYW4ucHJpbnRzLFxuICAgIGhhYml0czogcGxhbi5oYWJpdHMsXG4gIH0pO1xuICBkYXRhLnZhbGlkYXRlKCk7XG59XG5cbi8qKiBcdTYzNjJcdTdCOTdcdTY3MkNcdTU3MzBcdTc1NkFcdTgzMDRcdTZCQjVcdTY1NzBcdUZGMUJcdTY1RTBcdTUzNTVcdTZCMjFcdTY1RjZcdTk1N0ZcdTYzMDlcdTY1ODdcdTRFRjZcdTc1NkFcdTgzMDRcdTY1RjZcdTk1N0ZcdTYzNjJcdTdCOTdcdTVFNzZcdTU0MTFcdTRFMEFcdTUzRDZcdTY1NzRcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBwbGFuRXN0aW1hdGUoXG4gIHQ6IFBsYW5UYXNrLFxuICBwb21vZG9ybzogbnVtYmVyLFxuICBmb2N1czogbnVtYmVyLFxuKTogbnVtYmVyIHtcbiAgY29uc3QgZXN0aW1hdGUgPVxuICAgIHQuZm9jdXNNaW51dGVzICE9PSBudWxsXG4gICAgICA/IHQuZXN0aW1hdGVcbiAgICAgIDogTWF0aC5jZWlsKCh0LmVzdGltYXRlICogcG9tb2Rvcm8pIC8gZm9jdXMpO1xuICBpZiAoZXN0aW1hdGUgPiA5OSkge1xuICAgIHRocm93IG5ldyBBcHBFcnJvcihgXHU0RUZCXHU1MkExXHUyMDFDJHt0LnRpdGxlfVx1MjAxRFx1NjM2Mlx1N0I5N1x1NTQwRVx1OEQ4NVx1OEZDNyA5OSBcdTRFMkFcdTc1NkFcdTgzMDRcdUZGMENcdThCRjdcdTUxNDhcdTYyQzZcdTUyMDZcdTRFRkJcdTUyQTFgKTtcbiAgfVxuICByZXR1cm4gZXN0aW1hdGU7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRlZEVzdGltYXRlKFxuICBlc3RpbWF0ZTogbnVtYmVyLFxuICBmb2N1czogbnVtYmVyIHwgbnVsbCxcbiAgc291cmNlOiBudW1iZXIsXG4gIGRlc3RpbmF0aW9uOiBudW1iZXIsXG4pOiBudW1iZXIge1xuICBjb25zdCBjb252ZXJ0ZWQgPVxuICAgIGZvY3VzICE9PSBudWxsID8gZXN0aW1hdGUgOiBNYXRoLmNlaWwoKGVzdGltYXRlICogc291cmNlKSAvIGRlc3RpbmF0aW9uKTtcbiAgaWYgKGNvbnZlcnRlZCA+IDk5KSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2MzYyXHU3Qjk3XHU1NDBFXHU4RDg1XHU4RkM3IDk5IFx1NEUyQVx1NzU2QVx1ODMwNFx1RkYwQ1x1OEJGN1x1NTE0OFx1NjJDNlx1NTIwNlx1NkEyMVx1Njc3RlwiKTtcbiAgfVxuICByZXR1cm4gY29udmVydGVkO1xufVxuXG4vKiogXHU1QkZDXHU1MTY1XHVGRjFBXHU1MTQ4XHU1QjhDXHU2NTc0XHU2ODIxXHU5QThDXHU1MDE5XHU5MDA5XHVGRjBDXHU1MThEXHU1MzlGXHU1QjUwXHU2M0QwXHU0RUE0XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VQbGFuKHBsYW46IFBsYW5GaWxlLCBkYXRhOiBBcHBEYXRhLCBhdDogbnVtYmVyKTogdm9pZCB7XG4gIHZhbGlkYXRlUGxhbkZpbGUocGxhbik7XG4gIGNvbnN0IG5leHQgPSBjbG9uZShkYXRhKTtcbiAgZm9yIChjb25zdCBwbGFuUHJvamVjdCBvZiBwbGFuLnByb2plY3RzKSB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBuZXh0LnByb2plY3RzLmZpbmQoKHApID0+IHAuaWQgPT09IHBsYW5Qcm9qZWN0LmlkKTtcbiAgICBpZiAoZXhpc3RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gXHU5ODc5XHU3NkVFXHU5MTREXHU3RjZFXHU2NjJGXHU5MUNEXHU2NUIwXHU3NTFGXHU2MjEwXHU3Njg0XHVGRjBDXHU4RkRCXHU1RUE2XHU0RTBEXHU2NjJGXHVGRjFBXHU2NTg3XHU0RUY2XHU4M0I3XHU4MERDXHVGRjFCXHU3NzAxXHU3NTY1XHU3NjdEXHU1NDBEXHU1MzU1XHU0RkREXHU3NTU5XHU2NzJDXHU2NzNBXHU2RTA1XHU1MzU1XHUzMDAyXG4gICAgICBleGlzdGluZy5uYW1lID0gcGxhblByb2plY3QubmFtZTtcbiAgICAgIGV4aXN0aW5nLmNvbG9yID0gcGxhblByb2plY3QuY29sb3I7XG4gICAgICBpZiAocGxhblByb2plY3QuYXBwV2hpdGVsaXN0ICE9PSBudWxsKSB7XG4gICAgICAgIGV4aXN0aW5nLmFwcFdoaXRlbGlzdCA9IFsuLi5wbGFuUHJvamVjdC5hcHBXaGl0ZWxpc3RdO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0LnByb2plY3RzLnB1c2goe1xuICAgICAgICBpZDogcGxhblByb2plY3QuaWQsXG4gICAgICAgIG5hbWU6IHBsYW5Qcm9qZWN0Lm5hbWUsXG4gICAgICAgIGNvbG9yOiBwbGFuUHJvamVjdC5jb2xvcixcbiAgICAgICAgYXBwV2hpdGVsaXN0OlxuICAgICAgICAgIHBsYW5Qcm9qZWN0LmFwcFdoaXRlbGlzdCA9PT0gbnVsbFxuICAgICAgICAgICAgPyBudWxsXG4gICAgICAgICAgICA6IFsuLi5wbGFuUHJvamVjdC5hcHBXaGl0ZWxpc3RdLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgaGFiaXQgb2YgcGxhbi5oYWJpdHMpIHtcbiAgICBjb25zdCBleGlzdGluZyA9IG5leHQuaGFiaXRzLmZpbmQoKGgpID0+IGguaWQgPT09IGhhYml0LmlkKTtcbiAgICBpZiAoZXhpc3RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZXhpc3RpbmcubmFtZSA9IGhhYml0Lm5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHQuaGFiaXRzLnB1c2goeyBpZDogaGFiaXQuaWQsIG5hbWU6IGhhYml0Lm5hbWUgfSk7XG4gICAgfVxuICB9XG4gIC8vIFx1NjVGNlx1NkJCNVx1NjYyRlx1N0VBRlx1OTE0RFx1N0Y2RVx1RkYxQVx1NjU4N1x1NEVGNlx1NzI0OFx1NjcyQ1x1NjZGRlx1NjM2Mlx1NjcyQ1x1NjczQVx1NzI0OFx1NjcyQ1x1RkYwQ1x1NjcyQVx1NjNEMFx1NTNDQVx1NzY4NFx1NEZERFx1NjMwMVx1NEUwRFx1NTJBOFx1MzAwMlxuICBmb3IgKGNvbnN0IGJsb2NrIG9mIHBsYW4uYmxvY2tzKSB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBuZXh0LmJsb2Nrcy5maW5kKChiKSA9PiBiLmlkID09PSBibG9jay5pZCk7XG4gICAgaWYgKGV4aXN0aW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG5leHQuYmxvY2tzW25leHQuYmxvY2tzLmluZGV4T2YoZXhpc3RpbmcpXSA9IHtcbiAgICAgICAgLi4uYmxvY2ssXG4gICAgICAgIGRheXM6IFsuLi5ibG9jay5kYXlzXSxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHQuYmxvY2tzLnB1c2goeyAuLi5ibG9jaywgZGF5czogWy4uLmJsb2NrLmRheXNdIH0pO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IHBsYW5UZW1wbGF0ZSBvZiBwbGFuLnRlbXBsYXRlcykge1xuICAgIGNvbnN0IHRlbXBsYXRlOiBUZW1wbGF0ZSA9IGNsb25lKHBsYW5UZW1wbGF0ZSk7XG4gICAgdGVtcGxhdGUuc2hhcGUuZXN0aW1hdGUgPSBjb252ZXJ0ZWRFc3RpbWF0ZShcbiAgICAgIHRlbXBsYXRlLnNoYXBlLmVzdGltYXRlLFxuICAgICAgdGVtcGxhdGUuc2hhcGUuZm9jdXNNaW51dGVzLFxuICAgICAgcGxhbi5wb21vZG9yb01pbnV0ZXMsXG4gICAgICBkYXRhLnNldHRpbmdzLmZvY3VzTWludXRlcyxcbiAgICApO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gbmV4dC50ZW1wbGF0ZXMuZmluZCgodCkgPT4gdC5pZCA9PT0gdGVtcGxhdGUuaWQpO1xuICAgIGlmIChleGlzdGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBuZXh0LnRlbXBsYXRlc1tuZXh0LnRlbXBsYXRlcy5pbmRleE9mKGV4aXN0aW5nKV0gPSB0ZW1wbGF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV4dC50ZW1wbGF0ZXMucHVzaCh0ZW1wbGF0ZSk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgcHJpbnQgb2YgcGxhbi5wcmludHMpIHtcbiAgICBpZiAoXG4gICAgICAhbmV4dC5wcmludHMuc29tZShcbiAgICAgICAgKHApID0+IHAudGVtcGxhdGVJZCA9PT0gcHJpbnQudGVtcGxhdGVJZCAmJiBwLmRhdGUgPT09IHByaW50LmRhdGUsXG4gICAgICApXG4gICAgKSB7XG4gICAgICBuZXh0LnByaW50cy5wdXNoKHsgdGVtcGxhdGVJZDogcHJpbnQudGVtcGxhdGVJZCwgZGF0ZTogcHJpbnQuZGF0ZSB9KTtcbiAgICB9XG4gIH1cbiAgLy8gXHU1REYyXHU2NzA5XHU1QjlFXHU0RjhCXHU1M0Q2XHU2NTg3XHU0RUY2XHU5MTREXHU3RjZFXHUzMDAxXHU0RkREXHU3NTU5XHU4RkRCXHU1RUE2XHUzMDAyXG4gIGNvbnN0IGluY29taW5nID0gbmV3IE1hcDxzdHJpbmcsIFBsYW5UYXNrPigpO1xuICBmb3IgKGNvbnN0IHQgb2YgcGxhbi50YXNrcykgaW5jb21pbmcuc2V0KHQuaWQsIHQpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5leHQudGFza3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICBjb25zdCB0YXNrID0gbmV4dC50YXNrc1tpXSE7XG4gICAgY29uc3QgcGxhblRhc2sgPSBpbmNvbWluZy5nZXQodGFzay5pZCk7XG4gICAgaWYgKHBsYW5UYXNrID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuICAgIGlmIChkYXRhLnRlYWNoaW5nVGFzayh0YXNrLmlkKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdThCQTFcdTUyMTJcdTY1ODdcdTRFRjZcdTRFMERcdTgwRkRcdTY1MzlcdTUxOTlcdTY1NTlcdTVCNjZcdTVGODVcdTUyOUVcdUZGMENcdThCRjdcdThDMDNcdTY1NzRcdTVCRjlcdTVFOTRcdThCRkVcdTdBMEJcdTYyMTZcdTRGNUNcdTRFMUFcIik7XG4gICAgfVxuICAgIGNvbnN0IGVzdGltYXRlID0gcGxhbkVzdGltYXRlKFxuICAgICAgcGxhblRhc2ssXG4gICAgICBwbGFuLnBvbW9kb3JvTWludXRlcyxcbiAgICAgIGRhdGEuc2V0dGluZ3MuZm9jdXNNaW51dGVzLFxuICAgICk7XG4gICAgY29uc3Qgb2xkID0gY2xvbmUodGFzayk7XG4gICAgbmV4dC50YXNrc1tpXSA9IHBsYW5UYXNrTWVyZ2UocGxhblRhc2ssIG9sZCwgYXQsIGVzdGltYXRlKTtcbiAgfVxuICBjb25zdCBsb2NhbElkcyA9IG5ldyBTZXQobmV4dC50YXNrcy5tYXAoKHQpID0+IHQuaWQpKTtcbiAgZm9yIChjb25zdCBwbGFuVGFzayBvZiBwbGFuLnRhc2tzKSB7XG4gICAgaWYgKGxvY2FsSWRzLmhhcyhwbGFuVGFzay5pZCkpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGVzdGltYXRlID0gcGxhbkVzdGltYXRlKFxuICAgICAgcGxhblRhc2ssXG4gICAgICBwbGFuLnBvbW9kb3JvTWludXRlcyxcbiAgICAgIGRhdGEuc2V0dGluZ3MuZm9jdXNNaW51dGVzLFxuICAgICk7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBwbGFuVGFza1RvVGFzayhwbGFuVGFzaywgYXQsIGVzdGltYXRlKTtcbiAgICBpZiAoaW5zdGFuY2UudGVtcGxhdGVJZCAhPT0gbnVsbCkge1xuICAgICAgaWYgKFxuICAgICAgICAhbmV4dC5wcmludHMuc29tZShcbiAgICAgICAgICAocCkgPT5cbiAgICAgICAgICAgIHAudGVtcGxhdGVJZCA9PT0gaW5zdGFuY2UudGVtcGxhdGVJZCAmJiBwLmRhdGUgPT09IGluc3RhbmNlLmR1ZURhdGUsXG4gICAgICAgIClcbiAgICAgICkge1xuICAgICAgICBuZXh0LnByaW50cy5wdXNoKHtcbiAgICAgICAgICB0ZW1wbGF0ZUlkOiBpbnN0YW5jZS50ZW1wbGF0ZUlkLFxuICAgICAgICAgIGRhdGU6IGluc3RhbmNlLmR1ZURhdGUsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICBuZXh0LnRhc2tzLnB1c2goaW5zdGFuY2UpO1xuICB9XG4gIGlmIChwbGFuLnJlcGxhY2UpIHtcbiAgICAvLyBcdTY1ODdcdTRFRjZcdTUzNzNcdTY1NzRcdTRFMkFcdThCQTFcdTUyMTJcdUZGMUFcdTUyMjBcdTYzODlcdTVCODNcdTRFMERcdTUxOERcdTYzRDBcdTUzQ0FcdTc2ODRcdTY3MkFcdTVCOENcdTYyMTBcdTk4NzlcdUZGMENcdTUzODZcdTUzRjJcdTZDMzhcdTRFMERcdTUyMjBcdTMwMDJcbiAgICBjb25zdCBwbGFubmVkVGFza3MgPSBuZXcgU2V0KHBsYW4udGFza3MubWFwKCh0KSA9PiB0LmlkKSk7XG4gICAgbmV4dC50YXNrcyA9IG5leHQudGFza3MuZmlsdGVyKFxuICAgICAgKHQpID0+XG4gICAgICAgIHQuY29tcGxldGVkIHx8XG4gICAgICAgIHBsYW5uZWRUYXNrcy5oYXModC5pZCkgfHxcbiAgICAgICAgZGF0YS50ZWFjaGluZ1Rhc2sodC5pZCkgIT09IHVuZGVmaW5lZCxcbiAgICApO1xuICAgIGNvbnN0IHBsYW5uZWRIYWJpdHMgPSBuZXcgU2V0KHBsYW4uaGFiaXRzLm1hcCgoaCkgPT4gaC5pZCkpO1xuICAgIGNvbnN0IHJlbW92ZWRIYWJpdHMgPSBuZXh0LmhhYml0c1xuICAgICAgLmZpbHRlcigoaCkgPT4gIXBsYW5uZWRIYWJpdHMuaGFzKGguaWQpKVxuICAgICAgLm1hcCgoaCkgPT4gaC5pZCk7XG4gICAgaWYgKHJlbW92ZWRIYWJpdHMubGVuZ3RoID4gMCkge1xuICAgICAgbmV4dC5oYWJpdHMgPSBuZXh0LmhhYml0cy5maWx0ZXIoKGgpID0+ICFyZW1vdmVkSGFiaXRzLmluY2x1ZGVzKGguaWQpKTtcbiAgICAgIGZvciAoY29uc3QgdGFzayBvZiBuZXh0LnRhc2tzKSB7XG4gICAgICAgIGlmICh0YXNrLmhhYml0SWQgIT09IG51bGwgJiYgcmVtb3ZlZEhhYml0cy5pbmNsdWRlcyh0YXNrLmhhYml0SWQpKVxuICAgICAgICAgIHRhc2suaGFiaXRJZCA9IG51bGw7XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IHRlbXBsYXRlIG9mIG5leHQudGVtcGxhdGVzKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICB0ZW1wbGF0ZS5zaGFwZS5oYWJpdElkICE9PSBudWxsICYmXG4gICAgICAgICAgcmVtb3ZlZEhhYml0cy5pbmNsdWRlcyh0ZW1wbGF0ZS5zaGFwZS5oYWJpdElkKVxuICAgICAgICApIHtcbiAgICAgICAgICB0ZW1wbGF0ZS5zaGFwZS5oYWJpdElkID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBwbGFubmVkVGVtcGxhdGVzID0gbmV3IFNldChwbGFuLnRlbXBsYXRlcy5tYXAoKHQpID0+IHQuaWQpKTtcbiAgICBjb25zdCByZW1vdmVkVGVtcGxhdGVzID0gbmV4dC50ZW1wbGF0ZXNcbiAgICAgIC5maWx0ZXIoKHQpID0+ICFwbGFubmVkVGVtcGxhdGVzLmhhcyh0LmlkKSlcbiAgICAgIC5tYXAoKHQpID0+IHQuaWQpO1xuICAgIGZvciAoY29uc3QgaWQgb2YgcmVtb3ZlZFRlbXBsYXRlcykge1xuICAgICAgZGVsZXRlVGVtcGxhdGUobmV4dCwgaWQpO1xuICAgIH1cbiAgICBjb25zdCBwbGFubmVkQmxvY2tzID0gbmV3IFNldChwbGFuLmJsb2Nrcy5tYXAoKGIpID0+IGIuaWQpKTtcbiAgICBuZXh0LmJsb2NrcyA9IG5leHQuYmxvY2tzLmZpbHRlcigoYikgPT4gcGxhbm5lZEJsb2Nrcy5oYXMoYi5pZCkpO1xuICB9XG4gIG5leHQudmFsaWRhdGUoKTtcbiAgcmVwbGFjZUFwcERhdGEoZGF0YSwgbmV4dCk7XG59XG5cbi8qKiBcdTVCRkNcdTUxRkFcdUZGMUFcdTRFMERcdTU0MkJcdTVCOENcdTYyMTBcdThGREJcdTVFQTZcdTMwMDFcdTRFMTNcdTZDRThcdTUzODZcdTUzRjJcdTMwMDFcdThCQTFcdTY1RjZcdTU2NjhcdTRFMEVcdTY3MkNcdTY3M0FcdThCQkVcdTdGNkVcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBleHBvcnRQbGFuKGRhdGE6IEFwcERhdGEpOiBQbGFuRmlsZSB7XG4gIGNvbnN0IHRhc2tzOiBQbGFuVGFza1tdID0gZGF0YS50YXNrc1xuICAgIC5maWx0ZXIoKHQpID0+ICF0LmNvbXBsZXRlZCAmJiBkYXRhLnRlYWNoaW5nVGFzayh0LmlkKSA9PT0gdW5kZWZpbmVkKVxuICAgIC5tYXAoKHQpID0+ICh7XG4gICAgICB0ZW1wbGF0ZUlkOiB0LnRlbXBsYXRlSWQsXG4gICAgICBoYWJpdElkOiB0LmhhYml0SWQsXG4gICAgICByZWN1cnJpbmc6IHQucmVjdXJyaW5nLFxuICAgICAgc2NyYXBNaW51dGVzOiB0LnNjcmFwTWludXRlcyxcbiAgICAgIGlkOiB0LmlkLFxuICAgICAgdGl0bGU6IHQudGl0bGUsXG4gICAgICBub3RlczogdC5ub3RlcyxcbiAgICAgIHByb2plY3RJZDogdC5wcm9qZWN0SWQsXG4gICAgICBkdWVEYXRlOiB0LmR1ZURhdGUsXG4gICAgICByZW1pbmRlclRpbWU6IHQucmVtaW5kZXJUaW1lLFxuICAgICAgZm9jdXNNaW51dGVzOiB0LmZvY3VzTWludXRlcyxcbiAgICAgIHByaW9yaXR5OiB0LnByaW9yaXR5LFxuICAgICAgZXN0aW1hdGU6IHQuZXN0aW1hdGUsXG4gICAgICB0YWdzOiBbLi4udC50YWdzXSxcbiAgICAgIHJlcGVhdDogXCJub25lXCIgYXMgY29uc3QsXG4gICAgICBzdWJ0YXNrczogdC5zdWJ0YXNrcy5tYXAoKHMpID0+ICh7IGlkOiBzLmlkLCB0aXRsZTogcy50aXRsZSB9KSksXG4gICAgfSkpO1xuICBjb25zdCB1c2VkID0gbmV3IFNldDxzdHJpbmc+KFtcbiAgICAuLi50YXNrc1xuICAgICAgLmZpbHRlcigodCkgPT4gdC5wcm9qZWN0SWQgIT09IG51bGwpXG4gICAgICAubWFwKCh0KSA9PiB0LnByb2plY3RJZCBhcyBzdHJpbmcpLFxuICAgIC4uLmRhdGEudGVtcGxhdGVzXG4gICAgICAuZmlsdGVyKCh0KSA9PiB0LnNoYXBlLnByb2plY3RJZCAhPT0gbnVsbClcbiAgICAgIC5tYXAoKHQpID0+IHQuc2hhcGUucHJvamVjdElkIGFzIHN0cmluZyksXG4gIF0pO1xuICByZXR1cm4ge1xuICAgIGZvcm1hdDogXCJ0b21hdG8tdG9kby1wbGFuXCIsXG4gICAgdmVyc2lvbjogNixcbiAgICByZXBsYWNlOiBmYWxzZSxcbiAgICBibG9ja3M6IGRhdGEuYmxvY2tzLm1hcCgoYikgPT4gKHsgLi4uYiwgZGF5czogWy4uLmIuZGF5c10gfSkpLFxuICAgIHRlbXBsYXRlczogZGF0YS50ZW1wbGF0ZXMubWFwKCh0KSA9PiBjbG9uZSh0KSksXG4gICAgcHJpbnRzOiBkYXRhLnByaW50cy5tYXAoKHApID0+ICh7IC4uLnAgfSkpLFxuICAgIGhhYml0czogZGF0YS5oYWJpdHMubWFwKChoKSA9PiAoeyAuLi5oIH0pKSxcbiAgICBwb21vZG9yb01pbnV0ZXM6IGRhdGEuc2V0dGluZ3MuZm9jdXNNaW51dGVzLFxuICAgIHByb2plY3RzOiBkYXRhLnByb2plY3RzXG4gICAgICAuZmlsdGVyKChwKSA9PiB1c2VkLmhhcyhwLmlkKSlcbiAgICAgIC5tYXAoKHApID0+ICh7XG4gICAgICAgIGlkOiBwLmlkLFxuICAgICAgICBuYW1lOiBwLm5hbWUsXG4gICAgICAgIGNvbG9yOiBwLmNvbG9yLFxuICAgICAgICBhcHBXaGl0ZWxpc3Q6IHAuYXBwV2hpdGVsaXN0ID09PSBudWxsID8gbnVsbCA6IFsuLi5wLmFwcFdoaXRlbGlzdF0sXG4gICAgICB9KSksXG4gICAgdGFza3MsXG4gIH07XG59XG4iLCAiLy8hIFx1NTE3MVx1NEVBQlx1NkEyMVx1NTc4Qlx1MzAwMVx1OEJBMVx1NjVGNlx1NzJCNlx1NjAwMVx1NjczQVx1NEUwRVx1NjgyMVx1OUE4Q1x1NTE2NVx1NTNFM1x1MzAwMlxuLy8hIFx1NUJGOVx1NUU5NCBjcmF0ZXMvY29yZS9zcmMvbGliLnJzXHVGRjA4RW5naW5lIFx1NTcyOCBlbmdpbmUudHNcdUZGMENcdTY4NENcdTk3NjIgZ3VhcmQgXHU1MzlGXHU3NTFGXHU0RkREXHU3NTU5XHVGRjA5XHUzMDAyXG5cbmltcG9ydCB7IEFwcEVycm9yLCBjaGFyQ291bnQsIGNsb25lLCBlbnN1cmUsIHV0ZjhMZW4gfSBmcm9tIFwiLi9lcnJvcnNcIjtcbmltcG9ydCB7IGlkIH0gZnJvbSBcIi4vaWRzXCI7XG5pbXBvcnQge1xuICBhc0FycmF5LFxuICBhc0Jvb2wsXG4gIGFzSW50LFxuICBhc09wdCxcbiAgYXNTdHIsXG4gIGZpZWxkLFxuICBpc09iamVjdCxcbiAgb25lT2YsXG4gIHJlamVjdFVua25vd24sXG4gIHJlcXVpcmVkRmllbGQsXG59IGZyb20gXCIuL2pzb25cIjtcbmltcG9ydCB0eXBlIHtcbiAgQWN0aXZlTG9jayxcbiAgQXR0ZW50aW9uLFxuICBCbG9jayxcbiAgRGV0YWNoVGFyZ2V0LFxuICBEYXlTdGF0LFxuICBHdWFyZE1vZGUsXG4gIEhhYml0LFxuICBIYWJpdFNsb3QsXG4gIElkZW50aXR5LFxuICBMb2NrU2NoZWR1bGUsXG4gIExvY2tTdGF0ZSxcbiAgTW9kZSxcbiAgUGxhbkZpbGUsXG4gIFByaW50aW5nLFxuICBQcm9qZWN0LFxuICBSZXBlYXQsXG4gIFNlc3Npb24sXG4gIFNlc3Npb25Tb3VyY2UsXG4gIFNldHRpbmdzLFxuICBTaGFwZSxcbiAgU3RhdHMsXG4gIFN1YnRhc2ssXG4gIFRhc2ssXG4gIFRhc2tEcmFmdCxcbiAgVGFza0tpbmQsXG4gIFRlbXBsYXRlLFxuICBUaW1lcixcbiAgVmlzaW9uLFxufSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHsgaXNIYWJpdCwga2luZE9mIH0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IHZhbGlkYXRlTG9jaywgcmVsZWFzZUxvY2ssIHNjaGVkdWxlZEF0IH0gZnJvbSBcIi4vbG9ja1wiO1xuaW1wb3J0IHsgdmFsaWRhdGVCbG9ja3MgfSBmcm9tIFwiLi9ibG9ja3NcIjtcbmltcG9ydCB7IHZhbGlkYXRlSGFiaXQgfSBmcm9tIFwiLi9oYWJpdHNcIjtcbmltcG9ydCB7IHZhbGlkYXRlVGVtcGxhdGVzLCB0YXNrSXNWb2lkIH0gZnJvbSBcIi4vdGVtcGxhdGVzXCI7XG5pbXBvcnQge1xuICBkdXJhdGlvbk9mLFxuICBkdWVBdXRvVGFzayxcbiAgcGVuZGluZ1JlbWluZGVyLFxuICByZWNvcmRTZXNzaW9uLFxuICByZW1pbmRlcklkbGUsXG4gIHJlc2V0VG8sXG4gIHN0YXJ0RHVlVGFzayxcbiAgc3RhcnRUaW1lcixcbiAgdGFza0hhc1JvdW5kc0xlZnQsXG4gIHRpY2tSZW1pbmRlcnMsXG4gIHRpbWVyUmVtYWluaW5nLFxuICB3aW5kb3dNaW51dGVzLFxufSBmcm9tIFwiLi9yZW1pbmRlcnNcIjtcbmltcG9ydCB7IEVkdWNhdGlvbiwgcGFyc2VFZHVjYXRpb24sIHNlcmlhbGl6ZUVkdWNhdGlvbiB9IGZyb20gXCIuL2VkdWNhdGlvblwiO1xuaW1wb3J0IHtcbiAgY29tcGxldGVUZWFjaGluZ1Rhc2ssXG4gIG1hdGVyaWFsaXplVGVhY2hpbmdUYXNrcyxcbiAgc3RhcnRUZWFjaGluZ1Rhc2ssXG4gIHRlYWNoaW5nVGFzayxcbiAgdmFsaWRhdGVUZWFjaGluZ1Rhc2tzLFxufSBmcm9tIFwiLi90ZWFjaGluZ190YXNrc1wiO1xuaW1wb3J0IHtcbiAgdmFsaWRhdGVJZGVudGl0aWVzLFxuICBwYXJzZUlkZW50aXR5LFxuICBzZXJpYWxpemVJZGVudGl0eSxcbn0gZnJvbSBcIi4vaWRlbnRpdGllc1wiO1xuaW1wb3J0IHsgZXhwb3J0UGxhbiwgbWVyZ2VQbGFuIH0gZnJvbSBcIi4vcGxhblwiO1xuaW1wb3J0IHtcbiAgZGVsZXRlVGVtcGxhdGUsXG4gIGZyb21UYXNrLFxuICBtYXRlcmlhbGl6ZVRlbXBsYXRlcyxcbiAgcHJpbnRJbnN0YW5jZXMsXG4gIHByaW50VGVtcGxhdGUsXG4gIHJlcGxhY2VBcHBEYXRhLFxuICBzYXZlVGVtcGxhdGUsXG4gIHN5bmNUZW1wbGF0ZSxcbn0gZnJvbSBcIi4vdGVtcGxhdGVzXCI7XG5pbXBvcnQgeyBwYXJzZUxvY2tTdGF0ZSwgc2VyaWFsaXplTG9ja1N0YXRlIH0gZnJvbSBcIi4vbG9ja1wiO1xuaW1wb3J0IHsgcGFyc2VCbG9jaywgc2VyaWFsaXplQmxvY2sgfSBmcm9tIFwiLi9ibG9ja3NcIjtcbmltcG9ydCB7IHBhcnNlSGFiaXQsIHNlcmlhbGl6ZUhhYml0IH0gZnJvbSBcIi4vaGFiaXRzXCI7XG5pbXBvcnQgeyBhZGREYXlzLCBkYXRlQXQsIHZhbGlkRGF0ZSB9IGZyb20gXCIuL3RpbWVcIjtcblxuLy8gLS0tLS0tLS0tLSBcdTU3RkFcdTc4NDBcdTdDN0JcdTU3OEJcdTg5RTNcdTY3OTAvXHU1RThGXHU1MjE3XHU1MzE2IC0tLS0tLS0tLS1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUHJvamVjdChyYXc6IHVua25vd24pOiBQcm9qZWN0IHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTk4NzlcdTc2RUVcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiXHU5ODc5XHU3NkVFXCIsIGFzU3RyKSxcbiAgICBuYW1lOiByZXF1aXJlZEZpZWxkKHJhdywgXCJuYW1lXCIsIFwiXHU5ODc5XHU3NkVFXCIsIGFzU3RyKSxcbiAgICBjb2xvcjogcmVxdWlyZWRGaWVsZChyYXcsIFwiY29sb3JcIiwgXCJcdTk4NzlcdTc2RUVcIiwgYXNTdHIpLFxuICAgIGFwcFdoaXRlbGlzdDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImFwcFdoaXRlbGlzdFwiLFxuICAgICAgXCJcdTk4NzlcdTc2RUVcIixcbiAgICAgICh2KSA9PlxuICAgICAgICBhc09wdCh2LCBcImFwcFdoaXRlbGlzdFwiLCAoeCkgPT5cbiAgICAgICAgICBhc0FycmF5KHgsIFwiYXBwV2hpdGVsaXN0XCIpLm1hcCgoYSkgPT4gYXNTdHIoYSwgXCJcdTVFOTRcdTc1MjggSURcIikpLFxuICAgICAgICApLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZ1tdIHwgbnVsbCxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVByb2plY3QocDogUHJvamVjdCk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICBpZDogcC5pZCxcbiAgICBuYW1lOiBwLm5hbWUsXG4gICAgY29sb3I6IHAuY29sb3IsXG4gIH07XG4gIGlmIChwLmFwcFdoaXRlbGlzdCAhPT0gbnVsbCkgb3V0W1wiYXBwV2hpdGVsaXN0XCJdID0gcC5hcHBXaGl0ZWxpc3Q7XG4gIHJldHVybiBvdXQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVZpc2lvbihyYXc6IHVua25vd24pOiBWaXNpb24ge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NjEzRlx1NjY2Rlx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIFtcImlkXCIsIFwibmFtZVwiLCBcIm5vdGVzXCIsIFwicHJvamVjdElkXCJdLCBcIlx1NjEzRlx1NjY2RlwiKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTYxM0ZcdTY2NkZcIiwgYXNTdHIpLFxuICAgIG5hbWU6IHJlcXVpcmVkRmllbGQocmF3LCBcIm5hbWVcIiwgXCJcdTYxM0ZcdTY2NkZcIiwgYXNTdHIpLFxuICAgIG5vdGVzOiBmaWVsZChyYXcsIFwibm90ZXNcIiwgXCJcdTYxM0ZcdTY2NkZcIiwgYXNTdHIsIFwiXCIpLFxuICAgIHByb2plY3RJZDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInByb2plY3RJZFwiLFxuICAgICAgXCJcdTYxM0ZcdTY2NkZcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcInByb2plY3RJZFwiLCBhc1N0ciksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVZpc2lvbih2OiBWaXNpb24pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgaWQ6IHYuaWQsXG4gICAgbmFtZTogdi5uYW1lLFxuICAgIG5vdGVzOiB2Lm5vdGVzLFxuICB9O1xuICBpZiAodi5wcm9qZWN0SWQgIT09IG51bGwpIG91dFtcInByb2plY3RJZFwiXSA9IHYucHJvamVjdElkO1xuICByZXR1cm4gb3V0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTdWJ0YXNrKHJhdzogdW5rbm93bik6IFN1YnRhc2sge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NUI1MFx1NEVGQlx1NTJBMVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTVCNTBcdTRFRkJcdTUyQTFcIiwgYXNTdHIpLFxuICAgIHRpdGxlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJ0aXRsZVwiLCBcIlx1NUI1MFx1NEVGQlx1NTJBMVwiLCBhc1N0ciksXG4gICAgZG9uZTogcmVxdWlyZWRGaWVsZChyYXcsIFwiZG9uZVwiLCBcIlx1NUI1MFx1NEVGQlx1NTJBMVwiLCBhc0Jvb2wpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplU3VidGFzayhzOiBTdWJ0YXNrKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4geyBpZDogcy5pZCwgdGl0bGU6IHMudGl0bGUsIGRvbmU6IHMuZG9uZSB9O1xufVxuXG5jb25zdCBUQVNLX0tFWVMgPSBbXG4gIFwiaWRcIixcbiAgXCJ0ZW1wbGF0ZUlkXCIsXG4gIFwicmVjdXJyaW5nXCIsXG4gIFwidGl0bGVcIixcbiAgXCJub3Rlc1wiLFxuICBcInByb2plY3RJZFwiLFxuICBcImhhYml0SWRcIixcbiAgXCJkdWVEYXRlXCIsXG4gIFwicmVtaW5kZXJUaW1lXCIsXG4gIFwiZm9jdXNNaW51dGVzXCIsXG4gIFwic2NyYXBNaW51dGVzXCIsXG4gIFwicHJpb3JpdHlcIixcbiAgXCJlc3RpbWF0ZVwiLFxuICBcInJlbWluZGVyRmlyZWRcIixcbiAgXCJyZW1pbmRlclBlbmRpbmdcIixcbiAgXCJyZW1pbmRlckV4cGlyZWRcIixcbiAgXCJjb21wbGV0ZWRcIixcbiAgXCJjb21wbGV0ZWRBdFwiLFxuICBcImNyZWF0ZWRBdFwiLFxuICBcInRhZ3NcIixcbiAgXCJzdWJ0YXNrc1wiLFxuXSBhcyBjb25zdDtcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVGFzayhyYXc6IHVua25vd24pOiBUYXNrIHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTRFRkJcdTUyQTFcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24ocmF3LCBbLi4uVEFTS19LRVlTXSwgXCJcdTRFRkJcdTUyQTFcIik7XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiXHU0RUZCXHU1MkExXCIsIGFzU3RyKSxcbiAgICB0ZW1wbGF0ZUlkOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidGVtcGxhdGVJZFwiLFxuICAgICAgXCJcdTRFRkJcdTUyQTFcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcInRlbXBsYXRlSWRcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gICAgcmVjdXJyaW5nOiBmaWVsZChyYXcsIFwicmVjdXJyaW5nXCIsIFwiXHU0RUZCXHU1MkExXCIsIGFzQm9vbCwgZmFsc2UpLFxuICAgIHRpdGxlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJ0aXRsZVwiLCBcIlx1NEVGQlx1NTJBMVwiLCBhc1N0ciksXG4gICAgbm90ZXM6IHJlcXVpcmVkRmllbGQocmF3LCBcIm5vdGVzXCIsIFwiXHU0RUZCXHU1MkExXCIsIGFzU3RyKSxcbiAgICBwcm9qZWN0SWQ6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJwcm9qZWN0SWRcIixcbiAgICAgIFwiXHU0RUZCXHU1MkExXCIsXG4gICAgICAodikgPT4gYXNPcHQodiwgXCJwcm9qZWN0SWRcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gICAgaGFiaXRJZDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImhhYml0SWRcIixcbiAgICAgIFwiXHU0RUZCXHU1MkExXCIsXG4gICAgICAodikgPT4gYXNPcHQodiwgXCJoYWJpdElkXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgIGR1ZURhdGU6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJkdWVEYXRlXCIsXG4gICAgICBcIlx1NEVGQlx1NTJBMVwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiZHVlRGF0ZVwiLCBhc1N0ciksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgICByZW1pbmRlclRpbWU6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJyZW1pbmRlclRpbWVcIixcbiAgICAgIFwiXHU0RUZCXHU1MkExXCIsXG4gICAgICAodikgPT4gYXNPcHQodiwgXCJyZW1pbmRlclRpbWVcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gICAgZm9jdXNNaW51dGVzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiZm9jdXNNaW51dGVzXCIsXG4gICAgICBcIlx1NEVGQlx1NTJBMVwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiZm9jdXNNaW51dGVzXCIsICh4KSA9PiBhc0ludCh4LCBcImZvY3VzTWludXRlc1wiKSksXG4gICAgICBudWxsLFxuICAgICkgYXMgbnVtYmVyIHwgbnVsbCxcbiAgICBzY3JhcE1pbnV0ZXM6IGZpZWxkKHJhdywgXCJzY3JhcE1pbnV0ZXNcIiwgXCJcdTRFRkJcdTUyQTFcIiwgYXNJbnQsIDApLFxuICAgIHByaW9yaXR5OiByZXF1aXJlZEZpZWxkKHJhdywgXCJwcmlvcml0eVwiLCBcIlx1NEVGQlx1NTJBMVwiLCBhc0ludCksXG4gICAgZXN0aW1hdGU6IHJlcXVpcmVkRmllbGQocmF3LCBcImVzdGltYXRlXCIsIFwiXHU0RUZCXHU1MkExXCIsIGFzSW50KSxcbiAgICByZW1pbmRlckZpcmVkOiBmaWVsZChyYXcsIFwicmVtaW5kZXJGaXJlZFwiLCBcIlx1NEVGQlx1NTJBMVwiLCBhc0Jvb2wsIGZhbHNlKSxcbiAgICByZW1pbmRlclBlbmRpbmc6IGZpZWxkKHJhdywgXCJyZW1pbmRlclBlbmRpbmdcIiwgXCJcdTRFRkJcdTUyQTFcIiwgYXNCb29sLCBmYWxzZSksXG4gICAgcmVtaW5kZXJFeHBpcmVkOiBmaWVsZChyYXcsIFwicmVtaW5kZXJFeHBpcmVkXCIsIFwiXHU0RUZCXHU1MkExXCIsIGFzQm9vbCwgZmFsc2UpLFxuICAgIGNvbXBsZXRlZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiY29tcGxldGVkXCIsIFwiXHU0RUZCXHU1MkExXCIsIGFzQm9vbCksXG4gICAgY29tcGxldGVkQXQ6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJjb21wbGV0ZWRBdFwiLFxuICAgICAgXCJcdTRFRkJcdTUyQTFcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcImNvbXBsZXRlZEF0XCIsIGFzSW50KSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBudW1iZXIgfCBudWxsLFxuICAgIGNyZWF0ZWRBdDogcmVxdWlyZWRGaWVsZChyYXcsIFwiY3JlYXRlZEF0XCIsIFwiXHU0RUZCXHU1MkExXCIsIGFzSW50KSxcbiAgICB0YWdzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidGFnc1wiLFxuICAgICAgXCJcdTRFRkJcdTUyQTFcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwidGFnc1wiKS5tYXAoKHQpID0+IGFzU3RyKHQsIFwiXHU2ODA3XHU3QjdFXCIpKSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgc3VidGFza3M6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJzdWJ0YXNrc1wiLFxuICAgICAgXCJcdTRFRkJcdTUyQTFcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwic3VidGFza3NcIikubWFwKHBhcnNlU3VidGFzayksXG4gICAgICBbXSxcbiAgICApLFxuICB9O1xufVxuXG4vKipcbiAqIGNhbm9uaWNhbCBcdTRFRkJcdTUyQTFcdTVFOEZcdTUyMTdcdTUzMTZcdUZGMUFcdTk1MkVcdTVFOEZcdTRFMEUgUnVzdCBgVGFza2AgXHU1OEYwXHU2NjBFXHU1RThGXHU0RTAwXHU4MUY0XHUzMDAyXG4gKiBcdTY0QTRcdTk1MDBcdTYwNjJcdTU5MERcdTYyOEFcdThCRTVcdTRFMzJcdTVCNThcdThGREIgSWRlbnRpdHkucmVzdG9yZVRhc2tcdUZGMENcdTZCRDRcdThGODNcdTVGQzVcdTk4N0JcdTkwMTBcdTVCNTdcdTgyODJcdTRFMDBcdTgxRjRcdTMwMDJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVRhc2sodDogVGFzayk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogdC5pZCxcbiAgICB0ZW1wbGF0ZUlkOiB0LnRlbXBsYXRlSWQsXG4gICAgcmVjdXJyaW5nOiB0LnJlY3VycmluZyxcbiAgICB0aXRsZTogdC50aXRsZSxcbiAgICBub3RlczogdC5ub3RlcyxcbiAgICBwcm9qZWN0SWQ6IHQucHJvamVjdElkLFxuICAgIGhhYml0SWQ6IHQuaGFiaXRJZCxcbiAgICBkdWVEYXRlOiB0LmR1ZURhdGUsXG4gICAgcmVtaW5kZXJUaW1lOiB0LnJlbWluZGVyVGltZSxcbiAgICBmb2N1c01pbnV0ZXM6IHQuZm9jdXNNaW51dGVzLFxuICAgIHNjcmFwTWludXRlczogdC5zY3JhcE1pbnV0ZXMsXG4gICAgcHJpb3JpdHk6IHQucHJpb3JpdHksXG4gICAgZXN0aW1hdGU6IHQuZXN0aW1hdGUsXG4gICAgcmVtaW5kZXJGaXJlZDogdC5yZW1pbmRlckZpcmVkLFxuICAgIHJlbWluZGVyUGVuZGluZzogdC5yZW1pbmRlclBlbmRpbmcsXG4gICAgcmVtaW5kZXJFeHBpcmVkOiB0LnJlbWluZGVyRXhwaXJlZCxcbiAgICBjb21wbGV0ZWQ6IHQuY29tcGxldGVkLFxuICAgIGNvbXBsZXRlZEF0OiB0LmNvbXBsZXRlZEF0LFxuICAgIGNyZWF0ZWRBdDogdC5jcmVhdGVkQXQsXG4gICAgdGFnczogdC50YWdzLFxuICAgIHN1YnRhc2tzOiB0LnN1YnRhc2tzLm1hcChzZXJpYWxpemVTdWJ0YXNrKSxcbiAgfTtcbn1cblxuY29uc3QgVEFTS19EUkFGVF9LRVlTID0gW1xuICBcImlkXCIsXG4gIFwidGl0bGVcIixcbiAgXCJub3Rlc1wiLFxuICBcInByb2plY3RJZFwiLFxuICBcImR1ZURhdGVcIixcbiAgXCJyZW1pbmRlclRpbWVcIixcbiAgXCJmb2N1c01pbnV0ZXNcIixcbiAgXCJzY3JhcE1pbnV0ZXNcIixcbiAgXCJwcmlvcml0eVwiLFxuICBcImVzdGltYXRlXCIsXG4gIFwidGFnc1wiLFxuICBcInN1YnRhc2tzXCIsXG4gIFwicmVwZWF0XCIsXG5dIGFzIGNvbnN0O1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VUYXNrRHJhZnQocmF3OiB1bmtub3duKTogVGFza0RyYWZ0IHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTRFRkJcdTUyQTFcdTgzNDlcdTdBM0ZcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24ocmF3LCBbLi4uVEFTS19EUkFGVF9LRVlTXSwgXCJcdTRFRkJcdTUyQTFcdTgzNDlcdTdBM0ZcIik7XG4gIHJldHVybiB7XG4gICAgaWQ6IGZpZWxkKHJhdywgXCJpZFwiLCBcIlx1NEVGQlx1NTJBMVx1ODM0OVx1N0EzRlwiLCAodikgPT4gYXNPcHQodiwgXCJpZFwiLCBhc1N0ciksIG51bGwpIGFzXG4gICAgICBzdHJpbmcgfCBudWxsLFxuICAgIHRpdGxlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJ0aXRsZVwiLCBcIlx1NEVGQlx1NTJBMVx1ODM0OVx1N0EzRlwiLCBhc1N0ciksXG4gICAgbm90ZXM6IGZpZWxkKHJhdywgXCJub3Rlc1wiLCBcIlx1NEVGQlx1NTJBMVx1ODM0OVx1N0EzRlwiLCBhc1N0ciwgXCJcIiksXG4gICAgcHJvamVjdElkOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwicHJvamVjdElkXCIsXG4gICAgICBcIlx1NEVGQlx1NTJBMVx1ODM0OVx1N0EzRlwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwicHJvamVjdElkXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgIGR1ZURhdGU6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJkdWVEYXRlXCIsXG4gICAgICBcIlx1NEVGQlx1NTJBMVx1ODM0OVx1N0EzRlwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiZHVlRGF0ZVwiLCBhc1N0ciksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgICByZW1pbmRlclRpbWU6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJyZW1pbmRlclRpbWVcIixcbiAgICAgIFwiXHU0RUZCXHU1MkExXHU4MzQ5XHU3QTNGXCIsXG4gICAgICAodikgPT4gYXNPcHQodiwgXCJyZW1pbmRlclRpbWVcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gICAgZm9jdXNNaW51dGVzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiZm9jdXNNaW51dGVzXCIsXG4gICAgICBcIlx1NEVGQlx1NTJBMVx1ODM0OVx1N0EzRlwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiZm9jdXNNaW51dGVzXCIsICh4KSA9PiBhc0ludCh4LCBcImZvY3VzTWludXRlc1wiKSksXG4gICAgICBudWxsLFxuICAgICkgYXMgbnVtYmVyIHwgbnVsbCxcbiAgICBzY3JhcE1pbnV0ZXM6IGZpZWxkKHJhdywgXCJzY3JhcE1pbnV0ZXNcIiwgXCJcdTRFRkJcdTUyQTFcdTgzNDlcdTdBM0ZcIiwgYXNJbnQsIDApLFxuICAgIHByaW9yaXR5OiBmaWVsZChyYXcsIFwicHJpb3JpdHlcIiwgXCJcdTRFRkJcdTUyQTFcdTgzNDlcdTdBM0ZcIiwgYXNJbnQsIDApLFxuICAgIGVzdGltYXRlOiBmaWVsZChyYXcsIFwiZXN0aW1hdGVcIiwgXCJcdTRFRkJcdTUyQTFcdTgzNDlcdTdBM0ZcIiwgYXNJbnQsIDEpLFxuICAgIHRhZ3M6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJ0YWdzXCIsXG4gICAgICBcIlx1NEVGQlx1NTJBMVx1ODM0OVx1N0EzRlwiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJ0YWdzXCIpLm1hcCgodCkgPT4gYXNTdHIodCwgXCJcdTY4MDdcdTdCN0VcIikpLFxuICAgICAgW10sXG4gICAgKSxcbiAgICBzdWJ0YXNrczogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInN1YnRhc2tzXCIsXG4gICAgICBcIlx1NEVGQlx1NTJBMVx1ODM0OVx1N0EzRlwiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJzdWJ0YXNrc1wiKS5tYXAocGFyc2VTdWJ0YXNrKSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgcmVwZWF0OiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwicmVwZWF0XCIsXG4gICAgICBcIlx1NEVGQlx1NTJBMVx1ODM0OVx1N0EzRlwiLFxuICAgICAgKHYpID0+IG9uZU9mKHYsIFwicmVwZWF0XCIsIFtcIm5vbmVcIiwgXCJkYWlseVwiLCBcIndlZWtkYXlzXCIsIFwid2Vla2x5XCJdKSxcbiAgICAgIFwibm9uZVwiLFxuICAgICkgYXMgUmVwZWF0LFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VIYWJpdFNsb3QocmF3OiB1bmtub3duKTogSGFiaXRTbG90IHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTRFNjBcdTYwRUZcdTY1RjZcdTZCQjVcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJldHVybiB7XG4gICAgZGF5czogYXNBcnJheShcbiAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcImRheXNcIiwgXCJcdTRFNjBcdTYwRUZcdTY1RjZcdTZCQjVcIiwgKHYpID0+IHYpLFxuICAgICAgXCJkYXlzXCIsXG4gICAgKS5tYXAoKGQpID0+IGFzSW50KGQsIFwiXHU0RTYwXHU2MEVGXHU2NjFGXHU2NzFGXCIpKSxcbiAgICB0aW1lOiByZXF1aXJlZEZpZWxkKHJhdywgXCJ0aW1lXCIsIFwiXHU0RTYwXHU2MEVGXHU2NUY2XHU2QkI1XCIsIGFzU3RyKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUHJvdGVjdGlvbihyYXc6IHVua25vd24pOiB7XG4gIG1vZGU6IEd1YXJkTW9kZTtcbiAgd2hpdGVsaXN0OiBzdHJpbmdbXTtcbiAgc3RyaWN0OiBib29sZWFuO1xufSB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU0RkREXHU2MkE0XHU4QkJFXHU3RjZFXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZXR1cm4ge1xuICAgIG1vZGU6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJtb2RlXCIsXG4gICAgICBcIlx1NEZERFx1NjJBNFx1OEJCRVx1N0Y2RVwiLFxuICAgICAgKHYpID0+IG9uZU9mKHYsIFwiXHU0RkREXHU2MkE0IG1vZGVcIiwgW1wib2ZmXCIsIFwibG9ja1wiLCBcIndoaXRlbGlzdFwiXSksXG4gICAgICBcIm9mZlwiLFxuICAgICkgYXMgR3VhcmRNb2RlLFxuICAgIHdoaXRlbGlzdDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcIndoaXRlbGlzdFwiLFxuICAgICAgXCJcdTRGRERcdTYyQTRcdThCQkVcdTdGNkVcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwid2hpdGVsaXN0XCIpLm1hcCgoYSkgPT4gYXNTdHIoYSwgXCJcdTVFOTRcdTc1MjggSURcIikpLFxuICAgICAgW10sXG4gICAgKSxcbiAgICBzdHJpY3Q6IGZpZWxkKHJhdywgXCJzdHJpY3RcIiwgXCJcdTRGRERcdTYyQTRcdThCQkVcdTdGNkVcIiwgYXNCb29sLCBmYWxzZSksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVQcm90ZWN0aW9uKHA6IHtcbiAgbW9kZTogR3VhcmRNb2RlO1xuICB3aGl0ZWxpc3Q6IHN0cmluZ1tdO1xuICBzdHJpY3Q6IGJvb2xlYW47XG59KTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4geyBtb2RlOiBwLm1vZGUsIHdoaXRlbGlzdDogcC53aGl0ZWxpc3QsIHN0cmljdDogcC5zdHJpY3QgfTtcbn1cblxuY29uc3QgU0VUVElOR1NfS0VZUyA9IFtcbiAgXCJmb2N1c01pbnV0ZXNcIixcbiAgXCJzaG9ydEJyZWFrTWludXRlc1wiLFxuICBcImxvbmdCcmVha01pbnV0ZXNcIixcbiAgXCJsb25nQnJlYWtFdmVyeVwiLFxuICBcImRhaWx5R29hbFwiLFxuICBcImF1dG9CcmVha1wiLFxuICBcImF1dG9Gb2N1c1wiLFxuICBcImF1dG9TdGFydFRhc2tzXCIsXG4gIFwic291bmRcIixcbiAgXCJzb3VuZFZvbHVtZVwiLFxuICBcIm5vdGlmaWNhdGlvbnNcIixcbiAgXCJhbHdheXNPblRvcFwiLFxuICBcInRoZW1lXCIsXG4gIFwicGVyc29uYUJhY2tkcm9wXCIsXG4gIFwicHJvdGVjdGlvblwiLFxuXSBhcyBjb25zdDtcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2V0dGluZ3MocmF3OiB1bmtub3duKTogU2V0dGluZ3Mge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJCRVx1N0Y2RVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmV0dXJuIHtcbiAgICBmb2N1c01pbnV0ZXM6IHJlcXVpcmVkRmllbGQocmF3LCBcImZvY3VzTWludXRlc1wiLCBcIlx1OEJCRVx1N0Y2RVwiLCBhc0ludCksXG4gICAgc2hvcnRCcmVha01pbnV0ZXM6IHJlcXVpcmVkRmllbGQocmF3LCBcInNob3J0QnJlYWtNaW51dGVzXCIsIFwiXHU4QkJFXHU3RjZFXCIsIGFzSW50KSxcbiAgICBsb25nQnJlYWtNaW51dGVzOiByZXF1aXJlZEZpZWxkKHJhdywgXCJsb25nQnJlYWtNaW51dGVzXCIsIFwiXHU4QkJFXHU3RjZFXCIsIGFzSW50KSxcbiAgICBsb25nQnJlYWtFdmVyeTogcmVxdWlyZWRGaWVsZChyYXcsIFwibG9uZ0JyZWFrRXZlcnlcIiwgXCJcdThCQkVcdTdGNkVcIiwgYXNJbnQpLFxuICAgIGRhaWx5R29hbDogcmVxdWlyZWRGaWVsZChyYXcsIFwiZGFpbHlHb2FsXCIsIFwiXHU4QkJFXHU3RjZFXCIsIGFzSW50KSxcbiAgICBhdXRvQnJlYWs6IHJlcXVpcmVkRmllbGQocmF3LCBcImF1dG9CcmVha1wiLCBcIlx1OEJCRVx1N0Y2RVwiLCBhc0Jvb2wpLFxuICAgIGF1dG9Gb2N1czogcmVxdWlyZWRGaWVsZChyYXcsIFwiYXV0b0ZvY3VzXCIsIFwiXHU4QkJFXHU3RjZFXCIsIGFzQm9vbCksXG4gICAgYXV0b1N0YXJ0VGFza3M6IGZpZWxkKHJhdywgXCJhdXRvU3RhcnRUYXNrc1wiLCBcIlx1OEJCRVx1N0Y2RVwiLCBhc0Jvb2wsIGZhbHNlKSxcbiAgICBzb3VuZDogcmVxdWlyZWRGaWVsZChyYXcsIFwic291bmRcIiwgXCJcdThCQkVcdTdGNkVcIiwgYXNCb29sKSxcbiAgICBzb3VuZFZvbHVtZTogZmllbGQocmF3LCBcInNvdW5kVm9sdW1lXCIsIFwiXHU4QkJFXHU3RjZFXCIsIGFzSW50LCAxMDApLFxuICAgIG5vdGlmaWNhdGlvbnM6IHJlcXVpcmVkRmllbGQocmF3LCBcIm5vdGlmaWNhdGlvbnNcIiwgXCJcdThCQkVcdTdGNkVcIiwgYXNCb29sKSxcbiAgICBhbHdheXNPblRvcDogcmVxdWlyZWRGaWVsZChyYXcsIFwiYWx3YXlzT25Ub3BcIiwgXCJcdThCQkVcdTdGNkVcIiwgYXNCb29sKSxcbiAgICB0aGVtZTogcmVxdWlyZWRGaWVsZChyYXcsIFwidGhlbWVcIiwgXCJcdThCQkVcdTdGNkVcIiwgYXNTdHIpLFxuICAgIHBlcnNvbmFCYWNrZHJvcDogZmllbGQocmF3LCBcInBlcnNvbmFCYWNrZHJvcFwiLCBcIlx1OEJCRVx1N0Y2RVwiLCBhc0Jvb2wsIGZhbHNlKSxcbiAgICBwcm90ZWN0aW9uOiBmaWVsZChyYXcsIFwicHJvdGVjdGlvblwiLCBcIlx1OEJCRVx1N0Y2RVwiLCBwYXJzZVByb3RlY3Rpb24sIHtcbiAgICAgIG1vZGU6IFwib2ZmXCIsXG4gICAgICB3aGl0ZWxpc3Q6IFtdLFxuICAgICAgc3RyaWN0OiBmYWxzZSxcbiAgICB9KSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVNldHRpbmdzKHM6IFNldHRpbmdzKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4ge1xuICAgIGZvY3VzTWludXRlczogcy5mb2N1c01pbnV0ZXMsXG4gICAgc2hvcnRCcmVha01pbnV0ZXM6IHMuc2hvcnRCcmVha01pbnV0ZXMsXG4gICAgbG9uZ0JyZWFrTWludXRlczogcy5sb25nQnJlYWtNaW51dGVzLFxuICAgIGxvbmdCcmVha0V2ZXJ5OiBzLmxvbmdCcmVha0V2ZXJ5LFxuICAgIGRhaWx5R29hbDogcy5kYWlseUdvYWwsXG4gICAgYXV0b0JyZWFrOiBzLmF1dG9CcmVhayxcbiAgICBhdXRvRm9jdXM6IHMuYXV0b0ZvY3VzLFxuICAgIGF1dG9TdGFydFRhc2tzOiBzLmF1dG9TdGFydFRhc2tzLFxuICAgIHNvdW5kOiBzLnNvdW5kLFxuICAgIHNvdW5kVm9sdW1lOiBzLnNvdW5kVm9sdW1lLFxuICAgIG5vdGlmaWNhdGlvbnM6IHMubm90aWZpY2F0aW9ucyxcbiAgICBhbHdheXNPblRvcDogcy5hbHdheXNPblRvcCxcbiAgICB0aGVtZTogcy50aGVtZSxcbiAgICBwZXJzb25hQmFja2Ryb3A6IHMucGVyc29uYUJhY2tkcm9wLFxuICAgIHByb3RlY3Rpb246IHNlcmlhbGl6ZVByb3RlY3Rpb24ocy5wcm90ZWN0aW9uKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZmF1bHRTZXR0aW5ncygpOiBTZXR0aW5ncyB7XG4gIHJldHVybiB7XG4gICAgZm9jdXNNaW51dGVzOiAyNSxcbiAgICBzaG9ydEJyZWFrTWludXRlczogNSxcbiAgICBsb25nQnJlYWtNaW51dGVzOiAxNSxcbiAgICBsb25nQnJlYWtFdmVyeTogNCxcbiAgICBkYWlseUdvYWw6IDgsXG4gICAgYXV0b0JyZWFrOiBmYWxzZSxcbiAgICBhdXRvRm9jdXM6IGZhbHNlLFxuICAgIGF1dG9TdGFydFRhc2tzOiBmYWxzZSxcbiAgICBzb3VuZDogdHJ1ZSxcbiAgICBzb3VuZFZvbHVtZTogMTAwLFxuICAgIG5vdGlmaWNhdGlvbnM6IHRydWUsXG4gICAgYWx3YXlzT25Ub3A6IGZhbHNlLFxuICAgIHRoZW1lOiBcImxpZ2h0XCIsXG4gICAgcGVyc29uYUJhY2tkcm9wOiBmYWxzZSxcbiAgICBwcm90ZWN0aW9uOiB7IG1vZGU6IFwib2ZmXCIsIHdoaXRlbGlzdDogW10sIHN0cmljdDogZmFsc2UgfSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVGltZXIocmF3OiB1bmtub3duKTogVGltZXIge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJBMVx1NjVGNlx1NTY2OFx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmV0dXJuIHtcbiAgICBtb2RlOiBvbmVPZihcbiAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcIm1vZGVcIiwgXCJcdThCQTFcdTY1RjZcdTU2NjhcIiwgKHYpID0+IHYpLFxuICAgICAgXCJcdThCQTFcdTY1RjZcdTU2NjggbW9kZVwiLFxuICAgICAgW1wiZm9jdXNcIiwgXCJzaG9ydEJyZWFrXCIsIFwibG9uZ0JyZWFrXCJdLFxuICAgICkgYXMgTW9kZSxcbiAgICBydW5uaW5nOiByZXF1aXJlZEZpZWxkKHJhdywgXCJydW5uaW5nXCIsIFwiXHU4QkExXHU2NUY2XHU1NjY4XCIsIGFzQm9vbCksXG4gICAgdGFza0lkOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidGFza0lkXCIsXG4gICAgICBcIlx1OEJBMVx1NjVGNlx1NTY2OFwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwidGFza0lkXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgIGR1cmF0aW9uU2VjczogcmVxdWlyZWRGaWVsZChyYXcsIFwiZHVyYXRpb25TZWNzXCIsIFwiXHU4QkExXHU2NUY2XHU1NjY4XCIsIGFzSW50KSxcbiAgICByZW1haW5pbmdTZWNzOiByZXF1aXJlZEZpZWxkKHJhdywgXCJyZW1haW5pbmdTZWNzXCIsIFwiXHU4QkExXHU2NUY2XHU1NjY4XCIsIGFzSW50KSxcbiAgICBkZWFkbGluZTogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImRlYWRsaW5lXCIsXG4gICAgICBcIlx1OEJBMVx1NjVGNlx1NTY2OFwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiZGVhZGxpbmVcIiwgYXNJbnQpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIG51bWJlciB8IG51bGwsXG4gICAgc3RhcnRlZEF0OiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwic3RhcnRlZEF0XCIsXG4gICAgICBcIlx1OEJBMVx1NjVGNlx1NTY2OFwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwic3RhcnRlZEF0XCIsIGFzSW50KSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBudW1iZXIgfCBudWxsLFxuICAgIGN5Y2xlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJjeWNsZVwiLCBcIlx1OEJBMVx1NjVGNlx1NTY2OFwiLCBhc0ludCksXG4gICAgY3ljbGVEYXRlOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiY3ljbGVEYXRlXCIsXG4gICAgICBcIlx1OEJBMVx1NjVGNlx1NTY2OFwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiY3ljbGVEYXRlXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgIGNvbXBsZXRpb25TZXJpYWw6IHJlcXVpcmVkRmllbGQocmF3LCBcImNvbXBsZXRpb25TZXJpYWxcIiwgXCJcdThCQTFcdTY1RjZcdTU2NjhcIiwgYXNJbnQpLFxuICAgIGxhc3RGaW5pc2hlZE1vZGU6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJsYXN0RmluaXNoZWRNb2RlXCIsXG4gICAgICBcIlx1OEJBMVx1NjVGNlx1NTY2OFwiLFxuICAgICAgKHYpID0+XG4gICAgICAgIGFzT3B0KHYsIFwibGFzdEZpbmlzaGVkTW9kZVwiLCAoeCkgPT5cbiAgICAgICAgICBvbmVPZih4LCBcImxhc3RGaW5pc2hlZE1vZGVcIiwgW1wiZm9jdXNcIiwgXCJzaG9ydEJyZWFrXCIsIFwibG9uZ0JyZWFrXCJdKSxcbiAgICAgICAgKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBNb2RlIHwgbnVsbCxcbiAgICBhdXRvRm9jdXNCbG9ja2VkOiBmaWVsZChyYXcsIFwiYXV0b0ZvY3VzQmxvY2tlZFwiLCBcIlx1OEJBMVx1NjVGNlx1NTY2OFwiLCBhc0Jvb2wsIGZhbHNlKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVRpbWVyKHQ6IFRpbWVyKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4ge1xuICAgIG1vZGU6IHQubW9kZSxcbiAgICBydW5uaW5nOiB0LnJ1bm5pbmcsXG4gICAgdGFza0lkOiB0LnRhc2tJZCxcbiAgICBkdXJhdGlvblNlY3M6IHQuZHVyYXRpb25TZWNzLFxuICAgIHJlbWFpbmluZ1NlY3M6IHQucmVtYWluaW5nU2VjcyxcbiAgICBkZWFkbGluZTogdC5kZWFkbGluZSxcbiAgICBzdGFydGVkQXQ6IHQuc3RhcnRlZEF0LFxuICAgIGN5Y2xlOiB0LmN5Y2xlLFxuICAgIGN5Y2xlRGF0ZTogdC5jeWNsZURhdGUsXG4gICAgY29tcGxldGlvblNlcmlhbDogdC5jb21wbGV0aW9uU2VyaWFsLFxuICAgIGxhc3RGaW5pc2hlZE1vZGU6IHQubGFzdEZpbmlzaGVkTW9kZSxcbiAgICBhdXRvRm9jdXNCbG9ja2VkOiB0LmF1dG9Gb2N1c0Jsb2NrZWQsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWZhdWx0VGltZXIoKTogVGltZXIge1xuICByZXR1cm4ge1xuICAgIG1vZGU6IFwiZm9jdXNcIixcbiAgICBydW5uaW5nOiBmYWxzZSxcbiAgICB0YXNrSWQ6IG51bGwsXG4gICAgZHVyYXRpb25TZWNzOiAxNTAwLFxuICAgIHJlbWFpbmluZ1NlY3M6IDE1MDAsXG4gICAgZGVhZGxpbmU6IG51bGwsXG4gICAgc3RhcnRlZEF0OiBudWxsLFxuICAgIGN5Y2xlOiAwLFxuICAgIGN5Y2xlRGF0ZTogbnVsbCxcbiAgICBjb21wbGV0aW9uU2VyaWFsOiAwLFxuICAgIGxhc3RGaW5pc2hlZE1vZGU6IG51bGwsXG4gICAgYXV0b0ZvY3VzQmxvY2tlZDogZmFsc2UsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNlc3Npb24ocmF3OiB1bmtub3duKTogU2Vzc2lvbiB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU0RTEzXHU2Q0U4XHU4QkIwXHU1RjU1XHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1NEUxM1x1NkNFOFx1OEJCMFx1NUY1NVwiLCBhc1N0ciksXG4gICAgc291cmNlOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwic291cmNlXCIsXG4gICAgICBcIlx1NEUxM1x1NkNFOFx1OEJCMFx1NUY1NVwiLFxuICAgICAgKHYpID0+IG9uZU9mKHYsIFwic291cmNlXCIsIFtcInRpbWVyXCIsIFwidGFza0VzdGltYXRlXCJdKSxcbiAgICAgIFwidGltZXJcIixcbiAgICApIGFzIFNlc3Npb25Tb3VyY2UsXG4gICAgdGFza0lkOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidGFza0lkXCIsXG4gICAgICBcIlx1NEUxM1x1NkNFOFx1OEJCMFx1NUY1NVwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwidGFza0lkXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgIHRhc2tUaXRsZTogcmVxdWlyZWRGaWVsZChyYXcsIFwidGFza1RpdGxlXCIsIFwiXHU0RTEzXHU2Q0U4XHU4QkIwXHU1RjU1XCIsIGFzU3RyKSxcbiAgICBwcm9qZWN0TmFtZTogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvamVjdE5hbWVcIiwgXCJcdTRFMTNcdTZDRThcdThCQjBcdTVGNTVcIiwgYXNTdHIpLFxuICAgIHN0YXJ0ZWRBdDogcmVxdWlyZWRGaWVsZChyYXcsIFwic3RhcnRlZEF0XCIsIFwiXHU0RTEzXHU2Q0U4XHU4QkIwXHU1RjU1XCIsIGFzSW50KSxcbiAgICBlbmRlZEF0OiByZXF1aXJlZEZpZWxkKHJhdywgXCJlbmRlZEF0XCIsIFwiXHU0RTEzXHU2Q0U4XHU4QkIwXHU1RjU1XCIsIGFzSW50KSxcbiAgICBkdXJhdGlvblNlY3M6IHJlcXVpcmVkRmllbGQocmF3LCBcImR1cmF0aW9uU2Vjc1wiLCBcIlx1NEUxM1x1NkNFOFx1OEJCMFx1NUY1NVwiLCBhc0ludCksXG4gICAgY29tcGxldGVkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJjb21wbGV0ZWRcIiwgXCJcdTRFMTNcdTZDRThcdThCQjBcdTVGNTVcIiwgYXNCb29sKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVNlc3Npb24oczogU2Vzc2lvbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogcy5pZCxcbiAgICBzb3VyY2U6IHMuc291cmNlLFxuICAgIHRhc2tJZDogcy50YXNrSWQsXG4gICAgdGFza1RpdGxlOiBzLnRhc2tUaXRsZSxcbiAgICBwcm9qZWN0TmFtZTogcy5wcm9qZWN0TmFtZSxcbiAgICBzdGFydGVkQXQ6IHMuc3RhcnRlZEF0LFxuICAgIGVuZGVkQXQ6IHMuZW5kZWRBdCxcbiAgICBkdXJhdGlvblNlY3M6IHMuZHVyYXRpb25TZWNzLFxuICAgIGNvbXBsZXRlZDogcy5jb21wbGV0ZWQsXG4gIH07XG59XG5cbi8vIC0tLS0tLS0tLS0gQXBwRGF0YSAtLS0tLS0tLS0tXG5cbmV4cG9ydCBjbGFzcyBBcHBEYXRhIHtcbiAgZWR1Y2F0aW9uOiBFZHVjYXRpb247XG4gIHZlcnNpb246IG51bWJlcjtcbiAgaWRlbnRpdGllczogSWRlbnRpdHlbXTtcbiAgdGFza3M6IFRhc2tbXTtcbiAgYmxvY2tzOiBCbG9ja1tdO1xuICB0ZW1wbGF0ZXM6IFRlbXBsYXRlW107XG4gIHByaW50czogeyB0ZW1wbGF0ZUlkOiBzdHJpbmc7IGRhdGU6IHN0cmluZyB8IG51bGwgfVtdO1xuICBwcm9qZWN0czogUHJvamVjdFtdO1xuICBoYWJpdHM6IEhhYml0W107XG4gIHZpc2lvbnM6IFZpc2lvbltdO1xuICBzZXR0aW5nczogU2V0dGluZ3M7XG4gIHRpbWVyOiBUaW1lcjtcbiAgc2Vzc2lvbnM6IFNlc3Npb25bXTtcbiAgbG9jazogTG9ja1N0YXRlO1xuXG4gIGNvbnN0cnVjdG9yKGluaXQ/OiBQYXJ0aWFsPFBpY2s8QXBwRGF0YSwga2V5b2YgQXBwRGF0YT4+KSB7XG4gICAgdGhpcy5lZHVjYXRpb24gPSBpbml0Py5lZHVjYXRpb24gPz8gbmV3IEVkdWNhdGlvbigpO1xuICAgIHRoaXMudmVyc2lvbiA9IGluaXQ/LnZlcnNpb24gPz8gNDtcbiAgICB0aGlzLmlkZW50aXRpZXMgPSBpbml0Py5pZGVudGl0aWVzID8/IFtdO1xuICAgIHRoaXMudGFza3MgPSBpbml0Py50YXNrcyA/PyBbXTtcbiAgICB0aGlzLmJsb2NrcyA9IGluaXQ/LmJsb2NrcyA/PyBbXTtcbiAgICB0aGlzLnRlbXBsYXRlcyA9IGluaXQ/LnRlbXBsYXRlcyA/PyBbXTtcbiAgICB0aGlzLnByaW50cyA9IGluaXQ/LnByaW50cyA/PyBbXTtcbiAgICB0aGlzLnByb2plY3RzID0gaW5pdD8ucHJvamVjdHMgPz8gW1xuICAgICAgeyBpZDogaWQoKSwgbmFtZTogXCJcdTVERTVcdTRGNUNcIiwgY29sb3I6IFwiI2RmNzU2MVwiLCBhcHBXaGl0ZWxpc3Q6IG51bGwgfSxcbiAgICAgIHsgaWQ6IGlkKCksIG5hbWU6IFwiXHU1QjY2XHU0RTYwXCIsIGNvbG9yOiBcIiM4NDliN2RcIiwgYXBwV2hpdGVsaXN0OiBudWxsIH0sXG4gICAgICB7IGlkOiBpZCgpLCBuYW1lOiBcIlx1NzUxRlx1NkQzQlwiLCBjb2xvcjogXCIjZDVhNTUzXCIsIGFwcFdoaXRlbGlzdDogbnVsbCB9LFxuICAgIF07XG4gICAgdGhpcy5oYWJpdHMgPSBpbml0Py5oYWJpdHMgPz8gW107XG4gICAgdGhpcy52aXNpb25zID0gaW5pdD8udmlzaW9ucyA/PyBbXTtcbiAgICB0aGlzLnNldHRpbmdzID0gaW5pdD8uc2V0dGluZ3MgPz8gZGVmYXVsdFNldHRpbmdzKCk7XG4gICAgdGhpcy50aW1lciA9IGluaXQ/LnRpbWVyID8/IGRlZmF1bHRUaW1lcigpO1xuICAgIHRoaXMuc2Vzc2lvbnMgPSBpbml0Py5zZXNzaW9ucyA/PyBbXTtcbiAgICB0aGlzLmxvY2sgPSBpbml0Py5sb2NrID8/IHtcbiAgICAgIHNjaGVkdWxlczogW10sXG4gICAgICBhY3RpdmU6IG51bGwsXG4gICAgICBzdXBwcmVzc2VkVW50aWw6IDAsXG4gICAgfTtcbiAgfVxuXG4gIHByb3RlY3RlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5sb2NrLmFjdGl2ZSAhPT0gbnVsbCB8fFxuICAgICAgKHRoaXMudGltZXIucnVubmluZyAmJlxuICAgICAgICB0aGlzLnRpbWVyLm1vZGUgPT09IFwiZm9jdXNcIiAmJlxuICAgICAgICB0aGlzLnNldHRpbmdzLnByb3RlY3Rpb24ubW9kZSAhPT0gXCJvZmZcIilcbiAgICApO1xuICB9XG5cbiAgLyoqIFx1NzY3RFx1NTQwRFx1NTM1NVx1NEUxM1x1NkNFOFx1NjVGNlx1NzUxRlx1NjU0OFx1NzY4NFx1NUU5NFx1NzUyOFx1NkUwNVx1NTM1NVx1RkYxQVx1OTg3OVx1NzZFRVx1NEUxM1x1NUM1RVx1NkUwNVx1NTM1NVx1NjZGRlx1NEVFM1x1OTAxQVx1NzUyOFx1NkUwNVx1NTM1NVx1MzAwMiAqL1xuICBlZmZlY3RpdmVXaGl0ZWxpc3QoKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHByb2plY3QgPSAoKCkgPT4ge1xuICAgICAgY29uc3QgdGFza0lkID0gdGhpcy50aW1lci50YXNrSWQ7XG4gICAgICBpZiAodGFza0lkID09PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgY29uc3QgdGFzayA9IHRoaXMudGFza3MuZmluZCgodCkgPT4gdC5pZCA9PT0gdGFza0lkKTtcbiAgICAgIGlmICh0YXNrID09PSB1bmRlZmluZWQgfHwgdGFzay5wcm9qZWN0SWQgPT09IG51bGwpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICByZXR1cm4gdGhpcy5wcm9qZWN0cy5maW5kKChwKSA9PiBwLmlkID09PSB0YXNrLnByb2plY3RJZCk7XG4gICAgfSkoKTtcbiAgICBjb25zdCBsaXN0ID0gcHJvamVjdD8uYXBwV2hpdGVsaXN0O1xuICAgIHJldHVybiBsaXN0ICE9PSBudWxsICYmIGxpc3QgIT09IHVuZGVmaW5lZFxuICAgICAgPyBbLi4ubGlzdF1cbiAgICAgIDogWy4uLnRoaXMuc2V0dGluZ3MucHJvdGVjdGlvbi53aGl0ZWxpc3RdO1xuICB9XG5cbiAgdGFza0lzVm9pZCh0YXNrOiBUYXNrKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRhc2tJc1ZvaWQodGFzayk7XG4gIH1cblxuICBzdHJpY3RQcm90ZWN0ZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgICh0aGlzLmxvY2suYWN0aXZlICE9PSBudWxsICYmIHRoaXMubG9jay5hY3RpdmUuc3RyaWN0KSB8fFxuICAgICAgKHRoaXMudGltZXIucnVubmluZyAmJlxuICAgICAgICB0aGlzLnRpbWVyLm1vZGUgPT09IFwiZm9jdXNcIiAmJlxuICAgICAgICB0aGlzLnNldHRpbmdzLnByb3RlY3Rpb24ubW9kZSAhPT0gXCJvZmZcIiAmJlxuICAgICAgICB0aGlzLnNldHRpbmdzLnByb3RlY3Rpb24uc3RyaWN0KVxuICAgICk7XG4gIH1cblxuICBkdXJhdGlvbk9mKG1vZGU6IE1vZGUpOiBudW1iZXIge1xuICAgIHJldHVybiBkdXJhdGlvbk9mKHRoaXMsIG1vZGUpO1xuICB9XG5cbiAgdGFza0hhc1JvdW5kc0xlZnQodGFzazogVGFzayk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0YXNrSGFzUm91bmRzTGVmdCh0aGlzLCB0YXNrKTtcbiAgfVxuXG4gIHJlc2V0VG8obW9kZTogTW9kZSk6IHZvaWQge1xuICAgIHJlc2V0VG8odGhpcywgbW9kZSk7XG4gIH1cblxuICBzdGFydChhdDogbnVtYmVyKTogdm9pZCB7XG4gICAgc3RhcnRUaW1lcih0aGlzLCBhdCk7XG4gIH1cblxuICByZWNvcmQoYXQ6IG51bWJlciwgY29tcGxldGVkOiBib29sZWFuKTogdm9pZCB7XG4gICAgcmVjb3JkU2Vzc2lvbih0aGlzLCBhdCwgY29tcGxldGVkKTtcbiAgfVxuXG4gIHJlZnJlc2hDeWNsZShhdDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZGF0ZSA9IGRhdGVBdChhdCk7XG4gICAgaWYgKHRoaXMudGltZXIuY3ljbGVEYXRlID09PSBkYXRlKSByZXR1cm4gZmFsc2U7XG4gICAgdGhpcy50aW1lci5jeWNsZSA9IHRoaXMuc2Vzc2lvbnMuZmlsdGVyKFxuICAgICAgKHMpID0+IHMuY29tcGxldGVkICYmIGRhdGVBdChzLmVuZGVkQXQpID09PSBkYXRlLFxuICAgICkubGVuZ3RoO1xuICAgIHRoaXMudGltZXIuY3ljbGVEYXRlID0gZGF0ZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBcdTUwNUNcdTY3M0FcdTU0MEVcdTY3MDBcdTU5MUFcdTYzQThcdThGREJcdTRFMDBcdTRFMkFcdTk2MzZcdTZCQjVcdUZGMUFcdTdFRERcdTRFMERcdTRGMkFcdTkwMjBcdTY1RTBcdTRFQkFcdTUwM0NcdTVCODhcdTc2ODRcdTRFMTNcdTZDRThcdTRGMUFcdThCRERcdTMwMDIgKi9cbiAgdGljayhhdDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgY29uc3QgdGVhY2hpbmdDaGFuZ2VkID0gdGhpcy5lZHVjYXRpb24udGljayhhdCk7XG4gICAgY29uc3QgdGVhY2hpbmdUYXNrc0NoYW5nZWQgPSBtYXRlcmlhbGl6ZVRlYWNoaW5nVGFza3ModGhpcywgYXQpO1xuICAgIGNvbnN0IG1hdGVyaWFsaXplZCA9XG4gICAgICBtYXRlcmlhbGl6ZVRlbXBsYXRlcyh0aGlzLCBhdCkgfHwgdGVhY2hpbmdDaGFuZ2VkIHx8IHRlYWNoaW5nVGFza3NDaGFuZ2VkO1xuICAgIGNvbnN0IHJlbWluZGVyc0NoYW5nZWQgPSB0aWNrUmVtaW5kZXJzKHRoaXMsIGF0KTtcbiAgICBjb25zdCBjaGFuZ2VkID0gdGhpcy50aWNrV2l0aExvY2soYXQpIHx8IG1hdGVyaWFsaXplZDtcbiAgICBjb25zdCBjeWNsZUNoYW5nZWQgPSB0aGlzLnJlZnJlc2hDeWNsZShhdCk7XG4gICAgaWYgKFxuICAgICAgY3ljbGVDaGFuZ2VkICYmXG4gICAgICB0aGlzLnRpbWVyLmN5Y2xlID09PSAwICYmXG4gICAgICB0aGlzLnRpbWVyLm1vZGUgIT09IFwiZm9jdXNcIiAmJlxuICAgICAgIXRoaXMudGltZXIucnVubmluZyAmJlxuICAgICAgdGhpcy50aW1lci5zdGFydGVkQXQgPT09IG51bGwgJiZcbiAgICAgIHRoaXMudGltZXIucmVtYWluaW5nU2VjcyA9PT0gdGhpcy50aW1lci5kdXJhdGlvblNlY3NcbiAgICApIHtcbiAgICAgIHRoaXMucmVzZXRUbyhcImZvY3VzXCIpO1xuICAgIH1cbiAgICByZXR1cm4gKFxuICAgICAgc3RhcnREdWVUYXNrKHRoaXMsIGF0KSB8fCByZW1pbmRlcnNDaGFuZ2VkIHx8IGNoYW5nZWQgfHwgY3ljbGVDaGFuZ2VkXG4gICAgKTtcbiAgfVxuXG4gIHRpY2tXaXRoTG9jayhhdDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgY29uc3QgcHJldmlvdXMgPSBKU09OLnN0cmluZ2lmeShzZXJpYWxpemVMb2NrU3RhdGUodGhpcy5sb2NrKSk7XG4gICAgaWYgKHRoaXMubG9jay5hY3RpdmUgIT09IG51bGwgJiYgYXQgPj0gdGhpcy5sb2NrLmFjdGl2ZS5lbmRzQXQpIHtcbiAgICAgIHRoaXMubG9jay5hY3RpdmUgPSBudWxsO1xuICAgIH1cbiAgICBjb25zdCBzY2hlZHVsZWQgPSBzY2hlZHVsZWRBdCh0aGlzLmxvY2ssIGF0KTtcbiAgICBpZiAoc2NoZWR1bGVkICE9PSBudWxsKSB7XG4gICAgICBpZiAodGhpcy5sb2NrLmFjdGl2ZSAhPT0gbnVsbCkge1xuICAgICAgICBzY2hlZHVsZWQuc3RhcnRlZEF0ID0gTWF0aC5taW4oXG4gICAgICAgICAgdGhpcy5sb2NrLmFjdGl2ZS5zdGFydGVkQXQsXG4gICAgICAgICAgc2NoZWR1bGVkLnN0YXJ0ZWRBdCxcbiAgICAgICAgKTtcbiAgICAgICAgc2NoZWR1bGVkLmVuZHNBdCA9IE1hdGgubWF4KHRoaXMubG9jay5hY3RpdmUuZW5kc0F0LCBzY2hlZHVsZWQuZW5kc0F0KTtcbiAgICAgICAgc2NoZWR1bGVkLnN0cmljdCA9IHNjaGVkdWxlZC5zdHJpY3QgfHwgdGhpcy5sb2NrLmFjdGl2ZS5zdHJpY3Q7XG4gICAgICB9XG4gICAgICB0aGlzLmxvY2suYWN0aXZlID0gc2NoZWR1bGVkO1xuICAgIH1cbiAgICBjb25zdCBjaGFuZ2VkID0gcHJldmlvdXMgIT09IEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZUxvY2tTdGF0ZSh0aGlzLmxvY2spKTtcbiAgICBpZiAodGhpcy5sb2NrLmFjdGl2ZSAhPT0gbnVsbCkge1xuICAgICAgY29uc3Qgc3RhcnQgPSB0aGlzLmxvY2suYWN0aXZlLnN0YXJ0ZWRBdDtcbiAgICAgIGlmICh0aGlzLnRpbWVyLnJ1bm5pbmcpIHtcbiAgICAgICAgY29uc3Qgc3RvcCA9IE1hdGgubWluKFxuICAgICAgICAgIE1hdGgubWF4KHN0YXJ0LCB0aGlzLnRpbWVyLnN0YXJ0ZWRBdCA/PyBzdGFydCksXG4gICAgICAgICAgYXQsXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMudGlja1RpbWVyKHN0b3ApO1xuICAgICAgICB0aGlzLnJlY29yZChzdG9wLCBmYWxzZSk7XG4gICAgICAgIHRoaXMucmVzZXRUbyhcImZvY3VzXCIpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjaGFuZ2VkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy50aWNrVGltZXIoYXQpIHx8IGNoYW5nZWQ7XG4gIH1cblxuICB0aWNrVGltZXIoYXQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy50aW1lci5ydW5uaW5nIHx8IHRpbWVyUmVtYWluaW5nKHRoaXMudGltZXIsIGF0KSA+IDApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgZW5kID0gdGhpcy50aW1lci5kZWFkbGluZSA/PyBhdDtcbiAgICB0aGlzLmZpbmlzaFRpbWVyKGVuZCwgYXQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZmluaXNoVGltZXIoZW5kOiBudW1iZXIsIGF0OiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCBmaW5pc2hlZCA9IHRoaXMudGltZXIubW9kZTtcbiAgICBjb25zdCBjb250aW51YXRpb25CbG9ja2VkID0gdGhpcy50aW1lci5hdXRvRm9jdXNCbG9ja2VkO1xuICAgIGlmIChmaW5pc2hlZCA9PT0gXCJmb2N1c1wiKSB7XG4gICAgICB0aGlzLnJlZnJlc2hDeWNsZShlbmQpO1xuICAgIH1cbiAgICB0aGlzLnJlY29yZChlbmQsIHRydWUpO1xuICAgIGlmIChmaW5pc2hlZCA9PT0gXCJmb2N1c1wiKSB7XG4gICAgICB0aGlzLnRpbWVyLmN5Y2xlID0gTWF0aC5taW4odGhpcy50aW1lci5jeWNsZSArIDEsIDQyOTQ5NjcyOTUpO1xuICAgIH1cbiAgICBjb25zdCBuZXh0OiBNb2RlID1cbiAgICAgIGZpbmlzaGVkID09PSBcImZvY3VzXCJcbiAgICAgICAgPyB0aGlzLnRpbWVyLmN5Y2xlICUgdGhpcy5zZXR0aW5ncy5sb25nQnJlYWtFdmVyeSA9PT0gMFxuICAgICAgICAgID8gXCJsb25nQnJlYWtcIlxuICAgICAgICAgIDogXCJzaG9ydEJyZWFrXCJcbiAgICAgICAgOiBcImZvY3VzXCI7XG4gICAgdGhpcy5yZXNldFRvKG5leHQpO1xuICAgIHRoaXMudGltZXIuY29tcGxldGlvblNlcmlhbCA9IE1hdGgubWluKFxuICAgICAgdGhpcy50aW1lci5jb21wbGV0aW9uU2VyaWFsICsgMSxcbiAgICAgIE51bWJlci5NQVhfU0FGRV9JTlRFR0VSLFxuICAgICk7XG4gICAgdGhpcy50aW1lci5sYXN0RmluaXNoZWRNb2RlID0gZmluaXNoZWQ7XG4gICAgY29uc3QgYXV0byA9XG4gICAgICBuZXh0ID09PSBcImZvY3VzXCJcbiAgICAgICAgPyB0aGlzLnNldHRpbmdzLmF1dG9Gb2N1cyAmJlxuICAgICAgICAgICFjb250aW51YXRpb25CbG9ja2VkICYmXG4gICAgICAgICAgKHRoaXMudGltZXIudGFza0lkID09PSBudWxsIHx8XG4gICAgICAgICAgICAoKCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCB0YXNrID0gdGhpcy50YXNrcy5maW5kKCh0KSA9PiB0LmlkID09PSB0aGlzLnRpbWVyLnRhc2tJZCk7XG4gICAgICAgICAgICAgIHJldHVybiB0YXNrICE9PSB1bmRlZmluZWQgJiYgdGhpcy50YXNrSGFzUm91bmRzTGVmdCh0YXNrKTtcbiAgICAgICAgICAgIH0pKCkpICYmXG4gICAgICAgICAgISh0aGlzLnNldHRpbmdzLmF1dG9TdGFydFRhc2tzICYmIGR1ZUF1dG9UYXNrKHRoaXMpICE9PSBudWxsKVxuICAgICAgICA6IHRoaXMuc2V0dGluZ3MuYXV0b0JyZWFrO1xuICAgIC8vIFx1ODFFQVx1NTJBOFx1N0VFRFx1NjNBNVx1NTNFQVx1NUM1RVx1NEU4RVx1NkQzQlx1Nzc0MFx1NzY4NFx1NUU5NFx1NzUyOFx1RkYwQ1x1NEUwRFx1NUYyNVx1ODg2NVx1NTE3M1x1NjczQS9cdTc3NjFcdTc3MjBcdTc2ODRcdTY1RjZcdTk1RjRcdTMwMDJcbiAgICBpZiAoYXV0byAmJiBhdCAtIGVuZCA8IDUpIHtcbiAgICAgIHRoaXMuc3RhcnQoYXQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBcdTk4ODRcdTY4QzAgKyBcdTYyNjdcdTg4NEMgKyBcdTY1NTlcdTVCNjZcdTVGODVcdTUyOUVcdTc1MUZcdTYyMTAgKyBcdTUxNjhcdTkxQ0ZcdTY4MjFcdTlBOENcdTMwMDIgKi9cbiAgYXBwbHkoYWN0aW9uOiBBY3Rpb24sIGF0OiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLnRpY2soYXQpO1xuICAgIGlmICh0aGlzLnN0cmljdFByb3RlY3RlZCgpKSB7XG4gICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTRFMjVcdTY4M0NcdTZBMjFcdTVGMEZcdTc1MUZcdTY1NDhcdTRFMkRcdUZGMENcdTRFMERcdTgwRkRcdTYzRDBcdTUyNERcdTdFRDNcdTY3NUZcdTYyMTZcdTRGRUVcdTY1MzlcdUZGMUJcdTUyMzBcdTY1RjZcdTgxRUFcdTUyQThcdTg5RTNcdTk2NjRcIik7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIHRoaXMucHJvdGVjdGVkKCkgJiZcbiAgICAgIGFjdGlvbi50eXBlICE9PSBcImVtZXJnZW5jeVVubG9ja1wiICYmXG4gICAgICBhY3Rpb24udHlwZSAhPT0gXCJjb21wbGV0ZUZvY3VzXCJcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcbiAgICAgICAgXCJcdTRFMTNcdTZDRThcdTRGRERcdTYyQTRcdTRFMkRcdUZGMENcdTdFRDNcdTY3NUZcdTUyNERcdTRFMERcdTgwRkRcdTRGRUVcdTY1MzlcdTRFRkJcdTUyQTFcdTYyMTZcdThCQTFcdTY1RjZcdUZGMUJcdTUzRUZcdTYzRDBcdTUyNERcdTVCOENcdTYyMTBcdTc1NkFcdTgzMDRcdTYyMTZcdTdEMjdcdTYwMjVcdTkwMDBcdTUxRkFcIixcbiAgICAgICk7XG4gICAgfVxuICAgIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJlZHVjYXRpb25cIjoge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgYWN0aW9uLmNvbW1hbmQub3AgPT09IFwic3RhcnRFeGFtXCIgJiZcbiAgICAgICAgICAoIXRoaXMucmVtaW5kZXJJZGxlKCkgfHxcbiAgICAgICAgICAgIHRoaXMudGltZXIubW9kZSAhPT0gXCJmb2N1c1wiIHx8XG4gICAgICAgICAgICB0aGlzLnRpbWVyLnJlbWFpbmluZ1NlY3MgIT09IHRoaXMudGltZXIuZHVyYXRpb25TZWNzKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdThCRjdcdTUxNDhcdTdFRDNcdTY3NUZcdTVGNTNcdTUyNERcdThCQTFcdTY1RjZcdTYyMTZcdTk1MDFcdTY3M0FcdUZGMENcdTUxOERcdTVGMDBcdTU5Q0JcdTgwMDNcdThCRDVcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lZHVjYXRpb24uYXBwbHkoYWN0aW9uLmNvbW1hbmQsIGF0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwicHJpbnRJbnN0YW5jZXNcIjpcbiAgICAgICAgcHJpbnRJbnN0YW5jZXModGhpcywgYWN0aW9uLnNoYXBlLCBhY3Rpb24ucHJpbnRpbmcsIGF0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwic2F2ZVRlbXBsYXRlXCI6IHtcbiAgICAgICAgY29uc3QgaWQgPSBhY3Rpb24udGVtcGxhdGUuaWQ7XG4gICAgICAgIHNhdmVUZW1wbGF0ZSh0aGlzLCBhY3Rpb24udGVtcGxhdGUpO1xuICAgICAgICB0aGlzLnZhbGlkYXRlKCk7XG4gICAgICAgIGlmIChhY3Rpb24ucHJpbnREYXRlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcHJpbnRUZW1wbGF0ZSh0aGlzLCBpZCwgYWN0aW9uLnByaW50RGF0ZXMsIGF0KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJkZWxldGVUZW1wbGF0ZVwiOlxuICAgICAgICBkZWxldGVUZW1wbGF0ZSh0aGlzLCBhY3Rpb24uaWQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJwcmludFRlbXBsYXRlXCI6XG4gICAgICAgIHByaW50VGVtcGxhdGUodGhpcywgYWN0aW9uLmlkLCBhY3Rpb24uZGF0ZXMsIGF0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwic3luY1RlbXBsYXRlXCI6XG4gICAgICAgIHN5bmNUZW1wbGF0ZSh0aGlzLCBhY3Rpb24uaWQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJzdGFydFJlbWluZGVyXCI6IHtcbiAgICAgICAgaWYgKCF0aGlzLnJlbWluZGVySWRsZSgpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4QkY3XHU1MTQ4XHU3RUQzXHU2NzVGXHU1RjUzXHU1MjREXHU4QkExXHU2NUY2XCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHQgPSB0aGlzLnRhc2tzLmZpbmQoXG4gICAgICAgICAgKHgpID0+IHguaWQgPT09IGFjdGlvbi5pZCAmJiAheC5jb21wbGV0ZWQgJiYgeC5yZW1pbmRlclBlbmRpbmcsXG4gICAgICAgICk7XG4gICAgICAgIGlmICh0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTYzRDBcdTkxOTJcdTVERjJcdTU5MzFcdTY1NDhcIik7XG4gICAgICAgIH1cbiAgICAgICAgdC5yZW1pbmRlclBlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aW1lci50YXNrSWQgPSBhY3Rpb24uaWQ7XG4gICAgICAgIHRoaXMucmVzZXRUbyhcImZvY3VzXCIpO1xuICAgICAgICBzdGFydFRlYWNoaW5nVGFzayh0aGlzLCBhdCk7XG4gICAgICAgIHRoaXMuc3RhcnQoYXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJlbWVyZ2VuY3lVbmxvY2tcIjoge1xuICAgICAgICB0aGlzLnJlY29yZChhdCwgZmFsc2UpO1xuICAgICAgICB0aGlzLnJlc2V0VG8oXCJmb2N1c1wiKTtcbiAgICAgICAgcmVsZWFzZUxvY2sodGhpcy5sb2NrLCBhdCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInJlYXJtTG9ja1wiOiB7XG4gICAgICAgIC8vIFx1MzAwQ1x1N0VEM1x1Njc1Rlx1NUU3Nlx1ODlFM1x1OTUwMVx1MzAwRFx1NTNFQVx1NjI5MVx1NTIzNlx1NUY1M1x1NTI0RFx1NjVGNlx1NkJCNVx1RkYwQ1x1NEUwRFx1NTIyMFx1NjVGNlx1NkJCNVx1RkYxQlx1NzUyOFx1NjIzN1x1NjBGM1x1NTZERVx1NTIzMFx1OTUwMVx1NjczQVx1NzJCNlx1NjAwMVx1NjVGNlx1NUY5N1xuICAgICAgICAvLyBcdTY3MDlcdTRFMkFcdTY2M0VcdTVGMEZcdTUxNjVcdTUzRTNcdUZGMENcdTU0MjZcdTUyMTlcdTUzRUFcdTgwRkRcdTdCNDlcdTUyMzBcdTY1RjZcdTZCQjVcdTdFRDNcdTY3NUZcdTYyMTZcdTUzQkJcdTY1MzlcdTY1RjZcdTZCQjVcdTkxNERcdTdGNkVcdTMwMDJcbiAgICAgICAgdGhpcy5sb2NrLnN1cHByZXNzZWRVbnRpbCA9IDA7XG4gICAgICAgIHRoaXMudGljayhhdCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcImNvbXBsZXRlRm9jdXNcIjoge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgdGhpcy5sb2NrLmFjdGl2ZSAhPT0gbnVsbCB8fFxuICAgICAgICAgIHRoaXMudGltZXIubW9kZSAhPT0gXCJmb2N1c1wiIHx8XG4gICAgICAgICAgdGhpcy50aW1lci5zdGFydGVkQXQgPT09IG51bGxcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU1RjUzXHU1MjREXHU2Q0ExXHU2NzA5XHU1M0VGXHU2M0QwXHU1MjREXHU1QjhDXHU2MjEwXHU3Njg0XHU0RTEzXHU2Q0U4XCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aW1lclJlbWFpbmluZyh0aGlzLnRpbWVyLCBhdCkgPT09IHRoaXMudGltZXIuZHVyYXRpb25TZWNzKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU1QzFBXHU2NUUwXHU0RTEzXHU2Q0U4XHU3NTI4XHU2NUY2XHVGRjBDXHU4QkY3XHU3QTBEXHU1NDBFXHU1MThEXHU1QjhDXHU2MjEwXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZmluaXNoVGltZXIoYXQsIGF0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwic2F2ZUxvY2tTY2hlZHVsZVwiOiB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5sb2NrLnNjaGVkdWxlcy5maW5kSW5kZXgoXG4gICAgICAgICAgKHMpID0+IHMuaWQgPT09IGFjdGlvbi5zY2hlZHVsZS5pZCxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICB0aGlzLmxvY2suc2NoZWR1bGVzW2luZGV4XSA9IGFjdGlvbi5zY2hlZHVsZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmxvY2suc2NoZWR1bGVzLnB1c2goYWN0aW9uLnNjaGVkdWxlKTtcbiAgICAgICAgfVxuICAgICAgICB2YWxpZGF0ZUxvY2sodGhpcy5sb2NrKTtcbiAgICAgICAgLy8gXHU1MkE4XHU2MjRCXHU2NTM5XHU2NUY2XHU2QkI1XHVGRjA4XHU1NDJCXHU1MTczXHU2Mzg5XHU1MThEXHU2MjUzXHU1RjAwXHVGRjA5XHU1QzMxXHU2NjJGXHU5MUNEXHU2NUIwXHU2QjY2XHU4OEM1XHVGRjFBXHU1MTQ4XHU2RTA1XHU2Mzg5XHU0RTBBXHU0RTAwXHU2QjIxXHUzMDBDXHU3RUQzXHU2NzVGXHU1RTc2XHU4OUUzXHU5NTAxXHUzMDBEXG4gICAgICAgIC8vIFx1NzU1OVx1NEUwQlx1NzY4NFx1NjI5MVx1NTIzNlx1RkYwQ1x1NTQyNlx1NTIxOSB0aWNrIFx1OTFDQ1x1NzY4NCBzY2hlZHVsZWRBdCBcdTRFQ0RcdTRGMUFcdTU2RTAgc3VwcHJlc3NlZFVudGlsIFx1OEZENFx1NTZERVxuICAgICAgICAvLyBudWxsXHUyMDE0XHUyMDE0XHU5ODc1XHU5NzYyXHU2NjNFXHU3OTNBXHUzMDBDXHU1REYyXHU1NDJGXHU3NTI4XHUzMDBEXHVGRjBDXHU1QjlFXHU5NjQ1XHU0RUMwXHU0RTQ4XHU5MEZEXHU0RTBEXHU0RjFBXHU1M0QxXHU3NTFGXHUzMDAyXG4gICAgICAgIHRoaXMubG9jay5zdXBwcmVzc2VkVW50aWwgPSAwO1xuICAgICAgICB0aGlzLnRpY2soYXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJkZWxldGVMb2NrU2NoZWR1bGVcIjpcbiAgICAgICAgdGhpcy5sb2NrLnNjaGVkdWxlcyA9IHRoaXMubG9jay5zY2hlZHVsZXMuZmlsdGVyKFxuICAgICAgICAgIChzKSA9PiBzLmlkICE9PSBhY3Rpb24uaWQsXG4gICAgICAgICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcInN0YXJ0UXVpY2tMb2NrXCI6IHtcbiAgICAgICAgaWYgKGFjdGlvbi5taW51dGVzIDwgMSB8fCBhY3Rpb24ubWludXRlcyA+IDcyMCkge1xuICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NUZFQlx1OTAxRlx1OTUwMVx1NjczQVx1NjVGNlx1OTU3Rlx1OTcwMFx1NEUzQSAxXHUyMDEzNzIwIFx1NTIwNlx1OTQ5RlwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlY29yZChhdCwgZmFsc2UpO1xuICAgICAgICB0aGlzLnJlc2V0VG8oXCJmb2N1c1wiKTtcbiAgICAgICAgdGhpcy5sb2NrLmFjdGl2ZSA9IHtcbiAgICAgICAgICBuYW1lOiBcIlx1NUMwRlx1NjFBOVwiLFxuICAgICAgICAgIHN0YXJ0ZWRBdDogYXQsXG4gICAgICAgICAgZW5kc0F0OiBhdCArIGFjdGlvbi5taW51dGVzICogNjAsXG4gICAgICAgICAgc3RyaWN0OiBhY3Rpb24uc3RyaWN0LFxuICAgICAgICB9O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJzYXZlVGFza1wiOiB7XG4gICAgICAgIGNvbnN0IGQgPSBhY3Rpb24udGFzaztcbiAgICAgICAgaWYgKGQuaWQgIT09IG51bGwgJiYgdGVhY2hpbmdUYXNrKHRoaXMsIGQuaWQpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXG4gICAgICAgICAgICBcIlx1NjU1OVx1NUI2Nlx1NUY4NVx1NTI5RVx1OTY4Rlx1OEJGRVx1N0EwQlx1NjIxNlx1NEY1Q1x1NEUxQVx1NUI4OVx1NjM5Mlx1NjZGNFx1NjVCMFx1RkYwQ1x1OEJGN1x1OEMwM1x1NjU3NFx1NUJGOVx1NUU5NFx1NjU1OVx1NUI2Nlx1NUI4OVx1NjM5MlwiLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhpc3RpbmdJbmRleCA9XG4gICAgICAgICAgZC5pZCAhPT0gbnVsbCA/IHRoaXMudGFza3MuZmluZEluZGV4KCh0KSA9PiB0LmlkID09PSBkLmlkKSA6IC0xO1xuICAgICAgICBpZiAoZC5pZCAhPT0gbnVsbCAmJiBleGlzdGluZ0luZGV4IDwgMCkge1xuICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NEVGQlx1NTJBMVx1NEUwRFx1NUI1OFx1NTcyOFx1RkYwQ1x1NTNFRlx1ODBGRFx1NURGMlx1N0VDRlx1ODhBQlx1NTIyMFx1OTY2NFwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvbGQgPSBleGlzdGluZ0luZGV4ID49IDAgPyB0aGlzLnRhc2tzW2V4aXN0aW5nSW5kZXhdISA6IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3QgdGFzazogVGFzayA9IHtcbiAgICAgICAgICB0ZW1wbGF0ZUlkOiBvbGQ/LnRlbXBsYXRlSWQgPz8gbnVsbCxcbiAgICAgICAgICByZWN1cnJpbmc6IG9sZD8ucmVjdXJyaW5nID8/IGZhbHNlLFxuICAgICAgICAgIGlkOiBkLmlkID8/IGlkKCksXG4gICAgICAgICAgdGl0bGU6IGQudGl0bGUudHJpbSgpLFxuICAgICAgICAgIG5vdGVzOiBkLm5vdGVzLFxuICAgICAgICAgIHByb2plY3RJZDogZC5wcm9qZWN0SWQsXG4gICAgICAgICAgaGFiaXRJZDogb2xkPy5oYWJpdElkID8/IG51bGwsXG4gICAgICAgICAgcmVtaW5kZXJGaXJlZDpcbiAgICAgICAgICAgIG9sZCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICBvbGQuZHVlRGF0ZSA9PT0gZC5kdWVEYXRlICYmXG4gICAgICAgICAgICBvbGQucmVtaW5kZXJUaW1lID09PSBkLnJlbWluZGVyVGltZSAmJlxuICAgICAgICAgICAgb2xkLnJlbWluZGVyRmlyZWQsXG4gICAgICAgICAgcmVtaW5kZXJQZW5kaW5nOlxuICAgICAgICAgICAgb2xkICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIG9sZC5kdWVEYXRlID09PSBkLmR1ZURhdGUgJiZcbiAgICAgICAgICAgIG9sZC5yZW1pbmRlclRpbWUgPT09IGQucmVtaW5kZXJUaW1lICYmXG4gICAgICAgICAgICBvbGQucmVtaW5kZXJQZW5kaW5nLFxuICAgICAgICAgIHJlbWluZGVyRXhwaXJlZDpcbiAgICAgICAgICAgIG9sZCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICBvbGQuZHVlRGF0ZSA9PT0gZC5kdWVEYXRlICYmXG4gICAgICAgICAgICBvbGQucmVtaW5kZXJUaW1lID09PSBkLnJlbWluZGVyVGltZSAmJlxuICAgICAgICAgICAgb2xkLnJlbWluZGVyRXhwaXJlZCxcbiAgICAgICAgICBzY3JhcE1pbnV0ZXM6IGQuc2NyYXBNaW51dGVzLFxuICAgICAgICAgIGZvY3VzTWludXRlczogZC5mb2N1c01pbnV0ZXMsXG4gICAgICAgICAgcmVtaW5kZXJUaW1lOiBkLnJlbWluZGVyVGltZSxcbiAgICAgICAgICBkdWVEYXRlOiBkLmR1ZURhdGUsXG4gICAgICAgICAgcHJpb3JpdHk6IGQucHJpb3JpdHksXG4gICAgICAgICAgZXN0aW1hdGU6IGQuZXN0aW1hdGUsXG4gICAgICAgICAgY29tcGxldGVkOiBvbGQ/LmNvbXBsZXRlZCA/PyBmYWxzZSxcbiAgICAgICAgICBjb21wbGV0ZWRBdDogb2xkPy5jb21wbGV0ZWRBdCA/PyBudWxsLFxuICAgICAgICAgIGNyZWF0ZWRBdDogb2xkPy5jcmVhdGVkQXQgPz8gYXQsXG4gICAgICAgICAgdGFnczogZC50YWdzLm1hcCgodCkgPT4gdC50cmltKCkpLmZpbHRlcigodCkgPT4gdC5sZW5ndGggPiAwKSxcbiAgICAgICAgICBzdWJ0YXNrczogZC5zdWJ0YXNrcy5tYXAoKHMpID0+ICh7XG4gICAgICAgICAgICBpZDogcy5pZCxcbiAgICAgICAgICAgIHRpdGxlOiBzLnRpdGxlLFxuICAgICAgICAgICAgZG9uZTogcy5kb25lLFxuICAgICAgICAgIH0pKSxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGQucmVwZWF0ICE9PSBcIm5vbmVcIikge1xuICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZnJvbVRhc2sodGFzaywgZC5yZXBlYXQsIGF0KTtcbiAgICAgICAgICB0YXNrLnRlbXBsYXRlSWQgPSB0ZW1wbGF0ZS5pZDtcbiAgICAgICAgICB0YXNrLnJlY3VycmluZyA9IHRydWU7XG4gICAgICAgICAgdGhpcy5wcmludHMucHVzaCh7IHRlbXBsYXRlSWQ6IHRlbXBsYXRlLmlkLCBkYXRlOiB0YXNrLmR1ZURhdGUgfSk7XG4gICAgICAgICAgdGhpcy50ZW1wbGF0ZXMucHVzaCh0ZW1wbGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV4aXN0aW5nSW5kZXggPj0gMCkge1xuICAgICAgICAgIHRoaXMudGFza3NbZXhpc3RpbmdJbmRleF0gPSB0YXNrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudGFza3MucHVzaCh0YXNrKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJ0b2dnbGVUYXNrXCI6IHtcbiAgICAgICAgY29uc3QgdGFza0lkID0gYWN0aW9uLmlkO1xuICAgICAgICBpZiAodGhpcy50YXNrcy5zb21lKCh0KSA9PiB0LmlkID09PSB0YXNrSWQgJiYgdGhpcy50YXNrSXNWb2lkKHQpKSkge1xuICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NEY1Q1x1NUU5Rlx1NUI5RVx1NEY4Qlx1NEUwRFx1ODBGRFx1NUI4Q1x1NjIxMFwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0YXNrID0gdGhpcy50YXNrcy5maW5kKCh0KSA9PiB0LmlkID09PSB0YXNrSWQpO1xuICAgICAgICBlbnN1cmUodGFzayAhPT0gdW5kZWZpbmVkLCBcIlx1NEVGQlx1NTJBMVx1NEUwRFx1NUI1OFx1NTcyOFwiKTtcbiAgICAgICAgY29uc3QgdGFza0NvcHk6IFRhc2sgPSB7XG4gICAgICAgICAgLi4udGFzayxcbiAgICAgICAgICB0YWdzOiBbLi4udGFzay50YWdzXSxcbiAgICAgICAgICBzdWJ0YXNrczogdGFzay5zdWJ0YXNrcy5tYXAoKHMpID0+ICh7IC4uLnMgfSkpLFxuICAgICAgICB9O1xuICAgICAgICBpZiAodGVhY2hpbmdUYXNrKHRoaXMsIHRhc2tJZCkgIT09IHVuZGVmaW5lZCAmJiAhdGFza0NvcHkuY29tcGxldGVkKSB7XG4gICAgICAgICAgY29tcGxldGVUZWFjaGluZ1Rhc2sodGhpcywgdGFza0lkLCBhdCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gXHU3RUQzXHU3Qjk3XHU1QkY5XHU2QkQ0XHU1MjREXHU1MTQ4XHU3RUQzXHU2RTA1XHU2NzJDXHU0RUZCXHU1MkExXHU4QkExXHU2NUY2XHVGRjBDXHU5MDdGXHU1MTREXHU5MUNEXHU1OTBEXHU3RDJGXHU4QkExXHUzMDAyXG4gICAgICAgIGlmICghdGFza0NvcHkuY29tcGxldGVkICYmIHRoaXMudGltZXIudGFza0lkID09PSB0YXNrSWQpIHtcbiAgICAgICAgICBjb25zdCBmb2N1c2luZyA9IHRoaXMudGltZXIubW9kZSA9PT0gXCJmb2N1c1wiO1xuICAgICAgICAgIGlmIChmb2N1c2luZykge1xuICAgICAgICAgICAgdGhpcy5yZWNvcmQoYXQsIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy50aW1lci50YXNrSWQgPSBudWxsO1xuICAgICAgICAgIGlmIChmb2N1c2luZykge1xuICAgICAgICAgICAgdGhpcy5yZXNldFRvKFwiZm9jdXNcIik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudGltZXIuYXV0b0ZvY3VzQmxvY2tlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2Vzc2lvbnMgPSB0aGlzLnNlc3Npb25zLmZpbHRlcihcbiAgICAgICAgICAocykgPT4gIShzLnNvdXJjZSA9PT0gXCJ0YXNrRXN0aW1hdGVcIiAmJiBzLnRhc2tJZCA9PT0gdGFza0lkKSxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKCF0YXNrQ29weS5jb21wbGV0ZWQpIHtcbiAgICAgICAgICBjb25zdCBhY3R1YWwgPSB0aGlzLnNlc3Npb25zXG4gICAgICAgICAgICAuZmlsdGVyKChzKSA9PiBzLnRhc2tJZCA9PT0gdGFza0lkKVxuICAgICAgICAgICAgLnJlZHVjZSgobiwgcykgPT4gbiArIHMuZHVyYXRpb25TZWNzLCAwKTtcbiAgICAgICAgICBjb25zdCBleHBlY3RlZCA9XG4gICAgICAgICAgICB0YXNrQ29weS5lc3RpbWF0ZSAqXG4gICAgICAgICAgICAodGFza0NvcHkuZm9jdXNNaW51dGVzID8/IHRoaXMuc2V0dGluZ3MuZm9jdXNNaW51dGVzKSAqXG4gICAgICAgICAgICA2MDtcbiAgICAgICAgICBjb25zdCBtaXNzaW5nID0gTWF0aC5tYXgoMCwgZXhwZWN0ZWQgLSBhY3R1YWwpO1xuICAgICAgICAgIGlmIChtaXNzaW5nID4gMCkge1xuICAgICAgICAgICAgY29uc3QgcHJvamVjdCA9XG4gICAgICAgICAgICAgIHRhc2tDb3B5LnByb2plY3RJZCAhPT0gbnVsbFxuICAgICAgICAgICAgICAgID8gdGhpcy5wcm9qZWN0cy5maW5kKChwKSA9PiBwLmlkID09PSB0YXNrQ29weS5wcm9qZWN0SWQpXG4gICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLnNlc3Npb25zLnB1c2goe1xuICAgICAgICAgICAgICBpZDogaWQoKSxcbiAgICAgICAgICAgICAgc291cmNlOiBcInRhc2tFc3RpbWF0ZVwiLFxuICAgICAgICAgICAgICB0YXNrSWQsXG4gICAgICAgICAgICAgIHRhc2tUaXRsZTogdGFza0NvcHkudGl0bGUsXG4gICAgICAgICAgICAgIHByb2plY3ROYW1lOiBwcm9qZWN0Py5uYW1lID8/IFwiXHU2NzJBXHU1MjA2XHU3QzdCXCIsXG4gICAgICAgICAgICAgIHN0YXJ0ZWRBdDogYXQsXG4gICAgICAgICAgICAgIGVuZGVkQXQ6IGF0LFxuICAgICAgICAgICAgICBkdXJhdGlvblNlY3M6IG1pc3NpbmcsXG4gICAgICAgICAgICAgIGNvbXBsZXRlZDogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdCA9IHRoaXMudGFza3MuZmluZCgoeCkgPT4geC5pZCA9PT0gdGFza0lkKSE7XG4gICAgICAgIHQuY29tcGxldGVkID0gIXQuY29tcGxldGVkO1xuICAgICAgICB0LmNvbXBsZXRlZEF0ID0gdC5jb21wbGV0ZWQgPyBhdCA6IG51bGw7XG4gICAgICAgIGlmICh0LmNvbXBsZXRlZCkge1xuICAgICAgICAgIHRoaXMuZWR1Y2F0aW9uLnRhc2tDb21wbGV0ZWQodCwgYXQpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcImRlbGV0ZVRhc2tcIjoge1xuICAgICAgICBpZiAodGVhY2hpbmdUYXNrKHRoaXMsIGFjdGlvbi5pZCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NjU1OVx1NUI2Nlx1NUY4NVx1NTI5RVx1NzUzMVx1NUJGOVx1NUU5NFx1OEJGRVx1N0EwQlx1NjIxNlx1NEY1Q1x1NEUxQVx1N0VGNFx1NjJBNFx1RkYwQ1x1NEUwRFx1ODBGRFx1NTM1NVx1NzJFQ1x1NTIyMFx1OTY2NFwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMudGFza3Muc29tZSgodCkgPT4gdC5pZCA9PT0gYWN0aW9uLmlkKSkge1xuICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NEVGQlx1NTJBMVx1NEUwRFx1NUI1OFx1NTcyOFwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy50aW1lci50YXNrSWQgPT09IGFjdGlvbi5pZCkge1xuICAgICAgICAgIHRoaXMucmVjb3JkKGF0LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5yZXNldFRvKHRoaXMudGltZXIubW9kZSk7XG4gICAgICAgICAgdGhpcy50aW1lci50YXNrSWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGFza3MgPSB0aGlzLnRhc2tzLmZpbHRlcigodCkgPT4gdC5pZCAhPT0gYWN0aW9uLmlkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwicmVzdG9yZVRhc2tcIjoge1xuICAgICAgICBjb25zdCB0YXNrID0gYWN0aW9uLnRhc2s7XG4gICAgICAgIGlmICh0aGlzLnRhc2tzLnNvbWUoKHQpID0+IHQuaWQgPT09IHRhc2suaWQpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU0RUZCXHU1MkExXHU1REYyXHU3RUNGXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcbiAgICAgICAgICB0YXNrLnByb2plY3RJZCAhPT0gbnVsbCAmJlxuICAgICAgICAgICF0aGlzLnByb2plY3RzLnNvbWUoKHApID0+IHAuaWQgPT09IHRhc2sucHJvamVjdElkKVxuICAgICAgICApIHtcbiAgICAgICAgICB0YXNrLnByb2plY3RJZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFxuICAgICAgICAgIHRhc2sudGVtcGxhdGVJZCAhPT0gbnVsbCAmJlxuICAgICAgICAgICF0aGlzLnRlbXBsYXRlcy5zb21lKCh0KSA9PiB0LmlkID09PSB0YXNrLnRlbXBsYXRlSWQpXG4gICAgICAgICkge1xuICAgICAgICAgIHRhc2sudGVtcGxhdGVJZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFxuICAgICAgICAgIHRhc2suaGFiaXRJZCAhPT0gbnVsbCAmJlxuICAgICAgICAgICF0aGlzLmhhYml0cy5zb21lKChoKSA9PiBoLmlkID09PSB0YXNrLmhhYml0SWQpXG4gICAgICAgICkge1xuICAgICAgICAgIC8vIFx1NTkzMVx1NTNCQlx1NUJCOVx1NTY2OFx1NTNFQVx1NzlGQlx1OTY2NFx1N0JBMVx1OEY5Nlx1RkYxQlx1NTFCQlx1N0VEM1x1Njc2NVx1NkU5MFx1NEVDRFx1NTcyOFx1RkYwQ1x1NTM4Nlx1NTNGMlx1NTIwNlx1N0M3Qlx1NEUwRFx1NTNEOFx1MzAwMlxuICAgICAgICAgIHRhc2suaGFiaXRJZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50YXNrcy5wdXNoKHRhc2spO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJ0b2dnbGVTdWJ0YXNrXCI6IHtcbiAgICAgICAgY29uc3Qgc3ViID0gdGhpcy50YXNrc1xuICAgICAgICAgIC5maW5kKCh0KSA9PiB0LmlkID09PSBhY3Rpb24udGFza0lkKVxuICAgICAgICAgID8uc3VidGFza3MuZmluZCgocykgPT4gcy5pZCA9PT0gYWN0aW9uLnN1YnRhc2tJZCk7XG4gICAgICAgIGVuc3VyZShzdWIgIT09IHVuZGVmaW5lZCwgXCJcdTVCNTBcdTRFRkJcdTUyQTFcdTRFMERcdTVCNThcdTU3MjhcIik7XG4gICAgICAgIHN1Yi5kb25lID0gIXN1Yi5kb25lO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJzYXZlUHJvamVjdFwiOiB7XG4gICAgICAgIGlmIChhY3Rpb24uaWQgIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zdCBwID0gdGhpcy5wcm9qZWN0cy5maW5kKCh4KSA9PiB4LmlkID09PSBhY3Rpb24uaWQpO1xuICAgICAgICAgIGVuc3VyZShwICE9PSB1bmRlZmluZWQsIFwiXHU5ODc5XHU3NkVFXHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICAgIHAubmFtZSA9IGFjdGlvbi5uYW1lLnRyaW0oKTtcbiAgICAgICAgICBwLmNvbG9yID0gYWN0aW9uLmNvbG9yO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVuc3VyZShcbiAgICAgICAgICAgIGFjdGlvbi5kaXJlY3RvcnkgIT09IG51bGwgJiYgaXNBYnNvbHV0ZVBhdGgoYWN0aW9uLmRpcmVjdG9yeSksXG4gICAgICAgICAgICBcIlx1NjVCMFx1OTg3OVx1NzZFRVx1NUZDNVx1OTg3Qlx1N0VEMVx1NUI5QVx1OEQ0NFx1NjU5OVx1NzZFRVx1NUY1NVx1RkYxQlx1OEJGN1x1NTcyOFx1OTg3OVx1NzZFRVx1OTg3NVx1OTAwOVx1NjJFOVx1NzZFRVx1NUY1NVx1NUU3Nlx1NjM4OFx1Njc0M1wiLFxuICAgICAgICAgICk7XG4gICAgICAgICAgY29uc3QgcHJvamVjdElkID0gaWQoKTtcbiAgICAgICAgICB0aGlzLmVkdWNhdGlvbi5wcm9qZWN0cy5wdXNoKHtcbiAgICAgICAgICAgIHByb2plY3RJZCxcbiAgICAgICAgICAgIGRpcmVjdG9yeTogYWN0aW9uLmRpcmVjdG9yeSxcbiAgICAgICAgICAgIGV4YW1Nb2RlOiBmYWxzZSxcbiAgICAgICAgICAgIHZpc2lvbklkOiBudWxsLFxuICAgICAgICAgICAgdGFyZ2V0OiBcIlwiLFxuICAgICAgICAgICAgZXhhbURhdGU6IG51bGwsXG4gICAgICAgICAgICBzeWxsYWJ1c0lkOiBudWxsLFxuICAgICAgICAgICAgcGFzdFBhcGVySWRzOiBbXSxcbiAgICAgICAgICAgIG1vY2tQYXBlcklkczogW10sXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5wcm9qZWN0cy5wdXNoKHtcbiAgICAgICAgICAgIGlkOiBwcm9qZWN0SWQsXG4gICAgICAgICAgICBuYW1lOiBhY3Rpb24ubmFtZS50cmltKCksXG4gICAgICAgICAgICBjb2xvcjogYWN0aW9uLmNvbG9yLFxuICAgICAgICAgICAgYXBwV2hpdGVsaXN0OiBudWxsLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInJlbmFtZVByb2plY3REaXJlY3RvcnlcIjoge1xuICAgICAgICBjb25zdCBwcm9qZWN0ID0gdGhpcy5wcm9qZWN0cy5maW5kKCh4KSA9PiB4LmlkID09PSBhY3Rpb24uaWQpO1xuICAgICAgICBlbnN1cmUocHJvamVjdCAhPT0gdW5kZWZpbmVkLCBcIlx1OTg3OVx1NzZFRVx1NEUwRFx1NUI1OFx1NTcyOFwiKTtcbiAgICAgICAgY29uc3QgcHJvZmlsZSA9IHRoaXMuZWR1Y2F0aW9uLnByb2plY3RzLmZpbmQoXG4gICAgICAgICAgKHApID0+IHAucHJvamVjdElkID09PSBhY3Rpb24uaWQsXG4gICAgICAgICk7XG4gICAgICAgIGVuc3VyZShwcm9maWxlICE9PSB1bmRlZmluZWQsIFwiXHU5ODc5XHU3NkVFXHU2Q0ExXHU2NzA5XHU3RUQxXHU1QjlBXHU4RDQ0XHU2NTk5XHU3NkVFXHU1RjU1XCIpO1xuICAgICAgICBlbnN1cmUoaXNBYnNvbHV0ZVBhdGgoYWN0aW9uLmRpcmVjdG9yeSksIFwiXHU4RDQ0XHU2NTk5XHU3NkVFXHU1RjU1XHU1RkM1XHU5ODdCXHU2NjJGXHU3RUREXHU1QkY5XHU4REVGXHU1Rjg0XCIpO1xuICAgICAgICBwcm9qZWN0Lm5hbWUgPSBhY3Rpb24ubmFtZS50cmltKCk7XG4gICAgICAgIHByb2plY3QuY29sb3IgPSBhY3Rpb24uY29sb3I7XG4gICAgICAgIHByb2ZpbGUuZGlyZWN0b3J5ID0gYWN0aW9uLmRpcmVjdG9yeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwic2V0UHJvamVjdFdoaXRlbGlzdFwiOiB7XG4gICAgICAgIGNvbnN0IHAgPSB0aGlzLnByb2plY3RzLmZpbmQoKHgpID0+IHguaWQgPT09IGFjdGlvbi5pZCk7XG4gICAgICAgIGVuc3VyZShwICE9PSB1bmRlZmluZWQsIFwiXHU5ODc5XHU3NkVFXHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICBwLmFwcFdoaXRlbGlzdCA9XG4gICAgICAgICAgYWN0aW9uLndoaXRlbGlzdCA9PT0gbnVsbCA/IG51bGwgOiBbLi4uYWN0aW9uLndoaXRlbGlzdF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcImRlbGV0ZVByb2plY3RcIjoge1xuICAgICAgICBpZiAodGhpcy5lZHVjYXRpb24uc2VtZXN0ZXJzLnNvbWUoKHMpID0+IHMucHJvamVjdElkID09PSBhY3Rpb24uaWQpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFxuICAgICAgICAgICAgXCJcdTk4NzlcdTc2RUVcdTVERjJcdTY3MDlcdTY1NTlcdTVCNjZcdTUzODZcdTUzRjJcdUZGMENcdThCRjdcdTRGRERcdTc1NTlcdThCQjBcdTVGNTVcdTVFNzZcdTUwNUNcdTc1MjhcdTVFOTRcdThCRDVcdTZBMjFcdTVGMEZcdUZGMUJcdThENDRcdTY1OTlcdTc2RUVcdTVGNTVcdTRFMERcdTRGMUFcdTg4QUJcdTUyMjBcdTk2NjRcIixcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZWR1Y2F0aW9uLnByb2plY3RzID0gdGhpcy5lZHVjYXRpb24ucHJvamVjdHMuZmlsdGVyKFxuICAgICAgICAgIChwKSA9PiBwLnByb2plY3RJZCAhPT0gYWN0aW9uLmlkLFxuICAgICAgICApO1xuICAgICAgICB0aGlzLmVkdWNhdGlvbi5yZXNvdXJjZXMgPSB0aGlzLmVkdWNhdGlvbi5yZXNvdXJjZXMuZmlsdGVyKFxuICAgICAgICAgIChwKSA9PiBwLnByb2plY3RJZCAhPT0gYWN0aW9uLmlkLFxuICAgICAgICApO1xuICAgICAgICB0aGlzLnByb2plY3RzID0gdGhpcy5wcm9qZWN0cy5maWx0ZXIoKHApID0+IHAuaWQgIT09IGFjdGlvbi5pZCk7XG4gICAgICAgIGZvciAoY29uc3QgdGFzayBvZiB0aGlzLnRhc2tzKSB7XG4gICAgICAgICAgaWYgKHRhc2sucHJvamVjdElkID09PSBhY3Rpb24uaWQpIHRhc2sucHJvamVjdElkID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IHRlbXBsYXRlIG9mIHRoaXMudGVtcGxhdGVzKSB7XG4gICAgICAgICAgaWYgKHRlbXBsYXRlLnNoYXBlLnByb2plY3RJZCA9PT0gYWN0aW9uLmlkKVxuICAgICAgICAgICAgdGVtcGxhdGUuc2hhcGUucHJvamVjdElkID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZpc2lvbnMgPSB0aGlzLnZpc2lvbnMuZmlsdGVyKChhKSA9PiBhLnByb2plY3RJZCAhPT0gYWN0aW9uLmlkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwicmVvcmRlclByb2plY3RzXCI6IHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGFjdGlvbi5pZHMubGVuZ3RoICE9PSB0aGlzLnByb2plY3RzLmxlbmd0aCB8fFxuICAgICAgICAgICFhY3Rpb24uaWRzLmV2ZXJ5KChwaWQpID0+IHRoaXMucHJvamVjdHMuc29tZSgocCkgPT4gcC5pZCA9PT0gcGlkKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU5ODc5XHU3NkVFXHU2MzkyXHU1RThGXHU1MjE3XHU4ODY4XHU0RTBFXHU3M0IwXHU2NzA5XHU5ODc5XHU3NkVFXHU0RTBEXHU0RTAwXHU4MUY0XCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucHJvamVjdHMgPSBhY3Rpb24uaWRzLm1hcCgocGlkKSA9PlxuICAgICAgICAgIHRoaXMucHJvamVjdHMuZmluZCgocCkgPT4gcC5pZCA9PT0gcGlkKSEsXG4gICAgICAgICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcImRldGFjaFRhc2tzXCI6IHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGFjdGlvbi5pZHMuc29tZSgodGFza0lkKSA9PiB0ZWFjaGluZ1Rhc2sodGhpcywgdGFza0lkKSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTY1NTlcdTVCNjZcdTVGODVcdTUyOUVcdTk4N0JcdTRGRERcdTc1NTlcdTY3NjVcdTZFOTBcdTk4NzlcdTc2RUVcdUZGMENcdThCRjdcdThDMDNcdTY1NzRcdTVCRjlcdTVFOTRcdTY1NTlcdTVCNjZcdTVCODlcdTYzOTJcIik7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCB0IG9mIHRoaXMudGFza3MpIHtcbiAgICAgICAgICBpZiAoYWN0aW9uLmlkcy5pbmNsdWRlcyh0LmlkKSkge1xuICAgICAgICAgICAgaWYgKGFjdGlvbi50YXJnZXQgPT09IFwicHJvamVjdFwiKSB0LnByb2plY3RJZCA9IG51bGw7XG4gICAgICAgICAgICBlbHNlIHQuaGFiaXRJZCA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInNhdmVIYWJpdEdyb3VwXCI6IHtcbiAgICAgICAgaWYgKGFjdGlvbi5pZCAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IGggPSB0aGlzLmhhYml0cy5maW5kKCh4KSA9PiB4LmlkID09PSBhY3Rpb24uaWQpO1xuICAgICAgICAgIGVuc3VyZShoICE9PSB1bmRlZmluZWQsIFwiXHU0RTYwXHU2MEVGXHU3RUM0XHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICAgIGgubmFtZSA9IGFjdGlvbi5uYW1lLnRyaW0oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmhhYml0cy5wdXNoKHsgaWQ6IGlkKCksIG5hbWU6IGFjdGlvbi5uYW1lLnRyaW0oKSB9KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJzYXZlSGFiaXRcIjoge1xuICAgICAgICBjb25zdCBoaWQgPSBhY3Rpb24uaWQgPz8gaWQoKTtcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmhhYml0cy5maW5kKChoKSA9PiBoLmlkID09PSBoaWQpO1xuICAgICAgICBpZiAoZXhpc3RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGV4aXN0aW5nLm5hbWUgPSBhY3Rpb24ubmFtZS50cmltKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5oYWJpdHMucHVzaCh7IGlkOiBoaWQsIG5hbWU6IGFjdGlvbi5uYW1lLnRyaW0oKSB9KTtcbiAgICAgICAgfVxuICAgICAgICBzYXZlVGVtcGxhdGUodGhpcywge1xuICAgICAgICAgIGlkOiBgaGFiaXQ6JHtoaWR9YCxcbiAgICAgICAgICBhdXRvbWF0aWM6IHRydWUsXG4gICAgICAgICAgcHJpbnRBaGVhZERheXM6IDAsXG4gICAgICAgICAgcHJpbnRpbmc6IHtcbiAgICAgICAgICAgIGtpbmQ6IFwid2Vla2x5XCIsXG4gICAgICAgICAgICBzbG90czogYWN0aW9uLnNsb3RzLm1hcCgocykgPT4gKHtcbiAgICAgICAgICAgICAgZGF5czogWy4uLnMuZGF5c10sXG4gICAgICAgICAgICAgIHRpbWU6IHMudGltZSxcbiAgICAgICAgICAgIH0pKSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNoYXBlOiB7XG4gICAgICAgICAgICB0aXRsZTogYWN0aW9uLm5hbWUudHJpbSgpLFxuICAgICAgICAgICAgbm90ZXM6IFwiXCIsXG4gICAgICAgICAgICBwcm9qZWN0SWQ6IGFjdGlvbi5wcm9qZWN0SWQsXG4gICAgICAgICAgICBoYWJpdElkOiBoaWQsXG4gICAgICAgICAgICBmb2N1c01pbnV0ZXM6IGFjdGlvbi5mb2N1c01pbnV0ZXMsXG4gICAgICAgICAgICBzY3JhcE1pbnV0ZXM6IDAsXG4gICAgICAgICAgICBwcmlvcml0eTogMCxcbiAgICAgICAgICAgIGVzdGltYXRlOiAxLFxuICAgICAgICAgICAgdGFnczogW10sXG4gICAgICAgICAgICBzdWJ0YXNrczogW10sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcImRlbGV0ZUhhYml0XCI6IHtcbiAgICAgICAgY29uc3QgdGlkcyA9IHRoaXMudGVtcGxhdGVzXG4gICAgICAgICAgLmZpbHRlcigodCkgPT4gdC5zaGFwZS5oYWJpdElkID09PSBhY3Rpb24uaWQpXG4gICAgICAgICAgLm1hcCgodCkgPT4gdC5pZCk7XG4gICAgICAgIGZvciAoY29uc3QgdGlkIG9mIHRpZHMpIHtcbiAgICAgICAgICBkZWxldGVUZW1wbGF0ZSh0aGlzLCB0aWQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaGFiaXRzID0gdGhpcy5oYWJpdHMuZmlsdGVyKChoKSA9PiBoLmlkICE9PSBhY3Rpb24uaWQpO1xuICAgICAgICAvLyBcdTY1RTJcdTY3MDlcdTVCOUVcdTRGOEJcdTRGRERcdTc1NTlcdTUxQkJcdTdFRDNcdTY3NjVcdTZFOTBcdUZGMUFcdTc5RkJcdTk2NjRcdTUyMDZcdTdFQzRcdTUzRUFcdTZFMDVcdTVGMTVcdTc1MjhcdUZGMENcdTUzODZcdTUzRjJcdTdGM0FcdTUyRTRcdTRFQ0RcdThCQTFcdTUxNjVcdTdFREZcdThCQTFcdTMwMDJcbiAgICAgICAgZm9yIChjb25zdCB0YXNrIG9mIHRoaXMudGFza3MpIHtcbiAgICAgICAgICBpZiAodGFzay5oYWJpdElkID09PSBhY3Rpb24uaWQpIHRhc2suaGFiaXRJZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwic2F2ZVZpc2lvblwiOiB7XG4gICAgICAgIGlmIChhY3Rpb24uaWQgIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zdCBhID0gdGhpcy52aXNpb25zLmZpbmQoKHgpID0+IHguaWQgPT09IGFjdGlvbi5pZCk7XG4gICAgICAgICAgZW5zdXJlKGEgIT09IHVuZGVmaW5lZCwgXCJcdTYxM0ZcdTY2NkZcdTRFMERcdTVCNThcdTU3MjhcIik7XG4gICAgICAgICAgYS5uYW1lID0gYWN0aW9uLm5hbWUudHJpbSgpO1xuICAgICAgICAgIGEubm90ZXMgPSBhY3Rpb24ubm90ZXM7XG4gICAgICAgICAgYS5wcm9qZWN0SWQgPSBhY3Rpb24ucHJvamVjdElkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudmlzaW9ucy5wdXNoKHtcbiAgICAgICAgICAgIGlkOiBpZCgpLFxuICAgICAgICAgICAgbmFtZTogYWN0aW9uLm5hbWUudHJpbSgpLFxuICAgICAgICAgICAgbm90ZXM6IGFjdGlvbi5ub3RlcyxcbiAgICAgICAgICAgIHByb2plY3RJZDogYWN0aW9uLnByb2plY3RJZCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJkZWxldGVWaXNpb25cIjpcbiAgICAgICAgdGhpcy52aXNpb25zID0gdGhpcy52aXNpb25zLmZpbHRlcigoYSkgPT4gYS5pZCAhPT0gYWN0aW9uLmlkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwic2F2ZUJsb2NrXCI6IHtcbiAgICAgICAgY29uc3QgYmxvY2s6IEJsb2NrID0ge1xuICAgICAgICAgIGlkOiBhY3Rpb24uaWQgPz8gaWQoKSxcbiAgICAgICAgICB0aXRsZTogYWN0aW9uLnRpdGxlLnRyaW0oKSxcbiAgICAgICAgICBkYXlzOiBbLi4uYWN0aW9uLmRheXNdLFxuICAgICAgICAgIHN0YXJ0OiBhY3Rpb24uc3RhcnQsXG4gICAgICAgICAgZW5kOiBhY3Rpb24uZW5kLFxuICAgICAgICAgIGF0dGVudGlvbjogYWN0aW9uLmF0dGVudGlvbixcbiAgICAgICAgICBub3RlczogYWN0aW9uLm5vdGVzLFxuICAgICAgICB9O1xuICAgICAgICAvLyBcdTUxNDhcdTY4MjFcdTlBOENcdUZGMENcdTU3NEZcdTdGMTZcdThGOTFcdTYyQTVcdTgxRUFcdTVERjFcdTc2ODRcdTUzOUZcdTU2RTBcdTgwMENcdTRFMERcdTY2MkZcdTdCM0NcdTdFREZcdTc2ODRcdTUxNjhcdTkxQ0ZcdTU5MzFcdThEMjVcdTMwMDJcbiAgICAgICAgdmFsaWRhdGVCbG9jayhibG9jayk7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5ibG9ja3MuZmluZEluZGV4KChiKSA9PiBiLmlkID09PSBibG9jay5pZCk7XG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgdGhpcy5ibG9ja3NbaW5kZXhdID0gYmxvY2s7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5ibG9ja3MucHVzaChibG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwiZGVsZXRlQmxvY2tcIjpcbiAgICAgICAgdGhpcy5ibG9ja3MgPSB0aGlzLmJsb2Nrcy5maWx0ZXIoKGIpID0+IGIuaWQgIT09IGFjdGlvbi5pZCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcInNlbGVjdFRhc2tcIjoge1xuICAgICAgICBpZiAodGhpcy50YXNrcy5zb21lKCh0KSA9PiB0LmlkID09PSBhY3Rpb24uaWQgJiYgdGhpcy50YXNrSXNWb2lkKHQpKSkge1xuICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NEY1Q1x1NUU5Rlx1NUI5RVx1NEY4Qlx1NEUwRFx1ODBGRFx1NEUxM1x1NkNFOFwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXG4gICAgICAgICAgYWN0aW9uLmlkICE9PSBudWxsICYmXG4gICAgICAgICAgIXRoaXMudGFza3Muc29tZSgodCkgPT4gdC5pZCA9PT0gYWN0aW9uLmlkICYmICF0LmNvbXBsZXRlZClcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4QkY3XHU5MDA5XHU2MkU5XHU0RTAwXHU0RTJBXHU2NzJBXHU1QjhDXHU2MjEwXHU3Njg0XHU0RUZCXHU1MkExXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcbiAgICAgICAgICB0aGlzLnRpbWVyLnJ1bm5pbmcgfHxcbiAgICAgICAgICB0aW1lclJlbWFpbmluZyh0aGlzLnRpbWVyLCBhdCkgPCB0aGlzLnRpbWVyLmR1cmF0aW9uU2Vjc1xuICAgICAgICApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdThCRjdcdTUxNDhcdTdFRDNcdTY3NUZcdTVGNTNcdTUyNERcdThCQTFcdTY1RjZcdUZGMENcdTUxOERcdTUyMDdcdTYzNjJcdTRFMTNcdTZDRThcdTRFRkJcdTUyQTFcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50aW1lci50YXNrSWQgPSBhY3Rpb24uaWQ7XG4gICAgICAgIHRoaXMucmVzZXRUbyh0aGlzLnRpbWVyLm1vZGUpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJzdGFydFRpbWVyXCI6IHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHRoaXMudGFza3Muc29tZShcbiAgICAgICAgICAgICh0KSA9PiB0LmlkID09PSB0aGlzLnRpbWVyLnRhc2tJZCAmJiB0aGlzLnRhc2tJc1ZvaWQodCksXG4gICAgICAgICAgKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTRGNUNcdTVFOUZcdTVCOUVcdTRGOEJcdTRFMERcdTgwRkRcdTVGMDBcdTU5Q0JcdTRFMTNcdTZDRThcIik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb3ZlcnJpZGUgPVxuICAgICAgICAgIGFjdGlvbi5taW51dGVzICE9PSB1bmRlZmluZWQgJiYgYWN0aW9uLm1pbnV0ZXMgIT09IG51bGxcbiAgICAgICAgICAgID8gYWN0aW9uLm1pbnV0ZXNcbiAgICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgaWYgKG92ZXJyaWRlICE9PSBudWxsKSB7XG4gICAgICAgICAgLy8gXHU1MzU1XHU2QjIxXHU2NUY2XHU5NTdGXHU4OTg2XHU3NkQ2XHVGRjFBXHU3RjUxXHU5ODc1L1x1NjVFNyBydW50aW1lIFx1NTE0MVx1OEJCOFx1NEUzNFx1NjVGNlx1NjMwN1x1NUI5QVx1NjcyQ1x1OEY2RVx1NTIwNlx1OTQ5Rlx1NjU3MFx1RkYwQ1x1NEUwRFx1NTE5OVx1NTZERVx1NEVGQlx1NTJBMVx1NjIxNlxuICAgICAgICAgIC8vIFx1NTE2OFx1NUM0MFx1OEJCRVx1N0Y2RVx1RkYxQlx1NTNFQVx1NjcwOVx1NUMxQVx1NjcyQVx1NUYwMFx1NTlDQlx1NzY4NFx1NEUxM1x1NkNFOFx1NkJCNVx1NTNFRlx1ODk4Nlx1NzZENlx1MzAwMlxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMudGltZXIubW9kZSAhPT0gXCJmb2N1c1wiIHx8XG4gICAgICAgICAgICB0aGlzLnRpbWVyLnJ1bm5pbmcgfHxcbiAgICAgICAgICAgIHRoaXMudGltZXIuc3RhcnRlZEF0ICE9PSBudWxsXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTUzRUFcdTY3MDlcdTVDMUFcdTY3MkFcdTVGMDBcdTU5Q0JcdTc2ODRcdTRFMTNcdTZDRThcdTUzRUZcdTRFRTVcdTYzMDdcdTVCOUFcdTUzNTVcdTZCMjFcdTY1RjZcdTk1N0ZcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihvdmVycmlkZSkgfHwgb3ZlcnJpZGUgPCAxIHx8IG92ZXJyaWRlID4gMTgwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTUzNTVcdTZCMjFcdTY1RjZcdTk1N0ZcdTk3MDBcdTRFM0ExXHUyMDE0MTgwXHU1MjA2XHU5NDlGXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdGFydFRlYWNoaW5nVGFzayh0aGlzLCBhdCk7XG4gICAgICAgIHRoaXMuc3RhcnQoYXQpO1xuICAgICAgICBpZiAob3ZlcnJpZGUgIT09IG51bGwpIHtcbiAgICAgICAgICAvLyBzdGFydCgpIFx1NEYxQVx1NjMwOVx1NTE2OFx1NUM0MFx1OEJCRVx1N0Y2RVx1OTFDRFx1N0I5N1x1NkJCNVx1OTU3Rlx1RkYwQ1x1ODk4Nlx1NzZENlx1NUZDNVx1OTg3Qlx1NjUzRVx1NTcyOFx1NUI4M1x1NEU0Qlx1NTQwRVx1MzAwMlxuICAgICAgICAgIHRoaXMudGltZXIuZHVyYXRpb25TZWNzID0gb3ZlcnJpZGUgKiA2MDtcbiAgICAgICAgICB0aGlzLnRpbWVyLnJlbWFpbmluZ1NlY3MgPSBvdmVycmlkZSAqIDYwO1xuICAgICAgICAgIHRoaXMudGltZXIuZGVhZGxpbmUgPSBhdCArIG92ZXJyaWRlICogNjA7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwicGF1c2VUaW1lclwiOiB7XG4gICAgICAgIHRoaXMudGltZXIucmVtYWluaW5nU2VjcyA9IHRpbWVyUmVtYWluaW5nKHRoaXMudGltZXIsIGF0KTtcbiAgICAgICAgdGhpcy50aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGltZXIuZGVhZGxpbmUgPSBudWxsO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJyZXNldFRpbWVyXCI6IHtcbiAgICAgICAgdGhpcy5yZWNvcmQoYXQsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5yZXNldFRvKHRoaXMudGltZXIubW9kZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInNraXBUaW1lclwiOiB7XG4gICAgICAgIHRoaXMucmVjb3JkKGF0LCBmYWxzZSk7XG4gICAgICAgIGNvbnN0IG5leHQ6IE1vZGUgPSB0aGlzLnRpbWVyLm1vZGUgPT09IFwiZm9jdXNcIiA/IFwic2hvcnRCcmVha1wiIDogXCJmb2N1c1wiO1xuICAgICAgICB0aGlzLnJlc2V0VG8obmV4dCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInNldE1vZGVcIjoge1xuICAgICAgICBpZiAoYWN0aW9uLm1vZGUgIT09IHRoaXMudGltZXIubW9kZSkge1xuICAgICAgICAgIHRoaXMucmVjb3JkKGF0LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5yZXNldFRvKGFjdGlvbi5tb2RlKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJzYXZlU2V0dGluZ3NcIjoge1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gYWN0aW9uLnNldHRpbmdzO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgIXRoaXMudGltZXIucnVubmluZyAmJlxuICAgICAgICAgIHRoaXMudGltZXIucmVtYWluaW5nU2VjcyA9PT0gdGhpcy50aW1lci5kdXJhdGlvblNlY3NcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpcy5yZXNldFRvKHRoaXMudGltZXIubW9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwiaW1wb3J0UGxhblwiOlxuICAgICAgICBtZXJnZVBsYW4oYWN0aW9uLnBsYW4sIHRoaXMsIGF0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiaW1wb3J0XCI6IHtcbiAgICAgICAgYWN0aW9uLmRhdGEudmFsaWRhdGUoKTtcbiAgICAgICAgY29uc3QgZGF0YSA9IGNsb25lKGFjdGlvbi5kYXRhKTtcbiAgICAgICAgLy8gXHU2MDYyXHU1OTBEXHU2NTg3XHU0RUY2XHU0RTBEXHU1Rjk3XHU2MDg0XHU2MDg0XHU2QjY2XHU4OEM1XHU1QjlBXHU2NUY2XHU5NTAxXHU2NzNBXHUzMDAyXG4gICAgICAgIGRhdGEubG9jay5hY3RpdmUgPSBudWxsO1xuICAgICAgICBkYXRhLmxvY2suc3VwcHJlc3NlZFVudGlsID0gMDtcbiAgICAgICAgZGF0YS5zZXR0aW5ncy5hdXRvU3RhcnRUYXNrcyA9IGZhbHNlO1xuICAgICAgICBmb3IgKGNvbnN0IHNjaGVkdWxlIG9mIGRhdGEubG9jay5zY2hlZHVsZXMpIHtcbiAgICAgICAgICBzY2hlZHVsZS5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gXHU1OTA3XHU0RUZEXHU2NjJGXHU2NTcwXHU2MzZFXHVGRjBDXHU0RTBEXHU2NjJGXHU2Mzg4XHU2NzQzXHU5MUNEXHU1RjAwXHU2NUU3XHU2NUY2XHU5NDlGXHUzMDAyXG4gICAgICAgIGRhdGEudGltZXIucmVtYWluaW5nU2VjcyA9IE1hdGgubWF4KDEsIHRpbWVyUmVtYWluaW5nKGRhdGEudGltZXIsIGF0KSk7XG4gICAgICAgIGRhdGEudGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICBkYXRhLnRpbWVyLmRlYWRsaW5lID0gbnVsbDtcbiAgICAgICAgZGF0YS50aW1lci5jb21wbGV0aW9uU2VyaWFsID0gdGhpcy50aW1lci5jb21wbGV0aW9uU2VyaWFsO1xuICAgICAgICByZXBsYWNlQXBwRGF0YSh0aGlzLCBkYXRhKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwibG9hZEV4YW1wbGVcIjoge1xuICAgICAgICBpZiAodGhpcy50YXNrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU1M0VBXHU2NzA5XHU3QTdBXHU0RUZCXHU1MkExXHU1MjE3XHU4ODY4XHU1M0VGXHU0RUU1XHU4RjdEXHU1MTY1XHU3OTNBXHU0RjhCXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRvZGF5ID0gZGF0ZUF0KGF0KTtcbiAgICAgICAgY29uc3QgZXhhbXBsZXM6IFtzdHJpbmcsIHN0cmluZywgbnVtYmVyLCBudW1iZXJdW10gPSBbXG4gICAgICAgICAgW1xuICAgICAgICAgICAgXCJcdTY4QjNcdTc0MDZcdTY3MkNcdTU0NjhcdTc2ODRcdTVERTVcdTRGNUNcdThCQTFcdTUyMTJcIixcbiAgICAgICAgICAgIFwiXHU2MjhBXHU1OTI3XHU3NkVFXHU2ODA3XHU2MkM2XHU2MjEwXHU1QzBGXHU2QjY1XHU5QUE0XHVGRjBDXHU4QkE5XHU2QkNGXHU0RTAwXHU1OTI5XHU5MEZEXHU2NkY0XHU0RUNFXHU1QkI5XHUzMDAyXCIsXG4gICAgICAgICAgICAzLFxuICAgICAgICAgICAgMixcbiAgICAgICAgICBdLFxuICAgICAgICAgIFtcbiAgICAgICAgICAgIFwiXHU4QkZCXHU1QjhDXHU2QjYzXHU1NzI4XHU3NzBCXHU3Njg0XHU5MEEzXHU0RTAwXHU3QUUwXCIsXG4gICAgICAgICAgICBcIlx1NTE3M1x1NjM4OVx1NkQ4OFx1NjA2Rlx1NjNEMFx1OTE5Mlx1RkYwQ1x1N0VEOVx1OTYwNVx1OEJGQlx1NzU1OVx1NEUwMFx1NkJCNVx1NUI4Q1x1NjU3NFx1NzY4NFx1NjVGNlx1OTVGNFx1MzAwMlwiLFxuICAgICAgICAgICAgMixcbiAgICAgICAgICAgIDEsXG4gICAgICAgICAgXSxcbiAgICAgICAgICBbXCJcdTY1NzRcdTc0MDZcdTY4NENcdTk3NjJcdUZGMENcdTY1NzRcdTc0MDZcdTYwMURcdTdFRUFcIiwgXCJcdTRFMDBcdTRFMkFcdTgyMTJcdTY3MERcdTc2ODRcdTczQUZcdTU4ODNcdUZGMENcdTY2MkZcdTRFMTNcdTZDRThcdTc2ODRcdTVGMDBcdTU5Q0JcdTMwMDJcIiwgMSwgMV0sXG4gICAgICAgIF07XG4gICAgICAgIGV4YW1wbGVzLmZvckVhY2goKFt0aXRsZSwgbm90ZXMsIHByaW9yaXR5LCBlc3RpbWF0ZV0sIGluZGV4KSA9PiB7XG4gICAgICAgICAgdGhpcy50YXNrcy5wdXNoKHtcbiAgICAgICAgICAgIGlkOiBpZCgpLFxuICAgICAgICAgICAgdGVtcGxhdGVJZDogbnVsbCxcbiAgICAgICAgICAgIHJlY3VycmluZzogZmFsc2UsXG4gICAgICAgICAgICB0aXRsZSxcbiAgICAgICAgICAgIG5vdGVzLFxuICAgICAgICAgICAgcHJvamVjdElkOiB0aGlzLnByb2plY3RzW2luZGV4XT8uaWQgPz8gbnVsbCxcbiAgICAgICAgICAgIGhhYml0SWQ6IG51bGwsXG4gICAgICAgICAgICBkdWVEYXRlOiB0b2RheSxcbiAgICAgICAgICAgIHJlbWluZGVyVGltZTogbnVsbCxcbiAgICAgICAgICAgIGZvY3VzTWludXRlczogbnVsbCxcbiAgICAgICAgICAgIHJlbWluZGVyRmlyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcmVtaW5kZXJQZW5kaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIHJlbWluZGVyRXhwaXJlZDogZmFsc2UsXG4gICAgICAgICAgICBzY3JhcE1pbnV0ZXM6IDAsXG4gICAgICAgICAgICBwcmlvcml0eSxcbiAgICAgICAgICAgIGVzdGltYXRlLFxuICAgICAgICAgICAgY29tcGxldGVkOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbXBsZXRlZEF0OiBudWxsLFxuICAgICAgICAgICAgY3JlYXRlZEF0OiBhdCArIGluZGV4LFxuICAgICAgICAgICAgdGFnczogW1wiXHU3OTNBXHU0RjhCXCJdLFxuICAgICAgICAgICAgc3VidGFza3M6IFtdLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIG1hdGVyaWFsaXplVGVhY2hpbmdUYXNrcyh0aGlzLCBhdCk7XG4gICAgdGhpcy52YWxpZGF0ZSgpO1xuICB9XG5cbiAgdmFsaWRhdGUoKTogdm9pZCB7XG4gICAgdGhpcy5lZHVjYXRpb25WYWxpZGF0ZSgpO1xuICAgIHZhbGlkYXRlVGVhY2hpbmdUYXNrcyh0aGlzKTtcbiAgICB2YWxpZGF0ZUxvY2sodGhpcy5sb2NrKTtcbiAgICB2YWxpZGF0ZVRlbXBsYXRlcyh0aGlzKTtcbiAgICB2YWxpZGF0ZUlkZW50aXRpZXModGhpcyk7XG4gICAgdmFsaWRhdGVCbG9ja3ModGhpcy5ibG9ja3MpO1xuICAgIGVuc3VyZSh0aGlzLnZlcnNpb24gPT09IDQsIFwiXHU0RTBEXHU2NTJGXHU2MzAxXHU2QjY0XHU2NTcwXHU2MzZFXHU3MjQ4XHU2NzJDXCIpO1xuICAgIGVuc3VyZShcbiAgICAgIHRoaXMudGFza3MubGVuZ3RoIDw9IDUwMDAwICYmXG4gICAgICAgIHRoaXMuc2Vzc2lvbnMubGVuZ3RoIDw9IDIwMDAwMCAmJlxuICAgICAgICB0aGlzLnByb2plY3RzLmxlbmd0aCA8PSA1MDAsXG4gICAgICBcIlx1NjU3MFx1NjM2RVx1OEQ4NVx1NTFGQVx1NjU3MFx1OTFDRlx1OTY1MFx1NTIzNlwiLFxuICAgICk7XG4gICAgY29uc3QgcyA9IHRoaXMuc2V0dGluZ3M7XG4gICAgZW5zdXJlKHMuc291bmRWb2x1bWUgPD0gMTAwLCBcIlx1OTdGM1x1NjU0OFx1OTdGM1x1OTFDRlx1OTcwMFx1NEUzQSAwXHUyMDEzMTAwXCIpO1xuICAgIGVuc3VyZShcbiAgICAgIHMuZm9jdXNNaW51dGVzID49IDEgJiZcbiAgICAgICAgcy5mb2N1c01pbnV0ZXMgPD0gMTgwICYmXG4gICAgICAgIHMuc2hvcnRCcmVha01pbnV0ZXMgPj0gMSAmJlxuICAgICAgICBzLnNob3J0QnJlYWtNaW51dGVzIDw9IDYwICYmXG4gICAgICAgIHMubG9uZ0JyZWFrTWludXRlcyA+PSAxICYmXG4gICAgICAgIHMubG9uZ0JyZWFrTWludXRlcyA8PSAxMjAgJiZcbiAgICAgICAgcy5sb25nQnJlYWtFdmVyeSA+PSAyICYmXG4gICAgICAgIHMubG9uZ0JyZWFrRXZlcnkgPD0gMTIgJiZcbiAgICAgICAgcy5kYWlseUdvYWwgPj0gMSAmJlxuICAgICAgICBzLmRhaWx5R29hbCA8PSAzMCxcbiAgICAgIFwiXHU4QkExXHU2NUY2XHU4QkJFXHU3RjZFXHU4RDg1XHU1MUZBXHU1MTQxXHU4QkI4XHU4MzAzXHU1NkY0XCIsXG4gICAgKTtcbiAgICBlbnN1cmUoW1wibGlnaHRcIiwgXCJkYXJrXCIsIFwic3lzdGVtXCJdLmluY2x1ZGVzKHMudGhlbWUpLCBcIlx1NjVFMFx1NjU0OFx1NzY4NFx1NEUzQlx1OTg5OFwiKTtcbiAgICBlbnN1cmUodmFsaWRBcHBJZHMocy5wcm90ZWN0aW9uLndoaXRlbGlzdCksIFwiXHU2NUUwXHU2NTQ4XHU3Njg0XHU1RTk0XHU3NTI4XHU3NjdEXHU1NDBEXHU1MzU1XCIpO1xuICAgIGNvbnN0IHByb2plY3RJZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBmb3IgKGNvbnN0IHAgb2YgdGhpcy5wcm9qZWN0cykge1xuICAgICAgZW5zdXJlKHAuaWQubGVuZ3RoID4gMCAmJiAhcHJvamVjdElkcy5oYXMocC5pZCksIFwiXHU5ODc5XHU3NkVFIElEIFx1OTFDRFx1NTkwRFx1NjIxNlx1NEUzQVx1N0E3QVwiKTtcbiAgICAgIHByb2plY3RJZHMuYWRkKHAuaWQpO1xuICAgICAgZW5zdXJlKFxuICAgICAgICBwLm5hbWUudHJpbSgpLmxlbmd0aCA+IDAgJiYgY2hhckNvdW50KHAubmFtZSkgPD0gNDAsXG4gICAgICAgIFwiXHU5ODc5XHU3NkVFXHU1NDBEXHU3OUYwXHU5NzAwXHU0RTNBIDFcdTIwMTM0MCBcdTRFMkFcdTVCNTdcdTdCMjZcIixcbiAgICAgICk7XG4gICAgICBlbnN1cmUoXG4gICAgICAgIHAuY29sb3IubGVuZ3RoID09PSA3ICYmXG4gICAgICAgICAgcC5jb2xvci5zdGFydHNXaXRoKFwiI1wiKSAmJlxuICAgICAgICAgIC9eWzAtOWEtZkEtRl17Nn0kLy50ZXN0KHAuY29sb3Iuc2xpY2UoMSkpLFxuICAgICAgICBcIlx1NjVFMFx1NjU0OFx1NzY4NFx1OTg3OVx1NzZFRVx1OTg5Q1x1ODI3MlwiLFxuICAgICAgKTtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgcC5hcHBXaGl0ZWxpc3QgPT09IG51bGwgfHwgdmFsaWRBcHBJZHMocC5hcHBXaGl0ZWxpc3QpLFxuICAgICAgICBcIlx1NjVFMFx1NjU0OFx1NzY4NFx1OTg3OVx1NzZFRVx1NUU5NFx1NzUyOFx1NzY3RFx1NTQwRFx1NTM1NVwiLFxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgaGFiaXRJZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBlbnN1cmUodGhpcy5oYWJpdHMubGVuZ3RoIDw9IDUwMCwgXCJcdTRFNjBcdTYwRUZcdTY1NzBcdTkxQ0ZcdThEODVcdTUxRkFcdTk2NTBcdTUyMzZcIik7XG4gICAgZm9yIChjb25zdCBoIG9mIHRoaXMuaGFiaXRzKSB7XG4gICAgICBlbnN1cmUoaC5pZC5sZW5ndGggPiAwICYmICFoYWJpdElkcy5oYXMoaC5pZCksIFwiXHU0RTYwXHU2MEVGIElEIFx1OTFDRFx1NTkwRFx1NjIxNlx1NEUzQVx1N0E3QVwiKTtcbiAgICAgIGhhYml0SWRzLmFkZChoLmlkKTtcbiAgICAgIHZhbGlkYXRlSGFiaXQoaCk7XG4gICAgfVxuICAgIGNvbnN0IHZpc2lvbklkcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGVuc3VyZSh0aGlzLnZpc2lvbnMubGVuZ3RoIDw9IDUwMCwgXCJcdTYxM0ZcdTY2NkZcdTY1NzBcdTkxQ0ZcdThEODVcdTUxRkFcdTk2NTBcdTUyMzZcIik7XG4gICAgZm9yIChjb25zdCBhIG9mIHRoaXMudmlzaW9ucykge1xuICAgICAgZW5zdXJlKGEuaWQubGVuZ3RoID4gMCAmJiAhdmlzaW9uSWRzLmhhcyhhLmlkKSwgXCJcdTYxM0ZcdTY2NkYgSUQgXHU5MUNEXHU1OTBEXHU2MjE2XHU0RTNBXHU3QTdBXCIpO1xuICAgICAgdmlzaW9uSWRzLmFkZChhLmlkKTtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgYS5uYW1lLnRyaW0oKS5sZW5ndGggPiAwICYmIGNoYXJDb3VudChhLm5hbWUpIDw9IDQwLFxuICAgICAgICBcIlx1NjEzRlx1NjY2Rlx1NTQwRFx1NzlGMFx1OTcwMFx1NEUzQSAxXHUyMDEzNDAgXHU0RTJBXHU1QjU3XHU3QjI2XCIsXG4gICAgICApO1xuICAgICAgZW5zdXJlKHV0ZjhMZW4oYS5ub3RlcykgPD0gNTAwMDAsIFwiXHU2MTNGXHU2NjZGXHU1MTg1XHU1QkI5XHU4RkM3XHU5NTdGXCIpO1xuICAgICAgZW5zdXJlKFxuICAgICAgICBhLnByb2plY3RJZCA9PT0gbnVsbCB8fCBwcm9qZWN0SWRzLmhhcyhhLnByb2plY3RJZCksXG4gICAgICAgIFwiXHU2MTNGXHU2NjZGXHU1RjE1XHU3NTI4XHU0RTg2XHU0RTBEXHU1QjU4XHU1NzI4XHU3Njg0XHU5ODc5XHU3NkVFXCIsXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCB0YXNrSWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgZm9yIChjb25zdCB0IG9mIHRoaXMudGFza3MpIHtcbiAgICAgIHRoaXMudmFsaWRhdGVSZW1pbmRlclRhc2sodCk7XG4gICAgICBlbnN1cmUodC5pZC5sZW5ndGggPiAwICYmICF0YXNrSWRzLmhhcyh0LmlkKSwgXCJcdTRFRkJcdTUyQTEgSUQgXHU5MUNEXHU1OTBEXHU2MjE2XHU0RTNBXHU3QTdBXCIpO1xuICAgICAgdGFza0lkcy5hZGQodC5pZCk7XG4gICAgICBlbnN1cmUoXG4gICAgICAgIHQudGl0bGUudHJpbSgpLmxlbmd0aCA+IDAgJiYgY2hhckNvdW50KHQudGl0bGUpIDw9IDIwMCxcbiAgICAgICAgXCJcdTRFRkJcdTUyQTFcdTU0MERcdTc5RjBcdTk3MDBcdTRFM0EgMVx1MjAxMzIwMCBcdTRFMkFcdTVCNTdcdTdCMjZcIixcbiAgICAgICk7XG4gICAgICBlbnN1cmUoXG4gICAgICAgIHV0ZjhMZW4odC5ub3RlcykgPD0gNTAwMDAgJiZcbiAgICAgICAgICB0LnRhZ3MubGVuZ3RoIDw9IDIwICYmXG4gICAgICAgICAgdC50YWdzLmV2ZXJ5KCh0YWcpID0+IGNoYXJDb3VudCh0YWcpIDw9IDQwKSxcbiAgICAgICAgXCJcdTU5MDdcdTZDRThcdTYyMTZcdTY4MDdcdTdCN0VcdThGQzdcdTk1N0ZcIixcbiAgICAgICk7XG4gICAgICBlbnN1cmUoXG4gICAgICAgIHQucHJpb3JpdHkgPD0gMyAmJiB0LmVzdGltYXRlID49IDEgJiYgdC5lc3RpbWF0ZSA8PSA5OSxcbiAgICAgICAgXCJcdTY1RTBcdTY1NDhcdTc2ODRcdTRGMThcdTUxNDhcdTdFQTdcdTYyMTZcdTk4ODRcdThCQTFcdTc1NkFcdTgzMDRcdTY1NzBcIixcbiAgICAgICk7XG4gICAgICBlbnN1cmUodC5zY3JhcE1pbnV0ZXMgPD0gMTAwODAsIFwiXHU5MUNEXHU0RkVFXHU3QTk3XHU1M0UzXHU4RDg1XHU1MUZBXHU4MzAzXHU1NkY0XCIpO1xuICAgICAgZW5zdXJlKFxuICAgICAgICB0LnByb2plY3RJZCA9PT0gbnVsbCB8fCBwcm9qZWN0SWRzLmhhcyh0LnByb2plY3RJZCksXG4gICAgICAgIFwiXHU0RUZCXHU1MkExXHU1RjE1XHU3NTI4XHU0RTg2XHU0RTBEXHU1QjU4XHU1NzI4XHU3Njg0XHU5ODc5XHU3NkVFXCIsXG4gICAgICApO1xuICAgICAgZW5zdXJlKFxuICAgICAgICB0LmhhYml0SWQgPT09IG51bGwgfHwgaGFiaXRJZHMuaGFzKHQuaGFiaXRJZCksXG4gICAgICAgIFwiXHU0RUZCXHU1MkExXHU1RjE1XHU3NTI4XHU0RTg2XHU0RTBEXHU1QjU4XHU1NzI4XHU3Njg0XHU0RTYwXHU2MEVGXCIsXG4gICAgICApO1xuICAgICAgZW5zdXJlKFxuICAgICAgICB0LmhhYml0SWQgPT09IG51bGwgfHwgdC5yZW1pbmRlclRpbWUgIT09IG51bGwsXG4gICAgICAgIFwiXHU0RTYwXHU2MEVGXHU1QjlFXHU0RjhCXHU5NzAwXHU4OTgxXHU3Q0JFXHU3ODZFXHU2NUY2XHU5NUY0XCIsXG4gICAgICApO1xuICAgICAgZW5zdXJlKFxuICAgICAgICB0LmR1ZURhdGUgPT09IG51bGwgfHwgKHQuZHVlRGF0ZS5sZW5ndGggPT09IDEwICYmIHZhbGlkRGF0ZSh0LmR1ZURhdGUpKSxcbiAgICAgICAgXCJcdTY1RTBcdTY1NDhcdTc2ODRcdTRFRkJcdTUyQTFcdTY1RTVcdTY3MUZcIixcbiAgICAgICk7XG4gICAgICBjb25zdCBzdWJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICBlbnN1cmUoXG4gICAgICAgIHQuc3VidGFza3MubGVuZ3RoIDw9IDIwMCAmJlxuICAgICAgICAgIHQuc3VidGFza3MuZXZlcnkoKHN1YikgPT4ge1xuICAgICAgICAgICAgaWYgKHN1Yi5pZC5sZW5ndGggPT09IDApIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmIChzdWJzLmhhcyhzdWIuaWQpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBzdWJzLmFkZChzdWIuaWQpO1xuICAgICAgICAgICAgcmV0dXJuIHN1Yi50aXRsZS50cmltKCkubGVuZ3RoID4gMCAmJiBjaGFyQ291bnQoc3ViLnRpdGxlKSA8PSAyMDA7XG4gICAgICAgICAgfSksXG4gICAgICAgIFwiXHU2NUUwXHU2NTQ4XHU3Njg0XHU1QjUwXHU0RUZCXHU1MkExXCIsXG4gICAgICApO1xuICAgICAgZW5zdXJlKFxuICAgICAgICB0LmNvbXBsZXRlZCA9PT0gKHQuY29tcGxldGVkQXQgIT09IG51bGwpLFxuICAgICAgICBcIlx1NEVGQlx1NTJBMVx1NUI4Q1x1NjIxMFx1NzJCNlx1NjAwMVx1NEUwRVx1NjVFNVx1NjcxRlx1NEUwRFx1NEUwMFx1ODFGNFwiLFxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgdCA9IHRoaXMudGltZXI7XG4gICAgZW5zdXJlKFxuICAgICAgdC5jeWNsZURhdGUgPT09IG51bGwgfHxcbiAgICAgICAgKHQuY3ljbGVEYXRlLmxlbmd0aCA9PT0gMTAgJiYgdmFsaWREYXRlKHQuY3ljbGVEYXRlKSksXG4gICAgICBcIlx1NjVFMFx1NjU0OFx1NzY4NFx1NzU2QVx1ODMwNFx1NTQ2OFx1NjcxRlx1NjVFNVx1NjcxRlwiLFxuICAgICk7XG4gICAgZW5zdXJlKFxuICAgICAgdC5kdXJhdGlvblNlY3MgPj0gMSAmJlxuICAgICAgICB0LmR1cmF0aW9uU2VjcyA8PSAxMDgwMCAmJlxuICAgICAgICB0LnJlbWFpbmluZ1NlY3MgPD0gdC5kdXJhdGlvblNlY3MgJiZcbiAgICAgICAgdC5ydW5uaW5nID09PSAodC5kZWFkbGluZSAhPT0gbnVsbCksXG4gICAgICBcIlx1OEJBMVx1NjVGNlx1NTY2OFx1NjU3MFx1NjM2RVx1NEUwRFx1NkI2M1x1Nzg2RVwiLFxuICAgICk7XG4gICAgZW5zdXJlKHQudGFza0lkID09PSBudWxsIHx8IHRhc2tJZHMuaGFzKHQudGFza0lkKSwgXCJcdThCQTFcdTY1RjZcdTU2NjhcdTRFRkJcdTUyQTFcdTRFMERcdTVCNThcdTU3MjhcIik7XG4gICAgY29uc3Qgc2Vzc2lvbklkcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGNvbnN0IGVzdGltYXRlZFRhc2tzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgZm9yIChjb25zdCBzZXNzaW9uIG9mIHRoaXMuc2Vzc2lvbnMpIHtcbiAgICAgIGNvbnN0IG1heER1cmF0aW9uID0gc2Vzc2lvbi5zb3VyY2UgPT09IFwidGltZXJcIiA/IDEwODAwIDogOTkgKiAxODAgKiA2MDtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgc2Vzc2lvbi5pZC5sZW5ndGggPiAwICYmXG4gICAgICAgICAgIXNlc3Npb25JZHMuaGFzKHNlc3Npb24uaWQpICYmXG4gICAgICAgICAgc2Vzc2lvbi5lbmRlZEF0ID49IHNlc3Npb24uc3RhcnRlZEF0ICYmXG4gICAgICAgICAgc2Vzc2lvbi5kdXJhdGlvblNlY3MgPj0gMSAmJlxuICAgICAgICAgIHNlc3Npb24uZHVyYXRpb25TZWNzIDw9IG1heER1cmF0aW9uICYmXG4gICAgICAgICAgKHNlc3Npb24uc291cmNlICE9PSBcInRhc2tFc3RpbWF0ZVwiIHx8XG4gICAgICAgICAgICAoIXNlc3Npb24uY29tcGxldGVkICYmXG4gICAgICAgICAgICAgIHNlc3Npb24udGFza0lkICE9PSBudWxsICYmXG4gICAgICAgICAgICAgIHNlc3Npb24udGFza0lkLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICAgICAgIWVzdGltYXRlZFRhc2tzLmhhcyhzZXNzaW9uLnRhc2tJZCkgJiZcbiAgICAgICAgICAgICAgc2Vzc2lvbi5zdGFydGVkQXQgPT09IHNlc3Npb24uZW5kZWRBdCkpICYmXG4gICAgICAgICAgY2hhckNvdW50KHNlc3Npb24udGFza1RpdGxlKSA8PSAyMDAgJiZcbiAgICAgICAgICBjaGFyQ291bnQoc2Vzc2lvbi5wcm9qZWN0TmFtZSkgPD0gNDAsXG4gICAgICAgIFwiXHU2NUUwXHU2NTQ4XHU3Njg0XHU0RTEzXHU2Q0U4XHU4QkIwXHU1RjU1XCIsXG4gICAgICApO1xuICAgICAgc2Vzc2lvbklkcy5hZGQoc2Vzc2lvbi5pZCk7XG4gICAgICBpZiAoc2Vzc2lvbi5zb3VyY2UgPT09IFwidGFza0VzdGltYXRlXCIgJiYgc2Vzc2lvbi50YXNrSWQgIT09IG51bGwpIHtcbiAgICAgICAgZXN0aW1hdGVkVGFza3MuYWRkKHNlc3Npb24udGFza0lkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzdGF0cyhhdDogbnVtYmVyKTogU3RhdHMge1xuICAgIGNvbnN0IHRvZGF5ID0gZGF0ZUF0KGF0KTtcbiAgICBjb25zdCBjdXJyZW50ID0gcGFyc2VMb2NhbERhdGUodG9kYXkpITtcbiAgICBjb25zdCBieURheSA9IG5ldyBNYXA8c3RyaW5nLCB7IHNlY29uZHM6IG51bWJlcjsgcG9tb2Rvcm9zOiBudW1iZXIgfT4oKTtcbiAgICBmb3IgKGNvbnN0IHNlc3Npb24gb2YgdGhpcy5zZXNzaW9ucykge1xuICAgICAgY29uc3QgZW50cnkgPSBieURheS5nZXQoZGF0ZUF0KHNlc3Npb24uZW5kZWRBdCkpID8/IHtcbiAgICAgICAgc2Vjb25kczogMCxcbiAgICAgICAgcG9tb2Rvcm9zOiAwLFxuICAgICAgfTtcbiAgICAgIGVudHJ5LnNlY29uZHMgKz0gc2Vzc2lvbi5kdXJhdGlvblNlY3M7XG4gICAgICBlbnRyeS5wb21vZG9yb3MgKz0gc2Vzc2lvbi5jb21wbGV0ZWQgPyAxIDogMDtcbiAgICAgIGJ5RGF5LnNldChkYXRlQXQoc2Vzc2lvbi5lbmRlZEF0KSwgZW50cnkpO1xuICAgIH1cbiAgICAvLyBcdTRFMDBcdTkwNERcdTkwNERcdTUzODZcdTVCOUVcdTRGOEJcdUZGMUFcdTYzMDlcdTU5MjlcdTdFREZcdThCQTFcdTVCOENcdTYyMTBcdTMwMDFcdTRGNUNcdTVFOUZcdTRFMEVcdTdGM0FcdTUyRTRcdTMwMDJcbiAgICBjb25zdCBjb21wbGV0ZWRCeURheSA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gICAgY29uc3Qgdm9pZGVkQnlEYXkgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICAgIGNvbnN0IG1pc3NlZEJ5RGF5ID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgICBmb3IgKGNvbnN0IHQgb2YgdGhpcy50YXNrcykge1xuICAgICAgaWYgKHQuY29tcGxldGVkQXQgIT09IG51bGwpIHtcbiAgICAgICAgY29tcGxldGVkQnlEYXkuc2V0KFxuICAgICAgICAgIGRhdGVBdCh0LmNvbXBsZXRlZEF0KSxcbiAgICAgICAgICAoY29tcGxldGVkQnlEYXkuZ2V0KGRhdGVBdCh0LmNvbXBsZXRlZEF0KSkgPz8gMCkgKyAxLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKHQucmVtaW5kZXJFeHBpcmVkICYmICF0LmNvbXBsZXRlZCAmJiB0LmR1ZURhdGUgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKGtpbmRPZih0KSA9PT0gXCJoYWJpdFwiKSB7XG4gICAgICAgICAgbWlzc2VkQnlEYXkuc2V0KHQuZHVlRGF0ZSwgKG1pc3NlZEJ5RGF5LmdldCh0LmR1ZURhdGUpID8/IDApICsgMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdm9pZGVkQnlEYXkuc2V0KHQuZHVlRGF0ZSwgKHZvaWRlZEJ5RGF5LmdldCh0LmR1ZURhdGUpID8/IDApICsgMSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgZGF5czogRGF5U3RhdFtdID0gW107XG4gICAgZm9yIChsZXQgbiA9IDI3OyBuID49IDA7IG4gLT0gMSkge1xuICAgICAgY29uc3QgZGF0ZSA9IGZvcm1hdExvY2FsRGF0ZShhZGREYXlzKGN1cnJlbnQsIC1uKSk7XG4gICAgICBjb25zdCBlbnRyeSA9IGJ5RGF5LmdldChkYXRlKSA/PyB7IHNlY29uZHM6IDAsIHBvbW9kb3JvczogMCB9O1xuICAgICAgZGF5cy5wdXNoKHtcbiAgICAgICAgZGF0ZSxcbiAgICAgICAgc2Vjb25kczogZW50cnkuc2Vjb25kcyxcbiAgICAgICAgcG9tb2Rvcm9zOiBlbnRyeS5wb21vZG9yb3MsXG4gICAgICAgIG1pc3NlZDogbWlzc2VkQnlEYXkuZ2V0KGRhdGUpID8/IDAsXG4gICAgICAgIGNvbXBsZXRlZDogY29tcGxldGVkQnlEYXkuZ2V0KGRhdGUpID8/IDAsXG4gICAgICAgIHZvaWRlZDogdm9pZGVkQnlEYXkuZ2V0KGRhdGUpID8/IDAsXG4gICAgICB9KTtcbiAgICB9XG4gICAgY29uc3QgZm9jdXNlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGZvciAoY29uc3QgcyBvZiB0aGlzLnNlc3Npb25zKSB7XG4gICAgICBpZiAocy5jb21wbGV0ZWQgfHwgcy5zb3VyY2UgPT09IFwidGFza0VzdGltYXRlXCIpIHtcbiAgICAgICAgZm9jdXNlZC5hZGQoZGF0ZUF0KHMuZW5kZWRBdCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgZGF5ID0gY3VycmVudDtcbiAgICBpZiAoIWZvY3VzZWQuaGFzKHRvZGF5KSkge1xuICAgICAgZGF5ID0gYWRkRGF5cyhkYXksIC0xKTtcbiAgICB9XG4gICAgbGV0IHN0cmVhayA9IDA7XG4gICAgd2hpbGUgKGZvY3VzZWQuaGFzKGZvcm1hdExvY2FsRGF0ZShkYXkpKSkge1xuICAgICAgc3RyZWFrICs9IDE7XG4gICAgICBkYXkgPSBhZGREYXlzKGRheSwgLTEpO1xuICAgIH1cbiAgICBjb25zdCBsYXN0ID0gZGF5c1tkYXlzLmxlbmd0aCAtIDFdITtcbiAgICByZXR1cm4ge1xuICAgICAgdG9kYXlTZWNvbmRzOiBsYXN0LnNlY29uZHMsXG4gICAgICB0b2RheVBvbW9kb3JvczogbGFzdC5wb21vZG9yb3MsXG4gICAgICB0b2RheUNvbXBsZXRlZDogdGhpcy50YXNrcy5maWx0ZXIoXG4gICAgICAgICh0KSA9PiB0LmNvbXBsZXRlZEF0ICE9PSBudWxsICYmIGRhdGVBdCh0LmNvbXBsZXRlZEF0KSA9PT0gdG9kYXksXG4gICAgICApLmxlbmd0aCxcbiAgICAgIHRvdGFsU2Vjb25kczogdGhpcy5zZXNzaW9ucy5yZWR1Y2UoKG4sIHMpID0+IG4gKyBzLmR1cmF0aW9uU2VjcywgMCksXG4gICAgICB0b3RhbFBvbW9kb3JvczogdGhpcy5zZXNzaW9ucy5maWx0ZXIoKHMpID0+IHMuY29tcGxldGVkKS5sZW5ndGgsXG4gICAgICBzdHJlYWssXG4gICAgICBkYXlzLFxuICAgIH07XG4gIH1cblxuICAvLyAtLS0tIHJlbWluZGVycyBcdTUzMDVcdTg4QzUgLS0tLVxuICByZW1pbmRlcklkbGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHJlbWluZGVySWRsZSh0aGlzKTtcbiAgfVxuICBwZW5kaW5nUmVtaW5kZXIoKTogVGFzayB8IG51bGwge1xuICAgIHJldHVybiBwZW5kaW5nUmVtaW5kZXIodGhpcyk7XG4gIH1cbiAgZHVlQXV0b1Rhc2soKTogVGFzayB8IG51bGwge1xuICAgIHJldHVybiBkdWVBdXRvVGFzayh0aGlzKTtcbiAgfVxuXG4gIC8vIC0tLS0gcGxhbiBcdTUzMDVcdTg4QzUgLS0tLVxuICBleHBvcnRQbGFuKCk6IFBsYW5GaWxlIHtcbiAgICByZXR1cm4gZXhwb3J0UGxhbih0aGlzKTtcbiAgfVxuXG4gIC8vIC0tLS0gdGVhY2hpbmcgXHU1MzA1XHU4OEM1IC0tLS1cbiAgdGVhY2hpbmdUYXNrKHRhc2tJZDogc3RyaW5nKTogUmV0dXJuVHlwZTx0eXBlb2YgdGVhY2hpbmdUYXNrPiB7XG4gICAgcmV0dXJuIHRlYWNoaW5nVGFzayh0aGlzLCB0YXNrSWQpO1xuICB9XG4gIGNvbXBsZXRlVGVhY2hpbmdUYXNrKHRhc2tJZDogc3RyaW5nLCBhdDogbnVtYmVyKTogdm9pZCB7XG4gICAgY29tcGxldGVUZWFjaGluZ1Rhc2sodGhpcywgdGFza0lkLCBhdCk7XG4gIH1cblxuICAvLyAtLS0tIGVkdWNhdGlvbiBcdTY4MjFcdTlBOENcdTUzMDVcdTg4QzUgLS0tLVxuICBlZHVjYXRpb25WYWxpZGF0ZSgpOiB2b2lkIHtcbiAgICB2YWxpZGF0ZUVkdWNhdGlvbkRhdGEodGhpcyk7XG4gIH1cbiAgdmFsaWRhdGVSZW1pbmRlclRhc2sodGFzazogVGFzayk6IHZvaWQge1xuICAgIHZhbGlkYXRlUmVtaW5kZXJUYXNrKHRhc2spO1xuICB9XG59XG5cbmltcG9ydCB7IHZhbGlkYXRlUmVtaW5kZXJUYXNrIH0gZnJvbSBcIi4vcmVtaW5kZXJzXCI7XG5pbXBvcnQgeyB2YWxpZGF0ZUVkdWNhdGlvbiBhcyB2YWxpZGF0ZUVkdWNhdGlvbkRhdGEgfSBmcm9tIFwiLi9lZHVjYXRpb25cIjtcblxuLy8gLS0tLS0tLS0tLSBcdTUxNjhcdTVDNDBcdTUxRkRcdTY1NzAgLS0tLS0tLS0tLVxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRBcHBJZHMobGlzdDogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICBsaXN0Lmxlbmd0aCA8PSAxMDAgJiZcbiAgICBsaXN0LmV2ZXJ5KFxuICAgICAgKGEpID0+XG4gICAgICAgIGEudHJpbSgpLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgY2hhckNvdW50KGEpIDw9IDMyNzY4ICYmXG4gICAgICAgICFBcnJheS5mcm9tKGEpLnNvbWUoKGMpID0+IGlzQ29udHJvbENoYXIoYykpLFxuICAgIClcbiAgKTtcbn1cblxuZnVuY3Rpb24gaXNDb250cm9sQ2hhcihjOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgY29kZSA9IGMuY29kZVBvaW50QXQoMCkhO1xuICByZXR1cm4gY29kZSA8IDB4MjAgfHwgKGNvZGUgPj0gMHg3ZiAmJiBjb2RlIDw9IDB4OWYpO1xufVxuXG5mdW5jdGlvbiBwYXJzZUxvY2FsRGF0ZShcbiAgdmFsdWU6IHN0cmluZyxcbik6IHsgeWVhcjogbnVtYmVyOyBtb250aDogbnVtYmVyOyBkYXk6IG51bWJlciB9IHwgbnVsbCB7XG4gIGlmICghL15cXGR7NH0tXFxkezJ9LVxcZHsyfSQvLnRlc3QodmFsdWUpKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgeWVhciA9IE51bWJlcih2YWx1ZS5zbGljZSgwLCA0KSk7XG4gIGNvbnN0IG1vbnRoID0gTnVtYmVyKHZhbHVlLnNsaWNlKDUsIDcpKTtcbiAgY29uc3QgZGF5ID0gTnVtYmVyKHZhbHVlLnNsaWNlKDgsIDEwKSk7XG4gIGNvbnN0IHByb2JlID0gbmV3IERhdGUoRGF0ZS5VVEMoeWVhciwgbW9udGggLSAxLCBkYXkpKTtcbiAgaWYgKFxuICAgIHByb2JlLmdldFVUQ0Z1bGxZZWFyKCkgIT09IHllYXIgfHxcbiAgICBwcm9iZS5nZXRVVENNb250aCgpICE9PSBtb250aCAtIDEgfHxcbiAgICBwcm9iZS5nZXRVVENEYXRlKCkgIT09IGRheVxuICApIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4geyB5ZWFyLCBtb250aCwgZGF5IH07XG59XG5cbmZ1bmN0aW9uIGZvcm1hdExvY2FsRGF0ZShkYXRlOiB7XG4gIHllYXI6IG51bWJlcjtcbiAgbW9udGg6IG51bWJlcjtcbiAgZGF5OiBudW1iZXI7XG59KTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2RhdGUueWVhcn0tJHtTdHJpbmcoZGF0ZS5tb250aCkucGFkU3RhcnQoMiwgXCIwXCIpfS0ke1N0cmluZyhkYXRlLmRheSkucGFkU3RhcnQoMiwgXCIwXCIpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja1VzZXJBY3Rpb24oYWN0aW9uOiBBY3Rpb24pOiB2b2lkIHtcbiAgaWYgKGFjdGlvbi50eXBlID09PSBcImVkdWNhdGlvblwiICYmIGFzc2lzdGFudE9ubHkoYWN0aW9uLmNvbW1hbmQpKSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFxuICAgICAgXCJcdThCRkVcdTdBMEJcdTMwMDFcdTRGNUNcdTRFMUFcdTMwMDFcdThCRDVcdTUzNzdcdTU0OENcdTYyNzlcdTY1MzlcdTc1MzFcdTVCNjZcdTRFNjBcdTUyQTlcdTYyNEJcdTc1MUZcdTYyMTBcdUZGMENcdThCRjdcdTU3MjhcdTVCRjlcdThCRERcdTRFMkRcdTYzRDBcdTUxRkFcdTg5ODFcdTZDNDJcIixcbiAgICApO1xuICB9XG59XG5cbmltcG9ydCB7IGFzc2lzdGFudE9ubHkgfSBmcm9tIFwiLi9lZHVjYXRpb25cIjtcblxuLy8gLS0tLS0tLS0tLSBBY3Rpb24gLS0tLS0tLS0tLVxuXG5leHBvcnQgdHlwZSBBY3Rpb24gPVxuICB8IHsgdHlwZTogXCJlZHVjYXRpb25cIjsgY29tbWFuZDogaW1wb3J0KFwiLi9lZHVjYXRpb25cIikuQ29tbWFuZCB9XG4gIHwgeyB0eXBlOiBcInByaW50SW5zdGFuY2VzXCI7IHNoYXBlOiBTaGFwZTsgcHJpbnRpbmc6IFByaW50aW5nIH1cbiAgfCB7IHR5cGU6IFwic2F2ZVRlbXBsYXRlXCI7IHRlbXBsYXRlOiBUZW1wbGF0ZTsgcHJpbnREYXRlczogKHN0cmluZyB8IG51bGwpW10gfVxuICB8IHsgdHlwZTogXCJkZWxldGVUZW1wbGF0ZVwiOyBpZDogc3RyaW5nIH1cbiAgfCB7IHR5cGU6IFwicHJpbnRUZW1wbGF0ZVwiOyBpZDogc3RyaW5nOyBkYXRlczogKHN0cmluZyB8IG51bGwpW10gfVxuICB8IHsgdHlwZTogXCJzeW5jVGVtcGxhdGVcIjsgaWQ6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiBcInN0YXJ0UmVtaW5kZXJcIjsgaWQ6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiBcInNhdmVUYXNrXCI7IHRhc2s6IFRhc2tEcmFmdCB9XG4gIHwgeyB0eXBlOiBcInRvZ2dsZVRhc2tcIjsgaWQ6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiBcImRlbGV0ZVRhc2tcIjsgaWQ6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiBcInJlc3RvcmVUYXNrXCI7IHRhc2s6IFRhc2sgfVxuICB8IHsgdHlwZTogXCJ0b2dnbGVTdWJ0YXNrXCI7IHRhc2tJZDogc3RyaW5nOyBzdWJ0YXNrSWQ6IHN0cmluZyB9XG4gIHwge1xuICAgICAgdHlwZTogXCJzYXZlUHJvamVjdFwiO1xuICAgICAgaWQ6IHN0cmluZyB8IG51bGw7XG4gICAgICBuYW1lOiBzdHJpbmc7XG4gICAgICBjb2xvcjogc3RyaW5nO1xuICAgICAgZGlyZWN0b3J5OiBzdHJpbmcgfCBudWxsO1xuICAgIH1cbiAgfCB7XG4gICAgICB0eXBlOiBcInJlbmFtZVByb2plY3REaXJlY3RvcnlcIjtcbiAgICAgIGlkOiBzdHJpbmc7XG4gICAgICBuYW1lOiBzdHJpbmc7XG4gICAgICBjb2xvcjogc3RyaW5nO1xuICAgICAgZGlyZWN0b3J5OiBzdHJpbmc7XG4gICAgfVxuICB8IHsgdHlwZTogXCJzZXRQcm9qZWN0V2hpdGVsaXN0XCI7IGlkOiBzdHJpbmc7IHdoaXRlbGlzdDogc3RyaW5nW10gfCBudWxsIH1cbiAgfCB7IHR5cGU6IFwiZGVsZXRlUHJvamVjdFwiOyBpZDogc3RyaW5nIH1cbiAgfCB7IHR5cGU6IFwicmVvcmRlclByb2plY3RzXCI7IGlkczogc3RyaW5nW10gfVxuICB8IHsgdHlwZTogXCJkZXRhY2hUYXNrc1wiOyBpZHM6IHN0cmluZ1tdOyB0YXJnZXQ6IERldGFjaFRhcmdldCB9XG4gIHwgeyB0eXBlOiBcInNhdmVIYWJpdEdyb3VwXCI7IGlkOiBzdHJpbmcgfCBudWxsOyBuYW1lOiBzdHJpbmcgfVxuICB8IHtcbiAgICAgIHR5cGU6IFwic2F2ZUhhYml0XCI7XG4gICAgICBpZDogc3RyaW5nIHwgbnVsbDtcbiAgICAgIG5hbWU6IHN0cmluZztcbiAgICAgIHByb2plY3RJZDogc3RyaW5nIHwgbnVsbDtcbiAgICAgIGZvY3VzTWludXRlczogbnVtYmVyIHwgbnVsbDtcbiAgICAgIHNsb3RzOiBIYWJpdFNsb3RbXTtcbiAgICB9XG4gIHwgeyB0eXBlOiBcImRlbGV0ZUhhYml0XCI7IGlkOiBzdHJpbmcgfVxuICB8IHtcbiAgICAgIHR5cGU6IFwic2F2ZVZpc2lvblwiO1xuICAgICAgaWQ6IHN0cmluZyB8IG51bGw7XG4gICAgICBuYW1lOiBzdHJpbmc7XG4gICAgICBub3Rlczogc3RyaW5nO1xuICAgICAgcHJvamVjdElkOiBzdHJpbmcgfCBudWxsO1xuICAgIH1cbiAgfCB7IHR5cGU6IFwiZGVsZXRlVmlzaW9uXCI7IGlkOiBzdHJpbmcgfVxuICB8IHtcbiAgICAgIHR5cGU6IFwic2F2ZUJsb2NrXCI7XG4gICAgICBpZDogc3RyaW5nIHwgbnVsbDtcbiAgICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgICBkYXlzOiBudW1iZXJbXTtcbiAgICAgIHN0YXJ0OiBzdHJpbmc7XG4gICAgICBlbmQ6IHN0cmluZztcbiAgICAgIGF0dGVudGlvbjogQXR0ZW50aW9uO1xuICAgICAgbm90ZXM6IHN0cmluZztcbiAgICB9XG4gIHwgeyB0eXBlOiBcImRlbGV0ZUJsb2NrXCI7IGlkOiBzdHJpbmcgfVxuICB8IHsgdHlwZTogXCJzZWxlY3RUYXNrXCI7IGlkOiBzdHJpbmcgfCBudWxsIH1cbiAgfCB7IHR5cGU6IFwic3RhcnRUaW1lclwiOyBtaW51dGVzPzogbnVtYmVyIHwgbnVsbCB9XG4gIHwgeyB0eXBlOiBcImNvbXBsZXRlRm9jdXNcIiB9XG4gIHwgeyB0eXBlOiBcInBhdXNlVGltZXJcIiB9XG4gIHwgeyB0eXBlOiBcInJlc2V0VGltZXJcIiB9XG4gIHwgeyB0eXBlOiBcInNraXBUaW1lclwiIH1cbiAgfCB7IHR5cGU6IFwic2V0TW9kZVwiOyBtb2RlOiBNb2RlIH1cbiAgfCB7IHR5cGU6IFwic2F2ZVNldHRpbmdzXCI7IHNldHRpbmdzOiBTZXR0aW5ncyB9XG4gIHwgeyB0eXBlOiBcImxvYWRFeGFtcGxlXCIgfVxuICB8IHsgdHlwZTogXCJpbXBvcnRcIjsgZGF0YTogQXBwRGF0YSB9XG4gIHwgeyB0eXBlOiBcImltcG9ydFBsYW5cIjsgcGxhbjogUGxhbkZpbGUgfVxuICB8IHsgdHlwZTogXCJlbWVyZ2VuY3lVbmxvY2tcIiB9XG4gIHwgeyB0eXBlOiBcInJlYXJtTG9ja1wiIH1cbiAgfCB7IHR5cGU6IFwic2F2ZUxvY2tTY2hlZHVsZVwiOyBzY2hlZHVsZTogTG9ja1NjaGVkdWxlIH1cbiAgfCB7IHR5cGU6IFwiZGVsZXRlTG9ja1NjaGVkdWxlXCI7IGlkOiBzdHJpbmcgfVxuICB8IHsgdHlwZTogXCJzdGFydFF1aWNrTG9ja1wiOyBtaW51dGVzOiBudW1iZXI7IHN0cmljdDogYm9vbGVhbiB9O1xuXG5pbXBvcnQgeyBwYXJzZVBsYW5GaWxlIH0gZnJvbSBcIi4vcGxhblwiO1xuaW1wb3J0IHsgcGFyc2VDb21tYW5kIH0gZnJvbSBcIi4vZWR1Y2F0aW9uXCI7XG5pbXBvcnQgeyBwYXJzZVRlbXBsYXRlLCBwYXJzZVByaW50aW5nLCBwYXJzZVNoYXBlIH0gZnJvbSBcIi4vdGVtcGxhdGVzXCI7XG5pbXBvcnQgeyBwYXJzZUxvY2tTY2hlZHVsZSB9IGZyb20gXCIuL2xvY2tcIjtcblxuY29uc3QgQUNUSU9OX0tFWVM6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPiA9IHtcbiAgZWR1Y2F0aW9uOiBbXCJ0eXBlXCIsIFwiY29tbWFuZFwiXSxcbiAgcHJpbnRJbnN0YW5jZXM6IFtcInR5cGVcIiwgXCJzaGFwZVwiLCBcInByaW50aW5nXCJdLFxuICBzYXZlVGVtcGxhdGU6IFtcInR5cGVcIiwgXCJ0ZW1wbGF0ZVwiLCBcInByaW50RGF0ZXNcIl0sXG4gIGRlbGV0ZVRlbXBsYXRlOiBbXCJ0eXBlXCIsIFwiaWRcIl0sXG4gIHByaW50VGVtcGxhdGU6IFtcInR5cGVcIiwgXCJpZFwiLCBcImRhdGVzXCJdLFxuICBzeW5jVGVtcGxhdGU6IFtcInR5cGVcIiwgXCJpZFwiXSxcbiAgc3RhcnRSZW1pbmRlcjogW1widHlwZVwiLCBcImlkXCJdLFxuICBzYXZlVGFzazogW1widHlwZVwiLCBcInRhc2tcIl0sXG4gIHRvZ2dsZVRhc2s6IFtcInR5cGVcIiwgXCJpZFwiXSxcbiAgZGVsZXRlVGFzazogW1widHlwZVwiLCBcImlkXCJdLFxuICByZXN0b3JlVGFzazogW1widHlwZVwiLCBcInRhc2tcIl0sXG4gIHRvZ2dsZVN1YnRhc2s6IFtcInR5cGVcIiwgXCJ0YXNrSWRcIiwgXCJzdWJ0YXNrSWRcIl0sXG4gIHNhdmVQcm9qZWN0OiBbXCJ0eXBlXCIsIFwiaWRcIiwgXCJuYW1lXCIsIFwiY29sb3JcIiwgXCJkaXJlY3RvcnlcIl0sXG4gIHJlbmFtZVByb2plY3REaXJlY3Rvcnk6IFtcInR5cGVcIiwgXCJpZFwiLCBcIm5hbWVcIiwgXCJjb2xvclwiLCBcImRpcmVjdG9yeVwiXSxcbiAgc2V0UHJvamVjdFdoaXRlbGlzdDogW1widHlwZVwiLCBcImlkXCIsIFwid2hpdGVsaXN0XCJdLFxuICBkZWxldGVQcm9qZWN0OiBbXCJ0eXBlXCIsIFwiaWRcIl0sXG4gIHJlb3JkZXJQcm9qZWN0czogW1widHlwZVwiLCBcImlkc1wiXSxcbiAgZGV0YWNoVGFza3M6IFtcInR5cGVcIiwgXCJpZHNcIiwgXCJ0YXJnZXRcIl0sXG4gIHNhdmVIYWJpdEdyb3VwOiBbXCJ0eXBlXCIsIFwiaWRcIiwgXCJuYW1lXCJdLFxuICBzYXZlSGFiaXQ6IFtcInR5cGVcIiwgXCJpZFwiLCBcIm5hbWVcIiwgXCJwcm9qZWN0SWRcIiwgXCJmb2N1c01pbnV0ZXNcIiwgXCJzbG90c1wiXSxcbiAgZGVsZXRlSGFiaXQ6IFtcInR5cGVcIiwgXCJpZFwiXSxcbiAgc2F2ZVZpc2lvbjogW1widHlwZVwiLCBcImlkXCIsIFwibmFtZVwiLCBcIm5vdGVzXCIsIFwicHJvamVjdElkXCJdLFxuICBkZWxldGVWaXNpb246IFtcInR5cGVcIiwgXCJpZFwiXSxcbiAgc2F2ZUJsb2NrOiBbXG4gICAgXCJ0eXBlXCIsXG4gICAgXCJpZFwiLFxuICAgIFwidGl0bGVcIixcbiAgICBcImRheXNcIixcbiAgICBcInN0YXJ0XCIsXG4gICAgXCJlbmRcIixcbiAgICBcImF0dGVudGlvblwiLFxuICAgIFwibm90ZXNcIixcbiAgXSxcbiAgZGVsZXRlQmxvY2s6IFtcInR5cGVcIiwgXCJpZFwiXSxcbiAgc2VsZWN0VGFzazogW1widHlwZVwiLCBcImlkXCJdLFxuICBzdGFydFRpbWVyOiBbXCJ0eXBlXCIsIFwibWludXRlc1wiXSxcbiAgY29tcGxldGVGb2N1czogW1widHlwZVwiXSxcbiAgcGF1c2VUaW1lcjogW1widHlwZVwiXSxcbiAgcmVzZXRUaW1lcjogW1widHlwZVwiXSxcbiAgc2tpcFRpbWVyOiBbXCJ0eXBlXCJdLFxuICBzZXRNb2RlOiBbXCJ0eXBlXCIsIFwibW9kZVwiXSxcbiAgc2F2ZVNldHRpbmdzOiBbXCJ0eXBlXCIsIFwic2V0dGluZ3NcIl0sXG4gIGxvYWRFeGFtcGxlOiBbXCJ0eXBlXCJdLFxuICBpbXBvcnQ6IFtcInR5cGVcIiwgXCJkYXRhXCJdLFxuICBpbXBvcnRQbGFuOiBbXCJ0eXBlXCIsIFwicGxhblwiXSxcbiAgZW1lcmdlbmN5VW5sb2NrOiBbXCJ0eXBlXCJdLFxuICByZWFybUxvY2s6IFtcInR5cGVcIl0sXG4gIHNhdmVMb2NrU2NoZWR1bGU6IFtcInR5cGVcIiwgXCJzY2hlZHVsZVwiXSxcbiAgZGVsZXRlTG9ja1NjaGVkdWxlOiBbXCJ0eXBlXCIsIFwiaWRcIl0sXG4gIHN0YXJ0UXVpY2tMb2NrOiBbXCJ0eXBlXCIsIFwibWludXRlc1wiLCBcInN0cmljdFwiXSxcbn07XG5cbmNvbnN0IEFDVElPTl9OQU1FUyA9IE9iamVjdC5rZXlzKEFDVElPTl9LRVlTKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQWN0aW9uKHJhdzogdW5rbm93bik6IEFjdGlvbiB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU1MkE4XHU0RjVDXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICBjb25zdCB0eXBlID0gb25lT2YoXG4gICAgcmVxdWlyZWRGaWVsZChyYXcsIFwidHlwZVwiLCBcIlx1NTJBOFx1NEY1Q1wiLCAodikgPT4gdiksXG4gICAgXCJcdTUyQThcdTRGNUMgdHlwZVwiLFxuICAgIEFDVElPTl9OQU1FUyxcbiAgKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIEFDVElPTl9LRVlTW3R5cGVdISwgXCJcdTUyQThcdTRGNUNcIik7XG4gIGNvbnN0IHN0ciA9IChrZXk6IHN0cmluZyk6IHN0cmluZyA9PiByZXF1aXJlZEZpZWxkKHJhdywga2V5LCBcIlx1NTJBOFx1NEY1Q1wiLCBhc1N0cik7XG4gIGNvbnN0IG9wdFN0ciA9IChrZXk6IHN0cmluZyk6IHN0cmluZyB8IG51bGwgPT5cbiAgICBmaWVsZChyYXcsIGtleSwgXCJcdTUyQThcdTRGNUNcIiwgKHYpID0+IGFzT3B0KHYsIGtleSwgYXNTdHIpLCBudWxsKSBhcyBzdHJpbmcgfCBudWxsO1xuICBjb25zdCBzdHJzID0gKGtleTogc3RyaW5nKTogc3RyaW5nW10gPT5cbiAgICBhc0FycmF5KFxuICAgICAgcmVxdWlyZWRGaWVsZChyYXcsIGtleSwgXCJcdTUyQThcdTRGNUNcIiwgKHYpID0+IHYpLFxuICAgICAga2V5LFxuICAgICkubWFwKCh4KSA9PiBhc1N0cih4LCBrZXkpKTtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBcImVkdWNhdGlvblwiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZSxcbiAgICAgICAgY29tbWFuZDogcGFyc2VDb21tYW5kKHJlcXVpcmVkRmllbGQocmF3LCBcImNvbW1hbmRcIiwgXCJcdTUyQThcdTRGNUNcIiwgKHYpID0+IHYpKSxcbiAgICAgIH07XG4gICAgY2FzZSBcInByaW50SW5zdGFuY2VzXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBzaGFwZTogcGFyc2VTaGFwZShyZXF1aXJlZEZpZWxkKHJhdywgXCJzaGFwZVwiLCBcIlx1NTJBOFx1NEY1Q1wiLCAodikgPT4gdikpLFxuICAgICAgICBwcmludGluZzogcGFyc2VQcmludGluZyhcbiAgICAgICAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJwcmludGluZ1wiLCBcIlx1NTJBOFx1NEY1Q1wiLCAodikgPT4gdiksXG4gICAgICAgICksXG4gICAgICB9O1xuICAgIGNhc2UgXCJzYXZlVGVtcGxhdGVcIjpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIHRlbXBsYXRlOiBwYXJzZVRlbXBsYXRlKFxuICAgICAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcInRlbXBsYXRlXCIsIFwiXHU1MkE4XHU0RjVDXCIsICh2KSA9PiB2KSxcbiAgICAgICAgKSxcbiAgICAgICAgcHJpbnREYXRlczogZmllbGQoXG4gICAgICAgICAgcmF3LFxuICAgICAgICAgIFwicHJpbnREYXRlc1wiLFxuICAgICAgICAgIFwiXHU1MkE4XHU0RjVDXCIsXG4gICAgICAgICAgKHYpID0+XG4gICAgICAgICAgICBhc0FycmF5KHYsIFwicHJpbnREYXRlc1wiKS5tYXAoKGQpID0+XG4gICAgICAgICAgICAgIGQgPT09IG51bGwgPyBudWxsIDogYXNTdHIoZCwgXCJwcmludERhdGVzXCIpLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICBbXSxcbiAgICAgICAgKSBhcyAoc3RyaW5nIHwgbnVsbClbXSxcbiAgICAgIH07XG4gICAgY2FzZSBcImRlbGV0ZVRlbXBsYXRlXCI6XG4gICAgY2FzZSBcInN5bmNUZW1wbGF0ZVwiOlxuICAgIGNhc2UgXCJzdGFydFJlbWluZGVyXCI6XG4gICAgY2FzZSBcInRvZ2dsZVRhc2tcIjpcbiAgICBjYXNlIFwiZGVsZXRlVGFza1wiOlxuICAgIGNhc2UgXCJkZWxldGVQcm9qZWN0XCI6XG4gICAgY2FzZSBcImRlbGV0ZUhhYml0XCI6XG4gICAgY2FzZSBcImRlbGV0ZVZpc2lvblwiOlxuICAgIGNhc2UgXCJkZWxldGVCbG9ja1wiOlxuICAgIGNhc2UgXCJkZWxldGVMb2NrU2NoZWR1bGVcIjpcbiAgICAgIHJldHVybiB7IHR5cGUsIGlkOiBzdHIoXCJpZFwiKSB9O1xuICAgIGNhc2UgXCJwcmludFRlbXBsYXRlXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBpZDogc3RyKFwiaWRcIiksXG4gICAgICAgIGRhdGVzOiBhc0FycmF5KFxuICAgICAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcImRhdGVzXCIsIFwiXHU1MkE4XHU0RjVDXCIsICh2KSA9PiB2KSxcbiAgICAgICAgICBcImRhdGVzXCIsXG4gICAgICAgICkubWFwKChkKSA9PiAoZCA9PT0gbnVsbCA/IG51bGwgOiBhc1N0cihkLCBcImRhdGVzXCIpKSkgYXMgKFxuICAgICAgICAgIHN0cmluZyB8IG51bGxcbiAgICAgICAgKVtdLFxuICAgICAgfTtcbiAgICBjYXNlIFwic2F2ZVRhc2tcIjpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIHRhc2s6IHBhcnNlVGFza0RyYWZ0KHJlcXVpcmVkRmllbGQocmF3LCBcInRhc2tcIiwgXCJcdTUyQThcdTRGNUNcIiwgKHYpID0+IHYpKSxcbiAgICAgIH07XG4gICAgY2FzZSBcInJlc3RvcmVUYXNrXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICB0YXNrOiBwYXJzZVRhc2socmVxdWlyZWRGaWVsZChyYXcsIFwidGFza1wiLCBcIlx1NTJBOFx1NEY1Q1wiLCAodikgPT4gdikpLFxuICAgICAgfTtcbiAgICBjYXNlIFwidG9nZ2xlU3VidGFza1wiOlxuICAgICAgcmV0dXJuIHsgdHlwZSwgdGFza0lkOiBzdHIoXCJ0YXNrSWRcIiksIHN1YnRhc2tJZDogc3RyKFwic3VidGFza0lkXCIpIH07XG4gICAgY2FzZSBcInNhdmVQcm9qZWN0XCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBpZDogb3B0U3RyKFwiaWRcIiksXG4gICAgICAgIG5hbWU6IHN0cihcIm5hbWVcIiksXG4gICAgICAgIGNvbG9yOiBzdHIoXCJjb2xvclwiKSxcbiAgICAgICAgZGlyZWN0b3J5OiBvcHRTdHIoXCJkaXJlY3RvcnlcIiksXG4gICAgICB9O1xuICAgIGNhc2UgXCJyZW5hbWVQcm9qZWN0RGlyZWN0b3J5XCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBpZDogc3RyKFwiaWRcIiksXG4gICAgICAgIG5hbWU6IHN0cihcIm5hbWVcIiksXG4gICAgICAgIGNvbG9yOiBzdHIoXCJjb2xvclwiKSxcbiAgICAgICAgZGlyZWN0b3J5OiBzdHIoXCJkaXJlY3RvcnlcIiksXG4gICAgICB9O1xuICAgIGNhc2UgXCJzZXRQcm9qZWN0V2hpdGVsaXN0XCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBpZDogc3RyKFwiaWRcIiksXG4gICAgICAgIHdoaXRlbGlzdDogZmllbGQoXG4gICAgICAgICAgcmF3LFxuICAgICAgICAgIFwid2hpdGVsaXN0XCIsXG4gICAgICAgICAgXCJcdTUyQThcdTRGNUNcIixcbiAgICAgICAgICAodikgPT5cbiAgICAgICAgICAgIGFzT3B0KHYsIFwid2hpdGVsaXN0XCIsICh4KSA9PlxuICAgICAgICAgICAgICBhc0FycmF5KHgsIFwid2hpdGVsaXN0XCIpLm1hcCgoYSkgPT4gYXNTdHIoYSwgXCJ3aGl0ZWxpc3RcIikpLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICBudWxsLFxuICAgICAgICApIGFzIHN0cmluZ1tdIHwgbnVsbCxcbiAgICAgIH07XG4gICAgY2FzZSBcInJlb3JkZXJQcm9qZWN0c1wiOlxuICAgICAgcmV0dXJuIHsgdHlwZSwgaWRzOiBzdHJzKFwiaWRzXCIpIH07XG4gICAgY2FzZSBcImRldGFjaFRhc2tzXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBpZHM6IHN0cnMoXCJpZHNcIiksXG4gICAgICAgIHRhcmdldDogb25lT2YoXG4gICAgICAgICAgcmVxdWlyZWRGaWVsZChyYXcsIFwidGFyZ2V0XCIsIFwiXHU1MkE4XHU0RjVDXCIsICh2KSA9PiB2KSxcbiAgICAgICAgICBcImRldGFjaCB0YXJnZXRcIixcbiAgICAgICAgICBbXCJwcm9qZWN0XCIsIFwiaGFiaXRcIl0sXG4gICAgICAgICkgYXMgRGV0YWNoVGFyZ2V0LFxuICAgICAgfTtcbiAgICBjYXNlIFwic2F2ZUhhYml0R3JvdXBcIjpcbiAgICAgIHJldHVybiB7IHR5cGUsIGlkOiBvcHRTdHIoXCJpZFwiKSwgbmFtZTogc3RyKFwibmFtZVwiKSB9O1xuICAgIGNhc2UgXCJzYXZlSGFiaXRcIjpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIGlkOiBvcHRTdHIoXCJpZFwiKSxcbiAgICAgICAgbmFtZTogc3RyKFwibmFtZVwiKSxcbiAgICAgICAgcHJvamVjdElkOiBvcHRTdHIoXCJwcm9qZWN0SWRcIiksXG4gICAgICAgIGZvY3VzTWludXRlczogZmllbGQoXG4gICAgICAgICAgcmF3LFxuICAgICAgICAgIFwiZm9jdXNNaW51dGVzXCIsXG4gICAgICAgICAgXCJcdTUyQThcdTRGNUNcIixcbiAgICAgICAgICAodikgPT4gYXNPcHQodiwgXCJmb2N1c01pbnV0ZXNcIiwgKHgpID0+IGFzSW50KHgsIFwiZm9jdXNNaW51dGVzXCIpKSxcbiAgICAgICAgICBudWxsLFxuICAgICAgICApIGFzIG51bWJlciB8IG51bGwsXG4gICAgICAgIHNsb3RzOiBhc0FycmF5KFxuICAgICAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcInNsb3RzXCIsIFwiXHU1MkE4XHU0RjVDXCIsICh2KSA9PiB2KSxcbiAgICAgICAgICBcInNsb3RzXCIsXG4gICAgICAgICkubWFwKHBhcnNlSGFiaXRTbG90KSxcbiAgICAgIH07XG4gICAgY2FzZSBcInNhdmVWaXNpb25cIjpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIGlkOiBvcHRTdHIoXCJpZFwiKSxcbiAgICAgICAgbmFtZTogc3RyKFwibmFtZVwiKSxcbiAgICAgICAgbm90ZXM6IGZpZWxkKHJhdywgXCJub3Rlc1wiLCBcIlx1NTJBOFx1NEY1Q1wiLCBhc1N0ciwgXCJcIiksXG4gICAgICAgIHByb2plY3RJZDogb3B0U3RyKFwicHJvamVjdElkXCIpLFxuICAgICAgfTtcbiAgICBjYXNlIFwic2F2ZUJsb2NrXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBpZDogb3B0U3RyKFwiaWRcIiksXG4gICAgICAgIHRpdGxlOiBzdHIoXCJ0aXRsZVwiKSxcbiAgICAgICAgZGF5czogYXNBcnJheShcbiAgICAgICAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJkYXlzXCIsIFwiXHU1MkE4XHU0RjVDXCIsICh2KSA9PiB2KSxcbiAgICAgICAgICBcImRheXNcIixcbiAgICAgICAgKS5tYXAoKGQpID0+IGFzSW50KGQsIFwiZGF5c1wiKSksXG4gICAgICAgIHN0YXJ0OiBzdHIoXCJzdGFydFwiKSxcbiAgICAgICAgZW5kOiBzdHIoXCJlbmRcIiksXG4gICAgICAgIGF0dGVudGlvbjogZmllbGQoXG4gICAgICAgICAgcmF3LFxuICAgICAgICAgIFwiYXR0ZW50aW9uXCIsXG4gICAgICAgICAgXCJcdTUyQThcdTRGNUNcIixcbiAgICAgICAgICAodikgPT4gb25lT2YodiwgXCJhdHRlbnRpb25cIiwgW1wicmVxdWlyZWRcIiwgXCJsaWdodFwiXSksXG4gICAgICAgICAgXCJyZXF1aXJlZFwiLFxuICAgICAgICApIGFzIEF0dGVudGlvbixcbiAgICAgICAgbm90ZXM6IGZpZWxkKHJhdywgXCJub3Rlc1wiLCBcIlx1NTJBOFx1NEY1Q1wiLCBhc1N0ciwgXCJcIiksXG4gICAgICB9O1xuICAgIGNhc2UgXCJzZWxlY3RUYXNrXCI6XG4gICAgICByZXR1cm4geyB0eXBlLCBpZDogb3B0U3RyKFwiaWRcIikgfTtcbiAgICBjYXNlIFwic3RhcnRUaW1lclwiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZSxcbiAgICAgICAgbWludXRlczogZmllbGQoXG4gICAgICAgICAgcmF3LFxuICAgICAgICAgIFwibWludXRlc1wiLFxuICAgICAgICAgIFwiXHU1MkE4XHU0RjVDXCIsXG4gICAgICAgICAgKHYpID0+IGFzT3B0KHYsIFwibWludXRlc1wiLCAoeCkgPT4gYXNJbnQoeCwgXCJtaW51dGVzXCIpKSxcbiAgICAgICAgICBudWxsLFxuICAgICAgICApIGFzIG51bWJlciB8IG51bGwsXG4gICAgICB9O1xuICAgIGNhc2UgXCJjb21wbGV0ZUZvY3VzXCI6XG4gICAgY2FzZSBcInBhdXNlVGltZXJcIjpcbiAgICBjYXNlIFwicmVzZXRUaW1lclwiOlxuICAgIGNhc2UgXCJza2lwVGltZXJcIjpcbiAgICBjYXNlIFwibG9hZEV4YW1wbGVcIjpcbiAgICBjYXNlIFwiZW1lcmdlbmN5VW5sb2NrXCI6XG4gICAgY2FzZSBcInJlYXJtTG9ja1wiOlxuICAgICAgcmV0dXJuIHsgdHlwZSB9O1xuICAgIGNhc2UgXCJzZXRNb2RlXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBtb2RlOiBvbmVPZihcbiAgICAgICAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJtb2RlXCIsIFwiXHU1MkE4XHU0RjVDXCIsICh2KSA9PiB2KSxcbiAgICAgICAgICBcIm1vZGVcIixcbiAgICAgICAgICBbXCJmb2N1c1wiLCBcInNob3J0QnJlYWtcIiwgXCJsb25nQnJlYWtcIl0sXG4gICAgICAgICkgYXMgTW9kZSxcbiAgICAgIH07XG4gICAgY2FzZSBcInNhdmVTZXR0aW5nc1wiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZSxcbiAgICAgICAgc2V0dGluZ3M6IHBhcnNlU2V0dGluZ3MoXG4gICAgICAgICAgcmVxdWlyZWRGaWVsZChyYXcsIFwic2V0dGluZ3NcIiwgXCJcdTUyQThcdTRGNUNcIiwgKHYpID0+IHYpLFxuICAgICAgICApLFxuICAgICAgfTtcbiAgICBjYXNlIFwiaW1wb3J0XCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBkYXRhOiBwYXJzZUFwcERhdGEocmVxdWlyZWRGaWVsZChyYXcsIFwiZGF0YVwiLCBcIlx1NTJBOFx1NEY1Q1wiLCAodikgPT4gdikpLFxuICAgICAgfTtcbiAgICBjYXNlIFwiaW1wb3J0UGxhblwiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZSxcbiAgICAgICAgcGxhbjogcGFyc2VQbGFuRmlsZShyZXF1aXJlZEZpZWxkKHJhdywgXCJwbGFuXCIsIFwiXHU1MkE4XHU0RjVDXCIsICh2KSA9PiB2KSksXG4gICAgICB9O1xuICAgIGNhc2UgXCJzYXZlTG9ja1NjaGVkdWxlXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBzY2hlZHVsZTogcGFyc2VMb2NrU2NoZWR1bGUoXG4gICAgICAgICAgcmVxdWlyZWRGaWVsZChyYXcsIFwic2NoZWR1bGVcIiwgXCJcdTUyQThcdTRGNUNcIiwgKHYpID0+IHYpLFxuICAgICAgICApLFxuICAgICAgfTtcbiAgICBjYXNlIFwic3RhcnRRdWlja0xvY2tcIjpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIG1pbnV0ZXM6IHJlcXVpcmVkRmllbGQocmF3LCBcIm1pbnV0ZXNcIiwgXCJcdTUyQThcdTRGNUNcIiwgYXNJbnQpLFxuICAgICAgICBzdHJpY3Q6IHJlcXVpcmVkRmllbGQocmF3LCBcInN0cmljdFwiLCBcIlx1NTJBOFx1NEY1Q1wiLCBhc0Jvb2wpLFxuICAgICAgfTtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKGBcdTUyQThcdTRGNUMgdHlwZSBcdTUzRDZcdTUwM0NcdTY1RTBcdTY1NDhcdUZGMUEke3R5cGV9YCk7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLSBBcHBEYXRhIFx1ODlFM1x1Njc5MC9cdTVFOEZcdTUyMTdcdTUzMTYgLS0tLS0tLS0tLVxuXG5jb25zdCBBUFBfREFUQV9LRVlTID0gW1xuICBcImVkdWNhdGlvblwiLFxuICBcInZlcnNpb25cIixcbiAgXCJpZGVudGl0aWVzXCIsXG4gIFwidGFza3NcIixcbiAgXCJibG9ja3NcIixcbiAgXCJ0ZW1wbGF0ZXNcIixcbiAgXCJwcmludHNcIixcbiAgXCJwcm9qZWN0c1wiLFxuICBcImhhYml0c1wiLFxuICBcInZpc2lvbnNcIixcbiAgXCJzZXR0aW5nc1wiLFxuICBcInRpbWVyXCIsXG4gIFwic2Vzc2lvbnNcIixcbiAgXCJsb2NrXCIsXG5dIGFzIGNvbnN0O1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VBcHBEYXRhKHJhdzogdW5rbm93bik6IEFwcERhdGEge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NjU3MFx1NjM2RVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgLy8gXHU0RTBFIFJ1c3QgI1tzZXJkZShkZW55X3Vua25vd25fZmllbGRzKV0gXHU1QkY5XHU5RjUwXHVGRjFBXHU5ODc2XHU1QzQyXHU2NzJBXHU3N0U1XHU1QjU3XHU2QkI1XHU3NkY0XHU2M0E1XHU2MkQyXHU3RUREXHVGRjA4XHU0RTBEXHU1MTdDXHU1QkI5XHU2NUU3XHU1MzRGXHU4QkFFXHVGRjA5XHUzMDAyXG4gIHJlamVjdFVua25vd24oXG4gICAgcmF3LFxuICAgIFtcbiAgICAgIFwiZWR1Y2F0aW9uXCIsXG4gICAgICBcInZlcnNpb25cIixcbiAgICAgIFwiaWRlbnRpdGllc1wiLFxuICAgICAgXCJ0YXNrc1wiLFxuICAgICAgXCJibG9ja3NcIixcbiAgICAgIFwidGVtcGxhdGVzXCIsXG4gICAgICBcInByaW50c1wiLFxuICAgICAgXCJwcm9qZWN0c1wiLFxuICAgICAgXCJoYWJpdHNcIixcbiAgICAgIFwidmlzaW9uc1wiLFxuICAgICAgXCJzZXR0aW5nc1wiLFxuICAgICAgXCJ0aW1lclwiLFxuICAgICAgXCJzZXNzaW9uc1wiLFxuICAgICAgXCJsb2NrXCIsXG4gICAgXSxcbiAgICBcIlx1NjU3MFx1NjM2RVwiLFxuICApO1xuICByZXR1cm4gbmV3IEFwcERhdGEoe1xuICAgIGVkdWNhdGlvbjogZmllbGQocmF3LCBcImVkdWNhdGlvblwiLCBcIlx1NjU3MFx1NjM2RVwiLCBwYXJzZUVkdWNhdGlvbiwgbmV3IEVkdWNhdGlvbigpKSxcbiAgICB2ZXJzaW9uOiByZXF1aXJlZEZpZWxkKHJhdywgXCJ2ZXJzaW9uXCIsIFwiXHU2NTcwXHU2MzZFXCIsIGFzSW50KSxcbiAgICBpZGVudGl0aWVzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiaWRlbnRpdGllc1wiLFxuICAgICAgXCJcdTY1NzBcdTYzNkVcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwiaWRlbnRpdGllc1wiKS5tYXAocGFyc2VJZGVudGl0eSksXG4gICAgICBbXSxcbiAgICApLFxuICAgIHRhc2tzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidGFza3NcIixcbiAgICAgIFwiXHU2NTcwXHU2MzZFXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcInRhc2tzXCIpLm1hcChwYXJzZVRhc2spLFxuICAgICAgW10sXG4gICAgKSxcbiAgICBibG9ja3M6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJibG9ja3NcIixcbiAgICAgIFwiXHU2NTcwXHU2MzZFXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcImJsb2Nrc1wiKS5tYXAocGFyc2VCbG9jayksXG4gICAgICBbXSxcbiAgICApLFxuICAgIHRlbXBsYXRlczogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInRlbXBsYXRlc1wiLFxuICAgICAgXCJcdTY1NzBcdTYzNkVcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwidGVtcGxhdGVzXCIpLm1hcChwYXJzZVRlbXBsYXRlKSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgcHJpbnRzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwicHJpbnRzXCIsXG4gICAgICBcIlx1NjU3MFx1NjM2RVwiLFxuICAgICAgKHYpID0+XG4gICAgICAgIGFzQXJyYXkodiwgXCJwcmludHNcIikubWFwKChwKSA9PiB7XG4gICAgICAgICAgZW5zdXJlKGlzT2JqZWN0KHApLCBcIlx1NTM3MFx1NTIzN1x1OEJCMFx1NUY1NVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgICAgICAgICByZWplY3RVbmtub3duKHAsIFtcInRlbXBsYXRlSWRcIiwgXCJkYXRlXCJdLCBcIlx1NTM3MFx1NTIzN1x1OEJCMFx1NUY1NVwiKTtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGVtcGxhdGVJZDogcmVxdWlyZWRGaWVsZChwLCBcInRlbXBsYXRlSWRcIiwgXCJcdTUzNzBcdTUyMzdcdThCQjBcdTVGNTVcIiwgYXNTdHIpLFxuICAgICAgICAgICAgZGF0ZTogZmllbGQoXG4gICAgICAgICAgICAgIHAsXG4gICAgICAgICAgICAgIFwiZGF0ZVwiLFxuICAgICAgICAgICAgICBcIlx1NTM3MFx1NTIzN1x1OEJCMFx1NUY1NVwiLFxuICAgICAgICAgICAgICAoZCkgPT4gYXNPcHQoZCwgXCJkYXRlXCIsIGFzU3RyKSxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgICAgICAgICB9O1xuICAgICAgICB9KSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgcHJvamVjdHM6IHJlcXVpcmVkRmllbGQocmF3LCBcInByb2plY3RzXCIsIFwiXHU2NTcwXHU2MzZFXCIsICh2KSA9PlxuICAgICAgYXNBcnJheSh2LCBcInByb2plY3RzXCIpLm1hcChwYXJzZVByb2plY3QpLFxuICAgICksXG4gICAgaGFiaXRzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiaGFiaXRzXCIsXG4gICAgICBcIlx1NjU3MFx1NjM2RVwiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJoYWJpdHNcIikubWFwKHBhcnNlSGFiaXQpLFxuICAgICAgW10sXG4gICAgKSxcbiAgICB2aXNpb25zOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidmlzaW9uc1wiLFxuICAgICAgXCJcdTY1NzBcdTYzNkVcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwidmlzaW9uc1wiKS5tYXAocGFyc2VWaXNpb24pLFxuICAgICAgW10sXG4gICAgKSxcbiAgICBzZXR0aW5nczogcmVxdWlyZWRGaWVsZChyYXcsIFwic2V0dGluZ3NcIiwgXCJcdTY1NzBcdTYzNkVcIiwgcGFyc2VTZXR0aW5ncyksXG4gICAgdGltZXI6IHJlcXVpcmVkRmllbGQocmF3LCBcInRpbWVyXCIsIFwiXHU2NTcwXHU2MzZFXCIsIHBhcnNlVGltZXIpLFxuICAgIHNlc3Npb25zOiByZXF1aXJlZEZpZWxkKHJhdywgXCJzZXNzaW9uc1wiLCBcIlx1NjU3MFx1NjM2RVwiLCAodikgPT5cbiAgICAgIGFzQXJyYXkodiwgXCJzZXNzaW9uc1wiKS5tYXAocGFyc2VTZXNzaW9uKSxcbiAgICApLFxuICAgIGxvY2s6IGZpZWxkKHJhdywgXCJsb2NrXCIsIFwiXHU2NTcwXHU2MzZFXCIsIHBhcnNlTG9ja1N0YXRlLCB7XG4gICAgICBzY2hlZHVsZXM6IFtdLFxuICAgICAgYWN0aXZlOiBudWxsLFxuICAgICAgc3VwcHJlc3NlZFVudGlsOiAwLFxuICAgIH0pLFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZUFwcERhdGEoZGF0YTogQXBwRGF0YSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBlZHVjYXRpb246IHNlcmlhbGl6ZUVkdWNhdGlvbihkYXRhLmVkdWNhdGlvbiksXG4gICAgdmVyc2lvbjogZGF0YS52ZXJzaW9uLFxuICAgIGlkZW50aXRpZXM6IGRhdGEuaWRlbnRpdGllcy5tYXAoc2VyaWFsaXplSWRlbnRpdHkpLFxuICAgIHRhc2tzOiBkYXRhLnRhc2tzLm1hcChzZXJpYWxpemVUYXNrKSxcbiAgICBibG9ja3M6IGRhdGEuYmxvY2tzLm1hcChzZXJpYWxpemVCbG9jayksXG4gICAgdGVtcGxhdGVzOiBkYXRhLnRlbXBsYXRlcy5tYXAoc2VyaWFsaXplVGVtcGxhdGUpLFxuICAgIHByaW50czogZGF0YS5wcmludHMubWFwKHNlcmlhbGl6ZVByaW50UmVjb3JkKSxcbiAgICBwcm9qZWN0czogZGF0YS5wcm9qZWN0cy5tYXAoc2VyaWFsaXplUHJvamVjdCksXG4gICAgaGFiaXRzOiBkYXRhLmhhYml0cy5tYXAoc2VyaWFsaXplSGFiaXQpLFxuICAgIHZpc2lvbnM6IGRhdGEudmlzaW9ucy5tYXAoc2VyaWFsaXplVmlzaW9uKSxcbiAgICBzZXR0aW5nczogc2VyaWFsaXplU2V0dGluZ3MoZGF0YS5zZXR0aW5ncyksXG4gICAgdGltZXI6IHNlcmlhbGl6ZVRpbWVyKGRhdGEudGltZXIpLFxuICAgIHNlc3Npb25zOiBkYXRhLnNlc3Npb25zLm1hcChzZXJpYWxpemVTZXNzaW9uKSxcbiAgICBsb2NrOiBzZXJpYWxpemVMb2NrU3RhdGUoZGF0YS5sb2NrKSxcbiAgfTtcbn1cblxuaW1wb3J0IHsgc2VyaWFsaXplUHJpbnRSZWNvcmQsIHNlcmlhbGl6ZVRlbXBsYXRlIH0gZnJvbSBcIi4vdGVtcGxhdGVzXCI7XG5pbXBvcnQgeyB2YWxpZGF0ZUJsb2NrIH0gZnJvbSBcIi4vYmxvY2tzXCI7XG5pbXBvcnQgeyBpc0Fic29sdXRlUGF0aCB9IGZyb20gXCIuL2VkdWNhdGlvblwiO1xuIiwgIi8vISBcdTRFQzVcdTY3MkNcdTU3MzAgdjNcdTIxOTJ2NCBcdThGNkNcdTYzNjJcdUZGMUFcdTRFQTRcdTYzNjJcdTY1ODdcdTRFRjZcdTYzMDlcdTVGNTNcdTUyNERcdTcyNDhcdTY3MkNcdTRFMjVcdTY4M0NcdTY4MjFcdTlBOENcdUZGMENcdTRFMERcdThENzBcdThGQzFcdTc5RkJcdThERUZcdTVGODRcdTMwMDJcbi8vISBcdTVCRjlcdTVFOTQgY3JhdGVzL2NvcmUvc3JjL21pZ3JhdGlvbi5yc1x1RkYwOFx1NEVDNVx1NjU4N1x1NEVGNlx1NjgzQ1x1NUYwRlx1OEJFRFx1NEU0OVx1RkYwOVx1MzAwMlxuXG5pbXBvcnQgeyBBcHBFcnJvciB9IGZyb20gXCIuL2Vycm9yc1wiO1xuaW1wb3J0IHsgZGF0ZUF0LCBub3cgfSBmcm9tIFwiLi90aW1lXCI7XG5pbXBvcnQgeyBwYXJzZUFwcERhdGEsIHBhcnNlVGFzaywgc2VyaWFsaXplVGFzayB9IGZyb20gXCIuL2xpYlwiO1xuXG5mdW5jdGlvbiB1cGdyYWRlVGFza1ZhbHVlKHRhc2s6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCB0b2RheTogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IGRhdGUgPVxuICAgIHR5cGVvZiB0YXNrW1wiY3JlYXRlZEF0XCJdID09PSBcIm51bWJlclwiXG4gICAgICA/IGRhdGVBdCh0YXNrW1wiY3JlYXRlZEF0XCJdIGFzIG51bWJlcilcbiAgICAgIDogdG9kYXk7XG4gIGRlbGV0ZSB0YXNrW1wiZ29hbElkXCJdO1xuICBkZWxldGUgdGFza1tcIm5vZGVJZFwiXTtcbiAgaWYgKHRhc2tbXCJkdWVEYXRlXCJdID09PSB1bmRlZmluZWQgfHwgdGFza1tcImR1ZURhdGVcIl0gPT09IG51bGwpIHtcbiAgICB0YXNrW1wiZHVlRGF0ZVwiXSA9IGRhdGU7XG4gIH1cbn1cblxuLyoqXG4gKiBcdThCRkJcdTUzRDZcdTY3MkNcdTU3MzBcdTVCNThcdTUwQThcdUZGMUF2MyBcdTRFMDBcdTZCMjFcdTYwMjdcdThGNkNcdTYzNjJcdUZGMDhcdTc5RkJcdTk2NjRcdTc2RUVcdTY4MDdcdTRFM0JcdTdFQkZcdTMwMDFcdTg4NjVcdTlGNTBcdTY1RTVcdTY3MUZcdUZGMDlcdUZGMEN2NCBcdTc2RjRcdTYzQTVcdTRFMjVcdTY4M0NcdTg5RTNcdTY3OTBcdTMwMDJcbiAqIFx1OEY2Q1x1NjM2Mlx1NTkzMVx1OEQyNVx1NTM5Rlx1NjU4N1x1NEVGNlx1NEZERFx1NzU1OVx1RkYwOFx1NzUzMVx1OEMwM1x1NzUyOFx1NjVCOVx1NEZERFx1OEJDMVx1NEUwRFx1NTE5OVx1NTZERVx1RkYwOVx1MzAwMlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZExvY2FsRGF0YShyYXc6IHN0cmluZyk6IGltcG9ydChcIi4vbGliXCIpLkFwcERhdGEge1xuICBsZXQgdmFsdWU6IHVua25vd247XG4gIHRyeSB7XG4gICAgdmFsdWUgPSBKU09OLnBhcnNlKHJhdyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoYFx1NjU3MFx1NjM2RVx1OEJGQlx1NTNENlx1NTkzMVx1OEQyNVx1RkYwQ1x1NTM5Rlx1NjU4N1x1NEVGNlx1NURGMlx1NEZERFx1NzU1OVx1RkYxQSR7U3RyaW5nKGUpfWApO1xuICB9XG4gIGlmICghaXNPYmplY3QodmFsdWUpKSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2NTcwXHU2MzZFXHU4QkZCXHU1M0Q2XHU1OTMxXHU4RDI1XHVGRjBDXHU1MzlGXHU2NTg3XHU0RUY2XHU1REYyXHU0RkREXHU3NTU5XHVGRjFBXHU2NUUwXHU2NTQ4XHU3Njg0XHU2NzJDXHU1NzMwXHU2NTcwXHU2MzZFXCIpO1xuICB9XG4gIGlmICh2YWx1ZVtcInZlcnNpb25cIl0gPT09IDMpIHtcbiAgICBjb25zdCB0b2RheSA9IGRhdGVBdChub3coKSk7XG4gICAgdmFsdWVbXCJ2ZXJzaW9uXCJdID0gNDtcbiAgICBkZWxldGUgdmFsdWVbXCJnb2Fsc1wiXTtcbiAgICBkZWxldGUgdmFsdWVbXCJub2RlQmluZGluZ3NcIl07XG4gICAgZGVsZXRlIHZhbHVlW1wic2lnbmFsRXZlbnRzXCJdO1xuICAgIGNvbnN0IHRhc2tzID0gdmFsdWVbXCJ0YXNrc1wiXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0YXNrcykpIHtcbiAgICAgIGZvciAoY29uc3QgdGFzayBvZiB0YXNrcykge1xuICAgICAgICBpZiAoaXNPYmplY3QodGFzaykpIHVwZ3JhZGVUYXNrVmFsdWUodGFzaywgdG9kYXkpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCB0ZW1wbGF0ZXMgPSB2YWx1ZVtcInRlbXBsYXRlc1wiXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0ZW1wbGF0ZXMpKSB7XG4gICAgICBmb3IgKGNvbnN0IHRlbXBsYXRlIG9mIHRlbXBsYXRlcykge1xuICAgICAgICBpZiAoIWlzT2JqZWN0KHRlbXBsYXRlKSkgY29udGludWU7XG4gICAgICAgIGNvbnN0IHNoYXBlID0gdGVtcGxhdGVbXCJzaGFwZVwiXTtcbiAgICAgICAgaWYgKGlzT2JqZWN0KHNoYXBlKSkgZGVsZXRlIHNoYXBlW1wiZ29hbElkXCJdO1xuICAgICAgICBjb25zdCBwcmludGluZyA9IHRlbXBsYXRlW1wicHJpbnRpbmdcIl07XG4gICAgICAgIGlmIChcbiAgICAgICAgICBpc09iamVjdChwcmludGluZykgJiZcbiAgICAgICAgICBwcmludGluZ1tcImtpbmRcIl0gPT09IFwib25jZVwiICYmXG4gICAgICAgICAgKHByaW50aW5nW1wiZGF0ZVwiXSA9PT0gbnVsbCB8fCBwcmludGluZ1tcImRhdGVcIl0gPT09IHVuZGVmaW5lZClcbiAgICAgICAgKSB7XG4gICAgICAgICAgcHJpbnRpbmdbXCJkYXRlXCJdID0gdG9kYXk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgcHJpbnRzID0gdmFsdWVbXCJwcmludHNcIl07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocHJpbnRzKSkge1xuICAgICAgdmFsdWVbXCJwcmludHNcIl0gPSBwcmludHMuZmlsdGVyKChwKSA9PiBpc09iamVjdChwKSAmJiBwW1wiZGF0ZVwiXSAhPT0gbnVsbCk7XG4gICAgfVxuICAgIGNvbnN0IHZpc2lvbnMgPSB2YWx1ZVtcInZpc2lvbnNcIl07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmlzaW9ucykpIHtcbiAgICAgIGZvciAoY29uc3QgdmlzaW9uIG9mIHZpc2lvbnMpIHtcbiAgICAgICAgaWYgKGlzT2JqZWN0KHZpc2lvbikpIGRlbGV0ZSB2aXNpb25bXCJnb2FsSWRcIl07XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGlkcyA9IHZhbHVlW1wiaWRlbnRpdGllc1wiXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpZHMpKSB7XG4gICAgICB2YWx1ZVtcImlkZW50aXRpZXNcIl0gPSBpZHMuZmlsdGVyKFxuICAgICAgICAocikgPT5cbiAgICAgICAgICBpc09iamVjdChyKSAmJlxuICAgICAgICAgICFbXCJnb2FsXCIsIFwibm9kZVwiLCBcInNpZ25hbFwiXS5pbmNsdWRlcyhyW1wia2luZFwiXSBhcyBzdHJpbmcpLFxuICAgICAgKTtcbiAgICAgIGZvciAoY29uc3QgcmVjb3JkIG9mIHZhbHVlW1wiaWRlbnRpdGllc1wiXSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVjb3JkW1wicmVzdG9yZVRhc2tcIl0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBsZXQgdGFzazogdW5rbm93bjtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGFzayA9IEpTT04ucGFyc2UocmVjb3JkW1wicmVzdG9yZVRhc2tcIl0gYXMgc3RyaW5nKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoYFx1NjU3MFx1NjM2RVx1OEJGQlx1NTNENlx1NTkzMVx1OEQyNVx1RkYwQ1x1NTM5Rlx1NjU4N1x1NEVGNlx1NURGMlx1NEZERFx1NzU1OVx1RkYxQSR7U3RyaW5nKGUpfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWlzT2JqZWN0KHRhc2spKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXG4gICAgICAgICAgICAgIFwiXHU2NTcwXHU2MzZFXHU4QkZCXHU1M0Q2XHU1OTMxXHU4RDI1XHVGRjBDXHU1MzlGXHU2NTg3XHU0RUY2XHU1REYyXHU0RkREXHU3NTU5XHVGRjFBXHU2NUUwXHU2NTQ4XHU3Njg0XHU0RUZCXHU1MkExXHU2MDYyXHU1OTBEXHU4QkIwXHU1RjU1XCIsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICB1cGdyYWRlVGFza1ZhbHVlKHRhc2ssIHRvZGF5KTtcbiAgICAgICAgICAvLyBcdTY0QTRcdTk1MDBcdTYwNjJcdTU5MERcdTZCRDRcdThGODNcdTc2N0JcdThCQjAgRFRPIFx1NzY4NFx1NUU4Rlx1NTIxN1x1NTMxNlx1RkYwOFx1NTQyQlx1OTUyRVx1NUU4Rlx1RkYwOVx1MzAwMlxuICAgICAgICAgIHJlY29yZFtcInJlc3RvcmVUYXNrXCJdID0gSlNPTi5zdHJpbmdpZnkoXG4gICAgICAgICAgICBzZXJpYWxpemVUYXNrKHBhcnNlVGFzayh0YXNrKSksXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICB0cnkge1xuICAgIHJldHVybiBwYXJzZUFwcERhdGEodmFsdWUpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFxuICAgICAgYFx1NjU3MFx1NjM2RVx1OEJGQlx1NTNENlx1NTkzMVx1OEQyNVx1RkYwQ1x1NTM5Rlx1NjU4N1x1NEVGNlx1NURGMlx1NEZERFx1NzU1OVx1RkYxQSR7ZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpfWAsXG4gICAgKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc09iamVjdCh2OiB1bmtub3duKTogdiBpcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB0eXBlb2YgdiA9PT0gXCJvYmplY3RcIiAmJiB2ICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHYpO1xufVxuIiwgIi8vISBcdTUzRUZcdTg5RTNcdTkxQ0FcdTc2ODRcdTY3MkNcdTU3MzBcdTRGRTFcdTUzRjdcdTMwMDJcdTRFMERcdThDMDNcdTZBMjFcdTU3OEJcdTMwMDFcdTRFMERcdTczMUNcdTdGM0FcdTU5MzFcdTY1NzBcdTYzNkVcdTMwMDFcdTRFMERcdTgxRUFcdTUyQThcdTRFMEJcdTdFRDNcdThCQkFcdTMwMDJcbi8vISBcdTVCRjlcdTVFOTQgY3JhdGVzL2NvcmUvc3JjL2RpYWdub3N0aWNzLnJzXHUzMDAyXG5cbmltcG9ydCB7IGRhdGVBdCwgbWludXRlc09mLCBwYXJzZURhdGUsIGFkZERheXMsIGZvcm1hdERhdGUgfSBmcm9tIFwiLi90aW1lXCI7XG5pbXBvcnQgdHlwZSB7IFNuYXBzaG90LCBUYXNrIH0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IGlzSGFiaXQgfSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHsgd2luZG93TWludXRlcyB9IGZyb20gXCIuL3JlbWluZGVyc1wiO1xuaW1wb3J0IHsgYmxvY2tzT25EYXRlLCBvdmVybGFwTWludXRlcywgcmVxdWlyZWRNaW51dGVzIH0gZnJvbSBcIi4vYmxvY2tzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQW5vbWFseSB7XG4gIGtleTogc3RyaW5nO1xuICBraW5kOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHNldmVyaXR5OiBzdHJpbmc7XG4gIGV2aWRlbmNlOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgcXVlc3Rpb246IHN0cmluZztcbn1cblxuZnVuY3Rpb24gc2lnbmFsKFxuICBrZXk6IHN0cmluZyxcbiAga2luZDogc3RyaW5nLFxuICB0aXRsZTogc3RyaW5nLFxuICBzZXZlcml0eTogc3RyaW5nLFxuICBldmlkZW5jZTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gIHF1ZXN0aW9uOiBzdHJpbmcsXG4pOiBBbm9tYWx5IHtcbiAgcmV0dXJuIHsga2V5LCBraW5kLCB0aXRsZSwgc2V2ZXJpdHksIGV2aWRlbmNlLCBxdWVzdGlvbiB9O1xufVxuXG5mdW5jdGlvbiBtZWRpYW4odmFsdWVzOiBudW1iZXJbXSk6IG51bWJlciB7XG4gIGNvbnN0IHNvcnRlZCA9IFsuLi52YWx1ZXNdLnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcbiAgcmV0dXJuIHNvcnRlZFtNYXRoLmZsb29yKHNvcnRlZC5sZW5ndGggLyAyKV0hO1xufVxuXG4vKipcbiAqIFx1NUJCOVx1OTFDRlx1NjYyRlx1NjYzRVx1NUYwRlx1NzUyOFx1NjIzN1x1OTg4NFx1N0I5N1x1RkYwQ1x1NTQyNlx1NTIxOVx1NTNENlx1NTM4Nlx1NTNGMlx1NkQzQlx1OERDM1x1NjVFNVx1NEUyRFx1NEY0RFx1NjU3MFx1RkYwQ1x1NjcwMFx1NTQwRVx1ODQzRFx1NTIzMFx1NkJDRlx1NjVFNVx1NzZFRVx1NjgwN1x1MzAwMlxuICogXHU1N0ZBXHU3RUJGXHU2NjJGXHU4QkMxXHU2MzZFXHVGRjBDXHU0RTBEXHU2NjJGXHU1M0VGXHU3NTI4XHU2NUY2XHU5NUY0XHUzMDAyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaWFnbm9zZShcbiAgc25hcHNob3Q6IFNuYXBzaG90LFxuICBjYXBhY2l0eU1pbnV0ZXM6IG51bWJlciB8IG51bGwsXG4pOiBBbm9tYWx5W10ge1xuICBjb25zdCBkYXRhID0gc25hcHNob3QuZGF0YTtcbiAgY29uc3QgYXQgPSBzbmFwc2hvdC5zZXJ2ZXJUaW1lO1xuICBjb25zdCB0b2RheSA9IHBhcnNlRGF0ZShzbmFwc2hvdC50b2RheSkhO1xuICBjb25zdCB3ZWVrU3RhcnQgPSBmb3JtYXREYXRlKGFkZERheXModG9kYXksIC03KSk7XG4gIGNvbnN0IG1vbnRoU3RhcnQgPSBmb3JtYXREYXRlKGFkZERheXModG9kYXksIC0yOCkpO1xuICBjb25zdCBieURheSA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gIGZvciAoY29uc3QgcyBvZiBkYXRhLnNlc3Npb25zKSB7XG4gICAgY29uc3QgZGF0ZSA9IGRhdGVBdChzLmVuZGVkQXQpO1xuICAgIGlmIChkYXRlID49IG1vbnRoU3RhcnQgJiYgZGF0ZSA8IHNuYXBzaG90LnRvZGF5KSB7XG4gICAgICBieURheS5zZXQoZGF0ZSwgKGJ5RGF5LmdldChkYXRlKSA/PyAwKSArIE1hdGguZmxvb3Iocy5kdXJhdGlvblNlY3MgLyA2MCkpO1xuICAgIH1cbiAgfVxuICBjb25zdCBhY3RpdmVNaW51dGVzID0gWy4uLmJ5RGF5LnZhbHVlcygpXS5maWx0ZXIoKG0pID0+IG0gPj0gMjApO1xuICBjb25zdCBoaXN0b3JpY2FsID0gYWN0aXZlTWludXRlcy5sZW5ndGggPj0gNSA/IG1lZGlhbihhY3RpdmVNaW51dGVzKSA6IG51bGw7XG4gIGNvbnN0IGNhcGFjaXR5ID1cbiAgICBjYXBhY2l0eU1pbnV0ZXMgIT09IG51bGxcbiAgICAgID8gY2FwYWNpdHlNaW51dGVzXG4gICAgICA6IGhpc3RvcmljYWwgIT09IG51bGxcbiAgICAgICAgPyBNYXRoLm1heCgzMCwgaGlzdG9yaWNhbClcbiAgICAgICAgOiBkYXRhLnNldHRpbmdzLmRhaWx5R29hbCAqIGRhdGEuc2V0dGluZ3MuZm9jdXNNaW51dGVzO1xuICBjb25zdCBjYXBhY2l0eVNvdXJjZSA9XG4gICAgY2FwYWNpdHlNaW51dGVzICE9PSBudWxsXG4gICAgICA/IFwiXHU3NTI4XHU2MjM3XHU4QkJFXHU3RjZFXHU3Njg0XHU2NUU1XHU5ODg0XHU3Qjk3XCJcbiAgICAgIDogaGlzdG9yaWNhbCAhPT0gbnVsbFxuICAgICAgICA/IFwiXHU4RkQxMjhcdTU5MjlcdTgxRjNcdTVDMTE1XHU0RTJBXHU2RDNCXHU4REMzXHU2NUU1XHU3Njg0XHU0RTJEXHU0RjREXHU2NTcwXHVGRjA4XHU1RTc2XHU5NzVFXHU1M0VGXHU3NTI4XHU2NUY2XHU5NUY0XHVGRjA5XCJcbiAgICAgICAgOiBcIlx1NkJDRlx1NjVFNVx1NzU2QVx1ODMwNFx1NzZFRVx1NjgwN1x1OTg4NFx1N0I5N1x1RkYwOFx1NUU3Nlx1OTc1RVx1NTNFRlx1NzUyOFx1NjVGNlx1OTVGNFx1RkYwOVwiO1xuICBjb25zdCBjb21wbGV0ZWRSb3VuZHMgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICBmb3IgKGNvbnN0IHMgb2YgZGF0YS5zZXNzaW9ucykge1xuICAgIGlmIChzLmNvbXBsZXRlZCAmJiBzLnRhc2tJZCAhPT0gbnVsbCkge1xuICAgICAgY29tcGxldGVkUm91bmRzLnNldChzLnRhc2tJZCwgKGNvbXBsZXRlZFJvdW5kcy5nZXQocy50YXNrSWQpID8/IDApICsgMSk7XG4gICAgfVxuICB9XG4gIGNvbnN0IHJlc3VsdDogQW5vbWFseVtdID0gW107XG4gIGZvciAobGV0IG9mZnNldCA9IDA7IG9mZnNldCA8IDM7IG9mZnNldCArPSAxKSB7XG4gICAgY29uc3QgZGF0ZSA9IGZvcm1hdERhdGUoYWRkRGF5cyh0b2RheSwgb2Zmc2V0KSk7XG4gICAgY29uc3QgdGFza3MgPSBkYXRhLnRhc2tzLmZpbHRlcihcbiAgICAgICh0KSA9PiB0LmR1ZURhdGUgPT09IGRhdGUgJiYgIXQuY29tcGxldGVkICYmICFkYXRhLnRhc2tJc1ZvaWQodCksXG4gICAgKTtcbiAgICBjb25zdCBtaW51dGVzID0gdGFza3MucmVkdWNlKFxuICAgICAgKG4sIHQpID0+XG4gICAgICAgIG4gK1xuICAgICAgICBNYXRoLm1heCgwLCB0LmVzdGltYXRlIC0gKGNvbXBsZXRlZFJvdW5kcy5nZXQodC5pZCkgPz8gMCkpICpcbiAgICAgICAgICAodC5mb2N1c01pbnV0ZXMgPz8gZGF0YS5zZXR0aW5ncy5mb2N1c01pbnV0ZXMpLFxuICAgICAgMCxcbiAgICApO1xuICAgIGNvbnN0IGRheSA9IHBhcnNlRGF0ZShkYXRlKTtcbiAgICBjb25zdCBibG9ja2VkTWludXRlcyA9IHJlcXVpcmVkTWludXRlcyhkYXRhLmJsb2NrcywgZGF0ZSk7XG4gICAgaWYgKGNhcGFjaXR5ID4gMCAmJiBtaW51dGVzICogMTAwID4gY2FwYWNpdHkgKiAxMzApIHtcbiAgICAgIHJlc3VsdC5wdXNoKFxuICAgICAgICBzaWduYWwoXG4gICAgICAgICAgYG92ZXJsb2FkLyR7ZGF0ZX1gLFxuICAgICAgICAgIFwib3ZlcmxvYWRcIixcbiAgICAgICAgICBcIlx1OEJBMVx1NTIxMlx1NzUyOFx1NjVGNlx1OUFEOFx1NEU4RVx1NUY1M1x1NTI0RFx1OTg4NFx1N0I5N1wiLFxuICAgICAgICAgIFwid2FybmluZ1wiLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGRhdGUsXG4gICAgICAgICAgICByZW1haW5pbmdQbGFubmVkTWludXRlczogbWludXRlcyxcbiAgICAgICAgICAgIGJ1ZGdldE1pbnV0ZXM6IGNhcGFjaXR5LFxuICAgICAgICAgICAgYnVkZ2V0U291cmNlOiBjYXBhY2l0eVNvdXJjZSxcbiAgICAgICAgICAgIGJsb2NrZWRNaW51dGVzLFxuICAgICAgICAgICAgdGFza0lkczogdGFza3Muc2xpY2UoMCwgMzApLm1hcCgodCkgPT4gdC5pZCksXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIlx1OEZEOVx1NEU5Qlx1NEVGQlx1NTJBMVx1NzY4NFx1OTg4NFx1OEJBMVx1NzUyOFx1NjVGNlx1NjYyRlx1NTQyNlx1NTFDNlx1Nzg2RVx1RkYxRlx1OEZEOVx1NEUwMFx1NTkyOVx1NjcwOVx1OTg5RFx1NTkxNlx1NTNFRlx1NzUyOFx1NjVGNlx1OTVGNFx1RkYwQ1x1OEZEOFx1NjYyRlx1OTcwMFx1ODk4MVx1NTFDRlx1OTFDRlx1NjIxNlx1NjMyQVx1NTJBOFx1RkYxRlwiLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgb2Zmc2V0ID09PSAxICYmXG4gICAgICBoaXN0b3JpY2FsICE9PSBudWxsICYmXG4gICAgICB0YXNrcy5sZW5ndGggPiAwICYmXG4gICAgICBtaW51dGVzICogMTAwIDwgY2FwYWNpdHkgKiAzMFxuICAgICkge1xuICAgICAgcmVzdWx0LnB1c2goXG4gICAgICAgIHNpZ25hbChcbiAgICAgICAgICBgdW5kZXJsb2FkLyR7ZGF0ZX1gLFxuICAgICAgICAgIFwidW5kZXJsb2FkXCIsXG4gICAgICAgICAgXCJcdTY2MEVcdTY1RTVcdTVCODlcdTYzOTJcdTY2MEVcdTY2M0VcdTRGNEVcdTRFOEVcdThGRDFcdTY3MUZcdTYyOTVcdTUxNjVcIixcbiAgICAgICAgICBcIm5vdGljZVwiLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGRhdGUsXG4gICAgICAgICAgICBwbGFubmVkTWludXRlczogbWludXRlcyxcbiAgICAgICAgICAgIGJhc2VsaW5lTWludXRlczogY2FwYWNpdHksXG4gICAgICAgICAgICBiYXNlbGluZVNvdXJjZTogY2FwYWNpdHlTb3VyY2UsXG4gICAgICAgICAgICBibG9ja2VkTWludXRlcyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiXHU2NjBFXHU1OTI5XHU2NjJGXHU2NzA5XHU2MTBGXHU0RjExXHU2MDZGXHUzMDAxXHU4QkZFXHU3QTBCXHU1MzYwXHU3NTI4XHVGRjBDXHU4RkQ4XHU2NjJGXHU4QkExXHU1MjEyXHU1QzFBXHU2NzJBXHU4ODY1XHU5RjUwXHVGRjFGXHU0RTBEXHU4OTgxXHU0RUM1XHU1MUVEXHU3QTdBXHU5NUYyXHU2M0E4XHU2NUFEXHU1RTk0XHU4QkU1XHU1MkEwXHU0RUZCXHU1MkExXHUzMDAyXCIsXG4gICAgICAgICksXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCB0aW1lZDogeyBzdGFydDogbnVtYmVyOyB0YXNrOiBUYXNrIH1bXSA9IHRhc2tzXG4gICAgICAubWFwKCh0KSA9PiAoe1xuICAgICAgICBzdGFydDogdC5yZW1pbmRlclRpbWUgIT09IG51bGwgPyAobWludXRlc09mKHQucmVtaW5kZXJUaW1lKSA/PyAtMSkgOiAtMSxcbiAgICAgICAgdGFzazogdCxcbiAgICAgIH0pKVxuICAgICAgLmZpbHRlcigoeCkgPT4geC5zdGFydCA+PSAwKVxuICAgICAgLnNvcnQoXG4gICAgICAgIChhLCBiKSA9PlxuICAgICAgICAgIGEuc3RhcnQgLSBiLnN0YXJ0IHx8XG4gICAgICAgICAgKGEudGFzay5pZCA8IGIudGFzay5pZCA/IC0xIDogYS50YXNrLmlkID4gYi50YXNrLmlkID8gMSA6IDApLFxuICAgICAgKTtcbiAgICAvLyBcdTk3MDBcdTRFMTNcdTVGQzNcdTc2ODRcdTY1RjZcdTZCQjVcdTYyNERcdTY3ODRcdTYyMTBcdTc3MUZcdTVCOUVcdTUxQjJcdTdBODFcdUZGMUJcdTZDMzRcdThCRkVcdTZCNjNcdTY2MkZcdTVFNzZcdTg4NENcdTRGNUNcdTRFMUFcdTc2ODRcdTU3MzBcdTY1QjlcdUZGMENcdTRGRERcdTYzMDFcdTVCODlcdTk3NTlcdTMwMDJcbiAgICBpZiAoZGF5ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCByZXF1aXJlZCA9IGJsb2Nrc09uRGF0ZShkYXRhLmJsb2NrcywgZGF0ZSkuZmlsdGVyKFxuICAgICAgICAoYikgPT4gYi5hdHRlbnRpb24gPT09IFwicmVxdWlyZWRcIixcbiAgICAgICk7XG4gICAgICBmb3IgKGNvbnN0IHsgc3RhcnQsIHRhc2sgfSBvZiB0aW1lZCkge1xuICAgICAgICBjb25zdCBlbmQgPSBzdGFydCArIHdpbmRvd01pbnV0ZXModGFzaywgZGF0YS5zZXR0aW5ncyk7XG4gICAgICAgIGZvciAoY29uc3QgYmFuZCBvZiByZXF1aXJlZCkge1xuICAgICAgICAgIGNvbnN0IG92ZXJsYXAgPSBvdmVybGFwTWludXRlcyhiYW5kLCBkYXRlLCBzdGFydCwgZW5kKTtcbiAgICAgICAgICBpZiAob3ZlcmxhcCA+IDApIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKFxuICAgICAgICAgICAgICBzaWduYWwoXG4gICAgICAgICAgICAgICAgYGJsb2NrLyR7ZGF0ZX0vJHt0YXNrLmlkfS8ke2JhbmQuaWR9YCxcbiAgICAgICAgICAgICAgICBcImJsb2NrQ29uZmxpY3RcIixcbiAgICAgICAgICAgICAgICBcIlx1OEJBMVx1NTIxMlx1NjVGNlx1NkJCNVx1ODQzRFx1NTcyOFx1OTcwMFx1NEUxM1x1NUZDM1x1NzY4NFx1OEJGRVx1N0EwQlx1NTE4NVwiLFxuICAgICAgICAgICAgICAgIFwid2FybmluZ1wiLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRhdGUsXG4gICAgICAgICAgICAgICAgICB0YXNrSWQ6IHRhc2suaWQsXG4gICAgICAgICAgICAgICAgICB0YXNrVGl0bGU6IHRhc2sudGl0bGUsXG4gICAgICAgICAgICAgICAgICBibG9ja0lkOiBiYW5kLmlkLFxuICAgICAgICAgICAgICAgICAgYmxvY2tUaXRsZTogYmFuZC50aXRsZSxcbiAgICAgICAgICAgICAgICAgIGJsb2NrU3RhcnQ6IGJhbmQuc3RhcnQsXG4gICAgICAgICAgICAgICAgICBibG9ja0VuZDogYmFuZC5lbmQsXG4gICAgICAgICAgICAgICAgICBvdmVybGFwTWludXRlczogb3ZlcmxhcCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwiXHU4RkQ5XHU2QkI1XHU1Qjg5XHU2MzkyXHU1NDhDXHU4OTgxXHU0RTEzXHU1RkMzXHU1NDJDXHU3Njg0XHU4QkZFXHU5MUNEXHU1M0UwXHVGRjFBXHU4MEZEXHU2MzJBXHU1MjMwXHU2QzM0XHU4QkZFXHU2NUY2XHU2QkI1XHU2MjE2XHU4QkZFXHU1NDBFXHU1NDE3XHVGRjFGXHU1OTgyXHU2NzlDXHU3ODZFXHU1QjlFXHU4OTgxXHU4QkZFXHU0RTBBXHU1MDVBXHVGRjBDXHU4QkY0XHU2NjBFXHU1NDBFXHU2MjExXHU0RTBEXHU0RjFBXHU1MThEXHU2MjhBXHU1QjgzXHU1RjUzXHU1MUIyXHU3QTgxXHUzMDAyXCIsXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBcdThCQjBcdTVGNTVcdTVFRjZcdTRGMzhcdTUyMzBcdTY3MDBcdTUzRjNcdTRGQTdcdTc2ODRcdTUzM0FcdTk1RjRcdUZGMUJcdTUzRUFcdTRFMEVcdTc2RjhcdTkwQkJcdTZCRDRcdThGODNcdTRGMUFcdTZGMEZcdTYzODlcdTRFMDBcdTRFMkFcdTk1N0ZcdThCRkVcdTdBMEJcdTg5ODZcdTc2RDZcdTU5MUFcdTRFMkFcdTc3RURcdTRFRkJcdTUyQTFcdTMwMDJcbiAgICBsZXQgcHJldmlvdXM6IHsgZW5kOiBudW1iZXI7IHRhc2s6IFRhc2sgfSB8IG51bGwgPSBudWxsO1xuICAgIGZvciAoY29uc3QgeyBzdGFydCwgdGFzayB9IG9mIHRpbWVkKSB7XG4gICAgICBjb25zdCBlbmQgPSBzdGFydCArIHdpbmRvd01pbnV0ZXModGFzaywgZGF0YS5zZXR0aW5ncyk7XG4gICAgICBpZiAocHJldmlvdXMgIT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgcHJldiA9IHByZXZpb3VzO1xuICAgICAgICBpZiAoc3RhcnQgPCBwcmV2LmVuZCkge1xuICAgICAgICAgIGNvbnN0IGlkcyA9IFtwcmV2LnRhc2suaWQsIHRhc2suaWRdLnNvcnQoKTtcbiAgICAgICAgICBjb25zdCBiYW5kID1cbiAgICAgICAgICAgIGRheSA9PT0gbnVsbFxuICAgICAgICAgICAgICA/IG51bGxcbiAgICAgICAgICAgICAgOiBkYXRhLmJsb2Nrcy5maW5kKFxuICAgICAgICAgICAgICAgICAgKGIpID0+XG4gICAgICAgICAgICAgICAgICAgIGIuYXR0ZW50aW9uID09PSBcImxpZ2h0XCIgJiZcbiAgICAgICAgICAgICAgICAgICAgb3ZlcmxhcE1pbnV0ZXMoYiwgZGF0ZSwgc3RhcnQsIE1hdGgubWluKHByZXYuZW5kLCBlbmQpKSA+IDAsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICByZXN1bHQucHVzaChcbiAgICAgICAgICAgIHNpZ25hbChcbiAgICAgICAgICAgICAgYGNvbGxpc2lvbi8ke2RhdGV9LyR7aWRzWzBdfS8ke2lkc1sxXX1gLFxuICAgICAgICAgICAgICBcImNvbGxpc2lvblwiLFxuICAgICAgICAgICAgICBcIlx1NEUyNFx1NEUyQVx1OEJBMVx1NTIxMlx1NjVGNlx1NkJCNVx1OTFDRFx1NTNFMFwiLFxuICAgICAgICAgICAgICBcIndhcm5pbmdcIixcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGRhdGUsXG4gICAgICAgICAgICAgICAgdGFza0lkczogaWRzLFxuICAgICAgICAgICAgICAgIHRpdGxlczogW3ByZXYudGFzay50aXRsZSwgdGFzay50aXRsZV0sXG4gICAgICAgICAgICAgICAgb3ZlcmxhcE1pbnV0ZXM6IE1hdGgubWluKHByZXYuZW5kLCBlbmQpIC0gc3RhcnQsXG4gICAgICAgICAgICAgICAgaW5jbHVkZXNCcmVha3M6IHRydWUsXG4gICAgICAgICAgICAgICAgYmxvY2tUaXRsZTogYmFuZD8udGl0bGUgPz8gbnVsbCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXCJcdThGRDlcdTRFMjRcdTRFMkFcdTVCODlcdTYzOTJcdTgwRkRcdTU0MjZcdTU0MENcdTY1RjZcdTVCOENcdTYyMTBcdUZGMUZcdTU5ODJcdTY3OUNcdTY2MkZcdTU3MjhcdTU0MENcdTRFMDBcdThCRkVcdTdBMEJcdTUxODVcdTUwNUFcdTRGNUNcdTRFMUFcdUZGMENcdThCRjdcdThCRjRcdTY2MEVcdUZGMENcdTkwN0ZcdTUxNERcdTYyOEFcdTUxNDFcdThCQjhcdTc2ODRcdTVFNzZcdTg4NENcdThCRUZcdTUyMjRcdTRFM0FcdTUxQjJcdTdBODFcdTMwMDJcIixcbiAgICAgICAgICAgICksXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZW5kIDw9IHByZXZpb3VzLmVuZCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwcmV2aW91cyA9IHsgZW5kLCB0YXNrIH07XG4gICAgfVxuICB9XG4gIGNvbnN0IGhhYml0cyA9IG5ldyBNYXA8XG4gICAgc3RyaW5nLFxuICAgIHsgc2NoZWR1bGVkOiBudW1iZXI7IG1pc3NlZDogbnVtYmVyOyBpZHM6IHN0cmluZ1tdIH1cbiAgPigpO1xuICBmb3IgKGNvbnN0IHQgb2YgZGF0YS50YXNrcykge1xuICAgIGlmIChcbiAgICAgICFpc0hhYml0KHQpIHx8XG4gICAgICB0LmR1ZURhdGUgPT09IG51bGwgfHxcbiAgICAgICEodC5kdWVEYXRlID49IHdlZWtTdGFydCAmJiB0LmR1ZURhdGUgPCBzbmFwc2hvdC50b2RheSlcbiAgICApIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBrZXkgPSB0LmhhYml0SWQgPz8gdC50ZW1wbGF0ZUlkID8/IHQuaWQ7XG4gICAgY29uc3QgZW50cnkgPSBoYWJpdHMuZ2V0KGtleSkgPz8geyBzY2hlZHVsZWQ6IDAsIG1pc3NlZDogMCwgaWRzOiBbXSB9O1xuICAgIGVudHJ5LnNjaGVkdWxlZCArPSAxO1xuICAgIGlmICghdC5jb21wbGV0ZWQgJiYgdC5yZW1pbmRlckV4cGlyZWQpIHtcbiAgICAgIGVudHJ5Lm1pc3NlZCArPSAxO1xuICAgICAgZW50cnkuaWRzLnB1c2godC5pZCk7XG4gICAgfVxuICAgIGhhYml0cy5zZXQoa2V5LCBlbnRyeSk7XG4gIH1cbiAgZm9yIChjb25zdCBbaWQsIHsgc2NoZWR1bGVkLCBtaXNzZWQsIGlkcyB9XSBvZiBoYWJpdHMpIHtcbiAgICBpZiAoc2NoZWR1bGVkID49IDQgJiYgbWlzc2VkID49IDMgJiYgbWlzc2VkICogMTAwID49IHNjaGVkdWxlZCAqIDUwKSB7XG4gICAgICByZXN1bHQucHVzaChcbiAgICAgICAgc2lnbmFsKFxuICAgICAgICAgIGBoYWJpdC8ke2lkfWAsXG4gICAgICAgICAgXCJoYWJpdEFic2VuY2VcIixcbiAgICAgICAgICBcIlx1OEZEMVx1NEUwMFx1NTQ2OFx1NEU2MFx1NjBFRlx1NTkxQVx1NkIyMVx1NjcyQVx1NUI4Q1x1NjIxMFwiLFxuICAgICAgICAgIFwid2FybmluZ1wiLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGhhYml0SWQ6IGlkLFxuICAgICAgICAgICAgb2JzZXJ2ZWRPY2N1cnJlbmNlczogc2NoZWR1bGVkLFxuICAgICAgICAgICAgbWlzc2VkT2NjdXJyZW5jZXM6IG1pc3NlZCxcbiAgICAgICAgICAgIHdpbmRvd1N0YXJ0OiB3ZWVrU3RhcnQsXG4gICAgICAgICAgICB3aW5kb3dFbmQ6IHNuYXBzaG90LnRvZGF5LFxuICAgICAgICAgICAgdGFza0lkczogaWRzLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJcdTY2MkZcdTY1RjZcdTk1RjRcdTVCODlcdTYzOTJcdTRFMERcdTU0MDhcdTkwMDJcdTMwMDFcdTRFRkJcdTUyQTFcdTU5MkFcdTk2QkVcdTMwMDFcdTU5MTZcdTkwRThcdTUzNjBcdTc1MjhcdUZGMENcdThGRDhcdTY2MkZcdTVERjJcdTdFQ0ZcdTRFMERcdTYwRjNcdTdFRTdcdTdFRURcdThGRDlcdTRFMkFcdTRFNjBcdTYwRUZcdUZGMUZcdTUxNDhcdTc4NkVcdThCQTRcdTUzOUZcdTU2RTBcdTUxOERcdTY1MzlcdThCQTFcdTUyMTJcdTMwMDJcIixcbiAgICAgICAgKSxcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIGNvbnN0IHJlY2VudFNlc3Npb25zID0gZGF0YS5zZXNzaW9ucy5maWx0ZXIoXG4gICAgKHMpID0+IHMuc291cmNlID09PSBcInRpbWVyXCIgJiYgcy5lbmRlZEF0ID49IGF0IC0gNyAqIDg2NDAwLFxuICApO1xuICBjb25zdCBsYXRlID0gcmVjZW50U2Vzc2lvbnMuZmlsdGVyKChzKSA9PiB7XG4gICAgY29uc3QgaG91ciA9IG5ldyBEYXRlKHMuZW5kZWRBdCAqIDEwMDApLmdldEhvdXJzKCk7XG4gICAgcmV0dXJuICEoaG91ciA+PSA2ICYmIGhvdXIgPCAyMyk7XG4gIH0pO1xuICBjb25zdCBkaXN0aW5jdExhdGUgPSBuZXcgU2V0KGxhdGUubWFwKChzKSA9PiBkYXRlQXQocy5lbmRlZEF0KSkpO1xuICBpZiAoZGlzdGluY3RMYXRlLnNpemUgPj0gMykge1xuICAgIHJlc3VsdC5wdXNoKFxuICAgICAgc2lnbmFsKFxuICAgICAgICBcInJoeXRobS9sYXRlXCIsXG4gICAgICAgIFwicmh5dGhtRHJpZnRcIixcbiAgICAgICAgXCJcdThGRDFcdTRFMDBcdTU0NjhcdTU5MUFcdTU5MjlcdTY3MDlcdTZERjFcdTU5MUNcdTRFMTNcdTZDRThcdThCQjBcdTVGNTVcIixcbiAgICAgICAgXCJub3RpY2VcIixcbiAgICAgICAge1xuICAgICAgICAgIGxhdGVEYXRlczogWy4uLmRpc3RpbmN0TGF0ZV0sXG4gICAgICAgICAgbGF0ZVNlc3Npb25Db3VudDogbGF0ZS5sZW5ndGgsXG4gICAgICAgICAgd2luZG93OiBcIjIzOjAwXHUyMDEzMDY6MDAgXHU2NzJDXHU2NzNBXHU2NUY2XHU5NUY0XCIsXG4gICAgICAgICAgc2FtcGxlU2Vzc2lvbnM6IHJlY2VudFNlc3Npb25zLmxlbmd0aCxcbiAgICAgICAgfSxcbiAgICAgICAgXCJcdThGRDlcdTY2MkZcdTRFMzRcdTY1RjZcdTVCODlcdTYzOTJcdThGRDhcdTY2MkZcdTdCMjZcdTU0MDhcdTRGNjBcdTc2ODRcdTRGNUNcdTYwNkZcdUZGMUZcdTdFRDNcdTU0MDhcdTRGNjBcdTc4NkVcdThCQTRcdTc2ODRcdTc3NjFcdTc3MjBcdTU0OENcdThCRkVcdTdBMEJcdTRGRTFcdTYwNkZcdTUyMjRcdTY1QURcdUZGMENcdTRFMERcdTRFRTVcdTdFREZcdTRFMDBcdTRGNUNcdTYwNkZcdThCQzRcdTRFRjdcdTc1MjhcdTYyMzdcdTMwMDJcIixcbiAgICAgICksXG4gICAgKTtcbiAgfVxuICBjb25zdCByZWNlbnREYXlzID0gWy4uLmJ5RGF5LmtleXMoKV0uZmlsdGVyKChkKSA9PiBkID49IHdlZWtTdGFydCkubGVuZ3RoO1xuICBpZiAoaGlzdG9yaWNhbCAhPT0gbnVsbCAmJiByZWNlbnREYXlzID49IDMpIHtcbiAgICBjb25zdCByZWNlbnQgPSBbLi4uYnlEYXkuZW50cmllcygpXVxuICAgICAgLmZpbHRlcigoW2RdKSA9PiBkID49IHdlZWtTdGFydClcbiAgICAgIC5tYXAoKFssIG1dKSA9PiBtKTtcbiAgICBpZiAoXG4gICAgICByZWNlbnQucmVkdWNlKChuLCBtKSA9PiBuICsgbSwgMCkgKiAxMDAgPFxuICAgICAgaGlzdG9yaWNhbCAqIHJlY2VudC5sZW5ndGggKiA0MFxuICAgICkge1xuICAgICAgcmVzdWx0LnB1c2goXG4gICAgICAgIHNpZ25hbChcbiAgICAgICAgICBcImVuZ2FnZW1lbnQvZHJvcFwiLFxuICAgICAgICAgIFwiZW5nYWdlbWVudERyb3BcIixcbiAgICAgICAgICBcIlx1OEZEMVx1NjcxRlx1OEJCMFx1NUY1NVx1NzY4NFx1NjI5NVx1NTE2NVx1NjYwRVx1NjYzRVx1NEUwQlx1OTY0RFwiLFxuICAgICAgICAgIFwibm90aWNlXCIsXG4gICAgICAgICAge1xuICAgICAgICAgICAgcmVjZW50QWN0aXZlRGF5czogcmVjZW50Lmxlbmd0aCxcbiAgICAgICAgICAgIHJlY2VudE1lYW5NaW51dGVzOlxuICAgICAgICAgICAgICByZWNlbnQubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgID8gTWF0aC5mbG9vcihyZWNlbnQucmVkdWNlKChuLCBtKSA9PiBuICsgbSwgMCkgLyByZWNlbnQubGVuZ3RoKVxuICAgICAgICAgICAgICAgIDogMCxcbiAgICAgICAgICAgIGJhc2VsaW5lTWludXRlczogaGlzdG9yaWNhbCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiXHU2NjJGXHU1NDI2XHU2NzA5XHU4MDAzXHU4QkQ1XHUzMDAxXHU4QkZFXHU3QTBCXHUzMDAxXHU4RUFCXHU0RjUzXHU3MkI2XHU2MDAxXHU2MjE2XHU3RUJGXHU0RTBCXHU1QjY2XHU0RTYwXHU1M0Q4XHU1MzE2XHVGRjFGXHU1MTQ4XHU4ODY1XHU1MTY4XHU4QkIwXHU1RjU1XHU4MENDXHU2NjZGXHVGRjBDXHU1MThEXHU1MUIzXHU1QjlBXHU2NjJGXHU1NDI2XHU4QzAzXHU2NTc0XHU4MjgyXHU1OTRGXHUzMDAyXCIsXG4gICAgICAgICksXG4gICAgICApO1xuICAgIH1cbiAgfVxuICByZXN1bHQuc29ydCgoYSwgYikgPT4gKGEua2V5IDwgYi5rZXkgPyAtMSA6IGEua2V5ID4gYi5rZXkgPyAxIDogMCkpO1xuICByZXR1cm4gcmVzdWx0LnNsaWNlKDAsIDMwKTtcbn1cbiIsICIvLyEgXHU0RTEzXHU2Q0U4XHU0RkREXHU2MkE0XHU3Njg0XHU3RUFGXHU4QkExXHU3Qjk3XHU5MEU4XHU1MjA2XHVGRjFBXHU3QTk3XHU1M0UzXHU5NkM2XHU1NDA4XHU0RTBFXHU3NjdEXHU1NDBEXHU1MzU1XHU1MjI0XHU1QjlBXHUzMDAyXG4vLyEgXHU1QkY5XHU1RTk0IGNyYXRlcy9jb3JlL3NyYy9ndWFyZC5ycyBcdTc2ODQgYGFsbG93ZWRgIFx1NEUwRSBndWFyZF93aW5kb3dzLnJzIFx1NzY4NFxuLy8hIGFwcC1pZCBcdTg5RTNcdTY3OTBcdUZGMDhBVU1JRCAvIEFwcGxpY2F0aW9uRnJhbWVIb3N0IFx1NTE3MVx1NEVBQiBVV1AgXHU2ODQ2XHU2N0I2IC8gXHU1QjhDXHU2NTc0XHU4RkRCXHU3QTBCXHU4REVGXHU1Rjg0XHVGRjA5XHUzMDAyXG4vLyEgXHU0RTBEXHU1MDVBXHU0RUZCXHU0RjU1XHU2ODRDXHU5NzYyXHU4QzAzXHU3NTI4XHUyMDE0XHUyMDE0XHU2NzlBXHU0RTNFXHUzMDAxXHU4MDVBXHU3MTI2XHU0RTBFXHU5NTAxXHU1QzRGXHU2MjY3XHU4ODRDXHU3NTMxXHU1MzlGXHU3NTFGIGd1YXJkIFx1OEQxRlx1OEQyM1x1MzAwMlxuXG5pbXBvcnQgdHlwZSB7IFByb3RlY3Rpb24sIFdpbmRvdyB9IGZyb20gXCIuL21vZGVsXCI7XG5cbi8qKlxuICogXHU3NjdEXHU1NDBEXHU1MzU1XHU1MjI0XHU1QjlBXHVGRjA4Z3VhcmQ6OmFsbG93ZWRcdUZGMDlcdUZGMUFcbiAqIFx1NjcyQ1x1OEZEQlx1N0EwQlx1N0E5N1x1NTNFM1x1NTlDQlx1N0VDOFx1NjUzRVx1ODg0Q1x1RkYxQm9mZiBcdTY1M0VcdTg4NENcdTRFMDBcdTUyMDdcdUZGMUJ3aGl0ZWxpc3QgXHU3Q0JFXHU3ODZFXHU1MzM5XHU5MTREIGFwcElkXHVGRjFCXG4gKiBsb2NrIFx1NUZGRFx1NzU2NVx1NzY3RFx1NTQwRFx1NTM1NVx1MzAwMlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb3dlZChcbiAgd2luZG93OiBXaW5kb3csXG4gIG93blBpZDogbnVtYmVyLFxuICBwcm90ZWN0aW9uOiBQcm90ZWN0aW9uLFxuKTogYm9vbGVhbiB7XG4gIGlmICh3aW5kb3cucGlkICE9PSBudWxsICYmIHdpbmRvdy5waWQgPT09IG93blBpZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiAoXG4gICAgcHJvdGVjdGlvbi5tb2RlID09PSBcIm9mZlwiIHx8XG4gICAgKHByb3RlY3Rpb24ubW9kZSA9PT0gXCJ3aGl0ZWxpc3RcIiAmJlxuICAgICAgd2luZG93LmFwcElkICE9PSBudWxsICYmXG4gICAgICBwcm90ZWN0aW9uLndoaXRlbGlzdC5zb21lKChhbGxvd2VkSWQpID0+IGFsbG93ZWRJZCA9PT0gd2luZG93LmFwcElkKSlcbiAgKTtcbn1cblxuLyoqIFVXUCBcdTVFOTRcdTc1MjhcdTVDMDFcdTg4QzVcdTRFM0EgYGF1bWlkOntpZH1gXHVGRjA4Z3VhcmRfd2luZG93czo6aWRlbnRpdHlcdUZGMDlcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRBdW1pZChpZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGBhdW1pZDoke2lkfWA7XG59XG5cbi8qKlxuICogQXBwbGljYXRpb25GcmFtZUhvc3QuZXhlIFx1NjYyRlx1NTE3MVx1NEVBQlx1Njg0Nlx1NjdCNlx1OEZEQlx1N0EwQlx1RkYxQVx1NUI4M1x1NjcyQ1x1OEVBQlx1NEUwRFx1NEVFM1x1ODg2OFx1NEVGQlx1NEY1NVx1NEUwMFx1NEUyQVx1NjI1OFx1N0JBMVx1NUU5NFx1NzUyOFx1RkYwQ1xuICogXHU2Mzg4XHU0RTg4XHU1QjgzXHU3QjQ5XHU0RThFXHU2NTNFXHU4ODRDXHU1MTY4XHU5MEU4IFVXUCBcdTVFOTRcdTc1MjhcdTMwMDJcdTUyMjRcdTY1QURcdTYzMDlcdTVCOENcdTY1NzRcdThERUZcdTVGODRcdTc2ODRcdTY3MDBcdTU0MEVcdTRFMDBcdTZCQjVcdTMwMDFcdTRFMERcdTUzM0FcdTUyMDZcdTU5MjdcdTVDMEZcdTUxOTlcdTMwMDJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQXBwbGljYXRpb25GcmFtZUhvc3QocHJvY2Vzc1BhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBuYW1lID0gcHJvY2Vzc1BhdGguc3BsaXQoL1tcXFxcL10vKS5wb3AoKSA/PyBcIlwiO1xuICByZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpID09PSBcImFwcGxpY2F0aW9uZnJhbWVob3N0LmV4ZVwiO1xufVxuXG4vKipcbiAqIFx1NTE3MVx1NEVBQlx1Njg0Nlx1NjdCNlx1N0E5N1x1NTNFM1x1NzY4NFx1NjI1OFx1N0JBMVx1NUU5NFx1NzUyOFx1OTAwOVx1NjJFOVx1RkYxQVx1NTNENlx1N0IyQ1x1NEUwMFx1NEUyQVx1N0M3Qlx1NTQwRFx1NEUzQVxuICogYFdpbmRvd3MuVUkuQ29yZS5Db3JlV2luZG93YCBcdTRFMTQgUElEIFx1MjI2MCBcdTVCQkZcdTRFM0IgUElEIFx1NzY4NFx1NUI1MFx1N0E5N1x1NTNFM1xuICogXHVGRjA4Z3VhcmRfd2luZG93czo6Y29udGVudFx1RkYwOVx1MzAwMlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0RnJhbWVDb250ZW50UGlkKFxuICBob3N0UGlkOiBudW1iZXIsXG4gIGNoaWxkcmVuOiB7IGNsYXNzTmFtZTogc3RyaW5nOyBwaWQ6IG51bWJlciB9W10sXG4pOiBudW1iZXIgfCBudWxsIHtcbiAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgIGlmIChcbiAgICAgIGNoaWxkLmNsYXNzTmFtZSA9PT0gXCJXaW5kb3dzLlVJLkNvcmUuQ29yZVdpbmRvd1wiICYmXG4gICAgICBjaGlsZC5waWQgIT09IDAgJiZcbiAgICAgIGNoaWxkLnBpZCAhPT0gaG9zdFBpZFxuICAgICkge1xuICAgICAgcmV0dXJuIGNoaWxkLnBpZDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG4iLCAiLy8hIEVuZ2luZVx1RkYxQVx1OTg4NFx1NjhDMC9cdTYzRDBcdTRFQTQvXHU2MzAxXHU0RTQ1XHU1MzE2L1x1NUZFQlx1NzE2N1x1MzAwMlx1NUJGOVx1NUU5NCBjcmF0ZXMvY29yZS9zcmMvbGliLnJzIFx1NzY4NCBFbmdpbmVcdTMwMDJcbi8vIVxuLy8hIFx1NjMwMVx1NEU0NVx1NTMxNlx1RkYxQVx1NjVFN1x1NUYxNVx1NjRDRVx1NzUyOCBTUUxpdGVcdUZGMUJcdTY1QjBcdTY3QjZcdTY3ODRcdUZGMDhNSUdSQVRJT04ubWQvQVBJLm1kXHVGRjA5XHU0RUU1IEpTT04gXHU2NTg3XHU0RUY2XHU0RTNBXHU1NTJGXHU0RTAwXHU2NTcwXHU2MzZFXHU2RTkwXHUzMDAyXG4vLyEgXHU2NzJDXHU1QjlFXHU3M0IwXHU2NzA5XHU0RTI0XHU3OUNEXHU1QjU4XHU1MEE4XHU1MTY1XHU1M0UzXHVGRjFBXG4vLyEgLSBgRW5naW5lLm9wZW4ocGF0aClgXHVGRjFBXHU1MzU1IEpTT04gXHU2NTg3XHU0RUY2XHVGRjA4XHU1MzlGXHU1QjUwXHU1MTk5XHVGRjA5XHVGRjBDXHU1QkY5XHU1RTk0XHU2NUU3IEVuZ2luZTo6b3BlbihwYXRoKVx1RkYxQlxuLy8hIC0gYEVuZ2luZS5mcm9tRGF0YShkYXRhLCBzYXZlKWBcdUZGMUFcdThDMDNcdTc1MjhcdTY1QjlcdTgxRUFcdTVFMjZcdTVCNThcdTUwQThcdUZGMDhydW50aW1lIFx1NzUyOFx1NUI4M1x1NjI4QVx1NTQwQ1x1NEUwMFx1NEVGRCBBcHBEYXRhXG4vLyEgICBcdTYyQzZcdTYyMTAgcGxhbi5qc29uL3N0YXRlLmpzb24gXHU0RTI0XHU0RTJBXHU2NTg3XHU0RUY2XHVGRjA5XHUzMDAyXHU1QjU4XHU1MEE4XHU3QjU2XHU3NTY1XHU1M0VBXHU1RjcxXHU1NENEXHU4NDNEXHU3NkQ4XHU2NUI5XHU1RjBGXHVGRjBDXHU2ODIxXHU5QThDXHUzMDAxXHU4RUFCXHU0RUZEXHU3NjdCXHU4QkIwXHUzMDAxXG4vLyEgICBcdTY1NTlcdTVCNjZcdThGNkNcdTc5RkJcdTRFMEVcdTRGRERcdTYyQTRcdTg5QzRcdTUyMTlcdTVCOENcdTUxNjhcdTUxNzFcdTc1MjhcdTMwMDJcblxuaW1wb3J0IHsgcmVhZEZpbGVTeW5jLCB3cml0ZUZpbGVTeW5jLCBta2RpclN5bmMsIHJlbmFtZVN5bmMgfSBmcm9tIFwibm9kZTpmc1wiO1xuaW1wb3J0IHsgZGlybmFtZSB9IGZyb20gXCJub2RlOnBhdGhcIjtcbmltcG9ydCB7IEFwcEVycm9yLCBjbG9uZSB9IGZyb20gXCIuL2Vycm9yc1wiO1xuaW1wb3J0IHR5cGUgeyBBY3Rpb24gfSBmcm9tIFwiLi9saWJcIjtcbmltcG9ydCB7IEFwcERhdGEgfSBmcm9tIFwiLi9saWJcIjtcbmltcG9ydCB7IGRhdGVBdCB9IGZyb20gXCIuL3RpbWVcIjtcbmltcG9ydCB7IHJlY29uY2lsZUlkZW50aXRpZXMsIHZhbGlkYXRlSWRlbnRpdGllcyB9IGZyb20gXCIuL2lkZW50aXRpZXNcIjtcbmltcG9ydCB7IHJlYWRMb2NhbERhdGEgfSBmcm9tIFwiLi9taWdyYXRpb25cIjtcbmltcG9ydCB7IHN1bW1hcmllcyB9IGZyb20gXCIuL2xlYXJuaW5nXCI7XG5pbXBvcnQgeyB2YWxpZGF0ZUVkdWNhdGlvblRyYW5zaXRpb24gfSBmcm9tIFwiLi9lZHVjYXRpb25cIjtcbmltcG9ydCB7IHJlbGVhc2VMb2NrIH0gZnJvbSBcIi4vbG9ja1wiO1xuaW1wb3J0IHR5cGUgeyBTbmFwc2hvdCwgVGFza0tpbmQgfSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHsga2luZE9mIH0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IHRpbWVyUmVtYWluaW5nIH0gZnJvbSBcIi4vcmVtaW5kZXJzXCI7XG5pbXBvcnQgeyBwYXJzZUFwcERhdGEsIHNlcmlhbGl6ZUFwcERhdGEsIHNlcmlhbGl6ZVRhc2sgfSBmcm9tIFwiLi9saWJcIjtcblxuLyoqIFx1ODQzRFx1NzZEOFx1NTZERVx1OEMwM1x1RkYxQVx1NjUzNlx1NTIzMFx1NzY4NFx1NjYyRlx1NURGMlx1N0VDRlx1OEZDN1x1NjgyMVx1OUE4Q1x1NzY4NCBBcHBEYXRhXHVGRjFCXHU1NkRFXHU4QzAzXHU1RkM1XHU5ODdCXHU1MzlGXHU1QjUwXHU2NkZGXHU2MzYyXHU4MUVBXHU1REYxXHU3Njg0XHU1QjU4XHU1MEE4XHUzMDAyICovXG5leHBvcnQgdHlwZSBFbmdpbmVQZXJzaXN0ID0gKGRhdGE6IEFwcERhdGEpID0+IHZvaWQ7XG5cbi8qKiBcdTUzNTVcdTY1ODdcdTRFRjZcdTVCNThcdTUwQThcdUZGMUFcdTRFMzRcdTY1RjZcdTY1ODdcdTRFRjYgKyByZW5hbWVcdUZGMENcdTRGRERcdThCQzFcdThCRkJcdTgwMDVcdTUzRUFcdTc3MEJcdTUyMzBcdTY1RTdcdTUxODVcdTVCQjlcdTYyMTZcdTY1QjBcdTUxODVcdTVCQjlcdTMwMDIgKi9cbmZ1bmN0aW9uIHdyaXRlQXRvbWljKHBhdGg6IHN0cmluZywgZGF0YTogQXBwRGF0YSk6IHZvaWQge1xuICBjb25zdCByYXcgPSBKU09OLnN0cmluZ2lmeShzZXJpYWxpemVBcHBEYXRhKGRhdGEpLCBudWxsLCAyKTtcbiAgY29uc3QgdG1wID0gYCR7cGF0aH0udG1wYDtcbiAgd3JpdGVGaWxlU3luYyh0bXAsIHJhdywgXCJ1dGY4XCIpO1xuICByZW5hbWVTeW5jKHRtcCwgcGF0aCk7XG59XG5cbmV4cG9ydCBjbGFzcyBFbmdpbmUge1xuICBwYXRoOiBzdHJpbmc7XG4gIGRhdGE6IEFwcERhdGE7XG4gIHByaXZhdGUgcmVhZG9ubHkgc2F2ZTogRW5naW5lUGVyc2lzdDtcblxuICBwcml2YXRlIGNvbnN0cnVjdG9yKHBhdGg6IHN0cmluZywgZGF0YTogQXBwRGF0YSwgc2F2ZTogRW5naW5lUGVyc2lzdCkge1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB0aGlzLnNhdmUgPSBzYXZlO1xuICB9XG5cbiAgLyoqIFx1Njg0Q1x1OTc2Mlx1OTAwMlx1OTE0RFx1NUM0Mlx1NEUxM1x1NzUyOFx1RkYxQVx1NTQwOFx1NjIxMFx1NTY2OFx1NjU0NVx1OTY5Q1x1NTQwRVx1NUYzQVx1NTIzNlx1ODlFM1x1OTY2NFx1NEZERFx1NjJBNFx1RkYxQlx1NEUwRFx1NjYyRlx1NUJGOVx1NTkxNiBBY3Rpb25cdTMwMDIgKi9cbiAgcmVsZWFzZUZhaWxlZFByb3RlY3Rpb24oYXQ6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IG5leHQgPSBjbG9uZSh0aGlzLmRhdGEpO1xuICAgIG5leHQucmVjb3JkKGF0LCBmYWxzZSk7XG4gICAgbmV4dC5yZXNldFRvKFwiZm9jdXNcIik7XG4gICAgcmVsZWFzZUxvY2sobmV4dC5sb2NrLCBhdCk7XG4gICAgbmV4dC52YWxpZGF0ZSgpO1xuICAgIHRoaXMucGVyc2lzdChuZXh0KTtcbiAgICB0aGlzLmRhdGEgPSBuZXh0O1xuICB9XG5cbiAgLyoqXG4gICAqIFx1NjVFNyBydW50aW1lIFx1NzY4NFx1MzAwQ1x1NjUzRVx1NUYwM1x1NUY1M1x1NTI0RFx1NzU2QVx1ODMwNFx1MzAwRFx1RkYxQVx1NEUwRFx1NTE5OVx1NEUxM1x1NkNFOFx1OEJCMFx1NUY1NVx1RkYwQ1x1NTNFQVx1NTZERVx1NTIzMFx1N0E3QVx1OTVGMlx1NEUxM1x1NkNFOFx1MzAwMlxuICAgKiBcdTRGRERcdTYyQTRcdTc1MUZcdTY1NDhcdTY1RjZcdTYyRDJcdTdFRERcdUZGMDhcdTRFMEVcdTUxNzZcdTVCODNcdTUxOTlcdTUyQThcdTRGNUNcdTU0MENcdTRFMDBcdTg5QzRcdTUyMTlcdUZGMUFcdTRFMERcdTgwRkRcdTUwMUZcdTY1M0VcdTVGMDNcdTdFRDVcdTVGMDBcdTk1MDFcdTVCOUFcdUZGMDlcdTMwMDJcbiAgICovXG4gIGRpc2NhcmRUaW1lcigpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5kYXRhLnN0cmljdFByb3RlY3RlZCgpKSB7XG4gICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTRFMjVcdTY4M0NcdTZBMjFcdTVGMEZcdTc1MUZcdTY1NDhcdTRFMkRcdUZGMENcdTRFMERcdTgwRkRcdTYzRDBcdTUyNERcdTdFRDNcdTY3NUZcdTYyMTZcdTRGRUVcdTY1MzlcdUZGMUJcdTUyMzBcdTY1RjZcdTgxRUFcdTUyQThcdTg5RTNcdTk2NjRcIik7XG4gICAgfVxuICAgIGlmICh0aGlzLmRhdGEucHJvdGVjdGVkKCkpIHtcbiAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcbiAgICAgICAgXCJcdTRFMTNcdTZDRThcdTRGRERcdTYyQTRcdTRFMkRcdUZGMENcdTdFRDNcdTY3NUZcdTUyNERcdTRFMERcdTgwRkRcdTRGRUVcdTY1MzlcdTRFRkJcdTUyQTFcdTYyMTZcdThCQTFcdTY1RjZcdUZGMUJcdTUzRUZcdTYzRDBcdTUyNERcdTVCOENcdTYyMTBcdTc1NkFcdTgzMDRcdTYyMTZcdTdEMjdcdTYwMjVcdTkwMDBcdTUxRkFcIixcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IG5leHQgPSBjbG9uZSh0aGlzLmRhdGEpO1xuICAgIG5leHQucmVzZXRUbyhcImZvY3VzXCIpO1xuICAgIG5leHQudmFsaWRhdGUoKTtcbiAgICB0aGlzLnBlcnNpc3QobmV4dCk7XG4gICAgdGhpcy5kYXRhID0gbmV4dDtcbiAgfVxuXG4gIHN0YXRpYyBvcGVuKHBhdGg6IHN0cmluZyk6IEVuZ2luZSB7XG4gICAgbGV0IHJhdzogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgaWYgKHBhdGggIT09IFwiOm1lbW9yeTpcIikge1xuICAgICAgY29uc3QgcGFyZW50ID0gZGlybmFtZShwYXRoKTtcbiAgICAgIGlmIChwYXJlbnQgIT09IFwiLlwiICYmIHBhcmVudCAhPT0gXCJcIikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG1rZGlyU3luYyhwYXJlbnQsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFN0cmluZyhlKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIHJhdyA9IHJlYWRGaWxlU3luYyhwYXRoLCBcInV0ZjhcIik7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGlmICgoZSBhcyBOb2RlSlMuRXJybm9FeGNlcHRpb24pLmNvZGUgIT09IFwiRU5PRU5UXCIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoU3RyaW5nKGUpKTtcbiAgICAgICAgfVxuICAgICAgICByYXcgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgZGF0YTogQXBwRGF0YTtcbiAgICBpZiAocmF3ICE9PSBudWxsKSB7XG4gICAgICBkYXRhID0gcmVhZExvY2FsRGF0YShyYXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkYXRhID0gbmV3IEFwcERhdGEoKTtcbiAgICB9XG4gICAgcmVjb25jaWxlSWRlbnRpdGllcyhjbG9uZShkYXRhKSwgZGF0YSwgbnVsbCk7XG4gICAgZGF0YS52YWxpZGF0ZSgpO1xuICAgIGNvbnN0IGVuZ2luZSA9IG5ldyBFbmdpbmUoXG4gICAgICBwYXRoLFxuICAgICAgZGF0YSxcbiAgICAgIHBhdGggPT09IFwiOm1lbW9yeTpcIlxuICAgICAgICA/ICgpID0+IHt9XG4gICAgICAgIDogKG5leHQ6IEFwcERhdGEpID0+IHdyaXRlQXRvbWljKHBhdGgsIG5leHQpLFxuICAgICk7XG4gICAgZW5naW5lLnBlcnNpc3QoZW5naW5lLmRhdGEpO1xuICAgIHJldHVybiBlbmdpbmU7XG4gIH1cblxuICAvKipcbiAgICogXHU3NTI4XHU4QzAzXHU3NTI4XHU2NUI5XHU1MkEwXHU4RjdEXHU1OTdEXHU3Njg0XHU2NTcwXHU2MzZFXHU1RUZBXHU1RjE1XHU2NENFXHVGRjBDXHU1RTc2XHU0RUU1XHU4QzAzXHU3NTI4XHU2NUI5XHU3RUQ5XHU3Njg0IGBzYXZlYCBcdTg0M0RcdTc2RDhcdTMwMDJcbiAgICogXHU2NTcwXHU2MzZFXHU0RUNEXHU4RDcwXHU1NDBDXHU0RTAwXHU1OTU3XHU4RUFCXHU0RUZEXHU3NjdCXHU4QkIwXHU0RTBFXHU1MTY4XHU5MUNGXHU2ODIxXHU5QThDXHVGRjFCYHNhdmVgIFx1NjI5Qlx1OTUxOVx1NEYxQVx1NTM5Rlx1NjgzN1x1NEYyMFx1NTFGQVx1RkYwQ1x1NTJBMFx1OEY3RFx1NTkzMVx1OEQyNVx1NjVGNlxuICAgKiBcdThDMDNcdTc1MjhcdTY1QjlcdTU2RTBcdTZCNjRcdTRFMERcdTRGMUFcdTg5ODZcdTc2RDZcdTY1RTdcdTY1ODdcdTRFRjZcdTMwMDJcbiAgICovXG4gIHN0YXRpYyBmcm9tRGF0YShcbiAgICBkYXRhOiBBcHBEYXRhLFxuICAgIHNhdmU6IEVuZ2luZVBlcnNpc3QsXG4gICAgcGF0aCA9IFwiOm1lbW9yeTpcIixcbiAgKTogRW5naW5lIHtcbiAgICBjb25zdCBuZXh0ID0gY2xvbmUoZGF0YSk7XG4gICAgcmVjb25jaWxlSWRlbnRpdGllcyhjbG9uZShkYXRhKSwgbmV4dCwgbnVsbCk7XG4gICAgbmV4dC52YWxpZGF0ZSgpO1xuICAgIGNvbnN0IGVuZ2luZSA9IG5ldyBFbmdpbmUocGF0aCwgbmV4dCwgc2F2ZSk7XG4gICAgZW5naW5lLnBlcnNpc3QoZW5naW5lLmRhdGEpO1xuICAgIHJldHVybiBlbmdpbmU7XG4gIH1cblxuICBwcml2YXRlIHBlcnNpc3QoZGF0YTogQXBwRGF0YSk6IHZvaWQge1xuICAgIHRoaXMuc2F2ZShkYXRhKTtcbiAgfVxuXG4gIC8qKiBcdTRFMEUgZGlzcGF0Y2ggXHU3NkY4XHU1NDBDXHU3Njg0XHU4RUFCXHU0RUZEL1x1NTM4Nlx1NTNGMlx1ODlDNFx1NTIxOVx1RkYwQ1x1NEY0Nlx1NEUwRFx1NjMwMVx1NEU0NVx1NTMxNlx1RkYxQVx1NzUyOFx1NEU4RVx1NUJBMVx1OTYwNVx1NjU4N1x1NEVGNlx1MzAwMiAqL1xuICBwcmV2aWV3QWN0aW9uKGFjdGlvbjogQWN0aW9uLCBhdDogbnVtYmVyKTogQXBwRGF0YSB7XG4gICAgY29uc3QgcmVzdG9yZUlkID0gKCgpID0+IHtcbiAgICAgIGlmIChhY3Rpb24udHlwZSA9PT0gXCJyZXN0b3JlVGFza1wiKSB7XG4gICAgICAgIGNvbnN0IHJlY29yZCA9IHRoaXMuZGF0YS5pZGVudGl0aWVzLmZpbmQoXG4gICAgICAgICAgKHIpID0+IHIuaWQgPT09IGFjdGlvbi50YXNrLmlkICYmIHIucmV0aXJlZCAmJiByLmtpbmQgPT09IFwidGFza1wiLFxuICAgICAgICApO1xuICAgICAgICBpZiAocmVjb3JkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTZDQTFcdTY3MDlcdTVCRjlcdTVFOTRcdTc2ODRcdTUzOUZcdTRFRkJcdTUyQTFcdTYwNjJcdTU5MERcdThCQjBcdTVGNTVcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlY29yZC5yZXN0b3JlVGFzayAhPT0gSlNPTi5zdHJpbmdpZnkoc2VyaWFsaXplVGFzayhhY3Rpb24udGFzaykpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2MDYyXHU1OTBEXHU1MTg1XHU1QkI5XHU0RTBFXHU1MzlGXHU0RUZCXHU1MkExXHU0RTBEXHU0RTAwXHU4MUY0XHVGRjBDXHU1Mzg2XHU1M0YyIElEIFx1NEUwRFx1ODBGRFx1NTkwRFx1NzUyOFwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWN0aW9uLnRhc2suaWQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9KSgpO1xuICAgIGNvbnN0IG5leHQgPSBjbG9uZSh0aGlzLmRhdGEpO1xuICAgIC8vIGFwcGx5IFx1NTE4NVx1OTBFOFx1NURGMlx1NTA1QVx1NTE2OFx1OTFDRlx1NjgyMVx1OUE4Q1x1RkYxQnJlY29uY2lsZSBcdTUzRUFcdTY1MzkgaWRlbnRpdGllc1x1RkYwQ1x1NTE4RFx1OUE4Q1x1OEVBQlx1NEVGRFx1NTM3M1x1NTNFRlx1RkYwQ1xuICAgIC8vIFx1OTA3Rlx1NTE0RFx1NUJGOVx1NjU1OVx1NUI2Nlx1OEJCMFx1NUY1NVx1NUY4OFx1NTkxQVx1NzY4NFx1NUU5M1x1NkJDRlx1NkIyMVx1NTJBOFx1NEY1Q1x1OTFDRFx1NTkwRFx1OEREMVx1NEUwMFx1OTA0RFx1NjYwMlx1OEQzNVx1NjgyMVx1OUE4Q1x1MzAwMlxuICAgIG5leHQuYXBwbHkoYWN0aW9uLCBhdCk7XG4gICAgdmFsaWRhdGVFZHVjYXRpb25UcmFuc2l0aW9uKHRoaXMuZGF0YS5lZHVjYXRpb24sIG5leHQuZWR1Y2F0aW9uKTtcbiAgICByZWNvbmNpbGVJZGVudGl0aWVzKHRoaXMuZGF0YSwgbmV4dCwgcmVzdG9yZUlkKTtcbiAgICB2YWxpZGF0ZUlkZW50aXRpZXMobmV4dCk7XG4gICAgcmV0dXJuIG5leHQ7XG4gIH1cblxuICAvKiogXHU1M0VBXHU2M0E4XHU4RkRCXHU2NUY2XHU5NUY0XHVGRjA4XHU4QkExXHU2NUY2L1x1NjNEMFx1OTE5Mi9cdTk1MDFcdTY3M0EvXHU4MUVBXHU1MkE4XHU1RjAwXHU1REU1XHVGRjA5XHVGRjBDXHU0RTBEXHU3NTFGXHU2MjEwXHU1RkVCXHU3MTY3XHU3RURGXHU4QkExXHVGRjFCXHU2QkNGXHU3OUQyIHRpY2sgXHU3NTI4XHUzMDAyICovXG4gIHRpY2soYXQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG5leHQgPSBjbG9uZSh0aGlzLmRhdGEpO1xuICAgIGlmICghbmV4dC50aWNrKGF0KSkgcmV0dXJuIGZhbHNlO1xuICAgIHJlY29uY2lsZUlkZW50aXRpZXModGhpcy5kYXRhLCBuZXh0LCBudWxsKTtcbiAgICBuZXh0LnZhbGlkYXRlKCk7XG4gICAgdGhpcy5wZXJzaXN0KG5leHQpO1xuICAgIHRoaXMuZGF0YSA9IGNsb25lKG5leHQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZGlzcGF0Y2goYWN0aW9uOiBBY3Rpb24sIGF0OiBudW1iZXIpOiBTbmFwc2hvdCB7XG4gICAgY29uc3QgbmV4dCA9IHRoaXMucHJldmlld0FjdGlvbihhY3Rpb24sIGF0KTtcbiAgICB0aGlzLnBlcnNpc3QobmV4dCk7XG4gICAgdGhpcy5kYXRhID0gbmV4dDtcbiAgICByZXR1cm4gdGhpcy5zbmFwc2hvdChhdCk7XG4gIH1cblxuICBzbmFwc2hvdChhdDogbnVtYmVyKTogU25hcHNob3Qge1xuICAgIGNvbnN0IG5leHQgPSBjbG9uZSh0aGlzLmRhdGEpO1xuICAgIGlmIChuZXh0LnRpY2soYXQpKSB7XG4gICAgICByZWNvbmNpbGVJZGVudGl0aWVzKHRoaXMuZGF0YSwgbmV4dCwgbnVsbCk7XG4gICAgICBuZXh0LnZhbGlkYXRlKCk7XG4gICAgICB0aGlzLnBlcnNpc3QobmV4dCk7XG4gICAgICAvLyBcdTUzRUFcdTY3MDlcdTc3MUZcdTZCNjNcdTUzRDhcdTUzMTZcdTYyNERcdThGREJcdThGRDlcdTRFMkFcdTUyMDZcdTY1MkZcdUZGMUFcdTcwRURcdThERUZcdTVGODRcdTZCQ0ZcdTc5RDJcdTRFMDBcdTZCMjFcdTUxNEJcdTk2ODZcdTMwMDJcbiAgICAgIHRoaXMuZGF0YSA9IGNsb25lKG5leHQpO1xuICAgIH1cbiAgICBjb25zdCBraW5kczogUmVjb3JkPHN0cmluZywgVGFza0tpbmQ+ID0ge307XG4gICAgZm9yIChjb25zdCB0IG9mIHRoaXMuZGF0YS50YXNrcykge1xuICAgICAga2luZHNbdC5pZF0gPSBraW5kT2YodCk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB0YXNrS2luZHM6IGtpbmRzLFxuICAgICAgcmVtYWluaW5nU2VjczogdGltZXJSZW1haW5pbmcodGhpcy5kYXRhLnRpbWVyLCBhdCksXG4gICAgICBzdGF0czogdGhpcy5kYXRhLnN0YXRzKGF0KSxcbiAgICAgIHN0dWR5UHJvZ3Jlc3M6IHN1bW1hcmllcyhuZXh0LCBhdCksXG4gICAgICBkYXRhOiBuZXh0LFxuICAgICAgdG9kYXk6IGRhdGVBdChhdCksXG4gICAgICBzZXJ2ZXJUaW1lOiBhdCxcbiAgICB9O1xuICB9XG5cbiAgZXhwb3J0KGF0OiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHRoaXMuc25hcHNob3QoYXQpO1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShzZXJpYWxpemVBcHBEYXRhKHRoaXMuZGF0YSksIG51bGwsIDIpO1xuICB9XG59XG5cbi8vIHBhcnNlQXBwRGF0YSBcdTRGOUJcdThGRDBcdTg4NENcdTY1RjZcdTRFQ0UgSlNPTiBcdTc2RjRcdTYzQTVcdTY3ODRcdTkwMjBcdTY1NzBcdTYzNkVcdUZGMDhcdTY4MjFcdTlBOENcdTUxNjVcdTUzRTNcdTg5QzEgbGliLnRzIFx1NEUwRSBpbmRleC50c1x1RkYwOVx1MzAwMlxuZXhwb3J0IHsgcGFyc2VBcHBEYXRhIH07XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBSU8sSUFBTSxXQUFOLGNBQXVCLE1BQU07QUFBQSxFQUNsQyxZQUFZLFNBQWlCO0FBQzNCLFVBQU0sT0FBTztBQUNiLFNBQUssT0FBTztBQUFBLEVBQ2Q7QUFDRjtBQUVPLFNBQVMsT0FBTyxJQUFhLFNBQTZCO0FBQy9ELE1BQUksQ0FBQyxHQUFJLE9BQU0sSUFBSSxTQUFTLE9BQU87QUFDckM7QUFHTyxTQUFTQSxTQUFXLE9BQTZCLFNBQW9CO0FBQzFFLE1BQUksVUFBVSxRQUFRLFVBQVUsT0FBVyxPQUFNLElBQUksU0FBUyxPQUFPO0FBQ3JFLFNBQU87QUFDVDtBQUdPLFNBQVMsVUFBVSxHQUFtQjtBQUMzQyxTQUFPLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDdkI7QUFHTyxTQUFTLFFBQVEsR0FBbUI7QUFDekMsTUFBSSxPQUFPLGdCQUFnQixhQUFhO0FBQ3RDLFdBQU8sSUFBSSxZQUFZLEVBQUUsT0FBTyxDQUFDLEVBQUU7QUFBQSxFQUNyQztBQUVBLFNBQU8sVUFBVSxDQUFDLElBQUk7QUFDeEI7QUFHTyxTQUFTLE1BQVMsT0FBYTtBQUNwQyxNQUFJLE1BQU0sUUFBUSxLQUFLLEdBQUc7QUFDeEIsV0FBTyxNQUFNLElBQUksQ0FBQyxNQUFNLE1BQU0sQ0FBQyxDQUFDO0FBQUEsRUFDbEM7QUFDQSxNQUFJLFVBQVUsUUFBUSxPQUFPLFVBQVUs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O0FBQUEsRUFDekI7QUFBQSxFQUVBLFNBQVMsSUFBc0I7QUFDN0IsVUFBTSxPQUFPLE1BQU0sS0FBSyxJQUFJO0FBQzVCLFFBQUksS0FBSyxLQUFLLEVBQUUsR0FBRztBQUNqQiwwQkFBb0IsS0FBSyxNQUFNLE1BQU0sSUFBSTtBQUN6QyxXQUFLLFNBQVM7QUFDZCxXQUFLLFFBQVEsSUFBSTtBQUVqQixXQUFLLE9BQU8sTUFBTSxJQUFJO0FBQUEsSUFDeEI7QUFDQSxVQUFNLFFBQWtDLENBQUM7QUFDekMsZUFBVyxLQUFLLEtBQUssS0FBSyxPQUFPO0FBQy9CLFlBQU0sRUFBRSxFQUFFLElBQUksT0FBTyxDQUFDO0FBQUEsSUFDeEI7QUFDQSxXQUFPO0FBQUEsTUFDTCxXQUFXO0FBQUEsTUFDWCxlQUFlLGVBQWUsS0FBSyxLQUFLLE9BQU8sRUFBRTtBQUFBLE1BQ2pELE9BQU8sS0FBSyxLQUFLLE1BQU0sRUFBRTtBQUFBLE1BQ3pCLGVBQWUsVUFBVSxNQUFNLEVBQUU7QUFBQSxNQUNqQyxNQUFNO0FBQUEsTUFDTixPQUFPLE9BQU8sRUFBRTtBQUFBLE1BQ2hCLFlBQVk7QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUFBLEVBRUEsT0FBTyxJQUFvQjtBQUN6QixTQUFLLFNBQVMsRUFBRTtBQUNoQixXQUFPLEtBQUssVUFBVSxpQkFBaUIsS0FBSyxJQUFJLEdBQUcsTUFBTSxDQUFDO0FBQUEsRUFDNUQ7QUFDRjsiLAogICJuYW1lcyI6IFsicmVxdWlyZSIsICJhbGxvd2VkIiwgInRpbWVzIiwgInMiLCAiaWQiLCAicmVxdWlyZSIsICJpZCIsICJleGFtRGVhZGxpbmUiLCAiaWQiLCAiYSIsICJiIiwgImlkIiwgImlkIiwgImlkIiwgInQiLCAiaXNPYmplY3QiLCAid2Vla1N0YXJ0IiwgImJhbmQiLCAiaWQiLCAiaWQiXQp9Cg==
