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

// packages/core/src/recurrence.ts
function taskIsVoid(task) {
  return !task.completed && task.repeat === "none" && task.reminderExpired;
}
function validateRepeat(task) {
  ensure(
    ["none", "daily", "weekdays", "weekly"].includes(task.repeat),
    "\u65E0\u6548\u7684\u5FAA\u73AF\u89C4\u5219"
  );
  ensure(
    task.repeatDays.length <= 7 && new Set(task.repeatDays).size === task.repeatDays.length && task.repeatDays.every((d) => Number.isInteger(d) && d >= 1 && d <= 7),
    "\u65E0\u6548\u7684\u5FAA\u73AF\u661F\u671F"
  );
  ensure(
    task.repeat === "weekly" || task.repeatDays.length === 0,
    "\u53EA\u6709\u6BCF\u5468\u5FAA\u73AF\u53EF\u4EE5\u6307\u5B9A\u661F\u671F"
  );
  ensure(task.repeat === "none" || task.recurring, "\u5FAA\u73AF\u4EFB\u52A1\u5FC5\u987B\u4FDD\u7559\u91CD\u590D\u6765\u6E90");
  ensure(
    task.dueDate !== null || task.reminderTime === null && task.repeat === "daily",
    "\u65E0\u65E5\u671F\u4EFB\u52A1\u5FC5\u987B\u662F\u65E0\u63D0\u9192\u7684\u6BCF\u65E5\u5FAA\u73AF\u4EFB\u52A1"
  );
  ensure(
    task.nextTaskId === null || task.nextTaskId.trim().length > 0 && task.nextTaskId !== task.id,
    "\u65E0\u6548\u7684\u4E0B\u4E00\u6B21\u4EFB\u52A1 ID"
  );
}
function nextDate(task, at) {
  const today = dateAt(at);
  const anchor = parseDate(task.dueDate ?? today);
  let day = parseDate(
    task.dueDate !== null && task.dueDate > today ? task.dueDate : today
  );
  const days = task.repeatDays.length > 0 ? task.repeatDays : [weekdayMonday(anchor)];
  do {
    day = addDays(day, 1);
  } while (task.repeat === "weekdays" && weekdayMonday(day) > 5 || task.repeat === "weekly" && !days.includes(weekdayMonday(day)));
  return formatDate(day);
}
function createNextTask(data, task, at) {
  if (task.repeat === "none" || task.nextTaskId !== null) return;
  const next = {
    ...task,
    id: id(),
    dueDate: nextDate(task, at),
    nextTaskId: null,
    createdAt: at,
    completed: false,
    completedAt: null,
    reminderFired: false,
    reminderPending: false,
    reminderExpired: false,
    tags: [...task.tags],
    subtasks: task.subtasks.map((s) => ({ ...s, done: false }))
  };
  task.nextTaskId = next.id;
  data.tasks.push(next);
}
function saveHabitTasks(data, habitId, action, at) {
  ensure(action.slots.length <= 49, "\u4E60\u60EF\u6700\u591A 49 \u4E2A\u65F6\u6BB5");
  const requested = action.slots.length ? action.slots : [{ days: [1, 2, 3, 4, 5, 6, 7], time: null }];
  const seen = /* @__PURE__ */ new Set();
  for (const slot of requested) {
    ensure(
      slot.days.length > 0 && slot.days.every((d) => Number.isInteger(d) && d >= 1 && d <= 7),
      "\u4E60\u60EF\u65F6\u6BB5\u9700\u8981\u6709\u6548\u661F\u671F"
    );
    for (const day of slot.days) {
      const key = `${day}|${slot.time}`;
      ensure(!seen.has(key), "\u4E60\u60EF\u65F6\u6BB5\u91CD\u590D");
      seen.add(key);
    }
  }
  const leaves = data.tasks.filter(
    (t) => t.habitId === habitId && !t.completed && t.nextTaskId === null
  );
  const kept = /* @__PURE__ */ new Set();
  for (const slot of requested) {
    const existing = leaves.find((t) => !kept.has(t.id) && t.reminderTime === slot.time) ?? leaves.find((t) => !kept.has(t.id));
    const date = parseDate(dateAt(at));
    let first = date;
    while (!slot.days.includes(weekdayMonday(first))) first = addDays(first, 1);
    const task = existing ?? {
      id: id(),
      title: action.name.trim(),
      notes: "",
      projectId: action.projectId,
      habitId,
      dueDate: formatDate(first),
      reminderTime: slot.time,
      focusMinutes: action.focusMinutes,
      scrapMinutes: 0,
      expiryDays: 0,
      priority: 0,
      estimate: 1,
      recurring: true,
      repeat: "weekly",
      repeatDays: [...slot.days],
      nextTaskId: null,
      reminderFired: false,
      reminderPending: false,
      reminderExpired: false,
      completed: false,
      completedAt: null,
      createdAt: at,
      tags: [],
      subtasks: []
    };
    task.title = action.name.trim();
    task.projectId = action.projectId;
    task.focusMinutes = action.focusMinutes;
    task.repeat = "weekly";
    task.repeatDays = action.slots.length ? [...slot.days] : [];
    task.repeat = action.slots.length ? "weekly" : "daily";
    task.recurring = true;
    if (task.reminderTime !== slot.time) {
      task.reminderTime = slot.time;
      task.reminderFired = false;
      task.reminderPending = false;
      task.reminderExpired = false;
    }
    if (!action.slots.length) task.dueDate = null;
    else if (task.dueDate === null || !slot.days.includes(weekdayMonday(parseDate(task.dueDate)))) {
      task.dueDate = formatDate(first);
      task.reminderFired = false;
      task.reminderPending = false;
      task.reminderExpired = false;
    }
    if (!existing) data.tasks.push(task);
    kept.add(task.id);
  }
  for (const task of leaves)
    if (!kept.has(task.id)) {
      task.repeat = "none";
      task.repeatDays = [];
      task.recurring = false;
      if (task.dueDate === null) task.dueDate = dateAt(at);
    }
}
function replaceAppData(target, source) {
  Object.assign(target, source);
}

// packages/core/src/reminders.ts
function validateReminderTask(task) {
  if (task.dueDate !== null && !validDate(task.dueDate)) {
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
    if (t.repeat !== "none" && t.reminderExpired) {
      t.reminderExpired = false;
      changed = true;
    }
    const isToday = t.dueDate === today;
    const past = t.dueDate !== null && t.dueDate < today;
    const start = t.reminderTime !== null ? minutesOf(t.reminderTime) : null;
    const expired = !t.completed && t.repeat === "none" && (start !== null ? (() => {
      const spentAt = start + windowMinutes(t, settings) + (isHabit(t) ? 0 : t.scrapMinutes);
      return past || isToday && nowSeconds >= spentAt * 60;
    })() : t.dueDate !== null && today > formatDate(addDays(parseDate(t.dueDate), t.expiryDays)));
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
      "resourceIds",
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
    resourceIds: field(
      raw,
      "resourceIds",
      "\u8BD5\u9898",
      (v) => asArray(v, "resourceIds").map((x) => asStr(x, "\u8D44\u6599 ID")),
      []
    ),
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
    resourceIds: [...a.resourceIds],
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
      add(a.resourceIds, `\u8BD5\u5377\uFF1A${a.title}`);
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
    ensure(
      a.resourceIds.length <= 500 && new Set(a.resourceIds).size === a.resourceIds.length && a.resourceIds.every((id2) => resource(id2, a.projectId) !== void 0),
      "\u8BD5\u5377\u8D44\u6599\u5FC5\u987B\u5F15\u7528\u672C\u9879\u76EE\u5DF2\u767B\u8BB0\u7684\u8D44\u6E90\u4E14\u4E0D\u91CD\u590D"
    );
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
    resourceIds: [...a.resourceIds],
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
          ["lesson", "homework", "exam"]
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
    if (enabled.has(paper.projectId)) {
      let minutes = 0;
      for (const q of paper.questions) {
        minutes = Math.min(4294967295, minutes + q.estimatedMinutes);
      }
      sources.push({
        kind: paper.kind === "homework" ? "homework" : "exam",
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
    const reminder = kind !== "homework" ? hourMinuteString(startsAt) : null;
    const focus = isLesson ? 45 : Math.min(minutes, data.settings.focusMinutes);
    const estimate = Math.max(1, Math.ceil(minutes / focus));
    const scrap = kind !== "homework" ? (() => {
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
        repeat: "none",
        repeatDays: [],
        nextTaskId: null,
        recurring: false,
        title,
        notes,
        projectId,
        habitId: null,
        dueDate,
        reminderTime: reminder,
        focusMinutes: focus,
        scrapMinutes: scrap,
        expiryDays: 0,
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
  }
  return changed;
}
function completeTeachingTask(data, taskId, at) {
  const link = teachingTask(data, taskId);
  if (link === void 0) return;
  if (link.kind !== "lesson") {
    const last = data.education.submissions.filter((s) => s.assessmentId === link.sourceId).sort((a, b) => b.submittedAt - a.submittedAt)[0];
    ensure(
      last !== void 0 && !last.unfinished,
      "\u8BF7\u5148\u63D0\u4EA4\u5B8C\u6574\u7B54\u5377\uFF0C\u518D\u786E\u8BA4\u4EFB\u52A1\u5B8C\u6210"
    );
    return;
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
        (a) => a.id === link.sourceId && (link.kind === "homework" ? a.kind === "homework" : a.kind !== "homework")
      )?.projectId ?? null;
    })();
    ensure(project !== null, "\u6559\u5B66\u5F85\u529E\u6765\u6E90\u4E0D\u5B58\u5728\u6216\u7C7B\u578B\u4E0D\u7B26");
    if (task.projectId !== project || tasks.has(link.taskId) || sources.has(link.sourceId) || task.repeat !== "none" || task.habitId !== null || task.recurring) {
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
  "habits",
  "replace"
];
var PLAN_PROJECT_KEYS = ["id", "name", "color", "appWhitelist"];
var PLAN_TASK_KEYS = [
  "id",
  "title",
  "habitId",
  "recurring",
  "scrapMinutes",
  "expiryDays",
  "notes",
  "projectId",
  "dueDate",
  "reminderTime",
  "focusMinutes",
  "priority",
  "estimate",
  "tags",
  "subtasks",
  "repeat",
  "repeatDays"
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
    habitId: field(
      raw,
      "habitId",
      "\u8BA1\u5212\u4EFB\u52A1",
      (v) => asOpt(v, "habitId", asStr),
      null
    ),
    recurring: field(raw, "recurring", "\u8BA1\u5212\u4EFB\u52A1", asBool, false),
    scrapMinutes: field(raw, "scrapMinutes", "\u8BA1\u5212\u4EFB\u52A1", asInt, 0),
    expiryDays: field(raw, "expiryDays", "\u8BA1\u5212\u4EFB\u52A1", asInt, 0),
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
    ),
    repeatDays: field(
      raw,
      "repeatDays",
      "\u8BA1\u5212\u4EFB\u52A1",
      (v) => asArray(v, "repeatDays").map((d) => asInt(d, "\u91CD\u590D\u661F\u671F")),
      []
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
        habitId: t.habitId,
        recurring: t.recurring,
        scrapMinutes: t.scrapMinutes,
        expiryDays: t.expiryDays,
        notes: t.notes,
        projectId: t.projectId,
        dueDate: t.dueDate,
        priority: t.priority,
        estimate: t.estimate,
        tags: t.tags,
        subtasks: t.subtasks.map((s) => ({ id: s.id, title: s.title })),
        repeat: t.repeat,
        repeatDays: t.repeatDays
      };
      if (t.reminderTime !== null) o["reminderTime"] = t.reminderTime;
      if (t.focusMinutes !== null) o["focusMinutes"] = t.focusMinutes;
      return o;
    }),
    blocks: plan.blocks.map(serializeBlock),
    habits: plan.habits.map(serializeHabit)
  };
  if (plan.replace) out["replace"] = true;
  return out;
}
function planTaskToTask(t, at, estimate) {
  return {
    id: t.id,
    recurring: t.recurring || t.repeat !== "none" || t.dueDate === null,
    repeat: t.dueDate === null && t.repeat === "none" ? "daily" : t.repeat,
    repeatDays: [...t.repeatDays],
    nextTaskId: null,
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
    expiryDays: t.expiryDays,
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
  task.nextTaskId = old.nextTaskId;
  if (old.dueDate === t.dueDate && old.reminderTime === t.reminderTime) {
    task.reminderFired = old.reminderFired;
    task.reminderPending = old.reminderPending;
    task.reminderExpired = old.expiryDays === t.expiryDays && old.reminderExpired;
  }
  for (const sub of task.subtasks) {
    const prev = old.subtasks.find((s) => s.id === sub.id);
    if (prev !== void 0) sub.done = prev.done;
  }
  return task;
}
function validatePlanFile(plan) {
  if (plan.format !== "tomato-todo-plan" || plan.version !== 7) {
    throw new AppError("\u4EC5\u652F\u6301\u8BA1\u5212 v7\uFF1B\u65E7\u8BA1\u5212\u8BF7\u6309\u65B0\u683C\u5F0F\u91CD\u65B0\u5BFC\u51FA");
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
    }
    const plannedBlocks = new Set(plan.blocks.map((b) => b.id));
    next.blocks = next.blocks.filter((b) => plannedBlocks.has(b.id));
  }
  next.validate();
  replaceAppData(data, next);
}
function exportPlan(data) {
  const tasks = data.tasks.filter((t) => !t.completed && data.teachingTask(t.id) === void 0).map((t) => ({
    habitId: t.habitId,
    recurring: t.recurring,
    scrapMinutes: t.scrapMinutes,
    expiryDays: t.expiryDays,
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
    repeat: t.nextTaskId === null ? t.repeat : "none",
    repeatDays: [...t.repeatDays],
    subtasks: t.subtasks.map((s) => ({ id: s.id, title: s.title }))
  }));
  const used = /* @__PURE__ */ new Set([
    ...tasks.filter((t) => t.projectId !== null).map((t) => t.projectId)
  ]);
  return {
    format: "tomato-todo-plan",
    version: 7,
    replace: false,
    blocks: data.blocks.map((b) => ({ ...b, days: [...b.days] })),
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
  "recurring",
  "repeat",
  "repeatDays",
  "nextTaskId",
  "title",
  "notes",
  "projectId",
  "habitId",
  "dueDate",
  "reminderTime",
  "focusMinutes",
  "scrapMinutes",
  "expiryDays",
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
    recurring: field(
      raw,
      "recurring",
      "\u4EFB\u52A1",
      asBool,
      raw["repeat"] !== void 0 && raw["repeat"] !== "none" || raw["dueDate"] == null
    ),
    repeat: field(
      raw,
      "repeat",
      "\u4EFB\u52A1",
      (v) => oneOf(v, "repeat", ["none", "daily", "weekdays", "weekly"]),
      raw["dueDate"] == null ? "daily" : "none"
    ),
    repeatDays: field(
      raw,
      "repeatDays",
      "\u4EFB\u52A1",
      (v) => asArray(v, "repeatDays").map((d) => asInt(d, "\u91CD\u590D\u661F\u671F")),
      []
    ),
    nextTaskId: field(
      raw,
      "nextTaskId",
      "\u4EFB\u52A1",
      (v) => asOpt(v, "nextTaskId", asStr),
      null
    ),
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
    expiryDays: field(raw, "expiryDays", "\u4EFB\u52A1", asInt, 0),
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
    recurring: t.recurring,
    repeat: t.repeat,
    repeatDays: t.repeatDays,
    nextTaskId: t.nextTaskId,
    title: t.title,
    notes: t.notes,
    projectId: t.projectId,
    habitId: t.habitId,
    dueDate: t.dueDate,
    reminderTime: t.reminderTime,
    focusMinutes: t.focusMinutes,
    scrapMinutes: t.scrapMinutes,
    expiryDays: t.expiryDays,
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
  "expiryDays",
  "priority",
  "estimate",
  "tags",
  "subtasks",
  "repeat",
  "repeatDays"
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
    expiryDays: field(raw, "expiryDays", "\u4EFB\u52A1\u8349\u7A3F", asInt, 0),
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
    ),
    repeatDays: field(
      raw,
      "repeatDays",
      "\u4EFB\u52A1\u8349\u7A3F",
      (v) => asArray(v, "repeatDays").map((d) => asInt(d, "\u91CD\u590D\u661F\u671F")),
      []
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
    time: field(
      raw,
      "time",
      "\u4E60\u60EF\u65F6\u6BB5",
      (v) => asOpt(v, "time", asStr),
      null
    )
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
  projects;
  habits;
  visions;
  settings;
  timer;
  sessions;
  lock;
  constructor(init) {
    this.education = init?.education ?? new Education();
    this.version = init?.version ?? 5;
    this.identities = init?.identities ?? [];
    this.tasks = init?.tasks ?? [];
    this.blocks = init?.blocks ?? [];
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
    const materialized = teachingChanged || teachingTasksChanged;
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
          recurring: old?.completed ? old.recurring : d.repeat !== "none" || d.dueDate === null,
          repeat: d.dueDate === null && d.repeat === "none" ? "daily" : d.repeat,
          repeatDays: [...d.repeatDays],
          nextTaskId: old?.nextTaskId ?? null,
          id: d.id ?? id(),
          title: d.title.trim(),
          notes: d.notes,
          projectId: d.projectId,
          habitId: old?.habitId ?? null,
          reminderFired: old !== void 0 && old.dueDate === d.dueDate && old.reminderTime === d.reminderTime && old.reminderFired,
          reminderPending: old !== void 0 && old.dueDate === d.dueDate && old.reminderTime === d.reminderTime && old.reminderPending,
          reminderExpired: old !== void 0 && old.dueDate === d.dueDate && old.reminderTime === d.reminderTime && old.expiryDays === d.expiryDays && old.reminderExpired,
          scrapMinutes: d.scrapMinutes,
          expiryDays: d.expiryDays,
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
          createNextTask(this, t, at);
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
        saveHabitTasks(this, hid, action, at);
        break;
      }
      case "deleteHabit": {
        this.habits = this.habits.filter((h) => h.id !== action.id);
        for (const task of this.tasks) {
          if (task.habitId === action.id) {
            task.habitId = null;
            task.repeat = "none";
            task.repeatDays = [];
            if (task.dueDate === null) task.dueDate = dateAt(at);
          }
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
            recurring: false,
            repeat: "none",
            repeatDays: [],
            nextTaskId: null,
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
            expiryDays: 0,
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
    validateIdentities(this);
    validateBlocks(this.blocks);
    ensure(this.version === 5, "\u4E0D\u652F\u6301\u6B64\u6570\u636E\u7248\u672C");
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
      validateRepeat(t2);
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
        Number.isInteger(t2.expiryDays) && t2.expiryDays >= 0 && t2.expiryDays <= 36500,
        "\u62A5\u5E9F\u5929\u6570\u9700\u4E3A 0\u201336500"
      );
      ensure(
        t2.projectId === null || projectIds.has(t2.projectId),
        "\u4EFB\u52A1\u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u9879\u76EE"
      );
      ensure(
        t2.habitId === null || habitIds.has(t2.habitId),
        "\u4EFB\u52A1\u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u4E60\u60EF"
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
    case "startReminder":
    case "toggleTask":
    case "deleteTask":
    case "deleteProject":
    case "deleteHabit":
    case "deleteVision":
    case "deleteBlock":
    case "deleteLockSchedule":
      return { type, id: str("id") };
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
        slots: field(
          raw,
          "slots",
          "\u52A8\u4F5C",
          (v) => asArray(v, "slots").map(parseHabitSlot),
          []
        )
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
var APP_DATA_KEYS = [
  "education",
  "version",
  "identities",
  "tasks",
  "blocks",
  "projects",
  "habits",
  "visions",
  "settings",
  "timer",
  "sessions",
  "lock"
];
function parseAppData(raw) {
  if (!isObject(raw)) throw new AppError("\u6570\u636E\u5FC5\u987B\u662F\u5BF9\u8C61");
  rejectUnknown(raw, [...APP_DATA_KEYS], "\u6570\u636E");
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
          record["restoreTask"] = JSON.stringify(task);
        }
      }
    }
  }
  if (value["version"] === 4) upgradeRecurringTasks(value);
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
function upgradeRecurringTasks(value) {
  const tasks = Array.isArray(value["tasks"]) ? value["tasks"] : [];
  const today = dateAt(now());
  const upgrade = (task) => {
    delete task["templateId"];
    task["repeat"] = task["repeat"] ?? "none";
    task["repeatDays"] = task["repeatDays"] ?? [];
    task["nextTaskId"] = task["nextTaskId"] ?? null;
    if (task["dueDate"] == null && task["repeat"] === "none")
      task["repeat"] = "daily";
    task["recurring"] = task["recurring"] === true || task["repeat"] !== "none";
    if (task["recurring"] || task["reminderTime"] == null)
      task["reminderExpired"] = false;
  };
  const templates = Array.isArray(value["templates"]) ? value["templates"] : [];
  const prints = Array.isArray(value["prints"]) ? value["prints"] : [];
  const makeTask = (shape, date, time) => ({
    id: id(),
    title: shape["title"],
    notes: shape["notes"] ?? "",
    projectId: shape["projectId"] ?? null,
    habitId: shape["habitId"] ?? null,
    focusMinutes: shape["focusMinutes"] ?? null,
    scrapMinutes: shape["scrapMinutes"] ?? 0,
    expiryDays: 0,
    priority: shape["priority"] ?? 0,
    estimate: shape["estimate"] ?? 1,
    tags: shape["tags"] ?? [],
    dueDate: date,
    reminderTime: time ?? null,
    recurring: false,
    completed: false,
    completedAt: null,
    createdAt: now(),
    reminderFired: false,
    reminderPending: false,
    reminderExpired: false,
    subtasks: Array.isArray(shape["subtasks"]) ? shape["subtasks"].map((sub) => ({ ...sub, done: false })) : []
  });
  for (const template of templates) {
    if (!isObject2(template) || !isObject2(template["printing"]) || !isObject2(template["shape"]))
      throw new AppError("\u65E7\u6A21\u677F\u683C\u5F0F\u65E0\u6548\uFF0C\u539F\u6587\u4EF6\u5DF2\u4FDD\u7559");
    const printing = template["printing"];
    const shape = template["shape"];
    if (printing["kind"] !== "weekly") {
      const slots2 = printing["kind"] === "once" ? [{ dates: [printing["date"]], time: printing["time"] }] : printing["slots"];
      if (!Array.isArray(slots2))
        throw new AppError("\u65E7\u65E5\u7A0B\u683C\u5F0F\u65E0\u6548\uFF0C\u539F\u6587\u4EF6\u5DF2\u4FDD\u7559");
      for (const slot of slots2) {
        if (!isObject2(slot) || !Array.isArray(slot["dates"]))
          throw new AppError("\u65E7\u65E5\u7A0B\u683C\u5F0F\u65E0\u6548\uFF0C\u539F\u6587\u4EF6\u5DF2\u4FDD\u7559");
        for (const date of slot["dates"]) {
          if (typeof date !== "string" || parseDate(date) === null)
            throw new AppError("\u65E7\u65E5\u7A0B\u65E5\u671F\u65E0\u6548\uFF0C\u539F\u6587\u4EF6\u5DF2\u4FDD\u7559");
          const printed = prints.some(
            (p) => isObject2(p) && p["templateId"] === template["id"] && p["date"] === date
          );
          const exists = tasks.some(
            (t) => t["templateId"] === template["id"] && t["dueDate"] === date
          );
          if (!printed && !exists)
            tasks.push(makeTask(shape, date, slot["time"]));
        }
      }
      continue;
    }
    const slots = Array.isArray(printing["slots"]) ? printing["slots"] : [];
    for (const slot of slots) {
      if (!isObject2(slot) || !Array.isArray(slot["days"]) || slot["days"].length === 0)
        throw new AppError("\u65E7\u6A21\u677F\u5305\u542B\u7A7A\u661F\u671F\uFF0C\u539F\u6587\u4EF6\u5DF2\u4FDD\u7559");
      const days = slot["days"];
      if (!days.every((d) => Number.isInteger(d) && d >= 1 && d <= 7))
        throw new AppError("\u65E7\u6A21\u677F\u5305\u542B\u65E0\u6548\u661F\u671F\uFF0C\u539F\u6587\u4EF6\u5DF2\u4FDD\u7559");
      const matches = tasks.filter(
        (t) => t["templateId"] === template["id"] && t["reminderTime"] === (slot["time"] ?? null) && t["completed"] !== true && typeof t["dueDate"] === "string" && parseDate(t["dueDate"]) !== null && days.includes(weekdayMonday(parseDate(t["dueDate"])))
      ).sort(
        (a, b) => String(a["dueDate"]).localeCompare(String(b["dueDate"]))
      );
      let task = matches.at(-1);
      if (!task) {
        let date = parseDate(today);
        while (!days.includes(weekdayMonday(date))) date = addDays(date, 1);
        task = makeTask(shape, formatDate(date), slot["time"]);
        tasks.push(task);
      }
      task["repeat"] = "weekly";
      task["repeatDays"] = [...days];
    }
  }
  for (const task of tasks) upgrade(task);
  value["tasks"] = tasks;
  delete value["templates"];
  delete value["prints"];
  const identities = value["identities"];
  if (Array.isArray(identities))
    for (const entry of identities) {
      if (!isObject2(entry)) continue;
      if (entry["kind"] === "template") entry["retired"] = true;
      if (typeof entry["restoreTask"] === "string") {
        const task = JSON.parse(entry["restoreTask"]);
        if (!isObject2(task)) throw new AppError("\u65E0\u6548\u7684\u4EFB\u52A1\u6062\u590D\u8BB0\u5F55");
        upgrade(task);
        entry["restoreTask"] = JSON.stringify(serializeTask(parseTask(task)));
      }
    }
  value["version"] = 5;
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
    const key = t.habitId ?? t.id;
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
  createNextTask,
  dateAt,
  daysBetween,
  deepEqual,
  defaultSettings,
  defaultTimer,
  diagnose,
  dueAutoTask,
  durationOf,
  ensure,
  examDeadline2 as examDeadline,
  exportPlan,
  formatAumid,
  formatDate,
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
  mergePlan,
  minutesOf,
  nextDate,
  now,
  overlapMinutes,
  parseAction,
  parseActiveLock,
  parseAppData,
  parseAssessment,
  parseBlock,
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
  parseSubmission,
  parseSubtask,
  parseTask,
  parseTaskDraft,
  parseTeachingEvent,
  parseTimer,
  parseVision,
  pendingReminder,
  planEstimate,
  readLocalData,
  reconcileIdentities,
  recordSession,
  releaseLock,
  reminderIdle,
  replaceAppData,
  require2 as require,
  requiredMinutes,
  resetTo,
  saveHabitTasks,
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
  serializeSubmission,
  serializeSubtask,
  serializeTask,
  serializeTeachingEvent,
  serializeTimer,
  serializeVision,
  startDueTask,
  startTeachingTask,
  startTimer,
  summaries,
  taskHasRoundsLeft,
  taskIsVoid,
  teachingTask,
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
  validateRepeat,
  validateTeachingTasks,
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
//! 习惯组：只带管辖；循环规则保存在关联任务上。
//! 对应 crates/core/src/habits.rs。
//! 任务直接拥有循环规则；只有完成当前这次才安排下一次。
//! 时间安排：日期/时间与单次时长校验、当天待处理队列、计时/锁机延后、跨日清理。
//! 对应 crates/core/src/reminders.rs。
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
//! 学习计划 v7：便携计划刻意不含执行历史与本机偏好。
//! 对应 crates/core/src/plan.rs。
//! 共享模型、计时状态机与校验入口。
//! 对应 crates/core/src/lib.rs（Engine 在 engine.ts，桌面 guard 原生保留）。
//! 仅本地 v3/v4→v5 转换：交换文件按当前版本严格校验，不走迁移路径。
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZXJyb3JzLnRzIiwgIi4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2lkcy50cyIsICIuLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy90aW1lLnRzIiwgIi4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL21vZGVsLnRzIiwgIi4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2pzb24udHMiLCAiLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbG9jay50cyIsICIuLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9ibG9ja3MudHMiLCAiLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaGFiaXRzLnRzIiwgIi4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlY3VycmVuY2UudHMiLCAiLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVtaW5kZXJzLnRzIiwgIi4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2xlYXJuaW5nLnRzIiwgIi4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2VkdWNhdGlvbi50cyIsICIuLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy90ZWFjaGluZ190YXNrcy50cyIsICIuLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9pZGVudGl0aWVzLnRzIiwgIi4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3BsYW4udHMiLCAiLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGliLnRzIiwgIi4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL21pZ3JhdGlvbi50cyIsICIuLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaWFnbm9zdGljcy50cyIsICIuLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9ndWFyZC50cyIsICIuLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9lbmdpbmUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vISBcdTk1MTlcdThCRUZcdTdFQTZcdTVCOUFcdUZGMUFSdXN0IFx1NEZBNyBgQXBwUmVzdWx0PFQ+ID0gUmVzdWx0PFQsIFN0cmluZz5gXHVGRjBDXHU4RkQ5XHU5MUNDXHU3RURGXHU0RTAwXHU2NTM5XHU0RTNBXHU2MjlCXHU1MUZBXG4vLyEgYEFwcEVycm9yYFx1RkYwOG1lc3NhZ2UgXHU1MzczIFJ1c3QgXHU3Njg0XHU0RTJEXHU2NTg3XHU5NTE5XHU4QkVGXHU2NTg3XHU2ODQ4XHVGRjBDXHU2RDRCXHU4QkQ1XHU5MDEwXHU1QjU3XHU2NUFEXHU4QTAwXHVGRjA5XHUzMDAyXG4vLyEgXHU1QkY5XHU1RTk0IFJ1c3QgXHU3Njg0IGBva19vcihtc2cpYCBcdTUzNzMgYHRocm93IG5ldyBBcHBFcnJvcihtc2cpYFx1MzAwMlxuXG5leHBvcnQgY2xhc3MgQXBwRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9IFwiQXBwRXJyb3JcIjtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZW5zdXJlKG9rOiBib29sZWFuLCBtZXNzYWdlOiBzdHJpbmcpOiBhc3NlcnRzIG9rIHtcbiAgaWYgKCFvaykgdGhyb3cgbmV3IEFwcEVycm9yKG1lc3NhZ2UpO1xufVxuXG4vKiogXHU1QkY5IGZpbmQvbWFwLmdldCBcdTdCNDlcdTUzRUZcdTdBN0FcdTdFRDNcdTY3OUNcdTUwNUFcdTY1MzZcdTdBODRcdUZGMUFSdXN0IGBva19vcihtc2cpP2AgXHU3Njg0XHU3NkY0XHU2M0E1XHU1QkY5XHU1RTk0XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gcmVxdWlyZTxUPih2YWx1ZTogVCB8IG51bGwgfCB1bmRlZmluZWQsIG1lc3NhZ2U6IHN0cmluZyk6IFQge1xuICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEFwcEVycm9yKG1lc3NhZ2UpO1xuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKiBcdTVCNTdcdTdCMjZcdTY1NzBcdUZGMDhVbmljb2RlIFx1NzgwMVx1NzBCOVx1RkYwOVx1RkYwQ1x1NUJGOVx1NUU5NCBSdXN0IGBzLmNoYXJzKCkuY291bnQoKWBcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGFyQ291bnQoczogc3RyaW5nKTogbnVtYmVyIHtcbiAgcmV0dXJuIEFycmF5LmZyb20ocykubGVuZ3RoO1xufVxuXG4vKiogVVRGLTggXHU1QjU3XHU4MjgyXHU2NTcwXHVGRjBDXHU1QkY5XHU1RTk0IFJ1c3QgYHMubGVuKClgXHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gdXRmOExlbihzOiBzdHJpbmcpOiBudW1iZXIge1xuICBpZiAodHlwZW9mIFRleHRFbmNvZGVyICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgcmV0dXJuIG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShzKS5sZW5ndGg7XG4gIH1cbiAgLy8gXHU0RkREXHU1Qjg4XHU1NkRFXHU5MDAwXHVGRjFBXHU2MzA5IDMgXHU1QjU3XHU4MjgyL1x1NzgwMVx1NzBCOVx1NEYzMFx1N0I5N1x1RkYwOEFTQ0lJIFx1NEVFNVx1NEUwQlx1NEYzMFx1OUFEOFx1NEUwRFx1NEYxQVx1NjUzRVx1OEZDN1x1OEQ4NVx1OTU3Rlx1OEY5M1x1NTE2NVx1RkYwOVx1MzAwMlxuICByZXR1cm4gY2hhckNvdW50KHMpICogMztcbn1cblxuLyoqIFx1NkRGMVx1NUVBNlx1NTE0Qlx1OTY4Nlx1NUU3Nlx1NEZERFx1NzU1OVx1NTM5Rlx1NTc4Qlx1RkYwOEFwcERhdGEvRWR1Y2F0aW9uIFx1N0I0OVx1N0M3Qlx1NUI5RVx1NEY4Qlx1NTE0Qlx1OTY4Nlx1NTQwRVx1NjVCOVx1NkNENVx1NEVDRFx1NTNFRlx1NzUyOFx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsb25lPFQ+KHZhbHVlOiBUKTogVCB7XG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS5tYXAoKHYpID0+IGNsb25lKHYpKSBhcyB1bmtub3duIGFzIFQ7XG4gIH1cbiAgaWYgKHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikge1xuICAgIGNvbnN0IG91dCA9IE9iamVjdC5jcmVhdGUoT2JqZWN0LmdldFByb3RvdHlwZU9mKHZhbHVlKSkgYXMgUmVjb3JkPFxuICAgICAgc3RyaW5nLFxuICAgICAgdW5rbm93blxuICAgID47XG4gICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXModmFsdWUpKSB7XG4gICAgICBvdXRba2V5XSA9IGNsb25lKCh2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilba2V5XSk7XG4gICAgfVxuICAgIHJldHVybiBvdXQgYXMgVDtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKiBcdTdFRDNcdTY3ODRcdTUzMTZcdTc2RjhcdTdCNDlcdUZGMUFKU09OIFx1NTAzQ1x1N0VBN1x1NTIyQlx1NzY4NFx1NkRGMVx1NUVBNlx1NkJENFx1OEY4M1x1RkYwOFx1NTQyQlx1NUI1N1x1NkJCNVx1OTg3QVx1NUU4Rlx1NjVFMFx1NTE3M1x1NzY4NFx1OTUyRVx1NkJENFx1OEY4M1x1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlZXBFcXVhbChhOiB1bmtub3duLCBiOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIGlmIChhID09PSBiKSByZXR1cm4gdHJ1ZTtcbiAgaWYgKEFycmF5LmlzQXJyYXkoYSkgJiYgQXJyYXkuaXNBcnJheShiKSkge1xuICAgIHJldHVybiBhLmxlbmd0aCA9PT0gYi5sZW5ndGggJiYgYS5ldmVyeSgodiwgaSkgPT4gZGVlcEVxdWFsKHYsIGJbaV0pKTtcbiAgfVxuICBpZiAoXG4gICAgdHlwZW9mIGEgPT09IFwib2JqZWN0XCIgJiZcbiAgICBhICE9PSBudWxsICYmXG4gICAgdHlwZW9mIGIgPT09IFwib2JqZWN0XCIgJiZcbiAgICBiICE9PSBudWxsICYmXG4gICAgIUFycmF5LmlzQXJyYXkoYSkgJiZcbiAgICAhQXJyYXkuaXNBcnJheShiKVxuICApIHtcbiAgICBjb25zdCBrYSA9IE9iamVjdC5rZXlzKGEpO1xuICAgIGNvbnN0IGtiID0gT2JqZWN0LmtleXMoYik7XG4gICAgaWYgKGthLmxlbmd0aCAhPT0ga2IubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIGthLmV2ZXJ5KChrKSA9PlxuICAgICAgZGVlcEVxdWFsKFxuICAgICAgICAoYSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilba10sXG4gICAgICAgIChiIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtrXSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG4iLCAiLy8hIFx1NUI5RVx1NEY1MyBJRFx1RkYxQVVVSUQgdjRcdUZGMDhcdTVCRjlcdTVFOTQgUnVzdCBgVXVpZDo6bmV3X3Y0KCkudG9fc3RyaW5nKClgXHVGRjA5XHUzMDAyXG4vLyEgXHU0RjE4XHU1MTQ4XHU3NTI4XHU1RTczXHU1M0YwIGBjcnlwdG8ucmFuZG9tVVVJRGBcdUZGMENcdTkwMDBcdTUzMTZcdTY1RjZcdTc1MjggTWF0aC5yYW5kb20gXHU1QjlFXHU3M0IwIFJGQyA0MTIyIHY0XHUzMDAyXG5cbmV4cG9ydCBmdW5jdGlvbiBpZCgpOiBzdHJpbmcge1xuICBjb25zdCBjcnlwdG8gPSBnbG9iYWxUaGlzLmNyeXB0byBhcyB7IHJhbmRvbVVVSUQ/OiAoKSA9PiBzdHJpbmcgfSB8IHVuZGVmaW5lZDtcbiAgaWYgKGNyeXB0byAmJiB0eXBlb2YgY3J5cHRvLnJhbmRvbVVVSUQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHJldHVybiBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICB9XG4gIC8vIFJGQyA0MTIyIHY0IFx1OTAwMFx1NTMxNlx1NUI5RVx1NzNCMFx1RkYwOFx1NEVDNVx1NzUyOFx1NEU4RVx1NjVFMCBjcnlwdG8gXHU3Njg0XHU3M0FGXHU1ODgzXHVGRjA5XHUzMDAyXG4gIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoMTYpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyBpICs9IDEpIGJ5dGVzW2ldID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMjU2KTtcbiAgYnl0ZXNbNl0gPSAoYnl0ZXNbNl0hICYgMHgwZikgfCAweDQwO1xuICBieXRlc1s4XSA9IChieXRlc1s4XSEgJiAweDNmKSB8IDB4ODA7XG4gIGNvbnN0IGhleCA9IEFycmF5LmZyb20oYnl0ZXMsIChiKSA9PiBiLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIikpLmpvaW4oXG4gICAgXCJcIixcbiAgKTtcbiAgcmV0dXJuIGAke2hleC5zbGljZSgwLCA4KX0tJHtoZXguc2xpY2UoOCwgMTIpfS0ke2hleC5zbGljZSgxMiwgMTYpfS0ke2hleC5zbGljZSgxNiwgMjApfS0ke2hleC5zbGljZSgyMCl9YDtcbn1cbiIsICIvLyEgXHU2NzJDXHU1NzMwXHU2NUU1XHU1Mzg2XHU0RTBFXHU2NUY2XHU1MjNCXHU1REU1XHU1MTc3XHUzMDAyXG4vLyFcbi8vISBcdTU5NTFcdTdFQTZcdUZGMDhkb2NzL1BMQU5fRk9STUFULm1kXHUzMDAxZG9jcy9CQUNLVVBfRk9STUFULm1kXHUzMDAxQVBJLm1kXHVGRjA5XHVGRjFBXG4vLyEgXHU2MjQwXHU2NzA5XHU2NUY2XHU5NUY0XHU2MjMzXHU5MEZEXHU2NjJGIFVuaXggXHU3OUQyXHVGRjBDXHU2MzA5KipcdTY3MkNcdTY3M0FcdTY1RjZcdTUzM0EqKlx1ODlFM1x1OEJGQlx1RkYwOFx1NUJGOVx1NUU5NCBSdXN0IGBjaHJvbm86OkxvY2FsYFx1RkYwOVx1RkYxQlxuLy8hIFx1NjVFNVx1NjcxRlx1NEUzQSBgWVlZWS1NTS1ERGBcdUZGMENcdTY1RjZcdTk1RjRcdTRFM0EgYEhIOk1NYFx1MzAwMlx1NjVFNVx1NTM4Nlx1OEZEMFx1N0I5N1x1NjMwOVx1MzAwQ1x1ODFFQVx1NzEzNlx1NjVFNVx1MzAwRFx1OEZEQlx1ODg0Q1x1RkYwQ1x1NEUwRFx1NTNEN1x1NTkwRlx1NEVFNFx1NjVGNlx1NUY3MVx1NTRDRFxuLy8hIFx1RkYwOFx1NUJGOVx1NUU5NCBSdXN0IGBOYWl2ZURhdGVgIFx1NzY4NCBgY2hlY2tlZF9hZGRfZGF5c2BcdUZGMDlcdTMwMDJcblxuZXhwb3J0IGludGVyZmFjZSBDYWxlbmRhckRhdGUge1xuICB5ZWFyOiBudW1iZXI7XG4gIG1vbnRoOiBudW1iZXI7XG4gIGRheTogbnVtYmVyO1xufVxuXG5jb25zdCBEQVlfTVMgPSA4NjQwMDAwMDtcblxuY29uc3QgcGFkMiA9IChuOiBudW1iZXIpOiBzdHJpbmcgPT4gKG4gPCAxMCA/IGAwJHtufWAgOiBTdHJpbmcobikpO1xuY29uc3QgcGFkNCA9IChuOiBudW1iZXIpOiBzdHJpbmcgPT4gU3RyaW5nKG4pLnBhZFN0YXJ0KDQsIFwiMFwiKTtcblxuLyoqIFVuaXggXHU3OUQyIFx1MjE5MiBcdTY3MkNcdTY3M0FcdTY1RTVcdTUzODZcdTY1RTVcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhbERhdGVPZihhdDogbnVtYmVyKTogQ2FsZW5kYXJEYXRlIHtcbiAgY29uc3QgZCA9IG5ldyBEYXRlKGF0ICogMTAwMCk7XG4gIHJldHVybiB7IHllYXI6IGQuZ2V0RnVsbFllYXIoKSwgbW9udGg6IGQuZ2V0TW9udGgoKSArIDEsIGRheTogZC5nZXREYXRlKCkgfTtcbn1cblxuLyoqIFVuaXggXHU3OUQyIFx1MjE5MiBcdTY3MkNcdTY3M0FcdTY1RTVcdTY3MUYgYFlZWVktTU0tRERgXHVGRjA4XHU1QkY5XHU1RTk0IGBjcmF0ZTo6ZGF0ZV9hdGBcdUZGMDlcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBkYXRlQXQoYXQ6IG51bWJlcik6IHN0cmluZyB7XG4gIGNvbnN0IHsgeWVhciwgbW9udGgsIGRheSB9ID0gbG9jYWxEYXRlT2YoYXQpO1xuICByZXR1cm4gYCR7cGFkNCh5ZWFyKX0tJHtwYWQyKG1vbnRoKX0tJHtwYWQyKGRheSl9YDtcbn1cblxuLyoqXG4gKiBcdTg5RTNcdTY3OTAgYFlZWVktTU0tRERgXHVGRjFCXHU2NUUwXHU2NTQ4XHU2MjE2XHU5NzVFXHU3NzFGXHU1QjlFXHU2NUU1XHU2NzFGXHVGRjA4XHU1OTgyIDIwMjYtMDItMzBcdUZGMDlcdThGRDRcdTU2REUgbnVsbFx1MzAwMlxuICogXHU1QkY5XHU1RTk0IGBOYWl2ZURhdGU6OnBhcnNlX2Zyb21fc3RyKHMsIFwiJVktJW0tJWRcIilgXHUzMDAyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZURhdGUodmFsdWU6IHN0cmluZyk6IENhbGVuZGFyRGF0ZSB8IG51bGwge1xuICBpZiAoIS9eXFxkezR9LVxcZHsyfS1cXGR7Mn0kLy50ZXN0KHZhbHVlKSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHllYXIgPSBOdW1iZXIodmFsdWUuc2xpY2UoMCwgNCkpO1xuICBjb25zdCBtb250aCA9IE51bWJlcih2YWx1ZS5zbGljZSg1LCA3KSk7XG4gIGNvbnN0IGRheSA9IE51bWJlcih2YWx1ZS5zbGljZSg4LCAxMCkpO1xuICBjb25zdCBwcm9iZSA9IG5ldyBEYXRlKERhdGUuVVRDKHllYXIsIG1vbnRoIC0gMSwgZGF5KSk7XG4gIGlmIChcbiAgICBwcm9iZS5nZXRVVENGdWxsWWVhcigpICE9PSB5ZWFyIHx8XG4gICAgcHJvYmUuZ2V0VVRDTW9udGgoKSAhPT0gbW9udGggLSAxIHx8XG4gICAgcHJvYmUuZ2V0VVRDRGF0ZSgpICE9PSBkYXlcbiAgKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIHsgeWVhciwgbW9udGgsIGRheSB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWREYXRlKHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIHBhcnNlRGF0ZSh2YWx1ZSkgIT09IG51bGw7XG59XG5cbi8qKiBcdTgxRUFcdTcxMzZcdTY1RTVcdTUyQTBcdTZDRDVcdUZGMDhcdTUzRUZcdThEMUZcdUZGMDlcdUZGMENcdTRFMEVcdTU5MEZcdTRFRTRcdTY1RjZcdTY1RTBcdTUxNzNcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGREYXlzKGRhdGU6IENhbGVuZGFyRGF0ZSwgZGF5czogbnVtYmVyKTogQ2FsZW5kYXJEYXRlIHtcbiAgY29uc3QgdCA9IG5ldyBEYXRlKERhdGUuVVRDKGRhdGUueWVhciwgZGF0ZS5tb250aCAtIDEsIGRhdGUuZGF5ICsgZGF5cykpO1xuICByZXR1cm4ge1xuICAgIHllYXI6IHQuZ2V0VVRDRnVsbFllYXIoKSxcbiAgICBtb250aDogdC5nZXRVVENNb250aCgpICsgMSxcbiAgICBkYXk6IHQuZ2V0VVRDRGF0ZSgpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcGFyZURhdGVzKGE6IENhbGVuZGFyRGF0ZSwgYjogQ2FsZW5kYXJEYXRlKTogbnVtYmVyIHtcbiAgcmV0dXJuIGEueWVhciAtIGIueWVhciB8fCBhLm1vbnRoIC0gYi5tb250aCB8fCBhLmRheSAtIGIuZGF5O1xufVxuXG4vKiogMSA9IFx1NTQ2OFx1NEUwMCBcdTIwMjYgNyA9IFx1NTQ2OFx1NjVFNVx1RkYwOFx1NUJGOVx1NUU5NCBgd2Vla2RheSgpLm51bWJlcl9mcm9tX21vbmRheSgpYFx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdlZWtkYXlNb25kYXkoZGF0ZTogQ2FsZW5kYXJEYXRlKTogbnVtYmVyIHtcbiAgY29uc3QgZGF5ID0gbmV3IERhdGUoXG4gICAgRGF0ZS5VVEMoZGF0ZS55ZWFyLCBkYXRlLm1vbnRoIC0gMSwgZGF0ZS5kYXkpLFxuICApLmdldFVUQ0RheSgpOyAvLyAwID0gU3VuZGF5XG4gIHJldHVybiBkYXkgPT09IDAgPyA3IDogZGF5O1xufVxuXG4vKiogXHU2MjQwXHU1NzI4XHU1NDY4XHU3Njg0XHU1NDY4XHU0RTAwXHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gd2Vla1N0YXJ0KGRhdGU6IENhbGVuZGFyRGF0ZSk6IENhbGVuZGFyRGF0ZSB7XG4gIHJldHVybiBhZGREYXlzKGRhdGUsIC0od2Vla2RheU1vbmRheShkYXRlKSAtIDEpKTtcbn1cblxuLyoqIFx1NEUyNFx1NEUyQVx1NjVFNVx1NTM4Nlx1NjVFNVx1NzZGOFx1NURFRVx1NzY4NFx1ODFFQVx1NzEzNlx1NjVFNVx1NjU3MFx1RkYwOHRvIC0gZnJvbVx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRheXNCZXR3ZWVuKGZyb206IENhbGVuZGFyRGF0ZSwgdG86IENhbGVuZGFyRGF0ZSk6IG51bWJlciB7XG4gIGNvbnN0IGEgPSBEYXRlLlVUQyhmcm9tLnllYXIsIGZyb20ubW9udGggLSAxLCBmcm9tLmRheSk7XG4gIGNvbnN0IGIgPSBEYXRlLlVUQyh0by55ZWFyLCB0by5tb250aCAtIDEsIHRvLmRheSk7XG4gIHJldHVybiBNYXRoLmZsb29yKChiIC0gYSkgLyBEQVlfTVMpO1xufVxuXG4vKiogXHU2NUU1XHU1Mzg2XHU2NUU1IFx1MjE5MiBgWVlZWS1NTS1ERGBcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXREYXRlKGRhdGU6IENhbGVuZGFyRGF0ZSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtwYWQ0KGRhdGUueWVhcil9LSR7cGFkMihkYXRlLm1vbnRoKX0tJHtwYWQyKGRhdGUuZGF5KX1gO1xufVxuXG4vKiogXHU2NzJDXHU2NzNBXHU2NUU1XHU2NzFGXHU2NUY2XHU1MjNCIFx1MjE5MiBVbml4IFx1NzlEMlx1RkYwOFx1NUJGOVx1NUU5NCBgTG9jYWwud2l0aF95bWRfYW5kX2htcyguLi4pLnRpbWVzdGFtcCgpYFx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF0TG9jYWwoXG4gIHllYXI6IG51bWJlcixcbiAgbW9udGg6IG51bWJlcixcbiAgZGF5OiBudW1iZXIsXG4gIGhvdXI6IG51bWJlcixcbiAgbWludXRlOiBudW1iZXIsXG4gIHNlY29uZCA9IDAsXG4pOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC5mbG9vcihcbiAgICBuZXcgRGF0ZSh5ZWFyLCBtb250aCAtIDEsIGRheSwgaG91ciwgbWludXRlLCBzZWNvbmQpLmdldFRpbWUoKSAvIDEwMDAsXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhdExvY2FsRGF0ZShkYXRlOiBDYWxlbmRhckRhdGUsIGhvdXIgPSAwLCBtaW51dGUgPSAwKTogbnVtYmVyIHtcbiAgcmV0dXJuIGF0TG9jYWwoZGF0ZS55ZWFyLCBkYXRlLm1vbnRoLCBkYXRlLmRheSwgaG91ciwgbWludXRlKTtcbn1cblxuLyoqIGBZWVlZLU1NLUREYCBcdTIxOTIgXHU4QkU1XHU2NUU1XHU2NzJDXHU2NzNBIDAwOjAwIFx1NzY4NCBVbml4IFx1NzlEMlx1RkYxQlx1NjVFMFx1NjU0OFx1NjVFNVx1NjcxRlx1OEZENFx1NTZERSBudWxsXHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gYXRMb2NhbERhdGVTdHJpbmcoZGF0ZTogc3RyaW5nKTogbnVtYmVyIHwgbnVsbCB7XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlRGF0ZShkYXRlKTtcbiAgaWYgKHBhcnNlZCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIHJldHVybiBhdExvY2FsRGF0ZShwYXJzZWQpO1xufVxuXG4vKiogVW5peCBcdTc5RDIgXHUyMTkyIFx1NjcyQ1x1NjczQSBgSEg6TU1gXHVGRjA4XHU1QkY5XHU1RTk0IGB0LmZvcm1hdChcIiVIOiVNXCIpYFx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhvdXJNaW51dGVTdHJpbmcoYXQ6IG51bWJlcik6IHN0cmluZyB7XG4gIGNvbnN0IGQgPSBuZXcgRGF0ZShhdCAqIDEwMDApO1xuICByZXR1cm4gYCR7cGFkMihkLmdldEhvdXJzKCkpfToke3BhZDIoZC5nZXRNaW51dGVzKCkpfWA7XG59XG5cbi8qKiBVbml4IFx1NzlEMiBcdTIxOTIgXHU2NzJDXHU2NzNBXHU1RjUzXHU1OTI5XHU1REYyXHU4RkM3XHU3OUQyXHU2NTcwXHVGRjA4MFx1MjAxMzg2Mzk5XHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gc2Vjb25kc09mRGF5KGF0OiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBkID0gbmV3IERhdGUoYXQgKiAxMDAwKTtcbiAgcmV0dXJuIGQuZ2V0SG91cnMoKSAqIDM2MDAgKyBkLmdldE1pbnV0ZXMoKSAqIDYwICsgZC5nZXRTZWNvbmRzKCk7XG59XG5cbi8qKiBVbml4IFx1NzlEMiBcdTIxOTIgXHU2NzJDXHU2NzNBIGAoaG91ciwgbWludXRlKWBcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBob3VyTWludXRlT2YoYXQ6IG51bWJlcik6IHsgaG91cjogbnVtYmVyOyBtaW51dGU6IG51bWJlciB9IHtcbiAgY29uc3QgZCA9IG5ldyBEYXRlKGF0ICogMTAwMCk7XG4gIHJldHVybiB7IGhvdXI6IGQuZ2V0SG91cnMoKSwgbWludXRlOiBkLmdldE1pbnV0ZXMoKSB9O1xufVxuXG4vKipcbiAqIFx1NjgyMVx1OUE4QyBgSEg6TU1gXHVGRjFBXHU5NTdGXHU1RUE2IDVcdTMwMDFcdTdCMkMgMyBcdTRGNERcdTY2MkYgYDpgXHUzMDAxXHU2NTcwXHU1QjU3XHU0RTE0IFx1NUMwRlx1NjVGNiBcdTIyNjQgMjNcdTMwMDFcdTUyMDZcdTk0OUYgXHUyMjY0IDU5XHUzMDAyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZFRpbWUodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIHZhbHVlLmxlbmd0aCA9PT0gNSAmJlxuICAgIHZhbHVlLmNoYXJDb2RlQXQoMikgPT09IDU4IC8qICc6JyAqLyAmJlxuICAgIHZhbHVlLnNsaWNlKDAsIDIpID49IFwiMDBcIiAmJlxuICAgIHZhbHVlLnNsaWNlKDAsIDIpIDw9IFwiMjNcIiAmJlxuICAgIHZhbHVlLnNsaWNlKDMpID49IFwiMDBcIiAmJlxuICAgIHZhbHVlLnNsaWNlKDMpIDw9IFwiNTlcIlxuICApO1xufVxuXG4vKiogYEhIOk1NYCBcdTIxOTIgXHU1MjA2XHU5NDlGXHU2NTcwXHVGRjFCXHU2NUUwXHU2NTQ4XHU4RkQ0XHU1NkRFIG51bGxcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBtaW51dGVzT2YodmFsdWU6IHN0cmluZyk6IG51bWJlciB8IG51bGwge1xuICBpZiAodmFsdWUubGVuZ3RoICE9PSA1IHx8IHZhbHVlLmNoYXJDb2RlQXQoMikgIT09IDU4KSByZXR1cm4gbnVsbDtcbiAgY29uc3QgaG91ciA9IE51bWJlcih2YWx1ZS5zbGljZSgwLCAyKSk7XG4gIGNvbnN0IG1pbnV0ZSA9IE51bWJlcih2YWx1ZS5zbGljZSgzKSk7XG4gIGlmIChcbiAgICAhTnVtYmVyLmlzSW50ZWdlcihob3VyKSB8fFxuICAgICFOdW1iZXIuaXNJbnRlZ2VyKG1pbnV0ZSkgfHxcbiAgICBob3VyID4gMjMgfHxcbiAgICBtaW51dGUgPiA1OVxuICApIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gaG91ciAqIDYwICsgbWludXRlO1xufVxuXG4vKiogXHU1RjUzXHU1MjREIFVuaXggXHU3OUQyXHVGRjA4XHU1QkY5XHU1RTk0IGBjcmF0ZTo6bm93YFx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vdygpOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCk7XG59XG4iLCAiLy8hIFx1OTg4Nlx1NTdERlx1NjU3MFx1NjM2RVx1NkEyMVx1NTc4Qlx1RkYxQVx1NEUwRSBjcmF0ZXMvY29yZSBcdTc2ODQgc2VyZGUgXHU3RUQzXHU2Nzg0XHU0RTAwXHU0RTAwXHU1QkY5XHU1RTk0XHUzMDAyXG4vLyFcbi8vISBcdTU0N0RcdTU0MERcdTg5QzRcdTUyMTlcdUZGMUFUUyBcdTUxODVcdTkwRThcdTVCNTdcdTZCQjVcdTU0MERcdTUzNzMgSlNPTiBjYW1lbENhc2UgXHU1NDBEXHVGRjA4XHU1QkY5XHU1RTk0IGAjW3NlcmRlKHJlbmFtZV9hbGw9XCJjYW1lbENhc2VcIildYFx1RkYwOVx1MzAwMlxuLy8hIFx1Njc5QVx1NEUzRVx1NjYyRlx1NUI1N1x1N0IyNlx1NEUzMlx1NUI1N1x1OTc2Mlx1OTFDRlx1ODA1NFx1NTQwOFx1RkYwOHNlcmRlIGNhbWVsQ2FzZSBcdTUzRDZcdTUwM0NcdUZGMDlcdUZGMENcdTVFOEZcdTUyMTdcdTUzMTZcdTUzNzNcdTc2RjRcdTYzQTVcdThGOTNcdTUxRkFcdTMwMDJcbi8vISBcdTUzRUZcdTkwMDkgSlNPTiBcdTVCNTdcdTZCQjVcdUZGMDhzZXJkZSBgT3B0aW9uYCAvIGAjW3NlcmRlKGRlZmF1bHQpXWBcdUZGMDlcdTg5RTNcdTY3OTBcdTU0MEVcdTdFREZcdTRFMDBcdTRFM0EgYFQgfCBudWxsYCBcdTYyMTZcdTdGM0FcdTc3MDFcdTUwM0NcdUZGMUJcbi8vISBcdTVFOEZcdTUyMTdcdTUzMTZcdTY1RjZcdTYzMDkgUnVzdCBcdTc2ODQgYHNraXBfc2VyaWFsaXppbmdfaWZgIFx1NTFCM1x1NUI5QVx1NjYyRlx1NTQyNlx1NzcwMVx1NzU2NVx1OTUyRVx1MzAwMlxuXG5leHBvcnQgaW50ZXJmYWNlIFByb2plY3Qge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGNvbG9yOiBzdHJpbmc7XG4gIC8qKiBcdTYzRDBcdTRGOUJcdTY1RjZcdTY2RkZcdTRFRTNcdTkwMUFcdTc1MjhcdTc2N0RcdTU0MERcdTUzNTVcdUZGMUJcdTVFOEZcdTUyMTdcdTUzMTZcdTY1RjYgbnVsbCBcdTc3MDFcdTc1NjVcdUZGMDhza2lwX3NlcmlhbGl6aW5nX2lmXHVGRjA5XHUzMDAyICovXG4gIGFwcFdoaXRlbGlzdDogc3RyaW5nW10gfCBudWxsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEhhYml0U2xvdCB7XG4gIC8qKiAxID0gXHU1NDY4XHU0RTAwIFx1MjAyNiA3ID0gXHU1NDY4XHU2NUU1XHUzMDAyICovXG4gIGRheXM6IG51bWJlcltdO1xuICB0aW1lOiBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEhhYml0IHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFZpc2lvbiB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgbm90ZXM6IHN0cmluZztcbiAgLyoqIFx1NUU4Rlx1NTIxN1x1NTMxNlx1NjVGNiBudWxsIFx1NzcwMVx1NzU2NVx1MzAwMiAqL1xuICBwcm9qZWN0SWQ6IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3VidGFzayB7XG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGRvbmU6IGJvb2xlYW47XG59XG5cbi8qKiBcdTdCQTFcdThGOTZcdTUyMDZcdTdDN0JcdUZGMUFcdTc1MzFcdTUxQkJcdTdFRDNcdTVCNTdcdTZCQjVcdTYzQThcdTVCRkNcdUZGMENcdTZDMzhcdTRFMERcdTRGNUNcdTRFM0FcdTc1MjhcdTYyMzdcdTY1NzBcdTYzNkVcdTVCNThcdTUwQThcdTMwMDIgKi9cbmV4cG9ydCB0eXBlIFRhc2tLaW5kID0gXCJvcmRpbmFyeVwiIHwgXCJoYWJpdFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFRhc2sge1xuICBpZDogc3RyaW5nO1xuICAvKiogXHU0RkREXHU3NTU5XHU2NzJDXHU2QjIxXHU0RUZCXHU1MkExXHU3Njg0XHU5MUNEXHU1OTBEXHU2NzY1XHU2RTkwXHVGRjBDXHU1MTczXHU5NUVEXHU1RkFBXHU3M0FGXHU0RTBEXHU2NTM5XHU1MTk5XHU1Mzg2XHU1M0YyXHU1MjA2XHU3QzdCXHUzMDAyICovXG4gIHJlY3VycmluZzogYm9vbGVhbjtcbiAgcmVwZWF0OiBSZXBlYXQ7XG4gIHJlcGVhdERheXM6IG51bWJlcltdO1xuICAvKiogXHU1REYyXHU3NTFGXHU2MjEwXHU3Njg0XHU0RTBCXHU0RTAwXHU2QjIxXHU0RUZCXHU1MkExIElEXHVGRjFCXHU1MjIwXHU5NjY0XHU0RTBCXHU0RTAwXHU2QjIxXHU0RTVGXHU0RTBEXHU0RjFBXHU5MUNEXHU2NUIwXHU3NTFGXHU2MjEwXHUzMDAyICovXG4gIG5leHRUYXNrSWQ6IHN0cmluZyB8IG51bGw7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIG5vdGVzOiBzdHJpbmc7XG4gIHByb2plY3RJZDogc3RyaW5nIHwgbnVsbDtcbiAgaGFiaXRJZDogc3RyaW5nIHwgbnVsbDtcbiAgZHVlRGF0ZTogc3RyaW5nIHwgbnVsbDtcbiAgcmVtaW5kZXJUaW1lOiBzdHJpbmcgfCBudWxsO1xuICBmb2N1c01pbnV0ZXM6IG51bWJlciB8IG51bGw7XG4gIC8qKiBcdTY2NkVcdTkwMUFcdTRFRkJcdTUyQTFcdThCQTFcdTUyMTJcdTU3NTdcdTdFRDNcdTY3NUZcdTU0MEVcdTc2ODRcdTk3NTlcdTYwMDFcdTkxQ0RcdTRGRUVcdTdBOTdcdTUzRTNcdUZGMDhcdTUyMDZcdTk0OUZcdUZGMDlcdUZGMUIwIFx1NTM3M1x1NTIzMFx1NzBCOVx1NEY1Q1x1NUU5Rlx1MzAwMiAqL1xuICBzY3JhcE1pbnV0ZXM6IG51bWJlcjtcbiAgLyoqIFx1NjVFMFx1N0NCRVx1Nzg2RVx1NjNEMFx1OTE5Mlx1NjVGNlx1OTVGNFx1NzY4NFx1OTc1RVx1NUZBQVx1NzNBRlx1NEVGQlx1NTJBMVx1RkYwQ1x1NTNEMVx1NzUxRlx1NjVFNVx1NEU0Qlx1NTQwRVx1NEZERFx1NzU1OVx1NzY4NFx1ODFFQVx1NzEzNlx1NjVFNVx1NjU3MFx1MzAwMiAqL1xuICBleHBpcnlEYXlzOiBudW1iZXI7XG4gIHByaW9yaXR5OiBudW1iZXI7XG4gIGVzdGltYXRlOiBudW1iZXI7XG4gIHJlbWluZGVyRmlyZWQ6IGJvb2xlYW47XG4gIHJlbWluZGVyUGVuZGluZzogYm9vbGVhbjtcbiAgcmVtaW5kZXJFeHBpcmVkOiBib29sZWFuO1xuICBjb21wbGV0ZWQ6IGJvb2xlYW47XG4gIGNvbXBsZXRlZEF0OiBudW1iZXIgfCBudWxsO1xuICBjcmVhdGVkQXQ6IG51bWJlcjtcbiAgdGFnczogc3RyaW5nW107XG4gIHN1YnRhc2tzOiBTdWJ0YXNrW107XG59XG5cbi8qKiBcdTRFRkJcdTUyQTFcdTc2ODRcdTdCQTFcdThGOTZcdTUyMDZcdTdDN0JcdUZGMDhcdTUzNTVcdTRFMDBcdTY3NDNcdTVBMDFcdTVCOUFcdTRFNDlcdUZGMENcdThCRkJcdTUxQkJcdTdFRDNcdTVCNTdcdTZCQjVcdUZGMDlcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBraW5kT2YoXG4gIHRhc2s6IFBpY2s8VGFzaywgXCJyZW1pbmRlclRpbWVcIiB8IFwiaGFiaXRJZFwiIHwgXCJyZWN1cnJpbmdcIj4sXG4pOiBUYXNrS2luZCB7XG4gIHJldHVybiB0YXNrLnJlbWluZGVyVGltZSAhPT0gbnVsbCAmJiAodGFzay5oYWJpdElkICE9PSBudWxsIHx8IHRhc2sucmVjdXJyaW5nKVxuICAgID8gXCJoYWJpdFwiXG4gICAgOiBcIm9yZGluYXJ5XCI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0hhYml0KFxuICB0YXNrOiBQaWNrPFRhc2ssIFwicmVtaW5kZXJUaW1lXCIgfCBcImhhYml0SWRcIiB8IFwicmVjdXJyaW5nXCI+LFxuKTogYm9vbGVhbiB7XG4gIHJldHVybiBraW5kT2YodGFzaykgPT09IFwiaGFiaXRcIjtcbn1cblxuZXhwb3J0IHR5cGUgUmVwZWF0ID0gXCJub25lXCIgfCBcImRhaWx5XCIgfCBcIndlZWtkYXlzXCIgfCBcIndlZWtseVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFRhc2tEcmFmdCB7XG4gIGlkOiBzdHJpbmcgfCBudWxsO1xuICB0aXRsZTogc3RyaW5nO1xuICBub3Rlczogc3RyaW5nO1xuICBwcm9qZWN0SWQ6IHN0cmluZyB8IG51bGw7XG4gIGR1ZURhdGU6IHN0cmluZyB8IG51bGw7XG4gIHJlbWluZGVyVGltZTogc3RyaW5nIHwgbnVsbDtcbiAgZm9jdXNNaW51dGVzOiBudW1iZXIgfCBudWxsO1xuICBzY3JhcE1pbnV0ZXM6IG51bWJlcjtcbiAgLyoqIFx1NjVFMFx1N0NCRVx1Nzg2RVx1NjNEMFx1OTE5Mlx1NjVGNlx1OTVGNFx1NzY4NFx1OTc1RVx1NUZBQVx1NzNBRlx1NEVGQlx1NTJBMVx1RkYwQ1x1NTNEMVx1NzUxRlx1NjVFNVx1NEU0Qlx1NTQwRVx1NEZERFx1NzU1OVx1NzY4NFx1ODFFQVx1NzEzNlx1NjVFNVx1NjU3MFx1MzAwMiAqL1xuICBleHBpcnlEYXlzOiBudW1iZXI7XG4gIHByaW9yaXR5OiBudW1iZXI7XG4gIGVzdGltYXRlOiBudW1iZXI7XG4gIHRhZ3M6IHN0cmluZ1tdO1xuICBzdWJ0YXNrczogU3VidGFza1tdO1xuICByZXBlYXQ6IFJlcGVhdDtcbiAgcmVwZWF0RGF5czogbnVtYmVyW107XG59XG5cbmV4cG9ydCB0eXBlIEd1YXJkTW9kZSA9IFwib2ZmXCIgfCBcImxvY2tcIiB8IFwid2hpdGVsaXN0XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvdGVjdGlvbiB7XG4gIG1vZGU6IEd1YXJkTW9kZTtcbiAgd2hpdGVsaXN0OiBzdHJpbmdbXTtcbiAgc3RyaWN0OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzIHtcbiAgZm9jdXNNaW51dGVzOiBudW1iZXI7XG4gIHNob3J0QnJlYWtNaW51dGVzOiBudW1iZXI7XG4gIGxvbmdCcmVha01pbnV0ZXM6IG51bWJlcjtcbiAgbG9uZ0JyZWFrRXZlcnk6IG51bWJlcjtcbiAgZGFpbHlHb2FsOiBudW1iZXI7XG4gIGF1dG9CcmVhazogYm9vbGVhbjtcbiAgYXV0b0ZvY3VzOiBib29sZWFuO1xuICBhdXRvU3RhcnRUYXNrczogYm9vbGVhbjtcbiAgc291bmQ6IGJvb2xlYW47XG4gIHNvdW5kVm9sdW1lOiBudW1iZXI7XG4gIG5vdGlmaWNhdGlvbnM6IGJvb2xlYW47XG4gIGFsd2F5c09uVG9wOiBib29sZWFuO1xuICB0aGVtZTogc3RyaW5nO1xuICBwZXJzb25hQmFja2Ryb3A6IGJvb2xlYW47XG4gIHByb3RlY3Rpb246IFByb3RlY3Rpb247XG59XG5cbmV4cG9ydCB0eXBlIE1vZGUgPSBcImZvY3VzXCIgfCBcInNob3J0QnJlYWtcIiB8IFwibG9uZ0JyZWFrXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGltZXIge1xuICBtb2RlOiBNb2RlO1xuICBydW5uaW5nOiBib29sZWFuO1xuICB0YXNrSWQ6IHN0cmluZyB8IG51bGw7XG4gIGR1cmF0aW9uU2VjczogbnVtYmVyO1xuICByZW1haW5pbmdTZWNzOiBudW1iZXI7XG4gIGRlYWRsaW5lOiBudW1iZXIgfCBudWxsO1xuICBzdGFydGVkQXQ6IG51bWJlciB8IG51bGw7XG4gIGN5Y2xlOiBudW1iZXI7XG4gIGN5Y2xlRGF0ZTogc3RyaW5nIHwgbnVsbDtcbiAgY29tcGxldGlvblNlcmlhbDogbnVtYmVyO1xuICBsYXN0RmluaXNoZWRNb2RlOiBNb2RlIHwgbnVsbDtcbiAgYXV0b0ZvY3VzQmxvY2tlZDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IHR5cGUgU2Vzc2lvblNvdXJjZSA9IFwidGltZXJcIiB8IFwidGFza0VzdGltYXRlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2Vzc2lvbiB7XG4gIGlkOiBzdHJpbmc7XG4gIHNvdXJjZTogU2Vzc2lvblNvdXJjZTtcbiAgdGFza0lkOiBzdHJpbmcgfCBudWxsO1xuICB0YXNrVGl0bGU6IHN0cmluZztcbiAgcHJvamVjdE5hbWU6IHN0cmluZztcbiAgc3RhcnRlZEF0OiBudW1iZXI7XG4gIGVuZGVkQXQ6IG51bWJlcjtcbiAgZHVyYXRpb25TZWNzOiBudW1iZXI7XG4gIGNvbXBsZXRlZDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IHR5cGUgRGV0YWNoVGFyZ2V0ID0gXCJwcm9qZWN0XCIgfCBcImhhYml0XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF5U3RhdCB7XG4gIGRhdGU6IHN0cmluZztcbiAgc2Vjb25kczogbnVtYmVyO1xuICBwb21vZG9yb3M6IG51bWJlcjtcbiAgLyoqIFx1NUI5QVx1NjVGNlx1OTFDRFx1NTkwRFx1NEU2MFx1NjBFRlx1NUY1M1x1NTkyOVx1NTIzMFx1NjcxRlx1NjcyQVx1NUI4Q1x1NjIxMFx1MzAwMiAqL1xuICBtaXNzZWQ6IG51bWJlcjtcbiAgY29tcGxldGVkOiBudW1iZXI7XG4gIC8qKiBcdTY2NkVcdTkwMUFcdTVCOUFcdTY1RjZcdTVCOUVcdTRGOEJcdTVGNTNcdTU5MjlcdTRGNUNcdTVFOUZcdTY3MkFcdTVCOENcdTYyMTBcdTMwMDIgKi9cbiAgdm9pZGVkOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RhdHMge1xuICB0b2RheVNlY29uZHM6IG51bWJlcjtcbiAgdG9kYXlQb21vZG9yb3M6IG51bWJlcjtcbiAgdG9kYXlDb21wbGV0ZWQ6IG51bWJlcjtcbiAgdG90YWxTZWNvbmRzOiBudW1iZXI7XG4gIHRvdGFsUG9tb2Rvcm9zOiBudW1iZXI7XG4gIHN0cmVhazogbnVtYmVyO1xuICBkYXlzOiBEYXlTdGF0W107XG59XG5cbi8vIC0tLS0tLS0tLS0gXHU1QjlBXHU2NUY2XHU5NTAxXHU2NzNBXHVGRjA4XHU2NTcwXHU2MzZFXHU2QTIxXHU1NzhCICsgXHU3RUFGXHU4QzAzXHU1RUE2XHU5MDNCXHU4RjkxXHVGRjFCXHU2ODRDXHU5NzYyXHU2MjY3XHU4ODRDXHU3NTU5XHU1MzlGXHU3NTFGIGd1YXJkXHVGRjA5IC0tLS0tLS0tLS1cblxuZXhwb3J0IGludGVyZmFjZSBMb2NrU2NoZWR1bGUge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIHN0YXJ0OiBzdHJpbmc7XG4gIGVuZDogc3RyaW5nO1xuICBkYXlzOiBudW1iZXJbXTtcbiAgZW5hYmxlZDogYm9vbGVhbjtcbiAgc3RyaWN0OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFjdGl2ZUxvY2sge1xuICBuYW1lOiBzdHJpbmc7XG4gIHN0YXJ0ZWRBdDogbnVtYmVyO1xuICBlbmRzQXQ6IG51bWJlcjtcbiAgc3RyaWN0OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExvY2tTdGF0ZSB7XG4gIHNjaGVkdWxlczogTG9ja1NjaGVkdWxlW107XG4gIGFjdGl2ZTogQWN0aXZlTG9jayB8IG51bGw7XG4gIHN1cHByZXNzZWRVbnRpbDogbnVtYmVyO1xufVxuXG4vLyAtLS0tLS0tLS0tIFx1OEJGRVx1ODg2OFx1OTYzQlx1NTg1RVx1NjVGNlx1NkJCNSAtLS0tLS0tLS0tXG5cbmV4cG9ydCB0eXBlIEF0dGVudGlvbiA9IFwicmVxdWlyZWRcIiB8IFwibGlnaHRcIjtcblxuZXhwb3J0IGludGVyZmFjZSBCbG9jayB7XG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIC8qKiAxID0gXHU1NDY4XHU0RTAwIFx1MjAyNiA3ID0gXHU1NDY4XHU2NUU1XHUzMDAyICovXG4gIGRheXM6IG51bWJlcltdO1xuICAvKiogXHU2NzJDXHU2NzNBIEhIOk1NXHVGRjFCZW5kIFx1NEUwRFx1NjY1QVx1NEU4RSBzdGFydCBcdTg4NjhcdTc5M0FcdThERThcdTUzNDhcdTU5MUNcdTMwMDIgKi9cbiAgc3RhcnQ6IHN0cmluZztcbiAgZW5kOiBzdHJpbmc7XG4gIGF0dGVudGlvbjogQXR0ZW50aW9uO1xuICBub3Rlczogc3RyaW5nO1xufVxuXG4vLyAtLS0tLS0tLS0tIFx1NkMzOFx1NEU0NSBJRCBcdTc2N0JcdThCQjAgLS0tLS0tLS0tLVxuXG5leHBvcnQgaW50ZXJmYWNlIElkZW50aXR5IHtcbiAgaWQ6IHN0cmluZztcbiAga2luZDogc3RyaW5nO1xuICByZXRpcmVkOiBib29sZWFuO1xuICAvKiogXHU1MzlGXHU0RUZCXHU1MkExXHU2MDYyXHU1OTBEXHU4QkIwXHU1RjU1XHVGRjFBY2Fub25pY2FsIFx1NUU4Rlx1NTIxN1x1NTMxNlx1NTQwRVx1NzY4NCBUYXNrIEpTT04gXHU1QjU3XHU3QjI2XHU0RTMyXHUzMDAyICovXG4gIHJlc3RvcmVUYXNrOiBzdHJpbmcgfCBudWxsO1xufVxuXG4vLyAtLS0tLS0tLS0tIFx1OEJBMVx1NTIxMlx1NjU4N1x1NEVGNiB2NyAtLS0tLS0tLS0tXG5cbmV4cG9ydCBpbnRlcmZhY2UgUGxhblByb2plY3Qge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGNvbG9yOiBzdHJpbmc7XG4gIC8qKiBcdTVFOEZcdTUyMTdcdTUzMTZcdTY1RjYgbnVsbCBcdTc3MDFcdTc1NjVcdUZGMUJcdTYzRDBcdTRGOUJcdTY1RjZcdTVCRkNcdTUxNjVcdTRGMUFcdTg5ODZcdTc2RDZcdTY3MkNcdTY3M0FcdTZFMDVcdTUzNTVcdTMwMDIgKi9cbiAgYXBwV2hpdGVsaXN0OiBzdHJpbmdbXSB8IG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGxhblN1YnRhc2sge1xuICBpZDogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBsYW5UYXNrIHtcbiAgaWQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgaGFiaXRJZDogc3RyaW5nIHwgbnVsbDtcbiAgcmVjdXJyaW5nOiBib29sZWFuO1xuICBzY3JhcE1pbnV0ZXM6IG51bWJlcjtcbiAgLyoqIFx1NjVFMFx1N0NCRVx1Nzg2RVx1NjNEMFx1OTE5Mlx1NjVGNlx1OTVGNFx1NzY4NFx1OTc1RVx1NUZBQVx1NzNBRlx1NEVGQlx1NTJBMVx1RkYwQ1x1NTNEMVx1NzUxRlx1NjVFNVx1NEU0Qlx1NTQwRVx1NEZERFx1NzU1OVx1NzY4NFx1ODFFQVx1NzEzNlx1NjVFNVx1NjU3MFx1MzAwMiAqL1xuICBleHBpcnlEYXlzOiBudW1iZXI7XG4gIG5vdGVzOiBzdHJpbmc7XG4gIHByb2plY3RJZDogc3RyaW5nIHwgbnVsbDtcbiAgZHVlRGF0ZTogc3RyaW5nIHwgbnVsbDtcbiAgLyoqIFx1NUU4Rlx1NTIxN1x1NTMxNlx1NjVGNiBudWxsIFx1NzcwMVx1NzU2NVx1MzAwMiAqL1xuICByZW1pbmRlclRpbWU6IHN0cmluZyB8IG51bGw7XG4gIC8qKiBcdTVFOEZcdTUyMTdcdTUzMTZcdTY1RjYgbnVsbCBcdTc3MDFcdTc1NjVcdTMwMDIgKi9cbiAgZm9jdXNNaW51dGVzOiBudW1iZXIgfCBudWxsO1xuICBwcmlvcml0eTogbnVtYmVyO1xuICBlc3RpbWF0ZTogbnVtYmVyO1xuICB0YWdzOiBzdHJpbmdbXTtcbiAgc3VidGFza3M6IFBsYW5TdWJ0YXNrW107XG4gIHJlcGVhdDogUmVwZWF0O1xuICByZXBlYXREYXlzOiBudW1iZXJbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQbGFuRmlsZSB7XG4gIGZvcm1hdDogc3RyaW5nO1xuICB2ZXJzaW9uOiBudW1iZXI7XG4gIHBvbW9kb3JvTWludXRlczogbnVtYmVyO1xuICBwcm9qZWN0czogUGxhblByb2plY3RbXTtcbiAgdGFza3M6IFBsYW5UYXNrW107XG4gIGJsb2NrczogQmxvY2tbXTtcbiAgaGFiaXRzOiBIYWJpdFtdO1xuICAvKiogXHU1RThGXHU1MjE3XHU1MzE2XHU2NUY2IGZhbHNlIFx1NzcwMVx1NzU2NVx1MzAwMiAqL1xuICByZXBsYWNlOiBib29sZWFuO1xufVxuXG4vLyAtLS0tLS0tLS0tIFx1NjU1OVx1NUI2NiAtLS0tLS0tLS0tXG5cbmV4cG9ydCB0eXBlIFJlc291cmNlS2luZCA9XG4gIHwgXCJzeWxsYWJ1c1wiXG4gIHwgXCJjb3Vyc2VcIlxuICB8IFwiYm9va1wiXG4gIHwgXCJwYXN0UGFwZXJcIlxuICB8IFwibW9ja1BhcGVyXCJcbiAgfCBcInJlZmVyZW5jZVwiXG4gIHwgXCJhdHRhY2htZW50XCJcbiAgfCBcImFuc3dlclNoZWV0XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvamVjdFN0dWR5IHtcbiAgcHJvamVjdElkOiBzdHJpbmc7XG4gIGRpcmVjdG9yeTogc3RyaW5nO1xuICBleGFtTW9kZTogYm9vbGVhbjtcbiAgdmlzaW9uSWQ6IHN0cmluZyB8IG51bGw7XG4gIHRhcmdldDogc3RyaW5nO1xuICBleGFtRGF0ZTogc3RyaW5nIHwgbnVsbDtcbiAgc3lsbGFidXNJZDogc3RyaW5nIHwgbnVsbDtcbiAgcGFzdFBhcGVySWRzOiBzdHJpbmdbXTtcbiAgbW9ja1BhcGVySWRzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZXNvdXJjZSB7XG4gIGlkOiBzdHJpbmc7XG4gIHByb2plY3RJZDogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBraW5kOiBSZXNvdXJjZUtpbmQ7XG4gIC8qKiBcdTc2RjhcdTVCRjlcdTk4NzlcdTc2RUVcdTYzODhcdTY3NDNcdTc2RUVcdTVGNTVcdUZGMUJcdTZDMzhcdTRFMERcdTYzODhcdTRFODhcdTY1ODdcdTRFRjZcdTdDRkJcdTdFREZcdThCQkZcdTk1RUVcdTMwMDIgKi9cbiAgcGF0aDogc3RyaW5nO1xuICBzb3VyY2U6IHN0cmluZztcbiAgZWRpdGlvbjogc3RyaW5nO1xuICB0b3BpY3M6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbGVzdG9uZSB7XG4gIHdlZWs6IG51bWJlcjtcbiAgdG9waWNzOiBzdHJpbmdbXTtcbiAgcmVzb3VyY2VJZHM6IHN0cmluZ1tdO1xuICBvYmplY3RpdmU6IHN0cmluZztcbiAgbGVzc29uQ291bnQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZW1lc3RlciB7XG4gIGlkOiBzdHJpbmc7XG4gIHByb2plY3RJZDogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBzdGFydERhdGU6IHN0cmluZztcbiAgZW5kRGF0ZTogc3RyaW5nO1xuICByZXZpc2lvbjogbnVtYmVyO1xuICBiYXNlbGluZTogc3RyaW5nO1xuICBldmlkZW5jZTogc3RyaW5nW107XG4gIHJhdGlvbmFsZTogc3RyaW5nO1xuICBtaWxlc3RvbmVzOiBNaWxlc3RvbmVbXTtcbn1cblxuZXhwb3J0IHR5cGUgTGVzc29uU3RhdGUgPSBcInBsYW5uZWRcIiB8IFwiYWN0aXZlXCIgfCBcImVuZGVkXCIgfCBcIm1pc3NlZFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIExlc3NvbiB7XG4gIGlkOiBzdHJpbmc7XG4gIHByb2plY3RJZDogc3RyaW5nO1xuICBzZW1lc3RlcklkOiBzdHJpbmc7XG4gIHNlbWVzdGVyUmV2aXNpb246IG51bWJlcjtcbiAgdGl0bGU6IHN0cmluZztcbiAgdG9waWNzOiBzdHJpbmdbXTtcbiAgcmVzb3VyY2VJZHM6IHN0cmluZ1tdO1xuICBzdGFydHNBdDogbnVtYmVyO1xuICBlbmRzQXQ6IG51bWJlcjtcbiAgYWlFbmFibGVkOiBib29sZWFuO1xuICBhdHRlbmRlZDogYm9vbGVhbjtcbiAgcHJvZ3Jlc3M6IHN0cmluZztcbiAgc3RhdGU6IExlc3NvblN0YXRlO1xufVxuXG5leHBvcnQgdHlwZSBBc3Nlc3NtZW50S2luZCA9IFwiaG9tZXdvcmtcIiB8IFwid2Vla2x5RXhhbVwiIHwgXCJtb2NrRXhhbVwiIHwgXCJyZXRlc3RcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTY29yaW5nUG9pbnQge1xuICBpZDogc3RyaW5nO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICBwb2ludHM6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBRdWVzdGlvbiB7XG4gIGlkOiBzdHJpbmc7XG4gIHByb21wdDogc3RyaW5nO1xuICB0b3BpY3M6IHN0cmluZ1tdO1xuICBzb3VyY2VJZHM6IHN0cmluZ1tdO1xuICBleHRlbnNpb246IGJvb2xlYW47XG4gIGVzdGltYXRlZE1pbnV0ZXM6IG51bWJlcjtcbiAgYW5zd2VyOiBzdHJpbmc7XG4gIGFjY2VwdGFibGVBbHRlcm5hdGl2ZXM6IHN0cmluZztcbiAgc2NvcmluZzogU2NvcmluZ1BvaW50W107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXNzZXNzbWVudCB7XG4gIGlkOiBzdHJpbmc7XG4gIHByb2plY3RJZDogc3RyaW5nO1xuICBzZW1lc3RlcklkOiBzdHJpbmc7XG4gIHNlbWVzdGVyUmV2aXNpb246IG51bWJlcjtcbiAgbGVzc29uSWQ6IHN0cmluZyB8IG51bGw7XG4gIHRhc2tJZDogc3RyaW5nIHwgbnVsbDtcbiAgcmV0ZXN0T2ZHcmFkZUlkOiBzdHJpbmcgfCBudWxsO1xuICB0aXRsZTogc3RyaW5nO1xuICBraW5kOiBBc3Nlc3NtZW50S2luZDtcbiAgcmV2aXNpb246IG51bWJlcjtcbiAgc3RhcnRzQXQ6IG51bWJlcjtcbiAgZW5kc0F0OiBudW1iZXI7XG4gIGluc3RydWN0aW9uczogc3RyaW5nO1xuICByZXZpZXdFdmlkZW5jZTogc3RyaW5nO1xuICAvKiogXHU2NzJDXHU2QjIxXHU0RjVDXHU0RTFBL1x1ODAwM1x1OEJENVx1NzY4NFx1OEJENVx1NTM3N1x1NEUwRVx1NTNDMlx1ODAwM1x1OEQ0NFx1NjU5OVx1RkYxQlx1NEUzQVx1N0E3QVx1NjVGNlx1NzU0Q1x1OTc2Mlx1NTZERVx1OTAwMFx1NTIzMFx1OTg3OVx1NzZFRVx1OEQ0NFx1NjU5OVx1MzAwMiAqL1xuICByZXNvdXJjZUlkczogc3RyaW5nW107XG4gIHF1ZXN0aW9uczogUXVlc3Rpb25bXTtcbiAgcHVibGlzaGVkQXQ6IG51bWJlcjtcbiAgcHJpbnRlZEF0OiBudW1iZXIgfCBudWxsO1xuICBzdGFydGVkQXQ6IG51bWJlciB8IG51bGw7XG4gIHN0b3BwZWRBdDogbnVtYmVyIHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWJtaXNzaW9uIHtcbiAgaWQ6IHN0cmluZztcbiAgYXNzZXNzbWVudElkOiBzdHJpbmc7XG4gIHN1Ym1pdHRlZEF0OiBudW1iZXI7XG4gIHJlc291cmNlSWRzOiBzdHJpbmdbXTtcbiAgYW5zd2Vyczogc3RyaW5nO1xuICB1bmZpbmlzaGVkOiBib29sZWFuO1xuICAvKiogXHU2NzJDXHU2NzNBXHU1QjhDXHU2MjEwXHU2NUY2XHU1MjNCXHVGRjBDXHU0RTBEXHU2NjJGXHU2NUY2XHU5NTdGXHUzMDAyICovXG4gIHF1ZXN0aW9uVGltZXM6IFF1ZXN0aW9uVGltZVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFF1ZXN0aW9uVGltZSB7XG4gIHF1ZXN0aW9uSWQ6IHN0cmluZztcbiAgbG9jYWxUaW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUG9pbnRBd2FyZCB7XG4gIHF1ZXN0aW9uSWQ6IHN0cmluZztcbiAgcG9pbnRJZDogc3RyaW5nO1xuICBhd2FyZGVkOiBudW1iZXI7XG4gIGV2aWRlbmNlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXJyb3JBbmFseXNpcyB7XG4gIHF1ZXN0aW9uSWQ6IHN0cmluZztcbiAgY2F1c2U6IHN0cmluZztcbiAgZXZpZGVuY2U6IHN0cmluZztcbiAgY29ycmVjdGlvbjogc3RyaW5nO1xuICBuZXh0Q2hlY2s6IHN0cmluZztcbiAgcmV0ZXN0RGF0ZTogc3RyaW5nO1xuICBjb25maXJtZWQ6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR3JhZGUge1xuICBpZDogc3RyaW5nO1xuICBzdWJtaXNzaW9uSWQ6IHN0cmluZztcbiAgYXNzZXNzbWVudFJldmlzaW9uOiBudW1iZXI7XG4gIGdyYWRlZEF0OiBudW1iZXI7XG4gIGF3YXJkczogUG9pbnRBd2FyZFtdO1xuICBlcnJvcnM6IEVycm9yQW5hbHlzaXNbXTtcbiAgbmVlZHNSZXZpZXc6IGJvb2xlYW47XG4gIGZlZWRiYWNrOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmV2aWV3IHtcbiAgaWQ6IHN0cmluZztcbiAgZGF0ZTogc3RyaW5nO1xuICBwcm9qZWN0SWQ6IHN0cmluZztcbiAgZ3JhZGVJZHM6IHN0cmluZ1tdO1xuICBmaW5kaW5nczogc3RyaW5nO1xuICBhY3Rpb25zOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUZWFjaGluZ0V2ZW50IHtcbiAgaWQ6IHN0cmluZztcbiAgcHJvamVjdElkOiBzdHJpbmc7XG4gIGtpbmQ6IHN0cmluZztcbiAgc291cmNlSWQ6IHN0cmluZztcbiAgc3RhdGU6IHN0cmluZztcbiAgY3JlYXRlZEF0OiBudW1iZXI7XG59XG5cbmV4cG9ydCB0eXBlIFRlYWNoaW5nVGFza0tpbmQgPSBcImxlc3NvblwiIHwgXCJob21ld29ya1wiIHwgXCJleGFtXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVhY2hpbmdUYXNrIHtcbiAgdGFza0lkOiBzdHJpbmc7XG4gIHNvdXJjZUlkOiBzdHJpbmc7XG4gIGtpbmQ6IFRlYWNoaW5nVGFza0tpbmQ7XG59XG5cbi8vIC0tLS0tLS0tLS0gXHU1QjY2XHU2MEM1XHU4QkMxXHU2MzZFIC0tLS0tLS0tLS1cblxuZXhwb3J0IGludGVyZmFjZSBDb21wbGV0ZWRTdHVkeVRhc2sge1xuICBpZDogc3RyaW5nO1xuICBwcm9qZWN0SWQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgbm90ZXM6IHN0cmluZztcbiAgdG9waWNzOiBzdHJpbmdbXTtcbiAgY29tcGxldGVkQXQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IHR5cGUgUHJvZ3Jlc3NTb3VyY2UgPSBcInVzZXJcIiB8IFwiYXNzaXN0YW50XCI7XG5leHBvcnQgdHlwZSBQcm9ncmVzc1N0YXRlID0gXCJzdHVkaWVkXCIgfCBcInByYWN0aWNpbmdcIiB8IFwibmVlZHNSZXZpZXdcIjtcblxuZXhwb3J0IGludGVyZmFjZSBQcm9ncmVzc1JlY29yZCB7XG4gIGlkOiBzdHJpbmc7XG4gIHByb2plY3RJZDogc3RyaW5nO1xuICB0b3BpYzogc3RyaW5nO1xuICBwb3NpdGlvbjogc3RyaW5nO1xuICBzdGF0ZTogUHJvZ3Jlc3NTdGF0ZTtcbiAgZXZpZGVuY2U6IHN0cmluZztcbiAgbmV4dEFjdGlvbjogc3RyaW5nO1xuICBzb3VyY2U6IFByb2dyZXNzU291cmNlO1xuICBjb25maXJtZWQ6IGJvb2xlYW47XG4gIHJlY29yZGVkQXQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb3JyZWN0aW9uIHtcbiAgaWQ6IHN0cmluZztcbiAgZ3JhZGVJZDogc3RyaW5nO1xuICBxdWVzdGlvbklkOiBzdHJpbmc7XG4gIGV4cGxhbmF0aW9uOiBzdHJpbmc7XG4gIHJlc291cmNlSWRzOiBzdHJpbmdbXTtcbiAgc3VibWl0dGVkQXQ6IG51bWJlcjtcbiAgYWNjZXB0ZWQ6IGJvb2xlYW4gfCBudWxsO1xuICBmZWVkYmFjazogc3RyaW5nO1xuICByZXZpZXdlZEF0OiBudW1iZXIgfCBudWxsO1xufVxuXG4vLyAtLS0tLS0tLS0tIFx1NUI4OFx1NjJBNFx1N0VBRlx1OEJBMVx1N0I5N1x1OTBFOFx1NTIwNlx1RkYwOFx1N0E5N1x1NTNFM1x1OTZDNlx1NTQwOC9cdTc2N0RcdTU0MERcdTUzNTVcdTUyMjRcdTVCOUFcdUZGMUJcdTY1RTBcdTY4NENcdTk3NjJcdThDMDNcdTc1MjhcdUZGMDkgLS0tLS0tLS0tLVxuXG5leHBvcnQgaW50ZXJmYWNlIFdpbmRvdyB7XG4gIGlkOiBudW1iZXI7XG4gIGFwcElkOiBzdHJpbmcgfCBudWxsO1xuICB0aXRsZTogc3RyaW5nIHwgbnVsbDtcbiAgcGlkOiBudW1iZXIgfCBudWxsO1xuICBpc0ZvY3VzZWQ6IGJvb2xlYW47XG59XG5cbi8vIC0tLS0tLS0tLS0gXHU1RkVCXHU3MTY3IC0tLS0tLS0tLS1cblxuZXhwb3J0IGludGVyZmFjZSBTbmFwc2hvdCB7XG4gIHRhc2tLaW5kczogUmVjb3JkPHN0cmluZywgVGFza0tpbmQ+O1xuICBkYXRhOiBpbXBvcnQoXCIuL2xpYlwiKS5BcHBEYXRhO1xuICBzdHVkeVByb2dyZXNzOiB1bmtub3duW107XG4gIHN0YXRzOiBTdGF0cztcbiAgcmVtYWluaW5nU2VjczogbnVtYmVyO1xuICB0b2RheTogc3RyaW5nO1xuICBzZXJ2ZXJUaW1lOiBudW1iZXI7XG59XG4iLCAiLy8hIEpTT04gXHU0RTI1XHU2ODNDXHU4OUUzXHU3ODAxXHU1MkE5XHU2MjRCXHVGRjFBXHU2QTIxXHU2MkRGIHNlcmRlIFx1NzY4NCBgZGVueV91bmtub3duX2ZpZWxkc2BcdTMwMDFgI1tzZXJkZShkZWZhdWx0KV1gXG4vLyEgXHU0RTBFIGNhbWVsQ2FzZSBcdTU0N0RcdTU0MERcdTMwMDJcdTVFOEZcdTUyMTdcdTUzMTZcdTc1MzFcdTU0MDRcdTZBMjFcdTU3NTdcdTYyNEJcdTUxOTlcdUZGMDhcdTk1MkVcdTVFOEZcdTU2RkFcdTVCOUFcdTMwMDFcdTRFMEUgUnVzdCBcdTU4RjBcdTY2MEVcdTVFOEZcdTRFMDBcdTgxRjRcdUZGMDlcdUZGMENcbi8vISBcdTRGRERcdThCQzFcdTVCRkNcdTUxRkEgSlNPTiBcdTVGNjJcdTcyQjZcdTRFMEVcdTY1RTdcdTVGMTVcdTY0Q0VcdTkwMTBcdTVCNTdcdTgyODJcdTUzRUZcdTZCRDRcdTMwMDJcblxuaW1wb3J0IHsgQXBwRXJyb3IgfSBmcm9tIFwiLi9lcnJvcnNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cblxuLyoqIGRlbnlfdW5rbm93bl9maWVsZHNcdUZGMUFcdTY3MkFcdTc3RTVcdTk1MkVcdTc2RjRcdTYzQTVcdTYyRDJcdTdFRERcdUZGMDhSdXN0IFx1NEYxQVx1NjJBNSB1bmtub3duIGZpZWxkXHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gcmVqZWN0VW5rbm93bihcbiAgb2JqOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgYWxsb3dlZDogc3RyaW5nW10sXG4gIHdoYXQ6IHN0cmluZyxcbik6IHZvaWQge1xuICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhvYmopKSB7XG4gICAgaWYgKCFhbGxvd2VkLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgIHRocm93IG5ldyBBcHBFcnJvcihgXHU2NzJBXHU3N0U1XHU1QjU3XHU2QkI1XHVGRjFBJHt3aGF0fSBcdTRFMERcdTYzQTVcdTUzRDcgXCIke2tleX1cImApO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNTdHIodmFsdWU6IHVua25vd24sIHdoYXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHRocm93IG5ldyBBcHBFcnJvcihgJHt3aGF0fVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUI1N1x1N0IyNlx1NEUzMmApO1xuICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc0Jvb2wodmFsdWU6IHVua25vd24sIHdoYXQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcImJvb2xlYW5cIikgdGhyb3cgbmV3IEFwcEVycm9yKGAke3doYXR9XHU1RkM1XHU5ODdCXHU2NjJGXHU1RTAzXHU1QzE0XHU1MDNDYCk7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzSW50KHZhbHVlOiB1bmtub3duLCB3aGF0OiBzdHJpbmcpOiBudW1iZXIge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcIm51bWJlclwiIHx8ICFOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSkge1xuICAgIHRocm93IG5ldyBBcHBFcnJvcihgJHt3aGF0fVx1NUZDNVx1OTg3Qlx1NjYyRlx1NjU3NFx1NjU3MGApO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzQXJyYXkodmFsdWU6IHVua25vd24sIHdoYXQ6IHN0cmluZyk6IHVua25vd25bXSB7XG4gIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHRocm93IG5ldyBBcHBFcnJvcihgJHt3aGF0fVx1NUZDNVx1OTg3Qlx1NjYyRlx1NjU3MFx1N0VDNGApO1xuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKiBwYXJzZSBcdTdFREZcdTRFMDBcdTVFMjYgd2hhdFx1RkYwOFx1NEY5QiBhc1N0ci9hc0ludCBcdTdCNDlcdTc2RjRcdTYzQTVcdTRGMjBcdTUxNjVcdUZGMDlcdUZGMENcdTUzNTVcdTUzQzJcdTY1NzAgbGFtYmRhIFx1NTQwQ1x1NjgzN1x1NTE3Q1x1NUJCOVx1MzAwMiAqL1xuZXhwb3J0IHR5cGUgUGFyc2VyPFQ+ID0gKHY6IHVua25vd24sIHdoYXQ6IHN0cmluZykgPT4gVDtcblxuZXhwb3J0IGZ1bmN0aW9uIGFzT3B0PFQ+KFxuICB2YWx1ZTogdW5rbm93bixcbiAgd2hhdDogc3RyaW5nLFxuICBwYXJzZTogUGFyc2VyPFQ+LFxuKTogVCB8IG51bGwge1xuICBpZiAodmFsdWUgPT09IG51bGwpIHJldHVybiBudWxsO1xuICByZXR1cm4gcGFyc2UodmFsdWUsIHdoYXQpO1xufVxuXG4vKiogXHU4QkZCXHU1M0Q2XHU1QjU3XHU2QkI1XHVGRjFBXHU3RjNBXHU3NzAxXHU2NUY2XHU1RTk0XHU3NTI4IGRlZmF1bHRcdUZGMUJcdTVCNThcdTU3MjhcdUZGMDhcdTU0MkIgbnVsbFx1RkYwOVx1NjVGNlx1NjMwOSBwYXJzZSBcdTg5RTNcdTY3OTBcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBmaWVsZDxUPihcbiAgb2JqOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAga2V5OiBzdHJpbmcsXG4gIHdoYXQ6IHN0cmluZyxcbiAgcGFyc2U6IFBhcnNlcjxUPixcbiAgZGVmOiBULFxuKTogVCB7XG4gIGNvbnN0IHZhbHVlID0gb2JqW2tleV07XG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZGVmO1xuICByZXR1cm4gcGFyc2UodmFsdWUsIHdoYXQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVxdWlyZWRGaWVsZDxUPihcbiAgb2JqOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAga2V5OiBzdHJpbmcsXG4gIHdoYXQ6IHN0cmluZyxcbiAgcGFyc2U6IFBhcnNlcjxUPixcbik6IFQge1xuICBjb25zdCB2YWx1ZSA9IG9ialtrZXldO1xuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEFwcEVycm9yKGAke3doYXR9XHU3RjNBXHU1QzExXHU1RkM1XHU1ODZCXHU1QjU3XHU2QkI1ICR7a2V5fWApO1xuICByZXR1cm4gcGFyc2UodmFsdWUsIHdoYXQpO1xufVxuXG4vKiogXHU2NzlBXHU0RTNFXHU1QjU3XHU3QjI2XHU0RTMyXHU4OUUzXHU2NzkwXHVGRjA4c2VyZGUgcmVuYW1lX2FsbCA9IFwiY2FtZWxDYXNlXCIgXHU3Njg0XHU1M0Q2XHU1MDNDXHVGRjA5XHVGRjFCXHU2Q0RCXHU1NzhCXHU0RkREXHU3NTU5XHU1QjU3XHU5NzYyXHU5MUNGXHU4MDU0XHU1NDA4XHU0RUU1XHU0RkJGXHU1MjA2XHU2NTJGXHU2NTM2XHU3QTg0XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gb25lT2Y8VCBleHRlbmRzIHN0cmluZz4oXG4gIHZhbHVlOiB1bmtub3duLFxuICB3aGF0OiBzdHJpbmcsXG4gIGFsbG93ZWQ6IHJlYWRvbmx5IFRbXSxcbik6IFQge1xuICBjb25zdCBzID0gYXNTdHIodmFsdWUsIHdoYXQpO1xuICBpZiAoIShhbGxvd2VkIGFzIHJlYWRvbmx5IHN0cmluZ1tdKS5pbmNsdWRlcyhzKSlcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoYCR7d2hhdH1cdTUzRDZcdTUwM0NcdTY1RTBcdTY1NDhcdUZGMUEke3N9YCk7XG4gIHJldHVybiBzIGFzIFQ7XG59XG5cbi8qKiBcdTVCNTdcdTdCMjZcdTRFMzJcdTY1NzBcdTdFQzRcdUZGMDhcdTYzMDlcdTUxNDNcdTdEMjBcdTg5RTNcdTY3OTBcdUZGMDlcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBhc1N0ckFycmF5KFxuICB2YWx1ZTogdW5rbm93bixcbiAgd2hhdDogc3RyaW5nLFxuICBwYXJzZTogUGFyc2VyPHN0cmluZz4sXG4pOiBzdHJpbmdbXSB7XG4gIHJldHVybiBhc0FycmF5KHZhbHVlLCB3aGF0KS5tYXAoKHYpID0+IHBhcnNlKHYsIHdoYXQpKTtcbn1cbiIsICIvLyEgXHU1QjlBXHU2NUY2XHU5NTAxXHU2NzNBXHVGRjFBXHU2NTcwXHU2MzZFXHU2QTIxXHU1NzhCXHUzMDAxXHU4REU4XHU1MzQ4XHU1OTFDXHU2NzJDXHU1NzMwXHU1NDY4XHU1Mzg2XHUzMDAxXHU5MUNEXHU1M0UwXHU2OEMwXHU2N0U1XHU0RTBFXHU2NzJDXHU4RjZFXHU2MjkxXHU1MjM2XHUzMDAyXG4vLyEgXHU1QkY5XHU1RTk0IGNyYXRlcy9jb3JlL3NyYy9sb2NrLnJzXHUzMDAyKipcdTdFQUZcdThCQTFcdTdCOTcqKlx1MjAxNFx1MjAxNFx1Njg0Q1x1OTc2Mlx1OTUwMVx1NUM0Rlx1NjI2N1x1ODg0Q1x1NzUzMVx1NTM5Rlx1NzUxRiBndWFyZCBcdThEMUZcdThEMjNcdUZGMENcbi8vISBydW50aW1lIFx1NzUyOFx1NjcyQ1x1NkEyMVx1NTc1N1x1N0I5N1x1NTFGQSBhY3RpdmUgXHU3MkI2XHU2MDAxXHU1NDBFXHU2MzA3XHU2MzI1IGd1YXJkXHUzMDAyXG5cbmltcG9ydCB7IEFwcEVycm9yLCBlbnN1cmUgfSBmcm9tIFwiLi9lcnJvcnNcIjtcbmltcG9ydCB7XG4gIGFzQXJyYXksXG4gIGFzQm9vbCxcbiAgYXNJbnQsXG4gIGFzT3B0LFxuICBhc1N0cixcbiAgZmllbGQsXG4gIGlzT2JqZWN0LFxuICBvbmVPZixcbiAgcmVqZWN0VW5rbm93bixcbiAgcmVxdWlyZWRGaWVsZCxcbn0gZnJvbSBcIi4vanNvblwiO1xuaW1wb3J0IHR5cGUgeyBBY3RpdmVMb2NrLCBMb2NrU2NoZWR1bGUsIExvY2tTdGF0ZSB9IGZyb20gXCIuL21vZGVsXCI7XG5pbXBvcnQge1xuICBhZGREYXlzLFxuICBhdExvY2FsRGF0ZSxcbiAgbG9jYWxEYXRlT2YsXG4gIG1pbnV0ZXNPZixcbiAgcGFyc2VEYXRlLFxuICB3ZWVrZGF5TW9uZGF5LFxufSBmcm9tIFwiLi90aW1lXCI7XG5cbmNvbnN0IFNDSEVEVUxFX0tFWVMgPSBbXG4gIFwiaWRcIixcbiAgXCJuYW1lXCIsXG4gIFwic3RhcnRcIixcbiAgXCJlbmRcIixcbiAgXCJkYXlzXCIsXG4gIFwiZW5hYmxlZFwiLFxuICBcInN0cmljdFwiLFxuXSBhcyBjb25zdDtcbmNvbnN0IEFDVElWRV9LRVlTID0gW1wibmFtZVwiLCBcInN0YXJ0ZWRBdFwiLCBcImVuZHNBdFwiLCBcInN0cmljdFwiXSBhcyBjb25zdDtcbmNvbnN0IFNUQVRFX0tFWVMgPSBbXCJzY2hlZHVsZXNcIiwgXCJhY3RpdmVcIiwgXCJzdXBwcmVzc2VkVW50aWxcIl0gYXMgY29uc3Q7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUxvY2tTY2hlZHVsZShyYXc6IHVua25vd24pOiBMb2NrU2NoZWR1bGUge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OTUwMVx1NjczQVx1ODlDNFx1NTIxOVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIFsuLi5TQ0hFRFVMRV9LRVlTXSwgXCJcdTk1MDFcdTY3M0FcdTg5QzRcdTUyMTlcIik7XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiXHU5NTAxXHU2NzNBXHU4OUM0XHU1MjE5XCIsIGFzU3RyKSxcbiAgICBuYW1lOiByZXF1aXJlZEZpZWxkKHJhdywgXCJuYW1lXCIsIFwiXHU5NTAxXHU2NzNBXHU4OUM0XHU1MjE5XCIsIGFzU3RyKSxcbiAgICBzdGFydDogcmVxdWlyZWRGaWVsZChyYXcsIFwic3RhcnRcIiwgXCJcdTk1MDFcdTY3M0FcdTg5QzRcdTUyMTlcIiwgYXNTdHIpLFxuICAgIGVuZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiZW5kXCIsIFwiXHU5NTAxXHU2NzNBXHU4OUM0XHU1MjE5XCIsIGFzU3RyKSxcbiAgICBkYXlzOiBhc0FycmF5KFxuICAgICAgcmVxdWlyZWRGaWVsZChyYXcsIFwiZGF5c1wiLCBcIlx1OTUwMVx1NjczQVx1ODlDNFx1NTIxOVwiLCAodikgPT4gdiksXG4gICAgICBcImRheXNcIixcbiAgICApLm1hcCgoZCkgPT4gYXNJbnQoZCwgXCJcdTk1MDFcdTY3M0FcdTY2MUZcdTY3MUZcIikpLFxuICAgIGVuYWJsZWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImVuYWJsZWRcIiwgXCJcdTk1MDFcdTY3M0FcdTg5QzRcdTUyMTlcIiwgYXNCb29sKSxcbiAgICBzdHJpY3Q6IGZpZWxkKHJhdywgXCJzdHJpY3RcIiwgXCJcdTk1MDFcdTY3M0FcdTg5QzRcdTUyMTlcIiwgYXNCb29sLCBmYWxzZSksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVMb2NrU2NoZWR1bGUoXG4gIHM6IExvY2tTY2hlZHVsZSxcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogcy5pZCxcbiAgICBuYW1lOiBzLm5hbWUsXG4gICAgc3RhcnQ6IHMuc3RhcnQsXG4gICAgZW5kOiBzLmVuZCxcbiAgICBkYXlzOiBzLmRheXMsXG4gICAgZW5hYmxlZDogcy5lbmFibGVkLFxuICAgIHN0cmljdDogcy5zdHJpY3QsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFjdGl2ZUxvY2socmF3OiB1bmtub3duKTogQWN0aXZlTG9jayB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU5NTAxXHU2NzNBXHU3MkI2XHU2MDAxXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKHJhdywgWy4uLkFDVElWRV9LRVlTXSwgXCJcdTk1MDFcdTY3M0FcdTcyQjZcdTYwMDFcIik7XG4gIHJldHVybiB7XG4gICAgbmFtZTogcmVxdWlyZWRGaWVsZChyYXcsIFwibmFtZVwiLCBcIlx1OTUwMVx1NjczQVx1NzJCNlx1NjAwMVwiLCBhc1N0ciksXG4gICAgc3RhcnRlZEF0OiByZXF1aXJlZEZpZWxkKHJhdywgXCJzdGFydGVkQXRcIiwgXCJcdTk1MDFcdTY3M0FcdTcyQjZcdTYwMDFcIiwgYXNJbnQpLFxuICAgIGVuZHNBdDogcmVxdWlyZWRGaWVsZChyYXcsIFwiZW5kc0F0XCIsIFwiXHU5NTAxXHU2NzNBXHU3MkI2XHU2MDAxXCIsIGFzSW50KSxcbiAgICBzdHJpY3Q6IHJlcXVpcmVkRmllbGQocmF3LCBcInN0cmljdFwiLCBcIlx1OTUwMVx1NjczQVx1NzJCNlx1NjAwMVwiLCBhc0Jvb2wpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplQWN0aXZlTG9jayhhOiBBY3RpdmVMb2NrKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6IGEubmFtZSxcbiAgICBzdGFydGVkQXQ6IGEuc3RhcnRlZEF0LFxuICAgIGVuZHNBdDogYS5lbmRzQXQsXG4gICAgc3RyaWN0OiBhLnN0cmljdCxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTG9ja1N0YXRlKHJhdzogdW5rbm93bik6IExvY2tTdGF0ZSB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU5NTAxXHU2NzNBXHU5MTREXHU3RjZFXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKHJhdywgWy4uLlNUQVRFX0tFWVNdLCBcIlx1OTUwMVx1NjczQVx1OTE0RFx1N0Y2RVwiKTtcbiAgcmV0dXJuIHtcbiAgICBzY2hlZHVsZXM6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJzY2hlZHVsZXNcIixcbiAgICAgIFwiXHU5NTAxXHU2NzNBXHU5MTREXHU3RjZFXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcInNjaGVkdWxlc1wiKS5tYXAocGFyc2VMb2NrU2NoZWR1bGUpLFxuICAgICAgW10sXG4gICAgKSxcbiAgICBhY3RpdmU6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJhY3RpdmVcIixcbiAgICAgIFwiXHU5NTAxXHU2NzNBXHU5MTREXHU3RjZFXCIsXG4gICAgICAodikgPT4gKHYgPT09IG51bGwgPyBudWxsIDogcGFyc2VBY3RpdmVMb2NrKHYpKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBBY3RpdmVMb2NrIHwgbnVsbCxcbiAgICBzdXBwcmVzc2VkVW50aWw6IGZpZWxkKHJhdywgXCJzdXBwcmVzc2VkVW50aWxcIiwgXCJcdTk1MDFcdTY3M0FcdTkxNERcdTdGNkVcIiwgYXNJbnQsIDApLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplTG9ja1N0YXRlKHM6IExvY2tTdGF0ZSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBzY2hlZHVsZXM6IHMuc2NoZWR1bGVzLm1hcChzZXJpYWxpemVMb2NrU2NoZWR1bGUpLFxuICAgIC8vIFx1NEUwRSBSdXN0IFx1NEUwMFx1ODFGNFx1RkYxQU9wdGlvbiBcdTc2RjRcdTYzQTVcdTVFOEZcdTUyMTdcdTUzMTZcdUZGMENOb25lIFx1NjYzRVx1NUYwRlx1NTE5OSBcImFjdGl2ZVwiOiBudWxsXHVGRjA4c2VyZGUgXHU0RTI0XHU3QUVGXHU2M0E1XHU1M0Q3XHVGRjA5XHUzMDAyXG4gICAgYWN0aXZlOiBzLmFjdGl2ZSA9PT0gbnVsbCA/IG51bGwgOiBzZXJpYWxpemVBY3RpdmVMb2NrKHMuYWN0aXZlKSxcbiAgICBzdXBwcmVzc2VkVW50aWw6IHMuc3VwcHJlc3NlZFVudGlsLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVMb2NrKHN0YXRlOiBMb2NrU3RhdGUpOiB2b2lkIHtcbiAgaWYgKHN0YXRlLnNjaGVkdWxlcy5sZW5ndGggPiAyMCkge1xuICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NjcwMFx1NTkxQVx1OEJCRVx1N0Y2RSAyMCBcdTRFMkFcdTk1MDFcdTY3M0FcdTY1RjZcdTZCQjVcIik7XG4gIH1cbiAgY29uc3QgaWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IG9jY3VwaWVkID0gbmV3IEFycmF5PGJvb2xlYW4+KDcgKiAxNDQwKS5maWxsKGZhbHNlKTtcbiAgZm9yIChjb25zdCBzIG9mIHN0YXRlLnNjaGVkdWxlcykge1xuICAgIGlmIChcbiAgICAgIHMuaWQubGVuZ3RoID09PSAwIHx8XG4gICAgICBpZHMuaGFzKHMuaWQpIHx8XG4gICAgICBzLm5hbWUudHJpbSgpLmxlbmd0aCA9PT0gMCB8fFxuICAgICAgQXJyYXkuZnJvbShzLm5hbWUpLmxlbmd0aCA+IDQwXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTk1MDFcdTY3M0FcdTU0MERcdTc5RjBcdTk3MDBcdTRFM0EgMVx1MjAxMzQwIFx1NUI1N1x1N0IyNlx1RkYwQ0lEIFx1OTcwMFx1NTUyRlx1NEUwMFx1NEUxNFx1OTc1RVx1N0E3QVwiKTtcbiAgICB9XG4gICAgaWRzLmFkZChzLmlkKTtcbiAgICBpZiAoXG4gICAgICBtaW51dGVzT2Yocy5zdGFydCkgPT09IG51bGwgfHxcbiAgICAgIG1pbnV0ZXNPZihzLmVuZCkgPT09IG51bGwgfHxcbiAgICAgIHMuc3RhcnQgPT09IHMuZW5kXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTk1MDFcdTY3M0FcdTY1RjZcdTk1RjRcdTk3MDBcdTRFM0FcdTY3MDlcdTY1NDggSEg6TU1cdUZGMENcdTVGMDBcdTU5Q0JcdTRFMEVcdTdFRDNcdTY3NUZcdTRFMERcdTgwRkRcdTc2RjhcdTU0MENcIik7XG4gICAgfVxuICAgIGNvbnN0IHVuaXF1ZSA9IG5ldyBTZXQocy5kYXlzKTtcbiAgICBpZiAoXG4gICAgICBzLmRheXMubGVuZ3RoID09PSAwIHx8XG4gICAgICBzLmRheXMubGVuZ3RoID4gNyB8fFxuICAgICAgdW5pcXVlLnNpemUgIT09IHMuZGF5cy5sZW5ndGggfHxcbiAgICAgIHMuZGF5cy5zb21lKChkKSA9PiBkIDwgMSB8fCBkID4gNylcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJGN1x1OTAwOVx1NjJFOVx1NEUwRFx1OTFDRFx1NTkwRFx1NzY4NFx1NjYxRlx1NjcxRlx1RkYwOFx1NTQ2OFx1NEUwMFx1NEUzQSAxXHVGRjBDXHU1NDY4XHU2NUU1XHU0RTNBIDdcdUZGMDlcIik7XG4gICAgfVxuICAgIGlmIChzLmVuYWJsZWQpIHtcbiAgICAgIGNvbnN0IHN0YXJ0ID0gbWludXRlc09mKHMuc3RhcnQpITtcbiAgICAgIGNvbnN0IGVuZCA9IG1pbnV0ZXNPZihzLmVuZCkhO1xuICAgICAgY29uc3QgZHVyYXRpb24gPSAoZW5kICsgMTQ0MCAtIHN0YXJ0KSAlIDE0NDA7XG4gICAgICBmb3IgKGNvbnN0IGRheSBvZiBzLmRheXMpIHtcbiAgICAgICAgZm9yIChsZXQgb2Zmc2V0ID0gMDsgb2Zmc2V0IDwgZHVyYXRpb247IG9mZnNldCArPSAxKSB7XG4gICAgICAgICAgY29uc3QgbWludXRlID0gKChkYXkgLSAxKSAqIDE0NDAgKyBzdGFydCArIG9mZnNldCkgJSAoNyAqIDE0NDApO1xuICAgICAgICAgIGlmIChvY2N1cGllZFttaW51dGVdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTU0MkZcdTc1MjhcdTc2ODRcdTk1MDFcdTY3M0FcdTY1RjZcdTZCQjVcdTRFMERcdTgwRkRcdTkxQ0RcdTUzRTBcdUZGMENcdThCRjdcdThDMDNcdTY1NzRcdTY1RTVcdTY3MUZcdTYyMTZcdTY1RjZcdTk1RjRcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIG9jY3VwaWVkW21pbnV0ZV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChzdGF0ZS5hY3RpdmUgIT09IG51bGwpIHtcbiAgICBjb25zdCBhID0gc3RhdGUuYWN0aXZlO1xuICAgIGlmIChcbiAgICAgIGEubmFtZS50cmltKCkubGVuZ3RoID09PSAwIHx8XG4gICAgICBBcnJheS5mcm9tKGEubmFtZSkubGVuZ3RoID4gNDAgfHxcbiAgICAgIGEuZW5kc0F0IDw9IGEuc3RhcnRlZEF0IHx8XG4gICAgICBhLmVuZHNBdCAtIGEuc3RhcnRlZEF0ID4gOCAqIDg2NDAwXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTY1RTBcdTY1NDhcdTc2ODRcdTk1MDFcdTY3M0FcdTcyQjZcdTYwMDFcIik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogXHU1RjUzXHU1MjREXHU2NUY2XHU1MjNCXHU1NDdEXHU0RTJEXHU3Njg0XHU1NDJGXHU3NTI4XHU4OUM0XHU1MjE5IFx1MjE5MiBcdTU0MDhcdTVFNzZcdTU0MEVcdTc2ODQgQWN0aXZlTG9ja1x1RkYxQlx1ODhBQlx1NjI5MVx1NTIzNlx1NjIxNlx1NjcyQVx1NTQ3RFx1NEUyRFx1OEZENFx1NTZERSBudWxsXHUzMDAyXG4gKiBcdTY2MUZcdTY3MUZcdTVGNTJcdTVDNUVcdTVGMDBcdTU5Q0JcdTY1RTVcdTY3MUZcdUZGMUFcdThERThcdTUzNDhcdTU5MUNcdTg5QzRcdTUyMTlcdTYzMDlcdTVGMDBcdTU5Q0JcdTY1RTVcdTUzQzJcdTRFMEVcdTUzMzlcdTkxNERcdTMwMDJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjaGVkdWxlZEF0KHN0YXRlOiBMb2NrU3RhdGUsIGF0OiBudW1iZXIpOiBBY3RpdmVMb2NrIHwgbnVsbCB7XG4gIGlmIChhdCA8IHN0YXRlLnN1cHByZXNzZWRVbnRpbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHRvZGF5ID0gbG9jYWxEYXRlT2YoYXQpO1xuICBsZXQgcmVzdWx0OiBBY3RpdmVMb2NrIHwgbnVsbCA9IG51bGw7XG4gIGZvciAoY29uc3QgZGF0ZSBvZiBbYWRkRGF5cyh0b2RheSwgLTEpLCB0b2RheV0pIHtcbiAgICBjb25zdCB3ZWVrZGF5ID0gd2Vla2RheU1vbmRheShkYXRlKTtcbiAgICBmb3IgKGNvbnN0IHMgb2Ygc3RhdGUuc2NoZWR1bGVzKSB7XG4gICAgICBpZiAoIXMuZW5hYmxlZCB8fCAhcy5kYXlzLmluY2x1ZGVzKHdlZWtkYXkpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IG1pbnV0ZXNPZihzLnN0YXJ0KTtcbiAgICAgIGNvbnN0IGVuZFRpbWUgPSBtaW51dGVzT2Yocy5lbmQpO1xuICAgICAgaWYgKHN0YXJ0VGltZSA9PT0gbnVsbCB8fCBlbmRUaW1lID09PSBudWxsKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGVuZERhdGUgPSBlbmRUaW1lIDw9IHN0YXJ0VGltZSA/IGFkZERheXMoZGF0ZSwgMSkgOiBkYXRlO1xuICAgICAgY29uc3Qgc3RhcnQgPSBhdExvY2FsRGF0ZShcbiAgICAgICAgZGF0ZSxcbiAgICAgICAgTWF0aC5mbG9vcihzdGFydFRpbWUgLyA2MCksXG4gICAgICAgIHN0YXJ0VGltZSAlIDYwLFxuICAgICAgKTtcbiAgICAgIGNvbnN0IGVuZCA9IGF0TG9jYWxEYXRlKGVuZERhdGUsIE1hdGguZmxvb3IoZW5kVGltZSAvIDYwKSwgZW5kVGltZSAlIDYwKTtcbiAgICAgIGlmIChhdCA+PSBzdGFydCAmJiBhdCA8IGVuZCkge1xuICAgICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgICAgcmVzdWx0LnN0YXJ0ZWRBdCA9IE1hdGgubWluKHJlc3VsdC5zdGFydGVkQXQsIHN0YXJ0KTtcbiAgICAgICAgICByZXN1bHQuZW5kc0F0ID0gTWF0aC5tYXgocmVzdWx0LmVuZHNBdCwgZW5kKTtcbiAgICAgICAgICByZXN1bHQuc3RyaWN0ID0gcmVzdWx0LnN0cmljdCB8fCBzLnN0cmljdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgICBuYW1lOiBzLm5hbWUsXG4gICAgICAgICAgICBzdGFydGVkQXQ6IHN0YXJ0LFxuICAgICAgICAgICAgZW5kc0F0OiBlbmQsXG4gICAgICAgICAgICBzdHJpY3Q6IHMuc3RyaWN0LFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqIFx1NjNEMFx1NTI0RFx1N0VEM1x1Njc1Rlx1NUMwRlx1NjFBOVx1NEUwRFx1NUY5N1x1NTQxRVx1NjM4OVx1NjVFMFx1NTE3M1x1NzY4NFx1NTQwRVx1N0VFRFx1Nzc2MVx1NzcyMFx1NjVGNlx1NkJCNVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbGVhc2VMb2NrKHN0YXRlOiBMb2NrU3RhdGUsIGF0OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3Qgc2NoZWR1bGVkID0gc2NoZWR1bGVkQXQoc3RhdGUsIGF0KTtcbiAgaWYgKHNjaGVkdWxlZCAhPT0gbnVsbCkge1xuICAgIHN0YXRlLnN1cHByZXNzZWRVbnRpbCA9IE1hdGgubWF4KHN0YXRlLnN1cHByZXNzZWRVbnRpbCwgc2NoZWR1bGVkLmVuZHNBdCk7XG4gIH1cbiAgc3RhdGUuYWN0aXZlID0gbnVsbDtcbn1cbiIsICIvLyEgXHU4QkZFXHU4ODY4XHU5NjNCXHU1ODVFXHU2NUY2XHU2QkI1XHVGRjFBXHU4QkExXHU1MjEyXHU0RTRCXHU1OTE2XHU3Njg0XHU2QkNGXHU1NDY4XHU1NkZBXHU1QjlBXHU1MzYwXHU3NTI4XHVGRjA4XHU4QkZFXHU3QTBCXHUzMDAxXHU1QjlFXHU5QThDXHVGRjA5XHUzMDAyXHU3RUFGXHU2M0NGXHU4RkYwXHVGRjFBXHU0RTBEXHU1RTI2XHU4RkRCXHU1RUE2XHUzMDAxXHU0RTBEXHU3QkExXHU4Rjk2XHU1QjlFXHU0RjhCXHUzMDAxXHU0RTBEXHU5NTAxXHU2NzNBXHUzMDAyXG4vLyEgXHU1QkY5XHU1RTk0IGNyYXRlcy9jb3JlL3NyYy9ibG9ja3MucnNcdTMwMDJcblxuaW1wb3J0IHsgQXBwRXJyb3IgfSBmcm9tIFwiLi9lcnJvcnNcIjtcbmltcG9ydCB7XG4gIGFzQXJyYXksXG4gIGFzSW50LFxuICBhc1N0cixcbiAgZmllbGQsXG4gIGlzT2JqZWN0LFxuICBvbmVPZixcbiAgcmVqZWN0VW5rbm93bixcbiAgcmVxdWlyZWRGaWVsZCxcbn0gZnJvbSBcIi4vanNvblwiO1xuaW1wb3J0IHR5cGUgeyBBdHRlbnRpb24sIEJsb2NrIH0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IG1pbnV0ZXNPZiwgcGFyc2VEYXRlLCB3ZWVrZGF5TW9uZGF5IH0gZnJvbSBcIi4vdGltZVwiO1xuXG5jb25zdCBCTE9DS19LRVlTID0gW1xuICBcImlkXCIsXG4gIFwidGl0bGVcIixcbiAgXCJkYXlzXCIsXG4gIFwic3RhcnRcIixcbiAgXCJlbmRcIixcbiAgXCJhdHRlbnRpb25cIixcbiAgXCJub3Rlc1wiLFxuXSBhcyBjb25zdDtcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQmxvY2socmF3OiB1bmtub3duKTogQmxvY2sge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OTYzQlx1NTg1RVx1NjVGNlx1NkJCNVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIFsuLi5CTE9DS19LRVlTXSwgXCJcdTk2M0JcdTU4NUVcdTY1RjZcdTZCQjVcIik7XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiXHU5NjNCXHU1ODVFXHU2NUY2XHU2QkI1XCIsIGFzU3RyKSxcbiAgICB0aXRsZTogcmVxdWlyZWRGaWVsZChyYXcsIFwidGl0bGVcIiwgXCJcdTk2M0JcdTU4NUVcdTY1RjZcdTZCQjVcIiwgYXNTdHIpLFxuICAgIGRheXM6IGFzQXJyYXkoXG4gICAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJkYXlzXCIsIFwiXHU5NjNCXHU1ODVFXHU2NUY2XHU2QkI1XCIsICh2KSA9PiB2KSxcbiAgICAgIFwiZGF5c1wiLFxuICAgICkubWFwKChkKSA9PiBhc0ludChkLCBcIlx1OTYzQlx1NTg1RVx1NjVGNlx1NkJCNVx1NjYxRlx1NjcxRlwiKSksXG4gICAgc3RhcnQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInN0YXJ0XCIsIFwiXHU5NjNCXHU1ODVFXHU2NUY2XHU2QkI1XCIsIGFzU3RyKSxcbiAgICBlbmQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImVuZFwiLCBcIlx1OTYzQlx1NTg1RVx1NjVGNlx1NkJCNVwiLCBhc1N0ciksXG4gICAgYXR0ZW50aW9uOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiYXR0ZW50aW9uXCIsXG4gICAgICBcIlx1OTYzQlx1NTg1RVx1NjVGNlx1NkJCNVwiLFxuICAgICAgKHYpID0+IG9uZU9mKHYsIFwiYXR0ZW50aW9uXCIsIFtcInJlcXVpcmVkXCIsIFwibGlnaHRcIl0pLFxuICAgICAgXCJyZXF1aXJlZFwiLFxuICAgICkgYXMgQXR0ZW50aW9uLFxuICAgIG5vdGVzOiBmaWVsZChyYXcsIFwibm90ZXNcIiwgXCJcdTk2M0JcdTU4NUVcdTY1RjZcdTZCQjVcIiwgYXNTdHIsIFwiXCIpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplQmxvY2soYjogQmxvY2spOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7XG4gICAgaWQ6IGIuaWQsXG4gICAgdGl0bGU6IGIudGl0bGUsXG4gICAgZGF5czogYi5kYXlzLFxuICAgIHN0YXJ0OiBiLnN0YXJ0LFxuICAgIGVuZDogYi5lbmQsXG4gICAgYXR0ZW50aW9uOiBiLmF0dGVudGlvbixcbiAgICBub3RlczogYi5ub3RlcyxcbiAgfTtcbn1cblxuLyoqIFx1OEJFNVx1NjVFNVx1NjcxRlx1NTM0OFx1NTkxQ1x1OEQ3N1x1N0I5N1x1NzY4NCBgW3N0YXJ0LCBlbmQpYCBcdTUyMDZcdTk0OUZcdTdBOTdcdTUzRTNcdUZGMUJcdThERThcdTUzNDhcdTU5MUNcdTY1RjYgZW5kIFx1OEQ4NVx1OEZDNyAxNDQwXHVGRjFCXHU4QkU1XHU2NjFGXHU2NzFGXHU2NUUwXHU2QjY0XHU1MzYwXHU3NTI4XHU4RkQ0XHU1NkRFIG51bGxcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBiYW5kKFxuICBibG9jazogQmxvY2ssXG4gIGRhdGU6IHN0cmluZyxcbik6IHsgc3RhcnQ6IG51bWJlcjsgZW5kOiBudW1iZXIgfSB8IG51bGwge1xuICBjb25zdCBwYXJzZWQgPSBwYXJzZURhdGUoZGF0ZSk7XG4gIGlmIChwYXJzZWQgPT09IG51bGwpIHJldHVybiBudWxsO1xuICBpZiAoIWJsb2NrLmRheXMuaW5jbHVkZXMod2Vla2RheU1vbmRheShwYXJzZWQpKSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHN0YXJ0ID0gbWludXRlc09mKGJsb2NrLnN0YXJ0KTtcbiAgY29uc3QgZW5kID0gbWludXRlc09mKGJsb2NrLmVuZCk7XG4gIGlmIChzdGFydCA9PT0gbnVsbCB8fCBlbmQgPT09IG51bGwpIHJldHVybiBudWxsO1xuICByZXR1cm4geyBzdGFydCwgZW5kOiBlbmQgPD0gc3RhcnQgPyBlbmQgKyAxNDQwIDogZW5kIH07XG59XG5cbi8qKiBcdTRFMEVcdTU0MENcdTY1RTUgYFtzdGFydCwgZW5kKWAgXHU3QTk3XHU1M0UzXHU5MUNEXHU1M0UwXHU3Njg0XHU1MjA2XHU5NDlGXHU2NTcwXHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gb3ZlcmxhcE1pbnV0ZXMoXG4gIGJsb2NrOiBCbG9jayxcbiAgZGF0ZTogc3RyaW5nLFxuICBzdGFydDogbnVtYmVyLFxuICBlbmQ6IG51bWJlcixcbik6IG51bWJlciB7XG4gIGNvbnN0IGIgPSBiYW5kKGJsb2NrLCBkYXRlKTtcbiAgaWYgKGIgPT09IG51bGwpIHJldHVybiAwO1xuICByZXR1cm4gTWF0aC5taW4oZW5kLCBiLmVuZCkgLSBNYXRoLm1heChzdGFydCwgYi5zdGFydCkgPiAwXG4gICAgPyBNYXRoLm1pbihlbmQsIGIuZW5kKSAtIE1hdGgubWF4KHN0YXJ0LCBiLnN0YXJ0KVxuICAgIDogMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlQmxvY2soYmxvY2s6IEJsb2NrKTogdm9pZCB7XG4gIGlmIChibG9jay5pZC5sZW5ndGggPT09IDApIHtcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTk2M0JcdTU4NUVcdTY1RjZcdTZCQjUgSUQgXHU0RTBEXHU4MEZEXHU0RTNBXHU3QTdBXCIpO1xuICB9XG4gIGlmIChibG9jay50aXRsZS50cmltKCkubGVuZ3RoID09PSAwIHx8IEFycmF5LmZyb20oYmxvY2sudGl0bGUpLmxlbmd0aCA+IDQwKSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU5NjNCXHU1ODVFXHU2NUY2XHU2QkI1XHU1NDBEXHU3OUYwXHU5NzAwXHU0RTNBIDFcdTIwMTM0MCBcdTRFMkFcdTVCNTdcdTdCMjZcIik7XG4gIH1cbiAgaWYgKG1pbnV0ZXNPZihibG9jay5zdGFydCkgPT09IG51bGwgfHwgbWludXRlc09mKGJsb2NrLmVuZCkgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTk2M0JcdTU4NUVcdTY1RjZcdTZCQjVcdTk3MDBcdTRFM0FcdTY3MDlcdTY1NDhcdTc2ODQgSEg6TU0gXHU2NUY2XHU5NUY0XCIpO1xuICB9XG4gIGlmIChibG9jay5zdGFydCA9PT0gYmxvY2suZW5kKSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU5NjNCXHU1ODVFXHU2NUY2XHU2QkI1XHU3Njg0XHU1RjAwXHU1OUNCXHU0RTBFXHU3RUQzXHU2NzVGXHU0RTBEXHU4MEZEXHU3NkY4XHU1NDBDXCIpO1xuICB9XG4gIGNvbnN0IHVuaXF1ZSA9IG5ldyBTZXQoYmxvY2suZGF5cyk7XG4gIGlmIChcbiAgICBibG9jay5kYXlzLmxlbmd0aCA9PT0gMCB8fFxuICAgIGJsb2NrLmRheXMubGVuZ3RoID4gNyB8fFxuICAgIHVuaXF1ZS5zaXplICE9PSBibG9jay5kYXlzLmxlbmd0aCB8fFxuICAgIGJsb2NrLmRheXMuc29tZSgoZCkgPT4gZCA8IDEgfHwgZCA+IDcpXG4gICkge1xuICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJGN1x1OTAwOVx1NjJFOVx1NEUwRFx1OTFDRFx1NTkwRFx1NzY4NFx1NjYxRlx1NjcxRlx1RkYwOFx1NTQ2OFx1NEUwMFx1NEUzQSAxXHVGRjBDXHU1NDY4XHU2NUU1XHU0RTNBIDdcdUZGMDlcIik7XG4gIH1cbiAgaWYgKEFycmF5LmZyb20oYmxvY2subm90ZXMpLmxlbmd0aCA+IDIwMDApIHtcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTk2M0JcdTU4NUVcdTY1RjZcdTZCQjVcdTU5MDdcdTZDRThcdThGQzdcdTk1N0ZcIik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlQmxvY2tzKGJsb2NrczogQmxvY2tbXSk6IHZvaWQge1xuICBpZiAoYmxvY2tzLmxlbmd0aCA+IDYwKSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4QkZFXHU4ODY4XHU5NjNCXHU1ODVFXHU2NUY2XHU2QkI1XHU2NzAwXHU1OTFBIDYwIFx1OTg3OVwiKTtcbiAgfVxuICBjb25zdCBpZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgZm9yIChjb25zdCBibG9jayBvZiBibG9ja3MpIHtcbiAgICB2YWxpZGF0ZUJsb2NrKGJsb2NrKTtcbiAgICBpZiAoaWRzLmhhcyhibG9jay5pZCkpIHtcbiAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OTYzQlx1NTg1RVx1NjVGNlx1NkJCNSBJRCBcdTkxQ0RcdTU5MERcIik7XG4gICAgfVxuICAgIGlkcy5hZGQoYmxvY2suaWQpO1xuICB9XG59XG5cbi8qKiBcdTg5ODZcdTc2RDYgYGRhdGVgIFx1NzY4NFx1NjVGNlx1NkJCNVx1RkYwQ1x1NjMwOVx1NUYwMFx1NTlDQlx1NjVGNlx1OTVGNFx1MzAwMVx1NTE4RFx1NjMwOVx1NjgwN1x1OTg5OFx1NjM5Mlx1NUU4Rlx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb2Nrc09uRGF0ZShibG9ja3M6IEJsb2NrW10sIGRhdGU6IHN0cmluZyk6IEJsb2NrW10ge1xuICBpZiAocGFyc2VEYXRlKGRhdGUpID09PSBudWxsKSByZXR1cm4gW107XG4gIHJldHVybiBibG9ja3NcbiAgICAuZmlsdGVyKChiKSA9PiBiYW5kKGIsIGRhdGUpICE9PSBudWxsKVxuICAgIC5zbGljZSgpXG4gICAgLnNvcnQoKGEsIGIpID0+XG4gICAgICBhLnN0YXJ0IDwgYi5zdGFydFxuICAgICAgICA/IC0xXG4gICAgICAgIDogYS5zdGFydCA+IGIuc3RhcnRcbiAgICAgICAgICA/IDFcbiAgICAgICAgICA6IGEudGl0bGUgPCBiLnRpdGxlXG4gICAgICAgICAgICA/IC0xXG4gICAgICAgICAgICA6IGEudGl0bGUgPiBiLnRpdGxlXG4gICAgICAgICAgICAgID8gMVxuICAgICAgICAgICAgICA6IDAsXG4gICAgKTtcbn1cblxuLyoqIGBkYXRlYCBcdTVGNTNcdTU5MjlcdTk3MDBcdTRFMTNcdTVGQzNcdTY1RjZcdTZCQjVcdTUzNjBcdTc1MjhcdTc2ODRcdTUyMDZcdTk0OUZcdTY1NzBcdUZGMDhcdTUzNjBcdTc1MjhcdThCQzFcdTYzNkVcdUZGMENcdTkxQ0RcdTUzRTBcdTRGMUFcdTkxQ0RcdTU5MERcdThCQTFcdTY1NzBcdUZGMDlcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiByZXF1aXJlZE1pbnV0ZXMoYmxvY2tzOiBCbG9ja1tdLCBkYXRlOiBzdHJpbmcpOiBudW1iZXIge1xuICBpZiAocGFyc2VEYXRlKGRhdGUpID09PSBudWxsKSByZXR1cm4gMDtcbiAgbGV0IHRvdGFsID0gMDtcbiAgZm9yIChjb25zdCBiIG9mIGJsb2Nrcykge1xuICAgIGlmIChiLmF0dGVudGlvbiAhPT0gXCJyZXF1aXJlZFwiKSBjb250aW51ZTtcbiAgICBjb25zdCBiYW5kVmFsdWUgPSBiYW5kKGIsIGRhdGUpO1xuICAgIGlmIChiYW5kVmFsdWUgIT09IG51bGwpIHRvdGFsICs9IGJhbmRWYWx1ZS5lbmQgLSBiYW5kVmFsdWUuc3RhcnQ7XG4gIH1cbiAgcmV0dXJuIHRvdGFsO1xufVxuIiwgIi8vISBcdTRFNjBcdTYwRUZcdTdFQzRcdUZGMUFcdTUzRUFcdTVFMjZcdTdCQTFcdThGOTZcdUZGMUJcdTVGQUFcdTczQUZcdTg5QzRcdTUyMTlcdTRGRERcdTVCNThcdTU3MjhcdTUxNzNcdTgwNTRcdTRFRkJcdTUyQTFcdTRFMEFcdTMwMDJcbi8vISBcdTVCRjlcdTVFOTQgY3JhdGVzL2NvcmUvc3JjL2hhYml0cy5yc1x1MzAwMlxuXG5pbXBvcnQgeyBBcHBFcnJvciwgZW5zdXJlIH0gZnJvbSBcIi4vZXJyb3JzXCI7XG5pbXBvcnQgeyBhc1N0ciwgaXNPYmplY3QsIHJlamVjdFVua25vd24sIHJlcXVpcmVkRmllbGQgfSBmcm9tIFwiLi9qc29uXCI7XG5pbXBvcnQgdHlwZSB7IEhhYml0IH0gZnJvbSBcIi4vbW9kZWxcIjtcblxuY29uc3QgSEFCSVRfS0VZUyA9IFtcImlkXCIsIFwibmFtZVwiXSBhcyBjb25zdDtcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSGFiaXQocmF3OiB1bmtub3duKTogSGFiaXQge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NEU2MFx1NjBFRlx1N0VDNFx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIFsuLi5IQUJJVF9LRVlTXSwgXCJcdTRFNjBcdTYwRUZcdTdFQzRcIik7XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiXHU0RTYwXHU2MEVGXHU3RUM0XCIsIGFzU3RyKSxcbiAgICBuYW1lOiByZXF1aXJlZEZpZWxkKHJhdywgXCJuYW1lXCIsIFwiXHU0RTYwXHU2MEVGXHU3RUM0XCIsIGFzU3RyKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZUhhYml0KGg6IEhhYml0KTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4geyBpZDogaC5pZCwgbmFtZTogaC5uYW1lIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUhhYml0KGhhYml0OiBIYWJpdCk6IHZvaWQge1xuICBpZiAoaGFiaXQubmFtZS50cmltKCkubGVuZ3RoID09PSAwIHx8IEFycmF5LmZyb20oaGFiaXQubmFtZSkubGVuZ3RoID4gNDApIHtcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTRFNjBcdTYwRUZcdTU0MERcdTc5RjBcdTk3MDBcdTRFM0EgMVx1MjAxMzQwIFx1NEUyQVx1NUI1N1x1N0IyNlwiKTtcbiAgfVxufVxuIiwgIi8vISBcdTRFRkJcdTUyQTFcdTc2RjRcdTYzQTVcdTYyRTVcdTY3MDlcdTVGQUFcdTczQUZcdTg5QzRcdTUyMTlcdUZGMUJcdTUzRUFcdTY3MDlcdTVCOENcdTYyMTBcdTVGNTNcdTUyNERcdThGRDlcdTZCMjFcdTYyNERcdTVCODlcdTYzOTJcdTRFMEJcdTRFMDBcdTZCMjFcdTMwMDJcbmltcG9ydCB7IGVuc3VyZSB9IGZyb20gXCIuL2Vycm9yc1wiO1xuaW1wb3J0IHsgaWQgfSBmcm9tIFwiLi9pZHNcIjtcbmltcG9ydCB0eXBlIHsgQXBwRGF0YSwgQWN0aW9uIH0gZnJvbSBcIi4vbGliXCI7XG5pbXBvcnQgdHlwZSB7IFRhc2sgfSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHsgYWRkRGF5cywgZGF0ZUF0LCBmb3JtYXREYXRlLCBwYXJzZURhdGUsIHdlZWtkYXlNb25kYXkgfSBmcm9tIFwiLi90aW1lXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiB0YXNrSXNWb2lkKHRhc2s6IFRhc2spOiBib29sZWFuIHtcbiAgcmV0dXJuICF0YXNrLmNvbXBsZXRlZCAmJiB0YXNrLnJlcGVhdCA9PT0gXCJub25lXCIgJiYgdGFzay5yZW1pbmRlckV4cGlyZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVJlcGVhdCh0YXNrOiBUYXNrKTogdm9pZCB7XG4gIGVuc3VyZShcbiAgICBbXCJub25lXCIsIFwiZGFpbHlcIiwgXCJ3ZWVrZGF5c1wiLCBcIndlZWtseVwiXS5pbmNsdWRlcyh0YXNrLnJlcGVhdCksXG4gICAgXCJcdTY1RTBcdTY1NDhcdTc2ODRcdTVGQUFcdTczQUZcdTg5QzRcdTUyMTlcIixcbiAgKTtcbiAgZW5zdXJlKFxuICAgIHRhc2sucmVwZWF0RGF5cy5sZW5ndGggPD0gNyAmJlxuICAgICAgbmV3IFNldCh0YXNrLnJlcGVhdERheXMpLnNpemUgPT09IHRhc2sucmVwZWF0RGF5cy5sZW5ndGggJiZcbiAgICAgIHRhc2sucmVwZWF0RGF5cy5ldmVyeSgoZCkgPT4gTnVtYmVyLmlzSW50ZWdlcihkKSAmJiBkID49IDEgJiYgZCA8PSA3KSxcbiAgICBcIlx1NjVFMFx1NjU0OFx1NzY4NFx1NUZBQVx1NzNBRlx1NjYxRlx1NjcxRlwiLFxuICApO1xuICBlbnN1cmUoXG4gICAgdGFzay5yZXBlYXQgPT09IFwid2Vla2x5XCIgfHwgdGFzay5yZXBlYXREYXlzLmxlbmd0aCA9PT0gMCxcbiAgICBcIlx1NTNFQVx1NjcwOVx1NkJDRlx1NTQ2OFx1NUZBQVx1NzNBRlx1NTNFRlx1NEVFNVx1NjMwN1x1NUI5QVx1NjYxRlx1NjcxRlwiLFxuICApO1xuICBlbnN1cmUodGFzay5yZXBlYXQgPT09IFwibm9uZVwiIHx8IHRhc2sucmVjdXJyaW5nLCBcIlx1NUZBQVx1NzNBRlx1NEVGQlx1NTJBMVx1NUZDNVx1OTg3Qlx1NEZERFx1NzU1OVx1OTFDRFx1NTkwRFx1Njc2NVx1NkU5MFwiKTtcbiAgZW5zdXJlKFxuICAgIHRhc2suZHVlRGF0ZSAhPT0gbnVsbCB8fFxuICAgICAgKHRhc2sucmVtaW5kZXJUaW1lID09PSBudWxsICYmIHRhc2sucmVwZWF0ID09PSBcImRhaWx5XCIpLFxuICAgIFwiXHU2NUUwXHU2NUU1XHU2NzFGXHU0RUZCXHU1MkExXHU1RkM1XHU5ODdCXHU2NjJGXHU2NUUwXHU2M0QwXHU5MTkyXHU3Njg0XHU2QkNGXHU2NUU1XHU1RkFBXHU3M0FGXHU0RUZCXHU1MkExXCIsXG4gICk7XG4gIGVuc3VyZShcbiAgICB0YXNrLm5leHRUYXNrSWQgPT09IG51bGwgfHxcbiAgICAgICh0YXNrLm5leHRUYXNrSWQudHJpbSgpLmxlbmd0aCA+IDAgJiYgdGFzay5uZXh0VGFza0lkICE9PSB0YXNrLmlkKSxcbiAgICBcIlx1NjVFMFx1NjU0OFx1NzY4NFx1NEUwQlx1NEUwMFx1NkIyMVx1NEVGQlx1NTJBMSBJRFwiLFxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbmV4dERhdGUoXG4gIHRhc2s6IFBpY2s8VGFzaywgXCJkdWVEYXRlXCIgfCBcInJlcGVhdFwiIHwgXCJyZXBlYXREYXlzXCI+LFxuICBhdDogbnVtYmVyLFxuKTogc3RyaW5nIHtcbiAgY29uc3QgdG9kYXkgPSBkYXRlQXQoYXQpO1xuICBjb25zdCBhbmNob3IgPSBwYXJzZURhdGUodGFzay5kdWVEYXRlID8/IHRvZGF5KSE7XG4gIGxldCBkYXkgPSBwYXJzZURhdGUoXG4gICAgdGFzay5kdWVEYXRlICE9PSBudWxsICYmIHRhc2suZHVlRGF0ZSA+IHRvZGF5ID8gdGFzay5kdWVEYXRlIDogdG9kYXksXG4gICkhO1xuICBjb25zdCBkYXlzID1cbiAgICB0YXNrLnJlcGVhdERheXMubGVuZ3RoID4gMCA/IHRhc2sucmVwZWF0RGF5cyA6IFt3ZWVrZGF5TW9uZGF5KGFuY2hvcildO1xuICBkbyB7XG4gICAgZGF5ID0gYWRkRGF5cyhkYXksIDEpO1xuICB9IHdoaWxlIChcbiAgICAodGFzay5yZXBlYXQgPT09IFwid2Vla2RheXNcIiAmJiB3ZWVrZGF5TW9uZGF5KGRheSkgPiA1KSB8fFxuICAgICh0YXNrLnJlcGVhdCA9PT0gXCJ3ZWVrbHlcIiAmJiAhZGF5cy5pbmNsdWRlcyh3ZWVrZGF5TW9uZGF5KGRheSkpKVxuICApO1xuICByZXR1cm4gZm9ybWF0RGF0ZShkYXkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTmV4dFRhc2soZGF0YTogQXBwRGF0YSwgdGFzazogVGFzaywgYXQ6IG51bWJlcik6IHZvaWQge1xuICBpZiAodGFzay5yZXBlYXQgPT09IFwibm9uZVwiIHx8IHRhc2submV4dFRhc2tJZCAhPT0gbnVsbCkgcmV0dXJuO1xuICBjb25zdCBuZXh0OiBUYXNrID0ge1xuICAgIC4uLnRhc2ssXG4gICAgaWQ6IGlkKCksXG4gICAgZHVlRGF0ZTogbmV4dERhdGUodGFzaywgYXQpLFxuICAgIG5leHRUYXNrSWQ6IG51bGwsXG4gICAgY3JlYXRlZEF0OiBhdCxcbiAgICBjb21wbGV0ZWQ6IGZhbHNlLFxuICAgIGNvbXBsZXRlZEF0OiBudWxsLFxuICAgIHJlbWluZGVyRmlyZWQ6IGZhbHNlLFxuICAgIHJlbWluZGVyUGVuZGluZzogZmFsc2UsXG4gICAgcmVtaW5kZXJFeHBpcmVkOiBmYWxzZSxcbiAgICB0YWdzOiBbLi4udGFzay50YWdzXSxcbiAgICBzdWJ0YXNrczogdGFzay5zdWJ0YXNrcy5tYXAoKHMpID0+ICh7IC4uLnMsIGRvbmU6IGZhbHNlIH0pKSxcbiAgfTtcbiAgLy8gXHU2ODA3XHU4QkIwXHU1NzI4XHU1MzlGXHU0RUZCXHU1MkExXHU0RTBBXHVGRjBDXHU2NEE0XHU5NTAwXHU1QjhDXHU2MjEwXHUzMDAxXHU1MjIwXHU5NjY0XHU0RTBCXHU0RTAwXHU2QjIxXHU2MjE2XHU5MUNEXHU1NDJGXHU1NDBFXHU5MEZEXHU0RTBEXHU0RjFBXHU1MThEXHU2QjIxXHU3NTFGXHU2MjEwXHUzMDAyXG4gIHRhc2submV4dFRhc2tJZCA9IG5leHQuaWQ7XG4gIGRhdGEudGFza3MucHVzaChuZXh0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhdmVIYWJpdFRhc2tzKFxuICBkYXRhOiBBcHBEYXRhLFxuICBoYWJpdElkOiBzdHJpbmcsXG4gIGFjdGlvbjogRXh0cmFjdDxBY3Rpb24sIHsgdHlwZTogXCJzYXZlSGFiaXRcIiB9PixcbiAgYXQ6IG51bWJlcixcbik6IHZvaWQge1xuICBlbnN1cmUoYWN0aW9uLnNsb3RzLmxlbmd0aCA8PSA0OSwgXCJcdTRFNjBcdTYwRUZcdTY3MDBcdTU5MUEgNDkgXHU0RTJBXHU2NUY2XHU2QkI1XCIpO1xuICBjb25zdCByZXF1ZXN0ZWQgPSBhY3Rpb24uc2xvdHMubGVuZ3RoXG4gICAgPyBhY3Rpb24uc2xvdHNcbiAgICA6IFt7IGRheXM6IFsxLCAyLCAzLCA0LCA1LCA2LCA3XSwgdGltZTogbnVsbCB9XTtcbiAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IHNsb3Qgb2YgcmVxdWVzdGVkKSB7XG4gICAgZW5zdXJlKFxuICAgICAgc2xvdC5kYXlzLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgc2xvdC5kYXlzLmV2ZXJ5KChkKSA9PiBOdW1iZXIuaXNJbnRlZ2VyKGQpICYmIGQgPj0gMSAmJiBkIDw9IDcpLFxuICAgICAgXCJcdTRFNjBcdTYwRUZcdTY1RjZcdTZCQjVcdTk3MDBcdTg5ODFcdTY3MDlcdTY1NDhcdTY2MUZcdTY3MUZcIixcbiAgICApO1xuICAgIGZvciAoY29uc3QgZGF5IG9mIHNsb3QuZGF5cykge1xuICAgICAgY29uc3Qga2V5ID0gYCR7ZGF5fXwke3Nsb3QudGltZX1gO1xuICAgICAgZW5zdXJlKCFzZWVuLmhhcyhrZXkpLCBcIlx1NEU2MFx1NjBFRlx1NjVGNlx1NkJCNVx1OTFDRFx1NTkwRFwiKTtcbiAgICAgIHNlZW4uYWRkKGtleSk7XG4gICAgfVxuICB9XG4gIGNvbnN0IGxlYXZlcyA9IGRhdGEudGFza3MuZmlsdGVyKFxuICAgICh0KSA9PiB0LmhhYml0SWQgPT09IGhhYml0SWQgJiYgIXQuY29tcGxldGVkICYmIHQubmV4dFRhc2tJZCA9PT0gbnVsbCxcbiAgKTtcbiAgY29uc3Qga2VwdCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IHNsb3Qgb2YgcmVxdWVzdGVkKSB7XG4gICAgY29uc3QgZXhpc3RpbmcgPVxuICAgICAgbGVhdmVzLmZpbmQoKHQpID0+ICFrZXB0Lmhhcyh0LmlkKSAmJiB0LnJlbWluZGVyVGltZSA9PT0gc2xvdC50aW1lKSA/P1xuICAgICAgbGVhdmVzLmZpbmQoKHQpID0+ICFrZXB0Lmhhcyh0LmlkKSk7XG4gICAgY29uc3QgZGF0ZSA9IHBhcnNlRGF0ZShkYXRlQXQoYXQpKSE7XG4gICAgbGV0IGZpcnN0ID0gZGF0ZTtcbiAgICB3aGlsZSAoIXNsb3QuZGF5cy5pbmNsdWRlcyh3ZWVrZGF5TW9uZGF5KGZpcnN0KSkpIGZpcnN0ID0gYWRkRGF5cyhmaXJzdCwgMSk7XG4gICAgY29uc3QgdGFzazogVGFzayA9IGV4aXN0aW5nID8/IHtcbiAgICAgIGlkOiBpZCgpLFxuICAgICAgdGl0bGU6IGFjdGlvbi5uYW1lLnRyaW0oKSxcbiAgICAgIG5vdGVzOiBcIlwiLFxuICAgICAgcHJvamVjdElkOiBhY3Rpb24ucHJvamVjdElkLFxuICAgICAgaGFiaXRJZCxcbiAgICAgIGR1ZURhdGU6IGZvcm1hdERhdGUoZmlyc3QpLFxuICAgICAgcmVtaW5kZXJUaW1lOiBzbG90LnRpbWUsXG4gICAgICBmb2N1c01pbnV0ZXM6IGFjdGlvbi5mb2N1c01pbnV0ZXMsXG4gICAgICBzY3JhcE1pbnV0ZXM6IDAsXG4gICAgICBleHBpcnlEYXlzOiAwLFxuICAgICAgcHJpb3JpdHk6IDAsXG4gICAgICBlc3RpbWF0ZTogMSxcbiAgICAgIHJlY3VycmluZzogdHJ1ZSxcbiAgICAgIHJlcGVhdDogXCJ3ZWVrbHlcIixcbiAgICAgIHJlcGVhdERheXM6IFsuLi5zbG90LmRheXNdLFxuICAgICAgbmV4dFRhc2tJZDogbnVsbCxcbiAgICAgIHJlbWluZGVyRmlyZWQ6IGZhbHNlLFxuICAgICAgcmVtaW5kZXJQZW5kaW5nOiBmYWxzZSxcbiAgICAgIHJlbWluZGVyRXhwaXJlZDogZmFsc2UsXG4gICAgICBjb21wbGV0ZWQ6IGZhbHNlLFxuICAgICAgY29tcGxldGVkQXQ6IG51bGwsXG4gICAgICBjcmVhdGVkQXQ6IGF0LFxuICAgICAgdGFnczogW10sXG4gICAgICBzdWJ0YXNrczogW10sXG4gICAgfTtcbiAgICB0YXNrLnRpdGxlID0gYWN0aW9uLm5hbWUudHJpbSgpO1xuICAgIHRhc2sucHJvamVjdElkID0gYWN0aW9uLnByb2plY3RJZDtcbiAgICB0YXNrLmZvY3VzTWludXRlcyA9IGFjdGlvbi5mb2N1c01pbnV0ZXM7XG4gICAgdGFzay5yZXBlYXQgPSBcIndlZWtseVwiO1xuICAgIHRhc2sucmVwZWF0RGF5cyA9IGFjdGlvbi5zbG90cy5sZW5ndGggPyBbLi4uc2xvdC5kYXlzXSA6IFtdO1xuICAgIHRhc2sucmVwZWF0ID0gYWN0aW9uLnNsb3RzLmxlbmd0aCA/IFwid2Vla2x5XCIgOiBcImRhaWx5XCI7XG4gICAgdGFzay5yZWN1cnJpbmcgPSB0cnVlO1xuICAgIGlmICh0YXNrLnJlbWluZGVyVGltZSAhPT0gc2xvdC50aW1lKSB7XG4gICAgICB0YXNrLnJlbWluZGVyVGltZSA9IHNsb3QudGltZTtcbiAgICAgIHRhc2sucmVtaW5kZXJGaXJlZCA9IGZhbHNlO1xuICAgICAgdGFzay5yZW1pbmRlclBlbmRpbmcgPSBmYWxzZTtcbiAgICAgIHRhc2sucmVtaW5kZXJFeHBpcmVkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICghYWN0aW9uLnNsb3RzLmxlbmd0aCkgdGFzay5kdWVEYXRlID0gbnVsbDtcbiAgICBlbHNlIGlmIChcbiAgICAgIHRhc2suZHVlRGF0ZSA9PT0gbnVsbCB8fFxuICAgICAgIXNsb3QuZGF5cy5pbmNsdWRlcyh3ZWVrZGF5TW9uZGF5KHBhcnNlRGF0ZSh0YXNrLmR1ZURhdGUpISkpXG4gICAgKSB7XG4gICAgICB0YXNrLmR1ZURhdGUgPSBmb3JtYXREYXRlKGZpcnN0KTtcbiAgICAgIHRhc2sucmVtaW5kZXJGaXJlZCA9IGZhbHNlO1xuICAgICAgdGFzay5yZW1pbmRlclBlbmRpbmcgPSBmYWxzZTtcbiAgICAgIHRhc2sucmVtaW5kZXJFeHBpcmVkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICghZXhpc3RpbmcpIGRhdGEudGFza3MucHVzaCh0YXNrKTtcbiAgICBrZXB0LmFkZCh0YXNrLmlkKTtcbiAgfVxuICAvLyBcdTc5RkJcdTk2NjRcdTY1RjZcdTZCQjVcdTUzRUFcdTUwNUNcdTZCNjJcdTU0MEVcdTdFRURcdTVGQUFcdTczQUZcdUZGMENcdTVERjJcdTY3MDlcdTVGODVcdTUyOUVcdTRFMEVcdTUzODZcdTUzRjJcdTRFQ0RcdTRGRERcdTc1NTlcdTMwMDJcbiAgZm9yIChjb25zdCB0YXNrIG9mIGxlYXZlcylcbiAgICBpZiAoIWtlcHQuaGFzKHRhc2suaWQpKSB7XG4gICAgICB0YXNrLnJlcGVhdCA9IFwibm9uZVwiO1xuICAgICAgdGFzay5yZXBlYXREYXlzID0gW107XG4gICAgICB0YXNrLnJlY3VycmluZyA9IGZhbHNlO1xuICAgICAgaWYgKHRhc2suZHVlRGF0ZSA9PT0gbnVsbCkgdGFzay5kdWVEYXRlID0gZGF0ZUF0KGF0KTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXBsYWNlQXBwRGF0YSh0YXJnZXQ6IEFwcERhdGEsIHNvdXJjZTogQXBwRGF0YSk6IHZvaWQge1xuICBPYmplY3QuYXNzaWduKHRhcmdldCwgc291cmNlKTtcbn1cbiIsICIvLyEgXHU2NUY2XHU5NUY0XHU1Qjg5XHU2MzkyXHVGRjFBXHU2NUU1XHU2NzFGL1x1NjVGNlx1OTVGNFx1NEUwRVx1NTM1NVx1NkIyMVx1NjVGNlx1OTU3Rlx1NjgyMVx1OUE4Q1x1MzAwMVx1NUY1M1x1NTkyOVx1NUY4NVx1NTkwNFx1NzQwNlx1OTYxRlx1NTIxN1x1MzAwMVx1OEJBMVx1NjVGNi9cdTk1MDFcdTY3M0FcdTVFRjZcdTU0MEVcdTMwMDFcdThERThcdTY1RTVcdTZFMDVcdTc0MDZcdTMwMDJcbi8vISBcdTVCRjlcdTVFOTQgY3JhdGVzL2NvcmUvc3JjL3JlbWluZGVycy5yc1x1MzAwMlxuXG5pbXBvcnQgeyBBcHBFcnJvciB9IGZyb20gXCIuL2Vycm9yc1wiO1xuaW1wb3J0IHsgaWQgfSBmcm9tIFwiLi9pZHNcIjtcbmltcG9ydCB0eXBlIHsgQXBwRGF0YSB9IGZyb20gXCIuL2xpYlwiO1xuaW1wb3J0IHR5cGUgeyBTZXR0aW5ncywgVGFzaywgVGltZXIgfSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHsgaXNIYWJpdCB9IGZyb20gXCIuL21vZGVsXCI7XG5pbXBvcnQge1xuICBhZGREYXlzLFxuICBmb3JtYXREYXRlLFxuICBwYXJzZURhdGUsXG4gIGRhdGVBdCxcbiAgbWludXRlc09mLFxuICBzZWNvbmRzT2ZEYXksXG4gIHZhbGlkRGF0ZSxcbn0gZnJvbSBcIi4vdGltZVwiO1xuXG4vKiogXHU0RUZCXHU1MkExXHU2NUU1XHU2NzFGXHU1RkM1XHU1ODZCXHUzMDAxXHU2M0QwXHU5MTkyXHU5NzAwXHU4OTgxXHU2NzA5XHU2NTQ4IEhIOk1NXHUzMDAxXHU1MzU1XHU2QjIxXHU2NUY2XHU5NTdGIDFcdTIwMTMxODBcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVJlbWluZGVyVGFzayh0YXNrOiBUYXNrKTogdm9pZCB7XG4gIGlmICh0YXNrLmR1ZURhdGUgIT09IG51bGwgJiYgIXZhbGlkRGF0ZSh0YXNrLmR1ZURhdGUpKSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU0RUZCXHU1MkExXHU1RkM1XHU5ODdCXHU2MzA3XHU1QjlBXHU2NzA5XHU2NTQ4XHU3Njg0XHU4QkExXHU1MjEyXHU2NUU1XHU2NzFGXCIpO1xuICB9XG4gIGlmIChcbiAgICB0YXNrLmZvY3VzTWludXRlcyAhPT0gbnVsbCAmJlxuICAgICh0YXNrLmZvY3VzTWludXRlcyA8IDEgfHwgdGFzay5mb2N1c01pbnV0ZXMgPiAxODApXG4gICkge1xuICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NTM1NVx1NkIyMVx1NEUxM1x1NkNFOFx1NjVGNlx1OTU3Rlx1OTcwMFx1NEUzQTFcdTIwMTQxODBcdTUyMDZcdTk0OUZcIik7XG4gIH1cbiAgaWYgKHRhc2sucmVtaW5kZXJUaW1lICE9PSBudWxsKSB7XG4gICAgaWYgKHRhc2suZHVlRGF0ZSA9PT0gbnVsbCB8fCBtaW51dGVzT2YodGFzay5yZW1pbmRlclRpbWUpID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTYzRDBcdTkxOTJcdTk3MDBcdTg5ODFcdThCQTFcdTUyMTJcdTY1RTVcdTY3MUZcdTU0OENcdTY3MDlcdTY1NDhcdTc2ODQgSEg6TU0gXHU2NUY2XHU5NUY0XCIpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFx1OEJBMVx1NTIxMlx1NTc1N1x1NjAzQlx1OTU3Rlx1RkYxQVx1NTE2OFx1OTBFOFx1NEUxM1x1NkNFOFx1NkJCNVx1NTJBMFx1NkJCNVx1OTVGNFx1NEYxMVx1NjA2Rlx1RkYwQ1x1NTkxQVx1NzU2QVx1ODMwNFx1NEVGQlx1NTJBMVx1OERFOFx1NEYxMVx1NjA2Rlx1OTVGNFx1OTY5OVx1NEVDRFx1NjcwOVx1NjU0OFx1MzAwMlxuICogXHU1QkY5XHU1RTk0IHJlbWluZGVyczo6d2luZG93X21pbnV0ZXNcdTMwMDJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpbmRvd01pbnV0ZXModGFzazogVGFzaywgc2V0dGluZ3M6IFNldHRpbmdzKTogbnVtYmVyIHtcbiAgY29uc3QgZm9jdXMgPSB0YXNrLmZvY3VzTWludXRlcyA/PyBzZXR0aW5ncy5mb2N1c01pbnV0ZXM7XG4gIGNvbnN0IHNlc3Npb25zID0gTWF0aC5tYXgoMSwgdGFzay5lc3RpbWF0ZSk7XG4gIGNvbnN0IGV2ZXJ5ID0gTWF0aC5tYXgoMSwgc2V0dGluZ3MubG9uZ0JyZWFrRXZlcnkpO1xuICBsZXQgYnJlYWtzID0gMDtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPCBzZXNzaW9uczsgaSArPSAxKSB7XG4gICAgYnJlYWtzICs9XG4gICAgICBpICUgZXZlcnkgPT09IDAgPyBzZXR0aW5ncy5sb25nQnJlYWtNaW51dGVzIDogc2V0dGluZ3Muc2hvcnRCcmVha01pbnV0ZXM7XG4gIH1cbiAgcmV0dXJuIHNlc3Npb25zICogZm9jdXMgKyBicmVha3M7XG59XG5cbi8qKiBcdTdBN0FcdTk1RjJcdUZGMUFcdTY3MkFcdThGRDBcdTg4NENcdTMwMDFcdTY3MkFcdTVGMDBcdTU5Q0JcdTMwMDFcdTUyNjlcdTRGNTlcdTZFRTFcdTk4OURcdTMwMDFcdTY1RTBcdTk1MDFcdTY3M0FcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1pbmRlcklkbGUoZGF0YTogQXBwRGF0YSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgICFkYXRhLnRpbWVyLnJ1bm5pbmcgJiZcbiAgICBkYXRhLnRpbWVyLnN0YXJ0ZWRBdCA9PT0gbnVsbCAmJlxuICAgIGRhdGEudGltZXIucmVtYWluaW5nU2VjcyA9PT0gZGF0YS50aW1lci5kdXJhdGlvblNlY3MgJiZcbiAgICBkYXRhLmxvY2suYWN0aXZlID09PSBudWxsXG4gICk7XG59XG5cbi8qKiBcdTVGNTNcdTU5MjlcdTVGODVcdTU5MDRcdTc0MDZcdTYzRDBcdTkxOTJcdUZGMDhcdTYzMDkgXHU2NUU1XHU2NzFGXHUzMDAxXHU2NUY2XHU5NUY0XHUzMDAxSUQgXHU2MzkyXHU1RThGXHU1M0Q2XHU2NzAwXHU2NUU5XHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gcGVuZGluZ1JlbWluZGVyKGRhdGE6IEFwcERhdGEpOiBUYXNrIHwgbnVsbCB7XG4gIGlmICghcmVtaW5kZXJJZGxlKGRhdGEpKSByZXR1cm4gbnVsbDtcbiAgbGV0IGJlc3Q6IFRhc2sgfCBudWxsID0gbnVsbDtcbiAgZm9yIChjb25zdCB0IG9mIGRhdGEudGFza3MpIHtcbiAgICBpZiAodC5jb21wbGV0ZWQgfHwgIXQucmVtaW5kZXJQZW5kaW5nKSBjb250aW51ZTtcbiAgICBpZiAoXG4gICAgICBiZXN0ID09PSBudWxsIHx8XG4gICAgICBgJHt0LmR1ZURhdGV9fCR7dC5yZW1pbmRlclRpbWV9fCR7dC5pZH1gIDxcbiAgICAgICAgYCR7YmVzdC5kdWVEYXRlfXwke2Jlc3QucmVtaW5kZXJUaW1lfXwke2Jlc3QuaWR9YFxuICAgICkge1xuICAgICAgYmVzdCA9IHQ7XG4gICAgfVxuICB9XG4gIHJldHVybiBiZXN0O1xufVxuXG4vKiogXHU4MUVBXHU1MkE4XHU1RjAwXHU1REU1XHU1MDE5XHU5MDA5XHVGRjFBXHU2M0QwXHU5MTkyXHU1Rjg1XHU1OTA0XHU3NDA2XHU0RTE0XHU0RUNEXHU2NzA5XHU1MjY5XHU0RjU5XHU4RjZFXHU2QjIxXHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gZHVlQXV0b1Rhc2soZGF0YTogQXBwRGF0YSk6IFRhc2sgfCBudWxsIHtcbiAgbGV0IGJlc3Q6IFRhc2sgfCBudWxsID0gbnVsbDtcbiAgZm9yIChjb25zdCB0IG9mIGRhdGEudGFza3MpIHtcbiAgICBpZiAoIXQucmVtaW5kZXJQZW5kaW5nIHx8ICF0YXNrSGFzUm91bmRzTGVmdChkYXRhLCB0KSkgY29udGludWU7XG4gICAgaWYgKFxuICAgICAgYmVzdCA9PT0gbnVsbCB8fFxuICAgICAgYCR7dC5kdWVEYXRlfXwke3QucmVtaW5kZXJUaW1lfXwke3QuaWR9YCA8XG4gICAgICAgIGAke2Jlc3QuZHVlRGF0ZX18JHtiZXN0LnJlbWluZGVyVGltZX18JHtiZXN0LmlkfWBcbiAgICApIHtcbiAgICAgIGJlc3QgPSB0O1xuICAgIH1cbiAgfVxuICByZXR1cm4gYmVzdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRhc2tIYXNSb3VuZHNMZWZ0KGRhdGE6IEFwcERhdGEsIHRhc2s6IFRhc2spOiBib29sZWFuIHtcbiAgaWYgKHRhc2suY29tcGxldGVkIHx8IHRhc2sucmVtaW5kZXJFeHBpcmVkKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IGNvbXBsZXRlZFJvdW5kcyA9IGRhdGEuc2Vzc2lvbnMuZmlsdGVyKFxuICAgIChzKSA9PiBzLnNvdXJjZSA9PT0gXCJ0aW1lclwiICYmIHMuY29tcGxldGVkICYmIHMudGFza0lkID09PSB0YXNrLmlkLFxuICApLmxlbmd0aDtcbiAgcmV0dXJuIGNvbXBsZXRlZFJvdW5kcyA8IHRhc2suZXN0aW1hdGU7XG59XG5cbi8qKiBcdTVCOUFcdTY1RjZcdTVGMDBcdTVERTVcdUZGMUFcdThCQTFcdTY1RjYvXHU2NjgyXHU1MDVDL1x1OTUwMVx1NjczQS9cdTgwMDNcdThCRDVcdTRFMkRcdTRFMERcdTYyQTJcdTUzNjBcdUZGMENcdThEODVcdThGQzdcdTRFRkJcdTUyQTFcdTY1RjZcdTZCQjVcdTRFMERcdTg4NjVcdTVGMDBcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGFydER1ZVRhc2soZGF0YTogQXBwRGF0YSwgYXQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICBpZiAoXG4gICAgIWRhdGEuc2V0dGluZ3MuYXV0b1N0YXJ0VGFza3MgfHxcbiAgICAhcmVtaW5kZXJJZGxlKGRhdGEpIHx8XG4gICAgZGF0YS5lZHVjYXRpb24uYXNzZXNzbWVudHMuc29tZShcbiAgICAgIChhKSA9PiBhLnN0YXJ0ZWRBdCAhPT0gbnVsbCAmJiBhLnN0b3BwZWRBdCA9PT0gbnVsbCxcbiAgICApXG4gICkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCB0YXNrID0gZHVlQXV0b1Rhc2soZGF0YSk7XG4gIGlmICh0YXNrID09PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gIGRhdGEudGltZXIudGFza0lkID0gdGFzay5pZDtcbiAgcmVzZXRUbyhkYXRhLCBcImZvY3VzXCIpO1xuICBzdGFydFRpbWVyKGRhdGEsIGF0KTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKiBcdTYzRDBcdTkxOTJcdTcyQjZcdTYwMDFcdTYzQThcdThGREJcdUZGMUFcdTUyMzBcdTY3MUYvXHU0RjVDXHU1RTlGL1x1NUY4NVx1NTkwNFx1NzQwNlx1RkYwQ1x1OERFOFx1NjVFNVx1NkUwNVx1NzQwNlx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRpY2tSZW1pbmRlcnMoZGF0YTogQXBwRGF0YSwgYXQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCB0b2RheSA9IGRhdGVBdChhdCk7XG4gIGNvbnN0IG5vd01pbnV0ZXMgPSBNYXRoLmZsb29yKHNlY29uZHNPZkRheShhdCkgLyA2MCk7XG4gIGNvbnN0IG5vd1NlY29uZHMgPSBzZWNvbmRzT2ZEYXkoYXQpO1xuICBjb25zdCBzZXR0aW5ncyA9IGRhdGEuc2V0dGluZ3M7XG4gIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gIGZvciAoY29uc3QgdCBvZiBkYXRhLnRhc2tzKSB7XG4gICAgaWYgKHQucmVwZWF0ICE9PSBcIm5vbmVcIiAmJiB0LnJlbWluZGVyRXhwaXJlZCkge1xuICAgICAgdC5yZW1pbmRlckV4cGlyZWQgPSBmYWxzZTtcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBpc1RvZGF5ID0gdC5kdWVEYXRlID09PSB0b2RheTtcbiAgICBjb25zdCBwYXN0ID0gdC5kdWVEYXRlICE9PSBudWxsICYmIHQuZHVlRGF0ZSA8IHRvZGF5O1xuICAgIGNvbnN0IHN0YXJ0ID0gdC5yZW1pbmRlclRpbWUgIT09IG51bGwgPyBtaW51dGVzT2YodC5yZW1pbmRlclRpbWUpIDogbnVsbDtcbiAgICAvLyBcdTVCOUFcdTY1RjZcdTRFRkJcdTUyQTFcdTU3MjhcdTUxNzZcdTY1RTVcdTY3MUZcdThGQzdcdTUzQkJcdTU0MEVcdTMwMDFcdTYyMTZcdThCQTFcdTUyMTJcdTU3NTdcdTdFRDNcdTY3NUZcdTU0MEVcdTRGNUNcdTVFOUZcdUZGMUJcdTZCNjRcdTU0MEVcdTY1RTJcdTRFMERcdTYzRDBcdTkxOTJcdTRFNUZcdTRFMERcdTk4N0FcdTVFRjZcdTMwMDJcbiAgICBjb25zdCBleHBpcmVkID1cbiAgICAgICF0LmNvbXBsZXRlZCAmJlxuICAgICAgdC5yZXBlYXQgPT09IFwibm9uZVwiICYmXG4gICAgICAoc3RhcnQgIT09IG51bGxcbiAgICAgICAgPyAoKCkgPT4ge1xuICAgICAgICAgICAgLy8gXHU2NjZFXHU5MDFBXHU0RUZCXHU1MkExXHU1NzI4XHU4QkExXHU1MjEyXHU1NzU3XHU3RUQzXHU2NzVGXHU1NDBFXHU3Njg0XHU5NzU5XHU2MDAxXHU5MUNEXHU0RkVFXHU3QTk3XHU1M0UzXHU1MTg1XHU0RUNEXHU1M0VGXHU4ODY1XHU1MDVBXHVGRjFCXHU0RTYwXHU2MEVGXHU3QTk3XHU1M0UzXHU0RTNBIDBcdTMwMDJcbiAgICAgICAgICAgIGNvbnN0IHNwZW50QXQgPVxuICAgICAgICAgICAgICBzdGFydCArXG4gICAgICAgICAgICAgIHdpbmRvd01pbnV0ZXModCwgc2V0dGluZ3MpICtcbiAgICAgICAgICAgICAgKGlzSGFiaXQodCkgPyAwIDogdC5zY3JhcE1pbnV0ZXMpO1xuICAgICAgICAgICAgcmV0dXJuIHBhc3QgfHwgKGlzVG9kYXkgJiYgbm93U2Vjb25kcyA+PSBzcGVudEF0ICogNjApO1xuICAgICAgICAgIH0pKClcbiAgICAgICAgOiB0LmR1ZURhdGUgIT09IG51bGwgJiZcbiAgICAgICAgICB0b2RheSA+IGZvcm1hdERhdGUoYWRkRGF5cyhwYXJzZURhdGUodC5kdWVEYXRlKSEsIHQuZXhwaXJ5RGF5cykpKTtcbiAgICBpZiAoZXhwaXJlZCAmJiAhdC5yZW1pbmRlckV4cGlyZWQpIHtcbiAgICAgIHQucmVtaW5kZXJFeHBpcmVkID0gdHJ1ZTtcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoKHQuY29tcGxldGVkIHx8IGV4cGlyZWQgfHwgIWlzVG9kYXkpICYmIHQucmVtaW5kZXJQZW5kaW5nKSB7XG4gICAgICB0LnJlbWluZGVyUGVuZGluZyA9IGZhbHNlO1xuICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgfVxuICAgIGlmIChleHBpcmVkICYmICF0LnJlbWluZGVyRmlyZWQpIHtcbiAgICAgIHQucmVtaW5kZXJGaXJlZCA9IHRydWU7XG4gICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgIXQuY29tcGxldGVkICYmXG4gICAgICAhdC5yZW1pbmRlckZpcmVkICYmXG4gICAgICBpc1RvZGF5ICYmXG4gICAgICAhZXhwaXJlZCAmJlxuICAgICAgc3RhcnQgIT09IG51bGwgJiZcbiAgICAgIHN0YXJ0IDw9IG5vd01pbnV0ZXNcbiAgICApIHtcbiAgICAgIHQucmVtaW5kZXJGaXJlZCA9IHRydWU7XG4gICAgICB0LnJlbWluZGVyUGVuZGluZyA9IHRydWU7XG4gICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNoYW5nZWQ7XG59XG5cbi8vIGxpYi50cyBcdTU5MERcdTc1MjhcdTc2ODRcdThCQTFcdTY1RjZcdTUzOUZcdThCRURcdUZGMDhcdTVCRjlcdTVFOTQgQXBwRGF0YSBcdTc2ODRcdTc5QzFcdTY3MDlcdTY1QjlcdTZDRDVcdUZGMDlcdTMwMDJcblxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVyUmVtYWluaW5nKHRpbWVyOiBUaW1lciwgYXQ6IG51bWJlcik6IG51bWJlciB7XG4gIGlmICh0aW1lci5ydW5uaW5nICYmIHRpbWVyLmRlYWRsaW5lICE9PSBudWxsKSB7XG4gICAgY29uc3QgcmVtYWluaW5nID0gdGltZXIuZGVhZGxpbmUgLSBhdDtcbiAgICByZXR1cm4gTWF0aC5taW4oTWF0aC5tYXgocmVtYWluaW5nLCAwKSwgdGltZXIuZHVyYXRpb25TZWNzKTtcbiAgfVxuICByZXR1cm4gdGltZXIucmVtYWluaW5nU2Vjcztcbn1cblxuLyoqIFx1N0VEM1x1NkUwNVx1NUY1M1x1NTI0RFx1OEJBMVx1NjVGNlx1NEUzQVx1NEUwMFx1Njc2MSBUaW1lciBcdTRFMTNcdTZDRThcdThCQjBcdTVGNTVcdUZGMUJcdTk3NUVcdTRFMTNcdTZDRThcdTYyMTZcdTk2RjZcdTc1MjhcdTY1RjZcdTRFMERcdTUwNUFcdTRFRkJcdTRGNTVcdTRFOEJcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiByZWNvcmRTZXNzaW9uKFxuICBkYXRhOiBBcHBEYXRhLFxuICBhdDogbnVtYmVyLFxuICBjb21wbGV0ZWQ6IGJvb2xlYW4sXG4pOiB2b2lkIHtcbiAgY29uc3QgZWxhcHNlZCA9IGRhdGEudGltZXIuZHVyYXRpb25TZWNzIC0gdGltZXJSZW1haW5pbmcoZGF0YS50aW1lciwgYXQpO1xuICBpZiAoZGF0YS50aW1lci5tb2RlICE9PSBcImZvY3VzXCIgfHwgZWxhcHNlZCA9PT0gMCkgcmV0dXJuO1xuICBjb25zdCB0YXNrID0gZGF0YS50YXNrcy5maW5kKCh0KSA9PiB0LmlkID09PSBkYXRhLnRpbWVyLnRhc2tJZCk7XG4gIGNvbnN0IHByb2plY3QgPVxuICAgIHRhc2sgIT09IHVuZGVmaW5lZCAmJiB0YXNrLnByb2plY3RJZCAhPT0gbnVsbFxuICAgICAgPyBkYXRhLnByb2plY3RzLmZpbmQoKHApID0+IHAuaWQgPT09IHRhc2sucHJvamVjdElkKVxuICAgICAgOiB1bmRlZmluZWQ7XG4gIGRhdGEuc2Vzc2lvbnMucHVzaCh7XG4gICAgaWQ6IGlkKCksXG4gICAgc291cmNlOiBcInRpbWVyXCIsXG4gICAgdGFza0lkOiBkYXRhLnRpbWVyLnRhc2tJZCxcbiAgICB0YXNrVGl0bGU6IHRhc2s/LnRpdGxlID8/IFwiXHU4MUVBXHU3NTMxXHU0RTEzXHU2Q0U4XCIsXG4gICAgcHJvamVjdE5hbWU6IHByb2plY3Q/Lm5hbWUgPz8gXCJcdTY3MkFcdTUyMDZcdTdDN0JcIixcbiAgICBzdGFydGVkQXQ6IGRhdGEudGltZXIuc3RhcnRlZEF0ID8/IGF0IC0gZWxhcHNlZCxcbiAgICBlbmRlZEF0OiBhdCxcbiAgICBkdXJhdGlvblNlY3M6IGVsYXBzZWQsXG4gICAgY29tcGxldGVkLFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0VG8oXG4gIGRhdGE6IEFwcERhdGEsXG4gIG1vZGU6IFwiZm9jdXNcIiB8IFwic2hvcnRCcmVha1wiIHwgXCJsb25nQnJlYWtcIixcbik6IHZvaWQge1xuICBkYXRhLnRpbWVyLmF1dG9Gb2N1c0Jsb2NrZWQgPSBmYWxzZTtcbiAgZGF0YS50aW1lci5tb2RlID0gbW9kZTtcbiAgZGF0YS50aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gIGRhdGEudGltZXIuZHVyYXRpb25TZWNzID0gZHVyYXRpb25PZihkYXRhLCBtb2RlKTtcbiAgZGF0YS50aW1lci5yZW1haW5pbmdTZWNzID0gZGF0YS50aW1lci5kdXJhdGlvblNlY3M7XG4gIGRhdGEudGltZXIuZGVhZGxpbmUgPSBudWxsO1xuICBkYXRhLnRpbWVyLnN0YXJ0ZWRBdCA9IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkdXJhdGlvbk9mKFxuICBkYXRhOiBBcHBEYXRhLFxuICBtb2RlOiBcImZvY3VzXCIgfCBcInNob3J0QnJlYWtcIiB8IFwibG9uZ0JyZWFrXCIsXG4pOiBudW1iZXIge1xuICBjb25zdCBtaW51dGVzID1cbiAgICBtb2RlID09PSBcImZvY3VzXCJcbiAgICAgID8gKGRhdGEudGFza3MuZmluZCgodCkgPT4gdC5pZCA9PT0gZGF0YS50aW1lci50YXNrSWQpPy5mb2N1c01pbnV0ZXMgPz9cbiAgICAgICAgZGF0YS5zZXR0aW5ncy5mb2N1c01pbnV0ZXMpXG4gICAgICA6IG1vZGUgPT09IFwic2hvcnRCcmVha1wiXG4gICAgICAgID8gZGF0YS5zZXR0aW5ncy5zaG9ydEJyZWFrTWludXRlc1xuICAgICAgICA6IGRhdGEuc2V0dGluZ3MubG9uZ0JyZWFrTWludXRlcztcbiAgcmV0dXJuIDYwICogbWludXRlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0VGltZXIoZGF0YTogQXBwRGF0YSwgYXQ6IG51bWJlcik6IHZvaWQge1xuICBpZiAoZGF0YS50aW1lci5tb2RlID09PSBcImZvY3VzXCIpIHtcbiAgICBpZiAoXG4gICAgICBkYXRhLnRpbWVyLnN0YXJ0ZWRBdCA9PT0gbnVsbCAmJlxuICAgICAgIWRhdGEudGltZXIucnVubmluZyAmJlxuICAgICAgZGF0YS50aW1lci5yZW1haW5pbmdTZWNzID09PSBkYXRhLnRpbWVyLmR1cmF0aW9uU2Vjc1xuICAgICkge1xuICAgICAgcmVzZXRUbyhkYXRhLCBcImZvY3VzXCIpO1xuICAgIH1cbiAgICBjb25zdCB0YXNrID0gZGF0YS50YXNrcy5maW5kKCh0KSA9PiB0LmlkID09PSBkYXRhLnRpbWVyLnRhc2tJZCk7XG4gICAgaWYgKHRhc2sgIT09IHVuZGVmaW5lZCkgdGFzay5yZW1pbmRlclBlbmRpbmcgPSBmYWxzZTtcbiAgfVxuICBpZiAoIWRhdGEudGltZXIucnVubmluZykge1xuICAgIGlmIChkYXRhLnRpbWVyLnN0YXJ0ZWRBdCA9PT0gbnVsbCkgZGF0YS50aW1lci5zdGFydGVkQXQgPSBhdDtcbiAgICBkYXRhLnRpbWVyLmRlYWRsaW5lID0gYXQgKyBkYXRhLnRpbWVyLnJlbWFpbmluZ1NlY3M7XG4gICAgZGF0YS50aW1lci5ydW5uaW5nID0gdHJ1ZTtcbiAgfVxufVxuIiwgIi8vISBcdTVCNjZcdTYwQzVcdThCQzFcdTYzNkVcdUZGMUFcdTVERjJcdTVCOENcdTYyMTBcdTRFRkJcdTUyQTFcdTVGRUJcdTcxNjdcdTMwMDFcdTY3NjVcdTZFOTBcdTUzRUZcdTVCQTFcdThCQTFcdTRFMTRcdTRFMERcdTUzRUZcdTg5ODZcdTUxOTlcdTc2ODRcdThGREJcdTVFQTZcdTUzODZcdTUzRjJcdTMwMDFcdThCQTJcdTZCNjNcdTY4QzBcdTY3RTVcdUZGMENcbi8vISBcdTYzMDlcdTYzRDBcdTRFQTQvXHU2Mjc5XHU2NTM5L1x1OEJBMlx1NkI2M1x1N0QyMlx1NUYxNVx1OEJBMVx1N0I5N1x1NTJBOFx1NjAwMVx1NUI2Nlx1NjBDNVx1NjQ1OFx1ODk4MVx1NTNDQVx1NjM4Q1x1NjNFMS9cdThCQTFcdTY1RjYvXHU4QkEyXHU2QjYzL1x1NTkwRFx1NkQ0Qlx1NTIwNlx1NUM0Mlx1MzAwMlxuLy8hIFx1NUJGOVx1NUU5NCBjcmF0ZXMvY29yZS9zcmMvbGVhcm5pbmcucnNcdTMwMDJcblxuaW1wb3J0IHsgQXBwRXJyb3IsIGVuc3VyZSwgcmVxdWlyZSB9IGZyb20gXCIuL2Vycm9yc1wiO1xuaW1wb3J0IHtcbiAgYXNBcnJheSxcbiAgYXNCb29sLFxuICBhc0ludCxcbiAgYXNPcHQsXG4gIGFzU3RyLFxuICBmaWVsZCxcbiAgaXNPYmplY3QsXG4gIG9uZU9mLFxuICByZWplY3RVbmtub3duLFxuICByZXF1aXJlZEZpZWxkLFxufSBmcm9tIFwiLi9qc29uXCI7XG5pbXBvcnQgdHlwZSB7IEVkdWNhdGlvbiB9IGZyb20gXCIuL2VkdWNhdGlvblwiO1xuaW1wb3J0IHR5cGUgeyBBcHBEYXRhIH0gZnJvbSBcIi4vbGliXCI7XG5pbXBvcnQgdHlwZSB7XG4gIEFzc2Vzc21lbnQsXG4gIENvbXBsZXRlZFN0dWR5VGFzayxcbiAgQ29ycmVjdGlvbixcbiAgR3JhZGUsXG4gIExlc3NvbixcbiAgUHJvZ3Jlc3NSZWNvcmQsXG4gIFJldmlldyxcbiAgU3VibWlzc2lvbixcbn0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IGF0TG9jYWxEYXRlU3RyaW5nLCBkYXRlQXQgfSBmcm9tIFwiLi90aW1lXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNvbXBsZXRlZFN0dWR5VGFzayhyYXc6IHVua25vd24pOiBDb21wbGV0ZWRTdHVkeVRhc2sge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NURGMlx1NUI4Q1x1NjIxMFx1NUI2Nlx1NEU2MFx1NEVGQlx1NTJBMVx1NUZFQlx1NzE2N1x1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihcbiAgICByYXcsXG4gICAgW1wiaWRcIiwgXCJwcm9qZWN0SWRcIiwgXCJ0aXRsZVwiLCBcIm5vdGVzXCIsIFwidG9waWNzXCIsIFwiY29tcGxldGVkQXRcIl0sXG4gICAgXCJcdTVERjJcdTVCOENcdTYyMTBcdTVCNjZcdTRFNjBcdTRFRkJcdTUyQTFcdTVGRUJcdTcxNjdcIixcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTVERjJcdTVCOENcdTYyMTBcdTVCNjZcdTRFNjBcdTRFRkJcdTUyQTFcdTVGRUJcdTcxNjdcIiwgYXNTdHIpLFxuICAgIHByb2plY3RJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvamVjdElkXCIsIFwiXHU1REYyXHU1QjhDXHU2MjEwXHU1QjY2XHU0RTYwXHU0RUZCXHU1MkExXHU1RkVCXHU3MTY3XCIsIGFzU3RyKSxcbiAgICB0aXRsZTogcmVxdWlyZWRGaWVsZChyYXcsIFwidGl0bGVcIiwgXCJcdTVERjJcdTVCOENcdTYyMTBcdTVCNjZcdTRFNjBcdTRFRkJcdTUyQTFcdTVGRUJcdTcxNjdcIiwgYXNTdHIpLFxuICAgIG5vdGVzOiByZXF1aXJlZEZpZWxkKHJhdywgXCJub3Rlc1wiLCBcIlx1NURGMlx1NUI4Q1x1NjIxMFx1NUI2Nlx1NEU2MFx1NEVGQlx1NTJBMVx1NUZFQlx1NzE2N1wiLCBhc1N0ciksXG4gICAgdG9waWNzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidG9waWNzXCIsXG4gICAgICBcIlx1NURGMlx1NUI4Q1x1NjIxMFx1NUI2Nlx1NEU2MFx1NEVGQlx1NTJBMVx1NUZFQlx1NzE2N1wiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJ0b3BpY3NcIikubWFwKCh4KSA9PiBhc1N0cih4LCBcIlx1NzdFNVx1OEJDNlx1NzBCOVwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICAgIGNvbXBsZXRlZEF0OiByZXF1aXJlZEZpZWxkKHJhdywgXCJjb21wbGV0ZWRBdFwiLCBcIlx1NURGMlx1NUI4Q1x1NjIxMFx1NUI2Nlx1NEU2MFx1NEVGQlx1NTJBMVx1NUZFQlx1NzE2N1wiLCBhc0ludCksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVDb21wbGV0ZWRTdHVkeVRhc2soXG4gIHQ6IENvbXBsZXRlZFN0dWR5VGFzayxcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogdC5pZCxcbiAgICBwcm9qZWN0SWQ6IHQucHJvamVjdElkLFxuICAgIHRpdGxlOiB0LnRpdGxlLFxuICAgIG5vdGVzOiB0Lm5vdGVzLFxuICAgIHRvcGljczogdC50b3BpY3MsXG4gICAgY29tcGxldGVkQXQ6IHQuY29tcGxldGVkQXQsXG4gIH07XG59XG5cbmZ1bmN0aW9uIHRleHQoczogc3RyaW5nLCBtYXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gcy50cmltKCkubGVuZ3RoID4gMCAmJiBBcnJheS5mcm9tKHMpLmxlbmd0aCA8PSBtYXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUxlYXJuaW5nKGRhdGE6IEFwcERhdGEpOiB2b2lkIHtcbiAgY29uc3QgZSA9IGRhdGEuZWR1Y2F0aW9uO1xuICBlbnN1cmUoXG4gICAgZS5wcm9ncmVzcy5sZW5ndGggKyBlLmNvbXBsZXRlZFRhc2tzLmxlbmd0aCArIGUuY29ycmVjdGlvbnMubGVuZ3RoIDw9XG4gICAgICAxMDAwMDAsXG4gICAgXCJcdTVCNjZcdTRFNjBcdThCQzFcdTYzNkVcdTY1NzBcdTkxQ0ZcdThEODVcdTUxRkFcdTk2NTBcdTUyMzZcIixcbiAgKTtcbiAgY29uc3QgaWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgdGFzayBvZiBlLmNvbXBsZXRlZFRhc2tzKSB7XG4gICAgZW5zdXJlKFxuICAgICAgIWlkcy5oYXMoYHRhc2t8JHt0YXNrLmlkfWApICYmXG4gICAgICAgIHRhc2suaWQubGVuZ3RoID4gMCAmJlxuICAgICAgICBkYXRhLnByb2plY3RzLnNvbWUoKHApID0+IHAuaWQgPT09IHRhc2sucHJvamVjdElkKSAmJlxuICAgICAgICB0ZXh0KHRhc2sudGl0bGUsIDIwMCkgJiZcbiAgICAgICAgdGFzay5ub3Rlcy5sZW5ndGggPD0gNTAwMDAgJiZcbiAgICAgICAgdGFzay50b3BpY3MubGVuZ3RoIDw9IDIwLFxuICAgICAgXCJcdTY1RTBcdTY1NDhcdTc2ODRcdTVERjJcdTVCOENcdTYyMTBcdTVCNjZcdTRFNjBcdTRFRkJcdTUyQTFcdTVGRUJcdTcxNjdcIixcbiAgICApO1xuICAgIGlkcy5hZGQoYHRhc2t8JHt0YXNrLmlkfWApO1xuICB9XG4gIGZvciAoY29uc3QgcmVjb3JkIG9mIGUucHJvZ3Jlc3MpIHtcbiAgICBlbnN1cmUoXG4gICAgICAhaWRzLmhhcyhgcHJvZ3Jlc3N8JHtyZWNvcmQuaWR9YCkgJiZcbiAgICAgICAgcmVjb3JkLmlkLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgZGF0YS5wcm9qZWN0cy5zb21lKChwKSA9PiBwLmlkID09PSByZWNvcmQucHJvamVjdElkKSAmJlxuICAgICAgICB0ZXh0KHJlY29yZC50b3BpYywgMjAwKSAmJlxuICAgICAgICB0ZXh0KHJlY29yZC5wb3NpdGlvbiwgMjAwMCkgJiZcbiAgICAgICAgdGV4dChyZWNvcmQuZXZpZGVuY2UsIDgwMDApICYmXG4gICAgICAgIEFycmF5LmZyb20ocmVjb3JkLm5leHRBY3Rpb24pLmxlbmd0aCA8PSAyMDAwLFxuICAgICAgXCJcdTVCNjZcdTRFNjBcdThGREJcdTVFQTZcdTk3MDBcdTg5ODFcdTk4NzlcdTc2RUVcdTMwMDFcdTc3RTVcdThCQzZcdTcwQjlcdTMwMDFcdTVCOUVcdTk2NDVcdTRGNERcdTdGNkVcdTU0OENcdTRGOURcdTYzNkVcIixcbiAgICApO1xuICAgIGlkcy5hZGQoYHByb2dyZXNzfCR7cmVjb3JkLmlkfWApO1xuICB9XG4gIGZvciAoY29uc3QgY29ycmVjdGlvbiBvZiBlLmNvcnJlY3Rpb25zKSB7XG4gICAgY29uc3QgZ3JhZGUgPSByZXF1aXJlKGUuZ3JhZGVzLmZpbmQoXG4gICAgICAoZykgPT4gZy5pZCA9PT0gY29ycmVjdGlvbi5ncmFkZUlkLFxuICAgICksIFwiXHU4QkEyXHU2QjYzXHU3RjNBXHU1QzExXHU2Mjc5XHU2NTM5XHU4QkIwXHU1RjU1XCIpO1xuICAgIGNvbnN0IGFzc2Vzc21lbnQgPSByZXF1aXJlKCgoKSA9PiB7XG4gICAgICBjb25zdCBzdWIgPSBlLnN1Ym1pc3Npb25zLmZpbmQoKHMpID0+IHMuaWQgPT09IGdyYWRlLnN1Ym1pc3Npb25JZCk7XG4gICAgICByZXR1cm4gc3ViID09PSB1bmRlZmluZWRcbiAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgOiBlLmFzc2Vzc21lbnRzLmZpbmQoKGEpID0+IGEuaWQgPT09IHN1Yi5hc3Nlc3NtZW50SWQpO1xuICAgIH0pKCksIFwiXHU4QkEyXHU2QjYzXHU3RjNBXHU1QzExXHU4QkQ1XHU5ODk4XCIpO1xuICAgIGVuc3VyZShcbiAgICAgICFpZHMuaGFzKGBjb3JyZWN0aW9ufCR7Y29ycmVjdGlvbi5pZH1gKSAmJlxuICAgICAgICBjb3JyZWN0aW9uLmlkLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgYXNzZXNzbWVudC5xdWVzdGlvbnMuc29tZSgocSkgPT4gcS5pZCA9PT0gY29ycmVjdGlvbi5xdWVzdGlvbklkKSAmJlxuICAgICAgICBBcnJheS5mcm9tKGNvcnJlY3Rpb24uZXhwbGFuYXRpb24pLmxlbmd0aCA8PSA4MDAwICYmXG4gICAgICAgICh0ZXh0KGNvcnJlY3Rpb24uZXhwbGFuYXRpb24sIDgwMDApIHx8XG4gICAgICAgICAgY29ycmVjdGlvbi5yZXNvdXJjZUlkcy5sZW5ndGggPiAwKSAmJlxuICAgICAgICBjb3JyZWN0aW9uLnJlc291cmNlSWRzLmV2ZXJ5KChpZCkgPT5cbiAgICAgICAgICBlLnJlc291cmNlcy5zb21lKFxuICAgICAgICAgICAgKHIpID0+IHIuaWQgPT09IGlkICYmIHIucHJvamVjdElkID09PSBhc3Nlc3NtZW50LnByb2plY3RJZCxcbiAgICAgICAgICApLFxuICAgICAgICApICYmXG4gICAgICAgIChjb3JyZWN0aW9uLmFjY2VwdGVkICE9PSBudWxsKSA9PT0gKGNvcnJlY3Rpb24ucmV2aWV3ZWRBdCAhPT0gbnVsbCkgJiZcbiAgICAgICAgKGNvcnJlY3Rpb24ucmV2aWV3ZWRBdCA9PT0gbnVsbCB8fFxuICAgICAgICAgIChjb3JyZWN0aW9uLnJldmlld2VkQXQgPj0gY29ycmVjdGlvbi5zdWJtaXR0ZWRBdCAmJlxuICAgICAgICAgICAgdGV4dChjb3JyZWN0aW9uLmZlZWRiYWNrLCA4MDAwKSkpLFxuICAgICAgXCJcdThCQTJcdTZCNjNcdTk3MDBcdTg5ODFcdTUzOUZcdTk4OThcdTMwMDFcdTg5RTNcdTkxQ0FcdTYyMTZcdTY3MkNcdTk4NzlcdTc2RUVcdTk2NDRcdTRFRjZcdUZGMUJcdTY4QzBcdTY3RTVcdTdFRDNcdTY3OUNcdTVGQzVcdTk4N0JcdTY3MDlcdTUzQ0RcdTk5ODhcIixcbiAgICApO1xuICAgIGlkcy5hZGQoYGNvcnJlY3Rpb258JHtjb3JyZWN0aW9uLmlkfWApO1xuICB9XG59XG5cbi8qKiBcdThGREJcdTVFQTYvXHU1RkVCXHU3MTY3L1x1OEJBMlx1NkI2M1x1NTM4Nlx1NTNGMlx1NEUwRFx1NTNFRlx1NTIyMFx1OTY2NFx1MzAwMVx1NEUwRFx1NTNFRlx1NjUzOVx1NTE5OVx1RkYxQlx1Nzg2RVx1OEJBNFx1NEUwRVx1NjhDMFx1NjdFNVx1NzJCNlx1NjAwMVx1NTE0MVx1OEJCOFx1NTM1NVx1NTQxMVx1NjNBOFx1OEZEQlx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlTGVhcm5pbmdUcmFuc2l0aW9uKFxuICBiZWZvcmU6IEVkdWNhdGlvbixcbiAgYWZ0ZXI6IEVkdWNhdGlvbixcbik6IHZvaWQge1xuICBmb3IgKGNvbnN0IHJlY29yZCBvZiBiZWZvcmUucHJvZ3Jlc3MpIHtcbiAgICBlbnN1cmUoXG4gICAgICBhZnRlci5wcm9ncmVzcy5zb21lKChyKSA9PiByLmlkID09PSByZWNvcmQuaWQpLFxuICAgICAgXCJcdThGREJcdTVFQTZcdTUzODZcdTUzRjJcdTRFMERcdTgwRkRcdTUyMjBcdTk2NjRcdUZGMENcdThCRjdcdTY1QjBcdTU4OUVcdTY2RjRcdTZCNjNcdThCQjBcdTVGNTVcIixcbiAgICApO1xuICAgIGNvbnN0IG5leHQgPSBhZnRlci5wcm9ncmVzcy5maW5kKChyKSA9PiByLmlkID09PSByZWNvcmQuaWQpO1xuICAgIGlmIChuZXh0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IG9sZCA9IHsgLi4ucmVjb3JkIH07XG4gICAgICBvbGQuY29uZmlybWVkID0gbmV4dC5jb25maXJtZWQ7XG4gICAgICBlbnN1cmUocHJvZ3Jlc3NFcXVhbHMob2xkLCBuZXh0KSwgXCJcdThGREJcdTVFQTZcdTUzODZcdTUzRjJcdTRFMERcdTUzRUZcdTY1MzlcdTUxOTlcdUZGMENcdThCRjdcdTY1QjBcdTU4OUVcdTRFMDBcdTY3NjFcdTY2RjRcdTZCNjNcdThCQjBcdTVGNTVcIik7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgcmVjb3JkIG9mIGJlZm9yZS5jb21wbGV0ZWRUYXNrcykge1xuICAgIGVuc3VyZShcbiAgICAgIGFmdGVyLmNvbXBsZXRlZFRhc2tzLmZpbmQoKHIpID0+IHIuaWQgPT09IHJlY29yZC5pZCkgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICBjb21wbGV0ZWRUYXNrRXF1YWxzKFxuICAgICAgICAgIGFmdGVyLmNvbXBsZXRlZFRhc2tzLmZpbmQoKHIpID0+IHIuaWQgPT09IHJlY29yZC5pZCkhLFxuICAgICAgICAgIHJlY29yZCxcbiAgICAgICAgKSxcbiAgICAgIFwiXHU1REYyXHU1QjhDXHU2MjEwXHU0RUZCXHU1MkExXHU3Njg0XHU1QjY2XHU0RTYwXHU1MTg1XHU1QkI5XHU1RkVCXHU3MTY3XHU0RTBEXHU1M0VGXHU2NTM5XHU1MTk5XCIsXG4gICAgKTtcbiAgfVxuICBmb3IgKGNvbnN0IHJlY29yZCBvZiBiZWZvcmUuY29ycmVjdGlvbnMpIHtcbiAgICBlbnN1cmUoXG4gICAgICBhZnRlci5jb3JyZWN0aW9ucy5zb21lKChyKSA9PiByLmlkID09PSByZWNvcmQuaWQpLFxuICAgICAgXCJcdThCQTJcdTZCNjNcdTUzODZcdTUzRjJcdTRFMERcdTgwRkRcdTUyMjBcdTk2NjRcIixcbiAgICApO1xuICAgIGNvbnN0IG5leHQgPSBhZnRlci5jb3JyZWN0aW9ucy5maW5kKChyKSA9PiByLmlkID09PSByZWNvcmQuaWQpO1xuICAgIGlmIChuZXh0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IG9sZCA9IHsgLi4ucmVjb3JkLCByZXNvdXJjZUlkczogWy4uLnJlY29yZC5yZXNvdXJjZUlkc10gfTtcbiAgICAgIGlmIChvbGQucmV2aWV3ZWRBdCA9PT0gbnVsbCkge1xuICAgICAgICBvbGQuYWNjZXB0ZWQgPSBuZXh0LmFjY2VwdGVkO1xuICAgICAgICBvbGQuZmVlZGJhY2sgPSBuZXh0LmZlZWRiYWNrO1xuICAgICAgICBvbGQucmV2aWV3ZWRBdCA9IG5leHQucmV2aWV3ZWRBdDtcbiAgICAgIH1cbiAgICAgIGVuc3VyZShcbiAgICAgICAgY29ycmVjdGlvbkVxdWFscyhvbGQsIG5leHQpLFxuICAgICAgICBcIlx1OEJBMlx1NkI2M1x1NEUwRVx1NjhDMFx1NjdFNVx1NTM4Nlx1NTNGMlx1NEUwRFx1NTNFRlx1NjUzOVx1NTE5OVx1RkYwQ1x1OEJGN1x1NjVCMFx1NTg5RVx1NEUwMFx1NkIyMVx1OEJBMlx1NkI2M1wiLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcHJvZ3Jlc3NFcXVhbHMoYTogUHJvZ3Jlc3NSZWNvcmQsIGI6IFByb2dyZXNzUmVjb3JkKTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgYS5pZCA9PT0gYi5pZCAmJlxuICAgIGEucHJvamVjdElkID09PSBiLnByb2plY3RJZCAmJlxuICAgIGEudG9waWMgPT09IGIudG9waWMgJiZcbiAgICBhLnBvc2l0aW9uID09PSBiLnBvc2l0aW9uICYmXG4gICAgYS5zdGF0ZSA9PT0gYi5zdGF0ZSAmJlxuICAgIGEuZXZpZGVuY2UgPT09IGIuZXZpZGVuY2UgJiZcbiAgICBhLm5leHRBY3Rpb24gPT09IGIubmV4dEFjdGlvbiAmJlxuICAgIGEuc291cmNlID09PSBiLnNvdXJjZSAmJlxuICAgIGEuY29uZmlybWVkID09PSBiLmNvbmZpcm1lZCAmJlxuICAgIGEucmVjb3JkZWRBdCA9PT0gYi5yZWNvcmRlZEF0XG4gICk7XG59XG5cbmZ1bmN0aW9uIGNvbXBsZXRlZFRhc2tFcXVhbHMoXG4gIGE6IENvbXBsZXRlZFN0dWR5VGFzayxcbiAgYjogQ29tcGxldGVkU3R1ZHlUYXNrLFxuKTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgYS5pZCA9PT0gYi5pZCAmJlxuICAgIGEucHJvamVjdElkID09PSBiLnByb2plY3RJZCAmJlxuICAgIGEudGl0bGUgPT09IGIudGl0bGUgJiZcbiAgICBhLm5vdGVzID09PSBiLm5vdGVzICYmXG4gICAgYS50b3BpY3MubGVuZ3RoID09PSBiLnRvcGljcy5sZW5ndGggJiZcbiAgICBhLnRvcGljcy5ldmVyeSgodCwgaSkgPT4gYi50b3BpY3NbaV0gPT09IHQpICYmXG4gICAgYS5jb21wbGV0ZWRBdCA9PT0gYi5jb21wbGV0ZWRBdFxuICApO1xufVxuXG5mdW5jdGlvbiBjb3JyZWN0aW9uRXF1YWxzKGE6IENvcnJlY3Rpb24sIGI6IENvcnJlY3Rpb24pOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICBhLmlkID09PSBiLmlkICYmXG4gICAgYS5ncmFkZUlkID09PSBiLmdyYWRlSWQgJiZcbiAgICBhLnF1ZXN0aW9uSWQgPT09IGIucXVlc3Rpb25JZCAmJlxuICAgIGEuZXhwbGFuYXRpb24gPT09IGIuZXhwbGFuYXRpb24gJiZcbiAgICBhLnJlc291cmNlSWRzLmxlbmd0aCA9PT0gYi5yZXNvdXJjZUlkcy5sZW5ndGggJiZcbiAgICBhLnJlc291cmNlSWRzLmV2ZXJ5KChyLCBpKSA9PiBiLnJlc291cmNlSWRzW2ldID09PSByKSAmJlxuICAgIGEuc3VibWl0dGVkQXQgPT09IGIuc3VibWl0dGVkQXQgJiZcbiAgICBhLmFjY2VwdGVkID09PSBiLmFjY2VwdGVkICYmXG4gICAgYS5mZWVkYmFjayA9PT0gYi5mZWVkYmFjayAmJlxuICAgIGEucmV2aWV3ZWRBdCA9PT0gYi5yZXZpZXdlZEF0XG4gICk7XG59XG5cbi8vIC0tLS0tLS0tLS0gXHU1QjY2XHU2MEM1XHU2NDU4XHU4OTgxIC0tLS0tLS0tLS1cblxuaW50ZXJmYWNlIFN1bW1hcnlJbmRleCB7XG4gIHN1Ym1pc3Npb25zOiBNYXA8c3RyaW5nLCBTdWJtaXNzaW9uPjtcbiAgZ3JhZGVzOiBNYXA8c3RyaW5nLCBHcmFkZT47XG4gIGFzc2Vzc21lbnRHcmFkZXM6IE1hcDxzdHJpbmcsIEdyYWRlPjtcbiAgYWNjZXB0ZWQ6IFNldDxzdHJpbmc+O1xuICByZXRlc3RzOiBNYXA8c3RyaW5nLCBBc3Nlc3NtZW50W10+O1xufVxuXG5mdW5jdGlvbiBidWlsZFN1bW1hcnlJbmRleChlOiBFZHVjYXRpb24pOiBTdW1tYXJ5SW5kZXgge1xuICBjb25zdCBpbmRleDogU3VtbWFyeUluZGV4ID0ge1xuICAgIHN1Ym1pc3Npb25zOiBuZXcgTWFwKCksXG4gICAgZ3JhZGVzOiBuZXcgTWFwKCksXG4gICAgYXNzZXNzbWVudEdyYWRlczogbmV3IE1hcCgpLFxuICAgIGFjY2VwdGVkOiBuZXcgU2V0KCksXG4gICAgcmV0ZXN0czogbmV3IE1hcCgpLFxuICB9O1xuICBjb25zdCBwYXJlbnRzID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgZm9yIChjb25zdCBzIG9mIGUuc3VibWlzc2lvbnMpIHtcbiAgICBwYXJlbnRzLnNldChzLmlkLCBzLmFzc2Vzc21lbnRJZCk7XG4gICAgY29uc3Qgb2xkID0gaW5kZXguc3VibWlzc2lvbnMuZ2V0KHMuYXNzZXNzbWVudElkKTtcbiAgICBpZiAob2xkID09PSB1bmRlZmluZWQgfHwgcy5zdWJtaXR0ZWRBdCA+PSBvbGQuc3VibWl0dGVkQXQpIHtcbiAgICAgIGluZGV4LnN1Ym1pc3Npb25zLnNldChzLmFzc2Vzc21lbnRJZCwgcyk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgZyBvZiBlLmdyYWRlcykge1xuICAgIGNvbnN0IG9sZCA9IGluZGV4LmdyYWRlcy5nZXQoZy5zdWJtaXNzaW9uSWQpO1xuICAgIGlmIChvbGQgPT09IHVuZGVmaW5lZCB8fCBnLmdyYWRlZEF0ID49IG9sZC5ncmFkZWRBdCkge1xuICAgICAgaW5kZXguZ3JhZGVzLnNldChnLnN1Ym1pc3Npb25JZCwgZyk7XG4gICAgfVxuICAgIGNvbnN0IGFzc2Vzc21lbnQgPSBwYXJlbnRzLmdldChnLnN1Ym1pc3Npb25JZCk7XG4gICAgaWYgKGFzc2Vzc21lbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3Qgb2xkQSA9IGluZGV4LmFzc2Vzc21lbnRHcmFkZXMuZ2V0KGFzc2Vzc21lbnQpO1xuICAgICAgaWYgKG9sZEEgPT09IHVuZGVmaW5lZCB8fCBnLmdyYWRlZEF0ID49IG9sZEEuZ3JhZGVkQXQpIHtcbiAgICAgICAgaW5kZXguYXNzZXNzbWVudEdyYWRlcy5zZXQoYXNzZXNzbWVudCwgZyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgYyBvZiBlLmNvcnJlY3Rpb25zKSB7XG4gICAgaWYgKGMuYWNjZXB0ZWQgPT09IHRydWUpIHtcbiAgICAgIGluZGV4LmFjY2VwdGVkLmFkZChgJHtjLmdyYWRlSWR9fCR7Yy5xdWVzdGlvbklkfWApO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IGEgb2YgZS5hc3Nlc3NtZW50cykge1xuICAgIGlmIChhLnJldGVzdE9mR3JhZGVJZCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgbGlzdCA9IGluZGV4LnJldGVzdHMuZ2V0KGEucmV0ZXN0T2ZHcmFkZUlkKSA/PyBbXTtcbiAgICAgIGxpc3QucHVzaChhKTtcbiAgICAgIGluZGV4LnJldGVzdHMuc2V0KGEucmV0ZXN0T2ZHcmFkZUlkLCBsaXN0KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGluZGV4O1xufVxuXG5mdW5jdGlvbiBhc3Nlc3NtZW50U3VtbWFyeShcbiAgaW5kZXg6IFN1bW1hcnlJbmRleCxcbiAgYTogQXNzZXNzbWVudCxcbiAgYXQ6IG51bWJlcixcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgY29uc3Qgc3VibWlzc2lvbiA9IGluZGV4LnN1Ym1pc3Npb25zLmdldChhLmlkKSA/PyBudWxsO1xuICBjb25zdCBncmFkZSA9XG4gICAgc3VibWlzc2lvbiAhPT0gbnVsbCA/IChpbmRleC5ncmFkZXMuZ2V0KHN1Ym1pc3Npb24uaWQpID8/IG51bGwpIDogbnVsbDtcbiAgY29uc3Qgc3RhdHVzID0gKCgpID0+IHtcbiAgICBpZiAoZ3JhZGUgIT09IG51bGwpIHtcbiAgICAgIGlmIChncmFkZS5uZWVkc1JldmlldykgcmV0dXJuIFwibmVlZHNSZXZpZXdcIjtcbiAgICAgIGlmIChcbiAgICAgICAgZ3JhZGUuZXJyb3JzLnNvbWUoXG4gICAgICAgICAgKGVycm9yKSA9PiAhaW5kZXguYWNjZXB0ZWQuaGFzKGAke2dyYWRlLmlkfXwke2Vycm9yLnF1ZXN0aW9uSWR9YCksXG4gICAgICAgIClcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gXCJjb3JyZWN0aW9uRHVlXCI7XG4gICAgICB9XG4gICAgICByZXR1cm4gXCJncmFkZWRcIjtcbiAgICB9XG4gICAgaWYgKHN1Ym1pc3Npb24gIT09IG51bGwpIHJldHVybiBcInN1Ym1pdHRlZFwiO1xuICAgIGlmIChcbiAgICAgIGEua2luZCAhPT0gXCJob21ld29ya1wiICYmXG4gICAgICBhLnN0YXJ0ZWRBdCA9PT0gbnVsbCAmJlxuICAgICAgZGF0ZUF0KGF0KSA+IGRhdGVBdChhLnN0YXJ0c0F0KVxuICAgICkge1xuICAgICAgcmV0dXJuIFwibWlzc2VkXCI7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIGEua2luZCAhPT0gXCJob21ld29ya1wiICYmXG4gICAgICBhLnN0YXJ0ZWRBdCAhPT0gbnVsbCAmJlxuICAgICAgYS5zdG9wcGVkQXQgPT09IG51bGwgJiZcbiAgICAgIGF0IDwgZXhhbURlYWRsaW5lKGEpXG4gICAgKSB7XG4gICAgICByZXR1cm4gXCJpblByb2dyZXNzXCI7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIGEua2luZCAhPT0gXCJob21ld29ya1wiICYmXG4gICAgICBhLnN0YXJ0ZWRBdCAhPT0gbnVsbCAmJlxuICAgICAgKGEuc3RvcHBlZEF0ICE9PSBudWxsIHx8IGF0ID49IGV4YW1EZWFkbGluZShhKSlcbiAgICApIHtcbiAgICAgIHJldHVybiBcImF3YWl0aW5nU3VibWlzc2lvblwiO1xuICAgIH1cbiAgICBpZiAoYS5raW5kID09PSBcImhvbWV3b3JrXCIgJiYgYXQgPj0gYS5lbmRzQXQpIHJldHVybiBcIm92ZXJkdWVcIjtcbiAgICBpZiAoYXQgPCBhLnN0YXJ0c0F0IHx8IChhLmtpbmQgIT09IFwiaG9tZXdvcmtcIiAmJiBhLnN0YXJ0ZWRBdCA9PT0gbnVsbCkpXG4gICAgICByZXR1cm4gXCJ1cGNvbWluZ1wiO1xuICAgIHJldHVybiBcImF3YWl0aW5nU3VibWlzc2lvblwiO1xuICB9KSgpO1xuICByZXR1cm4ge1xuICAgIGlkOiBhLmlkLFxuICAgIHRpdGxlOiBhLnRpdGxlLFxuICAgIGtpbmQ6IGEua2luZCxcbiAgICBzdGF0dXMsXG4gICAgc3RhcnRzQXQ6IGEuc3RhcnRzQXQsXG4gICAgZW5kc0F0OiBhLmVuZHNBdCxcbiAgICBzdWJtaXNzaW9uSWQ6IHN1Ym1pc3Npb24/LmlkID8/IG51bGwsXG4gICAgc3VibWl0dGVkQXQ6IHN1Ym1pc3Npb24/LnN1Ym1pdHRlZEF0ID8/IG51bGwsXG4gICAgdW5maW5pc2hlZDogc3VibWlzc2lvbiAhPT0gbnVsbCAmJiBzdWJtaXNzaW9uLnVuZmluaXNoZWQsXG4gICAgbGF0ZTpcbiAgICAgIGEua2luZCA9PT0gXCJob21ld29ya1wiICYmXG4gICAgICBzdWJtaXNzaW9uICE9PSBudWxsICYmXG4gICAgICBzdWJtaXNzaW9uLnN1Ym1pdHRlZEF0ID4gYS5lbmRzQXQsXG4gICAgZ3JhZGVJZDogZ3JhZGU/LmlkID8/IG51bGwsXG4gICAgZ3JhZGVkQXQ6IGdyYWRlPy5ncmFkZWRBdCA/PyBudWxsLFxuICAgIHNjb3JlOlxuICAgICAgZ3JhZGUgIT09IG51bGwgJiYgIWdyYWRlLm5lZWRzUmV2aWV3XG4gICAgICAgID8gZ3JhZGUuYXdhcmRzLnJlZHVjZSgobiwgcCkgPT4gbiArIHAuYXdhcmRlZCwgMClcbiAgICAgICAgOiBudWxsLFxuICAgIHRvdGFsOiBhLnF1ZXN0aW9ucy5yZWR1Y2UoXG4gICAgICAobiwgcSkgPT4gbiArIHEuc2NvcmluZy5yZWR1Y2UoKG0sIHApID0+IG0gKyBwLnBvaW50cywgMCksXG4gICAgICAwLFxuICAgICksXG4gICAgbmVlZHNSZXZpZXc6IGdyYWRlICE9PSBudWxsICYmIGdyYWRlLm5lZWRzUmV2aWV3LFxuICB9O1xufVxuXG5mdW5jdGlvbiBleGFtRGVhZGxpbmUoYTogQXNzZXNzbWVudCk6IG51bWJlciB7XG4gIHJldHVybiBhLnN0YXJ0ZWRBdCA9PT0gbnVsbFxuICAgID8gYS5lbmRzQXRcbiAgICA6IGEuc3RhcnRlZEF0ICsgKGEuZW5kc0F0IC0gYS5zdGFydHNBdCk7XG59XG5cbi8qKiBcdTZCQ0ZcdTZCMjFcdTRFQ0VcdTVGNTNcdTUyNERcdThCQzFcdTYzNkVcdTYzQThcdTVCRkNcdUZGMUJcdTZDQTFcdTY3MDlcdTdCMkNcdTRFOENcdTRFRkRcdTRGMUFcdThGQzdcdTY3MUZcdTc2ODRcdTY0NThcdTg5ODFcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBzdW1tYXJpZXMoXG4gIGRhdGE6IEFwcERhdGEsXG4gIGF0OiBudW1iZXIsXG4pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdIHtcbiAgY29uc3QgZSA9IGRhdGEuZWR1Y2F0aW9uO1xuICBjb25zdCBpbmRleCA9IGJ1aWxkU3VtbWFyeUluZGV4KGUpO1xuICBjb25zdCBvdXQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+W10gPSBbXTtcbiAgZm9yIChjb25zdCBwcm9qZWN0IG9mIGRhdGEucHJvamVjdHMuZmlsdGVyKFxuICAgIChwKSA9PlxuICAgICAgZS5wcm9qZWN0cy5zb21lKChzKSA9PiBzLnByb2plY3RJZCA9PT0gcC5pZCkgfHxcbiAgICAgIGUucHJvZ3Jlc3Muc29tZSgocikgPT4gci5wcm9qZWN0SWQgPT09IHAuaWQpLFxuICApKSB7XG4gICAgY29uc3QgcHJvZ3Jlc3MgPSBlLnByb2dyZXNzXG4gICAgICAuZmlsdGVyKChyKSA9PiByLnByb2plY3RJZCA9PT0gcHJvamVjdC5pZClcbiAgICAgIC5zbGljZSgpXG4gICAgICAuc29ydCgoYSwgYikgPT4gYS5yZWNvcmRlZEF0IC0gYi5yZWNvcmRlZEF0KTtcbiAgICBjb25zdCB0b3BpY3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb25zdCBsYXRlc3QgPSBwcm9ncmVzc1xuICAgICAgLnNsaWNlKClcbiAgICAgIC5yZXZlcnNlKClcbiAgICAgIC5maWx0ZXIoKHIpID0+IHtcbiAgICAgICAgaWYgKHRvcGljcy5oYXMoci50b3BpYykpIHJldHVybiBmYWxzZTtcbiAgICAgICAgdG9waWNzLmFkZChyLnRvcGljKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcbiAgICBjb25zdCBhc3Nlc3NtZW50cyA9IGUuYXNzZXNzbWVudHNcbiAgICAgIC5maWx0ZXIoKGEpID0+IGEucHJvamVjdElkID09PSBwcm9qZWN0LmlkKVxuICAgICAgLm1hcCgoYSkgPT4gYXNzZXNzbWVudFN1bW1hcnkoaW5kZXgsIGEsIGF0KSlcbiAgICAgIC5zb3J0KChhLCBiKSA9PiAoYi5zdGFydHNBdCBhcyBudW1iZXIpIC0gKGEuc3RhcnRzQXQgYXMgbnVtYmVyKSk7XG4gICAgY29uc3QgcmV0ZXN0czogUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXSA9IFtdO1xuICAgIGNvbnN0IGdyYWRlcyA9IGUuYXNzZXNzbWVudHNcbiAgICAgIC5maWx0ZXIoKGEpID0+IGEucHJvamVjdElkID09PSBwcm9qZWN0LmlkKVxuICAgICAgLm1hcCgoYSkgPT4gaW5kZXguYXNzZXNzbWVudEdyYWRlcy5nZXQoYS5pZCkpXG4gICAgICAuZmlsdGVyKChnKTogZyBpcyBHcmFkZSA9PiBnICE9PSB1bmRlZmluZWQpO1xuICAgIGZvciAoY29uc3QgZ3JhZGUgb2YgZ3JhZGVzKSB7XG4gICAgICBjb25zdCBhdHRlbXB0cyA9IChpbmRleC5yZXRlc3RzLmdldChncmFkZS5pZCkgPz8gW10pLm1hcCgoYSkgPT5cbiAgICAgICAgYXNzZXNzbWVudFN1bW1hcnkoaW5kZXgsIGEsIGF0KSxcbiAgICAgICk7XG4gICAgICBmb3IgKGNvbnN0IGVycm9yIG9mIGdyYWRlLmVycm9ycykge1xuICAgICAgICByZXRlc3RzLnB1c2goe1xuICAgICAgICAgIGdyYWRlSWQ6IGdyYWRlLmlkLFxuICAgICAgICAgIHF1ZXN0aW9uSWQ6IGVycm9yLnF1ZXN0aW9uSWQsXG4gICAgICAgICAgY2F1c2U6IGVycm9yLmNhdXNlLFxuICAgICAgICAgIGNvbmZpcm1lZDogZXJyb3IuY29uZmlybWVkLFxuICAgICAgICAgIHJldGVzdERhdGU6IGVycm9yLnJldGVzdERhdGUsXG4gICAgICAgICAgbmV4dENoZWNrOiBlcnJvci5uZXh0Q2hlY2ssXG4gICAgICAgICAgY29ycmVjdGlvbkFjY2VwdGVkOiBpbmRleC5hY2NlcHRlZC5oYXMoXG4gICAgICAgICAgICBgJHtncmFkZS5pZH18JHtlcnJvci5xdWVzdGlvbklkfWAsXG4gICAgICAgICAgKSxcbiAgICAgICAgICBhdHRlbXB0cyxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldGVzdHMuc29ydCgoYSwgYikgPT5cbiAgICAgIFN0cmluZyhhW1wicmV0ZXN0RGF0ZVwiXSkubG9jYWxlQ29tcGFyZShTdHJpbmcoYltcInJldGVzdERhdGVcIl0pKSxcbiAgICApO1xuICAgIGNvbnN0IHJlY2VudFRhc2tzID0gZS5jb21wbGV0ZWRUYXNrc1xuICAgICAgLnNsaWNlKClcbiAgICAgIC5yZXZlcnNlKClcbiAgICAgIC5maWx0ZXIoKHQpID0+IHQucHJvamVjdElkID09PSBwcm9qZWN0LmlkKVxuICAgICAgLnNsaWNlKDAsIDUpO1xuICAgIGNvbnN0IGxlc3NvbnMgPSBlLmxlc3NvbnMuZmlsdGVyKChsKSA9PiBsLnByb2plY3RJZCA9PT0gcHJvamVjdC5pZCk7XG4gICAgY29uc3QgbGFzdExlc3NvbiA9IGxlc3NvbnNcbiAgICAgIC5maWx0ZXIoKGwpID0+IGwuYXR0ZW5kZWQpXG4gICAgICAucmVkdWNlPExlc3NvbiB8IG51bGw+KFxuICAgICAgICAoYmVzdCwgbCkgPT4gKGJlc3QgPT09IG51bGwgfHwgbC5zdGFydHNBdCA+IGJlc3Quc3RhcnRzQXQgPyBsIDogYmVzdCksXG4gICAgICAgIG51bGwsXG4gICAgICApO1xuICAgIGNvbnN0IGxhdGVzdFJldmlldyA9IGUucmV2aWV3c1xuICAgICAgLmZpbHRlcigocikgPT4gci5wcm9qZWN0SWQgPT09IHByb2plY3QuaWQpXG4gICAgICAucmVkdWNlPFJldmlldyB8IG51bGw+KFxuICAgICAgICAoYmVzdCwgcikgPT4gKGJlc3QgPT09IG51bGwgfHwgci5kYXRlID4gYmVzdC5kYXRlID8gciA6IGJlc3QpLFxuICAgICAgICBudWxsLFxuICAgICAgKTtcbiAgICBjb25zdCByZXZpZXdUaW1lID1cbiAgICAgIGxhdGVzdFJldmlldyA9PT0gbnVsbCA/IG51bGwgOiBhdExvY2FsRGF0ZVN0cmluZyhsYXRlc3RSZXZpZXcuZGF0ZSk7XG4gICAgY29uc3QgdXBkYXRlZCA9IE1hdGgubWF4KFxuICAgICAgLi4uW1xuICAgICAgICAuLi5sYXRlc3QubWFwKChyKSA9PiByLnJlY29yZGVkQXQpLFxuICAgICAgICAuLi5yZWNlbnRUYXNrcy5tYXAoKHIpID0+IHIuY29tcGxldGVkQXQpLFxuICAgICAgICAuLi4obGFzdExlc3NvbiAhPT0gbnVsbCA/IFtsYXN0TGVzc29uLnN0YXJ0c0F0XSA6IFtdKSxcbiAgICAgICAgLi4uKHJldmlld1RpbWUgIT09IG51bGwgPyBbcmV2aWV3VGltZV0gOiBbXSksXG4gICAgICAgIC4uLmFzc2Vzc21lbnRzXG4gICAgICAgICAgLmZpbHRlcigoYSkgPT4gdHlwZW9mIGFbXCJzdWJtaXR0ZWRBdFwiXSA9PT0gXCJudW1iZXJcIilcbiAgICAgICAgICAubWFwKChhKSA9PiBhW1wic3VibWl0dGVkQXRcIl0gYXMgbnVtYmVyKSxcbiAgICAgICAgLi4uYXNzZXNzbWVudHNcbiAgICAgICAgICAuZmlsdGVyKChhKSA9PiB0eXBlb2YgYVtcImdyYWRlZEF0XCJdID09PSBcIm51bWJlclwiKVxuICAgICAgICAgIC5tYXAoKGEpID0+IGFbXCJncmFkZWRBdFwiXSBhcyBudW1iZXIpLFxuICAgICAgICAuLi5lLmNvcnJlY3Rpb25zXG4gICAgICAgICAgLmZpbHRlcigoYykgPT4gYXNzZXNzbWVudHMuc29tZSgoYSkgPT4gYVtcImdyYWRlSWRcIl0gPT09IGMuZ3JhZGVJZCkpXG4gICAgICAgICAgLm1hcCgoYykgPT4gYy5yZXZpZXdlZEF0ID8/IGMuc3VibWl0dGVkQXQpLFxuICAgICAgXS5maWx0ZXIoKG4pID0+IHR5cGVvZiBuID09PSBcIm51bWJlclwiKSxcbiAgICAgIC1JbmZpbml0eSxcbiAgICApO1xuICAgIGNvbnN0IHRhc2tJZHMgPSBuZXcgU2V0PHN0cmluZz4oW1xuICAgICAgLi4uZGF0YS50YXNrcy5maWx0ZXIoKHQpID0+IHQucHJvamVjdElkID09PSBwcm9qZWN0LmlkKS5tYXAoKHQpID0+IHQuaWQpLFxuICAgICAgLi4uZS5jb21wbGV0ZWRUYXNrc1xuICAgICAgICAuZmlsdGVyKCh0KSA9PiB0LnByb2plY3RJZCA9PT0gcHJvamVjdC5pZClcbiAgICAgICAgLm1hcCgodCkgPT4gdC5pZCksXG4gICAgXSk7XG4gICAgY29uc3QgYWN0dWFsU2Vjb25kcyA9IGRhdGEuc2Vzc2lvbnNcbiAgICAgIC5maWx0ZXIoXG4gICAgICAgIChzKSA9PlxuICAgICAgICAgIHMuc291cmNlID09PSBcInRpbWVyXCIgJiZcbiAgICAgICAgICBzLmVuZGVkQXQgPj0gYXQgLSA3ICogODY0MDAgJiZcbiAgICAgICAgICBzLmVuZGVkQXQgPD0gYXQgJiZcbiAgICAgICAgICBzLnRhc2tJZCAhPT0gbnVsbCAmJlxuICAgICAgICAgIHRhc2tJZHMuaGFzKHMudGFza0lkKSxcbiAgICAgIClcbiAgICAgIC5yZWR1Y2UoKG4sIHMpID0+IG4gKyBzLmR1cmF0aW9uU2VjcywgMCk7XG4gICAgY29uc3QgYXNzZXNzbWVudENvdW50ID0gYXNzZXNzbWVudHMubGVuZ3RoO1xuICAgIGNvbnN0IHJldGVzdENvdW50ID0gcmV0ZXN0cy5sZW5ndGg7XG4gICAgb3V0LnB1c2goe1xuICAgICAgcHJvamVjdElkOiBwcm9qZWN0LmlkLFxuICAgICAgcHJvamVjdE5hbWU6IHByb2plY3QubmFtZSxcbiAgICAgIHVwZGF0ZWRBdDogTnVtYmVyLmlzRmluaXRlKHVwZGF0ZWQpID8gdXBkYXRlZCA6IG51bGwsXG4gICAgICBwcm9ncmVzczogbGF0ZXN0LnNsaWNlKDAsIDEyKSxcbiAgICAgIHByb2dyZXNzQ291bnQ6IGUucHJvZ3Jlc3MuZmlsdGVyKChyKSA9PiByLnByb2plY3RJZCA9PT0gcHJvamVjdC5pZClcbiAgICAgICAgLmxlbmd0aCxcbiAgICAgIHJlY2VudENvbXBsZXRlZFRhc2tzOiByZWNlbnRUYXNrcyxcbiAgICAgIGxhc3RBdHRlbmRlZExlc3NvbjpcbiAgICAgICAgbGFzdExlc3NvbiA9PT0gbnVsbFxuICAgICAgICAgID8gbnVsbFxuICAgICAgICAgIDoge1xuICAgICAgICAgICAgICBpZDogbGFzdExlc3Nvbi5pZCxcbiAgICAgICAgICAgICAgdGl0bGU6IGxhc3RMZXNzb24udGl0bGUsXG4gICAgICAgICAgICAgIHByb2dyZXNzOiBsYXN0TGVzc29uLnByb2dyZXNzLFxuICAgICAgICAgICAgICBzdGF0ZTogbGFzdExlc3Nvbi5zdGF0ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICBsZXNzb25zOiB7XG4gICAgICAgIHBsYW5uZWQ6IGxlc3NvbnMuZmlsdGVyKChsKSA9PiBsLnN0YXRlID09PSBcInBsYW5uZWRcIikubGVuZ3RoLFxuICAgICAgICBhdHRlbmRlZDogbGVzc29ucy5maWx0ZXIoKGwpID0+IGwuYXR0ZW5kZWQpLmxlbmd0aCxcbiAgICAgICAgbWlzc2VkOiBsZXNzb25zLmZpbHRlcigobCkgPT4gbC5zdGF0ZSA9PT0gXCJtaXNzZWRcIikubGVuZ3RoLFxuICAgICAgfSxcbiAgICAgIGFjdHVhbEZvY3VzU2Vjb25kczdkOiBhY3R1YWxTZWNvbmRzLFxuICAgICAgYXNzZXNzbWVudHM6IGFzc2Vzc21lbnRzLnNsaWNlKDAsIDIwKSxcbiAgICAgIGFzc2Vzc21lbnRDb3VudCxcbiAgICAgIHJldGVzdHM6IHJldGVzdHMuc2xpY2UoMCwgMjApLFxuICAgICAgcmV0ZXN0Q291bnQsXG4gICAgICBsYXRlc3RSZXZpZXcsXG4gICAgICBwZW5kaW5nRXZlbnRzOiBlLmV2ZW50cy5maWx0ZXIoXG4gICAgICAgIChyKSA9PiByLnByb2plY3RJZCA9PT0gcHJvamVjdC5pZCAmJiByLnN0YXRlICE9PSBcImRvbmVcIixcbiAgICAgICkubGVuZ3RoLFxuICAgICAgbm90ZTogXCJcdThCQTFcdTY1RjZcdTRFMEVcdTRFRkJcdTUyQTFcdTVCOENcdTYyMTBcdTUzRUFcdThCRjRcdTY2MEVcdTYyOTVcdTUxNjVcdTYyMTZcdTgxRUFcdTYyQTVcdTVCOENcdTYyMTBcdUZGMUJcdTYzOENcdTYzRTFcdTk4N0JcdTY3RTVcdTc3MEJcdTdCNTRcdTUzNzdcdTMwMDFcdTYyNzlcdTY1MzlcdTRFMEVcdTcyRUNcdTdBQ0JcdTU5MERcdTZENEJcdTMwMDJcdTdBN0FcdThCQjBcdTVGNTVcdTg4NjhcdTc5M0FcdTY3MkFcdTc3RTVcdTMwMDJcIixcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuIiwgIi8vISBcdTY1NTlcdTVCNjZcdTVCOUVcdTRGNTNcdTMwMDFcdTYzMDFcdTRFNDVcdTUzMTZcdTRFOEJcdTRFRjZcdTMwMDFcdThENDRcdTZFOTBcdTVGMTVcdTc1MjhcdTRFMEVcdTUzODZcdTUzRjJcdTRGRERcdTYyQTRcdTMwMDJcbi8vISBcdTVCRjlcdTVFOTQgY3JhdGVzL2NvcmUvc3JjL2VkdWNhdGlvbi5yc1x1MzAwMlxuXG5pbXBvcnQgeyBBcHBFcnJvciwgZW5zdXJlIH0gZnJvbSBcIi4vZXJyb3JzXCI7XG5pbXBvcnQge1xuICBhc0FycmF5LFxuICBhc0Jvb2wsXG4gIGFzSW50LFxuICBhc09wdCxcbiAgYXNTdHIsXG4gIGZpZWxkLFxuICBpc09iamVjdCxcbiAgb25lT2YsXG4gIHJlamVjdFVua25vd24sXG4gIHJlcXVpcmVkRmllbGQsXG59IGZyb20gXCIuL2pzb25cIjtcbmltcG9ydCB0eXBlIHtcbiAgQXNzZXNzbWVudCxcbiAgQXNzZXNzbWVudEtpbmQsXG4gIENvcnJlY3Rpb24sXG4gIEVycm9yQW5hbHlzaXMsXG4gIEdyYWRlLFxuICBMZXNzb24sXG4gIExlc3NvblN0YXRlLFxuICBNaWxlc3RvbmUsXG4gIFBvaW50QXdhcmQsXG4gIFByb2dyZXNzUmVjb3JkLFxuICBQcm9ncmVzc1NvdXJjZSxcbiAgUHJvamVjdFN0dWR5LFxuICBRdWVzdGlvbixcbiAgUXVlc3Rpb25UaW1lLFxuICBSZXNvdXJjZSxcbiAgUmVzb3VyY2VLaW5kLFxuICBSZXZpZXcsXG4gIFNjb3JpbmdQb2ludCxcbiAgU2VtZXN0ZXIsXG4gIFN1Ym1pc3Npb24sXG4gIFRlYWNoaW5nRXZlbnQsXG59IGZyb20gXCIuL21vZGVsXCI7XG5pbXBvcnQgdHlwZSB7IEFwcERhdGEgfSBmcm9tIFwiLi9saWJcIjtcbmltcG9ydCB0eXBlIHsgQ29tcGxldGVkU3R1ZHlUYXNrLCBUYXNrIH0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7XG4gIGRheXNCZXR3ZWVuLFxuICBkYXRlQXQsXG4gIGxvY2FsRGF0ZU9mLFxuICBtaW51dGVzT2YsXG4gIHBhcnNlRGF0ZSxcbiAgdmFsaWREYXRlLFxuICB3ZWVrZGF5TW9uZGF5LFxufSBmcm9tIFwiLi90aW1lXCI7XG5pbXBvcnQge1xuICBwYXJzZUNvbXBsZXRlZFN0dWR5VGFzayxcbiAgc2VyaWFsaXplQ29tcGxldGVkU3R1ZHlUYXNrLFxuICB2YWxpZGF0ZUxlYXJuaW5nLFxuICB2YWxpZGF0ZUxlYXJuaW5nVHJhbnNpdGlvbixcbn0gZnJvbSBcIi4vbGVhcm5pbmdcIjtcbmltcG9ydCB7IG92ZXJsYXBNaW51dGVzIGFzIG92ZXJsYXBNaW51dGVzT2ZCbG9jayB9IGZyb20gXCIuL2Jsb2Nrc1wiO1xuXG4vLyAtLS0tLS0tLS0tIFx1NTQ3RFx1NEVFNCAtLS0tLS0tLS0tXG5cbmV4cG9ydCB0eXBlIENvbW1hbmQgPVxuICB8IHsgb3A6IFwic2F2ZVByb2plY3RcIjsgcHJvamVjdDogUHJvamVjdFN0dWR5IH1cbiAgfCB7IG9wOiBcInNhdmVSZXNvdXJjZVwiOyByZXNvdXJjZTogUmVzb3VyY2UgfVxuICB8IHsgb3A6IFwic2F2ZVJlc291cmNlc1wiOyByZXNvdXJjZXM6IFJlc291cmNlW10gfVxuICB8IHsgb3A6IFwicmVtb3ZlUmVzb3VyY2VzXCI7IGlkczogc3RyaW5nW10gfVxuICB8IHsgb3A6IFwic2F2ZVNlbWVzdGVyXCI7IHNlbWVzdGVyOiBTZW1lc3RlciB9XG4gIHwgeyBvcDogXCJzYXZlTGVzc29uXCI7IGxlc3NvbjogTGVzc29uIH1cbiAgfCB7IG9wOiBcInNldExlc3NvblJlc291cmNlc1wiOyBpZDogc3RyaW5nOyByZXNvdXJjZUlkczogc3RyaW5nW10gfVxuICB8IHsgb3A6IFwiYXR0ZW5kTGVzc29uXCI7IGlkOiBzdHJpbmc7IHByb2dyZXNzOiBzdHJpbmcgfVxuICB8IHsgb3A6IFwicHVibGlzaEFzc2Vzc21lbnRcIjsgYXNzZXNzbWVudDogQXNzZXNzbWVudCB9XG4gIHwgeyBvcDogXCJjb25maXJtUHJpbnRlZFwiOyBpZDogc3RyaW5nIH1cbiAgfCB7IG9wOiBcInN0YXJ0RXhhbVwiOyBpZDogc3RyaW5nIH1cbiAgfCB7IG9wOiBcImVuZEV4YW1cIjsgaWQ6IHN0cmluZyB9XG4gIHwgeyBvcDogXCJzdWJtaXRcIjsgc3VibWlzc2lvbjogU3VibWlzc2lvbiB9XG4gIHwgeyBvcDogXCJyZWNvcmRRdWVzdGlvblRpbWVzXCI7IGlkOiBzdHJpbmc7IHF1ZXN0aW9uVGltZXM6IFF1ZXN0aW9uVGltZVtdIH1cbiAgfCB7IG9wOiBcImdyYWRlXCI7IGdyYWRlOiBHcmFkZSB9XG4gIHwgeyBvcDogXCJzYXZlUmV2aWV3XCI7IHJldmlldzogUmV2aWV3IH1cbiAgfCB7IG9wOiBcImNsYWltRXZlbnRcIjsgaWQ6IHN0cmluZyB9XG4gIHwgeyBvcDogXCJmaW5pc2hFdmVudFwiOyBpZDogc3RyaW5nIH1cbiAgfCB7IG9wOiBcInJldHJ5RXZlbnRcIjsgaWQ6IHN0cmluZyB9XG4gIHwgeyBvcDogXCJyZWNvcmRQcm9ncmVzc1wiOyByZWNvcmQ6IFByb2dyZXNzUmVjb3JkIH1cbiAgfCB7IG9wOiBcImNvbmZpcm1Qcm9ncmVzc1wiOyBpZDogc3RyaW5nIH1cbiAgfCB7IG9wOiBcInN1Ym1pdENvcnJlY3Rpb25cIjsgY29ycmVjdGlvbjogQ29ycmVjdGlvbiB9XG4gIHwgeyBvcDogXCJyZXZpZXdDb3JyZWN0aW9uXCI7IGlkOiBzdHJpbmc7IGFjY2VwdGVkOiBib29sZWFuOyBmZWVkYmFjazogc3RyaW5nIH07XG5cbmNvbnN0IENPTU1BTkRfS0VZUzogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+ID0ge1xuICBzYXZlUHJvamVjdDogW1wib3BcIiwgXCJwcm9qZWN0XCJdLFxuICBzYXZlUmVzb3VyY2U6IFtcIm9wXCIsIFwicmVzb3VyY2VcIl0sXG4gIHNhdmVSZXNvdXJjZXM6IFtcIm9wXCIsIFwicmVzb3VyY2VzXCJdLFxuICByZW1vdmVSZXNvdXJjZXM6IFtcIm9wXCIsIFwiaWRzXCJdLFxuICBzYXZlU2VtZXN0ZXI6IFtcIm9wXCIsIFwic2VtZXN0ZXJcIl0sXG4gIHNhdmVMZXNzb246IFtcIm9wXCIsIFwibGVzc29uXCJdLFxuICBzZXRMZXNzb25SZXNvdXJjZXM6IFtcIm9wXCIsIFwiaWRcIiwgXCJyZXNvdXJjZUlkc1wiXSxcbiAgYXR0ZW5kTGVzc29uOiBbXCJvcFwiLCBcImlkXCIsIFwicHJvZ3Jlc3NcIl0sXG4gIHB1Ymxpc2hBc3Nlc3NtZW50OiBbXCJvcFwiLCBcImFzc2Vzc21lbnRcIl0sXG4gIGNvbmZpcm1QcmludGVkOiBbXCJvcFwiLCBcImlkXCJdLFxuICBzdGFydEV4YW06IFtcIm9wXCIsIFwiaWRcIl0sXG4gIGVuZEV4YW06IFtcIm9wXCIsIFwiaWRcIl0sXG4gIHN1Ym1pdDogW1wib3BcIiwgXCJzdWJtaXNzaW9uXCJdLFxuICByZWNvcmRRdWVzdGlvblRpbWVzOiBbXCJvcFwiLCBcImlkXCIsIFwicXVlc3Rpb25UaW1lc1wiXSxcbiAgZ3JhZGU6IFtcIm9wXCIsIFwiZ3JhZGVcIl0sXG4gIHNhdmVSZXZpZXc6IFtcIm9wXCIsIFwicmV2aWV3XCJdLFxuICBjbGFpbUV2ZW50OiBbXCJvcFwiLCBcImlkXCJdLFxuICBmaW5pc2hFdmVudDogW1wib3BcIiwgXCJpZFwiXSxcbiAgcmV0cnlFdmVudDogW1wib3BcIiwgXCJpZFwiXSxcbiAgcmVjb3JkUHJvZ3Jlc3M6IFtcIm9wXCIsIFwicmVjb3JkXCJdLFxuICBjb25maXJtUHJvZ3Jlc3M6IFtcIm9wXCIsIFwiaWRcIl0sXG4gIHN1Ym1pdENvcnJlY3Rpb246IFtcIm9wXCIsIFwiY29ycmVjdGlvblwiXSxcbiAgcmV2aWV3Q29ycmVjdGlvbjogW1wib3BcIiwgXCJpZFwiLCBcImFjY2VwdGVkXCIsIFwiZmVlZGJhY2tcIl0sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb21tYW5kKHJhdzogdW5rbm93bik6IENvbW1hbmQge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgY29uc3Qgb3AgPSBvbmVPZihcbiAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJvcFwiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCAodikgPT4gdiksXG4gICAgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTQgb3BcIixcbiAgICBPYmplY3Qua2V5cyhDT01NQU5EX0tFWVMpLFxuICApO1xuICByZWplY3RVbmtub3duKHJhdywgQ09NTUFORF9LRVlTW29wXSEsIFwiXHU2NTU5XHU1QjY2XHU1NDdEXHU0RUU0XCIpO1xuICBzd2l0Y2ggKG9wKSB7XG4gICAgY2FzZSBcInNhdmVQcm9qZWN0XCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvcCxcbiAgICAgICAgcHJvamVjdDogcGFyc2VQcm9qZWN0U3R1ZHkoXG4gICAgICAgICAgcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvamVjdFwiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCAodikgPT4gdiksXG4gICAgICAgICksXG4gICAgICB9O1xuICAgIGNhc2UgXCJzYXZlUmVzb3VyY2VcIjpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG9wLFxuICAgICAgICByZXNvdXJjZTogcGFyc2VSZXNvdXJjZShcbiAgICAgICAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJyZXNvdXJjZVwiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCAodikgPT4gdiksXG4gICAgICAgICksXG4gICAgICB9O1xuICAgIGNhc2UgXCJzYXZlUmVzb3VyY2VzXCI6IHtcbiAgICAgIGNvbnN0IGxpc3QgPSBhc0FycmF5KFxuICAgICAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJyZXNvdXJjZXNcIiwgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcIiwgKHYpID0+IHYpLFxuICAgICAgICBcInJlc291cmNlc1wiLFxuICAgICAgKTtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgbGlzdC5sZW5ndGggPiAwICYmIGxpc3QubGVuZ3RoIDw9IDUwMDAsXG4gICAgICAgIFwiXHU2Mjc5XHU5MUNGXHU3NjdCXHU4QkIwXHU5NzAwXHU4OTgxIDFcdTIwMTM1MDAwIFx1Njc2MVx1OEQ0NFx1NkU5MFwiLFxuICAgICAgKTtcbiAgICAgIHJldHVybiB7IG9wLCByZXNvdXJjZXM6IGxpc3QubWFwKChpdGVtKSA9PiBwYXJzZVJlc291cmNlKGl0ZW0pKSB9O1xuICAgIH1cbiAgICBjYXNlIFwicmVtb3ZlUmVzb3VyY2VzXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvcCxcbiAgICAgICAgaWRzOiBhc0FycmF5KFxuICAgICAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcImlkc1wiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCAodikgPT4gdiksXG4gICAgICAgICAgXCJpZHNcIixcbiAgICAgICAgKS5tYXAoKHgpID0+IGFzU3RyKHgsIFwiXHU4RDQ0XHU2RTkwIElEXCIpKSxcbiAgICAgIH07XG4gICAgY2FzZSBcInNhdmVTZW1lc3RlclwiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb3AsXG4gICAgICAgIHNlbWVzdGVyOiBwYXJzZVNlbWVzdGVyKFxuICAgICAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcInNlbWVzdGVyXCIsIFwiXHU2NTU5XHU1QjY2XHU1NDdEXHU0RUU0XCIsICh2KSA9PiB2KSxcbiAgICAgICAgKSxcbiAgICAgIH07XG4gICAgY2FzZSBcInNhdmVMZXNzb25cIjpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG9wLFxuICAgICAgICBsZXNzb246IHBhcnNlTGVzc29uKHJlcXVpcmVkRmllbGQocmF3LCBcImxlc3NvblwiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCAodikgPT4gdikpLFxuICAgICAgfTtcbiAgICBjYXNlIFwic2V0TGVzc29uUmVzb3VyY2VzXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvcCxcbiAgICAgICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiXHU2NTU5XHU1QjY2XHU1NDdEXHU0RUU0XCIsIGFzU3RyKSxcbiAgICAgICAgcmVzb3VyY2VJZHM6IGFzQXJyYXkoXG4gICAgICAgICAgcmVxdWlyZWRGaWVsZChyYXcsIFwicmVzb3VyY2VJZHNcIiwgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcIiwgKHYpID0+IHYpLFxuICAgICAgICAgIFwicmVzb3VyY2VJZHNcIixcbiAgICAgICAgKS5tYXAoKHgpID0+IGFzU3RyKHgsIFwiXHU4RDQ0XHU2RTkwIElEXCIpKSxcbiAgICAgIH07XG4gICAgY2FzZSBcImF0dGVuZExlc3NvblwiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb3AsXG4gICAgICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCBhc1N0ciksXG4gICAgICAgIHByb2dyZXNzOiByZXF1aXJlZEZpZWxkKHJhdywgXCJwcm9ncmVzc1wiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCBhc1N0ciksXG4gICAgICB9O1xuICAgIGNhc2UgXCJwdWJsaXNoQXNzZXNzbWVudFwiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb3AsXG4gICAgICAgIGFzc2Vzc21lbnQ6IHBhcnNlQXNzZXNzbWVudChcbiAgICAgICAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJhc3Nlc3NtZW50XCIsIFwiXHU2NTU5XHU1QjY2XHU1NDdEXHU0RUU0XCIsICh2KSA9PiB2KSxcbiAgICAgICAgKSxcbiAgICAgIH07XG4gICAgY2FzZSBcImNvbmZpcm1QcmludGVkXCI6XG4gICAgY2FzZSBcInN0YXJ0RXhhbVwiOlxuICAgIGNhc2UgXCJlbmRFeGFtXCI6XG4gICAgY2FzZSBcImNsYWltRXZlbnRcIjpcbiAgICBjYXNlIFwiZmluaXNoRXZlbnRcIjpcbiAgICBjYXNlIFwicmV0cnlFdmVudFwiOlxuICAgIGNhc2UgXCJjb25maXJtUHJvZ3Jlc3NcIjpcbiAgICAgIHJldHVybiB7IG9wLCBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcIiwgYXNTdHIpIH07XG4gICAgY2FzZSBcInN1Ym1pdFwiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb3AsXG4gICAgICAgIHN1Ym1pc3Npb246IHBhcnNlU3VibWlzc2lvbihcbiAgICAgICAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJzdWJtaXNzaW9uXCIsIFwiXHU2NTU5XHU1QjY2XHU1NDdEXHU0RUU0XCIsICh2KSA9PiB2KSxcbiAgICAgICAgKSxcbiAgICAgIH07XG4gICAgY2FzZSBcInJlY29yZFF1ZXN0aW9uVGltZXNcIjpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG9wLFxuICAgICAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcIiwgYXNTdHIpLFxuICAgICAgICBxdWVzdGlvblRpbWVzOiBhc0FycmF5KFxuICAgICAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcInF1ZXN0aW9uVGltZXNcIiwgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcIiwgKHYpID0+IHYpLFxuICAgICAgICAgIFwicXVlc3Rpb25UaW1lc1wiLFxuICAgICAgICApLm1hcChwYXJzZVF1ZXN0aW9uVGltZSksXG4gICAgICB9O1xuICAgIGNhc2UgXCJncmFkZVwiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb3AsXG4gICAgICAgIGdyYWRlOiBwYXJzZUdyYWRlKHJlcXVpcmVkRmllbGQocmF3LCBcImdyYWRlXCIsIFwiXHU2NTU5XHU1QjY2XHU1NDdEXHU0RUU0XCIsICh2KSA9PiB2KSksXG4gICAgICB9O1xuICAgIGNhc2UgXCJzYXZlUmV2aWV3XCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvcCxcbiAgICAgICAgcmV2aWV3OiBwYXJzZVJldmlldyhyZXF1aXJlZEZpZWxkKHJhdywgXCJyZXZpZXdcIiwgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcIiwgKHYpID0+IHYpKSxcbiAgICAgIH07XG4gICAgY2FzZSBcInJlY29yZFByb2dyZXNzXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvcCxcbiAgICAgICAgcmVjb3JkOiBwYXJzZVByb2dyZXNzUmVjb3JkKFxuICAgICAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcInJlY29yZFwiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCAodikgPT4gdiksXG4gICAgICAgICksXG4gICAgICB9O1xuICAgIGNhc2UgXCJzdWJtaXRDb3JyZWN0aW9uXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvcCxcbiAgICAgICAgY29ycmVjdGlvbjogcGFyc2VDb3JyZWN0aW9uKFxuICAgICAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcImNvcnJlY3Rpb25cIiwgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcIiwgKHYpID0+IHYpLFxuICAgICAgICApLFxuICAgICAgfTtcbiAgICBjYXNlIFwicmV2aWV3Q29ycmVjdGlvblwiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb3AsXG4gICAgICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCBhc1N0ciksXG4gICAgICAgIGFjY2VwdGVkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJhY2NlcHRlZFwiLCBcIlx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFwiLCBhc0Jvb2wpLFxuICAgICAgICBmZWVkYmFjazogcmVxdWlyZWRGaWVsZChyYXcsIFwiZmVlZGJhY2tcIiwgXCJcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcIiwgYXNTdHIpLFxuICAgICAgfTtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKGBcdTY1NTlcdTVCNjZcdTU0N0RcdTRFRTRcdTUzRDZcdTUwM0NcdTY1RTBcdTY1NDhcdUZGMUEke29wfWApO1xuICB9XG59XG5cbi8qKiBcdTUyQTlcdTYyNEJcdTRFMTNcdTVDNUVcdTU0N0RcdTRFRTRcdUZGMUFcdThCRkVcdTdBMEJcdTMwMDFcdTRGNUNcdTRFMUFcdTMwMDFcdThCRDVcdTUzNzdcdTU0OENcdTYyNzlcdTY1MzlcdTUzRUFcdTgwRkRcdTc1MzFcdTVCNjZcdTRFNjBcdTUyQTlcdTYyNEJcdTc1MUZcdTYyMTBcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3Npc3RhbnRPbmx5KGNvbW1hbmQ6IENvbW1hbmQpOiBib29sZWFuIHtcbiAgcmV0dXJuIFtcbiAgICBcInNhdmVTZW1lc3RlclwiLFxuICAgIFwic2F2ZUxlc3NvblwiLFxuICAgIFwicHVibGlzaEFzc2Vzc21lbnRcIixcbiAgICBcImdyYWRlXCIsXG4gICAgXCJyZWNvcmRRdWVzdGlvblRpbWVzXCIsXG4gICAgXCJzYXZlUmV2aWV3XCIsXG4gICAgXCJmaW5pc2hFdmVudFwiLFxuICAgIFwiY2xhaW1FdmVudFwiLFxuICAgIFwicmV2aWV3Q29ycmVjdGlvblwiLFxuICBdLmluY2x1ZGVzKGNvbW1hbmQub3ApO1xufVxuXG4vLyAtLS0tLS0tLS0tIFx1NUI5RVx1NEY1M1x1ODlFM1x1Njc5MC9cdTVFOEZcdTUyMTdcdTUzMTYgLS0tLS0tLS0tLVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQcm9qZWN0U3R1ZHkocmF3OiB1bmtub3duKTogUHJvamVjdFN0dWR5IHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTY1NTlcdTVCNjZcdTk4NzlcdTc2RUVcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24oXG4gICAgcmF3LFxuICAgIFtcbiAgICAgIFwicHJvamVjdElkXCIsXG4gICAgICBcImRpcmVjdG9yeVwiLFxuICAgICAgXCJleGFtTW9kZVwiLFxuICAgICAgXCJ2aXNpb25JZFwiLFxuICAgICAgXCJ0YXJnZXRcIixcbiAgICAgIFwiZXhhbURhdGVcIixcbiAgICAgIFwic3lsbGFidXNJZFwiLFxuICAgICAgXCJwYXN0UGFwZXJJZHNcIixcbiAgICAgIFwibW9ja1BhcGVySWRzXCIsXG4gICAgXSxcbiAgICBcIlx1NjU1OVx1NUI2Nlx1OTg3OVx1NzZFRVwiLFxuICApO1xuICByZXR1cm4ge1xuICAgIHByb2plY3RJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvamVjdElkXCIsIFwiXHU2NTU5XHU1QjY2XHU5ODc5XHU3NkVFXCIsIGFzU3RyKSxcbiAgICBkaXJlY3Rvcnk6IHJlcXVpcmVkRmllbGQocmF3LCBcImRpcmVjdG9yeVwiLCBcIlx1NjU1OVx1NUI2Nlx1OTg3OVx1NzZFRVwiLCBhc1N0ciksXG4gICAgZXhhbU1vZGU6IHJlcXVpcmVkRmllbGQocmF3LCBcImV4YW1Nb2RlXCIsIFwiXHU2NTU5XHU1QjY2XHU5ODc5XHU3NkVFXCIsIGFzQm9vbCksXG4gICAgdmlzaW9uSWQ6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJ2aXNpb25JZFwiLFxuICAgICAgXCJcdTY1NTlcdTVCNjZcdTk4NzlcdTc2RUVcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcInZpc2lvbklkXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgIHRhcmdldDogcmVxdWlyZWRGaWVsZChyYXcsIFwidGFyZ2V0XCIsIFwiXHU2NTU5XHU1QjY2XHU5ODc5XHU3NkVFXCIsIGFzU3RyKSxcbiAgICBleGFtRGF0ZTogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImV4YW1EYXRlXCIsXG4gICAgICBcIlx1NjU1OVx1NUI2Nlx1OTg3OVx1NzZFRVwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiZXhhbURhdGVcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gICAgc3lsbGFidXNJZDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInN5bGxhYnVzSWRcIixcbiAgICAgIFwiXHU2NTU5XHU1QjY2XHU5ODc5XHU3NkVFXCIsXG4gICAgICAodikgPT4gYXNPcHQodiwgXCJzeWxsYWJ1c0lkXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgIHBhc3RQYXBlcklkczogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInBhc3RQYXBlcklkc1wiLFxuICAgICAgXCJcdTY1NTlcdTVCNjZcdTk4NzlcdTc2RUVcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwicGFzdFBhcGVySWRzXCIpLm1hcCgoeCkgPT4gYXNTdHIoeCwgXCJcdTc3MUZcdTk4OTggSURcIikpLFxuICAgICAgW10sXG4gICAgKSxcbiAgICBtb2NrUGFwZXJJZHM6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJtb2NrUGFwZXJJZHNcIixcbiAgICAgIFwiXHU2NTU5XHU1QjY2XHU5ODc5XHU3NkVFXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcIm1vY2tQYXBlcklkc1wiKS5tYXAoKHgpID0+IGFzU3RyKHgsIFwiXHU2QTIxXHU2MkRGXHU5ODk4IElEXCIpKSxcbiAgICAgIFtdLFxuICAgICksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVQcm9qZWN0U3R1ZHkoXG4gIHA6IFByb2plY3RTdHVkeSxcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBwcm9qZWN0SWQ6IHAucHJvamVjdElkLFxuICAgIGRpcmVjdG9yeTogcC5kaXJlY3RvcnksXG4gICAgZXhhbU1vZGU6IHAuZXhhbU1vZGUsXG4gICAgdmlzaW9uSWQ6IHAudmlzaW9uSWQsXG4gICAgdGFyZ2V0OiBwLnRhcmdldCxcbiAgICBleGFtRGF0ZTogcC5leGFtRGF0ZSxcbiAgICBzeWxsYWJ1c0lkOiBwLnN5bGxhYnVzSWQsXG4gICAgcGFzdFBhcGVySWRzOiBwLnBhc3RQYXBlcklkcyxcbiAgICBtb2NrUGFwZXJJZHM6IHAubW9ja1BhcGVySWRzLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VSZXNvdXJjZShyYXc6IHVua25vd24pOiBSZXNvdXJjZSB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4RDQ0XHU2RTkwXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKFxuICAgIHJhdyxcbiAgICBbXCJpZFwiLCBcInByb2plY3RJZFwiLCBcInRpdGxlXCIsIFwia2luZFwiLCBcInBhdGhcIiwgXCJzb3VyY2VcIiwgXCJlZGl0aW9uXCIsIFwidG9waWNzXCJdLFxuICAgIFwiXHU4RDQ0XHU2RTkwXCIsXG4gICk7XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiXHU4RDQ0XHU2RTkwXCIsIGFzU3RyKSxcbiAgICBwcm9qZWN0SWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInByb2plY3RJZFwiLCBcIlx1OEQ0NFx1NkU5MFwiLCBhc1N0ciksXG4gICAgdGl0bGU6IHJlcXVpcmVkRmllbGQocmF3LCBcInRpdGxlXCIsIFwiXHU4RDQ0XHU2RTkwXCIsIGFzU3RyKSxcbiAgICBraW5kOiBvbmVPZihcbiAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcImtpbmRcIiwgXCJcdThENDRcdTZFOTBcIiwgKHYpID0+IHYpLFxuICAgICAgXCJcdThENDRcdTZFOTAga2luZFwiLFxuICAgICAgW1xuICAgICAgICBcInN5bGxhYnVzXCIsXG4gICAgICAgIFwiY291cnNlXCIsXG4gICAgICAgIFwiYm9va1wiLFxuICAgICAgICBcInBhc3RQYXBlclwiLFxuICAgICAgICBcIm1vY2tQYXBlclwiLFxuICAgICAgICBcInJlZmVyZW5jZVwiLFxuICAgICAgICBcImF0dGFjaG1lbnRcIixcbiAgICAgICAgXCJhbnN3ZXJTaGVldFwiLFxuICAgICAgXSxcbiAgICApIGFzIFJlc291cmNlS2luZCxcbiAgICBwYXRoOiByZXF1aXJlZEZpZWxkKHJhdywgXCJwYXRoXCIsIFwiXHU4RDQ0XHU2RTkwXCIsIGFzU3RyKSxcbiAgICBzb3VyY2U6IHJlcXVpcmVkRmllbGQocmF3LCBcInNvdXJjZVwiLCBcIlx1OEQ0NFx1NkU5MFwiLCBhc1N0ciksXG4gICAgZWRpdGlvbjogcmVxdWlyZWRGaWVsZChyYXcsIFwiZWRpdGlvblwiLCBcIlx1OEQ0NFx1NkU5MFwiLCBhc1N0ciksXG4gICAgdG9waWNzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidG9waWNzXCIsXG4gICAgICBcIlx1OEQ0NFx1NkU5MFwiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJ0b3BpY3NcIikubWFwKCh4KSA9PiBhc1N0cih4LCBcIlx1NzdFNVx1OEJDNlx1NzBCOVwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplUmVzb3VyY2UocjogUmVzb3VyY2UpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7XG4gICAgaWQ6IHIuaWQsXG4gICAgcHJvamVjdElkOiByLnByb2plY3RJZCxcbiAgICB0aXRsZTogci50aXRsZSxcbiAgICBraW5kOiByLmtpbmQsXG4gICAgcGF0aDogci5wYXRoLFxuICAgIHNvdXJjZTogci5zb3VyY2UsXG4gICAgZWRpdGlvbjogci5lZGl0aW9uLFxuICAgIHRvcGljczogci50b3BpY3MsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU1pbGVzdG9uZShyYXc6IHVua25vd24pOiBNaWxlc3RvbmUge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OTYzNlx1NkJCNVx1OEZEQlx1NUVBNlx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihcbiAgICByYXcsXG4gICAgW1wid2Vla1wiLCBcInRvcGljc1wiLCBcInJlc291cmNlSWRzXCIsIFwib2JqZWN0aXZlXCIsIFwibGVzc29uQ291bnRcIl0sXG4gICAgXCJcdTk2MzZcdTZCQjVcdThGREJcdTVFQTZcIixcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICB3ZWVrOiByZXF1aXJlZEZpZWxkKHJhdywgXCJ3ZWVrXCIsIFwiXHU5NjM2XHU2QkI1XHU4RkRCXHU1RUE2XCIsIGFzSW50KSxcbiAgICB0b3BpY3M6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJ0b3BpY3NcIixcbiAgICAgIFwiXHU5NjM2XHU2QkI1XHU4RkRCXHU1RUE2XCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcInRvcGljc1wiKS5tYXAoKHgpID0+IGFzU3RyKHgsIFwiXHU3N0U1XHU4QkM2XHU3MEI5XCIpKSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgcmVzb3VyY2VJZHM6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJyZXNvdXJjZUlkc1wiLFxuICAgICAgXCJcdTk2MzZcdTZCQjVcdThGREJcdTVFQTZcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwicmVzb3VyY2VJZHNcIikubWFwKCh4KSA9PiBhc1N0cih4LCBcIlx1OEQ0NFx1NkU5MCBJRFwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICAgIG9iamVjdGl2ZTogcmVxdWlyZWRGaWVsZChyYXcsIFwib2JqZWN0aXZlXCIsIFwiXHU5NjM2XHU2QkI1XHU4RkRCXHU1RUE2XCIsIGFzU3RyKSxcbiAgICBsZXNzb25Db3VudDogcmVxdWlyZWRGaWVsZChyYXcsIFwibGVzc29uQ291bnRcIiwgXCJcdTk2MzZcdTZCQjVcdThGREJcdTVFQTZcIiwgYXNJbnQpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplTWlsZXN0b25lKG06IE1pbGVzdG9uZSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICB3ZWVrOiBtLndlZWssXG4gICAgdG9waWNzOiBtLnRvcGljcyxcbiAgICByZXNvdXJjZUlkczogbS5yZXNvdXJjZUlkcyxcbiAgICBvYmplY3RpdmU6IG0ub2JqZWN0aXZlLFxuICAgIGxlc3NvbkNvdW50OiBtLmxlc3NvbkNvdW50LFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTZW1lc3RlcihyYXc6IHVua25vd24pOiBTZW1lc3RlciB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU1QjY2XHU2NzFGXHU4QkExXHU1MjEyXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKFxuICAgIHJhdyxcbiAgICBbXG4gICAgICBcImlkXCIsXG4gICAgICBcInByb2plY3RJZFwiLFxuICAgICAgXCJ0aXRsZVwiLFxuICAgICAgXCJzdGFydERhdGVcIixcbiAgICAgIFwiZW5kRGF0ZVwiLFxuICAgICAgXCJyZXZpc2lvblwiLFxuICAgICAgXCJiYXNlbGluZVwiLFxuICAgICAgXCJldmlkZW5jZVwiLFxuICAgICAgXCJyYXRpb25hbGVcIixcbiAgICAgIFwibWlsZXN0b25lc1wiLFxuICAgIF0sXG4gICAgXCJcdTVCNjZcdTY3MUZcdThCQTFcdTUyMTJcIixcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTVCNjZcdTY3MUZcdThCQTFcdTUyMTJcIiwgYXNTdHIpLFxuICAgIHByb2plY3RJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvamVjdElkXCIsIFwiXHU1QjY2XHU2NzFGXHU4QkExXHU1MjEyXCIsIGFzU3RyKSxcbiAgICB0aXRsZTogcmVxdWlyZWRGaWVsZChyYXcsIFwidGl0bGVcIiwgXCJcdTVCNjZcdTY3MUZcdThCQTFcdTUyMTJcIiwgYXNTdHIpLFxuICAgIHN0YXJ0RGF0ZTogcmVxdWlyZWRGaWVsZChyYXcsIFwic3RhcnREYXRlXCIsIFwiXHU1QjY2XHU2NzFGXHU4QkExXHU1MjEyXCIsIGFzU3RyKSxcbiAgICBlbmREYXRlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJlbmREYXRlXCIsIFwiXHU1QjY2XHU2NzFGXHU4QkExXHU1MjEyXCIsIGFzU3RyKSxcbiAgICByZXZpc2lvbjogcmVxdWlyZWRGaWVsZChyYXcsIFwicmV2aXNpb25cIiwgXCJcdTVCNjZcdTY3MUZcdThCQTFcdTUyMTJcIiwgYXNJbnQpLFxuICAgIGJhc2VsaW5lOiByZXF1aXJlZEZpZWxkKHJhdywgXCJiYXNlbGluZVwiLCBcIlx1NUI2Nlx1NjcxRlx1OEJBMVx1NTIxMlwiLCBhc1N0ciksXG4gICAgZXZpZGVuY2U6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJldmlkZW5jZVwiLFxuICAgICAgXCJcdTVCNjZcdTY3MUZcdThCQTFcdTUyMTJcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwiZXZpZGVuY2VcIikubWFwKCh4KSA9PiBhc1N0cih4LCBcIlx1NEY5RFx1NjM2RVwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICAgIHJhdGlvbmFsZTogcmVxdWlyZWRGaWVsZChyYXcsIFwicmF0aW9uYWxlXCIsIFwiXHU1QjY2XHU2NzFGXHU4QkExXHU1MjEyXCIsIGFzU3RyKSxcbiAgICBtaWxlc3RvbmVzOiByZXF1aXJlZEZpZWxkKHJhdywgXCJtaWxlc3RvbmVzXCIsIFwiXHU1QjY2XHU2NzFGXHU4QkExXHU1MjEyXCIsICh2KSA9PlxuICAgICAgYXNBcnJheSh2LCBcIm1pbGVzdG9uZXNcIikubWFwKHBhcnNlTWlsZXN0b25lKSxcbiAgICApLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplU2VtZXN0ZXIoczogU2VtZXN0ZXIpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7XG4gICAgaWQ6IHMuaWQsXG4gICAgcHJvamVjdElkOiBzLnByb2plY3RJZCxcbiAgICB0aXRsZTogcy50aXRsZSxcbiAgICBzdGFydERhdGU6IHMuc3RhcnREYXRlLFxuICAgIGVuZERhdGU6IHMuZW5kRGF0ZSxcbiAgICByZXZpc2lvbjogcy5yZXZpc2lvbixcbiAgICBiYXNlbGluZTogcy5iYXNlbGluZSxcbiAgICBldmlkZW5jZTogcy5ldmlkZW5jZSxcbiAgICByYXRpb25hbGU6IHMucmF0aW9uYWxlLFxuICAgIG1pbGVzdG9uZXM6IHMubWlsZXN0b25lcy5tYXAoc2VyaWFsaXplTWlsZXN0b25lKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTGVzc29uKHJhdzogdW5rbm93bik6IExlc3NvbiB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4QkZFXHU3QTBCXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKFxuICAgIHJhdyxcbiAgICBbXG4gICAgICBcImlkXCIsXG4gICAgICBcInByb2plY3RJZFwiLFxuICAgICAgXCJzZW1lc3RlcklkXCIsXG4gICAgICBcInNlbWVzdGVyUmV2aXNpb25cIixcbiAgICAgIFwidGl0bGVcIixcbiAgICAgIFwidG9waWNzXCIsXG4gICAgICBcInJlc291cmNlSWRzXCIsXG4gICAgICBcInN0YXJ0c0F0XCIsXG4gICAgICBcImVuZHNBdFwiLFxuICAgICAgXCJhaUVuYWJsZWRcIixcbiAgICAgIFwiYXR0ZW5kZWRcIixcbiAgICAgIFwicHJvZ3Jlc3NcIixcbiAgICAgIFwic3RhdGVcIixcbiAgICBdLFxuICAgIFwiXHU4QkZFXHU3QTBCXCIsXG4gICk7XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiXHU4QkZFXHU3QTBCXCIsIGFzU3RyKSxcbiAgICBwcm9qZWN0SWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInByb2plY3RJZFwiLCBcIlx1OEJGRVx1N0EwQlwiLCBhc1N0ciksXG4gICAgc2VtZXN0ZXJJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwic2VtZXN0ZXJJZFwiLCBcIlx1OEJGRVx1N0EwQlwiLCBhc1N0ciksXG4gICAgc2VtZXN0ZXJSZXZpc2lvbjogZmllbGQocmF3LCBcInNlbWVzdGVyUmV2aXNpb25cIiwgXCJcdThCRkVcdTdBMEJcIiwgYXNJbnQsIDEpLFxuICAgIHRpdGxlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJ0aXRsZVwiLCBcIlx1OEJGRVx1N0EwQlwiLCBhc1N0ciksXG4gICAgdG9waWNzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidG9waWNzXCIsXG4gICAgICBcIlx1OEJGRVx1N0EwQlwiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJ0b3BpY3NcIikubWFwKCh4KSA9PiBhc1N0cih4LCBcIlx1NzdFNVx1OEJDNlx1NzBCOVwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICAgIHJlc291cmNlSWRzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwicmVzb3VyY2VJZHNcIixcbiAgICAgIFwiXHU4QkZFXHU3QTBCXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcInJlc291cmNlSWRzXCIpLm1hcCgoeCkgPT4gYXNTdHIoeCwgXCJcdThENDRcdTZFOTAgSURcIikpLFxuICAgICAgW10sXG4gICAgKSxcbiAgICBzdGFydHNBdDogcmVxdWlyZWRGaWVsZChyYXcsIFwic3RhcnRzQXRcIiwgXCJcdThCRkVcdTdBMEJcIiwgYXNJbnQpLFxuICAgIGVuZHNBdDogcmVxdWlyZWRGaWVsZChyYXcsIFwiZW5kc0F0XCIsIFwiXHU4QkZFXHU3QTBCXCIsIGFzSW50KSxcbiAgICBhaUVuYWJsZWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImFpRW5hYmxlZFwiLCBcIlx1OEJGRVx1N0EwQlwiLCBhc0Jvb2wpLFxuICAgIGF0dGVuZGVkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJhdHRlbmRlZFwiLCBcIlx1OEJGRVx1N0EwQlwiLCBhc0Jvb2wpLFxuICAgIHByb2dyZXNzOiByZXF1aXJlZEZpZWxkKHJhdywgXCJwcm9ncmVzc1wiLCBcIlx1OEJGRVx1N0EwQlwiLCBhc1N0ciksXG4gICAgc3RhdGU6IG9uZU9mKFxuICAgICAgcmVxdWlyZWRGaWVsZChyYXcsIFwic3RhdGVcIiwgXCJcdThCRkVcdTdBMEJcIiwgKHYpID0+IHYpLFxuICAgICAgXCJcdThCRkVcdTdBMEIgc3RhdGVcIixcbiAgICAgIFtcInBsYW5uZWRcIiwgXCJhY3RpdmVcIiwgXCJlbmRlZFwiLCBcIm1pc3NlZFwiXSxcbiAgICApIGFzIExlc3NvblN0YXRlLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplTGVzc29uKGw6IExlc3Nvbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogbC5pZCxcbiAgICBwcm9qZWN0SWQ6IGwucHJvamVjdElkLFxuICAgIHNlbWVzdGVySWQ6IGwuc2VtZXN0ZXJJZCxcbiAgICBzZW1lc3RlclJldmlzaW9uOiBsLnNlbWVzdGVyUmV2aXNpb24sXG4gICAgdGl0bGU6IGwudGl0bGUsXG4gICAgdG9waWNzOiBsLnRvcGljcyxcbiAgICByZXNvdXJjZUlkczogbC5yZXNvdXJjZUlkcyxcbiAgICBzdGFydHNBdDogbC5zdGFydHNBdCxcbiAgICBlbmRzQXQ6IGwuZW5kc0F0LFxuICAgIGFpRW5hYmxlZDogbC5haUVuYWJsZWQsXG4gICAgYXR0ZW5kZWQ6IGwuYXR0ZW5kZWQsXG4gICAgcHJvZ3Jlc3M6IGwucHJvZ3Jlc3MsXG4gICAgc3RhdGU6IGwuc3RhdGUsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNjb3JpbmdQb2ludChyYXc6IHVua25vd24pOiBTY29yaW5nUG9pbnQge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJDNFx1NTIwNlx1NzBCOVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIFtcImlkXCIsIFwiZGVzY3JpcHRpb25cIiwgXCJwb2ludHNcIl0sIFwiXHU4QkM0XHU1MjA2XHU3MEI5XCIpO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1OEJDNFx1NTIwNlx1NzBCOVwiLCBhc1N0ciksXG4gICAgZGVzY3JpcHRpb246IHJlcXVpcmVkRmllbGQocmF3LCBcImRlc2NyaXB0aW9uXCIsIFwiXHU4QkM0XHU1MjA2XHU3MEI5XCIsIGFzU3RyKSxcbiAgICBwb2ludHM6IHJlcXVpcmVkRmllbGQocmF3LCBcInBvaW50c1wiLCBcIlx1OEJDNFx1NTIwNlx1NzBCOVwiLCBhc0ludCksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVTY29yaW5nUG9pbnQoXG4gIHA6IFNjb3JpbmdQb2ludCxcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHsgaWQ6IHAuaWQsIGRlc2NyaXB0aW9uOiBwLmRlc2NyaXB0aW9uLCBwb2ludHM6IHAucG9pbnRzIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVF1ZXN0aW9uKHJhdzogdW5rbm93bik6IFF1ZXN0aW9uIHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTk4OThcdTc2RUVcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24oXG4gICAgcmF3LFxuICAgIFtcbiAgICAgIFwiaWRcIixcbiAgICAgIFwicHJvbXB0XCIsXG4gICAgICBcInRvcGljc1wiLFxuICAgICAgXCJzb3VyY2VJZHNcIixcbiAgICAgIFwiZXh0ZW5zaW9uXCIsXG4gICAgICBcImVzdGltYXRlZE1pbnV0ZXNcIixcbiAgICAgIFwiYW5zd2VyXCIsXG4gICAgICBcImFjY2VwdGFibGVBbHRlcm5hdGl2ZXNcIixcbiAgICAgIFwic2NvcmluZ1wiLFxuICAgIF0sXG4gICAgXCJcdTk4OThcdTc2RUVcIixcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTk4OThcdTc2RUVcIiwgYXNTdHIpLFxuICAgIHByb21wdDogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvbXB0XCIsIFwiXHU5ODk4XHU3NkVFXCIsIGFzU3RyKSxcbiAgICB0b3BpY3M6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJ0b3BpY3NcIixcbiAgICAgIFwiXHU5ODk4XHU3NkVFXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcInRvcGljc1wiKS5tYXAoKHgpID0+IGFzU3RyKHgsIFwiXHU3N0U1XHU4QkM2XHU3MEI5XCIpKSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgc291cmNlSWRzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwic291cmNlSWRzXCIsXG4gICAgICBcIlx1OTg5OFx1NzZFRVwiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJzb3VyY2VJZHNcIikubWFwKCh4KSA9PiBhc1N0cih4LCBcIlx1Njc2NVx1NkU5MCBJRFwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICAgIGV4dGVuc2lvbjogcmVxdWlyZWRGaWVsZChyYXcsIFwiZXh0ZW5zaW9uXCIsIFwiXHU5ODk4XHU3NkVFXCIsIGFzQm9vbCksXG4gICAgZXN0aW1hdGVkTWludXRlczogcmVxdWlyZWRGaWVsZChyYXcsIFwiZXN0aW1hdGVkTWludXRlc1wiLCBcIlx1OTg5OFx1NzZFRVwiLCBhc0ludCksXG4gICAgYW5zd2VyOiByZXF1aXJlZEZpZWxkKHJhdywgXCJhbnN3ZXJcIiwgXCJcdTk4OThcdTc2RUVcIiwgYXNTdHIpLFxuICAgIGFjY2VwdGFibGVBbHRlcm5hdGl2ZXM6IHJlcXVpcmVkRmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImFjY2VwdGFibGVBbHRlcm5hdGl2ZXNcIixcbiAgICAgIFwiXHU5ODk4XHU3NkVFXCIsXG4gICAgICBhc1N0cixcbiAgICApLFxuICAgIHNjb3Jpbmc6IHJlcXVpcmVkRmllbGQocmF3LCBcInNjb3JpbmdcIiwgXCJcdTk4OThcdTc2RUVcIiwgKHYpID0+XG4gICAgICBhc0FycmF5KHYsIFwic2NvcmluZ1wiKS5tYXAocGFyc2VTY29yaW5nUG9pbnQpLFxuICAgICksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVRdWVzdGlvbihxOiBRdWVzdGlvbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogcS5pZCxcbiAgICBwcm9tcHQ6IHEucHJvbXB0LFxuICAgIHRvcGljczogcS50b3BpY3MsXG4gICAgc291cmNlSWRzOiBxLnNvdXJjZUlkcyxcbiAgICBleHRlbnNpb246IHEuZXh0ZW5zaW9uLFxuICAgIGVzdGltYXRlZE1pbnV0ZXM6IHEuZXN0aW1hdGVkTWludXRlcyxcbiAgICBhbnN3ZXI6IHEuYW5zd2VyLFxuICAgIGFjY2VwdGFibGVBbHRlcm5hdGl2ZXM6IHEuYWNjZXB0YWJsZUFsdGVybmF0aXZlcyxcbiAgICBzY29yaW5nOiBxLnNjb3JpbmcubWFwKHNlcmlhbGl6ZVNjb3JpbmdQb2ludCksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFzc2Vzc21lbnQocmF3OiB1bmtub3duKTogQXNzZXNzbWVudCB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4QkQ1XHU5ODk4XHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKFxuICAgIHJhdyxcbiAgICBbXG4gICAgICBcImlkXCIsXG4gICAgICBcInByb2plY3RJZFwiLFxuICAgICAgXCJzZW1lc3RlcklkXCIsXG4gICAgICBcInNlbWVzdGVyUmV2aXNpb25cIixcbiAgICAgIFwibGVzc29uSWRcIixcbiAgICAgIFwidGFza0lkXCIsXG4gICAgICBcInJldGVzdE9mR3JhZGVJZFwiLFxuICAgICAgXCJ0aXRsZVwiLFxuICAgICAgXCJraW5kXCIsXG4gICAgICBcInJldmlzaW9uXCIsXG4gICAgICBcInN0YXJ0c0F0XCIsXG4gICAgICBcImVuZHNBdFwiLFxuICAgICAgXCJpbnN0cnVjdGlvbnNcIixcbiAgICAgIFwicmV2aWV3RXZpZGVuY2VcIixcbiAgICAgIFwicmVzb3VyY2VJZHNcIixcbiAgICAgIFwicXVlc3Rpb25zXCIsXG4gICAgICBcInB1Ymxpc2hlZEF0XCIsXG4gICAgICBcInByaW50ZWRBdFwiLFxuICAgICAgXCJzdGFydGVkQXRcIixcbiAgICAgIFwic3RvcHBlZEF0XCIsXG4gICAgXSxcbiAgICBcIlx1OEJENVx1OTg5OFwiLFxuICApO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1OEJENVx1OTg5OFwiLCBhc1N0ciksXG4gICAgcHJvamVjdElkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJwcm9qZWN0SWRcIiwgXCJcdThCRDVcdTk4OThcIiwgYXNTdHIpLFxuICAgIHNlbWVzdGVySWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInNlbWVzdGVySWRcIiwgXCJcdThCRDVcdTk4OThcIiwgYXNTdHIpLFxuICAgIHNlbWVzdGVyUmV2aXNpb246IGZpZWxkKHJhdywgXCJzZW1lc3RlclJldmlzaW9uXCIsIFwiXHU4QkQ1XHU5ODk4XCIsIGFzSW50LCAxKSxcbiAgICBsZXNzb25JZDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImxlc3NvbklkXCIsXG4gICAgICBcIlx1OEJENVx1OTg5OFwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwibGVzc29uSWRcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gICAgdGFza0lkOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidGFza0lkXCIsXG4gICAgICBcIlx1OEJENVx1OTg5OFwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwidGFza0lkXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgIHJldGVzdE9mR3JhZGVJZDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInJldGVzdE9mR3JhZGVJZFwiLFxuICAgICAgXCJcdThCRDVcdTk4OThcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcInJldGVzdE9mR3JhZGVJZFwiLCBhc1N0ciksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgICB0aXRsZTogcmVxdWlyZWRGaWVsZChyYXcsIFwidGl0bGVcIiwgXCJcdThCRDVcdTk4OThcIiwgYXNTdHIpLFxuICAgIGtpbmQ6IG9uZU9mKFxuICAgICAgcmVxdWlyZWRGaWVsZChyYXcsIFwia2luZFwiLCBcIlx1OEJENVx1OTg5OFwiLCAodikgPT4gdiksXG4gICAgICBcIlx1OEJENVx1OTg5OCBraW5kXCIsXG4gICAgICBbXCJob21ld29ya1wiLCBcIndlZWtseUV4YW1cIiwgXCJtb2NrRXhhbVwiLCBcInJldGVzdFwiXSxcbiAgICApIGFzIEFzc2Vzc21lbnRLaW5kLFxuICAgIHJldmlzaW9uOiByZXF1aXJlZEZpZWxkKHJhdywgXCJyZXZpc2lvblwiLCBcIlx1OEJENVx1OTg5OFwiLCBhc0ludCksXG4gICAgc3RhcnRzQXQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInN0YXJ0c0F0XCIsIFwiXHU4QkQ1XHU5ODk4XCIsIGFzSW50KSxcbiAgICBlbmRzQXQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImVuZHNBdFwiLCBcIlx1OEJENVx1OTg5OFwiLCBhc0ludCksXG4gICAgaW5zdHJ1Y3Rpb25zOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpbnN0cnVjdGlvbnNcIiwgXCJcdThCRDVcdTk4OThcIiwgYXNTdHIpLFxuICAgIHJldmlld0V2aWRlbmNlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJyZXZpZXdFdmlkZW5jZVwiLCBcIlx1OEJENVx1OTg5OFwiLCBhc1N0ciksXG4gICAgcmVzb3VyY2VJZHM6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJyZXNvdXJjZUlkc1wiLFxuICAgICAgXCJcdThCRDVcdTk4OThcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwicmVzb3VyY2VJZHNcIikubWFwKCh4KSA9PiBhc1N0cih4LCBcIlx1OEQ0NFx1NjU5OSBJRFwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICAgIHF1ZXN0aW9uczogcmVxdWlyZWRGaWVsZChyYXcsIFwicXVlc3Rpb25zXCIsIFwiXHU4QkQ1XHU5ODk4XCIsICh2KSA9PlxuICAgICAgYXNBcnJheSh2LCBcInF1ZXN0aW9uc1wiKS5tYXAocGFyc2VRdWVzdGlvbiksXG4gICAgKSxcbiAgICBwdWJsaXNoZWRBdDogcmVxdWlyZWRGaWVsZChyYXcsIFwicHVibGlzaGVkQXRcIiwgXCJcdThCRDVcdTk4OThcIiwgYXNJbnQpLFxuICAgIHByaW50ZWRBdDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInByaW50ZWRBdFwiLFxuICAgICAgXCJcdThCRDVcdTk4OThcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcInByaW50ZWRBdFwiLCBhc0ludCksXG4gICAgICBudWxsLFxuICAgICkgYXMgbnVtYmVyIHwgbnVsbCxcbiAgICBzdGFydGVkQXQ6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJzdGFydGVkQXRcIixcbiAgICAgIFwiXHU4QkQ1XHU5ODk4XCIsXG4gICAgICAodikgPT4gYXNPcHQodiwgXCJzdGFydGVkQXRcIiwgYXNJbnQpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIG51bWJlciB8IG51bGwsXG4gICAgc3RvcHBlZEF0OiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwic3RvcHBlZEF0XCIsXG4gICAgICBcIlx1OEJENVx1OTg5OFwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwic3RvcHBlZEF0XCIsIGFzSW50KSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBudW1iZXIgfCBudWxsLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplQXNzZXNzbWVudChhOiBBc3Nlc3NtZW50KTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4ge1xuICAgIGlkOiBhLmlkLFxuICAgIHByb2plY3RJZDogYS5wcm9qZWN0SWQsXG4gICAgc2VtZXN0ZXJJZDogYS5zZW1lc3RlcklkLFxuICAgIHNlbWVzdGVyUmV2aXNpb246IGEuc2VtZXN0ZXJSZXZpc2lvbixcbiAgICBsZXNzb25JZDogYS5sZXNzb25JZCxcbiAgICB0YXNrSWQ6IGEudGFza0lkLFxuICAgIHJldGVzdE9mR3JhZGVJZDogYS5yZXRlc3RPZkdyYWRlSWQsXG4gICAgdGl0bGU6IGEudGl0bGUsXG4gICAga2luZDogYS5raW5kLFxuICAgIHJldmlzaW9uOiBhLnJldmlzaW9uLFxuICAgIHN0YXJ0c0F0OiBhLnN0YXJ0c0F0LFxuICAgIGVuZHNBdDogYS5lbmRzQXQsXG4gICAgaW5zdHJ1Y3Rpb25zOiBhLmluc3RydWN0aW9ucyxcbiAgICByZXZpZXdFdmlkZW5jZTogYS5yZXZpZXdFdmlkZW5jZSxcbiAgICByZXNvdXJjZUlkczogWy4uLmEucmVzb3VyY2VJZHNdLFxuICAgIHF1ZXN0aW9uczogYS5xdWVzdGlvbnMubWFwKHNlcmlhbGl6ZVF1ZXN0aW9uKSxcbiAgICBwdWJsaXNoZWRBdDogYS5wdWJsaXNoZWRBdCxcbiAgICBwcmludGVkQXQ6IGEucHJpbnRlZEF0LFxuICAgIHN0YXJ0ZWRBdDogYS5zdGFydGVkQXQsXG4gICAgc3RvcHBlZEF0OiBhLnN0b3BwZWRBdCxcbiAgfTtcbn1cblxuLyoqIFx1OEJBMVx1NTIxMlx1NTMzQVx1OTVGNFx1NEY5Qlx1NjVGNlx1OTU3Rlx1RkYxQlx1NUI5RVx1OTY0NVx1NUYwMFx1ODAwM1x1OEQ3N1x1OEJBMVx1NjVGNlx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4YW1EZWFkbGluZShhOiBBc3Nlc3NtZW50KTogbnVtYmVyIHtcbiAgcmV0dXJuIGEuc3RhcnRlZEF0ID09PSBudWxsXG4gICAgPyBhLmVuZHNBdFxuICAgIDogYS5zdGFydGVkQXQgKyAoYS5lbmRzQXQgLSBhLnN0YXJ0c0F0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU3VibWlzc2lvbihyYXc6IHVua25vd24pOiBTdWJtaXNzaW9uIHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTYzRDBcdTRFQTRcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24oXG4gICAgcmF3LFxuICAgIFtcbiAgICAgIFwiaWRcIixcbiAgICAgIFwiYXNzZXNzbWVudElkXCIsXG4gICAgICBcInN1Ym1pdHRlZEF0XCIsXG4gICAgICBcInJlc291cmNlSWRzXCIsXG4gICAgICBcImFuc3dlcnNcIixcbiAgICAgIFwidW5maW5pc2hlZFwiLFxuICAgICAgXCJxdWVzdGlvblRpbWVzXCIsXG4gICAgXSxcbiAgICBcIlx1NjNEMFx1NEVBNFwiLFxuICApO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1NjNEMFx1NEVBNFwiLCBhc1N0ciksXG4gICAgYXNzZXNzbWVudElkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJhc3Nlc3NtZW50SWRcIiwgXCJcdTYzRDBcdTRFQTRcIiwgYXNTdHIpLFxuICAgIHN1Ym1pdHRlZEF0OiByZXF1aXJlZEZpZWxkKHJhdywgXCJzdWJtaXR0ZWRBdFwiLCBcIlx1NjNEMFx1NEVBNFwiLCBhc0ludCksXG4gICAgcmVzb3VyY2VJZHM6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJyZXNvdXJjZUlkc1wiLFxuICAgICAgXCJcdTYzRDBcdTRFQTRcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwicmVzb3VyY2VJZHNcIikubWFwKCh4KSA9PiBhc1N0cih4LCBcIlx1OTY0NFx1NEVGNiBJRFwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICAgIGFuc3dlcnM6IHJlcXVpcmVkRmllbGQocmF3LCBcImFuc3dlcnNcIiwgXCJcdTYzRDBcdTRFQTRcIiwgYXNTdHIpLFxuICAgIHVuZmluaXNoZWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInVuZmluaXNoZWRcIiwgXCJcdTYzRDBcdTRFQTRcIiwgYXNCb29sKSxcbiAgICBxdWVzdGlvblRpbWVzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwicXVlc3Rpb25UaW1lc1wiLFxuICAgICAgXCJcdTYzRDBcdTRFQTRcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwicXVlc3Rpb25UaW1lc1wiKS5tYXAocGFyc2VRdWVzdGlvblRpbWUpLFxuICAgICAgW10sXG4gICAgKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVN1Ym1pc3Npb24oczogU3VibWlzc2lvbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogcy5pZCxcbiAgICBhc3Nlc3NtZW50SWQ6IHMuYXNzZXNzbWVudElkLFxuICAgIHN1Ym1pdHRlZEF0OiBzLnN1Ym1pdHRlZEF0LFxuICAgIHJlc291cmNlSWRzOiBzLnJlc291cmNlSWRzLFxuICAgIGFuc3dlcnM6IHMuYW5zd2VycyxcbiAgICB1bmZpbmlzaGVkOiBzLnVuZmluaXNoZWQsXG4gICAgcXVlc3Rpb25UaW1lczogcy5xdWVzdGlvblRpbWVzLm1hcChzZXJpYWxpemVRdWVzdGlvblRpbWUpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VRdWVzdGlvblRpbWUocmF3OiB1bmtub3duKTogUXVlc3Rpb25UaW1lIHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTVCOENcdTYyMTBcdTY1RjZcdTUyM0JcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24ocmF3LCBbXCJxdWVzdGlvbklkXCIsIFwibG9jYWxUaW1lXCJdLCBcIlx1NUI4Q1x1NjIxMFx1NjVGNlx1NTIzQlwiKTtcbiAgcmV0dXJuIHtcbiAgICBxdWVzdGlvbklkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJxdWVzdGlvbklkXCIsIFwiXHU1QjhDXHU2MjEwXHU2NUY2XHU1MjNCXCIsIGFzU3RyKSxcbiAgICBsb2NhbFRpbWU6IHJlcXVpcmVkRmllbGQocmF3LCBcImxvY2FsVGltZVwiLCBcIlx1NUI4Q1x1NjIxMFx1NjVGNlx1NTIzQlwiLCBhc1N0ciksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVRdWVzdGlvblRpbWUoXG4gIHQ6IFF1ZXN0aW9uVGltZSxcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHsgcXVlc3Rpb25JZDogdC5xdWVzdGlvbklkLCBsb2NhbFRpbWU6IHQubG9jYWxUaW1lIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVBvaW50QXdhcmQocmF3OiB1bmtub3duKTogUG9pbnRBd2FyZCB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4QkM0XHU1MjA2XHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKHJhdywgW1wicXVlc3Rpb25JZFwiLCBcInBvaW50SWRcIiwgXCJhd2FyZGVkXCIsIFwiZXZpZGVuY2VcIl0sIFwiXHU4QkM0XHU1MjA2XCIpO1xuICByZXR1cm4ge1xuICAgIHF1ZXN0aW9uSWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInF1ZXN0aW9uSWRcIiwgXCJcdThCQzRcdTUyMDZcIiwgYXNTdHIpLFxuICAgIHBvaW50SWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInBvaW50SWRcIiwgXCJcdThCQzRcdTUyMDZcIiwgYXNTdHIpLFxuICAgIGF3YXJkZWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImF3YXJkZWRcIiwgXCJcdThCQzRcdTUyMDZcIiwgYXNJbnQpLFxuICAgIGV2aWRlbmNlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJldmlkZW5jZVwiLCBcIlx1OEJDNFx1NTIwNlwiLCBhc1N0ciksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVQb2ludEF3YXJkKHA6IFBvaW50QXdhcmQpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7XG4gICAgcXVlc3Rpb25JZDogcC5xdWVzdGlvbklkLFxuICAgIHBvaW50SWQ6IHAucG9pbnRJZCxcbiAgICBhd2FyZGVkOiBwLmF3YXJkZWQsXG4gICAgZXZpZGVuY2U6IHAuZXZpZGVuY2UsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUVycm9yQW5hbHlzaXMocmF3OiB1bmtub3duKTogRXJyb3JBbmFseXNpcyB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU5NTE5XHU1NkUwXHU1MjA2XHU2NzkwXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKFxuICAgIHJhdyxcbiAgICBbXG4gICAgICBcInF1ZXN0aW9uSWRcIixcbiAgICAgIFwiY2F1c2VcIixcbiAgICAgIFwiZXZpZGVuY2VcIixcbiAgICAgIFwiY29ycmVjdGlvblwiLFxuICAgICAgXCJuZXh0Q2hlY2tcIixcbiAgICAgIFwicmV0ZXN0RGF0ZVwiLFxuICAgICAgXCJjb25maXJtZWRcIixcbiAgICBdLFxuICAgIFwiXHU5NTE5XHU1NkUwXHU1MjA2XHU2NzkwXCIsXG4gICk7XG4gIHJldHVybiB7XG4gICAgcXVlc3Rpb25JZDogcmVxdWlyZWRGaWVsZChyYXcsIFwicXVlc3Rpb25JZFwiLCBcIlx1OTUxOVx1NTZFMFx1NTIwNlx1Njc5MFwiLCBhc1N0ciksXG4gICAgY2F1c2U6IHJlcXVpcmVkRmllbGQocmF3LCBcImNhdXNlXCIsIFwiXHU5NTE5XHU1NkUwXHU1MjA2XHU2NzkwXCIsIGFzU3RyKSxcbiAgICBldmlkZW5jZTogcmVxdWlyZWRGaWVsZChyYXcsIFwiZXZpZGVuY2VcIiwgXCJcdTk1MTlcdTU2RTBcdTUyMDZcdTY3OTBcIiwgYXNTdHIpLFxuICAgIGNvcnJlY3Rpb246IHJlcXVpcmVkRmllbGQocmF3LCBcImNvcnJlY3Rpb25cIiwgXCJcdTk1MTlcdTU2RTBcdTUyMDZcdTY3OTBcIiwgYXNTdHIpLFxuICAgIG5leHRDaGVjazogcmVxdWlyZWRGaWVsZChyYXcsIFwibmV4dENoZWNrXCIsIFwiXHU5NTE5XHU1NkUwXHU1MjA2XHU2NzkwXCIsIGFzU3RyKSxcbiAgICByZXRlc3REYXRlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJyZXRlc3REYXRlXCIsIFwiXHU5NTE5XHU1NkUwXHU1MjA2XHU2NzkwXCIsIGFzU3RyKSxcbiAgICBjb25maXJtZWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImNvbmZpcm1lZFwiLCBcIlx1OTUxOVx1NTZFMFx1NTIwNlx1Njc5MFwiLCBhc0Jvb2wpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplRXJyb3JBbmFseXNpcyhcbiAgZTogRXJyb3JBbmFseXNpcyxcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBxdWVzdGlvbklkOiBlLnF1ZXN0aW9uSWQsXG4gICAgY2F1c2U6IGUuY2F1c2UsXG4gICAgZXZpZGVuY2U6IGUuZXZpZGVuY2UsXG4gICAgY29ycmVjdGlvbjogZS5jb3JyZWN0aW9uLFxuICAgIG5leHRDaGVjazogZS5uZXh0Q2hlY2ssXG4gICAgcmV0ZXN0RGF0ZTogZS5yZXRlc3REYXRlLFxuICAgIGNvbmZpcm1lZDogZS5jb25maXJtZWQsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUdyYWRlKHJhdzogdW5rbm93bik6IEdyYWRlIHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTYyNzlcdTY1MzlcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24oXG4gICAgcmF3LFxuICAgIFtcbiAgICAgIFwiaWRcIixcbiAgICAgIFwic3VibWlzc2lvbklkXCIsXG4gICAgICBcImFzc2Vzc21lbnRSZXZpc2lvblwiLFxuICAgICAgXCJncmFkZWRBdFwiLFxuICAgICAgXCJhd2FyZHNcIixcbiAgICAgIFwiZXJyb3JzXCIsXG4gICAgICBcIm5lZWRzUmV2aWV3XCIsXG4gICAgICBcImZlZWRiYWNrXCIsXG4gICAgXSxcbiAgICBcIlx1NjI3OVx1NjUzOVwiLFxuICApO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1NjI3OVx1NjUzOVwiLCBhc1N0ciksXG4gICAgc3VibWlzc2lvbklkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJzdWJtaXNzaW9uSWRcIiwgXCJcdTYyNzlcdTY1MzlcIiwgYXNTdHIpLFxuICAgIGFzc2Vzc21lbnRSZXZpc2lvbjogcmVxdWlyZWRGaWVsZChyYXcsIFwiYXNzZXNzbWVudFJldmlzaW9uXCIsIFwiXHU2Mjc5XHU2NTM5XCIsIGFzSW50KSxcbiAgICBncmFkZWRBdDogcmVxdWlyZWRGaWVsZChyYXcsIFwiZ3JhZGVkQXRcIiwgXCJcdTYyNzlcdTY1MzlcIiwgYXNJbnQpLFxuICAgIGF3YXJkczogcmVxdWlyZWRGaWVsZChyYXcsIFwiYXdhcmRzXCIsIFwiXHU2Mjc5XHU2NTM5XCIsICh2KSA9PlxuICAgICAgYXNBcnJheSh2LCBcImF3YXJkc1wiKS5tYXAocGFyc2VQb2ludEF3YXJkKSxcbiAgICApLFxuICAgIGVycm9yczogcmVxdWlyZWRGaWVsZChyYXcsIFwiZXJyb3JzXCIsIFwiXHU2Mjc5XHU2NTM5XCIsICh2KSA9PlxuICAgICAgYXNBcnJheSh2LCBcImVycm9yc1wiKS5tYXAocGFyc2VFcnJvckFuYWx5c2lzKSxcbiAgICApLFxuICAgIG5lZWRzUmV2aWV3OiByZXF1aXJlZEZpZWxkKHJhdywgXCJuZWVkc1Jldmlld1wiLCBcIlx1NjI3OVx1NjUzOVwiLCBhc0Jvb2wpLFxuICAgIGZlZWRiYWNrOiByZXF1aXJlZEZpZWxkKHJhdywgXCJmZWVkYmFja1wiLCBcIlx1NjI3OVx1NjUzOVwiLCBhc1N0ciksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVHcmFkZShnOiBHcmFkZSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogZy5pZCxcbiAgICBzdWJtaXNzaW9uSWQ6IGcuc3VibWlzc2lvbklkLFxuICAgIGFzc2Vzc21lbnRSZXZpc2lvbjogZy5hc3Nlc3NtZW50UmV2aXNpb24sXG4gICAgZ3JhZGVkQXQ6IGcuZ3JhZGVkQXQsXG4gICAgYXdhcmRzOiBnLmF3YXJkcy5tYXAoc2VyaWFsaXplUG9pbnRBd2FyZCksXG4gICAgZXJyb3JzOiBnLmVycm9ycy5tYXAoc2VyaWFsaXplRXJyb3JBbmFseXNpcyksXG4gICAgbmVlZHNSZXZpZXc6IGcubmVlZHNSZXZpZXcsXG4gICAgZmVlZGJhY2s6IGcuZmVlZGJhY2ssXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVJldmlldyhyYXc6IHVua25vd24pOiBSZXZpZXcge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NTkwRFx1NzZEOFx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihcbiAgICByYXcsXG4gICAgW1wiaWRcIiwgXCJkYXRlXCIsIFwicHJvamVjdElkXCIsIFwiZ3JhZGVJZHNcIiwgXCJmaW5kaW5nc1wiLCBcImFjdGlvbnNcIl0sXG4gICAgXCJcdTU5MERcdTc2RDhcIixcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTU5MERcdTc2RDhcIiwgYXNTdHIpLFxuICAgIGRhdGU6IHJlcXVpcmVkRmllbGQocmF3LCBcImRhdGVcIiwgXCJcdTU5MERcdTc2RDhcIiwgYXNTdHIpLFxuICAgIHByb2plY3RJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvamVjdElkXCIsIFwiXHU1OTBEXHU3NkQ4XCIsIGFzU3RyKSxcbiAgICBncmFkZUlkczogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImdyYWRlSWRzXCIsXG4gICAgICBcIlx1NTkwRFx1NzZEOFwiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJncmFkZUlkc1wiKS5tYXAoKHgpID0+IGFzU3RyKHgsIFwiXHU2Mjc5XHU2NTM5IElEXCIpKSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgZmluZGluZ3M6IHJlcXVpcmVkRmllbGQocmF3LCBcImZpbmRpbmdzXCIsIFwiXHU1OTBEXHU3NkQ4XCIsIGFzU3RyKSxcbiAgICBhY3Rpb25zOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiYWN0aW9uc1wiLFxuICAgICAgXCJcdTU5MERcdTc2RDhcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwiYWN0aW9uc1wiKS5tYXAoKHgpID0+IGFzU3RyKHgsIFwiXHU4ODRDXHU1MkE4XCIpKSxcbiAgICAgIFtdLFxuICAgICksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVSZXZpZXcocjogUmV2aWV3KTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4ge1xuICAgIGlkOiByLmlkLFxuICAgIGRhdGU6IHIuZGF0ZSxcbiAgICBwcm9qZWN0SWQ6IHIucHJvamVjdElkLFxuICAgIGdyYWRlSWRzOiByLmdyYWRlSWRzLFxuICAgIGZpbmRpbmdzOiByLmZpbmRpbmdzLFxuICAgIGFjdGlvbnM6IHIuYWN0aW9ucyxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVGVhY2hpbmdFdmVudChyYXc6IHVua25vd24pOiBUZWFjaGluZ0V2ZW50IHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTY1NTlcdTVCNjZcdTRFOEJcdTRFRjZcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24oXG4gICAgcmF3LFxuICAgIFtcImlkXCIsIFwicHJvamVjdElkXCIsIFwia2luZFwiLCBcInNvdXJjZUlkXCIsIFwic3RhdGVcIiwgXCJjcmVhdGVkQXRcIl0sXG4gICAgXCJcdTY1NTlcdTVCNjZcdTRFOEJcdTRFRjZcIixcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTY1NTlcdTVCNjZcdTRFOEJcdTRFRjZcIiwgYXNTdHIpLFxuICAgIHByb2plY3RJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvamVjdElkXCIsIFwiXHU2NTU5XHU1QjY2XHU0RThCXHU0RUY2XCIsIGFzU3RyKSxcbiAgICBraW5kOiByZXF1aXJlZEZpZWxkKHJhdywgXCJraW5kXCIsIFwiXHU2NTU5XHU1QjY2XHU0RThCXHU0RUY2XCIsIGFzU3RyKSxcbiAgICBzb3VyY2VJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwic291cmNlSWRcIiwgXCJcdTY1NTlcdTVCNjZcdTRFOEJcdTRFRjZcIiwgYXNTdHIpLFxuICAgIHN0YXRlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJzdGF0ZVwiLCBcIlx1NjU1OVx1NUI2Nlx1NEU4Qlx1NEVGNlwiLCBhc1N0ciksXG4gICAgY3JlYXRlZEF0OiByZXF1aXJlZEZpZWxkKHJhdywgXCJjcmVhdGVkQXRcIiwgXCJcdTY1NTlcdTVCNjZcdTRFOEJcdTRFRjZcIiwgYXNJbnQpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplVGVhY2hpbmdFdmVudChcbiAgZTogVGVhY2hpbmdFdmVudCxcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogZS5pZCxcbiAgICBwcm9qZWN0SWQ6IGUucHJvamVjdElkLFxuICAgIGtpbmQ6IGUua2luZCxcbiAgICBzb3VyY2VJZDogZS5zb3VyY2VJZCxcbiAgICBzdGF0ZTogZS5zdGF0ZSxcbiAgICBjcmVhdGVkQXQ6IGUuY3JlYXRlZEF0LFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQcm9ncmVzc1JlY29yZChyYXc6IHVua25vd24pOiBQcm9ncmVzc1JlY29yZCB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4RkRCXHU1RUE2XHU4QkIwXHU1RjU1XHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKFxuICAgIHJhdyxcbiAgICBbXG4gICAgICBcImlkXCIsXG4gICAgICBcInByb2plY3RJZFwiLFxuICAgICAgXCJ0b3BpY1wiLFxuICAgICAgXCJwb3NpdGlvblwiLFxuICAgICAgXCJzdGF0ZVwiLFxuICAgICAgXCJldmlkZW5jZVwiLFxuICAgICAgXCJuZXh0QWN0aW9uXCIsXG4gICAgICBcInNvdXJjZVwiLFxuICAgICAgXCJjb25maXJtZWRcIixcbiAgICAgIFwicmVjb3JkZWRBdFwiLFxuICAgIF0sXG4gICAgXCJcdThGREJcdTVFQTZcdThCQjBcdTVGNTVcIixcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdThGREJcdTVFQTZcdThCQjBcdTVGNTVcIiwgYXNTdHIpLFxuICAgIHByb2plY3RJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvamVjdElkXCIsIFwiXHU4RkRCXHU1RUE2XHU4QkIwXHU1RjU1XCIsIGFzU3RyKSxcbiAgICB0b3BpYzogcmVxdWlyZWRGaWVsZChyYXcsIFwidG9waWNcIiwgXCJcdThGREJcdTVFQTZcdThCQjBcdTVGNTVcIiwgYXNTdHIpLFxuICAgIHBvc2l0aW9uOiByZXF1aXJlZEZpZWxkKHJhdywgXCJwb3NpdGlvblwiLCBcIlx1OEZEQlx1NUVBNlx1OEJCMFx1NUY1NVwiLCBhc1N0ciksXG4gICAgc3RhdGU6IG9uZU9mKFxuICAgICAgcmVxdWlyZWRGaWVsZChyYXcsIFwic3RhdGVcIiwgXCJcdThGREJcdTVFQTZcdThCQjBcdTVGNTVcIiwgKHYpID0+IHYpLFxuICAgICAgXCJcdThGREJcdTVFQTYgc3RhdGVcIixcbiAgICAgIFtcInN0dWRpZWRcIiwgXCJwcmFjdGljaW5nXCIsIFwibmVlZHNSZXZpZXdcIl0sXG4gICAgKSBhcyBQcm9ncmVzc1JlY29yZFtcInN0YXRlXCJdLFxuICAgIGV2aWRlbmNlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJldmlkZW5jZVwiLCBcIlx1OEZEQlx1NUVBNlx1OEJCMFx1NUY1NVwiLCBhc1N0ciksXG4gICAgbmV4dEFjdGlvbjogcmVxdWlyZWRGaWVsZChyYXcsIFwibmV4dEFjdGlvblwiLCBcIlx1OEZEQlx1NUVBNlx1OEJCMFx1NUY1NVwiLCBhc1N0ciksXG4gICAgc291cmNlOiBvbmVPZihcbiAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcInNvdXJjZVwiLCBcIlx1OEZEQlx1NUVBNlx1OEJCMFx1NUY1NVwiLCAodikgPT4gdiksXG4gICAgICBcIlx1OEZEQlx1NUVBNiBzb3VyY2VcIixcbiAgICAgIFtcInVzZXJcIiwgXCJhc3Npc3RhbnRcIl0sXG4gICAgKSBhcyBQcm9ncmVzc1NvdXJjZSxcbiAgICBjb25maXJtZWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImNvbmZpcm1lZFwiLCBcIlx1OEZEQlx1NUVBNlx1OEJCMFx1NUY1NVwiLCBhc0Jvb2wpLFxuICAgIHJlY29yZGVkQXQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInJlY29yZGVkQXRcIiwgXCJcdThGREJcdTVFQTZcdThCQjBcdTVGNTVcIiwgYXNJbnQpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplUHJvZ3Jlc3NSZWNvcmQoXG4gIHI6IFByb2dyZXNzUmVjb3JkLFxuKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4ge1xuICAgIGlkOiByLmlkLFxuICAgIHByb2plY3RJZDogci5wcm9qZWN0SWQsXG4gICAgdG9waWM6IHIudG9waWMsXG4gICAgcG9zaXRpb246IHIucG9zaXRpb24sXG4gICAgc3RhdGU6IHIuc3RhdGUsXG4gICAgZXZpZGVuY2U6IHIuZXZpZGVuY2UsXG4gICAgbmV4dEFjdGlvbjogci5uZXh0QWN0aW9uLFxuICAgIHNvdXJjZTogci5zb3VyY2UsXG4gICAgY29uZmlybWVkOiByLmNvbmZpcm1lZCxcbiAgICByZWNvcmRlZEF0OiByLnJlY29yZGVkQXQsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNvcnJlY3Rpb24ocmF3OiB1bmtub3duKTogQ29ycmVjdGlvbiB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4QkEyXHU2QjYzXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKFxuICAgIHJhdyxcbiAgICBbXG4gICAgICBcImlkXCIsXG4gICAgICBcImdyYWRlSWRcIixcbiAgICAgIFwicXVlc3Rpb25JZFwiLFxuICAgICAgXCJleHBsYW5hdGlvblwiLFxuICAgICAgXCJyZXNvdXJjZUlkc1wiLFxuICAgICAgXCJzdWJtaXR0ZWRBdFwiLFxuICAgICAgXCJhY2NlcHRlZFwiLFxuICAgICAgXCJmZWVkYmFja1wiLFxuICAgICAgXCJyZXZpZXdlZEF0XCIsXG4gICAgXSxcbiAgICBcIlx1OEJBMlx1NkI2M1wiLFxuICApO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1OEJBMlx1NkI2M1wiLCBhc1N0ciksXG4gICAgZ3JhZGVJZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiZ3JhZGVJZFwiLCBcIlx1OEJBMlx1NkI2M1wiLCBhc1N0ciksXG4gICAgcXVlc3Rpb25JZDogcmVxdWlyZWRGaWVsZChyYXcsIFwicXVlc3Rpb25JZFwiLCBcIlx1OEJBMlx1NkI2M1wiLCBhc1N0ciksXG4gICAgZXhwbGFuYXRpb246IHJlcXVpcmVkRmllbGQocmF3LCBcImV4cGxhbmF0aW9uXCIsIFwiXHU4QkEyXHU2QjYzXCIsIGFzU3RyKSxcbiAgICByZXNvdXJjZUlkczogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInJlc291cmNlSWRzXCIsXG4gICAgICBcIlx1OEJBMlx1NkI2M1wiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJyZXNvdXJjZUlkc1wiKS5tYXAoKHgpID0+IGFzU3RyKHgsIFwiXHU5NjQ0XHU0RUY2IElEXCIpKSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgc3VibWl0dGVkQXQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInN1Ym1pdHRlZEF0XCIsIFwiXHU4QkEyXHU2QjYzXCIsIGFzSW50KSxcbiAgICBhY2NlcHRlZDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImFjY2VwdGVkXCIsXG4gICAgICBcIlx1OEJBMlx1NkI2M1wiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiYWNjZXB0ZWRcIiwgYXNCb29sKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBib29sZWFuIHwgbnVsbCxcbiAgICBmZWVkYmFjazogZmllbGQocmF3LCBcImZlZWRiYWNrXCIsIFwiXHU4QkEyXHU2QjYzXCIsIGFzU3RyLCBcIlwiKSxcbiAgICByZXZpZXdlZEF0OiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwicmV2aWV3ZWRBdFwiLFxuICAgICAgXCJcdThCQTJcdTZCNjNcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcInJldmlld2VkQXRcIiwgYXNJbnQpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIG51bWJlciB8IG51bGwsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVDb3JyZWN0aW9uKGM6IENvcnJlY3Rpb24pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7XG4gICAgaWQ6IGMuaWQsXG4gICAgZ3JhZGVJZDogYy5ncmFkZUlkLFxuICAgIHF1ZXN0aW9uSWQ6IGMucXVlc3Rpb25JZCxcbiAgICBleHBsYW5hdGlvbjogYy5leHBsYW5hdGlvbixcbiAgICByZXNvdXJjZUlkczogYy5yZXNvdXJjZUlkcyxcbiAgICBzdWJtaXR0ZWRBdDogYy5zdWJtaXR0ZWRBdCxcbiAgICBhY2NlcHRlZDogYy5hY2NlcHRlZCxcbiAgICBmZWVkYmFjazogYy5mZWVkYmFjayxcbiAgICByZXZpZXdlZEF0OiBjLnJldmlld2VkQXQsXG4gIH07XG59XG5cbi8vIC0tLS0tLS0tLS0gXHU2ODIxXHU5QThDXHU4Rjg1XHU1MkE5IC0tLS0tLS0tLS1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrVGV4dChzOiBzdHJpbmcsIG1heDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiBzLnRyaW0oKS5sZW5ndGggPiAwICYmIEFycmF5LmZyb20ocykubGVuZ3RoIDw9IG1heDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkRWR1Y2F0aW9uRGF0ZShzOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIHMubGVuZ3RoID09PSAxMCAmJiB2YWxpZERhdGUocyk7XG59XG5cbi8qKiBcdTVCODlcdTUxNjhcdTc2ODRcdTk4NzlcdTc2RUVcdTUxODVcdTc2RjhcdTVCRjlcdThERUZcdTVGODRcdUZGMUFcdTk3NUVcdTdBN0FcdTMwMDFcdTY1RTBcdTUzQ0RcdTY1OUNcdTY3NjBcdTMwMDFcdTk3NUVcdTdFRERcdTVCRjlcdTMwMDFcdTY1RTAgYC4uYC9gLmAgXHU2QkI1XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gaXNSZWxhdGl2ZVBhdGgocGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGlmIChwYXRoLmxlbmd0aCA9PT0gMCB8fCBwYXRoLmluY2x1ZGVzKFwiXFxcXFwiKSB8fCBpc0Fic29sdXRlUGF0aChwYXRoKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IHN0cmlwcGVkID0gcGF0aC5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuICBpZiAoc3RyaXBwZWQubGVuZ3RoID09PSAwKSByZXR1cm4gcGF0aC5sZW5ndGggPiAwICYmIGZhbHNlO1xuICByZXR1cm4gc3RyaXBwZWRcbiAgICAuc3BsaXQoXCIvXCIpXG4gICAgLmV2ZXJ5KChzZWcpID0+IHNlZyAhPT0gXCIuXCIgJiYgc2VnICE9PSBcIi4uXCIgJiYgc2VnICE9PSBcIlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQWJzb2x1dGVQYXRoKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gL14oXFwvfFtBLVphLXpdOltcXFxcL118XFxcXFxcXFwpLy50ZXN0KHBhdGgpO1xufVxuXG4vLyAtLS0tLS0tLS0tIEVkdWNhdGlvbiBcdTY1NzBcdTYzNkVcdTdDN0IgLS0tLS0tLS0tLVxuXG5leHBvcnQgaW50ZXJmYWNlIEVkdWNhdGlvbkRhdGEge1xuICBmb2N1c1Rhc2tzOiBpbXBvcnQoXCIuL21vZGVsXCIpLlRlYWNoaW5nVGFza1tdO1xuICBwcm9qZWN0czogUHJvamVjdFN0dWR5W107XG4gIHJlc291cmNlczogUmVzb3VyY2VbXTtcbiAgc2VtZXN0ZXJzOiBTZW1lc3RlcltdO1xuICBzZW1lc3Rlckhpc3Rvcnk6IFNlbWVzdGVyW107XG4gIGxlc3NvbnM6IExlc3NvbltdO1xuICBhc3Nlc3NtZW50czogQXNzZXNzbWVudFtdO1xuICBzdWJtaXNzaW9uczogU3VibWlzc2lvbltdO1xuICBncmFkZXM6IEdyYWRlW107XG4gIHJldmlld3M6IFJldmlld1tdO1xuICBldmVudHM6IFRlYWNoaW5nRXZlbnRbXTtcbiAgY29tcGxldGVkVGFza3M6IENvbXBsZXRlZFN0dWR5VGFza1tdO1xuICBwcm9ncmVzczogUHJvZ3Jlc3NSZWNvcmRbXTtcbiAgY29ycmVjdGlvbnM6IENvcnJlY3Rpb25bXTtcbn1cblxuZXhwb3J0IGNsYXNzIEVkdWNhdGlvbiBpbXBsZW1lbnRzIEVkdWNhdGlvbkRhdGEge1xuICBmb2N1c1Rhc2tzOiBpbXBvcnQoXCIuL21vZGVsXCIpLlRlYWNoaW5nVGFza1tdID0gW107XG4gIHByb2plY3RzOiBQcm9qZWN0U3R1ZHlbXSA9IFtdO1xuICByZXNvdXJjZXM6IFJlc291cmNlW10gPSBbXTtcbiAgc2VtZXN0ZXJzOiBTZW1lc3RlcltdID0gW107XG4gIHNlbWVzdGVySGlzdG9yeTogU2VtZXN0ZXJbXSA9IFtdO1xuICBsZXNzb25zOiBMZXNzb25bXSA9IFtdO1xuICBhc3Nlc3NtZW50czogQXNzZXNzbWVudFtdID0gW107XG4gIHN1Ym1pc3Npb25zOiBTdWJtaXNzaW9uW10gPSBbXTtcbiAgZ3JhZGVzOiBHcmFkZVtdID0gW107XG4gIHJldmlld3M6IFJldmlld1tdID0gW107XG4gIGV2ZW50czogVGVhY2hpbmdFdmVudFtdID0gW107XG4gIGNvbXBsZXRlZFRhc2tzOiBDb21wbGV0ZWRTdHVkeVRhc2tbXSA9IFtdO1xuICBwcm9ncmVzczogUHJvZ3Jlc3NSZWNvcmRbXSA9IFtdO1xuICBjb3JyZWN0aW9uczogQ29ycmVjdGlvbltdID0gW107XG5cbiAgLyoqIFx1NkJDRlx1NkIyMVx1NjI2Qlx1NjNDRlx1NjIxNlx1NTNEOFx1NjZGNFx1NjVGNlx1OTFDRFx1NUVGQVx1RkYxQVx1NTQyQlx1NTA1Q1x1NzUyOFx1OTE0RFx1N0Y2RVx1NEUwRVx1NUY1Mlx1Njg2M1x1OEJBMVx1NTIxMlx1MzAwMiAqL1xuICByZXNvdXJjZVJlZmVyZW5jZUluZGV4KCk6IE1hcDxzdHJpbmcsIHN0cmluZ1tdPiB7XG4gICAgY29uc3QgcmVmcyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmdbXT4oKTtcbiAgICBjb25zdCBhZGQgPSAoaWRzOiBzdHJpbmdbXSwgbGFiZWw6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgICAgZm9yIChjb25zdCBpZCBvZiBuZXcgU2V0KGlkcykpIHtcbiAgICAgICAgY29uc3QgbGlzdCA9IHJlZnMuZ2V0KGlkKSA/PyBbXTtcbiAgICAgICAgbGlzdC5wdXNoKGxhYmVsKTtcbiAgICAgICAgcmVmcy5zZXQoaWQsIGxpc3QpO1xuICAgICAgfVxuICAgIH07XG4gICAgZm9yIChjb25zdCBwIG9mIHRoaXMucHJvamVjdHMpIHtcbiAgICAgIGFkZChcbiAgICAgICAgW3Auc3lsbGFidXNJZCwgLi4ucC5wYXN0UGFwZXJJZHMsIC4uLnAubW9ja1BhcGVySWRzXS5maWx0ZXIoXG4gICAgICAgICAgKHgpOiB4IGlzIHN0cmluZyA9PiB4ICE9PSBudWxsLFxuICAgICAgICApLFxuICAgICAgICBcIlx1OTg3OVx1NzZFRVx1NjU1OVx1NUI2Nlx1OTE0RFx1N0Y2RVwiLFxuICAgICAgKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBzIG9mIFsuLi50aGlzLnNlbWVzdGVycywgLi4udGhpcy5zZW1lc3Rlckhpc3RvcnldKSB7XG4gICAgICBmb3IgKGNvbnN0IG0gb2Ygcy5taWxlc3RvbmVzKSB7XG4gICAgICAgIGFkZChtLnJlc291cmNlSWRzLCBgJHtzLnRpdGxlfSB2JHtzLnJldmlzaW9ufSBcdTdCMkMke20ud2Vla31cdTU0NjhgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBsIG9mIHRoaXMubGVzc29ucykge1xuICAgICAgYWRkKGwucmVzb3VyY2VJZHMsIGBcdThCRkVcdTdBMEJcdUZGMUEke2wudGl0bGV9YCk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgYSBvZiB0aGlzLmFzc2Vzc21lbnRzKSB7XG4gICAgICBhZGQoYS5yZXNvdXJjZUlkcywgYFx1OEJENVx1NTM3N1x1RkYxQSR7YS50aXRsZX1gKTtcbiAgICAgIGZvciAoY29uc3QgcSBvZiBhLnF1ZXN0aW9ucykge1xuICAgICAgICBhZGQocS5zb3VyY2VJZHMsIGAke2EudGl0bGV9IC8gJHtxLmlkfWApO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IHMgb2YgdGhpcy5zdWJtaXNzaW9ucykge1xuICAgICAgYWRkKHMucmVzb3VyY2VJZHMsIGBcdTdCNTRcdTUzNzdcdUZGMUEke3MuaWR9YCk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgYyBvZiB0aGlzLmNvcnJlY3Rpb25zKSB7XG4gICAgICBhZGQoYy5yZXNvdXJjZUlkcywgYFx1OEJBMlx1NkI2M1x1RkYxQSR7Yy5pZH1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlZnM7XG4gIH1cblxuICByZXNvdXJjZVJlZmVyZW5jZXMoaWQ6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gdGhpcy5yZXNvdXJjZVJlZmVyZW5jZUluZGV4KCkuZ2V0KGlkKSA/PyBbXTtcbiAgfVxuXG4gIGV2ZW50KHByb2plY3Q6IHN0cmluZywga2luZDogc3RyaW5nLCBzb3VyY2U6IHN0cmluZywgYXQ6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGV2ZW50SWQgPSBgJHtraW5kfToke3NvdXJjZX1gO1xuICAgIGlmICghdGhpcy5ldmVudHMuc29tZSgoZSkgPT4gZS5pZCA9PT0gZXZlbnRJZCkpIHtcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goe1xuICAgICAgICBpZDogZXZlbnRJZCxcbiAgICAgICAgcHJvamVjdElkOiBwcm9qZWN0LFxuICAgICAgICBraW5kLFxuICAgICAgICBzb3VyY2VJZDogc291cmNlLFxuICAgICAgICBzdGF0ZTogXCJwZW5kaW5nXCIsXG4gICAgICAgIGNyZWF0ZWRBdDogYXQsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICB0YXNrQ29tcGxldGVkKHRhc2s6IFRhc2ssIGF0OiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCByZWNvcmQgPSBjb21wbGV0ZWRTdHVkeVRhc2tGcm9tVGFzayh0YXNrLCBhdCk7XG4gICAgaWYgKHJlY29yZCA9PT0gbnVsbCkgcmV0dXJuO1xuICAgIGlmIChcbiAgICAgIHRoaXMucHJvamVjdHMuc29tZShcbiAgICAgICAgKHApID0+IHAucHJvamVjdElkID09PSByZWNvcmQucHJvamVjdElkICYmIHAuZXhhbU1vZGUsXG4gICAgICApICYmXG4gICAgICAhdGhpcy5jb21wbGV0ZWRUYXNrcy5zb21lKCh0KSA9PiB0LmlkID09PSByZWNvcmQuaWQpXG4gICAgKSB7XG4gICAgICBjb25zdCBsaW5rID0gdGhpcy5mb2N1c1Rhc2tzLmZpbmQoKGwpID0+IGwudGFza0lkID09PSByZWNvcmQuaWQpO1xuICAgICAgaWYgKGxpbmsgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdCBsZXNzb24gPSB0aGlzLmxlc3NvbnMuZmluZCgobCkgPT4gbC5pZCA9PT0gbGluay5zb3VyY2VJZCk7XG4gICAgICAgIGlmIChsZXNzb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJlY29yZC50b3BpY3MgPSBbLi4ubGVzc29uLnRvcGljc107XG4gICAgICAgICAgcmVjb3JkLm5vdGVzID0gbGVzc29uLnByb2dyZXNzO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmV2ZW50KHJlY29yZC5wcm9qZWN0SWQsIFwidGFza0hvbWV3b3JrXCIsIHJlY29yZC5pZCwgYXQpO1xuICAgICAgfVxuICAgICAgdGhpcy5jb21wbGV0ZWRUYXNrcy5wdXNoKHJlY29yZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFx1OEJGRVx1N0EwQi9cdTgwMDNcdThCRDVcdTUyMzBcdTcwQjlcdTYzQThcdThGREJcdTMwMDFcdTYzMDFcdTRFNDVcdTUzMTZcdTY1NTlcdTVCNjZcdTRFOEJcdTRFRjZcdTMwMDIgKi9cbiAgdGljayhhdDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgbGV0IGNoYW5nZWQgPSBmYWxzZTtcbiAgICBjb25zdCBldmVudHM6IHsgcHJvamVjdDogc3RyaW5nOyBraW5kOiBzdHJpbmc7IHNvdXJjZTogc3RyaW5nIH1bXSA9IFtdO1xuICAgIGZvciAoY29uc3QgbGVzc29uIG9mIHRoaXMubGVzc29ucykge1xuICAgICAgaWYgKFxuICAgICAgICAobGVzc29uLnN0YXRlID09PSBcInBsYW5uZWRcIiB8fCBsZXNzb24uc3RhdGUgPT09IFwiYWN0aXZlXCIpICYmXG4gICAgICAgIGF0ID49IGxlc3Nvbi5lbmRzQXRcbiAgICAgICkge1xuICAgICAgICBsZXNzb24uc3RhdGUgPSBsZXNzb24uYXR0ZW5kZWQgPyBcImVuZGVkXCIgOiBcIm1pc3NlZFwiO1xuICAgICAgICBpZiAobGVzc29uLmFpRW5hYmxlZCAmJiBsZXNzb24uYXR0ZW5kZWQpIHtcbiAgICAgICAgICBldmVudHMucHVzaCh7XG4gICAgICAgICAgICBwcm9qZWN0OiBsZXNzb24ucHJvamVjdElkLFxuICAgICAgICAgICAga2luZDogXCJob21ld29ya1wiLFxuICAgICAgICAgICAgc291cmNlOiBsZXNzb24uaWQsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGxlc3Nvbi5zdGF0ZSA9PT0gXCJwbGFubmVkXCIgJiYgYXQgPj0gbGVzc29uLnN0YXJ0c0F0KSB7XG4gICAgICAgIGxlc3Nvbi5zdGF0ZSA9IFwiYWN0aXZlXCI7XG4gICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGEgb2YgdGhpcy5hc3Nlc3NtZW50cykge1xuICAgICAgaWYgKFxuICAgICAgICAoYS5raW5kID09PSBcImhvbWV3b3JrXCIgfHwgYS5zdGFydGVkQXQgIT09IG51bGwpICYmXG4gICAgICAgIGEuc3RvcHBlZEF0ID09PSBudWxsICYmXG4gICAgICAgIGF0ID49IGV4YW1EZWFkbGluZShhKVxuICAgICAgKSB7XG4gICAgICAgIGEuc3RvcHBlZEF0ID0gZXhhbURlYWRsaW5lKGEpO1xuICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCB7IHByb2plY3QsIGtpbmQsIHNvdXJjZSB9IG9mIGV2ZW50cykge1xuICAgICAgdGhpcy5ldmVudChwcm9qZWN0LCBraW5kLCBzb3VyY2UsIGF0KTtcbiAgICB9XG4gICAgLy8gXHU2QkNGXHU2NUU1XHU1OTBEXHU3NkQ4XHU2MzAxXHU0RTQ1XHVGRjFBXHU1MzA1XHU2MkVDIDA4OjMwIFx1NUU5NFx1NzUyOFx1NjcyQVx1NUYwMFx1NzY4NFx1NjVFNVx1NjcxRlx1MzAwMlxuICAgIGNvbnN0IGdyYWRlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGZvciAoY29uc3QgZyBvZiB0aGlzLmdyYWRlcykge1xuICAgICAgY29uc3Qgbm93TWludXRlcyA9IG1pbnV0ZXNPZihob3VyTWludXRlTm93KGF0KSkgPz8gLTE7XG4gICAgICBpZiAoZGF0ZUF0KGcuZ3JhZGVkQXQpIDwgZGF0ZUF0KGF0KSAmJiBub3dNaW51dGVzID49IDUxMCkge1xuICAgICAgICBjb25zdCBzdWIgPSB0aGlzLnN1Ym1pc3Npb25zLmZpbmQoKHMpID0+IHMuaWQgPT09IGcuc3VibWlzc2lvbklkKTtcbiAgICAgICAgaWYgKHN1YiA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcbiAgICAgICAgY29uc3QgYSA9IHRoaXMuYXNzZXNzbWVudHMuZmluZCgoeCkgPT4geC5pZCA9PT0gc3ViLmFzc2Vzc21lbnRJZCk7XG4gICAgICAgIGlmIChhID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuICAgICAgICBncmFkZXMuYWRkKGAke2EucHJvamVjdElkfXwke2RhdGVBdChnLmdyYWRlZEF0KX1gKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBwYWlyIG9mIGdyYWRlcykge1xuICAgICAgY29uc3QgW3AsIGRdID0gcGFpci5zcGxpdChcInxcIik7XG4gICAgICBjb25zdCBuID0gdGhpcy5ldmVudHMubGVuZ3RoO1xuICAgICAgdGhpcy5ldmVudChwISwgXCJyZXZpZXdcIiwgYCR7cH06JHtkfWAsIGF0KTtcbiAgICAgIGlmICh0aGlzLmV2ZW50cy5sZW5ndGggIT09IG4pIGNoYW5nZWQgPSB0cnVlO1xuICAgIH1cbiAgICAvLyBcdTU0NjhcdTRFOTRcdThENzdcdUZGMDhcdTU0MkJcdTU0NjhcdTY3MkJcdUZGMDlcdTRFM0FcdTRFQ0RcdTU3MjhcdThGREJcdTg4NENcdTRFMkRcdTc2ODRcdTVFOTRcdThCRDVcdTVCNjZcdTY3MUZcdTc2N0JcdThCQjBcdTU0NjhcdTgwMDNcdTRFOEJcdTRFRjZcdTMwMDJcbiAgICBjb25zdCB0b2RheSA9IGxvY2FsRGF0ZU9mKGF0KTtcbiAgICBpZiAod2Vla2RheU1vbmRheSh0b2RheSkgPj0gNSkge1xuICAgICAgY29uc3QgdGVybXM6IHsgcHJvamVjdDogc3RyaW5nOyBzb3VyY2U6IHN0cmluZyB9W10gPSBbXTtcbiAgICAgIGZvciAoY29uc3QgcyBvZiB0aGlzLnNlbWVzdGVycykge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgcy5zdGFydERhdGUgPD0gZGF0ZUF0KGF0KSAmJlxuICAgICAgICAgIHMuZW5kRGF0ZSA+PSBkYXRlQXQoYXQpICYmXG4gICAgICAgICAgdGhpcy5wcm9qZWN0cy5zb21lKChwKSA9PiBwLnByb2plY3RJZCA9PT0gcy5wcm9qZWN0SWQgJiYgcC5leGFtTW9kZSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgY29uc3Qgc3RhcnQgPSBwYXJzZURhdGUocy5zdGFydERhdGUpITtcbiAgICAgICAgICBjb25zdCB3ZWVrID0gTWF0aC5mbG9vcihkYXlzQmV0d2VlbihzdGFydCwgdG9kYXkpIC8gNykgKyAxO1xuICAgICAgICAgIHRlcm1zLnB1c2goeyBwcm9qZWN0OiBzLnByb2plY3RJZCwgc291cmNlOiBgJHtzLmlkfTp3ZWVrJHt3ZWVrfWAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgeyBwcm9qZWN0LCBzb3VyY2UgfSBvZiB0ZXJtcykge1xuICAgICAgICBjb25zdCBuID0gdGhpcy5ldmVudHMubGVuZ3RoO1xuICAgICAgICB0aGlzLmV2ZW50KHByb2plY3QsIFwid2Vla2x5RXhhbVwiLCBzb3VyY2UsIGF0KTtcbiAgICAgICAgaWYgKHRoaXMuZXZlbnRzLmxlbmd0aCAhPT0gbikgY2hhbmdlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjaGFuZ2VkO1xuICB9XG5cbiAgLyoqIFx1NjU1OVx1NUI2Nlx1NTQ3RFx1NEVFNFx1NjI2N1x1ODg0Q1x1RkYxQVx1NjgyMVx1OUE4QyBcdTIxOTIgXHU1M0Q4XHU2NkY0XHVGRjBDXHU1MTY4XHU5MEU4XHU2MjEwXHU1MjlGXHU1NDBFXHU3NTMxXHU0RTBBXHU1QzQyXHU3RURGXHU0RTAwIHZhbGlkYXRlXHUzMDAyICovXG4gIGFwcGx5KGNvbW1hbmQ6IENvbW1hbmQsIGF0OiBudW1iZXIpOiB2b2lkIHtcbiAgICBzd2l0Y2ggKGNvbW1hbmQub3ApIHtcbiAgICAgIGNhc2UgXCJyZWNvcmRQcm9ncmVzc1wiOiB7XG4gICAgICAgIGVuc3VyZShcbiAgICAgICAgICAhdGhpcy5wcm9ncmVzcy5zb21lKChyKSA9PiByLmlkID09PSBjb21tYW5kLnJlY29yZC5pZCksXG4gICAgICAgICAgXCJcdThGREJcdTVFQTZcdThCQjBcdTVGNTVcdTRFMERcdTUzRUZcdTg5ODZcdTc2RDZcdUZGMENcdThCRjdcdTY1QjBcdTU4OUVcdTRFMDBcdTY3NjFcdTY2RjRcdTZCNjNcdThCQjBcdTVGNTVcIixcbiAgICAgICAgKTtcbiAgICAgICAgY29tbWFuZC5yZWNvcmQucmVjb3JkZWRBdCA9IGF0O1xuICAgICAgICBjb21tYW5kLnJlY29yZC5jb25maXJtZWQgPSBjb21tYW5kLnJlY29yZC5zb3VyY2UgPT09IFwidXNlclwiO1xuICAgICAgICB0aGlzLnByb2dyZXNzLnB1c2goY29tbWFuZC5yZWNvcmQpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJjb25maXJtUHJvZ3Jlc3NcIjoge1xuICAgICAgICBjb25zdCByZWNvcmQgPSB0aGlzLnByb2dyZXNzLmZpbmQoKHIpID0+IHIuaWQgPT09IGNvbW1hbmQuaWQpO1xuICAgICAgICBlbnN1cmUocmVjb3JkICE9PSB1bmRlZmluZWQsIFwiXHU4RkRCXHU1RUE2XHU4QkIwXHU1RjU1XHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICByZWNvcmQuY29uZmlybWVkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwic3VibWl0Q29ycmVjdGlvblwiOiB7XG4gICAgICAgIGVuc3VyZShcbiAgICAgICAgICAhdGhpcy5jb3JyZWN0aW9ucy5zb21lKChjKSA9PiBjLmlkID09PSBjb21tYW5kLmNvcnJlY3Rpb24uaWQpLFxuICAgICAgICAgIFwiXHU4QkEyXHU2QjYzXHU3MjQ4XHU2NzJDXHU0RTBEXHU1M0VGXHU4OTg2XHU3NkQ2XCIsXG4gICAgICAgICk7XG4gICAgICAgIGNvbW1hbmQuY29ycmVjdGlvbi5zdWJtaXR0ZWRBdCA9IGF0O1xuICAgICAgICBjb21tYW5kLmNvcnJlY3Rpb24uYWNjZXB0ZWQgPSBudWxsO1xuICAgICAgICBjb21tYW5kLmNvcnJlY3Rpb24uZmVlZGJhY2sgPSBcIlwiO1xuICAgICAgICBjb21tYW5kLmNvcnJlY3Rpb24ucmV2aWV3ZWRBdCA9IG51bGw7XG4gICAgICAgIGNvbnN0IHByb2plY3QgPSAoKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGdyYWRlID0gdGhpcy5ncmFkZXMuZmluZChcbiAgICAgICAgICAgIChnKSA9PiBnLmlkID09PSBjb21tYW5kLmNvcnJlY3Rpb24uZ3JhZGVJZCxcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmIChncmFkZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICBjb25zdCBzdWIgPSB0aGlzLnN1Ym1pc3Npb25zLmZpbmQoKHMpID0+IHMuaWQgPT09IGdyYWRlLnN1Ym1pc3Npb25JZCk7XG4gICAgICAgICAgaWYgKHN1YiA9PT0gdW5kZWZpbmVkKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICBjb25zdCBhID0gdGhpcy5hc3Nlc3NtZW50cy5maW5kKCh4KSA9PiB4LmlkID09PSBzdWIuYXNzZXNzbWVudElkKTtcbiAgICAgICAgICByZXR1cm4gYT8ucHJvamVjdElkID8/IG51bGw7XG4gICAgICAgIH0pKCk7XG4gICAgICAgIGVuc3VyZShwcm9qZWN0ICE9PSBudWxsLCBcIlx1OEJBMlx1NkI2M1x1N0YzQVx1NUMxMVx1NTM5Rlx1NTlDQlx1NjI3OVx1NjUzOVwiKTtcbiAgICAgICAgdGhpcy5ldmVudChwcm9qZWN0LCBcImNvcnJlY3Rpb25cIiwgY29tbWFuZC5jb3JyZWN0aW9uLmlkLCBhdCk7XG4gICAgICAgIHRoaXMuY29ycmVjdGlvbnMucHVzaChjb21tYW5kLmNvcnJlY3Rpb24pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJyZXZpZXdDb3JyZWN0aW9uXCI6IHtcbiAgICAgICAgY29uc3QgY29ycmVjdGlvbiA9IHRoaXMuY29ycmVjdGlvbnMuZmluZChcbiAgICAgICAgICAoYykgPT4gYy5pZCA9PT0gY29tbWFuZC5pZCAmJiBjLnJldmlld2VkQXQgPT09IG51bGwsXG4gICAgICAgICk7XG4gICAgICAgIGVuc3VyZShjb3JyZWN0aW9uICE9PSB1bmRlZmluZWQsIFwiXHU4QkEyXHU2QjYzXHU1REYyXHU2OEMwXHU2N0U1XHU2MjE2XHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICBlbnN1cmUoY2hlY2tUZXh0KGNvbW1hbmQuZmVlZGJhY2ssIDUwMDAwKSwgXCJcdThCQTJcdTZCNjNcdTY4QzBcdTY3RTVcdTk3MDBcdTg5ODFcdTUzQ0RcdTk5ODhcIik7XG4gICAgICAgIGNvcnJlY3Rpb24uYWNjZXB0ZWQgPSBjb21tYW5kLmFjY2VwdGVkO1xuICAgICAgICBjb3JyZWN0aW9uLmZlZWRiYWNrID0gY29tbWFuZC5mZWVkYmFjaztcbiAgICAgICAgY29ycmVjdGlvbi5yZXZpZXdlZEF0ID0gYXQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInNhdmVQcm9qZWN0XCI6IHtcbiAgICAgICAgdXBzZXJ0QnkodGhpcy5wcm9qZWN0cywgY29tbWFuZC5wcm9qZWN0LCAoeCkgPT4geC5wcm9qZWN0SWQpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJzYXZlUmVzb3VyY2VcIjoge1xuICAgICAgICB1cHNlcnRCeSh0aGlzLnJlc291cmNlcywgY29tbWFuZC5yZXNvdXJjZSwgKHgpID0+IHguaWQpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJzYXZlUmVzb3VyY2VzXCI6IHtcbiAgICAgICAgLy8gXHU2Mjc5XHU5MUNGXHU3NjdCXHU4QkIwXHU1M0VBXHU4NDNEXHU0RTAwXHU2QjIxXHU3NkQ4XHVGRjFBXHU5MDEwXHU2NzYxIHNhdmVSZXNvdXJjZSBcdTRGMUFcdThCQTkgcGxhbi5qc29uIFx1ODhBQlx1OTFDRFx1NTE5OSBOIFx1NkIyMVxuICAgICAgICAvLyBcdUZGMDhcdThENDRcdTY1OTlcdTVFOTNcdTUyQThcdThGODRcdTRFMEFcdTUzNDNcdTY3NjFcdUZGMDlcdUZGMENcdThGRDlcdTY2MkZcdTMwMENcdTYzMDlcdTk4NzlcdTc2RUVcdTY1NzRcdTc2RUVcdTVGNTVcdTVCRkNcdTUxNjVcdTMwMERcdTVGQzVcdTk4N0JcdThENzBcdTYyNzlcdTkxQ0ZcdTc2ODRcdTUzOUZcdTU2RTBcdTMwMDJcbiAgICAgICAgZm9yIChjb25zdCByZXNvdXJjZSBvZiBjb21tYW5kLnJlc291cmNlcykge1xuICAgICAgICAgIHVwc2VydEJ5KHRoaXMucmVzb3VyY2VzLCByZXNvdXJjZSwgKHgpID0+IHguaWQpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInJlbW92ZVJlc291cmNlc1wiOiB7XG4gICAgICAgIGVuc3VyZShjb21tYW5kLmlkcy5sZW5ndGggPiAwLCBcIlx1OEJGN1x1OTAwOVx1NjJFOVx1ODk4MVx1NkUwNVx1NzQwNlx1NzY4NFx1OEQ0NFx1NkU5MFx1NzY3Qlx1OEJCMFwiKTtcbiAgICAgICAgY29uc3QgcmVmZXJlbmNlZCA9IHRoaXMucmVzb3VyY2VSZWZlcmVuY2VJbmRleCgpO1xuICAgICAgICBjb25zdCBrbm93biA9IG5ldyBTZXQodGhpcy5yZXNvdXJjZXMubWFwKChyKSA9PiByLmlkKSk7XG4gICAgICAgIGZvciAoY29uc3QgaWQgb2YgY29tbWFuZC5pZHMpIHtcbiAgICAgICAgICBlbnN1cmUoa25vd24uaGFzKGlkKSwgXCJcdThENDRcdTZFOTBcdTc2N0JcdThCQjBcdTRFMERcdTVCNThcdTU3MjhcIik7XG4gICAgICAgICAgZW5zdXJlKFxuICAgICAgICAgICAgIXJlZmVyZW5jZWQuaGFzKGlkKSxcbiAgICAgICAgICAgIFwiXHU4RDQ0XHU2RTkwXHU0RUNEXHU4OEFCXHU2NTU5XHU1QjY2XHU5MTREXHU3RjZFXHU2MjE2XHU1Mzg2XHU1M0YyXHU4QkIwXHU1RjU1XHU1RjE1XHU3NTI4XHVGRjBDXHU4QkY3XHU0RkVFXHU1OTBEXHU4REVGXHU1Rjg0XHU1RTc2XHU0RkREXHU3NTU5XHU3NjdCXHU4QkIwXCIsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpZHMgPSBuZXcgU2V0KGNvbW1hbmQuaWRzKTtcbiAgICAgICAgdGhpcy5yZXNvdXJjZXMgPSB0aGlzLnJlc291cmNlcy5maWx0ZXIoKHIpID0+ICFpZHMuaGFzKHIuaWQpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwic2F2ZVNlbWVzdGVyXCI6IHtcbiAgICAgICAgY29uc3Qgb2xkID0gdGhpcy5zZW1lc3RlcnMuZmluZCgocykgPT4gcy5pZCA9PT0gY29tbWFuZC5zZW1lc3Rlci5pZCk7XG4gICAgICAgIGlmIChvbGQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGVuc3VyZShcbiAgICAgICAgICAgIGNvbW1hbmQuc2VtZXN0ZXIucmV2aXNpb24gPT09IG9sZC5yZXZpc2lvbiArIDEsXG4gICAgICAgICAgICBcIlx1NUI2Nlx1NjcxRlx1OEJBMVx1NTIxMlx1NjZGNFx1NjVCMFx1NUZDNVx1OTg3Qlx1OTAxMlx1NTg5RVx1NzI0OFx1NjcyQ1wiLFxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5zZW1lc3Rlckhpc3RvcnkucHVzaCh7XG4gICAgICAgICAgICAuLi5vbGQsXG4gICAgICAgICAgICBtaWxlc3RvbmVzOiBvbGQubWlsZXN0b25lcy5tYXAoKG0pID0+ICh7XG4gICAgICAgICAgICAgIC4uLm0sXG4gICAgICAgICAgICAgIHRvcGljczogWy4uLm0udG9waWNzXSxcbiAgICAgICAgICAgICAgcmVzb3VyY2VJZHM6IFsuLi5tLnJlc291cmNlSWRzXSxcbiAgICAgICAgICAgIH0pKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB1cHNlcnRCeSh0aGlzLnNlbWVzdGVycywgY29tbWFuZC5zZW1lc3RlciwgKHgpID0+IHguaWQpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJzYXZlTGVzc29uXCI6IHtcbiAgICAgICAgY29uc3Qgc2VtZXN0ZXIgPSB0aGlzLnNlbWVzdGVycy5maW5kKFxuICAgICAgICAgIChzKSA9PiBzLmlkID09PSBjb21tYW5kLmxlc3Nvbi5zZW1lc3RlcklkLFxuICAgICAgICApO1xuICAgICAgICBlbnN1cmUoc2VtZXN0ZXIgIT09IHVuZGVmaW5lZCwgXCJcdTVCNjZcdTY3MUZcdThCQTFcdTUyMTJcdTRFMERcdTVCNThcdTU3MjhcIik7XG4gICAgICAgIGNvbW1hbmQubGVzc29uLnNlbWVzdGVyUmV2aXNpb24gPSBzZW1lc3Rlci5yZXZpc2lvbjtcbiAgICAgICAgZW5zdXJlKGNvbW1hbmQubGVzc29uLnN0YXJ0c0F0ID4gYXQsIFwiXHU4QkZFXHU3QTBCXHU1RkM1XHU5ODdCXHU1Qjg5XHU2MzkyXHU1NzI4XHU2NzJBXHU2NzY1XCIpO1xuICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgIXRoaXMubGVzc29ucy5zb21lKFxuICAgICAgICAgICAgKGwpID0+XG4gICAgICAgICAgICAgIGwuaWQgPT09IGNvbW1hbmQubGVzc29uLmlkICYmXG4gICAgICAgICAgICAgIChsLnN0YXRlICE9PSBcInBsYW5uZWRcIiB8fCBsLmF0dGVuZGVkKSxcbiAgICAgICAgICApLFxuICAgICAgICAgIFwiXHU1REYyXHU1RjAwXHU1OUNCXHU4QkZFXHU3QTBCXHU0RkREXHU3NTU5XHU1Mzg2XHU1M0YyXHVGRjBDXHU0RTBEXHU4MEZEXHU2NTM5XHU1MTk5XCIsXG4gICAgICAgICk7XG4gICAgICAgIGNvbW1hbmQubGVzc29uLnN0YXRlID0gXCJwbGFubmVkXCI7XG4gICAgICAgIGNvbW1hbmQubGVzc29uLmF0dGVuZGVkID0gZmFsc2U7XG4gICAgICAgIHVwc2VydEJ5KHRoaXMubGVzc29ucywgY29tbWFuZC5sZXNzb24sICh4KSA9PiB4LmlkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwic2V0TGVzc29uUmVzb3VyY2VzXCI6IHtcbiAgICAgICAgY29uc3QgbGVzc29uID0gdGhpcy5sZXNzb25zLmZpbmQoKGwpID0+IGwuaWQgPT09IGNvbW1hbmQuaWQpO1xuICAgICAgICBlbnN1cmUobGVzc29uICE9PSB1bmRlZmluZWQsIFwiXHU4QkZFXHU3QTBCXHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgbGVzc29uLnN0YXRlID09PSBcInBsYW5uZWRcIiAmJlxuICAgICAgICAgICAgIWxlc3Nvbi5hdHRlbmRlZCAmJlxuICAgICAgICAgICAgbGVzc29uLnN0YXJ0c0F0ID4gYXQsXG4gICAgICAgICAgXCJcdThCRkVcdTdBMEJcdTVERjJcdTVGMDBcdTU5Q0JcdUZGMENcdTRFMERcdTgwRkRcdTRGRUVcdTY1MzlcdTYzMDdcdTVCOUFcdThENDRcdTY1OTlcIixcbiAgICAgICAgKTtcbiAgICAgICAgZW5zdXJlKFxuICAgICAgICAgIGNvbW1hbmQucmVzb3VyY2VJZHMuZXZlcnkoKGlkKSA9PlxuICAgICAgICAgICAgdGhpcy5yZXNvdXJjZXMuc29tZShcbiAgICAgICAgICAgICAgKHIpID0+IHIuaWQgPT09IGlkICYmIHIucHJvamVjdElkID09PSBsZXNzb24ucHJvamVjdElkLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICApLFxuICAgICAgICAgIFwiXHU1M0VBXHU4MEZEXHU2MzA3XHU1QjlBXHU2NzJDXHU5ODc5XHU3NkVFXHU3NjdCXHU4QkIwXHU3Njg0XHU4RDQ0XHU2NTk5XCIsXG4gICAgICAgICk7XG4gICAgICAgIGVuc3VyZShcbiAgICAgICAgICBuZXcgU2V0KGNvbW1hbmQucmVzb3VyY2VJZHMpLnNpemUgPT09IGNvbW1hbmQucmVzb3VyY2VJZHMubGVuZ3RoLFxuICAgICAgICAgIFwiXHU4QkZFXHU3QTBCXHU4RDQ0XHU2NTk5XHU0RTBEXHU4MEZEXHU5MUNEXHU1OTBEXHU2MzA3XHU1QjlBXCIsXG4gICAgICAgICk7XG4gICAgICAgIGxlc3Nvbi5yZXNvdXJjZUlkcyA9IFsuLi5jb21tYW5kLnJlc291cmNlSWRzXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwiYXR0ZW5kTGVzc29uXCI6IHtcbiAgICAgICAgY29uc3QgbGVzc29uID0gdGhpcy5sZXNzb25zLmZpbmQoKGwpID0+IGwuaWQgPT09IGNvbW1hbmQuaWQpO1xuICAgICAgICBlbnN1cmUobGVzc29uICE9PSB1bmRlZmluZWQsIFwiXHU4QkZFXHU3QTBCXHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgYXQgPj0gbGVzc29uLnN0YXJ0c0F0ICYmIGF0IDwgbGVzc29uLmVuZHNBdCxcbiAgICAgICAgICBcIlx1NTNFQVx1ODBGRFx1NTcyOFx1NEUwQVx1OEJGRVx1NjVGNlx1Nzg2RVx1OEJBNFx1NTNDMlx1NEUwRVwiLFxuICAgICAgICApO1xuICAgICAgICBsZXNzb24uYXR0ZW5kZWQgPSB0cnVlO1xuICAgICAgICBsZXNzb24ucHJvZ3Jlc3MgPSBjb21tYW5kLnByb2dyZXNzO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJwdWJsaXNoQXNzZXNzbWVudFwiOiB7XG4gICAgICAgIGVuc3VyZShcbiAgICAgICAgICB0aGlzLnByb2plY3RzLnNvbWUoXG4gICAgICAgICAgICAocCkgPT4gcC5wcm9qZWN0SWQgPT09IGNvbW1hbmQuYXNzZXNzbWVudC5wcm9qZWN0SWQgJiYgcC5leGFtTW9kZSxcbiAgICAgICAgICApLFxuICAgICAgICAgIFwiXHU1M0QxXHU1RTAzXHU0RjVDXHU0RTFBXHU1NDhDXHU4QkQ1XHU1Mzc3XHU1MjREXHU4QkY3XHU1NDJGXHU3NTI4XHU1RTk0XHU4QkQ1XHU2QTIxXHU1RjBGXCIsXG4gICAgICAgICk7XG4gICAgICAgIGVuc3VyZShcbiAgICAgICAgICAhdGhpcy5hc3Nlc3NtZW50cy5zb21lKChhKSA9PiBhLmlkID09PSBjb21tYW5kLmFzc2Vzc21lbnQuaWQpLFxuICAgICAgICAgIFwiXHU1REYyXHU1M0QxXHU1RTAzXHU5ODk4XHU3NkVFXHU1NDhDXHU4QkM0XHU1MjA2XHU2ODA3XHU1MUM2XHU0RTBEXHU1M0VGXHU0RkVFXHU2NTM5XHVGRjFCXHU4QkY3XHU1M0QxXHU1RTAzXHU2NUIwIElEIFx1NzY4NFx1NEZFRVx1OEJBMlx1NzI0OFwiLFxuICAgICAgICApO1xuICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgY29tbWFuZC5hc3Nlc3NtZW50LmtpbmQgPT09IFwiaG9tZXdvcmtcIlxuICAgICAgICAgICAgPyBjb21tYW5kLmFzc2Vzc21lbnQuZW5kc0F0ID4gYXRcbiAgICAgICAgICAgIDogZGF0ZUF0KGNvbW1hbmQuYXNzZXNzbWVudC5zdGFydHNBdCkgPj0gZGF0ZUF0KGF0KSxcbiAgICAgICAgICBcIlx1NEUwRFx1ODBGRFx1NTNEMVx1NUUwM1x1NURGMlx1NjIyQVx1NkI2Mlx1NzY4NFx1NEY1Q1x1NEUxQVx1NjIxNlx1NURGMlx1OEZDN1x1ODAwM1x1OEJENVx1NjVFNVx1NjcxRlx1NzY4NFx1OEJENVx1NTM3N1wiLFxuICAgICAgICApO1xuICAgICAgICBjb25zdCBzZW1lc3RlciA9IHRoaXMuc2VtZXN0ZXJzLmZpbmQoXG4gICAgICAgICAgKHMpID0+IHMuaWQgPT09IGNvbW1hbmQuYXNzZXNzbWVudC5zZW1lc3RlcklkLFxuICAgICAgICApO1xuICAgICAgICBlbnN1cmUoc2VtZXN0ZXIgIT09IHVuZGVmaW5lZCwgXCJcdTVCNjZcdTY3MUZcdThCQTFcdTUyMTJcdTRFMERcdTVCNThcdTU3MjhcIik7XG4gICAgICAgIGNvbW1hbmQuYXNzZXNzbWVudC5zZW1lc3RlclJldmlzaW9uID0gc2VtZXN0ZXIucmV2aXNpb247XG4gICAgICAgIGNvbW1hbmQuYXNzZXNzbWVudC5wdWJsaXNoZWRBdCA9IGF0O1xuICAgICAgICBjb21tYW5kLmFzc2Vzc21lbnQucHJpbnRlZEF0ID0gbnVsbDtcbiAgICAgICAgY29tbWFuZC5hc3Nlc3NtZW50LnN0YXJ0ZWRBdCA9IG51bGw7XG4gICAgICAgIGNvbW1hbmQuYXNzZXNzbWVudC5zdG9wcGVkQXQgPSBudWxsO1xuICAgICAgICB0aGlzLmFzc2Vzc21lbnRzLnB1c2goY29tbWFuZC5hc3Nlc3NtZW50KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwiY29uZmlybVByaW50ZWRcIjoge1xuICAgICAgICBjb25zdCBhID0gdGhpcy5hc3Nlc3NtZW50cy5maW5kKCh4KSA9PiB4LmlkID09PSBjb21tYW5kLmlkKTtcbiAgICAgICAgZW5zdXJlKGEgIT09IHVuZGVmaW5lZCwgXCJcdThCRDVcdTUzNzdcdTRFMERcdTVCNThcdTU3MjhcIik7XG4gICAgICAgIGEucHJpbnRlZEF0ID0gYXQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInN0YXJ0RXhhbVwiOiB7XG4gICAgICAgIGVuc3VyZShcbiAgICAgICAgICAhdGhpcy5hc3Nlc3NtZW50cy5zb21lKFxuICAgICAgICAgICAgKGEpID0+IGEuc3RhcnRlZEF0ICE9PSBudWxsICYmIGEuc3RvcHBlZEF0ID09PSBudWxsLFxuICAgICAgICAgICksXG4gICAgICAgICAgXCJcdThCRjdcdTUxNDhcdTdFRDNcdTY3NUZcdTVGNTNcdTUyNERcdTgwMDNcdThCRDVcIixcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgYSA9IHRoaXMuYXNzZXNzbWVudHMuZmluZCgoeCkgPT4geC5pZCA9PT0gY29tbWFuZC5pZCk7XG4gICAgICAgIGVuc3VyZShhICE9PSB1bmRlZmluZWQsIFwiXHU4QkQ1XHU1Mzc3XHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgYS5raW5kICE9PSBcImhvbWV3b3JrXCIgJiZcbiAgICAgICAgICAgIGEucHJpbnRlZEF0ICE9PSBudWxsICYmXG4gICAgICAgICAgICBhLnN0YXJ0ZWRBdCA9PT0gbnVsbCAmJlxuICAgICAgICAgICAgZGF0ZUF0KGF0KSA9PT0gZGF0ZUF0KGEuc3RhcnRzQXQpLFxuICAgICAgICAgIFwiXHU4QkY3XHU1MTQ4XHU2MjUzXHU1MzcwXHU4QkQ1XHU1Mzc3XHU0RTBFXHU3QjU0XHU5ODk4XHU1MzYxXHVGRjBDXHU1RTc2XHU1NzI4XHU4MDAzXHU4QkQ1XHU1Qjg5XHU2MzkyXHU1RjUzXHU1OTI5XHU1RjAwXHU1OUNCXHU4MDAzXHU4QkQ1XCIsXG4gICAgICAgICk7XG4gICAgICAgIGEuc3RhcnRlZEF0ID0gYXQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcImVuZEV4YW1cIjoge1xuICAgICAgICBjb25zdCBhID0gdGhpcy5hc3Nlc3NtZW50cy5maW5kKCh4KSA9PiB4LmlkID09PSBjb21tYW5kLmlkKTtcbiAgICAgICAgZW5zdXJlKGEgIT09IHVuZGVmaW5lZCwgXCJcdTgwMDNcdThCRDVcdTRFMERcdTVCNThcdTU3MjhcIik7XG4gICAgICAgIGVuc3VyZShcbiAgICAgICAgICBhLmtpbmQgIT09IFwiaG9tZXdvcmtcIiAmJiBhLnN0YXJ0ZWRBdCAhPT0gbnVsbCAmJiBhLnN0b3BwZWRBdCA9PT0gbnVsbCxcbiAgICAgICAgICBcIlx1ODAwM1x1OEJENVx1NUMxQVx1NjcyQVx1NUYwMFx1NTlDQlx1NjIxNlx1NURGMlx1N0VDRlx1NTA1Q1x1N0IxNFwiLFxuICAgICAgICApO1xuICAgICAgICBhLnN0b3BwZWRBdCA9IGF0O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJzdWJtaXRcIjoge1xuICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgIXRoaXMuc3VibWlzc2lvbnMuc29tZSgocykgPT4gcy5pZCA9PT0gY29tbWFuZC5zdWJtaXNzaW9uLmlkKSxcbiAgICAgICAgICBcIlx1NjNEMFx1NEVBNFx1NzI0OFx1NjcyQ1x1NEUwRFx1NTNFRlx1ODk4Nlx1NzZENlwiLFxuICAgICAgICApO1xuICAgICAgICBjb25zdCBhID0gdGhpcy5hc3Nlc3NtZW50cy5maW5kKFxuICAgICAgICAgICh4KSA9PiB4LmlkID09PSBjb21tYW5kLnN1Ym1pc3Npb24uYXNzZXNzbWVudElkLFxuICAgICAgICApO1xuICAgICAgICBlbnN1cmUoYSAhPT0gdW5kZWZpbmVkLCBcIlx1NEY1Q1x1NEUxQS9cdTgwMDNcdThCRDVcdTRFMERcdTVCNThcdTU3MjhcIik7XG4gICAgICAgIGVuc3VyZShhdCA+PSBhLnN0YXJ0c0F0LCBcIlx1NUMxQVx1NjcyQVx1NUYwMFx1NTlDQlx1RkYwQ1x1NEUwRFx1ODBGRFx1NjNEMFx1NEVBNFwiKTtcbiAgICAgICAgaWYgKGEua2luZCAhPT0gXCJob21ld29ya1wiKSB7XG4gICAgICAgICAgZW5zdXJlKFxuICAgICAgICAgICAgYS5zdGFydGVkQXQgIT09IG51bGwgJiYgYS5zdG9wcGVkQXQgIT09IG51bGwsXG4gICAgICAgICAgICBcIlx1ODAwM1x1OEJENVx1N0VEM1x1Njc1Rlx1NTA1Q1x1N0IxNFx1NTQwRVx1NjI0RFx1ODBGRFx1NEUwQVx1NEYyMFx1N0I1NFx1OTg5OFx1NTM2MVwiLFxuICAgICAgICAgICk7XG4gICAgICAgICAgZW5zdXJlKFxuICAgICAgICAgICAgY29tbWFuZC5zdWJtaXNzaW9uLnJlc291cmNlSWRzLmxlbmd0aCA+IDAsXG4gICAgICAgICAgICBcIlx1ODAwM1x1OEJENVx1OTcwMFx1ODk4MVx1NEUwQVx1NEYyMFx1N0VCOFx1OEQyOFx1N0I1NFx1OTg5OFx1NTM2MVwiLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgZW5zdXJlKFxuICAgICAgICAgIGNoZWNrVGV4dChjb21tYW5kLnN1Ym1pc3Npb24uYW5zd2VycywgNTAwMDApIHx8XG4gICAgICAgICAgICBjb21tYW5kLnN1Ym1pc3Npb24ucmVzb3VyY2VJZHMubGVuZ3RoID4gMCB8fFxuICAgICAgICAgICAgY29tbWFuZC5zdWJtaXNzaW9uLnVuZmluaXNoZWQsXG4gICAgICAgICAgXCJcdThCRjdcdTYzRDBcdTRGOUJcdTdCNTRcdTY4NDhcdTMwMDFcdTk2NDRcdTRFRjZcdTYyMTZcdTY4MDdcdThCQjBcdTY3MkFcdTVCOENcdTYyMTBcIixcbiAgICAgICAgKTtcbiAgICAgICAgY29tbWFuZC5zdWJtaXNzaW9uLnN1Ym1pdHRlZEF0ID0gYXQ7XG4gICAgICAgIGNvbnN0IHByb2plY3QgPSBhLnByb2plY3RJZDtcbiAgICAgICAgY29uc3Qgc291cmNlID0gY29tbWFuZC5zdWJtaXNzaW9uLmlkO1xuICAgICAgICB0aGlzLnN1Ym1pc3Npb25zLnB1c2goY29tbWFuZC5zdWJtaXNzaW9uKTtcbiAgICAgICAgdGhpcy5ldmVudChwcm9qZWN0LCBcImdyYWRlXCIsIHNvdXJjZSwgYXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJyZWNvcmRRdWVzdGlvblRpbWVzXCI6IHtcbiAgICAgICAgZW5zdXJlKGNvbW1hbmQucXVlc3Rpb25UaW1lcy5sZW5ndGggPiAwLCBcIlx1NkNBMVx1NjcwOVx1OTcwMFx1ODk4MVx1ODg2NVx1NUY1NVx1NzY4NFx1NUI4Q1x1NjIxMFx1NjVGNlx1NTIzQlwiKTtcbiAgICAgICAgZW5zdXJlKFxuICAgICAgICAgICF0aGlzLmdyYWRlcy5zb21lKChnKSA9PiBnLnN1Ym1pc3Npb25JZCA9PT0gY29tbWFuZC5pZCksXG4gICAgICAgICAgXCJcdTVERjJcdTYyNzlcdTY1MzlcdTc2ODRcdTdCNTRcdTUzNzdcdTRFMERcdTgwRkRcdTg4NjVcdTVGNTVcdTVCOENcdTYyMTBcdTY1RjZcdTUyM0JcIixcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3Qgc3VibWlzc2lvbiA9IHRoaXMuc3VibWlzc2lvbnMuZmluZCgocykgPT4gcy5pZCA9PT0gY29tbWFuZC5pZCk7XG4gICAgICAgIGVuc3VyZShzdWJtaXNzaW9uICE9PSB1bmRlZmluZWQsIFwiXHU2M0QwXHU0RUE0XHU3MjQ4XHU2NzJDXHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgY29tbWFuZC5xdWVzdGlvblRpbWVzLmV2ZXJ5KFxuICAgICAgICAgICAgKHQpID0+XG4gICAgICAgICAgICAgICFzdWJtaXNzaW9uLnF1ZXN0aW9uVGltZXMuc29tZShcbiAgICAgICAgICAgICAgICAoZXhpc3RpbmcpID0+IGV4aXN0aW5nLnF1ZXN0aW9uSWQgPT09IHQucXVlc3Rpb25JZCxcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICApLFxuICAgICAgICAgIFwiXHU1REYyXHU2NzA5XHU3Njg0XHU1QjhDXHU2MjEwXHU2NUY2XHU1MjNCXHU0RTBEXHU4MEZEXHU4OTg2XHU3NkQ2XCIsXG4gICAgICAgICk7XG4gICAgICAgIHN1Ym1pc3Npb24ucXVlc3Rpb25UaW1lcy5wdXNoKC4uLmNvbW1hbmQucXVlc3Rpb25UaW1lcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcImdyYWRlXCI6IHtcbiAgICAgICAgZW5zdXJlKFxuICAgICAgICAgICF0aGlzLmdyYWRlcy5zb21lKChnKSA9PiBnLmlkID09PSBjb21tYW5kLmdyYWRlLmlkKSxcbiAgICAgICAgICBcIlx1NjI3OVx1NjUzOVx1NTM4Nlx1NTNGMlx1NEUwRFx1NTNFRlx1ODk4Nlx1NzZENlx1RkYwQ1x1NTkwRFx1NjgzOFx1OEJGN1x1NjVCMFx1NTg5RVx1NjI3OVx1NjUzOVx1OEJCMFx1NUY1NVwiLFxuICAgICAgICApO1xuICAgICAgICBjb21tYW5kLmdyYWRlLmdyYWRlZEF0ID0gYXQ7XG4gICAgICAgIHRoaXMuZ3JhZGVzLnB1c2goY29tbWFuZC5ncmFkZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInNhdmVSZXZpZXdcIjoge1xuICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgIXRoaXMucmV2aWV3cy5zb21lKChyKSA9PiByLmlkID09PSBjb21tYW5kLnJldmlldy5pZCksXG4gICAgICAgICAgXCJcdTU5MERcdTc2RDhcdTUzODZcdTUzRjJcdTRFMERcdTUzRUZcdTg5ODZcdTc2RDZcIixcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5yZXZpZXdzLnB1c2goY29tbWFuZC5yZXZpZXcpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJjbGFpbUV2ZW50XCI6IHtcbiAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLmV2ZW50cy5maW5kKFxuICAgICAgICAgIChlKSA9PiBlLmlkID09PSBjb21tYW5kLmlkICYmIGUuc3RhdGUgPT09IFwicGVuZGluZ1wiLFxuICAgICAgICApO1xuICAgICAgICBlbnN1cmUoZXZlbnQgIT09IHVuZGVmaW5lZCwgXCJcdTRFOEJcdTRFRjZcdTVERjJcdTU5MDRcdTc0MDZcIik7XG4gICAgICAgIGV2ZW50LnN0YXRlID0gXCJydW5uaW5nXCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcImZpbmlzaEV2ZW50XCI6IHtcbiAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLmV2ZW50cy5maW5kKChlKSA9PiBlLmlkID09PSBjb21tYW5kLmlkKTtcbiAgICAgICAgZW5zdXJlKGV2ZW50ICE9PSB1bmRlZmluZWQsIFwiXHU2NTU5XHU1QjY2XHU0RThCXHU0RUY2XHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICBjb25zdCBwcm9kdWNlZCA9ICgoKSA9PiB7XG4gICAgICAgICAgc3dpdGNoIChldmVudC5raW5kKSB7XG4gICAgICAgICAgICBjYXNlIFwiaG9tZXdvcmtcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXNzZXNzbWVudHMuc29tZShcbiAgICAgICAgICAgICAgICAoYSkgPT5cbiAgICAgICAgICAgICAgICAgIGEucHJvamVjdElkID09PSBldmVudC5wcm9qZWN0SWQgJiZcbiAgICAgICAgICAgICAgICAgIGEua2luZCA9PT0gXCJob21ld29ya1wiICYmXG4gICAgICAgICAgICAgICAgICBhLmxlc3NvbklkID09PSBldmVudC5zb3VyY2VJZCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGNhc2UgXCJ0YXNrSG9tZXdvcmtcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXNzZXNzbWVudHMuc29tZShcbiAgICAgICAgICAgICAgICAoYSkgPT5cbiAgICAgICAgICAgICAgICAgIGEua2luZCA9PT0gXCJob21ld29ya1wiICYmXG4gICAgICAgICAgICAgICAgICBhLnByb2plY3RJZCA9PT0gZXZlbnQucHJvamVjdElkICYmXG4gICAgICAgICAgICAgICAgICBhLnRhc2tJZCA9PT0gZXZlbnQuc291cmNlSWQsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjYXNlIFwiY29ycmVjdGlvblwiOlxuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb3JyZWN0aW9ucy5zb21lKFxuICAgICAgICAgICAgICAgIChjKSA9PiBjLmlkID09PSBldmVudC5zb3VyY2VJZCAmJiBjLnJldmlld2VkQXQgIT09IG51bGwsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjYXNlIFwid2Vla2x5RXhhbVwiOlxuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hc3Nlc3NtZW50cy5zb21lKFxuICAgICAgICAgICAgICAgIChhKSA9PlxuICAgICAgICAgICAgICAgICAgYS5wcm9qZWN0SWQgPT09IGV2ZW50LnByb2plY3RJZCAmJlxuICAgICAgICAgICAgICAgICAgYS5raW5kID09PSBcIndlZWtseUV4YW1cIiAmJlxuICAgICAgICAgICAgICAgICAgYS5wdWJsaXNoZWRBdCA+PSBldmVudC5jcmVhdGVkQXQsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjYXNlIFwiZ3JhZGVcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ3JhZGVzLnNvbWUoKGcpID0+IGcuc3VibWlzc2lvbklkID09PSBldmVudC5zb3VyY2VJZCk7XG4gICAgICAgICAgICBjYXNlIFwicmV2aWV3XCI6XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnJldmlld3Muc29tZShcbiAgICAgICAgICAgICAgICAocikgPT5cbiAgICAgICAgICAgICAgICAgIHIucHJvamVjdElkID09PSBldmVudC5wcm9qZWN0SWQgJiZcbiAgICAgICAgICAgICAgICAgIGV2ZW50LnNvdXJjZUlkLmVuZHNXaXRoKHIuZGF0ZSksXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9KSgpO1xuICAgICAgICBlbnN1cmUocHJvZHVjZWQsIFwiXHU4QkY3XHU1MTQ4XHU0RkREXHU1QjU4XHU2NzJDXHU2QjIxXHU2NTU5XHU1QjY2XHU0RThCXHU0RUY2XHU3Njg0XHU1QjlFXHU5NjQ1XHU0RUE3XHU3MjY5XCIpO1xuICAgICAgICBldmVudC5zdGF0ZSA9IFwiZG9uZVwiO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJyZXRyeUV2ZW50XCI6IHtcbiAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLmV2ZW50cy5maW5kKFxuICAgICAgICAgIChlKSA9PiBlLmlkID09PSBjb21tYW5kLmlkICYmIGUuc3RhdGUgIT09IFwiZG9uZVwiLFxuICAgICAgICApO1xuICAgICAgICBlbnN1cmUoZXZlbnQgIT09IHVuZGVmaW5lZCwgXCJcdTZDQTFcdTY3MDlcdTUzRUZcdTkxQ0RcdThCRDVcdTc2ODRcdTY1NTlcdTVCNjZcdTRFOEJcdTRFRjZcIik7XG4gICAgICAgIGV2ZW50LnN0YXRlID0gXCJwZW5kaW5nXCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB1cHNlcnRCeTxUPihsaXN0OiBUW10sIHZhbHVlOiBULCBrZXk6ICh4OiBUKSA9PiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgayA9IGtleSh2YWx1ZSk7XG4gIGNvbnN0IGluZGV4ID0gbGlzdC5maW5kSW5kZXgoKHgpID0+IGtleSh4KSA9PT0gayk7XG4gIGlmIChpbmRleCA+PSAwKSB7XG4gICAgbGlzdFtpbmRleF0gPSB2YWx1ZTtcbiAgfSBlbHNlIHtcbiAgICBsaXN0LnB1c2godmFsdWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvbXBsZXRlZFN0dWR5VGFza0Zyb21UYXNrKFxuICB0YXNrOiBUYXNrLFxuICBhdDogbnVtYmVyLFxuKTogQ29tcGxldGVkU3R1ZHlUYXNrIHwgbnVsbCB7XG4gIGlmICh0YXNrLnByb2plY3RJZCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIHJldHVybiB7XG4gICAgaWQ6IHRhc2suaWQsXG4gICAgcHJvamVjdElkOiB0YXNrLnByb2plY3RJZCxcbiAgICB0aXRsZTogdGFzay50aXRsZSxcbiAgICBub3RlczogdGFzay5ub3RlcyxcbiAgICB0b3BpY3M6IFsuLi50YXNrLnRhZ3NdLFxuICAgIGNvbXBsZXRlZEF0OiBhdCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gaG91ck1pbnV0ZU5vdyhhdDogbnVtYmVyKTogc3RyaW5nIHtcbiAgY29uc3QgZCA9IG5ldyBEYXRlKGF0ICogMTAwMCk7XG4gIHJldHVybiBgJHtTdHJpbmcoZC5nZXRIb3VycygpKS5wYWRTdGFydCgyLCBcIjBcIil9OiR7U3RyaW5nKGQuZ2V0TWludXRlcygpKS5wYWRTdGFydCgyLCBcIjBcIil9YDtcbn1cblxuLy8gLS0tLS0tLS0tLSBcdTY4MjFcdTlBOEMgLS0tLS0tLS0tLVxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVFZHVjYXRpb24oZGF0YTogQXBwRGF0YSk6IHZvaWQge1xuICBjb25zdCBlID0gZGF0YS5lZHVjYXRpb247XG4gIHVuaXF1ZUVkdWNhdGlvbklkcyhbXG4gICAgLi4uZS5yZXNvdXJjZXMubWFwKCh4KSA9PiB4LmlkKSxcbiAgICAuLi5lLnNlbWVzdGVycy5tYXAoKHgpID0+IHguaWQpLFxuICAgIC4uLmUubGVzc29ucy5tYXAoKHgpID0+IHguaWQpLFxuICAgIC4uLmUuYXNzZXNzbWVudHMubWFwKCh4KSA9PiB4LmlkKSxcbiAgICAuLi5lLnN1Ym1pc3Npb25zLm1hcCgoeCkgPT4geC5pZCksXG4gICAgLi4uZS5ncmFkZXMubWFwKCh4KSA9PiB4LmlkKSxcbiAgICAuLi5lLnJldmlld3MubWFwKCh4KSA9PiB4LmlkKSxcbiAgXSk7XG4gIHVuaXF1ZUVkdWNhdGlvbklkcyhlLnByb2plY3RzLm1hcCgocCkgPT4gcC5wcm9qZWN0SWQpKTtcbiAgdW5pcXVlRWR1Y2F0aW9uSWRzKGUuZXZlbnRzLm1hcCgocCkgPT4gcC5pZCkpO1xuICBjb25zdCBwcm9qZWN0RXhpc3RzID0gKGlkOiBzdHJpbmcpOiBib29sZWFuID0+XG4gICAgZGF0YS5wcm9qZWN0cy5zb21lKChwKSA9PiBwLmlkID09PSBpZCk7XG4gIGNvbnN0IHJlc291cmNlID0gKGlkOiBzdHJpbmcsIHA6IHN0cmluZyk6IFJlc291cmNlIHwgdW5kZWZpbmVkID0+XG4gICAgZS5yZXNvdXJjZXMuZmluZCgocikgPT4gci5pZCA9PT0gaWQgJiYgci5wcm9qZWN0SWQgPT09IHApO1xuICBlbnN1cmUoXG4gICAgZS5sZXNzb25zLmxlbmd0aCArXG4gICAgICBlLmFzc2Vzc21lbnRzLmxlbmd0aCArXG4gICAgICBlLnN1Ym1pc3Npb25zLmxlbmd0aCArXG4gICAgICBlLmdyYWRlcy5sZW5ndGggPD1cbiAgICAgIDEwMDAwMCxcbiAgICBcIlx1NjU1OVx1NUI2Nlx1OEJCMFx1NUY1NVx1NjU3MFx1OTFDRlx1OEQ4NVx1NTFGQVx1OTY1MFx1NTIzNlwiLFxuICApO1xuICBmb3IgKGNvbnN0IHAgb2YgZS5wcm9qZWN0cykge1xuICAgIGVuc3VyZShcbiAgICAgIHByb2plY3RFeGlzdHMocC5wcm9qZWN0SWQpICYmIGlzQWJzb2x1dGVQYXRoKHAuZGlyZWN0b3J5KSxcbiAgICAgIFwiXHU5ODc5XHU3NkVFXHU1RkM1XHU5ODdCXHU3RUQxXHU1QjlBXHU3RUREXHU1QkY5XHU3NkVFXHU1RjU1XCIsXG4gICAgKTtcbiAgICBlbnN1cmUoXG4gICAgICBwLmV4YW1EYXRlID09PSBudWxsIHx8IHZhbGlkRWR1Y2F0aW9uRGF0ZShwLmV4YW1EYXRlKSxcbiAgICAgIFwiXHU2NUUwXHU2NTQ4XHU3Njg0XHU4MDAzXHU4QkQ1XHU2NUU1XHU2NzFGXCIsXG4gICAgKTtcbiAgICBpZiAocC5leGFtTW9kZSkge1xuICAgICAgZW5zdXJlKFxuICAgICAgICBwLnZpc2lvbklkICE9PSBudWxsICYmXG4gICAgICAgICAgZGF0YS52aXNpb25zLnNvbWUoKHYpID0+IHYuaWQgPT09IHAudmlzaW9uSWQpICYmXG4gICAgICAgICAgY2hlY2tUZXh0KHAudGFyZ2V0LCA1MDAwMCksXG4gICAgICAgIFwiXHU1RTk0XHU4QkQ1XHU2QTIxXHU1RjBGXHU1RkM1XHU5ODdCXHU3RUQxXHU1QjlBXHU2MTNGXHU2NjZGXHU1RTc2XHU2NjBFXHU3ODZFXHU5NjYyXHU2ODIxXHUzMDAxXHU0RTEzXHU0RTFBXHUzMDAxXHU1RTc0XHU0RUZEXHU1NDhDXHU3OUQxXHU3NkVFXHU3NkVFXHU2ODA3XCIsXG4gICAgICApO1xuICAgICAgZW5zdXJlKFxuICAgICAgICBwLnN5bGxhYnVzSWQgIT09IG51bGwgJiZcbiAgICAgICAgICByZXNvdXJjZShwLnN5bGxhYnVzSWQsIHAucHJvamVjdElkKT8ua2luZCA9PT0gXCJzeWxsYWJ1c1wiLFxuICAgICAgICBcIlx1NUU5NFx1OEJENVx1NkEyMVx1NUYwRlx1NUZDNVx1OTg3Qlx1N0VEMVx1NUI5QVx1ODAwM1x1N0VCMlwiLFxuICAgICAgKTtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgcC5wYXN0UGFwZXJJZHMubGVuZ3RoID4gMCAmJlxuICAgICAgICAgIHAucGFzdFBhcGVySWRzLmV2ZXJ5KFxuICAgICAgICAgICAgKGlkKSA9PiByZXNvdXJjZShpZCwgcC5wcm9qZWN0SWQpPy5raW5kID09PSBcInBhc3RQYXBlclwiLFxuICAgICAgICAgICksXG4gICAgICAgIFwiXHU1RTk0XHU4QkQ1XHU2QTIxXHU1RjBGXHU1RkM1XHU5ODdCXHU3RUQxXHU1QjlBXHU3NzFGXHU5ODk4XCIsXG4gICAgICApO1xuICAgICAgZW5zdXJlKFxuICAgICAgICBwLm1vY2tQYXBlcklkcy5sZW5ndGggPiAwICYmXG4gICAgICAgICAgcC5tb2NrUGFwZXJJZHMuZXZlcnkoXG4gICAgICAgICAgICAoaWQpID0+IHJlc291cmNlKGlkLCBwLnByb2plY3RJZCk/LmtpbmQgPT09IFwibW9ja1BhcGVyXCIsXG4gICAgICAgICAgKSxcbiAgICAgICAgXCJcdTVFOTRcdThCRDVcdTZBMjFcdTVGMEZcdTVGQzVcdTk4N0JcdTdFRDFcdTVCOUFcdTZBMjFcdTYyREZcdTk4OThcIixcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgciBvZiBlLnJlc291cmNlcykge1xuICAgIGVuc3VyZShcbiAgICAgIGUucHJvamVjdHMuc29tZSgocCkgPT4gcC5wcm9qZWN0SWQgPT09IHIucHJvamVjdElkKSAmJlxuICAgICAgICBjaGVja1RleHQoci50aXRsZSwgNTAwMDApICYmXG4gICAgICAgIGlzUmVsYXRpdmVQYXRoKHIucGF0aCksXG4gICAgICBcIlx1OEQ0NFx1NkU5MFx1OTcwMFx1ODk4MVx1NjI0MFx1NUM1RVx1OTg3OVx1NzZFRVx1MzAwMVx1NTQwRFx1NzlGMFx1NTQ4Q1x1NUI4OVx1NTE2OFx1NzY4NFx1NzZGOFx1NUJGOVx1OERFRlx1NUY4NFwiLFxuICAgICk7XG4gIH1cbiAgZm9yIChjb25zdCBzIG9mIGUuc2VtZXN0ZXJzKSB7XG4gICAgZW5zdXJlKFxuICAgICAgZS5wcm9qZWN0cy5zb21lKChwKSA9PiBwLnByb2plY3RJZCA9PT0gcy5wcm9qZWN0SWQpICYmXG4gICAgICAgIGNoZWNrVGV4dChzLnRpdGxlLCA1MDAwMCkgJiZcbiAgICAgICAgdmFsaWRFZHVjYXRpb25EYXRlKHMuc3RhcnREYXRlKSAmJlxuICAgICAgICB2YWxpZEVkdWNhdGlvbkRhdGUocy5lbmREYXRlKSAmJlxuICAgICAgICBzLnN0YXJ0RGF0ZSA8PSBzLmVuZERhdGUgJiZcbiAgICAgICAgcy5yZXZpc2lvbiA+IDAgJiZcbiAgICAgICAgY2hlY2tUZXh0KHMuYmFzZWxpbmUsIDUwMDAwKSAmJlxuICAgICAgICBjaGVja1RleHQocy5yYXRpb25hbGUsIDUwMDAwKSAmJlxuICAgICAgICBzLmV2aWRlbmNlLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgcy5taWxlc3RvbmVzLmxlbmd0aCA+IDAsXG4gICAgICBcIlx1NUI2Nlx1NjcxRlx1OEJBMVx1NTIxMlx1N0YzQVx1NUMxMVx1NjVFNVx1NjcxRlx1MzAwMVx1NUI2Nlx1NjBDNVx1OEJDQVx1NjVBRFx1MzAwMVx1NEY5RFx1NjM2RVx1NjIxNlx1OTYzNlx1NkJCNVx1OEZEQlx1NUVBNlwiLFxuICAgICk7XG4gICAgZm9yIChjb25zdCBtIG9mIHMubWlsZXN0b25lcykge1xuICAgICAgZW5zdXJlKFxuICAgICAgICBtLndlZWsgPiAwICYmXG4gICAgICAgICAgbS50b3BpY3MubGVuZ3RoID4gMCAmJlxuICAgICAgICAgIGNoZWNrVGV4dChtLm9iamVjdGl2ZSwgNTAwMDApICYmXG4gICAgICAgICAgbS5sZXNzb25Db3VudCA+IDAgJiZcbiAgICAgICAgICBtLnJlc291cmNlSWRzLmV2ZXJ5KChpZCkgPT4gcmVzb3VyY2UoaWQsIHMucHJvamVjdElkKSAhPT0gdW5kZWZpbmVkKSxcbiAgICAgICAgXCJcdTY1RTBcdTY1NDhcdTc2ODRcdTU0NjhcdThGREJcdTVFQTZcdTYyMTZcdTVCNjZcdTRFNjBcdThENDRcdTZFOTBcIixcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgbCBvZiBlLmxlc3NvbnMpIHtcbiAgICBjb25zdCBzID0gWy4uLmUuc2VtZXN0ZXJzLCAuLi5lLnNlbWVzdGVySGlzdG9yeV0uZmluZChcbiAgICAgICh4KSA9PlxuICAgICAgICB4LmlkID09PSBsLnNlbWVzdGVySWQgJiZcbiAgICAgICAgeC5wcm9qZWN0SWQgPT09IGwucHJvamVjdElkICYmXG4gICAgICAgIHgucmV2aXNpb24gPT09IGwuc2VtZXN0ZXJSZXZpc2lvbixcbiAgICApO1xuICAgIGVuc3VyZShzICE9PSB1bmRlZmluZWQsIFwiXHU4QkZFXHU3QTBCXHU1RkM1XHU5ODdCXHU3RUQxXHU1QjlBXHU2NzJDXHU5ODc5XHU3NkVFXHU1QjY2XHU2NzFGXHU4QkExXHU1MjEyXCIpO1xuICAgIGVuc3VyZShcbiAgICAgIGNoZWNrVGV4dChsLnRpdGxlLCA1MDAwMCkgJiZcbiAgICAgICAgbC50b3BpY3MubGVuZ3RoID4gMCAmJlxuICAgICAgICBsLmVuZHNBdCAtIGwuc3RhcnRzQXQgPT09IDQ1ICogNjAgJiZcbiAgICAgICAgZGF0ZUF0KGwuc3RhcnRzQXQpID49IHMuc3RhcnREYXRlICYmXG4gICAgICAgIGRhdGVBdChsLmVuZHNBdCkgPD0gcy5lbmREYXRlICYmXG4gICAgICAgIGwucmVzb3VyY2VJZHMuZXZlcnkoKGlkKSA9PiByZXNvdXJjZShpZCwgbC5wcm9qZWN0SWQpICE9PSB1bmRlZmluZWQpLFxuICAgICAgXCJcdThCRkVcdTdBMEJcdTk3MDBcdTg5ODE0NVx1NTIwNlx1OTQ5Rlx1MzAwMVx1NzdFNVx1OEJDNlx1NzBCOVx1NTQ4Q1x1NjcwOVx1NjU0OFx1OEQ0NFx1NkU5MFx1RkYwQ1x1NEUxNFx1NTcyOFx1NUI2Nlx1NjcxRlx1ODMwM1x1NTZGNFx1NTE4NVwiLFxuICAgICk7XG4gICAgY29uc3QgbWludXRlID0gTWF0aC5mbG9vcihtaW51dGVzT2YoaG91ck1pbnV0ZU5vdyhsLnN0YXJ0c0F0KSkgPz8gMCk7XG4gICAgZW5zdXJlKFxuICAgICAgKG1pbnV0ZSA+PSA4ICogNjAgJiYgbWludXRlIDwgMTIgKiA2MCArIDQwKSB8fFxuICAgICAgICAobWludXRlID49IDE0ICogNjAgJiYgbWludXRlIDwgMTggKiA2MCArIDE1KSxcbiAgICAgIFwiXHU4QkZFXHU3QTBCXHU5ODdCXHU1NzI4XHU0RTBBXHU1MzQ4XHU2MjE2XHU0RTBCXHU1MzQ4XHVGRjBDXHU2NjVBXHU5NUY0MTlcdTIwMTMyMlx1NzBCOVx1NzU1OVx1N0VEOVx1NEY1Q1x1NEUxQVwiLFxuICAgICk7XG4gICAgY29uc3Qgc2FtZSA9IGUubGVzc29ucy5maWx0ZXIoXG4gICAgICAoeCkgPT4gZGF0ZUF0KHguc3RhcnRzQXQpID09PSBkYXRlQXQobC5zdGFydHNBdCksXG4gICAgKTtcbiAgICBsZXQgbW9ybmluZyA9IDA7XG4gICAgbGV0IGFmdGVybm9vbiA9IDA7XG4gICAgZm9yIChjb25zdCB4IG9mIHNhbWUpIHtcbiAgICAgIGNvbnN0IGggPSBuZXcgRGF0ZSh4LnN0YXJ0c0F0ICogMTAwMCkuZ2V0SG91cnMoKTtcbiAgICAgIGlmIChoIDwgMTIpIG1vcm5pbmcgKz0gMTtcbiAgICAgIGVsc2UgYWZ0ZXJub29uICs9IDE7XG4gICAgfVxuICAgIGVuc3VyZShtb3JuaW5nIDw9IDQgJiYgYWZ0ZXJub29uIDw9IDQsIFwiXHU4REU4XHU5ODc5XHU3NkVFXHU2QkNGXHU1OTI5XHU2NzAwXHU1OTFBXHU0RTBBXHU1MzQ4NFx1ODI4Mlx1MzAwMVx1NEUwQlx1NTM0ODRcdTgyODJcIik7XG4gICAgZW5zdXJlKFxuICAgICAgIWUubGVzc29ucy5zb21lKFxuICAgICAgICAoeCkgPT4geC5pZCAhPT0gbC5pZCAmJiB4LnN0YXJ0c0F0IDwgbC5lbmRzQXQgJiYgeC5lbmRzQXQgPiBsLnN0YXJ0c0F0LFxuICAgICAgKSxcbiAgICAgIFwiXHU4REU4XHU5ODc5XHU3NkVFXHU4QkZFXHU3QTBCXHU2NUY2XHU5NUY0XHU1MUIyXHU3QTgxXCIsXG4gICAgKTtcbiAgICBjb25zdCBkYXRlID0gZGF0ZUF0KGwuc3RhcnRzQXQpO1xuICAgIGZvciAoY29uc3QgYiBvZiBkYXRhLmJsb2Nrcykge1xuICAgICAgaWYgKGIuYXR0ZW50aW9uID09PSBcInJlcXVpcmVkXCIpIHtcbiAgICAgICAgZW5zdXJlKFxuICAgICAgICAgIG92ZXJsYXBNaW51dGVzT2ZCbG9jayhiLCBkYXRlLCBtaW51dGUsIG1pbnV0ZSArIDQ1KSA9PT0gMCxcbiAgICAgICAgICBcIlx1OEJGRVx1N0EwQlx1NEUwRVx1OTcwMFx1NEUxM1x1NUZDM1x1NzY4NFx1NTZGQVx1NUI5QVx1NTM2MFx1NzUyOFx1NTFCMlx1N0E4MVwiLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IGEgb2YgZS5hc3Nlc3NtZW50cykge1xuICAgIGVuc3VyZShcbiAgICAgIGUucHJvamVjdHMuc29tZSgocCkgPT4gcC5wcm9qZWN0SWQgPT09IGEucHJvamVjdElkKSxcbiAgICAgIFwiQUlcdTRGNUNcdTRFMUFcdTU0OENcdTgwMDNcdThCRDVcdTk3MDBcdTg5ODFcdTU0MkZcdTc1MjhcdTVFOTRcdThCRDVcdTZBMjFcdTVGMEZcIixcbiAgICApO1xuICAgIGVuc3VyZShcbiAgICAgIFsuLi5lLnNlbWVzdGVycywgLi4uZS5zZW1lc3Rlckhpc3RvcnldLnNvbWUoXG4gICAgICAgIChzKSA9PlxuICAgICAgICAgIHMuaWQgPT09IGEuc2VtZXN0ZXJJZCAmJlxuICAgICAgICAgIHMucHJvamVjdElkID09PSBhLnByb2plY3RJZCAmJlxuICAgICAgICAgIHMucmV2aXNpb24gPT09IGEuc2VtZXN0ZXJSZXZpc2lvbixcbiAgICAgICksXG4gICAgICBcIlx1OEJENVx1OTg5OFx1NUZDNVx1OTg3Qlx1N0VEMVx1NUI5QVx1NUI2Nlx1NjcxRlx1OEJBMVx1NTIxMlwiLFxuICAgICk7XG4gICAgZW5zdXJlKFxuICAgICAgYS5yZXZpc2lvbiA+IDAgJiZcbiAgICAgICAgYS5zdGFydHNBdCA8IGEuZW5kc0F0ICYmXG4gICAgICAgIGNoZWNrVGV4dChhLnRpdGxlLCA1MDAwMCkgJiZcbiAgICAgICAgY2hlY2tUZXh0KGEucmV2aWV3RXZpZGVuY2UsIDUwMDAwKSAmJlxuICAgICAgICBjaGVja1RleHQoYS5pbnN0cnVjdGlvbnMsIDUwMDAwKSAmJlxuICAgICAgICBhLnF1ZXN0aW9ucy5sZW5ndGggPiAwLFxuICAgICAgXCJcdTUzRDFcdTVFMDNcdTUyNERcdTVGQzVcdTk4N0JcdTUxQzZcdTU5MDdcdTk4OThcdTc2RUVcdTMwMDFcdTgwMDNcdThCRDVcdThCRjRcdTY2MEVcdTMwMDFcdTdCNTRcdTY4NDhcdTU0OENcdTcyRUNcdTdBQ0JcdTU5MERcdTY4MzhcdThCQjBcdTVGNTVcIixcbiAgICApO1xuICAgIGlmIChhLmtpbmQgPT09IFwiaG9tZXdvcmtcIikge1xuICAgICAgZW5zdXJlKFxuICAgICAgICAoYS50YXNrSWQgPT09IG51bGwgJiZcbiAgICAgICAgICBhLmxlc3NvbklkICE9PSBudWxsICYmXG4gICAgICAgICAgZS5sZXNzb25zLnNvbWUoXG4gICAgICAgICAgICAobCkgPT5cbiAgICAgICAgICAgICAgbC5pZCA9PT0gYS5sZXNzb25JZCAmJlxuICAgICAgICAgICAgICBsLnByb2plY3RJZCA9PT0gYS5wcm9qZWN0SWQgJiZcbiAgICAgICAgICAgICAgbC5haUVuYWJsZWQgJiZcbiAgICAgICAgICAgICAgbC5zdGF0ZSA9PT0gXCJlbmRlZFwiLFxuICAgICAgICAgICkpIHx8XG4gICAgICAgICAgKGEubGVzc29uSWQgPT09IG51bGwgJiZcbiAgICAgICAgICAgIGEudGFza0lkICE9PSBudWxsICYmXG4gICAgICAgICAgICBlLmNvbXBsZXRlZFRhc2tzLnNvbWUoXG4gICAgICAgICAgICAgICh0KSA9PiB0LmlkID09PSBhLnRhc2tJZCAmJiB0LnByb2plY3RJZCA9PT0gYS5wcm9qZWN0SWQsXG4gICAgICAgICAgICApKSxcbiAgICAgICAgXCJcdTRGNUNcdTRFMUFcdTVGQzVcdTk4N0JcdTY3NjVcdTgxRUFcdTY3MkNcdTk4NzlcdTc2RUVcdTVERjJcdTdFRDNcdTY3NUZcdTc2ODRBSVx1OEJGRVx1N0EwQlx1NjIxNlx1NURGMlx1NUI4Q1x1NjIxMFx1NUI2Nlx1NEU2MFx1NEVGQlx1NTJBMVwiLFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKGEua2luZCA9PT0gXCJyZXRlc3RcIikge1xuICAgICAgZW5zdXJlKFxuICAgICAgICBhLnJldGVzdE9mR3JhZGVJZCAhPT0gbnVsbCAmJlxuICAgICAgICAgIGUuZ3JhZGVzLnNvbWUoKGcpID0+IHtcbiAgICAgICAgICAgIGlmIChnLmlkICE9PSBhLnJldGVzdE9mR3JhZGVJZCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGUuc3VibWlzc2lvbnMuc29tZSgocykgPT4ge1xuICAgICAgICAgICAgICBpZiAocy5pZCAhPT0gZy5zdWJtaXNzaW9uSWQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgcmV0dXJuIGUuYXNzZXNzbWVudHMuc29tZShcbiAgICAgICAgICAgICAgICAob3JpZ2luYWwpID0+XG4gICAgICAgICAgICAgICAgICBvcmlnaW5hbC5pZCA9PT0gcy5hc3Nlc3NtZW50SWQgJiZcbiAgICAgICAgICAgICAgICAgIG9yaWdpbmFsLnByb2plY3RJZCA9PT0gYS5wcm9qZWN0SWQsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KSxcbiAgICAgICAgXCJcdTU5MERcdTZENEJcdTVGQzVcdTk4N0JcdTUxNzNcdTgwNTRcdTY3MkNcdTk4NzlcdTc2RUVcdTUzOUZcdTU5Q0JcdTYyNzlcdTY1MzlcIixcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVuc3VyZShhLnJldGVzdE9mR3JhZGVJZCA9PT0gbnVsbCwgXCJcdTUzRUFcdTY3MDlcdTU5MERcdTZENEJcdTUzRUZcdTRFRTVcdTVGMTVcdTc1MjhcdTUzOUZcdTU5Q0JcdTYyNzlcdTY1MzlcIik7XG4gICAgfVxuICAgIGlmIChhLmtpbmQgPT09IFwid2Vla2x5RXhhbVwiKSB7XG4gICAgICBlbnN1cmUod2Vla2RheU1vbmRheShsb2NhbERhdGVPZihhLnN0YXJ0c0F0KSkgPj0gNiwgXCJcdTU0NjhcdTgwMDNcdTVCODlcdTYzOTJcdTU3MjhcdTU0NjhcdTY3MkJcIik7XG4gICAgfVxuICAgIGlmIChhLmtpbmQgIT09IFwiaG9tZXdvcmtcIikge1xuICAgICAgZW5zdXJlKFxuICAgICAgICAhZS5sZXNzb25zLnNvbWUoXG4gICAgICAgICAgKGwpID0+IGwuc3RhcnRzQXQgPCBhLmVuZHNBdCAmJiBsLmVuZHNBdCA+IGEuc3RhcnRzQXQsXG4gICAgICAgICkgJiZcbiAgICAgICAgICAhZS5hc3Nlc3NtZW50cy5zb21lKFxuICAgICAgICAgICAgKGIpID0+XG4gICAgICAgICAgICAgIGIuaWQgIT09IGEuaWQgJiZcbiAgICAgICAgICAgICAgYi5raW5kICE9PSBcImhvbWV3b3JrXCIgJiZcbiAgICAgICAgICAgICAgYi5zdGFydHNBdCA8IGEuZW5kc0F0ICYmXG4gICAgICAgICAgICAgIGIuZW5kc0F0ID4gYS5zdGFydHNBdCxcbiAgICAgICAgICApLFxuICAgICAgICBcIlx1ODAwM1x1OEJENVx1NEUwRVx1OEJGRVx1N0EwQlx1NjIxNlx1NTE3Nlx1NEVENlx1ODAwM1x1OEJENVx1NTFCMlx1N0E4MVwiLFxuICAgICAgKTtcbiAgICB9XG4gICAgZW5zdXJlKFxuICAgICAgYS5yZXNvdXJjZUlkcy5sZW5ndGggPD0gNTAwICYmXG4gICAgICAgIG5ldyBTZXQoYS5yZXNvdXJjZUlkcykuc2l6ZSA9PT0gYS5yZXNvdXJjZUlkcy5sZW5ndGggJiZcbiAgICAgICAgYS5yZXNvdXJjZUlkcy5ldmVyeSgoaWQpID0+IHJlc291cmNlKGlkLCBhLnByb2plY3RJZCkgIT09IHVuZGVmaW5lZCksXG4gICAgICBcIlx1OEJENVx1NTM3N1x1OEQ0NFx1NjU5OVx1NUZDNVx1OTg3Qlx1NUYxNVx1NzUyOFx1NjcyQ1x1OTg3OVx1NzZFRVx1NURGMlx1NzY3Qlx1OEJCMFx1NzY4NFx1OEQ0NFx1NkU5MFx1NEUxNFx1NEUwRFx1OTFDRFx1NTkwRFwiLFxuICAgICk7XG4gICAgdW5pcXVlRWR1Y2F0aW9uSWRzKGEucXVlc3Rpb25zLm1hcCgocSkgPT4gcS5pZCkpO1xuICAgIGZvciAoY29uc3QgcSBvZiBhLnF1ZXN0aW9ucykge1xuICAgICAgZW5zdXJlKFxuICAgICAgICBjaGVja1RleHQocS5wcm9tcHQsIDUwMDAwKSAmJlxuICAgICAgICAgIGNoZWNrVGV4dChxLmFuc3dlciwgNTAwMDApICYmXG4gICAgICAgICAgcS50b3BpY3MubGVuZ3RoID4gMCAmJlxuICAgICAgICAgIHEuZXN0aW1hdGVkTWludXRlcyA+IDAgJiZcbiAgICAgICAgICBxLnNjb3JpbmcubGVuZ3RoID4gMCAmJlxuICAgICAgICAgIHEuc291cmNlSWRzLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICBxLnNvdXJjZUlkcy5ldmVyeSgoaWQpID0+IHJlc291cmNlKGlkLCBhLnByb2plY3RJZCkgIT09IHVuZGVmaW5lZCksXG4gICAgICAgIFwiXHU2QkNGXHU5ODk4XHU1RkM1XHU5ODdCXHU2NzA5XHU2NzY1XHU2RTkwXHUzMDAxXHU3N0U1XHU4QkM2XHU3MEI5XHUzMDAxXHU0RjMwXHU2NUY2XHUzMDAxXHU3QjU0XHU2ODQ4XHU1NDhDXHU4QkM0XHU1MjA2XHU3MEI5XCIsXG4gICAgICApO1xuICAgICAgdW5pcXVlRWR1Y2F0aW9uSWRzKHEuc2NvcmluZy5tYXAoKHApID0+IHAuaWQpKTtcbiAgICAgIGZvciAoY29uc3QgcCBvZiBxLnNjb3JpbmcpIHtcbiAgICAgICAgZW5zdXJlKFxuICAgICAgICAgIHAucG9pbnRzID4gMCAmJiBjaGVja1RleHQocC5kZXNjcmlwdGlvbiwgNTAwMDApLFxuICAgICAgICAgIFwiXHU4QkM0XHU1MjA2XHU3MEI5XHU5NzAwXHU4OTgxXHU1MjA2XHU1MDNDXHU0RTBFXHU1MjI0XHU1MjA2XHU0RjlEXHU2MzZFXCIsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAoIXEuZXh0ZW5zaW9uICYmIGEua2luZCAhPT0gXCJtb2NrRXhhbVwiICYmIGEua2luZCAhPT0gXCJyZXRlc3RcIikge1xuICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgcS50b3BpY3MuZXZlcnkoXG4gICAgICAgICAgICAodCkgPT5cbiAgICAgICAgICAgICAgZS5sZXNzb25zLnNvbWUoXG4gICAgICAgICAgICAgICAgKGwpID0+XG4gICAgICAgICAgICAgICAgICBsLnByb2plY3RJZCA9PT0gYS5wcm9qZWN0SWQgJiZcbiAgICAgICAgICAgICAgICAgIGwuc3RhdGUgPT09IFwiZW5kZWRcIiAmJlxuICAgICAgICAgICAgICAgICAgbC50b3BpY3MuaW5jbHVkZXModCksXG4gICAgICAgICAgICAgICkgfHxcbiAgICAgICAgICAgICAgZS5jb21wbGV0ZWRUYXNrcy5zb21lKFxuICAgICAgICAgICAgICAgICh0YXNrKSA9PlxuICAgICAgICAgICAgICAgICAgdGFzay5wcm9qZWN0SWQgPT09IGEucHJvamVjdElkICYmIHRhc2sudG9waWNzLmluY2x1ZGVzKHQpLFxuICAgICAgICAgICAgICApIHx8XG4gICAgICAgICAgICAgIGUucHJvZ3Jlc3Muc29tZShcbiAgICAgICAgICAgICAgICAocikgPT5cbiAgICAgICAgICAgICAgICAgIHIucHJvamVjdElkID09PSBhLnByb2plY3RJZCAmJiByLmNvbmZpcm1lZCAmJiByLnRvcGljID09PSB0LFxuICAgICAgICAgICAgICApLFxuICAgICAgICAgICksXG4gICAgICAgICAgXCJcdTU3RkFcdTc4NDBcdTdFQzNcdTRFNjBcdTRFMERcdTgwRkRcdTUzMDVcdTU0MkJcdTVDMUFcdTY3MkFcdTYzODhcdThCRkVcdTc2ODRcdTc3RTVcdThCQzZcdTcwQjlcdUZGMUJcdTYyRDNcdTVDNTVcdTk4OThcdTk4N0JcdTY2MEVcdTc4NkVcdTY4MDdcdThCQjBcIixcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZm9yIChjb25zdCBzIG9mIGUuc3VibWlzc2lvbnMpIHtcbiAgICBjb25zdCBhID0gZS5hc3Nlc3NtZW50cy5maW5kKCh4KSA9PiB4LmlkID09PSBzLmFzc2Vzc21lbnRJZCk7XG4gICAgZW5zdXJlKGEgIT09IHVuZGVmaW5lZCwgXCJcdTYzRDBcdTRFQTRcdTVGMTVcdTc1MjhcdTRFODZcdTRFMERcdTVCNThcdTU3MjhcdTc2ODRcdThCRDVcdTk4OThcIik7XG4gICAgZW5zdXJlKFxuICAgICAgcy5yZXNvdXJjZUlkcy5ldmVyeSgoaWQpID0+IHJlc291cmNlKGlkLCBhLnByb2plY3RJZCkgIT09IHVuZGVmaW5lZCksXG4gICAgICBcIlx1N0I1NFx1NTM3N1x1OTY0NFx1NEVGNlx1NUZDNVx1OTg3Qlx1NUM1RVx1NEU4RVx1NjcyQ1x1OTg3OVx1NzZFRVwiLFxuICAgICk7XG4gICAgdW5pcXVlRWR1Y2F0aW9uSWRzKHMucXVlc3Rpb25UaW1lcy5tYXAoKHQpID0+IHQucXVlc3Rpb25JZCkpO1xuICAgIGZvciAoY29uc3QgdCBvZiBzLnF1ZXN0aW9uVGltZXMpIHtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgYS5xdWVzdGlvbnMuc29tZSgocSkgPT4gcS5pZCA9PT0gdC5xdWVzdGlvbklkKSAmJlxuICAgICAgICAgIHQubG9jYWxUaW1lLmxlbmd0aCA9PT0gNSAmJlxuICAgICAgICAgIG1pbnV0ZXNPZih0LmxvY2FsVGltZSkgIT09IG51bGwsXG4gICAgICAgIFwiXHU2QkNGXHU5ODk4XHU4QkIwXHU1RjU1XHU2NzJDXHU2NzNBSEg6TU1cdTVCOENcdTYyMTBcdTY1RjZcdTUyM0JcIixcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgZyBvZiBlLmdyYWRlcykge1xuICAgIGNvbnN0IHMgPSBlLnN1Ym1pc3Npb25zLmZpbmQoKHgpID0+IHguaWQgPT09IGcuc3VibWlzc2lvbklkKTtcbiAgICBlbnN1cmUocyAhPT0gdW5kZWZpbmVkLCBcIlx1NjI3OVx1NjUzOVx1N0YzQVx1NUMxMVx1NjNEMFx1NEVBNFx1NzI0OFx1NjcyQ1wiKTtcbiAgICBjb25zdCBhID0gZS5hc3Nlc3NtZW50cy5maW5kKCh4KSA9PiB4LmlkID09PSBzLmFzc2Vzc21lbnRJZCk7XG4gICAgZW5zdXJlKGEgIT09IHVuZGVmaW5lZCwgXCJcdThCRDVcdTk4OThcdTRFMERcdTVCNThcdTU3MjhcIik7XG4gICAgZW5zdXJlKFxuICAgICAgZy5hc3Nlc3NtZW50UmV2aXNpb24gPT09IGEucmV2aXNpb24gJiYgY2hlY2tUZXh0KGcuZmVlZGJhY2ssIDUwMDAwKSxcbiAgICAgIFwiXHU2Mjc5XHU2NTM5XHU1RkM1XHU5ODdCXHU1RjE1XHU3NTI4XHU1M0QxXHU1RTAzXHU2NUY2XHU3Njg0XHU4QkM0XHU1MjA2XHU3MjQ4XHU2NzJDXHU1RTc2XHU3RUQ5XHU1MUZBXHU1M0NEXHU5OTg4XCIsXG4gICAgKTtcbiAgICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgZm9yIChjb25zdCBhd2FyZCBvZiBnLmF3YXJkcykge1xuICAgICAgY29uc3QgcG9pbnQgPSBhLnF1ZXN0aW9uc1xuICAgICAgICAuZmluZCgocSkgPT4gcS5pZCA9PT0gYXdhcmQucXVlc3Rpb25JZClcbiAgICAgICAgPy5zY29yaW5nLmZpbmQoKHApID0+IHAuaWQgPT09IGF3YXJkLnBvaW50SWQpO1xuICAgICAgZW5zdXJlKHBvaW50ICE9PSB1bmRlZmluZWQsIFwiXHU2Mjc5XHU2NTM5XHU0RTBEXHU4MEZEXHU0RTM0XHU2NUY2XHU1ODlFXHU1MkEwXHU4QkM0XHU1MjA2XHU3MEI5XCIpO1xuICAgICAgZW5zdXJlKFxuICAgICAgICBhd2FyZC5hd2FyZGVkIDw9IHBvaW50LnBvaW50cyAmJlxuICAgICAgICAgIGNoZWNrVGV4dChhd2FyZC5ldmlkZW5jZSwgNTAwMDApICYmXG4gICAgICAgICAgIXNlZW4uaGFzKGAke2F3YXJkLnF1ZXN0aW9uSWR9fCR7YXdhcmQucG9pbnRJZH1gKSxcbiAgICAgICAgXCJcdThCQzRcdTUyMDZcdThEODVcdTgzMDNcdTU2RjRcdTMwMDFcdTkxQ0RcdTU5MERcdTYyMTZcdTdGM0FcdTVDMTFcdTdCNTRcdTUzNzdcdThCQzFcdTYzNkVcIixcbiAgICAgICk7XG4gICAgICBzZWVuLmFkZChgJHthd2FyZC5xdWVzdGlvbklkfXwke2F3YXJkLnBvaW50SWR9YCk7XG4gICAgfVxuICAgIGNvbnN0IHRvdGFsUG9pbnRzID0gYS5xdWVzdGlvbnMucmVkdWNlKChuLCBxKSA9PiBuICsgcS5zY29yaW5nLmxlbmd0aCwgMCk7XG4gICAgZW5zdXJlKFxuICAgICAgZy5uZWVkc1JldmlldyB8fCBnLmF3YXJkcy5sZW5ndGggPT09IHRvdGFsUG9pbnRzLFxuICAgICAgXCJcdTZCNjNcdTVGMEZcdTYyNzlcdTY1MzlcdTVGQzVcdTk4N0JcdTg5ODZcdTc2RDZcdTUxNjhcdTkwRThcdThCQzRcdTUyMDZcdTcwQjlcdUZGMUJcdThCQzZcdTUyMkJcdTRFMERcdTZFMDVcdThCRjdcdTY4MDdcdThCQjBcdTVGODVcdTU5MERcdTY4MzhcIixcbiAgICApO1xuICAgIGZvciAoY29uc3QgZXJyb3Igb2YgZy5lcnJvcnMpIHtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgYS5xdWVzdGlvbnMuc29tZSgocSkgPT4gcS5pZCA9PT0gZXJyb3IucXVlc3Rpb25JZCkgJiZcbiAgICAgICAgICBjaGVja1RleHQoZXJyb3IuY2F1c2UsIDUwMDAwKSAmJlxuICAgICAgICAgIGNoZWNrVGV4dChlcnJvci5ldmlkZW5jZSwgNTAwMDApICYmXG4gICAgICAgICAgY2hlY2tUZXh0KGVycm9yLmNvcnJlY3Rpb24sIDUwMDAwKSAmJlxuICAgICAgICAgIGNoZWNrVGV4dChlcnJvci5uZXh0Q2hlY2ssIDUwMDAwKSAmJlxuICAgICAgICAgIHZhbGlkRWR1Y2F0aW9uRGF0ZShlcnJvci5yZXRlc3REYXRlKSxcbiAgICAgICAgXCJcdTk1MTlcdTU2RTBcdTUyMDZcdTY3OTBcdTk3MDBcdTg5ODFcdThCQzFcdTYzNkVcdTMwMDFcdTdFQTBcdTZCNjNcdTUyQThcdTRGNUNcdTU0OENcdTU5MERcdTZENEJcdTY1RTVcdTY3MUZcIixcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgciBvZiBlLnJldmlld3MpIHtcbiAgICBlbnN1cmUoXG4gICAgICBwcm9qZWN0RXhpc3RzKHIucHJvamVjdElkKSAmJlxuICAgICAgICB2YWxpZEVkdWNhdGlvbkRhdGUoci5kYXRlKSAmJlxuICAgICAgICBjaGVja1RleHQoci5maW5kaW5ncywgNTAwMDApICYmXG4gICAgICAgIHIuYWN0aW9ucy5sZW5ndGggPiAwICYmXG4gICAgICAgIHIuZ3JhZGVJZHMubGVuZ3RoID4gMCAmJlxuICAgICAgICByLmdyYWRlSWRzLmV2ZXJ5KChpZCkgPT5cbiAgICAgICAgICBlLmdyYWRlcy5zb21lKChnKSA9PiB7XG4gICAgICAgICAgICBpZiAoZy5pZCAhPT0gaWQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBlLnN1Ym1pc3Npb25zLnNvbWUoKHMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHMuaWQgIT09IGcuc3VibWlzc2lvbklkKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgIHJldHVybiBlLmFzc2Vzc21lbnRzLnNvbWUoXG4gICAgICAgICAgICAgICAgKGEpID0+IGEuaWQgPT09IHMuYXNzZXNzbWVudElkICYmIGEucHJvamVjdElkID09PSByLnByb2plY3RJZCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pLFxuICAgICAgICApLFxuICAgICAgXCJcdTU5MERcdTc2RDhcdTVGQzVcdTk4N0JcdTVGMTVcdTc1MjhcdTY3MkNcdTk4NzlcdTc2RUVcdTYyNzlcdTY1MzlcdTVFNzZcdTdFRDlcdTUxRkFcdTU0MEVcdTdFRURcdTg4NENcdTUyQThcIixcbiAgICApO1xuICB9XG4gIGZvciAoY29uc3QgZXZlbnQgb2YgZS5ldmVudHMpIHtcbiAgICBlbnN1cmUoXG4gICAgICBwcm9qZWN0RXhpc3RzKGV2ZW50LnByb2plY3RJZCkgJiZcbiAgICAgICAgW1wicGVuZGluZ1wiLCBcInJ1bm5pbmdcIiwgXCJkb25lXCJdLmluY2x1ZGVzKGV2ZW50LnN0YXRlKSAmJlxuICAgICAgICBbXG4gICAgICAgICAgXCJob21ld29ya1wiLFxuICAgICAgICAgIFwidGFza0hvbWV3b3JrXCIsXG4gICAgICAgICAgXCJncmFkZVwiLFxuICAgICAgICAgIFwiY29ycmVjdGlvblwiLFxuICAgICAgICAgIFwicmV2aWV3XCIsXG4gICAgICAgICAgXCJ3ZWVrbHlFeGFtXCIsXG4gICAgICAgIF0uaW5jbHVkZXMoZXZlbnQua2luZCksXG4gICAgICBcIlx1NjVFMFx1NjU0OFx1NzY4NFx1NjU1OVx1NUI2Nlx1NEU4Qlx1NEVGNlwiLFxuICAgICk7XG4gIH1cbiAgdmFsaWRhdGVMZWFybmluZyhkYXRhKTtcbn1cblxuZnVuY3Rpb24gdW5pcXVlRWR1Y2F0aW9uSWRzKGlkczogc3RyaW5nW10pOiB2b2lkIHtcbiAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IGlkIG9mIGlkcykge1xuICAgIGVuc3VyZShcbiAgICAgIGlkLnRyaW0oKS5sZW5ndGggPiAwICYmIGlkLmxlbmd0aCA8PSAyMDAgJiYgIXNlZW4uaGFzKGlkKSxcbiAgICAgIFwiXHU2NTU5XHU1QjY2XHU1QjlFXHU0RjUzIElEIFx1NEUzQVx1N0E3QVx1MzAwMVx1OEZDN1x1OTU3Rlx1NjIxNlx1OTFDRFx1NTkwRFwiLFxuICAgICk7XG4gICAgc2Vlbi5hZGQoaWQpO1xuICB9XG59XG5cbi8qKiBcdTVCRkNcdTUxNjVcdTUzRUZcdTYwNjJcdTU5MERcdThCQjBcdTVGNTVcdUZGMENcdTRGNDZcdTRFMERcdTVGOTdcdTk3NTlcdTlFRDhcdTY1MzlcdTUxOTlcdTVERjJcdTUzRDFcdTVFMDNcdTk4OThcdTc2RUVcdTYyMTZcdTUzODZcdTUzRjJcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUVkdWNhdGlvblRyYW5zaXRpb24oXG4gIGJlZm9yZTogRWR1Y2F0aW9uLFxuICBhZnRlcjogRWR1Y2F0aW9uLFxuKTogdm9pZCB7XG4gIHZhbGlkYXRlTGVhcm5pbmdUcmFuc2l0aW9uKGJlZm9yZSwgYWZ0ZXIpO1xuICBmb3IgKGNvbnN0IGxpbmsgb2YgYmVmb3JlLmZvY3VzVGFza3MpIHtcbiAgICBlbnN1cmUoXG4gICAgICBhZnRlci5mb2N1c1Rhc2tzLnNvbWUoXG4gICAgICAgICh4KSA9PlxuICAgICAgICAgIHgudGFza0lkID09PSBsaW5rLnRhc2tJZCAmJlxuICAgICAgICAgIHguc291cmNlSWQgPT09IGxpbmsuc291cmNlSWQgJiZcbiAgICAgICAgICB4LmtpbmQgPT09IGxpbmsua2luZCxcbiAgICAgICksXG4gICAgICBcIlx1NURGMlx1NUVGQVx1N0FDQlx1NzY4NFx1NjU1OVx1NUI2Nlx1NUY4NVx1NTI5RVx1Njc2NVx1NkU5MFx1NTE3M1x1ODA1NFx1NEUwRFx1ODBGRFx1NTIyMFx1OTY2NFx1NjIxNlx1NjUzOVx1NTE5OVwiLFxuICAgICk7XG4gIH1cbiAgY29uc3QgYWN0aXZlUmVzb3VyY2VzID0gbmV3IFNldChhZnRlci5yZXNvdXJjZXMubWFwKChyKSA9PiByLmlkKSk7XG4gIGNvbnN0IHJlZmVyZW5jZXMgPSBiZWZvcmUucmVzb3VyY2VSZWZlcmVuY2VJbmRleCgpO1xuICBmb3IgKGNvbnN0IHJlc291cmNlIG9mIGJlZm9yZS5yZXNvdXJjZXMpIHtcbiAgICBpZiAoIWFjdGl2ZVJlc291cmNlcy5oYXMocmVzb3VyY2UuaWQpKSB7XG4gICAgICBlbnN1cmUoXG4gICAgICAgICFyZWZlcmVuY2VzLmhhcyhyZXNvdXJjZS5pZCksXG4gICAgICAgIFwiXHU2NTU5XHU1QjY2XHU1Mzg2XHU1M0YyXHU1RjE1XHU3NTI4XHU3Njg0XHU4RDQ0XHU2RTkwXHU3NjdCXHU4QkIwXHU0RTBEXHU4MEZEXHU1MjIwXHU5NjY0XHVGRjBDXHU4QkY3XHU0RkVFXHU1OTBEXHU4REVGXHU1Rjg0XCIsXG4gICAgICApO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IGEgb2YgYmVmb3JlLmFzc2Vzc21lbnRzKSB7XG4gICAgZW5zdXJlKFxuICAgICAgYWZ0ZXIuYXNzZXNzbWVudHMuc29tZSgoYikgPT4gYi5pZCA9PT0gYS5pZCksXG4gICAgICBcIlx1NURGMlx1NTNEMVx1NUUwM1x1OEJENVx1NTM3N1x1NEUwRFx1ODBGRFx1NTIyMFx1OTY2NFwiLFxuICAgICk7XG4gICAgY29uc3QgYiA9IGFmdGVyLmFzc2Vzc21lbnRzLmZpbmQoKHgpID0+IHguaWQgPT09IGEuaWQpO1xuICAgIGlmIChiICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IG9sZCA9IGNsb25lQXNzZXNzbWVudChhKTtcbiAgICAgIG9sZC5wcmludGVkQXQgPSBiLnByaW50ZWRBdDtcbiAgICAgIG9sZC5zdGFydGVkQXQgPSBiLnN0YXJ0ZWRBdDtcbiAgICAgIG9sZC5zdG9wcGVkQXQgPSBiLnN0b3BwZWRBdDtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgYXNzZXNzbWVudEVxdWFscyhvbGQsIGIpLFxuICAgICAgICBcIlx1NURGMlx1NTNEMVx1NUUwM1x1OTg5OFx1NzZFRVx1NEUwRVx1OEJDNFx1NTIwNlx1NjgwN1x1NTFDNlx1NEUwRFx1NTNFRlx1ODhBQlx1NUJGQ1x1NTE2NVx1NjIxNlx1ODg2NVx1NEUwMVx1NjUzOVx1NTE5OVwiLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgZm9yIChjb25zdCBzIG9mIGJlZm9yZS5zdWJtaXNzaW9ucykge1xuICAgIGNvbnN0IGIgPSBhZnRlci5zdWJtaXNzaW9ucy5maW5kKCh4KSA9PiB4LmlkID09PSBzLmlkKTtcbiAgICBlbnN1cmUoXG4gICAgICBiICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgKCgpID0+IHtcbiAgICAgICAgICBjb25zdCBvbGQgPSBjbG9uZVN1Ym1pc3Npb24ocyk7XG4gICAgICAgICAgb2xkLnF1ZXN0aW9uVGltZXMgPSBiLnF1ZXN0aW9uVGltZXMubWFwKCh0KSA9PiAoeyAuLi50IH0pKTtcbiAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgc3VibWlzc2lvbkVxdWFscyhvbGQsIGIpICYmXG4gICAgICAgICAgICBzdGFydHNXaXRoUXVlc3Rpb25UaW1lcyhiLnF1ZXN0aW9uVGltZXMsIHMucXVlc3Rpb25UaW1lcykgJiZcbiAgICAgICAgICAgIChiLnF1ZXN0aW9uVGltZXMubGVuZ3RoID09PSBzLnF1ZXN0aW9uVGltZXMubGVuZ3RoIHx8XG4gICAgICAgICAgICAgICFiZWZvcmUuZ3JhZGVzLnNvbWUoKGcpID0+IGcuc3VibWlzc2lvbklkID09PSBzLmlkKSlcbiAgICAgICAgICApO1xuICAgICAgICB9KSgpLFxuICAgICAgXCJcdTYzRDBcdTRFQTRcdTUzODZcdTUzRjJcdTRFMERcdTUzRUZcdTY1MzlcdTUxOTlcdUZGMUJcdTUzRUFcdTgwRkRcdTU3MjhcdTYyNzlcdTY1MzlcdTUyNERcdTg4NjVcdTUxNDVcdTdGM0FcdTU5MzFcdTc2ODRcdTVCOENcdTYyMTBcdTY1RjZcdTUyM0JcIixcbiAgICApO1xuICB9XG4gIGZvciAoY29uc3QgZyBvZiBiZWZvcmUuZ3JhZGVzKSB7XG4gICAgY29uc3QgYiA9IGFmdGVyLmdyYWRlcy5maW5kKCh4KSA9PiB4LmlkID09PSBnLmlkKTtcbiAgICBlbnN1cmUoYiAhPT0gdW5kZWZpbmVkICYmIGdyYWRlRXF1YWxzKGIsIGcpLCBcIlx1NjI3OVx1NjUzOVx1NTM4Nlx1NTNGMlx1NEUwRFx1NTNFRlx1NjUzOVx1NTE5OVwiKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjbG9uZUFzc2Vzc21lbnQoYTogQXNzZXNzbWVudCk6IEFzc2Vzc21lbnQge1xuICByZXR1cm4ge1xuICAgIC4uLmEsXG4gICAgcmVzb3VyY2VJZHM6IFsuLi5hLnJlc291cmNlSWRzXSxcbiAgICBxdWVzdGlvbnM6IGEucXVlc3Rpb25zLm1hcCgocSkgPT4gKHtcbiAgICAgIC4uLnEsXG4gICAgICB0b3BpY3M6IFsuLi5xLnRvcGljc10sXG4gICAgICBzb3VyY2VJZHM6IFsuLi5xLnNvdXJjZUlkc10sXG4gICAgICBzY29yaW5nOiBxLnNjb3JpbmcubWFwKChwKSA9PiAoeyAuLi5wIH0pKSxcbiAgICB9KSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNsb25lU3VibWlzc2lvbihzOiBTdWJtaXNzaW9uKTogU3VibWlzc2lvbiB7XG4gIHJldHVybiB7XG4gICAgLi4ucyxcbiAgICByZXNvdXJjZUlkczogWy4uLnMucmVzb3VyY2VJZHNdLFxuICAgIHF1ZXN0aW9uVGltZXM6IHMucXVlc3Rpb25UaW1lcy5tYXAoKHQpID0+ICh7IC4uLnQgfSkpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBhc3Nlc3NtZW50RXF1YWxzKGE6IEFzc2Vzc21lbnQsIGI6IEFzc2Vzc21lbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICBKU09OLnN0cmluZ2lmeShzZXJpYWxpemVBc3Nlc3NtZW50KGEpKSA9PT1cbiAgICBKU09OLnN0cmluZ2lmeShzZXJpYWxpemVBc3Nlc3NtZW50KGIpKVxuICApO1xufVxuXG5mdW5jdGlvbiBzdWJtaXNzaW9uRXF1YWxzKGE6IFN1Ym1pc3Npb24sIGI6IFN1Ym1pc3Npb24pOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICBKU09OLnN0cmluZ2lmeShzZXJpYWxpemVTdWJtaXNzaW9uKGEpKSA9PT1cbiAgICBKU09OLnN0cmluZ2lmeShzZXJpYWxpemVTdWJtaXNzaW9uKGIpKVxuICApO1xufVxuXG5mdW5jdGlvbiBncmFkZUVxdWFscyhhOiBHcmFkZSwgYjogR3JhZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICBKU09OLnN0cmluZ2lmeShzZXJpYWxpemVHcmFkZShhKSkgPT09IEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZUdyYWRlKGIpKVxuICApO1xufVxuXG5mdW5jdGlvbiBzdGFydHNXaXRoUXVlc3Rpb25UaW1lcyhcbiAgbGlzdDogUXVlc3Rpb25UaW1lW10sXG4gIHByZWZpeDogUXVlc3Rpb25UaW1lW10sXG4pOiBib29sZWFuIHtcbiAgcmV0dXJuIHByZWZpeC5ldmVyeShcbiAgICAocCwgaSkgPT5cbiAgICAgIGxpc3RbaV0gIT09IHVuZGVmaW5lZCAmJlxuICAgICAgbGlzdFtpXSEucXVlc3Rpb25JZCA9PT0gcC5xdWVzdGlvbklkICYmXG4gICAgICBsaXN0W2ldIS5sb2NhbFRpbWUgPT09IHAubG9jYWxUaW1lLFxuICApO1xufVxuXG4vLyAtLS0tLS0tLS0tIEVkdWNhdGlvbiBcdTg5RTNcdTY3OTAvXHU1RThGXHU1MjE3XHU1MzE2IC0tLS0tLS0tLS1cblxuY29uc3QgRURVQ0FUSU9OX0tFWVMgPSBbXG4gIFwiZm9jdXNUYXNrc1wiLFxuICBcInByb2plY3RzXCIsXG4gIFwicmVzb3VyY2VzXCIsXG4gIFwic2VtZXN0ZXJzXCIsXG4gIFwic2VtZXN0ZXJIaXN0b3J5XCIsXG4gIFwibGVzc29uc1wiLFxuICBcImFzc2Vzc21lbnRzXCIsXG4gIFwic3VibWlzc2lvbnNcIixcbiAgXCJncmFkZXNcIixcbiAgXCJyZXZpZXdzXCIsXG4gIFwiZXZlbnRzXCIsXG4gIFwiY29tcGxldGVkVGFza3NcIixcbiAgXCJwcm9ncmVzc1wiLFxuICBcImNvcnJlY3Rpb25zXCIsXG5dIGFzIGNvbnN0O1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VFZHVjYXRpb24ocmF3OiB1bmtub3duKTogRWR1Y2F0aW9uIHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTY1NTlcdTVCNjZcdTY1NzBcdTYzNkVcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJlamVjdFVua25vd24ocmF3LCBbLi4uRURVQ0FUSU9OX0tFWVNdLCBcIlx1NjU1OVx1NUI2Nlx1NjU3MFx1NjM2RVwiKTtcbiAgY29uc3QgZSA9IG5ldyBFZHVjYXRpb24oKTtcbiAgZS5mb2N1c1Rhc2tzID0gZmllbGQoXG4gICAgcmF3LFxuICAgIFwiZm9jdXNUYXNrc1wiLFxuICAgIFwiXHU2NTU5XHU1QjY2XHU2NTcwXHU2MzZFXCIsXG4gICAgKHYpID0+XG4gICAgICBhc0FycmF5KHYsIFwiZm9jdXNUYXNrc1wiKS5tYXAoKHgpID0+IHtcbiAgICAgICAgZW5zdXJlKGlzT2JqZWN0KHgpLCBcIlx1NjU1OVx1NUI2Nlx1NUY4NVx1NTI5RVx1NTE3M1x1ODA1NFx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgICAgICAgcmVqZWN0VW5rbm93bih4LCBbXCJ0YXNrSWRcIiwgXCJzb3VyY2VJZFwiLCBcImtpbmRcIl0sIFwiXHU2NTU5XHU1QjY2XHU1Rjg1XHU1MjlFXHU1MTczXHU4MDU0XCIpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRhc2tJZDogcmVxdWlyZWRGaWVsZCh4LCBcInRhc2tJZFwiLCBcIlx1NjU1OVx1NUI2Nlx1NUY4NVx1NTI5RVx1NTE3M1x1ODA1NFwiLCBhc1N0ciksXG4gICAgICAgICAgc291cmNlSWQ6IHJlcXVpcmVkRmllbGQoeCwgXCJzb3VyY2VJZFwiLCBcIlx1NjU1OVx1NUI2Nlx1NUY4NVx1NTI5RVx1NTE3M1x1ODA1NFwiLCBhc1N0ciksXG4gICAgICAgICAga2luZDogb25lT2YoXG4gICAgICAgICAgICByZXF1aXJlZEZpZWxkKHgsIFwia2luZFwiLCBcIlx1NjU1OVx1NUI2Nlx1NUY4NVx1NTI5RVx1NTE3M1x1ODA1NFwiLCAoaykgPT4gayksXG4gICAgICAgICAgICBcIlx1NjU1OVx1NUI2Nlx1NUY4NVx1NTI5RSBraW5kXCIsXG4gICAgICAgICAgICBbXCJsZXNzb25cIiwgXCJob21ld29ya1wiLCBcImV4YW1cIl0sXG4gICAgICAgICAgKSBhcyBcImxlc3NvblwiIHwgXCJob21ld29ya1wiIHwgXCJleGFtXCIsXG4gICAgICAgIH07XG4gICAgICB9KSxcbiAgICBbXSxcbiAgKTtcbiAgZS5wcm9qZWN0cyA9IGZpZWxkKFxuICAgIHJhdyxcbiAgICBcInByb2plY3RzXCIsXG4gICAgXCJcdTY1NTlcdTVCNjZcdTY1NzBcdTYzNkVcIixcbiAgICAodikgPT4gYXNBcnJheSh2LCBcInByb2plY3RzXCIpLm1hcChwYXJzZVByb2plY3RTdHVkeSksXG4gICAgW10sXG4gICk7XG4gIGUucmVzb3VyY2VzID0gZmllbGQoXG4gICAgcmF3LFxuICAgIFwicmVzb3VyY2VzXCIsXG4gICAgXCJcdTY1NTlcdTVCNjZcdTY1NzBcdTYzNkVcIixcbiAgICAodikgPT4gYXNBcnJheSh2LCBcInJlc291cmNlc1wiKS5tYXAocGFyc2VSZXNvdXJjZSksXG4gICAgW10sXG4gICk7XG4gIGUuc2VtZXN0ZXJzID0gZmllbGQoXG4gICAgcmF3LFxuICAgIFwic2VtZXN0ZXJzXCIsXG4gICAgXCJcdTY1NTlcdTVCNjZcdTY1NzBcdTYzNkVcIixcbiAgICAodikgPT4gYXNBcnJheSh2LCBcInNlbWVzdGVyc1wiKS5tYXAocGFyc2VTZW1lc3RlciksXG4gICAgW10sXG4gICk7XG4gIGUuc2VtZXN0ZXJIaXN0b3J5ID0gZmllbGQoXG4gICAgcmF3LFxuICAgIFwic2VtZXN0ZXJIaXN0b3J5XCIsXG4gICAgXCJcdTY1NTlcdTVCNjZcdTY1NzBcdTYzNkVcIixcbiAgICAodikgPT4gYXNBcnJheSh2LCBcInNlbWVzdGVySGlzdG9yeVwiKS5tYXAocGFyc2VTZW1lc3RlciksXG4gICAgW10sXG4gICk7XG4gIGUubGVzc29ucyA9IGZpZWxkKFxuICAgIHJhdyxcbiAgICBcImxlc3NvbnNcIixcbiAgICBcIlx1NjU1OVx1NUI2Nlx1NjU3MFx1NjM2RVwiLFxuICAgICh2KSA9PiBhc0FycmF5KHYsIFwibGVzc29uc1wiKS5tYXAocGFyc2VMZXNzb24pLFxuICAgIFtdLFxuICApO1xuICBlLmFzc2Vzc21lbnRzID0gZmllbGQoXG4gICAgcmF3LFxuICAgIFwiYXNzZXNzbWVudHNcIixcbiAgICBcIlx1NjU1OVx1NUI2Nlx1NjU3MFx1NjM2RVwiLFxuICAgICh2KSA9PiBhc0FycmF5KHYsIFwiYXNzZXNzbWVudHNcIikubWFwKHBhcnNlQXNzZXNzbWVudCksXG4gICAgW10sXG4gICk7XG4gIGUuc3VibWlzc2lvbnMgPSBmaWVsZChcbiAgICByYXcsXG4gICAgXCJzdWJtaXNzaW9uc1wiLFxuICAgIFwiXHU2NTU5XHU1QjY2XHU2NTcwXHU2MzZFXCIsXG4gICAgKHYpID0+IGFzQXJyYXkodiwgXCJzdWJtaXNzaW9uc1wiKS5tYXAocGFyc2VTdWJtaXNzaW9uKSxcbiAgICBbXSxcbiAgKTtcbiAgZS5ncmFkZXMgPSBmaWVsZChcbiAgICByYXcsXG4gICAgXCJncmFkZXNcIixcbiAgICBcIlx1NjU1OVx1NUI2Nlx1NjU3MFx1NjM2RVwiLFxuICAgICh2KSA9PiBhc0FycmF5KHYsIFwiZ3JhZGVzXCIpLm1hcChwYXJzZUdyYWRlKSxcbiAgICBbXSxcbiAgKTtcbiAgZS5yZXZpZXdzID0gZmllbGQoXG4gICAgcmF3LFxuICAgIFwicmV2aWV3c1wiLFxuICAgIFwiXHU2NTU5XHU1QjY2XHU2NTcwXHU2MzZFXCIsXG4gICAgKHYpID0+IGFzQXJyYXkodiwgXCJyZXZpZXdzXCIpLm1hcChwYXJzZVJldmlldyksXG4gICAgW10sXG4gICk7XG4gIGUuZXZlbnRzID0gZmllbGQoXG4gICAgcmF3LFxuICAgIFwiZXZlbnRzXCIsXG4gICAgXCJcdTY1NTlcdTVCNjZcdTY1NzBcdTYzNkVcIixcbiAgICAodikgPT4gYXNBcnJheSh2LCBcImV2ZW50c1wiKS5tYXAocGFyc2VUZWFjaGluZ0V2ZW50KSxcbiAgICBbXSxcbiAgKTtcbiAgZS5jb21wbGV0ZWRUYXNrcyA9IGZpZWxkKFxuICAgIHJhdyxcbiAgICBcImNvbXBsZXRlZFRhc2tzXCIsXG4gICAgXCJcdTY1NTlcdTVCNjZcdTY1NzBcdTYzNkVcIixcbiAgICAodikgPT4gYXNBcnJheSh2LCBcImNvbXBsZXRlZFRhc2tzXCIpLm1hcChwYXJzZUNvbXBsZXRlZFN0dWR5VGFzayksXG4gICAgW10sXG4gICk7XG4gIGUucHJvZ3Jlc3MgPSBmaWVsZChcbiAgICByYXcsXG4gICAgXCJwcm9ncmVzc1wiLFxuICAgIFwiXHU2NTU5XHU1QjY2XHU2NTcwXHU2MzZFXCIsXG4gICAgKHYpID0+IGFzQXJyYXkodiwgXCJwcm9ncmVzc1wiKS5tYXAocGFyc2VQcm9ncmVzc1JlY29yZCksXG4gICAgW10sXG4gICk7XG4gIGUuY29ycmVjdGlvbnMgPSBmaWVsZChcbiAgICByYXcsXG4gICAgXCJjb3JyZWN0aW9uc1wiLFxuICAgIFwiXHU2NTU5XHU1QjY2XHU2NTcwXHU2MzZFXCIsXG4gICAgKHYpID0+IGFzQXJyYXkodiwgXCJjb3JyZWN0aW9uc1wiKS5tYXAocGFyc2VDb3JyZWN0aW9uKSxcbiAgICBbXSxcbiAgKTtcbiAgcmV0dXJuIGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVFZHVjYXRpb24oZTogRWR1Y2F0aW9uKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4ge1xuICAgIGZvY3VzVGFza3M6IGUuZm9jdXNUYXNrcy5tYXAoKHQpID0+ICh7XG4gICAgICB0YXNrSWQ6IHQudGFza0lkLFxuICAgICAgc291cmNlSWQ6IHQuc291cmNlSWQsXG4gICAgICBraW5kOiB0LmtpbmQsXG4gICAgfSkpLFxuICAgIHByb2plY3RzOiBlLnByb2plY3RzLm1hcChzZXJpYWxpemVQcm9qZWN0U3R1ZHkpLFxuICAgIHJlc291cmNlczogZS5yZXNvdXJjZXMubWFwKHNlcmlhbGl6ZVJlc291cmNlKSxcbiAgICBzZW1lc3RlcnM6IGUuc2VtZXN0ZXJzLm1hcChzZXJpYWxpemVTZW1lc3RlciksXG4gICAgc2VtZXN0ZXJIaXN0b3J5OiBlLnNlbWVzdGVySGlzdG9yeS5tYXAoc2VyaWFsaXplU2VtZXN0ZXIpLFxuICAgIGxlc3NvbnM6IGUubGVzc29ucy5tYXAoc2VyaWFsaXplTGVzc29uKSxcbiAgICBhc3Nlc3NtZW50czogZS5hc3Nlc3NtZW50cy5tYXAoc2VyaWFsaXplQXNzZXNzbWVudCksXG4gICAgc3VibWlzc2lvbnM6IGUuc3VibWlzc2lvbnMubWFwKHNlcmlhbGl6ZVN1Ym1pc3Npb24pLFxuICAgIGdyYWRlczogZS5ncmFkZXMubWFwKHNlcmlhbGl6ZUdyYWRlKSxcbiAgICByZXZpZXdzOiBlLnJldmlld3MubWFwKHNlcmlhbGl6ZVJldmlldyksXG4gICAgZXZlbnRzOiBlLmV2ZW50cy5tYXAoc2VyaWFsaXplVGVhY2hpbmdFdmVudCksXG4gICAgY29tcGxldGVkVGFza3M6IGUuY29tcGxldGVkVGFza3MubWFwKHNlcmlhbGl6ZUNvbXBsZXRlZFN0dWR5VGFzayksXG4gICAgcHJvZ3Jlc3M6IGUucHJvZ3Jlc3MubWFwKHNlcmlhbGl6ZVByb2dyZXNzUmVjb3JkKSxcbiAgICBjb3JyZWN0aW9uczogZS5jb3JyZWN0aW9ucy5tYXAoc2VyaWFsaXplQ29ycmVjdGlvbiksXG4gIH07XG59XG4iLCAiLy8hIFx1NjU1OVx1NUI2Nlx1NjI2N1x1ODg0Q1x1RkYxQVx1OEJGRVx1N0EwQi9cdTRGNUNcdTRFMUFcdTUyMzBcdTY2NkVcdTkwMUFcdTVGODVcdTUyOUVcdTc2ODRcdTRFMDBcdTVCRjlcdTRFMDBcdTY3NjVcdTZFOTBcdTUxNzNcdTgwNTRcdTMwMDFcdTY1MzlcdTY3MUZcdTY2RjRcdTY1QjBcdTMwMDFcdTY2MEVcdTc4NkVcdTUzQzJcdTRFMEVcdTMwMDFcbi8vISBcdTYzRDBcdTRFQTRcdTVCOENcdTYyMTBcdTRFMEVcdTkxQ0RcdTU5MERcdTRGNUNcdTRFMUFcdTYyOTFcdTUyMzZcdUZGMUJcdThCQTFcdTUyMTJcdTVCRkNcdTUxRkFcdTYzOTJcdTk2NjRcdTVFNzZcdTRGRERcdTc1NTlcdTY1NTlcdTVCNjZcdTVGODVcdTUyOUVcdTMwMDJcbi8vISBcdTVCRjlcdTVFOTQgY3JhdGVzL2NvcmUvc3JjL3RlYWNoaW5nX3Rhc2tzLnJzXHUzMDAyXG5cbmltcG9ydCB7IEFwcEVycm9yLCBlbnN1cmUgfSBmcm9tIFwiLi9lcnJvcnNcIjtcbmltcG9ydCB7IGlkIH0gZnJvbSBcIi4vaWRzXCI7XG5pbXBvcnQgdHlwZSB7IEFwcERhdGEgfSBmcm9tIFwiLi9saWJcIjtcbmltcG9ydCB0eXBlIHsgVGVhY2hpbmdUYXNrLCBUZWFjaGluZ1Rhc2tLaW5kIH0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IGRhdGVBdCwgaG91ck1pbnV0ZVN0cmluZyB9IGZyb20gXCIuL3RpbWVcIjtcbmltcG9ydCB7IHJlY29yZFNlc3Npb24sIHJlc2V0VG8sIHN0YXJ0VGltZXIgfSBmcm9tIFwiLi9yZW1pbmRlcnNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHRlYWNoaW5nVGFzayhcbiAgZGF0YTogQXBwRGF0YSxcbiAgdGFza0lkOiBzdHJpbmcsXG4pOiBUZWFjaGluZ1Rhc2sgfCB1bmRlZmluZWQge1xuICByZXR1cm4gZGF0YS5lZHVjYXRpb24uZm9jdXNUYXNrcy5maW5kKChsaW5rKSA9PiBsaW5rLnRhc2tJZCA9PT0gdGFza0lkKTtcbn1cblxuLyoqIFx1NjU1OVx1NUI2Nlx1Njc2NVx1NkU5MFx1NjJFNVx1NjcwOVx1NUI4OVx1NjM5Mlx1RkYxQVx1OEJGRVx1N0EwQi9cdTRGNUNcdTRFMUFcdTc1MUZcdTYyMTBcdTYyMTZcdTY2RjRcdTY1QjBcdTY2NkVcdTkwMUFcdTVGODVcdTUyOUVcdUZGMENcdTY1MzlcdTY3MUZcdTY1MzlcdTUxODVcdTVCQjlcdTk2OEZcdTY3NjVcdTZFOTBcdThENzBcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRlcmlhbGl6ZVRlYWNoaW5nVGFza3MoZGF0YTogQXBwRGF0YSwgYXQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCBlbmFibGVkID0gbmV3IFNldChcbiAgICBkYXRhLmVkdWNhdGlvbi5wcm9qZWN0cy5maWx0ZXIoKHApID0+IHAuZXhhbU1vZGUpLm1hcCgocCkgPT4gcC5wcm9qZWN0SWQpLFxuICApO1xuICBjb25zdCBzb3VyY2VzOiB7XG4gICAga2luZDogVGVhY2hpbmdUYXNrS2luZDtcbiAgICBzb3VyY2VJZDogc3RyaW5nO1xuICAgIHByb2plY3RJZDogc3RyaW5nO1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgbm90ZXM6IHN0cmluZztcbiAgICBzdGFydHNBdDogbnVtYmVyO1xuICAgIG1pbnV0ZXM6IG51bWJlcjtcbiAgfVtdID0gW107XG4gIGZvciAoY29uc3QgbGVzc29uIG9mIGRhdGEuZWR1Y2F0aW9uLmxlc3NvbnMpIHtcbiAgICBpZiAoXG4gICAgICBlbmFibGVkLmhhcyhsZXNzb24ucHJvamVjdElkKSAmJlxuICAgICAgZGF0ZUF0KGxlc3Nvbi5zdGFydHNBdCkgPj0gZGF0ZUF0KGF0KVxuICAgICkge1xuICAgICAgc291cmNlcy5wdXNoKHtcbiAgICAgICAga2luZDogXCJsZXNzb25cIixcbiAgICAgICAgc291cmNlSWQ6IGxlc3Nvbi5pZCxcbiAgICAgICAgcHJvamVjdElkOiBsZXNzb24ucHJvamVjdElkLFxuICAgICAgICB0aXRsZTogbGVzc29uLnRpdGxlLFxuICAgICAgICBub3RlczogbGVzc29uLnRvcGljcy5qb2luKFwiXHUzMDAxXCIpLFxuICAgICAgICBzdGFydHNBdDogbGVzc29uLnN0YXJ0c0F0LFxuICAgICAgICBtaW51dGVzOiA0NSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IHBhcGVyIG9mIGRhdGEuZWR1Y2F0aW9uLmFzc2Vzc21lbnRzKSB7XG4gICAgaWYgKGVuYWJsZWQuaGFzKHBhcGVyLnByb2plY3RJZCkpIHtcbiAgICAgIGxldCBtaW51dGVzID0gMDtcbiAgICAgIGZvciAoY29uc3QgcSBvZiBwYXBlci5xdWVzdGlvbnMpIHtcbiAgICAgICAgbWludXRlcyA9IE1hdGgubWluKDQyOTQ5NjcyOTUsIG1pbnV0ZXMgKyBxLmVzdGltYXRlZE1pbnV0ZXMpO1xuICAgICAgfVxuICAgICAgc291cmNlcy5wdXNoKHtcbiAgICAgICAga2luZDogcGFwZXIua2luZCA9PT0gXCJob21ld29ya1wiID8gXCJob21ld29ya1wiIDogXCJleGFtXCIsXG4gICAgICAgIHNvdXJjZUlkOiBwYXBlci5pZCxcbiAgICAgICAgcHJvamVjdElkOiBwYXBlci5wcm9qZWN0SWQsXG4gICAgICAgIHRpdGxlOiBwYXBlci50aXRsZSxcbiAgICAgICAgbm90ZXM6IHBhcGVyLmluc3RydWN0aW9ucyxcbiAgICAgICAgc3RhcnRzQXQ6IHBhcGVyLnN0YXJ0c0F0LFxuICAgICAgICBtaW51dGVzOiBNYXRoLm1heCgxLCBtaW51dGVzKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBjb25zdCBsaW5rcyA9IG5ldyBNYXA8c3RyaW5nLCBUZWFjaGluZ1Rhc2s+KCk7XG4gIGZvciAoY29uc3QgbGluayBvZiBkYXRhLmVkdWNhdGlvbi5mb2N1c1Rhc2tzKSB7XG4gICAgbGlua3Muc2V0KGxpbmsuc291cmNlSWQsIGxpbmspO1xuICB9XG4gIGNvbnN0IHBvc2l0aW9ucyA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gIGRhdGEudGFza3MuZm9yRWFjaCgodGFzaywgaSkgPT4gcG9zaXRpb25zLnNldCh0YXNrLmlkLCBpKSk7XG4gIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gIGZvciAoY29uc3Qge1xuICAgIGtpbmQsXG4gICAgc291cmNlSWQsXG4gICAgcHJvamVjdElkLFxuICAgIHRpdGxlLFxuICAgIG5vdGVzLFxuICAgIHN0YXJ0c0F0LFxuICAgIG1pbnV0ZXMsXG4gIH0gb2Ygc291cmNlcykge1xuICAgIGNvbnN0IGxpbmsgPSBsaW5rcy5nZXQoc291cmNlSWQpO1xuICAgIGNvbnN0IHRhc2tJZCA9XG4gICAgICBsaW5rICE9PSB1bmRlZmluZWQgJiYgbGluay5raW5kID09PSBraW5kID8gbGluay50YXNrSWQgOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgcG9zaXRpb24gPSB0YXNrSWQgIT09IHVuZGVmaW5lZCA/IHBvc2l0aW9ucy5nZXQodGFza0lkKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAodGFza0lkICE9PSB1bmRlZmluZWQgJiYgcG9zaXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IGR1ZURhdGUgPSBkYXRlQXQoc3RhcnRzQXQpO1xuICAgIGNvbnN0IGlzTGVzc29uID0ga2luZCA9PT0gXCJsZXNzb25cIjtcbiAgICBjb25zdCByZW1pbmRlciA9IGtpbmQgIT09IFwiaG9tZXdvcmtcIiA/IGhvdXJNaW51dGVTdHJpbmcoc3RhcnRzQXQpIDogbnVsbDtcbiAgICBjb25zdCBmb2N1cyA9IGlzTGVzc29uID8gNDUgOiBNYXRoLm1pbihtaW51dGVzLCBkYXRhLnNldHRpbmdzLmZvY3VzTWludXRlcyk7XG4gICAgY29uc3QgZXN0aW1hdGUgPSBNYXRoLm1heCgxLCBNYXRoLmNlaWwobWludXRlcyAvIGZvY3VzKSk7XG4gICAgY29uc3Qgc2NyYXAgPVxuICAgICAga2luZCAhPT0gXCJob21ld29ya1wiXG4gICAgICAgID8gKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGQgPSBuZXcgRGF0ZShzdGFydHNBdCAqIDEwMDApO1xuICAgICAgICAgICAgcmV0dXJuIE1hdGgubWF4KDAsIDE0NDAgLSBkLmdldEhvdXJzKCkgKiA2MCAtIGQuZ2V0TWludXRlcygpIC0gNDUpO1xuICAgICAgICAgIH0pKClcbiAgICAgICAgOiAwO1xuICAgIGxldCBpbmRleDogbnVtYmVyO1xuICAgIGlmIChwb3NpdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpbmRleCA9IHBvc2l0aW9uO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB0YXNrSWROZXcgPSBpZCgpO1xuICAgICAgZGF0YS5lZHVjYXRpb24uZm9jdXNUYXNrcy5wdXNoKHsgdGFza0lkOiB0YXNrSWROZXcsIHNvdXJjZUlkLCBraW5kIH0pO1xuICAgICAgZGF0YS50YXNrcy5wdXNoKHtcbiAgICAgICAgaWQ6IHRhc2tJZE5ldyxcbiAgICAgICAgcmVwZWF0OiBcIm5vbmVcIixcbiAgICAgICAgcmVwZWF0RGF5czogW10sXG4gICAgICAgIG5leHRUYXNrSWQ6IG51bGwsXG4gICAgICAgIHJlY3VycmluZzogZmFsc2UsXG4gICAgICAgIHRpdGxlLFxuICAgICAgICBub3RlcyxcbiAgICAgICAgcHJvamVjdElkLFxuICAgICAgICBoYWJpdElkOiBudWxsLFxuICAgICAgICBkdWVEYXRlLFxuICAgICAgICByZW1pbmRlclRpbWU6IHJlbWluZGVyLFxuICAgICAgICBmb2N1c01pbnV0ZXM6IGZvY3VzLFxuICAgICAgICBzY3JhcE1pbnV0ZXM6IHNjcmFwLFxuICAgICAgICBleHBpcnlEYXlzOiAwLFxuICAgICAgICBwcmlvcml0eTogMSxcbiAgICAgICAgZXN0aW1hdGUsXG4gICAgICAgIHJlbWluZGVyRmlyZWQ6IGZhbHNlLFxuICAgICAgICByZW1pbmRlclBlbmRpbmc6IGZhbHNlLFxuICAgICAgICByZW1pbmRlckV4cGlyZWQ6IGZhbHNlLFxuICAgICAgICBjb21wbGV0ZWQ6IGZhbHNlLFxuICAgICAgICBjb21wbGV0ZWRBdDogbnVsbCxcbiAgICAgICAgY3JlYXRlZEF0OiBhdCxcbiAgICAgICAgdGFnczogW2lzTGVzc29uID8gXCJcdThCRkVcdTdBMEJcIiA6IFwiXHU0RjVDXHU0RTFBXCJdLFxuICAgICAgICBzdWJ0YXNrczogW10sXG4gICAgICB9KTtcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgaW5kZXggPSBkYXRhLnRhc2tzLmxlbmd0aCAtIDE7XG4gICAgfVxuICAgIGNvbnN0IHRhc2sgPSBkYXRhLnRhc2tzW2luZGV4XSE7XG4gICAgaWYgKFxuICAgICAgIXRhc2suY29tcGxldGVkICYmXG4gICAgICAodGFzay50aXRsZSAhPT0gdGl0bGUgfHxcbiAgICAgICAgdGFzay5ub3RlcyAhPT0gbm90ZXMgfHxcbiAgICAgICAgdGFzay5wcm9qZWN0SWQgIT09IHByb2plY3RJZCB8fFxuICAgICAgICB0YXNrLmR1ZURhdGUgIT09IGR1ZURhdGUgfHxcbiAgICAgICAgdGFzay5yZW1pbmRlclRpbWUgIT09IHJlbWluZGVyIHx8XG4gICAgICAgIHRhc2suZm9jdXNNaW51dGVzICE9PSBmb2N1cyB8fFxuICAgICAgICB0YXNrLmVzdGltYXRlICE9PSBlc3RpbWF0ZSB8fFxuICAgICAgICB0YXNrLnNjcmFwTWludXRlcyAhPT0gc2NyYXApXG4gICAgKSB7XG4gICAgICBpZiAodGFzay5kdWVEYXRlICE9PSBkdWVEYXRlIHx8IHRhc2sucmVtaW5kZXJUaW1lICE9PSByZW1pbmRlcikge1xuICAgICAgICB0YXNrLnJlbWluZGVyRmlyZWQgPSBmYWxzZTtcbiAgICAgICAgdGFzay5yZW1pbmRlclBlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgdGFzay5yZW1pbmRlckV4cGlyZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHRhc2sudGl0bGUgPSB0aXRsZTtcbiAgICAgIHRhc2subm90ZXMgPSBub3RlcztcbiAgICAgIHRhc2sucHJvamVjdElkID0gcHJvamVjdElkO1xuICAgICAgdGFzay5kdWVEYXRlID0gZHVlRGF0ZTtcbiAgICAgIHRhc2sucmVtaW5kZXJUaW1lID0gcmVtaW5kZXI7XG4gICAgICB0YXNrLmZvY3VzTWludXRlcyA9IGZvY3VzO1xuICAgICAgdGFzay5lc3RpbWF0ZSA9IGVzdGltYXRlO1xuICAgICAgdGFzay5zY3JhcE1pbnV0ZXMgPSBzY3JhcDtcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gY2hhbmdlZDtcbn1cblxuLyoqIFx1NjNEMFx1NEVBNFx1N0I1NFx1NTM3N1x1NEUwRVx1NUI4Q1x1NjIxMFx1NEVGQlx1NTJBMVx1NTIwNlx1NUYwMFx1RkYxQVx1NUI4Q1x1NjU3NFx1NjNEMFx1NEVBNFx1NTQwRVx1NEVDRFx1OTcwMFx1NzUyOFx1NjIzN1x1NjYwRVx1Nzg2RVx1Nzg2RVx1OEJBNFx1NUI4Q1x1NjIxMFx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBsZXRlVGVhY2hpbmdUYXNrKFxuICBkYXRhOiBBcHBEYXRhLFxuICB0YXNrSWQ6IHN0cmluZyxcbiAgYXQ6IG51bWJlcixcbik6IHZvaWQge1xuICBjb25zdCBsaW5rID0gdGVhY2hpbmdUYXNrKGRhdGEsIHRhc2tJZCk7XG4gIGlmIChsaW5rID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgaWYgKGxpbmsua2luZCAhPT0gXCJsZXNzb25cIikge1xuICAgIGNvbnN0IGxhc3QgPSBkYXRhLmVkdWNhdGlvbi5zdWJtaXNzaW9uc1xuICAgICAgLmZpbHRlcigocykgPT4gcy5hc3Nlc3NtZW50SWQgPT09IGxpbmsuc291cmNlSWQpXG4gICAgICAuc29ydCgoYSwgYikgPT4gYi5zdWJtaXR0ZWRBdCAtIGEuc3VibWl0dGVkQXQpWzBdO1xuICAgIGVuc3VyZShcbiAgICAgIGxhc3QgIT09IHVuZGVmaW5lZCAmJiAhbGFzdC51bmZpbmlzaGVkLFxuICAgICAgXCJcdThCRjdcdTUxNDhcdTYzRDBcdTRFQTRcdTVCOENcdTY1NzRcdTdCNTRcdTUzNzdcdUZGMENcdTUxOERcdTc4NkVcdThCQTRcdTRFRkJcdTUyQTFcdTVCOENcdTYyMTBcIixcbiAgICApO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBsZXNzb24gPSBkYXRhLmVkdWNhdGlvbi5sZXNzb25zLmZpbmQoKGwpID0+IGwuaWQgPT09IGxpbmsuc291cmNlSWQpO1xuICBlbnN1cmUobGVzc29uICE9PSB1bmRlZmluZWQsIFwiXHU4QkZFXHU3QTBCXHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICBsZXNzb24uYXR0ZW5kZWQgPSB0cnVlO1xuICBpZiAobGVzc29uLnByb2dyZXNzLnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAgICBsZXNzb24ucHJvZ3Jlc3MgPVxuICAgICAgXCJcdTY3MkNcdTRFQkFcdTRFQ0VcdTRFQ0FcdTY1RTVcdTRFMTNcdTZDRThcdTc4NkVcdThCQTRcdThCRkVcdTdBMEJcdTRFRkJcdTUyQTFcdTVCOENcdTYyMTBcdUZGMENcdTUxNzdcdTRGNTNcdTVCNjZcdTRFNjBcdTRGNERcdTdGNkVcdTVGODVcdTg4NjVcdTUxNDVcdUZGMUJcdTYzOENcdTYzRTFcdTYwQzVcdTUxQjVcdTVGODVcdTU5MERcdTZENEJcIjtcbiAgfVxuICBpZiAoYXQgPj0gbGVzc29uLmVuZHNBdCkge1xuICAgIGxlc3Nvbi5zdGF0ZSA9IFwiZW5kZWRcIjtcbiAgICBpZiAobGVzc29uLmFpRW5hYmxlZCkge1xuICAgICAgZGF0YS5lZHVjYXRpb24uZXZlbnQobGVzc29uLnByb2plY3RJZCwgXCJob21ld29ya1wiLCBsZXNzb24uaWQsIGF0KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFx1ODFFQVx1NTJBOFx1OEJBMVx1NjVGNlx1NEUwRFx1Nzg2RVx1OEJBNFx1OEJGRVx1N0EwQlx1NTNDMlx1NEUwRVx1RkYxQVx1NTNFQVx1NjcwOVx1NjYwRVx1Nzg2RVx1NUYwMFx1NTlDQi9cdTVCOENcdTYyMTBcdTYyNERcdTdCOTdcdTUzQzJcdTRFMEVcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGFydFRlYWNoaW5nVGFzayhkYXRhOiBBcHBEYXRhLCBhdDogbnVtYmVyKTogdm9pZCB7XG4gIGlmIChkYXRhLnRpbWVyLm1vZGUgIT09IFwiZm9jdXNcIikgcmV0dXJuO1xuICBjb25zdCBsaW5rID1cbiAgICBkYXRhLnRpbWVyLnRhc2tJZCAhPT0gbnVsbFxuICAgICAgPyB0ZWFjaGluZ1Rhc2soZGF0YSwgZGF0YS50aW1lci50YXNrSWQpXG4gICAgICA6IHVuZGVmaW5lZDtcbiAgaWYgKGxpbmsgPT09IHVuZGVmaW5lZCB8fCBsaW5rLmtpbmQgIT09IFwibGVzc29uXCIpIHJldHVybjtcbiAgY29uc3QgbGVzc29uID0gZGF0YS5lZHVjYXRpb24ubGVzc29ucy5maW5kKChsKSA9PiBsLmlkID09PSBsaW5rLnNvdXJjZUlkKTtcbiAgaWYgKGxlc3NvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGF0ID49IGxlc3Nvbi5zdGFydHNBdCAmJiBhdCA8IGxlc3Nvbi5lbmRzQXQpIHtcbiAgICAgIGxlc3Nvbi5hdHRlbmRlZCA9IHRydWU7XG4gICAgfVxuICB9XG59XG5cbi8qKiBcdTY3NjVcdTZFOTBcdTUxNzNcdTgwNTRcdTRFMDBcdTVCRjlcdTRFMDBcdTMwMDFcdTU0MENcdTk4NzlcdTc2RUVcdTMwMDFcdTVCOUVcdTRGOEJcdTRFM0FcdTU1MkZcdTRFMDBcdTY2NkVcdTkwMUFcdTRFRkJcdTUyQTFcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVRlYWNoaW5nVGFza3MoZGF0YTogQXBwRGF0YSk6IHZvaWQge1xuICBjb25zdCB0YXNrcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBzb3VyY2VzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgbGluayBvZiBkYXRhLmVkdWNhdGlvbi5mb2N1c1Rhc2tzKSB7XG4gICAgY29uc3QgdGFzayA9IGRhdGEudGFza3MuZmluZCgodCkgPT4gdC5pZCA9PT0gbGluay50YXNrSWQpO1xuICAgIGVuc3VyZSh0YXNrICE9PSB1bmRlZmluZWQsIFwiXHU2NTU5XHU1QjY2XHU1Rjg1XHU1MjlFXHU1MTczXHU4MDU0XHU3Njg0XHU0RUZCXHU1MkExXHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgIGNvbnN0IHByb2plY3QgPSAoKCkgPT4ge1xuICAgICAgaWYgKGxpbmsua2luZCA9PT0gXCJsZXNzb25cIikge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIGRhdGEuZWR1Y2F0aW9uLmxlc3NvbnMuZmluZCgobCkgPT4gbC5pZCA9PT0gbGluay5zb3VyY2VJZClcbiAgICAgICAgICAgID8ucHJvamVjdElkID8/IG51bGxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAoXG4gICAgICAgIGRhdGEuZWR1Y2F0aW9uLmFzc2Vzc21lbnRzLmZpbmQoXG4gICAgICAgICAgKGEpID0+XG4gICAgICAgICAgICBhLmlkID09PSBsaW5rLnNvdXJjZUlkICYmXG4gICAgICAgICAgICAobGluay5raW5kID09PSBcImhvbWV3b3JrXCJcbiAgICAgICAgICAgICAgPyBhLmtpbmQgPT09IFwiaG9tZXdvcmtcIlxuICAgICAgICAgICAgICA6IGEua2luZCAhPT0gXCJob21ld29ya1wiKSxcbiAgICAgICAgKT8ucHJvamVjdElkID8/IG51bGxcbiAgICAgICk7XG4gICAgfSkoKTtcbiAgICBlbnN1cmUocHJvamVjdCAhPT0gbnVsbCwgXCJcdTY1NTlcdTVCNjZcdTVGODVcdTUyOUVcdTY3NjVcdTZFOTBcdTRFMERcdTVCNThcdTU3MjhcdTYyMTZcdTdDN0JcdTU3OEJcdTRFMERcdTdCMjZcIik7XG4gICAgaWYgKFxuICAgICAgdGFzay5wcm9qZWN0SWQgIT09IHByb2plY3QgfHxcbiAgICAgIHRhc2tzLmhhcyhsaW5rLnRhc2tJZCkgfHxcbiAgICAgIHNvdXJjZXMuaGFzKGxpbmsuc291cmNlSWQpIHx8XG4gICAgICB0YXNrLnJlcGVhdCAhPT0gXCJub25lXCIgfHxcbiAgICAgIHRhc2suaGFiaXRJZCAhPT0gbnVsbCB8fFxuICAgICAgdGFzay5yZWN1cnJpbmdcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NjU1OVx1NUI2Nlx1Njc2NVx1NkU5MFx1NUZDNVx1OTg3Qlx1NTE3M1x1ODA1NFx1NTQwQ1x1OTg3OVx1NzZFRVx1NzY4NFx1NTUyRlx1NEUwMFx1NjY2RVx1OTAxQVx1NEVGQlx1NTJBMVwiKTtcbiAgICB9XG4gICAgdGFza3MuYWRkKGxpbmsudGFza0lkKTtcbiAgICBzb3VyY2VzLmFkZChsaW5rLnNvdXJjZUlkKTtcbiAgfVxufVxuIiwgIi8vISBcdTVCOUVcdTRGNTNcdThFQUJcdTRFRkRcdUZGMUFcdTUyMjBcdTk2NjRcdTU0MEVcdTRFQ0RcdTRGRERcdTc1NTlcdTc2N0JcdThCQjBcdUZGMUJcdTY0QTRcdTk1MDBcdTYwNjJcdTU5MERcdTU0MENcdTRFMDBcdTRFRkJcdTUyQTFcdUZGMUJcdThERThcdTdDN0JcdTU3OEJcdTU1MkZcdTRFMDBcdTMwMDJcbi8vISBcdTVCRjlcdTVFOTQgY3JhdGVzL2NvcmUvc3JjL2lkZW50aXRpZXMucnNcdTMwMDJcblxuaW1wb3J0IHsgQXBwRXJyb3IsIGVuc3VyZSwgdXRmOExlbiB9IGZyb20gXCIuL2Vycm9yc1wiO1xuaW1wb3J0IHtcbiAgYXNPcHQsXG4gIGFzU3RyLFxuICBmaWVsZCxcbiAgaXNPYmplY3QsXG4gIHJlamVjdFVua25vd24sXG4gIHJlcXVpcmVkRmllbGQsXG59IGZyb20gXCIuL2pzb25cIjtcbmltcG9ydCB0eXBlIHsgQXBwRGF0YSB9IGZyb20gXCIuL2xpYlwiO1xuaW1wb3J0IHR5cGUgeyBJZGVudGl0eSB9IGZyb20gXCIuL21vZGVsXCI7XG5pbXBvcnQgeyBwYXJzZVRhc2ssIHNlcmlhbGl6ZVRhc2sgfSBmcm9tIFwiLi9saWJcIjtcblxuY29uc3QgSURFTlRJVFlfS0VZUyA9IFtcImlkXCIsIFwia2luZFwiLCBcInJldGlyZWRcIiwgXCJyZXN0b3JlVGFza1wiXSBhcyBjb25zdDtcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSWRlbnRpdHkocmF3OiB1bmtub3duKTogSWRlbnRpdHkge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIklEIFx1NzY3Qlx1OEJCMFx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIFsuLi5JREVOVElUWV9LRVlTXSwgXCJJRCBcdTc2N0JcdThCQjBcIik7XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiSUQgXHU3NjdCXHU4QkIwXCIsIGFzU3RyKSxcbiAgICBraW5kOiByZXF1aXJlZEZpZWxkKHJhdywgXCJraW5kXCIsIFwiSUQgXHU3NjdCXHU4QkIwXCIsIGFzU3RyKSxcbiAgICByZXRpcmVkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJyZXRpcmVkXCIsIFwiSUQgXHU3NjdCXHU4QkIwXCIsICh2KSA9PiB7XG4gICAgICBpZiAodHlwZW9mIHYgIT09IFwiYm9vbGVhblwiKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJyZXRpcmVkIFx1NUZDNVx1OTg3Qlx1NjYyRlx1NUUwM1x1NUMxNFx1NTAzQ1wiKTtcbiAgICAgIHJldHVybiB2O1xuICAgIH0pLFxuICAgIHJlc3RvcmVUYXNrOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwicmVzdG9yZVRhc2tcIixcbiAgICAgIFwiSUQgXHU3NjdCXHU4QkIwXCIsXG4gICAgICAodikgPT4gYXNPcHQodiwgXCJyZXN0b3JlVGFza1wiLCBhc1N0ciksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZUlkZW50aXR5KGk6IElkZW50aXR5KTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4ge1xuICAgIGlkOiBpLmlkLFxuICAgIGtpbmQ6IGkua2luZCxcbiAgICByZXRpcmVkOiBpLnJldGlyZWQsXG4gICAgcmVzdG9yZVRhc2s6IGkucmVzdG9yZVRhc2ssXG4gIH07XG59XG5cbi8qKiBcdTVGNTNcdTUyNERcdTZEM0JcdThEQzNcdTVCOUVcdTRGNTMgSUQgXHUyMTkyIFx1N0M3Qlx1NTc4Qlx1MzAwMiAqL1xuZnVuY3Rpb24gYWN0aXZlSWRlbnRpdGllcyhkYXRhOiBBcHBEYXRhKTogTWFwPHN0cmluZywgc3RyaW5nPiB7XG4gIGNvbnN0IGlkcyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gIGNvbnN0IGFkZCA9IChpZDogc3RyaW5nLCBraW5kOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICBpZiAoaWQudHJpbSgpLmxlbmd0aCA9PT0gMCB8fCB1dGY4TGVuKGlkKSA+IDIwMCB8fCBpZHMuaGFzKGlkKSkge1xuICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU3MkVDXHU3QUNCXHU1QjlFXHU0RjUzIElEIFx1NEUzQVx1N0E3QVx1MzAwMVx1OEZDN1x1OTU3Rlx1NjIxNlx1OTFDRFx1NTkwRFwiKTtcbiAgICB9XG4gICAgaWRzLnNldChpZCwga2luZCk7XG4gIH07XG4gIGZvciAoY29uc3QgeCBvZiBkYXRhLnByb2plY3RzKSBhZGQoeC5pZCwgXCJwcm9qZWN0XCIpO1xuICBmb3IgKGNvbnN0IHggb2YgZGF0YS5oYWJpdHMpIGFkZCh4LmlkLCBcImhhYml0XCIpO1xuICBmb3IgKGNvbnN0IHggb2YgZGF0YS52aXNpb25zKSBhZGQoeC5pZCwgXCJ2aXNpb25cIik7XG4gIGZvciAoY29uc3QgeCBvZiBkYXRhLmJsb2NrcykgYWRkKHguaWQsIFwiYmxvY2tcIik7XG4gIGZvciAoY29uc3QgeCBvZiBkYXRhLnRhc2tzKSBhZGQoeC5pZCwgXCJ0YXNrXCIpO1xuICBmb3IgKGNvbnN0IHggb2YgZGF0YS5zZXNzaW9ucykgYWRkKHguaWQsIFwic2Vzc2lvblwiKTtcbiAgZm9yIChjb25zdCB4IG9mIGRhdGEuZWR1Y2F0aW9uLnJlc291cmNlcykgYWRkKHguaWQsIFwicmVzb3VyY2VcIik7XG4gIGZvciAoY29uc3QgeCBvZiBkYXRhLmVkdWNhdGlvbi5zZW1lc3RlcnMpIGFkZCh4LmlkLCBcInNlbWVzdGVyXCIpO1xuICBmb3IgKGNvbnN0IHggb2YgZGF0YS5lZHVjYXRpb24ubGVzc29ucykgYWRkKHguaWQsIFwibGVzc29uXCIpO1xuICBmb3IgKGNvbnN0IHggb2YgZGF0YS5lZHVjYXRpb24uYXNzZXNzbWVudHMpIGFkZCh4LmlkLCBcImFzc2Vzc21lbnRcIik7XG4gIGZvciAoY29uc3QgeCBvZiBkYXRhLmVkdWNhdGlvbi5zdWJtaXNzaW9ucykgYWRkKHguaWQsIFwic3VibWlzc2lvblwiKTtcbiAgZm9yIChjb25zdCB4IG9mIGRhdGEuZWR1Y2F0aW9uLmdyYWRlcykgYWRkKHguaWQsIFwiZ3JhZGVcIik7XG4gIGZvciAoY29uc3QgeCBvZiBkYXRhLmVkdWNhdGlvbi5yZXZpZXdzKSBhZGQoeC5pZCwgXCJyZXZpZXdcIik7XG4gIGZvciAoY29uc3QgeCBvZiBkYXRhLmVkdWNhdGlvbi5wcm9ncmVzcykgYWRkKHguaWQsIFwicHJvZ3Jlc3NcIik7XG4gIGZvciAoY29uc3QgeCBvZiBkYXRhLmVkdWNhdGlvbi5jb3JyZWN0aW9ucykgYWRkKHguaWQsIFwiY29ycmVjdGlvblwiKTtcbiAgcmV0dXJuIGlkcztcbn1cblxuY29uc3QgQUxMT1dFRF9LSU5EUyA9IFtcbiAgXCJwcm9qZWN0XCIsXG4gIFwiaGFiaXRcIixcbiAgXCJ2aXNpb25cIixcbiAgXCJ0YXNrXCIsXG4gIFwidGVtcGxhdGVcIixcbiAgXCJzZXNzaW9uXCIsXG4gIFwiYmxvY2tcIixcbiAgXCJyZXNvdXJjZVwiLFxuICBcInNlbWVzdGVyXCIsXG4gIFwibGVzc29uXCIsXG4gIFwiYXNzZXNzbWVudFwiLFxuICBcInN1Ym1pc3Npb25cIixcbiAgXCJncmFkZVwiLFxuICBcInJldmlld1wiLFxuICBcInByb2dyZXNzXCIsXG4gIFwiY29ycmVjdGlvblwiLFxuXTtcblxuLyoqXG4gKiBcdTYzRDBcdTRFQTRcdTUyNERcdTY4MzhcdTVCRjlcdThFQUJcdTRFRkRcdTUzODZcdTUzRjJcdUZGMUFcdTUyMjBcdTk2NjRcdTc2ODQgSUQgXHU2QzM4XHU0RTQ1XHU0RkREXHU3NTU5XHVGRjBDXHU2MDYyXHU1OTBEXHU1M0VBXHU4MEZEXHU2MDYyXHU1OTBEXHU3NjdCXHU4QkIwXHU0RTJEXHU3Njg0XHU1MzlGXHU0RUZCXHU1MkExXHUzMDAyXG4gKiBgcmVzdG9yZV9pZGAgXHU2NjJGXHU2NzJDXHU2QjIxXHU1MkE4XHU0RjVDXHU5MUNDXHU2QjYzXHU1NzI4XHU2MDYyXHU1OTBEXHU3Njg0XHU0RUZCXHU1MkExIElEXHUzMDAyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWNvbmNpbGVJZGVudGl0aWVzKFxuICBiZWZvcmU6IEFwcERhdGEsXG4gIGFmdGVyOiBBcHBEYXRhLFxuICByZXN0b3JlSWQ6IHN0cmluZyB8IG51bGwsXG4pOiB2b2lkIHtcbiAgY29uc3Qgb2xkQWN0aXZlID0gYWN0aXZlSWRlbnRpdGllcyhiZWZvcmUpO1xuICBjb25zdCBuZXdBY3RpdmUgPSBhY3RpdmVJZGVudGl0aWVzKGFmdGVyKTtcbiAgY29uc3QgZW50cmllcyA9IG5ldyBNYXA8c3RyaW5nLCBJZGVudGl0eT4oKTtcbiAgZm9yIChjb25zdCByZWNvcmQgb2YgWy4uLmJlZm9yZS5pZGVudGl0aWVzLCAuLi5hZnRlci5pZGVudGl0aWVzXSkge1xuICAgIGNvbnN0IG9sZCA9IGVudHJpZXMuZ2V0KHJlY29yZC5pZCk7XG4gICAgaWYgKG9sZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAob2xkLmtpbmQgIT09IHJlY29yZC5raW5kKSB7XG4gICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NTM4Nlx1NTNGMiBJRCBcdTRFMERcdTgwRkRcdThGNkNcdTc1MjhcdTRFOEVcdTUzRTZcdTRFMDBcdTc5Q0RcdTVCOUVcdTRGNTNcIik7XG4gICAgICB9XG4gICAgICBvbGQucmV0aXJlZCA9IG9sZC5yZXRpcmVkIHx8IHJlY29yZC5yZXRpcmVkO1xuICAgICAgaWYgKG9sZC5yZXN0b3JlVGFzayA9PT0gbnVsbCkge1xuICAgICAgICBvbGQucmVzdG9yZVRhc2sgPSByZWNvcmQucmVzdG9yZVRhc2s7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGVudHJpZXMuc2V0KHJlY29yZC5pZCwgeyAuLi5yZWNvcmQsIHJlc3RvcmVUYXNrOiByZWNvcmQucmVzdG9yZVRhc2sgfSk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgW2lkLCBraW5kXSBvZiBvbGRBY3RpdmUpIHtcbiAgICBpZiAoIWVudHJpZXMuaGFzKGlkKSkge1xuICAgICAgZW50cmllcy5zZXQoaWQsIHsgaWQsIGtpbmQsIHJldGlyZWQ6IGZhbHNlLCByZXN0b3JlVGFzazogbnVsbCB9KTtcbiAgICB9XG4gIH1cbiAgLy8gXHU1REYyXHU1MjIwXHU5NjY0XHU0RUZCXHU1MkExXHU1M0VBXHU4MEZEXHU5MDFBXHU4RkM3XHU1Mzg2XHU1M0YyXHU0RTEzXHU2Q0U4XHU4QkIwXHU1RjU1XHU1M0VGXHU4OUMxXHUzMDAyXG4gIGNvbnN0IHZpc2l0ID0gKHNvdXJjZTogQXBwRGF0YSwgbGl2ZTogTWFwPHN0cmluZywgc3RyaW5nPik6IHZvaWQgPT4ge1xuICAgIGZvciAoY29uc3Qgc2Vzc2lvbiBvZiBzb3VyY2Uuc2Vzc2lvbnMpIHtcbiAgICAgIGNvbnN0IHRhc2tJZCA9IHNlc3Npb24udGFza0lkO1xuICAgICAgaWYgKHRhc2tJZCA9PT0gbnVsbCkgY29udGludWU7XG4gICAgICBjb25zdCByZWNvcmQgPSBlbnRyaWVzLmdldCh0YXNrSWQpO1xuICAgICAgaWYgKHJlY29yZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChyZWNvcmQua2luZCAhPT0gXCJ0YXNrXCIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTUzODZcdTUzRjJcdTRFRkJcdTUyQTFcdTVGMTVcdTc1MjhcdTc2ODQgSUQgXHU0RTBFXHU1MTc2XHU0RUQ2XHU1QjlFXHU0RjUzXHU1MUIyXHU3QTgxXCIpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbnRyaWVzLnNldCh0YXNrSWQsIHtcbiAgICAgICAgICBpZDogdGFza0lkLFxuICAgICAgICAgIGtpbmQ6IFwidGFza1wiLFxuICAgICAgICAgIHJldGlyZWQ6ICFsaXZlLmhhcyh0YXNrSWQpLFxuICAgICAgICAgIHJlc3RvcmVUYXNrOiBudWxsLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIHZpc2l0KGJlZm9yZSwgb2xkQWN0aXZlKTtcbiAgdmlzaXQoYWZ0ZXIsIG5ld0FjdGl2ZSk7XG4gIGZvciAoY29uc3QgW2lkLCBraW5kXSBvZiBuZXdBY3RpdmUpIHtcbiAgICBjb25zdCByZWNvcmQgPSBlbnRyaWVzLmdldChpZCk7XG4gICAgaWYgKHJlY29yZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAocmVjb3JkLmtpbmQgIT09IGtpbmQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU1Mzg2XHU1M0YyIElEIFx1NEUwRFx1ODBGRFx1ODhBQlx1NTE3Nlx1NEVENlx1NUI5RVx1NEY1M1x1NTkwRFx1NzUyOFwiKTtcbiAgICAgIH1cbiAgICAgIGlmIChyZWNvcmQucmV0aXJlZCkge1xuICAgICAgICBjb25zdCBzYW1lVGFzayA9IHJlc3RvcmVJZCA9PT0gaWQgJiYga2luZCA9PT0gXCJ0YXNrXCI7XG4gICAgICAgIGlmICghc2FtZVRhc2spIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXG4gICAgICAgICAgICBcIlx1NTM4Nlx1NTNGMiBJRCBcdTVERjJcdTg4QUJcdTZDMzhcdTRFNDVcdTRGRERcdTc1NTlcdUZGMENcdTRFMERcdTgwRkRcdTc1MjhcdTRFOEVcdTY1QjBcdTVFRkFcdTYyMTZcdTVCRkNcdTUxNjVcdTUxNzZcdTRFRDZcdTVCOUVcdTRGNTNcIixcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJlY29yZC5yZXRpcmVkID0gZmFsc2U7XG4gICAgICAgIHJlY29yZC5yZXN0b3JlVGFzayA9IG51bGw7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGVudHJpZXMuc2V0KGlkLCB7IGlkLCBraW5kLCByZXRpcmVkOiBmYWxzZSwgcmVzdG9yZVRhc2s6IG51bGwgfSk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgcmVjb3JkIG9mIGVudHJpZXMudmFsdWVzKCkpIHtcbiAgICBpZiAoIW5ld0FjdGl2ZS5oYXMocmVjb3JkLmlkKSkge1xuICAgICAgcmVjb3JkLnJldGlyZWQgPSB0cnVlO1xuICAgICAgaWYgKHJlY29yZC5raW5kID09PSBcInRhc2tcIikge1xuICAgICAgICBjb25zdCB0YXNrID0gYmVmb3JlLnRhc2tzLmZpbmQoKHQpID0+IHQuaWQgPT09IHJlY29yZC5pZCk7XG4gICAgICAgIGlmICh0YXNrICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICByZWNvcmQucmVzdG9yZVRhc2sgPSBKU09OLnN0cmluZ2lmeShzZXJpYWxpemVUYXNrKHRhc2spKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBjb25zdCByZWNvcmRzID0gWy4uLmVudHJpZXMudmFsdWVzKCldLnNvcnQoKGEsIGIpID0+XG4gICAgYS5pZCA8IGIuaWQgPyAtMSA6IGEuaWQgPiBiLmlkID8gMSA6IDAsXG4gICk7XG4gIGFmdGVyLmlkZW50aXRpZXMgPSByZWNvcmRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVJZGVudGl0aWVzKGRhdGE6IEFwcERhdGEpOiB2b2lkIHtcbiAgY29uc3QgY3VycmVudCA9IGFjdGl2ZUlkZW50aXRpZXMoZGF0YSk7XG4gIGNvbnN0IHNlZW4gPSBuZXcgTWFwPHN0cmluZywgdHJ1ZT4oKTtcbiAgaWYgKGRhdGEuaWRlbnRpdGllcy5sZW5ndGggPiAxMDAwMDAwKSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiSUQgXHU1Mzg2XHU1M0YyXHU2NTcwXHU5MUNGXHU4RDg1XHU1MUZBXHU5NjUwXHU1MjM2XCIpO1xuICB9XG4gIGZvciAoY29uc3QgcmVjb3JkIG9mIGRhdGEuaWRlbnRpdGllcykge1xuICAgIGlmIChcbiAgICAgIHJlY29yZC5pZC50cmltKCkubGVuZ3RoID09PSAwIHx8XG4gICAgICB1dGY4TGVuKHJlY29yZC5pZCkgPiAyMDAgfHxcbiAgICAgIHNlZW4uaGFzKHJlY29yZC5pZCkgfHxcbiAgICAgICFBTExPV0VEX0tJTkRTLmluY2x1ZGVzKHJlY29yZC5raW5kKVxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2NUUwXHU2NTQ4XHU3Njg0IElEIFx1NTM4Nlx1NTNGMlx1NzY3Qlx1OEJCMFwiKTtcbiAgICB9XG4gICAgc2Vlbi5zZXQocmVjb3JkLmlkLCB0cnVlKTtcbiAgICAvLyBcdTkwMDBcdTRGMTFcdTcyQjZcdTYwMDFcdTc1MzEgcmVjb25jaWxlIFx1NjhDMFx1NjdFNVx1RkYwQ1x1NTE0MVx1OEJCOFx1NURGMlx1OUE4Q1x1OEJDMVx1NzY4NFx1NjRBNFx1OTUwMFx1NTAxOVx1OTAwOVx1NUI1OFx1NTcyOFx1MzAwMlxuICAgIGlmIChjdXJyZW50LmhhcyhyZWNvcmQuaWQpICYmIGN1cnJlbnQuZ2V0KHJlY29yZC5pZCkgIT09IHJlY29yZC5raW5kKSB7XG4gICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTUzODZcdTUzRjIgSUQgXHU3QzdCXHU1NzhCXHU1MUIyXHU3QTgxXCIpO1xuICAgIH1cbiAgICBpZiAocmVjb3JkLnJlc3RvcmVUYXNrICE9PSBudWxsKSB7XG4gICAgICBsZXQgdGFzaztcbiAgICAgIHRyeSB7XG4gICAgICAgIHRhc2sgPSBwYXJzZVRhc2soSlNPTi5wYXJzZShyZWNvcmQucmVzdG9yZVRhc2spKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTY1RTBcdTY1NDhcdTc2ODRcdTRFRkJcdTUyQTFcdTYwNjJcdTU5MERcdThCQjBcdTVGNTVcIik7XG4gICAgICB9XG4gICAgICBpZiAocmVjb3JkLmtpbmQgIT09IFwidGFza1wiIHx8IHRhc2suaWQgIT09IHJlY29yZC5pZCB8fCAhcmVjb3JkLnJldGlyZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU0RUZCXHU1MkExXHU2MDYyXHU1OTBEXHU4QkIwXHU1RjU1XHU0RTBFIElEIFx1NzY3Qlx1OEJCMFx1NEUwRFx1NEUwMFx1ODFGNFwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiIsICIvLyEgXHU1QjY2XHU0RTYwXHU4QkExXHU1MjEyIHY3XHVGRjFBXHU0RkJGXHU2NDNBXHU4QkExXHU1MjEyXHU1MjNCXHU2MTBGXHU0RTBEXHU1NDJCXHU2MjY3XHU4ODRDXHU1Mzg2XHU1M0YyXHU0RTBFXHU2NzJDXHU2NzNBXHU1MDRGXHU1OTdEXHUzMDAyXG4vLyEgXHU1QkY5XHU1RTk0IGNyYXRlcy9jb3JlL3NyYy9wbGFuLnJzXHUzMDAyXG5cbmltcG9ydCB7IEFwcEVycm9yLCBjbG9uZSwgZW5zdXJlIH0gZnJvbSBcIi4vZXJyb3JzXCI7XG5pbXBvcnQge1xuICBhc0FycmF5LFxuICBhc0Jvb2wsXG4gIGFzSW50LFxuICBhc09wdCxcbiAgYXNTdHIsXG4gIGZpZWxkLFxuICBpc09iamVjdCxcbiAgb25lT2YsXG4gIHJlamVjdFVua25vd24sXG4gIHJlcXVpcmVkRmllbGQsXG59IGZyb20gXCIuL2pzb25cIjtcbmltcG9ydCB7IEFwcERhdGEgfSBmcm9tIFwiLi9saWJcIjtcbmltcG9ydCB0eXBlIHtcbiAgUGxhbkZpbGUsXG4gIFBsYW5Qcm9qZWN0LFxuICBQbGFuU3VidGFzayxcbiAgUGxhblRhc2ssXG4gIFJlcGVhdCxcbiAgVGFzayxcbn0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IHJlcGxhY2VBcHBEYXRhIH0gZnJvbSBcIi4vcmVjdXJyZW5jZVwiO1xuaW1wb3J0IHsgcGFyc2VCbG9jaywgc2VyaWFsaXplQmxvY2sgfSBmcm9tIFwiLi9ibG9ja3NcIjtcbmltcG9ydCB7IHBhcnNlSGFiaXQsIHNlcmlhbGl6ZUhhYml0IH0gZnJvbSBcIi4vaGFiaXRzXCI7XG5cbmNvbnN0IFBMQU5fRklMRV9LRVlTID0gW1xuICBcImZvcm1hdFwiLFxuICBcInZlcnNpb25cIixcbiAgXCJwb21vZG9yb01pbnV0ZXNcIixcbiAgXCJwcm9qZWN0c1wiLFxuICBcInRhc2tzXCIsXG4gIFwiYmxvY2tzXCIsXG4gIFwiaGFiaXRzXCIsXG4gIFwicmVwbGFjZVwiLFxuXSBhcyBjb25zdDtcbmNvbnN0IFBMQU5fUFJPSkVDVF9LRVlTID0gW1wiaWRcIiwgXCJuYW1lXCIsIFwiY29sb3JcIiwgXCJhcHBXaGl0ZWxpc3RcIl0gYXMgY29uc3Q7XG5jb25zdCBQTEFOX1RBU0tfS0VZUyA9IFtcbiAgXCJpZFwiLFxuICBcInRpdGxlXCIsXG4gIFwiaGFiaXRJZFwiLFxuICBcInJlY3VycmluZ1wiLFxuICBcInNjcmFwTWludXRlc1wiLFxuICBcImV4cGlyeURheXNcIixcbiAgXCJub3Rlc1wiLFxuICBcInByb2plY3RJZFwiLFxuICBcImR1ZURhdGVcIixcbiAgXCJyZW1pbmRlclRpbWVcIixcbiAgXCJmb2N1c01pbnV0ZXNcIixcbiAgXCJwcmlvcml0eVwiLFxuICBcImVzdGltYXRlXCIsXG4gIFwidGFnc1wiLFxuICBcInN1YnRhc2tzXCIsXG4gIFwicmVwZWF0XCIsXG4gIFwicmVwZWF0RGF5c1wiLFxuXSBhcyBjb25zdDtcbmNvbnN0IFBMQU5fU1VCVEFTS19LRVlTID0gW1wiaWRcIiwgXCJ0aXRsZVwiXSBhcyBjb25zdDtcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUGxhbkZpbGUocmF3OiB1bmtub3duKTogUGxhbkZpbGUge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJBMVx1NTIxMlx1NjU4N1x1NEVGNlx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIFsuLi5QTEFOX0ZJTEVfS0VZU10sIFwiXHU4QkExXHU1MjEyXHU2NTg3XHU0RUY2XCIpO1xuICByZXR1cm4ge1xuICAgIGZvcm1hdDogcmVxdWlyZWRGaWVsZChyYXcsIFwiZm9ybWF0XCIsIFwiXHU4QkExXHU1MjEyXHU2NTg3XHU0RUY2XCIsIGFzU3RyKSxcbiAgICB2ZXJzaW9uOiByZXF1aXJlZEZpZWxkKHJhdywgXCJ2ZXJzaW9uXCIsIFwiXHU4QkExXHU1MjEyXHU2NTg3XHU0RUY2XCIsIGFzSW50KSxcbiAgICBwb21vZG9yb01pbnV0ZXM6IHJlcXVpcmVkRmllbGQocmF3LCBcInBvbW9kb3JvTWludXRlc1wiLCBcIlx1OEJBMVx1NTIxMlx1NjU4N1x1NEVGNlwiLCBhc0ludCksXG4gICAgcHJvamVjdHM6IHJlcXVpcmVkRmllbGQocmF3LCBcInByb2plY3RzXCIsIFwiXHU4QkExXHU1MjEyXHU2NTg3XHU0RUY2XCIsICh2KSA9PlxuICAgICAgYXNBcnJheSh2LCBcInByb2plY3RzXCIpLm1hcChwYXJzZVBsYW5Qcm9qZWN0KSxcbiAgICApLFxuICAgIHRhc2tzOiByZXF1aXJlZEZpZWxkKHJhdywgXCJ0YXNrc1wiLCBcIlx1OEJBMVx1NTIxMlx1NjU4N1x1NEVGNlwiLCAodikgPT5cbiAgICAgIGFzQXJyYXkodiwgXCJ0YXNrc1wiKS5tYXAocGFyc2VQbGFuVGFzayksXG4gICAgKSxcbiAgICBibG9ja3M6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJibG9ja3NcIixcbiAgICAgIFwiXHU4QkExXHU1MjEyXHU2NTg3XHU0RUY2XCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcImJsb2Nrc1wiKS5tYXAocGFyc2VCbG9jayksXG4gICAgICBbXSxcbiAgICApLFxuICAgIGhhYml0czogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImhhYml0c1wiLFxuICAgICAgXCJcdThCQTFcdTUyMTJcdTY1ODdcdTRFRjZcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwiaGFiaXRzXCIpLm1hcChwYXJzZUhhYml0KSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgcmVwbGFjZTogZmllbGQocmF3LCBcInJlcGxhY2VcIiwgXCJcdThCQTFcdTUyMTJcdTY1ODdcdTRFRjZcIiwgYXNCb29sLCBmYWxzZSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIHBhcnNlUGxhblByb2plY3QocmF3OiB1bmtub3duKTogUGxhblByb2plY3Qge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJBMVx1NTIxMlx1OTg3OVx1NzZFRVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIFsuLi5QTEFOX1BST0pFQ1RfS0VZU10sIFwiXHU4QkExXHU1MjEyXHU5ODc5XHU3NkVFXCIpO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1OEJBMVx1NTIxMlx1OTg3OVx1NzZFRVwiLCBhc1N0ciksXG4gICAgbmFtZTogcmVxdWlyZWRGaWVsZChyYXcsIFwibmFtZVwiLCBcIlx1OEJBMVx1NTIxMlx1OTg3OVx1NzZFRVwiLCBhc1N0ciksXG4gICAgY29sb3I6IHJlcXVpcmVkRmllbGQocmF3LCBcImNvbG9yXCIsIFwiXHU4QkExXHU1MjEyXHU5ODc5XHU3NkVFXCIsIGFzU3RyKSxcbiAgICBhcHBXaGl0ZWxpc3Q6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJhcHBXaGl0ZWxpc3RcIixcbiAgICAgIFwiXHU4QkExXHU1MjEyXHU5ODc5XHU3NkVFXCIsXG4gICAgICAodikgPT5cbiAgICAgICAgYXNPcHQodiwgXCJhcHBXaGl0ZWxpc3RcIiwgKHgpID0+XG4gICAgICAgICAgYXNBcnJheSh4LCBcImFwcFdoaXRlbGlzdFwiKS5tYXAoKGEpID0+IGFzU3RyKGEsIFwiXHU1RTk0XHU3NTI4IElEXCIpKSxcbiAgICAgICAgKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmdbXSB8IG51bGwsXG4gIH07XG59XG5cbmZ1bmN0aW9uIHBhcnNlUGxhblN1YnRhc2socmF3OiB1bmtub3duKTogUGxhblN1YnRhc2sge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJBMVx1NTIxMlx1NUI1MFx1NkI2NVx1OUFBNFx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmVqZWN0VW5rbm93bihyYXcsIFsuLi5QTEFOX1NVQlRBU0tfS0VZU10sIFwiXHU4QkExXHU1MjEyXHU1QjUwXHU2QjY1XHU5QUE0XCIpO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1OEJBMVx1NTIxMlx1NUI1MFx1NkI2NVx1OUFBNFwiLCBhc1N0ciksXG4gICAgdGl0bGU6IHJlcXVpcmVkRmllbGQocmF3LCBcInRpdGxlXCIsIFwiXHU4QkExXHU1MjEyXHU1QjUwXHU2QjY1XHU5QUE0XCIsIGFzU3RyKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gcGFyc2VQbGFuVGFzayhyYXc6IHVua25vd24pOiBQbGFuVGFzayB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4QkExXHU1MjEyXHU0RUZCXHU1MkExXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKHJhdywgWy4uLlBMQU5fVEFTS19LRVlTXSwgXCJcdThCQTFcdTUyMTJcdTRFRkJcdTUyQTFcIik7XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImlkXCIsIFwiXHU4QkExXHU1MjEyXHU0RUZCXHU1MkExXCIsIGFzU3RyKSxcbiAgICB0aXRsZTogcmVxdWlyZWRGaWVsZChyYXcsIFwidGl0bGVcIiwgXCJcdThCQTFcdTUyMTJcdTRFRkJcdTUyQTFcIiwgYXNTdHIpLFxuICAgIGhhYml0SWQ6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJoYWJpdElkXCIsXG4gICAgICBcIlx1OEJBMVx1NTIxMlx1NEVGQlx1NTJBMVwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiaGFiaXRJZFwiLCBhc1N0ciksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgICByZWN1cnJpbmc6IGZpZWxkKHJhdywgXCJyZWN1cnJpbmdcIiwgXCJcdThCQTFcdTUyMTJcdTRFRkJcdTUyQTFcIiwgYXNCb29sLCBmYWxzZSksXG4gICAgc2NyYXBNaW51dGVzOiBmaWVsZChyYXcsIFwic2NyYXBNaW51dGVzXCIsIFwiXHU4QkExXHU1MjEyXHU0RUZCXHU1MkExXCIsIGFzSW50LCAwKSxcbiAgICBleHBpcnlEYXlzOiBmaWVsZChyYXcsIFwiZXhwaXJ5RGF5c1wiLCBcIlx1OEJBMVx1NTIxMlx1NEVGQlx1NTJBMVwiLCBhc0ludCwgMCksXG4gICAgbm90ZXM6IGZpZWxkKHJhdywgXCJub3Rlc1wiLCBcIlx1OEJBMVx1NTIxMlx1NEVGQlx1NTJBMVwiLCBhc1N0ciwgXCJcIiksXG4gICAgcHJvamVjdElkOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwicHJvamVjdElkXCIsXG4gICAgICBcIlx1OEJBMVx1NTIxMlx1NEVGQlx1NTJBMVwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwicHJvamVjdElkXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgIGR1ZURhdGU6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJkdWVEYXRlXCIsXG4gICAgICBcIlx1OEJBMVx1NTIxMlx1NEVGQlx1NTJBMVwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiZHVlRGF0ZVwiLCBhc1N0ciksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgICByZW1pbmRlclRpbWU6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJyZW1pbmRlclRpbWVcIixcbiAgICAgIFwiXHU4QkExXHU1MjEyXHU0RUZCXHU1MkExXCIsXG4gICAgICAodikgPT4gYXNPcHQodiwgXCJyZW1pbmRlclRpbWVcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gICAgZm9jdXNNaW51dGVzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiZm9jdXNNaW51dGVzXCIsXG4gICAgICBcIlx1OEJBMVx1NTIxMlx1NEVGQlx1NTJBMVwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiZm9jdXNNaW51dGVzXCIsICh4KSA9PiBhc0ludCh4LCBcImZvY3VzTWludXRlc1wiKSksXG4gICAgICBudWxsLFxuICAgICkgYXMgbnVtYmVyIHwgbnVsbCxcbiAgICBwcmlvcml0eTogZmllbGQocmF3LCBcInByaW9yaXR5XCIsIFwiXHU4QkExXHU1MjEyXHU0RUZCXHU1MkExXCIsIGFzSW50LCAwKSxcbiAgICBlc3RpbWF0ZTogZmllbGQocmF3LCBcImVzdGltYXRlXCIsIFwiXHU4QkExXHU1MjEyXHU0RUZCXHU1MkExXCIsIGFzSW50LCAxKSxcbiAgICB0YWdzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidGFnc1wiLFxuICAgICAgXCJcdThCQTFcdTUyMTJcdTRFRkJcdTUyQTFcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwidGFnc1wiKS5tYXAoKHQpID0+IGFzU3RyKHQsIFwiXHU2ODA3XHU3QjdFXCIpKSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgc3VidGFza3M6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJzdWJ0YXNrc1wiLFxuICAgICAgXCJcdThCQTFcdTUyMTJcdTRFRkJcdTUyQTFcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwic3VidGFza3NcIikubWFwKHBhcnNlUGxhblN1YnRhc2spLFxuICAgICAgW10sXG4gICAgKSxcbiAgICByZXBlYXQ6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJyZXBlYXRcIixcbiAgICAgIFwiXHU4QkExXHU1MjEyXHU0RUZCXHU1MkExXCIsXG4gICAgICAodikgPT4gb25lT2YodiwgXCJyZXBlYXRcIiwgW1wibm9uZVwiLCBcImRhaWx5XCIsIFwid2Vla2RheXNcIiwgXCJ3ZWVrbHlcIl0pLFxuICAgICAgXCJub25lXCIsXG4gICAgKSBhcyBSZXBlYXQsXG4gICAgcmVwZWF0RGF5czogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInJlcGVhdERheXNcIixcbiAgICAgIFwiXHU4QkExXHU1MjEyXHU0RUZCXHU1MkExXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcInJlcGVhdERheXNcIikubWFwKChkKSA9PiBhc0ludChkLCBcIlx1OTFDRFx1NTkwRFx1NjYxRlx1NjcxRlwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplUGxhbkZpbGUocGxhbjogUGxhbkZpbGUpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgZm9ybWF0OiBwbGFuLmZvcm1hdCxcbiAgICB2ZXJzaW9uOiBwbGFuLnZlcnNpb24sXG4gICAgcG9tb2Rvcm9NaW51dGVzOiBwbGFuLnBvbW9kb3JvTWludXRlcyxcbiAgICBwcm9qZWN0czogcGxhbi5wcm9qZWN0cy5tYXAoKHApID0+IHtcbiAgICAgIGNvbnN0IG86IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuICAgICAgICBpZDogcC5pZCxcbiAgICAgICAgbmFtZTogcC5uYW1lLFxuICAgICAgICBjb2xvcjogcC5jb2xvcixcbiAgICAgIH07XG4gICAgICBpZiAocC5hcHBXaGl0ZWxpc3QgIT09IG51bGwpIG9bXCJhcHBXaGl0ZWxpc3RcIl0gPSBwLmFwcFdoaXRlbGlzdDtcbiAgICAgIHJldHVybiBvO1xuICAgIH0pLFxuICAgIHRhc2tzOiBwbGFuLnRhc2tzLm1hcCgodCkgPT4ge1xuICAgICAgY29uc3QgbzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgICAgIGlkOiB0LmlkLFxuICAgICAgICB0aXRsZTogdC50aXRsZSxcbiAgICAgICAgaGFiaXRJZDogdC5oYWJpdElkLFxuICAgICAgICByZWN1cnJpbmc6IHQucmVjdXJyaW5nLFxuICAgICAgICBzY3JhcE1pbnV0ZXM6IHQuc2NyYXBNaW51dGVzLFxuICAgICAgICBleHBpcnlEYXlzOiB0LmV4cGlyeURheXMsXG4gICAgICAgIG5vdGVzOiB0Lm5vdGVzLFxuICAgICAgICBwcm9qZWN0SWQ6IHQucHJvamVjdElkLFxuICAgICAgICBkdWVEYXRlOiB0LmR1ZURhdGUsXG4gICAgICAgIHByaW9yaXR5OiB0LnByaW9yaXR5LFxuICAgICAgICBlc3RpbWF0ZTogdC5lc3RpbWF0ZSxcbiAgICAgICAgdGFnczogdC50YWdzLFxuICAgICAgICBzdWJ0YXNrczogdC5zdWJ0YXNrcy5tYXAoKHMpID0+ICh7IGlkOiBzLmlkLCB0aXRsZTogcy50aXRsZSB9KSksXG4gICAgICAgIHJlcGVhdDogdC5yZXBlYXQsXG4gICAgICAgIHJlcGVhdERheXM6IHQucmVwZWF0RGF5cyxcbiAgICAgIH07XG4gICAgICBpZiAodC5yZW1pbmRlclRpbWUgIT09IG51bGwpIG9bXCJyZW1pbmRlclRpbWVcIl0gPSB0LnJlbWluZGVyVGltZTtcbiAgICAgIGlmICh0LmZvY3VzTWludXRlcyAhPT0gbnVsbCkgb1tcImZvY3VzTWludXRlc1wiXSA9IHQuZm9jdXNNaW51dGVzO1xuICAgICAgcmV0dXJuIG87XG4gICAgfSksXG4gICAgYmxvY2tzOiBwbGFuLmJsb2Nrcy5tYXAoc2VyaWFsaXplQmxvY2spLFxuICAgIGhhYml0czogcGxhbi5oYWJpdHMubWFwKHNlcmlhbGl6ZUhhYml0KSxcbiAgfTtcbiAgaWYgKHBsYW4ucmVwbGFjZSkgb3V0W1wicmVwbGFjZVwiXSA9IHRydWU7XG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKiBcdTY1ODdcdTRFRjZcdTVCOUVcdTRGOEIgXHUyMTkyIFx1NjcyQ1x1NTczMFx1NEVGQlx1NTJBMVx1RkYxQVx1OEZEQlx1NUVBNlx1NEUwRVx1NTM4Nlx1NTNGMlx1NzU1OVx1NTcyOFx1NjcyQ1x1NjczQVx1MzAwMiAqL1xuZnVuY3Rpb24gcGxhblRhc2tUb1Rhc2sodDogUGxhblRhc2ssIGF0OiBudW1iZXIsIGVzdGltYXRlOiBudW1iZXIpOiBUYXNrIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogdC5pZCxcbiAgICByZWN1cnJpbmc6IHQucmVjdXJyaW5nIHx8IHQucmVwZWF0ICE9PSBcIm5vbmVcIiB8fCB0LmR1ZURhdGUgPT09IG51bGwsXG4gICAgcmVwZWF0OiB0LmR1ZURhdGUgPT09IG51bGwgJiYgdC5yZXBlYXQgPT09IFwibm9uZVwiID8gXCJkYWlseVwiIDogdC5yZXBlYXQsXG4gICAgcmVwZWF0RGF5czogWy4uLnQucmVwZWF0RGF5c10sXG4gICAgbmV4dFRhc2tJZDogbnVsbCxcbiAgICB0aXRsZTogdC50aXRsZSxcbiAgICBub3RlczogdC5ub3RlcyxcbiAgICBwcm9qZWN0SWQ6IHQucHJvamVjdElkLFxuICAgIGhhYml0SWQ6IHQuaGFiaXRJZCxcbiAgICBkdWVEYXRlOiB0LmR1ZURhdGUsXG4gICAgcmVtaW5kZXJUaW1lOiB0LnJlbWluZGVyVGltZSxcbiAgICBmb2N1c01pbnV0ZXM6IHQuZm9jdXNNaW51dGVzLFxuICAgIHJlbWluZGVyRmlyZWQ6IGZhbHNlLFxuICAgIHJlbWluZGVyUGVuZGluZzogZmFsc2UsXG4gICAgcmVtaW5kZXJFeHBpcmVkOiBmYWxzZSxcbiAgICBzY3JhcE1pbnV0ZXM6IHQuc2NyYXBNaW51dGVzLFxuICAgIGV4cGlyeURheXM6IHQuZXhwaXJ5RGF5cyxcbiAgICBwcmlvcml0eTogdC5wcmlvcml0eSxcbiAgICBlc3RpbWF0ZSxcbiAgICBjb21wbGV0ZWQ6IGZhbHNlLFxuICAgIGNvbXBsZXRlZEF0OiBudWxsLFxuICAgIGNyZWF0ZWRBdDogYXQsXG4gICAgdGFnczogWy4uLnQudGFnc10sXG4gICAgc3VidGFza3M6IHQuc3VidGFza3MubWFwKChzKSA9PiAoe1xuICAgICAgaWQ6IHMuaWQsXG4gICAgICB0aXRsZTogcy50aXRsZSxcbiAgICAgIGRvbmU6IGZhbHNlLFxuICAgIH0pKSxcbiAgfTtcbn1cblxuLyoqIFx1OTE0RFx1N0Y2RVx1Njc2NVx1ODFFQVx1NjU4N1x1NEVGNlx1RkYxQlx1OEZEQlx1NUVBNlx1NEUwRVx1NTM4Nlx1NTNGMlx1NzU1OVx1NTcyOFx1NjcyQ1x1NjczQVx1MzAwMlx1NjNEMFx1OTE5Mlx1NzJCNlx1NjAwMVx1NTNFQVx1NTcyOFx1NjVGNlx1OTVGNFx1NjlGRFx1NEUwRFx1NTNEOFx1NjVGNlx1NUI1OFx1NkQzQlx1MzAwMiAqL1xuZnVuY3Rpb24gcGxhblRhc2tNZXJnZShcbiAgdDogUGxhblRhc2ssXG4gIG9sZDogVGFzayxcbiAgYXQ6IG51bWJlcixcbiAgZXN0aW1hdGU6IG51bWJlcixcbik6IFRhc2sge1xuICBjb25zdCB0YXNrID0gcGxhblRhc2tUb1Rhc2sodCwgYXQsIGVzdGltYXRlKTtcbiAgdGFzay5jcmVhdGVkQXQgPSBvbGQuY3JlYXRlZEF0O1xuICB0YXNrLmNvbXBsZXRlZCA9IG9sZC5jb21wbGV0ZWQ7XG4gIHRhc2suY29tcGxldGVkQXQgPSBvbGQuY29tcGxldGVkQXQ7XG4gIHRhc2submV4dFRhc2tJZCA9IG9sZC5uZXh0VGFza0lkO1xuICBpZiAob2xkLmR1ZURhdGUgPT09IHQuZHVlRGF0ZSAmJiBvbGQucmVtaW5kZXJUaW1lID09PSB0LnJlbWluZGVyVGltZSkge1xuICAgIHRhc2sucmVtaW5kZXJGaXJlZCA9IG9sZC5yZW1pbmRlckZpcmVkO1xuICAgIHRhc2sucmVtaW5kZXJQZW5kaW5nID0gb2xkLnJlbWluZGVyUGVuZGluZztcbiAgICB0YXNrLnJlbWluZGVyRXhwaXJlZCA9XG4gICAgICBvbGQuZXhwaXJ5RGF5cyA9PT0gdC5leHBpcnlEYXlzICYmIG9sZC5yZW1pbmRlckV4cGlyZWQ7XG4gIH1cbiAgZm9yIChjb25zdCBzdWIgb2YgdGFzay5zdWJ0YXNrcykge1xuICAgIGNvbnN0IHByZXYgPSBvbGQuc3VidGFza3MuZmluZCgocykgPT4gcy5pZCA9PT0gc3ViLmlkKTtcbiAgICBpZiAocHJldiAhPT0gdW5kZWZpbmVkKSBzdWIuZG9uZSA9IHByZXYuZG9uZTtcbiAgfVxuICByZXR1cm4gdGFzaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlUGxhbkZpbGUocGxhbjogUGxhbkZpbGUpOiB2b2lkIHtcbiAgaWYgKHBsYW4uZm9ybWF0ICE9PSBcInRvbWF0by10b2RvLXBsYW5cIiB8fCBwbGFuLnZlcnNpb24gIT09IDcpIHtcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTRFQzVcdTY1MkZcdTYzMDFcdThCQTFcdTUyMTIgdjdcdUZGMUJcdTY1RTdcdThCQTFcdTUyMTJcdThCRjdcdTYzMDlcdTY1QjBcdTY4M0NcdTVGMEZcdTkxQ0RcdTY1QjBcdTVCRkNcdTUxRkFcIik7XG4gIH1cbiAgaWYgKHBsYW4ucG9tb2Rvcm9NaW51dGVzIDwgMSB8fCBwbGFuLnBvbW9kb3JvTWludXRlcyA+IDE4MCkge1xuICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJBMVx1NTIxMlx1NzY4NFx1NzU2QVx1ODMwNFx1NjVGNlx1OTU3Rlx1OTcwMFx1NEUzQSAxXHUyMDEzMTgwIFx1NTIwNlx1OTQ5RlwiKTtcbiAgfVxuICBjb25zdCBkYXRhID0gbmV3IEFwcERhdGEoe1xuICAgIHByb2plY3RzOiBwbGFuLnByb2plY3RzLm1hcCgocCkgPT4gKHtcbiAgICAgIGlkOiBwLmlkLFxuICAgICAgbmFtZTogcC5uYW1lLFxuICAgICAgY29sb3I6IHAuY29sb3IsXG4gICAgICBhcHBXaGl0ZWxpc3Q6IHAuYXBwV2hpdGVsaXN0ID09PSBudWxsID8gbnVsbCA6IFsuLi5wLmFwcFdoaXRlbGlzdF0sXG4gICAgfSkpLFxuICAgIHRhc2tzOiBwbGFuLnRhc2tzLm1hcCgodCkgPT4gcGxhblRhc2tUb1Rhc2sodCwgMCwgdC5lc3RpbWF0ZSkpLFxuICAgIGJsb2NrczogcGxhbi5ibG9ja3MubWFwKChiKSA9PiAoeyAuLi5iLCBkYXlzOiBbLi4uYi5kYXlzXSB9KSksXG4gICAgaGFiaXRzOiBwbGFuLmhhYml0cyxcbiAgfSk7XG4gIGRhdGEudmFsaWRhdGUoKTtcbn1cblxuLyoqIFx1NjM2Mlx1N0I5N1x1NjcyQ1x1NTczMFx1NzU2QVx1ODMwNFx1NkJCNVx1NjU3MFx1RkYxQlx1NjVFMFx1NTM1NVx1NkIyMVx1NjVGNlx1OTU3Rlx1NjMwOVx1NjU4N1x1NEVGNlx1NzU2QVx1ODMwNFx1NjVGNlx1OTU3Rlx1NjM2Mlx1N0I5N1x1NUU3Nlx1NTQxMVx1NEUwQVx1NTNENlx1NjU3NFx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBsYW5Fc3RpbWF0ZShcbiAgdDogUGxhblRhc2ssXG4gIHBvbW9kb3JvOiBudW1iZXIsXG4gIGZvY3VzOiBudW1iZXIsXG4pOiBudW1iZXIge1xuICBjb25zdCBlc3RpbWF0ZSA9XG4gICAgdC5mb2N1c01pbnV0ZXMgIT09IG51bGxcbiAgICAgID8gdC5lc3RpbWF0ZVxuICAgICAgOiBNYXRoLmNlaWwoKHQuZXN0aW1hdGUgKiBwb21vZG9ybykgLyBmb2N1cyk7XG4gIGlmIChlc3RpbWF0ZSA+IDk5KSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKGBcdTRFRkJcdTUyQTFcdTIwMUMke3QudGl0bGV9XHUyMDFEXHU2MzYyXHU3Qjk3XHU1NDBFXHU4RDg1XHU4RkM3IDk5IFx1NEUyQVx1NzU2QVx1ODMwNFx1RkYwQ1x1OEJGN1x1NTE0OFx1NjJDNlx1NTIwNlx1NEVGQlx1NTJBMWApO1xuICB9XG4gIHJldHVybiBlc3RpbWF0ZTtcbn1cblxuLyoqIFx1NUJGQ1x1NTE2NVx1RkYxQVx1NTE0OFx1NUI4Q1x1NjU3NFx1NjgyMVx1OUE4Q1x1NTAxOVx1OTAwOVx1RkYwQ1x1NTE4RFx1NTM5Rlx1NUI1MFx1NjNEMFx1NEVBNFx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlUGxhbihwbGFuOiBQbGFuRmlsZSwgZGF0YTogQXBwRGF0YSwgYXQ6IG51bWJlcik6IHZvaWQge1xuICB2YWxpZGF0ZVBsYW5GaWxlKHBsYW4pO1xuICBjb25zdCBuZXh0ID0gY2xvbmUoZGF0YSk7XG4gIGZvciAoY29uc3QgcGxhblByb2plY3Qgb2YgcGxhbi5wcm9qZWN0cykge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gbmV4dC5wcm9qZWN0cy5maW5kKChwKSA9PiBwLmlkID09PSBwbGFuUHJvamVjdC5pZCk7XG4gICAgaWYgKGV4aXN0aW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIFx1OTg3OVx1NzZFRVx1OTE0RFx1N0Y2RVx1NjYyRlx1OTFDRFx1NjVCMFx1NzUxRlx1NjIxMFx1NzY4NFx1RkYwQ1x1OEZEQlx1NUVBNlx1NEUwRFx1NjYyRlx1RkYxQVx1NjU4N1x1NEVGNlx1ODNCN1x1ODBEQ1x1RkYxQlx1NzcwMVx1NzU2NVx1NzY3RFx1NTQwRFx1NTM1NVx1NEZERFx1NzU1OVx1NjcyQ1x1NjczQVx1NkUwNVx1NTM1NVx1MzAwMlxuICAgICAgZXhpc3RpbmcubmFtZSA9IHBsYW5Qcm9qZWN0Lm5hbWU7XG4gICAgICBleGlzdGluZy5jb2xvciA9IHBsYW5Qcm9qZWN0LmNvbG9yO1xuICAgICAgaWYgKHBsYW5Qcm9qZWN0LmFwcFdoaXRlbGlzdCAhPT0gbnVsbCkge1xuICAgICAgICBleGlzdGluZy5hcHBXaGl0ZWxpc3QgPSBbLi4ucGxhblByb2plY3QuYXBwV2hpdGVsaXN0XTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbmV4dC5wcm9qZWN0cy5wdXNoKHtcbiAgICAgICAgaWQ6IHBsYW5Qcm9qZWN0LmlkLFxuICAgICAgICBuYW1lOiBwbGFuUHJvamVjdC5uYW1lLFxuICAgICAgICBjb2xvcjogcGxhblByb2plY3QuY29sb3IsXG4gICAgICAgIGFwcFdoaXRlbGlzdDpcbiAgICAgICAgICBwbGFuUHJvamVjdC5hcHBXaGl0ZWxpc3QgPT09IG51bGxcbiAgICAgICAgICAgID8gbnVsbFxuICAgICAgICAgICAgOiBbLi4ucGxhblByb2plY3QuYXBwV2hpdGVsaXN0XSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IGhhYml0IG9mIHBsYW4uaGFiaXRzKSB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBuZXh0LmhhYml0cy5maW5kKChoKSA9PiBoLmlkID09PSBoYWJpdC5pZCk7XG4gICAgaWYgKGV4aXN0aW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGV4aXN0aW5nLm5hbWUgPSBoYWJpdC5uYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0LmhhYml0cy5wdXNoKHsgaWQ6IGhhYml0LmlkLCBuYW1lOiBoYWJpdC5uYW1lIH0pO1xuICAgIH1cbiAgfVxuICAvLyBcdTY1RjZcdTZCQjVcdTY2MkZcdTdFQUZcdTkxNERcdTdGNkVcdUZGMUFcdTY1ODdcdTRFRjZcdTcyNDhcdTY3MkNcdTY2RkZcdTYzNjJcdTY3MkNcdTY3M0FcdTcyNDhcdTY3MkNcdUZGMENcdTY3MkFcdTYzRDBcdTUzQ0FcdTc2ODRcdTRGRERcdTYzMDFcdTRFMERcdTUyQThcdTMwMDJcbiAgZm9yIChjb25zdCBibG9jayBvZiBwbGFuLmJsb2Nrcykge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gbmV4dC5ibG9ja3MuZmluZCgoYikgPT4gYi5pZCA9PT0gYmxvY2suaWQpO1xuICAgIGlmIChleGlzdGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBuZXh0LmJsb2Nrc1tuZXh0LmJsb2Nrcy5pbmRleE9mKGV4aXN0aW5nKV0gPSB7XG4gICAgICAgIC4uLmJsb2NrLFxuICAgICAgICBkYXlzOiBbLi4uYmxvY2suZGF5c10sXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0LmJsb2Nrcy5wdXNoKHsgLi4uYmxvY2ssIGRheXM6IFsuLi5ibG9jay5kYXlzXSB9KTtcbiAgICB9XG4gIH1cbiAgLy8gXHU1REYyXHU2NzA5XHU1QjlFXHU0RjhCXHU1M0Q2XHU2NTg3XHU0RUY2XHU5MTREXHU3RjZFXHUzMDAxXHU0RkREXHU3NTU5XHU4RkRCXHU1RUE2XHUzMDAyXG4gIGNvbnN0IGluY29taW5nID0gbmV3IE1hcDxzdHJpbmcsIFBsYW5UYXNrPigpO1xuICBmb3IgKGNvbnN0IHQgb2YgcGxhbi50YXNrcykgaW5jb21pbmcuc2V0KHQuaWQsIHQpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5leHQudGFza3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICBjb25zdCB0YXNrID0gbmV4dC50YXNrc1tpXSE7XG4gICAgY29uc3QgcGxhblRhc2sgPSBpbmNvbWluZy5nZXQodGFzay5pZCk7XG4gICAgaWYgKHBsYW5UYXNrID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuICAgIGlmIChkYXRhLnRlYWNoaW5nVGFzayh0YXNrLmlkKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdThCQTFcdTUyMTJcdTY1ODdcdTRFRjZcdTRFMERcdTgwRkRcdTY1MzlcdTUxOTlcdTY1NTlcdTVCNjZcdTVGODVcdTUyOUVcdUZGMENcdThCRjdcdThDMDNcdTY1NzRcdTVCRjlcdTVFOTRcdThCRkVcdTdBMEJcdTYyMTZcdTRGNUNcdTRFMUFcIik7XG4gICAgfVxuICAgIGNvbnN0IGVzdGltYXRlID0gcGxhbkVzdGltYXRlKFxuICAgICAgcGxhblRhc2ssXG4gICAgICBwbGFuLnBvbW9kb3JvTWludXRlcyxcbiAgICAgIGRhdGEuc2V0dGluZ3MuZm9jdXNNaW51dGVzLFxuICAgICk7XG4gICAgY29uc3Qgb2xkID0gY2xvbmUodGFzayk7XG4gICAgbmV4dC50YXNrc1tpXSA9IHBsYW5UYXNrTWVyZ2UocGxhblRhc2ssIG9sZCwgYXQsIGVzdGltYXRlKTtcbiAgfVxuICBjb25zdCBsb2NhbElkcyA9IG5ldyBTZXQobmV4dC50YXNrcy5tYXAoKHQpID0+IHQuaWQpKTtcbiAgZm9yIChjb25zdCBwbGFuVGFzayBvZiBwbGFuLnRhc2tzKSB7XG4gICAgaWYgKGxvY2FsSWRzLmhhcyhwbGFuVGFzay5pZCkpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGVzdGltYXRlID0gcGxhbkVzdGltYXRlKFxuICAgICAgcGxhblRhc2ssXG4gICAgICBwbGFuLnBvbW9kb3JvTWludXRlcyxcbiAgICAgIGRhdGEuc2V0dGluZ3MuZm9jdXNNaW51dGVzLFxuICAgICk7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBwbGFuVGFza1RvVGFzayhwbGFuVGFzaywgYXQsIGVzdGltYXRlKTtcbiAgICBuZXh0LnRhc2tzLnB1c2goaW5zdGFuY2UpO1xuICB9XG4gIGlmIChwbGFuLnJlcGxhY2UpIHtcbiAgICAvLyBcdTY1ODdcdTRFRjZcdTUzNzNcdTY1NzRcdTRFMkFcdThCQTFcdTUyMTJcdUZGMUFcdTUyMjBcdTYzODlcdTVCODNcdTRFMERcdTUxOERcdTYzRDBcdTUzQ0FcdTc2ODRcdTY3MkFcdTVCOENcdTYyMTBcdTk4NzlcdUZGMENcdTUzODZcdTUzRjJcdTZDMzhcdTRFMERcdTUyMjBcdTMwMDJcbiAgICBjb25zdCBwbGFubmVkVGFza3MgPSBuZXcgU2V0KHBsYW4udGFza3MubWFwKCh0KSA9PiB0LmlkKSk7XG4gICAgbmV4dC50YXNrcyA9IG5leHQudGFza3MuZmlsdGVyKFxuICAgICAgKHQpID0+XG4gICAgICAgIHQuY29tcGxldGVkIHx8XG4gICAgICAgIHBsYW5uZWRUYXNrcy5oYXModC5pZCkgfHxcbiAgICAgICAgZGF0YS50ZWFjaGluZ1Rhc2sodC5pZCkgIT09IHVuZGVmaW5lZCxcbiAgICApO1xuICAgIGNvbnN0IHBsYW5uZWRIYWJpdHMgPSBuZXcgU2V0KHBsYW4uaGFiaXRzLm1hcCgoaCkgPT4gaC5pZCkpO1xuICAgIGNvbnN0IHJlbW92ZWRIYWJpdHMgPSBuZXh0LmhhYml0c1xuICAgICAgLmZpbHRlcigoaCkgPT4gIXBsYW5uZWRIYWJpdHMuaGFzKGguaWQpKVxuICAgICAgLm1hcCgoaCkgPT4gaC5pZCk7XG4gICAgaWYgKHJlbW92ZWRIYWJpdHMubGVuZ3RoID4gMCkge1xuICAgICAgbmV4dC5oYWJpdHMgPSBuZXh0LmhhYml0cy5maWx0ZXIoKGgpID0+ICFyZW1vdmVkSGFiaXRzLmluY2x1ZGVzKGguaWQpKTtcbiAgICAgIGZvciAoY29uc3QgdGFzayBvZiBuZXh0LnRhc2tzKSB7XG4gICAgICAgIGlmICh0YXNrLmhhYml0SWQgIT09IG51bGwgJiYgcmVtb3ZlZEhhYml0cy5pbmNsdWRlcyh0YXNrLmhhYml0SWQpKVxuICAgICAgICAgIHRhc2suaGFiaXRJZCA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHBsYW5uZWRCbG9ja3MgPSBuZXcgU2V0KHBsYW4uYmxvY2tzLm1hcCgoYikgPT4gYi5pZCkpO1xuICAgIG5leHQuYmxvY2tzID0gbmV4dC5ibG9ja3MuZmlsdGVyKChiKSA9PiBwbGFubmVkQmxvY2tzLmhhcyhiLmlkKSk7XG4gIH1cbiAgbmV4dC52YWxpZGF0ZSgpO1xuICByZXBsYWNlQXBwRGF0YShkYXRhLCBuZXh0KTtcbn1cblxuLyoqIFx1NUJGQ1x1NTFGQVx1RkYxQVx1NEUwRFx1NTQyQlx1NUI4Q1x1NjIxMFx1OEZEQlx1NUVBNlx1MzAwMVx1NEUxM1x1NkNFOFx1NTM4Nlx1NTNGMlx1MzAwMVx1OEJBMVx1NjVGNlx1NTY2OFx1NEUwRVx1NjcyQ1x1NjczQVx1OEJCRVx1N0Y2RVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4cG9ydFBsYW4oZGF0YTogQXBwRGF0YSk6IFBsYW5GaWxlIHtcbiAgY29uc3QgdGFza3M6IFBsYW5UYXNrW10gPSBkYXRhLnRhc2tzXG4gICAgLmZpbHRlcigodCkgPT4gIXQuY29tcGxldGVkICYmIGRhdGEudGVhY2hpbmdUYXNrKHQuaWQpID09PSB1bmRlZmluZWQpXG4gICAgLm1hcCgodCkgPT4gKHtcbiAgICAgIGhhYml0SWQ6IHQuaGFiaXRJZCxcbiAgICAgIHJlY3VycmluZzogdC5yZWN1cnJpbmcsXG4gICAgICBzY3JhcE1pbnV0ZXM6IHQuc2NyYXBNaW51dGVzLFxuICAgICAgZXhwaXJ5RGF5czogdC5leHBpcnlEYXlzLFxuICAgICAgaWQ6IHQuaWQsXG4gICAgICB0aXRsZTogdC50aXRsZSxcbiAgICAgIG5vdGVzOiB0Lm5vdGVzLFxuICAgICAgcHJvamVjdElkOiB0LnByb2plY3RJZCxcbiAgICAgIGR1ZURhdGU6IHQuZHVlRGF0ZSxcbiAgICAgIHJlbWluZGVyVGltZTogdC5yZW1pbmRlclRpbWUsXG4gICAgICBmb2N1c01pbnV0ZXM6IHQuZm9jdXNNaW51dGVzLFxuICAgICAgcHJpb3JpdHk6IHQucHJpb3JpdHksXG4gICAgICBlc3RpbWF0ZTogdC5lc3RpbWF0ZSxcbiAgICAgIHRhZ3M6IFsuLi50LnRhZ3NdLFxuICAgICAgcmVwZWF0OiB0Lm5leHRUYXNrSWQgPT09IG51bGwgPyB0LnJlcGVhdCA6IFwibm9uZVwiLFxuICAgICAgcmVwZWF0RGF5czogWy4uLnQucmVwZWF0RGF5c10sXG4gICAgICBzdWJ0YXNrczogdC5zdWJ0YXNrcy5tYXAoKHMpID0+ICh7IGlkOiBzLmlkLCB0aXRsZTogcy50aXRsZSB9KSksXG4gICAgfSkpO1xuICBjb25zdCB1c2VkID0gbmV3IFNldDxzdHJpbmc+KFtcbiAgICAuLi50YXNrc1xuICAgICAgLmZpbHRlcigodCkgPT4gdC5wcm9qZWN0SWQgIT09IG51bGwpXG4gICAgICAubWFwKCh0KSA9PiB0LnByb2plY3RJZCBhcyBzdHJpbmcpLFxuICBdKTtcbiAgcmV0dXJuIHtcbiAgICBmb3JtYXQ6IFwidG9tYXRvLXRvZG8tcGxhblwiLFxuICAgIHZlcnNpb246IDcsXG4gICAgcmVwbGFjZTogZmFsc2UsXG4gICAgYmxvY2tzOiBkYXRhLmJsb2Nrcy5tYXAoKGIpID0+ICh7IC4uLmIsIGRheXM6IFsuLi5iLmRheXNdIH0pKSxcbiAgICBoYWJpdHM6IGRhdGEuaGFiaXRzLm1hcCgoaCkgPT4gKHsgLi4uaCB9KSksXG4gICAgcG9tb2Rvcm9NaW51dGVzOiBkYXRhLnNldHRpbmdzLmZvY3VzTWludXRlcyxcbiAgICBwcm9qZWN0czogZGF0YS5wcm9qZWN0c1xuICAgICAgLmZpbHRlcigocCkgPT4gdXNlZC5oYXMocC5pZCkpXG4gICAgICAubWFwKChwKSA9PiAoe1xuICAgICAgICBpZDogcC5pZCxcbiAgICAgICAgbmFtZTogcC5uYW1lLFxuICAgICAgICBjb2xvcjogcC5jb2xvcixcbiAgICAgICAgYXBwV2hpdGVsaXN0OiBwLmFwcFdoaXRlbGlzdCA9PT0gbnVsbCA/IG51bGwgOiBbLi4ucC5hcHBXaGl0ZWxpc3RdLFxuICAgICAgfSkpLFxuICAgIHRhc2tzLFxuICB9O1xufVxuIiwgIi8vISBcdTUxNzFcdTRFQUJcdTZBMjFcdTU3OEJcdTMwMDFcdThCQTFcdTY1RjZcdTcyQjZcdTYwMDFcdTY3M0FcdTRFMEVcdTY4MjFcdTlBOENcdTUxNjVcdTUzRTNcdTMwMDJcbi8vISBcdTVCRjlcdTVFOTQgY3JhdGVzL2NvcmUvc3JjL2xpYi5yc1x1RkYwOEVuZ2luZSBcdTU3MjggZW5naW5lLnRzXHVGRjBDXHU2ODRDXHU5NzYyIGd1YXJkIFx1NTM5Rlx1NzUxRlx1NEZERFx1NzU1OVx1RkYwOVx1MzAwMlxuXG5pbXBvcnQgeyBBcHBFcnJvciwgY2hhckNvdW50LCBjbG9uZSwgZW5zdXJlLCB1dGY4TGVuIH0gZnJvbSBcIi4vZXJyb3JzXCI7XG5pbXBvcnQgeyBpZCB9IGZyb20gXCIuL2lkc1wiO1xuaW1wb3J0IHtcbiAgYXNBcnJheSxcbiAgYXNCb29sLFxuICBhc0ludCxcbiAgYXNPcHQsXG4gIGFzU3RyLFxuICBmaWVsZCxcbiAgaXNPYmplY3QsXG4gIG9uZU9mLFxuICByZWplY3RVbmtub3duLFxuICByZXF1aXJlZEZpZWxkLFxufSBmcm9tIFwiLi9qc29uXCI7XG5pbXBvcnQgdHlwZSB7XG4gIEFjdGl2ZUxvY2ssXG4gIEF0dGVudGlvbixcbiAgQmxvY2ssXG4gIERldGFjaFRhcmdldCxcbiAgRGF5U3RhdCxcbiAgR3VhcmRNb2RlLFxuICBIYWJpdCxcbiAgSGFiaXRTbG90LFxuICBJZGVudGl0eSxcbiAgTG9ja1NjaGVkdWxlLFxuICBMb2NrU3RhdGUsXG4gIE1vZGUsXG4gIFBsYW5GaWxlLFxuICBQcm9qZWN0LFxuICBSZXBlYXQsXG4gIFNlc3Npb24sXG4gIFNlc3Npb25Tb3VyY2UsXG4gIFNldHRpbmdzLFxuICBTdGF0cyxcbiAgU3VidGFzayxcbiAgVGFzayxcbiAgVGFza0RyYWZ0LFxuICBUYXNrS2luZCxcbiAgVGltZXIsXG4gIFZpc2lvbixcbn0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IGlzSGFiaXQsIGtpbmRPZiB9IGZyb20gXCIuL21vZGVsXCI7XG5pbXBvcnQgeyB2YWxpZGF0ZUxvY2ssIHJlbGVhc2VMb2NrLCBzY2hlZHVsZWRBdCB9IGZyb20gXCIuL2xvY2tcIjtcbmltcG9ydCB7IHZhbGlkYXRlQmxvY2tzIH0gZnJvbSBcIi4vYmxvY2tzXCI7XG5pbXBvcnQgeyB2YWxpZGF0ZUhhYml0IH0gZnJvbSBcIi4vaGFiaXRzXCI7XG5pbXBvcnQge1xuICB0YXNrSXNWb2lkLFxuICBjcmVhdGVOZXh0VGFzayxcbiAgdmFsaWRhdGVSZXBlYXQsXG4gIHNhdmVIYWJpdFRhc2tzLFxuICByZXBsYWNlQXBwRGF0YSxcbn0gZnJvbSBcIi4vcmVjdXJyZW5jZVwiO1xuaW1wb3J0IHtcbiAgZHVyYXRpb25PZixcbiAgZHVlQXV0b1Rhc2ssXG4gIHBlbmRpbmdSZW1pbmRlcixcbiAgcmVjb3JkU2Vzc2lvbixcbiAgcmVtaW5kZXJJZGxlLFxuICByZXNldFRvLFxuICBzdGFydER1ZVRhc2ssXG4gIHN0YXJ0VGltZXIsXG4gIHRhc2tIYXNSb3VuZHNMZWZ0LFxuICB0aWNrUmVtaW5kZXJzLFxuICB0aW1lclJlbWFpbmluZyxcbiAgd2luZG93TWludXRlcyxcbn0gZnJvbSBcIi4vcmVtaW5kZXJzXCI7XG5pbXBvcnQgeyBFZHVjYXRpb24sIHBhcnNlRWR1Y2F0aW9uLCBzZXJpYWxpemVFZHVjYXRpb24gfSBmcm9tIFwiLi9lZHVjYXRpb25cIjtcbmltcG9ydCB7XG4gIGNvbXBsZXRlVGVhY2hpbmdUYXNrLFxuICBtYXRlcmlhbGl6ZVRlYWNoaW5nVGFza3MsXG4gIHN0YXJ0VGVhY2hpbmdUYXNrLFxuICB0ZWFjaGluZ1Rhc2ssXG4gIHZhbGlkYXRlVGVhY2hpbmdUYXNrcyxcbn0gZnJvbSBcIi4vdGVhY2hpbmdfdGFza3NcIjtcbmltcG9ydCB7XG4gIHZhbGlkYXRlSWRlbnRpdGllcyxcbiAgcGFyc2VJZGVudGl0eSxcbiAgc2VyaWFsaXplSWRlbnRpdHksXG59IGZyb20gXCIuL2lkZW50aXRpZXNcIjtcbmltcG9ydCB7IGV4cG9ydFBsYW4sIG1lcmdlUGxhbiB9IGZyb20gXCIuL3BsYW5cIjtcbmltcG9ydCB7IHBhcnNlTG9ja1N0YXRlLCBzZXJpYWxpemVMb2NrU3RhdGUgfSBmcm9tIFwiLi9sb2NrXCI7XG5pbXBvcnQgeyBwYXJzZUJsb2NrLCBzZXJpYWxpemVCbG9jayB9IGZyb20gXCIuL2Jsb2Nrc1wiO1xuaW1wb3J0IHsgcGFyc2VIYWJpdCwgc2VyaWFsaXplSGFiaXQgfSBmcm9tIFwiLi9oYWJpdHNcIjtcbmltcG9ydCB7IGFkZERheXMsIGRhdGVBdCwgdmFsaWREYXRlIH0gZnJvbSBcIi4vdGltZVwiO1xuXG4vLyAtLS0tLS0tLS0tIFx1NTdGQVx1Nzg0MFx1N0M3Qlx1NTc4Qlx1ODlFM1x1Njc5MC9cdTVFOEZcdTUyMTdcdTUzMTYgLS0tLS0tLS0tLVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQcm9qZWN0KHJhdzogdW5rbm93bik6IFByb2plY3Qge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OTg3OVx1NzZFRVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTk4NzlcdTc2RUVcIiwgYXNTdHIpLFxuICAgIG5hbWU6IHJlcXVpcmVkRmllbGQocmF3LCBcIm5hbWVcIiwgXCJcdTk4NzlcdTc2RUVcIiwgYXNTdHIpLFxuICAgIGNvbG9yOiByZXF1aXJlZEZpZWxkKHJhdywgXCJjb2xvclwiLCBcIlx1OTg3OVx1NzZFRVwiLCBhc1N0ciksXG4gICAgYXBwV2hpdGVsaXN0OiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiYXBwV2hpdGVsaXN0XCIsXG4gICAgICBcIlx1OTg3OVx1NzZFRVwiLFxuICAgICAgKHYpID0+XG4gICAgICAgIGFzT3B0KHYsIFwiYXBwV2hpdGVsaXN0XCIsICh4KSA9PlxuICAgICAgICAgIGFzQXJyYXkoeCwgXCJhcHBXaGl0ZWxpc3RcIikubWFwKChhKSA9PiBhc1N0cihhLCBcIlx1NUU5NFx1NzUyOCBJRFwiKSksXG4gICAgICAgICksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nW10gfCBudWxsLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplUHJvamVjdChwOiBQcm9qZWN0KTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICBjb25zdCBvdXQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuICAgIGlkOiBwLmlkLFxuICAgIG5hbWU6IHAubmFtZSxcbiAgICBjb2xvcjogcC5jb2xvcixcbiAgfTtcbiAgaWYgKHAuYXBwV2hpdGVsaXN0ICE9PSBudWxsKSBvdXRbXCJhcHBXaGl0ZWxpc3RcIl0gPSBwLmFwcFdoaXRlbGlzdDtcbiAgcmV0dXJuIG91dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVmlzaW9uKHJhdzogdW5rbm93bik6IFZpc2lvbiB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2MTNGXHU2NjZGXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKHJhdywgW1wiaWRcIiwgXCJuYW1lXCIsIFwibm90ZXNcIiwgXCJwcm9qZWN0SWRcIl0sIFwiXHU2MTNGXHU2NjZGXCIpO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1NjEzRlx1NjY2RlwiLCBhc1N0ciksXG4gICAgbmFtZTogcmVxdWlyZWRGaWVsZChyYXcsIFwibmFtZVwiLCBcIlx1NjEzRlx1NjY2RlwiLCBhc1N0ciksXG4gICAgbm90ZXM6IGZpZWxkKHJhdywgXCJub3Rlc1wiLCBcIlx1NjEzRlx1NjY2RlwiLCBhc1N0ciwgXCJcIiksXG4gICAgcHJvamVjdElkOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwicHJvamVjdElkXCIsXG4gICAgICBcIlx1NjEzRlx1NjY2RlwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwicHJvamVjdElkXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplVmlzaW9uKHY6IFZpc2lvbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICBpZDogdi5pZCxcbiAgICBuYW1lOiB2Lm5hbWUsXG4gICAgbm90ZXM6IHYubm90ZXMsXG4gIH07XG4gIGlmICh2LnByb2plY3RJZCAhPT0gbnVsbCkgb3V0W1wicHJvamVjdElkXCJdID0gdi5wcm9qZWN0SWQ7XG4gIHJldHVybiBvdXQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVN1YnRhc2socmF3OiB1bmtub3duKTogU3VidGFzayB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU1QjUwXHU0RUZCXHU1MkExXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1NUI1MFx1NEVGQlx1NTJBMVwiLCBhc1N0ciksXG4gICAgdGl0bGU6IHJlcXVpcmVkRmllbGQocmF3LCBcInRpdGxlXCIsIFwiXHU1QjUwXHU0RUZCXHU1MkExXCIsIGFzU3RyKSxcbiAgICBkb25lOiByZXF1aXJlZEZpZWxkKHJhdywgXCJkb25lXCIsIFwiXHU1QjUwXHU0RUZCXHU1MkExXCIsIGFzQm9vbCksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVTdWJ0YXNrKHM6IFN1YnRhc2spOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7IGlkOiBzLmlkLCB0aXRsZTogcy50aXRsZSwgZG9uZTogcy5kb25lIH07XG59XG5cbmNvbnN0IFRBU0tfS0VZUyA9IFtcbiAgXCJpZFwiLFxuICBcInJlY3VycmluZ1wiLFxuICBcInJlcGVhdFwiLFxuICBcInJlcGVhdERheXNcIixcbiAgXCJuZXh0VGFza0lkXCIsXG4gIFwidGl0bGVcIixcbiAgXCJub3Rlc1wiLFxuICBcInByb2plY3RJZFwiLFxuICBcImhhYml0SWRcIixcbiAgXCJkdWVEYXRlXCIsXG4gIFwicmVtaW5kZXJUaW1lXCIsXG4gIFwiZm9jdXNNaW51dGVzXCIsXG4gIFwic2NyYXBNaW51dGVzXCIsXG4gIFwiZXhwaXJ5RGF5c1wiLFxuICBcInByaW9yaXR5XCIsXG4gIFwiZXN0aW1hdGVcIixcbiAgXCJyZW1pbmRlckZpcmVkXCIsXG4gIFwicmVtaW5kZXJQZW5kaW5nXCIsXG4gIFwicmVtaW5kZXJFeHBpcmVkXCIsXG4gIFwiY29tcGxldGVkXCIsXG4gIFwiY29tcGxldGVkQXRcIixcbiAgXCJjcmVhdGVkQXRcIixcbiAgXCJ0YWdzXCIsXG4gIFwic3VidGFza3NcIixcbl0gYXMgY29uc3Q7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVRhc2socmF3OiB1bmtub3duKTogVGFzayB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU0RUZCXHU1MkExXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKHJhdywgWy4uLlRBU0tfS0VZU10sIFwiXHU0RUZCXHU1MkExXCIpO1xuICByZXR1cm4ge1xuICAgIGlkOiByZXF1aXJlZEZpZWxkKHJhdywgXCJpZFwiLCBcIlx1NEVGQlx1NTJBMVwiLCBhc1N0ciksXG4gICAgcmVjdXJyaW5nOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwicmVjdXJyaW5nXCIsXG4gICAgICBcIlx1NEVGQlx1NTJBMVwiLFxuICAgICAgYXNCb29sLFxuICAgICAgKHJhd1tcInJlcGVhdFwiXSAhPT0gdW5kZWZpbmVkICYmIHJhd1tcInJlcGVhdFwiXSAhPT0gXCJub25lXCIpIHx8XG4gICAgICAgIHJhd1tcImR1ZURhdGVcIl0gPT0gbnVsbCxcbiAgICApLFxuICAgIHJlcGVhdDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInJlcGVhdFwiLFxuICAgICAgXCJcdTRFRkJcdTUyQTFcIixcbiAgICAgICh2KSA9PiBvbmVPZih2LCBcInJlcGVhdFwiLCBbXCJub25lXCIsIFwiZGFpbHlcIiwgXCJ3ZWVrZGF5c1wiLCBcIndlZWtseVwiXSksXG4gICAgICByYXdbXCJkdWVEYXRlXCJdID09IG51bGwgPyBcImRhaWx5XCIgOiBcIm5vbmVcIixcbiAgICApIGFzIFJlcGVhdCxcbiAgICByZXBlYXREYXlzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwicmVwZWF0RGF5c1wiLFxuICAgICAgXCJcdTRFRkJcdTUyQTFcIixcbiAgICAgICh2KSA9PiBhc0FycmF5KHYsIFwicmVwZWF0RGF5c1wiKS5tYXAoKGQpID0+IGFzSW50KGQsIFwiXHU5MUNEXHU1OTBEXHU2NjFGXHU2NzFGXCIpKSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgbmV4dFRhc2tJZDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcIm5leHRUYXNrSWRcIixcbiAgICAgIFwiXHU0RUZCXHU1MkExXCIsXG4gICAgICAodikgPT4gYXNPcHQodiwgXCJuZXh0VGFza0lkXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgIHRpdGxlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJ0aXRsZVwiLCBcIlx1NEVGQlx1NTJBMVwiLCBhc1N0ciksXG4gICAgbm90ZXM6IHJlcXVpcmVkRmllbGQocmF3LCBcIm5vdGVzXCIsIFwiXHU0RUZCXHU1MkExXCIsIGFzU3RyKSxcbiAgICBwcm9qZWN0SWQ6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJwcm9qZWN0SWRcIixcbiAgICAgIFwiXHU0RUZCXHU1MkExXCIsXG4gICAgICAodikgPT4gYXNPcHQodiwgXCJwcm9qZWN0SWRcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gICAgaGFiaXRJZDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImhhYml0SWRcIixcbiAgICAgIFwiXHU0RUZCXHU1MkExXCIsXG4gICAgICAodikgPT4gYXNPcHQodiwgXCJoYWJpdElkXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgIGR1ZURhdGU6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJkdWVEYXRlXCIsXG4gICAgICBcIlx1NEVGQlx1NTJBMVwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiZHVlRGF0ZVwiLCBhc1N0ciksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgICByZW1pbmRlclRpbWU6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJyZW1pbmRlclRpbWVcIixcbiAgICAgIFwiXHU0RUZCXHU1MkExXCIsXG4gICAgICAodikgPT4gYXNPcHQodiwgXCJyZW1pbmRlclRpbWVcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gICAgZm9jdXNNaW51dGVzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiZm9jdXNNaW51dGVzXCIsXG4gICAgICBcIlx1NEVGQlx1NTJBMVwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwiZm9jdXNNaW51dGVzXCIsICh4KSA9PiBhc0ludCh4LCBcImZvY3VzTWludXRlc1wiKSksXG4gICAgICBudWxsLFxuICAgICkgYXMgbnVtYmVyIHwgbnVsbCxcbiAgICBzY3JhcE1pbnV0ZXM6IGZpZWxkKHJhdywgXCJzY3JhcE1pbnV0ZXNcIiwgXCJcdTRFRkJcdTUyQTFcIiwgYXNJbnQsIDApLFxuICAgIGV4cGlyeURheXM6IGZpZWxkKHJhdywgXCJleHBpcnlEYXlzXCIsIFwiXHU0RUZCXHU1MkExXCIsIGFzSW50LCAwKSxcbiAgICBwcmlvcml0eTogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJpb3JpdHlcIiwgXCJcdTRFRkJcdTUyQTFcIiwgYXNJbnQpLFxuICAgIGVzdGltYXRlOiByZXF1aXJlZEZpZWxkKHJhdywgXCJlc3RpbWF0ZVwiLCBcIlx1NEVGQlx1NTJBMVwiLCBhc0ludCksXG4gICAgcmVtaW5kZXJGaXJlZDogZmllbGQocmF3LCBcInJlbWluZGVyRmlyZWRcIiwgXCJcdTRFRkJcdTUyQTFcIiwgYXNCb29sLCBmYWxzZSksXG4gICAgcmVtaW5kZXJQZW5kaW5nOiBmaWVsZChyYXcsIFwicmVtaW5kZXJQZW5kaW5nXCIsIFwiXHU0RUZCXHU1MkExXCIsIGFzQm9vbCwgZmFsc2UpLFxuICAgIHJlbWluZGVyRXhwaXJlZDogZmllbGQocmF3LCBcInJlbWluZGVyRXhwaXJlZFwiLCBcIlx1NEVGQlx1NTJBMVwiLCBhc0Jvb2wsIGZhbHNlKSxcbiAgICBjb21wbGV0ZWQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImNvbXBsZXRlZFwiLCBcIlx1NEVGQlx1NTJBMVwiLCBhc0Jvb2wpLFxuICAgIGNvbXBsZXRlZEF0OiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiY29tcGxldGVkQXRcIixcbiAgICAgIFwiXHU0RUZCXHU1MkExXCIsXG4gICAgICAodikgPT4gYXNPcHQodiwgXCJjb21wbGV0ZWRBdFwiLCBhc0ludCksXG4gICAgICBudWxsLFxuICAgICkgYXMgbnVtYmVyIHwgbnVsbCxcbiAgICBjcmVhdGVkQXQ6IHJlcXVpcmVkRmllbGQocmF3LCBcImNyZWF0ZWRBdFwiLCBcIlx1NEVGQlx1NTJBMVwiLCBhc0ludCksXG4gICAgdGFnczogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInRhZ3NcIixcbiAgICAgIFwiXHU0RUZCXHU1MkExXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcInRhZ3NcIikubWFwKCh0KSA9PiBhc1N0cih0LCBcIlx1NjgwN1x1N0I3RVwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICAgIHN1YnRhc2tzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwic3VidGFza3NcIixcbiAgICAgIFwiXHU0RUZCXHU1MkExXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcInN1YnRhc2tzXCIpLm1hcChwYXJzZVN1YnRhc2spLFxuICAgICAgW10sXG4gICAgKSxcbiAgfTtcbn1cblxuLyoqXG4gKiBjYW5vbmljYWwgXHU0RUZCXHU1MkExXHU1RThGXHU1MjE3XHU1MzE2XHVGRjFBXHU5NTJFXHU1RThGXHU0RTBFIFJ1c3QgYFRhc2tgIFx1NThGMFx1NjYwRVx1NUU4Rlx1NEUwMFx1ODFGNFx1MzAwMlxuICogXHU2NEE0XHU5NTAwXHU2MDYyXHU1OTBEXHU2MjhBXHU4QkU1XHU0RTMyXHU1QjU4XHU4RkRCIElkZW50aXR5LnJlc3RvcmVUYXNrXHVGRjBDXHU2QkQ0XHU4RjgzXHU1RkM1XHU5ODdCXHU5MDEwXHU1QjU3XHU4MjgyXHU0RTAwXHU4MUY0XHUzMDAyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVUYXNrKHQ6IFRhc2spOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7XG4gICAgaWQ6IHQuaWQsXG4gICAgcmVjdXJyaW5nOiB0LnJlY3VycmluZyxcbiAgICByZXBlYXQ6IHQucmVwZWF0LFxuICAgIHJlcGVhdERheXM6IHQucmVwZWF0RGF5cyxcbiAgICBuZXh0VGFza0lkOiB0Lm5leHRUYXNrSWQsXG4gICAgdGl0bGU6IHQudGl0bGUsXG4gICAgbm90ZXM6IHQubm90ZXMsXG4gICAgcHJvamVjdElkOiB0LnByb2plY3RJZCxcbiAgICBoYWJpdElkOiB0LmhhYml0SWQsXG4gICAgZHVlRGF0ZTogdC5kdWVEYXRlLFxuICAgIHJlbWluZGVyVGltZTogdC5yZW1pbmRlclRpbWUsXG4gICAgZm9jdXNNaW51dGVzOiB0LmZvY3VzTWludXRlcyxcbiAgICBzY3JhcE1pbnV0ZXM6IHQuc2NyYXBNaW51dGVzLFxuICAgIGV4cGlyeURheXM6IHQuZXhwaXJ5RGF5cyxcbiAgICBwcmlvcml0eTogdC5wcmlvcml0eSxcbiAgICBlc3RpbWF0ZTogdC5lc3RpbWF0ZSxcbiAgICByZW1pbmRlckZpcmVkOiB0LnJlbWluZGVyRmlyZWQsXG4gICAgcmVtaW5kZXJQZW5kaW5nOiB0LnJlbWluZGVyUGVuZGluZyxcbiAgICByZW1pbmRlckV4cGlyZWQ6IHQucmVtaW5kZXJFeHBpcmVkLFxuICAgIGNvbXBsZXRlZDogdC5jb21wbGV0ZWQsXG4gICAgY29tcGxldGVkQXQ6IHQuY29tcGxldGVkQXQsXG4gICAgY3JlYXRlZEF0OiB0LmNyZWF0ZWRBdCxcbiAgICB0YWdzOiB0LnRhZ3MsXG4gICAgc3VidGFza3M6IHQuc3VidGFza3MubWFwKHNlcmlhbGl6ZVN1YnRhc2spLFxuICB9O1xufVxuXG5jb25zdCBUQVNLX0RSQUZUX0tFWVMgPSBbXG4gIFwiaWRcIixcbiAgXCJ0aXRsZVwiLFxuICBcIm5vdGVzXCIsXG4gIFwicHJvamVjdElkXCIsXG4gIFwiZHVlRGF0ZVwiLFxuICBcInJlbWluZGVyVGltZVwiLFxuICBcImZvY3VzTWludXRlc1wiLFxuICBcInNjcmFwTWludXRlc1wiLFxuICBcImV4cGlyeURheXNcIixcbiAgXCJwcmlvcml0eVwiLFxuICBcImVzdGltYXRlXCIsXG4gIFwidGFnc1wiLFxuICBcInN1YnRhc2tzXCIsXG4gIFwicmVwZWF0XCIsXG4gIFwicmVwZWF0RGF5c1wiLFxuXSBhcyBjb25zdDtcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVGFza0RyYWZ0KHJhdzogdW5rbm93bik6IFRhc2tEcmFmdCB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU0RUZCXHU1MkExXHU4MzQ5XHU3QTNGXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKHJhdywgWy4uLlRBU0tfRFJBRlRfS0VZU10sIFwiXHU0RUZCXHU1MkExXHU4MzQ5XHU3QTNGXCIpO1xuICByZXR1cm4ge1xuICAgIGlkOiBmaWVsZChyYXcsIFwiaWRcIiwgXCJcdTRFRkJcdTUyQTFcdTgzNDlcdTdBM0ZcIiwgKHYpID0+IGFzT3B0KHYsIFwiaWRcIiwgYXNTdHIpLCBudWxsKSBhc1xuICAgICAgc3RyaW5nIHwgbnVsbCxcbiAgICB0aXRsZTogcmVxdWlyZWRGaWVsZChyYXcsIFwidGl0bGVcIiwgXCJcdTRFRkJcdTUyQTFcdTgzNDlcdTdBM0ZcIiwgYXNTdHIpLFxuICAgIG5vdGVzOiBmaWVsZChyYXcsIFwibm90ZXNcIiwgXCJcdTRFRkJcdTUyQTFcdTgzNDlcdTdBM0ZcIiwgYXNTdHIsIFwiXCIpLFxuICAgIHByb2plY3RJZDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInByb2plY3RJZFwiLFxuICAgICAgXCJcdTRFRkJcdTUyQTFcdTgzNDlcdTdBM0ZcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcInByb2plY3RJZFwiLCBhc1N0ciksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgICBkdWVEYXRlOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiZHVlRGF0ZVwiLFxuICAgICAgXCJcdTRFRkJcdTUyQTFcdTgzNDlcdTdBM0ZcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcImR1ZURhdGVcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gICAgcmVtaW5kZXJUaW1lOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwicmVtaW5kZXJUaW1lXCIsXG4gICAgICBcIlx1NEVGQlx1NTJBMVx1ODM0OVx1N0EzRlwiLFxuICAgICAgKHYpID0+IGFzT3B0KHYsIFwicmVtaW5kZXJUaW1lXCIsIGFzU3RyKSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBzdHJpbmcgfCBudWxsLFxuICAgIGZvY3VzTWludXRlczogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImZvY3VzTWludXRlc1wiLFxuICAgICAgXCJcdTRFRkJcdTUyQTFcdTgzNDlcdTdBM0ZcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcImZvY3VzTWludXRlc1wiLCAoeCkgPT4gYXNJbnQoeCwgXCJmb2N1c01pbnV0ZXNcIikpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIG51bWJlciB8IG51bGwsXG4gICAgc2NyYXBNaW51dGVzOiBmaWVsZChyYXcsIFwic2NyYXBNaW51dGVzXCIsIFwiXHU0RUZCXHU1MkExXHU4MzQ5XHU3QTNGXCIsIGFzSW50LCAwKSxcbiAgICBleHBpcnlEYXlzOiBmaWVsZChyYXcsIFwiZXhwaXJ5RGF5c1wiLCBcIlx1NEVGQlx1NTJBMVx1ODM0OVx1N0EzRlwiLCBhc0ludCwgMCksXG4gICAgcHJpb3JpdHk6IGZpZWxkKHJhdywgXCJwcmlvcml0eVwiLCBcIlx1NEVGQlx1NTJBMVx1ODM0OVx1N0EzRlwiLCBhc0ludCwgMCksXG4gICAgZXN0aW1hdGU6IGZpZWxkKHJhdywgXCJlc3RpbWF0ZVwiLCBcIlx1NEVGQlx1NTJBMVx1ODM0OVx1N0EzRlwiLCBhc0ludCwgMSksXG4gICAgdGFnczogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInRhZ3NcIixcbiAgICAgIFwiXHU0RUZCXHU1MkExXHU4MzQ5XHU3QTNGXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcInRhZ3NcIikubWFwKCh0KSA9PiBhc1N0cih0LCBcIlx1NjgwN1x1N0I3RVwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICAgIHN1YnRhc2tzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwic3VidGFza3NcIixcbiAgICAgIFwiXHU0RUZCXHU1MkExXHU4MzQ5XHU3QTNGXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcInN1YnRhc2tzXCIpLm1hcChwYXJzZVN1YnRhc2spLFxuICAgICAgW10sXG4gICAgKSxcbiAgICByZXBlYXQ6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJyZXBlYXRcIixcbiAgICAgIFwiXHU0RUZCXHU1MkExXHU4MzQ5XHU3QTNGXCIsXG4gICAgICAodikgPT4gb25lT2YodiwgXCJyZXBlYXRcIiwgW1wibm9uZVwiLCBcImRhaWx5XCIsIFwid2Vla2RheXNcIiwgXCJ3ZWVrbHlcIl0pLFxuICAgICAgXCJub25lXCIsXG4gICAgKSBhcyBSZXBlYXQsXG4gICAgcmVwZWF0RGF5czogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInJlcGVhdERheXNcIixcbiAgICAgIFwiXHU0RUZCXHU1MkExXHU4MzQ5XHU3QTNGXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcInJlcGVhdERheXNcIikubWFwKChkKSA9PiBhc0ludChkLCBcIlx1OTFDRFx1NTkwRFx1NjYxRlx1NjcxRlwiKSksXG4gICAgICBbXSxcbiAgICApLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VIYWJpdFNsb3QocmF3OiB1bmtub3duKTogSGFiaXRTbG90IHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTRFNjBcdTYwRUZcdTY1RjZcdTZCQjVcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJldHVybiB7XG4gICAgZGF5czogYXNBcnJheShcbiAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcImRheXNcIiwgXCJcdTRFNjBcdTYwRUZcdTY1RjZcdTZCQjVcIiwgKHYpID0+IHYpLFxuICAgICAgXCJkYXlzXCIsXG4gICAgKS5tYXAoKGQpID0+IGFzSW50KGQsIFwiXHU0RTYwXHU2MEVGXHU2NjFGXHU2NzFGXCIpKSxcbiAgICB0aW1lOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwidGltZVwiLFxuICAgICAgXCJcdTRFNjBcdTYwRUZcdTY1RjZcdTZCQjVcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcInRpbWVcIiwgYXNTdHIpLFxuICAgICAgbnVsbCxcbiAgICApIGFzIHN0cmluZyB8IG51bGwsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVByb3RlY3Rpb24ocmF3OiB1bmtub3duKToge1xuICBtb2RlOiBHdWFyZE1vZGU7XG4gIHdoaXRlbGlzdDogc3RyaW5nW107XG4gIHN0cmljdDogYm9vbGVhbjtcbn0ge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NEZERFx1NjJBNFx1OEJCRVx1N0Y2RVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmV0dXJuIHtcbiAgICBtb2RlOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwibW9kZVwiLFxuICAgICAgXCJcdTRGRERcdTYyQTRcdThCQkVcdTdGNkVcIixcbiAgICAgICh2KSA9PiBvbmVPZih2LCBcIlx1NEZERFx1NjJBNCBtb2RlXCIsIFtcIm9mZlwiLCBcImxvY2tcIiwgXCJ3aGl0ZWxpc3RcIl0pLFxuICAgICAgXCJvZmZcIixcbiAgICApIGFzIEd1YXJkTW9kZSxcbiAgICB3aGl0ZWxpc3Q6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJ3aGl0ZWxpc3RcIixcbiAgICAgIFwiXHU0RkREXHU2MkE0XHU4QkJFXHU3RjZFXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcIndoaXRlbGlzdFwiKS5tYXAoKGEpID0+IGFzU3RyKGEsIFwiXHU1RTk0XHU3NTI4IElEXCIpKSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgc3RyaWN0OiBmaWVsZChyYXcsIFwic3RyaWN0XCIsIFwiXHU0RkREXHU2MkE0XHU4QkJFXHU3RjZFXCIsIGFzQm9vbCwgZmFsc2UpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplUHJvdGVjdGlvbihwOiB7XG4gIG1vZGU6IEd1YXJkTW9kZTtcbiAgd2hpdGVsaXN0OiBzdHJpbmdbXTtcbiAgc3RyaWN0OiBib29sZWFuO1xufSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHsgbW9kZTogcC5tb2RlLCB3aGl0ZWxpc3Q6IHAud2hpdGVsaXN0LCBzdHJpY3Q6IHAuc3RyaWN0IH07XG59XG5cbmNvbnN0IFNFVFRJTkdTX0tFWVMgPSBbXG4gIFwiZm9jdXNNaW51dGVzXCIsXG4gIFwic2hvcnRCcmVha01pbnV0ZXNcIixcbiAgXCJsb25nQnJlYWtNaW51dGVzXCIsXG4gIFwibG9uZ0JyZWFrRXZlcnlcIixcbiAgXCJkYWlseUdvYWxcIixcbiAgXCJhdXRvQnJlYWtcIixcbiAgXCJhdXRvRm9jdXNcIixcbiAgXCJhdXRvU3RhcnRUYXNrc1wiLFxuICBcInNvdW5kXCIsXG4gIFwic291bmRWb2x1bWVcIixcbiAgXCJub3RpZmljYXRpb25zXCIsXG4gIFwiYWx3YXlzT25Ub3BcIixcbiAgXCJ0aGVtZVwiLFxuICBcInBlcnNvbmFCYWNrZHJvcFwiLFxuICBcInByb3RlY3Rpb25cIixcbl0gYXMgY29uc3Q7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNldHRpbmdzKHJhdzogdW5rbm93bik6IFNldHRpbmdzIHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdThCQkVcdTdGNkVcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJldHVybiB7XG4gICAgZm9jdXNNaW51dGVzOiByZXF1aXJlZEZpZWxkKHJhdywgXCJmb2N1c01pbnV0ZXNcIiwgXCJcdThCQkVcdTdGNkVcIiwgYXNJbnQpLFxuICAgIHNob3J0QnJlYWtNaW51dGVzOiByZXF1aXJlZEZpZWxkKHJhdywgXCJzaG9ydEJyZWFrTWludXRlc1wiLCBcIlx1OEJCRVx1N0Y2RVwiLCBhc0ludCksXG4gICAgbG9uZ0JyZWFrTWludXRlczogcmVxdWlyZWRGaWVsZChyYXcsIFwibG9uZ0JyZWFrTWludXRlc1wiLCBcIlx1OEJCRVx1N0Y2RVwiLCBhc0ludCksXG4gICAgbG9uZ0JyZWFrRXZlcnk6IHJlcXVpcmVkRmllbGQocmF3LCBcImxvbmdCcmVha0V2ZXJ5XCIsIFwiXHU4QkJFXHU3RjZFXCIsIGFzSW50KSxcbiAgICBkYWlseUdvYWw6IHJlcXVpcmVkRmllbGQocmF3LCBcImRhaWx5R29hbFwiLCBcIlx1OEJCRVx1N0Y2RVwiLCBhc0ludCksXG4gICAgYXV0b0JyZWFrOiByZXF1aXJlZEZpZWxkKHJhdywgXCJhdXRvQnJlYWtcIiwgXCJcdThCQkVcdTdGNkVcIiwgYXNCb29sKSxcbiAgICBhdXRvRm9jdXM6IHJlcXVpcmVkRmllbGQocmF3LCBcImF1dG9Gb2N1c1wiLCBcIlx1OEJCRVx1N0Y2RVwiLCBhc0Jvb2wpLFxuICAgIGF1dG9TdGFydFRhc2tzOiBmaWVsZChyYXcsIFwiYXV0b1N0YXJ0VGFza3NcIiwgXCJcdThCQkVcdTdGNkVcIiwgYXNCb29sLCBmYWxzZSksXG4gICAgc291bmQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInNvdW5kXCIsIFwiXHU4QkJFXHU3RjZFXCIsIGFzQm9vbCksXG4gICAgc291bmRWb2x1bWU6IGZpZWxkKHJhdywgXCJzb3VuZFZvbHVtZVwiLCBcIlx1OEJCRVx1N0Y2RVwiLCBhc0ludCwgMTAwKSxcbiAgICBub3RpZmljYXRpb25zOiByZXF1aXJlZEZpZWxkKHJhdywgXCJub3RpZmljYXRpb25zXCIsIFwiXHU4QkJFXHU3RjZFXCIsIGFzQm9vbCksXG4gICAgYWx3YXlzT25Ub3A6IHJlcXVpcmVkRmllbGQocmF3LCBcImFsd2F5c09uVG9wXCIsIFwiXHU4QkJFXHU3RjZFXCIsIGFzQm9vbCksXG4gICAgdGhlbWU6IHJlcXVpcmVkRmllbGQocmF3LCBcInRoZW1lXCIsIFwiXHU4QkJFXHU3RjZFXCIsIGFzU3RyKSxcbiAgICBwZXJzb25hQmFja2Ryb3A6IGZpZWxkKHJhdywgXCJwZXJzb25hQmFja2Ryb3BcIiwgXCJcdThCQkVcdTdGNkVcIiwgYXNCb29sLCBmYWxzZSksXG4gICAgcHJvdGVjdGlvbjogZmllbGQocmF3LCBcInByb3RlY3Rpb25cIiwgXCJcdThCQkVcdTdGNkVcIiwgcGFyc2VQcm90ZWN0aW9uLCB7XG4gICAgICBtb2RlOiBcIm9mZlwiLFxuICAgICAgd2hpdGVsaXN0OiBbXSxcbiAgICAgIHN0cmljdDogZmFsc2UsXG4gICAgfSksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVTZXR0aW5ncyhzOiBTZXR0aW5ncyk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBmb2N1c01pbnV0ZXM6IHMuZm9jdXNNaW51dGVzLFxuICAgIHNob3J0QnJlYWtNaW51dGVzOiBzLnNob3J0QnJlYWtNaW51dGVzLFxuICAgIGxvbmdCcmVha01pbnV0ZXM6IHMubG9uZ0JyZWFrTWludXRlcyxcbiAgICBsb25nQnJlYWtFdmVyeTogcy5sb25nQnJlYWtFdmVyeSxcbiAgICBkYWlseUdvYWw6IHMuZGFpbHlHb2FsLFxuICAgIGF1dG9CcmVhazogcy5hdXRvQnJlYWssXG4gICAgYXV0b0ZvY3VzOiBzLmF1dG9Gb2N1cyxcbiAgICBhdXRvU3RhcnRUYXNrczogcy5hdXRvU3RhcnRUYXNrcyxcbiAgICBzb3VuZDogcy5zb3VuZCxcbiAgICBzb3VuZFZvbHVtZTogcy5zb3VuZFZvbHVtZSxcbiAgICBub3RpZmljYXRpb25zOiBzLm5vdGlmaWNhdGlvbnMsXG4gICAgYWx3YXlzT25Ub3A6IHMuYWx3YXlzT25Ub3AsXG4gICAgdGhlbWU6IHMudGhlbWUsXG4gICAgcGVyc29uYUJhY2tkcm9wOiBzLnBlcnNvbmFCYWNrZHJvcCxcbiAgICBwcm90ZWN0aW9uOiBzZXJpYWxpemVQcm90ZWN0aW9uKHMucHJvdGVjdGlvbiksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWZhdWx0U2V0dGluZ3MoKTogU2V0dGluZ3Mge1xuICByZXR1cm4ge1xuICAgIGZvY3VzTWludXRlczogMjUsXG4gICAgc2hvcnRCcmVha01pbnV0ZXM6IDUsXG4gICAgbG9uZ0JyZWFrTWludXRlczogMTUsXG4gICAgbG9uZ0JyZWFrRXZlcnk6IDQsXG4gICAgZGFpbHlHb2FsOiA4LFxuICAgIGF1dG9CcmVhazogZmFsc2UsXG4gICAgYXV0b0ZvY3VzOiBmYWxzZSxcbiAgICBhdXRvU3RhcnRUYXNrczogZmFsc2UsXG4gICAgc291bmQ6IHRydWUsXG4gICAgc291bmRWb2x1bWU6IDEwMCxcbiAgICBub3RpZmljYXRpb25zOiB0cnVlLFxuICAgIGFsd2F5c09uVG9wOiBmYWxzZSxcbiAgICB0aGVtZTogXCJsaWdodFwiLFxuICAgIHBlcnNvbmFCYWNrZHJvcDogZmFsc2UsXG4gICAgcHJvdGVjdGlvbjogeyBtb2RlOiBcIm9mZlwiLCB3aGl0ZWxpc3Q6IFtdLCBzdHJpY3Q6IGZhbHNlIH0sXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVRpbWVyKHJhdzogdW5rbm93bik6IFRpbWVyIHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdThCQTFcdTY1RjZcdTU2NjhcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIHJldHVybiB7XG4gICAgbW9kZTogb25lT2YoXG4gICAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJtb2RlXCIsIFwiXHU4QkExXHU2NUY2XHU1NjY4XCIsICh2KSA9PiB2KSxcbiAgICAgIFwiXHU4QkExXHU2NUY2XHU1NjY4IG1vZGVcIixcbiAgICAgIFtcImZvY3VzXCIsIFwic2hvcnRCcmVha1wiLCBcImxvbmdCcmVha1wiXSxcbiAgICApIGFzIE1vZGUsXG4gICAgcnVubmluZzogcmVxdWlyZWRGaWVsZChyYXcsIFwicnVubmluZ1wiLCBcIlx1OEJBMVx1NjVGNlx1NTY2OFwiLCBhc0Jvb2wpLFxuICAgIHRhc2tJZDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInRhc2tJZFwiLFxuICAgICAgXCJcdThCQTFcdTY1RjZcdTU2NjhcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcInRhc2tJZFwiLCBhc1N0ciksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgICBkdXJhdGlvblNlY3M6IHJlcXVpcmVkRmllbGQocmF3LCBcImR1cmF0aW9uU2Vjc1wiLCBcIlx1OEJBMVx1NjVGNlx1NTY2OFwiLCBhc0ludCksXG4gICAgcmVtYWluaW5nU2VjczogcmVxdWlyZWRGaWVsZChyYXcsIFwicmVtYWluaW5nU2Vjc1wiLCBcIlx1OEJBMVx1NjVGNlx1NTY2OFwiLCBhc0ludCksXG4gICAgZGVhZGxpbmU6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJkZWFkbGluZVwiLFxuICAgICAgXCJcdThCQTFcdTY1RjZcdTU2NjhcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcImRlYWRsaW5lXCIsIGFzSW50KSxcbiAgICAgIG51bGwsXG4gICAgKSBhcyBudW1iZXIgfCBudWxsLFxuICAgIHN0YXJ0ZWRBdDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInN0YXJ0ZWRBdFwiLFxuICAgICAgXCJcdThCQTFcdTY1RjZcdTU2NjhcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcInN0YXJ0ZWRBdFwiLCBhc0ludCksXG4gICAgICBudWxsLFxuICAgICkgYXMgbnVtYmVyIHwgbnVsbCxcbiAgICBjeWNsZTogcmVxdWlyZWRGaWVsZChyYXcsIFwiY3ljbGVcIiwgXCJcdThCQTFcdTY1RjZcdTU2NjhcIiwgYXNJbnQpLFxuICAgIGN5Y2xlRGF0ZTogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImN5Y2xlRGF0ZVwiLFxuICAgICAgXCJcdThCQTFcdTY1RjZcdTU2NjhcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcImN5Y2xlRGF0ZVwiLCBhc1N0ciksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgICBjb21wbGV0aW9uU2VyaWFsOiByZXF1aXJlZEZpZWxkKHJhdywgXCJjb21wbGV0aW9uU2VyaWFsXCIsIFwiXHU4QkExXHU2NUY2XHU1NjY4XCIsIGFzSW50KSxcbiAgICBsYXN0RmluaXNoZWRNb2RlOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwibGFzdEZpbmlzaGVkTW9kZVwiLFxuICAgICAgXCJcdThCQTFcdTY1RjZcdTU2NjhcIixcbiAgICAgICh2KSA9PlxuICAgICAgICBhc09wdCh2LCBcImxhc3RGaW5pc2hlZE1vZGVcIiwgKHgpID0+XG4gICAgICAgICAgb25lT2YoeCwgXCJsYXN0RmluaXNoZWRNb2RlXCIsIFtcImZvY3VzXCIsIFwic2hvcnRCcmVha1wiLCBcImxvbmdCcmVha1wiXSksXG4gICAgICAgICksXG4gICAgICBudWxsLFxuICAgICkgYXMgTW9kZSB8IG51bGwsXG4gICAgYXV0b0ZvY3VzQmxvY2tlZDogZmllbGQocmF3LCBcImF1dG9Gb2N1c0Jsb2NrZWRcIiwgXCJcdThCQTFcdTY1RjZcdTU2NjhcIiwgYXNCb29sLCBmYWxzZSksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVUaW1lcih0OiBUaW1lcik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICBtb2RlOiB0Lm1vZGUsXG4gICAgcnVubmluZzogdC5ydW5uaW5nLFxuICAgIHRhc2tJZDogdC50YXNrSWQsXG4gICAgZHVyYXRpb25TZWNzOiB0LmR1cmF0aW9uU2VjcyxcbiAgICByZW1haW5pbmdTZWNzOiB0LnJlbWFpbmluZ1NlY3MsXG4gICAgZGVhZGxpbmU6IHQuZGVhZGxpbmUsXG4gICAgc3RhcnRlZEF0OiB0LnN0YXJ0ZWRBdCxcbiAgICBjeWNsZTogdC5jeWNsZSxcbiAgICBjeWNsZURhdGU6IHQuY3ljbGVEYXRlLFxuICAgIGNvbXBsZXRpb25TZXJpYWw6IHQuY29tcGxldGlvblNlcmlhbCxcbiAgICBsYXN0RmluaXNoZWRNb2RlOiB0Lmxhc3RGaW5pc2hlZE1vZGUsXG4gICAgYXV0b0ZvY3VzQmxvY2tlZDogdC5hdXRvRm9jdXNCbG9ja2VkLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVmYXVsdFRpbWVyKCk6IFRpbWVyIHtcbiAgcmV0dXJuIHtcbiAgICBtb2RlOiBcImZvY3VzXCIsXG4gICAgcnVubmluZzogZmFsc2UsXG4gICAgdGFza0lkOiBudWxsLFxuICAgIGR1cmF0aW9uU2VjczogMTUwMCxcbiAgICByZW1haW5pbmdTZWNzOiAxNTAwLFxuICAgIGRlYWRsaW5lOiBudWxsLFxuICAgIHN0YXJ0ZWRBdDogbnVsbCxcbiAgICBjeWNsZTogMCxcbiAgICBjeWNsZURhdGU6IG51bGwsXG4gICAgY29tcGxldGlvblNlcmlhbDogMCxcbiAgICBsYXN0RmluaXNoZWRNb2RlOiBudWxsLFxuICAgIGF1dG9Gb2N1c0Jsb2NrZWQ6IGZhbHNlLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTZXNzaW9uKHJhdzogdW5rbm93bik6IFNlc3Npb24ge1xuICBpZiAoIWlzT2JqZWN0KHJhdykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NEUxM1x1NkNFOFx1OEJCMFx1NUY1NVx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiaWRcIiwgXCJcdTRFMTNcdTZDRThcdThCQjBcdTVGNTVcIiwgYXNTdHIpLFxuICAgIHNvdXJjZTogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInNvdXJjZVwiLFxuICAgICAgXCJcdTRFMTNcdTZDRThcdThCQjBcdTVGNTVcIixcbiAgICAgICh2KSA9PiBvbmVPZih2LCBcInNvdXJjZVwiLCBbXCJ0aW1lclwiLCBcInRhc2tFc3RpbWF0ZVwiXSksXG4gICAgICBcInRpbWVyXCIsXG4gICAgKSBhcyBTZXNzaW9uU291cmNlLFxuICAgIHRhc2tJZDogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInRhc2tJZFwiLFxuICAgICAgXCJcdTRFMTNcdTZDRThcdThCQjBcdTVGNTVcIixcbiAgICAgICh2KSA9PiBhc09wdCh2LCBcInRhc2tJZFwiLCBhc1N0ciksXG4gICAgICBudWxsLFxuICAgICkgYXMgc3RyaW5nIHwgbnVsbCxcbiAgICB0YXNrVGl0bGU6IHJlcXVpcmVkRmllbGQocmF3LCBcInRhc2tUaXRsZVwiLCBcIlx1NEUxM1x1NkNFOFx1OEJCMFx1NUY1NVwiLCBhc1N0ciksXG4gICAgcHJvamVjdE5hbWU6IHJlcXVpcmVkRmllbGQocmF3LCBcInByb2plY3ROYW1lXCIsIFwiXHU0RTEzXHU2Q0U4XHU4QkIwXHU1RjU1XCIsIGFzU3RyKSxcbiAgICBzdGFydGVkQXQ6IHJlcXVpcmVkRmllbGQocmF3LCBcInN0YXJ0ZWRBdFwiLCBcIlx1NEUxM1x1NkNFOFx1OEJCMFx1NUY1NVwiLCBhc0ludCksXG4gICAgZW5kZWRBdDogcmVxdWlyZWRGaWVsZChyYXcsIFwiZW5kZWRBdFwiLCBcIlx1NEUxM1x1NkNFOFx1OEJCMFx1NUY1NVwiLCBhc0ludCksXG4gICAgZHVyYXRpb25TZWNzOiByZXF1aXJlZEZpZWxkKHJhdywgXCJkdXJhdGlvblNlY3NcIiwgXCJcdTRFMTNcdTZDRThcdThCQjBcdTVGNTVcIiwgYXNJbnQpLFxuICAgIGNvbXBsZXRlZDogcmVxdWlyZWRGaWVsZChyYXcsIFwiY29tcGxldGVkXCIsIFwiXHU0RTEzXHU2Q0U4XHU4QkIwXHU1RjU1XCIsIGFzQm9vbCksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVTZXNzaW9uKHM6IFNlc3Npb24pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB7XG4gICAgaWQ6IHMuaWQsXG4gICAgc291cmNlOiBzLnNvdXJjZSxcbiAgICB0YXNrSWQ6IHMudGFza0lkLFxuICAgIHRhc2tUaXRsZTogcy50YXNrVGl0bGUsXG4gICAgcHJvamVjdE5hbWU6IHMucHJvamVjdE5hbWUsXG4gICAgc3RhcnRlZEF0OiBzLnN0YXJ0ZWRBdCxcbiAgICBlbmRlZEF0OiBzLmVuZGVkQXQsXG4gICAgZHVyYXRpb25TZWNzOiBzLmR1cmF0aW9uU2VjcyxcbiAgICBjb21wbGV0ZWQ6IHMuY29tcGxldGVkLFxuICB9O1xufVxuXG4vLyAtLS0tLS0tLS0tIEFwcERhdGEgLS0tLS0tLS0tLVxuXG5leHBvcnQgY2xhc3MgQXBwRGF0YSB7XG4gIGVkdWNhdGlvbjogRWR1Y2F0aW9uO1xuICB2ZXJzaW9uOiBudW1iZXI7XG4gIGlkZW50aXRpZXM6IElkZW50aXR5W107XG4gIHRhc2tzOiBUYXNrW107XG4gIGJsb2NrczogQmxvY2tbXTtcbiAgcHJvamVjdHM6IFByb2plY3RbXTtcbiAgaGFiaXRzOiBIYWJpdFtdO1xuICB2aXNpb25zOiBWaXNpb25bXTtcbiAgc2V0dGluZ3M6IFNldHRpbmdzO1xuICB0aW1lcjogVGltZXI7XG4gIHNlc3Npb25zOiBTZXNzaW9uW107XG4gIGxvY2s6IExvY2tTdGF0ZTtcblxuICBjb25zdHJ1Y3Rvcihpbml0PzogUGFydGlhbDxQaWNrPEFwcERhdGEsIGtleW9mIEFwcERhdGE+Pikge1xuICAgIHRoaXMuZWR1Y2F0aW9uID0gaW5pdD8uZWR1Y2F0aW9uID8/IG5ldyBFZHVjYXRpb24oKTtcbiAgICB0aGlzLnZlcnNpb24gPSBpbml0Py52ZXJzaW9uID8/IDU7XG4gICAgdGhpcy5pZGVudGl0aWVzID0gaW5pdD8uaWRlbnRpdGllcyA/PyBbXTtcbiAgICB0aGlzLnRhc2tzID0gaW5pdD8udGFza3MgPz8gW107XG4gICAgdGhpcy5ibG9ja3MgPSBpbml0Py5ibG9ja3MgPz8gW107XG4gICAgdGhpcy5wcm9qZWN0cyA9IGluaXQ/LnByb2plY3RzID8/IFtcbiAgICAgIHsgaWQ6IGlkKCksIG5hbWU6IFwiXHU1REU1XHU0RjVDXCIsIGNvbG9yOiBcIiNkZjc1NjFcIiwgYXBwV2hpdGVsaXN0OiBudWxsIH0sXG4gICAgICB7IGlkOiBpZCgpLCBuYW1lOiBcIlx1NUI2Nlx1NEU2MFwiLCBjb2xvcjogXCIjODQ5YjdkXCIsIGFwcFdoaXRlbGlzdDogbnVsbCB9LFxuICAgICAgeyBpZDogaWQoKSwgbmFtZTogXCJcdTc1MUZcdTZEM0JcIiwgY29sb3I6IFwiI2Q1YTU1M1wiLCBhcHBXaGl0ZWxpc3Q6IG51bGwgfSxcbiAgICBdO1xuICAgIHRoaXMuaGFiaXRzID0gaW5pdD8uaGFiaXRzID8/IFtdO1xuICAgIHRoaXMudmlzaW9ucyA9IGluaXQ/LnZpc2lvbnMgPz8gW107XG4gICAgdGhpcy5zZXR0aW5ncyA9IGluaXQ/LnNldHRpbmdzID8/IGRlZmF1bHRTZXR0aW5ncygpO1xuICAgIHRoaXMudGltZXIgPSBpbml0Py50aW1lciA/PyBkZWZhdWx0VGltZXIoKTtcbiAgICB0aGlzLnNlc3Npb25zID0gaW5pdD8uc2Vzc2lvbnMgPz8gW107XG4gICAgdGhpcy5sb2NrID0gaW5pdD8ubG9jayA/PyB7XG4gICAgICBzY2hlZHVsZXM6IFtdLFxuICAgICAgYWN0aXZlOiBudWxsLFxuICAgICAgc3VwcHJlc3NlZFVudGlsOiAwLFxuICAgIH07XG4gIH1cblxuICBwcm90ZWN0ZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMubG9jay5hY3RpdmUgIT09IG51bGwgfHxcbiAgICAgICh0aGlzLnRpbWVyLnJ1bm5pbmcgJiZcbiAgICAgICAgdGhpcy50aW1lci5tb2RlID09PSBcImZvY3VzXCIgJiZcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5wcm90ZWN0aW9uLm1vZGUgIT09IFwib2ZmXCIpXG4gICAgKTtcbiAgfVxuXG4gIC8qKiBcdTc2N0RcdTU0MERcdTUzNTVcdTRFMTNcdTZDRThcdTY1RjZcdTc1MUZcdTY1NDhcdTc2ODRcdTVFOTRcdTc1MjhcdTZFMDVcdTUzNTVcdUZGMUFcdTk4NzlcdTc2RUVcdTRFMTNcdTVDNUVcdTZFMDVcdTUzNTVcdTY2RkZcdTRFRTNcdTkwMUFcdTc1MjhcdTZFMDVcdTUzNTVcdTMwMDIgKi9cbiAgZWZmZWN0aXZlV2hpdGVsaXN0KCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBwcm9qZWN0ID0gKCgpID0+IHtcbiAgICAgIGNvbnN0IHRhc2tJZCA9IHRoaXMudGltZXIudGFza0lkO1xuICAgICAgaWYgKHRhc2tJZCA9PT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIGNvbnN0IHRhc2sgPSB0aGlzLnRhc2tzLmZpbmQoKHQpID0+IHQuaWQgPT09IHRhc2tJZCk7XG4gICAgICBpZiAodGFzayA9PT0gdW5kZWZpbmVkIHx8IHRhc2sucHJvamVjdElkID09PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgcmV0dXJuIHRoaXMucHJvamVjdHMuZmluZCgocCkgPT4gcC5pZCA9PT0gdGFzay5wcm9qZWN0SWQpO1xuICAgIH0pKCk7XG4gICAgY29uc3QgbGlzdCA9IHByb2plY3Q/LmFwcFdoaXRlbGlzdDtcbiAgICByZXR1cm4gbGlzdCAhPT0gbnVsbCAmJiBsaXN0ICE9PSB1bmRlZmluZWRcbiAgICAgID8gWy4uLmxpc3RdXG4gICAgICA6IFsuLi50aGlzLnNldHRpbmdzLnByb3RlY3Rpb24ud2hpdGVsaXN0XTtcbiAgfVxuXG4gIHRhc2tJc1ZvaWQodGFzazogVGFzayk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0YXNrSXNWb2lkKHRhc2spO1xuICB9XG5cbiAgc3RyaWN0UHJvdGVjdGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICAodGhpcy5sb2NrLmFjdGl2ZSAhPT0gbnVsbCAmJiB0aGlzLmxvY2suYWN0aXZlLnN0cmljdCkgfHxcbiAgICAgICh0aGlzLnRpbWVyLnJ1bm5pbmcgJiZcbiAgICAgICAgdGhpcy50aW1lci5tb2RlID09PSBcImZvY3VzXCIgJiZcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5wcm90ZWN0aW9uLm1vZGUgIT09IFwib2ZmXCIgJiZcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5wcm90ZWN0aW9uLnN0cmljdClcbiAgICApO1xuICB9XG5cbiAgZHVyYXRpb25PZihtb2RlOiBNb2RlKTogbnVtYmVyIHtcbiAgICByZXR1cm4gZHVyYXRpb25PZih0aGlzLCBtb2RlKTtcbiAgfVxuXG4gIHRhc2tIYXNSb3VuZHNMZWZ0KHRhc2s6IFRhc2spOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGFza0hhc1JvdW5kc0xlZnQodGhpcywgdGFzayk7XG4gIH1cblxuICByZXNldFRvKG1vZGU6IE1vZGUpOiB2b2lkIHtcbiAgICByZXNldFRvKHRoaXMsIG1vZGUpO1xuICB9XG5cbiAgc3RhcnQoYXQ6IG51bWJlcik6IHZvaWQge1xuICAgIHN0YXJ0VGltZXIodGhpcywgYXQpO1xuICB9XG5cbiAgcmVjb3JkKGF0OiBudW1iZXIsIGNvbXBsZXRlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIHJlY29yZFNlc3Npb24odGhpcywgYXQsIGNvbXBsZXRlZCk7XG4gIH1cblxuICByZWZyZXNoQ3ljbGUoYXQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGRhdGUgPSBkYXRlQXQoYXQpO1xuICAgIGlmICh0aGlzLnRpbWVyLmN5Y2xlRGF0ZSA9PT0gZGF0ZSkgcmV0dXJuIGZhbHNlO1xuICAgIHRoaXMudGltZXIuY3ljbGUgPSB0aGlzLnNlc3Npb25zLmZpbHRlcihcbiAgICAgIChzKSA9PiBzLmNvbXBsZXRlZCAmJiBkYXRlQXQocy5lbmRlZEF0KSA9PT0gZGF0ZSxcbiAgICApLmxlbmd0aDtcbiAgICB0aGlzLnRpbWVyLmN5Y2xlRGF0ZSA9IGRhdGU7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKiogXHU1MDVDXHU2NzNBXHU1NDBFXHU2NzAwXHU1OTFBXHU2M0E4XHU4RkRCXHU0RTAwXHU0RTJBXHU5NjM2XHU2QkI1XHVGRjFBXHU3RUREXHU0RTBEXHU0RjJBXHU5MDIwXHU2NUUwXHU0RUJBXHU1MDNDXHU1Qjg4XHU3Njg0XHU0RTEzXHU2Q0U4XHU0RjFBXHU4QkREXHUzMDAyICovXG4gIHRpY2soYXQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHRlYWNoaW5nQ2hhbmdlZCA9IHRoaXMuZWR1Y2F0aW9uLnRpY2soYXQpO1xuICAgIGNvbnN0IHRlYWNoaW5nVGFza3NDaGFuZ2VkID0gbWF0ZXJpYWxpemVUZWFjaGluZ1Rhc2tzKHRoaXMsIGF0KTtcbiAgICBjb25zdCBtYXRlcmlhbGl6ZWQgPSB0ZWFjaGluZ0NoYW5nZWQgfHwgdGVhY2hpbmdUYXNrc0NoYW5nZWQ7XG4gICAgY29uc3QgcmVtaW5kZXJzQ2hhbmdlZCA9IHRpY2tSZW1pbmRlcnModGhpcywgYXQpO1xuICAgIGNvbnN0IGNoYW5nZWQgPSB0aGlzLnRpY2tXaXRoTG9jayhhdCkgfHwgbWF0ZXJpYWxpemVkO1xuICAgIGNvbnN0IGN5Y2xlQ2hhbmdlZCA9IHRoaXMucmVmcmVzaEN5Y2xlKGF0KTtcbiAgICBpZiAoXG4gICAgICBjeWNsZUNoYW5nZWQgJiZcbiAgICAgIHRoaXMudGltZXIuY3ljbGUgPT09IDAgJiZcbiAgICAgIHRoaXMudGltZXIubW9kZSAhPT0gXCJmb2N1c1wiICYmXG4gICAgICAhdGhpcy50aW1lci5ydW5uaW5nICYmXG4gICAgICB0aGlzLnRpbWVyLnN0YXJ0ZWRBdCA9PT0gbnVsbCAmJlxuICAgICAgdGhpcy50aW1lci5yZW1haW5pbmdTZWNzID09PSB0aGlzLnRpbWVyLmR1cmF0aW9uU2Vjc1xuICAgICkge1xuICAgICAgdGhpcy5yZXNldFRvKFwiZm9jdXNcIik7XG4gICAgfVxuICAgIHJldHVybiAoXG4gICAgICBzdGFydER1ZVRhc2sodGhpcywgYXQpIHx8IHJlbWluZGVyc0NoYW5nZWQgfHwgY2hhbmdlZCB8fCBjeWNsZUNoYW5nZWRcbiAgICApO1xuICB9XG5cbiAgdGlja1dpdGhMb2NrKGF0OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBjb25zdCBwcmV2aW91cyA9IEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZUxvY2tTdGF0ZSh0aGlzLmxvY2spKTtcbiAgICBpZiAodGhpcy5sb2NrLmFjdGl2ZSAhPT0gbnVsbCAmJiBhdCA+PSB0aGlzLmxvY2suYWN0aXZlLmVuZHNBdCkge1xuICAgICAgdGhpcy5sb2NrLmFjdGl2ZSA9IG51bGw7XG4gICAgfVxuICAgIGNvbnN0IHNjaGVkdWxlZCA9IHNjaGVkdWxlZEF0KHRoaXMubG9jaywgYXQpO1xuICAgIGlmIChzY2hlZHVsZWQgIT09IG51bGwpIHtcbiAgICAgIGlmICh0aGlzLmxvY2suYWN0aXZlICE9PSBudWxsKSB7XG4gICAgICAgIHNjaGVkdWxlZC5zdGFydGVkQXQgPSBNYXRoLm1pbihcbiAgICAgICAgICB0aGlzLmxvY2suYWN0aXZlLnN0YXJ0ZWRBdCxcbiAgICAgICAgICBzY2hlZHVsZWQuc3RhcnRlZEF0LFxuICAgICAgICApO1xuICAgICAgICBzY2hlZHVsZWQuZW5kc0F0ID0gTWF0aC5tYXgodGhpcy5sb2NrLmFjdGl2ZS5lbmRzQXQsIHNjaGVkdWxlZC5lbmRzQXQpO1xuICAgICAgICBzY2hlZHVsZWQuc3RyaWN0ID0gc2NoZWR1bGVkLnN0cmljdCB8fCB0aGlzLmxvY2suYWN0aXZlLnN0cmljdDtcbiAgICAgIH1cbiAgICAgIHRoaXMubG9jay5hY3RpdmUgPSBzY2hlZHVsZWQ7XG4gICAgfVxuICAgIGNvbnN0IGNoYW5nZWQgPSBwcmV2aW91cyAhPT0gSlNPTi5zdHJpbmdpZnkoc2VyaWFsaXplTG9ja1N0YXRlKHRoaXMubG9jaykpO1xuICAgIGlmICh0aGlzLmxvY2suYWN0aXZlICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBzdGFydCA9IHRoaXMubG9jay5hY3RpdmUuc3RhcnRlZEF0O1xuICAgICAgaWYgKHRoaXMudGltZXIucnVubmluZykge1xuICAgICAgICBjb25zdCBzdG9wID0gTWF0aC5taW4oXG4gICAgICAgICAgTWF0aC5tYXgoc3RhcnQsIHRoaXMudGltZXIuc3RhcnRlZEF0ID8/IHN0YXJ0KSxcbiAgICAgICAgICBhdCxcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy50aWNrVGltZXIoc3RvcCk7XG4gICAgICAgIHRoaXMucmVjb3JkKHN0b3AsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5yZXNldFRvKFwiZm9jdXNcIik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNoYW5nZWQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnRpY2tUaW1lcihhdCkgfHwgY2hhbmdlZDtcbiAgfVxuXG4gIHRpY2tUaW1lcihhdDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgaWYgKCF0aGlzLnRpbWVyLnJ1bm5pbmcgfHwgdGltZXJSZW1haW5pbmcodGhpcy50aW1lciwgYXQpID4gMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBlbmQgPSB0aGlzLnRpbWVyLmRlYWRsaW5lID8/IGF0O1xuICAgIHRoaXMuZmluaXNoVGltZXIoZW5kLCBhdCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmaW5pc2hUaW1lcihlbmQ6IG51bWJlciwgYXQ6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGZpbmlzaGVkID0gdGhpcy50aW1lci5tb2RlO1xuICAgIGNvbnN0IGNvbnRpbnVhdGlvbkJsb2NrZWQgPSB0aGlzLnRpbWVyLmF1dG9Gb2N1c0Jsb2NrZWQ7XG4gICAgaWYgKGZpbmlzaGVkID09PSBcImZvY3VzXCIpIHtcbiAgICAgIHRoaXMucmVmcmVzaEN5Y2xlKGVuZCk7XG4gICAgfVxuICAgIHRoaXMucmVjb3JkKGVuZCwgdHJ1ZSk7XG4gICAgaWYgKGZpbmlzaGVkID09PSBcImZvY3VzXCIpIHtcbiAgICAgIHRoaXMudGltZXIuY3ljbGUgPSBNYXRoLm1pbih0aGlzLnRpbWVyLmN5Y2xlICsgMSwgNDI5NDk2NzI5NSk7XG4gICAgfVxuICAgIGNvbnN0IG5leHQ6IE1vZGUgPVxuICAgICAgZmluaXNoZWQgPT09IFwiZm9jdXNcIlxuICAgICAgICA/IHRoaXMudGltZXIuY3ljbGUgJSB0aGlzLnNldHRpbmdzLmxvbmdCcmVha0V2ZXJ5ID09PSAwXG4gICAgICAgICAgPyBcImxvbmdCcmVha1wiXG4gICAgICAgICAgOiBcInNob3J0QnJlYWtcIlxuICAgICAgICA6IFwiZm9jdXNcIjtcbiAgICB0aGlzLnJlc2V0VG8obmV4dCk7XG4gICAgdGhpcy50aW1lci5jb21wbGV0aW9uU2VyaWFsID0gTWF0aC5taW4oXG4gICAgICB0aGlzLnRpbWVyLmNvbXBsZXRpb25TZXJpYWwgKyAxLFxuICAgICAgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsXG4gICAgKTtcbiAgICB0aGlzLnRpbWVyLmxhc3RGaW5pc2hlZE1vZGUgPSBmaW5pc2hlZDtcbiAgICBjb25zdCBhdXRvID1cbiAgICAgIG5leHQgPT09IFwiZm9jdXNcIlxuICAgICAgICA/IHRoaXMuc2V0dGluZ3MuYXV0b0ZvY3VzICYmXG4gICAgICAgICAgIWNvbnRpbnVhdGlvbkJsb2NrZWQgJiZcbiAgICAgICAgICAodGhpcy50aW1lci50YXNrSWQgPT09IG51bGwgfHxcbiAgICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHRhc2sgPSB0aGlzLnRhc2tzLmZpbmQoKHQpID0+IHQuaWQgPT09IHRoaXMudGltZXIudGFza0lkKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRhc2sgIT09IHVuZGVmaW5lZCAmJiB0aGlzLnRhc2tIYXNSb3VuZHNMZWZ0KHRhc2spO1xuICAgICAgICAgICAgfSkoKSkgJiZcbiAgICAgICAgICAhKHRoaXMuc2V0dGluZ3MuYXV0b1N0YXJ0VGFza3MgJiYgZHVlQXV0b1Rhc2sodGhpcykgIT09IG51bGwpXG4gICAgICAgIDogdGhpcy5zZXR0aW5ncy5hdXRvQnJlYWs7XG4gICAgLy8gXHU4MUVBXHU1MkE4XHU3RUVEXHU2M0E1XHU1M0VBXHU1QzVFXHU0RThFXHU2RDNCXHU3NzQwXHU3Njg0XHU1RTk0XHU3NTI4XHVGRjBDXHU0RTBEXHU1RjI1XHU4ODY1XHU1MTczXHU2NzNBL1x1Nzc2MVx1NzcyMFx1NzY4NFx1NjVGNlx1OTVGNFx1MzAwMlxuICAgIGlmIChhdXRvICYmIGF0IC0gZW5kIDwgNSkge1xuICAgICAgdGhpcy5zdGFydChhdCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFx1OTg4NFx1NjhDMCArIFx1NjI2N1x1ODg0QyArIFx1NjU1OVx1NUI2Nlx1NUY4NVx1NTI5RVx1NzUxRlx1NjIxMCArIFx1NTE2OFx1OTFDRlx1NjgyMVx1OUE4Q1x1MzAwMiAqL1xuICBhcHBseShhY3Rpb246IEFjdGlvbiwgYXQ6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMudGljayhhdCk7XG4gICAgaWYgKHRoaXMuc3RyaWN0UHJvdGVjdGVkKCkpIHtcbiAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NEUyNVx1NjgzQ1x1NkEyMVx1NUYwRlx1NzUxRlx1NjU0OFx1NEUyRFx1RkYwQ1x1NEUwRFx1ODBGRFx1NjNEMFx1NTI0RFx1N0VEM1x1Njc1Rlx1NjIxNlx1NEZFRVx1NjUzOVx1RkYxQlx1NTIzMFx1NjVGNlx1ODFFQVx1NTJBOFx1ODlFM1x1OTY2NFwiKTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgdGhpcy5wcm90ZWN0ZWQoKSAmJlxuICAgICAgYWN0aW9uLnR5cGUgIT09IFwiZW1lcmdlbmN5VW5sb2NrXCIgJiZcbiAgICAgIGFjdGlvbi50eXBlICE9PSBcImNvbXBsZXRlRm9jdXNcIlxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFxuICAgICAgICBcIlx1NEUxM1x1NkNFOFx1NEZERFx1NjJBNFx1NEUyRFx1RkYwQ1x1N0VEM1x1Njc1Rlx1NTI0RFx1NEUwRFx1ODBGRFx1NEZFRVx1NjUzOVx1NEVGQlx1NTJBMVx1NjIxNlx1OEJBMVx1NjVGNlx1RkYxQlx1NTNFRlx1NjNEMFx1NTI0RFx1NUI4Q1x1NjIxMFx1NzU2QVx1ODMwNFx1NjIxNlx1N0QyN1x1NjAyNVx1OTAwMFx1NTFGQVwiLFxuICAgICAgKTtcbiAgICB9XG4gICAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xuICAgICAgY2FzZSBcImVkdWNhdGlvblwiOiB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBhY3Rpb24uY29tbWFuZC5vcCA9PT0gXCJzdGFydEV4YW1cIiAmJlxuICAgICAgICAgICghdGhpcy5yZW1pbmRlcklkbGUoKSB8fFxuICAgICAgICAgICAgdGhpcy50aW1lci5tb2RlICE9PSBcImZvY3VzXCIgfHxcbiAgICAgICAgICAgIHRoaXMudGltZXIucmVtYWluaW5nU2VjcyAhPT0gdGhpcy50aW1lci5kdXJhdGlvblNlY3MpXG4gICAgICAgICkge1xuICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJGN1x1NTE0OFx1N0VEM1x1Njc1Rlx1NUY1M1x1NTI0RFx1OEJBMVx1NjVGNlx1NjIxNlx1OTUwMVx1NjczQVx1RkYwQ1x1NTE4RFx1NUYwMFx1NTlDQlx1ODAwM1x1OEJENVwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVkdWNhdGlvbi5hcHBseShhY3Rpb24uY29tbWFuZCwgYXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJzdGFydFJlbWluZGVyXCI6IHtcbiAgICAgICAgaWYgKCF0aGlzLnJlbWluZGVySWRsZSgpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU4QkY3XHU1MTQ4XHU3RUQzXHU2NzVGXHU1RjUzXHU1MjREXHU4QkExXHU2NUY2XCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHQgPSB0aGlzLnRhc2tzLmZpbmQoXG4gICAgICAgICAgKHgpID0+IHguaWQgPT09IGFjdGlvbi5pZCAmJiAheC5jb21wbGV0ZWQgJiYgeC5yZW1pbmRlclBlbmRpbmcsXG4gICAgICAgICk7XG4gICAgICAgIGlmICh0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTYzRDBcdTkxOTJcdTVERjJcdTU5MzFcdTY1NDhcIik7XG4gICAgICAgIH1cbiAgICAgICAgdC5yZW1pbmRlclBlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aW1lci50YXNrSWQgPSBhY3Rpb24uaWQ7XG4gICAgICAgIHRoaXMucmVzZXRUbyhcImZvY3VzXCIpO1xuICAgICAgICBzdGFydFRlYWNoaW5nVGFzayh0aGlzLCBhdCk7XG4gICAgICAgIHRoaXMuc3RhcnQoYXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJlbWVyZ2VuY3lVbmxvY2tcIjoge1xuICAgICAgICB0aGlzLnJlY29yZChhdCwgZmFsc2UpO1xuICAgICAgICB0aGlzLnJlc2V0VG8oXCJmb2N1c1wiKTtcbiAgICAgICAgcmVsZWFzZUxvY2sodGhpcy5sb2NrLCBhdCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInJlYXJtTG9ja1wiOiB7XG4gICAgICAgIC8vIFx1MzAwQ1x1N0VEM1x1Njc1Rlx1NUU3Nlx1ODlFM1x1OTUwMVx1MzAwRFx1NTNFQVx1NjI5MVx1NTIzNlx1NUY1M1x1NTI0RFx1NjVGNlx1NkJCNVx1RkYwQ1x1NEUwRFx1NTIyMFx1NjVGNlx1NkJCNVx1RkYxQlx1NzUyOFx1NjIzN1x1NjBGM1x1NTZERVx1NTIzMFx1OTUwMVx1NjczQVx1NzJCNlx1NjAwMVx1NjVGNlx1NUY5N1xuICAgICAgICAvLyBcdTY3MDlcdTRFMkFcdTY2M0VcdTVGMEZcdTUxNjVcdTUzRTNcdUZGMENcdTU0MjZcdTUyMTlcdTUzRUFcdTgwRkRcdTdCNDlcdTUyMzBcdTY1RjZcdTZCQjVcdTdFRDNcdTY3NUZcdTYyMTZcdTUzQkJcdTY1MzlcdTY1RjZcdTZCQjVcdTkxNERcdTdGNkVcdTMwMDJcbiAgICAgICAgdGhpcy5sb2NrLnN1cHByZXNzZWRVbnRpbCA9IDA7XG4gICAgICAgIHRoaXMudGljayhhdCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcImNvbXBsZXRlRm9jdXNcIjoge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgdGhpcy5sb2NrLmFjdGl2ZSAhPT0gbnVsbCB8fFxuICAgICAgICAgIHRoaXMudGltZXIubW9kZSAhPT0gXCJmb2N1c1wiIHx8XG4gICAgICAgICAgdGhpcy50aW1lci5zdGFydGVkQXQgPT09IG51bGxcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU1RjUzXHU1MjREXHU2Q0ExXHU2NzA5XHU1M0VGXHU2M0QwXHU1MjREXHU1QjhDXHU2MjEwXHU3Njg0XHU0RTEzXHU2Q0U4XCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aW1lclJlbWFpbmluZyh0aGlzLnRpbWVyLCBhdCkgPT09IHRoaXMudGltZXIuZHVyYXRpb25TZWNzKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU1QzFBXHU2NUUwXHU0RTEzXHU2Q0U4XHU3NTI4XHU2NUY2XHVGRjBDXHU4QkY3XHU3QTBEXHU1NDBFXHU1MThEXHU1QjhDXHU2MjEwXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZmluaXNoVGltZXIoYXQsIGF0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwic2F2ZUxvY2tTY2hlZHVsZVwiOiB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5sb2NrLnNjaGVkdWxlcy5maW5kSW5kZXgoXG4gICAgICAgICAgKHMpID0+IHMuaWQgPT09IGFjdGlvbi5zY2hlZHVsZS5pZCxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICB0aGlzLmxvY2suc2NoZWR1bGVzW2luZGV4XSA9IGFjdGlvbi5zY2hlZHVsZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmxvY2suc2NoZWR1bGVzLnB1c2goYWN0aW9uLnNjaGVkdWxlKTtcbiAgICAgICAgfVxuICAgICAgICB2YWxpZGF0ZUxvY2sodGhpcy5sb2NrKTtcbiAgICAgICAgLy8gXHU1MkE4XHU2MjRCXHU2NTM5XHU2NUY2XHU2QkI1XHVGRjA4XHU1NDJCXHU1MTczXHU2Mzg5XHU1MThEXHU2MjUzXHU1RjAwXHVGRjA5XHU1QzMxXHU2NjJGXHU5MUNEXHU2NUIwXHU2QjY2XHU4OEM1XHVGRjFBXHU1MTQ4XHU2RTA1XHU2Mzg5XHU0RTBBXHU0RTAwXHU2QjIxXHUzMDBDXHU3RUQzXHU2NzVGXHU1RTc2XHU4OUUzXHU5NTAxXHUzMDBEXG4gICAgICAgIC8vIFx1NzU1OVx1NEUwQlx1NzY4NFx1NjI5MVx1NTIzNlx1RkYwQ1x1NTQyNlx1NTIxOSB0aWNrIFx1OTFDQ1x1NzY4NCBzY2hlZHVsZWRBdCBcdTRFQ0RcdTRGMUFcdTU2RTAgc3VwcHJlc3NlZFVudGlsIFx1OEZENFx1NTZERVxuICAgICAgICAvLyBudWxsXHUyMDE0XHUyMDE0XHU5ODc1XHU5NzYyXHU2NjNFXHU3OTNBXHUzMDBDXHU1REYyXHU1NDJGXHU3NTI4XHUzMDBEXHVGRjBDXHU1QjlFXHU5NjQ1XHU0RUMwXHU0RTQ4XHU5MEZEXHU0RTBEXHU0RjFBXHU1M0QxXHU3NTFGXHUzMDAyXG4gICAgICAgIHRoaXMubG9jay5zdXBwcmVzc2VkVW50aWwgPSAwO1xuICAgICAgICB0aGlzLnRpY2soYXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJkZWxldGVMb2NrU2NoZWR1bGVcIjpcbiAgICAgICAgdGhpcy5sb2NrLnNjaGVkdWxlcyA9IHRoaXMubG9jay5zY2hlZHVsZXMuZmlsdGVyKFxuICAgICAgICAgIChzKSA9PiBzLmlkICE9PSBhY3Rpb24uaWQsXG4gICAgICAgICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcInN0YXJ0UXVpY2tMb2NrXCI6IHtcbiAgICAgICAgaWYgKGFjdGlvbi5taW51dGVzIDwgMSB8fCBhY3Rpb24ubWludXRlcyA+IDcyMCkge1xuICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NUZFQlx1OTAxRlx1OTUwMVx1NjczQVx1NjVGNlx1OTU3Rlx1OTcwMFx1NEUzQSAxXHUyMDEzNzIwIFx1NTIwNlx1OTQ5RlwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlY29yZChhdCwgZmFsc2UpO1xuICAgICAgICB0aGlzLnJlc2V0VG8oXCJmb2N1c1wiKTtcbiAgICAgICAgdGhpcy5sb2NrLmFjdGl2ZSA9IHtcbiAgICAgICAgICBuYW1lOiBcIlx1NUMwRlx1NjFBOVwiLFxuICAgICAgICAgIHN0YXJ0ZWRBdDogYXQsXG4gICAgICAgICAgZW5kc0F0OiBhdCArIGFjdGlvbi5taW51dGVzICogNjAsXG4gICAgICAgICAgc3RyaWN0OiBhY3Rpb24uc3RyaWN0LFxuICAgICAgICB9O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJzYXZlVGFza1wiOiB7XG4gICAgICAgIGNvbnN0IGQgPSBhY3Rpb24udGFzaztcbiAgICAgICAgaWYgKGQuaWQgIT09IG51bGwgJiYgdGVhY2hpbmdUYXNrKHRoaXMsIGQuaWQpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXG4gICAgICAgICAgICBcIlx1NjU1OVx1NUI2Nlx1NUY4NVx1NTI5RVx1OTY4Rlx1OEJGRVx1N0EwQlx1NjIxNlx1NEY1Q1x1NEUxQVx1NUI4OVx1NjM5Mlx1NjZGNFx1NjVCMFx1RkYwQ1x1OEJGN1x1OEMwM1x1NjU3NFx1NUJGOVx1NUU5NFx1NjU1OVx1NUI2Nlx1NUI4OVx1NjM5MlwiLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhpc3RpbmdJbmRleCA9XG4gICAgICAgICAgZC5pZCAhPT0gbnVsbCA/IHRoaXMudGFza3MuZmluZEluZGV4KCh0KSA9PiB0LmlkID09PSBkLmlkKSA6IC0xO1xuICAgICAgICBpZiAoZC5pZCAhPT0gbnVsbCAmJiBleGlzdGluZ0luZGV4IDwgMCkge1xuICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NEVGQlx1NTJBMVx1NEUwRFx1NUI1OFx1NTcyOFx1RkYwQ1x1NTNFRlx1ODBGRFx1NURGMlx1N0VDRlx1ODhBQlx1NTIyMFx1OTY2NFwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvbGQgPSBleGlzdGluZ0luZGV4ID49IDAgPyB0aGlzLnRhc2tzW2V4aXN0aW5nSW5kZXhdISA6IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3QgdGFzazogVGFzayA9IHtcbiAgICAgICAgICByZWN1cnJpbmc6IG9sZD8uY29tcGxldGVkXG4gICAgICAgICAgICA/IG9sZC5yZWN1cnJpbmdcbiAgICAgICAgICAgIDogZC5yZXBlYXQgIT09IFwibm9uZVwiIHx8IGQuZHVlRGF0ZSA9PT0gbnVsbCxcbiAgICAgICAgICByZXBlYXQ6XG4gICAgICAgICAgICBkLmR1ZURhdGUgPT09IG51bGwgJiYgZC5yZXBlYXQgPT09IFwibm9uZVwiID8gXCJkYWlseVwiIDogZC5yZXBlYXQsXG4gICAgICAgICAgcmVwZWF0RGF5czogWy4uLmQucmVwZWF0RGF5c10sXG4gICAgICAgICAgbmV4dFRhc2tJZDogb2xkPy5uZXh0VGFza0lkID8/IG51bGwsXG4gICAgICAgICAgaWQ6IGQuaWQgPz8gaWQoKSxcbiAgICAgICAgICB0aXRsZTogZC50aXRsZS50cmltKCksXG4gICAgICAgICAgbm90ZXM6IGQubm90ZXMsXG4gICAgICAgICAgcHJvamVjdElkOiBkLnByb2plY3RJZCxcbiAgICAgICAgICBoYWJpdElkOiBvbGQ/LmhhYml0SWQgPz8gbnVsbCxcbiAgICAgICAgICByZW1pbmRlckZpcmVkOlxuICAgICAgICAgICAgb2xkICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIG9sZC5kdWVEYXRlID09PSBkLmR1ZURhdGUgJiZcbiAgICAgICAgICAgIG9sZC5yZW1pbmRlclRpbWUgPT09IGQucmVtaW5kZXJUaW1lICYmXG4gICAgICAgICAgICBvbGQucmVtaW5kZXJGaXJlZCxcbiAgICAgICAgICByZW1pbmRlclBlbmRpbmc6XG4gICAgICAgICAgICBvbGQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgb2xkLmR1ZURhdGUgPT09IGQuZHVlRGF0ZSAmJlxuICAgICAgICAgICAgb2xkLnJlbWluZGVyVGltZSA9PT0gZC5yZW1pbmRlclRpbWUgJiZcbiAgICAgICAgICAgIG9sZC5yZW1pbmRlclBlbmRpbmcsXG4gICAgICAgICAgcmVtaW5kZXJFeHBpcmVkOlxuICAgICAgICAgICAgb2xkICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIG9sZC5kdWVEYXRlID09PSBkLmR1ZURhdGUgJiZcbiAgICAgICAgICAgIG9sZC5yZW1pbmRlclRpbWUgPT09IGQucmVtaW5kZXJUaW1lICYmXG4gICAgICAgICAgICBvbGQuZXhwaXJ5RGF5cyA9PT0gZC5leHBpcnlEYXlzICYmXG4gICAgICAgICAgICBvbGQucmVtaW5kZXJFeHBpcmVkLFxuICAgICAgICAgIHNjcmFwTWludXRlczogZC5zY3JhcE1pbnV0ZXMsXG4gICAgICAgICAgZXhwaXJ5RGF5czogZC5leHBpcnlEYXlzLFxuICAgICAgICAgIGZvY3VzTWludXRlczogZC5mb2N1c01pbnV0ZXMsXG4gICAgICAgICAgcmVtaW5kZXJUaW1lOiBkLnJlbWluZGVyVGltZSxcbiAgICAgICAgICBkdWVEYXRlOiBkLmR1ZURhdGUsXG4gICAgICAgICAgcHJpb3JpdHk6IGQucHJpb3JpdHksXG4gICAgICAgICAgZXN0aW1hdGU6IGQuZXN0aW1hdGUsXG4gICAgICAgICAgY29tcGxldGVkOiBvbGQ/LmNvbXBsZXRlZCA/PyBmYWxzZSxcbiAgICAgICAgICBjb21wbGV0ZWRBdDogb2xkPy5jb21wbGV0ZWRBdCA/PyBudWxsLFxuICAgICAgICAgIGNyZWF0ZWRBdDogb2xkPy5jcmVhdGVkQXQgPz8gYXQsXG4gICAgICAgICAgdGFnczogZC50YWdzLm1hcCgodCkgPT4gdC50cmltKCkpLmZpbHRlcigodCkgPT4gdC5sZW5ndGggPiAwKSxcbiAgICAgICAgICBzdWJ0YXNrczogZC5zdWJ0YXNrcy5tYXAoKHMpID0+ICh7XG4gICAgICAgICAgICBpZDogcy5pZCxcbiAgICAgICAgICAgIHRpdGxlOiBzLnRpdGxlLFxuICAgICAgICAgICAgZG9uZTogcy5kb25lLFxuICAgICAgICAgIH0pKSxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGV4aXN0aW5nSW5kZXggPj0gMCkge1xuICAgICAgICAgIHRoaXMudGFza3NbZXhpc3RpbmdJbmRleF0gPSB0YXNrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudGFza3MucHVzaCh0YXNrKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJ0b2dnbGVUYXNrXCI6IHtcbiAgICAgICAgY29uc3QgdGFza0lkID0gYWN0aW9uLmlkO1xuICAgICAgICBpZiAodGhpcy50YXNrcy5zb21lKCh0KSA9PiB0LmlkID09PSB0YXNrSWQgJiYgdGhpcy50YXNrSXNWb2lkKHQpKSkge1xuICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NEY1Q1x1NUU5Rlx1NUI5RVx1NEY4Qlx1NEUwRFx1ODBGRFx1NUI4Q1x1NjIxMFwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0YXNrID0gdGhpcy50YXNrcy5maW5kKCh0KSA9PiB0LmlkID09PSB0YXNrSWQpO1xuICAgICAgICBlbnN1cmUodGFzayAhPT0gdW5kZWZpbmVkLCBcIlx1NEVGQlx1NTJBMVx1NEUwRFx1NUI1OFx1NTcyOFwiKTtcbiAgICAgICAgY29uc3QgdGFza0NvcHk6IFRhc2sgPSB7XG4gICAgICAgICAgLi4udGFzayxcbiAgICAgICAgICB0YWdzOiBbLi4udGFzay50YWdzXSxcbiAgICAgICAgICBzdWJ0YXNrczogdGFzay5zdWJ0YXNrcy5tYXAoKHMpID0+ICh7IC4uLnMgfSkpLFxuICAgICAgICB9O1xuICAgICAgICBpZiAodGVhY2hpbmdUYXNrKHRoaXMsIHRhc2tJZCkgIT09IHVuZGVmaW5lZCAmJiAhdGFza0NvcHkuY29tcGxldGVkKSB7XG4gICAgICAgICAgY29tcGxldGVUZWFjaGluZ1Rhc2sodGhpcywgdGFza0lkLCBhdCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gXHU3RUQzXHU3Qjk3XHU1QkY5XHU2QkQ0XHU1MjREXHU1MTQ4XHU3RUQzXHU2RTA1XHU2NzJDXHU0RUZCXHU1MkExXHU4QkExXHU2NUY2XHVGRjBDXHU5MDdGXHU1MTREXHU5MUNEXHU1OTBEXHU3RDJGXHU4QkExXHUzMDAyXG4gICAgICAgIGlmICghdGFza0NvcHkuY29tcGxldGVkICYmIHRoaXMudGltZXIudGFza0lkID09PSB0YXNrSWQpIHtcbiAgICAgICAgICBjb25zdCBmb2N1c2luZyA9IHRoaXMudGltZXIubW9kZSA9PT0gXCJmb2N1c1wiO1xuICAgICAgICAgIGlmIChmb2N1c2luZykge1xuICAgICAgICAgICAgdGhpcy5yZWNvcmQoYXQsIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy50aW1lci50YXNrSWQgPSBudWxsO1xuICAgICAgICAgIGlmIChmb2N1c2luZykge1xuICAgICAgICAgICAgdGhpcy5yZXNldFRvKFwiZm9jdXNcIik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudGltZXIuYXV0b0ZvY3VzQmxvY2tlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2Vzc2lvbnMgPSB0aGlzLnNlc3Npb25zLmZpbHRlcihcbiAgICAgICAgICAocykgPT4gIShzLnNvdXJjZSA9PT0gXCJ0YXNrRXN0aW1hdGVcIiAmJiBzLnRhc2tJZCA9PT0gdGFza0lkKSxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKCF0YXNrQ29weS5jb21wbGV0ZWQpIHtcbiAgICAgICAgICBjb25zdCBhY3R1YWwgPSB0aGlzLnNlc3Npb25zXG4gICAgICAgICAgICAuZmlsdGVyKChzKSA9PiBzLnRhc2tJZCA9PT0gdGFza0lkKVxuICAgICAgICAgICAgLnJlZHVjZSgobiwgcykgPT4gbiArIHMuZHVyYXRpb25TZWNzLCAwKTtcbiAgICAgICAgICBjb25zdCBleHBlY3RlZCA9XG4gICAgICAgICAgICB0YXNrQ29weS5lc3RpbWF0ZSAqXG4gICAgICAgICAgICAodGFza0NvcHkuZm9jdXNNaW51dGVzID8/IHRoaXMuc2V0dGluZ3MuZm9jdXNNaW51dGVzKSAqXG4gICAgICAgICAgICA2MDtcbiAgICAgICAgICBjb25zdCBtaXNzaW5nID0gTWF0aC5tYXgoMCwgZXhwZWN0ZWQgLSBhY3R1YWwpO1xuICAgICAgICAgIGlmIChtaXNzaW5nID4gMCkge1xuICAgICAgICAgICAgY29uc3QgcHJvamVjdCA9XG4gICAgICAgICAgICAgIHRhc2tDb3B5LnByb2plY3RJZCAhPT0gbnVsbFxuICAgICAgICAgICAgICAgID8gdGhpcy5wcm9qZWN0cy5maW5kKChwKSA9PiBwLmlkID09PSB0YXNrQ29weS5wcm9qZWN0SWQpXG4gICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLnNlc3Npb25zLnB1c2goe1xuICAgICAgICAgICAgICBpZDogaWQoKSxcbiAgICAgICAgICAgICAgc291cmNlOiBcInRhc2tFc3RpbWF0ZVwiLFxuICAgICAgICAgICAgICB0YXNrSWQsXG4gICAgICAgICAgICAgIHRhc2tUaXRsZTogdGFza0NvcHkudGl0bGUsXG4gICAgICAgICAgICAgIHByb2plY3ROYW1lOiBwcm9qZWN0Py5uYW1lID8/IFwiXHU2NzJBXHU1MjA2XHU3QzdCXCIsXG4gICAgICAgICAgICAgIHN0YXJ0ZWRBdDogYXQsXG4gICAgICAgICAgICAgIGVuZGVkQXQ6IGF0LFxuICAgICAgICAgICAgICBkdXJhdGlvblNlY3M6IG1pc3NpbmcsXG4gICAgICAgICAgICAgIGNvbXBsZXRlZDogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdCA9IHRoaXMudGFza3MuZmluZCgoeCkgPT4geC5pZCA9PT0gdGFza0lkKSE7XG4gICAgICAgIHQuY29tcGxldGVkID0gIXQuY29tcGxldGVkO1xuICAgICAgICB0LmNvbXBsZXRlZEF0ID0gdC5jb21wbGV0ZWQgPyBhdCA6IG51bGw7XG4gICAgICAgIGlmICh0LmNvbXBsZXRlZCkge1xuICAgICAgICAgIHRoaXMuZWR1Y2F0aW9uLnRhc2tDb21wbGV0ZWQodCwgYXQpO1xuICAgICAgICAgIGNyZWF0ZU5leHRUYXNrKHRoaXMsIHQsIGF0KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJkZWxldGVUYXNrXCI6IHtcbiAgICAgICAgaWYgKHRlYWNoaW5nVGFzayh0aGlzLCBhY3Rpb24uaWQpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTY1NTlcdTVCNjZcdTVGODVcdTUyOUVcdTc1MzFcdTVCRjlcdTVFOTRcdThCRkVcdTdBMEJcdTYyMTZcdTRGNUNcdTRFMUFcdTdFRjRcdTYyQTRcdUZGMENcdTRFMERcdTgwRkRcdTUzNTVcdTcyRUNcdTUyMjBcdTk2NjRcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLnRhc2tzLnNvbWUoKHQpID0+IHQuaWQgPT09IGFjdGlvbi5pZCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTRFRkJcdTUyQTFcdTRFMERcdTVCNThcdTU3MjhcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMudGltZXIudGFza0lkID09PSBhY3Rpb24uaWQpIHtcbiAgICAgICAgICB0aGlzLnJlY29yZChhdCwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMucmVzZXRUbyh0aGlzLnRpbWVyLm1vZGUpO1xuICAgICAgICAgIHRoaXMudGltZXIudGFza0lkID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRhc2tzID0gdGhpcy50YXNrcy5maWx0ZXIoKHQpID0+IHQuaWQgIT09IGFjdGlvbi5pZCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInJlc3RvcmVUYXNrXCI6IHtcbiAgICAgICAgY29uc3QgdGFzayA9IGFjdGlvbi50YXNrO1xuICAgICAgICBpZiAodGhpcy50YXNrcy5zb21lKCh0KSA9PiB0LmlkID09PSB0YXNrLmlkKSkge1xuICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NEVGQlx1NTJBMVx1NURGMlx1N0VDRlx1NUI1OFx1NTcyOFwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXG4gICAgICAgICAgdGFzay5wcm9qZWN0SWQgIT09IG51bGwgJiZcbiAgICAgICAgICAhdGhpcy5wcm9qZWN0cy5zb21lKChwKSA9PiBwLmlkID09PSB0YXNrLnByb2plY3RJZClcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGFzay5wcm9qZWN0SWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcbiAgICAgICAgICB0YXNrLmhhYml0SWQgIT09IG51bGwgJiZcbiAgICAgICAgICAhdGhpcy5oYWJpdHMuc29tZSgoaCkgPT4gaC5pZCA9PT0gdGFzay5oYWJpdElkKVxuICAgICAgICApIHtcbiAgICAgICAgICAvLyBcdTU5MzFcdTUzQkJcdTVCQjlcdTU2NjhcdTUzRUFcdTc5RkJcdTk2NjRcdTdCQTFcdThGOTZcdUZGMUJcdTUxQkJcdTdFRDNcdTY3NjVcdTZFOTBcdTRFQ0RcdTU3MjhcdUZGMENcdTUzODZcdTUzRjJcdTUyMDZcdTdDN0JcdTRFMERcdTUzRDhcdTMwMDJcbiAgICAgICAgICB0YXNrLmhhYml0SWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGFza3MucHVzaCh0YXNrKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwidG9nZ2xlU3VidGFza1wiOiB7XG4gICAgICAgIGNvbnN0IHN1YiA9IHRoaXMudGFza3NcbiAgICAgICAgICAuZmluZCgodCkgPT4gdC5pZCA9PT0gYWN0aW9uLnRhc2tJZClcbiAgICAgICAgICA/LnN1YnRhc2tzLmZpbmQoKHMpID0+IHMuaWQgPT09IGFjdGlvbi5zdWJ0YXNrSWQpO1xuICAgICAgICBlbnN1cmUoc3ViICE9PSB1bmRlZmluZWQsIFwiXHU1QjUwXHU0RUZCXHU1MkExXHU0RTBEXHU1QjU4XHU1NzI4XCIpO1xuICAgICAgICBzdWIuZG9uZSA9ICFzdWIuZG9uZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwic2F2ZVByb2plY3RcIjoge1xuICAgICAgICBpZiAoYWN0aW9uLmlkICE9PSBudWxsKSB7XG4gICAgICAgICAgY29uc3QgcCA9IHRoaXMucHJvamVjdHMuZmluZCgoeCkgPT4geC5pZCA9PT0gYWN0aW9uLmlkKTtcbiAgICAgICAgICBlbnN1cmUocCAhPT0gdW5kZWZpbmVkLCBcIlx1OTg3OVx1NzZFRVx1NEUwRFx1NUI1OFx1NTcyOFwiKTtcbiAgICAgICAgICBwLm5hbWUgPSBhY3Rpb24ubmFtZS50cmltKCk7XG4gICAgICAgICAgcC5jb2xvciA9IGFjdGlvbi5jb2xvcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnN1cmUoXG4gICAgICAgICAgICBhY3Rpb24uZGlyZWN0b3J5ICE9PSBudWxsICYmIGlzQWJzb2x1dGVQYXRoKGFjdGlvbi5kaXJlY3RvcnkpLFxuICAgICAgICAgICAgXCJcdTY1QjBcdTk4NzlcdTc2RUVcdTVGQzVcdTk4N0JcdTdFRDFcdTVCOUFcdThENDRcdTY1OTlcdTc2RUVcdTVGNTVcdUZGMUJcdThCRjdcdTU3MjhcdTk4NzlcdTc2RUVcdTk4NzVcdTkwMDlcdTYyRTlcdTc2RUVcdTVGNTVcdTVFNzZcdTYzODhcdTY3NDNcIixcbiAgICAgICAgICApO1xuICAgICAgICAgIGNvbnN0IHByb2plY3RJZCA9IGlkKCk7XG4gICAgICAgICAgdGhpcy5lZHVjYXRpb24ucHJvamVjdHMucHVzaCh7XG4gICAgICAgICAgICBwcm9qZWN0SWQsXG4gICAgICAgICAgICBkaXJlY3Rvcnk6IGFjdGlvbi5kaXJlY3RvcnksXG4gICAgICAgICAgICBleGFtTW9kZTogZmFsc2UsXG4gICAgICAgICAgICB2aXNpb25JZDogbnVsbCxcbiAgICAgICAgICAgIHRhcmdldDogXCJcIixcbiAgICAgICAgICAgIGV4YW1EYXRlOiBudWxsLFxuICAgICAgICAgICAgc3lsbGFidXNJZDogbnVsbCxcbiAgICAgICAgICAgIHBhc3RQYXBlcklkczogW10sXG4gICAgICAgICAgICBtb2NrUGFwZXJJZHM6IFtdLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRoaXMucHJvamVjdHMucHVzaCh7XG4gICAgICAgICAgICBpZDogcHJvamVjdElkLFxuICAgICAgICAgICAgbmFtZTogYWN0aW9uLm5hbWUudHJpbSgpLFxuICAgICAgICAgICAgY29sb3I6IGFjdGlvbi5jb2xvcixcbiAgICAgICAgICAgIGFwcFdoaXRlbGlzdDogbnVsbCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJyZW5hbWVQcm9qZWN0RGlyZWN0b3J5XCI6IHtcbiAgICAgICAgY29uc3QgcHJvamVjdCA9IHRoaXMucHJvamVjdHMuZmluZCgoeCkgPT4geC5pZCA9PT0gYWN0aW9uLmlkKTtcbiAgICAgICAgZW5zdXJlKHByb2plY3QgIT09IHVuZGVmaW5lZCwgXCJcdTk4NzlcdTc2RUVcdTRFMERcdTVCNThcdTU3MjhcIik7XG4gICAgICAgIGNvbnN0IHByb2ZpbGUgPSB0aGlzLmVkdWNhdGlvbi5wcm9qZWN0cy5maW5kKFxuICAgICAgICAgIChwKSA9PiBwLnByb2plY3RJZCA9PT0gYWN0aW9uLmlkLFxuICAgICAgICApO1xuICAgICAgICBlbnN1cmUocHJvZmlsZSAhPT0gdW5kZWZpbmVkLCBcIlx1OTg3OVx1NzZFRVx1NkNBMVx1NjcwOVx1N0VEMVx1NUI5QVx1OEQ0NFx1NjU5OVx1NzZFRVx1NUY1NVwiKTtcbiAgICAgICAgZW5zdXJlKGlzQWJzb2x1dGVQYXRoKGFjdGlvbi5kaXJlY3RvcnkpLCBcIlx1OEQ0NFx1NjU5OVx1NzZFRVx1NUY1NVx1NUZDNVx1OTg3Qlx1NjYyRlx1N0VERFx1NUJGOVx1OERFRlx1NUY4NFwiKTtcbiAgICAgICAgcHJvamVjdC5uYW1lID0gYWN0aW9uLm5hbWUudHJpbSgpO1xuICAgICAgICBwcm9qZWN0LmNvbG9yID0gYWN0aW9uLmNvbG9yO1xuICAgICAgICBwcm9maWxlLmRpcmVjdG9yeSA9IGFjdGlvbi5kaXJlY3Rvcnk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInNldFByb2plY3RXaGl0ZWxpc3RcIjoge1xuICAgICAgICBjb25zdCBwID0gdGhpcy5wcm9qZWN0cy5maW5kKCh4KSA9PiB4LmlkID09PSBhY3Rpb24uaWQpO1xuICAgICAgICBlbnN1cmUocCAhPT0gdW5kZWZpbmVkLCBcIlx1OTg3OVx1NzZFRVx1NEUwRFx1NUI1OFx1NTcyOFwiKTtcbiAgICAgICAgcC5hcHBXaGl0ZWxpc3QgPVxuICAgICAgICAgIGFjdGlvbi53aGl0ZWxpc3QgPT09IG51bGwgPyBudWxsIDogWy4uLmFjdGlvbi53aGl0ZWxpc3RdO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJkZWxldGVQcm9qZWN0XCI6IHtcbiAgICAgICAgaWYgKHRoaXMuZWR1Y2F0aW9uLnNlbWVzdGVycy5zb21lKChzKSA9PiBzLnByb2plY3RJZCA9PT0gYWN0aW9uLmlkKSkge1xuICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcbiAgICAgICAgICAgIFwiXHU5ODc5XHU3NkVFXHU1REYyXHU2NzA5XHU2NTU5XHU1QjY2XHU1Mzg2XHU1M0YyXHVGRjBDXHU4QkY3XHU0RkREXHU3NTU5XHU4QkIwXHU1RjU1XHU1RTc2XHU1MDVDXHU3NTI4XHU1RTk0XHU4QkQ1XHU2QTIxXHU1RjBGXHVGRjFCXHU4RDQ0XHU2NTk5XHU3NkVFXHU1RjU1XHU0RTBEXHU0RjFBXHU4OEFCXHU1MjIwXHU5NjY0XCIsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVkdWNhdGlvbi5wcm9qZWN0cyA9IHRoaXMuZWR1Y2F0aW9uLnByb2plY3RzLmZpbHRlcihcbiAgICAgICAgICAocCkgPT4gcC5wcm9qZWN0SWQgIT09IGFjdGlvbi5pZCxcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5lZHVjYXRpb24ucmVzb3VyY2VzID0gdGhpcy5lZHVjYXRpb24ucmVzb3VyY2VzLmZpbHRlcihcbiAgICAgICAgICAocCkgPT4gcC5wcm9qZWN0SWQgIT09IGFjdGlvbi5pZCxcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5wcm9qZWN0cyA9IHRoaXMucHJvamVjdHMuZmlsdGVyKChwKSA9PiBwLmlkICE9PSBhY3Rpb24uaWQpO1xuICAgICAgICBmb3IgKGNvbnN0IHRhc2sgb2YgdGhpcy50YXNrcykge1xuICAgICAgICAgIGlmICh0YXNrLnByb2plY3RJZCA9PT0gYWN0aW9uLmlkKSB0YXNrLnByb2plY3RJZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy52aXNpb25zID0gdGhpcy52aXNpb25zLmZpbHRlcigoYSkgPT4gYS5wcm9qZWN0SWQgIT09IGFjdGlvbi5pZCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInJlb3JkZXJQcm9qZWN0c1wiOiB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBhY3Rpb24uaWRzLmxlbmd0aCAhPT0gdGhpcy5wcm9qZWN0cy5sZW5ndGggfHxcbiAgICAgICAgICAhYWN0aW9uLmlkcy5ldmVyeSgocGlkKSA9PiB0aGlzLnByb2plY3RzLnNvbWUoKHApID0+IHAuaWQgPT09IHBpZCkpXG4gICAgICAgICkge1xuICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OTg3OVx1NzZFRVx1NjM5Mlx1NUU4Rlx1NTIxN1x1ODg2OFx1NEUwRVx1NzNCMFx1NjcwOVx1OTg3OVx1NzZFRVx1NEUwRFx1NEUwMFx1ODFGNFwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnByb2plY3RzID0gYWN0aW9uLmlkcy5tYXAoKHBpZCkgPT5cbiAgICAgICAgICB0aGlzLnByb2plY3RzLmZpbmQoKHApID0+IHAuaWQgPT09IHBpZCkhLFxuICAgICAgICApO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJkZXRhY2hUYXNrc1wiOiB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBhY3Rpb24uaWRzLnNvbWUoKHRhc2tJZCkgPT4gdGVhY2hpbmdUYXNrKHRoaXMsIHRhc2tJZCkgIT09IHVuZGVmaW5lZClcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2NTU5XHU1QjY2XHU1Rjg1XHU1MjlFXHU5ODdCXHU0RkREXHU3NTU5XHU2NzY1XHU2RTkwXHU5ODc5XHU3NkVFXHVGRjBDXHU4QkY3XHU4QzAzXHU2NTc0XHU1QkY5XHU1RTk0XHU2NTU5XHU1QjY2XHU1Qjg5XHU2MzkyXCIpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgdCBvZiB0aGlzLnRhc2tzKSB7XG4gICAgICAgICAgaWYgKGFjdGlvbi5pZHMuaW5jbHVkZXModC5pZCkpIHtcbiAgICAgICAgICAgIGlmIChhY3Rpb24udGFyZ2V0ID09PSBcInByb2plY3RcIikgdC5wcm9qZWN0SWQgPSBudWxsO1xuICAgICAgICAgICAgZWxzZSB0LmhhYml0SWQgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJzYXZlSGFiaXRHcm91cFwiOiB7XG4gICAgICAgIGlmIChhY3Rpb24uaWQgIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zdCBoID0gdGhpcy5oYWJpdHMuZmluZCgoeCkgPT4geC5pZCA9PT0gYWN0aW9uLmlkKTtcbiAgICAgICAgICBlbnN1cmUoaCAhPT0gdW5kZWZpbmVkLCBcIlx1NEU2MFx1NjBFRlx1N0VDNFx1NEUwRFx1NUI1OFx1NTcyOFwiKTtcbiAgICAgICAgICBoLm5hbWUgPSBhY3Rpb24ubmFtZS50cmltKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5oYWJpdHMucHVzaCh7IGlkOiBpZCgpLCBuYW1lOiBhY3Rpb24ubmFtZS50cmltKCkgfSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwic2F2ZUhhYml0XCI6IHtcbiAgICAgICAgY29uc3QgaGlkID0gYWN0aW9uLmlkID8/IGlkKCk7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5oYWJpdHMuZmluZCgoaCkgPT4gaC5pZCA9PT0gaGlkKTtcbiAgICAgICAgaWYgKGV4aXN0aW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBleGlzdGluZy5uYW1lID0gYWN0aW9uLm5hbWUudHJpbSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuaGFiaXRzLnB1c2goeyBpZDogaGlkLCBuYW1lOiBhY3Rpb24ubmFtZS50cmltKCkgfSk7XG4gICAgICAgIH1cbiAgICAgICAgc2F2ZUhhYml0VGFza3ModGhpcywgaGlkLCBhY3Rpb24sIGF0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwiZGVsZXRlSGFiaXRcIjoge1xuICAgICAgICB0aGlzLmhhYml0cyA9IHRoaXMuaGFiaXRzLmZpbHRlcigoaCkgPT4gaC5pZCAhPT0gYWN0aW9uLmlkKTtcbiAgICAgICAgZm9yIChjb25zdCB0YXNrIG9mIHRoaXMudGFza3MpIHtcbiAgICAgICAgICBpZiAodGFzay5oYWJpdElkID09PSBhY3Rpb24uaWQpIHtcbiAgICAgICAgICAgIHRhc2suaGFiaXRJZCA9IG51bGw7XG4gICAgICAgICAgICB0YXNrLnJlcGVhdCA9IFwibm9uZVwiO1xuICAgICAgICAgICAgdGFzay5yZXBlYXREYXlzID0gW107XG4gICAgICAgICAgICBpZiAodGFzay5kdWVEYXRlID09PSBudWxsKSB0YXNrLmR1ZURhdGUgPSBkYXRlQXQoYXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJzYXZlVmlzaW9uXCI6IHtcbiAgICAgICAgaWYgKGFjdGlvbi5pZCAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IGEgPSB0aGlzLnZpc2lvbnMuZmluZCgoeCkgPT4geC5pZCA9PT0gYWN0aW9uLmlkKTtcbiAgICAgICAgICBlbnN1cmUoYSAhPT0gdW5kZWZpbmVkLCBcIlx1NjEzRlx1NjY2Rlx1NEUwRFx1NUI1OFx1NTcyOFwiKTtcbiAgICAgICAgICBhLm5hbWUgPSBhY3Rpb24ubmFtZS50cmltKCk7XG4gICAgICAgICAgYS5ub3RlcyA9IGFjdGlvbi5ub3RlcztcbiAgICAgICAgICBhLnByb2plY3RJZCA9IGFjdGlvbi5wcm9qZWN0SWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy52aXNpb25zLnB1c2goe1xuICAgICAgICAgICAgaWQ6IGlkKCksXG4gICAgICAgICAgICBuYW1lOiBhY3Rpb24ubmFtZS50cmltKCksXG4gICAgICAgICAgICBub3RlczogYWN0aW9uLm5vdGVzLFxuICAgICAgICAgICAgcHJvamVjdElkOiBhY3Rpb24ucHJvamVjdElkLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcImRlbGV0ZVZpc2lvblwiOlxuICAgICAgICB0aGlzLnZpc2lvbnMgPSB0aGlzLnZpc2lvbnMuZmlsdGVyKChhKSA9PiBhLmlkICE9PSBhY3Rpb24uaWQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJzYXZlQmxvY2tcIjoge1xuICAgICAgICBjb25zdCBibG9jazogQmxvY2sgPSB7XG4gICAgICAgICAgaWQ6IGFjdGlvbi5pZCA/PyBpZCgpLFxuICAgICAgICAgIHRpdGxlOiBhY3Rpb24udGl0bGUudHJpbSgpLFxuICAgICAgICAgIGRheXM6IFsuLi5hY3Rpb24uZGF5c10sXG4gICAgICAgICAgc3RhcnQ6IGFjdGlvbi5zdGFydCxcbiAgICAgICAgICBlbmQ6IGFjdGlvbi5lbmQsXG4gICAgICAgICAgYXR0ZW50aW9uOiBhY3Rpb24uYXR0ZW50aW9uLFxuICAgICAgICAgIG5vdGVzOiBhY3Rpb24ubm90ZXMsXG4gICAgICAgIH07XG4gICAgICAgIC8vIFx1NTE0OFx1NjgyMVx1OUE4Q1x1RkYwQ1x1NTc0Rlx1N0YxNlx1OEY5MVx1NjJBNVx1ODFFQVx1NURGMVx1NzY4NFx1NTM5Rlx1NTZFMFx1ODAwQ1x1NEUwRFx1NjYyRlx1N0IzQ1x1N0VERlx1NzY4NFx1NTE2OFx1OTFDRlx1NTkzMVx1OEQyNVx1MzAwMlxuICAgICAgICB2YWxpZGF0ZUJsb2NrKGJsb2NrKTtcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmJsb2Nrcy5maW5kSW5kZXgoKGIpID0+IGIuaWQgPT09IGJsb2NrLmlkKTtcbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICB0aGlzLmJsb2Nrc1tpbmRleF0gPSBibG9jaztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmJsb2Nrcy5wdXNoKGJsb2NrKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJkZWxldGVCbG9ja1wiOlxuICAgICAgICB0aGlzLmJsb2NrcyA9IHRoaXMuYmxvY2tzLmZpbHRlcigoYikgPT4gYi5pZCAhPT0gYWN0aW9uLmlkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwic2VsZWN0VGFza1wiOiB7XG4gICAgICAgIGlmICh0aGlzLnRhc2tzLnNvbWUoKHQpID0+IHQuaWQgPT09IGFjdGlvbi5pZCAmJiB0aGlzLnRhc2tJc1ZvaWQodCkpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU0RjVDXHU1RTlGXHU1QjlFXHU0RjhCXHU0RTBEXHU4MEZEXHU0RTEzXHU2Q0U4XCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcbiAgICAgICAgICBhY3Rpb24uaWQgIT09IG51bGwgJiZcbiAgICAgICAgICAhdGhpcy50YXNrcy5zb21lKCh0KSA9PiB0LmlkID09PSBhY3Rpb24uaWQgJiYgIXQuY29tcGxldGVkKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdThCRjdcdTkwMDlcdTYyRTlcdTRFMDBcdTRFMkFcdTY3MkFcdTVCOENcdTYyMTBcdTc2ODRcdTRFRkJcdTUyQTFcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFxuICAgICAgICAgIHRoaXMudGltZXIucnVubmluZyB8fFxuICAgICAgICAgIHRpbWVyUmVtYWluaW5nKHRoaXMudGltZXIsIGF0KSA8IHRoaXMudGltZXIuZHVyYXRpb25TZWNzXG4gICAgICAgICkge1xuICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1OEJGN1x1NTE0OFx1N0VEM1x1Njc1Rlx1NUY1M1x1NTI0RFx1OEJBMVx1NjVGNlx1RkYwQ1x1NTE4RFx1NTIwN1x1NjM2Mlx1NEUxM1x1NkNFOFx1NEVGQlx1NTJBMVwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRpbWVyLnRhc2tJZCA9IGFjdGlvbi5pZDtcbiAgICAgICAgdGhpcy5yZXNldFRvKHRoaXMudGltZXIubW9kZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInN0YXJ0VGltZXJcIjoge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgdGhpcy50YXNrcy5zb21lKFxuICAgICAgICAgICAgKHQpID0+IHQuaWQgPT09IHRoaXMudGltZXIudGFza0lkICYmIHRoaXMudGFza0lzVm9pZCh0KSxcbiAgICAgICAgICApXG4gICAgICAgICkge1xuICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NEY1Q1x1NUU5Rlx1NUI5RVx1NEY4Qlx1NEUwRFx1ODBGRFx1NUYwMFx1NTlDQlx1NEUxM1x1NkNFOFwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvdmVycmlkZSA9XG4gICAgICAgICAgYWN0aW9uLm1pbnV0ZXMgIT09IHVuZGVmaW5lZCAmJiBhY3Rpb24ubWludXRlcyAhPT0gbnVsbFxuICAgICAgICAgICAgPyBhY3Rpb24ubWludXRlc1xuICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICBpZiAob3ZlcnJpZGUgIT09IG51bGwpIHtcbiAgICAgICAgICAvLyBcdTUzNTVcdTZCMjFcdTY1RjZcdTk1N0ZcdTg5ODZcdTc2RDZcdUZGMUFcdTdGNTFcdTk4NzUvXHU2NUU3IHJ1bnRpbWUgXHU1MTQxXHU4QkI4XHU0RTM0XHU2NUY2XHU2MzA3XHU1QjlBXHU2NzJDXHU4RjZFXHU1MjA2XHU5NDlGXHU2NTcwXHVGRjBDXHU0RTBEXHU1MTk5XHU1NkRFXHU0RUZCXHU1MkExXHU2MjE2XG4gICAgICAgICAgLy8gXHU1MTY4XHU1QzQwXHU4QkJFXHU3RjZFXHVGRjFCXHU1M0VBXHU2NzA5XHU1QzFBXHU2NzJBXHU1RjAwXHU1OUNCXHU3Njg0XHU0RTEzXHU2Q0U4XHU2QkI1XHU1M0VGXHU4OTg2XHU3NkQ2XHUzMDAyXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy50aW1lci5tb2RlICE9PSBcImZvY3VzXCIgfHxcbiAgICAgICAgICAgIHRoaXMudGltZXIucnVubmluZyB8fFxuICAgICAgICAgICAgdGhpcy50aW1lci5zdGFydGVkQXQgIT09IG51bGxcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NTNFQVx1NjcwOVx1NUMxQVx1NjcyQVx1NUYwMFx1NTlDQlx1NzY4NFx1NEUxM1x1NkNFOFx1NTNFRlx1NEVFNVx1NjMwN1x1NUI5QVx1NTM1NVx1NkIyMVx1NjVGNlx1OTU3RlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKG92ZXJyaWRlKSB8fCBvdmVycmlkZSA8IDEgfHwgb3ZlcnJpZGUgPiAxODApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NTM1NVx1NkIyMVx1NjVGNlx1OTU3Rlx1OTcwMFx1NEUzQTFcdTIwMTQxODBcdTUyMDZcdTk0OUZcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0YXJ0VGVhY2hpbmdUYXNrKHRoaXMsIGF0KTtcbiAgICAgICAgdGhpcy5zdGFydChhdCk7XG4gICAgICAgIGlmIChvdmVycmlkZSAhPT0gbnVsbCkge1xuICAgICAgICAgIC8vIHN0YXJ0KCkgXHU0RjFBXHU2MzA5XHU1MTY4XHU1QzQwXHU4QkJFXHU3RjZFXHU5MUNEXHU3Qjk3XHU2QkI1XHU5NTdGXHVGRjBDXHU4OTg2XHU3NkQ2XHU1RkM1XHU5ODdCXHU2NTNFXHU1NzI4XHU1QjgzXHU0RTRCXHU1NDBFXHUzMDAyXG4gICAgICAgICAgdGhpcy50aW1lci5kdXJhdGlvblNlY3MgPSBvdmVycmlkZSAqIDYwO1xuICAgICAgICAgIHRoaXMudGltZXIucmVtYWluaW5nU2VjcyA9IG92ZXJyaWRlICogNjA7XG4gICAgICAgICAgdGhpcy50aW1lci5kZWFkbGluZSA9IGF0ICsgb3ZlcnJpZGUgKiA2MDtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJwYXVzZVRpbWVyXCI6IHtcbiAgICAgICAgdGhpcy50aW1lci5yZW1haW5pbmdTZWNzID0gdGltZXJSZW1haW5pbmcodGhpcy50aW1lciwgYXQpO1xuICAgICAgICB0aGlzLnRpbWVyLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aW1lci5kZWFkbGluZSA9IG51bGw7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInJlc2V0VGltZXJcIjoge1xuICAgICAgICB0aGlzLnJlY29yZChhdCwgZmFsc2UpO1xuICAgICAgICB0aGlzLnJlc2V0VG8odGhpcy50aW1lci5tb2RlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwic2tpcFRpbWVyXCI6IHtcbiAgICAgICAgdGhpcy5yZWNvcmQoYXQsIGZhbHNlKTtcbiAgICAgICAgY29uc3QgbmV4dDogTW9kZSA9IHRoaXMudGltZXIubW9kZSA9PT0gXCJmb2N1c1wiID8gXCJzaG9ydEJyZWFrXCIgOiBcImZvY3VzXCI7XG4gICAgICAgIHRoaXMucmVzZXRUbyhuZXh0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwic2V0TW9kZVwiOiB7XG4gICAgICAgIGlmIChhY3Rpb24ubW9kZSAhPT0gdGhpcy50aW1lci5tb2RlKSB7XG4gICAgICAgICAgdGhpcy5yZWNvcmQoYXQsIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLnJlc2V0VG8oYWN0aW9uLm1vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcInNhdmVTZXR0aW5nc1wiOiB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBhY3Rpb24uc2V0dGluZ3M7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAhdGhpcy50aW1lci5ydW5uaW5nICYmXG4gICAgICAgICAgdGhpcy50aW1lci5yZW1haW5pbmdTZWNzID09PSB0aGlzLnRpbWVyLmR1cmF0aW9uU2Vjc1xuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLnJlc2V0VG8odGhpcy50aW1lci5tb2RlKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJpbXBvcnRQbGFuXCI6XG4gICAgICAgIG1lcmdlUGxhbihhY3Rpb24ucGxhbiwgdGhpcywgYXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJpbXBvcnRcIjoge1xuICAgICAgICBhY3Rpb24uZGF0YS52YWxpZGF0ZSgpO1xuICAgICAgICBjb25zdCBkYXRhID0gY2xvbmUoYWN0aW9uLmRhdGEpO1xuICAgICAgICAvLyBcdTYwNjJcdTU5MERcdTY1ODdcdTRFRjZcdTRFMERcdTVGOTdcdTYwODRcdTYwODRcdTZCNjZcdTg4QzVcdTVCOUFcdTY1RjZcdTk1MDFcdTY3M0FcdTMwMDJcbiAgICAgICAgZGF0YS5sb2NrLmFjdGl2ZSA9IG51bGw7XG4gICAgICAgIGRhdGEubG9jay5zdXBwcmVzc2VkVW50aWwgPSAwO1xuICAgICAgICBkYXRhLnNldHRpbmdzLmF1dG9TdGFydFRhc2tzID0gZmFsc2U7XG4gICAgICAgIGZvciAoY29uc3Qgc2NoZWR1bGUgb2YgZGF0YS5sb2NrLnNjaGVkdWxlcykge1xuICAgICAgICAgIHNjaGVkdWxlLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBcdTU5MDdcdTRFRkRcdTY2MkZcdTY1NzBcdTYzNkVcdUZGMENcdTRFMERcdTY2MkZcdTYzODhcdTY3NDNcdTkxQ0RcdTVGMDBcdTY1RTdcdTY1RjZcdTk0OUZcdTMwMDJcbiAgICAgICAgZGF0YS50aW1lci5yZW1haW5pbmdTZWNzID0gTWF0aC5tYXgoMSwgdGltZXJSZW1haW5pbmcoZGF0YS50aW1lciwgYXQpKTtcbiAgICAgICAgZGF0YS50aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIGRhdGEudGltZXIuZGVhZGxpbmUgPSBudWxsO1xuICAgICAgICBkYXRhLnRpbWVyLmNvbXBsZXRpb25TZXJpYWwgPSB0aGlzLnRpbWVyLmNvbXBsZXRpb25TZXJpYWw7XG4gICAgICAgIHJlcGxhY2VBcHBEYXRhKHRoaXMsIGRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJsb2FkRXhhbXBsZVwiOiB7XG4gICAgICAgIGlmICh0aGlzLnRhc2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTUzRUFcdTY3MDlcdTdBN0FcdTRFRkJcdTUyQTFcdTUyMTdcdTg4NjhcdTUzRUZcdTRFRTVcdThGN0RcdTUxNjVcdTc5M0FcdTRGOEJcIik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdG9kYXkgPSBkYXRlQXQoYXQpO1xuICAgICAgICBjb25zdCBleGFtcGxlczogW3N0cmluZywgc3RyaW5nLCBudW1iZXIsIG51bWJlcl1bXSA9IFtcbiAgICAgICAgICBbXG4gICAgICAgICAgICBcIlx1NjhCM1x1NzQwNlx1NjcyQ1x1NTQ2OFx1NzY4NFx1NURFNVx1NEY1Q1x1OEJBMVx1NTIxMlwiLFxuICAgICAgICAgICAgXCJcdTYyOEFcdTU5MjdcdTc2RUVcdTY4MDdcdTYyQzZcdTYyMTBcdTVDMEZcdTZCNjVcdTlBQTRcdUZGMENcdThCQTlcdTZCQ0ZcdTRFMDBcdTU5MjlcdTkwRkRcdTY2RjRcdTRFQ0VcdTVCQjlcdTMwMDJcIixcbiAgICAgICAgICAgIDMsXG4gICAgICAgICAgICAyLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgW1xuICAgICAgICAgICAgXCJcdThCRkJcdTVCOENcdTZCNjNcdTU3MjhcdTc3MEJcdTc2ODRcdTkwQTNcdTRFMDBcdTdBRTBcIixcbiAgICAgICAgICAgIFwiXHU1MTczXHU2Mzg5XHU2RDg4XHU2MDZGXHU2M0QwXHU5MTkyXHVGRjBDXHU3RUQ5XHU5NjA1XHU4QkZCXHU3NTU5XHU0RTAwXHU2QkI1XHU1QjhDXHU2NTc0XHU3Njg0XHU2NUY2XHU5NUY0XHUzMDAyXCIsXG4gICAgICAgICAgICAyLFxuICAgICAgICAgICAgMSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIFtcIlx1NjU3NFx1NzQwNlx1Njg0Q1x1OTc2Mlx1RkYwQ1x1NjU3NFx1NzQwNlx1NjAxRFx1N0VFQVwiLCBcIlx1NEUwMFx1NEUyQVx1ODIxMlx1NjcwRFx1NzY4NFx1NzNBRlx1NTg4M1x1RkYwQ1x1NjYyRlx1NEUxM1x1NkNFOFx1NzY4NFx1NUYwMFx1NTlDQlx1MzAwMlwiLCAxLCAxXSxcbiAgICAgICAgXTtcbiAgICAgICAgZXhhbXBsZXMuZm9yRWFjaCgoW3RpdGxlLCBub3RlcywgcHJpb3JpdHksIGVzdGltYXRlXSwgaW5kZXgpID0+IHtcbiAgICAgICAgICB0aGlzLnRhc2tzLnB1c2goe1xuICAgICAgICAgICAgaWQ6IGlkKCksXG4gICAgICAgICAgICByZWN1cnJpbmc6IGZhbHNlLFxuICAgICAgICAgICAgcmVwZWF0OiBcIm5vbmVcIixcbiAgICAgICAgICAgIHJlcGVhdERheXM6IFtdLFxuICAgICAgICAgICAgbmV4dFRhc2tJZDogbnVsbCxcbiAgICAgICAgICAgIHRpdGxlLFxuICAgICAgICAgICAgbm90ZXMsXG4gICAgICAgICAgICBwcm9qZWN0SWQ6IHRoaXMucHJvamVjdHNbaW5kZXhdPy5pZCA/PyBudWxsLFxuICAgICAgICAgICAgaGFiaXRJZDogbnVsbCxcbiAgICAgICAgICAgIGR1ZURhdGU6IHRvZGF5LFxuICAgICAgICAgICAgcmVtaW5kZXJUaW1lOiBudWxsLFxuICAgICAgICAgICAgZm9jdXNNaW51dGVzOiBudWxsLFxuICAgICAgICAgICAgcmVtaW5kZXJGaXJlZDogZmFsc2UsXG4gICAgICAgICAgICByZW1pbmRlclBlbmRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgcmVtaW5kZXJFeHBpcmVkOiBmYWxzZSxcbiAgICAgICAgICAgIHNjcmFwTWludXRlczogMCxcbiAgICAgICAgICAgIGV4cGlyeURheXM6IDAsXG4gICAgICAgICAgICBwcmlvcml0eSxcbiAgICAgICAgICAgIGVzdGltYXRlLFxuICAgICAgICAgICAgY29tcGxldGVkOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbXBsZXRlZEF0OiBudWxsLFxuICAgICAgICAgICAgY3JlYXRlZEF0OiBhdCArIGluZGV4LFxuICAgICAgICAgICAgdGFnczogW1wiXHU3OTNBXHU0RjhCXCJdLFxuICAgICAgICAgICAgc3VidGFza3M6IFtdLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIG1hdGVyaWFsaXplVGVhY2hpbmdUYXNrcyh0aGlzLCBhdCk7XG4gICAgdGhpcy52YWxpZGF0ZSgpO1xuICB9XG5cbiAgdmFsaWRhdGUoKTogdm9pZCB7XG4gICAgdGhpcy5lZHVjYXRpb25WYWxpZGF0ZSgpO1xuICAgIHZhbGlkYXRlVGVhY2hpbmdUYXNrcyh0aGlzKTtcbiAgICB2YWxpZGF0ZUxvY2sodGhpcy5sb2NrKTtcbiAgICB2YWxpZGF0ZUlkZW50aXRpZXModGhpcyk7XG4gICAgdmFsaWRhdGVCbG9ja3ModGhpcy5ibG9ja3MpO1xuICAgIGVuc3VyZSh0aGlzLnZlcnNpb24gPT09IDUsIFwiXHU0RTBEXHU2NTJGXHU2MzAxXHU2QjY0XHU2NTcwXHU2MzZFXHU3MjQ4XHU2NzJDXCIpO1xuICAgIGVuc3VyZShcbiAgICAgIHRoaXMudGFza3MubGVuZ3RoIDw9IDUwMDAwICYmXG4gICAgICAgIHRoaXMuc2Vzc2lvbnMubGVuZ3RoIDw9IDIwMDAwMCAmJlxuICAgICAgICB0aGlzLnByb2plY3RzLmxlbmd0aCA8PSA1MDAsXG4gICAgICBcIlx1NjU3MFx1NjM2RVx1OEQ4NVx1NTFGQVx1NjU3MFx1OTFDRlx1OTY1MFx1NTIzNlwiLFxuICAgICk7XG4gICAgY29uc3QgcyA9IHRoaXMuc2V0dGluZ3M7XG4gICAgZW5zdXJlKHMuc291bmRWb2x1bWUgPD0gMTAwLCBcIlx1OTdGM1x1NjU0OFx1OTdGM1x1OTFDRlx1OTcwMFx1NEUzQSAwXHUyMDEzMTAwXCIpO1xuICAgIGVuc3VyZShcbiAgICAgIHMuZm9jdXNNaW51dGVzID49IDEgJiZcbiAgICAgICAgcy5mb2N1c01pbnV0ZXMgPD0gMTgwICYmXG4gICAgICAgIHMuc2hvcnRCcmVha01pbnV0ZXMgPj0gMSAmJlxuICAgICAgICBzLnNob3J0QnJlYWtNaW51dGVzIDw9IDYwICYmXG4gICAgICAgIHMubG9uZ0JyZWFrTWludXRlcyA+PSAxICYmXG4gICAgICAgIHMubG9uZ0JyZWFrTWludXRlcyA8PSAxMjAgJiZcbiAgICAgICAgcy5sb25nQnJlYWtFdmVyeSA+PSAyICYmXG4gICAgICAgIHMubG9uZ0JyZWFrRXZlcnkgPD0gMTIgJiZcbiAgICAgICAgcy5kYWlseUdvYWwgPj0gMSAmJlxuICAgICAgICBzLmRhaWx5R29hbCA8PSAzMCxcbiAgICAgIFwiXHU4QkExXHU2NUY2XHU4QkJFXHU3RjZFXHU4RDg1XHU1MUZBXHU1MTQxXHU4QkI4XHU4MzAzXHU1NkY0XCIsXG4gICAgKTtcbiAgICBlbnN1cmUoW1wibGlnaHRcIiwgXCJkYXJrXCIsIFwic3lzdGVtXCJdLmluY2x1ZGVzKHMudGhlbWUpLCBcIlx1NjVFMFx1NjU0OFx1NzY4NFx1NEUzQlx1OTg5OFwiKTtcbiAgICBlbnN1cmUodmFsaWRBcHBJZHMocy5wcm90ZWN0aW9uLndoaXRlbGlzdCksIFwiXHU2NUUwXHU2NTQ4XHU3Njg0XHU1RTk0XHU3NTI4XHU3NjdEXHU1NDBEXHU1MzU1XCIpO1xuICAgIGNvbnN0IHByb2plY3RJZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBmb3IgKGNvbnN0IHAgb2YgdGhpcy5wcm9qZWN0cykge1xuICAgICAgZW5zdXJlKHAuaWQubGVuZ3RoID4gMCAmJiAhcHJvamVjdElkcy5oYXMocC5pZCksIFwiXHU5ODc5XHU3NkVFIElEIFx1OTFDRFx1NTkwRFx1NjIxNlx1NEUzQVx1N0E3QVwiKTtcbiAgICAgIHByb2plY3RJZHMuYWRkKHAuaWQpO1xuICAgICAgZW5zdXJlKFxuICAgICAgICBwLm5hbWUudHJpbSgpLmxlbmd0aCA+IDAgJiYgY2hhckNvdW50KHAubmFtZSkgPD0gNDAsXG4gICAgICAgIFwiXHU5ODc5XHU3NkVFXHU1NDBEXHU3OUYwXHU5NzAwXHU0RTNBIDFcdTIwMTM0MCBcdTRFMkFcdTVCNTdcdTdCMjZcIixcbiAgICAgICk7XG4gICAgICBlbnN1cmUoXG4gICAgICAgIHAuY29sb3IubGVuZ3RoID09PSA3ICYmXG4gICAgICAgICAgcC5jb2xvci5zdGFydHNXaXRoKFwiI1wiKSAmJlxuICAgICAgICAgIC9eWzAtOWEtZkEtRl17Nn0kLy50ZXN0KHAuY29sb3Iuc2xpY2UoMSkpLFxuICAgICAgICBcIlx1NjVFMFx1NjU0OFx1NzY4NFx1OTg3OVx1NzZFRVx1OTg5Q1x1ODI3MlwiLFxuICAgICAgKTtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgcC5hcHBXaGl0ZWxpc3QgPT09IG51bGwgfHwgdmFsaWRBcHBJZHMocC5hcHBXaGl0ZWxpc3QpLFxuICAgICAgICBcIlx1NjVFMFx1NjU0OFx1NzY4NFx1OTg3OVx1NzZFRVx1NUU5NFx1NzUyOFx1NzY3RFx1NTQwRFx1NTM1NVwiLFxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgaGFiaXRJZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBlbnN1cmUodGhpcy5oYWJpdHMubGVuZ3RoIDw9IDUwMCwgXCJcdTRFNjBcdTYwRUZcdTY1NzBcdTkxQ0ZcdThEODVcdTUxRkFcdTk2NTBcdTUyMzZcIik7XG4gICAgZm9yIChjb25zdCBoIG9mIHRoaXMuaGFiaXRzKSB7XG4gICAgICBlbnN1cmUoaC5pZC5sZW5ndGggPiAwICYmICFoYWJpdElkcy5oYXMoaC5pZCksIFwiXHU0RTYwXHU2MEVGIElEIFx1OTFDRFx1NTkwRFx1NjIxNlx1NEUzQVx1N0E3QVwiKTtcbiAgICAgIGhhYml0SWRzLmFkZChoLmlkKTtcbiAgICAgIHZhbGlkYXRlSGFiaXQoaCk7XG4gICAgfVxuICAgIGNvbnN0IHZpc2lvbklkcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGVuc3VyZSh0aGlzLnZpc2lvbnMubGVuZ3RoIDw9IDUwMCwgXCJcdTYxM0ZcdTY2NkZcdTY1NzBcdTkxQ0ZcdThEODVcdTUxRkFcdTk2NTBcdTUyMzZcIik7XG4gICAgZm9yIChjb25zdCBhIG9mIHRoaXMudmlzaW9ucykge1xuICAgICAgZW5zdXJlKGEuaWQubGVuZ3RoID4gMCAmJiAhdmlzaW9uSWRzLmhhcyhhLmlkKSwgXCJcdTYxM0ZcdTY2NkYgSUQgXHU5MUNEXHU1OTBEXHU2MjE2XHU0RTNBXHU3QTdBXCIpO1xuICAgICAgdmlzaW9uSWRzLmFkZChhLmlkKTtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgYS5uYW1lLnRyaW0oKS5sZW5ndGggPiAwICYmIGNoYXJDb3VudChhLm5hbWUpIDw9IDQwLFxuICAgICAgICBcIlx1NjEzRlx1NjY2Rlx1NTQwRFx1NzlGMFx1OTcwMFx1NEUzQSAxXHUyMDEzNDAgXHU0RTJBXHU1QjU3XHU3QjI2XCIsXG4gICAgICApO1xuICAgICAgZW5zdXJlKHV0ZjhMZW4oYS5ub3RlcykgPD0gNTAwMDAsIFwiXHU2MTNGXHU2NjZGXHU1MTg1XHU1QkI5XHU4RkM3XHU5NTdGXCIpO1xuICAgICAgZW5zdXJlKFxuICAgICAgICBhLnByb2plY3RJZCA9PT0gbnVsbCB8fCBwcm9qZWN0SWRzLmhhcyhhLnByb2plY3RJZCksXG4gICAgICAgIFwiXHU2MTNGXHU2NjZGXHU1RjE1XHU3NTI4XHU0RTg2XHU0RTBEXHU1QjU4XHU1NzI4XHU3Njg0XHU5ODc5XHU3NkVFXCIsXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCB0YXNrSWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgZm9yIChjb25zdCB0IG9mIHRoaXMudGFza3MpIHtcbiAgICAgIHRoaXMudmFsaWRhdGVSZW1pbmRlclRhc2sodCk7XG4gICAgICB2YWxpZGF0ZVJlcGVhdCh0KTtcbiAgICAgIGVuc3VyZSh0LmlkLmxlbmd0aCA+IDAgJiYgIXRhc2tJZHMuaGFzKHQuaWQpLCBcIlx1NEVGQlx1NTJBMSBJRCBcdTkxQ0RcdTU5MERcdTYyMTZcdTRFM0FcdTdBN0FcIik7XG4gICAgICB0YXNrSWRzLmFkZCh0LmlkKTtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgdC50aXRsZS50cmltKCkubGVuZ3RoID4gMCAmJiBjaGFyQ291bnQodC50aXRsZSkgPD0gMjAwLFxuICAgICAgICBcIlx1NEVGQlx1NTJBMVx1NTQwRFx1NzlGMFx1OTcwMFx1NEUzQSAxXHUyMDEzMjAwIFx1NEUyQVx1NUI1N1x1N0IyNlwiLFxuICAgICAgKTtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgdXRmOExlbih0Lm5vdGVzKSA8PSA1MDAwMCAmJlxuICAgICAgICAgIHQudGFncy5sZW5ndGggPD0gMjAgJiZcbiAgICAgICAgICB0LnRhZ3MuZXZlcnkoKHRhZykgPT4gY2hhckNvdW50KHRhZykgPD0gNDApLFxuICAgICAgICBcIlx1NTkwN1x1NkNFOFx1NjIxNlx1NjgwN1x1N0I3RVx1OEZDN1x1OTU3RlwiLFxuICAgICAgKTtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgdC5wcmlvcml0eSA8PSAzICYmIHQuZXN0aW1hdGUgPj0gMSAmJiB0LmVzdGltYXRlIDw9IDk5LFxuICAgICAgICBcIlx1NjVFMFx1NjU0OFx1NzY4NFx1NEYxOFx1NTE0OFx1N0VBN1x1NjIxNlx1OTg4NFx1OEJBMVx1NzU2QVx1ODMwNFx1NjU3MFwiLFxuICAgICAgKTtcbiAgICAgIGVuc3VyZSh0LnNjcmFwTWludXRlcyA8PSAxMDA4MCwgXCJcdTkxQ0RcdTRGRUVcdTdBOTdcdTUzRTNcdThEODVcdTUxRkFcdTgzMDNcdTU2RjRcIik7XG4gICAgICBlbnN1cmUoXG4gICAgICAgIE51bWJlci5pc0ludGVnZXIodC5leHBpcnlEYXlzKSAmJlxuICAgICAgICAgIHQuZXhwaXJ5RGF5cyA+PSAwICYmXG4gICAgICAgICAgdC5leHBpcnlEYXlzIDw9IDM2NTAwLFxuICAgICAgICBcIlx1NjJBNVx1NUU5Rlx1NTkyOVx1NjU3MFx1OTcwMFx1NEUzQSAwXHUyMDEzMzY1MDBcIixcbiAgICAgICk7XG4gICAgICBlbnN1cmUoXG4gICAgICAgIHQucHJvamVjdElkID09PSBudWxsIHx8IHByb2plY3RJZHMuaGFzKHQucHJvamVjdElkKSxcbiAgICAgICAgXCJcdTRFRkJcdTUyQTFcdTVGMTVcdTc1MjhcdTRFODZcdTRFMERcdTVCNThcdTU3MjhcdTc2ODRcdTk4NzlcdTc2RUVcIixcbiAgICAgICk7XG4gICAgICBlbnN1cmUoXG4gICAgICAgIHQuaGFiaXRJZCA9PT0gbnVsbCB8fCBoYWJpdElkcy5oYXModC5oYWJpdElkKSxcbiAgICAgICAgXCJcdTRFRkJcdTUyQTFcdTVGMTVcdTc1MjhcdTRFODZcdTRFMERcdTVCNThcdTU3MjhcdTc2ODRcdTRFNjBcdTYwRUZcIixcbiAgICAgICk7XG4gICAgICBlbnN1cmUoXG4gICAgICAgIHQuZHVlRGF0ZSA9PT0gbnVsbCB8fCAodC5kdWVEYXRlLmxlbmd0aCA9PT0gMTAgJiYgdmFsaWREYXRlKHQuZHVlRGF0ZSkpLFxuICAgICAgICBcIlx1NjVFMFx1NjU0OFx1NzY4NFx1NEVGQlx1NTJBMVx1NjVFNVx1NjcxRlwiLFxuICAgICAgKTtcbiAgICAgIGNvbnN0IHN1YnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgIGVuc3VyZShcbiAgICAgICAgdC5zdWJ0YXNrcy5sZW5ndGggPD0gMjAwICYmXG4gICAgICAgICAgdC5zdWJ0YXNrcy5ldmVyeSgoc3ViKSA9PiB7XG4gICAgICAgICAgICBpZiAoc3ViLmlkLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKHN1YnMuaGFzKHN1Yi5pZCkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIHN1YnMuYWRkKHN1Yi5pZCk7XG4gICAgICAgICAgICByZXR1cm4gc3ViLnRpdGxlLnRyaW0oKS5sZW5ndGggPiAwICYmIGNoYXJDb3VudChzdWIudGl0bGUpIDw9IDIwMDtcbiAgICAgICAgICB9KSxcbiAgICAgICAgXCJcdTY1RTBcdTY1NDhcdTc2ODRcdTVCNTBcdTRFRkJcdTUyQTFcIixcbiAgICAgICk7XG4gICAgICBlbnN1cmUoXG4gICAgICAgIHQuY29tcGxldGVkID09PSAodC5jb21wbGV0ZWRBdCAhPT0gbnVsbCksXG4gICAgICAgIFwiXHU0RUZCXHU1MkExXHU1QjhDXHU2MjEwXHU3MkI2XHU2MDAxXHU0RTBFXHU2NUU1XHU2NzFGXHU0RTBEXHU0RTAwXHU4MUY0XCIsXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCB0ID0gdGhpcy50aW1lcjtcbiAgICBlbnN1cmUoXG4gICAgICB0LmN5Y2xlRGF0ZSA9PT0gbnVsbCB8fFxuICAgICAgICAodC5jeWNsZURhdGUubGVuZ3RoID09PSAxMCAmJiB2YWxpZERhdGUodC5jeWNsZURhdGUpKSxcbiAgICAgIFwiXHU2NUUwXHU2NTQ4XHU3Njg0XHU3NTZBXHU4MzA0XHU1NDY4XHU2NzFGXHU2NUU1XHU2NzFGXCIsXG4gICAgKTtcbiAgICBlbnN1cmUoXG4gICAgICB0LmR1cmF0aW9uU2VjcyA+PSAxICYmXG4gICAgICAgIHQuZHVyYXRpb25TZWNzIDw9IDEwODAwICYmXG4gICAgICAgIHQucmVtYWluaW5nU2VjcyA8PSB0LmR1cmF0aW9uU2VjcyAmJlxuICAgICAgICB0LnJ1bm5pbmcgPT09ICh0LmRlYWRsaW5lICE9PSBudWxsKSxcbiAgICAgIFwiXHU4QkExXHU2NUY2XHU1NjY4XHU2NTcwXHU2MzZFXHU0RTBEXHU2QjYzXHU3ODZFXCIsXG4gICAgKTtcbiAgICBlbnN1cmUodC50YXNrSWQgPT09IG51bGwgfHwgdGFza0lkcy5oYXModC50YXNrSWQpLCBcIlx1OEJBMVx1NjVGNlx1NTY2OFx1NEVGQlx1NTJBMVx1NEUwRFx1NUI1OFx1NTcyOFwiKTtcbiAgICBjb25zdCBzZXNzaW9uSWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgY29uc3QgZXN0aW1hdGVkVGFza3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBmb3IgKGNvbnN0IHNlc3Npb24gb2YgdGhpcy5zZXNzaW9ucykge1xuICAgICAgY29uc3QgbWF4RHVyYXRpb24gPSBzZXNzaW9uLnNvdXJjZSA9PT0gXCJ0aW1lclwiID8gMTA4MDAgOiA5OSAqIDE4MCAqIDYwO1xuICAgICAgZW5zdXJlKFxuICAgICAgICBzZXNzaW9uLmlkLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICAhc2Vzc2lvbklkcy5oYXMoc2Vzc2lvbi5pZCkgJiZcbiAgICAgICAgICBzZXNzaW9uLmVuZGVkQXQgPj0gc2Vzc2lvbi5zdGFydGVkQXQgJiZcbiAgICAgICAgICBzZXNzaW9uLmR1cmF0aW9uU2VjcyA+PSAxICYmXG4gICAgICAgICAgc2Vzc2lvbi5kdXJhdGlvblNlY3MgPD0gbWF4RHVyYXRpb24gJiZcbiAgICAgICAgICAoc2Vzc2lvbi5zb3VyY2UgIT09IFwidGFza0VzdGltYXRlXCIgfHxcbiAgICAgICAgICAgICghc2Vzc2lvbi5jb21wbGV0ZWQgJiZcbiAgICAgICAgICAgICAgc2Vzc2lvbi50YXNrSWQgIT09IG51bGwgJiZcbiAgICAgICAgICAgICAgc2Vzc2lvbi50YXNrSWQubGVuZ3RoID4gMCAmJlxuICAgICAgICAgICAgICAhZXN0aW1hdGVkVGFza3MuaGFzKHNlc3Npb24udGFza0lkKSAmJlxuICAgICAgICAgICAgICBzZXNzaW9uLnN0YXJ0ZWRBdCA9PT0gc2Vzc2lvbi5lbmRlZEF0KSkgJiZcbiAgICAgICAgICBjaGFyQ291bnQoc2Vzc2lvbi50YXNrVGl0bGUpIDw9IDIwMCAmJlxuICAgICAgICAgIGNoYXJDb3VudChzZXNzaW9uLnByb2plY3ROYW1lKSA8PSA0MCxcbiAgICAgICAgXCJcdTY1RTBcdTY1NDhcdTc2ODRcdTRFMTNcdTZDRThcdThCQjBcdTVGNTVcIixcbiAgICAgICk7XG4gICAgICBzZXNzaW9uSWRzLmFkZChzZXNzaW9uLmlkKTtcbiAgICAgIGlmIChzZXNzaW9uLnNvdXJjZSA9PT0gXCJ0YXNrRXN0aW1hdGVcIiAmJiBzZXNzaW9uLnRhc2tJZCAhPT0gbnVsbCkge1xuICAgICAgICBlc3RpbWF0ZWRUYXNrcy5hZGQoc2Vzc2lvbi50YXNrSWQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHN0YXRzKGF0OiBudW1iZXIpOiBTdGF0cyB7XG4gICAgY29uc3QgdG9kYXkgPSBkYXRlQXQoYXQpO1xuICAgIGNvbnN0IGN1cnJlbnQgPSBwYXJzZUxvY2FsRGF0ZSh0b2RheSkhO1xuICAgIGNvbnN0IGJ5RGF5ID0gbmV3IE1hcDxzdHJpbmcsIHsgc2Vjb25kczogbnVtYmVyOyBwb21vZG9yb3M6IG51bWJlciB9PigpO1xuICAgIGZvciAoY29uc3Qgc2Vzc2lvbiBvZiB0aGlzLnNlc3Npb25zKSB7XG4gICAgICBjb25zdCBlbnRyeSA9IGJ5RGF5LmdldChkYXRlQXQoc2Vzc2lvbi5lbmRlZEF0KSkgPz8ge1xuICAgICAgICBzZWNvbmRzOiAwLFxuICAgICAgICBwb21vZG9yb3M6IDAsXG4gICAgICB9O1xuICAgICAgZW50cnkuc2Vjb25kcyArPSBzZXNzaW9uLmR1cmF0aW9uU2VjcztcbiAgICAgIGVudHJ5LnBvbW9kb3JvcyArPSBzZXNzaW9uLmNvbXBsZXRlZCA/IDEgOiAwO1xuICAgICAgYnlEYXkuc2V0KGRhdGVBdChzZXNzaW9uLmVuZGVkQXQpLCBlbnRyeSk7XG4gICAgfVxuICAgIC8vIFx1NEUwMFx1OTA0RFx1OTA0RFx1NTM4Nlx1NUI5RVx1NEY4Qlx1RkYxQVx1NjMwOVx1NTkyOVx1N0VERlx1OEJBMVx1NUI4Q1x1NjIxMFx1MzAwMVx1NEY1Q1x1NUU5Rlx1NEUwRVx1N0YzQVx1NTJFNFx1MzAwMlxuICAgIGNvbnN0IGNvbXBsZXRlZEJ5RGF5ID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgICBjb25zdCB2b2lkZWRCeURheSA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gICAgY29uc3QgbWlzc2VkQnlEYXkgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICAgIGZvciAoY29uc3QgdCBvZiB0aGlzLnRhc2tzKSB7XG4gICAgICBpZiAodC5jb21wbGV0ZWRBdCAhPT0gbnVsbCkge1xuICAgICAgICBjb21wbGV0ZWRCeURheS5zZXQoXG4gICAgICAgICAgZGF0ZUF0KHQuY29tcGxldGVkQXQpLFxuICAgICAgICAgIChjb21wbGV0ZWRCeURheS5nZXQoZGF0ZUF0KHQuY29tcGxldGVkQXQpKSA/PyAwKSArIDEsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAodC5yZW1pbmRlckV4cGlyZWQgJiYgIXQuY29tcGxldGVkICYmIHQuZHVlRGF0ZSAhPT0gbnVsbCkge1xuICAgICAgICBpZiAoa2luZE9mKHQpID09PSBcImhhYml0XCIpIHtcbiAgICAgICAgICBtaXNzZWRCeURheS5zZXQodC5kdWVEYXRlLCAobWlzc2VkQnlEYXkuZ2V0KHQuZHVlRGF0ZSkgPz8gMCkgKyAxKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2b2lkZWRCeURheS5zZXQodC5kdWVEYXRlLCAodm9pZGVkQnlEYXkuZ2V0KHQuZHVlRGF0ZSkgPz8gMCkgKyAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBkYXlzOiBEYXlTdGF0W10gPSBbXTtcbiAgICBmb3IgKGxldCBuID0gMjc7IG4gPj0gMDsgbiAtPSAxKSB7XG4gICAgICBjb25zdCBkYXRlID0gZm9ybWF0TG9jYWxEYXRlKGFkZERheXMoY3VycmVudCwgLW4pKTtcbiAgICAgIGNvbnN0IGVudHJ5ID0gYnlEYXkuZ2V0KGRhdGUpID8/IHsgc2Vjb25kczogMCwgcG9tb2Rvcm9zOiAwIH07XG4gICAgICBkYXlzLnB1c2goe1xuICAgICAgICBkYXRlLFxuICAgICAgICBzZWNvbmRzOiBlbnRyeS5zZWNvbmRzLFxuICAgICAgICBwb21vZG9yb3M6IGVudHJ5LnBvbW9kb3JvcyxcbiAgICAgICAgbWlzc2VkOiBtaXNzZWRCeURheS5nZXQoZGF0ZSkgPz8gMCxcbiAgICAgICAgY29tcGxldGVkOiBjb21wbGV0ZWRCeURheS5nZXQoZGF0ZSkgPz8gMCxcbiAgICAgICAgdm9pZGVkOiB2b2lkZWRCeURheS5nZXQoZGF0ZSkgPz8gMCxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBmb2N1c2VkID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgZm9yIChjb25zdCBzIG9mIHRoaXMuc2Vzc2lvbnMpIHtcbiAgICAgIGlmIChzLmNvbXBsZXRlZCB8fCBzLnNvdXJjZSA9PT0gXCJ0YXNrRXN0aW1hdGVcIikge1xuICAgICAgICBmb2N1c2VkLmFkZChkYXRlQXQocy5lbmRlZEF0KSk7XG4gICAgICB9XG4gICAgfVxuICAgIGxldCBkYXkgPSBjdXJyZW50O1xuICAgIGlmICghZm9jdXNlZC5oYXModG9kYXkpKSB7XG4gICAgICBkYXkgPSBhZGREYXlzKGRheSwgLTEpO1xuICAgIH1cbiAgICBsZXQgc3RyZWFrID0gMDtcbiAgICB3aGlsZSAoZm9jdXNlZC5oYXMoZm9ybWF0TG9jYWxEYXRlKGRheSkpKSB7XG4gICAgICBzdHJlYWsgKz0gMTtcbiAgICAgIGRheSA9IGFkZERheXMoZGF5LCAtMSk7XG4gICAgfVxuICAgIGNvbnN0IGxhc3QgPSBkYXlzW2RheXMubGVuZ3RoIC0gMV0hO1xuICAgIHJldHVybiB7XG4gICAgICB0b2RheVNlY29uZHM6IGxhc3Quc2Vjb25kcyxcbiAgICAgIHRvZGF5UG9tb2Rvcm9zOiBsYXN0LnBvbW9kb3JvcyxcbiAgICAgIHRvZGF5Q29tcGxldGVkOiB0aGlzLnRhc2tzLmZpbHRlcihcbiAgICAgICAgKHQpID0+IHQuY29tcGxldGVkQXQgIT09IG51bGwgJiYgZGF0ZUF0KHQuY29tcGxldGVkQXQpID09PSB0b2RheSxcbiAgICAgICkubGVuZ3RoLFxuICAgICAgdG90YWxTZWNvbmRzOiB0aGlzLnNlc3Npb25zLnJlZHVjZSgobiwgcykgPT4gbiArIHMuZHVyYXRpb25TZWNzLCAwKSxcbiAgICAgIHRvdGFsUG9tb2Rvcm9zOiB0aGlzLnNlc3Npb25zLmZpbHRlcigocykgPT4gcy5jb21wbGV0ZWQpLmxlbmd0aCxcbiAgICAgIHN0cmVhayxcbiAgICAgIGRheXMsXG4gICAgfTtcbiAgfVxuXG4gIC8vIC0tLS0gcmVtaW5kZXJzIFx1NTMwNVx1ODhDNSAtLS0tXG4gIHJlbWluZGVySWRsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gcmVtaW5kZXJJZGxlKHRoaXMpO1xuICB9XG4gIHBlbmRpbmdSZW1pbmRlcigpOiBUYXNrIHwgbnVsbCB7XG4gICAgcmV0dXJuIHBlbmRpbmdSZW1pbmRlcih0aGlzKTtcbiAgfVxuICBkdWVBdXRvVGFzaygpOiBUYXNrIHwgbnVsbCB7XG4gICAgcmV0dXJuIGR1ZUF1dG9UYXNrKHRoaXMpO1xuICB9XG5cbiAgLy8gLS0tLSBwbGFuIFx1NTMwNVx1ODhDNSAtLS0tXG4gIGV4cG9ydFBsYW4oKTogUGxhbkZpbGUge1xuICAgIHJldHVybiBleHBvcnRQbGFuKHRoaXMpO1xuICB9XG5cbiAgLy8gLS0tLSB0ZWFjaGluZyBcdTUzMDVcdTg4QzUgLS0tLVxuICB0ZWFjaGluZ1Rhc2sodGFza0lkOiBzdHJpbmcpOiBSZXR1cm5UeXBlPHR5cGVvZiB0ZWFjaGluZ1Rhc2s+IHtcbiAgICByZXR1cm4gdGVhY2hpbmdUYXNrKHRoaXMsIHRhc2tJZCk7XG4gIH1cbiAgY29tcGxldGVUZWFjaGluZ1Rhc2sodGFza0lkOiBzdHJpbmcsIGF0OiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb21wbGV0ZVRlYWNoaW5nVGFzayh0aGlzLCB0YXNrSWQsIGF0KTtcbiAgfVxuXG4gIC8vIC0tLS0gZWR1Y2F0aW9uIFx1NjgyMVx1OUE4Q1x1NTMwNVx1ODhDNSAtLS0tXG4gIGVkdWNhdGlvblZhbGlkYXRlKCk6IHZvaWQge1xuICAgIHZhbGlkYXRlRWR1Y2F0aW9uRGF0YSh0aGlzKTtcbiAgfVxuICB2YWxpZGF0ZVJlbWluZGVyVGFzayh0YXNrOiBUYXNrKTogdm9pZCB7XG4gICAgdmFsaWRhdGVSZW1pbmRlclRhc2sodGFzayk7XG4gIH1cbn1cblxuaW1wb3J0IHsgdmFsaWRhdGVSZW1pbmRlclRhc2sgfSBmcm9tIFwiLi9yZW1pbmRlcnNcIjtcbmltcG9ydCB7IHZhbGlkYXRlRWR1Y2F0aW9uIGFzIHZhbGlkYXRlRWR1Y2F0aW9uRGF0YSB9IGZyb20gXCIuL2VkdWNhdGlvblwiO1xuXG4vLyAtLS0tLS0tLS0tIFx1NTE2OFx1NUM0MFx1NTFGRFx1NjU3MCAtLS0tLS0tLS0tXG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZEFwcElkcyhsaXN0OiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIGxpc3QubGVuZ3RoIDw9IDEwMCAmJlxuICAgIGxpc3QuZXZlcnkoXG4gICAgICAoYSkgPT5cbiAgICAgICAgYS50cmltKCkubGVuZ3RoID4gMCAmJlxuICAgICAgICBjaGFyQ291bnQoYSkgPD0gMzI3NjggJiZcbiAgICAgICAgIUFycmF5LmZyb20oYSkuc29tZSgoYykgPT4gaXNDb250cm9sQ2hhcihjKSksXG4gICAgKVxuICApO1xufVxuXG5mdW5jdGlvbiBpc0NvbnRyb2xDaGFyKGM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBjb2RlID0gYy5jb2RlUG9pbnRBdCgwKSE7XG4gIHJldHVybiBjb2RlIDwgMHgyMCB8fCAoY29kZSA+PSAweDdmICYmIGNvZGUgPD0gMHg5Zik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlTG9jYWxEYXRlKFxuICB2YWx1ZTogc3RyaW5nLFxuKTogeyB5ZWFyOiBudW1iZXI7IG1vbnRoOiBudW1iZXI7IGRheTogbnVtYmVyIH0gfCBudWxsIHtcbiAgaWYgKCEvXlxcZHs0fS1cXGR7Mn0tXFxkezJ9JC8udGVzdCh2YWx1ZSkpIHJldHVybiBudWxsO1xuICBjb25zdCB5ZWFyID0gTnVtYmVyKHZhbHVlLnNsaWNlKDAsIDQpKTtcbiAgY29uc3QgbW9udGggPSBOdW1iZXIodmFsdWUuc2xpY2UoNSwgNykpO1xuICBjb25zdCBkYXkgPSBOdW1iZXIodmFsdWUuc2xpY2UoOCwgMTApKTtcbiAgY29uc3QgcHJvYmUgPSBuZXcgRGF0ZShEYXRlLlVUQyh5ZWFyLCBtb250aCAtIDEsIGRheSkpO1xuICBpZiAoXG4gICAgcHJvYmUuZ2V0VVRDRnVsbFllYXIoKSAhPT0geWVhciB8fFxuICAgIHByb2JlLmdldFVUQ01vbnRoKCkgIT09IG1vbnRoIC0gMSB8fFxuICAgIHByb2JlLmdldFVUQ0RhdGUoKSAhPT0gZGF5XG4gICkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiB7IHllYXIsIG1vbnRoLCBkYXkgfTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0TG9jYWxEYXRlKGRhdGU6IHtcbiAgeWVhcjogbnVtYmVyO1xuICBtb250aDogbnVtYmVyO1xuICBkYXk6IG51bWJlcjtcbn0pOiBzdHJpbmcge1xuICByZXR1cm4gYCR7ZGF0ZS55ZWFyfS0ke1N0cmluZyhkYXRlLm1vbnRoKS5wYWRTdGFydCgyLCBcIjBcIil9LSR7U3RyaW5nKGRhdGUuZGF5KS5wYWRTdGFydCgyLCBcIjBcIil9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrVXNlckFjdGlvbihhY3Rpb246IEFjdGlvbik6IHZvaWQge1xuICBpZiAoYWN0aW9uLnR5cGUgPT09IFwiZWR1Y2F0aW9uXCIgJiYgYXNzaXN0YW50T25seShhY3Rpb24uY29tbWFuZCkpIHtcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXG4gICAgICBcIlx1OEJGRVx1N0EwQlx1MzAwMVx1NEY1Q1x1NEUxQVx1MzAwMVx1OEJENVx1NTM3N1x1NTQ4Q1x1NjI3OVx1NjUzOVx1NzUzMVx1NUI2Nlx1NEU2MFx1NTJBOVx1NjI0Qlx1NzUxRlx1NjIxMFx1RkYwQ1x1OEJGN1x1NTcyOFx1NUJGOVx1OEJERFx1NEUyRFx1NjNEMFx1NTFGQVx1ODk4MVx1NkM0MlwiLFxuICAgICk7XG4gIH1cbn1cblxuaW1wb3J0IHsgYXNzaXN0YW50T25seSB9IGZyb20gXCIuL2VkdWNhdGlvblwiO1xuXG4vLyAtLS0tLS0tLS0tIEFjdGlvbiAtLS0tLS0tLS0tXG5cbmV4cG9ydCB0eXBlIEFjdGlvbiA9XG4gIHwgeyB0eXBlOiBcImVkdWNhdGlvblwiOyBjb21tYW5kOiBpbXBvcnQoXCIuL2VkdWNhdGlvblwiKS5Db21tYW5kIH1cbiAgfCB7IHR5cGU6IFwic3RhcnRSZW1pbmRlclwiOyBpZDogc3RyaW5nIH1cbiAgfCB7IHR5cGU6IFwic2F2ZVRhc2tcIjsgdGFzazogVGFza0RyYWZ0IH1cbiAgfCB7IHR5cGU6IFwidG9nZ2xlVGFza1wiOyBpZDogc3RyaW5nIH1cbiAgfCB7IHR5cGU6IFwiZGVsZXRlVGFza1wiOyBpZDogc3RyaW5nIH1cbiAgfCB7IHR5cGU6IFwicmVzdG9yZVRhc2tcIjsgdGFzazogVGFzayB9XG4gIHwgeyB0eXBlOiBcInRvZ2dsZVN1YnRhc2tcIjsgdGFza0lkOiBzdHJpbmc7IHN1YnRhc2tJZDogc3RyaW5nIH1cbiAgfCB7XG4gICAgICB0eXBlOiBcInNhdmVQcm9qZWN0XCI7XG4gICAgICBpZDogc3RyaW5nIHwgbnVsbDtcbiAgICAgIG5hbWU6IHN0cmluZztcbiAgICAgIGNvbG9yOiBzdHJpbmc7XG4gICAgICBkaXJlY3Rvcnk6IHN0cmluZyB8IG51bGw7XG4gICAgfVxuICB8IHtcbiAgICAgIHR5cGU6IFwicmVuYW1lUHJvamVjdERpcmVjdG9yeVwiO1xuICAgICAgaWQ6IHN0cmluZztcbiAgICAgIG5hbWU6IHN0cmluZztcbiAgICAgIGNvbG9yOiBzdHJpbmc7XG4gICAgICBkaXJlY3Rvcnk6IHN0cmluZztcbiAgICB9XG4gIHwgeyB0eXBlOiBcInNldFByb2plY3RXaGl0ZWxpc3RcIjsgaWQ6IHN0cmluZzsgd2hpdGVsaXN0OiBzdHJpbmdbXSB8IG51bGwgfVxuICB8IHsgdHlwZTogXCJkZWxldGVQcm9qZWN0XCI7IGlkOiBzdHJpbmcgfVxuICB8IHsgdHlwZTogXCJyZW9yZGVyUHJvamVjdHNcIjsgaWRzOiBzdHJpbmdbXSB9XG4gIHwgeyB0eXBlOiBcImRldGFjaFRhc2tzXCI7IGlkczogc3RyaW5nW107IHRhcmdldDogRGV0YWNoVGFyZ2V0IH1cbiAgfCB7IHR5cGU6IFwic2F2ZUhhYml0R3JvdXBcIjsgaWQ6IHN0cmluZyB8IG51bGw7IG5hbWU6IHN0cmluZyB9XG4gIHwge1xuICAgICAgdHlwZTogXCJzYXZlSGFiaXRcIjtcbiAgICAgIGlkOiBzdHJpbmcgfCBudWxsO1xuICAgICAgbmFtZTogc3RyaW5nO1xuICAgICAgcHJvamVjdElkOiBzdHJpbmcgfCBudWxsO1xuICAgICAgZm9jdXNNaW51dGVzOiBudW1iZXIgfCBudWxsO1xuICAgICAgc2xvdHM6IEhhYml0U2xvdFtdO1xuICAgIH1cbiAgfCB7IHR5cGU6IFwiZGVsZXRlSGFiaXRcIjsgaWQ6IHN0cmluZyB9XG4gIHwge1xuICAgICAgdHlwZTogXCJzYXZlVmlzaW9uXCI7XG4gICAgICBpZDogc3RyaW5nIHwgbnVsbDtcbiAgICAgIG5hbWU6IHN0cmluZztcbiAgICAgIG5vdGVzOiBzdHJpbmc7XG4gICAgICBwcm9qZWN0SWQ6IHN0cmluZyB8IG51bGw7XG4gICAgfVxuICB8IHsgdHlwZTogXCJkZWxldGVWaXNpb25cIjsgaWQ6IHN0cmluZyB9XG4gIHwge1xuICAgICAgdHlwZTogXCJzYXZlQmxvY2tcIjtcbiAgICAgIGlkOiBzdHJpbmcgfCBudWxsO1xuICAgICAgdGl0bGU6IHN0cmluZztcbiAgICAgIGRheXM6IG51bWJlcltdO1xuICAgICAgc3RhcnQ6IHN0cmluZztcbiAgICAgIGVuZDogc3RyaW5nO1xuICAgICAgYXR0ZW50aW9uOiBBdHRlbnRpb247XG4gICAgICBub3Rlczogc3RyaW5nO1xuICAgIH1cbiAgfCB7IHR5cGU6IFwiZGVsZXRlQmxvY2tcIjsgaWQ6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiBcInNlbGVjdFRhc2tcIjsgaWQ6IHN0cmluZyB8IG51bGwgfVxuICB8IHsgdHlwZTogXCJzdGFydFRpbWVyXCI7IG1pbnV0ZXM/OiBudW1iZXIgfCBudWxsIH1cbiAgfCB7IHR5cGU6IFwiY29tcGxldGVGb2N1c1wiIH1cbiAgfCB7IHR5cGU6IFwicGF1c2VUaW1lclwiIH1cbiAgfCB7IHR5cGU6IFwicmVzZXRUaW1lclwiIH1cbiAgfCB7IHR5cGU6IFwic2tpcFRpbWVyXCIgfVxuICB8IHsgdHlwZTogXCJzZXRNb2RlXCI7IG1vZGU6IE1vZGUgfVxuICB8IHsgdHlwZTogXCJzYXZlU2V0dGluZ3NcIjsgc2V0dGluZ3M6IFNldHRpbmdzIH1cbiAgfCB7IHR5cGU6IFwibG9hZEV4YW1wbGVcIiB9XG4gIHwgeyB0eXBlOiBcImltcG9ydFwiOyBkYXRhOiBBcHBEYXRhIH1cbiAgfCB7IHR5cGU6IFwiaW1wb3J0UGxhblwiOyBwbGFuOiBQbGFuRmlsZSB9XG4gIHwgeyB0eXBlOiBcImVtZXJnZW5jeVVubG9ja1wiIH1cbiAgfCB7IHR5cGU6IFwicmVhcm1Mb2NrXCIgfVxuICB8IHsgdHlwZTogXCJzYXZlTG9ja1NjaGVkdWxlXCI7IHNjaGVkdWxlOiBMb2NrU2NoZWR1bGUgfVxuICB8IHsgdHlwZTogXCJkZWxldGVMb2NrU2NoZWR1bGVcIjsgaWQ6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiBcInN0YXJ0UXVpY2tMb2NrXCI7IG1pbnV0ZXM6IG51bWJlcjsgc3RyaWN0OiBib29sZWFuIH07XG5cbmltcG9ydCB7IHBhcnNlUGxhbkZpbGUgfSBmcm9tIFwiLi9wbGFuXCI7XG5pbXBvcnQgeyBwYXJzZUNvbW1hbmQgfSBmcm9tIFwiLi9lZHVjYXRpb25cIjtcbmltcG9ydCB7IHBhcnNlTG9ja1NjaGVkdWxlIH0gZnJvbSBcIi4vbG9ja1wiO1xuXG5jb25zdCBBQ1RJT05fS0VZUzogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+ID0ge1xuICBlZHVjYXRpb246IFtcInR5cGVcIiwgXCJjb21tYW5kXCJdLFxuICBzdGFydFJlbWluZGVyOiBbXCJ0eXBlXCIsIFwiaWRcIl0sXG4gIHNhdmVUYXNrOiBbXCJ0eXBlXCIsIFwidGFza1wiXSxcbiAgdG9nZ2xlVGFzazogW1widHlwZVwiLCBcImlkXCJdLFxuICBkZWxldGVUYXNrOiBbXCJ0eXBlXCIsIFwiaWRcIl0sXG4gIHJlc3RvcmVUYXNrOiBbXCJ0eXBlXCIsIFwidGFza1wiXSxcbiAgdG9nZ2xlU3VidGFzazogW1widHlwZVwiLCBcInRhc2tJZFwiLCBcInN1YnRhc2tJZFwiXSxcbiAgc2F2ZVByb2plY3Q6IFtcInR5cGVcIiwgXCJpZFwiLCBcIm5hbWVcIiwgXCJjb2xvclwiLCBcImRpcmVjdG9yeVwiXSxcbiAgcmVuYW1lUHJvamVjdERpcmVjdG9yeTogW1widHlwZVwiLCBcImlkXCIsIFwibmFtZVwiLCBcImNvbG9yXCIsIFwiZGlyZWN0b3J5XCJdLFxuICBzZXRQcm9qZWN0V2hpdGVsaXN0OiBbXCJ0eXBlXCIsIFwiaWRcIiwgXCJ3aGl0ZWxpc3RcIl0sXG4gIGRlbGV0ZVByb2plY3Q6IFtcInR5cGVcIiwgXCJpZFwiXSxcbiAgcmVvcmRlclByb2plY3RzOiBbXCJ0eXBlXCIsIFwiaWRzXCJdLFxuICBkZXRhY2hUYXNrczogW1widHlwZVwiLCBcImlkc1wiLCBcInRhcmdldFwiXSxcbiAgc2F2ZUhhYml0R3JvdXA6IFtcInR5cGVcIiwgXCJpZFwiLCBcIm5hbWVcIl0sXG4gIHNhdmVIYWJpdDogW1widHlwZVwiLCBcImlkXCIsIFwibmFtZVwiLCBcInByb2plY3RJZFwiLCBcImZvY3VzTWludXRlc1wiLCBcInNsb3RzXCJdLFxuICBkZWxldGVIYWJpdDogW1widHlwZVwiLCBcImlkXCJdLFxuICBzYXZlVmlzaW9uOiBbXCJ0eXBlXCIsIFwiaWRcIiwgXCJuYW1lXCIsIFwibm90ZXNcIiwgXCJwcm9qZWN0SWRcIl0sXG4gIGRlbGV0ZVZpc2lvbjogW1widHlwZVwiLCBcImlkXCJdLFxuICBzYXZlQmxvY2s6IFtcbiAgICBcInR5cGVcIixcbiAgICBcImlkXCIsXG4gICAgXCJ0aXRsZVwiLFxuICAgIFwiZGF5c1wiLFxuICAgIFwic3RhcnRcIixcbiAgICBcImVuZFwiLFxuICAgIFwiYXR0ZW50aW9uXCIsXG4gICAgXCJub3Rlc1wiLFxuICBdLFxuICBkZWxldGVCbG9jazogW1widHlwZVwiLCBcImlkXCJdLFxuICBzZWxlY3RUYXNrOiBbXCJ0eXBlXCIsIFwiaWRcIl0sXG4gIHN0YXJ0VGltZXI6IFtcInR5cGVcIiwgXCJtaW51dGVzXCJdLFxuICBjb21wbGV0ZUZvY3VzOiBbXCJ0eXBlXCJdLFxuICBwYXVzZVRpbWVyOiBbXCJ0eXBlXCJdLFxuICByZXNldFRpbWVyOiBbXCJ0eXBlXCJdLFxuICBza2lwVGltZXI6IFtcInR5cGVcIl0sXG4gIHNldE1vZGU6IFtcInR5cGVcIiwgXCJtb2RlXCJdLFxuICBzYXZlU2V0dGluZ3M6IFtcInR5cGVcIiwgXCJzZXR0aW5nc1wiXSxcbiAgbG9hZEV4YW1wbGU6IFtcInR5cGVcIl0sXG4gIGltcG9ydDogW1widHlwZVwiLCBcImRhdGFcIl0sXG4gIGltcG9ydFBsYW46IFtcInR5cGVcIiwgXCJwbGFuXCJdLFxuICBlbWVyZ2VuY3lVbmxvY2s6IFtcInR5cGVcIl0sXG4gIHJlYXJtTG9jazogW1widHlwZVwiXSxcbiAgc2F2ZUxvY2tTY2hlZHVsZTogW1widHlwZVwiLCBcInNjaGVkdWxlXCJdLFxuICBkZWxldGVMb2NrU2NoZWR1bGU6IFtcInR5cGVcIiwgXCJpZFwiXSxcbiAgc3RhcnRRdWlja0xvY2s6IFtcInR5cGVcIiwgXCJtaW51dGVzXCIsIFwic3RyaWN0XCJdLFxufTtcblxuY29uc3QgQUNUSU9OX05BTUVTID0gT2JqZWN0LmtleXMoQUNUSU9OX0tFWVMpO1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VBY3Rpb24ocmF3OiB1bmtub3duKTogQWN0aW9uIHtcbiAgaWYgKCFpc09iamVjdChyYXcpKSB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTUyQThcdTRGNUNcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gIGNvbnN0IHR5cGUgPSBvbmVPZihcbiAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJ0eXBlXCIsIFwiXHU1MkE4XHU0RjVDXCIsICh2KSA9PiB2KSxcbiAgICBcIlx1NTJBOFx1NEY1QyB0eXBlXCIsXG4gICAgQUNUSU9OX05BTUVTLFxuICApO1xuICByZWplY3RVbmtub3duKHJhdywgQUNUSU9OX0tFWVNbdHlwZV0hLCBcIlx1NTJBOFx1NEY1Q1wiKTtcbiAgY29uc3Qgc3RyID0gKGtleTogc3RyaW5nKTogc3RyaW5nID0+IHJlcXVpcmVkRmllbGQocmF3LCBrZXksIFwiXHU1MkE4XHU0RjVDXCIsIGFzU3RyKTtcbiAgY29uc3Qgb3B0U3RyID0gKGtleTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCA9PlxuICAgIGZpZWxkKHJhdywga2V5LCBcIlx1NTJBOFx1NEY1Q1wiLCAodikgPT4gYXNPcHQodiwga2V5LCBhc1N0ciksIG51bGwpIGFzIHN0cmluZyB8IG51bGw7XG4gIGNvbnN0IHN0cnMgPSAoa2V5OiBzdHJpbmcpOiBzdHJpbmdbXSA9PlxuICAgIGFzQXJyYXkoXG4gICAgICByZXF1aXJlZEZpZWxkKHJhdywga2V5LCBcIlx1NTJBOFx1NEY1Q1wiLCAodikgPT4gdiksXG4gICAgICBrZXksXG4gICAgKS5tYXAoKHgpID0+IGFzU3RyKHgsIGtleSkpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlIFwiZWR1Y2F0aW9uXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBjb21tYW5kOiBwYXJzZUNvbW1hbmQocmVxdWlyZWRGaWVsZChyYXcsIFwiY29tbWFuZFwiLCBcIlx1NTJBOFx1NEY1Q1wiLCAodikgPT4gdikpLFxuICAgICAgfTtcbiAgICBjYXNlIFwic3RhcnRSZW1pbmRlclwiOlxuICAgIGNhc2UgXCJ0b2dnbGVUYXNrXCI6XG4gICAgY2FzZSBcImRlbGV0ZVRhc2tcIjpcbiAgICBjYXNlIFwiZGVsZXRlUHJvamVjdFwiOlxuICAgIGNhc2UgXCJkZWxldGVIYWJpdFwiOlxuICAgIGNhc2UgXCJkZWxldGVWaXNpb25cIjpcbiAgICBjYXNlIFwiZGVsZXRlQmxvY2tcIjpcbiAgICBjYXNlIFwiZGVsZXRlTG9ja1NjaGVkdWxlXCI6XG4gICAgICByZXR1cm4geyB0eXBlLCBpZDogc3RyKFwiaWRcIikgfTtcbiAgICBjYXNlIFwic2F2ZVRhc2tcIjpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIHRhc2s6IHBhcnNlVGFza0RyYWZ0KHJlcXVpcmVkRmllbGQocmF3LCBcInRhc2tcIiwgXCJcdTUyQThcdTRGNUNcIiwgKHYpID0+IHYpKSxcbiAgICAgIH07XG4gICAgY2FzZSBcInJlc3RvcmVUYXNrXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICB0YXNrOiBwYXJzZVRhc2socmVxdWlyZWRGaWVsZChyYXcsIFwidGFza1wiLCBcIlx1NTJBOFx1NEY1Q1wiLCAodikgPT4gdikpLFxuICAgICAgfTtcbiAgICBjYXNlIFwidG9nZ2xlU3VidGFza1wiOlxuICAgICAgcmV0dXJuIHsgdHlwZSwgdGFza0lkOiBzdHIoXCJ0YXNrSWRcIiksIHN1YnRhc2tJZDogc3RyKFwic3VidGFza0lkXCIpIH07XG4gICAgY2FzZSBcInNhdmVQcm9qZWN0XCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBpZDogb3B0U3RyKFwiaWRcIiksXG4gICAgICAgIG5hbWU6IHN0cihcIm5hbWVcIiksXG4gICAgICAgIGNvbG9yOiBzdHIoXCJjb2xvclwiKSxcbiAgICAgICAgZGlyZWN0b3J5OiBvcHRTdHIoXCJkaXJlY3RvcnlcIiksXG4gICAgICB9O1xuICAgIGNhc2UgXCJyZW5hbWVQcm9qZWN0RGlyZWN0b3J5XCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBpZDogc3RyKFwiaWRcIiksXG4gICAgICAgIG5hbWU6IHN0cihcIm5hbWVcIiksXG4gICAgICAgIGNvbG9yOiBzdHIoXCJjb2xvclwiKSxcbiAgICAgICAgZGlyZWN0b3J5OiBzdHIoXCJkaXJlY3RvcnlcIiksXG4gICAgICB9O1xuICAgIGNhc2UgXCJzZXRQcm9qZWN0V2hpdGVsaXN0XCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBpZDogc3RyKFwiaWRcIiksXG4gICAgICAgIHdoaXRlbGlzdDogZmllbGQoXG4gICAgICAgICAgcmF3LFxuICAgICAgICAgIFwid2hpdGVsaXN0XCIsXG4gICAgICAgICAgXCJcdTUyQThcdTRGNUNcIixcbiAgICAgICAgICAodikgPT5cbiAgICAgICAgICAgIGFzT3B0KHYsIFwid2hpdGVsaXN0XCIsICh4KSA9PlxuICAgICAgICAgICAgICBhc0FycmF5KHgsIFwid2hpdGVsaXN0XCIpLm1hcCgoYSkgPT4gYXNTdHIoYSwgXCJ3aGl0ZWxpc3RcIikpLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICBudWxsLFxuICAgICAgICApIGFzIHN0cmluZ1tdIHwgbnVsbCxcbiAgICAgIH07XG4gICAgY2FzZSBcInJlb3JkZXJQcm9qZWN0c1wiOlxuICAgICAgcmV0dXJuIHsgdHlwZSwgaWRzOiBzdHJzKFwiaWRzXCIpIH07XG4gICAgY2FzZSBcImRldGFjaFRhc2tzXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBpZHM6IHN0cnMoXCJpZHNcIiksXG4gICAgICAgIHRhcmdldDogb25lT2YoXG4gICAgICAgICAgcmVxdWlyZWRGaWVsZChyYXcsIFwidGFyZ2V0XCIsIFwiXHU1MkE4XHU0RjVDXCIsICh2KSA9PiB2KSxcbiAgICAgICAgICBcImRldGFjaCB0YXJnZXRcIixcbiAgICAgICAgICBbXCJwcm9qZWN0XCIsIFwiaGFiaXRcIl0sXG4gICAgICAgICkgYXMgRGV0YWNoVGFyZ2V0LFxuICAgICAgfTtcbiAgICBjYXNlIFwic2F2ZUhhYml0R3JvdXBcIjpcbiAgICAgIHJldHVybiB7IHR5cGUsIGlkOiBvcHRTdHIoXCJpZFwiKSwgbmFtZTogc3RyKFwibmFtZVwiKSB9O1xuICAgIGNhc2UgXCJzYXZlSGFiaXRcIjpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIGlkOiBvcHRTdHIoXCJpZFwiKSxcbiAgICAgICAgbmFtZTogc3RyKFwibmFtZVwiKSxcbiAgICAgICAgcHJvamVjdElkOiBvcHRTdHIoXCJwcm9qZWN0SWRcIiksXG4gICAgICAgIGZvY3VzTWludXRlczogZmllbGQoXG4gICAgICAgICAgcmF3LFxuICAgICAgICAgIFwiZm9jdXNNaW51dGVzXCIsXG4gICAgICAgICAgXCJcdTUyQThcdTRGNUNcIixcbiAgICAgICAgICAodikgPT4gYXNPcHQodiwgXCJmb2N1c01pbnV0ZXNcIiwgKHgpID0+IGFzSW50KHgsIFwiZm9jdXNNaW51dGVzXCIpKSxcbiAgICAgICAgICBudWxsLFxuICAgICAgICApIGFzIG51bWJlciB8IG51bGwsXG4gICAgICAgIHNsb3RzOiBmaWVsZChcbiAgICAgICAgICByYXcsXG4gICAgICAgICAgXCJzbG90c1wiLFxuICAgICAgICAgIFwiXHU1MkE4XHU0RjVDXCIsXG4gICAgICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJzbG90c1wiKS5tYXAocGFyc2VIYWJpdFNsb3QpLFxuICAgICAgICAgIFtdLFxuICAgICAgICApLFxuICAgICAgfTtcbiAgICBjYXNlIFwic2F2ZVZpc2lvblwiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZSxcbiAgICAgICAgaWQ6IG9wdFN0cihcImlkXCIpLFxuICAgICAgICBuYW1lOiBzdHIoXCJuYW1lXCIpLFxuICAgICAgICBub3RlczogZmllbGQocmF3LCBcIm5vdGVzXCIsIFwiXHU1MkE4XHU0RjVDXCIsIGFzU3RyLCBcIlwiKSxcbiAgICAgICAgcHJvamVjdElkOiBvcHRTdHIoXCJwcm9qZWN0SWRcIiksXG4gICAgICB9O1xuICAgIGNhc2UgXCJzYXZlQmxvY2tcIjpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIGlkOiBvcHRTdHIoXCJpZFwiKSxcbiAgICAgICAgdGl0bGU6IHN0cihcInRpdGxlXCIpLFxuICAgICAgICBkYXlzOiBhc0FycmF5KFxuICAgICAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcImRheXNcIiwgXCJcdTUyQThcdTRGNUNcIiwgKHYpID0+IHYpLFxuICAgICAgICAgIFwiZGF5c1wiLFxuICAgICAgICApLm1hcCgoZCkgPT4gYXNJbnQoZCwgXCJkYXlzXCIpKSxcbiAgICAgICAgc3RhcnQ6IHN0cihcInN0YXJ0XCIpLFxuICAgICAgICBlbmQ6IHN0cihcImVuZFwiKSxcbiAgICAgICAgYXR0ZW50aW9uOiBmaWVsZChcbiAgICAgICAgICByYXcsXG4gICAgICAgICAgXCJhdHRlbnRpb25cIixcbiAgICAgICAgICBcIlx1NTJBOFx1NEY1Q1wiLFxuICAgICAgICAgICh2KSA9PiBvbmVPZih2LCBcImF0dGVudGlvblwiLCBbXCJyZXF1aXJlZFwiLCBcImxpZ2h0XCJdKSxcbiAgICAgICAgICBcInJlcXVpcmVkXCIsXG4gICAgICAgICkgYXMgQXR0ZW50aW9uLFxuICAgICAgICBub3RlczogZmllbGQocmF3LCBcIm5vdGVzXCIsIFwiXHU1MkE4XHU0RjVDXCIsIGFzU3RyLCBcIlwiKSxcbiAgICAgIH07XG4gICAgY2FzZSBcInNlbGVjdFRhc2tcIjpcbiAgICAgIHJldHVybiB7IHR5cGUsIGlkOiBvcHRTdHIoXCJpZFwiKSB9O1xuICAgIGNhc2UgXCJzdGFydFRpbWVyXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBtaW51dGVzOiBmaWVsZChcbiAgICAgICAgICByYXcsXG4gICAgICAgICAgXCJtaW51dGVzXCIsXG4gICAgICAgICAgXCJcdTUyQThcdTRGNUNcIixcbiAgICAgICAgICAodikgPT4gYXNPcHQodiwgXCJtaW51dGVzXCIsICh4KSA9PiBhc0ludCh4LCBcIm1pbnV0ZXNcIikpLFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICkgYXMgbnVtYmVyIHwgbnVsbCxcbiAgICAgIH07XG4gICAgY2FzZSBcImNvbXBsZXRlRm9jdXNcIjpcbiAgICBjYXNlIFwicGF1c2VUaW1lclwiOlxuICAgIGNhc2UgXCJyZXNldFRpbWVyXCI6XG4gICAgY2FzZSBcInNraXBUaW1lclwiOlxuICAgIGNhc2UgXCJsb2FkRXhhbXBsZVwiOlxuICAgIGNhc2UgXCJlbWVyZ2VuY3lVbmxvY2tcIjpcbiAgICBjYXNlIFwicmVhcm1Mb2NrXCI6XG4gICAgICByZXR1cm4geyB0eXBlIH07XG4gICAgY2FzZSBcInNldE1vZGVcIjpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIG1vZGU6IG9uZU9mKFxuICAgICAgICAgIHJlcXVpcmVkRmllbGQocmF3LCBcIm1vZGVcIiwgXCJcdTUyQThcdTRGNUNcIiwgKHYpID0+IHYpLFxuICAgICAgICAgIFwibW9kZVwiLFxuICAgICAgICAgIFtcImZvY3VzXCIsIFwic2hvcnRCcmVha1wiLCBcImxvbmdCcmVha1wiXSxcbiAgICAgICAgKSBhcyBNb2RlLFxuICAgICAgfTtcbiAgICBjYXNlIFwic2F2ZVNldHRpbmdzXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBzZXR0aW5nczogcGFyc2VTZXR0aW5ncyhcbiAgICAgICAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJzZXR0aW5nc1wiLCBcIlx1NTJBOFx1NEY1Q1wiLCAodikgPT4gdiksXG4gICAgICAgICksXG4gICAgICB9O1xuICAgIGNhc2UgXCJpbXBvcnRcIjpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIGRhdGE6IHBhcnNlQXBwRGF0YShyZXF1aXJlZEZpZWxkKHJhdywgXCJkYXRhXCIsIFwiXHU1MkE4XHU0RjVDXCIsICh2KSA9PiB2KSksXG4gICAgICB9O1xuICAgIGNhc2UgXCJpbXBvcnRQbGFuXCI6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBwbGFuOiBwYXJzZVBsYW5GaWxlKHJlcXVpcmVkRmllbGQocmF3LCBcInBsYW5cIiwgXCJcdTUyQThcdTRGNUNcIiwgKHYpID0+IHYpKSxcbiAgICAgIH07XG4gICAgY2FzZSBcInNhdmVMb2NrU2NoZWR1bGVcIjpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIHNjaGVkdWxlOiBwYXJzZUxvY2tTY2hlZHVsZShcbiAgICAgICAgICByZXF1aXJlZEZpZWxkKHJhdywgXCJzY2hlZHVsZVwiLCBcIlx1NTJBOFx1NEY1Q1wiLCAodikgPT4gdiksXG4gICAgICAgICksXG4gICAgICB9O1xuICAgIGNhc2UgXCJzdGFydFF1aWNrTG9ja1wiOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZSxcbiAgICAgICAgbWludXRlczogcmVxdWlyZWRGaWVsZChyYXcsIFwibWludXRlc1wiLCBcIlx1NTJBOFx1NEY1Q1wiLCBhc0ludCksXG4gICAgICAgIHN0cmljdDogcmVxdWlyZWRGaWVsZChyYXcsIFwic3RyaWN0XCIsIFwiXHU1MkE4XHU0RjVDXCIsIGFzQm9vbCksXG4gICAgICB9O1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoYFx1NTJBOFx1NEY1QyB0eXBlIFx1NTNENlx1NTAzQ1x1NjVFMFx1NjU0OFx1RkYxQSR7dHlwZX1gKTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tIEFwcERhdGEgXHU4OUUzXHU2NzkwL1x1NUU4Rlx1NTIxN1x1NTMxNiAtLS0tLS0tLS0tXG5cbmNvbnN0IEFQUF9EQVRBX0tFWVMgPSBbXG4gIFwiZWR1Y2F0aW9uXCIsXG4gIFwidmVyc2lvblwiLFxuICBcImlkZW50aXRpZXNcIixcbiAgXCJ0YXNrc1wiLFxuICBcImJsb2Nrc1wiLFxuICBcInByb2plY3RzXCIsXG4gIFwiaGFiaXRzXCIsXG4gIFwidmlzaW9uc1wiLFxuICBcInNldHRpbmdzXCIsXG4gIFwidGltZXJcIixcbiAgXCJzZXNzaW9uc1wiLFxuICBcImxvY2tcIixcbl0gYXMgY29uc3Q7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFwcERhdGEocmF3OiB1bmtub3duKTogQXBwRGF0YSB7XG4gIGlmICghaXNPYmplY3QocmF3KSkgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2NTcwXHU2MzZFXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICByZWplY3RVbmtub3duKHJhdywgWy4uLkFQUF9EQVRBX0tFWVNdLCBcIlx1NjU3MFx1NjM2RVwiKTtcbiAgcmV0dXJuIG5ldyBBcHBEYXRhKHtcbiAgICBlZHVjYXRpb246IGZpZWxkKHJhdywgXCJlZHVjYXRpb25cIiwgXCJcdTY1NzBcdTYzNkVcIiwgcGFyc2VFZHVjYXRpb24sIG5ldyBFZHVjYXRpb24oKSksXG4gICAgdmVyc2lvbjogcmVxdWlyZWRGaWVsZChyYXcsIFwidmVyc2lvblwiLCBcIlx1NjU3MFx1NjM2RVwiLCBhc0ludCksXG4gICAgaWRlbnRpdGllczogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcImlkZW50aXRpZXNcIixcbiAgICAgIFwiXHU2NTcwXHU2MzZFXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcImlkZW50aXRpZXNcIikubWFwKHBhcnNlSWRlbnRpdHkpLFxuICAgICAgW10sXG4gICAgKSxcbiAgICB0YXNrczogZmllbGQoXG4gICAgICByYXcsXG4gICAgICBcInRhc2tzXCIsXG4gICAgICBcIlx1NjU3MFx1NjM2RVwiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJ0YXNrc1wiKS5tYXAocGFyc2VUYXNrKSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgYmxvY2tzOiBmaWVsZChcbiAgICAgIHJhdyxcbiAgICAgIFwiYmxvY2tzXCIsXG4gICAgICBcIlx1NjU3MFx1NjM2RVwiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJibG9ja3NcIikubWFwKHBhcnNlQmxvY2spLFxuICAgICAgW10sXG4gICAgKSxcbiAgICBwcm9qZWN0czogcmVxdWlyZWRGaWVsZChyYXcsIFwicHJvamVjdHNcIiwgXCJcdTY1NzBcdTYzNkVcIiwgKHYpID0+XG4gICAgICBhc0FycmF5KHYsIFwicHJvamVjdHNcIikubWFwKHBhcnNlUHJvamVjdCksXG4gICAgKSxcbiAgICBoYWJpdHM6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJoYWJpdHNcIixcbiAgICAgIFwiXHU2NTcwXHU2MzZFXCIsXG4gICAgICAodikgPT4gYXNBcnJheSh2LCBcImhhYml0c1wiKS5tYXAocGFyc2VIYWJpdCksXG4gICAgICBbXSxcbiAgICApLFxuICAgIHZpc2lvbnM6IGZpZWxkKFxuICAgICAgcmF3LFxuICAgICAgXCJ2aXNpb25zXCIsXG4gICAgICBcIlx1NjU3MFx1NjM2RVwiLFxuICAgICAgKHYpID0+IGFzQXJyYXkodiwgXCJ2aXNpb25zXCIpLm1hcChwYXJzZVZpc2lvbiksXG4gICAgICBbXSxcbiAgICApLFxuICAgIHNldHRpbmdzOiByZXF1aXJlZEZpZWxkKHJhdywgXCJzZXR0aW5nc1wiLCBcIlx1NjU3MFx1NjM2RVwiLCBwYXJzZVNldHRpbmdzKSxcbiAgICB0aW1lcjogcmVxdWlyZWRGaWVsZChyYXcsIFwidGltZXJcIiwgXCJcdTY1NzBcdTYzNkVcIiwgcGFyc2VUaW1lciksXG4gICAgc2Vzc2lvbnM6IHJlcXVpcmVkRmllbGQocmF3LCBcInNlc3Npb25zXCIsIFwiXHU2NTcwXHU2MzZFXCIsICh2KSA9PlxuICAgICAgYXNBcnJheSh2LCBcInNlc3Npb25zXCIpLm1hcChwYXJzZVNlc3Npb24pLFxuICAgICksXG4gICAgbG9jazogZmllbGQocmF3LCBcImxvY2tcIiwgXCJcdTY1NzBcdTYzNkVcIiwgcGFyc2VMb2NrU3RhdGUsIHtcbiAgICAgIHNjaGVkdWxlczogW10sXG4gICAgICBhY3RpdmU6IG51bGwsXG4gICAgICBzdXBwcmVzc2VkVW50aWw6IDAsXG4gICAgfSksXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplQXBwRGF0YShkYXRhOiBBcHBEYXRhKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4ge1xuICAgIGVkdWNhdGlvbjogc2VyaWFsaXplRWR1Y2F0aW9uKGRhdGEuZWR1Y2F0aW9uKSxcbiAgICB2ZXJzaW9uOiBkYXRhLnZlcnNpb24sXG4gICAgaWRlbnRpdGllczogZGF0YS5pZGVudGl0aWVzLm1hcChzZXJpYWxpemVJZGVudGl0eSksXG4gICAgdGFza3M6IGRhdGEudGFza3MubWFwKHNlcmlhbGl6ZVRhc2spLFxuICAgIGJsb2NrczogZGF0YS5ibG9ja3MubWFwKHNlcmlhbGl6ZUJsb2NrKSxcbiAgICBwcm9qZWN0czogZGF0YS5wcm9qZWN0cy5tYXAoc2VyaWFsaXplUHJvamVjdCksXG4gICAgaGFiaXRzOiBkYXRhLmhhYml0cy5tYXAoc2VyaWFsaXplSGFiaXQpLFxuICAgIHZpc2lvbnM6IGRhdGEudmlzaW9ucy5tYXAoc2VyaWFsaXplVmlzaW9uKSxcbiAgICBzZXR0aW5nczogc2VyaWFsaXplU2V0dGluZ3MoZGF0YS5zZXR0aW5ncyksXG4gICAgdGltZXI6IHNlcmlhbGl6ZVRpbWVyKGRhdGEudGltZXIpLFxuICAgIHNlc3Npb25zOiBkYXRhLnNlc3Npb25zLm1hcChzZXJpYWxpemVTZXNzaW9uKSxcbiAgICBsb2NrOiBzZXJpYWxpemVMb2NrU3RhdGUoZGF0YS5sb2NrKSxcbiAgfTtcbn1cblxuaW1wb3J0IHsgdmFsaWRhdGVCbG9jayB9IGZyb20gXCIuL2Jsb2Nrc1wiO1xuaW1wb3J0IHsgaXNBYnNvbHV0ZVBhdGggfSBmcm9tIFwiLi9lZHVjYXRpb25cIjtcbiIsICIvLyEgXHU0RUM1XHU2NzJDXHU1NzMwIHYzL3Y0XHUyMTkydjUgXHU4RjZDXHU2MzYyXHVGRjFBXHU0RUE0XHU2MzYyXHU2NTg3XHU0RUY2XHU2MzA5XHU1RjUzXHU1MjREXHU3MjQ4XHU2NzJDXHU0RTI1XHU2ODNDXHU2ODIxXHU5QThDXHVGRjBDXHU0RTBEXHU4RDcwXHU4RkMxXHU3OUZCXHU4REVGXHU1Rjg0XHUzMDAyXG4vLyEgXHU1QkY5XHU1RTk0IGNyYXRlcy9jb3JlL3NyYy9taWdyYXRpb24ucnNcdUZGMDhcdTRFQzVcdTY1ODdcdTRFRjZcdTY4M0NcdTVGMEZcdThCRURcdTRFNDlcdUZGMDlcdTMwMDJcblxuaW1wb3J0IHsgaWQgfSBmcm9tIFwiLi9pZHNcIjtcbmltcG9ydCB7IEFwcEVycm9yIH0gZnJvbSBcIi4vZXJyb3JzXCI7XG5pbXBvcnQge1xuICBhZGREYXlzLFxuICBmb3JtYXREYXRlLFxuICBwYXJzZURhdGUsXG4gIHdlZWtkYXlNb25kYXksXG4gIGRhdGVBdCxcbiAgbm93LFxufSBmcm9tIFwiLi90aW1lXCI7XG5pbXBvcnQgeyBwYXJzZUFwcERhdGEsIHBhcnNlVGFzaywgc2VyaWFsaXplVGFzayB9IGZyb20gXCIuL2xpYlwiO1xuXG5mdW5jdGlvbiB1cGdyYWRlVGFza1ZhbHVlKHRhc2s6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCB0b2RheTogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IGRhdGUgPVxuICAgIHR5cGVvZiB0YXNrW1wiY3JlYXRlZEF0XCJdID09PSBcIm51bWJlclwiXG4gICAgICA/IGRhdGVBdCh0YXNrW1wiY3JlYXRlZEF0XCJdIGFzIG51bWJlcilcbiAgICAgIDogdG9kYXk7XG4gIGRlbGV0ZSB0YXNrW1wiZ29hbElkXCJdO1xuICBkZWxldGUgdGFza1tcIm5vZGVJZFwiXTtcbiAgaWYgKHRhc2tbXCJkdWVEYXRlXCJdID09PSB1bmRlZmluZWQgfHwgdGFza1tcImR1ZURhdGVcIl0gPT09IG51bGwpIHtcbiAgICB0YXNrW1wiZHVlRGF0ZVwiXSA9IGRhdGU7XG4gIH1cbn1cblxuLyoqXG4gKiBcdThCRkJcdTUzRDZcdTY3MkNcdTU3MzBcdTVCNThcdTUwQThcdUZGMUF2MyBcdTRFMDBcdTZCMjFcdTYwMjdcdThGNkNcdTYzNjJcdUZGMDhcdTc5RkJcdTk2NjRcdTc2RUVcdTY4MDdcdTRFM0JcdTdFQkZcdTMwMDFcdTg4NjVcdTlGNTBcdTY1RTVcdTY3MUZcdUZGMDlcdUZGMEN2NCBcdTc2RjRcdTYzQTVcdTRFMjVcdTY4M0NcdTg5RTNcdTY3OTBcdTMwMDJcbiAqIFx1OEY2Q1x1NjM2Mlx1NTkzMVx1OEQyNVx1NTM5Rlx1NjU4N1x1NEVGNlx1NEZERFx1NzU1OVx1RkYwOFx1NzUzMVx1OEMwM1x1NzUyOFx1NjVCOVx1NEZERFx1OEJDMVx1NEUwRFx1NTE5OVx1NTZERVx1RkYwOVx1MzAwMlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZExvY2FsRGF0YShyYXc6IHN0cmluZyk6IGltcG9ydChcIi4vbGliXCIpLkFwcERhdGEge1xuICBsZXQgdmFsdWU6IHVua25vd247XG4gIHRyeSB7XG4gICAgdmFsdWUgPSBKU09OLnBhcnNlKHJhdyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgQXBwRXJyb3IoYFx1NjU3MFx1NjM2RVx1OEJGQlx1NTNENlx1NTkzMVx1OEQyNVx1RkYwQ1x1NTM5Rlx1NjU4N1x1NEVGNlx1NURGMlx1NEZERFx1NzU1OVx1RkYxQSR7U3RyaW5nKGUpfWApO1xuICB9XG4gIGlmICghaXNPYmplY3QodmFsdWUpKSB7XG4gICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2NTcwXHU2MzZFXHU4QkZCXHU1M0Q2XHU1OTMxXHU4RDI1XHVGRjBDXHU1MzlGXHU2NTg3XHU0RUY2XHU1REYyXHU0RkREXHU3NTU5XHVGRjFBXHU2NUUwXHU2NTQ4XHU3Njg0XHU2NzJDXHU1NzMwXHU2NTcwXHU2MzZFXCIpO1xuICB9XG4gIGlmICh2YWx1ZVtcInZlcnNpb25cIl0gPT09IDMpIHtcbiAgICBjb25zdCB0b2RheSA9IGRhdGVBdChub3coKSk7XG4gICAgdmFsdWVbXCJ2ZXJzaW9uXCJdID0gNDtcbiAgICBkZWxldGUgdmFsdWVbXCJnb2Fsc1wiXTtcbiAgICBkZWxldGUgdmFsdWVbXCJub2RlQmluZGluZ3NcIl07XG4gICAgZGVsZXRlIHZhbHVlW1wic2lnbmFsRXZlbnRzXCJdO1xuICAgIGNvbnN0IHRhc2tzID0gdmFsdWVbXCJ0YXNrc1wiXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0YXNrcykpIHtcbiAgICAgIGZvciAoY29uc3QgdGFzayBvZiB0YXNrcykge1xuICAgICAgICBpZiAoaXNPYmplY3QodGFzaykpIHVwZ3JhZGVUYXNrVmFsdWUodGFzaywgdG9kYXkpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCB0ZW1wbGF0ZXMgPSB2YWx1ZVtcInRlbXBsYXRlc1wiXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0ZW1wbGF0ZXMpKSB7XG4gICAgICBmb3IgKGNvbnN0IHRlbXBsYXRlIG9mIHRlbXBsYXRlcykge1xuICAgICAgICBpZiAoIWlzT2JqZWN0KHRlbXBsYXRlKSkgY29udGludWU7XG4gICAgICAgIGNvbnN0IHNoYXBlID0gdGVtcGxhdGVbXCJzaGFwZVwiXTtcbiAgICAgICAgaWYgKGlzT2JqZWN0KHNoYXBlKSkgZGVsZXRlIHNoYXBlW1wiZ29hbElkXCJdO1xuICAgICAgICBjb25zdCBwcmludGluZyA9IHRlbXBsYXRlW1wicHJpbnRpbmdcIl07XG4gICAgICAgIGlmIChcbiAgICAgICAgICBpc09iamVjdChwcmludGluZykgJiZcbiAgICAgICAgICBwcmludGluZ1tcImtpbmRcIl0gPT09IFwib25jZVwiICYmXG4gICAgICAgICAgKHByaW50aW5nW1wiZGF0ZVwiXSA9PT0gbnVsbCB8fCBwcmludGluZ1tcImRhdGVcIl0gPT09IHVuZGVmaW5lZClcbiAgICAgICAgKSB7XG4gICAgICAgICAgcHJpbnRpbmdbXCJkYXRlXCJdID0gdG9kYXk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgcHJpbnRzID0gdmFsdWVbXCJwcmludHNcIl07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocHJpbnRzKSkge1xuICAgICAgdmFsdWVbXCJwcmludHNcIl0gPSBwcmludHMuZmlsdGVyKChwKSA9PiBpc09iamVjdChwKSAmJiBwW1wiZGF0ZVwiXSAhPT0gbnVsbCk7XG4gICAgfVxuICAgIGNvbnN0IHZpc2lvbnMgPSB2YWx1ZVtcInZpc2lvbnNcIl07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmlzaW9ucykpIHtcbiAgICAgIGZvciAoY29uc3QgdmlzaW9uIG9mIHZpc2lvbnMpIHtcbiAgICAgICAgaWYgKGlzT2JqZWN0KHZpc2lvbikpIGRlbGV0ZSB2aXNpb25bXCJnb2FsSWRcIl07XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGlkcyA9IHZhbHVlW1wiaWRlbnRpdGllc1wiXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpZHMpKSB7XG4gICAgICB2YWx1ZVtcImlkZW50aXRpZXNcIl0gPSBpZHMuZmlsdGVyKFxuICAgICAgICAocikgPT5cbiAgICAgICAgICBpc09iamVjdChyKSAmJlxuICAgICAgICAgICFbXCJnb2FsXCIsIFwibm9kZVwiLCBcInNpZ25hbFwiXS5pbmNsdWRlcyhyW1wia2luZFwiXSBhcyBzdHJpbmcpLFxuICAgICAgKTtcbiAgICAgIGZvciAoY29uc3QgcmVjb3JkIG9mIHZhbHVlW1wiaWRlbnRpdGllc1wiXSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVjb3JkW1wicmVzdG9yZVRhc2tcIl0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBsZXQgdGFzazogdW5rbm93bjtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGFzayA9IEpTT04ucGFyc2UocmVjb3JkW1wicmVzdG9yZVRhc2tcIl0gYXMgc3RyaW5nKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoYFx1NjU3MFx1NjM2RVx1OEJGQlx1NTNENlx1NTkzMVx1OEQyNVx1RkYwQ1x1NTM5Rlx1NjU4N1x1NEVGNlx1NURGMlx1NEZERFx1NzU1OVx1RkYxQSR7U3RyaW5nKGUpfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWlzT2JqZWN0KHRhc2spKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXG4gICAgICAgICAgICAgIFwiXHU2NTcwXHU2MzZFXHU4QkZCXHU1M0Q2XHU1OTMxXHU4RDI1XHVGRjBDXHU1MzlGXHU2NTg3XHU0RUY2XHU1REYyXHU0RkREXHU3NTU5XHVGRjFBXHU2NUUwXHU2NTQ4XHU3Njg0XHU0RUZCXHU1MkExXHU2MDYyXHU1OTBEXHU4QkIwXHU1RjU1XCIsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICB1cGdyYWRlVGFza1ZhbHVlKHRhc2ssIHRvZGF5KTtcbiAgICAgICAgICAvLyBcdTY0QTRcdTk1MDBcdTYwNjJcdTU5MERcdTZCRDRcdThGODNcdTc2N0JcdThCQjAgRFRPIFx1NzY4NFx1NUU4Rlx1NTIxN1x1NTMxNlx1RkYwOFx1NTQyQlx1OTUyRVx1NUU4Rlx1RkYwOVx1MzAwMlxuICAgICAgICAgIHJlY29yZFtcInJlc3RvcmVUYXNrXCJdID0gSlNPTi5zdHJpbmdpZnkodGFzayk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKHZhbHVlW1widmVyc2lvblwiXSA9PT0gNCkgdXBncmFkZVJlY3VycmluZ1Rhc2tzKHZhbHVlKTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcGFyc2VBcHBEYXRhKHZhbHVlKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IG5ldyBBcHBFcnJvcihcbiAgICAgIGBcdTY1NzBcdTYzNkVcdThCRkJcdTUzRDZcdTU5MzFcdThEMjVcdUZGMENcdTUzOUZcdTY1ODdcdTRFRjZcdTVERjJcdTRGRERcdTc1NTlcdUZGMUEke2UgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKX1gLFxuICAgICk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNPYmplY3QodjogdW5rbm93bik6IHYgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4gdHlwZW9mIHYgPT09IFwib2JqZWN0XCIgJiYgdiAhPT0gbnVsbCAmJiAhQXJyYXkuaXNBcnJheSh2KTtcbn1cblxuLyoqIFx1NTNFQVx1OEY2Q1x1NjM2Mlx1NjcyQ1x1NjczQVx1NjVFN1x1NkEyMVx1NTc4Qlx1RkYxQlx1NEVBNFx1NjM2Mlx1NjU4N1x1NEVGNlx1NEVDRFx1NEUyNVx1NjgzQ1x1NjJEMlx1N0VERFx1NjVFN1x1NzI0OFx1NjcyQ1x1MzAwMlx1NURGMlx1NTM3MFx1NEVGQlx1NTJBMVx1NEUwRVx1NTM4Nlx1NTNGMlx1NTE2OFx1OTBFOFx1NEZERFx1NzU1OVx1MzAwMiAqL1xuZnVuY3Rpb24gdXBncmFkZVJlY3VycmluZ1Rhc2tzKHZhbHVlOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQge1xuICBjb25zdCB0YXNrcyA9IEFycmF5LmlzQXJyYXkodmFsdWVbXCJ0YXNrc1wiXSlcbiAgICA/ICh2YWx1ZVtcInRhc2tzXCJdIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+W10pXG4gICAgOiBbXTtcbiAgY29uc3QgdG9kYXkgPSBkYXRlQXQobm93KCkpO1xuICBjb25zdCB1cGdyYWRlID0gKHRhc2s6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCA9PiB7XG4gICAgZGVsZXRlIHRhc2tbXCJ0ZW1wbGF0ZUlkXCJdO1xuICAgIHRhc2tbXCJyZXBlYXRcIl0gPSB0YXNrW1wicmVwZWF0XCJdID8/IFwibm9uZVwiO1xuICAgIHRhc2tbXCJyZXBlYXREYXlzXCJdID0gdGFza1tcInJlcGVhdERheXNcIl0gPz8gW107XG4gICAgdGFza1tcIm5leHRUYXNrSWRcIl0gPSB0YXNrW1wibmV4dFRhc2tJZFwiXSA/PyBudWxsO1xuICAgIGlmICh0YXNrW1wiZHVlRGF0ZVwiXSA9PSBudWxsICYmIHRhc2tbXCJyZXBlYXRcIl0gPT09IFwibm9uZVwiKVxuICAgICAgdGFza1tcInJlcGVhdFwiXSA9IFwiZGFpbHlcIjtcbiAgICB0YXNrW1wicmVjdXJyaW5nXCJdID0gdGFza1tcInJlY3VycmluZ1wiXSA9PT0gdHJ1ZSB8fCB0YXNrW1wicmVwZWF0XCJdICE9PSBcIm5vbmVcIjtcbiAgICBpZiAodGFza1tcInJlY3VycmluZ1wiXSB8fCB0YXNrW1wicmVtaW5kZXJUaW1lXCJdID09IG51bGwpXG4gICAgICB0YXNrW1wicmVtaW5kZXJFeHBpcmVkXCJdID0gZmFsc2U7XG4gIH07XG4gIGNvbnN0IHRlbXBsYXRlcyA9IEFycmF5LmlzQXJyYXkodmFsdWVbXCJ0ZW1wbGF0ZXNcIl0pID8gdmFsdWVbXCJ0ZW1wbGF0ZXNcIl0gOiBbXTtcbiAgY29uc3QgcHJpbnRzID0gQXJyYXkuaXNBcnJheSh2YWx1ZVtcInByaW50c1wiXSkgPyB2YWx1ZVtcInByaW50c1wiXSA6IFtdO1xuICBjb25zdCBtYWtlVGFzayA9IChcbiAgICBzaGFwZTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgZGF0ZTogc3RyaW5nLFxuICAgIHRpbWU6IHVua25vd24sXG4gICk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0+ICh7XG4gICAgaWQ6IGlkKCksXG4gICAgdGl0bGU6IHNoYXBlW1widGl0bGVcIl0sXG4gICAgbm90ZXM6IHNoYXBlW1wibm90ZXNcIl0gPz8gXCJcIixcbiAgICBwcm9qZWN0SWQ6IHNoYXBlW1wicHJvamVjdElkXCJdID8/IG51bGwsXG4gICAgaGFiaXRJZDogc2hhcGVbXCJoYWJpdElkXCJdID8/IG51bGwsXG4gICAgZm9jdXNNaW51dGVzOiBzaGFwZVtcImZvY3VzTWludXRlc1wiXSA/PyBudWxsLFxuICAgIHNjcmFwTWludXRlczogc2hhcGVbXCJzY3JhcE1pbnV0ZXNcIl0gPz8gMCxcbiAgICBleHBpcnlEYXlzOiAwLFxuICAgIHByaW9yaXR5OiBzaGFwZVtcInByaW9yaXR5XCJdID8/IDAsXG4gICAgZXN0aW1hdGU6IHNoYXBlW1wiZXN0aW1hdGVcIl0gPz8gMSxcbiAgICB0YWdzOiBzaGFwZVtcInRhZ3NcIl0gPz8gW10sXG4gICAgZHVlRGF0ZTogZGF0ZSxcbiAgICByZW1pbmRlclRpbWU6IHRpbWUgPz8gbnVsbCxcbiAgICByZWN1cnJpbmc6IGZhbHNlLFxuICAgIGNvbXBsZXRlZDogZmFsc2UsXG4gICAgY29tcGxldGVkQXQ6IG51bGwsXG4gICAgY3JlYXRlZEF0OiBub3coKSxcbiAgICByZW1pbmRlckZpcmVkOiBmYWxzZSxcbiAgICByZW1pbmRlclBlbmRpbmc6IGZhbHNlLFxuICAgIHJlbWluZGVyRXhwaXJlZDogZmFsc2UsXG4gICAgc3VidGFza3M6IEFycmF5LmlzQXJyYXkoc2hhcGVbXCJzdWJ0YXNrc1wiXSlcbiAgICAgID8gc2hhcGVbXCJzdWJ0YXNrc1wiXS5tYXAoKHN1YikgPT4gKHsgLi4uc3ViLCBkb25lOiBmYWxzZSB9KSlcbiAgICAgIDogW10sXG4gIH0pO1xuICBmb3IgKGNvbnN0IHRlbXBsYXRlIG9mIHRlbXBsYXRlcykge1xuICAgIGlmIChcbiAgICAgICFpc09iamVjdCh0ZW1wbGF0ZSkgfHxcbiAgICAgICFpc09iamVjdCh0ZW1wbGF0ZVtcInByaW50aW5nXCJdKSB8fFxuICAgICAgIWlzT2JqZWN0KHRlbXBsYXRlW1wic2hhcGVcIl0pXG4gICAgKVxuICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2NUU3XHU2QTIxXHU2NzdGXHU2ODNDXHU1RjBGXHU2NUUwXHU2NTQ4XHVGRjBDXHU1MzlGXHU2NTg3XHU0RUY2XHU1REYyXHU0RkREXHU3NTU5XCIpO1xuICAgIGNvbnN0IHByaW50aW5nID0gdGVtcGxhdGVbXCJwcmludGluZ1wiXTtcbiAgICBjb25zdCBzaGFwZSA9IHRlbXBsYXRlW1wic2hhcGVcIl07XG4gICAgaWYgKHByaW50aW5nW1wia2luZFwiXSAhPT0gXCJ3ZWVrbHlcIikge1xuICAgICAgY29uc3Qgc2xvdHMgPVxuICAgICAgICBwcmludGluZ1tcImtpbmRcIl0gPT09IFwib25jZVwiXG4gICAgICAgICAgPyBbeyBkYXRlczogW3ByaW50aW5nW1wiZGF0ZVwiXV0sIHRpbWU6IHByaW50aW5nW1widGltZVwiXSB9XVxuICAgICAgICAgIDogcHJpbnRpbmdbXCJzbG90c1wiXTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShzbG90cykpXG4gICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NjVFN1x1NjVFNVx1N0EwQlx1NjgzQ1x1NUYwRlx1NjVFMFx1NjU0OFx1RkYwQ1x1NTM5Rlx1NjU4N1x1NEVGNlx1NURGMlx1NEZERFx1NzU1OVwiKTtcbiAgICAgIGZvciAoY29uc3Qgc2xvdCBvZiBzbG90cykge1xuICAgICAgICBpZiAoIWlzT2JqZWN0KHNsb3QpIHx8ICFBcnJheS5pc0FycmF5KHNsb3RbXCJkYXRlc1wiXSkpXG4gICAgICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFwiXHU2NUU3XHU2NUU1XHU3QTBCXHU2ODNDXHU1RjBGXHU2NUUwXHU2NTQ4XHVGRjBDXHU1MzlGXHU2NTg3XHU0RUY2XHU1REYyXHU0RkREXHU3NTU5XCIpO1xuICAgICAgICBmb3IgKGNvbnN0IGRhdGUgb2Ygc2xvdFtcImRhdGVzXCJdKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBkYXRlICE9PSBcInN0cmluZ1wiIHx8IHBhcnNlRGF0ZShkYXRlKSA9PT0gbnVsbClcbiAgICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NjVFN1x1NjVFNVx1N0EwQlx1NjVFNVx1NjcxRlx1NjVFMFx1NjU0OFx1RkYwQ1x1NTM5Rlx1NjU4N1x1NEVGNlx1NURGMlx1NEZERFx1NzU1OVwiKTtcbiAgICAgICAgICBjb25zdCBwcmludGVkID0gcHJpbnRzLnNvbWUoXG4gICAgICAgICAgICAocCkgPT5cbiAgICAgICAgICAgICAgaXNPYmplY3QocCkgJiZcbiAgICAgICAgICAgICAgcFtcInRlbXBsYXRlSWRcIl0gPT09IHRlbXBsYXRlW1wiaWRcIl0gJiZcbiAgICAgICAgICAgICAgcFtcImRhdGVcIl0gPT09IGRhdGUsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjb25zdCBleGlzdHMgPSB0YXNrcy5zb21lKFxuICAgICAgICAgICAgKHQpID0+IHRbXCJ0ZW1wbGF0ZUlkXCJdID09PSB0ZW1wbGF0ZVtcImlkXCJdICYmIHRbXCJkdWVEYXRlXCJdID09PSBkYXRlLFxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKCFwcmludGVkICYmICFleGlzdHMpXG4gICAgICAgICAgICB0YXNrcy5wdXNoKG1ha2VUYXNrKHNoYXBlLCBkYXRlLCBzbG90W1widGltZVwiXSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3Qgc2xvdHMgPSBBcnJheS5pc0FycmF5KHByaW50aW5nW1wic2xvdHNcIl0pID8gcHJpbnRpbmdbXCJzbG90c1wiXSA6IFtdO1xuICAgIGZvciAoY29uc3Qgc2xvdCBvZiBzbG90cykge1xuICAgICAgaWYgKFxuICAgICAgICAhaXNPYmplY3Qoc2xvdCkgfHxcbiAgICAgICAgIUFycmF5LmlzQXJyYXkoc2xvdFtcImRheXNcIl0pIHx8XG4gICAgICAgIHNsb3RbXCJkYXlzXCJdLmxlbmd0aCA9PT0gMFxuICAgICAgKVxuICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTY1RTdcdTZBMjFcdTY3N0ZcdTUzMDVcdTU0MkJcdTdBN0FcdTY2MUZcdTY3MUZcdUZGMENcdTUzOUZcdTY1ODdcdTRFRjZcdTVERjJcdTRGRERcdTc1NTlcIik7XG4gICAgICBjb25zdCBkYXlzID0gc2xvdFtcImRheXNcIl0gYXMgbnVtYmVyW107XG4gICAgICBpZiAoIWRheXMuZXZlcnkoKGQpID0+IE51bWJlci5pc0ludGVnZXIoZCkgJiYgZCA+PSAxICYmIGQgPD0gNykpXG4gICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NjVFN1x1NkEyMVx1Njc3Rlx1NTMwNVx1NTQyQlx1NjVFMFx1NjU0OFx1NjYxRlx1NjcxRlx1RkYwQ1x1NTM5Rlx1NjU4N1x1NEVGNlx1NURGMlx1NEZERFx1NzU1OVwiKTtcbiAgICAgIC8vIFx1NjVFMlx1NjcwOVx1OTg4NFx1NTM3MFx1NEVGQlx1NTJBMVx1NEUwRFx1NTIyMFx1RkYxQlx1NjcwMFx1NTQwRVx1NEUwMFx1Njc2MVx1NjcyQVx1NUI4Q1x1NjIxMFx1NEVGQlx1NTJBMVx1NjNBNVx1N0JBMVx1NTQwRVx1N0VFRFx1NUZBQVx1NzNBRlx1MzAwMlxuICAgICAgY29uc3QgbWF0Y2hlcyA9IHRhc2tzXG4gICAgICAgIC5maWx0ZXIoXG4gICAgICAgICAgKHQpID0+XG4gICAgICAgICAgICB0W1widGVtcGxhdGVJZFwiXSA9PT0gdGVtcGxhdGVbXCJpZFwiXSAmJlxuICAgICAgICAgICAgdFtcInJlbWluZGVyVGltZVwiXSA9PT0gKHNsb3RbXCJ0aW1lXCJdID8/IG51bGwpICYmXG4gICAgICAgICAgICB0W1wiY29tcGxldGVkXCJdICE9PSB0cnVlICYmXG4gICAgICAgICAgICB0eXBlb2YgdFtcImR1ZURhdGVcIl0gPT09IFwic3RyaW5nXCIgJiZcbiAgICAgICAgICAgIHBhcnNlRGF0ZSh0W1wiZHVlRGF0ZVwiXSBhcyBzdHJpbmcpICE9PSBudWxsICYmXG4gICAgICAgICAgICBkYXlzLmluY2x1ZGVzKHdlZWtkYXlNb25kYXkocGFyc2VEYXRlKHRbXCJkdWVEYXRlXCJdIGFzIHN0cmluZykhKSksXG4gICAgICAgIClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+XG4gICAgICAgICAgU3RyaW5nKGFbXCJkdWVEYXRlXCJdKS5sb2NhbGVDb21wYXJlKFN0cmluZyhiW1wiZHVlRGF0ZVwiXSkpLFxuICAgICAgICApO1xuICAgICAgbGV0IHRhc2sgPSBtYXRjaGVzLmF0KC0xKTtcbiAgICAgIGlmICghdGFzaykge1xuICAgICAgICBsZXQgZGF0ZSA9IHBhcnNlRGF0ZSh0b2RheSkhO1xuICAgICAgICB3aGlsZSAoIWRheXMuaW5jbHVkZXMod2Vla2RheU1vbmRheShkYXRlKSkpIGRhdGUgPSBhZGREYXlzKGRhdGUsIDEpO1xuICAgICAgICB0YXNrID0gbWFrZVRhc2soc2hhcGUsIGZvcm1hdERhdGUoZGF0ZSksIHNsb3RbXCJ0aW1lXCJdKTtcbiAgICAgICAgdGFza3MucHVzaCh0YXNrKTtcbiAgICAgIH1cbiAgICAgIHRhc2tbXCJyZXBlYXRcIl0gPSBcIndlZWtseVwiO1xuICAgICAgdGFza1tcInJlcGVhdERheXNcIl0gPSBbLi4uZGF5c107XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgdGFzayBvZiB0YXNrcykgdXBncmFkZSh0YXNrKTtcbiAgdmFsdWVbXCJ0YXNrc1wiXSA9IHRhc2tzO1xuICBkZWxldGUgdmFsdWVbXCJ0ZW1wbGF0ZXNcIl07XG4gIGRlbGV0ZSB2YWx1ZVtcInByaW50c1wiXTtcbiAgY29uc3QgaWRlbnRpdGllcyA9IHZhbHVlW1wiaWRlbnRpdGllc1wiXTtcbiAgaWYgKEFycmF5LmlzQXJyYXkoaWRlbnRpdGllcykpXG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBpZGVudGl0aWVzKSB7XG4gICAgICBpZiAoIWlzT2JqZWN0KGVudHJ5KSkgY29udGludWU7XG4gICAgICBpZiAoZW50cnlbXCJraW5kXCJdID09PSBcInRlbXBsYXRlXCIpIGVudHJ5W1wicmV0aXJlZFwiXSA9IHRydWU7XG4gICAgICBpZiAodHlwZW9mIGVudHJ5W1wicmVzdG9yZVRhc2tcIl0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgY29uc3QgdGFzayA9IEpTT04ucGFyc2UoZW50cnlbXCJyZXN0b3JlVGFza1wiXSk7XG4gICAgICAgIGlmICghaXNPYmplY3QodGFzaykpIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NjVFMFx1NjU0OFx1NzY4NFx1NEVGQlx1NTJBMVx1NjA2Mlx1NTkwRFx1OEJCMFx1NUY1NVwiKTtcbiAgICAgICAgdXBncmFkZSh0YXNrKTtcbiAgICAgICAgZW50cnlbXCJyZXN0b3JlVGFza1wiXSA9IEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZVRhc2socGFyc2VUYXNrKHRhc2spKSk7XG4gICAgICB9XG4gICAgfVxuICB2YWx1ZVtcInZlcnNpb25cIl0gPSA1O1xufVxuIiwgIi8vISBcdTUzRUZcdTg5RTNcdTkxQ0FcdTc2ODRcdTY3MkNcdTU3MzBcdTRGRTFcdTUzRjdcdTMwMDJcdTRFMERcdThDMDNcdTZBMjFcdTU3OEJcdTMwMDFcdTRFMERcdTczMUNcdTdGM0FcdTU5MzFcdTY1NzBcdTYzNkVcdTMwMDFcdTRFMERcdTgxRUFcdTUyQThcdTRFMEJcdTdFRDNcdThCQkFcdTMwMDJcbi8vISBcdTVCRjlcdTVFOTQgY3JhdGVzL2NvcmUvc3JjL2RpYWdub3N0aWNzLnJzXHUzMDAyXG5cbmltcG9ydCB7IGRhdGVBdCwgbWludXRlc09mLCBwYXJzZURhdGUsIGFkZERheXMsIGZvcm1hdERhdGUgfSBmcm9tIFwiLi90aW1lXCI7XG5pbXBvcnQgdHlwZSB7IFNuYXBzaG90LCBUYXNrIH0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IGlzSGFiaXQgfSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHsgd2luZG93TWludXRlcyB9IGZyb20gXCIuL3JlbWluZGVyc1wiO1xuaW1wb3J0IHsgYmxvY2tzT25EYXRlLCBvdmVybGFwTWludXRlcywgcmVxdWlyZWRNaW51dGVzIH0gZnJvbSBcIi4vYmxvY2tzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQW5vbWFseSB7XG4gIGtleTogc3RyaW5nO1xuICBraW5kOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHNldmVyaXR5OiBzdHJpbmc7XG4gIGV2aWRlbmNlOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgcXVlc3Rpb246IHN0cmluZztcbn1cblxuZnVuY3Rpb24gc2lnbmFsKFxuICBrZXk6IHN0cmluZyxcbiAga2luZDogc3RyaW5nLFxuICB0aXRsZTogc3RyaW5nLFxuICBzZXZlcml0eTogc3RyaW5nLFxuICBldmlkZW5jZTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gIHF1ZXN0aW9uOiBzdHJpbmcsXG4pOiBBbm9tYWx5IHtcbiAgcmV0dXJuIHsga2V5LCBraW5kLCB0aXRsZSwgc2V2ZXJpdHksIGV2aWRlbmNlLCBxdWVzdGlvbiB9O1xufVxuXG5mdW5jdGlvbiBtZWRpYW4odmFsdWVzOiBudW1iZXJbXSk6IG51bWJlciB7XG4gIGNvbnN0IHNvcnRlZCA9IFsuLi52YWx1ZXNdLnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcbiAgcmV0dXJuIHNvcnRlZFtNYXRoLmZsb29yKHNvcnRlZC5sZW5ndGggLyAyKV0hO1xufVxuXG4vKipcbiAqIFx1NUJCOVx1OTFDRlx1NjYyRlx1NjYzRVx1NUYwRlx1NzUyOFx1NjIzN1x1OTg4NFx1N0I5N1x1RkYwQ1x1NTQyNlx1NTIxOVx1NTNENlx1NTM4Nlx1NTNGMlx1NkQzQlx1OERDM1x1NjVFNVx1NEUyRFx1NEY0RFx1NjU3MFx1RkYwQ1x1NjcwMFx1NTQwRVx1ODQzRFx1NTIzMFx1NkJDRlx1NjVFNVx1NzZFRVx1NjgwN1x1MzAwMlxuICogXHU1N0ZBXHU3RUJGXHU2NjJGXHU4QkMxXHU2MzZFXHVGRjBDXHU0RTBEXHU2NjJGXHU1M0VGXHU3NTI4XHU2NUY2XHU5NUY0XHUzMDAyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaWFnbm9zZShcbiAgc25hcHNob3Q6IFNuYXBzaG90LFxuICBjYXBhY2l0eU1pbnV0ZXM6IG51bWJlciB8IG51bGwsXG4pOiBBbm9tYWx5W10ge1xuICBjb25zdCBkYXRhID0gc25hcHNob3QuZGF0YTtcbiAgY29uc3QgYXQgPSBzbmFwc2hvdC5zZXJ2ZXJUaW1lO1xuICBjb25zdCB0b2RheSA9IHBhcnNlRGF0ZShzbmFwc2hvdC50b2RheSkhO1xuICBjb25zdCB3ZWVrU3RhcnQgPSBmb3JtYXREYXRlKGFkZERheXModG9kYXksIC03KSk7XG4gIGNvbnN0IG1vbnRoU3RhcnQgPSBmb3JtYXREYXRlKGFkZERheXModG9kYXksIC0yOCkpO1xuICBjb25zdCBieURheSA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gIGZvciAoY29uc3QgcyBvZiBkYXRhLnNlc3Npb25zKSB7XG4gICAgY29uc3QgZGF0ZSA9IGRhdGVBdChzLmVuZGVkQXQpO1xuICAgIGlmIChkYXRlID49IG1vbnRoU3RhcnQgJiYgZGF0ZSA8IHNuYXBzaG90LnRvZGF5KSB7XG4gICAgICBieURheS5zZXQoZGF0ZSwgKGJ5RGF5LmdldChkYXRlKSA/PyAwKSArIE1hdGguZmxvb3Iocy5kdXJhdGlvblNlY3MgLyA2MCkpO1xuICAgIH1cbiAgfVxuICBjb25zdCBhY3RpdmVNaW51dGVzID0gWy4uLmJ5RGF5LnZhbHVlcygpXS5maWx0ZXIoKG0pID0+IG0gPj0gMjApO1xuICBjb25zdCBoaXN0b3JpY2FsID0gYWN0aXZlTWludXRlcy5sZW5ndGggPj0gNSA/IG1lZGlhbihhY3RpdmVNaW51dGVzKSA6IG51bGw7XG4gIGNvbnN0IGNhcGFjaXR5ID1cbiAgICBjYXBhY2l0eU1pbnV0ZXMgIT09IG51bGxcbiAgICAgID8gY2FwYWNpdHlNaW51dGVzXG4gICAgICA6IGhpc3RvcmljYWwgIT09IG51bGxcbiAgICAgICAgPyBNYXRoLm1heCgzMCwgaGlzdG9yaWNhbClcbiAgICAgICAgOiBkYXRhLnNldHRpbmdzLmRhaWx5R29hbCAqIGRhdGEuc2V0dGluZ3MuZm9jdXNNaW51dGVzO1xuICBjb25zdCBjYXBhY2l0eVNvdXJjZSA9XG4gICAgY2FwYWNpdHlNaW51dGVzICE9PSBudWxsXG4gICAgICA/IFwiXHU3NTI4XHU2MjM3XHU4QkJFXHU3RjZFXHU3Njg0XHU2NUU1XHU5ODg0XHU3Qjk3XCJcbiAgICAgIDogaGlzdG9yaWNhbCAhPT0gbnVsbFxuICAgICAgICA/IFwiXHU4RkQxMjhcdTU5MjlcdTgxRjNcdTVDMTE1XHU0RTJBXHU2RDNCXHU4REMzXHU2NUU1XHU3Njg0XHU0RTJEXHU0RjREXHU2NTcwXHVGRjA4XHU1RTc2XHU5NzVFXHU1M0VGXHU3NTI4XHU2NUY2XHU5NUY0XHVGRjA5XCJcbiAgICAgICAgOiBcIlx1NkJDRlx1NjVFNVx1NzU2QVx1ODMwNFx1NzZFRVx1NjgwN1x1OTg4NFx1N0I5N1x1RkYwOFx1NUU3Nlx1OTc1RVx1NTNFRlx1NzUyOFx1NjVGNlx1OTVGNFx1RkYwOVwiO1xuICBjb25zdCBjb21wbGV0ZWRSb3VuZHMgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICBmb3IgKGNvbnN0IHMgb2YgZGF0YS5zZXNzaW9ucykge1xuICAgIGlmIChzLmNvbXBsZXRlZCAmJiBzLnRhc2tJZCAhPT0gbnVsbCkge1xuICAgICAgY29tcGxldGVkUm91bmRzLnNldChzLnRhc2tJZCwgKGNvbXBsZXRlZFJvdW5kcy5nZXQocy50YXNrSWQpID8/IDApICsgMSk7XG4gICAgfVxuICB9XG4gIGNvbnN0IHJlc3VsdDogQW5vbWFseVtdID0gW107XG4gIGZvciAobGV0IG9mZnNldCA9IDA7IG9mZnNldCA8IDM7IG9mZnNldCArPSAxKSB7XG4gICAgY29uc3QgZGF0ZSA9IGZvcm1hdERhdGUoYWRkRGF5cyh0b2RheSwgb2Zmc2V0KSk7XG4gICAgY29uc3QgdGFza3MgPSBkYXRhLnRhc2tzLmZpbHRlcihcbiAgICAgICh0KSA9PiB0LmR1ZURhdGUgPT09IGRhdGUgJiYgIXQuY29tcGxldGVkICYmICFkYXRhLnRhc2tJc1ZvaWQodCksXG4gICAgKTtcbiAgICBjb25zdCBtaW51dGVzID0gdGFza3MucmVkdWNlKFxuICAgICAgKG4sIHQpID0+XG4gICAgICAgIG4gK1xuICAgICAgICBNYXRoLm1heCgwLCB0LmVzdGltYXRlIC0gKGNvbXBsZXRlZFJvdW5kcy5nZXQodC5pZCkgPz8gMCkpICpcbiAgICAgICAgICAodC5mb2N1c01pbnV0ZXMgPz8gZGF0YS5zZXR0aW5ncy5mb2N1c01pbnV0ZXMpLFxuICAgICAgMCxcbiAgICApO1xuICAgIGNvbnN0IGRheSA9IHBhcnNlRGF0ZShkYXRlKTtcbiAgICBjb25zdCBibG9ja2VkTWludXRlcyA9IHJlcXVpcmVkTWludXRlcyhkYXRhLmJsb2NrcywgZGF0ZSk7XG4gICAgaWYgKGNhcGFjaXR5ID4gMCAmJiBtaW51dGVzICogMTAwID4gY2FwYWNpdHkgKiAxMzApIHtcbiAgICAgIHJlc3VsdC5wdXNoKFxuICAgICAgICBzaWduYWwoXG4gICAgICAgICAgYG92ZXJsb2FkLyR7ZGF0ZX1gLFxuICAgICAgICAgIFwib3ZlcmxvYWRcIixcbiAgICAgICAgICBcIlx1OEJBMVx1NTIxMlx1NzUyOFx1NjVGNlx1OUFEOFx1NEU4RVx1NUY1M1x1NTI0RFx1OTg4NFx1N0I5N1wiLFxuICAgICAgICAgIFwid2FybmluZ1wiLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGRhdGUsXG4gICAgICAgICAgICByZW1haW5pbmdQbGFubmVkTWludXRlczogbWludXRlcyxcbiAgICAgICAgICAgIGJ1ZGdldE1pbnV0ZXM6IGNhcGFjaXR5LFxuICAgICAgICAgICAgYnVkZ2V0U291cmNlOiBjYXBhY2l0eVNvdXJjZSxcbiAgICAgICAgICAgIGJsb2NrZWRNaW51dGVzLFxuICAgICAgICAgICAgdGFza0lkczogdGFza3Muc2xpY2UoMCwgMzApLm1hcCgodCkgPT4gdC5pZCksXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIlx1OEZEOVx1NEU5Qlx1NEVGQlx1NTJBMVx1NzY4NFx1OTg4NFx1OEJBMVx1NzUyOFx1NjVGNlx1NjYyRlx1NTQyNlx1NTFDNlx1Nzg2RVx1RkYxRlx1OEZEOVx1NEUwMFx1NTkyOVx1NjcwOVx1OTg5RFx1NTkxNlx1NTNFRlx1NzUyOFx1NjVGNlx1OTVGNFx1RkYwQ1x1OEZEOFx1NjYyRlx1OTcwMFx1ODk4MVx1NTFDRlx1OTFDRlx1NjIxNlx1NjMyQVx1NTJBOFx1RkYxRlwiLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgb2Zmc2V0ID09PSAxICYmXG4gICAgICBoaXN0b3JpY2FsICE9PSBudWxsICYmXG4gICAgICB0YXNrcy5sZW5ndGggPiAwICYmXG4gICAgICBtaW51dGVzICogMTAwIDwgY2FwYWNpdHkgKiAzMFxuICAgICkge1xuICAgICAgcmVzdWx0LnB1c2goXG4gICAgICAgIHNpZ25hbChcbiAgICAgICAgICBgdW5kZXJsb2FkLyR7ZGF0ZX1gLFxuICAgICAgICAgIFwidW5kZXJsb2FkXCIsXG4gICAgICAgICAgXCJcdTY2MEVcdTY1RTVcdTVCODlcdTYzOTJcdTY2MEVcdTY2M0VcdTRGNEVcdTRFOEVcdThGRDFcdTY3MUZcdTYyOTVcdTUxNjVcIixcbiAgICAgICAgICBcIm5vdGljZVwiLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGRhdGUsXG4gICAgICAgICAgICBwbGFubmVkTWludXRlczogbWludXRlcyxcbiAgICAgICAgICAgIGJhc2VsaW5lTWludXRlczogY2FwYWNpdHksXG4gICAgICAgICAgICBiYXNlbGluZVNvdXJjZTogY2FwYWNpdHlTb3VyY2UsXG4gICAgICAgICAgICBibG9ja2VkTWludXRlcyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiXHU2NjBFXHU1OTI5XHU2NjJGXHU2NzA5XHU2MTBGXHU0RjExXHU2MDZGXHUzMDAxXHU4QkZFXHU3QTBCXHU1MzYwXHU3NTI4XHVGRjBDXHU4RkQ4XHU2NjJGXHU4QkExXHU1MjEyXHU1QzFBXHU2NzJBXHU4ODY1XHU5RjUwXHVGRjFGXHU0RTBEXHU4OTgxXHU0RUM1XHU1MUVEXHU3QTdBXHU5NUYyXHU2M0E4XHU2NUFEXHU1RTk0XHU4QkU1XHU1MkEwXHU0RUZCXHU1MkExXHUzMDAyXCIsXG4gICAgICAgICksXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCB0aW1lZDogeyBzdGFydDogbnVtYmVyOyB0YXNrOiBUYXNrIH1bXSA9IHRhc2tzXG4gICAgICAubWFwKCh0KSA9PiAoe1xuICAgICAgICBzdGFydDogdC5yZW1pbmRlclRpbWUgIT09IG51bGwgPyAobWludXRlc09mKHQucmVtaW5kZXJUaW1lKSA/PyAtMSkgOiAtMSxcbiAgICAgICAgdGFzazogdCxcbiAgICAgIH0pKVxuICAgICAgLmZpbHRlcigoeCkgPT4geC5zdGFydCA+PSAwKVxuICAgICAgLnNvcnQoXG4gICAgICAgIChhLCBiKSA9PlxuICAgICAgICAgIGEuc3RhcnQgLSBiLnN0YXJ0IHx8XG4gICAgICAgICAgKGEudGFzay5pZCA8IGIudGFzay5pZCA/IC0xIDogYS50YXNrLmlkID4gYi50YXNrLmlkID8gMSA6IDApLFxuICAgICAgKTtcbiAgICAvLyBcdTk3MDBcdTRFMTNcdTVGQzNcdTc2ODRcdTY1RjZcdTZCQjVcdTYyNERcdTY3ODRcdTYyMTBcdTc3MUZcdTVCOUVcdTUxQjJcdTdBODFcdUZGMUJcdTZDMzRcdThCRkVcdTZCNjNcdTY2MkZcdTVFNzZcdTg4NENcdTRGNUNcdTRFMUFcdTc2ODRcdTU3MzBcdTY1QjlcdUZGMENcdTRGRERcdTYzMDFcdTVCODlcdTk3NTlcdTMwMDJcbiAgICBpZiAoZGF5ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCByZXF1aXJlZCA9IGJsb2Nrc09uRGF0ZShkYXRhLmJsb2NrcywgZGF0ZSkuZmlsdGVyKFxuICAgICAgICAoYikgPT4gYi5hdHRlbnRpb24gPT09IFwicmVxdWlyZWRcIixcbiAgICAgICk7XG4gICAgICBmb3IgKGNvbnN0IHsgc3RhcnQsIHRhc2sgfSBvZiB0aW1lZCkge1xuICAgICAgICBjb25zdCBlbmQgPSBzdGFydCArIHdpbmRvd01pbnV0ZXModGFzaywgZGF0YS5zZXR0aW5ncyk7XG4gICAgICAgIGZvciAoY29uc3QgYmFuZCBvZiByZXF1aXJlZCkge1xuICAgICAgICAgIGNvbnN0IG92ZXJsYXAgPSBvdmVybGFwTWludXRlcyhiYW5kLCBkYXRlLCBzdGFydCwgZW5kKTtcbiAgICAgICAgICBpZiAob3ZlcmxhcCA+IDApIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKFxuICAgICAgICAgICAgICBzaWduYWwoXG4gICAgICAgICAgICAgICAgYGJsb2NrLyR7ZGF0ZX0vJHt0YXNrLmlkfS8ke2JhbmQuaWR9YCxcbiAgICAgICAgICAgICAgICBcImJsb2NrQ29uZmxpY3RcIixcbiAgICAgICAgICAgICAgICBcIlx1OEJBMVx1NTIxMlx1NjVGNlx1NkJCNVx1ODQzRFx1NTcyOFx1OTcwMFx1NEUxM1x1NUZDM1x1NzY4NFx1OEJGRVx1N0EwQlx1NTE4NVwiLFxuICAgICAgICAgICAgICAgIFwid2FybmluZ1wiLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRhdGUsXG4gICAgICAgICAgICAgICAgICB0YXNrSWQ6IHRhc2suaWQsXG4gICAgICAgICAgICAgICAgICB0YXNrVGl0bGU6IHRhc2sudGl0bGUsXG4gICAgICAgICAgICAgICAgICBibG9ja0lkOiBiYW5kLmlkLFxuICAgICAgICAgICAgICAgICAgYmxvY2tUaXRsZTogYmFuZC50aXRsZSxcbiAgICAgICAgICAgICAgICAgIGJsb2NrU3RhcnQ6IGJhbmQuc3RhcnQsXG4gICAgICAgICAgICAgICAgICBibG9ja0VuZDogYmFuZC5lbmQsXG4gICAgICAgICAgICAgICAgICBvdmVybGFwTWludXRlczogb3ZlcmxhcCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwiXHU4RkQ5XHU2QkI1XHU1Qjg5XHU2MzkyXHU1NDhDXHU4OTgxXHU0RTEzXHU1RkMzXHU1NDJDXHU3Njg0XHU4QkZFXHU5MUNEXHU1M0UwXHVGRjFBXHU4MEZEXHU2MzJBXHU1MjMwXHU2QzM0XHU4QkZFXHU2NUY2XHU2QkI1XHU2MjE2XHU4QkZFXHU1NDBFXHU1NDE3XHVGRjFGXHU1OTgyXHU2NzlDXHU3ODZFXHU1QjlFXHU4OTgxXHU4QkZFXHU0RTBBXHU1MDVBXHVGRjBDXHU4QkY0XHU2NjBFXHU1NDBFXHU2MjExXHU0RTBEXHU0RjFBXHU1MThEXHU2MjhBXHU1QjgzXHU1RjUzXHU1MUIyXHU3QTgxXHUzMDAyXCIsXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBcdThCQjBcdTVGNTVcdTVFRjZcdTRGMzhcdTUyMzBcdTY3MDBcdTUzRjNcdTRGQTdcdTc2ODRcdTUzM0FcdTk1RjRcdUZGMUJcdTUzRUFcdTRFMEVcdTc2RjhcdTkwQkJcdTZCRDRcdThGODNcdTRGMUFcdTZGMEZcdTYzODlcdTRFMDBcdTRFMkFcdTk1N0ZcdThCRkVcdTdBMEJcdTg5ODZcdTc2RDZcdTU5MUFcdTRFMkFcdTc3RURcdTRFRkJcdTUyQTFcdTMwMDJcbiAgICBsZXQgcHJldmlvdXM6IHsgZW5kOiBudW1iZXI7IHRhc2s6IFRhc2sgfSB8IG51bGwgPSBudWxsO1xuICAgIGZvciAoY29uc3QgeyBzdGFydCwgdGFzayB9IG9mIHRpbWVkKSB7XG4gICAgICBjb25zdCBlbmQgPSBzdGFydCArIHdpbmRvd01pbnV0ZXModGFzaywgZGF0YS5zZXR0aW5ncyk7XG4gICAgICBpZiAocHJldmlvdXMgIT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgcHJldiA9IHByZXZpb3VzO1xuICAgICAgICBpZiAoc3RhcnQgPCBwcmV2LmVuZCkge1xuICAgICAgICAgIGNvbnN0IGlkcyA9IFtwcmV2LnRhc2suaWQsIHRhc2suaWRdLnNvcnQoKTtcbiAgICAgICAgICBjb25zdCBiYW5kID1cbiAgICAgICAgICAgIGRheSA9PT0gbnVsbFxuICAgICAgICAgICAgICA/IG51bGxcbiAgICAgICAgICAgICAgOiBkYXRhLmJsb2Nrcy5maW5kKFxuICAgICAgICAgICAgICAgICAgKGIpID0+XG4gICAgICAgICAgICAgICAgICAgIGIuYXR0ZW50aW9uID09PSBcImxpZ2h0XCIgJiZcbiAgICAgICAgICAgICAgICAgICAgb3ZlcmxhcE1pbnV0ZXMoYiwgZGF0ZSwgc3RhcnQsIE1hdGgubWluKHByZXYuZW5kLCBlbmQpKSA+IDAsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICByZXN1bHQucHVzaChcbiAgICAgICAgICAgIHNpZ25hbChcbiAgICAgICAgICAgICAgYGNvbGxpc2lvbi8ke2RhdGV9LyR7aWRzWzBdfS8ke2lkc1sxXX1gLFxuICAgICAgICAgICAgICBcImNvbGxpc2lvblwiLFxuICAgICAgICAgICAgICBcIlx1NEUyNFx1NEUyQVx1OEJBMVx1NTIxMlx1NjVGNlx1NkJCNVx1OTFDRFx1NTNFMFwiLFxuICAgICAgICAgICAgICBcIndhcm5pbmdcIixcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGRhdGUsXG4gICAgICAgICAgICAgICAgdGFza0lkczogaWRzLFxuICAgICAgICAgICAgICAgIHRpdGxlczogW3ByZXYudGFzay50aXRsZSwgdGFzay50aXRsZV0sXG4gICAgICAgICAgICAgICAgb3ZlcmxhcE1pbnV0ZXM6IE1hdGgubWluKHByZXYuZW5kLCBlbmQpIC0gc3RhcnQsXG4gICAgICAgICAgICAgICAgaW5jbHVkZXNCcmVha3M6IHRydWUsXG4gICAgICAgICAgICAgICAgYmxvY2tUaXRsZTogYmFuZD8udGl0bGUgPz8gbnVsbCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXCJcdThGRDlcdTRFMjRcdTRFMkFcdTVCODlcdTYzOTJcdTgwRkRcdTU0MjZcdTU0MENcdTY1RjZcdTVCOENcdTYyMTBcdUZGMUZcdTU5ODJcdTY3OUNcdTY2MkZcdTU3MjhcdTU0MENcdTRFMDBcdThCRkVcdTdBMEJcdTUxODVcdTUwNUFcdTRGNUNcdTRFMUFcdUZGMENcdThCRjdcdThCRjRcdTY2MEVcdUZGMENcdTkwN0ZcdTUxNERcdTYyOEFcdTUxNDFcdThCQjhcdTc2ODRcdTVFNzZcdTg4NENcdThCRUZcdTUyMjRcdTRFM0FcdTUxQjJcdTdBODFcdTMwMDJcIixcbiAgICAgICAgICAgICksXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZW5kIDw9IHByZXZpb3VzLmVuZCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwcmV2aW91cyA9IHsgZW5kLCB0YXNrIH07XG4gICAgfVxuICB9XG4gIGNvbnN0IGhhYml0cyA9IG5ldyBNYXA8XG4gICAgc3RyaW5nLFxuICAgIHsgc2NoZWR1bGVkOiBudW1iZXI7IG1pc3NlZDogbnVtYmVyOyBpZHM6IHN0cmluZ1tdIH1cbiAgPigpO1xuICBmb3IgKGNvbnN0IHQgb2YgZGF0YS50YXNrcykge1xuICAgIGlmIChcbiAgICAgICFpc0hhYml0KHQpIHx8XG4gICAgICB0LmR1ZURhdGUgPT09IG51bGwgfHxcbiAgICAgICEodC5kdWVEYXRlID49IHdlZWtTdGFydCAmJiB0LmR1ZURhdGUgPCBzbmFwc2hvdC50b2RheSlcbiAgICApIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBrZXkgPSB0LmhhYml0SWQgPz8gdC5pZDtcbiAgICBjb25zdCBlbnRyeSA9IGhhYml0cy5nZXQoa2V5KSA/PyB7IHNjaGVkdWxlZDogMCwgbWlzc2VkOiAwLCBpZHM6IFtdIH07XG4gICAgZW50cnkuc2NoZWR1bGVkICs9IDE7XG4gICAgaWYgKCF0LmNvbXBsZXRlZCAmJiB0LnJlbWluZGVyRXhwaXJlZCkge1xuICAgICAgZW50cnkubWlzc2VkICs9IDE7XG4gICAgICBlbnRyeS5pZHMucHVzaCh0LmlkKTtcbiAgICB9XG4gICAgaGFiaXRzLnNldChrZXksIGVudHJ5KTtcbiAgfVxuICBmb3IgKGNvbnN0IFtpZCwgeyBzY2hlZHVsZWQsIG1pc3NlZCwgaWRzIH1dIG9mIGhhYml0cykge1xuICAgIGlmIChzY2hlZHVsZWQgPj0gNCAmJiBtaXNzZWQgPj0gMyAmJiBtaXNzZWQgKiAxMDAgPj0gc2NoZWR1bGVkICogNTApIHtcbiAgICAgIHJlc3VsdC5wdXNoKFxuICAgICAgICBzaWduYWwoXG4gICAgICAgICAgYGhhYml0LyR7aWR9YCxcbiAgICAgICAgICBcImhhYml0QWJzZW5jZVwiLFxuICAgICAgICAgIFwiXHU4RkQxXHU0RTAwXHU1NDY4XHU0RTYwXHU2MEVGXHU1OTFBXHU2QjIxXHU2NzJBXHU1QjhDXHU2MjEwXCIsXG4gICAgICAgICAgXCJ3YXJuaW5nXCIsXG4gICAgICAgICAge1xuICAgICAgICAgICAgaGFiaXRJZDogaWQsXG4gICAgICAgICAgICBvYnNlcnZlZE9jY3VycmVuY2VzOiBzY2hlZHVsZWQsXG4gICAgICAgICAgICBtaXNzZWRPY2N1cnJlbmNlczogbWlzc2VkLFxuICAgICAgICAgICAgd2luZG93U3RhcnQ6IHdlZWtTdGFydCxcbiAgICAgICAgICAgIHdpbmRvd0VuZDogc25hcHNob3QudG9kYXksXG4gICAgICAgICAgICB0YXNrSWRzOiBpZHMsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIlx1NjYyRlx1NjVGNlx1OTVGNFx1NUI4OVx1NjM5Mlx1NEUwRFx1NTQwOFx1OTAwMlx1MzAwMVx1NEVGQlx1NTJBMVx1NTkyQVx1OTZCRVx1MzAwMVx1NTkxNlx1OTBFOFx1NTM2MFx1NzUyOFx1RkYwQ1x1OEZEOFx1NjYyRlx1NURGMlx1N0VDRlx1NEUwRFx1NjBGM1x1N0VFN1x1N0VFRFx1OEZEOVx1NEUyQVx1NEU2MFx1NjBFRlx1RkYxRlx1NTE0OFx1Nzg2RVx1OEJBNFx1NTM5Rlx1NTZFMFx1NTE4RFx1NjUzOVx1OEJBMVx1NTIxMlx1MzAwMlwiLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgY29uc3QgcmVjZW50U2Vzc2lvbnMgPSBkYXRhLnNlc3Npb25zLmZpbHRlcihcbiAgICAocykgPT4gcy5zb3VyY2UgPT09IFwidGltZXJcIiAmJiBzLmVuZGVkQXQgPj0gYXQgLSA3ICogODY0MDAsXG4gICk7XG4gIGNvbnN0IGxhdGUgPSByZWNlbnRTZXNzaW9ucy5maWx0ZXIoKHMpID0+IHtcbiAgICBjb25zdCBob3VyID0gbmV3IERhdGUocy5lbmRlZEF0ICogMTAwMCkuZ2V0SG91cnMoKTtcbiAgICByZXR1cm4gIShob3VyID49IDYgJiYgaG91ciA8IDIzKTtcbiAgfSk7XG4gIGNvbnN0IGRpc3RpbmN0TGF0ZSA9IG5ldyBTZXQobGF0ZS5tYXAoKHMpID0+IGRhdGVBdChzLmVuZGVkQXQpKSk7XG4gIGlmIChkaXN0aW5jdExhdGUuc2l6ZSA+PSAzKSB7XG4gICAgcmVzdWx0LnB1c2goXG4gICAgICBzaWduYWwoXG4gICAgICAgIFwicmh5dGhtL2xhdGVcIixcbiAgICAgICAgXCJyaHl0aG1EcmlmdFwiLFxuICAgICAgICBcIlx1OEZEMVx1NEUwMFx1NTQ2OFx1NTkxQVx1NTkyOVx1NjcwOVx1NkRGMVx1NTkxQ1x1NEUxM1x1NkNFOFx1OEJCMFx1NUY1NVwiLFxuICAgICAgICBcIm5vdGljZVwiLFxuICAgICAgICB7XG4gICAgICAgICAgbGF0ZURhdGVzOiBbLi4uZGlzdGluY3RMYXRlXSxcbiAgICAgICAgICBsYXRlU2Vzc2lvbkNvdW50OiBsYXRlLmxlbmd0aCxcbiAgICAgICAgICB3aW5kb3c6IFwiMjM6MDBcdTIwMTMwNjowMCBcdTY3MkNcdTY3M0FcdTY1RjZcdTk1RjRcIixcbiAgICAgICAgICBzYW1wbGVTZXNzaW9uczogcmVjZW50U2Vzc2lvbnMubGVuZ3RoLFxuICAgICAgICB9LFxuICAgICAgICBcIlx1OEZEOVx1NjYyRlx1NEUzNFx1NjVGNlx1NUI4OVx1NjM5Mlx1OEZEOFx1NjYyRlx1N0IyNlx1NTQwOFx1NEY2MFx1NzY4NFx1NEY1Q1x1NjA2Rlx1RkYxRlx1N0VEM1x1NTQwOFx1NEY2MFx1Nzg2RVx1OEJBNFx1NzY4NFx1Nzc2MVx1NzcyMFx1NTQ4Q1x1OEJGRVx1N0EwQlx1NEZFMVx1NjA2Rlx1NTIyNFx1NjVBRFx1RkYwQ1x1NEUwRFx1NEVFNVx1N0VERlx1NEUwMFx1NEY1Q1x1NjA2Rlx1OEJDNFx1NEVGN1x1NzUyOFx1NjIzN1x1MzAwMlwiLFxuICAgICAgKSxcbiAgICApO1xuICB9XG4gIGNvbnN0IHJlY2VudERheXMgPSBbLi4uYnlEYXkua2V5cygpXS5maWx0ZXIoKGQpID0+IGQgPj0gd2Vla1N0YXJ0KS5sZW5ndGg7XG4gIGlmIChoaXN0b3JpY2FsICE9PSBudWxsICYmIHJlY2VudERheXMgPj0gMykge1xuICAgIGNvbnN0IHJlY2VudCA9IFsuLi5ieURheS5lbnRyaWVzKCldXG4gICAgICAuZmlsdGVyKChbZF0pID0+IGQgPj0gd2Vla1N0YXJ0KVxuICAgICAgLm1hcCgoWywgbV0pID0+IG0pO1xuICAgIGlmIChcbiAgICAgIHJlY2VudC5yZWR1Y2UoKG4sIG0pID0+IG4gKyBtLCAwKSAqIDEwMCA8XG4gICAgICBoaXN0b3JpY2FsICogcmVjZW50Lmxlbmd0aCAqIDQwXG4gICAgKSB7XG4gICAgICByZXN1bHQucHVzaChcbiAgICAgICAgc2lnbmFsKFxuICAgICAgICAgIFwiZW5nYWdlbWVudC9kcm9wXCIsXG4gICAgICAgICAgXCJlbmdhZ2VtZW50RHJvcFwiLFxuICAgICAgICAgIFwiXHU4RkQxXHU2NzFGXHU4QkIwXHU1RjU1XHU3Njg0XHU2Mjk1XHU1MTY1XHU2NjBFXHU2NjNFXHU0RTBCXHU5NjREXCIsXG4gICAgICAgICAgXCJub3RpY2VcIixcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZWNlbnRBY3RpdmVEYXlzOiByZWNlbnQubGVuZ3RoLFxuICAgICAgICAgICAgcmVjZW50TWVhbk1pbnV0ZXM6XG4gICAgICAgICAgICAgIHJlY2VudC5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBNYXRoLmZsb29yKHJlY2VudC5yZWR1Y2UoKG4sIG0pID0+IG4gKyBtLCAwKSAvIHJlY2VudC5sZW5ndGgpXG4gICAgICAgICAgICAgICAgOiAwLFxuICAgICAgICAgICAgYmFzZWxpbmVNaW51dGVzOiBoaXN0b3JpY2FsLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJcdTY2MkZcdTU0MjZcdTY3MDlcdTgwMDNcdThCRDVcdTMwMDFcdThCRkVcdTdBMEJcdTMwMDFcdThFQUJcdTRGNTNcdTcyQjZcdTYwMDFcdTYyMTZcdTdFQkZcdTRFMEJcdTVCNjZcdTRFNjBcdTUzRDhcdTUzMTZcdUZGMUZcdTUxNDhcdTg4NjVcdTUxNjhcdThCQjBcdTVGNTVcdTgwQ0NcdTY2NkZcdUZGMENcdTUxOERcdTUxQjNcdTVCOUFcdTY2MkZcdTU0MjZcdThDMDNcdTY1NzRcdTgyODJcdTU5NEZcdTMwMDJcIixcbiAgICAgICAgKSxcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIHJlc3VsdC5zb3J0KChhLCBiKSA9PiAoYS5rZXkgPCBiLmtleSA/IC0xIDogYS5rZXkgPiBiLmtleSA/IDEgOiAwKSk7XG4gIHJldHVybiByZXN1bHQuc2xpY2UoMCwgMzApO1xufVxuIiwgIi8vISBcdTRFMTNcdTZDRThcdTRGRERcdTYyQTRcdTc2ODRcdTdFQUZcdThCQTFcdTdCOTdcdTkwRThcdTUyMDZcdUZGMUFcdTdBOTdcdTUzRTNcdTk2QzZcdTU0MDhcdTRFMEVcdTc2N0RcdTU0MERcdTUzNTVcdTUyMjRcdTVCOUFcdTMwMDJcbi8vISBcdTVCRjlcdTVFOTQgY3JhdGVzL2NvcmUvc3JjL2d1YXJkLnJzIFx1NzY4NCBgYWxsb3dlZGAgXHU0RTBFIGd1YXJkX3dpbmRvd3MucnMgXHU3Njg0XG4vLyEgYXBwLWlkIFx1ODlFM1x1Njc5MFx1RkYwOEFVTUlEIC8gQXBwbGljYXRpb25GcmFtZUhvc3QgXHU1MTcxXHU0RUFCIFVXUCBcdTY4NDZcdTY3QjYgLyBcdTVCOENcdTY1NzRcdThGREJcdTdBMEJcdThERUZcdTVGODRcdUZGMDlcdTMwMDJcbi8vISBcdTRFMERcdTUwNUFcdTRFRkJcdTRGNTVcdTY4NENcdTk3NjJcdThDMDNcdTc1MjhcdTIwMTRcdTIwMTRcdTY3OUFcdTRFM0VcdTMwMDFcdTgwNUFcdTcxMjZcdTRFMEVcdTk1MDFcdTVDNEZcdTYyNjdcdTg4NENcdTc1MzFcdTUzOUZcdTc1MUYgZ3VhcmQgXHU4RDFGXHU4RDIzXHUzMDAyXG5cbmltcG9ydCB0eXBlIHsgUHJvdGVjdGlvbiwgV2luZG93IH0gZnJvbSBcIi4vbW9kZWxcIjtcblxuLyoqXG4gKiBcdTc2N0RcdTU0MERcdTUzNTVcdTUyMjRcdTVCOUFcdUZGMDhndWFyZDo6YWxsb3dlZFx1RkYwOVx1RkYxQVxuICogXHU2NzJDXHU4RkRCXHU3QTBCXHU3QTk3XHU1M0UzXHU1OUNCXHU3RUM4XHU2NTNFXHU4ODRDXHVGRjFCb2ZmIFx1NjUzRVx1ODg0Q1x1NEUwMFx1NTIwN1x1RkYxQndoaXRlbGlzdCBcdTdDQkVcdTc4NkVcdTUzMzlcdTkxNEQgYXBwSWRcdUZGMUJcbiAqIGxvY2sgXHU1RkZEXHU3NTY1XHU3NjdEXHU1NDBEXHU1MzU1XHUzMDAyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvd2VkKFxuICB3aW5kb3c6IFdpbmRvdyxcbiAgb3duUGlkOiBudW1iZXIsXG4gIHByb3RlY3Rpb246IFByb3RlY3Rpb24sXG4pOiBib29sZWFuIHtcbiAgaWYgKHdpbmRvdy5waWQgIT09IG51bGwgJiYgd2luZG93LnBpZCA9PT0gb3duUGlkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIChcbiAgICBwcm90ZWN0aW9uLm1vZGUgPT09IFwib2ZmXCIgfHxcbiAgICAocHJvdGVjdGlvbi5tb2RlID09PSBcIndoaXRlbGlzdFwiICYmXG4gICAgICB3aW5kb3cuYXBwSWQgIT09IG51bGwgJiZcbiAgICAgIHByb3RlY3Rpb24ud2hpdGVsaXN0LnNvbWUoKGFsbG93ZWRJZCkgPT4gYWxsb3dlZElkID09PSB3aW5kb3cuYXBwSWQpKVxuICApO1xufVxuXG4vKiogVVdQIFx1NUU5NFx1NzUyOFx1NUMwMVx1ODhDNVx1NEUzQSBgYXVtaWQ6e2lkfWBcdUZGMDhndWFyZF93aW5kb3dzOjppZGVudGl0eVx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEF1bWlkKGlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYGF1bWlkOiR7aWR9YDtcbn1cblxuLyoqXG4gKiBBcHBsaWNhdGlvbkZyYW1lSG9zdC5leGUgXHU2NjJGXHU1MTcxXHU0RUFCXHU2ODQ2XHU2N0I2XHU4RkRCXHU3QTBCXHVGRjFBXHU1QjgzXHU2NzJDXHU4RUFCXHU0RTBEXHU0RUUzXHU4ODY4XHU0RUZCXHU0RjU1XHU0RTAwXHU0RTJBXHU2MjU4XHU3QkExXHU1RTk0XHU3NTI4XHVGRjBDXG4gKiBcdTYzODhcdTRFODhcdTVCODNcdTdCNDlcdTRFOEVcdTY1M0VcdTg4NENcdTUxNjhcdTkwRTggVVdQIFx1NUU5NFx1NzUyOFx1MzAwMlx1NTIyNFx1NjVBRFx1NjMwOVx1NUI4Q1x1NjU3NFx1OERFRlx1NUY4NFx1NzY4NFx1NjcwMFx1NTQwRVx1NEUwMFx1NkJCNVx1MzAwMVx1NEUwRFx1NTMzQVx1NTIwNlx1NTkyN1x1NUMwRlx1NTE5OVx1MzAwMlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNBcHBsaWNhdGlvbkZyYW1lSG9zdChwcm9jZXNzUGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IG5hbWUgPSBwcm9jZXNzUGF0aC5zcGxpdCgvW1xcXFwvXS8pLnBvcCgpID8/IFwiXCI7XG4gIHJldHVybiBuYW1lLnRvTG93ZXJDYXNlKCkgPT09IFwiYXBwbGljYXRpb25mcmFtZWhvc3QuZXhlXCI7XG59XG5cbi8qKlxuICogXHU1MTcxXHU0RUFCXHU2ODQ2XHU2N0I2XHU3QTk3XHU1M0UzXHU3Njg0XHU2MjU4XHU3QkExXHU1RTk0XHU3NTI4XHU5MDA5XHU2MkU5XHVGRjFBXHU1M0Q2XHU3QjJDXHU0RTAwXHU0RTJBXHU3QzdCXHU1NDBEXHU0RTNBXG4gKiBgV2luZG93cy5VSS5Db3JlLkNvcmVXaW5kb3dgIFx1NEUxNCBQSUQgXHUyMjYwIFx1NUJCRlx1NEUzQiBQSUQgXHU3Njg0XHU1QjUwXHU3QTk3XHU1M0UzXG4gKiBcdUZGMDhndWFyZF93aW5kb3dzOjpjb250ZW50XHVGRjA5XHUzMDAyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3RGcmFtZUNvbnRlbnRQaWQoXG4gIGhvc3RQaWQ6IG51bWJlcixcbiAgY2hpbGRyZW46IHsgY2xhc3NOYW1lOiBzdHJpbmc7IHBpZDogbnVtYmVyIH1bXSxcbik6IG51bWJlciB8IG51bGwge1xuICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgaWYgKFxuICAgICAgY2hpbGQuY2xhc3NOYW1lID09PSBcIldpbmRvd3MuVUkuQ29yZS5Db3JlV2luZG93XCIgJiZcbiAgICAgIGNoaWxkLnBpZCAhPT0gMCAmJlxuICAgICAgY2hpbGQucGlkICE9PSBob3N0UGlkXG4gICAgKSB7XG4gICAgICByZXR1cm4gY2hpbGQucGlkO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cbiIsICIvLyEgRW5naW5lXHVGRjFBXHU5ODg0XHU2OEMwL1x1NjNEMFx1NEVBNC9cdTYzMDFcdTRFNDVcdTUzMTYvXHU1RkVCXHU3MTY3XHUzMDAyXHU1QkY5XHU1RTk0IGNyYXRlcy9jb3JlL3NyYy9saWIucnMgXHU3Njg0IEVuZ2luZVx1MzAwMlxuLy8hXG4vLyEgXHU2MzAxXHU0RTQ1XHU1MzE2XHVGRjFBXHU2NUU3XHU1RjE1XHU2NENFXHU3NTI4IFNRTGl0ZVx1RkYxQlx1NjVCMFx1NjdCNlx1Njc4NFx1RkYwOE1JR1JBVElPTi5tZC9BUEkubWRcdUZGMDlcdTRFRTUgSlNPTiBcdTY1ODdcdTRFRjZcdTRFM0FcdTU1MkZcdTRFMDBcdTY1NzBcdTYzNkVcdTZFOTBcdTMwMDJcbi8vISBcdTY3MkNcdTVCOUVcdTczQjBcdTY3MDlcdTRFMjRcdTc5Q0RcdTVCNThcdTUwQThcdTUxNjVcdTUzRTNcdUZGMUFcbi8vISAtIGBFbmdpbmUub3BlbihwYXRoKWBcdUZGMUFcdTUzNTUgSlNPTiBcdTY1ODdcdTRFRjZcdUZGMDhcdTUzOUZcdTVCNTBcdTUxOTlcdUZGMDlcdUZGMENcdTVCRjlcdTVFOTRcdTY1RTcgRW5naW5lOjpvcGVuKHBhdGgpXHVGRjFCXG4vLyEgLSBgRW5naW5lLmZyb21EYXRhKGRhdGEsIHNhdmUpYFx1RkYxQVx1OEMwM1x1NzUyOFx1NjVCOVx1ODFFQVx1NUUyNlx1NUI1OFx1NTBBOFx1RkYwOHJ1bnRpbWUgXHU3NTI4XHU1QjgzXHU2MjhBXHU1NDBDXHU0RTAwXHU0RUZEIEFwcERhdGFcbi8vISAgIFx1NjJDNlx1NjIxMCBwbGFuLmpzb24vc3RhdGUuanNvbiBcdTRFMjRcdTRFMkFcdTY1ODdcdTRFRjZcdUZGMDlcdTMwMDJcdTVCNThcdTUwQThcdTdCNTZcdTc1NjVcdTUzRUFcdTVGNzFcdTU0Q0RcdTg0M0RcdTc2RDhcdTY1QjlcdTVGMEZcdUZGMENcdTY4MjFcdTlBOENcdTMwMDFcdThFQUJcdTRFRkRcdTc2N0JcdThCQjBcdTMwMDFcbi8vISAgIFx1NjU1OVx1NUI2Nlx1OEY2Q1x1NzlGQlx1NEUwRVx1NEZERFx1NjJBNFx1ODlDNFx1NTIxOVx1NUI4Q1x1NTE2OFx1NTE3MVx1NzUyOFx1MzAwMlxuXG5pbXBvcnQgeyByZWFkRmlsZVN5bmMsIHdyaXRlRmlsZVN5bmMsIG1rZGlyU3luYywgcmVuYW1lU3luYyB9IGZyb20gXCJub2RlOmZzXCI7XG5pbXBvcnQgeyBkaXJuYW1lIH0gZnJvbSBcIm5vZGU6cGF0aFwiO1xuaW1wb3J0IHsgQXBwRXJyb3IsIGNsb25lIH0gZnJvbSBcIi4vZXJyb3JzXCI7XG5pbXBvcnQgdHlwZSB7IEFjdGlvbiB9IGZyb20gXCIuL2xpYlwiO1xuaW1wb3J0IHsgQXBwRGF0YSB9IGZyb20gXCIuL2xpYlwiO1xuaW1wb3J0IHsgZGF0ZUF0IH0gZnJvbSBcIi4vdGltZVwiO1xuaW1wb3J0IHsgcmVjb25jaWxlSWRlbnRpdGllcywgdmFsaWRhdGVJZGVudGl0aWVzIH0gZnJvbSBcIi4vaWRlbnRpdGllc1wiO1xuaW1wb3J0IHsgcmVhZExvY2FsRGF0YSB9IGZyb20gXCIuL21pZ3JhdGlvblwiO1xuaW1wb3J0IHsgc3VtbWFyaWVzIH0gZnJvbSBcIi4vbGVhcm5pbmdcIjtcbmltcG9ydCB7IHZhbGlkYXRlRWR1Y2F0aW9uVHJhbnNpdGlvbiB9IGZyb20gXCIuL2VkdWNhdGlvblwiO1xuaW1wb3J0IHsgcmVsZWFzZUxvY2sgfSBmcm9tIFwiLi9sb2NrXCI7XG5pbXBvcnQgdHlwZSB7IFNuYXBzaG90LCBUYXNrS2luZCB9IGZyb20gXCIuL21vZGVsXCI7XG5pbXBvcnQgeyBraW5kT2YgfSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHsgdGltZXJSZW1haW5pbmcgfSBmcm9tIFwiLi9yZW1pbmRlcnNcIjtcbmltcG9ydCB7IHBhcnNlQXBwRGF0YSwgc2VyaWFsaXplQXBwRGF0YSwgc2VyaWFsaXplVGFzayB9IGZyb20gXCIuL2xpYlwiO1xuXG4vKiogXHU4NDNEXHU3NkQ4XHU1NkRFXHU4QzAzXHVGRjFBXHU2NTM2XHU1MjMwXHU3Njg0XHU2NjJGXHU1REYyXHU3RUNGXHU4RkM3XHU2ODIxXHU5QThDXHU3Njg0IEFwcERhdGFcdUZGMUJcdTU2REVcdThDMDNcdTVGQzVcdTk4N0JcdTUzOUZcdTVCNTBcdTY2RkZcdTYzNjJcdTgxRUFcdTVERjFcdTc2ODRcdTVCNThcdTUwQThcdTMwMDIgKi9cbmV4cG9ydCB0eXBlIEVuZ2luZVBlcnNpc3QgPSAoZGF0YTogQXBwRGF0YSkgPT4gdm9pZDtcblxuLyoqIFx1NTM1NVx1NjU4N1x1NEVGNlx1NUI1OFx1NTBBOFx1RkYxQVx1NEUzNFx1NjVGNlx1NjU4N1x1NEVGNiArIHJlbmFtZVx1RkYwQ1x1NEZERFx1OEJDMVx1OEJGQlx1ODAwNVx1NTNFQVx1NzcwQlx1NTIzMFx1NjVFN1x1NTE4NVx1NUJCOVx1NjIxNlx1NjVCMFx1NTE4NVx1NUJCOVx1MzAwMiAqL1xuZnVuY3Rpb24gd3JpdGVBdG9taWMocGF0aDogc3RyaW5nLCBkYXRhOiBBcHBEYXRhKTogdm9pZCB7XG4gIGNvbnN0IHJhdyA9IEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZUFwcERhdGEoZGF0YSksIG51bGwsIDIpO1xuICBjb25zdCB0bXAgPSBgJHtwYXRofS50bXBgO1xuICB3cml0ZUZpbGVTeW5jKHRtcCwgcmF3LCBcInV0ZjhcIik7XG4gIHJlbmFtZVN5bmModG1wLCBwYXRoKTtcbn1cblxuZXhwb3J0IGNsYXNzIEVuZ2luZSB7XG4gIHBhdGg6IHN0cmluZztcbiAgZGF0YTogQXBwRGF0YTtcbiAgcHJpdmF0ZSByZWFkb25seSBzYXZlOiBFbmdpbmVQZXJzaXN0O1xuXG4gIHByaXZhdGUgY29uc3RydWN0b3IocGF0aDogc3RyaW5nLCBkYXRhOiBBcHBEYXRhLCBzYXZlOiBFbmdpbmVQZXJzaXN0KSB7XG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIHRoaXMuc2F2ZSA9IHNhdmU7XG4gIH1cblxuICAvKiogXHU2ODRDXHU5NzYyXHU5MDAyXHU5MTREXHU1QzQyXHU0RTEzXHU3NTI4XHVGRjFBXHU1NDA4XHU2MjEwXHU1NjY4XHU2NTQ1XHU5NjlDXHU1NDBFXHU1RjNBXHU1MjM2XHU4OUUzXHU5NjY0XHU0RkREXHU2MkE0XHVGRjFCXHU0RTBEXHU2NjJGXHU1QkY5XHU1OTE2IEFjdGlvblx1MzAwMiAqL1xuICByZWxlYXNlRmFpbGVkUHJvdGVjdGlvbihhdDogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3QgbmV4dCA9IGNsb25lKHRoaXMuZGF0YSk7XG4gICAgbmV4dC5yZWNvcmQoYXQsIGZhbHNlKTtcbiAgICBuZXh0LnJlc2V0VG8oXCJmb2N1c1wiKTtcbiAgICByZWxlYXNlTG9jayhuZXh0LmxvY2ssIGF0KTtcbiAgICBuZXh0LnZhbGlkYXRlKCk7XG4gICAgdGhpcy5wZXJzaXN0KG5leHQpO1xuICAgIHRoaXMuZGF0YSA9IG5leHQ7XG4gIH1cblxuICAvKipcbiAgICogXHU2NUU3IHJ1bnRpbWUgXHU3Njg0XHUzMDBDXHU2NTNFXHU1RjAzXHU1RjUzXHU1MjREXHU3NTZBXHU4MzA0XHUzMDBEXHVGRjFBXHU0RTBEXHU1MTk5XHU0RTEzXHU2Q0U4XHU4QkIwXHU1RjU1XHVGRjBDXHU1M0VBXHU1NkRFXHU1MjMwXHU3QTdBXHU5NUYyXHU0RTEzXHU2Q0U4XHUzMDAyXG4gICAqIFx1NEZERFx1NjJBNFx1NzUxRlx1NjU0OFx1NjVGNlx1NjJEMlx1N0VERFx1RkYwOFx1NEUwRVx1NTE3Nlx1NUI4M1x1NTE5OVx1NTJBOFx1NEY1Q1x1NTQwQ1x1NEUwMFx1ODlDNFx1NTIxOVx1RkYxQVx1NEUwRFx1ODBGRFx1NTAxRlx1NjUzRVx1NUYwM1x1N0VENVx1NUYwMFx1OTUwMVx1NUI5QVx1RkYwOVx1MzAwMlxuICAgKi9cbiAgZGlzY2FyZFRpbWVyKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmRhdGEuc3RyaWN0UHJvdGVjdGVkKCkpIHtcbiAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NEUyNVx1NjgzQ1x1NkEyMVx1NUYwRlx1NzUxRlx1NjU0OFx1NEUyRFx1RkYwQ1x1NEUwRFx1ODBGRFx1NjNEMFx1NTI0RFx1N0VEM1x1Njc1Rlx1NjIxNlx1NEZFRVx1NjUzOVx1RkYxQlx1NTIzMFx1NjVGNlx1ODFFQVx1NTJBOFx1ODlFM1x1OTY2NFwiKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuZGF0YS5wcm90ZWN0ZWQoKSkge1xuICAgICAgdGhyb3cgbmV3IEFwcEVycm9yKFxuICAgICAgICBcIlx1NEUxM1x1NkNFOFx1NEZERFx1NjJBNFx1NEUyRFx1RkYwQ1x1N0VEM1x1Njc1Rlx1NTI0RFx1NEUwRFx1ODBGRFx1NEZFRVx1NjUzOVx1NEVGQlx1NTJBMVx1NjIxNlx1OEJBMVx1NjVGNlx1RkYxQlx1NTNFRlx1NjNEMFx1NTI0RFx1NUI4Q1x1NjIxMFx1NzU2QVx1ODMwNFx1NjIxNlx1N0QyN1x1NjAyNVx1OTAwMFx1NTFGQVwiLFxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgbmV4dCA9IGNsb25lKHRoaXMuZGF0YSk7XG4gICAgbmV4dC5yZXNldFRvKFwiZm9jdXNcIik7XG4gICAgbmV4dC52YWxpZGF0ZSgpO1xuICAgIHRoaXMucGVyc2lzdChuZXh0KTtcbiAgICB0aGlzLmRhdGEgPSBuZXh0O1xuICB9XG5cbiAgc3RhdGljIG9wZW4ocGF0aDogc3RyaW5nKTogRW5naW5lIHtcbiAgICBsZXQgcmF3OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICBpZiAocGF0aCAhPT0gXCI6bWVtb3J5OlwiKSB7XG4gICAgICBjb25zdCBwYXJlbnQgPSBkaXJuYW1lKHBhdGgpO1xuICAgICAgaWYgKHBhcmVudCAhPT0gXCIuXCIgJiYgcGFyZW50ICE9PSBcIlwiKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbWtkaXJTeW5jKHBhcmVudCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoU3RyaW5nKGUpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgcmF3ID0gcmVhZEZpbGVTeW5jKHBhdGgsIFwidXRmOFwiKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKChlIGFzIE5vZGVKUy5FcnJub0V4Y2VwdGlvbikuY29kZSAhPT0gXCJFTk9FTlRcIikge1xuICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihTdHJpbmcoZSkpO1xuICAgICAgICB9XG4gICAgICAgIHJhdyA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIGxldCBkYXRhOiBBcHBEYXRhO1xuICAgIGlmIChyYXcgIT09IG51bGwpIHtcbiAgICAgIGRhdGEgPSByZWFkTG9jYWxEYXRhKHJhdyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRhdGEgPSBuZXcgQXBwRGF0YSgpO1xuICAgIH1cbiAgICByZWNvbmNpbGVJZGVudGl0aWVzKGNsb25lKGRhdGEpLCBkYXRhLCBudWxsKTtcbiAgICBkYXRhLnZhbGlkYXRlKCk7XG4gICAgY29uc3QgZW5naW5lID0gbmV3IEVuZ2luZShcbiAgICAgIHBhdGgsXG4gICAgICBkYXRhLFxuICAgICAgcGF0aCA9PT0gXCI6bWVtb3J5OlwiXG4gICAgICAgID8gKCkgPT4ge31cbiAgICAgICAgOiAobmV4dDogQXBwRGF0YSkgPT4gd3JpdGVBdG9taWMocGF0aCwgbmV4dCksXG4gICAgKTtcbiAgICBlbmdpbmUucGVyc2lzdChlbmdpbmUuZGF0YSk7XG4gICAgcmV0dXJuIGVuZ2luZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBcdTc1MjhcdThDMDNcdTc1MjhcdTY1QjlcdTUyQTBcdThGN0RcdTU5N0RcdTc2ODRcdTY1NzBcdTYzNkVcdTVFRkFcdTVGMTVcdTY0Q0VcdUZGMENcdTVFNzZcdTRFRTVcdThDMDNcdTc1MjhcdTY1QjlcdTdFRDlcdTc2ODQgYHNhdmVgIFx1ODQzRFx1NzZEOFx1MzAwMlxuICAgKiBcdTY1NzBcdTYzNkVcdTRFQ0RcdThENzBcdTU0MENcdTRFMDBcdTU5NTdcdThFQUJcdTRFRkRcdTc2N0JcdThCQjBcdTRFMEVcdTUxNjhcdTkxQ0ZcdTY4MjFcdTlBOENcdUZGMUJgc2F2ZWAgXHU2MjlCXHU5NTE5XHU0RjFBXHU1MzlGXHU2ODM3XHU0RjIwXHU1MUZBXHVGRjBDXHU1MkEwXHU4RjdEXHU1OTMxXHU4RDI1XHU2NUY2XG4gICAqIFx1OEMwM1x1NzUyOFx1NjVCOVx1NTZFMFx1NkI2NFx1NEUwRFx1NEYxQVx1ODk4Nlx1NzZENlx1NjVFN1x1NjU4N1x1NEVGNlx1MzAwMlxuICAgKi9cbiAgc3RhdGljIGZyb21EYXRhKFxuICAgIGRhdGE6IEFwcERhdGEsXG4gICAgc2F2ZTogRW5naW5lUGVyc2lzdCxcbiAgICBwYXRoID0gXCI6bWVtb3J5OlwiLFxuICApOiBFbmdpbmUge1xuICAgIGNvbnN0IG5leHQgPSBjbG9uZShkYXRhKTtcbiAgICByZWNvbmNpbGVJZGVudGl0aWVzKGNsb25lKGRhdGEpLCBuZXh0LCBudWxsKTtcbiAgICBuZXh0LnZhbGlkYXRlKCk7XG4gICAgY29uc3QgZW5naW5lID0gbmV3IEVuZ2luZShwYXRoLCBuZXh0LCBzYXZlKTtcbiAgICBlbmdpbmUucGVyc2lzdChlbmdpbmUuZGF0YSk7XG4gICAgcmV0dXJuIGVuZ2luZTtcbiAgfVxuXG4gIHByaXZhdGUgcGVyc2lzdChkYXRhOiBBcHBEYXRhKTogdm9pZCB7XG4gICAgdGhpcy5zYXZlKGRhdGEpO1xuICB9XG5cbiAgLyoqIFx1NEUwRSBkaXNwYXRjaCBcdTc2RjhcdTU0MENcdTc2ODRcdThFQUJcdTRFRkQvXHU1Mzg2XHU1M0YyXHU4OUM0XHU1MjE5XHVGRjBDXHU0RjQ2XHU0RTBEXHU2MzAxXHU0RTQ1XHU1MzE2XHVGRjFBXHU3NTI4XHU0RThFXHU1QkExXHU5NjA1XHU2NTg3XHU0RUY2XHUzMDAyICovXG4gIHByZXZpZXdBY3Rpb24oYWN0aW9uOiBBY3Rpb24sIGF0OiBudW1iZXIpOiBBcHBEYXRhIHtcbiAgICBjb25zdCByZXN0b3JlSWQgPSAoKCkgPT4ge1xuICAgICAgaWYgKGFjdGlvbi50eXBlID09PSBcInJlc3RvcmVUYXNrXCIpIHtcbiAgICAgICAgY29uc3QgcmVjb3JkID0gdGhpcy5kYXRhLmlkZW50aXRpZXMuZmluZChcbiAgICAgICAgICAocikgPT4gci5pZCA9PT0gYWN0aW9uLnRhc2suaWQgJiYgci5yZXRpcmVkICYmIHIua2luZCA9PT0gXCJ0YXNrXCIsXG4gICAgICAgICk7XG4gICAgICAgIGlmIChyZWNvcmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRocm93IG5ldyBBcHBFcnJvcihcIlx1NkNBMVx1NjcwOVx1NUJGOVx1NUU5NFx1NzY4NFx1NTM5Rlx1NEVGQlx1NTJBMVx1NjA2Mlx1NTkwRFx1OEJCMFx1NUY1NVwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVjb3JkLnJlc3RvcmVUYXNrICE9PSBKU09OLnN0cmluZ2lmeShzZXJpYWxpemVUYXNrKGFjdGlvbi50YXNrKSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXBwRXJyb3IoXCJcdTYwNjJcdTU5MERcdTUxODVcdTVCQjlcdTRFMEVcdTUzOUZcdTRFRkJcdTUyQTFcdTRFMERcdTRFMDBcdTgxRjRcdUZGMENcdTUzODZcdTUzRjIgSUQgXHU0RTBEXHU4MEZEXHU1OTBEXHU3NTI4XCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY3Rpb24udGFzay5pZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0pKCk7XG4gICAgY29uc3QgbmV4dCA9IGNsb25lKHRoaXMuZGF0YSk7XG4gICAgLy8gYXBwbHkgXHU1MTg1XHU5MEU4XHU1REYyXHU1MDVBXHU1MTY4XHU5MUNGXHU2ODIxXHU5QThDXHVGRjFCcmVjb25jaWxlIFx1NTNFQVx1NjUzOSBpZGVudGl0aWVzXHVGRjBDXHU1MThEXHU5QThDXHU4RUFCXHU0RUZEXHU1MzczXHU1M0VGXHVGRjBDXG4gICAgLy8gXHU5MDdGXHU1MTREXHU1QkY5XHU2NTU5XHU1QjY2XHU4QkIwXHU1RjU1XHU1Rjg4XHU1OTFBXHU3Njg0XHU1RTkzXHU2QkNGXHU2QjIxXHU1MkE4XHU0RjVDXHU5MUNEXHU1OTBEXHU4REQxXHU0RTAwXHU5MDREXHU2NjAyXHU4RDM1XHU2ODIxXHU5QThDXHUzMDAyXG4gICAgbmV4dC5hcHBseShhY3Rpb24sIGF0KTtcbiAgICB2YWxpZGF0ZUVkdWNhdGlvblRyYW5zaXRpb24odGhpcy5kYXRhLmVkdWNhdGlvbiwgbmV4dC5lZHVjYXRpb24pO1xuICAgIHJlY29uY2lsZUlkZW50aXRpZXModGhpcy5kYXRhLCBuZXh0LCByZXN0b3JlSWQpO1xuICAgIHZhbGlkYXRlSWRlbnRpdGllcyhuZXh0KTtcbiAgICByZXR1cm4gbmV4dDtcbiAgfVxuXG4gIC8qKiBcdTUzRUFcdTYzQThcdThGREJcdTY1RjZcdTk1RjRcdUZGMDhcdThCQTFcdTY1RjYvXHU2M0QwXHU5MTkyL1x1OTUwMVx1NjczQS9cdTgxRUFcdTUyQThcdTVGMDBcdTVERTVcdUZGMDlcdUZGMENcdTRFMERcdTc1MUZcdTYyMTBcdTVGRUJcdTcxNjdcdTdFREZcdThCQTFcdUZGMUJcdTZCQ0ZcdTc5RDIgdGljayBcdTc1MjhcdTMwMDIgKi9cbiAgdGljayhhdDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbmV4dCA9IGNsb25lKHRoaXMuZGF0YSk7XG4gICAgaWYgKCFuZXh0LnRpY2soYXQpKSByZXR1cm4gZmFsc2U7XG4gICAgcmVjb25jaWxlSWRlbnRpdGllcyh0aGlzLmRhdGEsIG5leHQsIG51bGwpO1xuICAgIG5leHQudmFsaWRhdGUoKTtcbiAgICB0aGlzLnBlcnNpc3QobmV4dCk7XG4gICAgdGhpcy5kYXRhID0gY2xvbmUobmV4dCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBkaXNwYXRjaChhY3Rpb246IEFjdGlvbiwgYXQ6IG51bWJlcik6IFNuYXBzaG90IHtcbiAgICBjb25zdCBuZXh0ID0gdGhpcy5wcmV2aWV3QWN0aW9uKGFjdGlvbiwgYXQpO1xuICAgIHRoaXMucGVyc2lzdChuZXh0KTtcbiAgICB0aGlzLmRhdGEgPSBuZXh0O1xuICAgIHJldHVybiB0aGlzLnNuYXBzaG90KGF0KTtcbiAgfVxuXG4gIHNuYXBzaG90KGF0OiBudW1iZXIpOiBTbmFwc2hvdCB7XG4gICAgY29uc3QgbmV4dCA9IGNsb25lKHRoaXMuZGF0YSk7XG4gICAgaWYgKG5leHQudGljayhhdCkpIHtcbiAgICAgIHJlY29uY2lsZUlkZW50aXRpZXModGhpcy5kYXRhLCBuZXh0LCBudWxsKTtcbiAgICAgIG5leHQudmFsaWRhdGUoKTtcbiAgICAgIHRoaXMucGVyc2lzdChuZXh0KTtcbiAgICAgIC8vIFx1NTNFQVx1NjcwOVx1NzcxRlx1NkI2M1x1NTNEOFx1NTMxNlx1NjI0RFx1OEZEQlx1OEZEOVx1NEUyQVx1NTIwNlx1NjUyRlx1RkYxQVx1NzBFRFx1OERFRlx1NUY4NFx1NkJDRlx1NzlEMlx1NEUwMFx1NkIyMVx1NTE0Qlx1OTY4Nlx1MzAwMlxuICAgICAgdGhpcy5kYXRhID0gY2xvbmUobmV4dCk7XG4gICAgfVxuICAgIGNvbnN0IGtpbmRzOiBSZWNvcmQ8c3RyaW5nLCBUYXNrS2luZD4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IHQgb2YgdGhpcy5kYXRhLnRhc2tzKSB7XG4gICAgICBraW5kc1t0LmlkXSA9IGtpbmRPZih0KTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHRhc2tLaW5kczoga2luZHMsXG4gICAgICByZW1haW5pbmdTZWNzOiB0aW1lclJlbWFpbmluZyh0aGlzLmRhdGEudGltZXIsIGF0KSxcbiAgICAgIHN0YXRzOiB0aGlzLmRhdGEuc3RhdHMoYXQpLFxuICAgICAgc3R1ZHlQcm9ncmVzczogc3VtbWFyaWVzKG5leHQsIGF0KSxcbiAgICAgIGRhdGE6IG5leHQsXG4gICAgICB0b2RheTogZGF0ZUF0KGF0KSxcbiAgICAgIHNlcnZlclRpbWU6IGF0LFxuICAgIH07XG4gIH1cblxuICBleHBvcnQoYXQ6IG51bWJlcik6IHN0cmluZyB7XG4gICAgdGhpcy5zbmFwc2hvdChhdCk7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZUFwcERhdGEodGhpcy5kYXRhKSwgbnVsbCwgMik7XG4gIH1cbn1cblxuLy8gcGFyc2VBcHBEYXRhIFx1NEY5Qlx1OEZEMFx1ODg0Q1x1NjVGNlx1NEVDRSBKU09OIFx1NzZGNFx1NjNBNVx1Njc4NFx1OTAyMFx1NjU3MFx1NjM2RVx1RkYwOFx1NjgyMVx1OUE4Q1x1NTE2NVx1NTNFM1x1ODlDMSBsaWIudHMgXHU0RTBFIGluZGV4LnRzXHVGRjA5XHUzMDAyXG5leHBvcnQgeyBwYXJzZUFwcERhdGEgfTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFJTyxJQUFNLFdBQU4sY0FBdUIsTUFBTTtBQUFBLEVBQ2xDLFlBQVksU0FBaUI7QUFDM0IsVUFBTSxPQUFPO0FBQ2IsU0FBSyxPQUFPO0FBQUEsRUFDZDtBQUNGO0FBRU8sU0FBUyxPQUFPLElBQWEsU0FBNkI7QUFDL0QsTUFBSSxDQUFDLEdBQUksT0FBTSxJQUFJLFNBQVMsT0FBTztBQUNyQztBQUdPLFNBQVNBLFNBQVcsT0FBNkIsU0FBb0I7QUFDMUUsTUFBSSxVQUFVLFFBQVEsVUFBVSxPQUFXLE9BQU0sSUFBSSxTQUFTLE9BQU87QUFDckUsU0FBTztBQUNUO0FBR08sU0FBUyxVQUFVLEdBQW1CO0FBQzNDLFNBQU8sTUFBTSxLQUFLLENBQUMsRUFBRTtBQUN2QjtBQUdPLFNBQVMsUUFBUSxHQUFtQjtBQUN6QyxNQUFJLE9BQU8sZ0JBQWdCLGFBQWE7QUFDdEMsV0FBTyxJQUFJLFlBQVksRUFBRSxPQUFPLENBQUMsRUFBRTtBQUFBLEVBQ3JDO0FBRUEsU0FBTyxVQUFVLENBQUMsSUFBSTtBQUN4QjtBQUdPLFNBQVMsTUFBUyxPQUFhO0FBQ3BDLE1BQUksTUFBTSxRQUFRLEtBQUssR0FBRztBQUN4QixXQUFPLE1BQU0sSUFBSSxDQUFDLE1BQU0sTUFBTSxDQUFDLENBQUM7QUFBQSxFQUNsQztBQUNBLE1BQUksVUFBVSxRQUFRLE9BQU8sVUFBVSxVQUFVO0FBQy9DLFVBQU0sTUFBTSxPQUFPLE9BQU8sT0FBTyxlQUFlLEtBQUssQ0FBQztBQUl0RCxlQUFXLE9BQU8sT0FBTyxLQUFLLEtBQUssR0FBRztBQUNwQyxVQUFJLEdBQUcsSUFBSSxNQUFPLE1BQWtDLEdBQUcsQ0FBQztBQUFBLElBQzFEO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFDQSxTQUFPO0FBQ1Q7QUFHTyxTQUFTLFVBQVUsR0FBWSxHQUFxQjtBQUN6RCxNQUFJLE1BQU0s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O0FBQy9ELHdCQUFvQixLQUFLLE1BQU0sTUFBTSxTQUFTO0FBQzlDLHVCQUFtQixJQUFJO0FBQ3ZCLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQSxFQUdBLEtBQUssSUFBcUI7QUFDeEIsVUFBTSxPQUFPLE1BQU0sS0FBSyxJQUFJO0FBQzVCLFFBQUksQ0FBQyxLQUFLLEtBQUssRUFBRSxFQUFHLFFBQU87QUFDM0Isd0JBQW9CLEtBQUssTUFBTSxNQUFNLElBQUk7QUFDekMsU0FBSyxTQUFTO0FBQ2QsU0FBSyxRQUFRLElBQUk7QUFDakIsU0FBSyxPQUFPLE1BQU0sSUFBSTtBQUN0QixXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsU0FBUyxRQUFnQixJQUFzQjtBQUM3QyxVQUFNLE9BQU8sS0FBSyxjQUFjLFFBQVEsRUFBRTtBQUMxQyxTQUFLLFFBQVEsSUFBSTtBQUNqQixTQUFLLE9BQU87QUFDWixXQUFPLEtBQUssU0FBUyxFQUFFO0FBQUEsRUFDekI7QUFBQSxFQUVBLFNBQVMsSUFBc0I7QUFDN0IsVUFBTSxPQUFPLE1BQU0sS0FBSyxJQUFJO0FBQzVCLFFBQUksS0FBSyxLQUFLLEVBQUUsR0FBRztBQUNqQiwwQkFBb0IsS0FBSyxNQUFNLE1BQU0sSUFBSTtBQUN6QyxXQUFLLFNBQVM7QUFDZCxXQUFLLFFBQVEsSUFBSTtBQUVqQixXQUFLLE9BQU8sTUFBTSxJQUFJO0FBQUEsSUFDeEI7QUFDQSxVQUFNLFFBQWtDLENBQUM7QUFDekMsZUFBVyxLQUFLLEtBQUssS0FBSyxPQUFPO0FBQy9CLFlBQU0sRUFBRSxFQUFFLElBQUksT0FBTyxDQUFDO0FBQUEsSUFDeEI7QUFDQSxXQUFPO0FBQUEsTUFDTCxXQUFXO0FBQUEsTUFDWCxlQUFlLGVBQWUsS0FBSyxLQUFLLE9BQU8sRUFBRTtBQUFBLE1BQ2pELE9BQU8sS0FBSyxLQUFLLE1BQU0sRUFBRTtBQUFBLE1BQ3pCLGVBQWUsVUFBVSxNQUFNLEVBQUU7QUFBQSxNQUNqQyxNQUFNO0FBQUEsTUFDTixPQUFPLE9BQU8sRUFBRTtBQUFBLE1BQ2hCLFlBQVk7QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUFBLEVBRUEsT0FBTyxJQUFvQjtBQUN6QixTQUFLLFNBQVMsRUFBRTtBQUNoQixXQUFPLEtBQUssVUFBVSxpQkFBaUIsS0FBSyxJQUFJLEdBQUcsTUFBTSxDQUFDO0FBQUEsRUFDNUQ7QUFDRjsiLAogICJuYW1lcyI6IFsicmVxdWlyZSIsICJhbGxvd2VkIiwgInJlcXVpcmUiLCAiaWQiLCAiZXhhbURlYWRsaW5lIiwgImlkIiwgImEiLCAiYiIsICJpZCIsICJ0IiwgImlzT2JqZWN0IiwgInNsb3RzIiwgIndlZWtTdGFydCIsICJiYW5kIiwgImlkIiwgImlkIl0KfQo=
