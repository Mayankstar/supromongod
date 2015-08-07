#!/bin/sh
# Export a collection using `mongoexport` and current config DB
# NOTE: "host:port" is hardcoded
# $1 -- colection name
# DB name is taken from $NODEJS_CONFIG or $2
# input is from: $2 if no $DB there or $3 or STDIN otherwise
set -e

trap 'echo "
Unexpected Script Error! Use /bin/sh -x $0 to trace it.
"
set +e

trap "" 0
exit 0
' 0

[ "$1" ] || {
    echo '
No collection name in "$1"
'
    trap '' 0
    exit 1
}

if [ "$NODEJS_CONFIG" ]
then
    # get database name from the javascript config file comment:
    #```js
    #var DB  = 'hpoisk_nodes_' + OBJ // mongo-shell db: hpoisk_nodes_GLOB\r\n
    #```                                                ^^^^^^^^^^^^^^^^^
    DB=${NODEJS_CONFIG##*var DB}
    n=`printf '\n\r'`
    DB=${DB%%[$n]*}
    DB=${DB##* }
    FILE=$2
else
    DB=$2
    FILE=$3
fi

[ "$DB" ] || echo '
WARNING: $DB is empty
please specify $NODEJS_CONFIG or $2 as DB name
'
[ "$FILE" ] && SRC=$FILE || SRC=STDIN

echo "
from '$SRC' importing into '$DB' '$1'
...
"

"${0%/*}/../bin/mongoimport"             \
              '--host' '127.0.0.1:27727' \
              '--db' "$DB"               \
              '--collection' "$1"        \
              $FILE

trap '' 0
exit 0
