<?php
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require_once(__DIR__ . '/../../vendor/autoload.php');
class MAIL {
	protected static $HOST = "smtp.gmail.com";		 
	protected static $USERNAME = "operations@gmicro.us";
	protected static $PASSWORD = "uugj qwxh grnz pxax";	
    public static $data;
   function __construct() {

   }

	public static function sendEmail($req, $reqFor){
		try{
			$mail = new PHPMailer();
			$mail->IsSMTP();
			$mail->Mailer = "smtp";

			$mail->SMTPDebug  = 0;
			$mail->SMTPAuth   = TRUE;
			$mail->SMTPSecure = "tls";
			$mail->Port       = 587;
			$mail->Host       = self::$HOST;
			$mail->Username   = self::$USERNAME;
			$mail->Password   = self::$PASSWORD;

			$mail->IsHTML(true);					
			if($reqFor == 'tweaks'){			
				$mail->AddAddress('phpdevgmicro@gmail.com');			
				$mail->setFrom($req['email'], 'Raupyam Skin Analysis');
				$mail->Subject = 'Reply for Tweaks';
				$template = self::tweaksReplyTemplate($req);
			}

			$mail->MsgHTML($template['result']);
			if(!$mail->Send()) {
			  throw new exception("Error: Your message not send.");
			} else {
			  $data = array('status'=>'success', 'msg'=>"Your enquiry has been sent successfully.", 'result'=>'');
			}
		}catch(Exception $e){
		   $data = array('status'=>'error', 'msg'=>$e->getMessage());
		}finally{
			return $data;
		}
	}	

	public static function tweaksReplyTemplate($formData){
	    try{
	        $template = '
	        <div style="font-family: Arial, sans-serif; background-color:#f9f9f9; padding:20px;">
	            <table cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
	                <tr style="background:#0066cc;">
	                    <td style="padding:20px; text-align:center; color:#ffffff; font-size:20px; font-weight:bold;">
	                        Raupyam Skin Analysis
	                    </td>
	                </tr>
	                <tr>
	                    <td style="padding:20px; font-size:16px; color:#333333;">
	                        <p><strong>New tweak/feedback submission received!</strong></p>
	                        <table border="0" cellpadding="6" cellspacing="0" width="100%">	                          
	                            <tr>
	                                <td width="35%" style="font-weight:bold;">Email Address:</td>
	                                <td>'.$formData["email"].'</td>
	                            </tr>
	                            <tr>
	                                <td width="35%" style="font-weight:bold;">Message:</td>
	                                <td>'.nl2br($formData["suggestion"]).'</td>
	                            </tr>
	                        </table>
	                        <p style="margin-top:20px; color:#555;">You can reply directly to this email to continue the conversation.</p>
	                    </td>
	                </tr>
	                <tr style="background:#f0f0f0;">
	                    <td style="padding:15px; text-align:center; font-size:13px; color:#777;">
	                        © '.date('Y').' Raupyam Skin Analysis. All rights reserved.
	                    </td>
	                </tr>
	            </table>
	        </div>';
	        
	        $data = array('status'=>'success', 'msg'=>"", 'result'=>$template);
	    }catch(Exception $e){
	        $data = array('status'=>'error', 'msg'=>$e->getMessage());
	    }finally{
	        return $data;
	    }
	}


}

?>