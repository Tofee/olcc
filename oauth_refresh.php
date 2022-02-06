<?php

define("CALLBACK_URL", "https://".$_SERVER['HTTP_HOST'].dirname($_SERVER['REQUEST_URI'])."/oauth_redirect.php");
define("ACCESS_TOKEN_URL", "https://linuxfr.org/api/oauth/token");
define("CLIENT_ID", $_SERVER['LINUXFR_CLIENT_ID']);
define("CLIENT_SECRET", $_SERVER['LINUXFR_CLIENT_SECRET']);

$curl = curl_init();

$datas = array("refresh_token" => $_REQUEST['refresh_token'],
               "grant_type"    => "refresh_token",
               "client_id"     => CLIENT_ID,
               "client_secret" => CLIENT_SECRET,
               "redirect_uri"  => CALLBACK_URL
               );

$params = array(
  CURLOPT_URL =>  ACCESS_TOKEN_URL,
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
