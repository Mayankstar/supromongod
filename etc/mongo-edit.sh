#!/bin/sh

cd '../node_apps/mongo-edit/' || {
    echo 'no directory found'
    exit 1
}

echo 'starting `mongo-edit` at URL
http://127.0.0.1:2764/

(ctrl+c to kill)'

NODE_PATH="$PWD/../../../../node_modules"
export NODE_PATH

NODE="$PWD/../../../../node.exe"
[ -e "$NODE" ] || NODE='node'

exec "$NODE" server.js config/suproLocal.js
