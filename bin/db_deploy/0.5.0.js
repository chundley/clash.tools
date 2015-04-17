/*
*   Siftrock db deploy script version 0.5.0
*
*   Changes:
*       1. Account schema adds forwarding emails for human responses
*       2. Set status on inbound_email to 5 so the human responses don't get forwarded on deployment
*       3. Update users with dashboard_filters session data
*/



now = new Date();

print();
print('------------------------------------------------------------------------');
print('                        1. UPDATING ACCOUNTS');
print('------------------------------------------------------------------------');

cursor = db.account.find();
while (cursor.hasNext()) {
    a = cursor.next();
    a_id = a._id;
    account_id = a._id.valueOf();
    print(a.name + ' -- Starting');
    unknownForwards = a.forwards.unknown;

    result = db.account.update(
        { _id: a_id},
        { $set: {
            forwards: {
                human: unknownForwards,
                unknown: [],
                all: []
            },
            last_updated_at: now
          }
        },
        { multi: false }
    );
    print(result);
    print(a.name + ' -- Finished');
}

print('Done updating accounts');

print();
print('------------------------------------------------------------------------');
print('                     2. UPDATING INBOUND_EMAIL');
print('------------------------------------------------------------------------');

result = db.inbound_email.update( { status: 3 }, { $set: { status: 5 } }, { multi: true } );

print(result);

print('Done updating inbound_email');


print();
print('------------------------------------------------------------------------');
print('                         3. UPDATING USERS');
print('------------------------------------------------------------------------');
result = db.user.update(
    {},
    {
        $set: {
            'session_data.dashboard_filters': {
                days: 90,
                last_changed: now
            }
        }
    },
    { multi: true }
);

print(result);
print('Done updating users');
