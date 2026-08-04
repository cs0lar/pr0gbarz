CREATE TABLE `app_metadata` (
	`id` integer PRIMARY KEY,
	`product` text NOT NULL,
	`major_version` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	CONSTRAINT "app_metadata_singleton_check" CHECK("id" = 1),
	CONSTRAINT "app_metadata_product_check" CHECK("product" = 'pr0gbarz'),
	CONSTRAINT "app_metadata_major_version_check" CHECK("major_version" = 2)
);
--> statement-breakpoint
CREATE TABLE `progress_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`task_id` integer NOT NULL,
	`previous_progress` integer NOT NULL,
	`new_progress` integer NOT NULL,
	`note` text,
	`occurred_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	CONSTRAINT `fk_progress_events_task_id_tasks_id_fk` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
	CONSTRAINT "progress_events_previous_progress_check" CHECK("previous_progress" BETWEEN 0 AND 100),
	CONSTRAINT "progress_events_new_progress_check" CHECK("new_progress" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`description` text,
	`accent_color` text,
	`start_date` text,
	`target_date` text,
	`sort_position` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	CONSTRAINT "projects_name_check" CHECK(length(trim("name")) > 0),
	CONSTRAINT "projects_start_date_format_check" CHECK("start_date" IS NULL OR (length("start_date") = 10 AND "start_date" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')),
	CONSTRAINT "projects_target_date_format_check" CHECK("target_date" IS NULL OR (length("target_date") = 10 AND "target_date" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')),
	CONSTRAINT "projects_date_order_check" CHECK("start_date" IS NULL OR "target_date" IS NULL OR "start_date" <= "target_date")
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`normalized_name` text NOT NULL,
	`label` text NOT NULL,
	`color` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	CONSTRAINT "tags_normalized_name_check" CHECK(length(trim("normalized_name")) > 0),
	CONSTRAINT "tags_label_check" CHECK(length(trim("label")) > 0)
);
--> statement-breakpoint
CREATE TABLE `task_tags` (
	`task_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	CONSTRAINT `task_tags_pk` PRIMARY KEY(`task_id`, `tag_id`),
	CONSTRAINT `fk_task_tags_task_id_tasks_id_fk` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_task_tags_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`project_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'backlog' NOT NULL,
	`priority` text DEFAULT 'none' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`start_date` text,
	`due_date` text,
	`sort_position` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	CONSTRAINT `fk_tasks_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
	CONSTRAINT "tasks_name_check" CHECK(length(trim("name")) > 0),
	CONSTRAINT "tasks_status_check" CHECK("status" IN ('backlog', 'planned', 'in_progress', 'blocked', 'completed')),
	CONSTRAINT "tasks_priority_check" CHECK("priority" IN ('none', 'low', 'medium', 'high', 'urgent')),
	CONSTRAINT "tasks_progress_check" CHECK("progress" BETWEEN 0 AND 100),
	CONSTRAINT "tasks_start_date_format_check" CHECK("start_date" IS NULL OR (length("start_date") = 10 AND "start_date" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')),
	CONSTRAINT "tasks_due_date_format_check" CHECK("due_date" IS NULL OR (length("due_date") = 10 AND "due_date" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')),
	CONSTRAINT "tasks_completion_check" CHECK(("status" = 'completed' AND "progress" = 100 AND "completed_at" IS NOT NULL) OR ("status" <> 'completed' AND "completed_at" IS NULL)),
	CONSTRAINT "tasks_date_order_check" CHECK("start_date" IS NULL OR "due_date" IS NULL OR "start_date" <= "due_date")
);
--> statement-breakpoint
CREATE INDEX `progress_events_task_occurred_idx` ON `progress_events` (`task_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `projects_active_sort_idx` ON `projects` (`archived_at`,`sort_position`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_normalized_name_unique` ON `tags` (`normalized_name`);--> statement-breakpoint
CREATE INDEX `task_tags_tag_idx` ON `task_tags` (`tag_id`);--> statement-breakpoint
CREATE INDEX `tasks_project_active_sort_idx` ON `tasks` (`project_id`,`archived_at`,`sort_position`);--> statement-breakpoint
CREATE INDEX `tasks_project_status_idx` ON `tasks` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `tasks_due_date_idx` ON `tasks` (`due_date`);--> statement-breakpoint
INSERT INTO `app_metadata` (`id`, `product`, `major_version`) VALUES (1, 'pr0gbarz', 2);
