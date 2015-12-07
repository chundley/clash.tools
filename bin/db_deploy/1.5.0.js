/*
*   clash.tools db deploy script v1.5.0
*
*   Changes:
*		- Addition of grand warden hero and timer
*/


var now = new Date();
var old = new Date(now.getTime() - 8640000000);

db.user.update({}, {$set:{'profile.heroes.gw': 0, 'profile.gwUpgrade': old }}, {multi: true})

