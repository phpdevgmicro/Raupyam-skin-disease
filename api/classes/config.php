<?php 
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);  
// error_reporting(E_ALL);

@ob_start();
session_start();

define('VISION_AI_KEY', '01511e610fb5451684d5ef68bd43c3b6');
define('GOOGLE_API_KEY', 'AIzaSyAUyyg8E2lrmtLHDpvYtRzSFMWRgICrZDM');

define('APP_NAME','Skin Analysis');
date_default_timezone_set("Asia/Kolkata");
define('ADMIN_URL','/skin-disease/admin/');
define('SITE_URL','/skin-disease/');
define('APP_URL','/skin-disease/');

define('DB_HOST','localhost');
define('DB_USERNAME','user_skin');
define('DB_PASSWORD','0o7%elP13');
define('DB_NAME','skin_analysis');

$data['DateFormat'] = 'm/d/Y h:i:s A';  
$data['OnlyDate']   = 'm/d/Y';
$data['NoRecord']   = '<i class="fa fa-exclamation-triangle"></i> No record found';
$data['SuccessIcon']   = '<i class="fa fa-check"></i>';
$data['ErrorIcon']   = '<i class="fa fa-exclamation-triangle"></i>';
$data['ExclamationIcon'] = '<i class="fa fa-exclamation-circle"></i>';

class dbconfig {
  // database hostname
  protected static $host = DB_HOST;
  // database username
  protected static $username = DB_USERNAME;
  // database password
 
  protected static $password = DB_PASSWORD;

  //database name
  protected static $dbname = DB_NAME;   

  static $con;

  function __construct() {
    self::$con = self::connect();
  }

  // open connection
  protected static function connect() {
     try {      
       $link = mysqli_connect(self::$host, self::$username, self::$password, self::$dbname); 
        if(!$link) {
          throw new exception(mysqli_error($link));
        }
        return $link;
     } catch (Exception $e) {
       echo "Error: ".$e->getMessage();
     }
  }

 // close connection
  public static function close() {
     mysqli_close(self::$con);
  }

// run query
  public static function run($query) {
    try {
      if(empty($query) && !isset($query)) {
        throw new exception("Query string is not set.");
      }
      $result = mysqli_query(self::$con, $query);
     
     return $result;
    } catch (Exception $e) {
      echo "Error: ".$e->getMessage();
    }

  }
// insert_run
public static function insertrun($query) {
    try {
      if(empty($query) && !isset($query)) {
        throw new exception("Query string is not set.");
      }

      $result = mysqli_query(self::$con, $query);
      $insert_id = mysqli_insert_id(self::$con);
      
     return $insert_id;
    } catch (Exception $e) {
      echo "Error: ".$e->getMessage();
    }
  }
}

$config = new DBCONFIG();

function FD_add_notices($message, $notice_type="error", $key=""){
  
  $notices = array(); 
  $notices = get_session( 'ef_notices' ); 
  if(!empty($key)){
    $notices[$notice_type][$key] = $message;
  }
  else{
    $notices[$notice_type][] = $message;  
  }
  set_session('FD_notices',  $notices);
}

function FD_print_notices(){
  global $data;
  
  $all_notices  = array();
  $all_notices  = get_session( 'FD_notices' );
  
  if(empty($all_notices)) return;

  foreach ($all_notices as $key=>$notice_type ) {   
    if($key=='error' && count($notice_type) > 0) {     
      echo '<div class="alert alert-warning alert-dismissible mb-2" role="alert">';
        foreach ( $notice_type as $message ) {
          echo $data['ErrorIcon'].' '.$message;
        }
        echo '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button></div>';
    }
    if($key=='success'  && count($notice_type) > 0) {
         echo '<div class="alert alert-success alert-dismissible mb-2" role="alert">';
        foreach ( $notice_type as $message ) {
          echo $data['SuccessIcon'].' '.$message;
        }
        echo '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button></div>';
    }    
  }   
  FD_clear_notices(); 
}
function get_session($key){
  if(isset($_SESSION[$key])){
    return $_SESSION[$key];   
    } 
}
function FD_clear_notices(){
  clear_session('FD_notices');    
}
function clear_session($key){
    unset($_SESSION[$key]); 
}
function set_session($key, $val){
    $_SESSION[$key] = $val;
}
function pr($array) {
  echo "<pre>";
  print_r($array);
  echo "</pre>";
}
function random_gen($length)
{
  $random= "";
  srand((double)microtime()*1000000);
  $char_list = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  $char_list .= "abcdefghijklmnopqrstuvwxyz";
  $char_list = "1234567890";
  // Add the special characters to $char_list if needed
  for($i = 0; $i < $length; $i++)
  {
    $random .= substr($char_list,(rand()%(strlen($char_list))), 1);  
  }
  return $random;
}
function getCredentials(){  
  $absolutePath = 'https://raupyam.com/gopal_keys/credentials.php?type='.base64_encode('get-token');
  $curl = curl_init();
  curl_setopt($curl, CURLOPT_URL, $absolutePath);
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true); 
  $response = curl_exec($curl);
  if ($response !== false) {
      return json_decode($response);
  } else {
      return;
  }
  curl_close($curl);
}
?>
