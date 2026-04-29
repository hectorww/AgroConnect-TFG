<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260427174745 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add cultivo to fincas';
    }

    public function up(Schema $schema): void
    {
        // Solo añade cultivo si no existe ya latitud/longitud (evita duplicado con migración anterior)
        $this->addSql("SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'fincas' AND column_name = 'cultivo')");
        $this->addSql("SET @sql := IF(@exist = 0, 'ALTER TABLE fincas ADD cultivo VARCHAR(100) DEFAULT NULL', 'SELECT 1')");
        $this->addSql('PREPARE stmt FROM @sql');
        $this->addSql('EXECUTE stmt');
        $this->addSql('DEALLOCATE PREPARE stmt');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE fincas DROP cultivo');
    }
}
