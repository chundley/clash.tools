/*
*   clash.tools db deploy script v1.3.2
*
*   Changes: update user mail preferences
*/

db.user.update({}, {$set: {mail_settings: { enabled: true, bounced: false }}}, {multi: true})
