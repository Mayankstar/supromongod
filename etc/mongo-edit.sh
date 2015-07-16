#!/bin/sh

cd "${0%/*}/../node_apps/mongo-edit/" || {
    echo 'no directory found'
    exit 1
}

echo 'starting `mongo-edit` with hardcoded config "suproLocal.js" at URL
http://127.0.0.1:2764/

(ctrl+c to kill)'

NODE_PATH="${0%/*}/../../../node_modules"
export NODE_PATH

BINPATH="${0%/*}/../../../"
while :
do
[ -e "${BINPATH}node.exe" ] && NODE='node.exe'&& break
[ -e "${BINPATH}bin/node.exe" ] && NODE='bin/node.exe' && break
[ -e "${BINPATH}bin/node" ] && NODE='bin/node' && break
BINPATH=''
NODE='node'
done

"$BINPATH$NODE" server.js config/suproLocal.js
