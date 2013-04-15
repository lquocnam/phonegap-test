"use strict"


//List Product

// Router
var App = Ember.Application.create();

Ember.View.reopen({
    didInsertElement: function() {
        this.set('elementIsInserted', true);
        this._super();
    },

    willDestroyElement: function() {
        this.set('elementIsInserted', false);
        this._super();
    }
});

App.Router.reopen({
    location: 'hash'
})

App.Router.map(function() {
    this.route('photo');
    this.route('clock');
    this.route('compass');
    this.route('notify');
    this.route('events');
    this.route('accel');
});

App.ApplicationController = Ember.Controller.extend({
    needs: ['actionBar'],
    title: '',
    updateTitle: function() {
        this.set('controllers.actionBar.title', this.get('currentPath'));
    }.observes('currentPath')
});
App.ApplicationRoute = Ember.Route.extend({
    setupController: function(controller, model){

    },
    events: {
        goToLink: function(link){
            //console.log('goToLink', link);
            this.transitionTo(link);
        }
    }
})

App.IndexRoute = Ember.Route.extend({
    /*redirect: function(){
     this.transitionTo('lists');
     }*/
});

App.ListsRoute = Ember.Route.extend({
    setupController: function(controller, song) {
        controller.set('photo', App.Photo.find(1));
    },
    model: function(){
        return App.List.find();
    }
});

App.PhotoController = Ember.ObjectController.extend({
    title: 'Fotos',
    content: null,
    logo: "img/cordova.png",
    takePicture: function(){
        var that = this;
        var cameraSuccess = function(imageURI){
            //console.log('cameraSuccess');
            //console.log( imageURI);
            that.set('logo', imageURI);

            /*
            var person = App.Photo.createRecord({
                username: 'phonegap',
                attachment: photo
            });
            person.get('transaction').commit();
            */
        };
        var cameraError = function(msg){
            //console.log('error ', msg);
        };

        //console.log('takePicture');
        //console.log(navigator.camera);
        navigator.camera.getPicture( cameraSuccess, cameraError, {
            quality: 50,
            destinationType: Camera.DestinationType.FILE_URI
        });
    },
    submitFileUpload: function(){
        //console.log('submitFileUpload');
        var person = App.Photo.createRecord({
            username: 'phonegap',
            attachment: this.get('logo')
        });
        //console.log(person);
        person.get('transaction').commit();
    }
});


App.ActionBarController = Ember.ObjectController.extend({
    title: 'phonegap',
    navigations: function(){
        var names = App.Router.router.recognizer.names;
        var navs = [];
        for(var name in names){
            if (names.hasOwnProperty(name)) {
                //console.log('found', name);
                navs.push(name);
            }
        }
        //console.log(navs);
        return navs;
    }.property('App.Router.router.recognizer.names')
});
App.ActionBarBackView = Ember.View.extend({
    templateName: 'actionBarBack',
    tagName: 'span',
    classNames: ['back'],
    click: function(e){
        e.preventDefault();
        //console.log('click');
        setTimeout(function(){
            window.history.back();
        }, 10);
    }
});
App.ActionBarMenuView = Ember.View.extend({
    templateName: 'actionBarMenu',
    tagName: 'span',
    classNames: ['menu'],
    expanded: false,
    touchStart: function(e){
        var that = this;
        if(e.target.nodeName === "SPAN" || e.target.nodeName === "P"){
            //hat den toggle button getroffen
            this.toggleProperty('expanded');
        }else{
            /*setTimeout(function(){
                that.toggleProperty('expanded');
            }, 400);*/
        }
        //console.log(e);
    }
});
App.ActionBarControlView = Ember.View.extend({
    templateName: 'actionBarControl',
    tagName: 'ul',
    classNames: ['control']
});

App.ActionBarView = Ember.ContainerView.extend({
    /**
     * Android ActionBar clone
     * back
     * dropdown
     * buttons
     **/
    childViews: [App.ActionBarBackView, App.ActionBarMenuView, App.ActionBarControlView],
    controller: App.ActionBarController,
    tagName: 'div',
    classNames: ['actionBar'],
    templateName: 'actionBar'
});

App.ClockDigitDisplayView = Ember.View.extend({
    hour: 0,
    minute: 0,
    second: 0,
    templateName: 'clockDigitDisplay',
    tagName: 'div',
    classNames: ['clock-display'],
    timeChanged: function(){
        var time = this.get('controller.time');

        var h = Math.floor(time / 3600),
            m = Math.floor((time / 60) % 60),
            s = time % 60;

        this.set('hour', h);
        this.set('minute', m);
        this.set('second', s);
    }.observes('controller.time')
});
App.ClockView = Ember.View.extend({

});
App.ClockController = Ember.ObjectController.extend({
    time: 0,
    running: false,
    stop: function(){
        //console.log('stopping timer');
        this.set('running', false);
    },
    start: function(){
        var that = this;
        var run = function(){
           setTimeout(function(){
               var running = that.get('running');
               if(running){
                   that.incrementProperty('time');
                   run();
               }
           }, 1000);
        };
        //console.log('starting timer');
        that.set('running', true);
        run();
    }
});

App.CompassView = Ember.View.extend({
    templateName: 'compass',
    willDestroyElement: function(){
        this.get('controller').send('unbindCompass');
    },
    willInsertElement: function(){
        this.get('controller').send('bindCompass');
    },
    updateRotation: function(){
        if(this.get('elementIsInserted')){
            var degrees = this.get('controller.degrees');
            this.$().css({
                'transform':'rotate(' + degrees + 'deg)'
            });
        }
    }.observes('controller.degrees')
});
App.CompassController = Ember.ObjectController.extend({
    degrees: 0,
    watchId: 0,
    unbindCompass: function(){
        var watchId = this.get('watchId');
        navigator.compass.clearWatch(watchId);
    },
    bindCompass: function(){
        var that = this;
        var compassSuccess = function(heading){
                //console.log('heading ' + heading.magneticHeading);
                that.set('degrees', heading.magneticHeading);
            },
            compassError = function(err){
                //console.log('compass error: ' + err.code);
            };

        var cfg = {
            frequency: 1000
        }

        var watchId = navigator.compass.watchHeading(compassSuccess, compassError, cfg);
        this.set('watchId', watchId);
    }
});

App.EventsView = Ember.View.extend({
    templateName: 'events',
    willDestroyElement: function(){
        this.get('controller').send('unbindVolumeEvents');
    },
    willInsertElement: function(){
        this.get('controller').send('bindVolumeEvents');
    }
});
App.EventsController = Ember.ObjectController.extend({
    volume: 0,
    online: false,
    bindVolumeEvents: function(){
        var that = this;
        //console.log('bindVolumeEvents');

        var decreaseVolume = function(){
            //console.log('decrement volume');
            that.decrementProperty('volume');
        };
        var increaseVolume = function(){
            //console.log('increment volume');
            that.incrementProperty('volume');
        };
        var onOnline = function(){
            that.set('online', true);
        };
        var onOffline = function(){
            that.set('online', true);
        };

        this.incrementProperty('volume');
        document.addEventListener('volumedownbutton', decreaseVolume, false);
        document.addEventListener('volumeupbutton', increaseVolume, false);
        document.addEventListener("online", onOnline, false);
        document.addEventListener("online", onOffline, false);
    },
    unbindVolumeEvents: function(){
        //console.log('unbindVolumeEvents');
        //document.removeEventListener('volumedownbutton');
        //document.removeEventListener('volumeupbutton');

    }
});

App.NotifyController = Ember.ObjectController.extend({
   fireNotification : function(){
       navigator.notification.vibrate(1000);
       navigator.notification.alert("WASD", function(){
           //console.log('alert callback');
       });
   }
});


App.AccelView = Ember.View.extend({
    templateName: 'accel',
    willDestroyElement: function(){
        this.get('controller').send('unbindAccel');
    },
    willInsertElement: function(){
        this.get('controller').send('bindAccel');
    }
});
App.AccelController = Ember.ObjectController.extend({
    watchId: '',
    accel: {x:'0',y:'0',z:'0',timestamp:''},
    bindAccel: function(){
        var that = this;

        var onSuccess = function (acceleration) {
            that.set('accel', acceleration);
        };
        var onError = function(){
            alert('onError!');
        };
        var options = { frequency: 1000 };  // Update every 3 seconds
        var watchID = navigator.accelerometer.watchAcceleration(onSuccess, onError, options);
        this.set('watchId', watchID);
    },
    unbindAccel: function(){
        var watchId = this.get('watchId');
        navigator.accelerometer.clearWatch(watchId);
    }
});

Ember.Handlebars.registerBoundHelper('round', function(val){
    val = '' + val;
    return val.substring(0,3);

});

/*
App.UploadFileView = Ember.TextField.extend({
    type: 'file',
    attributeBindings: ['name'],
    change: function(evt) {
        var self = this;
        var input = evt.target;
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            var that = this;
            reader.onload = function(e) {
                var fileToUpload = e.srcElement.result;
                self.get('controller').set(self.get('name'), fileToUpload);
            }
            reader.readAsDataURL(input.files[0]);
        }
    }
});   */