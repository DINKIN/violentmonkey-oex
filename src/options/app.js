_.showMessage = function (options) {
  new MessageView(options);
};

var App = Backbone.Router.extend({
  routes: {
    '': 'renderMain',
    'main/:tab': 'renderMain',
    'confirm/:url': 'renderConfirm',
    'confirm/:url/:from': 'renderConfirm',
  },
  renderMain: function (tab) {
    scriptList || initMain();
    this.view = new MainView(tab);
  },
  renderConfirm: function (url, _from) {
    this.view = new ConfirmView(url, _from);
  },
  renderEdit: function (id) {
    this.view = new EditView(id);
  },
});
var app = new App();
if (!Backbone.history.start())
  app.navigate('', {trigger: true, replace: true});

var scriptList;
function initMain() {
  scriptList = new ScriptList();
  _.bg._.messenger.connect(function (res) {
    if (res.cmd === 'add') {
      res.data.message = '';
      scriptList.push(res.data);
    } else if (res.data) {
      var model = scriptList.get(res.data.id);
      if (model) model.set(res.data);
    }
  });
}
