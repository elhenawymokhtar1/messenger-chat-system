<?php
/**
 * 🛍️ API المنتجات - اتصال مباشر بقاعدة البيانات البعيدة
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// معالجة طلبات OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// إعدادات قاعدة البيانات البعيدة
$host = '193.203.168.103';
$username = 'u384034873_conversations';
$password = '0165676135Aa@A';
$database = 'u384034873_conversations';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'خطأ في الاتصال بقاعدة البيانات']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// استخراج معرف الشركة من المعاملات
$companyId = $_GET['company_id'] ?? null;

if (!$companyId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'معرف الشركة مطلوب']);
    exit();
}

switch ($method) {
    case 'GET':
        // جلب المنتجات
        try {
            $stmt = $pdo->prepare("SELECT * FROM products WHERE company_id = ? ORDER BY created_at DESC");
            $stmt->execute([$companyId]);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'data' => $products]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'خطأ في جلب المنتجات']);
        }
        break;

    case 'POST':
        // إضافة منتج جديد
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'اسم المنتج مطلوب']);
            exit();
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO products (
                    company_id, name, description, short_description, sku, 
                    price, sale_price, stock_quantity, category, brand, 
                    image_url, featured, weight, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $companyId,
                $input['name'],
                $input['description'] ?? '',
                $input['short_description'] ?? '',
                $input['sku'] ?? 'SKU-' . time(),
                $input['price'] ?? 0,
                $input['sale_price'] ?? null,
                $input['stock_quantity'] ?? 0,
                $input['category'] ?? '',
                $input['brand'] ?? '',
                $input['image_url'] ?? '',
                isset($input['featured']) && $input['featured'] ? 1 : 0,
                $input['weight'] ?? null,
                $input['status'] ?? 'active'
            ]);

            $productId = $pdo->lastInsertId();
            
            // جلب المنتج المُنشأ
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            $newProduct = $stmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'data' => $newProduct]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'خطأ في إضافة المنتج: ' . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'طريقة غير مدعومة']);
        break;
}
?>
