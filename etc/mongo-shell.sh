#!/bin/sh

# DB name is taken from $NODEJS_CONFIG or $1
set -e

trap 'echo "
Unexpected Script Error! Use /bin/sh -x $0 to trace it.
"
set +e

trap "" 0
exit 0
' 0

if [ "$NODEJS_CONFIG" ]
then
    # get database name from the javascript config file comment:
    #```js
    #var DB  = 'hpoisk_nodes_' + OBJ // mongo-shell db: hpoisk_nodes_GLOB
    #```                                                ^^^^^^^^^^^^^^^^^
    DB=${NODEJS_CONFIG##*var DB}
    n=`printf '\n\r'`
    DB=${DB%%[$n]*}
else
    DB=$1
fi

"${0%/*}/../bin/mongo" "127.0.0.1:27727/${DB##* }"

trap '' 0
exit 0
