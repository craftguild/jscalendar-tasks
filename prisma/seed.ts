import { JsCal } from "@craftguild/jscalendar";
import type { DayOfWeek, RecurrenceRule, TimeZoneId } from "@craftguild/jscalendar";
import { mkdir, rm } from "node:fs/promises";
import type { Prisma } from "../src/generated/prisma/client";
import { getAttachmentsRoot } from "../src/lib/attachments";
import { prisma } from "../src/lib/prisma";

type SeedLanguage = "en" | "ja" | "zh" | "zh-Hant" | "ko" | "fr" | "de" | "es";

type SeedTask = {
  title: string;
  description: string;
};

type SeedEntry = {
  language: SeedLanguage;
  tags: [
    {
      name: string;
      color: string;
    },
    {
      name: string;
      color: string;
    },
  ];
  tasks: [SeedTask, SeedTask];
};

const timeZone = "Asia/Tokyo" as TimeZoneId;
const weekdays: DayOfWeek[] = ["mo", "tu", "we", "th", "fr"];
const monthDays = [1, 5, 10, 15, 20, 25];
const startOffsets = [-60, -45, -32, -21, -14, -6, -3, -1, 3, 8, 11, 18, 24, 35, 42, 70];

const seedEntries: SeedEntry[] = [
  {
    language: "en",
    tags: [
      { name: "Work Planning", color: "#14b8a6" },
      { name: "Team Follow-up", color: "#60a5fa" },
    ],
    tasks: [
      {
        title: "Prepare weekly project update",
        description: "Summarize progress, blockers, and next actions for the team.",
      },
      {
        title: "Review customer feedback",
        description: "Check recent feedback and convert important items into follow-up tasks.",
      },
    ],
  },
  {
    language: "ja",
    tags: [
      { name: "業務計画", color: "#60a5fa" },
      { name: "チーム連携", color: "#14b8a6" },
    ],
    tasks: [
      {
        title: "週次プロジェクト報告を作成",
        description: "進捗、課題、次の対応を整理してチームに共有します。",
      },
      {
        title: "顧客フィードバックを確認",
        description: "最近のフィードバックを確認し、重要な項目を次の対応に落とし込みます。",
      },
    ],
  },
  {
    language: "zh",
    tags: [
      { name: "工作计划", color: "#a78bfa" },
      { name: "团队协作", color: "#f59e0b" },
    ],
    tasks: [
      {
        title: "准备每周项目更新",
        description: "整理进展、阻碍事项和下一步行动，并分享给团队。",
      },
      {
        title: "查看客户反馈",
        description: "检查最近的反馈，并把重要内容转化为后续任务。",
      },
    ],
  },
  {
    language: "zh-Hant",
    tags: [
      { name: "工作規劃", color: "#22c55e" },
      { name: "團隊協作", color: "#f43f5e" },
    ],
    tasks: [
      {
        title: "準備每週專案更新",
        description: "整理進度、阻礙事項和下一步行動，並分享給團隊。",
      },
      {
        title: "檢視客戶回饋",
        description: "檢查最近的回饋，並把重要內容轉化為後續任務。",
      },
    ],
  },
  {
    language: "ko",
    tags: [
      { name: "업무 계획", color: "#f59e0b" },
      { name: "팀 협업", color: "#a78bfa" },
    ],
    tasks: [
      {
        title: "주간 프로젝트 업데이트 준비",
        description: "진행 상황, 막힌 부분, 다음 작업을 정리해 팀에 공유합니다.",
      },
      {
        title: "고객 피드백 검토",
        description: "최근 피드백을 확인하고 중요한 항목을 후속 작업으로 정리합니다.",
      },
    ],
  },
  {
    language: "fr",
    tags: [
      { name: "Planification du travail", color: "#f43f5e" },
      { name: "Suivi d'équipe", color: "#14b8a6" },
    ],
    tasks: [
      {
        title: "Préparer le point projet hebdomadaire",
        description: "Résumer l'avancement, les blocages et les prochaines actions pour l'équipe.",
      },
      {
        title: "Examiner les retours clients",
        description: "Analyser les derniers retours et transformer les points importants en actions.",
      },
    ],
  },
  {
    language: "de",
    tags: [
      { name: "Arbeitsplanung", color: "#0ea5e9" },
      { name: "Team-Nachverfolgung", color: "#84cc16" },
    ],
    tasks: [
      {
        title: "Wöchentlichen Projektstatus vorbereiten",
        description: "Fortschritt, Blocker und nächste Schritte für das Team zusammenfassen.",
      },
      {
        title: "Kundenfeedback prüfen",
        description: "Aktuelles Feedback prüfen und wichtige Punkte in Folgemaßnahmen überführen.",
      },
    ],
  },
  {
    language: "es",
    tags: [
      { name: "Planificación del trabajo", color: "#ec4899" },
      { name: "Seguimiento del equipo", color: "#06b6d4" },
    ],
    tasks: [
      {
        title: "Preparar la actualización semanal del proyecto",
        description: "Resumir avances, bloqueos y próximas acciones para el equipo.",
      },
      {
        title: "Revisar comentarios de clientes",
        description: "Comprobar comentarios recientes y convertir los puntos importantes en acciones.",
      },
    ],
  },
];

/**
 * Picks a random item from a non-empty list, falling back to the first item.
 */
function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}

/**
 * Returns a random integer within the inclusive range.
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Formats a Date as a JSCalendar LocalDateTime string.
 */
function toLocalDateTime(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

/**
 * Builds a seeded task start date using a day offset and deterministic hour spread.
 */
function buildStartDate(offsetDays: number, index: number): Date {
  const base = new Date();
  base.setDate(base.getDate() + offsetDays);
  base.setHours(9 + ((index * 2) % 8), randomItem([0, 15, 30, 45]), 0, 0);
  return base;
}

/**
 * Builds a randomized recurrence rule suitable for work-task seed data.
 */
function buildRandomRecurrenceRule(startDate: Date): RecurrenceRule {
  const frequency = randomItem<RecurrenceRule["frequency"]>([
    "daily",
    "weekly",
    "monthly",
    "yearly",
  ]);
  const base: RecurrenceRule = {
    "@type": "RecurrenceRule",
    frequency,
    interval: randomItem([1, 1, 2, 3]),
    skip: "backward",
  };

  if (Math.random() < 0.45) {
    base.count = randomInt(4, 12);
  } else {
    const until = new Date(startDate);
    until.setDate(until.getDate() + randomInt(30, 180));
    base.until = toLocalDateTime(until);
  }

  if (frequency === "weekly") {
    const firstDay = randomItem(weekdays);
    const secondDay = randomItem(weekdays.filter((day) => day !== firstDay));
    base.byDay = [
      { "@type": "NDay" as const, day: firstDay },
      { "@type": "NDay" as const, day: secondDay },
    ].sort((a, b) => weekdays.indexOf(a.day) - weekdays.indexOf(b.day));
  }

  if (frequency === "monthly") {
    if (Math.random() < 0.5) {
      base.byMonthDay = [randomItem(monthDays)];
    } else {
      base.byDay = [
        {
          "@type": "NDay" as const,
          day: randomItem(weekdays),
          nthOfPeriod: randomInt(1, 4),
        },
      ];
    }
  }

  if (frequency === "yearly") {
    base.byMonth = [String(startDate.getMonth() + 1)];
    base.byMonthDay = [startDate.getDate()];
  }

  return base;
}

/**
 * Creates the persisted JSCalendar task payload for a seed task.
 */
function buildTaskPayload(task: SeedTask, startDate: Date) {
  const eventData = new JsCal.Task({
    title: task.title,
    description: task.description,
    start: toLocalDateTime(startDate),
    timeZone,
    recurrenceRules: [buildRandomRecurrenceRule(startDate)],
  });

  return JSON.parse(JSON.stringify(eventData.eject())) as Prisma.InputJsonValue;
}

/**
 * Replaces previous seed tasks and inserts multilingual sample work tasks.
 */
export async function seedDatabase() {
  const attachmentsRoot = getAttachmentsRoot();
  await rm(attachmentsRoot, { recursive: true, force: true });
  await mkdir(attachmentsRoot, { recursive: true });

  await prisma.attachment.deleteMany();
  await prisma.completion.deleteMany();
  await prisma.eventTag.deleteMany();
  await prisma.event.deleteMany();
  await prisma.tag.deleteMany();

  let taskIndex = 0;
  for (const entry of seedEntries) {
    const tagRecords = await Promise.all(
      entry.tags.map((tag) =>
        prisma.tag.upsert({
          where: { name: tag.name },
          update: { color: tag.color },
          create: tag,
        }),
      ),
    );

    for (const task of entry.tasks) {
      const startDate = buildStartDate(startOffsets[taskIndex] ?? 0, taskIndex);
      const jscal = buildTaskPayload(task, startDate);

      await prisma.event.create({
        data: {
          title: task.title,
          notes: null,
          jscal,
          tags: {
            create: tagRecords.map((tag, position) => ({
              tag: { connect: { id: tag.id } },
              color: entry.tags[position]?.color ?? tag.color,
              position,
            })),
          },
        },
      });

      taskIndex += 1;
    }
  }
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seedDatabase()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error: unknown) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
