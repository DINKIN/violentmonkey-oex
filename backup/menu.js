'use strict';

function Menu(data) {
	this.data = data;
	var node = this.node = document.createElement('div');
	if(data.ellipsis) node.classList.add('ellipsis');
	node.innerHTML = '<i></i> ' + safeHTML(data.name);
	if('title' in data)
		node.title = typeof data.title == 'string' ? data.title : data.name;
	this.bindEvents();
	this.update(data.value);
	data.parent.insertBefore(node, data.before);
}
Menu.prototype = {
	update: function(value) {
		var node = this.node;
		var data = this.data;
		if(typeof value != 'undefined') data.value = value;
		if(data.symbols) {
			node.firstChild.className = 'fa ' + data.symbols[data.value ? 1 : 0];
			if(data.symbols.length > 1) {
				if(value) node.classList.remove('disabled');
				else node.classList.add('disabled');
			}
		}
	},
	bindEvents: function() {
		var events = this.data.events;
		for(var i in events)
			this.node.addEventListener(i, events[i].bind(this), false);
	},
};

!function() {
	var main = $('#main');
	var commands = $('#commands');
	var scripts = {};
	var main_top = main.firstElementChild;
	var main_bot = main.lastElementChild;
	var commands_top = commands.firstElementChild;
	var commands_bot = commands.lastElementChild;
	var nodeIsApplied;
	var tab, sep;

	function initMenu(){
		new Menu({
			name: _('menuManageScripts'),
			parent: main_top,
			symbols: ['fa-hand-o-right'],
			events: {
				click: function(e){
					bg.opera.extension.tabs.create({url:'/options.html'}).focus();
				},
			},
		});
		if(/^https?:\/\//i.test(tab.url))
			new Menu({
				name: _('menuFindScripts'),
				parent: main_top,
				symbols: ['fa-hand-o-right'],
				events: {
					click: function(){
						var matches = tab.url.match(/:\/\/(?:www\.)?([^\/]*)/);
						bg.opera.extension.tabs.create({url: 'https://greasyfork.org/scripts/search?q=' + matches[1]}).focus();
					},
				},
			});
		nodeIsApplied = new Menu({
			name: _('menuScriptEnabled'),
			parent: main_top,
			symbols: ['fa-times','fa-check'],
			events: {
				click: function(e) {
					var value = !this.data.value;
					setOption('isApplied', value);
					this.update(value);
					bg.updateIcon();
				},
			},
			value: getOption('isApplied'),
		}).node;
	}

	function menuScript(script) {
		if(script && !scripts[script.id]) {
			scripts[script.id] = script;
			var name = script.custom.name || getLocaleString(script.meta, 'name');
			name = name ? safeHTML(name) : '<em>' + _('labelNoName') + '</em>';
			new Menu({
				name: name,
				parent: main_bot,
				symbols: ['fa-times','fa-check'],
				title: script.meta.name,
				events: {
					click: function(e) {
						var self = this;
						var value = !self.data.value;
						bg.enableScript(script.id, value, function () {self.update(value);});
					},
				},
				value: script.enabled,
			});
		}
	}

	function setData(data) {
		if(data && data.menus && data.menus.length) {
			new Menu({
				name: _('menuBack'),
				parent: commands_top,
				symbols: ['fa-arrow-left'],
				events: {
					click: function(e) {
						commands.classList.add('hide');
						main.classList.remove('hide');
					},
				},
			});
			commands_top.appendChild(document.createElement('hr'));
			data.menus.forEach(function(menu) {
				new Menu({
					name: menu[0],
					parent: commands_bot,
					symbols: ['fa-hand-o-right'],
					events: {
						click: function(e) {
							tab.postMessage({topic: 'Command', data: this.data.name});
						},
					},
				});
			});
			new Menu({
				name: _('menuCommands'),
				parent: main_top,
				symbols: ['fa-arrow-right'],
				events: {
					click: function(e) {
						main.classList.add('hide');
						commands.classList.remove('hide');
					},
				},
				before: nodeIsApplied,
			});
		}
		if(data && data.ids && data.ids.length) {
			var ids = data.ids.filter(function (id) {
				return !scripts[id];
			});
			if(ids.length) {
				if(!sep)
					main_top.appendChild(sep = document.createElement('hr'));
				ids.map(function (id) {
					return bg.metas[id];
				}).forEach(menuScript);
			}
		}
		bg.button.popup.height = main.offsetHeight;
		setTimeout(function () {
			main_bot.style.pixelHeight = innerHeight - main_bot.offsetTop;
		}, 0);
	}

	tab = bg.opera.extension.tabs.getFocused();
	initMenu();
	setData(bg.tabData);
}();
