define('views/Domain', function (require, _exports, module) {
  var MenuBaseView = require('views/Base');
  var app = require('app');
  var i18n = _.require('utils/i18n');

  module.exports = MenuBaseView.extend({
    initialize: function () {
      MenuBaseView.prototype.initialize.call(this);
      this.listenTo(app.domainsMenu, 'reset', this.render);
    },
    _render: function () {
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
      app.domainsMenu.each(function (item) {
        _this.addMenuItem(item, bot);
      });
      setTimeout(function () {
        _this.fixStyles(bot, comp.plh);
      });
    },
  });
});