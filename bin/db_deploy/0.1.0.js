/*
*   Siftrock db deploy script version 0.1.0
*
*   Changes:
*       1. Account schema adds forwarding emails for settings and mx dns verification
*       2. Set status to 5 on inbound_email records so they don't all forward
*       3. Update user session data to include new fields
*/



now = new Date();

print();
print('-----------------------------');
print('      1. UPDATING ACCOUNTS');
print('-----------------------------');
print();

cursor = db.account.find();
while (cursor.hasNext()) {
    a = cursor.next();
    a_id = a._id;
    account_id = a._id.valueOf();
    print(a.name + ' -- Starting');
    email_address = db.user.find( { account_id: account_id }, {email_address: 1} ).limit(1).next().email_address;
    print(a.name + ' -- Found user: ' + email_address);

    db.account.update(
        { _id: a_id},
        { $set: {
            forwards: {
                unknown: [email_address],
                all: []
            },
            mx_verified: false,
            last_updated_at: now
          }
        },
        { multi: false }
    );

    print(a.name + ' -- Updated schema');
}

print();
print('--------------------------------');
print('      2. UPDATING INBOUND_EMAIL');
print('--------------------------------');
print();

db.inbound_email.update(
    { status: 3},
    { $set: {
        status: 5,
        last_updated_at: now
      }
    },
    { multi: true }
);

print('Done updating inbound emails');


print();
print('----------------------------');
print('      3. UPDATING USERS');
print('----------------------------');
print();

var session = {
    settings_tab: 'account',
    stream_style: 'email',
    stream_per_page: 10
};

cursor = db.user.find();
while (cursor.hasNext()) {
    u = cursor.next();
    u_id = u._id;
    print(u.email_address + ' -- Starting');

    db.user.update(
        { _id: u_id},
        { $set: {
            session_data: session,
            last_updated_at: now
          }
        },
        { multi: false }
    );

    print(u.email_address + ' -- Updated schema');
}

print('Done updating inbound users');
