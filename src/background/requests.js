var requests = function () {
  function getRequestId() {
    var id = _.getUniqId();
    requests[id] = {
      id: id,
      xhr: new XMLHttpRequest,
    };
    return id;
  }
  function xhrCallbackWrapper(req) {
    var lastPromise = Promise.resolve();
    var xhr = req.xhr;
    return function (evt) {
      var res = {
        id: req.id,
        type: evt.type,
        resType: xhr.responseType,
      };
      var data = res.data = {
        readyState: xhr.readyState,
        responseHeaders: xhr.getAllResponseHeaders(),
        status: xhr.status,
        statusText: xhr.statusText,
      };
      try {
        data.responseText = xhr.responseText;
      } catch (e) {}
      if (evt.type === 'loadend') clearRequest(req);
      return lastPromise = lastPromise.then(function () {
        return new Promise(function (resolve, reject) {
          if (xhr.response && xhr.responseType === 'blob') {
            var reader = new FileReader;
            reader.onload = function (e) {
              data.response = this.result;
              resolve();
            };
            reader.readAsDataURL(xhr.response);
          } else {
            // default `null` for blob and '' for text
            data.response = xhr.response;
            resolve();
          }
        });
      }).then(function () {
        req.cb && req.cb(res);
      });
    };
  }
  function httpRequest(details, cb) {
    var req = requests[details.id];
    if (!req || req.cb) return;
    req.cb = cb;
    var xhr = req.xhr;
    try {
      xhr.open(details.method, details.url, true, details.user, details.password);
      if (details.headers) {
        for (var k in details.headers) {
          xhr.setRequestHeader(k, details.headers[k]);
        }
      }
      if (details.responseType)
        xhr.responseType = 'blob';
      if (details.overrideMimeType)
        xhr.overrideMimeType(details.overrideMimeType);
      var callback = xhrCallbackWrapper(req);
      [
        'abort',
        'error',
        'load',
        'loadend',
        'progress',
        'readystatechange',
        'timeout',
      ].forEach(function (evt) {
        xhr['on' + evt] = callback;
      });
      xhr.send(details.data);
    } catch (e) {
      console.log(e);
    }
  }
  function abortRequest(id) {
    var req = requests[id];
    if (req) req.xhr.abort();
    delete requests[id];
  }

  var requests = {};
  return {
    getRequestId: getRequestId,
    abortRequest: abortRequest,
    httpRequest: httpRequest,
  };
}();
