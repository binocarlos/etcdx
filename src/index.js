/*

  (The MIT License)

  Copyright (C) 2005-2013 Kai Davenport

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/*
  Module dependencies.
*/

var EventEmitter = require('events').EventEmitter;
var request = require('superagent');
var util = require('util');

function query_string(obj){
  if(!obj){
    return '';
  }
  return '?' + Object.keys(obj || {}).map(function(name){
    return name + '=' + obj[name]
  }).join('&')
}

function EtcdX(opts){
  EventEmitter.call(this);
  this.configure(opts || {})
}

util.inherits(EtcdX, EventEmitter);

module.exports = EtcdX;

EtcdX.prototype.configure = function(opts){
  var self = this;

  this.settings = this.settings || {};
  opts = opts || {};

  Object.keys(opts).forEach(function(name){
    self.settings[name] = opts[name];
  })
}

EtcdX.prototype.url = function(key, query){
  key = key ? '/keys' + (key.charAt(0)=='/' ? '' : '/') + key : '';
  var protocol = this.settings.protocol || 'http';
  var host = this.settings.host || '127.0.0.1';
  var port = this.settings.port || 4001;
  var version = this.settings.version || 2;

  return protocol + '://' + host + ':' + port + '/v' + version + key + query_string(query);
}

EtcdX.prototype.get = function(key, done){
  var req = request
  .get(this.url(key))
  
  return req.end(this.reply(done));
}

EtcdX.prototype.set = function(key, value, done){
  var req = request
  .put(this.url(key))
  .type('form')
  .send({
    value: value
  })

  return req.end(this.reply(done));
}

EtcdX.prototype.set_ttl = function(key, value, ttl, done){
  var req = request
  .put(this.url(key))
  .type('form')
  .send({
    value: value,
    ttl: ttl
  })

  return req.end(this.reply(done));
}

EtcdX.prototype.del = function(key, done){
  var req = request
  .del(this.url(key))

  return req.end(this.reply(done));
}

EtcdX.prototype.ls = function(key, recursive, done){
  if(arguments.length<=2){
    done = recursive;
    recursive = null;
  }
  var opts = {};
  if(recursive){
    opts.recursive = true;
  }
  var req = request
  .get(this.url(key, opts))
  
  return req.end(this.reply(done));
}

EtcdX.prototype.mkdir = function(key, done){
  var req = request
  .put(this.url(key))
  .type('form')
  .send({
    dir: true
  })

  return req.end(this.reply(done));
}

EtcdX.prototype.rmdir = function(key, done){
  var req = request
  .del(this.url(key, {
    recursive:true
  }))

  return req.end(this.reply(done));
}

function noop(){}
EtcdX.prototype.reply = function (cb) {
  cb = cb || noop;
  return function (err, res) {
    if (err || res.error) return cb(err || res.error);
    cb(null, JSON.parse(res.text));
  };
};

EtcdX.prototype.watch = function(key, recursive, trigger){
  var self = this;
  if(arguments.length<=2){
    trigger = recursive;
    recursive = null;
  }

  function get_watch_request(index){
    var opts = {
      wait:true
    };
    if(recursive){
      opts.recursive = true;
    }
    if(index){
      opts.waitIndex = index;
    }
    return request
    .get(self.url(key, opts))
  }

  function run_watch(index){
    var req = get_watch_request(index);

    return req.end(self.reply(function(error, result){
      if(error){
        return trigger(error);
      }

      if(trigger(null, result)){
        run_watch(result.node.modifiedIndex+1)  
      }
    }));  
  }

  run_watch();
}