<?php
// Configurações de Banco de Dados
// PREENCHA COM SEUS DADOS DA HOSTGATOR
$host = 'localhost';
$db   = 'ascsco21_Anova';
$user = 'ascsco21_HB'; // Troque pelo usuário que você criou
$pass = 'Tranquedoneves1701';       // Troque pela senha que você criou

$charset = 'utf8mb4';

// Conexão PDO
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // Em produção, não mostre o erro real para não expor dados
    http_response_code(500);
    echo json_encode(['error' => 'Erro de conexão com banco de dados']);
    exit;
}
?>
