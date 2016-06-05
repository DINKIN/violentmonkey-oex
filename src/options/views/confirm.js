define('views/Confirm', function (require, _exports, module) {
  var cache = _.require('utils/cache');
  var tabs = _.require('utils/tabs');
  var BaseView = require('cache').BaseView;
  var ConfirmOptionsView = require('views/ConfirmOption');
  var editor = require('editor');

  module.exports = BaseView.extend({
    events: {
      'click .button-toggle': 'toggleOptions',
      'click #btnInstall': 'installScript',
      'click #btnClose': 'close',
    },
    templateUrl: '/options/templates/confirm.html',
    initialize: function () {
      var _this = this;
      _.bindAll(_this, 'hideOptions', 'trackLocalFile');
      BaseView.prototype.initialize.call(_this);
    },
    _render: function () {
      var _this = this;
      _this.$el.html(_this.templateFn());
      _this.loadedEditor = editor.init({
        container: _this.$('.editor-code')[0],
        readonly: true,
        onexit: _this.close,
      }).then(function (editor) {
        _this.editor = editor;
      });
      _this.$toggler = _this.$('.button-toggle');
      _this.$('#url').attr('title', _this.url).text(_this.url);
      _this.showMessage(_.i18n('msgLoadingData'));
    },
    initData: function (url, referer) {
      var _this = this;
      _this.url = url;
      _this.from = referer;
      _this.render();
      _this.loadData().then(function () {
        _this.parseMeta();
      });
    },
    loadData: function (changedOnly) {
      var _this = this;
      var _text = _this.data && _this.data.code;
      _this.$('#btnInstall').prop('disabled', true);
      _this.data = {
        code: _text,
        require: {},
        resources: {},
        dependencyOK: false,
        isLocal: /^file:\/\/\//.test(_this.url),
      };
      return _this.getScript(_this.url).then(function (text) {
        if (changedOnly && _text == text) return Promise.reject();
        _this.data.code = text;
        _this.loadedEditor.then(function () {
          _this.editor.setValueAndFocus(_this.data.code);
        });
      });
    },
    parseMeta: function () {
      var _this = this;
      return _.sendMessage({
        cmd: 'ParseMeta',
        data: _this.data.code,
      }).then(function (script) {
        var urls = _.values(script.resources);
        var length = script.require.length + urls.length;
        var finished = 0;
        if (!length) return;
        var error = [];
        var updateStatus = function () {
          _this.showMessage(_.i18n('msgLoadingDependency', [finished, length]));
        };
        updateStatus();
        var promises = script.require.map(function (url) {
          return _this.getFile(url).then(function (res) {
            _this.data.require[url] = res;
          });
        });
        promises = promises.concat(urls.map(function (url) {
          return _this.getFile(url, true).then(function (res) {
            _this.data.resources[url] = res;
          });
        }));
        promises = promises.map(function (promise) {
          return promise.then(function () {
            finished += 1;
            updateStatus();
          }, function (url) {
            error.push(url);
          });
        });
        return Promise.all(promises).then(function () {
          if (error.length) return Promise.reject(error.join('\n'));
          _this.data.dependencyOK = true;
        });
      }).then(function () {
        _this.showMessage(_.i18n('msgLoadedData'));
        _this.$('#btnInstall').prop('disabled', false);
      }, function (error) {
        _this.showMessage(_.i18n('msgErrorLoadingDependency'), error);
        return Promise.reject();
      });
    },
    hideOptions: function () {
      var _this = this;
      if (!_this.optionsView) return;
      _this.$toggler.removeClass('active');
      _this.optionsView.remove();
      _this.optionsView = null;
    },
    toggleOptions: function (_e) {
      var _this = this;
      if (_this.optionsView) {
        _this.hideOptions();
      } else {
        _this.$toggler.addClass('active');
        _this.optionsView = new ConfirmOptionsView;
        _this.optionsView.$el.insertAfter(_this.$toggler);
        $(document).one('mousedown', _this.hideOptions);
      }
    },
    close: function () {
      tabs.get().close();
    },
    showMessage: function (msg) {
      this.$('#msg').html(msg);
    },
    getFile: function (url, isBlob) {
      return new Promise(function (resolve, reject) {
        var xhr = new _.bg.XMLHttpRequest;
        xhr.open('GET', url, true);
        if (isBlob) xhr.responseType = 'blob';
        xhr.onloadend = function () {
          if (xhr.status > 300) return reject(url);
          if (isBlob) {
            var reader = new FileReader;
            reader.onload = function (_e) {
              resolve(window.btoa(this.result));
            };
            reader.readAsBinaryString(xhr.response);
          } else {
            resolve(xhr.responseText);
          }
        };
        xhr.send();
      });
    },
    getScript: function (url) {
      var _this = this;
      return new Promise(function (resolve, reject) {
        var text = cache.get(url);
        return text ? resolve(text) : reject();
      }).catch(function () {
        return _this.getFile(url)
        .catch(function (url) {
          _this.showMessage(_.i18n('msgErrorLoadingData'));
          throw url;
        });
      });
    },
    getTimeString: function () {
      var now = new Date();
      return _.zfill(now.getHours(), 2) + ':' +
        _.zfill(now.getMinutes(), 2) + ':' +
        _.zfill(now.getSeconds(), 2);
    },
    installScript: function () {
      var _this = this;
      _this.$('#btnInstall').prop('disabled', true);
      _.sendMessage({
        cmd:'ParseScript',
        data:{
          url: _this.url,
          from: _this.from,
          code: _this.data.code,
          require: _this.data.require,
          resources: _this.data.resources,
        },
      }).then(function (res) {
        _this.showMessage(res.message + '[' + _this.getTimeString() + ']');
        if (res.code < 0) return;
        if (_.options.get('closeAfterInstall')) _this.close();
        else if (_this.data.isLocal && _.options.get('trackLocalFile')) _this.trackLocalFile();
      });
    },
    trackLocalFile: function () {
      var _this = this;
      setTimeout(function () {
        _this.loadData(true).then(function () {
          var track = _.options.get('trackLocalFile');
          if (!track) return;
          _this.parseMeta().then(function () {
            track && _this.installScript();
          });
        }, _this.trackLocalFile);
      }, 2000);
    },
  });
});
