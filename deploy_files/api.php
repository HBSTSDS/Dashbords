<?php
// api.php - Ponte entre React e MySQL HostGator

// Permite acesso de qualquer origem (CORS) - Importante para quando o domínio mudar
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Responde rápido para requisições OPTIONS (Pre-flight do navegador)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Lê o JSON enviado pelo React
$input = json_decode(file_get_contents('php://input'), true);

try {
    // --- ROTAS (ACTIONS) ---

    // 1. Salvar Dados Manuais (Custo, Local, etc)
    if ($action === 'save_manual' && $method === 'POST') {
        $stmt = $pdo->prepare("
            INSERT INTO manual_financials (event_id, location, event_cost, bar_revenue_manual, notes) 
            VALUES (:id, :location, :cost, :bar, :notes)
            ON DUPLICATE KEY UPDATE 
            location = :location, event_cost = :cost, bar_revenue_manual = :bar, notes = :notes
        ");
        $stmt->execute([
            ':id' => $input['event_id'],
            ':location' => $input['location'] ?? null,
            ':cost' => $input['event_cost'] ?? 0,
            ':bar' => $input['bar_revenue_manual'] ?? 0,
            ':notes' => $input['notes'] ?? ''
        ]);
        echo json_encode(['success' => true]);
    }

    // 2. Ler Relatório Completo (View ou Query Direta)
    elseif ($action === 'get_report' && $method === 'GET') {
        // Substituindo View por Query direta para garantir LEFT JOIN e evitar dados ocultos
        $sql = "
            SELECT 
                e.id,
                e.name AS evento,
                e.date AS data,
                COALESCE(mf.location, 'Não Definido') AS local,
                COALESCE(em.total_audience, 0) AS publico_total,
                COALESCE(em.paying_audience, 0) AS pagantes,
                COALESCE(em.total_revenue, 0) AS rec_bilheteria_total,
                COALESCE(em.door_revenue, 0) AS rec_porta,
                COALESCE(em.online_revenue, 0) AS rec_ticketeria,
                COALESCE(mf.bar_revenue_manual, em.bar_revenue_system, 0) AS rec_bar_final,
                COALESCE(em.avg_age, 0) AS idade_media,
                COALESCE(mf.event_cost, 0) AS custo_total,
                
                CASE 
                    WHEN COALESCE(mf.event_cost, 0) > 0 THEN 
                        ((COALESCE(em.total_revenue, 0) + COALESCE(mf.bar_revenue_manual, em.bar_revenue_system, 0) - COALESCE(mf.event_cost, 0)) / COALESCE(mf.event_cost, 0)) * 100
                    ELSE 0 
                END AS roi_percent

            FROM events e
            LEFT JOIN event_metrics em ON e.id = em.event_id
            LEFT JOIN manual_financials mf ON e.id = mf.event_id
            ORDER BY e.date DESC
        ";

        $stmt = $pdo->query($sql);
        $data = $stmt->fetchAll();
        echo json_encode($data);
    }

    // 3. Salvar Métricas de Evento (CSV Importado)
    elseif ($action === 'save_metrics' && $method === 'POST') {
        // Primeiro cria/atualiza o Evento
        $stmtEvent = $pdo->prepare("INSERT IGNORE INTO events (id, name, date) VALUES (:id, :name, :date)");
        $stmtEvent->execute([
            ':id' => $input['id'],
            ':name' => $input['name'],
            ':date' => $input['date']
        ]);

        // Depois salva as métricas
        $stmt = $pdo->prepare("
            INSERT INTO event_metrics (
                event_id, total_revenue, total_audience, paying_audience, 
                door_revenue, bar_revenue_system, online_revenue, avg_age,
                sales_pos, sales_site, sales_app
            ) VALUES (
                :id, :trev, :taud, :paud, 
                :drev, :brev, :orev, :age,
                :pos, :site, :app
            )
            ON DUPLICATE KEY UPDATE 
            total_revenue = :trev2, total_audience = :taud2, paying_audience = :paud2,
            avg_age = :age2, sales_pos = :pos2, sales_site = :site2, sales_app = :app2
        ");

        $stmt->execute([
            ':id' => $input['id'],
            ':trev' => $input['totalRevenue'],
            ':taud' => $input['totalAudience'],
            ':paud' => $input['totalPayingQty'],
            ':drev' => $input['doorRevenue'],
            ':brev' => $input['barRevenue'] ?? 0,
            ':orev' => $input['onlineRevenue'] ?? 0,
            ':age' => $input['avgAge'] ?? 0,
            ':pos' => $input['salesChannels']['pos'] ?? 0,
            ':site' => $input['salesChannels']['site'] ?? 0,
            ':app' => $input['salesChannels']['app'] ?? 0,

            // Re-binding for UPDATE clause
            ':trev2' => $input['totalRevenue'],
            ':taud2' => $input['totalAudience'],
            ':paud2' => $input['totalPayingQty'],
            ':age2' => $input['avgAge'] ?? 0,
            ':pos2' => $input['salesChannels']['pos'] ?? 0,
            ':site2' => $input['salesChannels']['site'] ?? 0,
            ':app2' => $input['salesChannels']['app'] ?? 0
        ]);
        echo json_encode(['success' => true]);
    }

    // 4. Salvar Cupons
    elseif ($action === 'save_coupons' && $method === 'POST') {
        $eventId = $input['event_id'];
        $coupons = $input['coupons']; // Array {code: 'ABC', count: 10}

        // Limpa cupons antigos desse evento para re-inserir (ou use Upsert)
        $pdo->prepare("DELETE FROM coupons WHERE event_id = ?")->execute([$eventId]);

        $stmt = $pdo->prepare("INSERT INTO coupons (event_id, code, usage_count) VALUES (:eid, :code, :count)");
        foreach ($coupons as $code => $count) {
            $stmt->execute([':eid' => $eventId, ':code' => $code, ':count' => $count]);
        }
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['status' => 'API Online', 'message' => 'Endpoint desconhecido']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>