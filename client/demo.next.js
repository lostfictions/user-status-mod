"use strict";

let UserConnections = new Mongo.Collection("user_status_sessions");

function relativeTime(timeAgo) {
  const diff = moment.utc(TimeSync.serverTime() - timeAgo);
  const time = diff.format("H:mm:ss");
  const days = +diff.format("DDD") - 1;
  let ago = "";
  if(days) {
    ago = days + "d";
  }
  ago += time;
  return ago + " ago";
}

Template.registerHelper("userStatus", UserStatus);
Template.registerHelper("localeTime", (date) => date && date.toLocaleString());
Template.registerHelper("relativeTime", relativeTime);

Template.login.helpers({
  loggedIn: () => Meteor.userId()
});

Template.status.events = {
  "submit form.start-monitor": (e, tmpl) => {
    e.preventDefault();
    UserStatus.startMonitor({
      threshold: tmpl.find("input[name=threshold]").valueAsNumber,
      interval: tmpl.find("input[name=interval]").valueAsNumber,
      idleOnBlur: tmpl.find("select[name=idleOnBlur]").value === "true"
    });
  },
  "click .stop-monitor": () => UserStatus.stopMonitor(),
  "click .resync": () => TimeSync.resync()
};

Template.status.helpers({
  lastActivity: () => {
    const lastActivity = this.lastActivity();
    if(lastActivity) {
      return relativeTime(lastActivity);
    }
    else {
      return "undefined";
    }
  }
});

Template.status.helpers({
  serverTime: () => new Date(TimeSync.serverTime()).toLocaleString(),
  serverOffset: TimeSync.serverOffset,
  serverRTT: TimeSync.roundTripTime,

  // Falsy values aren't rendered in templates, so let's render them ourself
  isIdleText: () => this.isIdle() || "false",
  isMonitoringText: () => this.isMonitoring() || "false"
});

Template.serverStatus.helpers({
  anonymous: () => UserConnections.find({ userId: { $exists: false }}),
  users: () => Meteor.users.find(),
  userClass: () => { if(this.status && this.status.idle) { return "warning"; } else { return "success"; }},
  connections: () => UserConnections.find({ userId: this._id })
});

Template.serverConnection.helpers({
  connectionClass: () => { if(this.idle) { return "warning"; } else { return "success"; }},
  loginTime: () => {
      if(!this.loginTime) {
        return;
      }
      return new Date(this.loginTime).toLocaleString();
    }
});

Template.login.events = {
  "submit form": (e, tmpl) => {
      e.preventDefault();
      const input = tmpl.find("input[name=username]");
      input.blur();
      Meteor.insecureUserLogin(input.value, (err, res) => { if(err) { console.log(err); }});
  }
};

// Start monitor as soon as we got a signal, captain!
Tracker.autorun((c) => {
  try { // May be an error if time is not synced
    UserStatus.startMonitor({
      threshold: 30000,
      idleOnBlur: true
    });
    c.stop();
  }
  catch(e) { }
});
