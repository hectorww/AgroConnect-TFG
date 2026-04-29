<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use App\Entity\Fincas;
use App\Entity\User;

#[Route('/api', name: 'api_')]
class FincasController extends AbstractController
{
    #[Route('/fincas', name: 'fincas_index', methods: ['get'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function index(EntityManagerInterface $entityManager): JsonResponse
    {
        $user = $this->getUser();
        assert($user instanceof User);

        if ($user->isAdmin()) {
            $fincas = $entityManager->getRepository(Fincas::class)->findAll();
        } else {
            $fincas = $entityManager
                ->getRepository(Fincas::class)
                ->findBy(['user' => $user]);
        }

        $data = [];
        foreach ($fincas as $finca) {
            $data[] = [
                'id' => $finca->getId(),
                'user_id' => $finca->getUser()?->getId(),
                'nombre' => $finca->getNombre(),
                'hectareas' => $finca->getHectareas(),
                'cultivo' => $finca->getCultivo(),
                'geo_json' => $finca->getGeoJson(),
                'latitud' => $finca->getLatitud(),   // AÑADIDO
                'longitud' => $finca->getLongitud(), // AÑADIDO
            ];
        }

        return $this->json($data);
    }

    #[Route('/fincas', name: 'fincas_create', methods: ['post'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function create(EntityManagerInterface $entityManager, Request $request): JsonResponse
    {
        $user = $this->getUser();
        assert($user instanceof User);

        try {
            $data = json_decode($request->getContent(), true, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            return $this->json(['error' => 'Invalid JSON format'], 400);
        }

        if (!isset($data['nombre'])) {
            return $this->json(['error' => 'Field nombre is required'], 400);
        }

        $nombre = $data['nombre'];
        $hectareas = $data['hectareas'] ?? null;
        $geoJson = $data['geo_json'] ?? [];
        $cultivo = $data['cultivo'] ?? null;
        
        // AÑADIDO: Capturar coordenadas del Frontend
        $latitud = $data['latitud'] ?? null;
        $longitud = $data['longitud'] ?? null;

        if (!is_string($nombre) || strlen($nombre) === 0) {
            return $this->json(['error' => 'Field nombre must be a non-empty string'], 400);
        }
        if (strlen($nombre) > 255) {
            return $this->json(['error' => 'Field nombre must not exceed 255 characters'], 400);
        }
        if ($hectareas !== null) {
            if (!is_numeric($hectareas)) {
                return $this->json(['error' => 'Field hectareas must be numeric'], 400);
            }
            if ($hectareas <= 0) {
                return $this->json(['error' => 'Field hectareas must be greater than 0'], 400);
            }
        }
        if (!is_array($geoJson)) {
            return $this->json(['error' => 'Field geo_json must be an array'], 400);
        }
        
        $finca = new Fincas();
        $finca->setUser($user);
        $finca->setNombre($nombre);
        $finca->setHectareas($hectareas);
        $finca->setCultivo($cultivo);
        $finca->setGeoJson($geoJson);
        
        // AÑADIDO: Guardar coordenadas en la entidad
        $finca->setLatitud($latitud);
        $finca->setLongitud($longitud);

        $entityManager->persist($finca);
        $entityManager->flush();

        $responseData = [
            'id' => $finca->getId(),
            'user_id' => $finca->getUser()->getId(),
            'nombre' => $finca->getNombre(),
            'hectareas' => $finca->getHectareas(),
            'cultivo' => $finca->getCultivo(),
            'geo_json' => $finca->getGeoJson(),
            'latitud' => $finca->getLatitud(),   // AÑADIDO
            'longitud' => $finca->getLongitud(), // AÑADIDO
        ];

        return $this->json($responseData, 201);
    }

    #[Route('/fincas/{id}', name: 'fincas_show', methods: ['get'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function show(EntityManagerInterface $entityManager, int $id): JsonResponse
    {
        $user = $this->getUser();
        assert($user instanceof User);

        $finca = $entityManager->getRepository(Fincas::class)->find($id);
        if (!$finca) {
            return $this->json(['error' => 'Finca not found'], 404);
        }
        $fincaUser = $finca->getUser();
        if (!$user->isAdmin() && $fincaUser->getId() !== $user->getId()) {
            return $this->json(['error' => 'Unauthorized'], 403);
        }

        $data = [
            'id' => $finca->getId(),
            'user_id' => $finca->getUser()?->getId(),
            'nombre' => $finca->getNombre(),
            'hectareas' => $finca->getHectareas(),
            'cultivo' => $finca->getCultivo(),
            'geo_json' => $finca->getGeoJson(),
            'latitud' => $finca->getLatitud(),   // AÑADIDO
            'longitud' => $finca->getLongitud(), // AÑADIDO
        ];

        return $this->json($data);
    }

    #[Route('/fincas/{id}', name: 'fincas_update', methods: ['put', 'patch'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function update(EntityManagerInterface $entityManager, Request $request, int $id): JsonResponse
    {
        $user = $this->getUser();
        assert($user instanceof User);

        $finca = $entityManager->getRepository(Fincas::class)->find($id);
        if (!$finca) {
            return $this->json(['error' => 'Finca not found'], 404);
        }
        $fincaUser = $finca->getUser();
        if (!$user->isAdmin() && $fincaUser->getId() !== $user->getId()) {
            return $this->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $data = json_decode($request->getContent(), true, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            return $this->json(['error' => 'Invalid JSON format'], 400);
        }

        if (isset($data['nombre'])) {
            $finca->setNombre($data['nombre']);
        }
        if (isset($data['hectareas'])) {
            $finca->setHectareas($data['hectareas']);
        }
        if (isset($data['geo_json'])) {
            $finca->setGeoJson($data['geo_json']);
        }
        if (array_key_exists('cultivo', $data)) {
            $finca->setCultivo($data['cultivo']);
        }
        
        // AÑADIDO: Actualizar coordenadas
        if (array_key_exists('latitud', $data)) {
            $finca->setLatitud($data['latitud']);
        }
        if (array_key_exists('longitud', $data)) {
            $finca->setLongitud($data['longitud']);
        }

        $entityManager->flush();

        $responseData = [
            'id' => $finca->getId(),
            'user_id' => $finca->getUser()->getId(),
            'nombre' => $finca->getNombre(),
            'hectareas' => $finca->getHectareas(),
            'cultivo' => $finca->getCultivo(),
            'geo_json' => $finca->getGeoJson(),
            'latitud' => $finca->getLatitud(),   // AÑADIDO
            'longitud' => $finca->getLongitud(), // AÑADIDO
        ];

        return $this->json($responseData);
    }

    #[Route('/fincas/{id}', name: 'fincas_delete', methods: ['delete'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function delete(EntityManagerInterface $entityManager, int $id): JsonResponse
    {
        $user = $this->getUser();
        assert($user instanceof User);

        $finca = $entityManager->getRepository(Fincas::class)->find($id);
        if (!$finca) {
            return $this->json(['error' => 'Finca not found'], 404);
        }
        $fincaUser = $finca->getUser();
        if (!$user->isAdmin() && $fincaUser->getId() !== $user->getId()) {
            return $this->json(['error' => 'Unauthorized'], 403);
        }

        $entityManager->remove($finca);
        $entityManager->flush();

        return $this->json('Deleted a finca successfully with id ' . $id);
    }
}