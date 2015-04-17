/*
*   Siftrock db deploy script version 0.3.1
*
*   Changes:
*       1. Add footer cruft to nlp_config
*       2. Add values to user session
*/

now = new Date();

print();
print('--------------------------------');
print('      1. UPDATING NLP_CONFIG');
print('--------------------------------');
print();
cursor = db.nlp_config.find();
while (cursor.hasNext()) {
    cfg = cursor.next();
    var footerCruft = ['may be confidential', 'may contain confidential', 'the information in this e-mail is confidential', 'the information in this email is confidential'];
    cfg.footerCruft = footerCruft;
    db.nlp_config.update({}, cfg);
}
print('Done updating nlp_config');


print();
print('----------------------------');
print('      2. UPDATING USERS');
print('----------------------------');
print();

cursor = db.user.find();
while (cursor.hasNext()) {
    u = cursor.next();
    u_id = u._id;
    print(u.email_address + ' -- Starting');

    var session_data = u.session_data;
    session_data.stream_filters.first_id = 0;
    session_data.stream_filters.last_changed = now;

    db.user.update(
        { _id: u_id},
        { $set: {
            session_data: session_data,
            last_updated_at: now
          }
        },
        { multi: false }
    );

    print(u.email_address + ' -- Updated schema');
}
print('Done updating users');
