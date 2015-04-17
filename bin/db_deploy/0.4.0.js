/*
*   Siftrock db deploy script version 0.4.0
*
*   Changes:
*       1. Change system_to_address to system_to_domain
*       2. Drop the dns_config collection as it is now obsolete
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
    system_to_domain = a.system_to_address.substring(a.system_to_address.indexOf('@') + 1, a.system_to_address.length);
    print(a.name + ' -- Starting');
    db.account.update(
        { _id: a_id},
        { $set: {
            reply_domain: system_to_domain,
            last_updated_at: now
          },
          $unset: {
            system_to_address: ''
          }          
        },
        { upsert: false, multi: false }
    );

    print(a.name + ' -- Updated schema');
}

print('Done updating accounts');


print();
print('-----------------------------------------');
print('      2. DROPPING dns_config COLLECTION');
print('-----------------------------------------');
print();

db.dns_config.drop();

print('Done dropping dns_config collection');
