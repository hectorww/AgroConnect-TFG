<?php

namespace App\Controller;

use App\Service\WeatherService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class WeatherController extends AbstractController
{
    // Abrimos el endpoint /api/clima y forzamos que sea por GET
    #[Route('/api/clima', name: 'api_weather', methods: ['GET'])]
    public function getClima(Request $request, WeatherService $weatherService): JsonResponse
    {
        // 1. Capturamos las coordenadas de la URL (?lat=X&lon=Y)
        $lat = $request->query->get('lat');
        $lon = $request->query->get('lon');

        // 2. Validación de seguridad
        if ($lat === null || $lon === null) {
            return $this->json([
                'error' => 'Faltan parámetros. Por favor envía latitud (lat) y longitud (lon).'
            ], 400); 
        }

        // 3. Pasamos las coordenadas a tu servicio
        $datos = $weatherService->getWeatherAndAlerts((float) $lat, (float) $lon);

        // 4. Devolvemos el JSON definitivo al Frontend
        return $this->json($datos);
    }
}