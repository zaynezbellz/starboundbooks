<?php
// ═══════════════════════════════════════════════════════════════
//  STARBOUND BOOKS — books.php
//  Place this file at: php/books.php
//  This file connects to MySQL and returns book data as JSON
// ═══════════════════════════════════════════════════════════════


// ─── 1. HEADERS ──────────────────────────────────────────────────────────────
// Tell the browser this response is JSON
// Allow requests from the same local server (needed for fetch() in index.html)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");


// ─── 2. DATABASE CONNECTION ──────────────────────────────────────────────────
// Default XAMPP credentials:
//   host     = localhost
//   user     = root
//   password = ""  (empty — XAMPP has no password by default)
//   database = starbound_books1

$host   = "localhost";
$user   = "root";
$pass   = "";
$dbname = "starbound_books1";

$conn = new mysqli($host, $user, $pass, $dbname);

// Stop immediately if connection fails
if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode([
    "error"   => "Database connection failed",
    "details" => $conn->connect_error
  ]);
  exit;
}

// Set charset to UTF-8 so emojis and special characters work correctly
$conn->set_charset("utf8mb4");


// ─── 3. READ URL PARAMETERS ──────────────────────────────────────────────────
// Your JavaScript sends these via fetch():
//   php/books.php                    → returns all books
//   php/books.php?category=Fiction   → returns only Fiction books
//   php/books.php?limit=6            → returns first 6 books

$category = isset($_GET['category']) ? trim($_GET['category']) : null;
$limit    = isset($_GET['limit'])    ? intval($_GET['limit'])   : null;


// ─── 4. BUILD THE SQL QUERY ───────────────────────────────────────────────────

$conditions = [];
$params     = [];
$types      = "";

// Filter by category if provided and not 'All'
if ($category && $category !== 'All') {
  $conditions[] = "category = ?";
  $params[]     = $category;
  $types       .= "s"; // "s" = string type for mysqli bind_param
}

// Build WHERE clause
$where = count($conditions) > 0
  ? "WHERE " . implode(" AND ", $conditions)
  : "";

// Build LIMIT clause
$limitClause = $limit ? "LIMIT $limit" : "";

$sql = "SELECT
          id,
          title,
          author,
          price,
          original,
          category,
          emoji,
          bg,
          badge,
          rating
        FROM books
        $where
        ORDER BY id ASC
        $limitClause";


// ─── 5. EXECUTE WITH PREPARED STATEMENT ──────────────────────────────────────
// Using prepared statements protects against SQL injection

$stmt = $conn->prepare($sql);

// Only bind parameters if we have a WHERE clause
if (count($params) > 0) {
  $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();


// ─── 6. COLLECT RESULTS ──────────────────────────────────────────────────────

$books = [];

while ($row = $result->fetch_assoc()) {
  // Convert price and rating to numbers (they come as strings from MySQL)
  $row['price']   = intval($row['price']);
  $row['rating']  = intval($row['rating']);
  $row['original'] = $row['original'] !== null ? intval($row['original']) : null;

  $books[] = $row;
}


// ─── 7. RETURN JSON ──────────────────────────────────────────────────────────
// JSON_UNESCAPED_UNICODE keeps emojis readable instead of converting to \uXXXX

echo json_encode($books, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);


// ─── 8. CLOSE CONNECTION ─────────────────────────────────────────────────────
$stmt->close();
$conn->close();
?>