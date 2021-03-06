#!/bin/sh
# Restore a collection using `mongodump` and current config $DB
# NOTE: "host" is OPENSHIFT_NODEJS_IP || '127.0.0.1',
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
[ "$OPENSHIFT_NODEJS_IP" ] && HOST=$OPENSHIFT_NODEJS_IP || HOST='127.0.0.1'

[ "$DB" ] || echo '
WARNING: $DB is empty
please specify $NODEJS_CONFIG or $2 as DB name
'

case "$OSTYPE" in
*cygwin* | *msys*) # MS Windows
    BIN="${0%/*}/../bin/mongorestore.exe"
;;
*linux-gnu* | *linux_gnu* | *)
    BIN='mongorestore'
    # we can be on data fs without exec permisson, thus try $PATH first
    type "$BIN" >/dev/null || {
        BIN="${0%/*}/../bin/$BIN"
        [ -x "$BIN" ] # or fail permanently
    }
    # do not hog if in OPENSHIFT
    [ "$OPENSHIFT_NODEJS_IP" ] && BIN="nice -n 19 $BIN"
;;
esac

echo "
restoring from 'mongo_$1.bson.gz' into '$DB' => '$1'"'
NOTE: if restore fails, run `db.repairDatabase()` in mongo shell and dump new
...'

gunzip -c "mongo_$1.bson.gz" | $BIN \
    '--host' "$HOST:$PORT"          \
    '--db' "$DB"                    \
    '--collection' "$1"             \
    '--drop'                        \
    '--dir' '-'
trap '' 0
exit 0
