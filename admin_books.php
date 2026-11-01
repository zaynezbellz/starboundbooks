<?php
// ═══════════════════════════════════════════════════════════════
//  STARBOUND BOOKS — admin_books.php
//  Admin CRUD API: GET (list), POST (add / edit / delete)
//  Place this file at: php/admin_books.php
// ═══════════════════════════════════════════════════════════════

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// ─── DATABASE CONNECTION ──────────────────────────────────────
$host   = "localhost";
$user   = "root";
$pass   = "";
$dbname = "starbound_books1";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode(["success" => false, "error" => "Database connection failed: " . $conn->connect_error]);
  exit;
}

$conn->set_charset("utf8mb4");


// ─── ROUTE ────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  handleGetBooks($conn);
} elseif ($method === 'POST') {
  $data = json_decode(file_get_contents("php://input"), true);
  if (!$data) {
    // fallback: form-encoded
    $data = $_POST;
  }
  $action = $data['action'] ?? '';

  switch ($action) {
    case 'add':    handleAdd($conn, $data);    break;
    case 'update': handleUpdate($conn, $data); break;
    case 'delete': handleDelete($conn, $data); break;
    default:
      http_response_code(400);
      echo json_encode(["success" => false, "error" => "Unknown action"]);
  }
} else {
  http_response_code(405);
  echo json_encode(["success" => false, "error" => "Method not allowed"]);
}

$conn->close();


// ─── GET ALL BOOKS ────────────────────────────────────────────
function handleGetBooks($conn) {
  $sql = "SELECT id, title, author, price, original, category, emoji, bg, badge, rating
          FROM books ORDER BY id ASC";
  $result = $conn->query($sql);

  if (!$result) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $conn->error]);
    return;
  }

  $books = [];
  while ($row = $result->fetch_assoc()) {
    $row['price']    = intval($row['price']);
    $row['rating']   = intval($row['rating']);
    $row['original'] = $row['original'] !== null ? intval($row['original']) : null;
    $books[] = $row;
  }
  echo json_encode(["success" => true, "books" => $books], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}


// ─── ADD BOOK ─────────────────────────────────────────────────
function handleAdd($conn, $data) {
  $required = ['title', 'author', 'price', 'category', 'emoji', 'bg', 'rating'];
  foreach ($required as $field) {
    if (empty($data[$field])) {
      http_response_code(400);
      echo json_encode(["success" => false, "error" => "Missing required field: $field"]);
      return;
    }
  }

  $title    = trim($data['title']);
  $author   = trim($data['author']);
  $price    = intval($data['price']);
  $original = isset($data['original']) && $data['original'] !== '' ? intval($data['original']) : null;
  $category = trim($data['category']);
  $emoji    = trim($data['emoji']);
  $bg       = trim($data['bg']);
  $badge    = trim($data['badge'] ?? '');
  $rating   = intval($data['rating']);

  if ($rating < 1) $rating = 1;
  if ($rating > 5) $rating = 5;

  $stmt = $conn->prepare(
    "INSERT INTO books (title, author, price, original, category, emoji, bg, badge, rating)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  $stmt->bind_param("ssiissisi", $title, $author, $price, $original, $category, $emoji, $bg, $badge, $rating);

  if ($stmt->execute()) {
    echo json_encode(["success" => true, "id" => $conn->insert_id, "message" => "Book added successfully"]);
  } else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $stmt->error]);
  }
  $stmt->close();
}


// ─── UPDATE BOOK ──────────────────────────────────────────────
function handleUpdate($conn, $data) {
  if (empty($data['id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing book ID"]);
    return;
  }

  $id       = intval($data['id']);
  $title    = trim($data['title']    ?? '');
  $author   = trim($data['author']   ?? '');
  $price    = intval($data['price']  ?? 0);
  $original = isset($data['original']) && $data['original'] !== '' ? intval($data['original']) : null;
  $category = trim($data['category'] ?? '');
  $emoji    = trim($data['emoji']    ?? '');
  $bg       = trim($data['bg']       ?? '');
  $badge    = trim($data['badge']    ?? '');
  $rating   = intval($data['rating'] ?? 4);

  if ($rating < 1) $rating = 1;
  if ($rating > 5) $rating = 5;

  $stmt = $conn->prepare(
    "UPDATE books
     SET title=?, author=?, price=?, original=?, category=?, emoji=?, bg=?, badge=?, rating=?
     WHERE id=?"
  );
  $stmt->bind_param("ssiisssiii", $title, $author, $price, $original, $category, $emoji, $bg, $badge, $rating, $id);

  if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
      echo json_encode(["success" => true, "message" => "Book updated successfully"]);
    } else {
      echo json_encode(["success" => false, "error" => "No book found with that ID"]);
    }
  } else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $stmt->error]);
  }
  $stmt->close();
}


// ─── DELETE BOOK ──────────────────────────────────────────────
function handleDelete($conn, $data) {
  if (empty($data['id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing book ID"]);
    return;
  }

  $id   = intval($data['id']);
  $stmt = $conn->prepare("DELETE FROM books WHERE id=?");
  $stmt->bind_param("i", $id);

  if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
      echo json_encode(["success" => true, "message" => "Book deleted successfully"]);
    } else {
      echo json_encode(["success" => false, "error" => "No book found with that ID"]);
    }
  } else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $stmt->error]);
  }
  $stmt->close();
}
?>
