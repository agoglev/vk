<?php

$hintsEngine = new Memcached;
$hintsEngine->addServer('localhost', 33211);

$act = isset($_REQUEST['act']) ? $_REQUEST['act'] : false;
switch($act){

	case 'city':
		$query = mysql_escape_string(trim($_POST['query']));
		$query = str_replace(' ', '+', $query);

		$cid = intval($_POST['country_id']);

		$city = explode(',', $hintsEngine->get('user_hints'.$cid.',2#50('.$query.')'));

		$result = array();
		include 'app/cities.php';
		for($i = 1; $i < count($city); $i += 2){
			$id = intval($city[$i + 1]);
			$result[] = array($id, $city_list[$id]);
		}
		echo json_encode($result);
		exit;
	break;

	case 'university':
		$query = mysql_escape_string(trim($_POST['query']));
		$query = str_replace(' ', '+', $query);

		$cid = intval($_POST['city_id']);

		$university = explode(',', $hintsEngine->get('user_hints'.$cid.',3#50('.$query.')'));

		$result = array();
		include 'app/universities.php';
		for($i = 1; $i < count($university); $i += 2){
			$id = intval($university[$i + 1]);
			$result[] = array($id, $univer_list[$cid.'_'.$id]);
		}
		echo json_encode($result);
		exit;
	break;
	
	default:

	include 'app/main.php';
}