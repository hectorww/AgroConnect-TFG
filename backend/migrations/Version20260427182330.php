<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260427182330 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Fix alertas.leida column';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE alertas CHANGE leida leida TINYINT NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE alertas CHANGE leida leida TINYINT DEFAULT 0 NOT NULL');
    }
}
