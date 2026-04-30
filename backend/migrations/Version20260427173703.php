<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260427173703 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add cultivo, latitud, longitud to fincas; fix token index on user; fix leida on alertas';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE alertas CHANGE leida leida TINYINT NOT NULL');
        $this->addSql('ALTER TABLE fincas ADD cultivo VARCHAR(100) DEFAULT NULL, ADD latitud DOUBLE PRECISION DEFAULT NULL, ADD longitud DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('DROP INDEX token ON user');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8D93D6495F37A13B ON user (token)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE alertas CHANGE leida leida TINYINT DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE fincas DROP cultivo, DROP latitud, DROP longitud');
        $this->addSql('DROP INDEX UNIQ_8D93D6495F37A13B ON user');
        $this->addSql('CREATE UNIQUE INDEX token ON user (token)');
    }
}
