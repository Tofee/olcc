<?php
include('./local_config.php');

define("CALLBACK_URL", "https://".$_SERVER['HTTP_HOST'].dirname($_SERVER['REQUEST_URI'])."/oauth_redirect.php?board=".$_REQUEST['board']);

$curl = curl_init();

$tribuneHost = $_REQUEST['board'];

$datas = array("refresh_token" => $_REQUEST['refresh_token'],
               "grant_type"    => "refresh_token",
               "client_id"     => CLIENT_ID[$tribuneHost],
               "client_secret" => CLIENT_SECRET[$tribuneHost],
               "redirect_uri"  => CALLBACK_URL
               );

$params = array(
  CURLOPT_URL =>  ACCESS_TOKEN_URL[$tribuneHost],
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => $datas,
  CURLOPT_NOBODY => false, 
  CURLOPT_HTTPHEADER => array(
    "cache-control: no-cache",
    "content-type: multipart/form-data",
    "accept: *",
    "accept-encoding: gzip, deflate",
  ),
);

curl_setopt_array($curl, $params);

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "{}";
} else {
  echo $response;
}
