<?php  
require_once("config.php");

use Rakit\Validation\Validator;
use Orhanerday\OpenAi\OpenAi;
class ADMIN extends dbconfig {
   public static $data;
   function __construct() {
     parent::__construct();
   }


        public static function login($req){
                try {                   
                        if($req['email'] == "" || $req['password'] == ""){
                                throw new exception("Email Or Password not match");
                        }
                        $email= mysqli_real_escape_string(self::$con, $req['email']);
                        $password= mysqli_real_escape_string(self::$con, $req['password']);
                 
                        $query = "SELECT * FROM `admin` WHERE email = '".$email."' AND password = '".md5($password)."' LIMIT 1";
                        $result = dbconfig::run($query);
                        if(!$result) {
                                throw new exception("Server not responde!");
                        }
                        if(mysqli_num_rows($result) > 0){
                                $resultSet = mysqli_fetch_assoc($result);
                                $data = array('status'=>'success', 'msg'=>"User detail fetched successfully.", 'result'=>$resultSet);
                        }else{
                                $data = array('status'=>'error', 'msg'=>"Username/Password Not exist!", 'result'=>array());
                        }               
                }catch(Exception $e) {
                        $data = array('status'=>'error', 'msg'=>$e->getMessage());
                }finally{
                        return $data;
                }
        }       
        
        public static function addPrompt($req, $model){
                try {   
                        $prompt= mysqli_real_escape_string(self::$con, $req['prompt']);

                        $query = "SELECT * FROM `prompts` WHERE model = '".$model."'";
                        $result = dbconfig::run($query);
                        if(!$result) {
                                throw new exception("Server not responde!");
                        }                       
                        if(mysqli_num_rows($result) > 0){
                                $query = "UPDATE `prompts` SET prompt = '".$prompt."' WHERE model = '".$model."'";
                        }else{
                                $query = "INSERT INTO `prompts` (prompt, model) VALUES ('".$prompt."', '".$model."')";
                        }               
                        $result = dbconfig::run($query);
                        if(!$result) {
                                throw new exception("Server not responde2!");
                        }               
                        $data = array('status'=>'success', 'msg'=>"Prompt set successfully.", 'result'=>'');
                }catch(Exception $e) {
                        $data = array('status'=>'error', 'msg'=>$e->getMessage());
                }finally{
                        return $data;
                }
        }       

        public static function getPrompt($model=''){
                try {   
                        $resultSet = array();
                        if($model == ''){
                                $query = "SELECT * FROM `prompts`";
                        }else{
                                $query = "SELECT * FROM `prompts` WHERE model = '".$model."'";
                        }
                        
                        $result = dbconfig::run($query);  
                        if(!$result) {
                                throw new exception("Server not responde!");
                        }
                        if(mysqli_num_rows($result) > 0){       
                                while($row = mysqli_fetch_assoc($result)){
                                        $resultSet[$row['model']] = $row['prompt'];     
                                }               
                        }
                        $data = array('status'=>'success', 'msg'=>"Instruction fetch successfully.", 'result'=>$resultSet);
                }catch(Exception $e) {
                        $data = array('status'=>'error', 'msg'=>$e->getMessage());
                }finally{
                        return $data;
                }
        }

        public static function checkUserExist($email){      
                try {     
                   $query = "SELECT id FROM users WHERE email = '".$email."'"; 
                   $result = dbconfig::run($query);
                   if(!$result) {
                                        throw new exception("Oops! Something went wrong. <a href='".HELPER_URL.base64_encode('error_support')."'>Send error report to support</a>");
                   }
                   $count = mysqli_num_rows($result);
                   if($count > 0){
                           throw new exception("User with this email already exists");
                   } 
                   $data = array('status'=>'success', 'msg'=>"", 'result'=>'');
           } catch (Exception $e) {
                   $data = array('status'=>'error', 'msg'=>$e->getMessage());
           } finally {
                   return $data;
           }            
        }

        public static function editProfile($formdata, $id){
                try {                           
                        $query = "UPDATE `admin` SET fullname = '".$formdata['fullname']."', email = '".$formdata['email']."'";
                        $result = dbconfig::run($query);  
                        if(!$result) {
                                throw new exception("Server not responde!");
                        }       
                        $_SESSION['admin']['result']['fullname'] = $formdata['fullname'];       
                        $_SESSION['admin']['result']['email'] = $formdata['email'];
                        $data = array('status'=>'success', 'msg'=>"Your profile update successfully.", 'result'=>'');
                }catch(Exception $e) {
                        $data = array('status'=>'error', 'msg'=>$e->getMessage());
                }finally{
                        return $data;
                }
        }       

        public static function changePassword($req, $id){
                try {
            // Validate password strength
                        $uppercase = preg_match('@[A-Z]@', $req['password']);
                        $lowercase = preg_match('@[a-z]@', $req['password']);
                        $number    = preg_match('@[0-9]@', $req['password']);

                        if(!$uppercase || !$lowercase || !$number || strlen($req['password']) < 8) {
                            throw new exception('Password should be at least 8 characters in length and should include at least one upper case letter, one number.');
                        }                       

                        if($req['confirm_password'] !== $req['password']) {
                throw new exception("Confirm password is not matched!");
        }               
                        $query = "UPDATE `admin` SET password = '".md5($req['password'])."', raw_password = '".$req['password']."' WHERE id=".$id;
                        $result = dbconfig::run($query);  
                        if(!$result) {
                                throw new exception("Server not responde!");
                        }                               
                        $data = array('status'=>'success', 'msg'=>"Your password update successfully.", 'result'=>'');
                }catch(Exception $e) {
                        $data = array('status'=>'error', 'msg'=>$e->getMessage());
                }finally{
                        return $data;
                }
        }

}
