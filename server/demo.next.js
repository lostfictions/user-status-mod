"use strict";

// Try setting this so it works on meteor.com
// (https://github.com/oortcloud/unofficial-meteor-faq)
process.env.HTTP_FORWARDED_COUNT = 1;

Meteor.publish(null, () => {
  return [
    Meteor.users.find({ "status.online": true }, { // online users only
      fields: {
        status: 1,
        username: 1
      }
  	}),
    UserStatus.connections.find()
  ];
});
