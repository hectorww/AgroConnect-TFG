<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260427182330 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE alertas CHANGE leida leida TINYINT NOT NULL');
        $this->addSql('ALTER TABLE fincas ADD latitud DOUBLE PRECISION DEFAULT NULL, ADD longitud DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('DROP INDEX token ON user');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8D93D6495F37A13B ON user (token)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE alertas CHANGE leida leida TINYINT DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE fincas DROP latitud, DROP longitud');
        $this->addSql('DROP INDEX uniq_8d93d6495f37a13b ON user');
        $this->addSql('CREATE UNIQUE INDEX token ON user (token)');
    }
}
