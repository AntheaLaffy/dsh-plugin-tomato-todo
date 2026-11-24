import type { BtwNote, BtwStatus } from "./types";

export function noteGroups(
  notes: BtwNote[],
  later: boolean,
  escape: (value: string) => string,
) {
  const days = new Map<string, string[]>();
  const dateFormat = new Intl.DateTimeFormat("zh-CN", { dateStyle: "long" });
  const timeFormat = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  // Reverse insertion order breaks ties between notes saved in the same second.
  for (const note of [...notes]
    .reverse()
    .sort((a, b) => b.createdAt - a.createdAt)) {
    if (later && note.status !== "later") continue;
    const date = new Date(note.createdAt * 1000);
    const day = dateFormat.format(date);
    if (!days.has(day)) days.set(day, []);
    const id = escape(note.id);
    const action = (status: BtwStatus, label: string) =>
      `<button class="text-button" data-btw-id="${id}" data-btw-status="${status}">${label}</button>`;
    const check =
      note.status === "note"
        ? ""
        : `<label class="btw-check"><input type="checkbox" aria-label="${note.status === "done" ? "撤销完成" : "标为已完成"}" data-btw-id="${id}" ${note.status === "done" ? "checked" : ""}>${note.status === "done" ? "已完成" : "稍后做"}</label>`;
    days
      .get(day)!
      .push(
        `<article class="btw-note"><header><time>${timeFormat.format(date)}</time>${check}<details><summary aria-label="笔记操作">•••</summary>${note.status === "note" ? action("later", "标为稍后做") : action("note", "恢复为普通笔记")}</details></header><p>${escape(note.text)}</p></article>`,
      );
  }
  return (
    [...days]
      .map(
        ([day, rows]) => `<section><h3>${day}</h3>${rows.join("")}</section>`,
      )
      .join("") ||
    `<p class="small-empty">${later ? "还没有标为稍后做的笔记" : "还没有 BTW 笔记"}</p>`
  );
}
