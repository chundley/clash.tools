/*
*   clash.tools db deploy script v1.7.0
*
*   Changes:
*		- Addition of bowler to profiles
*/


var now = new Date();

db.user.update({}, {$set:{'profile.dark_troops.bowler': 0}}, {multi: true})

