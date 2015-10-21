#!/bin/sh
# Export a collection using `mongoexport` and current config $DB
# NOTE: "host" is hardcoded to '127.0.0.1',
#       "port" is 27727 or $NODEJS_CONFIG.supromongod.port
# $1 -- collection name
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
    : <<'__' # parse JS content to see database name, i.e.:
var DB = 'MAIN'// name is used in mongo-shell, mongo-export tools
          ^^^^
__
    DB=${NODEJS_CONFIG##*var DB = [\'\"]}
    DB=${DB%%[\'\"]*}
    : <<'__' # parse JS content to see database port, i.e.:
        supromongod:{
            db_path: '/data/supromongod/' + DB + '_wiredTiger/',
            port: 27081,
                  ^^^^^
            db_name: DB
        },
__
    PORT=`sed "/supromongod:{/,/}/{/ port *:/s_.*: *\([[:digit:]]*\).*_\1_p};d" <<EOF
$NODEJS_CONFIG
EOF
`
else
    DB=$2
fi

[ "$PORT" ] || PORT=27727

[ "$DB" ] || echo '
WARNING: $DB is empty
please specify $NODEJS_CONFIG or $2 as DB name
'
case "$OSTYPE" in
*cygwin* | *msys*) # MS Windows
    BIN="${0%/*}/../bin/mongoexport.exe"
;;
*linux-gnu* | *linux_gnu* | *)
    BIN="${0%/*}/../bin/mongoexport"
;;
esac

if type gzip >/dev/null && [ ! "$3" ]
then
echo "
from '$DB' exporting '$1' && gzip => './mongo_$1.json.gz'"'
NOTE: if import fails, run `db.repairDatabase()` in mongo shell and export new
...'

"$BIN"                         \
    '--host' "127.0.0.1:$PORT" \
    '--db' "$DB"               \
    '--collection' "$1"        \
    | gzip -9 >"mongo_$1.json.gz"
else
echo "
from '$DB' exporting '$1' => './mongo_$1.json'
...
"
"$BIN"                         \
    '--host' "127.0.0.1:$PORT" \
    '--db' "$DB"               \
    '--collection' "$1"        \
    '--out' "mongo_$1.json"
fi

trap '' 0
exit 0
