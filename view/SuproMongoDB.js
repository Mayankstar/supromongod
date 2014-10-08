App.cfg['App.supromongod.view.SuproMongoDB'] = {
    __noctl: true,// view-only stuff uses fast init
    extend: App.view.Window,
    title: l10n.mongo.title,
    wmTooltip: l10n.mongo.modname,
    wmImg: App.backendURL + '/css/supromongod/logo-mongodb.png',
    wmId: 'supromongod.view.SuproMongoDB',
    id: 'supromongod-view-SuproMongoDB',
    requires: ['App.supromongod.view.ControlTools'],
    width: 777, height: 477,// initial
    layout: 'fit',
    bodyStyle:
'font-family: "Terminus" monospace; font-size: 10pt;' +
'background-color: black; color: #00FF00;',
    autoScroll: true,
    initComponent: function initSuproMongoDBComponent(){
        this.items = [
        {
            xtype: 'component',
            html: l10n.mongo.noload,
            itemId:'log'
        }
        ]
        this.dockedItems = [
        {
            xtype: 'toolbar',
            dock: 'top',
            items:['-',
            {
                xtype: 'component',
                html: l10n.mongo.status,
                itemId: 'status'
            },'->','-',
            {
                text: l10n.mongo.refreshLog
               ,iconCls: 'sm-rl'
               ,handler: function(toolbar){
                    App.backend.req('/supromongod/lib/log',
                    function(err, json){
                        if(!err){
                            err = toolbar.up('panel')
                            err.down('#log').update(
                                '<pre>' + json + '</pre>'
                            )
                            err.scrollBy(0, 1 << 22, false)
                            return
                        }

                        Ext.Msg.show({
                            title: l10n.errun_title,
                            buttons: Ext.Msg.OK,
                            icon: Ext.Msg.ERROR,
                            msg: l10n.errapi + '<br><b>' + json.err + '</b>'
                        })
                    })
                }
            },
            {
                text: l10n.stsClean
               ,iconCls: 'sm-cl'
               ,handler: function(toolbar){
                    toolbar.up('panel').down('#log').update('')
                }
            }
            ]
        },
            Ext.create('App.supromongod.view.ControlTools')
        ]
        this.callParent()
    }
}
