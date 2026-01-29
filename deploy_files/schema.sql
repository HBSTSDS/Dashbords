-- RESTAURAÇÃO DO BANCO DE DADOS - AGÊNCIA NOVA
-- Execute este script no PHPMyAdmin da HostGator (aba SQL)

-- 1. Tabela de Eventos (Base)
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Métricas do Evento (Vindas do CSV/API)
CREATE TABLE IF NOT EXISTS event_metrics (
    event_id VARCHAR(255) PRIMARY KEY,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_audience INT DEFAULT 0,
    paying_audience INT DEFAULT 0,
    door_revenue DECIMAL(15,2) DEFAULT 0,
    bar_revenue_system DECIMAL(15,2) DEFAULT 0,
    online_revenue DECIMAL(15,2) DEFAULT 0,
    avg_age DECIMAL(5,2) DEFAULT 0,
    sales_pos INT DEFAULT 0,
    sales_site INT DEFAULT 0,
    sales_app INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Dados Manuais (Inseridos via Dashboard)
CREATE TABLE IF NOT EXISTS manual_financials (
    event_id VARCHAR(255) PRIMARY KEY,
    location VARCHAR(255),
    event_cost DECIMAL(15,2) DEFAULT 0,
    bar_revenue_manual DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Cupons (Opcional)
CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    usage_count INT DEFAULT 0,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. View Relatório (Opcional - para compatibilidade futura, embora o código use query direta agora)
CREATE OR REPLACE VIEW vw_financial_report AS
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
    COALESCE(mf.event_cost, 0) AS custo_total
FROM events e
LEFT JOIN event_metrics em ON e.id = em.event_id
LEFT JOIN manual_financials mf ON e.id = mf.event_id;
