<?php

$userfile = $_FILES['attach_file']['name'];
$tmpfile = $_FILES['attach_file']['tmp_name'];
$error = $_FILES['attach_file']['error'];

$dest_dir = "attach";
if (!is_dir($dest_dir)) {
    mkdir($dest_dir);
}
$dest = basename($userfile);
$ext = substr($dest, strrpos($dest, ".") + 1);
if ($ext == "php" || $ext == "html") {
    $dest = $dest . ".txt";
}
$new_file = $dest_dir . "/" . date("YmdHis") . "_" . $dest;
if (file_exists($new_file)) {
    unlink($new_file);
}
move_uploaded_file($tmpfile, $new_file);

$sname = $_SERVER['SERVER_NAME'];
$uri = $_SERVER['REQUEST_URI'];
$folder = substr($uri, 0, strrpos($uri, "/"));

$fileurl = "http://$sname/$folder/$new_file";

$data = array('dest' => $dest, 'file_url' => $fileurl);

echo json_encode($data);

?>

