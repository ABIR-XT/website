<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Simple user identifier (you can enhance this with actual login)
$userId = isset($_GET['userId']) ? $_GET['userId'] : 'guest';
$dataFile = "keys_" . md5($userId) . ".json";

// Ensure data directory exists
if (!is_dir('data')) {
    mkdir('data', 0755, true);
}

$dataFilePath = "data/" . $dataFile;

// GET - Retrieve all keys
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($dataFilePath)) {
        $data = json_decode(file_get_contents($dataFilePath), true);
        echo json_encode(['success' => true, 'keys' => $data ?? []]);
    } else {
        echo json_encode(['success' => true, 'keys' => []]);
    }
    exit;
}

// POST - Save/Update keys
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['keys'])) {
        $keys = $input['keys'];
        
        // Save to file
        if (file_put_contents($dataFilePath, json_encode($keys, JSON_PRETTY_PRINT))) {
            echo json_encode(['success' => true, 'message' => 'Keys saved successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to save keys']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'No keys provided']);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid request method']);
?>
