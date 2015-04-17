/*
*   Siftrock db deploy script version 0.1.3
*
*   Changes:
*       1. Add 'hidden' to schema for email_detail
*       2. Add new session settings to users
*/

now = new Date();

print();
print('--------------------------------');
print('      1. UPDATING EMAIL_DETAIL');
print('--------------------------------');
print();

db.email_detail.update(
    {},
    { $set: {
        hidden: false,
        last_updated_at: now
      }
    },
    { multi: true }
);

print('Done updating email detail');


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
    session_data.stream_filters = {
        days: 30,
        type: 'All',
        recipient: '',
        last_changed: now
    };

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

print('Done updating inbound users');
