<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260427174658 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add latitud/longitud to fincas, fix token index on user';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE fincas ADD latitud DOUBLE PRECISION DEFAULT NULL, ADD longitud DOUBLE PRECISION DEFAULT NULL');
        // Eliminar el índice solo si existe (compatible con BD limpia y BD migrada)
        $this->addSql("SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'user' AND index_name = 'token')");
        $this->addSql("SET @sql := IF(@exist > 0, 'DROP INDEX token ON user', 'SELECT 1')");
        $this->addSql('PREPARE stmt FROM @sql');
        $this->addSql('EXECUTE stmt');
        $this->addSql('DEALLOCATE PREPARE stmt');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8D93D6495F37A13B ON user (token)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE fincas DROP latitud, DROP longitud');
        $this->addSql('DROP INDEX UNIQ_8D93D6495F37A13B ON user');
        $this->addSql('CREATE UNIQUE INDEX token ON user (token)');
    }
}
