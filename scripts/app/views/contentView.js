define(['backbone', 'helpers/formatDate', 'helpers/escapeHtml'], function(BB, formatDate, escapeHtml) {
	var ContentView = BB.View.extend({
		tagName: 'header',
		template:  _.template($('#template-header').html()),
		events: {
			'mousedown': 'handleMouseDown',
			'click .pin-button': 'handlePinClick',
			'keydown': 'handleKeyDown'
		},
		handlePinClick: function(e) {
			$(e.currentTarget).toggleClass('pinned');
			this.model.save({
				pinned: $(e.currentTarget).hasClass('pinned')
			});
		},
		initialize: function() {
			var that = this;
			
			this.on('attached', this.handleAttached);

			bg.items.on('change:pinned', this.handleItemsPin, this);
			bg.sources.on('clear-events', this.handleClearEvents, this);
		},
		handleAttached: function() {
			//window.addEventListener('message', function(e) {
			app.on('select:article-list', function(data) {
				this.handleNewSelected(bg.items.findWhere({ id: data.value }));
			}, this);

			/*
			} else if (data.action == 'no-items') {
					that.model = null;
					that.hide();
				} else if (data.action == 'space-pressed') {
					that.handleSpace();
				}
			*/

		},
		handleClearEvents: function(id) {
			if (window == null || id == window.top.tabID) {
				bg.items.off('change:pinned', this.handleItemsPin, this);
				bg.sources.off('clear-events', this.handleClearEvents, this);
			}
		},
		handleItemsPin: function(model) {
			if (model == this.model) {
				this.$el.find('.pin-button').toggleClass('pinned', this.model.get('pinned'));
			}
		},
		getFormatedDate: function(unixtime) {
			var dateFormats = { normal: 'DD.MM.YYYY', iso: 'YYYY-MM-DD', us: 'MM/DD/YYYY' };
			var pickedFormat = dateFormats[bg.settings.get('dateType') || 'normal'] || dateFormats['normal'];

			var timeFormat = bg.settings.get('hoursFormat') == '12h' ? 'H:mm a' : 'hh:mm:ss';

			return formatDate(new Date(unixtime), pickedFormat + ' ' + timeFormat);
		},
		renderTime: null,
		render: function() {
			clearTimeout(this.renderTime);

			if (!this.model) return;

			this.renderTime = setTimeout(function(that) {
				that.show();

				var data = Object.create(that.model.attributes);
				data.date = that.getFormatedDate(that.model.get('date'));
				data.url = escapeHtml(data.url);

				var source = that.model.getSource(); 
				var content = that.model.get('content');


				that.$el.html(that.template(data));				

				// first load might be too soon
				var sandbox = app.article.sandbox;
				var fr = sandbox.el;

				if (sandbox.loaded) {
					/****fr.contentDocument.documentElement.innerHTML != content****/
					fr.contentWindow.scrollTo(0, 0);
					fr.contentDocument.documentElement.style.fontSize = bg.settings.get('articleFontSize') + '%';
					fr.contentDocument.querySelector('base').href = source.get('url');
					fr.contentDocument.querySelector('#smart-rss-content').innerHTML = content;
					fr.contentDocument.querySelector('#smart-rss-url').href = that.model.get('url');
				} else {
					sandbox.on('load', function() {
						fr.contentWindow.scrollTo(0, 0);
						fr.contentDocument.documentElement.style.fontSize = bg.settings.get('articleFontSize') + '%';
						fr.contentDocument.querySelector('base').href = source ? source.get('url') : '#';
						fr.contentDocument.querySelector('#smart-rss-content').innerHTML = content;
						fr.contentDocument.querySelector('#smart-rss-url').href = that.model.get('url');
					});
				}
			}, 50, this);

			return this;
		},
		handleNewSelected: function(model) {
			this.model = model;
			if (!this.model) {
				// should not happen but happens
				this.hide();
			} else {
				this.render();	
			}
			
		},
		hide: function() {
			$('header,iframe').css('display', 'none');
		},
		show: function() {
			$('header,iframe').css('display', 'block');
		},
	});

	return new ContentView();
});