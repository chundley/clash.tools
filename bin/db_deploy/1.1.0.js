/*
*   Siftrock db deploy script version 1.1.0
*
*   Changes:
*       1. Account schema adds integration
*       2. Update email_detail with new field: workflow_status
*       3. User schema adds ui_flags to session
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
    print(a.name + ' -- Starting');

    result = db.account.update(
        { _id: a_id},
        { $set: {
            integration: {
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
print('                        2. UPDATING EMAIL_DETAIL');
print('------------------------------------------------------------------------');

result = db.email_detail.update({}, {$set: {workflow_status: 3}}, {multi: true});

print(result);
print('Done updating email_detail');


print();
print('------------------------------------------------------------------------');
print('                        3. UPDATING USER RECORDS');
print('------------------------------------------------------------------------');

result = db.user.update({}, {$set: {'session_data.ui_flags': {} }}, {multi: true});

print(result);
print('Done updating user records');