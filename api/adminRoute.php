<?php require_once('classes/admin.php'); 

$type = base64_decode($_GET['type']);

if($type == 'login'){		
	$call = ADMIN::login($_POST);
	if($call['status'] == 'error') {
		FD_add_notices('Please check Username or Password', 'error');
		header("location:".ADMIN_URL."login");
		exit;
	}else if($call['status'] == 'success'){		
		$_SESSION['admin'] = $call;
		header("location:".ADMIN_URL);		
		exit;
	}
}

else if($type == 'logout'){	
	unset($_SESSION["admin"]);		
	header("location:".ADMIN_URL."login");
}

else if($type == "vision-prompt"){	
	$call = ADMIN::addPrompt($_POST, 'vision');	
	if($call['status'] == 'error'){
		$show = array("msg" => 'error', 'notice'=>$call['msg']);  	
	}else{
		$show = array("msg" => 'success', 'notice'=>$call['msg'], 'result'=>$call['result']);
	}
	echo json_encode($show); 
}

else if($type == "search-prompt"){	
	$call = ADMIN::addPrompt($_POST, 'search');	
	if($call['status'] == 'error'){
		$show = array("msg" => 'error', 'notice'=>$call['msg']);  	
	}else{
		$show = array("msg" => 'success', 'notice'=>$call['msg'], 'result'=>$call['result']);
	}
	echo json_encode($show); 
}

else if($type == "edit_profile"){
	$call = ADMIN::editProfile($_POST, $_SESSION['admin']['result']['id']);
	if($call['status'] == 'error'){
		FD_add_notices($call['msg'], 'error');
	}else{
		FD_add_notices($call['msg'], 'success');
	} 
	header("location:".ADMIN_URL.'account-setting');
}

else if($type == "change_password"){
	$call = ADMIN::changePassword($_POST, $_SESSION['admin']['result']['id']);	
	if($call['status'] == 'error'){
		FD_add_notices($call['msg'], 'error');	
	}else{
		FD_add_notices($call['msg'], 'success');
	} 
	header("location:".ADMIN_URL.'account-setting');
} 

?>