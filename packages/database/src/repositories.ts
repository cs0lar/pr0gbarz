import { eq } from 'drizzle-orm'

import type { Pr0gbarzDatabase } from './connection.js'
import {
  projects,
  tags,
  tasks,
  type NewProject,
  type NewTag,
  type NewTask,
  type Project,
  type Tag,
  type Task,
} from './schema.js'

export interface ProjectRepository {
  create(input: NewProject): Project
  findById(id: number): Project | undefined
}

export interface TaskRepository {
  create(input: NewTask): Task
  findById(id: number): Task | undefined
}

export interface TagRepository {
  create(input: NewTag): Tag
  findByNormalizedName(normalizedName: string): Tag | undefined
}

export interface Repositories {
  projects: ProjectRepository
  tags: TagRepository
  tasks: TaskRepository
}

export function createRepositories(db: Pr0gbarzDatabase): Repositories {
  return {
    projects: {
      create: (input) => db.insert(projects).values(input).returning().get(),
      findById: (id) =>
        db.select().from(projects).where(eq(projects.id, id)).get(),
    },
    tags: {
      create: (input) => db.insert(tags).values(input).returning().get(),
      findByNormalizedName: (normalizedName) =>
        db
          .select()
          .from(tags)
          .where(eq(tags.normalizedName, normalizedName))
          .get(),
    },
    tasks: {
      create: (input) => db.insert(tasks).values(input).returning().get(),
      findById: (id) => db.select().from(tasks).where(eq(tasks.id, id)).get(),
    },
  }
}
