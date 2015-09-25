#!/bin/sh
# Export a collection using `mongoexport` and current config $DB
# NOTE: "host:port" is hardcoded
# $1 -- colection name
# $2 -- DB name is taken from $NODEJS_CONFIG or $2
# output file name: "mongo_$1.json[.gz]"
# $3 -- if specified no gzip is used
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
    #var DB  = 'nodes_' + OBJ // mongo-shell, mongo export db: nodes_GLOB\r\n
    #```                                                ^^^^^^^^^^^^^^^^^
    DB=${NODEJS_CONFIG##*var DB}
    n=`printf '\n\r'`
    DB=${DB%%[$n]*}
    DB=${DB##* }
else
    DB=$2
fi

[ "$DB" ] || echo '
WARNING: $DB is empty
please specify $NODEJS_CONFIG or $2 as DB name
'

if type gzip >/dev/null && [ ! "$3" ]
then
echo "
from '$DB' exporting '$1' && gzip => './mongo_$1.json.gz'
...
"
"${0%/*}/../bin/mongoexport"             \
              '--host' '127.0.0.1:27727' \
              '--db' "$DB"               \
              '--collection' "$1"        \
    | gzip -9 >"mongo_$1.json.gz"
else
echo "
from '$DB' exporting '$1' => './mongo_$1.json'
...
"
"${0%/*}/../bin/mongoexport"             \
              '--host' '127.0.0.1:27727' \
              '--db' "$DB"               \
              '--collection' "$1"        \
              '--out' "mongo_$1.json"
fi

trap '' 0
exit 0
