cur.dropDownI = 0;
cur.DropDown = {};
function DropDown(id, opts){
	if(!opts) opts = {};

	var el = ge(id);
	if(!el) return;

	addClass(el, 'drop_down');

	var placeholder_str = opts.placeholder || 'Поиск';
	this.notFoundStr = opts.notFoundStr || 'Ничего не найдено';
	if(opts.onChange) this.onChange = opts.onChange;

	this.dID = ++cur.dropDownI;
	this.limit = opts.limit || -1;

	var cont = '<div class="drop_down_query_wrap" id="dd_query_wrap'+this.dID+'" onmousedown="cur.DropDown['+this.dID+'].checkFocus(event);">\
		<div class="dd_arrow"></div>\
		<div class="drop_down_selected_items" id="dd_selected'+this.dID+'"></div>\
		<input type="text" id="dd_query'+this.dID+'" placeholder="'+placeholder_str+'" class="fl_l drop_down_query_inp bsbb" onblur="cur.DropDown['+this.dID+'].hideItems();" onfocus="cur.DropDown['+this.dID+'].focus();" onkeydown="cur.DropDown['+this.dID+'].keyEv(event, this.value);"/>\
		<div class="dd_add_item fl_l hide" id="dd_add_item'+this.dID+'" onClick="cur.DropDown['+this.dID+'].focus();">Добавить <div class="dd_plus"></div></div>\
		<div class="clear"></div>\
	</div>\
	<div class="drop_down_items">\
		<div class="dd_scroll_wrap" id="dd_scroll'+this.dID+'"><div class="dd_scroll_slider"></div></div>\
		<div id="dd_items_'+this.dID+'" class="drop_down_items_res" onmousedown="cancelEvent(event)"></div>\
		<div class="dd_shadow"></div>\
		<div class="dd_shadow2"></div>\
	</div>';
	el.innerHTML = cont;
	this.scrollInit();

	this.added_num = 0;
	this.selected_items = {};

	this.el = el;
	this.query_inp = ge('dd_query'+this.dID);
	this.query_items = ge('dd_selected'+this.dID);

	ge('dd_query_wrap'+this.dID).style.width = (this.el.offsetWidth - 32) + 'px';

	if(opts.server){
		this.server = opts.server;
		this.serverData = {};
		this.preloader = opts.preloader || false;
	}

	this.queryInpWidth();
	this.setData(opts.items);

	cur.DropDown[this.dID] = this;
	return this;
}

DropDown.prototype.queryInpWidth = function(){

	if(this.added_num == 0){
		var w = this.el.offsetWidth;
	}else{
		var childs = ge('dd_selected'+this.dID).children,
			wrap_width = this.el.offsetWidth - 32, w = 0, item_w = 0;

		for(var i = 0; i < childs.length; i++){
			item_w = childs[i].offsetWidth + 4;
			w += item_w;
			if(w > wrap_width){
				w = item_w;
			}
		}
		w = wrap_width - w;
		if(w < 100) w = wrap_width;
	}
	this.query_inp.style.width = (w - 2) + 'px';
};

DropDown.prototype.strToEng = function(str){
	var word1 = '', word2 = '', word3 = '', code, cfg, symb, len = str.length;
	for(var i = 0; i < len; i++){
		code = str.charCodeAt(i);
		symb = null;
		if(code >= 1072 && code <= 1103){//если русские символы
			cfg = this.toENG[code];
			if(cfg){
				word1 += cfg[0];
				word2 += cfg[1];
				symb = cfg[0];
			}
		}else{
			word1 += str[i];
			word2 += str[i];
		}

		if(!symb) symb = str[i];
		word3 += this.mis_prints[symb] ? this.mis_prints[symb] : str[i];
	}
	if(len == 1) word3 = false;
	return [word1, word2, word3];
};

DropDown.prototype.setData = function(items){
	this.data = [];
	var eng_word;
	for(var i = 0; i < items.length; i++){
		eng_word = this.strToEng(items[i][1].toLowerCase());
		this.data.push([items[i][0], eng_word[1], items[i][1]]);
	}
	this.filtered_list = this.data;
	this.renderResult();
};


DropDown.prototype.search = function(query){
	if(this.last_query == query) return;
	this.last_query = query;
	if(query){
		if(this.server) return this.serverSearch(query);
		var words = this.prepareQuery(query), words_len = words.length, find;
		var result = [];
		for(var i = 0; i < this.data.length; i++){
			for(var j = 0; j < words_len; j++){
				find = false;
				for(var l = 0; l < words[j].length; l++){
					if(this.data[i][1].indexOf(words[j][l]) != -1){
						find = true;
						break;
					}
				}
				if(!find) break;
			}
			if(find) result.push(this.data[i]);
		}
	}else{
		clearTimeout(this.serverSearchTimer);
		var result = this.data;
	}
	this.filtered_list = result;
	this.renderResult();
};

DropDown.prototype.serverSearch = function(val){
	clearTimeout(this.serverSearchTimer);
	if(this.serverData[val]){
		this.filtered_list = this.serverData[val];
		this.renderResult();
	}else{
		var _s = this;
		this.serverSearchTimer = setTimeout(function(){
			var query = {
				act: _s.server,
				query: val,
				country_id: _s.country_id
			}
			if(_s.server == 'university') query.city_id = _s.city_id;
			ajaxQuery('/index.php', query, function(items){
				items = JSON.parse(items);
				var prepared = [], eng_word;
				for(var i = 0; i < items.length; i++){
					eng_word = _s.strToEng(items[i][1].toLowerCase());
					prepared.push([items[i][0], eng_word[1], items[i][1]]);
				}
				_s.filtered_list = prepared;
				_s.serverData[val] = prepared;
				_s.renderResult();
			});
		}, 400);
	}
};

DropDown.prototype.renderResult = function(){
	var cont = '';
	for(var i = 0; i < this.filtered_list.length; i++){
		if(this.selected_items[this.filtered_list[i][0]]) continue;
		cont += '<div class="drop_down_item" data-id="'+this.filtered_list[i][0]+'" data-i="'+i+'" onmousedown="cur.DropDown['+this.dID+'].selectItem(this, event)" onmouseover="cur.DropDown['+this.dID+'].overItem(this);">'+this.filtered_list[i][2]+'</div>';
	}
	if(!cont) cont = '<div class="drop_down_item not_found">'+this.notFoundStr+'</div>';
	var items_wrap = ge('dd_items_'+this.dID);
	items_wrap.innerHTML = cont;

	removeClass(ge('dd_items_'+this.dID).querySelectorAll('.drop_down_item.over'), 'over');
	addClass(ge('dd_items_'+this.dID).children[0], 'over');

	this.scrollUpdate();
};

DropDown.prototype.toENG = {
	1092: ['a', 'f'],//ф
	1080: ['b', 'i'],//и
	1089: ['c', 's'],//с
	1074: ['d', 'v'],//в
	1091: ['e', 'u'],//у
	1072: ['f', 'a'],//a
	1087: ['g', 'p'],//п
	1088: ['h', 'r'],//р
	1096: ['i', 'sh'],//ш
	1086: ['j', 'o'],//о
	1083: ['k', 'l'],//л
	1076: ['l', 'd'],//д
	1098: ['m', ''],//ъ
	1090: ['n', 't'],//т
	1097: ['o', 'sh'],//щ
	1079: ['p', 'z'],//з
	1081: ['q', 'y'],//й
	1082: ['r', 'k'],//к
	1099: ['s', 'y'],//ы
	1077: ['t', 'e'],//е
	1075: ['u', 'g'],//г
	1084: ['v', 'm'],//м
	1094: ['w', 'ts'],//ц
	1095: ['x', 'ch'],//ч
	1085: ['y', 'n'],//н
	1103: ['z', 'ya'],//я
	1073: ['b', 'b'],//б,
	1078: ['zh', 'zh'],//ж,
	1101: ['e', 'e'],//э,
	1105: ['e', 'e']//ё
};

DropDown.prototype.mis_prints = {
	'q': 'y',
	'w': 'ts',
	'e': 'u',
	'r': 'k',
	't': 'e',
	'y': 'n',
	'u': 'g',
	'i': 'sh',
	'o': 'sh',
	'p': 'z',
	'a': 'f',
	's': 'y',
	'd': 'b',
	'f': 'a',
	'g': 'p',
	'h': 'r',
	'j': 'o',
	'k': 'l',
	'l': 'd',
	';': 'zh',
	'"': 'e',
	'\\': 'e',
	'z': 'ya',
	'x': 'ch',
	'c': 's',
	'v': 'm',
	'b': 'i',
	'n': 't',
	',': 'b',
	'<': 'b',
	'.': 'u',
	'>': 'u'
};

DropDown.prototype.prepareQuery = function(query){
	var result = [],
		exp = query.toLowerCase().split(' '),
		symbol = 0, cfg, code, words, eng_arr;

	for(var i = 0; i < exp.length; i++){
		if(!exp[i]) continue;
		eng_arr = this.strToEng(exp[i]);

		words = [];
		if(eng_arr[0]) words.push(eng_arr[0]);
		if(eng_arr[1] != eng_arr[0]) words.push(eng_arr[1]);
		if(eng_arr[2] != eng_arr[1]) words.push(eng_arr[2]);

		result.push(words);
	}
	return result;
};

DropDown.prototype.selectItem = function(el, e){
	if(this.disabled) return;
	var id = parseInt(el.getAttribute('data-id'));
	this.selected_items[id] = true;
	this.renderResult();

	var pos = parseInt(el.getAttribute('data-i')),
		str = this.filtered_list[pos][2];

	var item = document.createElement('div');
	item.className = 'dd_selected_item fl_l';
	item.innerHTML = str+' <div class="dd_cancel" onClick="cur.DropDown['+this.dID+'].unSelectItem(this, \''+id+'\')"></div>';
	ge('dd_selected'+this.dID).appendChild(item);

	this.query_inp.value = '';
	this.search('');

	this.added_num++;
	this.hideItems();
	this.queryInpWidth();

	window.focus();// ie bugfix

	this.onChange && this.onChange(this.selected_items, this.added_num);
};

DropDown.prototype.unSelectItem = function(el, id){
	if(this.disabled) return;

	delete this.selected_items[id];
	this.added_num--;

	var parent = el.parentNode;
	parent.parentNode.removeChild(parent);

	this.queryInpWidth();
	this.checkInpVisible();
	this.renderResult();

	this.onChange && this.onChange(this.selected_items, this.added_num);
};

DropDown.prototype.checkInpVisible = function(){
	if(this.added_num > 0 && !String(this.query_inp.value).trim()){
		addClass(this.query_inp, 'hide');
		if(this.limit != -1 && this.added_num >= this.limit){
			addClass(ge('dd_add_item'+this.dID), 'hide');
			this.query_inp.value = '';
		}
		else removeClass(ge('dd_add_item'+this.dID), 'hide');
	}else{
		addClass(ge('dd_add_item'+this.dID), 'hide');
		removeClass(this.query_inp, 'hide');
	}
};

DropDown.prototype.hideItems = function(){
	this.checkInpVisible();
	removeClass(this.el, 'shown');
};

DropDown.prototype.focus = function(){
	if(this.disabled || this.added_num >= this.limit) return;
	addClass(ge('dd_add_item'+this.dID), 'hide');
	removeClass(this.query_inp, 'hide');
	this.query_inp.focus();
	addClass(this.el, 'shown');

	var items_wr = ge('dd_items_'+this.dID);
	items_wr.scrollTop = 0;

	removeClass(items_wr.querySelectorAll('.drop_down_item.over'), 'over');
	addClass(ge('dd_items_'+this.dID).firstChild, 'over');

	this.scrollUpdate();
};

DropDown.prototype.overItem = function(el){
	var items_wr = ge('dd_items_'+this.dID);
	removeClass(items_wr.querySelectorAll('.drop_down_item.over'), 'over');
	addClass(el, 'over');
};

DropDown.prototype.checkFocus = function(event){
	if(event.target.id == 'dd_query_wrap' + this.dID || hasClass(event.target, 'dd_arrow')){
		cancelEvent(event);
		if(hasClass(this.el, 'shown')) this.hideItems();
		else this.focus();
	}
};

DropDown.prototype.setDisable = function(state){
	if(state == 1){
		this.disabled = true;
		addClass(this.el, 'disabled');
		this.query_inp.disabled = true;
	}else{
		this.disabled = false;
		removeClass(this.el, 'disabled');
		this.query_inp.disabled = false;
		this.queryInpWidth();
	}
};

DropDown.prototype.destroySelected = function(){
	this.selected_items = {};
	this.added_num = 0;
	ge('dd_selected'+this.dID).innerHTML = '';
	this.query_inp.value = '';
	this.last_query = -1;
	this.checkInpVisible();
	this.renderResult();
	if(this.server) this.serverData = {};
	this.onChange && this.onChange(this.selected_items, this.added_num);
};

DropDown.prototype.keyEv = function(e, val){
	if(this.disabled) return;
	if(e.keyCode != 40 && e.keyCode != 38 && e.keyCode != 13) return this.search(val);
	var items_wr = ge('dd_items_'+this.dID), cur_item = items_wr.querySelectorAll('.drop_down_item.over')[0];
	removeClass(cur_item, 'over');
	
	var upd_scroll = false;
	switch(e.keyCode){
		case 40:
			var next = cur_item.nextSibling;
			if(!next) next = items_wr.firstChild;
			addClass(next, 'over');
			upd_scroll = next;
		break;
		case 38:
			var prev = cur_item.previousSibling;
			if(!prev) prev = items_wr.lastChild;
			addClass(prev, 'over');
			upd_scroll = prev;
		break;
		case 13:
			this.selectItem(cur_item);
		break;	
	}

	if(upd_scroll) this.scrollTop(upd_scroll.offsetTop - (items_wr.offsetHeight / 2));
}

// Scroll Bar
DropDown.prototype.scrollInit = function(){
	this.scroll = ge('dd_scroll'+this.dID);
	this.scroll_slider = this.scroll.firstChild;
	this.scrollPos = 0;

	var _s = this, wrap_el = ge('dd_items_'+this.dID), oldPos;
	function Wheel(e){
		if(_s.scroll_hidden) return;

		var delta = 0;
		if(e.wheelDeltaY || e.wheelDelta) delta = (e.wheelDeltaY || e.wheelDelta) / 2;
		else if (e.detail) delta = -e.detail * 10;

		var oldPos = wrap_el.scrollTop;
		wrap_el.scrollTop -= delta;
		_s.scrollUpdate();

		if(oldPos != wrap_el.scrollTop){
			addClass(_s.scroll, 'wheeling');
			clearTimeout(_s.scrollOverTimer);
			_s.scrollOverTimer = setTimeout(function(){
				removeClass(_s.scroll, 'wheeling');
			}, 500);
		}
	}
	addEvent(wrap_el, 'DOMMouseScroll', Wheel);
	addEvent(wrap_el, 'mousewheel', Wheel);

	addEvent(this.scroll, 'mousedown', this.scrollDrag.bind(this));
};

DropDown.prototype.scrollUpdate = function(){
	var wrap_el = ge('dd_items_'+this.dID),
		cont_h = wrap_el.scrollHeight,
		wrap_h = wrap_el.offsetHeight;

	if(cont_h <= wrap_h){
		this.scroll_hidden = true;
		addClass(this.scroll, 'hide');
		return;
	}else{
		this.scroll_hidden = false;
		removeClass(this.scroll, 'hide');
	}

	var top =  Math.min(1, wrap_el.scrollTop / (cont_h - wrap_h)),
		slider_h = Math.max(30, Math.floor(wrap_h * wrap_h / cont_h));

	this.scroll_slider.style.height = slider_h + 'px';
	this.scrollSliderH = slider_h;
	this.scroll_slider.style.marginTop = Math.max(0, Math.floor((wrap_h - slider_h - 4) * top + 2)) + 'px';
};

DropDown.prototype.scrollTop = function(pos){
	ge('dd_items_'+this.dID).scrollTop = parseInt(pos);
	this.scrollUpdate();
};

DropDown.prototype.scrollDrag = function(e){
	if(this.scroll_hidden) return;

	var start_pos = e.pageY, pos,
		wrap_el = ge('dd_items_'+this.dID), _s = this;

	cancelEvent(e);

	addClass(this.scroll, 'over');

	var contHeight = wrap_el.scrollHeight, wrapHeight = wrap_el.offsetHeight;
	if(!hasClass(e.target, 'dd_scroll_slider')){
		wrap_el.scrollTop = Math.floor((contHeight - wrapHeight) * Math.min(1, (e.offsetY - this.scrollSliderH / 2 + 5) / (wrapHeight - _s.scrollSliderH)));
		this.scrollUpdate();
	}

	start_pos -= this.scroll_slider.offsetTop;

	function Move(e1){
		wrap_el.scrollTop = Math.floor(
			(contHeight - wrapHeight) * 
			Math.min(1, (e1.pageY - start_pos) / 
			(wrapHeight - _s.scrollSliderH - 6))
		);
		_s.scrollUpdate();
	}
	function Up(){
		removeEvent(window.document, 'mousemove', Move);
		removeEvent(window.document, 'mouseup', Up);
		removeClass(_s.scroll, 'over');
	}
	addEvent(window.document, 'mousemove', Move);
	addEvent(window.document, 'mouseup', Up);
};



