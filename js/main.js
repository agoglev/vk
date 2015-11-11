var cur = {};

function addClass(el, name){
	if(!hasClass(el, name)) el.className = el.className + ' ' + name;
}

function hasClass(el, name){
	return (new RegExp('(\\s|^)' + name + '(\\s|$)')).test(el.className) ? true : false;
}

function removeClass(el, name){
	if(!el) return;
	if(Object.prototype.toString.call(el) === '[object NodeList]'){
		for(var i = 0; i < el.length; i++) removeClass(el[i], name);
		return;
	}
	el.className = trim((el.className || '').replace((new RegExp('(\\s|^)' + name + '(\\s|$)')), ' '));
}

function trim(text){
	try{
		return text.trim();
	}catch(e){
		return (text || '').replace(/^\s+|\s+$/g, '');
	} 
}

function ge(id){
	return typeof id == 'string' ? document.getElementById(id) : id;
}
function getXmlHttp(){
	var xmlhttp;
	try {
		xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
	} catch (e) {
		try {
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		} catch (E) {
			xmlhttp = false;
		}
	}
	if (!xmlhttp && typeof XMLHttpRequest != 'undefined') {
		xmlhttp = new XMLHttpRequest();
	}
	return xmlhttp;
}

function ajaxQuery(url, params, callback){
	var xhr = getXmlHttp();
	xhr.onreadystatechange = function() {
  		if(xhr.readyState == 4 && xhr.status == 200) {
			callback(xhr.responseText);
		}
	};
	xhr.open('POST', url, true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	var query = ['_='+(new Date().getTime())];
	for(var i in params) query.push(i+'='+encodeURIComponent(params[i]));
	xhr.send(query.join('&'));
}

function cancelEvent(event) {
  	event = event || window.event;
  	if(!event) return false;
  	if(event.preventDefault) event.preventDefault();
  	if(event.stopPropagation) event.stopPropagation();
  	event.cancelBubble = true;
  	event.returnValue = false;
}

function addEvent(el, type, fn) {
	if(el.addEventListener) el.addEventListener(type, fn, false);
	else if(el.attachEvent) el.attachEvent('on' + type, fn);
}

function removeEvent(el, type, fn) {
	if(el.addEventListener) el.removeEventListener(type, fn, false);
	else el.detachEvent('on' + type, fn);
}


