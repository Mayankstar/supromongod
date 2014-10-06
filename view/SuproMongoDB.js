App.cfg['App.supromongod.view.SuproMongoDB'] = {// view-only stuff uses fast init
    extend: App.view.Window,
    title: l10n.mongo.title,
    wmImg: App.backendURL + '/css/supromongod/logo-mongodb.png',
    wmTooltip: l10n.mongo.tooltip,
    wmId: 'supromongod.view.SuproMongoDB',
    id: 'supromongod-view-SuproMongoDB',
    width: 777, height: 477,// initial
    layout: 'border',
    items:[
    {
        xtype: 'treepanel',
        region: 'west',
        split: true,
        bodyPadding: 5,
        minWidth: 185,
        width: 185,
        rootVisible: false,
        store: Ext.create('App.example.store.TreeMainMenu')
    },
    {
        region: 'center'
    },
    {
        region: 'south',
        split: true,
        height: 123
    }
    ]
}
