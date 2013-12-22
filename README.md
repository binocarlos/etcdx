# etcdx

![Build status](https://api.travis-ci.org/binocarlos/etcdx)

node client for etcd v2 that adheres to waitIndex for watching.

## example

```js
var etcdx = require('etcdx');
var client = new etcdx();

client.watch('/mongo_servers', true, function(error, server){
	// server is 'hello' then 'hello2'
})

client.set('/mongo_servers/server1', 'hello');
client.set('/mongo_servers/server1', 'hello2');
```

## install

```
$ npm install etcdx
```

## methods

### configure(opts)

set the following options for further requests to the etcd server:

 * protocol
 * host
 * port
 * version

## watch(key, recursive, trigger)
run 'trigger' each time a value at or below 'key' changes

'recursive' controls how deep we are watching

this function looks at the global etcd waitIndex in case a value has changed in-between our watch requests

## get(key, done)
return the value of 'key'

## set(key, value, done)
set the value of 'key'

## set_ttl(key, value, ttl, done)
set the value of 'key' for 'ttl' seconds

## del(key, done)
remove 'key'

## ls(key, recursive, done)
list the entries below 'key' - recursive follows nested directories

## mkdir(key, done)
create a directory (with no value) at 'key'

## rmdir(key, done)
remove all values below key


## licence

MIT