/*
*   Siftrock db deploy script version 0.4.0
*
*   Changes:
*       1. Update user sesssion adding last_id, first_date, and last_date
*/



now = new Date();

print();
print('-----------------------------');
print('      1. UPDATING USERS');
print('-----------------------------');
print();

cursor = db.user.find();
while (cursor.hasNext()) {
    u = cursor.next();
    u_id = u._id;

    print(u.name + ' -- Starting');
    db.user.update(
        { _id: u_id},
        { $set: {
            'session_data.stream_filters.last_id': 0,
            'session_data.stream_filters.first_date': 0,
            'session_data.stream_filters.last_date': 0,
            last_updated_at: now
          }
        },
        { upsert: false, multi: false }
    );

    print(u.name + ' -- Updated schema');
}

print('Done updating users');
