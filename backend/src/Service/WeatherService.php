<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use Symfony\Component\Mailer\MailerInterface; // <-- El servicio de correos
use Symfony\Component\Mime\Email; // <-- Para crear el mensaje
use DateTime;

class WeatherService
{
    public function __construct(
        private HttpClientInterface $client,
        private string $weatherApiKey,
        private CacheInterface $cache,
        private MailerInterface $mailer // <-- Inyectamos el cartero
    ) {}

    public function getWeatherAndAlerts(float $lat, float $lon): array
    {
$cacheKey = 'weather_' . md5($lat . '_' . $lon );

        return $this->cache->get($cacheKey, function (ItemInterface $item) use ($lat, $lon) {
            
            $item->expiresAfter(10800); // Caché de 3 horas

            $response = $this->client->request(
                'GET',
                'https://api.openweathermap.org/data/2.5/forecast',
                [
                    'query' => [
                        'lat' => $lat,
                        'lon' => $lon,
                        'appid' => $this->weatherApiKey,
                        'units' => 'metric',
                        'lang' => 'es'
                    ]
                ]
            );

            $data = $response->toArray();
            $climaActual = $data['list'][0];
            $tempActual = $climaActual['main']['temp'];       
            $humedadActual = $climaActual['main']['humidity']; 
            $vientoActual_kmh = ($climaActual['wind']['speed'] ?? 0) * 3.6; 
            $descripcionActual = $climaActual['weather'][0]['description']; 

            $alertaCritica = null;
            $nivelGravedad = 99;

            foreach ($data['list'] as $prevision) {
                $temp = $prevision['main']['temp'];
                $humedad = $prevision['main']['humidity'];
                $viento_kmh = ($prevision['wind']['speed'] ?? 0) * 3.6;
                $idClima = $prevision['weather'][0]['id'] ?? 0;
                
                $fechaObj = new DateTime($prevision['dt_txt']);
                $fechaAmigable = $fechaObj->format('d/m H:i');

                if ($temp > 10 && $humedad < 40 && $nivelGravedad > 1) {
                    $alertaCritica = [
                        'tipo' => 'ESTRÉS_HÍDRICO',
                        'mensaje' => "Peligro previsto el $fechaAmigable: Calor extremo y baja humedad. Programa un riego preventivo.",
                        'nivel' => 'CRITICO'
                    ];
                    $nivelGravedad = 1;
                } elseif ($temp < 2 && $nivelGravedad > 1) {
                    $alertaCritica = [
                        'tipo' => 'RIESGO_HELADA',
                        'mensaje' => "Peligro previsto el $fechaAmigable: Temperaturas cercanas a 0ºC. Prepara los sistemas anti-helada.",
                        'nivel' => 'CRITICO'
                    ];
                    $nivelGravedad = 1;
                } elseif ($viento_kmh > 45 && $nivelGravedad > 2) { 
                    $alertaCritica = [
                        'tipo' => 'VIENTO_FUERTE',
                        'mensaje' => "Previsto el $fechaAmigable: Rachas de " . round($viento_kmh) . " km/h. Peligro para ramas y frutos.",
                        'nivel' => 'ALTO'
                    ];
                    $nivelGravedad = 2;
                } elseif ($idClima >= 200 && $idClima < 600 && $nivelGravedad > 2) { 
                    $alertaCritica = [
                        'tipo' => 'LLUVIAS_INTENSAS',
                        'mensaje' => "Previsto el $fechaAmigable: Posibles lluvias. Evita aplicar fertilizantes foliares para que no se laven.",
                        'nivel' => 'ALTO'
                    ];
                    $nivelGravedad = 2;
                } elseif ($humedad > 80 && $temp > 20 && $nivelGravedad > 3) {
                    $alertaCritica = [
                        'tipo' => 'RIESGO_HONGOS',
                        'mensaje' => "Previsto el $fechaAmigable: Alta humedad y calor. Condiciones ideales para hongos. Vigila la parcela.",
                        'nivel' => 'MEDIO'
                    ];
                    $nivelGravedad = 3;
                }
            }


            if (!$alertaCritica) {
                $alertaCritica = [
                    'tipo' => 'CONDICIONES_ÓPTIMAS',
                    'mensaje' => 'Previsión a 5 días estable. No se detectan amenazas inminentes para el cultivo.',
                    'nivel' => 'BAJO'
                ];
            }

            // 🚨 EL DISPARADOR DE CORREOS: Solo se envía si la alerta es CRÍTICA
           // if ($alertaCritica['nivel'] === 'CRITICO') {
           if ($alertaCritica['nivel'] === 'CRITICO') {
                $nombreCiudad = $data['city']['name'];
                
                $email = (new Email())
                    ->from('sistema_ia@agrotech.com')
                    ->to('agricultor@ejemplo.com')
                    // Asunto del correo:
                    ->subject('🚨 ALERTA CRÍTICA: ' . $alertaCritica['tipo'] . ' detectado en la zona de ' . $nombreCiudad)
                    // Cuerpo del correo:
                    ->html('<div style="font-family: Arial, sans-serif; padding: 20px; border-left: 5px solid red;">
                                <h2>¡Atención! Acción requerida</h2>
                                <p><strong>Amenaza:</strong> ' . str_replace('_', ' ', $alertaCritica['tipo']) . '</p>
                                <p><strong>Detalles:</strong> ' . $alertaCritica['mensaje'] . '</p>
                                <p>Por favor, revisa el panel de control para más información.</p>
                            </div>');

                // Enviar el correo
             // Enviar el correo (atrapando el error si no hay servidor configurado)

   try {
    $this->mailer->send($email);
} catch (\Exception $e) {
    // Silenciado
}
            }

            return [
                'ubicacion' => $data['city']['name'],
                'temperatura' => round($tempActual, 1),
                'humedad' => $humedadActual,
                'viento_kmh' => round($vientoActual_kmh, 1),
                'descripcion' => $descripcionActual,
                'analisis_inteligente' => $alertaCritica 
            ];
        });
    }
}