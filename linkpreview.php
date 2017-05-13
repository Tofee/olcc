<?php
require __DIR__ . '/vendor/autoload.php';

use Dusterio\LinkPreview\Client;

if(isset($_REQUEST['url'])) {
    $previewClient = new Dusterio\LinkPreview\Client($_REQUEST['url']);
    try {
        $preview = $previewClient->getPreview('general');
        $response = json_encode($preview->toArray());
        header('HTTP 1.1 200');
        header( 'Content-type: text/xml');
        echo $response;
    } catch (\Dusterio\LinkPreview\Exceptions\ConnectionErrorException $e) {
        header('HTTP 1.1 500 Internal Server Error');
        header('Content-type: text/text');
        echo $e->getMessage();
        error_log($e->getMessage());
    }
} else {
    header('HTTP 1.0 400 Bad Request');
}