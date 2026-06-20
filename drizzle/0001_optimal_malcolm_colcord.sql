CREATE TABLE `aggregation_run_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runStartedAt` timestamp NOT NULL DEFAULT (now()),
	`runCompletedAt` timestamp,
	`articlesFound` int NOT NULL DEFAULT 0,
	`articlesUpserted` int NOT NULL DEFAULT 0,
	`status` enum('running','success','failed') NOT NULL DEFAULT 'running',
	`errorMessage` text,
	`sourcesPolled` text,
	CONSTRAINT `aggregation_run_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `doc_news_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`source` varchar(255) NOT NULL,
	`url` varchar(2048) NOT NULL,
	`publishedAt` timestamp NOT NULL,
	`category` enum('incident','policy','staffing','reform','memorial','legal','other') NOT NULL DEFAULT 'other',
	`facilityTags` text,
	`summary` text,
	`status` enum('new','reviewed','archived') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`reviewedAt` timestamp,
	`reviewedBy` int,
	CONSTRAINT `doc_news_articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `doc_news_articles_url_unique` UNIQUE(`url`)
);
