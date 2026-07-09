CREATE TABLE `configuracoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailZeglam` varchar(320),
	`senhaZeglam` varchar(256),
	`chavePix` varchar(256),
	`whatsappAutomatico` enum('on','off') NOT NULL DEFAULT 'on',
	`mensagemCobranca` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `configuracoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devedores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relatorioId` int NOT NULL,
	`nome` varchar(256) NOT NULL,
	`whatsapp` varchar(32) NOT NULL,
	`valor` varchar(64) NOT NULL,
	`status` varchar(64) NOT NULL,
	`linkOrigem` varchar(256),
	`cobrancaEnviada` enum('pendente','enviada','falhou') NOT NULL DEFAULT 'pendente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `devedores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `manual_instrucoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conteudo` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manual_instrucoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `relatorios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tipoRelatorio` varchar(128) NOT NULL,
	`linkAlvo` varchar(256),
	`comandoOriginal` text NOT NULL,
	`totalDevedores` int NOT NULL DEFAULT 0,
	`valorTotal` varchar(64) NOT NULL DEFAULT 'R$ 0,00',
	`status` enum('concluido','erro','processando') NOT NULL DEFAULT 'processando',
	`dadosJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `relatorios_id` PRIMARY KEY(`id`)
);
