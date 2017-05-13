<?php

  $VERSION = '1.0.0';
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $_REQUEST['posturl']);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_HEADER, true);
  curl_setopt($ch, CURLINFO_HEADER_OUT, true);

  if (isset($_REQUEST['ua'])) {
    $ua = $_REQUEST['ua'];
  }
  else {
    $ua = "olcc-me/" . $VERSION;
  }

  $message = $_REQUEST['postdata'];
  $message = str_replace(array('#{plus}#', '#{amp}#', '#{dcomma}#', '#{percent}#'), array(urlencode('+'), urlencode('&'), '%3B', '%25'), $message);
  $referer = $_REQUEST['posturl'];
  $referer = substr($referer, 0, strrpos($referer, '/')+1);
  curl_setopt($ch, CURLOPT_REFERER, $referer);
  $rheaders = array(
                     'Accept: text/xml',
                     'Cache-Control: no-cache, must-revalidate' //,
                     // 'Referer: ' + $referer
                   );
  curl_setopt($ch, CURLOPT_HTTPHEADER, $rheaders);
  curl_setopt($ch, CURLOPT_USERAGENT, $ua);
  if (get_magic_quotes_gpc()) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, stripslashes($message));
  }
  else {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $message);
  }
  if (isset($_REQUEST['cookie'])) {
    curl_setopt($ch, CURLOPT_COOKIE, $_REQUEST['cookie']);
  }
  $res = curl_exec($ch);

  if ($res === false) {
      if(curl_errno($ch) == CURLE_OPERATION_TIMEOUTED) {
          $http_code = 408;
      } else {
          $http_code = 500;
      }
      http_response_code($http_code);
      echo( "Erreur ".$http_code." : ". curl_error($ch));
  } else {
      echo('({');
      $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
      $headers = preg_split("\n", substr($res, 0, $header_size));
      foreach ($headers as $header) {
        if (strpos($header, ':') > 0) {
          list($name, $val) = preg_split(":", $header);
          $tval = trim($val);
          if (!empty($tval)) {
            echo("'" . trim(str_replace("-", "", $name)) . "':'" . addslashes($tval) . "',");
          }
        }
      }
      $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
      http_response_code($http_code);
      echo("'referer':\"" . $referer . "\",");
      echo("'httpcode':" . $http_code . ",");
      echo("'result':\"".str_replace("\n","\\n",addslashes(substr($res, $header_size, strlen($res))))."\"");

      echo('})');
  }

