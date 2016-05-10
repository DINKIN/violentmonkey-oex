define('views/Command', function (require, _exports, module) {
  var MenuBaseView = require('views/Base');
  var app = require('app');
  var i18n = _.require('utils/i18n');

  module.exports = MenuBaseView.extend({
    initialize: function () {
      MenuBaseView.prototype.initialize.call(this);
      this.listenTo(app.commandsMenu, 'reset', this.render);
    },
    _render: function () {
      if (!app.commandsMenu.length)
        return app.navigate('', {trigger: true, replace: true});
      var _this = this;
      _this.$el.html(_this.templateFn({
        hasSep: true
      }));
      var comp = _this.components();
      var top = comp.top;
      var bot = comp.bot;
      _this.addMenuItem({
        name: i18n('menuBack'),
        symbol: 'arrow-left',
        onClick: function (_e) {
          app.navigate('', {trigger: true});
        },
      }, top);
      app.commandsMenu.each(function (item) {
        _this.addMenuItem(item, bot);
      });
      setTimeout(function () {
        _this.fixStyles(bot, comp.plh);
      });
    },
  });
});
