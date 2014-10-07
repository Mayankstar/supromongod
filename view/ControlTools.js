Ext.define('App.supromongod.view.ControlTools',{
    extend: Ext.toolbar.Toolbar,
    dock: 'bottom',
    items:['-','mongod: ',{
        text: l10n.stsEcho
       ,iconCls: 'sg-e'
       ,handler: function(){
       }
    },'->','-',{
        text: l10n.stsStopSystem
       ,iconCls: 'sg-s'
       ,handler: function(){
       }
    },'-',{
        text: l10n.stsRestart
       ,iconCls: 'sg-r'
       ,handler: function(){
       }
    },'-','->',{
        text: l10n.stsKill
       ,iconCls: 'sg-k'
       ,handler: function(){
        }
    }]
})
