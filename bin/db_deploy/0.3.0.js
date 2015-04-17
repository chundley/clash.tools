/*
*   Siftrock db deploy script version 0.3.0
*
*   Changes:
*       1. Add valid incoming domains to the dns_config table
*       2. Add message types to nlp config
*       3. Add page to stream filter in user session
*/

now = new Date();

print();
print('--------------------------------');
print('      1. UPDATING DNS_CONFIG');
print('--------------------------------');
print();

db.dns_config.insert(
    {
        account_id: ObjectId("5407e7566bc6a38433961e66"),
        domain: 'm.siftrock.com',
        enabled: true,
        created_at: now,
        created_by: ObjectId('5407e7566bc6a38433961e67'),
        last_updated_at: now,
        last_updated_by: ObjectId('5407e7566bc6a38433961e67')
    }
);

db.dns_config.insert(
    {
        account_id: ObjectId("5407e7566bc6a38433961e66"),
        domain: 'demo.siftrock.com',
        enabled: true,
        created_at: now,
        created_by: ObjectId('5407e7566bc6a38433961e67'),
        last_updated_at: now,
        last_updated_by: ObjectId('5407e7566bc6a38433961e67')
    }
);

db.dns_config.insert(
    {
        account_id: ObjectId("544a7882d24d3aba03e522a4"),
        domain: 'hello.payscale.com',
        enabled: true,
        created_at: now,
        created_by: ObjectId('544a7882d24d3aba03e522a5'),
        last_updated_at: now,
        last_updated_by: ObjectId('544a7882d24d3aba03e522a5')
    }
);

print('Done updating dns_config');

print();
print('--------------------------------');
print('      2. UPDATING NLP_CONFIG');
print('--------------------------------');
print();
cursor = db.nlp_config.find();
while (cursor.hasNext()) {
    cfg = cursor.next();
    var spamshield = ['to prevent unwanted', 'sender verification page', 'spam arrest'];
    var bounce = ['delivery has failed', 'unable to deliver', 'could not be delivered', 'no such person', 'does not exist'];
    cfg.messageType.spamshield = spamshield;
    cfg.messageType.bounce = bounce;
    db.nlp_config.update({}, cfg);
}
print('Done updating nlp_config');


print();
print('----------------------------');
print('      3. UPDATING USERS');
print('----------------------------');
print();

cursor = db.user.find();
while (cursor.hasNext()) {
    u = cursor.next();
    u_id = u._id;
    print(u.email_address + ' -- Starting');

    var session_data = u.session_data;
    session_data.stream_filters.page = 1;
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