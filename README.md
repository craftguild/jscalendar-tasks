# JSCalendar Tasks

JSCalendar Tasks is a small multilingual task management app built with Next.js, Prisma, SQLite, and [`jscalendar.ts`](https://github.com/craft-guild/jscalendar).

This project is designed to provide a **real-world example of how JSCalendar data can be created, stored, expanded, and edited in an application**. It is intended to be more than a toy recurrence demo. The app shows how tasks are persisted, tagged, completed, filtered by history month, and exposed through an iCalendar endpoint.

## Why This Project Exists

`jscalendar.ts` provides a practical TypeScript implementation of the JSCalendar model. JSCalendar Tasks is intended to show how that model can be used in a product-like workflow:

- Creating task records as JSCalendar objects.
- Storing JSCalendar payloads as JSON through Prisma.
- Mapping form input to `RecurrenceRule`.
- Expanding recurring tasks into concrete occurrences.
- Handling completed occurrences separately from the source task.
- Exporting events through an iCalendar-compatible endpoint.

If you are evaluating JSCalendar for a real application, this repository is intended to help you understand one possible architecture.

## Features

- Task creation and editing.
- One-time and recurring tasks.
- Daily, weekly, monthly, and yearly recurrence schedules.
- Weekly recurrence rules with multiple weekdays.
- Monthly recurrence rules by day of month or nth weekday.
- Completion registration for individual occurrences.
- Completion history grouped and filtered by month.
- Tags with per-task tag colors.
- Attachments for completion records.
- Infinite scrolling for upcoming occurrences.
- iCalendar feed endpoint.
- Multilingual UI with English as the default and fallback locale.
- UI language support for English, Japanese, Simplified Chinese, Traditional Chinese, Korean, French, German, and Spanish.
- Noto Sans based web font stack for consistent multilingual rendering.

## Tech Stack

- Next.js App Router
- React
- Prisma 6
- SQLite
- `@craftguild/jscalendar`
- Tailwind CSS
- npm

## Quick Start

The following commands set up the local database, insert sample data, and start the development server:

```bash
npm install
cp .env.example .env
npm exec prisma generate
npm exec prisma migrate dev
npm exec prisma db seed
npm run dev
```

Then open `http://localhost:3000`.

## Docker Quick Start

The Docker image is the recommended way to run JSCalendar Tasks outside local development. Use the published image from GitHub Container Registry:

```bash
docker pull ghcr.io/<owner>/jscalendar-tasks:sha-<commit>
```

Create a Docker volume for the SQLite database and attachments:

```bash
docker volume create jscalendar-tasks-data
```

Run the container:

```bash
docker run --rm \
  -p 3000:3000 \
  -v jscalendar-tasks-data:/app/data \
  ghcr.io/<owner>/jscalendar-tasks:sha-<commit>
```

Then open `http://localhost:3000`.

The container entrypoint runs `prisma migrate deploy` before starting the standalone Next.js server. By default, SQLite data is stored at `/app/data/jscalendar-tasks.db`, and attachments are stored at `/app/data/attachments`.

## Architecture

JSCalendar Tasks keeps JSCalendar at the center of the task workflow. The application form collects task fields and recurrence settings, then maps them into a JSCalendar `Task` object. The resulting JSCalendar payload is stored as JSON through Prisma, so the original scheduling model remains available for later expansion and export.

Upcoming tasks are displayed by expanding the stored JSCalendar data into concrete occurrences. Completion records are stored separately from the source task, which makes it possible to mark one occurrence as completed without changing the recurrence rule itself. The history page reads those completion records and groups them by month.

The iCalendar endpoint uses the same stored task data as the application UI. This keeps the app UI, occurrence expansion, completion history, and calendar export aligned around the same JSCalendar source data.

In short, the flow is:

- Form input.
- JSCalendar `Task`.
- Prisma JSON storage.
- Occurrence expansion.
- Completion records.
- iCalendar export.

## Adding A Locale

English is the default locale and the fallback locale. New languages should be added in a way that keeps the app usable even when a translation is incomplete.

To add another locale:

1. Add the language code to `LanguageCode` in `src/lib/language.ts`.
2. Add a `LANGUAGE_PROFILES` entry with the HTML `lang` value.
3. Add the `LANGUAGE_LOCALES` entry used by `Intl` date, weekday, and month formatting.
4. Add the language option label keys in `src/lib/i18n.tsx`.
5. Add a message dictionary in `src/lib/i18n.tsx`.
6. Add the language to `LanguageSelector` so users can select it.
7. Add seed data for the locale in `prisma/seed.ts` if sample content should demonstrate that language.

Date, weekday, and month names should prefer `Intl` formatting instead of hard-coded translated strings. This keeps locale-specific ordering and punctuation aligned with the user's language. Font support is centralized through the Noto Sans web font stack in `src/lib/language.ts` and `src/app/layout.tsx`, so new locales should reuse that stack unless the language requires a separate script-specific font. If a message is not available, the app should fall back to English rather than rendering an empty label.

## Development

Install the dependencies:

```bash
npm install
```

Create an environment file if you need one:

```bash
DATABASE_URL="file:data/jscalendar-tasks.db"
```

Generate the Prisma client and apply the migrations:

```bash
npm exec prisma generate
npm exec prisma migrate dev
```

Seed the sample data:

```bash
npm exec prisma db seed
```

The seed data inserts two work-related tags and two work-related tasks for each supported language. Each seeded task is linked to multiple tags, recurrence rules are randomized on each seed run, and task start dates are spread across past and future dates.

Start the development server:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Useful Commands

Run lint:

```bash
npm run lint
```

Build the app:

```bash
npm run build
```

Run the production server after building:

```bash
npm run start
```

## Release Helpers

The repository includes a minimal Makefile for environments where Docker is not available. It builds and installs the standalone Next.js output directly on a Linux host.

Generate the Prisma client:

```bash
make prepare
```

Build the standalone Next.js output:

```bash
make build
```

Install the standalone output, default environment file, and systemd unit on Linux:

```bash
make install
```

## systemd

The systemd files are provided as a fallback deployment option for Linux hosts that cannot run Docker. For production deployments, the Docker image is the primary supported path.

The project includes:

- `Makefile`
- `systemd/jscalendar-tasks.service`
- `systemd/defaults/jscalendar-tasks.env`

The default systemd settings are:

- app dir: `/opt/craftguild/jscalendar-tasks`
- releases dir: `/opt/craftguild/jscalendar-tasks/releases/<timestamp>`
- current release symlink: `/opt/craftguild/jscalendar-tasks/current`
- service name: `jscalendar-tasks.service`
- port: `3000`
- env file: `/etc/defaults/craftguild/jscalendar-tasks/jscalendar-tasks`
- data dir: `/var/lib/craftguild/jscalendar-tasks`
- attachments dir: `/var/lib/craftguild/jscalendar-tasks/attachments`

Install the app and unit files:

```bash
make install
```

The default env file contains:

```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
HOSTNAME=0.0.0.0
DATABASE_URL="file:/var/lib/craftguild/jscalendar-tasks/jscalendar-tasks.db"
ATTACHMENTS_DIR="/var/lib/craftguild/jscalendar-tasks/attachments"
```
