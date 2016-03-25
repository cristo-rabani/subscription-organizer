# Subscription Improver
Normally you invoke subscriptions inside the template level and you use many times this template
subscriptions will rerun again etc. Subscription Improver will share same subscriptions between many views or/and places.
Additionally any subscription is cached for while before will be really stopped, so any resubscribtion is fast.

This package brings possibility of making additional subscription under subscriptions.
Thus, after user is subscribed you can subscribe for his avatar.

## Motivation
Implemented because any other packages for subscriptions disappointed me.

## How it works

### Memoize subscriptions

```js
const h1 = SubscriptionImprover.subscribe('test', {a:1, b:2});
const h2 = SubscriptionImprover.subscribe('test', {a:1, b:2});
const h3 = SubscriptionImprover.subscribe('test', {a:1, b:2});

// Only onetime it will be subscribed (h1 === h2 === h3)

h1.stop(); //Still is subscribed
h3.stop(); //Still is subscribed
h2.stop(); //Subscription will be stopped soon

```

### Dependant subscriptions

```js
const h1 = SubscriptionImprover.subscribe('user', 'afaf123');
// this autorun will be launched when h1 will be ready
h1.autorun(function () {
    const user = userMeteor.users.findOne();
    //following subscriptions will stopped after h1
    this.subscribe('avatar', user.avatarId);
    SubscriptionImprover.subscribe('user', user.friendId);
});
const h2 = SubscriptionImprover.subscribe('test', {a:1, b:2});

// Only onetime it will be subscribed (h1 === h2 === h3)

h1.stop(); //Still is subscribed
h2.stop(); //Subscription will be stopped soon with dependants (autoruns)

```

### Cache

Unique subscription is holden before stop wasn't called as many times as subscribe was.
After that, this subscription will passed to stopping.
As a default stopping of subscription will wait one minute before subscription will be really stopped.

```js
const h1 = SubscriptionImprover.subscribe('test', {a:1, b:2});
h1.stop();

Meteor.setTimeout(function () {
    // reusing old subscription and clear the timeout to stopping
    const h2 = SubscriptionImprover.subscribe('test', {a:1, b:2});
}, 30000);

```

increase or decrease timeout to stop

```js
SubscriptionImprover.setConfig({waitTimeUntilUnsubscribe: 0});
const h1 = SubscriptionImprover.subscribe('test', {a:1, b:2});
h1.stop(); //will be stop (but async)

```

### Subscription count

```js
const h1 = SubscriptionImprover.subscribe('test', {a:1, b:2});
const h2 = SubscriptionImprover.subscribe('test', {a:1, b:2});
 //reactive data source
h1.count(); //output: 2
```

### Many instances

```js
const mySubsImprover = new SubscriptionImprover();
const h1 = mySubsImprover.subscribe('test', {a:1, b:2});
```

### Example in blaze template

within autorun

```js

Template.someView.onCreated(function(){
    this.autorun(function() {
        var data = Template.currentData();
        SubscriptionImprover.subscribe('test', data._id);
    });
});

```

without autorun

```js

Template.someView.onCreated(function(){
    this.mySub = SubscriptionImprover.subscribe('test', {a:1, b:2});
});

Template.someView.onDestroyed(function(){
    this.mySub.stop();
});

```