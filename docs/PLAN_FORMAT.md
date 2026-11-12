# 学习计划文件 v7

计划用于交换安排配置，保留本机执行历史。机器定义见 [plan.schema.json](plan.schema.json)，通用示例见 [plan.example.json](plan.example.json)。当前核心为 `@tomato/core`。

## 顶层与任务

顶层为 `{ format: "tomato-todo-plan", version: 7, pomodoroMinutes, projects, tasks, blocks?, habits?, replace? }`。`pomodoroMinutes` 为 1–180；省略的集合为空，`replace` 默认 false。模板、印刷规则及印刷账本已退役，v6 交换计划明确拒绝。

任务必填 `id/title`，可设置 `notes/projectId/habitId/dueDate/reminderTime/focusMinutes/priority/estimate/tags/subtasks/repeat/repeatDays/scrapMinutes/expiryDays/recurring`。子步骤只有 `id/title`，导入新任务时从未完成开始。

`dueDate` 是发生日期（`YYYY-MM-DD`），`reminderTime` 是可选的精确提醒时间（`HH:MM`）；精确提醒必须有发生日期。没有发生日期、也没有精确提醒时间时，默认是每日循环任务。不能以空字符串代替省略或 null。

## 直接循环与完成确认

`repeat` 为 `none/daily/weekdays/weekly`，默认 none。`repeatDays` 仅用于 weekly，取不重复的 1–7（周一至周日）；空列表表示发生日期所在的星期。日期为空时按 daily 处理。

循环规则直接属于任务，无须先建立模板或批量印刷。当前任务不会因为跨日或超过预计时长报废，也不会自动堆积多次未完成项。用户明确确认完成后，保留本次记录、复制任务配置并重置步骤进度与提醒状态，生成未来下一次。下一次从发生日期与完成日期中较晚的一天之后按规则选择，跳过已错过的周期。

本机任务的 `nextTaskId` 记录已生成的下一次；撤销再完成、重启或删除下一次都不会重复生成。配置交换不含这个运行字段；已生成后继的任务导出时停止自身继续循环。完成和统计属于每次执行，计时结束不会替用户确认完成。

## 报废与待补

- 循环任务无报废期限，无论是否有精确提醒时间。
- 非循环且没有精确提醒时间：`expiryDays` 默认 0，以发生日为第 0 天；发生日结束后报废。设置 2 表示保留发生日及后续 2 个自然日。范围 0–36500。
- 非循环定时任务：计划块为全部专注段加段间休息；计划块结束后还能在 `scrapMinutes` 内补做，当天有效，默认 0，边界时刻报废。
- 已报废的任务从任务清单及其计数中隐藏，历史仍保留用于统计。
- 有发生日期和精确提醒时间，且超过“提醒时间＋计划块”的未完成、未报废任务进入待补队列。定时循环任务也适用，并可跨日保留。没有精确提醒时间的任务不进入待补队列。

`recurring` 保留本次任务的重复来源供分类与历史使用；新循环任务为 true。习惯组仍为 `{ id, name }`，关联任务直接保存循环规则。习惯的 slots 可省略或为空，表示无精确提醒的每日循环；指定星期时，time 也可留空。普通任务与教学待办均由用户明确确认完成，不凭空生成专注完成记录。

## 项目与固定占用

项目为 `{ id, name, color, appWhitelist? }`。白名单提供时替代通用清单，省略时保留本机配置；最多 100 项，每项非空、无控制字符、最多 32768 字符。愿景不参与排期。

`blocks` 是课表固定占用：`id/title/days/start/end/attention/notes`，`attention` 为 required 或 light；end 不晚于 start 表示跨午夜。固定占用不锁机、不拥有任务进度。

## 导入、导出与运行时存储

导入先完整校验候选，再原子提交。相同 ID 更新配置，保留 `completed/completedAt/createdAt/nextTaskId`、匹配步骤的完成状态与专注历史；日期与提醒不变时保留送达状态。项目白名单省略时保留。

默认保留未提及实体。`replace: true` 移除未列出的未完成普通任务、习惯组与固定占用，保留已完成任务、教学待办、项目环境、专注历史和永久 ID 历史。应用前自动备份。

导出未完成普通任务、习惯组、固定占用和引用项目，不含步骤完成状态或教学历史。runtime 的 `plan.json` 为计划 v7 加运行进度（完成、创建、提醒、`nextTaskId` 与子步骤 done）；`state.json` 保存计时、设置、历史、愿景、身份与教学记录。交换备份为 [v5](BACKUP_FORMAT.md)。本机 v6/v4 数据打开时做一次性转换，保留已印任务与历史，把旧每周模板的后续循环移到对应最后一条未完成任务上；不再预印。

普通任务通过 `saveTask/toggleTask` 维护，习惯通过 `saveHabit/saveHabitGroup/deleteHabit`，固定占用通过 `saveBlock/deleteBlock`。所有 HTTP、Host 和 MCP 入口共用核心校验与保护规则。

正式学期、课程、作业、考试和批改通过 education 工具维护，不放进计划交换文件。完整提交答卷后仍需用户确认任务完成。课程用 `Lesson.resourceIds`、作业与考试用 `Assessment.resourceIds` 指定本次资料；逐题依据用 `Question.sourceIds`。没有指定时界面回退到项目资料，见 [应试教学](EDUCATION.md)。
