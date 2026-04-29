<?php

namespace App\Entity;

use App\Repository\FincasRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FincasRepository::class)]
class Fincas
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'fincas')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(length: 100)]
    private ?string $nombre = null;

    #[ORM\Column]
    private ?float $hectareas = null;

    #[ORM\Column]
    private array $geo_json = [];

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $cultivo = null;

        #[ORM\Column(nullable: true)]
    private ?float $latitud = null;

    #[ORM\Column(nullable: true)]
    private ?float $longitud = null;

    #[ORM\OneToMany(targetEntity: Alertas::class, mappedBy: 'finca', orphanRemoval: true)]
    private Collection $alertas;

    public function __construct()
    {
        $this->alertas = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getNombre(): ?string
    {
        return $this->nombre;
    }

    public function setNombre(string $nombre): static
    {
        $this->nombre = $nombre;

        return $this;
    }

    public function getHectareas(): ?float
    {
        return $this->hectareas;
    }

    public function setHectareas(float $hectareas): static
    {
        $this->hectareas = $hectareas;

        return $this;
    }

    public function getGeoJson(): array
    {
        return $this->geo_json;
    }

    public function setGeoJson(array $geo_json): static
    {
        $this->geo_json = $geo_json;

        return $this;
    }

    public function getCultivo(): ?string
    {
        return $this->cultivo;
    }

    public function setCultivo(?string $cultivo): static
    {
        $this->cultivo = $cultivo;

        return $this;
    }

    /**
     * @return Collection<int, Alertas>
     */
    public function getAlertas(): Collection
    {
        return $this->alertas;
    }

    public function addAlerta(Alertas $alerta): static
    {
        if (!$this->alertas->contains($alerta)) {
            $this->alertas->add($alerta);
            $alerta->setFinca($this);
        }

        return $this;
    }

    public function removeAlerta(Alertas $alerta): static
    {
        if ($this->alertas->removeElement($alerta)) {
            if ($alerta->getFinca() === $this) {
                $alerta->setFinca(null);
            }
        }

        return $this;
    }
    public function getLatitud(): ?float
    {
        return $this->latitud;
    }

    public function setLatitud(?float $latitud): static
    {
        $this->latitud = $latitud;

        return $this;
    }

    public function getLongitud(): ?float
    {
        return $this->longitud;
    }

    public function setLongitud(?float $longitud): static
    {
        $this->longitud = $longitud;

        return $this;
    }
}
