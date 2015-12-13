/*
*   clash.tools db deploy script v1.6.0
*
*   Changes:
*		- Addition of base tags
*/


var now = new Date();


db.clan.update({}, {$set:{base_tags: [{name: 'Reserved', color: '#de3e3a'}] }}, {multi: true})

