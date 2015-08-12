/*
*   clash.tools db deploy script v1.3.1
*
*   Changes: player war weights
*/

cursor = db.user.find();

while (cursor.hasNext()) {
	u = cursor.next();
	uid = u._id;
	weight = u.profile.warWeight;

	if (weight >=0 && weight < 100) {
	}
	else {
		weight = parseInt(weight/1000);
		if (weight >= 0 && weight < 100) {
		}
		else {
			weight = 0;
		}
	}

	db.user.update(
		{ _id: uid },
		{ $set: { 'profile.warWeight': weight } },
		{ multi: false }
	);

	print(u.ign + ' updated war weight to ' + weight);
}